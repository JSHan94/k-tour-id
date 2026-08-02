"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, Check, Search, SlidersHorizontal, X } from "lucide-react"
import { BenefitTicket, EditorialFeature, ServiceRow } from "@/components/app/commerce"
import { LangToggle, PhoneFrame } from "@/components/app/shell"
import { itemById, itemsForUserType, PERSONA_CONFIG } from "@/lib/catalog"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import type { ServiceCategory } from "@/lib/types"
import { cn } from "@/lib/utils"

type Filter = "all" | ServiceCategory

const FILTERS: Record<string, { ko: string; en: string }> = {
  all: { ko: "전체", en: "All" },
  experience: { ko: "문화·체험", en: "Culture" },
  mobility: { ko: "교통", en: "Mobility" },
  food: { ko: "생활·음식", en: "Everyday" },
  shopping: { ko: "쇼핑", en: "Shopping" },
}

export default function ExplorePage() {
  const router = useRouter()
  const { session, vouchers, hydrated } = useApp()
  const { lang } = useLang()
  const ko = lang === "ko"
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")

  useEffect(() => {
    if (hydrated && !session.onboarded) router.replace("/onboarding")
    const focus = new URLSearchParams(window.location.search).get("focus")
    if (focus && FILTERS[focus]) setFilter(focus as Filter)
  }, [hydrated, router, session.onboarded])
  const userType = session.userType ?? "foreigner"
  const persona = PERSONA_CONFIG[userType]
  const exploreTitle = userType === "korean"
    ? (ko ? "이번 여행지 탐색" : "Explore this destination")
    : userType === "long-term"
      ? (ko ? "서울 생활 탐색" : "Explore everyday Seoul")
      : (ko ? "서울 탐색" : "Explore Seoul")
  const catalog = useMemo(() => itemsForUserType(userType), [userType])
  const shown = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return catalog.filter((item) => {
      if (filter !== "all" && item.category !== filter) return false
      if (!normalized) return true
      return [item.title.ko, item.title.en, item.location.ko, item.location.en].some((value) => value.toLowerCase().includes(normalized))
    })
  }, [catalog, filter, query])
  if (!session.onboarded) return null

  const feature = shown[0]
  const rows = shown.slice(1)
  const filterOrder: Filter[] = userType === "long-term"
    ? ["all", "mobility", "food", "experience"]
    : userType === "korean"
      ? ["all", "experience", "mobility", "food"]
      : ["all", "experience", "food", "mobility"]
  const benefitPairs = vouchers
    .filter((voucher) => voucher.itemId)
    .map((voucher) => ({ voucher, item: itemById(voucher.itemId!) }))
    .filter((pair): pair is { voucher: typeof vouchers[number]; item: NonNullable<ReturnType<typeof itemById>> } => !!pair.item && pair.item.id !== feature?.id)
    .slice(0, 2)
  const visibleRows = rows.filter((candidate) => !benefitPairs.some((pair) => pair.item.id === candidate.id))

  return (
    <PhoneFrame>
      <header className="safe-top px-6 pb-4">
        <div className="flex items-center justify-between">
          <div><p className="text-[12px] font-semibold text-primary">CURATED FOR YOU</p><h1 className="font-display mt-1 text-[30px] font-semibold tracking-[-0.03em]">{exploreTitle}</h1></div>
          <div className="flex items-center gap-1"><LangToggle /><Link href="/alerts" aria-label={ko ? "알림" : "Alerts"} className="pressable grid h-11 w-11 place-items-center rounded-full bg-secondary"><Bell className="h-[18px] w-[18px]" /></Link></div>
        </div>
        <p className="mt-3 max-w-[330px] text-[14px] leading-6 text-muted-foreground">{persona.homeBody[lang]} {ko ? `${catalog.length}가지 선택만 간결하게 모았어요.` : `${catalog.length} focused choices, without the clutter.`}</p>
        <label className="mt-5 flex min-h-12 items-center gap-3 rounded-[14px] bg-card px-4 ring-1 ring-foreground/10 focus-within:ring-primary/40">
          <Search className="h-[18px] w-[18px] text-muted-foreground" />
          <input aria-label={ko ? "상품·지역 검색" : "Search products and places"} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={ko ? "체험, 교통, 동네 검색" : "Search experiences, transit, places"} className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground" />
          {query && <button type="button" onClick={() => setQuery("")} aria-label={ko ? "검색어 지우기" : "Clear search"} className="grid h-9 w-9 place-items-center"><X className="h-4 w-4" /></button>}
        </label>
        <div className="no-scrollbar -mx-6 mt-4 flex gap-2 overflow-x-auto px-6 pb-1">
          {filterOrder.map((key) => <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)} className={cn("pressable inline-flex min-h-11 flex-shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold", filter === key ? "bg-ink text-white" : "bg-secondary text-muted-foreground")}>{filter === key && <Check className="h-3.5 w-3.5" />}{FILTERS[key][lang]}</button>)}
        </div>
        <p className="mt-3 flex items-center gap-2 text-[12px] text-success"><SlidersHorizontal className="h-3.5 w-3.5" />{ko ? "내 K-Tour ID로 이용 가능한 순서" : "Eligible for your K-Tour ID first"}</p>
      </header>

      <main className="px-6 pb-8 pt-4">
        {feature ? (
          <>
            <section><p className="mb-4 text-[13px] font-semibold text-primary">{ko ? "나를 위한 첫 선택" : "First pick for you"}</p><EditorialFeature item={feature} voucher={vouchers.find((voucher) => voucher.id === feature.voucherId)} /></section>
            {benefitPairs.length > 0 && filter === "all" && !query && <section className="mt-11"><div className="flex items-end justify-between"><div><p className="text-[12px] font-semibold text-success">K-TOUR ID</p><h2 className="font-display mt-1 text-[24px] font-semibold">{ko ? "지금 쓸 수 있는 혜택" : "Benefits ready now"}</h2></div><span className="text-[12px] text-muted-foreground">{benefitPairs.length}{ko ? "개" : " available"}</span></div><div className="mt-3 divide-y divide-foreground/10 border-y border-foreground/10">{benefitPairs.map(({ item, voucher }) => <BenefitTicket key={voucher.id} item={item} voucher={voucher} />)}</div></section>}
            {visibleRows.length > 0 && <section className="mt-11"><p className="text-[12px] font-semibold text-primary">{ko ? "이어서 둘러보기" : "Keep exploring"}</p><h2 className="font-display mt-1 text-[24px] font-semibold">{ko ? "오늘 가능한 선택" : "Available today"}</h2><div className="mt-3 divide-y divide-foreground/10 border-y border-foreground/10">{visibleRows.slice(0, 5).map((item) => <ServiceRow key={item.id} item={item} voucher={vouchers.find((voucher) => voucher.id === item.voucherId)} />)}</div></section>}
          </>
        ) : (
          <section className="mt-12 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-secondary"><Search className="h-5 w-5 text-muted-foreground" /></span><h2 className="font-display mt-5 text-[24px] font-semibold">{ko ? "맞는 선택을 찾지 못했어요" : "No matching choices"}</h2><p className="mt-2 text-[13px] leading-6 text-muted-foreground">{ko ? "검색어나 필터를 지우면 지금 이용할 수 있는 추천을 다시 보여드려요." : "Clear your search or filters to see available recommendations again."}</p><button type="button" onClick={() => { setQuery(""); setFilter("all") }} className="mt-5 min-h-11 text-[13px] font-semibold text-primary underline underline-offset-4">{ko ? "필터 초기화" : "Reset filters"}</button></section>
        )}
      </main>
    </PhoneFrame>
  )
}
