"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BadgeCheck, Check, ChevronRight, Gift, MapPin, QrCode, Sparkles, Stamp, UsersRound } from "lucide-react"
import { useActivityMembership } from "@/app/connect/use-activity-membership"
import { PageHeader, PhoneFrame } from "@/components/app/shell"
import { PERSONA_CONFIG } from "@/lib/catalog"
import { useLang } from "@/lib/i18n/lang-provider"
import { ACTIVITIES } from "@/lib/mock-data"
import { useApp } from "@/lib/store/app-provider"
import { isCredentialUsable } from "@/lib/credential-status"

const CHECKIN_PREFIX = "k-tour-id:journey-checkin:v2"

export default function JourneyPage() {
  const router = useRouter()
  const { session, hydrated } = useApp()
  const { lang } = useLang()
  const { joinedActivityIds, ready: membershipsReady, isJoined } = useActivityMembership(session.identity?.did)
  const ko = lang === "ko"
  const credentialActive = isCredentialUsable(session.capsule)
  const activity = useMemo(() => ACTIVITIES.find((item) => joinedActivityIds.includes(item.id)), [joinedActivityIds])
  const storageKey = session.identity?.did && activity ? `${CHECKIN_PREFIX}:${encodeURIComponent(session.identity.did)}:${activity.id}` : null
  const [step, setStep] = useState<"ready" | "confirm" | "done">("ready")

  useEffect(() => {
    if (!hydrated) return
    if (!session.onboarded) router.replace("/onboarding")
  }, [hydrated, router, session.onboarded])

  useEffect(() => {
    if (!storageKey) { setStep("ready"); return }
    try { setStep(localStorage.getItem(storageKey) === "done" ? "done" : "ready") }
    catch { setStep("ready") }
  }, [storageKey])

  if (!hydrated || !session.onboarded || !session.userType || !membershipsReady) return null

  if (!credentialActive) {
    return (
      <PhoneFrame hideNav>
        <PageHeader title={ko ? "여행 기록" : "Journey"} back="/wallet" />
        <main className="safe-bottom flex min-h-[calc(100dvh-72px)] flex-col px-6 pb-10 pt-8">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-secondary text-primary"><BadgeCheck className="h-6 w-6" /></span>
          <p className="mt-7 text-[13px] font-semibold text-primary">K-Tour ID</p>
          <h1 className="font-display text-balance mt-2 text-[30px] font-semibold leading-[1.22]">{ko ? "ID를 갱신하면 여행 기록을 이어갈 수 있어요." : "Renew your ID to continue your journey."}</h1>
          <p className="mt-4 text-[14px] leading-6 text-muted-foreground">{ko ? "기존 액티비티 참여와 스탬프 기록은 그대로 보관돼요. 갱신 후 이 화면으로 돌아옵니다." : "Your activity membership and stamps stay saved. You will return here after renewal."}</p>
          <Link href="/onboarding?mode=renew&returnTo=%2Fjourney" className="pressable mt-auto flex min-h-14 items-center justify-between rounded-[14px] bg-primary px-5 text-[15px] font-semibold text-white"><span>{ko ? "K-Tour ID 갱신하기" : "Renew K-Tour ID"}</span><ChevronRight className="h-5 w-5" /></Link>
        </main>
      </PhoneFrame>
    )
  }

  if (!activity) {
    return (
      <PhoneFrame hideNav>
        <PageHeader title={ko ? "여행 기록" : "Journey"} back="/wallet" />
        <main className="safe-bottom flex min-h-[calc(100dvh-72px)] flex-col px-6 pb-10 pt-8">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-secondary text-primary"><UsersRound className="h-6 w-6" /></span>
          <p className="mt-7 text-[13px] font-semibold text-primary">{ko ? "액티비티에서 시작하는 기록" : "A journey that starts with an activity"}</p>
          <h1 className="font-display text-balance mt-2 text-[30px] font-semibold leading-[1.22]">{ko ? "함께할 액티비티를 먼저 골라주세요." : "Choose an activity to begin your journey."}</h1>
          <p className="mt-4 text-[14px] leading-6 text-muted-foreground">{ko ? "참여가 확인된 액티비티만 QR 체크인과 여행 스탬프로 이어져요. 공개 프로필이나 모르는 사람의 DM 없이 시작합니다." : "Only a confirmed activity unlocks QR check-in and a journey stamp. There are no public profiles or open DMs."}</p>
          <Link href="/connect" className="pressable mt-auto flex min-h-14 items-center justify-between rounded-[14px] bg-primary px-5 text-[15px] font-semibold text-white"><span>{ko ? "액티비티 둘러보기" : "Browse activities"}</span><ChevronRight className="h-5 w-5" /></Link>
        </main>
      </PhoneFrame>
    )
  }

  const title = ko ? activity.title : activity.titleEn ?? activity.title
  const place = ko ? activity.place : activity.placeEn ?? activity.place
  const time = ko ? activity.time : activity.timeEn ?? activity.time
  const persona = PERSONA_CONFIG[session.userType]
  const year = new Date().getFullYear()

  const complete = () => {
    if (!credentialActive || !storageKey || !isJoined(activity.id)) return
    try { localStorage.setItem(storageKey, "done") } catch { /* keep the in-session result */ }
    setStep("done")
  }

  return (
    <PhoneFrame hideNav>
      <PageHeader title={ko ? "여행 기록" : "Journey"} back="/wallet" />
      <main className="safe-bottom px-6 pb-10">
        <div className="relative overflow-hidden rounded-[28px] bg-ink text-white">
          <img src={activity.image} alt="" style={{ objectPosition: activity.imagePosition ?? "center" }} className="h-[230px] w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className="text-[13px] font-medium text-white/72">{place}</p>
            <h1 className="font-display mt-1 text-[27px] font-semibold leading-tight">{title}</h1>
          </div>
        </div>

        <section className="mt-7">
          <p className="text-[13px] font-semibold text-primary">{ko ? "참여가 확인된 액티비티" : "Confirmed activity"}</p>
          <h2 className="font-display text-balance mt-2 text-[26px] font-semibold leading-[1.25]">{step === "done" ? (ko ? "여행 스탬프를 모았어요." : "Your journey stamp is saved.") : (ko ? "현장의 액티비티 QR로 체크인하세요." : "Check in with the activity QR.")}</h2>
          <p className="mt-3 text-[14px] leading-6 text-muted-foreground">{step === "done" ? (ko ? "참여 기록을 바탕으로 다음 여행 혜택과 기념 카드를 열었어요." : "Your participation unlocked the next benefit and a keepsake card.") : (ko ? "이 액티비티의 참여자만 체크인할 수 있어요. 신분증 원문이나 정밀 위치는 다른 참여자에게 공개하지 않아요." : "Only confirmed participants can check in. Your identity document and precise location are not shared with other participants.")}</p>
        </section>

        {step === "done" ? <>
          <section className="mt-7 rounded-[24px] bg-[#f3eadb] p-5 ring-1 ring-[#b98b45]/20">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[12px] font-semibold text-[#7d5a22]">{ko ? "여행 스탬프 01" : "JOURNEY STAMP 01"}</p><p className="font-display mt-2 text-[22px] font-semibold">{place} · {year}</p></div><span className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-full border-2 border-primary text-primary"><Stamp className="h-7 w-7" /></span></div>
            <div className="mt-5 flex items-center gap-2 border-t border-[#7d5a22]/15 pt-4 text-[13px] text-[#6d5733]"><BadgeCheck className="h-4 w-4" />{ko ? "액티비티 참여·현장 QR 확인 완료" : "Participation and venue QR confirmed"}</div>
          </section>
          <section className="mt-4 rounded-[24px] bg-surface-2 p-5 ring-1 ring-border"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-card text-primary ring-1 ring-border"><Gift className="h-5 w-5" /></span><div><p className="text-[14px] font-semibold">{ko ? "나의 여행 기념 카드" : "My journey keepsake"}</p><p className="mt-1 text-[13px] leading-5 text-muted-foreground">{ko ? `${title} 참여 기록을 내 여행에 보관했어요.` : `${title} is now saved in your journey.`}</p></div></div></section>
          <Link href={`/explore/${persona.firstItemId}`} className="pressable mt-6 flex min-h-14 items-center justify-between rounded-[14px] bg-primary px-5 text-[15px] font-semibold text-white"><span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4" />{ko ? "다음 추천 혜택 보기" : "See the next recommended benefit"}</span><ChevronRight className="h-5 w-5" /></Link>
        </> : <section className="mt-7 rounded-[24px] bg-surface-2 p-5 ring-1 ring-border">
          <div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-card text-primary ring-1 ring-border"><MapPin className="h-5 w-5" /></span><div><p className="text-[14px] font-semibold">{title}</p><p className="mt-1 text-[13px] leading-5 text-muted-foreground">{place} · {time}</p><p className="mt-1 text-[12px] font-semibold text-success">{ko ? "내 액티비티 참여 확인됨" : "Your participation is confirmed"}</p></div></div>
          {step === "confirm" ? <div className="mt-5 border-t border-foreground/10 pt-4"><p className="text-[13px] leading-5 text-muted-foreground">{ko ? "참여 중인 액티비티의 현장 QR과 일치해요. 기록을 남길까요?" : "This matches your confirmed activity QR. Save the check-in?"}</p><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => setStep("ready")} className="pressable min-h-12 rounded-[12px] bg-card text-[14px] font-semibold ring-1 ring-border">{ko ? "취소" : "Cancel"}</button><button type="button" onClick={complete} className="pressable flex min-h-12 items-center justify-center gap-2 rounded-[12px] bg-primary text-[14px] font-semibold text-white"><Check className="h-4 w-4" />{ko ? "체크인" : "Check in"}</button></div></div> : <button type="button" onClick={() => setStep("confirm")} className="pressable mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-ink px-4 text-[14px] font-semibold text-white"><QrCode className="h-5 w-5 text-gold" />{ko ? "현장 QR 확인" : "Check venue QR"}</button>}
        </section>}
      </main>
    </PhoneFrame>
  )
}
