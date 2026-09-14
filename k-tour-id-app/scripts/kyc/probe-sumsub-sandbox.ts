// Explicit operator-only live smoke test. No real documents or personal data.
// Usage: node --env-file=.env.local --import tsx scripts/kyc/probe-sumsub-sandbox.ts http://localhost:3094 --simulate-results
// The optional flag changes ONLY the fresh, server-bound Sandbox applicant
// created by this run, using Sumsub's official testCompleted endpoint.
import assert from "node:assert/strict"
import { readSandboxConfig, SandboxError, SESSION_COOKIE, sumsubRequest, unsealSession } from "../../lib/kyc/sumsub-sandbox"

const origin = new URL(process.argv[2] ?? "http://localhost:3094").origin
const config = readSandboxConfig()
if (!config || !config.origins.includes(origin)) throw new Error("Configure a permitted Sandbox origin first")
let cookie = ""
async function call(path: string, method = "GET", body?: unknown, customHeaders: Record<string, string> = {}) {
  const response = await fetch(`${origin}/api/kyc/sumsub/${path}`, { method, headers: { "X-KTour-KYC": "1", Origin: origin, ...(body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}), ...customHeaders }, ...(body ? { body: JSON.stringify(body) } : {}) })
  const value = response.status === 204 ? null : await response.json()
  const setCookie = response.headers.get("set-cookie")
  if (setCookie) cookie = setCookie.split(";", 1)[0]
  return { response, value }
}

assert.equal((await call("status")).value.status, "access_required")
assert.equal((await call("session", "POST", { consent: true })).response.status, 401)
assert.equal((await call("session", "POST", { consent: true }, { Origin: "https://untrusted.example" })).response.status, 403)
const started = await call("session", "POST", { consent: true, accessCode: config.accessCode, locale: "en" })
assert.equal(started.response.status, 200, "SDK token request failed (provider response not printed)")
assert.equal(typeof started.value.accessToken, "string")
assert.ok(started.response.headers.get("cache-control")?.includes("no-store"))
assert.ok(started.response.headers.get("set-cookie")?.includes("HttpOnly"))
const session = unsealSession(cookie.slice(`${SESSION_COOKIE}=`.length), config, origin)
assert.ok(session)
const refreshed = await call("session", "POST", { consent: true, locale: "en" })
assert.equal(refreshed.response.status, 200)
const resumed = unsealSession(cookie.slice(`${SESSION_COOKIE}=`.length), config, origin)
assert.equal(resumed?.externalUserId, session.externalUserId)
assert.equal(resumed?.expiresAt, session.expiresAt)
console.log("PASS: Sandbox access gate, CSRF, SDK token issuance, HttpOnly binding and token refresh")

if (process.argv.includes("--simulate-results")) {
  let applicant: Record<string, unknown>
  const path = `/resources/applicants/-;externalUserId=${encodeURIComponent(session.externalUserId)}/one`
  try { applicant = await sumsubRequest(config, path) }
  catch (error) {
    if (!(error instanceof SandboxError) || error.code !== "applicant_not_found") throw error
    applicant = await sumsubRequest(config, `/resources/applicants?levelName=${encodeURIComponent(session.levelName)}`, "POST", { externalUserId: session.externalUserId })
  }
  assert.ok(config.appToken.startsWith("sbx:"))
  assert.ok(applicant.sandboxMode === undefined || applicant.sandboxMode === true)
  assert.equal(applicant.externalUserId, session.externalUserId)
  assert.match(String(applicant.id), /^[a-zA-Z0-9_-]{1,100}$/)
  for (const scenario of [
    { expected: "approved", payload: { reviewAnswer: "GREEN", rejectLabels: [] } },
    { expected: "retry", payload: { reviewAnswer: "RED", reviewRejectType: "RETRY", rejectLabels: ["UNSATISFACTORY_PHOTOS"] } },
    { expected: "rejected", payload: { reviewAnswer: "RED", reviewRejectType: "FINAL", rejectLabels: ["FORGERY"] } },
  ]) {
    await sumsubRequest(config, `/resources/applicants/${encodeURIComponent(String(applicant.id))}/status/testCompleted`, "POST", scenario.payload)
    let status = ""
    for (let attempt = 0; attempt < 5; attempt++) {
      status = (await call("status")).value.status
      if (status === scenario.expected) break
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
    assert.equal(status, scenario.expected, `Sandbox ${scenario.expected} normalization`)
    console.log(`PASS: signed upstream Sandbox test result → ${scenario.expected}`)
  }
  console.log("NOTE: one synthetic Sandbox applicant retained; no identity documents uploaded, no genuine verification performed")
}
assert.equal((await call("session", "DELETE")).response.status, 204)
assert.equal((await call("status")).value.status, "access_required")
console.log("PASS: cancellation clears local access; not provider data deletion")
