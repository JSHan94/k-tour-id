import { createHmac } from "node:crypto"
import { readFileSync } from "node:fs"
import { expect, test } from "@playwright/test"
import {
  assertSandboxRequest, createSession, matchesAccessCode, NO_STORE_HEADERS,
  normalizeReview, readSandboxConfig, readSessionBody, readVerifiedSandboxStatus,
  SandboxError, sealSession, SESSION_TTL_MS, signSumsubRequest, sumsubRequest,
  unsealSession, type SandboxSession,
} from "../../lib/kyc/sumsub-sandbox"

// Deliberately fake test values. Do not read process.env or contact Sumsub here.
const ORIGIN = "https://sandbox-preview.example.test"
const ENV = {
  SUMSUB_MODE: "sandbox", NEXT_PUBLIC_ONDO_SUMSUB_SANDBOX: "1", VERCEL_ENV: "preview",
  SUMSUB_APP_TOKEN: "sbx:unit-test-not-a-real-token",
  SUMSUB_SECRET_KEY: "unit-test-not-a-real-provider-secret",
  SUMSUB_SESSION_SECRET: "unit-test-session-secret-32-characters-minimum",
  SUMSUB_PREVIEW_ACCESS_CODE: "unit-test-access-code-not-real",
  SUMSUB_LEVEL_NAME: "id-and-liveness", SUMSUB_ALLOWED_ORIGINS: ORIGIN,
}
const CONFIG = readSandboxConfig(ENV)!
const NOW = 1_000_000
const session = () => createSession(CONFIG, ORIGIN, NOW)
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } })
const responseFetcher = (response: () => Response) => (async () => response()) as typeof fetch

function request(method = "POST", options: { url?: string; origin?: string | null; marker?: string | null; site?: string; contentType?: string | null; body?: string } = {}) {
  const headers = new Headers()
  if (options.origin !== null) headers.set("Origin", options.origin ?? ORIGIN)
  if (options.marker !== null) headers.set("X-KTour-KYC", options.marker ?? "1")
  if (options.site) headers.set("Sec-Fetch-Site", options.site)
  if (method === "POST" && options.contentType !== null) headers.set("Content-Type", options.contentType ?? "application/json")
  return new Request(options.url ?? `${ORIGIN}/api/kyc/sumsub/session`, { method, headers, ...(method === "POST" ? { body: options.body ?? '{"consent":true}' } : {}) })
}

test("SUMSUB-001 configuration is opt-in, sandbox-key-only and forbidden on production deployments", () => {
  expect(CONFIG).toMatchObject({ appToken: ENV.SUMSUB_APP_TOKEN, levelName: "id-and-liveness", origins: [ORIGIN] })
  for (const patch of [
    { SUMSUB_MODE: undefined }, { SUMSUB_MODE: "production" },
    { NEXT_PUBLIC_ONDO_SUMSUB_SANDBOX: "0" }, { VERCEL_ENV: "production" },
    { SUMSUB_APP_TOKEN: "production-unit-test-token" }, { SUMSUB_SECRET_KEY: undefined },
    { SUMSUB_SESSION_SECRET: "short" }, { SUMSUB_PREVIEW_ACCESS_CODE: "short" },
    { SUMSUB_LEVEL_NAME: "../another-level" }, { SUMSUB_ALLOWED_ORIGINS: "" },
  ]) expect(readSandboxConfig({ ...ENV, ...patch })).toBeNull()
})

test("SUMSUB-002 configured origins are exact and localhost is development-only", () => {
  for (const origin of ["*", "https://*.example.test", "https://preview.example.test/path", "javascript:alert(1)", "http://untrusted.example.test", "https://user:pass@example.test"]) {
    expect(readSandboxConfig({ ...ENV, SUMSUB_ALLOWED_ORIGINS: origin })).toBeNull()
  }
  expect(readSandboxConfig({ ...ENV, NODE_ENV: "production", SUMSUB_ALLOWED_ORIGINS: "http://localhost:3438" })).toBeNull()
  expect(readSandboxConfig({ ...ENV, NODE_ENV: "development", SUMSUB_ALLOWED_ORIGINS: "http://localhost:3438" })?.origins).toEqual(["http://localhost:3438"])
  expect(readSandboxConfig({ ...ENV, SUMSUB_ALLOWED_ORIGINS: "", VERCEL_URL: "unit-test-preview.vercel.app" })?.origins).toEqual(["https://unit-test-preview.vercel.app"])
  expect(readSandboxConfig({ ...ENV, SUMSUB_ALLOWED_ORIGINS: "", VERCEL_URL: "evil.example.test" })).toBeNull()
})

