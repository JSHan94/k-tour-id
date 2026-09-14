import { expect, test, type Locator, type Page } from "@playwright/test"
import { expectNoSetupPlacePreview, openOptionalMapSetup } from "../helpers/ondo-optional-setup"
import {
  B_DEVICE_KEY,
  expectBRuntimeClean,
  expectMinimumControlTargets,
  expectNoHorizontalOverflow,
  gotoB,
  installBRuntimeGuard,
  prepareBPage,
  seedFreshOnboarding,
} from "../helpers/ondo-b-qa"

type Locale = "en" | "ko" | "ja"

const localeCopy = {
  en: { intent: "What brings you here?", area: "Where should we begin?", taste: "What sounds good?", start: "Choose area", finish: "Open map" },
  ko: { intent: "어떤 한국을 찾고 있나요?", area: "어디서 시작할까요?", taste: "지금 끌리는 건?", start: "지역 고르기", finish: "지도 열기" },
  ja: { intent: "どんな韓国を探しますか？", area: "どこから始めますか？", taste: "今の気分は？", start: "地域を選ぶ", finish: "マップを開く" },
} as const satisfies Record<Locale, Record<string, string>>

async function openFresh(page: Page, locale: Locale, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport)
  installBRuntimeGuard(page)
  await prepareBPage(page)
  await seedFreshOnboarding(page, locale)
  await gotoB(page)
  await openOptionalMapSetup(page)
  const overlay = page.getByTestId("ondo-onboarding-backdrop")
  const sheet = page.getByTestId("ondo-sheet")
  await expect(overlay).toHaveAttribute("data-onboarding-step", "intent")
  await expect(sheet).toBeVisible()
  return { overlay, sheet }
}

async function expectInsideVisualViewport(page: Page, locator: Locator) {
  const result = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const visualViewport = window.visualViewport
    const top = visualViewport?.offsetTop ?? 0
    const bottom = top + (visualViewport?.height ?? window.innerHeight)
    return {
      visible: rect.width > 0 && rect.height > 0,
      inside: rect.left >= 0 && rect.right <= window.innerWidth + 1 && rect.top >= top - 1 && rect.bottom <= bottom + 1,
    }
  })
  expect(result).toEqual({ visible: true, inside: true })
}

