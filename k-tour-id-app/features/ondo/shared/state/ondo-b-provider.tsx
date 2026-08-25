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

export type OndoBTab = "ondo" | "my" | "tables" | "id" | "settings"
export type OndoBSurface = { kind: "map" } | { kind: "venue"; venueId: string }
export type OndoBSaveStatus = "SAV-IDLE" | "SAV-SAVED" | "SAV-FAILED"
export type OndoBLocalSignalTag = PulseLocalSignalTagB
export type OndoBLocalSignalDraft = {
  venueId: string
  tags: OndoBLocalSignalTag[]
  note: string
}
export type OndoBCommerceOrigin = { kind: "canonical_place"; venueId: string }

export type OndoBState = {
  hydrated: boolean
  locale: OndoBLocale
  tab: OndoBTab
  surface: OndoBSurface
  onboarding: "ONB-NEW" | "ONB-IN-PROGRESS" | "ONB-COMPLETE"
  persona: OndoBPersona | null
  discoveryPreferences: OndoBDiscoveryPreference[]
  savedVenueIds: string[]
  saveStatusByVenue: Record<string, OndoBSaveStatus>
  privateNotesByVenue: Record<string, string>
  recentVenueIds: string[]
  plannedTableRefs: OndoBPlannedTableRef[]
  localSignalPostedVenueIds: string[]
  localPulseEvidenceByVenue: Record<string, PulseLocalEvidenceB>
  localInteractionBoundarySeen: boolean
  commerceLocalBoundarySeen: boolean
  commerceOrigin: OndoBCommerceOrigin | null
  localSignalDraft: OndoBLocalSignalDraft | null
  toast: string | null
}

export type OndoBActions = {
  setLocale(locale: OndoBLocale): void
  setTab(tab: OndoBTab): void
  setSurface(surface: OndoBSurface): void
  setPersona(persona: OndoBPersona): void
  setDiscoveryPreferences(preferences: OndoBDiscoveryPreference[]): void
  resetDiscoveryPreferences(): void
  beginOnboarding(): void
  completeOnboarding(): void
  skipOnboarding(): void
  resetOnboarding(): void
  saveVenue(venueId: string): void
  toggleSavedVenue(venueId: string): void
  setPrivateNote(venueId: string, note: string): boolean
  openLocalSignal(venueId: string): void
  updateLocalSignalDraft(update: Pick<OndoBLocalSignalDraft, "tags" | "note">): void
  closeLocalSignal(): void
  recordRecentVenue(venueId: string): boolean
  recordPlannedTable(tableId: string, venueId: string): boolean
  removePlannedTable(tableId: string): boolean
  markLocalSignalPosted(venueId: string): boolean
  acknowledgeLocalInteractionBoundary(): boolean
  acknowledgeCommerceLocalBoundary(): boolean
  openDemoMealOfferFromPlace(venueId: string): boolean
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
  privateNotesByVenue: Record<string, string>
  recentVenueIds: string[]
  plannedTableRefs: OndoBPlannedTableRef[]
  localSignalPostedVenueIds: string[]
  localPulseEvidenceByVenue: Record<string, PulseLocalEvidenceB>
  localInteractionBoundarySeen: boolean
  commerceLocalBoundarySeen: boolean
}

const B_DEVICE_KEY = "ondo-b.device.v1"
const B_PREFERENCES = new Set(ONDO_B_DISCOVERY_PREFERENCES.map((preference) => preference.id))
const ONDO_B_PERSONAS = new Set(ONDO_B_PERSONA_IDS)
const B_LOCAL_SIGNAL_TAGS = new Set<OndoBLocalSignalTag>(["calm_now", "lively_now", "quick_stop", "welcoming"])
const B_LOCAL_SIGNAL_NOTE_MAX_LENGTH = 240

function initialState(): OndoBState {
  return {
    hydrated: false,
    locale: "en",
    tab: "ondo",
    surface: { kind: "map" },
    onboarding: "ONB-NEW",
    persona: null,
    discoveryPreferences: [],
    savedVenueIds: [],
    saveStatusByVenue: {},
    privateNotesByVenue: {},
    recentVenueIds: [],
    plannedTableRefs: [],
    localSignalPostedVenueIds: [],
    localPulseEvidenceByVenue: {},
    localInteractionBoundarySeen: false,
    commerceLocalBoundarySeen: false,
    commerceOrigin: null,
    localSignalDraft: null,
    toast: null,
  }
}

function isProductionPath() {
  return typeof window !== "undefined" && window.location.pathname.replace(/\/$/, "") === "/ondo-b"
}

