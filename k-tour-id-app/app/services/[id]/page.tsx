"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowRight, BadgeCheck, Check, ChevronRight, CircleAlert, Clock3, ExternalLink, Loader2, MapPin, RotateCcw, ShieldCheck, Wallet } from "lucide-react"
import { BrandMark } from "@/components/app/brand"
import { LangToggle, PageHeader, PhoneFrame } from "@/components/app/shell"
import { commercialServiceById } from "@/lib/commercial-services"
import { reserveExternalOrder, saveExternalOrder, useExternalServiceOrders, type ExternalOrderStatus, type ExternalServiceOrder } from "@/lib/external-service-orders"
import { isCredentialUsable } from "@/lib/credential-status"
import { distanceKm, useNearbyLocation } from "@/lib/location/location-provider"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"

type Step = "detail" | "consent" | "handoff" | "processing" | "result"

const CHOICES: Record<string, { ko: string[]; en: string[] }> = {
  "tmoney-visitor-pass": { ko: ["3일권 · 오늘 개시", "3일권 · 내일 개시"], en: ["3-day pass · starts today", "3-day pass · starts tomorrow"] },
  "kakao-t-airport": { ko: ["현재 위치 → 인천공항 T1", "숙소 → 인천공항 T1"], en: ["Current location → Incheon Airport T1", "My stay → Incheon Airport T1"] },
  "uber-city-ride": { ko: ["현재 위치 → 성수", "명동 → 성수"], en: ["Current location → Seongsu", "Myeongdong → Seongsu"] },
  "baemin-local-meal": { ko: ["불고기 덮밥 · 숙소 배달", "비빔밥 · 숙소 배달"], en: ["Bulgogi bowl · deliver to stay", "Bibimbap · deliver to stay"] },
  "coupang-eats-night": { ko: ["떡볶이 세트 · 숙소 배달", "김치찌개 · 숙소 배달"], en: ["Tteokbokki set · deliver to stay", "Kimchi stew · deliver to stay"] },
  "oliveyoung-pickup": { ko: ["홍대 타운점 · 선케어 세트", "연남점 · 선케어 세트"], en: ["Hongdae Town · sun-care set", "Yeonnam · sun-care set"] },
  "gs25-arrival-kit": { ko: ["연남 중앙점 · 도착 키트", "홍대입구점 · 도착 키트"], en: ["Yeonnam Central · arrival kit", "Hongdae Station · arrival kit"] },
}

