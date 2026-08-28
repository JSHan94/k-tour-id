import { expect, type Locator, type Page } from "@playwright/test"

export const B_ROUTE = "/ondo-b"
export const CANONICAL_VENUE_ID = "mois-0021cd596bc5b2a922ad"
export const TABLE_ID = "table-seoul-night-bites"

export const B_DEVICE_KEY = "ondo-b.device.v1"
export const B_ACCOUNT_KEY = "ondo-b.account.v1"
export const B_ACTION_GATE_KEY = "ondo-b.action-gates.v1"
export const B_AFTER19_PREFERENCE_KEY = "ondo-b.after19.preferences.v1"
export const B_AFTER19_SESSION_KEY = "ondo-b.after19.session.v1"
export const B_ACTIVITY_PROFILE_KEY = "ondo-b.activity-profile.v1"

export const B_FLOW_IDS = [
  "FL-001", "FL-002", "FL-003", "FL-004", "FL-005", "FL-006",
  "FL-007", "FL-008", "FL-009", "FL-010", "FL-011", "FL-012",
  "FL-013", "FL-014", "FL-015", "FL-016", "FL-017", "FL-018",
] as const

export const B_CHECKPOINTS = [
  "ENTRY", "DECISION", "CANCEL", "ERROR", "RETRY", "TERMINAL", "RETURN",
] as const

export type BFlowId = (typeof B_FLOW_IDS)[number]
export type BCheckpoint = (typeof B_CHECKPOINTS)[number]
export type BLocale = "en" | "ko" | "ja"
export type EvidenceDisposition = "actual" | "gap" | "not_applicable"

export type BCheckpointContract = {
  id: `B-E2E-${BFlowId}-${BCheckpoint}`
  checkpoint: BCheckpoint
  disposition: EvidenceDisposition
  proof: string
}

export type BFlowContract = {
  flow: BFlowId
  title: string
  testTitle: string
  checkpoints: readonly BCheckpointContract[]
}

function checkpoint(flow: BFlowId, checkpointName: BCheckpoint, disposition: EvidenceDisposition, proof: string): BCheckpointContract {
  return { id: `B-E2E-${flow}-${checkpointName}`, checkpoint: checkpointName, disposition, proof }
}

function flow(
  flowId: BFlowId,
  title: string,
  dispositions: Record<BCheckpoint, readonly [EvidenceDisposition, string]>,
): BFlowContract {
  return {
    flow: flowId,
    title,
    testTitle: `B-E2E-${flowId} ${title}`,
    checkpoints: B_CHECKPOINTS.map((name) => checkpoint(flowId, name, ...dispositions[name])),
  }
}

const A = (proof: string) => ["actual", proof] as const
const N = (proof: string) => ["not_applicable", proof] as const

/**
 * Honest flow registry. `actual` means a browser interaction on `/ondo-b` proves it.
 * `gap` means the Flow Catalog requires it but the fixed product SHA has no honest
 * reachable state. `not_applicable` is reserved for flows whose contract deliberately
 * falls back without a user-facing error/retry surface.
 */
