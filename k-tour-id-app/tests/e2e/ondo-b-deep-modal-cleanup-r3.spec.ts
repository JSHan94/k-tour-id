import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import {
  openCanonicalVenue,
  prepareBPage,
  seedB,
  sessionState,
} from "../helpers/ondo-b-qa"

const CANONICAL_VENUE_ID = "mois-0021cd596bc5b2a922ad"

type Locale = "en" | "ko"

const COPY = {
  en: {
    accountStart: "Create account · Simulated",
    accountFinish: "Complete account simulation",
    personStart: "Start check",
    personFinish: "Complete simulated check",
    ageStart: "Start 19+ check simulation",
    ageFinish: "Confirm 19+ · Simulated",
    paymentStart: "Start Payment KYC simulation",
    paymentFinish: "Complete Payment KYC · Simulated",
    tip: "Order beside the entrance.",
    back: /Back to Roba/,
    browse: "Browse all Tables",
  },
  ko: {
    accountStart: "계정 만들기 · 시뮬레이션",
    accountFinish: "계정 시뮬레이션 완료",
    personStart: "확인 시작",
    personFinish: "확인 시뮬레이션 완료",
    ageStart: "19+ 확인 시뮬레이션 시작",
    ageFinish: "19+ 확인 · 시뮬레이션",
    paymentStart: "결제용 KYC 시뮬레이션 시작",
    paymentFinish: "결제용 KYC 완료 · 시뮬레이션",
    tip: "주문은 입구 옆에서 해요.",
    back: "장소로 돌아가기",
    browse: "전체 Table 둘러보기",
  },
} as const

async function completeGate(page: Page, start: string, finish: string) {
  const gate = page.getByTestId("ondo-gate-overlay")
  await expect(gate).toBeVisible()
  await gate.getByRole("button", { name: start, exact: true }).click()
  await gate.getByRole("button", { name: finish, exact: true }).click()
  await expect(gate).toHaveCount(0)
}

