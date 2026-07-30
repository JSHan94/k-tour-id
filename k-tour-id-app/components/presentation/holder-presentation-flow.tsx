"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  Clock3,
  EyeOff,
  Loader2,
  LockKeyhole,
  QrCode,
  RefreshCcw,
  ScanLine,
  ShieldCheck,
  TicketCheck,
  TimerReset,
  Unplug,
  XCircle,
} from "lucide-react"
import { PhoneFrame, LangToggle } from "@/components/app/shell"
import { Seal } from "@/components/app/seal"
import { Progress } from "@/components/ui/progress"
import { useLang } from "@/lib/i18n/lang-provider"
import { useApp } from "@/lib/store/app-provider"
import type { DemoJourney } from "@/lib/types"
import { cn } from "@/lib/utils"

type FlowStep = "scan" | "consent" | "checking" | "result"
type DemoResult = "success" | "expired" | "revoked" | "offline" | "ineligible"

type Copy = Record<string, string>

const COPY: Record<"ko" | "en", Copy> = {
  ko: {
    title: "K-Tour ID 제시",
    scanEyebrow: "여행자 혜택",
    scanTitle: "매장의 QR을 스캔하세요",
    scanBody: "K-Tour ID로 할인 자격을 간편하게 확인할 수 있어요.",
    scanCta: "QR 스캔하기",
    scanReady: "카메라가 준비됐어요",
    scanHint: "QR을 화면 안에 맞춰주세요",
    back: "이전",
    requestTitle: "북촌 공예관에서\n여행자 할인을 요청했어요",
    merchantReady: "K-Tour ID 사용 가능 매장",
    purpose: "이용 혜택",
    purposeValue: "자개 공예 체험 · 여행자 10% 할인",
    conditions: "확인할 조건",
    checkLabel: "확인",
    claimCredential: "K-Tour ID 사용 가능 여부",
    claimEligible: "여행자 할인 대상 여부",
    claimTrip: "여행 기간 확인",
    claimVoucher: "혜택 사용 여부",
    notShared: "공유하지 않는 정보",
    notSharedBody: "이름과 여권번호는 매장에 전달되지 않아요.",
    consentPurpose: "위 내용을 확인했고, 할인 자격을 한 번 확인하는 데 동의해요.",
    consentHelper: "동의하면 계속할 수 있어요.",
    confirmCta: "동의하고 확인하기",
    decline: "취소",
    checkingTitle: "할인 자격을 확인하고 있어요",
    checkingBody: "잠시만 기다려 주세요.",
    checkingPrivacy: "필요한 자격만 확인하며 이름과 여권번호는 공유하지 않아요.",
    successEyebrow: "할인 적용 가능",
    successTitle: "여행자 10% 할인을\n받을 수 있어요",
    successBody: "북촌 공예관에서 바로 사용할 수 있어요.",
    benefit: "현장 체험 할인",
    original: "상품 금액",
    discount: "할인",
    total: "결제 금액",
    successPrivacy: "매장에는 할인 가능 여부만 전달됐어요.",
    payCta: "할인 금액으로 결제하기",
    doneCta: "K-Tour ID로 돌아가기",
    expiredTitle: "K-Tour ID 유효기간이 끝났어요",
    expiredBody: "갱신하면 혜택을 다시 확인할 수 있어요.",
    revokedTitle: "이 K-Tour ID는 사용할 수 없어요",
    revokedBody: "상태를 확인하거나 새로 발급받아 주세요.",
    offlineTitle: "지금은 할인 자격을 확인할 수 없어요",
    offlineBody: "연결을 확인한 뒤 다시 시도해 주세요. 정보는 전달되지 않았어요.",
    ineligibleTitle: "이 할인은 이용할 수 없어요",
    ineligibleBody: "현재 K-Tour ID는 이 매장의 여행자 할인 대상이 아니에요.",
    renewCta: "K-Tour ID 갱신하기",
    statusCta: "K-Tour ID 상태 확인",
    retryCta: "다시 확인하기",
    otherBenefitCta: "다른 혜택 보기",
  },
  en: {
    title: "Present K-Tour ID",
    scanEyebrow: "Traveler benefit",
    scanTitle: "Scan the merchant QR",
    scanBody: "Use K-Tour ID to check your discount eligibility in a few taps.",
    scanCta: "Scan QR",
    scanReady: "Camera ready",
    scanHint: "Keep the QR inside the frame",
    back: "Back",
    requestTitle: "Bukchon Craft House\nrequests a traveler discount check",
    merchantReady: "Accepts K-Tour ID",
    purpose: "Benefit",
    purposeValue: "Mother-of-pearl workshop · 10% traveler discount",
    conditions: "What will be checked",
    checkLabel: "Check",
    claimCredential: "K-Tour ID availability",
    claimEligible: "Traveler discount eligibility",
    claimTrip: "Active trip period",
    claimVoucher: "Previous benefit use",
    notShared: "Not shared",
    notSharedBody: "Your name and passport number are not sent to the merchant.",
    consentPurpose: "I reviewed this request and agree to a one-time eligibility check.",
    consentHelper: "Agree to continue.",
    confirmCta: "Agree and check",
    decline: "Cancel",
    checkingTitle: "Checking your discount eligibility",
    checkingBody: "This will only take a moment.",
    checkingPrivacy: "Only the required eligibility is checked. Your name and passport number are not shared.",
    successEyebrow: "Discount available",
    successTitle: "Your 10% traveler discount\nis ready",
    successBody: "Use it now at Bukchon Craft House.",
    benefit: "In-store workshop discount",
    original: "Item price",
    discount: "Discount",
    total: "You pay",
    successPrivacy: "The merchant received only your discount eligibility.",
    payCta: "Pay discounted amount",
    doneCta: "Back to K-Tour ID",
    expiredTitle: "Your K-Tour ID has expired",
    expiredBody: "Renew it to check your benefit again.",
    revokedTitle: "This K-Tour ID cannot be used",
    revokedBody: "Check its status or request a new K-Tour ID.",
    offlineTitle: "We cannot check your eligibility right now",
    offlineBody: "Check your connection and try again. No information was sent.",
    ineligibleTitle: "This discount is not available",
    ineligibleBody: "Your current K-Tour ID is not eligible for this merchant's traveler discount.",
    renewCta: "Renew K-Tour ID",
    statusCta: "Check K-Tour ID status",
    retryCta: "Try again",
    otherBenefitCta: "View other benefits",
  },
}

