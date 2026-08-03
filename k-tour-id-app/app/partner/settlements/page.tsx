"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileSearch,
  Landmark,
  LoaderCircle,
  ReceiptText,
  WalletCards,
} from "lucide-react"
import { PageIntro, Panel } from "@/components/partner/partner-shell"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import { cn } from "@/lib/utils"

const MERCHANT_KO: Record<string, string> = {
  "Bukchon Craft House": "북촌 공방",
  "Seoul Living Mobility": "서울 생활 모빌리티",
  "Suwon Local Culture Lab": "수원 로컬문화연구소",
  "Yeonhui Table": "연희 테이블",
  "Euljiro Design Market": "을지로 디자인 마켓",
  "Insadong Tea Room": "인사동 찻집",
}

export default function PartnerSettlementsPage() {
  const { demoJourney, submitDemoSettlement, anchorDemoSettlement } = useApp()
  const { lang } = useLang()
  const ko = lang === "ko"
  const [running, setRunning] = useState(false)
  const [finishAfterSubmit, setFinishAfterSubmit] = useState(false)
  const finishingRef = useRef(false)
  const hasPayment = ["paid", "settlement-submitted", "anchored"].includes(demoJourney.stage)
  const complete = demoJourney.stage === "anchored"
  const refunded = demoJourney.stage === "refunded"
  const userFunded = demoJourney.campaignId === "USER-RETURN-TRIP"
  const product = ko ? demoJourney.productKo : demoJourney.product
  const merchant = ko ? (MERCHANT_KO[demoJourney.merchantDisplay] ?? demoJourney.merchantDisplay) : demoJourney.merchantDisplay
  const refundCashKRW = demoJourney.refundCashKRW ?? demoJourney.paidKRW
  const refundVoucherKRW = demoJourney.refundVoucherKRW ?? 0
  const reversedBenefitKRW = demoJourney.reversedBenefitKRW ?? 0
  const adjustedPayoutKRW = refunded ? Math.max(0, demoJourney.merchantDueKRW - refundCashKRW - refundVoucherKRW - reversedBenefitKRW) : demoJourney.merchantDueKRW
  const partialRefund = refunded && adjustedPayoutKRW > 0

  useEffect(() => {
    if (!finishAfterSubmit || demoJourney.stage !== "settlement-submitted" || finishingRef.current) return
    finishingRef.current = true
    void anchorDemoSettlement().finally(() => {
      finishingRef.current = false
      setFinishAfterSubmit(false)
      setRunning(false)
    })
  }, [anchorDemoSettlement, demoJourney.stage, finishAfterSubmit])

  const sendPayout = async () => {
    if (!hasPayment || complete || running) return
    setRunning(true)
    if (demoJourney.stage === "paid") {
      setFinishAfterSubmit(true)
      submitDemoSettlement()
      return
    }
    await anchorDemoSettlement()
    setRunning(false)
  }

  return (
    <>
      <PageIntro
        eyebrow={ko ? "가맹점 정산" : "Partner settlement"}
        title={refunded
          ? partialRefund ? (ko ? `이용분 정산액은 ₩${adjustedPayoutKRW.toLocaleString()}입니다.` : `₩${adjustedPayoutKRW.toLocaleString()} remains payable after the refund.`) : (ko ? "환불 조정이 반영됐습니다." : "Refund adjustment recorded.")
          : hasPayment
            ? complete
              ? (ko ? "다음 영업일 정산 예정입니다." : "Payout is scheduled for the next business day.")
              : (ko ? `정산 예정 금액은 ₩${demoJourney.merchantDueKRW.toLocaleString()}입니다.` : `₩${demoJourney.merchantDueKRW.toLocaleString()} is ready for payout.`)
            : (ko ? "정산할 거래가 아직 없습니다." : "No payout is ready yet.")}
        body={refunded
          ? partialRefund
            ? (ko ? `${product}의 사용 기간을 제외한 금액만 고객에게 반환되어 남은 이용분은 정산됩니다.` : `Only the unused portion of ${product} was returned; the consumed portion remains payable.`)
          : userFunded
            ? (ko ? `${product}의 결제 금액과 고객 소유 바우처가 모두 반환되어 정산할 금액이 없습니다.` : `The payment and customer-owned voucher value for ${product} were reversed. No payout is due.`)
            : (ko ? `${product}의 결제 금액과 예시 캠페인 지원금이 모두 취소되어 정산할 금액이 없습니다.` : `The payment and illustrative campaign contribution for ${product} were reversed. No payout is due.`)
          : hasPayment
            ? (ko ? `${product} 주문이 현재 정산 건에 포함됐습니다.` : `${product} is included in the current payout.`)
            : (ko ? "방문객 결제가 완료되면 이 화면에 정산 내역이 자동으로 표시됩니다." : "A completed customer payment will appear here automatically.")}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/evidence" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-3.5 text-[12px] font-bold text-foreground">
            <FileSearch className="h-4 w-4 text-primary" /> {ko ? "거래 증거 보기" : "View evidence"}
          </Link>
        </div>
      </PageIntro>
      <p className="sr-only" role="status" aria-live="polite">
        {running
          ? (ko ? "정산 제출 중" : "Submitting payout")
          : refunded
            ? partialRefund ? (ko ? `환불 조정 완료, 정산액 ₩${adjustedPayoutKRW.toLocaleString()}` : `Refund adjusted; ₩${adjustedPayoutKRW.toLocaleString()} payout due`) : (ko ? "환불 조정 완료, 정산 금액 없음" : "Refund adjustment complete; no payout due")
            : complete
              ? (ko ? "다음 영업일 정산 예정" : "Payout scheduled for the next business day")
              : hasPayment
                ? (ko ? "정산 제출 가능" : "Payout ready to submit")
                : (ko ? "정산할 거래 없음" : "No payout ready")}
      </p>

      {refunded ? (
        <RefundedPayout gross={demoJourney.grossKRW} cashReturned={refundCashKRW} voucherReturned={refundVoucherKRW} benefitReversed={reversedBenefitKRW} payout={demoJourney.merchantDueKRW} adjustedPayout={adjustedPayoutKRW} settledUsageDays={demoJourney.settledUsageDays} userFunded={userFunded} />
      ) : !hasPayment ? (
        <EmptyPayout />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
          <div className="space-y-5">
            <PayoutHero amount={demoJourney.merchantDueKRW} complete={complete} running={running} onSubmit={sendPayout} />
            <OrderPanel
              merchant={merchant}
              product={product}
              gross={demoJourney.grossKRW}
              net={demoJourney.merchantDueKRW}
              complete={complete}
              createdAt={demoJourney.createdAt}
            />
          </div>

          <Panel eyebrow={ko ? "정산 요약" : "Payout summary"} title={ko ? "정산 예정 금액 계산 내역" : "How this amount was calculated"}>
            <div className="space-y-4 p-5 sm:p-6">
              <MoneyRow label={ko ? "주문 금액" : "Order total"} value={demoJourney.grossKRW} />
              <MoneyRow label={ko ? "고객 결제" : "Customer payment"} value={demoJourney.paidKRW} />
              {userFunded ? <MoneyRow label={ko ? "고객 소유 바우처 사용" : "Customer-owned voucher redeemed"} value={demoJourney.voucherKRW} prefix="+" accent /> : <MoneyRow label={ko ? "예시 캠페인 지원금" : "Illustrative campaign reimbursement"} value={demoJourney.campaignReimbursementKRW} prefix="+" accent />}
              <MoneyRow label={ko ? "플랫폼 수수료" : "Platform fee"} value={demoJourney.platformFeeKRW} prefix="−" />
              <div className="border-t border-border pt-4">
                <MoneyRow label={ko ? "최종 정산 예정액" : "Net payout"} value={demoJourney.merchantDueKRW} strong />
              </div>
              <p className="rounded-2xl bg-surface-2 p-3 text-[12px] leading-relaxed text-muted-foreground">
                {userFunded
                  ? (ko ? `고객이 여행 잔액으로 ₩${demoJourney.paidKRW.toLocaleString()}을 결제하고, 본인 소유 바우처 ₩${demoJourney.voucherKRW.toLocaleString()}을 사용했습니다.` : `The customer paid ₩${demoJourney.paidKRW.toLocaleString()} from their travel balance and redeemed ₩${demoJourney.voucherKRW.toLocaleString()} of their own stored voucher value.`)
                  : (ko ? `방문객이 ₩${demoJourney.paidKRW.toLocaleString()}을 결제하고, 예시 캠페인이 ₩${demoJourney.campaignReimbursementKRW.toLocaleString()}을 지원합니다.` : `The visitor paid ₩${demoJourney.paidKRW.toLocaleString()} and the illustrative campaign covers ₩${demoJourney.campaignReimbursementKRW.toLocaleString()}.`)} {ko ? "플랫폼 수수료를 뺀 금액이 정산됩니다." : "The platform fee is deducted before payout."}
              </p>
            </div>
          </Panel>
        </div>
      )}

      <div className={cn("mt-5 grid gap-5", !userFunded && "xl:grid-cols-[minmax(360px,0.82fr)_minmax(0,1.18fr)]")}>
        <TransactionTrace
          userFunded={userFunded}
          campaignId={demoJourney.campaignId}
          voucherId={demoJourney.voucherId}
          receiptId={demoJourney.receiptId}
          settlementId={demoJourney.settlementId}
        />
        {!userFunded && <CampaignImpact
          campaignId={demoJourney.campaignId}
          localSalesKRW={3_600_000}
          subsidyKRW={360_000}
          payoutKRW={3_551_400}
        />}
      </div>
    </>
  )
}