export const B_FLOW_CONTRACTS: readonly BFlowContract[] = [
  flow("FL-001", "Guest Discover", {
    ENTRY: A("real /ondo-b nation surface"), DECISION: A("Seoul compact-count/list/place selection"), CANCEL: A("close place and preserve city"),
    ERROR: A("dedicated map-truth route abort latches data-map-state=error and keeps the sourced list usable"), RETRY: A("Retry map starts a fresh attempt and increments data-map-attempt to 2"), TERMINAL: A("official-source place detail"), RETURN: A("same Seoul discovery context"),
  }),
  flow("FL-002", "Age proof to exact After19 venue", {
    ENTRY: A("locked compact 19+ access inside the exact canonical venue"), DECISION: A("global 19+ prompt preserves venueId"), CANCEL: A("prompt cancel returns to the same locked venue detail"),
    ERROR: A("simulated global 19+ failure retains venue context"), RETRY: A("same venue-scoped prompt retry"), TERMINAL: A("unlocked compact access and global banner"),
    RETURN: A("the exact canonical detail remains mounted with After19 on"),
  }),
  flow("FL-003", "Table to image chat to feedback", {
    ENTRY: A("B-native Pulse Tables detail"), DECISION: A("Account then 19+ join plan with exact draft"), CANCEL: A("gate cancel preserves draft and leave cancel preserves seat"),
    ERROR: A("deterministic 19+ gate and message failures"), RETRY: A("same join gate and failed message retry"), TERMINAL: A("image chat/check-in/feedback receipt"), RETURN: A("reload returns to persisted joined Table"),
  }),
  flow("FL-004", "Checkout to stamp milestone", {
    ENTRY: A("canonical meal benefit in ID · Wallet"), DECISION: A("benefit, wallet, minimum consent and OOKRW quote"), CANCEL: A("offer cancel returns to exact canonical detail with no receipt"),
    ERROR: A("injected payment failure keeps receipt and visit stamp absent"), RETRY: A("B-native payment recovery retries the same offer"), TERMINAL: A("receipt, visit 9→10, then refund receipt"), RETURN: A("receipt return restores the exact origin venue"),
  }),
  flow("FL-005", "Korean CX", {
    ENTRY: A("local-contributor Local Signal Person gate"), DECISION: A("B-native mobile_id_cx / OmniOne CX route"), CANCEL: A("gate cancel preserves exact signal draft"),
    ERROR: A("simulated CX failure"), RETRY: A("same gate retry"), TERMINAL: A("PER-VERIFIED only"), RETURN: A("original local-signal sheet"),
  }),
  flow("FL-006", "Residence Card", {
    ENTRY: A("preparing persona Local Signal Person gate"), DECISION: A("mobile_residence_card route resolves unavailable"), CANCEL: A("gate cancel preserves the exact signal draft"),
    ERROR: A("B-native unavailable result without a fake provider"), RETRY: A("passport_ekyc alternate is the explicit completion route"), TERMINAL: A("PER-VERIFIED only after passport completion"), RETURN: A("original venue-scoped B Local Signal remains exact"),
  }),
  flow("FL-007", "Short-term onboarding", {
    ENTRY: A("first-run guest setup"), DECISION: A("travelling persona and preferences"), CANCEL: A("Explore without setup"),
    ERROR: A("injected B-device persistence failure keeps setup open"), RETRY: N("The canonical onboarding contract falls back to a usable guest Explore; retry is not a required user checkpoint."), TERMINAL: A("ONB-COMPLETE travelling guest"), RETURN: A("real B nation/map shell"),
  }),
  flow("FL-008", "Korean local onboarding", {
    ENTRY: A("first-run guest setup"), DECISION: A("local_contributor persona"), CANCEL: A("Explore without setup"),
    ERROR: A("injected B-device persistence failure keeps setup open"), RETRY: N("The canonical onboarding contract falls back to guest Explore and does not start or retry CX during setup."), TERMINAL: A("map without prematurely opening CX"), RETURN: A("real B nation/map shell"),
  }),
  flow("FL-009", "Resident onboarding", {
    ENTRY: A("first-run guest setup"), DECISION: A("preparing persona"), CANCEL: A("Explore without setup"),
    ERROR: A("injected B-device persistence failure keeps setup open"), RETRY: N("The canonical onboarding contract falls back to guest Explore and does not start or retry Residence checks during setup."), TERMINAL: A("map without prematurely opening Residence route"), RETURN: A("real B nation/map shell"),
  }),
  flow("FL-010", "Account gate", {
    ENTRY: A("Save on canonical venue"), DECISION: A("account explanation/start"), CANCEL: A("Escape preserves selected venue"),
    ERROR: A("simulated account failure"), RETRY: A("same save task retry"), TERMINAL: A("ACC-ACTIVE and one saved venue"), RETURN: A("same canonical venue"),
  }),
  flow("FL-011", "Save and My Korea", {
    ENTRY: A("canonical venue Save"), DECISION: A("local save starts without losing venue context"), CANCEL: A("visible local-save error can be dismissed while remaining unsaved"),
    ERROR: A("save-failed fixture exposes a visible local-save failure while preserving the venue and CTA"), RETRY: A("Retry save reaches the persisted Saved state"), TERMINAL: A("saved card persists through reload into My Korea"), RETURN: A("saved card returns to exact venue"),
  }),
  flow("FL-012", "Local signal first mission", {
    ENTRY: A("B-native venue Local Signal"), DECISION: A("tag/note/photo draft"), CANCEL: A("Escape discards draft and returns to detail"),
    ERROR: A("device-write failure preserves exact draft"), RETRY: A("same post action succeeds after storage recovery"), TERMINAL: A("Contribution only; no payment or visit inference"), RETURN: A("exact canonical detail remains mounted"),
  }),
  flow("FL-013", "Manual 19+ proof", {
    ENTRY: A("global 19+ chip"), DECISION: A("venue/city-scoped minimum confirmation"), CANCEL: A("prompt cancel to normal ONDO"),
    ERROR: A("injected global proof failure"), RETRY: A("same prompt retry"), TERMINAL: A("eligible/on global session"), RETURN: A("B map remains available"),
  }),
  flow("FL-014", "Auto After19", {
    ENTRY: A("fixed KST evening resume"), DECISION: A("four guards cause banner"), CANCEL: A("manual off"),
    ERROR: A("an expired-proof reason status explains why the main map returned"), RETRY: A("Check 19+ again reopens the age-check recovery path"), TERMINAL: A("A19-ON"), RETURN: A("same-session manual-off survives reload"),
  }),
  flow("FL-015", "Optional public profile", {
    ENTRY: A("ID public profile"), DECISION: A("per-field public consent"), CANCEL: A("cancel keeps prior fields"),
    ERROR: A("profile=failure keeps prior fields"), RETRY: A("Try save again"), TERMINAL: A("only selected fields public"), RETURN: A("ID with four-axis trust panel"),
  }),
  flow("FL-016", "Evidence and merchant trait", {
    ENTRY: A("venue facts and Labs trait section"), DECISION: A("canonical truth labels"), CANCEL: A("sheet close to venue/My"),
    ERROR: A("unknown/stale and ineligible trait"), RETRY: A("trait retry fixture"), TERMINAL: A("limited eligibility, never safety guarantee"), RETURN: A("same venue or Labs parent"),
  }),
  flow("FL-017", "Payment KYC", {
    ENTRY: A("B-native meal benefit payment decision"), DECISION: A("separate payment_kyc action axis"), CANCEL: A("gate cancel to same origin-scoped offer"),
    ERROR: A("injected payment-axis failure"), RETRY: A("same checkout token retry"), TERMINAL: A("payment eligible independently, then receipt"), RETURN: A("receipt returns to exact canonical origin"),
  }),
  flow("FL-018", "Labs wallet and bridge", {
    ENTRY: A("My Korea Labs opt-in"), DECISION: A("acknowledge/signer/quote"), CANCEL: A("bridge cancel changes no assets"),
    ERROR: A("expiry and ordered bridge failure"), RETRY: A("fresh quote"), TERMINAL: A("simulated receipt and opt-in badge"), RETURN: A("reload persistence and My Korea close"),
  }),
]

