import type { AssetBalance, Provenance } from "../contracts/domain"
import type { CanonicalEvidenceEnvelope, MerchantTraitReceipt } from "../contracts/evidence"
import { canAdvanceBridge, type BridgePhase } from "../contracts/commerce"

export type WalletState = "WAL-DISCONNECTED" | "WAL-CONNECTING" | "WAL-READY" | "WAL-FAILED"
export type BridgeState = "BRG-IDLE" | "BRG-QUOTED" | "BRG-CONFIRMING" | "BRG-PENDING" | "BRG-SIMULATED-SUCCESS" | "BRG-FAILED" | "BRG-CANCELLED"

export const SIMULATED_PROVENANCE: Provenance = {
  truth: "SIMULATED",
  fixtureId: "FX-WAL-LABS-READY",
  sourceKind: "fixture",
  fetchedAt: "2026-08-19T20:00:00+09:00",
  isSimulation: true,
}

export const CONTRACT_PROVENANCE: Provenance = {
  truth: "CONTRACT_ONLY",
  fixtureId: "FX-EVD-VALID",
  sourceKind: "adapter",
  fetchedAt: "2026-08-19T20:00:00+09:00",
  isSimulation: false,
}

export const LABS_ASSETS: AssetBalance[] = [
  { id: "sui-usdc", symbol: "USDC", chain: "Sui Testnet", representation: "native", amount: "24.00", estimatedUsd: "24.00", provenance: { ...SIMULATED_PROVENANCE, fixtureId: "FX-WAL-LABS-READY" } },
  { id: "sui-usdt", symbol: "USDT", chain: "Sui Testnet", representation: "wrapped", amount: "13.50", estimatedUsd: "13.46", provenance: { ...SIMULATED_PROVENANCE, fixtureId: "FX-WAL-LABS-READY" } },
  { id: "omnione-ookrw", symbol: "OOKRW", chain: "OmniOne hypothesis", representation: "test_token", amount: "18000", provenance: { ...SIMULATED_PROVENANCE, fixtureId: "FX-BRG-QUOTE" } },
]

export const EVIDENCE_FIXTURES: CanonicalEvidenceEnvelope[] = [
  {
    id: "evidence-opendid-person",
    sourceStandard: "OpenDID",
    adapterId: "opendid-adapter",
    subjectRef: "subject:fixture",
    claimType: "person",
    claimValue: true,
    issuedAt: "2026-08-19T19:30:00+09:00",
    provenance: { ...CONTRACT_PROVENANCE, fixtureId: "FX-EVD-VALID" },
  },
  {
    id: "evidence-eas-visit",
    sourceStandard: "EAS",
    adapterId: "eas-adapter",
    subjectRef: "subject:fixture",
    claimType: "visit",
    claimValue: "stale-example",
    issuedAt: "2026-08-01T10:00:00+09:00",
    expiresAt: "2026-08-10T10:00:00+09:00",
    provenance: { ...CONTRACT_PROVENANCE, fixtureId: "FX-EVD-STALE", expiresAt: "2026-08-10T10:00:00+09:00" },
  },
]

export const TRAIT_FIXTURES: MerchantTraitReceipt[] = [
  {
    merchantId: "merchant-seongsu-gukbap",
    offerId: "offer-foreign-card",
    policyId: "policy-v3",
    result: "stale",
    checkedAt: "2026-08-01T10:00:00+09:00",
    expiresAt: "2026-08-10T10:00:00+09:00",
    provenance: { ...CONTRACT_PROVENANCE, fixtureId: "FX-TRT-STALE", expiresAt: "2026-08-10T10:00:00+09:00" },
  },
  {
    merchantId: "merchant-euljiro-nogari",
    offerId: "offer-over19",
    policyId: "policy-v4",
    result: "error",
    checkedAt: "2026-08-19T20:00:00+09:00",
    provenance: { ...CONTRACT_PROVENANCE, fixtureId: "FX-TRT-ERROR" },
  },
]

export function nextBridgePhase(current: BridgePhase): BridgePhase | null {
  const candidates: BridgePhase[] = ["source_submitted", "source_confirmed", "relaying", "destination_confirmed"]
  const next = current === "none" ? candidates[0] : candidates[candidates.indexOf(current) + 1]
  return next && canAdvanceBridge(current, next) ? next : null
}

export function bridgeStateForPhase(phase: BridgePhase): BridgeState {
  return phase === "destination_confirmed" ? "BRG-SIMULATED-SUCCESS" : phase === "none" ? "BRG-IDLE" : "BRG-PENDING"
}
