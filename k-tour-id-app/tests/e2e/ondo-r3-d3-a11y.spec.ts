import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"
import {
  CANONICAL_VENUE_ID,
  gotoB,
  openCanonicalVenue,
  openLabs,
  prepareBPage,
  seedB,
  TABLE_ID,
} from "../helpers/ondo-b-qa"

const READY_SESSION = {
  account: "ACC-ACTIVE",
  person: "PER-VERIFIED",
  age: "AGE-VERIFIED",
  ageExpiresAt: "2026-08-20T20:30:00+09:00",
  paymentKyc: "PKY-VERIFIED",
  stamps: 10,
}

async function expectNoSeriousAxe(page: Page, selector: string) {
  const result = await new AxeBuilder({ page })
    .include(selector)
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(result.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([])
}

async function expectControlDescription(control: Locator, message: Locator) {
  const id = await message.getAttribute("id")
  expect(id).toBeTruthy()
  await expect(control).toHaveAttribute("aria-describedby", id!)
}

async function openTable(page: Page, locale: "en" | "ko", scenario: string) {
  await seedB(page, { locale, session: READY_SESSION })
  await gotoB(page, `?scenario=${scenario}`)
  await page.getByRole("button", { name: locale === "ko" ? "모임" : "Tables", exact: true }).click()
  const tables = page.getByRole("region", { name: locale === "ko" ? "장소별 Table" : "Tables by place" })
  await expect(tables).toBeVisible()
  await tables.locator(`[data-table-id='${TABLE_ID}']`).click()
  await expect(page.getByTestId("table-join")).toBeVisible()
}

async function seedLabs(page: Page, locale: "en" | "ko") {
  await seedB(page, { locale, session: READY_SESSION, clearFeatures: false })
  await page.addInitScript(() => {
    sessionStorage.setItem("ondo.labs.v2", JSON.stringify({
      acknowledged: true,
      wallet: "WAL-DISCONNECTED",
      bridge: "BRG-IDLE",
      phase: "none",
      mint: "NFT-ELIGIBLE",
      consent: false,
      quoteExpiresAt: null,
      traitStates: {},
    }))
  })
  await gotoB(page, "?scenario=labs-wallet-fail")
  await openLabs(page)
  await expect(page.getByTestId("labs-overlay")).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await prepareBPage(page)
})

