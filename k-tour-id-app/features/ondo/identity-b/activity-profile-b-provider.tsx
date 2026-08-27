"use client"

import type { ReactNode } from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

export const B_ACTIVITY_PROFILE_SESSION_KEY = "ondo-b.activity-profile.v1"
export const B_ACTIVITY_PROFILE_CLEAR_EVENT = "ondo:b:activity-profile-clear"
const LEGACY_SESSION_KEY = "ondo.session.v3"
const MAX_ACCEPTED_EVIDENCE = 40

export type BProfileField = { value: string; consent: boolean }
export type BActivityProfile = {
  displayName: string
  from: BProfileField
  livesIn: BProfileField
  languages: { value: string[]; consent: boolean }
}
export type BReputation = {
  visit: "new" | "recent" | "repeat"
  contribution: "new" | "helpful" | "established"
  meetup: "new" | "reliable" | "established"
}
export type BActivityProfileState = {
  hydrated: boolean
  profile: BActivityProfile
  reputation: BReputation
  stamps: number
  acceptedEvidenceIds: string[]
}

type PersistResult = "accepted" | "duplicate" | "invalid" | "storage_failed"
type BActivityProfileContextValue = {
  state: BActivityProfileState
  actions: {
    updateProfile(profile: BActivityProfile): boolean
    recordUniqueVisit(evidenceId: string): PersistResult
    recordContribution(evidenceId: string): PersistResult
    recordMeetup(evidenceId: string): PersistResult
    clearSession(): boolean
  }
}

const EMPTY_PROFILE: BActivityProfile = {
  displayName: "Traveler",
  from: { value: "", consent: false },
  livesIn: { value: "", consent: false },
  languages: { value: [], consent: false },
}

const DEFAULT_STATE: BActivityProfileState = {
  hydrated: false,
  profile: EMPTY_PROFILE,
  reputation: { visit: "new", contribution: "new", meetup: "new" },
  stamps: 0,
  acceptedEvidenceIds: [],
}

const BActivityProfileContext = createContext<BActivityProfileContextValue | null>(null)

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : ""
}

function cleanStringList(value: unknown) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map((item) => cleanText(item, 30)).filter(Boolean))].slice(0, 5)
}

function cleanField(value: unknown): BProfileField {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { value: "", consent: false }
  const field = value as Record<string, unknown>
  return { value: cleanText(field.value, 60), consent: field.consent === true }
}

function cleanProfile(value: unknown): BActivityProfile {
  if (!value || typeof value !== "object" || Array.isArray(value)) return EMPTY_PROFILE
  const profile = value as Record<string, unknown>
  const languages = profile.languages && typeof profile.languages === "object" && !Array.isArray(profile.languages)
    ? profile.languages as Record<string, unknown>
    : {}
  return {
    displayName: cleanText(profile.displayName, 40) || EMPTY_PROFILE.displayName,
    from: cleanField(profile.from),
    livesIn: cleanField(profile.livesIn),
    languages: { value: cleanStringList(languages.value), consent: languages.consent === true },
  }
}

function legacyProfile(value: unknown): BActivityProfile {
  if (!value || typeof value !== "object" || Array.isArray(value)) return EMPTY_PROFILE
  const profile = value as Record<string, unknown>
  return {
    displayName: cleanText(profile.displayName, 40) || EMPTY_PROFILE.displayName,
    from: { value: cleanText(profile.from, 60), consent: profile.shareFrom === true },
    livesIn: { value: cleanText(profile.livesIn, 60), consent: profile.shareLivesIn === true },
    languages: { value: cleanStringList(profile.languages), consent: profile.shareLanguages === true },
  }
}

const VISIT = new Set<BReputation["visit"]>(["new", "recent", "repeat"])
const CONTRIBUTION = new Set<BReputation["contribution"]>(["new", "helpful", "established"])
const MEETUP = new Set<BReputation["meetup"]>(["new", "reliable", "established"])

function cleanReputation(value: unknown): BReputation {
  const reputation = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
  return {
    visit: VISIT.has(reputation.visit as BReputation["visit"]) ? reputation.visit as BReputation["visit"] : "new",
    contribution: CONTRIBUTION.has(reputation.contribution as BReputation["contribution"]) ? reputation.contribution as BReputation["contribution"] : "new",
    meetup: MEETUP.has(reputation.meetup as BReputation["meetup"]) ? reputation.meetup as BReputation["meetup"] : "new",
  }
}

function cleanEvidence(value: unknown) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((item): item is string => typeof item === "string" && /^(visit|contribution|meetup):[a-z0-9][a-z0-9:_-]{0,119}$/i.test(item)))].slice(-MAX_ACCEPTED_EVIDENCE)
}

export function restoreBActivityProfile(value: unknown): Omit<BActivityProfileState, "hydrated"> {
  const record = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
  return {
    profile: cleanProfile(record.profile),
    reputation: cleanReputation(record.reputation),
    stamps: typeof record.stamps === "number" && Number.isInteger(record.stamps) ? Math.max(0, Math.min(10, record.stamps)) : 0,
    acceptedEvidenceIds: cleanEvidence(record.acceptedEvidenceIds),
  }
}

