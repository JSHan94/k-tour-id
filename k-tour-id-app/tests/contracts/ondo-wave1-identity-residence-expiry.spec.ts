import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { resolveTravelerAxisOutcomeB } from "../../features/ondo/identity-b/traveler-id-status-b"
import {
  DEFAULT_B_ACTION_GATE_SESSION,
  consumePendingBActionAtMutation,
  createBLocalSignalActionReturn,
  persistBActionGateSession,
  privateContextForBAction,
  restoreBActionGateSession,
  updateBActionAxisSession,
} from "../../features/ondo/identity-b/action-gate-contract-b"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")
const directCheck = source("features/ondo/identity-b/local-check-walkthrough-b.tsx")
const traveler = source("features/ondo/identity-b/traveler-id-entry-b.tsx")
const setup = source("features/ondo/identity-b/ktour-id-setup-b.tsx")
const coordinator = source("features/ondo/identity-b/action-gate-coordinator-b.tsx")

class MemoryStorage {
  private readonly values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
}

test("W1-ID-RES-001 Residence consent keeps the selected Residence identity and icon", () => {
  expect(directCheck).toContain('personRoute === "residence_card" ? <IdCard')
  expect(directCheck).toContain('personRoute === "residence_card" ? copy.residenceCard : copy.passport')
  expect(directCheck).toContain('data-person-route={personRoute}')
})

test("W1-ID-RES-002 Residence preflight distinguishes normal outage, review unsupported and review supported", () => {
  expect(directCheck).toContain('type ResidenceAvailability = "supported" | "unsupported" | "outage"')
  expect(directCheck).toContain('reviewMode ? residenceQa?.residenceCard ?? "supported" : "outage"')
  expect(directCheck).toContain('data-availability={reviewMode ? residenceAvailability : "unavailable"}')
  expect(directCheck).toContain('FX-PER-RESIDENCE-${residenceAvailability === "unsupported" ? "UNSUPPORTED" : "OUTAGE"}')
  expect(directCheck).toContain('providerUnavailable("person")')
  expect(directCheck).toMatch(/This Residence Card method isn’t supported|이 외국인등록증 방식은 지원하지 않아요|この在留カード方式には対応していません/)
  expect(directCheck).toMatch(/Residence Card is temporarily unavailable|외국인등록증 확인을 잠시 이용할 수 없어요|在留カードの確認を一時的に利用できません/)
  expect(directCheck).toContain('export type LocalCheckOutcome = "success" | "cancel" | "failure" | "unavailable" | "unsupported" | "expired"')
  expect(directCheck).not.toContain('finish(result === "unsupported" ? "unavailable"')
  expect(coordinator).toContain('type ResidenceAvailability = "supported" | "unsupported" | "outage"')
  expect(coordinator).toContain('residenceCard?: ResidenceAvailability')
  expect(coordinator).toContain('availabilityDroveOutcome && residenceAvailability === "unsupported" ? "unsupported" : "unavailable"')
  expect(coordinator).toContain('data-route-status={residenceUnsupported ? "unsupported"')
  expect(coordinator).toContain('residenceIssue ? <button')
  expect(coordinator).toMatch(/This Residence Card is not supported|이 외국인등록증 방식은 지원하지 않아요|この在留カード方式には対応していません/)
  expect(coordinator).toMatch(/Not supported|지원하지 않음|非対応/)
  expect(coordinator).toContain('return axis.status === "eligible" && axis.expiresAt !== null')
})

