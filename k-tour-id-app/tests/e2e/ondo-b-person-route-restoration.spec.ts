import { expect, test, type Page } from "@playwright/test"
import { installBRuntimeGuard, openCanonicalVenue, prepareBPage, seedB } from "../helpers/ondo-b-qa"

const ACTION_SESSION_KEY = "ondo-b.action-gates.v1"
type ResidenceAvailability = "supported" | "unsupported" | "outage"

async function openSignalPersonGate(
  page: Page,
  persona: "travelling" | "preparing" | "local_contributor",
  locale: "en" | "ko" | "ja",
  note: string,
  { review = false, residenceCard }: { review?: boolean; residenceCard?: ResidenceAvailability } = {},
) {
  await seedB(page, { locale, session: { persona, account: "ACC-ACTIVE", person: "PER-UNVERIFIED" } })
  await openCanonicalVenue(page, { query: review ? "qa=1" : "" })
  if (residenceCard) {
    await page.evaluate((availability) => {
      const qa = window as Window & { __ONDO_B_QA__?: { residenceCard?: ResidenceAvailability } }
      qa.__ONDO_B_QA__ = { ...(qa.__ONDO_B_QA__ ?? {}), residenceCard: availability }
    }, residenceCard)
  }
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

async function expectSafeViewportTarget(page: Page, testId: string) {
  const target = page.getByTestId(testId)
  await expect(target).toBeInViewport()
  const [box, viewport] = await Promise.all([target.boundingBox(), page.evaluate(() => ({ width: innerWidth, height: innerHeight }))])
  expect(box, `${testId} has measurable geometry`).not.toBeNull()
  expect(box!.height, `${testId} keeps a 44px target`).toBeGreaterThanOrEqual(44)
  expect(box!.x, `${testId} stays inside the left safe edge`).toBeGreaterThanOrEqual(0)
  expect(box!.y, `${testId} stays inside the top safe edge`).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width, `${testId} stays inside the right safe edge`).toBeLessThanOrEqual(viewport.width)
  expect(box!.y + box!.height, `${testId} stays inside the bottom safe edge`).toBeLessThanOrEqual(viewport.height)
  return box!
}

test.beforeEach(async ({ page }, testInfo) => {
  testInfo.setTimeout(90_000)
  installBRuntimeGuard(page)
  await prepareBPage(page)
})

for (const locale of ["en", "ko", "ja"] as const) {
  test(`short landscape ${locale.toUpperCase()} Person gate exposes a keyboard route and both safe footer decisions`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 844, height: 390 })
    const note = locale === "en" ? "Keep this exact landscape draft." : locale === "ko" ? "이 가로 화면 초안을 그대로 유지해요." : "この横画面の下書きをそのまま保持します。"
    const { draft, gate } = await openSignalPersonGate(page, "travelling", locale, note, { review: true })
    const dialog = page.getByTestId("ondo-b-local-check-walkthrough")
    const mobileRoute = gate.getByTestId("person-route-choice-mobile_id_cx")

    await expect(gate).toHaveAttribute("data-execution-mode", "review")
    await expect(gate.getByTestId("person-review-scope")).toBeVisible()
    await expect(mobileRoute).toBeFocused()
    await expect(gate).toHaveAttribute("data-person-route", "unselected")
    await expect(gate.getByTestId("local-check-boundary-continue")).toHaveCount(0)
    for (const route of ["mobile_id_cx", "mobile_residence_card", "passport_ekyc"]) {
      await expectSafeViewportTarget(page, `person-route-choice-${route}`)
    }
    const initialCancel = await expectSafeViewportTarget(page, "action-gate-cancel")
    const routeBox = await gate.getByTestId("person-route-choices").boundingBox()
    expect(routeBox!.y + routeBox!.height, "initial route choices are not hidden behind the sticky footer").toBeLessThanOrEqual(initialCancel.y)
    await expect(gate.getByTestId("action-gate-return-context")).toBeInViewport()
    await expect(dialog.getByTestId("person-route-choices")).toBeInViewport()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(844)

    await page.keyboard.press("Shift+Tab")
    await expect(gate.getByTestId("action-gate-return-context").locator("summary")).toBeFocused()
    await mobileRoute.focus()
    await page.keyboard.press("Enter")
    await expect(mobileRoute).toHaveAttribute("aria-pressed", "true")
    await expect(gate).toHaveAttribute("data-person-route", "mobile_id_cx")

    const forward = await expectSafeViewportTarget(page, "local-check-boundary-continue")
    const selectedCancel = await expectSafeViewportTarget(page, "action-gate-cancel")
    expect(Math.abs(forward.y - selectedCancel.y)).toBeLessThanOrEqual(1)
    const disclosure = gate.getByTestId("person-provider-disclosure")
    const disclosureSummary = disclosure.locator("summary")
    await disclosureSummary.scrollIntoViewIfNeeded()
    await expect(disclosureSummary).toBeInViewport({ ratio: 1 })
    const disclosureBox = await disclosureSummary.boundingBox()
    expect(disclosureBox).not.toBeNull()
    expect(disclosureBox!.height).toBeGreaterThanOrEqual(44)
    expect(disclosureBox!.y + disclosureBox!.height).toBeLessThanOrEqual(forward.y)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(844)
    await expect(gate.getByTestId("consent-minimum")).toBeVisible()
    await expect(gate.getByTestId("consent-retention")).toBeVisible()
    const screenshot = testInfo.outputPath(`person-gate-${locale}-844x390.png`)
    await page.screenshot({ path: screenshot, animations: "disabled" })
    await testInfo.attach(`Person gate ${locale} 844x390`, { path: screenshot, contentType: "image/png" })

    await disclosureSummary.click()
    await expect(disclosure.getByTestId("consent-requester")).toBeVisible()
    await expect(disclosure.getByTestId("consent-purpose")).toBeVisible()
    await expectSafeViewportTarget(page, "local-check-boundary-continue")
    await expectSafeViewportTarget(page, "action-gate-cancel")
    await gate.getByTestId("local-check-boundary-continue").focus()
    await expect(gate.getByTestId("local-check-boundary-continue")).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(gate).toBeHidden()
    await expect(draft).toBeVisible()
    await expect(draft.locator("textarea")).toHaveValue(note)
  })
}

