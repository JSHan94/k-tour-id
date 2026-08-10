"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties } from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  BadgeCheck,
  ChevronRight,
  Gift,
  Landmark,
  List,
  LocateFixed,
  MapPinned,
  Navigation,
  Search,
  ShoppingBag,
  TrainFront,
  Utensils,
  UsersRound,
  X,
} from "lucide-react"
import { LangToggle, Logo } from "@/components/app/shell"
import { ModernKoreaAtlas } from "@/components/app/modern-korea-atlas"
import {
  RealTravelMap,
  type MapViewLevel,
  type RealTravelMapHandle,
} from "@/components/app/real-travel-map"
import { COMMERCIAL_SERVICES } from "@/lib/commercial-services"
import { isCredentialUsable } from "@/lib/credential-status"
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
  region: KoreaRegionId
  coverageKm?: number
  timing: string
  priceLabel: string
  benefitLabel?: string
  eligible: boolean
  sourceLabel: string
  searchAliases: string[]
}

const LAYERS: Array<{ id: MapLayer; ko: string; en: string; icon: LucideIcon }> = [
  { id: "nearby", ko: "둘러보기", en: "Explore", icon: MapPinned },
  { id: "experience", ko: "체험", en: "Activities", icon: Landmark },
  { id: "food", ko: "먹기", en: "Eat", icon: Utensils },
  { id: "mobility", ko: "이동", en: "Move", icon: TrainFront },
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
    id: "place-bukchon", region: "capital", geo: { latitude: 37.5826, longitude: 126.983 },
    title: { ko: "북촌 한옥마을", en: "Bukchon Hanok Village" },
    subtitle: { ko: "서울 종로구 · 골목과 공예", en: "Jongno, Seoul · alleys and craft" },
    description: { ko: "한옥 골목과 작은 공방을 따라 천천히 걷기 좋은 여행 시작점이에요.", en: "A calm starting point for hanok alleys, small studios and local stories." },
  },
  {
    id: "place-hongdae", region: "capital", geo: { latitude: 37.557, longitude: 126.924 },
    title: { ko: "홍대·연남", en: "Hongdae · Yeonnam" },
    subtitle: { ko: "서울 마포구 · 음악과 동네 산책", en: "Mapo, Seoul · music and neighborhood walks" },
    description: { ko: "작은 공연, 카페, 언어교환과 늦은 식사가 한 동선에 이어지는 지역이에요.", en: "A district where small shows, cafés, language exchange and late meals connect naturally." },
  },
  {
    id: "place-hangang", region: "capital", geo: { latitude: 37.528, longitude: 126.934 },
    title: { ko: "여의도 한강공원", en: "Yeouido Hangang Park" },
    subtitle: { ko: "서울 영등포구 · 강변 피크닉", en: "Yeongdeungpo, Seoul · riverside picnic" },
    description: { ko: "걷기, 자전거, 피크닉과 소규모 액티비티가 강을 따라 연결되는 장소예요.", en: "A riverside place for walks, bikes, picnics and small group activities." },
  },
  {
    id: "place-namsan", region: "capital", geo: { latitude: 37.551, longitude: 126.988 },
    title: { ko: "남산", en: "Namsan" },
    subtitle: { ko: "서울 중구 · 산책과 야경", en: "Jung-gu, Seoul · walks and night views" },
    description: { ko: "도심의 길과 능선을 함께 읽으며 낮과 밤을 모두 즐길 수 있는 축이에요.", en: "An urban ridge connecting city walks, viewpoints and night scenery." },
  },
  {
    id: "place-gangneung", region: "gangwon", geo: { latitude: 37.752, longitude: 128.876 },
    title: { ko: "강릉 월화거리", en: "Gangneung Wolhwa Street" },
    subtitle: { ko: "강원 강릉 · 바다와 오래된 길", en: "Gangneung · coast and old town" },
    description: { ko: "동해의 바람, 시장, 오래된 철길 산책을 한 흐름으로 만나는 여행 시작점이에요.", en: "A starting point linking East Sea breezes, markets and an old railway walk." },
  },
  {
    id: "place-jeonju", region: "jeonju", geo: { latitude: 35.814, longitude: 127.153 },
    title: { ko: "전주 한옥마을", en: "Jeonju Hanok Village" },
    subtitle: { ko: "전북 전주 · 한옥과 음식", en: "Jeonju · hanok and local food" },
    description: { ko: "골목의 공예, 지역 음식, 야간 산책을 천천히 이어가기 좋은 권역이에요.", en: "A district for craft alleys, regional food and slow evening walks." },
  },
  {
    id: "place-gyeongju", region: "gyeongju", geo: { latitude: 35.838, longitude: 129.211 },
    title: { ko: "경주 황리단길", en: "Gyeongju Hwangnidan-gil" },
    subtitle: { ko: "경북 경주 · 신라 유산과 산책", en: "Gyeongju · Silla heritage and walks" },
    description: { ko: "고분과 골목, 박물관과 저녁 산책을 한 지역 안에서 연결할 수 있어요.", en: "Connect royal tombs, museums, alleys and an evening walk in one area." },
  },
  {
    id: "place-busan", region: "busan", geo: { latitude: 35.097, longitude: 129.031 },
    title: { ko: "부산 자갈치·남포", en: "Busan Jagalchi · Nampo" },
    subtitle: { ko: "부산 중구 · 바다와 시장", en: "Busan · sea and markets" },
    description: { ko: "항구 풍경과 시장 음식, 원도심 골목을 도보와 대중교통으로 이어가는 지역이에요.", en: "A harbor district linking market food, old-town alleys and waterfront views." },
  },
  {
    id: "place-jeju", region: "jeju", geo: { latitude: 33.458, longitude: 126.942 },
    title: { ko: "제주 성산", en: "Jeju Seongsan" },
    subtitle: { ko: "제주 동부 · 오름과 바다", en: "East Jeju · oreum and coast" },
    description: { ko: "일출, 오름, 해안 마을과 로컬 액티비티를 하루 동선으로 묶기 좋아요.", en: "A base for sunrise, oreum trails, coastal villages and local activities." },
  },
] as const

