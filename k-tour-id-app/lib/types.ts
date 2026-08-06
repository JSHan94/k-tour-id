// K-Tour ID domain model.
// Mirrors the product spec in docs/: identity proof → K-Tour service credential (VC)
// → demo KRW balance → services → OmniOne Chain event log → AI benefits.

/** 내국인 / 외국인 관광객 / 장기체류 외국인 */
export type UserType = "korean" | "foreigner" | "long-term"

export type IdentityMethod = "mobile-id" | "passport-did" | "foreigner-id"

export interface Identity {
  method: IdentityMethod
  displayName: string
  nationality: string
  nationalityFlag: string
  /** User-approved profile portrait; synthetic assets are used only in this demo. */
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
  credentialType: "KTourServiceCredential"
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
  | "PaymentCaptured"
  | "PaymentRefunded"
  | "VoucherIssued"
  | "VoucherRedeemed"
  | "VoucherRefunded"
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
  /** Mock policy constraints. These make the clickable demo behave like a real campaign. */
  applicableMerchant?: string
  applicableService?: ServiceKey
  minimumSpendKRW?: number
  redemption: "single-use" | "stored-value"
  campaignId?: string
  /** Persona routing is explicit in the mock; policy services remain authoritative. */
  eligibleUserTypes?: UserType[]
  /** Product detail that can explain where this voucher is usable. */
  itemId?: string
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

/** One shared record keeps the holder, merchant and settlement mock in sync. */
export type DemoJourneyStage =
  | "request-ready"
  | "checking"
  | "presentation-created"
  | "presentation-expired"
  | "presentation-revoked"
  | "presentation-offline"
  | "benefit-ready"
  | "paid"
  | "settlement-submitted"
  | "anchored"
  | "refunded"

export type DemoClaimKey = "credentialActive" | "serviceEligibility" | "tripActive" | "couponUnused" | "ageOver19"

export interface DemoJourney {
  stage: DemoJourneyStage
  itemId: string
  optionId: string
  optionLabel: string
  optionLabelEn: string
  fulfilmentLabel: string
  fulfilmentLabelEn: string
  merchant: string
  merchantDisplay: string
  product: string
  productKo: string
  service: Exclude<ServiceKey, "benefit">
  purpose: string
  requestId: string
  presentationId: string
  voucherId: string
  paymentId: string
  settlementId: string
  receiptId: string
  campaignId: string
  requestedClaims: DemoClaimKey[]
  presentedClaims: DemoClaimKey[]
  grossKRW: number
  voucherKRW: number
  paidKRW: number
  platformFeeKRW: number
  campaignReimbursementKRW: number
  merchantDueKRW: number
  createdAt: string
  anchorHash?: string
  /** Actual refund outcomes; shared by holder and partner views. */
  refundCashKRW?: number
  refundVoucherKRW?: number
  reversedBenefitKRW?: number
  settledUsageDays?: number
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

export type ServiceCategory = "experience" | "food" | "mobility" | "shopping" | "wellness" | "medical"

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

export interface LocalizedText {
  ko: string
  en: string
}

export interface ServiceOption {
  id: string
  label: LocalizedText
  priceDeltaKRW?: number
  available: boolean
}

/** Curated, purchasable Explore item. Kept separate from the legacy catalog. */
export interface MarketplaceItem {
  id: string
  category: ServiceCategory
  service: Exclude<ServiceKey, "benefit">
  title: LocalizedText
  description: LocalizedText
  location: LocalizedText
  /** Approximate venue coordinate used only for on-device nearby ranking. */
  geo?: {
    latitude: number
    longitude: number
  }
  availability: LocalizedText
  duration: LocalizedText
  fulfilment: "booking" | "delivery" | "pickup" | "instant"
  fulfilmentLabel: LocalizedText
  cancellation: LocalizedText
  languageLabels: string[]
  merchant: string
  image: string
  priceKRW: number
  rating: number
  options: ServiceOption[]
  eligibleUserTypes: UserType[]
  featuredFor: UserType[]
  voucherId?: string
  integrationMode: IntegrationMode
}

export interface CommerceOrder {
  id: string
  receiptId: string
  itemId: string
  title: string
  titleEn: string
  merchant: string
  service: Exclude<ServiceKey, "benefit">
  optionId: string
  optionLabel: string
  optionLabelEn: string
  grossKRW: number
  discountKRW: number
  paidKRW: number
  voucherId?: string
  voucherFunding?: Voucher["funding"]
  status: "paid" | "used" | "refunded"
  fulfilment: MarketplaceItem["fulfilment"]
  cancellation: string
  cancellationEn: string
  fulfilmentLabel: string
  fulfilmentLabelEn: string
  /** Mock operational fields surfaced in the receipt so fulfilment is testable. */
  deliveryAddress?: string
  activationAt: string
  cancelDeadline: string
  refundableKRW: number
  refundedKRW?: number
  refundedAt?: string
  settledUsageDays?: number
  paidAt: string
  transactionId: string
  entryContext?: CommerceEntryContext
}

export interface CommerceEntryContext {
  contextId: string
  contextLabel?: string
  region?: string
  returnTo: string
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
  image: string
  imagePosition?: string
  geo?: {
    latitude: number
    longitude: number
  }
  time: string
  timeEn?: string
  /** Languages participants can comfortably use in this activity. */
  languages: string[]
  capacity: number
  joined: number
  participants: string[]
  costKRW?: number
}

export interface ConnectMessage {
  id: string
  fromMe: boolean
  senderName?: string
  senderPhoto?: string
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