function TransactionTrace({ userFunded, campaignId, voucherId, receiptId, settlementId }: { userFunded: boolean; campaignId: string; voucherId: string; receiptId: string; settlementId: string }) {
  const { lang } = useLang()
  const ko = lang === "ko"
  return (
    <Panel
      eyebrow={ko ? "거래 연결 정보" : "Transaction trace"}
      title={userFunded ? (ko ? "고객 소유 바우처 주문" : "Customer-owned voucher order") : (ko ? "예시 캠페인 지원 주문" : "Illustrative campaign-funded order")}
    >
      <dl className="divide-y divide-border px-5 sm:px-6">
        <TraceRow label={ko ? "재원" : "Funding source"} value={userFunded ? (ko ? "고객 소유 재방문 바우처" : "Customer-owned return-trip voucher") : (ko ? "지자체 캠페인 예시" : "Illustrative municipal campaign")} />
        <TraceRow label={ko ? "캠페인 ID" : "Campaign ID"} value={campaignId} mono />
        <TraceRow label={ko ? "바우처 ID" : "Voucher ID"} value={voucherId} mono />
        <TraceRow label={ko ? "고객 영수증" : "Customer receipt"} value={receiptId} mono />
        <TraceRow label={ko ? "정산 ID" : "Settlement ID"} value={settlementId} mono />
      </dl>
      <div className="border-t border-border p-5 sm:px-6">
        <Link href="/evidence" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-4 text-[12px] font-bold text-white">
          <FileSearch className="h-4 w-4" /> {ko ? "연결된 거래 증거 보기" : "Open linked transaction evidence"} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Panel>
  )
}

function TraceRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid gap-1 py-3.5 sm:grid-cols-[128px_minmax(0,1fr)] sm:items-center sm:gap-4">
      <dt className="text-[12px] font-semibold text-muted-foreground">{label}</dt>
      <dd className={cn("break-all text-[12px] font-bold", mono && "font-mono")}>{value}</dd>
    </div>
  )
}

function CampaignImpact({ campaignId, localSalesKRW, subsidyKRW, payoutKRW }: { campaignId: string; localSalesKRW: number; subsidyKRW: number; payoutKRW: number }) {
  const { lang } = useLang()
  const ko = lang === "ko"
  const metrics = [
    { label: ko ? "발급 혜택" : "Benefits issued", value: "240" },
    { label: ko ? "사용률" : "Redemption rate", value: "30%", detail: ko ? "72건 사용" : "72 uses" },
    { label: ko ? "지역 매출" : "Local sales", value: `₩${localSalesKRW.toLocaleString()}` },
    { label: ko ? "캠페인 지원금" : "Campaign subsidy", value: `₩${subsidyKRW.toLocaleString()}` },
    { label: ko ? "가맹점 정산액" : "Partner payout", value: `₩${payoutKRW.toLocaleString()}` },
  ]

  return (
    <Panel eyebrow={ko ? "예시 캠페인 성과" : "Illustrative campaign impact"} title={campaignId}>
      <div className="p-5 sm:p-6">
        <p className="max-w-2xl text-[12px] leading-relaxed text-muted-foreground">
          {ko ? "캠페인 운영 화면을 설명하기 위한 집계 예시입니다. 보고 데이터에는 여행자의 신원 정보가 포함되지 않습니다." : "Illustrative aggregate performance for this campaign. Traveler identity is excluded from reporting data."}
        </p>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-5">
          {metrics.map((metric) => (
            <div key={metric.label} className="min-w-0 rounded-2xl bg-surface-2 p-4 ring-1 ring-border">
              <dt className="text-[12px] font-bold text-muted-foreground">{metric.label}</dt>
              <dd className="mt-2 break-words text-[clamp(16px,1.5vw,20px)] font-extrabold tracking-tight tabular-nums">{metric.value}</dd>
              {metric.detail && <p className="mt-1 text-[12px] text-muted-foreground">{metric.detail}</p>}
            </div>
          ))}
        </dl>
        <p className="mt-4 rounded-2xl bg-[#f5ecdc] p-3 text-[12px] leading-relaxed text-[#735116]">{ko ? "실제 연동 시 정산 이벤트가 확인된 뒤 집계 수치가 갱신됩니다." : "In a live integration, figures update after settlement events are confirmed."}</p>
      </div>
    </Panel>
  )
}

