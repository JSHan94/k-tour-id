import { expect, test, type Locator, type Page } from "@playwright/test"
import {
  CANONICAL_VENUE_ID,
  expectBRuntimeClean,
  gotoB,
  installBRuntimeGuard,
  prepareBPage,
  seedB,
} from "../helpers/ondo-b-qa"

async function openCanonicalPeekFromList(page: Page) {
  await gotoB(page, "?city=seoul&view=list")
  const opener = page.getByTestId("ondo-b-venue-list")
    .locator(`[data-venue-id='${CANONICAL_VENUE_ID}'] [data-venue-opener='${CANONICAL_VENUE_ID}']`)
  await expect(opener).toBeVisible()
  await opener.click()

  const peek = page.getByTestId("canonical-place-peek")
  await expect(peek).toHaveAttribute("data-place-presence", "open")
  await expect(peek).toHaveAttribute("data-venue-id", CANONICAL_VENUE_ID)
  return { opener, peek }
}

async function canonicalDetailSnapshot(detail: Locator, attackClosingInput = false) {
  return detail.evaluate(async (element, shouldAttack) => {
    const read = () => {
      const body = element.querySelector<HTMLElement>("[data-place-return-scroll='detail']")
      const source = element.querySelector<HTMLDetailsElement>("[data-testid='canonical-source-evidence']")
      const save = element.querySelector<HTMLButtonElement>("[data-testid='canonical-venue-save']")
      const temperature = element.querySelector<HTMLElement>("[data-testid='canonical-place-pulse']")
      return {
        bodyScrollTop: body?.scrollTop ?? -1,
        savePressed: save?.getAttribute("aria-pressed") ?? null,
        saveState: element.getAttribute("data-save-state"),
        sourceOpen: source?.open ?? false,
        temperatureLevel: temperature?.getAttribute("data-pulse-level") ?? null,
        text: (element.textContent ?? "").replace(/\s+/g, " ").trim(),
        venueId: element.getAttribute("data-venue-id"),
      }
    }

    if (shouldAttack) {
      const save = element.querySelector<HTMLButtonElement>("[data-testid='canonical-venue-save']")
      save?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))
      element.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }))
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    }
    const venueId = element.getAttribute("data-venue-id")
    return {
      lifecycle: {
        accountGatePresent: document.querySelector("[data-testid='account-save-gate']") !== null,
        busy: element.getAttribute("aria-busy"),
        historyLevel: (history.state as { __ondoBDiscovery?: { level?: string } } | null)?.__ondoBDiscovery?.level ?? null,
        modalOpen: document.querySelector("[data-testid='ondo-canvas']")?.getAttribute("data-ondo-modal-open") ?? null,
        openerFocused: document.activeElement instanceof HTMLElement
          && document.activeElement.getAttribute("data-venue-opener") === venueId,
        overflow: document.body.style.overflow,
        presence: element.getAttribute("data-place-presence"),
        urlVenueId: new URL(location.href).searchParams.get("venueId"),
      },
      visual: read(),
    }
  }, attackClosingInput)
}

test.describe("Canonical place · retained mobile exit", () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90_000)
    installBRuntimeGuard(page)
    await prepareBPage(page)
    await page.setViewportSize({ width: 390, height: 844 })
  })

  test.afterEach(async ({ page }) => {
    await expectBRuntimeClean(page)
  })

  test("CANONICAL-EXIT-BROWSER-001 freezes the final detail and owns input until exact-opener restoration", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await seedB(page, {
      session: { account: "ACC-ACTIVE" },
      local: { savedVenueIds: [CANONICAL_VENUE_ID] },
    })
    const { opener, peek } = await openCanonicalPeekFromList(page)
    await peek.getByTestId("canonical-place-details").click()

    const detail = page.getByTestId("canonical-place-overlay")
    await expect(detail).toHaveAttribute("data-place-presence", "open")
    await expect(detail.locator("[data-detail-state]").first()).toHaveAttribute("data-detail-state", "ready")
    const source = detail.getByTestId("canonical-source-evidence")
    await source.locator("summary").click()
    await expect(source).toHaveJSProperty("open", true)
    const before = await canonicalDetailSnapshot(detail)

    await detail.getByRole("button", { name: "Close place", exact: true }).click()
    const during = await canonicalDetailSnapshot(detail, true)
    expect(during.visual).toEqual(before.visual)
    expect(during.lifecycle).toEqual({
      accountGatePresent: false,
      busy: "true",
      historyLevel: "city",
      modalOpen: "true",
      openerFocused: false,
      overflow: "hidden",
      presence: "closing",
      urlVenueId: null,
    })

    await expect(detail).toHaveCount(0)
    await expect(opener).toBeFocused()
    await expect(page.getByTestId("ondo-canvas")).not.toHaveAttribute("data-ondo-modal-open", "true")
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe("hidden")
  })

  test("CANONICAL-EXIT-BROWSER-002 cancels stale removal and focus when the same place rapidly reopens", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await seedB(page)
    const { opener, peek } = await openCanonicalPeekFromList(page)

    await peek.getByRole("button", { name: "Close place", exact: true }).click()
    await expect(peek).toHaveAttribute("data-place-presence", "closing")
    await peek.getByTestId("canonical-place-details").dispatchEvent("click")
    await expect(page.getByTestId("canonical-place-overlay")).toHaveCount(0)

    await page.evaluate(() => window.history.forward())
    await expect(peek).toHaveAttribute("data-place-presence", "open")
    await expect(peek).toHaveAttribute("data-venue-id", CANONICAL_VENUE_ID)
    await page.waitForTimeout(420)
    await expect(peek).toHaveCount(1)
    await expect(peek).toHaveAttribute("data-place-presence", "open")
    await expect.poll(() => peek.evaluate((element) => element.contains(document.activeElement))).toBe(true)
    await expect(opener).not.toBeFocused()

    await peek.getByRole("button", { name: "Close place", exact: true }).click()
    await expect(peek).toHaveCount(0)
    await expect(opener).toBeFocused()
  })

  test("CANONICAL-EXIT-BROWSER-003 reduced motion removes immediately and restores the exact opener", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await seedB(page)
    const { opener, peek } = await openCanonicalPeekFromList(page)

    await peek.getByRole("button", { name: "Close place", exact: true }).click()
    await expect(peek).toHaveCount(0)
    await expect(opener).toBeFocused()
    await expect.poll(() => page.evaluate(() => (history.state as { __ondoBDiscovery?: { level?: string } } | null)?.__ondoBDiscovery?.level)).toBe("city")
    await expect(page.getByTestId("ondo-canvas")).not.toHaveAttribute("data-ondo-modal-open", "true")
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe("hidden")
  })
})
