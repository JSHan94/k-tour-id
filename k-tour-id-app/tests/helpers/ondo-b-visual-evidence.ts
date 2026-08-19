import AxeBuilder from "@axe-core/playwright"
import { expect, type Locator, type Page, type TestInfo } from "@playwright/test"
import {
  CANONICAL_VENUE_ID,
  TABLE_ID,
  expectBRuntimeClean,
  finishAgeGate,
  gotoB,
  installBRuntimeGuard,
  openCanonicalVenue,
  openLabs,
  prepareBPage,
  seedB,
  seedFreshOnboarding,
  type BFlowId,
  type BLocale,
  type BSessionSeed,
} from "./ondo-b-qa"

export type BVisualStateId =
  | "ONBOARDING-VALUE"
  | "ONBOARDING-PERSONAS"
  | "ONBOARDING-PREFERENCES"
  | "NATION"
  | "CITY-LIVE"
  | "CITY-LIST"
  | "CITY-FALLBACK"
  | "PLACE-PEEK"
  | "PLACE-DETAIL"
  | "GATE-ACCOUNT"
  | "GATE-ACCOUNT-FAIL"
  | "GATE-PERSON-PASSPORT"
  | "GATE-PERSON-CX"
  | "GATE-PERSON-RESIDENCE-UNSUPPORTED"
  | "GATE-AGE"
  | "GATE-AGE-FAIL"
  | "GATE-PAYMENT"
  | "GATE-PAYMENT-FAIL"
  | "AFTER19"
  | "TABLES-LIST"
  | "TABLE-DETAIL"
  | "TABLE-JOIN-FAIL"
  | "CHAT"
  | "CHAT-IMAGE-FAIL"
  | "FEEDBACK"
  | "REPORT"
  | "LOCAL-SIGNAL-EMPTY"
  | "LOCAL-SIGNAL-FAIL"
  | "LOCAL-SIGNAL-SUCCESS"
  | "CHECKOUT-IDLE"
  | "CHECKOUT-CANCEL"
  | "CHECKOUT-FAIL"
  | "CHECKOUT-RECEIPT"
  | "CHECKOUT-STAMP"
  | "MY"
  | "PROFILE"
  | "TRUST-FOUR-AXES"
  | "LABS"
  | "LABS-TRAIT-FAIL"
  | "LABS-BRIDGE-FAIL"
  | "LABS-BRIDGE-SUCCESS"

export type BVisualCase = {
  id: `B-PX-${string}`
  state: BVisualStateId
  flows: readonly BFlowId[]
  locale: BLocale
  description: string
}

/**
 * Reachable, layout-distinct B surfaces. Every case runs at both 390×844 and
 * 1440×1000. KO/EN are both present on surfaces where copy expansion can
 * materially change wrapping or CTA height.
 */
