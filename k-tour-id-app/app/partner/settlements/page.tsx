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
import { EnvironmentBadge, PageIntro, Panel } from "@/components/partner/partner-shell"
import { useApp } from "@/lib/store/app-provider"
import { cn } from "@/lib/utils"

export default function PartnerSettlementsPage() {
  const { demoJourney, submitDemoSettlement, anchorDemoSettlement } = useApp()
  const [running, setRunning] = useState(false)
  const [finishAfterSubmit, setFinishAfterSubmit] = useState(false)
  const finishingRef = useRef(false)
  const hasPayment = ["paid", "settlement-submitted", "anchored"].includes(demoJourney.stage)
  const complete = demoJourney.stage === "anchored"
  const refunded = demoJourney.stage === "refunded"
  const userFunded = demoJourney.campaignId === "USER-RETURN-TRIP"

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
        eyebrow="Payouts"
        title={refunded ? "Refund adjustment recorded." : hasPayment ? (complete ? "Payout scheduled for Jul 31." : "₩" + demoJourney.merchantDueKRW.toLocaleString() + " ready for payout.") : "No payout ready yet."}
        body={refunded ? (userFunded ? `The cash payment and customer-owned voucher value for ${demoJourney.product} were reversed. No payout is due.` : `The payment and campaign contribution for ${demoJourney.product} were reversed. No payout is due.`) : hasPayment ? `${demoJourney.product} is included in the Jul 30 payout.` : "A completed customer payment will appear here automatically."}
      >
        <div className="flex flex-wrap items-center gap-2">
          <EnvironmentBadge kind="SIMULATED" />
          <Link href="/evidence" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-3.5 text-[12px] font-bold text-foreground">
            <FileSearch className="h-4 w-4 text-primary" /> View evidence
          </Link>
        </div>
      </PageIntro>
      <p className="sr-only" role="status" aria-live="polite">
        {running ? "Submitting payout" : refunded ? "Refund adjustment complete; no payout due" : complete ? "Payout scheduled for Jul 31" : hasPayment ? "Payout ready to submit" : "No payout ready"}
      </p>

      {refunded ? (
        <RefundedPayout gross={demoJourney.grossKRW} paid={demoJourney.paidKRW} benefit={demoJourney.voucherKRW} fee={demoJourney.platformFeeKRW} payout={demoJourney.merchantDueKRW} userFunded={userFunded} />
      ) : !hasPayment ? (
        <EmptyPayout />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
          <div className="space-y-5">
            <PayoutHero amount={demoJourney.merchantDueKRW} complete={complete} running={running} onSubmit={sendPayout} />
            <OrderPanel
              merchant={demoJourney.merchantDisplay}
              product={demoJourney.product}
              gross={demoJourney.grossKRW}
              net={demoJourney.merchantDueKRW}
              complete={complete}
            />
          </div>

          <Panel eyebrow="Payout summary" title="How this amount was calculated">
            <div className="space-y-4 p-5 sm:p-6">
              <MoneyRow label="Order total" value={demoJourney.grossKRW} />
              <MoneyRow label="Cash payment" value={demoJourney.paidKRW} />
              {userFunded ? <MoneyRow label="User-funded voucher redeemed" value={demoJourney.voucherKRW} prefix="+" accent /> : <MoneyRow label="Campaign reimbursement" value={demoJourney.campaignReimbursementKRW} prefix="+" accent />}
              <MoneyRow label="Platform fee" value={demoJourney.platformFeeKRW} prefix="−" />
              <div className="border-t border-border pt-4">
                <MoneyRow label="Net payout" value={demoJourney.merchantDueKRW} strong />
              </div>
              <p className="rounded-2xl bg-surface-2 p-3 text-[12px] leading-relaxed text-muted-foreground">
                {userFunded ? `The customer paid ₩${demoJourney.paidKRW.toLocaleString()} in cash and redeemed ₩${demoJourney.voucherKRW.toLocaleString()} of their own stored voucher value.` : `The visitor paid ₩${demoJourney.paidKRW.toLocaleString()} and the campaign covers ₩${demoJourney.campaignReimbursementKRW.toLocaleString()}.`} The fee is deducted before payout.
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
  return (
    <Panel
      eyebrow="Transaction trace"
      title={userFunded ? "User-funded voucher order" : "Campaign-funded order"}
      action={<EnvironmentBadge kind="SIMULATED" />}
    >
      <dl className="divide-y divide-border px-5 sm:px-6">
        <TraceRow label="Funding source" value={userFunded ? "Customer-owned return-trip voucher · demo fixture" : "Municipal campaign · demo fixture"} />
        <TraceRow label="Campaign ID" value={campaignId} mono />
        <TraceRow label="Voucher ID" value={voucherId} mono />
        <TraceRow label="Customer receipt" value={receiptId} mono />
        <TraceRow label="Settlement ID" value={settlementId} mono />
      </dl>
      <div className="border-t border-border p-5 sm:px-6">
        <Link href="/evidence" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-4 text-[12px] font-bold text-white">
          <FileSearch className="h-4 w-4" /> Open linked simulation evidence <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Panel>
  )
}

function TraceRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid gap-1 py-3.5 sm:grid-cols-[128px_minmax(0,1fr)] sm:items-center sm:gap-4">
      <dt className="text-[12px] font-semibold text-muted-foreground">{label}</dt>
      <dd className={cn("break-all text-[12px] font-bold", mono && "font-mono text-[11px]")}>{value}</dd>
    </div>
  )
}

