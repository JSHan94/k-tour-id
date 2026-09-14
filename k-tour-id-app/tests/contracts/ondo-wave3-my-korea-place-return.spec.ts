import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import {
  B_DISCOVERY_TRAVERSAL_EVENT,
  MY_KOREA_PLACE_RETURN_TRAVERSAL_EVENT,
  clearMyKoreaPlaceReturnHistory,
  closeBDiscoveryPlace,
  goBackFromBDiscovery,
  initializeBDiscoveryHistory,
  installBDiscoveryTraversalGuard,
  installMyKoreaPlaceReturnTraversalGuard,
  normalizeBDiscoveryHistoryForActiveDocument,
  openBDiscoveryAlternativeVenue,
  openBDiscoveryDetail,
  openBDiscoveryEditorialDetail,
  openMyKoreaSavedBDiscoveryEditorialPlace,
  openMyKoreaSavedBDiscoveryVenue,
  readBDiscoveryHistory,
  readMyKoreaPlaceReturnNavigation,
  readMyKoreaPlaceReturnTraversal,
  type BDiscoveryHistoryEntry,
} from "../../features/ondo/map/b-discovery-history"
import {
  MY_KOREA_PLACE_RETURN_HISTORY_KEY,
  MY_KOREA_PLACE_RETURN_MAX_SCROLL_TOP,
  MY_KOREA_SAVED_EDITORIAL_OPENER_ATTRIBUTE,
  MY_KOREA_SAVED_HEADING_ID,
  MY_KOREA_SAVED_HEADING_SELECTOR,
  MY_KOREA_SAVED_OFFICIAL_OPENER_ATTRIBUTE,
  createMyKoreaPlaceReturnJourneyId,
  createMyKoreaPlaceReturnOrigin,
  createMyKoreaPlaceReturnPlace,
  isMyKoreaPlaceReturnPair,
  isSameMyKoreaPlaceReturnSource,
  myKoreaPlaceReturnFocusTarget,
  myKoreaPlaceReturnOpenerSelector,
  readMyKoreaPlaceReturnFromHistoryState,
  sanitizeMyKoreaPlaceReturnReceipt,
  withMyKoreaPlaceReturnHistoryState,
  withoutMyKoreaPlaceReturnHistoryState,
} from "../../features/ondo/my/my-korea-place-return-b"

const VENUE_ID = "mois-0021cd596bc5b2a922ad"
const OTHER_VENUE_ID = "mois-18939eecb43c15ab4305"
const EDITORIAL_PLACE_ID = "jeju-seongsan-ilchulbong"
const OTHER_EDITORIAL_PLACE_ID = "jeju-gwangchigi-beach"
const UUID = "123e4567-e89b-42d3-a456-426614174000"
const OTHER_UUID = "223e4567-e89b-42d3-a456-426614174000"
const ORIGIN = "http://127.0.0.1:3120"

function cityEntry(city: "seoul" | "busan" | "jeju" = "seoul"): BDiscoveryHistoryEntry {
  return {
    v: 4,
    documentId: "my-korea-contract",
    level: "city",
    city,
    view: "list",
    query: city === "busan" ? "noodles" : "",
    category: city === "busan" ? "casual" : "all",
    editorialCategory: city === "jeju" ? "food" : "all",
    layer: "standard",
    sheetSnap: "closed",
    listScroll: city === "busan" ? 442 : 0,
  }
}

class ContractHistory {
  readonly entries: Array<{ state: unknown; url: string }>
  index = 0
  replaceCalls = 0
  pushCalls = 0
  readonly goCalls: number[] = []
  readonly backCalls: number[] = []
  private readonly setUrl: (url: string) => void

  constructor(state: unknown, url: string, setUrl: (url: string) => void) {
    this.entries = [{ state, url }]
    this.setUrl = setUrl
  }

  get state() { return this.entries[this.index]?.state ?? null }
  get length() { return this.entries.length }

  replaceState(state: unknown, _unused: string, url?: string | URL | null) {
    this.replaceCalls += 1
    const nextUrl = url == null ? this.entries[this.index].url : new URL(String(url), ORIGIN).href
    this.entries[this.index] = { state, url: nextUrl }
    this.setUrl(nextUrl)
  }

  pushState(state: unknown, _unused: string, url?: string | URL | null) {
    this.pushCalls += 1
    const nextUrl = url == null ? this.entries[this.index].url : new URL(String(url), ORIGIN).href
    this.entries.splice(this.index + 1, Number.POSITIVE_INFINITY, { state, url: nextUrl })
    this.index += 1
    this.setUrl(nextUrl)
  }

  back() { this.backCalls.push(-1) }
  go(delta: number) { this.goCalls.push(delta) }

