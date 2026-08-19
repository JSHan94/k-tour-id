"use client"

import type { GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent } from "maplibre-gl"
import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, ChevronRight, Languages, List, LocateFixed, Map as MapIcon, Search, X } from "lucide-react"
import { KOREA_OUTLINE_COORDINATES } from "@/lib/map/korea-atlas-data"
import { HEAT_COLORS, HEAT_LABELS } from "@/lib/ondo/map/heat"
import { ONDO_MAP_STYLE } from "@/lib/ondo/map/ondo-map-style"
import type { CanonicalMapVenue, VenuePrimaryCategory } from "@/lib/ondo/venues"
import { CANONICAL_MAP_VENUES_COMPACT } from "@/lib/ondo/venues/map-data"
import { B_DEMO_SIGNAL_BY_VENUE_ID } from "@/lib/ondo/venues/demo-signals"
import { venueDisplayName, venueDistrictLabel } from "@/lib/ondo/venues/display"
import type { HeatLevel } from "../contracts/domain"
import { useOndo } from "../shared/state/ondo-provider"
import type { Locale } from "../contracts/domain"
import styles from "./map-b.module.css"

type CityId = "seoul" | "busan"
type ViewMode = "map" | "list"
type BMapVenue = Omit<CanonicalMapVenue, "ondoScore" | "heat"> & {
  heatLevel: HeatLevel
  ondoScore: number | null
  signalTruth: "SIMULATED" | "UNKNOWN"
}

const CITY = {
  seoul: { center: [126.987, 37.565] as [number, number], zoom: 10.5, label: { en: "Seoul", ko: "서울" } },
  busan: { center: [129.055, 35.18] as [number, number], zoom: 10.35, label: { en: "Busan", ko: "부산" } },
}

const COPY = {
  en: {
    tagline: "Where locals eat now",
    title: "Pick a city by its local food pulse.",
    body: "A quiet map of real places. Color appears only where ONDO has a food signal.",
    search: "Food place or neighborhood",
    all: "All places",
    signal: "ONDO signal",
    pending: "Signal pending",
    list: "List",
    map: "Map",
    back: "All Korea",
    places: "sourced food places",
    neutral: "Place only · signal pending",
    simulatedList: "Preview ONDO signal · Simulated",
    source: "Place coverage preview · ONDO signals are simulated",
    more: "Load 30 more",
    mapA11y: "The map is visual. Open the List for keyboard-accessible place results.",
    mapUnavailable: "The map could not load. The same sourced place list remains available.",
    retryMap: "Retry map",
    locationUnavailable: "Your location was not used. Search or choose a place from the map.",
    after19Mode: "After 19 preview places",
    contributed: "Your visit signal is recorded · Score pending",
  },
  ko: {
    tagline: "로컬이 지금 먹는 곳",
    title: "로컬 식음료 열기로 도시를 골라보세요.",
    body: "실재 장소를 담은 조용한 지도예요. ONDO 신호가 있는 곳에만 색이 나타납니다.",
    search: "가게 이름, 지역, 음식 검색",
    all: "모든 장소",
    signal: "ONDO 신호",
    pending: "신호 수집 중",
    list: "목록",
    map: "지도",
    back: "전국",
    places: "개 공식 식음료 장소",
    neutral: "장소 정보만 · 신호 수집 중",
    simulatedList: "ONDO 신호 프리뷰 · 시뮬레이션",
    source: "장소 커버리지 프리뷰 · ONDO 신호는 시뮬레이션",
    more: "30개 더 보기",
    mapA11y: "지도는 시각 정보예요. 키보드로 장소를 찾으려면 목록을 여세요.",
    mapUnavailable: "지도를 불러오지 못했어요. 같은 공식 장소 목록은 계속 볼 수 있어요.",
    retryMap: "지도 다시 불러오기",
    locationUnavailable: "현재 위치를 사용하지 않았어요. 검색하거나 지도에서 장소를 골라보세요.",
    after19Mode: "After 19 프리뷰 장소",
    contributed: "내 방문 신호 기록됨 · 점수 산출 전",
  },
} as const

