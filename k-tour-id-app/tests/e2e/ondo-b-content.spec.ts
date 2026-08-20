import { expect, test } from "@playwright/test"
import {
  B_CONTENT_CASES,
  expectBRuntimeClean,
  expectNoHorizontalOverflow,
  expectNoRawTruthLeaks,
  installBRuntimeGuard,
  prepareBPage,
  setupBSurface,
} from "../helpers/ondo-b-qa"

const PRODUCT_BOUNDARY = /Simulat|시뮬레이션|demo|데모|official|공식|source|출처|preview|미리보기|local|로컬|signal|신호|private|비공개|not confirmed|확인되지/i

test.describe("ONDO B reachable KO/EN content surfaces", () => {
  test.beforeEach(async ({ page }) => {
    installBRuntimeGuard(page)
    await prepareBPage(page)
  })

  test.afterEach(async ({ page }) => {
    await expectBRuntimeClean(page)
  })

  for (const item of B_CONTENT_CASES) {
    test(item.id, async ({ page }) => {
      const surface = await setupBSurface(page, item.surface, item.locale)
      await expect(surface).toBeVisible()
      await expectNoRawTruthLeaks(page, surface)
      await expectNoHorizontalOverflow(page)
      const copy = (await surface.innerText()).trim()
      expect(copy.length, "surface must contain user-facing copy").toBeGreaterThan(20)
      if (item.surface === "onboarding") {
        if (item.locale === "ko") expect(copy).toContain("ONDO는 서울과 부산의 식음료 정보부터 시작해 한국으로 넓혀갑니다.")
        else expect(copy).toContain("ONDO starts with food and drink coverage in Seoul and Busan, then grows across Korea.")
        expect(copy).not.toMatch(/dense food|early coverage|서울의 촘촘|부산의 초기/i)
      }
      if (item.surface === "place") {
        if (item.locale === "ko") expect(copy).toContain("공식 영문명 미제공 · 공식 한글명 표시")
        else expect(copy).toContain("Transliterated for navigation")
        if (item.locale === "ko") {
          expect(copy).toContain("ONDO 자체 19+ 정책으로 이 시뮬레이션 야간 프리뷰를 잠가요.")
          expect(copy).toContain("공식 연령 제한이 아니며")
        } else {
          expect(copy).toContain("ONDO locks this simulated night preview behind its own 19+ policy.")
          expect(copy).toContain("This is not an official age restriction")
        }
      }
      if (["place", "account-gate", "age-gate", "tables", "table-chat", "local-signal", "checkout", "profile", "labs", "after19"].includes(item.surface)) {
        expect(copy, "sensitive/simulated surfaces must state a truth or privacy boundary").toMatch(PRODUCT_BOUNDARY)
      }
      if (item.surface === "tables") {
        if (item.locale === "ko") {
          expect(copy).toContain("시뮬레이션 미리보기")
          expect(copy).toContain("실제 호스트나 예약은 없습니다")
        } else {
          expect(copy).toContain("Simulated fixture")
          expect(copy).toContain("No live host or reservation")
        }

        await surface.locator("[data-table-id]").first().click()
        const detail = page.locator("[data-table-membership]")
        await expect(detail).toBeVisible()
        await expect(detail).toContainText(item.locale === "ko" ? "실제 호스트나 예약은 없습니다" : "No live host or reservation")
        await expect(detail.getByTestId("table-join")).toHaveText(item.locale === "ko" ? "참여 미리보기" : "Join preview")
      }
    })
  }
})
