"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { BusFront, Check, ChevronDown, Loader2, PackageCheck, QrCode, RefreshCcw, ShoppingBag, Wallet } from "lucide-react"
import { PageHeader, PhoneFrame } from "@/components/app/shell"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import type { CommerceEntryContext, CommerceOrder } from "@/lib/types"
import { cn } from "@/lib/utils"
import { instantPassState } from "@/lib/commerce-policy"
import { QRCode } from "@/components/qr-code"

export default function OrderReceiptPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { orders, session, vouchers, refundCommerceOrder, hydrated } = useApp()
  const { lang } = useLang()
  const ko = lang === "ko"
  const order = orders.find((candidate) => candidate.id === params.id)
  const [refundStep, setRefundStep] = useState<"idle" | "confirm" | "busy" | "error">("idle")
  const [fallbackEntryContext, setFallbackEntryContext] = useState<CommerceEntryContext | null>(null)

  useEffect(() => { if (hydrated && !session.onboarded) router.replace("/onboarding") }, [hydrated, router, session.onboarded])
  useEffect(() => {
    if (!order || order.entryContext) return
    try {
      const parsed = JSON.parse(sessionStorage.getItem(`k-tour-entry-context:${order.itemId}`) ?? "null") as CommerceEntryContext | null
      if (parsed?.contextId && parsed.returnTo?.startsWith("/")) setFallbackEntryContext(parsed)
    } catch { setFallbackEntryContext(null) }
  }, [order])
  if (!session.onboarded) return null
  if (!order) return <MissingOrder ko={ko} />
  const userFunded = order.voucherFunding === "user-converted"
  const returnVoucher = vouchers.find((voucher) => voucher.id === order.voucherId)
  const refunded = order.status === "refunded"
  const refundAmount = order.refundedKRW ?? order.refundableKRW
  const restoredVoucherKRW = refunded && userFunded ? order.discountKRW : 0
  const restoredTotalKRW = refundAmount + restoredVoucherKRW
  const passState = instantPassState(order)
  const activeInstantPass = passState === "active"
  const expiredInstantPass = passState === "expired"
  const elapsedDays = activeInstantPass ? Math.max(1, Math.ceil((Date.now() - new Date(order.activationAt).getTime()) / 86_400_000)) : 0
  const beforeDeadline = Date.now() <= new Date(order.cancelDeadline).getTime()
  const refundableNow = activeInstantPass
    ? Math.max(0, Math.floor((order.paidKRW * Math.max(0, 30 - elapsedDays)) / 30))
    : beforeDeadline ? order.paidKRW + (userFunded ? order.discountKRW : 0) : 0
  const partialRefund = refunded && refundAmount < order.paidKRW
  const entryContext = order.entryContext ?? fallbackEntryContext

  const refund = async () => {
    if (refundStep === "idle") { setRefundStep("confirm"); return }
    if (refundStep !== "confirm") return
    setRefundStep("busy")
    const ok = await refundCommerceOrder(order.id)
    setRefundStep(ok ? "idle" : "error")
  }

  const stateLabel = refunded
    ? (ko ? "환불 완료" : "Refund complete")
    : expiredInstantPass
      ? (ko ? "이용권 만료" : "Pass expired")
    : order.status === "used" || activeInstantPass
      ? (ko ? "이용 중" : "Active")
      : order.fulfilment === "delivery"
        ? (Date.now() >= new Date(order.activationAt).getTime() ? (ko ? "배송 완료" : "Delivered") : (ko ? "배송 준비 중" : "Preparing delivery"))
        : order.fulfilment === "pickup"
          ? (Date.now() >= new Date(order.activationAt).getTime() ? (ko ? "픽업 가능" : "Ready for pickup") : (ko ? "픽업 준비 중" : "Preparing pickup"))
        : (ko ? "예약·주문 완료" : "Order confirmed")

  return (
    <PhoneFrame hideNav>
      <main className="paper-grain safe-bottom safe-top flex min-h-screen flex-col px-6">
        <div className="flex items-center justify-between"><span className="text-[13px] font-medium text-muted-foreground">{stateLabel}</span><span className="grid h-12 w-12 place-items-center rounded-full border border-primary/30 text-primary" style={{ animation: "seal-stamp 360ms cubic-bezier(.2,.8,.2,1)" }}><Check className="h-6 w-6" /></span></div>
        <div className="mt-9 text-center" aria-live="polite">
          <p className="font-display tabular text-[46px] font-semibold tracking-[-0.05em]">{refunded ? "+" : ""}₩{(refunded ? restoredTotalKRW : order.paidKRW).toLocaleString()}</p>
          <h1 className="font-display text-balance mx-auto mt-3 max-w-[340px] text-[27px] font-semibold leading-[1.3] tracking-[-0.025em]">
            {partialRefund
              ? (ko ? `${order.settledUsageDays ?? 1}일 이용분을 제외하고 잔액으로 돌아왔어요.` : `Your unused days were returned after settling ${order.settledUsageDays ?? 1} active day${(order.settledUsageDays ?? 1) === 1 ? "" : "s"}.`)
              : refunded
                ? userFunded ? (ko ? "여행 잔액과 재방문 바우처가 모두 돌아왔어요." : "Your travel balance and return-trip voucher are restored.") : (ko ? "잔액과 이용 전 혜택이 돌아왔어요." : "Your balance and unused benefit are restored.")
                : order.discountKRW > 0
                  ? userFunded ? (ko ? `재방문 바우처에서 ₩${order.discountKRW.toLocaleString()} 사용했어요.` : `Used ₩${order.discountKRW.toLocaleString()} from your return-trip voucher.`) : (ko ? `K-Tour ID로 ₩${order.discountKRW.toLocaleString()} 아꼈어요.` : `You saved ₩${order.discountKRW.toLocaleString()} with K-Tour ID.`)
                  : (ko ? "선택한 일정이 준비됐어요." : "Your selected option is ready.")}
          </h1>
        </div>

        {!refunded && <FulfilmentCard order={order} ko={ko} />}

        <section className="mt-7 border-y border-foreground/10 py-5">
          <p className="text-[15px] font-semibold">{ko ? order.title : order.titleEn}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">{order.merchant.replace(" · demo concept", "").replace(" · demo merchant", "")}</p>
          <div className="mt-6 space-y-3 text-[13px]">
            <Row label={ko ? "상품 금액" : "Original price"} value={`₩${order.grossKRW.toLocaleString()}`} />
            <Row label={userFunded ? (ko ? "재방문 바우처" : "Return-trip voucher") : "K-Tour ID"} value={order.discountKRW ? `− ₩${order.discountKRW.toLocaleString()}` : "—"} accent={order.discountKRW > 0} />
            {refunded && userFunded ? <>
              <Row label={ko ? "여행 잔액 환불" : "Travel balance refunded"} value={`+₩${refundAmount.toLocaleString()}`} />
              <Row label={ko ? "재방문 바우처 복구" : "Return-trip voucher restored"} value={`+₩${restoredVoucherKRW.toLocaleString()}`} accent />
              <Row label={ko ? "총 복구 금액" : "Total restored"} value={`+₩${restoredTotalKRW.toLocaleString()}`} strong />
            </> : <Row label={refunded ? (ko ? "여행 잔액 환불" : "Travel balance refunded") : (ko ? "여행 잔액 결제" : "Paid from travel balance")} value={`${refunded ? "+" : ""}₩${(refunded ? refundAmount : order.paidKRW).toLocaleString()}`} strong />}
            {partialRefund && <Row label={ko ? `${order.settledUsageDays ?? 1}일 이용 정산` : `${order.settledUsageDays ?? 1} active day${(order.settledUsageDays ?? 1) === 1 ? "" : "s"}`} value={`₩${(order.paidKRW - refundAmount).toLocaleString()}`} />}
          </div>
        </section>
        <div className="mt-5 flex items-center justify-center gap-2 text-[13px] text-muted-foreground"><Wallet className="h-4 w-4" />{userFunded ? (ko ? "재방문 바우처" : "Return-trip voucher") : (ko ? "남은 잔액" : "Balance")} · <strong className="tabular font-semibold text-foreground">₩{(userFunded ? returnVoucher?.valueKRW ?? 0 : session.wallet.balanceKRW).toLocaleString()}</strong></div>

        <div className="mt-auto pt-8">
          {entryContext ? <><Link href={entryContext.returnTo} className="pressable flex min-h-14 items-center justify-center rounded-[14px] bg-primary px-5 text-[16px] font-semibold text-white">{ko ? `${entryContext.contextLabel ?? "원래 여행"}으로 돌아가기` : `Return to ${entryContext.contextLabel ?? "your trip"}`}</Link><Link href="/wallet" className="pressable mt-2 flex min-h-11 items-center justify-center text-[13px] font-medium text-muted-foreground">{walletCta(order, ko)}</Link></> : refunded ? <Link href="/" className="pressable flex min-h-14 items-center justify-center rounded-[14px] bg-primary px-5 text-[16px] font-semibold text-white">{ko ? "홈으로" : "Back home"}</Link> : <><Link href="/wallet" className="pressable flex min-h-14 items-center justify-center rounded-[14px] bg-primary px-5 text-[16px] font-semibold text-white">{walletCta(order, ko)}</Link><Link href="/" className="pressable mt-2 flex min-h-11 items-center justify-center text-[13px] font-medium text-muted-foreground">{ko ? "홈으로" : "Back home"}</Link></>}
          <Link href={`/help?order=${encodeURIComponent(order.id)}&source=commerce&topic=${refunded ? "refund" : "payment"}`} className="pressable mt-2 flex min-h-11 items-center justify-center text-[13px] font-semibold text-primary">{ko ? "이 주문 문의하기" : "Get help with this order"}</Link>
          <details className="mt-3 border-b border-foreground/10 text-[13px] text-muted-foreground">
            <summary className="pressable flex min-h-12 cursor-pointer list-none items-center justify-center gap-2 font-medium">{ko ? "영수증·주문 관리" : "Receipt & order management"}<ChevronDown className="h-4 w-4" /></summary>
            <div className="space-y-3 pb-5 pt-2">
              <Row label={ko ? "이용 방식" : "Fulfilment"} value={ko ? order.fulfilmentLabel : order.fulfilmentLabelEn} />
              {order.deliveryAddress && <Row label={ko ? "배송지" : "Delivery to"} value={order.deliveryAddress} />}
              <Row label={ko ? "개시·이용 시각" : "Starts"} value={formatDate(order.activationAt, ko)} />
              <Row label={ko ? "취소 기준 시각" : "Cancel by"} value={formatDate(order.cancelDeadline, ko)} />
              <Row label={refunded ? (ko ? "여행 잔액 환불" : "Travel balance refund") : (ko ? "현재 예상 복구액" : "Restorable now")} value={`₩${(refunded ? refundAmount : refundableNow).toLocaleString()}`} />
              {refunded && userFunded && <Row label={ko ? "재방문 바우처 복구" : "Return-trip voucher restored"} value={`₩${restoredVoucherKRW.toLocaleString()}`} />}
              {refunded && order.refundedAt && <Row label={ko ? "환불 완료 시각" : "Refunded at"} value={formatDate(order.refundedAt, ko)} />}
              <Row label={ko ? "영수증 번호" : "Receipt"} value={order.receiptId} />
              <Link href="/evidence" className="pressable inline-flex min-h-10 items-center text-[12px] font-semibold text-primary underline underline-offset-4">{ko ? "거래 증거 보기" : "View transaction evidence"}</Link>
              {!refunded && <>
                <p className="text-[12px] leading-5">{ko ? order.cancellation : order.cancellationEn}</p>
                {refundStep === "confirm" && <p role="alert" className="border-l-2 border-gold pl-3 text-[12px] leading-5">{order.status === "used" || activeInstantPass ? (ko ? `이미 개시되어 ₩${refundableNow.toLocaleString()}이 환불되고 사용한 혜택은 복구되지 않아요.` : `This pass is active: ₩${refundableNow.toLocaleString()} is refundable and the used benefit is not restored.`) : userFunded ? (ko ? "이용 전 취소라 여행 잔액 결제분과 사용한 재방문 바우처가 각각 돌아와요." : "Cancelling before use restores both the travel-balance payment and the return-trip voucher used.") : (ko ? "이용 전 취소라 결제 금액과 사용한 혜택이 함께 복구돼요." : "Before use, cancelling restores both the payment and benefit.")}</p>}
                {refundStep === "error" && <p role="alert" className="text-destructive">{ko ? "취소하지 못했어요. 다시 시도해 주세요." : "Cancellation failed. Try again."}</p>}
                {refundableNow <= 0 ? <p role="status" className="rounded-[12px] bg-secondary p-3 text-center text-[12px] font-medium">{expiredInstantPass ? (ko ? "30일 이용 기간이 끝난 이용권이에요." : "This 30-day pass has expired.") : (ko ? "취소 가능 시각이 지나 환불할 수 없어요." : "The cancellation window has closed.")}</p> : <button type="button" onClick={refund} disabled={refundStep === "busy"} className="pressable flex min-h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-secondary text-[13px] font-semibold text-foreground disabled:opacity-60">{refundStep === "busy" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}{refundStep === "confirm" ? (ko ? `₩${refundableNow.toLocaleString()} 환불 확정` : `Confirm ₩${refundableNow.toLocaleString()} refund`) : (ko ? "취소·환불" : "Cancel & refund")}</button>}
              </>}
            </div>
          </details>
        </div>
      </main>
    </PhoneFrame>
  )
}

