"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BadgeCheck, Check, ChevronRight, Dices, Landmark, Languages, MessageCircle, ShieldCheck, UsersRound, Utensils, X } from "lucide-react"
import { PhoneFrame, LangToggle } from "@/components/app/shell"
import { Seal } from "@/components/app/seal"
import { useLang } from "@/lib/i18n/lang-provider"
import { formatWon } from "@/lib/format"
import { ACTIVITIES } from "@/lib/mock-data"
import type { Activity, ActivityCategory } from "@/lib/types"
import { useApp } from "@/lib/store/app-provider"
import { useActivityMembership } from "@/app/connect/use-activity-membership"

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
  const [joinError, setJoinError] = useState<"full" | "not-ready" | "storage" | null>(null)
  const currentName = session.identity?.displayName
  const currentPhoto = session.identity?.photoUrl
  const activities = ACTIVITIES.filter((activity) => activity.host !== currentName)
  const { joinedActivityIds, ready: membershipsReady, isJoined, joinActivity, leaveActivity } = useActivityMembership(session.identity?.did)
  const myActivities = activities.filter((activity) => joinedActivityIds.includes(activity.id))

  useEffect(() => {
    if (hydrated && !session.onboarded) router.replace("/onboarding")
  }, [hydrated, router, session.onboarded])

  if (!hydrated || !session.onboarded || !membershipsReady) return null

  const ko = lang === "ko"

  const openActivity = (activity: Activity) => {
    if (isJoined(activity.id)) {
      router.push(`/connect/chat?activity=${activity.id}`)
      return
    }
    setJoinError(null)
    setSelected(activity)
  }

  const confirmJoin = () => {
    if (!selected) return
    const result = joinActivity(selected)
    if (!result.ok) {
      setJoinError(result.reason)
      return
    }
    router.push(`/connect/chat?activity=${selected.id}`)
  }

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

      <section className="px-6 pt-8" aria-labelledby="my-activities-title">
        <div className="flex items-end justify-between">
          <div><p className="text-[12px] font-semibold text-success">CONFIRMED</p><h2 id="my-activities-title" className="font-display mt-1 text-[23px] font-semibold">{ko ? "내 활동" : "My activities"}</h2></div>
          <span className="text-[12px] text-muted-foreground">{myActivities.length}{ko ? "개" : " joined"}</span>
        </div>
        {myActivities.length === 0 ? (
          <div className="mt-3 rounded-[16px] bg-surface-2 px-4 py-4 ring-1 ring-border">
            <p className="text-[13px] font-semibold">{ko ? "아직 참가한 활동이 없어요" : "No confirmed activities yet"}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{ko ? "아래 활동에 참가하면 전용 채팅방이 여기에 저장돼요." : "Join an activity below and its participant chat will stay here."}</p>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {myActivities.map((activity) => <MyActivityCard key={activity.id} activity={activity} onCancel={() => leaveActivity(activity.id)} />)}
          </div>
        )}
      </section>

      <section className="px-6 pt-8">
        <div className="flex items-end justify-between">
          <div><p className="text-[12px] font-semibold text-primary">OPEN NOW</p><h2 className="font-display mt-1 text-[23px] font-semibold">{ko ? "지금 같이할 수 있어요" : "Find something to do together"}</h2></div>
          <span className="text-[12px] text-muted-foreground">{activities.length}{ko ? "개" : " activities"}</span>
        </div>
        <div className="mt-3 divide-y divide-foreground/10 border-y border-foreground/10">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} currentPhoto={currentPhoto} joined={isJoined(activity.id)} onOpen={() => openActivity(activity)} />
          ))}
        </div>
      </section>

      {selected && <JoinSheet activity={selected} error={joinError} onClose={() => { setSelected(null); setJoinError(null) }} onJoin={confirmJoin} />}
    </PhoneFrame>
  )
}

