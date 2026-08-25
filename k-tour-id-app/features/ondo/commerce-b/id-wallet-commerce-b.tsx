"use client"

import type { KeyboardEvent } from "react"
import { useEffect, useReducer, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Gift,
  Info,
  Link2,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  ReceiptText,
  RefreshCcw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  WalletCards,
  X,
} from "lucide-react"
import { canonicalMapVenueById } from "@/lib/ondo/venues/map-data"
import { venueDisplayName } from "@/lib/ondo/venues/display"
import { useOndoB } from "../shared/state/ondo-b-provider"
import { useModalIsolation } from "../shared/ui/use-modal-isolation"
import {
  createStableCommerceBState,
  STABLE_B_KRW_PRICE,
  STABLE_B_OPENING_BALANCE,
  STABLE_B_RECEIPT_ID,
  STABLE_B_VOUCHER_VALUE,
  stableCommerceBalanceB,
  stableCommerceBreakdownB,
  stableCommerceBReducer,
  stableCommerceQuoteDebitB,
} from "./stable-commerce-model-b"
import styles from "./id-wallet-commerce-b.module.css"

type Locale = "en" | "ko"
export type WalletStatus = "disconnected" | "failed" | "ready"
type WalletReturn = "ready" | "failed"
type PaymentView = "review" | "processing" | "receipt" | "failure" | "insufficient" | "refunded"
type QaPayment = "failure" | "insufficient"
type QaWindow = Window & { __ONDO_B_QA__?: { wallet?: "failure"; payment?: QaPayment } }

type Props = {
  walletStatus: WalletStatus
  onWalletStatusChange(status: WalletStatus): void
}

const FOCUSABLE = "button:not([disabled]),input:not([disabled]),[href],summary,[tabindex]:not([tabindex='-1'])"

const COPY = {
  en: {
    eyebrow: "TRAVEL WALLET",
    title: "Wallet",
    body: "Your travel balance, meal benefits and receipts — ready when you choose to use them.",
    balance: "Travel balance",
    testAsset: "OOKRW Test",
    balanceReady: "Ready for ONDO test offers",
    balanceOff: "Connect to use an ONDO test offer",
    connect: "Connect wallet",
    reconnect: "Try connection again",
    disconnect: "Disconnect",
    benefits: "Available benefits",
    benefitTitle: "₩3,000 meal benefit",
    benefitBody: "Shown automatically at eligible ONDO meal offers.",
    benefitState: "1 available",
    explore: "Find eligible places",
    activity: "Recent activity",
    noActivity: "No receipts yet",
    noActivityBody: "Payments and refunds made in this session will appear here.",
    privacy: "Payment privacy",
    privacyBody: "Only wallet readiness and your benefit choice are used for an offer. Your name, age, identity and address are not shared.",
    testTruth: "OOKRW Test is a non-live product balance. It does not move money and is not a stablecoin or on-chain asset.",
    linkDialog: "Connect travel wallet",
    linkTitle: "Ready for trip benefits",
    linkBody: "Prepare your OOKRW Test balance for ONDO offers on this device.",
    linking: "Connecting…",
    linkingBody: "No wallet app, account or payment provider is contacted.",
    linkFailed: "Connection didn’t complete",
    linkFailedBody: "Nothing changed. Try again without losing your place.",
    cancel: "Not now",
    close: "Close",
  },
  ko: {
    eyebrow: "여행 지갑",
    title: "지갑",
    body: "여행 잔액과 식사 혜택, 영수증을 한곳에서 확인하고 원할 때만 사용하세요.",
    balance: "여행 잔액",
    testAsset: "OOKRW Test",
    balanceReady: "ONDO 테스트 오퍼 사용 가능",
    balanceOff: "ONDO 테스트 오퍼를 사용하려면 연결하세요",
    connect: "지갑 연결",
    reconnect: "다시 연결",
    disconnect: "연결 해제",
    benefits: "사용 가능한 혜택",
    benefitTitle: "식사 ₩3,000 혜택",
    benefitBody: "대상 ONDO 식사 오퍼에서 자동으로 보여드려요.",
    benefitState: "1개 사용 가능",
    explore: "대상 장소 찾기",
    activity: "최근 활동",
    noActivity: "아직 영수증이 없어요",
    noActivityBody: "이 세션의 결제와 환불이 여기에 표시됩니다.",
    privacy: "결제 개인정보",
    privacyBody: "오퍼에는 지갑 준비 상태와 혜택 선택만 사용합니다. 이름·나이·신원·주소는 공유하지 않아요.",
    testTruth: "OOKRW Test는 실제로 작동하지 않는 제품용 잔액입니다. 돈을 이동하지 않으며 스테이블코인이나 온체인 자산이 아닙니다.",
    linkDialog: "여행 지갑 연결",
    linkTitle: "여행 혜택을 준비해요",
    linkBody: "이 기기에서 ONDO 오퍼용 OOKRW Test 잔액을 준비합니다.",
    linking: "연결 중…",
    linkingBody: "지갑 앱·계정·결제 공급자에는 연결하지 않습니다.",
    linkFailed: "연결을 완료하지 못했어요",
    linkFailedBody: "변경된 내용이 없습니다. 현재 위치에서 다시 시도하세요.",
    cancel: "나중에",
    close: "닫기",
  },
} as const

