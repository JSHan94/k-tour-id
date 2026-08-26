"use client"

import type { CircleLayerSpecification, ExpressionSpecification, GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent, SymbolLayerSpecification } from "maplibre-gl"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, ChevronRight, Info, Languages, List, LocateFixed, Map as MapIcon, Search, X } from "lucide-react"
import { KOREA_OUTLINE_COORDINATES } from "@/lib/map/korea-atlas-data"
import { ondoMapStyle } from "@/lib/ondo/map/ondo-map-style"
import type { CanonicalMapVenue, VenuePrimaryCategory } from "@/lib/ondo/venues/contracts"
import { CANONICAL_MAP_VENUES_COMPACT } from "@/lib/ondo/venues/map-data"
import { venueDisplayName, venueDistrictLabel, venueNamePresentation } from "@/lib/ondo/venues/display"
import { mapFoodIntentAliases } from "@/lib/ondo/venues/map-discovery-aliases"
import {
  PULSE_CITY_STATUS,
  PULSE_DISCLOSURE,
  pulseForVenue,
  pulseLevelLabel,
  type PulseLocalEvidenceB,
} from "../pulse-b/pulse-model-b"
import { PULSE_COMPOSITION_DISCLOSURE, PULSE_PRODUCTION_DRIVER_DISCLOSURE } from "../pulse-b/japan-first-pulse-model-b"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import { useOndoB } from "../shared/state/ondo-b-provider"
import { JapanFirstDiscoveryB } from "./japan-first-discovery-b"
import {
  B_DISCOVERY_TRAVERSAL_EVENT,
  enterBDiscoveryCity,
  focusBDiscoveryTarget,
  goBackFromBDiscovery,
  initializeBDiscoveryHistory,
  installBDiscoveryTraversalGuard,
  normalizeBDiscoveryHistoryForActiveDocument,
  openBDiscoveryVenue,
  readBDiscoveryTraversal,
  replaceBDiscoveryCityContext,
  replaceBDiscoveryHistoryForActiveDocument,
  type BDiscoveryCategory,
  type BDiscoveryHistoryEntry,
} from "./b-discovery-history"
import styles from "./map-b.module.css"

type CityId = "seoul" | "busan" | "jeju"
type ViewMode = "map" | "list"
type MapLayoutMode = "measuring" | "ultra-short" | "compact-map" | "spacious-map"
type LocationState = "idle" | "locating" | "ready" | "denied" | "unsupported"
type UserLocation = { longitude: number; latitude: number }
const SEARCH_MAX_LENGTH = 120

const SOURCE_ID = "MOIS_LOCALDATA_GENERAL_RESTAURANTS"
const SOURCE_DATE = CANONICAL_MAP_VENUES_COMPACT[0]?.sourceSnapshotAt.slice(0, 10) ?? "2026-08-19"
const CITY = {
  seoul: { center: [126.987, 37.565] as [number, number], zoom: 10.1, label: { en: "Seoul", ko: "서울", ja: "ソウル" } },
  busan: { center: [129.055, 35.18] as [number, number], zoom: 10.05, label: { en: "Busan", ko: "부산", ja: "釜山" } },
  jeju: { center: [126.54, 33.38] as [number, number], zoom: 9.2, label: { en: "Jeju", ko: "제주", ja: "済州" } },
}

const COPY = {
  en: {
    tagline: "Korea food & travel map",
    title: "Choose a region, then follow the Pulse.",
    body: "Browse official food-service records in Seoul and Busan, or open Jeju's editorial travel collection.",
    coverage: "Korea map · 3 regions",
    openMap: "Open city directory",
    source: "LOCALDATA source snapshot · Aug 19, 2026",
    sourceBoundary: "A record shows an active licence at the source date. It does not confirm today’s hours, menu, popularity or payment support.",
    search: "Place, district or category",
    list: "List",
    map: "Map",
    back: "Korea map",
    records: "official records",
    officialName: "Official Korean source name",
    categoryBasis: "Category normalized from the official business type",
    more: "Load 30 more",
    mapA11y: "The map is visual. Use plus, minus and arrow keys to move it, or open the List for keyboard-accessible directory results.",
    editorialMapA11y: "The Jeju map shows one regional editorial collection. Exact place links are still being checked; use its source panel to review the travel stories.",
    mapUnavailable: "The map could not load. 200 official records remain available in the list.",
    retryMap: "Retry map",
    offlineTitle: "Offline",
    offlineSource: "The official directory remains available; map tiles may be unavailable.",
    locationUnavailable: "Your location was not used. Search or choose a record from the directory.",
    locating: "Finding your location…",
    locationReady: "You’re here",
    locationDenied: "Location access is off. Search still works. Change the browser permission, then try again.",
    locationUnsupported: "This browser cannot share a location. Search and the full directory still work.",
    locate: "My location",
    retryLocation: "Try my location again",
    locationDisclosure: "Location stays in this tab. OpenFreeMap receives map-area requests.",
    nearest: "nearest official record",
    mapLoading: "Loading the directory map…",
    editorialMapLoading: "Loading the Jeju editorial map…",
    noResultsTitle: "No records match",
    noResultsBody: "Clear the search and category to see every official record in this city.",
    clearResults: "Clear search and category",
    mapKey: "Pulse map · official groups",
    mapKeyBody: "Outlined numbers are official record groups. Small dots are individual records.",
    mapKeyDetails: "How to read this map",
    mapCredits: "Map credits",
    pulseActive: "Curated Pulse active",
    pulseGrowing: "Pulse coverage growing",
    pulseExplore: "Explore · limited signals",
    pulseSignals: "curated signals",
    pulseLocal: "Your Local Signal is included on this device",
    jejuStatus: "Editorial · exact places pending",
    jejuTruth: "10 travel ideas",
    jejuMapTruth: "10 editorial leads · not official directory records",
    officialSourceScope: "Seoul and Busan · official LOCALDATA records",
    jejuSourceScope: "Jeju · VISITKOREA editorial source collections; place facts pending",
    editorialMapUnavailable: "The basemap could not load. The Jeju editorial collection and sources remain available.",
    aboutMap: "About this Korea map",
    filterLabel: "Official business category",
    recentSaveFailed: "The place opened, but this device could not update Recently viewed.",
  },
  ko: {
    tagline: "한국 음식·여행 지도",
    title: "지역을 고르고 Pulse를 따라가 보세요.",
    body: "서울·부산의 공식 일반음식점 기록과 제주의 편집 여행 컬렉션을 한 지도에서 탐색합니다.",
    coverage: "대한민국 지도 · 3개 지역",
    openMap: "도시 디렉터리 열기",
    source: "LOCALDATA 출처 스냅샷 · 2026. 8. 19.",
    sourceBoundary: "기록은 출처 기준일의 유효 인허가 상태를 뜻합니다. 현재 영업시간·메뉴·인기도·결제 지원은 확인하지 않습니다.",
    search: "장소명, 지역 또는 업태",
    list: "목록",
    map: "지도",
    back: "대한민국 지도",
    records: "공식 기록",
    officialName: "공식 출처 한글명",
    categoryBasis: "공식 업태구분명을 기준으로 정규화한 분류",
    more: "30개 더 보기",
    mapA11y: "지도는 시각 정보입니다. 더하기, 빼기와 방향키로 움직이거나 키보드로 탐색할 수 있는 목록을 여세요.",
    editorialMapA11y: "제주 지도에는 지역 단위 편집 컬렉션 하나만 표시합니다. 정확한 장소 연결은 확인 중이며, 출처 패널에서 여행 콘텐츠를 검토할 수 있어요.",
    mapUnavailable: "지도를 불러오지 못했어요. 공식 기록 200개는 목록에서 계속 볼 수 있어요.",
    retryMap: "지도 다시 불러오기",
    offlineTitle: "오프라인",
    offlineSource: "공식 디렉터리는 계속 볼 수 있지만 지도 타일은 표시되지 않을 수 있어요.",
    locationUnavailable: "현재 위치를 사용하지 않았어요. 검색하거나 디렉터리에서 기록을 골라보세요.",
    locating: "현재 위치를 찾는 중…",
    locationReady: "현재 위치",
    locationDenied: "위치 권한이 꺼져 있어요. 검색은 그대로 쓸 수 있어요. 브라우저 권한을 바꾼 뒤 다시 시도하세요.",
    locationUnsupported: "이 브라우저에서는 위치를 공유할 수 없어요. 검색과 전체 디렉터리는 그대로 쓸 수 있어요.",
    locate: "내 위치",
    retryLocation: "내 위치 다시 시도",
    locationDisclosure: "위치는 이 탭에만 남습니다. OpenFreeMap은 지도 영역 요청을 받습니다.",
    nearest: "가장 가까운 공식 기록",
    mapLoading: "디렉터리 지도를 불러오는 중…",
    editorialMapLoading: "제주 편집 지도를 불러오는 중…",
    noResultsTitle: "일치하는 기록이 없어요",
    noResultsBody: "검색어와 업태를 초기화하면 이 도시의 모든 공식 기록을 볼 수 있어요.",
    clearResults: "검색어와 업태 초기화",
    mapKey: "Pulse 지도 · 공식 기록 묶음",
    mapKeyBody: "테두리 숫자는 공식 기록 묶음, 작은 점은 개별 기록을 뜻합니다.",
    mapKeyDetails: "지도 읽는 법",
    mapCredits: "지도 출처",
    pulseActive: "선별 Pulse 운영 중",
    pulseGrowing: "Pulse 커버리지 성장 중",
    pulseExplore: "탐색 · 신호 부족",
    pulseSignals: "선별 신호",
    pulseLocal: "이 기기의 로컬 시그널이 포함됨",
    jejuStatus: "편집 컬렉션 · 장소 확인 중",
    jejuTruth: "여행 아이디어 10곳",
    jejuMapTruth: "편집 후보 10곳 · 공식 디렉터리 기록 아님",
    officialSourceScope: "서울·부산 · LOCALDATA 공식 기록",
    jejuSourceScope: "제주 · VISITKOREA 편집 출처 모음; 장소 정보 확인 중",
    editorialMapUnavailable: "배경 지도를 불러오지 못했어요. 제주 편집 컬렉션과 출처는 계속 볼 수 있어요.",
    aboutMap: "대한민국 지도 안내",
    filterLabel: "공식 업태 분류",
    recentSaveFailed: "장소는 열었지만 이 기기의 최근 본 목록에는 저장하지 못했어요.",
  },
  ja: {
    tagline: "韓国フード・旅行マップ",
    title: "地域を選んで、Pulseをたどろう。",
    body: "ソウル・釜山の公式飲食店営業許可記録と、済州の編集旅行コレクションをひとつの地図で探せます。",
    coverage: "韓国マップ・3地域",
    openMap: "都市ディレクトリを開く",
    source: "LOCALDATA出典スナップショット・2026年8月19日",
    sourceBoundary: "記録は出典日時点の有効な営業許可を示します。現在の営業時間、メニュー、人気、決済対応は確認できません。",
    search: "場所・エリア・業種を検索",
    list: "リスト",
    map: "地図",
    back: "韓国マップ",
    records: "公式記録",
    officialName: "韓国語の公式名称",
    categoryBasis: "公式の業種名をもとに整理した分類",
    more: "さらに30件",
    mapA11y: "地図は視覚情報です。プラス、マイナス、矢印キーで動かすか、キーボードで使えるリストを開いてください。",
    editorialMapA11y: "済州の地図には地域単位の編集コレクションを1件表示します。正確な場所リンクは確認中です。情報源パネルで旅行ストーリーを確認できます。",
    mapUnavailable: "地図を読み込めませんでした。公式記録200件はリストで引き続き確認できます。",
    retryMap: "地図を再読み込み",
    offlineTitle: "オフライン",
    offlineSource: "公式ディレクトリは利用できますが、地図タイルを表示できない場合があります。",
    locationUnavailable: "現在地は使用しませんでした。検索するか、ディレクトリから記録を選んでください。",
    locating: "現在地を確認中…",
    locationReady: "現在地",
    locationDenied: "位置情報へのアクセスがオフです。検索はそのまま利用できます。ブラウザの権限を変更して再度お試しください。",
    locationUnsupported: "このブラウザでは現在地を共有できません。検索とディレクトリは引き続き利用できます。",
    locate: "現在地",
    retryLocation: "現在地を再試行",
    locationDisclosure: "位置情報はこのタブ内にのみ残ります。OpenFreeMapには地図範囲のリクエストが送られます。",
    nearest: "最寄りの公式記録",
    mapLoading: "ディレクトリ地図を読み込み中…",
    editorialMapLoading: "済州の編集地図を読み込み中…",
    noResultsTitle: "一致する記録がありません",
    noResultsBody: "検索語と業種を解除すると、この都市のすべての公式記録を確認できます。",
    clearResults: "検索語と業種を解除",
    mapKey: "Pulseマップ・公式記録グループ",
    mapKeyBody: "枠付きの数字は公式記録のまとまり、小さな点は個別の記録です。",
    mapKeyDetails: "地図の見方",
    mapCredits: "地図クレジット",
    pulseActive: "キュレーションPulse提供中",
    pulseGrowing: "Pulseカバレッジ拡大中",
    pulseExplore: "探索中・シグナル不足",
    pulseSignals: "キュレーションシグナル",
    pulseLocal: "この端末のローカルシグナルを含みます",
    jejuStatus: "編集コレクション・正確な場所は確認中",
    jejuTruth: "旅行アイデア10件",
    jejuMapTruth: "編集候補10件・公式ディレクトリ記録ではありません",
    officialSourceScope: "ソウル・釜山・LOCALDATA公式記録",
    jejuSourceScope: "済州・VISITKOREA編集情報コレクション・場所情報は確認中",
    editorialMapUnavailable: "背景地図を読み込めませんでした。済州の編集コレクションと情報源は引き続き確認できます。",
    aboutMap: "韓国マップについて",
    filterLabel: "公式業種分類",
    recentSaveFailed: "場所は開きましたが、この端末の最近見た場所には保存できませんでした。",
  },
} satisfies Record<OndoBLocale, Record<string, string>>

