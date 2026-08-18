"use client"

import type * as Leaflet from "leaflet"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  ChevronRight,
  CircleHelp,
  Clock3,
  Languages,
  Layers3,
  List,
  LocateFixed,
  Map as MapIcon,
  Minus,
  Plus,
  Search,
  X,
} from "lucide-react"
import { useOndo } from "../shared/state/ondo-provider"
import type { Locale } from "../contracts/domain"
import { MAP_NEIGHBORHOODS, MAP_REGIONS, MAP_VENUE_BY_ID, MAP_VENUES, isStableVenueId } from "../../../lib/ondo/map/fixtures"
import { CONFIDENCE_LABELS, FRESHNESS_LABELS, HEAT_COLORS, HEAT_LABELS, confidenceClass, heatAccessibleName, resolveFreshness } from "../../../lib/ondo/map/heat"
import type { DiscoveryFilters, DiscoveryLevel, DiscoveryUrlState, MapNeighborhood, MapRegion, MapVenue } from "../../../lib/ondo/map/models"
import { DEFAULT_FILTERS, readDiscoveryUrl, writeDiscoveryUrl } from "../../../lib/ondo/map/url-state"
import styles from "./map.module.css"

const KOREA_CENTER: Leaflet.LatLngExpression = [36.24, 127.88]
const KOREA_BOUNDS: Leaflet.LatLngBoundsExpression = [[32.9, 124.6], [38.75, 131.95]]

type TileState = "loading" | "ready" | "error" | "offline"
type MarkerEntity = MapRegion | MapNeighborhood | MapVenue

const MAP_COPY = {
  en: {
    tagline: "Where locals eat now",
    search: "Search food, mood, or neighborhood",
    nearby: "Near me",
    hot: "Hot now",
    calm: "A little calmer",
    open: "Open now",
    now: "Now",
    dinner: "Dinner",
    late: "Late night",
    nation: "Explore ONDO across Korea.",
    seoul: "Neighborhoods heating up in Seoul",
    busan: "Busan starts with a smaller signal base",
    growing: "We’re growing signals in this area.",
    map: "View map",
    list: "View list",
    results: "places in this view",
    noResults: "No places match these filters yet.",
    reset: "Reset filters",
    tileTitle: "The map could not be displayed.",
    tileBody: "You can still browse the same place list.",
    retry: "Try the map again",
    deniedTitle: "Location access is off.",
    deniedBody: "Search a city or neighborhood to keep exploring.",
    offlineTitle: "Offline · saved information",
    legendTitle: "About ONDO heat",
    legendBody: "The number is a 0–100 score based on recent local food and drink signals. It is not temperature or live crowding.",
    coverageSeed: "Early coverage",
    openVenue: "Open place details",
  },
  ko: {
    tagline: "로컬이 지금 먹는 곳",
    search: "음식, 분위기, 동네를 검색하세요",
    nearby: "지금 주변",
    hot: "뜨는 곳",
    calm: "조금 여유롭게",
    open: "영업 중",
    now: "지금",
    dinner: "저녁",
    late: "야식",
    nation: "한국의 ONDO를 둘러보세요.",
    seoul: "서울에서 지금 뜨는 동네",
    busan: "부산은 작은 신호부터 시작해요",
    growing: "이 지역의 신호를 모으는 중이에요.",
    map: "지도 보기",
    list: "목록 보기",
    results: "개의 장소",
    noResults: "조건에 맞는 장소가 아직 없어요.",
    reset: "필터 초기화",
    tileTitle: "지도를 표시하지 못했어요.",
    tileBody: "같은 장소 목록은 계속 볼 수 있어요.",
    retry: "지도 다시 시도",
    deniedTitle: "위치 권한이 꺼져 있어요.",
    deniedBody: "도시나 동네를 검색해 계속 둘러볼 수 있어요.",
    offlineTitle: "오프라인 · 저장된 정보",
    legendTitle: "ONDO 열기 기준",
    legendBody: "숫자는 최근 로컬 식음료 신호를 바탕으로 한 0–100 점수예요. 기온이나 실시간 인파는 아닙니다.",
    coverageSeed: "먼저 채워지는 지역",
    openVenue: "장소 상세 열기",
  },
} as const

