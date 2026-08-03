"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, BadgeCheck, Check, Contact, Loader2, Plane, ShieldCheck, Smartphone } from "lucide-react"
import { PhoneFrame, LangToggle } from "@/components/app/shell"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import { PERSONA_CONFIG } from "@/lib/catalog"
import { localizedNationality } from "@/lib/format"
import type { Identity, IdentityMethod, UserType } from "@/lib/types"
import { cn } from "@/lib/utils"

type Step = "cover" | "persona" | "verify" | "done"
type VerificationPhase = "idle" | "handoff" | "approval" | "result"

const METHODS: {
  key: UserType
  method: IdentityMethod
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { key: "foreigner", method: "passport-did", icon: Plane },
  { key: "long-term", method: "foreigner-id", icon: Contact },
  { key: "korean", method: "mobile-id", icon: Smartphone },
]

const VERIFICATION_JOURNEY: Record<UserType, {
  eyebrowKo: string
  eyebrowEn: string
  ko: string
  en: string
  actionKo: string
  actionEn: string
  providerKo: string
  providerEn: string
  claimsKo: string
  claimsEn: string
}> = {
  foreigner: {
    eyebrowKo: "여권·얼굴 확인",
    eyebrowEn: "PASSPORT + FACE",
    ko: "여권 정보와 얼굴 일치 결과를 확인해요",
    en: "Check the passport chip and face-match result",
    actionKo: "여권으로 계속하기",
    actionEn: "Continue with passport",
    providerKo: "여권·얼굴 본인확인 기관",
    providerEn: "Passport and face-match identity provider",
    claimsKo: "여권 유효 여부, 이름, 국적, 생년월일, 얼굴 일치 결과",
    claimsEn: "Passport validity, name, nationality, date of birth and face-match result",
  },
  "long-term": {
    eyebrowKo: "외국인등록증 확인",
    eyebrowEn: "RESIDENCE CARD",
    ko: "외국인등록증으로 본인 확인을 진행해요",
    en: "Verify your identity with your Residence Card",
    actionKo: "외국인등록증으로 계속하기",
    actionEn: "Continue with Residence Card",
    providerKo: "외국인등록증 본인확인 기관",
    providerEn: "Residence Card identity provider",
    claimsKo: "외국인등록증 유효 여부, 이름, 국적, 생년월일, 본인확인 결과",
    claimsEn: "Residence Card validity, name, nationality, date of birth and identity verification result",
  },
  korean: {
    eyebrowKo: "모바일 신분증 확인",
    eyebrowEn: "MOBILE ID",
    ko: "모바일 신분증 앱에서 요청을 승인해요",
    en: "Approve the request in the Mobile ID app",
    actionKo: "모바일 신분증으로 계속하기",
    actionEn: "Continue with Mobile ID",
    providerKo: "모바일 신분증 본인확인 기관",
    providerEn: "Mobile ID identity provider",
    claimsKo: "모바일 신분증 유효 여부, 이름, 국적, 생년월일",
    claimsEn: "Mobile ID validity, name, nationality and date of birth",
  },
}

