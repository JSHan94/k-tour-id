"use client"

import type { KeyboardEvent, ReactNode } from "react"
import { useEffect, useReducer, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  AlertTriangle,
  BadgeCheck,
  Bot,
  ChevronRight,
  CircleDollarSign,
  Link2,
  ReceiptText,
  RefreshCcw,
  RotateCcw,
  ShieldCheck,
  TicketCheck,
  WalletCards,
  X,
} from "lucide-react"
import { useOndoB } from "../shared/state/ondo-b-provider"
import { useModalIsolation } from "../shared/ui/use-modal-isolation"
import { canonicalMapVenueById } from "@/lib/ondo/venues/map-data"
import { venueDisplayName } from "@/lib/ondo/venues/display"
import {
  createStableCommerceBState,
  STABLE_B_KRW_PRICE,
  STABLE_B_OPENING_BALANCE,
  STABLE_B_RECEIPT_ID,
  stableCommerceBalanceB,
  stableCommerceBreakdownB,
  stableCommerceBReducer,
  stableCommerceQuoteDebitB,
  stableCommerceSettlementB,
} from "./stable-commerce-model-b"
import styles from "./id-wallet-commerce-b.module.css"

type Locale = "en" | "ko"
type WalletStatus = "disconnected" | "failed" | "ready"
type CheckoutPhase = "review" | "outcome" | "failure" | "insufficient" | "receipt"
type AiChoice = "unreviewed" | "accepted" | "declined"

const FOCUSABLE = "button:not([disabled]),input:not([disabled]),[href],select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])"

