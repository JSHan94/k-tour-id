"use client"

import type { CSSProperties } from "react"
import { useMemo, useState } from "react"
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Compass,
  CreditCard,
  ExternalLink,
  Filter,
  Heart,
  Languages,
  List,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  MessageCircle,
  Moon,
  Navigation,
  Search,
  ShieldCheck,
  Sparkles,
  SunMedium,
  UserRound,
  Users,
  Utensils,
  WalletCards,
  X,
} from "lucide-react"
import { KOREA_OUTLINE_COORDINATES, type KoreaRegionId } from "@/lib/map/korea-atlas-data"
import styles from "./ondo-prototype.module.css"

type Lang = "en" | "ko"
type TabId = "ondo" | "saved" | "connect" | "id"
type TimeId = "now" | "dinner" | "late"
type HeatLevel = "low" | "warming" | "rising" | "hot" | "peak" | "limited"

type Localized = { en: string; ko: string }

type Venue = {
  id: string
  cityId: KoreaRegionId
  neighborhoodId: string
  name: Localized
  food: Localized
  image: string
  score: number
  level: HeatLevel
  updated: Localized
  signalCount: number
  reason: Localized
  price: string
  distance: Localized
  open: boolean
  late?: boolean
  alcohol?: boolean
  position: { x: number; y: number }
  facts: Localized[]
}

type Neighborhood = {
  id: string
  cityId: KoreaRegionId
  name: Localized
  score: number | null
  level: HeatLevel
  updated: Localized
  signalCount: number
  trend: Localized
  position: { x: number; y: number }
}

type City = {
  id: KoreaRegionId
  name: Localized
  shortName: Localized
  score: number | null
  level: HeatLevel
  signalCount: number
  updated: Localized
  position: { x: number; y: number }
}

const HEAT: Record<HeatLevel, { color: string; label: Localized }> = {
  low: { color: "#EFE1B7", label: { en: "Low pulse", ko: "미온" } },
  warming: { color: "#EBC463", label: { en: "Warming", ko: "데워지는 중" } },
  rising: { color: "#E6843B", label: { en: "Rising", ko: "들썩임" } },
  hot: { color: "#C94832", label: { en: "Hot", ko: "지금 핫함" } },
  peak: { color: "#7A2048", label: { en: "Peak", ko: "피크" } },
  limited: { color: "#CFCAC0", label: { en: "Limited signals", ko: "신호 부족" } },
}

const CITIES: City[] = [
  { id: "capital", name: { en: "Seoul", ko: "서울" }, shortName: { en: "Seoul", ko: "서울" }, score: 87, level: "hot", signalCount: 142, updated: { en: "8 min ago", ko: "8분 전" }, position: { x: 37, y: 24 } },
  { id: "gangwon", name: { en: "Gangwon", ko: "강원" }, shortName: { en: "Gangwon", ko: "강원" }, score: null, level: "limited", signalCount: 4, updated: { en: "gathering signals", ko: "신호 수집 중" }, position: { x: 66, y: 25 } },
  { id: "jeonju", name: { en: "Jeonju", ko: "전주" }, shortName: { en: "Jeonju", ko: "전주" }, score: 62, level: "rising", signalCount: 34, updated: { en: "21 min ago", ko: "21분 전" }, position: { x: 37, y: 57 } },
  { id: "gyeongju", name: { en: "Gyeongju", ko: "경주" }, shortName: { en: "Gyeongju", ko: "경주" }, score: 54, level: "warming", signalCount: 27, updated: { en: "31 min ago", ko: "31분 전" }, position: { x: 66, y: 55 } },
  { id: "busan", name: { en: "Busan", ko: "부산" }, shortName: { en: "Busan", ko: "부산" }, score: 76, level: "hot", signalCount: 78, updated: { en: "14 min ago", ko: "14분 전" }, position: { x: 69, y: 70 } },
  { id: "jeju", name: { en: "Jeju", ko: "제주" }, shortName: { en: "Jeju", ko: "제주" }, score: 45, level: "warming", signalCount: 19, updated: { en: "39 min ago", ko: "39분 전" }, position: { x: 45, y: 88 } },
]

const NEIGHBORHOODS: Neighborhood[] = [
  { id: "seongsu", cityId: "capital", name: { en: "Seongsu", ko: "성수" }, score: 92, level: "peak", updated: { en: "8 min ago", ko: "8분 전" }, signalCount: 38, trend: { en: "Dinner interest rising fast", ko: "저녁 관심도가 빠르게 상승 중" }, position: { x: 67, y: 38 } },
  { id: "euljiro", cityId: "capital", name: { en: "Euljiro", ko: "을지로" }, score: 81, level: "hot", updated: { en: "14 min ago", ko: "14분 전" }, signalCount: 24, trend: { en: "Late-night meals are heating up", ko: "야식 신호가 뜨거워지는 중" }, position: { x: 46, y: 56 } },
  { id: "mangwon", cityId: "capital", name: { en: "Mangwon", ko: "망원" }, score: 58, level: "warming", updated: { en: "27 min ago", ko: "27분 전" }, signalCount: 11, trend: { en: "A calmer local alternative", ko: "조금 더 여유로운 로컬 대안" }, position: { x: 23, y: 43 } },
  { id: "hongdae", cityId: "capital", name: { en: "Hongdae", ko: "홍대" }, score: 73, level: "rising", updated: { en: "18 min ago", ko: "18분 전" }, signalCount: 29, trend: { en: "Street food picks are rising", ko: "길거리 음식 관심이 상승 중" }, position: { x: 29, y: 67 } },
  { id: "jagalchi", cityId: "busan", name: { en: "Jagalchi", ko: "자갈치" }, score: 84, level: "hot", updated: { en: "12 min ago", ko: "12분 전" }, signalCount: 31, trend: { en: "Seafood dinner is peaking", ko: "해산물 저녁 신호가 상승 중" }, position: { x: 40, y: 60 } },
  { id: "jeonpo", cityId: "busan", name: { en: "Jeonpo", ko: "전포" }, score: 68, level: "rising", updated: { en: "20 min ago", ko: "20분 전" }, signalCount: 18, trend: { en: "Cafe and dessert saves are rising", ko: "카페와 디저트 저장이 늘어나는 중" }, position: { x: 64, y: 37 } },
  { id: "aewol", cityId: "jeju", name: { en: "Aewol", ko: "애월" }, score: 56, level: "warming", updated: { en: "32 min ago", ko: "32분 전" }, signalCount: 9, trend: { en: "Sunset dining is warming", ko: "노을 저녁 신호가 데워지는 중" }, position: { x: 32, y: 40 } },
  { id: "dongmun", cityId: "jeju", name: { en: "Dongmun Market", ko: "동문시장" }, score: 71, level: "rising", updated: { en: "22 min ago", ko: "22분 전" }, signalCount: 16, trend: { en: "Market snacks are rising", ko: "시장 간식 관심이 상승 중" }, position: { x: 61, y: 62 } },
]

