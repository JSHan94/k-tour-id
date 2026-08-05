"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  BadgeCheck,
  Bell,
  ChevronRight,
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
import {
  RealTravelMap,
  type MapViewLevel,
  type RealTravelMapHandle,
} from "@/components/app/real-travel-map"
import { COMMERCIAL_SERVICES } from "@/lib/commercial-services"
import { credentialDaysRemaining, isCredentialUsable } from "@/lib/credential-status"
import { formatWon } from "@/lib/format"
import { useLang } from "@/lib/i18n/lang-provider"
import { distanceKm, pointProximityLabel, useNearbyLocation } from "@/lib/location/location-provider"
import { ACTIVITIES } from "@/lib/mock-data"
import { MARKETPLACE_ITEMS, PERSONA_CONFIG } from "@/lib/catalog"
import { KOREA_REGIONS, type KoreaRegionId } from "@/lib/map/korea-atlas-data"
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
  searchAliases: string[]
}

const LAYERS: Array<{ id: MapLayer; ko: string; en: string; icon: LucideIcon }> = [
  { id: "nearby", ko: "지금 주변", en: "Around me", icon: MapPinned },
  { id: "experience", ko: "할 거리", en: "Things to do", icon: Landmark },
  { id: "food", ko: "먹기", en: "Eat", icon: Utensils },
  { id: "mobility", ko: "이동", en: "Move", icon: TrainFront },
  { id: "essentials", ko: "필수품", en: "Essentials", icon: ShoppingBag },
  { id: "together", ko: "함께하기", en: "Meet people", icon: UsersRound },
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
  {
    id: "place-gangneung", geo: { latitude: 37.752, longitude: 128.876 },
    title: { ko: "강릉 월화거리", en: "Gangneung Wolhwa Street" },
    subtitle: { ko: "강원 강릉 · 바다와 오래된 길", en: "Gangneung · coast and old town" },
    description: { ko: "동해의 바람, 시장, 오래된 철길 산책을 한 흐름으로 만나는 여행 시작점이에요.", en: "A starting point linking East Sea breezes, markets and an old railway walk." },
  },
  {
    id: "place-jeonju", geo: { latitude: 35.814, longitude: 127.153 },
    title: { ko: "전주 한옥마을", en: "Jeonju Hanok Village" },
    subtitle: { ko: "전북 전주 · 한옥과 음식", en: "Jeonju · hanok and local food" },
    description: { ko: "골목의 공예, 지역 음식, 야간 산책을 천천히 이어가기 좋은 권역이에요.", en: "A district for craft alleys, regional food and slow evening walks." },
  },
  {
    id: "place-gyeongju", geo: { latitude: 35.838, longitude: 129.211 },
    title: { ko: "경주 황리단길", en: "Gyeongju Hwangnidan-gil" },
    subtitle: { ko: "경북 경주 · 신라 유산과 산책", en: "Gyeongju · Silla heritage and walks" },
    description: { ko: "고분과 골목, 박물관과 저녁 산책을 한 지역 안에서 연결할 수 있어요.", en: "Connect royal tombs, museums, alleys and an evening walk in one area." },
  },
  {
    id: "place-busan", geo: { latitude: 35.097, longitude: 129.031 },
    title: { ko: "부산 자갈치·남포", en: "Busan Jagalchi · Nampo" },
    subtitle: { ko: "부산 중구 · 바다와 시장", en: "Busan · sea and markets" },
    description: { ko: "항구 풍경과 시장 음식, 원도심 골목을 도보와 대중교통으로 이어가는 지역이에요.", en: "A harbor district linking market food, old-town alleys and waterfront views." },
  },
  {
    id: "place-jeju", geo: { latitude: 33.458, longitude: 126.942 },
    title: { ko: "제주 성산", en: "Jeju Seongsan" },
    subtitle: { ko: "제주 동부 · 오름과 바다", en: "East Jeju · oreum and coast" },
    description: { ko: "일출, 오름, 해안 마을과 로컬 액티비티를 하루 동선으로 묶기 좋아요.", en: "A base for sunrise, oreum trails, coastal villages and local activities." },
  },
] as const

