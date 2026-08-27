"use client"

import type { ReactNode } from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import {
  CANONICAL_PRIVATE_NOTE_MAX_LENGTH,
  isCanonicalVenueId,
  sanitizeCanonicalVenueIds,
  sanitizeCanonicalVenueNotes,
} from "@/lib/ondo/venues/canonical-allowlist"
import type { OndoBPlannedTableRef } from "../../my/my-korea-model"
import {
  recordPlannedTable,
  recordRecentVenue,
  removePlannedTable,
  sanitizeLocalSignalVenueIds,
  sanitizePlannedTableRefs,
  sanitizeRecentVenueIds,
} from "../../my/my-korea-model"
import type { OndoBDiscoveryPreference, OndoBLocale, OndoBPersona } from "./ondo-b-preferences"
import { ONDO_B_DISCOVERY_PREFERENCES, ONDO_B_PERSONA_IDS } from "./ondo-b-preferences"
import type { PulseLocalEvidenceB, PulseLocalSignalTagB } from "../../pulse-b/pulse-model-b"
import {
  createStableCommerceBState,
  STABLE_B_OPENING_BALANCE,
  STABLE_B_OOKRW_PRICE,
  STABLE_B_PAYMENT_OPERATION_ID,
  STABLE_B_RECEIPT_ID,
  STABLE_B_REFUND_OPERATION_ID,
  STABLE_B_REFUND_RECEIPT_ID,
  STABLE_B_VOUCHER_VALUE,
  stableCommerceBalanceB,
  stableCommerceBReducer,
  type StableCommerceBAction,
  type StableCommerceBState,
} from "../../commerce-b/stable-commerce-model-b"
import {
  createSimulatedCredentialB,
  type OndoBIdentityMethod,
  type OndoBIdentitySetupOrigin,
  type OndoBSimulatedCredential,
} from "../../identity-b/ktour-id-setup-model-b"
import {
  B_ACTION_AXIS_SESSION_EVENT,
  B_ACTION_GATE_SESSION_KEY,
  DEFAULT_B_ACTION_GATE_SESSION,
} from "../../identity-b/action-gate-contract-b"
import {
  DEFAULT_GLOBAL_AFTER19_PREFERENCE,
  DEFAULT_GLOBAL_AFTER19_SESSION,
  GLOBAL_AFTER19_PREFERENCE_KEY,
  GLOBAL_AFTER19_SESSION_EVENT,
  GLOBAL_AFTER19_SESSION_KEY,
} from "../../after19/after19-global-b-model"
import {
  B_ACTIVITY_PROFILE_CLEAR_EVENT,
  B_ACTIVITY_PROFILE_SESSION_KEY,
  restoreBActivityProfile,
} from "../../identity-b/activity-profile-b-provider"
import { isEditorialPlaceId, sanitizeEditorialPlaceIds, type EditorialPlaceB } from "../../pulse-b/japan-first-pulse-model-b"
import {
  consumeBAccountReturnTo,
  createBAccountReturnTo,
  isBAccountReturnToUsable,
  type BAccountReturnToEnvelope,
} from "../../contracts/return-to-b"
import { readQaScenario } from "../ui/use-qa-controls"

export type OndoBTab = "ondo" | "my" | "tables" | "id" | "settings"
export type OndoBSurface = { kind: "map" } | { kind: "venue"; venueId: string } | { kind: "editorial_place"; editorialPlaceId: EditorialPlaceB["id"] } | { kind: "labs" }
export type OndoBSaveStatus = "SAV-IDLE" | "SAV-SAVED" | "SAV-FAILED"
export type OndoBAccountStatus = "ACC-GUEST" | "ACC-ACTIVE"
export type OndoBLocalSignalTag = PulseLocalSignalTagB
export type OndoBLocalSignalDraft = {
  venueId: string
  tags: OndoBLocalSignalTag[]
  note: string
}
export type OndoBCommerceOrigin = { kind: "canonical_place"; venueId: string }
export type OndoBCommerceWalletStatus = "disconnected" | "failed" | "ready"
export type OndoBCommerceReceipt = {
  receiptId: string
  refundReceiptId: string | null
  offerId: "meal-offer-gukbap"
  venueId: string
  status: "paid" | "refunded"
  paidOOKRW: number
  benefitOOKRW: number
  balanceOOKRW: number
}

export type OndoBState = {
  hydrated: boolean
  locale: OndoBLocale
  tab: OndoBTab
  surface: OndoBSurface
  onboarding: "ONB-NEW" | "ONB-IN-PROGRESS" | "ONB-COMPLETE"
  account: OndoBAccountStatus
  accountReturnTo: BAccountReturnToEnvelope | null
  persona: OndoBPersona | null
  discoveryPreferences: OndoBDiscoveryPreference[]
  savedVenueIds: string[]
  savedEditorialPlaceIds: EditorialPlaceB["id"][]
  saveStatusByVenue: Record<string, OndoBSaveStatus>
  privateNotesByVenue: Record<string, string>
  recentVenueIds: string[]
  recentEditorialPlaceIds: EditorialPlaceB["id"][]
  plannedTableRefs: OndoBPlannedTableRef[]
  localSignalPostedVenueIds: string[]
  localPulseEvidenceByVenue: Record<string, PulseLocalEvidenceB>
  localInteractionBoundarySeen: boolean
  identitySetupOrigin: OndoBIdentitySetupOrigin | null
  identityCredential: OndoBSimulatedCredential | null
  commerceLocalBoundarySeen: boolean
  commerceOrigin: OndoBCommerceOrigin | null
  commerceWalletStatus: OndoBCommerceWalletStatus
  commerceSession: StableCommerceBState
  commerceReceiptVenueId: string | null
  commerceReceipts: OndoBCommerceReceipt[]
  localSignalDraft: OndoBLocalSignalDraft | null
  toast: string | null
}