const VENUES: Venue[] = [
  {
    id: "seongsu-gukbap",
    cityId: "capital",
    neighborhoodId: "seongsu",
    name: { en: "Seongsu Dwaeji Gukbap", ko: "성수 돼지국밥" },
    food: { en: "Pork soup · local dinner", ko: "돼지국밥 · 로컬 저녁" },
    image: "/korean-kimchi-stew.png",
    score: 92,
    level: "peak",
    updated: { en: "8 min ago", ko: "8분 전" },
    signalCount: 14,
    reason: { en: "Locals are ordering the spicy soup after work.", ko: "퇴근 후 얼큰한 국밥을 찾는 로컬 신호가 몰리고 있어요." },
    price: "₩10,000–15,000",
    distance: { en: "8 min walk", ko: "도보 8분" },
    open: true,
    position: { x: 69, y: 43 },
    facts: [
      { en: "Walk-in OK", ko: "현장 이용 가능" },
      { en: "Foreign cards accepted", ko: "해외카드 가능" },
      { en: "English menu available", ko: "영문 메뉴 있음" },
    ],
  },
  {
    id: "seongsu-tteokbokki",
    cityId: "capital",
    neighborhoodId: "seongsu",
    name: { en: "Grandma's Tteokbokki", ko: "할머니 떡볶이" },
    food: { en: "Street food · quick bite", ko: "분식 · 간단한 한 끼" },
    image: "/images/tteokbokki.png",
    score: 79,
    level: "hot",
    updated: { en: "17 min ago", ko: "17분 전" },
    signalCount: 9,
    reason: { en: "The mild sauce is trending with first-time visitors.", ko: "순한맛 소스가 첫 방문 여행자 사이에서 뜨고 있어요." },
    price: "₩5,000–10,000",
    distance: { en: "11 min walk", ko: "도보 11분" },
    open: true,
    position: { x: 74, y: 31 },
    facts: [
      { en: "No Korean phone needed", ko: "한국 전화번호 불필요" },
      { en: "Order at the counter", ko: "카운터 주문" },
      { en: "Mild option available", ko: "순한맛 가능" },
    ],
  },
  {
    id: "euljiro-nogari",
    cityId: "capital",
    neighborhoodId: "euljiro",
    name: { en: "Euljiro Nogari Alley", ko: "을지로 노가리 골목" },
    food: { en: "Dried pollack · beer", ko: "노가리 · 맥주" },
    image: "/korean-fried-chicken.png",
    score: 84,
    level: "hot",
    updated: { en: "14 min ago", ko: "14분 전" },
    signalCount: 18,
    reason: { en: "Outdoor tables are filling up for the evening.", ko: "저녁 야외 테이블 신호가 빠르게 늘고 있어요." },
    price: "₩15,000–25,000",
    distance: { en: "3 min from Euljiro 3-ga", ko: "을지로3가역 3분" },
    open: true,
    late: true,
    alcohol: true,
    position: { x: 49, y: 61 },
    facts: [
      { en: "19+ for alcohol", ko: "주류 이용 시 19+" },
      { en: "Walk-in only", ko: "현장 대기만 가능" },
      { en: "Shared outdoor seating", ko: "야외 합석 좌석" },
    ],
  },
  {
    id: "mangwon-kalguksu",
    cityId: "capital",
    neighborhoodId: "mangwon",
    name: { en: "Mangwon Market Kalguksu", ko: "망원시장 칼국수" },
    food: { en: "Noodles · market meal", ko: "칼국수 · 시장 한 끼" },
    image: "/korean-bibimbap.png",
    score: 58,
    level: "warming",
    updated: { en: "27 min ago", ko: "27분 전" },
    signalCount: 7,
    reason: { en: "A calmer alternative to the busiest dinner zones.", ko: "붐비는 저녁 지역 대신 찾는 여유로운 대안이에요." },
    price: "₩7,000–10,000",
    distance: { en: "6 min walk", ko: "도보 6분" },
    open: true,
    position: { x: 22, y: 48 },
    facts: [
      { en: "Solo dining friendly", ko: "혼밥 가능" },
      { en: "Cash or Korean card preferred", ko: "현금·국내카드 권장" },
      { en: "Photo menu", ko: "사진 메뉴 있음" },
    ],
  },
  {
    id: "jagalchi-grill",
    cityId: "busan",
    neighborhoodId: "jagalchi",
    name: { en: "Jagalchi Charcoal Mackerel", ko: "자갈치 숯불 고등어" },
    food: { en: "Grilled fish · Busan dinner", ko: "생선구이 · 부산 저녁" },
    image: "/editorial-neighborhood-meal.jpg",
    score: 84,
    level: "hot",
    updated: { en: "12 min ago", ko: "12분 전" },
    signalCount: 12,
    reason: { en: "Fresh grilled fish is the strongest local dinner signal.", ko: "신선한 생선구이가 오늘 가장 강한 로컬 저녁 신호예요." },
    price: "₩15,000–25,000",
    distance: { en: "5 min from the market", ko: "시장 도보 5분" },
    open: true,
    position: { x: 42, y: 65 },
    facts: [
      { en: "Foreign cards accepted", ko: "해외카드 가능" },
      { en: "English picture menu", ko: "영문 사진 메뉴" },
      { en: "Counter seating available", ko: "카운터 좌석 있음" },
    ],
  },
  {
    id: "jeonpo-cafe",
    cityId: "busan",
    neighborhoodId: "jeonpo",
    name: { en: "Jeonpo Roastery", ko: "전포 로스터리" },
    food: { en: "Coffee · dessert", ko: "커피 · 디저트" },
    image: "/korean-tea-ceremony.png",
    score: 68,
    level: "rising",
    updated: { en: "20 min ago", ko: "20분 전" },
    signalCount: 8,
    reason: { en: "Afternoon saves are rising among local café regulars.", ko: "로컬 카페 단골의 오후 저장 신호가 오르는 중이에요." },
    price: "₩6,000–12,000",
    distance: { en: "4 min walk", ko: "도보 4분" },
    open: true,
    position: { x: 66, y: 42 },
    facts: [
      { en: "English menu", ko: "영문 메뉴" },
      { en: "Wi-Fi available", ko: "와이파이 가능" },
      { en: "No reservation needed", ko: "예약 불필요" },
    ],
  },
]

