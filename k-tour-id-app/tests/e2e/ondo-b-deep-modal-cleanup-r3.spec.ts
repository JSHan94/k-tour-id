import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"
import {
  openCanonicalVenue,
  prepareBPage,
  seedB,
  sessionState,
} from "../helpers/ondo-b-qa"

const CANONICAL_VENUE_ID = "mois-0021cd596bc5b2a922ad"
const EMPTY_TABLE_VENUE_ID = "mois-18939eecb43c15ab4305"

type Locale = "en" | "ko"

const COPY = {
  en: {
    removeSaved: "Remove from Saved",
    walletConnect: "Set up local test balance",
    tip: "Order beside the entrance.",
    back: "Back to this place",
    browse: "Browse all Tables",
    closePlace: "Close place",
  },
  ko: {
    removeSaved: "저장 취소",
    walletConnect: "로컬 테스트 잔액 설정",
    tip: "주문은 입구 옆에서 해요.",
    back: "이 장소로 돌아가기",
    browse: "전체 테이블 보기",
    closePlace: "장소 닫기",
  },
} as const

async function expectNestedModalIsolation(page: Page, parent: Locator) {
  await expect(parent).toHaveAttribute("inert", "")
  await expect(parent).toHaveAttribute("aria-hidden", "true")
  await expect(page.locator("[aria-modal='true']:not([aria-hidden='true']):not([inert])")).toHaveCount(1)
}

async function expectParentRestored(parent: Locator) {
  await expect(parent).not.toHaveAttribute("inert", "")
  await expect(parent).not.toHaveAttribute("aria-hidden", "true")
  await expect(parent).toHaveAttribute("role", "dialog")
  await expect(parent).toHaveAttribute("aria-modal", "true")
}

