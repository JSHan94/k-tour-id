import { expect, type Locator, type Page } from "@playwright/test"

export const B_ROUTE = "/ondo-b"
export const B_ROUTE_SEAM_READY = true
export const CANONICAL_VENUE_ID = "mois-0021cd596bc5b2a922ad"
export const TABLE_ID = "table-seongsu-dinner"

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
export type BLocale = "en" | "ko"
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
    ENTRY: A("real /ondo-b nation surface"), DECISION: A("Seoul/List/place selection"), CANCEL: A("close place and preserve city"),
    ERROR: A("dedicated map-truth route abort latches data-map-state=error and keeps the sourced list usable"), RETRY: A("Retry map starts a fresh attempt and increments data-map-attempt to 2"), TERMINAL: A("official-source place detail"), RETURN: A("same Seoul discovery context"),
  }),
  flow("FL-002", "Age proof to exact After19 venue", {
    ENTRY: A("locked After19 card inside the exact canonical venue"), DECISION: A("age-only JIT explanation preserves venueId"), CANCEL: A("gate cancel returns to the same locked venue detail"),
    ERROR: A("simulated age failure retains the venue-scoped return token"), RETRY: A("same venue age task retry"), TERMINAL: A("verified After19 venue card and banner"),
    RETURN: A("consumed OPEN_AFTER19 action restores the exact venue detail with After19 on"),
  }),
  flow("FL-003", "Table to image chat to feedback", {
    ENTRY: A("shared Tables surface mounted in B"), DECISION: A("place/time join request"), CANCEL: A("leave confirmation cancel"),
    ERROR: A("deterministic table-network failure and locked chat"), RETRY: A("visible join retry"), TERMINAL: A("chat photo/check-in/feedback receipt"), RETURN: A("reload returns to joined Table"),
  }),
  flow("FL-004", "Checkout to stamp milestone", {
    ENTRY: A("canonical venue checkout"), DECISION: A("KRW/OOKRW preview confirmation"), CANCEL: A("cancel keeps receipt/stamp absent"),
    ERROR: A("payment-declined keeps stamp 9"), RETRY: A("failed checkout Try again"), TERMINAL: A("receipt then unique visit 9 to 10"), RETURN: A("close returns to same venue context"),
  }),
  flow("FL-005", "Korean CX", {
    ENTRY: A("Korean persona local-signal Person gate"), DECISION: A("OmniOne CX route"), CANCEL: A("gate cancel preserves signal draft"),
    ERROR: A("simulated CX failure"), RETRY: A("same gate retry"), TERMINAL: A("PER-VERIFIED only"), RETURN: A("original local-signal sheet"),
  }),
  flow("FL-006", "Residence Card", {
    ENTRY: A("resident local-signal Person gate"), DECISION: A("Mobile Residence Card route"), CANCEL: A("gate cancel preserves task"),
    ERROR: A("unavailable route disclosure"), RETRY: A("passport alternate"), TERMINAL: A("PER-VERIFIED only"), RETURN: A("original local-signal sheet"),
  }),
  flow("FL-007", "Short-term onboarding", {
    ENTRY: A("first-run guide"), DECISION: A("short-term intent/preferences"), CANCEL: A("Explore as guest"),
    ERROR: A("onboarding=failure fallback"), RETRY: N("validation failure intentionally falls through to the usable map; no retry screen is specified"), TERMINAL: A("ONB-COMPLETE guest"), RETURN: A("real B nation/map shell"),
  }),
  flow("FL-008", "Korean local onboarding", {
    ENTRY: A("first-run guide"), DECISION: A("Korean-local persona"), CANCEL: A("Explore as guest"),
    ERROR: A("onboarding=failure fallback"), RETRY: N("fallback is the terminal Guest map; CX is not started here"), TERMINAL: A("map without CX gate"), RETURN: A("real B nation/map shell"),
  }),
  flow("FL-009", "Resident onboarding", {
    ENTRY: A("first-run guide"), DECISION: A("resident persona"), CANCEL: A("Explore as guest"),
    ERROR: A("onboarding=failure fallback"), RETRY: N("fallback is the terminal Guest map; Residence Card is not started here"), TERMINAL: A("map without Residence gate"), RETURN: A("real B nation/map shell"),
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
    ENTRY: A("venue Local Signal"), DECISION: A("note/photo draft"), CANCEL: A("Cancel draft returns to venue"),
    ERROR: A("local-signal-fail preserves draft"), RETRY: A("visible Try again plus clean-route success"), TERMINAL: A("Visit and Contribution only"), RETURN: A("Return to same venue"),
  }),
  flow("FL-013", "Manual 19+ proof", {
    ENTRY: A("After 19 chip"), DECISION: A("Confirm 19+"), CANCEL: A("Escape to normal ONDO"),
    ERROR: A("simulated proof failure"), RETRY: A("same proof retry"), TERMINAL: A("AGE-VERIFIED/A19-ON"), RETURN: A("B map remains available"),
  }),
  flow("FL-014", "Auto After19", {
    ENTRY: A("fixed KST evening resume"), DECISION: A("four guards cause banner"), CANCEL: A("manual off"),
    ERROR: N("a failed guard deliberately renders normal ONDO, not an error surface"), RETRY: N("guards are reevaluated on a later resume; there is no user retry CTA"), TERMINAL: A("A19-ON"), RETURN: A("same-session manual-off survives reload"),
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
    ENTRY: A("checkout Continue with Payment KYC"), DECISION: A("separate Payment KYC gate"), CANCEL: A("gate cancel to same checkout"),
    ERROR: A("simulated KYC failure"), RETRY: A("same checkout token retry"), TERMINAL: A("PKY-VERIFIED only"), RETURN: A("same checkout, then receipt"),
  }),
  flow("FL-018", "Labs wallet and bridge", {
    ENTRY: A("My Korea Labs opt-in"), DECISION: A("acknowledge/signer/quote"), CANCEL: A("bridge cancel changes no assets"),
    ERROR: A("expiry and ordered bridge failure"), RETRY: A("fresh quote"), TERMINAL: A("simulated receipt and opt-in badge"), RETURN: A("reload persistence and My Korea close"),
  }),
]

