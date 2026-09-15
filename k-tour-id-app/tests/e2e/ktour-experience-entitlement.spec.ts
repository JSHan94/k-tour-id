import { expect, test, type BrowserContext, type Page } from "@playwright/test"

const PLACE = "mois-0021cd596bc5b2a922ad"
test.describe.configure({ timeout: 120_000 })
const failures = new WeakMap<BrowserContext, string[]>()

test.beforeEach(async ({ context }) => {
  const errors: string[] = []
  failures.set(context, errors)
  context.on("page", page => page.on("pageerror", error => errors.push(error.message)))
  await context.route("**/*", async route => {
    const request = route.request()
    const url = new URL(request.url())
    // Public mock UI only. No provider, real payment or chain requests, even
    // when a malformed callback could otherwise cause an external navigation.
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())
      || /sumsub|onfido|omni.?one|opendid|fullnode|sui\.io|walletconnect|stripe/i.test(url.hostname)) {
      errors.push(`Forbidden request: ${request.method()} ${url.origin}`)
      await route.abort("blockedbyclient")
      return
    }
    await route.continue()
  })
})
test.afterEach(async ({ context }) => { expect(failures.get(context) ?? []).toEqual([]) })

async function openFromPublicMap(page: Page) {
  // No query flags, injected credential, account, wallet or fixture authority.
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await expect(page.getByTestId("ondo-b-root")).toHaveAttribute("data-hydrated", "true")
  await page.getByTestId("ondo-b-nation").locator('[data-city="seoul"]').click()
  await expect(page.getByTestId("ondo-b-city-header")).toContainText("Seoul")
  await page.getByTestId("ondo-b-search").fill("Roba")
  const row = page.getByTestId("ondo-b-venue-list").locator(`li[data-venue-id="${PLACE}"] > button`)
  if (!(await row.isVisible())) await page.getByTestId("ondo-b-view-toggle").click()
  await row.click()
  const peek = page.getByTestId("canonical-place-details")
  if (await peek.isVisible()) await peek.click()
  await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
  await page.getByTestId("experience-open").click()
  await expect(page.getByTestId("experience-flow")).toHaveAttribute("data-stage", "offer")
  await expect(page.getByTestId("experience-boundary")).toContainText("not a restaurant voucher or booking")
}

async function checkToProposal(page: Page) {
  const visited = new Set<string>()
  let holderAcknowledgements = 0
  const flow = page.getByTestId("experience-flow")
  const start = page.getByTestId("experience-check")
  if (await start.isVisible()) await start.click()
  else await page.getByTestId("experience-recheck").click()
  for (let step = 0; step < 18; step += 1) {
    if (await flow.getAttribute("data-stage") === "proposal") return visited
    const candidates = [
      "experience-pass-approve", "k-tour-id-method-mobile-id", "k-tour-id-consent-approve", "identity-handoff-approve", "k-tour-id-continue",
      "person-route-choice-mobile_id_cx", "local-check-boundary-continue", "action-gate-confirm",
    ]
    let action = ""
    await expect.poll(async () => {
      if (await flow.getAttribute("data-stage") === "proposal") return "proposal"
      for (const id of candidates) {
        const control = page.getByTestId(id).filter({ visible: true }).first()
        if (await control.isVisible() && await control.isEnabled()) {
          if (await control.evaluate(node => Boolean(node.closest('[inert], [aria-hidden="true"]')))) continue
          if (id === "person-route-choice-mobile_id_cx" && await control.getAttribute("aria-pressed") === "true") continue
          action = id; return id
        }
      }
      return "waiting"
    }, { timeout: 15_000 }).not.toBe("waiting")
    if (await flow.getAttribute("data-stage") === "proposal") return visited
    const gate = page.getByTestId("ondo-b-action-gate")
    if (await gate.isVisible()) {
      visited.add(`gate:${await gate.getAttribute("data-active-gate")}`)
      await expect(gate).toHaveAttribute("data-return-cta", "REDEEM_DEMO_ENTITLEMENT")
      if (action === "action-gate-confirm" && await gate.getAttribute("data-active-gate") === "credential"
        && await page.getByTestId("action-gate-presentation").isVisible()) {
        await expect(page.getByTestId("credential-visible-predicate")).toContainText("Identity verified")
        await expect(page.getByTestId("credential-visible-predicate")).not.toContainText("stay")
        visited.add("presentation:person")
      }
    }
    visited.add(action)
    if (action === "k-tour-id-continue") {
      const holder = page.getByTestId("k-tour-id-holder-delivery")
      if (await holder.isVisible()) {
        await expect(holder).toHaveAttribute("data-holder-preparation", "automatic")
        await expect(holder).toHaveAttribute("data-holder-state", "receipt")
        await expect(holder).toContainText("Nothing is saved until you acknowledge below")
        holderAcknowledgements += 1
        visited.add(`holder-ack:${holderAcknowledgements}`)
      }
    }
    await page.getByTestId(action).filter({ visible: true }).first().click()
  }
  throw new Error("Experience did not reach its bounded approval screen")
}