  activate(index: number) {
    this.index = index
    this.setUrl(this.entries[index].url)
  }
}

class ContractPopStateEvent extends Event {
  readonly state: unknown
  constructor(state: unknown) {
    super("popstate")
    this.state = state
  }
}

function installContractBrowser(initialState: unknown, initialPath = "/?city=seoul&view=list") {
  let currentUrl = new URL(initialPath, ORIGIN)
  const eventTarget = new EventTarget()
  const history = new ContractHistory(initialState, currentUrl.href, (url) => { currentUrl = new URL(url) })
  const location = {
    get origin() { return currentUrl.origin },
    get pathname() { return currentUrl.pathname },
    get search() { return currentUrl.search },
    get hash() { return currentUrl.hash },
    get href() { return currentUrl.href },
  }
  const fakeWindow = Object.assign(eventTarget, {
    history,
    location,
    requestAnimationFrame(callback: FrameRequestCallback) { callback(0); return 1 },
    cancelAnimationFrame() {},
    setTimeout,
    clearTimeout,
  })
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window")
  const previousHistory = Object.getOwnPropertyDescriptor(globalThis, "History")
  Object.defineProperty(globalThis, "window", { configurable: true, value: fakeWindow })
  Object.defineProperty(globalThis, "History", { configurable: true, value: ContractHistory })
  return {
    fakeWindow,
    history,
    restore() {
      if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow)
      else Reflect.deleteProperty(globalThis, "window")
      if (previousHistory) Object.defineProperty(globalThis, "History", previousHistory)
      else Reflect.deleteProperty(globalThis, "History")
    },
  }
}

function officialOrigin(scrollTop = 728) {
  const journeyId = createMyKoreaPlaceReturnJourneyId(UUID)!
  return createMyKoreaPlaceReturnOrigin({
    journeyId,
    scrollTop,
    sourceKind: "official",
    venueId: VENUE_ID,
  })!
}

function editorialOrigin(scrollTop = 1_204.5) {
  const journeyId = createMyKoreaPlaceReturnJourneyId(UUID)!
  return createMyKoreaPlaceReturnOrigin({
    journeyId,
    scrollTop,
    sourceKind: "editorial",
    editorialPlaceId: EDITORIAL_PLACE_ID,
  })!
}

test("MY-RETURN-001 creates exact navigation-only official origin/place receipts and stable focus selectors", () => {
  const origin = officialOrigin()
  const place = createMyKoreaPlaceReturnPlace(origin)

  expect(origin).toEqual({
    v: 1,
    journeyId: `MYK-B-${UUID}`,
    phase: "origin",
    section: "saved",
    scrollTop: 728,
    sourceKind: "official",
    venueId: VENUE_ID,
  })
  expect(place).toEqual({ ...origin, phase: "place" })
  expect(Reflect.ownKeys(origin)).toEqual([
    "v", "journeyId", "phase", "section", "scrollTop", "sourceKind", "venueId",
  ])
  expect(JSON.stringify(origin)).not.toMatch(/locale|name|note|account|identity|credential|receipt|query/i)
  expect(isMyKoreaPlaceReturnPair(origin, place)).toBe(true)
  expect(myKoreaPlaceReturnOpenerSelector(origin)).toBe(
    `[${MY_KOREA_SAVED_OFFICIAL_OPENER_ATTRIBUTE}='${VENUE_ID}']`,
  )
  expect(myKoreaPlaceReturnFocusTarget(place)).toEqual({
    openerSelector: `[${MY_KOREA_SAVED_OFFICIAL_OPENER_ATTRIBUTE}='${VENUE_ID}']`,
    fallbackId: MY_KOREA_SAVED_HEADING_ID,
    fallbackSelector: MY_KOREA_SAVED_HEADING_SELECTOR,
  })
})

test("MY-RETURN-002 keeps editorial identity separate while sharing exact geometry semantics", () => {
  const origin = editorialOrigin()
  const place = createMyKoreaPlaceReturnPlace(origin)

  expect(origin).toEqual({
    v: 1,
    journeyId: `MYK-B-${UUID}`,
    phase: "origin",
    section: "saved",
    scrollTop: 1_204.5,
    sourceKind: "editorial",
    editorialPlaceId: EDITORIAL_PLACE_ID,
  })
  expect(place).toEqual({ ...origin, phase: "place" })
  expect(Reflect.ownKeys(origin)).toEqual([
    "v", "journeyId", "phase", "section", "scrollTop", "sourceKind", "editorialPlaceId",
  ])
  expect(isMyKoreaPlaceReturnPair(origin, place)).toBe(true)
  expect(myKoreaPlaceReturnOpenerSelector(place)).toBe(
    `[${MY_KOREA_SAVED_EDITORIAL_OPENER_ATTRIBUTE}='${EDITORIAL_PLACE_ID}']`,
  )
})