function restoreBDeviceState(value: unknown): OndoBDeviceState {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {}
  const savedVenueIds = sanitizeCanonicalVenueIds(record.savedVenueIds)
  const localPulseRecord = record.localPulseEvidenceByVenue && typeof record.localPulseEvidenceByVenue === "object"
    ? record.localPulseEvidenceByVenue as Record<string, unknown>
    : {}
  const localPulseEvidenceByVenue = Object.fromEntries(Object.entries(localPulseRecord).flatMap(([venueId, value]) => {
    if (!isCanonicalVenueId(venueId) || !value || typeof value !== "object") return []
    const evidence = value as Record<string, unknown>
    const tags = Array.isArray(evidence.tags)
      ? [...new Set(evidence.tags.filter((tag): tag is OndoBLocalSignalTag => B_LOCAL_SIGNAL_TAGS.has(tag as OndoBLocalSignalTag)))]
      : []
    const postedAt = typeof evidence.postedAt === "string" && !Number.isNaN(Date.parse(evidence.postedAt)) ? evidence.postedAt : null
    return tags.length && postedAt ? [[venueId, { tags, postedAt } satisfies PulseLocalEvidenceB]] : []
  }))
  return {
    locale: record.locale === "ko" ? "ko" : "en",
    onboarding: record.onboarding === "ONB-COMPLETE" ? "ONB-COMPLETE" : "ONB-NEW",
    persona: ONDO_B_PERSONAS.has(record.persona as OndoBPersona)
      ? record.persona as OndoBPersona
      : null,
    discoveryPreferences: Array.isArray(record.discoveryPreferences)
      ? [...new Set(record.discoveryPreferences.filter((item): item is OndoBDiscoveryPreference => B_PREFERENCES.has(item as OndoBDiscoveryPreference)))]
      : [],
    savedVenueIds,
    privateNotesByVenue: sanitizeCanonicalVenueNotes(record.privateNotesByVenue, savedVenueIds),
    recentVenueIds: sanitizeRecentVenueIds(record.recentVenueIds),
    plannedTableRefs: sanitizePlannedTableRefs(record.plannedTableRefs),
    localSignalPostedVenueIds: sanitizeLocalSignalVenueIds(record.localSignalPostedVenueIds),
    localPulseEvidenceByVenue,
    localInteractionBoundarySeen: record.localInteractionBoundarySeen === true,
    commerceLocalBoundarySeen: record.commerceLocalBoundarySeen === true,
  }
}

