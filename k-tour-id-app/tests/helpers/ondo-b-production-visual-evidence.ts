import AxeBuilder from "@axe-core/playwright"
import { expect, type Locator, type Page, type TestInfo } from "@playwright/test"
import type {
  BProductionStructuralVisualCase,
  BProductionVisualCase,
} from "./ondo-b-production-registry"

const DEVICE_KEY = "ondo-b.device.v1"
const CANONICAL_VENUE_ID = "mois-0021cd596bc5b2a922ad"
const MAP_HOSTS = new Set(["tiles.openfreemap.org"])
const STRUCTURAL_TILEJSON = {
  tilejson: "3.0.0",
  tiles: ["https://tiles.openfreemap.org/ondo-production-visual-empty/{z}/{x}/{y}.pbf"],
  minzoom: 0,
  maxzoom: 18,
  bounds: [124, 33, 132, 39],
} as const

export const PRODUCTION_VISUAL_VIEWPORTS = [
  { id: "360x800", width: 360, height: 800, owner: "responsive" },
  { id: "390x844", width: 390, height: 844, owner: "mobile" },
  { id: "430x932", width: 430, height: 932, owner: "responsive" },
  { id: "768x1024", width: 768, height: 1024, owner: "responsive" },
  { id: "801x1000", width: 801, height: 1000, owner: "responsive" },
  { id: "1440x1000", width: 1440, height: 1000, owner: "desktop" },
] as const

export type ProductionVisualViewport = (typeof PRODUCTION_VISUAL_VIEWPORTS)[number]
export type ProductionVisualViewportLike = ProductionVisualViewport | BProductionStructuralVisualCase["viewport"]

type RuntimeEvidence = {
  product: string[]
  externalMap: string[]
}

const runtimeEvidence = new WeakMap<Page, RuntimeEvidence>()

function mapRequest(raw: string | undefined) {
  if (!raw) return false
  try {
    return MAP_HOSTS.has(new URL(raw).hostname)
  } catch {
    return [...MAP_HOSTS].some((host) => raw.includes(host))
  }
}

export function installBProductionRuntimeGuard(page: Page) {
  const evidence: RuntimeEvidence = { product: [], externalMap: [] }
  runtimeEvidence.set(page, evidence)
  page.on("console", (message) => {
    if (message.type() !== "error") return
    const location = message.location().url
    const item = `console: ${message.text()}${location ? ` @ ${location}` : ""}`
    if (mapRequest(location) || mapRequest(message.text())) evidence.externalMap.push(item)
    else evidence.product.push(item)
  })
  page.on("pageerror", (error) => evidence.product.push(`pageerror: ${error.message}`))
  page.on("requestfailed", (request) => {
    const item = `requestfailed: ${request.url()} · ${request.failure()?.errorText ?? "request failed"}`
    if (mapRequest(request.url())) evidence.externalMap.push(item)
    else evidence.product.push(item)
  })
  page.on("response", (response) => {
    if (response.status() < 400) return
    const item = `response: ${response.status()} ${response.url()}`
    if (mapRequest(response.url())) evidence.externalMap.push(item)
    else evidence.product.push(item)
  })
}

export async function expectBProductionRuntimeClean(page: Page) {
  const evidence = runtimeEvidence.get(page)
  if (!evidence) throw new Error("production runtime guard was not installed")
  expect(evidence.product, "product runtime errors; external OpenFreeMap transport is classified separately").toEqual([])
}

