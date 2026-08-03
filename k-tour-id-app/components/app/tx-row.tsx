"use client"

import { useState } from "react"
import { Sheet, SheetContent } from "@/components/app/sheet"
import { Check } from "lucide-react"
import { AppIcon, type IconKey } from "@/lib/icon-map"
import { BrandMark } from "@/components/app/brand"
import type { BrandKey } from "@/lib/brands"
import type { Transaction } from "@/lib/types"
import { formatDateTime, formatKRW, formatUSD, formatWon } from "@/lib/format"
import { useLang } from "@/lib/i18n/lang-provider"
import { cn } from "@/lib/utils"

export function TxRow({ tx, usdRate, userType }: { tx: Transaction; usdRate: number; userType?: string | null }) {
  const { lang } = useLang()
  const [open, setOpen] = useState(false)
  const positive = tx.amountKRW > 0
  const ko = lang === "ko"
  const refunded = tx.id.endsWith("-refund")
  const merchantName = localizedMerchant(tx.merchant.replace(" · demo merchant", ""), ko)
  const merchant = refunded ? `${merchantName} · ${ko ? "환불" : "Refund"}` : merchantName
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
          <p className="break-words text-[14px] font-semibold leading-snug text-foreground">{merchant}</p>
          <p className="text-[12px] text-muted-foreground">{formatDateTime(tx.date, lang)}</p>
        </div>
        <div className="text-right">
          <p className={cn("tabular text-[14px] font-bold", positive ? "text-success" : "text-foreground")}>{amountStr}</p>
          <span className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-semibold text-success"><Check className="h-3.5 w-3.5" /> {ko ? "완료" : "Completed"}</span>
        </div>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent title={ko ? "거래 상세" : "Transaction details"}>
          <div className="space-y-4 text-[14px]">
            <div className="flex min-h-12 items-center gap-2 rounded-xl bg-success-surface px-3 text-[13px] font-bold text-[#46603f]">
              <Check className="h-4 w-4" /> {ko ? "거래가 완료됐어요" : "Transaction completed"}
            </div>
            <Row label={ko ? "이용처" : "Merchant"} value={merchant} />
            <Row
              label={ko ? "금액" : "Amount"}
              value={`${ko ? formatWon(tx.amountKRW, { sign: true }) : formatKRW(tx.amountKRW, { sign: true })}${userType !== "korean" && !ko ? `  ·  ${formatUSD(tx.amountKRW, usdRate, { sign: true })}` : ""}`}
              mono
            />
            <Row label={ko ? "일시" : "Date"} value={formatDateTime(tx.date, lang)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function localizedMerchant(merchant: string, ko: boolean): string {
  const copy: Record<string, { ko: string; en: string }> = {
    "Top up": { ko: "여행 잔액 충전", en: "Travel balance top-up" },
    "Travel balance → return-trip voucher": { ko: "여행 잔액 → 재방문 바우처", en: "Travel balance → return-trip voucher" },
    "Return-trip voucher refund": { ko: "재방문 바우처 전환 취소", en: "Return-trip voucher return" },
    "한강 치맥 비용 나누기": { ko: "한강 치맥 비용 나누기", en: "Hangang meetup cost split" },
  }
  return copy[merchant]?.[ko ? "ko" : "en"] ?? merchant
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium text-foreground", mono && "tabular font-mono text-[12px]")}>{value}</span>
    </div>
  )
}
