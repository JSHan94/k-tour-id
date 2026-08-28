import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"

const APP_ROOT = process.cwd()

function source(path: string) {
  return readFileSync(resolve(APP_ROOT, path), "utf8")
}

const mapSource = source("features/ondo/map/map-entry-b.tsx")
const placeSource = source("features/ondo/place/canonical-place-overlay.tsx")
const tableSource = source("features/ondo/connect/tables-entry-b.tsx")
const after19Source = source("features/ondo/identity-b/action-gate-coordinator-b.tsx")
const actionGateContractSource = source("features/ondo/identity-b/action-gate-contract-b.ts")
const ageModelSource = source("features/ondo/after19/after19-global-b-model.ts")
const localSignalSource = source("features/ondo/local-signal-b/local-signal-layer-b.tsx")
const travelerSource = source("features/ondo/identity-b/traveler-id-entry-b.tsx")
const commerceSource = source("features/ondo/commerce-b/id-wallet-commerce-b.tsx")

test("PREMIUM-001 Pulse is a decision signal, never a temperature", () => {
  expect(mapSource).not.toContain("°")
  expect(placeSource).not.toContain("°")
  expect(mapSource).toContain("ondo-pulse")
})

test("PREMIUM-002 a place exposes the natural travel decision loop", () => {
  for (const action of [
    "canonical-venue-primary-directions",
    "canonical-venue-save",
    "canonical-place-table",
    "canonical-local-signal-open",
    "canonical-meal-benefit-open",
  ]) expect(placeSource, `missing consumer action ${action}`).toContain(`data-testid=\"${action}\"`)
  expect(placeSource).not.toContain("canonical-demo-meal-offer-open")
})

test("PREMIUM-003 Tables and Local Signal preserve the full PRD action loop", () => {
  for (const action of ["table-chat-image", "table-check-in", "table-feedback-submit"]) {
    expect(tableSource, `missing Table action ${action}`).toContain(`data-testid=\"${action}\"`)
  }
  for (const action of ["local-signal-photo-input", "local-signal-photo-replace", "local-signal-photo-remove"]) {
    expect(localSignalSource, `missing Local Signal photo action ${action}`).toContain(`data-testid=\"${action}\"`)
  }
})

test("PREMIUM-004 normal eligibility UI cannot expose a QA outcome picker", () => {
  for (const hiddenControl of ["gate-failure-choice", "gate-unsupported-choice", "gate-expired-choice"]) {
    expect(after19Source, `${hiddenControl} must be fixture-driven, not a consumer control`).not.toContain(`data-testid=\"${hiddenControl}\"`)
  }
  expect(after19Source).toContain('if (gate === "age" && qa?.after19)')
  expect(after19Source).toContain("after19-start")
  expect(after19Source).toContain("action-gate-cancel")
  expect(after19Source).toContain("Confirm 19+ for this Table")
  expect(after19Source).toContain("Only an eligibility result and expiry are kept in this tab")
  expect(after19Source).toContain('data-return-table={pending.cta === "JOIN_TABLE" ? pending.tableId : "none"}')
  expect(actionGateContractSource).toContain('if (cta === "JOIN_TABLE") return ["account", "age"]')
  expect(actionGateContractSource).toContain("consumePendingBActionAtMutation")
  expect(ageModelSource).toContain("recordGlobalAfter19AgeEligibilityB")
  expect(`${after19Source}\n${ageModelSource}`).not.toMatch(/dateOfBirth|passportNumber|credentialPayload|providerResponse/i)
})

test("PREMIUM-005 Travel Pass and Wallet are a consumer dashboard, not an operator console", () => {
  for (const surface of ["travel-pass-status", "wallet-balance", "wallet-benefit", "wallet-activity"]) {
    expect(`${travelerSource}\n${commerceSource}`, `missing dashboard surface ${surface}`).toContain(`data-testid=\"${surface}\"`)
  }
  for (const hiddenControl of [
    "wallet-link-ready",
    "wallet-link-failure",
    "payment-outcome-success",
    "payment-outcome-failure",
    "payment-outcome-insufficient",
    "commerce-reset",
    "commerce-holder-ledger",
    "commerce-merchant-ledger",
    "commerce-settlement-mirror",
  ]) expect(commerceSource, `${hiddenControl} belongs in fixture/model evidence`).not.toContain(`data-testid=\"${hiddenControl}\"`)
})

test("PREMIUM-006 consumer copy excludes internal scenario-runner language", () => {
  const visibleProductSource = [placeSource, tableSource, after19Source, localSignalSource, travelerSource, commerceSource].join("\n")
  expect(visibleProductSource).not.toMatch(/Choose an example outcome|Show failure example|Return wallet ready|Choose the payment return|inspect both sides|settlement mirror/i)
})
