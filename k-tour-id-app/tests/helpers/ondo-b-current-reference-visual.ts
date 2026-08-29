import { expect, type Locator, type Page } from "@playwright/test"

const SYNTHETIC_PASSPORT_IMAGE = {
  name: "passport-visual-audit.png",
  mimeType: "image/png",
  buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"),
}

export type CurrentReferenceLocale = "en" | "ko" | "ja"
export type CurrentReferenceViewport = {
  width: 320 | 390 | 844 | 1440
  height: 720 | 844 | 390 | 1000
}

export type CurrentReferenceState =
  | "onboarding-value"
  | "onboarding-intent"
  | "onboarding-preferences"
  | "opendid-initial"
  | "opendid-consent"
  | "opendid-document"
  | "opendid-face"
  | "opendid-evidence"
  | "opendid-issuance"
  | "opendid-holder-delivery"
  | "opendid-credential-ready"
  | "nation-atlas"
  | "jeju-editorial"
  | "jeju-editorial-place"
  | "seoul-map"
  | "seoul-list"
  | "place-detail"
  | "tables-index"
  | "table-detail"
  | "table-joined"
  | "my-korea-empty"
  | "my-korea-active"
  | "my-korea-editorial"
  | "my-korea-table-linkage"
  | "id-wallet"
  | "settings-ja"
  | "labs-boundary-ja"
  | "labs-ready-ja"

export type CurrentReferenceVisualCase = {
  id: string
  locale: CurrentReferenceLocale
  viewport: CurrentReferenceViewport
  state: CurrentReferenceState
  surfaceTestId: string
}

const DEVICE_KEY = "ondo-b.device.v1"
const CANONICAL_VENUE_ID = "mois-0021cd596bc5b2a922ad"
const TABLE_ID = "table-seoul-night-bites"
const EDITORIAL_PLACE_ID = "jeju-seongsan-ilchulbong"
const MAP_HOST = "tiles.openfreemap.org"
const DETERMINISTIC_TILE_ROOT = "https://tiles.openfreemap.org/ondo-current-reference-empty"
const DETERMINISTIC_TILEJSON = {
  tilejson: "3.0.0",
  tiles: [`${DETERMINISTIC_TILE_ROOT}/{z}/{x}/{y}.pbf`],
  minzoom: 0,
  maxzoom: 18,
  bounds: [124, 33, 132, 39],
} as const

type RuntimeEvidence = {
  product: string[]
  externalMap: string[]
  externalMapRequests: string[]
  realMapRequired: boolean
}

const runtimeEvidence = new WeakMap<Page, RuntimeEvidence>()