export const B_VISUAL_CASES: readonly BVisualCase[] = [
  { id: "B-PX-ONBOARDING-VALUE-EN", state: "ONBOARDING-VALUE", flows: ["FL-007", "FL-008", "FL-009"], locale: "en", description: "first-run value and guest escape" },
  { id: "B-PX-ONBOARDING-PERSONAS-KO", state: "ONBOARDING-PERSONAS", flows: ["FL-007", "FL-008", "FL-009"], locale: "ko", description: "three persona intent choices" },
  { id: "B-PX-ONBOARDING-PREFERENCES-EN", state: "ONBOARDING-PREFERENCES", flows: ["FL-007", "FL-008", "FL-009"], locale: "en", description: "preference chips and map finish" },
  { id: "B-PX-NATION-EN", state: "NATION", flows: ["FL-001"], locale: "en", description: "Korea overview" },
  { id: "B-PX-NATION-KO", state: "NATION", flows: ["FL-001"], locale: "ko", description: "Korea overview copy expansion" },
  { id: "B-PX-CITY-LIVE-EN", state: "CITY-LIVE", flows: ["FL-001", "FL-014"], locale: "en", description: "deterministic map with real ONDO overlays" },
  { id: "B-PX-CITY-LIVE-KO", state: "CITY-LIVE", flows: ["FL-001", "FL-014"], locale: "ko", description: "city controls and map key in Korean" },
  { id: "B-PX-CITY-LIST-EN", state: "CITY-LIST", flows: ["FL-001"], locale: "en", description: "sourced food list" },
  { id: "B-PX-CITY-FALLBACK-KO", state: "CITY-FALLBACK", flows: ["FL-001"], locale: "ko", description: "tile failure list and retry" },
  { id: "B-PX-PLACE-PEEK-EN", state: "PLACE-PEEK", flows: ["FL-001"], locale: "en", description: "canonical selected place peek" },
  { id: "B-PX-PLACE-DETAIL-EN", state: "PLACE-DETAIL", flows: ["FL-001", "FL-010", "FL-011", "FL-012", "FL-016"], locale: "en", description: "canonical place facts and actions" },
  { id: "B-PX-PLACE-DETAIL-KO", state: "PLACE-DETAIL", flows: ["FL-001", "FL-010", "FL-011", "FL-012", "FL-016"], locale: "ko", description: "canonical detail Korean wrapping" },
  { id: "B-PX-GATE-ACCOUNT-EN", state: "GATE-ACCOUNT", flows: ["FL-010", "FL-011"], locale: "en", description: "account JIT gate" },
  { id: "B-PX-GATE-ACCOUNT-FAIL-KO", state: "GATE-ACCOUNT-FAIL", flows: ["FL-010"], locale: "ko", description: "account retry and unchanged return" },
  { id: "B-PX-GATE-PERSON-PASSPORT-EN", state: "GATE-PERSON-PASSPORT", flows: ["FL-002", "FL-006", "FL-012"], locale: "en", description: "provider-neutral visitor person check" },
  { id: "B-PX-GATE-PERSON-CX-KO", state: "GATE-PERSON-CX", flows: ["FL-005"], locale: "ko", description: "Korean OmniOne CX simulation route" },
  { id: "B-PX-GATE-RESIDENCE-UNSUPPORTED-EN", state: "GATE-PERSON-RESIDENCE-UNSUPPORTED", flows: ["FL-006"], locale: "en", description: "Residence Card unsupported and alternate" },
  { id: "B-PX-GATE-AGE-EN", state: "GATE-AGE", flows: ["FL-002", "FL-013"], locale: "en", description: "age-only gate" },
  { id: "B-PX-GATE-AGE-FAIL-KO", state: "GATE-AGE-FAIL", flows: ["FL-002", "FL-013"], locale: "ko", description: "age proof retry" },
  { id: "B-PX-GATE-PAYMENT-EN", state: "GATE-PAYMENT", flows: ["FL-017"], locale: "en", description: "Payment KYC isolated gate" },
  { id: "B-PX-GATE-PAYMENT-FAIL-KO", state: "GATE-PAYMENT-FAIL", flows: ["FL-017"], locale: "ko", description: "Payment KYC failure and retry" },
  { id: "B-PX-AFTER19-EN", state: "AFTER19", flows: ["FL-002", "FL-013", "FL-014"], locale: "en", description: "verified night layer and immediate off" },
  { id: "B-PX-TABLES-LIST-EN", state: "TABLES-LIST", flows: ["FL-003"], locale: "en", description: "Tables index" },
  { id: "B-PX-TABLE-DETAIL-KO", state: "TABLE-DETAIL", flows: ["FL-003"], locale: "ko", description: "Table detail and trust boundary" },
  { id: "B-PX-TABLE-JOIN-FAIL-EN", state: "TABLE-JOIN-FAIL", flows: ["FL-003"], locale: "en", description: "retryable Table join failure" },
  { id: "B-PX-CHAT-EN", state: "CHAT", flows: ["FL-003"], locale: "en", description: "confirmed member chat" },
  { id: "B-PX-CHAT-IMAGE-FAIL-EN", state: "CHAT-IMAGE-FAIL", flows: ["FL-003"], locale: "en", description: "device-local image failure and retry" },
  { id: "B-PX-FEEDBACK-KO", state: "FEEDBACK", flows: ["FL-003", "FL-015"], locale: "ko", description: "post-meal structured feedback" },
  { id: "B-PX-REPORT-EN", state: "REPORT", flows: ["FL-003"], locale: "en", description: "report and block confirmation" },
  { id: "B-PX-LOCAL-SIGNAL-EMPTY-EN", state: "LOCAL-SIGNAL-EMPTY", flows: ["FL-012"], locale: "en", description: "required note-or-photo empty state" },
  { id: "B-PX-LOCAL-SIGNAL-FAIL-KO", state: "LOCAL-SIGNAL-FAIL", flows: ["FL-012"], locale: "ko", description: "draft-preserving submit failure" },
  { id: "B-PX-LOCAL-SIGNAL-SUCCESS-EN", state: "LOCAL-SIGNAL-SUCCESS", flows: ["FL-012", "FL-015"], locale: "en", description: "simulated contribution boundary" },
  { id: "B-PX-CHECKOUT-IDLE-EN", state: "CHECKOUT-IDLE", flows: ["FL-004", "FL-017"], locale: "en", description: "KRW price and OOKRW read-only settlement" },
  { id: "B-PX-CHECKOUT-CANCEL-KO", state: "CHECKOUT-CANCEL", flows: ["FL-004"], locale: "ko", description: "cancel with no receipt or stamp" },
  { id: "B-PX-CHECKOUT-FAIL-EN", state: "CHECKOUT-FAIL", flows: ["FL-004"], locale: "en", description: "decline with invariants" },
  { id: "B-PX-CHECKOUT-RECEIPT-EN", state: "CHECKOUT-RECEIPT", flows: ["FL-004"], locale: "en", description: "simulated receipt before visit proof" },
  { id: "B-PX-CHECKOUT-STAMP-KO", state: "CHECKOUT-STAMP", flows: ["FL-004"], locale: "ko", description: "separate unique visit creates stamp ten" },
  { id: "B-PX-MY-EN", state: "MY", flows: ["FL-004", "FL-011", "FL-015"], locale: "en", description: "saved canonical venue and stamp milestone" },
  { id: "B-PX-PROFILE-KO", state: "PROFILE", flows: ["FL-015"], locale: "ko", description: "optional public profile controls" },
  { id: "B-PX-TRUST-FOUR-AXES-EN", state: "TRUST-FOUR-AXES", flows: ["FL-003", "FL-012", "FL-015"], locale: "en", description: "separate reputation axes" },
  { id: "B-PX-LABS-EN", state: "LABS", flows: ["FL-004", "FL-016", "FL-018"], locale: "en", description: "Labs truth and signer boundary" },
  { id: "B-PX-LABS-TRAIT-FAIL-KO", state: "LABS-TRAIT-FAIL", flows: ["FL-016"], locale: "ko", description: "merchant trait negative contract" },
  { id: "B-PX-LABS-BRIDGE-FAIL-EN", state: "LABS-BRIDGE-FAIL", flows: ["FL-018"], locale: "en", description: "ordered bridge failure with assets unchanged" },
  { id: "B-PX-LABS-BRIDGE-SUCCESS-EN", state: "LABS-BRIDGE-SUCCESS", flows: ["FL-018"], locale: "en", description: "read-only bridge receipt" },
] as const

