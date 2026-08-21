"use client"

import type { GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent } from "maplibre-gl"
import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, ChevronRight, Languages, List, LocateFixed, Map as MapIcon, Search, SlidersHorizontal, X } from "lucide-react"
import { KOREA_OUTLINE_COORDINATES } from "@/lib/map/korea-atlas-data"
import { HEAT_COLORS } from "@/lib/ondo/map/heat"
import { ondoMapStyle } from "@/lib/ondo/map/ondo-map-style"
import type { CanonicalMapVenue, VenuePrimaryCategory } from "@/lib/ondo/venues"
import { CANONICAL_MAP_VENUES_COMPACT } from "@/lib/ondo/venues/map-data"
import { B_DEMO_SIGNAL_BY_VENUE_ID } from "@/lib/ondo/venues/demo-signals"
import { venueDisplayName, venueDistrictLabel, venueNamePresentation } from "@/lib/ondo/venues/display"
import { mapFoodIntentAliases } from "@/lib/ondo/venues/map-discovery-aliases"
import type { DiscoveryPreference, HeatLevel } from "../contracts/domain"
import { useOndo } from "../shared/state/ondo-provider"
import type { Locale } from "../contracts/domain"
import {
  enterBDiscoveryCity,
  focusBDiscoveryTarget,
  goBackFromBDiscovery,
  initializeBDiscoveryHistory,
  openBDiscoveryVenue,
  readBDiscoveryHistory,
  replaceBDiscoveryCityContext,
  type BDiscoveryHeat,
  type BDiscoveryHistoryEntry,
} from "./b-discovery-history"
import styles from "./map-b.module.css"

type CityId = "seoul" | "busan"
type ViewMode = "map" | "list"
type LocationState = "idle" | "locating" | "ready" | "denied" | "unsupported"
type UserLocation = { longitude: number; latitude: number }
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
    tagline: "Sourced places · Simulated snapshot",
    title: "Choose Seoul or Busan for a food-place preview.",
    body: "A fixed demo snapshot of sourced places. ONDO scores and colors are simulated—not live activity or trends.",
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
    source: "Fixed demo snapshot · Place records are sourced; ONDO scores are simulated",
    more: "Load 30 more",
    mapA11y: "The map is visual. Open the List for keyboard-accessible place results.",
    mapUnavailable: "The map could not load. The same sourced place list remains available.",
    retryMap: "Retry map",
    offlineTitle: "Offline · Saved information",
    offlineSnapshot: "MOIS LOCALDATA fixture snapshot · Aug 19, 2026, 11:34 KST",
    locationUnavailable: "Your location was not used. Search or choose a place from the map.",
    locating: "Finding your location…",
    locationReady: "You’re here",
    locationDenied: "Location access is off. Search still works. Change the browser permission, then try again.",
    locationUnsupported: "This browser cannot share a location. Search and the full place list still work.",
    locate: "My location",
    retryLocation: "Try my location again",
    nearest: "nearest sourced place",
    mapLoading: "Loading the place map…",
    noResultsTitle: "No places match yet",
    noResultsBody: "Clear the search and signal filters to see every sourced place in this city.",
    clearResults: "Clear search and filters",
    after19Mode: "ONDO simulated 19+ night-preview places",
    contributed: "Your visit signal is recorded · Score pending",
    officialPlaces: "official place records",
    previewPlaces: "preview signal places",
    inputSignals: "input signals",
    confidence: "illustrative score basis",
    officialShort: "official",
    previewShort: "preview",
    inputShort: "inputs",
    confidenceShort: "preview band",
    confidenceStrong: "Strong",
    confidenceModerate: "Moderate",
    confidenceLimited: "Limited",
    snapshot: "Fixed Aug 19 snapshot",
    simulated: "Not live · Simulated",
    simulatedSnapshot: "Simulated snapshot",
    clusterKey: "Places",
    scoreKey: "Simulated score",
    mapKeyLabel: "Outlined count means a sourced place group. Solid color means a simulated ONDO score.",
    topSignals: "Highest simulated scores at this zoom",
    moreSignals: "More simulated scores as you zoom in",
    allSignals: "All simulated scores at this zoom",
    filteredResult: "Filtered result shown on the map",
    filteredResults: "Filtered results shown on the map",
    preferences: "Starting interests",
    editPreferences: "Edit interests",
    noPreferences: "Tune interests",
    preferenceBoundary: "Saved as discovery context. Current official records cannot verify dietary fit, late hours, café type, or atmosphere, so results are not silently filtered.",
    resetPreferences: "Reset interests",
    closePreferences: "Close interests",
    citySnapshotBoundary: "Fixed simulated snapshot · Not live activity or trends",
  },
  ko: {
    tagline: "공식 장소 · 시뮬레이션 스냅샷",
    title: "서울과 부산의 식음료 장소를 살펴보세요.",
    body: "공식 장소 기록 위에 고정된 데모 스냅샷을 표시해요. ONDO 점수와 색은 실시간 현황이나 추세가 아닌 시뮬레이션입니다.",
    search: "가게 이름, 지역, 음식 검색",
    all: "모든 장소",
    signal: "ONDO 신호",
    pending: "신호 수집 중",
    list: "목록",
    map: "지도",
    back: "전국",
    places: "공식 식음료 장소",
    neutral: "장소 정보만 · 신호 수집 중",
    simulatedList: "ONDO 신호 프리뷰 · 시뮬레이션",
    source: "고정 데모 스냅샷 · 장소는 공식 기록, ONDO 점수는 시뮬레이션",
    more: "30개 더 보기",
    mapA11y: "지도는 시각 정보예요. 키보드로 장소를 찾으려면 목록을 여세요.",
    mapUnavailable: "지도를 불러오지 못했어요. 같은 공식 장소 목록은 계속 볼 수 있어요.",
    retryMap: "지도 다시 불러오기",
    offlineTitle: "오프라인 · 저장된 정보",
    offlineSnapshot: "행정안전부 LOCALDATA fixture 스냅샷 · 2026. 8. 19. 11:34 KST",
    locationUnavailable: "현재 위치를 사용하지 않았어요. 검색하거나 지도에서 장소를 골라보세요.",
    locating: "현재 위치를 찾는 중…",
    locationReady: "현재 위치",
    locationDenied: "위치 권한이 꺼져 있어요. 검색은 그대로 쓸 수 있어요. 브라우저 권한을 바꾼 뒤 다시 시도하세요.",
    locationUnsupported: "이 브라우저에서는 위치를 공유할 수 없어요. 검색과 전체 장소 목록은 그대로 쓸 수 있어요.",
    locate: "내 위치",
    retryLocation: "내 위치 다시 시도",
    nearest: "가장 가까운 공식 장소",
    mapLoading: "장소 지도를 불러오는 중…",
    noResultsTitle: "조건에 맞는 장소가 아직 없어요",
    noResultsBody: "검색어와 신호 필터를 초기화하면 이 도시의 모든 공식 장소를 볼 수 있어요.",
    clearResults: "검색어와 필터 초기화",
    after19Mode: "ONDO 시뮬레이션 19+ 야간 프리뷰 장소",
    contributed: "내 방문 신호 기록됨 · 점수 산출 전",
    officialPlaces: "공식 장소 기록",
    previewPlaces: "시뮬레이션 프리뷰 장소",
    inputSignals: "시뮬레이션 입력 신호",
    confidence: "예시 점수 근거",
    officialShort: "공식 장소",
    previewShort: "프리뷰 장소",
    inputShort: "입력 신호",
    confidenceShort: "예시 근거",
    confidenceStrong: "강함",
    confidenceModerate: "보통",
    confidenceLimited: "제한적",
    snapshot: "8월 19일 고정 스냅샷",
    simulated: "실시간 아님 · 시뮬레이션",
    simulatedSnapshot: "시뮬레이션 스냅샷",
    clusterKey: "공식 장소",
    scoreKey: "시뮬레이션 점수",
    mapKeyLabel: "테두리 숫자는 공식 장소 묶음, 단색 원은 ONDO 시뮬레이션 점수를 뜻합니다.",
    topSignals: "이 줌의 높은 시뮬레이션 점수",
    moreSignals: "확대하면 시뮬레이션 점수가 더 보여요",
    allSignals: "이 줌의 모든 시뮬레이션 점수",
    filteredResult: "검색 결과를 지도에 표시",
    filteredResults: "검색 결과를 지도에 표시",
    preferences: "시작 관심사",
    editPreferences: "관심사 수정",
    noPreferences: "관심사 설정",
    preferenceBoundary: "탐색 맥락으로만 저장해요. 현재 공식 장소 기록은 식이 적합성·심야 영업·카페 유형·분위기를 확인하지 못하므로 결과를 몰래 필터링하지 않아요.",
    resetPreferences: "관심사 초기화",
    closePreferences: "관심사 닫기",
    citySnapshotBoundary: "고정 시뮬레이션 스냅샷 · 실시간 현황이나 추세 아님",
  },
} as const

