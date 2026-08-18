"use client"

import { useState } from "react"
import { AlertTriangle, Check, CreditCard, MapPin, ReceiptText, ShieldCheck } from "lucide-react"
import { acceptUniqueMilestoneVisit } from "../rewards/reward-model"
import { useOndo } from "../shared/state/ondo-provider"
import { InlineNotice, Sheet } from "../shared/ui/sheet"
import { beginCheckout, finishCheckout, isReadOnlySettlement, processCheckout, type CheckoutSnapshot } from "./commerce-model"
import styles from "./commerce.module.css"

const VENUE_PRICE: Record<string, number> = {
  "seoul-seongsu-gukbap": 12_000,
  "seoul-euljiro-nogari": 18_000,
  "seoul-mangwon-kalguksu": 9_000,
  "busan-jagalchi-grill": 22_000,
}

export function CheckoutOverlay({ venueId }: { venueId: string }) {
  const { state, actions } = useOndo()
  const locale = state.locale
  const [checkout, setCheckout] = useState<CheckoutSnapshot>({
    venueId,
    displayPriceKRW: VENUE_PRICE[venueId] ?? 18_000,
    settlementToken: "OOKRW",
    settlementTruth: "SIMULATED",
    payment: "PAY-IDLE",
    stampCount: state.stamps,
  })
  const [visitState, setVisitState] = useState<"idle" | "checking" | "accepted" | "duplicate">("idle")
  const ready = state.account === "ACC-ACTIVE" && state.paymentKyc === "PKY-VERIFIED"

  function start() {
    if (!ready) {
      actions.beginAction({ cta: "START_CHECKOUT", gates: ["account", "payment_kyc"], venueId })
      return
    }
    setCheckout((current) => beginCheckout(current))
  }

  function confirm() {
    setCheckout((current) => processCheckout(current))
    window.setTimeout(() => {
      const scenario = new URLSearchParams(window.location.search).get("scenario")
      setCheckout((current) => finishCheckout(current, scenario === "payment-declined" ? "failure" : "success"))
    }, 520)
  }

  function cancel() {
    setCheckout((current) => finishCheckout(current.payment === "PAY-IDLE" ? beginCheckout(current) : current, "cancel"))
  }

  function verifyVisit() {
    setVisitState("checking")
    window.setTimeout(() => {
      const evidenceId = `visit-proof:${venueId}:2026-08-19`
      const accepted = acceptUniqueMilestoneVisit(evidenceId)
      if (accepted && state.stamps === 9) actions.setStamps(10)
      setVisitState(accepted ? "accepted" : "duplicate")
    }, 420)
  }

  return (
    <Sheet label={locale === "ko" ? "결제 시뮬레이션" : "Checkout simulation"} onClose={() => actions.setSurface({ kind: "venue", venueId })} size="full">
      <div className={styles.body} data-payment-state={checkout.payment} data-payment-kyc={state.paymentKyc} data-stamp-count={state.stamps} data-testid="checkout-overlay">
        <p className={styles.eyebrow}>CHECKOUT · SIMULATED</p>
        <h2>{locale === "ko" ? "결제 시뮬레이션" : "Checkout simulation"}</h2>
        <InlineNotice tone="neutral"><ShieldCheck size={18} /><span>{locale === "ko" ? "실제 결제나 자산 이동이 발생하지 않습니다. 결제용 KYC는 사람 확인·19+와 별도입니다." : "No real payment or asset movement occurs. Payment KYC is separate from person and 19+ checks."}</span></InlineNotice>

        <div className={styles.priceCard}>
          <div><MapPin size={18} /><span>{locale === "ko" ? "장소 표시 가격" : "Venue display price"}</span></div>
          <strong>₩{checkout.displayPriceKRW.toLocaleString()}</strong>
          <small>KRW</small>
        </div>

        <div className={styles.settlement} data-read-only={isReadOnlySettlement(checkout)}>
          <div><ReceiptText size={18} /><strong>{locale === "ko" ? "읽기 전용 정산 가설" : "Read-only settlement hypothesis"}</strong></div>
          <span>OOKRW test token · Simulated</span>
          <p>{locale === "ko" ? "OOKRW는 실제 원화 결제, 상환 또는 1:1 가치를 보증하지 않습니다." : "OOKRW does not guarantee real KRW payment, redemption, or 1:1 value."}</p>
        </div>

        <div className={styles.kycRow}>
          <div><CreditCard size={18} /><span>{locale === "ko" ? "결제용 KYC" : "Payment KYC"}</span></div>
          <strong>{state.paymentKyc === "PKY-VERIFIED" ? locale === "ko" ? "확인됨 · 시뮬레이션" : "Complete · Simulated" : locale === "ko" ? "별도 확인 필요" : "Separate check required"}</strong>
        </div>

        {checkout.payment === "PAY-IDLE" ? <button type="button" className={styles.primary} onClick={start} data-testid="checkout-start">{ready ? locale === "ko" ? "시뮬레이션 확인" : "Confirm simulation" : locale === "ko" ? "결제용 KYC부터 계속" : "Continue with Payment KYC"}</button> : null}
        {checkout.payment === "PAY-CONFIRMING" ? <><button type="button" className={styles.primary} onClick={confirm} data-testid="checkout-confirm">{locale === "ko" ? "이 내용으로 시뮬레이션" : "Run this simulation"}</button><button type="button" className={styles.secondary} onClick={cancel} data-testid="checkout-cancel">{locale === "ko" ? "취소" : "Cancel"}</button></> : null}
        {checkout.payment === "PAY-PROCESSING" ? <button type="button" className={styles.primary} disabled>{locale === "ko" ? "처리 중" : "Processing"}</button> : null}
        {checkout.payment === "PAY-FAILED" ? <><InlineNotice tone="danger"><AlertTriangle size={18} /><span>{locale === "ko" ? "시뮬레이션을 완료하지 못했어요. Receipt, 잔고와 스탬프는 바뀌지 않았습니다." : "The simulation could not be completed. Receipt, balances, and stamps did not change."}</span></InlineNotice><button type="button" className={styles.primary} onClick={() => setCheckout((current) => beginCheckout(current))}>{locale === "ko" ? "다시 시도" : "Try again"}</button></> : null}
        {checkout.payment === "PAY-CANCELLED" ? <><InlineNotice tone="neutral"><span>{locale === "ko" ? "시뮬레이션을 취소했어요. 아무 상태도 바뀌지 않았습니다." : "Simulation cancelled. No balances, receipts, or stamps changed."}</span></InlineNotice><button type="button" className={styles.primary} onClick={() => setCheckout((current) => beginCheckout(current))}>{locale === "ko" ? "다시 열기" : "Open again"}</button></> : null}

        {checkout.payment === "PAY-SIMULATED-SUCCESS" ? (
          <section className={styles.receipt} data-testid="checkout-receipt">
            <Check size={22} />
            <div><strong>{locale === "ko" ? "시뮬레이션이 완료됐어요." : "Simulation complete."}</strong><span>{locale === "ko" ? "실제 결제는 발생하지 않았습니다." : "No real payment occurred."}</span></div>
            <code>{checkout.receiptId}</code>
          </section>
        ) : null}

        {checkout.payment === "PAY-SIMULATED-SUCCESS" ? (
          <div className={styles.visitProof}>
            <p><strong>{locale === "ko" ? `방문 스탬프 ${state.stamps}/10` : `Visit stamps ${state.stamps}/10`}</strong><span>{locale === "ko" ? "결제 결과만으로 방문 스탬프는 늘어나지 않아요." : "A payment result alone does not add a visit stamp."}</span></p>
            {state.stamps < 10 ? <button type="button" className={styles.secondary} onClick={verifyVisit} disabled={visitState === "checking"} data-testid="visit-proof-check">{visitState === "checking" ? locale === "ko" ? "현장 방문 확인 중" : "Checking on-site visit" : locale === "ko" ? "별도 현장 방문 확인" : "Check separate on-site visit"}</button> : null}
            {visitState === "accepted" ? <InlineNotice tone="success"><Check size={18} /><span>{locale === "ko" ? "이번 현장 방문의 중복되지 않은 증거로 열 번째 스탬프를 남겼어요." : "A unique proof from this on-site visit recorded your tenth stamp."}</span></InlineNotice> : null}
            {state.stamps === 10 && visitState !== "accepted" ? <InlineNotice tone="neutral"><Check size={18} /><span>{locale === "ko" ? "열 번째 방문은 이전에 별도 확인되어 있습니다." : "The tenth visit was confirmed separately before this checkout."}</span></InlineNotice> : null}
            {visitState === "duplicate" ? <InlineNotice tone="warm"><AlertTriangle size={18} /><span>{locale === "ko" ? "이미 사용한 방문 증거라 스탬프가 다시 늘지 않았어요." : "This visit proof was already used, so the stamp did not increase again."}</span></InlineNotice> : null}
          </div>
        ) : null}

        <button type="button" className={styles.textButton} onClick={() => actions.setSurface({ kind: "venue", venueId })}>{locale === "ko" ? "장소로 돌아가기" : "Return to venue"}</button>
      </div>
    </Sheet>
  )
}
