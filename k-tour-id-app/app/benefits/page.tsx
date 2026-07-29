"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { BadgeCheck, Check, ChevronRight, Gift, Loader2, ReceiptText, ShieldCheck, TicketCheck } from "lucide-react"
import { PhoneFrame, PageHeader, SectionTitle } from "@/components/app/shell"
import { IntegrationModeBadge } from "@/components/app/integration-status"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import type { SettlementReceipt, Voucher } from "@/lib/types"
import { cn } from "@/lib/utils"

const DEMO_PURCHASE = {
  merchant: "Bukchon Craft House · demo merchant",
  grossKRW: 50_000,
  service: "reservation" as const,
}

export default function BenefitsPage() {
  const { session, vouchers, payWithBenefit, loadDemoAccount } = useApp()
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
    const verified = params.get("verified") === "1"
    setHasProof(verified)
    if (params.get("presentation")) setPresentationId(params.get("presentation")!)
    // A direct presenter link is an explicit demo handoff; seed the demo holder
    // so the full proof → benefit → settlement path remains executable.
    if (verified && !session.onboarded) loadDemoAccount()
  }, [loadDemoAccount, session.onboarded])

  const available = useMemo(() => vouchers.filter((voucher) => voucher.status === "available"), [vouchers])
  const selected = vouchers.find((voucher) => voucher.id === (selectedId ?? available[0]?.id)) ?? null
  const payable = Math.max(0, DEMO_PURCHASE.grossKRW - (selected?.valueKRW ?? 0))

  const complete = async () => {
    if (!selected || !hasProof || phase === "processing") return
    setPhase("processing")
    setError("")
    const result = await payWithBenefit({
      ...DEMO_PURCHASE,
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
                  {ko ? "이름·여권번호 없이 ‘여행자 자격·여행 유효·미사용’만 확인했습니다." : "Only eligibility, active trip and unused benefit were proved — no name or passport number."}
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
            {vouchers.map((voucher) => (
              <VoucherRow
                key={voucher.id}
                voucher={voucher}
                selected={voucher.id === selected?.id}
                onSelect={() => voucher.status === "available" && setSelectedId(voucher.id)}
                ko={ko}
              />
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>{ko ? "데모 주문" : "Demo purchase"}</SectionTitle>
          <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-primary"><ReceiptText className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold text-foreground">Mother-of-pearl workshop</p>
                <p className="text-[11px] text-muted-foreground">{ko ? "검증된 가맹점 · 예약" : "Verified demo merchant · reservation"}</p>
              </div>
              <p className="text-[15px] font-bold tabular-nums">₩{DEMO_PURCHASE.grossKRW.toLocaleString()}</p>
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
        <p className="mt-1 text-[10px] text-muted-foreground">{ko ? "재원" : "Funding"}: {voucher.funding}</p>
      </div>
      <p className="text-[14px] font-extrabold text-primary">₩{voucher.valueKRW.toLocaleString()}</p>
    </button>
  )
}

function BenefitReceipt({ receipt, ko }: { receipt: SettlementReceipt; ko: boolean }) {
  const events = [
    ko ? "선택적 공개 VP 검증" : "Selective-disclosure VP verified",
    ko ? "혜택 정책 적용" : "Benefit policy applied",
    ko ? "바우처 1회 사용 처리" : "Voucher marked as redeemed",
    ko ? "결제 승인·정산 앵커 생성" : "Payment authorized & settlement anchored",
  ]
  return (
    <PhoneFrame hideNav>
      <PageHeader title={ko ? "혜택 사용 완료" : "Benefit used"} back="/benefits" />
      <div className="flex min-h-[calc(100vh-8rem)] flex-col px-5 pb-7 pt-3">
        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success-surface text-success"><Check className="h-8 w-8" /></span>
          <h1 className="mt-4 text-[22px] font-extrabold text-foreground">{ko ? "검증부터 정산까지 완료" : "Verified through settlement"}</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{ko ? "여권 원문 없이 혜택을 적용하고 가맹점 정산 증거까지 만들었습니다." : "The benefit was applied and settlement evidence created without sharing passport data."}</p>
        </div>
        <div className="mt-6 rounded-2xl bg-card p-4 ring-1 ring-border">
          <PriceRow label={ko ? "상품 금액" : "Gross"} value={`₩${receipt.grossKRW.toLocaleString()}`} />
          <PriceRow label={ko ? "혜택" : "Benefit"} value={`−₩${receipt.voucherKRW.toLocaleString()}`} success />
          <PriceRow label={ko ? "결제 금액" : "Paid"} value={`₩${receipt.paidKRW.toLocaleString()}`} strong />
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
