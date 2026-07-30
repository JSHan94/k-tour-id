// Mock implementations of the service contracts (DEMO_MODE).
// `fakeHash` is counter-salted, so it is unique per call (NOT a pure function of
// its seed). That's fine: it only runs inside async client event handlers, never
// during SSR/render, so there is no hydration concern.

import type {
  BenefitOffer,
  ChainEvent,
  ChainEventType,
  Identity,
  IdentityMethod,
  KPassCapsule,
  OperationResult,
  PresentationReceipt,
  PresentationRequest,
  ServiceKey,
  SettlementReceipt,
  UserType,
  Voucher,
  Wallet,
} from "@/lib/types"
import type {
  BenefitService,
  CapsuleService,
  ChainService,
  IdentityService,
  PolicyService,
  PresentationService,
  SettlementService,
  VerifierService,
  VoucherService,
  WalletService,
} from "./interfaces"
import { BENEFIT_OFFERS } from "@/lib/mock-data"

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

let seedCounter = 1
export function fakeHash(seed: string): string {
  let h = 2166136261 >>> 0
  const s = `${seed}:${seedCounter++}`
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  let out = ""
  let x = h || 1
  while (out.length < 64) {
    x = (Math.imul(x, 1103515245) + 12345) >>> 0
    out += x.toString(16).padStart(8, "0")
  }
  return "0x" + out.slice(0, 64)
}

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
function base58(hex: string): string {
  let num = BigInt("0x" + hex)
  let out = ""
  while (num > 0n) {
    out = B58[Number(num % 58n)] + out
    num /= 58n
  }
  return out
}
// Reads like a real Open DID (z-multibase base58), distinct from the kpass id
// (which is derived from a different hash slice — no shared bytes).
function fakeDid(seed: string): string {
  return `did:omn:z6Mk${base58(fakeHash("didkey:" + seed).slice(2)).slice(0, 40)}`
}

const NATIONALITY: Record<UserType, { label: string; flag: string }> = {
  korean: { label: "Republic of Korea", flag: "🇰🇷" },
  foreigner: { label: "United States", flag: "🇺🇸" },
  "long-term": { label: "Viet Nam", flag: "🇻🇳" },
}

export const mockIdentityService: IdentityService = {
  async verify(method: IdentityMethod, userType: UserType): Promise<Identity> {
    await delay(1400)
    const nat = NATIONALITY[userType]
    const displayName =
      userType === "korean" ? "김민준" : userType === "long-term" ? "Nguyen Van A" : "Peter Parker"
    return {
      method,
      displayName,
      nationality: nat.label,
      nationalityFlag: nat.flag,
      photoUrl:
        userType === "korean"
          ? "/portraits/minjun.jpg"
          : userType === "long-term"
            ? "/portraits/nguyen.jpg"
            : "/portraits/peter.jpg",
      verified: true,
      did: fakeDid(`${method}:${displayName}`),
    }
  },
}

const SERVICES_BY_TYPE: Record<UserType, ServiceKey[]> = {
  korean: ["transport", "shopping", "delivery", "reservation", "benefit"],
  foreigner: ["transport", "shopping", "delivery", "reservation", "benefit"],
  "long-term": ["transport", "shopping", "delivery", "benefit"],
}

export const mockCapsuleService: CapsuleService = {
  async issue(identity: Identity, userType: UserType): Promise<KPassCapsule> {
    await delay(1600)
    const now = new Date()
    const expires = new Date(now)
    expires.setDate(expires.getDate() + 90)
    return {
      id: `kpass:${fakeHash(identity.did).slice(2, 14)}`,
      holderName: identity.displayName,
      userType,
      did: identity.did,
      issuedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      stayPeriod: userType === "korean" ? "Domestic traveler" : "Service trip window · 90 days",
      paymentLimitKRW: userType === "long-term" ? 2_000_000 : 5_000_000,
      trustLevel: userType === "korean" ? "premium" : "verified",
      status: "active",
      issuer: "K-Tour ID",
      credentialType: "KTourVisitorCredential",
      services: SERVICES_BY_TYPE[userType],
      benefits:
        userType === "korean"
          ? ["Local resident discounts", "Cultural coupon pack"]
          : ["Visitor workshop benefit", "Transit voucher concept", "Welcome coupon pack"],
    }
  },
}

