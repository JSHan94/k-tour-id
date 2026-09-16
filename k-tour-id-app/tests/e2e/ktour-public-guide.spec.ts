import { expect, test, type BrowserContext, type Page } from "@playwright/test"
import { hashReturnToSnapshot } from "../../features/ondo/contracts/return-to-integrity"

const PLACE = "mois-0021cd596bc5b2a922ad"
const DATABASE = "ktour-experience-mock-v1"
const LEGACY_KEY = "local-demo-traveler:ktour-neighborhood-guide-v1"
const SAVE_KEY = "local-demo-traveler:ktour-neighborhood-guide-save-v2"
const LEGACY_MARKER = "ktour.experience-open.v1"
const SAVE_MARKER = "ktour.experience-save-open.v2"
type Probe = { opens: string[] }
type ProbeWindow = Window & { __publicGuideProbe: Probe }
const failures = new WeakMap<BrowserContext, string[]>()
test.describe.configure({ timeout: 120_000 })

test.beforeEach(async ({ context }) => {
  const errors: string[] = []
  failures.set(context, errors)
  context.on("page", page => page.on("pageerror", error => errors.push(error.message)))
  await context.addInitScript(() => {
    const probe: Probe = { opens: [] }
    ;(window as unknown as ProbeWindow).__publicGuideProbe = probe
    const original = IDBFactory.prototype.open
    IDBFactory.prototype.open = function (name: string, version?: number) {
      probe.opens.push(name)
      return version === undefined ? original.call(this, name) : original.call(this, name, version)
    }
  })
  await context.route("**/*", async route => {
    const request = route.request()
    const url = new URL(request.url())
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

async function openGuide(page: Page) {
  // Plain public routes and visible controls only; no fixture/gate/account seed.
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await expect(page.getByTestId("ondo-b-root")).toHaveAttribute("data-hydrated", "true")
  await page.getByTestId("ondo-b-nation").locator('[data-city="seoul"]').click()
  await page.getByTestId("ondo-b-search").fill("Roba")
  const row = page.getByTestId("ondo-b-venue-list").locator(`li[data-venue-id="${PLACE}"] > button`)
  if (!(await row.isVisible())) await page.getByTestId("ondo-b-view-toggle").click()
  await row.click()
  const details = page.getByTestId("canonical-place-details")
  if (await details.isVisible()) await details.click()
  await expect(page.getByTestId("canonical-place-overlay")).toHaveAttribute("data-venue-id", PLACE)
  await page.getByTestId("experience-open").click()
  await expectPublicReading(page)
}

async function expectPublicReading(page: Page) {
  await expect(page.getByTestId("experience-public-guide")).toBeVisible()
  await expect(page.getByTestId("experience-guide-content").getByRole("heading", { level: 3 })).toHaveCount(3)
  await expect(page.getByTestId("experience-flow")).toHaveCount(0)
  await expect(page.getByTestId("ondo-b-action-gate")).toHaveCount(0)
  await expect(page.getByTestId("experience-add-to-pass")).toBeEnabled()
}

async function closePublicGuide(page: Page) {
  const sheet = page.getByTestId("ondo-sheet").filter({ has: page.getByTestId("experience-public-guide") })
  await sheet.locator('[data-sheet-navigation="close"]').click()
  await expect(page.getByTestId("experience-public-guide")).toHaveCount(0)
}

async function opens(page: Page) {
  return page.evaluate(() => (window as unknown as ProbeWindow).__publicGuideProbe.opens)
}

async function relevantState(page: Page) {
  return page.evaluate(({ saveMarker, legacyMarker }) => {
    const session = (key: string) => sessionStorage.getItem(key)
    return {
      marker: session(saveMarker), legacyMarker: session(legacyMarker),
      gates: session("ondo-b.action-gates.v1"), funding: session("ondo-b.funding-rail.v1"),
      activity: session("ondo-b.activity-profile.v1"), device: localStorage.getItem("ondo-b.device.v1"),
    }
  }, { saveMarker: SAVE_MARKER, legacyMarker: LEGACY_MARKER })
}

function expectNoGateAuthority(raw: string | null) {
  // The shell persists an empty gate session during hydration. Reading must
  // not turn that baseline into a pending request or an approved authority.
  expect(JSON.parse(raw ?? "{}")).toMatchObject({ pending: null, presentation: null, lastConsumed: null,
    person: { status: "unverified" }, payment: { status: "unverified" } })
}

/** Test diagnostics only, called AFTER checking the application's open count.
 * Never used to create a current credential, permit, approval or saved record. */
async function records(page: Page) {
  return page.evaluate(({ database }) => new Promise<Record<string, unknown>[]>((resolve, reject) => {
    const request = indexedDB.open(database, 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction("experiences", "readonly")
      const read = tx.objectStore("experiences").getAll()
      tx.oncomplete = () => { db.close(); resolve(read.result) }
      tx.onabort = tx.onerror = () => { db.close(); reject(tx.error) }
    }
  }), { database: DATABASE })
}

function legacyUnknownRecord() {
  const now = Date.now() - 60_000
  const intentId = "EXP-legacy-open-12345678"
  const campaignId = "ktour-neighborhood-guide-v1"
  const expiresAt = now + 300_000
  const proposalDigest = hashReturnToSnapshot({ intentId, placeId: PLACE, campaignId,
    action: "open-neighborhood-guide", recipient: "demo-traveler-wallet", agent: "local-demo-helper",
    maxUses: 1, moneyKrw: 0, expiresAt, policy: "person-only-nonfinancial.v1", model: "prepared-proposal.v1" })!
  return { version: 1, mockOnly: true, key: LEGACY_KEY, actor: "local-demo-traveler", placeId: PLACE, campaignId,
    intentId, revision: 3, createdAt: now, updatedAt: now + 2,
    scope: { action: "open-neighborhood-guide", recipient: "demo-traveler-wallet", agent: "local-demo-helper",
      placeId: PLACE, campaignId, intentId, maxUses: 1, moneyKrw: 0, expiresAt, policy: "person-only-nonfinancial.v1",
      proposalDigest, approvedAt: now + 1, consentDigest: hashReturnToSnapshot({ intentId, proposalDigest, approvedAt: now + 1, approved: true }) },
    authorization: "unknown", fulfillment: "not_started", audit: "not_started", cancelRequested: false,
    executionCount: 0, usedCount: 0, executionRef: null, fulfillmentRef: null, auditRef: null, blockReason: null }
}

test("GUIDE01 public reading opens no IDB, creates no gate or save marker, and returns to the exact place", async ({ page }, testInfo) => {
  await openGuide(page)
  const baseline = await relevantState(page)
  expect(baseline.marker).toBeNull()
  expectNoGateAuthority(baseline.gates)
  expect(await opens(page)).toEqual([])
  await page.getByTestId("experience-guide-content").getByRole("heading", { level: 3 }).last().scrollIntoViewIfNeeded()
  await page.getByTestId("experience-public-details").locator(":scope > summary").click()
  await expect(page.getByTestId("experience-public-details")).toContainText("not a signed VC")
  await page.screenshot({ path: testInfo.outputPath("01-guide-without-check.png"), fullPage: true })
  await closePublicGuide(page)
  await expect(page.getByTestId("canonical-place-overlay")).toHaveAttribute("data-venue-id", PLACE)
  await expect(page.getByTestId("experience-open")).toBeFocused()
  await expect(page.getByTestId("ondo-b-search")).toHaveValue("Roba")
  expect(await relevantState(page)).toEqual(baseline)
  expect(await opens(page)).toEqual([])
  await page.getByTestId("experience-open").click()
  await expectPublicReading(page)
  expect(await opens(page)).toEqual([])
})

test("GUIDE02 legacy opening history and marker stay untouched; only an explicit save creates a separate v2 intent", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await expect(page.getByTestId("ondo-b-root")).toHaveAttribute("data-hydrated", "true")
  const legacy = legacyUnknownRecord()
  // The sole seeded state is an obsolete v1 history item and its old marker.
  // It has no current-v2 authority, credential, account or pass presentation.
  await page.evaluate(({ database, record, marker, place }) => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(database, 1)
    request.onupgradeneeded = () => request.result.createObjectStore("experiences", { keyPath: "key" })
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction("experiences", "readwrite")
      tx.objectStore("experiences").add(record)
      tx.oncomplete = () => { db.close(); sessionStorage.setItem(marker, place); resolve() }
      tx.onabort = tx.onerror = () => { db.close(); reject(tx.error) }
    }
  }), { database: DATABASE, record: legacy, marker: LEGACY_MARKER, place: PLACE })
  await openGuide(page) // Fresh page resets the instrumentation, not the legacy data.
  expect(await opens(page)).toEqual([])
  expect(await relevantState(page)).toMatchObject({ marker: null, legacyMarker: PLACE })
  expectNoGateAuthority((await relevantState(page)).gates)
  expect(await records(page)).toEqual([legacy])
  await page.getByTestId("experience-add-to-pass").click()
  await expect(page.getByTestId("ondo-b-action-gate")).toHaveAttribute("data-active-gate", "account")
  await page.getByTestId("action-gate-cancel").click()
  await expectPublicReading(page)
  const history = await records(page)
  expect(history).toHaveLength(2)
  expect(history.find(row => row.key === LEGACY_KEY)).toEqual(legacy)
  expect(history.find(row => row.key === SAVE_KEY)).toMatchObject({ version: 2, authorization: "none", scope: null,
    fulfillment: "not_started", executionCount: 0, usedCount: 0 })
  expect(await relevantState(page)).toMatchObject({ marker: null, legacyMarker: PLACE })
})