const OFFER_COPY = {
  en: {
    eyebrow: "ONDO MEAL BENEFIT",
    title: "A better meal, one tap away",
    from: "Offer at",
    price: "Meal",
    benefit: "ONDO benefit",
    total: "You pay",
    asset: "OOKRW Test",
    voucher: "Your meal benefit",
    voucherBody: "Save 3 OOKRW Test on this meal.",
    applied: "Applied",
    apply: "Apply benefit",
    remove: "Remove",
    consentTitle: "Pay privately",
    consentBody: "Share only wallet-ready and benefit-selected for this offer. No name, identity, age, address or raw claim.",
    consent: "I agree to use this test balance for this offer",
    pay: "Pay with OOKRW Test",
    back: "Back to place",
    close: "Close and return to place",
    processing: "Completing your payment…",
    processingBody: "Keeping this offer and your benefit together.",
    failed: "Payment didn’t complete",
    failedBody: "Nothing was debited and your benefit is still available.",
    insufficient: "Not enough test balance",
    insufficientBody: "No debit was made. Add test balance or choose another way at the venue.",
    retry: "Try again",
    receipt: "Payment complete",
    receiptBody: "Your meal benefit was applied.",
    paid: "Paid",
    remaining: "Balance left",
    receiptId: "Receipt",
    refund: "Request refund",
    support: "Refund & support",
    supportBody: "Refunds in this prototype are immediate and restore the one-use benefit.",
    refunded: "Refund complete",
    refundedBody: "Your test balance and meal benefit have been restored.",
    return: "Return to place",
    testMode: "Test mode details",
    testTruth: "OOKRW Test is non-live. This flow contacts no wallet, merchant, stablecoin network or payment provider and moves no money.",
  },
  ko: {
    eyebrow: "ONDO 식사 혜택",
    title: "한 번의 탭으로 더 좋은 식사",
    from: "오퍼 장소",
    price: "식사",
    benefit: "ONDO 혜택",
    total: "결제 금액",
    asset: "OOKRW Test",
    voucher: "나의 식사 혜택",
    voucherBody: "이 식사에서 3 OOKRW Test를 아껴요.",
    applied: "적용됨",
    apply: "혜택 적용",
    remove: "제외",
    consentTitle: "개인정보를 지키는 결제",
    consentBody: "이 오퍼에는 지갑 준비·혜택 선택 여부만 공유합니다. 이름·신원·나이·주소·원본 정보는 공유하지 않아요.",
    consent: "이 오퍼에 테스트 잔액을 사용하는 데 동의합니다",
    pay: "OOKRW Test로 결제",
    back: "장소로 돌아가기",
    close: "닫고 장소로 돌아가기",
    processing: "결제를 완료하는 중…",
    processingBody: "오퍼와 혜택을 그대로 유지하고 있어요.",
    failed: "결제를 완료하지 못했어요",
    failedBody: "차감된 잔액은 없고 혜택도 그대로 사용할 수 있어요.",
    insufficient: "테스트 잔액이 부족해요",
    insufficientBody: "차감된 잔액은 없습니다. 테스트 잔액을 추가하거나 매장에서 다른 결제 수단을 선택하세요.",
    retry: "다시 시도",
    receipt: "결제 완료",
    receiptBody: "식사 혜택이 적용됐어요.",
    paid: "결제",
    remaining: "남은 잔액",
    receiptId: "영수증",
    refund: "환불 요청",
    support: "환불과 지원",
    supportBody: "프로토타입의 환불은 즉시 처리되며 1회 혜택도 복원됩니다.",
    refunded: "환불 완료",
    refundedBody: "테스트 잔액과 식사 혜택이 복원됐어요.",
    return: "장소로 돌아가기",
    testMode: "테스트 모드 상세",
    testTruth: "OOKRW Test는 실제로 작동하지 않습니다. 지갑·가맹점·스테이블코인 네트워크·결제 공급자에 연결하지 않고 돈을 이동하지 않습니다.",
  },
} as const