const PREFERENCE_COPY: Record<DiscoveryPreference, { en: string; ko: string }> = {
  classic: { en: "Local classics", ko: "로컬의 익숙한 맛" },
  cafe: { en: "Cafés and dessert", ko: "카페와 디저트" },
  late: { en: "Late-night food", ko: "늦은 시간의 한 끼" },
  lively: { en: "Lively", ko: "활기찬 분위기" },
  calm: { en: "A little calmer", ko: "조금 여유롭게" },
  vegetarian: { en: "Vegetarian", ko: "채식" },
  vegan: { en: "Vegan", ko: "비건" },
  halal: { en: "Halal", ko: "할랄" },
  allergy_aware: { en: "Allergy-aware", ko: "알레르기 주의" },
}

const ALL_PREFERENCES = Object.keys(PREFERENCE_COPY) as DiscoveryPreference[]

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
  const officialVenues = CANONICAL_MAP_VENUES_COMPACT.filter((venue) => venue.cityId === cityId)
  const signals = officialVenues
    .flatMap((venue) => {
      const signal = B_DEMO_SIGNAL_BY_VENUE_ID.get(venue.id)
      return signal ? [signal] : []
    })
  const signalCount = signals.reduce((sum, signal) => sum + signal.signalCount, 0)
  const ondoScore = signalCount ? Math.round(signals.reduce((sum, signal) => sum + signal.score * signal.signalCount, 0) / signalCount) : null
  const confidence = signalCount ? signals.reduce((sum, signal) => sum + signal.confidence * signal.signalCount, 0) / signalCount : null
  const heatLevel: HeatLevel = ondoScore === null ? "limited" : ondoScore >= 88 ? "peak" : ondoScore >= 76 ? "hot" : ondoScore >= 62 ? "rising" : "warming"
  const computedAt = signals.reduce<string | null>((latest, signal) => latest == null || signal.computedAt > latest ? signal.computedAt : latest, null)
  return {
    ondoScore,
    heatLevel,
    officialVenueCount: officialVenues.length,
    signalVenueCount: signals.length,
    signalCount,
    confidence,
    computedAt,
    truth: "SIMULATED" as const,
  }
}

function previewConfidenceBand(value: number | null, locale: Locale) {
  const copy = COPY[locale]
  if (value !== null && value >= 0.8) return copy.confidenceStrong
  if (value !== null && value >= 0.65) return copy.confidenceModerate
  return copy.confidenceLimited
}

function officialVenueCount(count: number, locale: Locale) {
  return locale === "ko" ? `${count}곳의 공식 장소 기록` : `${count} official place records`
}

