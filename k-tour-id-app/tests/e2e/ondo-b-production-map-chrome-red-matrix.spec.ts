import { createHash } from "node:crypto"
import { expect, test, type Browser, type BrowserContext, type Locator, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const EMPTY_TILEJSON = {
  tilejson: "3.0.0",
  tiles: ["https://tiles.openfreemap.org/ondo-red-matrix-empty/{z}/{x}/{y}.pbf"],
  minzoom: 0,
  maxzoom: 18,
  bounds: [124, 33, 132, 39],
} as const

type Locale = "en" | "ko"
type Phase = "idle" | "ready" | "offline" | "denied"
type LayoutMode = "ultra-short" | "compact-map" | "spacious-map"
type Viewport = { label: string; width: number; height: number }
type Rect = { left: number; top: number; right: number; bottom: number; width: number; height: number }
type ElementReceipt = Rect & {
  clientWidth: number
  clientHeight: number
  scrollWidth: number
  scrollHeight: number
  visible: boolean
  text: string
  fontSize: number
  tabIndex: number
}
type Violation = { scenario: string; rule: string; subject: string; detail?: string }

// This is intentionally a structural seam matrix rather than a screenshot
// matrix. It covers every viewport named by the independent browser audit plus
// the 320px and 801/900px seams that the former geometry test did not exercise.
const VIEWPORTS: readonly Viewport[] = [
  { label: "narrow-portrait", width: 320, height: 720 },
  { label: "phone-390x800", width: 390, height: 800 },
  { label: "phone-390x844", width: 390, height: 844 },
  { label: "phone-430x501-seam", width: 430, height: 501 },
  { label: "phone-430x932", width: 430, height: 932 },
  { label: "compact-600x501", width: 600, height: 501 },
  { label: "short-667x320", width: 667, height: 320 },
  { label: "landscape-667x501", width: 667, height: 501 },
  { label: "landscape-768x501", width: 768, height: 501 },
  { label: "shell-800x501", width: 800, height: 501 },
  { label: "shell-801x501", width: 801, height: 501 },
  { label: "landscape-844x390", width: 844, height: 390 },
  { label: "landscape-844x501", width: 844, height: 501 },
  { label: "landscape-844x520", width: 844, height: 520 },
  { label: "landscape-844x568", width: 844, height: 568 },
  { label: "desktop-seam-899", width: 899, height: 720 },
  { label: "desktop-seam-900", width: 900, height: 720 },
  { label: "desktop-block-seam-800x720", width: 800, height: 720 },
  { label: "desktop-block-seam-801x721", width: 801, height: 721 },
  { label: "desktop-block-seam-899x721", width: 899, height: 721 },
  { label: "desktop-block-seam-900x721", width: 900, height: 721 },
  { label: "desktop-926x600", width: 926, height: 600 },
  { label: "desktop-1024", width: 1024, height: 720 },
  { label: "desktop-1280x720", width: 1280, height: 720 },
  { label: "desktop-1280x800", width: 1280, height: 800 },
  { label: "desktop-1440", width: 1440, height: 1024 },
] as const

const EXPECTED_KEY = {
  en: "Grouped official records. Outlined numbers show record groups. Small neutral dots show individual records.",
  ko: "공식 기록 묶음. 테두리 숫자는 기록 묶음, 작은 중립색 점은 개별 기록을 뜻합니다.",
} as const

function expectedLayoutForRoot(root: Rect): LayoutMode {
  // Chromium sizing of the worst EN/KO offline chrome establishes two honest
  // map budgets: 380px for the two-row >=600px layout and 580px for the
  // narrower stacked layout. Below either budget the requested map remains in
  // state while the effective surface becomes the compact list.
  if (root.height < 380 || (root.width < 600 && root.height < 580)) return "ultra-short"
  if (root.width <= 430 || (root.width > root.height && root.height <= 568)) return "compact-map"
  return "spacious-map"
}

function rounded(value: number) {
  return Math.round(value * 10) / 10
}

function intersectionArea(first: Rect, second: Rect) {
  const width = Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left))
  const height = Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top))
  return rounded(width * height)
}

function inside(inner: Rect, outer: Rect, tolerance = 0.75) {
  return inner.left >= outer.left - tolerance
    && inner.top >= outer.top - tolerance
    && inner.right <= outer.right + tolerance
    && inner.bottom <= outer.bottom + tolerance
}

function issue(
  violations: Violation[],
  scenario: string,
  rule: string,
  subject: string,
  condition: boolean,
  detail?: string,
) {
  if (!condition) violations.push({ scenario, rule, subject, detail })
}

async function elementReceipt(locator: Locator): Promise<ElementReceipt | null> {
  if (await locator.count() === 0) return null
  return locator.first().evaluate((node) => {
    const element = node as HTMLElement
    const rect = element.getBoundingClientRect()
    const style = getComputedStyle(element)
    const visible = rect.width > 0
      && rect.height > 0
      && style.display !== "none"
      && style.visibility !== "hidden"
      && Number(style.opacity) > 0
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      clientWidth: element.clientWidth,
      clientHeight: element.clientHeight,
      scrollWidth: element.scrollWidth,
      scrollHeight: element.scrollHeight,
      visible,
      text: element.innerText.trim(),
      fontSize: Number.parseFloat(style.fontSize),
      tabIndex: element.tabIndex,
    }
  })
}

async function centerOwnership(locator: Locator) {
  return locator.first().evaluate((node) => {
    const element = node as HTMLElement
    const rect = element.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const hit = document.elementFromPoint(x, y)
    return {
      owns: Boolean(hit && (hit === element || element.contains(hit))),
      hit: hit instanceof HTMLElement
        ? hit.dataset.testid ?? hit.getAttribute("aria-label") ?? hit.tagName
        : hit?.nodeName ?? "none",
    }
  })
}

async function seedContext(context: BrowserContext, locale: Locale) {
  await context.route("https://tiles.openfreemap.org/planet", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(EMPTY_TILEJSON) }))
  await context.route("https://tiles.openfreemap.org/ondo-red-matrix-empty/**", (route) => route.fulfill({ status: 200, contentType: "application/x-protobuf", body: Buffer.alloc(0) }))
  await context.addInitScript(({ key, language }) => {
    localStorage.setItem(key, JSON.stringify({
      locale: language,
      onboarding: "ONB-COMPLETE",
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
    }))

    Object.defineProperty(window, "__ondoMatrixGeoMode", { value: "idle", writable: true, configurable: true })
    Object.defineProperty(window, "__ondoMatrixGeoCalls", { value: 0, writable: true, configurable: true })
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition(success: PositionCallback, failure?: PositionErrorCallback) {
          const matrixWindow = window as typeof window & { __ondoMatrixGeoMode?: "ready" | "denied"; __ondoMatrixGeoCalls?: number }
          matrixWindow.__ondoMatrixGeoCalls = (matrixWindow.__ondoMatrixGeoCalls ?? 0) + 1
          const mode = matrixWindow.__ondoMatrixGeoMode
          queueMicrotask(() => {
            if (mode === "ready") {
              success({
                coords: {
                  latitude: 37.5445,
                  longitude: 127.0557,
                  accuracy: 8,
                  altitude: null,
                  altitudeAccuracy: null,
                  heading: null,
                  speed: null,
                  toJSON: () => ({}),
                },
                timestamp: Date.now(),
                toJSON: () => ({}),
              } as GeolocationPosition)
            } else {
              failure?.({ code: 1, message: "matrix permission denial", PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError)
            }
          })
        },
        watchPosition() { return 1 },
        clearWatch() {},
      },
    })

    window.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style")
      style.textContent = "nextjs-portal{display:none!important}*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}"
      document.head.append(style)
    }, { once: true })
  }, { key: DEVICE_KEY, language: locale })
}