function restoreLegacyActivityProfile(value: unknown): Omit<BActivityProfileState, "hydrated"> {
  const record = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
  return {
    profile: legacyProfile(record.profile),
    reputation: cleanReputation(record.reputation),
    stamps: typeof record.stamps === "number" && Number.isInteger(record.stamps) ? Math.max(0, Math.min(10, record.stamps)) : 0,
    acceptedEvidenceIds: cleanEvidence(record.acceptedActivityEventKeys),
  }
}

function serializable(state: BActivityProfileState) {
  return restoreBActivityProfile(state)
}

function validEvidence(kind: "visit" | "contribution" | "meetup", evidenceId: string) {
  return new RegExp(`^${kind}:[a-z0-9][a-z0-9:_-]{0,119}$`, "i").test(evidenceId)
}

export function BActivityProfileProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BActivityProfileState>(DEFAULT_STATE)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    let restored = restoreBActivityProfile(null)
    try {
      const ownRaw = window.sessionStorage.getItem(B_ACTIVITY_PROFILE_SESSION_KEY)
      if (ownRaw != null) {
        restored = restoreBActivityProfile(JSON.parse(ownRaw))
      } else {
        const legacyRaw = window.sessionStorage.getItem(LEGACY_SESSION_KEY)
        if (legacyRaw != null) {
          restored = restoreLegacyActivityProfile(JSON.parse(legacyRaw))
          // Migration is one-way and additive: the legacy value is never changed
          // or removed, and identity/payment fields are never copied into this key.
          window.sessionStorage.setItem(B_ACTIVITY_PROFILE_SESSION_KEY, JSON.stringify(restored))
        }
      }
    } catch {
      restored = restoreBActivityProfile(null)
    }
    const next = { ...restored, hydrated: true }
    stateRef.current = next
    setState(next)
  }, [])

  useEffect(() => {
    function clearFromDeviceReset() {
      const next = { ...DEFAULT_STATE, hydrated: true }
      stateRef.current = next
      setState(next)
    }
    window.addEventListener(B_ACTIVITY_PROFILE_CLEAR_EVENT, clearFromDeviceReset)
    return () => window.removeEventListener(B_ACTIVITY_PROFILE_CLEAR_EVENT, clearFromDeviceReset)
  }, [])

  const commit = useCallback((update: (current: BActivityProfileState) => BActivityProfileState) => {
    const current = stateRef.current
    const next = { ...update(current), hydrated: true }
    try {
      window.sessionStorage.setItem(B_ACTIVITY_PROFILE_SESSION_KEY, JSON.stringify(serializable(next)))
    } catch {
      return false
    }
    stateRef.current = next
    setState(next)
    return true
  }, [])

  const record = useCallback((kind: "visit" | "contribution" | "meetup", evidenceId: string): PersistResult => {
    if (!validEvidence(kind, evidenceId)) return "invalid"
    if (stateRef.current.acceptedEvidenceIds.includes(evidenceId)) return "duplicate"
    const accepted = commit((current) => {
      const acceptedEvidenceIds = [...current.acceptedEvidenceIds, evidenceId].slice(-MAX_ACCEPTED_EVIDENCE)
      if (kind === "visit") return {
        ...current,
        acceptedEvidenceIds,
        stamps: Math.min(10, current.stamps + 1),
        reputation: { ...current.reputation, visit: current.reputation.visit === "new" ? "recent" : "repeat" },
      }
      if (kind === "contribution") return {
        ...current,
        acceptedEvidenceIds,
        reputation: { ...current.reputation, contribution: current.reputation.contribution === "new" ? "helpful" : "established" },
      }
      return {
        ...current,
        acceptedEvidenceIds,
        reputation: { ...current.reputation, meetup: current.reputation.meetup === "new" ? "reliable" : "established" },
      }
    })
    return accepted ? "accepted" : "storage_failed"
  }, [commit])

  const actions = useMemo<BActivityProfileContextValue["actions"]>(() => ({
    updateProfile: (profile) => commit((current) => ({ ...current, profile: cleanProfile(profile) })),
    recordUniqueVisit: (evidenceId) => record("visit", evidenceId),
    recordContribution: (evidenceId) => record("contribution", evidenceId),
    recordMeetup: (evidenceId) => record("meetup", evidenceId),
    clearSession: () => {
      try {
        window.sessionStorage.removeItem(B_ACTIVITY_PROFILE_SESSION_KEY)
      } catch {
        return false
      }
      const next = { ...DEFAULT_STATE, hydrated: true }
      stateRef.current = next
      setState(next)
      return true
    },
  }), [commit, record])

  const value = useMemo(() => ({ state, actions }), [actions, state])
  return <BActivityProfileContext.Provider value={value}>{children}</BActivityProfileContext.Provider>
}

export function useBActivityProfile() {
  const value = useContext(BActivityProfileContext)
  if (!value) throw new Error("useBActivityProfile must be used inside BActivityProfileProvider")
  return value
}
