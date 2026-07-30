"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { BadgeCheck, Check, ChevronRight, Gift, HelpCircle, Loader2, ReceiptText, ShieldCheck, TicketCheck, WalletCards } from "lucide-react"
import { PhoneFrame, PageHeader, SectionTitle } from "@/components/app/shell"
import { IntegrationModeBadge } from "@/components/app/integration-status"
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
  const [presentationId, setPresentationId] = useState("vp:demo-holder-proof")
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
    if (requestedPresentation) setPresentationId(requestedPresentation)
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

  const complete = async () => {
    if (!selected || !hasProof || phase === "processing") return
    setPhase("processing")
    setError("")
    const result = await payWithBenefit({
      ...purchase,
      voucherId: selected.id,
      presentationId,
    })
    if (!result.ok || !result.data) {
      setError(result.error?.message ?? (ko ? "혜택 사용에 실패했어요." : "Could not use this benefit."))
      setPhase("error")
      return
    }
    setReceipt(result.data)
    setPhase("done")
  }

  if (phase === "done" && receipt) {
    return <BenefitReceipt receipt={receipt} ko={ko} />
  }

  return (
    <PhoneFrame>
      <PageHeader title={ko ? "혜택" : "Benefits"} />
      <div className="space-y-6 px-5 pt-1">
        {hasProof ? (
          <div className="rounded-2xl bg-success-surface p-4 ring-1 ring-success/20">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-card text-success ring-1 ring-success/15">
                <BadgeCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[14px] font-bold text-foreground">{ko ? "관광객 혜택 자격 확인됨" : "Visitor benefit verified"}</p>
                  <IntegrationModeBadge compact />
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                  {ko ? "K-Tour ID 활성·여행자 자격·여행 유효·미사용을 하나의 요청으로 확인했습니다. 이름과 여권번호는 전달되지 않았습니다." : "One request proved active K-Tour ID, visitor eligibility, active trip and unused benefit. No name or passport number was shared."}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <Link href="/present" className="pressable flex items-center gap-3 rounded-2xl bg-ink p-4 text-white shadow-sm">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-gold"><ShieldCheck className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold">{ko ? "먼저 K-Tour ID를 제시하세요" : "Present your K-Tour ID first"}</p>
              <p className="mt-0.5 text-[11px] text-white/60">{ko ? "필요한 정보만 골라 증명합니다" : "Prove only what the merchant needs"}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-white/45" />
          </Link>
        )}

        <div>
          <SectionTitle>{ko ? "사용할 혜택" : "Choose a benefit"}</SectionTitle>
          <div className="space-y-3">
            {available.map((voucher) => (
              <VoucherRow
                key={voucher.id}
                voucher={voucher}
                selected={voucher.id === selected?.id}
                onSelect={() => voucher.status === "available" && setSelectedId(voucher.id)}
                ko={ko}
              />
            ))}
            {available.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-4 text-center text-[12px] text-muted-foreground">
                {ko ? "이 가맹점·서비스·최소 결제액에 맞는 사용 가능 혜택이 없습니다." : "No available voucher matches this merchant, service and minimum spend."}
              </div>
            )}
          </div>
        </div>

        <div>
          <SectionTitle>{ko ? "데모 주문" : "Demo purchase"}</SectionTitle>
          <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-primary"><ReceiptText className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold text-foreground">{demoJourney.product}</p>
                <p className="text-[11px] text-muted-foreground">{ko ? "검증된 가맹점 · 예약" : "Verified demo merchant · reservation"}</p>
              </div>
              <p className="text-[15px] font-bold tabular-nums">₩{purchase.grossKRW.toLocaleString()}</p>
            </div>
            <div className="mt-4 space-y-2 border-t border-border pt-3 text-[12px]">
              <PriceRow label={ko ? "혜택" : "Benefit"} value={`−₩${(selected?.valueKRW ?? 0).toLocaleString()}`} success />
              <PriceRow label={ko ? "최종 결제" : "You pay"} value={`₩${payable.toLocaleString()}`} strong />
            </div>
          </div>
        </div>

        {error && <p role="alert" className="rounded-xl bg-primary/8 px-3 py-2 text-[12px] font-medium text-primary">{error}</p>}

        {hasProof ? (
          <button
            type="button"
            disabled={!selected || phase === "processing"}
            onClick={complete}
            className="bg-brand-gradient pressable flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-[15px] font-bold text-white disabled:opacity-45"
          >
            {phase === "processing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <TicketCheck className="h-4 w-4" />}
            {phase === "processing" ? (ko ? "정책 확인·결제·정산 중…" : "Applying policy, payment & settlement…") : (ko ? `혜택 적용 후 ₩${payable.toLocaleString()} 결제` : `Apply benefit & pay ₩${payable.toLocaleString()}`)}
          </button>
        ) : (
          <Link href="/present" className="bg-brand-gradient pressable flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-[15px] font-bold text-white">
            <ShieldCheck className="h-4 w-4" /> {ko ? "K-Tour ID로 자격 증명" : "Verify with K-Tour ID"}
          </Link>
        )}
      </div>
    </PhoneFrame>
  )
}

