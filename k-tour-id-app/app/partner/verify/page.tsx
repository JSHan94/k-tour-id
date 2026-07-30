"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  ScanLine,
  TicketCheck,
  XCircle,
} from "lucide-react"
import { QRCode } from "@/components/qr-code"
import { PageIntro, Panel } from "@/components/partner/partner-shell"
import { useApp } from "@/lib/store/app-provider"
import { cn } from "@/lib/utils"

type VerifyState = "waiting" | "submitted" | "verified" | "failed" | "expired" | "offline" | "refunded"

const PREVIEW_STATES: VerifyState[] = ["waiting", "submitted", "verified", "failed", "expired", "offline", "refunded"]

export default function PartnerVerifyPage() {
  const { demoJourney } = useApp()
  const [state, setState] = useState<VerifyState>("waiting")
  const qrValue = useMemo(
    () => "ktourid://present?request=" + demoJourney.requestId + "&mode=simulated",
    [demoJourney.requestId],
  )

  useEffect(() => {
    const preview = new URLSearchParams(window.location.search).get("preview") as VerifyState | null
    if (preview && PREVIEW_STATES.includes(preview)) {
      setState(preview)
      return
    }
    if (demoJourney.stage === "checking") setState("submitted")
    else if (demoJourney.stage === "presentation-expired") setState("expired")
    else if (demoJourney.stage === "presentation-offline") setState("offline")
    else if (demoJourney.stage === "presentation-created" || demoJourney.stage === "presentation-revoked") setState("failed")
    else if (demoJourney.stage === "refunded") setState("refunded")
    else if (["benefit-ready", "paid", "settlement-submitted", "anchored"].includes(demoJourney.stage)) setState("verified")
    else setState("waiting")
  }, [demoJourney.stage])

  return (
    <>
      <PageIntro
        eyebrow="Benefit check"
        title="Check the visitor's workshop benefit."
        body="Keep this screen open at the counter. The result appears as soon as the visitor approves the request in their K-Tour ID wallet."
      />

      <div className="mx-auto max-w-5xl" aria-live="polite" aria-busy={state === "submitted"}>
        {state === "waiting" && <WaitingCard qrValue={qrValue} />}
        {state === "submitted" && <CheckingCard />}
        {state === "verified" && (
          <ApprovedCard
            gross={demoJourney.grossKRW}
            discount={demoJourney.voucherKRW}
            payable={demoJourney.paidKRW}
            paid={["paid", "settlement-submitted", "anchored"].includes(demoJourney.stage)}
          />
        )}
        {state === "refunded" && <RefundedCard gross={demoJourney.grossKRW} returned={demoJourney.paidKRW} />}
        {(state === "failed" || state === "expired" || state === "offline") && <NotApprovedCard reason={state === "expired" ? "expired" : state === "offline" ? "offline" : "policy"} gross={demoJourney.grossKRW} />}
      </div>
    </>
  )
}

function RefundedCard({ gross, returned }: { gross: number; returned: number }) {
  return (
    <Panel>
      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-8">
        <div>
          <StatusPill icon={CheckCircle2} label="Refund complete" tone="success" />
          <h2 className="mt-5 text-[30px] font-extrabold tracking-tight">Payment and benefit reversed.</h2>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">The visitor received ₩{returned.toLocaleString()} back and the one-time workshop benefit is available again.</p>
          <div className="mt-6 rounded-2xl bg-surface-2 p-4">
            <p className="text-[13px] font-extrabold">No action needed at the counter</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">This order is closed. Start a new benefit request only if the visitor places another order.</p>
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5">
          <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Original order</p>
          <p className="mt-1 text-[38px] font-extrabold tracking-tight tabular-nums">₩{gross.toLocaleString()}</p>
          <p className="mt-5 border-t border-border pt-4 text-[12px] leading-relaxed text-muted-foreground">Amount due for this order: ₩0</p>
        </div>
      </div>
    </Panel>
  )
}

function WaitingCard({ qrValue }: { qrValue: string }) {
  return (
    <Panel>
      <div className="grid gap-8 p-6 md:grid-cols-[240px_minmax(0,1fr)] md:items-center md:p-8">
        <div className="mx-auto w-fit rounded-3xl border border-border bg-white p-4 shadow-sm md:mx-0">
          <QRCode value={qrValue} size={208} className="border-0" ariaLabel="K-Tour ID benefit request QR code" />
        </div>
        <div className="text-center md:text-left">
          <StatusPill icon={Clock3} label="Waiting for visitor" tone="waiting" />
          <h2 className="mt-5 text-[26px] font-extrabold tracking-tight">Bukchon craft workshop</h2>
          <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-muted-foreground">
            Ask the visitor to scan this QR with K-Tour ID. They will review the request and approve it on their phone.
          </p>
          <div className="mt-6 rounded-2xl bg-surface-2 p-4">
            <p className="text-[12px] font-bold">What the visitor sees</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              Your store name, the workshop benefit and the information needed to check eligibility.
            </p>
          </div>
        </div>
      </div>
    </Panel>
  )
}

