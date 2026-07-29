"use client"

import { useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  EyeOff,
  FileCheck2,
  Gift,
  LoaderCircle,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  TicketCheck,
  XCircle,
} from "lucide-react"
import { QRCode } from "@/components/qr-code"
import {
  EnvironmentBadge,
  EnvironmentLegend,
  PageIntro,
  Panel,
  VerifiedMark,
} from "@/components/partner/partner-shell"
import { cn } from "@/lib/utils"

type VerifyState = "waiting" | "submitted" | "verified" | "failed" | "expired"
type ClaimKey = "kpass" | "stay" | "adult" | "coupon" | "nationality"

const CLAIMS: { key: ClaimKey; label: string; detail: string; minimal?: boolean }[] = [
  { key: "kpass", label: "Valid K-Tour ID", detail: "Credential is active and not revoked", minimal: true },
  { key: "stay", label: "Stay is currently valid", detail: "Boolean result only; no visa number", minimal: true },
  { key: "adult", label: "Age threshold met", detail: "Over 19 result; no date of birth", minimal: true },
  { key: "coupon", label: "Bukchon welcome coupon eligible", detail: "Eligibility and prior-use check", minimal: true },
  { key: "nationality", label: "Nationality", detail: "Optional; avoid unless policy requires it" },
]

const STATE_META: Record<VerifyState, { label: string; copy: string; icon: typeof Clock3; tone: string }> = {
  waiting: { label: "Waiting", copy: "Ask the visitor to scan the QR in their wallet.", icon: Clock3, tone: "text-[#8a642b] bg-[#f5ecdc]" },
  submitted: { label: "Submitted", copy: "VP received. Signature and policy checks are running.", icon: LoaderCircle, tone: "text-primary bg-[#f7e8e4]" },
  verified: { label: "Verified", copy: "The credential and requested policy conditions passed.", icon: CheckCircle2, tone: "text-success bg-success-surface" },
  failed: { label: "Failed", copy: "Signature verification failed. No benefit was issued.", icon: XCircle, tone: "text-primary bg-[#f7e8e4]" },
  expired: { label: "Expired", copy: "This one-time request expired without storing visitor data.", icon: AlertTriangle, tone: "text-[#8a642b] bg-[#f5ecdc]" },
}

