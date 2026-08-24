export type BDiscoveryCity = "seoul" | "busan"
export type BDiscoveryView = "map" | "list"
export type BDiscoveryCategory = "all" | "korean" | "casual" | "japanese" | "chinese" | "global" | "night" | "specialty"

type BDiscoveryFocus =
  | { kind: "city"; city: BDiscoveryCity }
  | { kind: "venue"; venueId: string }
  | { kind: "search" }
  | { kind: "view-toggle" }

export type BDiscoveryHistoryEntry = {
  v: 2
  documentId: string
  level: "nation" | "city" | "peek" | "detail"
  city?: BDiscoveryCity
  view: BDiscoveryView
  query: string
  category: BDiscoveryCategory
  venueId?: string
  focus?: BDiscoveryFocus
}

const HISTORY_KEY = "__ondoBDiscovery"
export const B_DISCOVERY_TRAVERSAL_EVENT = "ondo:b-discovery-traversal"
const OWNED_URL_KEYS = [
  "city", "view", "venueId", "detail", "q", "category",
  "heat", "hot", "calm", "open", "time", "neighborhood",
] as const
const RETIRED_POLICY_URL_KEY = /^after\d+(?:Return)?$/
const MAX_QUERY_LENGTH = 120
const VENUE_ID_PATTERN = /^mois-[a-z0-9]{20}$/
let activeDocumentId: string | undefined
let traversalGuardReferences = 0

export type BDiscoveryTraversalDetail = {
  entry: BDiscoveryHistoryEntry
  preservedState: unknown
}

function documentId() {
  if (typeof window === "undefined") return "server"
  activeDocumentId ??= crypto.randomUUID()
  return activeDocumentId
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value)
}

function cityValue(value: unknown): BDiscoveryCity | undefined {
  return value === "seoul" || value === "busan" ? value : undefined
}

function viewValue(value: unknown): BDiscoveryView {
  return value === "list" ? "list" : "map"
}

function categoryValue(value: unknown): BDiscoveryCategory {
  return value === "korean" || value === "casual" || value === "japanese" || value === "chinese"
    || value === "global" || value === "night" || value === "specialty"
    ? value
    : "all"
}

function venueValue(value: unknown): string | undefined {
  return typeof value === "string" && VENUE_ID_PATTERN.test(value) ? value : undefined
}

function queryValue(value: unknown): string {
  return typeof value === "string" ? value.slice(0, MAX_QUERY_LENGTH) : ""
}

function focusValue(value: unknown): BDiscoveryFocus | undefined {
  if (!isRecord(value)) return undefined
  if (value.kind === "city") {
    const city = cityValue(value.city)
    return city ? { kind: "city", city } : undefined
  }
  if (value.kind === "venue") {
    const venueId = venueValue(value.venueId)
    return venueId ? { kind: "venue", venueId } : undefined
  }
  if (value.kind === "search" || value.kind === "view-toggle") return { kind: value.kind }
  return undefined
}

function sanitizeEntry(value: unknown): BDiscoveryHistoryEntry | null {
  if (!isRecord(value) || (value.v !== 1 && value.v !== 2)) return null
  const level = value.level
  if (level !== "nation" && level !== "city" && level !== "peek" && level !== "detail") return null
  const city = cityValue(value.city)
  const venueId = venueValue(value.venueId)
  if (level !== "nation" && !city) return null
  if ((level === "peek" || level === "detail") && !venueId) return null
  return {
    v: 2,
    documentId: typeof value.documentId === "string" ? value.documentId.slice(0, 64) : "legacy",
    level,
    city,
    view: viewValue(value.view),
    query: queryValue(value.query),
    category: value.v === 2 ? categoryValue(value.category) : "all",
    venueId: level === "peek" || level === "detail" ? venueId : undefined,
    focus: focusValue(value.focus),
  }
}

function dispatchBDiscoveryTraversal(event: PopStateEvent) {
  if (window.location.pathname !== "/ondo-b") return
  const entry = readBDiscoveryHistory(event.state)
  if (!entry) return
  event.stopImmediatePropagation()
  window.dispatchEvent(new CustomEvent<BDiscoveryTraversalDetail>(B_DISCOVERY_TRAVERSAL_EVENT, {
    detail: { entry, preservedState: event.state },
  }))
}

export function installBDiscoveryTraversalGuard() {
  traversalGuardReferences += 1
  if (traversalGuardReferences === 1) window.addEventListener("popstate", dispatchBDiscoveryTraversal, { capture: true })
  return () => {
    traversalGuardReferences = Math.max(0, traversalGuardReferences - 1)
    if (traversalGuardReferences === 0) window.removeEventListener("popstate", dispatchBDiscoveryTraversal, { capture: true })
  }
}

