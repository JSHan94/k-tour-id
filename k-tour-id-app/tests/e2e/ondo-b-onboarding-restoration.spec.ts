import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"
import { expectNoSetupPlacePreview, openOptionalMapSetup } from "../helpers/ondo-optional-setup"

const DEVICE_KEY = "ondo-b.device.v1"
const MOBILE_VIEWPORT = { width: 390, height: 844 } as const

type DiscoveryIntent = "short_trip" | "nearby" | "living"
type DiscoveryArea = "seoul" | "busan" | "jeju" | null

const INTENT_CASES: ReadonlyArray<{
  intent: DiscoveryIntent
  area: DiscoveryArea
}> = [
  { intent: "short_trip", area: null },
  { intent: "nearby", area: "seoul" },
  { intent: "living", area: "jeju" },
]

async function openFresh(page: Page, viewport: { width: number; height: number } = MOBILE_VIEWPORT) {
  await page.setViewportSize(viewport)
  await page.addInitScript((key) => {
    if (sessionStorage.getItem("ondo-b.onboarding-restoration-seeded") === "1") return
    localStorage.removeItem(key)
    sessionStorage.setItem("ondo-b.onboarding-restoration-seeded", "1")
  }, DEVICE_KEY)
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("blockedbyclient"))
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await expect(page.locator("html")).toHaveAttribute("lang", "en")
  await openOptionalMapSetup(page)
  await expect(page.getByTestId("onboarding-step-intent")).toBeVisible()
  await expect(page.getByTestId("ondo-onboarding-backdrop")).toHaveAttribute("data-onboarding-step", "intent")
  await expect(page.getByTestId("k-tour-id-setup")).toHaveCount(0)
}

function onboardingDialog(page: Page) {
  const content = page.getByTestId("ondo-onboarding")
  return page.getByTestId("ondo-sheet").filter({ has: content })
}

async function storedDevice(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}") as Record<string, unknown>, DEVICE_KEY)
}

async function moveToArea(page: Page, intent: DiscoveryIntent) {
  const onboarding = page.getByTestId("ondo-onboarding-backdrop")
  const intentStep = page.getByTestId("onboarding-step-intent")
  const intentChoice = intentStep.getByTestId(`persona-${intent}`)
  await intentChoice.click()
  await expect(intentChoice).toHaveAttribute("aria-checked", "true")
  await onboarding.getByTestId("onboarding-continue").click()
  const areaStep = page.getByTestId("onboarding-step-area")
  await expect(areaStep).toBeVisible()
  await expect(onboarding).toHaveAttribute("data-onboarding-step", "area")
  await expect(areaStep.getByRole("heading", { name: "Where should we begin?" })).toBeFocused()
  return areaStep
}

async function moveToPreferences(page: Page, intent: DiscoveryIntent, area: DiscoveryArea) {
  const onboarding = page.getByTestId("ondo-onboarding-backdrop")
  const areaStep = await moveToArea(page, intent)
  const continueAction = onboarding.getByTestId("onboarding-continue")

  if (area === null) {
    await expect(continueAction).toBeEnabled()
  } else {
    await expect(continueAction).toBeDisabled()
    const areaChoice = areaStep.getByTestId(`onboarding-area-${area}`)
    await areaChoice.click()
    await expect(areaChoice).toHaveAttribute("aria-checked", "true")
    await expect(page.getByTestId("maplibre-map")).toHaveAttribute("data-semantic-preview-target", area)
    expect(new URL(page.url()).searchParams.get("city")).toBeNull()
    await expect(continueAction).toBeEnabled()
  }

  await continueAction.click()
  const preferences = page.getByTestId("onboarding-step-preferences")
  await expect(preferences).toBeVisible()
  await expect(onboarding).toHaveAttribute("data-onboarding-step", "preferences")
  await expect(preferences.getByRole("heading", { name: "What sounds good?" })).toBeFocused()
  return preferences
}

async function choosePreferences(page: Page, preferences: Locator) {
  const classic = preferences.getByTestId("onboarding-preference-classic")
  await classic.click()
  await expect(classic).toHaveAttribute("aria-pressed", "true")
  const dietary = preferences.getByTestId("onboarding-dietary-disclosure")
  await dietary.locator(":scope > summary").click()
  for (const id of ["vegetarian", "allergy_aware"] as const) {
    const choice = preferences.getByTestId(`onboarding-preference-${id}`)
    await choice.click()
    await expect(choice).toHaveAttribute("aria-pressed", "true")
  }
  await expectNoSetupPlacePreview(page)
}

async function expectInsideViewport(page: Page, locator: Locator) {
  const box = await locator.boundingBox()
  const viewport = page.viewportSize()
  expect(box).not.toBeNull()
  expect(viewport).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(-0.5)
  expect(box!.y).toBeGreaterThanOrEqual(-0.5)
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 0.5)
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height + 0.5)
}