test("W1-ID-RES-003 unsupported remains a non-authorizing Person terminal while pending return and private draft stay exact", () => {
  const now = new Date("2026-09-04T10:00:00.000Z")
  const pending = createBLocalSignalActionReturn({
    venueId: "mois-0021cd596bc5b2a922ad",
    draftNonce: "residence:unsupported:exact",
    tags: ["welcoming"],
    note: "Keep this exact draft.",
    now,
  })
  const storage = new MemoryStorage()
  expect(persistBActionGateSession(storage as unknown as Storage, { ...DEFAULT_B_ACTION_GATE_SESSION, pending }, now)).toBe(true)
  const before = restoreBActionGateSession(storage as unknown as Storage, now)
  const pendingBytes = JSON.stringify(before.pending)
  const privateDraftBytes = JSON.stringify(before.pending ? privateContextForBAction(before.pending) : null)

  const withUnsupportedAxis = updateBActionAxisSession(storage as unknown as Storage, "person", "unsupported", now)
  expect(withUnsupportedAxis).not.toBeNull()
  expect(withUnsupportedAxis?.person).toEqual({ status: "unsupported", expiresAt: null })
  expect(withUnsupportedAxis?.payment).toEqual({ status: "unverified", expiresAt: null })
  expect(JSON.stringify(withUnsupportedAxis?.pending)).toBe(pendingBytes)
  expect(JSON.stringify(withUnsupportedAxis?.pending ? privateContextForBAction(withUnsupportedAxis.pending) : null)).toBe(privateDraftBytes)

  const terminal = {
    ...withUnsupportedAxis!,
    personRoute: { tokenId: pending.tokenId, route: "mobile_residence_card" as const },
    outcome: { tokenId: pending.tokenId, gate: "person" as const, status: "unsupported" as const },
  }
  expect(persistBActionGateSession(storage as unknown as Storage, terminal, now)).toBe(true)
  const restored = restoreBActionGateSession(storage as unknown as Storage, now)
  expect(restored).toMatchObject({
    person: { status: "unsupported", expiresAt: null },
    payment: { status: "unverified", expiresAt: null },
    personRoute: { tokenId: pending.tokenId, route: "mobile_residence_card" },
    outcome: { tokenId: pending.tokenId, gate: "person", status: "unsupported" },
  })
  expect(JSON.stringify(restored.pending)).toBe(pendingBytes)
  expect(JSON.stringify(restored.pending ? privateContextForBAction(restored.pending) : null)).toBe(privateDraftBytes)
  expect(consumePendingBActionAtMutation(storage as unknown as Storage, pending, new Set(["account"]), now)).toBeNull()
})

test("W1-ID-EXP-001 Person readiness expires against an explicit clock", () => {
  const axis = { status: "eligible" as const, expiresAt: "2026-09-04T12:00:00.000Z" }
  expect(resolveTravelerAxisOutcomeB(axis, Date.parse("2026-09-04T11:59:59.999Z"))).toBe("success")
  expect(resolveTravelerAxisOutcomeB(axis, Date.parse("2026-09-04T12:00:00.000Z"))).toBe("expired")
  expect(resolveTravelerAxisOutcomeB({ status: "unavailable", expiresAt: null }, 0)).toBe("unavailable")
  expect(resolveTravelerAxisOutcomeB({ status: "unsupported", expiresAt: null }, 0)).toBe("unsupported")

  expect(traveler).toContain('resolveTravelerAxisPresentationB(actionSession.person, statusClock)')
  expect(traveler).toContain('personOutcome === "success" ? restoredPersonStatus')
  expect(traveler).toContain('actionSession.person.status === "eligible" && actionSession.person.expiresAt')
  expect(traveler).toContain('Math.min(credentialExpiry, ageExpiry, personExpiry, paymentExpiry)')
  expect(traveler).toContain('actionSession.person.expiresAt, actionSession.person.status')
  expect(traveler).toContain('actionSession.payment.expiresAt, actionSession.payment.status')
})

test("W1-ID-EXP-002 an expired Residence route retries Residence rather than Passport capture", () => {
  expect(setup).toContain('setPhase(method === "passport_ekyc" ? "document_preview" : "cx_handoff_preview")')
  expect(setup).not.toContain('setPhase(method === "mobile_id" ? "cx_handoff_preview" : "document_preview")')
})
