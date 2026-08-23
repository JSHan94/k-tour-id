"use client"

import type { ReactNode } from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { canonicalMapVenueById } from "@/lib/ondo/venues/map-data"
import type {
  AccountStatus,
  After19Mode,
  AgeStatus,
  DiscoveryPreference,
  GateKind,
  GateState,
  Locale,
  OndoTab,
  PaymentKycStatus,
  Persona,
  PersonStatus,
  PulseTable,
  ReputationSnapshot,
  ReturnToCta,
  ReturnToEnvelope,
  SaveStatus,
  Surface,
} from "../../contracts/domain"
import {
  areRequiredReturnToGatesSatisfied,
  createReturnTo,
  hasExactReturnToGatePlan,
  isReturnToUsable,
  restoreReturnTo,
} from "../../contracts/return-to"
import { applyActivityEvents, type ActivityEvent } from "../../contracts/activity"
import { TABLES } from "../../connect/table-model"

export type TableMembershipState = "none" | "requesting" | "confirmed" | "checked_in" | "completed" | "left" | "failed"

export type OndoState = {
  hydrated: boolean
  locale: Locale
  tab: OndoTab
  surface: Surface
  onboarding: "ONB-NEW" | "ONB-IN-PROGRESS" | "ONB-COMPLETE"
  persona: Persona | null
  discoveryPreferences: DiscoveryPreference[]
  guideSeen: boolean
  account: AccountStatus
  person: PersonStatus
  age: AgeStatus
  ageExpiresAt?: string
  paymentKyc: PaymentKycStatus
  autoNight: boolean
  after19: After19Mode
  after19ExpiryNotice: boolean
  gate: ReturnToEnvelope | null
  gateState: GateState
  savedVenueIds: string[]
  saveStatusByVenue: Record<string, SaveStatus>
  tableMembershipById: Record<string, TableMembershipState>
  reputation: ReputationSnapshot
  acceptedActivityEventKeys: string[]
  stamps: number
  unreadTables: number
  profile: {
    displayName: string
    from?: string
    livesIn?: string
    languages: string[]
    shareFrom: boolean
    shareLivesIn: boolean
    shareLanguages: boolean
  }
  toast: string | null
}

type BeginActionInput = {
  cta: ReturnToCta
  gates: GateKind[]
  venueId?: string
  tableId?: string
}

type OndoActions = {
  setLocale(locale: Locale): void
  setTab(tab: OndoTab): void
  setSurface(surface: Surface): void
  setPersona(persona: Persona): void
  setDiscoveryPreferences(preferences: DiscoveryPreference[]): void
  resetDiscoveryPreferences(): void
  beginOnboarding(): void
  completeOnboarding(): void
  markGuideSeen(): void
  beginAction(input: BeginActionInput): void
  setGateState(state: GateState): void
  completeGate(kind: GateKind): void
  failGate(kind: GateKind, unsupported?: boolean): void
  cancelGate(): void
  setAfter19(mode: After19Mode): void
  expireAfter19(): void
  dismissAfter19ExpiryNotice(): void
  setAutoNight(value: boolean): void
  setSaveStatus(venueId: string, status: SaveStatus): void
  setMembership(tableId: string, status: TableMembershipState): void
  updateReputation(next: Partial<ReputationSnapshot>): void
  recordActivityEvents(events: ActivityEvent[]): void
  setStamps(count: number): void
  updateProfile(profile: Partial<OndoState["profile"]>): void
  notify(message: string): void
  resetSession(): void
}

type OndoContextValue = { state: OndoState; actions: OndoActions }

const initialState: OndoState = {
  hydrated: false,
  locale: "en",
  tab: "ondo",
  surface: { kind: "map" },
  onboarding: "ONB-NEW",
  persona: null,
  discoveryPreferences: [],
  guideSeen: false,
  account: "ACC-GUEST",
  person: "PER-UNVERIFIED",
  age: "AGE-UNVERIFIED",
  paymentKyc: "PKY-NOT-STARTED",
  autoNight: true,
  after19: "A19-OFF",
  after19ExpiryNotice: false,
  gate: null,
  gateState: "idle",
  savedVenueIds: [],
  saveStatusByVenue: {},
  tableMembershipById: {},
  reputation: { identity: "unverified", visit: "new", contribution: "new", meetup: "new" },
  acceptedActivityEventKeys: [],
  stamps: 9,
  unreadTables: 0,
  profile: {
    displayName: "Daniel Kim",
    languages: ["English"],
    shareFrom: false,
    shareLivesIn: false,
    shareLanguages: false,
  },
  toast: null,
}

