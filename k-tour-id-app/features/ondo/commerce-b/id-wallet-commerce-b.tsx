"use client"

import type { KeyboardEvent } from "react"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Coins,
  CreditCard,
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
import { useOndoB, type OndoBCommerceFundingSource, type OndoBCommerceWalletStatus } from "../shared/state/ondo-b-provider"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import { useModalIsolation } from "../shared/ui/use-modal-isolation"
import { readQaRuntime } from "../shared/ui/use-qa-controls"
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
type QaRuntime = { wallet?: "failure"; payment?: QaPayment; benefit?: QaBenefit; holdProcessing?: boolean }

const FOCUSABLE = "button:not([disabled]),input:not([disabled]),[href],summary,[tabindex]:not([tabindex='-1'])"
const NUMBER_LOCALE: Record<Locale, string> = { en: "en-US", ko: "ko-KR", ja: "ja-JP" }
const TEST_DISPLAY_KRW_PER_OOKRW = 1_000
const DISPLAY_KRW_PER_USD = 1_350

const FUNDING_COPY = {
  en: {
    sheet: "Payment method",
    title: "How would you like to pay?",
    body: "Choose how you want to fund this purchase.",
    selected: "Payment method",
    change: "Change",
    chooseAvailable: "Choose an available method",
    done: "Use this method",
    ready: "Ready on this device",
    setup: "Set up Travel Wallet first",
    provider: "Not connected",
    balance: "Travel Wallet",
    balanceBody: "Use your KRW travel balance",
    bank: "Korean bank",
    bankBody: "For eligible Korean and resident accounts",
    card: "Apple Pay or card",
    cardBody: "A familiar option for visitors",
    digital: "Digital-dollar wallet",
    digitalBody: "Convert a supported digital dollar to KRW",
    unavailable: "A payment provider is not connected for this route yet. Choose Travel Wallet to continue.",
    technical: "Technical asset details",
    technicalBody: "The local ledger uses OOKRW internally. A digital-dollar funding route may use USDC or USDT. These identifiers never replace the KRW amount you confirm.",
  },
  ko: {
    sheet: "결제수단",
    title: "어떻게 결제할까요?",
    body: "이번 결제에 사용할 자금 경로를 선택하세요.",
    selected: "결제수단",
    change: "변경",
    chooseAvailable: "사용 가능한 수단 선택",
    done: "이 수단 사용",
    ready: "이 기기에서 사용 가능",
    setup: "여행 지갑을 먼저 설정하세요",
    provider: "연결 안 됨",
    balance: "여행 지갑",
    balanceBody: "KRW 여행 잔액 사용",
    bank: "한국 은행",
    bankBody: "내국인과 이용 가능한 장기체류 계좌",
    card: "Apple Pay 또는 카드",
    cardBody: "방문객에게 익숙한 결제 방식",
    digital: "디지털 달러 지갑",
    digitalBody: "지원되는 디지털 달러를 KRW로 전환",
    unavailable: "이 경로에는 아직 결제 제공자가 연결되지 않았어요. 계속하려면 여행 지갑을 선택하세요.",
    technical: "기술 자산 상세",
    technicalBody: "기기 내 원장은 OOKRW를 내부 단위로 사용합니다. 디지털 달러 자금 경로는 USDC 또는 USDT를 사용할 수 있습니다. 이 식별자들은 사용자가 확인하는 KRW 금액을 대신하지 않습니다.",
  },
  ja: {
    sheet: "支払い方法",
    title: "どの方法で支払いますか？",
    body: "今回の支払いに使う資金ルートを選択してください。",
    selected: "支払い方法",
    change: "変更",
    chooseAvailable: "利用できる方法を選択",
    done: "この方法を使う",
    ready: "この端末で利用可能",
    setup: "先にトラベルウォレットを設定",
    provider: "未接続",
    balance: "トラベルウォレット",
    balanceBody: "KRWの旅行残高を利用",
    bank: "韓国の銀行",
    bankBody: "利用資格のある韓国人・長期滞在者向け",
    card: "Apple Payまたはカード",
    cardBody: "旅行者に使い慣れた支払い方法",
    digital: "デジタルドル・ウォレット",
    digitalBody: "対応するデジタルドルをKRWへ変換",
    unavailable: "このルートには決済事業者がまだ接続されていません。続けるにはトラベルウォレットを選択してください。",
    technical: "技術アセットの詳細",
    technicalBody: "端末内台帳ではOOKRWを内部単位として使用します。デジタルドルの資金ルートではUSDCまたはUSDTを使用できます。これらの識別子は、利用者が確認するKRW金額に代わるものではありません。",
  },
} as const

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

function formatSignedOokrw(value: number, locale: Locale) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : ""
  return `${sign}${formatNumber(Math.abs(value), locale)} OOKRW`
}

function formatKrwFromSettlementUnits(value: number, locale: Locale) {
  return formatKrw(value * TEST_DISPLAY_KRW_PER_OOKRW, locale)
}