async function expectNoHorizontalOverflow(page: Page, locator: Locator) {
  const [documentOverflow, surfaceOverflow] = await Promise.all([
    page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
    locator.evaluate((element) => element.scrollWidth - element.clientWidth),
  ])
  expect(documentOverflow).toBeLessThanOrEqual(1)
  expect(surfaceOverflow).toBeLessThanOrEqual(1)
}

for (const { intent, area } of INTENT_CASES) {
  test(`B onboarding completes ${intent} through the current area rule into guest Explore`, async ({ page }) => {
    await openFresh(page)
    const preferences = await moveToPreferences(page, intent, area)
    await choosePreferences(page, preferences)
    await page.getByTestId("ondo-onboarding-backdrop").getByTestId("onboarding-finish").click()

    await expect(page.getByTestId("ondo-onboarding-backdrop")).toHaveCount(0)
    await expect(page.getByTestId("k-tour-id-setup")).toHaveCount(0)
    await expect(page.getByTestId("nav-ondo")).toHaveAttribute("aria-current", "page")
    const map = page.getByTestId("ondo-b-map-entry")
    await expect(map).toHaveAttribute("data-persona", intent)
    await expect(map).toHaveAttribute("data-discovery-preferences", "classic,vegetarian,allergy_aware")
    if (area) {
      await expect(map).toHaveAttribute("data-city", area)
      await expect.poll(() => new URL(page.url()).searchParams.get("city")).toBe(area)
    } else {
      await expect(page.getByTestId("ondo-b-korea-atlas")).toBeVisible()
      expect(new URL(page.url()).searchParams.get("city")).toBeNull()
    }
    for (const testId of ["ondo-b-action-gate", "k-tour-id-setup", "checkout-overlay"]) {
      await expect(page.getByTestId(testId)).toHaveCount(0)
    }
    expect(await storedDevice(page)).toMatchObject({
      locale: "en",
      onboarding: "ONB-COMPLETE",
      persona: intent,
      discoveryArea: area,
      discoveryPreferences: ["classic", "vegetarian", "allergy_aware"],
    })

    await page.reload({ waitUntil: "domcontentloaded" })
    await expect(page.getByTestId("ondo-onboarding-backdrop")).toHaveCount(0)
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-persona", intent)
    if (area) await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-city", area)
    else await expect(page.getByTestId("ondo-b-korea-atlas")).toBeVisible()
  })
}

test("B guest skip discards an in-progress draft and returns to ungated nation Explore", async ({ page }) => {
  await openFresh(page)
  const preferences = await moveToPreferences(page, "nearby", "seoul")
  const classic = preferences.getByTestId("onboarding-preference-classic")
  await classic.click()
  await expect(classic).toHaveAttribute("aria-pressed", "true")
  await page.getByTestId("ondo-onboarding-backdrop").getByTestId("onboarding-guest-skip").click()

  await expect(page.getByTestId("ondo-onboarding-backdrop")).toHaveCount(0)
  await expect(page.getByTestId("ondo-b-korea-atlas")).toBeVisible()
  await expect(page.getByTestId("k-tour-id-setup")).toHaveCount(0)
  expect(await storedDevice(page)).toMatchObject({
    onboarding: "ONB-NEW",
    persona: null,
    discoveryArea: null,
    discoveryPreferences: [],
  })

  await page.reload({ waitUntil: "domcontentloaded" })
  await expect(page.getByTestId("ondo-onboarding-backdrop")).toHaveCount(0)
  await expect(page.getByTestId("ondo-b-korea-atlas")).toBeVisible()
})

