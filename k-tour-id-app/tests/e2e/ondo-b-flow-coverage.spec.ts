import { expect, test, type Page } from "@playwright/test"
import {
  allowBNextNavigationAbort, B_ACTION_GATE_KEY, B_ACTIVITY_PROFILE_KEY, B_AFTER19_SESSION_KEY, B_DEVICE_KEY,
  B_FLOW_CONTRACTS, CANONICAL_VENUE_ID, expectBRuntimeClean, expectNoRawTruthLeaks,
  finishAccountGate, gotoB, installBRuntimeGuard, openCanonicalVenue, openLabs, openTables,
  prepareBPage, seedB, seedFreshOnboarding, sessionState, TABLE_ID,
} from "../helpers/ondo-b-qa"

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64")
const title = (flow: string) => B_FLOW_CONTRACTS.find((item) => item.flow === flow)!.testTitle
const evidence = (flow: string, points: string) => `B-E2E-${flow}-${points}`
type Qa = {
  actionGate?: Partial<Record<"account" | "person" | "age" | "payment_kyc", "failure" | "unavailable" | "expired">>
  after19Global?: "failure"
  payment?: "failure" | "insufficient"
  profile?: "failure"
  tableMessage?: "failure"
}

async function setQa(page: Page, patch: Qa) {
  await page.evaluate((next) => {
    const target = window as typeof window & { __ONDO_B_QA__?: Qa }
    target.__ONDO_B_QA__ = { ...target.__ONDO_B_QA__, ...next, actionGate: { ...target.__ONDO_B_QA__?.actionGate, ...next.actionGate } }
  }, patch)
}

async function clearAfter19Qa(page: Page) {
  await page.evaluate(() => {
    const target = window as typeof window & { __ONDO_B_QA__?: Qa }
    if (target.__ONDO_B_QA__) delete target.__ONDO_B_QA__.after19Global
  })
}

async function stored(page: Page, kind: "local" | "session", key: string) {
  return page.evaluate(({ storageKind, storageKey }) => {
    const storage = storageKind === "local" ? localStorage : sessionStorage
    return JSON.parse(storage.getItem(storageKey) ?? "{}") as Record<string, unknown>
  }, { storageKind: kind, storageKey: key })
}

async function failNextDeviceWrite(page: Page) {
  await page.evaluate((targetKey) => {
    const original = Storage.prototype.setItem
    let failed = false
    Storage.prototype.setItem = function setItem(key: string, value: string) {
      if (!failed && this === localStorage && key === targetKey) {
        failed = true
        throw new DOMException("Injected ONDO device write failure", "QuotaExceededError")
      }
      return original.call(this, key, value)
    }
  }, B_DEVICE_KEY)
}

async function openSignal(page: Page, note: string) {
  await page.getByTestId("canonical-local-signal-open").click()
  const signal = page.getByTestId("ondo-b-local-signal")
  await expect(signal).toHaveAttribute("data-venue-id", CANONICAL_VENUE_ID)
  await signal.getByRole("button", { name: "Calm right now", exact: true }).click()
  await signal.getByRole("textbox", { name: "Optional local note" }).fill(note)
  return signal
}

async function openOffer(page: Page) {
  await page.getByTestId("canonical-meal-benefit-open").click()
  const offer = page.getByTestId("ondo-b-id-wallet-commerce")
  await expect(offer).toHaveAttribute("data-origin-venue-id", CANONICAL_VENUE_ID)
  return offer
}

async function preparePayment(page: Page) {
  const offer = page.getByTestId("ondo-b-id-wallet-commerce")
  if (await offer.getAttribute("data-wallet-status") !== "ready") {
    await offer.getByTestId("payment-confirm").click()
    const sheet = page.getByTestId("wallet-connect-sheet")
    await sheet.getByRole("button", { name: "Set up travel wallet", exact: true }).click()
    await expect(sheet).toBeHidden()
  }
  await offer.getByTestId("benefit-accept").click()
  await offer.getByTestId("payment-minimum-consent").getByRole("checkbox").check()
  return offer
}

async function resetOnboarding(page: Page) {
  await page.evaluate((key) => {
    const current = JSON.parse(localStorage.getItem(key) ?? "{}") as Record<string, unknown>
    localStorage.setItem(key, JSON.stringify({ ...current, onboarding: "ONB-NEW", persona: null, discoveryPreferences: [] }))
  }, B_DEVICE_KEY)
  await page.reload({ waitUntil: "domcontentloaded" })
}