test("SUMSUB-003 encrypted sessions use random server applicant identifiers and independent ciphertexts", () => {
  const first = session()
  const second = session()
  expect(first.externalUserId).toMatch(/^ktour-sbx-[0-9a-f-]{36}$/)
  expect(second.externalUserId).not.toBe(first.externalUserId)
  expect(first.expiresAt - first.issuedAt).toBe(SESSION_TTL_MS)
  const sealed = sealSession(first, CONFIG.sessionSecret)
  expect(sealSession(first, CONFIG.sessionSecret)).not.toBe(sealed)
  expect(sealed).not.toContain(first.externalUserId)
  expect(Buffer.from(sealed, "base64url").toString("utf8")).not.toContain(first.externalUserId)
  expect(unsealSession(sealed, CONFIG, ORIGIN, NOW + 1)).toEqual(first)
})

test("SUMSUB-004 cookie tampering, wrong audience/key/level and expiration cannot restore approval", () => {
  const current = session()
  const sealed = sealSession(current, CONFIG.sessionSecret)
  const bytes = Buffer.from(sealed, "base64url")
  bytes[bytes.length - 1] ^= 1
  for (const value of [undefined, "", "%%%", "a".repeat(2049), "abc", bytes.toString("base64url")]) {
    expect(unsealSession(value, CONFIG, ORIGIN, NOW + 1)).toBeNull()
  }
  expect(unsealSession(sealed, { ...CONFIG, sessionSecret: "different-unit-test-session-secret" }, ORIGIN, NOW + 1)).toBeNull()
  expect(unsealSession(sealed, { ...CONFIG, levelName: "another-level" }, ORIGIN, NOW + 1)).toBeNull()
  expect(unsealSession(sealed, CONFIG, "https://another.example.test", NOW + 1)).toBeNull()
  for (const now of [NOW - 1, current.expiresAt, current.expiresAt + 1, Number.NaN]) {
    expect(unsealSession(sealed, CONFIG, ORIGIN, now)).toBeNull()
  }
})

test("SUMSUB-005 even authenticated malformed session payloads remain invalid", () => {
  const current = session()
  for (const patch of [
    { version: 2 }, { environment: "production" }, { externalUserId: "browser-chosen-user" },
    { issuedAt: NOW + 0.5 }, { expiresAt: current.expiresAt + 1 },
  ]) {
    const malformed = { ...current, ...patch } as SandboxSession
    expect(unsealSession(sealSession(malformed, CONFIG.sessionSecret), CONFIG, ORIGIN, NOW + 1)).toBeNull()
  }
})

test("SUMSUB-006 the preview code accepts only an exact bounded string", () => {
  expect(matchesAccessCode(CONFIG.accessCode, CONFIG.accessCode)).toBe(true)
  for (const value of [undefined, null, true, {}, [], "", "wrong", `${CONFIG.accessCode} `, "x".repeat(257)]) {
    expect(matchesAccessCode(value, CONFIG.accessCode)).toBe(false)
  }
})

test("SUMSUB-007 origin and explicit-header checks protect GET, POST and DELETE", () => {
  for (const method of ["GET", "POST", "DELETE"]) {
    expect(assertSandboxRequest(request(method, { site: "same-origin" }), CONFIG, method !== "GET")).toBe(ORIGIN)
    for (const bad of [
      { marker: null }, { marker: "yes" }, { origin: "https://attacker.example.test" },
      { site: "cross-site" }, { site: "same-site" }, { url: "https://attacker.example.test/api/kyc/sumsub/session" },
    ]) expect(() => assertSandboxRequest(request(method, bad), CONFIG, method !== "GET")).toThrow("request_not_allowed")
    if (method !== "GET") expect(() => assertSandboxRequest(request(method, { origin: null }), CONFIG, true)).toThrow("request_not_allowed")
  }
  expect(assertSandboxRequest(request("GET", { origin: null }), CONFIG, false)).toBe(ORIGIN)
})

