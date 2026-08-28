import { captureQaControls } from "../shared/ui/use-qa-controls"
import { isEditorialPlaceId, type EditorialPlaceB } from "../pulse-b/japan-first-pulse-model-b"

export type BDiscoveryCity = "seoul" | "busan" | "jeju"
export type BDiscoveryView = "map" | "list"
export type BDiscoveryCategory = "all" | "korean" | "casual" | "japanese" | "chinese" | "global" | "night" | "specialty"

type BDiscoveryFocus =
  | { kind: "city"; city: BDiscoveryCity }
  | { kind: "venue"; venueId: string }
  | { kind: "editorial-place"; editorialPlaceId: EditorialPlaceB["id"] }
  | { kind: "search" }
  | { kind: "editorial" }
  | { kind: "view-toggle" }

export type BDiscoveryHistoryEntry = {
  v: 3
  documentId: string
  level: "nation" | "city" | "peek" | "detail"
  city?: BDiscoveryCity
  view: BDiscoveryView
  query: string
  category: BDiscoveryCategory
  venueId?: string
  editorialPlaceId?: EditorialPlaceB["id"]
  focus?: BDiscoveryFocus
}

const HISTORY_KEY = "__ondoBDiscovery"
export const B_DISCOVERY_TRAVERSAL_EVENT = "ondo:b-discovery-traversal"
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
  return value === "seoul" || value === "busan" || value === "jeju" ? value : undefined
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

function editorialPlaceValue(value: unknown): EditorialPlaceB["id"] | undefined {
  return isEditorialPlaceId(value) ? value : undefined
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
  if (value.kind === "editorial-place") {
    const editorialPlaceId = editorialPlaceValue(value.editorialPlaceId)
    return editorialPlaceId ? { kind: "editorial-place", editorialPlaceId } : undefined
  }
  if (value.kind === "search" || value.kind === "editorial" || value.kind === "view-toggle") return { kind: value.kind }
  return undefined
}