const CATEGORY: Record<VenuePrimaryCategory, { en: string; ko: string }> = {
  korean: { en: "Korean food", ko: "한식" },
  casual: { en: "Casual meal", ko: "간편식" },
  japanese: { en: "Japanese food", ko: "일식" },
  chinese: { en: "Chinese food", ko: "중식" },
  global: { en: "Global food", ko: "세계 음식" },
  night: { en: "Food & drink", ko: "식음료" },
  specialty: { en: "Specialty", ko: "전문점" },
}

const B_MAP_VENUES: readonly BMapVenue[] = CANONICAL_MAP_VENUES_COMPACT.map((venue) => {
  const signal = B_DEMO_SIGNAL_BY_VENUE_ID.get(venue.id)
  return { ...venue, ondoScore: signal?.score ?? null, heatLevel: signal?.level ?? "limited", signalTruth: signal ? "SIMULATED" as const : "UNKNOWN" as const }
}).sort((left, right) => Number(right.signalTruth === "SIMULATED") - Number(left.signalTruth === "SIMULATED") || left.districtId.localeCompare(right.districtId, "ko") || left.name.ko.localeCompare(right.name.ko, "ko"))

const DOT_BOUNDS = { minLon: 125.72, maxLon: 130.95, minLat: 33.02, maxLat: 38.67 }

function pointInRing(lon: number, lat: number, ring: readonly (readonly [number, number])[]) {
  let inside = false
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const [x, y] = ring[index]
    const [previousX, previousY] = ring[previous]
    if ((y > lat) !== (previousY > lat) && lon < ((previousX - x) * (lat - y)) / (previousY - y) + x) inside = !inside
  }
  return inside
}

function pointInKorea(lon: number, lat: number) {
  return KOREA_OUTLINE_COORDINATES.some((polygon) => polygon.some((ring) => pointInRing(lon, lat, ring)))
}

const KOREA_DOTS = (() => {
  const result: Array<{ x: number; y: number }> = []
  let row = 0
  for (let y = 15; y <= 335; y += 7.5) {
    const offset = row % 2 ? 3.75 : 0
    for (let x = 26 + offset; x <= 274; x += 7.5) {
      const lon = DOT_BOUNDS.minLon + ((x - 26) / 248) * (DOT_BOUNDS.maxLon - DOT_BOUNDS.minLon)
      const lat = DOT_BOUNDS.maxLat - ((y - 15) / 320) * (DOT_BOUNDS.maxLat - DOT_BOUNDS.minLat)
      if (pointInKorea(lon, lat)) result.push({ x, y })
    }
    row += 1
  }
  return result
})()

function cityPulse(cityId: CityId) {
  const signals = CANONICAL_MAP_VENUES_COMPACT
    .filter((venue) => venue.cityId === cityId)
    .flatMap((venue) => {
      const signal = B_DEMO_SIGNAL_BY_VENUE_ID.get(venue.id)
      return signal ? [signal] : []
    })
  const ondoScore = signals.length ? Math.round(signals.reduce((sum, signal) => sum + signal.score, 0) / signals.length) : null
  const heatLevel: HeatLevel = ondoScore === null ? "limited" : ondoScore >= 88 ? "peak" : ondoScore >= 76 ? "hot" : ondoScore >= 62 ? "rising" : "warming"
  return { ondoScore, heatLevel, venueCount: signals.length, signalCount: signals.reduce((sum, signal) => sum + signal.signalCount, 0) }
}