export type OndoBActions = {
  setLocale(locale: OndoBLocale): boolean
  setTab(tab: OndoBTab): void
  setSurface(surface: OndoBSurface): void
  setPersona(persona: OndoBPersona): boolean
  setDiscoveryPreferences(preferences: OndoBDiscoveryPreference[]): boolean
  resetDiscoveryPreferences(): void
  beginOnboarding(): void
  completeOnboarding(preferences: OndoBDiscoveryPreference[]): boolean
  skipOnboarding(): boolean
  resetOnboarding(): boolean
  beginAccountSave(venueId: string): boolean
  cancelAccountSave(): boolean
  activateAccount(): boolean
  completeAccountSave(): "saved" | "save_failed" | "account_failed"
  saveVenue(venueId: string): void
  toggleSavedVenue(venueId: string): void
  toggleSavedEditorialPlace(editorialPlaceId: EditorialPlaceB["id"]): boolean
  setPrivateNote(venueId: string, note: string): boolean
  openLocalSignal(venueId: string): void
  updateLocalSignalDraft(update: Pick<OndoBLocalSignalDraft, "tags" | "note">): void
  closeLocalSignal(): void
  recordRecentVenue(venueId: string): boolean
  recordRecentEditorialPlace(editorialPlaceId: EditorialPlaceB["id"]): boolean
  recordPlannedTable(tableId: string, venueId: string): boolean
  removePlannedTable(tableId: string): boolean
  markLocalSignalPosted(venueId: string): boolean
  acknowledgeLocalInteractionBoundary(): boolean
  openIdentitySetup(origin: OndoBIdentitySetupOrigin): void
  closeIdentitySetup(): void
  completeIdentitySetup(method: OndoBIdentityMethod): void
  acknowledgeCommerceLocalBoundary(): boolean
  setCommerceWalletStatus(status: OndoBCommerceWalletStatus): void
  dispatchCommerce(action: StableCommerceBAction): boolean
  recordCommerceReceipt(receipt: OndoBCommerceReceipt): boolean
  openMealBenefitFromPlace(venueId: string): boolean
  returnFromCommerceOrigin(): boolean
  clearBDeviceContent(): boolean
  notify(message: string): void
}

type OndoBDeviceState = {
  locale: OndoBLocale
  onboarding: "ONB-NEW" | "ONB-COMPLETE"
  persona: OndoBPersona | null
  discoveryPreferences: OndoBDiscoveryPreference[]
  savedVenueIds: string[]
  savedEditorialPlaceIds: EditorialPlaceB["id"][]
  privateNotesByVenue: Record<string, string>
  recentVenueIds: string[]
  recentEditorialPlaceIds: EditorialPlaceB["id"][]
  plannedTableRefs: OndoBPlannedTableRef[]
  localSignalPostedVenueIds: string[]
  localPulseEvidenceByVenue: Record<string, PulseLocalEvidenceB>
  localInteractionBoundarySeen: boolean
  commerceLocalBoundarySeen: boolean
  commerceReceipts: OndoBCommerceReceipt[]
}

const B_DEVICE_KEY = "ondo-b.device.v1"
export const B_ACCOUNT_SESSION_KEY = "ondo-b.account.v1"
const LEGACY_SESSION_KEY = "ondo.session.v3"
const B_PREFERENCES = new Set(ONDO_B_DISCOVERY_PREFERENCES.map((preference) => preference.id))
const ONDO_B_PERSONAS = new Set(ONDO_B_PERSONA_IDS)
const B_LOCAL_SIGNAL_TAGS = new Set<OndoBLocalSignalTag>(["calm_now", "lively_now", "quick_stop", "welcoming"])
const B_LOCAL_SIGNAL_NOTE_MAX_LENGTH = 240
const B_COMMERCE_RECEIPT_LIMIT = 8

export function sanitizeCommerceReceipts(value: unknown): OndoBCommerceReceipt[] {
  if (!Array.isArray(value)) return []
  const receipts = value.flatMap((item): OndoBCommerceReceipt[] => {
    if (!item || typeof item !== "object") return []
    const receipt = item as Record<string, unknown>
    if (receipt.receiptId !== STABLE_B_RECEIPT_ID || receipt.offerId !== "meal-offer-gukbap" || !isCanonicalVenueId(receipt.venueId)) return []
    if (receipt.status !== "paid" && receipt.status !== "refunded") return []
    if (receipt.status === "paid" ? receipt.refundReceiptId !== null : receipt.refundReceiptId !== STABLE_B_REFUND_RECEIPT_ID) return []
    const benefitOOKRW = receipt.benefitOOKRW === STABLE_B_VOUCHER_VALUE
      ? STABLE_B_VOUCHER_VALUE
      : receipt.benefitOOKRW === 0 ? 0 : null
    const paidOOKRW = benefitOOKRW == null || receipt.paidOOKRW !== STABLE_B_OOKRW_PRICE - benefitOOKRW
      ? null
      : receipt.paidOOKRW
    const expectedBalance = paidOOKRW == null
      ? null
      : receipt.status === "paid" ? STABLE_B_OPENING_BALANCE - paidOOKRW : STABLE_B_OPENING_BALANCE
    const balanceOOKRW = receipt.balanceOOKRW === expectedBalance ? expectedBalance : null
    if (paidOOKRW === null || benefitOOKRW === null || balanceOOKRW === null) return []
    return [{
      receiptId: STABLE_B_RECEIPT_ID,
      refundReceiptId: receipt.status === "refunded" ? STABLE_B_REFUND_RECEIPT_ID : null,
      offerId: "meal-offer-gukbap",
      venueId: receipt.venueId,
      status: receipt.status,
      paidOOKRW,
      benefitOOKRW,
      balanceOOKRW,
    }]
  })
  return receipts
    .filter((receipt, index, all) => all.findIndex((candidate) => candidate.receiptId === receipt.receiptId) === index)
    .slice(0, B_COMMERCE_RECEIPT_LIMIT)
}