export const CURRENT_REFERENCE_VISUAL_CASES: readonly CurrentReferenceVisualCase[] = [
  { id: "CR-PX-001-ONBOARDING-VALUE-EN", locale: "en", viewport: { width: 320, height: 720 }, state: "onboarding-value", surfaceTestId: "onboarding-step-value" },
  { id: "CR-PX-002-ONBOARDING-INTENT-EN", locale: "en", viewport: { width: 390, height: 844 }, state: "onboarding-intent", surfaceTestId: "onboarding-step-intent" },
  { id: "CR-PX-003-ONBOARDING-PREFERENCES-EN", locale: "en", viewport: { width: 1440, height: 1000 }, state: "onboarding-preferences", surfaceTestId: "onboarding-step-preferences" },
  { id: "CR-PX-004-ONBOARDING-VALUE-KO", locale: "ko", viewport: { width: 390, height: 844 }, state: "onboarding-value", surfaceTestId: "onboarding-step-value" },
  { id: "CR-PX-005-ONBOARDING-INTENT-KO", locale: "ko", viewport: { width: 844, height: 390 }, state: "onboarding-intent", surfaceTestId: "onboarding-step-intent" },
  { id: "CR-PX-006-ONBOARDING-PREFERENCES-KO", locale: "ko", viewport: { width: 320, height: 720 }, state: "onboarding-preferences", surfaceTestId: "onboarding-step-preferences" },
  { id: "CR-PX-007-ONBOARDING-VALUE-JA", locale: "ja", viewport: { width: 1440, height: 1000 }, state: "onboarding-value", surfaceTestId: "onboarding-step-value" },
  { id: "CR-PX-008-ONBOARDING-INTENT-JA", locale: "ja", viewport: { width: 320, height: 720 }, state: "onboarding-intent", surfaceTestId: "onboarding-step-intent" },
  { id: "CR-PX-009-ONBOARDING-PREFERENCES-JA", locale: "ja", viewport: { width: 844, height: 390 }, state: "onboarding-preferences", surfaceTestId: "onboarding-step-preferences" },
  { id: "CR-PX-010-OPENDID-INITIAL", locale: "en", viewport: { width: 390, height: 844 }, state: "opendid-initial", surfaceTestId: "k-tour-id-setup" },
  { id: "CR-PX-011-OPENDID-CREDENTIAL-READY", locale: "ko", viewport: { width: 844, height: 390 }, state: "opendid-credential-ready", surfaceTestId: "k-tour-id-credential" },
  { id: "CR-PX-012-NATION-ATLAS", locale: "en", viewport: { width: 1440, height: 1000 }, state: "nation-atlas", surfaceTestId: "ondo-b-korea-atlas" },
  { id: "CR-PX-013-JEJU-JAPAN-EDITORIAL", locale: "ja", viewport: { width: 390, height: 844 }, state: "jeju-editorial", surfaceTestId: "ondo-b-editorial-guide-grid" },
  { id: "CR-PX-014-SEOUL-MAP-PULSE", locale: "ko", viewport: { width: 320, height: 720 }, state: "seoul-map", surfaceTestId: "ondo-b-map-entry" },
  { id: "CR-PX-015-SEOUL-LIST-PULSE", locale: "en", viewport: { width: 844, height: 390 }, state: "seoul-list", surfaceTestId: "ondo-b-list-panel" },
  { id: "CR-PX-016-TABLES-INDEX", locale: "ja", viewport: { width: 390, height: 844 }, state: "tables-index", surfaceTestId: "tables-entry" },
  { id: "CR-PX-017-TABLE-DETAIL", locale: "en", viewport: { width: 1440, height: 1000 }, state: "table-detail", surfaceTestId: "table-detail" },
  { id: "CR-PX-018-MY-KOREA-EMPTY", locale: "ja", viewport: { width: 320, height: 720 }, state: "my-korea-empty", surfaceTestId: "ondo-b-my-korea-entry" },
  { id: "CR-PX-019-MY-KOREA-ACTIVE", locale: "ko", viewport: { width: 844, height: 390 }, state: "my-korea-active", surfaceTestId: "ondo-b-my-korea-entry" },
  { id: "CR-PX-020-ID-WALLET", locale: "en", viewport: { width: 390, height: 844 }, state: "id-wallet", surfaceTestId: "ondo-b-traveler-id" },
  { id: "CR-PX-021-SETTINGS-JA", locale: "ja", viewport: { width: 844, height: 390 }, state: "settings-ja", surfaceTestId: "ondo-b-settings-entry" },
  { id: "CR-PX-022-OPENDID-CONSENT-JA", locale: "ja", viewport: { width: 320, height: 720 }, state: "opendid-consent", surfaceTestId: "k-tour-id-consent" },
  { id: "CR-PX-023-OPENDID-DOCUMENT-EN", locale: "en", viewport: { width: 390, height: 844 }, state: "opendid-document", surfaceTestId: "k-tour-id-passport-document" },
  { id: "CR-PX-024-OPENDID-FACE-KO", locale: "ko", viewport: { width: 844, height: 390 }, state: "opendid-face", surfaceTestId: "k-tour-id-passport-face" },
  { id: "CR-PX-025-OPENDID-EVIDENCE-JA", locale: "ja", viewport: { width: 1440, height: 1000 }, state: "opendid-evidence", surfaceTestId: "k-tour-id-evidence-preview" },
  { id: "CR-PX-026-OPENDID-ISSUANCE-EN", locale: "en", viewport: { width: 320, height: 720 }, state: "opendid-issuance", surfaceTestId: "k-tour-id-issuance-preview" },
  { id: "CR-PX-027-OPENDID-HOLDER-KO", locale: "ko", viewport: { width: 390, height: 844 }, state: "opendid-holder-delivery", surfaceTestId: "k-tour-id-holder-delivery" },
  { id: "CR-PX-028-TABLE-JOINED-KO", locale: "ko", viewport: { width: 390, height: 844 }, state: "table-joined", surfaceTestId: "table-detail" },
  { id: "CR-PX-029-MY-KOREA-TABLE-LINKAGE-KO", locale: "ko", viewport: { width: 320, height: 720 }, state: "my-korea-table-linkage", surfaceTestId: "ondo-b-my-korea-entry" },
  { id: "CR-PX-030-LABS-BOUNDARY-JA", locale: "ja", viewport: { width: 390, height: 844 }, state: "labs-boundary-ja", surfaceTestId: "labs-acknowledge" },
  { id: "CR-PX-031-LABS-READY-JA", locale: "ja", viewport: { width: 844, height: 390 }, state: "labs-ready-ja", surfaceTestId: "labs-overlay" },
  { id: "CR-PX-032-SEOUL-LIST-PULSE-JA", locale: "ja", viewport: { width: 390, height: 844 }, state: "seoul-list", surfaceTestId: "ondo-b-list-panel" },
  { id: "CR-PX-033-NATION-ATLAS-MOBILE-JA", locale: "ja", viewport: { width: 390, height: 844 }, state: "nation-atlas", surfaceTestId: "ondo-b-korea-atlas" },
  { id: "CR-PX-034-PLACE-DETAIL-MOBILE-JA", locale: "ja", viewport: { width: 390, height: 844 }, state: "place-detail", surfaceTestId: "canonical-place-overlay" },
  { id: "CR-PX-035-JEJU-EDITORIAL-PLACE-KO", locale: "ko", viewport: { width: 390, height: 844 }, state: "jeju-editorial-place", surfaceTestId: "ondo-b-editorial-place-overlay" },
  { id: "CR-PX-036-MY-KOREA-EDITORIAL-JA", locale: "ja", viewport: { width: 320, height: 720 }, state: "my-korea-editorial", surfaceTestId: "ondo-b-my-korea-entry" },
] as const

const REAL_MAP_STATES = new Set<CurrentReferenceState>(["jeju-editorial", "seoul-map"])

