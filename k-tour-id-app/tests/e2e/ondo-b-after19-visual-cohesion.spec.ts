import { expect, test, type Locator, type Page } from "@playwright/test"
import { seedB } from "../helpers/ondo-b-qa"
import { prepareBVisualPage } from "../helpers/ondo-b-visual-evidence"

const ACTIVE_SESSION = {
  account: "ACC-ACTIVE" as const,
  person: "PER-VERIFIED" as const,
  age: "AGE-VERIFIED" as const,
  ageExpiresAt: "2026-08-30T20:30:00+09:00",
  after19: "A19-ON" as const,
}

async function openNightMap(page: Page, city: "seoul" | "jeju") {
  await seedB(page, { locale: "en", session: ACTIVE_SESSION, after19LocalDeclaration: true })
  await page.goto(`/?city=${city}&view=map`, { waitUntil: "domcontentloaded" })
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
      className: element.className,
      surfaceToken: style.getPropertyValue("--ondo-surface-raised"),
      background: style.background,
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      color: style.color,
      isLightSolid: rgb.length === 3 && rgb.every((value) => value >= 238),
    }
  })
  expect(treatment.isLightSolid, JSON.stringify(treatment)).toBe(false)
  expect(treatment.color).not.toBe("rgb(23, 23, 23)")
}