export function commerceSessionFromReceipts(receipts: readonly OndoBCommerceReceipt[]): StableCommerceBState {
  const receipt = receipts[0]
  const initial = createStableCommerceBState()
  if (!receipt) return initial
  const paymentLedger: StableCommerceBState["ledger"] = [
    {
      operationId: STABLE_B_PAYMENT_OPERATION_ID,
      receiptId: STABLE_B_RECEIPT_ID,
      side: "holder",
      amount: -receipt.paidOOKRW,
      kind: "PAYMENT",
    },
    {
      operationId: STABLE_B_PAYMENT_OPERATION_ID,
      receiptId: STABLE_B_RECEIPT_ID,
      side: "merchant",
      amount: receipt.paidOOKRW,
      kind: "PAYMENT",
    },
  ]
  const refundLedger: StableCommerceBState["ledger"] = receipt.status === "refunded" ? [
    {
      operationId: STABLE_B_REFUND_OPERATION_ID,
      receiptId: STABLE_B_REFUND_RECEIPT_ID,
      side: "holder",
      amount: receipt.paidOOKRW,
      kind: "REFUND",
    },
    {
      operationId: STABLE_B_REFUND_OPERATION_ID,
      receiptId: STABLE_B_REFUND_RECEIPT_ID,
      side: "merchant",
      amount: -receipt.paidOOKRW,
      kind: "REFUND",
    },
  ] : []
  return {
    ...initial,
    status: receipt.status,
    voucher: receipt.status === "paid" && receipt.benefitOOKRW > 0 ? "consumed" : "available",
    benefitRecommendation: receipt.benefitOOKRW > 0 ? "accepted" : "declined",
    confirmationCount: 1,
    receiptCount: 1,
    refundCount: receipt.status === "refunded" ? 1 : 0,
    chargedDebit: receipt.paidOOKRW,
    voucherApplied: receipt.benefitOOKRW > 0,
    redemptionCount: receipt.status === "paid" && receipt.benefitOOKRW > 0 ? 1 : 0,
    receiptId: receipt.receiptId,
    lastOutcome: "success",
    ledger: paymentLedger.concat(refundLedger),
  }
}

function initialState(): OndoBState {
  return {
    hydrated: false,
    locale: "en",
    tab: "ondo",
    surface: { kind: "map" },
    onboarding: "ONB-NEW",
    account: "ACC-GUEST",
    accountReturnTo: null,
    persona: null,
    discoveryPreferences: [],
    savedVenueIds: [],
    savedEditorialPlaceIds: [],
    saveStatusByVenue: {},
    privateNotesByVenue: {},
    recentVenueIds: [],
    recentEditorialPlaceIds: [],
    plannedTableRefs: [],
    localSignalPostedVenueIds: [],
    localPulseEvidenceByVenue: {},
    localInteractionBoundarySeen: false,
    identitySetupOrigin: null,
    identityCredential: null,
    commerceLocalBoundarySeen: false,
    commerceOrigin: null,
    commerceWalletStatus: "disconnected",
    commerceSession: createStableCommerceBState(),
    commerceReceiptVenueId: null,
    commerceReceipts: [],
    localSignalDraft: null,
    toast: null,
  }
}

function preferredBrowserLocale(): OndoBLocale {
  if (typeof navigator === "undefined") return "en"
  return navigator.languages.some((language) => language.toLowerCase().startsWith("ja")) ? "ja" : "en"
}

const DEVICE_MESSAGE = {
  locale: { en: "Language could not be saved on this device.", ko: "언어 설정을 이 기기에 저장하지 못했어요.", ja: "言語設定をこの端末に保存できませんでした。" },
  persona: { en: "Intent could not be saved.", ko: "이용 목적을 저장하지 못했어요.", ja: "利用目的を保存できませんでした。" },
  choices: { en: "Choices could not be saved.", ko: "선택을 저장하지 못했어요.", ja: "選択内容を保存できませんでした。" },
  clearChoices: { en: "Choices could not be cleared.", ko: "선택을 초기화하지 못했어요.", ja: "選択内容をリセットできませんでした。" },
  setup: { en: "Setup could not be saved.", ko: "시작 설정을 저장하지 못했어요.", ja: "初期設定を保存できませんでした。" },
  guest: { en: "Guest setup could not be saved.", ko: "게스트 시작 설정을 저장하지 못했어요.", ja: "ゲスト設定を保存できませんでした。" },
  account: { en: "The account step could not start in this tab.", ko: "이 탭에서 계정 절차를 시작하지 못했어요.", ja: "このタブでアカウント手続きを開始できませんでした。" },
} satisfies Record<string, Record<OndoBLocale, string>>

function isProductionPath() {
  return typeof window !== "undefined" && window.location.pathname.replace(/\/$/, "") === "/ondo-b"
}

