import AxeBuilder from "@axe-core/playwright"
import { expect, type Locator, type Page, type TestInfo } from "@playwright/test"
import { readFile } from "node:fs/promises"
import {
  CANONICAL_VENUE_ID,
  expectBRuntimeClean,
  finishAgeGate,
  getBRuntimeEvidence,
  gotoB,
  hasBRuntimeGuard,
  installBRuntimeGuard,
  openCanonicalVenue,
  openLabs,
  prepareBPage,
  seedB,
  seedFreshOnboarding,
  B_FLOW_CONTRACTS,
  type BCheckpoint,
  type BFlowId,
  type BLocale,
  type BSessionSeed,
} from "./ondo-b-qa"

const CURRENT_TABLE_ID = "table-seoul-night-bites"
const B_DEVICE_KEY = "ondo-b.device.v1"

export type BVisualStateId =
  | "ONBOARDING-VALUE"
  | "ONBOARDING-PERSONAS"
  | "ONBOARDING-PREFERENCES"
  | "NATION"
  | "CITY-LIVE"
  | "CITY-LIST"
  | "CITY-FILTERED-MAP"
  | "CITY-FALLBACK"
  | "PLACE-PEEK"
  | "PLACE-DETAIL"
  | "AFTER19-PROMPT"
  | "AFTER19-EXPIRED-REASON"
  | "AFTER19-VENUE-LOCKED"
  | "AFTER19-VENUE-RETURN"
  | "SAVE-FAILURE"
  | "SAVE-RECOVERED"
  | "GATE-ACCOUNT-FAIL"
  | "GATE-PERSON-PASSPORT"
  | "GATE-PERSON-CX"
  | "GATE-PERSON-RESIDENCE-UNSUPPORTED"
  | "GATE-AGE-FAIL"
  | "GATE-PAYMENT"
  | "GATE-PAYMENT-FAIL"
  | "TABLES-LIST"
  | "TABLES-VENUE-EMPTY"
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
  | "SESSION-RESET-CONFIRM"
  | "DISCOVERY-RESET-CONFIRM"
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

export const B_SLEEK_VIEWPORTS = [
  { id: "360x800", width: 360, height: 800, role: "compact-mobile" },
  { id: "390x844", width: 390, height: 844, role: "canonical-mobile" },
  { id: "430x932", width: 430, height: 932, role: "large-mobile" },
  { id: "768x1024", width: 768, height: 1024, role: "tablet" },
  { id: "801x1000", width: 801, height: 1000, role: "desktop-breakpoint" },
  { id: "1440x1000", width: 1440, height: 1000, role: "canonical-desktop" },
] as const

export type BSleekViewportId = (typeof B_SLEEK_VIEWPORTS)[number]["id"]

type BVisualRect = {
  bottom: number
  left: number
  right: number
  top: number
}

export type BMapPaintProbe = {
  blockers: BVisualRect[]
  canvas: BVisualRect
  edgeReceiptRegions: BVisualRect[]
  exposedRatio: number
  renderedSignalCount: number
  signalSourceCount: number
}

export const B_MAP_PAINT_MIN_EXPOSED_RATIO = 0.12
// The current map's smallest 4.5 CSS-px Pulse core produces roughly twelve
// fully saturated pixels after WebGL antialiasing. Requiring one connected
// core plus its aura proves real canvas paint without silently demanding the
// larger pre-redesign marker geometry.
export const B_MAP_PAINT_MIN_COMPONENT_PIXELS = 12
export const B_MAP_PAINT_MIN_HEAT_PIXELS = 24
export const B_MAP_PAINT_EDGE_BAND_CSS_PIXELS = 8
export const B_MAP_PAINT_EDGE_MIN_COMPONENT_PIXELS = 4
export const B_MAP_PAINT_EDGE_MIN_HEAT_PIXELS = 3
export const B_MAP_PAINT_MAX_RECOVERY_ATTEMPTS = 3
// These case×viewport contracts are sealed from the reviewed 1a0e5ad PNGs.
// A case outside the registry uses the ordinary full-frame snapshot matcher;
// DOM geometry must not silently opt a case into or out of paint recovery.
export const B_MAP_PAINT_CANVAS_RECEIPTS = [
  "B-PX-CITY-LIVE-EN:1440x1000",
  "B-PX-CITY-LIVE-EN:360x800",
  "B-PX-CITY-LIVE-EN:390x844",
  "B-PX-CITY-LIVE-EN:430x932",
  "B-PX-CITY-LIVE-EN:768x1024",
  "B-PX-CITY-LIVE-EN:801x1000",
  "B-PX-CITY-LIVE-KO:1440x1000",
  "B-PX-CITY-LIVE-KO:360x800",
  "B-PX-CITY-LIVE-KO:390x844",
  "B-PX-CITY-LIVE-KO:430x932",
  "B-PX-CITY-LIVE-KO:768x1024",
  "B-PX-CITY-LIVE-KO:801x1000",
  "B-PX-CITY-FILTERED-MAP-EN:1440x1000",
  "B-PX-CITY-FILTERED-MAP-EN:360x800",
  "B-PX-CITY-FILTERED-MAP-EN:390x844",
  "B-PX-CITY-FILTERED-MAP-EN:430x932",
  "B-PX-CITY-FILTERED-MAP-EN:768x1024",
  "B-PX-CITY-FILTERED-MAP-EN:801x1000",
  "B-PX-GATE-ACCOUNT-FAIL-KO:1440x1000",
  "B-PX-GATE-ACCOUNT-FAIL-KO:768x1024",
  "B-PX-GATE-PERSON-CX-KO:1440x1000",
  "B-PX-GATE-PERSON-CX-KO:768x1024",
  "B-PX-GATE-PERSON-CX-KO:801x1000",
  "B-PX-GATE-PERSON-PASSPORT-EN:1440x1000",
  // At 768/801px the Local Signal layer and the nested eligibility dialog
  // cover every visible Pulse core even though MapLibre and its rendered
  // feature receipt remain ready. Those two occluded frames use the ordinary
  // full-screen matcher; map-only states still own paint recovery at every
  // responsive viewport.
  "B-PX-GATE-RESIDENCE-UNSUPPORTED-EN:1440x1000",
  "B-PX-GATE-RESIDENCE-UNSUPPORTED-EN:768x1024",
  "B-PX-GATE-RESIDENCE-UNSUPPORTED-EN:801x1000",
  "B-PX-PLACE-PEEK-EN:1440x1000",
  "B-PX-PLACE-PEEK-EN:360x800",
  "B-PX-PLACE-PEEK-EN:390x844",
  "B-PX-PLACE-PEEK-EN:430x932",
  "B-PX-PLACE-PEEK-EN:768x1024",
  "B-PX-PLACE-PEEK-EN:801x1000",
] as const
export const B_MAP_PAINT_EDGE_RECEIPTS = [] as const

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
  { id: "B-PX-CITY-FILTERED-MAP-EN", state: "CITY-FILTERED-MAP", flows: ["FL-001"], locale: "en", description: "one-result search stays mapped with a truthful filtered legend" },
  { id: "B-PX-CITY-FALLBACK-KO", state: "CITY-FALLBACK", flows: ["FL-001"], locale: "ko", description: "tile failure list and retry" },
  { id: "B-PX-PLACE-PEEK-EN", state: "PLACE-PEEK", flows: ["FL-001"], locale: "en", description: "canonical selected place peek" },
  { id: "B-PX-PLACE-DETAIL-EN", state: "PLACE-DETAIL", flows: ["FL-001", "FL-010", "FL-011", "FL-012", "FL-016"], locale: "en", description: "canonical place facts and actions" },
  { id: "B-PX-AFTER19-PROMPT-EN", state: "AFTER19-PROMPT", flows: ["FL-013"], locale: "en", description: "Table-scoped After19 decision with an isolated background" },
  { id: "B-PX-AFTER19-EXPIRED-REASON-EN", state: "AFTER19-EXPIRED-REASON", flows: ["FL-014"], locale: "en", description: "expired Table eligibility reason and exact-return recovery" },
  { id: "B-PX-SAVE-RECOVERED-KO", state: "SAVE-RECOVERED", flows: ["FL-011"], locale: "ko", description: "save failure, reload, retry, and persisted saved state" },
  { id: "B-PX-SAVE-FAILURE-EN", state: "SAVE-FAILURE", flows: ["FL-011"], locale: "en", description: "local save failure preserves exact venue and recovery actions" },
  { id: "B-PX-GATE-ACCOUNT-FAIL-KO", state: "GATE-ACCOUNT-FAIL", flows: ["FL-010"], locale: "ko", description: "account preview failure and exact-place retry" },
  { id: "B-PX-GATE-PERSON-PASSPORT-EN", state: "GATE-PERSON-PASSPORT", flows: ["FL-006", "FL-012"], locale: "en", description: "provider-neutral visitor person check" },
  { id: "B-PX-GATE-PERSON-CX-KO", state: "GATE-PERSON-CX", flows: ["FL-005"], locale: "ko", description: "provider-neutral Korean local-action check" },
  { id: "B-PX-GATE-RESIDENCE-UNSUPPORTED-EN", state: "GATE-PERSON-RESIDENCE-UNSUPPORTED", flows: ["FL-006"], locale: "en", description: "session-only check unavailable with exact-draft return" },
  { id: "B-PX-AFTER19-VENUE-LOCKED-EN", state: "AFTER19-VENUE-LOCKED", flows: ["FL-002"], locale: "en", description: "19+ Table requirement without blocking official place facts" },
  { id: "B-PX-GATE-AGE-FAIL-KO", state: "GATE-AGE-FAIL", flows: ["FL-002", "FL-013"], locale: "ko", description: "age proof retry" },
  { id: "B-PX-GATE-PAYMENT-EN", state: "GATE-PAYMENT", flows: ["FL-017"], locale: "en", description: "isolated local test-wallet preparation" },
  { id: "B-PX-GATE-PAYMENT-FAIL-KO", state: "GATE-PAYMENT-FAIL", flows: ["FL-017"], locale: "ko", description: "test-wallet preparation failure and retry" },
  { id: "B-PX-AFTER19-VENUE-RETURN-EN", state: "AFTER19-VENUE-RETURN", flows: ["FL-002", "FL-013", "FL-014"], locale: "en", description: "eligibility returns to the exact Table, venue, and note" },
  { id: "B-PX-TABLES-LIST-EN", state: "TABLES-LIST", flows: ["FL-003"], locale: "en", description: "Tables index" },
  { id: "B-PX-TABLES-VENUE-EMPTY-EN", state: "TABLES-VENUE-EMPTY", flows: ["FL-003"], locale: "en", description: "venue-scoped zero-Table state with exact-place and global recovery" },
  { id: "B-PX-TABLE-DETAIL-KO", state: "TABLE-DETAIL", flows: ["FL-003"], locale: "ko", description: "Table detail and trust boundary" },
  { id: "B-PX-TABLE-JOIN-FAIL-EN", state: "TABLE-JOIN-FAIL", flows: ["FL-003"], locale: "en", description: "retryable Table join failure" },
  { id: "B-PX-CHAT-EN", state: "CHAT", flows: ["FL-003"], locale: "en", description: "confirmed member chat" },
  { id: "B-PX-CHAT-IMAGE-FAIL-EN", state: "CHAT-IMAGE-FAIL", flows: ["FL-003"], locale: "en", description: "device-local image failure and retry" },
  { id: "B-PX-FEEDBACK-KO", state: "FEEDBACK", flows: ["FL-003", "FL-015"], locale: "ko", description: "post-meal structured feedback" },
  { id: "B-PX-REPORT-EN", state: "REPORT", flows: ["FL-003"], locale: "en", description: "report and block confirmation" },
  { id: "B-PX-LOCAL-SIGNAL-EMPTY-EN", state: "LOCAL-SIGNAL-EMPTY", flows: ["FL-012"], locale: "en", description: "required note-or-photo empty state" },
  { id: "B-PX-LOCAL-SIGNAL-FAIL-KO", state: "LOCAL-SIGNAL-FAIL", flows: ["FL-012"], locale: "ko", description: "draft-preserving submit failure" },
  { id: "B-PX-LOCAL-SIGNAL-SUCCESS-EN", state: "LOCAL-SIGNAL-SUCCESS", flows: ["FL-012", "FL-015"], locale: "en", description: "simulated contribution boundary" },
  { id: "B-PX-CHECKOUT-IDLE-EN", state: "CHECKOUT-IDLE", flows: ["FL-004", "FL-017"], locale: "en", description: "KRW price and local OOKRW Test quote" },
  { id: "B-PX-CHECKOUT-CANCEL-KO", state: "CHECKOUT-CANCEL", flows: ["FL-004"], locale: "ko", description: "cancel with no local test receipt" },
  { id: "B-PX-CHECKOUT-FAIL-EN", state: "CHECKOUT-FAIL", flows: ["FL-004"], locale: "en", description: "test-payment failure with exact-return invariants" },
  { id: "B-PX-CHECKOUT-RECEIPT-EN", state: "CHECKOUT-RECEIPT", flows: ["FL-004"], locale: "en", description: "device-local test-payment receipt" },
  { id: "B-PX-CHECKOUT-STAMP-KO", state: "CHECKOUT-STAMP", flows: ["FL-004"], locale: "ko", description: "Korean device-local test-payment receipt" },
  { id: "B-PX-MY-EN", state: "MY", flows: ["FL-004", "FL-011", "FL-015"], locale: "en", description: "saved canonical venue and planned Table" },
  { id: "B-PX-SESSION-RESET-CONFIRM-KO", state: "SESSION-RESET-CONFIRM", flows: ["FL-010", "FL-015"], locale: "ko", description: "device-data clear scope and confirmation" },
  { id: "B-PX-DISCOVERY-RESET-CONFIRM-EN", state: "DISCOVERY-RESET-CONFIRM", flows: ["FL-007", "FL-008", "FL-009"], locale: "en", description: "discovery choices and onboarding reset action" },
  { id: "B-PX-PROFILE-KO", state: "PROFILE", flows: ["FL-015"], locale: "ko", description: "Korean Travel Pass and wallet readiness" },
  { id: "B-PX-TRUST-FOUR-AXES-EN", state: "TRUST-FOUR-AXES", flows: ["FL-003", "FL-012", "FL-015"], locale: "en", description: "separate account, Person, 19+, credential, and wallet states" },
  { id: "B-PX-LABS-EN", state: "LABS", flows: ["FL-004", "FL-016", "FL-018"], locale: "en", description: "Labs truth and signer boundary" },
  { id: "B-PX-LABS-TRAIT-FAIL-KO", state: "LABS-TRAIT-FAIL", flows: ["FL-016"], locale: "ko", description: "merchant trait negative contract" },
  { id: "B-PX-LABS-BRIDGE-FAIL-EN", state: "LABS-BRIDGE-FAIL", flows: ["FL-018"], locale: "en", description: "ordered bridge failure with assets unchanged" },
  { id: "B-PX-LABS-BRIDGE-SUCCESS-EN", state: "LABS-BRIDGE-SUCCESS", flows: ["FL-018"], locale: "en", description: "read-only bridge receipt" },
] as const