test.describe("ONDO B canonical flow journeys", () => {
  test.beforeEach(async ({ page }) => {
    installBRuntimeGuard(page)
    await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("blockedbyclient"))
    await prepareBPage(page)
  })
  test.afterEach(async ({ page }) => expectBRuntimeClean(page))

  test(title("FL-001"), async ({ page }) => {
    await seedB(page)
    await test.step(evidence("FL-001", "ENTRY/DECISION"), async () => {
      await gotoB(page)
      await page.locator("[data-city='seoul'][data-official-count='200']").click()
      await expect(page.getByTestId("ondo-b-result-truth")).toContainText("200 places")
      await expect(page.getByTestId("ondo-b-view-toggle")).toContainText("List")
    })
    await test.step(evidence("FL-001", "ERROR/RETRY"), async () => {
      const map = page.getByTestId("ondo-b-map-entry")
      await expect(map).toHaveAttribute("data-map-state", "error", { timeout: 12_000 })
      await expect(page.getByTestId("ondo-b-venue-list")).toBeVisible()
      await page.getByTestId("ondo-b-map-fallback-status").getByRole("button", { name: "Retry map" }).click()
      await expect(map).toHaveAttribute("data-map-attempt", "2")
    })
    await test.step(evidence("FL-001", "TERMINAL"), async () => {
      await page.getByTestId("ondo-b-venue-list").locator(`[data-venue-id='${CANONICAL_VENUE_ID}'] button`).click()
      await page.getByTestId("canonical-place-details").click()
      await expect(page.getByTestId("canonical-source-evidence")).toBeVisible()
      await expectNoRawTruthLeaks(page, page.getByTestId("canonical-place-overlay"))
    })
    await test.step(evidence("FL-001", "CANCEL/RETURN"), async () => {
      await page.getByTestId("canonical-place-overlay").locator("header").getByRole("button", { name: "Back to place summary" }).click()
      await page.getByTestId("canonical-place-peek").getByRole("button", { name: "Close place" }).click()
      await expect(page.getByTestId("ondo-b-result-truth")).toContainText("200 places")
    })
  })

  test(title("FL-002"), async ({ page }) => {
    await seedB(page, { session: { account: "ACC-ACTIVE", person: "PER-VERIFIED" } })
    await test.step(evidence("FL-002", "ENTRY/DECISION/CANCEL"), async () => {
      await openCanonicalVenue(page)
      const access = page.getByTestId("canonical-after19-access")
      await expect(access).toHaveAttribute("data-after19-venue-status", "locked")
      await page.getByTestId("canonical-after19-unlock").click()
      await expect(page.getByTestId("global-after19-return-context")).toHaveAttribute("data-return-venue", CANONICAL_VENUE_ID)
      await page.getByTestId("global-after19-cancel").click()
      await expect(access).toHaveAttribute("data-after19-venue-status", "locked")
    })
    await test.step(evidence("FL-002", "ERROR/RETRY"), async () => {
      await setQa(page, { after19Global: "failure" })
      await page.getByTestId("canonical-after19-unlock").click()
      await page.getByTestId("global-after19-confirm").click()
      await expect(page.getByTestId("global-after19-prompt-layer").getByRole("dialog")).toHaveAttribute("data-gate-view", "failure")
      await clearAfter19Qa(page)
      await page.getByTestId("global-after19-retry").click()
    })
    await test.step(evidence("FL-002", "TERMINAL/RETURN"), async () => {
      await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
      await expect(page.getByTestId("canonical-after19-access")).toHaveAttribute("data-after19-venue-status", "unlocked")
      await expect(page.getByTestId("global-after19-banner")).toBeVisible()
      await expect(page).toHaveURL(new RegExp(`venueId=${CANONICAL_VENUE_ID}`))
      expect(await sessionState(page)).toMatchObject({ age: "AGE-VERIFIED", paymentKyc: "PKY-NOT-STARTED", after19: "A19-ON" })
    })
  })

  test(title("FL-003"), async ({ page }) => {
    const draft = "Window seat if available."
    await seedB(page)
    await gotoB(page)
    await openTables(page)
    await page.getByTestId("table-join-draft").fill(draft)
    await test.step(evidence("FL-003", "ENTRY/DECISION/CANCEL"), async () => {
      await page.getByTestId("table-join").click()
      const gate = page.getByTestId("ondo-b-action-gate")
      await expect(gate).toHaveAttribute("data-active-gate", "account")
      await expect(page.getByTestId("action-gate-return-context")).toHaveAttribute("data-return-table", TABLE_ID)
      await gate.getByTestId("action-gate-cancel").click()
      await expect(page.getByTestId("table-join-draft")).toHaveValue(draft)
    })
    await test.step(evidence("FL-003", "ERROR/RETRY"), async () => {
      await setQa(page, { actionGate: { age: "failure" } })
      await page.getByTestId("table-join").click()
      const gate = page.getByTestId("ondo-b-action-gate")
      await gate.getByTestId("action-gate-confirm").click()
      await expect(gate).toHaveAttribute("data-active-gate", "age")
      await gate.getByTestId("after19-start").click()
      await expect(gate).toHaveAttribute("data-gate-view", "failure")
      await gate.getByTestId("action-gate-retry").click()
      await gate.getByTestId("after19-start").click()
      await expect(page.getByTestId("table-join-confirmation")).toContainText(draft)
      await page.getByTestId("table-join-confirm").click()
    })
    await test.step(evidence("FL-003", "TERMINAL"), async () => {
      await page.getByTestId("table-open-chat").click()
      await setQa(page, { tableMessage: "failure" })
      await page.getByTestId("table-chat-compose").fill("See you by the entrance.")
      await page.getByTestId("table-chat-image").setInputFiles({ name: "meal.png", mimeType: "image/png", buffer: PNG })
      await page.getByTestId("table-message-send").click()
      await page.getByTestId("table-message-retry").click()
      await page.getByTestId("table-check-in").click()
      await page.getByRole("button", { name: "Helpful table", exact: true }).click()
      await page.getByTestId("table-feedback-submit").click()
      await expect(page.getByTestId("table-reputation-receipt")).toBeVisible()
    })
    await test.step(evidence("FL-003", "RETURN"), async () => {
      await page.getByTestId("table-leave").click()
      await page.getByRole("alertdialog").getByRole("button", { name: "Stay in this Table" }).click()
      await page.reload({ waitUntil: "domcontentloaded" })
      await openTables(page)
      await expect(page.getByTestId("table-detail")).toHaveAttribute("data-join-stage", "joined")
    })
  })

  test(title("FL-004"), async ({ page }) => {
    await seedB(page, { session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", paymentKyc: "PKY-VERIFIED", stamps: 9 } })
    await openCanonicalVenue(page)
    await test.step(evidence("FL-004", "ENTRY/DECISION/CANCEL"), async () => {
      const offer = await openOffer(page)
      await offer.getByTestId("commerce-payment-details").locator("summary").click()
      await expect(offer.getByTestId("commerce-fixed-quote-boundary")).toBeVisible()
      await offer.getByTestId("payment-cancel").click()
      await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
      expect((await stored(page, "local", B_DEVICE_KEY)).commerceReceipts).toEqual([])
    })
    await test.step(evidence("FL-004", "ERROR/RETRY"), async () => {
      await openOffer(page)
      const offer = await preparePayment(page)
      await setQa(page, { payment: "failure" })
      await offer.getByTestId("payment-confirm").click()
      await expect(offer.getByTestId("payment-recovery")).toHaveAttribute("data-recovery", "failure")
      await expect(offer.getByTestId("visit-stamp-receipt")).toHaveCount(0)
      await offer.getByTestId("payment-retry").click()
      await offer.getByTestId("payment-confirm").click()
      await expect(offer.getByTestId("payment-receipt")).toHaveAttribute("data-completion-kind", "receipt")
    })
    await test.step(evidence("FL-004", "TERMINAL/RETURN"), async () => {
      const offer = page.getByTestId("ondo-b-id-wallet-commerce")
      const stamp = offer.getByTestId("visit-stamp-receipt")
      await expect(stamp).toHaveAttribute("data-stamp-count", "9")
      await stamp.getByTestId("visit-proof-check").click()
      await expect(stamp).toHaveAttribute("data-stamp-count", "10")
      await offer.getByTestId("payment-receipt").locator("details summary").click()
      await offer.getByTestId("payment-refund").click()
      await expect(offer.getByTestId("payment-receipt")).toHaveAttribute("data-completion-kind", "refunded")
      const receipts = (await stored(page, "local", B_DEVICE_KEY)).commerceReceipts as Array<Record<string, unknown>>
      expect(receipts[0]).toMatchObject({ status: "refunded", receiptId: "ONDO-LOCAL-20260825-001", refundReceiptId: "ONDO-LOCAL-REFUND-20260825-001" })
      expect((await stored(page, "session", B_ACTIVITY_PROFILE_KEY)).stamps).toBe(10)
      await offer.getByTestId("payment-receipt-return").click()
      await expect(page.getByTestId("canonical-place-overlay")).toHaveAttribute("data-venue-id", CANONICAL_VENUE_ID)
    })
  })

  test(title("FL-005"), async ({ page }) => {
    const note = "The side counter is quieter after lunch."
    await seedB(page, { session: { persona: "local_contributor", account: "ACC-ACTIVE" } })
    await openCanonicalVenue(page)
    const signal = await openSignal(page, note)
    await test.step(evidence("FL-005", "ENTRY/DECISION/CANCEL"), async () => {
      await signal.getByTestId("local-signal-person-check").click()
      const gate = page.getByTestId("ondo-b-action-gate")
      await expect(gate).toHaveAttribute("data-person-route", "unselected")
      await gate.getByTestId("person-route-choice-mobile_id_cx").click()
      await expect(gate).toHaveAttribute("data-person-route", "mobile_id_cx")
      await expect(page.getByTestId("person-route-mobile_id_cx")).toBeVisible()
      await gate.getByTestId("action-gate-cancel").click()
      await expect(signal.getByRole("textbox", { name: "Optional local note" })).toHaveValue(note)
    })
    await test.step(evidence("FL-005", "ERROR/RETRY"), async () => {
      await setQa(page, { actionGate: { person: "failure" } })
      await signal.getByTestId("local-signal-person-check").click()
      const gate = page.getByTestId("ondo-b-action-gate")
      await gate.getByTestId("person-route-choice-mobile_id_cx").click()
      await gate.getByTestId("local-check-boundary-continue").click()
      await expect(gate.getByTestId("local-check-result")).toHaveAttribute("data-result", "failure")
      await gate.getByTestId("action-gate-retry").click()
      await gate.getByTestId("local-check-boundary-continue").click()
    })
    await test.step(evidence("FL-005", "TERMINAL/RETURN"), async () => {
      await expect(signal.getByTestId("local-signal-post")).toBeVisible()
      await expect(signal.getByRole("textbox", { name: "Optional local note" })).toHaveValue(note)
      expect(await sessionState(page)).toMatchObject({ person: "PER-VERIFIED", age: "AGE-UNVERIFIED", paymentKyc: "PKY-NOT-STARTED" })
    })
  })

  test(title("FL-006"), async ({ page }) => {
    const note = "A resident ordering note stays intact."
    await seedB(page, { session: { persona: "preparing", account: "ACC-ACTIVE" } })
    await openCanonicalVenue(page)
    const signal = await openSignal(page, note)
    await test.step(evidence("FL-006", "ENTRY/DECISION/CANCEL"), async () => {
      await signal.getByTestId("local-signal-person-check").click()
      const gate = page.getByTestId("ondo-b-action-gate")
      await expect(gate).toHaveAttribute("data-person-route", "unselected")
      await gate.getByTestId("person-route-choice-mobile_residence_card").click()
      await expect(gate).toHaveAttribute("data-person-route", "mobile_residence_card")
      await gate.getByTestId("action-gate-cancel").click()
      await expect(signal.getByRole("textbox", { name: "Optional local note" })).toHaveValue(note)
      await signal.getByTestId("local-signal-person-check").click()
    })
    await test.step(evidence("FL-006", "ERROR/RETRY"), async () => {
      const gate = page.getByTestId("ondo-b-action-gate")
      await gate.getByTestId("person-route-choice-mobile_residence_card").click()
      await gate.getByTestId("local-check-boundary-continue").click()
      await expect(gate.getByTestId("local-check-result")).toHaveAttribute("data-result", "unavailable")
      await gate.getByTestId("local-check-passport-alternate").click()
      await expect(gate).toHaveAttribute("data-person-route", "passport_ekyc")
      await gate.getByTestId("local-check-boundary-continue").click()
    })
    await test.step(evidence("FL-006", "TERMINAL/RETURN"), async () => {
      await expect(signal.getByTestId("local-signal-post")).toBeVisible()
      await expect(signal.getByRole("textbox", { name: "Optional local note" })).toHaveValue(note)
      expect(await sessionState(page)).toMatchObject({ person: "PER-VERIFIED", age: "AGE-UNVERIFIED", paymentKyc: "PKY-NOT-STARTED" })
    })
  })

  for (const [flowId, persona] of [["FL-007", "travelling"], ["FL-008", "local_contributor"], ["FL-009", "preparing"]] as const) {
    test(title(flowId), async ({ page }) => {
      await seedFreshOnboarding(page)
      await test.step(evidence(flowId, "ENTRY/CANCEL/RETURN"), async () => {
        await gotoB(page)
        await expect(page.getByTestId("onboarding-step-value")).toBeVisible()
        await page.getByTestId("onboarding-guest-skip").click()
        await expect(page.getByTestId("ondo-b-nation")).toBeVisible()
      })
      await resetOnboarding(page)
      await test.step(evidence(flowId, "DECISION/ERROR"), async () => {
        const onboarding = page.getByTestId("ondo-onboarding")
        await onboarding.getByRole("button", { name: "Set guest preferences", exact: true }).click()
        await onboarding.getByTestId(`persona-${persona}`).click()
        await onboarding.getByRole("button", { name: "Choose food preferences", exact: true }).click()
        await onboarding.getByRole("button", { name: "Local classics", exact: true }).click()
        await failNextDeviceWrite(page)
        await onboarding.getByTestId("onboarding-finish").click()
        await expect(onboarding.getByTestId("onboarding-save-status")).toBeVisible()
      })
      await test.step(evidence(flowId, "RETRY/TERMINAL"), async () => {
        await page.getByTestId("onboarding-finish").click()
        await expect(page.getByTestId("ondo-onboarding")).toBeHidden()
        expect(await stored(page, "local", B_DEVICE_KEY)).toMatchObject({ onboarding: "ONB-COMPLETE", persona, discoveryPreferences: ["classic"] })
        await expect(page.getByTestId("ondo-b-nation")).toBeVisible()
        await expect(page.getByTestId("ondo-b-action-gate")).toHaveCount(0)
      })
    })
  }

  test(title("FL-010"), async ({ page }) => {
    await seedB(page)
    await openCanonicalVenue(page, { query: "qa=1" })
    await test.step(evidence("FL-010", "ENTRY/DECISION/CANCEL"), async () => {
      await page.getByTestId("canonical-venue-save").click()
      const gate = page.getByTestId("account-save-gate")
      await expect(gate).toHaveAttribute("data-account-return-venue", CANONICAL_VENUE_ID)
      await gate.getByTestId("gate-cancel").click()
      await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
      expect((await stored(page, "local", B_DEVICE_KEY)).savedVenueIds).toEqual([])
    })
    await test.step(evidence("FL-010", "ERROR/RETRY"), async () => {
      await page.getByTestId("canonical-venue-save").click()
      const gate = page.getByTestId("account-save-gate")
      await gate.getByTestId("account-simulate-failure").click()
      await expect(gate.getByTestId("gate-failure")).toBeVisible()
      await gate.getByTestId("gate-retry").click()
      await finishAccountGate(page)
    })
    await test.step(evidence("FL-010", "TERMINAL/RETURN"), async () => {
      await expect(page.getByTestId("account-save-gate")).toBeHidden()
      await expect(page.getByTestId("canonical-place-overlay")).toHaveAttribute("data-save-state", "SAV-SAVED")
      expect(await sessionState(page)).toMatchObject({ account: "ACC-ACTIVE", person: "PER-UNVERIFIED" })
      expect((await stored(page, "local", B_DEVICE_KEY)).savedVenueIds).toEqual([CANONICAL_VENUE_ID])
    })
  })

  test(title("FL-011"), async ({ page }) => {
    await seedB(page, { session: { account: "ACC-ACTIVE" } })
    await test.step(evidence("FL-011", "ENTRY/DECISION/ERROR"), async () => {
      await openCanonicalVenue(page, { query: "qa=1&scenario=save-failed" })
      await page.getByTestId("canonical-venue-save").click()
      await expect(page.getByTestId("canonical-save-error")).toBeVisible()
      expect((await stored(page, "local", B_DEVICE_KEY)).savedVenueIds).toEqual([])
    })
    await test.step(evidence("FL-011", "CANCEL/RETRY"), async () => {
      await page.getByTestId("canonical-place-overlay").locator("header").getByRole("button", { name: "Back to place summary" }).click()
      await page.getByTestId("canonical-place-details").click()
      await page.getByTestId("canonical-save-retry").click()
      await expect(page.getByTestId("canonical-place-overlay")).toHaveAttribute("data-save-state", "SAV-SAVED")
    })
    await test.step(evidence("FL-011", "TERMINAL/RETURN"), async () => {
      // The place-history replacement triggers a short Next RSC navigation.
      // Let that intentional transition settle before reload so the runtime
      // guard does not mistake a browser-cancelled prefetch for a product error.
      await page.waitForLoadState("networkidle")
      await page.reload({ waitUntil: "domcontentloaded" })
      await expect(page.getByTestId("canonical-place-overlay")).toHaveAttribute("data-save-state", "SAV-SAVED")
      const consumeCityNavigationAbort = allowBNextNavigationAbort(page, {
        targetUrl: "/ondo-b?city=seoul",
        count: 1,
        minimumCount: 0,
      })
      await page.getByTestId("canonical-place-overlay").getByRole("button", { name: "Close place" }).click()
      await expect(page.getByTestId("canonical-place-overlay")).toBeHidden()
      await expect(page).toHaveURL(/\/ondo-b\?city=seoul$/)
      await page.getByTestId("nav-my").click()
      await page.getByTestId(`saved-venue-${CANONICAL_VENUE_ID}`).click()
      await expect(page.getByTestId("canonical-place-peek")).toHaveAttribute("data-venue-id", CANONICAL_VENUE_ID)
      // Chromium emits the requestfailed event after the synchronous saved-place
      // restoration has painted, so let that one exact scoped transition settle
      // before consuming its optional browser-cancelled RSC request.
      await page.waitForTimeout(500)
      consumeCityNavigationAbort()
    })
  })

  test(title("FL-012"), async ({ page }) => {
    await seedB(page, { session: { account: "ACC-ACTIVE", person: "PER-VERIFIED" } })
    await openCanonicalVenue(page)
    await test.step(evidence("FL-012", "ENTRY/DECISION/CANCEL"), async () => {
      const signal = await openSignal(page, "Draft stays local.")
      await signal.getByTestId("local-signal-photo-input").setInputFiles({ name: "visit.png", mimeType: "image/png", buffer: PNG })
      await signal.press("Escape")
      await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
      expect((await stored(page, "local", B_DEVICE_KEY)).localSignalPostedVenueIds).toEqual([])
    })
    await test.step(evidence("FL-012", "ERROR/RETRY"), async () => {
      const signal = await openSignal(page, "Draft survives the device write.")
      await signal.getByTestId("local-signal-person-check").click()
      await expect(signal.getByTestId("local-signal-post")).toBeVisible()
      await failNextDeviceWrite(page)
      await signal.getByTestId("local-signal-post").click()
      await expect(signal.getByTestId("local-signal-post-error")).toBeVisible()
      await expect(signal.getByRole("textbox", { name: "Optional local note" })).toHaveValue("Draft survives the device write.")
      await signal.getByTestId("local-signal-post").click()
    })
    await test.step(evidence("FL-012", "TERMINAL/RETURN"), async () => {
      await expect(page.getByTestId("ondo-b-local-signal")).toBeHidden()
      await expect(page.getByTestId("canonical-place-overlay")).toHaveAttribute("data-venue-id", CANONICAL_VENUE_ID)
      expect((await stored(page, "local", B_DEVICE_KEY)).localSignalPostedVenueIds).toEqual([CANONICAL_VENUE_ID])
      expect(await sessionState(page)).toMatchObject({ person: "PER-VERIFIED", age: "AGE-UNVERIFIED", paymentKyc: "PKY-NOT-STARTED", reputation: { visit: "new", contribution: "helpful", meetup: "new" } })
    })
  })

  test(title("FL-013"), async ({ page }) => {
    await seedB(page)
    await gotoB(page, "?city=seoul")
    await test.step(evidence("FL-013", "ENTRY/DECISION/CANCEL"), async () => {
      await page.getByTestId("global-after19-toggle").click()
      await expect(page.getByTestId("global-after19-return-context")).toHaveAttribute("data-return-city", "seoul")
      await page.getByTestId("global-after19-cancel").click()
      await expect(page.getByTestId("ondo-b-map-entry")).toBeVisible()
    })
    await test.step(evidence("FL-013", "ERROR/RETRY"), async () => {
      await setQa(page, { after19Global: "failure" })
      await page.getByTestId("global-after19-toggle").click()
      await page.getByTestId("global-after19-confirm").click()
      await expect(page.getByTestId("global-after19-prompt-layer").getByRole("dialog")).toHaveAttribute("data-gate-view", "failure")
      await clearAfter19Qa(page)
      await page.getByTestId("global-after19-retry").click()
    })
    await test.step(evidence("FL-013", "TERMINAL/RETURN"), async () => {
      await expect(page.getByTestId("global-after19-banner")).toBeVisible()
      await expect(page.getByTestId("ondo-b-map-entry")).toBeVisible()
      expect(await sessionState(page)).toMatchObject({ account: "ACC-GUEST", age: "AGE-VERIFIED", paymentKyc: "PKY-NOT-STARTED", after19: "A19-ON" })
    })
  })

  test(title("FL-014"), async ({ page }) => {
    await seedB(page, { session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", age: "AGE-VERIFIED", ageExpiresAt: "2026-08-20T20:30:00+09:00" } })
    await test.step(evidence("FL-014", "ENTRY/DECISION/TERMINAL"), async () => {
      await gotoB(page, "?city=seoul")
      await expect(page.getByTestId("global-after19-banner")).toHaveAttribute("data-activation", "auto")
      expect(await sessionState(page)).toMatchObject({ after19: "A19-ON" })
    })
    await test.step(evidence("FL-014", "CANCEL/RETURN"), async () => {
      await page.getByTestId("global-after19-banner").getByRole("button").click()
      expect(await sessionState(page)).toMatchObject({ after19: "A19-MANUAL-OFF" })
      await page.reload({ waitUntil: "domcontentloaded" })
      await expect(page.getByTestId("global-after19-banner")).toHaveCount(0)
      await expect(page.getByTestId("global-after19-toggle")).toBeVisible()
    })
    await test.step(evidence("FL-014", "ERROR/RETRY"), async () => {
      await page.evaluate((key) => sessionStorage.setItem(key, JSON.stringify({
        version: 1, age: "eligible", ageExpiresAt: "2026-08-18T00:00:00.000Z",
        mode: "on", activation: "auto", expiryNotice: false,
      })), B_AFTER19_SESSION_KEY)
      await page.reload({ waitUntil: "domcontentloaded" })
      const notice = page.getByTestId("global-after19-expiry-notice")
      await expect(notice).toBeVisible()
      await notice.getByRole("button").first().click()
      await page.getByTestId("global-after19-confirm").click()
      await expect(page.getByTestId("global-after19-banner")).toBeVisible()
    })
  })

  test(title("FL-015"), async ({ page }) => {
    await seedB(page, { session: { account: "ACC-ACTIVE" } })
    await gotoB(page)
    await page.getByTestId("nav-id").click()
    const profile = page.getByTestId("ondo-profile-panel")
    await test.step(evidence("FL-015", "ENTRY/DECISION/CANCEL"), async () => {
      await profile.getByRole("button", { name: "Edit", exact: true }).click()
      await profile.locator("input").nth(1).fill("Singapore")
      const from = profile.getByRole("switch", { name: /From/ })
      await expect(from).toHaveAttribute("aria-checked", "false")
      await from.click()
      await expect(from).toHaveAttribute("aria-checked", "true")
      await profile.getByRole("button", { name: "Cancel", exact: true }).click()
      await expect(profile).toHaveAttribute("data-state", "private")
    })
    await test.step(evidence("FL-015", "ERROR/RETRY"), async () => {
      await profile.getByRole("button", { name: "Edit", exact: true }).click()
      await profile.locator("input").nth(1).fill("Singapore")
      const from = profile.getByRole("switch", { name: /From/ })
      await expect(from).toHaveAttribute("aria-checked", "false")
      await from.click()
      await expect(from).toHaveAttribute("aria-checked", "true")
      await setQa(page, { profile: "failure" })
      await profile.getByRole("button", { name: "Save profile", exact: true }).click()
      await expect(profile.getByRole("alert")).toBeVisible()
      expect((await stored(page, "session", B_ACTIVITY_PROFILE_KEY)).profile).toMatchObject({ from: { value: "", consent: false } })
      await profile.getByRole("button", { name: "Try saving again", exact: true }).click()
    })
    await test.step(evidence("FL-015", "TERMINAL/RETURN"), async () => {
      await expect(profile).toHaveAttribute("data-state", "partial")
      await expect(profile).toContainText("Singapore")
      await expect(profile).toContainText("never copied from an identity check")
      await expect(page.getByTestId("ondo-trust-panel")).toBeVisible()
      expect((await stored(page, "session", B_ACTIVITY_PROFILE_KEY)).profile).toMatchObject({ from: { value: "Singapore", consent: true } })
    })
  })

  test(title("FL-016"), async ({ page }) => {
    await seedB(page, { session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", paymentKyc: "PKY-VERIFIED", stamps: 10 } })
    await test.step(evidence("FL-016", "ENTRY/DECISION/ERROR"), async () => {
      await openCanonicalVenue(page, { query: "qa=1" })
      const detail = page.getByTestId("canonical-place-overlay")
      await expect(detail).toContainText("Not provided by this source")
      await expect(detail).not.toContainText(/(?:is|are) safe|safety guaranteed|guaranteed (?:entry|access|admission)/i)
    })
    await test.step(evidence("FL-016", "CANCEL/RETURN"), async () => {
      await page.getByTestId("canonical-place-overlay").locator("header").getByRole("button", { name: "Back to place summary" }).click()
      await page.getByTestId("canonical-place-peek").getByRole("button", { name: "Close place" }).click()
    })
    await test.step(evidence("FL-016", "RETRY/TERMINAL"), async () => {
      await openLabs(page)
      await page.getByTestId("labs-acknowledge").click()
      await expect(page.getByTestId("trait-seongsu-card")).toHaveAttribute("data-trait-state", "idle")
      await expect(page.getByTestId("trait-seongsu-card")).toContainText("Out of date")
      await page.getByTestId("trait-retry-seongsu-card").click()
      await expect(page.locator("[data-trait-state='eligible']").first()).toContainText("This specific access condition is met")
      await expect(page.getByTestId("labs-overlay")).toContainText("do not guarantee venue admission")
    })
  })

  test(title("FL-017"), async ({ page }) => {
    await seedB(page, { session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", paymentKyc: "PKY-NOT-STARTED" } })
    await openCanonicalVenue(page)
    await openOffer(page)
    const offer = await preparePayment(page)
    await test.step(evidence("FL-017", "ENTRY/DECISION/CANCEL"), async () => {
      await offer.getByTestId("payment-confirm").click()
      const gate = page.getByTestId("ondo-b-action-gate")
      await expect(gate).toHaveAttribute("data-active-gate", "payment_kyc")
      await expect(page.getByTestId("action-gate-return-context")).toHaveAttribute("data-return-venue", CANONICAL_VENUE_ID)
      await gate.getByTestId("action-gate-cancel").click()
      await expect(offer).toHaveAttribute("data-origin-venue-id", CANONICAL_VENUE_ID)
    })
    await test.step(evidence("FL-017", "ERROR/RETRY"), async () => {
      await setQa(page, { actionGate: { payment_kyc: "failure" } })
      await offer.getByTestId("payment-confirm").click()
      const gate = page.getByTestId("ondo-b-action-gate")
      await gate.getByTestId("action-gate-confirm").click()
      await expect(gate).toHaveAttribute("data-gate-view", "failure")
      await gate.getByTestId("action-gate-retry").click()
      await gate.getByTestId("action-gate-confirm").click()
    })
    await test.step(evidence("FL-017", "TERMINAL/RETURN"), async () => {
      await expect(offer.getByTestId("payment-receipt")).toHaveAttribute("data-completion-kind", "receipt")
      expect(await sessionState(page)).toMatchObject({ paymentKyc: "PKY-VERIFIED", age: "AGE-UNVERIFIED", person: "PER-VERIFIED" })
      expect(await stored(page, "session", B_ACTION_GATE_KEY)).toMatchObject({ person: { status: "eligible" }, payment: { status: "eligible" } })
      await offer.getByTestId("payment-receipt-return").click()
      await expect(page.getByTestId("canonical-place-overlay")).toHaveAttribute("data-venue-id", CANONICAL_VENUE_ID)
    })
  })

  test(title("FL-018"), async ({ page }) => {
    await seedB(page, { session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", paymentKyc: "PKY-VERIFIED", stamps: 10 } })
    await gotoB(page, "?qa=1")
    await test.step(evidence("FL-018", "ENTRY/DECISION"), async () => {
      await openLabs(page)
      await page.getByTestId("labs-acknowledge").click()
      await page.getByTestId("labs-connect-wallet").click()
      await page.getByTestId("labs-bridge-quote").click()
      await expect(page.getByTestId("labs-overlay")).toHaveAttribute("data-bridge-state", "BRG-QUOTED")
    })
    await test.step(evidence("FL-018", "CANCEL"), async () => {
      await page.getByTestId("labs-bridge-cancel").click()
      await expect(page.getByTestId("labs-overlay")).toHaveAttribute("data-bridge-state", "BRG-CANCELLED")
      await expect(page.getByTestId("labs-bridge-receipt")).toHaveCount(0)
    })
    await test.step(evidence("FL-018", "ERROR/RETRY"), async () => {
      await gotoB(page, "?qa=1&scenario=bridge-failed")
      await openLabs(page)
      const connect = page.getByTestId("labs-connect-wallet")
      if (await connect.isVisible().catch(() => false)) await connect.click()
      await page.getByTestId("labs-bridge-quote").click()
      await page.getByTestId("labs-bridge-confirm").click()
      await page.getByTestId("labs-bridge-submit").click()
      await page.getByTestId("labs-bridge-advance").click()
      await page.getByTestId("labs-bridge-advance").click()
      await expect(page.getByTestId("labs-overlay")).toHaveAttribute("data-bridge-state", "BRG-FAILED")
      await expect(page.getByTestId("labs-bridge-quote")).toBeVisible()
    })
    await test.step(evidence("FL-018", "TERMINAL/RETURN"), async () => {
      await gotoB(page, "?qa=1")
      await openLabs(page)
      await page.getByTestId("labs-bridge-quote").click()
      await page.getByTestId("labs-bridge-confirm").click()
      await page.getByTestId("labs-bridge-submit").click()
      for (let index = 0; index < 3; index += 1) await page.getByTestId("labs-bridge-advance").click()
      await expect(page.getByTestId("labs-bridge-receipt")).toContainText("Actual balances and transactions were not changed.")
      await page.getByRole("button", { name: "Return to My Korea" }).click()
      await expect(page.getByTestId("ondo-b-my-korea-entry")).toBeVisible()
    })
  })
})