function regionForGeo(geo: TravelMapPoint["geo"]): KoreaRegionId {
  return KOREA_REGIONS.find((region) => {
    const [[south, west], [north, east]] = region.bounds
    return geo.latitude >= south && geo.latitude <= north
      && geo.longitude >= west && geo.longitude <= east
  })?.id ?? "capital"
}

function mapReturnHref(point: TravelMapPoint, branch?: ContextBranch) {
  const params = new URLSearchParams({
    contextId: point.id,
    contextLabel: point.title,
    region: point.region,
    focus: point.layer,
  })
  if (branch) params.set("branch", branch)
  return `/?${params.toString()}`
}

function contextualHref(href: string, point: TravelMapPoint, branch?: ContextBranch) {
  const [pathname, rawQuery = ""] = href.split("?")
  const params = new URLSearchParams(rawQuery)
  params.set("contextId", point.id)
  params.set("contextLabel", point.title)
  params.set("region", point.region)
  params.set("contextLat", String(point.geo.latitude))
  params.set("contextLng", String(point.geo.longitude))
  if (branch) params.set("branch", branch)
  params.set("returnTo", mapReturnHref(point, branch))
  return `${pathname}?${params.toString()}`
}

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
      region: regionForGeo(item.geo ?? { latitude: 37.5665, longitude: 126.978 }),
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
      region: regionForGeo(service.geo),
      coverageKm: service.coverageKm,
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
    region: regionForGeo(activity.geo ?? { latitude: 37.5665, longitude: 126.978 }),
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
    region: place.region,
    timing: ko ? "지금 둘러보기 좋아요" : "Good to explore now",
    priceLabel: ko ? "여행 시작점" : "Trip starting point",
    eligible: true,
    sourceLabel: ko ? "K-Tour 지역 큐레이션 · 오늘 갱신" : "K-Tour local curation · updated today",
    searchAliases: [place.title.ko, place.title.en, place.subtitle.ko, place.subtitle.en, place.description.ko, place.description.en],
  }))

  return [...placePoints, ...marketplacePoints, ...partnerPoints, ...activityPoints]
}

