import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import {
  CANONICAL_VENUE_ID,
  expectBRuntimeClean,
  installBRuntimeGuard,
  openCanonicalVenue,
  prepareBPage,
  seedB,
  sessionState,
} from "../helpers/ondo-b-qa"

const COPY = {
  en: {
    draft: "The menu is ordered at the counter.",
    start: "Start check",
    unavailable: "This verification route is not connected yet.",
    alternate: "Use passport provider instead",
    passport: "Check with a passport verification provider",
    complete: "Complete simulated check",
    returnPrevious: "Return to previous screen",
    identityUnavailable: "Identity check route unavailable",
    identityComplete: "Identity check complete · Simulated",
  },
  ko: {
    draft: "메뉴는 카운터에서 주문해요.",
    start: "본인 확인 시작",
    unavailable: "이 확인 경로는 아직 연결되지 않았어요.",
    alternate: "여권 확인 경로로 대신 진행",
    passport: "여권 확인 서비스로 확인",
    complete: "본인 확인 시뮬레이션 완료",
    returnPrevious: "이전 화면으로 돌아가기",
    identityUnavailable: "본인 확인 경로 미연결",
    identityComplete: "본인 확인 완료 · 시뮬레이션",
  },
} as const

async function expectNoSeriousAxe(page: Page, selector: string) {
  const result = await new AxeBuilder({ page })
    .include(selector)
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(result.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
}

async function openResidentSignal(page: Page, locale: "en" | "ko") {
  await seedB(page, {
    locale,
    session: {
      persona: "long_term_resident",
      account: "ACC-ACTIVE",
      person: "PER-UNVERIFIED",
      age: "AGE-UNVERIFIED",
      paymentKyc: "PKY-NOT-STARTED",
      reputation: { identity: "unverified", visit: "new", contribution: "new", meetup: "new" },
      acceptedActivityEventKeys: [],
    },
  })
  await openCanonicalVenue(page)
  await page.getByTestId("canonical-venue-signal").click()
  const signal = page.getByTestId("local-signal-overlay")
  await signal.locator("textarea").fill(COPY[locale].draft)
  await signal.getByTestId("local-signal-submit").dblclick()
  await expect(page.getByTestId("ondo-gate-overlay")).toBeVisible()
  return signal
}

async function closePlacePeek(page: Page, locale: "en" | "ko") {
  const peek = page.getByTestId("canonical-place-peek")
  if (!await peek.isVisible().catch(() => false)) return
  await peek.getByRole("button", { name: locale === "ko" ? "장소 닫기" : "Close place", exact: true }).click()
  await expect(peek).toBeHidden()
}

test.beforeEach(async ({ page }) => {
  installBRuntimeGuard(page)
  await prepareBPage(page)
})

for (const locale of ["en", "ko"] as const) {
  test(`D5-R3-001 ${locale} ordinary Residence route is unsupported and cancel preserves the exact draft`, async ({ page }) => {
    const copy = COPY[locale]
    const signal = await openResidentSignal(page, locale)
    const gate = page.getByTestId("ondo-gate-overlay")
    const returnToken = (await sessionState(page)).gate as Record<string, unknown>

    await expect(gate.getByRole("button", { name: copy.returnPrevious })).toBeFocused()
    await page.keyboard.press("Shift+Tab")
    await expect.poll(() => gate.evaluate((root) => root.contains(document.activeElement))).toBe(true)

    await gate.getByRole("button", { name: copy.start, exact: true }).dblclick()
    const unsupported = page.getByTestId("gate-unsupported")
    await expect(unsupported).toBeVisible()
    await expect(unsupported.getByRole("heading", { name: copy.unavailable, exact: true })).toBeVisible()
    await expect(unsupported.getByRole("button", { name: copy.alternate, exact: true })).toBeVisible()
    await expect(gate.getByRole("button", { name: copy.returnPrevious })).toBeFocused()
    await expectNoSeriousAxe(page, "[data-testid='ondo-gate-overlay']")

    expect(await sessionState(page)).toMatchObject({
      person: "PER-UNSUPPORTED",
      reputation: { identity: "unverified" },
      gate: {
        ...returnToken,
        cta: "SUBMIT_LOCAL_SIGNAL",
        venueId: CANONICAL_VENUE_ID,
        activeGate: "person",
      },
      gateState: "unsupported",
      acceptedActivityEventKeys: [],
    })

    await page.keyboard.press("Escape")
    await expect(gate).toBeHidden()
    await expect(signal).toBeVisible()
    await expect(signal.locator("textarea")).toHaveValue(copy.draft)
    expect(await sessionState(page)).toMatchObject({
      person: "PER-UNSUPPORTED",
      reputation: { identity: "unverified", visit: "new", contribution: "new", meetup: "new" },
      gate: null,
      gateState: "idle",
      acceptedActivityEventKeys: [],
    })

    await signal.getByRole("button", { name: locale === "ko" ? "작성 취소" : "Cancel draft", exact: true }).click()
    await closePlacePeek(page, locale)
    await page.getByTestId("nav-id").click()
    const identity = page.getByTestId("ondo-identity-entry")
    await expect(identity.getByText(copy.identityUnavailable, { exact: true })).toBeVisible()
    await expect(identity.getByText(copy.identityComplete, { exact: true })).toHaveCount(0)

    await page.reload({ waitUntil: "domcontentloaded" })
    await closePlacePeek(page, locale)
    await page.getByTestId("nav-id").click()
    await expect(page.getByTestId("ondo-identity-entry").getByText(copy.identityUnavailable, { exact: true })).toBeVisible()
    await expectBRuntimeClean(page)
  })

  test(`D5-R3-001 ${locale} passport alternate alone verifies and resumes one contribution`, async ({ page }) => {
    const copy = COPY[locale]
    const signal = await openResidentSignal(page, locale)
    const gate = page.getByTestId("ondo-gate-overlay")
    const returnToken = (await sessionState(page)).gate as Record<string, unknown>

    await gate.getByRole("button", { name: copy.start, exact: true }).dblclick()
    const unsupported = page.getByTestId("gate-unsupported")
    await expect(unsupported).toBeVisible()
    expect(await sessionState(page)).toMatchObject({ person: "PER-UNSUPPORTED", gate: returnToken, gateState: "unsupported" })

    await unsupported.getByRole("button", { name: copy.alternate, exact: true }).dblclick()
    await expect(gate.getByTestId("person-route-passport")).toHaveAttribute("aria-pressed", "true")
    await gate.getByRole("button", { name: copy.start, exact: true }).dblclick()
    await expect(gate.getByRole("button", { name: copy.complete, exact: true })).toBeVisible()
    await expectNoSeriousAxe(page, "[data-testid='ondo-gate-overlay']")
    await gate.getByRole("button", { name: copy.complete, exact: true }).dblclick()

    await expect(gate).toBeHidden()
    await expect(signal).toBeVisible()
    await expect(signal.locator("textarea")).toHaveValue(copy.draft)
    expect(await sessionState(page)).toMatchObject({
      person: "PER-VERIFIED",
      reputation: { identity: "verified", visit: "new", contribution: "new", meetup: "new" },
      gate: null,
      gateState: "idle",
      acceptedActivityEventKeys: [],
    })

    await signal.getByTestId("local-signal-submit").dblclick()
    await expect(signal).toHaveAttribute("data-signal-status", "submitted")
    await expect.poll(async () => (await sessionState(page)).acceptedActivityEventKeys).toEqual([
      `visit:account:fixture:local-signal:${CANONICAL_VENUE_ID}:2026-08-19`,
      `contribution:account:fixture:local-signal:${CANONICAL_VENUE_ID}:2026-08-19`,
    ])
    expect(await sessionState(page)).toMatchObject({
      person: "PER-VERIFIED",
      reputation: { identity: "verified", visit: "recent", contribution: "helpful", meetup: "new" },
    })

    await page.getByTestId("local-signal-return").click()
    await closePlacePeek(page, locale)
    await page.getByTestId("nav-id").click()
    await expect(page.getByTestId("ondo-identity-entry").getByText(copy.identityComplete, { exact: true })).toBeVisible()
    await page.reload({ waitUntil: "domcontentloaded" })
    await closePlacePeek(page, locale)
    await page.getByTestId("nav-id").click()
    await expect(page.getByTestId("ondo-identity-entry").getByText(copy.identityComplete, { exact: true })).toBeVisible()
    await expect.poll(async () => (await sessionState(page)).acceptedActivityEventKeys).toHaveLength(2)
    await expectBRuntimeClean(page)
  })
}
