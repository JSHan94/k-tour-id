"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, BadgeCheck, ChevronRight, ScanLine, Sparkles, Wallet } from "lucide-react"
import { PhoneFrame, LangToggle } from "@/components/app/shell"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import { STAY } from "@/lib/mock-data"

export default function HomePage() {
  const router = useRouter()
  const { session, demoJourney, openCopilot, hydrated } = useApp()
  const { lang } = useLang()
  const ko = lang === "ko"

  useEffect(() => {
    if (hydrated && !session.onboarded) router.replace("/onboarding")
  }, [hydrated, session.onboarded, router])
  if (!session.onboarded) return null

  const name = session.capsule?.holderName ?? session.identity?.displayName ?? "Traveler"
  const remaining = session.capsule
    ? Math.max(0, Math.ceil((new Date(session.capsule.expiresAt).getTime() - Date.now()) / 86_400_000))
    : STAY.total - STAY.day
  const visitorBenefit = session.userType === "foreigner"
  const benefitUsed = ["paid", "settlement-submitted", "anchored"].includes(demoJourney.stage)
  const primaryHref = benefitUsed ? "/benefits" : visitorBenefit ? "/present?auto=1" : "/pass"

  return (
    <PhoneFrame>
      <section className="relative min-h-[520px] overflow-hidden bg-ink text-white">
        <img
          src="/seoul-after-rain-hero.jpg"
          alt={ko ? "비 온 뒤 조용한 북촌 골목" : "A quiet Bukchon alley after rain"}
          className="absolute inset-0 h-full w-full object-cover object-[58%_54%]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,18,28,.68)_0%,rgba(11,18,28,.10)_38%,rgba(11,18,28,.16)_55%,rgba(8,12,18,.90)_100%)]" />

        <header className="safe-top relative z-10 flex items-center justify-between px-6">
          <div>
            <p className="font-display text-[20px] font-semibold tracking-[-0.02em]">K-Tour ID</p>
            <p className="mt-0.5 text-[12px] text-white/62">Seoul · day {STAY.day}</p>
          </div>
          <div className="flex items-center gap-2 text-white">
            <LangToggle />
            <Link href="/profile" aria-label={ko ? "내 정보" : "Profile"} className="pressable">
              <img
                src={session.identity?.photoUrl ?? "/portraits/peter.jpg"}
                alt=""
                className="h-11 w-11 rounded-full border border-white/35 object-cover"
              />
            </Link>
          </div>
        </header>

        <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-7">
          <p className="text-[13px] font-medium text-white/68">
            {ko ? `${name}님, 서울에서의 ${STAY.day}번째 날` : `Day ${STAY.day} in Seoul, ${name}`}
          </p>
          <h1 className="font-display text-balance mt-2 whitespace-pre-line text-[34px] font-semibold leading-[1.16] tracking-[-0.035em]">
            {ko ? "낯선 곳에서도,\n가볍게 증명하세요." : "Prove less.\nTravel more."}
          </h1>
          <Link
            href={primaryHref}
            className="pressable mt-6 flex min-h-14 w-full items-center justify-between rounded-[14px] bg-primary px-5 text-[16px] font-semibold text-white shadow-[0_12px_28px_rgba(0,0,0,.20)]"
          >
            <span className="flex items-center gap-3"><ScanLine className="h-5 w-5" /> {benefitUsed ? (ko ? "오늘의 절약 영수증" : "View today's savings") : visitorBenefit ? (ko ? "매장에서 할인받기" : "Get an in-store discount") : (ko ? "K-Tour ID 확인하기" : "View K-Tour ID")}</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <main className="px-6 py-8">
        <section aria-label={ko ? "여행 상태" : "Trip status"} className="grid grid-cols-2 divide-x divide-foreground/10 border-y border-foreground/10 py-5">
          <Link href="/pass" className="pressable pr-5">
            <span className="flex items-center gap-2 text-[13px] text-muted-foreground"><BadgeCheck className="h-4 w-4 text-success" /> K-Tour ID</span>
            <strong className="mt-2 block text-[17px] font-semibold">{ko ? "사용 가능" : "Active"}</strong>
            <span className="mt-1 block text-[12px] text-muted-foreground">D-{remaining}</span>
          </Link>
          <Link href="/wallet" className="pressable pl-5">
            <span className="flex items-center gap-2 text-[13px] text-muted-foreground"><Wallet className="h-4 w-4" /> {ko ? "여행 잔액" : "Travel balance"}</span>
            <strong className="tabular mt-2 block text-[17px] font-semibold">₩{session.wallet.balanceKRW.toLocaleString()}</strong>
            <span className="mt-1 block text-[12px] text-muted-foreground">KRW</span>
          </Link>
        </section>

        <section className="mt-9">
          <p className="text-[13px] font-semibold text-primary">{ko ? "오늘, 서울에서" : "Today in Seoul"}</p>
          <article className="mt-3 flex items-end gap-5 border-b border-foreground/10 pb-6">
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-balance whitespace-pre-line text-[25px] font-semibold leading-[1.28] tracking-[-0.025em]">
                {benefitUsed
                  ? (ko ? "오늘의 여행에서\n₩5,000을 아꼈어요." : "You saved ₩5,000\non today's journey.")
                  : visitorBenefit
                    ? (ko ? "북촌에서 만나는\n자개의 빛" : "Discover mother-of-pearl\nin Bukchon")
                    : (ko ? "서울을 누리는\n새로운 방식" : "A new way\nto enjoy Seoul")}
              </h2>
              <p className="mt-3 text-[14px] leading-6 text-muted-foreground">
                {benefitUsed
                  ? (ko ? "결제와 할인 내역은 영수증에서 언제든 다시 확인할 수 있어요." : "Your payment and discount details are available in the receipt.")
                  : visitorBenefit
                    ? (ko ? "K-Tour ID로 여행자 할인을 확인하면 ₩5,000을 아낄 수 있어요." : "Verify your traveler status with K-Tour ID and save ₩5,000.")
                    : (ko ? "현재 신분 유형에 맞는 여행 서비스를 K-Tour ID에서 확인하세요." : "View travel services available for your current ID type.")}
              </p>
            </div>
          </article>
        </section>

        <button type="button" onClick={openCopilot} className="pressable mt-6 flex min-h-12 w-full items-center justify-between text-left text-[14px] text-muted-foreground">
          <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> {ko ? "여행 도우미에게 물어보기" : "Ask your travel guide"}</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </main>
    </PhoneFrame>
  )
}