function NationPulse({ locale, onSelect }: { locale: Locale; onSelect(city: CityId): void }) {
  const copy = COPY[locale]
  return (
    <section className={styles.nation} data-testid="ondo-b-nation">
      <div className={styles.nationIntro}>
        <small>KOREA · FOOD SIGNALS</small>
        <h2>{copy.title}</h2>
        <p>{copy.body}</p>
      </div>
      <div className={styles.dotMap}>
        <svg viewBox="0 0 300 350" role="img" aria-label={locale === "ko" ? "점으로 표현한 대한민국 ONDO 지도" : "Dotted map of ONDO signals across Korea"}>
          {KOREA_DOTS.map((dot, index) => <circle key={`${dot.x}-${dot.y}`} cx={dot.x} cy={dot.y} r={index % 5 === 0 ? 2 : 1.65} />)}
        </svg>
        {(["seoul", "busan"] as const).map((cityId) => {
          const region = cityPulse(cityId)
          const palette = HEAT_COLORS[region?.heatLevel ?? "limited"]
          return (
            <button key={cityId} type="button" className={styles.cityNode} data-city={cityId} onClick={() => onSelect(cityId)} aria-label={`${CITY[cityId].label[locale]} · ${locale === "ko" ? "시뮬레이션 ONDO" : "Simulated ONDO"} ${region?.ondoScore ?? "—"}`}>
              <i style={{ background: palette.fill, color: palette.text, borderColor: palette.stroke }}>{region?.ondoScore ?? "—"}</i>
              <span><strong>{CITY[cityId].label[locale]}</strong><small>{region.venueCount} {locale === "ko" ? "곳 ·" : "places ·"} {HEAT_LABELS[locale][region.heatLevel]} · {locale === "ko" ? "시뮬레이션" : "Simulated"}</small></span>
            </button>
          )
        })}
      </div>
      <footer><span />{copy.source}</footer>
    </section>
  )
}

function toFeatureCollection(venues: readonly BMapVenue[]): GeoJSON.FeatureCollection<GeoJSON.Point, { id: string; score: number; heat: string; name: string }> {
  return {
    type: "FeatureCollection",
    features: venues.map((venue) => ({
      type: "Feature",
      id: venue.id,
      geometry: { type: "Point", coordinates: [venue.longitude, venue.latitude] },
      properties: { id: venue.id, score: venue.ondoScore ?? -1, heat: venue.heatLevel, name: venue.name.ko },
    })),
  }
}

function toSignalFeatureCollection(venues: readonly BMapVenue[]) {
  return toFeatureCollection(venues.filter((venue) => venue.signalTruth === "SIMULATED"))
}

function toContributionFeatureCollection(venues: readonly BMapVenue[], contributedVenueIds: ReadonlySet<string>) {
  return toFeatureCollection(venues.filter((venue) => contributedVenueIds.has(venue.id)))
}

function heatColorExpression() {
  return ["match", ["get", "heat"], "peak", "#7a2048", "hot", "#c94832", "rising", "#e6843b", "warming", "#ebc463", "low", "#efe1b7", "#cfcac0"] as never
}

function VenueList({ venues, locale, visibleCount, contributedVenueIds, onMore, onSelect }: { venues: BMapVenue[]; locale: Locale; visibleCount: number; contributedVenueIds: ReadonlySet<string>; onMore(): void; onSelect(venue: BMapVenue): void }) {
  const copy = COPY[locale]
  return (
    <ul className={styles.venueList} data-testid="ondo-b-venue-list">
      {venues.slice(0, visibleCount).map((venue) => (
        <li key={venue.id}>
          <button type="button" onClick={() => onSelect(venue)}>
            <span className={styles.score} data-level={venue.heatLevel}>{venue.ondoScore ?? "—"}</span>
            <span>
              <small>{venueDistrictLabel(venue.cityId, venue.districtId, locale)} · {CATEGORY[venue.primaryCategory][locale]}</small>
              <strong>{venueDisplayName(venue.name.ko, locale)}</strong>
              <em>{locale === "en" ? venue.name.ko : CATEGORY[venue.primaryCategory].en}</em>
              <small className={styles.signalTruth}>{contributedVenueIds.has(venue.id) ? copy.contributed : venue.signalTruth === "SIMULATED" ? copy.simulatedList : copy.neutral}</small>
            </span>
            <ChevronRight size={17} />
          </button>
        </li>
      ))}
      {visibleCount < venues.length ? <li className={styles.loadMore}><button type="button" onClick={onMore}>{copy.more}</button></li> : null}
      {!venues.length ? <li className={styles.empty}>{copy.neutral}</li> : null}
    </ul>
  )
}