async function expectNoSeriousAxe(page: Page, include: string) {
  const axe = await new AxeBuilder({ page })
    .include(include)
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(axe.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([])
}

async function completeAccountGate(page: Page, parent: Locator) {
  const gate = page.getByTestId("account-save-gate")
  await expect(gate).toBeVisible()
  await expectNestedModalIsolation(page, parent)
  await gate.getByTestId("account-start").click()
  await gate.getByTestId("account-complete").click()
  await expect(gate).toHaveCount(0)
  await expectParentRestored(parent)
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
  const canonicalDetail = page.getByTestId("canonical-place-overlay")
  await page.getByTestId("canonical-venue-save").click()
  await completeAccountGate(page, canonicalDetail)
  const savedVenue = page.getByTestId("canonical-venue-save")
  await expect(savedVenue).toHaveAttribute("aria-pressed", "true")
  await expect(savedVenue).toContainText(copy.removeSaved)
  await expect(savedVenue).toBeEnabled()

  // Person / provider-neutral passport eKYC preview, preserving the exact
  // Local Signal draft. OpenDID issuance is covered by its onboarding journey.
  await page.getByTestId("canonical-local-signal-open").click()
  const signal = page.getByTestId("ondo-b-local-signal")
  await signal.locator("fieldset button").first().click()
  await signal.locator("textarea").fill(copy.tip)
  await signal.getByTestId("local-signal-person-check").click()
  const personGate = page.getByTestId("ondo-b-action-gate")
  await expect(personGate).toHaveAttribute("data-active-gate", "person")
  await expectNestedModalIsolation(page, signal)
  await personGate.getByTestId("person-route-choice-passport_ekyc").click()
  await expect(personGate).toHaveAttribute("data-person-route", "passport_ekyc")
  await personGate.getByTestId("local-check-boundary-continue").click()
  await expect(personGate).toBeHidden()
  await expectParentRestored(signal)
  await expect(signal.locator("textarea"), `Person completion must preserve the Local Signal draft; session=${JSON.stringify(await sessionState(page))}`).toHaveValue(copy.tip)
  await signal.getByTestId("local-signal-post").click()
  await expect(signal).toBeHidden()
  await expect(page.getByTestId("canonical-place-overlay")).toHaveAttribute("data-venue-id", CANONICAL_VENUE_ID)

  // Age / venue-scoped After19, restoring the same Place detail.
  await openExpandedVenueFromPeek(page)
  await page.getByTestId("canonical-after19-unlock").click()
  const ageGate = page.getByTestId("global-after19-prompt-layer")
  await expect(ageGate.getByTestId("global-after19-return-context")).toHaveAttribute("data-return-venue", CANONICAL_VENUE_ID)
  await expectNestedModalIsolation(page, canonicalDetail)
  await ageGate.getByTestId("global-after19-confirm").click()
  await expect(ageGate).toBeHidden()
  await expectParentRestored(canonicalDetail)
  const detail = page.getByTestId("canonical-place-overlay")
  await expect(detail).toBeVisible()
  await expect(page.getByTestId("canonical-after19-access")).toHaveAttribute("data-after19-venue-status", "unlocked")

  // Payment KYC / current meal-benefit checkout / separate visit and tenth stamp.
  await page.getByTestId("canonical-meal-benefit-open").click()
  const offer = page.getByTestId("ondo-b-id-wallet-commerce")
  await expect(offer).toHaveAttribute("data-origin-venue-id", CANONICAL_VENUE_ID)
  await offer.getByTestId("payment-confirm").click()
  const wallet = page.getByTestId("wallet-connect-sheet")
  await expect(wallet).toBeVisible()
  await expectNestedModalIsolation(page, offer)
  await wallet.getByRole("button", { name: copy.walletConnect, exact: true }).click()
  await expect(wallet).toBeHidden()
  await expectParentRestored(offer)
  await offer.getByTestId("benefit-accept").click()
  await offer.getByTestId("payment-minimum-consent").getByRole("checkbox").check()
  await offer.getByTestId("payment-confirm").click()
  const paymentGate = page.getByTestId("ondo-b-action-gate")
  await expect(paymentGate).toHaveAttribute("data-active-gate", "payment_kyc")
  await expectNestedModalIsolation(page, offer)
  await paymentGate.getByTestId("action-gate-confirm").click()
  await expect(paymentGate).toBeHidden()
  await expectParentRestored(offer)
  const receipt = offer.getByTestId("payment-receipt")
  await expect(receipt).toHaveAttribute("data-completion-kind", "receipt")
  const visit = offer.getByTestId("visit-stamp-receipt")
  await expect(visit).toHaveAttribute("data-stamp-count", "9")
  await visit.getByTestId("visit-proof-check").click()
  await expect(visit).toHaveAttribute("data-stamp-count", "10")
  await receipt.getByTestId("payment-receipt-return").click()

  // Stay in the same SPA session and move from the canonical Place to a real
  // directory Place with no open Table. This proves modal cleanup rather than
  // masking it behind a reload.
  await expect(detail).toHaveAttribute("data-venue-id", CANONICAL_VENUE_ID)
  await detail.getByRole("button", { name: copy.closePlace, exact: true }).click()
  const list = page.getByTestId("ondo-b-venue-list")
  if (!await list.isVisible()) await page.getByTestId("ondo-b-view-toggle").click()
  await expect(list).toBeVisible()
  const emptyVenue = list.locator(`[data-venue-id='${EMPTY_TABLE_VENUE_ID}']`).getByRole("button").first()
  await emptyVenue.scrollIntoViewIfNeeded()
  await emptyVenue.click()
  await openExpandedVenueFromPeek(page)
  const emptyDetail = page.getByTestId("canonical-place-overlay")
  await expect(emptyDetail).toHaveAttribute("data-venue-id", EMPTY_TABLE_VENUE_ID)
  await emptyDetail.getByTestId("canonical-venue-tables").click()
  await expect(emptyDetail.getByTestId("venue-tables-empty")).toBeVisible()
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
  const detail = page.getByTestId("canonical-place-overlay")
  const scope = detail.getByTestId("venue-table-scope")
  const nav = page.getByTestId("ondo-main-nav")
  await expect(detail).toHaveAttribute("data-venue-id", EMPTY_TABLE_VENUE_ID)
  await expect(scope).toHaveAttribute("data-empty-state", "open")
  await expect(nav).toHaveAttribute("inert", "")
  await expect(nav).toHaveAttribute("aria-hidden", "true")
  await expect(nav.locator(":scope > button")).toHaveCount(5)

  const back = detail.getByTestId("tables-back-to-venue")
  const browse = detail.getByTestId("tables-browse-all")
  await expect(back).toHaveAccessibleName(copy.back)
  await expect(browse).toHaveAccessibleName(copy.browse)
  await expect(back).toBeEnabled()
  await expect(browse).toBeEnabled()

  await back.focus()
  await expect(back).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(browse).toBeFocused()
  await page.keyboard.press("Shift+Tab")
  await expect(back).toBeFocused()

  await expectNoSeriousAxe(page, "[data-testid='canonical-place-overlay']")
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
    await expect(page.getByTestId("venue-table-scope")).toHaveAttribute("data-empty-state", "closed")
    await page.getByTestId("canonical-venue-tables").click()
    await page.getByTestId("tables-browse-all").click()
    await expect(page.getByTestId("tables-entry")).toBeVisible()
    await expect(page.getByTestId("nav-tables")).toHaveAttribute("aria-current", "page")
    await expect(page.getByTestId("ondo-main-nav")).not.toHaveAttribute("inert", "")
    await expect(page.getByTestId("ondo-main-nav")).not.toHaveAttribute("aria-hidden", "true")
    await expectNoSeriousAxe(page, "[data-testid='ondo-b-root']")

    // All five persistent destinations work after the deep modal sequence, and
    // Explore restores the exact no-Table Place without a reload.
    await page.getByTestId("nav-my").click()
    await expect(page.getByTestId("ondo-b-my-korea-entry")).toBeVisible()
    await page.getByTestId("nav-tables").click()
    await expect(page.getByTestId("tables-entry")).toBeVisible()

    await page.getByTestId("nav-id").click()
    await expect(page.getByTestId("ondo-b-traveler-id")).toBeVisible()
    await page.getByTestId("nav-settings").click()
    await expect(page.getByTestId("ondo-b-settings-entry")).toBeVisible()

    await page.getByTestId("nav-ondo").click()
    await expect(page.getByTestId("canonical-place-overlay")).toHaveAttribute("data-venue-id", EMPTY_TABLE_VENUE_ID)
    await page.getByTestId("canonical-venue-tables").click()
    await expectInteractiveVenueScope(page, profile.locale)
    await expect(page).toHaveURL(new RegExp(`venueId=${EMPTY_TABLE_VENUE_ID}`))
  })
}