export type BCheckpointVisualEvidence = {
  checkpointId: `B-E2E-${BFlowId}-${BCheckpoint}`
  disposition: "pixel" | "functional_only"
  caseIds: readonly BVisualCase["id"][]
  reason: string
}

type CheckpointKey = `${BFlowId}:${BCheckpoint}`
const pixel = (...caseIds: BVisualCase["id"][]) => caseIds

/**
 * Explicit checkpoint-to-pixel links. A checkpoint omitted here is deliberately
 * FUNCTIONAL_ONLY: it still has real browser evidence in B_FLOW_CONTRACTS, but
 * does not claim a second screenshot when it introduces no layout-distinct UI.
 */
const B_PIXEL_BY_CHECKPOINT: Partial<Record<CheckpointKey, readonly BVisualCase["id"][]>> = {
  "FL-001:ENTRY": pixel("B-PX-NATION-EN", "B-PX-NATION-KO"),
  "FL-001:DECISION": pixel("B-PX-CITY-LIVE-EN", "B-PX-CITY-LIVE-KO", "B-PX-CITY-LIST-EN", "B-PX-CITY-FILTERED-MAP-EN", "B-PX-PLACE-PEEK-EN"),
  "FL-001:CANCEL": pixel("B-PX-PLACE-PEEK-EN"),
  "FL-001:ERROR": pixel("B-PX-CITY-FALLBACK-KO"),
  "FL-001:RETRY": pixel("B-PX-CITY-FALLBACK-KO"),
  "FL-001:TERMINAL": pixel("B-PX-PLACE-DETAIL-EN"),
  "FL-001:RETURN": pixel("B-PX-CITY-LIVE-EN", "B-PX-CITY-FILTERED-MAP-EN"),
  "FL-002:ENTRY": pixel("B-PX-AFTER19-VENUE-LOCKED-EN"),
  "FL-002:DECISION": pixel("B-PX-AFTER19-VENUE-LOCKED-EN"),
  "FL-002:CANCEL": pixel("B-PX-AFTER19-VENUE-LOCKED-EN"),
  "FL-002:ERROR": pixel("B-PX-GATE-AGE-FAIL-KO"),
  "FL-002:RETRY": pixel("B-PX-GATE-AGE-FAIL-KO"),
  "FL-002:TERMINAL": pixel("B-PX-AFTER19-VENUE-RETURN-EN"),
  "FL-002:RETURN": pixel("B-PX-AFTER19-VENUE-RETURN-EN"),
  "FL-003:ENTRY": pixel("B-PX-TABLES-LIST-EN", "B-PX-TABLES-VENUE-EMPTY-EN"),
  "FL-003:DECISION": pixel("B-PX-TABLE-DETAIL-KO"),
  "FL-003:ERROR": pixel("B-PX-TABLE-JOIN-FAIL-EN", "B-PX-CHAT-IMAGE-FAIL-EN"),
  "FL-003:RETRY": pixel("B-PX-TABLE-JOIN-FAIL-EN", "B-PX-CHAT-IMAGE-FAIL-EN"),
  "FL-003:TERMINAL": pixel("B-PX-CHAT-EN", "B-PX-FEEDBACK-KO", "B-PX-REPORT-EN"),
  "FL-003:RETURN": pixel("B-PX-TABLES-LIST-EN", "B-PX-TABLES-VENUE-EMPTY-EN"),
  "FL-004:ENTRY": pixel("B-PX-CHECKOUT-IDLE-EN"),
  "FL-004:DECISION": pixel("B-PX-CHECKOUT-IDLE-EN"),
  "FL-004:CANCEL": pixel("B-PX-CHECKOUT-CANCEL-KO"),
  "FL-004:ERROR": pixel("B-PX-CHECKOUT-FAIL-EN"),
  "FL-004:RETRY": pixel("B-PX-CHECKOUT-FAIL-EN"),
  "FL-004:TERMINAL": pixel("B-PX-CHECKOUT-RECEIPT-EN", "B-PX-CHECKOUT-STAMP-KO"),
  "FL-004:RETURN": pixel("B-PX-MY-EN"),
  "FL-005:ENTRY": pixel("B-PX-GATE-PERSON-CX-KO"),
  "FL-005:DECISION": pixel("B-PX-GATE-PERSON-CX-KO"),
  "FL-005:ERROR": pixel("B-PX-GATE-PERSON-CX-KO"),
  "FL-005:RETRY": pixel("B-PX-GATE-PERSON-CX-KO"),
  "FL-006:ENTRY": pixel("B-PX-GATE-PERSON-PASSPORT-EN"),
  "FL-006:DECISION": pixel("B-PX-GATE-RESIDENCE-UNSUPPORTED-EN"),
  "FL-006:ERROR": pixel("B-PX-GATE-RESIDENCE-UNSUPPORTED-EN"),
  "FL-006:RETRY": pixel("B-PX-GATE-PERSON-PASSPORT-EN"),
  "FL-007:ENTRY": pixel("B-PX-ONBOARDING-VALUE-EN"),
  "FL-007:DECISION": pixel("B-PX-ONBOARDING-PERSONAS-KO", "B-PX-ONBOARDING-PREFERENCES-EN"),
  "FL-007:CANCEL": pixel("B-PX-ONBOARDING-VALUE-EN", "B-PX-DISCOVERY-RESET-CONFIRM-EN"),
  "FL-007:TERMINAL": pixel("B-PX-NATION-EN"),
  "FL-007:RETURN": pixel("B-PX-NATION-EN"),
  "FL-008:ENTRY": pixel("B-PX-ONBOARDING-VALUE-EN"),
  "FL-008:DECISION": pixel("B-PX-ONBOARDING-PERSONAS-KO", "B-PX-ONBOARDING-PREFERENCES-EN"),
  "FL-008:CANCEL": pixel("B-PX-ONBOARDING-VALUE-EN", "B-PX-DISCOVERY-RESET-CONFIRM-EN"),
  "FL-008:TERMINAL": pixel("B-PX-NATION-KO"),
  "FL-008:RETURN": pixel("B-PX-NATION-KO"),
  "FL-009:ENTRY": pixel("B-PX-ONBOARDING-VALUE-EN"),
  "FL-009:DECISION": pixel("B-PX-ONBOARDING-PERSONAS-KO", "B-PX-ONBOARDING-PREFERENCES-EN"),
  "FL-009:CANCEL": pixel("B-PX-ONBOARDING-VALUE-EN", "B-PX-DISCOVERY-RESET-CONFIRM-EN"),
  "FL-009:TERMINAL": pixel("B-PX-NATION-EN"),
  "FL-009:RETURN": pixel("B-PX-NATION-EN"),
  "FL-010:ENTRY": pixel("B-PX-PLACE-DETAIL-EN"),
  "FL-010:DECISION": pixel("B-PX-GATE-ACCOUNT-FAIL-KO"),
  "FL-010:CANCEL": pixel("B-PX-SESSION-RESET-CONFIRM-KO"),
  "FL-010:ERROR": pixel("B-PX-GATE-ACCOUNT-FAIL-KO"),
  "FL-010:RETRY": pixel("B-PX-GATE-ACCOUNT-FAIL-KO"),
  "FL-010:TERMINAL": pixel("B-PX-SAVE-RECOVERED-KO"),
  "FL-010:RETURN": pixel("B-PX-PLACE-DETAIL-EN"),
  "FL-011:ENTRY": pixel("B-PX-PLACE-DETAIL-EN"),
  "FL-011:CANCEL": pixel("B-PX-SAVE-FAILURE-EN"),
  "FL-011:ERROR": pixel("B-PX-SAVE-FAILURE-EN"),
  "FL-011:RETRY": pixel("B-PX-SAVE-RECOVERED-KO"),
  "FL-011:TERMINAL": pixel("B-PX-SAVE-RECOVERED-KO", "B-PX-MY-EN"),
  "FL-011:RETURN": pixel("B-PX-PLACE-DETAIL-EN"),
  "FL-012:ENTRY": pixel("B-PX-PLACE-DETAIL-EN"),
  "FL-012:DECISION": pixel("B-PX-LOCAL-SIGNAL-EMPTY-EN"),
  "FL-012:CANCEL": pixel("B-PX-LOCAL-SIGNAL-EMPTY-EN"),
  "FL-012:ERROR": pixel("B-PX-LOCAL-SIGNAL-FAIL-KO"),
  "FL-012:RETRY": pixel("B-PX-LOCAL-SIGNAL-FAIL-KO"),
  "FL-012:TERMINAL": pixel("B-PX-LOCAL-SIGNAL-SUCCESS-EN"),
  "FL-012:RETURN": pixel("B-PX-PLACE-DETAIL-EN"),
  "FL-013:ENTRY": pixel("B-PX-AFTER19-VENUE-LOCKED-EN"),
  "FL-013:DECISION": pixel("B-PX-AFTER19-PROMPT-EN"),
  "FL-013:CANCEL": pixel("B-PX-AFTER19-PROMPT-EN"),
  "FL-013:ERROR": pixel("B-PX-GATE-AGE-FAIL-KO"),
  "FL-013:RETRY": pixel("B-PX-GATE-AGE-FAIL-KO"),
  "FL-013:TERMINAL": pixel("B-PX-AFTER19-VENUE-RETURN-EN"),
  "FL-013:RETURN": pixel("B-PX-AFTER19-VENUE-RETURN-EN"),
  "FL-014:ENTRY": pixel("B-PX-CITY-LIVE-EN"),
  "FL-014:DECISION": pixel("B-PX-AFTER19-VENUE-RETURN-EN"),
  "FL-014:CANCEL": pixel("B-PX-CITY-LIVE-EN"),
  "FL-014:ERROR": pixel("B-PX-AFTER19-EXPIRED-REASON-EN"),
  "FL-014:RETRY": pixel("B-PX-AFTER19-EXPIRED-REASON-EN"),
  "FL-014:TERMINAL": pixel("B-PX-AFTER19-VENUE-RETURN-EN"),
  "FL-014:RETURN": pixel("B-PX-CITY-LIVE-EN", "B-PX-AFTER19-EXPIRED-REASON-EN"),
  "FL-015:ENTRY": pixel("B-PX-PROFILE-KO"),
  "FL-015:DECISION": pixel("B-PX-PROFILE-KO"),
  "FL-015:CANCEL": pixel("B-PX-SESSION-RESET-CONFIRM-KO"),
  "FL-015:TERMINAL": pixel("B-PX-PROFILE-KO", "B-PX-TRUST-FOUR-AXES-EN", "B-PX-LOCAL-SIGNAL-SUCCESS-EN", "B-PX-FEEDBACK-KO"),
  "FL-015:RETURN": pixel("B-PX-MY-EN"),
  "FL-016:ENTRY": pixel("B-PX-PLACE-DETAIL-EN", "B-PX-LABS-EN"),
  "FL-016:DECISION": pixel("B-PX-LABS-TRAIT-FAIL-KO"),
  "FL-016:ERROR": pixel("B-PX-LABS-TRAIT-FAIL-KO"),
  "FL-016:RETRY": pixel("B-PX-LABS-TRAIT-FAIL-KO"),
  "FL-016:TERMINAL": pixel("B-PX-LABS-EN"),
  "FL-016:RETURN": pixel("B-PX-PLACE-DETAIL-EN"),
  "FL-017:ENTRY": pixel("B-PX-CHECKOUT-IDLE-EN"),
  "FL-017:DECISION": pixel("B-PX-GATE-PAYMENT-EN"),
  "FL-017:CANCEL": pixel("B-PX-GATE-PAYMENT-EN"),
  "FL-017:ERROR": pixel("B-PX-GATE-PAYMENT-FAIL-KO"),
  "FL-017:RETRY": pixel("B-PX-GATE-PAYMENT-FAIL-KO"),
  "FL-017:TERMINAL": pixel("B-PX-CHECKOUT-RECEIPT-EN"),
  "FL-017:RETURN": pixel("B-PX-CHECKOUT-IDLE-EN"),
  "FL-018:ENTRY": pixel("B-PX-LABS-EN"),
  "FL-018:DECISION": pixel("B-PX-LABS-EN"),
  "FL-018:CANCEL": pixel("B-PX-LABS-BRIDGE-FAIL-EN"),
  "FL-018:ERROR": pixel("B-PX-LABS-BRIDGE-FAIL-EN"),
  "FL-018:RETRY": pixel("B-PX-LABS-BRIDGE-FAIL-EN"),
  "FL-018:TERMINAL": pixel("B-PX-LABS-BRIDGE-SUCCESS-EN"),
  "FL-018:RETURN": pixel("B-PX-MY-EN"),
}

