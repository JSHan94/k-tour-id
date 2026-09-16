// OmniOne CX adapter — Mobile ID verification (필수과제).
//
// mode "cx"  : real OmniOne CX VC-Verifier REST flow (manual v1.0, 2024-07-09):
//              POST /oacx/api/v1.0/trans            -> { token, txId }
//              POST /oacx/api/v1.0/authen/qr/request -> { qrBase64, cxId }   (PC/QR)
//              POST /oacx/api/v1.0/authen/app/request-> { androidLink, iosLink, ssPayLink } (mobile handoff)
//              POST /oacx/api/v1.0/authen/qr|app/result -> { verified, ... }
//              POST /oacx/api/v1.0/trans/token       -> claims (with zkpType AdultVerify: adult flag only)
//              Tokens are step-bound: the server re-validates the call order, so
//              we keep token/txId server-side and never accept a client "success".
// mode "mock": deterministic sample (labelled SIMULATION in the UI). The mock
//              still produces a server-side IdentityEvidence with a stable
//              subjectRef derived from a server secret so uniqueness rules can
//              be exercised; it never claims to be a government result.
import { hkConfig, HK_TTL } from "../config"
import { hmacHex, nowIso, plusMs, randomId, HkError } from "../util"
import type { IdentityEvidence, IdentityHandoff } from "../types"

export type CxStart = { handoff: IdentityHandoff; token?: string; txId?: string }
export type CxResult = { evidence: IdentityEvidence; raw?: Record<string, unknown> }

async function cxPost(path: string, body: Record<string, unknown>) {
  const c = hkConfig().cx
  const res = await fetch(`${c.baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(c.apiKey ? { "x-api-key": c.apiKey } : {}) },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  })
  const text = await res.text()
  let json: Record<string, unknown> = {}
  try { json = JSON.parse(text) } catch { /* keep raw */ }
  if (!res.ok) throw new HkError("cx_http", `CX ${path} ${res.status}: ${text.slice(0, 200)}`, 502, true)
  const code = Number(json.code ?? json.resultCode ?? 200)
  if (code && code !== 200) throw new HkError("cx_error", `CX ${path} code ${code}: ${String(json.message ?? "")}`, 502, code >= 500)
  return json
}

export async function cxStart(opts: { operationId: string; mobile: boolean }): Promise<CxStart> {
  const c = hkConfig().cx
  const expiresAt = plusMs(HK_TTL.identityHandoffMs)
  if (c.mode === "mock") {
    return { handoff: { kind: "mock", label: "SIMULATION · Mobile ID sample", expiresAt } }
  }
  const trans = await cxPost("/oacx/api/v1.0/trans", { serviceType: "MID", provider: `${c.provider}_v1.5`, contentInfo: { signType: "ENT_MID" }, extraParams: { zkpType: c.zkpType }, compareCI: false, reference: opts.operationId })
  const token = String(trans.token ?? ""), txId = String(trans.txId ?? "")
  if (!token || !txId) throw new HkError("cx_token", "CX trans did not return token/txId", 502, true)
  if (opts.mobile) {
    const app = await cxPost("/oacx/api/v1.0/authen/app/request", { token, txId, provider: `${c.provider}_v1.5`, contentInfo: { signType: "ENT_MID" }, extraParams: { zkpType: c.zkpType }, mode: "direct" })
    return { token: String(app.token ?? token), txId, handoff: { kind: "app", androidLink: app.androidLink as string | undefined, iosLink: app.iosLink as string | undefined, ssPayLink: app.ssPayLink as string | undefined, cxId: String(app.cxId ?? ""), expiresAt } }
  }
  const qr = await cxPost("/oacx/api/v1.0/authen/qr/request", { token, txId, provider: `${c.provider}_v1.5`, contentInfo: { signType: "ENT_MID" }, extraParams: { zkpType: c.zkpType } })
  return { token: String(qr.token ?? token), txId, handoff: { kind: "qr", qrBase64: String(qr.qrBase64 ?? ""), cxId: String(qr.cxId ?? ""), expiresAt } }
}

/** Server-side result verification. `sample` is only honoured in mock mode. */
export async function cxComplete(opts: {
  operationId: string; token?: string; txId?: string; mobile: boolean
  sample?: { outcome: "verified" | "cancelled" | "failed" | "expired"; subjectSeed: string }
}): Promise<CxResult | { pending: true } | { failed: "cancelled" | "failed" | "expired" }> {
  const c = hkConfig().cx
  if (c.mode === "mock") {
    const s = opts.sample ?? { outcome: "verified", subjectSeed: "sample-person-1" }
    if (s.outcome !== "verified") return { failed: s.outcome }
    // subjectRef: keyed HMAC of a sample subject seed. In cx mode this comes
    // from provider correlation (ci/txid), never from name/DOB hashing.
    const subjectRef = "subj_" + hmacHex(hkConfig().opendid.signingSeed, `mock-subject:${s.subjectSeed}`).slice(2, 34)
    return { evidence: {
      evidenceId: randomId("evd"), subjectRef, source: "cx_mobile_id", mode: "mock", provider: c.provider,
      personVerified: true, adultVerified: true, verifiedAt: nowIso(), expiresAt: plusMs(HK_TTL.evidenceMs),
      providerTransactionRef: `sample-cx-${opts.operationId.slice(-8)}`,
    } }
  }
  if (!opts.token || !opts.txId) throw new HkError("cx_state", "missing CX token", 409)
  const result = await cxPost(opts.mobile ? "/oacx/api/v1.0/authen/app/result" : "/oacx/api/v1.0/authen/qr/result", { token: opts.token, txId: opts.txId })
  const status = String(result.status ?? "")
  if (status && status !== "AFTER_RESULT") return { pending: true }
  const code = Number(result.code ?? 200)
  if (code === 406) return { failed: "cancelled" }
  if (!result.verified) return { failed: "failed" }
  const claims = await cxPost("/oacx/api/v1.0/trans/token", { token: String(result.token ?? opts.token), txId: opts.txId })
  const ci = typeof claims.ci === "string" ? claims.ci : ""
  const txid = String(claims.txid ?? opts.txId)
  // Same-person linkage: CI when provided by the provider, else provider txid+cxid (documented D1 blocker for coresidence).
  const subjectRef = "subj_" + hmacHex(hkConfig().opendid.signingSeed, ci ? `cx-ci:${ci}` : `cx-tx:${txid}:${String(claims.cxid ?? "")}`).slice(2, 34)
  const adult = claims.adult ?? claims.adultYn ?? claims.isAdult
  return { evidence: {
    evidenceId: randomId("evd"), subjectRef, source: "cx_mobile_id", mode: "cx", provider: String(claims.provider ?? c.provider),
    personVerified: true, adultVerified: adult === undefined ? null : Boolean(adult === true || adult === "Y" || adult === "true"),
    verifiedAt: nowIso(), expiresAt: plusMs(HK_TTL.evidenceMs), providerTransactionRef: txid,
  }, raw: { provider: claims.provider, signType: claims.signType, issuanceDate: claims.issuanceDate, expirationDate: claims.expirationDate } }
}
