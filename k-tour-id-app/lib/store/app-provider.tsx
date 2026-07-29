"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import type {
  AppNotification,
  BenefitOffer,
  ChainEvent,
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
  hydrated: boolean
  // onboarding
  reset: () => void
  /** load the populated demo identity (Peter Parker) — presenter "skip the ceremony" path */
  loadDemoAccount: () => void
  verifyIdentity: (userType: UserType, method: IdentityMethod) => Promise<Identity>
  issueCapsule: (identity: Identity, userType: UserType) => Promise<KPassCapsule>
  // wallet
  topUp: (amountKRW: number) => Promise<void>
  pay: (merchant: string, amountKRW: number, category: Transaction["category"]) => Promise<void>
  payWithBenefit: (input: {
    merchant: string
    grossKRW: number
    service: "reservation" | "shopping" | "delivery" | "transport"
    voucherId: string
    presentationId: string
  }) => Promise<OperationResult<SettlementReceipt>>
  /** convert leftover KRW into a newly issued, user-funded voucher. */
  convertLeftover: (amountKRW: number) => Promise<void>
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

const STORAGE_KEY = "k-tour-id-state-v2"

interface PersistShape {
  session: Session
  transactions: Transaction[]
  events: ChainEvent[]
  notifications: AppNotification[]
  vouchers: Voucher[]
  dismissedNudges: string[]
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
  const [dismissedNudges, setDismissedNudges] = useState<string[]>([])
  const [hydrated, setHydrated] = useState(false)

  // copilot UI state (in-memory; survives route changes since provider is at root)
  const [copilotOpen, setCopilotOpen] = useState(false)
  const [copilotThread, setCopilotThread] = useState<ChatMsg[]>([])
  const [copilotThinking, setCopilotThinking] = useState(false)

  const sessionRef = useRef(session)
  sessionRef.current = session

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistShape>
        if (parsed.session) setSession(parsed.session)
        if (parsed.transactions) setTransactions(parsed.transactions)
        if (parsed.events) setEvents(parsed.events)
        if (parsed.notifications) setNotifications(parsed.notifications)
        if (parsed.vouchers) setVouchers(parsed.vouchers)
        else if (parsed.session?.onboarded) setVouchers(DEFAULT_VOUCHERS)
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
    const payload: PersistShape = { session, transactions, events, notifications, vouchers, dismissedNudges }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      /* quota / unavailable */
    }
  }, [hydrated, session, transactions, events, notifications, vouchers, dismissedNudges])

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch { /* unavailable */ }
    setSession(GUEST_SESSION)
    setTransactions([])
    setEvents([])
    setNotifications([])
    setVouchers([])
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
    setDismissedNudges([])
  }, [])

  const verifyIdentity = useCallback(async (userType: UserType, method: IdentityMethod) => {
    // Do NOT write a partial identity to the session here — the confirm screen
    // holds it in local state and issueCapsule writes the full session atomically.
    return identityService.verify(method, userType)
  }, [])

  const issueCapsule = useCallback(async (identity: Identity, userType: UserType) => {
    // Fresh slate so a re-onboard never mixes identities in the wallet / chain log.
    setTransactions([])
    setNotifications([])
    setVouchers([])
    setDismissedNudges([])
    const capsule = await capsuleService.issue(identity, userType)
    const identityEvent = await chainService.log(
      "IdentityVerified",
      `${identity.method} source verified; raw identity data kept off-chain`,
    )
    const issuedEvent = await chainService.log(
      "KPassIssued",
      `K-Tour service credential issued for ${capsule.holderName} (${userType})`,
    )
    const wallet = await walletService.create(capsule.holderName)
    const linkedEvent = await chainService.log("WalletLinked", "KRW payment wallet linked to K-Tour credential holder")

    setSession((s) => ({ ...s, onboarded: true, userType, identity, capsule, wallet }))
    setEvents([identityEvent, issuedEvent, linkedEvent])
    setVouchers(DEFAULT_VOUCHERS)
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
  }, [])

  const pay = useCallback(
    async (merchant: string, amountKRW: number, category: Transaction["category"]) => {
      // never confirm a spend the wallet can't fund (no ghost-spend / phantom chain event)
      if (Math.abs(amountKRW) > sessionRef.current.wallet.balanceKRW) return
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
    },
    [],
  )

  const payWithBenefit = useCallback(async (input: {
    merchant: string
    grossKRW: number
    service: "reservation" | "shopping" | "delivery" | "transport"
    voucherId: string
    presentationId: string
  }): Promise<OperationResult<SettlementReceipt>> => {
    const capsule = sessionRef.current.capsule
    const voucher = vouchers.find((item) => item.id === input.voucherId)
    if (!capsule || !voucher) {
      return { ok: false, error: { code: "MISSING_CREDENTIAL_OR_VOUCHER", message: "Credential or voucher is missing", retryable: false } }
    }

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
    const settlementEvent = await chainService.log(
      "PartnerSettlementLogged",
      `${settlement.data.id} anchored for ${input.merchant}`,
    )
    const receipt = {
      ...settlement.data,
      eventIds: [presentationEvent.id, verificationEvent.id, benefitEvent.id, paymentEvent.id, voucherEvent.id, settlementEvent.id],
    }

    setSession((current) => ({
      ...current,
      wallet: { ...current.wallet, balanceKRW: Math.max(0, current.wallet.balanceKRW - policy.data!.payableKRW) },
    }))
    setVouchers((items) => items.map((item) => (item.id === voucher.id ? redeemed.data! : item)))
    setTransactions((items) => [
      {
        id: `tx-${paymentEvent.id}`,
        merchant: input.merchant,
        category: input.service,
        amountKRW: -policy.data!.payableKRW,
        date: new Date().toISOString(),
        icon: "ticket",
        iconBg: "#e7ede4",
        chainEvent: "PartnerSettlementLogged",
        txHash: settlementEvent.txHash,
      },
      ...items,
    ])
    setEvents((items) => [settlementEvent, voucherEvent, paymentEvent, benefitEvent, verificationEvent, presentationEvent, ...items])
    return { ok: true, data: receipt }
  }, [vouchers])

  // Convert leftover KRW → a voucher. This issues a voucher; redemption happens later.
  const convertLeftover = useCallback(async (amountKRW: number) => {
    if (Math.abs(amountKRW) > sessionRef.current.wallet.balanceKRW) return
    const converted = await voucherService.convertLeftover(amountKRW)
    if (!converted.ok || !converted.data) return
    const evt = await chainService.log(
      "VoucherIssued",
      `Converted ₩${amountKRW.toLocaleString()} leftover to T-money + coupons`,
    )
    setSession((s) => ({
      ...s,
      wallet: { ...s.wallet, balanceKRW: Math.max(0, s.wallet.balanceKRW - Math.abs(amountKRW)) },
    }))
    setTransactions((t) => [
      {
        id: `tx-${evt.id}`,
        merchant: "Leftover → T-money + coupons",
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
  }, [])

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
      hydrated,
      reset,
      loadDemoAccount,
      verifyIdentity,
      issueCapsule,
      topUp,
      pay,
      payWithBenefit,
      convertLeftover,
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
      session, transactions, events, notifications, vouchers, hydrated, reset, loadDemoAccount, verifyIdentity, issueCapsule,
      topUp, pay, payWithBenefit, convertLeftover, dismissNotification, markAllRead, recommendBenefits, chat,
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