async function attributionLocator(root: Locator) {
  const explicit = root.locator("[data-testid='ondo-b-map-attribution'],[data-testid='ondo-b-attribution']")
  if (await explicit.count()) return explicit.first()
  return root.locator("a[href*='openfreemap.org']").first()
}

async function resultLocator(root: Locator) {
  const explicit = root.locator("[data-testid='ondo-b-compact-count'],[data-testid='ondo-b-result-bar']")
  if (await explicit.count()) return explicit.first()
  const view = root.getByTestId("ondo-b-view-toggle")
  if (await view.count()) return view.locator("..").first()
  return root.locator("[data-missing-result-bar]")
}

async function auditUltraShortViewMode(
  violations: Violation[],
  scenario: string,
  root: Locator,
  result: Locator,
) {
  const view = root.getByTestId("ondo-b-view-toggle")
  const viewReceipt = await elementReceipt(view)
  const focusableVisible = await view.evaluateAll((nodes) => nodes.filter((node) => {
    const element = node as HTMLElement
    const rect = element.getBoundingClientRect()
    const style = getComputedStyle(element)
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden" && element.tabIndex >= 0 && !element.hasAttribute("disabled")
  }).length)
  const indicator = root.getByTestId("ondo-b-view-mode-indicator")
  const indicatorReceipt = await elementReceipt(indicator)
  issue(violations, scenario, "ultra-short-view-noninteractive", "view-mode", !viewReceipt?.visible && focusableVisible === 0, `view=${viewReceipt ? JSON.stringify(viewReceipt) : "absent"} focusable=${focusableVisible}`)
  const resultReceipt = await elementReceipt(result)
  const resultCount = await root.getAttribute("data-result-count")
  issue(violations, scenario, "ultra-short-compact-count", "result-count", Boolean(resultReceipt?.visible && resultCount && resultReceipt.text.includes(resultCount)), `count=${resultCount} result=${resultReceipt?.text ?? "missing"}`)
  if (await indicator.count()) issue(violations, scenario, "ultra-short-mode-indicator", "list-mode", Boolean(indicatorReceipt?.visible), indicatorReceipt ? JSON.stringify(indicatorReceipt) : "hidden")
}

async function recordTarget(
  violations: Violation[],
  scenario: string,
  label: string,
  locator: Locator,
  canvas: Rect,
) {
  const receipt = await elementReceipt(locator)
  issue(violations, scenario, "target-visible", label, Boolean(receipt?.visible), receipt ? JSON.stringify(receipt) : "missing")
  if (!receipt?.visible) return
  issue(violations, scenario, "target-44px", label, receipt.width >= 44 && receipt.height >= 44, `${rounded(receipt.width)}x${rounded(receipt.height)}`)
  issue(violations, scenario, "target-in-canvas", label, inside(receipt, canvas), JSON.stringify(receipt))
  const hit = await centerOwnership(locator)
  issue(violations, scenario, "target-center-owner", label, hit.owns, `hit=${hit.hit}`)
}

async function recordTextFloor(
  violations: Violation[],
  scenario: string,
  label: string,
  locator: Locator,
) {
  if (await locator.count() === 0) return
  const undersized = await locator.first().evaluate((root) => {
    const nodes = [root, ...root.querySelectorAll("a,b,button,p,small,span,strong")]
    return nodes.flatMap((node) => {
      const element = node as HTMLElement
      const rect = element.getBoundingClientRect()
      const text = element.innerText?.trim()
      if (!text || rect.width <= 0 || rect.height <= 0) return []
      const size = Number.parseFloat(getComputedStyle(element).fontSize)
      return size < 12 ? [{ text: text.slice(0, 80), size }] : []
    })
  })
  issue(violations, scenario, "text-12px-floor", label, undersized.length === 0, JSON.stringify(undersized))
}

async function auditCategoryReachability(
  violations: Violation[],
  scenario: string,
  rail: Locator,
  canvas: Rect,
) {
  const buttons = rail.getByRole("button")
  const count = await buttons.count()
  issue(violations, scenario, "category-count", "category-rail", count === 8, `count=${count}`)
  for (let index = 0; index < count; index += 1) {
    await rail.evaluate((node, buttonIndex) => {
      const element = node as HTMLElement
      const button = element.querySelectorAll<HTMLElement>("button")[buttonIndex]
      if (button) element.scrollLeft = Math.max(0, button.offsetLeft - (element.clientWidth - button.offsetWidth) / 2)
    }, index)
    const button = buttons.nth(index)
    const [railBox, buttonBox] = await Promise.all([elementReceipt(rail), elementReceipt(button)])
    const label = `category-${index + 1}:${(await button.textContent())?.trim() ?? "missing"}`
    issue(violations, scenario, "category-reachable", label, Boolean(railBox && buttonBox && inside(buttonBox, railBox) && inside(buttonBox, canvas)), buttonBox ? JSON.stringify(buttonBox) : "missing")
    if (buttonBox?.visible) {
      issue(violations, scenario, "target-44px", label, buttonBox.width >= 44 && buttonBox.height >= 44, `${rounded(buttonBox.width)}x${rounded(buttonBox.height)}`)
      const hit = await centerOwnership(button)
      issue(violations, scenario, "target-center-owner", label, hit.owns, `hit=${hit.hit}`)
    }
  }
}

async function auditKey(
  violations: Violation[],
  scenario: string,
  locale: Locale,
  key: Locator,
  canvas: Rect,
) {
  const receipt = await elementReceipt(key)
  issue(violations, scenario, "key-visible", "map-key", Boolean(receipt?.visible), receipt ? JSON.stringify(receipt) : "missing")
  if (!receipt?.visible) return
  issue(violations, scenario, "key-in-canvas", "map-key", inside(receipt, canvas), JSON.stringify(receipt))
  issue(violations, scenario, "key-own-overflow", "map-key", receipt.scrollWidth <= receipt.clientWidth + 1, `client=${receipt.clientWidth} scroll=${receipt.scrollWidth}`)
  issue(violations, scenario, "key-own-vertical-overflow", "map-key", receipt.scrollHeight <= receipt.clientHeight + 1, `client=${receipt.clientHeight} scroll=${receipt.scrollHeight}`)
  issue(violations, scenario, "key-exact-copy", "map-key", (await key.getAttribute("aria-label")) === EXPECTED_KEY[locale], `aria-label=${await key.getAttribute("aria-label")}`)

  const children = await key.locator(":scope > div > span, :scope > small").evaluateAll((nodes) => nodes.map((node) => {
    const element = node as HTMLElement
    const rect = element.getBoundingClientRect()
    const range = document.createRange()
    range.selectNodeContents(element)
    const textRect = range.getBoundingClientRect()
    return {
      tag: element.tagName,
      text: element.innerText.trim(),
      clientWidth: element.clientWidth,
      clientHeight: element.clientHeight,
      scrollWidth: element.scrollWidth,
      scrollHeight: element.scrollHeight,
      rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
      textRect: { left: textRect.left, top: textRect.top, right: textRect.right, bottom: textRect.bottom },
    }
  }))
  for (const child of children) {
    issue(violations, scenario, "key-child-overflow", `${child.tag}:${child.text.slice(0, 40)}`, child.scrollWidth <= child.clientWidth + 1, `client=${child.clientWidth} scroll=${child.scrollWidth}`)
    issue(violations, scenario, "key-child-vertical-overflow", `${child.tag}:${child.text.slice(0, 40)}`, child.scrollHeight <= child.clientHeight + 1, `client=${child.clientHeight} scroll=${child.scrollHeight}`)
    issue(violations, scenario, "key-child-text-bounds", `${child.tag}:${child.text.slice(0, 40)}`, child.textRect.left >= receipt.left - .75 && child.textRect.top >= receipt.top - .75 && child.textRect.right <= receipt.right + .75 && child.textRect.bottom <= receipt.bottom + .75, JSON.stringify(child.textRect))
  }
}

