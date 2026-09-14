import { expect, test, type Locator, type Page } from "@playwright/test"
import { CANONICAL_MAP_VENUES_COMPACT } from "../../lib/ondo/venues/map-data"
import {
  JEJU_EDITORIAL_PLACES,
  type EditorialPlaceB,
} from "../../features/ondo/pulse-b/japan-first-pulse-model-b"
import {
  editorialMemoryCardViewModelB,
  officialMemoryCardViewModelB,
  resolveVisibleMyKoreaMemorySequenceB,
} from "../../features/ondo/my/memory-venue-card-b-model"
import {
  MY_KOREA_SAVED_EDITORIAL_OPENER_ATTRIBUTE,
  MY_KOREA_SAVED_OFFICIAL_OPENER_ATTRIBUTE,
} from "../../features/ondo/my/my-korea-place-return-b"
import {
  B_DEVICE_KEY,
  expectBRuntimeClean,
  gotoB,
  installBRuntimeGuard,
  prepareBPage,
  seedB,
  type BLocale,
} from "../helpers/ondo-b-qa"

const PORTRAIT_VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
] as const

const LANDSCAPE_VIEWPORT = { width: 844, height: 390 } as const
const OFFICIAL_SAVED_ID = "mois-0021cd596bc5b2a922ad"
const OFFICIAL_RECENT_ID = "mois-18939eecb43c15ab4305"
const EDITORIAL_MEDIA_IDS = [
  "jeju-seongsan-ilchulbong",
  "jeju-gwangchigi-beach",
  "jeju-gwaneumsa",
  "jeju-donsadon",
  "jeju-oneunjeong-gimbap",
] as const

type MemorySeed = Readonly<{
  savedVenueIds?: readonly string[]
  savedEditorialPlaceIds?: readonly EditorialPlaceB["id"][]
  recentVenueIds?: readonly string[]
  recentEditorialPlaceIds?: readonly EditorialPlaceB["id"][]
}>

type MediaReceipt = Readonly<{
  objectId: string
  namespace: string
  sourceKind: string
  mediaKind: string
  mediaSourceId: string
  crop: string
}>

function officialVenue(id: string) {
  const venue = CANONICAL_MAP_VENUES_COMPACT.find((candidate) => candidate.id === id)
  if (!venue) throw new Error(`Missing canonical My Korea fixture: ${id}`)
  return venue
}

function editorialPlace(id: string) {
  const place = JEJU_EDITORIAL_PLACES.find((candidate) => candidate.id === id)
  if (!place) throw new Error(`Missing editorial My Korea fixture: ${id}`)
  return place
}

function fullMemorySeed(): MemorySeed {
  return {
    savedVenueIds: [OFFICIAL_SAVED_ID],
    savedEditorialPlaceIds: EDITORIAL_MEDIA_IDS.slice(0, 3),
    recentVenueIds: [OFFICIAL_RECENT_ID],
    recentEditorialPlaceIds: EDITORIAL_MEDIA_IDS.slice(3),
  }
}

function expectedMediaReceipts(locale: BLocale, seed: MemorySeed): readonly MediaReceipt[] {
  const models = [
    ...(seed.savedVenueIds ?? []).map((id) => officialMemoryCardViewModelB(officialVenue(id), locale)),
    ...(seed.savedEditorialPlaceIds ?? []).map((id) => editorialMemoryCardViewModelB(editorialPlace(id), locale)),
    ...(seed.recentVenueIds ?? []).map((id) => officialMemoryCardViewModelB(officialVenue(id), locale)),
    ...(seed.recentEditorialPlaceIds ?? []).map((id) => editorialMemoryCardViewModelB(editorialPlace(id), locale)),
  ]
  return resolveVisibleMyKoreaMemorySequenceB(models).map((model) => ({
    objectId: model.objectId,
    namespace: model.objectNamespace,
    sourceKind: model.source.kind,
    mediaKind: model.media.kind,
    mediaSourceId: model.media.mediaSourceId,
    crop: model.media.crop,
  }))
}

