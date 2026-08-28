import { expect, test, type Page } from "@playwright/test"
import { installBRuntimeGuard, openCanonicalVenue, prepareBPage, seedB } from "../helpers/ondo-b-qa"

const ACTION_SESSION_KEY = "ondo-b.action-gates.v1"

async function openSignalPersonGate(page: Page, persona: "korean_local" | "long_term_resident", locale: "en" | "ko" | "ja", note: string) {
  await seedB(page, { locale, session: { persona, account: "ACC-ACTIVE", person: "PER-UNVERIFIED" } })
  await openCanonicalVenue(page)
  await page.getByTestId("canonical-local-signal-open").click()
  const draft = page.getByTestId("local-signal-draft")
  await draft.locator("fieldset button").first().click()
  await draft.locator("textarea").fill(note)
  await draft.getByTestId("local-signal-person-check").click({ force: true })
  const gate = page.getByTestId("ondo-b-action-gate")
  await expect(gate).toHaveAttribute("data-active-gate", "person")
  return { draft, gate }
}

async function pendingEnvelope(page: Page) {
  return page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "{}").pending as Record<string, unknown> | null, ACTION_SESSION_KEY)
}

async function injectPersonFailure(page: Page) {
  await page.evaluate(() => {
    const qa = window as Window & { __ONDO_B_QA__?: { actionGate?: { person?: "failure" } } }
    qa.__ONDO_B_QA__ = { actionGate: { person: "failure" } }
  })
}

test.beforeEach(async ({ page }, testInfo) => {
  testInfo.setTimeout(90_000)
  installBRuntimeGuard(page)
  await prepareBPage(page)
})

test("FL-005 Korean Person stays in the existing gate through Mobile ID failure, retry, and exact-draft return", async ({ page }) => {
  const note = "카운터에서 먼저 주문해요."
  const { draft, gate } = await openSignalPersonGate(page, "korean_local", "ko", note)
  await expect(gate).toHaveAttribute("data-person-route", "mobile_id_cx")
  await expect(gate.getByTestId("person-route-mobile_id_cx")).toContainText("OmniOne CX")
  const beforeFailure = await pendingEnvelope(page)

  await injectPersonFailure(page)
  await gate.getByTestId("local-check-boundary-continue").click()
  await expect(gate.getByTestId("local-check-result")).toHaveAttribute("data-result", "failure")
  expect(await pendingEnvelope(page)).toEqual(beforeFailure)

  await gate.getByTestId("action-gate-retry").click()
  await expect(gate).toHaveAttribute("data-person-route", "mobile_id_cx")
  expect(await pendingEnvelope(page)).toEqual(beforeFailure)
  await gate.getByTestId("local-check-boundary-continue").click()

  await expect(gate).toBeHidden()
  await expect(draft.locator("textarea")).toHaveValue(note)
  await expect.poll(() => page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "{}").person?.status, ACTION_SESSION_KEY)).toBe("eligible")
})

test("FL-006 resident Person exposes unavailable Residence Card before the explicit Passport alternative", async ({ page }) => {
  const note = "A resident ordering note stays exact."
  const { draft, gate } = await openSignalPersonGate(page, "long_term_resident", "en", note)
  await expect(gate).toHaveAttribute("data-person-route", "mobile_residence_card")
  await expect(gate.getByTestId("person-route-mobile_residence_card")).toContainText("Mobile Residence Card")
  const beforeUnavailable = await pendingEnvelope(page)

  await gate.getByTestId("local-check-boundary-continue").click()
  await expect(gate.getByTestId("local-check-result")).toHaveAttribute("data-result", "unavailable")
  expect(await pendingEnvelope(page)).toEqual(beforeUnavailable)

  await gate.getByTestId("local-check-passport-alternate").click()
  await expect(gate).toHaveAttribute("data-person-route", "passport_ekyc")
  await expect(gate.getByTestId("person-route-passport_ekyc")).toContainText("not OmniOne CX")
  expect(await pendingEnvelope(page)).toEqual(beforeUnavailable)

  await gate.getByTestId("local-check-boundary-continue").click()
  await expect(gate).toBeHidden()
  await expect(draft.locator("textarea")).toHaveValue(note)
  await expect.poll(() => page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "{}").person?.status, ACTION_SESSION_KEY)).toBe("eligible")
})

test("FL-005 Japanese route copy stays truthful and cancel restores its exact Local Signal draft", async ({ page }) => {
  const note = "注文はカウンターで先に行います。"
  const { draft, gate } = await openSignalPersonGate(page, "korean_local", "ja", note)
  await expect(gate).toHaveAttribute("data-person-route", "mobile_id_cx")
  await expect(gate.getByTestId("person-route-mobile_id_cx")).toContainText("実際の要求")
  await gate.getByTestId("action-gate-cancel").click()
  await expect(gate).toBeHidden()
  await expect(draft.locator("textarea")).toHaveValue(note)
  await expect(draft).toHaveAttribute("data-gate-return", "cancel")
})