const KEY_COPY_BY_CASE_ID: Readonly<Record<string, string>> = {
  "CR-PX-001-ONBOARDING-VALUE-EN": "Find a meal that feels right for your Korea.",
  "CR-PX-002-ONBOARDING-INTENT-EN": "What brings you to ONDO?",
  "CR-PX-003-ONBOARDING-PREFERENCES-EN": "What food and dietary needs are you looking for?",
  "CR-PX-004-ONBOARDING-VALUE-KO": "지금의 나에게 잘 맞는 한국의 한 끼를 찾아보세요.",
  "CR-PX-005-ONBOARDING-INTENT-KO": "어떤 목적으로 ONDO를 찾았나요?",
  "CR-PX-006-ONBOARDING-PREFERENCES-KO": "어떤 음식과 식이 조건을 찾고 있나요?",
  "CR-PX-007-ONBOARDING-VALUE-JA": "今の自分にちょうどいい、韓国の一食を見つけよう。",
  "CR-PX-008-ONBOARDING-INTENT-JA": "ONDOを使う目的は？",
  "CR-PX-009-ONBOARDING-PREFERENCES-JA": "どんな食事や食の希望・制限がありますか？",
  "CR-PX-010-OPENDID-INITIAL": "Set up a private K-Tour ID",
  "CR-PX-011-OPENDID-CREDENTIAL-READY": "K-Tour ID 준비 완료",
  "CR-PX-012-NATION-ATLAS": "Seoul",
  "CR-PX-013-JEJU-JAPAN-EDITORIAL": "済州のストーリー",
  "CR-PX-014-SEOUL-MAP-PULSE": "서울",
  "CR-PX-015-SEOUL-LIST-PULSE": "Map",
  "CR-PX-016-TABLES-INDEX": "ソウルで開催予定",
  "CR-PX-017-TABLE-DETAIL": "Night bites, one shared table",
  "CR-PX-018-MY-KOREA-EMPTY": "マイ韓国",
  "CR-PX-019-MY-KOREA-ACTIVE": "내 한국",
  "CR-PX-020-ID-WALLET": "Travel Pass",
  "CR-PX-021-SETTINGS-JA": "設定",
  "CR-PX-022-OPENDID-CONSENT-JA": "依頼内容を確認",
  "CR-PX-023-OPENDID-DOCUMENT-EN": "Choose one passport image",
  "CR-PX-024-OPENDID-FACE-KO": "얼굴·라이브니스",
  "CR-PX-025-OPENDID-EVIDENCE-JA": "最小限の証拠を確認",
  "CR-PX-026-OPENDID-ISSUANCE-EN": "Prepare OpenDID delivery",
  "CR-PX-027-OPENDID-HOLDER-KO": "여행 패스에 담기",
  "CR-PX-028-TABLE-JOINED-KO": "참여했어요",
  "CR-PX-029-MY-KOREA-TABLE-LINKAGE-KO": "식사 계획",
  "CR-PX-030-LABS-BOUNDARY-JA": "この端末内だけで動作し、お金・アカウント・プロバイダー・ネットワークには接続しません。",
  "CR-PX-031-LABS-READY-JA": "Sui zkLogin · 署名方式",
  "CR-PX-032-SEOUL-LIST-PULSE-JA": "地図",
  "CR-PX-033-NATION-ATLAS-MOBILE-JA": "ソウル",
  "CR-PX-034-PLACE-DETAIL-MOBILE-JA": "로바",
  "CR-PX-035-JEJU-EDITORIAL-PLACE-KO": "성산일출봉",
  "CR-PX-036-MY-KOREA-EDITORIAL-JA": "城山日出峰",
}

function isExternalMapEvidence(raw: string | undefined) {
  if (!raw) return false
  try {
    return new URL(raw).hostname === MAP_HOST
  } catch {
    return raw.includes(MAP_HOST)
  }
}

export async function prepareCurrentReferenceVisualPage(page: Page, item: CurrentReferenceVisualCase) {
  await page.clock.setFixedTime(new Date("2026-08-28T12:00:00+09:00"))
  const realMapRequired = REAL_MAP_STATES.has(item.state)
  if (!realMapRequired) {
    await page.route("https://tiles.openfreemap.org/planet", (route) => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(DETERMINISTIC_TILEJSON),
    }))
    await page.route(`${DETERMINISTIC_TILE_ROOT}/**`, (route) => route.fulfill({
      status: 200,
      contentType: "application/x-protobuf",
      body: Buffer.alloc(0),
    }))
    await page.route("https://tiles.openfreemap.org/fonts/**", (route) => route.fulfill({
      status: 200,
      contentType: "application/x-protobuf",
      body: Buffer.alloc(0),
    }))
  }

  const evidence: RuntimeEvidence = { product: [], externalMap: [], externalMapRequests: [], realMapRequired }
  runtimeEvidence.set(page, evidence)
  page.on("request", (request) => {
    if (isExternalMapEvidence(request.url())) evidence.externalMapRequests.push(request.url())
  })
  page.on("console", (message) => {
    if (message.type() !== "error") return
    const location = message.location().url
    const item = `console: ${message.text()}${location ? ` @ ${location}` : ""}`
    if (isExternalMapEvidence(location) || isExternalMapEvidence(message.text())) evidence.externalMap.push(item)
    else evidence.product.push(item)
  })
  page.on("pageerror", (error) => evidence.product.push(`pageerror: ${error.message}`))
  page.on("requestfailed", (request) => {
    const item = `requestfailed: ${request.url()} · ${request.failure()?.errorText ?? "request failed"}`
    if (isExternalMapEvidence(request.url())) evidence.externalMap.push(item)
    else evidence.product.push(item)
  })
  page.on("response", (response) => {
    if (response.status() < 400) return
    const item = `response: ${response.status()} ${response.url()}`
    if (isExternalMapEvidence(response.url())) evidence.externalMap.push(item)
    else evidence.product.push(item)
  })

  await page.addInitScript(() => {
    window.addEventListener("unhandledrejection", (event) => console.error(`unhandledrejection: ${String(event.reason)}`))
    window.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style")
      style.dataset.currentReferenceVisualHarness = "true"
      style.textContent = [
        "nextjs-portal{display:none!important}",
        "*,*::before,*::after{animation-delay:0s!important;animation-duration:0s!important;transition-delay:0s!important;transition-duration:0s!important;caret-color:transparent!important}",
      ].join("")
      document.head.append(style)
    }, { once: true })
  })
}