test("GUIDE03 unavailable storage never blocks reading; only Add to pass reports its save error", async ({ page, context }, testInfo) => {
  await context.addInitScript((database: string) => {
    const original = IDBFactory.prototype.open
    IDBFactory.prototype.open = function (name: string, version?: number) {
      if (name === database) {
        ;(window as unknown as ProbeWindow).__publicGuideProbe.opens.push(name)
        throw new DOMException("Storage blocked for test", "SecurityError")
      }
      return version === undefined ? original.call(this, name) : original.call(this, name, version)
    }
  }, DATABASE)
  await openGuide(page)
  expect(await opens(page)).toEqual([])
  await expect(page.getByTestId("experience-storage-error")).toHaveCount(0)
  await closePublicGuide(page)
  await expect(page.getByTestId("experience-open")).toBeFocused()
  await page.getByTestId("experience-open").click()
  await expectPublicReading(page)
  await page.getByTestId("experience-add-to-pass").click()
  await expect(page.getByTestId("experience-storage-error")).toBeVisible()
  await expect(page.getByTestId("experience-guide-content").getByRole("heading", { level: 3 })).toHaveCount(3)
  await expect(page.getByTestId("experience-check")).toHaveCount(0)
  await expect(page.getByTestId("experience-approve")).toHaveCount(0)
  await expect(page.getByTestId("ondo-b-action-gate")).toHaveCount(0)
  await expect(page.getByTestId("experience-flow")).not.toHaveAttribute("data-intent-id")
  expect(await opens(page)).toEqual([DATABASE])
  expect((await relevantState(page)).marker).toBeNull()
  expectNoGateAuthority((await relevantState(page)).gates)
  await page.screenshot({ path: testInfo.outputPath("02-save-unavailable-reading-preserved.png"), fullPage: true })
  await page.getByTestId("experience-return").click()
  await expect(page.getByTestId("experience-open")).toBeFocused()
  await page.getByTestId("experience-open").click()
  await expectPublicReading(page)
  expect(await opens(page)).toEqual([DATABASE])
})