test("MY-RETURN-003 preserves unrelated Next/history state by identity and replaces only its own namespace", () => {
  const nextInternal = { tree: ["my", "saved"], cache: { untouched: true } }
  const analyticsState = { campaign: "memory-return" }
  const forgedReceipt = { privateNote: "must not survive" }
  const historyState = {
    nextInternal,
    analyticsState,
    [MY_KOREA_PLACE_RETURN_HISTORY_KEY]: forgedReceipt,
  }
  const origin = officialOrigin()
  const merged = withMyKoreaPlaceReturnHistoryState(historyState, origin)!

  expect(merged).not.toBe(historyState)
  expect(merged.nextInternal).toBe(nextInternal)
  expect(merged.analyticsState).toBe(analyticsState)
  expect(merged[MY_KOREA_PLACE_RETURN_HISTORY_KEY]).toEqual(origin)
  expect(merged[MY_KOREA_PLACE_RETURN_HISTORY_KEY]).not.toBe(forgedReceipt)
  expect(readMyKoreaPlaceReturnFromHistoryState(merged)).toEqual(origin)
  expect(JSON.stringify(merged[MY_KOREA_PLACE_RETURN_HISTORY_KEY])).not.toContain("privateNote")

  const removed = withoutMyKoreaPlaceReturnHistoryState(merged)!
  expect(Reflect.ownKeys(removed).sort()).toEqual(["analyticsState", "nextInternal"])
  expect(removed.nextInternal).toBe(nextInternal)
  expect(removed.analyticsState).toBe(analyticsState)
  expect(readMyKoreaPlaceReturnFromHistoryState(removed)).toBeNull()
})

test("MY-RETURN-004 rejects forged, unknown, private and cross-namespace receipt shapes", () => {
  const official = officialOrigin()
  const editorial = editorialOrigin()
  const forged: unknown[] = [
    { ...official, extra: true },
    { ...official, privateNote: "secret" },
    { ...official, locale: "ko" },
    { ...official, account: { id: "private" } },
    { ...official, identityCredential: "private" },
    { ...official, editorialPlaceId: EDITORIAL_PLACE_ID },
    { ...editorial, venueId: VENUE_ID },
    { ...official, sourceKind: "editorial" },
    { ...editorial, sourceKind: "official" },
    { ...official, venueId: "mois-00000000000000000000" },
    { ...editorial, editorialPlaceId: "jeju-not-allowlisted" },
    { ...official, v: 2 },
    { ...official, section: "recent" },
    { ...official, phase: "return" },
    { ...official, journeyId: "MYK-B-not-a-uuid" },
    Object.assign(Object.create({ inherited: true }), official),
  ]

  for (const candidate of forged) {
    expect(sanitizeMyKoreaPlaceReturnReceipt(candidate)).toBeNull()
    expect(withMyKoreaPlaceReturnHistoryState({ nextInternal: {} }, candidate)).toBeNull()
    expect(myKoreaPlaceReturnOpenerSelector(candidate)).toBeNull()
  }
  expect(readMyKoreaPlaceReturnFromHistoryState({
    __proto__: { [MY_KOREA_PLACE_RETURN_HISTORY_KEY]: official },
  })).toBeNull()
  expect(createMyKoreaPlaceReturnJourneyId("not-a-uuid")).toBeNull()
  expect(createMyKoreaPlaceReturnJourneyId("123e4567-e89b-12d3-a456-426614174000")).toBeNull()
})

test("MY-RETURN-005 rejects non-finite and out-of-range scroll while preserving exact bounded values", () => {
  for (const scrollTop of [-1, Number.NaN, Number.POSITIVE_INFINITY, MY_KOREA_PLACE_RETURN_MAX_SCROLL_TOP + 0.01]) {
    expect(sanitizeMyKoreaPlaceReturnReceipt({ ...officialOrigin(), scrollTop })).toBeNull()
  }
  expect(createMyKoreaPlaceReturnOrigin({
    journeyId: createMyKoreaPlaceReturnJourneyId(UUID)!,
    scrollTop: 0,
    sourceKind: "official",
    venueId: VENUE_ID,
  })?.scrollTop).toBe(0)
  expect(createMyKoreaPlaceReturnOrigin({
    journeyId: createMyKoreaPlaceReturnJourneyId(UUID)!,
    scrollTop: MY_KOREA_PLACE_RETURN_MAX_SCROLL_TOP,
    sourceKind: "editorial",
    editorialPlaceId: EDITORIAL_PLACE_ID,
  })?.scrollTop).toBe(MY_KOREA_PLACE_RETURN_MAX_SCROLL_TOP)
})

