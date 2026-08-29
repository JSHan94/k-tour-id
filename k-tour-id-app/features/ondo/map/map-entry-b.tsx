"use client"

import type { CircleLayerSpecification, ExpressionSpecification, GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent, SymbolLayerSpecification } from "maplibre-gl"
import type { CSSProperties } from "react"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, ChevronRight, Copyright, Info, Languages, List, LocateFixed, Map as MapIcon, MapPin, Search, X } from "lucide-react"
import { KOREA_OUTLINE_COORDINATES } from "@/lib/map/korea-atlas-data"
import { ondoMapStyle } from "@/lib/ondo/map/ondo-map-style"
import type { CanonicalMapVenue, VenuePrimaryCategory } from "@/lib/ondo/venues/contracts"
import { CANONICAL_MAP_VENUES_COMPACT } from "@/lib/ondo/venues/map-data"
import { venueDisplayName, venueDistrictLabel, venueNamePresentation } from "@/lib/ondo/venues/display"
import { mapFoodIntentAliases } from "@/lib/ondo/venues/map-discovery-aliases"
import { GlobalAfter19B } from "../after19/after19-global-b"
import {
  PULSE_CITY_STATUS,
  PULSE_DISCLOSURE,
  pulseForVenue,
  pulseLevelLabel,
  type PulseLocalEvidenceB,
} from "../pulse-b/pulse-model-b"
import { editorialPlaceById, JEJU_EDITORIAL_PLACES, PULSE_COMPOSITION_DISCLOSURE, PULSE_PRODUCTION_DRIVER_DISCLOSURE, type EditorialPlaceB } from "../pulse-b/japan-first-pulse-model-b"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import { useOndoB } from "../shared/state/ondo-b-provider"
import { OndoBrandLockupB } from "../shared/ui/ondo-brand-lockup-b"
import { JapanFirstDiscoveryB } from "./japan-first-discovery-b"
import {
  B_DISCOVERY_TRAVERSAL_EVENT,
  enterBDiscoveryCity,
  focusBDiscoveryTarget,
  goBackFromBDiscovery,
  initializeBDiscoveryHistory,
  installBDiscoveryTraversalGuard,
  normalizeBDiscoveryHistoryForActiveDocument,
  openBDiscoveryEditorialDetail,
  openBDiscoveryEditorialPlace,
  openBDiscoveryVenue,
  readBDiscoveryTraversal,
  replaceBDiscoveryCityContext,
  replaceBDiscoveryHistoryForActiveDocument,
  type BDiscoveryCategory,
  type BDiscoveryHistoryEntry,
} from "./b-discovery-history"
import styles from "./map-b.module.css"

type CityId = "seoul" | "busan" | "jeju"
type AtlasViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void | Promise<void>) => { finished: Promise<void>; skipTransition?(): void }
}
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
    title: "Find your next stop in Korea.",
    body: "Food maps for Seoul and Busan, plus travel ideas across Jeju.",
    coverage: "Korea map · 3 regions",
    openMap: "Open map",
    source: "LOCALDATA source snapshot · Aug 19, 2026",
    sourceBoundary: "Listed in LOCALDATA at the source date. Check today’s hours, menu, prices and payment support with the place.",
    search: "Place, district or category",
    list: "List",
    map: "Map",
    back: "Korea map",
    records: "places",
    officialName: "Official Korean source name",
    categoryBasis: "Category normalized from the official business type",
    more: "Load 30 more",
    mapA11y: "The map is visual. Use plus, minus and arrow keys to move it, or open the List for keyboard-accessible directory results.",
    editorialMapA11y: "The Jeju map shows island places and travel stories. Open a pin to see the place, its source and save action.",
    mapUnavailable: "The map could not load. All 200 places remain available in the list.",
    retryMap: "Retry map",
    offlineTitle: "Offline",
    offlineSource: "The place list is still available; map tiles may be unavailable.",
    locationUnavailable: "Your location was not used. Search or choose a place from the list.",
    locating: "Finding your location…",
    locationReady: "You’re here",
    locationDenied: "Location access is off. Search still works. Change the browser permission, then try again.",
    locationUnsupported: "This browser cannot share a location. Search and the full place list still work.",
    locate: "My location",
    retryLocation: "Try my location again",
    locationDisclosure: "Location stays in this tab. OpenFreeMap receives map-area requests.",
    nearest: "nearest place",
    mapLoading: "Loading the map…",
    editorialMapLoading: "Loading the Jeju map…",
    noResultsTitle: "No places match",
    noResultsBody: "Clear the search and category to see every place in this city.",
    noResultsBodyLocked: "Clear the search to see every pub and café in this city.",
    clearResults: "Clear search and category",
    clearSearch: "Clear search",
    mapKey: "ONDO temperature · place groups",
    mapKeyBody: "Outlined numbers group nearby places. Small dots are individual places.",
    mapKeyDetails: "How to read this map",
    mapCredits: "Map credits",
    pulseActive: "ONDO temperature · curated food signal",
    pulseGrowing: "ONDO temperature · coverage growing",
    pulseExplore: "ONDO temperature · limited signals",
    pulseSignals: "curated signals",
    pulseLocal: "Your Local Signal is included on this device",
    jejuStatus: "Island picks",
    jejuTruth: "Places & stories",
    jejuMapTruth: "Jeju map",
    officialSourceScope: "Seoul and Busan · LOCALDATA places",
    jejuSourceScope: "Jeju · VISITKOREA editorial places",
    editorialMapUnavailable: "The map could not load. Jeju place links and stories remain available.",
    aboutMap: "About this Korea map",
    mapScopeSummary: "Seoul · Busan · Jeju",
    methodology: "How ONDO temperature works",
    filterLabel: "Food category",
    recentSaveFailed: "The place opened, but this device could not update Recently viewed.",
  },
  ko: {
    tagline: "한국 음식·여행 지도",
    title: "한국에서 다음 장소를 찾아보세요.",
    body: "서울·부산의 먹거리와 제주 여행 아이디어를 한 지도에서 둘러보세요.",
    coverage: "대한민국 지도 · 3개 지역",
    openMap: "지도 열기",
    source: "LOCALDATA 출처 스냅샷 · 2026. 8. 19.",
    sourceBoundary: "출처 기준일에 LOCALDATA에 등록된 장소입니다. 오늘의 영업시간·메뉴·가격·결제는 장소에 확인해 주세요.",
    search: "장소명, 지역 또는 업태",
    list: "목록",
    map: "지도",
    back: "대한민국 지도",
    records: "장소",
    officialName: "공식 출처 한글명",
    categoryBasis: "LOCALDATA 장소 유형을 바탕으로 정리한 분류",
    more: "30개 더 보기",
    mapA11y: "지도는 시각 정보입니다. 더하기, 빼기와 방향키로 움직이거나 키보드로 탐색할 수 있는 목록을 여세요.",
    editorialMapA11y: "제주 지도에는 섬의 장소와 여행 이야기가 표시됩니다. 핀을 열면 장소와 출처를 보고 저장할 수 있어요.",
    mapUnavailable: "지도를 불러오지 못했어요. 장소 200곳은 목록에서 계속 볼 수 있어요.",
    retryMap: "지도 다시 불러오기",
    offlineTitle: "오프라인",
    offlineSource: "장소 목록은 계속 볼 수 있지만 지도 타일은 표시되지 않을 수 있어요.",
    locationUnavailable: "현재 위치를 사용하지 않았어요. 검색하거나 목록에서 장소를 골라보세요.",
    locating: "현재 위치를 찾는 중…",
    locationReady: "현재 위치",
    locationDenied: "위치 권한이 꺼져 있어요. 검색은 그대로 쓸 수 있어요. 브라우저 권한을 바꾼 뒤 다시 시도하세요.",
    locationUnsupported: "이 브라우저에서는 위치를 공유할 수 없어요. 검색과 전체 장소 목록은 그대로 쓸 수 있어요.",
    locate: "내 위치",
    retryLocation: "내 위치 다시 시도",
    locationDisclosure: "위치는 이 탭에만 남습니다. OpenFreeMap은 지도 영역 요청을 받습니다.",
    nearest: "가장 가까운 장소",
    mapLoading: "지도를 불러오는 중…",
    editorialMapLoading: "제주 지도를 불러오는 중…",
    noResultsTitle: "일치하는 장소가 없어요",
    noResultsBody: "검색어와 분류를 초기화하면 이 도시의 모든 장소를 볼 수 있어요.",
    noResultsBodyLocked: "검색어를 지우면 이 도시의 주점·카페를 모두 볼 수 있어요.",
    clearResults: "검색어와 업태 초기화",
    clearSearch: "검색어 지우기",
    mapKey: "온도 · 장소 묶음",
    mapKeyBody: "테두리 숫자는 가까운 장소 묶음, 작은 점은 개별 장소를 뜻합니다.",
    mapKeyDetails: "지도 읽는 법",
    mapCredits: "지도 출처",
    pulseActive: "온도 · 선별 식음료 신호",
    pulseGrowing: "온도 · 신호 범위 확장 중",
    pulseExplore: "온도 · 신호 부족",
    pulseSignals: "선별 신호",
    pulseLocal: "이 기기의 로컬 시그널이 포함됨",
    jejuStatus: "섬의 추천 장소",
    jejuTruth: "장소와 이야기",
    jejuMapTruth: "제주 지도",
    officialSourceScope: "서울·부산 · LOCALDATA 장소",
    jejuSourceScope: "제주 · VISITKOREA 편집 장소",
    editorialMapUnavailable: "지도를 불러오지 못했어요. 제주 장소 링크와 이야기는 계속 볼 수 있어요.",
    aboutMap: "대한민국 지도 안내",
    mapScopeSummary: "서울 · 부산 · 제주",
    methodology: "온도를 만드는 방식과 장소",
    filterLabel: "음식 분류",
    recentSaveFailed: "장소는 열었지만 이 기기의 최근 본 목록에는 저장하지 못했어요.",
  },
  ja: {
    tagline: "韓国フード・旅行マップ",
    title: "韓国で次の場所を見つけよう。",
    body: "ソウル・釜山の食と済州の旅のアイデアを、ひとつの地図で探せます。",
    coverage: "韓国マップ・3地域",
    openMap: "地図を開く",
    source: "LOCALDATA出典スナップショット・2026年8月19日",
    sourceBoundary: "出典日時点でLOCALDATAに掲載された場所です。現在の営業時間、メニュー、価格、決済は店舗で確認してください。",
    search: "場所・エリア・業種を検索",
    list: "リスト",
    map: "地図",
    back: "韓国マップ",
    records: "場所",
    officialName: "韓国語の公式名称",
    categoryBasis: "LOCALDATAの場所タイプをもとに整理した分類",
    more: "さらに30件",
    mapA11y: "地図は視覚情報です。プラス、マイナス、矢印キーで動かすか、キーボードで使えるリストを開いてください。",
    editorialMapA11y: "済州の地図には島の場所と旅のストーリーを表示します。ピンを開くと場所、情報源、保存操作を確認できます。",
    mapUnavailable: "地図を読み込めませんでした。200か所はリストで引き続き確認できます。",
    retryMap: "地図を再読み込み",
    offlineTitle: "オフライン",
    offlineSource: "場所のリストは引き続き利用できますが、地図タイルを表示できない場合があります。",
    locationUnavailable: "現在地は使用しませんでした。検索するか、リストから場所を選んでください。",
    locating: "現在地を確認中…",
    locationReady: "現在地",
    locationDenied: "位置情報へのアクセスがオフです。検索はそのまま利用できます。ブラウザの権限を変更して再度お試しください。",
    locationUnsupported: "このブラウザでは現在地を共有できません。検索と場所のリストは引き続き利用できます。",
    locate: "現在地",
    retryLocation: "現在地を再試行",
    locationDisclosure: "位置情報はこのタブ内にのみ残ります。OpenFreeMapには地図範囲のリクエストが送られます。",
    nearest: "最寄りの場所",
    mapLoading: "地図を読み込み中…",
    editorialMapLoading: "済州の地図を読み込み中…",
    noResultsTitle: "一致する場所がありません",
    noResultsBody: "検索語と分類を解除すると、この都市のすべての場所を確認できます。",
    noResultsBodyLocked: "検索語を解除すると、この都市のパブ・カフェをすべて確認できます。",
    clearResults: "検索語と業種を解除",
    clearSearch: "検索語を解除",
    mapKey: "ONDO温度・場所グループ",
    mapKeyBody: "枠付きの数字は近くの場所のまとまり、小さな点は個別の場所です。",
    mapKeyDetails: "地図の見方",
    mapCredits: "地図クレジット",
    pulseActive: "ONDO温度・選定した飲食シグナル",
    pulseGrowing: "ONDO温度・シグナル範囲を拡大中",
    pulseExplore: "ONDO温度・シグナル不足",
    pulseSignals: "キュレーションシグナル",
    pulseLocal: "この端末のローカルシグナルを含みます",
    jejuStatus: "島のおすすめ",
    jejuTruth: "場所とストーリー",
    jejuMapTruth: "済州マップ",
    officialSourceScope: "ソウル・釜山・LOCALDATA掲載場所",
    jejuSourceScope: "済州・VISITKOREAの編集スポット",
    editorialMapUnavailable: "地図を読み込めませんでした。済州の場所リンクとストーリーは引き続き確認できます。",
    aboutMap: "韓国マップについて",
    mapScopeSummary: "ソウル・釜山・済州",
    methodology: "ONDO温度の仕組みと場所",
    filterLabel: "飲食カテゴリー",
    recentSaveFailed: "場所は開きましたが、この端末の最近見た場所には保存できませんでした。",
  },
} satisfies Record<OndoBLocale, Record<string, string>>