function CampaignImpact({ campaignId, localSalesKRW, subsidyKRW, payoutKRW }: { campaignId: string; localSalesKRW: number; subsidyKRW: number; payoutKRW: number }) {
  const metrics = [
    { label: "Benefits issued", value: "240" },
    { label: "Redemption rate", value: "30%", detail: "72 simulated uses" },
    { label: "Local sales", value: `₩${localSalesKRW.toLocaleString()}` },
    { label: "Campaign subsidy", value: `₩${subsidyKRW.toLocaleString()}` },
    { label: "Partner payout", value: `₩${payoutKRW.toLocaleString()}` },
  ]

  return (
    <Panel eyebrow="Campaign impact" title={campaignId} action={<EnvironmentBadge kind="SIMULATED" />}>
      <div className="p-5 sm:p-6">
        <p className="max-w-2xl text-[12px] leading-relaxed text-muted-foreground">
          Illustrative aggregate fixture for the current campaign. It contains no traveler identity or live government reporting data.
        </p>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl bg-surface-2 p-4 ring-1 ring-border">
              <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{metric.label}</dt>
              <dd className="mt-2 text-[20px] font-extrabold tracking-tight tabular-nums">{metric.value}</dd>
              {metric.detail && <p className="mt-1 text-[11px] text-muted-foreground">{metric.detail}</p>}
            </div>
          ))}
        </dl>
        <p className="mt-4 rounded-2xl bg-[#f5ecdc] p-3 text-[12px] leading-relaxed text-[#735116]">
          Demo insight only: these figures show the intended reporting shape, not a verified policy result, partner statement or live dataset.
        </p>
      </div>
    </Panel>
  )
}