export async function prepareBProductionVisualPage(page: Page) {
  await page.route("https://tiles.openfreemap.org/planet", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(STRUCTURAL_TILEJSON),
  }))
  await page.route("https://tiles.openfreemap.org/ondo-production-visual-empty/**", (route) => route.fulfill({
    status: 200,
    contentType: "application/x-protobuf",
    body: Buffer.alloc(0),
  }))
  await page.route("https://tiles.openfreemap.org/fonts/**", (route) => route.fulfill({
    status: 200,
    contentType: "application/x-protobuf",
    body: Buffer.alloc(0),
  }))
  installBProductionRuntimeGuard(page)
  await page.addInitScript(() => {
    window.addEventListener("unhandledrejection", (event) => console.error(`unhandledrejection: ${String(event.reason)}`))
    window.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style")
      style.dataset.productionVisualHarness = "true"
      style.textContent = [
        "nextjs-portal{display:none!important}",
        "*,*::before,*::after{animation-delay:0s!important;animation-duration:0s!important;transition-delay:0s!important;transition-duration:0s!important;caret-color:transparent!important}",
      ].join("")
      document.head.append(style)
    }, { once: true })
  })
}

export async function prepareBProductionStructuralVisualPage(page: Page) {
  await prepareBProductionVisualPage(page)
}

async function seedDevice(page: Page, item: BProductionVisualCase, options: {
  onboarding?: "ONB-NEW" | "ONB-COMPLETE"
  savedVenueIds?: string[]
  privateNotesByVenue?: Record<string, string>
  discoveryPreferences?: string[]
} = {}) {
  await page.addInitScript(({ key, locale, state }) => {
    localStorage.setItem(key, JSON.stringify({
      locale,
      onboarding: state.onboarding,
      discoveryPreferences: state.discoveryPreferences,
      savedVenueIds: state.savedVenueIds,
      privateNotesByVenue: state.privateNotesByVenue,
    }))
  }, {
    key: DEVICE_KEY,
    locale: item.locale,
    state: {
      onboarding: options.onboarding ?? "ONB-COMPLETE",
      discoveryPreferences: options.discoveryPreferences ?? [],
      savedVenueIds: options.savedVenueIds ?? [],
      privateNotesByVenue: options.privateNotesByVenue ?? {},
    },
  })
}

async function gotoProductionB(page: Page, locale: BProductionVisualCase["locale"]) {
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
  const root = page.getByTestId("ondo-b-root")
  await expect(root).toBeVisible()
  await expect(root).toHaveAttribute("data-variant", "B")
  await expect(root).toHaveAttribute("data-locale", locale)
  return root
}

async function openCity(page: Page, city: "seoul" | "busan" = "seoul") {
  await page.locator(`[data-testid='ondo-b-nation'] [data-city='${city}']`).click()
  const root = page.getByTestId("ondo-b-map-entry")
  await expect(root).toHaveAttribute("data-city-record-count", "200")
  return root
}

async function waitForMap(page: Page, state: "ready" | "error" = "ready") {
  await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-map-state", state, { timeout: 15_000 })
  if (state === "ready") await page.waitForTimeout(300)
}

async function openCityList(page: Page) {
  const root = await openCity(page)
  await root.getByTestId("ondo-b-view-toggle").click()
  await expect(page.getByTestId("ondo-b-list-panel")).toBeVisible()
  await expect(page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id]")).toHaveCount(30)
  return root
}

async function openFirstPlace(page: Page) {
  await openCityList(page)
  await page.getByTestId("ondo-b-search").fill("로바")
  await expect(page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id]")).toHaveCount(1)
  await page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id] button").first().click()
  const peek = page.getByTestId("canonical-place-peek")
  await expect(peek).toHaveAttribute("data-venue-id", CANONICAL_VENUE_ID)
  await expect(peek).toBeVisible()
  return peek
}

