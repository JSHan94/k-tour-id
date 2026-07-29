"use client"

import { useState } from "react"
import {
  ArrowDownToLine,
  ArrowUpRight,
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
import { EnvironmentBadge, EnvironmentLegend, PageIntro, Panel } from "@/components/partner/partner-shell"
import { cn } from "@/lib/utils"

type BatchState = "ready" | "submitted" | "anchored"

const EVENTS = [
  { time: "14:32:08", type: "VoucherRedeemed", ref: "CPN-0729-1842", amount: "−₩5,000", tone: "text-primary" },
  { time: "14:32:10", type: "PaymentAuthorized", ref: "PAY-0729-6231", amount: "₩45,000", tone: "text-foreground" },
  { time: "14:32:14", type: "PartnerSettlementLogged", ref: "STL-0729-0088", amount: "₩62,055", tone: "text-success" },
] as const

const BATCH_META: Record<BatchState, { label: string; copy: string }> = {
  ready: { label: "Ready to settle", copy: "All included payment and voucher events passed reconciliation." },
  submitted: { label: "Settlement submitted", copy: "The sandbox batch is awaiting chain anchor confirmation." },
  anchored: { label: "Anchored", copy: "Event root and settlement reference are recorded as demo evidence." },
}

export default function PartnerSettlementsPage() {
  const [batchState, setBatchState] = useState<BatchState>("ready")
  const [copied, setCopied] = useState(false)
  const meta = BATCH_META[batchState]

  const advance = () => setBatchState((current) => current === "ready" ? "submitted" : "anchored")

  return (
    <>
      <PageIntro
        eyebrow="Merchant settlement"
        title="From benefit to settlement evidence."
        body="Reconcile a privacy-safe coupon redemption and KRW payment, then anchor event evidence without placing customer identity or payment originals on-chain."
      >
        <EnvironmentLegend />
      </PageIntro>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={CircleDollarSign} label="Gross payment" value="₩50,000" note="1 sandbox payment" />
        <Metric icon={TicketCheck} label="Voucher funded" value="−₩5,000" note="Bukchon campaign" />
        <Metric icon={WalletCards} label="Merchant due" value="₩44,325" note="After 1.5% fee" accent />
        <Metric icon={Blocks} label="Evidence events" value="3" note="No customer PII" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(380px,0.8fr)]">
        <div className="space-y-5">
          <Panel eyebrow="01 · Reconciliation" title="Settlement batch · BUK-2026-0729-08" action={<EnvironmentBadge kind="SANDBOX" />}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-surface-2/65 text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">
                    <th className="px-5 py-3">Time</th>
                    <th className="px-4 py-3">Event</th>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Privacy</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {EVENTS.map((event) => (
                    <tr key={event.type} className="border-b border-border last:border-b-0">
                      <td className="px-5 py-4 font-mono text-[11px] text-muted-foreground">{event.time}</td>
                      <td className="px-4 py-4 text-[12px] font-bold">{event.type}</td>
                      <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">{event.ref}</td>
                      <td className="px-4 py-4"><span className="rounded-full bg-success-surface px-2 py-1 text-[10px] font-bold text-success">PII excluded</span></td>
                      <td className={cn("px-5 py-4 text-right text-[13px] font-extrabold tabular-nums", event.tone)}>{event.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel eyebrow="02 · Money movement" title="Payment and voucher breakdown">
            <div className="grid gap-5 p-5 md:grid-cols-[1fr_1fr] sm:p-6">
              <div className="space-y-3">
                <MoneyRow label="Order subtotal" value="₩50,000" />
                <MoneyRow label="Bukchon campaign voucher" value="−₩5,000" accent />
                <MoneyRow label="Customer paid" value="₩45,000" strong />
                <div className="border-t border-dashed border-border pt-3">
                  <MoneyRow label="Platform fee · 1.5%" value="−₩675" />
                  <div className="mt-3 rounded-2xl bg-ink p-4 text-white">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/55">Merchant receivable</p>
                    <p className="mt-1 text-[28px] font-extrabold tracking-tight">₩44,325</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-surface-2 p-4">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">Settlement route</p>
                <ol className="mt-4 space-y-4">
                  <RouteStep icon={TicketCheck} title="Voucher liability applied" copy="Campaign budget · Bukchon district" done />
                  <RouteStep icon={WalletCards} title="KRW payment authorized" copy="Sandbox stable wallet reference" done />
                  <RouteStep icon={Landmark} title="Merchant payout" copy={batchState === "ready" ? "Waiting for batch submission" : "Destination · •••• 7821"} done={batchState !== "ready"} />
                  <RouteStep icon={Blocks} title="Evidence anchored" copy={batchState === "anchored" ? "Simulated anchor confirmed" : "Pending settlement completion"} done={batchState === "anchored"} />
                </ol>
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel eyebrow="03 · Batch action" title={meta.label} action={<EnvironmentBadge kind="SIMULATED" />}>
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-3 rounded-2xl bg-surface-2 p-4">
                <span className={cn("grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl", batchState === "anchored" ? "bg-success-surface text-success" : "bg-card text-primary")}>
                  {batchState === "anchored" ? <CheckCircle2 className="h-5 w-5" /> : <FileCheck2 className="h-5 w-5" />}
                </span>
                <div>
                  <p className="text-[13px] font-extrabold">{meta.label}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{meta.copy}</p>
                </div>
              </div>

              {batchState !== "anchored" ? (
                <button type="button" onClick={advance} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-gradient px-4 text-[13px] font-extrabold text-white">
                  {batchState === "ready" ? <><ArrowDownToLine className="h-[18px] w-[18px]" /> Submit sandbox settlement</> : <><Blocks className="h-[18px] w-[18px]" /> Simulate chain anchor</>}
                </button>
              ) : (
                <button type="button" onClick={() => setBatchState("ready")} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-[13px] font-extrabold">
                  Reset demo batch
                </button>
              )}
            </div>
          </Panel>

          <Panel eyebrow="04 · Chain evidence" title="Anchor receipt" action={<EnvironmentBadge kind="SIMULATED" />}>
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-2 text-[12px] font-bold text-success">
                <ShieldCheck className="h-4 w-4" /> Off-chain originals protected
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                Only event references and a deterministic batch root are shown. Customer identity, VP, payment payload, and receipt details remain off-chain.
              </p>

              <dl className="mt-5 space-y-3">
                <EvidenceRow label="Network" value="OmniOne testnet" />
                <EvidenceRow label="Event root" value="0x8c1e…97af" mono />
                <EvidenceRow label="Transaction" value={batchState === "anchored" ? "0xf912…44ce" : "Not anchored"} mono />
                <EvidenceRow label="Recorded at" value={batchState === "anchored" ? "2026-07-29 14:32:18 KST" : "—"} />
              </dl>

              <button
                type="button"
                disabled={batchState !== "anchored"}
                onClick={() => { setCopied(true); window.setTimeout(() => setCopied(false), 1200) }}
                className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-[12px] font-bold disabled:opacity-40"
              >
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                {copied ? "Evidence copied" : "Copy anchor evidence"}
              </button>

              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[#f7e8e4] px-3 py-2.5 text-[10px] text-primary">
                <span>This is demo evidence, not a live explorer transaction.</span>
                <ArrowUpRight className="h-3.5 w-3.5 flex-shrink-0" />
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}

function Metric({ icon: Icon, label, value, note, accent }: { icon: typeof ReceiptText; label: string; value: string; note: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-2xl border border-border p-4 shadow-[0_8px_24px_rgba(28,24,19,0.035)]", accent ? "bg-ink text-white" : "bg-card")}>
      <div className="flex items-center justify-between">
        <span className={cn("grid h-9 w-9 place-items-center rounded-xl", accent ? "bg-white/10 text-gold" : "bg-secondary text-primary")}><Icon className="h-[18px] w-[18px]" /></span>
        <EnvironmentBadge kind="SIMULATED" className={accent ? "border-white/15 bg-white/10 text-white/65" : undefined} />
      </div>
      <p className={cn("mt-4 text-[10px] font-extrabold uppercase tracking-[0.11em]", accent ? "text-white/50" : "text-muted-foreground")}>{label}</p>
      <p className="mt-0.5 text-[23px] font-extrabold tracking-tight">{value}</p>
      <p className={cn("mt-1 text-[10px]", accent ? "text-white/50" : "text-muted-foreground")}>{note}</p>
    </div>
  )
}

function MoneyRow({ label, value, strong, accent }: { label: string; value: string; strong?: boolean; accent?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 text-[12px]", strong && "rounded-xl bg-surface-2 px-3 py-2.5")}>
      <span className={strong ? "font-bold" : "text-muted-foreground"}>{label}</span>
      <span className={cn("font-bold tabular-nums", strong && "text-[14px]", accent && "text-primary")}>{value}</span>
    </div>
  )
}

function RouteStep({ icon: Icon, title, copy, done }: { icon: typeof ReceiptText; title: string; copy: string; done?: boolean }) {
  return (
    <li className="flex items-start gap-3">
      <span className={cn("grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg", done ? "bg-success-surface text-success" : "bg-card text-muted-foreground")}>
        {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </span>
      <div>
        <p className="text-[12px] font-bold">{title}</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{copy}</p>
      </div>
    </li>
  )
}

function EvidenceRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className={cn("text-right text-[11px] font-bold", mono && "font-mono")}>{value}</dd>
    </div>
  )
}
