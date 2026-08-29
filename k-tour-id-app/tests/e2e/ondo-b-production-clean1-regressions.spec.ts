import { expect, test, type Browser, type BrowserContext, type Locator, type Page } from "@playwright/test"
import { CANONICAL_VENUE_ID } from "../helpers/ondo-b-qa"

const ORIGIN = new URL(process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3112").origin
const DEVICE_KEY = "ondo-b.device.v1"
const AFTER19_SESSION_KEY = "ondo-b.after19.session.v1"
// The current white-and-ink direction uses the same high-contrast focus token
// as the product shell; keep this receipt exact so browser-default blue cannot
// silently return.
const FOCUS_COLOR = "rgb(23, 23, 23)"
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

async function expectReachableInScrollOwner(locator: Locator, owner: Locator, shouldFocus = true) {
  await locator.scrollIntoViewIfNeeded()
  const [itemBox, ownerBox] = await Promise.all([locator.boundingBox(), owner.boundingBox()])
  expect(itemBox).not.toBeNull()
  expect(ownerBox).not.toBeNull()
  const visibleTop = Math.max(itemBox!.y, ownerBox!.y)
  const visibleBottom = Math.min(itemBox!.y + itemBox!.height, ownerBox!.y + ownerBox!.height)
  expect(visibleBottom - visibleTop).toBeGreaterThanOrEqual(Math.min(44, itemBox!.height))
  if (shouldFocus) {
    await locator.focus()
    await expect(locator).toBeFocused()
  }
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
        // Let the product's deliberate initial dialog focus settle before
        // proving the first action's independent focus owner and outline.
        await expect(dialog).toBeFocused()
        const action = dialog.locator("[data-onboarding-initial-focus]").first()
        await action.focus()
        await expect(action).toBeFocused()
        const receipt = await action.evaluate((node) => {
          const style = getComputedStyle(node)
          const dialogStyle = getComputedStyle(node.closest("[role='dialog']")!)
          const box = node.getBoundingClientRect()
          const dialogBox = node.closest("[role='dialog']")!.getBoundingClientRect()
          return {
            dialogOutlineStyle: dialogStyle.outlineStyle,
            outlineStyle: style.outlineStyle,
            outlineWidth: style.outlineWidth,
            fullyContained: box.top >= dialogBox.top && box.bottom <= dialogBox.bottom,
          }
        })
        expect(receipt).toEqual({
          dialogOutlineStyle: "none",
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
    await shortDialog.locator("[data-onboarding-initial-focus]").first().focus()
    await expect(shortDialog.locator("[data-onboarding-initial-focus]").first()).toBeFocused()
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
        expect(surface.backgroundColor).not.toBe("rgba(0, 0, 0, 0)")
        expect(surface.borderStyle).toBe("solid")
        expect(surface.borderWidth).toBe("1px")
        expect(surface.boxSizing).toBe("border-box")
        await attribution.getByTestId("ondo-b-map-credit-details").locator("summary").click()
        await expect(attribution.getByTestId("ondo-b-map-credit-details")).toHaveAttribute("open", "")
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
      const content = page.getByTestId("ondo-scroll-region")
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

      await expectReachableInScrollOwner(search, content)
      await expectReachableInScrollOwner(result, content, false)
      await expectReachableInScrollOwner(row, content)
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
    const selectedCategory = page.getByTestId("ondo-b-category-rail").getByRole("button", { pressed: true })
    await expect(selectedCategory).toHaveAccessibleName("Pubs & cafés")
    await context.close()

    const onboardingContext = await productionContext(browser, { width: 390, height: 844 }, "en", "ONB-NEW")
    const onboardingPage = await openPage(onboardingContext, detailPath)
    await expect(onboardingPage.getByTestId("ondo-onboarding")).toBeVisible()
    await expect(onboardingPage.getByTestId("canonical-place-overlay")).toHaveCount(0)
    await onboardingPage.getByRole("button", { name: "Set guest preferences" }).click()
    await onboardingPage.getByTestId("persona-travelling").click()
    await onboardingPage.getByRole("button", { name: "Choose food preferences" }).click()
    await onboardingPage.getByTestId("onboarding-finish").click()
    const restored = onboardingPage.getByTestId("canonical-place-overlay")
    await expect(restored).toBeVisible()
    await expect(restored.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")
    expect((await canonicalReceipt(onboardingPage)).level).toBe("detail")
    await onboardingContext.close()
  })

  test("CLEAN1-AFTER19 keeps the map locked to pubs and cafés through URL restore and empty-search reset", async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chromium", "the mobile project covers the consumer category rail once")
    const context = await productionContext(browser, { width: 390, height: 844 }, "en")
    await context.addInitScript(({ key }) => {
      sessionStorage.setItem(key, JSON.stringify({
        version: 1,
        age: "eligible",
        ageExpiresAt: "2026-09-01T20:30:00+09:00",
        mode: "on",
        activation: "manual",
        expiryNotice: false,
      }))
    }, { key: AFTER19_SESSION_KEY })
    const page = await openPage(context, "/ondo-b?city=seoul&view=list&category=all")
    const root = page.getByTestId("ondo-b-map-entry")
    const rail = page.getByTestId("ondo-b-category-rail")
    await expect(root).toHaveAttribute("data-after19-active", "true")
    await expect.poll(() => new URL(page.url()).searchParams.get("category")).toBe("night")
    await expect(rail.getByRole("button")).toHaveCount(1)
    await expect(rail.getByRole("button", { name: "Pubs & cafés", pressed: true })).toBeVisible()
    await expect(rail.getByRole("button", { name: "All" })).toHaveCount(0)
    await expect(rail.getByRole("button", { name: "Korean" })).toHaveCount(0)

    await page.getByTestId("ondo-b-search").fill("__no_after19_place__")
    const empty = page.getByTestId("ondo-b-empty-results")
    await expect(empty).toContainText("No places match")
    await empty.getByRole("button", { name: "Clear search" }).click()
    await expect(page.getByTestId("ondo-b-search")).toHaveValue("")
    await expect(empty).toHaveCount(0)
    await expect(rail.getByRole("button", { name: "Pubs & cafés", pressed: true })).toBeVisible()
    await expect.poll(() => new URL(page.url()).searchParams.get("category")).toBe("night")
    await context.close()
  })
})