export function readBDiscoveryTraversal(event: Event) {
  if (!(event instanceof CustomEvent) || event.type !== B_DISCOVERY_TRAVERSAL_EVENT || !isRecord(event.detail)) return null
  const entry = sanitizeEntry(event.detail.entry)
  return entry ? { entry, preservedState: event.detail.preservedState } satisfies BDiscoveryTraversalDetail : null
}

function mergedState(entry: BDiscoveryHistoryEntry, preservedState?: unknown) {
  const preserved = isRecord(preservedState) ? preservedState : {}
  const current = isRecord(window.history.state) ? window.history.state : {}
  return { ...preserved, ...current, [HISTORY_KEY]: entry }
}

function entryUrl(entry: BDiscoveryHistoryEntry) {
  const url = new URL(window.location.href)
  for (const key of OWNED_URL_KEYS) url.searchParams.delete(key)
  for (const key of [...url.searchParams.keys()]) {
    if (RETIRED_POLICY_URL_KEY.test(key)) url.searchParams.delete(key)
  }
  if (entry.level !== "nation" && entry.city) {
    url.searchParams.set("city", entry.city)
    if (entry.view === "list") url.searchParams.set("view", "list")
  }
  if ((entry.level === "peek" || entry.level === "detail") && entry.venueId) {
    url.searchParams.set("venueId", entry.venueId)
    if (entry.level === "detail") url.searchParams.set("detail", "1")
  }
  return `${url.pathname}${url.search}${url.hash}`
}

function replaceEntry(entry: BDiscoveryHistoryEntry, preservedState?: unknown) {
  History.prototype.replaceState.call(window.history, mergedState(entry, preservedState), "", entryUrl(entry))
}

function pushEntry(entry: BDiscoveryHistoryEntry) {
  History.prototype.pushState.call(window.history, mergedState(entry), "", entryUrl(entry))
}

export function replaceBDiscoveryUrl(url: string) {
  History.prototype.replaceState.call(window.history, window.history.state, "", url)
}

export function readBDiscoveryHistory(state?: unknown): BDiscoveryHistoryEntry | null {
  const source = state === undefined
    ? typeof window === "undefined" ? null : window.history.state
    : state
  return isRecord(source) ? sanitizeEntry(source[HISTORY_KEY]) : null
}

export function replaceBDiscoveryHistoryForActiveDocument(entry: unknown, preservedState?: unknown) {
  const existing = sanitizeEntry(entry)
  if (!existing) return null
  const currentDocumentId = documentId()
  const current: BDiscoveryHistoryEntry = existing.documentId === currentDocumentId
    ? existing
    : { ...existing, documentId: currentDocumentId, query: "", category: "all" }
  replaceEntry(current, preservedState)
  return current
}

export function normalizeBDiscoveryHistoryForActiveDocument() {
  const existing = readBDiscoveryHistory()
  if (!existing) return null
  const currentDocumentId = documentId()
  if (existing.documentId === currentDocumentId && existing.v === 2) return existing
  return replaceBDiscoveryHistoryForActiveDocument(existing)
}

export function initializeBDiscoveryHistory(venueCity: (venueId: string) => BDiscoveryCity | undefined) {
  const existing = normalizeBDiscoveryHistoryForActiveDocument()
  if (existing) return existing

  const url = new URL(window.location.href)
  const requestedVenueId = venueValue(url.searchParams.get("venueId"))
  const resolvedVenueCity = requestedVenueId ? venueCity(requestedVenueId) : undefined
  const requestedCity = resolvedVenueCity ?? cityValue(url.searchParams.get("city"))
  const requestedView = viewValue(url.searchParams.get("view"))
  const requestedCategory = categoryValue(url.searchParams.get("category"))
  const wantsDetail = url.searchParams.get("detail") === "1"
  const nation: BDiscoveryHistoryEntry = { v: 2, documentId: documentId(), level: "nation", view: "map", query: "", category: "all" }
  replaceEntry(nation)
  if (!requestedCity) return nation

  const city: BDiscoveryHistoryEntry = { v: 2, documentId: documentId(), level: "city", city: requestedCity, view: requestedView, query: "", category: requestedCategory, focus: { kind: "search" } }
  pushEntry(city)
  if (!requestedVenueId || !resolvedVenueCity) return city

  const peek: BDiscoveryHistoryEntry = { ...city, level: "peek", venueId: requestedVenueId, focus: undefined }
  pushEntry(peek)
  if (!wantsDetail) return peek

  const detail: BDiscoveryHistoryEntry = { ...peek, level: "detail" }
  pushEntry(detail)
  return detail
}

