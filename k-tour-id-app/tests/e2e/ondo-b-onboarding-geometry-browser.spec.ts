import { expect, test, type Locator, type Page } from "@playwright/test"
import {
  expectBRuntimeClean,
  installBRuntimeGuard,
  prepareBPage,
} from "../helpers/ondo-b-qa"

async function resetAndOpenOnboarding(page: Page) {
  await page.addInitScript(() => {
    localStorage.removeItem("ondo.preferences.v3")
    sessionStorage.removeItem("ondo.session.v3")
  })
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
  await expect(page.getByTestId("onboarding-step-value")).toBeVisible()
}

async function expectFullyActionable(control: Locator) {
  await expect(control).toBeVisible()
  await expect.poll(() => control.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const canvasElement = element.closest<HTMLElement>("[data-testid='ondo-onboarding']")
      ?? element.closest("section[aria-label='ONDO travel food app']")
      ?? document.querySelector<HTMLElement>("[data-testid='ondo-canvas']")
    const canvas = canvasElement?.getBoundingClientRect()
    const center = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
    return {
      fullyInCanvas: Boolean(canvas)
        && rect.top >= canvas!.top
        && rect.right <= canvas!.right
        && rect.bottom <= canvas!.bottom
        && rect.left >= canvas!.left,
      fullyInViewport: rect.top >= 0
        && rect.right <= window.innerWidth
        && rect.bottom <= window.innerHeight
        && rect.left >= 0,
      centerHit: center === element || element.contains(center),
    }
  })).toEqual({ fullyInCanvas: true, fullyInViewport: true, centerHit: true })
}

test.describe("ONDO B onboarding exit geometry", () => {
  test.beforeEach(async ({ page }) => {
    installBRuntimeGuard(page)
    await prepareBPage(page)
  })

  test.afterEach(async ({ page }) => {
    await expectBRuntimeClean(page)
  })

  test("Guest and Skip actions are fully actionable before scrolling", async ({ page }) => {
    await resetAndOpenOnboarding(page)

    await expectFullyActionable(page.getByRole("button", { name: "Personalize guest Explore" }))
    await expectFullyActionable(page.getByRole("button", { name: "Explore without setup" }))

    await page.getByRole("button", { name: "Personalize guest Explore" }).click()
    const personas = page.locator("[data-testid^='persona-']")
    await expect(personas).toHaveCount(3)
    for (let index = 0; index < 3; index += 1) await expectFullyActionable(personas.nth(index))

    await page.getByTestId("persona-travelling").click()
    await expectFullyActionable(page.getByRole("button", { name: "Choose food preferences", exact: true }))
    await expectFullyActionable(page.getByRole("button", { name: "Skip and explore" }))

    await page.getByRole("button", { name: "Choose food preferences", exact: true }).click()
    await expectFullyActionable(page.getByRole("button", { name: "Open guest Explore", exact: true }))
    await expectFullyActionable(page.getByRole("button", { name: "Skip and explore" }))
  })

  test("the onboarding layer remains scrollable in a constrained viewport", async ({ page }, testInfo) => {
    await page.setViewportSize({
      width: testInfo.project.name === "mobile-chromium" ? 390 : 1440,
      height: 460,
    })
    await resetAndOpenOnboarding(page)

    const layer = page.getByTestId("ondo-onboarding")
    await expect.poll(() => layer.evaluate((element) => ({
      overflowY: getComputedStyle(element).overflowY,
      hasOverflow: element.scrollHeight > element.clientHeight,
    }))).toEqual({ overflowY: "auto", hasOverflow: true })

    await layer.evaluate((element) => element.scrollTo({ top: element.scrollHeight, behavior: "instant" }))
    await expect.poll(() => layer.evaluate((element) => element.scrollTop > 0)).toBe(true)
    await expectFullyActionable(page.getByRole("button", { name: "Explore without setup" }))
  })
})
