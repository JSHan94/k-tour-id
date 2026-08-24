import { expect, test, type Browser, type BrowserContext, type Locator, type Page } from "@playwright/test"
import { CANONICAL_VENUE_ID } from "../helpers/ondo-b-qa"

const ORIGIN = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3112"
const DEVICE_KEY = "ondo-b.device.v1"
const FOCUS_COLOR = "rgb(29, 102, 209)"
const PRIMARY_VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 801, height: 1000 },
  { width: 1440, height: 1000 },
] as const
const REPRESENTATIVE_VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
] as const

type Locale = "en" | "ko"
type Onboarding = "ONB-NEW" | "ONB-COMPLETE"

async function productionContext(
  browser: Browser,
  viewport: { width: number; height: number },
  locale: Locale,
  onboarding: Onboarding = "ONB-COMPLETE",
) {
  const context = await browser.newContext({ viewport })
  await context.addInitScript(({ key, nextLocale, nextOnboarding }) => {
    localStorage.setItem(key, JSON.stringify({
      locale: nextLocale,
      onboarding: nextOnboarding,
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
    }))
    sessionStorage.clear()
  }, { key: DEVICE_KEY, nextLocale: locale, nextOnboarding: onboarding })
  return context
}

async function openPage(context: BrowserContext, path: string) {
  const page = await context.newPage()
  await page.goto(`${ORIGIN}${path}`, { waitUntil: "domcontentloaded" })
  await expect(page.getByTestId("ondo-b-root")).toBeVisible()
  return page
}

async function centerHit(locator: Locator) {
  return locator.evaluate((node) => {
    const box = node.getBoundingClientRect()
    const target = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
    return target === node || (target instanceof Node && node.contains(target))
  })
}

async function expectBeforeNavigation(locator: Locator, nav: Locator) {
  const [itemBox, navBox] = await Promise.all([locator.boundingBox(), nav.boundingBox()])
  expect(itemBox).not.toBeNull()
  expect(navBox).not.toBeNull()
  expect(itemBox!.y).toBeGreaterThanOrEqual(-0.5)
  expect(itemBox!.y + itemBox!.height).toBeLessThanOrEqual(navBox!.y + 0.5)
  expect(await centerHit(locator)).toBe(true)
}

async function canonicalReceipt(page: Page) {
  return page.evaluate(() => {
    const url = new URL(location.href)
    return {
      keys: [...url.searchParams.keys()].sort(),
      params: Object.fromEntries(url.searchParams),
      level: history.state?.__ondoBDiscovery?.level as string | undefined,
    }
  })
}