test("MY-RETURN-006 requires the exact journey, phase, scroll and same source namespace", () => {
  const origin = officialOrigin()
  const place = createMyKoreaPlaceReturnPlace(origin)!
  const otherJourney = createMyKoreaPlaceReturnJourneyId(OTHER_UUID)!
  const otherVenue = createMyKoreaPlaceReturnOrigin({
    journeyId: origin.journeyId,
    scrollTop: origin.scrollTop,
    sourceKind: "official",
    venueId: OTHER_VENUE_ID,
  })!
  const otherEditorial = createMyKoreaPlaceReturnOrigin({
    journeyId: origin.journeyId,
    scrollTop: origin.scrollTop,
    sourceKind: "editorial",
    editorialPlaceId: OTHER_EDITORIAL_PLACE_ID,
  })!

  expect(isSameMyKoreaPlaceReturnSource(origin, place)).toBe(true)
  expect(isSameMyKoreaPlaceReturnSource(origin, otherVenue)).toBe(false)
  expect(isSameMyKoreaPlaceReturnSource(origin, otherEditorial)).toBe(false)
  expect(isMyKoreaPlaceReturnPair(origin, { ...place, journeyId: otherJourney })).toBe(false)
  expect(isMyKoreaPlaceReturnPair(origin, { ...place, scrollTop: origin.scrollTop + 1 })).toBe(false)
  expect(isMyKoreaPlaceReturnPair(origin, { ...place, venueId: OTHER_VENUE_ID })).toBe(false)
  expect(isMyKoreaPlaceReturnPair(origin, { ...place, sourceKind: "editorial", editorialPlaceId: EDITORIAL_PLACE_ID })).toBe(false)
  expect(isMyKoreaPlaceReturnPair(place, origin)).toBe(false)
  expect(createMyKoreaPlaceReturnPlace(place)).toBeNull()
})

test("MY-RETURN-007 fails closed for non-record outer state and inherited receipt keys", () => {
  const origin = officialOrigin()
  expect(withMyKoreaPlaceReturnHistoryState(["next"], origin)).toBeNull()
  expect(withMyKoreaPlaceReturnHistoryState(new Date(), origin)).toBeNull()
  expect(withoutMyKoreaPlaceReturnHistoryState(["next"])).toBeNull()
  expect(readMyKoreaPlaceReturnFromHistoryState(null)).toBeNull()
  expect(readMyKoreaPlaceReturnFromHistoryState(Object.create({
    [MY_KOREA_PLACE_RETURN_HISTORY_KEY]: origin,
  }))).toBeNull()
  expect(withMyKoreaPlaceReturnHistoryState(null, origin)).toEqual({
    [MY_KOREA_PLACE_RETURN_HISTORY_KEY]: origin,
  })
})

test("MY-RETURN-008 official My Korea entry replaces the exact origin and pushes one peek child without a city bridge", () => {
  const nextInternal = { tree: ["root", "ondo"], cache: { untouched: true } }
  const campaign = { id: "saved-memory" }
  const discovery = cityEntry("busan")
  const browser = installContractBrowser({ nextInternal, campaign, __ondoBDiscovery: discovery }, "/?city=busan&view=list&q=noodles&category=casual")
  const traversals: BDiscoveryHistoryEntry[] = []
  const onTraversal = (event: Event) => {
    traversals.push((event as CustomEvent<{ entry: BDiscoveryHistoryEntry }>).detail.entry)
  }
  browser.fakeWindow.addEventListener(B_DISCOVERY_TRAVERSAL_EVENT, onTraversal)
  try {
    expect(openMyKoreaSavedBDiscoveryVenue(VENUE_ID, "seoul", 811.25)).toBe(true)
    expect(browser.history.replaceCalls).toBe(1)
    expect(browser.history.pushCalls).toBe(1)
    expect(browser.history.length).toBe(2)

    const originState = browser.history.entries[0].state as Record<string, unknown>
    const placeState = browser.history.entries[1].state as Record<string, unknown>
    const originNavigation = readMyKoreaPlaceReturnNavigation(originState)!
    const placeNavigation = readMyKoreaPlaceReturnNavigation(placeState)!
    expect(originNavigation.entry).toEqual(discovery)
    expect(originNavigation.receipt).toMatchObject({
      phase: "origin",
      section: "saved",
      scrollTop: 811.25,
      sourceKind: "official",
      venueId: VENUE_ID,
    })
    expect(placeNavigation.entry).toMatchObject({
      level: "peek",
      city: "seoul",
      view: "map",
      query: "",
      category: "all",
      sheetSnap: "peek",
      venueId: VENUE_ID,
    })
    expect(placeNavigation.entry.editorialPlaceId).toBeUndefined()
    expect(isMyKoreaPlaceReturnPair(originNavigation.receipt, placeNavigation.receipt)).toBe(true)
    expect(originState.nextInternal).toBe(nextInternal)
    expect(placeState.nextInternal).toBe(nextInternal)
    expect(originState.campaign).toBe(campaign)
    expect(placeState.campaign).toBe(campaign)
    expect(new URL(browser.history.entries[0].url).searchParams.get("city")).toBe("busan")
    expect(new URL(browser.history.entries[1].url).searchParams.get("venueId")).toBe(VENUE_ID)
    expect(traversals).toEqual([placeNavigation.entry])
  } finally {
    browser.fakeWindow.removeEventListener(B_DISCOVERY_TRAVERSAL_EVENT, onTraversal)
    browser.restore()
  }
})

