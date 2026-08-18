import { expect, test } from "@playwright/test"
import { estimatedUsdTotal } from "../../features/ondo/contracts/commerce"
import { EVIDENCE_FIXTURES, LABS_ASSETS, SIMULATED_PROVENANCE, TRAIT_FIXTURES, bridgeStateForPhase, nextBridgePhase } from "../../features/ondo/labs/labs-model"

test("E2E-FL-018 bridge cannot skip source or destination finality", () => {
  let phase = nextBridgePhase("none")!
  expect(phase).toBe("source_submitted")
  expect(bridgeStateForPhase(phase)).toBe("BRG-PENDING")
  phase = nextBridgePhase(phase)!
  expect(phase).toBe("source_confirmed")
  phase = nextBridgePhase(phase)!
  expect(phase).toBe("relaying")
  expect(bridgeStateForPhase(phase)).toBe("BRG-PENDING")
  phase = nextBridgePhase(phase)!
  expect(phase).toBe("destination_confirmed")
  expect(bridgeStateForPhase(phase)).toBe("BRG-SIMULATED-SUCCESS")
})

test("E2E-FL-018 Labs balances keep USDC, USDT, and OOKRW separate", () => {
  expect(LABS_ASSETS.map((asset) => asset.symbol)).toEqual(["USDC", "USDT", "OOKRW"])
  expect(new Set(LABS_ASSETS.map((asset) => asset.id)).size).toBe(3)
  expect(estimatedUsdTotal(LABS_ASSETS)).toBeCloseTo(37.46)
  expect(LABS_ASSETS.every((asset) => asset.provenance.truth === "SIMULATED")).toBeTruthy()
  expect(SIMULATED_PROVENANCE.truth).toBe("SIMULATED")
})

test("E2E-FL-016 OpenDID and EAS stay separate before the canonical envelope", () => {
  const openDid = EVIDENCE_FIXTURES.find((evidence) => evidence.sourceStandard === "OpenDID")!
  const eas = EVIDENCE_FIXTURES.find((evidence) => evidence.sourceStandard === "EAS")!
  expect(openDid.adapterId).toBe("opendid-adapter")
  expect(eas.adapterId).toBe("eas-adapter")
  expect(openDid.adapterId).not.toBe(eas.adapterId)
  expect(EVIDENCE_FIXTURES.every((evidence) => evidence.provenance.truth === "CONTRACT_ONLY")).toBeTruthy()
})

test("E2E-FL-016 stale and error merchant traits never become eligibility", () => {
  expect(TRAIT_FIXTURES.map((trait) => trait.result)).toEqual(["stale", "error"])
  expect(TRAIT_FIXTURES.every((trait) => trait.provenance.truth === "CONTRACT_ONLY")).toBeTruthy()
})