test("SUMSUB-008 mutation requests require JSON and explicit consent without applicant injection", async () => {
  for (const contentType of [null, "text/plain", "application/x-www-form-urlencoded"]) {
    expect(() => assertSandboxRequest(request("POST", { contentType }), CONFIG, true)).toThrow("invalid_request")
  }
  expect(assertSandboxRequest(request("POST", { contentType: "application/json; charset=utf-8" }), CONFIG, true)).toBe(ORIGIN)
  await expect(readSessionBody(request("POST", { body: JSON.stringify({ consent: true, locale: "ko", accessCode: "fake-code" }) }))).resolves.toEqual({ consent: true, locale: "ko", accessCode: "fake-code" })
  for (const field of ["applicantId", "externalUserId", "userId", "levelName", "reviewAnswer", "approved", "credential"]) {
    await expect(readSessionBody(request("POST", { body: JSON.stringify({ consent: true, [field]: "forged" }) }))).rejects.toMatchObject({ code: "invalid_request", status: 400 })
  }
  for (const body of ['{}', '{"consent":false}', '{"consent":"true"}', '{"consent":true,"locale":"fr"}', '[]', 'null', '{']) {
    await expect(readSessionBody(request("POST", { body }))).rejects.toMatchObject({ code: "invalid_request", status: 400 })
  }
})

test("SUMSUB-009 the streamed request body cap works without Content-Length", async () => {
  const oversized = request("POST", { body: JSON.stringify({ consent: true, accessCode: "x".repeat(1100) }) })
  expect(oversized.headers.has("Content-Length")).toBe(false)
  await expect(readSessionBody(oversized)).rejects.toMatchObject({ code: "invalid_request", status: 413 })
  await expect(readSessionBody(new Request(`${ORIGIN}/api/kyc/sumsub/session`))).rejects.toMatchObject({ code: "invalid_request", status: 400 })
})

test("SUMSUB-010 signing binds the exact timestamp, uppercase method, path and serialized body", () => {
  const timestamp = "1789398000"
  const path = "/resources/accessTokens/sdk"
  const body = '{"userId":"unit-test-user","levelName":"id-and-liveness"}'
  const signature = signSumsubRequest("unit-test-secret", timestamp, "post", path, body)
  const expected = createHmac("sha256", "unit-test-secret").update(`${timestamp}POST${path}${body}`).digest("hex")
  expect(signature).toBe(expected)
  expect(signature).toMatch(/^[0-9a-f]{64}$/)
  expect(signSumsubRequest("unit-test-secret", timestamp, "GET", path, body)).not.toBe(signature)
  expect(signSumsubRequest("unit-test-secret", timestamp, "POST", `${path}?different=1`, body)).not.toBe(signature)
  expect(signSumsubRequest("unit-test-secret", timestamp, "POST", path, `${body} `)).not.toBe(signature)
})

test("SUMSUB-011 upstream calls have a fixed origin, no redirects/cache and correctly signed body", async () => {
  let observed: { url: string; init: RequestInit } | null = null
  const fetcher = (async (url, init) => { observed = { url: String(url), init: init! }; return json({ token: "unit-test-sdk-token" }) }) as typeof fetch
  const body = { userId: "unit-test-user", levelName: CONFIG.levelName }
  await expect(sumsubRequest(CONFIG, "/resources/accessTokens/sdk", "POST", body, fetcher)).resolves.toEqual({ token: "unit-test-sdk-token" })
  const call = observed! as { url: string; init: RequestInit }
  expect(call.url).toBe("https://api.sumsub.com/resources/accessTokens/sdk")
  expect(call.init).toMatchObject({ method: "POST", cache: "no-store", redirect: "error", body: JSON.stringify(body) })
  expect(call.init.signal).toBeInstanceOf(AbortSignal)
  const headers = new Headers(call.init.headers)
  expect(headers.get("X-App-Token")).toBe(CONFIG.appToken)
  expect(headers.get("Content-Type")).toBe("application/json")
  expect(headers.get("X-App-Access-Sig")).toBe(signSumsubRequest(CONFIG.secretKey, headers.get("X-App-Access-Ts")!, "POST", "/resources/accessTokens/sdk", JSON.stringify(body)))
  for (const path of ["https://attacker.example.test", "/another/path", "/resources/x\r\nHost:evil", "/resources/x#fragment"]) {
    await expect(sumsubRequest(CONFIG, path, "GET", undefined, fetcher)).rejects.toMatchObject({ code: "invalid_provider_path" })
  }
})

