"use client"

import type React from "react"
import { Bus, ShoppingBag, Bike, CalendarCheck, Gift } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatManwon, formatUSD, formatWon, shortDid } from "@/lib/format"
import { useCountUp } from "@/lib/use-count-up"
import { useLang } from "@/lib/i18n/lang-provider"
import { Seal } from "@/components/app/seal"
import type { Identity, KPassCapsule, ServiceKey, UserType, Wallet } from "@/lib/types"

function Sparkline({ points, className }: { points: number[]; className?: string }) {
  const w = 120
  const h = 30
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const step = w / (points.length - 1)
  const d = points.map((p, i) => `${(i * step).toFixed(1)},${(h - ((p - min) / range) * h).toFixed(1)}`).join(" ")
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} preserveAspectRatio="none" aria-hidden>
      <polyline points={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export interface WalletDetail {
  budgetKRW: number
  spentKRW: number
  series: number[]
}

export function WalletCard({
  wallet,
  userType,
  label,
  detail,
  children,
  className,
}: {
  wallet: Wallet
  userType?: UserType | null
  label?: string
  detail?: WalletDetail
  children?: React.ReactNode
  className?: string
}) {
  const { t, lang } = useLang()
  const balance = useCountUp(wallet.balanceKRW)
  const ko = lang === "ko"
  const remainingPct = detail ? Math.max(0, Math.round(((detail.budgetKRW - detail.spentKRW) / detail.budgetKRW) * 100)) : 0

  return (
    <div className={cn("card-ink relative overflow-hidden rounded-3xl p-5 text-white", className)}>
      <div className="relative">
        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/55">
          <span className="inline-block h-3.5 w-3.5 rounded-[28%] bg-[var(--seal)]" />
          {label ?? t("wallet.label")}
        </div>

        {/* hero figure — 만원 in Korean, ₩ in English */}
        {ko ? (
          <>
            <p className="tabular mt-3 text-[40px] font-extrabold leading-none tracking-tight">{formatManwon(balance)}</p>
            <p className="tabular mt-2 text-[13px] text-white/55">{formatWon(wallet.balanceKRW)}</p>
          </>
        ) : (
          <>
            <p className="tabular mt-3 text-[38px] font-extrabold leading-none tracking-tight">
              ₩{balance.toLocaleString("en-US")}
            </p>
            <p className="tabular mt-2 text-[13px] text-white/55">≈ {formatUSD(wallet.balanceKRW, wallet.usdRate)} USD</p>
          </>
        )}

        {detail && (
          <div className="mt-4 space-y-2.5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-white/45">{t("wallet.tripSpent")}</p>
                <p className="tabular text-[13px] font-semibold text-white/85">−{ko ? formatWon(detail.spentKRW) : `₩${detail.spentKRW.toLocaleString("en-US")}`}</p>
              </div>
              <span className="text-gold tabular text-[12px] font-semibold">{remainingPct}% {t("wallet.budgetLeft")}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/12">
              <div className="h-full rounded-full bg-[var(--gold)]" style={{ width: `${remainingPct}%` }} />
            </div>
            <Sparkline points={detail.series} className="mt-1 h-8 w-full text-white/35" />
          </div>
        )}

        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  )
}

const SERVICE_META: Record<ServiceKey, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  transport: { label: "Transport", icon: Bus },
  shopping: { label: "Shopping", icon: ShoppingBag },
  delivery: { label: "Delivery", icon: Bike },
  reservation: { label: "Reservation", icon: CalendarCheck },
  benefit: { label: "Benefits", icon: Gift },
}

const USER_TYPE_LABEL: Record<KPassCapsule["userType"], string> = {
  korean: "Korean Resident",
  foreigner: "Foreign Visitor",
  "long-term": "Long-stay Resident",
}

function formatPassDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`
}

/** K-Pass Capsule — 단청 navy + 금박 foil credential, stamped with a 도장 seal. */
export function KPassCard({
  capsule,
  identity,
  stamp = false,
  className,
}: {
  capsule: KPassCapsule
  identity?: Identity | null
  stamp?: boolean
  className?: string
}) {
  const { t } = useLang()
  return (
    <div className={cn("card-credential relative overflow-hidden rounded-3xl p-5 text-white", className)}>
      {/* dojang seal stamped on the document */}
      <Seal size={56} stamp={stamp} className="absolute right-4 top-4 opacity-95" />

      <div className="relative">
        <div>
          <p className="text-gold text-[11px] font-medium uppercase tracking-[0.16em]">K-Tour ID</p>
          <p className="mt-0.5 text-[13px] text-white/80">{t("pass.subtitle")}</p>
        </div>

        <div className="mt-6 flex items-center gap-3">
          {identity?.photoUrl ? (
            <img
              src={identity.photoUrl}
              alt={capsule.holderName}
              className="h-11 w-11 rounded-full object-cover ring-2 ring-[var(--gold)]/70"
            />
          ) : (
            <span className="text-[22px] leading-none">{identity?.nationalityFlag ?? "🪪"}</span>
          )}
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate text-[19px] font-bold leading-tight">
              {capsule.holderName}
              {identity?.photoUrl && identity?.nationalityFlag && (
                <span className="text-[14px]">{identity.nationalityFlag}</span>
              )}
            </p>
            <p className="text-[12px] text-white/65">{USER_TYPE_LABEL[capsule.userType]}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-y-3 text-[12px]">
          <Field label={t("pass.stayPeriod")} value={capsule.stayPeriod} />
          <Field label={t("pass.paymentLimit")} value={formatManwon(capsule.paymentLimitKRW)} />
          <Field label={t("pass.trustLevel")} value={capsule.trustLevel} className="capitalize" />
          <Field label={t("pass.validUntil")} value={formatPassDate(capsule.expiresAt)} />
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {capsule.services.map((s) => {
            const Icon = SERVICE_META[s].icon
            return (
              <span key={s} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[10px] font-medium ring-1 ring-white/15">
                <Icon className="h-3 w-3" />
                {SERVICE_META[s].label}
              </span>
            )
          })}
        </div>

        <div className="mt-5 flex items-center justify-between gap-2 border-t border-white/12 pt-3 text-[10px] text-white/55">
          <span className="inline-flex min-w-0 items-center gap-1 font-mono">
            <span className="truncate">{shortDid(capsule.did)}</span>
          </span>
          <span className="flex-shrink-0">{t("common.issuedBy")}</span>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <p className="text-gold text-[10px] uppercase tracking-wide opacity-80">{label}</p>
      <p className={cn("tabular font-semibold", className)}>{value}</p>
    </div>
  )
}
