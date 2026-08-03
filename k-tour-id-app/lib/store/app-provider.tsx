"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import type {
  AppNotification,
  BenefitOffer,
  ChainEvent,
  CommerceOrder,
  DemoClaimKey,
  DemoJourney,
  Identity,
  IdentityMethod,
  KPassCapsule,
  Session,
  SettlementReceipt,
  Transaction,
  UserType,
  Voucher,
  OperationResult,
} from "@/lib/types"
import { DEFAULT_DEMO_JOURNEY, DEMO_REQUIRED_CLAIMS, demoClaimValue, voucherMatchesPurchase } from "@/lib/demo-journey"
import {
  benefitService,
  capsuleService,
  chainService,
  identityService,
  policyService,
  settlementService,
  voucherService,
  walletService,
} from "@/lib/services"
import {
  DEFAULT_EVENTS,
  DEFAULT_NOTIFICATIONS,
  DEFAULT_SESSION,
  DEFAULT_TRANSACTIONS,
  DEFAULT_VOUCHERS,
  GUEST_SESSION,
} from "@/lib/mock-data"
import { demoSessionForUserType, itemById, PERSONA_BALANCES, vouchersForUserType } from "@/lib/catalog"
import { timingForOrder } from "@/lib/commerce-policy"

export interface ChatMsg {
  role: "user" | "ai"
  text: string
}