function previewVenueCount(count: number, locale: Locale) {
  return locale === "ko" ? `${count}곳의 시뮬레이션 프리뷰` : `${count} preview signal places`
}

function inputSignalCount(count: number, locale: Locale) {
  return locale === "ko" ? `${count}개의 시뮬레이션 입력` : `${count} simulated inputs`
}

function resultCount(count: number, locale: Locale, after19: boolean) {
  if (locale === "ko") return after19 ? `${count}곳의 ONDO 시뮬레이션 19+ 야간 프리뷰 장소` : `${count}곳의 공식 식음료 장소`
  if (after19) return `${count} ${count === 1 ? "ONDO simulated 19+ night-preview place" : COPY.en.after19Mode}`
  return `${count} ${count === 1 ? "sourced food place" : COPY.en.places}`
}

function distanceInMeters(from: UserLocation, venue: Pick<BMapVenue, "longitude" | "latitude">) {
  const radians = (degrees: number) => degrees * Math.PI / 180
  const earthRadius = 6_371_000
  const latitudeDelta = radians(venue.latitude - from.latitude)
  const longitudeDelta = radians(venue.longitude - from.longitude)
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(from.latitude)) * Math.cos(radians(venue.latitude)) * Math.sin(longitudeDelta / 2) ** 2
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function displayDistance(distance: number, locale: Locale) {
  if (distance < 1_000) return locale === "ko" ? `${Math.max(10, Math.round(distance / 10) * 10)}m 거리` : `${Math.max(10, Math.round(distance / 10) * 10)} m away`
  const kilometers = (distance / 1_000).toFixed(distance < 10_000 ? 1 : 0)
  return locale === "ko" ? `${kilometers}km 거리` : `${kilometers} km away`
}

function NationPulse({ locale, onSelect }: { locale: Locale; onSelect(city: CityId): void }) {
  const copy = COPY[locale]
  return (
    <section className={styles.nation} data-testid="ondo-b-nation">
      <div className={styles.nationIntro}>
        <small>KOREA · FOOD SIGNALS</small>
        <h1>{copy.title}</h1>
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
            <button
              key={cityId}
              type="button"
              className={styles.cityNode}
              data-city={cityId}
              data-official-count={region.officialVenueCount}
              data-signal-venue-count={region.signalVenueCount}
              data-sample-count={region.signalCount}
              data-signal-truth={region.truth}
              data-computed-at={region.computedAt ?? undefined}
              onClick={() => onSelect(cityId)}
              aria-label={`${CITY[cityId].label[locale]} · ${officialVenueCount(region.officialVenueCount, locale)} · ${previewVenueCount(region.signalVenueCount, locale)} · ${inputSignalCount(region.signalCount, locale)} · ${previewConfidenceBand(region.confidence, locale)} ${copy.confidence} · ${copy.simulatedSnapshot} · ONDO ${region.ondoScore ?? "—"}`}
            >
              <i style={{ background: palette.fill, color: palette.text, borderColor: palette.stroke }}>{region.ondoScore ?? "—"}</i>
              <span>
                <strong>{CITY[cityId].label[locale]} <em>{locale === "ko" ? "데모" : "DEMO"}</em></strong>
                <small>{locale === "ko" ? "식음료 지도 열기" : "Open food map"}</small>
                <em className={styles.cityScoreTruth}>{copy.scoreKey} {region.ondoScore ?? "—"}/100 · {locale === "ko" ? `${region.signalCount}개 입력` : `${region.signalCount} inputs`}</em>
              </span>
            </button>
          )
        })}
      </div>
      <aside className={styles.cityTruthLegend} data-testid="ondo-b-city-truth-legend">
        {(["seoul", "busan"] as const).map((cityId) => {
          const region = cityPulse(cityId)
          return <div key={cityId}><strong>{CITY[cityId].label[locale]}</strong><span>{locale === "ko" ? `공식 장소 ${region.officialVenueCount}곳 · 점수 프리뷰 ${region.signalVenueCount}곳` : `${region.officialVenueCount} sourced · ${region.signalVenueCount} scored previews`}</span><small>{locale === "ko" ? `시뮬레이션 입력 ${region.signalCount}개` : `${region.signalCount} simulated inputs`} · {previewConfidenceBand(region.confidence, locale)} {copy.confidenceShort}</small><small>{copy.snapshot} · {copy.simulated}</small></div>
        })}
      </aside>
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

function toNeutralFeatureCollection(venues: readonly BMapVenue[]) {
  return toFeatureCollection(venues.filter((venue) => venue.signalTruth === "UNKNOWN"))
}

type SignalZoomTier = "top" | "more" | "all"

function signalDensityForZoom(zoom: number): { tier: SignalZoomTier; minimumScore: number } {
  if (zoom < 11.75) return { tier: "top", minimumScore: 84 }
  if (zoom < 13.5) return { tier: "more", minimumScore: 72 }
  return { tier: "all", minimumScore: 0 }
}

function signalLayerFilter(minimumScore: number) {
  return [">=", ["get", "score"], minimumScore] as never
}

function focusFilteredVenues(map: MapLibreMap, venues: readonly BMapVenue[]) {
  if (venues.length === 0) return
  if (venues.length === 1) {
    map.jumpTo({ center: [venues[0].longitude, venues[0].latitude], zoom: 15 })
    return
  }
  const longitudes = venues.map((venue) => venue.longitude)
  const latitudes = venues.map((venue) => venue.latitude)
  map.fitBounds([
    [Math.min(...longitudes), Math.min(...latitudes)],
    [Math.max(...longitudes), Math.max(...latitudes)],
  ], {
    duration: 0,
    maxZoom: 14.5,
    padding: { top: 220, right: 72, bottom: 160, left: 72 },
  })
}

function toContributionFeatureCollection(venues: readonly BMapVenue[], contributedVenueIds: ReadonlySet<string>) {
  return toFeatureCollection(venues.filter((venue) => contributedVenueIds.has(venue.id)))
}