function runAfterFrames(callback: () => void, count: number) {
  let frame = 0
  let remaining = count
  const tick = () => {
    if (remaining <= 0) { callback(); return }
    remaining -= 1
    frame = window.requestAnimationFrame(tick)
  }
  frame = window.requestAnimationFrame(tick)
  return () => window.cancelAnimationFrame(frame)
}

function trapFocus(event: KeyboardEvent<HTMLElement>, root: HTMLElement | null, onEscape: () => void) {
  if (event.key === "Escape") { event.preventDefault(); onEscape(); return }
  if (event.key !== "Tab") return
  const focusable = Array.from(root?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter((node) => node.offsetParent !== null)
  const first = focusable[0]
  const last = focusable.at(-1)
  if (!first || !last) return
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
}

function WalletConnectSheet({ locale, boundarySeen, onAcknowledge, onClose, onReturn }: {
  locale: Locale
  boundarySeen: boolean
  onAcknowledge(): boolean
  onClose(): void
  onReturn(status: WalletReturn): void
}) {
  const copy = COPY[locale]
  const [phase, setPhase] = useState<"info" | "linking" | "failed">("info")
  const [noticeError, setNoticeError] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const returnedRef = useRef(false)
  useModalIsolation(true, rootRef)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>("[data-wallet-focus]")?.focus({ preventScroll: true }))
    return () => window.cancelAnimationFrame(frame)
  }, [phase])

  useEffect(() => {
    if (phase !== "linking") return
    return runAfterFrames(() => {
      const outcome: WalletReturn = (window as QaWindow).__ONDO_B_QA__?.wallet === "failure" ? "failed" : "ready"
      if (outcome === "failed") { setPhase("failed"); return }
      if (returnedRef.current) return
      returnedRef.current = true
      onReturn("ready")
    }, 22)
  }, [phase, onReturn])

  function begin() {
    if (!boundarySeen && !onAcknowledge()) { setNoticeError(true); return }
    setNoticeError(false)
    setPhase("linking")
  }

  return createPortal(
    <div className={styles.sheetBackdrop}>
      <div ref={rootRef} className={styles.sheet} role="dialog" aria-modal="true" aria-label={copy.linkDialog} data-testid="wallet-connect-sheet" data-phase={phase} onKeyDown={(event) => trapFocus(event, rootRef.current, onClose)}>
        <div className={styles.grabber} aria-hidden="true" />
        <header><span>{copy.linkDialog}</span><button type="button" data-wallet-focus aria-label={copy.close} onClick={onClose}><X size={20} aria-hidden="true" /></button></header>
        {phase === "info" ? (
          <div className={styles.sheetBody}>
            <div className={styles.sheetIcon}><WalletCards size={28} aria-hidden="true" /></div>
            <h2>{copy.linkTitle}</h2><p>{copy.linkBody}</p>
            <details className={styles.truth}><summary>{copy.testAsset}</summary><p>{copy.testTruth}</p></details>
            {noticeError ? <p className={styles.error} role="alert">{locale === "en" ? "Nothing was sent. Please try again." : "전송된 정보는 없습니다. 다시 시도해 주세요."}</p> : null}
            <button type="button" className={styles.primary} onClick={begin}><Link2 size={18} aria-hidden="true" />{copy.connect}</button>
            <button type="button" className={styles.quietButton} onClick={onClose}>{copy.cancel}</button>
          </div>
        ) : null}
        {phase === "linking" ? <div className={`${styles.sheetBody} ${styles.sheetStatus}`} aria-live="polite"><LoaderCircle className={styles.spinner} size={32} aria-hidden="true" /><h2>{copy.linking}</h2><p>{copy.linkingBody}</p></div> : null}
        {phase === "failed" ? <div className={`${styles.sheetBody} ${styles.sheetStatus}`} aria-live="polite"><RefreshCcw size={32} aria-hidden="true" /><h2>{copy.linkFailed}</h2><p>{copy.linkFailedBody}</p><button type="button" className={styles.primary} data-wallet-focus data-testid="wallet-link-retry" onClick={() => setPhase("linking")}>{copy.reconnect}</button><button type="button" className={styles.quietButton} onClick={() => { onReturn("failed"); onClose() }}>{copy.cancel}</button></div> : null}
      </div>
    </div>,
    document.body,
  )
}