export type BSurfaceId =
  | "onboarding" | "nation" | "city-list" | "place" | "account-gate" | "age-gate"
  | "tables" | "table-chat" | "local-signal" | "checkout" | "identity" | "profile" | "labs" | "after19"

export type BPixelCase = {
  id: `B-PX-${string}`
  surface: BSurfaceId
  locale: BLocale
  width: 390 | 430 | 1440
  height: 844 | 932 | 1000
  project: "mobile-chromium" | "desktop-chromium"
  selector: string
}

/** Layout-distinct, reachable surfaces only. No 18×4 multiplication. */
export const B_PIXEL_CASES: readonly BPixelCase[] = [
  { id: "B-PX-ONBOARDING-390-EN", surface: "onboarding", locale: "en", width: 390, height: 844, project: "mobile-chromium", selector: "[data-testid='ondo-onboarding']" },
  { id: "B-PX-NATION-390-KO", surface: "nation", locale: "ko", width: 390, height: 844, project: "mobile-chromium", selector: "[data-testid='ondo-b-map-entry']" },
  { id: "B-PX-CITY-LIST-430-EN", surface: "city-list", locale: "en", width: 430, height: 932, project: "mobile-chromium", selector: "[data-testid='ondo-b-map-entry']" },
  { id: "B-PX-PLACE-390-EN", surface: "place", locale: "en", width: 390, height: 844, project: "mobile-chromium", selector: "[data-testid='canonical-place-overlay']" },
  { id: "B-PX-ACCOUNT-GATE-390-KO", surface: "account-gate", locale: "ko", width: 390, height: 844, project: "mobile-chromium", selector: "[data-testid='ondo-gate-overlay']" },
  { id: "B-PX-TABLES-430-EN", surface: "tables", locale: "en", width: 430, height: 932, project: "mobile-chromium", selector: "[data-testid='tables-entry']" },
  { id: "B-PX-LOCAL-SIGNAL-390-EN", surface: "local-signal", locale: "en", width: 390, height: 844, project: "mobile-chromium", selector: "[data-testid='local-signal-overlay']" },
  { id: "B-PX-CHECKOUT-430-KO", surface: "checkout", locale: "ko", width: 430, height: 932, project: "mobile-chromium", selector: "[data-testid='checkout-overlay']" },
  { id: "B-PX-AFTER19-390-EN", surface: "after19", locale: "en", width: 390, height: 844, project: "mobile-chromium", selector: "[data-testid='ondo-after19-layer']" },
  { id: "B-PX-NATION-DESKTOP-EN", surface: "nation", locale: "en", width: 1440, height: 1000, project: "desktop-chromium", selector: "[data-testid='ondo-b-root']" },
  { id: "B-PX-PLACE-DESKTOP-EN", surface: "place", locale: "en", width: 1440, height: 1000, project: "desktop-chromium", selector: "[data-testid='canonical-place-overlay']" },
  { id: "B-PX-IDENTITY-DESKTOP-KO", surface: "identity", locale: "ko", width: 1440, height: 1000, project: "desktop-chromium", selector: "[data-testid='ondo-identity-entry']" },
  { id: "B-PX-LABS-DESKTOP-EN", surface: "labs", locale: "en", width: 1440, height: 1000, project: "desktop-chromium", selector: "[data-testid='labs-overlay']" },
]

