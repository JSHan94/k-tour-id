"use client"

import { useEffect, useRef, useState } from "react"
import { Sheet, SheetContent } from "@/components/app/sheet"
import { QRCode } from "@/components/qr-code"
import { Check, CreditCard, Landmark, Loader2, ShieldCheck } from "lucide-react"
import { BrandMark } from "@/components/app/brand"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import { formatKRW, formatUSD, formatWon } from "@/lib/format"
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
  const { t, lang } = useLang()
  const addr = session.wallet.address
  const [copied, setCopied] = useState(false)
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(addr)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title={lang === "ko" ? "송금받기 QR" : "Receive QR"}>
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-border">
            <QRCode value={addr} size={150} className="!border-0" ariaLabel={t("modal.receive")} />
          </div>
          <p className="max-w-[280px] text-center text-[13px] leading-relaxed text-muted-foreground">{t("modal.receiveSub")}</p>
          <button type="button" onClick={copyLink} className="pressable flex min-h-11 items-center justify-center rounded-xl border border-border bg-card px-4 text-[13px] font-bold text-foreground">
            {copied ? (lang === "ko" ? "지갑 주소를 복사했어요" : "Wallet address copied") : (lang === "ko" ? "지갑 주소 복사" : "Copy wallet address")}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

const TOPUP_AMOUNTS = [50_000, 100_000, 300_000]
type FundingSource = "kakaopay" | "card" | "bank"