const CLAIMS = [
  { id: "credentialActive", label: "claimCredential", icon: ShieldCheck },
  { id: "visitorEligibility", label: "claimEligible", icon: BadgeCheck },
  { id: "tripActive", label: "claimTrip", icon: Clock3 },
  { id: "couponUnused", label: "claimVoucher", icon: TicketCheck },
] as const

const PRESENTER_RESULTS: DemoResult[] = ["success", "expired", "revoked", "offline"]

export function HolderPresentationFlow() {
  const { lang } = useLang()
  const { demoJourney, beginDemoPresentation, recordDemoPresentation, recordDemoPresentationFailure } = useApp()
  const c = COPY[lang]
  const [step, setStep] = useState<FlowStep>("scan")
  const [result, setResult] = useState<DemoResult>("success")
  const [consented, setConsented] = useState(false)
  const [progress, setProgress] = useState(12)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const requestedResult = params.get("result") as DemoResult | null
    const requestedStep = params.get("step")
    if (requestedResult && PRESENTER_RESULTS.includes(requestedResult)) setResult(requestedResult)
    if (["scan", "consent", "result"].includes(requestedStep ?? "")) setStep(requestedStep as FlowStep)
  }, [])

  useEffect(() => {
    if (step !== "checking") return
    setProgress(12)
    const first = window.setTimeout(() => setProgress(52), 350)
    const second = window.setTimeout(() => setProgress(86), 850)
    const third = window.setTimeout(() => setProgress(100), 1250)
    const finish = window.setTimeout(() => {
      if (result === "success") {
        const accepted = recordDemoPresentation(CLAIMS.map((claim) => claim.id))
        if (!accepted) setResult("ineligible")
      } else if (result === "expired" || result === "revoked" || result === "offline") {
        recordDemoPresentationFailure(result)
      }
      setStep("result")
    }, 1500)
    return () => [first, second, third, finish].forEach(window.clearTimeout)
  }, [recordDemoPresentation, recordDemoPresentationFailure, result, step])

  const goBack = () => {
    if (step === "consent") setStep("scan")
    else if (step === "result") setStep("consent")
    else window.history.back()
  }

  return (
    <PhoneFrame hideNav className="bg-card">
      <div className="flex min-h-[calc(100vh-2.5rem)] flex-col" aria-live={step === "checking" || step === "result" ? "polite" : undefined} aria-busy={step === "checking"}>
        <header className="flex items-center justify-between px-4 pb-3 pt-2">
          <button
            type="button"
            onClick={goBack}
            disabled={step === "checking"}
            aria-label={c.back}
            className="pressable grid h-11 w-11 place-items-center rounded-full text-foreground/70 hover:bg-secondary disabled:invisible"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <p className="text-[17px] font-bold tracking-tight text-foreground">{c.title}</p>
          <div className="grid h-11 w-11 place-items-center"><LangToggle /></div>
        </header>

        {step === "scan" && <ScanStep c={c} onScan={() => setStep("consent")} />}
        {step === "consent" && (
          <ConsentStep
            c={c}
            journey={demoJourney}
            consented={consented}
            onConsent={setConsented}
            onContinue={() => { beginDemoPresentation(); setStep("checking") }}
            onDecline={() => setStep("scan")}
          />
        )}
        {step === "checking" && <CheckingStep c={c} progress={progress} />}
        {step === "result" && <ResultStep c={c} result={result} journey={demoJourney} onRetry={() => setStep("consent")} />}
      </div>
    </PhoneFrame>
  )
}