async function seedDevice(page: Page, item: CurrentReferenceVisualCase) {
  const isOnboarding = item.state.startsWith("onboarding-") || item.state === "opendid-initial"
  const isActiveMyKorea = item.state === "my-korea-active"
  const isEditorialMyKorea = item.state === "my-korea-editorial"
  await page.addInitScript(({ key, locale, onboarding, active, editorialActive, venueId, editorialPlaceId, tableId }) => {
    localStorage.setItem(key, JSON.stringify({
      locale,
      onboarding,
      persona: null,
      discoveryPreferences: [],
      savedVenueIds: active ? [venueId] : [],
      savedEditorialPlaceIds: editorialActive ? [editorialPlaceId] : [],
      privateNotesByVenue: {},
      recentVenueIds: active ? [venueId] : [],
      recentEditorialPlaceIds: editorialActive ? [editorialPlaceId] : [],
      plannedTableRefs: active ? [{ tableId, venueId }] : [],
      localSignalPostedVenueIds: [],
      localPulseEvidenceByVenue: {},
      localInteractionBoundarySeen: false,
      commerceLocalBoundarySeen: false,
      commerceReceipts: [],
    }))
  }, {
    key: DEVICE_KEY,
    locale: item.locale,
    onboarding: isOnboarding ? "ONB-NEW" : "ONB-COMPLETE",
    active: isActiveMyKorea,
    editorialActive: isEditorialMyKorea,
    venueId: CANONICAL_VENUE_ID,
    editorialPlaceId: EDITORIAL_PLACE_ID,
    tableId: TABLE_ID,
  })
}

async function gotoCurrentB(page: Page, item: CurrentReferenceVisualCase) {
  await seedDevice(page, item)
  await page.goto("/", { waitUntil: "domcontentloaded" })
  const root = page.getByTestId("ondo-b-root")
  await expect(root).toBeVisible()
  await expect(root).toHaveAttribute("data-variant", "B")
  await expect(root).toHaveAttribute("data-locale", item.locale)
  await expect(page.locator("html")).toHaveAttribute("lang", item.locale)
  return root
}

async function moveOnboardingTo(page: Page, state: CurrentReferenceState) {
  if (state === "onboarding-value") return
  const value = page.getByTestId("onboarding-step-value")
  await value.locator("[data-onboarding-initial-focus]").click()
  const intent = page.getByTestId("onboarding-step-intent")
  await expect(intent).toBeVisible()
  if (state === "onboarding-intent") return
  await intent.getByTestId("persona-travelling").click()
  await expect(intent.getByTestId("persona-travelling")).toHaveAttribute("aria-pressed", "true")
  await intent.locator("button").filter({ has: page.locator("svg") }).last().click()
  await expect(page.getByTestId("onboarding-step-preferences")).toBeVisible()
}

async function openCity(page: Page, city: "seoul" | "jeju") {
  const atlas = page.getByTestId("ondo-b-korea-atlas")
  await atlas.locator(`[data-city='${city}']`).click()
  const root = page.getByTestId("ondo-b-map-entry")
  await expect(root).toBeVisible()
  await expect(page).toHaveURL(new RegExp(`city=${city}`))
  return root
}

async function waitForMapReady(page: Page) {
  const root = page.getByTestId("ondo-b-map-entry")
  await expect(root).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
  await expect(page.getByTestId("maplibre-map")).toBeVisible()
}

async function openIdentitySetupFromTraveler(page: Page) {
  await page.getByTestId("nav-id").click()
  const traveler = page.getByTestId("ondo-b-traveler-id")
  await expect(traveler).toBeVisible()
  await traveler.getByTestId("traveler-id-ktour-id-open").click()
  const setup = page.getByTestId("k-tour-id-setup")
  await expect(setup).toBeVisible()
  return setup
}

async function advanceIdentityUntil(setup: Locator, testId: string, limit = 14) {
  const target = setup.getByTestId(testId)
  for (let attempt = 0; attempt < limit; attempt += 1) {
    if (await target.isVisible().catch(() => false)) return target
    const passportDocument = setup.getByTestId("k-tour-id-passport-document")
    if (await passportDocument.isVisible().catch(() => false)) {
      await passportDocument.getByTestId("passport-ocr-input").setInputFiles(SYNTHETIC_PASSPORT_IMAGE)
      await expect(passportDocument).toHaveAttribute("data-ocr-stage", "preview")
      await passportDocument.getByTestId("passport-ocr-start").click()
      await expect(passportDocument).toHaveAttribute("data-ocr-stage", "review")
      await passportDocument.getByTestId("k-tour-id-continue").click()
      continue
    }
    const advance = setup.getByTestId("k-tour-id-continue")
    await expect(advance, `no continuation action before ${testId}`).toBeVisible()
    await advance.click()
  }
  await expect(target, `identity journey did not reach ${testId}`).toBeVisible()
  return target
}

async function reachSimulatedCredentialReady(setup: Locator) {
  await setup.getByTestId("k-tour-id-method-passport-ekyc").click()
  const consent = setup.getByTestId("k-tour-id-consent")
  await expect(consent).toBeVisible()
  await expect(consent.getByTestId("identity-consent-provider")).not.toBeEmpty()
  await consent.getByTestId("k-tour-id-consent-approve").click()
  await advanceIdentityUntil(setup, "k-tour-id-passport-document")
  await advanceIdentityUntil(setup, "k-tour-id-passport-face")
  await advanceIdentityUntil(setup, "k-tour-id-evidence-preview")
  await advanceIdentityUntil(setup, "k-tour-id-issuance-preview")
  await advanceIdentityUntil(setup, "k-tour-id-holder-delivery")
  const credential = await advanceIdentityUntil(setup, "k-tour-id-credential")
  await expect(credential).toHaveAttribute("data-status", "simulated_ready")
  return credential
}

