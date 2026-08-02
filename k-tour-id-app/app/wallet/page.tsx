"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { QrCode, ArrowDownLeft, Gift, Plus, RefreshCcw, TicketCheck } from "lucide-react"
import { PhoneFrame, PageHeader, SectionTitle } from "@/components/app/shell"
import { WalletCard } from "@/components/app/cards"
import { TxRow } from "@/components/app/tx-row"
import { ReceiveModal, TopUpModal, PayModal, type PayItem } from "@/components/app/modals"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import { TRIP_BUDGET_KRW, DAILY_BALANCE_KRW } from "@/lib/mock-data"
import type { Voucher } from "@/lib/types"
import { cn } from "@/lib/utils"

const DEMO_PAY: PayItem = { merchant: "GS25 Convenience", amountKRW: 4_500, category: "shopping" }

const STATUS_LABEL = {
  available: { ko: "사용 가능", en: "Available" },
  reserved: { ko: "사용 중", en: "In use" },
  redeemed: { ko: "사용 완료", en: "Used" },
  expired: { ko: "기간 만료", en: "Expired" },
} as const

function voucherTitle(voucher: Voucher, ko: boolean) {
  if (!ko) return voucher.title.replace(" · demo merchant", "")
  if (voucher.id === "voucher-bukchon-10") return "북촌 공예 체험 10% 할인"
  if (voucher.id === "voucher-welcome-10") return "K-Tour 웰컴 쿠폰"
  return voucher.title
}

function voucherRestriction(voucher: Voucher, ko: boolean) {
  if (voucher.funding === "user-converted") {
    return ko ? "사용 전에는 여행 잔액으로 다시 돌릴 수 있어요" : "Return it to your travel balance before use"
  }
  const merchant = voucher.applicableMerchant?.replace(" · demo merchant", "").replace(" demo network", "")
  const minimum = voucher.minimumSpendKRW ? `₩${voucher.minimumSpendKRW.toLocaleString()}` : null
  const service = voucher.applicableService === "reservation"
    ? (ko ? "예약 상품" : "Reservations")
    : voucher.applicableService === "shopping"
      ? (ko ? "쇼핑" : "Shopping")
      : null
  if (ko) return [merchant, service, minimum ? `${minimum} 이상 결제 시` : null].filter(Boolean).join(" · ")
  return [merchant, service, minimum ? `Spend ${minimum} or more` : null].filter(Boolean).join(" · ")
}

export default function WalletPage() {
  const router = useRouter()
  const { session, transactions, vouchers, refundConvertedVoucher, hydrated } = useApp()
  const { t, lang } = useLang()
  const [showReceive, setShowReceive] = useState(false)
  const [showTopUp, setShowTopUp] = useState(false)
  const [showPay, setShowPay] = useState(false)
  const spentKRW = transactions.filter((tx) => tx.amountKRW < 0).reduce((sum, tx) => sum + Math.abs(tx.amountKRW), 0)

  useEffect(() => {
    if (hydrated && !session.onboarded) router.replace("/onboarding")
  }, [hydrated, router, session.onboarded])
  if (!session.onboarded) return null

  const actions = [
    { label: t("wallet.pay"), icon: QrCode, onClick: () => setShowPay(true) },
    { label: t("wallet.receive"), icon: ArrowDownLeft, onClick: () => setShowReceive(true) },
    { label: t("wallet.topup"), icon: Plus, onClick: () => setShowTopUp(true) },
  ]

  return (
    <PhoneFrame>
      <PageHeader title={t("wallet.title")} />

      <div className="space-y-8 px-6 pt-2">
        <WalletCard
          wallet={session.wallet}
          userType={session.userType}
          label={lang === "ko" ? "여행 잔액" : "Travel balance"}
          detail={{ budgetKRW: TRIP_BUDGET_KRW, spentKRW, series: DAILY_BALANCE_KRW }}
        >
          <div className="grid grid-cols-3 divide-x divide-white/12 border-t border-white/12 pt-3">
            {actions.map(({ label, icon: Icon, onClick }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                className="pressable flex min-h-14 flex-col items-center justify-center gap-1 py-2.5 text-[12px] font-medium text-white/82"
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </WalletCard>

        <div>
          <SectionTitle>{lang === "ko" ? "바우처 지갑" : "Voucher wallet"}</SectionTitle>
          <div className="divide-y divide-foreground/10 border-y border-foreground/10">
            {vouchers.map((voucher) => (
              <div key={voucher.id} className="py-5">
                <div className="flex items-start gap-3">
                  <span className="grid h-8 w-8 flex-shrink-0 place-items-center text-primary">{voucher.funding === "user-converted" ? <RefreshCcw className="h-5 w-5" /> : <Gift className="h-5 w-5" />}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-bold leading-snug">{voucherTitle(voucher, lang === "ko")}</p>
                      <span className={cn(
                        "rounded-full px-2 py-1 text-[12px] font-semibold",
                        voucher.status === "available" ? "bg-success-surface text-[#46603f]" : voucher.status === "expired" ? "bg-primary/8 text-primary" : "bg-secondary text-muted-foreground",
                      )}>
                        {STATUS_LABEL[voucher.status][lang === "ko" ? "ko" : "en"]}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">{voucherRestriction(voucher, lang === "ko")}</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      {lang === "ko" ? "사용 기한" : "Valid until"} · {new Intl.DateTimeFormat(lang === "ko" ? "ko-KR" : "en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date(voucher.expiresAt))}
                    </p>
                  </div>
                  <p className="text-[14px] font-extrabold text-primary">₩{voucher.valueKRW.toLocaleString()}</p>
                </div>
                {voucher.funding === "user-converted" && voucher.status === "available" && (
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-foreground/10 pt-3">
                    <p className="text-[12px] leading-relaxed text-muted-foreground">{lang === "ko" ? "사용하지 않았다면 전액을 여행 잔액으로 돌려받을 수 있어요." : "If unused, the full value can be returned to your travel balance."}</p>
                    <button type="button" onClick={() => refundConvertedVoucher(voucher.id)} className="pressable inline-flex min-h-11 flex-shrink-0 items-center gap-1.5 px-2 text-[12px] font-semibold underline underline-offset-4"><TicketCheck className="h-4 w-4" /> {lang === "ko" ? "전환 취소" : "Return"}</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>{t("wallet.lastTx")}</SectionTitle>
          <div className="-mx-1">
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <TxRow key={tx.id} tx={tx} usdRate={session.wallet.usdRate} userType={session.userType} />
              ))
            ) : (
              <p className="px-1 py-6 text-center text-[13px] text-muted-foreground">{lang === "ko" ? "아직 거래내역이 없어요." : "No transactions yet."}</p>
            )}
          </div>
        </div>

      </div>

      <ReceiveModal open={showReceive} onOpenChange={setShowReceive} />
      <TopUpModal open={showTopUp} onOpenChange={setShowTopUp} />
      <PayModal open={showPay} onOpenChange={setShowPay} item={DEMO_PAY} />
    </PhoneFrame>
  )
}