test("SUMSUB-012 transport, upstream errors and malformed JSON expose only sanitized errors", async () => {
  const cases: Array<[typeof fetch, string, number]> = [
    [(async () => { throw new Error("private provider error not for the browser") }) as typeof fetch, "provider_unavailable", 503],
    [responseFetcher(() => json({ privateComment: "do not return" }, 401)), "provider_unavailable", 503],
    [responseFetcher(() => json({ privateComment: "do not return" }, 404)), "applicant_not_found", 404],
    [responseFetcher(() => new Response("not json")), "invalid_provider_response", 503],
    [responseFetcher(() => json([])), "invalid_provider_response", 503],
    [responseFetcher(() => json(null)), "invalid_provider_response", 503],
  ]
  for (const [fetcher, code, status] of cases) {
    await expect(sumsubRequest(CONFIG, "/resources/test", "GET", undefined, fetcher)).rejects.toMatchObject({ code, status, message: code })
  }
})

test("SUMSUB-013 only completed GREEN can approve, and RED retry is not final rejection", () => {
  expect(normalizeReview({ reviewStatus: "completed", reviewResult: { reviewAnswer: "GREEN" } })).toBe("approved")
  expect(normalizeReview({ reviewStatus: "completed", reviewResult: { reviewAnswer: "RED", reviewRejectType: "RETRY" } })).toBe("retry")
  expect(normalizeReview({ reviewStatus: "completed", reviewResult: { reviewAnswer: "RED", reviewRejectType: "FINAL" } })).toBe("rejected")
  for (const reviewStatus of ["pending", "queued", "onHold", "awaitingService"]) expect(normalizeReview({ reviewStatus, reviewResult: { reviewAnswer: "GREEN" } })).toBe("pending")
  for (const reviewStatus of ["init", "awaitingUser"]) expect(normalizeReview({ reviewStatus, reviewResult: { reviewAnswer: "GREEN" } })).toBe("in_progress")
  for (const value of [{}, { reviewStatus: "completed" }, { reviewStatus: "completed", reviewResult: { reviewAnswer: "YELLOW" } }, { reviewStatus: "completed", reviewResult: { reviewAnswer: "RED" } }, { reviewStatus: "unexpected", reviewResult: { reviewAnswer: "GREEN" } }]) {
    expect(normalizeReview(value)).toBe("unavailable")
  }
})

function applicantData(current: SandboxSession) {
  return { id: "unit-test-applicant", externalUserId: current.externalUserId, sandboxMode: true, review: { levelName: current.levelName }, info: { firstName: "TEST_ONLY_DO_NOT_EXPOSE" } }
}

test("SUMSUB-014 status lookup checks the bound sandbox applicant before reading its result", async () => {
  const current = session()
  const calls: string[] = []
  const fetcher = (async (url) => {
    calls.push(String(url))
    return calls.length === 1 ? json(applicantData(current)) : json({ levelName: current.levelName, reviewStatus: "completed", reviewResult: { reviewAnswer: "GREEN", clientComment: "PRIVATE_TEST_COMMENT" } })
  }) as typeof fetch
  const result = await readVerifiedSandboxStatus(CONFIG, current, fetcher)
  expect(result).toBe("approved")
  expect(calls).toEqual([
    `https://api.sumsub.com/resources/applicants/-;externalUserId=${encodeURIComponent(current.externalUserId)}/one`,
    "https://api.sumsub.com/resources/applicants/unit-test-applicant/status",
  ])
  expect(JSON.stringify(result)).not.toMatch(/TEST_ONLY|PRIVATE_TEST|firstName|clientComment|applicantId|externalUserId/)
})