async function approve(page: Page) {
  await expect(page.getByTestId("experience-flow")).toHaveAttribute("data-stage", "proposal")
  await expect(page.getByTestId("experience-approve")).toBeDisabled()
  await expect(page.getByTestId("experience-scope")).toContainText("No payment or transfer")
  await page.getByTestId("experience-consent").check()
  await page.getByTestId("experience-approve").click()
}

async function selectScenario(page: Page, scenario: string) {
  const details = page.getByTestId("experience-details")
  await details.locator(":scope > summary").click()
  await page.getByTestId("experience-scenario").selectOption(scenario)
  await details.locator(":scope > summary").click()
}

async function assertNoPaidOrVisitEffects(page: Page) {
  const state = await page.evaluate(() => {
    const device = JSON.parse(localStorage.getItem("ondo-b.device.v1") ?? "{}")
    const gates = JSON.parse(sessionStorage.getItem("ondo-b.action-gates.v1") ?? "{}")
    const activity = JSON.parse(sessionStorage.getItem("ondo-b.activity-profile.v1") ?? "{}")
    return { stamps: activity.stamps ?? 0, evidence: activity.acceptedEvidenceIds ?? [], signals: device.localSignalPostedVenueIds ?? [],
      payment: gates.payment?.status ?? "unverified", funding: sessionStorage.getItem("ondo-b.funding-rail.v1") }
  })
  expect(state.stamps).toBe(0)
  expect(state.evidence).toEqual([])
  expect(state.signals).toEqual([])
  expect(state.payment).toBe("unverified")
  expect(state.funding).toBeNull()
  await expect(page.getByTestId("payment-receipt")).toHaveCount(0)
}

test("UX08 public guest map → Roba → account/Person/VP → one approval → guide → same place; reload stays single-use", async ({ page }, testInfo) => {
  await openFromPublicMap(page)
  await assertNoPaidOrVisitEffects(page)
  const visited = await checkToProposal(page)
  expect(visited.has("gate:account")).toBe(true)
  expect(visited.has("gate:person")).toBe(true)
  expect(visited.has("gate:credential")).toBe(true)
  expect(visited.has("presentation:person")).toBe(true)
  expect(visited.has("experience-pass-approve")).toBe(true)
  expect(visited.has("k-tour-id-method-mobile-id")).toBe(false)
  expect(visited.has("identity-handoff-approve")).toBe(false)
  expect(visited.has("holder-ack:1")).toBe(true)
  expect(visited.has("holder-ack:2")).toBe(false)
  const flow = page.getByTestId("experience-flow")
  const intent = await flow.getAttribute("data-intent-id")
  await page.screenshot({ path: testInfo.outputPath("01-contextual-consent.png"), fullPage: true })
  await approve(page)
  await expect(flow).toHaveAttribute("data-stage", "complete")
  await expect(flow).toHaveAttribute("data-audit", "confirmed")
  await expect(flow).toHaveAttribute("data-execution-count", "1")
  await expect(flow).toHaveAttribute("data-used-count", "1")
  await expect(page.getByTestId("experience-guide-content").getByRole("heading", { level: 3 })).toHaveCount(3)
  await assertNoPaidOrVisitEffects(page)
  await page.screenshot({ path: testInfo.outputPath("02-guide-complete.png"), fullPage: true })
  await page.reload({ waitUntil: "domcontentloaded" })
  await expect(flow).toHaveAttribute("data-stage", "complete")
  await expect(flow).toHaveAttribute("data-intent-id", intent!)
  await expect(flow).toHaveAttribute("data-execution-count", "1")
  await expect(flow).toHaveAttribute("data-used-count", "1")
  await expect(page.getByTestId("experience-approve")).toHaveCount(0)
  await page.getByTestId("experience-return").click()
  const place = page.getByTestId("canonical-place-overlay")
  await expect(place).toBeVisible()
  await expect(page.getByTestId("experience-open")).toHaveAttribute("data-service-place-id", PLACE)
  await expect(page.getByTestId("ondo-b-city-header")).toContainText("Seoul")
  await expect(page.getByTestId("ondo-b-search")).toHaveValue("Roba")
  await page.getByTestId("experience-open").click()
  await expect(flow).toHaveAttribute("data-intent-id", intent!)
  await expect(flow).toHaveAttribute("data-used-count", "1")
  await page.screenshot({ path: testInfo.outputPath("03-reopened-same-guide.png"), fullPage: true })
})