const MAP_UI = {
  en: { atlas: "Korea overview map showing Seoul, Busan, and Jeju", clearSearch: "Clear search", mapRegion: "Official food-service directory map", editorialRegion: "Jeju editorial travel collection map", officialGroups: "Official groups", pulseRange: "Low → Peak", pulseLegend: "Pulse level legend", pulsePlaces: "Pulse places", mapAttribution: "Map attribution", shortList: "List view on a short screen", locationTab: "Location · this tab only", locationOff: "Location access off", locationUnavailable: "Location unavailable", freshness: "freshness", confidence: "confidence" },
  ko: { atlas: "서울·부산·제주를 표시한 대한민국 탐색 지도", clearSearch: "검색어 지우기", mapRegion: "공식 일반음식점 디렉터리 지도", editorialRegion: "제주 편집 여행 컬렉션 지도", officialGroups: "공식 묶음", pulseRange: "여유 → 피크", pulseLegend: "Pulse 단계 범례", pulsePlaces: "Pulse 장소", mapAttribution: "지도 출처", shortList: "좁은 화면에서 목록 보기 사용 중", locationTab: "위치 · 이 탭에서만", locationOff: "위치 권한 꺼짐", locationUnavailable: "위치 미지원", freshness: "최신성", confidence: "신뢰도" },
  ja: { atlas: "ソウル・釜山・済州を示す韓国マップ", clearSearch: "検索語を消去", mapRegion: "公式飲食店営業許可ディレクトリの地図", editorialRegion: "済州の編集旅行コレクション地図", officialGroups: "公式記録のまとまり", pulseRange: "ゆったり → ピーク", pulseLegend: "Pulseレベルの凡例", pulsePlaces: "Pulseの場所", mapAttribution: "地図の出典", shortList: "高さの低い画面ではリスト表示", locationTab: "現在地・このタブ内のみ", locationOff: "位置情報へのアクセスはオフ", locationUnavailable: "位置情報を利用できません", freshness: "更新状況", confidence: "確度" },
} satisfies Record<OndoBLocale, Record<string, string>>

const NEXT_LOCALE: Record<OndoBLocale, OndoBLocale> = { en: "ja", ja: "ko", ko: "en" }
const NEXT_LOCALE_LABEL: Record<OndoBLocale, string> = { en: "JA", ja: "KO", ko: "EN" }

const CATEGORY: Record<BDiscoveryCategory, { en: string; ko: string; ja: string; compact: Record<OndoBLocale, string>; short: string }> = {
  all: { en: "All", ko: "전체", ja: "すべて", compact: { en: "All", ko: "전체", ja: "すべて" }, short: "ALL" },
  korean: { en: "Korean", ko: "한식", ja: "韓国料理", compact: { en: "Korean", ko: "한식", ja: "韓国料理" }, short: "K" },
  casual: { en: "Quick service", ko: "분식·간편식", ja: "軽食・ファストフード", compact: { en: "Quick", ko: "분식", ja: "軽食" }, short: "Q" },
  japanese: { en: "Japanese", ko: "일식", ja: "日本料理", compact: { en: "Japanese", ko: "일식", ja: "日本料理" }, short: "J" },
  chinese: { en: "Chinese", ko: "중식", ja: "中華料理", compact: { en: "Chinese", ko: "중식", ja: "中華" }, short: "C" },
  global: { en: "Western & international", ko: "경양식·외국음식", ja: "洋食・各国料理", compact: { en: "Western", ko: "외국음식", ja: "洋食・各国" }, short: "G" },
  night: { en: "Pub & café licence types", ko: "주점·카페 업태", ja: "パブ・カフェ業種", compact: { en: "Pub & café", ko: "주점·카페", ja: "パブ・カフェ" }, short: "P" },
  specialty: { en: "Grills & specialty", ko: "구이·횟집·전문점", ja: "焼き物・専門店", compact: { en: "Grills", ko: "구이·횟집", ja: "焼き物・専門" }, short: "S" },
}

const MAP_VENUES = Object.freeze([...CANONICAL_MAP_VENUES_COMPACT].sort((left, right) => (
  left.districtId.localeCompare(right.districtId, "ko") || left.name.ko.localeCompare(right.name.ko, "ko")
)))

const PULSE_RANK = Object.freeze({ limited: 0, low: 1, warming: 2, rising: 3, hot: 4, peak: 5 } as const)
const PULSE_LEVEL_EXPRESSION: ExpressionSpecification = [
  "match", ["get", "pulseRank"],
  5, "#7A2048",
  4, "#C94832",
  3, "#E6843B",
  2, "#EBC463",
  1, "#EFE1B7",
  "#CFCAC0",
]

const SELECTED_CAPSULE_IMAGE_ID = "ondo-selected-pulse-capsule"

function selectedCapsuleImage() {
  const width = 64
  const height = 48
  const radius = 20
  const data = new Uint8Array(width * height * 4)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const nearestX = Math.max(radius, Math.min(width - radius - 1, x))
      const nearestY = Math.max(radius, Math.min(height - radius - 1, y))
      const distance = Math.hypot(x - nearestX, y - nearestY)
      if (distance > radius) continue
      const offset = (y * width + x) * 4
      const edge = distance > radius - 2 || x < 2 || x >= width - 2 || y < 2 || y >= height - 2
      data[offset] = edge ? 214 : 255
      data[offset + 1] = edge ? 202 : 252
      data[offset + 2] = edge ? 194 : 247
      data[offset + 3] = edge ? 230 : 248
    }
  }
  return { width, height, data }
}

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

function resultCount(count: number, locale: OndoBLocale) {
  if (locale === "ko") return `공식 기록 ${count}개`
  if (locale === "ja") return `公式記録 ${count}件`
  return `${count} official ${count === 1 ? "record" : "records"}`
}

function cityPulseStatus(cityId: CityId, locale: OndoBLocale) {
  if (cityId === "jeju") return COPY[locale].jejuStatus
  return PULSE_CITY_STATUS[cityId] === "active" ? COPY[locale].pulseActive : COPY[locale].pulseGrowing
}

