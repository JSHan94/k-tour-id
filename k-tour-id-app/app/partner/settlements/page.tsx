"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowDownToLine,
  ArrowRight,
  Blocks,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Copy,
  FileCheck2,
  Landmark,
  ReceiptText,
  ShieldCheck,
  TicketCheck,
  WalletCards,
} from "lucide-react"
import { EnvironmentBadge, PageIntro, Panel } from "@/components/partner/partner-shell"
import { useApp } from "@/lib/store/app-provider"
import { cn } from "@/lib/utils"

export default function PartnerSettlementsPage() {
  const { demoJourney, submitDemoSettlement, anchorDemoSettlement } = useApp()
  const [copied, setCopied] = useState(false)
  const [anchoring, setAnchoring] = useState(false)
  const hasPayment = ["paid", "settlement-submitted", "anchored"].includes(demoJourney.stage)
  const submitted = ["settlement-submitted", "anchored"].includes(demoJourney.stage)
  const anchored = demoJourney.stage === "anchored"

  const advance = async () => {
    if (demoJourney.stage === "paid") {
      submitDemoSettlement()
      return
    }
    if (demoJourney.stage === "settlement-submitted") {
      setAnchoring(true)
      await anchorDemoSettlement()
      setAnchoring(false)
    }
  }

  const copyEvidence = async () => {
    if (!anchored) return
    const payload = `${demoJourney.settlementId} | ${demoJourney.anchorHash ?? "simulated"}`
    try { await navigator.clipboard.writeText(payload) } catch { /* browser may block clipboard in preview */ }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  return (
    <>
      <PageIntro
        eyebrow="Merchant settlement"
        title="One receipt, from benefit to payout."
        body="The same holder payment is reconciled with campaign funding, merchant fees and non-PII evidence. Every amount and reference below comes from the shared demo transaction."
      >
        <EnvironmentBadge kind="SIMULATED" />
      </PageIntro>

      {!hasPayment && (
        <div className="mb-5 flex flex-col gap-4 rounded-3xl border border-[#ead59d] bg-[#fbf2d9] p-5 text-[#735116] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-extrabold">Waiting for the holder payment</p>
            <p className="mt-1 text-[11px] leading-relaxed">Complete the K-Tour ID presentation and pay the workshop order. This batch will then populate with the same receipt IDs.</p>
          </div>
          <Link href="/present" className="inline-flex min-h-11 flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-[12px] font-bold text-white">
            Open holder flow <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={CircleDollarSign} label="Order gross" value={`₩${demoJourney.grossKRW.toLocaleString()}`} note={demoJourney.receiptId} />
        <Metric icon={TicketCheck} label="Campaign funds" value={`+₩${demoJourney.campaignReimbursementKRW.toLocaleString()}`} note={demoJourney.campaignId} />
        <Metric icon={WalletCards} label="Merchant receivable" value={`₩${demoJourney.merchantDueKRW.toLocaleString()}`} note="Payment + campaign − fee" accent />
        <Metric icon={Blocks} label="Settlement state" value={anchored ? "Anchored" : submitted ? "Submitted" : hasPayment ? "Ready" : "Waiting"} note="PII excluded" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(380px,0.8fr)]">
        <div className="space-y-5">
          <Panel eyebrow="01 · Reconciliation" title={`Settlement · ${demoJourney.settlementId}`} action={<EnvironmentBadge kind="SIMULATED" />}>
            {hasPayment ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border bg-surface-2/65 text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">
                      <th className="px-4 py-3">Event</th><th className="px-3 py-3">Reference</th><th className="px-3 py-3">Source</th><th className="px-3 py-3">Privacy</th><th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <EventRow type="VoucherRedeemed" reference={demoJourney.voucherId} source="Bukchon campaign" amount={`₩${demoJourney.voucherKRW.toLocaleString()}`} tone="text-primary" />
                    <EventRow type="PaymentAuthorized" reference={demoJourney.paymentId} source="Holder demo balance" amount={`₩${demoJourney.paidKRW.toLocaleString()}`} />
                    <EventRow type="PartnerSettlementLogged" reference={demoJourney.settlementId} source={anchored ? "Anchor receipt" : "Pending anchor"} amount={`₩${demoJourney.merchantDueKRW.toLocaleString()}`} tone="text-success" />
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyBatch />
            )}
          </Panel>

          <Panel eyebrow="02 · Money movement" title="Payment, campaign and fee breakdown">
            <div className="grid gap-5 p-5 md:grid-cols-2 sm:p-6">
              <div className="space-y-3">
                <MoneyRow label="Order subtotal" value={`₩${demoJourney.grossKRW.toLocaleString()}`} />
                <MoneyRow label="Customer benefit" value={`−₩${demoJourney.voucherKRW.toLocaleString()}`} accent />
                <MoneyRow label="Customer paid" value={`₩${demoJourney.paidKRW.toLocaleString()}`} strong />
                <MoneyRow label="Campaign reimbursement" value={`+₩${demoJourney.campaignReimbursementKRW.toLocaleString()}`} />
                <MoneyRow label="Platform fee · 1.5% of customer payment" value={`−₩${demoJourney.platformFeeKRW.toLocaleString()}`} />
                <div className="rounded-2xl bg-ink p-4 text-white">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/55">Merchant receivable</p>
                  <p className="mt-1 text-[28px] font-extrabold tracking-tight">₩{demoJourney.merchantDueKRW.toLocaleString()}</p>
                  <p className="mt-1 text-[10px] text-white/50">₩{demoJourney.paidKRW.toLocaleString()} + ₩{demoJourney.campaignReimbursementKRW.toLocaleString()} − ₩{demoJourney.platformFeeKRW.toLocaleString()}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-surface-2 p-4">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">Settlement route</p>
                <ol className="mt-4 space-y-4">
                  <RouteStep icon={TicketCheck} title="Voucher liability matched" copy={`Municipal campaign · ${demoJourney.campaignId}`} done={hasPayment} />
                  <RouteStep icon={WalletCards} title="Customer payment reconciled" copy={demoJourney.paymentId} done={hasPayment} />
                  <RouteStep icon={Landmark} title="Merchant payout submitted" copy={submitted ? "Destination · •••• 7821" : "Waiting for batch approval"} done={submitted} />
                  <RouteStep icon={Blocks} title="Evidence anchored" copy={anchored ? "Simulated anchor receipt created" : "Runs after payout submission"} done={anchored} />
                </ol>
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel eyebrow="03 · Batch action" title={anchored ? "Settlement evidence complete" : submitted ? "Settlement submitted" : hasPayment ? "Ready to settle" : "No payable batch"} action={<EnvironmentBadge kind="SIMULATED" />}>
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-3 rounded-2xl bg-surface-2 p-4">
                <span className={cn("grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl", anchored ? "bg-success-surface text-success" : "bg-card text-primary")}>
                  {anchored ? <CheckCircle2 className="h-5 w-5" /> : <FileCheck2 className="h-5 w-5" />}
                </span>
                <div>
                  <p className="text-[13px] font-extrabold">{anchored ? "Anchor receipt attached" : submitted ? "Payout instruction accepted" : hasPayment ? "All references reconciled" : "Holder action required"}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{anchored ? "The non-PII event root is attached to this exact settlement." : submitted ? "Create the simulated chain evidence as the final step." : hasPayment ? "Submit the payout only after reviewing the funding equation." : "No settlement can be submitted before payment."}</p>
                </div>
              </div>
              {!anchored && (
                <button type="button" onClick={advance} disabled={!hasPayment || anchoring} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-gradient px-4 text-[13px] font-extrabold text-white disabled:opacity-40">
                  {submitted ? <><Blocks className="h-[18px] w-[18px]" /> {anchoring ? "Creating simulated anchor…" : "Create simulated anchor"}</> : <><ArrowDownToLine className="h-[18px] w-[18px]" /> Submit settlement</>}
                </button>
              )}
            </div>
          </Panel>

          <Panel eyebrow="04 · Shared receipt" title={demoJourney.receiptId} action={<EnvironmentBadge kind="SIMULATED" />}>
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-2 text-[12px] font-bold text-success"><ShieldCheck className="h-4 w-4" /> Holder and merchant IDs match</div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">Only event references and the batch root are shown. Identity, VP and payment payloads remain off-chain.</p>
              <dl className="mt-5 space-y-3">
                <EvidenceRow label="Request" value={demoJourney.requestId} mono />
                <EvidenceRow label="Presentation" value={demoJourney.presentationId} mono />
                <EvidenceRow label="Payment" value={demoJourney.paymentId} mono />
                <EvidenceRow label="Network" value="OmniOne Chain adapter · simulated" />
                <EvidenceRow label="Anchor" value={anchored ? shortHash(demoJourney.anchorHash) : "Not created"} mono />
              </dl>
              <button type="button" disabled={!anchored} onClick={copyEvidence} className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-[12px] font-bold disabled:opacity-40">
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}{copied ? "Evidence copied" : "Copy anchor evidence"}
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}

function EventRow({ type, reference, source, amount, tone }: { type: string; reference: string; source: string; amount: string; tone?: string }) {
  return <tr className="border-b border-border last:border-b-0"><td className="px-4 py-4 text-[12px] font-bold">{type}</td><td className="px-3 py-4 font-mono text-[11px] text-muted-foreground">{reference}</td><td className="px-3 py-4 text-[11px] text-muted-foreground">{source}</td><td className="px-3 py-4"><span className="rounded-full bg-success-surface px-2 py-1 text-[10px] font-bold text-success">PII excluded</span></td><td className={cn("whitespace-nowrap px-4 py-4 text-right text-[13px] font-extrabold tabular-nums", tone)}>{amount}</td></tr>
}

function EmptyBatch() {
  return <div className="grid min-h-48 place-items-center p-6 text-center"><div><ReceiptText className="mx-auto h-7 w-7 text-muted-foreground" /><p className="mt-3 text-[13px] font-bold">No payment to reconcile yet</p><p className="mt-1 text-[11px] text-muted-foreground">A rejected, expired or unpaid presentation never creates a settlement row.</p></div></div>
}

function Metric({ icon: Icon, label, value, note, accent }: { icon: typeof ReceiptText; label: string; value: string; note: string; accent?: boolean }) {
  return <div className={cn("rounded-2xl border border-border p-4 shadow-[0_8px_24px_rgba(28,24,19,0.035)]", accent ? "bg-ink text-white" : "bg-card")}><div className="flex items-center justify-between"><span className={cn("grid h-9 w-9 place-items-center rounded-xl", accent ? "bg-white/10 text-gold" : "bg-secondary text-primary")}><Icon className="h-[18px] w-[18px]" /></span><EnvironmentBadge kind="SIMULATED" className={accent ? "border-white/15 bg-white/10 text-white/65" : undefined} /></div><p className={cn("mt-4 text-[10px] font-extrabold uppercase tracking-[0.11em]", accent ? "text-white/50" : "text-muted-foreground")}>{label}</p><p className="mt-0.5 truncate text-[23px] font-extrabold tracking-tight">{value}</p><p className={cn("mt-1 truncate text-[10px]", accent ? "text-white/50" : "text-muted-foreground")}>{note}</p></div>
}

function MoneyRow({ label, value, strong, accent }: { label: string; value: string; strong?: boolean; accent?: boolean }) {
  return <div className={cn("flex items-center justify-between gap-3 text-[12px]", strong && "rounded-xl bg-surface-2 px-3 py-2.5")}><span className={strong ? "font-bold" : "text-muted-foreground"}>{label}</span><span className={cn("font-bold tabular-nums", strong && "text-[14px]", accent && "text-primary")}>{value}</span></div>
}

function RouteStep({ icon: Icon, title, copy, done }: { icon: typeof ReceiptText; title: string; copy: string; done?: boolean }) {
  return <li className="flex items-start gap-3"><span className={cn("grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg", done ? "bg-success-surface text-success" : "bg-card text-muted-foreground")}>{done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}</span><div className="min-w-0"><p className="text-[12px] font-bold">{title}</p><p className="mt-0.5 truncate text-[10px] text-muted-foreground">{copy}</p></div></li>
}

function EvidenceRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return <div className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0"><dt className="text-[11px] text-muted-foreground">{label}</dt><dd className={cn("max-w-[68%] truncate text-right text-[11px] font-bold", mono && "font-mono")}>{value}</dd></div>
}

function shortHash(value?: string) {
  if (!value) return "Not created"
  return value.length > 18 ? `${value.slice(0, 10)}…${value.slice(-6)}` : value
}