const COPY = {
  en: {
    eyebrow: "LOCAL ID · WALLET",
    title: "Wallet and stable payment",
    body: "Link a local wallet walkthrough, review an ONDO offer, and inspect both sides of one settlement without moving money.",
    linkTitle: "Wallet link",
    disconnected: "Not linked",
    failed: "Link failed — nothing changed",
    ready: "Ready in this screen",
    link: "Link local wallet",
    retry: "Retry wallet link",
    disconnect: "Disconnect",
    assetTitle: "Local asset view",
    balance: "Available balance",
    priceTruth: "KRW display price",
    balanceTruth: "OOKRW read-only local demo balance",
    offerEyebrow: "SEPARATE FROM OFFICIAL PLACE FACTS",
    offerTitle: "Try ONDO demo meal offer",
    offerBody: "This is an ONDO demo merchant offer. It does not claim that any LOCALDATA place accepts payment, OOKRW, or this benefit.",
    offerCta: "Review offer and payment",
    linkFirst: "Link the local wallet first",
    originEyebrow: "RETURN CONTEXT",
    originBody: "Opened from {place}. The official place record remains unchanged; this offer is a separate ONDO walkthrough.",
    originReturn: "Return to exact place",
    boundaryTitle: "Local commerce boundary",
    boundaryBody: "No provider, chain, merchant, or asset transfer is connected. Every wallet, balance, payment, voucher, refund, and settlement result below is a user-chosen in-memory walkthrough.",
    boundaryKeep: "Only the fact that you saw this notice is kept in this browser. Commerce results reset when you leave ID · Wallet or refresh.",
    boundaryContinue: "I understand — continue",
    boundaryError: "This browser could not remember the notice. Nothing was sent. Check device storage and try again.",
    linkDialog: "Choose wallet link return",
    linkDialogBody: "Choose the local return you want to review. No wallet app or provider is contacted.",
    linkReady: "Return wallet ready",
    linkFailure: "Return link failed",
    close: "Close",
    paymentReview: "Payment review",
    merchant: "ONDO demo merchant offer · Seochon meal",
    price: "Price",
    settlementAsset: "Walkthrough settlement",
    noMerchantClaim: "Not attached to a LOCALDATA place record",
    aiTitle: "AI Benefit preview",
    aiRule: "Disclosed local rule: when a meal is at least ₩20,000 and a one-use voucher is available, recommend applying ₩3,000. No AI model or provider is called.",
    aiAccept: "Accept recommendation",
    aiDecline: "Decline recommendation",
    aiAccepted: "Recommendation accepted",
    aiDeclined: "Recommendation declined",
    voucherAvailable: "One-use voucher · available",
    voucherSelected: "One-use voucher · selected",
    voucherToggleOn: "Apply ₩3,000 voucher",
    voucherToggleOff: "Remove voucher",
    minimumTitle: "Minimum consent",
    requester: "Requester",
    purpose: "Purpose",
    minimum: "Minimum shared result",
    retention: "Retention",
    purposeBody: "Calculate this one local offer and create its paired receipt mirrors.",
    minimumBody: "Wallet-ready and benefit-selected predicates only — no identity, age, DID, address, or raw claim.",
    retentionBody: "Consent, claim, origin, receipt, and result stay only in memory on this screen and are not transmitted.",
    consent: "I approve this minimum local request",
    confirm: "Confirm local payment",
    cancel: "Cancel and return to the offer",
    chooseOutcome: "Choose the payment return",
    chooseOutcomeBody: "The confirm action is idempotent. Choose one local rail return; only one debit and one receipt can be created.",
    success: "Return success",
    failure: "Return failure",
    insufficient: "Return insufficient balance",
    failedTitle: "Payment failed",
    failedBody: "No balance, voucher, or settlement changed. Retry returns to the same review.",
    insufficientTitle: "Insufficient balance",
    insufficientBody: "No debit occurred. Retry keeps the same offer and consent context.",
    paymentRetry: "Retry payment",
    receiptTitle: "Stable local receipt",
    paid: "Paid locally",
    refunded: "Refunded locally",
    holder: "Holder settlement mirror",
    merchantMirror: "Merchant settlement mirror",
    openingBalance: "Opening balance",
    debit: "Single debit",
    closingBalance: "Closing balance",
    gross: "Gross offer",
    benefit: "Voucher benefit",
    net: "Net settlement",
    voucherConsumed: "Consumed once",
    voucherRestored: "Restored after refund",
    voucherRefundPolicy: "Refund restores the OOKRW walkthrough debit to 60 and restores the one-use voucher to available with redemption count 0.",
    refund: "Refund local payment",
    returnOffer: "Return to ID · Wallet offer",
  },
  ko: {
    eyebrow: "로컬 ID · 지갑",
    title: "지갑과 스테이블 결제",
    body: "돈을 이동하지 않고 로컬 지갑 연결, ONDO 혜택 결제, 양쪽 정산 미러를 살펴보세요.",
    linkTitle: "지갑 연결",
    disconnected: "연결 안 됨",
    failed: "연결 실패 — 변경 없음",
    ready: "이 화면에서 준비됨",
    link: "로컬 지갑 연결",
    retry: "지갑 연결 다시 시도",
    disconnect: "연결 해제",
    assetTitle: "로컬 자산 보기",
    balance: "사용 가능 잔액",
    priceTruth: "KRW 표시 가격",
    balanceTruth: "OOKRW 읽기 전용 로컬 데모 잔액",
    offerEyebrow: "공식 장소 정보와 분리",
    offerTitle: "ONDO 데모 식사 혜택 체험",
    offerBody: "ONDO 데모 가맹점 혜택입니다. 어떤 LOCALDATA 장소가 결제·OOKRW·이 혜택을 지원한다고 주장하지 않습니다.",
    offerCta: "혜택과 결제 확인",
    linkFirst: "먼저 로컬 지갑을 연결하세요",
    originEyebrow: "돌아갈 맥락",
    originBody: "{place}에서 열었습니다. 공식 장소 기록은 바뀌지 않으며 이 혜택은 별도 ONDO 둘러보기입니다.",
    originReturn: "정확한 장소로 돌아가기",
    boundaryTitle: "로컬 결제 경계",
    boundaryBody: "실제 공급자·체인·가맹점·자산 전송은 연결되지 않았습니다. 아래 지갑·잔액·결제·바우처·환불·정산 결과는 모두 사용자가 고르는 메모리 내 둘러보기입니다.",
    boundaryKeep: "이 안내를 봤다는 사실만 이 브라우저에 저장합니다. ID · 지갑을 벗어나거나 새로고침하면 결제 결과가 초기화됩니다.",
    boundaryContinue: "이해했어요 — 계속",
    boundaryError: "이 브라우저에 안내 확인을 저장하지 못했어요. 전송된 정보는 없습니다. 기기 저장 공간을 확인하고 다시 시도하세요.",
    linkDialog: "지갑 연결 반환 선택",
    linkDialogBody: "살펴볼 로컬 반환을 직접 고르세요. 지갑 앱이나 공급자를 호출하지 않습니다.",
    linkReady: "지갑 준비로 반환",
    linkFailure: "연결 실패로 반환",
    close: "닫기",
    paymentReview: "결제 확인",
    merchant: "ONDO 데모 가맹점 혜택 · 서촌 한 끼",
    price: "가격",
    settlementAsset: "둘러보기 정산",
    noMerchantClaim: "LOCALDATA 장소 기록과 연결되지 않음",
    aiTitle: "AI 혜택 미리보기",
    aiRule: "공개된 로컬 규칙: 식사 가격이 ₩20,000 이상이고 1회용 바우처가 있으면 ₩3,000 적용을 추천합니다. AI 모델이나 공급자는 호출하지 않습니다.",
    aiAccept: "추천 수락",
    aiDecline: "추천 거절",
    aiAccepted: "추천을 수락했어요",
    aiDeclined: "추천을 거절했어요",
    voucherAvailable: "1회용 바우처 · 사용 가능",
    voucherSelected: "1회용 바우처 · 선택됨",
    voucherToggleOn: "₩3,000 바우처 적용",
    voucherToggleOff: "바우처 제외",
    minimumTitle: "최소 동의",
    requester: "요청자",
    purpose: "목적",
    minimum: "최소 공유 결과",
    retention: "보관",
    purposeBody: "이 로컬 혜택 1건을 계산하고 짝을 이루는 영수증 미러를 만듭니다.",
    minimumBody: "지갑 준비·혜택 선택 조건만 공유 — 신원·나이·DID·주소·원본 주장은 제외합니다.",
    retentionBody: "동의·주장·출처·영수증·결과는 이 화면 메모리에만 남고 전송되지 않습니다.",
    consent: "이 최소 로컬 요청에 동의합니다",
    confirm: "로컬 결제 확인",
    cancel: "취소하고 혜택으로 돌아가기",
    chooseOutcome: "결제 반환 선택",
    chooseOutcomeBody: "확인 동작은 멱등합니다. 로컬 결제 반환 하나를 고르면 출금 1회와 영수증 1개만 생성됩니다.",
    success: "성공으로 반환",
    failure: "실패로 반환",
    insufficient: "잔액 부족으로 반환",
    failedTitle: "결제에 실패했습니다",
    failedBody: "잔액·바우처·정산은 바뀌지 않았습니다. 다시 시도하면 같은 확인 화면으로 돌아갑니다.",
    insufficientTitle: "잔액이 부족합니다",
    insufficientBody: "출금이 일어나지 않았습니다. 다시 시도해도 같은 혜택과 동의 맥락을 유지합니다.",
    paymentRetry: "결제 다시 시도",
    receiptTitle: "안정적인 로컬 영수증",
    paid: "로컬 결제 완료",
    refunded: "로컬 환불 완료",
    holder: "보유자 정산 미러",
    merchantMirror: "가맹점 정산 미러",
    openingBalance: "시작 잔액",
    debit: "단일 출금",
    closingBalance: "종료 잔액",
    gross: "총 혜택 가격",
    benefit: "바우처 혜택",
    net: "순 정산",
    voucherConsumed: "1회 사용 완료",
    voucherRestored: "환불 후 복원됨",
    voucherRefundPolicy: "환불은 OOKRW 둘러보기 출금을 복원해 잔액을 60으로 만들고 1회용 바우처를 사용 가능·사용 횟수 0으로 복원합니다.",
    refund: "로컬 결제 환불",
    returnOffer: "ID · 지갑 혜택으로 돌아가기",
  },
} as const