async function expectLightSurface(locator: Locator) {
  const treatment = await locator.evaluate((element) => {
    const style = getComputedStyle(element)
    const channels = style.backgroundColor.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? []
    const rgb = style.backgroundColor.startsWith("color(srgb")
      ? channels.map((value) => value * 255)
      : channels
    return {
      className: element.className,
      surfaceToken: style.getPropertyValue("--ondo-surface-raised"),
      background: style.background,
      backgroundColor: style.backgroundColor,
      color: style.color,
      isLight: rgb.length === 3 && rgb.every((value) => value >= 235),
    }
  })
  expect(treatment.isLight, JSON.stringify(treatment)).toBe(true)
  expect(treatment.color).not.toMatch(/rgb\((?:247|250|255), (?:245|250|255), (?:250|255)\)/)
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
    await prepareBVisualPage(page)
    await page.clock.setFixedTime(new Date("2026-08-29T21:00:00+09:00"))
  })

  for (const viewport of [
    { label: "phone", width: 390, height: 844 },
    { label: "short-landscape", width: 844, height: 390 },
    { label: "desktop", width: 1440, height: 1000 },
  ] as const) {
    test(`${viewport.label} keeps After 19 inside map-owned controls`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport)
      const root = await openNightMap(page, "seoul")

      await expect(page.getByRole("button", { name: "Bars & pubs", exact: true })).toHaveAttribute("aria-pressed", "true")
      for (const { label, surface } of [
        { label: "global navigation", surface: page.getByTestId("ondo-main-nav") },
        // Assert the painted top-line surface itself. The header is a
        // transparent positioning grid by design.
        { label: "global city topline", surface: page.getByTestId("ondo-b-city-back").locator("..") },
      ]) await test.step(`${label} follows global appearance`, () => expectLightSurface(surface))
      // The utility cluster is a positioning wrapper, so its own transparent
      // computed background is not a material surface. Assert the controls
      // that are physically embedded in the map instead.
      for (const { label, surface } of [
        { label: "After 19 banner", surface: page.getByTestId("global-after19-banner") },
        { label: "collapsed Stories marker", surface: page.getByTestId("ondo-b-editorial-collection-marker") },
        { label: "map attribution", surface: page.getByTestId("ondo-b-attribution") },
      ]) await test.step(`${label} follows map lens`, () => expectDarkSurface(surface))
      await expectVisibleNightFocus(page.getByTestId("global-after19-banner").getByRole("button"))
      const activeControl = page.getByTestId("global-after19-banner").getByRole("button")
      await expect(activeControl.getByText("19+", { exact: true })).toBeVisible()
      await expect(activeControl.locator("svg")).toBeHidden()
      await expect(page.getByTestId("ondo-b-after19-mode-chip")).toHaveCount(0)

      const zoomButtons = page.getByTestId("maplibre-map").locator(".maplibregl-ctrl-group button:visible")
      const expectedZoomButtons = viewport.width >= 900 && viewport.height > 500 ? 2 : 0
      await expect(zoomButtons).toHaveCount(expectedZoomButtons)
      for (const zoomButton of await zoomButtons.all()) await expectDarkSurface(zoomButton)
      expect(await root.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
      await page.screenshot({ path: testInfo.outputPath(`after19-seoul-${viewport.label}.png`), animations: "disabled" })
    })
  }

  test("selected Seoul place stays on the global appearance while the map remains After 19", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedB(page, { locale: "en", session: ACTIVE_SESSION, after19LocalDeclaration: true })
    await page.goto("/?city=seoul&view=map&venueId=mois-02d77be9fc4b43fbb360", { waitUntil: "domcontentloaded" })
    const root = page.getByTestId("ondo-b-map-entry")
    await expect(root).toHaveAttribute("data-after19-active", "true")
    await expect(root).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
    const peek = page.getByTestId("canonical-place-peek")
    const identity = peek.getByTestId("canonical-place-identity-stage")
    await expect(peek).toBeVisible()
    await expectLightSurface(peek)
    await expectLightSurface(identity)
    await expect(identity.getByRole("heading")).toHaveCSS("color", "rgb(23, 23, 23)")
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
      await expect(root).toHaveAttribute("data-after19-result-policy", "editorial-preserved-no-night-inference")
      await expect(root).toHaveAttribute("data-result-count", "8")

      await page.getByTestId("ondo-b-view-toggle").click()
      await expect(root).toHaveAttribute("data-effective-view", "list")
      const collection = page.getByTestId("ondo-b-editorial-place-list")
      const collectionBox = await collection.boundingBox()
      expect(collectionBox?.width ?? 0).toBeGreaterThanOrEqual(viewport.width <= 340 ? 280 : 340)
      await expect(collection).toHaveAttribute("data-list-grammar", "shared-place-cards")
      await expect(collection.locator("[data-editorial-place-id]")).toHaveCount(8)
      // After 19 is a cartographic lens, not a second app-wide dark theme.
      // List content continues to follow the selected global appearance.
      await expectLightSurface(collection.locator("[data-editorial-place-id]").first())
      await expectDarkSurface(page.getByTestId("global-after19-banner"))

      const repeatedCta = page.getByTestId("ondo-b-result-bar")
      const repeatedCtaBox = await repeatedCta.boundingBox()
      expect(repeatedCtaBox?.width ?? 99).toBeLessThanOrEqual(80)
      await expect(page.getByText("Explore Jeju", { exact: true })).toHaveCount(0)
      expect(await root.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
      await page.screenshot({ path: testInfo.outputPath(`after19-jeju-${viewport.label}.png`), animations: "disabled" })
    })
  }

  test("expanded Stories stays on the global appearance beside the After 19 map lens", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const root = await openNightMap(page, "seoul")
    const stories = page.getByTestId("ondo-b-japan-first-discovery")
    await stories.locator(":scope > summary").click()
    await expect(stories).toHaveAttribute("open", "")
    await expectLightSurface(stories.locator(":scope > div"))
    for (const card of await page.getByTestId("ondo-b-editorial-guide-grid").locator(":scope > article").all()) {
      await expectLightSurface(card)
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
    await expect(disclosure).toHaveCSS("color", "rgb(233, 231, 238)")
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
    await expect(page.getByTestId("global-after19-toggle").locator("svg")).toBeVisible()
    await page.getByTestId("global-after19-toggle").click()
    const gate = page.getByTestId("global-after19-prompt-layer")
    await expect(gate).toContainText("Jeju keeps the same places and stories in its night view.")
    await expect(gate).not.toContainText("Narrows this map to official business types associated with bars and pubs")
  })
})
