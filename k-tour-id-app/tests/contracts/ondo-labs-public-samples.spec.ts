import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { LABS_SAMPLE_CASES, labsSampleVisitImport, labsSignerIssue } from "../../features/ondo/labs/labs-model"
import { applyBActivityEvidence } from "../../features/ondo/identity-b/activity-profile-b-provider"
import { ondoMapPalette, ondoMapStyle } from "../../lib/ondo/map/ondo-map-style"

test("LABS-PUBLIC-001 the public sample catalog covers signer, route, merchant and badge recovery", () => {
  expect(new Set(LABS_SAMPLE_CASES).size).toBe(LABS_SAMPLE_CASES.length)
  for (const scenario of ["oauth_cancel", "epoch_expired", "salt_recovery", "prover_failed"] as const) expect(labsSignerIssue(scenario)).toBe(scenario)
  for (const scenario of ["success", "wrong_network", "sponsor_denied", "bridge_failed", "quote_expired", "trait_failed", "mint_failed"] as const) expect(labsSignerIssue(scenario)).toBeNull()
})

test("LABS-PUBLIC-002 preparing nine visits adds only missing unique evidence without replacing existing visits", () => {
  const venues = Array.from({ length: 12 }, (_, index) => `place-${index}`)
  const existing = ["visit:place-1", "visit:place-8", "visit:outside-this-fixture"]
  const original = JSON.stringify([venues, existing])
  const planned = labsSampleVisitImport([...venues, ...venues], existing, 3)
  expect(planned).toHaveLength(6)
  expect(new Set(planned).size).toBe(6)
  expect(planned.some(id => existing.includes(id))).toBe(false)
  expect(JSON.stringify([venues, existing])).toBe(original)
  expect(labsSampleVisitImport(venues, existing, 9)).toEqual([])
  expect(labsSampleVisitImport(venues, existing, 10)).toEqual([])
  expect(labsSampleVisitImport(venues, existing, Number.NaN)).toEqual([])
})

test("LABS-PUBLIC-003 9-to-10 requires a new visit receipt; replay cannot create the milestone", () => {
  let snapshot: Parameters<typeof applyBActivityEvidence>[0] = { reputation: { visit: "new", contribution: "new", meetup: "new" }, stamps: 0, acceptedEvidenceIds: [], evidenceReceipts: [] }
  const planned = labsSampleVisitImport(Array.from({ length: 12 }, (_, i) => `place-${i}`), [], 0)
  for (const evidenceId of planned) {
    const next = applyBActivityEvidence(snapshot, { evidenceId, axes: ["visit"], addVisitStamp: true })
    expect(next.result).toBe("accepted")
    snapshot = next.snapshot
  }
  expect(snapshot.stamps).toBe(9)
  const duplicate = applyBActivityEvidence(snapshot, { evidenceId: planned[0], axes: ["visit"], addVisitStamp: true })
  expect(duplicate.result).toBe("duplicate")
  expect(duplicate.snapshot.stamps).toBe(9)
  const tenth = applyBActivityEvidence(snapshot, { evidenceId: "visit:place-9", axes: ["visit"], addVisitStamp: true })
  expect(tenth.snapshot.stamps).toBe(10)
  expect(tenth.snapshot.evidenceReceipts).toHaveLength(10)
  expect(tenth.snapshot.evidenceReceipts.every(receipt => receipt.provenance.truth === "REVIEW_FIXTURE")).toBe(true)
})

test("LABS-PUBLIC-004 public sample controls do not forge ten visits or mint twice", () => {
  const source = readFileSync("features/ondo/labs/labs-entry.tsx", "utf8")
  expect(source).not.toContain("Math.max(activity.stamps, 10)")
  expect(source).toContain("stamps={activity.stamps}")
  expect(source).toContain('data-testid="labs-sample-case"')
  expect(source).toContain('data-testid="labs-load-sample-visits"')
  expect(source).toContain('mint === "NFT-MINTED" || mint === "NFT-MINTING"')
  expect(source).toContain('if (wallet !== "WAL-READY") { setBridge("BRG-FAILED"); return }')
  expect(source).toContain('for (const timer of sampleTimersRef.current) window.clearTimeout(timer)')
  expect(source).not.toMatch(/fetch\(|sendTransaction\(|executeTransaction\(/)
})

test("MAP-PALETTE-001 initial and later appearance updates share a single palette with distinct water", () => {
  for (const [appearance, after19] of [["light", false], ["light", true], ["dark", false], ["dark", true]] as const) {
    const palette = ondoMapPalette(appearance, after19)
    const style = ondoMapStyle("en", appearance, after19)
    const water = style.layers.find(layer => layer.id === "water")!
    expect(water.type).toBe("fill")
    if (water.type === "fill") expect(water.paint?.["fill-color"]).toBe(palette.water)
    expect(palette.water).not.toBe(palette.canvas)
  }
  expect(ondoMapPalette("light", true)).not.toEqual(ondoMapPalette("dark", true))
})
