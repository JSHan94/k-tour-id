import { expect, test, type Locator, type Page } from "@playwright/test"
import { gotoB, prepareBPage, seedB } from "../helpers/ondo-b-qa"

const PLACE_ID = "jeju-seongsan-ilchulbong"
const PLACE_NAME = "Seongsan Ilchulbong Tuff Cone"

async function openEditorialPeek(page: Page) {
  await gotoB(page, "?city=jeju&view=list")
  const list = page.getByTestId("ondo-b-editorial-place-list")
  const opener = list.locator(`[data-editorial-place-id='${PLACE_ID}'] [data-editorial-place-opener='${PLACE_ID}']`)
  await expect(opener).toBeVisible()
  await opener.click()
  const peek = page.getByTestId("ondo-b-editorial-place-peek")
  await expect(peek).toHaveAttribute("data-editorial-place-id", PLACE_ID)
  await expect(peek).toHaveAttribute("data-editorial-presence", "open")
  return { opener, peek }
}

async function visualSnapshot(detail: Locator) {
  return detail.evaluate((element) => {
    const hero = element.querySelector<HTMLImageElement>("[data-testid='ondo-b-editorial-place-hero'] img")
    const save = element.querySelector<HTMLButtonElement>("[data-testid='ondo-b-editorial-place-save']")
    const sources = element.querySelector<HTMLDetailsElement>("details[aria-label]")
    return {
      text: (element.textContent ?? "").replace(/\s+/g, " ").trim(),
      hero: hero?.currentSrc || hero?.src || "",
      savePressed: save?.getAttribute("aria-pressed"),
      sourcesOpen: sources?.open ?? false,
    }
  })
}

async function retainedVisualSnapshot(detail: Locator) {
  return detail.evaluate(async (element) => {
    const read = () => {
      const hero = element.querySelector<HTMLImageElement>("[data-testid='ondo-b-editorial-place-hero'] img")
      const save = element.querySelector<HTMLButtonElement>("[data-testid='ondo-b-editorial-place-save']")
      const sources = element.querySelector<HTMLDetailsElement>("details[aria-label]")
      return {
        text: (element.textContent ?? "").replace(/\s+/g, " ").trim(),
        hero: hero?.currentSrc || hero?.src || "",
        savePressed: save?.getAttribute("aria-pressed"),
        sourcesOpen: sources?.open ?? false,
      }
    }

    // Attack and sample inside the page clock. Multiple Playwright assertion
    // round trips can otherwise consume the finite 260 ms retained interval.
    element.querySelector<HTMLButtonElement>("[data-testid='ondo-b-editorial-place-save']")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))
    element.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }))
    await new Promise((resolve) => window.setTimeout(resolve, 100))
    return {
      connected: element.isConnected,
      presence: element.getAttribute("data-editorial-presence"),
      busy: element.getAttribute("aria-busy"),
      saveState: element.getAttribute("data-save-state"),
      canvasModal: document.querySelector("[data-testid='ondo-canvas']")?.getAttribute("data-ondo-modal-open") ?? null,
      bodyOverflow: document.body.style.overflow,
      openerFocused: document.activeElement?.getAttribute("data-editorial-place-opener") === element.getAttribute("data-editorial-place-id"),
      visual: read(),
    }
  })
}

test.describe("Jeju editorial place · retained mobile exit", () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90_000)
    await prepareBPage(page)
    await page.setViewportSize({ width: 390, height: 844 })
  })

  test("EDITORIAL-EXIT-BROWSER-001 freezes the complete detail and owns input until exact-opener restoration", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await seedB(page, {
      session: { account: "ACC-ACTIVE" },
      local: { savedEditorialPlaceIds: [PLACE_ID] },
    })
    const { opener, peek } = await openEditorialPeek(page)
    await peek.getByTestId("ondo-b-editorial-place-details").click()

    const detail = page.getByTestId("ondo-b-editorial-place-overlay")
    await expect(detail).toHaveAttribute("data-editorial-presence", "open")
    await expect(detail).toContainText(PLACE_NAME)
    const sources = detail.locator("details[aria-label]")
    await sources.locator("summary").click()
    await expect(sources).toHaveJSProperty("open", true)
    const before = await visualSnapshot(detail)

    await detail.getByRole("button", { name: "Close place", exact: true }).click()
    const retained = await retainedVisualSnapshot(detail)
    expect(retained).toMatchObject({
      connected: true,
      presence: "closing",
      busy: "true",
      saveState: "saved",
      canvasModal: "true",
      bodyOverflow: "hidden",
      openerFocused: false,
      visual: before,
    })

    await expect(detail).toHaveCount(0)
    await expect(opener).toBeFocused()
    await expect(page.getByTestId("ondo-canvas")).not.toHaveAttribute("data-ondo-modal-open", "true")
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe("hidden")
  })

  test("EDITORIAL-EXIT-BROWSER-002 blocks detail re-entry and cancels stale removal/focus on rapid reopen", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await seedB(page)
    const { opener, peek } = await openEditorialPeek(page)

    await peek.getByRole("button", { name: "Close place", exact: true }).click()
    await expect(peek).toHaveAttribute("data-editorial-presence", "closing")
    await peek.getByTestId("ondo-b-editorial-place-details").dispatchEvent("click")
    await expect(page.getByTestId("ondo-b-editorial-place-overlay")).toHaveCount(0)

    await page.evaluate(() => window.history.forward())
    await expect(peek).toHaveAttribute("data-editorial-presence", "open")
    await expect(peek).toHaveAttribute("data-editorial-place-id", PLACE_ID)
    await page.waitForTimeout(420)
    await expect(peek).toHaveCount(1)
    await expect(peek).toHaveAttribute("data-editorial-presence", "open")
    await expect.poll(() => peek.evaluate((element) => element.contains(document.activeElement))).toBe(true)
    await expect(opener).not.toBeFocused()

    await peek.getByRole("button", { name: "Close place", exact: true }).click()
    await expect(peek).toHaveCount(0)
    await expect(opener).toBeFocused()
  })

  test("EDITORIAL-EXIT-BROWSER-003 reduced motion removes immediately and still restores the opener", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await seedB(page)
    const { opener, peek } = await openEditorialPeek(page)

    await peek.getByRole("button", { name: "Close place", exact: true }).click()
    await expect(peek).toHaveCount(0)
    await expect(opener).toBeFocused()
  })
})