function toUserLocationFeatureCollection(location: UserLocation | null): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: location ? [{ type: "Feature", geometry: { type: "Point", coordinates: [location.longitude, location.latitude] }, properties: {} }] : [],
  }
}

function heatColorExpression() {
  return ["match", ["get", "heat"], "peak", "#7a2048", "hot", "#c94832", "rising", "#e6843b", "warming", "#ebc463", "low", "#efe1b7", "#cfcac0"] as never
}

function VenueList({ venues, locale, visibleCount, contributedVenueIds, onClear, onMore, onSelect }: { venues: BMapVenue[]; locale: Locale; visibleCount: number; contributedVenueIds: ReadonlySet<string>; onClear(): void; onMore(): void; onSelect(venue: BMapVenue): void }) {
  const copy = COPY[locale]
  return (
    <ul className={styles.venueList} data-testid="ondo-b-venue-list">
      {venues.slice(0, visibleCount).map((venue) => {
        const presentation = venueNamePresentation(venue.name.ko, locale)
        const signalTruthLabel = contributedVenueIds.has(venue.id)
          ? copy.contributed
          : venue.signalTruth === "SIMULATED"
            ? `${copy.scoreKey} ${venue.ondoScore}/100 · ${inputSignalCount(B_DEMO_SIGNAL_BY_VENUE_ID.get(venue.id)?.signalCount ?? 0, locale)} · ${copy.simulated}`
            : copy.neutral
        return (
        <li key={venue.id}>
          <button type="button" onClick={() => onSelect(venue)} data-venue-opener={venue.id} aria-label={`${presentation.officialName} · ${presentation.officialNameLabel} · ${presentation.transliteration} · ${presentation.transliterationLabel} · ${venueDistrictLabel(venue.cityId, venue.districtId, locale)} · ${CATEGORY[venue.primaryCategory][locale]} · ${signalTruthLabel}`}>
            <span className={styles.score} data-level={venue.heatLevel}>{venue.ondoScore ?? "—"}</span>
            <span>
              <small>{venueDistrictLabel(venue.cityId, venue.districtId, locale)} · {CATEGORY[venue.primaryCategory][locale]}</small>
              <strong data-testid="official-source-name">{presentation.officialName}</strong>
              <em className={styles.officialNameTruth}>{presentation.officialNameLabel}</em>
              <small className={styles.transliterationTruth}><span>{presentation.transliteration}</span> · {presentation.transliterationLabel}</small>
              <small className={styles.signalTruth}>{signalTruthLabel}</small>
            </span>
            <ChevronRight size={17} />
          </button>
        </li>
      )})}
      {visibleCount < venues.length ? <li className={styles.loadMore}><button type="button" onClick={onMore}>{copy.more}</button></li> : null}
      {!venues.length ? <li className={styles.empty} data-testid="ondo-b-empty-results" role="status"><strong>{copy.noResultsTitle}</strong><span>{copy.noResultsBody}</span><button type="button" onClick={onClear}>{copy.clearResults}</button></li> : null}
    </ul>
  )
}