function ActivityCard({ activity, currentPhoto, joined, onOpen }: { activity: Activity; currentPhoto?: string; joined: boolean; onOpen: () => void }) {
  const { t, lang } = useLang()
  const Icon = CAT_ICON[activity.category]
  const title = lang === "en" ? activity.titleEn ?? activity.title : activity.title
  const place = lang === "en" ? activity.placeEn ?? activity.place : activity.place
  const time = lang === "en" ? activity.timeEn ?? activity.time : activity.time
  const joinedCount = Math.min(activity.capacity, activity.joined + (joined ? 1 : 0))
  const full = !joined && activity.joined >= activity.capacity

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
          <span className="ml-2 text-[12px] tabular-nums text-muted-foreground">{joinedCount}/{activity.capacity}{lang === "ko" ? "명" : " joined"}</span>
        </div>
        <span className={`inline-flex items-center gap-0.5 text-[13px] font-semibold ${joined ? "text-success" : full ? "text-muted-foreground" : "text-primary"}`}>{joined ? (lang === "ko" ? "참가 완료 · 채팅 입장" : "Joined · Enter chat") : full ? (lang === "ko" ? "마감" : "Full") : t("connect.join")}{joined ? <Check className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}</span>
      </div>
    </button>
  )
}

function MyActivityCard({ activity, onCancel }: { activity: Activity; onCancel: () => void }) {
  const { lang } = useLang()
  const ko = lang === "ko"
  const title = lang === "en" ? activity.titleEn ?? activity.title : activity.title
  const place = lang === "en" ? activity.placeEn ?? activity.place : activity.place
  const time = lang === "en" ? activity.timeEn ?? activity.time : activity.time

  return (
    <article className="rounded-[18px] bg-card p-4 ring-1 ring-border">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="inline-flex items-center gap-1 text-[11px] font-semibold text-success"><Check className="h-3.5 w-3.5" />{ko ? "참가 확정" : "Participation confirmed"}</p><h3 className="mt-1 truncate text-[15px] font-bold">{title}</h3><p className="mt-1 truncate text-[12px] text-muted-foreground">{place} · {time}</p></div>
        <UsersRound className="h-5 w-5 flex-shrink-0 text-primary" />
      </div>
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={onCancel} className="pressable min-h-11 rounded-xl px-3 text-[12px] font-semibold text-muted-foreground ring-1 ring-border">{ko ? "참가 취소" : "Cancel"}</button>
        <Link href={`/connect/chat?activity=${activity.id}`} className="pressable flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-[12px] font-semibold text-white"><MessageCircle className="h-4 w-4" />{ko ? "채팅방 들어가기" : "Enter group chat"}</Link>
      </div>
    </article>
  )
}

function JoinSheet({ activity, error, onClose, onJoin }: { activity: Activity; error: "full" | "not-ready" | "storage" | null; onClose: () => void; onJoin: () => void }) {
  const { lang } = useLang()
  const ko = lang === "ko"
  const title = lang === "en" ? activity.titleEn ?? activity.title : activity.title
  const place = lang === "en" ? activity.placeEn ?? activity.place : activity.place
  const time = lang === "en" ? activity.timeEn ?? activity.time : activity.time
  const spots = Math.max(0, activity.capacity - activity.joined)
  const full = spots === 0

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
        {error && <p role="alert" className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-center text-[12px] font-semibold text-destructive">{error === "full" ? (ko ? "방금 정원이 마감됐어요. 다른 활동을 골라 주세요." : "This activity just filled up. Choose another one.") : error === "storage" ? (ko ? "참가 상태를 저장하지 못했어요. 브라우저 저장 설정을 확인해 주세요." : "We couldn't save your participation. Check your browser storage settings.") : (ko ? "참가 상태를 불러오는 중이에요. 잠시 후 다시 시도해 주세요." : "Membership is still loading. Try again in a moment.")}</p>}
        <button type="button" onClick={onJoin} disabled={full} className="bg-brand-gradient pressable mt-5 min-h-14 w-full rounded-[15px] text-[15px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">{full ? (ko ? "정원 마감" : "Activity full") : (ko ? "참여하고 채팅방 들어가기" : "Join and enter group chat")}</button>
      </section>
    </div>
  )
}