export const B_CONTENT_CASES = [
  "onboarding", "nation", "city-list", "place", "account-gate", "age-gate", "tables",
  "table-chat", "local-signal", "checkout", "identity", "profile", "labs", "after19",
].flatMap((surface) => (["ko", "en"] as const).map((locale) => ({
  id: `B-COPY-${surface.toUpperCase()}-${locale.toUpperCase()}`,
  surface: surface as BSurfaceId,
  locale,
})))

type RuntimeEvidence = { product: string[]; externalMap: string[]; externalAsset: string[] }
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

export function installBRuntimeGuard(page: Page) {
  const evidence: RuntimeEvidence = { product: [], externalMap: [], externalAsset: [] }
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
    else if (["document", "script", "fetch", "xhr"].includes(request.resourceType())) evidence.product.push(`requestfailed: ${request.url()} · ${reason}`)
  })
}

export function getBRuntimeEvidence(page: Page): RuntimeEvidence {
  return runtimeEvidence.get(page) ?? { product: [], externalMap: [], externalAsset: [] }
}

export async function expectBRuntimeClean(page: Page) {
  expect(getBRuntimeEvidence(page).product, "product runtime errors (external OpenFreeMap failures are classified separately)").toEqual([])
}

export type BSessionSeed = Record<string, unknown> & {
  onboarding?: string
  persona?: "short_term" | "long_term_resident" | "korean_local"
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
    if (!localStorage.getItem("ondo.preferences.v3")) localStorage.setItem("ondo.preferences.v3", JSON.stringify({
      locale: nextLocale, guideSeen: true, autoNight: true, savedVenueIds: [], discoveryPreferences: [], ...nextLocal,
    }))
    if (!sessionStorage.getItem("ondo.session.v3")) sessionStorage.setItem("ondo.session.v3", JSON.stringify({
      onboarding: "ONB-COMPLETE", persona: "short_term", account: "ACC-GUEST", person: "PER-UNVERIFIED",
      age: "AGE-UNVERIFIED", paymentKyc: "PKY-NOT-STARTED", after19: "A19-OFF", stamps: 9, ...nextSession,
    }))
    if (shouldClear && sessionStorage.getItem("ondo.qa.b-seed-cleared") !== "1") {
      sessionStorage.removeItem("ondo.chat.v2")
      sessionStorage.removeItem("ondo.table-outcomes.v2")
      sessionStorage.removeItem("ondo.labs.v2")
      sessionStorage.removeItem("ondo.accepted-visits.v2")
      sessionStorage.setItem("ondo.qa.b-seed-cleared", "1")
    }
  }, { nextLocale: locale, nextSession: session, nextLocal: local, shouldClear: clearFeatures })
}

