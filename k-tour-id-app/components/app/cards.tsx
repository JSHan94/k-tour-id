"use client"

import type React from "react"
import { Bus, ShoppingBag, Bike, CalendarCheck, Gift, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatManwon, formatUSD, formatWon } from "@/lib/format"
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
    <div className={cn("card-ink relative overflow-hidden rounded-[28px] p-6 text-white", className)}>
      <div className="relative">
        <div className="flex items-center gap-1.5 text-[13px] font-medium text-white/65">
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--seal)]" />
          {label ?? t("wallet.label")}
        </div>

        {/* hero figure — 만원 in Korean, ₩ in English */}
        {ko ? (
          <>
            <p className="font-display tabular mt-4 text-[42px] font-semibold leading-none tracking-[-0.04em]">{formatManwon(balance)}</p>
            <p className="tabular mt-2 text-[13px] text-white/55">{formatWon(wallet.balanceKRW)}</p>
          </>
        ) : (
          <>
            <p className="font-display tabular mt-4 text-[40px] font-semibold leading-none tracking-[-0.04em]">
              ₩{balance.toLocaleString("en-US")}
            </p>
            <p className="tabular mt-2 text-[13px] text-white/55">≈ {formatUSD(wallet.balanceKRW, wallet.usdRate)} USD</p>
          </>
        )}

        {detail && (
          <div className="mt-4 space-y-2.5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[12px] uppercase tracking-wide text-white/60">{userType === "long-term" ? (ko ? "이번 달 사용" : "This month") : t("wallet.tripSpent")}</p>
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

const SERVICE_META: Record<ServiceKey, { ko: string; en: string; icon: React.ComponentType<{ className?: string }> }> = {
  transport: { ko: "교통", en: "Transport", icon: Bus },
  shopping: { ko: "쇼핑", en: "Shopping", icon: ShoppingBag },
  delivery: { ko: "배달", en: "Delivery", icon: Bike },
  reservation: { ko: "예약", en: "Reservation", icon: CalendarCheck },
  benefit: { ko: "혜택", en: "Benefits", icon: Gift },
}

const USER_TYPE_LABEL: Record<KPassCapsule["userType"], { ko: string; en: string }> = {
  korean: { ko: "국내 여행자", en: "Korean traveler" },
  foreigner: { ko: "외국인 여행자", en: "International visitor" },
  "long-term": { ko: "장기 체류 생활자", en: "Long-term resident" },
}

function formatPassDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`
}

function localizeStayPeriod(value: string, lang: "ko" | "en") {
  if (value === "Service trip window · 90 days") return lang === "ko" ? "90일" : "90 days"
  if (value === "Visitor service window · 90 days") return lang === "ko" ? "방문 이용 기간 · 90일" : "Visitor window · 90 days"
  if (value === "Resident service cycle · 12 months") return lang === "ko" ? "생활 서비스 · 12개월" : "Resident services · 12 months"
  if (value === "Domestic trip · 30 days") return lang === "ko" ? "국내 여행 · 30일" : "Domestic trip · 30 days"
  return value
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
  const { t, lang } = useLang()
  return (
    <div className={cn("card-credential relative overflow-hidden rounded-[28px] p-6 text-white", className)}>
      {/* dojang seal stamped on the document */}
      <Seal size={56} stamp={stamp} className="absolute right-4 top-4 opacity-95" />

      <div className="relative">
        <div>
          <p className="text-gold text-[13px] font-medium tracking-[0.08em]">K-Tour ID</p>
          <p className="mt-1 text-[13px] text-white/70">{t("pass.subtitle")}</p>
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
            <p className="font-display flex flex-wrap items-center gap-1.5 break-words text-[21px] font-semibold leading-tight">
              {capsule.holderName}
              {identity?.photoUrl && identity?.nationalityFlag && (
                <span className="text-[14px]">{identity.nationalityFlag}</span>
              )}
            </p>
            <p className="text-[12px] text-white/65">{USER_TYPE_LABEL[capsule.userType][lang]}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-y-3 text-[12px]">
          <Field label={t("pass.stayPeriod")} value={localizeStayPeriod(capsule.stayPeriod, lang)} />
          <Field label={t("pass.paymentLimit")} value={formatManwon(capsule.paymentLimitKRW)} />
          <Field label={t("pass.status")} value={capsule.status === "active" ? t("pass.statusActive") : capsule.status} className="capitalize" />
          <Field label={t("pass.validUntil")} value={formatPassDate(capsule.expiresAt)} />
        </div>

        <p className="mt-5 flex items-center gap-2 border-t border-white/12 pt-4 text-[12px] leading-relaxed text-white/60"><ShieldCheck className="h-4 w-4 text-gold" /> {t("common.issuedBy")}</p>
      </div>
    </div>
  )
}

function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <p className="text-gold text-[12px] uppercase tracking-wide opacity-90">{label}</p>
      <p className={cn("tabular font-semibold", className)}>{value}</p>
    </div>
  )
}