export type BSurfaceId =
  | "onboarding" | "nation" | "city-list" | "place" | "account-gate" | "age-gate"
  | "tables" | "table-chat" | "local-signal" | "checkout" | "identity" | "profile" | "labs" | "after19"

export const B_CONTENT_CASES = [
  "onboarding", "nation", "city-list", "place", "account-gate", "age-gate", "tables",
  "table-chat", "local-signal", "checkout", "identity", "profile", "labs", "after19",
].flatMap((surface) => (["ko", "en"] as const).map((locale) => ({
  id: `B-COPY-${surface.toUpperCase()}-${locale.toUpperCase()}`,
  surface: surface as BSurfaceId,
  locale,
})))

type RuntimeEvidence = { product: string[]; externalMap: string[]; externalAsset: string[]; navigationAbort: string[] }
const runtimeEvidence = new WeakMap<Page, RuntimeEvidence>()
const EXTERNAL_MAP_HOSTS = new Set(["tiles.openfreemap.org"])
const EXTERNAL_ASSET_HOSTS = new Set(["fonts.googleapis.com", "fonts.gstatic.com"])

function isExternalMapUrl(raw: string | undefined) {
  if (!raw) return false
  try { return EXTERNAL_MAP_HOSTS.has(new URL(raw).hostname) } catch { return raw.includes("tiles.openfreemap.org") }
}

function isExternalAssetUrl(raw: string | undefined) {
  if (!raw) return false
  try { return EXTERNAL_ASSET_HOSTS.has(new URL(raw).hostname) } catch { return [...EXTERNAL_ASSET_HOSTS].some((host) => raw.includes(host)) }
}

