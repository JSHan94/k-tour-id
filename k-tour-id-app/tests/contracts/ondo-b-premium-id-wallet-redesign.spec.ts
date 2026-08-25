import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

test("B-PREMIUM-ID-001 Travel Pass exposes four independent readiness states", () => {
  const identity = source("features/ondo/identity-b/traveler-id-entry-b.tsx")

  for (const testId of [
    "traveler-id-account",
    "traveler-id-person",
    "traveler-id-age",
    "traveler-id-payment",
  ]) {
    expect(identity).toContain(`data-testid=\"${testId}\"`)
  }
  expect(identity).toContain("Travel Pass")
  expect(identity).toContain("Person")
  expect(identity).toContain("19+")
  expect(identity).toContain("Payment")
  expect(identity).toContain("Person does not prove 19+")
  expect(identity).toContain("19+ does not prove identity")
})

test("B-PREMIUM-ID-002 eligibility has a consumer flow and DOM-free QA injection", () => {
  const check = source("features/ondo/identity-b/local-check-walkthrough-b.tsx")

  expect(check).toContain('type Phase = "consent" | "processing" | "result"')
  expect(check).toContain("Verify and continue")
  expect(check).toContain("__ONDO_B_QA__")
  expect(check).not.toContain('data-testid="local-check-outcome-success"')
  expect(check).not.toContain('data-testid="local-check-outcome-failure"')
  expect(check).not.toContain('data-testid="local-check-outcome-unavailable"')
  expect(check).not.toContain('data-testid="local-check-outcome-expired"')
})

test("B-PREMIUM-WALLET-001 wallet is a consumer dashboard, not a merchant scenario runner", () => {
  const commerce = source("features/ondo/commerce-b/id-wallet-commerce-b.tsx")

  for (const testId of [
    "wallet-balance",
    "wallet-benefit",
    "wallet-activity",
    "wallet-privacy",
  ]) {
    expect(commerce).toContain(`data-testid=\"${testId}\"`)
  }
  expect(commerce).toContain("OOKRW Test")
  expect(commerce).toContain("Available benefits")
  expect(commerce).toContain("Recent activity")
  expect(commerce).toContain("__ONDO_B_QA__")
  expect(commerce).not.toContain('data-testid="wallet-link-ready"')
  expect(commerce).not.toContain('data-testid="wallet-link-failed"')
  expect(commerce).not.toContain('data-testid="payment-outcomes"')
  expect(commerce).not.toContain('data-testid="payment-ledgers"')
  expect(commerce).not.toContain('data-testid="commerce-outcomes"')
  expect(commerce).not.toContain('data-testid="commerce-ledgers"')
  expect(commerce).not.toContain('data-testid="commerce-reconciliation"')
  for (const retiredEvidence of [
    "wallet-link-ready",
    "wallet-link-failure",
    "payment-outcome-failure",
    "payment-outcome-insufficient",
    "holder-settlement-mirror",
    "merchant-settlement-mirror",
  ]) expect(commerce).not.toContain(`\"${retiredEvidence}\"`)
})

test("B-PREMIUM-PAY-001 contextual payment keeps model outcomes but hides them from normal UI", () => {
  const commerce = source("features/ondo/commerce-b/id-wallet-commerce-b.tsx")
  const model = source("features/ondo/commerce-b/stable-commerce-model-b.ts")

  expect(commerce).toContain("__ONDO_B_QA__")
  expect(commerce).toContain("Pay with OOKRW Test")
  expect(commerce).toContain("Refund")
  expect(commerce).toContain("data-return-to")
  expect(model).toContain('type StableCommerceBOutcome = "success" | "failure" | "insufficient"')
  expect(model).toContain('case "CONFIRM"')
  expect(model).toContain('case "PAYMENT_RETURN"')
  expect(model).toContain('case "REFUND"')
})