function PayoutHero({ amount, complete, running, onSubmit }: { amount: number; complete: boolean; running: boolean; onSubmit: () => void }) {
  const { lang } = useLang()
  const ko = lang === "ko"
  return (
    <section className="overflow-hidden rounded-3xl bg-ink text-white shadow-[0_16px_48px_rgba(28,24,19,0.14)]">
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-bold", complete ? "bg-success/20 text-[#d2e9cd]" : "bg-white/10 text-white/80")}>
              {complete ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
              {complete ? (ko ? "정산 접수 완료" : "Payout scheduled") : (ko ? "제출 가능" : "Ready to submit")}
            </span>
            <p className="mt-5 text-[12px] font-bold text-white/70">{ko ? "최종 정산 예정액" : "Net payout"}</p>
            <p className="mt-1 text-[44px] font-extrabold tracking-tight tabular-nums sm:text-[52px]">₩{amount.toLocaleString()}</p>
          </div>
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-gold"><Landmark className="h-7 w-7" /></span>
        </div>

        <dl className="mt-8 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-2">
          <PayoutDetail icon={CalendarDays} label={ko ? "정산 예정" : "Payout timing"} value={ko ? "다음 영업일" : "Next business day"} />
          <PayoutDetail icon={Building2} label={ko ? "입금 계좌" : "Bank account"} value="•••• 7821" />
          <PayoutDetail icon={Clock3} label={ko ? "정산 범위" : "Payout period"} value={ko ? "현재 거래 건" : "Current transaction"} />
          <PayoutDetail icon={ReceiptText} label={ko ? "결제 완료 주문" : "Paid orders"} value={ko ? "1건" : "1 order"} />
        </dl>

        {!complete && (
          <button type="button" onClick={onSubmit} disabled={running} className="mt-7 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 text-[14px] font-extrabold text-ink disabled:opacity-65">
            {running ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <WalletCards className="h-5 w-5" />}
            {running ? (ko ? "정산을 제출하고 있어요…" : "Submitting payout…") : (ko ? `₩${amount.toLocaleString()} 정산 제출` : `Submit ₩${amount.toLocaleString()} payout`)}
          </button>
        )}
      </div>
    </section>
  )
}

function RefundedPayout({ gross, cashReturned, voucherReturned, benefitReversed, payout, adjustedPayout, settledUsageDays, userFunded }: { gross: number; cashReturned: number; voucherReturned: number; benefitReversed: number; payout: number; adjustedPayout: number; settledUsageDays?: number; userFunded: boolean }) {
  const { lang } = useLang()
  const ko = lang === "ko"
  const partialRefund = adjustedPayout > 0
  const adjustment = payout - adjustedPayout
  return (
    <Panel eyebrow={ko ? "환불 주문" : "Refunded order"} title={partialRefund ? (ko ? "이용분 정산 예정" : "Consumed portion payable") : (ko ? "정산할 금액 없음" : "No payout due")}>
      <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-[1fr_280px] md:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-success-surface px-3 py-1.5 text-[12px] font-bold text-success"><CheckCircle2 className="h-4 w-4" /> {ko ? "조정 완료" : "Adjustment complete"}</span>
          <h2 className="mt-4 text-[24px] font-extrabold">{partialRefund ? (ko ? "미사용 기간 환불 조정 완료" : "Unused-period refund adjusted") : userFunded ? (ko ? "고객 결제와 소유 바우처 반환 완료" : "Customer payment and voucher value reversed") : (ko ? "고객 결제와 캠페인 지원금 취소 완료" : "Customer and campaign amounts reversed")}</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{partialRefund ? (ko ? `${settledUsageDays ?? 1}일 이용분은 유지하고 고객 여행 잔액으로 ₩${cashReturned.toLocaleString()}을 반환했습니다.` : `The ${settledUsageDays ?? 1}-day consumed portion remains payable; ₩${cashReturned.toLocaleString()} was returned to the customer's travel balance.`) : userFunded ? (ko ? `고객 여행 잔액 ₩${cashReturned.toLocaleString()}과 고객 소유 바우처 ₩${voucherReturned.toLocaleString()}이 반환됐습니다.` : `₩${cashReturned.toLocaleString()} in travel balance and ₩${voucherReturned.toLocaleString()} in customer-owned voucher value were restored.`) : (ko ? `고객 결제 ₩${cashReturned.toLocaleString()}과 예시 캠페인 지원금 ₩${benefitReversed.toLocaleString()}이 취소됐습니다.` : `The customer's ₩${cashReturned.toLocaleString()} payment and ₩${benefitReversed.toLocaleString()} illustrative campaign contribution were reversed.`)}</p>
        </div>
        <div className="rounded-2xl bg-surface-2 p-4">
          <MoneyRow label={ko ? "기존 주문 금액" : "Original order"} value={gross} />
          <div className="mt-3"><MoneyRow label={ko ? "기존 정산 예정액" : "Original payout"} value={payout} /></div>
          <div className="mt-3"><MoneyRow label={ko ? "정산 조정액" : "Payout adjustment"} value={adjustment} prefix="−" /></div>
          <div className="mt-3 border-t border-border pt-3"><MoneyRow label={ko ? "최종 정산액" : "Net payout due"} value={adjustedPayout} strong /></div>
        </div>
      </div>
    </Panel>
  )
}

function OrderPanel({ merchant, product, gross, net, complete, createdAt }: { merchant: string; product: string; gross: number; net: number; complete: boolean; createdAt: string }) {
  const { lang } = useLang()
  const ko = lang === "ko"
  const orderTime = new Intl.DateTimeFormat(ko ? "ko-KR" : "en-US", {
    month: ko ? "long" : "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(createdAt))
  return (
    <Panel eyebrow={ko ? "결제 완료 주문" : "Paid orders"} title={ko ? "1건" : "1 order"}>
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-secondary text-primary"><ReceiptText className="h-5 w-5" /></span>
          <div className="min-w-0">
            <p className="break-words text-[14px] font-extrabold">{product}</p>
            <p className="mt-0.5 break-words text-[12px] text-muted-foreground">{merchant} · {orderTime}</p>
          </div>
        </div>
        <div className="flex items-end justify-between gap-6 sm:block sm:text-right">
          <div><p className="text-[12px] text-muted-foreground">{ko ? "주문 금액" : "Order total"}</p><p className="text-[13px] font-bold tabular-nums">₩{gross.toLocaleString()}</p></div>
          <div className="sm:mt-2"><p className="text-[12px] text-muted-foreground">{ko ? "정산 예정액" : "Your payout"}</p><p className="text-[16px] font-extrabold tabular-nums text-success">₩{net.toLocaleString()}</p></div>
          <span className={cn("mt-2 hidden rounded-full px-2.5 py-1 text-[12px] font-bold sm:inline-flex", complete ? "bg-success-surface text-success" : "bg-[#f5ecdc] text-[#735116]")}>{complete ? (ko ? "제출 완료" : "Submitted") : (ko ? "제출 가능" : "Ready")}</span>
        </div>
      </div>
    </Panel>
  )
}

function EmptyPayout() {
  const { lang } = useLang()
  const ko = lang === "ko"
  return (
    <Panel>
      <div className="grid min-h-[380px] place-items-center p-8 text-center">
        <div>
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-secondary text-muted-foreground"><Landmark className="h-7 w-7" /></span>
          <h2 className="mt-5 text-[22px] font-extrabold">{ko ? "결제 완료 주문을 기다리고 있어요" : "Waiting for a paid order"}</h2>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">{ko ? "먼저 방문객의 혜택을 확인하세요. 결제가 완료되면 정산 예정 내역이 표시됩니다." : "Verify the visitor's benefit first. The payout appears after their payment is complete."}</p>
          <Link href="/partner/verify" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-[12px] font-bold text-white">{ko ? "혜택 확인으로 이동" : "Go to benefit check"} <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </Panel>
  )
}

function PayoutDetail({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] p-3">
      <Icon className="h-4 w-4 flex-shrink-0 text-gold" />
      <div><dt className="text-[12px] text-white/70">{label}</dt><dd className="mt-0.5 text-[13px] font-bold">{value}</dd></div>
    </div>
  )
}

function MoneyRow({ label, value, prefix = "", accent, strong }: { label: string; value: number; prefix?: string; accent?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={cn("text-[13px]", strong ? "font-extrabold" : "text-muted-foreground")}>{label}</span>
      <span className={cn("font-bold tabular-nums", strong && "text-[20px] font-extrabold", accent && "text-success")}>{prefix}₩{value.toLocaleString()}</span>
    </div>
  )
}