export default function PartnerVerifyPage() {
  const [state, setState] = useState<VerifyState>("waiting")
  const [claims, setClaims] = useState<ClaimKey[]>(["kpass", "stay", "adult", "coupon"])
  const [purpose, setPurpose] = useState("Bukchon welcome benefit")
  const [couponRedeemed, setCouponRedeemed] = useState(false)
  const [requestVersion, setRequestVersion] = useState(1)
  const [copied, setCopied] = useState(false)

  const requestId = `VRF-BUK-0729-${String(1200 + requestVersion).padStart(4, "0")}`
  const qrValue = useMemo(() => `ktourid://present?request=${requestId}&env=sandbox&mode=simulated`, [requestId])
  const selectedClaims = CLAIMS.filter((claim) => claims.includes(claim.key))

  const regenerate = () => {
    setRequestVersion((value) => value + 1)
    setState("waiting")
    setCouponRedeemed(false)
  }

  const toggleClaim = (key: ClaimKey) => {
    setClaims((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])
  }

  const meta = STATE_META[state]
  const StateIcon = meta.icon

  return (
    <>
      <PageIntro
        eyebrow="Merchant verification"
        title="Verify eligibility, not identity."
        body="Build a one-time presentation request, receive only the policy answers you need, and redeem a benefit without exposing passport or resident-card details."
      >
        <EnvironmentLegend />
      </PageIntro>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(430px,1.08fr)]">
        <Panel
          eyebrow="01 · Request builder"
          title="What does this counter need to know?"
          action={<EnvironmentBadge kind="SANDBOX" />}
        >
          <div className="space-y-5 p-5 sm:p-6">
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Purpose</span>
              <select
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-3.5 text-[13px] font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              >
                <option>Bukchon welcome benefit</option>
                <option>Adult-only experience eligibility</option>
                <option>Tourist transit pass activation</option>
              </select>
            </label>

            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Requested claims</p>
                <span className="text-[11px] font-semibold text-success">{claims.length} selected</span>
              </div>
              <div className="mt-2.5 space-y-2">
                {CLAIMS.map((claim) => {
                  const selected = claims.includes(claim.key)
                  return (
                    <button
                      key={claim.key}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleClaim(claim.key)}
                      className={cn(
                        "flex min-h-14 w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
                        selected ? "border-primary/30 bg-primary/[0.045]" : "border-border bg-background",
                      )}
                    >
                      <span className={cn("grid h-5 w-5 flex-shrink-0 place-items-center rounded-md border", selected ? "border-primary bg-primary text-white" : "border-border bg-card")}>
                        {selected && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold">
                          {claim.label}
                          {claim.minimal && <span className="rounded-full bg-success-surface px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-success">minimal</span>}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-muted-foreground">{claim.detail}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="rounded-2xl bg-surface-2 p-3.5">
              <div className="flex items-center gap-2 text-[12px] font-bold">
                <ShieldCheck className="h-4 w-4 text-success" /> Data minimization check
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                {claims.includes("nationality")
                  ? "Nationality is optional and increases disclosure. Remove it unless the campaign policy needs it."
                  : "Good: this request can be fulfilled without name, birth date, document number, photo, or raw credential."}
              </p>
            </div>

            <button
              type="button"
              onClick={regenerate}
              disabled={claims.length === 0}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-gradient px-4 text-[13px] font-bold text-white disabled:opacity-40"
            >
              <ScanLine className="h-[18px] w-[18px]" /> Generate one-time request
            </button>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel
            eyebrow="02 · Visitor handoff"
            title="Presentation request"
            action={<EnvironmentBadge kind="SIMULATED" />}
          >
            <div className="grid gap-5 p-5 sm:grid-cols-[190px_minmax(0,1fr)] sm:p-6">
              <div className="relative mx-auto w-fit rounded-3xl border border-border bg-white p-3 shadow-sm sm:mx-0">
                <QRCode value={qrValue} size={164} className="border-0" />
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-primary/20 bg-[#f7e8e4] px-2 py-1 text-[9px] font-extrabold tracking-[0.1em] text-primary">
                  SIMULATED QR
                </span>
              </div>

              <div className="min-w-0">
                <div aria-live="polite" className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-extrabold", meta.tone)}>
                  <StateIcon className={cn("h-4 w-4", state === "submitted" && "animate-spin")} /> {meta.label}
                </div>
                <p className="mt-3 text-[14px] font-bold">{purpose}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{meta.copy}</p>

                <dl className="mt-4 grid grid-cols-[88px_1fr] gap-y-2 text-[11px]">
                  <dt className="text-muted-foreground">Request</dt><dd className="truncate font-mono font-semibold">{requestId}</dd>
                  <dt className="text-muted-foreground">Provider</dt><dd className="font-semibold">OpenDID VP · policy profile</dd>
                  <dt className="text-muted-foreground">Expires</dt><dd className="font-semibold">02:00 · one-time use</dd>
                  <dt className="text-muted-foreground">Callback</dt><dd className="font-semibold">Partner verifier</dd>
                </dl>

                <button
                  type="button"
                  onClick={() => { setCopied(true); window.setTimeout(() => setCopied(false), 1200) }}
                  className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-background px-3 text-[11px] font-bold"
                >
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Request link copied" : "Copy request link"}
                </button>
              </div>
            </div>

            <div className="border-t border-border bg-surface-2/60 px-5 py-4 sm:px-6">
              <div className="flex flex-wrap gap-2">
                {(["waiting", "submitted", "verified", "failed", "expired"] as VerifyState[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={state === item}
                    onClick={() => { setState(item); if (item !== "verified") setCouponRedeemed(false) }}
                    className={cn(
                      "min-h-9 rounded-full border px-3 text-[10px] font-extrabold uppercase tracking-[0.08em]",
                      state === item ? "border-ink bg-ink text-white" : "border-border bg-card text-muted-foreground",
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">Demo controls · each state is locally simulated and clearly labelled.</p>
            </div>
          </Panel>

          {state === "verified" ? (
            <VerifiedResult couponRedeemed={couponRedeemed} onRedeem={() => setCouponRedeemed(true)} selectedClaims={selectedClaims} />
          ) : (
            <StateFollowUp state={state} onAdvance={() => setState(state === "waiting" ? "submitted" : "verified")} onRegenerate={regenerate} />
          )}
        </div>
      </div>
    </>
  )
}

function StateFollowUp({ state, onAdvance, onRegenerate }: { state: VerifyState; onAdvance: () => void; onRegenerate: () => void }) {
  if (state === "failed" || state === "expired") {
    return (
      <Panel>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-[13px] font-extrabold">No personal data retained</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Create a new one-time request to safely retry this verification.</p>
          </div>
          <button type="button" onClick={onRegenerate} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-[12px] font-bold text-white">
            <RefreshCw className="h-4 w-4" /> Regenerate
          </button>
        </div>
      </Panel>
    )
  }

  return (
    <Panel>
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-[13px] font-extrabold">{state === "waiting" ? "Wallet handoff ready" : "VP received from wallet"}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {state === "waiting" ? "Use the demo control to simulate a visitor submission." : "Run signature, revocation, expiry, and policy checks."}
          </p>
        </div>
        <button type="button" onClick={onAdvance} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-[12px] font-bold text-white">
          {state === "waiting" ? "Simulate wallet submit" : "Verify VP"} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </Panel>
  )
}

function VerifiedResult({ couponRedeemed, onRedeem, selectedClaims }: { couponRedeemed: boolean; onRedeem: () => void; selectedClaims: typeof CLAIMS }) {
  return (
    <Panel eyebrow="03 · Policy result" title="Minimum disclosure result" action={<VerifiedMark />}>
      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_0.9fr] sm:p-6">
        <div>
          <div className="space-y-2">
            {selectedClaims.map((claim) => (
              <div key={claim.key} className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-surface-2 px-3.5 py-2">
                <span className="text-[11px] font-semibold text-muted-foreground">{claim.label}</span>
                <span className="inline-flex items-center gap-1 text-[12px] font-extrabold text-success"><CheckCircle2 className="h-4 w-4" /> PASS</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-success/20 bg-success-surface p-3">
            <EyeOff className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
            <p className="text-[10.5px] leading-relaxed text-success">
              Hidden by policy: name, date of birth, passport/residence number, portrait, address, and raw VP.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-ink p-4 text-white sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-gold"><Gift className="h-5 w-5" /></span>
            <EnvironmentBadge kind="SIMULATED" className="border-white/15 bg-white/10 text-white/75" />
          </div>
          <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/55">Eligible benefit</p>
          <h3 className="mt-1 text-[18px] font-extrabold">Bukchon Welcome · 10%</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-white/60">Single-use voucher · valid today · settlement-ready</p>
          <button
            type="button"
            onClick={onRedeem}
            disabled={couponRedeemed}
            className={cn(
              "mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-[12px] font-extrabold",
              couponRedeemed ? "bg-success text-white" : "bg-white text-ink",
            )}
          >
            {couponRedeemed ? <><TicketCheck className="h-4 w-4" /> Redeemed · CPN-0729-1842</> : <><FileCheck2 className="h-4 w-4" /> Redeem coupon</>}
          </button>
        </div>
      </div>
    </Panel>
  )
}