test("B optional setup is Korean and reopens saved discovery choices without discarding them", async ({ page }) => {
  await openFresh(page)
  const onboarding = page.getByTestId("ondo-onboarding-backdrop")
  await onboarding.getByRole("button", { name: "KO", exact: true }).click()
  await expect(page.locator("html")).toHaveAttribute("lang", "ko")
  await expect(page.getByRole("heading", { name: "어떤 한국을 찾고 있나요?" })).toBeVisible()

  const living = page.getByTestId("persona-living")
  await living.click()
  await onboarding.getByTestId("onboarding-continue").click()
  const area = page.getByTestId("onboarding-step-area")
  await expect(area.getByRole("heading", { name: "어디서 시작할까요?" })).toBeFocused()
  const busan = area.getByTestId("onboarding-area-busan")
  await busan.click()
  await expect(page.getByTestId("maplibre-map")).toHaveAttribute("data-semantic-preview-target", "busan")
  expect(new URL(page.url()).searchParams.get("city")).toBeNull()
  await onboarding.getByTestId("onboarding-continue").click()
  const preferences = page.getByTestId("onboarding-step-preferences")
  await expect(preferences.getByRole("heading", { name: "지금 끌리는 건?" })).toBeFocused()
  await preferences.getByTestId("onboarding-dietary-disclosure").locator(":scope > summary").click()
  await preferences.getByTestId("onboarding-preference-vegan").click()
  await onboarding.getByTestId("onboarding-finish").click()

  await expect(onboarding).toHaveCount(0)
  await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-city", "busan")
  expect(await storedDevice(page)).toMatchObject({
    locale: "ko",
    onboarding: "ONB-COMPLETE",
    persona: "living",
    discoveryArea: "busan",
    discoveryPreferences: ["vegan"],
  })

  await page.getByTestId("nav-settings").click()
  await page.getByTestId("ondo-b-discovery-settings").click()
  await page.getByTestId("ondo-b-onboarding-reset").click()
  const restoredOnboarding = page.getByTestId("ondo-onboarding-backdrop")
  await expect(restoredOnboarding).toHaveAttribute("data-onboarding-step", "intent")
  await expect(page.getByTestId("onboarding-step-intent").getByRole("heading", { name: "어떤 한국을 찾고 있나요?" })).toBeFocused()
  await expect(page.getByTestId("ondo-b-korea-atlas")).toBeVisible()
  expect(await storedDevice(page)).toMatchObject({
    locale: "ko",
    onboarding: "ONB-COMPLETE",
    persona: "living",
    discoveryArea: "busan",
    discoveryPreferences: ["vegan"],
  })
  await expect(page.getByTestId("persona-living")).toHaveAttribute("aria-checked", "true")
  await restoredOnboarding.getByTestId("onboarding-guest-skip").click()
  await expect(restoredOnboarding).toHaveCount(0)
  expect(await storedDevice(page)).toMatchObject({
    onboarding: "ONB-COMPLETE", persona: "living", discoveryArea: "busan", discoveryPreferences: ["vegan"],
  })
  await page.reload({ waitUntil: "domcontentloaded" })
  await expect(restoredOnboarding).toHaveCount(0)
  await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-city", "busan")
})

test("B onboarding remains unclipped across 320 mobile and every current step", async ({ page }) => {
  await openFresh(page, { width: 320, height: 720 })
  const dialog = onboardingDialog(page)
  await expect(dialog).toHaveAttribute("aria-modal", "true")
  await expectInsideViewport(page, dialog)
  await expectNoHorizontalOverflow(page, dialog)

  const area = await moveToArea(page, "short_trip")
  await expectNoHorizontalOverflow(page, dialog)
  const jeju = area.getByTestId("onboarding-area-jeju")
  await jeju.click()
  await page.getByTestId("ondo-onboarding-backdrop").getByTestId("onboarding-continue").click()
  await expect(page.getByTestId("onboarding-step-preferences")).toBeVisible()
  await expectNoHorizontalOverflow(page, dialog)
  await expectInsideViewport(page, page.getByTestId("onboarding-finish"))
  await expectInsideViewport(page, page.getByTestId("onboarding-guest-skip"))
})

test("B onboarding owns focus and stays operable in short landscape", async ({ page }) => {
  await openFresh(page, { width: 844, height: 390 })
  const dialog = onboardingDialog(page)
  const intentHeading = page.getByTestId("onboarding-step-intent").getByRole("heading", { name: "What brings you here?" })
  await expect(intentHeading).toBeFocused()
  await expect(dialog).toHaveAttribute("aria-modal", "true")
  await expectNoHorizontalOverflow(page, dialog)

  const firstLanguage = dialog.getByRole("button", { name: "EN", exact: true })
  const guestSkip = dialog.getByTestId("onboarding-guest-skip")
  await guestSkip.focus()
  await page.keyboard.press("Tab")
  await expect(firstLanguage).toBeFocused()
  await firstLanguage.focus()
  await page.keyboard.press("Shift+Tab")
  await expect(guestSkip).toBeFocused()

  const area = await moveToArea(page, "nearby")
  await area.getByTestId("onboarding-area-seoul").click()
  await page.getByTestId("ondo-onboarding-backdrop").getByTestId("onboarding-continue").click()
  const preferences = page.getByTestId("onboarding-step-preferences")
  await expect(preferences).toBeVisible()
  await expectNoHorizontalOverflow(page, dialog)
  await expectInsideViewport(page, page.getByTestId("onboarding-finish"))
  await expectInsideViewport(page, page.getByTestId("onboarding-guest-skip"))

  const axe = await new AxeBuilder({ page })
    .include("[data-testid='ondo-onboarding-backdrop']")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(axe.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
})