function restoreBDeviceState(value: unknown): OndoBDeviceState {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {}
  const savedVenueIds = sanitizeCanonicalVenueIds(record.savedVenueIds)
  const localPulseRecord = record.localPulseEvidenceByVenue && typeof record.localPulseEvidenceByVenue === "object"
    ? record.localPulseEvidenceByVenue as Record<string, unknown>
    : {}
  const restoredLocalPulseEvidenceByVenue = Object.fromEntries(Object.entries(localPulseRecord).flatMap(([venueId, value]) => {
    if (!isCanonicalVenueId(venueId) || !value || typeof value !== "object") return []
    const evidence = value as Record<string, unknown>
    const tags = Array.isArray(evidence.tags)
      ? [...new Set(evidence.tags.filter((tag): tag is OndoBLocalSignalTag => B_LOCAL_SIGNAL_TAGS.has(tag as OndoBLocalSignalTag)))]
      : []
    const postedAt = typeof evidence.postedAt === "string" && !Number.isNaN(Date.parse(evidence.postedAt)) ? evidence.postedAt : null
    return tags.length && postedAt ? [[venueId, { tags, postedAt } satisfies PulseLocalEvidenceB]] : []
  }))
  const restoredLocalSignalVenueIds = sanitizeLocalSignalVenueIds(record.localSignalPostedVenueIds)
  const localSignalPostedVenueIds = restoredLocalSignalVenueIds.filter((venueId) => restoredLocalPulseEvidenceByVenue[venueId] !== undefined)
  const boundedLocalPulseEvidenceByVenue = Object.fromEntries(localSignalPostedVenueIds.map((venueId) => [venueId, restoredLocalPulseEvidenceByVenue[venueId]]))
  const commerceReceipts = sanitizeCommerceReceipts(record.commerceReceipts)
  return {
    locale: record.locale === "ko" || record.locale === "ja" ? record.locale : "en",
    onboarding: record.onboarding === "ONB-COMPLETE" ? "ONB-COMPLETE" : "ONB-NEW",
    persona: ONDO_B_PERSONAS.has(record.persona as OndoBPersona)
      ? record.persona as OndoBPersona
      : null,
    discoveryPreferences: Array.isArray(record.discoveryPreferences)
      ? [...new Set(record.discoveryPreferences.filter((item): item is OndoBDiscoveryPreference => B_PREFERENCES.has(item as OndoBDiscoveryPreference)))]
      : [],
    savedVenueIds,
    savedEditorialPlaceIds: sanitizeEditorialPlaceIds(record.savedEditorialPlaceIds),
    privateNotesByVenue: sanitizeCanonicalVenueNotes(record.privateNotesByVenue, savedVenueIds),
    recentVenueIds: sanitizeRecentVenueIds(record.recentVenueIds),
    recentEditorialPlaceIds: sanitizeEditorialPlaceIds(record.recentEditorialPlaceIds).slice(0, 8),
    plannedTableRefs: sanitizePlannedTableRefs(record.plannedTableRefs),
    localSignalPostedVenueIds,
    localPulseEvidenceByVenue: boundedLocalPulseEvidenceByVenue,
    localInteractionBoundarySeen: record.localInteractionBoundarySeen === true,
    commerceLocalBoundarySeen: record.commerceLocalBoundarySeen === true,
    commerceReceipts,
  }
}

function deviceState(state: OndoBState): OndoBDeviceState {
  return restoreBDeviceState({
    locale: state.locale,
    onboarding: state.onboarding,
    persona: state.persona,
    discoveryPreferences: state.discoveryPreferences,
    savedVenueIds: state.savedVenueIds,
    savedEditorialPlaceIds: state.savedEditorialPlaceIds,
    privateNotesByVenue: state.privateNotesByVenue,
    recentVenueIds: state.recentVenueIds,
    recentEditorialPlaceIds: state.recentEditorialPlaceIds,
    plannedTableRefs: state.plannedTableRefs,
    localSignalPostedVenueIds: state.localSignalPostedVenueIds,
    localPulseEvidenceByVenue: state.localPulseEvidenceByVenue,
    localInteractionBoundarySeen: state.localInteractionBoundarySeen,
    commerceLocalBoundarySeen: state.commerceLocalBoundarySeen,
    commerceReceipts: state.commerceReceipts,
  })
}

function persistBDeviceState(state: OndoBState) {
  if (!isProductionPath()) return false
  try {
    window.localStorage.setItem(B_DEVICE_KEY, JSON.stringify(deviceState(state)))
    return true
  } catch {
    return false
  }
}

export type BAccountSessionState = {
  account: OndoBAccountStatus
  returnTo: BAccountReturnToEnvelope | null
}

export function restoreBAccountSession(value: unknown): BAccountSessionState {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {}
  const account = record.account === "ACC-ACTIVE" ? "ACC-ACTIVE" : "ACC-GUEST"
  const candidate = record.returnTo && typeof record.returnTo === "object"
    ? record.returnTo as BAccountReturnToEnvelope
    : null
  return {
    account,
    returnTo: account === "ACC-GUEST" && isBAccountReturnToUsable(candidate) ? candidate : null,
  }
}

function persistBAccountSession(session: BAccountSessionState) {
  if (!isProductionPath()) return false
  try {
    // Persist an explicit Guest value too. It prevents a deliberate B reset or
    // cancelled migration from re-importing an older A-owned Account record on
    // the next reload, while the legacy bytes remain untouched.
    window.sessionStorage.setItem(B_ACCOUNT_SESSION_KEY, JSON.stringify(session))
    return true
  } catch {
    return false
  }
}

function readBAccountSession(): BAccountSessionState {
  try {
    const stored = window.sessionStorage.getItem(B_ACCOUNT_SESSION_KEY)
    if (stored !== null) return restoreBAccountSession(JSON.parse(stored))

    // One-way compatibility for the documented pre-B session seam. Only the
    // Account axis is admitted; B never imports the legacy provider and never
    // reads or migrates Person, age, payment, profile, gate, or reputation.
    // The legacy record remains byte-for-byte owned by its original surface.
    const legacyStored = window.sessionStorage.getItem(LEGACY_SESSION_KEY)
    const legacy = legacyStored === null ? null : JSON.parse(legacyStored) as Record<string, unknown>
    const migrated = restoreBAccountSession({ account: legacy?.account })
    if (migrated.account === "ACC-ACTIVE") persistBAccountSession(migrated)
    return migrated
  } catch {
    return { account: "ACC-GUEST", returnTo: null }
  }
}