function pointLayerFromCategory(category: string): PointLayer {
  if (category === "food" || category === "delivery") return "food"
  if (category === "mobility") return "mobility"
  if (category === "shopping" || category === "convenience") return "essentials"
  return "experience"
}

function localizedLanguage(language: string, lang: "ko" | "en") {
  if (lang === "ko") return language
  return ({ 한국어: "Korean", 영어: "English", 일본어: "Japanese", 중국어: "Chinese", 베트남어: "Vietnamese" } as Record<string, string>)[language] ?? language
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
      searchAliases: [item.title.ko, item.title.en, item.location.ko, item.location.en, item.description.ko, item.description.en],
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
      searchAliases: [service.title.ko, service.title.en, service.name.ko, service.name.en, service.context.ko, service.context.en],
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
      : `${activity.languages.map((language) => localizedLanguage(language, lang)).join("/")} · ${activity.joined}/${activity.capacity} joined`,
    priceLabel: activity.costKRW ? formatWon(activity.costKRW) : ko ? "무료" : "Free",
    eligible: true,
    sourceLabel: ko ? "K-Tour ID 확인 참여자 · 방금 갱신" : "K-Tour ID participants · updated just now",
    searchAliases: [activity.title, activity.titleEn ?? activity.title, activity.place, activity.placeEn ?? activity.place],
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
    searchAliases: [place.title.ko, place.title.en, place.subtitle.ko, place.subtitle.en, place.description.ko, place.description.en],
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
  const [contextBranch, setContextBranch] = useState<ContextBranch>(null)
  const [mapLevel, setMapLevel] = useState<MapViewLevel>("nation")
  const [mapRegionId, setMapRegionId] = useState<KoreaRegionId | undefined>()
  const [hasMapSelection, setHasMapSelection] = useState(false)
  const [focusToken, setFocusToken] = useState(0)
  const realMapRef = useRef<RealTravelMapHandle>(null)
  const headerRef = useRef<HTMLElement>(null)
  const sheetRef = useRef<HTMLElement>(null)
  const [topChromeHeight, setTopChromeHeight] = useState(205)
  const [bottomChromeHeight, setBottomChromeHeight] = useState(220)
  const [locationNoticeDismissed, setLocationNoticeDismissed] = useState(false)

  useEffect(() => {
    const element = headerRef.current
    if (!element) return
    const update = () => setTopChromeHeight(Math.ceil(element.getBoundingClientRect().bottom + 8))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const element = sheetRef.current
    if (!element || !hasMapSelection) {
      setBottomChromeHeight(190)
      return
    }
    const update = () => setBottomChromeHeight(Math.ceil(element.getBoundingClientRect().height + 24))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [hasMapSelection])

  const filteredPoints = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return allPoints.filter((point) => {
      if (layer === "benefit" && !point.benefitLabel) return false
      if (layer === "nearby" && point.kind === "partner") return false
      if (layer !== "nearby" && layer !== "benefit" && point.layer !== layer) return false
      if (!normalizedQuery) return true
      return [point.title, point.subtitle, point.description, ...point.searchAliases]
        .some((value) => value.toLowerCase().includes(normalizedQuery))
    })
  }, [allPoints, layer, query])

  const shownPoints = useMemo(() => {
    const activeRegion = mapRegionId
      ? KOREA_REGIONS.find((region) => region.id === mapRegionId)
      : undefined
    const scoped = activeRegion && mapLevel !== "nation"
      ? filteredPoints.filter((point) => {
        const [[south, west], [north, east]] = activeRegion.bounds
        return point.geo.latitude >= south && point.geo.latitude <= north
          && point.geo.longitude >= west && point.geo.longitude <= east
      })
      : filteredPoints
    const prioritized = [...scoped].sort((a, b) => {
      if (layer === "nearby" && locationStatus === "granted" && location) {
        return distanceKm(location, a.geo) - distanceKm(location, b.geo)
      }
      const aPersonaFirst = Number(a.id === persona.firstItemId)
      const bPersonaFirst = Number(b.id === persona.firstItemId)
      if (aPersonaFirst !== bPersonaFirst) return bPersonaFirst - aPersonaFirst
      if (a.eligible !== b.eligible) return Number(b.eligible) - Number(a.eligible)
      return Number(Boolean(b.benefitLabel)) - Number(Boolean(a.benefitLabel))
    })
    return prioritized
  }, [filteredPoints, layer, location, locationStatus, mapLevel, mapRegionId, persona.firstItemId, query])

  const regionCounts = useMemo(() => Object.fromEntries(
    KOREA_REGIONS.map((region) => {
      const [[south, west], [north, east]] = region.bounds
      const count = filteredPoints.filter((point) => (
        point.geo.latitude >= south && point.geo.latitude <= north
        && point.geo.longitude >= west && point.geo.longitude <= east
      )).length
      return [region.id, count]
    }),
  ) as Record<KoreaRegionId, number>, [filteredPoints])

  const selected = shownPoints.length > 0
    ? shownPoints.find((point) => point.id === selectedId) ?? shownPoints[0]
    : undefined
  const locationInView = locationStatus === "granted" && location &&
    location.latitude >= SEOUL_BOUNDS.minLatitude && location.latitude <= SEOUL_BOUNDS.maxLatitude &&
    location.longitude >= SEOUL_BOUNDS.minLongitude && location.longitude <= SEOUL_BOUNDS.maxLongitude
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
    setHasMapSelection(false)
    setExpanded(false)
    setRoutePreview(false)
    setContextBranch(null)
  }

  const selectPoint = (point: TravelMapPoint) => {
    setSelectedId(point.id)
    setHasMapSelection(true)
    setFocusToken((value) => value + 1)
    setExpanded(false)
    setRoutePreview(false)
    setContextBranch(null)
  }

  const selectPointById = (id: string) => {
    const point = shownPoints.find((candidate) => candidate.id === id)
    if (point) selectPoint(point)
  }

  const contextualPartners = contextBranch
    ? allPoints.filter((point) => point.kind === "partner" && point.layer === contextBranch).slice(0, 2)
    : []
  const selectedDistanceKm = selected && locationStatus === "granted" && location
    ? distanceKm(location, selected.geo)
    : null
  const routeSummary = selectedDistanceKm == null
    ? (ko ? "위치를 켜면 직선거리와 방향을 확인해요" : "Enable location to see distance and direction")
    : (ko
      ? `직선거리 ${selectedDistanceKm < 1 ? `${Math.max(100, Math.round(selectedDistanceKm * 10) * 100)}m` : `${selectedDistanceKm.toFixed(1)}km`}`
      : `Straight-line distance ${selectedDistanceKm < 1 ? `${Math.max(100, Math.round(selectedDistanceKm * 10) * 100)}m` : `${selectedDistanceKm.toFixed(1)}km`}`)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const contextId = params.get("contextId")
    const branch = params.get("branch")
    const focus = params.get("focus")
    if (focus && LAYERS.some((item) => item.id === focus)) setLayer(focus as MapLayer)
    if (!contextId || !allPoints.some((point) => point.id === contextId)) return
    if (!focus) setLayer("nearby")
    setSelectedId(contextId)
    setHasMapSelection(true)
    setFocusToken((value) => value + 1)
    setExpanded(true)
    setContextBranch(branch === "food" || branch === "mobility" ? branch : null)
  }, [allPoints])

  const mapRegion = mapRegionId
    ? KOREA_REGIONS.find((region) => region.id === mapRegionId)
    : undefined
  const mapContext = mapLevel === "nation"
    ? (ko ? "대한민국 전체 · 지역을 골라보세요" : "Korea · choose region")
    : mapRegion
      ? (ko ? `${mapRegion.name.ko} · ${mapRegion.hook.ko}` : `${mapRegion.name.en} · explore`)
      : locationStatus === "granted" && location
        ? (locationInView ? (ko ? `${location.areaKo} 주변` : `Near ${location.areaEn}`) : (ko ? `현재 ${location.areaKo}` : `Currently ${location.areaEn}`))
        : (ko ? "대한민국 여행" : "Travel Korea")

  const showNation = () => {
    realMapRef.current?.showKorea()
    setHasMapSelection(false)
    setExpanded(false)
    setRoutePreview(false)
    setContextBranch(null)
  }

  return (
    <main className="relative h-[100dvh] overflow-hidden bg-[#e7e3d8]" data-experiment-variant="map-first-b">
      <div className="absolute inset-0 bottom-[calc(72px+env(safe-area-inset-bottom))] overflow-hidden">
        <div className={cn("atlas-map absolute inset-0", heritageLayer && "atlas-map-heritage")}>
          <RealTravelMap
            ref={realMapRef}
            points={shownPoints}
            selectedId={selected?.id}
            focusToken={focusToken}
            regionCounts={regionCounts}
            currentLocation={locationStatus === "granted" ? location : null}
            routePreview={routePreview}
            heritageLayer={heritageLayer}
            topChromeHeight={topChromeHeight}
            bottomChromeHeight={bottomChromeHeight}
            lang={lang}
            onSelect={selectPointById}
            onViewLevelChange={(level, regionId) => {
              setMapLevel(level)
              setMapRegionId(regionId)
              if (level !== "place") setHasMapSelection(false)
            }}
            onUnavailable={() => setListMode(true)}
          />
        </div>

        <header ref={headerRef} className="safe-top pointer-events-none absolute inset-x-0 top-0 z-30 px-4">
          <div className="pointer-events-auto flex items-center justify-between">
            <button type="button" onClick={showNation} aria-label={ko ? "대한민국 전체 지도 보기" : "Show the whole Korea map"} className="pressable flex min-w-0 max-w-[calc(100%_-_148px)] items-center gap-2.5 rounded-full bg-[#fbfaf6]/92 px-3 py-2 text-left shadow-[0_8px_26px_rgba(24,24,20,.13)] backdrop-blur-xl ring-1 ring-black/5">
              <Logo size={25} />
              <div className="min-w-0">
                <p className="truncate font-display text-[15px] font-semibold leading-none">{ko ? "K-Tour ID 여행지도" : "K-Tour Korea Atlas"}</p>
                <p className="mt-1 truncate text-[11px] font-semibold tracking-[0.02em] text-muted-foreground">{mapContext}</p>
              </div>
              <MapPinned className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <div className="pointer-events-auto rounded-full bg-[#fbfaf6]/92 text-foreground shadow-sm ring-1 ring-black/5"><LangToggle /></div>
              <Link href="/alerts" aria-label={ko ? "알림" : "Alerts"} className="pressable pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-[#fbfaf6]/92 shadow-sm ring-1 ring-black/5 max-[359px]:hidden"><Bell className="h-[18px] w-[18px]" /></Link>
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
            {query && <button type="button" onClick={() => setQuery("")} aria-label={ko ? "검색어 지우기" : "Clear search"} className="pressable grid h-11 w-11 place-items-center rounded-full bg-secondary"><X className="h-4 w-4" /></button>}
          </div>

          <div className="no-scrollbar pointer-events-auto -mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4 pb-2">
            {LAYERS.map(({ id, ko: labelKo, en: labelEn, icon: Icon }) => {
              const active = layer === id
              const visibleLabel = id === "nearby" && locationStatus !== "granted"
                ? (ko ? "지역 추천" : "Recommended")
                : (ko ? labelKo : labelEn)
              return (
                <button key={id} type="button" onClick={() => selectLayer(id)} aria-pressed={active} className={cn("pressable inline-flex min-h-11 flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-semibold shadow-sm ring-1", active ? "bg-ink text-white ring-ink" : "bg-[#fbfaf6]/94 text-foreground ring-black/5")}>
                  <Icon className={cn("h-3.5 w-3.5", active ? "text-[#e7c16d]" : "text-primary")} />{visibleLabel}
                </button>
              )
            })}
          </div>
        </header>

        <div className="atlas-tools absolute right-3 z-20 flex flex-col gap-2" style={{ top: topChromeHeight }}>
          <button type="button" onClick={() => setListMode((value) => !value)} aria-pressed={listMode} className="pressable grid h-11 w-11 place-items-center rounded-[14px] bg-[#fbfaf6]/94 text-foreground shadow-md ring-1 ring-black/5" aria-label={listMode ? (ko ? "지도 보기" : "Show map") : (ko ? "목록 보기" : "Show list")}>
            {listMode ? <MapPinned className="h-[18px] w-[18px]" /> : <List className="h-[18px] w-[18px]" />}
          </button>
          <button type="button" onClick={() => setHeritageLayer((value) => !value)} aria-pressed={heritageLayer} className={cn("pressable grid h-11 w-11 place-items-center rounded-[14px] shadow-md ring-1", heritageLayer ? "bg-ink text-[#e7c16d] ring-ink" : "bg-[#fbfaf6]/94 text-foreground ring-black/5")} aria-label={ko ? "여행 맥 보기" : "Heritage map style"}><Layers3 className="h-[18px] w-[18px]" /></button>
          {!listMode && <div className="overflow-hidden rounded-[14px] bg-[#fbfaf6]/94 shadow-md ring-1 ring-black/5"><button type="button" onClick={() => realMapRef.current?.zoomIn()} className="pressable grid h-11 w-11 place-items-center border-b border-black/5" aria-label={ko ? "확대" : "Zoom in"}><ZoomIn className="h-[17px] w-[17px]" /></button><button type="button" onClick={() => realMapRef.current?.zoomOut()} className="pressable grid h-11 w-11 place-items-center" aria-label={ko ? "축소" : "Zoom out"}><ZoomOut className="h-[17px] w-[17px]" /></button></div>}
          <button type="button" onClick={async () => { if (locationStatus === "granted" && location) realMapRef.current?.flyToLocation(location); else await requestLocation() }} disabled={locationStatus === "requesting"} className="pressable grid h-11 w-11 place-items-center rounded-[14px] bg-primary text-white shadow-md disabled:opacity-55" aria-label={ko ? "내 위치로 이동" : "Use my location"}><LocateFixed className={cn("h-[18px] w-[18px]", locationStatus === "requesting" && "animate-pulse")} /></button>
        </div>

        {!listMode && !locationNoticeDismissed && (locationStatus === "denied" || locationStatus === "unavailable") && (
          <section className="absolute inset-x-3 bottom-3 z-20 flex items-center gap-3 rounded-[16px] bg-[#fbfaf6]/96 px-4 py-3 shadow-lg ring-1 ring-black/5" role="status">
            <MapPinned className="h-5 w-5 flex-shrink-0 text-primary" />
            <p className="min-w-0 flex-1 text-[12px] font-medium leading-5 text-foreground">{ko ? "위치 없이도 지도에서 지역을 골라 여행을 시작할 수 있어요." : "Choose a region on the map to start without location access."}</p>
            <button type="button" onClick={() => setLocationNoticeDismissed(true)} className="pressable grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-secondary" aria-label={ko ? "안내 닫기" : "Dismiss message"}><X className="h-4 w-4" /></button>
          </section>
        )}

        {!listMode && shownPoints.length === 0 && (
          <section className="absolute inset-x-12 top-[46%] z-20 -translate-y-1/2 rounded-[22px] bg-[#fbfaf6]/96 px-5 py-6 text-center shadow-xl ring-1 ring-black/5" role="status">
            <Search className="mx-auto h-6 w-6 text-primary" />
            <h2 className="mt-3 text-[16px] font-semibold">{ko ? "이 조건에 맞는 장소가 없어요" : "No places match this search"}</h2>
            <p className="mt-1 text-[12px] leading-5 text-muted-foreground">{ko ? "검색어와 지도 레이어를 초기화해 보세요." : "Clear the search and map layer to see nearby choices."}</p>
            <button type="button" onClick={() => { setQuery(""); selectLayer("nearby") }} className="pressable mt-4 min-h-11 rounded-full bg-ink px-5 text-[12px] font-semibold text-white">{ko ? "주변 지도 다시 보기" : "Reset nearby map"}</button>
          </section>
        )}

        {listMode && (
          <section className="atlas-results absolute inset-x-3 bottom-3 z-10 overflow-hidden rounded-[24px] bg-[#fbfaf6]/96 shadow-[0_18px_50px_rgba(24,24,20,.18)] backdrop-blur-xl ring-1 ring-black/5" style={{ top: topChromeHeight }} aria-label={ko ? "지도 결과 목록" : "Map results list"}>
            <div className="flex items-center justify-between border-b border-foreground/10 px-5 py-4"><div><p className="text-[11px] font-semibold tracking-[0.06em] text-primary">{ko ? "같은 필터 · 목록 보기" : "SAME FILTER · LIST VIEW"}</p><h2 className="mt-1 text-[18px] font-semibold">{shownPoints.length}{ko ? "개의 선택" : " choices"}</h2></div><button type="button" onClick={() => setListMode(false)} className="pressable grid h-11 w-11 place-items-center rounded-full bg-secondary" aria-label={ko ? "지도 돌아가기" : "Back to map"}><X className="h-4 w-4" /></button></div>
            <div className="h-[calc(100%-77px)] overflow-y-auto px-5 pb-6">
              {shownPoints.length === 0 ? <p className="py-10 text-center text-[13px] text-muted-foreground">{ko ? "이 조건에 맞는 장소가 없어요. 필터를 바꿔보세요." : "No places match these filters yet."}</p> : shownPoints.map((point) => {
                const Icon = POINT_ICONS[point.layer]
                const proximity = pointProximityLabel(point.geo, locationStatus === "granted" ? location : null, lang)
                return <button key={`${point.kind}:${point.id}`} type="button" onClick={() => { selectPoint(point); setListMode(false) }} className="pressable flex w-full items-start gap-3 border-b border-foreground/10 py-4 text-left"><span className={cn("atlas-list-icon", `atlas-list-icon-${point.layer}`)}><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold">{point.title}</span><span className="mt-1 block truncate text-[12px] text-muted-foreground">{point.subtitle}</span><span className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">{proximity && <span className="font-semibold text-success">{proximity}</span>}<span className="font-medium text-foreground">{point.timing}</span>{point.benefitLabel && <span className="rounded-full bg-primary/8 px-2 py-0.5 font-semibold text-primary">{point.benefitLabel}</span>}</span></span><ChevronRight className="mt-2 h-4 w-4 flex-shrink-0 text-muted-foreground" /></button>
              })}
            </div>
          </section>
        )}

        {!listMode && selected && hasMapSelection && (
          <section ref={sheetRef} className={cn("atlas-sheet absolute inset-x-3 z-30 rounded-[26px] bg-[#fbfaf6]/97 px-5 shadow-[0_22px_60px_rgba(24,24,20,.24)] backdrop-blur-xl ring-1 ring-black/5 transition-all duration-300 motion-reduce:transition-none", expanded ? "bottom-3" : "bottom-3")} aria-live="polite">
            <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} className="pressable flex min-h-11 w-full items-center justify-center" aria-label={expanded ? (ko ? "정보 접기" : "Collapse details") : (ko ? "정보 펼치기" : "Expand details")}><span className="sheet-grabber" /></button>
            {routePreview && <div className="mb-3 flex items-center gap-3 rounded-[14px] bg-[#edf2ef] px-3 py-2.5"><span className="grid h-8 w-8 place-items-center rounded-full bg-success text-white"><Navigation className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="text-[12px] font-semibold text-success">{routeSummary}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{ko ? "방향 참고선 · 실제 도보 경로가 아니에요" : "Direction guide · not a walking route"}</p></div><button type="button" onClick={() => setRoutePreview(false)} className="pressable grid h-11 w-11 place-items-center rounded-full"><X className="h-4 w-4" /></button></div>}
            <div className="flex items-start gap-3">
              {expanded && selected.image ? <img src={selected.image} alt="" className="h-20 w-20 flex-shrink-0 rounded-[16px] object-cover" /> : <span className={cn("atlas-card-icon", `atlas-card-icon-${selected.layer}`)}>{(() => { const Icon = POINT_ICONS[selected.layer]; return <Icon className="h-5 w-5" /> })()}</span>}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><p className="truncate text-[12px] font-semibold text-primary">{selected.subtitle}</p>{selected.kind === "activity" && <BadgeCheck className="h-3.5 w-3.5 flex-shrink-0 text-success" />}</div>
                <h1 className="font-display mt-1 text-balance text-[20px] font-semibold leading-[1.22] tracking-[-0.025em]">{selected.title}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]"><span className="font-semibold text-foreground">{selected.timing}</span><span className="text-muted-foreground">·</span><span className="font-semibold text-foreground">{selected.priceLabel}</span></div>
              </div>
            </div>

            {expanded && <p className="mt-3 text-[12px] leading-5 text-muted-foreground">{selected.description}</p>}

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {selected.benefitLabel && <span className="inline-flex items-center gap-1 rounded-full bg-primary/8 px-2.5 py-1 text-[12px] font-semibold text-primary"><Gift className="h-3 w-3" />{selectedVoucher ? `${selectedVoucher.title}` : selected.benefitLabel}</span>}
              {selected.eligible && <span className="inline-flex items-center gap-1 rounded-full bg-success-surface px-2.5 py-1 text-[12px] font-semibold text-success"><BadgeCheck className="h-3 w-3" />{credentialActive ? (ko ? "내 ID로 이용 가능" : "Available with my ID") : (ko ? "혜택 적용 전 ID 갱신" : "Renew ID before applying benefits")}</span>}
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
                        <span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-semibold">{partner.title}</span><span className="mt-0.5 block truncate text-[12px] text-muted-foreground">{partner.subtitle} · {partner.priceLabel}</span></span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            )}

            {expanded && <div className="mt-3 flex items-start gap-2 border-t border-foreground/10 pt-3 text-[11px] leading-4 text-muted-foreground"><Route className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" /><span>{ko ? "장소를 고른 뒤 이동·예약·결제 제공자가 필요한 순간에만 이어져요. 대략적 위치는 이 기기에 저장되며 ID에는 들어가지 않아요." : "Mobility, booking and payment appear only after you choose a place. Approximate location stays on this device and is not written to your ID."}</span></div>}

            <div className="mt-4 grid grid-cols-[44px_1fr] gap-2 pb-4">
              <button type="button" onClick={async () => { if (locationStatus !== "granted") await requestLocation(); setRoutePreview(true) }} aria-label={ko ? "직선거리와 방향 보기" : "Show straight-line distance and direction"} className={cn("pressable grid min-h-12 place-items-center rounded-[14px] ring-1", routePreview ? "bg-ink text-white ring-ink" : "bg-card text-foreground ring-border")}><Navigation className="h-[18px] w-[18px]" /></button>
              <Link href={selected.kind === "partner" ? `${selected.href}?contextId=${encodeURIComponent(selected.id)}&returnTo=${encodeURIComponent("/")}` : selected.href} className="pressable flex min-h-12 items-center justify-between rounded-[14px] bg-primary px-4 text-[13px] font-semibold text-white"><span>{selected.kind === "activity" ? (ko ? "참여 조건 보기" : "Review and join") : selected.kind === "place" ? (ko ? "주변 체험 보기" : "See nearby experiences") : selected.kind === "partner" ? (ko ? "옵션·예상 금액 보기" : "See options and estimate") : selected.layer === "mobility" ? (ko ? "이용권 상세 보기" : "See pass details") : selected.layer === "food" ? (ko ? "주문 조건 보기" : "See order details") : (ko ? "예약·혜택 보기" : "See booking and benefit")}</span><ChevronRight className="h-4 w-4" /></Link>
            </div>
          </section>
        )}

        {!listMode && !expanded && <button type="button" onClick={openCopilot} className="pressable absolute bottom-[205px] left-3 z-20 inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-3.5 text-[11px] font-semibold text-white shadow-lg ring-1 ring-white/10"><Sparkles className="h-3.5 w-3.5 text-[#e7c16d]" />{ko ? "30분 코스 추천" : "Build a 30-min route"}</button>}
      </div>

      <div className="sr-only" aria-live="polite">{selected && hasMapSelection ? `${selected.title}. ${selected.subtitle}. ${selected.timing}.` : ko ? "대한민국 여행지도" : "Korea travel map"}</div>
      <div className="pointer-events-none absolute bottom-[calc(76px+env(safe-area-inset-bottom))] left-4 z-20 text-[11px] font-medium text-foreground/55">{ko ? `K-Tour ID ${remainingDays}일 · 위치 원문은 ID에 저장하지 않음` : `K-Tour ID ${remainingDays}d · raw location is not stored in your ID`}</div>
    </main>
  )
}