const MAP_UI = {
  en: { atlas: "Korea overview map showing Seoul, Busan, and Jeju", clearSearch: "Clear search", mapRegion: "Korea food map", editorialRegion: "Jeju travel map", officialGroups: "Place groups", pulseRange: "Low → Peak", pulseLegend: "ONDO temperature level legend", pulsePlaces: "ONDO temperature places", mapAttribution: "Map attribution", shortList: "List view on a short screen", locationTab: "Location · this tab only", locationOff: "Location access off", locationUnavailable: "Location unavailable", freshness: "freshness", confidence: "confidence", directoryKind: "Explore", editorialKind: "Explore" },
  ko: { atlas: "서울·부산·제주를 표시한 대한민국 탐색 지도", clearSearch: "검색어 지우기", mapRegion: "한국 먹거리 지도", editorialRegion: "제주 여행 지도", officialGroups: "장소 묶음", pulseRange: "여유 → 피크", pulseLegend: "온도 단계 범례", pulsePlaces: "온도 장소", mapAttribution: "지도 출처", shortList: "좁은 화면에서 목록 보기 사용 중", locationTab: "위치 · 이 탭에서만", locationOff: "위치 권한 꺼짐", locationUnavailable: "위치 미지원", freshness: "최신성", confidence: "신뢰도", directoryKind: "탐색", editorialKind: "탐색" },
  ja: { atlas: "ソウル・釜山・済州を示す韓国マップ", clearSearch: "検索語を消去", mapRegion: "韓国フードマップ", editorialRegion: "済州トラベルマップ", officialGroups: "場所のまとまり", pulseRange: "ゆったり → ピーク", pulseLegend: "ONDO温度レベルの凡例", pulsePlaces: "ONDO温度の場所", mapAttribution: "地図の出典", shortList: "高さの低い画面ではリスト表示", locationTab: "現在地・このタブ内のみ", locationOff: "位置情報へのアクセスはオフ", locationUnavailable: "位置情報を利用できません", freshness: "更新状況", confidence: "確度", directoryKind: "探す", editorialKind: "探す" },
} satisfies Record<OndoBLocale, Record<string, string>>

const TEMPERATURE_NAME: Record<OndoBLocale, string> = {
  en: "ONDO temperature",
  ko: "온도",
  ja: "ONDO温度",
}

const NEXT_LOCALE: Record<OndoBLocale, OndoBLocale> = { en: "ja", ja: "ko", ko: "en" }
const NEXT_LOCALE_LABEL: Record<OndoBLocale, string> = { en: "JA", ja: "KO", ko: "EN" }
const NEXT_LOCALE_ACCESSIBLE_LABEL: Record<OndoBLocale, string> = {
  en: "Switch to Japanese",
  ja: "韓国語に切り替える",
  ko: "영어로 전환",
}