test("GUIDE04 declining the initial save check returns to free reading without consuming any action", async ({ page }) => {
  await openGuide(page)
  await page.getByTestId("experience-add-to-pass").click()
  const gate = page.getByTestId("ondo-b-action-gate")
  await expect(gate).toHaveAttribute("data-active-gate", "account")
  await expect(gate).toHaveAttribute("data-return-cta", "REDEEM_DEMO_ENTITLEMENT")
  await page.getByTestId("action-gate-cancel").click()
  await expectPublicReading(page)
  expect((await relevantState(page)).marker).toBeNull()
  const history = await records(page)
  expect(history).toHaveLength(1)
  expect(history[0]).toMatchObject({ key: SAVE_KEY, version: 2, scope: null, authorization: "none",
    fulfillment: "not_started", audit: "not_started", executionCount: 0, usedCount: 0 })
  const count = (await opens(page)).length
  await page.getByTestId("experience-guide-content").getByRole("heading", { level: 3 }).last().scrollIntoViewIfNeeded()
  await closePublicGuide(page)
  await expect(page.getByTestId("experience-open")).toBeFocused()
  await page.getByTestId("experience-open").click()
  await expectPublicReading(page)
  expect(await opens(page)).toHaveLength(count)
})

async function saveThroughVisibleConsent(page: Page) {
  await page.getByTestId("experience-add-to-pass").click()
  const flow = page.getByTestId("experience-flow")
  await expect(flow).toBeAttached()
  for (let step = 0; step < 18; step += 1) {
    let action = ""
    await expect.poll(async () => {
      if (await flow.getAttribute("data-stage") === "proposal") return "proposal"
      for (const id of ["experience-pass-approve", "k-tour-id-continue", "person-route-choice-mobile_id_cx",
        "local-check-boundary-continue", "action-gate-confirm"]) {
        const control = page.getByTestId(id).filter({ visible: true }).first()
        if (!(await control.isVisible()) || !(await control.isEnabled())) continue
        if (await control.evaluate(node => Boolean(node.closest('[inert], [aria-hidden="true"]')))) continue
        if (id === "person-route-choice-mobile_id_cx" && await control.getAttribute("aria-pressed") === "true") continue
        action = id
        return id
      }
      return "waiting"
    }, { timeout: 15_000 }).not.toBe("waiting")
    if (await flow.getAttribute("data-stage") === "proposal") break
    await page.getByTestId(action).filter({ visible: true }).first().click()
  }
  await expect(flow).toHaveAttribute("data-stage", "proposal")
  await expect(page.getByTestId("experience-approve")).toBeDisabled()
  await expect(page.getByTestId("experience-scope")).toContainText("No payment or transfer")
  await page.getByTestId("experience-consent").check()
  await page.getByTestId("experience-approve").click()
  await expect(flow).toHaveAttribute("data-stage", "complete")
  await expect(flow).toHaveAttribute("data-audit", "confirmed")
}