function FulfilmentCard({ order, ko }: { order: CommerceOrder; ko: boolean }) {
  const reached = Date.now() >= new Date(order.activationAt).getTime()
  const passState = instantPassState(order)
  const entryCode = `KT-${order.id.slice(-6).toUpperCase()}`
  if (order.fulfilment === "booking") {
    return <section className="mt-8 rounded-[24px] bg-ink p-5 text-white"><div className="flex items-center justify-between"><span className="text-[12px] font-semibold tracking-[0.08em] text-white/72">{ko ? "모바일 입장권" : "MOBILE TICKET"}</span><QrCode className="h-6 w-6 text-gold" /></div><div className="mt-5 flex items-center gap-5"><QRCode value={`k-tour-id://admit/${order.id}`} size={96} ariaLabel={ko ? "모바일 입장 코드" : "Mobile admission code"} className="shrink-0 border-0" /><div className="min-w-0"><p className="font-display text-[20px] font-semibold">{ko ? order.title : order.titleEn}</p><p className="mt-2 text-[12px] text-white/72">{ko ? "현장에서 이 코드를 제시하세요" : "Present this code at admission"}</p><p className="font-mono mt-2 text-[13px] font-semibold tracking-[0.08em] text-gold">{entryCode}</p></div></div><div className="mt-5 border-t border-white/12 pt-4"><p className="text-[12px] text-white/72">{ko ? order.optionLabel : order.optionLabelEn}</p></div></section>
  }
  const meta = order.fulfilment === "delivery"
    ? { label: reached ? (ko ? "배송 완료" : "DELIVERED") : (ko ? "배송 준비 중" : "PREPARING DELIVERY"), Icon: PackageCheck, detail: order.deliveryAddress ?? (ko ? "주소 확인 필요" : "Address required") }
    : order.fulfilment === "instant"
      ? passState === "expired" ? { label: ko ? "이용권 만료" : "EXPIRED PASS", Icon: BusFront, detail: ko ? "30일 이용 기간 종료" : "30-day period ended" } : { label: ko ? "디지털 이용권" : "DIGITAL PASS", Icon: BusFront, detail: passState === "scheduled" ? (ko ? "개시 예정" : "Scheduled to start") : (ko ? "지금부터 이용 가능" : "Ready to use now") }
      : order.fulfilment === "pickup"
        ? { label: reached ? (ko ? "픽업 가능" : "READY FOR PICKUP") : (ko ? "픽업 준비 중" : "PREPARING PICKUP"), Icon: ShoppingBag, detail: ko ? `픽업 번호 ${order.id.slice(-6)}` : `Pickup no. ${order.id.slice(-6)}` }
        : { label: ko ? "모바일 입장권" : "MOBILE TICKET", Icon: QrCode, detail: ko ? order.optionLabel : order.optionLabelEn }
  return <section className="mt-8 rounded-[24px] bg-ink p-5 text-white"><div className="flex items-center justify-between"><span className="text-[12px] font-semibold tracking-[0.08em] text-white/72">{meta.label}</span><meta.Icon className="h-6 w-6 text-gold" /></div><p className="font-display mt-8 text-[22px] font-semibold">{ko ? order.title : order.titleEn}</p><p className="mt-2 text-[13px] text-white/72">{meta.detail}</p><div className="mt-5 border-t border-white/12 pt-4"><p className="font-mono text-[12px] text-white/72">{order.id}</p></div></section>
}

