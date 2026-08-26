import { expect, test, type Page } from "@playwright/test"
import {
  B_FLOW_CONTRACTS,
  CANONICAL_VENUE_ID,
  expectBRuntimeClean,
  expectNoRawTruthLeaks,
  finishAccountGate,
  finishAgeGate,
  finishPaymentGate,
  finishPersonGate,
  gotoB,
  installBRuntimeGuard,
  openCanonicalVenue,
  openLabs,
  openTables,
  prepareBPage,
  seedB,
  seedFreshOnboarding,
  sessionState,
  TABLE_ID,
} from "../helpers/ondo-b-qa"

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64")
const title = (flow: string) => B_FLOW_CONTRACTS.find((item) => item.flow === flow)!.testTitle
const evidence = (flow: string, checkpoint: string) => `B-E2E-${flow}-${checkpoint}`

test.describe("ONDO B canonical flow journeys", () => {
  test.beforeEach(async ({ page }) => {
    installBRuntimeGuard(page)
    await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("blockedbyclient"))
    await prepareBPage(page)
  })

  test.afterEach(async ({ page }) => {
    await expectBRuntimeClean(page)
  })

  test(title("FL-001"), async ({ page }) => {
    await seedB(page)
    await test.step(evidence("FL-001", "ENTRY/DECISION"), async () => {
      await gotoB(page)
      await page.locator("[data-city='seoul']").click()
      await page.getByRole("button", { name: "List" }).click()
      await expect(page.getByText(/^200 sourced food places$/)).toBeVisible()
      await expect(page.getByTestId("ondo-b-venue-list")).toBeVisible()
    })
    await test.step(evidence("FL-001", "TERMINAL"), async () => {
      await page.getByTestId("ondo-b-venue-list").locator("li button").first().click()
      await page.getByTestId("canonical-place-details").click()
      await expect(page.getByTestId("canonical-place-overlay")).toContainText("MOIS LOCALDATA")
      await expectNoRawTruthLeaks(page, page.getByTestId("canonical-place-overlay"))
    })
    await test.step(evidence("FL-001", "CANCEL/RETURN"), async () => {
      await page.getByTestId("canonical-place-overlay").getByRole("button", { name: "Back to place summary" }).last().click()
      await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
      await page.getByTestId("canonical-place-peek").getByRole("button", { name: "Close place" }).click()
      await expect(page.getByText(/^200 sourced food places$/)).toBeVisible()
    })
  })

  test(title("FL-002"), async ({ page }) => {
    await seedB(page, { session: { account: "ACC-ACTIVE", person: "PER-VERIFIED" } })
    await test.step(evidence("FL-002", "ENTRY/CANCEL"), async () => {
      await openCanonicalVenue(page, { query: "qa=1" })
      await expect(page.getByTestId("canonical-after19-access")).toHaveAttribute("data-after19-venue-status", "locked")
      await expect(page.getByTestId("canonical-after19-access")).toContainText("ONDO locks this simulated night preview behind its own 19+ policy.")
      await expect(page.getByTestId("canonical-after19-access")).toContainText("This is not an official age restriction")
      await expect(page.getByTestId("canonical-place-overlay")).toContainText("MOIS LOCALDATA")
      await page.getByTestId("canonical-after19-unlock").click()
      await expect(page.getByTestId("ondo-gate-overlay")).toContainText("Confirm 19+ to continue")
      await page.getByTestId("ondo-gate-overlay").getByRole("button", { name: "Return to previous screen" }).click()
      await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
      await expect(page.getByTestId("canonical-after19-access")).toHaveAttribute("data-after19-venue-status", "locked")
    })
    await test.step(evidence("FL-002", "DECISION/ERROR/RETRY"), async () => {
      await page.getByTestId("canonical-after19-unlock").click()
      await page.getByRole("button", { name: "Simulate failure" }).click()
      await expect(page.getByTestId("gate-failure")).toBeVisible()
      expect(await sessionState(page)).toMatchObject({ gate: { cta: "OPEN_AFTER19", venueId: CANONICAL_VENUE_ID, activeGate: "age" } })
      await page.getByRole("button", { name: "Try again", exact: true }).click()
      await finishAgeGate(page)
    })
    await test.step(evidence("FL-002", "TERMINAL/RETURN"), async () => {
      await expect(page.getByTestId("ondo-gate-overlay")).toBeHidden()
      await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
      await expect(page.getByTestId("canonical-after19-access")).toHaveAttribute("data-after19-venue-status", "unlocked")
      await expect(page.getByTestId("canonical-after19-access")).toContainText("ONDO’s simulated 19+ preview policy is on.")
      await expect(page.getByTestId("canonical-after19-access")).toContainText("not an official age restriction")
      await expect(page.getByTestId("after19-auto-banner")).toBeVisible()
      await expect(page).toHaveURL(new RegExp(`venueId=${CANONICAL_VENUE_ID}`))
      await expect(page).not.toHaveURL(/after19Return=/)
      expect(await sessionState(page)).toMatchObject({ age: "AGE-VERIFIED", paymentKyc: "PKY-NOT-STARTED", after19: "A19-ON" })
    })
  })

  test(title("FL-003"), async ({ page }) => {
    await seedB(page, { session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", age: "AGE-VERIFIED", ageExpiresAt: "2026-08-20T20:30:00+09:00" } })
    await test.step(evidence("FL-003", "ENTRY/DECISION/ERROR"), async () => {
      await gotoB(page, "?scenario=table-network")
      await openTables(page)
      await page.getByTestId("table-join").click()
      await expect(page.getByTestId("table-requesting")).toBeVisible()
      await expect(page.getByText("This local preview could not be updated. No live host or reservation was contacted. Retry keeps this Table, time, and seats unchanged.")).toBeVisible()
      await expect(page.getByRole("button", { name: "Open chat" })).toHaveCount(0)
    })
    await test.step(evidence("FL-003", "RETRY"), async () => {
      await page.evaluate(() => window.history.replaceState({}, "", "/ondo-b"))
      await page.getByTestId("table-join-retry").click()
      await expect(page.getByRole("button", { name: "Open chat" })).toBeVisible()
    })
    await test.step(evidence("FL-003", "TERMINAL"), async () => {
      await page.getByRole("button", { name: "Open chat" }).click()
      await page.locator("input[type='file']").setInputFiles({ name: "meal.png", mimeType: "image/png", buffer: PNG })
      await page.getByRole("button", { name: "Send photo" }).click()
      await expect(page.locator("[data-message-status='MSG-SENT']")).toBeVisible()
      await page.getByTestId("table-check-in").click()
      await page.getByTestId("table-finish-meal").click()
      await page.getByTestId("feedback-helpful-yes").click()
      await page.getByTestId("feedback-respectful-yes").click()
      await page.getByTestId("feedback-submit").click()
      await expect(page.getByTestId("feedback-result")).toContainText("Feedback recorded once. No overall score was created.")
      await page.getByTestId("feedback-back-to-chat").click()
      await expect(page.getByTestId("table-chat")).toContainText("Feedback recorded. No overall score was created.")
    })
    await test.step(evidence("FL-003", "CANCEL/RETURN"), async () => {
      await page.getByTestId("table-leave").click()
      await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click()
      await expect(page.getByTestId("table-chat")).toBeVisible()
      await page.reload({ waitUntil: "domcontentloaded" })
      await page.getByRole("button", { name: "Tables", exact: true }).click()
      await page.getByRole("region", { name: "Joined" }).locator(`[data-table-id='${TABLE_ID}']`).click()
      await expect(page.getByTestId("table-chat")).toContainText("Feedback recorded")
    })
  })

  test(title("FL-004"), async ({ page }) => {
    await seedB(page, { session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", paymentKyc: "PKY-VERIFIED", stamps: 9 } })
    await test.step(evidence("FL-004", "ENTRY/DECISION/CANCEL"), async () => {
      await openCanonicalVenue(page)
      await page.getByTestId("canonical-venue-checkout").click()
      await page.getByTestId("checkout-start").click()
      await page.getByTestId("checkout-cancel").click()
      await expect(page.getByTestId("checkout-overlay")).toHaveAttribute("data-payment-state", "PAY-CANCELLED")
      await expect(page.getByTestId("checkout-overlay")).toHaveAttribute("data-stamp-count", "9")
      await expect(page.getByTestId("checkout-receipt")).toHaveCount(0)
    })
    await test.step(evidence("FL-004", "ERROR/RETRY"), async () => {
      await openCanonicalVenue(page, { query: "scenario=payment-declined" })
      await page.getByTestId("canonical-venue-checkout").click()
      await page.getByTestId("checkout-start").click()
      await page.getByTestId("checkout-confirm").click()
      await expect(page.getByTestId("checkout-overlay")).toHaveAttribute("data-payment-state", "PAY-FAILED")
      await expect(page.getByTestId("checkout-overlay")).toHaveAttribute("data-stamp-count", "9")
      await expect(page.getByTestId("checkout-receipt")).toHaveCount(0)
      await page.getByRole("button", { name: "Try again" }).click()
      await expect(page.getByTestId("checkout-overlay")).toHaveAttribute("data-payment-state", "PAY-CONFIRMING")
    })
    await test.step(evidence("FL-004", "TERMINAL/RETURN"), async () => {
      await openCanonicalVenue(page)
      await page.getByTestId("canonical-venue-checkout").click()
      await page.getByTestId("checkout-start").click()
      await page.getByTestId("checkout-confirm").click()
      await expect(page.getByTestId("checkout-receipt")).toBeVisible()
      await page.getByTestId("visit-proof-check").click()
      await expect(page.getByTestId("checkout-overlay")).toHaveAttribute("data-stamp-count", "10")
      await page.getByRole("button", { name: "Return to venue" }).click()
      await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
    })
  })

  test(title("FL-005"), async ({ page }) => {
    await seedB(page, { session: { persona: "korean_local", account: "ACC-ACTIVE", person: "PER-UNVERIFIED" } })
    await openCanonicalVenue(page, { query: "qa=1" })
    await page.getByTestId("canonical-venue-signal").click()
    await page.getByTestId("local-signal-overlay").locator("textarea").fill("A local ordering tip.")
    await test.step(evidence("FL-005", "ENTRY/CANCEL"), async () => {
      await page.getByTestId("local-signal-submit").click()
      await expect(page.getByTestId("ondo-gate-overlay")).toContainText("Check with Mobile ID")
      await page.getByTestId("ondo-gate-overlay").getByRole("button", { name: "Return to previous screen" }).click()
      await expect(page.getByTestId("local-signal-overlay")).toBeVisible()
      await expect(page.getByTestId("local-signal-overlay").locator("textarea")).toHaveValue("A local ordering tip.")
    })
    await test.step(evidence("FL-005", "DECISION/ERROR/RETRY"), async () => {
      await page.getByTestId("local-signal-submit").click()
      await page.getByRole("button", { name: "Start check" }).click()
      await page.getByRole("button", { name: "Simulate failure" }).click()
      await expect(page.getByTestId("gate-failure")).toBeVisible()
      await page.getByRole("button", { name: "Try again" }).click()
      await finishPersonGate(page)
      await expect(page.getByTestId("ondo-gate-overlay")).toBeHidden()
    })
    await test.step(evidence("FL-005", "TERMINAL/RETURN"), async () => {
      await expect(page.getByTestId("local-signal-overlay")).toBeVisible()
      expect(await sessionState(page)).toMatchObject({ person: "PER-VERIFIED", age: "AGE-UNVERIFIED", paymentKyc: "PKY-NOT-STARTED" })
    })
  })

  test(title("FL-006"), async ({ page }) => {
    await seedB(page, { session: { persona: "long_term_resident", account: "ACC-ACTIVE", person: "PER-UNVERIFIED" } })
    await openCanonicalVenue(page)
    await page.getByTestId("canonical-venue-signal").click()
    await page.getByTestId("local-signal-overlay").locator("textarea").fill("A resident ordering tip.")
    await page.getByTestId("local-signal-submit").click()
    await test.step(evidence("FL-006", "ENTRY/DECISION/CANCEL"), async () => {
      const gate = page.getByTestId("ondo-gate-overlay")
      await expect(gate).toContainText("Mobile Residence Card")
      await gate.getByRole("button", { name: "Return to previous screen" }).click()
      await expect(page.getByTestId("local-signal-overlay")).toBeVisible()
      await expect(page.getByTestId("local-signal-overlay").locator("textarea")).toHaveValue("A resident ordering tip.")
      await page.getByTestId("local-signal-submit").click()
    })
    await test.step(evidence("FL-006", "ERROR/RETRY"), async () => {
      await page.getByRole("button", { name: "Start check" }).click()
      await expect(page.getByTestId("gate-unsupported")).toContainText("not connected yet")
      await page.getByRole("button", { name: "Use passport provider instead" }).click()
      await finishPersonGate(page)
      await expect(page.getByTestId("ondo-gate-overlay")).toBeHidden()
    })
    await test.step(evidence("FL-006", "TERMINAL/RETURN"), async () => {
      await expect(page.getByTestId("local-signal-overlay")).toBeVisible()
      expect(await sessionState(page)).toMatchObject({ person: "PER-VERIFIED", age: "AGE-UNVERIFIED", paymentKyc: "PKY-NOT-STARTED" })
    })
  })

  for (const [flowId, persona] of [["FL-007", "short_term"], ["FL-008", "korean_local"], ["FL-009", "long_term_resident"]] as const) {
    test(title(flowId), async ({ page }) => {
      await seedFreshOnboarding(page)
      await test.step(evidence(flowId, "ENTRY/CANCEL"), async () => {
        await gotoB(page)
        await expect(page.getByTestId("onboarding-step-value")).toBeVisible()
        await page.getByRole("button", { name: "Explore without setup" }).click()
        await expect(page.getByTestId("ondo-b-map-entry")).toBeVisible()
      })
      await page.evaluate(() => { localStorage.removeItem("ondo.preferences.v3"); sessionStorage.removeItem("ondo.session.v3") })
      await test.step(evidence(flowId, "DECISION/ERROR"), async () => {
        await page.goto(`/ondo-b?onboarding=failure`, { waitUntil: "domcontentloaded" })
        await page.getByRole("button", { name: "Set guest preferences" }).click()
        await page.getByTestId(`persona-${persona}`).click()
        await page.getByRole("button", { name: "Choose meal preferences", exact: true }).click()
        await expect(page.getByTestId("onboarding-step-preferences")).toBeVisible()
        await expect(page.getByRole("button", { name: "Open the ONDO map", exact: true })).toBeVisible()
        await page.getByRole("button", { name: "Local classics" }).click()
        await page.getByTestId("onboarding-finish").click()
        await expect(page.getByTestId("ondo-onboarding").getByRole("alert")).toBeVisible()
        await page.getByTestId("onboarding-finish").click()
      })
      await test.step(evidence(flowId, "TERMINAL/RETURN"), async () => {
        await expect(page.getByTestId("ondo-onboarding")).toBeHidden()
        await expect(page.getByTestId("ondo-b-map-entry")).toBeVisible()
        await expect(page.getByTestId("ondo-gate-overlay")).toHaveCount(0)
        expect(await sessionState(page)).toMatchObject({ onboarding: "ONB-COMPLETE", persona, account: "ACC-GUEST", person: "PER-UNVERIFIED" })
      })
    })
  }

  test(title("FL-010"), async ({ page }) => {
    await seedB(page)
    await openCanonicalVenue(page, { query: "qa=1" })
    await test.step(evidence("FL-010", "ENTRY/CANCEL"), async () => {
      await page.getByTestId("canonical-venue-save").click()
      await expect(page.getByTestId("ondo-gate-overlay")).toContainText("save this place")
      await page.getByTestId("ondo-gate-overlay").getByRole("button", { name: "Return to previous screen" }).click()
      await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
    })
    await test.step(evidence("FL-010", "DECISION/ERROR/RETRY"), async () => {
      await page.getByTestId("canonical-venue-save").click()
      await page.getByRole("button", { name: "Simulate failure" }).click()
      await expect(page.getByTestId("gate-failure")).toBeVisible()
      await page.getByRole("button", { name: "Try again" }).click()
      await finishAccountGate(page)
    })
    await test.step(evidence("FL-010", "TERMINAL/RETURN"), async () => {
      await expect(page.getByTestId("ondo-gate-overlay")).toBeHidden()
      await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
      await expect(page.getByTestId("canonical-venue-save")).toBeDisabled()
      expect(await sessionState(page)).toMatchObject({ account: "ACC-ACTIVE", person: "PER-UNVERIFIED" })
      expect(await page.evaluate(() => JSON.parse(localStorage.getItem("ondo.preferences.v3") ?? "{}").savedVenueIds)).toEqual([CANONICAL_VENUE_ID])
    })
  })

  test(title("FL-011"), async ({ page }) => {
    await seedB(page, { session: { account: "ACC-ACTIVE" } })
    await test.step(evidence("FL-011", "ENTRY/DECISION"), async () => {
      await openCanonicalVenue(page, { query: "scenario=save-failed" })
      await page.getByTestId("canonical-venue-save").click()
      await expect(page.getByTestId("canonical-venue-save")).toBeDisabled()
      await expect(page.getByTestId("canonical-save-error")).toBeVisible()
      await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
      await expect(page.getByTestId("canonical-venue-save")).toBeEnabled()
    })
    await test.step(evidence("FL-011", "CANCEL"), async () => {
      await page.getByTestId("canonical-save-dismiss").click()
      await expect(page.getByTestId("canonical-save-error")).toHaveCount(0)
      await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
      await expect(page.getByTestId("canonical-venue-save")).toHaveText("Save")
    })
    await test.step(evidence("FL-011", "ERROR/RETRY"), async () => {
      await page.reload({ waitUntil: "domcontentloaded" })
      await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
      await page.getByTestId("canonical-venue-save").click()
      await expect(page.getByTestId("canonical-save-error")).toBeVisible()
      await page.getByTestId("canonical-save-retry").click()
      await expect(page.getByTestId("canonical-venue-save")).toHaveText("Saved")
      await expect(page.getByTestId("canonical-venue-save")).toBeDisabled()
    })
    await test.step(evidence("FL-011", "TERMINAL"), async () => {
      await page.reload({ waitUntil: "domcontentloaded" })
      const detail = page.getByTestId("canonical-place-overlay")
      await expect(detail).toBeVisible()
      await expect(page.getByTestId("canonical-venue-save")).toHaveText("Saved")
      await expect(page.getByTestId("canonical-venue-save")).toBeDisabled()
      await detail.getByRole("button", { name: "Close place", exact: true }).click()
      await expect(detail).toHaveCount(0)
      await expect(page.getByTestId("ondo-main-nav")).not.toHaveAttribute("inert", "")
      await page.getByTestId("nav-my").click()
      await expect(page.getByTestId(`saved-venue-${CANONICAL_VENUE_ID}`)).toBeVisible()
    })
    await test.step(evidence("FL-011", "RETURN"), async () => {
      await page.getByTestId(`saved-venue-${CANONICAL_VENUE_ID}`).click()
      await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
    })
  })

  test(title("FL-012"), async ({ page }) => {
    await seedB(page, { session: { account: "ACC-ACTIVE", person: "PER-VERIFIED" } })
    await test.step(evidence("FL-012", "ENTRY/DECISION/CANCEL"), async () => {
      await openCanonicalVenue(page)
      await page.getByTestId("canonical-venue-signal").click()
      await page.getByTestId("local-signal-overlay").locator("textarea").fill("Draft stays local.")
      await page.locator("input[type='file']").setInputFiles({ name: "visit.png", mimeType: "image/png", buffer: PNG })
      await page.getByRole("button", { name: "Cancel draft" }).click()
      await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
    })
    await test.step(evidence("FL-012", "ERROR/RETRY"), async () => {
      await page.evaluate(() => history.replaceState({}, "", `${location.pathname}?venueId=${new URLSearchParams(location.search).get("venueId")}&scenario=local-signal-fail`))
      await page.getByTestId("canonical-place-details").click()
      await page.getByTestId("canonical-venue-signal").click()
      await page.getByTestId("local-signal-overlay").locator("textarea").fill("Draft survives.")
      await page.getByTestId("local-signal-submit").click()
      await expect(page.getByTestId("local-signal-overlay")).toHaveAttribute("data-signal-status", "failed")
      await expect(page.getByTestId("local-signal-submit")).toHaveText("Try again")
    })
    await test.step(evidence("FL-012", "TERMINAL/RETURN"), async () => {
      await page.evaluate(() => history.replaceState({}, "", `${location.pathname}?venueId=${new URLSearchParams(location.search).get("venueId")}`))
      await page.getByTestId("local-signal-submit").click()
      await expect(page.getByTestId("local-signal-overlay")).toHaveAttribute("data-signal-status", "submitted")
      expect(await sessionState(page)).toMatchObject({ person: "PER-VERIFIED", age: "AGE-UNVERIFIED", paymentKyc: "PKY-NOT-STARTED", stamps: 9, reputation: { visit: "recent", contribution: "helpful", meetup: "new" } })
      await page.getByRole("button", { name: "Return to venue" }).click()
      await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
    })
  })

  test(title("FL-013"), async ({ page }) => {
    await seedB(page)
    await gotoB(page, "?city=seoul&qa=1")
    await test.step(evidence("FL-013", "ENTRY/CANCEL"), async () => {
      await page.getByRole("button", { name: "After 19", exact: true }).click()
      await page.getByRole("button", { name: "Stay on the main map" }).click()
      await expect(page.getByTestId("ondo-b-map-entry")).toBeVisible()
    })
    await test.step(evidence("FL-013", "DECISION/ERROR/RETRY"), async () => {
      await page.getByRole("button", { name: "After 19", exact: true }).click()
      await page.getByRole("button", { name: "Confirm 19+", exact: true }).click()
      await page.getByRole("button", { name: "Simulate failure" }).click()
      await page.getByRole("button", { name: "Try again" }).click()
      await finishAgeGate(page)
    })
    await test.step(evidence("FL-013", "TERMINAL/RETURN"), async () => {
      await expect(page.getByTestId("after19-auto-banner")).toBeVisible()
      expect(await sessionState(page)).toMatchObject({ account: "ACC-GUEST", age: "AGE-VERIFIED", paymentKyc: "PKY-NOT-STARTED" })
    })
  })

  test(title("FL-014"), async ({ page }) => {
    await seedB(page, { session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", age: "AGE-VERIFIED", ageExpiresAt: "2026-08-20T20:30:00+09:00" } })
    await test.step(evidence("FL-014", "ENTRY/DECISION/TERMINAL"), async () => {
      await gotoB(page, "?city=seoul")
      await expect(page.getByTestId("after19-auto-banner")).toBeVisible()
      expect(await sessionState(page)).toMatchObject({ after19: "A19-ON" })
    })
    await test.step(evidence("FL-014", "CANCEL/RETURN"), async () => {
      await page.getByRole("button", { name: "Return to the main map" }).click()
      expect(await sessionState(page)).toMatchObject({ after19: "A19-MANUAL-OFF" })
      await page.reload({ waitUntil: "domcontentloaded" })
      await expect(page.getByTestId("after19-auto-banner")).toHaveCount(0)
      await expect(page.getByRole("button", { name: "After 19", exact: true })).toBeVisible()
    })
  })

  test(title("FL-015"), async ({ page }) => {
    await seedB(page, { session: { account: "ACC-ACTIVE" } })
    await gotoB(page, "?profile=failure")
    await page.getByRole("button", { name: "ID", exact: true }).click()
    const profile = page.getByTestId("ondo-profile-panel")
    await test.step(evidence("FL-015", "ENTRY/DECISION/CANCEL"), async () => {
      await profile.getByRole("button", { name: "Edit profile preview" }).click()
      await profile.getByRole("button", { name: "From: excluded from browser preview. Include From in preview", exact: true }).click()
      await profile.getByRole("button", { name: "Cancel preview editing" }).click()
      await expect(profile).toContainText("Private in this browser session by default")
    })
    await test.step(evidence("FL-015", "ERROR/RETRY"), async () => {
      await profile.getByRole("button", { name: "Edit profile preview" }).click()
      await profile.getByRole("button", { name: "From: excluded from browser preview. Include From in preview", exact: true }).click()
      await profile.getByRole("button", { name: "Save profile preview" }).click()
      await expect(profile.getByRole("alert")).toBeVisible()
      await profile.getByRole("button", { name: "Try saving preview again" }).click()
    })
    await test.step(evidence("FL-015", "TERMINAL/RETURN"), async () => {
      await expect(profile).toContainText("Selected fields included in this browser preview")
      await expect(page.getByTestId("ondo-trust-panel")).toBeVisible()
      await expect(profile).toContainText("Identity-check nationality is never copied here")
    })
  })

  test(title("FL-016"), async ({ page }) => {
    await seedB(page, { session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", paymentKyc: "PKY-VERIFIED", stamps: 10 } })
    await test.step(evidence("FL-016", "ENTRY/DECISION/ERROR"), async () => {
      await openCanonicalVenue(page, { query: "qa=1" })
      const detail = page.getByTestId("canonical-place-overlay")
      await expect(detail).toContainText("Not confirmed by this source")
      await expect(detail).not.toContainText(/safe|guaranteed/i)
    })
    await test.step(evidence("FL-016", "CANCEL/RETURN"), async () => {
      await page.getByTestId("canonical-place-overlay").getByRole("button", { name: "Back to place summary" }).last().click()
      await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
      await page.getByRole("button", { name: "Close place" }).click()
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
    await openCanonicalVenue(page, { query: "qa=1" })
    await page.getByTestId("canonical-venue-checkout").click()
    await test.step(evidence("FL-017", "ENTRY/DECISION/CANCEL"), async () => {
      await page.getByTestId("checkout-start").click()
      await expect(page.getByTestId("ondo-gate-overlay")).toContainText("Payment KYC is separate")
      expect(await sessionState(page)).toMatchObject({ gate: { cta: "START_CHECKOUT", venueId: CANONICAL_VENUE_ID, activeGate: "payment_kyc" } })
      await page.getByTestId("ondo-gate-overlay").getByRole("button", { name: "Return to previous screen" }).click()
      await expect(page.getByTestId("checkout-overlay")).toBeVisible()
      await expect(page.getByTestId("checkout-overlay")).toHaveAttribute("data-venue-id", CANONICAL_VENUE_ID)
    })
    await test.step(evidence("FL-017", "ERROR/RETRY"), async () => {
      await page.getByTestId("checkout-start").click()
      await page.getByRole("button", { name: "Simulate failure" }).click()
      await expect(page.getByTestId("gate-failure")).toBeVisible()
      expect(await sessionState(page)).toMatchObject({ gate: { cta: "START_CHECKOUT", venueId: CANONICAL_VENUE_ID, activeGate: "payment_kyc" } })
      await page.getByRole("button", { name: "Try again" }).click()
      await finishPaymentGate(page)
      await expect(page.getByTestId("ondo-gate-overlay")).toBeHidden()
    })
    await test.step(evidence("FL-017", "TERMINAL/RETURN"), async () => {
      await expect(page.getByTestId("checkout-overlay")).toBeVisible()
      expect(await sessionState(page)).toMatchObject({ paymentKyc: "PKY-VERIFIED", age: "AGE-UNVERIFIED", person: "PER-VERIFIED" })
      await page.getByTestId("checkout-start").click()
      await page.getByTestId("checkout-confirm").click()
      await expect(page.getByTestId("checkout-receipt")).toBeVisible()
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
      const connectWallet = page.getByTestId("labs-connect-wallet")
      if (await connectWallet.isVisible().catch(() => false)) await connectWallet.click()
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
      await expect(page.getByTestId("ondo-my-entry")).toBeVisible()
    })
  })
})
