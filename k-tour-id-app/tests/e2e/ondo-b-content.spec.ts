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

const PRODUCT_BOUNDARY = /Simulat|시뮬레이션|demo|데모|official|공식|source|출처|preview|미리보기|local|로컬|signal|신호|private|비공개|this tab|이 탭|this device|이 기기|not confirmed|확인되지/i
const TABLE_ID = "table-seoul-night-bites"

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
        if (item.locale === "ko") {
          expect(copy).toContain("지금의 나에게 잘 맞는 한국의 한 끼를 찾아보세요.")
          expect(copy).toContain("서울·부산의 먹거리와 제주 여행 아이디어를 둘러보고, 나만의 취향을 이 기기에 저장해요.")
        } else {
          expect(copy).toContain("Find a meal that feels right for your Korea.")
          expect(copy).toContain("Explore food in Seoul and Busan, plus travel ideas across Jeju, then keep your starting preferences on this device.")
        }
        expect(copy).not.toMatch(/dense food|early coverage|서울의 촘촘|부산의 초기/i)
      }
      if (item.surface === "place") {
        if (item.locale === "ko") {
          expect(copy).toContain("공식 출처 한글명")
          expect(copy).toContain("길찾기용 생성 로마자 표기 · 공식 영문명 아님")
          expect(copy).not.toContain("공식 영문명 미제공 · 공식 한글명 표시")
        } else expect(copy).toContain("Transliterated for navigation")
        if (item.locale === "ko") {
          expect(copy).not.toContain("ONDO 정책")
          expect(copy).toContain("After 19 켜기")
        } else {
          expect(copy).not.toContain("ONDO policy")
          expect(copy).toContain("Turn on After 19")
        }
      }
      if (["place", "account-gate", "age-gate", "table-chat", "local-signal", "checkout", "profile", "labs"].includes(item.surface)) {
        expect(copy, "sensitive/simulated surfaces must state a truth or privacy boundary").toMatch(PRODUCT_BOUNDARY)
      }
      if (item.surface === "after19") {
        await expect(surface).toContainText(item.locale === "ko" ? "After 19 켜짐" : "After 19 on")
        await expect(surface).toContainText(item.locale === "ko" ? "한국 시간 19:00 이후 자동으로 열림 · 서울" : "Opened after 19:00 KST · Seoul")
      }
      if (item.surface === "tables") {
        await surface.getByTestId(`table-open-${TABLE_ID}`).click()
        const detail = page.getByTestId("table-detail")
        const privacy = detail.getByTestId("tables-truth-notice")
        await privacy.locator("summary").click()
        if (item.locale === "ko") {
          await expect(privacy).toContainText("메시지와 사진은 이 테이블에만 남고")
          await expect(privacy).toContainText("참여한 일정은 이 기기의 My Korea에 저장돼요.")
        } else {
          await expect(privacy).toContainText("Messages and photos stay with this Table.")
          await expect(privacy).toContainText("A joined plan is saved to My Korea on this device.")
        }
        await expect(detail).toBeVisible()
        await expect(detail).toHaveAttribute("data-table-id", TABLE_ID)
        await expect(detail).toContainText(item.locale === "ko" ? "19+ 테이블 · 참여할 때만 자격을 확인해요." : "19+ Table · eligibility is checked only when you choose to join.")
        await expect(detail.getByTestId("table-join")).toHaveText(item.locale === "ko" ? "이 테이블 참여" : "Join this Table")
      }
      if (item.surface === "table-chat") {
        await expect(surface).toContainText(item.locale === "ko" ? "20:20에 입구 옆에서 만나요." : "Let’s meet by the entrance at 20:20.")
        await expect(surface).toContainText(item.locale === "ko" ? "이 기기에만 표시됩니다. 위치나 실제 참석을 확인하지 않습니다." : "Marks this device only. It does not verify your location or attendance.")
      }
    })
  }
})
