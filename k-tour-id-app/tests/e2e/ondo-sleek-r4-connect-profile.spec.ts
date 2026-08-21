import { readFile } from "node:fs/promises"
import path from "node:path"
import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"
import {
  CANONICAL_VENUE_ID,
  TABLE_ID,
  expectBRuntimeClean,
  gotoB,
  installBRuntimeGuard,
  prepareBPage,
  seedB,
} from "../helpers/ondo-b-qa"

const VIEWPORTS = [
  { id: "compact", width: 360, height: 800 },
  { id: "mobile", width: 390, height: 844 },
  { id: "desktop-boundary", width: 801, height: 1000 },
  { id: "desktop", width: 1440, height: 1000 },
] as const

const TRUTH_VIEWPORTS = [VIEWPORTS[1], VIEWPORTS[3]] as const

const READY_SESSION = {
  account: "ACC-ACTIVE",
  person: "PER-VERIFIED",
  age: "AGE-VERIFIED",
  ageExpiresAt: "2026-08-20T20:30:00+09:00",
  paymentKyc: "PKY-VERIFIED",
}

async function expectVisibleFocus(page: Page, target: Locator) {
  await expect(target).toBeFocused()
  await expect(target).toBeVisible()
  const rect = await target.boundingBox()
  expect(rect).not.toBeNull()
  expect(rect!.x + rect!.width).toBeGreaterThan(0)
  expect(rect!.y + rect!.height).toBeGreaterThan(0)
  expect(rect!.x).toBeLessThan(await page.evaluate(() => innerWidth))
  expect(rect!.y).toBeLessThan(await page.evaluate(() => innerHeight))
  expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe("BODY")
}