/**
 * Follow-up captures to generate after this evidence harness is cherry-picked
 * onto final integration e154b2d. They are implemented product states there,
 * not product gaps; source c1433a9 predates their selectors.
 */
export const B_INTEGRATION_FOLLOWUP_BASELINES = [
  {
    id: "B-PX-FOLLOWUP-FL002-LOCKED-VENUE-RETURN",
    flow: "FL-002" as const,
    selector: "canonical-after19-access / canonical-after19-unlock",
    reason: "Implemented in final integration e154b2d; capture locked venue, gate, and exact return after the harness is cherry-picked.",
  },
  {
    id: "B-PX-FOLLOWUP-FL011-SAVE-FAILURE-RETRY",
    flow: "FL-011" as const,
    selector: "canonical-save-error / canonical-save-retry",
    reason: "Implemented in final integration e154b2d; capture save failure and retry after the harness is cherry-picked.",
  },
] as const

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64")

const DETERMINISTIC_TILEJSON = {
  tilejson: "3.0.0",
  name: "ONDO visual evidence blank basemap",
  tiles: ["https://tiles.openfreemap.org/ondo-qa-empty/{z}/{x}/{y}.pbf"],
  minzoom: 0,
  maxzoom: 18,
  bounds: [124, 33, 132, 39],
}