function isExpectedNextNavigationAbort(raw: string, reason: string) {
  if (reason !== "net::ERR_ABORTED") return false
  try {
    const url = new URL(raw)
    return url.pathname === B_ROUTE && url.searchParams.has("_rsc")
  } catch {
    return false
  }
}

export function installBRuntimeGuard(page: Page) {
  const evidence: RuntimeEvidence = { product: [], externalMap: [], externalAsset: [], navigationAbort: [] }
  runtimeEvidence.set(page, evidence)
  page.on("console", (message) => {
    if (message.type() !== "error") return
    const location = message.location().url
    const item = `console: ${message.text()}${location ? ` @ ${location}` : ""}`
    if (isExternalMapUrl(location) || message.text().includes("tiles.openfreemap.org")) evidence.externalMap.push(item)
    else if (isExternalAssetUrl(location) || [...EXTERNAL_ASSET_HOSTS].some((host) => message.text().includes(host))) evidence.externalAsset.push(item)
    else evidence.product.push(item)
  })
  page.on("pageerror", (error) => evidence.product.push(`pageerror: ${error.message}`))
  page.on("requestfailed", (request) => {
    const reason = request.failure()?.errorText ?? "request failed"
    if (isExternalMapUrl(request.url())) evidence.externalMap.push(`requestfailed: ${request.url()} · ${reason}`)
    else if (isExternalAssetUrl(request.url())) evidence.externalAsset.push(`requestfailed: ${request.url()} · ${reason}`)
    else if (isExpectedNextNavigationAbort(request.url(), reason)) evidence.navigationAbort.push(`requestfailed: ${request.url()} · ${reason}`)
    else evidence.product.push(`requestfailed: ${request.url()} · ${reason}`)
  })
  page.on("response", (response) => {
    if (response.status() < 400) return
    const item = `response: ${response.status()} ${response.url()}`
    if (isExternalMapUrl(response.url())) evidence.externalMap.push(item)
    else if (isExternalAssetUrl(response.url())) evidence.externalAsset.push(item)
    else evidence.product.push(item)
  })
}

export function getBRuntimeEvidence(page: Page): RuntimeEvidence {
  const evidence = runtimeEvidence.get(page)
  if (!evidence) throw new Error("B runtime guard was not installed for this page")
  return evidence
}

export function hasBRuntimeGuard(page: Page) {
  return runtimeEvidence.has(page)
}

export async function expectBRuntimeClean(page: Page) {
  expect(getBRuntimeEvidence(page).product, "product runtime errors (external OpenFreeMap failures are classified separately)").toEqual([])
}

export type BSessionSeed = Record<string, unknown> & {
  onboarding?: string
  persona?: "short_term" | "long_term_resident" | "korean_local" | "travelling" | "preparing" | "local_contributor"
  account?: string
  person?: string
  age?: string
  ageExpiresAt?: string
  paymentKyc?: string
  after19?: string
  stamps?: number
}

export async function prepareBPage(page: Page) {
  await page.clock.setFixedTime(new Date("2026-08-19T20:30:00+09:00"))
  await page.addInitScript(() => {
    window.addEventListener("unhandledrejection", (event) => console.error(`unhandledrejection: ${String(event.reason)}`))
    window.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style")
      style.textContent = "nextjs-portal { display: none !important; }"
      document.head.append(style)
    }, { once: true })
  })
}

