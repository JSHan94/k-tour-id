"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowRight, BadgeCheck, Check, LocateFixed, UsersRound, X } from "lucide-react"
import { useLang } from "@/lib/i18n/lang-provider"
import { useNearbyLocation } from "@/lib/location/location-provider"
import { useApp } from "@/lib/store/app-provider"

const GUIDE_KEY = "k-tour-id-first-guide-v1"

const STEPS = [
  {
    icon: LocateFixed,
    eyebrowKo: "지금 여기에서 시작",
    eyebrowEn: "START WHERE YOU ARE",
    titleKo: "한국 여행의 맥을\n지도에서 펼쳐보세요.",
    titleEn: "Open your map\nfor traveling Korea.",
    bodyKo: "위치를 허용하면 가까운 장소·액티비티·혜택을 하나의 지도에서 보여줘요. 대략적 위치는 이 기기에만 보관해요.",
    bodyEn: "Enable location to see nearby places, activities and benefits on one map. Your approximate location stays on this device.",
  },
  {
    icon: BadgeCheck,
    eyebrowKo: "한 번 확인하고 가볍게",
    eyebrowEn: "VERIFY ONCE",
    titleKo: "가능한 혜택만\n먼저 골라드려요.",
    titleEn: "Only see benefits\nyou can actually use.",
    bodyKo: "장소를 고르면 내 자격에 맞는 혜택과 예약을 붙여줘요. 교통·식사는 별도 쇼핑몰이 아니라 지금 여정에 필요한 순간에 나타나요.",
    bodyEn: "Choose a place and your eligible benefits and booking options appear. Mobility and food branch from the trip only when needed.",
  },
  {
    icon: UsersRound,
    eyebrowKo: "액티비티에서 자연스럽게",
    eyebrowEn: "MEET THROUGH ACTIVITIES",
    titleKo: "같은 액티비티 참여자와만\n연결할 수 있어요.",
    titleEn: "Connect only with people\nin the same activity.",
    bodyKo: "친구 찾기는 공개 DM이 아니라 액티비티 참여에서 시작해요. 같은 액티비티 참여자끼리만 그룹 채팅이 열려 부담을 낮췄어요.",
    bodyEn: "Friend-making starts with an activity, not open DMs. Group chat opens only for people confirmed in the same activity.",
  },
] as const

