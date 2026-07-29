"use client"

import { useRouter } from "next/navigation"
import { Car, HeartPulse, Sparkles, Star, ChevronRight, MapPin, BadgeCheck } from "lucide-react"
import type { QuickAction } from "@/lib/mock-data"
import type { ServiceItem } from "@/lib/types"
import { useLang } from "@/lib/i18n/lang-provider"
import { formatWon } from "@/lib/format"
import { Seal } from "@/components/app/seal"
import { BrandMark } from "@/components/app/brand"
import { partnerToBrand } from "@/lib/brands"
import { cn } from "@/lib/utils"

function QuickActionGlyph({ iconKey, className }: { iconKey: QuickAction["iconKey"]; className?: string }) {
  if (iconKey === "topup") return <span className={cn("text-[18px] font-bold leading-none", className)}>₩</span>
  if (iconKey === "mobility") return <Car className={className} />
  if (iconKey === "medical") return <HeartPulse className={className} />
  return <Sparkles className={className} />
}

export function QuickActionTile({ action, onClick }: { action: QuickAction; onClick?: () => void }) {
  const router = useRouter()
  const { t } = useLang()
  const handle = () => {
    if (onClick) onClick()
    else if (action.href) router.push(action.href)
  }
  return (
    <button type="button" onClick={handle} className="pressable flex flex-col items-center gap-2">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-primary ring-1 ring-border">
        <QuickActionGlyph iconKey={action.iconKey} className="h-[22px] w-[22px]" />
      </span>
      <span className="text-[11px] font-medium text-muted-foreground">{t(`qa.${action.key}`)}</span>
    </button>
  )
}

/** Trust strip — dojang seal + verification line (replaces the presale banner). */
export function VerifiedStrip({ onClick }: { onClick?: () => void }) {
  const { t } = useLang()
  return (
    <button
      type="button"
      onClick={onClick}
      className="pressable flex w-full items-center gap-3 rounded-2xl border border-border bg-surface-2 p-3 text-left"
    >
      <Seal size={36} className="flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="inline-flex items-center gap-1 text-[13px] font-semibold text-foreground">
          <BadgeCheck className="h-3.5 w-3.5 text-primary" /> {t("home.verifiedStrip.title")}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">{t("home.verifiedStrip.sub")}</p>
      </div>
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
    </button>
  )
}

export function ServiceCard({ item, onClick }: { item: ServiceItem; onClick?: () => void }) {
  const { lang } = useLang()
  const price = lang === "ko" ? formatWon(item.priceKRW) : `₩${item.priceKRW.toLocaleString("en-US")}`
  const brandKey = partnerToBrand(item.partner)
  return (
    <button
      type="button"
      onClick={onClick}
      className="pressable w-full overflow-hidden rounded-2xl bg-card text-left ring-1 ring-border"
    >
      <div className="relative">
        <img src={item.image || "/placeholder.svg"} alt={item.name} loading="lazy" decoding="async" className="h-24 w-full object-cover" />
        {brandKey && (
          <span className="absolute left-2 top-2 shadow-sm">
            <BrandMark brand={brandKey} size={24} />
          </span>
        )}
        <span className="absolute right-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-ink/70 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
          <Star className="h-2.5 w-2.5 fill-[var(--gold)] text-[var(--gold)]" />
          {item.rating}
        </span>
      </div>
      <div className="p-3">
        <h3 className="truncate text-[13px] font-semibold text-foreground">{item.name}</h3>
        <p className="mt-0.5 flex items-center gap-0.5 truncate text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3 flex-shrink-0" /> {item.location}
        </p>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="tabular text-[13px] font-bold text-foreground">{price}</span>
          <span className="text-[11px] text-muted-foreground">{item.etaLabel}</span>
        </div>
      </div>
    </button>
  )
}