function PayoutHero({ amount, complete, running, onSubmit }: { amount: number; complete: boolean; running: boolean; onSubmit: () => void }) {
  return (
    <section className="overflow-hidden rounded-3xl bg-ink text-white shadow-[0_16px_48px_rgba(28,24,19,0.14)]">
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-bold", complete ? "bg-success/20 text-[#d2e9cd]" : "bg-white/10 text-white/80")}>
              {complete ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
              {complete ? "Payout scheduled" : "Ready to submit"}
            </span>
            <p className="mt-5 text-[12px] font-bold uppercase tracking-[0.12em] text-white/70">Net payout</p>
            <p className="mt-1 text-[44px] font-extrabold tracking-tight tabular-nums sm:text-[52px]">₩{amount.toLocaleString()}</p>
          </div>
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-gold"><Landmark className="h-7 w-7" /></span>
        </div>

        <dl className="mt-8 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-2">
          <PayoutDetail icon={CalendarDays} label="Payout date" value="Jul 31, 2026" />
          <PayoutDetail icon={Building2} label="Bank account" value="•••• 7821" />
          <PayoutDetail icon={Clock3} label="Payout period" value="Jul 30" />
          <PayoutDetail icon={ReceiptText} label="Paid orders" value="1 order" />
        </dl>

        {!complete && (
          <button type="button" onClick={onSubmit} disabled={running} className="mt-7 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 text-[14px] font-extrabold text-ink disabled:opacity-65">
            {running ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <WalletCards className="h-5 w-5" />}
            {running ? "Submitting payout…" : "Submit ₩" + amount.toLocaleString() + " payout"}
          </button>
        )}
      </div>
    </section>
  )
}

function RefundedPayout({ gross, paid, benefit, fee, payout, userFunded }: { gross: number; paid: number; benefit: number; fee: number; payout: number; userFunded: boolean }) {
  return (
    <Panel eyebrow="Refunded order" title="No payout due">
      <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-[1fr_280px] md:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-success-surface px-3 py-1.5 text-[12px] font-bold text-success"><CheckCircle2 className="h-4 w-4" /> Adjustment complete</span>
          <h2 className="mt-4 text-[24px] font-extrabold">{userFunded ? "Cash and customer voucher value reversed" : "Customer and campaign amounts reversed"}</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">The customer's ₩{paid.toLocaleString()} cash payment and the ₩{benefit.toLocaleString()} {userFunded ? "customer-owned voucher value" : "campaign contribution"} were reversed. The ₩{fee.toLocaleString()} fee was cancelled.</p>
        </div>
        <div className="rounded-2xl bg-surface-2 p-4">
          <MoneyRow label="Original order" value={gross} />
          <div className="mt-3"><MoneyRow label="Original payout" value={payout} /></div>
          <div className="mt-3"><MoneyRow label="Payout adjustment" value={payout} prefix="−" /></div>
          <div className="mt-3 border-t border-border pt-3"><MoneyRow label="Net payout due" value={0} strong /></div>
        </div>
      </div>
    </Panel>
  )
}

function OrderPanel({ merchant, product, gross, net, complete }: { merchant: string; product: string; gross: number; net: number; complete: boolean }) {
  return (
    <Panel eyebrow="Paid orders" title="1 order">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-secondary text-primary"><ReceiptText className="h-5 w-5" /></span>
          <div className="min-w-0">
            <p className="break-words text-[14px] font-extrabold">{product}</p>
            <p className="mt-0.5 break-words text-[12px] text-muted-foreground">{merchant} · Jul 30, 2:32 PM</p>
          </div>
        </div>
        <div className="flex items-end justify-between gap-6 sm:block sm:text-right">
          <div><p className="text-[12px] text-muted-foreground">Order total</p><p className="text-[13px] font-bold tabular-nums">₩{gross.toLocaleString()}</p></div>
          <div className="sm:mt-2"><p className="text-[12px] text-muted-foreground">Your payout</p><p className="text-[16px] font-extrabold tabular-nums text-success">₩{net.toLocaleString()}</p></div>
          <span className={cn("mt-2 hidden rounded-full px-2.5 py-1 text-[12px] font-bold sm:inline-flex", complete ? "bg-success-surface text-success" : "bg-[#f5ecdc] text-[#735116]")}>{complete ? "Submitted" : "Ready"}</span>
        </div>
      </div>
    </Panel>
  )
}

function EmptyPayout() {
  return (
    <Panel>
      <div className="grid min-h-[380px] place-items-center p-8 text-center">
        <div>
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-secondary text-muted-foreground"><Landmark className="h-7 w-7" /></span>
          <h2 className="mt-5 text-[22px] font-extrabold">Waiting for a paid order</h2>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">Verify the visitor's benefit first. The payout appears after their payment is complete.</p>
          <Link href="/partner/verify" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-[12px] font-bold text-white">Go to benefit check <ArrowRight className="h-4 w-4" /></Link>
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
