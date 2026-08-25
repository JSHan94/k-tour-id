import { expect, test, type Locator, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const VIEWPORTS = [
  { label: "portrait-360", width: 360, height: 800 },
  { label: "portrait-390", width: 390, height: 844 },
  { label: "portrait-430", width: 430, height: 932 },
  { label: "tablet-768", width: 768, height: 1024 },
  { label: "desktop-801", width: 801, height: 1000 },
  { label: "desktop-1440", width: 1440, height: 1000 },
  { label: "landscape-844", width: 844, height: 390 },
  { label: "landscape-threshold-667", width: 667, height: 501 },
  { label: "landscape-threshold-768", width: 768, height: 501 },
  { label: "landscape-844x520", width: 844, height: 520 },
  { label: "landscape-844x568", width: 844, height: 568 },
  { label: "landscape-wide-1280", width: 1280, height: 720 },
] as const

type Box = NonNullable<Awaited<ReturnType<Locator["boundingBox"]>>>
type Receipt = {
  locale: "en" | "ko"
  viewport: string
  state: "idle" | "ready"
  boxes: Record<string, Box>
  intersections: Record<string, number>
}

async function seedProductionDirectory(page: Page, locale: "en" | "ko") {
  await page.addInitScript(({ key, nextLocale }) => {
    window.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style")
      style.textContent = "nextjs-portal { display: none !important; }"
      document.head.append(style)
    }, { once: true })
    localStorage.setItem(key, JSON.stringify({
      locale: nextLocale,
      onboarding: "ONB-COMPLETE",
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
    }))
  }, { key: DEVICE_KEY, nextLocale: locale })
}

async function box(locator: Locator) {
  const value = await locator.boundingBox()
  expect(value).not.toBeNull()
  return value as Box
}

function intersectionArea(first: Box, second: Box) {
  const width = Math.max(0, Math.min(first.x + first.width, second.x + second.width) - Math.max(first.x, second.x))
  const height = Math.max(0, Math.min(first.y + first.height, second.y + second.height) - Math.max(first.y, second.y))
  return Number((width * height).toFixed(2))
}

async function expectVisibleText(locator: Locator, label: string, viewport: { width: number; height: number }) {
  await expect(locator, `${label} must remain visible`).toBeVisible()
  const metrics = await locator.evaluate((node) => {
    const element = node as HTMLElement
    const rect = element.getBoundingClientRect()
    const style = getComputedStyle(element)
    return {
      text: element.innerText.trim(),
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      visibility: style.visibility,
      display: style.display,
      opacity: Number(style.opacity),
      clientWidth: element.clientWidth,
      clientHeight: element.clientHeight,
      scrollWidth: element.scrollWidth,
      scrollHeight: element.scrollHeight,
    }
  })
  expect(metrics.text, `${label} text must not be removed`).not.toBe("")
  expect(metrics.visibility, `${label} text must not be hidden`).toBe("visible")
  expect(metrics.display, `${label} text must not be removed from layout`).not.toBe("none")
  expect(metrics.opacity, `${label} text must remain opaque enough to read`).toBeGreaterThan(0)
  expect(metrics.left, `${label} must stay in the viewport`).toBeGreaterThanOrEqual(-.5)
  expect(metrics.top, `${label} must stay in the viewport`).toBeGreaterThanOrEqual(-.5)
  expect(metrics.right, `${label} must stay in the viewport`).toBeLessThanOrEqual(viewport.width + .5)
  expect(metrics.bottom, `${label} must stay in the viewport`).toBeLessThanOrEqual(viewport.height + .5)
  expect(metrics.scrollWidth, `${label} text must not be horizontally clipped`).toBeLessThanOrEqual(metrics.clientWidth + 1)
  expect(metrics.scrollHeight, `${label} text must not be vertically clipped`).toBeLessThanOrEqual(metrics.clientHeight + 1)
}