const LOCAL_KEY = "ondo.preferences.v3"
const SESSION_KEY = "ondo.session.v3"
const FEATURE_SESSION_KEYS = ["ondo.chat.v2", "ondo.table-outcomes.v2", "ondo.labs.v2", "ondo.accepted-visits.v2"] as const
const DISCOVERY_PREFERENCES = new Set<DiscoveryPreference>(["classic", "cafe", "late", "lively", "calm", "vegetarian", "vegan", "halal", "allergy_aware"])
const OndoContext = createContext<OndoContextValue | null>(null)

type GateSatisfactionState = Pick<OndoState, "account" | "person" | "age" | "ageExpiresAt" | "paymentKyc">

function gateSatisfied(state: GateSatisfactionState, gate: GateKind) {
  if (gate === "account") return state.account === "ACC-ACTIVE"
  if (gate === "person") return state.person === "PER-VERIFIED"
  if (gate === "payment_kyc") return state.paymentKyc === "PKY-VERIFIED"
  return state.age === "AGE-VERIFIED"
    && state.ageExpiresAt != null
    && new Date(state.ageExpiresAt).getTime() > Date.now()
}

function hasRegisteredReturnContext(envelope: ReturnToEnvelope) {
  const table = envelope.tableId ? TABLES.find((candidate) => candidate.id === envelope.tableId) : undefined
  const venueIsRegistered = envelope.venueId === undefined
    || canonicalMapVenueById(envelope.venueId) !== undefined
    || TABLES.some((candidate) => candidate.venueId === envelope.venueId)
  if (!venueIsRegistered || (envelope.tableId !== undefined && !table)) return false
  if (envelope.cta === "JOIN_TABLE") return table !== undefined && table.venueId === envelope.venueId
  return true
}

function requiredReturnToGatePlan(envelope: ReturnToEnvelope): readonly GateKind[] | null {
  if (envelope.cta === "SAVE_VENUE" || envelope.cta === "OPEN_CHAT") return ["account"]
  if (envelope.cta === "SUBMIT_LOCAL_SIGNAL") return ["account", "person"]
  if (envelope.cta === "START_CHECKOUT") return ["account", "payment_kyc"]
  if (envelope.cta === "OPEN_AFTER19") return ["age"]
  if (envelope.cta === "MINT_BADGE") return ["person"]
  if (envelope.cta === "JOIN_TABLE") {
    const table = envelope.tableId ? TABLES.find((candidate) => candidate.id === envelope.tableId) : undefined
    if (!table) return null
    const plan: GateKind[] = ["account"]
    if (table.requiresPerson) plan.push("person")
    if (table.alcohol) plan.push("age")
    return plan
  }
  return null
}

