import { mkdirSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test, type Browser, type Locator, type Page } from "@playwright/test"

type Locale = "en" | "ko" | "ja"

const DEVICE_KEY = "ondo-b.device.v1"
const OUTPUT = resolve(process.cwd(), "artifacts/qa/onboarding-arc")
const PROFILES = [
  { id: "320x720", width: 320, height: 720 },
  { id: "390x844", width: 390, height: 844 },
  { id: "844x390", width: 844, height: 390 },
  { id: "1440x1000", width: 1440, height: 1000 },
] as const

async function openFresh(browser: Browser, locale: Locale, profile: (typeof PROFILES)[number], reducedMotion: "no-preference" | "reduce" = "no-preference") {
  const context = await browser.newContext({ viewport: profile, reducedMotion })
  const page = await context.newPage()
  await page.addInitScript(({ key, language }) => {
    localStorage.setItem(key, JSON.stringify({
      locale: language,
      onboarding: "ONB-NEW",
      persona: null,
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
      recentVenueIds: [],
      plannedTableRefs: [],
      localSignalPostedVenueIds: [],
      localPulseEvidenceByVenue: {},
      localInteractionBoundarySeen: false,
      commerceLocalBoundarySeen: false,
      commerceReceipts: [],
    }))
  }, { key: DEVICE_KEY, language: locale })
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("blockedbyclient"))
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
  await expect(page.locator("html")).toHaveAttribute("lang", locale)
  await expect(page.getByTestId("ondo-onboarding")).toBeVisible()
  return { context, page }
}

async function rect(locator: Locator) {
  const value = await locator.boundingBox()
  expect(value).not.toBeNull()
  return value!
}

async function expectInsideViewport(page: Page, locator: Locator) {
  const box = await rect(locator)
  const viewport = page.viewportSize()!
  expect(box.x).toBeGreaterThanOrEqual(-.5)
  expect(box.y).toBeGreaterThanOrEqual(-.5)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + .5)
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + .5)
}

async function expectInsideDialog(page: Page, dialog: Locator, locator: Locator, bottomClearance = 0) {
  const [layer, control] = await Promise.all([rect(dialog), rect(locator)])
  expect(control.x).toBeGreaterThanOrEqual(layer.x - .5)
  expect(control.y).toBeGreaterThanOrEqual(layer.y - .5)
  expect(control.x + control.width).toBeLessThanOrEqual(layer.x + layer.width + .5)
  expect(control.y + control.height).toBeLessThanOrEqual(layer.y + layer.height - bottomClearance + .5)
  expect(await page.evaluate(({ x, y }) => {
    const hit = document.elementFromPoint(x, y)
    return Boolean(hit?.closest("button, summary"))
  }, { x: control.x + control.width / 2, y: control.y + control.height / 2 })).toBe(true)
}

async function expectControlGeometry(scope: Locator) {
  const controls = scope.locator("button:visible, summary:visible")
  const boxes = await controls.evaluateAll((elements) => elements.map((element) => {
    const bounds = element.getBoundingClientRect()
    return { width: bounds.width, height: bounds.height }
  }))
  expect(boxes.length).toBeGreaterThan(0)
  expect(boxes.every(({ height }) => height >= 44)).toBe(true)
}

async function expectNoHorizontalOverflow(page: Page, scope: Locator) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1)
  expect(await scope.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)
}

async function capture(page: Page, locale: Locale, profile: (typeof PROFILES)[number], stage: string) {
  await page.screenshot({ path: resolve(OUTPUT, `${locale}-${profile.id}-${stage}.png`), animations: "disabled" })
}

