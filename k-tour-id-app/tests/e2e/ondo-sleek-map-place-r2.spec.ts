import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"
import { CANONICAL_VENUE_ID, gotoB, openCanonicalVenue, prepareBPage, seedB } from "../helpers/ondo-b-qa"

const VIEWPORTS = [
  { id: "360x800", width: 360, height: 800 },
  { id: "390x844", width: 390, height: 844 },
  { id: "430x932", width: 430, height: 932 },
  { id: "768x1024", width: 768, height: 1024 },
  { id: "801x1000", width: 801, height: 1000 },
  { id: "1440x1000", width: 1440, height: 1000 },
] as const

const LOCALES = ["en", "ko"] as const

async function expectNoSeriousAxe(page: Page, locator: Locator) {
  const selector = await locator.evaluate((node) => {
    if (!node.id) node.id = `sleek-r2-${Math.random().toString(36).slice(2)}`
    return `#${CSS.escape(node.id)}`
  })
  const result = await new AxeBuilder({ page })
    .include(selector)
    .exclude(".maplibregl-cooperative-gesture-screen")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(result.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")).toEqual([])
}

async function expectMinimumTarget(locator: Locator) {
  await expect(locator).toBeVisible()
  await expect.poll(() => locator.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return { width: Math.round(rect.width), height: Math.round(rect.height) }
  })).toMatchObject({ height: expect.any(Number) })
  const rect = await locator.boundingBox()
  expect(rect).not.toBeNull()
  expect(Math.round(rect!.width)).toBeGreaterThanOrEqual(44)
  expect(Math.round(rect!.height)).toBeGreaterThanOrEqual(44)
}

async function expectCenterHit(locator: Locator) {
  await expect(locator).toBeVisible()
  expect(await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
    return hit === element || element.contains(hit)
  })).toBe(true)
}

async function expectNoOverlap(first: Locator, second: Locator) {
  const [a, b] = await Promise.all([first.boundingBox(), second.boundingBox()])
  expect(a).not.toBeNull()
  expect(b).not.toBeNull()
  expect(a!.x + a!.width <= b!.x || b!.x + b!.width <= a!.x || a!.y + a!.height <= b!.y || b!.y + b!.height <= a!.y).toBe(true)
}

async function expectSingleFilledPriority(scope: Locator, expectedTestId: string) {
  const primary = scope.locator("[data-visual-priority='primary']:visible")
  await expect(primary).toHaveCount(1)
  await expect(primary).toHaveAttribute("data-testid", expectedTestId)
  expect(await primary.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toMatch(/rgba\([^)]*, 0\)|transparent/)
}