test.describe("ONDO B production CLEAN1 finding regressions", () => {
  test.describe.configure({ timeout: 180_000 })

  test("CLEAN1-D1-FOCUS uses one complete focus owner for onboarding", async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "one Chromium owner covers the exact viewport and locale matrix")

    for (const locale of ["en", "ko"] as const) {
      for (const viewport of PRIMARY_VIEWPORTS) {
        const context = await productionContext(browser, viewport, locale, "ONB-NEW")
        const page = await openPage(context, "/ondo-b")
        const dialog = page.getByTestId("ondo-onboarding")
        const action = page.getByTestId("onboarding-finish")
        await expect(action).toBeFocused()
        const receipt = await action.evaluate((node) => {
          const style = getComputedStyle(node)
          const box = node.getBoundingClientRect()
          const dialogBox = node.closest("[role='dialog']")!.getBoundingClientRect()
          return {
            outlineColor: style.outlineColor,
            outlineOffset: style.outlineOffset,
            outlineStyle: style.outlineStyle,
            outlineWidth: style.outlineWidth,
            fullyContained: box.top >= dialogBox.top && box.bottom <= dialogBox.bottom,
          }
        })
        expect(receipt).toEqual({
          outlineColor: FOCUS_COLOR,
          outlineOffset: "2px",
          outlineStyle: "solid",
          outlineWidth: "2px",
          fullyContained: true,
        })
        await expect(dialog).toBeVisible()
        await context.close()
      }
    }

    const shortContext = await productionContext(browser, { width: 844, height: 390 }, "en", "ONB-NEW")
    const shortPage = await openPage(shortContext, "/ondo-b")
    const shortDialog = shortPage.getByTestId("ondo-onboarding")
    await expect(shortDialog).toBeFocused()
    const fallback = await shortDialog.evaluate((node) => {
      const style = getComputedStyle(node)
      return { outlineStyle: style.outlineStyle, boxShadow: style.boxShadow, scrollTop: node.scrollTop }
    })
    expect(fallback.outlineStyle).toBe("none")
    expect(fallback.boxShadow).toContain("inset")
    expect(fallback.boxShadow).toContain(FOCUS_COLOR)
    expect(fallback.scrollTop).toBeLessThanOrEqual(1)
    await shortContext.close()
  })

  test("CLEAN1-D1-SEARCH gives the input shell and clear button one focus treatment each", async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "one Chromium owner covers both locales and representative viewport classes")

    for (const locale of ["en", "ko"] as const) {
      for (const viewport of REPRESENTATIVE_VIEWPORTS) {
        const context = await productionContext(browser, viewport, locale)
        const page = await openPage(context, "/ondo-b?city=seoul&view=list")
        const input = page.getByTestId("ondo-b-search")
        const shell = page.getByTestId("ondo-b-search-shell")
        await input.fill("로바")
        await expect(input).toBeFocused()
        const inputFocus = await input.evaluate((node) => {
          const inputStyle = getComputedStyle(node)
          const shellStyle = getComputedStyle(node.parentElement!)
          return {
            inputOutline: inputStyle.outlineStyle,
            shellColor: shellStyle.outlineColor,
            shellOffset: shellStyle.outlineOffset,
            shellStyle: shellStyle.outlineStyle,
            shellWidth: shellStyle.outlineWidth,
          }
        })
        expect(inputFocus).toEqual({
          inputOutline: "none",
          shellColor: FOCUS_COLOR,
          shellOffset: "2px",
          shellStyle: "solid",
          shellWidth: "2px",
        })

        await page.keyboard.press("Tab")
        const clear = shell.getByRole("button", { name: locale === "ko" ? "검색어 지우기" : "Clear search" })
        await expect(clear).toBeFocused()
        const clearFocus = await clear.evaluate((node) => {
          const buttonStyle = getComputedStyle(node)
          const shellStyle = getComputedStyle(node.parentElement!)
          return {
            buttonColor: buttonStyle.outlineColor,
            buttonOffset: buttonStyle.outlineOffset,
            buttonStyle: buttonStyle.outlineStyle,
            buttonWidth: buttonStyle.outlineWidth,
            shellOutline: shellStyle.outlineStyle,
          }
        })
        expect(clearFocus).toEqual({
          buttonColor: FOCUS_COLOR,
          buttonOffset: "2px",
          buttonStyle: "solid",
          buttonWidth: "2px",
          shellOutline: "none",
        })
        await context.close()
      }
    }
  })

  test("CLEAN1-D1-ATTRIBUTION isolates every source link from arbitrary basemap labels", async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "one Chromium owner covers both locales and representative viewport classes")

    for (const locale of ["en", "ko"] as const) {
      for (const viewport of REPRESENTATIVE_VIEWPORTS) {
        const context = await productionContext(browser, viewport, locale)
        const page = await openPage(context, "/ondo-b?city=seoul&view=map")
        const attribution = page.getByTestId("ondo-b-attribution")
        await expect(attribution).toBeVisible()
        const surface = await attribution.evaluate((node) => {
          const style = getComputedStyle(node)
          return {
            backgroundColor: style.backgroundColor,
            borderStyle: style.borderTopStyle,
            borderWidth: style.borderTopWidth,
            boxSizing: style.boxSizing,
            paddingLeft: style.paddingLeft,
            paddingRight: style.paddingRight,
          }
        })
        expect(surface).toEqual({
          backgroundColor: "rgb(251, 250, 247)",
          borderStyle: "solid",
          borderWidth: "1px",
          boxSizing: "border-box",
          paddingLeft: "8px",
          paddingRight: "8px",
        })
        await expect(attribution.getByRole("link")).toHaveCount(3)
        const targets = await attribution.getByRole("link").evaluateAll((links) => links.map((link) => {
          const box = link.getBoundingClientRect()
          return { width: box.width, height: box.height }
        }))
        expect(targets.every(({ width, height }) => width >= 44 && height >= 44)).toBe(true)
        await context.close()
      }
    }
  })

  test("CLEAN1-D3-REFLOW makes 200-percent ultra-short search, truth, and a result reachable", async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "one Chromium owner covers both locales at the exact 200-percent CSS viewport")

    for (const locale of ["en", "ko"] as const) {
      const context = await productionContext(browser, { width: 334, height: 160 }, locale)
      const page = await openPage(context, "/ondo-b?city=seoul&view=map")
      const root = page.getByTestId("ondo-b-map-entry")
      const content = page.locator("[data-testid='ondo-b-root'] [data-active-tab='ondo']")
      const nav = page.getByTestId("ondo-main-nav")
      const search = page.getByTestId("ondo-b-search")
      const result = page.getByTestId("ondo-b-result-bar")
      const row = page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id] button").first()
      await expect(root).toHaveAttribute("data-layout-mode", "ultra-short")
      await expect(root).toHaveAttribute("data-effective-view", "list")
      const metrics = await content.evaluate((node) => ({
        clientHeight: node.clientHeight,
        scrollHeight: node.scrollHeight,
        rootHeight: document.querySelector("[data-testid='ondo-b-map-entry']")!.getBoundingClientRect().height,
      }))
      expect(metrics.rootHeight).toBeGreaterThanOrEqual(216)
      expect(metrics.scrollHeight - metrics.clientHeight).toBeGreaterThanOrEqual(130)

      await content.evaluate((node) => { node.scrollTop = 30 })
      await expectBeforeNavigation(search, nav)
      await content.evaluate((node) => { node.scrollTop = 80 })
      await expectBeforeNavigation(result, nav)
      await content.evaluate((node) => { node.scrollTop = node.scrollHeight })
      await expectBeforeNavigation(row, nav)
      await row.focus()
      await expect(row).toBeFocused()
      await context.close()
    }
  })

  test("CLEAN1-D4-HISTORY restores a canonical detail URL after hydration, reload, and onboarding", async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "one Chromium owner covers the canonical history lifecycle")
    const detailPath = `/ondo-b?city=seoul&view=list&q=Roba&category=night&venueId=${CANONICAL_VENUE_ID}&detail=1`
    const expectedParams = {
      city: "seoul",
      view: "list",
      q: "Roba",
      category: "night",
      venueId: CANONICAL_VENUE_ID,
      detail: "1",
    }

    const context = await productionContext(browser, { width: 390, height: 844 }, "en")
    const page = await openPage(context, detailPath)
    const overlay = page.getByTestId("canonical-place-overlay")
    await expect(overlay).toBeVisible()
    await expect(overlay.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")
    expect(await canonicalReceipt(page)).toEqual({
      keys: ["category", "city", "detail", "q", "venueId", "view"],
      params: expectedParams,
      level: "detail",
    })

    await page.reload({ waitUntil: "domcontentloaded" })
    await expect(overlay).toBeVisible()
    await expect(overlay.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")
    expect(await canonicalReceipt(page)).toEqual({
      keys: ["category", "city", "detail", "q", "venueId", "view"],
      params: expectedParams,
      level: "detail",
    })

    await page.goBack()
    await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
    await page.goBack()
    await expect(page.getByTestId("canonical-place-peek")).toHaveCount(0)
    await expect(page.getByTestId("ondo-b-search")).toHaveValue("Roba")
    await expect(page.getByRole("button", { name: "Night", exact: true })).toHaveAttribute("aria-pressed", "true")
    await context.close()

    const onboardingContext = await productionContext(browser, { width: 390, height: 844 }, "en", "ONB-NEW")
    const onboardingPage = await openPage(onboardingContext, detailPath)
    await expect(onboardingPage.getByTestId("ondo-onboarding")).toBeVisible()
    await expect(onboardingPage.getByTestId("canonical-place-overlay")).toHaveCount(0)
    await onboardingPage.getByTestId("onboarding-finish").click()
    const restored = onboardingPage.getByTestId("canonical-place-overlay")
    await expect(restored).toBeVisible()
    await expect(restored.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")
    expect((await canonicalReceipt(onboardingPage)).level).toBe("detail")
    await onboardingContext.close()
  })
})
