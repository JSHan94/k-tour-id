// zkLogin server helpers (HK-07). Google OAuth id_token → salt → address → ZK proof.
// - salt: HKDF-style derivation from a server master seed over (iss, aud, sub);
//   the same user always gets the same address for this app. (Documented option;
//   Enoki is not used to keep the dependency set to @mysten/sui only.)
// - prover: Mysten dev prover for Devnet/Testnet (no registration). Mainnet needs Enoki.
// The browser keeps the ephemeral private key; the server never sees it. The JWT
// is used once here and not stored.
import { createHmac } from "node:crypto"
import { decodeJwt, genAddressSeed, jwtToAddress } from "@mysten/sui/zklogin"
import { hkConfig } from "../config"
import { HkError } from "../util"

export function zkLoginConfigured() {
  const c = hkConfig().sui
  return Boolean(c.googleClientId && c.zkSaltSeed)
}

export function deriveSalt(jwt: string): bigint {
  const c = hkConfig().sui
  if (!c.zkSaltSeed) throw new HkError("zklogin_unconfigured", "HK_ZKLOGIN_SALT_SEED missing", 503)
  const d = decodeJwt(jwt)
  const mac = createHmac("sha256", c.zkSaltSeed).update(`${d.iss}|${d.aud}|${d.sub}`).digest()
  // salt must be < 2^128 for zkLogin
  return BigInt("0x" + mac.subarray(0, 16).toString("hex"))
}

export type ZkProofInputs = {
  proofPoints: { a: string[]; b: string[][]; c: string[] }
  issBase64Details: { value: string; indexMod4: number }
  headerBase64: string
  addressSeed: string
}

export async function proveZkLogin(opts: { jwt: string; extendedEphemeralPublicKey: string; maxEpoch: number; jwtRandomness: string }): Promise<{ address: string; salt: string; inputs: ZkProofInputs; sub: string; aud: string }> {
  const c = hkConfig().sui
  const decoded = decodeJwt(opts.jwt)
  if (!decoded.sub || !decoded.aud || !decoded.iss) throw new HkError("zklogin_jwt", "jwt missing claims", 400)
  const aud = Array.isArray(decoded.aud) ? decoded.aud[0] : decoded.aud
  if (c.googleClientId && aud !== c.googleClientId) throw new HkError("zklogin_aud", "jwt audience mismatch", 400)
  if (decoded.iss !== "https://accounts.google.com" && decoded.iss !== "accounts.google.com") throw new HkError("zklogin_iss", "unsupported issuer", 400)
  if (typeof decoded.exp === "number" && decoded.exp * 1000 < Date.now()) throw new HkError("zklogin_exp", "jwt expired", 400)
  const salt = deriveSalt(opts.jwt)
  const address = jwtToAddress(opts.jwt, salt, false)
  const res = await fetch(c.zkProverUrl, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ jwt: opts.jwt, extendedEphemeralPublicKey: opts.extendedEphemeralPublicKey, maxEpoch: opts.maxEpoch, jwtRandomness: opts.jwtRandomness, salt: salt.toString(), keyClaimName: "sub" }),
    signal: AbortSignal.timeout(60_000),
  })
  if (!res.ok) throw new HkError("zklogin_prover", `prover ${res.status}: ${(await res.text()).slice(0, 200)}`, 502, true)
  const proof = (await res.json()) as Omit<ZkProofInputs, "addressSeed">
  const addressSeed = genAddressSeed(salt, "sub", decoded.sub, aud).toString()
  return { address, salt: salt.toString(), inputs: { ...proof, addressSeed }, sub: decoded.sub, aud }
}
