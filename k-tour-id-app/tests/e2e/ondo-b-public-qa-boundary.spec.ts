import { expect, test, type Page } from "@playwright/test"
import {
  B_ACCOUNT_KEY,
  B_ACTION_GATE_KEY,
  B_ACTIVITY_PROFILE_KEY,
  B_AFTER19_SESSION_KEY,
  B_DEVICE_KEY,
  CANONICAL_VENUE_ID,
  TABLE_ID,
  expectBRuntimeClean,
  expectBRoot,
  installBRuntimeGuard,
  openLabs,
  prepareBPage,
} from "../helpers/ondo-b-qa"

const LABS_KEY = "ondo-b.labs.v1"
const QA_ENABLED_KEY = "ondo.qa.controls.v1"
const QA_SCENARIO_KEY = "ondo.qa.scenario.v1"

const REVIEW_CONTROL_TEST_IDS = [
  "k-tour-id-review-scope",
  "direct-person-review-scope",
  "person-review-scope",
  "age-review-scope",
  "payment-review-scope",
  "global-after19-review-scope",
  "global-after19-review-toggle",
  "global-after19-review-provenance",
  "canonical-after19-review-provenance",
  "payment-review-provenance",
  "wallet-review-provenance",
  "labs-wallet-review-provenance",
] as const

