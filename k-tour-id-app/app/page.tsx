"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, BadgeCheck, ChevronRight, Sparkles, Wallet } from "lucide-react"
import { EditorialFeature, ServiceRow } from "@/components/app/commerce"
import { PhoneFrame, LangToggle } from "@/components/app/shell"
import { itemsForUserType, PERSONA_CONFIG } from "@/lib/catalog"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"

export default function HomePage() {
  const router = useRouter()
  const { session, demoJourney, vouchers, openCopilot, hydrated } = useApp()
  const { lang } = useLang()
  const ko = lang === "ko"

  useEffect(() => { if (hydrated && !session.onboarded) router.replace("/onboarding") }, [hydrated, session.onboarded, router])
  if (!session.onboarded || !session.userType) return null

  const name = session.capsule?.holderName ?? session.identity?.displayName ?? "Traveler"
  const persona = PERSONA_CONFIG[session.userType]
  const remainingDays = session.capsule ? Math.max(0, Math.ceil((new Date(session.capsule.expiresAt).getTime() - Date.now()) / 86_400_000)) : 0
  const homeContext = session.userType === "foreigner"
    ? (ko ? `K-Tour 서비스 · ${remainingDays}일 남음` : `K-Tour service · ${remainingDays} days left`)
    : persona.homeContext[lang]
  const recommendations = itemsForUserType(session.userType)
  const feature = recommendations[1] ?? recommendations[0]
  const secondary = recommendations.filter((item) => item.id !== feature?.id && item.id !== persona.firstItemId).slice(0, 2)
  const benefitUsed = session.userType === "foreigner" && ["paid", "settlement-submitted", "anchored", "refunded"].includes(demoJourney.stage)
  const primaryHref = benefitUsed
    ? "/benefits"
    : `/explore/${persona.firstItemId}`

  return (
    <PhoneFrame>
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
          <Link href={primaryHref} className="pressable mt-6 flex min-h-14 w-full items-center justify-between rounded-[14px] bg-primary px-5 text-[16px] font-semibold text-white shadow-[0_12px_28px_rgba(0,0,0,.20)]"><span>{benefitUsed ? (ko ? "오늘의 절약 영수증" : "View today's savings") : persona.primaryCta[lang]}</span><ArrowRight className="h-5 w-5" /></Link>
          {session.userType === "foreigner" && !benefitUsed && <Link href="/present?auto=1" className="pressable mt-2 flex min-h-11 items-center justify-center text-[13px] font-medium text-white/72 underline decoration-white/30 underline-offset-4">{ko ? "매장에서 바로 할인받기" : "Use an in-store discount instead"}</Link>}
        </div>
      </section>

      <main className="px-6 py-8">
        <section aria-label={ko ? "이용 상태" : "Account status"} className="grid grid-cols-2 divide-x divide-foreground/10 border-y border-foreground/10 py-5">
          <Link href="/pass" className="pressable pr-5"><span className="flex items-center gap-2 text-[13px] text-muted-foreground"><BadgeCheck className="h-4 w-4 text-success" />K-Tour ID</span><strong className="mt-2 block text-[17px] font-semibold">{ko ? "사용 가능" : "Active"}</strong><span className="mt-1 block text-[12px] text-muted-foreground">{session.userType === "foreigner" ? (ko ? `${remainingDays}일 남음` : `${remainingDays} days left`) : persona.statusDetail[lang]}</span></Link>
          <Link href="/wallet" className="pressable pl-5"><span className="flex items-center gap-2 text-[13px] text-muted-foreground"><Wallet className="h-4 w-4" />{persona.balanceLabel[lang]}</span><strong className="tabular mt-2 block text-[17px] font-semibold">₩{session.wallet.balanceKRW.toLocaleString()}</strong><span className="mt-1 block text-[12px] text-muted-foreground">KRW</span></Link>
        </section>

        {feature && <section className="mt-11"><p className="text-[13px] font-semibold text-primary">{ko ? "나를 위한 오늘의 선택" : "Today's pick for you"}</p><div className="mt-4"><EditorialFeature item={feature} voucher={vouchers.find((voucher) => voucher.id === feature.voucherId)} /></div></section>}

        {secondary.length > 0 && <section className="mt-11"><h2 className="font-display text-[24px] font-semibold">{ko ? "지금 이용할 수 있어요" : "Ready when you are"}</h2><div className="mt-3 divide-y divide-foreground/10 border-y border-foreground/10">{secondary.map((item) => <ServiceRow key={item.id} item={item} voucher={vouchers.find((voucher) => voucher.id === item.voucherId)} />)}</div></section>}

        <Link href="/explore" className="pressable mt-7 flex min-h-12 items-center justify-between border-b border-foreground/10 pb-3 text-[14px] font-semibold"><span>{ko ? "나를 위한 전체 탐색" : "Explore all my picks"}</span><ArrowRight className="h-4 w-4" /></Link>
        <button type="button" onClick={openCopilot} className="pressable mt-4 flex min-h-12 w-full items-center justify-between text-left text-[14px] text-muted-foreground"><span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />{ko ? "여행·생활 도우미에게 물어보기" : "Ask your local guide"}</span><ChevronRight className="h-4 w-4" /></button>
      </main>
    </PhoneFrame>
  )
}