const TABLES = [
  {
    id: "table-euljiro",
    venueId: "euljiro-nogari",
    title: { en: "Euljiro night bites", ko: "을지로 야식 한 상" },
    time: { en: "Tonight · 8:30 PM", ko: "오늘 · 오후 8:30" },
    host: { en: "Hosted by Jieun · Area regular", ko: "지은 호스트 · 지역 단골" },
    seats: "3 / 5",
    language: "한국어 · English",
    price: "~₩25,000",
    alcohol: true,
  },
  {
    id: "table-seongsu",
    venueId: "seongsu-gukbap",
    title: { en: "First gukbap together", ko: "처음 먹는 국밥 같이" },
    time: { en: "Tomorrow · 7:00 PM", ko: "내일 · 오후 7:00" },
    host: { en: "Hosted by Minjun · Trusted contributor", ko: "민준 호스트 · 신뢰 기여자" },
    seats: "2 / 4",
    language: "English · 日本語",
    price: "~₩15,000",
    alcohol: false,
  },
]

const MAP_BOUNDS = { minLon: 125.72, maxLon: 129.72, minLat: 33.02, maxLat: 38.62 }
const MAP_WIDTH = 300
const MAP_HEIGHT = 410

function project(lon: number, lat: number) {
  return {
    x: 24 + ((lon - MAP_BOUNDS.minLon) / (MAP_BOUNDS.maxLon - MAP_BOUNDS.minLon)) * 252,
    y: 20 + ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 360,
  }
}

function pointInRing(lon: number, lat: number, ring: readonly (readonly [number, number])[]) {
  let inside = false
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const [x, y] = ring[index]
    const [previousX, previousY] = ring[previous]
    const crosses = (y > lat) !== (previousY > lat)
      && lon < ((previousX - x) * (lat - y)) / (previousY - y) + x
    if (crosses) inside = !inside
  }
  return inside
}

function pointInKorea(lon: number, lat: number) {
  return KOREA_OUTLINE_COORDINATES.some((polygon) => polygon.some((ring) => pointInRing(lon, lat, ring)))
}

function nearestRegion(lon: number, lat: number): KoreaRegionId {
  const centers: Record<KoreaRegionId, readonly [number, number]> = {
    capital: [37.52, 126.98],
    gangwon: [37.62, 128.62],
    jeonju: [35.72, 127.08],
    gyeongju: [35.82, 128.88],
    busan: [35.18, 129.04],
    jeju: [33.38, 126.56],
  }
  return (Object.entries(centers) as [KoreaRegionId, readonly [number, number]][]).reduce(
    (best, [id, center]) => {
      const distance = (lat - center[0]) ** 2 + (lon - center[1]) ** 2
      return distance < best.distance ? { id, distance } : best
    },
    { id: "capital" as KoreaRegionId, distance: Number.POSITIVE_INFINITY },
  ).id
}

const MAP_DOTS = (() => {
  const dots: { id: string; x: number; y: number; regionId: KoreaRegionId }[] = []
  let row = 0
  for (let y = 24; y <= 379; y += 8) {
    const offset = row % 2 === 0 ? 0 : 4
    for (let x = 25 + offset; x <= 276; x += 8) {
      const lon = MAP_BOUNDS.minLon + ((x - 24) / 252) * (MAP_BOUNDS.maxLon - MAP_BOUNDS.minLon)
      const lat = MAP_BOUNDS.maxLat - ((y - 20) / 360) * (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)
      if (!pointInKorea(lon, lat)) continue
      dots.push({ id: `${row}-${Math.round(x)}`, x, y, regionId: nearestRegion(lon, lat) })
    }
    row += 1
  }
  return dots
})()

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ")
}

function localized(value: Localized, lang: Lang) {
  return value[lang]
}

function scoreLabel(score: number | null) {
  return score == null ? "—" : String(score)
}

function MapDots({ lang, onSelect }: { lang: Lang; onSelect: (id: KoreaRegionId) => void }) {
  const cityMap = useMemo(() => new Map(CITIES.map((city) => [city.id, city])), [])
  return (
    <div className={styles.koreaMap}>
      <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} role="img" aria-label={lang === "en" ? "ONDO heat across Korea" : "대한민국 ONDO 열기 지도"}>
        {MAP_DOTS.map((dot, index) => {
          const city = cityMap.get(dot.regionId)!
          const activeDot = (index + dot.regionId.length) % 4 !== 0
          return (
            <circle
              key={dot.id}
              cx={dot.x}
              cy={dot.y}
              r={activeDot ? 2.7 : 2.25}
              fill={activeDot ? HEAT[city.level].color : "#ded9cf"}
              opacity={activeDot ? 0.94 : 0.68}
              className={city.level === "limited" ? styles.limitedDot : undefined}
            />
          )
        })}
      </svg>
      {CITIES.map((city) => (
        <button
          key={city.id}
          type="button"
          className={cx(styles.cityLabel, city.level === "limited" && styles.cityLabelLimited)}
          style={{ left: `${city.position.x}%`, top: `${city.position.y}%`, "--heat": HEAT[city.level].color } as CSSProperties}
          onClick={() => onSelect(city.id)}
          aria-label={`${localized(city.name, lang)}, ${city.score == null ? localized(HEAT.limited.label, lang) : `ONDO ${city.score}, ${localized(HEAT[city.level].label, lang)}`}`}
        >
          <span>{localized(city.shortName, lang)}</span>
          <strong>{city.score == null ? "···" : city.score}</strong>
        </button>
      ))}
    </div>
  )
}