export const B_CHECKPOINT_VISUAL_EVIDENCE: readonly BCheckpointVisualEvidence[] = B_FLOW_CONTRACTS.flatMap((flow) =>
  flow.checkpoints.map((checkpoint) => {
    const caseIds = B_PIXEL_BY_CHECKPOINT[`${flow.flow}:${checkpoint.checkpoint}`] ?? []
    return {
      checkpointId: checkpoint.id,
      disposition: caseIds.length ? "pixel" as const : "functional_only" as const,
      caseIds,
      reason: caseIds.length
        ? `Layout-distinct evidence is captured by ${caseIds.join(", ")}.`
        : `No distinct pixel is claimed. Canonical browser evidence: ${checkpoint.proof}`,
    }
  }),
)

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
  await page.addInitScript(() => {
    // The legacy pixel census owns a deterministic online browser. Tile
    // delivery failure is injected by the routes below; host Wi-Fi state must
    // never silently turn an unrelated reviewed frame into the Offline UI.
    Object.defineProperty(Navigator.prototype, "onLine", { configurable: true, get: () => true })
  })
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

async function stabilizeMobileEvidenceScroll(
  page: Page,
  target: Locator,
  position: { kind: "bottom" } | { kind: "top", offset: number } | { kind: "scrollTop", value: number, desktopValue?: number },
) {
  if ((page.viewportSize()?.width ?? 0) > 430) {
    if (position.kind === "top") {
      const expectedTop = await target.evaluate((element, offset) => {
        let scroller = element.parentElement
        while (scroller) {
          const overflowY = getComputedStyle(scroller).overflowY
          if (["auto", "scroll"].includes(overflowY) && scroller.scrollHeight > scroller.clientHeight) break
          scroller = scroller.parentElement
        }
        if (!scroller) throw new Error("Visual evidence scroll container was not found")
        const targetRect = element.getBoundingClientRect()
        const scrollerRect = scroller.getBoundingClientRect()
        scroller.scrollTop += targetRect.top - Math.max(scrollerRect.top, 0) - offset
        scroller.dataset.evidenceScrollTop = String(scroller.scrollTop)
        return Math.round(element.getBoundingClientRect().top)
      }, position.offset)
      await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
      await expect.poll(() => target.evaluate((element) => Math.round(element.getBoundingClientRect().top))).toBe(expectedTop)
      return
    }
    if (position.kind === "scrollTop") {
      const expectedScrollTop = position.desktopValue ?? position.value
      await target.evaluate((element, scrollTop) => {
        let scroller = element.parentElement
        while (scroller) {
          const overflowY = getComputedStyle(scroller).overflowY
          if (["auto", "scroll"].includes(overflowY) && scroller.scrollHeight > scroller.clientHeight) break
          scroller = scroller.parentElement
        }
        if (!scroller) throw new Error("Visual evidence scroll container was not found")
        // Earlier controls may auto-scroll the dialog while being clicked.
        // Reset that incidental scroll to the baseline's explicit desktop
        // position instead of inheriting whichever offset a long run leaves.
        scroller.scrollTop = scrollTop
        scroller.dataset.evidenceScrollTop = String(scroller.scrollTop)
      }, expectedScrollTop)
      await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
      await expect.poll(() => target.evaluate((element) => {
        let scroller = element.parentElement
        while (scroller) {
          const overflowY = getComputedStyle(scroller).overflowY
          if (["auto", "scroll"].includes(overflowY) && scroller.scrollHeight > scroller.clientHeight) return scroller.scrollTop
          scroller = scroller.parentElement
        }
        return -1
      })).toBe(expectedScrollTop)
      return
    }
    const expectedScrollTop = await target.evaluate((element) => {
      let scroller = element.parentElement
      while (scroller) {
        const overflowY = getComputedStyle(scroller).overflowY
        if (["auto", "scroll"].includes(overflowY) && scroller.scrollHeight > scroller.clientHeight) break
        scroller = scroller.parentElement
      }
      if (!scroller) throw new Error("Visual evidence scroll container was not found")
      // `scrollIntoViewIfNeeded` preserves whichever incidental offset a prior
      // click/focus operation created. Pin the actual scroll owner to its
      // clamped end position so long serial runs and isolated runs capture the
      // same pixels.
      scroller.scrollTop = scroller.scrollHeight
      scroller.dataset.evidenceScrollTop = String(scroller.scrollTop)
      return scroller.scrollTop
    })
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
    await expect.poll(() => target.evaluate((element) => {
      let scroller = element.parentElement
      while (scroller) {
        const overflowY = getComputedStyle(scroller).overflowY
        if (["auto", "scroll"].includes(overflowY) && scroller.scrollHeight > scroller.clientHeight) return scroller.scrollTop
        scroller = scroller.parentElement
      }
      return -1
    })).toBe(expectedScrollTop)
    return
  }
  await settle(page)
  const expected = await target.evaluate((element, nextPosition) => {
    let scroller = element.parentElement
    while (scroller) {
      const overflowY = getComputedStyle(scroller).overflowY
      if (["auto", "scroll"].includes(overflowY) && scroller.scrollHeight > scroller.clientHeight) break
      scroller = scroller.parentElement
    }
    if (!scroller) throw new Error("Visual evidence scroll container was not found")
    if (nextPosition.kind === "scrollTop") scroller.scrollTop = nextPosition.value
    else if (nextPosition.kind === "top") {
      const targetRect = element.getBoundingClientRect()
      const scrollerRect = scroller.getBoundingClientRect()
      scroller.scrollTop += targetRect.top - Math.max(scrollerRect.top, 0) - nextPosition.offset
    } else {
      const targetRect = element.getBoundingClientRect()
      const scrollerRect = scroller.getBoundingClientRect()
      scroller.scrollTop += targetRect.bottom - Math.min(scrollerRect.bottom, window.innerHeight)
    }
    scroller.dataset.evidenceScrollTop = String(scroller.scrollTop)
    return nextPosition.kind === "scrollTop"
      ? { kind: nextPosition.kind, value: scroller.scrollTop }
      : nextPosition.kind === "top"
        ? { kind: nextPosition.kind, value: Math.round(element.getBoundingClientRect().top) }
      : { kind: nextPosition.kind, value: Math.round(Math.min(scroller.getBoundingClientRect().bottom, window.innerHeight)) }
  }, position)
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
  if (expected.kind === "scrollTop") {
    await expect.poll(() => target.evaluate((element) => {
      let scroller = element.parentElement
      while (scroller) {
        const overflowY = getComputedStyle(scroller).overflowY
        if (["auto", "scroll"].includes(overflowY) && scroller.scrollHeight > scroller.clientHeight) return scroller.scrollTop
        scroller = scroller.parentElement
      }
      return -1
    })).toBe(expected.value)
  } else if (expected.kind === "top") {
    await expect.poll(() => target.evaluate((element) => Math.round(element.getBoundingClientRect().top))).toBe(expected.value)
  } else {
    await expect.poll(() => target.evaluate((element) => Math.round(element.getBoundingClientRect().bottom))).toBe(expected.value)
  }
}

