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

const MODE_META: Record<IntegrationMode, { label: { ko: string; en: string }; detail: { ko: string; en: string }; tone: string }> = {
  live: {
    label: { ko: "실연동", en: "LIVE" },
    detail: { ko: "운영 환경 응답", en: "Production response" },
    tone: "bg-success-surface text-success ring-success/20",
  },
  sandbox: {
    label: { ko: "테스트", en: "SANDBOX" },
    detail: { ko: "테스트 자격 응답", en: "Test credential response" },
    tone: "bg-[#f6ecd6] text-[#7b5b20] ring-[#b88a3d]/25",
  },
  simulated: {
    label: { ko: "목업", en: "PREVIEW" },
    detail: { ko: "제품 목업 응답", en: "Product preview response" },
    tone: "bg-primary/8 text-primary ring-primary/20",
  },
}

export function IntegrationModeBadge({ mode = APP_INTEGRATION_MODE, compact = false }: { mode?: IntegrationMode; compact?: boolean }) {
  const meta = MODE_META[mode]
  const { lang } = useLang()
  const Icon = mode === "live" ? Radio : mode === "sandbox" ? ShieldCheck : FlaskConical
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[12px] font-bold tracking-[0.05em] ring-1", meta.tone)}>
      <Icon className="h-3 w-3" /> {meta.label[lang]}
    </span>
  )
}

export function SimulationStrip() {
  const { lang } = useLang()
  if (APP_INTEGRATION_MODE !== "simulated") return null
  return (
    <div className="mx-4 mb-1 flex min-h-9 items-center justify-between gap-3 rounded-xl bg-primary/7 px-3 py-2 ring-1 ring-primary/15">
      <span className="min-w-0 flex-1 text-[12px] font-semibold leading-snug text-primary">
        {lang === "ko" ? "제품 미리보기" : "Product preview"}
      </span>
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
  const { lang } = useLang()
  const ko = lang === "ko"
  return (
    <div className="rounded-2xl bg-ink p-4 text-white shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold text-gold">{ko ? "연동 증거" : "Integration evidence"}</p>
          <h3 className="mt-1 text-[15px] font-bold">{title}</h3>
        </div>
        <IntegrationModeBadge mode={mode} compact />
      </div>
      <dl className="mt-4 space-y-2 border-t border-white/10 pt-3 text-[12px]">
        <EvidenceRow label={ko ? "제공자" : "Provider"} value={provider} />
        <EvidenceRow label={ko ? "요청" : "Request"} value={requestId} mono />
        <EvidenceRow label={ko ? "시각" : "Timestamp"} value={timestamp} />
        <EvidenceRow label={ko ? "데이터 해시" : "Payload hash"} value={`${payloadHash.slice(0, 14)}…${payloadHash.slice(-8)}`} mono />
      </dl>
      <p className="mt-3 rounded-xl bg-white/7 px-3 py-2 text-[12px] leading-relaxed text-white/72">{meta.detail[lang]}. {ko ? "이 증거 데이터에는 개인정보를 넣지 않아요." : "Personal data is never included in this evidence payload."}</p>
    </div>
  )
}

function EvidenceRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-white/60">{label}</dt>
      <dd className={cn("max-w-[68%] break-all text-right text-white/88", mono && "font-mono text-[12px]")}>{value}</dd>
    </div>
  )
}