function ScanStep({ c, onScan }: { c: Copy; onScan: () => void }) {
  return (
    <main className="flex flex-1 flex-col px-5 pb-7">
      <div className="pt-6 text-center">
        <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-primary">{c.scanEyebrow}</p>
        <h1 className="mt-2 text-[26px] font-extrabold tracking-tight text-foreground">{c.scanTitle}</h1>
        <p className="mx-auto mt-2 max-w-[315px] text-[14px] leading-relaxed text-muted-foreground">{c.scanBody}</p>
      </div>

      <div className="my-8 flex flex-1 items-center justify-center">
        <div className="card-ink relative h-[270px] w-full max-w-[330px] overflow-hidden rounded-[28px] p-5 text-white shadow-card-hero">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "16px 16px" }} />
          <div className="relative flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white/70"><ScanLine className="h-4 w-4" /> K-Tour ID</span>
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#8fb384]" />
          </div>
          <div className="absolute inset-x-10 bottom-10 top-[62px] rounded-[24px] border border-white/20">
            <span className="absolute -left-px -top-px h-8 w-8 rounded-tl-[24px] border-l-2 border-t-2 border-[var(--gold)]" />
            <span className="absolute -right-px -top-px h-8 w-8 rounded-tr-[24px] border-r-2 border-t-2 border-[var(--gold)]" />
            <span className="absolute -bottom-px -left-px h-8 w-8 rounded-bl-[24px] border-b-2 border-l-2 border-[var(--gold)]" />
            <span className="absolute -bottom-px -right-px h-8 w-8 rounded-br-[24px] border-b-2 border-r-2 border-[var(--gold)]" />
            <div className="absolute left-4 right-4 top-1/2 h-px animate-[scan_1.8s_ease-in-out_infinite] bg-[var(--gold)] shadow-[0_0_14px_2px_rgba(195,160,99,.65)]" />
            <div className="grid h-full place-items-center"><QrCode className="h-14 w-14 text-white/45" /></div>
          </div>
          <p className="absolute inset-x-5 bottom-3 text-center text-[12px] text-white/55">{c.scanHint}</p>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-center gap-2 text-[13px] font-medium text-muted-foreground">
        <span className="h-2 w-2 animate-pulse rounded-full bg-success" /> {c.scanReady}
      </div>
      <button type="button" onClick={onScan} className="bg-brand-gradient pressable flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-bold text-white">
        <ScanLine className="h-5 w-5" /> {c.scanCta}
      </button>
    </main>
  )
}