function formatUsdFromKrw(value: number, locale: Locale) {
  return new Intl.NumberFormat(NUMBER_LOCALE[locale], {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / DISPLAY_KRW_PER_USD).replace(/^\$/, "US$")
}

function formatUsdFromSettlementUnits(value: number, locale: Locale) {
  return formatUsdFromKrw(value * TEST_DISPLAY_KRW_PER_OOKRW, locale)
}

const COPY = {
  en: {
    eyebrow: "TRAVEL WALLET",
    title: "Wallet",
    body: "Your travel balance, meal benefits and receipts — ready when you choose to use them.",
    balance: "Travel balance",
    balanceEmpty: "Set up when you want to use an offer",
    testAsset: "Technical balance details",
    balanceReady: "Ready on this device",
    balanceFailed: "Setup needs another try",
    balanceEquivalent: "Estimated in USD",
    connect: "Set up travel wallet",
    connectCompact: "Continue",
    reconnect: "Try setup again",
    reconnectCompact: "Try again",
    disconnect: "Reset travel wallet",
    disconnectCompact: "Reset",
    benefits: "Available benefits",
    benefitTitle: (amount: string) => `${amount} meal benefit`,
    benefitBody: "Shown automatically at eligible ONDO meal offers.",
    benefitState: "1 available",
    explore: "Browse places",
    activity: "Recent activity",
    noActivity: "No receipts yet",
    noActivityBody: "Payments and refunds from ONDO meal offers appear here.",
    paidActivity: "Payment",
    refundedActivity: "Refund",
    activityVenue: "Meal benefit at",
    activityReceipt: "Receipt",
    originalPayment: "Original payment",
    refundReference: "Refund reference",
    refundedAmount: "Refunded",
    activityPlace: "Open exact place",
    privacy: "Payment privacy",
    privacyBody: "Only wallet readiness and your benefit choice are used for an offer. Your name, age, identity and address are not shared.",
    testTruth: "Amounts are shown to you in KRW and estimated USD. The device ledger uses OOKRW internally. USDC or USDT may appear here only when selected as a funding source. No bank, card, wallet or payment provider is connected yet, so no money or digital asset moves.",
    linkDialog: "Set up travel wallet",
    linkTitle: "Set up your K-Tour ID wallet",
    linkBody: "Keep your travel balance and ONDO meal benefits together for this trip.",
    linking: "Getting your wallet ready…",
    linkingBody: "Your current place and meal benefit stay open.",
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
    balance: "여행 잔액",
    balanceEmpty: "오퍼를 사용할 때 설정하세요",
    testAsset: "기술적인 잔액 상세",
    balanceReady: "이 기기에서 사용 가능",
    balanceFailed: "설정을 다시 시도해 주세요",
    balanceEquivalent: "USD 예상 금액",
    connect: "여행 지갑 설정",
    connectCompact: "계속",
    reconnect: "설정 다시 시도",
    reconnectCompact: "다시 시도",
    disconnect: "여행 지갑 초기화",
    disconnectCompact: "초기화",
    benefits: "사용 가능한 혜택",
    benefitTitle: (amount: string) => `식사 ${amount} 혜택`,
    benefitBody: "대상 ONDO 식사 오퍼에서 자동으로 보여드려요.",
    benefitState: "1개 사용 가능",
    explore: "장소 둘러보기",
    activity: "최근 활동",
    noActivity: "아직 영수증이 없어요",
    noActivityBody: "ONDO 식사 오퍼의 결제와 환불 내역이 여기에 표시됩니다.",
    paidActivity: "결제",
    refundedActivity: "환불",
    activityVenue: "식사 혜택 장소",
    activityReceipt: "영수증",
    originalPayment: "원 결제",
    refundReference: "환불 참조",
    refundedAmount: "환불 금액",
    activityPlace: "이 장소 열기",
    privacy: "결제 개인정보",
    privacyBody: "오퍼에는 지갑 준비 상태와 혜택 선택만 사용합니다. 이름·나이·신원·주소는 공유하지 않아요.",
    testTruth: "금액은 KRW와 예상 USD로 표시합니다. 기기 내 원장은 OOKRW를 내부 단위로 사용하며, USDC나 USDT는 사용자가 자금 출처로 선택한 경우에만 이 상세에서 보여줍니다. 아직 은행·카드·지갑·결제 제공자가 연결되지 않아 실제 금액이나 디지털 자산은 이동하지 않습니다.",
    linkDialog: "여행 지갑 설정",
    linkTitle: "K-Tour ID 지갑 설정",
    linkBody: "이번 여행의 잔액과 ONDO 식사 혜택을 한곳에 모아두세요.",
    linking: "지갑을 준비하는 중…",
    linkingBody: "보고 있던 장소와 식사 혜택은 그대로 열려 있어요.",
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
    body: "旅の残高、食事特典、レシートをまとめて確認し、使うときだけ準備できます。",
    balance: "旅の残高",
    balanceEmpty: "オファーを使うときに設定",
    testAsset: "残高の技術情報",
    balanceReady: "この端末で利用可能",
    balanceFailed: "設定をもう一度お試しください",
    balanceEquivalent: "USDでの概算",
    connect: "旅のウォレットを設定",
    connectCompact: "続ける",
    reconnect: "設定をもう一度試す",
    reconnectCompact: "再試行",
    disconnect: "旅のウォレットをリセット",
    disconnectCompact: "リセット",
    benefits: "利用できる特典",
    benefitTitle: (amount: string) => `食事が${amount}お得`,
    benefitBody: "対象のONDO食事オファーで自動的にご案内します。",
    benefitState: "1件利用可能",
    explore: "お店を見る",
    activity: "最近の利用履歴",
    noActivity: "レシートはまだありません",
    noActivityBody: "ONDOの食事オファーでの支払いと返金がここに表示されます。",
    paidActivity: "支払い",
    refundedActivity: "返金",
    activityVenue: "食事特典の利用先",
    activityReceipt: "レシート",
    originalPayment: "元の支払い記録",
    refundReference: "返金参照番号",
    refundedAmount: "戻した残高",
    activityPlace: "このお店を開く",
    privacy: "決済時のプライバシー",
    privacyBody: "オファーには、ウォレットの準備状況と特典の選択だけを使用します。名前、年齢、本人情報、住所は共有しません。",
    testTruth: "金額はKRWとUSDの概算で表示します。端末内台帳ではOOKRWを内部単位として使用し、USDCやUSDTは資金元として選択した場合にだけこの詳細に表示します。銀行、カード、ウォレット、決済事業者はまだ接続されていないため、実際のお金やデジタル資産は移動しません。",
    linkDialog: "旅のウォレットを設定",
    linkTitle: "K-Tour IDウォレットを設定",
    linkBody: "旅の残高とONDOの食事特典を、この旅行のためにまとめて管理できます。",
    linking: "ウォレットを準備しています…",
    linkingBody: "見ていた場所と食事特典はそのまま開いています。",
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
    title: "Your meal benefit",
    from: "Meal offer at",
    venueBoundaryPrefix: "ONDO on-device offer at",
    venueBoundarySuffix: "· not offered or accepted by the venue · no wallet/provider contacted · no money moves",
    price: "Meal",
    testQuote: "Price in USD",
    benefit: "ONDO benefit",
    total: "You pay",
    asset: "KRW",
    voucher: "Your meal benefit",
    voucherBody: (minimum: string) => `${minimum} minimum met · valid through Sep 30`,
    fixedQuote: "Display estimate · ₩1,350 = US$1 · provider rate and fees unavailable",
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
    consentBody: "Only wallet readiness and this benefit choice are used. Your name, identity, age, address and original documents stay private.",
    consent: "I agree to use my travel balance for this offer",
    pay: (amount: string) => `Confirm ${amount}`,
    connectToPay: "Set up travel wallet to continue",
    back: "Back to place",
    close: "Close and return to place",
    processing: "Saving your choice…",
    processingBody: "Keeping this meal benefit and balance record on this device.",
    failed: "Payment didn’t complete",
    failedBody: "Nothing was debited and your benefit is still available.",
    insufficient: "Not enough travel balance",
    insufficientBody: "No debit was made. The temporary condition is cleared before you retry, or you can choose another way at the venue.",
    paymentStorageError: "Could not save this on-device payment record. Nothing was completed — try again.",
    gateStorageError: "Could not open the Payment check. The offer and device balance are unchanged — try again.",
    refundStorageError: "Could not save this on-device refund record. The original payment record is unchanged — try again.",
    retry: "Try again",
    receipt: "Saved to Travel Wallet",
    receiptBody: "Your meal benefit and balance are now together in your Travel Wallet.",
    receiptWithoutBenefit: "Your balance choice is now saved in your Travel Wallet.",
    paid: "Amount",
    remaining: "Balance left",
    receiptId: "Receipt",
    originalPayment: "Original payment",
    paymentReceipt: "Payment receipt",
    refundReference: "Refund reference",
    refundedAmount: "Refunded",
    refund: "Restore balance",
    support: "Restore this record",
    supportBody: "Restore the travel balance and one-use benefit saved on this device.",
    refunded: "Balance restored",
    refundedBody: "Your travel balance and meal benefit are available again.",
    refundedWithoutBenefit: "Your travel balance is available again and the unused benefit remains available.",
    return: "Return to place",
    returnToPlace: (venue: string) => `Return to ${venue}`,
    crossVenueReceipt: (receiptVenue: string, returnVenue: string) => `This device already has a receipt for ${receiptVenue}. It is not a transaction at ${returnVenue}.`,
    testMode: "Payment details",
    demoNote: "Saved on this device",
    providerOrder: "Place order",
    providerNotConnected: "Not connected",
    providerNotConnectedBody: "No order was placed with the venue. This receipt records only the ONDO device balance.",
    testTruth: "Customer amounts use KRW and estimated USD. The device ledger uses OOKRW internally. If a visitor chooses a digital-dollar funding route, its source may be USDC or USDT. No wallet, merchant, stablecoin network or payment provider is currently connected.",
    settlement: "Balance record",
    operation: "Operation",
    holderChange: "Your balance",
    merchantChange: "Merchant side",
    combinedChange: "Combined change",
    recordedOnly: "Recorded on this device · not sent",
  },
  ko: {
    eyebrow: "ONDO 식사 혜택",
    title: "나의 식사 혜택",
    from: "식사 오퍼 장소",
    venueBoundaryPrefix: "ONDO 기기 내 오퍼 장소",
    venueBoundarySuffix: "· 매장에서 제공하거나 접수하지 않음 · 지갑·공급자 연결 없음 · 돈 이동 없음",
    price: "식사",
    testQuote: "USD 예상 금액",
    benefit: "ONDO 혜택",
    total: "결제 금액",
    asset: "KRW",
    voucher: "나의 식사 혜택",
    voucherBody: (minimum: string) => `${minimum} 최소 금액 충족 · 9월 30일까지`,
    fixedQuote: "표시용 예상값 · ₩1,350 = US$1 · 실제 환율과 수수료는 제공자 연결 후 확인",
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
    consentBody: "지갑 준비 상태와 이 혜택 선택만 사용합니다. 이름·신원·나이·주소·원본 문서는 비공개로 유지돼요.",
    consent: "이 오퍼에 여행 잔액을 사용하는 데 동의합니다",
    pay: (amount: string) => `${amount} 확인`,
    connectToPay: "여행 지갑을 설정하고 계속",
    back: "장소로 돌아가기",
    close: "닫고 장소로 돌아가기",
    processing: "선택을 저장하는 중…",
    processingBody: "식사 혜택과 잔액 기록을 이 기기에 보관하고 있어요.",
    failed: "결제를 완료하지 못했어요",
    failedBody: "차감된 잔액은 없고 혜택도 그대로 사용할 수 있어요.",
    insufficient: "여행 잔액이 부족해요",
    insufficientBody: "차감된 잔액은 없습니다. 재시도 전에 임시 조건이 해제되며, 매장에서 다른 방법을 선택할 수도 있어요.",
    paymentStorageError: "이 기기에 결제 기록을 저장하지 못했어요. 완료된 내용은 없습니다. 다시 시도하세요.",
    gateStorageError: "결제 확인을 열지 못했어요. 오퍼와 기기 내 잔액은 그대로입니다. 다시 시도하세요.",
    refundStorageError: "이 기기에 환불 기록을 저장하지 못했어요. 원 결제 기록은 그대로입니다. 다시 시도하세요.",
    retry: "다시 시도",
    receipt: "여행 지갑에 저장됨",
    receiptBody: "식사 혜택과 잔액을 여행 지갑에서 함께 확인할 수 있어요.",
    receiptWithoutBenefit: "선택한 잔액 기록을 여행 지갑에 저장했어요.",
    paid: "금액",
    remaining: "남은 잔액",
    receiptId: "영수증",
    originalPayment: "원 결제",
    paymentReceipt: "결제 영수증",
    refundReference: "환불 참조",
    refundedAmount: "환불 금액",
    refund: "잔액 복원",
    support: "이 기록 복원",
    supportBody: "이 기기에 저장된 여행 잔액과 1회 혜택을 다시 사용할 수 있게 복원합니다.",
    refunded: "잔액 복원 완료",
    refundedBody: "여행 잔액과 식사 혜택을 다시 사용할 수 있어요.",
    refundedWithoutBenefit: "여행 잔액을 복원했고 사용하지 않은 혜택은 그대로 남아 있어요.",
    return: "장소로 돌아가기",
    returnToPlace: (venue: string) => `장소로 돌아가기 · ${venue}`,
    crossVenueReceipt: (receiptVenue: string, returnVenue: string) => `이 로컬 동작에는 이미 ${receiptVenue} 영수증이 있어요. ${returnVenue} 거래가 아닙니다.`,
    testMode: "결제 상세",
    demoNote: "이 기기에 저장됨",
    providerOrder: "매장 주문",
    providerNotConnected: "연결되지 않음",
    providerNotConnectedBody: "매장 주문은 접수되지 않았습니다. 이 영수증은 ONDO 기기 내 잔액만 기록합니다.",
    testTruth: "사용자 금액은 KRW와 예상 USD로 표시하고, 기기 내 원장은 OOKRW를 내부 단위로 사용합니다. 방문자가 디지털 달러 자금 경로를 선택하는 경우 출처는 USDC 또는 USDT일 수 있습니다. 현재 외부 지갑·가맹점·스테이블코인 네트워크·결제 제공자는 연결되어 있지 않습니다.",
    settlement: "잔액 기록",
    operation: "작업 번호",
    holderChange: "내 잔액",
    merchantChange: "매장 측",
    combinedChange: "합산 변화",
    recordedOnly: "이 기기에만 기록 · 외부 전송 없음",
  },
  ja: {
    eyebrow: "ONDOの食事特典",
    title: "食事特典",
    from: "食事オファー対象店",
    venueBoundaryPrefix: "ONDO端末内オファー対象店",
    venueBoundarySuffix: "· お店での提供・受付なし · ウォレット・事業者への接続なし · お金の移動なし",
    price: "食事代",
    testQuote: "USDでの概算",
    benefit: "ONDO特典",
    total: "使用する残高",
    asset: "KRW",
    voucher: "食事特典",
    voucherBody: (minimum: string) => `最低金額${minimum}を達成 · 9月30日まで有効`,
    fixedQuote: "表示用の概算・₩1,350 = US$1・実際のレートと手数料は事業者接続後に確認",
    recommendation: "この食事におすすめ",
    applied: "適用済み",
    apply: "特典を適用",
    remove: "今回は使わない",
    available: "利用可能",
    policyIneligible: "このお店では特典を利用できません",
    policyBelowMinimum: "食事の最低金額に達していません",
    policyExpired: "この特典の有効期限が切れています",
    policyBody: "変更はありません。お店の画面に戻り、別の方法を選んでください。",
    consentTitle: "必要な情報だけで支払いを確認",
    consentBody: "使うのはウォレットの準備状況とこの特典の選択だけです。名前、本人情報、年齢、住所、元の書類は非公開のままです。",
    consent: "このオファーに旅の残高を使うことに同意します",
    pay: (amount: string) => `${amount}を確認`,
    connectToPay: "旅のウォレットを設定して続ける",
    back: "お店の画面に戻る",
    close: "閉じてお店の画面に戻る",
    processing: "選択を保存しています…",
    processingBody: "食事特典と残高記録をこの端末に保存しています。",
    failed: "支払いを完了できませんでした",
    failedBody: "残高は引かれておらず、特典も引き続き利用できます。",
    insufficient: "旅の残高が不足しています",
    insufficientBody: "残高は引かれていません。再試行の前に一時条件を解除します。お店で別の方法を選ぶこともできます。",
    paymentStorageError: "この端末に支払い記録を保存できませんでした。完了した処理はありません。もう一度お試しください。",
    gateStorageError: "支払い確認を開けませんでした。オファーと端末内残高は変わっていません。もう一度お試しください。",
    refundStorageError: "この端末に返金記録を保存できませんでした。元の支払い記録は変わっていません。もう一度お試しください。",
    retry: "もう一度試す",
    receipt: "トラベルウォレットに保存",
    receiptBody: "食事特典と残高をトラベルウォレットでまとめて確認できます。",
    receiptWithoutBenefit: "選択した残高記録をトラベルウォレットに保存しました。",
    paid: "金額",
    remaining: "残りの残高",
    receiptId: "レシート番号",
    originalPayment: "元の支払い記録",
    paymentReceipt: "決済レシート",
    refundReference: "返金参照番号",
    refundedAmount: "戻した残高",
    refund: "残高を復元",
    support: "この記録を復元",
    supportBody: "この端末に保存した旅の残高と1回限りの特典を、もう一度使える状態に戻します。",
    refunded: "残高を復元しました",
    refundedBody: "旅の残高と食事特典をもう一度利用できます。",
    refundedWithoutBenefit: "旅の残高を復元し、未使用の特典はそのまま残っています。",
    return: "同じお店の画面に戻る",
    returnToPlace: (venue: string) => `${venue}に戻る`,
    crossVenueReceipt: (receiptVenue: string, returnVenue: string) => `このローカル操作には${receiptVenue}のレシートがあります。${returnVenue}の取引ではありません。`,
    testMode: "決済の詳細",
    demoNote: "この端末に保存",
    providerOrder: "店舗への注文",
    providerNotConnected: "未接続",
    providerNotConnectedBody: "店舗への注文は送信されていません。このレシートはONDOの端末内残高だけを記録します。",
    testTruth: "利用者向けの金額はKRWとUSDの概算で表示し、端末内台帳ではOOKRWを内部単位として使用します。旅行者がデジタルドルの資金ルートを選ぶ場合、資金元はUSDCまたはUSDTです。現在、外部ウォレット、加盟店、ステーブルコインネットワーク、決済事業者は接続されていません。",
    settlement: "残高の記録",
    operation: "操作番号",
    holderChange: "自分の残高",
    merchantChange: "店舗側",
    combinedChange: "合計変化",
    recordedOnly: "この端末だけに記録・外部送信なし",
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
      const outcome: WalletReturn = readQaRuntime<QaRuntime>()?.wallet === "failure" ? "failed" : "ready"
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

function fundingSourceLabel(locale: Locale, source: OndoBCommerceFundingSource) {
  const copy = FUNDING_COPY[locale]
  if (source === "krw_bank") return copy.bank
  if (source === "card_wallet") return copy.card
  if (source === "digital_dollar") return copy.digital
  return copy.balance
}

function FundingSourceSheet({ locale, source, walletReady, onSelect, onClose }: {
  locale: Locale
  source: OndoBCommerceFundingSource
  walletReady: boolean
  onSelect(source: OndoBCommerceFundingSource): void
  onClose(): void
}) {
  const copy = FUNDING_COPY[locale]
  const rootRef = useRef<HTMLDivElement>(null)
  useModalIsolation(true, rootRef)
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>("[data-funding-focus]")?.focus({ preventScroll: true }))
    return () => window.cancelAnimationFrame(frame)
  }, [])
  const methods = [
    { id: "travel_balance" as const, Icon: WalletCards, title: copy.balance, body: copy.balanceBody, status: walletReady ? copy.ready : copy.setup },
    { id: "krw_bank" as const, Icon: Banknote, title: copy.bank, body: copy.bankBody, status: copy.provider },
    { id: "card_wallet" as const, Icon: CreditCard, title: copy.card, body: copy.cardBody, status: copy.provider },
    { id: "digital_dollar" as const, Icon: Coins, title: copy.digital, body: copy.digitalBody, status: copy.provider },
  ]
  return createPortal(
    <div className={styles.sheetBackdrop}>
      <div ref={rootRef} className={`${styles.sheet} ${styles.fundingSheet}`} role="dialog" aria-modal="true" aria-labelledby="funding-source-title" data-testid="funding-source-sheet" data-modal-layer-priority="210" onKeyDown={(event) => trapFocus(event, rootRef.current, onClose)}>
        <div className={styles.grabber} aria-hidden="true" />
        <header><span>{copy.sheet}</span><button type="button" data-funding-focus aria-label={COPY[locale].close} onClick={onClose}><X size={20} aria-hidden="true" /></button></header>
        <div className={styles.fundingSheetBody}>
          <h2 id="funding-source-title">{copy.title}</h2>
          <p>{copy.body}</p>
          <fieldset className={styles.fundingOptions}>
            <legend className={styles.srOnly}>{copy.sheet}</legend>
            {methods.map(({ id, Icon, title, body, status }) => (
              <label key={id} data-selected={source === id} data-connected={id === "travel_balance" && walletReady}>
                <input type="radio" name="funding-source" value={id} checked={source === id} onChange={() => onSelect(id)} />
                <span className={styles.fundingIcon}><Icon size={20} aria-hidden="true" /></span>
                <span><strong>{title}</strong><small>{body}</small></span>
                <em>{status}</em>
              </label>
            ))}
          </fieldset>
          {source !== "travel_balance" ? <p className={styles.fundingUnavailable} role="status"><Info size={16} aria-hidden="true" />{copy.unavailable}</p> : null}
          <details className={styles.truth}><summary>{copy.technical}</summary><p>{copy.technicalBody}</p></details>
          <button type="button" className={styles.primary} onClick={onClose}>{copy.done}</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function CanonicalCommerceOfferB({ locale, venueId, venueName, originVenueId, originVenueName, crossVenueReceipt, walletStatus, fundingSource, onConnect, onOpenFunding, onClose }: { locale: Locale; venueId: string; venueName: string; originVenueId: string; originVenueName: string; crossVenueReceipt: boolean; walletStatus: OndoBCommerceWalletStatus; fundingSource: OndoBCommerceFundingSource; onConnect(): void; onOpenFunding(): void; onClose(): void }) {
  const { state, actions } = useOndoB()
  const copy = OFFER_COPY[locale]
  const fundingCopy = FUNDING_COPY[locale]
  const rootRef = useRef<HTMLElement>(null)
  const pendingRef = useRef(false)
  const consumedCheckoutRef = useRef<BCheckoutActionReturn | null>(null)
  const preserveReturnToRef = useRef(false)
  const commerce = state.commerceSession
  const [view, setView] = useState<PaymentView>(() => commerce.status === "paid" ? "receipt" : commerce.status === "refunded" ? "refunded" : "review")
  const previousViewRef = useRef<PaymentView>(view)
  const [consent, setConsent] = useState(false)
  const [benefitQa, setBenefitQa] = useState<QaBenefit | undefined>()
  const [storageError, setStorageError] = useState<"gate" | "payment" | "refund" | null>(null)
  const returnTo = JSON.stringify({ cta: "START_MEAL_PAYMENT", venueId: originVenueId, offerId: "meal-offer-gukbap" })
  const balance = stableCommerceBalanceB(commerce)
  const breakdown = stableCommerceBreakdownB(commerce)
  const debit = stableCommerceQuoteDebitB(commerce)
  const benefitSelected = commerce.voucher === "selected" || commerce.voucher === "consumed"
  const fundingAvailable = fundingSource === "travel_balance" && walletStatus === "ready"
  const fundingStatus = fundingSource === "travel_balance"
    ? walletStatus === "ready" ? fundingCopy.ready : fundingCopy.setup
    : fundingCopy.provider
  const settlementKind = view === "refunded" ? "REFUND" : "PAYMENT"
  const settlementEntries = commerce.ledger.filter((entry) => entry.kind === settlementKind)
  const holderEntry = settlementEntries.find((entry) => entry.side === "holder")
  const merchantEntry = settlementEntries.find((entry) => entry.side === "merchant")
  const settlementTotal = settlementEntries.reduce((total, entry) => total + entry.amount, 0)
  const benefitExpiresAtMs = Date.parse("2026-09-30T23:59:59+09:00")
  const benefitPolicy = stableCommerceBenefitPolicyB({
    venueEligible: benefitQa !== "ineligible",
    mealOOKRW: benefitQa === "below_minimum" ? 21 : STABLE_B_OOKRW_PRICE,
    minimumOOKRW: STABLE_B_OOKRW_PRICE,
    nowMs: benefitQa === "expired" ? benefitExpiresAtMs + 1 : Date.now(),
    expiresAtMs: benefitExpiresAtMs,
  })
  useModalIsolation(true, rootRef)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>("[data-commerce-initial-focus]")?.focus({ preventScroll: true }))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    rootRef.current?.scrollTo({ top: 0, behavior: "auto" })
    if (previousViewRef.current === view) return
    previousViewRef.current = view
    const frame = window.requestAnimationFrame(() => {
      rootRef.current?.querySelector<HTMLElement>(`[data-payment-view-focus="${view}"]`)?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
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
    setBenefitQa(readQaRuntime<QaRuntime>()?.benefit)
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
        restoreConsumedBActionAfterMutationFailure(window.sessionStorage, consumed)
        consumedCheckoutRef.current = null
      }
      preserveReturnToRef.current = true
      pendingRef.current = false
      actions.dispatchCommerce({ type: "CANCEL_CONFIRMATION" })
      onClose()
    }
    window.addEventListener("keydown", cancelPending)
    return () => window.removeEventListener("keydown", cancelPending)
  }, [actions, onClose, view])

  useEffect(() => {
    if (view !== "processing") return
    const qa = readQaRuntime<QaRuntime>()
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
        if (outcome === "success") {
          preserveReturnToRef.current = false
          finalizeConsumedBAction(window.sessionStorage, consumed)
          window.dispatchEvent(new CustomEvent(B_ACTION_GATE_COMPLETE_EVENT, { detail: consumed }))
        } else {
          preserveReturnToRef.current = true
          if (!restoreConsumedBActionAfterMutationFailure(window.sessionStorage, consumed)) setStorageError("payment")
        }
        consumedCheckoutRef.current = null
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
    if (!preserveReturnToRef.current && pending?.cta === "START_CHECKOUT" && pending.venueId === venueId && pending.offerId === "meal-offer-gukbap") {
      abandonPendingBAction(window.sessionStorage, pending)
    }
    const consumed = consumedCheckoutRef.current
    if (consumed) {
      preserveReturnToRef.current = true
      restoreConsumedBActionAfterMutationFailure(window.sessionStorage, consumed)
      consumedCheckoutRef.current = null
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
      data-origin-venue-id={originVenueId}
      data-transaction-venue-id={venueId}
      data-cross-venue-receipt={crossVenueReceipt ? "true" : "false"}
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
        <button type="button" data-commerce-initial-focus data-testid="commerce-origin-return" aria-label={crossVenueReceipt ? copy.returnToPlace(originVenueName) : copy.close} onClick={closeOffer}><ArrowLeft size={20} aria-hidden="true" /></button>
        <span>{copy.eyebrow}</span>
        <button type="button" aria-label={crossVenueReceipt ? copy.returnToPlace(originVenueName) : copy.close} onClick={closeOffer}><X size={20} aria-hidden="true" /></button>
      </header>

      {crossVenueReceipt ? (
        <p className={styles.offerTruth} data-testid="commerce-cross-venue-receipt-boundary">
          {copy.crossVenueReceipt(venueName, originVenueName)}
        </p>
      ) : null}

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
            <div><span>{copy.testQuote}</span><strong>≈ {formatUsdFromKrw(STABLE_B_KRW_PRICE, locale)}</strong></div>
            <div className={styles.discount} data-flow8-benefit-delta={benefitSelected ? "applied" : "available"}><span>{copy.benefit}</span><strong>{benefitSelected ? `−${formatKrwFromSettlementUnits(STABLE_B_VOUCHER_VALUE, locale)}` : copy.available}</strong></div>
            <div className={styles.quoteTotal}><span>{copy.total}</span><strong>{formatKrwFromSettlementUnits(debit, locale)} <small>{copy.asset}</small></strong></div>
          </section>
          <p className={styles.demoNote} data-testid="commerce-device-balance-boundary"><ShieldCheck size={15} aria-hidden="true" />{copy.demoNote}</p>

          <section className={styles.fundingSummary} data-testid="commerce-funding-source" data-funding-source={fundingSource} data-provider-connected={fundingAvailable}>
            <div><WalletCards size={20} aria-hidden="true" /><span><small>{fundingCopy.selected}</small><strong>{fundingSourceLabel(locale, fundingSource)}</strong><em>{fundingStatus}</em></span></div>
            <button type="button" onClick={onOpenFunding}>{fundingCopy.change}</button>
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

          <details className={styles.testDetails} data-testid="commerce-payment-details">
            <summary>{copy.testMode}</summary>
            <p data-testid="commerce-venue-test-boundary">{copy.venueBoundaryPrefix} <strong>{venueName}</strong> {copy.venueBoundarySuffix}</p>
            <p data-testid="commerce-provider-boundary"><strong>{copy.providerOrder} · {copy.providerNotConnected}</strong><br />{copy.providerNotConnectedBody}</p>
            <p data-testid="commerce-fixed-quote-boundary">{copy.fixedQuote}</p>
            <p>{copy.testTruth}</p>
          </details>
          {storageError === "gate" ? <p className={styles.storageError} data-testid="payment-gate-storage-error" role="alert">{copy.gateStorageError}</p> : null}
          <div className={styles.offerDecision} data-flow8-decision="payment">
            <button type="button" className={styles.payButton} data-testid="payment-confirm" disabled={fundingAvailable && !consent} onClick={fundingSource !== "travel_balance" ? onOpenFunding : walletStatus === "ready" ? pay : onConnect}><CircleDollarSign size={19} aria-hidden="true" />{fundingSource !== "travel_balance" ? fundingCopy.chooseAvailable : walletStatus === "ready" ? copy.pay(formatKrwFromSettlementUnits(debit, locale)) : copy.connectToPay}</button>
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
        <div className={styles.paymentStatus} data-testid="payment-processing" data-payment-view-focus="processing" tabIndex={-1} aria-live="polite"><LoaderCircle className={styles.spinner} size={36} aria-hidden="true" /><h2>{copy.processing}</h2><p>{copy.processingBody}</p></div>
      ) : null}

      {view === "failure" || view === "insufficient" ? (
        <div className={styles.paymentStatus} data-testid="payment-recovery" data-payment-view-focus={view} data-recovery={view} tabIndex={-1} aria-live="polite">
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
        <div className={styles.receiptWrap} data-testid="payment-receipt" data-payment-view-focus={view} data-refunded={view === "refunded"} data-storage-error={storageError ?? "none"} data-completion-kind={view} data-flow8-object="receipt" tabIndex={-1} aria-live="polite">
          <div className={styles.receiptMark}>{view === "refunded" ? <RotateCcw size={31} aria-hidden="true" /> : <BadgeCheck size={33} aria-hidden="true" />}</div>
          <p className={styles.receiptEyebrow}>{venueName}</p>
          <h2>{view === "refunded" ? copy.refunded : copy.receipt}</h2>
          <p className={styles.receiptLead}>{view === "refunded"
            ? commerce.voucherApplied ? copy.refundedBody : copy.refundedWithoutBenefit
            : commerce.voucherApplied ? copy.receiptBody : copy.receiptWithoutBenefit}</p>
          <section className={styles.receiptCard}>
            <div><span>{view === "refunded" ? copy.originalPayment : copy.paid}</span><strong>{formatKrwFromSettlementUnits(commerce.chargedDebit, locale)}</strong></div>
            {view === "refunded" ? <div><span>{copy.refundedAmount}</span><strong>{formatKrwFromSettlementUnits(commerce.chargedDebit, locale)}</strong></div> : null}
            <div><span>{copy.benefit}</span><strong>{formatKrwFromSettlementUnits(breakdown.benefit, locale)}</strong></div>
            <div><span>{copy.remaining}</span><strong>{formatKrwFromSettlementUnits(balance, locale)}</strong></div>
            <div><span>{view === "refunded" ? copy.paymentReceipt : copy.receiptId}</span><code>{STABLE_B_RECEIPT_ID}</code></div>
            {view === "refunded" ? <div><span>{copy.refundReference}</span><code>{STABLE_B_REFUND_RECEIPT_ID}</code></div> : null}
          </section>
          {holderEntry && merchantEntry ? (
            <details className={styles.settlementDetails} data-testid="commerce-settlement-details">
              <summary><ReceiptText size={17} aria-hidden="true" />{copy.settlement}</summary>
              <div data-testid="commerce-operation-id"><span>{copy.operation}</span><code>{holderEntry.operationId}</code></div>
              <div data-testid="commerce-holder-delta"><span>{copy.holderChange}</span><strong>{formatSignedOokrw(holderEntry.amount, locale)}</strong></div>
              <div data-testid="commerce-merchant-delta"><span>{copy.merchantChange}</span><strong>{formatSignedOokrw(merchantEntry.amount, locale)}</strong></div>
              <div data-testid="commerce-settlement-total"><span>{copy.combinedChange}</span><strong>{formatSignedOokrw(settlementTotal, locale)}</strong></div>
              <div data-testid="commerce-provider-status" data-provider-order={commerce.providerOrder}><span>{copy.providerOrder}</span><strong>{copy.providerNotConnected}</strong></div>
              <p><ShieldCheck size={15} aria-hidden="true" />{copy.recordedOnly}</p>
            </details>
          ) : null}
          {view === "receipt" ? <VisitStampReceiptB locale={locale} venueId={venueId} /> : null}
          {storageError === "refund" ? <p className={styles.storageError} data-testid="commerce-storage-error" role="alert">{copy.refundStorageError}</p> : null}
          {view === "receipt" ? (
            <details className={styles.refundDetails} data-testid="commerce-refund-details"><summary>{copy.support}</summary><p>{copy.supportBody}</p><button type="button" data-testid="payment-refund" onClick={refund}><RotateCcw size={17} aria-hidden="true" />{copy.refund}</button></details>
          ) : null}
          <button type="button" className={styles.primary} data-testid="payment-receipt-return" onClick={closeOffer}>{crossVenueReceipt ? copy.returnToPlace(originVenueName) : copy.return}<ChevronRight size={18} aria-hidden="true" /></button>
        </div>
      ) : null}
    </section>
  )
}