export async function prepareBVisualPage(page: Page, { mapFailure = false }: { mapFailure?: boolean } = {}) {
  installBRuntimeGuard(page)
  await prepareBPage(page)
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" })
  await page.route("https://tiles.openfreemap.org/planet", async (route) => {
    if (mapFailure) await route.abort("internetdisconnected")
    else await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(DETERMINISTIC_TILEJSON) })
  })
  await page.route("https://tiles.openfreemap.org/ondo-qa-empty/**", async (route) => {
    if (mapFailure) await route.abort("internetdisconnected")
    else await route.fulfill({ status: 200, contentType: "application/x-protobuf", body: Buffer.alloc(0) })
  })
  await page.addInitScript(() => {
    const install = () => {
      const style = document.createElement("style")
      style.dataset.ondoVisualFreeze = "true"
      style.textContent = `
        *,*::before,*::after {
          animation-delay: 0s !important;
          animation-duration: 0s !important;
          animation-iteration-count: 1 !important;
          caret-color: transparent !important;
          scroll-behavior: auto !important;
          transition-delay: 0s !important;
          transition-duration: 0s !important;
        }
        nextjs-portal { display: none !important; }
      `
      document.head.append(style)
    }
    if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", install, { once: true })
    else install()
  })
}

async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  })
}

async function openCity(page: Page) {
  await gotoB(page)
  await page.locator("[data-city='seoul']").click()
  await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
  await expect.poll(async () => Number(await page.getByTestId("ondo-b-map-entry").getAttribute("data-rendered-signal-count")), { timeout: 10_000 }).toBeGreaterThan(0)
}

async function openLocalSignal(page: Page, query = "") {
  await openCanonicalVenue(page, { query })
  await page.getByTestId("canonical-venue-signal").click()
  await expect(page.getByTestId("local-signal-overlay")).toBeVisible()
}

async function triggerPersonGate(page: Page, locale: BLocale, persona: NonNullable<BSessionSeed["persona"]>) {
  await seedB(page, { locale, session: { persona, account: "ACC-ACTIVE", person: "PER-UNVERIFIED", paymentKyc: "PKY-NOT-STARTED" } })
  await openLocalSignal(page)
  await page.getByTestId("local-signal-overlay").locator("textarea").fill(locale === "ko" ? "주문은 입구에서 해요." : "Order beside the entrance.")
  await page.getByTestId("local-signal-submit").click()
  await expect(page.getByTestId("ondo-gate-overlay")).toBeVisible()
}

async function triggerAgeGate(page: Page, locale: BLocale) {
  await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", age: "AGE-UNVERIFIED", paymentKyc: "PKY-NOT-STARTED" } })
  await openCity(page)
  await page.getByRole("button", { name: "After 19", exact: true }).click()
  await page.getByRole("button", { name: /Confirm 19\+|19\+ 확인/ }).click()
  await expect(page.getByTestId("ondo-gate-overlay")).toBeVisible()
}

async function triggerPaymentGate(page: Page, locale: BLocale) {
  await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", paymentKyc: "PKY-NOT-STARTED" } })
  await openCanonicalVenue(page)
  await page.getByTestId("canonical-venue-checkout").click()
  await page.getByTestId("checkout-start").click()
  await expect(page.getByTestId("ondo-gate-overlay")).toBeVisible()
}

async function openTablesIndex(page: Page, locale: BLocale, query = "") {
  await gotoB(page, query)
  await page.getByRole("navigation").locator("button").nth(2).click()
  await expect(page.getByTestId("tables-entry")).toBeVisible()
}

async function openTableDetail(page: Page, locale: BLocale, query = "") {
  await openTablesIndex(page, locale, query)
  await page.locator(`[data-table-id='${TABLE_ID}']`).first().click()
  await expect(page.locator("[data-table-membership]")).toBeVisible()
}

async function openChat(page: Page, locale: BLocale, query = "") {
  await seedB(page, {
    locale,
    session: {
      account: "ACC-ACTIVE",
      person: "PER-VERIFIED",
      age: "AGE-VERIFIED",
      ageExpiresAt: "2026-08-20T20:30:00+09:00",
      paymentKyc: "PKY-VERIFIED",
      tableMembershipById: { [TABLE_ID]: "confirmed" },
    },
  })
  await openTablesIndex(page, locale, query)
  const joined = page.getByRole("region", { name: locale === "ko" ? "참여 중" : "Joined" })
  await joined.locator(`[data-table-id='${TABLE_ID}']`).click()
  const openedDirectly = await page.getByTestId("table-chat").waitFor({ state: "visible", timeout: 1_500 }).then(() => true).catch(() => false)
  if (!openedDirectly) {
    await page.getByRole("button", { name: locale === "ko" ? "대화 열기" : "Open chat" }).click()
  }
  await expect(page.getByTestId("table-chat")).toBeVisible()
}