test("MY-RETURN-009 editorial and same-place origins still produce exactly one canonical peek child", () => {
  const sameEditorialDetail: BDiscoveryHistoryEntry = {
    ...cityEntry("jeju"),
    level: "detail",
    sheetSnap: "detail",
    editorialPlaceId: EDITORIAL_PLACE_ID,
  }
  const browser = installContractBrowser({ __ondoBDiscovery: sameEditorialDetail }, `/?city=jeju&view=list&editorialCategory=food&editorialPlaceId=${EDITORIAL_PLACE_ID}&detail=1`)
  try {
    expect(openMyKoreaSavedBDiscoveryEditorialPlace(EDITORIAL_PLACE_ID, 1_404)).toBe(true)
    expect(browser.history.replaceCalls).toBe(1)
    expect(browser.history.pushCalls).toBe(1)
    expect(browser.history.length).toBe(2)
    const originNavigation = readMyKoreaPlaceReturnNavigation(browser.history.entries[0].state)!
    const placeNavigation = readMyKoreaPlaceReturnNavigation(browser.history.entries[1].state)!
    expect(originNavigation.entry).toEqual(sameEditorialDetail)
    expect(placeNavigation.entry).toMatchObject({
      level: "peek",
      city: "jeju",
      view: "list",
      editorialCategory: "food",
      sheetSnap: "peek",
      editorialPlaceId: EDITORIAL_PLACE_ID,
    })
    expect(placeNavigation.entry.venueId).toBeUndefined()
    expect(placeNavigation.receipt).toMatchObject({ phase: "place", sourceKind: "editorial" })
    expect(isMyKoreaPlaceReturnPair(originNavigation.receipt, placeNavigation.receipt)).toBe(true)
    expect(new URL(browser.history.entries[1].url).searchParams.get("detail")).toBeNull()
  } finally {
    browser.restore()
  }
})

test("MY-RETURN-010 detail keeps the exact place receipt while existing Back and Close depths remain H2->H1 and H2->H0", () => {
  const browser = installContractBrowser({ __ondoBDiscovery: cityEntry("seoul") })
  try {
    expect(openMyKoreaSavedBDiscoveryVenue(VENUE_ID, "seoul", 512)).toBe(true)
    const peekReceipt = readMyKoreaPlaceReturnNavigation(browser.history.state)!.receipt
    expect(openBDiscoveryDetail(VENUE_ID)).toBe(true)
    expect(browser.history.length).toBe(3)
    const detailNavigation = readMyKoreaPlaceReturnNavigation(browser.history.state)!
    expect(detailNavigation.entry).toMatchObject({ level: "detail", sheetSnap: "detail", venueId: VENUE_ID })
    expect(detailNavigation.receipt).toEqual(peekReceipt)
    expect(goBackFromBDiscovery("detail")).toBe(true)
    expect(browser.history.backCalls).toEqual([-1])
    expect(closeBDiscoveryPlace()).toBe(true)
    expect(browser.history.goCalls).toEqual([-2])
  } finally {
    browser.restore()
  }

  const editorialBrowser = installContractBrowser({ __ondoBDiscovery: cityEntry("jeju") }, "/?city=jeju&view=list")
  try {
    expect(openMyKoreaSavedBDiscoveryEditorialPlace(EDITORIAL_PLACE_ID, 512)).toBe(true)
    expect(openBDiscoveryEditorialDetail(EDITORIAL_PLACE_ID)).toBe(true)
    expect(readMyKoreaPlaceReturnNavigation(editorialBrowser.history.state)).toMatchObject({
      entry: { level: "detail", editorialPlaceId: EDITORIAL_PLACE_ID },
      receipt: { phase: "place", sourceKind: "editorial", editorialPlaceId: EDITORIAL_PLACE_ID },
    })
  } finally {
    editorialBrowser.restore()
  }
})

