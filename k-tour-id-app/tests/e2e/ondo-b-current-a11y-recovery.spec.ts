import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import {
  gotoB,
  openCanonicalVenue,
  prepareBPage,
  seedB,
} from "../helpers/ondo-b-qa"

async function expectNoSeriousAxe(page: Page, selector: string) {
  const result = await new AxeBuilder({ page })
    .include(selector)
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(result.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
}

test.beforeEach(async ({ page }) => {
  await prepareBPage(page)
})

test("B-A11Y-RECOVERY-001 Local Signal storage failure keeps its draft, alert, and operable recovery", async ({ page }) => {
  await seedB(page, { local: { localInteractionBoundarySeen: true } })
  await openCanonicalVenue(page)
  await page.getByTestId("canonical-local-signal-open").click()
  const signal = page.getByTestId("ondo-b-local-signal")
  await expect(signal).toBeVisible()
  await signal.getByRole("button", { name: "Calm right now", exact: true }).click()
  await signal.getByTestId("local-signal-person-check").click()
  await page.getByTestId("ondo-b-action-gate").getByTestId("action-gate-confirm").click()
  const check = page.getByTestId("ondo-b-local-check-walkthrough")
  await check.getByTestId("person-route-choice-mobile_id_cx").click()
  await check.getByTestId("local-check-boundary-continue").click()
  await expect(check).toBeHidden()
  const post = signal.getByTestId("local-signal-post")
  await expect(post).toBeFocused()

  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (this === localStorage && key === "ondo-b.device.v1") throw new DOMException("blocked", "SecurityError")
      return original.call(this, key, value)
    }
  })
  await post.click()

  const alert = signal.getByTestId("local-signal-post-error")
  await expect(alert).toHaveAttribute("role", "alert")
  await expect(alert).toContainText("exact draft and place remain open")
  await expect(signal.getByRole("button", { name: "Calm right now", exact: true })).toHaveAttribute("aria-pressed", "true")
  await expect(post).toBeFocused()
  await expectNoSeriousAxe(page, "[data-testid='ondo-b-local-signal']")
})

test("B-A11Y-RECOVERY-002 Labs wallet failure owns one alert and clears it on retry", async ({ page }) => {
  await seedB(page, { clearFeatures: false })
  await page.addInitScript(() => {
    sessionStorage.setItem("ondo-b.labs.v1", JSON.stringify({
      acknowledged: true,
      wallet: "WAL-DISCONNECTED",
      bridge: "BRG-IDLE",
      phase: "none",
      mint: "NFT-LOCKED",
      consent: false,
      quoteExpiresAt: null,
      traitStates: {},
    }))
  })
  await gotoB(page, "?qa=1&scenario=labs-wallet-fail")
  await page.getByTestId("nav-my").click()
  await page.getByTestId("open-labs").click()
  const labs = page.getByTestId("labs-overlay")
  const connect = labs.getByTestId("labs-connect-wallet")
  await connect.click()
  await expect(labs).toHaveAttribute("data-wallet-state", "WAL-FAILED")
  const alert = labs.getByTestId("labs-wallet-outcome")
  await expect(alert).toHaveAttribute("role", "alert")
  await expect(connect).toHaveAttribute("aria-describedby", "labs-wallet-outcome")
  await expect(connect).toBeFocused()
  await expectNoSeriousAxe(page, "[data-testid='labs-overlay']")

  await page.evaluate(() => sessionStorage.removeItem("ondo.qa.scenario.v1"))
  await connect.click()
  await expect(labs).toHaveAttribute("data-wallet-state", "WAL-READY")
  await expect(labs.getByTestId("labs-wallet-outcome")).toHaveCount(0)
  await expect(labs.locator("[role='alert']")).toHaveCount(0)
})