function CommerceDialog({ locale, label, focusKey, children }: { locale: Locale; label: string; focusKey: string; children: ReactNode }) {
  const layerRef = useRef<HTMLDivElement>(null)
  useModalIsolation(true, layerRef)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      layerRef.current?.querySelector<HTMLElement>("[data-commerce-initial-focus]")?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [focusKey])

  function trapFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return
    const focusable = Array.from(layerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter((node) => node.offsetParent !== null)
    const first = focusable[0]
    const last = focusable.at(-1)
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }

  const modal = (
    <div className={styles.backdrop}>
      <section ref={layerRef} className={styles.dialog} role="dialog" aria-modal="true" aria-label={label} lang={locale} onKeyDown={trapFocus}>
        {children}
      </section>
    </div>
  )
  const canvas = typeof document === "undefined" ? null : document.querySelector("[data-testid='ondo-canvas']")
  return canvas ? createPortal(modal, canvas) : modal
}

function WalletLinkDialog({ locale, boundarySeen, onAcknowledge, onClose, onReturn }: {
  locale: Locale
  boundarySeen: boolean
  onAcknowledge(): boolean
  onClose(): void
  onReturn(outcome: "ready" | "failed"): void
}) {
  const [phase, setPhase] = useState<"boundary" | "link">(boundarySeen ? "link" : "boundary")
  const [boundaryError, setBoundaryError] = useState(false)
  const copy = COPY[locale]
  return (
    <CommerceDialog locale={locale} label={phase === "boundary" ? copy.boundaryTitle : copy.linkDialog} focusKey={phase}>
      <header className={styles.dialogHeader}>
        <strong>{phase === "boundary" ? copy.boundaryTitle : copy.linkDialog}</strong>
        <button type="button" aria-label={copy.close} onClick={onClose}><X size={20} aria-hidden="true" /></button>
      </header>
      {phase === "boundary" ? (
        <div className={styles.dialogBody} data-testid="commerce-local-boundary">
          <span className={styles.roundIcon}><ShieldCheck size={25} aria-hidden="true" /></span>
          <h2>{copy.boundaryTitle}</h2>
          <p>{copy.boundaryBody}</p>
          <p className={styles.policy}>{copy.boundaryKeep}</p>
          {boundaryError ? <p className={styles.error} role="alert">{copy.boundaryError}</p> : null}
          <button type="button" className={styles.primary} data-commerce-initial-focus data-testid="commerce-boundary-continue" onClick={() => {
            if (!onAcknowledge()) { setBoundaryError(true); return }
            setBoundaryError(false)
            setPhase("link")
          }}>{copy.boundaryContinue}</button>
        </div>
      ) : (
        <div className={styles.dialogBody} data-testid="wallet-link-return">
          <span className={styles.roundIcon}><Link2 size={25} aria-hidden="true" /></span>
          <h2>{copy.linkDialog}</h2>
          <p>{copy.linkDialogBody}</p>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} data-commerce-initial-focus data-testid="wallet-link-ready" onClick={() => onReturn("ready")}><BadgeCheck size={18} aria-hidden="true" />{copy.linkReady}</button>
            <button type="button" className={styles.secondary} data-testid="wallet-link-failure" onClick={() => onReturn("failed")}><AlertTriangle size={18} aria-hidden="true" />{copy.linkFailure}</button>
          </div>
        </div>
      )}
    </CommerceDialog>
  )
}