for (const locale of ["en", "ko"] as const) {
  const copy = locale === "ko"
    ? {
        requesting: "참여 미리보기를 확인하고 있어요.",
        confirmed: "참여 미리보기가 확정됐어요. 이제 대화를 열 수 있어요.",
        network: "이 로컬 미리보기를 업데이트하지 못했어요. 실제 호스트에게 연락하거나 실제 예약을 만들지 않았어요. 다시 시도해도 이 Table의 시간과 자리는 그대로예요.",
        policy: "이 Table의 참여 조건을 충족하지 못했어요.",
        full: "요청하는 동안 마지막 자리가 찼어요. 근처 다른 Table을 확인해 주세요.",
        retryJoin: "참여 미리보기 다시 시도",
        openChat: "대화 열기",
        alternative: "근처 다른 Table 보기",
        signalFailure: "신호를 남기지 못했어요. 초안은 유지됐어요.",
        signalSuccess: "현장 팁을 이 기기의 데모에 저장했어요. 실제 서비스에는 전송되지 않았어요.",
        signalDuplicate: "이미 반영된 데모 방문이에요. 방문·기여 이력과 공개 ONDO 점수는 다시 바뀌지 않았어요.",
        signalNote: "키오스크에서 먼저 주문해요.",
        signalRetry: "다시 시도",
        signalReturn: "장소로 돌아가기",
        walletFailure: "미리보기 연결을 완료하지 못했어요. ONDO 계정, 본인 확인(KYC), 멀티체인 지갑, 실제 자산, 거래 또는 실제 계정에는 아무 영향이 없습니다.",
        walletConnect: "미리보기 서명 기능 연결",
        walletRetry: "다시 시도",
      }
    : {
        requesting: "Checking your preview participation.",
        confirmed: "Your preview participation is confirmed. You can now open the chat.",
        network: "This local preview could not be updated. No live host or reservation was contacted. Retry keeps this Table, time, and seats unchanged.",
        policy: "The Table policy was not met.",
        full: "The last seat filled while your request was processing. Choose another nearby Table.",
        retryJoin: "Retry join preview",
        openChat: "Open chat",
        alternative: "View another Table nearby",
        signalFailure: "The signal could not be submitted. Your draft was kept.",
        signalSuccess: "Your local tip was saved to this device demo. Nothing was sent to a live service.",
        signalDuplicate: "This demo visit was already recorded. Visit and contribution histories and the public ONDO score did not change again.",
        signalNote: "Order at the kiosk first.",
        signalRetry: "Try again",
        signalReturn: "Return to venue",
        walletFailure: "The preview connection did not complete. No ONDO account, KYC, multichain wallet, real asset, transaction, or real account was affected.",
        walletConnect: "Connect preview signer",
        walletRetry: "Try again",
      }

  for (const scenario of ["table-network", "table-policy", "table-full"] as const) {
    test(`R3 D3-001 ${locale} Table ${scenario} replaces request status once and focuses its recovery`, async ({ page }) => {
      test.setTimeout(45_000)
      await openTable(page, locale, scenario)
      await page.getByTestId("table-join").click()

      const requesting = page.getByTestId("table-requesting")
      await expect(requesting).toHaveAttribute("role", "status")
      await expect(requesting).toHaveAttribute("aria-atomic", "true")
      await expect(requesting).toHaveText(copy.requesting)
      await expect(page.getByTestId("ondo-sheet").getByText(copy.requesting, { exact: true })).toHaveCount(1)

      const message = page.getByTestId("table-action-message")
      const expectedFailure = scenario === "table-network" ? copy.network : scenario === "table-policy" ? copy.policy : copy.full
      await expect(message).toHaveAttribute("role", "alert")
      await expect(message).toHaveText(expectedFailure)
      await expect(page.getByTestId("ondo-sheet").getByText(expectedFailure, { exact: true })).toHaveCount(1)
      await expect(page.getByTestId("ondo-sheet").locator("[role='alert']")).toHaveCount(1)
      if (scenario === "table-network") {
        await expect(message).not.toContainText(locale === "ko" ? "연결 문제" : "A connection problem")
      }

      const recovery = scenario === "table-full"
        ? page.getByTestId("table-view-alternative")
        : page.getByTestId("table-join-retry")
      await expect(recovery).toBeFocused()
      await expectControlDescription(recovery, message)
      await expectNoSeriousAxe(page, "[data-testid='ondo-sheet']")

      if (scenario !== "table-full") {
        await page.evaluate(() => history.replaceState({}, "", location.pathname))
        await recovery.click()
        await expect(page.getByTestId("table-requesting")).toHaveAttribute("role", "status")
        await expect(page.getByTestId("ondo-sheet").locator("[role='alert']")).toHaveCount(0)
        const openChat = page.getByRole("button", { name: copy.openChat, exact: true })
        await expect(openChat).toBeFocused()
        const confirmed = page.getByTestId("table-action-message")
        await expect(confirmed).toHaveAttribute("role", "status")
        await expect(confirmed).toHaveText(copy.confirmed)
        await expectControlDescription(openChat, confirmed)
        await expect(page.getByTestId("ondo-sheet").getByText(copy.confirmed, { exact: true })).toHaveCount(1)
      } else {
        await expect(recovery).toHaveText(copy.alternative)
      }
    })
  }

  test(`R3 D3-001 ${locale} Local Signal announces fail, success, and duplicate exactly once`, async ({ page }) => {
    test.setTimeout(60_000)
    await seedB(page, { locale, session: READY_SESSION })
    await openCanonicalVenue(page, { query: "scenario=local-signal-fail" })
    await page.getByTestId("canonical-venue-signal").click()
    let signal = page.getByTestId("local-signal-overlay")
    await signal.locator("textarea").fill(copy.signalNote)
    await page.getByTestId("local-signal-submit").click()

    let outcome = page.getByTestId("local-signal-outcome")
    await expect(outcome).toHaveAttribute("role", "alert")
    await expect(outcome).toHaveText(copy.signalFailure)
    await expect(signal.getByText(copy.signalFailure, { exact: true })).toHaveCount(1)
    await expect(signal.locator("[role='alert'], [role='status']")).toHaveCount(1)
    const retry = page.getByRole("button", { name: copy.signalRetry, exact: true })
    await expect(retry).toBeFocused()
    await expectControlDescription(retry, outcome)

    await page.evaluate(() => history.replaceState({}, "", `${location.pathname}?venueId=${new URLSearchParams(location.search).get("venueId")}`))
    await retry.click()
    await expect(signal.locator("[role='alert']")).toHaveCount(0)
    outcome = page.getByTestId("local-signal-outcome")
    await expect(outcome).toHaveAttribute("role", "status")
    await expect(outcome).toHaveText(copy.signalSuccess)
    await expect(signal.getByText(copy.signalSuccess, { exact: true })).toHaveCount(1)
    await expect(signal.locator("[role='alert'], [role='status']")).toHaveCount(1)
    let returnControl = page.getByRole("button", { name: copy.signalReturn, exact: true })
    await expect(returnControl).toBeFocused()
    await expectControlDescription(returnControl, outcome)
    await expectNoSeriousAxe(page, "[data-testid='local-signal-overlay']")

    await returnControl.click()
    await page.getByTestId("canonical-place-details").click()
    await page.getByTestId("canonical-venue-signal").click()
    signal = page.getByTestId("local-signal-overlay")
    await signal.locator("textarea").fill(copy.signalNote)
    await page.getByTestId("local-signal-submit").click()
    outcome = page.getByTestId("local-signal-outcome")
    await expect(outcome).toHaveAttribute("role", "status")
    await expect(outcome).toHaveText(copy.signalDuplicate)
    await expect(signal.getByText(copy.signalDuplicate, { exact: true })).toHaveCount(1)
    await expect(signal.locator("[role='alert'], [role='status']")).toHaveCount(1)
    returnControl = page.getByRole("button", { name: copy.signalReturn, exact: true })
    await expect(returnControl).toBeFocused()
    await expectControlDescription(returnControl, outcome)
  })

  test(`R3 D3-002 ${locale} Labs wallet failure owns one alert and clears it on retry`, async ({ page }) => {
    test.setTimeout(45_000)
    await seedLabs(page, locale)
    const labs = page.getByTestId("labs-overlay")
    await page.getByRole("button", { name: copy.walletConnect, exact: true }).click()
    await expect(labs).toHaveAttribute("data-wallet-state", "WAL-FAILED")

    const outcome = page.getByTestId("labs-wallet-outcome")
    await expect(outcome).toHaveAttribute("role", "alert")
    await expect(outcome).toHaveText(copy.walletFailure)
    await expect(labs.getByText(copy.walletFailure, { exact: true })).toHaveCount(1)
    await expect(labs.locator("[role='alert']")).toHaveCount(1)
    const retry = page.getByRole("button", { name: copy.walletRetry, exact: true })
    await expect(retry).toBeFocused()
    await expectControlDescription(retry, outcome)
    await expectNoSeriousAxe(page, "[data-testid='labs-overlay']")

    await page.evaluate(() => history.replaceState({}, "", location.pathname))
    await retry.click()
    await expect(page.getByTestId("labs-wallet-outcome")).toHaveCount(0)
    await expect(labs.locator("[role='alert']")).toHaveCount(0)
    await expect(labs).toHaveAttribute("data-wallet-state", "WAL-READY")
    await expect(page.getByText("0x8a71…ondo_preview", { exact: true })).toBeVisible()
  })
}