export async function setupBProductionVisualCase(page: Page, item: BProductionVisualCase): Promise<Locator> {
  if (item.setup === "first-run") {
    await seedDevice(page, item, { onboarding: "ONB-NEW" })
    await gotoProductionB(page, item.locale)
  } else {
    const savedVenueIds = ["saved-place", "private-note", "reset-confirm"].includes(item.setup) ? [CANONICAL_VENUE_ID] : []
    const privateNotesByVenue: Record<string, string> = item.setup === "private-note" || item.setup === "reset-confirm"
      ? { [CANONICAL_VENUE_ID]: item.locale === "ko" ? "주문은 카운터에서 먼저 하기" : "Order at the counter before taking a seat." }
      : {}
    const discoveryPreferences = ["settings", "reset-confirm"].includes(item.setup) ? ["local", "calm"] : []
    await seedDevice(page, item, { savedVenueIds, privateNotesByVenue, discoveryPreferences })

    if (item.setup === "location-ready") {
      await page.context().setGeolocation({ longitude: 126.987, latitude: 37.565 })
      await page.context().grantPermissions(["geolocation"])
    } else if (item.setup === "location-denied") {
      await page.context().clearPermissions()
    }
    await gotoProductionB(page, item.locale)
  }

  if (item.setup === "nation" || item.setup === "first-run") {
    // The initial route already owns the requested surface.
  } else if (item.setup === "city-map") {
    await openCity(page)
    await waitForMap(page)
  } else if (item.setup === "city-list") {
    await openCityList(page)
  } else if (item.setup === "search-results" || item.setup === "search-empty") {
    await openCityList(page)
    const search = page.getByTestId("ondo-b-search")
    await search.fill(item.setup === "search-results" ? "로바" : "검색결과없음zz")
    if (item.setup === "search-results") {
      await expect(page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id]")).toHaveCount(1)
    } else {
      await expect(page.getByTestId("ondo-b-empty-results")).toBeVisible()
    }
  } else if (item.setup === "place-peek" || item.setup === "directions") {
    const peek = await openFirstPlace(page)
    if (item.setup === "directions") {
      const directions = peek.getByTestId("canonical-venue-directions")
      await expect(directions).toHaveAttribute("href", /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=-?\d+(?:\.\d+)?%2C-?\d+(?:\.\d+)?$/)
    }
  } else if (item.setup === "place-detail") {
    const peek = await openFirstPlace(page)
    await peek.getByTestId("canonical-place-details").click()
    const detail = page.getByTestId("canonical-place-overlay")
    await expect(detail.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")
  } else if (item.setup === "history-return") {
    await openCityList(page)
    const search = page.getByTestId("ondo-b-search")
    await search.fill("로바")
    await expect(page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id]")).toHaveCount(1)
    await page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id] button").first().click()
    await page.getByTestId("canonical-place-details").click()
    await expect(page.getByTestId("canonical-place-overlay").locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")
    await page.goBack()
    await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
    await page.goBack()
    await expect(page.getByTestId("ondo-b-list-panel")).toBeVisible()
    await expect(search).toHaveValue("로바")
  } else if (item.setup === "location-ready" || item.setup === "location-denied") {
    await openCity(page)
    await waitForMap(page)
    await page.getByTestId("ondo-b-locate").click()
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-location-state", item.setup === "location-ready" ? "ready" : "denied", { timeout: 15_000 })
    if (item.setup === "location-ready") {
      await expect(page.getByTestId("ondo-b-user-location-marker")).toBeAttached()
      await page.waitForTimeout(1_000)
    }
  } else if (item.setup === "offline-fallback") {
    await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("failed"))
    await openCity(page)
    await waitForMap(page, "error")
    await page.context().setOffline(true)
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-connectivity", "offline")
    await expect(page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id]")).toHaveCount(30)
  } else if (item.setup === "saved-empty" || item.setup === "saved-place" || item.setup === "private-note") {
    await page.getByTestId("nav-my").click()
    await expect(page.getByTestId("ondo-b-saved-entry")).toBeVisible()
    if (item.setup === "saved-empty") await expect(page.getByTestId("ondo-b-saved-entry").getByLabel("No saved places")).toBeVisible()
  } else if (item.setup === "settings" || item.setup === "reset-confirm") {
    await page.getByTestId("nav-settings").click()
    await expect(page.getByTestId("ondo-b-settings-entry")).toBeVisible()
    if (item.setup === "reset-confirm") {
      await page.getByTestId("ondo-b-device-data-settings").locator("summary").click()
      await page.getByTestId("ondo-b-clear-device-open").click()
      await expect(page.getByTestId("ondo-b-clear-device-confirm")).toBeVisible()
    }
  } else {
    throw new Error(`No production visual setup for ${item.setup}`)
  }

  const scope = page.locator(item.surfaceSelector)
  await expect(scope).toBeVisible()
  return scope
}

