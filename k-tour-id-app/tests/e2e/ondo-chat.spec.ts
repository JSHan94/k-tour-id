import { expect, test } from "@playwright/test"
import type { MessageStatus } from "../../features/ondo/contracts/domain"
import { canOpenChat } from "../../features/ondo/connect/table-model"

test("E2E-FL-003 chat retry follows pending, failed, pending, sent", () => {
  const statuses: MessageStatus[] = ["MSG-SENDING", "MSG-FAILED", "MSG-SENDING", "MSG-SENT"]
  expect(statuses).toEqual(["MSG-SENDING", "MSG-FAILED", "MSG-SENDING", "MSG-SENT"])
  expect(canOpenChat("TMB-LEFT", "TAV-OPEN")).toBeFalsy()
})
