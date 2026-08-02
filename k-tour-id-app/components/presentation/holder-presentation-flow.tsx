"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  Loader2,
  LockKeyhole,
  QrCode,
  RefreshCcw,
  ScanLine,
  ShieldCheck,
  TimerReset,
  Unplug,
  XCircle,
} from "lucide-react"
import { PhoneFrame, LangToggle } from "@/components/app/shell"
import { useLang } from "@/lib/i18n/lang-provider"
import { useApp } from "@/lib/store/app-provider"
import type { DemoJourney } from "@/lib/types"
import { cn } from "@/lib/utils"

type FlowStep = "scan" | "consent" | "result"
type DemoResult = "success" | "expired" | "revoked" | "offline" | "ineligible"
type PaymentRecovery = { href: string; label: string } | null

const CLAIMS = ["credentialActive", "visitorEligibility", "tripActive", "couponUnused"] as const
const PRESENTER_RESULTS: DemoResult[] = ["success", "expired", "revoked", "offline"]

export function HolderPresentationFlow() {
  const { lang } = useLang()
  const ko = lang === "ko"
  const {
    demoJourney,
    beginDemoPresentation,
    recordDemoPresentation,
    recordDemoPresentationFailure,
    prepareDemoPurchase,
    payWithBenefit,
  } = useApp()
  const [step, setStep] = useState<FlowStep>("scan")
  const [result, setResult] = useState<DemoResult>("success")
  const [checking, setChecking] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState("")
  const [recovery, setRecovery] = useState<PaymentRecovery>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const requestedResult = params.get("result") as DemoResult | null
    const requestedStep = params.get("step")
    const requestedItem = params.get("item")
    const requestedOption = params.get("option")
    if (requestedItem && requestedOption) prepareDemoPurchase(requestedItem, requestedOption)
    const autoScan = params.get("auto") === "1"
    if (requestedResult && PRESENTER_RESULTS.includes(requestedResult)) setResult(requestedResult)
    if (["scan", "consent", "result"].includes(requestedStep ?? "")) setStep(requestedStep as FlowStep)
    if (autoScan && !requestedStep) {
      setStep("scan")
      const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 620
      const id = window.setTimeout(() => setStep("consent"), delay)
      return () => window.clearTimeout(id)
    }
  }, [])

  const checkEligibility = () => {
    if (checking) return
    setChecking(true)
    setError("")
    beginDemoPresentation()
    const transitionDelay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 720
    window.setTimeout(() => {
      if (result === "success") {
        const accepted = recordDemoPresentation([...CLAIMS])
        if (!accepted) setResult("ineligible")
      } else if (result === "expired" || result === "revoked" || result === "offline") {
        recordDemoPresentationFailure(result)
      }
      setChecking(false)
      setStep("result")
    }, transitionDelay)
  }

  const completePayment = async () => {
    if (paying) return
    setPaying(true)
    setError("")
    setRecovery(null)
    try {
      const payment = await payWithBenefit({
        merchant: demoJourney.merchant,
        grossKRW: demoJourney.grossKRW,
        service: "reservation",
        voucherId: demoJourney.voucherId,
        presentationId: demoJourney.presentationId,
      })
      if (!payment.ok) {
        const code = payment.error?.code
        if (code === "INSUFFICIENT_BALANCE") {
          setError(ko ? "여행 잔액이 부족해요." : "Your travel balance is too low.")
          setRecovery({ href: "/wallet?topup=1&returnTo=%2Fpresent%3Fstep%3Dresult", label: ko ? "충전하고 돌아오기" : "Top up and return" })
        } else if (code === "CREDENTIAL_EXPIRED" || code === "CREDENTIAL_INACTIVE") {
          setError(ko ? "K-Tour ID를 갱신한 뒤 결제해 주세요." : "Renew K-Tour ID before paying.")
          setRecovery({ href: "/onboarding?mode=renew&returnTo=%2Fpresent%3Fstep%3Dresult", label: ko ? "K-Tour ID 갱신" : "Renew K-Tour ID" })
        } else if (code === "VOUCHER_UNAVAILABLE") {
          setError(ko ? "이 혜택은 이미 사용했거나 기간이 끝났어요." : "This benefit was already used or has expired.")
          setRecovery({ href: "/", label: ko ? "홈으로" : "Back home" })
        } else if (code === "PRESENTATION_REQUIRED" || code === "CLAIMS_INCOMPLETE") {
          setError(ko ? "할인 자격을 다시 확인해 주세요." : "Please check your discount eligibility again.")
          setRecovery({ href: "/present?auto=1", label: ko ? "다시 확인하기" : "Check again" })
        } else {
          setError(ko ? "결제를 완료하지 못했어요. 다시 시도해 주세요." : "We couldn't complete the payment. Please try again.")
        }
        setPaying(false)
        return
      }
      window.location.assign("/benefits")
    } catch {
      setError(ko ? "결제를 완료하지 못했어요. 다시 시도해 주세요." : "We couldn't complete the payment. Please try again.")
      setPaying(false)
    }
  }

  const goBack = () => {
    if (step === "result") setStep("consent")
    else if (step === "consent") window.history.back()
    else window.history.back()
  }

  return (
    <PhoneFrame hideNav>
      <div className="flex min-h-screen flex-col bg-background" aria-live={checking || step === "result" ? "polite" : undefined} aria-busy={checking || paying}>
        <header className="safe-top flex items-center justify-between px-4 pb-3">
          <button type="button" onClick={goBack} disabled={checking || paying} aria-label={ko ? "뒤로" : "Back"} className="pressable grid h-11 w-11 place-items-center rounded-full text-foreground disabled:opacity-30">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <p className="font-display text-[18px] font-semibold">K-Tour ID</p>
          <LangToggle />
        </header>

        {step === "scan" && <ScanStep ko={ko} onScan={() => setStep("consent")} />}
        {step === "consent" && <ConsentStep ko={ko} journey={demoJourney} checking={checking} onContinue={checkEligibility} />}
        {step === "result" && (
          result === "success"
            ? <PaymentStep ko={ko} journey={demoJourney} paying={paying} error={error} recovery={recovery} onPay={completePayment} />
            : <FailureResult ko={ko} result={result} onRetry={() => setStep("consent")} />
        )}
      </div>
    </PhoneFrame>
  )
}

