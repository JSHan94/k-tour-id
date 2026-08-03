"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BadgeCheck, ChevronRight, Dices, Landmark, Languages, ShieldCheck, UsersRound, Utensils, X } from "lucide-react"
import { PhoneFrame, LangToggle } from "@/components/app/shell"
import { Seal } from "@/components/app/seal"
import { useLang } from "@/lib/i18n/lang-provider"
import { formatWon } from "@/lib/format"
import { ACTIVITIES } from "@/lib/mock-data"
import type { Activity, ActivityCategory } from "@/lib/types"
import { useApp } from "@/lib/store/app-provider"

const CAT_ICON: Record<ActivityCategory, React.ComponentType<{ className?: string }>> = {
  food: Utensils,
  tour: Landmark,
  language: Languages,
  play: Dices,
}

function IdentityBadge() {
  const { t } = useLang()
  return (
    <span className="inline-flex flex-shrink-0 items-center gap-1 text-[12px] font-semibold text-success">
      <BadgeCheck className="h-3.5 w-3.5" /> {t("connect.verified")}
    </span>
  )
}

export default function ConnectPage() {
  const router = useRouter()
  const { session, hydrated } = useApp()
  const { t, lang } = useLang()
  const [selected, setSelected] = useState<Activity | null>(null)
  const currentName = session.identity?.displayName
  const currentPhoto = session.identity?.photoUrl
  const activities = ACTIVITIES.filter((activity) => activity.host !== currentName)

  useEffect(() => {
    if (hydrated && !session.onboarded) router.replace("/onboarding")
  }, [hydrated, router, session.onboarded])

  if (!hydrated || !session.onboarded) return null

  const ko = lang === "ko"

  return (
    <PhoneFrame>
      <header className="safe-top flex items-end justify-between px-6 pb-5">
        <div>
          <p className="text-[12px] font-semibold text-primary">ACTIVITIES · NEW FRIENDS</p>
          <h1 className="font-display mt-1 text-[30px] font-semibold tracking-[-0.03em] text-foreground">{t("connect.title")}</h1>
        </div>
        <LangToggle />
      </header>

      <section className="mx-6 border-y border-foreground/10 py-5">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-secondary"><Seal size={27} /></span>
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-foreground">{t("connect.hero")}</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{t("connect.heroSub")}</p>
          </div>
        </div>
        <p className="mt-4 flex items-start gap-2 text-[12px] leading-relaxed text-muted-foreground"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-success" />{t("connect.conceptNotice")}</p>
      </section>

      <section className="px-6 pt-8">
        <div className="flex items-end justify-between">
          <div><p className="text-[12px] font-semibold text-primary">OPEN NOW</p><h2 className="font-display mt-1 text-[23px] font-semibold">{ko ? "지금 같이할 수 있어요" : "Find something to do together"}</h2></div>
          <span className="text-[12px] text-muted-foreground">{activities.length}{ko ? "개" : " activities"}</span>
        </div>
        <div className="mt-3 divide-y divide-foreground/10 border-y border-foreground/10">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} currentPhoto={currentPhoto} onOpen={() => setSelected(activity)} />
          ))}
        </div>
      </section>

      {selected && <JoinSheet activity={selected} onClose={() => setSelected(null)} onJoin={() => router.push(`/connect/chat?activity=${selected.id}`)} />}
    </PhoneFrame>
  )
}

function ActivityCard({ activity, currentPhoto, onOpen }: { activity: Activity; currentPhoto?: string; onOpen: () => void }) {
  const { t, lang } = useLang()
  const Icon = CAT_ICON[activity.category]
  const title = lang === "en" ? activity.titleEn ?? activity.title : activity.title
  const place = lang === "en" ? activity.placeEn ?? activity.place : activity.place
  const time = lang === "en" ? activity.timeEn ?? activity.time : activity.time

  return (
    <button type="button" onClick={onOpen} className="pressable w-full py-5 text-left">
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg bg-secondary text-primary"><Icon className="h-4 w-4" /></span>
        <span className="truncate">{t(`connect.cat.${activity.category}`)} · {place}</span>
        <span className="ml-auto flex-shrink-0">{time}</span>
      </div>

      <h3 className="mt-3 text-[16px] font-bold text-foreground">{title}</h3>
      <div className="mt-2 flex items-center gap-2">
        <img src={activity.hostPhoto} alt={activity.host} className="h-7 w-7 rounded-full object-cover ring-1 ring-border" />
        <span className="text-[12px] font-semibold text-foreground">{activity.host} {activity.hostFlag}</span>
        <IdentityBadge />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {activity.participants.filter((photo) => photo !== currentPhoto).slice(0, 4).map((photo, index) => (
              <img key={index} src={photo} alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-card" />
            ))}
          </div>
          <span className="ml-2 text-[12px] tabular-nums text-muted-foreground">{activity.joined}/{activity.capacity}{lang === "ko" ? "명" : " joined"}</span>
        </div>
        <span className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-primary">{t("connect.join")}<ChevronRight className="h-3.5 w-3.5" /></span>
      </div>
    </button>
  )
}