const IDENTITY_STAGE_TARGET: Partial<Record<CurrentReferenceState, string>> = {
  "opendid-consent": "k-tour-id-consent",
  "opendid-document": "k-tour-id-passport-document",
  "opendid-face": "k-tour-id-passport-face",
  "opendid-evidence": "k-tour-id-evidence-preview",
  "opendid-issuance": "k-tour-id-issuance-preview",
  "opendid-holder-delivery": "k-tour-id-holder-delivery",
}

async function reachIdentityStage(setup: Locator, state: CurrentReferenceState) {
  const targetId = IDENTITY_STAGE_TARGET[state]
  if (!targetId) throw new Error(`no OpenDID visual target for ${state}`)
  await setup.getByTestId("k-tour-id-method-passport-ekyc").click()
  const consent = setup.getByTestId("k-tour-id-consent")
  await expect(consent).toBeVisible()
  if (targetId === "k-tour-id-consent") return consent
  await expect(consent.getByTestId("identity-consent-provider")).not.toBeEmpty()
  await consent.getByTestId("k-tour-id-consent-approve").click()
  return advanceIdentityUntil(setup, targetId)
}

async function openTables(page: Page) {
  await page.getByTestId("nav-tables").click()
  const entry = page.getByTestId("tables-entry")
  await expect(entry).toBeVisible()
  await expect(entry.getByTestId(`table-card-${TABLE_ID}`)).toBeVisible()
  return entry
}

async function joinCurrentTable(page: Page, locale: CurrentReferenceLocale) {
  await openTables(page)
  await page.getByTestId(`table-open-${TABLE_ID}`).click()
  const detail = page.getByTestId("table-detail")
  await expect(detail).toBeVisible()
  const draft = locale === "ko"
    ? "My Korea 연결을 확인할 로컬 메모입니다."
    : locale === "ja"
      ? "マイ韓国との連携を確認する端末内メモです。"
      : "A device-local note used to verify the My Korea link."
  await detail.getByTestId("table-join-draft").fill(draft)
  await detail.getByTestId("table-join").click()
  const gate = page.getByTestId("ondo-b-action-gate")
  await expect(gate).toBeVisible()
  await gate.getByTestId("action-gate-confirm").click()
  await gate.getByTestId("after19-start").click()
  await expect(gate).toHaveCount(0)
  const confirmation = detail.getByTestId("table-join-confirmation")
  await expect(confirmation).toHaveAttribute("data-return-table", TABLE_ID)
  await expect(confirmation).toHaveAttribute("data-return-venue", CANONICAL_VENUE_ID)
  await expect(confirmation.getByTestId("after19-return")).toHaveText(draft)
  await confirmation.getByTestId("table-join-confirm").click()
  await expect(detail).toHaveAttribute("data-join-stage", "joined")
  await expect(detail.getByTestId("table-open-chat")).toBeVisible()
  return detail
}