interface AppContextValue {
  session: Session
  transactions: Transaction[]
  events: ChainEvent[]
  notifications: AppNotification[]
  vouchers: Voucher[]
  orders: CommerceOrder[]
  demoJourney: DemoJourney
  hydrated: boolean
  // onboarding
  reset: () => void
  /** load the populated demo identity (Daniel Miller) — presenter "skip the ceremony" path */
  loadDemoAccount: () => void
  loadDemoPersona: (userType: UserType, balanceKRW?: number) => void
  verifyIdentity: (userType: UserType, method: IdentityMethod) => Promise<Identity>
  issueCapsule: (identity: Identity, userType: UserType) => Promise<KPassCapsule>
  // wallet
  topUp: (amountKRW: number) => Promise<void>
  pay: (merchant: string, amountKRW: number, category: Transaction["category"]) => Promise<boolean>
  purchaseServiceItem: (input: { itemId: string; optionId: string; useBenefit: boolean; deliveryAddress?: string }) => Promise<OperationResult<CommerceOrder>>
  refundCommerceOrder: (orderId: string) => Promise<boolean>
  prepareDemoPurchase: (itemId: string, optionId: string) => void
  payWithBenefit: (input: {
    merchant: string
    grossKRW: number
    service: "reservation" | "shopping" | "delivery" | "transport"
    voucherId: string
    presentationId: string
  }) => Promise<OperationResult<SettlementReceipt>>
  beginDemoPresentation: () => void
  recordDemoPresentation: (claims: DemoClaimKey[]) => boolean
  recordDemoPresentationFailure: (result: "expired" | "revoked" | "offline") => void
  submitDemoSettlement: () => void
  anchorDemoSettlement: () => Promise<void>
  refundDemoPurchase: () => Promise<boolean>
  resetDemoJourney: () => void
  /** convert leftover KRW into a newly issued, user-funded voucher. */
  convertLeftover: (amountKRW: number) => Promise<void>
  refundConvertedVoucher: (voucherId: string) => Promise<void>
  // notifications
  dismissNotification: (id: number) => void
  markAllRead: () => void
  // ai
  recommendBenefits: () => Promise<BenefitOffer[]>
  chat: (message: string) => Promise<string>
  // copilot (ambient AI)
  copilotOpen: boolean
  openCopilot: () => void
  closeCopilot: () => void
  copilotThread: ChatMsg[]
  copilotThinking: boolean
  copilotSeed: (greeting: string) => void
  copilotSend: (message: string) => Promise<void>
  copilotPushAi: (text: string) => void
  dismissedNudges: string[]
  dismissNudge: (key: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

const STORAGE_KEY = "k-tour-id-state-v5"

interface PersistShape {
  session: Session
  transactions: Transaction[]
  events: ChainEvent[]
  notifications: AppNotification[]
  vouchers: Voucher[]
  orders: CommerceOrder[]
  demoJourney: DemoJourney
  dismissedNudges: string[]
}

function migratePersistedSession(session: Session): Session {
  if (!session.userType || !session.identity) return session
  const currentPhotoUrl = demoSessionForUserType(session.userType).identity?.photoUrl
  if (!currentPhotoUrl || session.identity.photoUrl === currentPhotoUrl) return session
  return {
    ...session,
    identity: { ...session.identity, photoUrl: currentPhotoUrl },
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Start as a GUEST so a fresh browser sees the K-Pass issuance ceremony (the
  // Track-2 thesis) — never someone else's pre-filled account. Returning users
  // are restored from localStorage in the hydration effect below.
  const [session, setSession] = useState<Session>(GUEST_SESSION)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [events, setEvents] = useState<ChainEvent[]>([])
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [orders, setOrders] = useState<CommerceOrder[]>([])
  const [demoJourney, setDemoJourney] = useState<DemoJourney>(DEFAULT_DEMO_JOURNEY)
  const [dismissedNudges, setDismissedNudges] = useState<string[]>([])
  const [hydrated, setHydrated] = useState(false)

  // copilot UI state (in-memory; survives route changes since provider is at root)
  const [copilotOpen, setCopilotOpen] = useState(false)
  const [copilotThread, setCopilotThread] = useState<ChatMsg[]>([])
  const [copilotThinking, setCopilotThinking] = useState(false)

  const sessionRef = useRef(session)
  sessionRef.current = session
  const demoJourneyRef = useRef(demoJourney)
  demoJourneyRef.current = demoJourney
  const demoPaymentBusyRef = useRef(false)
  const demoRefundBusyRef = useRef(false)
  const commercePaymentBusyRef = useRef(false)
  const commerceRefundBusyRef = useRef(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistShape>
        if (parsed.session) setSession(migratePersistedSession(parsed.session))
        if (parsed.transactions) setTransactions(parsed.transactions)
        if (parsed.events) setEvents(parsed.events)
        if (parsed.notifications) setNotifications(parsed.notifications)
        if (parsed.vouchers) setVouchers(parsed.vouchers)
        else if (parsed.session?.onboarded) setVouchers(DEFAULT_VOUCHERS)
        if (parsed.orders) setOrders(parsed.orders)
        if (parsed.demoJourney) setDemoJourney(parsed.demoJourney)
        if (parsed.dismissedNudges) setDismissedNudges(parsed.dismissedNudges)
      }
    } catch {
      /* ignore corrupt state */
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    // Only persist a real, onboarded session — never a partial/guest shell, so a
    // mid-ceremony refresh or a sign-out can't leave orphaned state on disk.
    if (!hydrated || !session.onboarded) return
    const payload: PersistShape = { session, transactions, events, notifications, vouchers, orders, demoJourney, dismissedNudges }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      /* quota / unavailable */
    }
  }, [hydrated, session, transactions, events, notifications, vouchers, orders, demoJourney, dismissedNudges])

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch { /* unavailable */ }
    setSession(GUEST_SESSION)
    setTransactions([])
    setEvents([])
    setNotifications([])
    setVouchers([])
    setOrders([])
    setDemoJourney(DEFAULT_DEMO_JOURNEY)
    setDismissedNudges([])
    setCopilotThread([])
    setCopilotOpen(false)
  }, [])

  const loadDemoAccount = useCallback(() => {
    setSession(DEFAULT_SESSION)
    setTransactions(DEFAULT_TRANSACTIONS)
    setEvents(DEFAULT_EVENTS)
    setNotifications(DEFAULT_NOTIFICATIONS)
    setVouchers(DEFAULT_VOUCHERS)
    setOrders([])
    setDemoJourney(DEFAULT_DEMO_JOURNEY)
    setDismissedNudges([])
  }, [])

  const loadDemoPersona = useCallback((userType: UserType, balanceKRW?: number) => {
    const seeded = demoSessionForUserType(userType)
    setSession(balanceKRW == null ? seeded : { ...seeded, wallet: { ...seeded.wallet, balanceKRW } })
    setTransactions([])
    setEvents([])
    setNotifications([])
    setVouchers(vouchersForUserType(userType))
    setOrders([])
    setDemoJourney(DEFAULT_DEMO_JOURNEY)
    setDismissedNudges([])
    setCopilotThread([])
    setCopilotOpen(false)
  }, [])

  const verifyIdentity = useCallback(async (userType: UserType, method: IdentityMethod) => {
    // Do NOT write a partial identity to the session here — the confirm screen
    // holds it in local state and issueCapsule writes the full session atomically.
    return identityService.verify(method, userType)
  }, [])

  const issueCapsule = useCallback(async (identity: Identity, userType: UserType) => {
    const renewing = sessionRef.current.onboarded
    if (!renewing) {
      setTransactions([])
      setNotifications([])
      setVouchers([])
      setOrders([])
      setDemoJourney(DEFAULT_DEMO_JOURNEY)
      setDismissedNudges([])
    }
    const capsule = await capsuleService.issue(identity, userType)
    const identityEvent = await chainService.log(
      "IdentityVerified",
      `${identity.method} source verified; raw identity data kept off-chain`,
    )
    const issuedEvent = await chainService.log(
      "KPassIssued",
      `K-Tour service credential issued; holder reference kept off-chain (${userType})`,
    )
    if (renewing) {
      setSession((current) => ({ ...current, onboarded: true, userType, identity, capsule }))
      setEvents((current) => [issuedEvent, identityEvent, ...current])
      setVouchers((current) => {
        const previousStatus = new Map(current.map((voucher) => [voucher.id, voucher.status]))
        return [
          ...current.filter((voucher) => voucher.funding === "user-converted"),
          ...vouchersForUserType(userType).map((voucher) => ({ ...voucher, status: previousStatus.get(voucher.id) ?? voucher.status })),
        ]
      })
    } else {
      const wallet = await walletService.create(capsule.holderName)
      const linkedEvent = await chainService.log("WalletLinked", "Demo KRW travel balance linked to the K-Tour credential holder")
      setSession((current) => ({ ...current, onboarded: true, userType, identity, capsule, wallet: { ...wallet, balanceKRW: PERSONA_BALANCES[userType] } }))
      setEvents([identityEvent, issuedEvent, linkedEvent])
      setVouchers(vouchersForUserType(userType))
    }
    return capsule
  }, [])

  const topUp = useCallback(async (amountKRW: number) => {
    const updated = await walletService.topUp(sessionRef.current.wallet, amountKRW)
    const evt = await chainService.log("WalletFunded", `Top-up of ₩${amountKRW.toLocaleString()} authorised`)
    setSession((s) => ({ ...s, wallet: updated }))
    setTransactions((t) => [
      {
        id: `tx-${evt.id}`,
        merchant: "Top up",
        category: "topup",
        amountKRW,
        date: new Date().toISOString(),
        icon: "topup",
        iconBg: "#f3ece0",
        chainEvent: "WalletFunded",
        txHash: evt.txHash,
      },
      ...t,
    ])
    setEvents((e) => [evt, ...e])
    setNotifications((items) => [{
      id: Date.now(),
      type: "transaction",
      title: "Demo balance topped up",
      message: `₩${amountKRW.toLocaleString()} was added to your demo KRW balance`,
      time: "Just now",
      read: false,
      icon: "topup",
      iconBg: "#e7ede4",
    }, ...items])
  }, [])

  const pay = useCallback(
    async (merchant: string, amountKRW: number, category: Transaction["category"]) => {
      // never confirm a spend the wallet can't fund (no ghost-spend / phantom chain event)
      if (Math.abs(amountKRW) > sessionRef.current.wallet.balanceKRW) return false
      const evt = await chainService.log(
        "PaymentAuthorized",
        `Payment of ₩${amountKRW.toLocaleString()} to ${merchant}`,
      )
      setSession((s) => ({
        ...s,
        wallet: { ...s.wallet, balanceKRW: Math.max(0, s.wallet.balanceKRW - Math.abs(amountKRW)) },
      }))
      setTransactions((t) => [
        {
          id: `tx-${evt.id}`,
          merchant,
          category,
          amountKRW: -Math.abs(amountKRW),
          date: new Date().toISOString(),
          icon: "card",
          iconBg: "#ece6da",
          chainEvent: "PaymentAuthorized",
          txHash: evt.txHash,
        },
        ...t,
      ])
      setEvents((e) => [evt, ...e])
      setNotifications((items) => [{
        id: Date.now(),
        type: "transaction",
        title: "Demo payment complete",
        message: `You paid ₩${Math.abs(amountKRW).toLocaleString()} to ${merchant}`,
        time: "Just now",
        read: false,
        icon: "check",
        iconBg: "#e7ede4",
      }, ...items])
      return true
    },
    [],
  )

  const purchaseServiceItem = useCallback(async (input: {
    itemId: string
    optionId: string
    useBenefit: boolean
    deliveryAddress?: string
  }): Promise<OperationResult<CommerceOrder>> => {
    if (commercePaymentBusyRef.current) {
      return { ok: false, error: { code: "PAYMENT_IN_PROGRESS", message: "This order is already being processed", retryable: true } }
    }
    const item = itemById(input.itemId)
    const option = item?.options.find((candidate) => candidate.id === input.optionId)
    const capsule = sessionRef.current.capsule
    const userType = sessionRef.current.userType
    if (!item || !option || !option.available) {
      return { ok: false, error: { code: "OPTION_UNAVAILABLE", message: "The selected option is no longer available", retryable: true } }
    }
    if (item.fulfilment === "delivery" && !input.deliveryAddress?.trim()) {
      return { ok: false, error: { code: "DELIVERY_ADDRESS_REQUIRED", message: "A delivery address is required", retryable: true } }
    }
    if (!capsule || !userType || !item.eligibleUserTypes.includes(userType)) {
      return { ok: false, error: { code: "NOT_ELIGIBLE", message: "This item is not available for the current K-Tour ID", retryable: false } }
    }
    const voucher = input.useBenefit && item.voucherId
      ? vouchers.find((candidate) => candidate.id === item.voucherId && candidate.status === "available")
      : undefined
    if (input.useBenefit && item.voucherId && !voucher) {
      return { ok: false, error: { code: "VOUCHER_UNAVAILABLE", message: "This benefit has already been used or expired", retryable: false } }
    }
    if (voucher?.eligibleUserTypes && !voucher.eligibleUserTypes.includes(userType)) {
      return { ok: false, error: { code: "NOT_ELIGIBLE", message: "This benefit does not match the current K-Tour ID", retryable: false } }
    }

    commercePaymentBusyRef.current = true
    let voucherReserved = false
    let purchaseCompleted = false
    try {
      const grossKRW = item.priceKRW + (option.priceDeltaKRW ?? 0)
      if (voucher && !voucherMatchesPurchase(voucher, { merchant: item.merchant, service: item.service, grossKRW })) {
        return { ok: false, error: { code: "VOUCHER_NOT_APPLICABLE", message: "This benefit does not match the merchant, service, or minimum spend", retryable: false } }
      }
      const policy = await policyService.evaluate({
        capsule,
        service: item.service,
        amountKRW: grossKRW,
        balanceKRW: sessionRef.current.wallet.balanceKRW,
        voucher,
      })
      if (!policy.ok || !policy.data) {
        return { ok: false, error: policy.error ?? { code: "POLICY_FAILED", message: "The final price could not be confirmed", retryable: true } }
      }

      if (voucher) {
        voucherReserved = true
        setVouchers((items) => items.map((candidate) => candidate.id === voucher.id ? { ...candidate, status: "reserved" } : candidate))
      }

      const paymentEvent = await chainService.log("PaymentAuthorized", `Payment of ₩${policy.data.payableKRW.toLocaleString()} to ${item.merchant}`)
      const redeemed = voucher ? await voucherService.redeem({ ...voucher, status: "reserved" }) : undefined
      if (voucher && (!redeemed?.ok || !redeemed.data)) {
        return { ok: false, error: redeemed?.error ?? { code: "VOUCHER_FAILED", message: "The benefit could not be reserved", retryable: true } }
      }
      const benefitEvent = voucher
        ? await chainService.log("BenefitApplied", `${voucher.id} applied to ${item.id}`)
        : null
      const voucherEvent = voucher
        ? await chainService.log("VoucherRedeemed", `${voucher.id} redeemed for ${item.id}`)
        : null
      const stamp = Date.now()
      const transactionId = `tx-order-${stamp}`
      const timing = timingForOrder(item.id, item.fulfilment, option.id, policy.data.payableKRW)
      const order: CommerceOrder = {
        id: `ORD-${stamp.toString(36).toUpperCase()}`,
        receiptId: `RCT-${(stamp + 17).toString(36).toUpperCase()}`,
        itemId: item.id,
        title: item.title.ko,
        titleEn: item.title.en,
        merchant: item.merchant,
        service: item.service,
        optionId: option.id,
        optionLabel: option.label.ko,
        optionLabelEn: option.label.en,
        grossKRW,
        discountKRW: policy.data.discountKRW,
        paidKRW: policy.data.payableKRW,
        voucherId: voucher?.id,
        status: timing.status,
        fulfilment: item.fulfilment,
        cancellation: item.cancellation.ko,
        cancellationEn: item.cancellation.en,
        fulfilmentLabel: item.fulfilmentLabel.ko,
        fulfilmentLabelEn: item.fulfilmentLabel.en,
        deliveryAddress: item.fulfilment === "delivery" ? input.deliveryAddress?.trim() : undefined,
        activationAt: timing.activationAt,
        cancelDeadline: timing.cancelDeadline,
        refundableKRW: timing.refundableKRW,
        paidAt: new Date().toISOString(),
        transactionId,
      }
      setSession((current) => ({ ...current, wallet: { ...current.wallet, balanceKRW: Math.max(0, current.wallet.balanceKRW - order.paidKRW) } }))
      if (voucher && redeemed?.data) {
        setVouchers((items) => items.map((candidate) => candidate.id === voucher.id ? redeemed.data! : candidate))
      }
      setTransactions((items) => [{
        id: transactionId,
        merchant: item.merchant.replace(" · demo concept", "").replace(" · demo merchant", ""),
        category: item.service,
        amountKRW: -order.paidKRW,
        date: order.paidAt,
        icon: item.service === "transport" ? "transit" : "ticket",
        iconBg: "#e7ede4",
        chainEvent: "PaymentAuthorized",
        txHash: paymentEvent.txHash,
      }, ...items])
      setEvents((items) => [voucherEvent, benefitEvent, paymentEvent, ...items].filter((event): event is ChainEvent => event != null))
      setOrders((items) => [order, ...items])
      setNotifications((items) => [{
        id: stamp,
        type: "transaction",
        title: "Order confirmed",
        message: `${item.title.en} · ₩${order.paidKRW.toLocaleString()} paid`,
        time: "Just now",
        read: false,
        icon: "ticket",
        iconBg: "#e7ede4",
      }, ...items])
      purchaseCompleted = true
      return { ok: true, data: order }
    } finally {
      if (voucher && voucherReserved && !purchaseCompleted) {
        setVouchers((items) => items.map((candidate) => candidate.id === voucher.id && candidate.status === "reserved" ? { ...candidate, status: "available" } : candidate))
      }
      commercePaymentBusyRef.current = false
    }
  }, [vouchers])

  const refundCommerceOrder = useCallback(async (orderId: string) => {
    const order = orders.find((candidate) => candidate.id === orderId)
    if (!order || !["paid", "used"].includes(order.status) || commerceRefundBusyRef.current) return false
    commerceRefundBusyRef.current = true
    try {
    const now = Date.now()
    const activationAt = new Date(order.activationAt).getTime()
    const cancelDeadline = new Date(order.cancelDeadline).getTime()
    const activeInstantPass = order.fulfilment === "instant" && now >= activationAt
    if (order.fulfilment !== "instant" && now > cancelDeadline) return false
    const elapsedDays = activeInstantPass ? Math.max(1, Math.ceil((now - activationAt) / 86_400_000)) : 0
    const refundableKRW = activeInstantPass ? Math.max(0, Math.floor((order.paidKRW * Math.max(0, 30 - elapsedDays)) / 30)) : order.paidKRW
    if (refundableKRW <= 0) return false
    const benefitRestored = !!order.voucherId && !activeInstantPass
    const paymentEvent = await chainService.log("PaymentRefunded", `${order.receiptId} refunded ₩${refundableKRW.toLocaleString()}`)
    const voucherEvent = benefitRestored && order.voucherId
      ? await chainService.log("VoucherRefunded", `${order.voucherId} restored for ${order.receiptId}`)
      : null
    const refundedAt = new Date().toISOString()
    setSession((current) => ({ ...current, wallet: { ...current.wallet, balanceKRW: current.wallet.balanceKRW + refundableKRW } }))
    if (benefitRestored && order.voucherId) {
      setVouchers((items) => items.map((voucher) => voucher.id === order.voucherId ? { ...voucher, status: "available" } : voucher))
    }
    setOrders((items) => items.map((candidate) => candidate.id === order.id ? { ...candidate, status: "refunded", refundedKRW: refundableKRW, refundedAt, settledUsageDays: activeInstantPass ? elapsedDays : undefined } : candidate))
    if (order.transactionId === demoJourneyRef.current.paymentId) {
      setDemoJourney((current) => ({ ...current, stage: "refunded" }))
    }
    setTransactions((items) => [{
      id: `${order.transactionId}-refund`, merchant: order.merchant, category: order.service, amountKRW: refundableKRW,
      date: refundedAt, icon: "refresh", iconBg: "#e7ede4", chainEvent: "PaymentRefunded", txHash: paymentEvent.txHash,
    }, ...items])
    setEvents((items) => [voucherEvent, paymentEvent, ...items].filter((event): event is ChainEvent => event != null))
    setNotifications((items) => [{
      id: Date.now(), type: "transaction", title: "Order refunded", message: `${order.titleEn} · ₩${refundableKRW.toLocaleString()} returned`,
      time: "Just now", read: false, icon: "refresh", iconBg: "#e7ede4",
    }, ...items])
    return true
    } finally {
      commerceRefundBusyRef.current = false
    }
  }, [orders])

  const beginDemoPresentation = useCallback(() => {
    setDemoJourney((current) => ({ ...current, stage: "checking", presentedClaims: [] }))
  }, [])

  const prepareDemoPurchase = useCallback((itemId: string, optionId: string) => {
    const item = itemById(itemId)
    const option = item?.options.find((candidate) => candidate.id === optionId)
    if (!item || !option || item.id !== "bukchon-workshop") return
    const voucher = item.voucherId ? vouchers.find((candidate) => candidate.id === item.voucherId) : undefined
    const grossKRW = item.priceKRW + (option.priceDeltaKRW ?? 0)
    const voucherKRW = voucher?.status === "available" ? Math.min(voucher.valueKRW, grossKRW) : 0
    setDemoJourney((current) => ({
      ...current,
      stage: "request-ready",
      itemId: item.id,
      optionId: option.id,
      optionLabel: option.label.ko,
      optionLabelEn: option.label.en,
      fulfilmentLabel: item.fulfilmentLabel.ko,
      fulfilmentLabelEn: item.fulfilmentLabel.en,
      merchant: item.merchant,
      merchantDisplay: item.merchant.replace(" · demo merchant", ""),
      product: item.title.en,
      grossKRW,
      voucherKRW,
      paidKRW: grossKRW - voucherKRW,
      presentedClaims: [],
    }))
  }, [vouchers])

  const recordDemoPresentation = useCallback((claims: DemoClaimKey[]) => {
    const voucher = vouchers.find((item) => item.id === demoJourneyRef.current.voucherId)
    const allRequired = DEMO_REQUIRED_CLAIMS.every((claim) => claims.includes(claim))
    const allPassed = claims.every((claim) => demoClaimValue(claim, sessionRef.current.userType, voucher, sessionRef.current.capsule))
    const passed = allRequired && allPassed
    setDemoJourney((current) => ({
      ...current,
      stage: passed ? "benefit-ready" : "presentation-created",
      presentedClaims: claims,
    }))
    return passed
  }, [vouchers])

  const recordDemoPresentationFailure = useCallback((result: "expired" | "revoked" | "offline") => {
    const stage = result === "expired"
      ? "presentation-expired"
      : result === "revoked"
        ? "presentation-revoked"
        : "presentation-offline"
    setDemoJourney((current) => ({ ...current, stage, presentedClaims: [] }))
  }, [])

  const payWithBenefit = useCallback(async (input: {
    merchant: string
    grossKRW: number
    service: "reservation" | "shopping" | "delivery" | "transport"
    voucherId: string
    presentationId: string
  }): Promise<OperationResult<SettlementReceipt>> => {
    const capsule = sessionRef.current.capsule
    const voucher = vouchers.find((item) => item.id === input.voucherId)
    const journey = demoJourneyRef.current
    if (!capsule || !voucher) {
      return { ok: false, error: { code: "MISSING_CREDENTIAL_OR_VOUCHER", message: "Credential or voucher is missing", retryable: false } }
    }
    if (journey.stage !== "benefit-ready" || input.presentationId !== journey.presentationId) {
      return { ok: false, error: { code: "PRESENTATION_REQUIRED", message: "Create the matching one-time presentation before using this benefit", retryable: false } }
    }
    if (!DEMO_REQUIRED_CLAIMS.every((claim) => journey.presentedClaims.includes(claim))) {
      return { ok: false, error: { code: "CLAIMS_INCOMPLETE", message: "The merchant's required proof is incomplete", retryable: false } }
    }
    if (!voucherMatchesPurchase(voucher, input)) {
      return { ok: false, error: { code: "VOUCHER_NOT_APPLICABLE", message: "This voucher does not match the merchant, service, or minimum spend", retryable: false } }
    }
    if (demoPaymentBusyRef.current) {
      return { ok: false, error: { code: "PAYMENT_IN_PROGRESS", message: "This payment is already being processed", retryable: true } }
    }
    demoPaymentBusyRef.current = true

    try {
    const policy = await policyService.evaluate({
      capsule,
      service: input.service,
      amountKRW: input.grossKRW,
      balanceKRW: sessionRef.current.wallet.balanceKRW,
      voucher,
    })
    if (!policy.ok || !policy.data) {
      return { ok: false, error: policy.error ?? { code: "POLICY_FAILED", message: "Policy evaluation failed", retryable: false } }
    }

    const redeemed = await voucherService.redeem(voucher)
    if (!redeemed.ok || !redeemed.data) {
      return { ok: false, error: redeemed.error ?? { code: "VOUCHER_FAILED", message: "Voucher redemption failed", retryable: false } }
    }

    const [presentationEvent, verificationEvent, benefitEvent, paymentEvent, voucherEvent] = await Promise.all([
      chainService.log("PresentationCreated", `${input.presentationId} created with selected claims`),
      chainService.log("PresentationVerified", `${input.presentationId} verified against issuer and status policy`),
      chainService.log("BenefitApplied", `${voucher.id} applied for ${input.merchant}`),
      chainService.log("PaymentAuthorized", `Payment of ₩${policy.data.payableKRW.toLocaleString()} to ${input.merchant}`),
      chainService.log("VoucherRedeemed", `${voucher.id} redeemed once`),
    ])
    const settlement = await settlementService.create({
      merchant: input.merchant,
      grossKRW: input.grossKRW,
      voucherKRW: policy.data.discountKRW,
      paidKRW: policy.data.payableKRW,
      presentationId: input.presentationId,
    })
    if (!settlement.ok || !settlement.data) return settlement
    const receipt = {
      ...settlement.data,
      id: journey.settlementId,
      status: "pending" as const,
      eventIds: [presentationEvent.id, verificationEvent.id, benefitEvent.id, paymentEvent.id, voucherEvent.id],
    }

    setSession((current) => ({
      ...current,
      wallet: { ...current.wallet, balanceKRW: Math.max(0, current.wallet.balanceKRW - policy.data!.payableKRW) },
    }))
    setVouchers((items) => items.map((item) => (item.id === voucher.id ? redeemed.data! : item)))
    setTransactions((items) => [
      {
        id: journey.paymentId,
        merchant: input.merchant,
        category: input.service,
        amountKRW: -policy.data!.payableKRW,
        date: new Date().toISOString(),
        icon: "ticket",
        iconBg: "#e7ede4",
        chainEvent: "PaymentAuthorized",
        txHash: paymentEvent.txHash,
      },
      ...items,
    ])
    const catalogItem = itemById(journey.itemId)
    const catalogOption = catalogItem?.options.find((option) => option.id === journey.optionId)
    if (catalogItem && catalogOption) {
      const timing = timingForOrder(catalogItem.id, catalogItem.fulfilment, catalogOption.id, policy.data.payableKRW)
      const order: CommerceOrder = {
        id: `ORD-${journey.paymentId}`,
        receiptId: journey.receiptId,
        itemId: catalogItem.id,
        title: catalogItem.title.ko,
        titleEn: catalogItem.title.en,
        merchant: catalogItem.merchant,
        service: catalogItem.service,
        optionId: catalogOption.id,
        optionLabel: catalogOption.label.ko,
        optionLabelEn: catalogOption.label.en,
        grossKRW: input.grossKRW,
        discountKRW: policy.data.discountKRW,
        paidKRW: policy.data.payableKRW,
        voucherId: voucher.id,
        status: timing.status,
        fulfilment: catalogItem.fulfilment,
        cancellation: catalogItem.cancellation.ko,
        cancellationEn: catalogItem.cancellation.en,
        fulfilmentLabel: catalogItem.fulfilmentLabel.ko,
        fulfilmentLabelEn: catalogItem.fulfilmentLabel.en,
        activationAt: timing.activationAt,
        cancelDeadline: timing.cancelDeadline,
        refundableKRW: timing.refundableKRW,
        paidAt: new Date().toISOString(),
        transactionId: journey.paymentId,
      }
      setOrders((items) => items.some((candidate) => candidate.id === order.id) ? items : [order, ...items])
    }
    setEvents((items) => [voucherEvent, paymentEvent, benefitEvent, verificationEvent, presentationEvent, ...items])
    setDemoJourney((current) => ({
      ...current,
      stage: "paid",
      grossKRW: input.grossKRW,
      voucherKRW: policy.data!.discountKRW,
      paidKRW: policy.data!.payableKRW,
      presentedClaims: current.presentedClaims,
    }))
    setNotifications((items) => [{
      id: Date.now(),
      type: "transaction",
      title: "Bukchon workshop paid",
      message: `₩${policy.data!.discountKRW.toLocaleString()} benefit applied · ₩${policy.data!.payableKRW.toLocaleString()} paid`,
      time: "Just now",
      read: false,
      icon: "ticket",
      iconBg: "#e7ede4",
    }, ...items])
    return { ok: true, data: receipt }
    } finally {
      demoPaymentBusyRef.current = false
    }
  }, [vouchers])

  const submitDemoSettlement = useCallback(() => {
    setDemoJourney((current) => current.stage === "paid" ? { ...current, stage: "settlement-submitted" } : current)
  }, [])

  const anchorDemoSettlement = useCallback(async () => {
    if (demoJourneyRef.current.stage !== "settlement-submitted") return
    const journey = demoJourneyRef.current
    const event = await chainService.log(
      "PartnerSettlementLogged",
      `${journey.settlementId} anchored for ${journey.merchant}; customer identity excluded`,
    )
    setEvents((items) => [event, ...items])
    setDemoJourney((current) => ({ ...current, stage: "anchored", anchorHash: event.txHash }))
  }, [])

  const refundDemoPurchase = useCallback(async () => {
    const journey = demoJourneyRef.current
    const canonicalOrder = orders.find((item) => item.transactionId === journey.paymentId)
    if (canonicalOrder && Date.now() > new Date(canonicalOrder.cancelDeadline).getTime()) return false
    if (!["paid", "settlement-submitted", "anchored"].includes(journey.stage) || demoRefundBusyRef.current) return false
    demoRefundBusyRef.current = true
    try {
      const [paymentEvent, voucherEvent] = await Promise.all([
        chainService.log("PaymentRefunded", `${journey.receiptId} payment refunded`),
        chainService.log("VoucherRefunded", `${journey.receiptId} campaign benefit restored`),
      ])
      const refundedAt = new Date().toISOString()
      setSession((current) => ({ ...current, wallet: { ...current.wallet, balanceKRW: current.wallet.balanceKRW + journey.paidKRW } }))
      setVouchers((items) => items.map((item) => item.id === journey.voucherId ? { ...item, status: "available" } : item))
      setTransactions((items) => [{
        id: `${journey.paymentId}-refund`,
        merchant: journey.merchant,
        category: "reservation",
        amountKRW: journey.paidKRW,
        date: refundedAt,
        icon: "refresh",
        iconBg: "#e7ede4",
        chainEvent: "PaymentRefunded",
        txHash: paymentEvent.txHash,
      }, ...items])
      setEvents((items) => [voucherEvent, paymentEvent, ...items])
      setOrders((items) => items.map((item) => item.transactionId === journey.paymentId ? { ...item, status: "refunded", refundedKRW: journey.paidKRW, refundedAt } : item))
      setNotifications((items) => [{
        id: Date.now(), type: "transaction", title: "Workshop refund complete", message: `₩${journey.paidKRW.toLocaleString()} returned and the ₩${journey.voucherKRW.toLocaleString()} benefit restored`, time: "Just now", read: false, icon: "refresh", iconBg: "#e7ede4",
      }, ...items])
      setDemoJourney((current) => ({ ...current, stage: "refunded" }))
      return true
    } finally {
      demoRefundBusyRef.current = false
    }
  }, [orders])

  const resetDemoJourney = useCallback(() => {
    const journey = demoJourneyRef.current
    const hadPayment = transactions.some((item) => item.id === journey.paymentId)
    const hadRefund = transactions.some((item) => item.id === `${journey.paymentId}-refund`)
    if (hadPayment && !hadRefund) {
      setSession((current) => ({
        ...current,
        wallet: { ...current.wallet, balanceKRW: current.wallet.balanceKRW + journey.paidKRW },
      }))
    }
    setTransactions((items) => items.filter((item) => item.id !== journey.paymentId && item.id !== `${journey.paymentId}-refund`))
    const eventMarkers = [journey.presentationId, journey.voucherId, journey.settlementId, journey.receiptId, journey.merchant]
    setEvents((items) => items.filter((item) => !eventMarkers.some((marker) => item.summary.includes(marker))))
    setVouchers((items) => items.map((item) => item.id === DEFAULT_DEMO_JOURNEY.voucherId ? { ...item, status: "available" } : item))
    setNotifications((items) => items.filter((item) => !item.message.includes("Bukchon") && !item.title.includes("Bukchon")))
    setOrders((items) => items.filter((item) => item.transactionId !== journey.paymentId))
    setDemoJourney(DEFAULT_DEMO_JOURNEY)
  }, [transactions])

  // Convert leftover KRW → a voucher. This issues a voucher; redemption happens later.
  const convertLeftover = useCallback(async (amountKRW: number) => {
    if (Math.abs(amountKRW) > sessionRef.current.wallet.balanceKRW) return
    const converted = await voucherService.convertLeftover(amountKRW)
    if (!converted.ok || !converted.data) return
    const evt = await chainService.log(
      "VoucherIssued",
      `Converted ₩${amountKRW.toLocaleString()} demo balance to a user-funded return-trip voucher`,
    )
    setSession((s) => ({
      ...s,
      wallet: { ...s.wallet, balanceKRW: Math.max(0, s.wallet.balanceKRW - Math.abs(amountKRW)) },
    }))
    setTransactions((t) => [
      {
        id: `tx-${evt.id}`,
        merchant: "Demo balance → return-trip voucher",
        category: "benefit",
        amountKRW: -Math.abs(amountKRW),
        date: new Date().toISOString(),
        icon: "ticket",
        iconBg: "#e7ede4",
        chainEvent: "VoucherIssued",
        txHash: evt.txHash,
      },
      ...t,
    ])
    setVouchers((items) => [converted.data!, ...items])
    setEvents((e) => [evt, ...e])
    setNotifications((items) => [{
      id: Date.now(),
      type: "transaction",
      title: "Return-trip voucher created",
      message: `₩${amountKRW.toLocaleString()} moved from demo balance into a user-funded voucher`,
      time: "Just now",
      read: false,
      icon: "ticket",
      iconBg: "#e7ede4",
    }, ...items])
  }, [])

  const refundConvertedVoucher = useCallback(async (voucherId: string) => {
    const voucher = vouchers.find((item) => item.id === voucherId)
    if (!voucher || voucher.funding !== "user-converted" || voucher.status !== "available") return
    const event = await chainService.log("VoucherRefunded", `${voucher.id} returned to the holder's demo KRW balance`)
    setSession((current) => ({ ...current, wallet: { ...current.wallet, balanceKRW: current.wallet.balanceKRW + voucher.valueKRW } }))
    setVouchers((items) => items.filter((item) => item.id !== voucher.id))
    setTransactions((items) => [{
      id: `tx-${event.id}`,
      merchant: "Return-trip voucher refund",
      category: "benefit",
      amountKRW: voucher.valueKRW,
      date: new Date().toISOString(),
      icon: "ticket",
      iconBg: "#e7ede4",
      chainEvent: "VoucherRefunded",
      txHash: event.txHash,
    }, ...items])
    setEvents((items) => [event, ...items])
    setNotifications((items) => [{
      id: Date.now(), type: "transaction", title: "Voucher returned", message: `₩${voucher.valueKRW.toLocaleString()} restored to your demo balance`, time: "Just now", read: false, icon: "refresh", iconBg: "#e7ede4",
    }, ...items])
  }, [vouchers])

  const dismissNotification = useCallback((id: number) => {
    setNotifications((n) => n.filter((x) => x.id !== id))
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications((n) => n.map((x) => ({ ...x, read: true })))
  }, [])

  const recommendBenefits = useCallback(
    () => benefitService.recommend({ balanceKRW: sessionRef.current.wallet.balanceKRW, userType: sessionRef.current.userType }),
    [],
  )

  const chat = useCallback((message: string) => benefitService.chat(message), [])

  // ── copilot ───────────────────────────────────────────────────────────────
  const openCopilot = useCallback(() => setCopilotOpen(true), [])
  const closeCopilot = useCallback(() => setCopilotOpen(false), [])
  const copilotSeed = useCallback((greeting: string) => {
    setCopilotThread((t) => (t.length ? t : [{ role: "ai", text: greeting }]))
  }, [])
  const copilotSend = useCallback(async (message: string) => {
    const q = message.trim()
    if (!q) return
    setCopilotThread((t) => [...t, { role: "user", text: q }])
    setCopilotThinking(true)
    try {
      const reply = await benefitService.chat(q)
      setCopilotThread((t) => [...t, { role: "ai", text: reply }])
    } catch {
      setCopilotThread((t) => [...t, { role: "ai", text: "요청을 완료하지 못했어요. 네트워크를 확인하고 다시 시도해 주세요. / I couldn't complete that request. Please try again." }])
    } finally {
      setCopilotThinking(false)
    }
  }, [])
  const copilotPushAi = useCallback((text: string) => {
    setCopilotThread((t) => [...t, { role: "ai", text }])
    setCopilotOpen(true)
  }, [])
  const dismissNudge = useCallback((key: string) => {
    setDismissedNudges((d) => (d.includes(key) ? d : [...d, key]))
  }, [])

  const value = useMemo<AppContextValue>(
    () => ({
      session,
      transactions,
      events,
      notifications,
      vouchers,
      orders,
      demoJourney,
      hydrated,
      reset,
      loadDemoAccount,
      loadDemoPersona,
      verifyIdentity,
      issueCapsule,
      topUp,
      pay,
      purchaseServiceItem,
      refundCommerceOrder,
      prepareDemoPurchase,
      payWithBenefit,
      beginDemoPresentation,
      recordDemoPresentation,
      recordDemoPresentationFailure,
      submitDemoSettlement,
      anchorDemoSettlement,
      refundDemoPurchase,
      resetDemoJourney,
      convertLeftover,
      refundConvertedVoucher,
      dismissNotification,
      markAllRead,
      recommendBenefits,
      chat,
      copilotOpen,
      openCopilot,
      closeCopilot,
      copilotThread,
      copilotThinking,
      copilotSeed,
      copilotSend,
      copilotPushAi,
      dismissedNudges,
      dismissNudge,
    }),
    [
      session, transactions, events, notifications, vouchers, orders, demoJourney, hydrated, reset, loadDemoAccount, loadDemoPersona, verifyIdentity, issueCapsule,
      topUp, pay, purchaseServiceItem, refundCommerceOrder, prepareDemoPurchase, payWithBenefit, beginDemoPresentation, recordDemoPresentation, recordDemoPresentationFailure, submitDemoSettlement, anchorDemoSettlement, refundDemoPurchase, resetDemoJourney,
      convertLeftover, refundConvertedVoucher, dismissNotification, markAllRead, recommendBenefits, chat,
      copilotOpen, openCopilot, closeCopilot, copilotThread, copilotThinking, copilotSeed, copilotSend,
      copilotPushAi, dismissedNudges, dismissNudge,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within <AppProvider>")
  return ctx
}