export function MapEntryB() {
  const { state, actions } = useOndo()
  const locale = state.locale
  const copy = COPY[locale]
  const mapNode = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const filteredMapRef = useRef(false)
  const userLocationRef = useRef<UserLocation | null>(null)
  const urlHydrated = useRef(false)
  const retryFocusPending = useRef(false)
  const [city, setCity] = useState<CityId | null>(null)
  const [view, setView] = useState<ViewMode>("map")
  const [query, setQuery] = useState("")
  const [heat, setHeat] = useState<"all" | "signal" | "pending">("all")
  const [mapState, setMapState] = useState<"idle" | "loading" | "ready" | "error">("idle")
  const [visibleCount, setVisibleCount] = useState(30)
  const [retryToken, setRetryToken] = useState(0)
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [signalZoomTier, setSignalZoomTier] = useState<SignalZoomTier>("top")
  const [renderedSignalCount, setRenderedSignalCount] = useState(0)
  const [minimumSignalDistance, setMinimumSignalDistance] = useState<number | null>(null)
  const [locationState, setLocationState] = useState<LocationState>("idle")
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [online, setOnline] = useState(true)
  const after19On = state.after19 === "A19-ON"
  const preferenceLabels = state.discoveryPreferences.map((preference) => PREFERENCE_COPY[preference][locale])
  const preferenceSummary = preferenceLabels.length
    ? locale === "ko" ? `시작 관심사 ${preferenceLabels.length}개` : `${preferenceLabels.length} starting ${preferenceLabels.length === 1 ? "interest" : "interests"}`
    : copy.noPreferences
  const contributedVenueIds = useMemo(() => new Set(state.acceptedActivityEventKeys.flatMap((key) => {
    const match = key.match(/local-signal:(mois-[a-z0-9]+):/)
    return match ? [match[1]] : []
  })), [state.acceptedActivityEventKeys])
  const selectedVenueId = state.surface.kind === "venue" ? state.surface.venueId : null

  useEffect(() => {
    if (urlHydrated.current) return
    urlHydrated.current = true
    const applyHistoryEntry = (entry: BDiscoveryHistoryEntry, restoreFocus: boolean) => {
      setCity(entry.city ?? null)
      setView(entry.view)
      setQuery(entry.query)
      setHeat(entry.heat)
      if ((entry.level === "peek" || entry.level === "detail") && entry.venueId) actions.setSurface({ kind: "venue", venueId: entry.venueId })
      else actions.setSurface({ kind: "map" })
      if (restoreFocus && (entry.level === "nation" || entry.level === "city")) {
        window.setTimeout(() => focusBDiscoveryTarget(entry)?.focus({ preventScroll: true }), 0)
      }
    }
    const initial = initializeBDiscoveryHistory((venueId) => CANONICAL_MAP_VENUES_COMPACT.find((venue) => venue.id === venueId)?.cityId)
    applyHistoryEntry(initial, false)
    const onPopState = () => {
      const entry = readBDiscoveryHistory()
      if (entry) applyHistoryEntry(entry, true)
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [actions])

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    update()
    window.addEventListener("online", update)
    window.addEventListener("offline", update)
    return () => {
      window.removeEventListener("online", update)
      window.removeEventListener("offline", update)
    }
  }, [])

  const venues = useMemo(() => B_MAP_VENUES.filter((venue) => {
    if (!city || venue.cityId !== city) return false
    if (after19On && !B_DEMO_SIGNAL_BY_VENUE_ID.get(venue.id)?.after19) return false
    const haystack = `${venue.name.ko} ${venue.name.en} ${venueDisplayName(venue.name.ko, "en")} ${CATEGORY[venue.primaryCategory].ko} ${CATEGORY[venue.primaryCategory].en} ${venue.districtId} ${venueDistrictLabel(venue.cityId, venue.districtId, "en")} ${mapFoodIntentAliases(venue.name.ko).join(" ")}`.toLowerCase()
    if (query && !haystack.includes(query.toLowerCase())) return false
    if (heat === "signal" && venue.signalTruth !== "SIMULATED") return false
    if (heat === "pending" && venue.signalTruth !== "UNKNOWN") return false
    return true
  }), [after19On, city, heat, query])
  const filteredMap = query.trim().length > 0 || heat !== "all"
  filteredMapRef.current = filteredMap
  const filteredSignalVenues = venues.filter((venue) => venue.signalTruth === "SIMULATED")
  const filteredLegendScore = filteredSignalVenues.length
    ? Math.max(...filteredSignalVenues.map((venue) => venue.ondoScore ?? 0))
    : null
  const filteredLegendCopy = venues.length === 1 ? copy.filteredResult : copy.filteredResults
  const nearestVenue = useMemo(() => {
    if (!userLocation || !venues.length) return null
    return venues.reduce<{ venue: BMapVenue; distance: number } | null>((nearest, venue) => {
      const distance = distanceInMeters(userLocation, venue)
      return nearest == null || distance < nearest.distance ? { venue, distance } : nearest
    }, null)
  }, [userLocation, venues])

  useEffect(() => { setVisibleCount(30) }, [city, heat, query])

  useEffect(() => {
    if (!selectedVenueId) return
    const selected = CANONICAL_MAP_VENUES_COMPACT.find((venue) => venue.id === selectedVenueId)
    if (selected) setCity(selected.cityId)
  }, [selectedVenueId])

  useEffect(() => {
    if (!city || view !== "map" || !mapNode.current || mapRef.current) return
    let disposed = false
    let failed = false
    let loadDeadline: number | undefined
    const failMap = () => {
      if (disposed || failed) return
      failed = true
      if (loadDeadline != null) window.clearTimeout(loadDeadline)
      setMapState("error")
    }
    setMapState("loading")
    loadDeadline = window.setTimeout(failMap, 8_000)
    void import("maplibre-gl").then(({ Map, NavigationControl }) => {
      if (disposed || !mapNode.current) return
      const initialFilteredVenue = filteredMapRef.current && venues.length === 1 ? venues[0] : null
      const instance = new Map({
        container: mapNode.current,
        style: ondoMapStyle(locale),
        center: initialFilteredVenue ? [initialFilteredVenue.longitude, initialFilteredVenue.latitude] : CITY[city].center,
        zoom: initialFilteredVenue ? 15 : CITY[city].zoom,
        minZoom: 8.5,
        maxZoom: 18,
        attributionControl: false,
        cooperativeGestures: true,
        locale: locale === "ko" ? {
          "Map.Title": "지도",
          "NavigationControl.ZoomIn": "지도 확대",
          "NavigationControl.ZoomOut": "지도 축소",
          "CooperativeGesturesHandler.WindowsHelpText": "Ctrl 키를 누른 채 스크롤하여 지도를 확대하거나 축소하세요",
          "CooperativeGesturesHandler.MacHelpText": "⌘ 키를 누른 채 스크롤하여 지도를 확대하거나 축소하세요",
          "CooperativeGesturesHandler.MobileHelpText": "두 손가락으로 지도를 움직이세요",
        } : undefined,
      })
      mapRef.current = instance
      instance.on("error", failMap)
      instance.addControl(new NavigationControl({ showCompass: false }), "bottom-right")
      instance.on("load", () => {
        if (disposed || failed) return
        try {
          instance.addSource("ondo-venues", { type: "geojson", data: toNeutralFeatureCollection(venues), cluster: true, clusterRadius: 48, clusterMaxZoom: 13 })
          instance.addSource("ondo-signals", { type: "geojson", data: toSignalFeatureCollection(venues) })
          instance.addSource("ondo-contributions", { type: "geojson", data: toContributionFeatureCollection(venues, contributedVenueIds) })
          instance.addSource("ondo-user-location", { type: "geojson", data: toUserLocationFeatureCollection(userLocationRef.current) })
          instance.addLayer({ id: "ondo-clusters", type: "circle", source: "ondo-venues", filter: ["has", "point_count"], paint: { "circle-color": "rgba(255,255,255,0.9)", "circle-radius": ["step", ["get", "point_count"], 15, 15, 18, 50, 22], "circle-stroke-color": "#6d6861", "circle-stroke-width": 1.5, "circle-opacity": 0.96 } })
          instance.addLayer({ id: "ondo-cluster-count", type: "symbol", source: "ondo-venues", filter: ["has", "point_count"], layout: { "text-field": ["concat", ["to-string", ["get", "point_count_abbreviated"]], "×"], "text-font": ["Noto Sans Bold"], "text-size": 11 }, paint: { "text-color": "#4c4842" } })
          instance.addLayer({ id: "ondo-points", type: "circle", source: "ondo-venues", filter: ["!", ["has", "point_count"]], paint: { "circle-color": "#9c9891", "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 3, 15, 6], "circle-opacity": 0.62, "circle-stroke-color": "#ffffff", "circle-stroke-width": 1.5 } })
          instance.addLayer({ id: "ondo-signal-points", type: "circle", source: "ondo-signals", paint: { "circle-color": heatColorExpression(), "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 13, 15, 17], "circle-stroke-color": "#ffffff", "circle-stroke-width": 2.5 } })
          instance.addLayer({ id: "ondo-score", type: "symbol", source: "ondo-signals", layout: { "text-field": ["to-string", ["get", "score"]], "text-font": ["Noto Sans Bold"], "text-size": 12 }, paint: { "text-color": ["match", ["get", "heat"], "peak", "#ffffff", "hot", "#ffffff", "rising", "#3b2d20", "warming", "#3f3928", "#282521"], "text-halo-color": "rgba(255,255,255,0.28)", "text-halo-width": 0.35 } })
          instance.addLayer({ id: "ondo-contribution-ring", type: "circle", source: "ondo-contributions", paint: { "circle-color": "rgba(0,0,0,0)", "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 17, 15, 21], "circle-stroke-color": "#c94832", "circle-stroke-width": 2.5 } })
          instance.addLayer({ id: "ondo-user-location-halo", type: "circle", source: "ondo-user-location", paint: { "circle-color": "rgba(32,32,30,0.16)", "circle-radius": 14, "circle-stroke-color": "rgba(255,255,255,0.9)", "circle-stroke-width": 1 } })
          instance.addLayer({ id: "ondo-user-location-point", type: "circle", source: "ondo-user-location", paint: { "circle-color": "#20201e", "circle-radius": 6, "circle-stroke-color": "#ffffff", "circle-stroke-width": 2 } })
        } catch {
          failMap()
          return
        }
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
          if (typeof id === "string" && CANONICAL_MAP_VENUES_COMPACT.some((venue) => venue.id === id)) {
            openBDiscoveryVenue(id)
            actions.setSurface({ kind: "venue", venueId: id })
          }
        })
        instance.on("click", "ondo-signal-points", (event: MapLayerMouseEvent) => {
          const id = event.features?.[0]?.properties?.id
          if (typeof id === "string" && CANONICAL_MAP_VENUES_COMPACT.some((venue) => venue.id === id)) {
            openBDiscoveryVenue(id)
            actions.setSurface({ kind: "venue", venueId: id })
          }
        })
        instance.on("mouseenter", "ondo-clusters", () => { instance.getCanvas().style.cursor = "pointer" })
        instance.on("mouseenter", "ondo-points", () => { instance.getCanvas().style.cursor = "pointer" })
        instance.on("mouseenter", "ondo-signal-points", () => { instance.getCanvas().style.cursor = "pointer" })
        instance.on("mouseleave", "ondo-clusters", () => { instance.getCanvas().style.cursor = "" })
        instance.on("mouseleave", "ondo-points", () => { instance.getCanvas().style.cursor = "" })
        instance.on("mouseleave", "ondo-signal-points", () => { instance.getCanvas().style.cursor = "" })
        const updateRenderedSignalCount = () => {
          const renderedById = new globalThis.Map(instance.queryRenderedFeatures({ layers: ["ondo-signal-points"] }).flatMap((feature) => {
            const id = feature.properties?.id
            return typeof id === "string" && feature.geometry.type === "Point" ? [[id, feature.geometry.coordinates as [number, number]] as const] : []
          }))
          const points = [...renderedById.values()].map((coordinates) => instance.project(coordinates))
          let minimumDistance = Number.POSITIVE_INFINITY
          for (let index = 0; index < points.length; index += 1) {
            for (let comparison = index + 1; comparison < points.length; comparison += 1) {
              minimumDistance = Math.min(minimumDistance, points[index].dist(points[comparison]))
            }
          }
          setRenderedSignalCount(renderedById.size)
          setMinimumSignalDistance(Number.isFinite(minimumDistance) ? Math.round(minimumDistance) : null)
        }
        const applySignalDensity = () => {
          const density = filteredMapRef.current ? { tier: "all" as const, minimumScore: 0 } : signalDensityForZoom(instance.getZoom())
          const filter = signalLayerFilter(density.minimumScore)
          instance.setFilter("ondo-signal-points", filter)
          instance.setFilter("ondo-score", filter)
          setSignalZoomTier(density.tier)
          window.requestAnimationFrame(updateRenderedSignalCount)
        }
        applySignalDensity()
        if (filteredMapRef.current && venues.length > 1) focusFilteredVenues(instance, venues)
        instance.on("zoomend", applySignalDensity)
        instance.on("idle", updateRenderedSignalCount)
        if (loadDeadline != null) window.clearTimeout(loadDeadline)
        if (!failed) {
          setMapState("ready")
          if (retryFocusPending.current) {
            retryFocusPending.current = false
            window.setTimeout(() => document.querySelector<HTMLElement>("[data-testid='ondo-b-view-toggle']")?.focus({ preventScroll: true }), 0)
          }
        }
      })
    }).catch(failMap)
    return () => {
      disposed = true
      if (loadDeadline != null) window.clearTimeout(loadDeadline)
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [actions, city, locale, retryToken, view])

  useEffect(() => {
    const source = mapRef.current?.getSource("ondo-venues") as GeoJSONSource | undefined
    if (source) void source.setData(toNeutralFeatureCollection(venues))
    const signalSource = mapRef.current?.getSource("ondo-signals") as GeoJSONSource | undefined
    if (signalSource) void signalSource.setData(toSignalFeatureCollection(venues))
    const contributionSource = mapRef.current?.getSource("ondo-contributions") as GeoJSONSource | undefined
    if (contributionSource) void contributionSource.setData(toContributionFeatureCollection(venues, contributedVenueIds))
    const instance = mapRef.current
    if (instance?.getLayer("ondo-signal-points")) {
      const density = filteredMap ? { tier: "all" as const, minimumScore: 0 } : signalDensityForZoom(instance.getZoom())
      const filter = signalLayerFilter(density.minimumScore)
      instance.setFilter("ondo-signal-points", filter)
      instance.setFilter("ondo-score", filter)
      setSignalZoomTier(density.tier)
      if (filteredMap) focusFilteredVenues(instance, venues)
    }
  }, [contributedVenueIds, filteredMap, venues])

  useEffect(() => {
    userLocationRef.current = userLocation
    const source = mapRef.current?.getSource("ondo-user-location") as GeoJSONSource | undefined
    if (source) void source.setData(toUserLocationFeatureCollection(userLocation))
  }, [userLocation])

  function chooseCity(next: CityId) {
    enterBDiscoveryCity(next)
    setCity(next)
    setView("map")
    setQuery("")
    setHeat("all")
  }

  function selectVenue(venue: BMapVenue) {
    replaceBDiscoveryCityContext({ city: venue.cityId, view, query, heat, focus: { kind: "venue", venueId: venue.id } })
    openBDiscoveryVenue(venue.id)
    actions.setSurface({ kind: "venue", venueId: venue.id })
    mapRef.current?.easeTo({ center: [venue.longitude, venue.latitude], zoom: 15 })
  }

  function updateCityContext(next: { view?: ViewMode; query?: string; heat?: BDiscoveryHeat }) {
    if (!city) return
    replaceBDiscoveryCityContext({
      city,
      view: next.view ?? view,
      query: next.query ?? query,
      heat: next.heat ?? heat,
    })
  }

  function retryMap() {
    retryFocusPending.current = true
    mapRef.current?.remove()
    mapRef.current = null
    setMapState("idle")
    setView("map")
    setRetryToken((token) => token + 1)
  }

  function locateUser() {
    if (!navigator.geolocation) {
      userLocationRef.current = null
      setUserLocation(null)
      setLocationState("unsupported")
      actions.notify(copy.locationUnavailable)
      return
    }
    setLocationState("locating")
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const nextLocation = { longitude: coords.longitude, latitude: coords.latitude }
      userLocationRef.current = nextLocation
      setUserLocation(nextLocation)
      setLocationState("ready")
      mapRef.current?.easeTo({ center: [nextLocation.longitude, nextLocation.latitude], zoom: 14 })
    }, () => {
      userLocationRef.current = null
      setUserLocation(null)
      setLocationState("denied")
      actions.notify(copy.locationUnavailable)
    }, { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 })
  }

  function togglePreference(preference: DiscoveryPreference) {
    actions.setDiscoveryPreferences(state.discoveryPreferences.includes(preference)
      ? state.discoveryPreferences.filter((item) => item !== preference)
      : [...state.discoveryPreferences, preference])
  }

  if (!city) return (
    <div className={styles.compatRoot} data-testid="ondo-map-entry">
      <section className={styles.root} data-testid="ondo-b-map-entry">
        <header className={styles.header}>
          <div className={styles.brand}><i /> <span><strong>ONDO</strong><small>{copy.tagline}</small></span></div>
          <button type="button" className={styles.language} onClick={() => actions.setLocale(locale === "en" ? "ko" : "en")}><Languages size={16} />{locale === "en" ? "KO" : "EN"}</button>
        </header>
        <NationPulse locale={locale} onSelect={chooseCity} />
      </section>
    </div>
  )

  return (
    <div className={styles.compatRoot} data-testid="ondo-map-entry">
      <section className={styles.root} data-testid="ondo-b-map-entry" data-map-state={mapState} data-map-attempt={retryToken + 1} data-connectivity={online ? "online" : "offline"} data-location-state={locationState} data-user-location={userLocation ? "present" : "absent"} data-cluster-grammar="outlined-count" data-score-grammar="solid-heat" data-signal-zoom-tier={signalZoomTier} data-rendered-signal-count={renderedSignalCount} data-min-signal-distance-px={minimumSignalDistance ?? "none"} data-neutral-source-count={venues.filter((venue) => venue.signalTruth === "UNKNOWN").length} data-signal-source-count={venues.filter((venue) => venue.signalTruth === "SIMULATED").length}>
        <p id="ondo-b-map-instruction" className={styles.srOnly}>{copy.mapA11y}</p>
        <div ref={mapNode} className={styles.map} data-testid="maplibre-map" role="region" aria-label={locale === "ko" ? "ONDO 식음료 지도" : "ONDO food map"} aria-describedby="ondo-b-map-instruction" />
        {view === "map" && (mapState === "idle" || mapState === "loading") ? <p className={styles.mapLoading} role="status" data-testid="ondo-b-map-loading">{copy.mapLoading}</p> : null}
        <header className={styles.cityHeader}>
        <div className={styles.topline}>
          <button type="button" className={styles.back} data-testid="ondo-b-city-back" onClick={() => { mapRef.current?.remove(); mapRef.current = null; if (!goBackFromBDiscovery("city")) setCity(null) }}><ArrowLeft size={18} />{copy.back}</button>
          <h1>{CITY[city].label[locale]}</h1>
          <button type="button" className={styles.language} onClick={() => actions.setLocale(locale === "en" ? "ko" : "en")}><Languages size={16} />{locale === "en" ? "KO" : "EN"}</button>
        </div>
        <div className={styles.search} role="search"><Search size={18} /><input data-testid="ondo-b-search" aria-label={copy.search} value={query} onChange={(event) => { const nextQuery = event.target.value; setQuery(nextQuery); updateCityContext({ query: nextQuery }) }} placeholder={copy.search} />{query ? <button type="button" onClick={() => { setQuery(""); updateCityContext({ query: "" }) }} aria-label={locale === "ko" ? "검색어 지우기" : "Clear search"}><X size={16} /></button> : null}</div>
        <div className={styles.rail} aria-label={locale === "ko" ? "장소 신호 필터" : "Place signal filters"}>
          {(["all", "signal", "pending"] as const).map((item) => <button key={item} type="button" aria-pressed={heat === item} onClick={() => { setHeat(item); updateCityContext({ heat: item }) }}>{copy[item]}</button>)}
        </div>
        </header>

        <button type="button" className={styles.preferenceSummary} aria-expanded={preferencesOpen} aria-controls="ondo-b-preference-panel" onClick={() => setPreferencesOpen((open) => !open)} data-testid="ondo-b-preference-summary"><SlidersHorizontal size={15} /><span>{preferenceSummary}</span><ChevronRight size={15} /></button>

        {preferencesOpen ? (
          <section id="ondo-b-preference-panel" className={styles.preferencePanel} aria-label={copy.preferences} data-testid="ondo-b-preference-panel">
            <header><strong>{copy.preferences}</strong><button type="button" onClick={() => setPreferencesOpen(false)} aria-label={copy.closePreferences}><X size={17} /></button></header>
            <p>{copy.preferenceBoundary}</p>
            <div>
              {ALL_PREFERENCES.map((preference) => <button key={preference} type="button" aria-pressed={state.discoveryPreferences.includes(preference)} onClick={() => togglePreference(preference)}>{PREFERENCE_COPY[preference][locale]}</button>)}
            </div>
            {state.discoveryPreferences.length ? <button type="button" className={styles.preferenceReset} onClick={() => actions.setDiscoveryPreferences([])}>{copy.resetPreferences}</button> : null}
          </section>
        ) : null}

        <div className={styles.resultBar}>
          <span><b>{resultCount(venues.length, locale, after19On)}</b><small>{copy.citySnapshotBoundary}</small></span>
          <button type="button" onClick={() => { const nextView = view === "map" ? "list" : "map"; setView(nextView); updateCityContext({ view: nextView }) }} data-testid="ondo-b-view-toggle">{view === "map" ? <List size={17} /> : <MapIcon size={17} />}{view === "map" ? copy.list : copy.map}</button>
        </div>

        {view === "list" || mapState === "error" ? <div className={styles.listPanel}>{mapState === "error" ? <div className={styles.mapError} role="status" data-testid="ondo-b-map-fallback-status"><span>{copy.mapUnavailable} {copy.offlineSnapshot}</span><button type="button" onClick={retryMap}>{copy.retryMap}</button></div> : null}<VenueList venues={venues} locale={locale} visibleCount={visibleCount} contributedVenueIds={contributedVenueIds} onClear={() => { setQuery(""); setHeat("all"); updateCityContext({ query: "", heat: "all" }) }} onMore={() => setVisibleCount((count) => Math.min(venues.length, count + 30))} onSelect={selectVenue} /></div> : null}

        {view === "map" && mapState !== "error" ? <div
          className={styles.mapKey}
          data-testid="ondo-b-map-key"
          data-filtered={filteredMap}
          data-place-count={filteredMap ? venues.length : undefined}
          data-score={filteredMap ? filteredLegendScore ?? "none" : undefined}
          aria-label={filteredMap
            ? `${resultCount(venues.length, locale, after19On)}. ${filteredLegendScore ?? "—"} ${copy.scoreKey}. ${filteredLegendCopy}. ${copy.mapKeyLabel}`
            : `${copy.mapKeyLabel} ${signalZoomTier === "top" ? copy.topSignals : signalZoomTier === "more" ? copy.moreSignals : copy.allSignals}.`}
        ><div><span><i className={styles.clusterSwatch}>{filteredMap ? venues.length : 12}×</i>{copy.clusterKey}</span><b>·</b><span><i className={styles.scoreSwatch}>{filteredMap ? filteredLegendScore ?? "—" : 82}</i>{copy.scoreKey}</span></div><small>{filteredMap ? filteredLegendCopy : signalZoomTier === "top" ? copy.topSignals : signalZoomTier === "more" ? copy.moreSignals : copy.allSignals}</small></div> : null}
        {!online && mapState !== "error" ? <p className={styles.locationFeedback} role="status" data-testid="ondo-b-offline-status"><strong>{copy.offlineTitle}</strong> · {copy.offlineSnapshot}</p> : null}
        {online && view === "map" && mapState !== "error" && locationState !== "idle" ? <p id="ondo-b-location-status" className={styles.locationFeedback} role="status" data-testid="ondo-b-location-status">{locationState === "locating" ? copy.locating : locationState === "ready" && nearestVenue ? `${copy.locationReady} · ${venueDisplayName(nearestVenue.venue.name.ko, locale)} ${displayDistance(nearestVenue.distance, locale)} · ${copy.nearest}` : locationState === "ready" ? copy.locationReady : locationState === "denied" ? copy.locationDenied : copy.locationUnsupported}</p> : null}
        {userLocation ? <span className={styles.srOnly} data-testid="ondo-b-user-location-marker" data-longitude={userLocation.longitude} data-latitude={userLocation.latitude}>{copy.locationReady}</span> : null}
        {view === "map" && mapState !== "error" ? <button type="button" className={styles.locate} data-testid="ondo-b-locate" data-location-state={locationState} aria-describedby={locationState === "idle" ? undefined : "ondo-b-location-status"} aria-label={locationState === "denied" ? copy.retryLocation : copy.locate} onClick={locateUser}><LocateFixed size={19} /></button> : null}
        {view === "map" && mapState !== "error" ? <a className={styles.attribution} href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap · © OpenStreetMap</a> : null}
      </section>
    </div>
  )
}