function CanonicalCommerceOfferB({ locale, venueId, venueName, onClose }: { locale: Locale; venueId: string; venueName: string; onClose(): void }) {
  const copy = OFFER_COPY[locale]
  const rootRef = useRef<HTMLElement>(null)
  const pendingRef = useRef(false)
  const [commerce, dispatchCommerce] = useReducer(stableCommerceBReducer, undefined, () => {
    const initial = createStableCommerceBState()
    return stableCommerceBReducer(initial, { type: "SET_VOUCHER", selected: true })
  })
  const [view, setView] = useState<PaymentView>("review")
  const [consent, setConsent] = useState(false)
  const returnTo = JSON.stringify({ cta: "START_MEAL_PAYMENT", venueId, offerId: "meal-offer-gukbap" })
  const balance = stableCommerceBalanceB(commerce)
  const breakdown = stableCommerceBreakdownB(commerce)
  const debit = stableCommerceQuoteDebitB(commerce)
  useModalIsolation(true, rootRef)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>("[data-commerce-initial-focus]")?.focus({ preventScroll: true }))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (view !== "processing") return
    return runAfterFrames(() => {
      const injected = (window as QaWindow).__ONDO_B_QA__?.payment
      const outcome = injected === "failure" ? "failure" : injected === "insufficient" ? "insufficient" : "success"
      dispatchCommerce({ type: "PAYMENT_RETURN", outcome })
      pendingRef.current = false
      setView(outcome === "success" ? "receipt" : outcome)
    }, 28)
  }, [view])

  function pay() {
    if (!consent || pendingRef.current || commerce.status !== "idle") return
    pendingRef.current = true
    dispatchCommerce({ type: "CONFIRM" })
    setView("processing")
  }

  function retry() {
    pendingRef.current = false
    setView("review")
  }

  function refund() {
    dispatchCommerce({ type: "REFUND" })
    setView("refunded")
  }

  return (
    <section
      ref={rootRef}
      className={styles.offerOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="canonical-commerce-title"
      data-testid="ondo-b-id-wallet-commerce"
      data-origin-venue-id={venueId}
      data-return-to={returnTo}
      data-payment-state={view}
      onKeyDown={(event) => trapFocus(event, rootRef.current, onClose)}
    >
      <header className={styles.offerHeader}>
        <button type="button" data-commerce-initial-focus data-testid="commerce-origin-return" aria-label={copy.close} onClick={onClose}><ArrowLeft size={20} aria-hidden="true" /></button>
        <span>{copy.eyebrow}</span>
        <button type="button" aria-label={copy.close} onClick={onClose}><X size={20} aria-hidden="true" /></button>
      </header>

      {view === "review" ? (
        <div className={styles.offerBody}>
          <section className={styles.offerHero}>
            <div className={styles.offerMark}><Sparkles size={22} aria-hidden="true" /></div>
            <p>{copy.eyebrow}</p>
            <h2 id="canonical-commerce-title">{copy.title}</h2>
            <span><MapPin size={15} aria-hidden="true" />{copy.from} {venueName}</span>
          </section>

          <section className={styles.quote} aria-label={copy.total}>
            <div><span>{copy.price}</span><strong>{STABLE_B_KRW_PRICE.toLocaleString("en-US")} KRW</strong></div>
            <div className={styles.discount}><span>{copy.benefit}</span><strong>−{STABLE_B_VOUCHER_VALUE} {copy.asset}</strong></div>
            <div className={styles.quoteTotal}><span>{copy.total}</span><strong>{debit} <small>{copy.asset}</small></strong></div>
          </section>

          <section className={styles.offerBenefit} data-testid="commerce-voucher" data-voucher-state={commerce.voucher}>
            <div className={styles.benefitIcon}><TicketCheck size={22} aria-hidden="true" /></div>
            <div><h3>{copy.voucher}</h3><p>{copy.voucherBody}</p></div>
            <button type="button" aria-pressed={commerce.voucher === "selected"} onClick={() => dispatchCommerce({ type: "SET_VOUCHER", selected: commerce.voucher !== "selected" })}>
              {commerce.voucher === "selected" ? copy.applied : copy.apply}
            </button>
          </section>

          <section className={styles.consentCard} data-testid="payment-minimum-consent">
            <div><LockKeyhole size={20} aria-hidden="true" /><span><h3>{copy.consentTitle}</h3><p>{copy.consentBody}</p></span></div>
            <label><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>{copy.consent}</span></label>
          </section>

          <details className={styles.testDetails}><summary>{copy.testMode}</summary><p>{copy.testTruth}</p></details>
          <button type="button" className={styles.payButton} data-testid="payment-confirm" disabled={!consent} onClick={pay}><CircleDollarSign size={19} aria-hidden="true" />{copy.pay}</button>
          <button type="button" className={styles.quietButton} data-testid="payment-cancel" onClick={onClose}>{copy.back}</button>
        </div>
      ) : null}

      {view === "processing" ? (
        <div className={styles.paymentStatus} data-testid="payment-processing" aria-live="polite"><LoaderCircle className={styles.spinner} size={36} aria-hidden="true" /><h2>{copy.processing}</h2><p>{copy.processingBody}</p></div>
      ) : null}

      {view === "failure" || view === "insufficient" ? (
        <div className={styles.paymentStatus} data-testid="payment-recovery" data-recovery={view} aria-live="polite">
          <div className={styles.issueMark}>{view === "failure" ? <RefreshCcw size={30} aria-hidden="true" /> : <WalletCards size={30} aria-hidden="true" />}</div>
          <h2>{view === "failure" ? copy.failed : copy.insufficient}</h2>
          <p>{view === "failure" ? copy.failedBody : copy.insufficientBody}</p>
          <button type="button" className={styles.primary} data-testid="payment-retry" onClick={retry}>{copy.retry}</button>
          <button type="button" className={styles.quietButton} onClick={onClose}>{copy.back}</button>
        </div>
      ) : null}

      {view === "receipt" || view === "refunded" ? (
        <div className={styles.receiptWrap} data-testid="payment-receipt" data-refunded={view === "refunded"} aria-live="polite">
          <div className={styles.receiptMark}>{view === "refunded" ? <RotateCcw size={31} aria-hidden="true" /> : <BadgeCheck size={33} aria-hidden="true" />}</div>
          <p className={styles.receiptEyebrow}>{venueName}</p>
          <h2>{view === "refunded" ? copy.refunded : copy.receipt}</h2>
          <p className={styles.receiptLead}>{view === "refunded" ? copy.refundedBody : copy.receiptBody}</p>
          <section className={styles.receiptCard}>
            <div><span>{copy.paid}</span><strong>{view === "refunded" ? 0 : breakdown.net} {copy.asset}</strong></div>
            <div><span>{copy.benefit}</span><strong>{STABLE_B_VOUCHER_VALUE} {copy.asset}</strong></div>
            <div><span>{copy.remaining}</span><strong>{balance} {copy.asset}</strong></div>
            <div><span>{copy.receiptId}</span><code>{STABLE_B_RECEIPT_ID}</code></div>
          </section>
          {view === "receipt" ? (
            <details className={styles.refundDetails}><summary>{copy.support}</summary><p>{copy.supportBody}</p><button type="button" data-testid="payment-refund" onClick={refund}><RotateCcw size={17} aria-hidden="true" />{copy.refund}</button></details>
          ) : null}
          <button type="button" className={styles.primary} data-testid="payment-receipt-return" onClick={onClose}>{copy.return}<ChevronRight size={18} aria-hidden="true" /></button>
        </div>
      ) : null}
    </section>
  )
}