function walletCta(order: CommerceOrder, ko: boolean) {
  if (order.fulfilment === "delivery") return ko ? "지갑에서 배송 상태 보기" : "Track in Wallet"
  if (order.service === "transport") return ko ? "지갑에서 이용권 보기" : "View pass in Wallet"
  if (order.fulfilment === "pickup") return ko ? "지갑에서 픽업 번호 보기" : "View pickup in Wallet"
  return ko ? "지갑에서 예약권 보기" : "View booking in Wallet"
}

function formatDate(value: string, ko: boolean) {
  return new Intl.DateTimeFormat(ko ? "ko-KR" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value))
}

function Row({ label, value, accent, strong }: { label: string; value: string; accent?: boolean; strong?: boolean }) {
  return <div className={cn("flex items-start justify-between gap-5", strong && "border-t border-foreground/10 pt-3 font-semibold")}><span className="flex-shrink-0 text-muted-foreground">{label}</span><span className={cn("tabular text-right", accent && "font-semibold text-success", strong && "text-[15px] text-foreground")}>{value}</span></div>
}

function MissingOrder({ ko }: { ko: boolean }) {
  return <PhoneFrame hideNav><PageHeader title={ko ? "주문" : "Order"} back="/wallet" /><main className="px-6 py-20 text-center"><h1 className="font-display text-[26px] font-semibold">{ko ? "주문을 찾지 못했어요" : "Order not found"}</h1><p className="mt-3 text-[13px] text-muted-foreground">{ko ? "주문 내역에서 이용 가능한 항목을 다시 확인해 주세요." : "Check your order history for available items."}</p><Link href="/explore" className="mt-5 inline-flex min-h-11 items-center text-[13px] font-semibold text-primary underline underline-offset-4">{ko ? "탐색으로 이동" : "Go to Explore"}</Link></main></PhoneFrame>
}