export function TopUpModal({ open, onOpenChange, onComplete, minimumAmountKRW = 0 }: { open: boolean; onOpenChange: (v: boolean) => void; onComplete?: () => void; minimumAmountKRW?: number }) {
  const { topUp } = useApp()
  const { t, lang } = useLang()
  const [amount, setAmount] = useState(TOPUP_AMOUNTS[1])
  const [source, setSource] = useState<FundingSource>("kakaopay")
  const [phase, setPhase] = useState<"choose" | "processing" | "done" | "error">("choose")
  const busy = useRef(false)
  const minimumRounded = Math.ceil(minimumAmountKRW / 10_000) * 10_000
  const availableAmounts = Array.from(new Set([minimumRounded, ...TOPUP_AMOUNTS])).filter((value) => value > 0 && value >= minimumAmountKRW).sort((a, b) => a - b).slice(0, 3)

  useEffect(() => {
    if (!open || phase !== "choose") return
    const rounded = Math.ceil(minimumAmountKRW / 10_000) * 10_000
    const choices = Array.from(new Set([rounded, ...TOPUP_AMOUNTS])).filter((value) => value > 0 && value >= minimumAmountKRW).sort((a, b) => a - b)
    setAmount(choices[0] ?? TOPUP_AMOUNTS[1])
  }, [minimumAmountKRW, open, phase])

  const confirm = async () => {
    if (busy.current) return
    busy.current = true
    setPhase("processing")
    try {
      const sourceLabel = source === "kakaopay" ? "KakaoPay preview" : source === "card" ? "Overseas card preview" : "Bank transfer preview"
      await topUp(amount, sourceLabel)
      setPhase("done")
      busy.current = false
    } catch {
      setPhase("error")
      busy.current = false
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v && busy.current) return
        onOpenChange(v)
        if (!v) setPhase("choose")
      }}
    >
      <SheetContent title={phase === "done" ? t("modal.topupDone") : t("modal.topup")}>
        {phase === "done" ? (
          <div role="status" aria-live="assertive" tabIndex={-1} className="flex flex-col items-center gap-2 py-3">
            <SuccessCheck />
            <p className="tabular text-[14px] font-semibold">+{lang === "ko" ? formatWon(amount) : formatKRW(amount)}</p>
            <p className="text-[12px] text-muted-foreground">{source === "kakaopay" ? "KakaoPay" : source === "card" ? (lang === "ko" ? "해외 발급 카드" : "Overseas card") : (lang === "ko" ? "국내 계좌이체" : "Korean bank transfer")}</p>
            <p className="mt-2 text-center text-[12px] leading-5 text-muted-foreground">{lang === "ko" ? "시나리오 여행 잔액에 반영했어요. 실제 출금은 일어나지 않았습니다." : "Added to the scenario travel balance. No real debit occurred."}</p>
            <button type="button" onClick={() => { setPhase("choose"); onOpenChange(false); onComplete?.() }} className="pressable mt-3 min-h-12 w-full rounded-xl bg-primary px-4 text-[14px] font-semibold text-white">{onComplete ? (lang === "ko" ? "서비스로 돌아가기" : "Return to service") : (lang === "ko" ? "완료" : "Done")}</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-[12px] font-semibold text-muted-foreground">{lang === "ko" ? "충전 수단" : "Funding source"}</p>
              <div className="space-y-2">
                <button type="button" aria-pressed={source === "kakaopay"} onClick={() => setSource("kakaopay")} className={`pressable flex min-h-14 w-full items-center gap-3 rounded-[14px] border px-3 text-left ${source === "kakaopay" ? "border-primary bg-primary/5" : "border-border"}`}><BrandMark brand="kakaopay" size={34} decorative /><span className="min-w-0 flex-1"><strong className="block text-[13px]">KakaoPay</strong><span className="mt-0.5 block text-[12px] text-muted-foreground">{lang === "ko" ? "간편결제 연결 예시" : "Payment connection preview"}</span></span>{source === "kakaopay" && <Check className="h-4 w-4 text-primary" />}</button>
                <div className="grid grid-cols-2 gap-2"><button type="button" aria-pressed={source === "card"} onClick={() => setSource("card")} className={`pressable flex min-h-14 items-center gap-2 rounded-[14px] border px-3 text-left ${source === "card" ? "border-primary bg-primary/5" : "border-border"}`}><CreditCard className="h-4 w-4" /><span className="text-[12px] font-semibold">{lang === "ko" ? "해외 카드" : "Overseas card"}</span></button><button type="button" aria-pressed={source === "bank"} onClick={() => setSource("bank")} className={`pressable flex min-h-14 items-center gap-2 rounded-[14px] border px-3 text-left ${source === "bank" ? "border-primary bg-primary/5" : "border-border"}`}><Landmark className="h-4 w-4" /><span className="text-[12px] font-semibold">{lang === "ko" ? "계좌이체" : "Bank transfer"}</span></button></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {availableAmounts.map((a) => (
                <button
                  key={a}
                  type="button"
                  aria-pressed={amount === a}
                  onClick={() => setAmount(a)}
                  className={`pressable rounded-xl border py-2.5 text-[13px] font-semibold tabular-nums ${
                    amount === a ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:bg-secondary"
                  }`}
                >
                  {lang === "ko" ? formatWon(a) : `₩${a.toLocaleString("en-US")}`}
                </button>
              ))}
            </div>
            {minimumAmountKRW > 0 && <p className="text-center text-[12px] font-medium text-primary">{lang === "ko" ? `이용을 계속하려면 최소 ₩${minimumAmountKRW.toLocaleString()} 충전이 필요해요.` : `Top up at least ₩${minimumAmountKRW.toLocaleString()} to continue.`}</p>}
            <div className="rounded-xl bg-secondary px-3 py-2.5 text-[12px]"><div className="flex justify-between"><span className="text-muted-foreground">{lang === "ko" ? "충전 반영액" : "Balance credit"}</span><strong className="tabular">₩{amount.toLocaleString()}</strong></div><div className="mt-1.5 flex justify-between"><span className="text-muted-foreground">{lang === "ko" ? "예상 수수료" : "Estimated fee"}</span><span>{lang === "ko" ? "실연동 시 확정" : "Confirmed at live integration"}</span></div></div>
            <p aria-live="polite" role={phase === "error" ? "alert" : "status"} className={`text-center text-[12px] ${phase === "error" ? "font-medium text-primary" : "text-muted-foreground"}`}>{phase === "error" ? (lang === "ko" ? "충전 요청을 완료하지 못했습니다. 다시 시도해 주세요." : "Top-up could not be completed. Please try again.") : t("modal.topupNote")}</p>
            <p className="flex items-start gap-2 rounded-xl bg-secondary px-3 py-2.5 text-[11px] leading-4 text-muted-foreground"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />{lang === "ko" ? "연동 전 제품 시나리오로 실제 출금·환전은 일어나지 않아요. 수수료는 실연동 계약 후 최종 고지합니다." : "This is a pre-integration product scenario. No real debit or exchange occurs; fees are confirmed after a live integration agreement."}</p>
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
  location?: string
  fulfilment?: string
  cancellation?: string
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
      const paid = await pay(item.merchant, item.amountKRW, item.category)
      if (!paid) {
        setPhase("error")
        busy.current = false
        return
      }
      setPhase("done")
      setTimeout(() => {
        busy.current = false
        setPhase("confirm")
        onOpenChange(false)
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
        if (!v && busy.current) return
        onOpenChange(v)
        if (!v) setPhase("confirm")
      }}
    >
      <SheetContent title={phase === "done" ? t("modal.payDone") : t("modal.pay")}>
        {phase === "done" ? (
          <div className="flex flex-col items-center gap-2 py-3 text-center">
            <SuccessCheck />
            <p className="text-[13px] font-semibold">{item?.merchant}</p>
            <p className="tabular text-[16px] font-extrabold">{lang === "ko" ? formatWon(amount) : `₩${amount.toLocaleString("en-US")}`}</p>
            <p className="inline-flex items-center gap-1 text-[13px] text-muted-foreground">{t("modal.loggedOmnione")}</p>
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
            <div className="grid grid-cols-[88px_1fr] gap-y-3 rounded-2xl border border-border bg-card p-3.5 text-[12px]">
              <span className="text-muted-foreground">{lang === "ko" ? "이용 방식" : "Fulfilment"}</span><span className="font-semibold">{item?.fulfilment ?? (lang === "ko" ? "결제 후 주문 확정" : "Order confirmed after payment")}</span>
              <span className="text-muted-foreground">{lang === "ko" ? "장소" : "Location"}</span><span className="font-semibold">{item?.location ?? (lang === "ko" ? "제휴 서비스" : "Partner service")}</span>
              <span className="text-muted-foreground">{lang === "ko" ? "취소·환불" : "Cancellation"}</span><span className="font-semibold">{item?.cancellation ?? (lang === "ko" ? "주문 확정 전 취소 가능" : "Can be cancelled before confirmation")}</span>
            </div>
            <p aria-live="polite" role={phase === "error" ? "alert" : "status"} className={`text-center text-[12px] ${phase === "error" ? "font-medium text-primary" : "text-muted-foreground"}`}>
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