async function installMaliciousPublicState(page: Page, plannedTableRefs: boolean) {
  await page.addInitScript(({ accountKey, actionKey, activityKey, after19Key, deviceKey, labsKey, qaEnabledKey, qaScenarioKey, tableId, venueId, includePlan }) => {
    localStorage.clear()
    sessionStorage.clear()

    const issuedAt = new Date(Date.now() - 1_000).toISOString()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1_000).toISOString()
    const quoteExpiresAt = Date.now() + 120_000
    const reviewExecution = (fixtureId: string, value: unknown) => ({
      mode: "review",
      executionTruth: "FIXTURE_REVIEW",
      provenanceTruth: "SIMULATED",
      result: "FIXTURE_SUCCESS",
      fixtureId,
      externalProviderConnected: false,
      externalEffect: "none",
      recordedAt: issuedAt,
      value,
    })

    localStorage.setItem(deviceKey, JSON.stringify({
      locale: "en",
      onboarding: "ONB-COMPLETE",
      persona: "travelling",
      discoveryArea: null,
      discoveryPreferences: [],
      savedVenueIds: [],
      savedEditorialPlaceIds: [],
      accountSaveTransaction: null,
      privateNotesByVenue: {},
      recentVenueIds: [],
      recentEditorialPlaceIds: [],
      plannedTableRefs: includePlan ? [{ tableId, venueId }] : [],
      localSignalPostedVenueIds: [],
      localPulseEvidenceByVenue: {},
      localInteractionBoundarySeen: true,
      commerceLocalBoundarySeen: true,
      commerceFundingSource: "digital_dollar",
      commerceReceipts: [{
        executionTruth: "FIXTURE_REVIEW",
        provenanceTruth: "SIMULATED",
        receiptId: "ONDO-LOCAL-20260825-001",
        refundReceiptId: null,
        offerId: "meal-offer-gukbap",
        venueId,
        status: "paid",
        paidOOKRW: 19,
        benefitOOKRW: 3,
        balanceOOKRW: 41,
      }],
    }))

    sessionStorage.setItem(accountKey, JSON.stringify({ account: "ACC-ACTIVE", returnTo: null }))
    sessionStorage.setItem(actionKey, JSON.stringify({
      version: 1,
      person: {
        status: "eligible",
        expiresAt,
        reviewReceipt: {
          issuer: "ONDO_REVIEW_FIXTURE",
          executionTruth: "FIXTURE_REVIEW",
          provenanceTruth: "SIMULATED",
          fixtureId: "FX-PER-PUBLIC-INJECT",
          issuedAt,
          expiresAt,
        },
      },
      payment: {
        status: "eligible",
        expiresAt,
        reviewReceipt: {
          issuer: "ONDO_REVIEW_FIXTURE",
          executionTruth: "FIXTURE_REVIEW",
          provenanceTruth: "SIMULATED",
          fixtureId: "FX-PKY-PUBLIC-INJECT",
          issuedAt,
          expiresAt,
        },
      },
      pending: null,
      personRoute: null,
      presentation: null,
      lastConsumed: null,
      outcome: null,
    }))
    sessionStorage.setItem(after19Key, JSON.stringify({
      version: 1,
      age: "eligible",
      ageExpiresAt: expiresAt,
      eligibilityReceipt: {
        schema: "review-age-predicate.v1",
        predicate: "AGE_GTE_19",
        outcome: "eligible",
        issuerType: "REVIEW_FIXTURE",
        provenanceTruth: "SIMULATED",
        fixtureId: "FX-AGE-PUBLIC-INJECT",
        issuedAt,
        expiresAt,
        disclosure: "predicate_only",
      },
      mode: "on",
      activation: "manual",
      expiryNotice: false,
    }))
    sessionStorage.setItem(activityKey, JSON.stringify({
      version: 2,
      profile: {
        displayName: "Injected reviewer",
        from: { value: "Fixture country", consent: true },
        livesIn: { value: "Fixture city", consent: true },
        languages: { value: ["Fixture language"], consent: true },
      },
      reputation: { visit: "repeat", contribution: "established", meetup: "established" },
      stamps: 10,
      acceptedEvidenceIds: ["visit:public-inject"],
      evidenceReceipts: [{
        evidenceId: "visit:public-inject",
        axes: ["visit"],
        addsVisitStamp: true,
        recordedAt: issuedAt,
        provenance: { truth: "REVIEW_FIXTURE", source: "review_fixture" },
      }],
    }))
    sessionStorage.setItem(labsKey, JSON.stringify({
      acknowledged: true,
      wallet: "WAL-READY",
      bridge: "BRG-SIMULATED-SUCCESS",
      phase: "destination_confirmed",
      mint: "NFT-MINTED",
      consent: true,
      quoteExpiresAt,
      traitStates: {
        "merchant-seongsu:offer-foreign-card": "eligible",
        "merchant-euljiro:offer-over19": "eligible",
      },
      walletReview: reviewExecution("FX-LABS-WALLET-SUCCESS", { address: "0x8a71…4d2c" }),
      bridgeReview: reviewExecution("FX-LABS-BRIDGE-SUCCESS", {
        route: "sui-testnet-to-omnione",
        quote: {
          sourceAsset: "USDT",
          sourceNetwork: "Sui Testnet",
          targetAsset: "OOKRW",
          targetNetwork: "OmniOne",
          sourceAmount: 13.5,
          targetAmount: 13_460,
          expiresAt: quoteExpiresAt,
        },
      }),
      badgeReview: reviewExecution("FX-BADGE-SUCCESS", { badge: "travel-keepsake" }),
    }))

    // Exercise every public QA ingress at once. A QA-off artifact may leave
    // these attacker-controlled values in browser storage; it must never read
    // them as authority or expose a review-only success control.
    sessionStorage.setItem(qaEnabledKey, "1")
    sessionStorage.setItem(qaScenarioKey, "payment-declined")
    ;(window as unknown as { __ONDO_B_QA__?: Record<string, unknown> }).__ONDO_B_QA__ = {
      identity: { credentialStatus: "success", outcome: "success", presentationOutcome: "success" },
      credentialStatus: "success",
      identitySetupOutcome: "success",
      eligibility: "success",
      residenceCard: "supported",
      after19Global: "success",
      paymentKyc: "success",
      payment: "success",
      wallet: "success",
      profile: "success",
      profileActivityEvents: Array.from({ length: 10 }, (_, index) => ({
        evidenceId: `visit:public-global-${index}`,
        axes: ["visit"],
        addVisitStamp: true,
      })),
    }
  }, {
    accountKey: B_ACCOUNT_KEY,
    actionKey: B_ACTION_GATE_KEY,
    activityKey: B_ACTIVITY_PROFILE_KEY,
    after19Key: B_AFTER19_SESSION_KEY,
    deviceKey: B_DEVICE_KEY,
    labsKey: LABS_KEY,
    qaEnabledKey: QA_ENABLED_KEY,
    qaScenarioKey: QA_SCENARIO_KEY,
    tableId: TABLE_ID,
    venueId: CANONICAL_VENUE_ID,
    includePlan: plannedTableRefs,
  })
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("blockedbyclient"))
}