function distanceInMeters(from: UserLocation, venue: Pick<CanonicalMapVenue, "longitude" | "latitude">) {
  const radians = (degrees: number) => degrees * Math.PI / 180
  const earthRadius = 6_371_000
  const latitudeDelta = radians(venue.latitude - from.latitude)
  const longitudeDelta = radians(venue.longitude - from.longitude)
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(from.latitude)) * Math.cos(radians(venue.latitude)) * Math.sin(longitudeDelta / 2) ** 2
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function displayDistance(distance: number, locale: OndoBLocale) {
  if (distance < 1_000) return locale === "ko" ? `${Math.max(10, Math.round(distance / 10) * 10)}m 거리` : locale === "ja" ? `${Math.max(10, Math.round(distance / 10) * 10)}m先` : `${Math.max(10, Math.round(distance / 10) * 10)} m away`
  const kilometers = (distance / 1_000).toFixed(distance < 10_000 ? 1 : 0)
  return locale === "ko" ? `${kilometers}km 거리` : locale === "ja" ? `${kilometers}km先` : `${kilometers} km away`
}

function NationDirectory({ locale, onSelect }: { locale: OndoBLocale; onSelect(city: CityId): void }) {
  const copy = COPY[locale]
  return (
    <section className={styles.nation} data-testid="ondo-b-nation">
      <div className={`${styles.dotMap} ${styles.koreaAtlas}`} data-testid="ondo-b-korea-atlas" data-visual-object="living-atlas">
        <svg viewBox="0 0 300 350" role="img" aria-label={MAP_UI[locale].atlas}>
          <path className={styles.atlasRoute} data-testid="ondo-b-atlas-route" d="M154 92 C166 124 165 167 178 206 C189 240 160 270 99 306" />
          <circle className={styles.atlasStop} cx="154" cy="92" r="4.5" />
          <circle className={styles.atlasStop} cx="178" cy="206" r="4.5" />
          <circle className={styles.atlasStop} cx="99" cy="306" r="4.5" />
          {KOREA_DOTS.map((dot, index) => <circle key={`${dot.x}-${dot.y}`} cx={dot.x} cy={dot.y} r={index % 5 === 0 ? 2 : 1.65} />)}
        </svg>
        <div className={styles.nationIntro}>
          <small>{copy.coverage}</small>
          <h1>{copy.title}</h1>
          <p>{copy.body}</p>
        </div>
        {(["seoul", "busan"] as const).map((cityId) => (
          <button
            key={cityId}
            type="button"
            className={styles.cityNode}
            data-city={cityId}
            data-region-role="official-directory"
            data-official-count="200"
            data-directory-source={SOURCE_ID}
            onClick={() => onSelect(cityId)}
            aria-label={`${CITY[cityId].label[locale]} · ${resultCount(200, locale)} · ${copy.openMap}`}
          >
            <i>200</i>
            <span>
              <strong>{CITY[cityId].label[locale]}</strong>
              <small data-pulse-city-status={PULSE_CITY_STATUS[cityId]}>{cityPulseStatus(cityId, locale)}</small>
              <em className={styles.cityRecordTruth}>{resultCount(200, locale)}</em>
            </span>
          </button>
        ))}
        <button
          type="button"
          className={`${styles.cityNode} ${styles.jejuNode}`}
          data-city="jeju"
          data-region-role="editorial-collection"
          data-truth-kind="editorial-region"
          data-editorial-count="10"
          onClick={() => onSelect("jeju")}
          aria-label={`${CITY.jeju.label[locale]} · ${copy.jejuStatus} · ${copy.jejuTruth}`}
        >
          <i aria-hidden="true">✦</i>
          <span>
            <strong>{CITY.jeju.label[locale]}</strong>
            <small>{copy.jejuStatus}</small>
            <em className={styles.cityRecordTruth}>{copy.jejuTruth}</em>
          </span>
        </button>
        <details className={`${styles.cityTruthLegend} ${styles.atlasTruth}`} data-testid="ondo-b-city-truth-legend">
          <summary>{copy.aboutMap}<ChevronRight size={16} /></summary>
          <div className={styles.atlasTruthBody}>
            {(["seoul", "busan"] as const).map((cityId) => (
              <div key={cityId}>
                <strong>{CITY[cityId].label[locale]}</strong>
                <span>{resultCount(200, locale)}</span>
                <small>{copy.categoryBasis}</small>
              </div>
            ))}
            <div>
              <strong>{CITY.jeju.label[locale]}</strong>
              <span>{copy.jejuMapTruth}</span>
              <small>{copy.jejuTruth}</small>
            </div>
            <footer>
              <div><strong>{copy.officialSourceScope}</strong><br />{copy.source}<br />{copy.sourceBoundary}</div>
              <div><strong>{copy.jejuSourceScope}</strong></div>
            </footer>
          </div>
        </details>
      </div>
    </section>
  )
}

function toFeatureCollection(
  venues: readonly CanonicalMapVenue[],
  localPulseEvidenceByVenue: Record<string, PulseLocalEvidenceB> = {},
  selectedVenueId: string | null = null,
): GeoJSON.FeatureCollection<GeoJSON.Point, { id: string; name: string; category: VenuePrimaryCategory; curatedSignal: boolean; selected: boolean }> {
  return {
    type: "FeatureCollection",
    features: venues.map((venue) => {
      const pulse = pulseForVenue(venue.id, localPulseEvidenceByVenue[venue.id] ?? null)
      return {
        type: "Feature",
        id: venue.id,
        geometry: { type: "Point", coordinates: [venue.longitude, venue.latitude] },
        properties: {
          id: venue.id,
          name: venue.name.ko,
          category: venue.primaryCategory,
          curatedSignal: pulse.score != null,
          selected: venue.id === selectedVenueId,
        },
      }
    }),
  }
}

function toPulseFeatureCollection(
  venues: readonly CanonicalMapVenue[],
  localPulseEvidenceByVenue: Record<string, PulseLocalEvidenceB> = {},
  locale: OndoBLocale,
  selectedVenueId: string | null = null,
): GeoJSON.FeatureCollection<GeoJSON.Point, { id: string; pulseLevel: string; pulseRank: number; pulseScore: number; pulseMarkerLabel: string; selectedMarkerLabel: string; selected: boolean }> {
  return {
    type: "FeatureCollection",
    features: venues.flatMap((venue) => {
      const pulse = pulseForVenue(venue.id, localPulseEvidenceByVenue[venue.id] ?? null)
      if (pulse.score == null && venue.id !== selectedVenueId) return []
      return [{
        type: "Feature" as const,
        id: venue.id,
        geometry: { type: "Point" as const, coordinates: [venue.longitude, venue.latitude] },
        properties: {
          id: venue.id,
          pulseLevel: pulse.level,
          pulseRank: PULSE_RANK[pulse.level],
          pulseScore: pulse.score ?? -1,
          pulseMarkerLabel: pulse.score == null
            ? pulseLevelLabel(pulse.level, locale).toUpperCase()
            : `${pulse.score} · ${pulseLevelLabel(pulse.level, locale).toUpperCase()}`,
          selectedMarkerLabel: pulse.score == null
            ? venueDisplayName(venue.name.ko, locale)
            : `${venueDisplayName(venue.name.ko, locale)} · Pulse ${pulse.score} · ${pulseLevelLabel(pulse.level, locale).toUpperCase()}`,
          selected: venue.id === selectedVenueId,
        },
      }]
    }),
  }
}

function toUserLocationFeatureCollection(location: UserLocation | null): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: location ? [{ type: "Feature", geometry: { type: "Point", coordinates: [location.longitude, location.latitude] }, properties: {} }] : [],
  }
}

function focusFilteredVenues(map: MapLibreMap, venues: readonly CanonicalMapVenue[]) {
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
  ], { duration: 0, maxZoom: 14.5, padding: { top: 220, right: 72, bottom: 160, left: 72 } })
}

function VenueList({ venues, locale, localPulseEvidenceByVenue, selectedVenueId, visibleCount, onClear, onMore, onSelect }: {
  venues: readonly CanonicalMapVenue[]
  locale: OndoBLocale
  localPulseEvidenceByVenue: Record<string, PulseLocalEvidenceB>
  selectedVenueId: string | null
  visibleCount: number
  onClear(): void
  onMore(): void
  onSelect(venue: CanonicalMapVenue): void
}) {
  const copy = COPY[locale]
  const orderedVenues = useMemo(() => venues.map((venue, index) => ({
    venue,
    index,
    pulse: pulseForVenue(venue.id, localPulseEvidenceByVenue[venue.id] ?? null),
  })).sort((left, right) => {
    if (left.pulse.score != null && right.pulse.score != null) return right.pulse.score - left.pulse.score
    if (left.pulse.score != null) return -1
    if (right.pulse.score != null) return 1
    return left.index - right.index
  }), [localPulseEvidenceByVenue, venues])
  return (
    <ul className={styles.venueList} data-testid="ondo-b-venue-list">
      {orderedVenues.slice(0, visibleCount).map(({ venue, pulse }) => {
        const presentation = venueNamePresentation(venue.name.ko, locale)
        const category = CATEGORY[venue.primaryCategory]
        const pulseSummary = pulse.score == null
          ? `Pulse · ${pulseLevelLabel(pulse.level, locale)}`
          : `Pulse ${pulse.score} · ${pulseLevelLabel(pulse.level, locale)}`
        const pulseDetail = pulse.signalCount == null
          ? PULSE_DISCLOSURE[locale]
          : `${pulse.signalCount} ${copy.pulseSignals} · ${PULSE_DISCLOSURE[locale]}`
        return (
          <li key={venue.id} data-venue-id={venue.id} data-pulse-priority={pulse.score == null ? undefined : pulse.level}>
            <button
              type="button"
              onClick={() => onSelect(venue)}
              data-venue-opener={venue.id}
              aria-haspopup="dialog"
              aria-expanded={selectedVenueId === venue.id}
              aria-controls={selectedVenueId === venue.id ? "canonical-place-dialog" : undefined}
              aria-label={`${presentation.officialName} · ${presentation.officialNameLabel} · ${presentation.transliteration} · ${presentation.transliterationLabel} · ${venueDistrictLabel(venue.cityId, venue.districtId, locale)} · ${category[locale]} · ${pulseSummary} · ${copy.categoryBasis}`}
            >
              <span className={styles.categoryBadge}>{category.short}</span>
              <span>
                <small>{venueDistrictLabel(venue.cityId, venue.districtId, locale)} · {category[locale]}</small>
                <strong data-testid="official-source-name">{presentation.officialName}</strong>
                <em className={styles.listPulse} data-testid="ondo-b-list-pulse" data-pulse-level={pulse.level} data-pulse-numeric={pulse.score == null ? "hidden" : "shown"}>
                  <b>{pulseSummary}</b>
                  <span>{pulseDetail}</span>
                  {pulse.localEvidence ? <span className={styles.localPulse}>{copy.pulseLocal}</span> : null}
                </em>
                <em className={styles.officialNameTruth}>{copy.officialName}</em>
                <small className={styles.transliterationTruth}><span>{presentation.transliteration}</span> · {presentation.transliterationLabel}</small>
                <small className={styles.categoryTruth}>{copy.categoryBasis}</small>
              </span>
              <ChevronRight size={17} />
            </button>
          </li>
        )
      })}
      {visibleCount < venues.length ? <li className={styles.loadMore}><button type="button" onClick={onMore}>{copy.more}</button></li> : null}
      {!venues.length ? <li className={styles.empty} data-testid="ondo-b-empty-results"><div role="status"><strong>{copy.noResultsTitle}</strong><span>{copy.noResultsBody}</span></div><button type="button" onClick={onClear}>{copy.clearResults}</button></li> : null}
    </ul>
  )
}