function ConsentStep({ c, journey, consented, onConsent, onContinue, onDecline }: { c: Copy; journey: DemoJourney; consented: boolean; onConsent: (value: boolean) => void; onContinue: () => void; onDecline: () => void }) {
  return (
    <main className="flex flex-1 flex-col px-5 pb-7 pt-3">
      <h1 className="whitespace-pre-line text-[25px] font-extrabold leading-tight tracking-tight text-foreground">{c.requestTitle}</h1>

      <div className="mt-5 rounded-3xl bg-surface-2 p-4 ring-1 ring-border">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl bg-card text-navy ring-1 ring-border"><Building2 className="h-6 w-6" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-bold text-foreground">{journey.merchantDisplay}</p>
            <p className="mt-1 flex items-center gap-1 text-[12px] font-semibold text-success"><BadgeCheck className="h-4 w-4" /> {c.merchantReady}</p>
          </div>
          <Seal size={34} />
        </div>
        <div className="mt-4 border-t border-border pt-3">
          <p className="text-[12px] font-bold text-muted-foreground">{c.purpose}</p>
          <p className="mt-1 text-[14px] font-semibold leading-relaxed text-foreground">{c.purposeValue}</p>
        </div>
      </div>

      <section className="mt-5">
        <h2 className="text-[12px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{c.conditions}</h2>
        <div className="mt-2 divide-y divide-border rounded-2xl bg-card px-4 ring-1 ring-border">
          {CLAIMS.map(({ id, label, icon: Icon }) => (
            <div key={id} className="flex min-h-14 items-center gap-3 py-3">
              <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-success-surface text-success"><Icon className="h-[18px] w-[18px]" /></span>
              <span className="flex-1 text-[14px] font-semibold text-foreground">{c[label]}</span>
              <span className="text-[12px] font-semibold text-muted-foreground">{c.checkLabel}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-4 flex items-start gap-3 rounded-2xl bg-success-surface p-4 ring-1 ring-success/20">
        <EyeOff className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
        <div><p className="text-[13px] font-bold text-foreground">{c.notShared}</p><p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{c.notSharedBody}</p></div>
      </div>

      <label className="mt-4 flex min-h-14 cursor-pointer items-start gap-2 rounded-2xl bg-surface-2 p-3 ring-1 ring-border focus-within:ring-2 focus-within:ring-primary">
        <input type="checkbox" checked={consented} onChange={(event) => onConsent(event.target.checked)} className="sr-only" />
        <span aria-hidden="true" className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl">
          <span className={cn("grid h-7 w-7 place-items-center rounded-lg border", consented ? "border-primary bg-primary text-white" : "border-border bg-card")}>
            {consented && <Check className="h-4 w-4" />}
          </span>
        </span>
        <span className="py-2 text-[14px] leading-relaxed text-foreground">{c.consentPurpose}</span>
      </label>

      <div className="mt-auto pt-6">
        {!consented && <p className="mb-2 text-center text-[12px] font-medium text-primary">{c.consentHelper}</p>}
        <button type="button" disabled={!consented} onClick={onContinue} className="bg-brand-gradient pressable flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-bold text-white transition-opacity disabled:opacity-35">
          <LockKeyhole className="h-5 w-5" /> {c.confirmCta}
        </button>
        <button type="button" onClick={onDecline} className="pressable mt-2 min-h-11 w-full text-[14px] font-semibold text-muted-foreground">{c.decline}</button>
      </div>
    </main>
  )
}

function CheckingStep({ c, progress }: { c: Copy; progress: number }) {
  return (
    <main className="flex flex-1 flex-col items-center px-6 pb-8 pt-16 text-center">
      <div className="card-credential relative grid h-36 w-36 place-items-center overflow-hidden rounded-[38px] text-white shadow-card-hero">
        <div className="absolute inset-0 animate-pulse bg-white/[0.03]" />
        <Seal size={66} stamp />
        <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-card text-primary"><Loader2 className="h-5 w-5 animate-spin" /></span>
      </div>
      <h1 className="mt-8 text-[25px] font-extrabold tracking-tight text-foreground">{c.checkingTitle}</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{c.checkingBody}</p>
      <div className="mt-8 w-full rounded-2xl bg-surface-2 p-5 ring-1 ring-border">
        <Progress value={progress} className="h-2 bg-border [&_[data-slot=progress-indicator]]:bg-success" />
        <div className="mt-4 flex items-start gap-3 text-left">
          <EyeOff className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
          <p className="text-[13px] leading-relaxed text-muted-foreground">{c.checkingPrivacy}</p>
        </div>
      </div>
    </main>
  )
}

function ResultStep({ c, result, journey, onRetry }: { c: Copy; result: DemoResult; journey: DemoJourney; onRetry: () => void }) {
  if (result !== "success") return <FailureResult c={c} result={result} onRetry={onRetry} />
  return (
    <main className="flex flex-1 flex-col px-5 pb-7 pt-5">
      <div className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success-surface text-success ring-1 ring-[#cddac9]"><CheckCircle2 className="h-8 w-8" strokeWidth={2.2} /></span>
        <p className="mt-4 text-[12px] font-bold uppercase tracking-[0.12em] text-success">{c.successEyebrow}</p>
        <h1 className="mt-2 whitespace-pre-line text-[26px] font-extrabold leading-tight tracking-tight text-foreground">{c.successTitle}</h1>
        <p className="mt-2 text-[14px] text-muted-foreground">{c.successBody}</p>
      </div>

      <div className="card-ink mt-7 rounded-3xl p-5 text-white">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div><p className="text-[12px] text-white/55">{c.benefit}</p><p className="mt-1 text-[15px] font-bold">{journey.product}</p></div>
          <span className="rounded-full bg-[var(--gold)]/15 px-3 py-1.5 text-[12px] font-extrabold text-gold ring-1 ring-[var(--gold)]/25">−10%</span>
        </div>
        <div className="mt-4 space-y-2 text-[13px]">
          <MoneyRow label={c.original} value={`₩${journey.grossKRW.toLocaleString()}`} />
          <MoneyRow label={c.discount} value={`−₩${journey.voucherKRW.toLocaleString()}`} positive />
          <MoneyRow label={c.total} value={`₩${journey.paidKRW.toLocaleString()}`} total />
        </div>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-2xl bg-success-surface p-4 ring-1 ring-success/20">
        <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
        <p className="text-[13px] leading-relaxed text-muted-foreground">{c.successPrivacy}</p>
      </div>

      <div className="mt-auto pt-7">
        <Link href={`/benefits?verified=1&presentation=${encodeURIComponent(journey.presentationId)}`} className="bg-brand-gradient pressable flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-bold text-white">
          {c.payCta} <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/pass" className="pressable mt-2 flex min-h-11 w-full items-center justify-center text-[14px] font-semibold text-muted-foreground">{c.doneCta}</Link>
      </div>
    </main>
  )
}

function MoneyRow({ label, value, positive, total }: { label: string; value: string; positive?: boolean; total?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between", total && "mt-3 border-t border-white/10 pt-3 text-[15px] font-bold")}>
      <span className={total ? "text-white" : "text-white/55"}>{label}</span>
      <span className={cn("tabular font-semibold", positive ? "text-[#9dc294]" : "text-white")}>{value}</span>
    </div>
  )
}

function FailureResult({ c, result, onRetry }: { c: Copy; result: Exclude<DemoResult, "success">; onRetry: () => void }) {
  const meta = {
    expired: { icon: TimerReset, title: c.expiredTitle, body: c.expiredBody, cta: c.renewCta, href: "/onboarding?mode=renew" },
    revoked: { icon: XCircle, title: c.revokedTitle, body: c.revokedBody, cta: c.statusCta, href: "/pass?panel=status&preview=revoked" },
    offline: { icon: Unplug, title: c.offlineTitle, body: c.offlineBody, cta: c.retryCta, href: "" },
    ineligible: { icon: AlertTriangle, title: c.ineligibleTitle, body: c.ineligibleBody, cta: c.otherBenefitCta, href: "/benefits" },
  }[result]
  const Icon = meta.icon
  return (
    <main className="flex flex-1 flex-col px-5 pb-7 pt-14 text-center">
      <span className="mx-auto grid h-20 w-20 place-items-center rounded-[28px] bg-primary/8 text-primary ring-1 ring-primary/15"><Icon className="h-9 w-9" /></span>
      <h1 className="mx-auto mt-6 max-w-[320px] text-[26px] font-extrabold leading-tight tracking-tight text-foreground">{meta.title}</h1>
      <p className="mx-auto mt-3 max-w-[320px] text-[14px] leading-relaxed text-muted-foreground">{meta.body}</p>

      <div className="mt-auto pt-8">
        {result === "offline" ? (
          <button type="button" onClick={onRetry} className="bg-brand-gradient pressable flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-bold text-white"><RefreshCcw className="h-5 w-5" /> {meta.cta}</button>
        ) : (
          <Link href={meta.href} className="bg-brand-gradient pressable flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-bold text-white">{meta.cta} <ArrowRight className="h-4 w-4" /></Link>
        )}
        <Link href="/pass" className="pressable mt-2 flex min-h-11 w-full items-center justify-center text-[14px] font-semibold text-muted-foreground">{c.doneCta}</Link>
      </div>
    </main>
  )
}