function sanitizeEntry(value: unknown): BDiscoveryHistoryEntry | null {
  if (!isRecord(value) || (value.v !== 1 && value.v !== 2 && value.v !== 3)) return null
  const level = value.level
  if (level !== "nation" && level !== "city" && level !== "peek" && level !== "detail") return null
  const city = cityValue(value.city)
  const venueId = venueValue(value.venueId)
  const editorialPlaceId = editorialPlaceValue(value.editorialPlaceId)
  if (level !== "nation" && !city) return null
  if ((level === "peek" || level === "detail") && (!venueId === !editorialPlaceId)) return null
  if (editorialPlaceId && city !== "jeju") return null
  return {
    v: 3,
    documentId: typeof value.documentId === "string" ? value.documentId.slice(0, 64) : "legacy",
    level,
    city,
    view: viewValue(value.view),
    query: queryValue(value.query),
    category: value.v === 2 || value.v === 3 ? categoryValue(value.category) : "all",
    venueId: level === "peek" || level === "detail" ? venueId : undefined,
    editorialPlaceId: level === "peek" || level === "detail" ? editorialPlaceId : undefined,
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
  const url = new URL("/ondo-b", window.location.origin)
  if (entry.level !== "nation" && entry.city) {
    url.searchParams.set("city", entry.city)
    if (entry.view === "list") url.searchParams.set("view", "list")
    if (entry.query) url.searchParams.set("q", entry.query)
    if (entry.category !== "all") url.searchParams.set("category", entry.category)
  }
  if ((entry.level === "peek" || entry.level === "detail") && entry.venueId) {
    url.searchParams.set("venueId", entry.venueId)
    if (entry.level === "detail") url.searchParams.set("detail", "1")
  }
  if ((entry.level === "peek" || entry.level === "detail") && entry.editorialPlaceId) {
    url.searchParams.set("editorialPlaceId", entry.editorialPlaceId)
    if (entry.level === "detail") url.searchParams.set("detail", "1")
  }
  return `${url.pathname}${url.search}`
}

function entriesMatch(left: BDiscoveryHistoryEntry | null, right: BDiscoveryHistoryEntry) {
  if (!left) return false
  return left.v === right.v
    && left.documentId === right.documentId
    && left.level === right.level
    && left.city === right.city
    && left.view === right.view
    && left.query === right.query
    && left.category === right.category
    && left.venueId === right.venueId
    && left.editorialPlaceId === right.editorialPlaceId
    && JSON.stringify(left.focus) === JSON.stringify(right.focus)
}

function replaceEntry(entry: BDiscoveryHistoryEntry, preservedState?: unknown) {
  History.prototype.replaceState.call(window.history, mergedState(entry, preservedState), "", entryUrl(entry))
}

function pushEntry(entry: BDiscoveryHistoryEntry) {
  History.prototype.pushState.call(window.history, mergedState(entry), "", entryUrl(entry))
}

export function replaceBDiscoveryUrl(url: string) {
  const requested = new URL(url, window.location.origin)
  const current = readBDiscoveryHistory()
  const nextUrl = requested.pathname === "/ondo-b" && current
    ? entryUrl(current)
    : `${requested.pathname}${requested.search}${requested.hash}`
  History.prototype.replaceState.call(window.history, window.history.state, "", nextUrl)
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
    : { ...existing, documentId: currentDocumentId }
  // Next patches the History prototype and treats even an identical
  // replaceState call as a router reconciliation. The traversal stabilizer
  // calls this more than once by design, so keep it idempotent: rewriting an
  // already-canonical entry only creates duplicate RSC requests and can abort
  // one of them when the user immediately changes tabs.
  if (entriesMatch(readBDiscoveryHistory(), current)
    && `${window.location.pathname}${window.location.search}` === entryUrl(current)) return current
  replaceEntry(current, preservedState)
  return current
}

export function normalizeBDiscoveryHistoryForActiveDocument() {
  const existing = readBDiscoveryHistory()
  if (!existing) return null
  const currentDocumentId = documentId()
  if (existing.documentId === currentDocumentId && existing.v === 3) return existing
  return replaceBDiscoveryHistoryForActiveDocument(existing)
}

export function initializeBDiscoveryHistory(venueCity: (venueId: string) => BDiscoveryCity | undefined) {
  captureQaControls(window.location.search)
  const existing = normalizeBDiscoveryHistoryForActiveDocument()
  if (existing) return existing

  const url = new URL(window.location.href)
  const requestedVenueId = venueValue(url.searchParams.get("venueId"))
  const requestedEditorialPlaceId = editorialPlaceValue(url.searchParams.get("editorialPlaceId"))
  const resolvedVenueCity = requestedVenueId ? venueCity(requestedVenueId) : undefined
  const requestedCity = resolvedVenueCity ?? (requestedEditorialPlaceId ? "jeju" : cityValue(url.searchParams.get("city")))
  const requestedView = viewValue(url.searchParams.get("view"))
  const requestedCategory = categoryValue(url.searchParams.get("category"))
  const requestedQuery = queryValue(url.searchParams.get("q"))
  const wantsDetail = url.searchParams.get("detail") === "1"
  const nation: BDiscoveryHistoryEntry = { v: 3, documentId: documentId(), level: "nation", view: "map", query: "", category: "all" }
  replaceEntry(nation)
  if (!requestedCity) return nation

  const city: BDiscoveryHistoryEntry = {
    v: 3,
    documentId: documentId(),
    level: "city",
    city: requestedCity,
    view: requestedCity === "jeju" ? "map" : requestedView,
    query: requestedCity === "jeju" ? "" : requestedQuery,
    category: requestedCity === "jeju" ? "all" : requestedCategory,
    focus: { kind: requestedCity === "jeju" ? "editorial" : "search" },
  }
  pushEntry(city)
  if (requestedEditorialPlaceId) {
    const peek: BDiscoveryHistoryEntry = { ...city, level: "peek", editorialPlaceId: requestedEditorialPlaceId, focus: undefined }
    pushEntry(peek)
    if (!wantsDetail) return peek
    const detail: BDiscoveryHistoryEntry = { ...peek, level: "detail" }
    pushEntry(detail)
    return detail
  }
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
  const next: BDiscoveryHistoryEntry = { v: 3, documentId: documentId(), level: "city", city, view: "map", query: "", category: "all", focus: { kind: city === "jeju" ? "editorial" : "search" } }
  pushEntry(next)
  return next
}

export function replaceBDiscoveryCityContext(input: Pick<BDiscoveryHistoryEntry, "city" | "view" | "query" | "category"> & { focus?: BDiscoveryFocus }) {
  const current = readBDiscoveryHistory()
  if (current?.level !== "city" || !input.city) return current
  const next: BDiscoveryHistoryEntry = {
    v: 3,
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

export function openBDiscoveryEditorialPlace(editorialPlaceId: EditorialPlaceB["id"]) {
  const current = readBDiscoveryHistory()
  const safeEditorialPlaceId = editorialPlaceValue(editorialPlaceId)
  if (!safeEditorialPlaceId || current?.city !== "jeju") return false
  if (current.level === "peek") {
    replaceEntry({ ...current, editorialPlaceId: safeEditorialPlaceId, focus: undefined })
    return true
  }
  if (current.level !== "city") return false
  replaceEntry({ ...current, focus: { kind: "editorial-place", editorialPlaceId: safeEditorialPlaceId } })
  pushEntry({ ...current, level: "peek", editorialPlaceId: safeEditorialPlaceId, focus: undefined })
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
    : { v: 3, documentId: documentId(), level: "city", city: safeVenueCity, view: "map", query: "", category: "all", focus: { kind: "venue", venueId: safeVenueId } }

  if (current?.level === "nation") {
    replaceEntry({ ...current, focus: { kind: "city", city: safeVenueCity } })
    pushEntry(city)
  } else if (current?.level === "city" && current.city === safeVenueCity) {
    replaceEntry(city)
  } else if (current) {
    pushEntry(city)
  } else {
    replaceEntry({ v: 3, documentId: documentId(), level: "nation", view: "map", query: "", category: "all", focus: { kind: "city", city: safeVenueCity } })
    pushEntry(city)
  }
  pushEntry({ ...city, level: "peek", venueId: safeVenueId, focus: undefined })
  return true
}

export function openSavedBDiscoveryEditorialPlace(editorialPlaceId: EditorialPlaceB["id"]) {
  if (typeof window === "undefined" || window.location.pathname !== "/ondo-b") return false
  const safeEditorialPlaceId = editorialPlaceValue(editorialPlaceId)
  if (!safeEditorialPlaceId) return false
  const current = readBDiscoveryHistory()
  if (current?.level === "peek" && current.editorialPlaceId === safeEditorialPlaceId) return true
  if (current?.level === "detail" && current.editorialPlaceId === safeEditorialPlaceId) return returnToBDiscoveryEditorialPeek(safeEditorialPlaceId)
  const city: BDiscoveryHistoryEntry = current?.level === "city" && current.city === "jeju"
    ? { ...current, focus: { kind: "editorial-place", editorialPlaceId: safeEditorialPlaceId } }
    : { v: 3, documentId: documentId(), level: "city", city: "jeju", view: "map", query: "", category: "all", focus: { kind: "editorial-place", editorialPlaceId: safeEditorialPlaceId } }
  if (current?.level === "nation") {
    replaceEntry({ ...current, focus: { kind: "city", city: "jeju" } })
    pushEntry(city)
  } else if (current?.level === "city" && current.city === "jeju") replaceEntry(city)
  else if (current) pushEntry(city)
  else {
    replaceEntry({ v: 3, documentId: documentId(), level: "nation", view: "map", query: "", category: "all", focus: { kind: "city", city: "jeju" } })
    pushEntry(city)
  }
  pushEntry({ ...city, level: "peek", editorialPlaceId: safeEditorialPlaceId, focus: undefined })
  return true
}

export function openBDiscoveryDetail(venueId: string) {
  const current = readBDiscoveryHistory()
  const safeVenueId = venueValue(venueId)
  if (current?.level !== "peek" || current.venueId !== safeVenueId) return false
  pushEntry({ ...current, level: "detail" })
  return true
}

export function openBDiscoveryEditorialDetail(editorialPlaceId: EditorialPlaceB["id"]) {
  const current = readBDiscoveryHistory()
  const safeEditorialPlaceId = editorialPlaceValue(editorialPlaceId)
  if (current?.level !== "peek" || current.editorialPlaceId !== safeEditorialPlaceId) return false
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

export function returnToBDiscoveryEditorialPeek(editorialPlaceId: EditorialPlaceB["id"]) {
  const current = readBDiscoveryHistory()
  if (current?.level !== "detail" || current.editorialPlaceId !== editorialPlaceValue(editorialPlaceId)) return false
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
  if (focus.kind === "editorial-place") {
    return document.querySelector<HTMLElement>(`[data-editorial-place-opener='${CSS.escape(focus.editorialPlaceId)}']`)
      ?? document.querySelector<HTMLElement>("[data-testid='ondo-b-japan-first-discovery'] > summary")
  }
  if (focus.kind === "search") return document.querySelector<HTMLElement>("[data-testid='ondo-b-search']")
  if (focus.kind === "editorial") return document.querySelector<HTMLElement>("[data-testid='ondo-b-japan-first-discovery'] > summary")
  return document.querySelector<HTMLElement>("[data-testid='ondo-b-view-toggle']")
}
