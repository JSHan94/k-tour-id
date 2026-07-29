// Service contracts. Today these are backed by mock implementations; for the
// finals demo (9/30) we add OmniOne / Open DID adapters that implement the SAME
// interfaces and switch them in `index.ts` — screens never change.

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

export interface IdentityService {
  /** OmniOne CX for Mobile ID / residence card; a separate eKYC adapter for passports. */
  verify(method: IdentityMethod, userType: UserType): Promise<Identity>
}

export interface CapsuleService {
  /** Issue the private K-Tour service credential through an OpenDID issuer. */
  issue(identity: Identity, userType: UserType): Promise<KPassCapsule>
}

export interface PresentationService {
  /** Build a holder-bound VP after explicit claim consent. */
  create(request: PresentationRequest, capsule: KPassCapsule): Promise<OperationResult<PresentationReceipt>>
}

export interface VerifierService {
  /** Merchant creates a nonce-bound request that expires quickly. */
  createRequest(): Promise<PresentationRequest>
  /** Verify signature, holder binding, issuer trust and credential status. */
  verify(receipt: PresentationReceipt): Promise<OperationResult<PresentationReceipt>>
}

export interface PolicyService {
  evaluate(input: {
    capsule: KPassCapsule
    service: ServiceKey
    amountKRW: number
    balanceKRW: number
    voucher?: Voucher
  }): Promise<OperationResult<{ payableKRW: number; discountKRW: number }>>
}

export interface VoucherService {
  redeem(voucher: Voucher): Promise<OperationResult<Voucher>>
  convertLeftover(amountKRW: number): Promise<OperationResult<Voucher>>
}

export interface SettlementService {
  create(input: Omit<SettlementReceipt, "id" | "status" | "eventIds" | "integrationMode">): Promise<OperationResult<SettlementReceipt>>
}

export interface ChainService {
  /** Append a hashed event to the OmniOne Chain event log. */
  log(type: ChainEventType, summary: string): Promise<ChainEvent>
  explorerUrl(txHash: string): string
}

export interface WalletService {
  create(holderName: string): Promise<Wallet>
  topUp(wallet: Wallet, amountKRW: number): Promise<Wallet>
}

export interface BenefitService {
  /** AI Benefit Router: personalised recommendations. */
  recommend(ctx: { balanceKRW: number; userType: UserType | null }): Promise<BenefitOffer[]>
  /** Mini curation chatbot. */
  chat(message: string): Promise<string>
}
