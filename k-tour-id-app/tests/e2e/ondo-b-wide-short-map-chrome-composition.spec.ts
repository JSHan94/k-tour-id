import { expect, test, type Locator, type Page } from "@playwright/test"
import {
  expectBRuntimeClean,
  gotoB,
  installBRuntimeGuard,
  prepareBPage,
  seedB,
  type BLocale,
} from "../helpers/ondo-b-qa"

const TILEJSON = {
  tilejson: "3.0.0",
  tiles: ["https://tiles.openfreemap.org/ondo-wide-short-empty/{z}/{x}/{y}.pbf"],
  minzoom: 0,
  maxzoom: 18,
  bounds: [124, 33, 132, 39],
}

const VIEWPORTS = [
  { id: "root-568-boundary", width: 1024, height: 616, locales: ["en"] },
  { id: "root-569-boundary", width: 1024, height: 617, locales: ["en"] },
  { id: "desktop-canvas-cap", width: 1368, height: 696, locales: ["en"] },
  { id: "reported-wide-short", width: 2196, height: 696, locales: ["en", "ko"] },
  { id: "exact-css-wide-short", width: 1098, height: 348, locales: ["en", "ko"] },
] as const satisfies ReadonlyArray<{
  id: string
  width: number
  height: number
  locales: readonly BLocale[]
}>

const AFTER19_MODES = ["off", "on"] as const

type Box = NonNullable<Awaited<ReturnType<Locator["boundingBox"]>>>

function intersectionArea(first: Box, second: Box) {
  const width = Math.max(0, Math.min(first.x + first.width, second.x + second.width) - Math.max(first.x, second.x))
  const height = Math.max(0, Math.min(first.y + first.height, second.y + second.height) - Math.max(first.y, second.y))
  return Number((width * height).toFixed(2))
}

function edgeClearance(first: Box, second: Box) {
  const horizontal = Math.max(0, first.x - (second.x + second.width), second.x - (first.x + first.width))
  const vertical = Math.max(0, first.y - (second.y + second.height), second.y - (first.y + first.height))
  return Number(Math.hypot(horizontal, vertical).toFixed(2))
}

async function requiredBox(locator: Locator, label: string) {
  await expect(locator, `${label} is visible`).toBeVisible()
  const value = await locator.boundingBox()
  expect(value, `${label} has rendered geometry`).not.toBeNull()
  return value as Box
}

async function expectContained(locator: Locator, owner: Locator, label: string) {
  const [item, container] = await Promise.all([
    requiredBox(locator, label),
    requiredBox(owner, `${label} owner`),
  ])
  expect.soft(item.x, `${label} left containment`).toBeGreaterThanOrEqual(container.x - .5)
  expect.soft(item.y, `${label} top containment`).toBeGreaterThanOrEqual(container.y - .5)
  expect.soft(item.x + item.width, `${label} right containment`).toBeLessThanOrEqual(container.x + container.width + .5)
  expect.soft(item.y + item.height, `${label} bottom containment`).toBeLessThanOrEqual(container.y + container.height + .5)
}

async function expectViewportContained(page: Page, locator: Locator, label: string) {
  const [item, viewport] = await Promise.all([
    requiredBox(locator, label),
    page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight })),
  ])
  expect.soft(item.x, `${label} clears the viewport left edge`).toBeGreaterThanOrEqual(-.5)
  expect.soft(item.y, `${label} clears the viewport top edge`).toBeGreaterThanOrEqual(-.5)
  expect.soft(item.x + item.width, `${label} clears the viewport right edge`).toBeLessThanOrEqual(viewport.width + .5)
  expect.soft(item.y + item.height, `${label} clears the viewport bottom edge`).toBeLessThanOrEqual(viewport.height + .5)
}

async function expectPairwiseZeroOverlap(
  surfaces: ReadonlyArray<{ label: string; locator: Locator }>,
) {
  const measured = await Promise.all(surfaces.map(async (surface) => ({
    ...surface,
    box: await requiredBox(surface.locator, surface.label),
  })))

  for (let first = 0; first < measured.length; first += 1) {
    for (let second = first + 1; second < measured.length; second += 1) {
      expect.soft(
        intersectionArea(measured[first].box, measured[second].box),
        `${measured[first].label} and ${measured[second].label} have zero overlap`,
      ).toBe(0)
    }
  }
}

async function expectOwnedCornerHits(locator: Locator, label: string) {
  const receipt = await locator.evaluate((element) => {
    const box = element.getBoundingClientRect()
    const inset = Math.min(12, box.width / 4, box.height / 4)
    return [
      { name: "top-left", x: box.left + inset, y: box.top + inset },
      { name: "top-right", x: box.right - inset, y: box.top + inset },
      { name: "bottom-left", x: box.left + inset, y: box.bottom - inset },
      { name: "bottom-right", x: box.right - inset, y: box.bottom - inset },
    ].map((point) => {
      const hit = document.elementFromPoint(point.x, point.y)
      return {
        ...point,
        hit: hit instanceof HTMLElement
          ? hit.getAttribute("data-testid") ?? hit.getAttribute("aria-label") ?? hit.tagName
          : null,
        owned: hit === element || (hit instanceof Node && element.contains(hit)),
      }
    })
  })

  for (const point of receipt) {
    expect.soft(point.owned, `${label} owns its ${point.name} hit at ${point.x},${point.y}; hit=${point.hit}`).toBe(true)
  }
}