export function FirstRunGuide() {
  const { lang } = useLang()
  const { session } = useApp()
  const { requestLocation, status } = useNearbyLocation()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [locationError, setLocationError] = useState(false)
  const dialogRef = useRef<HTMLElement>(null)
  const ko = lang === "ko"
  const holderId = session.capsule?.did ?? session.identity?.did
  const guideKey = holderId ? `${GUIDE_KEY}:${encodeURIComponent(holderId)}` : null

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("welcome") !== "1") return
    if (!guideKey) return
    let seen = false
    try { seen = localStorage.getItem(guideKey) === "seen" } catch { /* unavailable */ }
    if (seen) {
      params.delete("welcome")
      window.history.replaceState({}, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`)
      return
    }
    setOpen(true)
  }, [guideKey])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const frame = window.requestAnimationFrame(() => dialogRef.current?.focus())
    return () => {
      window.cancelAnimationFrame(frame)
      document.body.style.overflow = previousOverflow
    }
  }, [open, step])

  if (!open) return null
  const current = STEPS[step]
  const Icon = current.icon

  const close = () => {
    if (guideKey) {
      try { localStorage.setItem(guideKey, "seen") } catch { /* unavailable */ }
    }
    const params = new URLSearchParams(window.location.search)
    params.delete("welcome")
    window.history.replaceState({}, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`)
    setOpen(false)
  }

  const advance = () => {
    if (step === STEPS.length - 1) close()
    else setStep((value) => value + 1)
  }

  const useLocation = async () => {
    setLocationError(false)
    const granted = await requestLocation()
    if (granted) advance()
    else setLocationError(true)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/58 px-0 backdrop-blur-[2px]" role="presentation">
      <section ref={dialogRef} tabIndex={-1} onKeyDown={(event) => {
        if (event.key === "Escape") { close(); return }
        if (event.key !== "Tab") return
        const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [])
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (!first || !last) { event.preventDefault(); dialogRef.current?.focus(); return }
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }} role="dialog" aria-modal="true" aria-labelledby="first-guide-title" className="safe-bottom max-h-[94vh] w-full max-w-[420px] overflow-y-auto rounded-t-[30px] bg-background px-6 pb-6 pt-4 outline-none shadow-[0_-24px_70px_rgba(0,0,0,.24)]">
        <div className="mx-auto h-1 w-9 rounded-full bg-foreground/15" />
        <div className="mt-5 flex items-center justify-between">
          <div className="flex gap-1.5" aria-label={`${step + 1} / ${STEPS.length}`}>
            {STEPS.map((_, index) => <span key={index} className={`h-1.5 rounded-full transition-all ${index === step ? "w-7 bg-primary" : "w-1.5 bg-foreground/15"}`} />)}
          </div>
          <button type="button" onClick={close} aria-label={ko ? "가이드 건너뛰기" : "Skip guide"} className="pressable grid h-11 w-11 place-items-center rounded-full text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-5 grid h-14 w-14 place-items-center rounded-full bg-secondary text-primary"><Icon className="h-6 w-6" /></div>
        {step === 0 && <p className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-success-surface px-3 py-1.5 text-[12px] font-semibold text-success"><Check className="h-3.5 w-3.5" />{ko ? "K-Tour ID 준비 완료" : "Your K-Tour ID is ready"}</p>}
        <p className={step === 0 ? "mt-4 text-[13px] font-semibold tracking-[0.04em] text-primary" : "mt-6 text-[13px] font-semibold tracking-[0.04em] text-primary"}>{ko ? current.eyebrowKo : current.eyebrowEn}</p>
        <h2 id="first-guide-title" className="font-display text-balance mt-2 whitespace-pre-line text-[30px] font-semibold leading-[1.2] tracking-[-0.03em]">{ko ? current.titleKo : current.titleEn}</h2>
        <p className="mt-4 text-[14px] leading-6 text-muted-foreground">{ko ? current.bodyKo : current.bodyEn}</p>
        {step === 0 && <div className="mt-5 flex items-start gap-3 rounded-[14px] bg-success-surface px-4 py-3 text-[12px] leading-5 text-success"><Check className="mt-0.5 h-4 w-4 flex-shrink-0" /><span>{ko ? "위치를 켜지 않아도 대한민국 지도에서 여행 지역을 골라 시작할 수 있어요." : "You can choose a region from the Korea map without enabling location."}</span></div>}
        {step === 0 && locationError && <p role="alert" className="mt-3 rounded-[14px] bg-destructive/10 px-4 py-3 text-[12px] font-medium leading-5 text-destructive">{ko ? "위치를 확인하지 못했어요. 기기 설정에서 위치 권한을 켜고 다시 시도하거나, 위치 없이 계속할 수 있어요." : "We couldn't access your location. Enable location in your device settings and try again, or continue without it."}</p>}
        <button type="button" onClick={step === 0 ? () => void useLocation() : advance} disabled={status === "requesting"} className="pressable mt-7 flex min-h-14 w-full items-center justify-between rounded-[14px] bg-primary px-5 text-[16px] font-semibold text-white disabled:opacity-50">
          <span>{step === 0 ? (status === "requesting" ? (ko ? "현재 위치 확인 중…" : "Finding your location…") : locationError ? (ko ? "위치 다시 확인" : "Try location again") : (ko ? "현재 위치로 시작" : "Use my current location")) : step === STEPS.length - 1 ? (ko ? "내 여행 지도 열기" : "Open my travel map") : (ko ? "다음" : "Next")}</span>
          <ArrowRight className="h-5 w-5" />
        </button>
        {step === 0 && <button type="button" onClick={() => { setLocationError(false); advance() }} className="pressable mt-2 min-h-11 w-full text-[13px] font-medium text-muted-foreground">{ko ? "지역을 골라 시작" : "Choose a region instead"}</button>}
      </section>
    </div>
  )
}
