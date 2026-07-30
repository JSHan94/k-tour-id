"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { BadgeCheck, Check, ChevronRight, HelpCircle, Loader2, ReceiptText, ShieldCheck, TicketCheck } from "lucide-react"
import { PhoneFrame, PageHeader, SectionTitle } from "@/components/app/shell"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import type { SettlementReceipt, Voucher } from "@/lib/types"
import { voucherMatchesPurchase } from "@/lib/demo-journey"
import { cn } from "@/lib/utils"

export default function BenefitsPage() {
  const { session, vouchers, demoJourney, payWithBenefit, loadDemoAccount } = useApp()
  const { lang } = useLang()
  const ko = lang === "ko"
  const [hasProof, setHasProof] = useState(false)
  const [presentationId, setPresentationId] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [phase, setPhase] = useState<"ready" | "processing" | "done" | "error">("ready")
  const [receipt, setReceipt] = useState<SettlementReceipt | null>(null)
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
    if (verified) setSelectedId(demoJourney.voucherId)
  }, [demoJourney.presentationId, demoJourney.stage, demoJourney.voucherId, loadDemoAccount, session.onboarded])

  const purchase = useMemo(() => ({
    merchant: demoJourney.merchant,
    grossKRW: demoJourney.grossKRW,
    service: "reservation" as const,
  }), [demoJourney.grossKRW, demoJourney.merchant])
  const available = useMemo(() => vouchers.filter((voucher) => voucherMatchesPurchase(voucher, purchase)), [purchase, vouchers])
  const selected = vouchers.find((voucher) => voucher.id === selectedId && available.some((item) => item.id === voucher.id)) ?? null
  const payable = Math.max(0, purchase.grossKRW - (selected?.valueKRW ?? 0))
  const journeyPaid = ["paid", "settlement-submitted", "anchored", "refunded"].includes(demoJourney.stage)

  const complete = async () => {
    if (!selected || !hasProof || phase === "processing") return
    setPhase("processing")
    setError("")
    try {
      const result = await payWithBenefit({ ...purchase, voucherId: selected.id, presentationId })
      if (!result.ok || !result.data) {
        setError(ko ? "결제를 완료하지 못했어요. 잠시 후 다시 시도해 주세요." : "We couldn't complete the payment. Please try again.")
        setPhase("error")
        return
      }
      setReceipt(result.data)
      setPhase("done")
    } catch {
      setError(ko ? "결제를 완료하지 못했어요. 잠시 후 다시 시도해 주세요." : "We couldn't complete the payment. Please try again.")
      setPhase("error")
    }
  }

  if (phase === "done" && receipt) return <BenefitReceipt receipt={receipt} ko={ko} />
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

  return (
    <PhoneFrame>
      <PageHeader title={ko ? "혜택" : "Benefits"} />
      <div className="space-y-6 px-5 pt-1">
        {hasProof ? (
          <div className="rounded-2xl bg-success-surface p-4 ring-1 ring-success/20">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-card text-success ring-1 ring-success/15"><BadgeCheck className="h-5 w-5" /></span>
              <div>
                <p className="text-[15px] font-bold">{ko ? "할인 자격이 확인됐어요" : "Your discount is ready"}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{ko ? "이름과 여권번호는 가맹점에 공유되지 않았어요." : "Your name and passport number were not shared with the merchant."}</p>
              </div>
            </div>
          </div>
        ) : (
          <Link href="/present" className="pressable flex min-h-20 items-center gap-3 rounded-2xl bg-ink p-4 text-white shadow-sm">
            <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-white/10 text-gold"><ShieldCheck className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold">{ko ? "여행자 할인을 확인하세요" : "Check your traveler discount"}</p>
              <p className="mt-1 text-[12px] text-white/65">{ko ? "가맹점 QR로 할인 자격을 확인해요" : "Use the merchant QR to check eligibility"}</p>
            </div>
            <ChevronRight className="h-5 w-5 flex-shrink-0 text-white/45" />
          </Link>
        )}

        <div>
          <SectionTitle>{ko ? "사용 가능한 혜택" : "Available benefit"}</SectionTitle>
          {available.length ? available.map((voucher) => (
            <VoucherRow key={voucher.id} voucher={voucher} selected={selectedId === voucher.id} enabled={hasProof} onSelect={() => setSelectedId(voucher.id)} ko={ko} />
          )) : (
            <div className="rounded-2xl bg-surface-2 p-5 text-center text-[13px] text-muted-foreground">{ko ? "지금 사용할 수 있는 혜택이 없어요." : "No benefits are available right now."}</div>
          )}
        </div>

        <div>
          <SectionTitle>{ko ? "주문 내역" : "Order details"}</SectionTitle>
          <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <div className="mb-3 flex items-center gap-3 border-b border-border pb-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-primary"><TicketCheck className="h-5 w-5" /></span>
              <div className="min-w-0"><p className="text-[14px] font-bold">{demoJourney.product}</p><p className="mt-0.5 text-[12px] text-muted-foreground">{demoJourney.merchantDisplay}</p></div>
            </div>
            <PriceRow label={ko ? "상품 금액" : "Original price"} value={`₩${purchase.grossKRW.toLocaleString()}`} />
            <PriceRow label={ko ? "여행자 할인" : "Traveler discount"} value={selected ? `−₩${selected.valueKRW.toLocaleString()}` : "—"} success />
            <PriceRow label={ko ? "결제할 금액" : "Total due"} value={`₩${payable.toLocaleString()}`} strong />
          </div>
        </div>

        {error && <div role="alert" className="rounded-xl bg-primary/8 p-3 text-[13px] leading-relaxed text-primary ring-1 ring-primary/15">{error}</div>}
        <button type="button" onClick={complete} disabled={!hasProof || !selected || phase === "processing"} className="bg-brand-gradient pressable flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-[15px] font-bold text-white disabled:opacity-40">
          {phase === "processing" ? <><Loader2 className="h-5 w-5 animate-spin" /> {ko ? "결제 중…" : "Processing…"}</> : (ko ? `₩${payable.toLocaleString()} 결제하기` : `Pay ₩${payable.toLocaleString()}`)}
        </button>
        <p className="text-center text-[12px] leading-relaxed text-muted-foreground">{ko ? "결제 전에 상품, 할인, 최종 금액을 확인해 주세요." : "Review the order, discount, and total before paying."}</p>
      </div>
    </PhoneFrame>
  )
}

