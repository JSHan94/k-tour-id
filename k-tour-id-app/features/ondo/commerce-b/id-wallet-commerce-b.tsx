"use client"

import type { KeyboardEvent } from "react"
import { useEffect, useRef, useState } from "react"
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
import {
  abandonPendingBAction,
  B_ACTION_GATE_CANCEL_EVENT,
  B_ACTION_GATE_COMPLETE_EVENT,
  B_ACTION_GATE_READY_EVENT,
  consumePendingBActionAtMutation,
  createBCheckoutActionReturn,
  finalizeConsumedBAction,
  requestBActionGate,
  restoreBActionGateSession,
  restoreConsumedBActionAfterMutationFailure,
  type BCheckoutActionReturn,
} from "../identity-b/action-gate-contract-b"
import { openSavedBDiscoveryVenue } from "../map/b-discovery-history"
import { useOndoB, type OndoBCommerceWalletStatus } from "../shared/state/ondo-b-provider"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import { useModalIsolation } from "../shared/ui/use-modal-isolation"
import {
  STABLE_B_KRW_PRICE,
  STABLE_B_OOKRW_PRICE,
  STABLE_B_RECEIPT_ID,
  STABLE_B_REFUND_RECEIPT_ID,
  STABLE_B_VOUCHER_VALUE,
  stableCommerceBalanceB,
  stableCommerceBenefitPolicyB,
  stableCommerceBreakdownB,
  stableCommerceQuoteDebitB,
} from "./stable-commerce-model-b"
import { VisitStampReceiptB } from "./visit-stamp-receipt-b"
import styles from "./id-wallet-commerce-b.module.css"

type Locale = OndoBLocale
type WalletReturn = "ready" | "failed"
type PaymentView = "review" | "processing" | "receipt" | "failure" | "insufficient" | "refunded"
type QaPayment = "failure" | "insufficient"
type QaBenefit = "ineligible" | "below_minimum" | "expired"
type QaWindow = Window & { __ONDO_B_QA__?: { wallet?: "failure"; payment?: QaPayment; benefit?: QaBenefit; holdProcessing?: boolean } }

const FOCUSABLE = "button:not([disabled]),input:not([disabled]),[href],summary,[tabindex]:not([tabindex='-1'])"
const NUMBER_LOCALE: Record<Locale, string> = { en: "en-US", ko: "ko-KR", ja: "ja-JP" }
const TEST_DISPLAY_KRW_PER_OOKRW = 1_000

function formatNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(NUMBER_LOCALE[locale], { maximumFractionDigits: 0 }).format(value)
}