export default function OnboardingPage() {
  const router = useRouter()
  const { verifyIdentity, issueCapsule, session, hydrated } = useApp()
  const { lang } = useLang()
  const ko = lang === "ko"
  const [step, setStep] = useState<Step>("cover")
  const [selected, setSelected] = useState<UserType>("foreigner")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [renewMode, setRenewMode] = useState(false)
  const [issuedHere, setIssuedHere] = useState(false)
  const [identityPreview, setIdentityPreview] = useState<Identity | null>(null)
  const [verificationPhase, setVerificationPhase] = useState<VerificationPhase>("idle")
  const [consentChecked, setConsentChecked] = useState(false)
  const [returnTo, setReturnTo] = useState("/pass")
  const completionHeadingRef = useRef<HTMLHeadingElement>(null)
  const seededPersonaApplied = useRef(false)

  useEffect(() => {
    if (!hydrated) return
    const params = new URLSearchParams(window.location.search)
    const renew = params.get("mode") === "renew"
    const seeded = params.get("persona") as UserType | null
    const requestedReturn = params.get("returnTo")
    if (requestedReturn && (requestedReturn.startsWith("/present") || requestedReturn.startsWith("/explore/") || requestedReturn.startsWith("/connect") || requestedReturn.startsWith("/journey"))) setReturnTo(requestedReturn)
    if (!seededPersonaApplied.current && seeded && METHODS.some((item) => item.key === seeded)) {
      setSelected(seeded)
      seededPersonaApplied.current = true
    }
    if (renew) {
      setRenewMode(true)
      setSelected(session.userType ?? "foreigner")
      setStep("verify")
      return
    }
    if (session.onboarded && !issuedHere) router.replace("/")
  }, [hydrated, issuedHere, router, session.onboarded, session.userType])

  useEffect(() => {
    if (step !== "done") return
    const frame = window.requestAnimationFrame(() => completionHeadingRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [step])

  const chosen = useMemo(() => METHODS.find((item) => item.key === selected) ?? METHODS[0], [selected])
  const persona = PERSONA_CONFIG[selected]
  const verificationJourney = VERIFICATION_JOURNEY[selected]
  const verificationSteps = [
    { key: "handoff" as const, ko: "본인확인 기관으로 요청 전달", en: "Send request to identity provider" },
    { key: "approval" as const, ko: "기관 승인 대기", en: "Wait for provider approval" },
    { key: "result" as const, ko: "확인 결과 불러오기", en: "Retrieve verification result" },
  ]
  const verificationPhaseIndex = verificationSteps.findIndex((item) => item.key === verificationPhase)
  const movePersona = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return
    event.preventDefault()
    const next = event.key === "Home" ? 0
      : event.key === "End" ? METHODS.length - 1
        : (index + (event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1) + METHODS.length) % METHODS.length
    setSelected(METHODS[next].key)
    setIdentityPreview(null)
    setConsentChecked(false)
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus()
  }

  const completeVerification = async () => {
    if (busy || !consentChecked) return
    setBusy(true)
    setError("")
    setVerificationPhase("handoff")
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 500))
      setVerificationPhase("approval")
      await new Promise((resolve) => window.setTimeout(resolve, 900))
      setVerificationPhase("result")
      const identity = await verifyIdentity(chosen.key, chosen.method)
      await new Promise((resolve) => window.setTimeout(resolve, 450))
      setIdentityPreview(identity)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : (ko ? "본인 확인을 완료하지 못했어요." : "We couldn't complete verification."))
    } finally {
      setBusy(false)
      setVerificationPhase("idle")
    }
  }

  const issueVerifiedIdentity = async () => {
    if (busy || !identityPreview) return
    setBusy(true)
    setIssuedHere(true)
    setError("")
    try {
      await issueCapsule(identityPreview, chosen.key)
      if (renewMode) setStep("done")
      else router.replace("/?welcome=1")
    } catch (reason) {
      setIssuedHere(false)
      setError(reason instanceof Error ? reason.message : (ko ? "K-Tour ID를 발급하지 못했어요." : "We couldn't issue your K-Tour ID."))
    } finally {
      setBusy(false)
    }
  }

  const leaveVerification = () => {
    setError("")
    setIdentityPreview(null)
    setVerificationPhase("idle")
    setConsentChecked(false)
    if (renewMode) router.push("/pass")
    else setStep("persona")
  }

  const changeIdentityType = () => {
    setError("")
    setIdentityPreview(null)
    setVerificationPhase("idle")
    setConsentChecked(false)
    setStep("persona")
  }

  return (
    <PhoneFrame hideNav>
      {step === "cover" && (
        <main className="flex min-h-screen flex-col bg-background">
          <section className="relative min-h-[56vh] overflow-hidden bg-ink text-white">
            <img src="/seoul-after-rain-hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-[55%_48%]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,16,25,.46),rgba(10,16,25,.06)_48%,rgba(10,16,25,.82))]" />
            <div className="safe-top relative z-10 flex items-center justify-between px-6">
              <p className="font-display text-[20px] font-semibold">K-Tour ID</p>
              <div className="text-white"><LangToggle /></div>
            </div>
            <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-8">
              <p className="text-[13px] font-medium text-white/66">Seoul, made personal</p>
              <h1 className="font-display text-balance mt-2 whitespace-pre-line text-[34px] font-semibold leading-[1.17] tracking-[-0.035em]">
                {ko ? "낯선 곳에서도,\n당신답게 여행하세요." : "Feel at home,\nwherever you travel."}
              </h1>
            </div>
          </section>
          <section className="safe-bottom flex flex-1 flex-col px-6 pt-6">
            <p className="text-balance text-[15px] leading-6 text-muted-foreground">
              {ko ? "내 상황을 한 번 확인하고, 지금 이용할 수 있는 교통·문화·생활 혜택만 간결하게 만나보세요." : "Verify your situation once, then see only the transit, culture and everyday benefits available to you."}
            </p>
            <p className="mt-3 border-l-2 border-primary/35 pl-3 text-[13px] leading-5 text-muted-foreground">
              {ko ? "K-Tour ID는 정부 신분증·비자·체류 허가가 아닌 민간 여행 서비스 자격입니다." : "K-Tour ID is a private travel-service credential, not a government ID, visa or residence permit."}
            </p>
            <button type="button" onClick={() => setStep("persona")} className="pressable mt-auto flex min-h-14 items-center justify-between rounded-[14px] bg-primary px-5 text-[16px] font-semibold text-white">
              <span>{ko ? "나의 K-Tour ID 만들기" : "Create my K-Tour ID"}</span><ArrowRight className="h-5 w-5" />
            </button>
            <p className="mt-3 text-center text-[12px] leading-5 text-muted-foreground">1 / 3 · {ko ? "약 2분이면 준비돼요" : "Ready in about 2 minutes"}</p>
          </section>
        </main>
      )}

      {step === "persona" && (
        <main className="safe-bottom safe-top flex min-h-screen flex-col px-6">
          <header className="flex items-center justify-between">
            <button type="button" onClick={() => setStep("cover")} aria-label={ko ? "뒤로" : "Back"} className="pressable grid h-11 w-11 place-items-center rounded-full"><ArrowLeft className="h-5 w-5" /></button>
            <p className="text-[13px] font-medium text-muted-foreground">2 / 3</p>
            <LangToggle />
          </header>
          <div className="mt-7">
            <p className="text-[13px] font-semibold text-primary">{ko ? "나에게 맞는 시작" : "A start that fits"}</p>
            <h1 className="font-display text-balance mt-2 text-[31px] font-semibold leading-[1.24] tracking-[-0.03em]">{ko ? "한국에서 어떤 방식으로\n머물고 있나요?" : "How are you spending\nyour time in Korea?"}</h1>
            <p className="mt-3 text-[14px] leading-6 text-muted-foreground">{ko ? "선택에 따라 확인 방법과 첫 추천이 달라져요." : "Your verification method and first recommendations will adapt."}</p>
          </div>
          <div role="radiogroup" aria-label={ko ? "체류 및 여행 유형" : "Stay and travel type"} className="mt-8 divide-y divide-foreground/10 border-y border-foreground/10">
            {METHODS.map((item, index) => {
              const Icon = item.icon
              const config = PERSONA_CONFIG[item.key]
              const active = selected === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  tabIndex={active ? 0 : -1}
                  onKeyDown={(event) => movePersona(event, index)}
                  onClick={() => { setSelected(item.key); setIdentityPreview(null); setConsentChecked(false) }}
                  className={cn("pressable relative flex min-h-[94px] w-full items-center gap-4 px-2 text-left", active && "text-foreground")}
                >
                  <span className="tabular w-7 text-[12px] font-semibold text-muted-foreground">0{index + 1}</span>
                  <span className={cn("grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-secondary", active ? "text-primary ring-1 ring-primary/30" : "text-muted-foreground")}><Icon className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-[15px] font-semibold">{config.label[lang]}</strong>
                    <span className="mt-1 block text-[12px] text-muted-foreground">{config.shortLabel[lang]} · {config.verification[lang]}</span>
                    <span className="mt-1 block text-[12px] text-success">{config.value[lang]}</span>
                  </span>
                  {active && <Check className="h-4 w-4 text-success" />}
                </button>
              )
            })}
          </div>
          <button type="button" onClick={() => setStep("verify")} className="pressable mt-auto flex min-h-14 items-center justify-between rounded-[14px] bg-primary px-5 text-[16px] font-semibold text-white">
            {ko ? "이 방식으로 계속하기" : "Continue this way"}<ArrowRight className="h-5 w-5" />
          </button>
        </main>
      )}

      {step === "verify" && (
        <main aria-busy={busy} className="safe-bottom safe-top flex min-h-screen flex-col px-6">
          <header className="flex items-center justify-between">
            <button type="button" onClick={() => identityPreview ? setIdentityPreview(null) : leaveVerification()} disabled={busy} aria-label={ko ? "뒤로" : "Back"} className="pressable grid h-11 w-11 place-items-center rounded-full disabled:opacity-40"><ArrowLeft className="h-5 w-5" /></button>
            <p className="text-[13px] font-medium text-muted-foreground">{renewMode ? "1 / 2" : "3 / 3"}</p>
            <LangToggle />
          </header>
          <div className="mt-7">
            <p className="text-[13px] font-semibold text-primary">{identityPreview ? (ko ? "확인 결과 검토" : "Review verified details") : renewMode ? (ko ? "K-Tour ID 갱신" : "Renew K-Tour ID") : persona.shortLabel[lang]}</p>
            <h1 className="font-display text-balance mt-2 text-[31px] font-semibold leading-[1.24] tracking-[-0.03em]">{identityPreview ? (ko ? "이 정보로 K-Tour ID를\n만들까요?" : "Create your K-Tour ID\nwith these details?") : verificationJourney[lang]}</h1>
            <p className="mt-3 text-[14px] leading-6 text-muted-foreground">{identityPreview ? (ko ? "발급 전에 이름·국적·확인 방법을 마지막으로 확인하세요." : "Check the name, nationality and verification method before issuance.") : (ko ? "신분증 원문은 K-Tour ID에 저장하지 않고, 확인 제공자의 결과만 받아요." : "K-Tour ID stores no original ID document—only the provider's verification result.")}</p>
            <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
              {ko ? "정부 신분증·비자·체류 허가를 대신하지 않는 민간 여행 서비스 자격이에요." : "This private travel-service credential does not replace a government ID, visa or residence permit."}
            </p>
          </div>
          <div className={cn("flex flex-1 items-center justify-center", identityPreview ? "my-8" : "mb-5 mt-7")}>
            <div className="card-credential relative flex h-[244px] w-full flex-col justify-between overflow-hidden rounded-[28px] p-6 text-white">
              <div className="flex items-center justify-between"><span className="text-[13px] font-medium text-white/72">{identityPreview ? (ko ? "확인 정보" : "VERIFIED DETAILS") : (ko ? verificationJourney.eyebrowKo : verificationJourney.eyebrowEn)}</span><chosen.icon className="h-6 w-6 text-gold" /></div>
              {identityPreview ? <div className="flex items-end gap-4"><img src={identityPreview.photoUrl} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-gold/70" /><div className="min-w-0"><p className="font-display text-[24px] font-semibold">{identityPreview.displayName}</p><p className="mt-1 text-[13px] text-white/72">{identityPreview.nationalityFlag} {identityPreview.nationality === "Viet Nam" && ko ? "베트남" : localizedNationality(identityPreview.nationality, lang)}</p><p className="mt-1 text-[12px] text-white/70">{persona.verification[lang]}</p></div></div> : <div><div className="mb-5 h-px w-full bg-white/15" /><p className="font-display text-[26px] font-semibold">{verificationJourney[lang]}</p><p className="mt-2 text-[13px] text-white/70">{persona.value[lang]}</p></div>}
              {busy && <div className="absolute inset-x-6 top-1/2 h-px animate-[scan_1.5s_ease-in-out_infinite] bg-gold shadow-[0_0_12px_rgba(174,138,80,.75)]" />}
            </div>
          </div>
          {!identityPreview && !busy && (
            <section aria-labelledby="verification-consent-title" className="mb-4 rounded-[18px] border border-foreground/10 bg-secondary/45 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <h2 id="verification-consent-title" className="text-[13px] font-semibold">{ko ? "필수 확인·동의" : "Required review & consent"}</h2>
                  <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
                    {ko ? `K-Tour ID가 ${verificationJourney.providerKo}에 본인확인을 요청해 이용 가능한 여행·생활 혜택을 확인합니다.` : `K-Tour ID asks the ${verificationJourney.providerEn} to verify your identity and determine available travel and everyday benefits.`}
                  </p>
                  <p className="mt-2 text-[13px] font-medium leading-5 text-success">{ko ? "원문 신분증·스캔 이미지·얼굴 이미지는 저장하지 않아요." : "Original ID data, scans and face images are not stored."}</p>
                  <details className="mt-3 border-t border-foreground/10 pt-3">
                    <summary className="min-h-8 cursor-pointer text-[13px] font-semibold text-foreground">{ko ? "요청 정보 자세히 보기" : "View request details"}</summary>
                    <dl className="mt-2 space-y-2 text-[13px] leading-5 text-muted-foreground">
                      <div><dt className="inline font-semibold text-foreground">{ko ? "요청자" : "Requester"} · </dt><dd className="inline">K-Tour ID</dd></div>
                      <div><dt className="inline font-semibold text-foreground">{ko ? "본인확인 기관" : "Identity provider"} · </dt><dd className="inline">{ko ? verificationJourney.providerKo : verificationJourney.providerEn}</dd></div>
                      <div><dt className="inline font-semibold text-foreground">{ko ? "목적" : "Purpose"} · </dt><dd className="inline">{ko ? "K-Tour ID 발급·갱신 및 이용 가능한 여행·생활 혜택 확인" : "Issue or renew K-Tour ID and determine eligible travel and everyday benefits"}</dd></div>
                      <div><dt className="inline font-semibold text-foreground">{ko ? "확인 항목" : "Requested items"} · </dt><dd className="inline">{ko ? verificationJourney.claimsKo : verificationJourney.claimsEn}</dd></div>
                      <div><dt className="inline font-semibold text-foreground">{ko ? "보관 기간" : "Retention"} · </dt><dd className="inline">{ko ? "요청·임시 결과는 이번 발급 세션까지, 발급 결과는 로그아웃·계정 초기화 또는 ID 만료까지" : "Request and temporary result: this issuance session; issued result: until sign-out, account reset or ID expiry"}</dd></div>
                    </dl>
                  </details>
                </div>
              </div>
              <label className="mt-3 flex min-h-11 cursor-pointer items-start gap-3 border-t border-foreground/10 pt-3 text-[13px] font-semibold leading-5">
                <input type="checkbox" checked={consentChecked} onChange={(event) => setConsentChecked(event.target.checked)} className="mt-0.5 h-5 w-5 flex-shrink-0 accent-[var(--primary)]" />
                <span>{ko ? "[필수] 위 내용을 확인했고 확인 제공자 연결에 동의해요." : "[Required] I reviewed the details and agree to connect to the verification provider."}</span>
              </label>
              <button type="button" onClick={leaveVerification} className="pressable mt-1 min-h-10 w-full text-[13px] font-medium text-muted-foreground underline decoration-foreground/25 underline-offset-4">{ko ? "동의하지 않고 돌아가기" : "Decline and go back"}</button>
            </section>
          )}
          {busy && !identityPreview && (
            <section role="status" aria-live="polite" className="mb-4 rounded-[18px] border border-foreground/10 bg-secondary/45 p-4">
              <p className="text-[13px] font-semibold">{ko ? "본인확인을 진행하고 있어요" : "Identity verification in progress"}</p>
              <ol className="mt-3 space-y-3">
                {verificationSteps.map((item, index) => {
                  const complete = verificationPhaseIndex > index
                  const active = verificationPhaseIndex === index
                  return (
                    <li key={item.key} className={cn("flex items-center gap-3 text-[13px]", complete || active ? "text-foreground" : "text-muted-foreground/60")}>
                      <span className={cn("grid h-6 w-6 flex-shrink-0 place-items-center rounded-full border", complete ? "border-success bg-success text-white" : active ? "border-primary text-primary" : "border-foreground/15")}>
                        {complete ? <Check className="h-3.5 w-3.5" /> : active ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span className="text-[12px]">{index + 1}</span>}
                      </span>
                      <span className={cn(active && "font-semibold")}>{ko ? item.ko : item.en}</span>
                    </li>
                  )
                })}
              </ol>
            </section>
          )}
          {busy && identityPreview && <p role="status" aria-live="polite" className="mb-3 text-center text-[13px] text-muted-foreground">{ko ? "K-Tour ID를 발급하고 있어요." : "Issuing your K-Tour ID."}</p>}
          {error && <div role="alert" className="mb-3 border-l-2 border-destructive pl-3"><p className="text-[13px] leading-5 text-destructive">{error}</p><div className="mt-1 flex flex-wrap gap-x-4"><button type="button" onClick={identityPreview ? issueVerifiedIdentity : completeVerification} disabled={busy || (!identityPreview && !consentChecked)} className="min-h-9 text-[12px] font-semibold underline underline-offset-4 disabled:opacity-40">{ko ? "같은 방식으로 다시 시도" : "Retry the same method"}</button><button type="button" onClick={changeIdentityType} disabled={busy} className="min-h-9 text-[12px] font-semibold underline underline-offset-4 disabled:opacity-40">{ko ? "확인 유형 변경" : "Change verification type"}</button></div></div>}
          <button type="button" onClick={identityPreview ? issueVerifiedIdentity : completeVerification} disabled={busy || (!identityPreview && !consentChecked)} className="pressable flex min-h-14 items-center justify-center gap-3 rounded-[14px] bg-primary px-5 text-[16px] font-semibold text-white disabled:opacity-40">
            {busy ? <><Loader2 className="h-5 w-5 animate-spin" /> {identityPreview ? (ko ? "발급하고 있어요…" : "Issuing…") : (ko ? "본인확인 진행 중…" : "Verifying identity…")}</> : identityPreview ? <>{ko ? "확인하고 K-Tour ID 만들기" : "Confirm and create K-Tour ID"}<ArrowRight className="h-5 w-5" /></> : <>{ko ? verificationJourney.actionKo : verificationJourney.actionEn} <ArrowRight className="h-5 w-5" /></>}
          </button>
        </main>
      )}

      {step === "done" && renewMode && session.capsule && (
        <main className="safe-bottom safe-top flex min-h-screen flex-col px-6">
          <div className="flex items-center justify-between"><p className="text-[13px] font-medium text-success">2 / 2 · {ko ? "갱신 완료" : "Renewal complete"}</p><span className="grid h-11 w-11 place-items-center rounded-full border border-success/20 text-success" style={{ animation: "seal-stamp 360ms cubic-bezier(.2,.8,.2,1)" }}><Check className="h-5 w-5" /></span></div>
          <h1 ref={completionHeadingRef} tabIndex={-1} className="font-display text-balance mt-9 whitespace-pre-line text-[34px] font-semibold leading-[1.18] tracking-[-0.035em] outline-none">{persona.completionTitle[lang]}</h1>
          <p className="mt-3 text-[15px] leading-6 text-muted-foreground">{persona.completionBody[lang]}</p>
          <section className="mt-9 divide-y divide-foreground/10 border-y border-foreground/10">
            <div className="flex min-h-[76px] items-center gap-4"><span className="grid h-10 w-10 place-items-center rounded-full bg-success-surface text-success"><ShieldCheck className="h-5 w-5" /></span><div><p className="text-[14px] font-semibold">K-Tour ID {ko ? "사용 가능" : "active"}</p><p className="mt-1 text-[12px] text-muted-foreground">{persona.verification[lang]}</p></div></div>
            <div className="flex min-h-[76px] items-center gap-4"><span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-primary"><BadgeCheck className="h-5 w-5" /></span><div><p className="text-[14px] font-semibold">{persona.value[lang]}</p><p className="mt-1 text-[12px] text-muted-foreground">{ko ? "나에게 맞는 첫 선택을 준비했어요" : "Your first tailored choice is ready"}</p></div></div>
          </section>
          <div className="mt-auto pt-8">
            <button type="button" onClick={() => router.push(renewMode ? returnTo : "/")} className="pressable flex min-h-14 w-full items-center justify-between rounded-[14px] bg-primary px-5 text-[16px] font-semibold text-white">{renewMode && returnTo !== "/pass" ? (ko ? "이전 작업으로 돌아가기" : "Return to previous task") : renewMode ? (ko ? "갱신된 ID 보기" : "View renewed ID") : (ko ? "나를 위한 추천 보기" : "See my recommendations")}<ArrowRight className="h-5 w-5" /></button>
            {!renewMode && <Link href="/pass" className="pressable mt-2 flex min-h-11 items-center justify-center text-[13px] font-medium text-muted-foreground underline decoration-foreground/25 underline-offset-4">{ko ? "먼저 K-Tour ID 확인" : "View K-Tour ID first"}</Link>}
          </div>
        </main>
      )}
    </PhoneFrame>
  )
}
