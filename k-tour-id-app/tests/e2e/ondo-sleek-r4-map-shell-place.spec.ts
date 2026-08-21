import { expect, test, type Locator, type Page } from "@playwright/test"
import {
  CANONICAL_VENUE_ID,
  gotoB,
  prepareBPage,
  seedB,
  type BLocale,
} from "../helpers/ondo-b-qa"

const SHORT_DESKTOPS = [
  { width: 1440, height: 800 },
  { width: 1512, height: 801 },
] as const

const PEEK_VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1440, height: 1000 },
] as const

async function expectNoIntersection(first: Locator, second: Locator) {
  const [a, b] = await Promise.all([first.boundingBox(), second.boundingBox()])
  expect(a).not.toBeNull()
  expect(b).not.toBeNull()
  const horizontalGap = a!.x + a!.width <= b!.x || b!.x + b!.width <= a!.x
  const verticalGap = a!.y + a!.height <= b!.y || b!.y + b!.height <= a!.y
  expect(horizontalGap || verticalGap, `overlap: ${JSON.stringify({ first: a, second: b })}`).toBe(true)
}

async function openCanonicalList(page: Page, locale: BLocale) {
  await gotoB(page, "?city=seoul&view=list")
  const list = page.getByTestId("ondo-b-venue-list")
  await expect(list).toBeVisible()
  const opener = list.locator(`[data-venue-opener='${CANONICAL_VENUE_ID}']`)
  await expect(opener).toBeVisible()
  await expect(opener).toHaveAttribute("aria-label", locale === "ko" ? /공식 출처 한글명/ : /Official Korean source name/)
  return opener
}

async function expectShortDesktopClearance(page: Page, locale: BLocale) {
  await seedB(page, { locale, local: { discoveryPreferences: ["classic", "night"] } })
  for (const viewport of SHORT_DESKTOPS) {
    await test.step(`${viewport.width}x${viewport.height}`, async () => {
      await page.setViewportSize(viewport)
      await gotoB(page)
      const nav = page.getByTestId("ondo-main-nav")
      const nation = page.getByTestId("ondo-b-nation")
      await expectNoIntersection(nav, nation.getByRole("heading", { level: 1 }))
      await expectNoIntersection(nav, nation.locator("p").first())

      await nation.locator("[data-city='seoul']").click()
      await expectNoIntersection(nav, page.getByTestId("ondo-b-preference-summary"))
    })
  }
}

async function expectVenueHover(page: Page, locale: BLocale) {
  await seedB(page, { locale })
  await page.setViewportSize({ width: 1440, height: 1000 })
  const row = await openCanonicalList(page, locale)
  await page.mouse.move(1, 1)
  const before = await row.evaluate((node) => getComputedStyle(node).backgroundColor)
  await row.hover()
  await expect.poll(() => row.evaluate((node) => getComputedStyle(node).backgroundColor)).not.toBe(before)
  await expect.poll(() => row.evaluate((node) => getComputedStyle(node).cursor)).toBe("pointer")
}

async function expectPeekFocusContract(page: Page, locale: BLocale) {
  await seedB(page, { locale })
  for (const viewport of PEEK_VIEWPORTS) {
    await test.step(`${viewport.width}x${viewport.height}`, async () => {
      await page.setViewportSize(viewport)
      const opener = await openCanonicalList(page, locale)
      await opener.focus()
      await opener.click()
      const peek = page.getByTestId("canonical-place-peek")
      const details = page.getByTestId("canonical-place-details")
      await expect(peek).toBeVisible()
      await expect(details).toBeFocused()
      await page.keyboard.press("Escape")
      await expect(peek).toHaveCount(0)
      const restoredListOpener = page.getByTestId("ondo-b-venue-list").locator(`[data-venue-opener='${CANONICAL_VENUE_ID}']`)
      await expect(restoredListOpener).toBeFocused()
      await restoredListOpener.click()
      await expect(details).toBeFocused()
      await peek.getByRole("button", { name: locale === "ko" ? "장소 닫기" : "Close place", exact: true }).click()
      await expect(peek).toHaveCount(0)
      await expect(restoredListOpener).toBeFocused()
    })
  }
}

