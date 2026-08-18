import { expect, test } from "@playwright/test"
import { canIncrementStamp } from "../../features/ondo/contracts/commerce"
import { badgeMetadata } from "../../features/ondo/rewards/reward-model"

test("E2E-FL-004 unique visit only advances the 9 to 10 milestone once", () => {
  const evidenceId = "visit-proof:seoul-seongsu-gukbap:2026-08-19"
  expect(canIncrementStamp({ scenarioId: "SCN-006-STAMP-MILESTONE", evidenceId, acceptedEvidenceIds: [] })).toBeTruthy()
  expect(canIncrementStamp({ scenarioId: "SCN-006-STAMP-MILESTONE", evidenceId, acceptedEvidenceIds: [evidenceId] })).toBeFalsy()
})

test("E2E-FL-018 souvenir metadata excludes identity and reputation", () => {
  const metadata = badgeMetadata()
  expect(metadata).toEqual({ title: "ONDO · Tenth visit", milestoneCount: 10 })
  expect(Object.keys(metadata)).not.toContain("identity")
  expect(Object.keys(metadata)).not.toContain("nationality")
  expect(Object.keys(metadata)).not.toContain("reputation")
})
