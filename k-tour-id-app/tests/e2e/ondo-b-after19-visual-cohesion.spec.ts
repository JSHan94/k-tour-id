import { expect, test, type Locator, type Page } from "@playwright/test"
import { prepareBPage, seedB } from "../helpers/ondo-b-qa"

const ACTIVE_SESSION = {
  account: "ACC-ACTIVE" as const,
  person: "PER-VERIFIED" as const,
  age: "AGE-VERIFIED" as const,
  ageExpiresAt: "2099-08-20T20:30:00+09:00",
  after19: "A19-ON" as const,
}

async function openNightMap(page: Page, city: "seoul" | "jeju") {
  await seedB(page, { locale: "en", session: ACTIVE_SESSION })
  const editorial = city === "jeju" ? "&editorialPlaceId=jeju-haenyeo-kitchen-bukchon" : ""
  await page.goto(`/?city=${city}&view=map${editorial}`, { waitUntil: "domcontentloaded" })
  const root = page.getByTestId("ondo-b-map-entry")
  await expect(root).toHaveAttribute("data-after19-active", "true")
  await expect(root).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
  return root
}

async function expectDarkSurface(locator: Locator) {
  const treatment = await locator.evaluate((element) => {
    const style = getComputedStyle(element)
    const rgb = style.backgroundColor.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? []
    return {
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      color: style.color,
      isLightSolid: rgb.length === 3 && rgb.every((value) => value >= 238),
    }
  })
  expect(treatment.isLightSolid, JSON.stringify(treatment)).toBe(false)
  expect(treatment.color).not.toBe("rgb(23, 23, 23)")
}

async function expectVisibleNightFocus(locator: Locator) {
  await locator.focus()
  const focus = await locator.evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      color: style.outlineColor,
      style: style.outlineStyle,
      width: style.outlineWidth,
    }
  })
  expect(focus.style).toBe("solid")
  expect(Number.parseFloat(focus.width)).toBeGreaterThanOrEqual(2)
  expect(focus.color).toMatch(/rgb\(255, (?:114|143), (?:184|199)\)/)
}

