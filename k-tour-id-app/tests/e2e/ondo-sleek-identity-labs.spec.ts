import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import {
  gotoB,
  seedB,
} from "../helpers/ondo-b-qa"

const READY_SESSION = {
  account: "ACC-ACTIVE",
  person: "PER-VERIFIED",
  age: "AGE-VERIFIED",
  ageExpiresAt: "2026-08-21T20:00:00+09:00",
  stamps: 10,
}

async function seedAcknowledgedLabs(page: Page, query = "", paymentKyc = "PKY-NOT-STARTED") {
  await seedB(page, { session: { ...READY_SESSION, paymentKyc }, clearFeatures: false })
  await page.addInitScript(() => {
    sessionStorage.setItem("ondo.labs.v2", JSON.stringify({
      acknowledged: true,
      wallet: "WAL-READY",
      bridge: "BRG-IDLE",
      phase: "none",
      mint: "NFT-ELIGIBLE",
      consent: false,
      quoteExpiresAt: null,
      traitStates: {},
    }))
  })
  await gotoB(page, query)
}

async function expectNoSeriousAxe(page: Page, selector: string) {
  const result = await new AxeBuilder({ page })
    .include(selector)
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(result.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical"))
    .toEqual([])
}

async function activateTab(page: Page, name: "My Korea" | "ID", targetTestId: string) {
  const tab = page.getByRole("button", { name, exact: true })
  await expect.poll(async () => {
    await tab.click({ force: true, timeout: 1_000 }).catch(() => undefined)
    return page.getByTestId(targetTestId).isVisible().catch(() => false)
  }, { timeout: 30_000 }).toBe(true)
}

async function openCheckout(page: Page, query = "") {
  const suffix = query ? `?${query.replace(/^\?/, "")}` : ""
  await page.goto(`/ondo-b${suffix}`, { waitUntil: "domcontentloaded" })
  await expect(page.getByTestId("ondo-b-root")).toBeVisible({ timeout: 30_000 })
  const seoul = page.locator("[data-testid='ondo-b-nation'] [data-city='seoul']")
  await expect.poll(async () => {
    await seoul.click({ force: true, timeout: 1_000 }).catch(() => undefined)
    return page.getByRole("button", { name: "List", exact: true }).count()
  }, { timeout: 30_000 }).toBe(1)
  await page.getByRole("button", { name: "List", exact: true }).click()
  await expect(page.getByTestId("ondo-b-venue-list")).toBeVisible()
  await page.getByRole("search").getByRole("textbox").fill("로바")
  await page.getByText("로바", { exact: true }).locator("xpath=ancestor::button").click({ force: true })
  await expect(page.getByTestId("canonical-place-peek")).toBeVisible({ timeout: 30_000 })
  await page.getByTestId("canonical-place-details").click()
  const place = page.getByTestId("canonical-place-overlay")
  await expect(place).toBeVisible({ timeout: 20_000 })
  await expect(place.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready", { timeout: 20_000 })
  await page.getByTestId("canonical-venue-checkout").click()
  await expect(page.getByTestId("checkout-overlay")).toBeVisible()
}

test.beforeEach(async ({ page }, testInfo) => {
  testInfo.setTimeout(60_000)
  page.setDefaultTimeout(20_000)
  page.setDefaultNavigationTimeout(60_000)
})

test("SLK-004 keyboard close restores the exact My and ID origin tab and opener", async ({ page }) => {
  await seedAcknowledgedLabs(page)

  await activateTab(page, "My Korea", "ondo-my-entry")
  const myOpener = page.getByTestId("open-labs-milestone")
  await myOpener.focus()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("button", { name: "Return to My Korea" })).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(page.getByTestId("ondo-my-entry")).toBeVisible()
  await expect(myOpener).toBeFocused()

  await activateTab(page, "ID", "ondo-identity-entry")
  const idOpener = page.getByTestId("open-labs-id")
  await idOpener.focus()
  await page.keyboard.press("Enter")
  const returnToId = page.getByRole("button", { name: "Return to ID" })
  await expect(returnToId).toBeFocused()
  await returnToId.click()
  await expect(page.getByTestId("ondo-identity-entry")).toBeVisible()
  await expect(idOpener).toBeFocused()
})

test("SLK-009 exact /ondo-b Labs contains no QA author controls or phrases", async ({ page }) => {
  await seedAcknowledgedLabs(page)
  await expect(page).toHaveURL(/\/ondo-b$/)
  await activateTab(page, "My Korea", "ondo-my-entry")
  await page.getByTestId("open-labs-milestone").click()
  const labs = page.getByTestId("labs-overlay")
  await expect(labs).toBeVisible()
  await expect(labs).not.toContainText(/fixture|Advance fixture phase|View quote mismatch example|Simulate signer connection/i)
})

test("SLK-009 ?qa=1 exposes the deterministic Labs seam", async ({ page }) => {
  await seedAcknowledgedLabs(page, "?qa=1")
  await activateTab(page, "My Korea", "ondo-my-entry")
  await page.getByTestId("open-labs-milestone").click()
  await expect(page.getByTestId("labs-overlay")).toContainText("ondo_fixture")
  await expect(page.getByRole("button", { name: "View quote mismatch example" })).toBeVisible()
})

test("SLK-009 ?qa=1 exposes the deterministic Gate seam", async ({ page }) => {
  await seedB(page, { local: { autoNight: false }, session: { ...READY_SESSION, paymentKyc: "PKY-NOT-STARTED" } })
  await openCheckout(page, "qa=1")
  await page.getByTestId("checkout-start").click()
  await expect(page.getByRole("button", { name: "Simulate failure" })).toBeVisible()
})

test("SLK-012 active Gate owns the modal tree, traps focus, and restores Checkout", async ({ page }) => {
  await seedB(page, { local: { autoNight: false }, session: { ...READY_SESSION, paymentKyc: "PKY-NOT-STARTED" } })
  await openCheckout(page)
  const checkoutDialog = page.locator("[role='dialog'][aria-label='Checkout simulation']")
  await page.getByTestId("checkout-start").click()

  await expect(checkoutDialog).toHaveAttribute("inert", "")
  await expect(checkoutDialog).toHaveAttribute("aria-hidden", "true")
  await expect(page.locator("[role='dialog'][aria-modal='true']:not([aria-hidden='true'])")).toHaveCount(1)
  const gate = page.getByTestId("ondo-gate-overlay")
  await expect(gate).not.toContainText(/Simulate failure|Show unavailable route/i)
  const close = gate.getByRole("button", { name: "Return to previous screen" })
  await expect(close).toBeFocused()
  await page.keyboard.press("Shift+Tab")
  await expect(gate.getByRole("button", { name: "Return without changes" })).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(close).toBeFocused()
  await expectNoSeriousAxe(page, "[data-testid='ondo-gate-overlay']")

  await page.keyboard.press("Escape")
  await expect(page.getByTestId("ondo-gate-overlay")).toHaveCount(0)
  await expect(checkoutDialog).not.toHaveAttribute("inert", "")
  await expect(checkoutDialog).not.toHaveAttribute("aria-hidden", "true")
  await expect(page.getByTestId("checkout-start")).toBeFocused()
})

test("SLK-016 traits identify place, condition, status, checked-at and retry only their own row", async ({ page }) => {
  await seedAcknowledgedLabs(page, "?scenario=trait-retry-fail")
  await activateTab(page, "My Korea", "ondo-my-entry")
  await page.getByTestId("open-labs-milestone").click()

  const seongsu = page.getByTestId("trait-seongsu-card")
  const euljiro = page.getByTestId("trait-euljiro-over19")
  await expect(seongsu).toContainText("Seongsu Dwaeji Gukbap")
  await expect(seongsu).toContainText("Foreign-issued card information")
  await expect(seongsu).toContainText("StatusOut of date")
  await expect(seongsu).toContainText("Checked atAug 1, 2026")
  await expect(euljiro).toContainText("Euljiro Nogari")
  await expect(euljiro).toContainText("19+ access condition")
  await expect(euljiro).toContainText("StatusUnavailable")
  await expect(page.getByTestId("labs-overlay")).not.toContainText(/merchant-seongsu|offer-foreign-card|policy-v3/)

  await page.getByRole("button", { name: "Retry Foreign-issued card information for Seongsu Dwaeji Gukbap" }).click()
  await expect(seongsu).toHaveAttribute("data-trait-state", "failed")
  await expect(seongsu).toContainText("Still unavailable")
  await expect(euljiro).toHaveAttribute("data-trait-state", "idle")

  const evidence = page.getByText("Evidence adapter boundaries", { exact: true })
  await expect(evidence).toBeVisible()
  await expect(evidence.locator("xpath=ancestor::summary")).toContainText("CONTRACT ONLY")
  await evidence.locator("xpath=ancestor::summary").focus()
  await page.keyboard.press("Enter")
  await expect(page.getByText("A live EAS implementation is deferred.")).toBeVisible()
  await expectNoSeriousAxe(page, "[data-testid='labs-overlay']")
})
