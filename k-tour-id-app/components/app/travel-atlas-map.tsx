"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  BadgeCheck,
  Bell,
  ChevronDown,
  ChevronRight,
  Footprints,
  Gift,
  Landmark,
  Layers3,
  List,
  LocateFixed,
  MapPinned,
  Navigation,
  Route,
  Search,
  ShoppingBag,
  Sparkles,
  TrainFront,
  Utensils,
  UsersRound,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { LangToggle, Logo } from "@/components/app/shell"
import { COMMERCIAL_SERVICES } from "@/lib/commercial-services"
import { credentialDaysRemaining, isCredentialUsable } from "@/lib/credential-status"
import { formatWon } from "@/lib/format"
import { useLang } from "@/lib/i18n/lang-provider"
import { distanceKm, pointProximityLabel, useNearbyLocation } from "@/lib/location/location-provider"
import { ACTIVITIES } from "@/lib/mock-data"
import { MARKETPLACE_ITEMS, PERSONA_CONFIG } from "@/lib/catalog"
import { useApp } from "@/lib/store/app-provider"
import type { UserType } from "@/lib/types"
import { cn } from "@/lib/utils"

type MapLayer = "nearby" | "experience" | "food" | "mobility" | "essentials" | "together" | "benefit"
type PointLayer = Exclude<MapLayer, "nearby" | "benefit">
type PointKind = "place" | "marketplace" | "partner" | "activity"
type ContextBranch = "mobility" | "food" | null

interface TravelMapPoint {
  id: string
  kind: PointKind
  layer: PointLayer
  title: string
  subtitle: string
  description: string
  image?: string
  href: string
  geo: { latitude: number; longitude: number }
  timing: string
  priceLabel: string
  benefitLabel?: string
  eligible: boolean
  sourceLabel: string
}

const LAYERS: Array<{ id: MapLayer; ko: string; en: string; icon: LucideIcon }> = [
  { id: "nearby", ko: "지금 주변", en: "Around me", icon: MapPinned },
  { id: "experience", ko: "할 거리", en: "Things to do", icon: Landmark },
  { id: "food", ko: "먹기", en: "Eat", icon: Utensils },
  { id: "mobility", ko: "이동", en: "Move", icon: TrainFront },
  { id: "essentials", ko: "필수품", en: "Essentials", icon: ShoppingBag },
  { id: "together", ko: "동행", en: "Together", icon: UsersRound },
  { id: "benefit", ko: "내 혜택", en: "My benefits", icon: Gift },
]

const POINT_ICONS: Record<PointLayer, LucideIcon> = {
  experience: Landmark,
  food: Utensils,
  mobility: TrainFront,
  essentials: ShoppingBag,
  together: UsersRound,
}

const SEOUL_BOUNDS = {
  minLatitude: 37.26,
  maxLatitude: 37.60,
  minLongitude: 126.91,
  maxLongitude: 127.04,
}

const DESTINATION_PLACES = [
  {
    id: "place-bukchon", geo: { latitude: 37.5826, longitude: 126.983 },
    title: { ko: "북촌 한옥마을", en: "Bukchon Hanok Village" },
    subtitle: { ko: "서울 종로구 · 골목과 공예", en: "Jongno, Seoul · alleys and craft" },
    description: { ko: "한옥 골목과 작은 공방을 따라 천천히 걷기 좋은 여행 시작점이에요.", en: "A calm starting point for hanok alleys, small studios and local stories." },
  },
  {
    id: "place-hongdae", geo: { latitude: 37.557, longitude: 126.924 },
    title: { ko: "홍대·연남", en: "Hongdae · Yeonnam" },
    subtitle: { ko: "서울 마포구 · 음악과 동네 산책", en: "Mapo, Seoul · music and neighborhood walks" },
    description: { ko: "작은 공연, 카페, 언어교환과 늦은 식사가 한 동선에 이어지는 지역이에요.", en: "A district where small shows, cafés, language exchange and late meals connect naturally." },
  },
  {
    id: "place-hangang", geo: { latitude: 37.528, longitude: 126.934 },
    title: { ko: "여의도 한강공원", en: "Yeouido Hangang Park" },
    subtitle: { ko: "서울 영등포구 · 강변 피크닉", en: "Yeongdeungpo, Seoul · riverside picnic" },
    description: { ko: "걷기, 자전거, 피크닉과 소규모 액티비티가 강을 따라 연결되는 장소예요.", en: "A riverside place for walks, bikes, picnics and small group activities." },
  },
  {
    id: "place-namsan", geo: { latitude: 37.551, longitude: 126.988 },
    title: { ko: "남산", en: "Namsan" },
    subtitle: { ko: "서울 중구 · 산책과 야경", en: "Jung-gu, Seoul · walks and night views" },
    description: { ko: "도심의 길과 능선을 함께 읽으며 낮과 밤을 모두 즐길 수 있는 축이에요.", en: "An urban ridge connecting city walks, viewpoints and night scenery." },
  },
] as const

