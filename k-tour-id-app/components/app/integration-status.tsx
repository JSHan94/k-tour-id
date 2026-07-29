"use client"

import { FlaskConical, Radio, ShieldCheck } from "lucide-react"
import type { IntegrationMode } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useLang } from "@/lib/i18n/lang-provider"

export const APP_INTEGRATION_MODE: IntegrationMode =
  process.env.NEXT_PUBLIC_INTEGRATION_MODE === "live"
    ? "live"
    : process.env.NEXT_PUBLIC_INTEGRATION_MODE === "sandbox"
      ? "sandbox"
      : "simulated"

const MODE_META: Record<IntegrationMode, { label: string; detail: string; tone: string }> = {
  live: {
    label: "LIVE",
    detail: "Production response",
    tone: "bg-success-surface text-success ring-success/20",
  },
  sandbox: {
    label: "SANDBOX",
    detail: "Test credential response",
    tone: "bg-[#f6ecd6] text-[#7b5b20] ring-[#b88a3d]/25",
  },
  simulated: {
    label: "SIMULATION",
    detail: "Mock response · no real identity or funds",
    tone: "bg-primary/8 text-primary ring-primary/20",
  },
}

export function IntegrationModeBadge({ mode = APP_INTEGRATION_MODE, compact = false }: { mode?: IntegrationMode; compact?: boolean }) {
  const meta = MODE_META[mode]
  const Icon = mode === "live" ? Radio : mode === "sandbox" ? ShieldCheck : FlaskConical
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 font-bold tracking-[0.08em] ring-1", compact ? "text-[9px]" : "text-[10px]", meta.tone)}>
      <Icon className="h-3 w-3" /> {meta.label}
    </span>
  )
}

export function SimulationStrip() {
  const { lang } = useLang()
  if (APP_INTEGRATION_MODE !== "simulated") return null
  return (
    <div className="mx-4 mb-1 flex min-h-8 items-center justify-between gap-2 rounded-xl bg-primary/7 px-3 py-1.5 ring-1 ring-primary/15">
      <span className="text-[10px] font-semibold text-primary">{lang === "ko" ? "시연용 목업 · 실제 신분증·자금 없음" : "Demo mock · no real identity or funds"}</span>
      <IntegrationModeBadge compact />
    </div>
  )
}

export function IntegrationEvidenceCard({
  title,
  provider,
  requestId,
  timestamp,
  payloadHash,
  mode = APP_INTEGRATION_MODE,
}: {
  title: string
  provider: string
  requestId: string
  timestamp: string
  payloadHash: string
  mode?: IntegrationMode
}) {
  const meta = MODE_META[mode]
  return (
    <div className="rounded-2xl bg-ink p-4 text-white shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gold">Integration evidence</p>
          <h3 className="mt-1 text-[15px] font-bold">{title}</h3>
        </div>
        <IntegrationModeBadge mode={mode} compact />
      </div>
      <dl className="mt-4 space-y-2 border-t border-white/10 pt-3 text-[11px]">
        <EvidenceRow label="Provider" value={provider} />
        <EvidenceRow label="Request" value={requestId} mono />
        <EvidenceRow label="Timestamp" value={timestamp} />
        <EvidenceRow label="Payload hash" value={`${payloadHash.slice(0, 14)}…${payloadHash.slice(-8)}`} mono />
      </dl>
      <p className="mt-3 rounded-xl bg-white/7 px-3 py-2 text-[10px] leading-relaxed text-white/60">{meta.detail}. Personal data is never included in this evidence payload.</p>
    </div>
  )
}

function EvidenceRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-white/45">{label}</dt>
      <dd className={cn("max-w-[68%] break-all text-right text-white/85", mono && "font-mono text-[10px]")}>{value}</dd>
    </div>
  )
}