async function auditAttribution(
  violations: Violation[],
  scenario: string,
  root: Locator,
  attribution: Locator,
  canvas: Rect,
) {
  const receipt = await elementReceipt(attribution)
  issue(violations, scenario, "attribution-visible", "official-attribution", Boolean(receipt?.visible), receipt ? JSON.stringify(receipt) : "missing")
  if (!receipt?.visible) return
  issue(violations, scenario, "attribution-in-canvas", "official-attribution", inside(receipt, canvas), JSON.stringify(receipt))
  const text = receipt.text.replace(/\s+/g, " ")
  for (const sourceText of ["OpenFreeMap", "© OpenMapTiles", "Data from OpenStreetMap"]) {
    issue(violations, scenario, "attribution-exact-source", sourceText, text.includes(sourceText), `text=${text}`)
  }
  for (const href of ["openfreemap.org", "openmaptiles.org", "openstreetmap.org/copyright"]) {
    const link = root.locator(`a[href*='${href}']`)
    issue(violations, scenario, "attribution-source-link", href, await link.count() === 1, `count=${await link.count()}`)
    if (await link.count()) await recordTarget(violations, scenario, `attribution:${href}`, link.first(), canvas)
  }
  const clipped = await attribution.evaluate((node) => [node, ...node.querySelectorAll("a,span")].flatMap((candidate) => {
    const element = candidate as HTMLElement
    const style = getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    if (!element.textContent?.trim() || rect.width <= 0 || rect.height <= 0) return []
    return element.scrollWidth > element.clientWidth + 1
      || element.scrollHeight > element.clientHeight + 1
      || style.textOverflow === "ellipsis"
      ? [{ text: element.textContent.trim(), client: [element.clientWidth, element.clientHeight], scroll: [element.scrollWidth, element.scrollHeight], textOverflow: style.textOverflow }]
      : []
  }))
  issue(violations, scenario, "attribution-not-clipped", "official-attribution", clipped.length === 0, JSON.stringify(clipped))
}

async function auditOverflow(
  violations: Violation[],
  scenario: string,
  page: Page,
  root: Locator,
  effectiveView: "map" | "list",
) {
  const overflow = await page.evaluate(() => ({
    document: [document.documentElement.clientWidth, document.documentElement.scrollWidth, document.documentElement.clientHeight, document.documentElement.scrollHeight],
    body: [document.body.clientWidth, document.body.scrollWidth, document.body.clientHeight, document.body.scrollHeight],
  }))
  const rootReceipt = await elementReceipt(root)
  const mapReceipt = await elementReceipt(root.getByTestId("maplibre-map"))
  for (const [label, dimensions] of Object.entries(overflow)) {
    issue(violations, scenario, "document-canvas-overflow", label, dimensions[1] <= dimensions[0] + 1 && dimensions[3] <= dimensions[2] + 1, JSON.stringify(dimensions))
  }
  issue(violations, scenario, "document-canvas-overflow", "root", Boolean(rootReceipt && rootReceipt.scrollWidth <= rootReceipt.clientWidth + 1 && rootReceipt.scrollHeight <= rootReceipt.clientHeight + 1), rootReceipt ? `client=${rootReceipt.clientWidth}x${rootReceipt.clientHeight} scroll=${rootReceipt.scrollWidth}x${rootReceipt.scrollHeight}` : "missing")
  if (effectiveView === "map") {
    issue(violations, scenario, "document-canvas-overflow", "map-canvas", Boolean(mapReceipt?.visible && mapReceipt.scrollWidth <= mapReceipt.clientWidth + 1 && mapReceipt.scrollHeight <= mapReceipt.clientHeight + 1), mapReceipt ? `client=${mapReceipt.clientWidth}x${mapReceipt.clientHeight} scroll=${mapReceipt.scrollWidth}x${mapReceipt.scrollHeight}` : "missing")
  } else {
    const mapIsIsolated = await root.getByTestId("maplibre-map").evaluateAll((nodes) => nodes.every((node) => {
      const element = node as HTMLElement
      const rect = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      return rect.width <= 0
        || rect.height <= 0
        || style.display === "none"
        || style.visibility === "hidden"
        || element.closest("[inert],[aria-hidden='true']") != null
    }))
    issue(violations, scenario, "effective-list-map-isolated", "map-canvas", mapIsIsolated, mapReceipt ? JSON.stringify(mapReceipt) : "absent")
  }
}

