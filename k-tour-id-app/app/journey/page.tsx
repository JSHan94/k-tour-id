"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BadgeCheck, Check, ChevronRight, Gift, MapPin, MessageCircle, Navigation, QrCode, Sparkles, Stamp, Utensils } from "lucide-react"
import { useActivityMembership } from "@/app/connect/use-activity-membership"
import { ModernKoreaAtlas } from "@/components/app/modern-korea-atlas"
import { PageHeader, PhoneFrame } from "@/components/app/shell"
import { MARKETPLACE_ITEMS, PERSONA_CONFIG } from "@/lib/catalog"
import { useLang } from "@/lib/i18n/lang-provider"
import { ACTIVITIES } from "@/lib/mock-data"
import { useApp } from "@/lib/store/app-provider"
import { isCredentialUsable } from "@/lib/credential-status"
import { useExternalServiceOrders } from "@/lib/external-service-orders"
import { KOREA_REGIONS, type KoreaRegionId } from "@/lib/map/korea-atlas-data"

const CHECKIN_PREFIX = "k-tour-id:journey-checkin:v2"

function nearestTravelRegion(latitude: number, longitude: number): KoreaRegionId {
  return KOREA_REGIONS.reduce((nearest, candidate) => {
    const distance = ((latitude - candidate.center[0]) ** 2)
      + ((longitude - candidate.center[1]) ** 2)
    return distance < nearest.distance ? { id: candidate.id, distance } : nearest
  }, { id: "capital" as KoreaRegionId, distance: Number.POSITIVE_INFINITY }).id
}