test("SUMSUB-015 mismatched applicant or production mode fails before a second upstream request", async () => {
  const current = session()
  for (const patch of [{ externalUserId: "another-user" }, { sandboxMode: false }, { sandboxMode: null }, { id: "../../another-applicant" }, { id: null }]) {
    let calls = 0
    const fetcher = (async () => { calls += 1; return json({ ...applicantData(current), ...patch }) }) as typeof fetch
    await expect(readVerifiedSandboxStatus(CONFIG, current, fetcher)).rejects.toMatchObject({ code: "provider_binding_mismatch" })
    expect(calls).toBe(1)
  }
})

test("SUMSUB-015A API-omitted sandboxMode is accepted only with sandbox credentials and the same level", async () => {
  const current = session()
  for (const levelName of [current.levelName, "weaker-level", undefined]) {
    let calls = 0
    const fetcher = (async () => {
      calls += 1
      return calls === 1 ? json({ ...applicantData(current), sandboxMode: undefined }) : json({ levelName, reviewStatus: "completed", reviewResult: { reviewAnswer: "GREEN" } })
    }) as typeof fetch
    if (levelName === current.levelName) await expect(readVerifiedSandboxStatus(CONFIG, current, fetcher)).resolves.toBe("approved")
    else await expect(readVerifiedSandboxStatus(CONFIG, current, fetcher)).rejects.toMatchObject({ code: "provider_binding_mismatch" })
  }
  let calls = 0
  const fetcher = (async () => { calls += 1; return json({}) }) as typeof fetch
  await expect(readVerifiedSandboxStatus({ ...CONFIG, appToken: "not-a-sandbox-test-token" }, current, fetcher)).rejects.toBeInstanceOf(SandboxError)
  expect(calls).toBe(0)
})

test("SUMSUB-016 applicant absence is unfinished, while provider failure never becomes approval", async () => {
  await expect(readVerifiedSandboxStatus(CONFIG, session(), responseFetcher(() => json({}, 404)))).resolves.toBe("in_progress")
  await expect(readVerifiedSandboxStatus(CONFIG, session(), responseFetcher(() => json({}, 500)))).rejects.toBeInstanceOf(SandboxError)
  expect(NO_STORE_HEADERS["Cache-Control"]).toContain("no-store")
  expect(NO_STORE_HEADERS.Vary).toContain("Cookie")
})

test("SUMSUB-017 routes keep session refresh bound and do not accept client-selected applicant state", () => {
  const token = readFileSync("app/api/kyc/sumsub/session/route.ts", "utf8")
  const status = readFileSync("app/api/kyc/sumsub/status/route.ts", "utf8")
  for (const source of [token, status]) {
    expect(source).toContain('runtime = "nodejs"')
    expect(source).toContain('dynamic = "force-dynamic"')
    expect(source).toContain("NO_STORE_HEADERS")
    expect(source).not.toMatch(/console\.(log|warn|error)|searchParams\.get/)
  }
  expect(token).toContain("unsealSession(request.cookies.get(SESSION_COOKIE)?.value")
  expect(token).toContain("if (!session)")
  expect(token).toContain("matchesAccessCode(body.accessCode, config.accessCode)")
  expect(token).toContain("userId: session.externalUserId")
  expect(token).toContain("httpOnly: true")
  expect(token).toContain('sameSite: "lax"')
  expect(status).toContain("readVerifiedSandboxStatus(config, session)")
  expect(status).not.toContain("request.json()")
})

test("SUMSUB-018 the client SDK cannot issue a pass or persist credentials and only triggers server queries", () => {
  const source = readFileSync("features/ondo/identity-b/sumsub-passport-step-b.tsx", "utf8")
  expect(source).toContain('import("@sumsub/websdk")')
  expect(source).toContain('data-environment="sandbox"')
  expect(source).toContain('data-pass-issued="false"')
  expect(source).toContain("refreshStatus()")
  expect(source).toContain("destroySdk")
  expect(source).toContain("controllers.current")
  for (const forbidden of ["@/lib/kyc/sumsub-sandbox", "SUMSUB_SECRET_KEY", "SUMSUB_APP_TOKEN", "SUMSUB_SESSION_SECRET", "localStorage.setItem", "sessionStorage.setItem", "completeIdentitySetup(", "createSimulatedCredentialB(", "applySampleCheckpoint(", "NDEFReader", "onApproved(", "onVerified("]) {
    expect(source, forbidden).not.toContain(forbidden)
  }
})
