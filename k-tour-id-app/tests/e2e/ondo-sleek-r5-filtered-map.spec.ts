import { expect, test, type Page } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import {
  expectBRuntimeClean,
  expectMinimumControlTargets,
  expectNoHorizontalOverflow,
  gotoB,
  seedB,
  type BLocale,
} from "../helpers/ondo-b-qa"
import { prepareBVisualPage } from "../helpers/ondo-b-visual-evidence"

const FILTER_QUERY = "느린마을 양조장"
const FILTERED_VENUE_ID = "mois-18939eecb43c15ab4305"
const FILTERED_VENUE_NAME = "느린마을 양조장(잠실새내점)"
const FILTERED_VENUE_TRANSLITERATION = "Neurinmaeul Yangjojang(Jamsilsaenaejeom)"

const FROZEN_VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 801, height: 1000 },
  { width: 1440, height: 1000 },
] as const

async function openOneResultList(page: Page, locale: BLocale) {
  await seedB(page, { locale })
  await gotoB(page, "?city=seoul&view=list")
  const search = page.getByRole("search").getByRole("textbox")
  await search.fill(FILTER_QUERY)
  const list = page.getByTestId("ondo-b-venue-list")
  const result = list.locator(`[data-venue-opener='${FILTERED_VENUE_ID}']`)
  await expect(list.locator("li")).toHaveCount(1)
  await expect(result).toBeVisible()
  await expect(result).toContainText(FILTERED_VENUE_NAME)
  const pulse = result.getByTestId("ondo-b-list-pulse")
  await expect(pulse).toHaveAttribute("data-pulse-level", "hot")
  await expect(pulse).toHaveAttribute("data-pulse-numeric", "hidden")
  await expect(pulse).toHaveAttribute("aria-label", new RegExp(`^Pulse 80 · ${locale === "ko" ? "핫" : "HOT"}`))
  await expect(result).toContainText(locale === "ko" ? "공식 출처 한글명" : "Official Korean source name")
  await expect(result).toContainText(locale === "ko" ? "공식 영문명 아님" : "Generated, not an official English name")
  return { result, search }
}

async function expectFilteredMap(page: Page, locale: BLocale) {
  const root = page.getByTestId("ondo-b-map-entry")
  await expect(root).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
  await expect(root).toHaveAttribute("data-pulse-markers-readable", "true")
  await expect(root).toHaveAttribute("data-result-count", "1")
  await expect(root).toHaveAttribute("data-curated-pulse-count", "1")
  const accessibleMarker = page.getByTestId("ondo-b-pulse-marker-accessible-detail").locator("li")
  await expect(accessibleMarker).toHaveCount(1)
  await expect(accessibleMarker).toContainText(`${locale === "ko" ? FILTERED_VENUE_NAME : FILTERED_VENUE_TRANSLITERATION} · Pulse 80 · ${locale === "ko" ? "핫" : "HOT"}`)

  const key = page.getByTestId("ondo-b-map-key")
  await expect(key).toHaveAttribute("data-pulse-key-presentation", "compact-gradient")
  await expect(key).toHaveAccessibleName(locale === "ko"
    ? /Pulse 지도 · 공식 기록 묶음.*실시간 혼잡도나 공식 LOCALDATA 사실이 아닙니다/
    : /Pulse map · official groups.*not live crowding or official LOCALDATA facts/)
  await expect(key.getByTestId("ondo-b-pulse-scale")).toBeVisible()
  await expect(key).not.toContainText(/Simulated score|시뮬레이션 점수/)
  await expect(page.getByTestId("ondo-b-result-bar").locator("b")).toHaveText(locale === "ko" ? "공식 기록 1개" : "1 official record")
}