function formatKrw(value: number, locale: Locale) {
  return new Intl.NumberFormat(NUMBER_LOCALE[locale], {
    style: "currency",
    currency: "KRW",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatTestAmount(value: number, locale: Locale) {
  return `${formatNumber(value, locale)} OOKRW Test`
}

function formatTestDisplayKrw(value: number, locale: Locale) {
  return formatKrw(value * TEST_DISPLAY_KRW_PER_OOKRW, locale)
}

const COPY = {
  en: {
    eyebrow: "TRAVEL WALLET",
    title: "Wallet",
    body: "Your travel balance, meal benefits and receipts — ready when you choose to use them.",
    nonLive: "Local test only · no money or wallet provider connected",
    balance: "Local test balance",
    testAsset: "OOKRW Test",
    balanceReady: "Ready on this device",
    balanceOff: "Preview · not set up",
    balanceFailed: "Setup needs another try",
    balanceEquivalent: "Fixed test-display equivalent · not cash or an exchange rate",
    connect: "Set up local test balance",
    reconnect: "Try setup again",
    disconnect: "Reset local test wallet",
    benefits: "Available benefits",
    benefitTitle: (amount: string) => `${amount} meal benefit`,
    benefitBody: "Shown automatically at eligible ONDO meal offers.",
    benefitState: "1 available",
    explore: "Browse places",
    activity: "Recent activity",
    noActivity: "No receipts yet",
    noActivityBody: "Test payments and test refunds recorded on this device appear here.",
    paidActivity: "Test payment",
    refundedActivity: "Test refund",
    activityVenue: "Meal benefit at",
    activityReceipt: "Receipt",
    originalPayment: "Original payment",
    refundReference: "Refund reference",
    refundedAmount: "Refunded",
    activityPlace: "Open exact place",
    privacy: "Payment privacy",
    privacyBody: "Only wallet readiness and your benefit choice are used for an offer. Your name, age, identity and address are not shared.",
    testTruth: "OOKRW Test is a non-live product balance. It does not move money and is not a stablecoin or on-chain asset.",
    linkDialog: "Set up local test balance",
    linkTitle: "Set up on this device",
    linkBody: "Turn on a non-live OOKRW Test balance for ONDO offers on this device.",
    linking: "Setting up locally…",
    linkingBody: "No wallet app, account or payment provider is contacted.",
    linkFailed: "Local setup didn’t complete",
    linkFailedBody: "Nothing changed. Try again without losing your place.",
    noticeError: "Nothing was sent. Please try again.",
    benefitUsed: "Used",
    cancel: "Not now",
    close: "Close",
  },
  ko: {
    eyebrow: "여행 지갑",
    title: "지갑",
    body: "여행 잔액과 식사 혜택, 영수증을 한곳에서 확인하고 원할 때만 사용하세요.",
    nonLive: "로컬 테스트 전용 · 실제 자금·지갑 제공자 연결 없음",
    balance: "로컬 테스트 잔액",
    testAsset: "OOKRW Test",
    balanceReady: "이 기기에서 사용 가능",
    balanceOff: "미리보기 · 아직 설정 안 됨",
    balanceFailed: "설정을 다시 시도해 주세요",
    balanceEquivalent: "고정 테스트 표시 환산 · 현금이나 환율이 아님",
    connect: "로컬 테스트 잔액 설정",
    reconnect: "설정 다시 시도",
    disconnect: "로컬 테스트 지갑 초기화",
    benefits: "사용 가능한 혜택",
    benefitTitle: (amount: string) => `식사 ${amount} 혜택`,
    benefitBody: "대상 ONDO 식사 오퍼에서 자동으로 보여드려요.",
    benefitState: "1개 사용 가능",
    explore: "장소 둘러보기",
    activity: "최근 활동",
    noActivity: "아직 영수증이 없어요",
    noActivityBody: "이 기기에 기록한 테스트 결제와 테스트 환불이 여기에 표시됩니다.",
    paidActivity: "테스트 결제",
    refundedActivity: "테스트 환불",
    activityVenue: "식사 혜택 장소",
    activityReceipt: "영수증",
    originalPayment: "원 결제",
    refundReference: "환불 참조",
    refundedAmount: "환불 금액",
    activityPlace: "이 장소 열기",
    privacy: "결제 개인정보",
    privacyBody: "오퍼에는 지갑 준비 상태와 혜택 선택만 사용합니다. 이름·나이·신원·주소는 공유하지 않아요.",
    testTruth: "OOKRW Test는 실제로 작동하지 않는 제품용 잔액입니다. 돈을 이동하지 않으며 스테이블코인이나 온체인 자산이 아닙니다.",
    linkDialog: "로컬 테스트 잔액 설정",
    linkTitle: "이 기기에서 설정",
    linkBody: "실제 지갑 연결 없이 이 기기에 ONDO 오퍼용 OOKRW Test 잔액을 설정합니다.",
    linking: "로컬에서 설정 중…",
    linkingBody: "지갑 앱·계정·결제 공급자에는 연결하지 않습니다.",
    linkFailed: "로컬 설정을 완료하지 못했어요",
    linkFailedBody: "변경된 내용이 없습니다. 현재 위치에서 다시 시도하세요.",
    noticeError: "전송된 정보는 없습니다. 다시 시도해 주세요.",
    benefitUsed: "사용됨",
    cancel: "나중에",
    close: "닫기",
  },
  ja: {
    eyebrow: "トラベルウォレット",
    title: "ウォレット",
    body: "旅のテスト残高、食事特典、レシートをまとめて確認し、使うときだけ準備できます。",
    nonLive: "ローカルテスト専用 · 実資金・ウォレット事業者への接続なし",
    balance: "ローカルテスト残高",
    testAsset: "OOKRW Test",
    balanceReady: "この端末で利用可能",
    balanceOff: "プレビュー · 未設定",
    balanceFailed: "設定をもう一度お試しください",
    balanceEquivalent: "固定テスト表示換算 · 現金・為替レートではありません",
    connect: "ローカルテスト残高を設定",
    reconnect: "設定をもう一度試す",
    disconnect: "ローカルテストウォレットをリセット",
    benefits: "利用できる特典",
    benefitTitle: (amount: string) => `食事が${amount}お得`,
    benefitBody: "対象のONDO食事オファーで自動的にご案内します。",
    benefitState: "1件利用可能",
    explore: "お店を見る",
    activity: "最近の利用履歴",
    noActivity: "レシートはまだありません",
    noActivityBody: "このブラウザで完了したテスト決済と返金がここに表示されます。",
    paidActivity: "テスト決済",
    refundedActivity: "テスト返金",
    activityVenue: "食事特典の利用先",
    activityReceipt: "レシート",
    originalPayment: "元のテスト決済",
    refundReference: "返金参照番号",
    refundedAmount: "戻したテスト残高",
    activityPlace: "このお店を開く",
    privacy: "決済時のプライバシー",
    privacyBody: "オファーには、ウォレットの準備状況と特典の選択だけを使用します。名前、年齢、本人情報、住所は共有しません。",
    testTruth: "OOKRW Testはテスト用の残高です。実際のお金を動かさず、ステーブルコインやオンチェーン資産ではありません。",
    linkDialog: "ローカルテスト残高を設定",
    linkTitle: "この端末で設定",
    linkBody: "実際のウォレット接続なしで、この端末にONDOオファー用のOOKRW Test残高を設定します。",
    linking: "ローカルで設定しています…",
    linkingBody: "ウォレットアプリ、アカウント、決済事業者には接続しません。",
    linkFailed: "ローカル設定を完了できませんでした",
    linkFailedBody: "変更はありません。今の画面からもう一度お試しください。",
    noticeError: "情報は送信されていません。もう一度お試しください。",
    benefitUsed: "使用済み",
    cancel: "今回はしない",
    close: "閉じる",
  },
} as const

const OFFER_COPY = {
  en: {
    eyebrow: "ONDO MEAL BENEFIT",
    title: "A better meal, one tap away",
    from: "Test offer for",
    venueBoundaryPrefix: "ONDO local test at",
    venueBoundarySuffix: "· venue neither offers nor accepts it · no wallet/provider contacted · no money moves",
    price: "Meal",
    testQuote: "Test quote",
    benefit: "ONDO benefit",
    total: "You pay",
    asset: "OOKRW Test",
    voucher: "Your meal benefit",
    voucherBody: (minimum: string) => `Eligible for this test offer · ${minimum} minimum met · valid through Aug 28`,
    fixedQuote: "Fixed product quote · not an exchange rate or 1:1 value guarantee",
    recommendation: "Recommended for this meal",
    applied: "Applied",
    apply: "Apply benefit",
    remove: "Not now",
    available: "Available",
    policyIneligible: "Benefit unavailable for this place",
    policyBelowMinimum: "Meal minimum not met",
    policyExpired: "This benefit has expired",
    policyBody: "Nothing changed. Return to the place and choose another option.",
    consentTitle: "Pay privately",
    consentBody: "This local walkthrough uses only wallet-ready and benefit-selected. No name, identity, age, address or raw claim leaves this screen.",
    consent: "I agree to use this test balance for this offer",
    pay: "Pay with OOKRW Test",
    connectToPay: "Set up local test balance to continue",
    back: "Back to place",
    close: "Close and return to place",
    processing: "Recording the test payment…",
    processingBody: "Saving this local test result on this device. No merchant or payment provider is contacted.",
    failed: "Test payment didn’t complete",
    failedBody: "Nothing was debited and your benefit is still available.",
    insufficient: "Not enough test balance",
    insufficientBody: "No debit was made. The test condition is cleared before you retry, or you can choose another way at the venue.",
    paymentStorageError: "Could not save this test payment on this device. Nothing was completed — try again.",
    gateStorageError: "Could not open the local Payment check. The offer and test balance are unchanged — try again.",
    refundStorageError: "Could not save this test refund on this device. The original test payment is unchanged — try again.",
    retry: "Try again",
    receipt: "Test payment complete",
    receiptBody: "This local test applied the ONDO meal benefit. No purchase occurred.",
    receiptWithoutBenefit: "Test payment recorded without the ONDO benefit. No purchase occurred.",
    paid: "Test payment",
    remaining: "Balance left",
    receiptId: "Receipt",
    originalPayment: "Original payment",
    paymentReceipt: "Payment receipt",
    refundReference: "Refund reference",
    refundedAmount: "Refunded",
    refund: "Request test refund",
    support: "Test refund & support",
    supportBody: "This local walkthrough immediately restores the test balance and one-use benefit. No real refund occurs.",
    refunded: "Test refund complete",
    refundedBody: "Your test balance and meal benefit were restored locally. No real refund occurred.",
    refundedWithoutBenefit: "Your test balance was restored locally and the unused benefit remains available. No real refund occurred.",
    return: "Return to place",
    testMode: "Test mode details",
    testTruth: "OOKRW Test is non-live. The benefit recommendation runs on this device with no AI or provider call. The fixed test quote is not an exchange rate, redemption promise, or 1:1 guarantee. This flow contacts no wallet, merchant, stablecoin network or payment provider and moves no money.",
  },
  ko: {
    eyebrow: "ONDO 식사 혜택",
    title: "한 번의 탭으로 더 좋은 식사",
    from: "테스트 오퍼 장소",
    venueBoundaryPrefix: "ONDO 로컬 테스트 장소",
    venueBoundarySuffix: "· 장소는 이 테스트를 제공하거나 받지 않음 · 지갑·공급자 연결 없음 · 돈 이동 없음",
    price: "식사",
    testQuote: "테스트 견적",
    benefit: "ONDO 혜택",
    total: "결제 금액",
    asset: "OOKRW Test",
    voucher: "나의 식사 혜택",
    voucherBody: (minimum: string) => `이 테스트 오퍼 사용 가능 · ${minimum} 최소 금액 충족 · 8월 28일까지`,
    fixedQuote: "제품용 고정 견적 · 환율이나 1:1 가치 보장이 아님",
    recommendation: "이번 식사 추천 혜택",
    applied: "적용됨",
    apply: "혜택 적용",
    remove: "나중에",
    available: "사용 가능",
    policyIneligible: "이 장소에서는 혜택을 사용할 수 없어요",
    policyBelowMinimum: "식사 최소 금액을 충족하지 못했어요",
    policyExpired: "이 혜택은 만료됐어요",
    policyBody: "변경된 내용은 없습니다. 장소로 돌아가 다른 방법을 선택해 주세요.",
    consentTitle: "개인정보를 지키는 결제",
    consentBody: "이 로컬 동작은 지갑 준비·혜택 선택 여부만 사용합니다. 이름·신원·나이·주소·원본 정보는 이 화면 밖으로 나가지 않아요.",
    consent: "이 오퍼에 테스트 잔액을 사용하는 데 동의합니다",
    pay: "OOKRW Test로 결제",
    connectToPay: "로컬 테스트 잔액을 설정하고 계속",
    back: "장소로 돌아가기",
    close: "닫고 장소로 돌아가기",
    processing: "테스트 결제를 기록하는 중…",
    processingBody: "이 기기에 로컬 테스트 결과를 저장합니다. 매장이나 결제 공급자에는 연결하지 않아요.",
    failed: "테스트 결제를 완료하지 못했어요",
    failedBody: "차감된 잔액은 없고 혜택도 그대로 사용할 수 있어요.",
    insufficient: "테스트 잔액이 부족해요",
    insufficientBody: "차감된 잔액은 없습니다. 재시도 전에 테스트 조건이 해제되며, 매장에서 다른 방법을 선택할 수도 있어요.",
    paymentStorageError: "이 기기에 테스트 결제를 저장하지 못했어요. 완료된 내용은 없습니다. 다시 시도하세요.",
    gateStorageError: "로컬 결제 확인을 열지 못했어요. 오퍼와 테스트 잔액은 그대로입니다. 다시 시도하세요.",
    refundStorageError: "이 기기에 테스트 환불을 저장하지 못했어요. 원 테스트 결제는 그대로입니다. 다시 시도하세요.",
    retry: "다시 시도",
    receipt: "테스트 결제 완료",
    receiptBody: "이 로컬 테스트에 ONDO 식사 혜택을 적용했어요. 실제 구매는 없었습니다.",
    receiptWithoutBenefit: "ONDO 혜택 없이 테스트 결제를 기록했어요. 실제 구매는 없었습니다.",
    paid: "테스트 결제",
    remaining: "남은 잔액",
    receiptId: "영수증",
    originalPayment: "원 결제",
    paymentReceipt: "결제 영수증",
    refundReference: "환불 참조",
    refundedAmount: "환불 금액",
    refund: "테스트 환불 요청",
    support: "테스트 환불과 지원",
    supportBody: "이 로컬 동작은 테스트 잔액과 1회 혜택을 즉시 복원합니다. 실제 환불은 없습니다.",
    refunded: "테스트 환불 완료",
    refundedBody: "테스트 잔액과 식사 혜택을 이 기기에서 복원했어요. 실제 환불은 없었습니다.",
    refundedWithoutBenefit: "테스트 잔액을 이 기기에서 복원했고 사용하지 않은 혜택은 남아 있어요. 실제 환불은 없었습니다.",
    return: "장소로 돌아가기",
    testMode: "테스트 모드 상세",
    testTruth: "OOKRW Test는 실제로 작동하지 않습니다. 혜택 추천은 AI나 공급자 호출 없이 이 기기에서 실행됩니다. 고정 테스트 견적은 환율·상환 약속·1:1 보장을 뜻하지 않습니다. 지갑·가맹점·스테이블코인 네트워크·결제 공급자에 연결하지 않고 돈을 이동하지 않습니다.",
  },
  ja: {
    eyebrow: "ONDOの食事特典",
    title: "タップひとつで、食事をもっとお得に",
    from: "テストオファー対象店",
    venueBoundaryPrefix: "ONDOローカルテスト対象店",
    venueBoundarySuffix: "· お店はこのテストを提供も受け付けもしません · ウォレット・事業者への接続なし · お金の移動なし",
    price: "食事代",
    testQuote: "テスト換算",
    benefit: "ONDO特典",
    total: "使用する残高",
    asset: "OOKRW Test",
    voucher: "食事特典",
    voucherBody: (minimum: string) => `このテストオファーの対象 · 最低金額${minimum}を達成 · 8月28日まで有効`,
    fixedQuote: "製品内の固定テスト換算 · 為替レートでも1:1の価値保証でもありません",
    recommendation: "この食事におすすめ",
    applied: "適用済み",
    apply: "特典を適用",
    remove: "今回は使わない",
    available: "利用可能",
    policyIneligible: "このお店では特典を利用できません",
    policyBelowMinimum: "食事の最低金額に達していません",
    policyExpired: "この特典の有効期限が切れています",
    policyBody: "変更はありません。お店の画面に戻り、別の方法を選んでください。",
    consentTitle: "必要な情報だけでテスト決済",
    consentBody: "このローカル操作で使うのは、ウォレットの準備状況と特典の選択だけです。名前、本人情報、年齢、住所、元データはこの画面の外へ出ません。",
    consent: "このオファーにテスト残高を使うことに同意します",
    pay: "OOKRW Testでテスト決済",
    connectToPay: "ローカルテスト残高を設定して続ける",
    back: "お店の画面に戻る",
    close: "閉じてお店の画面に戻る",
    processing: "テスト決済を処理しています…",
    processingBody: "この端末にローカルテスト結果を保存します。お店や決済事業者には接続しません。",
    failed: "テスト決済を完了できませんでした",
    failedBody: "残高は引かれておらず、特典も引き続き利用できます。",
    insufficient: "テスト残高が不足しています",
    insufficientBody: "残高は引かれていません。再試行の前にテスト条件を解除します。お店で別の方法を選ぶこともできます。",
    paymentStorageError: "この端末にテスト決済を保存できませんでした。完了した処理はありません。もう一度お試しください。",
    gateStorageError: "ローカルの決済確認を開けませんでした。オファーとテスト残高は変わっていません。もう一度お試しください。",
    refundStorageError: "この端末にテスト返金を保存できませんでした。元のテスト決済は変わっていません。もう一度お試しください。",
    retry: "もう一度試す",
    receipt: "テスト決済が完了しました",
    receiptBody: "このローカルテストに食事特典を適用しました。実際の購入は発生していません。",
    receiptWithoutBenefit: "ONDO特典なしでテスト決済を記録しました。実際の購入は発生していません。",
    paid: "使用したテスト残高",
    remaining: "残りのテスト残高",
    receiptId: "レシート番号",
    originalPayment: "元のテスト決済",
    paymentReceipt: "決済レシート",
    refundReference: "返金参照番号",
    refundedAmount: "戻したテスト残高",
    refund: "テスト返金をリクエスト",
    support: "返金・サポート",
    supportBody: "ここでの返金はすぐにテスト残高へ戻り、1回限りの特典も元に戻ります。実際の返金は発生しません。",
    refunded: "テスト返金が完了しました",
    refundedBody: "テスト残高と食事特典を元に戻しました。実際の返金は発生していません。",
    refundedWithoutBenefit: "テスト残高を元に戻しました。未使用の食事特典はそのまま利用できます。実際の返金は発生していません。",
    return: "同じお店の画面に戻る",
    testMode: "テストモードの詳細",
    testTruth: "OOKRW Testは実際の決済には使えないテスト残高です。特典のおすすめはAIや外部サービスを呼び出さず、このブラウザ内で判定します。固定のテスト換算は、為替レート、償還の約束、1:1の価値保証ではありません。ウォレット、加盟店、ステーブルコインネットワーク、決済事業者には接続せず、実際のお金も動きません。",
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
      <div ref={rootRef} className={styles.sheet} role="dialog" aria-modal="true" aria-label={copy.linkDialog} aria-busy={phase === "linking"} data-testid="wallet-connect-sheet" data-modal-layer-priority="200" data-phase={phase} onKeyDown={(event) => trapFocus(event, rootRef.current, onClose)}>
        <div className={styles.grabber} aria-hidden="true" />
        <header><span>{copy.linkDialog}</span><button type="button" data-wallet-focus aria-label={copy.close} onClick={onClose}><X size={20} aria-hidden="true" /></button></header>
        {phase === "info" ? (
          <div className={styles.sheetBody}>
            <div className={styles.sheetIcon}><WalletCards size={28} aria-hidden="true" /></div>
            <h2>{copy.linkTitle}</h2><p>{copy.linkBody}</p>
            <details className={styles.truth}><summary>{copy.testAsset}</summary><p>{copy.testTruth}</p></details>
            {noticeError ? <p className={styles.error} role="alert">{copy.noticeError}</p> : null}
            <button type="button" className={styles.primary} onClick={begin}><Link2 size={18} aria-hidden="true" />{copy.connect}</button>
            <button type="button" className={styles.quietButton} onClick={onClose}>{copy.cancel}</button>
          </div>
        ) : null}
        {phase === "linking" ? <div className={`${styles.sheetBody} ${styles.sheetStatus}`} role="status" aria-live="polite"><LoaderCircle className={styles.spinner} size={32} aria-hidden="true" /><h2>{copy.linking}</h2><p>{copy.linkingBody}</p></div> : null}
        {phase === "failed" ? <div className={`${styles.sheetBody} ${styles.sheetStatus}`} role="alert"><RefreshCcw size={32} aria-hidden="true" /><h2>{copy.linkFailed}</h2><p>{copy.linkFailedBody}</p><button type="button" className={styles.primary} data-wallet-focus data-testid="wallet-link-retry" onClick={() => setPhase("linking")}>{copy.reconnect}</button><button type="button" className={styles.quietButton} onClick={() => { onReturn("failed"); onClose() }}>{copy.cancel}</button></div> : null}
      </div>
    </div>,
    document.body,
  )
}

function CanonicalCommerceOfferB({ locale, venueId, venueName, walletStatus, onConnect, onClose }: { locale: Locale; venueId: string; venueName: string; walletStatus: OndoBCommerceWalletStatus; onConnect(): void; onClose(): void }) {
  const { state, actions } = useOndoB()
  const copy = OFFER_COPY[locale]
  const rootRef = useRef<HTMLElement>(null)
  const pendingRef = useRef(false)
  const consumedCheckoutRef = useRef<BCheckoutActionReturn | null>(null)
  const commerce = state.commerceSession
  const [view, setView] = useState<PaymentView>(() => commerce.status === "paid" ? "receipt" : commerce.status === "refunded" ? "refunded" : "review")
  const [consent, setConsent] = useState(false)
  const [benefitQa, setBenefitQa] = useState<QaBenefit | undefined>()
  const [storageError, setStorageError] = useState<"gate" | "payment" | "refund" | null>(null)
  const returnTo = JSON.stringify({ cta: "START_MEAL_PAYMENT", venueId, offerId: "meal-offer-gukbap" })
  const balance = stableCommerceBalanceB(commerce)
  const breakdown = stableCommerceBreakdownB(commerce)
  const debit = stableCommerceQuoteDebitB(commerce)
  const benefitSelected = commerce.voucher === "selected" || commerce.voucher === "consumed"
  const benefitExpiresAtMs = Date.parse("2026-08-28T23:59:59+09:00")
  const benefitPolicy = stableCommerceBenefitPolicyB({
    venueEligible: benefitQa !== "ineligible",
    mealOOKRW: benefitQa === "below_minimum" ? 21 : STABLE_B_OOKRW_PRICE,
    minimumOOKRW: STABLE_B_OOKRW_PRICE,
    nowMs: benefitQa === "expired" ? benefitExpiresAtMs + 1 : Date.parse("2026-08-25T12:00:00+09:00"),
    expiresAtMs: benefitExpiresAtMs,
  })
  useModalIsolation(true, rootRef)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>("[data-commerce-initial-focus]")?.focus({ preventScroll: true }))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    rootRef.current?.scrollTo({ top: 0, behavior: "auto" })
  }, [view])
  useEffect(() => {
    if (!consent) return
    const frame = window.requestAnimationFrame(() => rootRef.current?.scrollTo({ top: 0, behavior: "auto" }))
    return () => window.cancelAnimationFrame(frame)
  }, [consent])
  useEffect(() => {
    if (storageError !== "refund") return
    const frame = window.requestAnimationFrame(() => rootRef.current?.scrollTo({ top: 0, behavior: "auto" }))
    return () => window.cancelAnimationFrame(frame)
  }, [storageError])
  useEffect(() => {
    setBenefitQa((window as QaWindow).__ONDO_B_QA__?.benefit)
  }, [])

  useEffect(() => {
    function returnFromPaymentGate(event: Event, completed: boolean) {
      const detail = event instanceof CustomEvent ? event.detail as BCheckoutActionReturn : null
      if (!detail || detail.cta !== "START_CHECKOUT" || detail.venueId !== venueId || detail.offerId !== "meal-offer-gukbap") return
      if (!completed) {
        window.requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>("[data-testid='payment-confirm']")?.focus({ preventScroll: true }))
        return
      }
      if (!consent || walletStatus !== "ready" || pendingRef.current || commerce.status !== "idle") return
      const latest = restoreBActionGateSession(window.sessionStorage)
      const satisfied = new Set<"account" | "payment_kyc">()
      if (state.account === "ACC-ACTIVE") satisfied.add("account")
      if (latest.payment.status === "eligible" && latest.payment.expiresAt && Date.parse(latest.payment.expiresAt) > Date.now()) satisfied.add("payment_kyc")
      const consumed = consumePendingBActionAtMutation(window.sessionStorage, detail, satisfied)
      if (!consumed || consumed.cta !== "START_CHECKOUT") {
        setStorageError("gate")
        return
      }
      consumedCheckoutRef.current = consumed
      pendingRef.current = true
      setStorageError(null)
      if (!actions.dispatchCommerce({ type: "CONFIRM" })) {
        restoreConsumedBActionAfterMutationFailure(window.sessionStorage, consumed)
        consumedCheckoutRef.current = null
        pendingRef.current = false
        setStorageError("payment")
        return
      }
      setView("processing")
    }
    const complete = (event: Event) => returnFromPaymentGate(event, true)
    const cancel = (event: Event) => returnFromPaymentGate(event, false)
    window.addEventListener(B_ACTION_GATE_READY_EVENT, complete)
    window.addEventListener(B_ACTION_GATE_CANCEL_EVENT, cancel)
    return () => {
      window.removeEventListener(B_ACTION_GATE_READY_EVENT, complete)
      window.removeEventListener(B_ACTION_GATE_CANCEL_EVENT, cancel)
    }
  }, [actions, commerce.status, consent, state.account, venueId, walletStatus])

  useEffect(() => {
    if (view !== "processing") return
    const cancelPending = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return
      event.preventDefault()
      const consumed = consumedCheckoutRef.current
      if (consumed) {
        finalizeConsumedBAction(window.sessionStorage, consumed)
        consumedCheckoutRef.current = null
        window.dispatchEvent(new CustomEvent(B_ACTION_GATE_COMPLETE_EVENT, { detail: consumed }))
      }
      pendingRef.current = false
      actions.dispatchCommerce({ type: "CANCEL_CONFIRMATION" })
      onClose()
    }
    window.addEventListener("keydown", cancelPending)
    return () => window.removeEventListener("keydown", cancelPending)
  }, [actions, onClose, view])

  useEffect(() => {
    if (view !== "processing") return
    const qa = (window as QaWindow).__ONDO_B_QA__
    const settlePayment = () => {
      const injected = qa?.payment
      if (qa && injected) delete qa.payment
      const outcome = injected === "failure" ? "failure" : injected === "insufficient" ? "insufficient" : "success"
      const committed = actions.dispatchCommerce({ type: "PAYMENT_RETURN", outcome })
      pendingRef.current = false
      if (!committed) {
        const consumed = consumedCheckoutRef.current
        if (consumed) restoreConsumedBActionAfterMutationFailure(window.sessionStorage, consumed)
        consumedCheckoutRef.current = null
        actions.dispatchCommerce({ type: "CANCEL_CONFIRMATION" })
        setStorageError("payment")
        setView("failure")
        return
      }
      const consumed = consumedCheckoutRef.current
      if (consumed) {
        finalizeConsumedBAction(window.sessionStorage, consumed)
        consumedCheckoutRef.current = null
        window.dispatchEvent(new CustomEvent(B_ACTION_GATE_COMPLETE_EVENT, { detail: consumed }))
      }
      setView(outcome === "success" ? "receipt" : outcome)
    }
    if (qa?.holdProcessing) {
      window.addEventListener("ondo-b-flow8-release-payment", settlePayment, { once: true })
      return () => window.removeEventListener("ondo-b-flow8-release-payment", settlePayment)
    }
    return runAfterFrames(settlePayment, 28)
  }, [actions, view])

  function pay() {
    if (!consent || pendingRef.current || commerce.status !== "idle") return
    setStorageError(null)
    const latest = restoreBActionGateSession(window.sessionStorage)
    if (latest.pending?.cta === "START_CHECKOUT" && latest.pending.venueId === venueId && latest.pending.offerId === "meal-offer-gukbap") {
      window.dispatchEvent(new CustomEvent(B_ACTION_GATE_READY_EVENT, { detail: latest.pending }))
      return
    }
    if (!requestBActionGate(createBCheckoutActionReturn({ venueId }))) setStorageError("gate")
  }

  function retry() {
    pendingRef.current = false
    setStorageError(null)
    setView("review")
  }

  function refund() {
    setStorageError(null)
    if (!actions.dispatchCommerce({ type: "REFUND" })) {
      setStorageError("refund")
      return
    }
    setView("refunded")
  }

  function closeOffer() {
    const pending = restoreBActionGateSession(window.sessionStorage).pending
    if (pending?.cta === "START_CHECKOUT" && pending.venueId === venueId && pending.offerId === "meal-offer-gukbap") {
      abandonPendingBAction(window.sessionStorage, pending)
    }
    const consumed = consumedCheckoutRef.current
    if (consumed) {
      finalizeConsumedBAction(window.sessionStorage, consumed)
      consumedCheckoutRef.current = null
      window.dispatchEvent(new CustomEvent(B_ACTION_GATE_COMPLETE_EVENT, { detail: consumed }))
    }
    pendingRef.current = false
    if (commerce.confirmationPending || view === "processing") actions.dispatchCommerce({ type: "CANCEL_CONFIRMATION" })
    onClose()
  }

  const offerDialogLabel = view === "processing"
    ? copy.processing
    : view === "failure"
      ? copy.failed
      : view === "insufficient"
        ? copy.insufficient
        : view === "refunded"
          ? copy.refunded
          : view === "receipt"
            ? copy.receipt
            : undefined

  return (
    <section
      ref={rootRef}
      className={styles.offerOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby={view === "review" ? "canonical-commerce-title" : undefined}
      aria-label={offerDialogLabel}
      data-testid="ondo-b-id-wallet-commerce"
      data-origin-venue-id={venueId}
      data-return-to={returnTo}
      data-payment-state={view}
      data-wallet-status={walletStatus}
      data-benefit-policy={benefitPolicy.status}
      data-locale={locale}
      data-visual-direction="apple-wallet-flow8"
      data-flow8-object="offer"
      onKeyDown={(event) => trapFocus(event, rootRef.current, closeOffer)}
    >
      <header className={styles.offerHeader}>
        <button type="button" data-commerce-initial-focus data-testid="commerce-origin-return" aria-label={copy.close} onClick={closeOffer}><ArrowLeft size={20} aria-hidden="true" /></button>
        <span>{copy.eyebrow}</span>
        <button type="button" aria-label={copy.close} onClick={closeOffer}><X size={20} aria-hidden="true" /></button>
      </header>

      <p className={styles.offerTruth} data-testid="commerce-venue-test-boundary">
        {copy.venueBoundaryPrefix} <strong>{venueName}</strong> {copy.venueBoundarySuffix}
      </p>

      {view === "review" ? (
        <div className={styles.offerBody}>
          <section className={styles.offerHero}>
            <div className={styles.offerMark}><Sparkles size={22} aria-hidden="true" /></div>
            <p>{copy.eyebrow}</p>
            <h2 id="canonical-commerce-title">{copy.title}</h2>
            <span><MapPin size={15} aria-hidden="true" />{copy.from} {venueName}</span>
          </section>

          {benefitPolicy.status === "recommended" ? <>
          <section className={styles.quote} aria-label={copy.total} data-flow8-object="quote">
            <div><span>{copy.price}</span><strong>{formatKrw(STABLE_B_KRW_PRICE, locale)}</strong></div>
            <div><span>{copy.testQuote}</span><strong>{formatTestAmount(STABLE_B_OOKRW_PRICE, locale)}</strong></div>
            <div className={styles.discount} data-flow8-benefit-delta={benefitSelected ? "applied" : "available"}><span>{copy.benefit}</span><strong>{benefitSelected ? `−${formatTestAmount(STABLE_B_VOUCHER_VALUE, locale)}` : copy.available}</strong></div>
            <div className={styles.quoteTotal}><span>{copy.total}</span><strong>{formatNumber(debit, locale)} <small>{copy.asset}</small></strong></div>
            <p className={styles.fixedQuote} data-testid="commerce-fixed-quote-boundary">{copy.fixedQuote}</p>
          </section>

          <section className={styles.offerBenefit} data-testid="commerce-voucher" data-voucher-state={commerce.voucher} data-benefit-recommendation={commerce.benefitRecommendation}>
            <div className={styles.benefitIcon}><TicketCheck size={22} aria-hidden="true" /></div>
            <div><h3>{commerce.benefitRecommendation === "recommended" ? copy.recommendation : copy.voucher}</h3><p data-testid="commerce-benefit-eligibility">{copy.voucherBody(formatKrw(STABLE_B_KRW_PRICE, locale))}</p></div>
            <div className={styles.benefitActions}>
              <button type="button" data-testid="benefit-accept" aria-pressed={commerce.benefitRecommendation === "accepted"} onClick={() => actions.dispatchCommerce({ type: "ACCEPT_BENEFIT" })}>
                {commerce.benefitRecommendation === "accepted" ? copy.applied : copy.apply}
              </button>
              <button type="button" data-testid="benefit-decline" aria-pressed={commerce.benefitRecommendation === "declined"} onClick={() => actions.dispatchCommerce({ type: "DECLINE_BENEFIT" })}>{copy.remove}</button>
            </div>
          </section>

          <section className={styles.consentCard} data-testid="payment-minimum-consent">
            <div><LockKeyhole size={20} aria-hidden="true" /><span><h3>{copy.consentTitle}</h3><p>{copy.consentBody}</p></span></div>
            <label><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>{copy.consent}</span></label>
          </section>

          <details className={styles.testDetails}><summary>{copy.testMode}</summary><p>{copy.testTruth}</p></details>
          {storageError === "gate" ? <p className={styles.storageError} data-testid="payment-gate-storage-error" role="alert">{copy.gateStorageError}</p> : null}
          <div className={styles.offerDecision} data-flow8-decision="payment">
            <button type="button" className={styles.payButton} data-testid="payment-confirm" disabled={walletStatus === "ready" && !consent} onClick={walletStatus === "ready" ? pay : onConnect}><CircleDollarSign size={19} aria-hidden="true" />{walletStatus === "ready" ? copy.pay : copy.connectToPay}</button>
            <button type="button" className={styles.quietButton} data-testid="payment-cancel" onClick={closeOffer}>{copy.back}</button>
          </div>
          </> : (
            <section className={styles.benefitRecovery} data-testid="commerce-benefit-recovery" role="status">
              <Info size={24} aria-hidden="true" />
              <h3>{benefitPolicy.status === "ineligible" ? copy.policyIneligible : benefitPolicy.status === "below_minimum" ? copy.policyBelowMinimum : copy.policyExpired}</h3>
              <p>{copy.policyBody}</p>
              <button type="button" className={styles.primary} onClick={closeOffer}>{copy.back}</button>
            </section>
          )}
        </div>
      ) : null}

      {view === "processing" ? (
        <div className={styles.paymentStatus} data-testid="payment-processing" aria-live="polite"><LoaderCircle className={styles.spinner} size={36} aria-hidden="true" /><h2>{copy.processing}</h2><p>{copy.processingBody}</p></div>
      ) : null}

      {view === "failure" || view === "insufficient" ? (
        <div className={styles.paymentStatus} data-testid="payment-recovery" data-recovery={view} aria-live="polite">
          <div className={styles.issueMark}>{view === "failure" ? <RefreshCcw size={30} aria-hidden="true" /> : <WalletCards size={30} aria-hidden="true" />}</div>
          <h2>{view === "failure" ? copy.failed : copy.insufficient}</h2>
          {storageError === "payment"
            ? <p className={styles.storageError} data-testid="commerce-storage-error" role="alert">{copy.paymentStorageError}</p>
            : <p>{view === "failure" ? copy.failedBody : copy.insufficientBody}</p>}
          <button type="button" className={styles.primary} data-testid="payment-retry" onClick={retry}>{copy.retry}</button>
          <button type="button" className={styles.quietButton} onClick={closeOffer}>{copy.back}</button>
        </div>
      ) : null}

      {view === "receipt" || view === "refunded" ? (
        <div className={styles.receiptWrap} data-testid="payment-receipt" data-refunded={view === "refunded"} data-storage-error={storageError ?? "none"} data-completion-kind={view} data-flow8-object="receipt" aria-live="polite">
          <div className={styles.receiptMark}>{view === "refunded" ? <RotateCcw size={31} aria-hidden="true" /> : <BadgeCheck size={33} aria-hidden="true" />}</div>
          <p className={styles.receiptEyebrow}>{venueName}</p>
          <h2>{view === "refunded" ? copy.refunded : copy.receipt}</h2>
          <p className={styles.receiptLead}>{view === "refunded"
            ? commerce.voucherApplied ? copy.refundedBody : copy.refundedWithoutBenefit
            : commerce.voucherApplied ? copy.receiptBody : copy.receiptWithoutBenefit}</p>
          <section className={styles.receiptCard}>
            <div><span>{view === "refunded" ? copy.originalPayment : copy.paid}</span><strong>{formatTestAmount(commerce.chargedDebit, locale)}</strong></div>
            {view === "refunded" ? <div><span>{copy.refundedAmount}</span><strong>{formatTestAmount(commerce.chargedDebit, locale)}</strong></div> : null}
            <div><span>{copy.benefit}</span><strong>{formatTestAmount(breakdown.benefit, locale)}</strong></div>
            <div><span>{copy.remaining}</span><strong>{formatTestAmount(balance, locale)}</strong></div>
            <div><span>{view === "refunded" ? copy.paymentReceipt : copy.receiptId}</span><code>{STABLE_B_RECEIPT_ID}</code></div>
            {view === "refunded" ? <div><span>{copy.refundReference}</span><code>{STABLE_B_REFUND_RECEIPT_ID}</code></div> : null}
          </section>
          {view === "receipt" ? <VisitStampReceiptB locale={locale} venueId={venueId} /> : null}
          {storageError === "refund" ? <p className={styles.storageError} data-testid="commerce-storage-error" role="alert">{copy.refundStorageError}</p> : null}
          {view === "receipt" ? (
            <details className={styles.refundDetails}><summary>{copy.support}</summary><p>{copy.supportBody}</p><button type="button" data-testid="payment-refund" onClick={refund}><RotateCcw size={17} aria-hidden="true" />{copy.refund}</button></details>
          ) : null}
          <button type="button" className={styles.primary} data-testid="payment-receipt-return" onClick={closeOffer}>{copy.return}<ChevronRight size={18} aria-hidden="true" /></button>
        </div>
      ) : null}
    </section>
  )
}