export async function seedFreshOnboarding(page: Page, locale: BLocale = "en") {
  await page.addInitScript((nextLocale) => {
    localStorage.removeItem("ondo.preferences.v3")
    sessionStorage.removeItem("ondo.session.v3")
    sessionStorage.removeItem("ondo.chat.v2")
    sessionStorage.removeItem("ondo.table-outcomes.v2")
    sessionStorage.removeItem("ondo.labs.v2")
    sessionStorage.removeItem("ondo.accepted-visits.v2")
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
    await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
  }
}

export async function openTables(page: Page, tableId = TABLE_ID) {
  await page.getByRole("button", { name: "Tables", exact: true }).click()
  const tables = page.getByRole("region", { name: "Tables by place" })
  await expect(tables).toBeVisible()
  await tables.locator(`[data-table-id='${tableId}']`).click()
}

export async function openLabs(page: Page) {
  await page.getByRole("button", { name: "My Korea", exact: true }).click()
  const milestone = page.getByTestId("open-labs-milestone")
  if (await milestone.isVisible().catch(() => false)) await milestone.click()
  else await page.getByTestId("open-labs").click()
  await expect(page.getByRole("dialog", { name: "Labs" })).toBeVisible()
}

export async function finishAccountGate(page: Page) {
  await page.getByRole("button", { name: "Create account · Simulated" }).click()
  await page.getByRole("button", { name: "Complete account simulation" }).click()
}

export async function finishPersonGate(page: Page) {
  await page.getByRole("button", { name: "Start check" }).click()
  await page.getByRole("button", { name: "Complete simulated check" }).click()
  await expect.poll(() => sessionState(page)).toMatchObject({ person: "PER-VERIFIED" })
}

export async function finishAgeGate(page: Page) {
  await page.getByRole("button", { name: "Start 19+ check simulation" }).click()
  await page.getByRole("button", { name: "Confirm 19+ · Simulated" }).click()
}

export async function finishPaymentGate(page: Page) {
  await page.getByRole("button", { name: "Start Payment KYC simulation" }).click()
  await page.getByRole("button", { name: "Complete Payment KYC · Simulated" }).click()
  await expect.poll(async () => (await sessionState(page)).paymentKyc).toBe("PKY-VERIFIED")
}

export async function sessionState(page: Page) {
  return page.evaluate(() => JSON.parse(sessionStorage.getItem("ondo.session.v3") ?? "{}") as Record<string, unknown>)
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
    return box.width < 44 || box.height < 44
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
    if (surface === "after19") await expect(page.getByTestId("after19-auto-banner")).toBeVisible()
    return surface === "after19" ? page.getByTestId("ondo-after19-layer") : page.getByTestId("ondo-b-map-entry")
  }
  if (surface === "city-list") {
    await gotoB(page)
    await page.locator("[data-city='seoul']").click()
    const listName = locale === "ko" ? "목록" : "List"
    await page.getByRole("button", { name: listName }).click()
    return page.getByTestId("ondo-b-map-entry")
  }
  if (surface === "place") {
    await openCanonicalVenue(page)
    return page.getByTestId("canonical-place-overlay")
  }
  if (surface === "account-gate") {
    await openCanonicalVenue(page)
    await page.getByTestId("canonical-venue-save").click()
    return page.getByTestId("ondo-gate-overlay")
  }
  if (surface === "age-gate") {
    await gotoB(page, "?city=seoul")
    const chip = locale === "ko" ? "After 19" : "After 19"
    await page.getByRole("button", { name: chip, exact: true }).click()
    await page.getByRole("button", { name: /Confirm 19\+|19\+ 확인/ }).click()
    return page.getByTestId("ondo-gate-overlay")
  }
  if (surface === "tables" || surface === "table-chat") {
    await gotoB(page)
    const nav = page.getByRole("navigation").locator("button").nth(2)
    await nav.click()
    if (surface === "tables") return page.getByTestId("tables-entry")
    const joined = page.getByRole("region", { name: locale === "ko" ? "참여 중" : "Joined" })
    await joined.locator(`[data-table-id='${TABLE_ID}']`).click()
    const chat = page.getByTestId("table-chat")
    if (!(await chat.isVisible().catch(() => false))) {
      const openChat = page.getByRole("button", { name: locale === "ko" ? "대화 열기" : "Open chat" })
      if (await openChat.isVisible().catch(() => false)) await openChat.click()
    }
    await expect(chat).toBeVisible()
    return chat
  }
  if (surface === "local-signal") {
    await openCanonicalVenue(page)
    await page.getByTestId("canonical-venue-signal").click()
    return page.getByTestId("local-signal-overlay")
  }
  if (surface === "checkout") {
    await openCanonicalVenue(page)
    await page.getByTestId("canonical-venue-checkout").click()
    return page.getByTestId("checkout-overlay")
  }
  if (surface === "identity" || surface === "profile") {
    await gotoB(page)
    await page.getByRole("navigation").locator("button").nth(3).click()
    return surface === "profile" ? page.getByTestId("ondo-profile-panel") : page.getByTestId("ondo-identity-entry")
  }
  await gotoB(page)
  await openLabs(page)
  const acknowledge = page.getByTestId("labs-acknowledge")
  if (await acknowledge.isVisible().catch(() => false)) await acknowledge.click()
  return page.getByTestId("labs-overlay")
}