function pointLayerFromCategory(category: string): PointLayer {
  if (category === "food" || category === "delivery") return "food"
  if (category === "mobility") return "mobility"
  if (category === "shopping" || category === "convenience") return "essentials"
  return "experience"
}

function stableOffset(id: string) {
  return [...id].reduce((sum, character) => sum + character.charCodeAt(0), 0)
}

function projectPoint(point: Pick<TravelMapPoint, "id" | "geo">, index: number) {
  const longitudeRatio =
    (point.geo.longitude - SEOUL_BOUNDS.minLongitude) /
    (SEOUL_BOUNDS.maxLongitude - SEOUL_BOUNDS.minLongitude)
  const latitudeRatio =
    (SEOUL_BOUNDS.maxLatitude - point.geo.latitude) /
    (SEOUL_BOUNDS.maxLatitude - SEOUL_BOUNDS.minLatitude)
  const seed = stableOffset(point.id)
  const jitterX = ((seed % 7) - 3) * 0.7 + (index % 2 ? 0.7 : -0.7)
  const jitterY = (((seed >> 2) % 7) - 3) * 0.55
  return {
    x: Math.min(91, Math.max(8, 8 + longitudeRatio * 84 + jitterX)),
    y: Math.min(76, Math.max(22, 20 + latitudeRatio * 58 + jitterY)),
  }
}

function routeStyle(from: { x: number; y: number }, to: { x: number; y: number }) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.sqrt(dx * dx + dy * dy)
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)
  return {
    left: `${from.x}%`,
    top: `${from.y}%`,
    width: `${length}%`,
    transform: `rotate(${angle}deg)`,
  }
}

function pointsForPersona(
  userType: UserType,
  lang: "ko" | "en",
  currentName?: string,
): TravelMapPoint[] {
  const ko = lang === "ko"
  const marketplacePoints: TravelMapPoint[] = MARKETPLACE_ITEMS
    .filter((item) => item.eligibleUserTypes.includes(userType))
    .map((item) => ({
      id: item.id,
      kind: "marketplace",
      layer: pointLayerFromCategory(item.category),
      title: item.title[lang],
      subtitle: item.location[lang],
      description: item.description[lang],
      image: item.image,
      href: `/explore/${item.id}?from=map`,
      geo: item.geo ?? { latitude: 37.5665, longitude: 126.978 },
      timing: item.availability[lang],
      priceLabel: formatWon(item.priceKRW),
      benefitLabel: item.voucherId ? (ko ? "K-Tour 혜택 적용" : "K-Tour benefit") : undefined,
      eligible: true,
      sourceLabel: ko ? "지역·파트너 제공 정보 · 오늘 갱신" : "Local · partner information · updated today",
    }))

  const partnerPoints: TravelMapPoint[] = COMMERCIAL_SERVICES.map((service) => {
    const eligible = service.benefitEligibleUserTypes.includes(userType)
    const netPrice = Math.max(0, service.grossKRW - (eligible ? service.benefitKRW : 0))
    return {
      id: service.id,
      kind: "partner" as const,
      layer: pointLayerFromCategory(service.category),
      title: service.title[lang],
      subtitle: `${service.name[lang]} · ${service.context[lang]}`,
      description: service.description[lang],
      href: `/services/${service.id}`,
      geo: service.geo,
      timing: service.option[lang],
      priceLabel: formatWon(netPrice),
      benefitLabel: eligible ? service.benefit[lang] : undefined,
      eligible,
      sourceLabel: ko ? "파트너 연동 기준 · 10분 전 갱신" : "Partner connection reference · updated 10 min ago",
    }
  })

  const activityPoints: TravelMapPoint[] = ACTIVITIES
    .filter((activity) => activity.host !== currentName)
    .map((activity) => ({
    id: activity.id,
    kind: "activity" as const,
    layer: "together" as const,
    title: ko ? activity.title : activity.titleEn ?? activity.title,
    subtitle: `${ko ? activity.place : activity.placeEn ?? activity.place} · ${ko ? activity.time : activity.timeEn ?? activity.time}`,
    description: ko
      ? `${activity.host}님이 여는 액티비티예요. 참여가 확정된 사람끼리만 그룹 채팅이 열려요.`
      : `Hosted by ${activity.host}. Group chat opens only for confirmed participants.`,
    image: activity.image,
    href: `/connect?activity=${activity.id}`,
    geo: activity.geo ?? { latitude: 37.5665, longitude: 126.978 },
    timing: ko
      ? `${activity.languages.join("/")} · ${activity.joined}/${activity.capacity}명`
      : `${activity.languages.join("/")} · ${activity.joined}/${activity.capacity} joined`,
    priceLabel: activity.costKRW ? formatWon(activity.costKRW) : ko ? "무료" : "Free",
    eligible: true,
    sourceLabel: ko ? "K-Tour ID 확인 참여자 · 방금 갱신" : "K-Tour ID participants · updated just now",
    }))

  const placePoints: TravelMapPoint[] = DESTINATION_PLACES.map((place) => ({
    id: place.id,
    kind: "place",
    layer: "experience",
    title: place.title[lang],
    subtitle: place.subtitle[lang],
    description: place.description[lang],
    href: "/explore?focus=experience",
    geo: place.geo,
    timing: ko ? "지금 둘러보기 좋아요" : "Good to explore now",
    priceLabel: ko ? "여행 시작점" : "Trip starting point",
    eligible: true,
    sourceLabel: ko ? "K-Tour 지역 큐레이션 · 오늘 갱신" : "K-Tour local curation · updated today",
  }))

  return [...placePoints, ...marketplacePoints, ...partnerPoints, ...activityPoints]
}