export async function setupBProductionStructuralVisualCase(page: Page, item: BProductionStructuralVisualCase): Promise<Locator> {
  await seedDevice(page, item)
  await gotoProductionB(page, item.locale)
  const root = await openCity(page)
  await expect(root).toHaveAttribute("data-layout-mode", item.expectedLayoutMode)
  await expect(root).toHaveAttribute("data-requested-view", item.expectedRequestedView)
  await expect(root).toHaveAttribute("data-effective-view", item.expectedEffectiveView)
  if (item.expectedEffectiveView === "map") {
    await waitForMap(page)
  } else {
    await expect(page.getByTestId("ondo-b-list-panel")).toBeVisible()
    await expect(page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id]")).toHaveCount(30)
  }
  const scope = page.locator(item.surfaceSelector)
  await expect(scope).toBeVisible()
  return scope
}

export async function stabilizeBProductionVisual(page: Page, item: BProductionVisualCase) {
  await expect(page.getByTestId("ondo-b-root")).toHaveAttribute("data-locale", item.locale)
  await page.evaluate(async () => {
    await Promise.race([
      Promise.all([
        document.fonts.ready,
        ...Array.from(document.images).map((image) => image.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              image.addEventListener("load", () => resolve(), { once: true })
              image.addEventListener("error", () => resolve(), { once: true })
            })),
      ]),
      new Promise<void>((resolve) => window.setTimeout(resolve, 3_000)),
    ])
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
  })
  await page.waitForTimeout(120)
  if (item.setup === "directions") {
    const details = page.getByTestId("canonical-place-details")
    const directions = page.getByTestId("canonical-venue-directions")
    await details.focus()
    await expect(details).toBeFocused()
    await page.keyboard.press("Shift+Tab")
    await expect(directions).toBeFocused()
  }
}

async function expectNoOverflowOrClipping(page: Page, root: Locator) {
  const documentOverflow = await page.evaluate(() => ({
    horizontal: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    vertical: document.documentElement.scrollHeight - document.documentElement.clientHeight,
  }))
  expect(documentOverflow.horizontal, "document horizontal overflow").toBeLessThanOrEqual(1)
  expect(documentOverflow.vertical, "document vertical overflow").toBeLessThanOrEqual(1)

  const rootOverflow = await root.evaluate((element) => ({
    horizontal: element.scrollWidth - element.clientWidth,
    vertical: element.scrollHeight - element.clientHeight,
  }))
  expect(rootOverflow.horizontal, "ONDO B root horizontal overflow").toBeLessThanOrEqual(1)
  expect(rootOverflow.vertical, "ONDO B root vertical overflow").toBeLessThanOrEqual(1)

  const clipped = await root.locator("h1,h2,h3,[role='status'],[role='alert'],button,a,label,dt,dd").evaluateAll((nodes) => nodes.flatMap((node) => {
    const element = node as HTMLElement
    const style = getComputedStyle(element)
    const box = element.getBoundingClientRect()
    if (box.width < 2 || box.height < 2 || box.bottom <= 0 || box.right <= 0 || box.top >= innerHeight || box.left >= innerWidth) return []
    if (element.closest("[aria-hidden='true'],[inert],.maplibregl-control-container")) return []
    const ownText = Array.from(element.childNodes).filter((child) => child.nodeType === Node.TEXT_NODE).map((child) => child.textContent ?? "").join(" ").trim()
    if (!ownText) return []
    const horizontal = ["hidden", "clip"].includes(style.overflowX) && element.scrollWidth - element.clientWidth > 1
    const vertical = ["hidden", "clip"].includes(style.overflowY) && element.scrollHeight - element.clientHeight > 1
    return horizontal || vertical ? [{ tag: element.tagName, text: ownText.slice(0, 90), horizontal, vertical }] : []
  }))
  expect(clipped, "visible critical copy must not clip").toEqual([])
}