export function IdWalletCommerceB() {
  const { state, actions } = useOndoB()
  const [linkOpen, setLinkOpen] = useState(false)
  const [fundingOpen, setFundingOpen] = useState(false)
  const [activityStorageError, setActivityStorageError] = useState(false)
  const linkButtonRef = useRef<HTMLButtonElement>(null)
  const fundingButtonRef = useRef<HTMLButtonElement>(null)
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
  const hasTerminalReceipt = commerce.status === "paid" || commerce.status === "refunded"
  const crossVenueReceipt = Boolean(hasTerminalReceipt && originVenue && receiptVenue && originVenue.id !== receiptVenue.id)
  const fundingCopy = FUNDING_COPY[locale]

  function closeLink() {
    setLinkOpen(false)
    window.requestAnimationFrame(() => {
      const target = state.commerceOrigin ? document.querySelector<HTMLElement>("[data-testid='payment-confirm']") : linkButtonRef.current
      target?.focus({ preventScroll: true })
    })
  }

  function closeFunding() {
    setFundingOpen(false)
    window.requestAnimationFrame(() => {
      const target = state.commerceOrigin
        ? document.querySelector<HTMLElement>("[data-testid='commerce-funding-source'] button")
        : fundingButtonRef.current
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
  const fundingSheet = fundingOpen ? <FundingSourceSheet locale={locale} source={state.commerceFundingSource} walletReady={walletStatus === "ready"} onSelect={actions.setCommerceFundingSource} onClose={closeFunding} /> : null

  if (state.commerceOrigin?.kind === "canonical_place" && originName) {
    const transactionVenue = crossVenueReceipt && receiptVenue && receiptVenueName
      ? { id: receiptVenue.id, name: receiptVenueName }
      : { id: state.commerceOrigin.venueId, name: originName }
    return <>
      <CanonicalCommerceOfferB locale={locale} venueId={transactionVenue.id} venueName={transactionVenue.name} originVenueId={state.commerceOrigin.venueId} originVenueName={originName} crossVenueReceipt={crossVenueReceipt} walletStatus={walletStatus} fundingSource={state.commerceFundingSource} onConnect={() => setLinkOpen(true)} onOpenFunding={() => setFundingOpen(true)} onClose={() => actions.returnFromCommerceOrigin()} />
      {linkSheet}
      {fundingSheet}
    </>
  }

  return (
    <section className={styles.root} data-testid="ondo-b-id-wallet-commerce" data-wallet={walletStatus} data-visual-direction="apple-wallet-flow8" aria-labelledby="id-wallet-commerce-title">
      <div className={styles.heading}><p data-testid="wallet-eyebrow">{copy.eyebrow}</p><h2 id="id-wallet-commerce-title">{copy.title}</h2><span>{copy.body}</span></div>

      <section className={styles.balanceCard} data-testid="wallet-balance" data-flow8-object="wallet" data-wallet-state={walletStatus}>
        <div className={styles.balanceTop}><span>{copy.balance}</span>{walletStatus !== "disconnected" ? <small data-status={walletStatus}>{walletStatus === "ready" ? copy.balanceReady : copy.balanceFailed}</small> : null}</div>
        <div className={styles.balanceAmount}>
          <strong data-testid="wallet-display-equivalent">{walletStatus === "ready" ? formatKrwFromSettlementUnits(balance, locale) : "—"}</strong>
          <span data-testid="wallet-test-balance">{walletStatus === "ready" ? `≈ ${formatUsdFromSettlementUnits(balance, locale)}` : copy.balanceEmpty}</span>
        </div>
        <div className={styles.balanceFooter}>
          {walletStatus === "ready" ? <p>{copy.balanceEquivalent}</p> : null}
          {walletStatus === "ready" ? (
            <button type="button" className={styles.balanceAction} aria-label={copy.disconnect} onClick={() => actions.setCommerceWalletStatus("disconnected")}><span className={styles.balanceActionFull}>{copy.disconnect}</span><span className={styles.balanceActionCompact} aria-hidden="true">{copy.disconnectCompact}</span></button>
          ) : (
            <button ref={linkButtonRef} type="button" className={styles.balanceAction} data-testid="wallet-link-open" aria-label={walletStatus === "failed" ? copy.reconnect : copy.connect} onClick={() => setLinkOpen(true)}><WalletCards size={17} aria-hidden="true" /><span className={styles.balanceActionFull}>{walletStatus === "failed" ? copy.reconnect : copy.connect}</span><span className={styles.balanceActionCompact} aria-hidden="true">{walletStatus === "failed" ? copy.reconnectCompact : copy.connectCompact}</span></button>
          )}
        </div>
      </section>

      <div className={styles.dashboardGrid}>
        <section className={styles.benefitCard} data-testid="wallet-benefit">
          <div className={styles.cardHeading}><Gift size={20} aria-hidden="true" /><span>{copy.benefits}</span><small>{commerce.status === "paid" && commerce.voucherApplied ? copy.benefitUsed : copy.benefitState}</small></div>
          <h3>{copy.benefitTitle(formatKrwFromSettlementUnits(STABLE_B_VOUCHER_VALUE, locale))}</h3><p>{copy.benefitBody}</p>
          <button type="button" onClick={() => actions.setTab("ondo")}><MapPin size={16} aria-hidden="true" />{copy.explore}<ChevronRight size={16} aria-hidden="true" /></button>
        </section>

        <section className={styles.methodCard} data-testid="wallet-payment-method" data-funding-source={state.commerceFundingSource}>
          <div className={styles.cardHeading}><CreditCard size={20} aria-hidden="true" /><span>{fundingCopy.selected}</span></div>
          <h3>{fundingSourceLabel(locale, state.commerceFundingSource)}</h3>
          <p>{state.commerceFundingSource === "travel_balance"
            ? walletStatus === "ready" ? fundingCopy.ready : fundingCopy.setup
            : fundingCopy.provider}</p>
          <button ref={fundingButtonRef} type="button" onClick={() => setFundingOpen(true)}>{fundingCopy.change}<ChevronRight size={16} aria-hidden="true" /></button>
        </section>

        <section className={styles.activityCard} data-testid="wallet-activity">
          <div className={styles.cardHeading}><Clock3 size={20} aria-hidden="true" /><span>{copy.activity}</span></div>
          {commerce.status === "paid" || commerce.status === "refunded" ? (
            <details className={styles.activityReceipt} data-testid="wallet-activity-receipt">
              <summary><ReceiptText size={22} aria-hidden="true" /><span><strong>{commerce.status === "refunded" ? `${copy.refundedActivity} ${formatKrwFromSettlementUnits(commerce.chargedDebit, locale)}` : `${copy.paidActivity} ${formatKrwFromSettlementUnits(commerce.chargedDebit, locale)}`}</strong><small>{receiptVenueName ? `${copy.activityVenue} ${receiptVenueName}` : copy.activityReceipt}</small></span><ChevronRight size={17} aria-hidden="true" /></summary>
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
      {fundingSheet}
    </section>
  )
}