export const mockVerifierService: VerifierService = {
  async createRequest(): Promise<PresentationRequest> {
    await delay(300)
    return {
      id: `pr:${fakeHash("museum-request").slice(2, 14)}`,
      verifierDid: "did:omn:merchant:national-museum-demo",
      verifierName: "National Museum of Korea · demo merchant",
      purpose: "Apply the foreign visitor admission benefit",
      retention: "none",
      nonce: fakeHash("nonce").slice(2, 26),
      expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
      claims: [
        { key: "visitorEligibility", label: "Foreign visitor eligibility", value: true, required: true, selected: true, privacy: "predicate" },
        { key: "tripActive", label: "K-Tour trip credential is active", value: true, required: true, selected: true, privacy: "predicate" },
        { key: "couponUnused", label: "Benefit has not been used", value: true, required: true, selected: true, privacy: "predicate" },
        { key: "nationality", label: "Nationality", value: "United States", required: false, selected: false, privacy: "disclosed" },
      ],
    }
  },
  async verify(receipt: PresentationReceipt): Promise<OperationResult<PresentationReceipt>> {
    await delay(650)
    if (receipt.status === "expired" || receipt.status === "rejected") {
      return { ok: false, error: { code: "VP_INVALID", message: "Presentation is expired or rejected", retryable: true } }
    }
    return { ok: true, data: { ...receipt, status: "verified" } }
  },
}

export const mockPresentationService: PresentationService = {
  async create(request, capsule): Promise<OperationResult<PresentationReceipt>> {
    await delay(700)
    if (capsule.status !== "active" && capsule.status !== "expiring") {
      return { ok: false, error: { code: "CREDENTIAL_INACTIVE", message: `Credential is ${capsule.status}`, retryable: false } }
    }
    if (new Date(request.expiresAt).getTime() <= Date.now()) {
      return { ok: false, error: { code: "REQUEST_EXPIRED", message: "The merchant request expired", retryable: true } }
    }
    return {
      ok: true,
      data: {
        id: `vp:${fakeHash(request.nonce).slice(2, 14)}`,
        requestId: request.id,
        status: "submitted",
        createdAt: new Date().toISOString(),
        disclosedClaims: request.claims.filter((claim) => claim.selected).map((claim) => claim.key),
        vpHash: fakeHash(`vp:${request.id}:${capsule.id}`),
        integrationMode: "simulated",
      },
    }
  },
}

export const mockPolicyService: PolicyService = {
  async evaluate({ capsule, service, amountKRW, balanceKRW, voucher }) {
    await delay(250)
    if (!["active", "expiring"].includes(capsule.status)) {
      return { ok: false, error: { code: "CREDENTIAL_INACTIVE", message: "K-Tour ID is not active", retryable: false } }
    }
    if (new Date(capsule.expiresAt).getTime() <= Date.now()) {
      return { ok: false, error: { code: "CREDENTIAL_EXPIRED", message: "K-Tour ID has expired", retryable: false } }
    }
    if (!capsule.services.includes(service)) {
      return { ok: false, error: { code: "SERVICE_NOT_ALLOWED", message: "This service is outside the credential policy", retryable: false } }
    }
    if (amountKRW > capsule.paymentLimitKRW) {
      return { ok: false, error: { code: "PAYMENT_LIMIT", message: "Payment exceeds the available limit", retryable: false } }
    }
    const discountKRW = voucher?.status === "available" ? Math.min(voucher.valueKRW, amountKRW) : 0
    if (amountKRW - discountKRW > balanceKRW) {
      return { ok: false, error: { code: "INSUFFICIENT_BALANCE", message: "The payable amount exceeds the demo KRW balance", retryable: false } }
    }
    return { ok: true, data: { payableKRW: amountKRW - discountKRW, discountKRW } }
  },
}

