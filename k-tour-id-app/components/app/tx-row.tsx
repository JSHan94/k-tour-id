"use client"

import { useState } from "react"
import { Sheet, SheetContent } from "@/components/app/sheet"
import { ExternalLink } from "lucide-react"
import { AppIcon, type IconKey } from "@/lib/icon-map"
import { BrandMark } from "@/components/app/brand"
import type { BrandKey } from "@/lib/brands"
import type { Transaction } from "@/lib/types"
import { formatKRW, formatUSD, formatWon, formatTxDate, shortHash } from "@/lib/format"
import { chainService } from "@/lib/services"
import { useLang } from "@/lib/i18n/lang-provider"
import { cn } from "@/lib/utils"

export function TxRow({ tx, usdRate, userType }: { tx: Transaction; usdRate: number; userType?: string | null }) {
  const { t, lang } = useLang()
  const [open, setOpen] = useState(false)
  const positive = tx.amountKRW > 0
  const ko = lang === "ko"
  const amountStr = ko ? formatWon(tx.amountKRW, { sign: true }) : formatKRW(tx.amountKRW, { sign: true })

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pressable flex w-full items-center gap-3 py-3 text-left"
      >
        {tx.brand ? (
          <BrandMark brand={tx.brand as BrandKey} size={40} />
        ) : (
          <span
            className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full text-foreground/75"
            style={{ backgroundColor: tx.iconBg }}
          >
            <AppIcon name={tx.icon as IconKey} className="h-[18px] w-[18px]" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-foreground">{tx.merchant}</p>
          <p className="text-[11px] text-muted-foreground">{formatTxDate(tx.date)}</p>
        </div>
        <div className="text-right">
          <p className={cn("tabular text-[14px] font-bold", positive ? "text-success" : "text-foreground")}>{amountStr}</p>
          <span className="text-[10px] font-semibold text-primary">SIMULATED EVENT</span>
        </div>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent title={t(`evt.${tx.chainEvent}`)}>
          <div className="space-y-3 text-[13px]">
            <Row label={t("pass.holder")} value={tx.merchant} />
            <Row
              label="Amount"
              value={`${ko ? formatWon(tx.amountKRW, { sign: true }) : formatKRW(tx.amountKRW, { sign: true })}${userType !== "korean" && !ko ? `  ·  ${formatUSD(tx.amountKRW, usdRate, { sign: true })}` : ""}`}
              mono
            />
            <Row label={t("pass.issued")} value={formatTxDate(tx.date)} />
            <Row label="Tx hash" value={shortHash(tx.txHash)} mono />
            <a
              href={chainService.explorerUrl(tx.txHash)}
              className="pressable flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2.5 text-[12px]"
            >
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <ExternalLink className="h-3.5 w-3.5 text-primary" /> {t("common.verifyOmnione")}
              </span>
              <span className="text-[11px] text-muted-foreground">evidence ›</span>
            </a>
            <p className="text-[11px] leading-relaxed text-muted-foreground">Simulation receipt only. No live OmniOne transaction was created.</p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium text-foreground", mono && "tabular font-mono text-[12px]")}>{value}</span>
    </div>
  )
}
