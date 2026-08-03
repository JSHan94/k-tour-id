"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, QrCode, ArrowDownLeft, Gift, Plus, RefreshCcw, TicketCheck } from "lucide-react"
import { PhoneFrame, LangToggle, SectionTitle } from "@/components/app/shell"
import { WalletCard } from "@/components/app/cards"
import { TxRow } from "@/components/app/tx-row"
import { ReceiveModal, TopUpModal, PayModal, type PayItem } from "@/components/app/modals"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import { DAILY_BALANCE_KRW, DEFAULT_SESSION, TRIP_BUDGET_KRW } from "@/lib/mock-data"
import type { Voucher } from "@/lib/types"
import { cn } from "@/lib/utils"
import { PERSONA_CONFIG } from "@/lib/catalog"
import { instantPassState } from "@/lib/commerce-policy"

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
  if (voucher.id === "voucher-resident-transit") return "서울 생활 교통 웰컴 혜택"
  if (voucher.id === "voucher-local-culture") return "지역 문화 주간 혜택"
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
      : voucher.applicableService === "transport"
        ? (ko ? "교통" : "Transport")
        : null
  if (ko) return [merchant, service, minimum ? `${minimum} 이상 결제 시` : null].filter(Boolean).join(" · ")
  return [merchant, service, minimum ? `Spend ${minimum} or more` : null].filter(Boolean).join(" · ")
}

export default function WalletPage() {
  const router = useRouter()
  const { session, transactions, vouchers, orders, refundConvertedVoucher, hydrated } = useApp()
  const { t, lang } = useLang()
  const [showReceive, setShowReceive] = useState(false)
  const [showTopUp, setShowTopUp] = useState(false)
  const [showPay, setShowPay] = useState(false)
  const [returnAfterTopUp, setReturnAfterTopUp] = useState("")
  const spentKRW = Math.max(0, transactions.filter((tx) => tx.category !== "topup").reduce((sum, tx) => sum - tx.amountKRW, 0))
  const showBudgetFixture = session.identity?.did === DEFAULT_SESSION.identity?.did

  useEffect(() => {
    if (hydrated && !session.onboarded) router.replace("/onboarding")
    const params = new URLSearchParams(window.location.search)
    const requestedReturn = params.get("returnTo")
    if (params.get("topup") === "1") setShowTopUp(true)
    if (requestedReturn?.startsWith("/explore/") || requestedReturn?.startsWith("/present")) setReturnAfterTopUp(requestedReturn)
  }, [hydrated, router, session.onboarded])
  if (!session.onboarded) return null
  const persona = PERSONA_CONFIG[session.userType ?? "foreigner"]

  const actions = [
    { label: lang === "ko" ? "데모 QR 결제" : "Demo QR pay", icon: QrCode, onClick: () => setShowPay(true) },
    { label: t("wallet.receive"), icon: ArrowDownLeft, onClick: () => setShowReceive(true) },
    { label: t("wallet.topup"), icon: Plus, onClick: () => setShowTopUp(true) },
  ]

  return (
    <PhoneFrame>
      <header className="safe-top flex items-center justify-between px-6 pb-5"><div><p className="text-[12px] font-semibold text-primary">IDENTITY · MONEY · BENEFITS</p><h1 className="font-display mt-1 text-[30px] font-semibold tracking-[-0.03em]">{t("wallet.title")}</h1></div><div className="flex items-center gap-1"><LangToggle /><Link href="/alerts" aria-label={lang === "ko" ? "알림" : "Alerts"} className="pressable grid h-11 w-11 place-items-center rounded-full bg-secondary"><Bell className="h-[18px] w-[18px]" /></Link></div></header>

      <div className="space-y-8 px-6">
        <WalletCard
          wallet={session.wallet}
          userType={session.userType}
          label={persona.balanceLabel[lang]}
          detail={showBudgetFixture ? { budgetKRW: TRIP_BUDGET_KRW, spentKRW, series: [...DAILY_BALANCE_KRW.slice(0, -1), session.wallet.balanceKRW] } : undefined}
          identity={session.identity}
          capsule={session.capsule}
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
                {voucher.itemId && (
                  <Link href={`/explore/${voucher.itemId}`} className="pressable mt-2 inline-flex min-h-10 items-center pl-11 text-[12px] font-semibold text-primary underline underline-offset-4">
                    {voucher.status === "available" ? (lang === "ko" ? "사용 가능한 상품 보기" : "View eligible item") : (lang === "ko" ? "상품 다시 보기" : "View item again")}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        {orders.length > 0 && (
          <div>
            <SectionTitle>{lang === "ko" ? "예약·이용 내역" : "Orders & passes"}</SectionTitle>
            <div className="divide-y divide-foreground/10 border-y border-foreground/10">
              {orders.map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`} className="pressable flex min-h-[76px] items-center justify-between gap-4 py-4">
                  <div className="min-w-0"><p className="truncate text-[14px] font-semibold">{lang === "ko" ? order.title : order.titleEn}</p><p className="mt-1 text-[12px] text-muted-foreground">{lang === "ko" ? order.optionLabel : order.optionLabelEn} · {orderStatusLabel(order, lang === "ko")}</p></div>
                  <p className="tabular flex-shrink-0 text-[13px] font-semibold">{order.status === "refunded" ? "+" : ""}₩{(order.status === "refunded" ? order.refundedKRW ?? order.paidKRW : order.paidKRW).toLocaleString()}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

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
      <TopUpModal open={showTopUp} onOpenChange={setShowTopUp} onComplete={() => { if (returnAfterTopUp) router.push(returnAfterTopUp) }} />
      <PayModal open={showPay} onOpenChange={setShowPay} item={DEMO_PAY} />
    </PhoneFrame>
  )
}

function orderStatusLabel(order: import("@/lib/types").CommerceOrder, ko: boolean) {
  if (order.status === "refunded") return ko ? "환불 완료" : "Refunded"
  const reached = Date.now() >= new Date(order.activationAt).getTime()
  if (order.fulfilment === "instant") {
    const passState = instantPassState(order)
    return passState === "expired" ? (ko ? "이용권 만료" : "Expired") : passState === "active" ? (ko ? "이용 중" : "Active") : (ko ? "개시 예정" : "Scheduled")
  }
  if (order.fulfilment === "delivery") return reached ? (ko ? "배송 완료" : "Delivered") : (ko ? "배송 준비" : "Preparing delivery")
  if (order.fulfilment === "pickup") return reached ? (ko ? "픽업 가능" : "Ready for pickup") : (ko ? "픽업 준비" : "Preparing pickup")
  return reached ? (ko ? "이용 시간 도착" : "Time to use") : (ko ? "예약 확정" : "Confirmed")
}