async function expectMinimumTargetsAndType(root: Locator) {
  const undersizedControls = await root.locator("button:visible,a[href]:visible,input:visible,textarea:visible,select:visible,[role='button']:visible").evaluateAll((nodes) => nodes.flatMap((node) => {
    const element = node as HTMLElement
    if (element.closest("[aria-hidden='true'],[inert],.maplibregl-control-container")) return []
    if (element instanceof HTMLButtonElement && element.disabled) return []
    const box = element.getBoundingClientRect()
    if (box.bottom <= 0 || box.right <= 0 || box.top >= innerHeight || box.left >= innerWidth) return []
    return Math.round(box.width) < 44 || Math.round(box.height) < 44
      ? [{ action: element.getAttribute("aria-label") ?? element.textContent?.trim().slice(0, 80) ?? element.tagName, width: Math.round(box.width), height: Math.round(box.height) }]
      : []
  }))
  expect(undersizedControls, "visible interactive targets below 44 CSS pixels").toEqual([])

  const undersizedType = await root.locator("h1,h2,h3,p,span,small,strong,em,button,a,label,input,textarea,dt,dd").evaluateAll((nodes) => nodes.flatMap((node) => {
    const element = node as HTMLElement
    const box = element.getBoundingClientRect()
    if (box.width < 2 || box.height < 2 || box.bottom <= 0 || box.right <= 0 || box.top >= innerHeight || box.left >= innerWidth) return []
    if (element.closest("[aria-hidden='true'],[inert],.maplibregl-control-container")) return []
    const ownText = Array.from(element.childNodes).filter((child) => child.nodeType === Node.TEXT_NODE).map((child) => child.textContent ?? "").join(" ").trim()
    if (!ownText) return []
    const size = Number.parseFloat(getComputedStyle(element).fontSize)
    return size < 12 ? [{ tag: element.tagName, text: ownText.slice(0, 90), size }] : []
  }))
  expect(undersizedType, "visible user-facing type below 12 CSS pixels").toEqual([])
}

async function expectModalAndFocus(page: Page, item: BProductionVisualCase) {
  const modalSetups = new Set(["first-run", "place-peek", "directions", "place-detail", "reset-confirm"])
  const dialogs = page.locator("[data-testid='ondo-b-root'] [role='dialog'][aria-modal='true']:visible")
  await expect(dialogs).toHaveCount(modalSetups.has(item.setup) ? 1 : 0)
  if (modalSetups.has(item.setup)) {
    const active = page.locator(":focus")
    await expect(active).toHaveCount(1)
    await expect(active).toBeVisible()
    expect(await dialogs.first().evaluate((dialog) => dialog.contains(document.activeElement)), `${item.id} modal focus ownership`).toBe(true)
  }
  if (item.setup === "directions") {
    await expect(page.getByTestId("canonical-venue-directions")).toBeFocused()
  }
  if (item.setup === "history-return") {
    const focused = page.locator(":focus")
    await expect(focused).toHaveCount(1)
    await expect(focused).toBeVisible()
    expect(await focused.getAttribute("data-venue-opener") ?? await focused.getAttribute("data-testid")).toMatch(/^mois-|ondo-b-view-toggle/)
  }
}

