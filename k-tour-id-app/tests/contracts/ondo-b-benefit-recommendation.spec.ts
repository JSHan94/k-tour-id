import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
  createStableCommerceBState,
  stableCommerceBenefitPolicyB,
  stableCommerceBReducer,
  stableCommerceQuoteDebitB,
} from "../../features/ondo/commerce-b/stable-commerce-model-b"

const validOffer = {
  venueEligible: true,
  mealOOKRW: 22,
  minimumOOKRW: 22,
  nowMs: Date.parse("2026-08-25T12:00:00+09:00"),
  expiresAtMs: Date.parse("2026-08-25T23:59:59+09:00"),
}

test("B-BENEFIT-001 recommendation is deterministic and keeps eligibility, minimum, and expiry explicit", () => {
  expect(stableCommerceBenefitPolicyB(validOffer)).toEqual({ status: "recommended", minimumOOKRW: 22 })
  expect(stableCommerceBenefitPolicyB({ ...validOffer, venueEligible: false }).status).toBe("ineligible")
  expect(stableCommerceBenefitPolicyB({ ...validOffer, mealOOKRW: 21 }).status).toBe("below_minimum")
  expect(stableCommerceBenefitPolicyB({ ...validOffer, nowMs: validOffer.expiresAtMs + 1 }).status).toBe("expired")
})

test("B-BENEFIT-002 accept or decline never mutates money, receipts, or ledgers before payment", () => {
  const initial = createStableCommerceBState()
  expect(initial.benefitRecommendation).toBe("recommended")
  expect(initial.voucher).toBe("available")
  expect(stableCommerceQuoteDebitB(initial)).toBe(22)

  const accepted = stableCommerceBReducer(initial, { type: "ACCEPT_BENEFIT" })
  expect(accepted).toMatchObject({ benefitRecommendation: "accepted", voucher: "selected", status: "idle", receiptCount: 0, ledger: [] })
  expect(stableCommerceQuoteDebitB(accepted)).toBe(19)

  const declined = stableCommerceBReducer(initial, { type: "DECLINE_BENEFIT" })
  expect(declined).toMatchObject({ benefitRecommendation: "declined", voucher: "available", status: "idle", receiptCount: 0, ledger: [] })
  expect(stableCommerceQuoteDebitB(declined)).toBe(22)
})

test("B-BENEFIT-003 consumer offer exposes recommendation decisions without outcome controls", () => {
  const commerce = readFileSync(resolve(process.cwd(), "features/ondo/commerce-b/id-wallet-commerce-b.tsx"), "utf8")
  for (const testId of ["commerce-benefit-eligibility", "benefit-accept", "benefit-decline"]) {
    expect(commerce).toContain(`data-testid=\"${testId}\"`)
  }
  expect(commerce).toContain("Recommended for this meal")
  expect(commerce).toContain("no AI or provider call")
  expect(commerce).toContain("stableCommerceBenefitPolicyB(")
  expect(commerce).toContain("data-benefit-policy")
  expect(commerce).toContain('data-testid="commerce-benefit-recovery"')
  expect(commerce).not.toContain('data-testid="benefit-outcomes"')
})