function levelForZoom(zoom: number): DiscoveryLevel {
  if (zoom < 8.5) return "nation"
  if (zoom < 10.5) return "city"
  if (zoom < 12.5) return "neighborhood"
  return "venue"
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character)
}

function markerHtml(entity: MarkerEntity, locale: Locale, selected: boolean) {
  const palette = HEAT_COLORS[entity.heatLevel]
  const confidence = confidenceClass(entity.confidence)
  const score = entity.ondoScore == null ? "—" : String(entity.ondoScore)
  const name = "name" in entity ? entity.name[locale] : ""
  const ageBadge = "alcohol" in entity && entity.alcohol ? "<i>19+</i>" : ""
  return `<span class="ondoMarker ${confidence} ${selected ? "isSelected" : ""} ${entity.heatLevel === "limited" ? "isLimited" : ""}" style="--marker-fill:${palette.fill};--marker-text:${palette.text};--marker-stroke:${palette.stroke}"><b>${escapeHtml(score)}</b>${ageBadge}<small>${escapeHtml(name)}</small></span>`
}

function currentFreshness(entity: MarkerEntity) {
  return resolveFreshness({
    freshness: entity.freshness,
    updatedAt: "updatedAt" in entity ? entity.updatedAt : undefined,
    provenance: entity.provenance,
  })
}

function regionHeading(level: DiscoveryLevel, city: "seoul" | "busan" | undefined, locale: Locale) {
  const copy = MAP_COPY[locale]
  if (level === "nation") return copy.nation
  if (city === "busan") return copy.busan
  return copy.seoul
}

function matchesFilters(venue: MapVenue, filters: DiscoveryFilters, locale: Locale) {
  const query = filters.query.trim().toLocaleLowerCase(locale === "ko" ? "ko-KR" : "en-US")
  const haystack = [venue.name.en, venue.name.ko, venue.category.en, venue.category.ko, venue.neighborhoodId, ...venue.reasons.flatMap((reason) => [reason.en, reason.ko])].join(" ").toLocaleLowerCase()
  if (query && !haystack.includes(query)) return false
  if (filters.hotOnly && (venue.ondoScore ?? 0) < 75) return false
  if (filters.calmOnly && (venue.ondoScore == null || venue.ondoScore >= 75)) return false
  if (filters.openOnly && venue.openingStatus !== "open") return false
  if (filters.time === "late" && !venue.lateNight) return false
  return true
}

function VenueList({ venues, locale, selectedId, onSelect }: { venues: MapVenue[]; locale: Locale; selectedId?: string; onSelect(venue: MapVenue): void }) {
  const copy = MAP_COPY[locale]
  return (
    <ul className={styles.venueList} data-testid="venue-list">
      {venues.map((venue) => {
        const freshness = currentFreshness(venue)
        return (
        <li key={venue.id}>
          <button
            type="button"
            className={selectedId === venue.id ? styles.venueCardSelected : styles.venueCard}
            onClick={() => onSelect(venue)}
            data-testid={`venue-card-${venue.id}`}
            aria-label={`${copy.openVenue}: ${venue.name[locale]}`}
          >
            {/* Fixed repository imagery keeps visual tests deterministic. */}
            <img src={venue.image} alt="" />
            <span className={styles.venueCardBody}>
              <small>{venue.category[locale]}</small>
              <strong>{venue.name[locale]}</strong>
              <em>{venue.name[locale === "en" ? "ko" : "en"]}</em>
              <span className={styles.venueCardMeta}>
                <b style={{ background: HEAT_COLORS[venue.heatLevel].fill, color: HEAT_COLORS[venue.heatLevel].text }}>ONDO {venue.ondoScore}</b>
                <span><Clock3 size={12} /> {FRESHNESS_LABELS[locale][freshness]}</span>
              </span>
            </span>
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </li>
        )
      })}
    </ul>
  )
}