async function resetStoredState(page: Page) {
  if (!page.url().startsWith("http")) return
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

test.describe("SLEEK-R2 map, place, and After19 issue closure", () => {
  test.describe.configure({ timeout: 240_000 })
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "desktop-chromium", "The mobile Chromium project runs the explicit six-viewport matrix without duplicating it.")
    await prepareBPage(page)
  })

  for (const locale of LOCALES) {
    test(`${locale.toUpperCase()} nation and city use one semantic heading with explicit official/editorial source boundaries at all six viewports`, async ({ page }) => {
      for (const viewport of VIEWPORTS) {
        await test.step(`${viewport.id} nation`, async () => {
          await resetStoredState(page)
          await seedB(page, { locale })
          await page.setViewportSize(viewport)
          await gotoB(page)
          const nation = page.getByTestId("ondo-b-nation")
          await expect(nation.getByRole("heading", { level: 1 })).toHaveCount(1)
          await expect(nation.getByRole("heading", { level: 2 })).toHaveCount(0)
          await expect(nation.getByTestId("ondo-b-city-truth-legend")).toHaveCount(0)
          await expect(nation.locator("details, footer")).toHaveCount(0)
          await expect(nation).not.toContainText(/Where locals eat now|Pick a city by its local food pulse|Rising|Warming|Hot now|로컬이 지금 먹는 곳|로컬 식음료 열기|떠오름|뜨거움/)
          const seoul = nation.locator("[data-city='seoul']")
          const busan = nation.locator("[data-city='busan']")
          const jeju = nation.locator("[data-city='jeju']")
          await expect(seoul).toHaveAttribute("data-region-role", "official-directory")
          await expect(seoul).toHaveAttribute("data-official-count", "200")
          await expect(seoul).toHaveAttribute("data-directory-source", "MOIS_LOCALDATA_GENERAL_RESTAURANTS")
          await expect(busan).toHaveAttribute("data-official-count", "200")
          await expect(jeju).toHaveAttribute("data-region-role", "editorial-collection")
          await expect(jeju).toHaveAttribute("data-editorial-count", "10")
          await expect(jeju).not.toHaveAttribute("data-official-count", /.+/)
          await expect(nation.locator("[data-region-kind-label]")).toHaveCount(0)
          await expect(nation).not.toContainText(locale === "ko" ? "탐색" : "Explore")
          await expectMinimumTarget(seoul)
          await expectCenterHit(seoul)
          if (locale === "ko") {
            await expect(seoul).toHaveAttribute("aria-label", "서울 · 장소 200곳 · 지도 열기")
            expect((await nation.innerText()).match(/\d+\s+(?:개|곳)/g)).toEqual(null)
          }
          await expectNoSeriousAxe(page, nation)
          await seoul.click()
          const city = page.getByTestId("ondo-b-map-entry")
          await expect(city.getByRole("heading", { level: 1 })).toHaveText(locale === "ko" ? "서울" : "Seoul")
          await expect(city.getByRole("heading", { level: 1 })).toHaveCount(1)
          await expect(city).toHaveAttribute("data-directory-source", "MOIS_LOCALDATA_GENERAL_RESTAURANTS")
          await expect(city).toHaveAttribute("data-city-record-count", "200")
          await expect(city).toHaveAttribute("data-result-count", "200")
          await expect(page.getByTestId("ondo-b-result-bar").locator("b")).toHaveText(locale === "ko" ? "장소 200곳" : "200 places")
          await expect(page.getByTestId("ondo-b-result-bar").locator("small")).toContainText(locale === "ko" ? "LOCALDATA 출처 스냅샷 · 2026. 8. 19." : "LOCALDATA source snapshot · Aug 19, 2026")
          if (locale === "ko") expect((await city.innerText()).match(/\d+\s+(?:개|곳)/g)).toEqual(null)
        })
      }
    })

    test(`${locale.toUpperCase()} compact place peek separates source, Pulse, and primary actions before the full detail/save flow`, async ({ page }) => {
      for (const viewport of VIEWPORTS) {
        await test.step(viewport.id, async () => {
          await resetStoredState(page)
          await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED" } })
          await page.setViewportSize(viewport)
          await openCanonicalVenue(page, { expanded: false, query: "qa=1&scenario=save-failed" })
          const peek = page.getByTestId("canonical-place-peek")
          await expect(peek.getByTestId("canonical-place-identity-stage")).toContainText(locale === "ko" ? "공식 출처 한글명" : "Official Korean source name")
          const pulse = peek.getByTestId("canonical-place-pulse")
          await expect(pulse).toHaveAttribute("data-pulse-level", "peak")
          await expect(pulse).toHaveAttribute("data-pulse-numeric", "hidden")
          const source = peek.getByTestId("canonical-place-source-summary")
          await expect(source).toHaveAttribute("data-source-presentation", "compact-ribbon")
          await expect(source).not.toHaveAttribute("open", "")
          await expect(source).toContainText(locale === "ko" ? "공식 출처 기록" : "Official source record")
          await expect(source).toContainText(locale === "ko" ? "현재 영업 중이라는 뜻은 아닙니다." : "It does not confirm that the business is open today.")
          await expect(peek).not.toContainText(locale === "ko" ? "이 출처에서 제공하지 않는 정보" : "Information not provided by this source")
          const details = peek.getByTestId("canonical-place-details")
          const directions = peek.getByTestId("canonical-venue-directions")
          await expectMinimumTarget(details)
          await expectMinimumTarget(directions)
          await expectCenterHit(details)
          await expectSingleFilledPriority(peek, "canonical-venue-directions")
          const order = await peek.locator("[data-visual-priority]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-testid")))
          expect(order).toEqual(["canonical-venue-directions", "canonical-place-details"])

          await details.click()
          const detail = page.getByTestId("canonical-place-overlay")
          await expect(detail.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")
          await expectSingleFilledPriority(detail, "canonical-venue-primary-directions")
          const after19Unlock = detail.getByTestId("canonical-after19-unlock")
          await expect(after19Unlock).toHaveAttribute("data-visual-priority", "secondary")
          const [primaryBackground, secondaryBackground] = await Promise.all([
            detail.getByTestId("canonical-venue-primary-directions").evaluate((element) => getComputedStyle(element).backgroundColor),
            after19Unlock.evaluate((element) => getComputedStyle(element).backgroundColor),
          ])
          expect(secondaryBackground).not.toBe(primaryBackground)
          if (locale === "ko") {
            await expect(detail).toContainText("출처 스냅샷")
            await expect(detail).toContainText("LOCALDATA 관리번호")
            await expect(detail).not.toContainText(/\bSnapshot\b|\bRecord\b/)
            expect((await detail.innerText()).match(/\d+\s+개/g)).toEqual(null)
          }

          await detail.getByTestId("canonical-venue-save").click()
          const error = detail.getByTestId("canonical-save-error")
          await expect(error).toBeVisible()
          await expect(detail.locator("[data-visual-priority='primary']:visible")).toHaveCount(2)
          await expectSingleFilledPriority(detail.getByTestId("canonical-place-decisions"), "canonical-venue-primary-directions")
          await expectSingleFilledPriority(error, "canonical-save-retry")
          for (const id of ["canonical-venue-primary-directions", "canonical-venue-save", "canonical-save-retry", "canonical-after19-unlock"]) {
            await expectMinimumTarget(detail.getByTestId(id))
          }
          await expectNoSeriousAxe(page, detail)
          await error.getByTestId("canonical-save-retry").click()
          await expect(detail.getByTestId("canonical-venue-save")).toHaveAttribute("aria-pressed", "true")
          await expect(detail.getByTestId("canonical-venue-save")).toHaveText(locale === "ko" ? "저장 취소" : "Remove from Saved")
          await expectSingleFilledPriority(detail, "canonical-venue-primary-directions")
        })
      }
    })

    test(`${locale.toUpperCase()} manual-off notice preserves Map/List and navigation pointer access with intentional focus`, async ({ page }) => {
      for (const viewport of VIEWPORTS) {
        await test.step(viewport.id, async () => {
          await resetStoredState(page)
          await seedB(page, {
            locale,
            session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", age: "AGE-VERIFIED", ageExpiresAt: "2099-08-20T20:30:00+09:00", after19: "A19-ON" },
          })
          await page.setViewportSize(viewport)
          await gotoB(page, "?city=seoul&view=map")
          await expect(page.getByRole("button", { name: locale === "ko" ? "목록" : "List", exact: true })).toBeVisible()
          const after19 = page.getByTestId("ondo-b-after19-global")
          await expect(after19).toHaveAttribute("data-after19-mode", "on")
          await expect(after19).toHaveAttribute("data-after19-age", "eligible")
          const banner = page.getByTestId("global-after19-banner")
          await expect(banner).toContainText(locale === "ko" ? "After 19 켜짐" : "After 19 on")
          await expect(banner).toContainText(locale === "ko" ? "지금 켜짐 · 서울" : "On now · Seoul")
          const turnOff = banner.getByRole("button", { name: locale === "ko" ? "After 19 바로 끄기" : "Turn off After 19 now", exact: true })
          await turnOff.click()
          const notice = page.getByTestId("global-after19-off-notice")
          const undo = notice.getByRole("button", { name: locale === "ko" ? "다시 켜기" : "Turn back on", exact: true })
          const chip = page.getByTestId("global-after19-toggle")
          await expect(notice).toBeVisible()
          await expect(chip).toBeFocused()
          expect(await page.evaluate(() => document.activeElement === document.body)).toBe(false)
          for (const control of await notice.getByRole("button").all()) await expectMinimumTarget(control)

          const viewToggle = page.getByRole("button", { name: locale === "ko" ? "목록" : "List", exact: true })
          const nav = page.getByTestId("ondo-main-nav")
          await expectNoOverlap(notice, viewToggle)
          await expectNoOverlap(notice, nav)
          await expectCenterHit(viewToggle)
          for (const navButton of await nav.getByRole("button").all()) await expectCenterHit(navButton)
          const toggleBox = await viewToggle.boundingBox()
          expect(toggleBox).not.toBeNull()
          await page.mouse.click(toggleBox!.x + toggleBox!.width / 2, toggleBox!.y + toggleBox!.height / 2)
          await expect(page.getByRole("button", { name: locale === "ko" ? "지도" : "Map", exact: true })).toBeVisible()
          await expect(notice).toBeVisible()
          await expectNoSeriousAxe(page, page.getByTestId("ondo-b-root"))

          await undo.click()
          await expect(banner).toBeVisible()
          await expect(turnOff).toBeFocused()
          await turnOff.click()
          await expect(notice).toBeVisible()
          await expect(chip).toBeFocused()
          await notice.getByRole("button", { name: locale === "ko" ? "닫기" : "Dismiss", exact: true }).click()
          await expect(notice).toHaveCount(0)
          await expect(chip).toBeFocused()
          expect(await page.evaluate(() => document.activeElement === document.body)).toBe(false)
        })
      }
    })
  }
})