test.describe("After 19 visual cohesion", () => {
  test.describe.configure({ timeout: 120_000 })

  test.beforeEach(async ({ page }) => {
    await prepareBPage(page)
    await page.clock.setFixedTime(new Date("2026-08-29T21:00:00+09:00"))
  })

  for (const viewport of [
    { label: "phone", width: 390, height: 844 },
    { label: "short-landscape", width: 844, height: 390 },
    { label: "desktop", width: 1440, height: 1000 },
  ] as const) {
    test(`${viewport.label} keeps Seoul After 19 controls on one night palette`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport)
      const root = await openNightMap(page, "seoul")

      await expect(page.getByRole("button", { name: "Bars & pubs", exact: true })).toHaveAttribute("aria-pressed", "true")
      for (const surface of [
        page.getByTestId("ondo-main-nav"),
        page.getByTestId("ondo-b-city-header").locator("div").first(),
        page.getByTestId("ondo-b-map-utility-cluster"),
        page.getByTestId("global-after19-banner"),
        page.getByTestId("ondo-b-editorial-collection-marker"),
        page.getByTestId("ondo-b-attribution"),
      ]) await expectDarkSurface(surface)
      await expectVisibleNightFocus(page.getByTestId("global-after19-banner").getByRole("button"))
      await expect(page.getByTestId("ondo-b-after19-mode-chip")).toHaveCount(0)

      const zoomButtons = root.locator(".maplibregl-ctrl-group button:visible")
      const expectedZoomButtons = viewport.width >= 900 && viewport.height > 500 ? 2 : 0
      await expect(zoomButtons).toHaveCount(expectedZoomButtons)
      for (const zoomButton of await zoomButtons.all()) await expectDarkSurface(zoomButton)
      expect(await root.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
      await page.screenshot({ path: testInfo.outputPath(`after19-seoul-${viewport.label}.png`), animations: "disabled" })
    })
  }

  test("selected Seoul place stays on one night surface instead of leaking its daytime identity card", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedB(page, { locale: "en", session: ACTIVE_SESSION })
    await page.goto("/?city=seoul&view=map&venueId=mois-02d77be9fc4b43fbb360", { waitUntil: "domcontentloaded" })
    const root = page.getByTestId("ondo-b-map-entry")
    await expect(root).toHaveAttribute("data-after19-active", "true")
    await expect(root).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
    const peek = page.getByTestId("canonical-place-peek")
    const identity = peek.getByTestId("canonical-place-identity-stage")
    await expect(peek).toBeVisible()
    await expectDarkSurface(peek)
    await expectDarkSurface(identity)
    await expect(identity.getByRole("heading")).toHaveCSS("color", "rgb(255, 249, 252)")
    await expect(peek.getByTestId("canonical-place-source-summary").locator("summary small")).toHaveCSS("color", "rgb(170, 166, 176)")
    expect(await peek.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath("after19-place-peek-phone.png"), animations: "disabled" })
  })

  for (const viewport of [
    { label: "compact-phone", width: 320, height: 720 },
    { label: "phone", width: 390, height: 844 },
    { label: "desktop", width: 1440, height: 1000 },
  ] as const) {
    test(`${viewport.label} keeps Jeju editorial browsing coherent inside After 19`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport)
      const root = await openNightMap(page, "jeju")

      const collection = page.getByTestId("ondo-b-editorial-place-list")
      const collectionBox = await collection.boundingBox()
      expect(collectionBox?.width ?? 0).toBeGreaterThanOrEqual(88)
      expect(collectionBox?.width ?? 0).toBeLessThanOrEqual(104)
      await expectDarkSurface(collection)
      await expectDarkSurface(page.getByTestId("ondo-b-map-utility-cluster"))
      await expectDarkSurface(page.getByTestId("global-after19-banner"))

      const repeatedCta = page.getByTestId("ondo-b-result-bar")
      const repeatedCtaBox = await repeatedCta.boundingBox()
      expect(repeatedCtaBox?.width ?? 99).toBeLessThanOrEqual(4.1)
      await expect(page.getByText("Explore Jeju", { exact: true })).toHaveCount(0)

      await collection.locator(":scope > summary").click()
      const openBox = await collection.boundingBox()
      expect(openBox?.width ?? 0).toBeGreaterThanOrEqual(viewport.width <= 340 ? 220 : 280)
      await expect(collection.getByRole("button")).toHaveCount(8)
      await expectDarkSurface(collection.locator(":scope > div"))
      const attributionBox = await page.getByTestId("ondo-b-attribution").boundingBox()
      expect(openBox).not.toBeNull()
      expect(attributionBox).not.toBeNull()
      expect((openBox?.x ?? 0) + (openBox?.width ?? 0)).toBeLessThanOrEqual((attributionBox?.x ?? 0) - 6)
      expect(await root.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
      await page.screenshot({ path: testInfo.outputPath(`after19-jeju-${viewport.label}.png`), animations: "disabled" })
    })
  }

  test("expanded Stories stays inside the same After 19 material system", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const root = await openNightMap(page, "seoul")
    const stories = page.getByTestId("ondo-b-japan-first-discovery")
    await stories.locator(":scope > summary").click()
    await expect(stories).toHaveAttribute("open", "")
    await expectDarkSurface(stories.locator(":scope > div"))
    for (const card of await page.getByTestId("ondo-b-editorial-guide-grid").locator(":scope > article").all()) {
      await expectDarkSurface(card)
    }
    expect(await root.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath("after19-stories-phone.png"), animations: "disabled" })
  })

  test("location denial disclosure stays inside the After 19 night palette", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await openNightMap(page, "seoul")
    await page.getByTestId("ondo-b-locate").click()
    await expect(page.getByTestId("ondo-b-locate")).toHaveAttribute("data-location-state", "denied")
    await page.getByTestId("ondo-b-location-message").locator(":scope > summary").click()
    const disclosure = page.getByTestId("ondo-b-location-details")
    await expect(disclosure).toBeVisible()
    await expectDarkSurface(disclosure)
    await expect(disclosure).toHaveCSS("color", "rgb(247, 245, 250)")
    const box = await disclosure.boundingBox()
    expect(box).not.toBeNull()
    expect(box?.x ?? -1).toBeGreaterThanOrEqual(12)
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(378)
    await page.screenshot({ path: testInfo.outputPath("after19-location-denied-phone.png"), animations: "disabled" })
  })

  test("Jeju 19+ gate preserves editorial truth instead of claiming a pub filter", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await openNightMap(page, "jeju")
    await page.getByRole("button", { name: "Turn off After 19 now" }).click()
    await page.getByTestId("global-after19-toggle").click()
    const gate = page.getByTestId("global-after19-prompt-layer")
    await expect(gate).toContainText("Jeju keeps its editorial places and stories; ONDO does not infer pubs or cafés from those sources.")
    await expect(gate).not.toContainText("Narrows this map to official business types associated with bars and pubs")
  })
})