export async function seedB(
  page: Page,
  { locale = "en", session = {}, local = {}, clearFeatures = true }: {
    locale?: BLocale
    session?: BSessionSeed
    local?: Record<string, unknown>
    clearFeatures?: boolean
  } = {},
) {
  await page.addInitScript(({ nextLocale, nextSession, nextLocal, shouldClear }) => {
    const legacySession: Record<string, unknown> & {
      onboarding: string
      persona: string
      account: string
      person: string
      age: string
      ageExpiresAt?: string
      paymentKyc: string
      after19: string
      stamps: number
    } = {
      onboarding: "ONB-COMPLETE", persona: "short_term", account: "ACC-GUEST", person: "PER-UNVERIFIED",
      age: "AGE-UNVERIFIED", paymentKyc: "PKY-NOT-STARTED", after19: "A19-OFF", stamps: 9, ...nextSession,
    }
    if (!localStorage.getItem("ondo.preferences.v3")) localStorage.setItem("ondo.preferences.v3", JSON.stringify({
      locale: nextLocale, guideSeen: true, autoNight: true, savedVenueIds: [], discoveryPreferences: [], ...nextLocal,
    }))
    if (!sessionStorage.getItem("ondo.session.v3")) sessionStorage.setItem("ondo.session.v3", JSON.stringify(legacySession))
    const persona = legacySession.persona === "korean_local"
      ? "local_contributor"
      : legacySession.persona === "long_term_resident"
        ? "preparing"
        : legacySession.persona === "short_term"
          ? "travelling"
          : legacySession.persona
    const legacyMembership = legacySession["tableMembershipById"] && typeof legacySession["tableMembershipById"] === "object"
      ? legacySession["tableMembershipById"] as Record<string, unknown>
      : {}
    const plannedTableRefs = legacyMembership["table-seoul-night-bites"]
      ? [{ tableId: "table-seoul-night-bites", venueId: "mois-0021cd596bc5b2a922ad" }]
      : []
    if (!localStorage.getItem("ondo-b.device.v1")) localStorage.setItem("ondo-b.device.v1", JSON.stringify({
      locale: nextLocale,
      onboarding: legacySession.onboarding === "ONB-NEW" ? "ONB-NEW" : "ONB-COMPLETE",
      persona: persona ?? null,
      discoveryPreferences: [],
      savedVenueIds: [],
      savedEditorialPlaceIds: [],
      privateNotesByVenue: {},
      recentVenueIds: [],
      recentEditorialPlaceIds: [],
      plannedTableRefs,
      localSignalPostedVenueIds: [],
      localPulseEvidenceByVenue: {},
      localInteractionBoundarySeen: false,
      commerceLocalBoundarySeen: false,
      commerceReceipts: [],
      ...nextLocal,
    }))

    const axisExpiresAt = "2026-08-20T11:30:00.000Z"
    if (!sessionStorage.getItem("ondo-b.account.v1")) sessionStorage.setItem("ondo-b.account.v1", JSON.stringify({
      account: legacySession.account === "ACC-ACTIVE" ? "ACC-ACTIVE" : "ACC-GUEST",
      returnTo: null,
    }))
    if (!sessionStorage.getItem("ondo-b.action-gates.v1")) sessionStorage.setItem("ondo-b.action-gates.v1", JSON.stringify({
      version: 1,
      person: legacySession.person === "PER-VERIFIED" ? { status: "eligible", expiresAt: axisExpiresAt } : { status: "unverified", expiresAt: null },
      payment: legacySession.paymentKyc === "PKY-VERIFIED" ? { status: "eligible", expiresAt: axisExpiresAt } : { status: "unverified", expiresAt: null },
      pending: null,
      lastConsumed: null,
      outcome: null,
    }))
    const ageEligible = legacySession.age === "AGE-VERIFIED"
    if (!sessionStorage.getItem("ondo-b.after19.session.v1")) sessionStorage.setItem("ondo-b.after19.session.v1", JSON.stringify({
      version: 1,
      age: ageEligible ? "eligible" : "unverified",
      ageExpiresAt: ageEligible ? (legacySession.ageExpiresAt ?? axisExpiresAt) : null,
      mode: legacySession.after19 === "A19-ON" ? "on" : legacySession.after19 === "A19-MANUAL-OFF" ? "manual-off" : "off",
      activation: legacySession.after19 === "A19-ON" ? "manual" : null,
      expiryNotice: false,
    }))
    if (!localStorage.getItem("ondo-b.after19.preferences.v1")) localStorage.setItem("ondo-b.after19.preferences.v1", JSON.stringify({ version: 1, autoOpen: true }))
    if (!sessionStorage.getItem("ondo-b.activity-profile.v1")) sessionStorage.setItem("ondo-b.activity-profile.v1", JSON.stringify({
      profile: legacySession["profile"] ?? { displayName: "Traveler", from: { value: "", consent: false }, livesIn: { value: "", consent: false }, languages: { value: [], consent: false } },
      reputation: legacySession["reputation"] ?? { visit: "new", contribution: "new", meetup: "new" },
      stamps: typeof legacySession.stamps === "number" ? legacySession.stamps : 0,
      acceptedEvidenceIds: legacySession["acceptedActivityEventKeys"] ?? [],
    }))
    if (shouldClear && sessionStorage.getItem("ondo.qa.b-seed-cleared") !== "1") {
      sessionStorage.removeItem("ondo.chat.v2")
      sessionStorage.removeItem("ondo.table-outcomes.v2")
      sessionStorage.removeItem("ondo.labs.v2")
      sessionStorage.removeItem("ondo-b.labs.v1")
      sessionStorage.removeItem("ondo.accepted-visits.v2")
      sessionStorage.setItem("ondo.qa.b-seed-cleared", "1")
    }
  }, { nextLocale: locale, nextSession: session, nextLocal: local, shouldClear: clearFeatures })
}

