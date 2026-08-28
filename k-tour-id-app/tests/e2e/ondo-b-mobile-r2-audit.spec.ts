import { expect, test, type Locator, type Page } from "@playwright/test"
import { gotoB, prepareBPage, seedB } from "../helpers/ondo-b-qa"

const MOBILE_VIEWPORTS = [
  { width: 320, height: 720 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
] as const

const LEGACY_SIGNAL_NAME = /pulse|펄스|パルス/iu

async function expectViewportContained(page: Page, surface: Locator, label: string) {
  const receipt = await surface.evaluate((element) => {
    const box = element.getBoundingClientRect()
    return {
      left: box.left,
      right: box.right,
      ownOverflow: element.scrollWidth - element.clientWidth,
      documentOverflow: document.documentElement.scrollWidth - window.innerWidth,
      viewportWidth: window.innerWidth,
    }
  })
  expect(receipt.left, `${label} starts inside the viewport`).toBeGreaterThanOrEqual(-0.5)
  expect(receipt.right, `${label} ends inside the viewport`).toBeLessThanOrEqual(receipt.viewportWidth + 0.5)
  expect(receipt.ownOverflow, `${label} has no horizontal content overflow`).toBeLessThanOrEqual(1)
  expect(receipt.documentOverflow, `${label} does not widen the document`).toBeLessThanOrEqual(1)
}

async function expectTouchTarget(locator: Locator, label: string) {
  await expect(locator, `${label} is rendered`).toBeVisible()
  const box = await locator.boundingBox()
  expect(box, `${label} has measurable geometry`).not.toBeNull()
  expect(box!.width, `${label} is at least 44 CSS px wide`).toBeGreaterThanOrEqual(44)
  expect(box!.height, `${label} is at least 44 CSS px tall`).toBeGreaterThanOrEqual(44)
}

async function expectNoLegacySignalName(page: Page, label: string) {
  const visibleText = await page.locator("body").innerText()
  const accessibilityTree = await page.locator("body").ariaSnapshot()
  expect(visibleText, `${label}: rendered user copy has no retired signal name`).not.toMatch(LEGACY_SIGNAL_NAME)
  expect(accessibilityTree, `${label}: accessible names have no retired signal name`).not.toMatch(LEGACY_SIGNAL_NAME)
}

async function expectDiscoveryContext(page: Page, expected: { view: string; query: string; category: string }) {
  const context = await page.evaluate(() => {
    const url = new URL(window.location.href)
    return {
      view: url.searchParams.get("view"),
      query: url.searchParams.get("q"),
      category: url.searchParams.get("category"),
    }
  })
  expect(context).toEqual(expected)
}

test.describe("ONDO B mobile R2 independent audit", () => {
  test.describe.configure({ timeout: 90_000 })

  test.beforeEach(async ({ page }) => {
    await prepareBPage(page)
  })

  for (const viewport of MOBILE_VIEWPORTS) {
    test(`${viewport.width}px: five primary tabs stay contained with critical 44px targets`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await seedB(page, { locale: "en", local: { autoNight: false } })
      await gotoB(page)

      const tabs = [
        {
          id: "ondo",
          surface: "ondo-b-map-entry",
          target: () => page.locator("[data-city='seoul']"),
        },
        {
          id: "my",
          surface: "ondo-b-my-korea-entry",
          target: () => page.getByTestId("open-labs"),
        },
        {
          id: "tables",
          surface: "tables-entry",
          target: () => page.getByTestId("table-open-table-seoul-night-bites"),
        },
        {
          id: "id",
          surface: "ondo-b-traveler-id",
          target: () => page.getByTestId("traveler-id-ktour-id-open"),
        },
        {
          id: "settings",
          surface: "ondo-b-settings-entry",
          target: () => page.getByTestId("ondo-b-discovery-settings").locator("summary"),
        },
      ] as const

      for (const tab of tabs) {
        const nav = page.getByTestId(`nav-${tab.id}`)
        await expectTouchTarget(nav, `${viewport.width}px ${tab.id} navigation`)
        await nav.click()
        const surface = page.getByTestId(tab.surface)
        await expect(surface).toBeVisible()
        await expectViewportContained(page, surface, `${viewport.width}px ${tab.id} root`)
        await expectTouchTarget(tab.target(), `${viewport.width}px ${tab.id} primary action`)
      }
    })
  }

  for (const locale of ["en", "ko", "ja"] as const) {
    test(`${locale.toUpperCase()}: rendered and accessible product copy has no retired signal name`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await seedB(page, { locale, local: { autoNight: false } })
      await gotoB(page, "?city=seoul&view=map")

      await expectNoLegacySignalName(page, `${locale} Explore map`)

      const stories = page.getByTestId("ondo-b-japan-first-discovery")
      await page.getByTestId("ondo-b-editorial-collection-marker").click()
      await expect(stories).toHaveAttribute("open", "")
      await expectNoLegacySignalName(page, `${locale} open Stories`)
      await page.keyboard.press("Escape")
      await expect(stories).not.toHaveAttribute("open", "")

      const key = page.getByTestId("ondo-b-map-key-details")
      await key.locator(":scope > summary").click()
      await expect(key).toHaveAttribute("open", "")
      await expectNoLegacySignalName(page, `${locale} open map key`)

      const methodology = page.getByTestId("ondo-b-pulse-methodology")
      await methodology.locator(":scope > summary").click()
      await expect(methodology).toHaveAttribute("open", "")
      await expectNoLegacySignalName(page, `${locale} open temperature methodology`)
      const placeOpener = page.getByTestId("ondo-b-map-pulse-places").getByRole("button").first()
      await placeOpener.click()
      const peek = page.getByTestId("canonical-place-peek")
      await expect(peek).toBeVisible()
      await expectNoLegacySignalName(page, `${locale} place summary`)
      await peek.locator("button").first().click()
      await expect(peek).toHaveCount(0)

      for (const tabId of ["my", "tables", "id", "settings"] as const) {
        await page.getByTestId(`nav-${tabId}`).click()
        await expectNoLegacySignalName(page, `${locale} ${tabId} tab`)
      }
    })
  }

  test("After 19 applies night/dark presentation and restores exact query, category, and view", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedB(page, { locale: "en", local: { autoNight: false } })
    await gotoB(page, "?city=seoul&view=list&q=mapo&category=korean")

    const map = page.getByTestId("ondo-b-map-entry")
    const search = page.getByTestId("ondo-b-search")
    const originalCategory = page.getByRole("button", { name: "Korean", exact: true })
    const nightCategory = page.getByRole("button", { name: "Pub & café licence types", exact: true })
    await expect(search).toHaveValue("mapo")
    await expect(originalCategory).toHaveAttribute("aria-pressed", "true")
    await expect(map).toHaveAttribute("data-requested-view", "list")
    await expectDiscoveryContext(page, { view: "list", query: "mapo", category: "korean" })

    await page.getByTestId("global-after19-toggle").click()
    await page.getByTestId("global-after19-confirm").click()
    const banner = page.getByTestId("global-after19-banner")
    await expect(banner).toBeVisible()
    await expect(map).toHaveAttribute("data-after19-active", "true")
    await expect(map).toHaveCSS("background-color", "rgb(11, 11, 14)")
    await expect(nightCategory).toHaveAttribute("aria-pressed", "true")
    await expect(search).toHaveValue("mapo")
    await expect(map).toHaveAttribute("data-requested-view", "list")
    await expectDiscoveryContext(page, { view: "list", query: "mapo", category: "night" })

    await banner.getByRole("button", { name: "Turn off After 19 now" }).click()
    await expect(map).toHaveAttribute("data-after19-active", "false")
    await expect(originalCategory).toHaveAttribute("aria-pressed", "true")
    await expect(search).toHaveValue("mapo")
    await expect(map).toHaveAttribute("data-requested-view", "list")
    await expectDiscoveryContext(page, { view: "list", query: "mapo", category: "korean" })
  })

  test("Stories Escape closes the disclosure and restores its exact trigger focus", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedB(page, { locale: "en", local: { autoNight: false } })
    await gotoB(page, "?city=seoul&view=map")

    const stories = page.getByTestId("ondo-b-japan-first-discovery")
    const trigger = page.getByTestId("ondo-b-editorial-collection-marker")
    await trigger.click()
    await expect(stories).toHaveAttribute("open", "")
    await stories.getByRole("button", { name: "Close Stories", exact: true }).focus()
    await page.keyboard.press("Escape")
    await expect(stories).not.toHaveAttribute("open", "")
    await expect(trigger).toBeFocused()
  })

  test("a selected venue is not followed by a same-filter camera refit", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: "reduce" })
    await seedB(page, { locale: "en", local: { autoNight: false } })
    await gotoB(page, "?city=seoul&view=map&category=all")

    const map = page.getByTestId("ondo-b-map-entry")
    await expect(map).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
    const key = page.getByTestId("ondo-b-map-key-details")
    await key.locator(":scope > summary").click()
    await page.getByTestId("ondo-b-pulse-methodology").locator(":scope > summary").click()
    const venueOpener = page.getByTestId("ondo-b-map-pulse-places").getByRole("button").first()
    await venueOpener.click()

    const selectedId = await page.getByTestId("canonical-place-peek").getAttribute("data-venue-id")
    expect(selectedId).toBeTruthy()
    await expect(map).toHaveAttribute("data-selected-venue-id", selectedId!)
    await page.getByTestId("canonical-place-peek").locator("button").first().click()
    await expect(page.getByTestId("canonical-place-peek")).toHaveCount(0)

    // The selected-place action intentionally eases to zoom 15. With MapLibre's
    // configured maxZoom 18, exactly three zoom-in actions must reach the max.
    // A second same-filter fitBounds would pull the camera below 15, leaving the
    // control enabled after these three actions.
    const zoomIn = page.locator(".maplibregl-ctrl-zoom-in")
    await expect(zoomIn).toHaveAttribute("aria-disabled", "false")
    await page.locator(".maplibregl-canvas").focus()
    for (let index = 0; index < 3; index += 1) await page.keyboard.press("+")
    await expect(zoomIn).toHaveAttribute("aria-disabled", "true")
    await expect(map).toHaveAttribute("data-result-count", "200")
  })
})