function applyReturnTo(state: OndoState, envelope: ReturnToEnvelope): OndoState {
  const requiredGatePlan = requiredReturnToGatePlan(envelope)
  if (
    !isReturnToUsable(envelope)
    || !hasRegisteredReturnContext(envelope)
    || !requiredGatePlan
    || !areRequiredReturnToGatesSatisfied(requiredGatePlan, (gate) => gateSatisfied(state, gate))
  ) {
    return { ...state, gate: null, gateState: "idle", surface: { kind: "map" } }
  }
  const consumed = { ...envelope, consumedAt: new Date().toISOString() }
  if (envelope.cta === "SAVE_VENUE" && envelope.venueId) {
    return {
      ...state,
      gate: consumed,
      gateState: "idle",
      surface: { kind: "venue", venueId: envelope.venueId },
      savedVenueIds: state.savedVenueIds.includes(envelope.venueId)
        ? state.savedVenueIds
        : [...state.savedVenueIds, envelope.venueId],
      saveStatusByVenue: { ...state.saveStatusByVenue, [envelope.venueId]: "SAV-SAVED" },
    }
  }
  if (envelope.cta === "JOIN_TABLE" && envelope.tableId) {
    return {
      ...state,
      gate: consumed,
      gateState: "idle",
      surface: { kind: "table", tableId: envelope.tableId },
      tableMembershipById: { ...state.tableMembershipById, [envelope.tableId]: "requesting" },
    }
  }
  if (envelope.cta === "OPEN_CHAT" && envelope.tableId) {
    return { ...state, gate: consumed, gateState: "idle", surface: { kind: "chat", tableId: envelope.tableId } }
  }
  if (envelope.cta === "SUBMIT_LOCAL_SIGNAL" && envelope.venueId) {
    return { ...state, gate: consumed, gateState: "idle", surface: { kind: "local_signal", venueId: envelope.venueId } }
  }
  if (envelope.cta === "START_CHECKOUT" && envelope.venueId) {
    return { ...state, gate: consumed, gateState: "idle", surface: { kind: "checkout", venueId: envelope.venueId } }
  }
  if (envelope.cta === "OPEN_AFTER19") {
    return { ...state, gate: consumed, gateState: "idle", after19: "A19-ON", tab: "ondo", surface: { kind: "map" } }
  }
  if (envelope.cta === "MINT_BADGE") {
    return { ...state, gate: consumed, gateState: "idle", tab: "id", surface: { kind: "labs" } }
  }
  return { ...state, gate: null, gateState: "idle", surface: { kind: "map" } }
}