async function expectPersistentSeparation(details: Locator, surface: Locator, label: string) {
  const [detailsBox, surfaceBox] = await Promise.all([
    requiredBox(details, "expanded Location details"),
    requiredBox(surface, label),
  ])
  expect.soft(
    intersectionArea(detailsBox, surfaceBox),
    `expanded Location details do not overlap ${label}`,
  ).toBeLessThanOrEqual(.5)
  expect.soft(
    edgeClearance(detailsBox, surfaceBox),
    `expanded Location details keep at least 8px from ${label}`,
  ).toBeGreaterThanOrEqual(8)
}

async function installDeterministicMap(page: Page) {
  await page.route("https://tiles.openfreemap.org/planet", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(TILEJSON),
  }))
  await page.route("https://tiles.openfreemap.org/ondo-wide-short-empty/**", (route) => route.fulfill({
    status: 200,
    contentType: "application/x-protobuf",
    body: Buffer.alloc(0),
  }))
}

async function openExpandedLocation(page: Page) {
  await gotoB(page, "?city=seoul&view=map")
  const mapRoot = page.getByTestId("ondo-b-map-entry")
  await expect(mapRoot).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
  const disclosure = page.getByTestId("ondo-b-location-message")
  await expect(disclosure).not.toHaveAttribute("open", "")
  await disclosure.locator(":scope > summary").click()
  await expect(disclosure).toHaveAttribute("open", "")
  const details = disclosure.getByTestId("ondo-b-location-details")
  await expect(details).toBeVisible()
  return { details, mapRoot }
}

async function expectComposition(
  page: Page,
  details: Locator,
  mapRoot: Locator,
  after19Surfaces: ReadonlyArray<{ label: string; locator: Locator }>,
) {
  const canvas = page.getByTestId("ondo-canvas")
  const persistent = [
    ...after19Surfaces,
    { label: "Stories", locator: page.getByTestId("ondo-b-japan-first-discovery").locator(":scope > summary") },
    { label: "locate", locator: page.getByTestId("ondo-b-locate") },
    { label: "map key", locator: page.getByTestId("ondo-b-map-key") },
    { label: "result", locator: page.getByTestId("ondo-b-result-bar") },
    { label: "attribution", locator: page.getByTestId("ondo-b-attribution") },
    { label: "navigation", locator: page.getByTestId("ondo-main-nav") },
  ]

  await expectContained(details, mapRoot, "expanded Location details")
  await expectOwnedCornerHits(details, "expanded Location details")
  for (const item of persistent) {
    await expectPersistentSeparation(details, item.locator, item.label)
    await expectContained(item.locator, item.label === "navigation" ? canvas : mapRoot, item.label)
    await expectOwnedCornerHits(item.locator, item.label)
  }
}

async function expectExactClosedUtilityComposition(
  page: Page,
  details: Locator,
  mapRoot: Locator,
  after19Surfaces: ReadonlyArray<{ label: string; locator: Locator }>,
) {
  await expect(page.getByTestId("ondo-b-japan-first-discovery")).not.toHaveAttribute("open", "")
  expect(await page.evaluate(() => ({ width: innerWidth, height: innerHeight }))).toEqual({
    width: 1098,
    height: 348,
  })

  const surfaces = [
    {
      label: "Location summary",
      locator: page.getByTestId("ondo-b-location-message").locator(":scope > summary"),
    },
    { label: "Location details", locator: details },
    { label: "locate", locator: page.getByTestId("ondo-b-locate") },
    ...after19Surfaces,
    {
      label: "closed Stories summary",
      locator: page.getByTestId("ondo-b-japan-first-discovery").locator(":scope > summary"),
    },
  ]

  for (const surface of surfaces) {
    await expectContained(surface.locator, mapRoot, surface.label)
    await expectViewportContained(page, surface.locator, surface.label)
    await expectOwnedCornerHits(surface.locator, surface.label)
  }
  await expectPairwiseZeroOverlap(surfaces)
}