export function MapEntryB() {
  const { state, actions } = useOndo()
  const locale = state.locale
  const copy = COPY[locale]
  const mapNode = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [city, setCity] = useState<CityId | null>(null)
  const [view, setView] = useState<ViewMode>("map")
  const [query, setQuery] = useState("")
  const [heat, setHeat] = useState<"all" | "signal" | "pending">("all")
  const [mapState, setMapState] = useState<"idle" | "loading" | "ready" | "error">("idle")
  const [visibleCount, setVisibleCount] = useState(30)
  const [retryToken, setRetryToken] = useState(0)
  const after19On = state.after19 === "A19-ON"
  const contributedVenueIds = useMemo(() => new Set(state.acceptedActivityEventKeys.flatMap((key) => {
    const match = key.match(/local-signal:(mois-[a-z0-9]+):/)
    return match ? [match[1]] : []
  })), [state.acceptedActivityEventKeys])
  const selectedVenueId = state.surface.kind === "venue" ? state.surface.venueId : null

  const venues = useMemo(() => B_MAP_VENUES.filter((venue) => {
    if (!city || venue.cityId !== city) return false
    if (after19On && !B_DEMO_SIGNAL_BY_VENUE_ID.get(venue.id)?.after19) return false
    const haystack = `${venue.name.ko} ${venue.name.en} ${venueDisplayName(venue.name.ko, "en")} ${CATEGORY[venue.primaryCategory].ko} ${CATEGORY[venue.primaryCategory].en} ${venue.districtId} ${venueDistrictLabel(venue.cityId, venue.districtId, "en")}`.toLowerCase()
    if (query && !haystack.includes(query.toLowerCase())) return false
    if (heat === "signal" && venue.signalTruth !== "SIMULATED") return false
    if (heat === "pending" && venue.signalTruth !== "UNKNOWN") return false
    return true
  }), [after19On, city, heat, query])

  useEffect(() => { setVisibleCount(30) }, [city, heat, query])

  useEffect(() => {
    if (!selectedVenueId) return
    const selected = CANONICAL_MAP_VENUES_COMPACT.find((venue) => venue.id === selectedVenueId)
    if (selected) setCity(selected.cityId)
  }, [selectedVenueId])

  useEffect(() => {
    if (!city || !mapNode.current || mapRef.current) return
    let disposed = false
    setMapState("loading")
    void import("maplibre-gl").then(({ Map, NavigationControl }) => {
      if (disposed || !mapNode.current) return
      const instance = new Map({
        container: mapNode.current,
        style: ONDO_MAP_STYLE,
        center: CITY[city].center,
        zoom: CITY[city].zoom,
        minZoom: 8.5,
        maxZoom: 18,
        attributionControl: false,
        cooperativeGestures: true,
      })
      mapRef.current = instance
      instance.addControl(new NavigationControl({ showCompass: false }), "bottom-right")
      instance.on("load", () => {
        if (disposed) return
        instance.addSource("ondo-venues", { type: "geojson", data: toFeatureCollection(venues), cluster: true, clusterRadius: 46, clusterMaxZoom: 13 })
        instance.addSource("ondo-signals", { type: "geojson", data: toSignalFeatureCollection(venues) })
        instance.addSource("ondo-contributions", { type: "geojson", data: toContributionFeatureCollection(venues, contributedVenueIds) })
        instance.addLayer({ id: "ondo-clusters", type: "circle", source: "ondo-venues", filter: ["has", "point_count"], paint: { "circle-color": "#23211e", "circle-radius": ["step", ["get", "point_count"], 20, 15, 24, 50, 30], "circle-stroke-color": "#ffffff", "circle-stroke-width": 3 } })
        instance.addLayer({ id: "ondo-cluster-count", type: "symbol", source: "ondo-venues", filter: ["has", "point_count"], layout: { "text-field": ["get", "point_count_abbreviated"], "text-font": ["Noto Sans Bold"], "text-size": 12 }, paint: { "text-color": "#ffffff" } })
        instance.addLayer({ id: "ondo-points", type: "circle", source: "ondo-venues", filter: ["!", ["has", "point_count"]], paint: { "circle-color": "#bdbdb8", "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 5, 15, 9], "circle-stroke-color": "#ffffff", "circle-stroke-width": 2 } })
        instance.addLayer({ id: "ondo-signal-points", type: "circle", source: "ondo-signals", paint: { "circle-color": heatColorExpression(), "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 14, 15, 18], "circle-stroke-color": "#ffffff", "circle-stroke-width": 3 } })
        instance.addLayer({ id: "ondo-score", type: "symbol", source: "ondo-signals", layout: { "text-field": ["to-string", ["get", "score"]], "text-font": ["Noto Sans Bold"], "text-size": 12 }, paint: { "text-color": "#ffffff", "text-halo-color": "#2a2521", "text-halo-width": 0.4 } })
        instance.addLayer({ id: "ondo-contribution-ring", type: "circle", source: "ondo-contributions", paint: { "circle-color": "rgba(0,0,0,0)", "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 18, 15, 22], "circle-stroke-color": "#c94832", "circle-stroke-width": 3 } })
        instance.on("click", "ondo-clusters", async (event: MapLayerMouseEvent) => {
          const feature = instance.queryRenderedFeatures(event.point, { layers: ["ondo-clusters"] })[0]
          const clusterId = feature?.properties?.cluster_id
          const source = instance.getSource("ondo-venues") as GeoJSONSource
          if (typeof clusterId !== "number") return
          const zoom = await source.getClusterExpansionZoom(clusterId)
          if (feature.geometry.type === "Point") instance.easeTo({ center: feature.geometry.coordinates as [number, number], zoom })
        })
        instance.on("click", "ondo-points", (event: MapLayerMouseEvent) => {
          const id = event.features?.[0]?.properties?.id
          if (typeof id === "string" && CANONICAL_MAP_VENUES_COMPACT.some((venue) => venue.id === id)) actions.setSurface({ kind: "venue", venueId: id })
        })
        instance.on("click", "ondo-signal-points", (event: MapLayerMouseEvent) => {
          const id = event.features?.[0]?.properties?.id
          if (typeof id === "string" && CANONICAL_MAP_VENUES_COMPACT.some((venue) => venue.id === id)) actions.setSurface({ kind: "venue", venueId: id })
        })
        instance.on("mouseenter", "ondo-clusters", () => { instance.getCanvas().style.cursor = "pointer" })
        instance.on("mouseenter", "ondo-points", () => { instance.getCanvas().style.cursor = "pointer" })
        instance.on("mouseenter", "ondo-signal-points", () => { instance.getCanvas().style.cursor = "pointer" })
        instance.on("mouseleave", "ondo-clusters", () => { instance.getCanvas().style.cursor = "" })
        instance.on("mouseleave", "ondo-points", () => { instance.getCanvas().style.cursor = "" })
        instance.on("mouseleave", "ondo-signal-points", () => { instance.getCanvas().style.cursor = "" })
        setMapState("ready")
      })
      instance.on("error", () => setMapState("error"))
    }).catch(() => setMapState("error"))
    return () => {
      disposed = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [actions, city, retryToken])

  useEffect(() => {
    const source = mapRef.current?.getSource("ondo-venues") as GeoJSONSource | undefined
    if (source) void source.setData(toFeatureCollection(venues))
    const signalSource = mapRef.current?.getSource("ondo-signals") as GeoJSONSource | undefined
    if (signalSource) void signalSource.setData(toSignalFeatureCollection(venues))
    const contributionSource = mapRef.current?.getSource("ondo-contributions") as GeoJSONSource | undefined
    if (contributionSource) void contributionSource.setData(toContributionFeatureCollection(venues, contributedVenueIds))
  }, [contributedVenueIds, venues])

  function chooseCity(next: CityId) {
    setCity(next)
    setView("map")
  }

  function selectVenue(venue: BMapVenue) {
    actions.setSurface({ kind: "venue", venueId: venue.id })
    setView("map")
    mapRef.current?.easeTo({ center: [venue.longitude, venue.latitude], zoom: 15 })
  }

  function retryMap() {
    mapRef.current?.remove()
    mapRef.current = null
    setMapState("idle")
    setView("map")
    setRetryToken((token) => token + 1)
  }

  if (!city) return (
    <section className={styles.root} data-testid="ondo-b-map-entry">
      <header className={styles.header}>
        <div className={styles.brand}><i /> <span><strong>ONDO</strong><small>{copy.tagline}</small></span></div>
        <button type="button" className={styles.language} onClick={() => actions.setLocale(locale === "en" ? "ko" : "en")}><Languages size={16} />{locale === "en" ? "KO" : "EN"}</button>
      </header>
      <NationPulse locale={locale} onSelect={chooseCity} />
    </section>
  )

  return (
    <section className={styles.root} data-testid="ondo-b-map-entry" data-map-state={mapState}>
      <p id="ondo-b-map-instruction" className={styles.srOnly}>{copy.mapA11y}</p>
      <div ref={mapNode} className={styles.map} data-testid="maplibre-map" aria-label={locale === "ko" ? "ONDO 식음료 지도" : "ONDO food map"} aria-describedby="ondo-b-map-instruction" />
      <header className={styles.cityHeader}>
        <div className={styles.topline}>
          <button type="button" className={styles.back} onClick={() => { mapRef.current?.remove(); mapRef.current = null; setCity(null) }}><ArrowLeft size={18} />{copy.back}</button>
          <strong>{CITY[city].label[locale]}</strong>
          <button type="button" className={styles.language} onClick={() => actions.setLocale(locale === "en" ? "ko" : "en")}><Languages size={16} />{locale === "en" ? "KO" : "EN"}</button>
        </div>
        <label className={styles.search}><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} />{query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear"><X size={16} /></button> : null}</label>
        <div className={styles.rail} aria-label={locale === "ko" ? "장소 신호 필터" : "Place signal filters"}>
          {(["all", "signal", "pending"] as const).map((item) => <button key={item} type="button" aria-pressed={heat === item} onClick={() => setHeat(item)}>{copy[item]}</button>)}
        </div>
      </header>

      <div className={styles.resultBar}>
        <span><b>{venues.length}</b> {after19On ? copy.after19Mode : copy.places}</span>
        <button type="button" onClick={() => setView(view === "map" ? "list" : "map")}>{view === "map" ? <List size={17} /> : <MapIcon size={17} />}{view === "map" ? copy.list : copy.map}</button>
      </div>

      {view === "list" || mapState === "error" ? <div className={styles.listPanel}>{mapState === "error" ? <div className={styles.mapError} role="status"><span>{copy.mapUnavailable}</span><button type="button" onClick={retryMap}>{copy.retryMap}</button></div> : null}<VenueList venues={venues} locale={locale} visibleCount={visibleCount} contributedVenueIds={contributedVenueIds} onMore={() => setVisibleCount((count) => Math.min(venues.length, count + 30))} onSelect={selectVenue} /></div> : null}

      {view === "map" ? <button type="button" className={styles.locate} aria-label={locale === "ko" ? "내 위치" : "My location"} onClick={() => navigator.geolocation?.getCurrentPosition(({ coords }) => mapRef.current?.easeTo({ center: [coords.longitude, coords.latitude], zoom: 14 }), () => actions.notify(copy.locationUnavailable))}><LocateFixed size={19} /></button> : null}
      {view === "map" ? <a className={styles.attribution} href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap · © OpenStreetMap</a> : null}
    </section>
  )
}