async function auditMapState(
  violations: Violation[],
  page: Page,
  locale: Locale,
  viewport: Viewport,
  phase: Phase,
) {
  const scenario = `${locale}/${viewport.width}x${viewport.height}/${phase}`
  const root = page.getByTestId("ondo-b-map-entry")
  const canvasReceipt = await elementReceipt(root)
  if (!canvasReceipt?.visible) {
    violations.push({ scenario, rule: "scenario-root", subject: "ondo-b-map-entry", detail: "missing or hidden" })
    return
  }
  const expectedLayout = expectedLayoutForRoot(canvasReceipt)
  if (phase === "idle") {
    const geolocationCalls = await page.evaluate(() => (window as typeof window & { __ondoMatrixGeoCalls?: number }).__ondoMatrixGeoCalls ?? 0)
    issue(violations, scenario, "location-no-call-before-consent", "navigator.geolocation", geolocationCalls === 0, `calls=${geolocationCalls}`)
  }
  const [layoutMode, requestedView, effectiveView, blockSizeValue] = await Promise.all([
    root.getAttribute("data-layout-mode"),
    root.getAttribute("data-requested-view"),
    root.getAttribute("data-effective-view"),
    root.getAttribute("data-map-root-block-size"),
  ])
  issue(violations, scenario, "layout-mode-by-actual-root", "data-layout-mode", layoutMode === expectedLayout, `expected=${expectedLayout} actual=${layoutMode} root=${rounded(canvasReceipt.width)}x${rounded(canvasReceipt.height)}`)
  issue(violations, scenario, "requested-view-truth", "data-requested-view", requestedView === "map", `actual=${requestedView}`)
  issue(violations, scenario, "effective-view-truth", "data-effective-view", effectiveView === "map", `actual=${effectiveView}`)
  const reportedBlockSize = Number(blockSizeValue)
  issue(violations, scenario, "root-block-size-receipt", "data-map-root-block-size", Number.isFinite(reportedBlockSize) && Math.abs(reportedBlockSize - canvasReceipt.height) <= 1, `reported=${blockSizeValue} actual=${rounded(canvasReceipt.height)}`)

  const header = root.locator(":scope > header")
  const search = root.getByRole("search")
  const rail = root.getByTestId("ondo-b-category-rail")
  const key = root.getByTestId("ondo-b-map-key")
  const locate = root.getByTestId("ondo-b-locate")
  const view = root.getByTestId("ondo-b-view-toggle")
  const result = await resultLocator(root)
  const nav = page.getByTestId("ondo-main-nav")
  const outerCanvasReceipt = await elementReceipt(page.getByTestId("ondo-canvas"))
  issue(violations, scenario, "outer-canvas-visible", "ondo-canvas", Boolean(outerCanvasReceipt?.visible), outerCanvasReceipt ? JSON.stringify(outerCanvasReceipt) : "missing")
  const attribution = await attributionLocator(root)
  const zoom = root.locator(".maplibregl-ctrl-bottom-right .maplibregl-ctrl-group")
  const messageCandidates = [
    root.getByTestId("ondo-b-location-message"),
    root.getByTestId("ondo-b-location-disclosure"),
    root.getByTestId("ondo-b-location-status"),
    root.getByTestId("ondo-b-offline-status"),
  ]
  const visibleMessages: { locator: Locator; receipt: ElementReceipt }[] = []
  for (const candidate of messageCandidates) {
    const receipt = await elementReceipt(candidate)
    if (receipt?.visible) visibleMessages.push({ locator: candidate, receipt })
  }
  issue(violations, scenario, "message-mutually-exclusive", "location-or-offline-message", visibleMessages.length === 1, `visible=${visibleMessages.length}`)
  const message = visibleMessages[0]?.locator
  if (message) {
    const [messageId, describedBy] = await Promise.all([message.getAttribute("id"), locate.getAttribute("aria-describedby")])
    issue(violations, scenario, "locate-describes-visible-message", "aria-describedby", Boolean(messageId && describedBy?.trim() === messageId), `message-id=${messageId} describedby=${describedBy}`)
    if (phase === "offline") {
      const offlineTruth = (await message.textContent())?.replace(/\s+/g, " ").trim() ?? ""
      issue(violations, scenario, "offline-combined-truth", "offline-message", /offline|오프라인/i.test(offlineTruth) && /location|위치/i.test(offlineTruth) && /OpenFreeMap/i.test(offlineTruth), `text=${offlineTruth}`)
    }
  }

  const layout = { header, search, rail }
  for (const [label, locator] of Object.entries(layout)) {
    const receipt = await elementReceipt(locator)
    issue(violations, scenario, "header-filter-in-canvas", label, Boolean(receipt?.visible && inside(receipt, canvasReceipt)), receipt ? JSON.stringify(receipt) : "missing")
  }
  const headerReceipt = await elementReceipt(header)
  issue(violations, scenario, "header-own-overflow", "header", Boolean(headerReceipt && headerReceipt.scrollWidth <= headerReceipt.clientWidth + 1), headerReceipt ? `client=${headerReceipt.clientWidth} scroll=${headerReceipt.scrollWidth}` : "missing")

  await auditCategoryReachability(violations, scenario, rail, canvasReceipt)
  await auditKey(violations, scenario, locale, key, canvasReceipt)
  await auditAttribution(violations, scenario, root, attribution, canvasReceipt)

  for (const [label, locator] of [
    ["back", root.getByTestId("ondo-b-city-back")],
    ["language", header.getByRole("button", { name: locale === "en" ? "KO" : "EN", exact: true })],
    ["search", root.getByTestId("ondo-b-search")],
    ["locate", locate],
    ["view", view],
  ] as const) {
    await recordTarget(violations, scenario, label, locator, canvasReceipt)
  }
  if (outerCanvasReceipt) {
    for (let index = 0; index < 3; index += 1) await recordTarget(violations, scenario, `nav-${index + 1}`, nav.getByRole("button").nth(index), outerCanvasReceipt)
  }

  const zoomReceipt = await elementReceipt(zoom)
  const zoomButtons = zoom.getByRole("button")
  if (expectedLayout === "compact-map") {
    issue(violations, scenario, "compact-zoom-hidden", "map-zoom", !zoomReceipt?.visible, zoomReceipt ? JSON.stringify(zoomReceipt) : "absent")
    const focusableVisible = await zoomButtons.evaluateAll((buttons) => buttons.filter((button) => {
      const element = button as HTMLElement
      const rect = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden" && element.tabIndex >= 0
    }).length)
    issue(violations, scenario, "compact-zoom-not-focusable", "map-zoom", focusableVisible === 0, `visible-focusable=${focusableVisible}`)
  } else {
    issue(violations, scenario, "spacious-zoom-visible", "map-zoom", Boolean(zoomReceipt?.visible), zoomReceipt ? JSON.stringify(zoomReceipt) : "missing")
    issue(violations, scenario, "spacious-zoom-count", "map-zoom", await zoomButtons.count() === 2, `count=${await zoomButtons.count()}`)
    for (let index = 0; index < await zoomButtons.count(); index += 1) {
      await recordTarget(violations, scenario, `map-zoom-${index + 1}`, zoomButtons.nth(index), canvasReceipt)
    }
  }

  const boxes: Record<string, ElementReceipt> = {}
  for (const [label, locator] of [
    ["header", header],
    ["search", search],
    ["rail", rail],
    ["message", message],
    ["key", key],
    ["locate", locate],
    ["view", view],
    ["result", result],
    ["nav", nav],
    ["attribution", attribution],
    ["zoom", zoom],
  ] as const) {
    if (!locator) continue
    const receipt = await elementReceipt(locator)
    if (receipt?.visible) {
      boxes[label] = receipt
      issue(violations, scenario, "chrome-in-canvas", label, inside(receipt, label === "nav" && outerCanvasReceipt ? outerCanvasReceipt : canvasReceipt), JSON.stringify(receipt))
    }
  }

  const excludedPairs = new Set(["header:search", "header:rail", "result:view"])
  const names = Object.keys(boxes).sort()
  for (let first = 0; first < names.length; first += 1) {
    for (let second = first + 1; second < names.length; second += 1) {
      const pair = `${names[first]}:${names[second]}`
      const reverse = `${names[second]}:${names[first]}`
      if (excludedPairs.has(pair) || excludedPairs.has(reverse)) continue
      const area = intersectionArea(boxes[names[first]], boxes[names[second]])
      issue(violations, scenario, "chrome-pairwise-zero", pair, area <= .5, `area=${area}`)
    }
  }

  for (const [label, locator] of [
    ["message", message],
    ["map-key", key],
    ["result", result],
    ["attribution", attribution],
    ["category-rail", rail],
    ["navigation", nav],
  ] as const) {
    if (locator) await recordTextFloor(violations, scenario, label, locator)
  }
  await auditOverflow(violations, scenario, page, root, "map")
}

