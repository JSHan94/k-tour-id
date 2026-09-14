import { expect, test, type Locator } from "@playwright/test"
import {
  B_ACTION_GATE_KEY,
  B_DEVICE_KEY,
  gotoB,
  prepareBPage,
  seedB,
  seedFreshOnboarding,
} from "../helpers/ondo-b-qa"

const EDITORIAL_PLACE_ID = "jeju-seongsan-ilchulbong"

async function bounds(locator: Locator) {
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  return box!
}

test.describe("RED wave: mobile atlas and journey invariants", () => {
  test.describe.configure({ timeout: 120_000 })

  test.beforeEach(async ({ page }) => {
    await prepareBPage(page)
  })

  test("RED-ATLAS-001 anchors stay within 8px and all three cities use one visual grammar", async ({ page }) => {
    await seedB(page)
    for (const viewport of [
      { width: 320, height: 844 },
      { width: 390, height: 844 },
      { width: 430, height: 844 },
      { width: 844, height: 390 },
    ]) {
      await page.setViewportSize(viewport)
      await gotoB(page)
      const atlas = page.getByTestId("ondo-b-korea-atlas")
      const plot = atlas.getByTestId("ondo-b-atlas-plot")
      await expect(atlas).toBeVisible()
      await expect(page.getByTestId("maplibre-map")).toHaveAttribute("data-map-projection-settled", "true")
      await page.evaluate(() => document.fonts.ready)
      const plotBox = await bounds(plot)
      const grammar: unknown[] = []
      for (const city of ["seoul", "busan", "jeju"] as const) {
        const node = atlas.locator(`[data-city='${city}']`)
        await expect(node).toHaveAttribute("data-map-projected", "true")
        const marker = node.locator("i")
        const markerBox = await bounds(marker)
        const center = { x: markerBox.x + markerBox.width / 2, y: markerBox.y + markerBox.height / 2 }
        const projected = await node.evaluate((element) => ({
          x: Number(element.getAttribute("data-map-x")),
          y: Number(element.getAttribute("data-map-y")),
        }))
        expect(Math.abs(center.x - (plotBox.x + projected.x)), `${viewport.width} ${city} live projection x`).toBeLessThanOrEqual(2)
        expect(Math.abs(center.y - (plotBox.y + projected.y)), `${viewport.width} ${city} live projection y`).toBeLessThanOrEqual(2)
        grammar.push(await node.evaluate((element) => ({
          tag: element.tagName,
          className: element.className,
          children: [...element.children].map((child) => child.tagName),
          pin: element.getAttribute("data-atlas-pin"),
          minHeight: getComputedStyle(element).minHeight,
        })))
      }
      expect(grammar[1]).toEqual(grammar[0])
      expect(grammar[2]).toEqual(grammar[0])
    }
  })

  test("RED-MOBILE-ENTER-002 entering a city never focuses an editable control", async ({ page }) => {
    await seedB(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoB(page)
    await page.locator("[data-city='seoul']").click()
    await expect(page.getByTestId("ondo-b-search")).toBeVisible()
    for (const delay of [0, 80, 300]) {
      if (delay) await page.waitForTimeout(delay)
      expect(await page.evaluate(() => {
        const active = document.activeElement as HTMLElement | null
        return Boolean(active?.matches("input, textarea, select, [contenteditable='true']"))
      }), `editable focus at +${delay}ms can summon a mobile virtual keyboard`).toBe(false)
    }
  })

  test("RED-MOBILE-TRANSITION-002B city entry hands the live basemap directly to a tappable city map", async ({ page }) => {
    await seedB(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoB(page)
    const persistentMap = page.getByTestId("maplibre-map")
    await expect(persistentMap.locator("canvas.maplibregl-canvas")).toHaveCount(1)
    await expect(persistentMap).toHaveAttribute("data-map-state", "ready")
    const originalCanvas = await persistentMap.locator("canvas.maplibregl-canvas").elementHandle()
    const seoul = page.locator("[data-city='seoul']")
    await seoul.evaluate((button: HTMLElement) => button.click())

    const root = page.getByTestId("ondo-b-map-entry")
    await expect(root).toHaveAttribute("data-entry-transition", "active")
    await expect(root).toHaveAttribute("data-entry-transition", "settled", { timeout: 3_000 })
    await expect(page.getByTestId("maplibre-map")).toHaveAttribute("data-map-mode", "city")
    await expect(page.locator("canvas.maplibregl-canvas")).toHaveCount(1)
    expect(await originalCanvas?.evaluate((canvas) => canvas === document.querySelector("canvas.maplibregl-canvas"))).toBe(true)
    const viewToggle = page.getByTestId("ondo-b-view-toggle")
    await expect(viewToggle).toBeVisible()
    expect(await viewToggle.evaluate((button) => {
      const box = button.getBoundingClientRect()
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
      return hit === button || Boolean(hit && button.contains(hit))
    })).toBe(true)
  })

  for (const intent of ["travelling", "preparing", "local_contributor"] as const) {
    test(`RED-ONBOARDING-003 ${intent} intent does not infer a Person route`, async ({ page }) => {
      await seedFreshOnboarding(page)
      await gotoB(page)
      const onboarding = page.getByTestId("ondo-onboarding")
      await onboarding.getByRole("button", { name: "Personalize in 20 seconds", exact: true }).click()
      await onboarding.getByTestId(`persona-${intent}`).click()
      await onboarding.getByRole("button", { name: "Choose food preferences", exact: true }).click()
      await onboarding.getByRole("button", { name: "Local classics", exact: true }).click()
      await onboarding.getByTestId("onboarding-finish").click()
      const state = await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "{}"), B_ACTION_GATE_KEY)
      expect(state.person).toEqual({ status: "unverified", expiresAt: null })
      expect(state.pending).toBeNull()
      await page.getByTestId("nav-id").click()
      await expect(page.getByTestId("traveler-id-person")).toHaveAttribute("data-status", /^(none|unverified)$/)
      await expect(page.getByTestId("ondo-b-action-gate")).toHaveCount(0)
    })
  }

  test("RED-JEJU-SAVE-004 guest save requires Account and returns to the exact editorial detail", async ({ page }) => {
    await seedB(page, { session: { account: "ACC-GUEST" } })
    await gotoB(page)
    await page.locator("[data-city='jeju']").click()
    await page.getByTestId("ondo-b-view-toggle").click()
    const list = page.getByTestId("ondo-b-editorial-place-list")
    await list.locator(`[data-editorial-place-id='${EDITORIAL_PLACE_ID}'] button`).click()
    await page.getByTestId("ondo-b-editorial-place-details").click()
    const detail = page.getByTestId("ondo-b-editorial-place-overlay")
    await expect(detail).toHaveAttribute("data-editorial-place-id", EDITORIAL_PLACE_ID)
    const exactUrl = page.url()
    await detail.getByTestId("ondo-b-editorial-place-save").click()
    const gate = page.getByTestId("account-save-gate")
    await expect(gate, "Jeju editorial save must reuse the Account JIT gate").toBeVisible()
    await expect(gate).toHaveAttribute("data-account-return-editorial-place", EDITORIAL_PLACE_ID)
    expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}").savedEditorialPlaceIds, B_DEVICE_KEY)).toEqual([])
    await gate.getByTestId("account-start").click()
    await expect(gate).toHaveCount(0)
    await expect(detail).toBeVisible()
    await expect(detail).toHaveAttribute("data-editorial-place-id", EDITORIAL_PLACE_ID)
    await expect(detail).toHaveAttribute("data-save-state", "saved")
    await expect(page).toHaveURL(exactUrl)
  })

  test("RED-TEXT-200-005 essential Table truth remains visible and unclipped at 200%", async ({ page }) => {
    await seedB(page)
    await page.setViewportSize({ width: 320, height: 844 })
    await gotoB(page)
    await page.getByTestId("nav-tables").click()
    await page.getByTestId("table-open-table-seoul-night-bites").click()
    // Mobile text enlargement should reflow the sheet. CSS `zoom` magnifies the
    // whole rendered canvas (pinch-zoom semantics) and cannot test text reflow.
    await page.evaluate(() => {
      document.documentElement.style.setProperty("-webkit-text-size-adjust", "200%")
      document.documentElement.style.setProperty("text-size-adjust", "200%")
    })
    const detail = page.getByTestId("table-detail")
    const disclosure = detail.getByTestId("tables-truth-notice")
    await expect(detail).toBeVisible()
    await expect(disclosure.locator("summary")).toBeVisible()
    await disclosure.locator("summary").click()
    await expect(disclosure.locator("p")).toBeVisible()
    const geometry = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(geometry.scrollWidth, "200% text must not introduce horizontal document scrolling").toBeLessThanOrEqual(geometry.clientWidth + 1)
    expect(await disclosure.locator("p").evaluate((element) => element.scrollWidth <= element.clientWidth + 1 && element.scrollHeight <= element.clientHeight + 1), "essential truth is clipped").toBe(true)
  })
})