async function openCheckout(page: Page, locale: BLocale, query = "") {
  await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", paymentKyc: "PKY-VERIFIED", stamps: 9 } })
  await openCanonicalVenue(page, { query })
  await page.getByTestId("canonical-venue-checkout").click()
  await expect(page.getByTestId("checkout-overlay")).toBeVisible()
}

async function openPreparedLabs(page: Page, locale: BLocale, query = "") {
  await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", paymentKyc: "PKY-VERIFIED", stamps: 10 } })
  await gotoB(page, query)
  await openLabs(page)
}

export async function setupBVisualCase(page: Page, item: BVisualCase): Promise<Locator> {
  const { locale, state } = item
  if (state === "ONBOARDING-VALUE" || state === "ONBOARDING-PERSONAS" || state === "ONBOARDING-PREFERENCES") {
    await seedFreshOnboarding(page, locale)
    await gotoB(page)
    if (state !== "ONBOARDING-VALUE") {
      await page.getByTestId("onboarding-step-value").locator("button").first().click()
      await expect(page.getByTestId("onboarding-step-intent")).toBeVisible()
    }
    if (state === "ONBOARDING-PREFERENCES") {
      await page.getByTestId("persona-short_term").click()
      await page.getByTestId("onboarding-step-intent").locator("button").filter({ has: page.locator("svg") }).last().click()
      await expect(page.getByTestId("onboarding-step-preferences")).toBeVisible()
      await page.getByTestId("onboarding-step-preferences").locator("button").nth(1).click()
    }
    await settle(page)
    return page.getByTestId("ondo-onboarding")
  }

  if (state === "NATION") {
    await seedB(page, { locale })
    await gotoB(page)
  } else if (state === "CITY-LIVE" || state === "CITY-LIST") {
    await seedB(page, { locale })
    await openCity(page)
    if (state === "CITY-LIST") await page.getByRole("button", { name: locale === "ko" ? "목록" : "List" }).click()
  } else if (state === "CITY-FALLBACK") {
    await seedB(page, { locale })
    await gotoB(page)
    await page.locator("[data-city='seoul']").click()
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-map-state", "error", { timeout: 20_000 })
    await expect(page.getByTestId("ondo-b-venue-list")).toBeVisible()
  } else if (state === "PLACE-PEEK" || state === "PLACE-DETAIL") {
    await seedB(page, { locale })
    await openCanonicalVenue(page, { expanded: state === "PLACE-DETAIL" })
  } else if (state === "GATE-ACCOUNT" || state === "GATE-ACCOUNT-FAIL") {
    await seedB(page, { locale, session: { account: "ACC-GUEST", person: "PER-UNVERIFIED", paymentKyc: "PKY-NOT-STARTED" } })
    await openCanonicalVenue(page)
    await page.getByTestId("canonical-venue-save").click()
    if (state === "GATE-ACCOUNT-FAIL") await page.getByRole("button", { name: locale === "ko" ? "실패 상태 보기" : "Simulate failure" }).click()
  } else if (state === "GATE-PERSON-PASSPORT") {
    await triggerPersonGate(page, locale, "short_term")
  } else if (state === "GATE-PERSON-CX") {
    await triggerPersonGate(page, locale, "korean_local")
  } else if (state === "GATE-PERSON-RESIDENCE-UNSUPPORTED") {
    await triggerPersonGate(page, locale, "long_term_resident")
    await page.getByRole("button", { name: locale === "ko" ? "미연결 상태 보기" : "Show unavailable route" }).click()
    await expect(page.getByTestId("gate-unsupported")).toBeVisible()
  } else if (state === "GATE-AGE" || state === "GATE-AGE-FAIL") {
    await triggerAgeGate(page, locale)
    if (state === "GATE-AGE-FAIL") await page.getByRole("button", { name: locale === "ko" ? "실패 상태 보기" : "Simulate failure" }).click()
  } else if (state === "GATE-PAYMENT" || state === "GATE-PAYMENT-FAIL") {
    await triggerPaymentGate(page, locale)
    if (state === "GATE-PAYMENT-FAIL") await page.getByRole("button", { name: locale === "ko" ? "실패 상태 보기" : "Simulate failure" }).click()
  } else if (state === "AFTER19") {
    await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", age: "AGE-VERIFIED", ageExpiresAt: "2026-08-20T20:30:00+09:00", after19: "A19-OFF" } })
    await openCity(page)
    await expect(page.getByTestId("after19-auto-banner")).toBeVisible()
  } else if (state === "TABLES-LIST") {
    await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED" } })
    await openTablesIndex(page, locale)
  } else if (state === "TABLE-DETAIL") {
    await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", age: "AGE-VERIFIED", ageExpiresAt: "2026-08-20T20:30:00+09:00" } })
    await openTableDetail(page, locale)
  } else if (state === "TABLE-JOIN-FAIL") {
    await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", age: "AGE-VERIFIED", ageExpiresAt: "2026-08-20T20:30:00+09:00" } })
    await openTableDetail(page, locale, "?scenario=table-network")
    await page.getByTestId("table-join").click()
    await expect(page.locator("[data-table-membership='TMB-FAILED']")).toBeVisible()
  } else if (["CHAT", "CHAT-IMAGE-FAIL", "FEEDBACK", "REPORT"].includes(state)) {
    await openChat(page, locale, state === "CHAT-IMAGE-FAIL" ? "?scenario=media-failed" : "")
    if (state === "CHAT-IMAGE-FAIL") {
      await page.locator("input[type='file']").setInputFiles({ name: "table-photo.png", mimeType: "image/png", buffer: PNG })
      await page.getByRole("button", { name: locale === "ko" ? "사진 보내기" : "Send photo" }).click()
      await expect(page.locator("[data-message-status='MSG-FAILED']")).toBeVisible()
    } else if (state === "FEEDBACK") {
      await page.getByTestId("table-check-in").click()
      await page.getByTestId("table-finish-meal").click()
      await expect(page.getByTestId("table-feedback")).toBeVisible()
    } else if (state === "REPORT") {
      await page.getByTestId("table-report").click()
      await expect(page.getByRole("alertdialog")).toBeVisible()
    }
  } else if (state === "LOCAL-SIGNAL-EMPTY" || state === "LOCAL-SIGNAL-FAIL" || state === "LOCAL-SIGNAL-SUCCESS") {
    await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED" } })
    await openLocalSignal(page, state === "LOCAL-SIGNAL-FAIL" ? "scenario=local-signal-fail" : "")
    if (state !== "LOCAL-SIGNAL-EMPTY") {
      await page.getByTestId("local-signal-overlay").locator("textarea").fill(locale === "ko" ? "입구 옆 카운터에서 주문해요." : "Order at the counter beside the entrance.")
      await page.getByTestId("local-signal-submit").click()
      await expect(page.getByTestId("local-signal-overlay")).toHaveAttribute("data-signal-status", state === "LOCAL-SIGNAL-FAIL" ? "failed" : "submitted")
    }
  } else if (state.startsWith("CHECKOUT-")) {
    await openCheckout(page, locale, state === "CHECKOUT-FAIL" ? "scenario=payment-declined" : "")
    if (state !== "CHECKOUT-IDLE") {
      await page.getByTestId("checkout-start").click()
      if (state === "CHECKOUT-CANCEL") await page.getByTestId("checkout-cancel").click()
      else {
        await page.getByTestId("checkout-confirm").click()
        await expect(page.getByTestId("checkout-overlay")).toHaveAttribute("data-payment-state", state === "CHECKOUT-FAIL" ? "PAY-FAILED" : "PAY-SIMULATED-SUCCESS")
        if (state === "CHECKOUT-STAMP") {
          await page.getByTestId("visit-proof-check").click()
          await expect(page.getByTestId("checkout-overlay")).toHaveAttribute("data-stamp-count", "10")
        }
      }
    }
  } else if (state === "MY") {
    await seedB(page, { locale, local: { savedVenueIds: [CANONICAL_VENUE_ID] }, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", stamps: 10 } })
    await gotoB(page)
    await page.getByRole("navigation").locator("button").nth(1).click()
    await expect(page.getByTestId("ondo-my-entry")).toBeVisible()
  } else if (state === "PROFILE" || state === "TRUST-FOUR-AXES") {
    await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", reputation: { identity: "verified", visit: "repeat", contribution: "established", meetup: "reliable" } } })
    await gotoB(page)
    await page.getByRole("navigation").locator("button").nth(3).click()
    const target = page.getByTestId(state === "PROFILE" ? "ondo-profile-panel" : "ondo-trust-panel")
    await target.scrollIntoViewIfNeeded()
  } else {
    const query = state === "LABS-TRAIT-FAIL" ? "?scenario=trait-retry-fail" : state === "LABS-BRIDGE-FAIL" ? "?scenario=bridge-failed" : ""
    await openPreparedLabs(page, locale, query)
    if (state !== "LABS") {
      const acknowledge = page.getByTestId("labs-acknowledge")
      if (await acknowledge.isVisible().catch(() => false)) await acknowledge.click()
      await expect(page.getByTestId("labs-overlay")).toBeVisible()
    }
    if (state === "LABS-TRAIT-FAIL") {
      await page.getByTestId("trait-retry-offer-foreign-card").scrollIntoViewIfNeeded()
      await page.getByTestId("trait-retry-offer-foreign-card").click()
      await expect(page.locator("[data-trait-state='failed']").first()).toBeVisible()
    } else if (state === "LABS-BRIDGE-FAIL" || state === "LABS-BRIDGE-SUCCESS") {
      await page.getByTestId("labs-connect-wallet").click()
      await expect(page.getByTestId("labs-overlay")).toHaveAttribute("data-wallet-state", "WAL-READY")
      await page.getByTestId("labs-bridge-quote").click()
      await page.getByTestId("labs-bridge-confirm").click()
      await page.getByTestId("labs-bridge-submit").click()
      const advances = state === "LABS-BRIDGE-FAIL" ? 2 : 3
      for (let index = 0; index < advances; index += 1) await page.getByTestId("labs-bridge-advance").click()
      await expect(page.getByTestId("labs-overlay")).toHaveAttribute("data-bridge-state", state === "LABS-BRIDGE-FAIL" ? "BRG-FAILED" : "BRG-SIMULATED-SUCCESS")
      await page.getByTestId(state === "LABS-BRIDGE-FAIL" ? "labs-bridge-quote" : "labs-bridge-receipt").scrollIntoViewIfNeeded()
    }
  }

  await settle(page)
  return page.getByTestId("ondo-b-root")
}

export async function collectBGeometryIssues(page: Page) {
  return page.getByTestId("ondo-b-root").evaluate((root) => {
    const viewport = { width: window.innerWidth, height: window.innerHeight }
    const rootRect = root.getBoundingClientRect()
    const visibleRect = (rect: DOMRect) => rect.bottom > 0 && rect.right > 0 && rect.top < viewport.height && rect.left < viewport.width
    const hitTestable = (element: HTMLElement, rect: DOMRect) => {
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2
      if (x < 0 || x >= viewport.width || y < 0 || y >= viewport.height) return false
      const top = document.elementFromPoint(x, y)
      return top != null && (top === element || element.contains(top))
    }
    const label = (element: HTMLElement) => {
      const copy = element.getAttribute("aria-label") ?? element.textContent?.trim().replace(/\s+/g, " ").slice(0, 90)
      return `${element.tagName.toLowerCase()}${element.dataset.testid ? `[${element.dataset.testid}]` : ""}${copy ? ` · ${copy}` : ""}`
    }
    const controls = Array.from(root.querySelectorAll<HTMLElement>("button:not([disabled]),a[href],input:not([type='hidden']):not([disabled]),select:not([disabled]),textarea:not([disabled]),[role='button']"))
      .map((element) => ({ element, rect: element.getBoundingClientRect() }))
      .filter(({ element, rect }) => rect.width > 0 && rect.height > 0 && visibleRect(rect) && hitTestable(element, rect) && element.getAttribute("aria-hidden") !== "true" && element.tabIndex >= 0)
    const clippedControls = controls.flatMap(({ element, rect }) => (
      rect.left < rootRect.left - 1 || rect.right > rootRect.right + 1 || rect.top < rootRect.top - 1 || rect.bottom > rootRect.bottom + 1
        ? [{ control: label(element), rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) } }]
        : []
    ))
    const undersizedControls = controls.flatMap(({ element, rect }) => {
      const wrappingLabel = element.matches("input,select,textarea") ? element.closest("label") : null
      const labelRect = wrappingLabel?.getBoundingClientRect()
      const effectiveWidth = labelRect && labelRect.width >= rect.width ? labelRect.width : rect.width
      const effectiveHeight = labelRect && labelRect.height >= rect.height ? labelRect.height : rect.height
      return effectiveWidth < 44 || effectiveHeight < 44
        ? [{ control: label(element), width: Math.round(effectiveWidth), height: Math.round(effectiveHeight) }]
        : []
    })
    const overlaps: Array<{ first: string; second: string }> = []
    for (let first = 0; first < controls.length; first += 1) {
      for (let second = first + 1; second < controls.length; second += 1) {
        const a = controls[first]
        const b = controls[second]
        if (a.element.contains(b.element) || b.element.contains(a.element)) continue
        const overlapWidth = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left)
        const overlapHeight = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top)
        if (overlapWidth > 2 && overlapHeight > 2) overlaps.push({ first: label(a.element), second: label(b.element) })
      }
    }
    const metadata = Array.from(root.querySelectorAll<HTMLElement>("small,time,code,dt,dd,figcaption"))
      .map((element) => ({ element, rect: element.getBoundingClientRect(), fontSize: Number.parseFloat(getComputedStyle(element).fontSize) }))
      .filter(({ element, rect }) => element.textContent?.trim() && rect.width > 0 && rect.height > 0 && visibleRect(rect))
      .flatMap(({ element, fontSize }) => fontSize < 12 ? [{ text: label(element), fontSize }] : [])
    return {
      rootOverflowX: Math.max(0, root.scrollWidth - root.clientWidth),
      clippedControls,
      metadata,
      overlaps,
      undersizedControls,
    }
  })
}