async function auditUltraShortLayout(
  violations: Violation[],
  page: Page,
  locale: Locale,
  viewport: Viewport,
  carriedPhase: Phase = "idle",
) {
  const scenario = `${locale}/${viewport.width}x${viewport.height}/${carriedPhase}-auto-list`
  const root = page.getByTestId("ondo-b-map-entry")
  const canvas = await elementReceipt(root)
  if (!canvas?.visible) {
    violations.push({ scenario, rule: "scenario-root", subject: "ondo-b-map-entry", detail: "missing or hidden" })
    return
  }
  const [layoutMode, requestedView, effectiveView, blockSizeValue] = await Promise.all([
    root.getAttribute("data-layout-mode"),
    root.getAttribute("data-requested-view"),
    root.getAttribute("data-effective-view"),
    root.getAttribute("data-map-root-block-size"),
  ])
  issue(violations, scenario, "layout-mode-by-actual-root", "data-layout-mode", layoutMode === "ultra-short", `actual=${layoutMode} root=${rounded(canvas.width)}x${rounded(canvas.height)}`)
  issue(violations, scenario, "requested-view-truth", "data-requested-view", requestedView === "map", `actual=${requestedView}`)
  issue(violations, scenario, "effective-view-truth", "data-effective-view", effectiveView === "list", `actual=${effectiveView}`)
  const reportedBlockSize = Number(blockSizeValue)
  issue(violations, scenario, "root-block-size-receipt", "data-map-root-block-size", Number.isFinite(reportedBlockSize) && Math.abs(reportedBlockSize - canvas.height) <= 1, `reported=${blockSizeValue} actual=${rounded(canvas.height)}`)
  if (carriedPhase === "idle" || carriedPhase === "offline") {
    const geolocationCalls = await page.evaluate(() => (window as typeof window & { __ondoMatrixGeoCalls?: number }).__ondoMatrixGeoCalls ?? 0)
    issue(violations, scenario, "location-no-call-before-consent", "navigator.geolocation", geolocationCalls === 0, `calls=${geolocationCalls}`)
  }

  const header = root.locator(":scope > header")
  const search = root.getByRole("search")
  const rail = root.getByTestId("ondo-b-category-rail")
  for (const [label, locator] of [["header", header], ["search", search], ["rail", rail]] as const) {
    const receipt = await elementReceipt(locator)
    issue(violations, scenario, "header-filter-in-canvas", label, Boolean(receipt?.visible && inside(receipt, canvas)), receipt ? JSON.stringify(receipt) : "missing")
  }
  const headerReceipt = await elementReceipt(header)
  issue(violations, scenario, "header-own-overflow", "header", Boolean(headerReceipt && headerReceipt.scrollWidth <= headerReceipt.clientWidth + 1), headerReceipt ? `client=${headerReceipt.clientWidth} scroll=${headerReceipt.scrollWidth}` : "missing")
  await auditCategoryReachability(violations, scenario, rail, canvas)

  const panel = root.getByTestId("ondo-b-list-panel")
  const result = await resultLocator(root)
  const nav = page.getByTestId("ondo-main-nav")
  const outerCanvas = await elementReceipt(page.getByTestId("ondo-canvas"))
  for (const [label, locator] of [["list-panel", panel], ["result", result]] as const) {
    const receipt = await elementReceipt(locator)
    issue(violations, scenario, "ultra-short-list-visible", label, Boolean(receipt?.visible && inside(receipt, canvas)), receipt ? JSON.stringify(receipt) : "missing")
  }
  const navReceipt = await elementReceipt(nav)
  issue(violations, scenario, "ultra-short-list-visible", "navigation", Boolean(outerCanvas && navReceipt?.visible && inside(navReceipt, outerCanvas)), navReceipt ? JSON.stringify(navReceipt) : "missing")
  await auditUltraShortViewMode(violations, scenario, root, result)
  if (outerCanvas) for (let index = 0; index < 3; index += 1) await recordTarget(violations, scenario, `nav-${index + 1}`, nav.getByRole("button").nth(index), outerCanvas)
  const firstRow = panel.locator("li[data-venue-id] button").first()
  const rowReceipt = await elementReceipt(firstRow)
  issue(violations, scenario, "fallback-row-visible", "first-result", Boolean(rowReceipt?.visible && inside(rowReceipt, canvas)), rowReceipt ? JSON.stringify(rowReceipt) : "missing")

  for (const [label, locator] of [
    ["map-key", root.getByTestId("ondo-b-map-key")],
    ["locate", root.getByTestId("ondo-b-locate")],
    ["location-disclosure", root.getByTestId("ondo-b-location-disclosure")],
    ["location-status", root.getByTestId("ondo-b-location-status")],
    ["offline-status", root.getByTestId("ondo-b-offline-status")],
    ["attribution", root.locator("a[href*='openfreemap.org'], [data-testid='ondo-b-map-attribution'], [data-testid='ondo-b-attribution']")],
  ] as const) {
    const receipt = await elementReceipt(locator)
    issue(violations, scenario, "ultra-short-map-chrome-absent", label, !receipt?.visible, receipt ? JSON.stringify(receipt) : "absent")
  }
  const visibleFocusableZoom = await root.locator(".maplibregl-ctrl-bottom-right .maplibregl-ctrl-group button").evaluateAll((buttons) => buttons.filter((button) => {
    const element = button as HTMLElement
    const rect = element.getBoundingClientRect()
    const style = getComputedStyle(element)
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden" && element.tabIndex >= 0
  }).length)
  issue(violations, scenario, "compact-zoom-not-focusable", "map-zoom", visibleFocusableZoom === 0, `visible-focusable=${visibleFocusableZoom}`)

  const [panelBox, resultBox, navBox] = await Promise.all([elementReceipt(panel), elementReceipt(result), elementReceipt(nav)])
  if (panelBox && resultBox) issue(violations, scenario, "list-nav-clearance", "panel:result", intersectionArea(panelBox, resultBox) <= .5, `area=${intersectionArea(panelBox, resultBox)}`)
  if (panelBox && navBox) issue(violations, scenario, "list-nav-clearance", "panel:nav", intersectionArea(panelBox, navBox) <= .5, `area=${intersectionArea(panelBox, navBox)}`)
  if (resultBox && navBox) issue(violations, scenario, "list-nav-clearance", "result:nav", intersectionArea(resultBox, navBox) <= .5, `area=${intersectionArea(resultBox, navBox)}`)
  await auditOverflow(violations, scenario, page, root, "list")
}

async function enterPhase(page: Page, context: BrowserContext, phase: Phase) {
  const root = page.getByTestId("ondo-b-map-entry")
  if (phase === "idle") return
  if (phase === "ready") {
    await page.evaluate(() => { (window as typeof window & { __ondoMatrixGeoMode?: string }).__ondoMatrixGeoMode = "ready" })
    await root.getByTestId("ondo-b-locate").click()
    await expect(root).toHaveAttribute("data-location-state", "ready")
    return
  }
  if (phase === "offline") {
    await context.setOffline(true)
    await expect(root).toHaveAttribute("data-connectivity", "offline")
    return
  }
  await context.setOffline(false)
  await expect(root).toHaveAttribute("data-connectivity", "online")
  await page.evaluate(() => { (window as typeof window & { __ondoMatrixGeoMode?: string }).__ondoMatrixGeoMode = "denied" })
  await root.getByTestId("ondo-b-locate").click()
  await expect(root).toHaveAttribute("data-location-state", "denied")
}

async function settleLayout(root: Locator, layoutMode: LayoutMode, effectiveView: "map" | "list") {
  await expect.poll(async () => ({
    layout: await root.getAttribute("data-layout-mode"),
    effective: await root.getAttribute("data-effective-view"),
  }), { timeout: 1_500 }).toEqual({ layout: layoutMode, effective: effectiveView }).catch(() => undefined)
}