export async function setupCurrentReferenceVisualCase(page: Page, item: CurrentReferenceVisualCase) {
  await gotoCurrentB(page, item)

  if (item.state.startsWith("onboarding-")) {
    await expect(page.getByTestId("ondo-onboarding")).toBeVisible()
    await moveOnboardingTo(page, item.state)
  } else if (item.state === "opendid-initial") {
    await page.getByTestId("k-tour-id-setup-open").click()
    const setup = page.getByTestId("k-tour-id-setup")
    await expect(setup).toHaveAttribute("data-phase", "method_select")
    await expect(setup).toHaveAttribute("data-environment", "simulated")
  } else if (item.state === "opendid-credential-ready") {
    const setup = await openIdentitySetupFromTraveler(page)
    await reachSimulatedCredentialReady(setup)
  } else if (item.state in IDENTITY_STAGE_TARGET) {
    const setup = await openIdentitySetupFromTraveler(page)
    await reachIdentityStage(setup, item.state)
  } else if (item.state === "nation-atlas") {
    const atlas = page.getByTestId("ondo-b-korea-atlas")
    for (const city of ["seoul", "busan", "jeju"] as const) await expect(atlas.locator(`[data-city='${city}']`)).toBeVisible()
    await expect(atlas.locator("[data-city='seoul']")).toHaveAttribute("data-official-count", "200")
    await expect(atlas.locator("[data-city='busan']")).toHaveAttribute("data-official-count", "200")
    await expect(atlas.locator("[data-city='jeju']")).toHaveAttribute("data-truth-kind", "editorial-region")
  } else if (item.state === "jeju-editorial") {
    const mapRoot = await openCity(page, "jeju")
    await expect(mapRoot).not.toHaveAttribute("data-city-record-count", /.+/)
    await waitForMapReady(page)
    const editorial = page.getByTestId("ondo-b-japan-first-discovery")
    await expect(editorial).toHaveAttribute("data-city-context", "jeju")
    await expect(page.getByTestId("ondo-b-editorial-collection-marker")).toBeVisible()
    await editorial.locator(":scope > summary").click()
    const guide = page.getByTestId("ondo-b-editorial-guide-grid")
    await expect(guide).toBeVisible()
    await guide.scrollIntoViewIfNeeded()
  } else if (item.state === "jeju-editorial-place") {
    await page.goto(`/?city=jeju&editorialPlaceId=${EDITORIAL_PLACE_ID}&detail=1`, { waitUntil: "domcontentloaded" })
    const place = page.getByTestId("ondo-b-editorial-place-overlay")
    await expect(place).toHaveAttribute("data-editorial-place-id", EDITORIAL_PLACE_ID)
    await expect(place).toHaveAttribute("data-official-record", "false")
    await expect(place).toHaveAttribute("data-pulse-eligible", "false")
  } else if (item.state === "seoul-map") {
    const mapRoot = await openCity(page, "seoul")
    await expect(mapRoot).toHaveAttribute("data-city-record-count", "200")
    await waitForMapReady(page)
    await expect(page.getByTestId("ondo-b-map-key")).toHaveAttribute("data-pulse-key-presentation", "compact-gradient")
  } else if (item.state === "seoul-list") {
    const mapRoot = await openCity(page, "seoul")
    const toggle = page.getByTestId("ondo-b-view-toggle")
    if (await mapRoot.getAttribute("data-requested-view") !== "list") await toggle.click()
    await expect(mapRoot).toHaveAttribute("data-effective-view", "list")
    await expect(page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id]")).toHaveCount(30)
    await expect(page.getByTestId("ondo-b-list-pulse")).toHaveCount(30)
    await expectPulseSignalsAreVisual(page)
  } else if (item.state === "place-detail") {
    await page.goto(`/?venueId=${CANONICAL_VENUE_ID}`, { waitUntil: "domcontentloaded" })
    const peek = page.getByTestId("canonical-place-peek")
    await expect(peek).toBeVisible()
    await peek.getByTestId("canonical-place-details").click()
    const place = page.getByTestId("canonical-place-overlay")
    await expect(place).toBeVisible()
    await expect(place.locator("[data-detail-state='ready']")).toBeVisible()
    await expect(place.getByTestId("canonical-place-table")).toBeVisible()
    await expect(place.getByTestId("canonical-local-signal-open")).toBeVisible()
  } else if (item.state === "tables-index") {
    const entry = await openTables(page)
    await expect(entry.getByTestId("tables-editorial-image")).toBeVisible()
  } else if (item.state === "table-detail") {
    await openTables(page)
    await page.getByTestId(`table-open-${TABLE_ID}`).click()
    const detail = page.getByTestId("table-detail")
    await expect(detail).toBeVisible()
    await expect(detail.getByTestId("table-join")).toBeVisible()
  } else if (item.state === "table-joined") {
    await joinCurrentTable(page, item.locale)
  } else if (item.state === "my-korea-empty") {
    await page.getByTestId("nav-my").click()
    const my = page.getByTestId("ondo-b-my-korea-entry")
    await expect(my).toBeVisible()
    await expect(my.getByTestId("my-korea-empty-inspiration")).toBeVisible()
    await expect(my.getByTestId("my-korea-planned-empty")).toBeVisible()
  } else if (item.state === "my-korea-active") {
    await page.getByTestId("nav-my").click()
    const my = page.getByTestId("ondo-b-my-korea-entry")
    await expect(my).toBeVisible()
    await expect(my.getByTestId(`saved-card-${CANONICAL_VENUE_ID}`)).toBeVisible()
    await expect(my.getByTestId(`planned-table-${TABLE_ID}`)).toBeVisible()
    await expect(my.getByTestId("my-korea-empty-inspiration")).toHaveCount(0)
  } else if (item.state === "my-korea-editorial") {
    await page.getByTestId("nav-my").click()
    const my = page.getByTestId("ondo-b-my-korea-entry")
    await expect(my.getByTestId(`saved-editorial-${EDITORIAL_PLACE_ID}`)).toBeVisible()
    await expect(my.getByTestId(`recent-editorial-${EDITORIAL_PLACE_ID}`)).toBeVisible()
    await expect(my.getByTestId("my-korea-empty-inspiration")).toHaveCount(0)
  } else if (item.state === "my-korea-table-linkage") {
    const detail = await joinCurrentTable(page, item.locale)
    await page.keyboard.press("Escape")
    await expect(detail).toBeHidden()
    await page.getByTestId("nav-my").click()
    const my = page.getByTestId("ondo-b-my-korea-entry")
    const planned = my.getByTestId(`planned-table-${TABLE_ID}`)
    await expect(planned).toBeVisible()
    await expect(planned).toContainText("야식 한 상, 함께 앉는 테이블")
    await planned.getByRole("button").click()
    const linkedDetail = page.getByTestId("table-detail")
    await expect(linkedDetail).toHaveAttribute("data-table-id", TABLE_ID)
    await expect(linkedDetail).toHaveAttribute("data-venue-id", CANONICAL_VENUE_ID)
    await page.keyboard.press("Escape")
    await expect(linkedDetail).toBeHidden()
    await page.getByTestId("nav-my").click()
    await expect(my.getByTestId(`planned-table-${TABLE_ID}`)).toBeVisible()
  } else if (item.state === "id-wallet") {
    await page.getByTestId("nav-id").click()
    const traveler = page.getByTestId("ondo-b-traveler-id")
    await expect(traveler).toBeVisible()
    await expect(traveler.getByTestId("travel-pass-card")).toBeVisible()
    await expect(traveler.getByTestId("travel-pass-status")).toBeVisible()
    await expect(traveler.getByTestId("wallet-balance")).toBeVisible()
  } else if (item.state === "settings-ja") {
    await page.getByTestId("nav-settings").click()
    const settings = page.getByTestId("ondo-b-settings-entry")
    await expect(settings).toBeVisible()
    await expect(settings.getByTestId("settings-language-control").getByRole("button", { name: "日本語", exact: true })).toHaveAttribute("aria-pressed", "true")
  } else if (item.state === "labs-boundary-ja" || item.state === "labs-ready-ja") {
    await page.getByTestId("nav-my").click()
    const my = page.getByTestId("ondo-b-my-korea-entry")
    await expect(my).toBeVisible()
    await my.getByTestId("open-labs").click()
    const acknowledge = page.getByTestId("labs-acknowledge")
    await expect(acknowledge).toBeVisible()
    await expect(page.getByRole("dialog")).toContainText("技術ラボ")
    if (item.state === "labs-ready-ja") {
      await acknowledge.click()
      const labs = page.getByTestId("labs-overlay")
      await expect(labs).toBeVisible()
      await expect(labs).toHaveAttribute("data-wallet-state", "WAL-DISCONNECTED")
      await expect(labs).toHaveAttribute("data-bridge-state", "BRG-IDLE")
    }
  }

  const surface = page.getByTestId(item.surfaceTestId)
  await expect(surface).toBeVisible()
  if (item.locale === "ja") await expect(page.getByTestId("ondo-b-root")).not.toContainText("not configured")
  return surface
}

