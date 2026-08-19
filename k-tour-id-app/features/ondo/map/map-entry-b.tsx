"use client"

import type { GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent } from "maplibre-gl"
import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, ChevronRight, Languages, List, LocateFixed, Map as MapIcon, Search, X } from "lucide-react"
import { KOREA_OUTLINE_COORDINATES } from "@/lib/map/korea-atlas-data"
import { MAP_REGIONS } from "@/lib/ondo/map/fixtures"
import { HEAT_COLORS, HEAT_LABELS } from "@/lib/ondo/map/heat"
import { ONDO_MAP_STYLE } from "@/lib/ondo/map/ondo-map-style"
import { CANONICAL_MAP_VENUES } from "@/lib/ondo/venues"
import type { CanonicalMapVenue, VenuePrimaryCategory } from "@/lib/ondo/venues"
import { B_DEMO_SIGNAL_BY_VENUE_ID } from "@/lib/ondo/venues/demo-signals"
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
    search: "Food, neighborhood, or mood",
    now: "Now",
    dinner: "Dinner",
    late: "Late",
    all: "All",
    hot: "Hot",
    calm: "Calm",
    list: "List",
    map: "Map",
    back: "All Korea",
    places: "places in view",
    neutral: "Place only · signal pending",
    source: "Place coverage preview · ONDO signals are simulated",
    more: "Load 30 more",
  },
  ko: {
    tagline: "로컬이 지금 먹는 곳",
    title: "로컬 식음료 열기로 도시를 골라보세요.",
    body: "실재 장소를 담은 조용한 지도예요. ONDO 신호가 있는 곳에만 색이 나타납니다.",
    search: "음식, 동네, 분위기 검색",
    now: "지금",
    dinner: "저녁",
    late: "야식",
    all: "전체",
    hot: "뜨는 곳",
    calm: "차분한 곳",
    list: "목록",
    map: "지도",
    back: "전국",
    places: "개 장소",
    neutral: "장소 정보만 · 신호 수집 중",
    source: "장소 커버리지 프리뷰 · ONDO 신호는 시뮬레이션",
    more: "30개 더 보기",
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

const B_MAP_VENUES: readonly BMapVenue[] = CANONICAL_MAP_VENUES.map((venue) => {
  const signal = B_DEMO_SIGNAL_BY_VENUE_ID.get(venue.id)
  return { ...venue, ondoScore: signal?.score ?? null, heatLevel: signal?.level ?? "limited", signalTruth: signal ? "SIMULATED" : "UNKNOWN" }
})

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

function cityScore(cityId: CityId) {
  return MAP_REGIONS.find((region) => region.cityId === cityId)
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
          const region = cityScore(cityId)
          const palette = HEAT_COLORS[region?.heatLevel ?? "limited"]
          return (
            <button key={cityId} type="button" className={styles.cityNode} data-city={cityId} onClick={() => onSelect(cityId)} aria-label={`${CITY[cityId].label[locale]} · ONDO ${region?.ondoScore ?? "—"}`}>
              <i style={{ background: palette.fill, color: palette.text, borderColor: palette.stroke }}>{region?.ondoScore ?? "—"}</i>
              <span><strong>{CITY[cityId].label[locale]}</strong><small>{HEAT_LABELS[locale][region?.heatLevel ?? "limited"]}</small></span>
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

function heatColorExpression() {
  return ["match", ["get", "heat"], "peak", "#7a2048", "hot", "#c94832", "rising", "#e6843b", "warming", "#ebc463", "low", "#efe1b7", "#cfcac0"] as never
}

function VenueList({ venues, locale, visibleCount, onMore, onSelect }: { venues: BMapVenue[]; locale: Locale; visibleCount: number; onMore(): void; onSelect(venue: BMapVenue): void }) {
  const copy = COPY[locale]
  return (
    <ul className={styles.venueList} data-testid="ondo-b-venue-list">
      {venues.slice(0, visibleCount).map((venue) => (
        <li key={venue.id}>
          <button type="button" onClick={() => onSelect(venue)}>
            <span className={styles.score} data-level={venue.heatLevel}>{venue.ondoScore ?? "—"}</span>
            <span><small>{venue.districtId} · {CATEGORY[venue.primaryCategory][locale]}</small><strong>{venue.name[locale]}</strong><em>{venue.nameEnTruth === "UNKNOWN_FALLBACK_TO_KO" ? copy.neutral : venue.name[locale === "ko" ? "en" : "ko"]}</em></span>
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
  const [heat, setHeat] = useState<"all" | "hot" | "calm">("all")
  const [time, setTime] = useState<"now" | "dinner" | "late">("now")
  const [mapState, setMapState] = useState<"idle" | "loading" | "ready" | "error">("idle")
  const [visibleCount, setVisibleCount] = useState(30)

  const venues = useMemo(() => B_MAP_VENUES.filter((venue) => {
    if (!city || venue.cityId !== city) return false
    const haystack = `${venue.name.ko} ${venue.name.en} ${CATEGORY[venue.primaryCategory].ko} ${CATEGORY[venue.primaryCategory].en} ${venue.districtId}`.toLowerCase()
    if (query && !haystack.includes(query.toLowerCase())) return false
    if (heat === "hot" && (venue.ondoScore ?? 0) < 75) return false
    if (heat === "calm" && (venue.ondoScore == null || venue.ondoScore >= 75)) return false
    return true
  }), [city, heat, query, time])

  useEffect(() => { setVisibleCount(30) }, [city, heat, query, time])

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
        instance.addLayer({ id: "ondo-clusters", type: "circle", source: "ondo-venues", filter: ["has", "point_count"], paint: { "circle-color": "#23211e", "circle-radius": ["step", ["get", "point_count"], 20, 15, 24, 50, 30], "circle-stroke-color": "#faf9f6", "circle-stroke-width": 3 } })
        instance.addLayer({ id: "ondo-cluster-count", type: "symbol", source: "ondo-venues", filter: ["has", "point_count"], layout: { "text-field": ["get", "point_count_abbreviated"], "text-font": ["Noto Sans Bold"], "text-size": 12 }, paint: { "text-color": "#ffffff" } })
        instance.addLayer({ id: "ondo-points", type: "circle", source: "ondo-venues", filter: ["!", ["has", "point_count"]], paint: { "circle-color": heatColorExpression(), "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 7, 15, 13], "circle-stroke-color": "#faf9f6", "circle-stroke-width": 3 } })
        instance.addLayer({ id: "ondo-score", type: "symbol", source: "ondo-venues", minzoom: 12, filter: ["!", ["has", "point_count"]], layout: { "text-field": ["case", [">=", ["get", "score"], 0], ["to-string", ["get", "score"]], "·"], "text-font": ["Noto Sans Bold"], "text-size": 11 }, paint: { "text-color": "#ffffff", "text-halo-color": "#2a2521", "text-halo-width": 0.4 } })
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
          if (typeof id === "string" && CANONICAL_MAP_VENUES.some((venue) => venue.id === id)) actions.setSurface({ kind: "venue", venueId: id })
        })
        instance.on("mouseenter", "ondo-clusters", () => { instance.getCanvas().style.cursor = "pointer" })
        instance.on("mouseenter", "ondo-points", () => { instance.getCanvas().style.cursor = "pointer" })
        instance.on("mouseleave", "ondo-clusters", () => { instance.getCanvas().style.cursor = "" })
        instance.on("mouseleave", "ondo-points", () => { instance.getCanvas().style.cursor = "" })
        setMapState("ready")
      })
      instance.on("error", () => setMapState("error"))
    }).catch(() => setMapState("error"))
    return () => {
      disposed = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [actions, city])

  useEffect(() => {
    const source = mapRef.current?.getSource("ondo-venues") as GeoJSONSource | undefined
    if (source) void source.setData(toFeatureCollection(venues))
  }, [venues])

  function chooseCity(next: CityId) {
    setCity(next)
    setView("map")
  }

  function selectVenue(venue: BMapVenue) {
    actions.setSurface({ kind: "venue", venueId: venue.id })
    setView("map")
    mapRef.current?.easeTo({ center: [venue.longitude, venue.latitude], zoom: 15 })
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
      <div ref={mapNode} className={styles.map} data-testid="maplibre-map" aria-label={locale === "ko" ? "ONDO 식음료 지도" : "ONDO food map"} />
      <header className={styles.cityHeader}>
        <div className={styles.topline}>
          <button type="button" className={styles.back} onClick={() => { mapRef.current?.remove(); mapRef.current = null; setCity(null) }}><ArrowLeft size={18} />{copy.back}</button>
          <strong>{CITY[city].label[locale]}</strong>
          <button type="button" className={styles.language} onClick={() => actions.setLocale(locale === "en" ? "ko" : "en")}><Languages size={16} />{locale === "en" ? "KO" : "EN"}</button>
        </div>
        <label className={styles.search}><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} />{query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear"><X size={16} /></button> : null}</label>
        <div className={styles.rail}>
          {(["now", "dinner", "late"] as const).map((item) => <button key={item} type="button" aria-pressed={time === item} onClick={() => setTime(item)}>{copy[item]}</button>)}
          <span />
          {(["all", "hot", "calm"] as const).map((item) => <button key={item} type="button" aria-pressed={heat === item} onClick={() => setHeat(item)}>{copy[item]}</button>)}
        </div>
      </header>

      <div className={styles.resultBar}>
        <span><b>{venues.length}</b> {copy.places}</span>
        <button type="button" onClick={() => setView(view === "map" ? "list" : "map")}>{view === "map" ? <List size={17} /> : <MapIcon size={17} />}{view === "map" ? copy.list : copy.map}</button>
      </div>

      {view === "list" || mapState === "error" ? <div className={styles.listPanel}><VenueList venues={venues} locale={locale} visibleCount={visibleCount} onMore={() => setVisibleCount((count) => Math.min(venues.length, count + 30))} onSelect={selectVenue} /></div> : null}

      {view === "map" ? <button type="button" className={styles.locate} aria-label={locale === "ko" ? "내 위치" : "My location"} onClick={() => navigator.geolocation?.getCurrentPosition(({ coords }) => mapRef.current?.easeTo({ center: [coords.longitude, coords.latitude], zoom: 14 }), () => undefined)}><LocateFixed size={19} /></button> : null}
      <a className={styles.attribution} href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap · © OpenStreetMap</a>
    </section>
  )
}