test.describe("ONDO Arc guest onboarding visual direction", () => {
  test.describe.configure({ mode: "serial", timeout: 360_000 })
  test.beforeAll(() => mkdirSync(OUTPUT, { recursive: true }))

  for (const locale of ["en", "ko", "ja"] as const) {
    test(`${locale.toUpperCase()} value, intent and preferences form one directional journey`, async ({ browser }) => {
      for (const profile of PROFILES) {
        const { context, page } = await openFresh(browser, locale, profile)
        const dialog = page.getByTestId("ondo-onboarding")
        await expect(dialog).toHaveAttribute("data-visual-direction", "arc-narrative")
        await expect(dialog).toHaveAttribute("data-onboarding-step", "value")
        await expect(page.getByTestId("onboarding-source-boundary")).not.toHaveAttribute("open", "")
        await expectControlGeometry(dialog)
        await expectNoHorizontalOverflow(page, dialog)

        const value = page.getByTestId("onboarding-step-value")
        const valuePrimary = value.locator("button").first()
        const valueSecondary = value.locator("button").last()
        await expectInsideViewport(page, valuePrimary)
        await expectInsideViewport(page, valueSecondary)
        await expectInsideDialog(page, dialog, valuePrimary, 16)
        await expectInsideDialog(page, dialog, valueSecondary, 16)
        const actionHierarchy = await Promise.all([valuePrimary, valueSecondary].map((control) => control.evaluate((element) => {
          const style = getComputedStyle(element)
          return { background: style.backgroundImage, shadow: style.boxShadow, weight: Number.parseFloat(style.fontWeight) }
        })))
        expect(actionHierarchy[0].background).not.toBe(actionHierarchy[1].background)
        expect(actionHierarchy[0].shadow).not.toBe("none")
        expect(actionHierarchy[0].weight).toBeGreaterThanOrEqual(actionHierarchy[1].weight)
        await capture(page, locale, profile, "value")

        await valuePrimary.click()
        const intent = page.getByTestId("onboarding-step-intent")
        await expect(dialog).toHaveAttribute("data-onboarding-step", "intent")
        await expect(intent).toBeVisible()
        await expectControlGeometry(intent)
        await expectNoHorizontalOverflow(page, dialog)
        if (profile.width === 844) {
          const notes = await intent.locator("[data-testid^='persona-'] small").evaluateAll((elements) => elements.map((element) => ({
            horizontalOverflow: element.scrollWidth - element.clientWidth,
            verticalOverflow: element.scrollHeight - element.clientHeight,
            textOverflow: getComputedStyle(element).textOverflow,
          })))
          expect(notes.every((note) => note.horizontalOverflow <= 1 && note.verticalOverflow <= 1 && note.textOverflow !== "ellipsis")).toBe(true)
        }
        await intent.getByTestId("persona-travelling").click()
        const intentPrimary = intent.locator(".primary, button").filter({ hasText: /preferences|취향|好み/ }).first()
        await expectInsideViewport(page, intentPrimary)
        await expectInsideDialog(page, dialog, intentPrimary, 16)
        await page.waitForTimeout(340)
        await capture(page, locale, profile, "intent")

        await intentPrimary.click()
        const preferences = page.getByTestId("onboarding-step-preferences")
        await expect(dialog).toHaveAttribute("data-onboarding-step", "preferences")
        await expect(preferences).toBeVisible()
        await expectControlGeometry(preferences)
        await expectNoHorizontalOverflow(page, dialog)
        await expectInsideViewport(page, preferences.getByTestId("onboarding-finish"))
        await expectInsideDialog(page, dialog, preferences.getByTestId("onboarding-finish"), 16)
        await page.waitForTimeout(340)
        await capture(page, locale, profile, "preferences")

        if (profile.width >= 1200) {
          const heading = await rect(preferences.locator("h1"))
          const choices = await rect(preferences.locator("section").first())
          expect(heading.x + heading.width).toBeLessThan(choices.x)
        }
        await context.close()
      }
    })
  }

  test("motion is purposeful in the default mode and absent for reduced motion", async ({ browser }) => {
    const profile = PROFILES[1]
    const normal = await openFresh(browser, "en", profile)
    const normalAnimation = await normal.page.getByTestId("onboarding-step-value").evaluate((element) => getComputedStyle(element).animationName)
    expect(normalAnimation).toContain("onboardingStageIn")
    await normal.context.close()

    const reduced = await openFresh(browser, "en", profile, "reduce")
    const animations = await reduced.page.getByTestId("ondo-onboarding").locator("*").evaluateAll((elements) => elements
      .map((element) => getComputedStyle(element).animationName)
      .filter((name) => name !== "none"))
    expect(animations).toEqual([])
    await reduced.context.close()
  })

  test("a device-storage failure keeps the selected draft and retry action legible", async ({ browser }) => {
    const { context, page } = await openFresh(browser, "en", PROFILES[1])
    await page.getByTestId("onboarding-step-value").locator("button").first().click()
    await page.getByTestId("persona-travelling").click()
    await page.getByTestId("onboarding-step-intent").getByRole("button", { name: "Choose food preferences", exact: true }).click()
    const preferences = page.getByTestId("onboarding-step-preferences")
    const choice = preferences.getByRole("button", { name: "Local classics", exact: true })
    await choice.click()
    await page.evaluate((key) => {
      const original = Storage.prototype.setItem
      let rejected = false
      Storage.prototype.setItem = function (name: string, value: string) {
        if (name === key && !rejected) {
          rejected = true
          throw new DOMException("Quota exceeded", "QuotaExceededError")
        }
        return original.call(this, name, value)
      }
    }, DEVICE_KEY)
    await preferences.getByTestId("onboarding-finish").click()
    await expect(preferences).toBeVisible()
    await expect(choice).toHaveAttribute("aria-pressed", "true")
    await expect(page.getByTestId("ondo-toast")).toBeVisible()
    await expect(preferences.getByTestId("onboarding-save-status")).toBeVisible()
    await page.waitForTimeout(2_300)
    await expect(page.getByTestId("ondo-toast")).toHaveCount(0)
    await expect(preferences.getByTestId("onboarding-save-status")).toBeVisible()
    await expectInsideViewport(page, preferences.getByTestId("onboarding-finish"))
    await preferences.getByTestId("onboarding-finish").click()
    await expect(page.getByTestId("ondo-onboarding")).toHaveCount(0)
    await context.close()
  })
})