async function runStateMatrix(browser: Browser, violations: Violation[]) {
  for (const locale of ["en", "ko"] as const) {
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, colorScheme: "light", locale: "en-US", timezoneId: "Asia/Seoul" })
      await seedContext(context, locale)
      const page = await context.newPage()
      try {
        await page.goto("/ondo-b?city=seoul", { waitUntil: "domcontentloaded" })
        const root = page.getByTestId("ondo-b-map-entry")
        await root.waitFor({ state: "visible" })
        const rootReceipt = await elementReceipt(root)
        if (rootReceipt && expectedLayoutForRoot(rootReceipt) === "ultra-short") {
          await auditUltraShortLayout(violations, page, locale, viewport)
          continue
        }
        await expect(root).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
        for (const phase of ["idle", "ready", "offline", "denied"] as const) {
          await enterPhase(page, context, phase)
          await auditMapState(violations, page, locale, viewport, phase)
        }
      } catch (error) {
        violations.push({ scenario: `${locale}/${viewport.width}x${viewport.height}/harness`, rule: "scenario-completed", subject: viewport.label, detail: error instanceof Error ? error.message : String(error) })
      } finally {
        await context.close()
      }
    }
  }
}

async function auditUltraShortStateCarry(browser: Browser, violations: Violation[], locale: Locale, phase: Exclude<Phase, "idle">, target: Viewport) {
  const context = await browser.newContext({ viewport: { width: 900, height: 720 } })
  await seedContext(context, locale)
  const page = await context.newPage()
  const scenario = `${locale}/${target.width}x${target.height}/${phase}-carry`
  try {
    await page.goto("/ondo-b?city=seoul&view=map", { waitUntil: "domcontentloaded" })
    const root = page.getByTestId("ondo-b-map-entry")
    await expect(root).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
    if (phase === "offline") {
      await context.setOffline(true)
      await expect(root).toHaveAttribute("data-connectivity", "offline")
    } else {
      await page.evaluate((nextPhase) => { (window as typeof window & { __ondoMatrixGeoMode?: string }).__ondoMatrixGeoMode = nextPhase }, phase)
      await root.getByTestId("ondo-b-locate").click()
      await expect(root).toHaveAttribute("data-location-state", phase)
    }
    await page.setViewportSize({ width: target.width, height: target.height })
    await settleLayout(root, "ultra-short", "list")
    await auditUltraShortLayout(violations, page, locale, target, phase)
  } catch (error) {
    violations.push({ scenario, rule: "ultra-short-state-carry-completed", subject: phase, detail: error instanceof Error ? error.message : String(error) })
  } finally {
    await context.close()
  }
}

async function auditRootBoundaryModes(browser: Browser, violations: Violation[], locale: Locale) {
  const context = await browser.newContext({ viewport: { width: 899, height: 720 } })
  await seedContext(context, locale)
  const page = await context.newPage()
  const scenario = `${locale}/actual-root/899x720->900x720`
  try {
    await page.goto("/ondo-b?city=seoul&view=map", { waitUntil: "domcontentloaded" })
    const root = page.getByTestId("ondo-b-map-entry")
    await root.waitFor({ state: "visible" })
    const firstRect = await elementReceipt(root)
    const firstMode = await root.getAttribute("data-layout-mode")
    await page.setViewportSize({ width: 900, height: 720 })
    const secondRect = await elementReceipt(root)
    if (secondRect) await settleLayout(root, expectedLayoutForRoot(secondRect), "map")
    const secondMode = await root.getAttribute("data-layout-mode")
    issue(violations, scenario, "layout-mode-by-actual-root", "899", Boolean(firstRect && firstMode === expectedLayoutForRoot(firstRect)), `mode=${firstMode} root=${firstRect ? `${rounded(firstRect.width)}x${rounded(firstRect.height)}` : "missing"}`)
    issue(violations, scenario, "layout-mode-by-actual-root", "900", Boolean(secondRect && secondMode === expectedLayoutForRoot(secondRect)), `mode=${secondMode} root=${secondRect ? `${rounded(secondRect.width)}x${rounded(secondRect.height)}` : "missing"}`)
    if (firstRect && secondRect && expectedLayoutForRoot(firstRect) === expectedLayoutForRoot(secondRect)) {
      issue(violations, scenario, "899-900-root-policy-consistent", "data-layout-mode", firstMode === secondMode, `899=${firstMode} 900=${secondMode}`)
    }
  } catch (error) {
    violations.push({ scenario, rule: "root-boundary-completed", subject: "899-900", detail: error instanceof Error ? error.message : String(error) })
  } finally {
    await context.close()
  }
}

async function auditRequestedViewKeyboard(browser: Browser, violations: Violation[], locale: Locale) {
  const context = await browser.newContext({ viewport: { width: 900, height: 720 } })
  await seedContext(context, locale)
  const page = await context.newPage()
  const scenario = `${locale}/900x720/requested-view-keyboard`
  try {
    await page.goto("/ondo-b?city=seoul&view=map&category=korean", { waitUntil: "domcontentloaded" })
    const root = page.getByTestId("ondo-b-map-entry")
    await expect(root).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
    const search = root.getByTestId("ondo-b-search")
    const view = root.getByTestId("ondo-b-view-toggle")
    await search.fill("mapo")
    await expect(root).toHaveAttribute("data-result-count", "5")
    const callsBeforeConsent = await page.evaluate(() => (window as typeof window & { __ondoMatrixGeoCalls?: number }).__ondoMatrixGeoCalls ?? 0)
    issue(violations, scenario, "location-no-call-before-consent", "navigator.geolocation", callsBeforeConsent === 0, `calls=${callsBeforeConsent}`)

    await view.focus()
    await page.keyboard.press("Enter")
    await settleLayout(root, "spacious-map", "list")
    issue(violations, scenario, "requested-view-keyboard", "map-to-list", await root.getAttribute("data-requested-view") === "list" && await root.getAttribute("data-effective-view") === "list", `requested=${await root.getAttribute("data-requested-view")} effective=${await root.getAttribute("data-effective-view")}`)
    const listFocus = await elementReceipt(view)
    issue(violations, scenario, "requested-view-focus", "list-toggle", Boolean(listFocus?.visible && await view.evaluate((node) => document.activeElement === node)), listFocus ? JSON.stringify(listFocus) : "missing")
    issue(violations, scenario, "requested-view-state-preserved", "list", await search.inputValue() === "mapo" && await root.getAttribute("data-result-count") === "5" && (await root.getByTestId("ondo-b-category-rail").getByRole("button", { pressed: true }).textContent())?.trim() === (locale === "en" ? "Korean" : "한식"), `query=${await search.inputValue()} count=${await root.getAttribute("data-result-count")}`)
    const row = root.getByTestId("ondo-b-list-panel").locator("li[data-venue-id] button").first()
    issue(violations, scenario, "fallback-row-visible", "keyboard-list-first-result", Boolean((await elementReceipt(row))?.visible), "first result must remain keyboard-available")
    await auditOverflow(violations, `${scenario}/list`, page, root, "list")

    await view.focus()
    await page.keyboard.press("Enter")
    await settleLayout(root, "spacious-map", "map")
    issue(violations, scenario, "requested-view-keyboard", "list-to-map", await root.getAttribute("data-requested-view") === "map" && await root.getAttribute("data-effective-view") === "map", `requested=${await root.getAttribute("data-requested-view")} effective=${await root.getAttribute("data-effective-view")}`)
    const mapFocus = await elementReceipt(view)
    issue(violations, scenario, "requested-view-focus", "map-toggle", Boolean(mapFocus?.visible && await view.evaluate((node) => document.activeElement === node)), mapFocus ? JSON.stringify(mapFocus) : "missing")
    issue(violations, scenario, "requested-view-state-preserved", "map", await search.inputValue() === "mapo" && await root.getAttribute("data-result-count") === "5" && (await root.getByTestId("ondo-b-category-rail").getByRole("button", { pressed: true }).textContent())?.trim() === (locale === "en" ? "Korean" : "한식"), `query=${await search.inputValue()} count=${await root.getAttribute("data-result-count")}`)
    const map = root.getByTestId("maplibre-map")
    const instructionId = await map.getAttribute("aria-describedby")
    const instruction = instructionId ? page.locator(`#${instructionId}`) : page.locator("[data-missing-map-instruction]")
    issue(violations, scenario, "map-keyboard-instruction", "map-region", Boolean(instructionId && /list|목록/i.test((await instruction.textContent()) ?? "")), `describedby=${instructionId} text=${await instruction.textContent()}`)
  } catch (error) {
    violations.push({ scenario, rule: "requested-view-flow-completed", subject: "keyboard-toggle", detail: error instanceof Error ? error.message : String(error) })
  } finally {
    await context.close()
  }
}

