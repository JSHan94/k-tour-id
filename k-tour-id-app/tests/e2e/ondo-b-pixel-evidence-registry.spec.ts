import { expect, test } from "@playwright/test"
import { B_FLOW_IDS } from "../helpers/ondo-b-qa"
import { B_INTEGRATION_FOLLOWUP_BASELINES, B_VISUAL_CASES } from "../helpers/ondo-b-visual-evidence"

const REQUIRED_STATES = [
  "ONBOARDING-VALUE", "ONBOARDING-PERSONAS", "ONBOARDING-PREFERENCES",
  "NATION", "CITY-LIVE", "CITY-LIST", "CITY-FALLBACK", "PLACE-PEEK", "PLACE-DETAIL",
  "GATE-ACCOUNT", "GATE-PERSON-PASSPORT", "GATE-PERSON-CX", "GATE-PERSON-RESIDENCE-UNSUPPORTED", "GATE-AGE", "GATE-PAYMENT", "AFTER19",
  "TABLES-LIST", "TABLE-DETAIL", "CHAT", "CHAT-IMAGE-FAIL", "FEEDBACK", "REPORT",
  "LOCAL-SIGNAL-EMPTY", "LOCAL-SIGNAL-FAIL", "LOCAL-SIGNAL-SUCCESS",
  "CHECKOUT-IDLE", "CHECKOUT-CANCEL", "CHECKOUT-FAIL", "CHECKOUT-RECEIPT", "CHECKOUT-STAMP",
  "MY", "PROFILE", "TRUST-FOUR-AXES", "LABS", "LABS-TRAIT-FAIL", "LABS-BRIDGE-FAIL", "LABS-BRIDGE-SUCCESS",
] as const

test("B-EVIDENCE-REGISTRY covers FL-001..018 and every required layout family", () => {
  const coveredFlows = new Set(B_VISUAL_CASES.flatMap((item) => item.flows))
  const coveredStates = new Set(B_VISUAL_CASES.map((item) => item.state))
  expect([...B_FLOW_IDS].filter((flow) => !coveredFlows.has(flow))).toEqual([])
  expect(REQUIRED_STATES.filter((state) => !coveredStates.has(state))).toEqual([])
  expect(new Set(B_VISUAL_CASES.map((item) => item.id)).size).toBe(B_VISUAL_CASES.length)
  expect(B_VISUAL_CASES.every((item) => item.locale === "en" || item.locale === "ko")).toBe(true)
})

test("B-EVIDENCE-FOLLOWUP records the two implemented final-integration captures", () => {
  expect(B_INTEGRATION_FOLLOWUP_BASELINES).toHaveLength(2)
  expect(B_INTEGRATION_FOLLOWUP_BASELINES.map((item) => item.flow)).toEqual(["FL-002", "FL-011"])
  expect(B_INTEGRATION_FOLLOWUP_BASELINES.every((item) => item.selector.length > 20 && item.reason.includes("e154b2d"))).toBe(true)
})