export async function seedFreshOnboarding(page: Page, locale: BLocale = "en") {
  await page.addInitScript((nextLocale) => {
    if (sessionStorage.getItem("ondo.qa.b-fresh-cleared") === "1") return
    localStorage.removeItem("ondo.preferences.v3")
    if (!localStorage.getItem("ondo-b.device.v1")) localStorage.setItem("ondo-b.device.v1", JSON.stringify({
      locale: nextLocale,
      onboarding: "ONB-NEW",
      persona: null,
      discoveryPreferences: [],
      savedVenueIds: [],
      savedEditorialPlaceIds: [],
      privateNotesByVenue: {},
      recentVenueIds: [],
      recentEditorialPlaceIds: [],
      plannedTableRefs: [],
      localSignalPostedVenueIds: [],
      localPulseEvidenceByVenue: {},
      localInteractionBoundarySeen: false,
      commerceLocalBoundarySeen: false,
      commerceReceipts: [],
    }))
    sessionStorage.removeItem("ondo.session.v3")
    sessionStorage.removeItem("ondo-b.account.v1")
    sessionStorage.removeItem("ondo-b.action-gates.v1")
    sessionStorage.removeItem("ondo-b.after19.session.v1")
    sessionStorage.removeItem("ondo-b.activity-profile.v1")
    sessionStorage.removeItem("ondo.chat.v2")
    sessionStorage.removeItem("ondo.table-outcomes.v2")
    sessionStorage.removeItem("ondo.labs.v2")
    sessionStorage.removeItem("ondo-b.labs.v1")
    sessionStorage.removeItem("ondo.accepted-visits.v2")
    sessionStorage.setItem("ondo.qa.b-fresh-cleared", "1")
    if (nextLocale === "ko") localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale: "ko", guideSeen: false, autoNight: true, savedVenueIds: [], discoveryPreferences: [] }))
  }, locale)
}

export async function gotoB(page: Page, query = "") {
  await page.goto(`${B_ROUTE}${query}`, { waitUntil: "domcontentloaded" })
  return expectBRoot(page)
}

export async function expectBRoot(page: Page, locale?: BLocale) {
  const root = page.getByTestId("ondo-b-root")
  await expect(root).toBeVisible()
  await expect(root).toHaveAttribute("data-variant", "B")
  if (locale) await expect(root).toHaveAttribute("data-locale", locale)
  return root
}

export async function openCanonicalVenue(page: Page, { expanded = true, query = "" }: { expanded?: boolean; query?: string } = {}) {
  const separator = query ? `&${query.replace(/^\?/, "")}` : ""
  await gotoB(page, `?venueId=${CANONICAL_VENUE_ID}${separator}`)
  await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
  if (expanded) {
    await page.getByTestId("canonical-place-details").click()
    const detail = page.getByTestId("canonical-place-overlay")
    await expect(detail).toBeVisible()
    // Do not navigate away while the on-demand official-detail request is
    // still in flight. An intentional surface transition would otherwise
    // abort the request and make the global runtime guard report a false
    // product failure in long, serial suites.
    await expect(detail.locator("[data-detail-state]"))
      .toHaveAttribute("data-detail-state", "ready")
  }
}

export async function openTables(page: Page, tableId = TABLE_ID) {
  await page.getByTestId("nav-tables").click()
  const tables = page.getByTestId("tables-entry")
  await expect(tables).toBeVisible()
  await page.getByTestId(`table-open-${tableId}`).click()
  await expect(page.getByTestId("table-detail")).toHaveAttribute("data-table-id", tableId)
}