export function MapEntryB() {
  const { state, actions } = useOndoB()
  const locale = state.locale
  const copy = COPY[locale]
  const cityRootNode = useRef<HTMLElement | null>(null)
  const mapNode = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const filteredMapRef = useRef(false)
  const userLocationRef = useRef<UserLocation | null>(null)
  const zoomFocusOwnedRef = useRef(false)
  const traversalFocusVersion = useRef(0)
  const retryFocusPending = useRef(false)
  const [city, setCity] = useState<CityId | null>(null)
  const [view, setView] = useState<ViewMode>("map")
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<BDiscoveryCategory>("all")
  const [mapState, setMapState] = useState<"idle" | "loading" | "ready" | "error">("idle")
  const [visibleCount, setVisibleCount] = useState(30)
  const [retryToken, setRetryToken] = useState(0)
  const [locationState, setLocationState] = useState<LocationState>("idle")
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [online, setOnline] = useState(true)
  const [mapLayoutMode, setMapLayoutMode] = useState<MapLayoutMode>("measuring")
  const [mapRootBlockSize, setMapRootBlockSize] = useState(0)
  const [editorialOpen, setEditorialOpen] = useState(false)
  const selectedVenueId = state.surface.kind === "venue" ? state.surface.venueId : null
  const selectedVenue = selectedVenueId ? CANONICAL_MAP_VENUES_COMPACT.find((venue) => venue.id === selectedVenueId) ?? null : null
  const selectedPulse = selectedVenue ? pulseForVenue(selectedVenue.id, state.localPulseEvidenceByVenue[selectedVenue.id] ?? null) : null
  const effectiveView: ViewMode = city === "jeju" ? "map" : mapLayoutMode === "ultra-short" ? "list" : view

  useEffect(() => setEditorialOpen(false), [city])

  useLayoutEffect(() => {
    const root = cityRootNode.current
    if (!city || !root) return
    const rememberFocusOwner = (event: FocusEvent) => {
      zoomFocusOwnedRef.current = event.target instanceof Element
        && root.contains(event.target)
        && Boolean(event.target.closest(".maplibregl-ctrl-group"))
    }
    document.addEventListener("focusin", rememberFocusOwner)
    return () => document.removeEventListener("focusin", rememberFocusOwner)
  }, [city])

  useLayoutEffect(() => {
    if (!city || !cityRootNode.current) return
    const root = cityRootNode.current
    let previousMode: MapLayoutMode = "measuring"
    const applyLayout = (width: number, height: number) => {
      const usesUltraShortList = height < 240
        || (width < 480 && height < 360)
      const nextMode: MapLayoutMode = usesUltraShortList
        ? "ultra-short"
        : width <= 430 || (width > height && height <= 568)
          ? "compact-map"
          : "spacious-map"
      if (nextMode === previousMode) {
        setMapRootBlockSize(height)
        return
      }
      if (nextMode !== "spacious-map" && (zoomFocusOwnedRef.current || document.activeElement?.closest(".maplibregl-ctrl-group"))) {
        zoomFocusOwnedRef.current = false
        const focusVisibleSuccessor = () => {
          const target = nextMode === "ultra-short"
            ? document.querySelector<HTMLInputElement>("[data-testid='ondo-b-search']")
            : document.querySelector<HTMLButtonElement>("[data-testid='ondo-b-view-toggle']")
          target?.focus({ preventScroll: true })
        }
        focusVisibleSuccessor()
        window.requestAnimationFrame(focusVisibleSuccessor)
      }
      previousMode = nextMode
      setMapRootBlockSize(height)
      setMapLayoutMode(nextMode)
    }
    const observer = new ResizeObserver(([entry]) => applyLayout(entry.contentRect.width, entry.contentRect.height))
    observer.observe(root)
    const bounds = root.getBoundingClientRect()
    applyLayout(bounds.width, bounds.height)
    return () => observer.disconnect()
  }, [city])

  useLayoutEffect(() => {
    if (!state.hydrated) return
    let stabilizationFrame: number | null = null
    let stabilizationTimer: number | null = null
    const stabilizeHistoryEntry = (entry: BDiscoveryHistoryEntry, preservedState: unknown) => {
      if (stabilizationFrame != null) window.cancelAnimationFrame(stabilizationFrame)
      if (stabilizationTimer != null) window.clearTimeout(stabilizationTimer)
      const preserveEntry = () => {
        const current = normalizeBDiscoveryHistoryForActiveDocument()
        replaceBDiscoveryHistoryForActiveDocument(current ?? entry, preservedState)
      }
      stabilizationFrame = window.requestAnimationFrame(() => {
        stabilizationFrame = null
        preserveEntry()
        stabilizationTimer = window.setTimeout(() => {
          stabilizationTimer = null
          preserveEntry()
        }, 50)
      })
    }
    const applyHistoryEntry = (entry: BDiscoveryHistoryEntry, restoreFocus: boolean) => {
      const focusVersion = ++traversalFocusVersion.current
      setCity(entry.city ?? null)
      setView(entry.view)
      setQuery(entry.query)
      setCategory(entry.category)
      if (state.onboarding === "ONB-COMPLETE" && (entry.level === "peek" || entry.level === "detail") && entry.venueId) actions.setSurface({ kind: "venue", venueId: entry.venueId })
      else actions.setSurface({ kind: "map" })
      if (restoreFocus && (entry.level === "nation" || entry.level === "city")) {
        const focusAfterCommit = (attempt = 0) => {
          if (traversalFocusVersion.current !== focusVersion) return
          const target = focusBDiscoveryTarget(entry)
          if (target) {
            target.focus({ preventScroll: true })
            if (document.activeElement === target) return
          }
          // React may have committed the city entry while modal isolation is
          // still releasing `inert`. Retry until the original opener can
          // actually receive focus instead of treating mere DOM presence as
          // a successful restoration.
          if (attempt < 7) window.requestAnimationFrame(() => focusAfterCommit(attempt + 1))
        }
        window.requestAnimationFrame(() => focusAfterCommit())
      }
    }
    const onTraversal = (event: Event) => {
      const traversal = readBDiscoveryTraversal(event)
      if (!traversal) return
      const entry = replaceBDiscoveryHistoryForActiveDocument(traversal.entry, traversal.preservedState)
      if (entry) {
        applyHistoryEntry(entry, true)
        stabilizeHistoryEntry(entry, traversal.preservedState)
      }
    }
    window.addEventListener(B_DISCOVERY_TRAVERSAL_EVENT, onTraversal)
    const removeTraversalGuard = installBDiscoveryTraversalGuard()
    const initialState = window.history.state
    const initial = initializeBDiscoveryHistory((venueId) => CANONICAL_MAP_VENUES_COMPACT.find((venue) => venue.id === venueId)?.cityId)
    applyHistoryEntry(initial, false)
    stabilizeHistoryEntry(initial, initialState)
    return () => {
      traversalFocusVersion.current += 1
      removeTraversalGuard()
      window.removeEventListener(B_DISCOVERY_TRAVERSAL_EVENT, onTraversal)
      if (stabilizationFrame != null) window.cancelAnimationFrame(stabilizationFrame)
      if (stabilizationTimer != null) window.clearTimeout(stabilizationTimer)
    }
  }, [actions, state.hydrated, state.onboarding])

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

  const venues = useMemo(() => MAP_VENUES.filter((venue) => {
    if (!city || venue.cityId !== city) return false
    if (category !== "all" && venue.primaryCategory !== category) return false
    const categoryCopy = CATEGORY[venue.primaryCategory]
    const haystack = `${venue.name.ko} ${venue.name.en} ${venueDisplayName(venue.name.ko, "en")} ${categoryCopy.ko} ${categoryCopy.en} ${venue.districtId} ${venueDistrictLabel(venue.cityId, venue.districtId, "en")} ${mapFoodIntentAliases(venue.name.ko).join(" ")}`.toLowerCase()
    return !query.trim() || haystack.includes(query.trim().toLowerCase())
  }), [category, city, query])
  const filteredMap = query.trim().length > 0 || category !== "all"
  const curatedPulseVenues = useMemo(() => venues.flatMap((venue) => {
    const pulse = pulseForVenue(venue.id, state.localPulseEvidenceByVenue[venue.id] ?? null)
    return pulse.score == null ? [] : [{ venue, pulse }]
  }).sort((left, right) => (right.pulse.score ?? 0) - (left.pulse.score ?? 0)), [state.localPulseEvidenceByVenue, venues])
  filteredMapRef.current = filteredMap
  const nearestVenue = useMemo(() => {
    if (!userLocation || !venues.length) return null
    return venues.reduce<{ venue: CanonicalMapVenue; distance: number } | null>((nearest, venue) => {
      const distance = distanceInMeters(userLocation, venue)
      return nearest == null || distance < nearest.distance ? { venue, distance } : nearest
    }, null)
  }, [userLocation, venues])
  const locationMessage = !online
    ? `${copy.offlineTitle} · ${copy.offlineSource} ${copy.locationDisclosure}`
    : locationState === "idle"
      ? copy.locationDisclosure
      : locationState === "locating"
        ? copy.locating
        : locationState === "ready" && nearestVenue
          ? `${copy.locationReady} · ${venueDisplayName(nearestVenue.venue.name.ko, locale)} ${displayDistance(nearestVenue.distance, locale)} · ${copy.nearest}`
          : locationState === "ready"
            ? copy.locationReady
            : locationState === "denied"
              ? copy.locationDenied
              : copy.locationUnsupported
  const locationSummary = !online
    ? copy.offlineTitle
    : locationState === "idle"
      ? MAP_UI[locale].locationTab
      : locationState === "denied"
        ? MAP_UI[locale].locationOff
        : locationState === "unsupported"
          ? MAP_UI[locale].locationUnavailable
          : locationState === "locating"
            ? copy.locating
            : copy.locationReady

  useEffect(() => { setVisibleCount(30) }, [category, city, query])

  useEffect(() => {
    if (!selectedVenueId) return
    const selected = CANONICAL_MAP_VENUES_COMPACT.find((venue) => venue.id === selectedVenueId)
    if (selected) setCity(selected.cityId)
  }, [selectedVenueId])

  useEffect(() => {
    if (!city || effectiveView !== "map" || !mapNode.current || mapRef.current) return
    let disposed = false
    let failed = false
    let loadDeadline: number | undefined
    let pulseAnimationFrame: number | null = null
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
        } : locale === "ja" ? {
          "Map.Title": "地図",
          "NavigationControl.ZoomIn": "地図を拡大",
          "NavigationControl.ZoomOut": "地図を縮小",
          "CooperativeGesturesHandler.WindowsHelpText": "Ctrlキーを押しながらスクロールして地図を拡大・縮小します",
          "CooperativeGesturesHandler.MacHelpText": "⌘キーを押しながらスクロールして地図を拡大・縮小します",
          "CooperativeGesturesHandler.MobileHelpText": "2本の指で地図を動かします",
        } : undefined,
      })
      mapRef.current = instance
      instance.on("error", failMap)
      instance.addControl(new NavigationControl({ showCompass: false }), "bottom-right")
      instance.on("load", () => {
        if (disposed || failed) return
        try {
          instance.addSource("ondo-directory", {
            type: "geojson",
            data: toFeatureCollection(venues, state.localPulseEvidenceByVenue, selectedVenueId),
            cluster: true,
            clusterRadius: 48,
            clusterMaxZoom: 13,
          })
          instance.addSource("ondo-pulse", {
            type: "geojson",
            data: toPulseFeatureCollection(venues, state.localPulseEvidenceByVenue, locale, selectedVenueId),
          })
          instance.addSource("ondo-user-location", { type: "geojson", data: toUserLocationFeatureCollection(userLocationRef.current) })
          instance.addImage(SELECTED_CAPSULE_IMAGE_ID, selectedCapsuleImage(), {
            pixelRatio: 2,
            stretchX: [[20, 44]],
            stretchY: [[20, 28]],
            content: [16, 12, 48, 36],
          })
          instance.addLayer({ id: "ondo-clusters", type: "circle", source: "ondo-directory", filter: ["has", "point_count"], paint: { "circle-color": "rgba(255,253,249,0.9)", "circle-radius": ["step", ["get", "point_count"], 15, 15, 18, 50, 21], "circle-stroke-color": "rgba(66,62,57,.34)", "circle-stroke-width": 1, "circle-opacity": 0.94, "circle-blur": 0.02 } })
          instance.addLayer({ id: "ondo-cluster-count", type: "symbol", source: "ondo-directory", filter: ["has", "point_count"], layout: { "text-field": ["to-string", ["get", "point_count_abbreviated"]], "text-font": ["Noto Sans Bold"], "text-size": 11.5 }, paint: { "text-color": "#4a4641", "text-halo-color": "rgba(255,253,249,.78)", "text-halo-width": 0.8 } })
          instance.addLayer({ id: "ondo-points", type: "circle", source: "ondo-directory", filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "curatedSignal"], false]], paint: { "circle-color": "#716d67", "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 2.6, 15, 4.2], "circle-opacity": 0.66, "circle-stroke-width": 0 } })
          const unshiftedPulseFilter: ExpressionSpecification = ["all", ["!=", ["get", "pulseRank"], 3], ["!=", ["get", "pulseRank"], 2]]
          const risingPulseFilter: ExpressionSpecification = ["==", ["get", "pulseRank"], 3]
          const warmingPulseFilter: ExpressionSpecification = ["==", ["get", "pulseRank"], 2]
          const centralPeakFilter: ExpressionSpecification = ["==", ["get", "pulseScore"], 91]
          const centralHotFilter: ExpressionSpecification = ["==", ["get", "pulseScore"], 80]
          const unselectedPulseFilter: ExpressionSpecification = ["!=", ["get", "selected"], true]
          const centralPeakLabelFilter: ExpressionSpecification = ["all", centralPeakFilter, unselectedPulseFilter]
          const centralHotLabelFilter: ExpressionSpecification = ["all", centralHotFilter, unselectedPulseFilter]
          const regularUnshiftedLabelFilter: ExpressionSpecification = ["all", unshiftedPulseFilter, ["!=", ["get", "pulseScore"], 91], ["!=", ["get", "pulseScore"], 80], unselectedPulseFilter]
          const risingTranslate: ExpressionSpecification = ["interpolate", ["linear"], ["zoom"], 9, ["literal", [-20, 18]], 12, ["literal", [-20, 18]], 13, ["literal", [0, 0]]]
          const warmingTranslate: ExpressionSpecification = ["interpolate", ["linear"], ["zoom"], 9, ["literal", [-8, -10]], 12, ["literal", [-8, -10]], 13, ["literal", [0, 0]]]
          const pulseOffsetForRank = (rank: number, zoom: number) => {
            const scale = zoom <= 12 ? 1 : Math.max(0, 13 - zoom)
            if (rank === 3) return { x: -20 * scale, y: 18 * scale }
            if (rank === 2) return { x: -8 * scale, y: -10 * scale }
            return { x: 0, y: 0 }
          }
          const pulsePointPaint: CircleLayerSpecification["paint"] = { "circle-color": PULSE_LEVEL_EXPRESSION, "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 4.5, 15, 6.2], "circle-opacity": 0.98, "circle-stroke-width": 0, "circle-blur": 0.08 }
          const pulseLabelLayout: SymbolLayerSpecification["layout"] = { "text-field": ["get", "pulseMarkerLabel"], "text-font": ["Noto Sans Bold"], "text-size": 12, "text-letter-spacing": 0.025, "text-offset": [0, -1.2], "text-anchor": "bottom", "text-allow-overlap": true, "text-ignore-placement": true, "symbol-sort-key": ["get", "pulseRank"] }
          const centralPeakLabelLayout: SymbolLayerSpecification["layout"] = { ...pulseLabelLayout, "text-offset": [-1.2, 1.1], "text-anchor": "top" }
          const centralHotLabelLayout: SymbolLayerSpecification["layout"] = { ...pulseLabelLayout, "text-offset": [0.35, 1.1], "text-anchor": "top" }
          const pulseLabelPaint: SymbolLayerSpecification["paint"] = { "text-color": ["case", [">=", ["get", "pulseRank"], 4], "#5d1732", [">=", ["get", "pulseRank"], 2], "#773421", "#403b35"], "text-halo-color": "rgba(255,253,249,.94)", "text-halo-width": 2.2, "text-halo-blur": 0.5 }
          const pulseHaloPaint: CircleLayerSpecification["paint"] = { "circle-color": PULSE_LEVEL_EXPRESSION, "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 28, 15, 42], "circle-blur": 0.82, "circle-opacity": 0.2, "circle-stroke-width": 0 }
          instance.addLayer({ id: "ondo-pulse-halo", type: "circle", source: "ondo-pulse", filter: unshiftedPulseFilter, paint: pulseHaloPaint })
          instance.addLayer({ id: "ondo-pulse-halo-rising", type: "circle", source: "ondo-pulse", filter: risingPulseFilter, paint: { ...pulseHaloPaint, "circle-translate": risingTranslate, "circle-translate-anchor": "viewport" } })
          instance.addLayer({ id: "ondo-pulse-halo-warming", type: "circle", source: "ondo-pulse", filter: warmingPulseFilter, paint: { ...pulseHaloPaint, "circle-translate": warmingTranslate, "circle-translate-anchor": "viewport" } })
          instance.addLayer({ id: "ondo-pulse-points", type: "circle", source: "ondo-pulse", filter: unshiftedPulseFilter, layout: { "circle-sort-key": ["get", "pulseRank"] }, paint: pulsePointPaint })
          instance.addLayer({ id: "ondo-pulse-points-rising", type: "circle", source: "ondo-pulse", filter: risingPulseFilter, layout: { "circle-sort-key": ["get", "pulseRank"] }, paint: { ...pulsePointPaint, "circle-translate": risingTranslate, "circle-translate-anchor": "viewport" } })
          instance.addLayer({ id: "ondo-pulse-points-warming", type: "circle", source: "ondo-pulse", filter: warmingPulseFilter, layout: { "circle-sort-key": ["get", "pulseRank"] }, paint: { ...pulsePointPaint, "circle-translate": warmingTranslate, "circle-translate-anchor": "viewport" } })
          instance.addLayer({ id: "ondo-pulse-hit", type: "circle", source: "ondo-pulse", filter: unshiftedPulseFilter, paint: { "circle-color": "rgba(0,0,0,0.01)", "circle-radius": 22, "circle-stroke-width": 0 } })
          instance.addLayer({ id: "ondo-pulse-hit-rising", type: "circle", source: "ondo-pulse", filter: risingPulseFilter, paint: { "circle-color": "rgba(0,0,0,0.01)", "circle-radius": 22, "circle-stroke-width": 0, "circle-translate": risingTranslate, "circle-translate-anchor": "viewport" } })
          instance.addLayer({ id: "ondo-pulse-hit-warming", type: "circle", source: "ondo-pulse", filter: warmingPulseFilter, paint: { "circle-color": "rgba(0,0,0,0.01)", "circle-radius": 22, "circle-stroke-width": 0, "circle-translate": warmingTranslate, "circle-translate-anchor": "viewport" } })
          instance.addLayer({ id: "ondo-pulse-labels", type: "symbol", source: "ondo-pulse", filter: regularUnshiftedLabelFilter, layout: pulseLabelLayout, paint: pulseLabelPaint })
          instance.addLayer({ id: "ondo-pulse-labels-central-peak", type: "symbol", source: "ondo-pulse", filter: centralPeakLabelFilter, layout: centralPeakLabelLayout, paint: pulseLabelPaint })
          instance.addLayer({ id: "ondo-pulse-labels-central-hot", type: "symbol", source: "ondo-pulse", filter: centralHotLabelFilter, layout: centralHotLabelLayout, paint: pulseLabelPaint })
          instance.addLayer({ id: "ondo-pulse-labels-rising", type: "symbol", source: "ondo-pulse", filter: risingPulseFilter, layout: pulseLabelLayout, paint: { ...pulseLabelPaint, "text-translate": risingTranslate, "text-translate-anchor": "viewport" } })
          instance.addLayer({ id: "ondo-pulse-labels-warming", type: "symbol", source: "ondo-pulse", filter: warmingPulseFilter, layout: pulseLabelLayout, paint: { ...pulseLabelPaint, "text-translate": warmingTranslate, "text-translate-anchor": "viewport" } })
          const selectedUnshiftedPulseFilter: ExpressionSpecification = ["all", ["==", ["get", "selected"], true], unshiftedPulseFilter]
          const selectedRisingPulseFilter: ExpressionSpecification = ["all", ["==", ["get", "selected"], true], risingPulseFilter]
          const selectedWarmingPulseFilter: ExpressionSpecification = ["all", ["==", ["get", "selected"], true], warmingPulseFilter]
          const selectedPulseOuterPaint: CircleLayerSpecification["paint"] = { "circle-color": PULSE_LEVEL_EXPRESSION, "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 34, 15, 50], "circle-blur": 0.88, "circle-opacity": 0.18, "circle-stroke-width": 0 }
          const selectedPulsePaint: CircleLayerSpecification["paint"] = { "circle-color": PULSE_LEVEL_EXPRESSION, "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 7, 15, 9], "circle-opacity": 1, "circle-blur": 0.06, "circle-stroke-width": 0 }
          instance.addLayer({ id: "ondo-selected-pulse-outer", type: "circle", source: "ondo-pulse", filter: selectedUnshiftedPulseFilter, paint: selectedPulseOuterPaint })
          instance.addLayer({ id: "ondo-selected-pulse", type: "circle", source: "ondo-pulse", filter: selectedUnshiftedPulseFilter, paint: selectedPulsePaint })
          instance.addLayer({ id: "ondo-selected-pulse-outer-rising", type: "circle", source: "ondo-pulse", filter: selectedRisingPulseFilter, paint: { ...selectedPulseOuterPaint, "circle-translate": risingTranslate, "circle-translate-anchor": "viewport" } })
          instance.addLayer({ id: "ondo-selected-pulse-rising", type: "circle", source: "ondo-pulse", filter: selectedRisingPulseFilter, paint: { ...selectedPulsePaint, "circle-translate": risingTranslate, "circle-translate-anchor": "viewport" } })
          instance.addLayer({ id: "ondo-selected-pulse-outer-warming", type: "circle", source: "ondo-pulse", filter: selectedWarmingPulseFilter, paint: { ...selectedPulseOuterPaint, "circle-translate": warmingTranslate, "circle-translate-anchor": "viewport" } })
          instance.addLayer({ id: "ondo-selected-pulse-warming", type: "circle", source: "ondo-pulse", filter: selectedWarmingPulseFilter, paint: { ...selectedPulsePaint, "circle-translate": warmingTranslate, "circle-translate-anchor": "viewport" } })
          const selectedCapsuleLayout: SymbolLayerSpecification["layout"] = {
            "icon-image": SELECTED_CAPSULE_IMAGE_ID,
            "icon-text-fit": "both",
            "icon-text-fit-padding": [7, 12, 7, 12],
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
            "text-field": ["get", "selectedMarkerLabel"],
            "text-font": ["Noto Sans Bold"],
            "text-size": 12,
            "text-max-width": 24,
            "text-letter-spacing": 0.01,
            "text-offset": [0, 2.8],
            "text-allow-overlap": true,
            "text-ignore-placement": true,
          }
          const selectedCapsulePaint: SymbolLayerSpecification["paint"] = { "text-color": "#29231f", "text-halo-color": "rgba(255,253,249,.4)", "text-halo-width": 0.5 }
          instance.addLayer({ id: "ondo-selected-pulse-capsule", type: "symbol", source: "ondo-pulse", filter: selectedUnshiftedPulseFilter, layout: selectedCapsuleLayout, paint: selectedCapsulePaint })
          instance.addLayer({ id: "ondo-selected-pulse-capsule-rising", type: "symbol", source: "ondo-pulse", filter: selectedRisingPulseFilter, layout: selectedCapsuleLayout, paint: { ...selectedCapsulePaint, "text-translate": risingTranslate, "icon-translate": risingTranslate, "text-translate-anchor": "viewport", "icon-translate-anchor": "viewport" } })
          instance.addLayer({ id: "ondo-selected-pulse-capsule-warming", type: "symbol", source: "ondo-pulse", filter: selectedWarmingPulseFilter, layout: selectedCapsuleLayout, paint: { ...selectedCapsulePaint, "text-translate": warmingTranslate, "icon-translate": warmingTranslate, "text-translate-anchor": "viewport", "icon-translate-anchor": "viewport" } })
          instance.addLayer({ id: "ondo-user-location-halo", type: "circle", source: "ondo-user-location", paint: { "circle-color": "rgba(32,32,30,0.16)", "circle-radius": 14, "circle-stroke-color": "rgba(255,255,255,0.9)", "circle-stroke-width": 1 } })
          instance.addLayer({ id: "ondo-user-location-point", type: "circle", source: "ondo-user-location", paint: { "circle-color": "#20201e", "circle-radius": 6, "circle-stroke-color": "#ffffff", "circle-stroke-width": 2 } })

          if (!initialFilteredVenue && !filteredMapRef.current && cityRootNode.current && venues.length > 0) {
            const rootBox = cityRootNode.current.getBoundingClientRect()
            const headerBox = cityRootNode.current.querySelector<HTMLElement>("[data-testid='ondo-b-city-header']")?.getBoundingClientRect()
            const locationBox = cityRootNode.current.querySelector<HTMLElement>("[data-testid='ondo-b-location-message']")?.getBoundingClientRect()
            const keyBox = cityRootNode.current.querySelector<HTMLElement>("[data-testid='ondo-b-map-key']")?.getBoundingClientRect()
            const longitude = venues.map((venue) => venue.longitude)
            const latitude = venues.map((venue) => venue.latitude)
            instance.fitBounds([
              [Math.min(...longitude), Math.min(...latitude)],
              [Math.max(...longitude), Math.max(...latitude)],
            ], {
              padding: {
                top: Math.ceil(Math.max(headerBox?.bottom ?? rootBox.top, locationBox?.bottom ?? rootBox.top) - rootBox.top + 26),
                right: 28,
                bottom: Math.ceil(rootBox.bottom - (keyBox?.top ?? rootBox.bottom) + 26),
                left: 28,
              },
              maxZoom: CITY[city].zoom,
              duration: 0,
            })
          }

          const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
          if (cityRootNode.current) cityRootNode.current.dataset.pulseMotionApplied = reducedMotion ? "static" : "one-shot"
          const duration = 240
          const pulseHaloLayers = ["ondo-pulse-halo", "ondo-pulse-halo-rising", "ondo-pulse-halo-warming"] as const
          if (reducedMotion) pulseHaloLayers.forEach((layerId) => instance.setPaintProperty(layerId, "circle-opacity", 0.2))
          else {
            const startedAt = performance.now()
            pulseHaloLayers.forEach((layerId) => instance.setPaintProperty(layerId, "circle-opacity", 0.46))
            const animatePulse = (timestamp: number) => {
              if (disposed) return
              const progress = Math.min(1, (timestamp - startedAt) / duration)
              const eased = 1 - (1 - progress) ** 3
              pulseHaloLayers.forEach((layerId) => instance.setPaintProperty(layerId, "circle-opacity", 0.46 - eased * 0.26))
              if (progress < 1) pulseAnimationFrame = window.requestAnimationFrame(animatePulse)
            }
            pulseAnimationFrame = window.requestAnimationFrame(animatePulse)
          }

          const updatePulseMarkerFit = () => {
            if (disposed || !cityRootNode.current) return
            const root = cityRootNode.current
            const rootBox = root.getBoundingClientRect()
            const headerBox = root.querySelector<HTMLElement>("[data-testid='ondo-b-city-header']")?.getBoundingClientRect()
            const locationBox = root.querySelector<HTMLElement>("[data-testid='ondo-b-location-message']")?.getBoundingClientRect()
            const keyBox = root.querySelector<HTMLElement>("[data-testid='ondo-b-map-key']")?.getBoundingClientRect()
            const readableTop = Math.max(headerBox?.bottom ?? rootBox.top, locationBox?.bottom ?? rootBox.top) - rootBox.top + 24
            const readableBottom = (keyBox?.top ?? rootBox.bottom) - rootBox.top - 24
            const readableLeft = 24
            const readableRight = rootBox.width - 24
            const pulseFeatures = toPulseFeatureCollection(venues, state.localPulseEvidenceByVenue, locale, selectedVenueId).features
              .filter((feature) => feature.properties.pulseScore >= 0)
            const allInside = pulseFeatures.length > 0 && pulseFeatures.every((feature) => {
              const point = instance.project(feature.geometry.coordinates as [number, number])
              const zoom = instance.getZoom()
              const offset = pulseOffsetForRank(feature.properties.pulseRank, zoom)
              return point.x + offset.x >= readableLeft
                && point.x + offset.x <= readableRight
                && point.y + offset.y >= readableTop
                && point.y + offset.y <= readableBottom
            })
            const zoom = instance.getZoom()
            const pulseRadius = 18 + Math.max(0, Math.min(1, (zoom - 9) / 6)) * 2
            const clusterFeatures = instance.queryRenderedFeatures({ layers: ["ondo-clusters"] })
              .filter((feature) => feature.geometry.type === "Point")
            const clustersReadable = clusterFeatures.length > 0 && pulseFeatures.every((feature) => {
              const point = instance.project(feature.geometry.coordinates as [number, number])
              const offset = pulseOffsetForRank(feature.properties.pulseRank, zoom)
              return clusterFeatures.every((cluster) => {
                if (cluster.geometry.type !== "Point") return true
                const clusterPoint = instance.project(cluster.geometry.coordinates as [number, number])
                const digits = String(cluster.properties?.point_count_abbreviated ?? cluster.properties?.point_count ?? "").length
                const labelHalfWidth = Math.max(7, digits * 3.8)
                const horizontalGap = Math.max(0, Math.abs(point.x + offset.x - clusterPoint.x) - labelHalfWidth)
                const verticalGap = Math.max(0, Math.abs(point.y + offset.y - clusterPoint.y) - 8)
                return Math.hypot(horizontalGap, verticalGap) >= pulseRadius
              })
            })
            root.dataset.pulseMarkersReadable = String(allInside)
            root.dataset.pulseOfficialClustersReadable = String(clustersReadable)
          }
          instance.once("idle", updatePulseMarkerFit)
          window.setTimeout(updatePulseMarkerFit, 240)
        } catch {
          failMap()
          return
        }
        instance.on("click", "ondo-clusters", async (event: MapLayerMouseEvent) => {
          const feature = instance.queryRenderedFeatures(event.point, { layers: ["ondo-clusters"] })[0]
          const clusterId = feature?.properties?.cluster_id
          const source = instance.getSource("ondo-directory") as GeoJSONSource
          if (typeof clusterId !== "number") return
          const zoom = await source.getClusterExpansionZoom(clusterId)
          if (feature.geometry.type === "Point") instance.easeTo({ center: feature.geometry.coordinates as [number, number], zoom })
        })
        instance.on("click", "ondo-points", (event: MapLayerMouseEvent) => {
          const id = event.features?.[0]?.properties?.id
          if (typeof id === "string" && CANONICAL_MAP_VENUES_COMPACT.some((venue) => venue.id === id)) {
            openBDiscoveryVenue(id)
            if (!actions.recordRecentVenue(id)) actions.notify(copy.recentSaveFailed)
            actions.setSurface({ kind: "venue", venueId: id })
          }
        })
        const pulseInteractiveLayers = ["ondo-pulse-hit", "ondo-pulse-hit-rising", "ondo-pulse-hit-warming"] as const
        pulseInteractiveLayers.forEach((layerId) => {
          instance.on("click", layerId, (event: MapLayerMouseEvent) => {
            const id = event.features?.[0]?.properties?.id
            if (typeof id === "string" && CANONICAL_MAP_VENUES_COMPACT.some((venue) => venue.id === id)) {
              openBDiscoveryVenue(id)
              if (!actions.recordRecentVenue(id)) actions.notify(copy.recentSaveFailed)
              actions.setSurface({ kind: "venue", venueId: id })
            }
          })
        })
        instance.on("mouseenter", "ondo-clusters", () => { instance.getCanvas().style.cursor = "pointer" })
        instance.on("mouseenter", "ondo-points", () => { instance.getCanvas().style.cursor = "pointer" })
        pulseInteractiveLayers.forEach((layerId) => instance.on("mouseenter", layerId, () => { instance.getCanvas().style.cursor = "pointer" }))
        instance.on("mouseleave", "ondo-clusters", () => { instance.getCanvas().style.cursor = "" })
        instance.on("mouseleave", "ondo-points", () => { instance.getCanvas().style.cursor = "" })
        pulseInteractiveLayers.forEach((layerId) => instance.on("mouseleave", layerId, () => { instance.getCanvas().style.cursor = "" }))
        if (filteredMapRef.current) focusFilteredVenues(instance, venues)
        instance.once("idle", () => {
          if (disposed || failed) return
          if (loadDeadline != null) window.clearTimeout(loadDeadline)
          setMapState("ready")
          if (retryFocusPending.current) {
            retryFocusPending.current = false
            window.setTimeout(() => document.querySelector<HTMLElement>("[data-testid='ondo-b-view-toggle']")?.focus({ preventScroll: true }), 0)
          }
        })
      })
    }).catch(failMap)
    return () => {
      disposed = true
      if (loadDeadline != null) window.clearTimeout(loadDeadline)
      if (pulseAnimationFrame != null) window.cancelAnimationFrame(pulseAnimationFrame)
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [actions, city, effectiveView, locale, retryToken])

  useEffect(() => {
    const directorySource = mapRef.current?.getSource("ondo-directory") as GeoJSONSource | undefined
    const pulseSource = mapRef.current?.getSource("ondo-pulse") as GeoJSONSource | undefined
    if (directorySource) {
      void directorySource.setData(toFeatureCollection(venues, state.localPulseEvidenceByVenue, selectedVenueId))
      if (pulseSource) void pulseSource.setData(toPulseFeatureCollection(venues, state.localPulseEvidenceByVenue, locale, selectedVenueId))
      if (filteredMap) focusFilteredVenues(mapRef.current!, venues)
    }
  }, [filteredMap, locale, selectedVenueId, state.localPulseEvidenceByVenue, venues])

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
    setCategory("all")
  }

  function selectVenue(venue: CanonicalMapVenue) {
    replaceBDiscoveryCityContext({ city: venue.cityId, view, query, category, focus: { kind: "venue", venueId: venue.id } })
    openBDiscoveryVenue(venue.id)
    if (!actions.recordRecentVenue(venue.id)) actions.notify(copy.recentSaveFailed)
    actions.setSurface({ kind: "venue", venueId: venue.id })
    mapRef.current?.easeTo({ center: [venue.longitude, venue.latitude], zoom: 15 })
  }

  function updateCityContext(next: { view?: ViewMode; query?: string; category?: BDiscoveryCategory }) {
    if (!city) return
    replaceBDiscoveryCityContext({ city, view: next.view ?? view, query: next.query ?? query, category: next.category ?? category })
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
    }, { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 })
  }

  if (!city) return (
    <div className={styles.compatRoot} data-testid="ondo-map-entry">
      <section className={styles.root} data-testid="ondo-b-map-entry">
        <header className={styles.header}>
          <div className={styles.brand}><i /> <span><strong>ONDO</strong><small>{copy.tagline}</small></span></div>
          <button type="button" className={styles.language} onClick={() => actions.setLocale(NEXT_LOCALE[locale])}><Languages size={16} />{NEXT_LOCALE_LABEL[locale]}</button>
        </header>
        <NationDirectory locale={locale} onSelect={chooseCity} />
      </section>
    </div>
  )

  return (
    <div className={styles.compatRoot} data-testid="ondo-map-entry">
      <section
        ref={cityRootNode}
        className={`${styles.root} ${mapLayoutMode === "ultra-short" ? styles.ultraShort : ""}`}
        data-testid="ondo-b-map-entry"
        data-directory-source={city === "jeju" ? undefined : SOURCE_ID}
        data-source-date={city === "jeju" ? undefined : SOURCE_DATE}
        data-city-record-count={city === "jeju" ? undefined : MAP_VENUES.filter((venue) => venue.cityId === city).length}
        data-editorial-point-count={city === "jeju" ? "0" : undefined}
        data-result-count={venues.length}
        data-map-state={mapState}
        data-map-attempt={retryToken + 1}
        data-connectivity={online ? "online" : "offline"}
        data-location-state={locationState}
        data-user-location={userLocation ? "present" : "absent"}
        data-cluster-grammar={city === "jeju" ? undefined : "official-record-count"}
        data-pulse-map-grammar={city === "jeju" ? undefined : "curated-level-score-over-official-groups"}
        data-pulse-visual-grammar={city === "jeju" ? undefined : "borderless-aura-core-label"}
        data-pulse-motion={city === "jeju" ? undefined : "one-shot-bloom-reduced-safe"}
        data-selected-pulse-grammar={city === "jeju" ? undefined : "one-shot-halo-place-capsule"}
        data-curated-pulse-count={city === "jeju" ? undefined : curatedPulseVenues.length}
        data-layout-mode={mapLayoutMode}
        data-requested-view={view}
        data-effective-view={effectiveView}
        data-map-root-block-size={mapRootBlockSize.toFixed(1)}
        data-selected-venue-id={selectedVenueId ?? "none"}
      >
        <p id="ondo-b-map-instruction" className={styles.srOnly} aria-hidden={editorialOpen ? true : undefined}>{city === "jeju" ? copy.editorialMapA11y : copy.mapA11y}</p>
        <header className={styles.cityHeader} data-testid="ondo-b-city-header">
          <div className={styles.topline}>
            <button type="button" className={styles.back} data-testid="ondo-b-city-back" aria-label={copy.back} onClick={() => { mapRef.current?.remove(); mapRef.current = null; if (!goBackFromBDiscovery("city")) setCity(null) }}><ArrowLeft size={18} /><span>{copy.back}</span></button>
            <div className={styles.cityTitle}><h1>{CITY[city].label[locale]}</h1><small data-testid="ondo-b-pulse-city-status" data-pulse-city-status={city === "jeju" ? "editorial-growing" : PULSE_CITY_STATUS[city]}>{cityPulseStatus(city, locale)}</small></div>
            <button type="button" className={styles.language} data-testid="ondo-b-language" onClick={() => actions.setLocale(NEXT_LOCALE[locale])}><Languages size={16} />{NEXT_LOCALE_LABEL[locale]}</button>
          </div>
          {city !== "jeju" ? <>
            <div className={styles.search} role="search" data-testid="ondo-b-search-shell"><Search size={18} /><input data-testid="ondo-b-search" aria-label={copy.search} value={query} maxLength={SEARCH_MAX_LENGTH} onChange={(event) => { const nextQuery = event.target.value.slice(0, SEARCH_MAX_LENGTH); setQuery(nextQuery); updateCityContext({ query: nextQuery }) }} placeholder={copy.search} />{query ? <button type="button" onClick={() => { setQuery(""); updateCityContext({ query: "" }) }} aria-label={MAP_UI[locale].clearSearch}><X size={16} /></button> : null}</div>
            <div className={styles.rail} aria-label={copy.filterLabel} data-testid="ondo-b-category-rail">
              {(Object.keys(CATEGORY) as BDiscoveryCategory[]).map((item) => <button key={item} type="button" aria-label={CATEGORY[item][locale]} aria-pressed={category === item} onClick={() => { setCategory(item); updateCityContext({ category: item }) }}>{mapLayoutMode === "ultra-short" ? CATEGORY[item].compact[locale] : CATEGORY[item][locale]}</button>)}
            </div>
          </> : null}
        </header>

        <div ref={mapNode} className={styles.map} data-testid="maplibre-map" role="region" aria-label={city === "jeju" ? MAP_UI[locale].editorialRegion : MAP_UI[locale].mapRegion} aria-describedby="ondo-b-map-instruction ondo-b-pulse-marker-accessible-detail" hidden={effectiveView !== "map"} aria-hidden={editorialOpen || effectiveView !== "map" ? true : undefined} inert={editorialOpen ? true : undefined} data-editorial-inert={editorialOpen ? "true" : "false"} />
        {city === "seoul" || city === "jeju" ? <JapanFirstDiscoveryB locale={locale} city={city} onOpenChange={setEditorialOpen} /> : null}
        <ul id="ondo-b-pulse-marker-accessible-detail" className={styles.srOnly} data-testid="ondo-b-pulse-marker-accessible-detail" aria-hidden={editorialOpen ? true : undefined}>
          {curatedPulseVenues.map(({ venue, pulse }) => (
            <li key={venue.id}>
              {`${venueDisplayName(venue.name.ko, locale)} · Pulse ${pulse.score} · ${pulseLevelLabel(pulse.level, locale)} · ${MAP_UI[locale].freshness} ${pulse.freshness} · ${MAP_UI[locale].confidence} ${pulse.confidence}`}
            </li>
          ))}
        </ul>
        {!editorialOpen && effectiveView === "map" && (mapState === "idle" || mapState === "loading") ? <p className={styles.mapLoading} role="status" data-testid="ondo-b-map-loading">{city === "jeju" ? copy.editorialMapLoading : copy.mapLoading}</p> : null}

        <div className={styles.mapChrome} data-testid="ondo-b-map-chrome">
          <div className={styles.resultBar} data-testid="ondo-b-result-bar">
            <span><b>{city === "jeju" ? copy.jejuMapTruth : resultCount(venues.length, locale)}</b><small>{city === "jeju" ? copy.jejuTruth : `${copy.source} · ${copy.categoryBasis}`}</small></span>
            {city === "jeju" ? null : mapLayoutMode === "ultra-short" ? (
              <span className={styles.forcedListLabel} data-testid="ondo-b-effective-view-label" aria-label={MAP_UI[locale].shortList}><List size={17} />{copy.list}</span>
            ) : (
              <button
                type="button"
                aria-pressed={effectiveView === "list"}
                onClick={() => {
                  const nextView = view === "map" ? "list" : "map"
                  setView(nextView)
                  updateCityContext({ view: nextView })
                }}
                data-testid="ondo-b-view-toggle"
              >
                {effectiveView === "map" ? <List size={17} /> : <MapIcon size={17} />}
                {effectiveView === "map" ? copy.list : copy.map}
              </button>
            )}
          </div>

          {city !== "jeju" && effectiveView === "map" && mapState !== "error" ? (
            <details
              className={styles.locationMessage}
              data-testid="ondo-b-location-message"
              name="ondo-map-disclosure"
              data-message-kind={!online ? "offline" : locationState === "idle" ? "disclosure" : "status"}
            >
              <summary><span>{locationSummary}</span><ChevronRight size={16} /></summary>
              <p id="ondo-b-location-message" role={!online || locationState !== "idle" ? "status" : undefined} data-testid="ondo-b-location-details">{locationMessage}</p>
            </details>
          ) : null}
          {city !== "jeju" && effectiveView === "map" && mapState !== "error" ? <button type="button" className={styles.locate} data-testid="ondo-b-locate" data-location-state={locationState} aria-describedby="ondo-b-location-message" aria-label={locationState === "denied" ? copy.retryLocation : copy.locate} onClick={locateUser}><LocateFixed size={19} /></button> : null}
          {city !== "jeju" && effectiveView === "map" && mapState !== "error" ? (
            <aside className={styles.mapKey} data-testid="ondo-b-map-key" aria-label={`${copy.mapKey}. ${copy.mapKeyBody}. ${PULSE_DISCLOSURE[locale]}`}>
              <div className={styles.mapKeyLead}>
                <span><i className={styles.clusterSwatch}>12</i><small>{MAP_UI[locale].officialGroups}</small></span>
              </div>
              <div className={styles.pulseScale} data-testid="ondo-b-pulse-scale" aria-hidden="true">
                <b>Pulse</b><i /><small>{MAP_UI[locale].pulseRange}</small>
              </div>
              <details className={styles.mapKeyDetails} data-testid="ondo-b-map-key-details" name="ondo-map-disclosure">
                <summary aria-label={copy.mapKeyDetails}><span>{copy.mapKeyDetails}</span><ChevronRight size={16} /></summary>
                <div className={styles.mapKeyDetailsBody}>
                  <div className={styles.pulseLegend} data-testid="ondo-b-pulse-legend" aria-label={MAP_UI[locale].pulseLegend}>
                    {(["peak", "hot", "rising", "warming", "low", "limited"] as const).map((level) => <span key={level} data-level={level}><i />{pulseLevelLabel(level, locale)}</span>)}
                  </div>
                  <small>{copy.mapKeyBody}</small>
                  <small data-testid="ondo-b-pulse-composition-disclosure">{PULSE_COMPOSITION_DISCLOSURE[locale]}</small>
                  <dl className={styles.pulseCompositionRows} data-testid="ondo-b-pulse-production-drivers">
                    {PULSE_PRODUCTION_DRIVER_DISCLOSURE[locale].map((driver) => (
                      <div key={driver.id}>
                        <dt>{driver.label}</dt>
                        <dd><strong>{driver.state}</strong><span>{driver.detail}</span></dd>
                      </div>
                    ))}
                  </dl>
                  <ul className={styles.pulsePlaces} data-testid="ondo-b-map-pulse-places" aria-label={MAP_UI[locale].pulsePlaces}>
                    {curatedPulseVenues.map(({ venue, pulse }) => (
                      <li key={venue.id}>
                        <button
                          type="button"
                          data-level={pulse.level}
                          data-pulse-place-priority={pulse.level}
                          aria-label={`${venueDisplayName(venue.name.ko, locale)} · Pulse ${pulse.score} · ${pulseLevelLabel(pulse.level, locale)} · ${MAP_UI[locale].freshness} ${pulse.freshness} · ${MAP_UI[locale].confidence} ${pulse.confidence}`}
                          onClick={() => selectVenue(venue)}
                        >
                          <span>{venueDisplayName(venue.name.ko, locale)}</span>
                          <b>{pulse.score} · {pulseLevelLabel(pulse.level, locale)}</b>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            </aside>
          ) : null}
          {effectiveView === "map" && mapState !== "error" ? (
            <footer className={styles.attribution} data-testid="ondo-b-attribution" aria-label={MAP_UI[locale].mapAttribution}>
              <details className={styles.creditDetails} data-testid="ondo-b-map-credit-details" name="ondo-map-disclosure">
                <summary aria-label={copy.mapCredits}><span>{copy.mapCredits}</span><Info size={17} /></summary>
                <div className={styles.creditDetailsBody}>
                  <a href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap</a>
                  <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">© OpenMapTiles</a>
                  <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">Data from OpenStreetMap / ODbL</a>
                </div>
              </details>
            </footer>
          ) : null}
        </div>

        {city === "jeju" && mapState === "error" ? <div className={`${styles.mapError} ${styles.editorialMapError}`} role="status" data-testid="ondo-b-map-fallback-status"><span>{copy.editorialMapUnavailable}</span><button type="button" onClick={retryMap}>{copy.retryMap}</button></div> : null}
        {city !== "jeju" && (effectiveView === "list" || mapState === "error") ? (
          <div className={styles.listPanel} data-testid="ondo-b-list-panel">
            {mapState === "error" ? <div className={styles.mapError} role="status" data-testid="ondo-b-map-fallback-status"><span>{copy.mapUnavailable}</span><button type="button" onClick={retryMap}>{copy.retryMap}</button></div> : null}
            <p className={styles.pulseDisclosure} data-testid="ondo-b-pulse-disclosure">{PULSE_DISCLOSURE[locale]}</p>
            <VenueList venues={venues} locale={locale} localPulseEvidenceByVenue={state.localPulseEvidenceByVenue} selectedVenueId={selectedVenueId} visibleCount={visibleCount} onClear={() => { setQuery(""); setCategory("all"); updateCityContext({ query: "", category: "all" }) }} onMore={() => setVisibleCount((count) => Math.min(venues.length, count + 30))} onSelect={selectVenue} />
          </div>
        ) : null}
        {selectedVenue && selectedPulse ? <span className={styles.srOnly} role="status" data-testid="ondo-b-selected-marker-status">{venueDisplayName(selectedVenue.name.ko, locale)} · {selectedPulse.score == null ? `Pulse · ${pulseLevelLabel(selectedPulse.level, locale)}` : `Pulse ${selectedPulse.score} · ${pulseLevelLabel(selectedPulse.level, locale)}`}</span> : null}
        {userLocation ? <span className={styles.srOnly} data-testid="ondo-b-user-location-marker" data-longitude={userLocation.longitude} data-latitude={userLocation.latitude}>{copy.locationReady}</span> : null}
      </section>
    </div>
  )
}
