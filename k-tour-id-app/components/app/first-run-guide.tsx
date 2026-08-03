"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowRight, BadgeCheck, Check, LocateFixed, UsersRound, X } from "lucide-react"
import { useLang } from "@/lib/i18n/lang-provider"
import { useNearbyLocation } from "@/lib/location/location-provider"

const GUIDE_KEY = "k-tour-id-first-guide-v1"

const STEPS = [
  {
    icon: LocateFixed,
    eyebrowKo: "지금 여기에서 시작",
    eyebrowEn: "START WHERE YOU ARE",
    titleKo: "가까운 선택부터\n보여드릴게요.",
    titleEn: "See what’s closest\nright now.",
    bodyKo: "위치를 허용하면 이용 가능한 혜택을 거리와 이동시간 순으로 정리해요. 대략적 위치는 이 기기에만 보관해요.",
    bodyEn: "Enable location to rank eligible benefits by distance and travel time. Your approximate location stays on this device.",
  },
  {
    icon: BadgeCheck,
    eyebrowKo: "한 번 확인하고 가볍게",
    eyebrowEn: "VERIFY ONCE",
    titleKo: "가능한 혜택만\n먼저 골라드려요.",
    titleEn: "Only see benefits\nyou can actually use.",
    bodyKo: "K-Tour ID가 체류 유형과 이용 자격에 맞는 교통·문화·생활 서비스를 먼저 보여줘요. ID와 여행 잔액은 한 탭에서 확인할 수 있어요.",
    bodyEn: "K-Tour ID prioritizes transit, culture and everyday services that fit your stay. Your ID and travel balance live in one place.",
  },
  {
    icon: UsersRound,
    eyebrowKo: "액티비티에서 자연스럽게",
    eyebrowEn: "MEET THROUGH ACTIVITIES",
    titleKo: "함께한 사람과만\n연결할 수 있어요.",
    titleEn: "Connect only after\nan activity brings you together.",
    bodyKo: "친구 찾기는 공개 DM이 아니라 액티비티 참여에서 시작해요. 참여한 사람끼리만 그룹 채팅이 열려 부담을 낮췄어요.",
    bodyEn: "Friend-making starts with an activity, not open DMs. Group chat opens only for participants, keeping the first step comfortable.",
  },
] as const

export function FirstRunGuide() {
  const { lang } = useLang()
  const { requestLocation, status } = useNearbyLocation()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const dialogRef = useRef<HTMLElement>(null)
  const ko = lang === "ko"

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("welcome") !== "1") return
    let seen = false
    try { seen = localStorage.getItem(GUIDE_KEY) === "seen" } catch { /* unavailable */ }
    if (seen) {
      params.delete("welcome")
      window.history.replaceState({}, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`)
      return
    }
    setOpen(true)
  }, [])

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
    try { localStorage.setItem(GUIDE_KEY, "seen") } catch { /* unavailable */ }
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
    await requestLocation()
    advance()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/58 px-0 backdrop-blur-[2px]" role="presentation">
      <section ref={dialogRef} tabIndex={-1} onKeyDown={(event) => { if (event.key === "Escape") close() }} role="dialog" aria-modal="true" aria-labelledby="first-guide-title" className="safe-bottom max-h-[94vh] w-full max-w-[420px] overflow-y-auto rounded-t-[30px] bg-background px-6 pb-6 pt-4 outline-none shadow-[0_-24px_70px_rgba(0,0,0,.24)]">
        <div className="mx-auto h-1 w-9 rounded-full bg-foreground/15" />
        <div className="mt-5 flex items-center justify-between">
          <div className="flex gap-1.5" aria-label={`${step + 1} / ${STEPS.length}`}>
            {STEPS.map((_, index) => <span key={index} className={`h-1.5 rounded-full transition-all ${index === step ? "w-7 bg-primary" : "w-1.5 bg-foreground/15"}`} />)}
          </div>
          <button type="button" onClick={close} aria-label={ko ? "가이드 건너뛰기" : "Skip guide"} className="pressable grid h-11 w-11 place-items-center rounded-full text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-5 grid h-14 w-14 place-items-center rounded-full bg-secondary text-primary"><Icon className="h-6 w-6" /></div>
        {step === 0 && <p className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-success-surface px-3 py-1.5 text-[11px] font-semibold text-success"><Check className="h-3.5 w-3.5" />{ko ? "K-Tour ID 준비 완료" : "Your K-Tour ID is ready"}</p>}
        <p className={step === 0 ? "mt-4 text-[12px] font-semibold tracking-[0.08em] text-primary" : "mt-6 text-[12px] font-semibold tracking-[0.08em] text-primary"}>{ko ? current.eyebrowKo : current.eyebrowEn}</p>
        <h2 id="first-guide-title" className="font-display text-balance mt-2 whitespace-pre-line text-[30px] font-semibold leading-[1.2] tracking-[-0.03em]">{ko ? current.titleKo : current.titleEn}</h2>
        <p className="mt-4 text-[14px] leading-6 text-muted-foreground">{ko ? current.bodyKo : current.bodyEn}</p>
        {step === 0 && <div className="mt-5 flex items-start gap-3 rounded-[14px] bg-success-surface px-4 py-3 text-[12px] leading-5 text-success"><Check className="mt-0.5 h-4 w-4 flex-shrink-0" /><span>{ko ? "위치를 켜지 않아도 서울 중심 추천으로 계속 이용할 수 있어요." : "You can continue with central Seoul recommendations without enabling location."}</span></div>}
        <button type="button" onClick={step === 0 ? () => void useLocation() : advance} disabled={status === "requesting"} className="pressable mt-7 flex min-h-14 w-full items-center justify-between rounded-[14px] bg-primary px-5 text-[16px] font-semibold text-white disabled:opacity-50">
          <span>{step === 0 ? (status === "requesting" ? (ko ? "현재 위치 확인 중…" : "Finding your location…") : (ko ? "현재 위치로 시작" : "Use my current location")) : step === STEPS.length - 1 ? (ko ? "홈 시작하기" : "Start exploring") : (ko ? "다음" : "Next")}</span>
          <ArrowRight className="h-5 w-5" />
        </button>
        {step === 0 && <button type="button" onClick={advance} className="pressable mt-2 min-h-11 w-full text-[13px] font-medium text-muted-foreground">{ko ? "위치 없이 계속" : "Continue without location"}</button>}
      </section>
    </div>
  )
}
