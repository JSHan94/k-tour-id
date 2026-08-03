"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, BadgeCheck, CalendarDays, Check, ChevronRight, Loader2, MapPin, Ticket } from "lucide-react"
import { useLang } from "@/lib/i18n/lang-provider"
import type { MarketplaceItem, ServiceOption, Voucher } from "@/lib/types"
import { isVoucherAvailable } from "@/lib/voucher-policy"
import { cn } from "@/lib/utils"
import { timingForOrder } from "@/lib/commerce-policy"

function price(item: MarketplaceItem, voucher?: Voucher, option?: ServiceOption) {
  const gross = item.priceKRW + (option?.priceDeltaKRW ?? 0)
  const discount = isVoucherAvailable(voucher) ? Math.min(voucher.valueKRW, gross) : 0
  return { gross, discount, final: gross - discount }
}

export function EditorialFeature({ item, voucher, proximity }: { item: MarketplaceItem; voucher?: Voucher; proximity?: string }) {
  const { lang } = useLang()
  const amount = price(item, voucher)
  return (
    <Link href={`/explore/${item.id}`} className="pressable group block">
      <div className="relative aspect-[16/10] overflow-hidden rounded-[24px] bg-secondary">
        <img src={item.image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.015]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/42 via-transparent to-transparent" />
      </div>
      <div className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0"><h3 className="font-display text-balance text-[24px] font-semibold leading-[1.28] tracking-[-0.025em]">{item.title[lang]}</h3><p className="mt-2 flex items-center gap-1.5 text-[12px] text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />{item.availability[lang]} · {item.location[lang]}</p>{proximity && <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-success"><MapPin className="h-3.5 w-3.5" />{proximity}</p>}</div>
          <ChevronRight className="mt-1 h-5 w-5 flex-shrink-0 text-muted-foreground" />
        </div>
        <p className="mt-3 text-[14px]"><strong className="tabular text-[17px]">₩{amount.final.toLocaleString()}</strong>{amount.discount > 0 && <><span className="tabular ml-2 text-[12px] text-muted-foreground line-through">₩{amount.gross.toLocaleString()}</span><span className="ml-2 text-[12px] font-semibold text-success">₩{amount.discount.toLocaleString()} {lang === "ko" ? "혜택" : "saved"}</span></>}</p>
      </div>
    </Link>
  )
}

export function ServiceRow({ item, voucher, proximity }: { item: MarketplaceItem; voucher?: Voucher; proximity?: string }) {
  const { lang } = useLang()
  const amount = price(item, voucher)
  return (
    <Link href={`/explore/${item.id}`} className="pressable flex min-h-[128px] items-center gap-4 py-4">
      <img src={item.image} alt="" loading="lazy" className="h-28 w-[104px] flex-shrink-0 rounded-[12px] object-cover" />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-[1.4]">{item.title[lang]}</span>
        <span className="mt-1.5 flex items-center gap-1 text-[12px] text-muted-foreground"><MapPin className="h-3 w-3" />{proximity ?? item.location[lang]}</span>
        <span className="mt-1 block truncate text-[12px] text-muted-foreground">{item.availability[lang]} · {item.duration[lang]}</span>
        <span className="mt-2 block"><strong className="tabular text-[14px]">₩{amount.final.toLocaleString()}</strong>{amount.discount > 0 && <span className="ml-2 text-[12px] font-semibold text-success">−₩{amount.discount.toLocaleString()}</span>}</span>
      </span>
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
    </Link>
  )
}

export function BenefitTicket({ item, voucher }: { item: MarketplaceItem; voucher: Voucher }) {
  const { lang } = useLang()
  return (
    <Link href={`/explore/${item.id}`} className={cn("pressable flex min-h-[86px] items-center gap-4 py-4", !isVoucherAvailable(voucher) && "opacity-60")}>
      <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-success-surface text-success"><Ticket className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1"><strong className="tabular block text-[18px] text-success">₩{voucher.valueKRW.toLocaleString()} {voucher.funding === "user-converted" ? (lang === "ko" ? "바우처" : "voucher") : (lang === "ko" ? "절약" : "saved")}</strong><span className="mt-1 block truncate text-[12px] text-muted-foreground">{item.title[lang]} · {isVoucherAvailable(voucher) ? (lang === "ko" ? "사용 가능" : "Available") : (lang === "ko" ? "사용 완료·만료" : "Used or expired")}</span></span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  )
}

export function CommerceCheckoutSheet({
  item,
  option,
  voucher,
  useBenefit,
  balanceKRW,
  busy,
  error,
  errorCode,
  deliveryAddress,
  onDeliveryAddressChange,
  onClose,
  onConfirm,
}: {
  item: MarketplaceItem
  option: ServiceOption
  voucher?: Voucher
  useBenefit: boolean
  balanceKRW: number
  busy: boolean
  error: string
  errorCode?: string
  deliveryAddress?: string
  onDeliveryAddressChange?: (value: string) => void
  onClose: () => void
  onConfirm: () => void
}) {
  const { lang } = useLang()
  const dialogRef = useRef<HTMLElement>(null)
  const [acceptedNoRefund, setAcceptedNoRefund] = useState(false)
  const amount = price(item, useBenefit ? voucher : undefined, option)
  const insufficient = amount.final > balanceKRW
  const returnPath = `/explore/${item.id}?option=${option.id}&benefit=${useBenefit ? "1" : "0"}&resume=checkout`
  const addressMissing = item.fulfilment === "delivery" && !deliveryAddress?.trim()
  const timing = timingForOrder(item.id, item.fulfilment, option.id, amount.final)
  const freeCancellationClosed = item.fulfilment !== "instant" && Date.now() > new Date(timing.cancelDeadline).getTime()
  const rememberDraft = () => {
    if (item.fulfilment === "delivery" && deliveryAddress?.trim()) {
      sessionStorage.setItem(`k-tour-checkout-draft:${item.id}`, deliveryAddress.trim())
    }
  }
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const overlay = dialogRef.current?.parentElement
    const contentRoot = overlay?.parentElement
    const frameRoot = contentRoot?.parentElement
    const background = [
      ...Array.from(contentRoot?.children ?? []).filter((node) => node !== overlay),
      ...Array.from(frameRoot?.children ?? []).filter((node) => node !== contentRoot),
    ].filter((node): node is HTMLElement => node instanceof HTMLElement)
    const prior = background.map((node) => ({ node, inert: node.inert, ariaHidden: node.getAttribute("aria-hidden") }))
    const previousOverflow = document.body.style.overflow
    background.forEach((node) => { node.inert = true; node.setAttribute("aria-hidden", "true") })
    document.body.style.overflow = "hidden"
    dialogRef.current?.focus()
    return () => {
      prior.forEach(({ node, inert, ariaHidden }) => {
        node.inert = inert
        if (ariaHidden == null) node.removeAttribute("aria-hidden")
        else node.setAttribute("aria-hidden", ariaHidden)
      })
      document.body.style.overflow = previousOverflow
      previous?.focus()
    }
  }, [])
  const keepFocusInside = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape" && !busy) { event.preventDefault(); onClose(); return }
    if (event.key !== "Tab") return
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input:not([disabled])") ?? [])
    if (!focusable.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/55 px-0" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target && !busy) onClose() }}>
      <section ref={dialogRef} tabIndex={-1} onKeyDown={keepFocusInside} role="dialog" aria-modal="true" aria-labelledby="checkout-title" className="safe-bottom w-full max-w-[420px] rounded-t-[28px] bg-background px-6 pb-6 pt-4 outline-none shadow-[0_-20px_60px_rgba(0,0,0,.18)]">
        <div className="mx-auto h-1 w-9 rounded-full bg-foreground/15" />
        <div className="mt-5 flex items-start justify-between gap-4"><div><p className="text-[12px] font-semibold text-success">{lang === "ko" ? "최종 금액 확인" : "Review final price"}</p><h2 id="checkout-title" className="font-display mt-1 text-[25px] font-semibold">{item.title[lang]}</h2><p className="mt-2 text-[13px] text-muted-foreground">{option.label[lang]} · {item.fulfilmentLabel[lang]}</p></div><button type="button" onClick={onClose} disabled={busy} className="min-h-11 px-2 text-[13px] font-medium text-muted-foreground">{lang === "ko" ? "닫기" : "Close"}</button></div>
        <dl className="mt-6 space-y-3 border-y border-foreground/10 py-5 text-[14px]">
          <PriceRow label={lang === "ko" ? "상품 금액" : "Original price"} value={`₩${amount.gross.toLocaleString()}`} />
          <PriceRow label="K-Tour ID" value={amount.discount > 0 ? `− ₩${amount.discount.toLocaleString()}` : (lang === "ko" ? "적용 없음" : "No discount")} accent={amount.discount > 0} />
          <PriceRow label={lang === "ko" ? "결제할 금액" : "Total due"} value={`₩${amount.final.toLocaleString()}`} strong />
        </dl>
        {item.fulfilment === "delivery" && <label className="mt-4 block"><span className="text-[12px] font-semibold">{lang === "ko" ? "받을 주소" : "Delivery address"}</span><input value={deliveryAddress ?? ""} onChange={(event) => onDeliveryAddressChange?.(event.target.value)} placeholder={lang === "ko" ? "도로명 주소를 입력하세요" : "Enter a street address"} className="mt-2 min-h-12 w-full rounded-[12px] border border-foreground/15 bg-card px-4 text-[13px] outline-none focus:border-primary" /><span className="mt-1.5 block text-[11px] text-muted-foreground">{lang === "ko" ? "결제 전에 주소와 예상 도착 시간을 다시 확인해요." : "Review the address and arrival estimate before payment."}</span></label>}
        {freeCancellationClosed ? <div role="alert" className="mt-4 rounded-[14px] border border-gold/35 bg-secondary p-4"><p className="text-[13px] font-semibold">{lang === "ko" ? "무료 취소 마감이 지났어요" : "The free-cancellation window has closed"}</p><p className="mt-1 text-[12px] leading-5 text-muted-foreground">{lang === "ko" ? "현재 옵션은 결제 후 환불할 수 없어요." : "This option cannot be refunded after payment."}</p><label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 text-[12px] font-semibold"><input type="checkbox" checked={acceptedNoRefund} onChange={(event) => setAcceptedNoRefund(event.target.checked)} className="h-5 w-5 accent-[var(--primary)]" />{lang === "ko" ? "환불 불가 조건을 확인했어요" : "I understand this is non-refundable"}</label></div> : <p className="mt-4 flex items-start gap-2 text-[12px] leading-5 text-muted-foreground"><Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-success" />{item.cancellation[lang]}</p>}
        {insufficient && <div role="alert" className="mt-4 rounded-[14px] bg-secondary p-4"><p className="text-[13px] font-semibold">{lang === "ko" ? "잔액이 부족해요" : "Insufficient balance"}</p><Link href={`/wallet?topup=1&returnTo=${encodeURIComponent(returnPath)}`} onClick={rememberDraft} className="mt-2 inline-flex min-h-11 items-center gap-2 text-[13px] font-semibold text-primary underline underline-offset-4">{lang === "ko" ? "충전하고 이 주문으로 돌아오기" : "Top up and return to this order"}<ArrowRight className="h-4 w-4" /></Link></div>}
        {error && <p role="alert" className="mt-4 border-l-2 border-destructive pl-3 text-[13px] leading-5 text-destructive">{error}</p>}
        {(errorCode === "CREDENTIAL_EXPIRED" || errorCode === "CREDENTIAL_INACTIVE") && <Link href={`/onboarding?mode=renew&returnTo=${encodeURIComponent(returnPath)}`} onClick={rememberDraft} className="mt-2 inline-flex min-h-11 items-center gap-2 text-[13px] font-semibold text-primary underline underline-offset-4">{lang === "ko" ? "K-Tour ID 갱신하고 돌아오기" : "Renew K-Tour ID and return"}<ArrowRight className="h-4 w-4" /></Link>}
        <button type="button" onClick={onConfirm} disabled={busy || insufficient || addressMissing || (freeCancellationClosed && !acceptedNoRefund)} className="pressable mt-6 flex min-h-14 w-full items-center justify-center gap-3 rounded-[14px] bg-primary px-5 text-[16px] font-semibold text-white disabled:opacity-45">
          {busy ? <><Loader2 className="h-5 w-5 animate-spin" />{lang === "ko" ? "결제 확인 중…" : "Confirming payment…"}</> : <><BadgeCheck className="h-5 w-5" />{lang === "ko" ? `₩${amount.final.toLocaleString()} 결제` : `Pay ₩${amount.final.toLocaleString()}`}</>}
        </button>
      </section>
    </div>
  )
}

function PriceRow({ label, value, accent, strong }: { label: string; value: string; accent?: boolean; strong?: boolean }) {
  return <div className={cn("flex items-center justify-between gap-4", strong && "border-t border-foreground/10 pt-3 font-semibold")}><dt className="text-muted-foreground">{label}</dt><dd className={cn("tabular", accent && "font-semibold text-success", strong && "text-[17px] text-foreground")}>{value}</dd></div>
}