function ScanStep({ ko, onScan }: { ko: boolean; onScan: () => void }) {
  return (
    <main className="safe-bottom flex flex-1 flex-col px-6 pt-3">
      <div>
        <p className="text-[13px] font-semibold text-primary">{ko ? "매장 QR" : "Merchant QR"}</p>
        <h1 className="font-display text-balance mt-2 text-[31px] font-semibold leading-[1.24] tracking-[-0.03em]">{ko ? "카메라를 QR에\n가까이 가져가세요." : "Point your camera\nat the QR."}</h1>
      </div>
      <div className="relative my-8 min-h-[390px] flex-1 overflow-hidden rounded-[28px] bg-ink text-white shadow-[0_18px_42px_-20px_rgba(24,36,58,.58)]">
        <img src="/seoul-after-rain-hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-ink/30" />
        <div className="absolute inset-[52px] border border-white/28">
          <span className="absolute -left-px -top-px h-9 w-9 border-l-2 border-t-2 border-gold" />
          <span className="absolute -right-px -top-px h-9 w-9 border-r-2 border-t-2 border-gold" />
          <span className="absolute -bottom-px -left-px h-9 w-9 border-b-2 border-l-2 border-gold" />
          <span className="absolute -bottom-px -right-px h-9 w-9 border-b-2 border-r-2 border-gold" />
          <div className="grid h-full place-items-center"><QrCode className="h-14 w-14 text-white/72" /></div>
          <div className="absolute inset-x-5 top-1/2 h-px animate-[scan_1.8s_ease-in-out_infinite] bg-gold shadow-[0_0_12px_rgba(174,138,80,.75)]" />
        </div>
        <p className="absolute inset-x-0 bottom-5 text-center text-[13px] text-white/70">{ko ? "QR을 찾고 있어요" : "Looking for a QR"}</p>
      </div>
      <button type="button" onClick={onScan} className="pressable flex min-h-14 items-center justify-center gap-3 rounded-[14px] bg-primary px-5 text-[16px] font-semibold text-white">
        <ScanLine className="h-5 w-5" /> {ko ? "매장 QR 인식" : "Detect merchant QR"}
      </button>
    </main>
  )
}