async function installMemoryLayoutShiftProbe(page: Page) {
  await page.addInitScript(() => {
    const probe = window as unknown as { __ondoMyKoreaMemoryCls?: number }
    probe.__ondoMyKoreaMemoryCls = 0
    try {
      const observer = new PerformanceObserver((list) => {
        for (const rawEntry of list.getEntries()) {
          const entry = rawEntry as PerformanceEntry & {
            value?: number
            hadRecentInput?: boolean
            sources?: readonly { node?: Node | null }[]
          }
          if (entry.hadRecentInput || typeof entry.value !== "number") continue
          const touchesMemoryCard = entry.sources?.some(({ node }) => (
            node instanceof Element && Boolean(node.closest("[data-memory-venue-card]"))
          ))
          if (touchesMemoryCard) probe.__ondoMyKoreaMemoryCls = (probe.__ondoMyKoreaMemoryCls ?? 0) + entry.value
        }
      })
      observer.observe({ type: "layout-shift", buffered: true })
    } catch {
      // The initial/settled geometry assertion below remains authoritative in
      // engines without Layout Instability API support.
    }
  })
}

async function openMyKorea(page: Page, locale: BLocale, memory: MemorySeed = {}) {
  await seedB(page, {
    locale,
    local: {
      savedVenueIds: [...(memory.savedVenueIds ?? [])],
      savedEditorialPlaceIds: [...(memory.savedEditorialPlaceIds ?? [])],
      recentVenueIds: [...(memory.recentVenueIds ?? [])],
      recentEditorialPlaceIds: [...(memory.recentEditorialPlaceIds ?? [])],
      plannedTableRefs: [],
      localSignalPostedVenueIds: [],
      commerceLocalBoundarySeen: false,
      commerceReceipts: [],
    },
  })
  await gotoB(page)
  await expect.poll(() => page.getByTestId("ondo-canvas").evaluate((canvas) => getComputedStyle(canvas).display), {
    message: "the hydrated B canvas must own layout before opening My Korea",
  }).toBe("grid")
  await page.getByTestId("nav-my").click()
  const root = page.getByTestId("ondo-b-my-korea-entry")
  await expect(root).toBeVisible()
  return root
}

async function domMediaReceipts(root: Locator): Promise<readonly MediaReceipt[]> {
  return root.locator("[data-memory-venue-card]").evaluateAll((cards) => cards.map((card) => {
    const media = card.querySelector<HTMLElement>("[data-media-state]")
    return {
      objectId: card.getAttribute("data-object-id") ?? "",
      namespace: card.getAttribute("data-object-namespace") ?? "",
      sourceKind: card.getAttribute("data-source-kind") ?? "",
      mediaKind: card.getAttribute("data-configured-media-kind") ?? "",
      mediaSourceId: card.getAttribute("data-media-source-id") ?? "",
      crop: media?.style.getPropertyValue("--memory-crop").trim() ?? "",
    }
  }))
}