async function chromeReceipt(
  page: Page,
  locale: "en" | "ko",
  viewport: (typeof VIEWPORTS)[number],
  state: "idle" | "ready",
) {
  const key = page.getByTestId("ondo-b-map-key")
  const locate = page.getByTestId("ondo-b-locate")
  const message = page.getByTestId("ondo-b-location-message")
  const view = page.getByTestId("ondo-b-view-toggle")
  const nav = page.getByTestId("ondo-main-nav")
  const navButtons = nav.getByRole("button")

  await expect(navButtons).toHaveCount(5)
  await expect(message).toHaveCount(1)
  await expect(message).toHaveAttribute("data-message-kind", state === "idle" ? "disclosure" : "status")
  await expect(message).toContainText(state === "idle"
    ? "OpenFreeMap"
    : locale === "en" ? "You’re here" : "현재 위치")
  await expect(locate).toHaveAttribute("aria-describedby", "ondo-b-location-message")
  const keyDetails = key.getByTestId("ondo-b-map-key-details")
  await keyDetails.locator("summary").click()
  const keyTruth = key.locator("small")
  await expect(keyTruth).toHaveCount(2)
  for (let index = 0; index < 2; index += 1) await expectVisibleText(keyTruth.nth(index), `${state} map explanation ${index + 1}`, viewport)
  await keyDetails.locator("summary").click()
  await expectVisibleText(message, `${state} location message`, viewport)
  await expectVisibleText(view, `${state} view control`, viewport)
  for (let index = 0; index < 5; index += 1) {
    await expectVisibleText(navButtons.nth(index), `${state} navigation item ${index + 1}`, viewport)
  }

  const boxes: Record<string, Box> = {
    key: await box(key),
    locate: await box(locate),
    message: await box(message),
    view: await box(view),
    nav: await box(nav),
  }
  for (const [name, control] of [
    ["locate", locate],
    ["view", view],
    ["nav-1", navButtons.nth(0)],
    ["nav-2", navButtons.nth(1)],
    ["nav-3", navButtons.nth(2)],
    ["nav-4", navButtons.nth(3)],
    ["nav-5", navButtons.nth(4)],
  ] as const) {
    const controlBox = await box(control)
    expect(controlBox.width, `${name} must keep a 44px hit target`).toBeGreaterThanOrEqual(44)
    expect(controlBox.height, `${name} must keep a 44px hit target`).toBeGreaterThanOrEqual(44)
  }

  const intersections = {
    "key-locate": intersectionArea(boxes.key, boxes.locate),
    "key-message": intersectionArea(boxes.key, boxes.message),
    "key-view": intersectionArea(boxes.key, boxes.view),
    "key-nav": intersectionArea(boxes.key, boxes.nav),
    "locate-message": intersectionArea(boxes.locate, boxes.message),
    "locate-view": intersectionArea(boxes.locate, boxes.view),
    "locate-nav": intersectionArea(boxes.locate, boxes.nav),
    "message-view": intersectionArea(boxes.message, boxes.view),
    "message-nav": intersectionArea(boxes.message, boxes.nav),
  }

  return { locale, viewport: viewport.label, state, boxes, intersections } satisfies Receipt
}

test.describe("ONDO B production map chrome geometry", () => {
  test.describe.configure({ timeout: 240_000 })

  for (const locale of ["en", "ko"] as const) {
    test(`${locale.toUpperCase()} keeps truthful map chrome independent across production viewports`, async ({ context, page }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop-chromium", "The explicit viewport matrix has one Chromium owner.")
      await context.grantPermissions(["geolocation"])
      await context.setGeolocation({ longitude: 127.0557, latitude: 37.5445 })
      await seedProductionDirectory(page, locale)
      const receipts: Receipt[] = []

      for (const viewport of VIEWPORTS) {
        await page.setViewportSize(viewport)
        await page.goto("/ondo-b?city=seoul", { waitUntil: "domcontentloaded" })
        const root = page.getByTestId("ondo-b-map-entry")
        await expect(root).toHaveAttribute("data-layout-mode", /^(ultra-short|compact-map|spacious-map)$/)
        if (await root.getAttribute("data-layout-mode") === "ultra-short") {
          await expect(root).toHaveAttribute("data-requested-view", "map")
          await expect(root).toHaveAttribute("data-effective-view", "list")
          await expect(page.getByTestId("ondo-b-list-panel")).toBeVisible()
          await expect(page.getByTestId("ondo-b-location-message")).toHaveCount(0)
          await expect(page.getByTestId("ondo-b-locate")).toHaveCount(0)
          await expect(page.getByTestId("ondo-b-map-key")).toHaveCount(0)
          await expect(page.getByTestId("ondo-b-attribution")).toHaveCount(0)
          continue
        }
        await expect(root).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })

        receipts.push(await chromeReceipt(page, locale, viewport, "idle"))
        await page.getByTestId("ondo-b-locate").click()
        await expect(root).toHaveAttribute("data-location-state", "ready")
        receipts.push(await chromeReceipt(page, locale, viewport, "ready"))
      }

      const collisions = receipts.flatMap((receipt) => Object.entries(receipt.intersections)
        .filter(([, area]) => area > .5)
        .map(([pair, area]) => ({
          locale: receipt.locale,
          viewport: receipt.viewport,
          state: receipt.state,
          pair,
          area,
          boxes: receipt.boxes,
        })))
      expect(collisions, `map chrome collision receipts:\n${JSON.stringify(receipts, null, 2)}`).toEqual([])
    })
  }
})