test.describe("Wave 2 onboarding non-author mobile acceptance", () => {
  test.describe.configure({ timeout: 120_000 })

  for (const viewport of [
    { width: 320, height: 568 },
    { width: 320, height: 800 },
    { width: 360, height: 780 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 844, height: 390 },
  ] as const) {
    test(`${viewport.width}x${viewport.height} keeps the first decision and escape reachable over the live map`, async ({ page }) => {
      const { sheet } = await openFresh(page, "en", viewport)
      const map = page.getByTestId("maplibre-map")
      await expect(map).toBeVisible()
      await expect(page.getByRole("heading", { name: localeCopy.en.intent, exact: true })).toBeFocused()
      await expectInsideVisualViewport(page, page.getByRole("button", { name: localeCopy.en.start, exact: true }))
      await expectInsideVisualViewport(page, page.getByTestId("onboarding-guest-skip"))
      await expectNoHorizontalOverflow(page, sheet)
      await expectMinimumControlTargets(sheet)

      const geometry = await sheet.evaluate((element) => {
        const rect = element.getBoundingClientRect()
        return { width: rect.width, height: rect.height, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight }
      })
      if (viewport.width < 700) expect(geometry.height / geometry.viewportHeight).toBeLessThanOrEqual(0.58)
      else expect(geometry.width / geometry.viewportWidth).toBeLessThanOrEqual(0.53)
      await expectBRuntimeClean(page)
    })
  }

  for (const locale of ["en", "ko", "ja"] as const satisfies readonly Locale[]) {
    test(`${locale.toUpperCase()} keeps one live map and one persistent decision sheet through completion and reload`, async ({ page }) => {
      const { overlay, sheet } = await openFresh(page, locale, { width: 390, height: 844 })
      const copy = localeCopy[locale]
      const map = page.getByTestId("maplibre-map")
      const mapHandle = await map.elementHandle()
      const sheetHandle = await sheet.elementHandle()

      await page.getByTestId("persona-nearby").click()
      await page.getByRole("button", { name: copy.start, exact: true }).click()
      await expect(overlay).toHaveAttribute("data-onboarding-step", "area")
      await expect(page.getByRole("heading", { name: copy.area, exact: true })).toBeFocused()
      expect(await sheetHandle?.evaluate((node) => node === document.querySelector("[data-testid='ondo-sheet']"))).toBe(true)
      expect(await mapHandle?.evaluate((node) => node === document.querySelector("[data-testid='maplibre-map']"))).toBe(true)

      await page.getByTestId("onboarding-area-busan").click()
      await expect(map).toHaveAttribute("data-semantic-preview-target", "busan")
      await page.getByTestId("onboarding-continue").click()
      await expect(overlay).toHaveAttribute("data-onboarding-step", "preferences")
      await expect(page.getByRole("heading", { name: copy.taste, exact: true })).toBeFocused()
      expect(await sheetHandle?.evaluate((node) => node === document.querySelector("[data-testid='ondo-sheet']"))).toBe(true)

      await page.getByTestId("onboarding-preference-classic").click()
      await page.getByTestId("onboarding-preference-cafe").click()
      await expectNoSetupPlacePreview(page)
      await page.getByRole("button", { name: copy.finish, exact: true }).click()
      await expect(page.getByTestId("ondo-onboarding-backdrop")).toHaveCount(0)
      expect(await mapHandle?.evaluate((node) => node === document.querySelector("[data-testid='maplibre-map']"))).toBe(true)
      await expect(map).toHaveAttribute("data-city-focus-target", "busan")

      expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}"), B_DEVICE_KEY)).toMatchObject({
        locale,
        onboarding: "ONB-COMPLETE",
        persona: "nearby",
        discoveryArea: "busan",
        discoveryPreferences: ["classic", "cafe"],
      })

      await page.reload({ waitUntil: "domcontentloaded" })
      await expect(page.getByTestId("ondo-onboarding-backdrop")).toHaveCount(0)
      await expect(page.getByTestId("maplibre-map")).toHaveAttribute("data-city-focus-target", "busan")
      await expectBRuntimeClean(page)
    })
  }

  test("Jeju dietary-only choices remain unverified and never produce an unsolicited place", async ({ page }) => {
    await openFresh(page, "en", { width: 390, height: 844 })
    await page.getByTestId("persona-short_trip").click()
    await page.getByTestId("onboarding-continue").click()
    await page.getByTestId("onboarding-area-jeju").click()
    await page.getByTestId("onboarding-continue").click()
    await page.getByTestId("onboarding-dietary-disclosure").click()
    await page.getByTestId("onboarding-preference-vegan").click()

    await expect(page.getByTestId("onboarding-preference-vegan")).toHaveAttribute("aria-pressed", "true")
    await expect(page.getByTestId("onboarding-step-preferences")).toContainText("Check dietary needs with each place.")
    await expectNoSetupPlacePreview(page)
    await expect(page.getByTestId("maplibre-map")).toHaveAttribute("data-semantic-preview-target", "jeju")
    await expectBRuntimeClean(page)
  })

  test("a rejected device write preserves the exact draft and retries the same completion", async ({ page }) => {
    const { overlay } = await openFresh(page, "en", { width: 390, height: 844 })
    await page.getByTestId("persona-short_trip").click()
    await page.getByTestId("onboarding-continue").click()
    await page.getByTestId("onboarding-area-jeju").click()
    await page.getByTestId("onboarding-continue").click()
    await page.getByTestId("onboarding-preference-cafe").click()

    await page.evaluate((deviceKey) => {
      const original = Storage.prototype.setItem
      ;(window as typeof window & { __ondoOriginalSetItem?: typeof Storage.prototype.setItem }).__ondoOriginalSetItem = original
      Storage.prototype.setItem = function (key, value) {
        if (this === localStorage && key === deviceKey) throw new DOMException("Injected write failure", "QuotaExceededError")
        return original.call(this, key, value)
      }
    }, B_DEVICE_KEY)

    await page.getByTestId("onboarding-finish").click()
    await expect(overlay).toHaveAttribute("data-onboarding-step", "preferences")
    await expect(page.getByTestId("onboarding-save-status")).toBeVisible()
    await expect(page.getByTestId("onboarding-preference-cafe")).toHaveAttribute("aria-pressed", "true")

    await page.evaluate(() => {
      const owner = window as typeof window & { __ondoOriginalSetItem?: typeof Storage.prototype.setItem }
      if (owner.__ondoOriginalSetItem) Storage.prototype.setItem = owner.__ondoOriginalSetItem
      delete owner.__ondoOriginalSetItem
    })
    await page.getByTestId("onboarding-finish").click()
    await expect(page.getByTestId("ondo-onboarding-backdrop")).toHaveCount(0)
    expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}"), B_DEVICE_KEY)).toMatchObject({
      onboarding: "ONB-COMPLETE",
      persona: "short_trip",
      discoveryArea: "jeju",
      discoveryPreferences: ["cafe"],
    })
    await expectBRuntimeClean(page)
  })

  test("guest escape cancels optional setup and leaves every gated axis untouched", async ({ page }) => {
    await openFresh(page, "ja", { width: 320, height: 568 })
    await page.getByTestId("onboarding-guest-skip").click()
    await expect(page.getByTestId("ondo-onboarding-backdrop")).toHaveCount(0)
    expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}"), B_DEVICE_KEY)).toMatchObject({
      onboarding: "ONB-NEW",
      persona: null,
      discoveryArea: null,
      discoveryPreferences: [],
    })
    expect(await page.evaluate(() => {
      const gates = JSON.parse(sessionStorage.getItem("ondo-b.action-gates.v1") ?? "{}") as Record<string, unknown>
      return {
        account: sessionStorage.getItem("ondo-b.account.v1"),
        person: (gates.person as { status?: string } | undefined)?.status,
        payment: (gates.payment as { status?: string } | undefined)?.status,
        pending: gates.pending ?? null,
        after19: sessionStorage.getItem("ondo-b.after19.session.v1"),
      }
    })).toEqual({ account: null, person: "unverified", payment: "unverified", pending: null, after19: null })
    await expectBRuntimeClean(page)
  })
})
