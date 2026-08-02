"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, BadgeCheck, Check, ChevronDown, Loader2, ShieldCheck } from "lucide-react"
import { PhoneFrame, LangToggle } from "@/components/app/shell"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import type { SettlementReceipt } from "@/lib/types"

export default function BenefitsPage() {
  const { session, demoJourney, payWithBenefit, loadDemoAccount } = useApp()
  const { lang } = useLang()
  const ko = lang === "ko"
  const [hasProof, setHasProof] = useState(false)
  const [presentationId, setPresentationId] = useState("")
  const [phase, setPhase] = useState<"ready" | "processing" | "error">("ready")
  const [error, setError] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const requestedPresentation = params.get("presentation")
    const verified = params.get("verified") === "1"
      && requestedPresentation === demoJourney.presentationId
      && demoJourney.stage === "benefit-ready"
    setHasProof(verified)
    setPresentationId(requestedPresentation ?? "")
    if (params.get("verified") === "1" && !session.onboarded) loadDemoAccount()
  }, [demoJourney.presentationId, demoJourney.stage, loadDemoAccount, session.onboarded])

  const journeyPaid = ["paid", "settlement-submitted", "anchored", "refunded"].includes(demoJourney.stage)
  if (journeyPaid) {
    return <BenefitReceipt receipt={{
      id: demoJourney.settlementId,
      merchant: demoJourney.merchant,
      grossKRW: demoJourney.grossKRW,
      voucherKRW: demoJourney.voucherKRW,
      paidKRW: demoJourney.paidKRW,
      status: demoJourney.stage === "anchored" ? "anchored" : "pending",
      presentationId: demoJourney.presentationId,
      eventIds: [],
      integrationMode: "simulated",
    }} ko={ko} />
  }

  const complete = async () => {
    if (!hasProof || phase === "processing") return
    setPhase("processing")
    setError("")
    try {
      const result = await payWithBenefit({
        merchant: demoJourney.merchant,
        grossKRW: demoJourney.grossKRW,
        service: "reservation",
        voucherId: demoJourney.voucherId,
        presentationId,
      })
      if (!result.ok) {
        setError(ko ? "결제를 완료하지 못했어요. 다시 시도해 주세요." : "We couldn't complete the payment. Please try again.")
        setPhase("error")
      }
    } catch {
      setError(ko ? "결제를 완료하지 못했어요. 다시 시도해 주세요." : "We couldn't complete the payment. Please try again.")
      setPhase("error")
    }
  }

  if (!hasProof) return <BenefitDiscovery ko={ko} />

  const merchantName = ko ? "북촌 공예관" : demoJourney.merchantDisplay
  const productName = ko ? "자개 공예 체험" : demoJourney.product

  return (
    <PhoneFrame hideNav>
      <TaskHeader ko={ko} />
      <main className="safe-bottom flex min-h-[calc(100vh-72px)] flex-col px-6 pt-4">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-success"><Check className="h-4 w-4" /> {ko ? "여행자 할인 적용" : "Traveler discount applied"}</p>
        <h1 className="font-display text-balance mt-3 text-[31px] font-semibold leading-[1.24] tracking-[-0.03em]">{ko ? "할인된 금액으로\n결제할까요?" : "Ready to pay\nthe discounted price?"}</h1>
        <div className="mt-8 border-y border-foreground/10 py-5">
          <p className="text-[15px] font-semibold">{productName}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">{merchantName}</p>
          <div className="mt-6 space-y-3 text-[14px]">
            <Row label={ko ? "상품 금액" : "Original price"} value={`₩${demoJourney.grossKRW.toLocaleString()}`} />
            <Row label={ko ? "여행자 할인" : "Traveler discount"} value={`− ₩${demoJourney.voucherKRW.toLocaleString()}`} success />
          </div>
        </div>
        <div className="mt-7 flex items-end justify-between">
          <span className="text-[14px] text-muted-foreground">{ko ? "결제할 금액" : "Total due"}</span>
          <strong className="font-display tabular text-[40px] font-semibold tracking-[-0.04em]">₩{demoJourney.paidKRW.toLocaleString()}</strong>
        </div>
        {error && <p role="alert" className="mt-5 border-l-2 border-destructive pl-3 text-[13px] text-destructive">{error}</p>}
        <button type="button" onClick={complete} disabled={phase === "processing"} className="pressable mt-auto flex min-h-14 w-full items-center justify-center gap-3 rounded-[14px] bg-primary px-5 text-[16px] font-semibold text-white disabled:opacity-65">
          {phase === "processing" ? <><Loader2 className="h-5 w-5 animate-spin" /> {ko ? "결제하고 있어요…" : "Processing…"}</> : <>{ko ? `₩${demoJourney.paidKRW.toLocaleString()} 결제` : `Pay ₩${demoJourney.paidKRW.toLocaleString()}`} <ArrowRight className="h-5 w-5" /></>}
        </button>
      </main>
    </PhoneFrame>
  )
}