for (const scenario of ["auditDelay", "auditFailure"] as const) {
  test(`UX08 ${scenario}: guide stays provided while only its record is retried`, async ({ page }) => {
    await openFromPublicMap(page)
    await selectScenario(page, scenario)
    await checkToProposal(page)
    await approve(page)
    const flow = page.getByTestId("experience-flow")
    await expect(flow).toHaveAttribute("data-stage", "complete")
    await expect(flow).toHaveAttribute("data-audit", scenario === "auditDelay" ? "pending" : "failed")
    const intent = await flow.getAttribute("data-intent-id")
    await expect(page.getByTestId("experience-guide-content")).toBeVisible()
    await page.getByTestId("experience-audit-retry").click()
    await expect(flow).toHaveAttribute("data-audit", "confirmed")
    await expect(flow).toHaveAttribute("data-intent-id", intent!)
    await expect(flow).toHaveAttribute("data-execution-count", "1")
    await expect(flow).toHaveAttribute("data-used-count", "1")
    await expect(page.getByTestId("experience-approve")).toHaveCount(0)
    await assertNoPaidOrVisitEffects(page)
  })
}

test("UX08 final eligibility decline keeps consumed permission but zero guide use and no restart", async ({ page }) => {
  await openFromPublicMap(page)
  await selectScenario(page, "serviceBlocked")
  await checkToProposal(page)
  await approve(page)
  const flow = page.getByTestId("experience-flow")
  await expect(flow).toHaveAttribute("data-stage", "blocked")
  await expect(flow).toHaveAttribute("data-authorization", "consumed")
  await expect(flow).toHaveAttribute("data-execution-count", "1")
  await expect(flow).toHaveAttribute("data-used-count", "0")
  await expect(page.getByTestId("experience-guide-content")).toHaveCount(0)
  await expect(page.getByTestId("experience-check")).toHaveCount(0)
  await expect(page.getByTestId("experience-approve")).toHaveCount(0)
  await assertNoPaidOrVisitEffects(page)
  await page.getByTestId("experience-return").click()
  await expect(page.getByTestId("experience-open")).toBeVisible()
})

test("UX08 unknown execution → confirmed stop → same intent fresh proposal requires new consent", async ({ page }) => {
  await openFromPublicMap(page)
  await selectScenario(page, "executionUnknown")
  await checkToProposal(page)
  await approve(page)
  const flow = page.getByTestId("experience-flow")
  await expect(flow).toHaveAttribute("data-stage", "unknown")
  const intent = await flow.getAttribute("data-intent-id")
  await expect(flow).toHaveAttribute("data-used-count", "0")
  await page.getByTestId("experience-stop").click()
  await expect(flow).toHaveAttribute("data-stage", "cancelPending")
  await expect(flow).toHaveAttribute("data-execution-count", "0")
  await page.getByTestId("experience-check-result").click()
  await expect(flow).toHaveAttribute("data-stage", "cancelled")
  await selectScenario(page, "success")
  await checkToProposal(page)
  await expect(flow).toHaveAttribute("data-intent-id", intent!)
  await expect(page.getByTestId("experience-consent")).not.toBeChecked()
  await expect(page.getByTestId("experience-approve")).toBeDisabled()
  await approve(page)
  await expect(flow).toHaveAttribute("data-stage", "complete")
  await expect(flow).toHaveAttribute("data-execution-count", "1")
  await expect(flow).toHaveAttribute("data-used-count", "1")
})

