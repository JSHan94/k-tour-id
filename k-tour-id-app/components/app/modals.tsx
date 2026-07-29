"use client"

import { useRef, useState } from "react"
import { Sheet, SheetContent } from "@/components/app/sheet"
import { QRCode } from "@/components/qr-code"
import { Check, Loader2, ShieldCheck } from "lucide-react"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import { formatKRW, formatUSD, formatWon, shortAddress } from "@/lib/format"
import type { Transaction } from "@/lib/types"

function SuccessCheck() {
  return (
    <div className="grid place-items-center py-1">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-success-surface" style={{ animation: "pop-in 0.3s ease-out" }}>
        <Check className="h-6 w-6 text-success" />
      </span>
    </div>
  )
}

export function ReceiveModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { session } = useApp()
  const { t } = useLang()
  const addr = session.wallet.address
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title={t("modal.receive")}>
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-border">
            <QRCode value={addr} size={150} className="!border-0" />
          </div>
          <p className="font-mono text-[12px] text-muted-foreground">{shortAddress(addr)}</p>
          <p className="text-center text-[12px] text-muted-foreground">{t("modal.receiveSub")}</p>
        </div>
      </SheetContent>
    </Sheet>
  )
}

const TOPUP_AMOUNTS = [50_000, 100_000, 300_000]

export function TopUpModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { topUp } = useApp()
  const { t, lang } = useLang()
  const [amount, setAmount] = useState(TOPUP_AMOUNTS[1])
  const [phase, setPhase] = useState<"choose" | "processing" | "done" | "error">("choose")
  const busy = useRef(false)

  const confirm = async () => {
    if (busy.current) return
    busy.current = true
    setPhase("processing")
    try {
      await topUp(amount)
      setPhase("done")
      setTimeout(() => {
        onOpenChange(false)
        setPhase("choose")
        busy.current = false
      }, 1200)
    } catch {
      setPhase("error")
      busy.current = false
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) { setPhase("choose"); busy.current = false }
      }}
    >
      <SheetContent title={phase === "done" ? t("modal.topupDone") : t("modal.topup")}>
        {phase === "done" ? (
          <div className="flex flex-col items-center gap-2 py-3">
            <SuccessCheck />
            <p className="tabular text-[13px] font-semibold">+{lang === "ko" ? formatWon(amount) : formatKRW(amount)}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {TOPUP_AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAmount(a)}
                  className={`pressable rounded-xl border py-2.5 text-[13px] font-semibold tabular-nums ${
                    amount === a ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:bg-secondary"
                  }`}
                >
                  ₩{(a / 1000).toLocaleString()}k
                </button>
              ))}
            </div>
            <p className={`text-center text-[12px] ${phase === "error" ? "font-medium text-primary" : "text-muted-foreground"}`}>
              {phase === "error" ? (lang === "ko" ? "충전 요청을 완료하지 못했습니다. 다시 시도해 주세요." : "Top-up could not be completed. Please try again.") : t("modal.topupNote")}
            </p>
            <button
              type="button"
              onClick={confirm}
              disabled={phase === "processing"}
              className="bg-brand-gradient pressable flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-semibold text-white disabled:opacity-70"
            >
              {phase === "processing" && <Loader2 className="h-4 w-4 animate-spin" />}
              {phase === "processing" ? t("modal.processing") : t("modal.topupBtn", { x: `₩${amount.toLocaleString()}` })}
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export interface PayItem {
  merchant: string
  amountKRW: number
  category: Transaction["category"]
}

export function PayModal({
  open,
  onOpenChange,
  item,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  item: PayItem | null
}) {
  const { pay, session } = useApp()
  const { t, lang } = useLang()
  const [phase, setPhase] = useState<"confirm" | "processing" | "done" | "error">("confirm")
  const busy = useRef(false)

  const amount = item?.amountKRW ?? 0
  const showUsd = session.userType !== "korean" && lang !== "ko"
  const insufficient = amount > session.wallet.balanceKRW

  const confirm = async () => {
    if (!item || busy.current || insufficient) return
    busy.current = true
    setPhase("processing")
    try {
      await pay(item.merchant, item.amountKRW, item.category)
      setPhase("done")
      setTimeout(() => {
        onOpenChange(false)
        setPhase("confirm")
        busy.current = false
      }, 1400)
    } catch {
      setPhase("error")
      busy.current = false
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) { setPhase("confirm"); busy.current = false }
      }}
    >
      <SheetContent title={phase === "done" ? t("modal.payDone") : t("modal.pay")}>
        {phase === "done" ? (
          <div className="flex flex-col items-center gap-2 py-3 text-center">
            <SuccessCheck />
            <p className="text-[13px] font-semibold">{item?.merchant}</p>
            <p className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3 text-primary" /> {t("modal.loggedOmnione")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl bg-secondary p-4 text-center">
              <p className="text-[12px] text-muted-foreground">{item?.merchant}</p>
              <p className="tabular mt-1 text-[28px] font-extrabold tracking-tight text-foreground">
                {lang === "ko" ? formatWon(amount) : `₩${amount.toLocaleString("en-US")}`}
              </p>
              {showUsd && <p className="tabular text-[12px] text-muted-foreground">≈ {formatUSD(amount, session.wallet.usdRate)}</p>}
            </div>
            <p className={`text-center text-[12px] ${phase === "error" ? "font-medium text-primary" : "text-muted-foreground"}`}>
              {phase === "error" ? (lang === "ko" ? "결제 요청을 완료하지 못했습니다. 금액은 차감되지 않았습니다." : "Payment failed and no balance was deducted.") : insufficient ? (lang === "ko" ? "잔액이 부족해요" : "Insufficient balance") : t("modal.payNote")}
            </p>
            <button
              type="button"
              onClick={confirm}
              disabled={phase === "processing" || insufficient}
              className="bg-brand-gradient pressable flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-semibold text-white disabled:opacity-70"
            >
              {phase === "processing" && <Loader2 className="h-4 w-4 animate-spin" />}
              {phase === "processing" ? t("modal.authorizing") : t("modal.payBtn", { x: `₩${amount.toLocaleString()}` })}
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
