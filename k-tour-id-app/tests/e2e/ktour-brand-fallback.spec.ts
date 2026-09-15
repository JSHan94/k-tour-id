import { expect, test, type Page } from "@playwright/test"

const VENUE_ID = "mois-18939eecb43c15ab4305"
const LOCALES = ["en", "ko", "ja"] as const
const TABLE_TITLES = { en: "K-Tour ID Tables", ko: "K-Tour ID 테이블", ja: "K-Tour ID テーブル" }
const ARCHIVED_PATHS = [
  "/brand/ktour-id-lockup-transparent.png", "/brand/ktour-id-lockup.png", "/brand/ktour-id-logo-source.png",
  "/brand/ktour-id-mark-180.png", "/brand/ktour-id-mark-192.png", "/brand/ktour-id-mark-32.png",
  "/brand/ktour-id-mark-512.png", "/brand/ktour-id-mark-64.png", "/brand/ktour-id-mark.png", "/brand/ktour-id-wordmark.png",
  "/brand/ondo-lockup.svg", "/brand/ondo-mark.svg", "/brand/ondo-mark-inverse.svg", "/brand/ondo-mark-micro-24.svg",
  "/og-ktour-food-v1.png",
]

async function openApp(page: Page, query = "") {
  await page.goto(`/${query}`, { waitUntil: "domcontentloaded" })
  await expect(page.getByTestId("ondo-b-root")).toHaveAttribute("data-hydrated", "true", { timeout: 45_000 })
}

async function expectCurrentBrand(page: Page, surface: string) {
  const residues = await page.evaluate(() => {
    const found: Array<{ kind: string; value: string }> = []
    for (const element of document.querySelectorAll("*")) {
      const style = getComputedStyle(element)
      if (!element.getClientRects().length || style.display === "none" || style.visibility === "hidden") continue
      const directText = [...element.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent ?? "").join(" ")
      // aria-hidden excludes decorative content from accessibility, not vision:
      // an image-error pseudo-element can still visibly leak the former name.
      for (const [kind, value] of [
        ["text", directText], ["aria-label", element.getAttribute("aria-label") ?? ""], ["alt", element.getAttribute("alt") ?? ""],
        ["before", getComputedStyle(element, "::before").content], ["after", getComputedStyle(element, "::after").content],
      ]) {
        if (/\bONDO\b|溫圖|온도\s*(?:테이블|앱|패스)/.test(value)) found.push({ kind, value: value.trim().slice(0, 180) })
      }
    }
    return found
  })
  expect(residues, surface).toEqual([])
}

for (const locale of LOCALES) {
  test(`KTOUR-BRAND ${locale}: map, failed photos, place and service flows retain one brand`, async ({ page }, testInfo) => {
    test.setTimeout(60_000)
    const pageErrors: string[] = []
    const identityRequests: string[] = []
    page.on("pageerror", error => pageErrors.push(error.message))
    await page.addInitScript(value => {
      localStorage.setItem("ondo-b.device.v1", JSON.stringify({ locale: value, appearancePreference: "light" }))
    }, locale)
    await page.route(url => /(^|\.)sumsub\.(com|net)$/.test(url.hostname) || url.pathname.startsWith("/api/kyc/"), route => {
      identityRequests.push(new URL(route.request().url()).pathname)
      return route.abort("blockedbyclient")
    })
    // Exercise the real React image onError handler; do not forge photo state.
    await page.route("**/editorial/food/**", route => route.abort("blockedbyclient"))

    await openApp(page)
    await expect(page).toHaveTitle(/K-Tour ID/)
    await expect(page.locator('link[rel="icon"][href*="ktour-id-mono-v1"]').first()).toHaveCount(1)
    await expectCurrentBrand(page, "landing")

    await openApp(page, "?city=seoul&view=list")
    const capsule = page.locator('[data-canonical-venue-capsule="true"]').first()
    await capsule.scrollIntoViewIfNeeded()
    const media = capsule.locator('[data-photo-kind="category-illustration"]')
    await expect(media).toHaveAttribute("data-photo-state", "error")
    await expect(media.locator("img")).toHaveJSProperty("hidden", true)
    await expect(media).toBeVisible()
    expect(await media.evaluate(element => getComputedStyle(element, "::before").content)).toBe('"K-Tour ID"')
    await expectCurrentBrand(page, "list including decorative image-error fallback")
    const screenshotPath = testInfo.outputPath(`image-failure-${locale}.png`)
    await page.screenshot({ path: screenshotPath })
    await testInfo.attach(`image-failure-${locale}`, { path: screenshotPath, contentType: "image/png" })

    await openApp(page, `?city=seoul&view=list&venueId=${VENUE_ID}&detail=1`)
    await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
    await expectCurrentBrand(page, "place detail")

    // Review mode is explicit and no check is approved. This works in both the
    // pure mock release and the separate Sandbox worktree without sending IDs.
    await openApp(page, "?review=1")
    await page.getByTestId("nav-id").click()
    await expect(page.getByTestId("kpass-start-setup")).toBeVisible()
    await expectCurrentBrand(page, "ID and wallet")
    await page.getByTestId("kpass-start-setup").click()
    await page.getByTestId("ktour-id-route-passport").click()
    await expect(page.getByTestId("k-tour-id-consent")).toBeVisible()
    await expectCurrentBrand(page, "passport consent before approval")

    await openApp(page)
    await page.getByTestId("nav-tables").click()
    await expect(page.getByTestId("tables-entry").getByRole("heading", { name: TABLE_TITLES[locale], exact: true })).toBeVisible()
    await expectCurrentBrand(page, "tables")
    await page.getByTestId("nav-settings").click()
    await expect(page.getByTestId("ondo-b-settings-entry")).toBeVisible()
    await expectCurrentBrand(page, "settings")

    await openApp(page, "?review=1")
    await page.getByTestId("review-sample-indicator").first().click()
    await page.getByTestId("integration-demo-open").click()
    await expect(page.getByTestId("integration-demo")).toBeVisible()
    await expectCurrentBrand(page, "partner demo before any action")
    expect(pageErrors).toEqual([])
    expect(identityRequests).toEqual([])
  })
}

test("KTOUR-BRAND deployment serves current assets but not archived logos or the former OG image", async ({ request }) => {
  for (const path of ARCHIVED_PATHS) {
    const response = await request.get(path, { maxRedirects: 0 })
    expect(response.status(), path).toBe(404)
  }
  for (const path of ["/brand/ktour-id-mono-v1.svg", "/brand/ktour-id-mono-v1-32.png", "/og-ktour-food-v2.png"]) {
    const response = await request.get(path, { maxRedirects: 0 })
    expect(response.status(), path).toBe(200)
    expect(response.headers()["content-type"], path).toMatch(/^image\//)
  }
})