export default function JourneyPage() {
  const router = useRouter()
  const { session, orders, hydrated } = useApp()
  const { lang } = useLang()
  const { joinedActivityIds, ready: membershipsReady, isJoined } = useActivityMembership(session.identity?.did)
  const ko = lang === "ko"
  const credentialActive = isCredentialUsable(session.capsule)
  const externalOrders = useExternalServiceOrders(session.identity?.did ?? "guest")
  const journeyRecords = useMemo(() => [
    ...orders.map((order) => ({
      id: `order-${order.id}`,
      href: `/orders/${order.id}`,
      title: lang === "ko" ? order.title : order.titleEn,
      detail: lang === "ko" ? order.optionLabel : order.optionLabelEn,
      status: order.status,
      timestamp: order.activationAt,
    })),
    ...externalOrders.map((order) => ({
      id: `service-${order.id}`,
      href: `/services/orders/${order.id}`,
      title: lang === "ko" ? order.title : order.titleEn,
      detail: order.provider,
      status: order.status,
      timestamp: order.createdAt,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [externalOrders, lang, orders])
  const joinedActivities = useMemo(() => ACTIVITIES.filter((item) => joinedActivityIds.includes(item.id)), [joinedActivityIds])
  const [checkedInActivityIds, setCheckedInActivityIds] = useState<string[]>([])

  useEffect(() => {
    const did = session.identity?.did
    if (!did) {
      setCheckedInActivityIds([])
      return
    }
    try {
      setCheckedInActivityIds(ACTIVITIES.map((item) => item.id).filter((activityId) => (
        localStorage.getItem(`${CHECKIN_PREFIX}:${encodeURIComponent(did)}:${activityId}`) === "done"
      )))
    } catch {
      setCheckedInActivityIds([])
    }
  }, [session.identity?.did])

  const checkedInActivities = useMemo(
    () => ACTIVITIES.filter((item) => checkedInActivityIds.includes(item.id)),
    [checkedInActivityIds],
  )

  const visitedRegionIds = useMemo(() => {
    const ids = new Set<KoreaRegionId>()
    checkedInActivities.forEach((item) => {
      if (!item.geo) return
      ids.add(nearestTravelRegion(item.geo.latitude, item.geo.longitude))
    })
    orders.filter((order) => order.status === "used").forEach((order) => {
      const item = MARKETPLACE_ITEMS.find((candidate) => candidate.id === order.itemId)
      if (!item?.geo) return
      ids.add(nearestTravelRegion(item.geo.latitude, item.geo.longitude))
    })
    externalOrders.filter((order) => order.status === "completed").forEach((order) => {
      const region = order.entryContext?.region
      if (region && KOREA_REGIONS.some((candidate) => candidate.id === region)) ids.add(region as KoreaRegionId)
    })
    return Array.from(ids)
  }, [checkedInActivities, externalOrders, orders])
  const [selectedActivityId, setSelectedActivityId] = useState("")
  const activity = joinedActivities.find((item) => item.id === selectedActivityId) ?? joinedActivities[0]
  const storageKey = session.identity?.did && activity ? `${CHECKIN_PREFIX}:${encodeURIComponent(session.identity.did)}:${activity.id}` : null
  const [step, setStep] = useState<"ready" | "scanning" | "confirm" | "done">("ready")
  const [checkInError, setCheckInError] = useState(false)

  useEffect(() => {
    if (!hydrated) return
    if (!session.onboarded) router.replace("/onboarding")
  }, [hydrated, router, session.onboarded])

  useEffect(() => {
    setCheckInError(false)
    if (!storageKey) { setStep("ready"); return }
    try { setStep(localStorage.getItem(storageKey) === "done" ? "done" : "ready") }
    catch { setStep("ready") }
  }, [storageKey])

  if (!hydrated || !session.onboarded || !session.userType || !membershipsReady) return null

  if (!credentialActive) {
    return (
      <PhoneFrame>
        <PageHeader title={ko ? "내 여정" : "My journey"} back="/" />
        <main className="safe-bottom px-6 pb-10">
          <JourneyFootprintOverview lang={lang} visitedRegionIds={visitedRegionIds} activityCount={checkedInActivityIds.length} recordCount={journeyRecords.length} />
          <p className="mt-8 text-[13px] font-semibold text-primary">K-Tour ID</p>
          <h1 className="font-display text-balance mt-2 text-[27px] font-semibold leading-[1.24]">{ko ? "ID를 갱신하면 여행 기록을 이어갈 수 있어요." : "Renew your ID to continue your journey."}</h1>
          <p className="mt-4 text-[14px] leading-6 text-muted-foreground">{ko ? "기존 액티비티 참여와 스탬프 기록은 그대로 보관돼요. 갱신 후 이 화면으로 돌아옵니다." : "Your activity membership and stamps stay saved. You will return here after renewal."}</p>
          <CompletedFootprintList activities={checkedInActivities} lang={lang} />
          {journeyRecords.length > 0 && <JourneyRecordList records={journeyRecords} ko={ko} />}
          <Link href="/onboarding?mode=renew&returnTo=%2Fjourney" className="pressable mt-7 flex min-h-14 items-center justify-between rounded-[14px] bg-primary px-5 text-[15px] font-semibold text-white"><span>{ko ? "K-Tour ID 갱신하기" : "Renew K-Tour ID"}</span><ChevronRight className="h-5 w-5" /></Link>
        </main>
      </PhoneFrame>
    )
  }

  if (!activity) {
    return (
      <PhoneFrame>
        <PageHeader title={ko ? "내 여정" : "My journey"} back="/" />
        <main className="safe-bottom px-6 pb-10">
          <JourneyFootprintOverview lang={lang} visitedRegionIds={visitedRegionIds} activityCount={0} recordCount={journeyRecords.length} />
          <p className="mt-8 text-[13px] font-semibold text-primary">{ko ? "다음 발자취" : "YOUR NEXT FOOTPRINT"}</p>
          <h1 className="font-display text-balance mt-2 text-[27px] font-semibold leading-[1.24]">{ko ? "함께할 액티비티를 골라 여행을 시작하세요." : "Choose an activity and begin your journey."}</h1>
          <p className="mt-4 text-[14px] leading-6 text-muted-foreground">{ko ? "참여가 확인된 액티비티만 QR 체크인과 여행 스탬프로 이어져요. 공개 프로필이나 모르는 사람의 DM 없이 시작합니다." : "Only a confirmed activity unlocks QR check-in and a journey stamp. There are no public profiles or open DMs."}</p>
          <CompletedFootprintList activities={checkedInActivities} lang={lang} />
          {journeyRecords.length > 0 && <JourneyRecordList records={journeyRecords} ko={ko} />}
          <Link href="/?focus=experience" className="pressable mt-7 flex min-h-14 items-center justify-between rounded-[14px] bg-primary px-5 text-[15px] font-semibold text-white"><span>{ko ? "지도에서 액티비티 찾기" : "Find activities on the map"}</span><ChevronRight className="h-5 w-5" /></Link>
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
    setCheckInError(false)
    try {
      localStorage.setItem(storageKey, "done")
      if (localStorage.getItem(storageKey) !== "done") throw new Error("CHECKIN_NOT_SAVED")
    } catch {
      setCheckInError(true)
      return
    }
    setCheckedInActivityIds((previous) => previous.includes(activity.id) ? previous : [...previous, activity.id])
    setStep("done")
  }

  return (
    <PhoneFrame>
      <PageHeader title={ko ? "내 여정" : "My journey"} back="/" />
      <main className="safe-bottom px-6 pb-10">
        <JourneyFootprintOverview lang={lang} visitedRegionIds={visitedRegionIds} activityCount={checkedInActivityIds.length} recordCount={journeyRecords.length} />
        {joinedActivities.length > 1 && <section className="no-scrollbar -mx-6 mb-5 overflow-x-auto px-6" aria-label={ko ? "내 액티비티 선택" : "Choose an activity"}><div className="flex gap-2">{joinedActivities.map((item) => <button key={item.id} type="button" aria-pressed={item.id === activity.id} onClick={() => setSelectedActivityId(item.id)} className={`pressable min-h-11 flex-shrink-0 rounded-full px-4 text-[12px] font-semibold ${item.id === activity.id ? "bg-ink text-white" : "bg-secondary text-muted-foreground"}`}>{ko ? item.title : item.titleEn ?? item.title}</button>)}</div></section>}
        <section className="mt-7" aria-labelledby="current-journey-title">
          <div className="flex items-center justify-between"><p className="text-[13px] font-semibold text-primary">{ko ? "오늘의 여정" : "TODAY'S JOURNEY"}</p><span className="text-[12px] text-muted-foreground">{time}</span></div>
          <div className="mt-3 flex gap-4 border-y border-foreground/10 py-4">
            <img src={activity.image} alt="" style={{ objectPosition: activity.imagePosition ?? "center" }} className="h-24 w-24 flex-shrink-0 rounded-[16px] object-cover" />
            <div className="min-w-0 self-center"><p className="text-[12px] font-medium text-muted-foreground">{place}</p><h1 id="current-journey-title" className="font-display mt-1 text-balance text-[23px] font-semibold leading-tight">{title}</h1><p className="mt-2 text-[12px] font-semibold text-success">{ko ? "참여 확인됨" : "Participation confirmed"}</p></div>
          </div>
        </section>

        <section className="mt-5" aria-labelledby="journey-actions-title">
          <div className="flex items-center justify-between"><h2 id="journey-actions-title" className="text-[13px] font-semibold">{ko ? "이 액티비티의 다음 행동" : "Next for this activity"}</h2><span className="text-[12px] text-muted-foreground">{ko ? "참여자 전용" : "Participants only"}</span></div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Link href={`/connect/chat?activity=${activity.id}`} className="pressable flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-[16px] bg-surface-2 px-2 text-center text-[13px] font-semibold ring-1 ring-border"><MessageCircle className="h-5 w-5 text-primary" />{ko ? "그룹 채팅" : "Group chat"}</Link>
            <Link href={`/?contextId=${encodeURIComponent(activity.id)}&branch=mobility`} className="pressable flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-[16px] bg-surface-2 px-2 text-center text-[13px] font-semibold ring-1 ring-border"><Navigation className="h-5 w-5 text-primary" />{ko ? "가는 방법" : "Get there"}</Link>
            <Link href={`/?contextId=${encodeURIComponent(activity.id)}&branch=food`} className="pressable flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-[16px] bg-surface-2 px-2 text-center text-[13px] font-semibold ring-1 ring-border"><Utensils className="h-5 w-5 text-primary" />{ko ? "전후 식사" : "Food nearby"}</Link>
          </div>
        </section>

        <CompletedFootprintList activities={checkedInActivities.filter((item) => item.id !== activity.id)} lang={lang} />
        {journeyRecords.length > 0 && <JourneyRecordList records={journeyRecords} ko={ko} />}

        <section className="mt-7">
          <p className="text-[13px] font-semibold text-primary">{ko ? "참여가 확인된 액티비티" : "Confirmed activity"}</p>
          <h2 className="font-display text-balance mt-2 text-[26px] font-semibold leading-[1.25]">{step === "done" ? (ko ? "여행 스탬프를 모았어요." : "Your journey stamp is saved.") : step === "scanning" ? (ko ? "액티비티 체크인 코드를 비춰주세요." : "Point at the activity check-in code.") : (ko ? "현장의 액티비티 QR로 체크인하세요." : "Check in with the activity QR.")}</h2>
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
          {checkInError && <p role="alert" className="mt-4 rounded-[12px] bg-destructive/10 px-3 py-2.5 text-[12px] font-semibold leading-5 text-destructive">{ko ? "체크인 기록을 저장하지 못했어요. 브라우저 저장 설정을 확인한 뒤 다시 시도해 주세요." : "We couldn't save this check-in. Check your browser storage settings and try again."}</p>}
          {step === "scanning" ? <div className="mt-5 overflow-hidden rounded-[18px] bg-ink p-4 text-white"><div className="relative grid aspect-[4/3] place-items-center rounded-[14px] border border-white/15 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_60%)]"><span className="absolute inset-8 rounded-[18px] border-2 border-gold/80" /><QrCode className="h-12 w-12 text-white/70" /><p className="absolute inset-x-3 bottom-3 text-center text-[13px] text-white/75">{ko ? "카메라 권한을 허용한 뒤 코드를 프레임 안에 맞춰주세요." : "Allow camera access, then align the code inside the frame."}</p></div><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => setStep("ready")} className="pressable min-h-12 rounded-[12px] bg-white/10 text-[14px] font-semibold">{ko ? "취소" : "Cancel"}</button><button type="button" onClick={() => setStep("confirm")} className="pressable min-h-12 rounded-[12px] bg-primary text-[14px] font-semibold">{ko ? "코드 인식" : "Recognize code"}</button></div></div> : step === "confirm" ? <div className="mt-5 border-t border-foreground/10 pt-4"><p className="text-[13px] leading-5 text-muted-foreground">{ko ? "참여 중인 액티비티의 현장 QR과 일치해요. 기록을 남길까요?" : "This matches your confirmed activity QR. Save the check-in?"}</p><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => setStep("ready")} className="pressable min-h-12 rounded-[12px] bg-card text-[14px] font-semibold ring-1 ring-border">{ko ? "취소" : "Cancel"}</button><button type="button" onClick={complete} className="pressable flex min-h-12 items-center justify-center gap-2 rounded-[12px] bg-primary text-[14px] font-semibold text-white"><Check className="h-4 w-4" />{ko ? "체크인" : "Check in"}</button></div></div> : <button type="button" onClick={() => { setCheckInError(false); setStep("scanning") }} className="pressable mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-ink px-4 text-[14px] font-semibold text-white"><QrCode className="h-5 w-5 text-gold" />{ko ? "QR 스캔 시작" : "Start QR scan"}</button>}
        </section>}
      </main>
    </PhoneFrame>
  )
}

function JourneyFootprintOverview({
  lang,
  visitedRegionIds,
  activityCount,
  recordCount,
}: {
  lang: "ko" | "en"
  visitedRegionIds: KoreaRegionId[]
  activityCount: number
  recordCount: number
}) {
  const ko = lang === "ko"
  return (
    <section className="journey-footprint-panel -mx-6 border-y border-foreground/[0.06] px-6 pb-6 pt-5" aria-labelledby="footprint-title">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium text-muted-foreground">{ko ? "다녀온 곳이 지도가 되는" : "THE MAP YOU HAVE LIVED"}</p>
          <h1 id="footprint-title" className="font-display mt-1 text-[27px] font-semibold tracking-[-0.03em]">{ko ? "나의 발자취" : "My footprints"}</h1>
        </div>
        <p className="tabular text-[13px] font-semibold"><span className="text-primary">{visitedRegionIds.length}</span><span className="text-muted-foreground"> / {KOREA_REGIONS.length}</span></p>
      </div>
      <ModernKoreaAtlas
        lang={lang}
        variant="footprint"
        compact
        visitedRegionIds={visitedRegionIds}
        className="-mb-7 -mt-3"
      />
      <div className="grid grid-cols-3 divide-x divide-foreground/10 border-t border-foreground/10 pt-4 text-center">
        <div><strong className="tabular block text-[20px] font-medium">{visitedRegionIds.length}</strong><span className="mt-1 block text-[12px] text-muted-foreground">{ko ? "기록된 권역" : "Regions logged"}</span></div>
        <div><strong className="tabular block text-[20px] font-medium">{activityCount}</strong><span className="mt-1 block text-[12px] text-muted-foreground">{ko ? "체크인" : "Check-ins"}</span></div>
        <div><strong className="tabular block text-[20px] font-medium">{recordCount}</strong><span className="mt-1 block text-[12px] text-muted-foreground">{ko ? "이용 기록" : "Records"}</span></div>
      </div>
    </section>
  )
}

function CompletedFootprintList({ activities, lang }: { activities: typeof ACTIVITIES[number][]; lang: "ko" | "en" }) {
  if (activities.length === 0) return null
  const ko = lang === "ko"
  return (
    <section className="mt-6" aria-labelledby="completed-footprints-title">
      <div className="flex items-center justify-between">
        <h2 id="completed-footprints-title" className="text-[13px] font-semibold">{ko ? "완료한 발자취" : "Completed footprints"}</h2>
        <span className="text-[12px] text-muted-foreground">{activities.length}{ko ? "개" : " saved"}</span>
      </div>
      <div className="mt-2 divide-y divide-foreground/10 border-y border-foreground/10">
        {activities.map((item) => (
          <Link key={item.id} href={`/?contextId=${encodeURIComponent(item.id)}&focus=experience`} className="pressable flex min-h-16 items-center gap-3 py-3">
            <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-[#f3eadb] text-primary"><Stamp className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold">{ko ? item.title : item.titleEn ?? item.title}</span>
              <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">{ko ? item.place : item.placeEn ?? item.place} · {ko ? "현장 확인 완료" : "Venue check-in confirmed"}</span>
            </span>
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </section>
  )
}

function JourneyRecordList({ records, ko }: { records: Array<{ id: string; href: string; title: string; detail: string; status: string; timestamp: string }>; ko: boolean }) {
  return (
    <section className="mt-6" aria-labelledby="journey-records-title">
      <div className="flex items-center justify-between"><h2 id="journey-records-title" className="text-[13px] font-semibold">{ko ? "여행 일정·이용 기록" : "Trip schedule & services"}</h2><span className="text-[12px] text-muted-foreground">{records.length}{ko ? "건" : " items"}</span></div>
      <div className="mt-2 divide-y divide-foreground/10 border-y border-foreground/10">
        {records.map((record) => <Link key={record.id} href={record.href} className="pressable flex min-h-16 items-center gap-3 py-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-primary"><BadgeCheck className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold">{record.title}</span><span className="mt-0.5 block truncate text-[12px] text-muted-foreground">{formatJourneyDate(record.timestamp, ko)} · {record.detail} · {journeyStatusLabel(record.status, ko)}</span></span><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link>)}
      </div>
    </section>
  )
}

function formatJourneyDate(value: string, ko: boolean) {
  return new Intl.DateTimeFormat(ko ? "ko-KR" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value))
}

function journeyStatusLabel(status: string, ko: boolean) {
  const labels: Record<string, [string, string]> = {
    paid: ["예약 완료", "Booked"], used: ["이용 중", "Active"], confirmed: ["진행 중", "In progress"], completed: ["이용 완료", "Completed"], pending: ["확인 중", "Checking"], cancelled: ["취소", "Cancelled"], failed: ["실패", "Failed"], "refund-pending": ["환불 확인 중", "Refund pending"], "partially-refunded": ["부분 환불", "Partially refunded"], refunded: ["환불 완료", "Refunded"],
  }
  return labels[status]?.[ko ? 0 : 1] ?? status
}