async function auditZoomResize(browser: Browser, violations: Violation[], locale: Locale) {
  const context = await browser.newContext({ viewport: { width: 900, height: 720 } })
  await seedContext(context, locale)
  const page = await context.newPage()
  const scenario = `${locale}/zoom-focus/900x720->667x320->900x720`
  try {
    await page.goto("/ondo-b?city=seoul&view=map&category=korean", { waitUntil: "domcontentloaded" })
    const root = page.getByTestId("ondo-b-map-entry")
    await expect(root).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
    await root.getByTestId("ondo-b-search").fill("mapo")
    await expect(root).toHaveAttribute("data-result-count", "5")
    const zoom = root.locator(".maplibregl-ctrl-bottom-right .maplibregl-ctrl-group")
    const firstZoom = zoom.getByRole("button").first()
    const before = await elementReceipt(firstZoom)
    issue(violations, scenario, "resize-zoom-start", "zoom-in", Boolean(before?.visible), before ? JSON.stringify(before) : "missing")
    if (before?.visible) await firstZoom.focus()
    await page.setViewportSize({ width: 667, height: 320 })
    await settleLayout(root, "ultra-short", "list")
    const [shortLayout, shortRequested, shortEffective] = await Promise.all([
      root.getAttribute("data-layout-mode"),
      root.getAttribute("data-requested-view"),
      root.getAttribute("data-effective-view"),
    ])
    issue(violations, scenario, "resize-ultra-short-layout", "layout", shortLayout === "ultra-short" && shortRequested === "map" && shortEffective === "list", `layout=${shortLayout} requested=${shortRequested} effective=${shortEffective}`)
    const active = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement | null
      const rect = element?.getBoundingClientRect()
      const style = element ? getComputedStyle(element) : null
      return {
        tag: element?.tagName ?? "none",
        testid: element?.dataset.testid ?? null,
        inZoom: Boolean(element?.closest(".maplibregl-ctrl-bottom-right")),
        isFirstRow: element != null && element === document.querySelector("[data-testid='ondo-b-list-panel'] li[data-venue-id] button"),
        visible: Boolean(rect && style && rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden"),
      }
    })
    issue(violations, scenario, "resize-focus-valid", "active-element", active.visible && !active.inZoom && (active.testid === "ondo-b-search" || active.isFirstRow), JSON.stringify(active))
    issue(violations, scenario, "resize-list-visible", "list-panel", Boolean((await elementReceipt(root.getByTestId("ondo-b-list-panel")))?.visible), "effective list must be rendered")
    issue(violations, scenario, "resize-query-category-count", "compact-list", await root.getByTestId("ondo-b-search").inputValue() === "mapo" && await root.getAttribute("data-result-count") === "5" && (await root.getByTestId("ondo-b-category-rail").getByRole("button", { pressed: true }).textContent())?.trim() === (locale === "en" ? "Korean" : "한식"), `query=${await root.getByTestId("ondo-b-search").inputValue()} count=${await root.getAttribute("data-result-count")}`)

    await page.setViewportSize({ width: 900, height: 720 })
    await settleLayout(root, "spacious-map", "map")
    await expect(root).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
    await expect(zoom.getByRole("button")).toHaveCount(2, { timeout: 20_000 })
    const [returnLayout, returnRequested, returnEffective] = await Promise.all([
      root.getAttribute("data-layout-mode"),
      root.getAttribute("data-requested-view"),
      root.getAttribute("data-effective-view"),
    ])
    issue(violations, scenario, "resize-map-restored", "layout", returnLayout === "spacious-map" && returnRequested === "map" && returnEffective === "map", `layout=${returnLayout} requested=${returnRequested} effective=${returnEffective}`)
    issue(violations, scenario, "resize-query-category-count", "restored-map", await root.getByTestId("ondo-b-search").inputValue() === "mapo" && await root.getAttribute("data-result-count") === "5" && (await root.getByTestId("ondo-b-category-rail").getByRole("button", { pressed: true }).textContent())?.trim() === (locale === "en" ? "Korean" : "한식"), `query=${await root.getByTestId("ondo-b-search").inputValue()} count=${await root.getAttribute("data-result-count")}`)
    const restoredZoom = await elementReceipt(zoom)
    issue(violations, scenario, "resize-zoom-restored", "zoom-controls", Boolean(restoredZoom?.visible && await zoom.getByRole("button").count() === 2), restoredZoom ? JSON.stringify(restoredZoom) : "missing")
  } catch (error) {
    violations.push({ scenario, rule: "resize-flow-completed", subject: "zoom-focus", detail: error instanceof Error ? error.message : String(error) })
  } finally {
    await context.close()
  }
}

