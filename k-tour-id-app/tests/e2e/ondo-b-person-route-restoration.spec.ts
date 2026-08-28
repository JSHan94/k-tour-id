import { expect, test, type Page } from "@playwright/test"
import { installBRuntimeGuard, openCanonicalVenue, prepareBPage, seedB } from "../helpers/ondo-b-qa"

const ACTION_SESSION_KEY = "ondo-b.action-gates.v1"

async function openSignalPersonGate(page: Page, persona: "travelling" | "preparing" | "local_contributor", locale: "en" | "ko" | "ja", note: string) {
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

async function personRouteSelection(page: Page) {
  return page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "{}").personRoute as { tokenId: string; route: string } | null, ACTION_SESSION_KEY)
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

test("FL-005 discovery intent does not choose a route; explicit Mobile ID survives failure, reload, and retry", async ({ page }) => {
  const note = "카운터에서 먼저 주문해요."
  const { draft, gate } = await openSignalPersonGate(page, "local_contributor", "ko", note)
  await expect(gate).toHaveAttribute("data-person-route", "unselected")
  await expect(gate.getByTestId("local-check-boundary-continue")).toHaveCount(0)
  await expect(page.getByTestId("ondo-b-local-check-walkthrough")).toBeFocused()
  await gate.getByTestId("person-route-choice-mobile_id_cx").click()
  await expect(gate).toHaveAttribute("data-person-route", "mobile_id_cx")
  await expect(gate.getByTestId("person-route-mobile_id_cx")).toContainText("OmniOne CX")
  await expect(gate.getByTestId("local-check-boundary-continue")).toBeInViewport()
  const beforeFailure = await pendingEnvelope(page)
  expect(await personRouteSelection(page)).toEqual({ tokenId: beforeFailure?.tokenId, route: "mobile_id_cx" })

  await injectPersonFailure(page)
  await gate.getByTestId("local-check-boundary-continue").click()
  await expect(gate.getByTestId("local-check-result")).toHaveAttribute("data-result", "failure")
  expect(await pendingEnvelope(page)).toEqual(beforeFailure)
  expect((await personRouteSelection(page))?.route).toBe("mobile_id_cx")

  await page.reload()
  await expect(gate).toHaveAttribute("data-person-route", "mobile_id_cx")
  await expect(gate.getByTestId("local-check-result")).toHaveAttribute("data-result", "failure")

  await gate.getByTestId("action-gate-retry").click()
  await expect(gate).toHaveAttribute("data-person-route", "mobile_id_cx")
  expect(await pendingEnvelope(page)).toEqual(beforeFailure)
  await gate.getByTestId("local-check-boundary-continue").click()

  await expect(gate).toBeHidden()
  await expect(draft.locator("textarea")).toHaveValue(note)
  await expect.poll(() => page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "{}").person?.status, ACTION_SESSION_KEY)).toBe("eligible")
  expect((await personRouteSelection(page))?.route).toBe("mobile_id_cx")
  await draft.getByTestId("local-signal-post").click()
  await expect(draft).toBeHidden()
  await expect.poll(() => personRouteSelection(page)).toBeNull()
})

test("FL-006 explicit registered-resident route exposes unavailable before a persisted Passport alternative", async ({ page }) => {
  const note = "A resident ordering note stays exact."
  const { draft, gate } = await openSignalPersonGate(page, "preparing", "en", note)
  await expect(gate).toHaveAttribute("data-person-route", "unselected")
  await gate.getByTestId("person-route-choice-mobile_residence_card").click()
  await expect(gate).toHaveAttribute("data-person-route", "mobile_residence_card")
  await expect(gate.getByTestId("person-route-mobile_residence_card")).toContainText("Mobile Residence Card")
  const beforeUnavailable = await pendingEnvelope(page)

  await gate.getByTestId("local-check-boundary-continue").click()
  await expect(gate.getByTestId("local-check-result")).toHaveAttribute("data-result", "unavailable")
  expect(await pendingEnvelope(page)).toEqual(beforeUnavailable)

  await gate.getByTestId("local-check-passport-alternate").click()
  await expect(gate).toHaveAttribute("data-person-route", "passport_ekyc")
  expect(await pendingEnvelope(page)).toEqual(beforeUnavailable)
  expect((await personRouteSelection(page))?.route).toBe("passport_ekyc")

  await page.reload()
  await expect(gate).toHaveAttribute("data-person-route", "passport_ekyc")
  await gate.getByTestId("person-provider-disclosure").locator("summary").click()
  await expect(gate.getByTestId("person-provider-disclosure")).toContainText("not OmniOne CX")

  await gate.getByTestId("local-check-boundary-continue").click()
  await expect(gate).toBeHidden()
  await expect(draft.locator("textarea")).toHaveValue(note)
  await expect.poll(() => page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "{}").person?.status, ACTION_SESSION_KEY)).toBe("eligible")
  expect((await personRouteSelection(page))?.route).toBe("passport_ekyc")
  await draft.getByTestId("local-signal-post").click()
  await expect(draft).toBeHidden()
  await expect.poll(() => personRouteSelection(page)).toBeNull()
})

test("FL-005 Japanese Passport copy stays truthful and cancel clears its token-bound selection", async ({ page }) => {
  const note = "注文はカウンターで先に行います。"
  const { draft, gate } = await openSignalPersonGate(page, "travelling", "ja", note)
  await expect(gate).toHaveAttribute("data-person-route", "unselected")
  await gate.getByTestId("person-route-choice-passport_ekyc").click()
  await expect(gate).toHaveAttribute("data-person-route", "passport_ekyc")
  await gate.getByTestId("person-provider-disclosure").locator("summary").click()
  await expect(gate.getByTestId("person-provider-disclosure")).toContainText("OmniOne CXとは別")
  await gate.getByTestId("action-gate-cancel").click()
  await expect(gate).toBeHidden()
  await expect(draft.locator("textarea")).toHaveValue(note)
  await expect(draft).toHaveAttribute("data-gate-return", "cancel")
  expect(await personRouteSelection(page)).toBeNull()
})