export function OndoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState)

  useEffect(() => {
    try {
      const local = JSON.parse(window.localStorage.getItem(LOCAL_KEY) ?? "{}") as Partial<OndoState>
      const session = JSON.parse(window.sessionStorage.getItem(SESSION_KEY) ?? "{}") as Partial<OndoState>
      const restoredGate = restoreReturnTo(session.gate)
      const restoredGateState: GateSatisfactionState = {
        account: session.account ?? "ACC-GUEST",
        person: session.person ?? "PER-UNVERIFIED",
        age: session.age ?? "AGE-UNVERIFIED",
        ageExpiresAt: session.ageExpiresAt,
        paymentKyc: session.paymentKyc ?? "PKY-NOT-STARTED",
      }
      const restoredGatePlan = restoredGate ? requiredReturnToGatePlan(restoredGate) : null
      const pendingGate = restoredGate
        && restoredGatePlan
        && hasRegisteredReturnContext(restoredGate)
        && hasExactReturnToGatePlan(restoredGate, restoredGatePlan, (gate) => gateSatisfied(restoredGateState, gate))
        ? restoredGate
        : null
      const restoredAgeExpiry = typeof session.ageExpiresAt === "string" ? new Date(session.ageExpiresAt).getTime() : Number.NaN
      const after19ExpiryNotice = session.after19 === "A19-ON"
        && session.age === "AGE-VERIFIED"
        && (!Number.isFinite(restoredAgeExpiry) || restoredAgeExpiry <= Date.now())
      setState((current) => ({
        ...current,
        locale: local.locale === "ko" ? "ko" : "en",
        guideSeen: Boolean(local.guideSeen),
        autoNight: local.autoNight !== false,
        savedVenueIds: Array.isArray(local.savedVenueIds) ? local.savedVenueIds : [],
        onboarding: session.onboarding === "ONB-COMPLETE" ? "ONB-COMPLETE" : "ONB-NEW",
        persona: session.persona ?? null,
        discoveryPreferences: Array.isArray(local.discoveryPreferences)
          ? local.discoveryPreferences.filter((item): item is DiscoveryPreference => DISCOVERY_PREFERENCES.has(item as DiscoveryPreference))
          : [],
        account: session.account ?? "ACC-GUEST",
        person: session.person ?? "PER-UNVERIFIED",
        age: session.age ?? "AGE-UNVERIFIED",
        ageExpiresAt: session.ageExpiresAt,
        paymentKyc: session.paymentKyc ?? "PKY-NOT-STARTED",
        after19: session.after19 === "A19-MANUAL-OFF" ? "A19-MANUAL-OFF" : "A19-OFF",
        after19ExpiryNotice,
        gate: pendingGate,
        gateState: pendingGate && ["pending", "failed", "unsupported"].includes(session.gateState ?? "")
          ? session.gateState as GateState
          : pendingGate ? "pending" : "idle",
        tableMembershipById: session.tableMembershipById ?? {},
        reputation: session.reputation ?? current.reputation,
        acceptedActivityEventKeys: Array.isArray(session.acceptedActivityEventKeys) ? session.acceptedActivityEventKeys : [],
        stamps: typeof session.stamps === "number" ? session.stamps : 9,
        profile: {
          ...current.profile,
          ...(session.profile ?? {}),
          shareLanguages: session.profile?.shareLanguages === true,
        },
        hydrated: true,
      }))
    } catch {
      setState((current) => ({ ...current, hydrated: true }))
    }
  }, [])

  useEffect(() => {
    if (!state.hydrated) return
    const persistentGatePlan = state.gate ? requiredReturnToGatePlan(state.gate) : null
    const persistentGate = state.gate
      && persistentGatePlan
      && isReturnToUsable(state.gate)
      && hasRegisteredReturnContext(state.gate)
      && hasExactReturnToGatePlan(state.gate, persistentGatePlan, (gate) => gateSatisfied(state, gate))
      ? state.gate
      : null
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify({
      locale: state.locale,
      guideSeen: state.guideSeen,
      autoNight: state.autoNight,
      savedVenueIds: state.savedVenueIds,
      discoveryPreferences: state.discoveryPreferences,
    }))
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      onboarding: state.onboarding,
      persona: state.persona,
      account: state.account,
      person: state.person,
      age: state.age,
      ageExpiresAt: state.ageExpiresAt,
      paymentKyc: state.paymentKyc,
      after19: state.after19,
      gate: persistentGate,
      gateState: persistentGate ? state.gateState : "idle",
      tableMembershipById: state.tableMembershipById,
      reputation: state.reputation,
      acceptedActivityEventKeys: state.acceptedActivityEventKeys,
      stamps: state.stamps,
      profile: state.profile,
    }))
  }, [state])

  const notify = useCallback((message: string) => {
    setState((current) => ({ ...current, toast: message }))
    window.setTimeout(() => setState((current) => current.toast === message ? { ...current, toast: null } : current), 2200)
  }, [])

  const actions = useMemo<OndoActions>(() => ({
    setLocale: (locale) => setState((current) => ({ ...current, locale })),
    setTab: (tab) => setState((current) => ({
      ...current,
      tab,
      surface: tab === "ondo" && current.surface.kind !== "venue" ? { kind: "map" } : current.surface,
    })),
    setSurface: (surface) => setState((current) => ({ ...current, surface })),
    setPersona: (persona) => setState((current) => ({ ...current, persona })),
    setDiscoveryPreferences: (discoveryPreferences) => setState((current) => ({ ...current, discoveryPreferences })),
    resetDiscoveryPreferences: () => setState((current) => ({ ...current, discoveryPreferences: [] })),
    beginOnboarding: () => setState((current) => ({ ...current, onboarding: "ONB-IN-PROGRESS" })),
    completeOnboarding: () => setState((current) => ({ ...current, onboarding: "ONB-COMPLETE", tab: "ondo", surface: { kind: "map" } })),
    markGuideSeen: () => setState((current) => ({ ...current, guideSeen: true })),
    beginAction: (input) => setState((current) => {
      const remaining = input.gates.filter((gate) => !gateSatisfied(current, gate))
      const queue = (remaining.length ? remaining : [input.gates.at(-1) ?? "account"]) as [GateKind, ...GateKind[]]
      const envelope = createReturnTo({ ...input, gateQueue: queue })
      if (!remaining.length) return applyReturnTo(current, envelope)
      return { ...current, gate: envelope, gateState: "pending" }
    }),
    setGateState: (gateState) => setState((current) => ({ ...current, gateState })),
    completeGate: (kind) => setState((current) => {
      if (!current.gate || current.gate.activeGate !== kind) return current
      let next = current
      if (kind === "account") next = { ...next, account: "ACC-ACTIVE" }
      if (kind === "person") next = { ...next, person: "PER-VERIFIED", reputation: { ...next.reputation, identity: "verified" } }
      if (kind === "age") next = { ...next, age: "AGE-VERIFIED", ageExpiresAt: new Date(Date.now() + 86_400_000).toISOString() }
      if (kind === "payment_kyc") next = { ...next, paymentKyc: "PKY-VERIFIED" }
      const currentIndex = current.gate.gateQueue.indexOf(kind)
      const remainingQueue = current.gate.gateQueue.slice(currentIndex + 1)
      const nextGate = remainingQueue[0]
      if (nextGate) return { ...next, gate: { ...current.gate, gateQueue: remainingQueue, activeGate: nextGate }, gateState: "pending" }
      return applyReturnTo(next, current.gate)
    }),
    failGate: (kind, unsupported = false) => setState((current) => {
      if (!current.gate || current.gate.activeGate !== kind) return current
      if (kind === "account") return { ...current, account: "ACC-FAILED", gateState: "failed" }
      if (kind === "person") return { ...current, person: unsupported ? "PER-UNSUPPORTED" : "PER-FAILED", gateState: unsupported ? "unsupported" : "failed" }
      if (kind === "age") return { ...current, age: "AGE-FAILED", gateState: "failed" }
      return { ...current, paymentKyc: "PKY-FAILED", gateState: "failed" }
    }),
    cancelGate: () => setState((current) => ({ ...current, gate: null, gateState: "idle" })),
    setAfter19: (after19) => setState((current) => ({ ...current, after19, after19ExpiryNotice: after19 === "A19-ON" || after19 === "A19-PROMPT" ? false : current.after19ExpiryNotice })),
    expireAfter19: () => setState((current) => ({ ...current, after19: "A19-OFF", after19ExpiryNotice: true })),
    dismissAfter19ExpiryNotice: () => setState((current) => ({ ...current, after19ExpiryNotice: false })),
    setAutoNight: (autoNight) => setState((current) => ({ ...current, autoNight })),
    setSaveStatus: (venueId, status) => setState((current) => ({ ...current, saveStatusByVenue: { ...current.saveStatusByVenue, [venueId]: status } })),
    setMembership: (tableId, status) => setState((current) => {
      const previous = current.tableMembershipById[tableId] ?? "none"
      const becomesConfirmed = status === "confirmed" && previous !== "confirmed"
      return {
        ...current,
        tableMembershipById: { ...current.tableMembershipById, [tableId]: status },
        unreadTables: becomesConfirmed ? current.unreadTables + 1 : current.unreadTables,
      }
    }),
    updateReputation: (next) => setState((current) => ({ ...current, reputation: { ...current.reputation, ...next } })),
    recordActivityEvents: (events) => setState((current) => {
      const applied = applyActivityEvents(current.reputation, current.acceptedActivityEventKeys, events)
      return {
        ...current,
        reputation: applied.reputation,
        acceptedActivityEventKeys: applied.acceptedKeys,
      }
    }),
    setStamps: (stamps) => setState((current) => ({ ...current, stamps: Math.max(0, Math.min(10, stamps)) })),
    updateProfile: (profile) => setState((current) => ({ ...current, profile: { ...current.profile, ...profile } })),
    notify,
    resetSession: () => {
      window.sessionStorage.removeItem(SESSION_KEY)
      FEATURE_SESSION_KEYS.forEach((key) => window.sessionStorage.removeItem(key))
      setState((current) => ({ ...initialState, tab: current.tab, surface: { kind: "map" }, onboarding: current.onboarding, persona: current.persona, locale: current.locale, guideSeen: current.guideSeen, autoNight: current.autoNight, savedVenueIds: current.savedVenueIds, discoveryPreferences: current.discoveryPreferences, hydrated: true }))
    },
  }), [notify])

  const value = useMemo(() => ({ state, actions }), [actions, state])
  return <OndoContext.Provider value={value}>{children}</OndoContext.Provider>
}

export function useOndo() {
  const value = useContext(OndoContext)
  if (!value) throw new Error("useOndo must be used inside OndoProvider")
  return value
}

export function isConfirmedTable(table: PulseTable, membership?: TableMembershipState) {
  return table.status === "open" && ["confirmed", "checked_in", "completed"].includes(membership ?? "none")
}