export function TravelAtlasMap() {
  const { session, vouchers } = useApp()
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
  const [mapUnavailable, setMapUnavailable] = useState(false)
  const heritageLayer = true
  const [routePreview, setRoutePreview] = useState(false)
  const [contextBranch, setContextBranch] = useState<ContextBranch>(null)
  const [mapLevel, setMapLevel] = useState<MapViewLevel>("nation")
  const [mapRegionId, setMapRegionId] = useState<KoreaRegionId | undefined>()
  const [hasMapSelection, setHasMapSelection] = useState(false)
  const [focusToken, setFocusToken] = useState(0)
  const realMapRef = useRef<RealTravelMapHandle>(null)
  const headerRef = useRef<HTMLElement>(null)
  const sheetRef = useRef<HTMLElement>(null)
  const [topChromeHeight, setTopChromeHeight] = useState(164)
  const [bottomChromeHeight, setBottomChromeHeight] = useState(220)
  const [locationNoticeDismissed, setLocationNoticeDismissed] = useState(false)
  const [searchScope, setSearchScope] = useState<"nation" | "region">("nation")
  const searchingNationwide = query.trim().length > 0 && searchScope === "nation"

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
      if (layer === "experience" && point.layer !== "experience" && point.layer !== "together") return false
      if (layer !== "nearby" && layer !== "benefit" && layer !== "experience" && point.layer !== layer) return false
      if (!normalizedQuery) return true
      return [point.title, point.subtitle, point.description, ...point.searchAliases]
        .some((value) => value.toLowerCase().includes(normalizedQuery))
    })
  }, [allPoints, layer, query])

  const shownPoints = useMemo(() => {
    const activeRegion = mapRegionId
      ? KOREA_REGIONS.find((region) => region.id === mapRegionId)
      : undefined
    const scoped = activeRegion && mapLevel !== "nation" && !searchingNationwide
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
  }, [filteredPoints, layer, location, locationStatus, mapLevel, mapRegionId, persona.firstItemId, searchingNationwide])

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

  useEffect(() => {
    if (!searchingNationwide) return
    realMapRef.current?.showKorea()
    setHasMapSelection(false)
    setExpanded(false)
    setRoutePreview(false)
    setContextBranch(null)
  }, [searchingNationwide])

  const contextualPartners = contextBranch && selected
    ? allPoints
      .filter((point) => point.kind === "partner" && point.layer === contextBranch)
      .filter((point) => contextBranch !== "mobility" || point.id !== "kakao-t-airport" || /(공항|airport)/i.test(`${selected.title} ${selected.subtitle}`))
      .map((point) => ({ point, distance: distanceKm(selected.geo, point.geo) }))
      .filter(({ point, distance }) => distance <= (point.coverageKm ?? 0))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2)
      .map(({ point }) => point)
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
    const rawFocus = params.get("focus")
    const focus = rawFocus === "together" ? "experience" : rawFocus
    const requestedRegion = params.get("region")
    if (focus && LAYERS.some((item) => item.id === focus)) setLayer(focus as MapLayer)
    if (requestedRegion && KOREA_REGIONS.some((region) => region.id === requestedRegion)) {
      const regionId = requestedRegion as KoreaRegionId
      setMapLevel("region")
      setMapRegionId(regionId)
      window.requestAnimationFrame(() => realMapRef.current?.showRegion(regionId))
    }
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
    ? (ko ? "대한민국" : "Korea")
    : mapRegion
      ? (ko ? `${mapRegion.name.ko} · ${mapRegion.hook.ko}` : `${mapRegion.name.en} · explore`)
      : locationStatus === "granted" && location
        ? (locationInView ? (ko ? `${location.areaKo} 주변` : `Near ${location.areaEn}`) : (ko ? `현재 ${location.areaKo}` : `Currently ${location.areaEn}`))
        : (ko ? "대한민국 여행" : "Travel Korea")

  const showNation = () => {
    realMapRef.current?.showKorea()
    setSearchScope("nation")
    setHasMapSelection(false)
    setExpanded(false)
    setRoutePreview(false)
    setContextBranch(null)
  }

  const showAtlasOverview = mapLevel === "nation"
    && !listMode
    && !query.trim()
    && !hasMapSelection

  return (
    <main className="relative h-[100dvh] overflow-hidden bg-[#e7e3d8]" data-experiment-variant="map-first-b">
      <div className="absolute inset-0 bottom-[calc(88px+env(safe-area-inset-bottom))] overflow-hidden">
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
              if (query.trim()) setSearchScope(level === "nation" ? "nation" : "region")
              if (level !== "place") setHasMapSelection(false)
            }}
            onUnavailable={() => {
              setMapUnavailable(true)
              setListMode(true)
            }}
          />
        </div>

        {showAtlasOverview && (
          <section
            className="modern-atlas-overview"
            style={{ "--atlas-top-chrome": `${topChromeHeight}px` } as CSSProperties}
            aria-label={ko ? "대한민국 여행 권역" : "Travel regions of Korea"}
          >
            <ModernKoreaAtlas
              lang={lang}
              regionCounts={regionCounts}
              currentRegionId={locationStatus === "granted" && location ? regionForGeo(location) : undefined}
              onRegionSelect={(regionId) => realMapRef.current?.showRegion(regionId)}
            />
          </section>
        )}

        <header ref={headerRef} className="safe-top pointer-events-none absolute inset-x-0 top-0 z-30 px-4">
          <div className="pointer-events-auto flex items-center justify-between">
            <button type="button" onClick={showNation} aria-label={ko ? "대한민국 전체 지도 보기" : "Show the whole Korea map"} className="pressable flex min-w-0 items-center gap-2.5 rounded-full bg-[#fbfaf6]/94 px-3 py-2 text-left shadow-[0_8px_24px_rgba(24,24,20,.10)] backdrop-blur-xl ring-1 ring-black/5">
              <Logo size={24} />
              <div className="min-w-0">
                <p className="truncate font-display text-[15px] font-semibold leading-none">{ko ? "K-Tour Map" : "K-Tour Map"}</p>
                <p className="mt-1 truncate text-[12px] font-medium text-muted-foreground">{mapContext}</p>
              </div>
            </button>
            <div className="pointer-events-auto rounded-full bg-[#fbfaf6]/94 text-foreground shadow-sm ring-1 ring-black/5"><LangToggle /></div>
          </div>

          <div className="pointer-events-auto mt-2.5 flex min-h-12 items-center gap-2 rounded-[17px] bg-[#fbfaf6]/96 px-3 shadow-[0_8px_24px_rgba(24,24,20,.11)] backdrop-blur-xl ring-1 ring-black/5">
            <Search className="h-5 w-5 flex-shrink-0 text-primary" />
            <input
              value={query}
              onChange={(event) => {
                const next = event.target.value
                if (!query.trim() && next.trim()) setSearchScope("nation")
                setQuery(next)
              }}
              placeholder={ko ? "어디로 떠나볼까요?" : "Where shall we go?"}
              aria-label={ko ? "장소와 액티비티 검색" : "Search places and activities"}
              className="h-11 min-w-0 flex-1 bg-transparent text-[14px] font-medium outline-none placeholder:text-muted-foreground"
            />
            {query ? <button type="button" onClick={() => setQuery("")} aria-label={ko ? "검색어 지우기" : "Clear search"} className="pressable grid h-11 w-11 place-items-center rounded-full bg-secondary"><X className="h-4 w-4" /></button> : mapLevel !== "nation" ? <button type="button" onClick={showNation} className="pressable min-h-11 rounded-full bg-secondary px-3 text-[12px] font-semibold text-foreground">{ko ? "전국" : "All Korea"}</button> : null}
          </div>

          <div className="no-scrollbar pointer-events-auto -mx-4 mt-2 flex gap-1.5 overflow-x-auto px-4 pb-2">
            {LAYERS.map(({ id, ko: labelKo, en: labelEn, icon: Icon }) => {
              const active = layer === id
              const visibleLabel = ko ? labelKo : labelEn
              return (
                <button key={id} type="button" onClick={() => selectLayer(id)} aria-pressed={active} className={cn("pressable inline-flex min-h-10 flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-semibold ring-1", active ? "bg-ink text-white ring-ink" : "bg-[#fbfaf6]/94 text-foreground ring-black/5")}>
                  <Icon className={cn("h-3.5 w-3.5", active ? "text-[#d8b869]" : "text-primary")} />{visibleLabel}
                </button>
              )
            })}
          </div>
        </header>

        <div className="atlas-tools absolute right-3 z-20 flex flex-col gap-2" style={{ top: topChromeHeight + 8 }}>
          <button type="button" onClick={() => setListMode((value) => !value)} aria-pressed={listMode} className="pressable grid h-11 w-11 place-items-center rounded-full bg-[#fbfaf6]/96 text-foreground shadow-[0_8px_20px_rgba(24,24,20,.10)] ring-1 ring-black/5" aria-label={listMode ? (ko ? "지도 보기" : "Show map") : (ko ? "목록 보기" : "Show list")}>
            {listMode ? <MapPinned className="h-[18px] w-[18px]" /> : <List className="h-[18px] w-[18px]" />}
          </button>
          <button type="button" onClick={async () => { if (locationStatus === "granted" && location) realMapRef.current?.flyToLocation(location); else await requestLocation() }} disabled={locationStatus === "requesting"} className="pressable grid h-11 w-11 place-items-center rounded-full bg-primary text-white shadow-[0_8px_20px_rgba(179,68,56,.24)] disabled:opacity-55" aria-label={ko ? "내 위치로 이동" : "Use my location"}><LocateFixed className={cn("h-[18px] w-[18px]", locationStatus === "requesting" && "animate-pulse")} /></button>
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
            <p className="mt-1 text-[12px] leading-5 text-muted-foreground">{ko ? "검색어와 지도 레이어를 초기화하고 전국 지도로 돌아가 보세요." : "Clear the search and layer, then return to the whole Korea map."}</p>
            <button type="button" onClick={() => { setQuery(""); selectLayer("nearby"); showNation() }} className="pressable mt-4 min-h-11 rounded-full bg-ink px-5 text-[12px] font-semibold text-white">{ko ? "전국 지도에서 다시 찾기" : "Search all Korea again"}</button>
          </section>
        )}

        {listMode && (
          <section className="atlas-results absolute inset-x-3 bottom-3 z-10 overflow-hidden rounded-[24px] bg-[#fbfaf6]/96 shadow-[0_18px_50px_rgba(24,24,20,.18)] backdrop-blur-xl ring-1 ring-black/5" style={{ top: topChromeHeight }} aria-label={ko ? "지도 결과 목록" : "Map results list"}>
                <div className="flex items-center justify-between border-b border-foreground/10 px-5 py-4"><div><p className="text-[12px] font-semibold tracking-[0.06em] text-primary">{searchingNationwide ? (ko ? "전국 검색 · 목록 보기" : "ALL KOREA · LIST VIEW") : (ko ? "같은 필터 · 목록 보기" : "SAME FILTER · LIST VIEW")}</p><h2 className="mt-1 text-[18px] font-semibold">{shownPoints.length}{ko ? "개의 선택" : " choices"}</h2></div><button type="button" onClick={() => setListMode(false)} className="pressable grid h-11 w-11 place-items-center rounded-full bg-secondary" aria-label={ko ? "지도 돌아가기" : "Back to map"}><X className="h-4 w-4" /></button></div>
            <div className="h-[calc(100%-77px)] overflow-y-auto px-5 pb-6">
              {shownPoints.length === 0 ? <p className="py-10 text-center text-[13px] text-muted-foreground">{ko ? "이 조건에 맞는 장소가 없어요. 필터를 바꿔보세요." : "No places match these filters yet."}</p> : shownPoints.map((point) => {
                const Icon = POINT_ICONS[point.layer]
                const proximity = pointProximityLabel(point.geo, locationStatus === "granted" ? location : null, lang)
                return <button key={`${point.kind}:${point.id}`} type="button" onClick={() => { selectPoint(point); setListMode(false) }} className="pressable flex w-full items-start gap-3 border-b border-foreground/10 py-4 text-left"><span className={cn("atlas-list-icon", `atlas-list-icon-${point.layer}`)}><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold">{point.title}</span><span className="mt-1 block truncate text-[12px] text-muted-foreground">{point.subtitle}</span><span className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px]">{proximity && <span className="font-semibold text-success">{proximity}</span>}<span className="font-medium text-foreground">{point.timing}</span>{point.benefitLabel && <span className="rounded-full bg-primary/8 px-2 py-0.5 font-semibold text-primary">{point.benefitLabel}</span>}</span></span><ChevronRight className="mt-2 h-4 w-4 flex-shrink-0 text-muted-foreground" /></button>
              })}
            </div>
          </section>
        )}

        {!listMode && selected && hasMapSelection && (
          <section ref={sheetRef} className="atlas-sheet absolute inset-x-3 bottom-3 z-30 rounded-[24px] bg-[#fbfaf6]/98 px-5 shadow-[0_20px_52px_rgba(24,24,20,.20)] backdrop-blur-xl ring-1 ring-black/5" aria-live="polite">
            <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} className="pressable flex min-h-11 w-full items-center justify-center" aria-label={expanded ? (ko ? "정보 접기" : "Collapse details") : (ko ? "정보 펼치기" : "Expand details")}><span className="sheet-grabber" /></button>
            {routePreview && <div className="mb-3 flex items-center gap-3 border-y border-foreground/10 py-3"><Navigation className="h-4 w-4 flex-shrink-0 text-success" /><div className="min-w-0 flex-1"><p className="text-[13px] font-semibold text-success">{routeSummary}</p><p className="mt-0.5 text-[12px] text-muted-foreground">{ko ? "방향 참고선 · 실제 도보 경로가 아니에요" : "Direction guide · not a walking route"}</p></div><button type="button" onClick={() => setRoutePreview(false)} className="pressable grid h-11 w-11 place-items-center rounded-full" aria-label={ko ? "방향 안내 닫기" : "Close direction guide"}><X className="h-4 w-4" /></button></div>}
            <div className="flex items-start gap-3">
              {expanded && selected.image ? <img src={selected.image} alt="" className="h-20 w-20 flex-shrink-0 rounded-[14px] object-cover" /> : <span className={cn("atlas-card-icon", `atlas-card-icon-${selected.layer}`)}>{(() => { const Icon = POINT_ICONS[selected.layer]; return <Icon className="h-5 w-5" /> })()}</span>}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5"><p className="truncate text-[12px] font-medium text-primary">{selected.subtitle}</p>{selected.kind === "activity" && <BadgeCheck className="h-3.5 w-3.5 flex-shrink-0 text-success" />}</div>
                <h1 className="font-display mt-1 text-balance text-[21px] font-semibold leading-[1.22] tracking-[-0.025em]">{selected.title}</h1>
                <p className="mt-2 text-[12px] font-medium text-muted-foreground"><span className="font-semibold text-foreground">{selected.timing}</span> · <span className="font-semibold text-foreground">{selected.priceLabel}</span></p>
              </div>
            </div>

            {(selected.benefitLabel || selected.eligible) && <div className="mt-3 flex items-center gap-2 border-t border-foreground/10 pt-3 text-[12px]">
              {selected.benefitLabel && <span className="inline-flex min-w-0 items-center gap-1 font-semibold text-primary"><Gift className="h-3.5 w-3.5 flex-shrink-0" /><span className="truncate">{selectedVoucher ? selectedVoucher.title : selected.benefitLabel}</span></span>}
              {selected.eligible && <span className="ml-auto inline-flex flex-shrink-0 items-center gap-1 font-semibold text-success"><BadgeCheck className="h-3.5 w-3.5" />{credentialActive ? (ko ? "내 ID 이용 가능" : "ID eligible") : (ko ? "ID 갱신 필요" : "Renew ID")}</span>}
            </div>}

            {expanded && <p className="mt-3 text-[13px] leading-5 text-muted-foreground">{selected.description}</p>}

            {expanded && selected.kind !== "partner" && (
              <section className="mt-4 border-t border-foreground/10 pt-3" aria-label={ko ? "이 장소에서 이어지는 서비스" : "Services branching from this place"}>
                <p className="text-[12px] font-semibold text-muted-foreground">{ko ? "이 장소에서 이어가기" : "Continue from here"}</p>
                <div className="mt-1 divide-y divide-foreground/10 border-y border-foreground/10">
                  <button type="button" onClick={() => setContextBranch((value) => value === "mobility" ? null : "mobility")} aria-pressed={contextBranch === "mobility"} className="pressable flex min-h-12 w-full items-center gap-3 text-left text-[13px] font-semibold"><TrainFront className={cn("h-4 w-4", contextBranch === "mobility" ? "text-primary" : "text-muted-foreground")} /><span className="flex-1">{ko ? "가는 방법" : "How to get there"}</span><ChevronRight className="h-4 w-4 text-muted-foreground" /></button>
                  <button type="button" onClick={() => setContextBranch((value) => value === "food" ? null : "food")} aria-pressed={contextBranch === "food"} className="pressable flex min-h-12 w-full items-center gap-3 text-left text-[13px] font-semibold"><Utensils className={cn("h-4 w-4", contextBranch === "food" ? "text-primary" : "text-muted-foreground")} /><span className="flex-1">{ko ? "전후 식사" : "Food before or after"}</span><ChevronRight className="h-4 w-4 text-muted-foreground" /></button>
                </div>
                {contextBranch && contextualPartners.length > 0 && (
                  <div className="mt-2 divide-y divide-foreground/10 border-b border-foreground/10 px-1">
                    {contextualPartners.map((partner) => (
                      <Link key={partner.id} href={contextualHref(partner.href, selected, contextBranch)} className="pressable flex min-h-14 items-center gap-3 py-2.5">
                        <span className={cn("atlas-list-icon h-9 w-9", `atlas-list-icon-${partner.layer}`)}>{(() => { const Icon = POINT_ICONS[partner.layer]; return <Icon className="h-4 w-4" /> })()}</span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-semibold">{partner.title}</span><span className="mt-0.5 block truncate text-[12px] text-muted-foreground">{partner.subtitle} · {partner.priceLabel}</span></span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                )}
                {contextBranch && contextualPartners.length === 0 && (
                  <div className="mt-2 border-b border-foreground/10 px-1 py-3 text-[12px] font-medium leading-5 text-muted-foreground" role="status">
                    {contextBranch === "food"
                      ? (ko ? "이 장소까지 배달 가능한 연동 파트너가 아직 없어요. 지역 체험은 계속 둘러볼 수 있어요." : "No connected delivery partner covers this place yet. You can still explore local activities.")
                      : (ko ? "이 장소를 출발지로 지원하는 연동 이동 서비스가 아직 없어요. 지도에서 지역 교통 정보를 확인해 주세요." : "No connected mobility service supports this starting point yet. Check local transport information on the map.")}
                  </div>
                )}
              </section>
            )}

            {expanded && <div className="mt-3 flex items-center justify-between gap-3 text-[12px] text-muted-foreground"><span className="truncate">{selected.sourceLabel}</span><span className="inline-flex flex-shrink-0 items-center gap-1 text-success"><BadgeCheck className="h-3.5 w-3.5" />{ko ? "정보 확인" : "Checked"}</span></div>}

            <div className="mt-4 grid grid-cols-[44px_1fr] gap-2 pb-4">
              <button type="button" onClick={async () => { if (locationStatus !== "granted") await requestLocation(); setRoutePreview(true) }} aria-label={ko ? "직선거리와 방향 보기" : "Show straight-line distance and direction"} className={cn("pressable grid min-h-12 place-items-center rounded-[14px] ring-1", routePreview ? "bg-ink text-white ring-ink" : "bg-card text-foreground ring-border")}><Navigation className="h-[18px] w-[18px]" /></button>
              <Link href={contextualHref(selected.href, selected)} className="pressable flex min-h-12 items-center justify-between rounded-[14px] bg-primary px-4 text-[13px] font-semibold text-white"><span>{selected.kind === "activity" ? (ko ? "참여 조건 보기" : "Review and join") : selected.kind === "place" ? (ko ? "이 지역 체험 보기" : "See experiences in this region") : selected.kind === "partner" ? (ko ? "옵션·예상 금액 보기" : "See options and estimate") : selected.layer === "mobility" ? (ko ? "이용권 상세 보기" : "See pass details") : selected.layer === "food" ? (ko ? "주문 조건 보기" : "See order details") : (ko ? "예약·혜택 보기" : "See booking and benefit")}</span><ChevronRight className="h-4 w-4" /></Link>
            </div>
          </section>
        )}

      </div>

      <div className="sr-only" aria-live="polite">{selected && hasMapSelection ? `${selected.title}. ${selected.subtitle}. ${selected.timing}.` : ko ? "대한민국 여행지도" : "Korea travel map"}</div>
      {mapUnavailable && <div className="sr-only" role="status" aria-live="assertive">{ko ? "지도를 사용할 수 없어 여행지 목록으로 전환했어요." : "The map is unavailable, so the destination list is now shown."}</div>}
    </main>
  )
}