test("MY-RETURN-011 invalid inputs mutate nothing and unrelated discovery clears a matching journey without touching Next state", () => {
  const nextInternal = { tree: "preserved" }
  const browser = installContractBrowser({ nextInternal, __ondoBDiscovery: cityEntry("seoul") })
  try {
    expect(openMyKoreaSavedBDiscoveryVenue("mois-00000000000000000000", "seoul", 10)).toBe(false)
    expect(openMyKoreaSavedBDiscoveryVenue(VENUE_ID, "busan", 10)).toBe(false)
    expect(openMyKoreaSavedBDiscoveryVenue(VENUE_ID, "seoul", Number.NaN)).toBe(false)
    expect(openMyKoreaSavedBDiscoveryEditorialPlace("jeju-not-allowlisted", 10)).toBe(false)
    expect(browser.history.replaceCalls).toBe(0)
    expect(browser.history.pushCalls).toBe(0)

    expect(openMyKoreaSavedBDiscoveryVenue(VENUE_ID, "seoul", 10)).toBe(true)
    expect(readMyKoreaPlaceReturnNavigation(browser.history.state)).not.toBeNull()
    expect(openBDiscoveryAlternativeVenue(VENUE_ID, OTHER_VENUE_ID)).toBe(true)
    expect(readMyKoreaPlaceReturnNavigation(browser.history.state)).toBeNull()
    expect((browser.history.state as Record<string, unknown>)[MY_KOREA_PLACE_RETURN_HISTORY_KEY]).toBeUndefined()
    expect((browser.history.state as Record<string, unknown>).nextInternal).toBe(nextInternal)
  } finally {
    browser.restore()
  }
})

test("MY-RETURN-012 normalization preserves a valid origin/place receipt but removes malformed poison", () => {
  const validOrigin = officialOrigin(620)
  const browser = installContractBrowser({
    nextInternal: { stable: true },
    __ondoBDiscovery: cityEntry("seoul"),
    [MY_KOREA_PLACE_RETURN_HISTORY_KEY]: validOrigin,
  })
  try {
    expect(normalizeBDiscoveryHistoryForActiveDocument()).not.toBeNull()
    expect(readMyKoreaPlaceReturnNavigation(browser.history.state)?.receipt).toEqual(validOrigin)

    const poisoned = { ...validOrigin, privateNote: "must be removed" }
    browser.history.entries[browser.history.index].state = {
      ...(browser.history.state as Record<string, unknown>),
      [MY_KOREA_PLACE_RETURN_HISTORY_KEY]: poisoned,
    }
    normalizeBDiscoveryHistoryForActiveDocument()
    expect((browser.history.state as Record<string, unknown>)[MY_KOREA_PLACE_RETURN_HISTORY_KEY]).toBeUndefined()
    expect(JSON.stringify(browser.history.state)).not.toContain("privateNote")
  } finally {
    browser.restore()
  }
})

test("MY-RETURN-013 origin traversal is My-only; place traversal also updates a mounted discovery consumer; malformed state falls back normally", () => {
  const origin = officialOrigin(932)
  const place = createMyKoreaPlaceReturnPlace(origin)!
  const baseEntry = cityEntry("seoul")
  const peekEntry: BDiscoveryHistoryEntry = { ...baseEntry, level: "peek", sheetSnap: "peek", venueId: VENUE_ID }
  const originState = { __ondoBDiscovery: baseEntry, [MY_KOREA_PLACE_RETURN_HISTORY_KEY]: origin }
  const placeState = { __ondoBDiscovery: peekEntry, [MY_KOREA_PLACE_RETURN_HISTORY_KEY]: place }
  const browser = installContractBrowser(originState)
  const myReceipts: unknown[] = []
  let discoveryEvents = 0
  let nativeFallbacks = 0
  const onMy = (event: Event) => { myReceipts.push(readMyKoreaPlaceReturnTraversal(event)?.receipt ?? null) }
  const onDiscovery = () => { discoveryEvents += 1 }
  const onNativeFallback = () => { nativeFallbacks += 1 }
  browser.fakeWindow.addEventListener(MY_KOREA_PLACE_RETURN_TRAVERSAL_EVENT, onMy)
  browser.fakeWindow.addEventListener(B_DISCOVERY_TRAVERSAL_EVENT, onDiscovery)
  const removeMyGuard = installMyKoreaPlaceReturnTraversalGuard()
  browser.fakeWindow.addEventListener("popstate", onNativeFallback)
  try {
    browser.fakeWindow.dispatchEvent(new ContractPopStateEvent(originState))
    expect(myReceipts).toEqual([origin])
    expect(discoveryEvents).toBe(0)
    expect(nativeFallbacks).toBe(0)

    browser.fakeWindow.dispatchEvent(new ContractPopStateEvent(placeState))
    expect(myReceipts).toEqual([origin, place])
    expect(discoveryEvents).toBe(0)

    const removeDiscoveryGuard = installBDiscoveryTraversalGuard()
    browser.fakeWindow.dispatchEvent(new ContractPopStateEvent(placeState))
    expect(myReceipts).toEqual([origin, place, place])
    expect(discoveryEvents).toBe(1)
    removeDiscoveryGuard()

    const malformed = { ...origin, privateNote: "forged" }
    browser.fakeWindow.dispatchEvent(new ContractPopStateEvent({
      __ondoBDiscovery: baseEntry,
      [MY_KOREA_PLACE_RETURN_HISTORY_KEY]: malformed,
    }))
    expect(myReceipts).toHaveLength(3)
    expect(discoveryEvents).toBe(2)
    expect(nativeFallbacks).toBe(0)

    const mismatchedPlace = {
      ...placeState,
      __ondoBDiscovery: { ...peekEntry, venueId: OTHER_VENUE_ID },
    }
    browser.fakeWindow.dispatchEvent(new ContractPopStateEvent(mismatchedPlace))
    expect(myReceipts).toHaveLength(3)
    expect(discoveryEvents).toBe(3)
  } finally {
    removeMyGuard()
    browser.fakeWindow.removeEventListener(MY_KOREA_PLACE_RETURN_TRAVERSAL_EVENT, onMy)
    browser.fakeWindow.removeEventListener(B_DISCOVERY_TRAVERSAL_EVENT, onDiscovery)
    browser.fakeWindow.removeEventListener("popstate", onNativeFallback)
    browser.restore()
  }
})