async function expectNoReviewControls(page: Page) {
  await expect(page.locator("[data-execution-mode='review']")).toHaveCount(0)
  for (const testId of REVIEW_CONTROL_TEST_IDS) await expect(page.getByTestId(testId)).toHaveCount(0)
  await expect(page.locator("[data-testid*='review']")).toHaveCount(0)
}

test.describe("ONDO B public QA boundary", () => {
  test.skip(
    process.env.ONDO_PUBLIC_QA_BOUNDARY !== "1",
    "Runs only against an isolated QA-off public artifact explicitly selected by the release lane.",
  )

  test("malicious query, global, and serialized review successes stay fail-closed", async ({ page }) => {
    installBRuntimeGuard(page)
    await prepareBPage(page)
    await installMaliciousPublicState(page, false)

    await page.goto("/?city=seoul&qa=1&scenario=payment-declined&profile=review-success#fixture-success", { waitUntil: "domcontentloaded" })
    await expectBRoot(page, "en")
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-city", "seoul")
    await expect.poll(() => page.evaluate(() => ({ pathname: location.pathname, search: location.search, hash: location.hash }))).toEqual({
      pathname: "/",
      search: "?city=seoul",
      hash: "",
    })

    const attackWasInstalled = await page.evaluate(({ activityKey, qaEnabledKey, qaScenarioKey }) => ({
      qaEnabled: sessionStorage.getItem(qaEnabledKey),
      qaScenario: sessionStorage.getItem(qaScenarioKey),
      globalPaymentKyc: (window as unknown as { __ONDO_B_QA__?: { paymentKyc?: unknown } }).__ONDO_B_QA__?.paymentKyc,
      serializedStamps: JSON.parse(sessionStorage.getItem(activityKey) ?? "null")?.stamps,
    }), { activityKey: B_ACTIVITY_PROFILE_KEY, qaEnabledKey: QA_ENABLED_KEY, qaScenarioKey: QA_SCENARIO_KEY })
    expect(attackWasInstalled).toEqual({
      qaEnabled: "1",
      qaScenario: "payment-declined",
      globalPaymentKyc: "success",
      serializedStamps: 10,
    })

    const after19 = page.getByTestId("ondo-b-after19-global")
    await expect(after19).toHaveAttribute("data-after19-age", "unverified")
    await expect(after19).toHaveAttribute("data-after19-mode", "off")
    await expect(page.getByTestId("global-after19-banner")).toHaveCount(0)
    await expectNoReviewControls(page)

    await page.getByTestId("nav-id").click()
    const traveler = page.getByTestId("ondo-b-traveler-id")
    await expect(traveler).toBeVisible()
    await expect(traveler.getByTestId("traveler-id-person")).toHaveAttribute("data-status", "none")
    const age = traveler.getByTestId("traveler-id-age")
    await expect(age).toHaveAttribute("data-status", "expired")
    await expect(age).toHaveAttribute("data-review-result", "false")
    await expect(traveler.getByTestId("traveler-id-credential")).toHaveAttribute("data-status", "none")
    await expect(traveler.getByTestId("traveler-id-payment")).toHaveAttribute("data-status", "none")
    await expect(traveler.getByTestId("wallet-balance")).toHaveAttribute("data-wallet-state", "disconnected")
    // A remembered funding preference is inert product state, not payment or
    // provider authority. Keep the user's valid choice while quarantining the
    // injected Wallet and receipt success claims below.
    await expect(traveler.getByTestId("wallet-payment-method")).toHaveAttribute("data-funding-source", "digital_dollar")
    await expect(traveler.getByTestId("wallet-activity-receipt")).toHaveCount(0)
    await expect(traveler.getByTestId("ondo-b-stamp-milestone")).toHaveAttribute("data-stamps", "0")
    for (const axis of ["identity", "visit", "contribution", "meetup"]) {
      await expect(traveler.getByTestId(`profile-axis-${axis}`)).toHaveAttribute("data-axis-state", "empty")
    }

    await expect.poll(() => page.evaluate(({ actionKey, after19Key, deviceKey }) => {
      const action = JSON.parse(sessionStorage.getItem(actionKey) ?? "null")
      const age = JSON.parse(sessionStorage.getItem(after19Key) ?? "null")
      const device = JSON.parse(localStorage.getItem(deviceKey) ?? "null")
      return {
        person: action?.person,
        payment: action?.payment,
        age: age?.age,
        ageExpiresAt: age?.ageExpiresAt,
        ageMode: age?.mode,
        ageActivation: age?.activation,
        ageReceipt: age?.eligibilityReceipt,
        ageExpiryNotice: age?.expiryNotice,
        receipts: device?.commerceReceipts,
      }
    }, { actionKey: B_ACTION_GATE_KEY, after19Key: B_AFTER19_SESSION_KEY, deviceKey: B_DEVICE_KEY })).toEqual({
      person: { status: "unverified", expiresAt: null },
      payment: { status: "unverified", expiresAt: null },
      age: "unverified",
      ageExpiresAt: null,
      ageMode: "off",
      ageActivation: null,
      ageReceipt: null,
      ageExpiryNotice: true,
      receipts: [],
    })

    await traveler.getByTestId("traveler-id-ktour-id-open").click()
    const setup = page.getByTestId("k-tour-id-setup")
    await expect(setup).toHaveAttribute("data-execution-mode", "normal")
    await expect(setup.getByTestId("ktour-id-route-mobile-id")).toHaveAttribute("data-availability", "unavailable")
    await expect(setup.getByTestId("ktour-id-route-residence-card")).toHaveAttribute("data-availability", "unavailable")
    await expect(setup.getByTestId("ktour-id-route-passport")).toHaveAttribute("data-availability", "unavailable")
    await setup.getByTestId("ktour-id-route-mobile-id").click()
    await expect(setup).toHaveAttribute("data-phase", "unavailable")
    await expect(setup.getByTestId("k-tour-id-unavailable")).toBeVisible()
    await expectNoReviewControls(page)
    await setup.getByTestId("k-tour-id-cancel").click()
    await expect(setup).toHaveCount(0)

    await traveler.getByTestId("traveler-id-person-check").click()
    let check = page.getByTestId("ondo-b-local-check-walkthrough")
    await expect(check).toHaveAttribute("data-check-kind", "person")
    await expect(check).toHaveAttribute("data-execution-mode", "normal")
    await expect(check.getByTestId("direct-person-route-mobile-id")).toHaveAttribute("data-availability", "unavailable")
    await check.getByTestId("direct-person-route-mobile-id").click()
    await expect(check.getByTestId("local-check-result")).toHaveAttribute("data-result", "unavailable")
    await expectNoReviewControls(page)
    await check.getByTestId("direct-person-return").click()
    await expect(check).toHaveCount(0)

    await traveler.getByTestId("traveler-id-age-check").click()
    check = page.getByTestId("ondo-b-local-check-walkthrough")
    await expect(check).toHaveAttribute("data-check-kind", "age")
    await expect(check).toHaveAttribute("data-execution-mode", "normal")
    await check.getByTestId("local-check-boundary-continue").click()
    const ageResult = check.getByTestId("local-check-result")
    await expect(ageResult).toHaveAttribute("data-result", "unavailable")
    await expectNoReviewControls(page)
    await ageResult.getByRole("button").last().click()
    await expect(check).toHaveCount(0)

    await page.getByTestId("nav-my").click()
    await expect(page.getByTestId("my-korea-receipts")).toHaveCount(0)
    await openLabs(page)
    const labs = page.getByTestId("labs-overlay")
    await expect(labs).toHaveAttribute("data-wallet-state", "WAL-DISCONNECTED")
    await expect(labs).toHaveAttribute("data-bridge-state", "BRG-IDLE")
    await expect(labs).toHaveAttribute("data-mint-state", "NFT-LOCKED")
    await expect(labs.getByTestId("labs-bridge-receipt")).toHaveCount(0)
    await expect(labs.getByTestId("labs-badge-result")).toHaveCount(0)
    await expect(labs.getByTestId("labs-badge-mint")).toHaveCount(0)
    // This is a permanent public disclosure for the read-only Labs concept,
    // not proof that a review fixture executed successfully.
    await expect(labs.getByTestId("labs-target-truth")).toHaveAttribute("data-review-provenance", "simulated")
    await expectNoReviewControls(page)

    await expect.poll(() => page.evaluate((key) => {
      const labsState = JSON.parse(sessionStorage.getItem(key) ?? "null")
      return {
        wallet: labsState?.wallet,
        bridge: labsState?.bridge,
        phase: labsState?.phase,
        mint: labsState?.mint,
        consent: labsState?.consent,
        walletReview: labsState?.walletReview,
        bridgeReview: labsState?.bridgeReview,
        badgeReview: labsState?.badgeReview,
      }
    }, LABS_KEY)).toEqual({
      wallet: "WAL-DISCONNECTED",
      bridge: "BRG-IDLE",
      phase: "none",
      mint: "NFT-LOCKED",
      consent: false,
      walletReview: null,
      bridgeReview: null,
      badgeReview: null,
    })

    await labs.getByTestId("labs-connect-wallet").click()
    await expect(labs).toHaveAttribute("data-wallet-state", "WAL-FAILED")
    await expect(labs.getByTestId("labs-wallet-outcome")).toBeVisible()
    await expect(labs.getByTestId("labs-bridge-receipt")).toHaveCount(0)
    await expectNoReviewControls(page)
    await expectBRuntimeClean(page)
  })

  test("plannedTableRefs restore only a browser-local plan, never an external booking success", async ({ page }) => {
    installBRuntimeGuard(page)
    await prepareBPage(page)
    await installMaliciousPublicState(page, true)

    await page.goto("/?qa=1&scenario=table-network&profile=review-success", { waitUntil: "domcontentloaded" })
    await expectBRoot(page, "en")
    await page.getByTestId("nav-my").click()

    const plan = page.getByTestId(`planned-table-${TABLE_ID}`)
    await expect(plan).toBeVisible()
    await expect(plan).toContainText("Meal plan")
    const privacy = page.getByTestId("my-korea-local-privacy")
    await privacy.locator("summary").click()
    await expect(privacy).toContainText("stay in this browser")
    await expect(privacy).toContainText("They are not reservations or synced activity")

    await plan.getByRole("button", { name: "Open Table", exact: true }).click()
    const detail = page.getByTestId("table-detail")
    await expect(detail).toHaveAttribute("data-table-id", TABLE_ID)
    await expect(detail).toHaveAttribute("data-join-stage", "joined")
    await detail.getByTestId("table-open-chat").click()
    await expect(detail).toHaveAttribute("data-join-stage", "chat")
    const arrival = detail.getByTestId("table-arrival-details")
    await arrival.locator("summary").click()
    await expect(arrival).toContainText("Everything stays on this device")
    await expect(arrival).toContainText("doesn’t verify your live location or attendance")
    await expect(detail).not.toContainText(/booking (?:confirmed|sent)|reservation (?:confirmed|created)|host (?:notified|confirmed)|live location verified|attendance verified/i)
    await expect(detail.locator("[data-review-provenance]")).toHaveCount(0)
    await expectNoReviewControls(page)
    await expectBRuntimeClean(page)
  })
})