test("UX08 unavailable IndexedDB fails closed with an operable same-place return", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "indexedDB", { configurable: true, get() { throw new Error("Independent test: IndexedDB unavailable") } })
  })
  await page.goto(`/?city=seoul&venueId=${PLACE}&detail=1`, { waitUntil: "domcontentloaded" })
  await page.getByTestId("experience-open").click()
  await expect(page.getByTestId("experience-storage-error")).toBeVisible()
  await expect(page.getByTestId("experience-guide-content")).toHaveCount(0)
  await expect(page.getByTestId("experience-approve")).toHaveCount(0)
  await page.getByTestId("experience-return").click()
  await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
  await assertNoPaidOrVisitEffects(page)
})

test("UX08 two real same-origin tabs approving the shared campaign cannot create a second execution or use", async ({ page, context }) => {
  await openFromPublicMap(page)
  await checkToProposal(page)
  const first = page.getByTestId("experience-flow")
  const intent = await first.getAttribute("data-intent-id")
  const secondPage = await context.newPage()
  try {
    // Both tabs obtain their own visible Person/VP consent; no credential or
    // grant is copied through storage, evaluate(), URL parameters or test hooks.
    await openFromPublicMap(secondPage)
    await checkToProposal(secondPage)
    const second = secondPage.getByTestId("experience-flow")
    await expect(second).toHaveAttribute("data-intent-id", intent!)
    await expect(first).toHaveAttribute("data-stage", "proposal")
    await Promise.all([page.getByTestId("experience-consent").check(), secondPage.getByTestId("experience-consent").check()])
    const approvalButtons = await Promise.all([page, secondPage].map(async tab => {
      const button = tab.getByTestId("experience-approve")
      await expect(button).toBeVisible()
      await expect(button).toBeEnabled()
      const handle = await button.elementHandle()
      if (!handle) throw new Error("Expected both consented approval controls before the race")
      return handle
    }))
    // Dispatch each captured, consented DOM control once. Locator.click() would
    // retry a removed button after the other tab's legitimate broadcast wins.
    // No application method, record or authority is invoked/injected directly.
    await Promise.all(approvalButtons.map(button => button.dispatchEvent("click")))
    for (const flow of [first, second]) {
      await expect(flow).toHaveAttribute("data-stage", "complete")
      await expect(flow).toHaveAttribute("data-audit", "confirmed")
      await expect(flow).toHaveAttribute("data-execution-count", "1")
      await expect(flow).toHaveAttribute("data-used-count", "1")
      await expect(flow).toHaveAttribute("data-intent-id", intent!)
    }
    const stored = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open("ktour-experience-mock-v1", 1)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      return new Promise<unknown[]>((resolve, reject) => {
        const tx = db.transaction("experiences", "readonly")
        const request = tx.objectStore("experiences").getAll()
        tx.oncomplete = () => { db.close(); resolve(request.result) }
        tx.onerror = () => { db.close(); reject(tx.error) }
      })
    })
    expect(stored).toHaveLength(1)
    expect(stored[0]).toMatchObject({ intentId: intent, executionCount: 1, usedCount: 1,
      executionRef: `${intent}:execution`, fulfillmentRef: `${intent}:service`, auditRef: `${intent}:audit` })
    await assertNoPaidOrVisitEffects(page)
    await assertNoPaidOrVisitEffects(secondPage)
  } finally { await secondPage.close() }
})