async function expectCanonicalDetailReady(page: Page) {
  await expect(page.getByTestId("canonical-place-overlay").locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")
}

async function openCity(page: Page, query = "") {
  await gotoB(page, query)
  await page.locator("[data-city='seoul']").click()
  await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
}

async function openLocalSignal(page: Page, query = "") {
  await openCanonicalVenue(page, { query })
  await page.getByTestId("canonical-local-signal-open").click()
  await expect(page.getByTestId("ondo-b-local-signal")).toBeVisible()
}

async function triggerPersonGate(page: Page, locale: BLocale, persona: NonNullable<BSessionSeed["persona"]>, qa = false) {
  await seedB(page, { locale, session: { persona, account: "ACC-ACTIVE", person: "PER-UNVERIFIED", paymentKyc: "PKY-NOT-STARTED" } })
  await openLocalSignal(page, qa ? "qa=1" : "")
  const signal = page.getByTestId("ondo-b-local-signal")
  await signal.locator("fieldset button").first().click()
  await signal.locator("textarea").fill(locale === "ko" ? "주문은 입구에서 해요." : "Order beside the entrance.")
  await signal.getByTestId("local-signal-person-check").click()
  await expect(page.getByTestId("ondo-b-local-check-walkthrough")).toBeVisible()
}

async function triggerAgeGate(page: Page, locale: BLocale, qa = false) {
  await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", age: "AGE-UNVERIFIED", paymentKyc: "PKY-NOT-STARTED" } })
  if (qa) await page.addInitScript(() => { window.__ONDO_B_QA__ = { ...(window.__ONDO_B_QA__ ?? {}), after19: "failure" } })
  await openTableDetail(page, locale)
  await page.getByTestId("table-join-draft").fill(locale === "ko" ? "이 메모와 장소를 유지해 주세요." : "Keep this note and exact place.")
  await page.getByTestId("table-join").click()
  await expect(page.getByTestId("after19-walkthrough")).toBeVisible()
}

async function triggerPaymentGate(page: Page, locale: BLocale, qa = false) {
  await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", paymentKyc: "PKY-NOT-STARTED" } })
  if (qa) await page.addInitScript(() => {
    const target = window as Window & { __ONDO_B_QA__?: Record<string, unknown> }
    target.__ONDO_B_QA__ = { ...(target.__ONDO_B_QA__ ?? {}), wallet: "failure" }
  })
  await openCommerceOffer(page)
  await page.getByTestId("payment-confirm").click()
  const connect = page.getByTestId("wallet-connect-sheet")
  await expect(connect).toBeVisible()
  if (qa) {
    await connect.locator("button").filter({ hasText: locale === "ko" ? "테스트 지갑 준비" : "Prepare test wallet" }).click()
    await expect(connect).toHaveAttribute("data-phase", "failed")
  }
}

async function openTablesIndex(page: Page, locale: BLocale, query = "") {
  await gotoB(page, query)
  await page.getByRole("navigation").locator("button").nth(2).click()
  await expect(page.getByTestId("tables-entry")).toBeVisible()
}

async function openTableDetail(page: Page, locale: BLocale, query = "") {
  await openTablesIndex(page, locale, query)
  await page.getByTestId(`table-open-${CURRENT_TABLE_ID}`).click()
  await expect(page.getByTestId("table-detail")).toHaveAttribute("data-table-id", CURRENT_TABLE_ID)
}

async function extendBDeviceSeed(page: Page, next: Record<string, unknown>) {
  await page.addInitScript(({ key, patch }) => {
    const current = JSON.parse(localStorage.getItem(key) ?? "{}") as Record<string, unknown>
    localStorage.setItem(key, JSON.stringify({ ...current, ...patch }))
  }, { key: B_DEVICE_KEY, patch: next })
}

async function openChat(page: Page, locale: BLocale, query = "") {
  await seedB(page, {
    locale,
    local: { plannedTableRefs: [{ tableId: CURRENT_TABLE_ID, venueId: CANONICAL_VENUE_ID }] },
    session: { account: "ACC-ACTIVE", person: "PER-VERIFIED" },
  })
  await extendBDeviceSeed(page, { plannedTableRefs: [{ tableId: CURRENT_TABLE_ID, venueId: CANONICAL_VENUE_ID }] })
  await openTableDetail(page, locale, query)
  await page.getByTestId("table-open-chat").click()
  await expect(page.getByTestId("table-chat")).toBeVisible()
}

async function openCommerceOffer(page: Page, query = "") {
  await openCanonicalVenue(page, { query })
  const entry = page.getByTestId("canonical-meal-benefit-open")
  await entry.scrollIntoViewIfNeeded()
  await entry.click()
  await expect(page.getByTestId("ondo-b-id-wallet-commerce")).toHaveAttribute("data-origin-venue-id", CANONICAL_VENUE_ID)
}

async function openCheckout(page: Page, locale: BLocale, query = "") {
  await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", paymentKyc: "PKY-VERIFIED", stamps: 9 } })
  await openCommerceOffer(page, query)
}

async function prepareCommerceWallet(page: Page, locale: BLocale) {
  const offer = page.getByTestId("ondo-b-id-wallet-commerce")
  await offer.getByTestId("payment-confirm").click()
  const sheet = page.getByTestId("wallet-connect-sheet")
  await expect(sheet).toBeVisible()
  await sheet.locator("button").filter({ hasText: locale === "ko" ? "테스트 지갑 준비" : "Prepare test wallet" }).click()
  await expect(sheet).toBeHidden()
  await expect(offer).toHaveAttribute("data-wallet-status", "ready")
}

async function completeCommercePayment(page: Page, locale: BLocale) {
  const offer = page.getByTestId("ondo-b-id-wallet-commerce")
  await offer.getByTestId("benefit-accept").click()
  await prepareCommerceWallet(page, locale)
  await offer.getByTestId("payment-minimum-consent").locator("input").check()
  await offer.getByTestId("payment-confirm").click()
}

async function installOneShotDeviceWriteFailure(page: Page) {
  await page.evaluate((key) => {
    const original = Storage.prototype.setItem
    let pending = true
    Storage.prototype.setItem = function (name: string, value: string) {
      if (this === localStorage && name === key && pending) {
        pending = false
        Storage.prototype.setItem = original
        throw new DOMException("Quota exceeded", "QuotaExceededError")
      }
      return original.call(this, name, value)
    }
  }, B_DEVICE_KEY)
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
      await page.getByTestId("persona-travelling").click()
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
  } else if (state === "CITY-LIVE" || state === "CITY-LIST" || state === "CITY-FILTERED-MAP") {
    await seedB(page, { locale })
    await openCity(page)
    if (state === "CITY-LIST" || state === "CITY-FILTERED-MAP") {
      await page.getByRole("button", { name: locale === "ko" ? "목록" : "List", exact: true }).click()
    }
    if (state === "CITY-FILTERED-MAP") {
      await page.getByRole("search").getByRole("textbox").fill("느린마을 양조장")
      const list = page.getByTestId("ondo-b-venue-list")
      await expect(list.locator("li")).toHaveCount(1)
      const result = list.locator("[data-venue-opener='mois-18939eecb43c15ab4305']")
      await expect(result.getByTestId("ondo-b-list-pulse")).toHaveAttribute("data-pulse-level", "hot")
      await expect(result).toContainText(locale === "ko" ? "공식 한국어 출처명" : "Official Korean source name")
      await page.getByTestId("ondo-b-view-toggle").click()
      const mapEntry = page.getByTestId("ondo-b-map-entry")
      await expect(mapEntry).toHaveAttribute("data-result-count", "1")
      await expect(mapEntry).toHaveAttribute("data-curated-pulse-count", "1")
      await expect(page.getByTestId("ondo-b-map-key")).toHaveAttribute("data-pulse-key-presentation", "compact-gradient")
    }
  } else if (state === "CITY-FALLBACK") {
    await seedB(page, { locale })
    await gotoB(page)
    await page.locator("[data-city='seoul']").click()
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-map-state", "error", { timeout: 20_000 })
    await expect(page.getByTestId("ondo-b-venue-list")).toBeVisible()
  } else if (state === "PLACE-PEEK") {
    await seedB(page, { locale })
    await openCanonicalVenue(page, { expanded: false })
    await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
  } else if (state === "PLACE-DETAIL") {
    await seedB(page, { locale })
    await openCanonicalVenue(page)
  } else if (state === "AFTER19-PROMPT") {
    await triggerAgeGate(page, locale)
    await expect(page.getByTestId("ondo-b-action-gate")).toHaveAttribute("data-gate-view", "intro")
  } else if (state === "AFTER19-EXPIRED-REASON") {
    await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED" } })
    await page.addInitScript(() => { window.__ONDO_B_QA__ = { ...(window.__ONDO_B_QA__ ?? {}), after19: "expired" } })
    await openTableDetail(page, locale)
    await page.getByTestId("table-join-draft").fill(locale === "ko" ? "만료 후에도 이 메모를 유지해 주세요." : "Keep this exact note through expiry.")
    await page.getByTestId("table-join").click()
    await page.getByTestId("after19-start").click()
    const gate = page.getByTestId("ondo-b-action-gate")
    await expect(gate).toHaveAttribute("data-gate-view", "expired")
    await expect(gate).toContainText(locale === "ko" ? "만료" : "expired")
    await expect(gate.getByTestId("action-gate-retry")).toBeVisible()
    await expect(gate.getByTestId("action-gate-cancel")).toBeVisible()
  } else if (state === "AFTER19-VENUE-LOCKED" || state === "AFTER19-VENUE-RETURN") {
    await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", age: "AGE-UNVERIFIED", paymentKyc: "PKY-NOT-STARTED" } })
    await openCanonicalVenue(page)
    await expectCanonicalDetailReady(page)
    const place = page.getByTestId("canonical-place-overlay")
    const access = page.getByTestId("canonical-after19-required")
    await expect(access).toBeVisible()
    await expect(place.locator("[data-detail-state='ready']")).toBeVisible()
    if (state === "AFTER19-VENUE-RETURN") {
      await page.getByTestId("canonical-place-table").click()
      const table = page.getByTestId("table-detail")
      await expect(table).toHaveAttribute("data-venue-id", CANONICAL_VENUE_ID)
      const draft = locale === "ko" ? "같은 장소와 메모로 돌아가 주세요." : "Return to this exact place and note."
      await table.getByTestId("table-join-draft").fill(draft)
      await table.getByTestId("table-join").click()
      await page.getByTestId("after19-start").click()
      const confirmation = table.getByTestId("table-join-confirmation")
      await expect(confirmation).toHaveAttribute("data-return-table", CURRENT_TABLE_ID)
      await expect(confirmation).toHaveAttribute("data-return-venue", CANONICAL_VENUE_ID)
      await expect(confirmation.getByTestId("after19-return")).toContainText(draft)
    }
    else await access.scrollIntoViewIfNeeded()
  } else if (state === "SAVE-FAILURE" || state === "SAVE-RECOVERED") {
    await seedB(page, { locale, session: { account: "ACC-ACTIVE" } })
    await openCanonicalVenue(page)
    await expectCanonicalDetailReady(page)
    await page.evaluate(() => {
      const url = new URL(window.location.href)
      url.searchParams.set("scenario", "save-failed")
      window.history.replaceState(window.history.state, "", url)
    })
    await expect(page).toHaveURL(/scenario=save-failed/)
    await installOneShotDeviceWriteFailure(page)
    await page.getByTestId("canonical-venue-save").click()
    await expect(page.getByTestId("canonical-save-error")).toBeVisible()
    if (state === "SAVE-RECOVERED") {
      await page.reload({ waitUntil: "domcontentloaded" })
      await expect(page).toHaveURL(new RegExp(`venueId=${CANONICAL_VENUE_ID}`))
      await expect(page).toHaveURL(/detail=1/)
      await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
      await expectCanonicalDetailReady(page)
      await installOneShotDeviceWriteFailure(page)
      await page.getByTestId("canonical-venue-save").click()
      await expect(page.getByTestId("canonical-save-error")).toBeVisible()
      await page.getByTestId("canonical-save-retry").click()
      await expect(page.getByTestId("canonical-venue-save")).toHaveAttribute("aria-pressed", "true")
      await page.getByTestId("canonical-venue-save").scrollIntoViewIfNeeded()
    } else {
      const saveError = page.getByTestId("canonical-save-error")
      await saveError.scrollIntoViewIfNeeded()
      await expect(saveError).toBeVisible()
    }
  } else if (state === "GATE-ACCOUNT-FAIL") {
    await seedB(page, { locale, session: { account: "ACC-GUEST", person: "PER-UNVERIFIED", paymentKyc: "PKY-NOT-STARTED" } })
    await openCanonicalVenue(page)
    await page.evaluate(() => {
      const target = window as Window & { __ONDO_B_QA__?: Record<string, unknown> }
      target.__ONDO_B_QA__ = { ...(target.__ONDO_B_QA__ ?? {}), account: "failure" }
    })
    await page.getByTestId("canonical-venue-save").click()
    const gate = page.getByTestId("account-save-gate")
    await expect(gate).toHaveAttribute("data-account-return-venue", CANONICAL_VENUE_ID)
    await gate.getByTestId("account-start").click()
    await expect(gate.getByTestId("gate-failure")).toBeVisible()
  } else if (state === "GATE-PERSON-PASSPORT") {
    await triggerPersonGate(page, locale, "short_term")
  } else if (state === "GATE-PERSON-CX") {
    await triggerPersonGate(page, locale, "korean_local")
  } else if (state === "GATE-PERSON-RESIDENCE-UNSUPPORTED") {
    await triggerPersonGate(page, locale, "long_term_resident")
    await page.evaluate(() => {
      const target = window as Window & { __ONDO_B_QA__?: Record<string, unknown> }
      target.__ONDO_B_QA__ = { ...(target.__ONDO_B_QA__ ?? {}), eligibility: "unavailable" }
    })
    await page.getByTestId("local-check-boundary-continue").click()
    await expect(page.getByTestId("local-check-result")).toHaveAttribute("data-result", "unavailable")
  } else if (state === "GATE-AGE-FAIL") {
    await triggerAgeGate(page, locale, true)
    await page.getByTestId("after19-start").click()
    await expect(page.getByTestId("ondo-b-action-gate")).toHaveAttribute("data-gate-view", "failure")
  } else if (state === "GATE-PAYMENT" || state === "GATE-PAYMENT-FAIL") {
    await triggerPaymentGate(page, locale, state === "GATE-PAYMENT-FAIL")
  } else if (state === "TABLES-VENUE-EMPTY") {
    await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED" } })
    await gotoB(page, "?venueId=mois-18939eecb43c15ab4305")
    await page.getByTestId("canonical-place-details").click()
    await expect(page.getByTestId("canonical-place-overlay")).toHaveAttribute("data-venue-id", "mois-18939eecb43c15ab4305")
    await expect(page.getByTestId("canonical-place-table")).toHaveCount(0)
    await expect(page.getByTestId("canonical-place-overlay").getByRole("button", { name: locale === "ko" ? "장소 닫기" : "Close place" })).toBeVisible()
    await expect(page.getByTestId("nav-tables")).toBeAttached()
  } else if (state === "TABLES-LIST") {
    await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED" } })
    await openTablesIndex(page, locale)
  } else if (state === "TABLE-DETAIL") {
    await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", age: "AGE-VERIFIED", ageExpiresAt: "2099-08-20T20:30:00+09:00" } })
    await openTableDetail(page, locale)
  } else if (state === "TABLE-JOIN-FAIL") {
    await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", age: "AGE-VERIFIED", ageExpiresAt: "2099-08-20T20:30:00+09:00" } })
    await openTableDetail(page, locale)
    await page.getByTestId("table-join").click()
    await expect(page.getByTestId("table-join-confirmation")).toBeVisible()
    await installOneShotDeviceWriteFailure(page)
    await page.getByTestId("table-join-confirm").click()
    await expect(page.getByTestId("table-join-save-error")).toBeVisible()
  } else if (["CHAT", "CHAT-IMAGE-FAIL", "FEEDBACK", "REPORT"].includes(state)) {
    await openChat(page, locale, state === "CHAT-IMAGE-FAIL" ? "?scenario=media-failed" : "")
    if (state === "CHAT-IMAGE-FAIL") {
      await page.getByTestId("table-chat-image").setInputFiles({ name: "table-note.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") })
      await expect(page.getByTestId("table-chat-image-error")).toBeVisible()
    } else if (state === "FEEDBACK") {
      await page.getByTestId("table-check-in").click()
      await page.getByRole("button", { name: locale === "ko" ? "도움이 된 테이블" : "Helpful table", exact: true }).click()
      await page.getByTestId("table-feedback-submit").click()
      await expect(page.getByTestId("table-reputation-receipt")).toBeVisible()
    } else if (state === "REPORT") {
      await page.getByTestId("table-report").click()
      await expect(page.getByRole("alertdialog")).toBeVisible()
    }
  } else if (state === "LOCAL-SIGNAL-EMPTY" || state === "LOCAL-SIGNAL-FAIL" || state === "LOCAL-SIGNAL-SUCCESS") {
    // These states intentionally exercise the Person gate before returning to
    // the exact draft. Seeding legacy PER-VERIFIED would migrate a ready Person
    // axis and correctly bypass the gate, making the fixture timing-dependent.
    await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-UNVERIFIED" } })
    await openLocalSignal(page, "view=list")
    const signal = page.getByTestId("ondo-b-local-signal")
    if (state !== "LOCAL-SIGNAL-EMPTY") {
      await signal.locator("fieldset button").first().click()
      await signal.locator("textarea").fill(locale === "ko" ? "입구 옆 카운터에서 주문해요." : "Order at the counter beside the entrance.")
      await signal.getByTestId("local-signal-person-check").click()
      const gate = page.getByTestId("ondo-b-action-gate")
      await expect(gate).toHaveAttribute("data-active-gate", "person")
      // The successful gate transition intentionally unmounts this coordinator
      // in the same React commit. Schedule the semantic activation and return
      // before that commit so the visual-fixture setup does not retry a pointer
      // sequence against the already-completed, detached button; real pointer
      // behavior is covered by the Local Signal end-to-end journey.
      await page.evaluate(() => {
        window.setTimeout(() => document.querySelector<HTMLElement>("[data-testid='local-check-boundary-continue']")?.click(), 0)
      })
      await expect(gate).toHaveCount(0)
      await expect(signal.getByTestId("local-signal-draft")).toHaveAttribute("data-gate-return", "success")
      if (state === "LOCAL-SIGNAL-FAIL") {
        await installOneShotDeviceWriteFailure(page)
        await signal.getByTestId("local-signal-post").click()
        await expect(signal.getByTestId("local-signal-post-error")).toBeVisible()
      }
    } else {
      await expect(signal.getByTestId("local-signal-person-check")).toBeDisabled()
    }
  } else if (state.startsWith("CHECKOUT-")) {
    if (state === "CHECKOUT-FAIL") await page.addInitScript(() => {
      const target = window as Window & { __ONDO_B_QA__?: Record<string, unknown> }
      target.__ONDO_B_QA__ = { ...(target.__ONDO_B_QA__ ?? {}), payment: "failure" }
    })
    await openCheckout(page, locale, state === "CHECKOUT-FAIL" ? "scenario=payment-declined" : "")
    if (state !== "CHECKOUT-IDLE") {
      if (state === "CHECKOUT-CANCEL") {
        await page.getByTestId("payment-cancel").click()
        await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
      }
      else {
        await completeCommercePayment(page, locale)
        await expect(page.getByTestId(state === "CHECKOUT-FAIL" ? "payment-recovery" : "payment-receipt")).toBeVisible()
      }
    }
  } else if (state === "MY") {
    await seedB(page, { locale, local: { savedVenueIds: [CANONICAL_VENUE_ID] }, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", stamps: 10 } })
    await extendBDeviceSeed(page, {
      savedVenueIds: [CANONICAL_VENUE_ID],
      plannedTableRefs: [{ tableId: CURRENT_TABLE_ID, venueId: CANONICAL_VENUE_ID }],
    })
    await gotoB(page)
    await page.getByRole("navigation").locator("button").nth(1).click()
    await expect(page.getByTestId("ondo-b-my-korea-entry")).toBeVisible()
  } else if (state === "SESSION-RESET-CONFIRM") {
    await seedB(page, {
      locale,
      local: { savedVenueIds: [CANONICAL_VENUE_ID], discoveryPreferences: ["vegan", "late"] },
      session: {
        persona: "long_term_resident",
        account: "ACC-ACTIVE",
        person: "PER-VERIFIED",
        age: "AGE-VERIFIED",
        ageExpiresAt: "2027-08-19T20:30:00+09:00",
        paymentKyc: "PKY-VERIFIED",
        after19: "A19-MANUAL-OFF",
        stamps: 10,
      },
    })
    await gotoB(page)
    await page.getByTestId("nav-settings").click()
    const disclosure = page.getByTestId("ondo-b-device-data-settings")
    await disclosure.evaluate((element: HTMLDetailsElement) => { element.open = true })
    const opener = page.getByTestId("ondo-b-clear-device-open")
    await opener.scrollIntoViewIfNeeded()
    await opener.click()
    const confirm = page.getByTestId("ondo-b-clear-device-confirm")
    await expect(confirm).toBeVisible()
    await expect(confirm.getByRole("button").first()).toBeFocused()
  } else if (state === "DISCOVERY-RESET-CONFIRM") {
    await seedB(page, {
      locale,
      local: { savedVenueIds: [CANONICAL_VENUE_ID], discoveryPreferences: ["vegan", "late"] },
      session: { persona: "long_term_resident", account: "ACC-ACTIVE", person: "PER-VERIFIED" },
    })
    await gotoB(page)
    await page.getByTestId("nav-settings").click()
    const disclosure = page.getByTestId("ondo-b-discovery-settings")
    await disclosure.evaluate((element: HTMLDetailsElement) => { element.open = true })
    const opener = page.getByTestId("ondo-b-onboarding-reset")
    await opener.scrollIntoViewIfNeeded()
    await expect(opener).toBeVisible()
    await opener.focus()
  } else if (state === "PROFILE" || state === "TRUST-FOUR-AXES") {
    await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", reputation: { identity: "verified", visit: "repeat", contribution: "established", meetup: "reliable" } } })
    await gotoB(page)
    await page.getByRole("navigation").locator("button").nth(3).click()
    const target = page.getByTestId(state === "PROFILE" ? "ondo-b-traveler-id" : "travel-pass-status")
    if (state !== "TRUST-FOUR-AXES") await target.scrollIntoViewIfNeeded()
  } else {
    const query = state === "LABS-TRAIT-FAIL"
      ? "?qa=1&scenario=trait-retry-fail"
      : state === "LABS-BRIDGE-FAIL"
        ? "?qa=1&scenario=bridge-failed"
        : state === "LABS-BRIDGE-SUCCESS"
          ? "?qa=1"
          : ""
    await openPreparedLabs(page, locale, query)
    if (state !== "LABS") {
      const acknowledge = page.getByTestId("labs-acknowledge")
      if (await acknowledge.isVisible().catch(() => false)) await acknowledge.click()
      await expect(page.getByTestId("labs-overlay")).toBeVisible()
    }
    if (state === "LABS-TRAIT-FAIL") {
      await page.getByTestId("trait-retry-seongsu-card").scrollIntoViewIfNeeded()
      await page.getByTestId("trait-retry-seongsu-card").click()
      await expect(page.locator("[data-trait-state='failed']").first()).toBeVisible()
    } else if (state === "LABS-BRIDGE-FAIL" || state === "LABS-BRIDGE-SUCCESS") {
      await page.getByTestId("labs-connect-wallet").click()
      await expect(page.getByTestId("labs-overlay")).toHaveAttribute("data-wallet-state", "WAL-READY")
      await page.getByTestId("labs-bridge-quote").click()
      await page.getByTestId("labs-bridge-confirm").click()
      await page.getByTestId("labs-bridge-submit").click()
      const advances = state === "LABS-BRIDGE-FAIL" ? 2 : 3
      for (let index = 0; index < advances; index += 1) await page.getByTestId("labs-bridge-advance").click()
      const labs = page.getByTestId("labs-overlay")
      await expect(labs).toHaveAttribute("data-bridge-state", state === "LABS-BRIDGE-FAIL" ? "BRG-FAILED" : "BRG-SIMULATED-SUCCESS")
      await expect(labs).toHaveAttribute("data-bridge-phase", state === "LABS-BRIDGE-FAIL" ? "source_confirmed" : "destination_confirmed")
      await stabilizeMobileEvidenceScroll(page, page.getByTestId(state === "LABS-BRIDGE-FAIL" ? "labs-bridge-quote" : "labs-bridge-receipt"), { kind: "scrollTop", value: 657, desktopValue: 593 })
    }
  }

  await settle(page)
  if (state === "CITY-FILTERED-MAP") {
    await expect(page.getByTestId("ondo-b-result-bar")).toContainText(locale === "ko" ? "공식 기록 1개" : "1 official record")
  }
  if (state === "LABS-TRAIT-FAIL") {
    const targetNetwork = locale === "ko"
      ? "대상 네트워크: Sui Testnet · 시뮬레이션"
      : locale === "ja"
        ? "対象ネットワーク：Sui Testnet · シミュレーション"
        : "Target network: Sui Testnet · Simulated"
    await expect(page.getByTestId("labs-overlay").getByText(targetNetwork, { exact: true })).toHaveCount(1)
  }
  if (state === "TRUST-FOUR-AXES") {
    const target = page.getByTestId("travel-pass-status")
    const expectedScrollTop = await target.evaluate((element) => {
      let scroller = element.parentElement
      while (scroller) {
        const overflowY = getComputedStyle(scroller).overflowY
        if (["auto", "scroll"].includes(overflowY) && scroller.scrollHeight > scroller.clientHeight) break
        scroller = scroller.parentElement
      }
      if (!scroller) throw new Error("Trust evidence scroll container was not found")
      scroller.scrollTop = scroller.scrollHeight
      scroller.dataset.evidenceScrollTop = String(scroller.scrollTop)
      return scroller.scrollTop
    })
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
    await expect(target).toBeVisible()
    await expect.poll(() => target.evaluate((element) => {
      let scroller = element.parentElement
      while (scroller) {
        const overflowY = getComputedStyle(scroller).overflowY
        if (["auto", "scroll"].includes(overflowY) && scroller.scrollHeight > scroller.clientHeight) return scroller.scrollTop
        scroller = scroller.parentElement
      }
      return -1
    })).toBe(expectedScrollTop)
  }
  return page.getByTestId("ondo-b-root")
}

export async function collectBGeometryIssues(page: Page) {
  return page.getByTestId("ondo-b-root").evaluate((root) => {
    type RectLike = Pick<DOMRect, "bottom" | "height" | "left" | "right" | "top" | "width" | "x" | "y">
    const viewport = { width: window.innerWidth, height: window.innerHeight }
    const rootRect = root.getBoundingClientRect()
    const visibleRect = (rect: RectLike) => rect.bottom > 0 && rect.right > 0 && rect.top < viewport.height && rect.left < viewport.width
    const clipToOverflowAncestors = (element: HTMLElement, initial: DOMRect) => {
      let left = Math.max(0, initial.left)
      let right = Math.min(viewport.width, initial.right)
      let top = Math.max(0, initial.top)
      let bottom = Math.min(viewport.height, initial.bottom)
      let ancestor = element.parentElement
      while (ancestor && root.contains(ancestor)) {
        const style = getComputedStyle(ancestor)
        const clipsX = [style.overflow, style.overflowX].some((value) => ["auto", "clip", "hidden", "scroll"].includes(value))
        const clipsY = [style.overflow, style.overflowY].some((value) => ["auto", "clip", "hidden", "scroll"].includes(value))
        if (clipsX || clipsY) {
          const boundary = ancestor.getBoundingClientRect()
          if (clipsX) { left = Math.max(left, boundary.left); right = Math.min(right, boundary.right) }
          if (clipsY) { top = Math.max(top, boundary.top); bottom = Math.min(bottom, boundary.bottom) }
        }
        ancestor = ancestor.parentElement
      }
      return { x: left, y: top, left, right, top, bottom, width: Math.max(0, right - left), height: Math.max(0, bottom - top) }
    }
    const fullyInViewport = (rect: RectLike) => rect.top >= 0 && rect.left >= 0 && rect.bottom <= viewport.height && rect.right <= viewport.width
    const intersects = (first: RectLike, second: RectLike) => Math.min(first.right, second.right) - Math.max(first.left, second.left) > 2
      && Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top) > 2
    const hitTestable = (element: HTMLElement, rect: RectLike) => {
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
    const accessibleName = (element: HTMLElement) => {
      const labelledBy = element.getAttribute("aria-labelledby")?.split(/\s+/).map((id) => document.getElementById(id)?.textContent?.trim() ?? "").join(" ").trim()
      const wrappingLabel = element.closest("label")?.textContent?.trim()
      const associatedLabels = element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement
        ? Array.from(element.labels ?? []).map((labelElement) => labelElement.textContent?.trim() ?? "").join(" ").trim()
        : ""
      return (element.getAttribute("aria-label") ?? labelledBy ?? wrappingLabel ?? (associatedLabels || undefined) ?? element.textContent?.trim() ?? element.getAttribute("title") ?? "").replace(/\s+/g, " ").trim()
    }
    const explicitDialogName = (element: HTMLElement) => {
      const labelledBy = element.getAttribute("aria-labelledby")?.split(/\s+/).map((id) => document.getElementById(id)?.textContent?.trim() ?? "").join(" ").trim()
      return (element.getAttribute("aria-label") ?? labelledBy ?? "").replace(/\s+/g, " ").trim()
    }
    const allControls = Array.from(root.querySelectorAll<HTMLElement>("button:not([disabled]),a[href],input:not([type='hidden']):not([disabled]),select:not([disabled]),textarea:not([disabled]),[role='button']"))
      .map((element) => {
        const rawRect = element.getBoundingClientRect()
        return { element, rawRect, rect: clipToOverflowAncestors(element, rawRect) }
      })
      .filter(({ element, rect }) => {
        const style = getComputedStyle(element)
        return rect.width > 0 && rect.height > 0 && visibleRect(rect) && style.display !== "none" && style.visibility !== "hidden" && Number.parseFloat(style.opacity) > 0 && element.getAttribute("aria-hidden") !== "true" && element.tabIndex >= 0
      })
    const controls = allControls.filter(({ element, rect }) => hitTestable(element, rect))
    const clippedControls = controls.flatMap(({ element, rect }) => (
      rect.left < rootRect.left - 1 || rect.right > rootRect.right + 1 || rect.top < rootRect.top - 1 || rect.bottom > rootRect.bottom + 1
        ? [{ control: label(element), rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) } }]
        : []
    ))
    const undersizedControls = controls.flatMap(({ element, rawRect, rect }) => {
      // A row partially entering or leaving its own scroll viewport is not a
      // reduced target; its full box becomes available by continuing to scroll.
      // Exit controls are checked separately against their un-clipped box.
      if (rect.width < rawRect.width - 1 || rect.height < rawRect.height - 1) return []
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
        if (intersects(a.rect, b.rect)) overlaps.push({ first: label(a.element), second: label(b.element) })
      }
    }
    const bottomNav = Array.from(root.querySelectorAll<HTMLElement>("nav")).find((element) => ["Main navigation", "주요 메뉴"].includes(element.getAttribute("aria-label") ?? ""))
    // Only compare controls that are actually on top at their center point. A
    // full-screen modal legitimately leaves the nav mounted underneath its
    // backdrop; counting those covered nodes would be a geometry false positive.
    const bottomNavControls = bottomNav ? controls.filter(({ element }) => bottomNav.contains(element)) : []
    const bottomNavOverlaps = bottomNavControls.flatMap((navControl) => controls
      .filter(({ element }) => !bottomNav?.contains(element))
      .flatMap((other) => intersects(navControl.rect, other.rect) ? [{ navigation: label(navControl.element), content: label(other.element) }] : []))
    const exitPattern = /close|back|return|cancel|stay|keep|not now|dismiss|닫|뒤로|돌아|취소|머물|유지|나중/i
    const allVisibleDialogs = Array.from(root.querySelectorAll<HTMLElement>("[role='dialog'],[role='alertdialog']"))
      .map((element) => ({ element, rect: element.getBoundingClientRect() }))
      .filter(({ element, rect }) => {
        const style = getComputedStyle(element)
        return rect.width > 0 && rect.height > 0 && visibleRect(rect) && style.display !== "none" && style.visibility !== "hidden"
      })
    const visibleDialogs = allVisibleDialogs.filter(({ element }) => controls.some(({ element: control }) => element.contains(control)))
    const exposedModals = allVisibleDialogs.filter(({ element }) => element.getAttribute("aria-modal") === "true" && element.getAttribute("aria-hidden") !== "true" && !element.hasAttribute("inert"))
    const modalIsolationIssues = exposedModals.flatMap(({ element: modal }) => allControls
      .filter(({ element }) => !modal.contains(element))
      .flatMap(({ element }) => {
        let ancestor: HTMLElement | null = element
        while (ancestor && root.contains(ancestor)) {
          if (ancestor.hasAttribute("inert") && ancestor.getAttribute("aria-hidden") === "true") return []
          ancestor = ancestor.parentElement
        }
        return [{ modal: label(modal), control: label(element), issue: "outside control has no inert + aria-hidden ancestor" }]
      }))
    const modalStackIssues = [
      ...(exposedModals.length > 1 ? [{ issue: `multiple exposed modal dialogs: ${exposedModals.map(({ element }) => label(element)).join(" | ")}` }] : []),
      ...allVisibleDialogs.flatMap(({ element }) => {
        const hidden = element.getAttribute("aria-hidden") === "true"
        const inert = element.hasAttribute("inert")
        if (hidden === inert) return []
        return [{ issue: `${label(element)} must pair inert with aria-hidden while covered` }]
      }),
    ]
    const exitCtaIssues = visibleDialogs.flatMap(({ element }) => {
      const candidates = controls.filter(({ element: control }) => element.contains(control) && (control.hasAttribute("data-dialog-exit") || exitPattern.test(accessibleName(control))))
      if (!candidates.length) return [{ dialog: label(element), issue: "no visible, hit-testable exit CTA" }]
      // A long sheet may legitimately have secondary return/cancel actions
      // farther down its scroll viewport. The invariant is that at least one
      // genuine exit remains visible and hit-testable at every scroll offset.
      if (candidates.some(({ rawRect }) => fullyInViewport(rawRect))) return []
      return [{ dialog: label(element), issue: "no exit CTA is fully inside the viewport" }]
    })
    const ariaIssues = [
      ...visibleDialogs.flatMap(({ element }) => explicitDialogName(element) ? [] : [{ element: label(element), issue: "dialog has no aria-label or valid aria-labelledby" }]),
      ...controls.flatMap(({ element }) => accessibleName(element) ? [] : [{ element: label(element), issue: "interactive control has no accessible name" }]),
    ]
    const metadata = Array.from(root.querySelectorAll<HTMLElement>("small,time,code,dt,dd,figcaption"))
      .map((element) => ({ element, rect: element.getBoundingClientRect(), fontSize: Number.parseFloat(getComputedStyle(element).fontSize) }))
      .filter(({ element, rect }) => element.textContent?.trim() && rect.width > 0 && rect.height > 0 && visibleRect(rect))
      .flatMap(({ element, fontSize }) => fontSize < 12 ? [{ text: label(element), fontSize }] : [])
    return {
      rootOverflowX: Math.max(0, root.scrollWidth - root.clientWidth),
      clippedControls,
      ariaIssues,
      bottomNavOverlaps,
      exitCtaIssues,
      modalStackIssues,
      modalIsolationIssues,
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
  expect.soft(geometry.bottomNavOverlaps, "bottom navigation controls overlap another visible control").toEqual([])
  expect.soft(geometry.exitCtaIssues, "every active dialog keeps an exit CTA inside the viewport").toEqual([])
  expect.soft(geometry.modalStackIssues, "only one modal is exposed and every covered dialog is inert plus aria-hidden").toEqual([])
  expect.soft(geometry.modalIsolationIssues, "every control outside the active modal is covered by inert plus aria-hidden").toEqual([])
  expect.soft(geometry.ariaIssues, "visible dialogs and controls have programmatic names").toEqual([])
  expect.soft(geometry.undersizedControls, "hit-testable controls below 44×44 CSS px").toEqual([])
  expect.soft(geometry.metadata, "visible metadata below 12 CSS px").toEqual([])
  expect.soft(geometry.overlaps, "independent hit-testable controls overlap").toEqual([])

  const axe = await new AxeBuilder({ page }).include(await scope.evaluate((node) => {
    if (!node.id) node.id = `ondo-b-evidence-${Math.random().toString(36).slice(2)}`
    return `#${CSS.escape(node.id)}`
  })).analyze()
  const contrast = axe.violations.filter((violation) => violation.id === "color-contrast")
  const aria = axe.violations.filter((violation) => violation.id.startsWith("aria-") || ["button-name", "dialog-name", "label", "link-name"].includes(violation.id))
  const actionable = axe.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")
  await testInfo.attach("axe.json", { body: JSON.stringify(axe, null, 2), contentType: "application/json" })
  expect.soft(contrast, "axe color-contrast violations").toEqual([])
  expect.soft(aria, "axe ARIA/name/label violations").toEqual([])
  expect.soft(actionable, "serious/critical axe violations").toEqual([])
}

export async function stabilizeBVisualSnapshot(page: Page, item: BVisualCase) {
  if (["CHAT", "CHAT-IMAGE-FAIL", "FEEDBACK", "REPORT"].includes(item.state)) {
    // File selection, focus restoration, and feedback submission can each
    // auto-scroll the Table sheet by a different amount. Pin the chat surface
    // below the sticky detail header so serial and isolated pixel runs capture
    // the same intentional state instead of inheriting incidental focus scroll.
    const chat = page.getByTestId("table-chat")
    if ((page.viewportSize()?.width ?? 0) <= 801) {
      await stabilizeMobileEvidenceScroll(page, chat, { kind: "top", offset: 80 })
    } else if (item.state === "FEEDBACK") {
      await stabilizeMobileEvidenceScroll(page, chat, { kind: "scrollTop", value: 0 })
    } else if (item.state === "REPORT") {
      // The report confirmation is ten pixels taller than the desktop sheet's
      // visible content area. Reveal its complete final row intentionally.
      await stabilizeMobileEvidenceScroll(page, chat, { kind: "scrollTop", value: 10 })
    }
  }
  if (item.state.startsWith("LOCAL-SIGNAL")) {
    const foreground = item.state === "LOCAL-SIGNAL-FAIL"
      ? page.getByTestId("local-signal-post-error")
      : page.getByTestId("ondo-b-local-signal").locator("h2").first()
    await expect(foreground).toBeVisible()

    // Chromium can occasionally return a compositor frame containing the
    // Sheet surface and grabber while dropping the scroll viewport's
    // foreground. DOM visibility and geometry remain correct in that frame,
    // so they cannot keep an empty pixel baseline from being approved. Probe
    // the title pixels in a full viewport capture; locator screenshots can
    // themselves trigger the blank follow-up frame that this guard rejects.
    const titleBox = await foreground.boundingBox()
    expect(titleBox, `${item.id} foreground receipt has no painted bounding box`).not.toBeNull()
    await expect.poll(async () => {
      await settle(page)
      const viewport = page.viewportSize()
      const frame = await page.screenshot({ animations: "disabled", caret: "hide", fullPage: false, scale: "css" })
      return page.evaluate(async ({ box, dataUrl, viewportSize }) => {
        const image = new Image()
        image.src = dataUrl
        await image.decode()
        const canvas = document.createElement("canvas")
        const scaleX = image.naturalWidth / viewportSize.width
        const scaleY = image.naturalHeight / viewportSize.height
        canvas.width = Math.max(1, Math.round(box.width * scaleX))
        canvas.height = Math.max(1, Math.round(box.height * scaleY))
        const context = canvas.getContext("2d", { willReadFrequently: true })
        if (!context) return 0
        context.drawImage(
          image,
          Math.round(box.x * scaleX),
          Math.round(box.y * scaleY),
          canvas.width,
          canvas.height,
          0,
          0,
          canvas.width,
          canvas.height,
        )
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
        let darkPixels = 0
        for (let offset = 0; offset < pixels.length; offset += 4) {
          if (pixels[offset + 3] > 0 && pixels[offset] + pixels[offset + 1] + pixels[offset + 2] < 660) darkPixels += 1
        }
        return darkPixels
      }, {
        box: titleBox!,
        dataUrl: `data:image/png;base64,${frame.toString("base64")}`,
        viewportSize: viewport!,
      })
    }, {
      message: `${item.id} full viewport title crop has no foreground pixels; wait for a painted compositor frame`,
      timeout: 8_000,
      intervals: [50, 100, 250, 500],
    }).toBeGreaterThan(16)
  }
  if (item.state === "PROFILE") {
    await stabilizeMobileEvidenceScroll(page, page.getByTestId("ondo-b-traveler-id"), { kind: "bottom" })
  }
  // Labs now owns a full B-native surface instead of retaining the My Korea
  // milestone node underneath the modal. Its boundary is shorter than the
  // sheet viewport and therefore has no scroll container to normalize;
  // bridge and trait cases stabilize on their state-specific targets in setup.
}

export async function collectBMapPaintProbe(page: Page): Promise<BMapPaintProbe | null> {
  const mapEntry = page.getByTestId("ondo-b-map-entry")
  if (await mapEntry.count() === 0) return null
  return mapEntry.evaluate((root, { edgeBand, minimumExposedRatio }) => {
    const app = root.closest<HTMLElement>("[data-testid='ondo-b-root']") ?? root
    const viewport = { width: window.innerWidth, height: window.innerHeight }
    const canvas = root.querySelector<HTMLCanvasElement>("canvas.maplibregl-canvas")
    const mapKey = root.querySelector<HTMLElement>("[data-testid='ondo-b-map-key']")
    // The redesigned map exposes its curated marker source through the
    // current Pulse count and mirrors every intended marker into a hidden,
    // keyboard-readable list. The independent pixel receipt below still
    // proves those source records reached the MapLibre canvas.
    const renderedSignalCount = root.querySelectorAll("[data-testid='ondo-b-pulse-marker-accessible-detail'] li").length
    const signalSourceCount = Number(root.dataset.curatedPulseCount ?? 0)
    if (!canvas || !mapKey || root.dataset.mapState !== "ready" || signalSourceCount <= 0) return null

    const canvasStyle = getComputedStyle(canvas)
    const canvasRect = canvas.getBoundingClientRect()
    if (canvasStyle.display === "none" || canvasStyle.visibility === "hidden" || Number.parseFloat(canvasStyle.opacity) <= 0) return null
    const clippedCanvas = {
      left: Math.max(0, canvasRect.left),
      top: Math.max(0, canvasRect.top),
      right: Math.min(viewport.width, canvasRect.right),
      bottom: Math.min(viewport.height, canvasRect.bottom),
    }
    const canvasArea = Math.max(0, clippedCanvas.right - clippedCanvas.left) * Math.max(0, clippedCanvas.bottom - clippedCanvas.top)
    if (canvasArea === 0) return null

    const overlayNodes = new Set<HTMLElement>()
    for (const candidate of app.querySelectorAll<HTMLElement>("[role='dialog'],[role='alertdialog'],[data-testid='ondo-sheet']")) {
      // The canonical detail's role lives on its full-screen positioning
      // layer. Only its opaque article hides MapLibre pixels.
      if (candidate.dataset.testid === "canonical-place-overlay") {
        const article = candidate.querySelector<HTMLElement>(":scope > article")
        if (article) overlayNodes.add(article)
      } else overlayNodes.add(candidate)
    }
    // The legend contains a real heat-color swatch but is DOM chrome, not a
    // rendered MapLibre signal. It must never make a blank canvas look ready.
    const overlayBlockers = Array.from(overlayNodes).flatMap((element) => {
      const style = getComputedStyle(element)
      const rect = element.getBoundingClientRect()
      if (style.display === "none" || style.visibility === "hidden" || Number.parseFloat(style.opacity) <= 0) return []
      const clipped = {
        left: Math.max(clippedCanvas.left, rect.left),
        top: Math.max(clippedCanvas.top, rect.top),
        right: Math.min(clippedCanvas.right, rect.right),
        bottom: Math.min(clippedCanvas.bottom, rect.bottom),
      }
      return clipped.right > clipped.left && clipped.bottom > clipped.top ? [clipped] : []
    })
    const blockers = [...overlayBlockers, ...[mapKey].flatMap((element) => {
      const style = getComputedStyle(element)
      const rect = element.getBoundingClientRect()
      if (style.display === "none" || style.visibility === "hidden" || Number.parseFloat(style.opacity) <= 0) return []
      const clipped = {
        left: Math.max(clippedCanvas.left, rect.left),
        top: Math.max(clippedCanvas.top, rect.top),
        right: Math.min(clippedCanvas.right, rect.right),
        bottom: Math.min(clippedCanvas.bottom, rect.bottom),
      }
      return clipped.right > clipped.left && clipped.bottom > clipped.top ? [clipped] : []
    })]
    // Keep an explicit edge ROI available for future narrow overlays. The
    // current compact Place peek leaves enough canvas exposed for the stronger
    // full-canvas receipt, so no reviewed row depends on this fallback.
    const band = edgeBand
    const edgeReceiptRegions: BVisualRect[] = []
    for (const rect of overlayBlockers) {
      const regions = [
        { left: Math.max(clippedCanvas.left, rect.left - band), top: Math.max(clippedCanvas.top, rect.top - band), right: rect.left, bottom: Math.min(clippedCanvas.bottom, rect.bottom + band) },
        { left: rect.right, top: Math.max(clippedCanvas.top, rect.top - band), right: Math.min(clippedCanvas.right, rect.right + band), bottom: Math.min(clippedCanvas.bottom, rect.bottom + band) },
        { left: rect.left, top: Math.max(clippedCanvas.top, rect.top - band), right: rect.right, bottom: rect.top },
        { left: rect.left, top: rect.bottom, right: rect.right, bottom: Math.min(clippedCanvas.bottom, rect.bottom + band) },
      ]
      for (const region of regions) {
        if (region.right > region.left && region.bottom > region.top) edgeReceiptRegions.push(region)
      }
    }

    // A ready MapLibre instance may remain mounted under a full-height detail
    // or another tab. Treat it as screenshot chrome unless enough of the
    // canvas is actually exposed for signal paint to be part of the contract.
    const step = 8
    let exposedSamples = 0
    let totalSamples = 0
    for (let y = clippedCanvas.top + step / 2; y < clippedCanvas.bottom; y += step) {
      for (let x = clippedCanvas.left + step / 2; x < clippedCanvas.right; x += step) {
        totalSamples += 1
        if (!blockers.some((rect) => x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom)) exposedSamples += 1
      }
    }
    const exposedRatio = totalSamples ? exposedSamples / totalSamples : 0
    if (exposedRatio < minimumExposedRatio) return null
    return { blockers, canvas: clippedCanvas, edgeReceiptRegions, exposedRatio, renderedSignalCount, signalSourceCount }
  }, { edgeBand: B_MAP_PAINT_EDGE_BAND_CSS_PIXELS, minimumExposedRatio: B_MAP_PAINT_MIN_EXPOSED_RATIO })
}

type BMapPaintReceiptMode = "canvas" | "overlay-edge"

type BMapRecoveryInvariant = {
  canvas: {
    backingHeight: number
    backingWidth: number
    rect: BVisualRect
  }
  location: string
  locationState: string
  mapAttempt: string
  mapState: string
  curatedPulseCount: string
  pulseMapGrammar: string
  pulseVisualGrammar: string
  resultCount: string
  selectedVenueId: string
  storage: {
    local: [string, string][]
    session: [string, string][]
  }
  userLocation: string
  viewport: { height: number; width: number }
}

async function collectBMapRecoveryInvariant(page: Page): Promise<BMapRecoveryInvariant> {
  return page.getByTestId("ondo-b-map-entry").evaluate((root) => {
    const canvas = root.querySelector<HTMLCanvasElement>("canvas.maplibregl-canvas")
    if (!canvas) throw new Error("MapLibre canvas is missing during paint recovery")
    const rect = canvas.getBoundingClientRect()
    const storageEntries = (storage: Storage) => Array.from({ length: storage.length }, (_, index) => storage.key(index))
      .filter((key): key is string => key != null)
      .sort()
      .map((key) => [key, storage.getItem(key) ?? ""] as [string, string])
    return {
      canvas: {
        backingHeight: canvas.height,
        backingWidth: canvas.width,
        rect: { bottom: rect.bottom, left: rect.left, right: rect.right, top: rect.top },
      },
      location: window.location.href,
      locationState: root.dataset.locationState ?? "",
      mapAttempt: root.dataset.mapAttempt ?? "",
      mapState: root.dataset.mapState ?? "",
      curatedPulseCount: root.dataset.curatedPulseCount ?? "",
      pulseMapGrammar: root.dataset.pulseMapGrammar ?? "",
      pulseVisualGrammar: root.dataset.pulseVisualGrammar ?? "",
      resultCount: root.dataset.resultCount ?? "",
      selectedVenueId: root.dataset.selectedVenueId ?? "",
      storage: {
        local: storageEntries(localStorage),
        session: storageEntries(sessionStorage),
      },
      userLocation: root.dataset.userLocation ?? "",
      viewport: { height: window.innerHeight, width: window.innerWidth },
    }
  })
}

async function requestBMapPaintRecovery(page: Page) {
  // MapLibre 5 tracks element size with ResizeObserver rather than a window
  // resize listener. Its existing online listener calls _update(), which marks
  // intercepted deterministic sources dirty and schedules a fresh render.
  // Before/after invariants below prove that the re-evaluation keeps URL,
  // persisted app state, layer receipt, camera tier, and geometry untouched.
  await page.evaluate(async () => {
    window.dispatchEvent(new Event("online"))
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  })
}

export async function countBMapPaintPixels(page: Page, frame: Buffer, probe: BMapPaintProbe, minimumComponentPixels = B_MAP_PAINT_MIN_COMPONENT_PIXELS, receiptMode: BMapPaintReceiptMode = "canvas") {
  const viewport = page.viewportSize()
  if (!viewport) return 0
  return page.evaluate(async ({ dataUrl, evidence, minimumComponentPixels, receiptMode, viewportSize }) => {
    const image = new Image()
    image.src = dataUrl
    await image.decode()
    const canvas = document.createElement("canvas")
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const context = canvas.getContext("2d", { willReadFrequently: true })
    if (!context) return 0
    context.drawImage(image, 0, 0)
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    const scaleX = canvas.width / viewportSize.width
    const scaleY = canvas.height / viewportSize.height
    const left = Math.max(0, Math.floor(evidence.canvas.left * scaleX))
    const right = Math.min(canvas.width, Math.ceil(evidence.canvas.right * scaleX))
    const top = Math.max(0, Math.floor(evidence.canvas.top * scaleY))
    const bottom = Math.min(canvas.height, Math.ceil(evidence.canvas.bottom * scaleY))
    const receiptRegions = receiptMode === "overlay-edge" ? evidence.edgeReceiptRegions : [evidence.canvas]
    const candidates = new Set<number>()
    const coreCandidates = new Set<number>()
    for (let y = top; y < bottom; y += 1) {
      const cssY = (y + 0.5) / scaleY
      for (let x = left; x < right; x += 1) {
        const cssX = (x + 0.5) / scaleX
        if (!receiptRegions.some((rect) => cssX >= rect.left && cssX < rect.right && cssY >= rect.top && cssY < rect.bottom)) continue
        if (evidence.blockers.some((rect) => cssX >= rect.left && cssX < rect.right && cssY >= rect.top && cssY < rect.bottom)) continue
        const offset = (y * canvas.width + x) * 4
        const red = pixels[offset]
        const green = pixels[offset + 1]
        const blue = pixels[offset + 2]
        const peak = red >= 70 && red <= 130 && green >= 30 && green <= 75 && blue >= 50 && blue <= 100
        const hot = red >= 185 && red <= 225 && green >= 45 && green <= 105 && blue >= 35 && blue <= 90
        const rising = red >= 195 && red <= 245 && green >= 105 && green <= 160 && blue >= 40 && blue <= 90
        const warming = red >= 200 && red <= 250 && green >= 165 && green <= 220 && blue >= 70 && blue <= 165
        const core = peak || hot || rising || warming
        // The current Pulse grammar deliberately couples a small saturated
        // point with a much larger translucent aura. Count the aura only when
        // it is physically connected to a qualifying saturated core; a warm
        // basemap or other pale canvas color can never satisfy the receipt on
        // its own.
        const aura = red >= 230 && red <= 252
          && green >= 195 && green <= 240
          && blue >= 185 && blue <= 232
          && red - green >= 10
          && green - blue >= 3
          && green - blue <= 12
        if (core || aura) {
          const candidate = y * canvas.width + x
          candidates.add(candidate)
          if (core) coreCandidates.add(candidate)
        }
      }
    }
    let markerPixels = 0
    while (candidates.size) {
      const first = candidates.values().next().value as number
      candidates.delete(first)
      const stack = [first]
      let componentPixels = 0
      let componentCorePixels = 0
      while (stack.length) {
        const current = stack.pop()!
        componentPixels += 1
        if (coreCandidates.has(current)) componentCorePixels += 1
        const x = current % canvas.width
        const y = Math.floor(current / canvas.width)
        for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
          for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
            if (offsetX === 0 && offsetY === 0) continue
            const nextX = x + offsetX
            const nextY = y + offsetY
            if (nextX < left || nextX >= right || nextY < top || nextY >= bottom) continue
            const next = nextY * canvas.width + nextX
            if (candidates.delete(next)) stack.push(next)
          }
        }
      }
      if (componentCorePixels >= minimumComponentPixels) markerPixels += componentPixels
    }
    return markerPixels
  }, {
    dataUrl: `data:image/png;base64,${frame.toString("base64")}`,
    evidence: probe,
    minimumComponentPixels,
    receiptMode,
    viewportSize: viewport,
  })
}