async function openExpandedVenueFromPeek(page: Page) {
  const detail = page.getByTestId("canonical-place-overlay")
  if (await detail.isVisible().catch(() => false)) {
    await expect(detail.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")
    return
  }
  const opener = page.getByTestId("canonical-place-details")
  await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
  // The venue component intentionally normalizes its newly mounted peek in an
  // effect. Poll the real opener through that mount boundary so the journey is
  // testing interactivity, not a React effect-order race.
  await expect.poll(async () => {
    await opener.click({ timeout: 1_000 }).catch(() => undefined)
    return page.getByTestId("canonical-place-overlay").isVisible().catch(() => false)
  }).toBe(true)
  await expect(detail).toBeVisible()
  await expect(detail.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")
}

async function accumulateAccountPersonAgePaymentAndVisit(page: Page, locale: Locale) {
  const copy = COPY[locale]
  await seedB(page, {
    locale,
    local: { autoNight: false },
    session: {
      persona: "short_term",
      account: "ACC-GUEST",
      person: "PER-UNVERIFIED",
      age: "AGE-UNVERIFIED",
      paymentKyc: "PKY-NOT-STARTED",
      stamps: 9,
    },
  })
  await openCanonicalVenue(page)

  // Account / save, preserving the exact canonical venue.
  await page.getByTestId("canonical-venue-save").click()
  await completeGate(page, copy.accountStart, copy.accountFinish)
  await expect(page.getByTestId("canonical-venue-save")).toBeDisabled()

  // Person / Local Signal, including the post-gate resubmission and return.
  await page.getByTestId("canonical-venue-signal").click()
  const signal = page.getByTestId("local-signal-overlay")
  await signal.locator("textarea").fill(copy.tip)
  await page.getByTestId("local-signal-submit").click()
  await completeGate(page, copy.personStart, copy.personFinish)
  await expect(signal, `Person completion must return to Local Signal; session=${JSON.stringify(await sessionState(page))}`).toBeVisible()
  await page.getByTestId("local-signal-submit").click()
  await expect(signal).toHaveAttribute("data-signal-status", "submitted")
  await page.getByTestId("local-signal-return").click()

  // Age / venue-scoped After19, restoring the same place detail.
  await openExpandedVenueFromPeek(page)
  await page.getByTestId("canonical-after19-unlock").click()
  await completeGate(page, copy.ageStart, copy.ageFinish)
  const detail = page.getByTestId("canonical-place-overlay")
  await expect(detail).toBeVisible()
  await expect(page.getByTestId("canonical-after19-access")).toHaveAttribute("data-after19-venue-status", "unlocked")

  // Payment KYC / checkout / separate simulated visit and tenth stamp.
  await page.getByTestId("canonical-venue-checkout").click()
  await page.getByTestId("checkout-start").click()
  await completeGate(page, copy.paymentStart, copy.paymentFinish)
  await page.getByTestId("checkout-start").click()
  await page.getByTestId("checkout-confirm").click()
  await expect(page.getByTestId("checkout-overlay")).toHaveAttribute("data-payment-state", "PAY-SIMULATED-SUCCESS")
  await page.getByTestId("visit-proof-check").click()
  await expect(page.getByTestId("checkout-overlay")).toHaveAttribute("data-stamp-count", "10")
  await page.getByTestId("checkout-overlay").getByRole("button", { name: locale === "ko" ? "장소로 돌아가기" : "Return to venue", exact: true }).click()

  await openExpandedVenueFromPeek(page)
  await page.getByTestId("canonical-venue-tables").click()
  await expect(page.getByTestId("venue-table-scope")).toBeVisible()
  await expect(page.getByTestId("venue-tables-empty")).toBeVisible()
  await expect.poll(async () => sessionState(page)).toMatchObject({
    account: "ACC-ACTIVE",
    person: "PER-VERIFIED",
    age: "AGE-VERIFIED",
    paymentKyc: "PKY-VERIFIED",
    stamps: 10,
  })
}

async function expectInteractiveVenueScope(page: Page, locale: Locale) {
  const copy = COPY[locale]
  const active = page.locator("[data-active-tab='tables']")
  const nav = page.getByTestId("ondo-main-nav")
  await expect(active).not.toHaveAttribute("inert", "")
  await expect(active).not.toHaveAttribute("aria-hidden", "true")
  await expect(nav).not.toHaveAttribute("inert", "")
  await expect(nav).not.toHaveAttribute("aria-hidden", "true")
  await expect(page.locator("[data-testid='ondo-canvas'] [inert]")).toHaveCount(0)
  await expect(nav.getByRole("button")).toHaveCount(4)

  const back = page.getByTestId("tables-back-to-venue")
  const browse = page.getByTestId("tables-browse-all")
  await expect(page.getByRole("button", { name: copy.back })).toBeVisible()
  await expect(page.getByRole("button", { name: copy.browse, exact: true })).toBeVisible()

  await back.focus()
  await expect(back).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(browse).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(page.getByTestId("nav-ondo")).toBeFocused()
  await page.keyboard.press("Shift+Tab")
  await expect(browse).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(page.getByTestId("venue-table-scope")).toBeVisible()

  const axe = await new AxeBuilder({ page })
    .include("[data-testid='ondo-b-root']")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(axe.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([])
}

const PROFILES = [
  { locale: "en" as const, width: 390, height: 844, project: "mobile-chromium" },
  { locale: "ko" as const, width: 390, height: 844, project: "mobile-chromium" },
  { locale: "en" as const, width: 1440, height: 1000, project: "desktop-chromium" },
  { locale: "ko" as const, width: 1440, height: 1000, project: "desktop-chromium" },
]

test.beforeEach(async ({ page }) => {
  test.setTimeout(120_000)
  page.setDefaultTimeout(10_000)
  await prepareBPage(page)
})

for (const profile of PROFILES) {
  test(`D5-R3-003 ${profile.locale.toUpperCase()} ${profile.width} deep modal journey leaves venue-empty recovery fully interactive`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== profile.project, `owned by ${profile.project}`)
    await page.setViewportSize({ width: profile.width, height: profile.height })
    await accumulateAccountPersonAgePaymentAndVisit(page, profile.locale)
    await expectInteractiveVenueScope(page, profile.locale)

    // Both venue-scoped recovery actions work without a reload.
    await page.getByTestId("tables-back-to-venue").click()
    await openExpandedVenueFromPeek(page)
    await page.getByTestId("canonical-venue-tables").click()
    await page.getByTestId("tables-browse-all").click()
    await expect(page.getByRole("region", { name: profile.locale === "ko" ? "장소별 Table" : "Tables by place" })).toBeVisible()
    await page.getByTestId("tables-back-to-place-scope").click()
    await expectInteractiveVenueScope(page, profile.locale)

    // All four persistent destinations work, and the exact venue scope remains
    // recoverable by returning to Tables after each transition.
    await page.getByTestId("nav-my").click()
    await expect(page.getByTestId("ondo-my-entry")).toBeVisible()
    await page.getByTestId("nav-tables").click()
    await expect(page.getByTestId("venue-table-scope")).toBeVisible()

    await page.getByTestId("nav-id").click()
    await expect(page.getByTestId("ondo-identity-entry")).toBeVisible()
    await page.getByTestId("nav-tables").click()
    await expect(page.getByTestId("venue-table-scope")).toBeVisible()

    await page.getByTestId("nav-ondo").click()
    await expect(page.locator("[data-testid='canonical-place-peek'], [data-testid='canonical-place-overlay']")).toBeVisible()
    await openExpandedVenueFromPeek(page)
    await page.getByTestId("canonical-venue-tables").click()
    await expect(page.getByTestId("venue-table-scope")).toBeVisible()

    await page.getByTestId("nav-tables").click()
    await expect(page.getByTestId("venue-table-scope")).toBeVisible()
    await expectInteractiveVenueScope(page, profile.locale)
    await expect(page).toHaveURL(new RegExp(`venueId=${CANONICAL_VENUE_ID}`))
  })
}