export async function stabilizeCurrentReferenceVisual(page: Page) {
  await page.evaluate(async () => {
    const imageSettles = Array.from(document.images).map((image) => image.complete
      ? Promise.resolve()
      : new Promise<void>((resolve) => {
          image.addEventListener("load", () => resolve(), { once: true })
          image.addEventListener("error", () => resolve(), { once: true })
        }))
    await Promise.race([
      Promise.all([document.fonts.ready, ...imageSettles]),
      new Promise<void>((resolve) => window.setTimeout(resolve, 4_000)),
    ])
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
  })
  await page.waitForTimeout(120)
}

async function expectRuntimeClean(page: Page, item: CurrentReferenceVisualCase) {
  const evidence = runtimeEvidence.get(page)
  if (!evidence) throw new Error("current-reference runtime guard was not installed")
  expect(evidence.product, "product runtime errors; deterministic OpenFreeMap transport is classified separately").toEqual([])
  if (evidence.realMapRequired) {
    expect(evidence.externalMap, "real OpenFreeMap visual cases must load without map transport errors").toEqual([])
    expect(evidence.externalMapRequests.some((url) => new URL(url).pathname === "/planet"), "real map requested OpenFreeMap TileJSON").toBe(true)
    expect(evidence.externalMapRequests.some((url) => {
      const path = new URL(url).pathname
      return path.endsWith(".pbf") && !path.startsWith("/fonts/")
    }), "real map requested at least one OpenFreeMap vector tile").toBe(true)
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-map-state", "ready")
    const canvas = page.getByTestId("maplibre-map").locator("canvas.maplibregl-canvas")
    await expect(canvas, `${item.state} owns a live MapLibre canvas`).toHaveCount(1)
    const canvasBox = await canvas.boundingBox()
    expect(canvasBox, "real MapLibre canvas has rendered geometry").not.toBeNull()
    expect(canvasBox!.width).toBeGreaterThan(100)
    expect(canvasBox!.height).toBeGreaterThan(100)
  }
}

async function expectNoOverflowOrClipping(page: Page) {
  const overflow = await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>("[data-testid='ondo-b-root']")
    return {
      documentHorizontal: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      documentVertical: document.documentElement.scrollHeight - document.documentElement.clientHeight,
      rootHorizontal: root ? root.scrollWidth - root.clientWidth : Number.POSITIVE_INFINITY,
      rootVertical: root ? root.scrollHeight - root.clientHeight : Number.POSITIVE_INFINITY,
    }
  })
  expect(overflow.documentHorizontal, "document horizontal overflow").toBeLessThanOrEqual(1)
  expect(overflow.documentVertical, "document vertical overflow; ONDO owns scrolling inside its shell").toBeLessThanOrEqual(1)
  expect(overflow.rootHorizontal, "ONDO root horizontal overflow").toBeLessThanOrEqual(1)
  expect(overflow.rootVertical, "ONDO root vertical overflow").toBeLessThanOrEqual(1)

  const clipped = await page.getByTestId("ondo-b-root").locator("h1,h2,h3,p,small,strong,em,[role='status'],[role='alert'],button,a,label,dt,dd,summary").evaluateAll((nodes) => nodes.flatMap((node) => {
    const element = node as HTMLElement
    const style = getComputedStyle(element)
    const box = element.getBoundingClientRect()
    if (box.width < 2 || box.height < 2 || box.bottom <= 0 || box.right <= 0 || box.top >= innerHeight || box.left >= innerWidth) return []
    if (element.closest("[aria-hidden='true'],[inert],.maplibregl-control-container")) return []
    const ownedText = Array.from(element.childNodes)
      .filter((child) => child.nodeType === Node.TEXT_NODE)
      .map((child) => child.textContent ?? "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
    if (!ownedText) return []
    const horizontal = ["hidden", "clip"].includes(style.overflowX) && element.scrollWidth - element.clientWidth > 1
    const vertical = ["hidden", "clip"].includes(style.overflowY) && element.scrollHeight - element.clientHeight > 1
    return horizontal || vertical ? [{ tag: element.tagName, text: ownedText.slice(0, 100), horizontal, vertical }] : []
  }))
  expect(clipped, "visible critical copy must not clip").toEqual([])
}

async function expectMinimumTargets(page: Page) {
  const undersized = await page.getByTestId("ondo-b-root")
    .locator("button:visible,a[href]:visible,input:visible:not([tabindex='-1']),textarea:visible,select:visible,summary:visible,[role='button']:visible")
    .evaluateAll((nodes) => nodes.flatMap((node) => {
      const element = node as HTMLElement
      if (element.closest("[aria-hidden='true'],[inert],.maplibregl-control-container")) return []
      if (element instanceof HTMLButtonElement && element.disabled) return []
      const box = element.getBoundingClientRect()
      if (box.width < 1 || box.height < 1 || box.bottom <= 0 || box.right <= 0 || box.top >= innerHeight || box.left >= innerWidth) return []
      return box.width < 44 || box.height < 44
        ? [{ action: element.getAttribute("aria-label") ?? element.textContent?.trim().slice(0, 90) ?? element.tagName, width: Number(box.width.toFixed(3)), height: Number(box.height.toFixed(3)) }]
        : []
    }))
  expect(undersized, "visible interactive targets below 44 CSS pixels").toEqual([])
}

