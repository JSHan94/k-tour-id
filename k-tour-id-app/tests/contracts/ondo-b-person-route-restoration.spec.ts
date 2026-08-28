import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

test("FL-005/006 Person route restoration stays inside the common exact-return gate", () => {
  const coordinator = source("features/ondo/identity-b/action-gate-coordinator-b.tsx")
  const alternate = coordinator.slice(coordinator.indexOf("function usePassportAlternative"), coordinator.indexOf("function releaseReady"))

  expect(coordinator).toContain('type PersonRouteB = "mobile_id_cx" | "mobile_residence_card" | "passport_ekyc"')
  expect(coordinator).toContain('persona === "local_contributor" || persona === "korean_local"')
  expect(coordinator).toContain('persona === "preparing" || persona === "long_term_resident"')
  expect(coordinator).toContain('data-active-gate={gate} data-person-route={gate === "person" ? personRoute : undefined}')
  expect(coordinator).toContain('data-testid="local-check-passport-alternate"')
  expect(coordinator).toContain('fail(activeGate, gateOutcome(activeGate) ?? "unavailable")')
  expect(alternate).toContain('{ ...session, person: { status: "unverified", expiresAt: null }, outcome: null }')
  expect(alternate).not.toMatch(/pending\s*:/)
  expect(coordinator).toContain('person: readyAxis(clock)')
  expect(coordinator).toContain("No identity provider is connected and no credential is created")
  expect(coordinator).toContain("OmniOne CX가 아닌 별도의 공급자 중립 프리뷰")
  expect(coordinator).toContain("OmniOne CXとは別の事業者中立プレビュー")
})

test("FL-005/006 route card preserves the mobile type and touch floors", () => {
  const styles = source("features/ondo/identity-b/action-gate-coordinator-b.module.css")
  expect(styles).toMatch(/\.personRoute small \{[^}]*font-size:\s*12px/)
  expect(styles).toMatch(/\.personRoute em \{[^}]*font-size:\s*12px/)
  expect(styles).toContain(".dialog button { min-width: 44px; min-height: 44px;")
  expect(styles).not.toMatch(/\.personRoute (?:small|em) \{[^}]*font-size:\s*(?:10|11)px/)
})