function CheckingCard() {
  return (
    <Panel>
      <div className="grid min-h-[420px] place-items-center p-8 text-center" aria-live="polite">
        <div>
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#f7e8e4] text-primary">
            <LoaderCircle className="h-9 w-9 animate-spin" />
          </span>
          <h2 className="mt-6 text-[26px] font-extrabold tracking-tight">Checking the benefit…</h2>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-muted-foreground">
            The visitor approved the request. Keep this screen open for the result.
          </p>
        </div>
      </div>
    </Panel>
  )
}

function ApprovedCard({ gross, discount, payable, paid }: { gross: number; discount: number; payable: number; paid: boolean }) {
  return (
    <Panel>
      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-8">
        <div>
          <StatusPill icon={CheckCircle2} label="Benefit approved" tone="success" />
          <h2 className="mt-5 text-[30px] font-extrabold tracking-tight">Apply the ₩{discount.toLocaleString()} discount.</h2>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
            This visitor can use the Bukchon workshop benefit once. No identity document needs to be checked at the counter.
          </p>

          <div className={cn("mt-6 flex items-start gap-3 rounded-2xl p-4", paid ? "bg-success-surface" : "bg-[#fbf2d9]")}>
            {paid ? <TicketCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" /> : <ScanLine className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#8a642b]" />}
            <div>
              <p className={cn("text-[13px] font-extrabold", paid ? "text-success" : "text-[#735116]")}>{paid ? "Payment confirmed" : "Next: customer payment"}</p>
              <p className={cn("mt-1 text-[12px] leading-relaxed", paid ? "text-success/80" : "text-[#735116]/80")}>{paid ? "The order is paid. Confirm the workshop booking with the visitor." : "Ask the visitor to approve ₩" + payable.toLocaleString() + " in their K-Tour ID wallet."}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-ink p-5 text-white">
          <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-white/70">Customer total</p>
          <p className="mt-1 text-[38px] font-extrabold tracking-tight tabular-nums">₩{payable.toLocaleString()}</p>
          <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
            <PriceRow label="Workshop" value={"₩" + gross.toLocaleString()} />
            <PriceRow label="Visitor benefit" value={"−₩" + discount.toLocaleString()} accent />
          </div>
        </div>
      </div>
    </Panel>
  )
}

function NotApprovedCard({ reason, gross }: { reason: "expired" | "offline" | "policy"; gross: number }) {
  const retry = reason === "expired" || reason === "offline"
  return (
    <Panel>
      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-8">
        <div>
          <StatusPill icon={retry ? AlertTriangle : XCircle} label={reason === "offline" ? "Connection issue" : "Benefit not approved"} tone="danger" />
          <h2 className="mt-5 text-[30px] font-extrabold tracking-tight">{reason === "offline" ? "Wait before applying the discount." : "Do not apply the discount."}</h2>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
            {reason === "expired"
              ? "The visitor did not finish before the request expired. Ask them to scan a new request when they are ready."
              : reason === "offline"
                ? "Eligibility could not be checked because the service is unavailable. Ask the visitor to retry when the connection returns."
              : "The visitor does not meet this campaign's conditions. You do not need to inspect or copy their identity document."}
          </p>
          <div className="mt-6 rounded-2xl bg-surface-2 p-4">
            <p className="text-[13px] font-extrabold">Next: confirm with the visitor</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              Continue at the regular ₩{gross.toLocaleString()} price only if the visitor agrees, or cancel the order.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5">
          <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Regular total</p>
          <p className="mt-1 text-[38px] font-extrabold tracking-tight tabular-nums">₩{gross.toLocaleString()}</p>
          <p className="mt-5 border-t border-border pt-4 text-[12px] leading-relaxed text-muted-foreground">No benefit was used and no discounted payment was created.</p>
        </div>
      </div>
    </Panel>
  )
}

function StatusPill({ icon: Icon, label, tone }: { icon: typeof Clock3; label: string; tone: "waiting" | "success" | "danger" }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-extrabold",
      tone === "success" ? "bg-success-surface text-success" : tone === "danger" ? "bg-[#f7e8e4] text-primary" : "bg-[#f5ecdc] text-[#8a642b]",
    )}>
      <Icon className="h-4 w-4" /> {label}
    </span>
  )
}

function PriceRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 text-[13px]">
      <span className="text-white/60">{label}</span>
      <span className={cn("font-bold tabular-nums", accent && "text-gold")}>{value}</span>
    </div>
  )
}