function BenefitDiscovery({ ko }: { ko: boolean }) {
  return (
    <PhoneFrame hideNav>
      <TaskHeader ko={ko} />
      <main className="safe-bottom flex min-h-[calc(100vh-72px)] flex-col px-6 pt-3">
        <div className="relative h-[310px] overflow-hidden rounded-[28px] bg-ink text-white">
          <img src="/seoul-after-rain-hero.jpg" alt="" className="h-full w-full object-cover object-[58%_62%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className="text-[13px] text-white/65">Bukchon · Seoul</p>
            <h1 className="font-display mt-1 text-[28px] font-semibold">{ko ? "자개 공예 체험" : "Mother-of-pearl workshop"}</h1>
          </div>
        </div>
        <div className="py-7">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-success"><BadgeCheck className="h-4 w-4" /> K-Tour ID {ko ? "여행자 혜택" : "traveler benefit"}</p>
          <p className="font-display mt-3 text-[36px] font-semibold">₩5,000 {ko ? "할인" : "off"}</p>
          <p className="mt-3 text-[14px] leading-6 text-muted-foreground">{ko ? "매장에서 QR을 스캔하면 개인정보를 보여주지 않고 할인 자격을 확인할 수 있어요." : "Scan the merchant QR to verify eligibility without showing personal information."}</p>
        </div>
        <Link href="/present?step=consent" className="pressable mt-auto flex min-h-14 items-center justify-between rounded-[14px] bg-primary px-5 text-[16px] font-semibold text-white">
          {ko ? "할인 확인하기" : "Check my discount"}<ArrowRight className="h-5 w-5" />
        </Link>
      </main>
    </PhoneFrame>
  )
}