test("MY-RETURN-014 explicit abandonment removes only the My journey and shell orders scroll before exact focus", () => {
  const origin = officialOrigin(451)
  const nextInternal = { tree: { segment: "my" } }
  const browser = installContractBrowser({
    nextInternal,
    __ondoBDiscovery: cityEntry("seoul"),
    [MY_KOREA_PLACE_RETURN_HISTORY_KEY]: origin,
  })
  try {
    const beforeUrl = browser.history.entries[0].url
    expect(clearMyKoreaPlaceReturnHistory()).toBe(true)
    expect(readMyKoreaPlaceReturnNavigation(browser.history.state)).toBeNull()
    expect((browser.history.state as Record<string, unknown>).nextInternal).toBe(nextInternal)
    expect(browser.history.entries[0].url).toBe(beforeUrl)
    expect(browser.history.replaceCalls).toBe(1)
    expect(browser.history.pushCalls).toBe(1)
    expect(browser.history.entries).toHaveLength(2)
    expect(browser.history.entries.every(({ state }) => !Object.prototype.hasOwnProperty.call(state, MY_KOREA_PLACE_RETURN_HISTORY_KEY))).toBe(true)
    expect(clearMyKoreaPlaceReturnHistory()).toBe(false)
  } finally {
    browser.restore()
  }

  const shell = readFileSync("features/ondo/app/ondo-app-b.tsx", "utf8")
  const savedEntry = readFileSync("features/ondo/my/saved-entry-b.tsx", "utf8")
  const scrollCapture = shell.indexOf("scrollPositions.current.my = receipt.scrollTop")
  const tabReturn = shell.indexOf('actions.setTab("my")', scrollCapture)
  const exactSelector = shell.indexOf("myKoreaPlaceReturnFocusTarget(receipt)")
  const focus = shell.indexOf("target.focus({ preventScroll: true })", exactSelector)
  const secondScroll = shell.indexOf("region.scrollTop = scrollTop", focus)
  expect(scrollCapture).toBeGreaterThan(-1)
  expect(tabReturn).toBeGreaterThan(scrollCapture)
  expect(exactSelector).toBeGreaterThan(tabReturn)
  expect(focus).toBeGreaterThan(exactSelector)
  expect(secondScroll).toBeGreaterThan(focus)
  expect(shell).toContain("clearMyKoreaPlaceReturnHistory()")
  expect(savedEntry).toContain('actions.setSurface({ kind: "venue", venueId })')
  expect(savedEntry).not.toMatch(/openMyKoreaSavedBDiscoveryVenue[\s\S]{0,300}actions\.setSurface\(\{ kind: "map" \}\)/)
})

