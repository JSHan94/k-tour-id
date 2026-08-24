"use client"

import type { ReactNode } from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import {
  CANONICAL_PRIVATE_NOTE_MAX_LENGTH,
  isCanonicalVenueId,
  sanitizeCanonicalVenueIds,
  sanitizeCanonicalVenueNotes,
} from "@/lib/ondo/venues"
import type { OndoBDiscoveryPreference, OndoBLocale } from "./ondo-b-preferences"
import { ONDO_B_DISCOVERY_PREFERENCES } from "./ondo-b-preferences"

export type OndoBTab = "ondo" | "my" | "id"
export type OndoBSurface = { kind: "map" } | { kind: "venue"; venueId: string }
export type OndoBSaveStatus = "SAV-IDLE" | "SAV-SAVED" | "SAV-FAILED"

export type OndoBState = {
  hydrated: boolean
  locale: OndoBLocale
  tab: OndoBTab
  surface: OndoBSurface
  onboarding: "ONB-NEW" | "ONB-IN-PROGRESS" | "ONB-COMPLETE"
  discoveryPreferences: OndoBDiscoveryPreference[]
  savedVenueIds: string[]
  saveStatusByVenue: Record<string, OndoBSaveStatus>
  privateNotesByVenue: Record<string, string>
  toast: string | null
}

export type OndoBActions = {
  setLocale(locale: OndoBLocale): void
  setTab(tab: OndoBTab): void
  setSurface(surface: OndoBSurface): void
  setDiscoveryPreferences(preferences: OndoBDiscoveryPreference[]): void
  resetDiscoveryPreferences(): void
  beginOnboarding(): void
  completeOnboarding(): void
  saveVenue(venueId: string): void
  toggleSavedVenue(venueId: string): void
  setPrivateNote(venueId: string, note: string): boolean
  clearBDeviceContent(): boolean
  notify(message: string): void
}

type OndoBDeviceState = {
  locale: OndoBLocale
  onboarding: "ONB-NEW" | "ONB-COMPLETE"
  discoveryPreferences: OndoBDiscoveryPreference[]
  savedVenueIds: string[]
  privateNotesByVenue: Record<string, string>
}

const B_DEVICE_KEY = "ondo-b.device.v1"
const B_PREFERENCES = new Set(ONDO_B_DISCOVERY_PREFERENCES.map((preference) => preference.id))

function initialState(): OndoBState {
  return {
    hydrated: false,
    locale: "en",
    tab: "ondo",
    surface: { kind: "map" },
    onboarding: "ONB-NEW",
    discoveryPreferences: [],
    savedVenueIds: [],
    saveStatusByVenue: {},
    privateNotesByVenue: {},
    toast: null,
  }
}

function isProductionPath() {
  return typeof window !== "undefined" && window.location.pathname.replace(/\/$/, "") === "/ondo-b"
}

function restoreBDeviceState(value: unknown): OndoBDeviceState {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {}
  const savedVenueIds = sanitizeCanonicalVenueIds(record.savedVenueIds)
  return {
    locale: record.locale === "ko" ? "ko" : "en",
    onboarding: record.onboarding === "ONB-COMPLETE" ? "ONB-COMPLETE" : "ONB-NEW",
    discoveryPreferences: Array.isArray(record.discoveryPreferences)
      ? [...new Set(record.discoveryPreferences.filter((item): item is OndoBDiscoveryPreference => B_PREFERENCES.has(item as OndoBDiscoveryPreference)))]
      : [],
    savedVenueIds,
    privateNotesByVenue: sanitizeCanonicalVenueNotes(record.privateNotesByVenue, savedVenueIds),
  }
}

function deviceState(state: OndoBState): OndoBDeviceState {
  return restoreBDeviceState({
    locale: state.locale,
    onboarding: state.onboarding,
    discoveryPreferences: state.discoveryPreferences,
    savedVenueIds: state.savedVenueIds,
    privateNotesByVenue: state.privateNotesByVenue,
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
    })),
    setSurface: (surface) => setState((current) => ({
      ...current,
      surface: surface.kind === "map" || isCanonicalVenueId(surface.venueId) ? surface : { kind: "map" },
    })),
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
    clearBDeviceContent: () => commit((current) => ({
      ...current,
      discoveryPreferences: [],
      savedVenueIds: [],
      saveStatusByVenue: {},
      privateNotesByVenue: {},
      surface: { kind: "map" },
    })),
    notify,
  }), [commit, notify, persistCanonicalSavedVenue])

  const value = useMemo(() => ({ state, actions }), [actions, state])
  return <OndoBContext.Provider value={value}>{children}</OndoBContext.Provider>
}

export function useOndoB() {
  const value = useContext(OndoBContext)
  if (!value) throw new Error("useOndoB must be used inside OndoBProvider")
  return value
}
