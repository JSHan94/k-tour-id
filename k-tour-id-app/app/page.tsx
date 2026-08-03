"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, BadgeCheck, ChevronRight, Sparkles, Wallet } from "lucide-react"
import { EditorialFeature, ServiceRow } from "@/components/app/commerce"
import { FirstRunGuide } from "@/components/app/first-run-guide"
import { LocationControl } from "@/components/app/location-control"
import { PhoneFrame, LangToggle } from "@/components/app/shell"
import { itemsForUserType, PERSONA_CONFIG } from "@/lib/catalog"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import { proximityLabel, sortItemsByDistance, useNearbyLocation } from "@/lib/location/location-provider"
import { credentialDaysRemaining, isCredentialUsable } from "@/lib/credential-status"

export default function HomePage() {
  const router = useRouter()
  const { session, demoJourney, vouchers, openCopilot, hydrated } = useApp()
  const { lang } = useLang()
  const { location, status: locationStatus } = useNearbyLocation()
  const ko = lang === "ko"

  useEffect(() => { if (hydrated && !session.onboarded) router.replace("/onboarding") }, [hydrated, session.onboarded, router])
  if (!session.onboarded || !session.userType) return null

  const name = session.capsule?.holderName ?? session.identity?.displayName ?? "Traveler"
  const persona = PERSONA_CONFIG[session.userType]
  const remainingDays = credentialDaysRemaining(session.capsule)
  const credentialUnavailable = !isCredentialUsable(session.capsule)
  const defaultHomeContext = session.userType === "foreigner"
    ? (ko ? `K-Tour ID · ${remainingDays}일 남음` : `K-Tour ID · ${remainingDays} days left`)
    : persona.homeContext[lang]
  const homeContext = locationStatus === "granted" && location
    ? (ko ? `${location.areaKo} 주변 · 가까운 순` : `Near ${location.areaEn} · closest first`)
    : defaultHomeContext
  const baseRecommendations = itemsForUserType(session.userType)
  const recommendations = sortItemsByDistance(baseRecommendations, locationStatus === "granted" ? location : null)
  const feature = locationStatus === "granted" ? recommendations[0] : (baseRecommendations[1] ?? baseRecommendations[0])
  const featureReason = feature ? [
    persona.shortLabel[lang],
    feature.languageLabels.includes("English") ? (ko ? "영어 이용 가능" : "English available") : (ko ? "한국어 진행" : "Korean-language"),
    locationStatus === "granted" ? proximityLabel(feature, location, lang) : (ko ? "K-Tour ID 이용 가능" : "Available with your K-Tour ID"),
  ].filter(Boolean).join(" · ") : ""
  const secondary = recommendations.filter((item) => item.id !== feature?.id && item.id !== persona.firstItemId).slice(0, 2)
  const benefitUsed = session.userType === "foreigner" && ["paid", "settlement-submitted", "anchored", "refunded"].includes(demoJourney.stage)
  const primaryHref = credentialUnavailable ? "/onboarding?mode=renew" : benefitUsed ? "/benefits" : `/explore/${persona.firstItemId}`

  return (
    <PhoneFrame>
      <FirstRunGuide />
      <section className="relative min-h-[520px] overflow-hidden bg-ink text-white">
        <img src={persona.heroImage} alt="" style={{ objectPosition: persona.heroPosition }} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,18,28,.68)_0%,rgba(11,18,28,.10)_38%,rgba(11,18,28,.16)_55%,rgba(8,12,18,.90)_100%)]" />
        <header className="safe-top relative z-10 flex items-center justify-between px-6">
          <div><p className="font-display text-[20px] font-semibold tracking-[-0.02em]">K-Tour ID</p><p className="mt-0.5 text-[12px] text-white/62">{homeContext}</p></div>
          <div className="flex items-center gap-2 text-white"><LangToggle /><Link href="/profile" aria-label={ko ? "내 정보" : "Profile"} className="pressable"><img src={session.identity?.photoUrl ?? "/portraits/daniel-v2.jpg"} alt="" className="h-11 w-11 rounded-full border border-white/35 object-cover" /></Link></div>
        </header>
        <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-7">
          <p className="text-[13px] font-medium text-white/68">{name}{ko ? "님, " : ", "}{persona.homeBody[lang]}</p>
          <h1 className="font-display text-balance mt-2 whitespace-pre-line text-[34px] font-semibold leading-[1.16] tracking-[-0.035em]">{persona.homeHeadline[lang]}</h1>
          <Link href={primaryHref} className="pressable mt-6 flex min-h-14 w-full items-center justify-between rounded-[14px] bg-primary px-5 text-[16px] font-semibold text-white shadow-[0_12px_28px_rgba(0,0,0,.20)]"><span>{credentialUnavailable ? (ko ? "K-Tour ID 갱신하기" : "Renew K-Tour ID") : benefitUsed ? (ko ? "오늘의 절약 영수증" : "View today's savings") : persona.primaryCta[lang]}</span><ArrowRight className="h-5 w-5" /></Link>
          {session.userType === "foreigner" && !benefitUsed && !credentialUnavailable && <Link href="/present?auto=1" className="pressable mt-2 flex min-h-11 items-center justify-center text-[13px] font-medium text-white/72 underline decoration-white/30 underline-offset-4">{ko ? "매장에서 K-Tour ID 제시하기" : "Use my K-Tour ID in a store"}</Link>}
        </div>
      </section>

      <main className="px-6 py-7">
        <LocationControl />

        <section aria-label={ko ? "이용 상태" : "Account status"} className="mt-7 grid grid-cols-2 divide-x divide-foreground/10 border-y border-foreground/10 py-5">
          <Link href={credentialUnavailable ? "/onboarding?mode=renew" : "/pass"} className="pressable pr-5"><span className="flex items-center gap-2 text-[13px] text-muted-foreground"><BadgeCheck className={`h-4 w-4 ${credentialUnavailable ? "text-primary" : "text-success"}`} />K-Tour ID</span><strong className="mt-2 block text-[17px] font-semibold">{credentialUnavailable ? (ko ? "갱신 필요" : "Renewal needed") : (ko ? "사용 가능" : "Active")}</strong><span className="mt-1 block text-[12px] text-muted-foreground">{credentialUnavailable ? (ko ? "다시 확인해 주세요" : "Verify again") : session.userType === "foreigner" ? (ko ? `${remainingDays}일 남음` : `${remainingDays} days left`) : persona.statusDetail[lang]}</span></Link>
          <Link href="/wallet" className="pressable pl-5"><span className="flex items-center gap-2 text-[13px] text-muted-foreground"><Wallet className="h-4 w-4" />{persona.balanceLabel[lang]}</span><strong className="tabular mt-2 block text-[17px] font-semibold">₩{session.wallet.balanceKRW.toLocaleString()}</strong><span className="mt-1 block text-[12px] text-muted-foreground">KRW</span></Link>
        </section>

        {feature && <section className="mt-11"><p className="text-[13px] font-semibold text-primary">{locationStatus === "granted" ? (ko ? "지금 가장 가까운 선택" : "Closest to you now") : (ko ? "나를 위한 오늘의 선택" : "Today's pick for you")}</p><div className="mt-4"><EditorialFeature item={feature} voucher={vouchers.find((voucher) => voucher.id === feature.voucherId)} proximity={proximityLabel(feature, location, lang)} reason={featureReason} /></div></section>}

        {secondary.length > 0 && <section className="mt-11"><h2 className="font-display text-[24px] font-semibold">{ko ? "지금 이용할 수 있어요" : "Ready when you are"}</h2><div className="mt-3 divide-y divide-foreground/10 border-y border-foreground/10">{secondary.map((item) => <ServiceRow key={item.id} item={item} voucher={vouchers.find((voucher) => voucher.id === item.voucherId)} proximity={proximityLabel(item, location, lang)} />)}</div></section>}

        <Link href="/explore" className="pressable mt-7 flex min-h-12 items-center justify-between border-b border-foreground/10 pb-3 text-[14px] font-semibold"><span>{ko ? "나를 위한 전체 탐색" : "Explore all my picks"}</span><ArrowRight className="h-4 w-4" /></Link>
        <button type="button" onClick={openCopilot} className="pressable mt-4 flex min-h-12 w-full items-center justify-between text-left text-[14px] text-muted-foreground"><span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />{ko ? "여행·생활 도우미에게 물어보기" : "Ask your local guide"}</span><ChevronRight className="h-4 w-4" /></button>
      </main>
    </PhoneFrame>
  )
}