function ConsentStep({ ko, journey, checking, onContinue }: { ko: boolean; journey: DemoJourney; checking: boolean; onContinue: () => void }) {
  const merchantName = ko ? "북촌 공예관" : journey.merchantDisplay
  const productName = ko ? "자개 공예 체험" : journey.product
  return (
    <main className="safe-bottom flex flex-1 flex-col px-6 pt-2">
      <div className="card-credential relative h-[210px] overflow-hidden rounded-[24px] p-6 text-white">
        <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full border border-gold/25" />
        <div className="absolute -right-4 top-4 h-32 w-32 rounded-full border border-gold/15" />
        <p className="text-[12px] font-medium tracking-[0.16em] text-gold">BUKCHON · SEOUL</p>
        <p className="font-display mt-7 text-[46px] font-semibold leading-none text-white/92">北村</p>
        <div className="absolute inset-x-6 bottom-6 flex items-end justify-between border-t border-white/15 pt-3">
          <p className="text-[14px] font-medium text-white">{merchantName}</p>
          <p className="text-[12px] text-white/55">CRAFT HOUSE</p>
        </div>
      </div>

      <div className="pt-7">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-success"><BadgeCheck className="h-4 w-4" /> {ko ? "K-Tour ID 제휴 매장" : "K-Tour ID partner"}</p>
        <h1 className="font-display mt-3 text-[35px] font-semibold tracking-[-0.035em]">₩{journey.voucherKRW.toLocaleString()} <span className="text-[22px]">{ko ? "할인" : "off"}</span></h1>
        <p className="mt-2 text-[15px] text-foreground">{productName}</p>
        <p className="mt-1 text-[13px] text-muted-foreground">{ko ? journey.optionLabel : journey.optionLabelEn} · {ko ? journey.fulfilmentLabel : journey.fulfilmentLabelEn}</p>
      </div>

      <div className="mt-7 border-y border-foreground/10 py-5">
        <p className="flex items-start gap-3 text-[14px] leading-6"><ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" /> {ko ? "여행자 여부만 확인해요. 이름과 여권번호는 매장에 공유하지 않아요." : "Only traveler eligibility is checked. Your name and passport number stay private."}</p>
        <details className="mt-3 pl-8 text-[12px] leading-5 text-muted-foreground">
          <summary className="min-h-8 cursor-pointer font-medium underline decoration-foreground/20 underline-offset-4">{ko ? "무엇을 확인하나요?" : "What is checked?"}</summary>
          <p>{ko ? "K-Tour ID 상태, 여행자 자격, 여행 기간, 혜택의 이전 사용 여부를 한 번 확인합니다." : "We check K-Tour ID status, traveler eligibility, trip period, and previous benefit use once."}</p>
        </details>
      </div>

      <div className="mt-auto pt-7">
        <button type="button" onClick={onContinue} disabled={checking} className="pressable flex min-h-14 w-full items-center justify-center gap-3 rounded-[14px] bg-primary px-5 text-[16px] font-semibold text-white disabled:opacity-65">
          {checking ? <><Loader2 className="h-5 w-5 animate-spin" /> {ko ? "할인을 확인하고 있어요…" : "Checking your discount…"}</> : <><LockKeyhole className="h-5 w-5" /> {ko ? `동의하고 ₩${journey.voucherKRW.toLocaleString()} 할인받기` : `Agree and save ₩${journey.voucherKRW.toLocaleString()}`}</>}
        </button>
        <p className="mt-3 text-center text-[12px] leading-5 text-muted-foreground">{ko ? "버튼을 누르면 위 목적의 1회성 자격 확인에 동의합니다." : "By continuing, you consent to this one-time eligibility check."}</p>
      </div>
    </main>
  )
}

function PaymentStep({ ko, journey, paying, error, recovery, onPay }: { ko: boolean; journey: DemoJourney; paying: boolean; error: string; recovery: PaymentRecovery; onPay: () => void }) {
  const merchantName = ko ? "북촌 공예관" : journey.merchantDisplay
  const productName = ko ? "자개 공예 체험" : journey.product
  return (
    <main className="safe-bottom flex flex-1 flex-col px-6 pt-4">
      <p className="flex items-center gap-2 text-[13px] font-semibold text-success"><Check className="h-4 w-4" /> {ko ? "여행자 할인 적용" : "Traveler discount applied"}</p>
      <h1 className="font-display text-balance mt-3 text-[31px] font-semibold leading-[1.24] tracking-[-0.03em]">{ko ? "할인된 금액으로\n결제할까요?" : "Ready to pay\nthe discounted price?"}</h1>

      <div className="mt-8 border-y border-foreground/10 py-5">
          <p className="text-[15px] font-semibold">{productName}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">{merchantName}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">{ko ? journey.optionLabel : journey.optionLabelEn} · {ko ? journey.fulfilmentLabel : journey.fulfilmentLabelEn}</p>
        <div className="mt-6 space-y-3 text-[14px]">
          <PriceRow label={ko ? "상품 금액" : "Original price"} value={`₩${journey.grossKRW.toLocaleString()}`} />
          <PriceRow label={ko ? "여행자 할인" : "Traveler discount"} value={`− ₩${journey.voucherKRW.toLocaleString()}`} success />
        </div>
      </div>

      <div className="mt-7 flex items-end justify-between">
        <span className="text-[14px] text-muted-foreground">{ko ? "결제할 금액" : "Total due"}</span>
        <strong className="font-display tabular text-[40px] font-semibold tracking-[-0.04em]">₩{journey.paidKRW.toLocaleString()}</strong>
      </div>
      <p className="mt-2 text-right text-[13px] font-medium text-success">{ko ? `오늘 ₩${journey.voucherKRW.toLocaleString()} 절약` : `Save ₩${journey.voucherKRW.toLocaleString()} today`}</p>

      {error && <div role="alert" className="mt-5 border-l-2 border-destructive pl-3 text-[13px] text-destructive"><p>{error}</p>{recovery && <Link href={recovery.href} className="mt-2 inline-flex min-h-8 items-center font-semibold underline underline-offset-4">{recovery.label}<ArrowRight className="ml-1 h-4 w-4" /></Link>}</div>}
      <div className="mt-auto pt-8">
        <button type="button" onClick={onPay} disabled={paying} className="pressable flex min-h-14 w-full items-center justify-center gap-3 rounded-[14px] bg-primary px-5 text-[16px] font-semibold text-white disabled:opacity-65">
          {paying ? <><Loader2 className="h-5 w-5 animate-spin" /> {ko ? "결제하고 있어요…" : "Processing…"}</> : <>{ko ? `₩${journey.paidKRW.toLocaleString()} 결제` : `Pay ₩${journey.paidKRW.toLocaleString()}`} <ArrowRight className="h-5 w-5" /></>}
        </button>
        <p className="mt-3 text-center text-[12px] text-muted-foreground">{ko ? "혜택은 자동으로 적용됐어요." : "Your benefit has been applied automatically."}</p>
      </div>
    </main>
  )
}