async function expectStoriesOpenComposition(page: Page) {
  await gotoB(page, "?city=seoul&view=map")
  const mapRoot = page.getByTestId("ondo-b-map-entry")
  await expect(mapRoot).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })

  const location = page.getByTestId("ondo-b-location-message")
  const stories = page.getByTestId("ondo-b-japan-first-discovery")
  const summary = stories.locator(":scope > summary")
  await expect(stories).not.toHaveAttribute("open", "")
  await summary.click()
  await expect(stories).toHaveAttribute("open", "")
  await expect(location).not.toHaveAttribute("open", "")
  await expect(page.getByTestId("ondo-b-map-utility-cluster")).toHaveAttribute("data-editorial-open", "true")

  const panel = stories.locator(":scope > div")
  const header = page.getByTestId("ondo-b-city-header")
  const nav = page.getByTestId("ondo-main-nav")
  for (const surface of [
    { label: "open Stories summary", locator: summary },
    { label: "open Stories panel", locator: panel },
  ]) {
    await expectContained(surface.locator, mapRoot, surface.label)
    await expectViewportContained(page, surface.locator, surface.label)
    await expectOwnedCornerHits(surface.locator, surface.label)
    for (const boundary of [
      { label: "header", locator: header },
      { label: "navigation", locator: nav },
    ]) {
      const [surfaceBox, boundaryBox] = await Promise.all([
        requiredBox(surface.locator, surface.label),
        requiredBox(boundary.locator, boundary.label),
      ])
      expect.soft(
        intersectionArea(surfaceBox, boundaryBox),
        `${surface.label} does not collide with ${boundary.label}`,
      ).toBe(0)
    }
  }

  const scrollReceipt = await panel.evaluate((element) => {
    const style = getComputedStyle(element)
    const before = element.scrollTop
    element.scrollTop = element.scrollHeight
    return {
      before,
      after: element.scrollTop,
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      overflowY: style.overflowY,
    }
  })
  expect(scrollReceipt.overflowY, "Stories panel owns vertical scrolling").toMatch(/^(auto|scroll)$/)
  expect(scrollReceipt.scrollHeight, "Stories panel has clipped content to scroll").toBeGreaterThan(scrollReceipt.clientHeight + 1)
  expect(scrollReceipt.after, "Stories panel accepts a real vertical scroll offset").toBeGreaterThan(scrollReceipt.before)
}

test.describe("ONDO B wide-short expanded map chrome composition", () => {
  test.describe.configure({ timeout: 120_000 })

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "One Chromium owner runs the explicit desktop geometry matrix.")
    installBRuntimeGuard(page)
    await prepareBPage(page)
    await installDeterministicMap(page)
  })

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.project.name === "desktop-chromium") await expectBRuntimeClean(page)
  })

  for (const viewport of VIEWPORTS) {
    for (const locale of viewport.locales) {
      for (const mode of AFTER19_MODES) {
        test(`${viewport.id} ${viewport.width}x${viewport.height} ${locale.toUpperCase()} After19 ${mode} clears expanded Location`, async ({ page }) => {
          await page.setViewportSize(viewport)
          await seedB(page, {
            locale,
            local: { autoNight: false },
            session: mode === "on"
              ? {
                  age: "AGE-VERIFIED",
                  ageExpiresAt: "2099-08-20T20:30:00+09:00",
                  after19: "A19-ON",
                }
              : { age: "AGE-UNVERIFIED", after19: "A19-OFF" },
          })

          const { details, mapRoot } = await openExpandedLocation(page)
          const after19Root = page.getByTestId("ondo-b-after19-global")
          await expect(after19Root).toHaveAttribute("data-after19-mode", mode)

          if (mode === "off") {
            const surfaces = [
              { label: "After 19 toggle", locator: page.getByTestId("global-after19-toggle") },
            ]
            await expectComposition(page, details, mapRoot, surfaces)
            if (viewport.id === "exact-css-wide-short") {
              await expectExactClosedUtilityComposition(page, details, mapRoot, surfaces)
            }
            await expect(page.getByTestId("global-after19-banner")).toHaveCount(0)
            await expect(page.getByTestId("global-after19-off-notice")).toHaveCount(0)
            return
          }

          const banner = page.getByTestId("global-after19-banner")
          const activeSurfaces = [
            { label: "After 19 banner", locator: banner },
          ]
          await expectComposition(page, details, mapRoot, activeSurfaces)
          if (viewport.id === "exact-css-wide-short") {
            await expectExactClosedUtilityComposition(page, details, mapRoot, activeSurfaces)
          }

          await banner.getByRole("button", {
            name: locale === "ko" ? "After 19 바로 끄기" : "Turn off After 19 now",
            exact: true,
          }).click()
          await expect(after19Root).toHaveAttribute("data-after19-mode", "manual-off")
          const toggle = page.getByTestId("global-after19-toggle")
          const notice = page.getByTestId("global-after19-off-notice")
          await expect(notice).toBeVisible()
          const manualOffSurfaces = [
            { label: "After 19 toggle after manual off", locator: toggle },
            { label: "After 19 off notice", locator: notice },
          ]
          await expectComposition(page, details, mapRoot, manualOffSurfaces)
          if (viewport.id === "exact-css-wide-short") {
            await expectExactClosedUtilityComposition(page, details, mapRoot, manualOffSurfaces)
          }
        })
      }
    }
  }

  for (const locale of ["en", "ko"] as const) {
    test(`exact-css-wide-short 1098x348 ${locale.toUpperCase()} open Stories stays contained and scrolls`, async ({ page }) => {
      await page.setViewportSize({ width: 1098, height: 348 })
      await seedB(page, {
        locale,
        local: { autoNight: false },
        session: { age: "AGE-UNVERIFIED", after19: "A19-OFF" },
      })

      await expectStoriesOpenComposition(page)
    })
  }
})
