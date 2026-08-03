"use client"

import { useEffect, useMemo, useState, type KeyboardEvent } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowRight, BadgeCheck, CalendarDays, Check, Clock3, Languages, MapPin, ShieldCheck } from "lucide-react"
import { CommerceCheckoutSheet, ServiceRow } from "@/components/app/commerce"
import { LangToggle, PageHeader, PhoneFrame } from "@/components/app/shell"
import { itemById, itemsForUserType } from "@/lib/catalog"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import { cn } from "@/lib/utils"

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { session, vouchers, purchaseServiceItem, prepareDemoPurchase, hydrated } = useApp()
  const { lang } = useLang()
  const ko = lang === "ko"
  const item = itemById(params.id)
  const voucher = vouchers.find((candidate) => candidate.id === item?.voucherId)
  const [optionId, setOptionId] = useState(item?.options.find((option) => option.available)?.id ?? "")
  const [useBenefit, setUseBenefit] = useState(voucher?.status === "available")
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [errorCode, setErrorCode] = useState("")
  const [soldOut, setSoldOut] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState(ko ? "서울 서대문구 연희로 00 · 데모 주소" : "00 Yeonhui-ro, Seodaemun-gu, Seoul · demo address")

  useEffect(() => {
    if (hydrated && !session.onboarded) router.replace("/onboarding")
    const query = new URLSearchParams(window.location.search)
    setSoldOut(query.get("preview") === "soldout")
    const requestedOption = query.get("option")
    if (requestedOption && item?.options.some((candidate) => candidate.id === requestedOption && candidate.available)) setOptionId(requestedOption)
    const requestedBenefit = query.get("benefit")
    setUseBenefit(requestedBenefit === "0" ? false : voucher?.status === "available")
    const savedAddress = item?.fulfilment === "delivery" ? sessionStorage.getItem(`k-tour-checkout-draft:${item.id}`) : null
    if (savedAddress) setDeliveryAddress(savedAddress)
    if (query.get("resume") === "checkout") setCheckoutOpen(true)
  }, [hydrated, item, router, session.onboarded, voucher?.status])
  useEffect(() => {
    const defaults = ["서울 서대문구 연희로 00 · 데모 주소", "00 Yeonhui-ro, Seodaemun-gu, Seoul · demo address"]
    setDeliveryAddress((current) => !current || defaults.includes(current) ? defaults[ko ? 0 : 1] : current)
  }, [ko])
  const option = soldOut ? undefined : item?.options.find((candidate) => candidate.id === optionId)
  const alternatives = useMemo(() => session.userType ? itemsForUserType(session.userType).filter((candidate) => candidate.id !== item?.id).slice(0, 2) : [], [item?.id, session.userType])
  if (!session.onboarded) return null
  if (!item) return <NotFound ko={ko} />

  const eligible = !!session.userType && item.eligibleUserTypes.includes(session.userType)
  const discount = useBenefit && voucher?.status === "available" ? Math.min(voucher.valueKRW, item.priceKRW + (option?.priceDeltaKRW ?? 0)) : 0
  const gross = item.priceKRW + (option?.priceDeltaKRW ?? 0)
  const final = gross - discount
  const canonicalVisitorJourney = item.id === "bukchon-workshop" && session.userType === "foreigner" && voucher?.status === "available" && useBenefit
  const moveOption = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key) || soldOut) return
    event.preventDefault()
    const available = item.options.map((candidate, candidateIndex) => ({ candidate, candidateIndex })).filter(({ candidate }) => candidate.available)
    const current = available.findIndex(({ candidateIndex }) => candidateIndex === index)
    const next = event.key === "Home" ? 0
      : event.key === "End" ? available.length - 1
        : (current + (event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1) + available.length) % available.length
    const selectedOption = available[next]
    if (!selectedOption) return
    setOptionId(selectedOption.candidate.id)
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[selectedOption.candidateIndex]?.focus()
  }

  const confirm = async () => {
    if (!option || busy) return
    setBusy(true)
    setError("")
    setErrorCode("")
    try {
      const result = await purchaseServiceItem({ itemId: item.id, optionId: option.id, useBenefit, deliveryAddress })
      if (result.ok && result.data) {
        sessionStorage.removeItem(`k-tour-checkout-draft:${item.id}`)
        router.push(`/orders/${result.data.id}`)
      }
      else { setErrorCode(result.error?.code ?? ""); setError(errorCopy(result.error?.code, ko)) }
    } catch {
      setError(ko ? "결제를 확인하지 못했어요. 금액은 차감되지 않았습니다." : "Payment could not be confirmed. Nothing was charged.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <PhoneFrame>
      <PageHeader title={ko ? "상품 상세" : "Details"} back="/explore" right={<LangToggle />} />
      <main className="pb-8">
        <div className="relative mx-6 aspect-[4/3] overflow-hidden rounded-[24px] bg-secondary">
          <img src={item.image} alt="" className="h-full w-full object-cover" />
          <span className="absolute bottom-3 right-3 rounded-full bg-ink/64 px-2.5 py-1 text-[10px] font-medium text-white/82 backdrop-blur">{ko ? "데모 예시 · 제휴 전" : "Demo concept · pre-partnership"}</span>
        </div>
        <section className="px-6 pt-6">
          <p className={cn("flex items-center gap-1.5 text-[12px] font-semibold", eligible ? "text-success" : "text-muted-foreground")}><BadgeCheck className="h-4 w-4" />{eligible ? (ko ? "내 K-Tour ID로 이용 가능" : "Available with your K-Tour ID") : (ko ? "현재 K-Tour ID의 이용 대상이 아닌 상품" : "This item is not available for your K-Tour ID")}</p>
          <h1 className="font-display text-balance mt-3 text-[31px] font-semibold leading-[1.2] tracking-[-0.03em]">{item.title[lang]}</h1>
          <p className="mt-3 text-[14px] leading-6 text-muted-foreground">{item.description[lang]}</p>
          <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 border-y border-foreground/10 py-5 text-[12px]">
            <Fact icon={MapPin} label={item.location[lang]} />
            <Fact icon={Clock3} label={item.duration[lang]} />
            <Fact icon={CalendarDays} label={soldOut ? (ko ? "오늘 일정 마감" : "Sold out today") : item.availability[lang]} />
            <Fact icon={Languages} label={item.languageLabels.map((label) => label === "한국어" && !ko ? "Korean" : label).join(" · ")} />
          </div>
        </section>

        <section className="mt-9 px-6">
          <p className="text-[12px] font-semibold text-primary">01 · {ko ? "일정·옵션" : "Date & option"}</p>
          <h2 className="font-display mt-1 text-[24px] font-semibold">{ko ? "언제 이용할까요?" : "When will you use it?"}</h2>
          <div role="radiogroup" aria-label={ko ? "일정 선택" : "Choose an option"} className="mt-4 space-y-2">{item.options.map((candidate, index) => <button key={candidate.id} type="button" role="radio" aria-checked={optionId === candidate.id && !soldOut} tabIndex={optionId === candidate.id && !soldOut ? 0 : -1} disabled={!candidate.available || soldOut} onKeyDown={(event) => moveOption(event, index)} onClick={() => setOptionId(candidate.id)} className={cn("pressable flex min-h-14 w-full items-center justify-between rounded-[14px] border px-4 text-left text-[14px]", optionId === candidate.id && !soldOut ? "border-success bg-success-surface" : "border-foreground/10 bg-card", (!candidate.available || soldOut) && "opacity-45")}><span><strong className="font-semibold">{candidate.label[lang]}</strong>{candidate.priceDeltaKRW ? <span className="ml-2 text-[12px] text-muted-foreground">+₩{candidate.priceDeltaKRW.toLocaleString()}</span> : null}</span>{optionId === candidate.id && !soldOut && <Check className="h-4 w-4 text-success" />}</button>)}</div>
          {soldOut && <p role="status" className="mt-3 border-l-2 border-gold pl-3 text-[12px] leading-5 text-muted-foreground">{ko ? "선택 가능한 일정이 모두 마감됐어요. 아래의 대체 상품은 지금 예약할 수 있어요." : "All options are sold out. Available alternatives are listed below."}</p>}
        </section>

        <section className="mt-9 px-6">
          <p className="text-[12px] font-semibold text-primary">02 · {ko ? "혜택·최종가" : "Benefit & final price"}</p>
          <div className="mt-3 border-y border-foreground/10 py-5">
            {!eligible ? <p className="text-[13px] leading-6 text-muted-foreground">{ko ? "이 상품은 전용 프로그램으로 운영되어 현재 K-Tour ID로는 구매할 수 없어요. 이용 가능한 상품에서 혜택과 최종가를 확인해 주세요." : "This is a dedicated-program item and cannot be purchased with your current K-Tour ID. Open an available item to review benefits and final price."}</p> : <>{voucher ? <button type="button" aria-pressed={useBenefit} disabled={voucher.status !== "available"} onClick={() => setUseBenefit((current) => !current)} className="pressable flex w-full items-center gap-3 text-left disabled:opacity-55"><span className={cn("grid h-10 w-10 place-items-center rounded-full", useBenefit ? "bg-success text-white" : "bg-secondary text-muted-foreground")}><ShieldCheck className="h-5 w-5" /></span><span className="min-w-0 flex-1"><strong className="block text-[14px]">{ko ? `K-Tour ID ₩${voucher.valueKRW.toLocaleString()} 혜택` : `₩${voucher.valueKRW.toLocaleString()} K-Tour ID benefit`}</strong><span className="mt-1 block text-[12px] text-muted-foreground">{voucher.status === "available" ? (ko ? "선택한 주문에 적용 가능" : "Available for this order") : (ko ? "이미 사용했거나 만료된 혜택" : "Already used or expired")}</span></span><span className={cn("grid h-6 w-6 place-items-center rounded-full border", useBenefit ? "border-success bg-success text-white" : "border-foreground/20")}>{useBenefit && <Check className="h-3.5 w-3.5" />}</span></button> : <p className="text-[13px] text-muted-foreground">{ko ? "이 상품은 별도 할인 없이 정상가로 이용할 수 있어요." : "This item is available at the regular price."}</p>}<div className="mt-5 flex items-end justify-between border-t border-foreground/10 pt-5"><div><p className="text-[12px] text-muted-foreground">{ko ? "최종 결제 금액" : "Final price"}</p>{discount > 0 && <p className="tabular mt-1 text-[12px] text-muted-foreground line-through">₩{gross.toLocaleString()}</p>}</div><div className="text-right"><strong className="font-display tabular text-[35px] font-semibold tracking-[-0.04em]">₩{final.toLocaleString()}</strong>{discount > 0 && <p className="mt-1 text-[12px] font-semibold text-success">₩{discount.toLocaleString()} {ko ? "절약" : "saved"}</p>}</div></div></>}
          </div>
        </section>

        <section className="mt-8 px-6"><h2 className="text-[14px] font-semibold">{ko ? "이용과 취소" : "Fulfilment & cancellation"}</h2><div className="mt-3 space-y-2 text-[13px] leading-6 text-muted-foreground"><p>· {item.fulfilmentLabel[lang]}</p><p>· {item.cancellation[lang]}</p><p>· {ko ? "최종 금액과 선택 가능 여부는 결제 확인 화면에서 다시 보여드려요." : "The review screen shows the final price and option availability again."}</p></div></section>

        <div className="sticky bottom-[76px] mt-9 bg-background/94 px-6 py-3 backdrop-blur-xl">
          {soldOut ? <div className="rounded-[14px] bg-secondary p-4"><p className="text-[13px] font-semibold">{ko ? "오늘은 예약할 수 없어요." : "No booking is available today."}</p><Link href="/explore" className="mt-2 inline-flex min-h-10 items-center gap-2 text-[13px] font-semibold text-primary underline underline-offset-4">{ko ? "가능한 다른 상품 보기" : "See available alternatives"}<ArrowRight className="h-4 w-4" /></Link></div> : !eligible ? <div className="rounded-[14px] bg-secondary p-4"><p className="text-[13px] font-semibold">{ko ? "이 상품은 현재 K-Tour ID의 이용 대상이 아니에요." : "This item is not available for your current K-Tour ID."}</p><Link href="/explore" className="mt-2 inline-flex min-h-10 items-center gap-2 text-[13px] font-semibold text-primary underline underline-offset-4">{ko ? "이용 가능한 상품 보기" : "See available items"}<ArrowRight className="h-4 w-4" /></Link></div> : canonicalVisitorJourney && option ? <Link href={`/present?step=consent&item=${item.id}&option=${option.id}`} onClick={() => prepareDemoPurchase(item.id, option.id)} className="pressable flex min-h-14 items-center justify-between rounded-[14px] bg-primary px-5 text-[16px] font-semibold text-white">{ko ? `K-Tour ID로 ₩${discount.toLocaleString()} 할인 확인` : `Verify ₩${discount.toLocaleString()} benefit`}<ArrowRight className="h-5 w-5" /></Link> : <button type="button" onClick={() => setCheckoutOpen(true)} disabled={!option} className="pressable flex min-h-14 w-full items-center justify-between rounded-[14px] bg-primary px-5 text-[16px] font-semibold text-white disabled:opacity-45">{ko ? `₩${final.toLocaleString()} 결제 확인` : `Review ₩${final.toLocaleString()} payment`}<ArrowRight className="h-5 w-5" /></button>}
        </div>

        {alternatives.length > 0 && <section className="mt-9 px-6"><p className="text-[12px] font-semibold text-primary">{ko ? "다른 선택" : "Other choices"}</p><div className="mt-3 divide-y divide-foreground/10 border-y border-foreground/10">{alternatives.map((candidate) => <ServiceRow key={candidate.id} item={candidate} voucher={vouchers.find((entry) => entry.id === candidate.voucherId)} />)}</div></section>}
      </main>

      {checkoutOpen && option && <CommerceCheckoutSheet item={item} option={option} voucher={voucher} useBenefit={useBenefit} balanceKRW={session.wallet.balanceKRW} busy={busy} error={error} errorCode={errorCode} deliveryAddress={deliveryAddress} onDeliveryAddressChange={setDeliveryAddress} onClose={() => { if (!busy) { setCheckoutOpen(false); setError(""); setErrorCode("") } }} onConfirm={confirm} />}
    </PhoneFrame>
  )
}

function Fact({ icon: Icon, label }: { icon: typeof MapPin; label: string }) {
  return <div className="flex items-start gap-2"><Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" /><span className="leading-5 text-muted-foreground">{label}</span></div>
}

function errorCopy(code: string | undefined, ko: boolean) {
  if (code === "INSUFFICIENT_BALANCE") return ko ? "잔액이 부족해요. 충전 후 같은 주문에서 다시 시도할 수 있어요." : "Your balance is low. Top up and retry this order."
  if (code === "CREDENTIAL_EXPIRED" || code === "CREDENTIAL_INACTIVE") return ko ? "K-Tour ID를 갱신한 뒤 이 주문으로 돌아오세요." : "Renew K-Tour ID, then return to this order."
  if (code === "VOUCHER_UNAVAILABLE") return ko ? "혜택이 이미 사용됐어요. 정상가 결제를 선택하거나 다른 상품을 확인하세요." : "The benefit is no longer available. Pay full price or choose another item."
  if (code === "OPTION_UNAVAILABLE") return ko ? "선택한 일정이 마감됐어요. 다른 일정을 선택해 주세요." : "That option sold out. Choose another time."
  if (code === "DELIVERY_ADDRESS_REQUIRED") return ko ? "배송받을 주소를 확인해 주세요." : "Confirm the delivery address."
  if (code === "VOUCHER_NOT_APPLICABLE") return ko ? "이 혜택은 현재 가맹점·서비스·결제금액 조건과 맞지 않아요." : "This benefit doesn't match the merchant, service, or minimum spend."
  return ko ? "결제를 확인하지 못했어요. 금액은 차감되지 않았습니다." : "Payment could not be confirmed. Nothing was charged."
}

function NotFound({ ko }: { ko: boolean }) {
  return <PhoneFrame><PageHeader title={ko ? "상품 상세" : "Details"} back="/explore" /><main className="px-6 py-20 text-center"><h1 className="font-display text-[26px] font-semibold">{ko ? "상품을 찾지 못했어요" : "Item not found"}</h1><Link href="/explore" className="mt-5 inline-flex min-h-11 items-center text-[13px] font-semibold text-primary underline underline-offset-4">{ko ? "탐색으로 돌아가기" : "Back to Explore"}</Link></main></PhoneFrame>
}