export async function openLabs(page: Page) {
  await page.getByTestId("nav-my").click()
  const milestone = page.getByTestId("open-labs-milestone")
  if (await milestone.isVisible().catch(() => false)) await milestone.click()
  else await page.getByTestId("open-labs").click()
  // The B-native Labs dialog label follows the active locale (Labs / 기술
  // 실험실 / 技術ラボ). The provider-neutral sheet test id proves that the
  // actual modal mounted without baking an English-only accessible name into
  // shared visual setup.
  await expect(page.getByTestId("ondo-sheet")).toBeVisible()
}

export async function finishAccountGate(page: Page) {
  const saveGate = page.getByTestId("account-save-gate")
  if (await saveGate.isVisible().catch(() => false)) {
    await saveGate.getByTestId("account-start").click()
    await saveGate.getByTestId("account-complete").click()
    return
  }
  await page.getByTestId("ondo-b-action-gate").getByTestId("action-gate-confirm").click()
}

export async function finishPersonGate(page: Page) {
  const gate = page.getByTestId("ondo-b-action-gate")
  await gate.getByTestId("local-check-boundary-continue").click()
  await expect.poll(async () => (await sessionState(page)).person).toBe("PER-VERIFIED")
}

export async function finishAgeGate(page: Page) {
  const actionGate = page.getByTestId("ondo-b-action-gate")
  if (await actionGate.isVisible().catch(() => false)) await actionGate.getByTestId("after19-start").click()
  else await page.getByTestId("global-after19-confirm").click()
}

export async function finishPaymentGate(page: Page) {
  await page.getByTestId("ondo-b-action-gate").getByTestId("action-gate-confirm").click()
  await expect.poll(async () => (await sessionState(page)).paymentKyc).toBe("PKY-VERIFIED")
}

export async function sessionState(page: Page) {
  return page.evaluate(() => {
    const legacy = JSON.parse(sessionStorage.getItem("ondo.session.v3") ?? "{}") as Record<string, unknown>
    const account = JSON.parse(sessionStorage.getItem("ondo-b.account.v1") ?? "{}") as Record<string, unknown>
    const action = JSON.parse(sessionStorage.getItem("ondo-b.action-gates.v1") ?? "{}") as {
      person?: { status?: unknown }
      payment?: { status?: unknown }
      pending?: unknown
    }
    const after19 = JSON.parse(sessionStorage.getItem("ondo-b.after19.session.v1") ?? "{}") as Record<string, unknown>
    const activity = JSON.parse(sessionStorage.getItem("ondo-b.activity-profile.v1") ?? "{}") as Record<string, unknown>
    return {
      ...legacy,
      account: account.account ?? legacy.account ?? "ACC-GUEST",
      person: action.person?.status === "eligible" ? "PER-VERIFIED" : "PER-UNVERIFIED",
      paymentKyc: action.payment?.status === "eligible" ? "PKY-VERIFIED" : "PKY-NOT-STARTED",
      age: after19.age === "eligible" ? "AGE-VERIFIED" : "AGE-UNVERIFIED",
      after19: after19.mode === "on" ? "A19-ON" : after19.mode === "manual-off" ? "A19-MANUAL-OFF" : "A19-OFF",
      stamps: activity.stamps ?? legacy.stamps ?? 0,
      reputation: activity.reputation ?? legacy.reputation,
      gate: action.pending ?? null,
    } as Record<string, unknown>
  })
}

export async function expectNoRawTruthLeaks(page: Page, scope?: Locator) {
  const text = await (scope ?? page.getByTestId("ondo-b-root")).innerText()
  for (const forbidden of [/\bFX-[A-Z0-9-]+\b/, /\bSCN-[A-Z0-9-]+\b/, /fixtureId/i, /stack trace/i, /\bundefined\b/i, /\bnull\b/i]) {
    expect(text, `forbidden product copy: ${String(forbidden)}`).not.toMatch(forbidden)
  }
}

export async function expectNoHorizontalOverflow(page: Page, scope?: Locator) {
  const overflow = scope
    ? await scope.evaluate((element) => element.scrollWidth - element.clientWidth)
    : await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
}

export async function expectMinimumControlTargets(scope: Locator) {
  const undersized = await scope.locator("button:visible, a[href]:visible, [role='button']:visible").evaluateAll((nodes) => nodes.flatMap((node) => {
    const element = node as HTMLElement
    if (element.getAttribute("aria-disabled") === "true" || (element instanceof HTMLButtonElement && element.disabled)) return []
    const box = element.getBoundingClientRect()
    // Chromium can expose a nominal CSS 44px target as 43.98px at fractional
    // device scaling. Judge the rendered CSS-pixel target after rounding, the
    // same value recorded in failure evidence, rather than failing on subpixel
    // rasterization noise.
    return Math.round(box.width) < 44 || Math.round(box.height) < 44
      ? [{ action: element.getAttribute("aria-label") ?? element.textContent?.trim() ?? element.tagName, width: Math.round(box.width), height: Math.round(box.height) }]
      : []
  }))
  expect(undersized).toEqual([])
}