test("MY-RETURN-015 failed forward pruning restores the origin and lets the shell fail closed", () => {
  const origin = officialOrigin(333)
  const nextInternal = { tree: "untouched" }
  const initial = {
    nextInternal,
    __ondoBDiscovery: cityEntry("seoul"),
    [MY_KOREA_PLACE_RETURN_HISTORY_KEY]: origin,
  }
  const browser = installContractBrowser(initial)
  const originalPush = ContractHistory.prototype.pushState
  ContractHistory.prototype.pushState = function () { throw new Error("push blocked") }
  try {
    expect(clearMyKoreaPlaceReturnHistory()).toBe(false)
    expect(readMyKoreaPlaceReturnNavigation(browser.history.state)?.receipt).toEqual(origin)
    expect((browser.history.state as Record<string, unknown>).nextInternal).toBe(nextInternal)
    expect(browser.history.entries).toHaveLength(1)
    const shell = readFileSync("features/ondo/app/ondo-app-b.tsx", "utf8")
    expect(shell).toContain("activeMyKoreaReturn && !clearedMyKoreaReturn")
  } finally {
    ContractHistory.prototype.pushState = originalPush
    browser.restore()
  }
})

test("MY-RETURN-016 recovers a canonical current URL when Next has removed only the discovery namespace", () => {
  const nextInternal = { tree: ["root", "my"], renderedSearch: "?city=seoul&view=list" }
  const browser = installContractBrowser(
    { __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: nextInternal },
    "/?city=seoul&view=list&q=noodles&category=casual",
  )
  const traversals: BDiscoveryHistoryEntry[] = []
  const onTraversal = (event: Event) => {
    traversals.push((event as CustomEvent<{ entry: BDiscoveryHistoryEntry }>).detail.entry)
  }
  browser.fakeWindow.addEventListener(B_DISCOVERY_TRAVERSAL_EVENT, onTraversal)
  try {
    expect(readBDiscoveryHistory()).toBeNull()
    expect(openMyKoreaSavedBDiscoveryVenue(VENUE_ID, "seoul", 294)).toBe(true)
    expect(browser.history.replaceCalls).toBe(1)
    expect(browser.history.pushCalls).toBe(1)
    const origin = readMyKoreaPlaceReturnNavigation(browser.history.entries[0].state)!
    const place = readMyKoreaPlaceReturnNavigation(browser.history.entries[1].state)!
    expect(origin.entry).toMatchObject({
      level: "city",
      city: "seoul",
      view: "list",
      query: "noodles",
      category: "casual",
      sheetSnap: "closed",
    })
    expect(origin.receipt).toMatchObject({ phase: "origin", scrollTop: 294 })
    expect(place.entry).toMatchObject({ level: "peek", city: "seoul", venueId: VENUE_ID })
    expect(traversals).toEqual([place.entry])
    expect((browser.history.state as Record<string, unknown>).__PRIVATE_NEXTJS_INTERNALS_TREE).toBe(nextInternal)
  } finally {
    browser.fakeWindow.removeEventListener(B_DISCOVERY_TRAVERSAL_EVENT, onTraversal)
    browser.restore()
  }
})

test("MY-RETURN-017 URL recovery rejects ambiguous targets and never mutates a non-root route", () => {
  const ambiguous = installContractBrowser(
    { __NA: true },
    `/?city=seoul&venueId=${VENUE_ID}&editorialPlaceId=${EDITORIAL_PLACE_ID}`,
  )
  try {
    expect(openMyKoreaSavedBDiscoveryVenue(VENUE_ID, "seoul", 10)).toBe(false)
    expect(ambiguous.history.replaceCalls).toBe(0)
    expect(ambiguous.history.pushCalls).toBe(0)
  } finally {
    ambiguous.restore()
  }

  const canonicalized = installContractBrowser(
    { __NA: true },
    `/?city=seoul&venueId=${VENUE_ID}&editorialPlaceId=${EDITORIAL_PLACE_ID}`,
  )
  try {
    const initialized = initializeBDiscoveryHistory((venueId) => venueId === VENUE_ID ? "seoul" : undefined)
    expect(initialized).toMatchObject({ level: "city", city: "seoul" })
    expect(initialized.venueId).toBeUndefined()
    expect(initialized.editorialPlaceId).toBeUndefined()
    expect(new URL(canonicalized.history.entries.at(-1)!.url).searchParams.has("venueId")).toBe(false)
    expect(new URL(canonicalized.history.entries.at(-1)!.url).searchParams.has("editorialPlaceId")).toBe(false)
  } finally {
    canonicalized.restore()
  }

  const nonRoot = installContractBrowser({ __NA: true }, "/settings?city=seoul")
  try {
    expect(openMyKoreaSavedBDiscoveryVenue(VENUE_ID, "seoul", 10)).toBe(false)
    expect(nonRoot.history.replaceCalls).toBe(0)
    expect(nonRoot.history.pushCalls).toBe(0)
  } finally {
    nonRoot.restore()
  }
})