export function TravelAtlasMap() {
  const { session, vouchers, openCopilot } = useApp()
  const { lang } = useLang()
  const { location, status: locationStatus, requestLocation } = useNearbyLocation()
  const ko = lang === "ko"
  const userType = session.userType ?? "foreigner"
  const persona = PERSONA_CONFIG[userType]
  const allPoints = useMemo(
    () => pointsForPersona(userType, lang, session.identity?.displayName),
    [lang, session.identity?.displayName, userType],
  )
  const [layer, setLayer] = useState<MapLayer>("nearby")
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState(persona.firstItemId)
  const [expanded, setExpanded] = useState(false)
  const [listMode, setListMode] = useState(false)
  const [heritageLayer, setHeritageLayer] = useState(true)
  const [routePreview, setRoutePreview] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [contextBranch, setContextBranch] = useState<ContextBranch>(null)

  const shownPoints = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const filtered = allPoints.filter((point) => {
      if (layer === "benefit" && !point.benefitLabel) return false
      if (layer === "nearby" && point.kind === "partner") return false
      if (layer !== "nearby" && layer !== "benefit" && point.layer !== layer) return false
      if (!normalizedQuery) return true
      return [point.title, point.subtitle, point.description]
        .some((value) => value.toLowerCase().includes(normalizedQuery))
    })
    const prioritized = [...filtered].sort((a, b) => {
      if (layer === "nearby" && locationStatus === "granted" && location) {
        return distanceKm(location, a.geo) - distanceKm(location, b.geo)
      }
      const aPersonaFirst = Number(a.id === persona.firstItemId)
      const bPersonaFirst = Number(b.id === persona.firstItemId)
      if (aPersonaFirst !== bPersonaFirst) return bPersonaFirst - aPersonaFirst
      if (a.eligible !== b.eligible) return Number(b.eligible) - Number(a.eligible)
      return Number(Boolean(b.benefitLabel)) - Number(Boolean(a.benefitLabel))
    })
    return prioritized.slice(0, query ? 16 : layer === "nearby" ? 11 : 14)
  }, [allPoints, layer, location, locationStatus, persona.firstItemId, query])

  const selected = shownPoints.length > 0
    ? shownPoints.find((point) => point.id === selectedId) ?? shownPoints[0]
    : undefined
  const selectedIndex = Math.max(0, shownPoints.findIndex((point) => point.id === selected?.id))
  const selectedPosition = selected ? projectPoint(selected, selectedIndex) : { x: 66, y: 48 }
  const locationInView = locationStatus === "granted" && location &&
    location.latitude >= SEOUL_BOUNDS.minLatitude && location.latitude <= SEOUL_BOUNDS.maxLatitude &&
    location.longitude >= SEOUL_BOUNDS.minLongitude && location.longitude <= SEOUL_BOUNDS.maxLongitude
  const originPosition = locationInView
    ? projectPoint({ id: "current-location", geo: location }, 0)
    : { x: 47, y: 57 }
  const remainingDays = credentialDaysRemaining(session.capsule)
  const credentialActive = isCredentialUsable(session.capsule)
  const selectedVoucher = selected?.kind === "marketplace"
    ? vouchers.find((voucher) => voucher.itemId === selected.id && voucher.status === "available")
    : undefined

  useEffect(() => {
    if (shownPoints.length === 0) return
    if (!shownPoints.some((point) => point.id === selectedId)) {
      setSelectedId(shownPoints[0].id)
      setExpanded(false)
      setRoutePreview(false)
      setContextBranch(null)
    }
  }, [selectedId, shownPoints])

  const selectLayer = (next: MapLayer) => {
    setLayer(next)
    setExpanded(false)
    setRoutePreview(false)
    setContextBranch(null)
  }

  const selectPoint = (point: TravelMapPoint) => {
    setSelectedId(point.id)
    setExpanded(false)
    setRoutePreview(false)
    setContextBranch(null)
  }

  const contextualPartners = contextBranch
    ? allPoints.filter((point) => point.kind === "partner" && point.layer === contextBranch).slice(0, 2)
    : []
  const selectedDistanceKm = selected && locationStatus === "granted" && location
    ? distanceKm(location, selected.geo)
    : null
  const routeSummary = selectedDistanceKm == null
    ? (ko ? "위치를 켜면 이동시간을 계산해요" : "Enable location to estimate travel time")
    : selectedDistanceKm <= 1.5
      ? (ko
        ? `도보 약 ${Math.max(3, Math.round((selectedDistanceKm / 4.5) * 30) * 2)}분 · ${selectedDistanceKm < 1 ? `${Math.max(100, Math.round(selectedDistanceKm * 10) * 100)}m` : `${selectedDistanceKm.toFixed(1)}km`}`
        : `About ${Math.max(3, Math.round((selectedDistanceKm / 4.5) * 30) * 2)} min walk · ${selectedDistanceKm < 1 ? `${Math.max(100, Math.round(selectedDistanceKm * 10) * 100)}m` : `${selectedDistanceKm.toFixed(1)}km`}`)
      : (ko ? `${selectedDistanceKm.toFixed(1)}km · 교통편 비교가 필요해요` : `${selectedDistanceKm.toFixed(1)}km · compare transport options`)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const contextId = params.get("contextId")
    const branch = params.get("branch")
    const focus = params.get("focus")
    if (focus && LAYERS.some((item) => item.id === focus)) setLayer(focus as MapLayer)
    if (!contextId || !allPoints.some((point) => point.id === contextId)) return
    if (!focus) setLayer("nearby")
    setSelectedId(contextId)
    setExpanded(true)
    setContextBranch(branch === "food" || branch === "mobility" ? branch : null)
  }, [allPoints])

  const mapContext = locationStatus === "granted" && location
    ? locationInView
      ? (ko ? `${location.areaKo} 주변` : `Near ${location.areaEn}`)
      : (ko ? `서울·수원 여행 · 현재 ${location.areaKo}` : `Seoul · Suwon trip · currently ${location.areaEn}`)
    : userType === "korean"
      ? (ko ? "서울·경기 여행" : "Seoul · Gyeonggi trip")
      : (ko ? "서울 여행" : "Seoul trip")

  return (
    <main className="relative h-[100dvh] overflow-hidden bg-[#e7e3d8]" data-experiment-variant="map-first-b">
      <div className="absolute inset-0 bottom-[calc(72px+env(safe-area-inset-bottom))] overflow-hidden">
        <div
          className={cn("atlas-map absolute inset-0", heritageLayer && "atlas-map-heritage")}
          aria-label={ko ? "서울·경기 여행 지도" : "Seoul and Gyeonggi travel map"}
        >
          <div className="atlas-fold atlas-fold-one" aria-hidden="true" />
          <div className="atlas-fold atlas-fold-two" aria-hidden="true" />
          <div className="atlas-river" aria-hidden="true"><span>{ko ? "한강" : "HAN RIVER"}</span></div>
          <div className="atlas-road atlas-road-one" aria-hidden="true" />
          <div className="atlas-road atlas-road-two" aria-hidden="true" />
          <div className="atlas-road atlas-road-three" aria-hidden="true" />
          {heritageLayer && (
            <>
              <div className="atlas-ridge atlas-ridge-one" aria-hidden="true" />
              <div className="atlas-ridge atlas-ridge-two" aria-hidden="true" />
              <div className="atlas-ridge atlas-ridge-three" aria-hidden="true" />
            </>
          )}
          <span className="atlas-place-label left-[58%] top-[33%]">북촌 · Bukchon</span>
          <span className="atlas-place-label left-[18%] top-[43%]">홍대 · Hongdae</span>
          <span className="atlas-place-label left-[66%] top-[58%]">남산 · Namsan</span>
          <span className="atlas-place-label left-[73%] top-[75%]">강남 · Gangnam</span>

          {!listMode && (
            <div
              className="absolute inset-0 transition-transform duration-300 ease-out motion-reduce:transition-none"
              style={{ transform: `scale(${zoom})`, transformOrigin: `${selectedPosition.x}% ${selectedPosition.y}%` }}
            >
              {routePreview && selected && (
                <div className="atlas-route-line" style={routeStyle(originPosition, selectedPosition)} aria-hidden="true" />
              )}
              {locationInView && (
                <div className="atlas-user-marker" style={{ left: `${originPosition.x}%`, top: `${originPosition.y}%` }} aria-label={ko ? "내 위치" : "My location"}>
                  <span />
                </div>
              )}
              {shownPoints.map((point, index) => {
                const position = projectPoint(point, index)
                const Icon = POINT_ICONS[point.layer]
                const active = point.id === selected?.id
                return (
                  <button
                    key={`${point.kind}:${point.id}`}
                    type="button"
                    onClick={() => selectPoint(point)}
                    aria-pressed={active}
                    aria-label={`${ko ? LAYERS.find((item) => item.id === point.layer)?.ko : LAYERS.find((item) => item.id === point.layer)?.en}, ${point.title}, ${point.subtitle}`}
                    className={cn("atlas-pin pressable", `atlas-pin-${point.layer}`, active && "atlas-pin-active")}
                    style={{ left: `${position.x}%`, top: `${position.y}%` }}
                  >
                    <Icon className="h-[15px] w-[15px]" strokeWidth={2.2} />
                    {point.benefitLabel && <span className="atlas-pin-benefit" aria-hidden="true" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <header className="safe-top pointer-events-none absolute inset-x-0 top-0 z-30 px-4">
          <div className="pointer-events-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5 rounded-full bg-[#fbfaf6]/92 px-3 py-2 shadow-[0_8px_26px_rgba(24,24,20,.13)] backdrop-blur-xl ring-1 ring-black/5">
              <Logo size={25} />
              <div>
                <p className="font-display text-[15px] font-semibold leading-none">K-Tour Map</p>
                <p className="mt-1 text-[10px] font-semibold tracking-[0.04em] text-muted-foreground">{mapContext}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <div className="pointer-events-auto rounded-full bg-[#fbfaf6]/92 text-foreground shadow-sm ring-1 ring-black/5"><LangToggle /></div>
              <Link href="/alerts" aria-label={ko ? "알림" : "Alerts"} className="pressable pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-[#fbfaf6]/92 shadow-sm ring-1 ring-black/5"><Bell className="h-[18px] w-[18px]" /></Link>
              <Link href="/profile" aria-label={ko ? "내 정보" : "Profile"} className="pressable pointer-events-auto"><img src={session.identity?.photoUrl ?? "/portraits/daniel-v2.jpg"} alt="" className="h-11 w-11 rounded-full object-cover shadow-sm ring-2 ring-[#fbfaf6]" /></Link>
            </div>
          </div>

          <div className="pointer-events-auto mt-3 flex min-h-13 items-center gap-2 rounded-[18px] bg-[#fbfaf6]/94 px-3 shadow-[0_10px_28px_rgba(24,24,20,.15)] backdrop-blur-xl ring-1 ring-black/5">
            <Search className="h-5 w-5 flex-shrink-0 text-primary" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={ko ? "어디서 무엇을 해볼까요?" : "Where to, and what shall we do?"}
              aria-label={ko ? "장소와 액티비티 검색" : "Search places and activities"}
              className="h-12 min-w-0 flex-1 bg-transparent text-[14px] font-medium outline-none placeholder:text-muted-foreground"
            />
            {query && <button type="button" onClick={() => setQuery("")} aria-label={ko ? "검색어 지우기" : "Clear search"} className="pressable grid h-9 w-9 place-items-center rounded-full bg-secondary"><X className="h-4 w-4" /></button>}
          </div>

          <div className="no-scrollbar pointer-events-auto -mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4 pb-2">
            {LAYERS.map(({ id, ko: labelKo, en: labelEn, icon: Icon }) => {
              const active = layer === id
              return (
                <button key={id} type="button" onClick={() => selectLayer(id)} aria-pressed={active} className={cn("pressable inline-flex min-h-10 flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-semibold shadow-sm ring-1", active ? "bg-ink text-white ring-ink" : "bg-[#fbfaf6]/94 text-foreground ring-black/5")}>
                  <Icon className={cn("h-3.5 w-3.5", active ? "text-[#e7c16d]" : "text-primary")} />{ko ? labelKo : labelEn}
                </button>
              )
            })}
          </div>
        </header>

        <div className="atlas-tools absolute right-3 z-20 flex flex-col gap-2">
          <button type="button" onClick={() => setListMode((value) => !value)} aria-pressed={listMode} className="pressable grid h-11 w-11 place-items-center rounded-[14px] bg-[#fbfaf6]/94 text-foreground shadow-md ring-1 ring-black/5" aria-label={listMode ? (ko ? "지도 보기" : "Show map") : (ko ? "목록 보기" : "Show list")}>
            {listMode ? <MapPinned className="h-[18px] w-[18px]" /> : <List className="h-[18px] w-[18px]" />}
          </button>
          <button type="button" onClick={() => setHeritageLayer((value) => !value)} aria-pressed={heritageLayer} className={cn("pressable grid h-11 w-11 place-items-center rounded-[14px] shadow-md ring-1", heritageLayer ? "bg-ink text-[#e7c16d] ring-ink" : "bg-[#fbfaf6]/94 text-foreground ring-black/5")} aria-label={ko ? "산수의 맥 레이어" : "Landscape layer"}><Layers3 className="h-[18px] w-[18px]" /></button>
          {!listMode && <div className="overflow-hidden rounded-[14px] bg-[#fbfaf6]/94 shadow-md ring-1 ring-black/5"><button type="button" onClick={() => setZoom((value) => Math.min(1.22, Number((value + 0.11).toFixed(2))))} className="pressable grid h-10 w-11 place-items-center border-b border-black/5" aria-label={ko ? "확대" : "Zoom in"}><ZoomIn className="h-[17px] w-[17px]" /></button><button type="button" onClick={() => setZoom((value) => Math.max(0.94, Number((value - 0.11).toFixed(2))))} className="pressable grid h-10 w-11 place-items-center" aria-label={ko ? "축소" : "Zoom out"}><ZoomOut className="h-[17px] w-[17px]" /></button></div>}
          <button type="button" onClick={() => void requestLocation()} disabled={locationStatus === "requesting"} className="pressable grid h-11 w-11 place-items-center rounded-[14px] bg-primary text-white shadow-md disabled:opacity-55" aria-label={ko ? "내 위치로 이동" : "Use my location"}><LocateFixed className={cn("h-[18px] w-[18px]", locationStatus === "requesting" && "animate-pulse")} /></button>
        </div>

        {!listMode && shownPoints.length === 0 && (
          <section className="absolute inset-x-12 top-[46%] z-20 -translate-y-1/2 rounded-[22px] bg-[#fbfaf6]/96 px-5 py-6 text-center shadow-xl ring-1 ring-black/5" role="status">
            <Search className="mx-auto h-6 w-6 text-primary" />
            <h2 className="mt-3 text-[16px] font-semibold">{ko ? "이 조건에 맞는 장소가 없어요" : "No places match this search"}</h2>
            <p className="mt-1 text-[12px] leading-5 text-muted-foreground">{ko ? "검색어와 지도 레이어를 초기화해 보세요." : "Clear the search and map layer to see nearby choices."}</p>
            <button type="button" onClick={() => { setQuery(""); selectLayer("nearby") }} className="pressable mt-4 min-h-11 rounded-full bg-ink px-5 text-[12px] font-semibold text-white">{ko ? "주변 지도 다시 보기" : "Reset nearby map"}</button>
          </section>
        )}

        {listMode && (
          <section className="atlas-results absolute inset-x-3 bottom-3 z-10 overflow-hidden rounded-[24px] bg-[#fbfaf6]/96 shadow-[0_18px_50px_rgba(24,24,20,.18)] backdrop-blur-xl ring-1 ring-black/5" aria-label={ko ? "지도 결과 목록" : "Map results list"}>
            <div className="flex items-center justify-between border-b border-foreground/10 px-5 py-4"><div><p className="text-[11px] font-semibold tracking-[0.06em] text-primary">{ko ? "같은 필터 · 목록 보기" : "SAME FILTER · LIST VIEW"}</p><h2 className="mt-1 text-[18px] font-semibold">{shownPoints.length}{ko ? "개의 선택" : " choices"}</h2></div><button type="button" onClick={() => setListMode(false)} className="pressable grid h-10 w-10 place-items-center rounded-full bg-secondary" aria-label={ko ? "지도 돌아가기" : "Back to map"}><X className="h-4 w-4" /></button></div>
            <div className="h-[calc(100%-77px)] overflow-y-auto px-5 pb-6">
              {shownPoints.length === 0 ? <p className="py-10 text-center text-[13px] text-muted-foreground">{ko ? "이 조건에 맞는 장소가 없어요. 필터를 바꿔보세요." : "No places match these filters yet."}</p> : shownPoints.map((point) => {
                const Icon = POINT_ICONS[point.layer]
                const proximity = pointProximityLabel(point.geo, locationStatus === "granted" ? location : null, lang)
                return <button key={`${point.kind}:${point.id}`} type="button" onClick={() => { selectPoint(point); setListMode(false) }} className="pressable flex w-full items-start gap-3 border-b border-foreground/10 py-4 text-left"><span className={cn("atlas-list-icon", `atlas-list-icon-${point.layer}`)}><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold">{point.title}</span><span className="mt-1 block truncate text-[12px] text-muted-foreground">{point.subtitle}</span><span className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">{proximity && <span className="font-semibold text-success">{proximity}</span>}<span className="font-medium text-foreground">{point.timing}</span>{point.benefitLabel && <span className="rounded-full bg-primary/8 px-2 py-0.5 font-semibold text-primary">{point.benefitLabel}</span>}</span></span><ChevronRight className="mt-2 h-4 w-4 flex-shrink-0 text-muted-foreground" /></button>
              })}
            </div>
          </section>
        )}

        {!listMode && selected && (
          <section className={cn("atlas-sheet absolute inset-x-3 z-30 rounded-[26px] bg-[#fbfaf6]/97 px-5 shadow-[0_22px_60px_rgba(24,24,20,.24)] backdrop-blur-xl ring-1 ring-black/5 transition-all duration-300 motion-reduce:transition-none", expanded ? "bottom-3" : "bottom-3")} aria-live="polite">
            <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} className="pressable flex min-h-9 w-full items-center justify-center" aria-label={expanded ? (ko ? "정보 접기" : "Collapse details") : (ko ? "정보 펼치기" : "Expand details")}><span className="sheet-grabber" /></button>
            {routePreview && <div className="mb-3 flex items-center gap-3 rounded-[14px] bg-[#edf2ef] px-3 py-2.5"><span className="grid h-8 w-8 place-items-center rounded-full bg-success text-white"><Footprints className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="text-[12px] font-semibold text-success">{routeSummary}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{ko ? "대략적 위치 기준 · 실제 연동 시 실시간 재계산" : "Based on approximate location · live when connected"}</p></div><button type="button" onClick={() => setRoutePreview(false)} className="pressable grid h-9 w-9 place-items-center rounded-full"><X className="h-4 w-4" /></button></div>}
            <div className="flex items-start gap-3">
              {expanded && selected.image ? <img src={selected.image} alt="" className="h-20 w-20 flex-shrink-0 rounded-[16px] object-cover" /> : <span className={cn("atlas-card-icon", `atlas-card-icon-${selected.layer}`)}>{(() => { const Icon = POINT_ICONS[selected.layer]; return <Icon className="h-5 w-5" /> })()}</span>}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><p className="truncate text-[11px] font-semibold text-primary">{selected.subtitle}</p>{selected.kind === "activity" && <BadgeCheck className="h-3.5 w-3.5 flex-shrink-0 text-success" />}</div>
                <h1 className="font-display mt-1 text-balance text-[20px] font-semibold leading-[1.22] tracking-[-0.025em]">{selected.title}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]"><span className="font-semibold text-foreground">{selected.timing}</span><span className="text-muted-foreground">·</span><span className="font-semibold text-foreground">{selected.priceLabel}</span></div>
              </div>
            </div>

            {expanded && <p className="mt-3 text-[12px] leading-5 text-muted-foreground">{selected.description}</p>}

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {selected.benefitLabel && <span className="inline-flex items-center gap-1 rounded-full bg-primary/8 px-2.5 py-1 text-[11px] font-semibold text-primary"><Gift className="h-3 w-3" />{selectedVoucher ? `${selectedVoucher.title}` : selected.benefitLabel}</span>}
              {selected.eligible && <span className="inline-flex items-center gap-1 rounded-full bg-success-surface px-2.5 py-1 text-[11px] font-semibold text-success"><BadgeCheck className="h-3 w-3" />{credentialActive ? (ko ? "내 ID로 이용 가능" : "Available with my ID") : (ko ? "혜택 적용 전 ID 갱신" : "Renew ID before applying benefits")}</span>}
              {expanded && <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">{selected.sourceLabel}</span>}
            </div>

            {expanded && selected.kind !== "partner" && (
              <section className="mt-4 border-t border-foreground/10 pt-3" aria-label={ko ? "이 장소에서 이어지는 서비스" : "Services branching from this place"}>
                <p className="text-[11px] font-semibold text-foreground">{ko ? "이 여행에서 바로 이어가기" : "Continue from this trip context"}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setContextBranch((value) => value === "mobility" ? null : "mobility")} aria-pressed={contextBranch === "mobility"} className={cn("pressable flex min-h-11 items-center gap-2 rounded-[13px] px-3 text-left text-[11px] font-semibold ring-1", contextBranch === "mobility" ? "bg-ink text-white ring-ink" : "bg-card ring-border")}><TrainFront className="h-4 w-4" />{ko ? "가는 방법" : "How to get there"}</button>
                  <button type="button" onClick={() => setContextBranch((value) => value === "food" ? null : "food")} aria-pressed={contextBranch === "food"} className={cn("pressable flex min-h-11 items-center gap-2 rounded-[13px] px-3 text-left text-[11px] font-semibold ring-1", contextBranch === "food" ? "bg-ink text-white ring-ink" : "bg-card ring-border")}><Utensils className="h-4 w-4" />{ko ? "전후 식사" : "Before or after meal"}</button>
                </div>
                {contextBranch && (
                  <div className="mt-2 divide-y divide-foreground/10 rounded-[14px] bg-secondary/65 px-3">
                    {contextualPartners.map((partner) => (
                      <Link key={partner.id} href={`${partner.href}?contextId=${encodeURIComponent(selected.id)}&returnTo=${encodeURIComponent("/")}`} className="pressable flex min-h-14 items-center gap-3 py-2.5">
                        <span className={cn("atlas-list-icon h-9 w-9", `atlas-list-icon-${partner.layer}`)}>{(() => { const Icon = POINT_ICONS[partner.layer]; return <Icon className="h-4 w-4" /> })()}</span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-semibold">{partner.title}</span><span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{partner.subtitle} · {partner.priceLabel}</span></span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            )}

            {expanded && <div className="mt-3 flex items-start gap-2 border-t border-foreground/10 pt-3 text-[11px] leading-4 text-muted-foreground"><Route className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" /><span>{ko ? "장소를 고른 뒤 이동·예약·결제 제공자가 필요한 순간에만 이어져요. 대략적 위치는 이 기기에 저장되며 ID에는 들어가지 않아요." : "Mobility, booking and payment appear only after you choose a place. Approximate location stays on this device and is not written to your ID."}</span></div>}

            <div className="mt-4 grid grid-cols-[44px_1fr] gap-2 pb-4">
              <button type="button" onClick={async () => { if (locationStatus !== "granted") await requestLocation(); setRoutePreview(true) }} aria-label={ko ? "길찾기 미리보기" : "Preview directions"} className={cn("pressable grid min-h-12 place-items-center rounded-[14px] ring-1", routePreview ? "bg-ink text-white ring-ink" : "bg-card text-foreground ring-border")}><Navigation className="h-[18px] w-[18px]" /></button>
              <Link href={selected.kind === "partner" ? `${selected.href}?contextId=${encodeURIComponent(selected.id)}&returnTo=${encodeURIComponent("/")}` : selected.href} className="pressable flex min-h-12 items-center justify-between rounded-[14px] bg-primary px-4 text-[13px] font-semibold text-white"><span>{selected.kind === "activity" ? (ko ? "참여 조건 보기" : "Review and join") : selected.kind === "place" ? (ko ? "주변 체험 보기" : "See nearby experiences") : selected.kind === "partner" ? (ko ? "옵션·예상 금액 보기" : "See options and estimate") : selected.layer === "mobility" ? (ko ? "이용권 상세 보기" : "See pass details") : selected.layer === "food" ? (ko ? "주문 조건 보기" : "See order details") : (ko ? "예약·혜택 보기" : "See booking and benefit")}</span><ChevronRight className="h-4 w-4" /></Link>
            </div>
          </section>
        )}

        {!listMode && !expanded && <button type="button" onClick={openCopilot} className="pressable absolute bottom-[205px] left-3 z-20 inline-flex min-h-10 items-center gap-2 rounded-full bg-ink px-3.5 text-[11px] font-semibold text-white shadow-lg ring-1 ring-white/10"><Sparkles className="h-3.5 w-3.5 text-[#e7c16d]" />{ko ? "30분 코스 추천" : "Build a 30-min route"}</button>}
      </div>

      <div className="sr-only" aria-live="polite">{selected ? `${selected.title}. ${selected.subtitle}. ${selected.timing}.` : ko ? "검색 결과가 없어요" : "No results"}</div>
      <div className="pointer-events-none absolute bottom-[76px] left-4 z-20 text-[9px] font-medium text-foreground/45">{ko ? `K-Tour ID ${remainingDays}일 · 위치 원문은 ID에 저장하지 않음` : `K-Tour ID ${remainingDays}d · raw location is not stored in your ID`}</div>
    </main>
  )
}