function StableCheckoutDialog({ locale, onClose }: { locale: Locale; onClose(): void }) {
  const [phase, setPhase] = useState<CheckoutPhase>("review")
  const [commerce, dispatchCommerce] = useReducer(stableCommerceBReducer, undefined, createStableCommerceBState)
  const [aiChoice, setAiChoice] = useState<AiChoice>("unreviewed")
  const [consent, setConsent] = useState(false)
  const [outcomeReady, setOutcomeReady] = useState(false)
  const confirmStarted = useRef(false)
  const outcomeArmTimer = useRef<number | null>(null)
  const copy = COPY[locale]
  const voucher = commerce.voucher !== "available"
  const refunded = commerce.status === "refunded"
  const debit = stableCommerceQuoteDebitB(commerce)
  const closingBalance = stableCommerceBalanceB(commerce)
  const settlement = stableCommerceBreakdownB(commerce)

  useEffect(() => () => {
    if (outcomeArmTimer.current != null) window.clearTimeout(outcomeArmTimer.current)
  }, [])

  function retry() {
    confirmStarted.current = false
    setOutcomeReady(false)
    setPhase("review")
  }

  return (
    <CommerceDialog locale={locale} label={copy.paymentReview} focusKey={`${phase}-${refunded}-${outcomeReady}`}>
      <header className={styles.dialogHeader}>
        <strong>{phase === "receipt" ? copy.receiptTitle : copy.paymentReview}</strong>
        <button type="button" aria-label={copy.close} onClick={onClose}><X size={20} aria-hidden="true" /></button>
      </header>

      {phase === "review" ? (
        <div className={styles.dialogBody} data-testid="ondo-b-stable-checkout" data-phase="review">
          <p className={styles.eyebrow}>{copy.noMerchantClaim}</p>
          <h2>{copy.merchant}</h2>
          <dl className={styles.amounts}>
            <div><dt>{copy.price}</dt><dd>₩{STABLE_B_KRW_PRICE.toLocaleString("en-US")} KRW</dd></div>
            <div><dt>{copy.settlementAsset}</dt><dd>{debit} OOKRW</dd></div>
          </dl>

          <section className={styles.aiCard} aria-labelledby="ai-benefit-title">
            <span><Bot size={20} aria-hidden="true" /><strong id="ai-benefit-title">{copy.aiTitle}</strong></span>
            <p>{copy.aiRule}</p>
            {aiChoice !== "unreviewed" ? <p className={styles.choiceStatus} role="status">{aiChoice === "accepted" ? copy.aiAccepted : copy.aiDeclined}</p> : null}
            <div>
              <button type="button" data-testid="ai-benefit-accept" aria-pressed={aiChoice === "accepted"} onClick={() => { setAiChoice("accepted"); dispatchCommerce({ type: "SET_VOUCHER", selected: true }) }}>{copy.aiAccept}</button>
              <button type="button" data-testid="ai-benefit-decline" aria-pressed={aiChoice === "declined"} onClick={() => { setAiChoice("declined"); dispatchCommerce({ type: "SET_VOUCHER", selected: false }) }}>{copy.aiDecline}</button>
            </div>
          </section>

          <button type="button" className={styles.voucher} data-testid="voucher-toggle" data-status={voucher ? "selected" : "available"} aria-pressed={voucher} onClick={() => dispatchCommerce({ type: "SET_VOUCHER", selected: !voucher })}>
            <TicketCheck size={19} aria-hidden="true" />
            <span><strong>{voucher ? copy.voucherSelected : copy.voucherAvailable}</strong><small>{voucher ? copy.voucherToggleOff : copy.voucherToggleOn}</small></span>
          </button>

          <section className={styles.consent} aria-labelledby="payment-minimum-title">
            <h3 id="payment-minimum-title">{copy.minimumTitle}</h3>
            <dl>
              <div><dt>{copy.requester}</dt><dd>{copy.merchant}</dd></div>
              <div><dt>{copy.purpose}</dt><dd>{copy.purposeBody}</dd></div>
              <div><dt>{copy.minimum}</dt><dd>{copy.minimumBody}</dd></div>
              <div><dt>{copy.retention}</dt><dd>{copy.retentionBody}</dd></div>
            </dl>
            <label><input type="checkbox" checked={consent} data-testid="payment-minimum-consent" onChange={(event) => setConsent(event.target.checked)} /> <span>{copy.consent}</span></label>
          </section>

          <div className={styles.actions}>
            <button type="button" className={styles.primary} data-commerce-initial-focus data-testid="payment-confirm" disabled={!consent} onClick={() => {
              if (confirmStarted.current) return
              confirmStarted.current = true
              dispatchCommerce({ type: "CONFIRM" })
              setOutcomeReady(false)
              setPhase("outcome")
              outcomeArmTimer.current = window.setTimeout(() => {
                outcomeArmTimer.current = null
                setOutcomeReady(true)
              }, 240)
            }}>{copy.confirm}<ChevronRight size={18} aria-hidden="true" /></button>
            <button type="button" className={styles.secondary} data-testid="payment-cancel" onClick={onClose}>{copy.cancel}</button>
          </div>
        </div>
      ) : null}

      {phase === "outcome" ? (
        <div className={styles.dialogBody} data-testid="payment-outcomes">
          <span className={styles.roundIcon}><CircleDollarSign size={25} aria-hidden="true" /></span>
          <h2>{copy.chooseOutcome}</h2>
          <p>{copy.chooseOutcomeBody}</p>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} data-commerce-initial-focus disabled={!outcomeReady} data-testid="payment-outcome-success" onClick={() => { dispatchCommerce({ type: "PAYMENT_RETURN", outcome: "success" }); setPhase("receipt") }}><BadgeCheck size={18} aria-hidden="true" />{copy.success}</button>
            <button type="button" className={styles.secondary} disabled={!outcomeReady} data-testid="payment-outcome-failure" onClick={() => { dispatchCommerce({ type: "PAYMENT_RETURN", outcome: "failure" }); setPhase("failure") }}><AlertTriangle size={18} aria-hidden="true" />{copy.failure}</button>
            <button type="button" className={styles.secondary} disabled={!outcomeReady} data-testid="payment-outcome-insufficient" onClick={() => { dispatchCommerce({ type: "PAYMENT_RETURN", outcome: "insufficient" }); setPhase("insufficient") }}><WalletCards size={18} aria-hidden="true" />{copy.insufficient}</button>
          </div>
        </div>
      ) : null}

      {phase === "failure" || phase === "insufficient" ? (
        <div className={styles.dialogBody} data-testid="ondo-b-stable-checkout" data-phase={phase}>
          <span className={styles.roundIcon}><AlertTriangle size={25} aria-hidden="true" /></span>
          <h2>{phase === "failure" ? copy.failedTitle : copy.insufficientTitle}</h2>
          <p role="alert">{phase === "failure" ? copy.failedBody : copy.insufficientBody}</p>
          <button type="button" className={styles.primary} data-commerce-initial-focus data-testid="payment-retry" onClick={retry}><RefreshCcw size={18} aria-hidden="true" />{copy.paymentRetry}</button>
        </div>
      ) : null}

      {phase === "receipt" ? (
        <div className={styles.dialogBody} data-testid="payment-receipt" data-status={refunded ? "refunded" : "paid"}>
          <span className={styles.roundIcon}><ReceiptText size={25} aria-hidden="true" /></span>
          <p className={styles.eyebrow}>{refunded ? copy.refunded : copy.paid}</p>
          <h2>{copy.receiptTitle}</h2>
          <code>{commerce.receiptId ?? STABLE_B_RECEIPT_ID}</code>
          <div className={styles.mirrors}>
            <section data-testid="holder-settlement-mirror">
              <h3>{copy.holder}</h3>
              <dl>
                <div><dt>{copy.openingBalance}</dt><dd>{STABLE_B_OPENING_BALANCE} OOKRW</dd></div>
                <div><dt>{copy.debit}</dt><dd>{refunded ? "0" : `−${debit}`} OOKRW</dd></div>
                <div><dt>{copy.closingBalance}</dt><dd>{closingBalance} OOKRW</dd></div>
              </dl>
            </section>
            <section data-testid="merchant-settlement-mirror">
              <h3>{copy.merchantMirror}</h3>
              <dl>
                <div><dt>{copy.gross}</dt><dd>{settlement.gross} OOKRW</dd></div>
                <div><dt>{copy.benefit}</dt><dd>{settlement.benefit ? `−${settlement.benefit}` : "0"} OOKRW</dd></div>
                <div><dt>{copy.net}</dt><dd>{settlement.net} OOKRW</dd></div>
              </dl>
            </section>
          </div>
          {commerce.voucherApplied ? <p className={styles.voucherPolicy} data-voucher-status={commerce.voucher}><TicketCheck size={18} aria-hidden="true" /><span><strong>{refunded ? copy.voucherRestored : copy.voucherConsumed}</strong>{copy.voucherRefundPolicy}</span></p> : null}
          <div className={styles.actions}>
            {!refunded ? <button type="button" className={styles.primary} data-commerce-initial-focus data-testid="payment-refund" onClick={() => dispatchCommerce({ type: "REFUND" })}><RotateCcw size={18} aria-hidden="true" />{copy.refund}</button> : null}
            <button type="button" className={styles.secondary} data-commerce-initial-focus={refunded ? true : undefined} data-testid="payment-receipt-return" onClick={onClose}>{copy.returnOffer}</button>
          </div>
        </div>
      ) : null}
    </CommerceDialog>
  )
}

