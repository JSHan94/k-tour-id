// K-Tour ID domain model.
// Mirrors the product spec in docs/: identity proof → K-Tour service credential (VC)
// → KRW stablecoin wallet → services → OmniOne Chain event log → AI benefits.

/** 내국인 / 외국인 관광객 / 장기체류 외국인 */
export type UserType = "korean" | "foreigner" | "long-term"

export type IdentityMethod = "mobile-id" | "passport-did" | "foreigner-id"

export interface Identity {
  method: IdentityMethod
  displayName: string
  nationality: string
  nationalityFlag: string
  /** portrait lifted from the ID, confirmed by the user, carried onto the K-Pass */
  photoUrl?: string
  verified: boolean
  /** Open DID identifier (did:omn:...) */
  did: string
}

export type ServiceKey = "transport" | "shopping" | "delivery" | "reservation" | "benefit"

export type TrustLevel = "basic" | "verified" | "premium"

export type IntegrationMode = "live" | "sandbox" | "simulated"

export type CredentialStatus = "pending" | "active" | "expiring" | "suspended" | "revoked" | "expired"

/**
 * K-Tour service credential issued as a Verifiable Credential. This private
 * credential is not a national ID, visa, residence card or immigration status.
 */
export interface KPassCapsule {
  id: string
  holderName: string
  userType: UserType
  did: string
  issuedAt: string
  expiresAt: string
  /** 체류기간 e.g. "90 days" */
  stayPeriod: string
  /** 결제한도 (KRW) */
  paymentLimitKRW: number
  trustLevel: TrustLevel
  status: CredentialStatus
  /** Private service credential issuer. This is not the government Mobile ID issuer. */
  issuer: "K-Tour ID"
  credentialType: "KTourVisitorCredential"
  /** 사용 가능 서비스 */
  services: ServiceKey[]
  /** 혜택권 */
  benefits: string[]
}

export interface Wallet {
  address: string
  balanceKRW: number
  /** approximate KRW per 1 USD, used for the tourist-facing USD readout */
  usdRate: number
  provider: "k-tour-id" | "external"
  connected: boolean
}

export type ChainEventType =
  | "IdentityVerified"
  | "KPassIssued"
  | "WalletLinked"
  | "WalletFunded"
  | "PresentationCreated"
  | "PresentationVerified"
  | "BenefitApplied"
  | "PaymentAuthorized"
  | "VoucherIssued"
  | "VoucherRedeemed"
  | "PartnerSettlementLogged"
  | "CredentialRevoked"

export interface ChainEvent {
  id: string
  type: ChainEventType
  txHash: string
  timestamp: string
  summary: string
  integrationMode?: IntegrationMode
  /** Only hashes and non-PII references belong here. */
  evidence?: {
    network: string
    contract?: string
    payloadHash: string
  }
}

export type ClaimKey = "visitorEligibility" | "tripActive" | "couponUnused" | "ageOver19" | "nationality"

export interface PresentationClaim {
  key: ClaimKey
  label: string
  value: string | boolean
  required: boolean
  selected: boolean
  privacy: "predicate" | "disclosed"
}

export type PresentationStatus = "requested" | "consented" | "creating" | "submitted" | "verified" | "rejected" | "expired"

export interface PresentationRequest {
  id: string
  verifierDid: string
  verifierName: string
  purpose: string
  retention: "none" | "session" | "30-days"
  nonce: string
  expiresAt: string
  claims: PresentationClaim[]
}

export interface PresentationReceipt {
  id: string
  requestId: string
  status: PresentationStatus
  createdAt: string
  disclosedClaims: ClaimKey[]
  vpHash: string
  integrationMode: IntegrationMode
}

export type VoucherStatus = "available" | "reserved" | "redeemed" | "expired"

export interface Voucher {
  id: string
  title: string
  partner: string
  valueKRW: number
  expiresAt: string
  status: VoucherStatus
  eligibilityClaim: ClaimKey
  funding: "partner-funded" | "municipal-campaign" | "user-converted"
}

export interface SettlementReceipt {
  id: string
  merchant: string
  grossKRW: number
  voucherKRW: number
  paidKRW: number
  status: "pending" | "anchored" | "settled" | "failed"
  presentationId: string
  eventIds: string[]
  integrationMode: IntegrationMode
}

export interface OperationResult<T> {
  ok: boolean
  data?: T
  error?: { code: string; message: string; retryable: boolean }
}

export interface Transaction {
  id: string
  merchant: string
  /** partner brand key (lib/brands) for a real logo avatar; falls back to `icon` */
  brand?: string
  category: ServiceKey | "topup"
  /** negative = spend, positive = top-up/receive (KRW) */
  amountKRW: number
  date: string
  /** emoji fallback when no logo asset */
  icon: string
  iconBg: string
  chainEvent: ChainEventType
  txHash: string
}

export type ServiceCategory = "food" | "shopping" | "medical"

export interface ServiceItem {
  id: string
  category: ServiceCategory
  name: string
  location: string
  priceKRW: number
  etaLabel: string
  rating: number
  image: string
  partner?: string
  url?: string
}

export interface BenefitOffer {
  id: string
  title: string
  detail: string
  kind: "coupon" | "nft" | "cashback" | "tour"
  valueLabel: string
  /** AI Benefit Router rationale shown to the user */
  reason: string
  icon: string
}

export interface AppNotification {
  id: number
  type: "transaction" | "promotion" | "security" | "system"
  title: string
  message: string
  time: string
  read: boolean
  icon: string
  iconBg: string
}

// ---- Verified Connect (social / activities among DID-verified users) -------

export type ActivityCategory = "food" | "tour" | "language" | "play"

export interface Activity {
  id: string
  category: ActivityCategory
  title: string
  titleEn?: string
  host: string
  hostFlag: string
  hostPhoto: string
  hostType: UserType
  trustLevel: TrustLevel
  place: string
  placeEn?: string
  time: string
  timeEn?: string
  capacity: number
  joined: number
  participants: string[]
  costKRW?: number
}

export type ConnectRole = "guide" | "buddy" | "tutor"

export interface Peer {
  id: string
  name: string
  flag: string
  photo: string
  userType: UserType
  trustLevel: TrustLevel
  role: ConnectRole
  bio: string
  bioEn?: string
  langs: string[]
}

export interface ConnectMessage {
  id: string
  fromMe: boolean
  text: string
  textEn?: string
  time: string
  timeEn?: string
}

/** Full session held by the AppProvider. */
export interface Session {
  onboarded: boolean
  userType: UserType | null
  identity: Identity | null
  capsule: KPassCapsule | null
  wallet: Wallet
}