export const mockVoucherService: VoucherService = {
  async redeem(voucher) {
    await delay(350)
    if (voucher.status !== "available") {
      return { ok: false, error: { code: "VOUCHER_UNAVAILABLE", message: "Voucher has already been used or expired", retryable: false } }
    }
    return { ok: true, data: { ...voucher, status: "redeemed" } }
  },
  async convertLeftover(amountKRW) {
    await delay(450)
    if (amountKRW <= 0) {
      return { ok: false, error: { code: "INVALID_AMOUNT", message: "Amount must be positive", retryable: false } }
    }
    return {
      ok: true,
      data: {
        id: `voucher:converted:${fakeHash(String(amountKRW)).slice(2, 10)}`,
        title: "Return-trip partner voucher",
        partner: "K-Tour ID demo network",
        valueKRW: amountKRW,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString(),
        status: "available",
        eligibilityClaim: "tripActive",
        funding: "user-converted",
        redemption: "stored-value",
      },
    }
  },
}

export const mockSettlementService: SettlementService = {
  async create(input): Promise<OperationResult<SettlementReceipt>> {
    await delay(500)
    return {
      ok: true,
      data: {
        ...input,
        id: `settlement:${fakeHash(input.presentationId).slice(2, 12)}`,
        status: "anchored",
        eventIds: [],
        integrationMode: "simulated",
      },
    }
  },
}

const EXPLORER_BASE = "/evidence"

export const mockChainService: ChainService = {
  async log(type: ChainEventType, summary: string): Promise<ChainEvent> {
    await delay(600)
    return {
      id: `evt:${fakeHash(type + summary).slice(2, 12)}`,
      type,
      txHash: fakeHash(type + summary),
      timestamp: new Date().toISOString(),
      summary,
      integrationMode: "simulated",
      evidence: {
        network: "OmniOne Chain adapter · simulated",
        payloadHash: fakeHash(`payload:${type}:${summary}`),
      },
    }
  },
  explorerUrl(txHash: string): string {
    return `${EXPLORER_BASE}?tx=${encodeURIComponent(txHash)}`
  },
}

export const mockWalletService: WalletService = {
  async create(holderName: string): Promise<Wallet> {
    await delay(600)
    return {
      address: fakeHash(`wallet:${holderName}`).slice(0, 42),
      balanceKRW: 1_520_768,
      usdRate: 1381.7,
      provider: "k-tour-id",
      connected: true,
    }
  },
  async topUp(wallet: Wallet, amountKRW: number): Promise<Wallet> {
    await delay(1200)
    return { ...wallet, balanceKRW: wallet.balanceKRW + amountKRW }
  },
}

export const mockBenefitService: BenefitService = {
  async recommend(): Promise<BenefitOffer[]> {
    await delay(500)
    return BENEFIT_OFFERS
  },
  async chat(message: string): Promise<string> {
    await delay(700)
    const m = message.toLowerCase()
    const ko = /[가-힣]/.test(message)
    const food = m.includes("food") || m.includes("eat") || m.includes("배달") || m.includes("맛집") || m.includes("먹")
    const transit = m.includes("transport") || m.includes("subway") || m.includes("t-money") || m.includes("교통") || m.includes("지하철")
    const benefit = m.includes("coupon") || m.includes("benefit") || m.includes("혜택") || m.includes("쿠폰") || m.includes("남은")
    if (food)
      return ko
        ? "오늘은 서대문 후라이드 치킨을 추천해요. 주문 전에 예상 도착 시간과 최종 결제 금액을 확인할 수 있어요. 여행자 혜택을 볼까요?"
        : "Try Korean fried chicken in Seodaemun. You can review the arrival time and final total before ordering. View your traveler benefits?"
    if (transit)
      return ko
        ? "교통 바우처가 있다면 지갑에서 사용 상태와 기한을 확인할 수 있어요. 탑승 전에 이용 가능한 교통수단을 확인해 주세요."
        : "If you have a transit voucher, check its availability and expiry in Wallet before you travel."
    if (benefit)
      return ko
        ? "남은 여행 잔액을 바우처로 전환할 수 있어요. 전환하기 전에 금액, 사용 기한, 미사용 시 되돌리는 조건을 모두 확인해 드릴게요."
        : "You can convert part of your travel balance into a voucher. I’ll show the amount, expiry and return conditions before you confirm."
    return ko
      ? "저는 K-Tour ID 가이드예요. 여행자 할인, 여행 잔액, 바우처 사용 방법을 도와드려요."
      : "I'm your K-Tour ID guide. Ask about traveler discounts, your travel balance or vouchers."
  },
}