test("UX08 Person-only pass keeps other services locked; later age service requires explicit full-pass consent and delivery", async ({ page }, testInfo) => {
  await openFromPublicMap(page)
  await checkToProposal(page)
  await approve(page)
  await expect(page.getByTestId("experience-flow")).toHaveAttribute("data-stage", "complete")
  await page.getByTestId("experience-return").click()
  await page.getByTestId("canonical-place-overlay").locator('[data-place-return-focus="detail_close"]').click()
  await page.getByTestId("nav-id").click()
  await page.getByTestId("kpass-service-toggle").click()
  await expect(page.getByTestId("kpass-service-person")).toHaveAttribute("data-status", "allowed")
  for (const service of ["age", "visitor_benefit", "payment"]) {
    await expect(page.getByTestId(`kpass-service-${service}`)).toHaveAttribute("data-status", "denied")
  }
  await expect(page.getByTestId("kpass-service-card")).toContainText("₩0")
  await page.getByTestId("kpass-manage-setup").click()
  await expect(page.getByTestId("identity-person-only-scope")).toContainText("Age, stay, payments and meal benefits are not included")
  await page.getByTestId("k-tour-id-return").click()
  await page.getByTestId("kpass-service-age").click()
  await page.getByTestId("table-open-table-seoul-night-bites").click()
  await page.getByTestId("table-join").click()
  await expect(page.getByTestId("kpass-policy-decision")).toHaveAttribute("data-reason", "service_not_entitled")
  await expect(page.getByTestId("table-join-confirmation")).toHaveCount(0)
  await page.getByTestId("kpass-additional-checks-open").click()
  const setup = page.getByTestId("k-tour-id-setup")
  await expect(setup).toHaveAttribute("data-phase", "method_select")
  await expect(page.getByTestId("identity-additional-checks-scope")).toContainText("current pass stays unchanged")
  await page.getByTestId("k-tour-id-method-mobile-id").click()
  await expect(page.getByTestId("identity-additional-checks-consent")).toContainText("payment checks remain separate")
  await page.screenshot({ path: testInfo.outputPath("04-separately-consented-pass-checks.png"), fullPage: true })
  await page.getByTestId("k-tour-id-consent-approve").click()
  const handoff = setup.getByTestId("k-tour-id-route-step")
  await expect(handoff).toHaveAttribute("data-handoff-state", "ready")
  await handoff.getByTestId("k-tour-id-continue").click()
  await expect(handoff).toHaveAttribute("data-handoff-state", "waiting")
  await handoff.getByTestId("identity-handoff-approve").click()
  await expect(handoff).toHaveAttribute("data-handoff-state", "approved")
  await handoff.getByTestId("k-tour-id-continue").click()
  const holder = setup.getByTestId("k-tour-id-holder-delivery")
  await expect(holder).toHaveAttribute("data-holder-state", "ready")
  await holder.getByTestId("k-tour-id-continue").click()
  await expect(holder).toHaveAttribute("data-holder-state", "receipt")
  await expect(holder.getByTestId("identity-holder-receipt")).toContainText("Nothing is saved until you acknowledge")
  await holder.getByTestId("k-tour-id-continue").click()
  // Issuance closes this retained sheet. Do not treat its outgoing frame as
  // another delivery step or attempt a second acknowledgment while it exits.
  await expect(setup).toBeHidden()
  await expect(page.getByTestId("kpass-policy-decision")).toHaveCount(0)
  // A newly issued age predicate does not itself consent to joining a table.
  await expect(page.getByTestId("table-join-confirmation")).toHaveCount(0)
  const gate = page.getByTestId("ondo-b-action-gate")
  await expect(gate).toHaveAttribute("data-active-gate", "age")
  await gate.locator("section > header > button").first().click()
  await page.getByTestId("table-detail").locator("article > header > button").first().click()
  await page.getByTestId("nav-id").click()
  await page.getByTestId("kpass-service-toggle").click()
  for (const service of ["person", "age", "visitor_benefit"]) {
    await expect(page.getByTestId(`kpass-service-${service}`)).toHaveAttribute("data-status", "allowed")
  }
  await expect(page.getByTestId("kpass-service-payment")).toHaveAttribute("data-status", "needs_proof")
  await expect(page.getByTestId("kpass-service-card")).toContainText("100,000")
  await page.getByTestId("kpass-manage-setup").click()
  await expect(page.getByTestId("identity-person-only-scope")).toHaveCount(0)
  await assertNoPaidOrVisitEffects(page)
})