export async function expectBVisualSnapshot(page: Page, item: BVisualCase, viewport: BSleekViewportId, testInfo: TestInfo) {
  if (process.env.ONDO_B_VISUAL_PREFLIGHT === "1") return
  const screenshotOptions = {
    animations: "disabled" as const,
    caret: "hide" as const,
    fullPage: false,
  }
  const initialProbe = await collectBMapPaintProbe(page)
  const receiptKey = `${item.id}:${viewport}`
  const maxDiffPixels = item.id === "B-PX-CITY-FILTERED-MAP-EN" || item.id === "B-PX-LABS-TRAIT-FAIL-KO" ? 0 : 32
  const canvasReceiptRequired = B_MAP_PAINT_CANVAS_RECEIPTS.includes(receiptKey as (typeof B_MAP_PAINT_CANVAS_RECEIPTS)[number])
  const edgeReceiptRequired = B_MAP_PAINT_EDGE_RECEIPTS.includes(receiptKey as (typeof B_MAP_PAINT_EDGE_RECEIPTS)[number])
  if (!canvasReceiptRequired && !edgeReceiptRequired) {
    await expect(page).toHaveScreenshot(bSnapshotName(item, viewport), { ...screenshotOptions, maxDiffPixels })
    return
  }
  expect(canvasReceiptRequired && edgeReceiptRequired, `${receiptKey} has conflicting MapLibre paint receipt modes`).toBe(false)
  expect(initialProbe, `${receiptKey} is missing its required MapLibre paint probe`).not.toBeNull()
  const thresholdConfig = edgeReceiptRequired
    ? {
        minimumComponentPixels: B_MAP_PAINT_EDGE_MIN_COMPONENT_PIXELS,
        minimumHeatPixels: B_MAP_PAINT_EDGE_MIN_HEAT_PIXELS,
        mode: "overlay-edge" as const,
      }
    : {
        minimumComponentPixels: B_MAP_PAINT_MIN_COMPONENT_PIXELS,
        minimumHeatPixels: B_MAP_PAINT_MIN_HEAT_PIXELS,
        mode: "canvas" as const,
      }

  // Chromium can occasionally composite the MapLibre canvas after its DOM,
  // controls, sources, and queryRenderedFeatures state are ready but before
  // the WebGL marker layers are painted. A blank frame is not valid evidence
  // and must never replace the reviewed map baseline. Capture the exact frame
  // used by the matcher only after the heat-marker colors are present.
  let paintedFrame: Buffer | undefined
  let heatPixels = 0
  let acceptedProbe = initialProbe!
  let recoveryAttempts = 0
  let lastHeatPixels = 0
  let lastProbe = initialProbe!
  let lastSnapshotMismatch: string | null = null
  let invariantBefore: BMapRecoveryInvariant | null = null
  let invariantAfter: BMapRecoveryInvariant | null = null
  let expectedCanvasHeatPixels = 0
  let expectedEdgeHeatPixels = 0
  const updatingReviewedSnapshot = testInfo.config.updateSnapshots === "all" || testInfo.config.updateSnapshots === "changed"
  let threshold: {
    expectedHeatPixels: number
    minimumComponentPixels: number
    minimumHeatPixels: number
    mode: BMapPaintReceiptMode
  } | null = null
  try {
    const expectedFrame = await readFile(testInfo.snapshotPath(bSnapshotName(item, viewport)))
    expectedCanvasHeatPixels = await countBMapPaintPixels(page, expectedFrame, initialProbe!)
    expectedEdgeHeatPixels = edgeReceiptRequired
      ? await countBMapPaintPixels(page, expectedFrame, initialProbe!, B_MAP_PAINT_EDGE_MIN_COMPONENT_PIXELS, "overlay-edge")
      : 0
    threshold = {
      ...thresholdConfig,
      expectedHeatPixels: edgeReceiptRequired ? expectedEdgeHeatPixels : expectedCanvasHeatPixels,
    }
    if (!updatingReviewedSnapshot) {
      expect(
        threshold.expectedHeatPixels,
        `${item.id}:${viewport} reviewed baseline has no required ${threshold.mode} MapLibre paint receipt`,
      ).toBeGreaterThan(threshold.minimumHeatPixels)
    }

    // Seal the state-neutral comparison only after product readiness becomes
    // true without harness stimulus. A zero query-rendered count is never
    // eligible for the synthetic online repaint path below.
    await expect.poll(async () => {
      const probe = await collectBMapPaintProbe(page)
      if (probe) lastProbe = probe
      return probe?.renderedSignalCount ?? 0
    }, {
      message: `${item.id} MapLibre query-rendered receipt did not become ready without recovery stimulus`,
      timeout: 8_000,
      intervals: [50, 100, 250, 500],
    }).toBeGreaterThan(0)
    invariantBefore = await collectBMapRecoveryInvariant(page)

    for (;;) {
      await settle(page)
      const probe = await collectBMapPaintProbe(page)
      if (!probe) throw new Error(`${item.id}:${viewport} lost its required MapLibre paint probe`)
      lastProbe = probe
      if (probe.renderedSignalCount <= 0) {
        // Query-rendered count is a layer/readiness contract, not a compositor
        // symptom. Never let the screenshot harness stimulate a product state
        // that has not become ready on its own.
        throw new Error(`${item.id}:${viewport} lost its query-rendered readiness receipt`)
      }
      const frame = await page.screenshot({ ...screenshotOptions, scale: "css" })
      const count = await countBMapPaintPixels(page, frame, probe, thresholdConfig.minimumComponentPixels, thresholdConfig.mode)
      lastHeatPixels = count
      if (count > thresholdConfig.minimumHeatPixels) {
        try {
          // The accepted Buffer itself must match the reviewed camera frame;
          // no later screenshot is substituted for this evidence frame.
          expect(frame).toMatchSnapshot(bSnapshotName(item, viewport), { maxDiffPixels })
          paintedFrame = frame
          heatPixels = count
          acceptedProbe = probe
          break
        } catch (error) {
          lastSnapshotMismatch = error instanceof Error ? error.message : String(error)
          // A painted frame is not the blank-compositor failure proven safe
          // by the recovery experiment. Never let source re-evaluation or
          // extra time turn an arbitrary pixel regression into a later pass.
          throw new Error(`${item.id}:${viewport} painted frame differs from its reviewed baseline. ${lastSnapshotMismatch}`)
        }
      } else {
        lastSnapshotMismatch = `paint receipt ${count} did not exceed ${thresholdConfig.minimumHeatPixels}`
      }
      if (recoveryAttempts >= B_MAP_PAINT_MAX_RECOVERY_ATTEMPTS) {
        throw new Error(`${item.id}:${viewport} exhausted ${B_MAP_PAINT_MAX_RECOVERY_ATTEMPTS} state-neutral repaint attempts. Last result: ${lastSnapshotMismatch}`)
      }
      recoveryAttempts += 1
      await requestBMapPaintRecovery(page)
    }
  } catch (error) {
    const invariantAtFailure = await collectBMapRecoveryInvariant(page).catch(() => null)
    await testInfo.attach("map-paint-failure.json", {
      body: JSON.stringify({
        caseId: item.id,
        error: error instanceof Error ? error.message : String(error),
        invariantAfter,
        invariantAtFailure,
        invariantBefore,
        lastHeatPixels,
        lastProbe,
        lastSnapshotMismatch,
        maxRecoveryAttempts: B_MAP_PAINT_MAX_RECOVERY_ATTEMPTS,
        recoveryAttempts,
        threshold,
        viewport,
      }, null, 2),
      contentType: "application/json",
    })
    throw error
  }

  expect(paintedFrame, `${item.id} has no accepted painted frame`).toBeDefined()
  try {
    invariantAfter = await collectBMapRecoveryInvariant(page)
    expect(invariantAfter, `${item.id} repaint recovery changed URL, app readiness receipts, storage, viewport, or canvas geometry`).toEqual(invariantBefore)
    expect(paintedFrame!).toMatchSnapshot(bSnapshotName(item, viewport), { maxDiffPixels })
    await testInfo.attach("map-paint.json", {
      body: JSON.stringify({
        caseId: item.id,
        viewport,
        heatPixels,
        expectedCanvasHeatPixels,
        expectedEdgeHeatPixels,
        minimumComponentPixels: thresholdConfig.minimumComponentPixels,
        threshold: thresholdConfig.minimumHeatPixels,
        thresholdMode: thresholdConfig.mode,
        canvas: acceptedProbe.canvas,
        blockers: acceptedProbe.blockers,
        edgeReceiptRegions: acceptedProbe.edgeReceiptRegions,
        exposedRatio: acceptedProbe.exposedRatio,
        renderedSignalCount: acceptedProbe.renderedSignalCount,
        recoveryAttempts,
        signalSourceCount: acceptedProbe.signalSourceCount,
        stateNeutralRecovery: {
          after: invariantAfter,
          before: invariantBefore,
          cameraPixelProof: `accepted Buffer strict-reviewed snapshot match (maxDiffPixels=${maxDiffPixels})`,
          stimulus: "MapLibre online listener -> _update() -> deterministic source re-evaluation -> triggerRepaint()",
        },
      }, null, 2),
      contentType: "application/json",
    })
  } catch (error) {
    const invariantAtFailure = await collectBMapRecoveryInvariant(page).catch(() => null)
    await testInfo.attach("map-paint-failure.json", {
      body: JSON.stringify({
        caseId: item.id,
        error: error instanceof Error ? error.message : String(error),
        invariantAfter,
        invariantAtFailure,
        invariantBefore,
        lastHeatPixels,
        lastProbe,
        lastSnapshotMismatch,
        maxRecoveryAttempts: B_MAP_PAINT_MAX_RECOVERY_ATTEMPTS,
        recoveryAttempts,
        threshold,
        viewport,
      }, null, 2),
      contentType: "application/json",
    })
    throw error
  }
}