async function expectNoSeriousAxe(page: Page, selector: string) {
  const result = await new AxeBuilder({ page })
    .include(selector)
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(result.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
}

async function openVenueScopedTablesForR4(page: Page) {
  await gotoB(page, `?venueId=${CANONICAL_VENUE_ID}`)
  await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
  // This harness transition preserves the same canonical venue state without
  // waiting on the independently covered official-detail endpoint.
  await page.getByTestId("nav-tables").evaluate((button: HTMLButtonElement) => button.click())
  await expect(page.getByTestId("venue-table-scope")).toBeVisible()
}

test.beforeEach(async ({ page }, testInfo) => {
  testInfo.setTimeout(120_000)
  page.setDefaultTimeout(20_000)
  installBRuntimeGuard(page)
  await prepareBPage(page)
})

test.afterEach(async ({ page }) => {
  await expectBRuntimeClean(page)
})

for (const locale of ["en", "ko"] as const) {
  for (const viewport of VIEWPORTS) {
    test(`R4 Connect ${locale} ${viewport.id} venue-empty Browse all Tables owns visible destination focus`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop-chromium")
      await page.setViewportSize(viewport)
      await seedB(page, { locale, session: READY_SESSION })
      await openVenueScopedTablesForR4(page)
      await expect(page.getByTestId("venue-tables-empty")).toBeVisible()
      await page.getByTestId("tables-browse-all").click()

      const destination = page.getByTestId("tables-global-heading")
      await expectVisibleFocus(page, destination)
      await page.keyboard.press("Tab")
      await expectVisibleFocus(page, page.locator(`[data-table-id='${TABLE_ID}']`).first())
    })

    test(`R4 Connect ${locale} ${viewport.id} native rapid feedback double-click is idempotent and cannot fall through`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop-chromium")
      await page.setViewportSize(viewport)
      await seedB(page, {
        locale,
        session: { ...READY_SESSION, tableMembershipById: { [TABLE_ID]: "checked_in" } },
      })
      await gotoB(page)
      await page.getByTestId("nav-tables").click()
      await page.getByRole("region", { name: locale === "ko" ? "참여 중" : "Joined" }).locator(`[data-table-id='${TABLE_ID}']`).click()
      await expect(page.getByTestId("table-chat")).toBeVisible()
      await page.getByTestId("table-finish-meal").click()
      await page.getByTestId("feedback-helpful-yes").click()
      await page.getByTestId("feedback-respectful-yes").click()

      const submit = page.getByTestId("feedback-submit")
      await submit.scrollIntoViewIfNeeded()
      const box = await submit.boundingBox()
      expect(box, `${locale} ${viewport.id} submit geometry`).not.toBeNull()
      await page.mouse.dblclick(box!.x + box!.width / 2, box!.y + box!.height / 2, { delay: 0 })

      await expect(page.getByTestId("feedback-result")).toHaveCount(1)
      await expect(submit).toBeDisabled()
      await expect(submit).toHaveText(locale === "ko" ? "피드백 기록됨" : "Feedback recorded")
      await expect(page.getByRole("alertdialog")).toHaveCount(0)
      await expect(page.getByTestId("chat-confirm-dialog")).toHaveCount(0)
      await expect(page.getByTestId("table-leave")).toHaveCount(0)
      await expect(page.getByTestId("table-report")).toHaveCount(0)
      await expect.poll(async () => page.evaluate((tableId) => {
        const outcomes = JSON.parse(sessionStorage.getItem("ondo.table-outcomes.v2") ?? "{}")
        const session = JSON.parse(sessionStorage.getItem("ondo.session.v3") ?? "{}")
        const eventKeys = (session.acceptedActivityEventKeys ?? []).filter((key: string) => key.includes(tableId))
        return {
          outcomeCount: Object.keys(outcomes).filter((key) => key === tableId).length,
          feedbackSubmitted: outcomes[tableId]?.feedbackSubmitted,
          eventKeys,
          uniqueEventKeys: [...new Set(eventKeys)],
        }
      }, TABLE_ID)).toEqual({
        outcomeCount: 1,
        feedbackSubmitted: true,
        eventKeys: [
          `meetup:account:fixture:meetup:${TABLE_ID}:2026-08-19`,
          `contribution:account:fixture:feedback:${TABLE_ID}:2026-08-19`,
        ],
        uniqueEventKeys: [
          `meetup:account:fixture:meetup:${TABLE_ID}:2026-08-19`,
          `contribution:account:fixture:feedback:${TABLE_ID}:2026-08-19`,
        ],
      })
      await expectNoSeriousAxe(page, "[data-testid='table-feedback']")
    })

    test(`R4 Profile ${locale} ${viewport.id} is browser-session-local before, during, failure, and save`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop-chromium")
      await page.setViewportSize(viewport)
      const copy = locale === "ko"
        ? {
            title: "브라우저 로컬 프로필 미리보기",
            private: "이 브라우저 세션에서는 기본 비공개",
            edit: "프로필 미리보기 편집",
            field: "출신",
            value: "캐나다",
            toggle: "출신: 브라우저 미리보기에서 제외됨. 출신 포함하기",
            save: "프로필 미리보기 저장",
            error: "프로필 미리보기 변경을 저장하지 못했어요. 기존 브라우저 로컬 미리보기는 바뀌지 않았고 아무것도 공개되지 않았습니다.",
            retry: "미리보기 저장 다시 시도",
            toast: "이 브라우저에 저장했어요. 이 세션에만 남고 공개되지 않아요.",
            partial: "선택한 필드가 이 브라우저 미리보기에 포함됨",
            truth: "본인 확인에 사용한 국적은 여기로 복사하지 않습니다. 미리보기에 포함한 위치와 언어는 각각 본인이 입력한 값이며 이 브라우저 세션에만 남습니다. 아무것도 공개하거나 전송하지 않습니다.",
            oldClaims: ["공개 프로필", "공개 필드 편집", "선택한 필드만 공개 중"],
          }
        : {
            title: "Browser-local profile preview",
            private: "Private in this browser session by default",
            edit: "Edit profile preview",
            field: "From",
            value: "Canada",
            toggle: "From: excluded from browser preview. Include From in preview",
            save: "Save profile preview",
            error: "Profile preview changes were not saved. Your previous browser-local preview is unchanged and nothing was published.",
            retry: "Try saving preview again",
            toast: "Saved in this browser. It stays in this session and is not published.",
            partial: "Selected fields included in this browser preview",
            truth: "Identity-check nationality is never copied here. Every previewed location and language is self-declared and stays in this browser session. Nothing is published or sent.",
            oldClaims: ["Public profile", "Edit public fields", "Only selected fields are public", "Show From publicly"],
          }
      await seedB(page, {
        locale,
        session: {
          ...READY_SESSION,
          profile: { displayName: "Mina", languages: [], shareFrom: false, shareLivesIn: false, shareLanguages: false },
        },
      })
      await gotoB(page, "?profile=failure")
      await page.getByTestId("nav-id").click()
      const profile = page.getByTestId("ondo-profile-panel")
      await expect(profile.getByRole("heading", { name: copy.title, exact: true })).toBeVisible()
      await expect(profile).toContainText(copy.private)
      await expect(profile).toContainText(copy.truth)
      for (const oldClaim of copy.oldClaims) await expect(profile).not.toContainText(oldClaim)

      await profile.getByRole("button", { name: copy.edit, exact: true }).click()
      await profile.getByRole("textbox", { name: copy.field, exact: true }).fill(copy.value)
      await profile.getByRole("button", { name: copy.toggle, exact: true }).click()
      await profile.getByRole("button", { name: copy.save, exact: true }).click()
      await expect(profile.getByRole("alert")).toHaveText(copy.error)
      const retry = profile.getByRole("button", { name: copy.retry, exact: true })
      await expectVisibleFocus(page, retry)
      await retry.click()
      await expect(page.getByTestId("ondo-toast")).toHaveText(copy.toast)
      await expect(profile).toContainText(copy.partial)
      await expect(profile).toContainText(copy.value)
      await expectNoSeriousAxe(page, "[data-testid='ondo-profile-panel']")
    })
  }

  for (const viewport of TRUTH_VIEWPORTS) {
    test(`R4 truth ${locale} ${viewport.id} Table-full is a fixed local preview, not a live seat race`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop-chromium")
      await page.setViewportSize(viewport)
      await seedB(page, { locale, session: READY_SESSION })
      await gotoB(page, "?scenario=table-full")
      await page.getByTestId("nav-tables").click()
      await page.getByRole("region", { name: locale === "ko" ? "장소별 Table" : "Tables by place" }).locator(`[data-table-id='${TABLE_ID}']`).click()
      await page.getByTestId("table-join").click()
      const full = locale === "ko"
        ? "이 고정 로컬 미리보기는 자리가 모두 찬 상태로 설정되어 있어요. 근처 다른 Table을 확인해 주세요."
        : "This fixed local preview is configured as full. Choose another nearby Table."
      await expect(page.getByTestId("table-action-message")).toHaveText(full)
      await expect(page.getByTestId("ondo-sheet")).not.toContainText(locale === "ko" ? "요청하는 동안 마지막 자리가 찼어요" : "last seat filled while your request was processing")
    })

  }
}

test("R4 localized edge Sheet names and simulated tenth-stamp truth remain exact contracts", async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium")
  const [connectSource, checkoutSource] = await Promise.all([
    readFile(path.join(process.cwd(), "features/ondo/connect/connect-overlays.tsx"), "utf8"),
    readFile(path.join(process.cwd(), "features/ondo/commerce/checkout-overlay.tsx"), "utf8"),
  ])
  expect(connectSource).toContain('locale === "ko" ? "이용할 수 없는 Table" : "Table unavailable"')
  expect(connectSource).toContain('locale === "ko" ? "잠긴 대화" : "Chat locked"')
  expect(connectSource).not.toContain('<Sheet label="Table unavailable"')
  expect(connectSource).not.toContain('<Sheet label="Chat locked"')
  expect(checkoutSource).toContain("A simulated local-preview visit had already recorded the tenth stamp before this checkout.")
  expect(checkoutSource).toContain("시뮬레이션된 로컬 미리보기 방문으로 이 결제 전에 열 번째 스탬프가 이미 기록되었습니다.")
  expect(checkoutSource).not.toContain("The tenth visit was confirmed separately before this checkout.")
})