test("FL-005 discovery intent does not choose a route; explicit review Mobile ID survives failure and retry", async ({ page }) => {
  const note = "카운터에서 먼저 주문해요."
  const { draft, gate } = await openSignalPersonGate(page, "local_contributor", "ko", note, { review: true })
  await expect(gate).toHaveAttribute("data-execution-mode", "review")
  await expect(gate.getByTestId("person-review-scope")).toBeVisible()
  await expect(gate).toHaveAttribute("data-person-route", "unselected")
  await expect(gate.getByTestId("local-check-boundary-continue")).toHaveCount(0)
  await expect(gate.getByTestId("person-route-choice-mobile_id_cx")).toBeFocused()
  await gate.getByTestId("person-route-choice-mobile_id_cx").click()
  await expect(gate).toHaveAttribute("data-person-route", "mobile_id_cx")
  await expect(gate.getByTestId("person-route-choice-mobile_id_cx")).toHaveAttribute("aria-pressed", "true")
  await expect(gate.getByTestId("person-decision-truth")).toBeVisible()
  await expect(gate.getByTestId("local-check-boundary-continue")).toBeInViewport()
  const beforeFailure = await pendingEnvelope(page)
  expect(await personRouteSelection(page)).toEqual({ tokenId: beforeFailure?.tokenId, route: "mobile_id_cx" })

  await injectPersonFailure(page)
  await gate.getByTestId("local-check-boundary-continue").click()
  await expect(gate.getByTestId("local-check-result")).toHaveAttribute("data-result", "failure")
  expect(await pendingEnvelope(page)).toEqual(beforeFailure)
  expect((await personRouteSelection(page))?.route).toBe("mobile_id_cx")

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

test("FL-006 explicit Residence outage stays unavailable before an explicit Passport alternative", async ({ page }) => {
  const note = "A resident ordering note stays exact."
  const { draft, gate } = await openSignalPersonGate(page, "preparing", "en", note, { review: true, residenceCard: "outage" })
  await expect(gate).toHaveAttribute("data-execution-mode", "review")
  await expect(gate.getByTestId("person-review-scope")).toBeVisible()
  await expect(gate).toHaveAttribute("data-person-route", "unselected")
  await gate.getByTestId("person-route-choice-mobile_residence_card").click()
  await expect(gate).toHaveAttribute("data-person-route", "mobile_residence_card")
  await expect(gate.getByTestId("person-route-choice-mobile_residence_card")).toHaveAttribute("aria-pressed", "true")
  await expect(gate.getByTestId("person-decision-truth")).toBeVisible()
  const beforeUnavailable = await pendingEnvelope(page)

  await gate.getByTestId("local-check-boundary-continue").click()
  await expect(gate.getByTestId("local-check-result")).toHaveAttribute("data-result", "unavailable")
  expect(await pendingEnvelope(page)).toEqual(beforeUnavailable)

  await gate.getByTestId("local-check-passport-alternate").click()
  await expect(gate).toHaveAttribute("data-person-route", "passport_ekyc")
  expect(await pendingEnvelope(page)).toEqual(beforeUnavailable)
  expect((await personRouteSelection(page))?.route).toBe("passport_ekyc")

  await gate.getByTestId("person-provider-disclosure").locator("summary").click()
  await expect(gate.getByTestId("person-provider-disclosure")).toContainText("No identity provider is connected")
  await expect(gate.getByTestId("person-provider-disclosure")).not.toContainText("OmniOne CX")

  await gate.getByTestId("local-check-boundary-continue").click()
  await expect(gate).toBeHidden()
  await expect(draft.locator("textarea")).toHaveValue(note)
  await expect.poll(() => page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "{}").person?.status, ACTION_SESSION_KEY)).toBe("eligible")
  expect((await personRouteSelection(page))?.route).toBe("passport_ekyc")
  await draft.getByTestId("local-signal-post").click()
  await expect(draft).toBeHidden()
  await expect.poll(() => personRouteSelection(page)).toBeNull()
})