function BenefitReceipt({ receipt, ko }: { receipt: SettlementReceipt; ko: boolean }) {
  const { demoJourney, session, refundDemoPurchase } = useApp()
  const [refundStep, setRefundStep] = useState<"idle" | "confirm" | "processing" | "error">("idle")
  const refunded = demoJourney.stage === "refunded"
  const merchantName = ko ? "북촌 공예관" : demoJourney.merchantDisplay
  const productName = ko ? "자개 공예 체험" : demoJourney.product

  const refund = async () => {
    if (refundStep === "idle") { setRefundStep("confirm"); return }
    if (refundStep !== "confirm") return
    setRefundStep("processing")
    const ok = await refundDemoPurchase()
    if (!ok) setRefundStep("error")
  }

  return (
    <PhoneFrame hideNav>
      <main className="paper-grain safe-bottom safe-top flex min-h-screen flex-col px-6">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-muted-foreground">{refunded ? (ko ? "환불 완료" : "Refund complete") : (ko ? "결제 완료" : "Payment complete")}</span>
          <span className="grid h-12 w-12 place-items-center rounded-full border border-primary/30 text-primary" style={{ animation: "seal-stamp 360ms cubic-bezier(.2,.8,.2,1)" }}><Check className="h-6 w-6" /></span>
        </div>

        <div className="mt-10 text-center" aria-live="polite">
          <p className="font-display tabular text-[48px] font-semibold tracking-[-0.05em]">{refunded ? "+" : ""}₩{receipt.paidKRW.toLocaleString()}</p>
          <h1 className="font-display text-balance mx-auto mt-3 max-w-[330px] text-[27px] font-semibold leading-[1.3] tracking-[-0.025em]">
            {refunded
              ? (ko ? "여행 잔액으로 돌아왔어요." : "Returned to your travel balance.")
              : (ko ? `여행자 할인으로 ₩${receipt.voucherKRW.toLocaleString()} 아꼈어요.` : `You saved ₩${receipt.voucherKRW.toLocaleString()} with your traveler benefit.`)}
          </h1>
        </div>

        <section className="mt-10 border-y border-foreground/10 py-5">
          <p className="text-[15px] font-semibold">{productName}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">{merchantName}</p>
          <div className="mt-6 space-y-3 text-[13px]">
            <Row label={ko ? "상품 금액" : "Original price"} value={`₩${receipt.grossKRW.toLocaleString()}`} />
            <Row label={ko ? "여행자 할인" : "Traveler discount"} value={`− ₩${receipt.voucherKRW.toLocaleString()}`} success />
            <Row label={refunded ? (ko ? "환불 금액" : "Refunded") : (ko ? "결제 금액" : "Paid")} value={`${refunded ? "+" : ""}₩${receipt.paidKRW.toLocaleString()}`} strong />
          </div>
        </section>

        <p className="mt-5 text-center text-[13px] text-muted-foreground">{ko ? "남은 여행 잔액" : "Travel balance"} · <strong className="font-semibold text-foreground">₩{session.wallet.balanceKRW.toLocaleString()}</strong></p>

        <div className="mt-auto pt-8">
          <Link href="/" className="pressable flex min-h-14 items-center justify-center rounded-[14px] bg-primary px-5 text-[16px] font-semibold text-white">{ko ? "완료" : "Done"}</Link>
          <details className="mt-3 border-b border-foreground/10 text-[13px] text-muted-foreground">
            <summary className="pressable flex min-h-12 cursor-pointer list-none items-center justify-center gap-2 font-medium">{ko ? "영수증·주문 관리" : "Receipt & order management"}<ChevronDown className="h-4 w-4" /></summary>
            <div className="space-y-3 pb-5 pt-2">
              <Row label={ko ? "결제 시각" : "Paid at"} value="2026. 07. 30 · 14:32" />
              <Row label={ko ? "영수증 번호" : "Receipt"} value={demoJourney.receiptId} />
              {!refunded && (
                <>
                  {refundStep === "confirm" && <p role="alert" className="border-l-2 border-gold pl-3 text-[12px] leading-5">{ko ? "이용 전 주문을 취소하면 결제 금액과 할인 혜택이 모두 복구돼요." : "Cancel before use to restore the payment and benefit."}</p>}
                  {refundStep === "error" && <p role="alert" className="text-destructive">{ko ? "취소하지 못했어요. 다시 시도해 주세요." : "Cancellation failed. Please try again."}</p>}
                  <button type="button" onClick={refund} disabled={refundStep === "processing"} className="pressable min-h-11 w-full text-center font-medium text-destructive disabled:opacity-50">
                    {refundStep === "processing" ? (ko ? "취소하고 있어요…" : "Cancelling…") : refundStep === "confirm" ? (ko ? "주문 취소 확인" : "Confirm cancellation") : (ko ? "주문 취소" : "Cancel order")}
                  </button>
                </>
              )}
            </div>
          </details>
        </div>
      </main>
    </PhoneFrame>
  )
}

function TaskHeader({ ko }: { ko: boolean }) {
  return (
    <header className="safe-top flex items-center justify-between px-4 pb-3">
      <Link href="/" aria-label={ko ? "홈으로" : "Back home"} className="pressable grid h-11 w-11 place-items-center rounded-full"><ArrowLeft className="h-5 w-5" /></Link>
      <p className="font-display text-[18px] font-semibold">{ko ? "여행자 혜택" : "Traveler benefit"}</p>
      <LangToggle />
    </header>
  )
}

function Row({ label, value, success, strong }: { label: string; value: string; success?: boolean; strong?: boolean }) {
  return <div className="flex items-center justify-between gap-4"><span className={strong ? "font-semibold text-foreground" : "text-muted-foreground"}>{label}</span><span className={`${strong ? "font-semibold text-foreground" : "font-medium"} ${success ? "text-success" : ""} tabular text-right`}>{value}</span></div>
}