type CanonicalPaymentState = "IDLE" | "SUCCESS" | "CANCELLED" | "FAILED" | "INSUFFICIENT" | "REFUNDED"
type CanonicalOutcome = "success" | "cancelled" | "failed" | "insufficient"

const CANONICAL_OFFER_COPY = {
  en: {
    title: "ONDO demo meal offer",
    close: "Close and return to the exact place",
    truth: "Device-local preview · no AI call · no payment provider call · no chain call · no backend call · not official LOCALDATA merchant payment support.",
    provider: "Payment connection",
    notConnected: "Not connected",
    balance: "OOKRW read-only local balance",
    price: "KRW display price",
    preview: "Preview AI Benefit rule",
    aiRule: "Local rule: recommend the one-use ₩3,000 voucher when this ₩22,000 meal offer is reviewed. The rule is deterministic and makes no model or provider request.",
    recommended: "Apply the one-use voucher",
    accept: "Accept recommendation",
    decline: "Decline recommendation",
    voucher: "One-use voucher",
    available: "Available",
    selected: "Selected",
    redeemed: "Redeemed once",
    consent: "Minimum request: approve wallet-ready and voucher-selected results for this offer only. No identity, DID, age, address, or raw claim is shared.",
    outcomes: "Choose a device-local return",
    success: "Success",
    cancelled: "Cancel",
    failed: "Failure",
    insufficient: "Insufficient balance",
    pay: "Approve minimum request and pay locally",
    retry: "Retry the same payment as success",
    reset: "Reset this offer",
    receipt: "Stable receipt",
    holder: "Holder ledger",
    merchant: "Merchant ledger",
    settlement: "Paired settlement mirror",
    refund: "Refund and restore voucher",
    refundPolicy: "Refund restores 41 → 60 OOKRW and restores the one-use voucher to available with redemption count 0.",
  },
  ko: {
    title: "ONDO 데모 식사 오퍼",
    close: "닫고 정확한 장소로 돌아가기",
    truth: "기기 내 미리보기 · AI·결제 공급자·체인·백엔드 호출 없음 · 공식 LOCALDATA 가맹점 결제 지원 정보가 아닙니다.",
    provider: "결제 연결",
    notConnected: "연결 안 됨",
    balance: "OOKRW 읽기 전용 로컬 잔액",
    price: "KRW 표시 가격",
    preview: "AI 혜택 규칙 미리보기",
    aiRule: "로컬 규칙: ₩22,000 식사 혜택을 확인할 때 1회용 ₩3,000 바우처를 추천합니다. 결정적 규칙이며 모델이나 공급자를 호출하지 않습니다.",
    recommended: "1회용 바우처 적용 추천",
    accept: "추천 수락",
    decline: "추천 거절",
    voucher: "1회용 바우처",
    available: "사용 가능",
    selected: "선택됨",
    redeemed: "1회 사용됨",
    consent: "최소 요청: 이 혜택에 한해 지갑 준비·바우처 선택 결과를 승인합니다. 신원·DID·나이·주소·원본 주장은 공유하지 않습니다.",
    outcomes: "기기 내 반환 선택",
    success: "성공",
    cancelled: "취소",
    failed: "실패",
    insufficient: "잔액 부족",
    pay: "최소 요청을 승인하고 로컬 결제",
    retry: "같은 결제를 성공으로 다시 시도",
    reset: "이 혜택 초기화",
    receipt: "안정적인 영수증",
    holder: "보유자 원장",
    merchant: "가맹점 원장",
    settlement: "짝을 이루는 정산 미러",
    refund: "환불하고 바우처 복원",
    refundPolicy: "환불하면 41 → 60 OOKRW로 복원되고 1회용 바우처도 사용 가능·사용 횟수 0으로 복원됩니다.",
  },
} as const

