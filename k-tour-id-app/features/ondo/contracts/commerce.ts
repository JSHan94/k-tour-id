import type { AssetBalance } from "./domain"

export type BridgePhase = "none" | "source_submitted" | "source_confirmed" | "relaying" | "destination_confirmed"
export const BRIDGE_PHASES: BridgePhase[] = ["none", "source_submitted", "source_confirmed", "relaying", "destination_confirmed"]

export function canAdvanceBridge(current: BridgePhase, next: BridgePhase) {
  return BRIDGE_PHASES.indexOf(next) === BRIDGE_PHASES.indexOf(current) + 1
}

export function estimatedUsdTotal(assets: AssetBalance[]) {
  return assets.reduce((total, asset) => total + Number(asset.estimatedUsd ?? 0), 0)
}

export function canIncrementStamp(input: { scenarioId: string; evidenceId: string; acceptedEvidenceIds: string[] }) {
  return input.scenarioId === "SCN-006-STAMP-MILESTONE"
    && input.evidenceId.length > 0
    && !input.acceptedEvidenceIds.includes(input.evidenceId)
}