function VoucherRow({ voucher, selected, enabled, onSelect, ko }: { voucher: Voucher; selected: boolean; enabled: boolean; onSelect: () => void; ko: boolean }) {
  return (
    <button type="button" onClick={onSelect} disabled={!enabled} aria-pressed={selected} className={cn("pressable flex min-h-[84px] w-full items-center gap-3 rounded-2xl border p-4 text-left disabled:cursor-default", selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card")}>
      <span className={cn("grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl", selected ? "bg-primary text-white" : "bg-secondary text-primary")}><TicketCheck className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1"><span className="block text-[14px] font-bold">{ko ? "북촌 공예 체험 할인" : "Bukchon craft workshop discount"}</span><span className="mt-1 block text-[12px] leading-relaxed text-muted-foreground">{ko ? "₩50,000 이상 결제 시 ₩5,000 할인 · 1회 사용" : "₩5,000 off orders over ₩50,000 · one use"}</span></span>
      <span className="text-[16px] font-extrabold text-primary">₩{voucher.valueKRW.toLocaleString()}</span>
    </button>
  )
}

function BenefitReceipt({ receipt, ko }: { receipt: SettlementReceipt; ko: boolean }) {
  const { demoJourney, session, refundDemoPurchase } = useApp()
  const [refundStep, setRefundStep] = useState<"idle" | "confirm" | "processing" | "error">("idle")
  const refunded = demoJourney.stage === "refunded"
  const refund = async () => {
    if (refundStep === "idle") { setRefundStep("confirm"); return }
    if (refundStep !== "confirm") return
    setRefundStep("processing")
    const ok = await refundDemoPurchase()
    if (!ok) setRefundStep("error")
  }
  return (
    <PhoneFrame>
      <PageHeader title={refunded ? (ko ? "환불 완료" : "Refund complete") : (ko ? "결제 완료" : "Payment complete")} back="/" />
      <div className="flex min-h-[calc(100vh-8rem)] flex-col px-5 pb-7 pt-3">
        <div className="text-center" aria-live="polite">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success-surface text-success"><Check className="h-8 w-8" /></span>
          <h1 className="mt-4 text-[24px] font-extrabold">{refunded ? (ko ? "환불이 완료됐어요" : "Refund complete") : (ko ? "결제가 완료됐어요" : "Payment complete")}</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{refunded ? (ko ? `₩${receipt.paidKRW.toLocaleString()}이 여행 잔액으로 돌아왔고 혜택도 복구됐어요.` : `₩${receipt.paidKRW.toLocaleString()} was returned to your travel balance and the benefit was restored.`) : (ko ? "여행자 할인이 적용됐습니다." : "Your traveler discount was applied.")}</p>
        </div>
        <div className="mt-6 rounded-2xl bg-card p-4 ring-1 ring-border">
          <div className="mb-3 flex items-start gap-3 border-b border-border pb-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-primary"><ReceiptText className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1"><p className="text-[14px] font-bold">{demoJourney.product}</p><p className="mt-1 text-[12px] text-muted-foreground">{demoJourney.merchantDisplay}</p></div>
          </div>
          <PriceRow label={ko ? "상품 금액" : "Original price"} value={`₩${receipt.grossKRW.toLocaleString()}`} />
          <PriceRow label={ko ? "여행자 할인" : "Traveler discount"} value={`−₩${receipt.voucherKRW.toLocaleString()}`} success />
          <PriceRow label={refunded ? (ko ? "환불 금액" : "Refunded") : (ko ? "결제 금액" : "Paid")} value={`${refunded ? "+" : ""}₩${receipt.paidKRW.toLocaleString()}`} strong />
          <div className="mt-3 border-t border-border pt-3 text-[12px] text-muted-foreground"><div className="flex justify-between gap-4"><span>{ko ? "결제 시각" : "Paid at"}</span><span className="font-semibold text-foreground">2026. 07. 30 · 14:32</span></div><div className="mt-2 flex justify-between gap-4"><span>{ko ? "영수증 번호" : "Receipt"}</span><span className="font-semibold text-foreground">{demoJourney.receiptId}</span></div></div>
        </div>
        <div className="mt-3 rounded-2xl bg-surface-2 p-4"><p className="text-[13px] font-bold">{ko ? "남은 여행 잔액" : "Travel balance"}</p><p className="mt-1 text-[20px] font-extrabold">₩{session.wallet.balanceKRW.toLocaleString()}</p></div>
        <div className="mt-auto space-y-3 pt-8">
          {!refunded && (
            <>
              {refundStep === "confirm" && <p role="alert" className="rounded-xl bg-[#fbf2d9] p-3 text-[13px] leading-relaxed text-[#735116]">{ko ? "아직 이용 전인 주문은 바로 취소할 수 있어요. 결제 금액은 여행 잔액으로 돌아오고 사용한 할인도 복구됩니다." : "This unused order can be cancelled immediately. The payment returns to your travel balance and the benefit is restored."}</p>}
              {refundStep === "error" && <p role="alert" className="rounded-xl bg-primary/8 p-3 text-[13px] text-primary">{ko ? "환불을 완료하지 못했어요. 다시 시도해 주세요." : "We couldn't complete the refund. Please try again."}</p>}
              <button type="button" onClick={refund} disabled={refundStep === "processing"} className={cn("pressable flex min-h-12 w-full items-center justify-center rounded-2xl px-4 text-[14px] font-bold", refundStep === "confirm" ? "bg-primary text-white" : "border border-border bg-card text-foreground")}>
                {refundStep === "processing" ? (ko ? "주문 취소 중…" : "Cancelling order…") : refundStep === "confirm" ? (ko ? `₩${receipt.paidKRW.toLocaleString()} 취소 확인` : `Confirm ₩${receipt.paidKRW.toLocaleString()} cancellation`) : (ko ? "주문 취소" : "Cancel order")}
              </button>
            </>
          )}
          <Link href="/" className="pressable flex min-h-12 items-center justify-center rounded-2xl bg-ink px-4 text-[15px] font-bold text-white">{ko ? "홈으로" : "Back home"}</Link>
          {!refunded && <Link href="/help?from=receipt" className="pressable flex min-h-11 items-center justify-center gap-2 text-[13px] font-semibold text-muted-foreground"><HelpCircle className="h-4 w-4" /> {ko ? "취소·환불 도움말" : "Cancellation & refund help"}</Link>}
        </div>
      </div>
    </PhoneFrame>
  )
}

function PriceRow({ label, value, success = false, strong = false }: { label: string; value: string; success?: boolean; strong?: boolean }) {
  return <div className={cn("flex items-center justify-between py-2 text-[13px]", strong && "mt-1 border-t border-border pt-3 text-[15px]")}><span className={strong ? "font-bold" : "text-muted-foreground"}>{label}</span><span className={cn("tabular-nums font-semibold", strong && "font-extrabold", success && "text-success")}>{value}</span></div>
}