function deviceState(state: OndoBState): OndoBDeviceState {
  return restoreBDeviceState({
    locale: state.locale,
    onboarding: state.onboarding,
    persona: state.persona,
    discoveryPreferences: state.discoveryPreferences,
    savedVenueIds: state.savedVenueIds,
    privateNotesByVenue: state.privateNotesByVenue,
    recentVenueIds: state.recentVenueIds,
    plannedTableRefs: state.plannedTableRefs,
    localSignalPostedVenueIds: state.localSignalPostedVenueIds,
    localPulseEvidenceByVenue: state.localPulseEvidenceByVenue,
    localInteractionBoundarySeen: state.localInteractionBoundarySeen,
    commerceLocalBoundarySeen: state.commerceLocalBoundarySeen,
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

const OndoBContext = createContext<{ state: OndoBState; actions: OndoBActions } | null>(null)

export function OndoBProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState)
  const stateRef = useRef(state)
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
      const restored = stored === null ? restoreBDeviceState({}) : restoreBDeviceState(JSON.parse(stored))
      const next: OndoBState = {
        ...blank,
        ...restored,
        saveStatusByVenue: Object.fromEntries(restored.savedVenueIds.map((venueId) => [venueId, "SAV-SAVED" as const])),
        commerceOrigin: null,
        hydrated: true,
      }
      stateRef.current = next
      setState(next)
      persistBDeviceState(next)
    } catch {
      const next = { ...blank, hydrated: true }
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
      setState((current) => ({ ...current, saveStatusByVenue: { ...current.saveStatusByVenue, [venueId]: "SAV-FAILED" } }))
      return false
    }
    const current = stateRef.current
    const alreadySaved = current.savedVenueIds.includes(venueId)
    const shouldSave = toggle ? !alreadySaved : true
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

  const actions = useMemo<OndoBActions>(() => ({
    setLocale: (locale) => {
      if (!commit((current) => ({ ...current, locale }))) notify(stateRef.current.locale === "ko" ? "언어 설정을 이 기기에 저장하지 못했어요." : "Language could not be saved on this device.")
    },
    setTab: (tab) => setState((current) => ({
      ...current,
      tab,
      surface: tab === "ondo" ? current.surface : { kind: "map" },
      commerceOrigin: tab === "id" ? current.commerceOrigin : null,
    })),
    setSurface: (surface) => setState((current) => ({
      ...current,
      surface: surface.kind === "map" || isCanonicalVenueId(surface.venueId) ? surface : { kind: "map" },
    })),
    setPersona: (persona) => {
      if (!commit((current) => ({ ...current, persona }))) notify(stateRef.current.locale === "ko" ? "이용 목적을 저장하지 못했어요." : "Intent could not be saved.")
    },
    setDiscoveryPreferences: (discoveryPreferences) => {
      if (!commit((current) => ({ ...current, discoveryPreferences }))) notify(stateRef.current.locale === "ko" ? "선택을 저장하지 못했어요." : "Choices could not be saved.")
    },
    resetDiscoveryPreferences: () => {
      if (!commit((current) => ({ ...current, discoveryPreferences: [] }))) notify(stateRef.current.locale === "ko" ? "선택을 초기화하지 못했어요." : "Choices could not be cleared.")
    },
    beginOnboarding: () => setState((current) => ({ ...current, onboarding: "ONB-IN-PROGRESS" })),
    completeOnboarding: () => {
      if (!commit((current) => ({ ...current, onboarding: "ONB-COMPLETE", tab: "ondo", surface: { kind: "map" } }))) notify(stateRef.current.locale === "ko" ? "시작 설정을 저장하지 못했어요." : "Setup could not be saved.")
    },
    skipOnboarding: () => {
      if (!commit((current) => ({
        ...current,
        onboarding: "ONB-COMPLETE",
        persona: null,
        discoveryPreferences: [],
        tab: "ondo",
        surface: { kind: "map" },
      }))) notify(stateRef.current.locale === "ko" ? "게스트 시작 설정을 저장하지 못했어요." : "Guest setup could not be saved.")
    },
    resetOnboarding: () => {
      if (!commit((current) => ({
        ...current,
        onboarding: "ONB-NEW",
        persona: null,
        discoveryPreferences: [],
        tab: "ondo",
        surface: { kind: "map" },
      }))) notify(stateRef.current.locale === "ko" ? "시작 설정을 초기화하지 못했어요." : "Setup could not be reset.")
    },
    saveVenue: (venueId) => {
      persistCanonicalSavedVenue(venueId, false)
    },
    toggleSavedVenue: (venueId) => {
      persistCanonicalSavedVenue(venueId, true)
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
      return commit((current) => ({
        ...current,
        localSignalPostedVenueIds: sanitizeLocalSignalVenueIds([venueId, ...current.localSignalPostedVenueIds.filter((id) => id !== venueId)]),
        localPulseEvidenceByVenue: {
          ...current.localPulseEvidenceByVenue,
          [venueId]: { tags: safeTags, postedAt },
        },
      }))
    },
    acknowledgeLocalInteractionBoundary: () => commit((current) => ({ ...current, localInteractionBoundarySeen: true })),
    acknowledgeCommerceLocalBoundary: () => commit((current) => ({ ...current, commerceLocalBoundarySeen: true })),
    openDemoMealOfferFromPlace: (venueId) => {
      if (!isCanonicalVenueId(venueId)) return false
      commitEphemeral((current) => ({
        ...current,
        tab: "id",
        surface: { kind: "map" },
        commerceOrigin: { kind: "canonical_place", venueId },
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
          document.querySelector<HTMLElement>("[data-testid='canonical-demo-meal-offer-open']")?.focus({ preventScroll: true })
        })
      })
      return true
    },
    clearBDeviceContent: () => commit((current) => ({
      ...current,
      discoveryPreferences: [],
      savedVenueIds: [],
      saveStatusByVenue: {},
      privateNotesByVenue: {},
      recentVenueIds: [],
      plannedTableRefs: [],
      localSignalPostedVenueIds: [],
      localPulseEvidenceByVenue: {},
      localInteractionBoundarySeen: false,
      commerceLocalBoundarySeen: false,
      commerceOrigin: null,
      localSignalDraft: null,
      surface: { kind: "map" },
    })),
    notify,
  }), [commit, commitEphemeral, notify, persistCanonicalSavedVenue])

  const value = useMemo(() => ({ state, actions }), [actions, state])
  return <OndoBContext.Provider value={value}>{children}</OndoBContext.Provider>
}

export function useOndoB() {
  const value = useContext(OndoBContext)
  if (!value) throw new Error("useOndoB must be used inside OndoBProvider")
  return value
}