export async function closeBVisualCase(page: Page) {
  await expectBRuntimeClean(page)
}

export async function attachAndAssertBVisualRuntime(page: Page, testInfo: TestInfo) {
  if (!hasBRuntimeGuard(page)) return
  const evidence = getBRuntimeEvidence(page)
  await testInfo.attach("runtime.json", { body: JSON.stringify(evidence, null, 2), contentType: "application/json" })
  expect(evidence.product, "product runtime errors (external OpenFreeMap failures are classified separately)").toEqual([])
}

export function bSnapshotName(item: BVisualCase, viewport: BSleekViewportId) {
  return `${item.id}__${item.flows.join("+")}__${item.locale}__${viewport}.png`
}

export function attachBCaseMetadata(testInfo: TestInfo, item: BVisualCase, viewport: BSleekViewportId) {
  return testInfo.attach("evidence-case.json", {
    body: JSON.stringify({ ...item, viewport, sourceRoute: "/ondo-b", tilePolicy: "external vector tiles replaced; ONDO overlays unmasked" }, null, 2),
    contentType: "application/json",
  })
}

// Kept exported so registry tests can prove the helper did not accidentally
// regress the exact partial states while FL-002/FL-011 product gaps are closed.
export { expectBRuntimeClean, finishAgeGate }
