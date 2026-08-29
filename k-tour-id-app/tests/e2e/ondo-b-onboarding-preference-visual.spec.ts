import { expect, test, type Locator, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"

async function openPreferences(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport)
  await page.addInitScript((key) => localStorage.removeItem(key), DEVICE_KEY)
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
  await page.getByRole("button", { name: "Set guest preferences", exact: true }).click()
  await page.getByTestId("persona-travelling").click()
  await page.getByRole("button", { name: "Choose food preferences", exact: true }).click()
  const preferences = page.getByTestId("onboarding-step-preferences")
  await expect(preferences).toBeVisible()
  return preferences
}

async function preferenceGeometry(preferences: Locator) {
  return preferences.locator("section button[aria-pressed]").evaluateAll((controls) => controls.map((control) => {
    const rect = control.getBoundingClientRect()
    const parent = control.parentElement!
    const parentRect = parent.getBoundingClientRect()
    const style = getComputedStyle(control)
    return {
      height: rect.height,
      contained: rect.left >= parentRect.left && rect.right <= parentRect.right,
      textContained: control.scrollWidth <= control.clientWidth + 1,
      lineHeight: Number.parseFloat(style.lineHeight),
    }
  }))
}

for (const viewport of [{ width: 320, height: 720 }, { width: 390, height: 844 }] as const) {
  test(`B-PREFERENCE-VIS-001 ${viewport.width}px chips wrap cleanly and expose keyboard selection`, async ({ page }) => {
    const preferences = await openPreferences(page, viewport)
    const chips = preferences.locator("section button[aria-pressed]")
    await expect(chips).toHaveCount(9)

    const geometry = await preferenceGeometry(preferences)
    expect(geometry.every(({ height }) => height >= 44)).toBe(true)
    expect(geometry.every(({ contained, textContained }) => contained && textContained)).toBe(true)
    expect(geometry.every(({ lineHeight }) => lineHeight >= 16)).toBe(true)
    await expect.poll(() => preferences.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)

    const cafe = preferences.getByRole("button", { name: "Cafés and dessert", exact: true })
    await expect(cafe).toHaveAttribute("aria-pressed", "false")
    await expect(cafe).toHaveCSS("background-color", "rgb(255, 255, 255)")
    await preferences.getByRole("button", { name: "Local classics", exact: true }).focus()
    await page.keyboard.press("Tab")
    await expect(cafe).toBeFocused()
    await expect(cafe).toHaveCSS("outline-style", "solid")
    await expect(cafe).toHaveCSS("outline-width", "3px")
    await page.keyboard.press("Space")
    await expect(cafe).toHaveAttribute("aria-pressed", "true")
    await expect(cafe).toHaveCSS("background-color", "rgb(23, 23, 23)")
    await expect(cafe).toHaveCSS("color", "rgb(255, 255, 255)")
  })
}

test("B-SETTINGS-VIS-002 Settings starts at its product title while device storage truth remains", async ({ page }) => {
  await page.addInitScript((key) => {
    localStorage.setItem(key, JSON.stringify({
      locale: "en",
      onboarding: "ONB-COMPLETE",
      persona: "travelling",
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
    }))
  }, DEVICE_KEY)
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
  await page.getByTestId("nav-settings").click()

  const settings = page.getByTestId("ondo-b-settings-entry")
  await expect(settings.getByRole("heading", { name: "Settings", exact: true })).toBeVisible()
  await expect(settings.getByText("ON THIS DEVICE", { exact: true })).toHaveCount(0)
  await expect(settings.getByText("Stored on this device", { exact: true })).toBeVisible()
})