export async function expectBProductionVisualGuards(page: Page, item: BProductionVisualCase) {
  const root = page.getByTestId("ondo-b-root")
  await expectBProductionRuntimeClean(page)
  const axe = await new AxeBuilder({ page })
    .include("[data-testid='ondo-b-root']")
    .exclude(".maplibregl-cooperative-gesture-screen")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(axe.violations.filter(({ impact }) => impact === "serious" || impact === "critical"), `${item.id} serious/critical Axe violations`).toEqual([])
  await expectNoOverflowOrClipping(page, root)
  await expectMinimumTargetsAndType(root)
  await expectModalAndFocus(page, item)

  const visibleCopy = await root.evaluate((element) => {
    const copy = element.cloneNode(true) as HTMLElement
    copy.querySelector("[data-testid='k-tour-id-setup-open']")?.remove()
    return copy.innerText
  })
  expect(visibleCopy, `${item.id} production-banned visible copy`).not.toMatch(/\bdemo(?:nstration)?\b|\bsimulat(?:e|ed|es|ing|ion|ions)\b|\bfixtures?\b|\bhypoth(?:esis|eses)\b|\btest[- ]?tokens?\b|데모|시뮬레이션|모의\s*(?:성공|결제|인증)|가설|테스트\s*토큰|픽스처/i)
  if (item.setup === "first-run") {
    await expect(root.getByTestId("k-tour-id-setup-open")).toContainText(item.locale === "ko" ? /선택 사항.*게스트 탐색/ : /Optional.*guest Explore/i)
    await expect(root.getByTestId("k-tour-id-setup-open")).not.toContainText(/simulat|시뮬레이션/i)
  }
}

export async function expectBProductionStructuralVisualGuards(page: Page, item: BProductionStructuralVisualCase) {
  await expectBProductionVisualGuards(page, item)
  const root = page.getByTestId("ondo-b-map-entry")
  await expect(root).toHaveAttribute("data-layout-mode", item.expectedLayoutMode)
  await expect(root).toHaveAttribute("data-requested-view", item.expectedRequestedView)
  await expect(root).toHaveAttribute("data-effective-view", item.expectedEffectiveView)

  if (item.expectedLayoutMode === "compact-map") {
    await expect(page.getByTestId("maplibre-map")).toBeVisible()
    await expect(page.getByTestId("ondo-b-view-toggle")).toBeVisible()
    await expect(page.getByTestId("ondo-b-locate")).toBeVisible()
    await expect(page.getByTestId("ondo-b-map-key")).toBeVisible()
    await expect(page.getByTestId("ondo-b-result-bar")).toBeVisible()
    await expect(page.getByTestId("ondo-b-attribution")).toBeVisible()
    const truth = page.getByTestId("ondo-b-location-message")
    await expect(truth).toBeVisible()
    await expect(truth).toHaveAttribute("data-message-kind", "disclosure")
    await expect(truth).toContainText(item.locale === "ko" ? /위치/ : /location/i)
  } else {
    await expect(page.getByTestId("ondo-b-list-panel")).toBeVisible()
    await expect(page.getByTestId("ondo-b-effective-view-label")).toBeVisible()
    await expect(page.getByTestId("ondo-b-effective-view-label")).toContainText(item.locale === "ko" ? /목록/ : /list/i)
    await expect(page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id]")).toHaveCount(30)
    await expect(page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id]").first()).toContainText(/\S/)
    await expect(page.getByTestId("maplibre-map")).toBeHidden()
    await expect(page.getByTestId("ondo-b-view-toggle")).toHaveCount(0)
    await expect(page.getByTestId("ondo-b-location-message")).toHaveCount(0)
    await expect(page.getByTestId("ondo-b-map-key")).toHaveCount(0)
    await expect(page.getByTestId("ondo-b-attribution")).toHaveCount(0)
  }
}

export async function attachBProductionVisualMetadata(testInfo: TestInfo, item: BProductionVisualCase, viewport: ProductionVisualViewportLike) {
  await testInfo.attach("production-visual-case.json", {
    body: JSON.stringify({
      caseId: item.id,
      flowIds: item.flowIds,
      locale: item.locale,
      setup: item.setup,
      surfaceSelector: item.surfaceSelector,
      viewport,
    }, null, 2),
    contentType: "application/json",
  })
}

export async function expectBProductionVisualSnapshot(page: Page, item: BProductionVisualCase, viewport: ProductionVisualViewportLike) {
  if (process.env.PRODUCTION_VISUAL_PREFLIGHT === "1") return
  await expect(page).toHaveScreenshot(`${item.id}-${item.locale}-${viewport.id}.png`, {
    animations: "disabled",
    caret: "hide",
    fullPage: false,
    scale: "css",
    timeout: 30_000,
  })
}
