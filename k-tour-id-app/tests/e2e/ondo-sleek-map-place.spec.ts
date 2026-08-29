import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"
import { CANONICAL_VENUE_ID, gotoB, seedB } from "../helpers/ondo-b-qa"

const VIEWPORTS = [
  { width: 360, height: 740 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 801, height: 1000 },
  { width: 1440, height: 1000 },
] as const

async function expectInsideViewport(page: Page, locator: Locator) {
  const [box, viewport] = await Promise.all([locator.boundingBox(), Promise.resolve(page.viewportSize())])
  expect(box).not.toBeNull()
  expect(viewport).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.y).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1)
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height + 1)
}

async function expectNoSeriousAxe(page: Page, locator: Locator) {
  const selector = await locator.evaluate((node) => {
    if (!node.id) node.id = `sleek-map-place-${Math.random().toString(36).slice(2)}`
    return `#${CSS.escape(node.id)}`
  })
  const result = await new AxeBuilder({ page }).include(selector).exclude(".maplibregl-cooperative-gesture-screen").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()
  expect(result.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")).toEqual([])
}

test.describe("SLEEK-R1 map and place closure", () => {
  test("official city and editorial-region semantics stay visible, sans-serif, and unclipped across six target widths", async ({ page }) => {
    await seedB(page)
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport)
      await gotoB(page)
      const nation = page.getByTestId("ondo-b-nation")
      await expect(nation).toBeVisible()
      const seoul = nation.locator("[data-city='seoul']")
      const busan = nation.locator("[data-city='busan']")
      const jeju = nation.locator("[data-city='jeju']")
      for (const city of [seoul, busan]) {
        await expect(city).toHaveAttribute("data-region-role", "official-directory")
        await expect(city).toHaveAttribute("data-official-count", "200")
        await expect(city).toHaveAttribute("data-directory-source", "MOIS_LOCALDATA_GENERAL_RESTAURANTS")
        await expectInsideViewport(page, city)
      }
      await expect(seoul.locator("[data-region-kind-label]")).toHaveText("Food map")
      await expect(busan.locator("[data-region-kind-label]")).toHaveText("Food map")
      await expect(jeju).toHaveAttribute("data-region-role", "editorial-collection")
      await expect(jeju).toHaveAttribute("data-editorial-count", "10")
      await expect(jeju.locator("[data-region-kind-label]")).toHaveText("Travel ideas")
      await expect(nation.getByTestId("ondo-b-city-truth-legend")).toHaveCount(0)
      const fontFamily = await nation.locator("h1").evaluate((node) => getComputedStyle(node).fontFamily.toLowerCase())
      expect(fontFamily).not.toContain("noto serif")
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
    }
  })

  test("search has a visible keyboard ring and zero results has one clear recovery", async ({ page }) => {
    await seedB(page)
    await gotoB(page, "?city=seoul&view=list")
    const input = page.getByRole("search").getByRole("textbox", { name: "Place, district or category" })
    await input.focus()
    const focusTreatment = await input.locator("..").evaluate((node) => ({
      color: getComputedStyle(node).outlineColor,
      style: getComputedStyle(node).outlineStyle,
      width: getComputedStyle(node).outlineWidth,
    }))
    expect(focusTreatment.style).toBe("solid")
    expect(focusTreatment.width).toBe("2px")
    expect(focusTreatment.color).toBe("rgb(23, 23, 23)")

    await input.fill("definitely-no-such-ondo-place")
    const empty = page.getByTestId("ondo-b-empty-results")
    await expect(empty).toBeVisible()
    await expect(empty).toContainText("No records match")
    await expect(empty).not.toContainText("Place only · signal pending")
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-result-count", "0")
    await expect(empty.getByRole("button", { name: "Clear search and category" })).toHaveCount(1)
    await empty.getByRole("button", { name: "Clear search and category" }).click()
    const root = page.getByTestId("ondo-b-map-entry")
    await expect(root).toHaveAttribute("data-result-count", "200")
    await expect(page.getByTestId("ondo-b-result-bar").locator("b")).toHaveText("200 official records")
    await expect(empty).toHaveCount(0)
    await expectNoSeriousAxe(page, root)
  })

  test("map loading is announced, location success persists a real marker/status, and denial can retry", async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name === "desktop-chromium", "Location controls are exercised in the mobile browser; desktop geometry is covered by the six-width matrix.")
    let heldInitialMapRequest = false
    await page.route("https://tiles.openfreemap.org/**", async (route) => {
      if (!heldInitialMapRequest) {
        heldInitialMapRequest = true
        await new Promise((resolve) => setTimeout(resolve, 800))
      }
      await route.continue()
    })
    await context.grantPermissions(["geolocation"])
    await context.setGeolocation({ longitude: 127.0557, latitude: 37.5445 })
    await seedB(page)
    await gotoB(page)
    await page.locator("[data-city='seoul']").dispatchEvent("click")
    const root = page.getByTestId("ondo-b-map-entry")
    await expect(root).toHaveAttribute("data-map-state", /loading|ready/)
    await expect(page.getByTestId("ondo-b-map-loading")).toHaveAttribute("role", "status")

    const locate = page.getByTestId("ondo-b-locate")
    await locate.click()
    await expect(locate).toBeFocused()
    await expect(root).toHaveAttribute("data-location-state", "ready")
    await expect(root).toHaveAttribute("data-user-location", "present")
    await expect(page.getByTestId("ondo-b-user-location-marker")).toHaveAttribute("data-longitude", "127.0557")
    const locationMessage = page.getByTestId("ondo-b-location-message")
    const status = page.getByTestId("ondo-b-location-details")
    await expect(locationMessage).toHaveAttribute("data-message-kind", "status")
    await expect(locationMessage.locator("summary")).toContainText("You’re here")
    await expect(status).toContainText("nearest official record")
    await expect(status).toContainText(/m away|km away/)
    await page.getByRole("button", { name: "List", exact: true }).click()
    const mapToggle = page.getByRole("button", { name: "Map", exact: true })
    await expect(mapToggle).toBeFocused()
    await mapToggle.click()
    await expect(page.getByRole("button", { name: "List", exact: true })).toBeFocused()
    await expect(page.getByTestId("ondo-b-user-location-marker")).toBeAttached()
    await expect(locationMessage).toBeVisible()

    await context.clearPermissions()
    await page.reload({ waitUntil: "domcontentloaded" })
    await expect(root).toHaveAttribute("data-map-state", /loading|ready/)
    const retryLocate = page.getByTestId("ondo-b-locate")
    await retryLocate.click()
    await expect(retryLocate).toBeFocused()
    await expect(root).toHaveAttribute("data-location-state", "denied")
    await expect(page.getByTestId("ondo-b-location-details")).toContainText("Change the browser permission, then try again")
    await expect(page.getByTestId("ondo-b-locate")).toHaveAttribute("aria-label", "Try my location again")
  })

  test("360px place detail keeps the visual Pulse, decisions, and progressive source evidence unclipped", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "desktop-chromium", "The 360px detail interaction runs in the mobile browser; the width matrix still covers desktop layout.")
    await page.setViewportSize({ width: 360, height: 740 })
    await seedB(page, { session: { account: "ACC-ACTIVE", person: "PER-VERIFIED" } })
    await gotoB(page)
    await page.locator("[data-city='seoul']").dispatchEvent("click")
    await page.getByRole("button", { name: "List", exact: true }).click()
    await page.getByTestId("ondo-b-venue-list").locator(`[data-venue-id='${CANONICAL_VENUE_ID}'] > button`).click()
    await page.getByTestId("canonical-place-details").click()
    await expect(page.getByTestId("canonical-place-overlay").locator("[data-detail-state]"))
      .toHaveAttribute("data-detail-state", "ready")
    const detail = page.getByTestId("canonical-place-overlay")
    await expect(detail).toHaveAttribute("data-venue-id", /mois-/)
    await expect(detail.getByTestId("canonical-place-table")).toContainText("View Table")
    await expect(detail.getByTestId("canonical-after19-required")).toContainText("You’ll verify after choosing Join.")
    const pulse = detail.getByTestId("canonical-place-pulse")
    await expect(pulse).toHaveAttribute("data-pulse-level", "peak")
    await expect(pulse).toHaveAttribute("data-pulse-numeric", "hidden")
    await expect(pulse.locator("summary")).toHaveAccessibleName("ONDO temperature 91 · PEAK")
    const [decisionBox, pulseBox] = await Promise.all([
      detail.getByTestId("canonical-place-decisions").boundingBox(),
      pulse.boundingBox(),
    ])
    expect(decisionBox).not.toBeNull()
    expect(pulseBox).not.toBeNull()
    expect(pulseBox!.y + pulseBox!.height).toBeLessThanOrEqual(decisionBox!.y + 1)
    await expectInsideViewport(page, detail.getByTestId("canonical-place-decisions"))

    const evidenceDisclosure = detail.getByTestId("canonical-source-evidence")
    await expect(evidenceDisclosure).not.toHaveAttribute("open", "")
    await evidenceDisclosure.locator("summary").click()
    await expect(evidenceDisclosure).toHaveAttribute("open", "")
    const evidence = evidenceDisclosure.locator("dl")
    await evidence.scrollIntoViewIfNeeded()
    await expect(evidence).toBeVisible()
    await expect(evidence.locator(":scope > div")).toHaveCount(4)
    expect(await evidence.evaluate((node) => node.clientWidth)).toBeGreaterThan(0)
    expect((await evidence.evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(" ").filter(Boolean).length))).toBe(1)
    for (const label of await evidence.locator("dt").all()) {
      expect(await label.evaluate((node) => node.clientWidth)).toBeGreaterThan(0)
      expect(await label.evaluate((node) => getComputedStyle(node).whiteSpace)).toBe("normal")
      expect(await label.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
    }
    const headingFont = await detail.locator("h2").evaluate((node) => getComputedStyle(node).fontFamily.toLowerCase())
    expect(headingFont).not.toContain("noto serif")
    await expectNoSeriousAxe(page, detail)
  })

  test("official detail loading is live, After19 is plum, and recoverable save failure stays neutral", async ({ page }) => {
    let releaseDetailResponse = () => {}
    const detailResponseHeld = new Promise<void>((resolve) => { releaseDetailResponse = resolve })
    await page.route(`**/api/ondo/venues/${CANONICAL_VENUE_ID}`, async (route) => {
      await detailResponseHeld
      await route.continue()
    })
    await seedB(page, { session: { account: "ACC-ACTIVE", person: "PER-VERIFIED" } })
    await gotoB(page, `?venueId=${CANONICAL_VENUE_ID}&qa=1&scenario=save-failed`)
    const detailRequest = page.waitForRequest(`**/api/ondo/venues/${CANONICAL_VENUE_ID}`)
    await page.getByTestId("canonical-place-details").click()
    await detailRequest
    const detail = page.getByTestId("canonical-place-overlay")
    try {
      await expect(detail.getByRole("status")).toContainText("Loading official address evidence")
    } finally {
      releaseDetailResponse()
    }
    const address = detail.locator("[data-detail-state]")
    await expect(address).toHaveAttribute("data-detail-state", "ready")
    await expect(address).toHaveAttribute("data-address-truth", "OFFICIAL_SOURCE")
    await expect(detail.locator("[data-detail-source='MOIS_LOCALDATA_GENERAL_RESTAURANTS']")).toBeVisible()
    const after19Button = detail.getByTestId("canonical-after19-unlock")
    await expect(after19Button).toBeVisible()
    await expect(after19Button).toHaveAttribute("data-visual-priority", "secondary")
    expect(await after19Button.evaluate((node) => getComputedStyle(node).backgroundColor)).not.toBe(await detail.getByTestId("canonical-venue-primary-directions").evaluate((node) => getComputedStyle(node).backgroundColor))

    await detail.getByTestId("canonical-venue-save").click()
    const error = detail.getByTestId("canonical-save-error")
    await expect(error).toBeVisible()
    expect(await error.evaluate((node) => getComputedStyle(node).backgroundColor)).toBe("rgba(0, 0, 0, 0)")
    expect(await error.getByTestId("canonical-save-retry").evaluate((node) => getComputedStyle(node).backgroundColor)).toBe("rgb(32, 32, 30)")
  })
})