export function OndoPrototype() {
  const [lang, setLang] = useState<Lang>("en")
  const [tab, setTab] = useState<TabId>("ondo")
  const [time, setTime] = useState<TimeId>("now")
  const [cityId, setCityId] = useState<KoreaRegionId | null>(null)
  const [neighborhoodId, setNeighborhoodId] = useState<string | null>(null)
  const [venueId, setVenueId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"map" | "list">("map")
  const [guideOpen, setGuideOpen] = useState(true)
  const [legendOpen, setLegendOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [directionsOpen, setDirectionsOpen] = useState(false)
  const [agePromptOpen, setAgePromptOpen] = useState(false)
  const [ageVerified, setAgeVerified] = useState(false)
  const [nightMode, setNightMode] = useState(false)
  const [saved, setSaved] = useState<Set<string>>(new Set(["mangwon-kalguksu"]))
  const [joined, setJoined] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState({ open: true, budget: false, dietary: false })
  const [toast, setToast] = useState<string | null>(null)

  const city = cityId ? CITIES.find((entry) => entry.id === cityId) ?? null : null
  const neighborhoods = cityId ? NEIGHBORHOODS.filter((entry) => entry.cityId === cityId) : []
  const activeNeighborhood = neighborhoods.find((entry) => entry.id === neighborhoodId) ?? neighborhoods[0] ?? null
  const selectedVenue = VENUES.find((entry) => entry.id === venueId) ?? null

  const visibleVenues = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return VENUES.filter((venue) => {
      if (cityId && venue.cityId !== cityId) return false
      if (activeNeighborhood && venue.neighborhoodId !== activeNeighborhood.id) return false
      if (filters.open && !venue.open) return false
      if (time === "late" && !venue.late) return false
      if (nightMode && !venue.alcohol) return false
      if (query) {
        const haystack = `${venue.name.en} ${venue.name.ko} ${venue.food.en} ${venue.food.ko}`.toLocaleLowerCase()
        if (!haystack.includes(query)) return false
      }
      return true
    })
  }, [activeNeighborhood, cityId, filters.open, nightMode, search, time])

  function notify(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(null), 2200)
  }

  function selectCity(nextCityId: KoreaRegionId) {
    setCityId(nextCityId)
    const first = NEIGHBORHOODS.find((entry) => entry.cityId === nextCityId)
    setNeighborhoodId(first?.id ?? null)
    setVenueId(null)
    setViewMode("map")
  }

  function toggleSaved(id: string) {
    setSaved((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    notify(lang === "en" ? "My Korea updated" : "My Korea에 반영했어요")
  }

  function activateAfter19() {
    if (nightMode) {
      setNightMode(false)
      return
    }
    if (!ageVerified) {
      setAgePromptOpen(true)
      return
    }
    setNightMode(true)
    setTime("late")
  }

  function enterOverview() {
    setCityId(null)
    setNeighborhoodId(null)
    setVenueId(null)
    setViewMode("map")
  }

  const navItems: Array<{ id: TabId; label: Localized; icon: typeof MapIcon }> = [
    { id: "ondo", label: { en: "ONDO", ko: "온도" }, icon: MapIcon },
    { id: "saved", label: { en: "My Korea", ko: "My Korea" }, icon: Heart },
    { id: "connect", label: { en: "Connect", ko: "연결" }, icon: MessageCircle },
    { id: "id", label: { en: "ID", ko: "ID" }, icon: BadgeCheck },
  ]

  return (
    <main className={styles.stage}>
      <div className={cx(styles.phone, nightMode && styles.phoneNight)}>
        <div className={styles.statusBar} aria-hidden="true">
          <span>9:41</span>
          <span>••• 5G ▰</span>
        </div>

        {tab === "ondo" && (
          <section className={styles.mapScreen}>
            <header className={styles.mapHeader}>
              <div className={styles.brandRow}>
                <button type="button" className={styles.wordmark} onClick={enterOverview} aria-label="ONDO home">
                  <span className={styles.brandDot} />
                  <span>ONDO</span>
                  <small>온도</small>
                </button>
                <div className={styles.headerActions}>
                  <button type="button" className={styles.iconButton} onClick={() => setGuideOpen(true)} aria-label={lang === "en" ? "About ONDO" : "ONDO 설명"}>
                    <CircleHelp size={19} />
                  </button>
                  <button type="button" className={styles.langButton} onClick={() => setLang(lang === "en" ? "ko" : "en")} aria-label={lang === "en" ? "한국어로 전환" : "Switch to English"}>
                    <Languages size={16} />
                    {lang === "en" ? "KO" : "EN"}
                  </button>
                </div>
              </div>

              <div className={styles.searchRow}>
                <Search size={18} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={lang === "en" ? "What are you in the mood for?" : "오늘 어떤 걸 먹고 싶나요?"}
                  aria-label={lang === "en" ? "Search food and places" : "음식과 장소 검색"}
                />
                {search && <button type="button" onClick={() => setSearch("")} aria-label={lang === "en" ? "Clear search" : "검색 지우기"}><X size={16} /></button>}
              </div>

              <div className={styles.chipRow}>
                {(["now", "dinner", "late"] as TimeId[]).map((id) => {
                  const labels: Record<TimeId, Localized> = {
                    now: { en: "Now", ko: "지금" },
                    dinner: { en: "Dinner", ko: "오늘 저녁" },
                    late: { en: "Late night", ko: "늦게까지" },
                  }
                  return (
                    <button key={id} type="button" className={cx(styles.filterChip, time === id && styles.filterChipActive)} onClick={() => setTime(id)} aria-pressed={time === id}>
                      {id === "late" && <Moon size={14} />}
                      {localized(labels[id], lang)}
                    </button>
                  )
                })}
                <button type="button" className={cx(styles.filterChip, styles.afterChip, nightMode && styles.afterChipActive)} onClick={activateAfter19} aria-pressed={nightMode}>
                  <Moon size={14} /> After 19
                </button>
              </div>
            </header>

            {!city ? (
              <div className={styles.overview}>
                <div className={styles.overviewTitle}>
                  <div>
                    <p>{lang === "en" ? "KOREA · LAST 3 HOURS" : "대한민국 · 최근 3시간"}</p>
                    <h1>{lang === "en" ? "Where Korea is heating up" : "지금 한국이 뜨거워지는 곳"}</h1>
                  </div>
                  <button type="button" className={styles.locateButton} onClick={() => { selectCity("capital"); notify(lang === "en" ? "Showing Seoul near you" : "내 주변 서울을 보여드려요") }} aria-label={lang === "en" ? "Show places near me" : "내 주변 보기"}>
                    <LocateFixed size={19} />
                  </button>
                </div>
                <MapDots lang={lang} onSelect={selectCity} />
                <button type="button" className={styles.legendPill} onClick={() => setLegendOpen(true)}>
                  <span>{lang === "en" ? "Low" : "미온"}</span>
                  <i className={styles.legendScale} aria-hidden="true" />
                  <span>{lang === "en" ? "Peak" : "피크"}</span>
                  <CircleHelp size={14} />
                </button>
                <div className={styles.overviewSignal}>
                  <span className={styles.liveDot} />
                  <div>
                    <strong>{lang === "en" ? "Seoul is heating up" : "서울이 뜨거워지고 있어요"}</strong>
                    <small>{lang === "en" ? "142 fresh local signals · updated 8 min ago" : "최신 로컬 신호 142개 · 8분 전 업데이트"}</small>
                  </div>
                  <button type="button" onClick={() => selectCity("capital")} aria-label={lang === "en" ? "Explore Seoul" : "서울 탐색"}><ChevronRight size={20} /></button>
                </div>
              </div>
            ) : (
              <div className={styles.cityView}>
                <div className={styles.cityToolbar}>
                  <button type="button" className={styles.backButton} onClick={enterOverview} aria-label={lang === "en" ? "Back to Korea" : "대한민국 지도로 돌아가기"}>
                    <ArrowLeft size={20} />
                  </button>
                  <button type="button" className={styles.citySelect} onClick={enterOverview}>
                    {localized(city.name, lang)} <ChevronDown size={15} />
                  </button>
                  <div className={styles.segmented}>
                    <button type="button" className={viewMode === "map" ? styles.segmentedActive : undefined} onClick={() => setViewMode("map")} aria-label={lang === "en" ? "Map view" : "지도 보기"}><MapIcon size={17} /></button>
                    <button type="button" className={viewMode === "list" ? styles.segmentedActive : undefined} onClick={() => setViewMode("list")} aria-label={lang === "en" ? "List view" : "목록 보기"}><List size={17} /></button>
                  </div>
                  <button type="button" className={styles.toolbarIcon} onClick={() => setFilterOpen(true)} aria-label={lang === "en" ? "Filters" : "필터"}><Filter size={18} /></button>
                </div>

                {city.level === "limited" ? (
                  <div className={styles.limitedState}>
                    <span className={styles.limitedMark}>···</span>
                    <p>{lang === "en" ? "GANGWON · GROWING" : "강원 · 신호 수집 중"}</p>
                    <h2>{lang === "en" ? "Fresh signals are still limited" : "아직 최신 신호가 충분하지 않아요"}</h2>
                    <span>{lang === "en" ? "We won't invent a precise score. Start with 8 editorial food picks instead." : "정밀한 점수를 만들지 않고, 편집 추천 식음료 8곳부터 보여드려요."}</span>
                    <button type="button" onClick={() => selectCity("capital")}>{lang === "en" ? "Explore Seoul live" : "서울 Live 보기"}</button>
                  </div>
                ) : viewMode === "map" ? (
                  <div className={styles.streetMap} aria-label={`${localized(city.name, lang)} food heat map`}>
                    <span className={cx(styles.road, styles.roadOne)} />
                    <span className={cx(styles.road, styles.roadTwo)} />
                    <span className={cx(styles.road, styles.roadThree)} />
                    <span className={styles.river} />
                    {neighborhoods.map((area) => (
                      <button
                        key={area.id}
                        type="button"
                        className={cx(styles.neighborhood, activeNeighborhood?.id === area.id && styles.neighborhoodActive)}
                        style={{ left: `${area.position.x}%`, top: `${area.position.y}%`, "--heat": HEAT[area.level].color } as CSSProperties}
                        onClick={() => { setNeighborhoodId(area.id); setVenueId(null) }}
                        aria-label={`${localized(area.name, lang)}, ONDO ${area.score}, ${localized(HEAT[area.level].label, lang)}, ${localized(area.updated, lang)}`}
                      >
                        <span>{localized(area.name, lang)}</span>
                        <strong>{area.score}</strong>
                      </button>
                    ))}
                    {visibleVenues.map((venue) => (
                      <button
                        key={venue.id}
                        type="button"
                        className={styles.venueMarker}
                        style={{ left: `${venue.position.x}%`, top: `${venue.position.y}%`, "--heat": HEAT[venue.level].color } as CSSProperties}
                        onClick={() => setVenueId(venue.id)}
                        aria-label={`${localized(venue.name, lang)}, ONDO ${venue.score}, ${localized(HEAT[venue.level].label, lang)}`}
                      >
                        <Utensils size={14} />
                      </button>
                    ))}
                    <button type="button" className={styles.mapLocate} onClick={() => notify(lang === "en" ? "Centered on your location" : "현재 위치로 이동했어요")} aria-label={lang === "en" ? "Center on my location" : "현재 위치로 이동"}><LocateFixed size={19} /></button>
                  </div>
                ) : (
                  <div className={styles.listView}>
                    <div className={styles.listHeading}>
                      <div>
                        <p>{localized(city.name, lang)} · {lang === "en" ? "last 3 hours" : "최근 3시간"}</p>
                        <h2>{lang === "en" ? "Hottest food signals" : "지금 뜨는 식음료"}</h2>
                      </div>
                      <strong>{visibleVenues.length}</strong>
                    </div>
                    {visibleVenues.length ? visibleVenues.map((venue) => (
                      <button key={venue.id} type="button" className={styles.venueListCard} onClick={() => setVenueId(venue.id)}>
                        <img src={venue.image} alt="" />
                        <span className={styles.venueListBody}>
                          <small>{localized(venue.food, lang)}</small>
                          <strong>{localized(venue.name, lang)}</strong>
                          <span><i style={{ background: HEAT[venue.level].color }} /> ONDO {venue.score} · {localized(HEAT[venue.level].label, lang)}</span>
                          <em>{localized(venue.updated, lang)} · {venue.price}</em>
                        </span>
                        <ChevronRight size={18} />
                      </button>
                    )) : (
                      <div className={styles.emptyList}>
                        <Utensils size={24} />
                        <strong>{lang === "en" ? "No fresh matches yet" : "조건에 맞는 최신 신호가 없어요"}</strong>
                        <button type="button" onClick={() => { setTime("now"); setSearch(""); setFilters({ open: true, budget: false, dietary: false }) }}>{lang === "en" ? "Reset filters" : "필터 초기화"}</button>
                      </div>
                    )}
                  </div>
                )}

                {viewMode === "map" && city.level !== "limited" && activeNeighborhood && !selectedVenue && (
                  <div className={styles.peekCard}>
                    <div className={styles.peekGrabber} />
                    <div className={styles.peekTopline}>
                      <span>{localized(activeNeighborhood.name, lang)}</span>
                      <small>{localized(activeNeighborhood.updated, lang)}</small>
                    </div>
                    <div className={styles.peekScore}>
                      <span className={styles.heatDisc} style={{ background: HEAT[activeNeighborhood.level].color }}>{activeNeighborhood.score}</span>
                      <div>
                        <h2>ONDO {activeNeighborhood.score} · {localized(HEAT[activeNeighborhood.level].label, lang)}</h2>
                        <p>{localized(activeNeighborhood.trend, lang)}</p>
                      </div>
                    </div>
                    <div className={styles.peekMeta}><Users size={14} /> {activeNeighborhood.signalCount} {lang === "en" ? "fresh local signals" : "최신 로컬 신호"}</div>
                    <button type="button" className={styles.peekAction} onClick={() => setViewMode("list")}>
                      {lang === "en" ? `Explore ${visibleVenues.length || "nearby"} places` : `${visibleVenues.length || "주변"}곳 탐색`} <ChevronRight size={17} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {tab === "saved" && (
          <section className={styles.tabScreen}>
            <PageTitle eyebrow="MY KOREA" title={lang === "en" ? "Saved for this trip" : "이번 여행에 저장한 곳"} subtitle={lang === "en" ? "A quiet record of places you want to taste." : "먹어보고 싶은 곳을 조용히 모아두었어요."} />
            <div className={styles.tripCard}>
              <div className={styles.tripMapDots} aria-hidden="true">{Array.from({ length: 64 }).map((_, index) => <i key={index} className={index % 7 === 0 || index % 13 === 0 ? styles.tripMapDotOn : undefined} />)}</div>
              <div><span>{lang === "en" ? "KOREA · AUG 2026" : "대한민국 · 2026년 8월"}</span><strong>{saved.size}</strong><small>{lang === "en" ? "places saved" : "곳 저장"}</small></div>
            </div>
            <div className={styles.sectionHeading}><h2>{lang === "en" ? "Saved places" : "저장한 장소"}</h2><span>{saved.size}</span></div>
            <div className={styles.savedGrid}>
              {VENUES.filter((venue) => saved.has(venue.id)).map((venue) => (
                <button key={venue.id} type="button" className={styles.savedCard} onClick={() => { setCityId(venue.cityId); setNeighborhoodId(venue.neighborhoodId); setVenueId(venue.id); setTab("ondo") }}>
                  <img src={venue.image} alt="" />
                  <span><small>ONDO {venue.score} · {localized(HEAT[venue.level].label, lang)}</small><strong>{localized(venue.name, lang)}</strong><em>{localized(venue.distance, lang)}</em></span>
                </button>
              ))}
              {!saved.size && <div className={styles.emptySaved}><Heart size={26} /><strong>{lang === "en" ? "No saved places yet" : "아직 저장한 장소가 없어요"}</strong><button type="button" onClick={() => setTab("ondo")}>{lang === "en" ? "Explore ONDO" : "온도 지도 보기"}</button></div>}
            </div>
          </section>
        )}

        {tab === "connect" && (
          <section className={styles.tabScreen}>
            <PageTitle eyebrow="PULSE TABLE" title={lang === "en" ? "Meet around a meal" : "한 끼를 중심으로 만나요"} subtitle={lang === "en" ? "No public people search. Every table has a place, time and menu." : "공개 사람 검색 없이, 장소·시간·메뉴가 있는 식사 자리만 연결해요."} />
            <div className={styles.safetyNote}><ShieldCheck size={18} /><span>{lang === "en" ? "Verified hosts · public venues · chat opens after confirmation" : "확인된 호스트 · 공개 장소 · 확정 후 채팅"}</span></div>
            <div className={styles.tableList}>
              {TABLES.map((table) => (
                <article key={table.id} className={styles.tableCard}>
                  <div className={styles.tableTop}><span>{table.alcohol ? <Moon size={16} /> : <Utensils size={16} />}</span><small>{table.time[lang]}</small></div>
                  <h2>{table.title[lang]}</h2>
                  <p>{table.host[lang]}</p>
                  <div className={styles.tableMeta}><span><Users size={14} /> {table.seats}</span><span><Languages size={14} /> {table.language}</span><span>{table.price}</span></div>
                  {joined.has(table.id) ? (
                    <button type="button" className={styles.joinedButton} onClick={() => notify(lang === "en" ? "Opening the confirmed group chat" : "확정된 그룹 채팅을 열어요")}><Check size={17} /> {lang === "en" ? "Joined · Open chat" : "참여 확정 · 채팅 열기"}</button>
                  ) : (
                    <button type="button" className={styles.tableButton} onClick={() => {
                      if (table.alcohol && !ageVerified) { setAgePromptOpen(true); return }
                      setJoined((current) => new Set(current).add(table.id)); notify(lang === "en" ? "Table added to Connect" : "연결 탭에 식사 자리를 추가했어요")
                    }}>{lang === "en" ? "View & join" : "자세히 보고 참여"}<ChevronRight size={17} /></button>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === "id" && (
          <section className={styles.tabScreen}>
            <PageTitle eyebrow="K-TOUR ID" title={lang === "en" ? "Prove less. Experience more." : "덜 보여주고, 더 경험하세요."} subtitle={lang === "en" ? "Identity stays out of the way until a feature actually needs it." : "실제로 필요한 기능에서만 최소한의 자격을 확인해요."} />
            <div className={styles.identityCard}>
              <div className={styles.identityBrand}><span className={styles.identitySeal}>信</span><span>K-Tour ID</span><ShieldCheck size={18} /></div>
              <h2>Daniel Kim</h2>
              <p>{lang === "en" ? "Traveler credential" : "여행자 자격"}</p>
              <div className={styles.identityStatus}><BadgeCheck size={18} /><span>{lang === "en" ? "Person verified" : "사람 확인 완료"}</span></div>
            </div>
            <div className={styles.credentialList}>
              <article><span className={styles.credentialIcon}><UserRound size={20} /></span><div><strong>{lang === "en" ? "Person" : "사람 확인"}</strong><small>{lang === "en" ? "Used for hosting and trust, not a safety guarantee" : "호스트·중복 억제에 사용, 안전 보증은 아님"}</small></div><b><Check size={15} /></b></article>
              <article><span className={styles.credentialIcon}><Moon size={20} /></span><div><strong>19+ eligibility</strong><small>{ageVerified ? (lang === "en" ? "Verified without sharing your birth date" : "생년월일 공유 없이 확인됨") : (lang === "en" ? "Only requested for alcohol-related places" : "주류 관련 장소에서만 요청")}</small></div>{ageVerified ? <b><Check size={15} /></b> : <button type="button" onClick={() => setAgePromptOpen(true)}>{lang === "en" ? "Verify" : "확인"}</button>}</article>
              <article><span className={styles.credentialIcon}><WalletCards size={20} /></span><div><strong>{lang === "en" ? "Data sharing" : "정보 공유"}</strong><small>{lang === "en" ? "Review what each service requested" : "서비스별 요청 정보를 확인"}</small></div><ChevronRight size={18} /></article>
            </div>
            <div className={styles.idBoundary}><CircleHelp size={17} /><p>{lang === "en" ? "Verification confirms a credential or eligibility. It does not prove that a person, venue or recommendation is safe or good." : "확인은 신원 또는 자격 상태를 증명합니다. 사람·장소·추천의 안전이나 품질을 보증하지 않습니다."}</p></div>
          </section>
        )}

        <nav className={styles.bottomNav} aria-label={lang === "en" ? "Main navigation" : "주요 메뉴"}>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.id} type="button" className={tab === item.id ? styles.navActive : undefined} onClick={() => { setTab(item.id); setVenueId(null) }} aria-current={tab === item.id ? "page" : undefined}>
                <Icon size={20} strokeWidth={tab === item.id ? 2.2 : 1.7} />
                <span>{localized(item.label, lang)}</span>
                {item.id === "connect" && joined.size > 0 && <i>{joined.size}</i>}
              </button>
            )
          })}
        </nav>

        {selectedVenue && (
          <div className={styles.detailLayer} role="dialog" aria-modal="true" aria-label={localized(selectedVenue.name, lang)}>
            <div className={styles.detailBackdrop} onClick={() => setVenueId(null)} />
            <article className={styles.venueDetail}>
              <div className={styles.detailHero}>
                <img src={selectedVenue.image} alt="" />
                <button type="button" className={styles.detailClose} onClick={() => setVenueId(null)} aria-label={lang === "en" ? "Close venue details" : "장소 상세 닫기"}><X size={20} /></button>
                <button type="button" className={cx(styles.detailSave, saved.has(selectedVenue.id) && styles.detailSaved)} onClick={() => toggleSaved(selectedVenue.id)} aria-label={saved.has(selectedVenue.id) ? (lang === "en" ? "Remove from saved" : "저장 취소") : (lang === "en" ? "Save place" : "장소 저장")}><Heart size={20} fill={saved.has(selectedVenue.id) ? "currentColor" : "none"} /></button>
              </div>
              <div className={styles.detailBody}>
                <div className={styles.detailKicker}><span>{localized(selectedVenue.food, lang)}</span><span className={selectedVenue.open ? styles.open : styles.closed}>{selectedVenue.open ? (lang === "en" ? "Open now" : "영업 중") : (lang === "en" ? "Closed" : "영업 종료")}</span></div>
                <h2>{selectedVenue.name.ko}</h2>
                <p className={styles.englishName}>{selectedVenue.name.en}</p>
                <div className={styles.detailHeat}>
                  <span style={{ background: HEAT[selectedVenue.level].color }}>{selectedVenue.score}</span>
                  <div><strong>ONDO {selectedVenue.score} · {localized(HEAT[selectedVenue.level].label, lang)}</strong><small><Clock3 size={13} /> {localized(selectedVenue.updated, lang)} · {selectedVenue.signalCount} {lang === "en" ? "local signals" : "로컬 신호"}</small></div>
                </div>
                <section className={styles.detailSection}><h3>{lang === "en" ? "Why it's hot" : "지금 뜨는 이유"}</h3><p>{localized(selectedVenue.reason, lang)}</p></section>
                <section className={styles.detailSection}><h3>{lang === "en" ? "Before you go" : "가기 전 확인"}</h3><div className={styles.factGrid}>{selectedVenue.facts.map((fact) => <span key={fact.en}><Check size={14} /> {localized(fact, lang)}</span>)}</div><div className={styles.detailTripMeta}><span>{selectedVenue.price}</span><span>{localized(selectedVenue.distance, lang)}</span></div></section>
                <div className={styles.detailActions}>
                  <button type="button" className={styles.secondaryAction} onClick={() => toggleSaved(selectedVenue.id)}><Heart size={18} fill={saved.has(selectedVenue.id) ? "currentColor" : "none"} /> {lang === "en" ? "Save" : "저장"}</button>
                  <button type="button" className={styles.primaryAction} onClick={() => setDirectionsOpen(true)}><Navigation size={18} /> {lang === "en" ? "Directions" : "길찾기"}</button>
                </div>
                <button type="button" className={styles.tableLink} onClick={() => { setVenueId(null); setTab("connect") }}><Users size={18} /> {lang === "en" ? "Join a Pulse Table here" : "이 장소의 Pulse Table 참여"}<ChevronRight size={17} /></button>
              </div>
            </article>
          </div>
        )}

        {guideOpen && (
          <Modal onClose={() => setGuideOpen(false)} label={lang === "en" ? "What ONDO means" : "ONDO 안내"}>
            <div className={styles.guideVisual}><span className={styles.guideDotOne} /><span className={styles.guideDotTwo} /><span className={styles.guideDotThree} /><strong>87</strong></div>
            <p className={styles.modalEyebrow}>ONDO ≠ WEATHER</p>
            <h2>{lang === "en" ? "See what locals are eating now" : "로컬이 지금 찾는 한 끼를 봐요"}</h2>
            <p>{lang === "en" ? "Deeper color means stronger recent food signals—not weather, crowd level, safety or review score." : "색이 진할수록 최근 식음료 신호가 강해요. 날씨·혼잡도·안전도·평점이 아니에요."}</p>
            <button type="button" className={styles.modalPrimary} onClick={() => setGuideOpen(false)}>{lang === "en" ? "Explore the map" : "지도 둘러보기"}<Compass size={18} /></button>
          </Modal>
        )}

        {legendOpen && (
          <Modal onClose={() => setLegendOpen(false)} label={lang === "en" ? "ONDO legend" : "ONDO 범례"}>
            <p className={styles.modalEyebrow}>HOW ONDO WORKS</p>
            <h2>{lang === "en" ? "One signal, five levels" : "하나의 신호, 다섯 단계"}</h2>
            <p>{lang === "en" ? "ONDO compares fresh local interest with the usual pattern for that place and time." : "최근 로컬 관심을 해당 장소와 시간대의 평상시 패턴과 비교해요."}</p>
            <div className={styles.legendList}>{(["low", "warming", "rising", "hot", "peak"] as HeatLevel[]).map((level) => <div key={level}><i style={{ background: HEAT[level].color }} /><span>{localized(HEAT[level].label, lang)}</span></div>)}<div><i className={styles.legendLimited} /><span>{localized(HEAT.limited.label, lang)}</span></div></div>
            <div className={styles.legendBoundary}><CircleHelp size={16} /> {lang === "en" ? "Freshness, confidence and signal count are shown separately." : "최신성·신뢰도·신호 수는 별도로 표시해요."}</div>
          </Modal>
        )}

        {filterOpen && (
          <Modal onClose={() => setFilterOpen(false)} label={lang === "en" ? "Food filters" : "식음료 필터"}>
            <p className={styles.modalEyebrow}>FILTER</p>
            <h2>{lang === "en" ? "What works for you?" : "나에게 맞는 곳만 볼까요?"}</h2>
            <div className={styles.filterOptions}>
              <ToggleRow icon={Clock3} label={lang === "en" ? "Open now" : "지금 영업 중"} value={filters.open} onChange={() => setFilters((current) => ({ ...current, open: !current.open }))} />
              <ToggleRow icon={CreditCard} label={lang === "en" ? "Under ₩20,000" : "2만원 이하"} value={filters.budget} onChange={() => setFilters((current) => ({ ...current, budget: !current.budget }))} />
              <ToggleRow icon={Utensils} label={lang === "en" ? "Dietary options" : "식이 조건 가능"} value={filters.dietary} onChange={() => setFilters((current) => ({ ...current, dietary: !current.dietary }))} />
            </div>
            <button type="button" className={styles.modalPrimary} onClick={() => setFilterOpen(false)}>{lang === "en" ? "Show places" : "장소 보기"}<Check size={18} /></button>
          </Modal>
        )}

        {directionsOpen && selectedVenue && (
          <Modal onClose={() => setDirectionsOpen(false)} label={lang === "en" ? "Choose directions app" : "길찾기 앱 선택"}>
            <p className={styles.modalEyebrow}>OPEN DIRECTIONS</p>
            <h2>{lang === "en" ? "Choose your map" : "사용할 지도를 선택하세요"}</h2>
            <p>{lang === "en" ? "ONDO keeps the place saved while your preferred map handles the route." : "장소는 ONDO에 유지하고, 익숙한 지도에서 경로를 안내해요."}</p>
            <div className={styles.directionList}>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedVenue.name.ko)}`} target="_blank" rel="noreferrer"><span>G</span><div><strong>Google Maps</strong><small>{selectedVenue.name.ko}</small></div><ExternalLink size={17} /></a>
              <a href={`https://map.naver.com/p/search/${encodeURIComponent(selectedVenue.name.ko)}`} target="_blank" rel="noreferrer"><span>N</span><div><strong>Naver Map</strong><small>{lang === "en" ? "Best local place data" : "국내 장소 정보"}</small></div><ExternalLink size={17} /></a>
              <a href={`https://map.kakao.com/?q=${encodeURIComponent(selectedVenue.name.ko)}`} target="_blank" rel="noreferrer"><span>K</span><div><strong>Kakao Map</strong><small>{lang === "en" ? "Korean directions" : "국내 길찾기"}</small></div><ExternalLink size={17} /></a>
            </div>
          </Modal>
        )}

        {agePromptOpen && (
          <Modal onClose={() => setAgePromptOpen(false)} label={lang === "en" ? "Prove 19 plus" : "19세 이상 확인"}>
            <div className={styles.ageIcon}><Moon size={26} /></div>
            <p className={styles.modalEyebrow}>AFTER 19</p>
            <h2>{lang === "en" ? "Prove only that you're 19+" : "19세 이상 여부만 확인해요"}</h2>
            <p>{lang === "en" ? "Your date of birth and ID details aren't shared with ONDO. Venues may still check ID at entry." : "생년월일과 신분증 정보는 ONDO에 공유하지 않아요. 매장에서 별도 확인할 수 있어요."}</p>
            <div className={styles.privacyRow}><ShieldCheck size={17} /><span>{lang === "en" ? "Selective eligibility proof" : "필요한 자격만 선택적으로 증명"}</span></div>
            <button type="button" className={styles.modalPrimary} onClick={() => { setAgeVerified(true); setNightMode(true); setTime("late"); setAgePromptOpen(false); notify(lang === "en" ? "After 19 unlocked" : "After 19가 열렸어요") }}>{lang === "en" ? "Prove 19+" : "19+ 확인"}<BadgeCheck size={18} /></button>
            <button type="button" className={styles.modalSecondary} onClick={() => setAgePromptOpen(false)}>{lang === "en" ? "Not now" : "나중에"}</button>
          </Modal>
        )}

        {toast && <div className={styles.toast} role="status"><Check size={16} /> {toast}</div>}
      </div>
      <aside className={styles.reviewRail}>
        <p>INTERACTIVE PROTOTYPE</p>
        <h2>ONDO</h2>
        <span>Where locals eat now</span>
        <ol>
          <li><b>01</b> Korea heat overview</li>
          <li><b>02</b> City → neighborhood</li>
          <li><b>03</b> Venue decision card</li>
          <li><b>04</b> After 19 JIT proof</li>
          <li><b>05</b> Save · Table · ID</li>
        </ol>
        <small>Food-first · foreign traveler MVP</small>
      </aside>
    </main>
  )
}

function PageTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return <header className={styles.pageTitle}><p>{eyebrow}</p><h1>{title}</h1><span>{subtitle}</span></header>
}

function Modal({ children, onClose, label }: { children: React.ReactNode; onClose: () => void; label: string }) {
  return (
    <div className={styles.modalLayer} role="dialog" aria-modal="true" aria-label={label}>
      <button type="button" className={styles.modalBackdrop} onClick={onClose} aria-label="Close" />
      <section className={styles.modalSheet}>
        <div className={styles.modalGrabber} />
        <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Close"><X size={18} /></button>
        {children}
      </section>
    </div>
  )
}

function ToggleRow({ icon: Icon, label, value, onChange }: { icon: typeof Clock3; label: string; value: boolean; onChange: () => void }) {
  return (
    <button type="button" className={styles.toggleRow} onClick={onChange} aria-pressed={value}>
      <span><Icon size={19} /></span><strong>{label}</strong><i className={value ? styles.toggleOn : undefined}><b /></i>
    </button>
  )
}