test.describe("SLEEK R4 map shell and canonical-place closure", () => {
  test.describe.configure({ timeout: 180_000 })

  test.beforeEach(async ({ page }) => {
    await prepareBPage(page)
    page.setDefaultTimeout(30_000)
  })

  test("R4-D1 EN short desktop navigation clears Nation lead and City preference controls", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "desktop-chromium", "The mobile project drives the explicit short-desktop matrix once.")
    await expectShortDesktopClearance(page, "en")
  })

  test("R4-D1 KO short desktop navigation clears Nation lead and City preference controls", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "desktop-chromium", "The mobile project drives the explicit short-desktop matrix once.")
    await expectShortDesktopClearance(page, "ko")
  })

  test("R4-D1 EN desktop venue rows expose a visible hover affordance and pointer cursor", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile-chromium", "Hover requires a fine-pointer desktop browser context.")
    await expectVenueHover(page, "en")
  })

  test("R4-D1 KO desktop venue rows expose a visible hover affordance and pointer cursor", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile-chromium", "Hover requires a fine-pointer desktop browser context.")
    await expectVenueHover(page, "ko")
  })

  test("R4-D2 EN place peek focuses its first action and restores a usable fallback after Escape and Close", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "desktop-chromium", "The mobile project drives the explicit mobile/desktop viewport matrix once.")
    await expectPeekFocusContract(page, "en")
  })

  test("R4-D2 KO place peek focuses its first action and restores a usable fallback after Escape and Close", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "desktop-chromium", "The mobile project drives the explicit mobile/desktop viewport matrix once.")
    await expectPeekFocusContract(page, "ko")
  })

  test("R4-D4 the document language and app accessible name follow live EN/KO state", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "desktop-chromium", "Locale semantics are project-independent and run once.")
    await seedB(page, { locale: "en" })
    await gotoB(page)
    const canvas = page.getByTestId("ondo-canvas")
    await expect(page.locator("html")).toHaveAttribute("lang", "en")
    await expect(canvas).toHaveAccessibleName("ONDO travel food app")

    await page.getByRole("button", { name: "KO", exact: true }).click()
    await expect(page.locator("html")).toHaveAttribute("lang", "ko")
    await expect(canvas).toHaveAccessibleName("ONDO 여행 식음료 앱")
    await expect(page.getByTestId("ondo-main-nav")).toHaveAccessibleName("주요 메뉴")

    await page.getByRole("button", { name: "EN", exact: true }).click()
    await expect(page.locator("html")).toHaveAttribute("lang", "en")
    await expect(canvas).toHaveAccessibleName("ONDO travel food app")
  })

  test("R4-D4 KO MapLibre canvas, zoom controls, and cooperative-gesture help are localized", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "desktop-chromium", "MapLibre locale semantics are project-independent and run once.")
    await seedB(page, { locale: "ko" })
    await gotoB(page, "?city=seoul&view=map")
    await expect(page.getByTestId("maplibre-map")).toHaveAccessibleName("ONDO 식음료 지도")
    await expect(page.locator("canvas.maplibregl-canvas")).toHaveAttribute("aria-label", "지도")
    await expect(page.locator(".maplibregl-ctrl-zoom-in")).toHaveAttribute("aria-label", "지도 확대")
    await expect(page.locator(".maplibregl-ctrl-zoom-out")).toHaveAttribute("aria-label", "지도 축소")
    await expect(page.locator(".maplibregl-cooperative-gesture-screen")).toContainText(/지도를 확대하거나 축소|두 손가락으로 지도를 움직이세요/)
  })

  test("R4-D4 generated Latin names retain explicit provenance in List, peek, detail, and My Korea", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "desktop-chromium", "The mobile project covers the compact provenance layout once.")
    await seedB(page, { locale: "en", local: { savedVenueIds: [CANONICAL_VENUE_ID] } })
    await page.setViewportSize({ width: 390, height: 844 })

    for (const locale of ["en", "ko"] as const) {
      await test.step(locale.toUpperCase(), async () => {
        const opener = await openCanonicalList(page, locale)
        await expect(opener.getByTestId("official-source-name")).toHaveText("로바")
        await expect(opener).toContainText(locale === "ko" ? "공식 출처 한글명" : "Official Korean source name")
        await expect(opener).toContainText("Roba")
        await expect(opener).toContainText(locale === "ko" ? "공식 영문명 아님" : "Generated, not an official English name")

        await opener.click()
        const peekProvenance = page.getByTestId("canonical-name-provenance")
        await expect(peekProvenance).toContainText("Roba")
        await expect(peekProvenance).toContainText(locale === "ko" ? "공식 영문명 아님" : "Generated, not an official English name")
        await page.getByTestId("canonical-place-details").click()
        const detail = page.getByTestId("canonical-place-overlay")
        await expect(detail.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")
        await expect(page.getByTestId("canonical-detail-name-provenance")).toContainText("Roba")
        await expect(page.getByTestId("canonical-detail-name-provenance")).toContainText(locale === "ko" ? "공식 영문명 아님" : "Generated, not an official English name")
        await detail.getByRole("button", { name: locale === "ko" ? "장소 닫기" : "Close place", exact: true }).click()

        await page.getByTestId("nav-my").click()
        const saved = page.getByTestId(`saved-venue-${CANONICAL_VENUE_ID}`)
        await expect(saved).toContainText("로바")
        await expect(saved).toContainText("Roba")
        await expect(saved).toContainText(locale === "ko" ? "공식 영문명 아님" : "Generated, not an official English name")
        await page.getByTestId("nav-ondo").click()
        if (locale === "en") await page.getByRole("button", { name: "KO", exact: true }).click()
      })
    }
  })
})
