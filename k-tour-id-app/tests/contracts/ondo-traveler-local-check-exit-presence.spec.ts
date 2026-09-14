import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")
const traveler = source("features/ondo/identity-b/traveler-id-entry-b.tsx")
const check = source("features/ondo/identity-b/local-check-walkthrough-b.tsx")
const css = source("features/ondo/identity-b/local-check-walkthrough-b.module.css")
const presence = source("features/ondo/shared/ui/use-sheet-presence.ts")

test("TRAVELER-CHECK-EXIT-001 final return keeps the direct check present for its 260ms outer exit", () => {
  expect(traveler).toContain("useSheetPresence(activeCheck)")
  expect(traveler).toContain("directCheckPresence.value")
  expect(traveler).toContain("presenceState={directCheckPresence.phase}")
  expect(check).toContain('presenceState?: Exclude<SheetPresencePhase, "closed">')
  expect(check).toContain('data-check-presence={presenceState}')
  expect(css).toContain('.backdrop[data-check-presence="closing"]')
  expect(css).toContain("260ms")
})

test("TRAVELER-CHECK-EXIT-002 axis result commits before close and focus returns only after actual unmount", () => {
  expect(traveler).toContain("type DirectCheckRun")
  expect(traveler).toContain("returnFromCheck(returningRun: DirectCheckRun")
  expect(traveler.indexOf("updateBActionAxisSession(window.sessionStorage")).toBeLessThan(traveler.indexOf("finishCheckRun(returningRun)", traveler.indexOf("function returnFromCheck")))
  expect(traveler).toContain('directCheckPresence.phase !== "closed"')
  expect(traveler).toContain('returningCheck === "person" ? personRef.current : ageRef.current')
  expect(traveler).toContain('opener.closest("[inert],[aria-hidden=\'true\']")')
  expect(traveler).not.toContain("returningCheck === \"person\" ? personRef.current : ageRef.current)?.focus")
})

test("TRAVELER-CHECK-EXIT-003 closing remains modal, scroll-locked and input inert while inner phases do not own presence", () => {
  expect(check).toContain("useModalIsolation(true, layerRef)")
  expect(check).toContain('useDocumentScrollLock(origin === "traveler_id")')
  expect(check).toContain('aria-busy={closing ? "true" : undefined}')
  for (const capture of ["onClickCapture", "onPointerDownCapture", "onKeyDownCapture"]) expect(check).toContain(capture)
  expect(check).toContain("event.stopImmediatePropagation()")
  expect(check).toContain("if (closing) return")
  expect(check).toContain('if (phase !== "result" || result !== "success") return')
  expect(check).not.toMatch(/setPhase\([^)]*closing/)
})

test("TRAVELER-CHECK-EXIT-004 reduced motion and rapid reopen remain safe", () => {
  expect(traveler).toContain("checkSerialRef.current += 1")
  expect(traveler).toContain("key={directCheckPresence.value.serial}")
  expect(traveler).toContain("current?.serial === returningRun.serial ? null : current")
  expect(css).toContain("@media (prefers-reduced-motion: reduce)")
  expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*\.backdrop,[\s\S]*\.layer,[\s\S]*animation: none/)
  expect(presence).toContain('window.matchMedia("(prefers-reduced-motion: reduce)").matches')
  expect(presence).toContain("commitPresence(CLOSED_PRESENCE)")
})

test("TRAVELER-CHECK-EXIT-005 a Guest direct Person check completes the account state machine before activation", () => {
  expect(traveler).toContain("function activateDirectAccount()")
  const begin = traveler.indexOf("actions.beginAccountActivation()", traveler.indexOf("function activateDirectAccount"))
  const activate = traveler.indexOf("actions.activateAccount()", begin)
  const rollback = traveler.indexOf("actions.cancelAccountActivation()", activate)
  expect(begin).toBeGreaterThan(-1)
  expect(activate).toBeGreaterThan(begin)
  expect(rollback).toBeGreaterThan(activate)
  expect(traveler).toContain("onActivateAccount={activateDirectAccount}")
  expect(traveler).not.toContain("onActivateAccount={actions.activateAccount}")
})

test("TRAVELER-CHECK-EXIT-006 account failure and cancel never mutate the Person or Age axes", () => {
  expect(check).toMatch(/accountFailure \? \([\s\S]*data-testid="direct-person-return" onClick=\{\(\) => finish\("cancel"\)\}/)
  expect(traveler).toMatch(/returningCheck === "person"[\s\S]*if \(outcome !== "cancel" && reviewMode\) \{[\s\S]*setPersonOutcome\(outcome\)/)
  expect(traveler).not.toMatch(/returningCheck === "person"\) \{\s*setPersonOutcome\(outcome\)/)
  expect(traveler).toMatch(/returningCheck === "age"[\s\S]*if \(outcome !== "cancel" && reviewMode\) setAgeOutcome\(outcome\)/)
})

test("TRAVELER-CHECK-EXIT-007 normal provider-unavailable returns leave canonical axes unchanged", () => {
  expect(traveler).toContain('outcome !== "cancel" && reviewMode')
  expect(traveler).not.toContain('safeOutcome = outcome === "success" && !reviewMode')
  expect(traveler).toContain('if (outcome !== "cancel" && reviewMode) setAgeOutcome(outcome)')
  expect(traveler).not.toContain('else if (outcome === "success")')
})

test("TRAVELER-CHECK-EXIT-008 commit refusal stays in the check, nested Escape yields, and guest/manual-off age survives", () => {
  expect(check).toContain("onReturn(outcome: LocalCheckOutcome): boolean")
  expect(check).toMatch(/if \(!onReturn\(outcome\)\) \{[\s\S]*setResult\("failure"\)[\s\S]*setPhase\("result"\)[\s\S]*return/)
  expect(check).toContain('layerRef.current?.closest("[inert],[aria-hidden=\'true\']")')
  expect(check).toContain('matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 22')
  expect(check).toContain('matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 18')
  expect(traveler).toContain("readGuestAfter19MemoryB")
  expect(traveler).toContain('after19Session?.mode === "manual-off"')
  expect(traveler).toContain("return false")
  expect(traveler).toContain("return true")
})
