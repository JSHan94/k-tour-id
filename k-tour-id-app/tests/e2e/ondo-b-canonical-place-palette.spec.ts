import { expect, test, type Locator, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const PEAK_VENUE_ID = "mois-0021cd596bc5b2a922ad"
const VIEWPORTS = [
  { width: 320, height: 760 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 860 },
  { width: 844, height: 390 },
] as const

async function seed(page: Page, locale: "en" | "ko") {
  await page.addInitScript(({ key, language }) => localStorage.setItem(key, JSON.stringify({
    locale: language,
    onboarding: "ONB-COMPLETE",
    persona: null,
    discoveryPreferences: [],
    savedVenueIds: [],
    privateNotesByVenue: {},
    recentVenueIds: [],
    plannedTableRefs: [],
    localSignalPostedVenueIds: [],
    localPulseEvidenceByVenue: {},
    localInteractionBoundarySeen: false,
  })), { key: DEVICE_KEY, language: locale })
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("blockedbyclient"))
}

async function expectVisibleDirectTextAtLeast12(root: Locator) {
  const undersized = await root.evaluate((surface) => {
    const elements = [surface, ...Array.from(surface.querySelectorAll<HTMLElement>("*"))] as HTMLElement[]
    return elements.flatMap((element) => {
      if (element.closest("[aria-hidden='true']")) return []
      if (element.matches(".sr-only,[class*='srOnly'],[class*='visuallyHidden']")) return []
      const style = getComputedStyle(element)
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return []
      if (element.getClientRects().length === 0) return []
      const directText = Array.from(element.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent?.replace(/\s+/g, " ").trim() ?? "")
        .filter(Boolean)
        .join(" ")
      if (!directText) return []
      const fontSize = Number.parseFloat(style.fontSize)
      return fontSize < 12 ? [{ tag: element.tagName.toLowerCase(), text: directText.slice(0, 80), fontSize }] : []
    })
  })
  expect(undersized).toEqual([])
}

async function expectActionsAtLeast44(root: Locator) {
  const actions = root.locator("button:not([disabled]), a[href]")
  for (let index = 0; index < await actions.count(); index += 1) {
    const action = actions.nth(index)
    if (!await action.isVisible()) continue
    const box = await action.boundingBox()
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(43.5)
  }
}

async function expectPeakVisualMeter(pulse: Locator, meter: Locator) {
  const dot = meter.locator(":scope > i")
  await expect(pulse).toHaveAttribute("data-pulse-numeric", "hidden")
  await expect(meter).toBeVisible()
  await expect(dot).toBeVisible()
  await expect(meter).toHaveCSS("background-image", /linear-gradient/)
  await expect(dot).toHaveCSS("background-color", "rgb(122, 32, 72)")
  const [meterBox, dotBox] = await Promise.all([meter.boundingBox(), dot.boundingBox()])
  expect(meterBox).not.toBeNull()
  expect(dotBox).not.toBeNull()
  const dotCenter = dotBox!.x + dotBox!.width / 2
  expect(dotCenter).toBeGreaterThanOrEqual(meterBox!.x + meterBox!.width * .9)
  expect(dotCenter).toBeLessThanOrEqual(meterBox!.x + meterBox!.width + 1)

  await expect(pulse.locator("[data-level='peak']")).toHaveCount(0)
  await expect(pulse.getByText("91", { exact: true })).toBeHidden()
  await expect(pulse.getByText(/^(?:PEAK|피크)$/)).toBeHidden()
}

async function openPeakPlace(page: Page) {
  await page.goto("/ondo-b?city=seoul&view=list", { waitUntil: "domcontentloaded" })
  const row = page.getByTestId("ondo-b-venue-list").locator(`[data-venue-id='${PEAK_VENUE_ID}']`)
  await expect(row).toBeVisible()
  await row.locator("button").click()
  return page.getByTestId("canonical-place-peek")
}

for (const locale of ["en", "ko"] as const) {
  test(`${locale.toUpperCase()} canonical place keeps the exact Pulse palette, 12px copy, touch geometry, focus, and scroll`, async ({ page }) => {
    test.setTimeout(180_000)
    await seed(page, locale)

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport)
      const peek = await openPeakPlace(page)
      await expect(peek).toHaveAttribute("data-venue-id", PEAK_VENUE_ID)
      const peekPulse = peek.getByTestId("canonical-place-pulse")
      await expect(peekPulse).toHaveAttribute("data-pulse-level", "peak")
      const peekMeter = peekPulse.locator(":scope > span[aria-hidden='true']").nth(1)
      await expectPeakVisualMeter(peekPulse, peekMeter)
      await expect(peek).toBeFocused()
      await expect(peek.getByTestId("canonical-place-details")).not.toBeFocused()
      await expect(peek.getByTestId("canonical-place-details")).toHaveCSS("outline-style", "none")
      await page.keyboard.press("Tab")
      await expect(peek.locator("button").first()).toBeFocused()
      await expect(peek.locator("button").first()).toHaveCSS("outline-color", "rgb(23, 23, 23)")
      await expectVisibleDirectTextAtLeast12(peek)
      await expectActionsAtLeast44(peek)

      const peekBox = await peek.boundingBox()
      expect(peekBox?.x ?? -1).toBeGreaterThanOrEqual(0)
      expect((peekBox?.x ?? 0) + (peekBox?.width ?? viewport.width + 1)).toBeLessThanOrEqual(viewport.width + .5)

      await peek.getByTestId("canonical-place-details").click()
      const overlay = page.getByTestId("canonical-place-overlay")
      const article = overlay.locator(":scope > article")
      const body = article.locator(":scope > div").first()
      const back = article.locator(":scope > header button").first()
      const pulse = overlay.getByTestId("canonical-place-pulse")

      await expect(overlay).toBeVisible()
      await expect(overlay).toBeFocused()
      await expect(overlay).toHaveCSS("outline-style", "none")
      await expect(back).not.toBeFocused()
      await page.keyboard.press("Tab")
      await expect(back).toBeFocused()
      await expect(back).toHaveCSS("outline-color", "rgb(23, 23, 23)")
      await expect(pulse).toHaveAttribute("data-pulse-level", "peak")
      const detailMeter = pulse.locator("summary span[aria-hidden='true']")
      await expectPeakVisualMeter(pulse, detailMeter)
      await expectVisibleDirectTextAtLeast12(overlay)
      await expectActionsAtLeast44(overlay)
      expect(await body.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true)
      await body.evaluate((element) => element.scrollTo({ top: element.scrollHeight }))
      await expect.poll(() => body.evaluate((element) => element.scrollTop)).toBeGreaterThan(0)

      await page.keyboard.press("Escape")
      await expect(overlay).toBeHidden()
      await expect(peek.getByTestId("canonical-place-details")).toBeFocused()
      await peek.getByRole("button", { name: locale === "ko" ? "장소 닫기" : "Close place", exact: true }).click()
      await expect(peek).toBeHidden()
    }
  })
}