export function enterBDiscoveryCity(city: BDiscoveryCity) {
  const current = readBDiscoveryHistory()
  if (current?.level === "nation") replaceEntry({ ...current, focus: { kind: "city", city } })
  const next: BDiscoveryHistoryEntry = { v: 2, documentId: documentId(), level: "city", city, view: "map", query: "", category: "all", focus: { kind: "search" } }
  pushEntry(next)
  return next
}

export function replaceBDiscoveryCityContext(input: Pick<BDiscoveryHistoryEntry, "city" | "view" | "query" | "category"> & { focus?: BDiscoveryFocus }) {
  const current = readBDiscoveryHistory()
  if (current?.level !== "city" || !input.city) return current
  const next: BDiscoveryHistoryEntry = {
    v: 2,
    documentId: documentId(),
    level: "city",
    city: input.city,
    view: viewValue(input.view),
    query: queryValue(input.query),
    category: categoryValue(input.category),
    focus: input.focus ?? current.focus,
  }
  replaceEntry(next)
  return next
}

export function openBDiscoveryVenue(venueId: string) {
  const current = readBDiscoveryHistory()
  const safeVenueId = venueValue(venueId)
  if (current?.level !== "city" || !current.city || !safeVenueId) return false
  replaceEntry({ ...current, focus: { kind: "venue", venueId: safeVenueId } })
  pushEntry({ ...current, level: "peek", venueId: safeVenueId, focus: undefined })
  return true
}

export function openSavedBDiscoveryVenue(venueId: string, venueCity: BDiscoveryCity) {
  if (typeof window === "undefined" || window.location.pathname !== "/ondo-b") return false
  const safeVenueId = venueValue(venueId)
  const safeVenueCity = cityValue(venueCity)
  if (!safeVenueId || !safeVenueCity) return false

  const current = readBDiscoveryHistory()
  if (current?.level === "peek" && current.venueId === safeVenueId) return true
  if (current?.level === "detail" && current.venueId === safeVenueId) return returnToBDiscoveryPeek(safeVenueId)

  const city: BDiscoveryHistoryEntry = current?.level === "city" && current.city === safeVenueCity
    ? { ...current, focus: { kind: "venue", venueId: safeVenueId } }
    : { v: 2, documentId: documentId(), level: "city", city: safeVenueCity, view: "map", query: "", category: "all", focus: { kind: "venue", venueId: safeVenueId } }

  if (current?.level === "nation") {
    replaceEntry({ ...current, focus: { kind: "city", city: safeVenueCity } })
    pushEntry(city)
  } else if (current?.level === "city" && current.city === safeVenueCity) {
    replaceEntry(city)
  } else if (current) {
    pushEntry(city)
  } else {
    replaceEntry({ v: 2, documentId: documentId(), level: "nation", view: "map", query: "", category: "all", focus: { kind: "city", city: safeVenueCity } })
    pushEntry(city)
  }
  pushEntry({ ...city, level: "peek", venueId: safeVenueId, focus: undefined })
  return true
}

export function openBDiscoveryDetail(venueId: string) {
  const current = readBDiscoveryHistory()
  const safeVenueId = venueValue(venueId)
  if (current?.level !== "peek" || current.venueId !== safeVenueId) return false
  pushEntry({ ...current, level: "detail" })
  return true
}

export function goBackFromBDiscovery(expected: "city" | "peek" | "detail") {
  const current = readBDiscoveryHistory()
  if (current?.level !== expected) return false
  window.history.back()
  return true
}

export function returnToBDiscoveryPeek(venueId: string) {
  const current = readBDiscoveryHistory()
  if (current?.level !== "detail" || current.venueId !== venueValue(venueId)) return false
  window.history.back()
  return true
}

export function closeBDiscoveryPlace() {
  const current = readBDiscoveryHistory()
  if (current?.level !== "peek" && current?.level !== "detail") return false
  window.history.go(current.level === "detail" ? -2 : -1)
  return true
}

export function focusBDiscoveryTarget(entry: BDiscoveryHistoryEntry) {
  const focus = entry.focus
  if (!focus) return null
  if (focus.kind === "city") return document.querySelector<HTMLElement>(`[data-city='${focus.city}']`)
  if (focus.kind === "venue") {
    return document.querySelector<HTMLElement>(`[data-venue-opener='${CSS.escape(focus.venueId)}']`)
      ?? document.querySelector<HTMLElement>("[data-testid='ondo-b-view-toggle']")
  }
  if (focus.kind === "search") return document.querySelector<HTMLElement>("[data-testid='ondo-b-search']")
  return document.querySelector<HTMLElement>("[data-testid='ondo-b-view-toggle']")
}