const OndoBContext = createContext<{ state: OndoBState; actions: OndoBActions } | null>(null)

export function OndoBProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState)
  const stateRef = useRef(state)
  const failedSaveQaVenueIdsRef = useRef(new Set<string>())
  stateRef.current = state

  useEffect(() => {
    const blank = initialState()
    if (!isProductionPath()) {
      const next = { ...blank, hydrated: true }
      stateRef.current = next
      setState(next)
      return
    }
    try {
      const stored = window.localStorage.getItem(B_DEVICE_KEY)
      const restored = stored === null ? restoreBDeviceState({ locale: preferredBrowserLocale() }) : restoreBDeviceState(JSON.parse(stored))
      const accountSession = readBAccountSession()
      const next: OndoBState = {
        ...blank,
        ...restored,
        account: accountSession.account,
        accountReturnTo: accountSession.returnTo,
        saveStatusByVenue: Object.fromEntries(restored.savedVenueIds.map((venueId) => [venueId, "SAV-SAVED" as const])),
          commerceOrigin: null,
          commerceWalletStatus: "disconnected",
          commerceSession: commerceSessionFromReceipts(restored.commerceReceipts),
          commerceReceiptVenueId: restored.commerceReceipts[0]?.venueId ?? null,
          hydrated: true,
      }
      stateRef.current = next
      setState(next)
      persistBDeviceState(next)
    } catch {
      const next = { ...blank, locale: preferredBrowserLocale(), hydrated: true }
      stateRef.current = next
      setState(next)
    }
  }, [])

  const notify = useCallback((message: string) => {
    setState((current) => ({ ...current, toast: message }))
    window.setTimeout(() => setState((current) => current.toast === message ? { ...current, toast: null } : current), 2_200)
  }, [])

  const commit = useCallback((update: (current: OndoBState) => OndoBState) => {
    const next = update(stateRef.current)
    if (!persistBDeviceState(next)) return false
    stateRef.current = next
    setState(next)
    return true
  }, [])

  const commitEphemeral = useCallback((update: (current: OndoBState) => OndoBState) => {
    const next = update(stateRef.current)
    stateRef.current = next
    setState(next)
  }, [])

  const persistCanonicalSavedVenue = useCallback((venueId: string, toggle: boolean) => {
    if (!isCanonicalVenueId(venueId) || !isProductionPath()) {
      const failed = { ...stateRef.current, saveStatusByVenue: { ...stateRef.current.saveStatusByVenue, [venueId]: "SAV-FAILED" as const } }
      stateRef.current = failed
      setState(failed)
      return false
    }
    const current = stateRef.current
    const alreadySaved = current.savedVenueIds.includes(venueId)
    const shouldSave = toggle ? !alreadySaved : true
    if (shouldSave && current.account !== "ACC-ACTIVE") return false
    if (shouldSave && readQaScenario() === "save-failed" && !failedSaveQaVenueIdsRef.current.has(venueId)) {
      failedSaveQaVenueIdsRef.current.add(venueId)
      const failed: OndoBState = { ...current, saveStatusByVenue: { ...current.saveStatusByVenue, [venueId]: "SAV-FAILED" } }
      stateRef.current = failed
      setState(failed)
      return false
    }
    const privateNotesByVenue = { ...current.privateNotesByVenue }
    if (!shouldSave) delete privateNotesByVenue[venueId]
    const next: OndoBState = {
      ...current,
      savedVenueIds: shouldSave
        ? alreadySaved ? current.savedVenueIds : [...current.savedVenueIds, venueId]
        : current.savedVenueIds.filter((id) => id !== venueId),
      saveStatusByVenue: { ...current.saveStatusByVenue, [venueId]: shouldSave ? "SAV-SAVED" : "SAV-IDLE" },
      privateNotesByVenue,
    }
    if (!persistBDeviceState(next)) {
      const failed: OndoBState = { ...current, saveStatusByVenue: { ...current.saveStatusByVenue, [venueId]: "SAV-FAILED" } }
      stateRef.current = failed
      setState(failed)
      return false
    }
    stateRef.current = next
    setState(next)
    return true
  }, [])

  const beginAccountSave = useCallback((venueId: string) => {
    if (!isCanonicalVenueId(venueId) || stateRef.current.account === "ACC-ACTIVE") return false
    const returnTo = createBAccountReturnTo(venueId)
    const session = { account: stateRef.current.account, returnTo } satisfies BAccountSessionState
    if (!persistBAccountSession(session)) return false
    commitEphemeral((current) => ({ ...current, accountReturnTo: returnTo }))
    return true
  }, [commitEphemeral])

  const cancelAccountSave = useCallback(() => {
    const current = stateRef.current
    const cleared = persistBAccountSession({ account: current.account, returnTo: null })
    commitEphemeral((value) => ({ ...value, accountReturnTo: null }))
    return cleared
  }, [commitEphemeral])

  const activateAccount = useCallback(() => {
    if (!persistBAccountSession({ account: "ACC-ACTIVE", returnTo: null })) return false
    commitEphemeral((current) => ({ ...current, account: "ACC-ACTIVE", accountReturnTo: null }))
    return true
  }, [commitEphemeral])

  const completeAccountSave = useCallback((): "saved" | "save_failed" | "account_failed" => {
    const returnTo = stateRef.current.accountReturnTo
    const consumed = returnTo ? consumeBAccountReturnTo(returnTo) : null
    if (!consumed || !activateAccount()) return "account_failed"
    return persistCanonicalSavedVenue(consumed.venueId, false) ? "saved" : "save_failed"
  }, [activateAccount, persistCanonicalSavedVenue])

  const actions = useMemo<OndoBActions>(() => ({
    setLocale: (locale) => {
      const saved = commit((current) => ({ ...current, locale }))
      if (!saved) notify(DEVICE_MESSAGE.locale[stateRef.current.locale])
      return saved
    },
    setTab: (tab) => commitEphemeral((current) => ({
      ...current,
      tab,
      surface: tab === "ondo" ? current.surface : { kind: "map" },
      commerceOrigin: tab === "id" ? current.commerceOrigin : null,
    })),
    setSurface: (surface) => commitEphemeral((current) => ({
      ...current,
      surface: surface.kind === "map" || surface.kind === "labs"
        ? surface
        : surface.kind === "venue" && isCanonicalVenueId(surface.venueId)
          ? surface
          : surface.kind === "editorial_place" && isEditorialPlaceId(surface.editorialPlaceId)
            ? surface
            : { kind: "map" },
    })),
    setPersona: (persona) => {
      const saved = commit((current) => ({ ...current, persona }))
      if (!saved) notify(DEVICE_MESSAGE.persona[stateRef.current.locale])
      return saved
    },
    setDiscoveryPreferences: (discoveryPreferences) => {
      const saved = commit((current) => ({ ...current, discoveryPreferences }))
      if (!saved) notify(DEVICE_MESSAGE.choices[stateRef.current.locale])
      return saved
    },
    resetDiscoveryPreferences: () => {
      if (!commit((current) => ({ ...current, discoveryPreferences: [] }))) notify(DEVICE_MESSAGE.clearChoices[stateRef.current.locale])
    },
    beginOnboarding: () => setState((current) => ({ ...current, onboarding: "ONB-IN-PROGRESS" })),
    completeOnboarding: (discoveryPreferences) => {
      const saved = commit((current) => ({
        ...current,
        onboarding: "ONB-COMPLETE",
        discoveryPreferences,
        tab: "ondo",
        surface: { kind: "map" },
      }))
      if (!saved) notify(DEVICE_MESSAGE.setup[stateRef.current.locale])
      return saved
    },
    skipOnboarding: () => {
      const saved = commit((current) => ({
        ...current,
        onboarding: "ONB-COMPLETE",
        persona: null,
        discoveryPreferences: [],
        tab: "ondo",
        surface: { kind: "map" },
      }))
      if (!saved) notify(DEVICE_MESSAGE.guest[stateRef.current.locale])
      return saved
    },
    resetOnboarding: () => {
      const saved = commit((current) => ({
        ...current,
        onboarding: "ONB-NEW",
        persona: null,
        discoveryPreferences: [],
        tab: "ondo",
        surface: { kind: "map" },
      }))
      return saved
    },
    beginAccountSave,
    cancelAccountSave,
    activateAccount,
    completeAccountSave,
    saveVenue: (venueId) => {
      if (stateRef.current.account === "ACC-ACTIVE") persistCanonicalSavedVenue(venueId, false)
      else if (!beginAccountSave(venueId)) notify(DEVICE_MESSAGE.account[stateRef.current.locale])
    },
    toggleSavedVenue: (venueId) => {
      if (stateRef.current.savedVenueIds.includes(venueId)) persistCanonicalSavedVenue(venueId, true)
      else if (stateRef.current.account === "ACC-ACTIVE") persistCanonicalSavedVenue(venueId, true)
      else if (!beginAccountSave(venueId)) notify(DEVICE_MESSAGE.account[stateRef.current.locale])
    },
    toggleSavedEditorialPlace: (editorialPlaceId) => {
      if (!isEditorialPlaceId(editorialPlaceId)) return false
      return commit((current) => ({
        ...current,
        savedEditorialPlaceIds: current.savedEditorialPlaceIds.includes(editorialPlaceId)
          ? current.savedEditorialPlaceIds.filter((id) => id !== editorialPlaceId)
          : [...current.savedEditorialPlaceIds, editorialPlaceId],
      }))
    },
    setPrivateNote: (venueId, note) => {
      if (!isCanonicalVenueId(venueId) || !stateRef.current.savedVenueIds.includes(venueId)) return false
      const normalized = note.trim().slice(0, CANONICAL_PRIVATE_NOTE_MAX_LENGTH)
      return commit((current) => {
        const privateNotesByVenue = { ...current.privateNotesByVenue }
        if (normalized) privateNotesByVenue[venueId] = normalized
        else delete privateNotesByVenue[venueId]
        return { ...current, privateNotesByVenue }
      })
    },
    openLocalSignal: (venueId) => {
      if (!isCanonicalVenueId(venueId)) return
      commitEphemeral((current) => ({
        ...current,
        localSignalDraft: current.localSignalDraft?.venueId === venueId
          ? current.localSignalDraft
          : { venueId, tags: [], note: "" },
      }))
    },
    updateLocalSignalDraft: ({ tags, note }) => {
      commitEphemeral((current) => current.localSignalDraft ? {
        ...current,
        localSignalDraft: {
          ...current.localSignalDraft,
          tags: [...new Set(tags.filter((tag): tag is OndoBLocalSignalTag => B_LOCAL_SIGNAL_TAGS.has(tag)))],
          note: note.slice(0, B_LOCAL_SIGNAL_NOTE_MAX_LENGTH),
        },
      } : current)
    },
    closeLocalSignal: () => commitEphemeral((current) => ({ ...current, localSignalDraft: null })),
    recordRecentVenue: (venueId) => {
      if (!isCanonicalVenueId(venueId)) return false
      return commit((current) => ({ ...current, recentVenueIds: recordRecentVenue(current.recentVenueIds, venueId) }))
    },
    recordRecentEditorialPlace: (editorialPlaceId) => {
      if (!isEditorialPlaceId(editorialPlaceId)) return false
      return commit((current) => ({
        ...current,
        recentEditorialPlaceIds: [editorialPlaceId, ...current.recentEditorialPlaceIds.filter((id) => id !== editorialPlaceId)].slice(0, 8),
      }))
    },
    recordPlannedTable: (tableId, venueId) => {
      const nextRefs = recordPlannedTable(stateRef.current.plannedTableRefs, tableId, venueId)
      if (!nextRefs.some((item) => item.tableId === tableId && item.venueId === venueId)) return false
      return commit((current) => ({ ...current, plannedTableRefs: recordPlannedTable(current.plannedTableRefs, tableId, venueId) }))
    },
    removePlannedTable: (tableId) => commit((current) => ({ ...current, plannedTableRefs: removePlannedTable(current.plannedTableRefs, tableId) })),
    markLocalSignalPosted: (venueId) => {
      if (!isCanonicalVenueId(venueId)) return false
      const draft = stateRef.current.localSignalDraft
      if (!draft || draft.venueId !== venueId) return false
      const safeTags = [...new Set(draft.tags.filter((tag): tag is OndoBLocalSignalTag => B_LOCAL_SIGNAL_TAGS.has(tag)))]
      if (!safeTags.length) return false
      const postedAt = new Date().toISOString()
      return commit((current) => {
        const nextLocalSignalPostedVenueIds = sanitizeLocalSignalVenueIds([venueId, ...current.localSignalPostedVenueIds.filter((id) => id !== venueId)])
        const candidateLocalPulseEvidenceByVenue = {
          ...current.localPulseEvidenceByVenue,
          [venueId]: { tags: safeTags, postedAt },
        }
        const nextLocalPulseEvidenceByVenue = Object.fromEntries(nextLocalSignalPostedVenueIds
          .filter((id) => candidateLocalPulseEvidenceByVenue[id])
          .map((id) => [id, candidateLocalPulseEvidenceByVenue[id]]))
        return {
          ...current,
          localSignalPostedVenueIds: nextLocalSignalPostedVenueIds,
          localPulseEvidenceByVenue: nextLocalPulseEvidenceByVenue,
        }
      })
    },
    acknowledgeLocalInteractionBoundary: () => commit((current) => ({ ...current, localInteractionBoundarySeen: true })),
    openIdentitySetup: (identitySetupOrigin) => commitEphemeral((current) => ({ ...current, identitySetupOrigin })),
    closeIdentitySetup: () => commitEphemeral((current) => ({ ...current, identitySetupOrigin: null })),
    completeIdentitySetup: (method) => commitEphemeral((current) => ({
      ...current,
      identityCredential: createSimulatedCredentialB(method),
    })),
    acknowledgeCommerceLocalBoundary: () => commit((current) => ({ ...current, commerceLocalBoundarySeen: true })),
    setCommerceWalletStatus: (commerceWalletStatus) => commitEphemeral((current) => ({ ...current, commerceWalletStatus })),
    dispatchCommerce: (action) => {
      const current = stateRef.current
      const commerceSession = stableCommerceBReducer(current.commerceSession, action)
      const paidNow = action.type === "PAYMENT_RETURN" && action.outcome === "success" && commerceSession.status === "paid"
      const refundedNow = action.type === "REFUND" && commerceSession.status === "refunded"
      const venueId = paidNow && current.commerceOrigin?.kind === "canonical_place"
        ? current.commerceOrigin.venueId
        : current.commerceReceiptVenueId
      const commerceReceipts = venueId && (paidNow || refundedNow)
        ? sanitizeCommerceReceipts([{
            receiptId: STABLE_B_RECEIPT_ID,
            refundReceiptId: refundedNow ? STABLE_B_REFUND_RECEIPT_ID : null,
            offerId: "meal-offer-gukbap",
            venueId,
            status: refundedNow ? "refunded" : "paid",
            paidOOKRW: commerceSession.chargedDebit,
            benefitOOKRW: commerceSession.voucherApplied ? STABLE_B_VOUCHER_VALUE : 0,
            balanceOOKRW: stableCommerceBalanceB(commerceSession),
          }, ...current.commerceReceipts])
        : current.commerceReceipts
      const next = {
        ...current,
        commerceSession,
        commerceReceiptVenueId: venueId,
        commerceReceipts,
      }
      if ((paidNow || refundedNow) && !persistBDeviceState(next)) return false
      stateRef.current = next
      setState(next)
      return true
    },
    recordCommerceReceipt: (receipt) => commit((current) => ({ ...current, commerceReceipts: sanitizeCommerceReceipts([receipt, ...current.commerceReceipts]) })),
    openMealBenefitFromPlace: (venueId) => {
      if (!isCanonicalVenueId(venueId)) return false
      commitEphemeral((current) => ({
        ...current,
        tab: "id",
        surface: { kind: "map" },
        commerceOrigin: { kind: "canonical_place", venueId },
        commerceSession: current.commerceSession,
      }))
      return true
    },
    returnFromCommerceOrigin: () => {
      const origin = stateRef.current.commerceOrigin
      if (!origin || !isCanonicalVenueId(origin.venueId)) return false
      commitEphemeral((current) => ({
        ...current,
        tab: "ondo",
        surface: { kind: "venue", venueId: origin.venueId },
        commerceOrigin: null,
      }))
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          document.querySelector<HTMLElement>("[data-testid='canonical-meal-benefit-open']")?.focus({ preventScroll: true })
        })
      })
      return true
    },
    clearBDeviceContent: () => {
      let previousLabsSession: string | null
      let previousAccountSession: string | null
      let previousActionGateSession: string | null
      let previousAfter19Preference: string | null
      let previousAfter19Session: string | null
      let previousActivityProfile: string | null
      try {
        previousLabsSession = window.sessionStorage.getItem("ondo-b.labs.v1")
        previousAccountSession = window.sessionStorage.getItem(B_ACCOUNT_SESSION_KEY)
        previousActionGateSession = window.sessionStorage.getItem(B_ACTION_GATE_SESSION_KEY)
        previousAfter19Preference = window.localStorage.getItem(GLOBAL_AFTER19_PREFERENCE_KEY)
        previousAfter19Session = window.sessionStorage.getItem(GLOBAL_AFTER19_SESSION_KEY)
        previousActivityProfile = window.sessionStorage.getItem(B_ACTIVITY_PROFILE_SESSION_KEY)
        window.sessionStorage.removeItem("ondo-b.labs.v1")
        window.sessionStorage.setItem(B_ACTION_GATE_SESSION_KEY, JSON.stringify(DEFAULT_B_ACTION_GATE_SESSION))
        window.sessionStorage.setItem(B_ACCOUNT_SESSION_KEY, JSON.stringify({ account: "ACC-GUEST", returnTo: null } satisfies BAccountSessionState))
        window.localStorage.setItem(GLOBAL_AFTER19_PREFERENCE_KEY, JSON.stringify(DEFAULT_GLOBAL_AFTER19_PREFERENCE))
        window.sessionStorage.setItem(GLOBAL_AFTER19_SESSION_KEY, JSON.stringify(DEFAULT_GLOBAL_AFTER19_SESSION))
        window.sessionStorage.setItem(B_ACTIVITY_PROFILE_SESSION_KEY, JSON.stringify(restoreBActivityProfile(null)))
      } catch {
        return false
      }
      const cleared = commit((current) => ({
        ...current,
        account: "ACC-GUEST",
        accountReturnTo: null,
        discoveryPreferences: [],
        savedVenueIds: [],
        savedEditorialPlaceIds: [],
        saveStatusByVenue: {},
        privateNotesByVenue: {},
        recentVenueIds: [],
        recentEditorialPlaceIds: [],
        plannedTableRefs: [],
        localSignalPostedVenueIds: [],
        localPulseEvidenceByVenue: {},
        localInteractionBoundarySeen: false,
        identitySetupOrigin: null,
        identityCredential: null,
        commerceLocalBoundarySeen: false,
        commerceOrigin: null,
        commerceWalletStatus: "disconnected",
        commerceSession: createStableCommerceBState(),
        commerceReceiptVenueId: null,
        commerceReceipts: [],
        localSignalDraft: null,
        surface: { kind: "map" },
      }))
      if (!cleared) {
        try {
          if (previousLabsSession == null) window.sessionStorage.removeItem("ondo-b.labs.v1")
          else window.sessionStorage.setItem("ondo-b.labs.v1", previousLabsSession)
          if (previousAccountSession == null) window.sessionStorage.removeItem(B_ACCOUNT_SESSION_KEY)
          else window.sessionStorage.setItem(B_ACCOUNT_SESSION_KEY, previousAccountSession)
          if (previousActionGateSession == null) window.sessionStorage.removeItem(B_ACTION_GATE_SESSION_KEY)
          else window.sessionStorage.setItem(B_ACTION_GATE_SESSION_KEY, previousActionGateSession)
          if (previousAfter19Preference == null) window.localStorage.removeItem(GLOBAL_AFTER19_PREFERENCE_KEY)
          else window.localStorage.setItem(GLOBAL_AFTER19_PREFERENCE_KEY, previousAfter19Preference)
          if (previousAfter19Session == null) window.sessionStorage.removeItem(GLOBAL_AFTER19_SESSION_KEY)
          else window.sessionStorage.setItem(GLOBAL_AFTER19_SESSION_KEY, previousAfter19Session)
          if (previousActivityProfile == null) window.sessionStorage.removeItem(B_ACTIVITY_PROFILE_SESSION_KEY)
          else window.sessionStorage.setItem(B_ACTIVITY_PROFILE_SESSION_KEY, previousActivityProfile)
        } catch {
          // Device content was not committed; keep the operation failed even if
          // a storage-disabled browser also prevents session rollback.
        }
      } else {
        window.dispatchEvent(new CustomEvent(B_ACTION_AXIS_SESSION_EVENT, { detail: DEFAULT_B_ACTION_GATE_SESSION }))
        window.dispatchEvent(new CustomEvent(GLOBAL_AFTER19_SESSION_EVENT, { detail: DEFAULT_GLOBAL_AFTER19_SESSION }))
        window.dispatchEvent(new CustomEvent(B_ACTIVITY_PROFILE_CLEAR_EVENT))
      }
      return cleared
    },
    notify,
  }), [activateAccount, beginAccountSave, cancelAccountSave, commit, commitEphemeral, completeAccountSave, notify, persistCanonicalSavedVenue])

  const value = useMemo(() => ({ state, actions }), [actions, state])
  return <OndoBContext.Provider value={value}>{children}</OndoBContext.Provider>
}

export function useOndoB() {
  const value = useContext(OndoBContext)
  if (!value) throw new Error("useOndoB must be used inside OndoBProvider")
  return value
}