test("D5-R3-004 wallet portal owns lower-priority dialogs mounted before and after it", async ({ page }, testInfo) => {
  await page.setViewportSize(testInfo.project.name === "desktop-chromium" ? { width: 1440, height: 1000 } : { width: 390, height: 844 })
  await seedB(page, {
    locale: "en",
    session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", paymentKyc: "PKY-VERIFIED" },
  })
  await openCanonicalVenue(page)
  await page.getByTestId("canonical-meal-benefit-open").click()
  const offer = page.getByTestId("ondo-b-id-wallet-commerce")

  await page.evaluate(() => {
    const probe = document.createElement("section")
    probe.dataset.testid = "modal-priority-probe-before"
    probe.dataset.modalLayerPriority = "100"
    probe.style.cssText = "position:fixed;z-index:1540"
    probe.setAttribute("role", "dialog")
    probe.setAttribute("aria-modal", "true")
    document.querySelector("[data-testid='ondo-canvas']")?.append(probe)
  })

  await offer.getByTestId("payment-confirm").click()
  const wallet = page.getByTestId("wallet-connect-sheet")
  await expect(wallet).toHaveAttribute("data-modal-layer-priority", "200")
  const before = page.getByTestId("modal-priority-probe-before")
  await expect(before).toHaveAttribute("inert", "")
  await expect(before).toHaveAttribute("aria-hidden", "true")
  const stacking = await wallet.evaluate((element) => ({
    wallet: Number.parseInt(getComputedStyle(element.parentElement!).zIndex, 10),
    lowerPriorityDialog: Number.parseInt(getComputedStyle(document.querySelector<HTMLElement>("[data-testid='modal-priority-probe-before']")!).zIndex, 10),
  }))
  expect(stacking.wallet).toBeGreaterThan(stacking.lowerPriorityDialog)

  await page.evaluate(() => {
    const probe = document.createElement("section")
    probe.dataset.testid = "modal-priority-probe-after"
    probe.dataset.modalLayerPriority = "100"
    probe.setAttribute("role", "dialog")
    probe.setAttribute("aria-modal", "true")
    document.querySelector("[data-testid='ondo-canvas']")?.append(probe)
  })
  const after = page.getByTestId("modal-priority-probe-after")
  await expect(after).toHaveAttribute("inert", "")
  await expect(after).toHaveAttribute("aria-hidden", "true")
  await expect(page.locator("[aria-modal='true']:not([aria-hidden='true']):not([inert])")).toHaveCount(1)

  await wallet.locator("header button").click()
  await expect(wallet).toBeHidden()
  for (const probe of [before, after]) {
    await expect(probe).not.toHaveAttribute("inert", "")
    await expect(probe).not.toHaveAttribute("aria-hidden", "true")
    await expect(probe).toHaveAttribute("role", "dialog")
    await expect(probe).toHaveAttribute("aria-modal", "true")
  }
  await page.evaluate(() => {
    document.querySelector("[data-testid='modal-priority-probe-before']")?.remove()
    document.querySelector("[data-testid='modal-priority-probe-after']")?.remove()
  })
  await expectParentRestored(offer)
})
