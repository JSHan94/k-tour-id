"use client"

import { useState } from "react"
import Link from "next/link"
import { QrCode, ArrowDownLeft, Gift, Plus, RefreshCcw, TicketCheck } from "lucide-react"
import { PhoneFrame, PageHeader, SectionTitle } from "@/components/app/shell"
import { WalletCard } from "@/components/app/cards"
import { BrandMark } from "@/components/app/brand"
import { TxRow } from "@/components/app/tx-row"
import { ReceiveModal, TopUpModal, PayModal, type PayItem } from "@/components/app/modals"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import { TRIP_BUDGET_KRW, TRIP_SPENT_KRW, DAILY_BALANCE_KRW } from "@/lib/mock-data"

const DEMO_PAY: PayItem = { merchant: "GS25 Convenience", amountKRW: 4_500, category: "shopping" }

export default function WalletPage() {
  const { session, transactions, vouchers, refundConvertedVoucher } = useApp()
  const { t, lang } = useLang()
  const [showReceive, setShowReceive] = useState(false)
  const [showTopUp, setShowTopUp] = useState(false)
  const [showPay, setShowPay] = useState(false)

  const actions = [
    { label: t("wallet.pay"), icon: QrCode, onClick: () => setShowPay(true) },
    { label: t("wallet.receive"), icon: ArrowDownLeft, onClick: () => setShowReceive(true) },
    { label: t("wallet.topup"), icon: Plus, onClick: () => setShowTopUp(true) },
  ]

  return (
    <PhoneFrame>
      <PageHeader title={t("wallet.title")} />

      <div className="space-y-6 px-5 pt-1">
        <WalletCard
          wallet={session.wallet}
          userType={session.userType}
          detail={{ budgetKRW: TRIP_BUDGET_KRW, spentKRW: TRIP_SPENT_KRW, series: DAILY_BALANCE_KRW }}
        >
          <div className="grid grid-cols-3 gap-2">
            {actions.map(({ label, icon: Icon, onClick }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                className="pressable flex flex-col items-center gap-1 rounded-2xl bg-white/10 py-2.5 text-[11px] font-medium text-white hover:bg-white/15"
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </WalletCard>

        <div>
          <SectionTitle>{lang === "ko" ? "바우처 지갑" : "Voucher wallet"}</SectionTitle>
          <div className="space-y-2">
            {vouchers.map((voucher) => (
              <div key={voucher.id} className="rounded-2xl bg-card p-4 ring-1 ring-border">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-secondary text-primary">{voucher.funding === "user-converted" ? <RefreshCcw className="h-5 w-5" /> : <Gift className="h-5 w-5" />}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><p className="truncate text-[13px] font-bold">{voucher.title}</p><span className="rounded-full bg-success-surface px-2 py-0.5 text-[8px] font-extrabold uppercase text-success">{voucher.status}</span></div>
                    <p className="mt-0.5 text-[10.5px] text-muted-foreground">{voucher.funding} · {voucher.redemption}</p>
                    <p className="mt-1 font-mono text-[9px] text-muted-foreground">{voucher.id}</p>
                  </div>
                  <p className="text-[14px] font-extrabold text-primary">₩{voucher.valueKRW.toLocaleString()}</p>
                </div>
                {voucher.funding === "user-converted" && voucher.status === "available" && (
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                    <p className="text-[10px] leading-relaxed text-muted-foreground">{lang === "ko" ? "미사용 상태에서만 데모 잔액으로 돌려받을 수 있어요." : "Return to demo balance only while unused."}</p>
                    <button type="button" onClick={() => refundConvertedVoucher(voucher.id)} className="pressable inline-flex min-h-9 flex-shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 text-[10px] font-bold"><TicketCheck className="h-3.5 w-3.5" /> {lang === "ko" ? "전환 취소" : "Return"}</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle
            action={
              <Link href="/pass" className="pressable text-[12px] font-medium text-primary">
                {t("wallet.chainLog")}
              </Link>
            }
          >
            {t("wallet.lastTx")}
          </SectionTitle>
          <div className="-mx-1">
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <TxRow key={tx.id} tx={tx} usdRate={session.wallet.usdRate} userType={session.userType} />
              ))
            ) : (
              <p className="px-1 py-6 text-center text-[13px] text-muted-foreground">No transactions yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-surface-2 p-4 ring-1 ring-border">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-foreground">T-Money</h3>
            <span className="rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-bold text-primary ring-1 ring-primary/15">CONCEPT</span>
          </div>
          <div className="flex items-center gap-3">
            <BrandMark brand="tmoney" size={40} ring={false} className="bg-card shadow-sm" />

            <div className="flex-1">
              <p className="text-[13px] font-semibold text-foreground">{t("tmoney.buySubway")}</p>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-card">
                <div className="h-full w-1/3 rounded-full bg-primary" />
              </div>
            </div>
            <span className="text-[12px] font-semibold text-foreground">3 Day</span>
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">{t("tmoney.demoNotice")}</p>
        </div>
      </div>

      <ReceiveModal open={showReceive} onOpenChange={setShowReceive} />
      <TopUpModal open={showTopUp} onOpenChange={setShowTopUp} />
      <PayModal open={showPay} onOpenChange={setShowPay} item={DEMO_PAY} />
    </PhoneFrame>
  )
}