function PriceRow({ label, value, success }: { label: string; value: string; success?: boolean }) {
  return <div className="flex items-center justify-between"><span className="text-muted-foreground">{label}</span><span className={cn("tabular font-semibold", success && "text-success")}>{value}</span></div>
}

function FailureResult({ ko, result, onRetry }: { ko: boolean; result: Exclude<DemoResult, "success">; onRetry: () => void }) {
  const meta = {
    expired: { icon: TimerReset, koTitle: "K-Tour ID 유효기간이 끝났어요", enTitle: "Your K-Tour ID has expired", koBody: "갱신하면 이 혜택 확인으로 돌아올 수 있어요.", enBody: "Renew, then return to this benefit check.", koCta: "K-Tour ID 갱신", enCta: "Renew K-Tour ID", href: "/onboarding?mode=renew&returnTo=%2Fpresent%3Fstep%3Dconsent" },
    revoked: { icon: XCircle, koTitle: "이 K-Tour ID는 사용할 수 없어요", enTitle: "This K-Tour ID can't be used", koBody: "상태를 확인하거나 새로 발급받아 주세요.", enBody: "Check its status or request a new K-Tour ID.", koCta: "상태 확인", enCta: "Check status", href: "/pass?panel=status&preview=revoked" },
    offline: { icon: Unplug, koTitle: "지금은 확인할 수 없어요", enTitle: "We can't check right now", koBody: "연결을 확인해 주세요. 정보는 전달되지 않았어요.", enBody: "Check your connection. No information was sent.", koCta: "다시 확인", enCta: "Try again", href: "" },
    ineligible: { icon: AlertTriangle, koTitle: "이 할인은 이용할 수 없어요", enTitle: "This discount isn't available", koBody: "현재 K-Tour ID는 이 혜택의 대상이 아니에요.", enBody: "Your current K-Tour ID isn't eligible for this benefit.", koCta: "확인하고 홈으로", enCta: "Back home", href: "/" },
  }[result]
  const Icon = meta.icon
  return (
    <main className="safe-bottom flex flex-1 flex-col px-6 pt-14 text-center">
      <Icon className="mx-auto h-10 w-10 text-primary" strokeWidth={1.6} />
      <h1 className="font-display text-balance mx-auto mt-7 max-w-[320px] text-[31px] font-semibold leading-[1.24] tracking-[-0.03em]">{ko ? meta.koTitle : meta.enTitle}</h1>
      <p className="mx-auto mt-3 max-w-[320px] text-[15px] leading-6 text-muted-foreground">{ko ? meta.koBody : meta.enBody}</p>
      <div className="mt-auto pt-8">
        {result === "offline" ? (
          <button type="button" onClick={onRetry} className="pressable flex min-h-14 w-full items-center justify-center gap-3 rounded-[14px] bg-primary px-5 text-[16px] font-semibold text-white"><RefreshCcw className="h-5 w-5" /> {ko ? meta.koCta : meta.enCta}</button>
        ) : (
          <Link href={meta.href} className="pressable flex min-h-14 w-full items-center justify-center gap-3 rounded-[14px] bg-primary px-5 text-[16px] font-semibold text-white">{ko ? meta.koCta : meta.enCta}<ArrowRight className="h-5 w-5" /></Link>
        )}
        <Link href="/" className="pressable mt-2 flex min-h-11 items-center justify-center text-[13px] font-medium text-muted-foreground">{ko ? "홈으로" : "Back home"}</Link>
      </div>
    </main>
  )
}
