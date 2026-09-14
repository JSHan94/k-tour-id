import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const VENUE_ID = "mois-18939eecb43c15ab4305"
const SOURCE_ID = "MOIS_LOCALDATA_GENERAL_RESTAURANTS"

async function openPlace(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height })
  await page.addInitScript(({ key }) => {
    localStorage.setItem(key, JSON.stringify({
      locale: "en",
      onboarding: "ONB-COMPLETE",
      persona: null,
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
      recentVenueIds: [],
      plannedTableRefs: [],
      localSignalPostedVenueIds: [],
      localPulseEvidenceByVenue: {},
      localInteractionBoundarySeen: true,
    }))
  }, { key: DEVICE_KEY })
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("blockedbyclient"))
  await page.goto(`/?city=seoul&view=list&venueId=${VENUE_ID}&detail=1`, { waitUntil: "domcontentloaded" })
  const place = page.getByTestId("canonical-place-overlay")
  await expect(place).toHaveAttribute("data-venue-id", VENUE_ID)
  await expect(place.getByTestId("canonical-place-details-to-check")).toBeVisible()
  return place
}

for (const viewport of [
  { width: 320, height: 700 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
] as const) {
  test(`place facts stay pictorial and source metadata stays nonvisual at ${viewport.width}px`, async ({ page }) => {
    const place = await openPlace(page, viewport.width, viewport.height)
    const before = place.getByTestId("canonical-place-details-to-check")
    const facts = before.locator("[data-fact-key]")

    await expect(before).toBeVisible()
    await expect(facts).toHaveCount(4)
    await expect(before).toContainText("Hours")
    await expect(before).toContainText("Cards")
    await expect(before).toContainText("Menu")
    await expect(before).toContainText("Language")
    await expect(before.locator("[data-fact-label='long']").first()).toBeHidden()
    await expect(before.locator("[data-fact-label='short']").first()).toBeVisible()

    const geometry = await before.evaluate((section) => {
      const sectionBox = section.getBoundingClientRect()
      const controls = [...section.querySelectorAll<HTMLElement>("[data-fact-key] > button")]
      return {
        sectionLeft: sectionBox.left,
        sectionRight: sectionBox.right,
        controls: controls.map((control) => {
          const box = control.getBoundingClientRect()
          return { left: box.left, right: box.right, width: box.width, height: box.height, scrollWidth: control.scrollWidth }
        }),
      }
    })
    for (const control of geometry.controls) {
      expect(control.left).toBeGreaterThanOrEqual(geometry.sectionLeft - 1)
      expect(control.right).toBeLessThanOrEqual(geometry.sectionRight + 1)
      expect(control.width).toBeGreaterThanOrEqual(100)
      expect(control.height).toBeGreaterThanOrEqual(44)
      expect(control.scrollWidth).toBeLessThanOrEqual(Math.ceil(control.width))
    }

    const source = place.getByTestId("canonical-source-evidence")
    await expect(place).toHaveAttribute("data-detail-source", SOURCE_ID)
    await expect(place).toHaveAttribute("data-source-snapshot", "2026-08-19")
    await expect(source).toHaveAttribute("data-source-presentation", "nonvisual-metadata")
    const sourcePresentation = await source.evaluate((element) => {
      const style = getComputedStyle(element)
      const box = element.getBoundingClientRect()
      return { position: style.position, overflow: style.overflow, clip: style.clip, width: box.width, height: box.height }
    })
    expect(sourcePresentation).toMatchObject({ position: "absolute", overflow: "hidden", width: 1, height: 1 })
    expect(sourcePresentation.clip).not.toBe("auto")
    await expect(place.getByText("LOCALDATA", { exact: true })).toHaveCount(0)

    await before.getByRole("button", { name: /^Menu and prices:/ }).click()
    await expect(place.getByTestId("canonical-evidence-sheet")).toContainText("This directory does not include this detail.")

    const axe = await new AxeBuilder({ page }).include("[data-testid='canonical-place-overlay']").analyze()
    expect(axe.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
  })
}

test("desktop gives Before you go the full detail-sheet measure", async ({ page }) => {
  const place = await openPlace(page, 1440, 1000)
  const before = place.getByTestId("canonical-place-details-to-check")
  const geometry = await before.evaluate((section) => {
    const box = section.getBoundingClientRect()
    const controls = [...section.querySelectorAll<HTMLElement>("[data-fact-key] > button")]
    return {
      width: box.width,
      controlWidths: controls.map((control) => control.getBoundingClientRect().width),
      overflowing: controls.some((control) => control.scrollWidth > Math.ceil(control.getBoundingClientRect().width)),
    }
  })

  expect(geometry.width).toBeGreaterThan(700)
  expect(Math.min(...geometry.controlWidths)).toBeGreaterThan(320)
  expect(geometry.overflowing).toBe(false)
  await expect(place.getByTestId("canonical-source-evidence")).toHaveAttribute("data-source-presentation", "nonvisual-metadata")
})