export function MapEntry() {
  const { state, actions } = useOndo()
  const locale = state.locale
  const copy = MAP_COPY[locale]
  const mapNodeRef = useRef<HTMLDivElement | null>(null)
  const leafletRef = useRef<typeof Leaflet | null>(null)
  const mapRef = useRef<Leaflet.Map | null>(null)
  const legendCloseRef = useRef<HTMLButtonElement | null>(null)
  const markerLayerRef = useRef<Leaflet.LayerGroup | null>(null)
  const tileLayerRef = useRef<Leaflet.TileLayer | null>(null)
  const tileFailureCountRef = useRef(0)
  const [filters, setFilters] = useState<DiscoveryFilters>(DEFAULT_FILTERS)
  const [urlReady, setUrlReady] = useState(false)
  const [viewMode, setViewMode] = useState<"map" | "list">("map")
  const [zoom, setZoom] = useState(7)
  const [level, setLevel] = useState<DiscoveryLevel>("nation")
  const [activeCity, setActiveCity] = useState<"seoul" | "busan">()
  const [activeNeighborhood, setActiveNeighborhood] = useState<string>()
  const [viewportVenueIds, setViewportVenueIds] = useState(() => MAP_VENUES.map((venue) => venue.id))
  const [tileState, setTileState] = useState<TileState>("loading")
  const [tileRetry, setTileRetry] = useState(0)
  const [locationDenied, setLocationDenied] = useState(false)
  const [legendOpen, setLegendOpen] = useState(false)
  const selectedId = state.surface.kind === "venue" ? state.surface.venueId : undefined

  useEffect(() => {
    if (!state.hydrated || urlReady) return
    const params = new URLSearchParams(window.location.search)
    const initial = readDiscoveryUrl(window.location.search)
    const hasHotPreference = state.discoveryPreferences.includes("lively")
    const hasCalmPreference = state.discoveryPreferences.includes("calm")
    setFilters({
      query: initial.query,
      time: params.has("time") ? initial.time : state.discoveryPreferences.includes("late") ? "late" : initial.time,
      hotOnly: params.has("hot") || params.has("calm") ? initial.hotOnly : hasHotPreference,
      calmOnly: params.has("hot") || params.has("calm") ? initial.calmOnly : !hasHotPreference && hasCalmPreference,
      openOnly: initial.openOnly,
    })
    setViewMode(initial.view)
    setActiveCity(initial.city)
    setActiveNeighborhood(initial.neighborhood)
    if (initial.venueId && isStableVenueId(initial.venueId)) actions.setSurface({ kind: "venue", venueId: initial.venueId })
    setUrlReady(true)
  }, [actions, state.discoveryPreferences, state.hydrated, urlReady])

  useEffect(() => {
    let disposed = false
    let zoomTimer: number | undefined
    let fallbackTimer: number | undefined
    const node = mapNodeRef.current
    if (!node || mapRef.current) return

    void import("leaflet").then((leaflet) => {
      if (disposed || !mapNodeRef.current) return
      leafletRef.current = leaflet
      const initial = readDiscoveryUrl(window.location.search)
      const initialVenue = initial.venueId ? MAP_VENUE_BY_ID.get(initial.venueId) : undefined
      const map = leaflet.map(mapNodeRef.current, {
        attributionControl: false,
        zoomControl: false,
        minZoom: 6,
        maxZoom: 18,
        maxBounds: KOREA_BOUNDS,
        maxBoundsViscosity: 0.75,
        worldCopyJump: false,
      })
      mapRef.current = map
      markerLayerRef.current = leaflet.layerGroup().addTo(map)

      if (initialVenue) map.setView([initialVenue.latitude, initialVenue.longitude], 14, { animate: false })
      else if (initial.city) {
        const region = MAP_REGIONS.find((item) => item.cityId === initial.city)
        if (region) map.fitBounds(region.bounds, { paddingTopLeft: [24, 165], paddingBottomRight: [24, 120], animate: false })
      } else map.setView(KOREA_CENTER, 7, { animate: false })

      const updateViewport = () => {
        const nextZoom = map.getZoom()
        const nextLevel = levelForZoom(nextZoom)
        window.clearTimeout(zoomTimer)
        zoomTimer = window.setTimeout(() => {
          setZoom(nextZoom)
          setLevel(nextLevel)
          const center = map.getCenter()
          if (nextLevel === "nation") {
            setActiveCity(undefined)
            setActiveNeighborhood(undefined)
          } else {
            const city = center.lat < 36.2 ? "busan" : "seoul"
            setActiveCity(city)
            if (nextLevel === "city") setActiveNeighborhood(undefined)
          }
          const bounds = map.getBounds()
          setViewportVenueIds(MAP_VENUES.filter((venue) => bounds.contains([venue.latitude, venue.longitude])).map((venue) => venue.id))
        }, 120)
      }
      map.on("zoomend moveend", updateViewport)
      updateViewport()

      const scenario = new URLSearchParams(window.location.search).get("scenario")
      if (scenario === "tile-error") {
        window.setTimeout(() => setTileState("error"), 80)
      } else {
        setTileState(navigator.onLine ? "loading" : "offline")
        const layer = leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          subdomains: "abc",
          detectRetina: true,
        })
        tileLayerRef.current = layer
        layer.on("load", () => {
          tileFailureCountRef.current = 0
          setTileState("ready")
          window.clearTimeout(fallbackTimer)
        })
        layer.on("tileerror", () => {
          tileFailureCountRef.current += 1
          if (tileFailureCountRef.current >= 3) setTileState("error")
        })
        layer.addTo(map)
        fallbackTimer = window.setTimeout(() => setTileState((current) => current === "loading" ? "error" : current), 5000)
      }

      const invalidate = () => map.invalidateSize({ animate: false })
      window.addEventListener("resize", invalidate)
      map.whenReady(invalidate)
      ;(map as Leaflet.Map & { __ondoResizeCleanup?: () => void }).__ondoResizeCleanup = () => window.removeEventListener("resize", invalidate)
    })

    return () => {
      disposed = true
      window.clearTimeout(zoomTimer)
      window.clearTimeout(fallbackTimer)
      const map = mapRef.current as (Leaflet.Map & { __ondoResizeCleanup?: () => void }) | null
      map?.__ondoResizeCleanup?.()
      map?.remove()
      mapRef.current = null
      markerLayerRef.current = null
      tileLayerRef.current = null
    }
  }, [actions, tileRetry])

  const filteredVenues = useMemo(() => MAP_VENUES.filter((venue) => {
    const inViewport = level === "nation" || viewportVenueIds.includes(venue.id)
    return inViewport && matchesFilters(venue, filters, locale)
  }), [filters, level, locale, viewportVenueIds])

  useEffect(() => {
    const leaflet = leafletRef.current
    const map = mapRef.current
    const layer = markerLayerRef.current
    if (!leaflet || !map || !layer) return
    layer.clearLayers()

    const addMarker = (entity: MarkerEntity, kind: "region" | "neighborhood" | "venue") => {
      const name = entity.name[locale]
      const accessibleName = `${heatAccessibleName({ score: entity.ondoScore, level: entity.heatLevel, signalCount: entity.signalCount, confidence: entity.confidence, freshness: currentFreshness(entity), name, locale })}${kind === "venue" && (entity as MapVenue).alcohol ? locale === "ko" ? ", 주류 이용 19+ 조건" : ", 19+ condition for alcohol" : ""}`
      const selected = kind === "venue" && entity.id === selectedId
      const size = kind === "region" ? 52 : selected ? 48 : kind === "venue" ? 44 : 48
      const icon = leaflet.divIcon({
        className: "ondoLeafletIcon",
        html: markerHtml(entity, locale, selected),
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      })
      const marker = leaflet.marker([entity.latitude, entity.longitude], {
        icon,
        keyboard: true,
        title: name,
        alt: accessibleName,
        riseOnHover: true,
        zIndexOffset: selected ? 1000 : 0,
      })
      marker.on("click", () => {
        if (kind === "region") {
          const region = entity as MapRegion
          if (region.cityId) setActiveCity(region.cityId)
          setActiveNeighborhood(undefined)
          map.fitBounds(region.bounds, { paddingTopLeft: [24, 165], paddingBottomRight: [24, 120], animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches })
          return
        }
        if (kind === "neighborhood") {
          const neighborhood = entity as MapNeighborhood
          setActiveCity(neighborhood.cityId)
          setActiveNeighborhood(neighborhood.id)
          map.setView([neighborhood.latitude, neighborhood.longitude], 13, { animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches })
          return
        }
        const venue = entity as MapVenue
        actions.setSurface({ kind: "venue", venueId: venue.id })
        map.setView([venue.latitude, venue.longitude], Math.max(14, map.getZoom()), { animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches })
      })
      marker.addTo(layer)
      const element = marker.getElement()
      element?.setAttribute("data-testid", `${kind}-marker-${entity.id}`)
      element?.setAttribute("data-latitude", String(entity.latitude))
      element?.setAttribute("data-longitude", String(entity.longitude))
      element?.setAttribute("aria-label", accessibleName)
    }

    if (level === "nation") MAP_REGIONS.forEach((region) => addMarker(region, "region"))
    else if (level === "city") {
      // Keep source coordinates exact. At city zoom, use a representative subset
      // instead of visually displacing overlapping Euljiro and Seongsu markers.
      MAP_NEIGHBORHOODS
        .filter((item) => !activeCity || item.cityId === activeCity)
        .filter((item) => activeCity !== "seoul" || item.id === "seongsu" || item.id === "mangwon")
        .forEach((item) => addMarker(item, "neighborhood"))
    }
    else filteredVenues.forEach((venue) => addMarker(venue, "venue"))
  }, [actions, activeCity, filteredVenues, level, locale, selectedId, zoom])

  useEffect(() => {
    if (!selectedId) return
    const venue = MAP_VENUE_BY_ID.get(selectedId)
    const map = mapRef.current
    if (!venue || !map) return
    if (map.getZoom() < 14) map.setView([venue.latitude, venue.longitude], 14, { animate: false })
  }, [selectedId])

  useEffect(() => {
    if (!urlReady) return
    const next: DiscoveryUrlState = {
      ...filters,
      city: activeCity,
      neighborhood: activeNeighborhood,
      venueId: selectedId,
      view: viewMode,
    }
    writeDiscoveryUrl(next)
  }, [activeCity, activeNeighborhood, filters, selectedId, urlReady, viewMode])

  useEffect(() => {
    const offline = () => setTileState("offline")
    const online = () => setTileState((current) => current === "offline" ? "loading" : current)
    window.addEventListener("offline", offline)
    window.addEventListener("online", online)
    return () => {
      window.removeEventListener("offline", offline)
      window.removeEventListener("online", online)
    }
  }, [])

  useEffect(() => {
    if (!legendOpen) return
    const previous = document.activeElement as HTMLElement | null
    legendCloseRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      event.preventDefault()
      setLegendOpen(false)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      if (previous?.isConnected) previous.focus()
    }
  }, [legendOpen])

  function setFilter<Key extends keyof DiscoveryFilters>(key: Key, value: DiscoveryFilters[Key]) {
    setFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === "hotOnly" && value ? { calmOnly: false } : {}),
      ...(key === "calmOnly" && value ? { hotOnly: false } : {}),
    }))
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS)
  }

  function showNation() {
    setActiveCity(undefined)
    setActiveNeighborhood(undefined)
    actions.setSurface({ kind: "map" })
    setViewMode("map")
    mapRef.current?.setView(KOREA_CENTER, 7, { animate: false })
  }

  function selectVenue(venue: MapVenue) {
    setActiveCity(venue.cityId)
    setActiveNeighborhood(venue.neighborhoodId)
    actions.setSurface({ kind: "venue", venueId: venue.id })
    setViewMode("map")
    mapRef.current?.setView([venue.latitude, venue.longitude], 14, { animate: false })
  }

  function locate() {
    const scenario = new URLSearchParams(window.location.search).get("scenario")
    if (scenario === "location-denied") {
      setLocationDenied(true)
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocationDenied(false)
        mapRef.current?.setView([coords.latitude, coords.longitude], 14, { animate: false })
      },
      () => setLocationDenied(true),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60_000 },
    )
  }

  function retryTiles() {
    tileLayerRef.current?.remove()
    const map = mapRef.current as (Leaflet.Map & { __ondoResizeCleanup?: () => void }) | null
    map?.__ondoResizeCleanup?.()
    map?.remove()
    mapRef.current = null
    markerLayerRef.current = null
    tileLayerRef.current = null
    tileFailureCountRef.current = 0
    setTileState("loading")
    setViewMode("map")
    setTileRetry((current) => current + 1)
  }

  const notice = tileState === "offline"
    ? { title: copy.offlineTitle, body: copy.tileBody }
    : tileState === "error"
      ? { title: copy.tileTitle, body: copy.tileBody }
      : locationDenied
        ? { title: copy.deniedTitle, body: copy.deniedBody }
        : null

  return (
    <section className={styles.root} data-testid="ondo-map-entry" data-map-level={level} data-tile-state={tileState}>
      <h1 className={styles.srOnly}>{locale === "ko" ? "ONDO — 로컬이 지금 먹는 곳" : "ONDO — Where locals eat now"}</h1>
      <div ref={mapNodeRef} className={styles.mapCanvas} data-testid="leaflet-map" aria-label={locale === "ko" ? "실제 좌표 기반 ONDO 지도" : "ONDO map based on real coordinates"} />
      <div className={styles.paperTexture} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.brandRow}>
          <button type="button" className={styles.wordmark} onClick={showNation} aria-label={locale === "ko" ? "전국 ONDO로 이동" : "Go to nationwide ONDO"}>
            <i aria-hidden="true" /> <strong>ONDO</strong><small>{copy.tagline}</small>
          </button>
          <button type="button" className={styles.languageButton} onClick={() => actions.setLocale(locale === "en" ? "ko" : "en")} aria-label={locale === "en" ? "한국어로 보기" : "View in English"}>
            <Languages size={16} /> {locale === "en" ? "KO" : "EN"}
          </button>
        </div>
        <label className={styles.search}>
          <Search size={19} aria-hidden="true" />
          <span className={styles.srOnly}>{copy.search}</span>
          <input value={filters.query} onChange={(event) => setFilter("query", event.target.value)} placeholder={copy.search} data-testid="map-search" />
          {filters.query ? <button type="button" onClick={() => setFilter("query", "")} aria-label={locale === "ko" ? "검색어 지우기" : "Clear search"}><X size={17} /></button> : null}
        </label>
        <div className={styles.chips} aria-label={locale === "ko" ? "지도 필터" : "Map filters"}>
          <button type="button" onClick={locate}><LocateFixed size={15} /> {copy.nearby}</button>
          <button type="button" className={filters.hotOnly ? styles.chipActive : undefined} aria-pressed={filters.hotOnly} onClick={() => setFilter("hotOnly", !filters.hotOnly)}>{copy.hot}</button>
          <button type="button" className={filters.calmOnly ? styles.chipActive : undefined} aria-pressed={filters.calmOnly} onClick={() => setFilter("calmOnly", !filters.calmOnly)}>{copy.calm}</button>
          <button type="button" className={filters.openOnly ? styles.chipActive : undefined} aria-pressed={filters.openOnly} onClick={() => setFilter("openOnly", !filters.openOnly)}>{copy.open}</button>
          {(["now", "dinner", "late"] as const).map((time) => <button key={time} type="button" className={filters.time === time ? styles.chipActive : undefined} aria-pressed={filters.time === time} onClick={() => setFilter("time", time)}>{copy[time]}</button>)}
        </div>
      </header>

      {viewMode === "map" ? (
        <>
          <div className={styles.contextCard}>
            <span>{level === "nation" ? "KOREA · FOOD SIGNALS" : activeCity === "busan" ? "BUSAN · EARLY COVERAGE" : "SEOUL · LOCAL SIGNALS"}</span>
            <strong>{regionHeading(level, activeCity, locale)}</strong>
            {activeCity === "busan" ? <small>{copy.coverageSeed} · {MAP_REGIONS.find((region) => region.cityId === "busan")?.signalCount} {locale === "ko" ? "최근 신호" : "recent signals"}</small> : null}
          </div>
          <div className={styles.controls} aria-label={locale === "ko" ? "지도 제어" : "Map controls"}>
            <button type="button" onClick={() => setViewMode("list")} aria-label={copy.list}><List size={19} /></button>
            <button type="button" onClick={() => mapRef.current?.zoomIn()} aria-label={locale === "ko" ? "확대" : "Zoom in"}><Plus size={19} /></button>
            <button type="button" onClick={() => mapRef.current?.zoomOut()} aria-label={locale === "ko" ? "축소" : "Zoom out"}><Minus size={19} /></button>
            <button type="button" onClick={locate} aria-label={locale === "ko" ? "내 위치로 이동" : "Go to my location"}><LocateFixed size={19} /></button>
          </div>
          <button type="button" className={styles.legendPill} onClick={() => setLegendOpen(true)} aria-label={copy.legendTitle}>
            <Layers3 size={16} /> <span>ONDO</span><i className={styles.legendColors} aria-hidden="true" />
          </button>
          <a className={styles.attribution} href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>
          {tileState === "loading" ? <div className={styles.tileSkeleton} data-testid="tile-skeleton" aria-hidden="true" /> : null}
        </>
      ) : null}

      {(viewMode === "list" || tileState === "error" || tileState === "offline") ? (
        <main className={styles.listPanel} data-testid="map-list-panel">
          {notice ? (
            <div className={styles.notice} role="status" data-testid={tileState === "error" ? "tile-error-notice" : locationDenied ? "location-denied-notice" : "offline-notice"}>
              <CircleHelp size={20} />
              <span><strong>{notice.title}</strong><small>{notice.body}</small></span>
              {tileState === "error" ? <button type="button" onClick={retryTiles}>{copy.retry}</button> : null}
            </div>
          ) : null}
          <div className={styles.listHeading}>
            <span><small>{level.toUpperCase()}</small><strong>{regionHeading(level, activeCity, locale)}</strong></span>
            <button type="button" onClick={() => setViewMode("map")}><MapIcon size={17} /> {copy.map}</button>
          </div>
          <p className={styles.resultCount} aria-live="polite"><b>{filteredVenues.length}</b> {copy.results}</p>
          {filteredVenues.length ? <VenueList venues={filteredVenues} locale={locale} selectedId={selectedId} onSelect={selectVenue} /> : (
            <div className={styles.empty}>
              <Search size={26} />
              <p>{copy.noResults}</p>
              <button type="button" onClick={resetFilters}>{copy.reset}</button>
            </div>
          )}
        </main>
      ) : (
        <p className={styles.srResults} aria-live="polite">
          {locale === "ko"
            ? `현재 지도에 ${filteredVenues.length}개 장소: ${filteredVenues.map((venue) => venue.name.ko).join(", ")}`
            : `${filteredVenues.length} places in the current map: ${filteredVenues.map((venue) => venue.name.en).join(", ")}`}
        </p>
      )}

      {locationDenied && viewMode === "map" && tileState !== "error" ? (
        <div className={styles.floatingNotice} role="status" data-testid="location-denied-notice">
          <span><strong>{copy.deniedTitle}</strong><small>{copy.deniedBody}</small></span>
          <button type="button" onClick={() => setLocationDenied(false)} aria-label={locale === "ko" ? "닫기" : "Close"}><X size={17} /></button>
        </div>
      ) : null}

      {legendOpen ? (
        <div className={styles.legendLayer} role="dialog" aria-modal="true" aria-labelledby="ondo-legend-title" data-testid="heat-legend">
          <button type="button" className={styles.legendBackdrop} onClick={() => setLegendOpen(false)} aria-label={locale === "ko" ? "열기 기준 닫기" : "Close heat guide"} tabIndex={-1} />
          <section className={styles.legendSheet}>
            <div className={styles.legendGrabber} aria-hidden="true" />
            <button ref={legendCloseRef} type="button" className={styles.legendClose} onClick={() => setLegendOpen(false)} aria-label={locale === "ko" ? "닫기" : "Close"}><X size={19} /></button>
            <span>ONDO · FOOD SIGNAL</span>
            <h2 id="ondo-legend-title">{copy.legendTitle}</h2>
            <p>{copy.legendBody}</p>
            <div className={styles.legendGrid}>
              {(Object.keys(HEAT_COLORS) as Array<keyof typeof HEAT_COLORS>).map((heat) => (
                <div key={heat}>
                  <i style={{ background: HEAT_COLORS[heat].fill, borderColor: HEAT_COLORS[heat].stroke, borderStyle: heat === "limited" ? "dashed" : "solid" }}>{heat === "limited" ? "—" : heat === "low" ? "20" : heat === "warming" ? "48" : heat === "rising" ? "68" : heat === "hot" ? "82" : "94"}</i>
                  <span><strong>{HEAT_LABELS[locale][heat]}</strong><small>{heat === "limited" ? CONFIDENCE_LABELS[locale].limited : `${heat === "low" ? "0–39" : heat === "warming" ? "40–59" : heat === "rising" ? "60–74" : heat === "hot" ? "75–89" : "90–100"}`}</small></span>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  )
}
