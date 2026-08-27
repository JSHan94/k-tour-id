import AxeBuilder from "@axe-core/playwright"
import { expect, type Locator, type Page, type TestInfo } from "@playwright/test"
import { readFile } from "node:fs/promises"
import {
  CANONICAL_VENUE_ID,
  TABLE_ID,
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
export const B_MAP_PAINT_MIN_COMPONENT_PIXELS = 64
export const B_MAP_PAINT_MIN_HEAT_PIXELS = 96
export const B_MAP_PAINT_EDGE_BAND_CSS_PIXELS = 8
export const B_MAP_PAINT_EDGE_MIN_COMPONENT_PIXELS = 4
export const B_MAP_PAINT_EDGE_MIN_HEAT_PIXELS = 3
export const B_MAP_PAINT_MAX_RECOVERY_ATTEMPTS = 3
// These case×viewport contracts are sealed from the reviewed 1a0e5ad PNGs.
// A case outside the registry uses the ordinary full-frame snapshot matcher;
// DOM geometry must not silently opt a case into or out of paint recovery.
export const B_MAP_PAINT_CANVAS_RECEIPTS = [
  "B-PX-AFTER19-PROMPT-EN:1440x1000",
  "B-PX-AFTER19-PROMPT-EN:430x932",
  "B-PX-AFTER19-PROMPT-EN:768x1024",
  "B-PX-AFTER19-PROMPT-EN:801x1000",
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
  "B-PX-GATE-ACCOUNT-FAIL-KO:360x800",
  "B-PX-GATE-ACCOUNT-FAIL-KO:390x844",
  "B-PX-GATE-ACCOUNT-FAIL-KO:430x932",
  "B-PX-GATE-ACCOUNT-FAIL-KO:768x1024",
  "B-PX-GATE-ACCOUNT-FAIL-KO:801x1000",
  "B-PX-GATE-AGE-FAIL-KO:1440x1000",
  "B-PX-GATE-AGE-FAIL-KO:430x932",
  "B-PX-GATE-AGE-FAIL-KO:768x1024",
  "B-PX-GATE-AGE-FAIL-KO:801x1000",
  "B-PX-GATE-PAYMENT-EN:1440x1000",
  "B-PX-GATE-PAYMENT-EN:390x844",
  "B-PX-GATE-PAYMENT-EN:430x932",
  "B-PX-GATE-PAYMENT-EN:768x1024",
  "B-PX-GATE-PAYMENT-EN:801x1000",
  "B-PX-GATE-PAYMENT-FAIL-KO:1440x1000",
  "B-PX-GATE-PAYMENT-FAIL-KO:390x844",
  "B-PX-GATE-PAYMENT-FAIL-KO:430x932",
  "B-PX-GATE-PAYMENT-FAIL-KO:768x1024",
  "B-PX-GATE-PAYMENT-FAIL-KO:801x1000",
  "B-PX-GATE-PERSON-CX-KO:1440x1000",
  "B-PX-GATE-PERSON-CX-KO:390x844",
  "B-PX-GATE-PERSON-CX-KO:430x932",
  "B-PX-GATE-PERSON-CX-KO:768x1024",
  "B-PX-GATE-PERSON-CX-KO:801x1000",
  "B-PX-GATE-PERSON-PASSPORT-EN:1440x1000",
  "B-PX-GATE-PERSON-PASSPORT-EN:390x844",
  "B-PX-GATE-PERSON-PASSPORT-EN:430x932",
  "B-PX-GATE-PERSON-PASSPORT-EN:768x1024",
  "B-PX-GATE-PERSON-PASSPORT-EN:801x1000",
  "B-PX-GATE-RESIDENCE-UNSUPPORTED-EN:1440x1000",
  "B-PX-GATE-RESIDENCE-UNSUPPORTED-EN:390x844",
  "B-PX-GATE-RESIDENCE-UNSUPPORTED-EN:430x932",
  "B-PX-GATE-RESIDENCE-UNSUPPORTED-EN:768x1024",
  "B-PX-GATE-RESIDENCE-UNSUPPORTED-EN:801x1000",
  "B-PX-PLACE-PEEK-EN:1440x1000",
  "B-PX-PLACE-PEEK-EN:390x844",
  "B-PX-PLACE-PEEK-EN:430x932",
  "B-PX-PLACE-PEEK-EN:768x1024",
  "B-PX-PLACE-PEEK-EN:801x1000",
] as const
export const B_MAP_PAINT_EDGE_RECEIPTS = [
  "B-PX-PLACE-PEEK-EN:360x800",
] as const

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
  { id: "B-PX-AFTER19-PROMPT-EN", state: "AFTER19-PROMPT", flows: ["FL-013"], locale: "en", description: "manual After19 decision with an isolated background" },
  { id: "B-PX-AFTER19-EXPIRED-REASON-EN", state: "AFTER19-EXPIRED-REASON", flows: ["FL-014"], locale: "en", description: "expired 19+ reason and recovery action" },
  { id: "B-PX-SAVE-RECOVERED-KO", state: "SAVE-RECOVERED", flows: ["FL-011"], locale: "ko", description: "save fail, dismiss, retry, and persisted saved state" },
  { id: "B-PX-SAVE-FAILURE-EN", state: "SAVE-FAILURE", flows: ["FL-011"], locale: "en", description: "local save failure preserves exact venue and recovery actions" },
  { id: "B-PX-GATE-ACCOUNT-FAIL-KO", state: "GATE-ACCOUNT-FAIL", flows: ["FL-010"], locale: "ko", description: "account retry and unchanged return" },
  { id: "B-PX-GATE-PERSON-PASSPORT-EN", state: "GATE-PERSON-PASSPORT", flows: ["FL-006", "FL-012"], locale: "en", description: "provider-neutral visitor person check" },
  { id: "B-PX-GATE-PERSON-CX-KO", state: "GATE-PERSON-CX", flows: ["FL-005"], locale: "ko", description: "Korean OmniOne CX simulation route" },
  { id: "B-PX-GATE-RESIDENCE-UNSUPPORTED-EN", state: "GATE-PERSON-RESIDENCE-UNSUPPORTED", flows: ["FL-006"], locale: "en", description: "Residence Card unsupported and alternate" },
  { id: "B-PX-AFTER19-VENUE-LOCKED-EN", state: "AFTER19-VENUE-LOCKED", flows: ["FL-002"], locale: "en", description: "locked After19-only venue without blocking ordinary place facts" },
  { id: "B-PX-GATE-AGE-FAIL-KO", state: "GATE-AGE-FAIL", flows: ["FL-002", "FL-013"], locale: "ko", description: "age proof retry" },
  { id: "B-PX-GATE-PAYMENT-EN", state: "GATE-PAYMENT", flows: ["FL-017"], locale: "en", description: "Payment KYC isolated gate" },
  { id: "B-PX-GATE-PAYMENT-FAIL-KO", state: "GATE-PAYMENT-FAIL", flows: ["FL-017"], locale: "ko", description: "Payment KYC failure and retry" },
  { id: "B-PX-AFTER19-VENUE-RETURN-EN", state: "AFTER19-VENUE-RETURN", flows: ["FL-002", "FL-013", "FL-014"], locale: "en", description: "age proof returns to the exact venue with After19 enabled" },
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
  { id: "B-PX-CHECKOUT-IDLE-EN", state: "CHECKOUT-IDLE", flows: ["FL-004", "FL-017"], locale: "en", description: "KRW price and OOKRW read-only settlement" },
  { id: "B-PX-CHECKOUT-CANCEL-KO", state: "CHECKOUT-CANCEL", flows: ["FL-004"], locale: "ko", description: "cancel with no receipt or stamp" },
  { id: "B-PX-CHECKOUT-FAIL-EN", state: "CHECKOUT-FAIL", flows: ["FL-004"], locale: "en", description: "decline with invariants" },
  { id: "B-PX-CHECKOUT-RECEIPT-EN", state: "CHECKOUT-RECEIPT", flows: ["FL-004"], locale: "en", description: "simulated receipt before visit proof" },
  { id: "B-PX-CHECKOUT-STAMP-KO", state: "CHECKOUT-STAMP", flows: ["FL-004"], locale: "ko", description: "separate unique visit creates stamp ten" },
  { id: "B-PX-MY-EN", state: "MY", flows: ["FL-004", "FL-011", "FL-015"], locale: "en", description: "saved canonical venue and stamp milestone" },
  { id: "B-PX-SESSION-RESET-CONFIRM-KO", state: "SESSION-RESET-CONFIRM", flows: ["FL-010", "FL-015"], locale: "ko", description: "session-clear scope and preserved-data confirmation" },
  { id: "B-PX-DISCOVERY-RESET-CONFIRM-EN", state: "DISCOVERY-RESET-CONFIRM", flows: ["FL-007", "FL-008", "FL-009"], locale: "en", description: "discovery-only reset and preserved-data confirmation" },
  { id: "B-PX-PROFILE-KO", state: "PROFILE", flows: ["FL-015"], locale: "ko", description: "optional public profile controls" },
  { id: "B-PX-TRUST-FOUR-AXES-EN", state: "TRUST-FOUR-AXES", flows: ["FL-003", "FL-012", "FL-015"], locale: "en", description: "separate reputation axes" },
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

async function stabilizeMobileEvidenceScroll(
  page: Page,
  target: Locator,
  position: { kind: "bottom" } | { kind: "scrollTop", value: number, desktopValue?: number },
) {
  if ((page.viewportSize()?.width ?? 0) > 430) {
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
    else {
      const targetRect = element.getBoundingClientRect()
      const scrollerRect = scroller.getBoundingClientRect()
      scroller.scrollTop += targetRect.bottom - Math.min(scrollerRect.bottom, window.innerHeight)
    }
    scroller.dataset.evidenceScrollTop = String(scroller.scrollTop)
    return nextPosition.kind === "scrollTop"
      ? { kind: nextPosition.kind, value: scroller.scrollTop }
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
  await page.getByTestId("canonical-venue-signal").click()
  await expect(page.getByTestId("local-signal-overlay")).toBeVisible()
}

async function triggerPersonGate(page: Page, locale: BLocale, persona: NonNullable<BSessionSeed["persona"]>, qa = false) {
  await seedB(page, { locale, session: { persona, account: "ACC-ACTIVE", person: "PER-UNVERIFIED", paymentKyc: "PKY-NOT-STARTED" } })
  await openLocalSignal(page, qa ? "qa=1" : "")
  await page.getByTestId("local-signal-overlay").locator("textarea").fill(locale === "ko" ? "주문은 입구에서 해요." : "Order beside the entrance.")
  await page.getByTestId("local-signal-submit").click()
  await expect(page.getByTestId("ondo-gate-overlay")).toBeVisible()
}

async function triggerAgeGate(page: Page, locale: BLocale, qa = false) {
  await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", age: "AGE-UNVERIFIED", paymentKyc: "PKY-NOT-STARTED" } })
  await openCity(page, qa ? "?qa=1" : "")
  await page.getByRole("button", { name: "After 19", exact: true }).click()
  await page.getByRole("button", { name: /Confirm 19\+|19\+ 확인/ }).click()
  await expect(page.getByTestId("ondo-gate-overlay")).toBeVisible()
}

async function triggerPaymentGate(page: Page, locale: BLocale, qa = false) {
  await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", paymentKyc: "PKY-NOT-STARTED" } })
  await openCanonicalVenue(page, { query: qa ? "qa=1" : "" })
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
      await expect(list.locator("[data-venue-opener='mois-18939eecb43c15ab4305']")).toContainText("Simulated score 59/100")
      await page.getByTestId("ondo-b-view-toggle").click()
      const mapEntry = page.getByTestId("ondo-b-map-entry")
      await expect(mapEntry).toHaveAttribute("data-signal-source-count", "1")
      await expect.poll(async () => Number(await mapEntry.getAttribute("data-rendered-signal-count"))).toBe(1)
      await expect(page.getByTestId("ondo-b-map-key")).toHaveAttribute("data-score", "59")
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
    await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", age: "AGE-UNVERIFIED" } })
    await openCity(page)
    await page.getByRole("button", { name: "After 19", exact: true }).click()
    await expect(page.getByTestId("after19-prompt-layer")).toBeVisible()
  } else if (state === "AFTER19-EXPIRED-REASON") {
    await seedB(page, {
      locale,
      session: { age: "AGE-VERIFIED", ageExpiresAt: "2020-08-19T20:30:00+09:00", after19: "A19-ON" },
    })
    await gotoB(page, "?city=seoul&view=list")
    const notice = page.getByTestId("after19-expiry-notice")
    await expect(notice).toBeVisible()
    await expect(notice.getByRole("status")).toContainText(locale === "ko" ? "19+ 확인이 만료되어 기본 지도로 돌아왔어요." : "Your 19+ check expired, so the main map is shown.")
    await expect(notice.getByRole("button", { name: locale === "ko" ? "19+ 다시 확인" : "Check 19+ again", exact: true })).toBeVisible()
    await expect(page.getByTestId("after19-toggle")).toHaveText("After 19")
  } else if (state === "AFTER19-VENUE-LOCKED" || state === "AFTER19-VENUE-RETURN") {
    await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", age: "AGE-UNVERIFIED", paymentKyc: "PKY-NOT-STARTED" } })
    await openCanonicalVenue(page)
    await expectCanonicalDetailReady(page)
    const access = page.getByTestId("canonical-after19-access")
    await expect(access).toHaveAttribute("data-after19-venue-status", "locked")
    await expect(page.getByTestId("canonical-place-overlay")).toContainText(locale === "ko" ? "공식 장소 출처" : "Official place source")
    if (state === "AFTER19-VENUE-RETURN") {
      await page.getByTestId("canonical-after19-unlock").click()
      await expect(page.getByTestId("ondo-gate-overlay")).toBeVisible()
      await finishAgeGate(page)
      await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
      await expect(access).toHaveAttribute("data-after19-venue-status", "unlocked")
      await expect(page.getByTestId("after19-auto-banner")).toBeVisible()
      await expect(page).toHaveURL(new RegExp(`venueId=${CANONICAL_VENUE_ID}`))
      await expect(page).not.toHaveURL(/after19Return=/)
    }
    if (state === "AFTER19-VENUE-LOCKED") {
      await access.scrollIntoViewIfNeeded()
      await expect(access).toBeVisible()
    }
    else await access.scrollIntoViewIfNeeded()
  } else if (state === "SAVE-FAILURE" || state === "SAVE-RECOVERED") {
    await seedB(page, { locale, session: { account: "ACC-ACTIVE" } })
    await openCanonicalVenue(page, { query: "scenario=save-failed" })
    await expectCanonicalDetailReady(page)
    await page.getByTestId("canonical-venue-save").click()
    await expect(page.getByTestId("canonical-save-error")).toBeVisible()
    if (state === "SAVE-RECOVERED") {
      await page.getByTestId("canonical-save-dismiss").click()
      await expect(page.getByTestId("canonical-save-error")).toHaveCount(0)
      await page.reload({ waitUntil: "domcontentloaded" })
      await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
      await expectCanonicalDetailReady(page)
      await page.getByTestId("canonical-venue-save").click()
      await expect(page.getByTestId("canonical-save-error")).toBeVisible()
      await page.getByTestId("canonical-save-retry").click()
      await expect(page.getByTestId("canonical-venue-save")).toHaveText(locale === "ko" ? "저장됨" : "Saved")
      await expect(page.getByTestId("canonical-venue-save")).toBeDisabled()
      await page.getByTestId("canonical-venue-save").scrollIntoViewIfNeeded()
    } else {
      const saveError = page.getByTestId("canonical-save-error")
      await saveError.scrollIntoViewIfNeeded()
      await expect(saveError).toBeVisible()
    }
  } else if (state === "GATE-ACCOUNT-FAIL") {
    await seedB(page, { locale, session: { account: "ACC-GUEST", person: "PER-UNVERIFIED", paymentKyc: "PKY-NOT-STARTED" } })
    await openCanonicalVenue(page, { query: "qa=1" })
    await page.getByTestId("canonical-venue-save").click()
    if (state === "GATE-ACCOUNT-FAIL") await page.getByRole("button", { name: locale === "ko" ? "실패 상태 보기" : "Simulate failure" }).click()
  } else if (state === "GATE-PERSON-PASSPORT") {
    await triggerPersonGate(page, locale, "short_term")
  } else if (state === "GATE-PERSON-CX") {
    await triggerPersonGate(page, locale, "korean_local")
  } else if (state === "GATE-PERSON-RESIDENCE-UNSUPPORTED") {
    await triggerPersonGate(page, locale, "long_term_resident")
    await page.getByRole("button", { name: locale === "ko" ? "본인 확인 시작" : "Start check" }).click()
    await expect(page.getByTestId("gate-unsupported")).toBeVisible()
  } else if (state === "GATE-AGE-FAIL") {
    await triggerAgeGate(page, locale, true)
    await page.getByRole("button", { name: locale === "ko" ? "실패 상태 보기" : "Simulate failure" }).click()
  } else if (state === "GATE-PAYMENT" || state === "GATE-PAYMENT-FAIL") {
    await triggerPaymentGate(page, locale, state === "GATE-PAYMENT-FAIL")
    if (state === "GATE-PAYMENT-FAIL") await page.getByRole("button", { name: locale === "ko" ? "실패 상태 보기" : "Simulate failure" }).click()
  } else if (state === "TABLES-VENUE-EMPTY") {
    await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED" } })
    await openCanonicalVenue(page)
    await page.getByTestId("canonical-venue-tables").click()
    await expect(page.getByTestId("venue-table-scope")).toBeVisible()
    await expect(page.getByTestId("venue-tables-empty")).toBeVisible()
    await expect(page.getByTestId("tables-back-to-venue")).toBeVisible()
    await expect(page.getByTestId("tables-browse-all")).toBeVisible()
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
      await expect(page.getByRole("status").filter({ hasText: /체크인했어요|Checked in/ })).toHaveCount(0, { timeout: 3_000 })
    } else if (state === "REPORT") {
      await page.getByTestId("table-report").click()
      await expect(page.getByRole("alertdialog")).toBeVisible()
    }
  } else if (state === "LOCAL-SIGNAL-EMPTY" || state === "LOCAL-SIGNAL-FAIL" || state === "LOCAL-SIGNAL-SUCCESS") {
    await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED" } })
    await openLocalSignal(page, state === "LOCAL-SIGNAL-FAIL" ? "view=list&scenario=local-signal-fail" : "view=list")
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
    await page.getByTestId("nav-id").click()
    const opener = page.getByTestId("session-reset-open")
    await opener.scrollIntoViewIfNeeded()
    await opener.click()
    const confirm = page.getByTestId("session-reset-confirm")
    await expect(confirm).toBeVisible()
    await expect(page.getByRole("dialog", { name: "로그아웃하고 이 세션을 지울까요?" })).toBeVisible()
    await expect(confirm.getByRole("button", { name: "이 세션 유지", exact: true })).toBeFocused()
  } else if (state === "DISCOVERY-RESET-CONFIRM") {
    await seedB(page, {
      locale,
      local: { savedVenueIds: [CANONICAL_VENUE_ID], discoveryPreferences: ["vegan", "late"] },
      session: { persona: "long_term_resident", account: "ACC-ACTIVE", person: "PER-VERIFIED" },
    })
    await gotoB(page, "?city=seoul&query=tteokbokki")
    await page.getByTestId("nav-my").click()
    const opener = page.getByTestId("discovery-reset-open")
    await opener.scrollIntoViewIfNeeded()
    await opener.click()
    const confirm = page.getByTestId("discovery-reset-confirm")
    await expect(confirm).toBeVisible()
    await expect(page.getByRole("dialog", { name: "Reset discovery choices?" })).toBeVisible()
    await expect(confirm.getByRole("button", { name: "Keep choices", exact: true })).toBeFocused()
  } else if (state === "PROFILE" || state === "TRUST-FOUR-AXES") {
    await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", reputation: { identity: "verified", visit: "repeat", contribution: "established", meetup: "reliable" } } })
    await gotoB(page)
    await page.getByRole("navigation").locator("button").nth(3).click()
    const target = page.getByTestId(state === "PROFILE" ? "ondo-profile-panel" : "ondo-trust-panel")
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
    await expect(page.getByText("1 sourced food place", { exact: true })).toHaveCount(1)
  }
  if (state === "LABS-TRAIT-FAIL") {
    await expect(page.getByTestId("labs-overlay").getByText("Target network: Sui Testnet · Simulated", { exact: true })).toHaveCount(1)
  }
  if (state === "TRUST-FOUR-AXES") {
    const target = page.getByTestId("ondo-trust-panel")
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
      return (element.getAttribute("aria-label") ?? labelledBy ?? wrappingLabel ?? element.textContent?.trim() ?? element.getAttribute("title") ?? "").replace(/\s+/g, " ").trim()
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
  if (item.state.startsWith("LOCAL-SIGNAL")) {
    const title = page.getByTestId("local-signal-overlay").locator("h2").first()
    await expect(title).toBeVisible()

    // Chromium can occasionally return a compositor frame containing the
    // Sheet surface and grabber while dropping the scroll viewport's
    // foreground. DOM visibility and geometry remain correct in that frame,
    // so they cannot keep an empty pixel baseline from being approved. Probe
    // the title pixels in a full viewport capture; locator screenshots can
    // themselves trigger the blank follow-up frame that this guard rejects.
    const titleBox = await title.boundingBox()
    expect(titleBox, `${item.id} title has no painted bounding box`).not.toBeNull()
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
    await stabilizeMobileEvidenceScroll(page, page.getByTestId("ondo-profile-panel"), { kind: "bottom" })
  }
  if (item.state.startsWith("LABS")) {
    // Opening Labs can race sheet mount and initial-focus work against click
    // auto-scroll. The translucent scrim makes the otherwise irrelevant My
    // Korea offset part of the pixel contract, so normalize it for every Labs
    // state after geometry/a11y probes (not only the base Labs case).
    await stabilizeMobileEvidenceScroll(page, page.getByTestId("open-labs-milestone"), { kind: "scrollTop", value: 828, desktopValue: 726 })
  }
}

export async function collectBMapPaintProbe(page: Page): Promise<BMapPaintProbe | null> {
  const mapEntry = page.getByTestId("ondo-b-map-entry")
  if (await mapEntry.count() === 0) return null
  return mapEntry.evaluate((root, { edgeBand, minimumExposedRatio }) => {
    const app = root.closest<HTMLElement>("[data-testid='ondo-b-root']") ?? root
    const viewport = { width: window.innerWidth, height: window.innerHeight }
    const canvas = root.querySelector<HTMLCanvasElement>("canvas.maplibregl-canvas")
    const mapKey = root.querySelector<HTMLElement>("[data-testid='ondo-b-map-key']")
    const renderedSignalCount = Number(root.dataset.renderedSignalCount ?? 0)
    const signalSourceCount = Number(root.dataset.signalSourceCount ?? 0)
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
    // A narrow place peek can expose only a seven-pixel marker sliver. Its
    // reliable receipt lives immediately outside the opaque sheet, while all
    // plum modal controls are inside the blocked rect. Keep this fallback ROI
    // separate from the global heat analysis so ordinary page chrome cannot
    // make a blank MapLibre frame pass.
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
  minimumSignalDistance: string
  neutralSourceCount: string
  renderedSignalCount: string
  signalSourceCount: string
  signalZoomTier: string
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
      minimumSignalDistance: root.dataset.minSignalDistancePx ?? "",
      neutralSourceCount: root.dataset.neutralSourceCount ?? "",
      renderedSignalCount: root.dataset.renderedSignalCount ?? "",
      signalSourceCount: root.dataset.signalSourceCount ?? "",
      signalZoomTier: root.dataset.signalZoomTier ?? "",
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
        const hot = red >= 130 && red <= 190 && green >= 60 && green <= 115 && blue >= 50 && blue <= 105
        const rising = red >= 195 && red <= 245 && green >= 105 && green <= 160 && blue >= 40 && blue <= 90
        const warming = red >= 200 && red <= 250 && green >= 165 && green <= 220 && blue >= 70 && blue <= 165
        if (peak || hot || rising || warming) candidates.add(y * canvas.width + x)
      }
    }
    let markerPixels = 0
    while (candidates.size) {
      const first = candidates.values().next().value as number
      candidates.delete(first)
      const stack = [first]
      let componentPixels = 0
      while (stack.length) {
        const current = stack.pop()!
        componentPixels += 1
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
      if (componentPixels >= minimumComponentPixels) markerPixels += componentPixels
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