export function IdWalletCommerceB() {
  const { state, actions } = useOndoB()
  const [linkOpen, setLinkOpen] = useState(false)
  const [activityStorageError, setActivityStorageError] = useState(false)
  const linkButtonRef = useRef<HTMLButtonElement>(null)
  const locale = state.locale
  const copy = COPY[locale]
  const walletStatus = state.commerceWalletStatus
  const commerce = state.commerceSession
  const balance = stableCommerceBalanceB(commerce)
  const venueLocale = locale
  const originVenue = state.commerceOrigin?.kind === "canonical_place" ? canonicalMapVenueById(state.commerceOrigin.venueId) : undefined
  const originName = originVenue ? venueDisplayName(originVenue.name.ko, venueLocale) : null
  const receiptVenue = state.commerceReceiptVenueId ? canonicalMapVenueById(state.commerceReceiptVenueId) : undefined
  const receiptVenueName = receiptVenue ? venueDisplayName(receiptVenue.name.ko, venueLocale) : null

  function closeLink() {
    setLinkOpen(false)
    window.requestAnimationFrame(() => {
      const target = state.commerceOrigin ? document.querySelector<HTMLElement>("[data-testid='payment-confirm']") : linkButtonRef.current
      target?.focus({ preventScroll: true })
    })
  }

  function refundFromActivity() {
    setActivityStorageError(false)
    if (!actions.dispatchCommerce({ type: "REFUND" })) setActivityStorageError(true)
  }

  function openReceiptPlace() {
    if (!receiptVenue || !openSavedBDiscoveryVenue(receiptVenue.id, receiptVenue.cityId)) return
    actions.setSurface({ kind: "map" })
    actions.setTab("ondo")
  }

  const linkSheet = linkOpen ? <WalletConnectSheet locale={locale} boundarySeen={state.commerceLocalBoundarySeen} onAcknowledge={actions.acknowledgeCommerceLocalBoundary} onClose={closeLink} onReturn={(status) => { actions.setCommerceWalletStatus(status); closeLink() }} /> : null

  if (state.commerceOrigin?.kind === "canonical_place" && originName) {
    return <>
      <CanonicalCommerceOfferB locale={locale} venueId={state.commerceOrigin.venueId} venueName={originName} walletStatus={walletStatus} onConnect={() => setLinkOpen(true)} onClose={() => actions.returnFromCommerceOrigin()} />
      {linkSheet}
    </>
  }

  return (
    <section className={styles.root} data-testid="ondo-b-id-wallet-commerce" data-wallet={walletStatus} data-visual-direction="apple-wallet-flow8" aria-labelledby="id-wallet-commerce-title">
      <div className={styles.heading}><p>{copy.eyebrow}</p><h2 id="id-wallet-commerce-title">{copy.title}</h2><span>{copy.body}</span></div>

      <p className={styles.nonLiveBoundary} data-testid="wallet-non-live-boundary"><Info size={15} aria-hidden="true" />{copy.nonLive}</p>

      <section className={styles.balanceCard} data-testid="wallet-balance" data-flow8-object="wallet" data-wallet-state={walletStatus}>
        <div className={styles.balanceTop}><span>{copy.balance}</span><small data-status={walletStatus}>{walletStatus === "ready" ? copy.balanceReady : walletStatus === "failed" ? copy.balanceFailed : copy.balanceOff}</small></div>
        <div className={styles.balanceAmount}>
          <strong data-testid="wallet-display-equivalent">{formatTestDisplayKrw(balance, locale)}</strong>
          <span data-testid="wallet-test-balance">{formatTestAmount(balance, locale)}</span>
        </div>
        <div className={styles.balanceFooter}>
          <p>{copy.balanceEquivalent}</p>
          {walletStatus === "ready" ? (
            <button type="button" className={styles.balanceAction} onClick={() => actions.setCommerceWalletStatus("disconnected")}>{copy.disconnect}</button>
          ) : (
            <button ref={linkButtonRef} type="button" className={styles.balanceAction} data-testid="wallet-link-open" onClick={() => setLinkOpen(true)}><Link2 size={17} aria-hidden="true" />{walletStatus === "failed" ? copy.reconnect : copy.connect}</button>
          )}
        </div>
      </section>

      <div className={styles.dashboardGrid}>
        <section className={styles.benefitCard} data-testid="wallet-benefit">
          <div className={styles.cardHeading}><Gift size={20} aria-hidden="true" /><span>{copy.benefits}</span><small>{commerce.status === "paid" && commerce.voucherApplied ? copy.benefitUsed : copy.benefitState}</small></div>
          <h3>{copy.benefitTitle(formatTestDisplayKrw(STABLE_B_VOUCHER_VALUE, locale))}</h3><p>{copy.benefitBody}</p>
          <button type="button" onClick={() => actions.setTab("ondo")}><MapPin size={16} aria-hidden="true" />{copy.explore}<ChevronRight size={16} aria-hidden="true" /></button>
        </section>

        <section className={styles.activityCard} data-testid="wallet-activity">
          <div className={styles.cardHeading}><Clock3 size={20} aria-hidden="true" /><span>{copy.activity}</span></div>
          {commerce.status === "paid" || commerce.status === "refunded" ? (
            <details className={styles.activityReceipt} data-testid="wallet-activity-receipt">
              <summary><ReceiptText size={22} aria-hidden="true" /><span><strong>{commerce.status === "refunded" ? `${copy.refundedActivity} ${formatTestAmount(commerce.chargedDebit, locale)}` : `${copy.paidActivity} ${formatTestAmount(commerce.chargedDebit, locale)}`}</strong><small>{receiptVenueName ? `${copy.activityVenue} ${receiptVenueName}` : copy.activityReceipt}</small></span><ChevronRight size={17} aria-hidden="true" /></summary>
              <div><span>{commerce.status === "refunded" ? copy.originalPayment : copy.activityReceipt}</span><code>{STABLE_B_RECEIPT_ID}</code></div>
              {commerce.status === "refunded" ? <div><span>{copy.refundReference}</span><code>{STABLE_B_REFUND_RECEIPT_ID}</code></div> : null}
              {commerce.status === "paid" ? <button type="button" data-testid="wallet-activity-refund" onClick={refundFromActivity}><RotateCcw size={16} aria-hidden="true" />{OFFER_COPY[locale].refund}</button> : null}
              {receiptVenue ? <button type="button" data-testid="wallet-activity-place" onClick={openReceiptPlace}><MapPin size={16} aria-hidden="true" />{copy.activityPlace}<ChevronRight size={16} aria-hidden="true" /></button> : null}
              {activityStorageError ? <p className={styles.storageError} data-testid="commerce-storage-error" role="alert">{OFFER_COPY[locale].refundStorageError}</p> : null}
            </details>
          ) : <div className={styles.emptyActivity}><ReceiptText size={25} aria-hidden="true" /><div><h3>{copy.noActivity}</h3><p>{copy.noActivityBody}</p></div></div>}
        </section>
      </div>

      <details className={styles.privacy} data-testid="wallet-privacy"><summary><ShieldCheck size={17} aria-hidden="true" />{copy.privacy}</summary><p>{copy.privacyBody}</p><p><Info size={15} aria-hidden="true" />{copy.testTruth}</p></details>

      {linkSheet}
    </section>
  )
}
