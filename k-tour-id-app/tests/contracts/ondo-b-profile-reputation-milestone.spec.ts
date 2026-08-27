import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { restoreBActivityProfile } from "../../features/ondo/identity-b/activity-profile-b-provider"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

test("B-PROFILE-001 optional profile sanitizes every consented field and never imports identity nationality", () => {
  const restored = restoreBActivityProfile({
    profile: {
      displayName: "  Mina   Park  ",
      from: { value: "  Canada  ", consent: true },
      livesIn: { value: "Seoul", consent: false },
      languages: { value: ["English", "日本語", "English", 91], consent: true },
      nationality: "must-not-copy",
      dateOfBirth: "must-not-copy",
    },
  })

  expect(restored.profile).toEqual({
    displayName: "Mina Park",
    from: { value: "Canada", consent: true },
    livesIn: { value: "Seoul", consent: false },
    languages: { value: ["English", "日本語"], consent: true },
  })
  expect(restored.profile).not.toHaveProperty("nationality")
  expect(restored.profile).not.toHaveProperty("dateOfBirth")
})

test("B-PROFILE-002 activity keeps three event axes plus derived identity separate and clamps the milestone", () => {
  const restored = restoreBActivityProfile({
    reputation: {
      identity: "verified",
      visit: "repeat",
      contribution: "established",
      meetup: "reliable",
      trustScore: 99,
    },
    stamps: 99,
    acceptedEvidenceIds: [
      "visit:seoul-seongsu-gukbap",
      "visit:seoul-seongsu-gukbap",
      "contribution:tip-1",
      "payment:must-not-count",
    ],
  })

  expect(restored.reputation).toEqual({ visit: "repeat", contribution: "established", meetup: "reliable" })
  expect(restored.reputation).not.toHaveProperty("identity")
  expect(restored.reputation).not.toHaveProperty("trustScore")
  expect(restored.stamps).toBe(10)
  expect(restored.acceptedEvidenceIds).toEqual(["visit:seoul-seongsu-gukbap", "contribution:tip-1"])
})

test("B-PROFILE-003 B activity is session-only, idempotent by evidence, and payment cannot increment a stamp", () => {
  const provider = source("features/ondo/identity-b/activity-profile-b-provider.tsx")
  const surface = source("features/ondo/identity-b/profile-reputation-b.tsx")
  const visitReceipt = source("features/ondo/commerce-b/visit-stamp-receipt-b.tsx")

  expect(provider).toContain('B_ACTIVITY_PROFILE_SESSION_KEY = "ondo-b.activity-profile.v1"')
  expect(provider).toContain('LEGACY_SESSION_KEY = "ondo.session.v3"')
  expect(provider).toContain("acceptedEvidenceIds.includes(evidenceId)")
  expect(provider).toContain('recordUniqueVisit: (evidenceId) => record("visit", evidenceId)')
  expect(provider).not.toContain("localStorage")
  expect(provider).not.toMatch(/record\("payment"|payment.*stamps|stamps.*payment/i)
  expect(surface).toContain('data-testid="ondo-profile-panel"')
  expect(surface).toContain('data-testid="ondo-trust-panel"')
  expect(surface).toContain('data-testid="ondo-b-stamp-milestone"')
  expect(surface).toContain('data-testid="open-labs-milestone"')
  expect(surface).toContain('ja: {')
  expect(visitReceipt).toContain('const evidenceId = `visit:${venueId}`')
  expect(visitReceipt).toContain('data-testid="visit-proof-check"')
  expect(visitReceipt).toContain('data-testid="checkout-stamp-milestone"')
  expect(visitReceipt).toContain("Payment never adds a stamp")
  expect(visitReceipt).toContain("결제만으로 스탬프가 생기지 않아요")
  expect(visitReceipt).toContain("支払いだけではスタンプは増えません")
})

test("B-PROFILE-004 profile owns the full responsive ID canvas in short landscape", () => {
  const traveler = source("features/ondo/identity-b/traveler-id-entry-b.tsx")
  const travelerStyles = source("features/ondo/identity-b/traveler-id-entry-b.module.css")
  const profileStyles = source("features/ondo/identity-b/profile-reputation-b.module.css")

  expect(traveler).toContain("styles.profilePane")
  expect(travelerStyles).toContain(".profilePane { min-width: 0; }")
  expect(travelerStyles).toMatch(/orientation:\s*landscape[\s\S]*\.profilePane\s*\{\s*grid-column:\s*1 \/ -1;\s*grid-row:\s*3;/)
  expect(profileStyles).toMatch(/orientation:\s*landscape[\s\S]*\.root\s*\{\s*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/)
})