function VoucherRow({ voucher, selected, onSelect, ko }: { voucher: Voucher; selected: boolean; onSelect: () => void; ko: boolean }) {
  const disabled = voucher.status !== "available"
  return (
    <button type="button" onClick={onSelect} disabled={disabled} className={cn("pressable flex w-full items-center gap-3 rounded-2xl border p-4 text-left", selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card", disabled && "opacity-55")}>
      <span className={cn("grid h-11 w-11 place-items-center rounded-xl", selected ? "bg-primary text-white" : "bg-secondary text-primary")}><Gift className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-bold text-foreground">{voucher.title}</p>
          {disabled && <span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] font-bold text-muted-foreground">{voucher.status.toUpperCase()}</span>}
        </div>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{voucher.partner}</p>
        <p className="mt-1 text-[10px] text-muted-foreground">
          {ko ? "재원" : "Funding"}: {voucher.funding} · {ko ? `최소 ₩${(voucher.minimumSpendKRW ?? 0).toLocaleString()}` : `Min. ₩${(voucher.minimumSpendKRW ?? 0).toLocaleString()}`}
        </p>
      </div>
      <p className="text-[14px] font-extrabold text-primary">₩{voucher.valueKRW.toLocaleString()}</p>
    </button>
  )
}

function BenefitReceipt({ receipt, ko }: { receipt: SettlementReceipt; ko: boolean }) {
  const { demoJourney, session } = useApp()
  const events = [
    ko ? "선택적 공개 VP 검증" : "Selective-disclosure VP verified",
    ko ? "혜택 정책 적용" : "Benefit policy applied",
    ko ? "바우처 1회 사용 처리" : "Voucher marked as redeemed",
    ko ? "결제 승인·가맹점 정산 대기" : "Payment authorized & settlement queued",
  ]
  return (
    <PhoneFrame hideNav>
      <PageHeader title={ko ? "혜택 사용 완료" : "Benefit used"} back="/benefits" />
      <div className="flex min-h-[calc(100vh-8rem)] flex-col px-5 pb-7 pt-3">
        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success-surface text-success"><Check className="h-8 w-8" /></span>
          <h1 className="mt-4 text-[22px] font-extrabold text-foreground">{ko ? "검증된 결제가 완료됐어요" : "Verified purchase complete"}</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{ko ? "여권 원문 없이 혜택을 적용하고 결제 영수증을 만들었습니다. 가맹점 정산은 다음 단계입니다." : "The benefit was applied and a payment receipt created without sharing passport data. Merchant settlement is next."}</p>
        </div>
        <div className="mt-6 rounded-2xl bg-card p-4 ring-1 ring-border">
          <div className="mb-3 flex items-start gap-3 border-b border-border pb-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary"><ReceiptText className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold">{demoJourney.product}</p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{demoJourney.merchantDisplay} · {demoJourney.receiptId}</p>
            </div>
          </div>
          <PriceRow label={ko ? "상품 금액" : "Gross"} value={`₩${receipt.grossKRW.toLocaleString()}`} />
          <PriceRow label={ko ? "혜택" : "Benefit"} value={`−₩${receipt.voucherKRW.toLocaleString()}`} success />
          <PriceRow label={ko ? "결제 금액" : "Paid"} value={`₩${receipt.paidKRW.toLocaleString()}`} strong />
          <PriceRow label={ko ? "남은 데모 잔액" : "Demo balance remaining"} value={`₩${session.wallet.balanceKRW.toLocaleString()}`} />
        </div>
        <div className="mt-3 flex items-start gap-3 rounded-2xl bg-[#fbf2d9] p-4 text-[#735116] ring-1 ring-[#ead59d]">
          <WalletCards className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <p className="text-[12px] font-bold">{ko ? "결제 완료 · 가맹점 정산 대기" : "Payment complete · merchant settlement pending"}</p>
            <p className="mt-1 text-[10.5px] leading-relaxed">{ko ? "북촌 캠페인이 ₩5,000을 부담하고, 가맹점 콘솔에서 결제와 캠페인 재원을 대조합니다." : "The Bukchon campaign funds ₩5,000; the merchant console reconciles customer payment and campaign reimbursement."}</p>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {events.map((event, index) => (
            <div key={event} className="flex items-center gap-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-success-surface text-success"><Check className="h-3.5 w-3.5" /></span>
              <p className="flex-1 text-[12px] font-medium text-foreground">{event}</p>
              <span className="font-mono text-[9px] text-muted-foreground">EVT-0{index + 1}</span>
            </div>
          ))}
        </div>
        <div className="mt-auto space-y-3 pt-8">
          <Link href={`/evidence?settlement=${encodeURIComponent(receipt.id)}`} className="pressable flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink px-4 text-[14px] font-bold text-white">
            <ShieldCheck className="h-4 w-4 text-gold" /> {ko ? "연동·체인 증거 보기" : "View integration evidence"}
          </Link>
          <Link href="/partner/settlements" className="pressable flex min-h-12 items-center justify-center rounded-2xl border border-border bg-card px-4 text-[14px] font-bold text-foreground">
            {ko ? "가맹점 정산 화면 보기" : "Open merchant settlement"}
          </Link>
          <Link href="/ask" className="pressable flex min-h-11 items-center justify-center gap-2 text-[12px] font-semibold text-muted-foreground">
            <HelpCircle className="h-4 w-4" /> {ko ? "취소·환불 도움말" : "Cancellation & refund help"}
          </Link>
        </div>
      </div>
    </PhoneFrame>
  )
}

function PriceRow({ label, value, success = false, strong = false }: { label: string; value: string; success?: boolean; strong?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between py-1.5 text-[12px]", strong && "mt-1 border-t border-border pt-3 text-[14px]")}>
      <span className={strong ? "font-bold text-foreground" : "text-muted-foreground"}>{label}</span>
      <span className={cn("tabular-nums", strong ? "font-extrabold text-foreground" : "font-semibold", success && "text-success")}>{value}</span>
    </div>
  )
}