function CanonicalCommerceOfferB({ locale, venueId, venueName, onClose }: {
  locale: Locale
  venueId: string
  venueName: string
  onClose(): void
}) {
  const copy = CANONICAL_OFFER_COPY[locale]
  const rootRef = useRef<HTMLElement>(null)
  const [commerce, dispatchCommerce] = useReducer(stableCommerceBReducer, undefined, createStableCommerceBState)
  const [aiState, setAiState] = useState<"UNREVIEWED" | "RECOMMENDED" | "ACCEPTED" | "DECLINED">("UNREVIEWED")
  const [outcome, setOutcome] = useState<CanonicalOutcome>("success")
  const [paymentState, setPaymentState] = useState<CanonicalPaymentState>("IDLE")
  const returnTo = JSON.stringify({ cta: "START_MEAL_PAYMENT", venueId, offerId: "meal-offer-gukbap" })
  const balance = stableCommerceBalanceB(commerce)
  const settlement = stableCommerceSettlementB(commerce)
  const holderLedger = commerce.ledger.filter((entry) => entry.side === "holder")
  const merchantLedger = commerce.ledger.filter((entry) => entry.side === "merchant")
  const reconciled = ["PAYMENT", "REFUND"].every((kind) => commerce.ledger.filter((entry) => entry.kind === kind).reduce((sum, entry) => sum + entry.amount, 0) === 0)
  const voucherState = commerce.voucher === "consumed" ? "REDEEMED" : commerce.voucher.toUpperCase()

  useModalIsolation(true, rootRef)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>("[data-commerce-initial-focus]")?.focus({ preventScroll: true }))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  function reset() {
    dispatchCommerce({ type: "RESET" })
    setAiState("UNREVIEWED")
    setOutcome("success")
    setPaymentState("IDLE")
  }

  function pay() {
    if (outcome === "cancelled") {
      setPaymentState("CANCELLED")
      return
    }
    dispatchCommerce({ type: "CONFIRM" })
    dispatchCommerce({ type: "PAYMENT_RETURN", outcome: outcome === "success" ? "success" : outcome === "failed" ? "failure" : "insufficient" })
    setPaymentState(outcome === "success" ? "SUCCESS" : outcome === "failed" ? "FAILED" : "INSUFFICIENT")
  }

  function retry() {
    dispatchCommerce({ type: "CONFIRM" })
    dispatchCommerce({ type: "PAYMENT_RETURN", outcome: "success" })
    setPaymentState("SUCCESS")
  }

  function handleKeys(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault()
      onClose()
      return
    }
    if (event.key !== "Tab") return
    const focusable = Array.from(rootRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter((node) => node.offsetParent !== null)
    const first = focusable[0]
    const last = focusable.at(-1)
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }

  return (
    <section
      ref={rootRef}
      className={`${styles.root} ${styles.canonicalOffer}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="canonical-commerce-title"
      data-testid="ondo-b-id-wallet-commerce"
      data-origin-venue-id={venueId}
      data-return-to={returnTo}
      data-payment-state={paymentState}
      onKeyDown={handleKeys}
    >
      <header className={styles.canonicalHeader}>
        <div><p>SEPARATE ONDO OFFER · {venueName}</p><h2 id="canonical-commerce-title">{copy.title}</h2></div>
        <button type="button" data-commerce-initial-focus data-testid="commerce-close" aria-label={copy.close} onClick={onClose}><X size={20} aria-hidden="true" /></button>
      </header>

      <p className={styles.canonicalTruth} data-testid="commerce-truth-boundary">{copy.truth}</p>

      <div className={styles.canonicalFacts}>
        <span data-testid="commerce-provider-state" data-provider-state="NOT_CONNECTED"><small>{copy.provider}</small><strong>{copy.notConnected}</strong></span>
        <span data-testid="commerce-ookrw-balance" data-balance={balance}><small>{copy.balance}</small><strong>{balance} OOKRW</strong></span>
        <span><small>{copy.price}</small><strong>₩{STABLE_B_KRW_PRICE.toLocaleString("en-US")}</strong></span>
      </div>

      <section className={styles.canonicalAi} data-testid="commerce-ai-recommendation" data-ai-state={aiState}>
        <div><Bot size={19} aria-hidden="true" /><strong>AI Benefit preview</strong></div>
        <p>{copy.aiRule}</p>
        {aiState === "UNREVIEWED" ? <button type="button" data-testid="commerce-ai-preview" onClick={() => setAiState("RECOMMENDED")}>{copy.preview}</button> : null}
        {aiState !== "UNREVIEWED" ? <strong>{copy.recommended}</strong> : null}
        {aiState === "RECOMMENDED" ? <div className={styles.canonicalActions}><button type="button" data-testid="commerce-ai-accept" onClick={() => { setAiState("ACCEPTED"); dispatchCommerce({ type: "SET_VOUCHER", selected: true }) }}>{copy.accept}</button><button type="button" data-testid="commerce-ai-decline" onClick={() => { setAiState("DECLINED"); dispatchCommerce({ type: "SET_VOUCHER", selected: false }) }}>{copy.decline}</button></div> : null}
      </section>

      <section className={styles.canonicalVoucher} data-testid="commerce-voucher" data-voucher-state={voucherState}>
        <TicketCheck size={19} aria-hidden="true" /><span><strong>{copy.voucher}</strong><small>{voucherState === "AVAILABLE" ? copy.available : voucherState === "SELECTED" ? copy.selected : copy.redeemed}</small></span>
      </section>

      <p className={styles.canonicalConsent}>{copy.consent}</p>
      <fieldset className={styles.canonicalOutcomes}>
        <legend>{copy.outcomes}</legend>
        {(["success", "cancelled", "failed", "insufficient"] as const).map((item) => (
          <button key={item} type="button" data-testid={`commerce-outcome-${item}`} aria-pressed={outcome === item} onClick={() => setOutcome(item)}>{copy[item]}</button>
        ))}
      </fieldset>
      <button type="button" className={styles.primary} data-testid="commerce-pay" onClick={pay}><CircleDollarSign size={18} aria-hidden="true" />{copy.pay}</button>

      {paymentState !== "IDLE" ? (
        <section className={styles.canonicalResult} aria-live="polite">
          <strong>{paymentState}</strong>
          {(paymentState === "FAILED" || paymentState === "INSUFFICIENT") ? <button type="button" data-testid="commerce-retry" onClick={retry}><RefreshCcw size={17} aria-hidden="true" />{copy.retry}</button> : null}
          <button type="button" data-testid="commerce-reset" onClick={reset}><RotateCcw size={17} aria-hidden="true" />{copy.reset}</button>
        </section>
      ) : null}

      {commerce.receiptCount > 0 ? <section className={styles.canonicalReceipt} data-testid="commerce-receipt"><strong>{copy.receipt}</strong><code>{commerce.receiptId ?? STABLE_B_RECEIPT_ID}</code></section> : null}
      <div className={styles.canonicalLedgers}>
        <section data-testid="commerce-holder-ledger"><h3>{copy.holder}</h3>{holderLedger.map((entry) => <p key={`${entry.operationId}-${entry.side}`} data-operation-kind={entry.kind}>{entry.kind} · {entry.amount} OOKRW</p>)}</section>
        <section data-testid="commerce-merchant-ledger"><h3>{copy.merchant}</h3>{merchantLedger.map((entry) => <p key={`${entry.operationId}-${entry.side}`} data-operation-kind={entry.kind}>{entry.kind} · {entry.amount} OOKRW</p>)}</section>
      </div>
      <section className={styles.canonicalSettlement} data-testid="commerce-settlement-mirror" data-reconciled={reconciled}><strong>{copy.settlement}</strong><span>{settlement} OOKRW</span></section>

      {paymentState === "SUCCESS" ? <button type="button" className={styles.primary} data-testid="commerce-refund" onClick={() => { dispatchCommerce({ type: "REFUND" }); setPaymentState("REFUNDED") }}><RotateCcw size={18} aria-hidden="true" />{copy.refund}</button> : null}
      {paymentState === "REFUNDED" ? <p className={styles.canonicalConsent}>{copy.refundPolicy}</p> : null}
    </section>
  )
}

export function IdWalletCommerceB() {
  const { state, actions } = useOndoB()
  const [wallet, setWallet] = useState<WalletStatus>("disconnected")
  const [linkOpen, setLinkOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const linkButtonRef = useRef<HTMLButtonElement>(null)
  const offerButtonRef = useRef<HTMLButtonElement>(null)
  const locale = state.locale
  const copy = COPY[locale]
  const originVenue = state.commerceOrigin?.kind === "canonical_place" ? canonicalMapVenueById(state.commerceOrigin.venueId) : undefined
  const originName = originVenue ? venueDisplayName(originVenue.name.ko, locale) : null

  if (state.commerceOrigin?.kind === "canonical_place" && originName) {
    return <CanonicalCommerceOfferB locale={locale} venueId={state.commerceOrigin.venueId} venueName={originName} onClose={() => actions.returnFromCommerceOrigin()} />
  }

  function closeLink() {
    setLinkOpen(false)
    window.requestAnimationFrame(() => linkButtonRef.current?.focus({ preventScroll: true }))
  }

  function closeCheckout() {
    setCheckoutOpen(false)
    if (actions.returnFromCommerceOrigin()) return
    window.requestAnimationFrame(() => offerButtonRef.current?.focus({ preventScroll: true }))
  }

  return (
    <section className={styles.root} data-testid="ondo-b-id-wallet-commerce" data-wallet={wallet} data-origin-venue-id={state.commerceOrigin?.venueId} aria-labelledby="id-wallet-commerce-title">
      <div className={styles.heading}>
        <p>{copy.eyebrow}</p>
        <h2 id="id-wallet-commerce-title">{copy.title}</h2>
        <span>{copy.body}</span>
      </div>

      {originName ? (
        <aside className={styles.origin} data-testid="commerce-origin-return">
          <p>{copy.originEyebrow}</p>
          <strong>{copy.originBody.replace("{place}", originName)}</strong>
          <button type="button" onClick={() => actions.returnFromCommerceOrigin()}>{copy.originReturn}</button>
        </aside>
      ) : null}

      <article className={styles.walletCard}>
        <div className={styles.cardTitle}><WalletCards size={21} aria-hidden="true" /><span><h3>{copy.linkTitle}</h3><p data-status={wallet}>{wallet === "ready" ? copy.ready : wallet === "failed" ? copy.failed : copy.disconnected}</p></span></div>
        {wallet === "ready" ? (
          <>
            <div className={styles.balance}>
              <span><small>{copy.balance}</small><strong>{STABLE_B_OPENING_BALANCE} OOKRW</strong></span>
              <span><small>{copy.priceTruth}</small><strong>₩{STABLE_B_KRW_PRICE.toLocaleString("en-US")}</strong></span>
            </div>
            <p className={styles.balanceTruth}>{copy.balanceTruth}</p>
            <button type="button" className={styles.linkQuiet} onClick={() => setWallet("disconnected")}>{copy.disconnect}</button>
          </>
        ) : (
          <button ref={linkButtonRef} type="button" className={styles.linkButton} data-testid={wallet === "failed" ? "wallet-link-retry" : "wallet-link-open"} onClick={() => setLinkOpen(true)}>
            {wallet === "failed" ? <RefreshCcw size={18} aria-hidden="true" /> : <Link2 size={18} aria-hidden="true" />}
            {wallet === "failed" ? copy.retry : copy.link}
          </button>
        )}
      </article>

      <article className={styles.offerCard} data-offer-origin="id_wallet_separate_demo_offer">
        <p>{copy.offerEyebrow}</p>
        <h3>{copy.offerTitle}</h3>
        <span>{copy.offerBody}</span>
        <button ref={offerButtonRef} type="button" data-testid="merchant-offer-open" disabled={wallet !== "ready"} onClick={() => setCheckoutOpen(true)}>
          {wallet === "ready" ? copy.offerCta : copy.linkFirst}<ChevronRight size={18} aria-hidden="true" />
        </button>
      </article>

      {linkOpen ? <WalletLinkDialog
        locale={locale}
        boundarySeen={state.commerceLocalBoundarySeen}
        onAcknowledge={actions.acknowledgeCommerceLocalBoundary}
        onClose={closeLink}
        onReturn={(outcome) => {
          setWallet(outcome)
          closeLink()
        }}
      /> : null}
      {checkoutOpen ? <StableCheckoutDialog locale={locale} onClose={closeCheckout} /> : null}
    </section>
  )
}