for (const [locale, title, body] of [
  ["en", "This Residence Card is not supported", "Use Passport instead. Your original action is unchanged."],
  ["ko", "이 외국인등록증 방식은 지원하지 않아요", "여권으로 계속할 수 있어요. 하던 작업은 그대로입니다."],
  ["ja", "この在留カード方式には対応していません", "パスポートで続けられます。元の操作はそのままです。"],
] as const) {
  test(`FL-006 ${locale.toUpperCase()} explicit unsupported is distinct, non-authorizing and keeps the exact Passport handoff`, async ({ page }) => {
    const note = `unsupported-${locale}-draft`
    const { draft, gate } = await openSignalPersonGate(page, "preparing", locale, note, { review: true, residenceCard: "unsupported" })
    const residence = gate.getByTestId("person-route-choice-mobile_residence_card")
    await expect(residence).toHaveAttribute("data-availability", "unsupported")
    const beforeUnsupported = await pendingEnvelope(page)

    await residence.click()
    await gate.getByTestId("local-check-boundary-continue").click()
    await expect(gate).toHaveAttribute("data-gate-view", "unsupported")
    await expect(gate.getByTestId("local-check-result")).toHaveAttribute("data-result", "unsupported")
    await expect(gate.getByRole("heading", { name: title, exact: true })).toBeVisible()
    await expect(gate.getByText(body, { exact: true })).toBeVisible()
    await expect(gate.getByTestId("person-route-mobile_residence_card")).toHaveAttribute("data-route-status", "unsupported")
    await expect.poll(() => page.evaluate((key) => {
      const value = JSON.parse(sessionStorage.getItem(key) ?? "{}")
      return { person: value.person, payment: value.payment }
    }, ACTION_SESSION_KEY)).toEqual({
      person: { status: "unsupported", expiresAt: null },
      payment: { status: "unverified", expiresAt: null },
    })
    expect(await pendingEnvelope(page)).toEqual(beforeUnsupported)
    await expect(draft.locator("textarea")).toHaveValue(note)

    await gate.getByTestId("local-check-passport-alternate").click()
    await expect(gate).toHaveAttribute("data-person-route", "passport_ekyc")
    expect(await pendingEnvelope(page)).toEqual(beforeUnsupported)
    await gate.getByTestId("action-gate-cancel").click()
    await expect(gate).toBeHidden()
    await expect(draft.locator("textarea")).toHaveValue(note)
  })
}

test("FL-005 Japanese Passport copy stays truthful and unavailable return clears its token-bound selection", async ({ page }) => {
  const note = "注文はカウンターで先に行います。"
  const { draft, gate } = await openSignalPersonGate(page, "travelling", "ja", note)
  await expect(gate).toHaveAttribute("data-person-route", "unselected")
  await gate.getByTestId("person-route-choice-passport_ekyc").click()
  await expect(gate).toHaveAttribute("data-person-route", "passport_ekyc")
  await expect(gate).toHaveAttribute("data-gate-view", "unavailable")
  await expect(gate.getByTestId("local-check-result")).toHaveAttribute("data-result", "unavailable")
  await gate.getByTestId("person-provider-disclosure").locator("summary").click()
  await expect(gate.getByTestId("person-provider-disclosure")).toContainText("本人確認事業者には接続されていません")
  await expect(gate.getByTestId("person-provider-disclosure")).not.toContainText("OmniOne CX")
  await gate.getByTestId("action-gate-cancel").click()
  await expect(gate).toBeHidden()
  await expect(draft.locator("textarea")).toHaveValue(note)
  await expect(draft).toHaveAttribute("data-gate-return", "unavailable")
  expect(await personRouteSelection(page)).toBeNull()
})