async function auditListFallback(browser: Browser, violations: Violation[], locale: Locale) {
  const context = await browser.newContext({ viewport: { width: 320, height: 320 } })
  await seedContext(context, locale)
  const page = await context.newPage()
  const scenario = `${locale}/320x320/list-fallback`
  try {
    await page.goto("/ondo-b?city=seoul&view=map&category=korean", { waitUntil: "domcontentloaded" })
    const root = page.getByTestId("ondo-b-map-entry")
    await root.waitFor({ state: "visible" })
    const query = "mapo"
    const search = root.getByTestId("ondo-b-search")
    await search.fill(query)
    await expect(root).toHaveAttribute("data-result-count", "5")
    const panel = root.getByTestId("ondo-b-list-panel")
    const canvas = await elementReceipt(root)
    const panelReceipt = await elementReceipt(panel)
    const [layoutMode, requestedView, effectiveView, blockSizeValue] = await Promise.all([
      root.getAttribute("data-layout-mode"),
      root.getAttribute("data-requested-view"),
      root.getAttribute("data-effective-view"),
      root.getAttribute("data-map-root-block-size"),
    ])
    issue(violations, scenario, "layout-mode-by-actual-root", "data-layout-mode", layoutMode === "ultra-short", `actual=${layoutMode}`)
    issue(violations, scenario, "requested-view-truth", "data-requested-view", requestedView === "map", `actual=${requestedView}`)
    issue(violations, scenario, "effective-view-truth", "data-effective-view", effectiveView === "list", `actual=${effectiveView}`)
    issue(violations, scenario, "root-block-size-receipt", "data-map-root-block-size", Boolean(canvas && Number.isFinite(Number(blockSizeValue)) && Math.abs(Number(blockSizeValue) - canvas.height) <= 1), `reported=${blockSizeValue} actual=${canvas?.height}`)
    issue(violations, scenario, "fallback-query-preserved", "search", await search.inputValue() === query, `value=${await search.inputValue()}`)
    issue(violations, scenario, "fallback-category-preserved", "category", (await root.getByTestId("ondo-b-category-rail").getByRole("button", { pressed: true }).textContent())?.trim() === (locale === "en" ? "Korean" : "한식"), `pressed=${await root.getByTestId("ondo-b-category-rail").getByRole("button", { pressed: true }).textContent()}`)
    issue(violations, scenario, "fallback-result-count", "data-result-count", await root.getAttribute("data-result-count") === "5", `actual=${await root.getAttribute("data-result-count")}`)
    issue(violations, scenario, "fallback-city-preserved", "city-heading", (await root.locator(":scope > header h1").textContent())?.trim() === (locale === "en" ? "Seoul" : "서울"), `heading=${await root.locator(":scope > header h1").textContent()}`)
    issue(violations, scenario, "fallback-list-visible", "list-panel", Boolean(canvas && panelReceipt?.visible && panelReceipt.height > 0 && inside(panelReceipt, canvas)), panelReceipt ? JSON.stringify(panelReceipt) : "missing")
    const firstRow = panel.locator("li[data-venue-id] button").first()
    const rowReceipt = await elementReceipt(firstRow)
    issue(violations, scenario, "fallback-row-visible", "first-result", Boolean(canvas && panelReceipt && rowReceipt?.visible && inside(rowReceipt, panelReceipt) && inside(rowReceipt, canvas)), rowReceipt ? JSON.stringify(rowReceipt) : "missing")
    if (rowReceipt?.visible) {
      await firstRow.focus()
      issue(violations, scenario, "fallback-row-keyboard-focus", "first-result", await firstRow.evaluate((node) => document.activeElement === node), `active=${await page.evaluate(() => (document.activeElement as HTMLElement | null)?.tagName)}`)
      issue(violations, scenario, "target-44px", "fallback-first-result", rowReceipt.width >= 44 && rowReceipt.height >= 44, `${rounded(rowReceipt.width)}x${rounded(rowReceipt.height)}`)
    }
    for (const [label, locator] of [
      ["map-key", root.getByTestId("ondo-b-map-key")],
      ["locate", root.getByTestId("ondo-b-locate")],
      ["message", root.locator("[data-testid='ondo-b-location-message'],[data-testid='ondo-b-location-disclosure'],[data-testid='ondo-b-location-status'],[data-testid='ondo-b-offline-status']")],
      ["attribution", root.locator("a[href*='openfreemap.org'],[data-testid='ondo-b-map-attribution'],[data-testid='ondo-b-attribution']")],
    ] as const) {
      issue(violations, scenario, "ultra-short-map-chrome-absent", label, !(await elementReceipt(locator))?.visible, "map-only chrome must be absent")
    }
    const zoomButtons = root.locator(".maplibregl-ctrl-bottom-right .maplibregl-ctrl-group button")
    const focusableZoom = await zoomButtons.evaluateAll((buttons) => buttons.filter((button) => {
      const element = button as HTMLElement
      const rect = element.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0 && element.tabIndex >= 0
    }).length)
    issue(violations, scenario, "compact-zoom-not-focusable", "map-zoom", focusableZoom === 0, `visible-focusable=${focusableZoom}`)
    const nav = page.getByTestId("ondo-main-nav")
    const outerCanvas = await elementReceipt(page.getByTestId("ondo-canvas"))
    const compactResult = await resultLocator(root)
    await auditUltraShortViewMode(violations, scenario, root, compactResult)
    const [resultReceipt, navReceipt] = await Promise.all([elementReceipt(compactResult), elementReceipt(nav)])
    if (panelReceipt && resultReceipt) issue(violations, scenario, "list-nav-clearance", "panel:result", intersectionArea(panelReceipt, resultReceipt) <= .5, `area=${intersectionArea(panelReceipt, resultReceipt)}`)
    if (panelReceipt && navReceipt) issue(violations, scenario, "list-nav-clearance", "panel:nav", intersectionArea(panelReceipt, navReceipt) <= .5, `area=${intersectionArea(panelReceipt, navReceipt)}`)
    if (outerCanvas) for (let index = 0; index < 3; index += 1) await recordTarget(violations, scenario, `nav-${index + 1}`, nav.getByRole("button").nth(index), outerCanvas)
    await auditOverflow(violations, scenario, page, root, "list")

    await page.setViewportSize({ width: 900, height: 720 })
    await settleLayout(root, "spacious-map", "map")
    await expect(root).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
    issue(violations, scenario, "fallback-map-restored", "effective-view", await root.getAttribute("data-layout-mode") === "spacious-map" && await root.getAttribute("data-requested-view") === "map" && await root.getAttribute("data-effective-view") === "map", `layout=${await root.getAttribute("data-layout-mode")} requested=${await root.getAttribute("data-requested-view")} effective=${await root.getAttribute("data-effective-view")}`)
    issue(violations, scenario, "fallback-query-preserved", "resized-search", await search.inputValue() === query && await root.getAttribute("data-result-count") === "5", `value=${await search.inputValue()} count=${await root.getAttribute("data-result-count")}`)
  } catch (error) {
    violations.push({ scenario, rule: "fallback-flow-completed", subject: "list-fallback", detail: error instanceof Error ? error.message : String(error) })
  } finally {
    await context.close()
  }
}

test.describe("ONDO B production map chrome RED matrix", () => {
  test.describe.configure({ timeout: 1_800_000 })

  test("B-PROD-MAP-CHROME-RED-001 seals map chrome across locales, states and structural seams", async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "The explicit viewport matrix has one Chromium owner.")
    const violations: Violation[] = []
    await runStateMatrix(browser, violations)
    for (const locale of ["en", "ko"] as const) {
      for (const target of [{ label: "short-667x320", width: 667, height: 320 }, { label: "short-844x390", width: 844, height: 390 }] as const) {
        for (const phase of ["ready", "denied", "offline"] as const) await auditUltraShortStateCarry(browser, violations, locale, phase, target)
      }
      await auditRootBoundaryModes(browser, violations, locale)
      await auditRequestedViewKeyboard(browser, violations, locale)
      await auditZoomResize(browser, violations, locale)
      await auditListFallback(browser, violations, locale)
    }

    violations.sort((left, right) => `${left.scenario}|${left.rule}|${left.subject}|${left.detail ?? ""}`.localeCompare(`${right.scenario}|${right.rule}|${right.subject}|${right.detail ?? ""}`))
    const exactReceipt = JSON.stringify(violations)
    const stableReceipt = JSON.stringify(violations.map(({ scenario, rule, subject }) => ({ scenario, rule, subject })))
    const hash = createHash("sha256").update(stableReceipt).digest("hex")
    const counts = Object.fromEntries([...new Set(violations.map((entry) => entry.rule))].sort().map((rule) => [rule, violations.filter((entry) => entry.rule === rule).length]))
    await testInfo.attach("map-chrome-red-exact-failures.json", { body: exactReceipt, contentType: "application/json" })
    console.log(`MAP_CHROME_RED_HASH ${hash}`)
    console.log(`MAP_CHROME_RED_COUNT ${violations.length}`)
    console.log(`MAP_CHROME_RED_RULE_COUNTS ${JSON.stringify(counts)}`)
    console.log(`MAP_CHROME_RED_EXACT ${stableReceipt}`)
    expect(violations.length, `map chrome failures (${hash}):\n${JSON.stringify({ counts, failures: violations.slice(0, 160) }, null, 2)}`).toBe(0)
  })
})
