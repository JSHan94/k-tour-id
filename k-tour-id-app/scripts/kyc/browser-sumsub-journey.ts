// Operator-only, real WebSDK Sandbox journey. Run from k-tour-id-app:
// node --env-file=.env.local --import tsx scripts/kyc/browser-sumsub-journey.ts <permitted-origin>
// Append --simulate-review-after-camera ONLY to simulate the current test
// applicant's review after checking the synthetic camera. This is NOT liveness.
// The origin must be explicitly present in the local adapter configuration;
// for a new Preview, set SUMSUB_ALLOWED_ORIGINS to its exact approved origin.
// Never enable Playwright debugging, traces, HAR, video, or real camera capture.
// Official fixture: https://docs.sumsub.com/docs/verification-document-templates
// Simulation: https://docs.sumsub.com/reference/simulate-review-response-in-sandbox
import { chromium, expect, type BrowserContext, type Page } from "@playwright/test"
import { mkdir, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { readSandboxConfig, SESSION_COOKIE, sumsubRequest, unsealSession, type SandboxConfig } from "../../lib/kyc/sumsub-sandbox"

const TEMPLATE_URL = "https://sumsub.com/files/29346237-germany-passport.jpg"
const TEMPLATE_NAME = "29346237-germany-passport.jpg"
const OUTPUT_DIRECTORY = "artifacts/sumsub"
const SDK_SELECTOR = 'iframe[src^="https://api.sumsub.com/"]'
let stage = "configuration"

function requireCondition(value: unknown): asserts value {
  // Fixed error only: assertion libraries may include actual secret values.
  if (!value) throw new Error("Operator journey check failed")
}

async function downloadOfficialFixture() {
  const response = await fetch(TEMPLATE_URL, { redirect: "error", signal: AbortSignal.timeout(30_000) })
  requireCondition(response.ok && response.headers.get("content-type")?.startsWith("image/jpeg"))
  const bytes = Buffer.from(await response.arrayBuffer())
  requireCondition(bytes.length > 1000 && bytes.length < 20_000_000 && bytes[0] === 0xff && bytes[1] === 0xd8)
  const path = resolve(OUTPUT_DIRECTORY, TEMPLATE_NAME)
  // Keep the official filename and bytes unchanged: no image conversion,
  // cropping, re-encoding, screenshots-as-documents, or generated identities.
  await writeFile(path, bytes, { mode: 0o600 })
  return path
}

async function assertNoPass(page: Page) {
  await expect(page.getByTestId("traveler-id-credential")).toHaveAttribute("data-status", "none")
  for (const axis of ["person", "age", "payment"]) {
    await expect(page.getByTestId(`traveler-id-${axis}`)).toHaveAttribute("data-status", "none")
  }
  await expect(page.getByTestId("k-tour-id-credential")).toHaveCount(0)
}

async function authoritySnapshot(page: Page) {
  // Internal comparison only. Never print storage or applicant information.
  return page.evaluate(() => {
    const device = JSON.parse(localStorage.getItem("ondo-b.device.v1") ?? "{}")
    const axes = JSON.parse(sessionStorage.getItem("ondo-b.action-gates.v1") ?? "{}")
    return JSON.stringify({
      credential: device.identityCredential ?? null,
      person: axes.person ?? null,
      payment: axes.payment ?? null,
      age: sessionStorage.getItem("ondo-b.after19.session.v1"),
      receipts: device.commerceReceipts ?? [],
    })
  })
}

async function simulateThisBrowserReview(context: BrowserContext, config: SandboxConfig, origin: string) {
  // There is deliberately no applicant ID argument and no create-applicant
  // fallback. Only the fresh browser's authenticated server cookie is trusted.
  const cookies = (await context.cookies(origin)).filter(cookie => cookie.name === SESSION_COOKIE)
  requireCondition(cookies.length === 1 && cookies[0].httpOnly)
  const session = unsealSession(cookies[0].value, config, origin)
  requireCondition(session && config.appToken.startsWith("sbx:") && session.environment === "sandbox")
  const applicant = await sumsubRequest(config, `/resources/applicants/-;externalUserId=${encodeURIComponent(session.externalUserId)}/one`)
  requireCondition(applicant.externalUserId === session.externalUserId)
  // Actual Sandbox applicant responses can omit sandboxMode. Reject any
  // contradictory marker; the sbx: credential supplies environment isolation.
  requireCondition(applicant.sandboxMode === undefined || applicant.sandboxMode === true)
  requireCondition(typeof applicant.id === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(applicant.id))
  const applicantId = encodeURIComponent(applicant.id)
  const review = await sumsubRequest(config, `/resources/applicants/${applicantId}/status`)
  requireCondition(review.levelName === session.levelName)
  // Revalidate expiry and binding immediately before this single mutation.
  const currentCookies = (await context.cookies(origin)).filter(cookie => cookie.name === SESSION_COOKIE)
  requireCondition(currentCookies.length === 1 && currentCookies[0].value === cookies[0].value)
  const current = unsealSession(currentCookies[0].value, config, origin)
  requireCondition(current?.externalUserId === session.externalUserId)
  await sumsubRequest(config, `/resources/applicants/${applicantId}/status/testCompleted`, "POST", { reviewAnswer: "GREEN", rejectLabels: [] })
}

async function main() {
  const args = process.argv.slice(2)
  const simulateReview = args.includes("--simulate-review-after-camera")
  requireCondition(args.filter(arg => arg === "--simulate-review-after-camera").length <= 1)
  requireCondition(args.filter(arg => arg.startsWith("--") && arg !== "--simulate-review-after-camera").length === 0)
  const targets = args.filter(arg => arg !== "--simulate-review-after-camera")
  requireCondition(targets.length <= 1)
  const target = new URL(targets[0] ?? "http://localhost:3094")
  requireCondition(!target.username && !target.password && !target.search && !target.hash && target.pathname === "/")
  const origin = target.origin
  const config = readSandboxConfig()
  requireCondition(config && config.origins.includes(origin))
  // DEBUG/PWDEBUG can log secret input values outside our sanitized catcher.
  requireCondition(!process.env.DEBUG && !process.env.PWDEBUG && !process.env.NODE_DEBUG)
  await mkdir(OUTPUT_DIRECTORY, { recursive: true, mode: 0o700 })
  stage = "official-fixture-download"
  const fixture = await downloadOfficialFixture()
  stage = "synthetic-camera-browser-launch"
  const browser = await chromium.launch({ args: [
    "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
    "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream",
  ] })
  try {
    // New isolated context; no stored sessions, real camera, or recording.
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, locale: "en-US", colorScheme: "light" })
    await context.grantPermissions(["camera", "microphone"], { origin })
    await context.grantPermissions(["camera", "microphone"], { origin: "https://api.sumsub.com" })
    const page = await context.newPage()
    page.setDefaultTimeout(30_000)
    let pageErrorCount = 0
    page.on("pageerror", () => { pageErrorCount += 1 })
    stage = "map-first-and-passport-consent"
    await page.goto(origin, { waitUntil: "domcontentloaded" })
    // Do not enter the private code into an unexpected redirect destination.
    requireCondition(new URL(page.url()).origin === origin)
    await expect(page.getByTestId("ondo-b-root")).toHaveAttribute("data-hydrated", "true", { timeout: 60_000 })
    await expect(page.getByTestId("nav-id")).toBeVisible()
    await expect(page.getByTestId("ondo-onboarding")).toHaveCount(0)
    await page.getByTestId("nav-id").click()
    await assertNoPass(page)
    const beforeAuthority = await authoritySnapshot(page)
    await page.getByTestId("travel-pass-readiness-toggle").click()
    await page.getByTestId("traveler-id-ktour-id-open").click()
    await page.getByTestId("ktour-id-route-passport").click()
    await page.getByTestId("k-tour-id-consent-approve").click()
    stage = "private-access-gate"
    await expect(page.getByTestId("sumsub-access-code")).toBeVisible()
    requireCondition(new URL(page.url()).origin === origin)
    await page.getByTestId("sumsub-access-code").fill(config.accessCode)
    await page.getByTestId("sumsub-start").click()
    stage = "official-sdk-consent"
    await expect(page.locator(SDK_SELECTOR)).toBeVisible({ timeout: 60_000 })
    const sdk = page.frameLocator(SDK_SELECTOR)
    await sdk.getByRole("button", { name: "Continue", exact: true }).click({ timeout: 60_000 })
    await sdk.getByRole("button", { name: "Agree and continue", exact: true }).click()
    const start = sdk.getByRole("button", { name: "Start verification", exact: true })
    await expect(start).toBeVisible()
    const sumsubIdSwitch = sdk.getByRole("switch")
    requireCondition(await sumsubIdSwitch.count() <= 1)
    if (await sumsubIdSwitch.count() === 1 && await sumsubIdSwitch.getAttribute("aria-checked") === "true") {
      await sumsubIdSwitch.click()
      await expect(sumsubIdSwitch).toHaveAttribute("aria-checked", "false")
    }
    await start.click()
    stage = "german-passport-selection"
    // The SDK button's accessible name also contains its country-field label.
    // This recorded Korea-preview journey must fail, not guess, if it changes.
    await sdk.locator("button").filter({ hasText: "South Korea" }).click()
    await sdk.getByPlaceholder("Search", { exact: true }).fill("Germany")
    await sdk.getByText("Germany", { exact: true }).click()
    await sdk.getByRole("radio", { name: "Passport", exact: true }).check()
    await sdk.getByRole("button", { name: "Continue", exact: true }).click()
    stage = "official-document-upload"
    await sdk.locator('input[type="file"]').setInputFiles(fixture)
    await sdk.getByRole("button", { name: "Upload document", exact: true }).click()
    await sdk.getByRole("button", { name: "Continue", exact: true }).click({ timeout: 60_000 })
    stage = "synthetic-camera-readiness"
    await expect(sdk.getByText("Get your camera ready", { exact: true })).toBeVisible()
    await sdk.getByRole("button", { name: "Continue", exact: true }).click()
    const video = sdk.locator("video").first()
    await expect.poll(async () => video.evaluate(element => {
      const camera = element as HTMLVideoElement
      return camera.readyState >= 2 && camera.videoWidth > 0 && camera.videoHeight > 0
    }), { timeout: 30_000 }).toBe(true)
    await expect(page.getByTestId("sumsub-passport-step")).toHaveAttribute("data-pass-issued", "false")
    requireCondition(await authoritySnapshot(page) === beforeAuthority)
    requireCondition(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1))
    // Take the readiness evidence promptly. The synthetic test pattern cannot
    // complete liveness and the SDK may later ask to scan the face again.
    await page.screenshot({ path: `${OUTPUT_DIRECTORY}/journey-camera.png` })
    console.log("PASS: official document upload + synthetic camera frames tested; liveness requires a human")
    if (simulateReview) {
      stage = "explicit-bound-applicant-review-simulation"
      await simulateThisBrowserReview(context, config, origin)
      stage = "authoritative-ondo-simulation-result"
      const checkStatus = page.getByTestId("sumsub-check-status")
      if (await checkStatus.isVisible()) await checkStatus.click()
      await expect(page.getByTestId("sumsub-passport-step")).toHaveAttribute("data-status", "approved", { timeout: 60_000 })
      await expect(page.getByTestId("sumsub-passport-step")).toHaveAttribute("data-pass-issued", "false")
      await page.screenshot({ path: `${OUTPUT_DIRECTORY}/journey-simulated-review.png` })
      console.log("PASS: official Sandbox review simulation → ONDO server-approved result; this is not completed liveness")
    }
    stage = "return-to-id-without-credential"
    await page.getByTestId("sumsub-return").click()
    await expect(page.getByTestId("sumsub-passport-step")).toHaveCount(0)
    await expect(page.getByTestId("ondo-b-traveler-id")).toBeVisible()
    await assertNoPass(page)
    requireCondition(await authoritySnapshot(page) === beforeAuthority)
    requireCondition(!await page.evaluate(code => [...Object.values(localStorage), ...Object.values(sessionStorage)].some(value => String(value).includes(code)), config.accessCode))
    requireCondition(pageErrorCount === 0)
    await page.screenshot({ path: `${OUTPUT_DIRECTORY}/journey-returned-id.png` })
    const report = {
      result: "PASS_FOR_STATED_SCOPE",
      document: "official-unchanged-german-passport-template-uploaded",
      camera: "synthetic-device-frames-ready",
      liveness: "not-completed-human-required",
      review: simulateReview ? "official-sandbox-testCompleted-simulation" : "not-simulated",
      ondoApprovedObserved: simulateReview,
      originalIdRestored: true,
      credentialPersonAgePaymentUnchanged: true,
      passIssued: false,
      pageErrors: pageErrorCount,
      realDeviceTested: false,
      providerDataDeleted: false,
    }
    await writeFile(`${OUTPUT_DIRECTORY}/journey-summary.json`, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 })
    console.log(JSON.stringify(report))
    console.log("NOTE: this run's synthetic Sandbox applicant/document may be retained by Sumsub; returning is not provider-data deletion")
    await context.close()
  } finally {
    await browser.close()
  }
}

await main().catch(() => {
  // Never print raw errors, stacks, SDK URLs, cookies, applicant IDs, access
  // codes, document text, or Playwright's password-field call-log snapshots.
  console.error(`FAIL: ${stage}; sensitive details suppressed; no full-journey or liveness completion claimed`)
  process.exitCode = 1
})
