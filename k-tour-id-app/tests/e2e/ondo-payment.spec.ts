import { expect, test } from "@playwright/test"
import { canIncrementStamp } from "../../features/ondo/contracts/commerce"

test("E2E-FL-004 payment receipt cannot become visit evidence", () => {
  expect(canIncrementStamp({ scenarioId: "SCN-005-CHECKOUT-LABS", evidenceId: "receipt:seoul-seongsu-gukbap", acceptedEvidenceIds: [] })).toBeFalsy()
  expect(canIncrementStamp({ scenarioId: "SCN-006-STAMP-MILESTONE", evidenceId: "visit-proof:seoul-seongsu-gukbap", acceptedEvidenceIds: [] })).toBeTruthy()
  expect(canIncrementStamp({ scenarioId: "SCN-006-STAMP-MILESTONE", evidenceId: "visit-proof:seoul-seongsu-gukbap", acceptedEvidenceIds: ["visit-proof:seoul-seongsu-gukbap"] })).toBeFalsy()
})
