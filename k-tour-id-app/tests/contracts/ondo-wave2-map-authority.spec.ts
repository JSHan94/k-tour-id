import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { readBDiscoveryHistory } from "../../features/ondo/map/b-discovery-history"
import { readBDiscoveryFocusRequest } from "../../features/ondo/map/b-discovery-focus"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")
const map = source("features/ondo/map/map-entry-b.tsx")
const css = source("features/ondo/map/map-b.module.css")
const history = source("features/ondo/map/b-discovery-history.ts")
const shell = source("features/ondo/app/ondo-app-b.tsx")
const shellCss = source("features/ondo/app/ondo-shell.module.css")

test("W2-MAP-001 one MapLibre geography authority owns atlas, city, and place movement", () => {
  expect(map.match(/new Map\(/g)).toHaveLength(1)
  expect(map).toContain('className={`${styles.map} ${styles.persistentMap}`}')
  expect(map).toContain('id: "ondo-korea-land-fill"')
  expect(map).toContain('id: "ondo-korea-coastline"')
  expect(map).toContain('id: "ondo-overview-route"')
  expect(map).toContain("instance.project([coordinates.longitude, coordinates.latitude])")
  expect(map).not.toContain("KOREA_ATLAS_LANDMASS_PATHS")
  expect(map).not.toContain("data-atlas-x")
  expect(map).not.toContain("data-atlas-y")
  expect(css).not.toMatch(/\.koreaAtlas\s*>\s*svg|\.dotMap(?:\.koreaAtlas)?\s*>\s*svg/)
})

test("W2-MAP-001A first paint never exposes a fallback city rail or the unhydrated shell", () => {
  expect(shell).toContain('data-hydrated={state.hydrated ? "true" : "false"}')
  expect(shell).toContain('aria-busy={!state.hydrated ? true : undefined}')
  expect(shell).toContain('inert={!state.hydrated ? true : undefined}')
  expect(shellCss).toContain('.stage[data-hydrated="false"] .canvas')
  expect(shellCss).toContain('visibility: hidden')
  expect(css).toContain('.compatRoot:not(:has(> .persistentMap[data-map-projection-settled="true"]))')
  expect(css).toContain('visibility: hidden')
  expect(map).toContain('data-map-presentation={mapState === "error" ? "fallback"')
  expect(css).toContain('.koreaAtlas[data-map-presentation="fallback"] .cityNode')
  expect(css).toContain('visibility: visible')
  expect(css).not.toContain('bottom: 116px')
  expect(css).not.toContain('bottom: 66px')
})

test("W2-MAP-001B an unpainted personalization lens is inert and absent from the accessibility tree", () => {
  expect(map).toContain('aria-hidden={!mapInteractive ? true : undefined}')
  expect(map).toContain('inert={!mapInteractive ? true : undefined}')
  expect(map).toContain('mapInteractive={mapState === "ready" && departingCity === null}')
  const unsettledLens = css.match(/\.compatRoot:not\(:has\(> \.persistentMap\[data-map-projection-settled="true"\]\)\)[\s\S]*?\.koreaAtlas > \.preferenceSummary \{[\s\S]*?\}/)?.[0] ?? ""
  expect(unsettledLens).not.toBe("")
  expect(unsettledLens).toContain("visibility: hidden")
  expect(unsettledLens).toContain("pointer-events: none")
})

test("W2-MAP-002 city intent starts in the same event-loop turn, latest request wins, and motion is bounded", () => {
  expect(map).toContain("const CITY_FOCUS_DURATION_MS = 340")
  expect(map).toContain("const CITY_FOCUS_SETTLE_GUARD_MS = 400")
  expect(map).toContain("const NATION_RETURN_DURATION_MS = 440")
  expect(map).toContain("settleGuard = window.setTimeout(settle, CITY_FOCUS_SETTLE_GUARD_MS)")
  expect(map).toContain("selectionSequenceRef.current !== sequence")
  expect(map).toContain("queueMicrotask(() =>")
  expect(map).toContain("flushSync(() =>")
  expect(map).not.toContain("selectionFrameRef")
  expect(map).toContain("map.stop()")
  expect(map).toContain('mapContainer.dataset.cityFocusPhase = cameraReady ? "requested" : "pending"')
  expect(map).toContain("pendingCityIntentRef.current = intent")
  expect(map).toContain("const latestPendingIntent = pendingCityIntentRef.current")
  expect(map).toContain("commitCityIntent(latestPendingIntent)")
  expect(map).toContain("map.easeTo({")
  expect(map).toContain("map.jumpTo(destination)")
  expect(map).toContain('window.matchMedia("(prefers-reduced-motion: reduce)").matches')
  expect(map).not.toContain("duration: 820")
  expect(css).not.toMatch(/\.koreaAtlas\[data-departing-city\][^{]*\.cityNode[^\{]*\{[^}]*pointer-events:\s*none/s)
})

test("W2-MAP-003 geographic cores never move for presentation; only labels may offset", () => {
  expect(map).toContain('data-marker-coordinate-authority="geojson-point-no-translate"')
  expect(map).not.toContain('"circle-translate"')
  expect(map).not.toContain('"icon-translate"')
  expect(map).toContain('"text-offset"')
  expect(map).toContain("geometry: { type: \"Point\" as const, coordinates: [place.location.longitude, place.location.latitude] }")
  for (const suffix of ["", "-rising", "-warming"]) {
    expect(map).toContain(`id: \"ondo-pulse-points${suffix}\", type: \"circle\", source: \"ondo-pulse\"`)
    expect(map).toContain(`id: \"ondo-pulse-hit${suffix}\", type: \"circle\", source: \"ondo-pulse\"`)
  }
  expect(map).toContain('id: "ondo-cluster-hit", type: "circle", source: "ondo-directory"')
  expect(map).toContain('id: "ondo-points-hit", type: "circle", source: "ondo-directory"')
  expect(map.match(/"circle-radius": 22/g)?.length ?? 0).toBeGreaterThanOrEqual(2)
  expect(map).toContain('instance.on("click", "ondo-cluster-hit"')
  expect(map).toContain('instance.on("click", "ondo-points-hit"')
  expect(map).toContain('12.35, 22')
  expect(map).toContain('5, 10')
})

test("W2-MAP-004 Jeju shares temperature renderer and interaction grammar without a fabricated score", () => {
  expect(map).toContain("function toTemperatureFeatureCollection")
  expect(map).toContain('entryKind: "editorial" as const')
  expect(map).toContain('signalKind: "verified-editorial" as const')
  expect(map).toContain("pulseScore: null")
  expect(map).not.toContain("pulseScore: -1")
  expect(map).toContain('data-editorial-temperature-score={city === "jeju" ? "none" : undefined}')
  expect(map).toContain('data-temperature-model={city === "jeju" ? JEJU_EDITORIAL_TEMPERATURE.model : "curated-scored"}')
  expect(map).toContain('data-temperature-noncolor-grammar={city === "jeju" ? "coverage-density-and-pattern" : "rank-and-core-size"}')
  expect(css).toContain('@media (forced-colors: active)')
  expect(css).toContain('data-editorial-temperature-key="unscored"')
})

test("W2-MAP-005 loading enriches the cached surface, then exposes same-state List without remounting", () => {
  expect(map).toContain("const MAP_LOAD_CONTEXT_DELAY_MS = 800")
  expect(map).toContain("const MAP_LOAD_FALLBACK_DELAY_MS = 5_000")
  expect(map).toContain('data-testid="ondo-b-map-loading"')
  expect(map).toContain('data-foreground={effectiveView === "map" ? "map" : "list"}')
  expect(map).toContain('mapState === "error" || retryListForeground || mapLayoutMode === "ultra-short"')
  expect(map).toContain("setRetryListForeground(true)")
  expect(map).toContain("setRetryListForeground(false)")
  expect(map).toContain('effectiveView === "list" || mapState === "error"')
  expect(map).toContain('data-testid="ondo-b-map-retry-status"')
  const retry = map.match(/function retryMap\(\) \{([\s\S]*?)\n  \}/)?.[1] ?? ""
  expect(retry).not.toBe("")
  expect(retry).toContain("const canRetryInPlace = Boolean(")
  for (const requiredNode of [
    'getLayer("ondo-overview-city-core")',
    'getLayer("ondo-points-hit")',
    'getLayer("ondo-pulse-hit")',
    'getLayer("ondo-temperature-field")',
    'getLayer("ondo-personalized-keyline")',
    'getSource("ondo-directory")',
    'getSource("ondo-pulse")',
    'getSource("ondo-after19-lens")',
  ]) expect(retry).toContain(requiredNode)
  expect(retry).toContain("if (!map || !canRetryInPlace)")
  expect(retry.indexOf("if (!map || !canRetryInPlace)")).toBeLessThan(retry.indexOf("map.remove()"))
  expect(retry.indexOf("map.remove()")).toBeLessThan(retry.indexOf('map.once("idle", finish)'))
  expect(retry).not.toContain("setCity(")
  expect(retry).not.toContain("setQuery(")
  expect(retry).not.toContain("setCategory(")
  expect(css).toContain('.persistentMap[data-foreground="list"]')
})

test("W2-MAP-005A onboarding focus requests reuse the sole map and clean up their listener", () => {
  expect(map).toContain("B_DISCOVERY_FOCUS_EVENT")
  expect(map).toContain("readBDiscoveryFocusRequest")
  expect(map).toContain("semanticFocusSequenceRef.current !== sequence")
  expect(map).toContain("semanticFocusHandlerRef.current(request.city)")
  expect(map).toContain('window.addEventListener(B_DISCOVERY_FOCUS_EVENT, onDiscoveryFocus)')
  expect(map).toContain('window.removeEventListener(B_DISCOVERY_FOCUS_EVENT, onDiscoveryFocus)')
  expect(map).toContain("previewDiscoveryFocus(requestedCity)")
  const preview = map.match(/function previewDiscoveryFocus\(requestedCity: CityId \| null\) \{([\s\S]*?)\n  \}/)?.[1] ?? ""
  expect(preview).not.toBe("")
  expect(preview).toContain("moveMap(map, destination)")
  expect(preview).toContain("map.fitBounds(")
  expect(preview).toContain("semanticFocusSequenceRef.current === previewSequence")
  expect(preview).not.toContain("enterBDiscoveryCity")
  expect(preview).not.toContain("replaceBDiscoveryCityContext")
  expect(preview).not.toContain("replaceBDiscoveryHistoryForActiveDocument")
  expect(preview).not.toContain("setCity(")
})

test("W2-MAP-005B focus request sanitizer carries only canonical area and taste vocabulary", () => {
  expect(readBDiscoveryFocusRequest({
    city: "busan",
    source: "onboarding",
    motion: "standard",
    personalization: { intent: "short_trip", preferences: ["classic", "late", "classic"] },
  })).toEqual({
    city: "busan",
    source: "onboarding",
    motion: "standard",
    personalization: { intent: "short_trip", preferences: ["classic", "late"] },
  })
  expect(readBDiscoveryFocusRequest({
    city: "seoul",
    source: "onboarding",
    motion: "standard",
    personalization: { intent: "short_trip", preferences: ["invented-positive"] },
  })).toBeNull()
  expect(readBDiscoveryFocusRequest({ city: "daegu", source: "onboarding", motion: "standard" })).toBeNull()
})

test("W2-MAP-005C locale changes update the live map in place instead of remounting MapLibre", () => {
  expect(map.match(/new Map\(/g)).toHaveLength(1)
  expect(map).toContain("}, [actions, retryToken, state.hydrated])")
  expect(map).toContain('map.setLayoutProperty("place-labels", "text-field", ondoBasemapLabel(locale))')
  expect(map).toContain('canvas.setAttribute("aria-label", labels.map)')
  expect(map).toContain('control.setAttribute("aria-label", label)')
  expect(map).toContain("}, [locale, mapState, retryToken])")
})

test("W2-MAP-005D completed onboarding commits area only from plain nation history", () => {
  expect(map).toContain('state.onboarding === "ONB-IN-PROGRESS"')
  expect(map).not.toContain('if (state.onboarding !== "ONB-COMPLETE")')
  expect(map).toContain("replaceBDiscoveryHistoryForActiveDocument(onboardingNation, initialState)")
  expect(map).toContain('state.onboarding === "ONB-COMPLETE" && state.discoveryArea && initialized.level === "nation"')
  expect(map).toContain("enterBDiscoveryCity(state.discoveryArea)")
  expect(map).toContain('initialized.level === "city" && initialized.city !== state.discoveryArea')
  expect(map).not.toMatch(/initialized\.level\s*===\s*"(?:peek|detail)"[\s\S]{0,180}state\.discoveryArea[\s\S]{0,180}replaceBDiscoveryCityContext/)
})

test("W2-MAP-006 discovery history v4 preserves public browse state and migrates v3", () => {
  expect(history).toContain("v: 4")
  expect(history).toContain('value.v !== 1 && value.v !== 2 && value.v !== 3 && value.v !== 4')
  for (const field of ["camera", "editorialCategory", "layer", "sheetSnap", "listScroll"]) {
    expect(history).toContain(field)
  }
  expect(history).toContain("cameraValue(value.camera)")
  expect(history).toContain("sheetSnapForLevel(entry.level)")
  expect(history).toContain("listScrollValue(input.listScroll ?? current.listScroll)")
  expect(history).not.toContain('view: requestedCity === "jeju" ? "map" : requestedView')
  expect(history).not.toContain('query: requestedCity === "jeju" ? "" : requestedQuery')
  expect(history).not.toContain('category: requestedCity === "jeju" ? "all" : requestedCategory')
  const selectVenue = map.match(/function selectVenue\(venue: CanonicalMapVenue\) \{([\s\S]*?)\n  \}/)?.[1] ?? ""
  expect(selectVenue).toContain("listPanelRef.current?.scrollTop ?? pendingListScrollRef.current")
  expect(selectVenue).toContain("pendingListScrollRef.current = listScroll")
  expect(selectVenue).toContain("cameraSnapshot(mapRef.current)")
  expect(selectVenue).toContain("editorialCategory")
  expect(selectVenue).toContain("layer: after19ThemeActive")
  expect(selectVenue.indexOf("replaceBDiscoveryCityContext")).toBeLessThan(selectVenue.indexOf("openBDiscoveryVenue"))
})

test("W2-MAP-006A v4 sanitizer keeps only bounded public camera/filter/sheet/list state", () => {
  const restored = readBDiscoveryHistory({
    __ondoBDiscovery: {
      v: 4,
      documentId: "map-doc",
      level: "detail",
      city: "seoul",
      view: "list",
      query: "late noodles",
      category: "night",
      editorialCategory: "food",
      layer: "after19",
      sheetSnap: "forged",
      listScroll: 741.4,
      camera: { longitude: 126.978, latitude: 37.5665, zoom: 13.5, bearing: 4, pitch: 22, privateBearingToken: "drop" },
      venueId: "mois-0021cd596bc5b2a922ad",
      privateDraft: { note: "drop" },
    },
  })
  expect(restored).toEqual({
    v: 4,
    documentId: "map-doc",
    level: "detail",
    city: "seoul",
    view: "list",
    query: "late noodles",
    category: "night",
    editorialCategory: "food",
    layer: "after19",
    sheetSnap: "detail",
    listScroll: 741,
    camera: { longitude: 126.978, latitude: 37.5665, zoom: 13.5, bearing: 4, pitch: 22 },
    venueId: "mois-0021cd596bc5b2a922ad",
    editorialPlaceId: undefined,
    focus: undefined,
  })

  expect(readBDiscoveryHistory({
    __ondoBDiscovery: {
      v: 3,
      documentId: "legacy-map-doc",
      level: "city",
      city: "jeju",
      view: "list",
      query: "udon",
      category: "japanese",
    },
  })).toMatchObject({
    v: 4,
    city: "jeju",
    view: "list",
    query: "udon",
    category: "japanese",
    editorialCategory: "all",
    layer: "standard",
    sheetSnap: "closed",
    listScroll: 0,
  })
})

test("W2-MAP-007 discovery intent accepts current and forthcoming public vocabulary", () => {
  expect(map).toContain("type DiscoveryIntent = OndoBPersona | OndoBLegacyDiscoveryIntent")
  for (const intent of ["travelling", "preparing", "local_contributor", "short_trip", "nearby", "living"]) {
    expect(map).toContain(`${intent}:`)
  }
})