async function expectNoHorizontalOverflow(page: Page, root: Locator) {
  expect(await page.locator("html").evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
  expect(await root.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
}

async function expectPortraitMemoryGeometry(root: Locator) {
  const official = root.locator('[data-memory-venue-card][data-source-kind="official_directory"]').first()
  const editorial = root.locator('[data-memory-venue-card][data-source-kind="editorial_place"]').first()
  await expect(official).toBeVisible()
  await expect(editorial).toBeVisible()
  const receipts = await Promise.all([official, editorial].map((card) => card.evaluate((element) => {
    const open = element.querySelector<HTMLElement>(":scope > button")
    const media = element.querySelector<HTMLElement>("[data-media-state]")
    const glyph = element.querySelector<HTMLElement>("[data-source-glyph]")
    const cardBox = element.getBoundingClientRect()
    const mediaBox = media?.getBoundingClientRect()
    const glyphBox = glyph?.getBoundingClientRect()
    return {
      childTags: Array.from(element.children).map((child) => child.tagName),
      cardWidth: cardBox.width,
      columns: open ? getComputedStyle(open).gridTemplateColumns : "",
      mediaWidth: mediaBox?.width ?? 0,
      mediaRatio: mediaBox ? mediaBox.width / mediaBox.height : 0,
      glyphWidth: glyphBox?.width ?? 0,
      glyphHeight: glyphBox?.height ?? 0,
    }
  })))
  expect(receipts[0].childTags).toEqual(["BUTTON", "DETAILS", "DIV"])
  expect(receipts[1].childTags).toEqual(receipts[0].childTags)
  expect(Math.abs(receipts[0].cardWidth - receipts[1].cardWidth)).toBeLessThanOrEqual(1)
  expect(receipts[0].columns).toBe(receipts[1].columns)
  expect(Math.abs(receipts[0].mediaWidth - receipts[1].mediaWidth)).toBeLessThanOrEqual(1)
  expect(Math.abs(receipts[0].mediaRatio - receipts[1].mediaRatio)).toBeLessThan(0.02)
  for (const receipt of receipts) {
    expect(receipt.glyphWidth).toBeGreaterThanOrEqual(21)
    expect(receipt.glyphHeight).toBeGreaterThanOrEqual(21)
  }
}

test.describe("Wave 3 · My Korea memory · mobile non-author acceptance", () => {
  test.beforeEach(async ({ page }) => {
    installBRuntimeGuard(page)
    await prepareBPage(page)
  })

  test.afterEach(async ({ page }) => {
    await expectBRuntimeClean(page)
  })

  for (const locale of ["en", "ko", "ja"] as const) {
    test(`W3-MY-MOBILE-EMPTY-${locale.toUpperCase()} 320/390 keep one empty-map action and no invented lanes`, async ({ page }) => {
      await page.setViewportSize(PORTRAIT_VIEWPORTS[0])
      const root = await openMyKorea(page, locale)

      for (const viewport of PORTRAIT_VIEWPORTS) {
        await page.setViewportSize(viewport)
        await expect(root).toHaveAttribute("data-empty-journey", "true")
        await expect(root.getByTestId("my-korea-map-memory")).toBeVisible()
        await expect(root.getByTestId("my-korea-empty-memory")).toBeVisible()
        await expect(root.getByTestId("my-korea-empty-explore")).toHaveCount(1)
        await expect(root.getByTestId("my-korea-empty-explore")).toBeVisible()
        await expect(root.getByTestId("my-korea-empty-explore")).toBeEnabled()
        await expect(root.locator("[data-memory-venue-card]")).toHaveCount(0)
        for (const absentLane of [
          "ondo-b-saved-entry",
          "my-korea-recent",
          "my-korea-planned",
          "my-korea-receipts",
          "my-korea-contributions",
        ]) await expect(root.getByTestId(absentLane)).toHaveCount(0)
        const actionBox = await root.getByTestId("my-korea-empty-explore").boundingBox()
        expect(actionBox?.height ?? 0).toBeGreaterThanOrEqual(44)
        await expectNoHorizontalOverflow(page, root)
      }
    })

    test(`W3-MY-MOBILE-POPULATED-${locale.toUpperCase()} 320/390 keep shared truth geometry, media priority and stable crops`, async ({ page }) => {
      await installMemoryLayoutShiftProbe(page)
      await page.setViewportSize(PORTRAIT_VIEWPORTS[0])
      const seed = fullMemorySeed()
      const root = await openMyKorea(page, locale, seed)
      await expect(root).toHaveAttribute("data-empty-journey", "false")
      await expect(root.getByTestId("my-korea-empty-memory")).toHaveCount(0)
      await expect(root.getByTestId("my-korea-empty-explore")).toHaveCount(0)
      await expect(root.getByTestId("ondo-b-saved-entry")).toBeVisible()
      await expect(root.getByTestId("my-korea-recent")).toBeVisible()
      for (const absentLane of ["my-korea-planned", "my-korea-receipts", "my-korea-contributions"]) {
        await expect(root.getByTestId(absentLane)).toHaveCount(0)
      }

      const expected = expectedMediaReceipts(locale, seed)
      const expectedLocaleInvariant = expectedMediaReceipts("en", seed).map(({ objectId, mediaSourceId, crop }) => ({ objectId, mediaSourceId, crop }))
      expect(expected.map(({ objectId, mediaSourceId, crop }) => ({ objectId, mediaSourceId, crop }))).toEqual(expectedLocaleInvariant)
      await expect(root.locator("[data-memory-venue-card]")).toHaveCount(expected.length)
      await expect.poll(() => domMediaReceipts(root)).toEqual(expected)

      const firstCard = root.locator("[data-memory-venue-card]").first()
      await firstCard.waitFor({ state: "attached" })
      const initialBox = await firstCard.boundingBox()
      const images = root.locator("[data-memory-venue-card] img")
      await expect(images).toHaveCount(expected.length)
      await expect.poll(() => images.first().evaluate((image) => (
        (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0
      ))).toBe(true)
      await page.evaluate(async () => {
        await document.fonts.ready
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
      })
      const settledBox = await firstCard.boundingBox()
      expect(Math.abs((initialBox?.width ?? 0) - (settledBox?.width ?? 0))).toBeLessThanOrEqual(1)
      expect(Math.abs((initialBox?.height ?? 0) - (settledBox?.height ?? 0))).toBeLessThanOrEqual(1)
      expect(await page.evaluate(() => (window as unknown as { __ondoMyKoreaMemoryCls?: number }).__ondoMyKoreaMemoryCls ?? 0)).toBeLessThanOrEqual(0.1)

      const imagePriority = await images.evaluateAll((imageElements) => imageElements.map((image) => ({
        readable: (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0 && !image.hasAttribute("hidden"),
        loading: (image as HTMLImageElement).loading,
        fetchPriority: (image as HTMLImageElement).fetchPriority,
      })))
      const readable = imagePriority.filter((receipt) => receipt.readable)
      expect(readable.length).toBeGreaterThanOrEqual(1)
      expect(readable.filter(({ loading, fetchPriority }) => loading === "eager" && fetchPriority === "high")).toHaveLength(1)
      expect(readable.filter(({ loading, fetchPriority }) => loading === "eager" || fetchPriority === "high")).toHaveLength(1)

      for (let index = 1; index < expected.length; index += 1) {
        expect(`${expected[index].mediaSourceId}|${expected[index].crop}`).not.toBe(`${expected[index - 1].mediaSourceId}|${expected[index - 1].crop}`)
      }

      for (const viewport of PORTRAIT_VIEWPORTS) {
        await page.setViewportSize(viewport)
        await expectPortraitMemoryGeometry(root)
        await expectNoHorizontalOverflow(page, root)
        if (viewport.width === 390) {
          await expect(root.getByTestId("my-korea-map-memory")).toBeInViewport()
          await expect(root.locator("[data-memory-venue-card]").first()).toBeInViewport()
        }
      }

      const beforeReload = await domMediaReceipts(root)
      await page.reload({ waitUntil: "domcontentloaded" })
      await expect.poll(() => page.getByTestId("ondo-canvas").evaluate((canvas) => getComputedStyle(canvas).display)).toBe("grid")
      await page.getByTestId("nav-my").click()
      const reloadedRoot = page.getByTestId("ondo-b-my-korea-entry")
      await expect(reloadedRoot).toBeVisible()
      await expect.poll(() => domMediaReceipts(reloadedRoot)).toEqual(beforeReload)
    })
  }

  test("W3-MY-MOBILE-FALLBACK five failed memory images retain source truth and usable actions", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    for (const source of [
      "**/editorial/japan-first-c18-jeju-screen-route.jpg",
      "**/editorial/japan-first-c20-jeju-kpop-route.jpg",
    ]) {
      await page.route(source, (route) => route.fulfill({ status: 200, contentType: "image/jpeg", body: "not-an-image" }))
    }
    const root = await openMyKorea(page, "ja", { savedEditorialPlaceIds: EDITORIAL_MEDIA_IDS })
    const cards = root.locator('[data-memory-venue-card][data-source-kind="editorial_place"]')
    await expect(cards).toHaveCount(5)
    for (let index = 0; index < 5; index += 1) await cards.nth(index).scrollIntoViewIfNeeded()
    await expect.poll(() => cards.evaluateAll((elements) => elements.map((element) => ({
      configured: element.getAttribute("data-configured-media-kind"),
      rendered: element.getAttribute("data-media-kind"),
      source: element.getAttribute("data-source-kind"),
      exact: element.getAttribute("data-exact-venue-photo"),
      mediaState: element.querySelector("[data-media-state]")?.getAttribute("data-media-state"),
    })))).toEqual(Array.from({ length: 5 }, () => ({
      configured: "editorial_illustration",
      rendered: "pictogram_fallback",
      source: "editorial_place",
      exact: "false",
      mediaState: "fallback",
    })))

    for (let index = 0; index < 5; index += 1) {
      const card = cards.nth(index)
      await expect(card.locator(":scope > button")).toBeEnabled()
      await expect(card.locator("details > summary")).toBeVisible()
      await expect(card.locator('[role="img"]')).toBeVisible()
    }
    await cards.first().locator("details > summary").click()
    await expect(cards.first().locator("details")).toHaveAttribute("open", "")
    const remove = cards.last().locator("button").last()
    await remove.click()
    await expect(page.getByTestId("saved-remove-dialog")).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(page.getByTestId("saved-remove-dialog")).toHaveCount(0)
    await expect(remove).toBeFocused()
    await expectNoHorizontalOverflow(page, root)
  })

  test("W3-MY-MOBILE-LANDSCAPE 844x390 at 200% keeps exact removal media in one right-side scroll topology", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize(LANDSCAPE_VIEWPORT)
    const root = await openMyKorea(page, "ja", {
      savedVenueIds: [OFFICIAL_SAVED_ID],
      savedEditorialPlaceIds: [EDITORIAL_MEDIA_IDS[0]],
    })
    await page.locator("html").evaluate((element) => {
      const html = element as HTMLElement
      html.style.setProperty("-webkit-text-size-adjust", "200%")
      html.style.setProperty("text-size-adjust", "200%")
    })
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
    await expectNoHorizontalOverflow(page, root)
    const memoryMap = await root.getByTestId("my-korea-map-memory").boundingBox()
    const firstMemory = await root.locator("[data-memory-venue-card]").first().boundingBox()
    expect((memoryMap?.x ?? 1_000) + (memoryMap?.width ?? 0)).toBeLessThanOrEqual((firstMemory?.x ?? 0) + 2)

    const editorialCard = root.getByTestId(`saved-editorial-card-${EDITORIAL_MEDIA_IDS[0]}`)
    const rowReceipt = await editorialCard.evaluate((card) => {
      const media = card.querySelector<HTMLElement>("[data-media-state]")
      return {
        objectId: card.getAttribute("data-object-id"),
        mediaSourceId: card.getAttribute("data-media-source-id"),
        crop: media?.style.getPropertyValue("--memory-crop").trim(),
      }
    })
    const opener = editorialCard.getByTestId(`saved-editorial-${EDITORIAL_MEDIA_IDS[0]}`)
    await expect(opener).toHaveAttribute(MY_KOREA_SAVED_EDITORIAL_OPENER_ATTRIBUTE, EDITORIAL_MEDIA_IDS[0])
    await expect(root.getByTestId(`saved-venue-${OFFICIAL_SAVED_ID}`)).toHaveAttribute(MY_KOREA_SAVED_OFFICIAL_OPENER_ATTRIBUTE, OFFICIAL_SAVED_ID)
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
    const beforeDevice = await page.evaluate((key) => localStorage.getItem(key), B_DEVICE_KEY)
    const beforeScrollY = await page.evaluate(() => window.scrollY)
    const remove = editorialCard.locator("button").last()
    await remove.click()

    const dialog = page.getByTestId("saved-remove-dialog")
    const scrollOwner = page.getByTestId("saved-remove-scroll")
    await expect(dialog).toBeVisible()
    await expect(scrollOwner.locator(`[data-removal-object-id="${rowReceipt.objectId}"]`)).toBeVisible()
    const thumbnail = scrollOwner.locator('[data-removal-object-id] [data-media-source-id]')
    await expect(thumbnail).toHaveAttribute("data-media-source-id", rowReceipt.mediaSourceId ?? "")
    expect(await thumbnail.evaluate((element) => (element as HTMLElement).style.getPropertyValue("--memory-crop").trim())).toBe(rowReceipt.crop)

    const topology = await dialog.evaluate((element) => {
      const scrollable = Array.from(element.querySelectorAll<HTMLElement>("*")).filter((node) => {
        const overflow = getComputedStyle(node).overflowY
        return overflow === "auto" || overflow === "scroll"
      })
      const buttons = Array.from(element.querySelectorAll<HTMLButtonElement>("button"))
      const box = element.getBoundingClientRect()
      return {
        dialog: { x: box.x, y: box.y, width: box.width, height: box.height, right: box.right, bottom: box.bottom },
        scrollOwners: scrollable.map((node) => node.getAttribute("data-testid")),
        actionsOutsideScroll: buttons.every((button) => !scrollable.some((owner) => owner.contains(button))),
        actionBoxes: buttons.map((button) => {
          const action = button.getBoundingClientRect()
          return { width: action.width, height: action.height, bottom: action.bottom }
        }),
      }
    })
    expect(topology.scrollOwners).toEqual(["saved-remove-scroll"])
    expect(topology.actionsOutsideScroll).toBe(true)
    expect(topology.dialog.x).toBeGreaterThanOrEqual(400)
    expect(topology.dialog.right).toBeLessThanOrEqual(LANDSCAPE_VIEWPORT.width)
    expect(topology.dialog.bottom).toBeLessThanOrEqual(LANDSCAPE_VIEWPORT.height)
    expect(topology.dialog.height).toBeLessThanOrEqual(LANDSCAPE_VIEWPORT.height)
    for (const action of topology.actionBoxes) {
      expect(action.width).toBeGreaterThanOrEqual(44)
      expect(action.height).toBeGreaterThanOrEqual(44)
      expect(action.bottom).toBeLessThanOrEqual(LANDSCAPE_VIEWPORT.height)
    }
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    expect(await page.locator("html").evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    expect(await page.evaluate(() => window.scrollY)).toBe(beforeScrollY)
    expect(await page.evaluate((key) => localStorage.getItem(key), B_DEVICE_KEY)).toBe(beforeDevice)
    const actionYBefore = await dialog.locator("button").evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().y))
    await scrollOwner.evaluate((element) => { element.scrollTop = element.scrollHeight })
    const actionYAfter = await dialog.locator("button").evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().y))
    expect(actionYAfter).toEqual(actionYBefore)
    expect(await editorialCard.locator("details > summary > svg:last-child").evaluate((element) => {
      const duration = getComputedStyle(element).transitionDuration
      return duration.endsWith("ms") ? Number.parseFloat(duration) : Number.parseFloat(duration) * 1_000
    })).toBeLessThanOrEqual(1)
    expect(await root.getByTestId("my-korea-map-memory").locator("g[data-city] circle:last-child").first().evaluate((element) => getComputedStyle(element).animationName)).toBe("none")

    await page.keyboard.press("Escape")
    await expect(dialog).toHaveCount(0)
    await expect(remove).toBeFocused()
    expect(await page.evaluate(() => window.scrollY)).toBe(beforeScrollY)
    expect(await page.evaluate((key) => localStorage.getItem(key), B_DEVICE_KEY)).toBe(beforeDevice)
  })
})