async function expectFocusOwnership(page: Page) {
  const modal = page.locator("[data-testid='ondo-b-root'] [role='dialog'][aria-modal='true']:visible").last()
  if (await modal.count()) {
    const active = page.locator(":focus")
    await expect(active, "modal must own one visible focus target").toHaveCount(1)
    await expect(active).toBeVisible()
    expect(await modal.evaluate((element) => element.contains(document.activeElement)), "top modal must own focus").toBe(true)
    return
  }

  const target = page.getByTestId("nav-ondo")
  await target.focus()
  await expect(target).toBeFocused()
  await expect(target).toBeVisible()
  expect(await target.evaluate((element) => !element.closest("[aria-hidden='true'],[inert]")), "keyboard focus target must remain operable").toBe(true)
  await target.evaluate((element) => element.blur())
}

async function expectImagesLoaded(page: Page) {
  const failed = await page.getByTestId("ondo-b-root").locator("img:visible").evaluateAll((images) => images.flatMap((image) => {
    const item = image as HTMLImageElement
    return item.complete && item.naturalWidth > 0 ? [] : [{ src: item.currentSrc || item.src, alt: item.alt }]
  }))
  expect(failed, "visible editorial/brand images must load").toEqual([])
}

const EXPECTED_IMAGE_SELECTOR: Partial<Record<CurrentReferenceState, string>> = {
  "onboarding-value": "[data-testid='onboarding-editorial-image'] img",
  "jeju-editorial": "[data-testid='ondo-b-editorial-guide-grid'] img",
  "tables-index": "[data-testid='tables-editorial-image'] img",
  "my-korea-empty": "[data-testid='my-korea-empty-inspiration'] img",
}

async function expectOwnedImagesLoaded(page: Page, item: CurrentReferenceVisualCase) {
  const selector = EXPECTED_IMAGE_SELECTOR[item.state]
  if (!selector) return
  const images = page.getByTestId("ondo-b-root").locator(selector)
  expect(await images.count(), `${item.state} must keep its expected editorial image`).toBeGreaterThan(0)
  const failed = await images.evaluateAll((nodes) => nodes.flatMap((node) => {
    const image = node as HTMLImageElement
    return image.complete && image.naturalWidth > 0 && image.naturalHeight > 0
      ? []
      : [{ src: image.currentSrc || image.src, alt: image.alt, complete: image.complete, width: image.naturalWidth, height: image.naturalHeight }]
  }))
  expect(failed, `${item.state} expected editorial images must exist and load`).toEqual([])
}

async function expectPulseSignalsAreVisual(page: Page) {
  const pulses = page.getByTestId("ondo-b-list-pulse")
  const count = await pulses.count()
  expect(count, "list owns visual Pulse signals").toBeGreaterThan(0)
  for (let index = 0; index < count; index += 1) {
    await expect(pulses.nth(index)).toHaveAttribute("data-pulse-numeric", "hidden")
  }
  const first = pulses.first()
  await expect(first).toHaveAttribute("data-pulse-level", /^(peak|hot|rising|warming|low|limited)$/)
  const signal = first.locator("[aria-hidden='true']")
  await expect(signal, "Pulse has a visible non-numeric signal").toBeVisible()
  await expect(signal.locator("i")).toHaveCount(3)
  const signalBox = await signal.boundingBox()
  expect(signalBox, "Pulse visual signal has painted geometry").not.toBeNull()
  expect(signalBox!.width).toBeGreaterThan(0)
  expect(signalBox!.height).toBeGreaterThan(0)
  const visibleCopy = await first.evaluate((element) => Array.from(element.childNodes).flatMap((node) => {
    if (node.nodeType === Node.TEXT_NODE) return [node.textContent ?? ""]
    if (!(node instanceof HTMLElement)) return []
    if (node.getAttribute("aria-hidden") === "true") return []
    const style = getComputedStyle(node)
    const box = node.getBoundingClientRect()
    if (style.display === "none" || style.visibility === "hidden" || box.width <= 2 || box.height <= 2) return []
    return [node.innerText]
  }).join(" ").replace(/\s+/g, " ").trim())
  expect(visibleCopy, "numeric Pulse copy remains visually hidden").not.toMatch(/(?:Pulse\s*)?\b\d{2,3}\b/i)
}

export async function expectCurrentReferenceVisualGuards(page: Page, item: CurrentReferenceVisualCase) {
  const root = page.getByTestId("ondo-b-root")
  await expect(root).toHaveAttribute("data-locale", item.locale)
  const keyCopy = KEY_COPY_BY_CASE_ID[item.id]
  if (!keyCopy) throw new Error(`missing localized key-copy contract for ${item.id}`)
  await expect(root, `${item.id} renders its localized key copy`).toContainText(keyCopy)
  await expectRuntimeClean(page, item)
  await expectNoOverflowOrClipping(page)
  await expectMinimumTargets(page)
  await expectFocusOwnership(page)
  await expectImagesLoaded(page)
  await expectOwnedImagesLoaded(page, item)

  if (item.state === "seoul-map") {
    await expect(page.getByTestId("ondo-b-map-key")).toHaveAttribute("data-pulse-key-presentation", "compact-gradient")
  }
  if (item.state === "seoul-list") {
    await expectPulseSignalsAreVisual(page)
  }
  if (item.state.startsWith("onboarding-")) {
    const onboarding = page.getByTestId("ondo-onboarding")
    await expect(onboarding).toHaveAttribute("aria-modal", "true")
    await expect(onboarding).toHaveAttribute("data-onboarding-step", item.state.replace("onboarding-", ""))
  }
}

export function currentReferenceSnapshotName(item: CurrentReferenceVisualCase) {
  return `${item.id}-${item.locale}-${item.viewport.width}x${item.viewport.height}.png`
}