const CATEGORY: Record<BDiscoveryCategory, { en: string; ko: string; ja: string; compact: Record<OndoBLocale, string>; short: string }> = {
  all: { en: "All", ko: "전체", ja: "すべて", compact: { en: "All", ko: "전체", ja: "すべて" }, short: "ALL" },
  korean: { en: "Korean", ko: "한식", ja: "韓国料理", compact: { en: "Korean", ko: "한식", ja: "韓国料理" }, short: "K" },
  casual: { en: "Quick service", ko: "분식·간편식", ja: "軽食・ファストフード", compact: { en: "Quick", ko: "분식", ja: "軽食" }, short: "Q" },
  japanese: { en: "Japanese", ko: "일식", ja: "日本料理", compact: { en: "Japanese", ko: "일식", ja: "日本料理" }, short: "J" },
  chinese: { en: "Chinese", ko: "중식", ja: "中華料理", compact: { en: "Chinese", ko: "중식", ja: "中華" }, short: "C" },
  global: { en: "Western & international", ko: "경양식·외국음식", ja: "洋食・各国料理", compact: { en: "Western", ko: "외국음식", ja: "洋食・各国" }, short: "G" },
  night: { en: "Pubs & cafés", ko: "주점·카페", ja: "パブ・カフェ", compact: { en: "Pubs & cafés", ko: "주점·카페", ja: "パブ・カフェ" }, short: "P" },
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
const AFTER19_PULSE_LEVEL_EXPRESSION: ExpressionSpecification = [
  "match", ["get", "pulseRank"],
  5, "#FF3FA4",
  4, "#FF604D",
  3, "#FF9A3D",
  2, "#FFD45A",
  1, "#E7F26D",
  "#8A8D98",
]
const PULSE_HEAT_COLOR: ExpressionSpecification = [
  "interpolate", ["linear"], ["heatmap-density"],
  0, "rgba(255,217,138,0)",
  0.16, "rgba(255,217,138,.24)",
  0.36, "rgba(255,155,85,.48)",
  0.6, "rgba(239,89,71,.64)",
  0.8, "rgba(206,73,58,.76)",
  1, "rgba(122,32,72,.88)",
]
const AFTER19_HEAT_COLOR: ExpressionSpecification = [
  "interpolate", ["linear"], ["heatmap-density"],
  0, "rgba(255,200,70,0)",
  0.12, "rgba(255,212,90,.30)",
  0.34, "rgba(255,154,61,.62)",
  0.58, "rgba(255,96,77,.82)",
  0.8, "rgba(255,63,164,.92)",
  1, "rgba(255,112,215,1)",
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
const KOREA_ATLAS_CITY_COORDINATES = {
  seoul: { latitude: 37.5647, longitude: 126.9874, x: 86.1, y: 77.6 },
  busan: { latitude: 35.1794, longitude: 129.0541, x: 184.1, y: 212.7 },
  jeju: { latitude: 33.3802, longitude: 126.5404, x: 64.9, y: 314.6 },
} as const satisfies Record<CityId, { latitude: number; longitude: number; x: number; y: number }>

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
  if (locale === "ko") return `장소 ${count}곳`
  if (locale === "ja") return `${count}か所`
  return `${count} ${count === 1 ? "place" : "places"}`
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
  const cityNodes: Array<{
    id: CityId
    regionRole: "official-directory" | "editorial-collection"
    officialCount?: number
    directorySource?: string
    editorialCount?: number
    truthKind?: "editorial-region"
    accessibleTruth: string
    coordinates: { latitude: number; longitude: number; x: number; y: number }
  }> = [
    {
      id: "seoul",
      regionRole: "official-directory",
      officialCount: 200,
      directorySource: SOURCE_ID,
      accessibleTruth: resultCount(200, locale),
      coordinates: KOREA_ATLAS_CITY_COORDINATES.seoul,
    },
    {
      id: "busan",
      regionRole: "official-directory",
      officialCount: 200,
      directorySource: SOURCE_ID,
      accessibleTruth: resultCount(200, locale),
      coordinates: KOREA_ATLAS_CITY_COORDINATES.busan,
    },
    {
      id: "jeju",
      regionRole: "editorial-collection",
      editorialCount: 10,
      truthKind: "editorial-region",
      accessibleTruth: `${copy.jejuStatus} · ${copy.jejuTruth}`,
      coordinates: KOREA_ATLAS_CITY_COORDINATES.jeju,
    },
  ]
  const [seoulPoint, busanPoint, jejuPoint] = cityNodes.map(({ coordinates }) => coordinates)
  const atlasRoute = `M${seoulPoint.x} ${seoulPoint.y} C119 115 158 174 ${busanPoint.x} ${busanPoint.y} C157 257 110 292 ${jejuPoint.x} ${jejuPoint.y}`
  return (
    <section className={styles.nation} data-testid="ondo-b-nation">
      <div className={`${styles.dotMap} ${styles.koreaAtlas}`} data-testid="ondo-b-korea-atlas" data-visual-object="living-atlas">
        <div className={styles.nationIntro}>
          <h1>{copy.title}</h1>
        </div>
        <div className={styles.atlasPlot} data-testid="ondo-b-atlas-plot">
          <svg viewBox="0 0 300 350" preserveAspectRatio="none" role="img" aria-label={MAP_UI[locale].atlas}>
            <path className={styles.atlasRoute} data-testid="ondo-b-atlas-route" d={atlasRoute} />
            {cityNodes.map(({ id, coordinates }) => <circle key={`stop-${id}`} className={styles.atlasStop} data-atlas-stop={id} cx={coordinates.x} cy={coordinates.y} r="4.5" />)}
            {KOREA_DOTS.map((dot, index) => <circle key={`${dot.x}-${dot.y}`} cx={dot.x} cy={dot.y} r={index % 5 === 0 ? 2 : 1.65} />)}
          </svg>
          {cityNodes.map((cityNode) => (
            <button
              key={cityNode.id}
              type="button"
              className={styles.cityNode}
              data-city={cityNode.id}
              data-region-role={cityNode.regionRole}
              data-official-count={cityNode.officialCount}
              data-directory-source={cityNode.directorySource}
              data-editorial-count={cityNode.editorialCount}
              data-truth-kind={cityNode.truthKind}
              data-atlas-pin="true"
              data-atlas-latitude={cityNode.coordinates.latitude}
              data-atlas-longitude={cityNode.coordinates.longitude}
              data-atlas-x={cityNode.coordinates.x}
              data-atlas-y={cityNode.coordinates.y}
              style={{ "--atlas-x": `${cityNode.coordinates.x / 3}%`, "--atlas-y": `${cityNode.coordinates.y / 3.5}%` } as CSSProperties}
              onClick={() => onSelect(cityNode.id)}
              aria-label={`${CITY[cityNode.id].label[locale]} · ${cityNode.accessibleTruth} · ${copy.openMap}`}
            >
              <i aria-hidden="true">
                <MapPin size={18} />
              </i>
              <span>
                <strong>{CITY[cityNode.id].label[locale]}</strong>
              </span>
            </button>
          ))}
        </div>
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
): GeoJSON.FeatureCollection<GeoJSON.Point, { id: string; pulseLevel: string; pulseRank: number; pulseScore: number; mapAnchor: boolean; selectedMarkerLabel: string; selected: boolean }> {
  const rows = venues.flatMap((venue) => {
    const pulse = pulseForVenue(venue.id, localPulseEvidenceByVenue[venue.id] ?? null)
    return pulse.score == null && venue.id !== selectedVenueId ? [] : [{ venue, pulse }]
  })
  const mapAnchorIds = new Set([...rows]
    .filter(({ pulse }) => pulse.score != null)
    .sort((left, right) => (right.pulse.score ?? 0) - (left.pulse.score ?? 0) || left.venue.id.localeCompare(right.venue.id))
    .slice(0, 8)
    .map(({ venue }) => venue.id))
  return {
    type: "FeatureCollection",
    features: rows.map(({ venue, pulse }) => ({
        type: "Feature" as const,
        id: venue.id,
        geometry: { type: "Point" as const, coordinates: [venue.longitude, venue.latitude] },
        properties: {
          id: venue.id,
          pulseLevel: pulse.level,
          pulseRank: PULSE_RANK[pulse.level],
          pulseScore: pulse.score ?? -1,
          mapAnchor: mapAnchorIds.has(venue.id) || venue.id === selectedVenueId,
          selectedMarkerLabel: venueDisplayName(venue.name.ko, locale),
          selected: venue.id === selectedVenueId,
        },
      })),
  }
}

function toEditorialPlaceFeatureCollection(locale: OndoBLocale, selectedEditorialPlaceId: string | null = null, enabled = true): GeoJSON.FeatureCollection<GeoJSON.Point, { id: string; name: string; category: EditorialPlaceB["category"]; selected: boolean }> {
  return {
    type: "FeatureCollection",
    features: enabled ? JEJU_EDITORIAL_PLACES.map((place) => ({
      type: "Feature",
      id: place.id,
      geometry: { type: "Point", coordinates: [place.location.longitude, place.location.latitude] },
      properties: {
        id: place.id,
        name: place.name[locale],
        category: place.category,
        selected: place.id === selectedEditorialPlaceId,
      },
    })) : [],
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
  const container = map.getContainer().getBoundingClientRect()
  const shortLandscape = container.height <= 500 && container.width > container.height
  const horizontalPadding = Math.round(Math.max(24, Math.min(72, container.width * 0.08)))
  const topPadding = shortLandscape
    ? Math.round(Math.max(144, Math.min(168, container.height * 0.4)))
    : Math.round(Math.max(150, Math.min(220, container.height * 0.3)))
  const bottomPadding = shortLandscape
    ? Math.round(Math.max(52, Math.min(76, container.height * 0.17)))
    : Math.round(Math.max(104, Math.min(160, container.height * 0.22)))
  const longitudes = venues.map((venue) => venue.longitude)
  const latitudes = venues.map((venue) => venue.latitude)
  map.fitBounds([
    [Math.min(...longitudes), Math.min(...latitudes)],
    [Math.max(...longitudes), Math.max(...latitudes)],
  ], {
    duration: 0,
    maxZoom: 14.5,
    padding: { top: topPadding, right: horizontalPadding, bottom: bottomPadding, left: horizontalPadding },
  })
}

function VenueList({ venues, locale, localPulseEvidenceByVenue, selectedVenueId, visibleCount, onClear, onMore, onSelect, categoryLocked = false }: {
  venues: readonly CanonicalMapVenue[]
  locale: OndoBLocale
  localPulseEvidenceByVenue: Record<string, PulseLocalEvidenceB>
  selectedVenueId: string | null
  visibleCount: number
  onClear(): void
  onMore(): void
  onSelect(venue: CanonicalMapVenue): void
  categoryLocked?: boolean
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
          ? `${TEMPERATURE_NAME[locale]} · ${pulseLevelLabel(pulse.level, locale)}`
          : `${TEMPERATURE_NAME[locale]} ${pulse.score} · ${pulseLevelLabel(pulse.level, locale)}`
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
                <em
                  className={styles.listPulse}
                  data-testid="ondo-b-list-pulse"
                  data-pulse-level={pulse.level}
                  data-pulse-numeric="hidden"
                  aria-label={`${pulseSummary} · ${pulseDetail}${pulse.localEvidence ? ` · ${copy.pulseLocal}` : ""}`}
                >
                  <span className={styles.listPulseSignal} aria-hidden="true"><i /><i /><i /></span>
                  <span className={styles.srOnly}>{pulseSummary} · {pulseDetail}</span>
                  {pulse.localEvidence ? <span className={styles.srOnly}>{copy.pulseLocal}</span> : null}
                </em>
                <em className={styles.srOnly}>{copy.officialName}</em>
                <small className={locale === "ko" ? styles.srOnly : styles.transliterationTruth}><span>{presentation.transliteration}</span><span className={styles.srOnly}> · {presentation.transliterationLabel}</span></small>
                <small className={styles.srOnly}>{copy.categoryBasis}</small>
              </span>
              <ChevronRight size={17} />
            </button>
          </li>
        )
      })}
      {visibleCount < venues.length ? <li className={styles.loadMore}><button type="button" onClick={onMore}>{copy.more}</button></li> : null}
      {!venues.length ? <li className={styles.empty} data-testid="ondo-b-empty-results"><div role="status"><strong>{copy.noResultsTitle}</strong><span>{categoryLocked ? copy.noResultsBodyLocked : copy.noResultsBody}</span></div><button type="button" onClick={onClear}>{categoryLocked ? copy.clearSearch : copy.clearResults}</button></li> : null}
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
  const currentCityRef = useRef<CityId | null>(null)
  const filteredMapRef = useRef(false)
  const userLocationRef = useRef<UserLocation | null>(null)
  const zoomFocusOwnedRef = useRef(false)
  const retryFocusPending = useRef(false)
  const locationRequestRef = useRef(0)
  const filterCameraSignatureRef = useRef("")
  const after19WasActiveRef = useRef(false)
  const after19ActiveRef = useRef(false)
  const after19BrowseSnapshotRef = useRef<{
    city: Exclude<CityId, "jeju">
    view: ViewMode
    query: string
    category: BDiscoveryCategory
    center: [number, number] | null
    zoom: number | null
  } | null>(null)
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
  const [after19Active, setAfter19Active] = useState(false)
  after19ActiveRef.current = after19Active
  currentCityRef.current = city
  const selectedVenueId = state.surface.kind === "venue" ? state.surface.venueId : null
  const [selectedEditorialPlaceId, setSelectedEditorialPlaceId] = useState<EditorialPlaceB["id"] | null>(null)
  const selectedVenue = selectedVenueId ? CANONICAL_MAP_VENUES_COMPACT.find((venue) => venue.id === selectedVenueId) ?? null : null
  const selectedEditorialPlace = editorialPlaceById(selectedEditorialPlaceId) ?? null
  const selectedPulse = selectedVenue ? pulseForVenue(selectedVenue.id, state.localPulseEvidenceByVenue[selectedVenue.id] ?? null) : null
  const effectiveView: ViewMode = city === "jeju" ? "map" : mapLayoutMode === "ultra-short" ? "list" : view
  const categoryOptions = Object.keys(CATEGORY) as BDiscoveryCategory[]
  const categoryRailItems = after19Active ? (["night"] as BDiscoveryCategory[]) : categoryOptions

  useEffect(() => setEditorialOpen(false), [city])

  useEffect(() => {
    const wasActive = after19WasActiveRef.current
    after19WasActiveRef.current = after19Active
    if (after19Active === wasActive || !city || city === "jeju") return
    if (after19Active) {
      const currentCenter = mapRef.current?.getCenter()
      after19BrowseSnapshotRef.current = {
        city,
        view,
        query,
        category,
        center: currentCenter ? [currentCenter.lng, currentCenter.lat] : null,
        zoom: mapRef.current?.getZoom() ?? null,
      }
      setCategory("night")
      replaceBDiscoveryCityContext({ city, view, query, category: "night" })
      return
    }
    const snapshot = after19BrowseSnapshotRef.current
    after19BrowseSnapshotRef.current = null
    if (!snapshot || snapshot.city !== city) return
    setView(snapshot.view)
    setQuery(snapshot.query)
    setCategory(snapshot.category)
    replaceBDiscoveryCityContext({ city, view: snapshot.view, query: snapshot.query, category: snapshot.category })
    if (snapshot.center && snapshot.zoom != null) {
      window.requestAnimationFrame(() => mapRef.current?.jumpTo({ center: snapshot.center!, zoom: snapshot.zoom! }))
    }
  }, [after19Active])

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
      const usesUltraShortList = height < 260
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
    const applyHistoryEntry = (entry: BDiscoveryHistoryEntry) => {
      const guardedEntry = after19ActiveRef.current && entry.city && entry.city !== "jeju" && entry.category !== "night"
        ? { ...entry, category: "night" as const }
        : entry
      setCity(guardedEntry.city ?? null)
      setView(guardedEntry.view)
      setQuery(guardedEntry.query)
      setCategory(guardedEntry.category)
      setSelectedEditorialPlaceId(guardedEntry.editorialPlaceId ?? (guardedEntry.focus?.kind === "editorial-place" ? guardedEntry.focus.editorialPlaceId : null))
      if (state.onboarding === "ONB-COMPLETE" && (guardedEntry.level === "peek" || guardedEntry.level === "detail") && guardedEntry.venueId) actions.setSurface({ kind: "venue", venueId: guardedEntry.venueId })
      else if (state.onboarding === "ONB-COMPLETE" && guardedEntry.level === "detail" && guardedEntry.editorialPlaceId) actions.setSurface({ kind: "editorial_place", editorialPlaceId: guardedEntry.editorialPlaceId })
      else actions.setSurface({ kind: "map" })
      return guardedEntry
    }
    const onTraversal = (event: Event) => {
      const traversal = readBDiscoveryTraversal(event)
      if (!traversal) return
      const entry = replaceBDiscoveryHistoryForActiveDocument(traversal.entry, traversal.preservedState)
      if (entry) {
        const guardedEntry = applyHistoryEntry(entry)
        if (guardedEntry !== entry) replaceBDiscoveryHistoryForActiveDocument(guardedEntry, traversal.preservedState)
        stabilizeHistoryEntry(guardedEntry, traversal.preservedState)
      }
    }
    window.addEventListener(B_DISCOVERY_TRAVERSAL_EVENT, onTraversal)
    const removeTraversalGuard = installBDiscoveryTraversalGuard()
    const initialState = window.history.state
    const initial = initializeBDiscoveryHistory((venueId) => CANONICAL_MAP_VENUES_COMPACT.find((venue) => venue.id === venueId)?.cityId)
    const guardedInitial = applyHistoryEntry(initial)
    if (guardedInitial !== initial) replaceBDiscoveryHistoryForActiveDocument(guardedInitial, initialState)
    stabilizeHistoryEntry(guardedInitial, initialState)
    return () => {
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
    if (selectedEditorialPlaceId) setCity("jeju")
  }, [selectedEditorialPlaceId])

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
      const initialEditorialPlace = city === "jeju" ? selectedEditorialPlace : null
      const instance = new Map({
        container: mapNode.current,
        style: ondoMapStyle(locale),
        center: initialFilteredVenue
          ? [initialFilteredVenue.longitude, initialFilteredVenue.latitude]
          : initialEditorialPlace
            ? [initialEditorialPlace.location.longitude, initialEditorialPlace.location.latitude]
            : CITY[city].center,
        zoom: initialFilteredVenue || initialEditorialPlace ? 15 : CITY[city].zoom,
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
          instance.addSource("ondo-editorial-places", { type: "geojson", data: toEditorialPlaceFeatureCollection(locale, selectedEditorialPlaceId, city === "jeju") })
          instance.addSource("ondo-night-dim", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [{
                type: "Feature",
                properties: {},
                geometry: { type: "Polygon", coordinates: [[[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]]] },
              }],
            },
          })
          instance.addImage(SELECTED_CAPSULE_IMAGE_ID, selectedCapsuleImage(), {
            pixelRatio: 2,
            stretchX: [[20, 44]],
            stretchY: [[20, 28]],
            content: [16, 12, 48, 36],
          })
          instance.addLayer({ id: "ondo-night-dim", type: "fill", source: "ondo-night-dim", paint: { "fill-color": "#080810", "fill-opacity": 0 } })
          instance.addLayer({
            id: "ondo-clusters",
            type: "circle",
            source: "ondo-directory",
            filter: ["has", "point_count"],
            paint: {
              "circle-color": "rgba(255,255,255,0.34)",
              "circle-radius": ["step", ["get", "point_count"], 11, 15, 15, 50, 20],
              "circle-stroke-color": ["step", ["get", "point_count"], "rgba(74,70,65,.30)", 15, "rgba(155,68,52,.38)", 50, "rgba(122,32,72,.48)"],
              "circle-stroke-width": ["step", ["get", "point_count"], 1.2, 15, 1.7, 50, 2.2],
              "circle-opacity": 0.9,
              "circle-blur": 0.02,
            },
          })
          instance.addLayer({ id: "ondo-points", type: "circle", source: "ondo-directory", filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "curatedSignal"], false]], paint: { "circle-color": "#716d67", "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 2.6, 15, 4.2], "circle-opacity": 0.66, "circle-stroke-width": 0 } })
          const unshiftedPulseFilter: ExpressionSpecification = ["all", ["!=", ["get", "pulseRank"], 3], ["!=", ["get", "pulseRank"], 2]]
          const risingPulseFilter: ExpressionSpecification = ["==", ["get", "pulseRank"], 3]
          const warmingPulseFilter: ExpressionSpecification = ["==", ["get", "pulseRank"], 2]
          const risingTranslate: ExpressionSpecification = ["interpolate", ["linear"], ["zoom"], 9, ["literal", [-20, 18]], 12, ["literal", [-20, 18]], 13, ["literal", [0, 0]]]
          const warmingTranslate: ExpressionSpecification = ["interpolate", ["linear"], ["zoom"], 9, ["literal", [-8, -10]], 12, ["literal", [-8, -10]], 13, ["literal", [0, 0]]]
          const pulseOffsetForRank = (rank: number, zoom: number) => {
            const scale = zoom <= 12 ? 1 : Math.max(0, 13 - zoom)
            if (rank === 3) return { x: -20 * scale, y: 18 * scale }
            if (rank === 2) return { x: -8 * scale, y: -10 * scale }
            return { x: 0, y: 0 }
          }
          const mapAnchor: ExpressionSpecification = ["==", ["get", "mapAnchor"], true]
          const progressivePointOpacity: ExpressionSpecification = [
            "interpolate", ["linear"], ["zoom"],
            11.8, ["case", mapAnchor, 0.98, 0],
            12.35, ["case", mapAnchor, 0.98, 0.9],
          ]
          const pulsePointPaint: CircleLayerSpecification["paint"] = { "circle-color": PULSE_LEVEL_EXPRESSION, "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 4.5, 15, 6.2], "circle-opacity": progressivePointOpacity, "circle-stroke-width": 0, "circle-blur": 0.08 }
          pulsePointPaint["circle-radius"] = [
            "interpolate", ["linear"], ["get", "pulseRank"],
            0, 3.5,
            1, 4,
            2, 5,
            3, 6.5,
            4, 8,
            5, 10,
          ]
          const pulseHaloOpacity: ExpressionSpecification = [
            "interpolate", ["linear"], ["get", "pulseRank"],
            0, 0.06,
            1, 0.11,
            2, 0.18,
            3, 0.26,
            4, 0.36,
            5, 0.46,
          ]
          const progressiveHaloOpacity: ExpressionSpecification = [
            "interpolate", ["linear"], ["zoom"],
            11.8, ["case", mapAnchor, pulseHaloOpacity, 0],
            12.35, pulseHaloOpacity,
          ]
          const progressiveHitRadius: ExpressionSpecification = [
            "step", ["zoom"], ["case", mapAnchor, 22, 0],
            12.35, 22,
          ]
          const pulseHaloPaint: CircleLayerSpecification["paint"] = {
            "circle-color": PULSE_LEVEL_EXPRESSION,
            "circle-radius": [
              "interpolate", ["linear"], ["get", "pulseRank"],
              0, 11,
              1, 15,
              2, 22,
              3, 31,
              4, 43,
              5, 56,
            ],
            "circle-blur": 0.84,
            "circle-opacity": progressiveHaloOpacity,
            "circle-stroke-width": 0,
          }
          instance.addLayer({
            id: "ondo-temperature-field",
            type: "heatmap",
            source: "ondo-pulse",
            minzoom: 8,
            maxzoom: 15,
            paint: {
              "heatmap-weight": ["interpolate", ["linear"], ["get", "pulseRank"], 0, 0, 1, 0.18, 2, 0.36, 3, 0.6, 4, 0.84, 5, 1],
              "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 8, 0.9, 12, 1.3, 15, 0.8],
              "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 8, 34, 12, 60, 15, 78],
              "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0.5, 12, 0.68, 15, 0.32],
              "heatmap-color": PULSE_HEAT_COLOR,
            },
          })
          instance.addLayer({ id: "ondo-pulse-halo", type: "circle", source: "ondo-pulse", filter: unshiftedPulseFilter, paint: pulseHaloPaint })
          instance.addLayer({ id: "ondo-pulse-halo-rising", type: "circle", source: "ondo-pulse", filter: risingPulseFilter, paint: { ...pulseHaloPaint, "circle-translate": risingTranslate, "circle-translate-anchor": "viewport" } })
          instance.addLayer({ id: "ondo-pulse-halo-warming", type: "circle", source: "ondo-pulse", filter: warmingPulseFilter, paint: { ...pulseHaloPaint, "circle-translate": warmingTranslate, "circle-translate-anchor": "viewport" } })
          instance.addLayer({ id: "ondo-pulse-points", type: "circle", source: "ondo-pulse", filter: unshiftedPulseFilter, layout: { "circle-sort-key": ["get", "pulseRank"] }, paint: pulsePointPaint })
          instance.addLayer({ id: "ondo-pulse-points-rising", type: "circle", source: "ondo-pulse", filter: risingPulseFilter, layout: { "circle-sort-key": ["get", "pulseRank"] }, paint: { ...pulsePointPaint, "circle-translate": risingTranslate, "circle-translate-anchor": "viewport" } })
          instance.addLayer({ id: "ondo-pulse-points-warming", type: "circle", source: "ondo-pulse", filter: warmingPulseFilter, layout: { "circle-sort-key": ["get", "pulseRank"] }, paint: { ...pulsePointPaint, "circle-translate": warmingTranslate, "circle-translate-anchor": "viewport" } })
          instance.addLayer({ id: "ondo-pulse-hit", type: "circle", source: "ondo-pulse", filter: unshiftedPulseFilter, paint: { "circle-color": "rgba(0,0,0,0.01)", "circle-radius": progressiveHitRadius, "circle-stroke-width": 0 } })
          instance.addLayer({ id: "ondo-pulse-hit-rising", type: "circle", source: "ondo-pulse", filter: risingPulseFilter, paint: { "circle-color": "rgba(0,0,0,0.01)", "circle-radius": progressiveHitRadius, "circle-stroke-width": 0, "circle-translate": risingTranslate, "circle-translate-anchor": "viewport" } })
          instance.addLayer({ id: "ondo-pulse-hit-warming", type: "circle", source: "ondo-pulse", filter: warmingPulseFilter, paint: { "circle-color": "rgba(0,0,0,0.01)", "circle-radius": progressiveHitRadius, "circle-stroke-width": 0, "circle-translate": warmingTranslate, "circle-translate-anchor": "viewport" } })
          const selectedUnshiftedPulseFilter: ExpressionSpecification = ["all", ["==", ["get", "selected"], true], unshiftedPulseFilter]
          const selectedRisingPulseFilter: ExpressionSpecification = ["all", ["==", ["get", "selected"], true], risingPulseFilter]
          const selectedWarmingPulseFilter: ExpressionSpecification = ["all", ["==", ["get", "selected"], true], warmingPulseFilter]
          const selectedPulseOuterPaint: CircleLayerSpecification["paint"] = { "circle-color": PULSE_LEVEL_EXPRESSION, "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 34, 15, 50], "circle-blur": 0.88, "circle-opacity": 0.18, "circle-stroke-width": 0 }
          const selectedPulsePaint: CircleLayerSpecification["paint"] = { "circle-color": PULSE_LEVEL_EXPRESSION, "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 8, 15, 10], "circle-opacity": 1, "circle-blur": 0.02, "circle-stroke-color": "#111111", "circle-stroke-width": 2.2, "circle-stroke-opacity": 1 }
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
          instance.addLayer({ id: "ondo-editorial-selected-halo", type: "circle", source: "ondo-editorial-places", filter: ["==", ["get", "selected"], true], paint: { "circle-color": "#171717", "circle-radius": 19, "circle-opacity": 0.12, "circle-stroke-width": 0 } })
          instance.addLayer({ id: "ondo-editorial-points", type: "circle", source: "ondo-editorial-places", paint: { "circle-color": ["case", ["==", ["get", "selected"], true], "#171717", "#ffffff"], "circle-radius": ["case", ["==", ["get", "selected"], true], 7, 5], "circle-stroke-color": "#171717", "circle-stroke-width": 2, "circle-opacity": 0.98 } })
          instance.addLayer({ id: "ondo-editorial-hit", type: "circle", source: "ondo-editorial-places", paint: { "circle-color": "rgba(0,0,0,0.01)", "circle-radius": 22, "circle-stroke-width": 0 } })
          instance.addLayer({ id: "ondo-editorial-selected-label", type: "symbol", source: "ondo-editorial-places", filter: ["==", ["get", "selected"], true], layout: { "text-field": ["get", "name"], "text-font": ["Noto Sans Bold"], "text-size": 12, "text-offset": [0, 1.55], "text-anchor": "top", "text-allow-overlap": true }, paint: { "text-color": "#171717", "text-halo-color": "rgba(255,255,255,.94)", "text-halo-width": 2 } })

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
          if (reducedMotion) pulseHaloLayers.forEach((layerId) => instance.setPaintProperty(layerId, "circle-opacity", progressiveHaloOpacity))
          else {
            const startedAt = performance.now()
            const anchorBloom = (opacity: number): ExpressionSpecification => ["case", mapAnchor, opacity, 0]
            pulseHaloLayers.forEach((layerId) => instance.setPaintProperty(layerId, "circle-opacity", anchorBloom(0.46)))
            const animatePulse = (timestamp: number) => {
              if (disposed) return
              const progress = Math.min(1, (timestamp - startedAt) / duration)
              const eased = 1 - (1 - progress) ** 3
              pulseHaloLayers.forEach((layerId) => instance.setPaintProperty(layerId, "circle-opacity", anchorBloom(0.46 - eased * 0.26)))
              if (progress < 1) pulseAnimationFrame = window.requestAnimationFrame(animatePulse)
              else pulseHaloLayers.forEach((layerId) => instance.setPaintProperty(layerId, "circle-opacity", progressiveHaloOpacity))
            }
            pulseAnimationFrame = window.requestAnimationFrame(animatePulse)
          }

          const updatePulseMarkerFit = () => {
            if (disposed || !cityRootNode.current) return
            const root = cityRootNode.current
            const rootBox = root.getBoundingClientRect()
            const headerBox = root.querySelector<HTMLElement>("[data-testid='ondo-b-city-header']")?.getBoundingClientRect()
            const utilityBox = root.querySelector<HTMLElement>("[data-testid='ondo-b-map-utility-cluster']")?.getBoundingClientRect()
            const keyBox = root.querySelector<HTMLElement>("[data-testid='ondo-b-map-key']")?.getBoundingClientRect()
            const resultBox = root.querySelector<HTMLElement>("[data-testid='ondo-b-result-bar']")?.getBoundingClientRect()
            const overlayBoxes = [headerBox, utilityBox, keyBox, resultBox].filter((box): box is DOMRect => box != null)
            const pointIsReadable = (pointX: number, pointY: number) => {
              const clientX = rootBox.left + pointX
              const clientY = rootBox.top + pointY
              if (clientX < rootBox.left + 18 || clientX > rootBox.right - 18
                || clientY < rootBox.top + 18 || clientY > rootBox.bottom - 18) return false
              return !overlayBoxes.some((box) => clientX >= box.left - 10 && clientX <= box.right + 10
                && clientY >= box.top - 10 && clientY <= box.bottom + 10)
            }
            const detailSignalsVisible = instance.getZoom() >= 12.35
            const pulseFeatures = instance.querySourceFeatures("ondo-pulse")
              .filter((feature) => feature.geometry.type === "Point"
                && Number(feature.properties?.pulseScore ?? -1) >= 0
                && (detailSignalsVisible || feature.properties?.mapAnchor === true))
            const allInside = pulseFeatures.length > 0 && pulseFeatures.every((feature) => {
              if (feature.geometry.type !== "Point") return true
              const point = instance.project(feature.geometry.coordinates as [number, number])
              const zoom = instance.getZoom()
              const offset = pulseOffsetForRank(Number(feature.properties?.pulseRank ?? 0), zoom)
              return pointIsReadable(point.x + offset.x, point.y + offset.y)
            })
            const zoom = instance.getZoom()
            const clusterFeatures = instance.queryRenderedFeatures({ layers: ["ondo-clusters"] })
              .filter((feature) => feature.geometry.type === "Point")
            // ONDO temperature is intentionally the primary visual layer. An
            // anchor may overlap the edge of an official group, but the group
            // remains readable when MapLibre still renders its count feature.
            const clustersReadable = clusterFeatures.length > 0
            root.dataset.pulseMarkersReadable = String(allInside)
            root.dataset.pulseOfficialClustersReadable = String(clustersReadable)
          }
          instance.on("moveend", updatePulseMarkerFit)
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
        instance.on("click", "ondo-editorial-hit", (event: MapLayerMouseEvent) => {
          const place = editorialPlaceById(event.features?.[0]?.properties?.id)
          if (place) openEditorialPlaceDetail(place)
        })
        instance.on("mouseenter", "ondo-clusters", () => { instance.getCanvas().style.cursor = "pointer" })
        instance.on("mouseenter", "ondo-points", () => { instance.getCanvas().style.cursor = "pointer" })
        pulseInteractiveLayers.forEach((layerId) => instance.on("mouseenter", layerId, () => { instance.getCanvas().style.cursor = "pointer" }))
        instance.on("mouseenter", "ondo-editorial-hit", () => { instance.getCanvas().style.cursor = "pointer" })
        instance.on("mouseleave", "ondo-clusters", () => { instance.getCanvas().style.cursor = "" })
        instance.on("mouseleave", "ondo-points", () => { instance.getCanvas().style.cursor = "" })
        pulseInteractiveLayers.forEach((layerId) => instance.on("mouseleave", layerId, () => { instance.getCanvas().style.cursor = "" }))
        instance.on("mouseleave", "ondo-editorial-hit", () => { instance.getCanvas().style.cursor = "" })
        if (filteredMapRef.current) focusFilteredVenues(instance, venues)
        const finishFirstPaint = () => {
          if (disposed || failed) return
          if (loadDeadline != null) window.clearTimeout(loadDeadline)
          setMapState("ready")
          if (retryFocusPending.current) {
            retryFocusPending.current = false
            window.setTimeout(() => document.querySelector<HTMLElement>("[data-testid='ondo-b-view-toggle']")?.focus({ preventScroll: true }), 0)
          }
        }
        instance.once("render", () => {
          pulseAnimationFrame = window.requestAnimationFrame(finishFirstPaint)
        })
        instance.triggerRepaint()
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
    const map = mapRef.current
    if (!map || !map.getLayer("ondo-night-dim")) return
    const color = after19Active ? AFTER19_PULSE_LEVEL_EXPRESSION : PULSE_LEVEL_EXPRESSION
    map.setPaintProperty("ondo-night-dim", "fill-opacity", after19Active ? (city === "jeju" ? 0.46 : 0.52) : 0)
    if (map.getLayer("ondo-temperature-field")) {
      map.setPaintProperty("ondo-temperature-field", "heatmap-color", after19Active ? AFTER19_HEAT_COLOR : PULSE_HEAT_COLOR)
      map.setPaintProperty("ondo-temperature-field", "heatmap-opacity", after19Active
        ? ["interpolate", ["linear"], ["zoom"], 8, 0.62, 12, 0.82, 15, 0.46]
        : ["interpolate", ["linear"], ["zoom"], 8, 0.5, 12, 0.68, 15, 0.32])
    }
    for (const layerId of [
      "ondo-pulse-halo", "ondo-pulse-halo-rising", "ondo-pulse-halo-warming",
      "ondo-pulse-points", "ondo-pulse-points-rising", "ondo-pulse-points-warming",
      "ondo-selected-pulse-outer", "ondo-selected-pulse-outer-rising", "ondo-selected-pulse-outer-warming",
      "ondo-selected-pulse", "ondo-selected-pulse-rising", "ondo-selected-pulse-warming",
    ]) {
      if (map.getLayer(layerId)) map.setPaintProperty(layerId, "circle-color", color)
    }
    if (map.getLayer("ondo-clusters")) {
      map.setPaintProperty("ondo-clusters", "circle-color", after19Active ? "rgba(23,21,29,.82)" : "rgba(255,255,255,.34)")
      map.setPaintProperty("ondo-clusters", "circle-stroke-color", after19Active
        ? ["step", ["get", "point_count"], "rgba(255,255,255,.28)", 15, "rgba(255,114,184,.48)", 50, "rgba(255,114,184,.7)"]
        : ["step", ["get", "point_count"], "rgba(74,70,65,.30)", 15, "rgba(155,68,52,.38)", 50, "rgba(122,32,72,.48)"])
    }
    if (map.getLayer("ondo-points")) map.setPaintProperty("ondo-points", "circle-color", after19Active ? "#a7a1af" : "#716d67")
    if (map.getLayer("ondo-editorial-selected-halo")) {
      map.setPaintProperty("ondo-editorial-selected-halo", "circle-color", after19Active ? "#ff72b8" : "#171717")
      map.setPaintProperty("ondo-editorial-selected-halo", "circle-opacity", after19Active ? 0.24 : 0.12)
    }
    if (map.getLayer("ondo-editorial-points")) {
      map.setPaintProperty("ondo-editorial-points", "circle-color", after19Active
        ? ["case", ["==", ["get", "selected"], true], "#ff72b8", "#211d29"]
        : ["case", ["==", ["get", "selected"], true], "#171717", "#ffffff"])
      map.setPaintProperty("ondo-editorial-points", "circle-stroke-color", after19Active ? "#ffd1e8" : "#171717")
    }
    if (map.getLayer("ondo-editorial-selected-label")) {
      map.setPaintProperty("ondo-editorial-selected-label", "text-color", after19Active ? "#fff7fb" : "#171717")
      map.setPaintProperty("ondo-editorial-selected-label", "text-halo-color", after19Active ? "rgba(20,14,24,.88)" : "rgba(255,255,255,.94)")
      map.setPaintProperty("ondo-editorial-selected-label", "text-halo-width", after19Active ? 1 : 2)
    }
    for (const layerId of ["ondo-selected-pulse-capsule", "ondo-selected-pulse-capsule-rising", "ondo-selected-pulse-capsule-warming"]) {
      if (!map.getLayer(layerId)) continue
      map.setPaintProperty(layerId, "text-color", after19Active ? "#fff7fb" : "#29231f")
      map.setPaintProperty(layerId, "text-halo-color", after19Active ? "rgba(20,14,24,.72)" : "rgba(255,253,249,.4)")
      map.setPaintProperty(layerId, "text-halo-width", after19Active ? 1 : 0.5)
    }
  }, [after19Active, city, mapState])

  useEffect(() => {
    const directorySource = mapRef.current?.getSource("ondo-directory") as GeoJSONSource | undefined
    const pulseSource = mapRef.current?.getSource("ondo-pulse") as GeoJSONSource | undefined
    if (directorySource) {
      void directorySource.setData(toFeatureCollection(venues, state.localPulseEvidenceByVenue, selectedVenueId))
      if (pulseSource) void pulseSource.setData(toPulseFeatureCollection(venues, state.localPulseEvidenceByVenue, locale, selectedVenueId))
      const filterSignature = `${city ?? "nation"}:${query.trim()}:${category}`
      const filterChanged = filterCameraSignatureRef.current !== filterSignature
      filterCameraSignatureRef.current = filterSignature
      if (filteredMap && filterChanged && !selectedVenueId) focusFilteredVenues(mapRef.current!, venues)
    }
  // `venues` can change while MapLibre is still loading (for example when a
  // user types a search immediately after entering a city). In that case the
  // source does not exist yet and this effect returns early. Re-run once the
  // map reaches `ready` so the source and camera always receive the current
  // filtered collection instead of the load callback's initial closure.
  }, [category, city, filteredMap, locale, mapState, query, selectedVenueId, state.localPulseEvidenceByVenue, venues])

  useEffect(() => {
    const editorialSource = mapRef.current?.getSource("ondo-editorial-places") as GeoJSONSource | undefined
    if (editorialSource) void editorialSource.setData(toEditorialPlaceFeatureCollection(locale, selectedEditorialPlaceId, city === "jeju"))
  }, [city, locale, selectedEditorialPlaceId])

  useEffect(() => {
    userLocationRef.current = userLocation
    const source = mapRef.current?.getSource("ondo-user-location") as GeoJSONSource | undefined
    if (source) void source.setData(toUserLocationFeatureCollection(userLocation))
  }, [userLocation])

  function chooseCity(next: CityId) {
    const commitSelection = () => {
      const nextCategory: BDiscoveryCategory = after19Active && next !== "jeju" ? "night" : "all"
      enterBDiscoveryCity(next)
      setCity(next)
      setView("map")
      setQuery("")
      setCategory(nextCategory)
      replaceBDiscoveryCityContext({ city: next, view: "map", query: "", category: nextCategory })
    }
    const transitionDocument = document as AtlasViewTransitionDocument
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches
    const compactViewport = window.innerWidth <= 430 || window.innerHeight <= 568
    // Native document transitions temporarily own the hit-testing layer in
    // Chromium. Keep compact layouts immediately interactive even when a
    // desktop/fine-pointer browser is resized to a phone-sized viewport.
    if (!reducedMotion && !coarsePointer && !compactViewport && transitionDocument.startViewTransition) {
      const transition = transitionDocument.startViewTransition(commitSelection)
      const finishBeforeInteraction = () => transition.skipTransition?.()
      const cleanup = () => {
        window.removeEventListener("pointerdown", finishBeforeInteraction, { capture: true })
        window.removeEventListener("keydown", finishBeforeInteraction, { capture: true })
        window.removeEventListener("popstate", finishBeforeInteraction, { capture: true })
      }
      window.addEventListener("pointerdown", finishBeforeInteraction, { capture: true, once: true })
      window.addEventListener("keydown", finishBeforeInteraction, { capture: true, once: true })
      window.addEventListener("popstate", finishBeforeInteraction, { capture: true, once: true })
      void transition.finished
        .catch(() => undefined)
        .finally(cleanup)
      return
    }
    commitSelection()
  }

  function selectVenue(venue: CanonicalMapVenue) {
    replaceBDiscoveryCityContext({ city: venue.cityId, view, query, category, focus: { kind: "venue", venueId: venue.id } })
    openBDiscoveryVenue(venue.id)
    if (!actions.recordRecentVenue(venue.id)) actions.notify(copy.recentSaveFailed)
    actions.setSurface({ kind: "venue", venueId: venue.id })
    mapRef.current?.easeTo({ center: [venue.longitude, venue.latitude], zoom: 15 })
  }

  function focusEditorialPlace(place: EditorialPlaceB) {
    if (city !== "jeju") return
    replaceBDiscoveryCityContext({ city: "jeju", view: "map", query: "", category: "all", focus: { kind: "editorial-place", editorialPlaceId: place.id } })
    if (!openBDiscoveryEditorialPlace(place.id)) return
    if (!actions.recordRecentEditorialPlace(place.id)) actions.notify(copy.recentSaveFailed)
    setSelectedEditorialPlaceId(place.id)
    actions.setSurface({ kind: "map" })
    setEditorialOpen(false)
    mapRef.current?.easeTo({ center: [place.location.longitude, place.location.latitude], zoom: 15 })
  }

  function openEditorialPlaceDetail(place: EditorialPlaceB) {
    focusEditorialPlace(place)
    if (!openBDiscoveryEditorialDetail(place.id)) return
    actions.setSurface({ kind: "editorial_place", editorialPlaceId: place.id })
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
    const requestId = locationRequestRef.current + 1
    locationRequestRef.current = requestId
    const requestedCity = city
    if (!navigator.geolocation) {
      userLocationRef.current = null
      setUserLocation(null)
      setLocationState("unsupported")
      return
    }
    setLocationState("locating")
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      if (locationRequestRef.current !== requestId || currentCityRef.current !== requestedCity) return
      const nextLocation = { longitude: coords.longitude, latitude: coords.latitude }
      userLocationRef.current = nextLocation
      setUserLocation(nextLocation)
      setLocationState("ready")
      mapRef.current?.easeTo({ center: [nextLocation.longitude, nextLocation.latitude], zoom: 14 })
    }, () => {
      if (locationRequestRef.current !== requestId || currentCityRef.current !== requestedCity) return
      userLocationRef.current = null
      setUserLocation(null)
      setLocationState("denied")
    }, { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 })
  }

  if (!city) return (
    <div className={styles.compatRoot} data-testid="ondo-map-entry">
      <section className={styles.root} data-testid="ondo-b-map-entry" data-hydrated={state.hydrated ? "true" : "false"}>
        <header className={styles.header}>
          <div className={styles.brand}><OndoBrandLockupB size="compact" /><small>{copy.tagline}</small></div>
          <button type="button" className={styles.language} aria-label={NEXT_LOCALE_ACCESSIBLE_LABEL[locale]} title={NEXT_LOCALE_ACCESSIBLE_LABEL[locale]} data-language-target={NEXT_LOCALE[locale]} onClick={() => actions.setLocale(NEXT_LOCALE[locale])}><Languages size={16} aria-hidden="true" />{NEXT_LOCALE_LABEL[locale]}</button>
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
        data-hydrated={state.hydrated ? "true" : "false"}
        data-city={city}
        data-directory-source={city === "jeju" ? undefined : SOURCE_ID}
        data-source-date={city === "jeju" ? undefined : SOURCE_DATE}
        data-city-record-count={city === "jeju" ? undefined : MAP_VENUES.filter((venue) => venue.cityId === city).length}
        data-editorial-point-count={city === "jeju" ? JEJU_EDITORIAL_PLACES.length : undefined}
        data-result-count={venues.length}
        data-map-state={mapState}
        data-map-attempt={retryToken + 1}
        data-connectivity={online ? "online" : "offline"}
        data-location-state={locationState}
        data-user-location={userLocation ? "present" : "absent"}
        data-cluster-grammar={city === "jeju" ? undefined : "official-record-count"}
        data-pulse-map-grammar={city === "jeju" ? undefined : "aura-over-official-groups"}
        data-pulse-visual-grammar={city === "jeju" ? undefined : "aura-scale-selection-label"}
        data-pulse-motion={city === "jeju" ? undefined : "one-shot-bloom-reduced-safe"}
        data-selected-pulse-grammar={city === "jeju" ? undefined : "one-shot-halo-place-capsule"}
        data-curated-pulse-count={city === "jeju" ? undefined : curatedPulseVenues.length}
        data-pulse-map-anchor-count={city === "jeju" ? undefined : Math.min(8, curatedPulseVenues.length)}
        data-layout-mode={mapLayoutMode}
        data-requested-view={view}
        data-effective-view={effectiveView}
        data-map-root-block-size={mapRootBlockSize.toFixed(1)}
        data-selected-venue-id={selectedVenueId ?? "none"}
        data-selected-editorial-place-id={selectedEditorialPlaceId ?? "none"}
        data-after19-active={after19Active ? "true" : "false"}
      >
        <p id="ondo-b-map-instruction" className={styles.srOnly} aria-hidden={editorialOpen ? true : undefined}>{city === "jeju" ? copy.editorialMapA11y : copy.mapA11y}</p>
        <header className={styles.cityHeader} data-testid="ondo-b-city-header">
          <div className={styles.topline}>
            <button type="button" className={styles.back} data-testid="ondo-b-city-back" aria-label={copy.back} onClick={() => { mapRef.current?.remove(); mapRef.current = null; if (!goBackFromBDiscovery("city")) setCity(null) }}><ArrowLeft size={18} /><span>{copy.back}</span></button>
            <div className={styles.cityTitle}><h1>{CITY[city].label[locale]}</h1><small className={styles.srOnly} data-testid="ondo-b-pulse-city-status" data-pulse-city-status={city === "jeju" ? "editorial-growing" : PULSE_CITY_STATUS[city]}>{cityPulseStatus(city, locale)}</small></div>
            <button type="button" className={styles.language} data-testid="ondo-b-language" aria-label={NEXT_LOCALE_ACCESSIBLE_LABEL[locale]} title={NEXT_LOCALE_ACCESSIBLE_LABEL[locale]} data-language-target={NEXT_LOCALE[locale]} onClick={() => actions.setLocale(NEXT_LOCALE[locale])}><Languages size={16} aria-hidden="true" />{NEXT_LOCALE_LABEL[locale]}</button>
          </div>
          {city !== "jeju" ? <>
            <div className={styles.search} role="search" data-testid="ondo-b-search-shell"><Search size={18} /><input data-testid="ondo-b-search" aria-label={copy.search} value={query} maxLength={SEARCH_MAX_LENGTH} onChange={(event) => { const nextQuery = event.target.value.slice(0, SEARCH_MAX_LENGTH); setQuery(nextQuery); updateCityContext({ query: nextQuery }) }} placeholder={copy.search} />{query ? <button type="button" onClick={() => { setQuery(""); updateCityContext({ query: "" }) }} aria-label={MAP_UI[locale].clearSearch}><X size={16} /></button> : null}</div>
            <div className={styles.rail} aria-label={copy.filterLabel} data-testid="ondo-b-category-rail">
              {categoryRailItems.map((item) => <button key={item} type="button" aria-label={CATEGORY[item][locale]} aria-pressed={category === item} onClick={() => { const nextCategory = after19Active ? "night" : item; setCategory(nextCategory); updateCityContext({ category: nextCategory }) }}>{mapLayoutMode === "ultra-short" ? CATEGORY[item].compact[locale] : CATEGORY[item][locale]}</button>)}
            </div>
          </> : null}
        </header>

        <div ref={mapNode} className={styles.map} data-testid="maplibre-map" role="region" aria-label={city === "jeju" ? MAP_UI[locale].editorialRegion : MAP_UI[locale].mapRegion} aria-describedby="ondo-b-map-instruction ondo-b-pulse-marker-accessible-detail ondo-b-result-truth" hidden={effectiveView !== "map"} aria-hidden={editorialOpen || effectiveView !== "map" ? true : undefined} inert={editorialOpen ? true : undefined} data-editorial-inert={editorialOpen ? "true" : "false"} />
        <ul id="ondo-b-pulse-marker-accessible-detail" className={styles.srOnly} data-testid="ondo-b-pulse-marker-accessible-detail" aria-hidden={editorialOpen ? true : undefined}>
          {curatedPulseVenues.map(({ venue, pulse }) => (
            <li key={venue.id}>
              {`${venueDisplayName(venue.name.ko, locale)} · ${TEMPERATURE_NAME[locale]} ${pulse.score} · ${pulseLevelLabel(pulse.level, locale)} · ${MAP_UI[locale].freshness} ${pulse.freshness} · ${MAP_UI[locale].confidence} ${pulse.confidence}`}
            </li>
          ))}
        </ul>
        {!editorialOpen && effectiveView === "map" && (mapState === "idle" || mapState === "loading") ? <p className={styles.mapLoading} role="status" data-testid="ondo-b-map-loading">{city === "jeju" ? copy.editorialMapLoading : copy.mapLoading}</p> : null}

        <div className={styles.mapUtilityCluster} data-testid="ondo-b-map-utility-cluster" data-editorial-open={editorialOpen ? "true" : "false"}>
          {city !== "jeju" && effectiveView === "map" && mapState !== "error" ? (
            <details
              className={styles.locationMessage}
              data-testid="ondo-b-location-message"
              name="ondo-map-disclosure"
              data-message-kind={!online ? "offline" : locationState === "idle" ? "disclosure" : "status"}
            >
              <summary aria-label={locationSummary}><Info size={18} aria-hidden="true" /><span>{locationSummary}</span><ChevronRight size={16} aria-hidden="true" /></summary>
              <p id="ondo-b-location-message" role={!online || locationState !== "idle" ? "status" : undefined} data-testid="ondo-b-location-details">{locationMessage}</p>
            </details>
          ) : null}
          {city !== "jeju" && effectiveView === "map" && mapState !== "error" ? <button type="button" className={styles.locate} data-testid="ondo-b-locate" data-location-state={locationState} aria-describedby="ondo-b-location-message" aria-label={locationState === "denied" ? copy.retryLocation : copy.locate} onClick={locateUser}><LocateFixed size={19} /></button> : null}
          <GlobalAfter19B
            locale={locale}
            context={{
              cityId: city,
              cityLabel: CITY[city].label[locale],
              venueId: selectedVenueId,
              venueLabel: selectedVenue ? venueDisplayName(selectedVenue.name.ko, locale) : null,
            }}
            onActiveChange={setAfter19Active}
          />
          {city === "seoul" || city === "jeju" ? <JapanFirstDiscoveryB locale={locale} city={city} presentation={effectiveView === "list" || mapState === "error" ? "list" : "map"} onOpenChange={setEditorialOpen} onSelectEditorialPlace={city === "jeju" ? focusEditorialPlace : undefined} /> : null}
        </div>

        <div className={styles.mapChrome} data-testid="ondo-b-map-chrome">
          {city === "jeju" ? <details className={styles.editorialPlaceList} data-testid="ondo-b-editorial-place-list">
            <summary data-editorial-place-opener={selectedEditorialPlaceId ?? "none"}><MapPin size={17} aria-hidden="true" /><span>{copy.jejuStatus}</span><ChevronRight size={16} aria-hidden="true" /></summary>
            <div>{JEJU_EDITORIAL_PLACES.map((place) => <button key={place.id} type="button" aria-current={selectedEditorialPlaceId === place.id ? "location" : undefined} onClick={() => openEditorialPlaceDetail(place)}><span>{place.name[locale]}</span><ChevronRight size={15} aria-hidden="true" /></button>)}</div>
          </details> : null}
          <div
            className={styles.resultBar}
            data-testid="ondo-b-result-bar"
            data-chrome-role="view-action"
            data-effective-view={effectiveView}
            data-result-count={city === "jeju" ? undefined : venues.length}
            data-result-source={city === "jeju" ? "editorial" : SOURCE_ID}
          >
            <span id="ondo-b-result-truth" className={styles.resultTruth} data-testid="ondo-b-result-truth" role="status" aria-live="polite" aria-atomic="true"><b>{city === "jeju" ? copy.jejuMapTruth : resultCount(venues.length, locale)}</b><small>{city === "jeju" ? copy.jejuTruth : `${copy.source} · ${copy.categoryBasis}`}</small></span>
            {city === "jeju" ? null : mapLayoutMode === "ultra-short" ? (
              <span className={styles.forcedListLabel} data-testid="ondo-b-effective-view-label" aria-label={`${copy.list} · ${MAP_UI[locale].shortList}`}><List size={17} /><span>{copy.list}</span></span>
            ) : (
              <button
                type="button"
                aria-pressed={effectiveView === "list"}
                aria-describedby="ondo-b-result-truth"
                onClick={() => {
                  const nextView = view === "map" ? "list" : "map"
                  setView(nextView)
                  updateCityContext({ view: nextView })
                }}
                data-testid="ondo-b-view-toggle"
              >
                {effectiveView === "map" ? <List size={17} /> : <MapIcon size={17} />}
                <span className={styles.viewActionLabel}>{effectiveView === "map" ? copy.list : copy.map}</span>
              </button>
            )}
          </div>

          {city !== "jeju" && effectiveView === "map" && mapState !== "error" ? (
            <aside className={styles.mapKey} data-testid="ondo-b-map-key" data-pulse-key-presentation="compact-gradient" aria-label={`${copy.mapKey}. ${copy.mapKeyBody} ${PULSE_DISCLOSURE[locale]}`}>
              <div className={styles.pulseScale} data-testid="ondo-b-pulse-scale" aria-hidden="true">
                <i /><b>{TEMPERATURE_NAME[locale]}</b><small>{MAP_UI[locale].pulseRange}</small>
              </div>
              <details className={styles.mapKeyDetails} data-testid="ondo-b-map-key-details" name="ondo-map-disclosure">
                <summary aria-label={copy.mapKeyDetails}><span>{copy.mapKeyDetails}</span><ChevronRight size={16} /></summary>
                <div className={styles.mapKeyDetailsBody}>
                  <div className={styles.pulseLegend} data-testid="ondo-b-pulse-legend" aria-label={MAP_UI[locale].pulseLegend}>
                    {(["peak", "hot", "rising", "warming", "low", "limited"] as const).map((level) => <span key={level} data-level={level}><i />{pulseLevelLabel(level, locale)}</span>)}
                  </div>
                  <small>{copy.mapKeyBody}</small>
                  <small data-testid="ondo-b-pulse-composition-disclosure">{PULSE_COMPOSITION_DISCLOSURE[locale]}</small>
                  <details className={styles.methodologyDisclosure} data-testid="ondo-b-pulse-methodology">
                    <summary>{copy.methodology}<ChevronRight size={15} /></summary>
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
                            data-venue-id={venue.id}
                            data-temperature-score={pulse.score}
                            data-level={pulse.level}
                            data-pulse-place-priority={pulse.level}
                            aria-label={`${venueDisplayName(venue.name.ko, locale)} · ${TEMPERATURE_NAME[locale]} ${pulse.score} · ${pulseLevelLabel(pulse.level, locale)} · ${MAP_UI[locale].freshness} ${pulse.freshness} · ${MAP_UI[locale].confidence} ${pulse.confidence}`}
                            onClick={() => selectVenue(venue)}
                          >
                            <span>{venueDisplayName(venue.name.ko, locale)}</span>
                            <b>{pulse.score} · {pulseLevelLabel(pulse.level, locale)}</b>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              </details>
            </aside>
          ) : null}
          {effectiveView === "map" && mapState !== "error" ? (
            <footer className={styles.attribution} data-testid="ondo-b-attribution" data-attribution-presentation="compact-legal" aria-label={MAP_UI[locale].mapAttribution}>
              <details className={styles.creditDetails} data-testid="ondo-b-map-credit-details" name="ondo-map-disclosure">
                <summary aria-label={copy.mapCredits}><span>{copy.mapCredits}</span><Copyright size={16} /></summary>
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
            <span className={styles.srOnly} data-testid="ondo-b-pulse-disclosure">{PULSE_DISCLOSURE[locale]}</span>
            <VenueList venues={venues} locale={locale} localPulseEvidenceByVenue={state.localPulseEvidenceByVenue} selectedVenueId={selectedVenueId} visibleCount={visibleCount} categoryLocked={after19Active} onClear={() => { const nextCategory = after19Active ? "night" : "all"; setQuery(""); setCategory(nextCategory); updateCityContext({ query: "", category: nextCategory }) }} onMore={() => setVisibleCount((count) => Math.min(venues.length, count + 30))} onSelect={selectVenue} />
          </div>
        ) : null}
        {selectedVenue && selectedPulse ? <span className={styles.srOnly} role="status" data-testid="ondo-b-selected-marker-status">{venueDisplayName(selectedVenue.name.ko, locale)} · {selectedPulse.score == null ? `${TEMPERATURE_NAME[locale]} · ${pulseLevelLabel(selectedPulse.level, locale)}` : `${TEMPERATURE_NAME[locale]} ${selectedPulse.score} · ${pulseLevelLabel(selectedPulse.level, locale)}`}</span> : null}
        {userLocation ? <span className={styles.srOnly} data-testid="ondo-b-user-location-marker" data-longitude={userLocation.longitude} data-latitude={userLocation.latitude}>{copy.locationReady}</span> : null}
      </section>
    </div>
  )
}