export async function expectBVisualGuards(page: Page, scope: Locator, testInfo: TestInfo) {
  const geometry = await collectBGeometryIssues(page)
  await testInfo.attach("geometry.json", { body: JSON.stringify(geometry, null, 2), contentType: "application/json" })
  expect.soft(geometry.rootOverflowX, "horizontal clipping/overflow").toBeLessThanOrEqual(1)
  expect.soft(geometry.clippedControls, "hit-testable controls clipped by the app canvas").toEqual([])
  expect.soft(geometry.undersizedControls, "hit-testable controls below 44×44 CSS px").toEqual([])
  expect.soft(geometry.metadata, "visible metadata below 12 CSS px").toEqual([])
  expect.soft(geometry.overlaps, "independent hit-testable controls overlap").toEqual([])

  const axe = await new AxeBuilder({ page }).include(await scope.evaluate((node) => {
    if (!node.id) node.id = `ondo-b-evidence-${Math.random().toString(36).slice(2)}`
    return `#${CSS.escape(node.id)}`
  })).analyze()
  const actionable = axe.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")
  await testInfo.attach("axe.json", { body: JSON.stringify(axe, null, 2), contentType: "application/json" })
  expect.soft(actionable, "serious/critical axe violations").toEqual([])
}

export async function closeBVisualCase(page: Page) {
  await expectBRuntimeClean(page)
}

export function bSnapshotName(item: BVisualCase, viewport: "390x844" | "1440x1000") {
  return `${item.id}__${item.flows.join("+")}__${item.locale}__${viewport}.png`
}

export function attachBCaseMetadata(testInfo: TestInfo, item: BVisualCase, viewport: "390x844" | "1440x1000") {
  return testInfo.attach("evidence-case.json", {
    body: JSON.stringify({ ...item, viewport, sourceRoute: "/ondo-b", tilePolicy: "external vector tiles replaced; ONDO overlays unmasked" }, null, 2),
    contentType: "application/json",
  })
}

// Kept exported so registry tests can prove the helper did not accidentally
// regress the exact partial states while FL-002/FL-011 product gaps are closed.
export { expectBRuntimeClean, finishAgeGate }