export default function CommercialServiceDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { session, pay, hydrated } = useApp()
  const { lang } = useLang()
  const { location, status: locationStatus } = useNearbyLocation()
  const ko = lang === "ko"
  const service = commercialServiceById(params.id)
  const priorOrders = useExternalServiceOrders(session.identity?.did ?? "guest")
  const [step, setStep] = useState<Step>("detail")
  const [consented, setConsented] = useState(false)
  const [status, setStatus] = useState<ExternalOrderStatus | null>(null)
  const [receiptId, setReceiptId] = useState("")
  const [resultOrder, setResultOrder] = useState<ExternalServiceOrder | null>(null)
  const [choiceIndex, setChoiceIndex] = useState(0)
  const [listQuery, setListQuery] = useState("")
  const stageRef = useRef<HTMLElement>(null)
  const busy = useRef(false)
  const operationIdRef = useRef("")

  useEffect(() => {
    if (hydrated && !session.onboarded) router.replace("/onboarding")
    const query = new URLSearchParams(window.location.search)
    const list = new URLSearchParams()
    const category = query.get("category")
    const from = query.get("from")
    if (category) list.set("category", category)
    if (from) list.set("from", from)
    setListQuery(list.toString())
    if (query.get("preview") === "failed") {
      setReceiptId(`SIM-EXT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`)
      setStatus("failed")
      setStep("result")
    }
  }, [hydrated, router, session.onboarded])
  useEffect(() => { if (step !== "detail") requestAnimationFrame(() => stageRef.current?.focus()) }, [step])
  if (!session.onboarded) return null
  if (!service) return <PhoneFrame><PageHeader title={ko ? "서비스 상세" : "Service details"} back="/services" /><main className="px-6 py-20 text-center"><h1 className="font-display text-[26px] font-semibold">{ko ? "서비스를 찾지 못했어요" : "Service not found"}</h1><Link href="/services" className="mt-5 inline-flex min-h-11 items-center text-[13px] font-semibold text-primary underline underline-offset-4">{ko ? "생활 서비스로 돌아가기" : "Back to services"}</Link></main></PhoneFrame>

  const choices = CHOICES[service.id]?.[lang] ?? [service.option[lang]]
  const selectedChoice = choices[choiceIndex] ?? choices[0]
  const personaEligible = !!session.userType && service.benefitEligibleUserTypes.includes(session.userType)
  const benefitUsed = priorOrders.some((order) => order.status === "confirmed" && order.benefitId === service.benefitId && order.benefitAppliedKRW > 0)
  const benefitAvailable = personaEligible && !benefitUsed
  const benefitKRW = benefitAvailable ? service.benefitKRW : 0
  const finalKRW = service.grossKRW - benefitKRW
  const credentialAvailable = isCredentialUsable(session.capsule) && !!session.capsule?.services.includes(service.serviceKey)
  const withinLimit = finalKRW <= (session.capsule?.paymentLimitKRW ?? 0)
  const enoughBalance = session.wallet.balanceKRW >= finalKRW
  const listHref = `/services${listQuery ? `?${listQuery}` : ""}`
  const returnHref = `/services/${service.id}${listQuery ? `?${listQuery}` : ""}`
  const receiptStored = priorOrders.some((order) => order.id === receiptId)
  const locationDistanceKm = locationStatus === "granted" && location ? distanceKm(location, service.geo) : null
  const locationEligible = locationDistanceKm == null || locationDistanceKm <= service.coverageKm
  const locationContext = locationStatus === "granted" && location
    ? service.category === "delivery" ? (ko ? `${location.areaKo} 숙소로 배달` : `Delivery to your stay in ${location.areaEn}`)
      : service.category === "mobility" ? (ko ? `${location.areaKo} 주변에서 출발` : `Starting near ${location.areaEn}`)
        : (ko ? `${location.areaKo} 주변 매장` : `Stores near ${location.areaEn}`)
    : service.context[lang]

  const finish = async (requestedStatus: "confirmed" | "cancelled") => {
    if (busy.current) return
    busy.current = true
    setStep("processing")
    const did = session.identity?.did ?? "guest"
    const operationId = operationIdRef.current || crypto.randomUUID()
    operationIdRef.current = operationId
    const id = `SIM-EXT-${operationId.slice(0, 8).toUpperCase()}`
    const platformFeeKRW = Math.round(service.grossKRW * 0.015)
    const campaignReimbursementKRW = service.benefitFunding === "tourism-campaign" ? benefitKRW : 0
    const baseOrder: ExternalServiceOrder = {
      id, serviceId: service.id, provider: service.provider, title: service.title.ko, titleEn: service.title.en,
      optionLabel: CHOICES[service.id]?.ko[choiceIndex] ?? service.option.ko, optionLabelEn: CHOICES[service.id]?.en[choiceIndex] ?? service.option.en,
      category: service.category, status: "pending", integrationMode: "simulated", benefitId: service.benefitId,
      benefitFunding: service.benefitFunding, grossKRW: service.grossKRW, benefitAppliedKRW: benefitKRW,
      paidKRW: 0, platformFeeKRW, providerReceivableKRW: finalKRW + campaignReimbursementKRW - platformFeeKRW,
      settlementStatus: "pending", createdAt: new Date().toISOString(),
    }
    try {
      if (!reserveExternalOrder(did, baseOrder)) throw new Error("ORDER_STORAGE_OR_BENEFIT_UNAVAILABLE")
      let resolvedStatus: ExternalOrderStatus = requestedStatus
      if (requestedStatus === "confirmed") {
        const stillEligible = isCredentialUsable(session.capsule) && !!session.capsule?.services.includes(service.serviceKey) && finalKRW <= (session.capsule?.paymentLimitKRW ?? 0)
        const paid = stillEligible && locationEligible && await pay(service.provider, finalKRW, service.serviceKey, operationId)
        if (!paid) resolvedStatus = "failed"
      }
      const finalOrder = { ...baseOrder, status: resolvedStatus, paidKRW: resolvedStatus === "confirmed" ? finalKRW : 0, benefitAppliedKRW: resolvedStatus === "confirmed" ? benefitKRW : 0, providerReceivableKRW: resolvedStatus === "confirmed" ? baseOrder.providerReceivableKRW : 0 }
      if (!saveExternalOrder(did, finalOrder)) resolvedStatus = "pending"
      await new Promise((resolve) => setTimeout(resolve, 650))
      setResultOrder(resolvedStatus === "pending" ? baseOrder : finalOrder)
      setReceiptId(id)
      setStatus(resolvedStatus)
      setStep("result")
    } catch {
      setResultOrder({ ...baseOrder, status: "failed", benefitAppliedKRW: 0, providerReceivableKRW: 0 })
      setReceiptId(id)
      setStatus("failed")
      setStep("result")
    } finally { busy.current = false }
  }

  const reset = () => { setStep("detail"); setConsented(false); setStatus(null); setReceiptId(""); setResultOrder(null); operationIdRef.current = "" }
  const hideNav = step === "handoff" || step === "processing"

  return (
    <PhoneFrame hideNav={hideNav}>
      <p className="sr-only" role="status" aria-live="polite">{step === "consent" ? (ko ? "정보 전달 확인 단계" : "Information sharing review") : step === "handoff" ? (ko ? "연결 서비스 단계" : "Connected service step") : step === "processing" ? (ko ? "이용 결과 확인 중" : "Checking the result") : step === "result" ? (ko ? "이용 결과" : "Service result") : ""}</p>
      {step === "detail" ? <PageHeader title={ko ? "서비스 상세" : "Service details"} back={listHref} right={<LangToggle />} /> : <header className="safe-top flex items-center justify-between px-5 pb-3"><button type="button" onClick={() => step === "consent" ? setStep("detail") : step === "handoff" ? setStep("consent") : router.push(listHref)} className="pressable min-h-11 text-[13px] font-semibold text-muted-foreground">{ko ? "이전" : "Back"}</button><strong className="text-[15px]">{service.name[lang]}</strong><LangToggle /></header>}
      <main ref={stageRef} tabIndex={-1} className="pb-8 outline-none">
        {step === "detail" && <>
          <section className="px-6 pt-4">
            <div className="flex items-start justify-between"><BrandMark brand={service.brand} size={58} decorative /><span className="rounded-full bg-secondary px-2.5 py-1.5 text-[12px] font-semibold text-muted-foreground">{ko ? "연결 예시" : "Connection preview"}</span></div>
            <p className="mt-5 text-[12px] font-semibold text-primary">{service.name[lang]}</p>
            <h1 className="font-display text-balance mt-2 text-[31px] font-semibold leading-[1.2] tracking-[-0.035em]">{service.title[lang]}</h1>
            <p className="mt-3 text-[14px] leading-6 text-muted-foreground">{service.description[lang]}</p>
            <div className="mt-6 space-y-3 border-y border-foreground/10 py-5"><Fact icon={MapPin} label={locationContext} /><Fact icon={Check} label={selectedChoice} /><Fact icon={ExternalLink} label={service.fulfilment[lang]} /></div>
          </section>
          <section className="mt-8 px-6"><p className="text-[12px] font-semibold text-primary">01 · {ko ? "이용 조건" : "Service option"}</p><label className="mt-3 block text-[13px] font-semibold" htmlFor="service-choice">{service.category === "mobility" ? (ko ? "출발·개시 조건" : "Start option") : service.category === "delivery" ? (ko ? "메뉴·배달지" : "Meal & delivery") : (ko ? "매장·픽업 상품" : "Store & pickup")}</label><select id="service-choice" value={choiceIndex} onChange={(event) => setChoiceIndex(Number(event.target.value))} className="mt-2 min-h-14 w-full rounded-[14px] border border-foreground/12 bg-card px-4 text-[14px] font-semibold">{choices.map((choice, index) => <option key={choice} value={index}>{choice}</option>)}</select></section>
          <section className="mt-8 px-6"><p className="text-[12px] font-semibold text-primary">02 · {ko ? "혜택·예상 결제액" : "Benefit & estimated total"}</p><div className="mt-3 rounded-[20px] bg-card p-5 ring-1 ring-border"><div className="flex items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-full ${benefitAvailable ? "bg-success-surface text-success" : "bg-secondary text-muted-foreground"}`}><BadgeCheck className="h-5 w-5" /></span><div><strong className="text-[14px]">{benefitAvailable ? service.benefit[lang] : benefitUsed ? (ko ? "혜택 사용 완료" : "Benefit already used") : (ko ? "현재 K-Tour ID의 혜택 대상 아님" : "Not eligible with this K-Tour ID")}</strong><p className="mt-1 text-[12px] text-muted-foreground">{benefitAvailable ? (ko ? "한 번만 사용할 수 있어요" : "Available once") : (ko ? "정상 예상가로 계속 이용 가능" : "You can continue at the regular estimated price")}</p></div></div><div className="mt-5 space-y-2 border-t border-foreground/10 pt-4 text-[13px]"><Price label={ko ? "서비스 예상가" : "Estimated service price"} value={service.grossKRW} />{benefitKRW > 0 && <Price label={ko ? "K-Tour ID 혜택" : "K-Tour ID benefit"} value={-benefitKRW} success />}<div className="mt-3 flex items-end justify-between border-t border-foreground/10 pt-4"><strong>{ko ? "예상 결제액" : "Estimated total"}</strong><strong className="font-display tabular text-[30px]">₩{finalKRW.toLocaleString()}</strong></div></div></div></section>
          <section className="mt-8 px-6"><p className="text-[12px] font-semibold text-primary">03 · {ko ? "이용 준비" : "Ready to continue"}</p><div className="mt-3 divide-y divide-foreground/10 border-y border-foreground/10"><StatusRow icon={BadgeCheck} title="K-Tour ID" detail={!withinLimit ? (ko ? "1회 결제 한도 초과" : "Over the per-payment limit") : credentialAvailable ? (ko ? "사용 가능" : "Active") : (ko ? "갱신 또는 이용 권한 확인 필요" : "Renewal or service access needed")} ok={credentialAvailable && withinLimit} /><StatusRow icon={MapPin} title={ko ? "이용 지역" : "Service area"} detail={locationEligible ? locationContext : (ko ? `현재 위치에서 약 ${Math.round(locationDistanceKm ?? 0)}km · 이용 범위 밖` : `About ${Math.round(locationDistanceKm ?? 0)}km away · outside service area`)} ok={locationEligible} /><StatusRow icon={Wallet} title={ko ? "여행 잔액" : "Travel balance"} detail={`₩${session.wallet.balanceKRW.toLocaleString()}`} ok={enoughBalance} /></div></section>
          <div className="sticky bottom-[76px] mt-8 bg-background/94 px-6 py-3 backdrop-blur-xl">{!locationEligible ? <Link href="/services" className="pressable flex min-h-14 items-center justify-between rounded-[14px] bg-secondary px-5 text-[15px] font-semibold">{ko ? "현재 위치에서 가능한 서비스 보기" : "See services available near you"}<ArrowRight className="h-5 w-5" /></Link> : !credentialAvailable || !withinLimit ? <Link href={`/onboarding?mode=renew&returnTo=${encodeURIComponent(returnHref)}`} className="pressable flex min-h-14 items-center justify-between rounded-[14px] bg-primary px-5 text-[15px] font-semibold text-white">{ko ? "K-Tour ID 확인하고 돌아오기" : "Review K-Tour ID and return"}<ArrowRight className="h-5 w-5" /></Link> : !enoughBalance ? <Link href={`/wallet?topup=1&requiredKRW=${finalKRW}&returnTo=${encodeURIComponent(returnHref)}`} className="pressable flex min-h-14 items-center justify-between rounded-[14px] bg-primary px-5 text-[15px] font-semibold text-white">{ko ? `₩${(finalKRW - session.wallet.balanceKRW).toLocaleString()} 이상 충전` : `Top up at least ₩${(finalKRW - session.wallet.balanceKRW).toLocaleString()}`}<ArrowRight className="h-5 w-5" /></Link> : <button type="button" onClick={() => { operationIdRef.current ||= crypto.randomUUID(); setStep("consent") }} className="pressable flex min-h-14 w-full items-center justify-between rounded-[14px] bg-primary px-5 text-[15px] font-semibold text-white">{ko ? `${service.name.ko}에서 이어가기` : `Continue with ${service.name.en}`}<ArrowRight className="h-5 w-5" /></button>}</div>
        </>}

        {step === "consent" && <section className="px-6 pt-6"><p className="text-[12px] font-semibold text-primary">{ko ? "외부 서비스로 이동하기 전" : "BEFORE YOU CONTINUE"}</p><h1 className="font-display text-balance mt-2 text-[29px] font-semibold leading-tight">{ko ? "보내는 정보만 확인해 주세요" : "Review only what will be shared"}</h1><p className="mt-3 text-[14px] leading-6 text-muted-foreground">{ko ? `${service.name.ko}에서 이용을 이어가기 위해 아래 정보만 한 번 전달해요.` : `These details are shared once so you can continue with ${service.name.en}.`}</p><div className="mt-6 rounded-[20px] bg-card p-5 ring-1 ring-border"><SharedRow label={ko ? "이용 내용" : "Service details"} value={selectedChoice} /><SharedRow label={ko ? "혜택 확인" : "Benefit proof"} value={benefitKRW > 0 ? (ko ? "대상 여부만 · 원본 ID 제외" : "Eligibility only · no raw ID") : (ko ? "전달하지 않음" : "Not shared")} /><SharedRow label={ko ? "예상 결제액" : "Estimated total"} value={`₩${finalKRW.toLocaleString()}`} /><SharedRow label={ko ? "보관" : "Retention"} value={ko ? "전달용 임시 정보는 삭제 · 이용 내역은 지갑에 보관" : "Temporary handoff data deleted · service record kept in Wallet"} last /></div><div className="mt-5 flex items-start gap-3 rounded-[18px] bg-success-surface p-4 text-success"><ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0" /><p className="text-[12px] leading-5">{ko ? "이름·여권 정보·신분증 원본은 보내지 않아요. 제휴와 실제 결제 연동 전의 연결 예시입니다." : "Name, passport data, and original ID documents are not shared. This is a connection preview before live partnership and payment."}</p></div><label className="pressable mt-5 flex min-h-14 cursor-pointer items-center gap-3 border-y border-foreground/10 py-3 text-[13px] font-semibold"><input type="checkbox" checked={consented} onChange={(event) => setConsented(event.target.checked)} className="h-5 w-5 accent-[var(--primary)]" />{ko ? "위 정보를 보내고 이용을 이어갈게요" : "Share these details and continue"}</label><button type="button" disabled={!consented} onClick={() => setStep("handoff")} className="pressable mt-6 flex min-h-14 w-full items-center justify-between rounded-[14px] bg-primary px-5 text-[15px] font-semibold text-white disabled:opacity-40">{ko ? `${service.name.ko} 열기` : `Open ${service.name.en}`}<ExternalLink className="h-5 w-5" /></button></section>}

        {step === "handoff" && <section className="px-6 pt-6"><div className="mx-auto flex max-w-[330px] flex-col items-center text-center"><BrandMark brand={service.brand} size={72} decorative /><p className="mt-5 rounded-full bg-secondary px-2.5 py-1 text-[12px] font-semibold text-muted-foreground">{ko ? "연결 예시" : "Connection preview"}</p><h1 className="font-display mt-3 text-[28px] font-semibold">{service.name[lang]}</h1><p className="mt-2 text-[14px] leading-6 text-muted-foreground">{service.title[lang]}<br />{selectedChoice}</p></div><div className="mt-8 rounded-[24px] bg-white p-5 shadow-[0_12px_32px_rgba(25,24,22,.08)] ring-1 ring-border"><p className="text-[12px] text-muted-foreground">{ko ? "예상 결제액" : "Estimated total"}</p><div className="mt-1 flex items-end justify-between"><strong className="font-display tabular text-[31px]">₩{finalKRW.toLocaleString()}</strong>{benefitKRW > 0 && <span className="rounded-full bg-success-surface px-2.5 py-1 text-[12px] font-semibold text-success">K-Tour ID −₩{benefitKRW.toLocaleString()}</span>}</div></div><div className="mt-6 space-y-2"><button type="button" onClick={() => finish("confirmed")} className="pressable flex min-h-14 w-full items-center justify-between rounded-[14px] bg-ink px-5 text-[15px] font-semibold text-white">{ko ? "이용 완료 후 돌아오기" : "Complete and return"}<ArrowRight className="h-5 w-5" /></button><button type="button" onClick={() => finish("cancelled")} className="pressable flex min-h-12 w-full items-center justify-between rounded-[14px] bg-secondary px-5 text-[13px] font-semibold">{ko ? "취소하고 돌아오기" : "Cancel and return"}<ChevronRight className="h-4 w-4" /></button><button type="button" onClick={() => { setResultOrder(null); setReceiptId(`SIM-EXT-${operationIdRef.current.slice(0, 8).toUpperCase()}`); setStatus("failed"); setStep("result") }} className="pressable min-h-11 w-full text-[12px] text-muted-foreground underline underline-offset-4">{ko ? "연결에 문제가 있으면 K-Tour ID로 돌아가기" : "Return to K-Tour ID if the connection fails"}</button></div></section>}

        {step === "processing" && <section role="status" aria-live="polite" aria-busy="true" className="grid min-h-[65vh] place-items-center px-6 text-center"><div><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /><h1 className="font-display mt-5 text-[25px] font-semibold">{ko ? "이용 결과를 확인하고 있어요" : "Checking the result"}</h1><p className="mt-2 text-[13px] text-muted-foreground">{ko ? "같은 요청은 한 번만 반영해요." : "Each request is applied only once."}</p></div></section>}

        {step === "result" && status && <section role="status" aria-live="polite" className="px-6 pt-10 text-center"><span className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${status === "confirmed" ? "bg-success-surface text-success" : status === "cancelled" ? "bg-secondary text-muted-foreground" : status === "pending" ? "bg-[#f6ecd6] text-[#7b5b20]" : "bg-primary/8 text-primary"}`}>{status === "confirmed" ? <Check className="h-8 w-8" /> : status === "cancelled" ? <RotateCcw className="h-7 w-7" /> : status === "pending" ? <Clock3 className="h-7 w-7" /> : <CircleAlert className="h-7 w-7" />}</span><p className="mt-5 text-[12px] font-semibold text-primary">{service.name[lang]} · {ko ? "연결 예시" : "Connection preview"}</p><h1 className="font-display mt-2 text-[29px] font-semibold">{status === "confirmed" ? (ko ? "이용이 확인됐어요" : "Service confirmed") : status === "cancelled" ? (ko ? "이용을 취소했어요" : "Service cancelled") : status === "pending" ? (ko ? "결과 확인이 필요해요" : "Result needs review") : (ko ? "연결을 완료하지 못했어요" : "Connection wasn't completed")}</h1><p className="mx-auto mt-3 max-w-[330px] text-[13px] leading-6 text-muted-foreground">{status === "confirmed" ? (ko ? "시나리오 잔액과 이용 내역에 반영했어요. 실제 연동 시 제공자 응답으로 상태가 갱신됩니다." : "The scenario balance and service history are updated. Live integration would refresh this from the provider response.") : status === "cancelled" ? (ko ? "결제되거나 혜택이 사용되지 않았어요." : "Nothing was charged and no benefit was used.") : status === "pending" ? (ko ? "요청은 보관됐지만 최종 상태를 저장하지 못했어요. 이용 내역에서 다시 확인해 주세요." : "The request is stored, but its final state needs review. Check the service receipt.") : (ko ? "결제되거나 혜택이 사용되지 않았어요. 연결 상태를 확인한 뒤 다시 시도해 주세요." : "Nothing was charged and no benefit was used. Check the connection and retry.")}</p><div className="mt-7 rounded-[20px] bg-card p-5 text-left ring-1 ring-border"><SharedRow label={ko ? "상태" : "Status"} value={status === "confirmed" ? (ko ? "연결 예시 · 이용 확인" : "Preview · confirmed") : status === "cancelled" ? (ko ? "연결 예시 · 취소" : "Preview · cancelled") : status === "pending" ? (ko ? "연결 예시 · 확인 필요" : "Preview · review needed") : (ko ? "연결 예시 · 실패" : "Preview · failed")} /><SharedRow label={ko ? "결제 금액" : "Amount charged"} value={status === "pending" ? (ko ? "확인 필요" : "Review needed") : `₩${(status === "confirmed" ? (resultOrder?.paidKRW ?? 0) : 0).toLocaleString()}`} /><SharedRow label={ko ? "참조 번호" : "Reference"} value={receiptId} last /></div><div className="mt-7 space-y-2">{status !== "confirmed" && status !== "pending" && <button type="button" onClick={reset} className="pressable flex min-h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-primary text-[15px] font-semibold text-white"><RotateCcw className="h-4 w-4" />{ko ? "다시 시도" : "Try again"}</button>}{receiptStored ? <Link href={`/services/orders/${receiptId}`} className="pressable flex min-h-13 w-full items-center justify-center gap-2 rounded-[14px] bg-secondary text-[14px] font-semibold"><Wallet className="h-4 w-4" />{ko ? "이용 내역 보기" : "View service receipt"}</Link> : <Link href="/wallet" className="pressable flex min-h-13 w-full items-center justify-center gap-2 rounded-[14px] bg-secondary text-[14px] font-semibold"><Wallet className="h-4 w-4" />{ko ? "ID·지갑 확인" : "Check ID · Wallet"}</Link>}<Link href={listHref} className="pressable inline-flex min-h-11 items-center text-[13px] font-semibold text-muted-foreground underline underline-offset-4">{ko ? "다른 서비스 보기" : "Browse other services"}</Link></div></section>}
      </main>
    </PhoneFrame>
  )
}

function Fact({ icon: Icon, label }: { icon: typeof MapPin; label: string }) { return <div className="flex items-start gap-2.5 text-[13px]"><Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" /><span className="leading-5 text-muted-foreground">{label}</span></div> }
function Price({ label, value, success = false }: { label: string; value: number; success?: boolean }) { return <div className="flex justify-between gap-4"><span className="text-muted-foreground">{label}</span><span className={`tabular font-semibold ${success ? "text-success" : ""}`}>{value < 0 ? "−" : ""}₩{Math.abs(value).toLocaleString()}</span></div> }
function StatusRow({ icon: Icon, title, detail, ok }: { icon: typeof Wallet; title: string; detail: string; ok: boolean }) { return <div className="flex min-h-[70px] items-center gap-3 py-3"><span className={`grid h-9 w-9 place-items-center rounded-full ${ok ? "bg-success-surface text-success" : "bg-primary/8 text-primary"}`}><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><strong className="text-[13px]">{title}</strong><p className="mt-1 text-[12px] text-muted-foreground">{detail}</p></div>{ok ? <Check className="h-4 w-4 text-success" /> : <CircleAlert className="h-4 w-4 text-primary" />}</div> }
function SharedRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) { return <div className={`flex items-start justify-between gap-4 py-3 text-[12px] ${last ? "" : "border-b border-foreground/10"}`}><span className="flex-shrink-0 text-muted-foreground">{label}</span><strong className="max-w-[67%] text-right leading-5">{value}</strong></div> }