async function exerciseFilteredRoundTrip(page: Page, locale: BLocale) {
  const { result, search } = await openOneResultList(page, locale)
  const initialStorage = await page.evaluate(() => ({
    local: localStorage.getItem("ondo.preferences.v3"),
    session: sessionStorage.getItem("ondo.session.v3"),
  }))

  await page.getByTestId("ondo-b-view-toggle").click()
  await expectFilteredMap(page, locale)
  await page.getByTestId("ondo-b-view-toggle").click()
  await expect(search).toHaveValue(FILTER_QUERY)
  await expect(result).toBeVisible()

  await result.click()
  await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
  await page.getByTestId("canonical-place-peek").getByRole("button", { name: locale === "ko" ? "장소 닫기" : "Close place", exact: true }).click()
  await expect(page.getByTestId("canonical-place-peek")).toHaveCount(0)
  await expect(search).toHaveValue(FILTER_QUERY)
  await expect(result).toBeVisible()

  await page.getByTestId("ondo-b-view-toggle").click()
  await expectFilteredMap(page, locale)

  await page.getByTestId("ondo-b-view-toggle").click()
  await expect(result).toBeVisible()
  await expect(search).toHaveValue(FILTER_QUERY)
  await expect(page.evaluate(() => ({
    local: localStorage.getItem("ondo.preferences.v3"),
    session: sessionStorage.getItem("ondo.session.v3"),
  }))).resolves.toEqual(initialStorage)
}

test.describe("SLEEK R5 filtered List and Map synchronization", () => {
  test.describe.configure({ timeout: 240_000 })

  test.beforeEach(async ({ page }) => {
    await prepareBVisualPage(page)
    page.setDefaultTimeout(30_000)
  })

  for (const locale of ["en", "ko"] as const) {
    for (const viewport of [{ width: 390, height: 844 }, { width: 801, height: 1000 }] as const) {
      test(`R5-D5-001 ${locale.toUpperCase()} ${viewport.width}x${viewport.height} keeps the one-result marker, legend, selection, and Close return synchronized`, async ({ page }, testInfo) => {
        test.skip(testInfo.project.name === "desktop-chromium", "The mobile project owns this explicit viewport/locale matrix once.")
        await page.setViewportSize(viewport)
        await exerciseFilteredRoundTrip(page, locale)
        await expectBRuntimeClean(page)
      })
    }
  }

  test("R5-D5-001 all six frozen widths keep the filtered marker in-view with clean geometry and Axe", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "desktop-chromium", "The mobile project owns this explicit six-width matrix once.")
    for (const viewport of FROZEN_VIEWPORTS) {
      await test.step(`${viewport.width}x${viewport.height}`, async () => {
        await page.setViewportSize(viewport)
        const { search } = await openOneResultList(page, "en")
        await page.getByTestId("ondo-b-view-toggle").click()
        await expectFilteredMap(page, "en")
        await expectNoHorizontalOverflow(page, page.getByTestId("ondo-b-root"))
        await expectMinimumControlTargets(page.getByTestId("ondo-b-root"))
        const axe = await new AxeBuilder({ page }).include("[data-testid='ondo-b-root']").analyze()
        expect(axe.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")).toEqual([])
        await page.getByTestId("ondo-b-view-toggle").click()
        await expect(search).toHaveValue(FILTER_QUERY)
      })
    }
    await expectBRuntimeClean(page)
  })

  test("R5-D5-001 search and its one-record result survive reload in the current city context", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "desktop-chromium", "Session semantics are project-independent and run once.")
    await page.setViewportSize({ width: 390, height: 844 })
    const { search } = await openOneResultList(page, "en")
    await expect(search).toHaveValue(FILTER_QUERY)
    await page.reload({ waitUntil: "domcontentloaded" })
    await expect(page.getByRole("search").getByRole("textbox")).toHaveValue(FILTER_QUERY)
    const root = page.getByTestId("ondo-b-map-entry")
    await expect(root).toHaveAttribute("data-result-count", "1")
    await expect(root).toHaveAttribute("data-curated-pulse-count", "1")
    await expect(page.getByTestId("ondo-b-result-bar").locator("b")).toHaveText("1 official record")
    await expect(page.getByTestId("ondo-b-venue-list").locator("li")).toHaveCount(1)
    await expectBRuntimeClean(page)
  })
})