test("GUIDE05 a genuinely saved guide reopens as public content from the pass and returns focus without rewriting the save", async ({ page }, testInfo) => {
  await openGuide(page)
  await saveThroughVisibleConsent(page)
  const before = await records(page)
  expect(before).toHaveLength(1)
  expect(before[0]).toMatchObject({ key: SAVE_KEY, version: 2, authorization: "consumed", fulfillment: "fulfilled",
    audit: "confirmed", executionCount: 1, usedCount: 1, scope: { action: "save-neighborhood-guide-to-pass", recipient: "demo-traveler-pass" } })
  await page.getByTestId("experience-return").click()
  const place = page.getByTestId("canonical-place-overlay")
  await expect(place).toHaveAttribute("data-venue-id", PLACE)
  await place.getByRole("button", { name: "Close place", exact: true }).click()
  await page.getByTestId("nav-id").click()
  const saved = page.getByTestId("experience-saved-guide")
  await expect(saved).toBeVisible()
  await expect(saved).toContainText("demo record")
  await saved.click()
  await expectPublicReading(page)
  expect((await relevantState(page)).marker).toBeNull()
  await page.screenshot({ path: testInfo.outputPath("03-saved-guide-public-reading.png"), fullPage: true })
  await closePublicGuide(page)
  await expect(page.getByTestId("nav-id")).toHaveAttribute("aria-current", "page")
  await expect(saved).toBeFocused()
  await expect(saved).toBeInViewport()
  expect(await records(page)).toEqual(before)
  await expect(page.getByTestId("payment-receipt")).toHaveCount(0)
  const state = await relevantState(page)
  expect(state.funding).toBeNull()
  expect(JSON.parse(state.activity ?? "{}").stamps ?? 0).toBe(0)
  expect(JSON.parse(state.gates ?? "{}").payment?.status ?? "unverified").toBe("unverified")
})
