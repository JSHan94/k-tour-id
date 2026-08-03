"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, CalendarDays, Check, MapPin, ShieldCheck } from "lucide-react"
import { BrandMark } from "@/components/app/brand"
import { LocationControl } from "@/components/app/location-control"
import { LangToggle, PageHeader, PhoneFrame } from "@/components/app/shell"
import { COMMERCIAL_CATEGORIES, COMMERCIAL_SERVICES, type CommercialCategory } from "@/lib/commercial-services"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import { cn } from "@/lib/utils"
import { useNearbyLocation } from "@/lib/location/location-provider"
import { distanceKm, pointProximityLabel } from "@/lib/location/location-provider"
import { useExternalServiceOrders } from "@/lib/external-service-orders"

type Filter = "all" | CommercialCategory

export default function ServicesPage() {
  const router = useRouter()
  const { session, hydrated } = useApp()
  const { lang } = useLang()
  const ko = lang === "ko"
  const [filter, setFilter] = useState<Filter>("all")
  const [sourcePage, setSourcePage] = useState("")
  const { location, status: locationStatus } = useNearbyLocation()
  const externalOrders = useExternalServiceOrders(session.identity?.did ?? "guest")

  useEffect(() => {
    if (hydrated && !session.onboarded) router.replace("/onboarding")
    const requested = new URLSearchParams(window.location.search).get("category")
    if (requested && (requested === "all" || requested in COMMERCIAL_CATEGORIES)) setFilter(requested as Filter)
    setSourcePage(new URLSearchParams(window.location.search).get("from") ?? "")
  }, [hydrated, router, session.onboarded])
  const services = useMemo(() => {
    const filtered = filter === "all" ? COMMERCIAL_SERVICES : COMMERCIAL_SERVICES.filter((service) => service.category === filter)
    if (locationStatus !== "granted" || !location) return filtered
    return [...filtered].sort((a, b) => distanceKm(location, a.geo) - distanceKm(location, b.geo))
  }, [filter, location, locationStatus])
  if (!session.onboarded) return null

  const filters: Filter[] = ["all", "mobility", "delivery", "shopping", "convenience"]
  return (
    <PhoneFrame>
      <PageHeader title={ko ? "생활 서비스" : "Everyday services"} back={sourcePage === "explore" ? "/explore" : "/"} right={<LangToggle />} />
      <main className="pb-8">
        <section className="px-6 pb-7 pt-3">
          <p className="text-[12px] font-semibold text-primary">K-Tour ID × {ko ? "한국 생활" : "Everyday Korea"}</p>
          <h1 className="font-display text-balance mt-2 text-[31px] font-semibold leading-[1.2] tracking-[-0.035em]">{ko ? "익숙한 서비스로\n바로 이어져요" : "Use familiar services\nin Korea"}</h1>
          <p className="mt-3 text-[14px] leading-6 text-muted-foreground">{ko ? "이동·배달·쇼핑의 예상 결제액과 K-Tour ID 혜택을 먼저 확인해요." : "Review estimated prices and K-Tour ID benefits for mobility, delivery, and shopping."}</p>
          <details className="mt-4 rounded-[14px] bg-success-surface px-4 py-3 text-success"><summary className="flex min-h-6 cursor-pointer list-none items-center gap-2 text-[12px] font-semibold"><ShieldCheck className="h-4 w-4" />{ko ? "연결 예시 · 개인정보 안내" : "Connection preview · privacy"}</summary><p className="mt-2 text-[12px] leading-5">{ko ? "제휴와 실제 결제 연동 전의 예시 화면입니다. 이름·여권 정보·신분증 원본은 전달하지 않아요." : "This previews the experience before live partnership and payment. Name, passport data, and original ID documents are not shared."}</p></details>
          <div className="mt-4"><LocationControl compact /></div>
        </section>

        <Link href="/explore?focus=experience" className="pressable mx-6 mb-4 flex min-h-14 items-center gap-3 rounded-[16px] bg-ink px-4 text-white"><span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-gold"><CalendarDays className="h-4 w-4" /></span><span className="min-w-0 flex-1"><strong className="block text-[13px]">{ko ? "예약·체험" : "Bookings & experiences"}</strong><span className="mt-0.5 block text-[12px] text-white/60">{ko ? "공예·지역 문화·차 체험" : "Craft, local culture, and tea"}</span></span><ArrowRight className="h-4 w-4" /></Link>

        <div className="no-scrollbar flex gap-2 overflow-x-auto border-y border-foreground/10 px-6 py-3">
          {filters.map((key) => <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)} className={cn("pressable inline-flex min-h-11 flex-shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold", filter === key ? "bg-ink text-white" : "bg-secondary text-muted-foreground")}>{filter === key && <Check className="h-3.5 w-3.5" />}{key === "all" ? (ko ? "전체" : "All") : COMMERCIAL_CATEGORIES[key][lang]}</button>)}
        </div>

        <section className="px-6 pt-7">
          <div className="flex items-end justify-between"><div><p className="text-[12px] font-semibold text-primary">{ko ? "지금 필요한 것부터" : "Start with what you need"}</p><h2 className="font-display mt-1 text-[24px] font-semibold">{filter === "all" ? (ko ? "한국에서 자주 쓰는 서비스" : "Common services in Korea") : COMMERCIAL_CATEGORIES[filter][lang]}</h2></div><span className="text-[12px] text-muted-foreground">{services.length}{ko ? "개" : " services"}</span></div>
          <div className="mt-4 space-y-3">
            {services.map((service) => {
              const personaEligible = !!session.userType && service.benefitEligibleUserTypes.includes(session.userType)
              const benefitUsed = externalOrders.some((order) => order.status === "confirmed" && order.benefitId === service.benefitId && order.benefitAppliedKRW > 0)
              const benefitAvailable = personaEligible && !benefitUsed
              const appliedBenefit = benefitAvailable ? service.benefitKRW : 0
              const finalKRW = service.grossKRW - appliedBenefit
              const km = locationStatus === "granted" && location ? distanceKm(location, service.geo) : null
              const inCoverage = km == null || km <= service.coverageKm
              const proximity = locationStatus === "granted" ? pointProximityLabel(service.geo, location, lang) : undefined
              const contextualLocation = proximity ? `${service.context[lang]} · ${proximity}` : service.context[lang]
              const benefitLabel = benefitAvailable ? service.benefit[lang] : benefitUsed ? (ko ? "혜택 사용 완료 · 정상 예상가" : "Benefit used · regular estimated price") : (ko ? "현재 K-Tour ID 정상 예상가" : "Regular estimate for this K-Tour ID")
              const query = new URLSearchParams({ category: filter, ...(sourcePage ? { from: sourcePage } : {}) }).toString()
              return <Link key={service.id} href={`/services/${service.id}?${query}`} className="pressable block rounded-[20px] bg-card p-4 ring-1 ring-border">
                <div className="flex items-start gap-3.5">
                  <BrandMark brand={service.brand} size={46} decorative />
                  <div className="min-w-0 flex-1"><strong className="text-[14px]">{service.name[lang]}</strong><h3 className="font-display mt-1.5 text-[20px] font-semibold leading-snug">{service.title[lang]}</h3><p className="mt-2 flex items-center gap-1.5 text-[12px] text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{contextualLocation}</p></div>
                </div>
                <div className="mt-4 flex items-end justify-between border-t border-foreground/10 pt-3"><div><p className={`text-[12px] font-semibold ${benefitAvailable ? "text-success" : "text-muted-foreground"}`}>{!inCoverage ? (ko ? "현재 위치에서는 이용 불가" : "Unavailable from your location") : benefitLabel}</p><p className="mt-1 text-[12px] text-muted-foreground">{ko ? "예상 결제액" : "Estimated total"}</p></div><div className="flex items-center gap-2"><strong className="tabular text-[17px]">₩{finalKRW.toLocaleString()}</strong><ArrowRight className="h-4 w-4 text-muted-foreground" /></div></div>
              </Link>
            })}
          </div>
        </section>

      </main>
    </PhoneFrame>
  )
}