function JoinSheet({ activity, onClose, onJoin }: { activity: Activity; onClose: () => void; onJoin: () => void }) {
  const { lang } = useLang()
  const ko = lang === "ko"
  const title = lang === "en" ? activity.titleEn ?? activity.title : activity.title
  const place = lang === "en" ? activity.placeEn ?? activity.place : activity.place
  const time = lang === "en" ? activity.timeEn ?? activity.time : activity.time
  const spots = Math.max(0, activity.capacity - activity.joined)

  return (
    <div className="fixed inset-0 z-[70] bg-black/35" role="presentation">
      <button type="button" aria-label={ko ? "닫기" : "Close"} className="absolute inset-0" onClick={onClose} />
      <section role="dialog" aria-modal="true" aria-labelledby="join-title" className="safe-bottom fixed bottom-0 left-1/2 w-full max-w-[420px] -translate-x-1/2 rounded-t-[30px] bg-background px-6 pb-7 pt-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-[12px] font-semibold text-primary">{ko ? "가벼운 참가 확인" : "Quick join"}</p><h2 id="join-title" className="font-display mt-1 text-[24px] font-semibold leading-tight">{title}</h2><p className="mt-2 text-[12px] text-muted-foreground">{place} · {time}</p></div>
          <button type="button" onClick={onClose} aria-label={ko ? "닫기" : "Close"} className="pressable grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-secondary"><X className="h-4 w-4" /></button>
        </div>

        <div className="mt-6 divide-y divide-foreground/10 border-y border-foreground/10">
          <div className="flex items-center gap-3 py-4"><BadgeCheck className="h-5 w-5 text-success" /><div><p className="text-[13px] font-semibold">K-Tour ID {ko ? "확인 완료" : "checked"}</p><p className="mt-0.5 text-[12px] text-muted-foreground">{ko ? "별도 인터뷰 없이 바로 참여할 수 있어요" : "No interview or extra screening"}</p></div></div>
          <div className="flex items-center gap-3 py-4"><UsersRound className="h-5 w-5 text-primary" /><div><p className="text-[13px] font-semibold">{ko ? `${activity.joined}명이 기다리고 있어요` : `${activity.joined} people are joining`}</p><p className="mt-0.5 text-[12px] text-muted-foreground">{ko ? `남은 자리 ${spots}개 · 관심사와 언어로 만나는 친구들` : `${spots} spots left · meet through shared interests and language`}</p></div></div>
          <div className="flex items-center gap-3 py-4"><ShieldCheck className="h-5 w-5 text-primary" /><div><p className="text-[13px] font-semibold">{ko ? "참가자 전용 그룹 채팅" : "Group chat for participants"}</p><p className="mt-0.5 text-[12px] text-muted-foreground">{ko ? "참여하면 장소와 준비물을 같이 이야기해요" : "Coordinate the place and what to bring after joining"}</p></div></div>
        </div>

        {activity.costKRW != null && <p className="mt-4 text-center text-[12px] text-muted-foreground">{ko ? "예상 1인 비용" : "Estimated per person"} · <strong className="text-foreground">{lang === "ko" ? formatWon(activity.costKRW) : `₩${activity.costKRW.toLocaleString("en-US")}`}</strong></p>}
        <button type="button" onClick={onJoin} className="bg-brand-gradient pressable mt-5 min-h-14 w-full rounded-[15px] text-[15px] font-semibold text-white">{ko ? "참여하고 채팅방 들어가기" : "Join and enter group chat"}</button>
      </section>
    </div>
  )
}
