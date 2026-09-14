// Real SDK mounting smoke test; no document upload, video/HAR/trace recording.
import { chromium, expect } from "@playwright/test"
import { mkdir } from "node:fs/promises"
const origin = new URL(process.argv[2] ?? "http://localhost:3094").origin
if (!process.env.SUMSUB_PREVIEW_ACCESS_CODE) throw new Error("Missing private preview code")
await mkdir("artifacts/sumsub", { recursive: true })
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] })
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, locale: "en-US" })
  const page = await context.newPage()
  page.setDefaultTimeout(15000)
  const failures: string[] = []
  page.on("pageerror", error => failures.push(error.name))
  await page.goto(origin, { waitUntil: "domcontentloaded" })
  await expect(page.getByTestId("nav-id")).toBeVisible({ timeout: 60000 })
  await expect(page.getByTestId("ondo-onboarding")).toHaveCount(0)
  console.log("PASS: map-first entry loaded")
  await page.getByTestId("nav-id").click()
  await page.getByTestId("travel-pass-readiness-toggle").click()
  console.log("Opened ID readiness")
  await page.getByTestId("traveler-id-ktour-id-open").click()
  await page.getByTestId("ktour-id-route-passport").click()
  await page.getByTestId("k-tour-id-consent-approve").click()
  console.log("Entered Passport consented test")
  await expect(page.getByTestId("sumsub-access-code")).toBeVisible()
  await page.getByTestId("sumsub-access-code").fill(process.env.SUMSUB_PREVIEW_ACCESS_CODE)
  await page.getByTestId("sumsub-start").click()
  const frame = page.locator('iframe[src^="https://api.sumsub.com/"]')
  await expect(frame).toBeVisible({ timeout: 60000 })
  await expect(page.frameLocator('iframe[src^="https://api.sumsub.com/"]').locator("body")).toBeVisible({ timeout: 30000 })
  const sdkBody = page.frameLocator('iframe[src^="https://api.sumsub.com/"]').locator("body")
  await expect.poll(async () => (await sdkBody.innerText()).trim().length, { timeout: 60000 }).toBeGreaterThan(40)
  await expect(page.frameLocator('iframe[src^="https://api.sumsub.com/"]').getByRole("button").first()).toBeVisible({ timeout: 30000 })
  await expect(page.getByTestId("sumsub-passport-step")).toHaveAttribute("data-pass-issued", "false")
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
  if (overflow) throw new Error("Mobile document overflow")
  await page.screenshot({ path: "artifacts/sumsub/mobile-sdk.png" })
  expect(failures).toEqual([])
  // Report origins/feature names only, never the iframe URL containing a token.
  console.log(JSON.stringify({ result: "PASS", mapFirst: true, accessGate: true, sdkIframeOrigin: "https://api.sumsub.com", iframeAllow: await frame.getAttribute("allow"), viewport: "390x844", passIssued: false, pageErrorNames: failures }))
  await page.getByTestId("sumsub-return").click()
  await expect(page.getByTestId("sumsub-passport-step")).toHaveCount(0)
  await expect(page.getByTestId("ondo-b-traveler-id")).toBeVisible()
  expect(failures).toEqual([])
  console.log("PASS: SDK dismissed and original ID screen restored")
  await context.close()
} catch (error) {
  // Playwright errors can embed password-field snapshots. Never print them.
  console.error(`FAIL: ${error instanceof Error ? error.name : "browser check"}; no browser values recorded`)
  process.exitCode = 1
} finally { await browser.close() }