/** Reach a real, user-visible B surface. Used by content/a11y/pixel tests. */
export async function setupBSurface(page: Page, surface: BSurfaceId, locale: BLocale) {
  if (surface === "onboarding") {
    await seedFreshOnboarding(page, locale)
    await gotoB(page)
    return page.getByTestId("ondo-onboarding")
  }

  const session: BSessionSeed = {
    account: "ACC-ACTIVE",
    person: "PER-VERIFIED",
    age: "AGE-UNVERIFIED",
    paymentKyc: "PKY-VERIFIED",
    stamps: 10,
  }
  if (surface === "account-gate") Object.assign(session, { account: "ACC-GUEST", person: "PER-UNVERIFIED", paymentKyc: "PKY-NOT-STARTED" })
  if (surface === "age-gate") Object.assign(session, { age: "AGE-UNVERIFIED" })
  if (surface === "after19") Object.assign(session, { age: "AGE-VERIFIED", ageExpiresAt: "2026-08-20T20:30:00+09:00" })
  if (surface === "table-chat") Object.assign(session, { age: "AGE-VERIFIED", ageExpiresAt: "2026-08-20T20:30:00+09:00", tableMembershipById: { [TABLE_ID]: "confirmed" } })

  await seedB(page, { locale, session })
  if (surface === "nation" || surface === "after19") {
    await gotoB(page, surface === "after19" ? "?city=seoul" : "")
    if (surface === "after19") await expect(page.getByTestId("global-after19-banner")).toBeVisible()
    return surface === "after19" ? page.getByTestId("ondo-b-after19-global") : page.getByTestId("ondo-b-map-entry")
  }
  if (surface === "city-list") {
    await gotoB(page)
    await page.locator("[data-city='seoul']").click()
    await page.getByTestId("ondo-b-view-toggle").click()
    return page.getByTestId("ondo-b-map-entry")
  }
  if (surface === "place") {
    await openCanonicalVenue(page)
    return page.getByTestId("canonical-place-overlay")
  }
  if (surface === "account-gate") {
    await openCanonicalVenue(page)
    await page.getByTestId("canonical-venue-save").click()
    return page.getByTestId("account-save-gate")
  }
  if (surface === "age-gate") {
    await gotoB(page, "?city=seoul")
    await page.getByTestId("global-after19-toggle").click()
    return page.getByTestId("global-after19-prompt-layer")
  }
  if (surface === "tables" || surface === "table-chat") {
    await gotoB(page)
    await page.getByTestId("nav-tables").click()
    if (surface === "tables") return page.getByTestId("tables-entry")
    await page.getByTestId(`table-open-${TABLE_ID}`).click()
    const chat = page.getByTestId("table-chat")
    if (!(await chat.isVisible().catch(() => false))) {
      const openChat = page.getByTestId("table-open-chat")
      if (await openChat.isVisible().catch(() => false)) await openChat.click()
    }
    await expect(chat).toBeVisible()
    return chat
  }
  if (surface === "local-signal") {
    await openCanonicalVenue(page)
    await page.getByTestId("canonical-local-signal-open").click()
    return page.getByTestId("ondo-b-local-signal")
  }
  if (surface === "checkout") {
    await openCanonicalVenue(page)
    await page.getByTestId("canonical-meal-benefit-open").click()
    return page.getByTestId("ondo-b-id-wallet-commerce")
  }
  if (surface === "identity" || surface === "profile") {
    await gotoB(page)
    await page.getByTestId("nav-id").click()
    return surface === "profile" ? page.getByTestId("ondo-profile-panel") : page.getByTestId("ondo-b-traveler-id")
  }
  await gotoB(page)
  await openLabs(page)
  const acknowledge = page.getByTestId("labs-acknowledge")
  if (await acknowledge.isVisible().catch(() => false)) await acknowledge.click()
  return page.getByTestId("labs-overlay")
}