export function IdWalletCommerceB({ walletStatus, onWalletStatusChange }: Props) {
  const { state, actions } = useOndoB()
  const [linkOpen, setLinkOpen] = useState(false)
  const linkButtonRef = useRef<HTMLButtonElement>(null)
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

  return (
    <section className={styles.root} data-testid="ondo-b-id-wallet-commerce" data-wallet={walletStatus} aria-labelledby="id-wallet-commerce-title">
      <div className={styles.heading}><p>{copy.eyebrow}</p><h2 id="id-wallet-commerce-title">{copy.title}</h2><span>{copy.body}</span></div>

      <section className={styles.balanceCard} data-testid="wallet-balance">
        <div className={styles.balanceTop}><span>{copy.balance}</span><small data-status={walletStatus}>{walletStatus === "ready" ? copy.balanceReady : copy.balanceOff}</small></div>
        <strong>{STABLE_B_OPENING_BALANCE}<span>{copy.testAsset}</span></strong>
        {walletStatus === "ready" ? (
          <button type="button" className={styles.balanceAction} onClick={() => onWalletStatusChange("disconnected")}>{copy.disconnect}</button>
        ) : (
          <button ref={linkButtonRef} type="button" className={styles.balanceAction} data-testid="wallet-link-open" onClick={() => setLinkOpen(true)}><Link2 size={17} aria-hidden="true" />{walletStatus === "failed" ? copy.reconnect : copy.connect}</button>
        )}
      </section>

      <div className={styles.dashboardGrid}>
        <section className={styles.benefitCard} data-testid="wallet-benefit">
          <div className={styles.cardHeading}><Gift size={20} aria-hidden="true" /><span>{copy.benefits}</span><small>{copy.benefitState}</small></div>
          <h3>{copy.benefitTitle}</h3><p>{copy.benefitBody}</p>
          <button type="button" onClick={() => actions.setTab("ondo")}><MapPin size={16} aria-hidden="true" />{copy.explore}<ChevronRight size={16} aria-hidden="true" /></button>
        </section>

        <section className={styles.activityCard} data-testid="wallet-activity">
          <div className={styles.cardHeading}><Clock3 size={20} aria-hidden="true" /><span>{copy.activity}</span></div>
          <div className={styles.emptyActivity}><ReceiptText size={25} aria-hidden="true" /><div><h3>{copy.noActivity}</h3><p>{copy.noActivityBody}</p></div></div>
        </section>
      </div>

      <details className={styles.privacy} data-testid="wallet-privacy"><summary><ShieldCheck size={17} aria-hidden="true" />{copy.privacy}</summary><p>{copy.privacyBody}</p><p><Info size={15} aria-hidden="true" />{copy.testTruth}</p></details>

      {linkOpen ? <WalletConnectSheet locale={locale} boundarySeen={state.commerceLocalBoundarySeen} onAcknowledge={actions.acknowledgeCommerceLocalBoundary} onClose={closeLink} onReturn={(status) => { onWalletStatusChange(status); closeLink() }} /> : null}
    </section>
  )
}
