import { expect, test, type Locator, type Page } from "@playwright/test"
import {
  MY_KOREA_PLACE_RETURN_HISTORY_KEY,
  MY_KOREA_SAVED_EDITORIAL_OPENER_ATTRIBUTE,
  MY_KOREA_SAVED_OFFICIAL_OPENER_ATTRIBUTE,
} from "../../features/ondo/my/my-korea-place-return-b"
import {
  CANONICAL_VENUE_ID,
  expectBRuntimeClean,
  gotoB,
  hasBRuntimeGuard,
  installBRuntimeGuard,
  prepareBPage,
  seedB,
} from "../helpers/ondo-b-qa"

const PORTRAIT_VIEWPORT = { width: 390, height: 844 } as const
const LANDSCAPE_VIEWPORT = { width: 844, height: 390 } as const
const EDITORIAL_PLACE_ID = "jeju-seongsan-ilchulbong"
const SUPPORTING_EDITORIAL_PLACE_IDS = [
  EDITORIAL_PLACE_ID,
  "jeju-gwangchigi-beach",
  "jeju-gwaneumsa",
] as const

type SavedTarget =
  | Readonly<{ kind: "official"; id: typeof CANONICAL_VENUE_ID }>
  | Readonly<{ kind: "editorial"; id: typeof EDITORIAL_PLACE_ID }>

type HistorySnapshot = Readonly<{
  url: string
  historyLength: number
  discovery: Record<string, unknown> | null
  receipt: Record<string, unknown> | null
  device: string | null
  session: string | null
}>

const OFFICIAL_TARGET = { kind: "official", id: CANONICAL_VENUE_ID } as const
const EDITORIAL_TARGET = { kind: "editorial", id: EDITORIAL_PLACE_ID } as const

async function historySnapshot(page: Page): Promise<HistorySnapshot> {
  return page.evaluate((returnKey) => {
    const state = history.state && typeof history.state === "object"
      ? history.state as Record<string, unknown>
      : null
    const record = (value: unknown) => value && typeof value === "object" && !Array.isArray(value)
      ? value as Record<string, unknown>
      : null
    return {
      url: `${location.pathname}${location.search}${location.hash}`,
      historyLength: history.length,
      discovery: record(state?.__ondoBDiscovery),
      receipt: record(state?.[returnKey]),
      device: localStorage.getItem("ondo-b.device.v1"),
      session: sessionStorage.getItem("ondo-b.account.v1"),
    }
  }, MY_KOREA_PLACE_RETURN_HISTORY_KEY)
}

async function discoveryEntry(page: Page) {
  return (await historySnapshot(page)).discovery
}

function savedOpener(page: Page, target: SavedTarget) {
  return target.kind === "official"
    ? page.getByTestId(`saved-venue-${target.id}`)
    : page.getByTestId(`saved-editorial-${target.id}`)
}

function savedOpenerAttribute(target: SavedTarget) {
  return target.kind === "official"
    ? MY_KOREA_SAVED_OFFICIAL_OPENER_ATTRIBUTE
    : MY_KOREA_SAVED_EDITORIAL_OPENER_ATTRIBUTE
}

function placePeek(page: Page, target: SavedTarget) {
  return target.kind === "official"
    ? page.getByTestId("canonical-place-peek")
    : page.getByTestId("ondo-b-editorial-place-peek")
}

function placeDetailsAction(page: Page, target: SavedTarget) {
  return target.kind === "official"
    ? page.getByTestId("canonical-place-details")
    : page.getByTestId("ondo-b-editorial-place-details")
}

function placeDetail(page: Page, target: SavedTarget) {
  return target.kind === "official"
    ? page.getByTestId("canonical-place-overlay")
    : page.getByTestId("ondo-b-editorial-place-overlay")
}

async function expectSavedPeek(page: Page, target: SavedTarget) {
  const peek = placePeek(page, target)
  await expect(page.getByTestId("nav-ondo")).toHaveAttribute("aria-current", "page")
  await expect(peek).toBeVisible()
  if (target.kind === "official") {
    await expect(peek).toHaveAttribute("data-venue-id", target.id)
    await expect.poll(() => discoveryEntry(page)).toMatchObject({
      level: "peek",
      city: "seoul",
      sheetSnap: "peek",
      venueId: target.id,
    })
  } else {
    await expect(peek).toHaveAttribute("data-editorial-place-id", target.id)
    await expect.poll(() => discoveryEntry(page)).toMatchObject({
      level: "peek",
      city: "jeju",
      sheetSnap: "peek",
      editorialPlaceId: target.id,
    })
  }
  await expect(placeDetail(page, target)).toHaveCount(0)
  await expect(page.locator("[role='dialog']:visible")).toHaveCount(1)
  return peek
}

async function expectPlaceDetail(page: Page, target: SavedTarget) {
  const detail = placeDetail(page, target)
  await expect(detail).toBeVisible()
  if (target.kind === "official") {
    await expect(detail).toHaveAttribute("data-venue-id", target.id)
    await expect.poll(() => discoveryEntry(page)).toMatchObject({
      level: "detail",
      city: "seoul",
      sheetSnap: "detail",
      venueId: target.id,
    })
  } else {
    await expect(detail).toHaveAttribute("data-editorial-place-id", target.id)
    await expect.poll(() => discoveryEntry(page)).toMatchObject({
      level: "detail",
      city: "jeju",
      sheetSnap: "detail",
      editorialPlaceId: target.id,
    })
  }
  await expect(placePeek(page, target)).toHaveCount(0)
  return detail
}

async function expectNavigationPrivacy(page: Page, journeyId?: string) {
  const snapshot = await historySnapshot(page)
  expect(snapshot.url).not.toMatch(/__ondoBMyKoreaReturn|journeyId|scrollTop|sourceKind|privateNote|account|person|ageExpiresAt|payment|gate/i)
  expect(JSON.stringify(snapshot.discovery)).not.toMatch(/account|person|ageExpiresAt|payment|gate|private-search|privateNote/i)
  expect(snapshot.device).not.toContain(MY_KOREA_PLACE_RETURN_HISTORY_KEY)
  expect(snapshot.session).not.toContain(MY_KOREA_PLACE_RETURN_HISTORY_KEY)
  if (journeyId) {
    expect(snapshot.device).not.toContain(journeyId)
    expect(snapshot.session).not.toContain(journeyId)
  }
}

async function expectReturnReceipt(
  page: Page,
  target: SavedTarget,
  phase: "origin" | "place",
  scrollTop: number,
  journeyId?: string,
) {
  const sourceKind = target.kind === "official" ? "official" : "editorial"
  const sourceIdentity = target.kind === "official"
    ? { venueId: target.id }
    : { editorialPlaceId: target.id }
  await expect.poll(async () => (await historySnapshot(page)).receipt).toMatchObject({
    v: 1,
    phase,
    section: "saved",
    scrollTop,
    sourceKind,
    ...sourceIdentity,
    ...(journeyId ? { journeyId } : {}),
  })

  const receipt = (await historySnapshot(page)).receipt
  expect(receipt).not.toBeNull()
  const expectedKeys = [
    "journeyId",
    "phase",
    "scrollTop",
    "section",
    "sourceKind",
    "v",
    target.kind === "official" ? "venueId" : "editorialPlaceId",
  ].sort()
  expect(Object.keys(receipt ?? {}).sort()).toEqual(expectedKeys)
  expect(receipt?.journeyId).toEqual(expect.stringMatching(/^MYK-B-[0-9a-f-]{36}$/))
  expect(JSON.stringify(receipt)).not.toMatch(/locale|name|note|account|person|identity|credential|ageExpiresAt|payment|gate|query|heat|private/i)
  const exactJourneyId = receipt?.journeyId as string
  if (journeyId) expect(exactJourneyId).toBe(journeyId)
  await expectNavigationPrivacy(page, exactJourneyId)
  return exactJourneyId
}

async function openMyKoreaAtNonzeroSavedScroll(page: Page, target: SavedTarget) {
  await page.getByTestId("nav-my").click()
  const root = page.getByTestId("ondo-b-my-korea-entry")
  const scrollOwner = page.getByTestId("ondo-scroll-region")
  const opener = savedOpener(page, target)
  await expect(root).toBeVisible()
  await expect(opener).toHaveAttribute(savedOpenerAttribute(target), target.id)
  await opener.evaluate((element) => element.scrollIntoView({ block: "center" }))
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
  await expect(opener).toBeInViewport()
  const scrollTop = await scrollOwner.evaluate((element) => element.scrollTop)
  expect(scrollTop).toBeGreaterThan(0)
  const before = await historySnapshot(page)
  expect(before.receipt).toBeNull()
  await opener.click()
  return { before, scrollTop }
}

async function expectExactMyOrigin(
  page: Page,
  target: SavedTarget,
  scrollTop: number,
  journeyId: string,
) {
  await expect(page.getByTestId("nav-my")).toHaveAttribute("aria-current", "page")
  await expect(page.getByTestId("ondo-b-my-korea-entry")).toBeVisible()
  await expect(placePeek(page, target)).toHaveCount(0)
  await expect(placeDetail(page, target)).toHaveCount(0)
  await expect.poll(() => page.getByTestId("ondo-scroll-region").evaluate((element) => element.scrollTop)).toBe(scrollTop)
  const opener = savedOpener(page, target)
  await expect(opener).toHaveAttribute(savedOpenerAttribute(target), target.id)
  await expect(opener).toBeFocused()
  await expectReturnReceipt(page, target, "origin", scrollTop, journeyId)
}

async function pressEscapeFrom(page: Page, surface: Locator) {
  await surface.focus()
  await page.keyboard.press("Escape")
}

async function seedSavedJourney(page: Page, locale: "en" | "ja" = "en") {
  await seedB(page, {
    locale,
    local: {
      savedVenueIds: [CANONICAL_VENUE_ID],
      savedEditorialPlaceIds: [...SUPPORTING_EDITORIAL_PLACE_IDS],
      recentVenueIds: [],
      recentEditorialPlaceIds: [],
      plannedTableRefs: [],
      localSignalPostedVenueIds: [],
      commerceReceipts: [],
    },
  })
}

test.describe("SLEEK saved places return to their exact My Korea origin", () => {
  test.describe.configure({ timeout: 240_000 })

  test.beforeEach(async ({ page }) => {
    await prepareBPage(page)
  })

  test.afterEach(async ({ page }) => {
    if (hasBRuntimeGuard(page)) await expectBRuntimeClean(page)
  })

  test("official saved peek Back, Close, Escape, Forward, reload, and detail Escape preserve exact portrait My", async ({ page }) => {
    installBRuntimeGuard(page)
    await page.setViewportSize(PORTRAIT_VIEWPORT)
    await seedSavedJourney(page)
    await gotoB(page, "?city=busan&view=list")
    await expect.poll(() => discoveryEntry(page)).toMatchObject({ level: "city", city: "busan", view: "list" })

    const { before, scrollTop } = await openMyKoreaAtNonzeroSavedScroll(page, OFFICIAL_TARGET)
    await expectSavedPeek(page, OFFICIAL_TARGET)
    const journeyId = await expectReturnReceipt(page, OFFICIAL_TARGET, "place", scrollTop)
    expect((await historySnapshot(page)).historyLength).toBe(before.historyLength + 1)
    expect((await historySnapshot(page)).url).toBe(`/?city=seoul&venueId=${CANONICAL_VENUE_ID}`)

    await page.evaluate(() => history.back())
    await expectExactMyOrigin(page, OFFICIAL_TARGET, scrollTop, journeyId)
    expect((await historySnapshot(page)).url).toBe(before.url)
    await expect.poll(() => discoveryEntry(page)).toMatchObject({ level: "city", city: "busan", view: "list" })
    await page.reload({ waitUntil: "domcontentloaded" })
    await expectExactMyOrigin(page, OFFICIAL_TARGET, scrollTop, journeyId)

    await page.evaluate(() => history.forward())
    await expectSavedPeek(page, OFFICIAL_TARGET)
    await expectReturnReceipt(page, OFFICIAL_TARGET, "place", scrollTop, journeyId)
    await page.reload({ waitUntil: "domcontentloaded" })
    await expectSavedPeek(page, OFFICIAL_TARGET)
    await expectReturnReceipt(page, OFFICIAL_TARGET, "place", scrollTop, journeyId)

    await placePeek(page, OFFICIAL_TARGET).getByRole("button", { name: "Close place" }).click()
    await expectExactMyOrigin(page, OFFICIAL_TARGET, scrollTop, journeyId)
    expect((await historySnapshot(page)).historyLength).toBe(before.historyLength + 1)

    await page.evaluate(() => history.forward())
    const escapedPeek = await expectSavedPeek(page, OFFICIAL_TARGET)
    await pressEscapeFrom(page, escapedPeek)
    await expectExactMyOrigin(page, OFFICIAL_TARGET, scrollTop, journeyId)
    expect((await historySnapshot(page)).historyLength).toBe(before.historyLength + 1)

    await page.evaluate(() => history.forward())
    await expectSavedPeek(page, OFFICIAL_TARGET)
    await placeDetailsAction(page, OFFICIAL_TARGET).click()
    const escapedDetail = await expectPlaceDetail(page, OFFICIAL_TARGET)
    await pressEscapeFrom(page, escapedDetail)
    await expectExactMyOrigin(page, OFFICIAL_TARGET, scrollTop, journeyId)
    expect((await historySnapshot(page)).historyLength).toBe(before.historyLength + 2)
  })

  test("Jeju editorial detail Back preserves peek while Close and Escape unwind two landscape steps to exact My", async ({ page }) => {
    installBRuntimeGuard(page)
    await page.setViewportSize(LANDSCAPE_VIEWPORT)
    await seedSavedJourney(page)
    await gotoB(page, "?city=seoul&view=list")
    await expect.poll(() => discoveryEntry(page)).toMatchObject({ level: "city", city: "seoul", view: "list" })

    const { before, scrollTop } = await openMyKoreaAtNonzeroSavedScroll(page, EDITORIAL_TARGET)
    await expectSavedPeek(page, EDITORIAL_TARGET)
    const journeyId = await expectReturnReceipt(page, EDITORIAL_TARGET, "place", scrollTop)
    expect((await historySnapshot(page)).historyLength).toBe(before.historyLength + 1)
    expect((await historySnapshot(page)).url).toBe(`/?city=jeju&editorialPlaceId=${EDITORIAL_PLACE_ID}`)

    await placeDetailsAction(page, EDITORIAL_TARGET).click()
    let detail = await expectPlaceDetail(page, EDITORIAL_TARGET)
    await expectReturnReceipt(page, EDITORIAL_TARGET, "place", scrollTop, journeyId)
    expect((await historySnapshot(page)).historyLength).toBe(before.historyLength + 2)

    await detail.getByRole("button", { name: "Back to place summary" }).last().click()
    await expectSavedPeek(page, EDITORIAL_TARGET)
    await expect(placeDetailsAction(page, EDITORIAL_TARGET)).toBeFocused()

    await placeDetailsAction(page, EDITORIAL_TARGET).click()
    detail = await expectPlaceDetail(page, EDITORIAL_TARGET)
    await detail.getByRole("button", { name: "Close place" }).click()
    await expectExactMyOrigin(page, EDITORIAL_TARGET, scrollTop, journeyId)
    expect((await historySnapshot(page)).historyLength).toBe(before.historyLength + 2)

    await page.evaluate(() => history.forward())
    await expectSavedPeek(page, EDITORIAL_TARGET)
    await page.evaluate(() => history.forward())
    detail = await expectPlaceDetail(page, EDITORIAL_TARGET)
    await page.reload({ waitUntil: "domcontentloaded" })
    detail = await expectPlaceDetail(page, EDITORIAL_TARGET)
    await expectReturnReceipt(page, EDITORIAL_TARGET, "place", scrollTop, journeyId)

    await pressEscapeFrom(page, detail)
    await expectExactMyOrigin(page, EDITORIAL_TARGET, scrollTop, journeyId)
    expect((await historySnapshot(page)).historyLength).toBe(before.historyLength + 2)
  })

  test("malformed My receipt falls back to canonical discovery and removes injected raw fields", async ({ page }) => {
    installBRuntimeGuard(page)
    await page.setViewportSize(PORTRAIT_VIEWPORT)
    await seedSavedJourney(page)
    await gotoB(page, "?city=busan&view=list")
    const { before, scrollTop } = await openMyKoreaAtNonzeroSavedScroll(page, OFFICIAL_TARGET)
    await expectSavedPeek(page, OFFICIAL_TARGET)
    const journeyId = await expectReturnReceipt(page, OFFICIAL_TARGET, "place", scrollTop)

    await page.evaluate(() => history.back())
    await expectExactMyOrigin(page, OFFICIAL_TARGET, scrollTop, journeyId)
    await page.evaluate((returnKey) => {
      const state = history.state as Record<string, unknown>
      const receipt = state[returnKey] as Record<string, unknown>
      History.prototype.replaceState.call(history, {
        ...state,
        [returnKey]: { ...receipt, privateNote: "raw-account-note" },
      }, "", location.href)
    }, MY_KOREA_PLACE_RETURN_HISTORY_KEY)

    await page.evaluate(() => history.forward())
    await expectSavedPeek(page, OFFICIAL_TARGET)
    await page.evaluate(() => history.back())
    await expect(page.getByTestId("nav-ondo")).toHaveAttribute("aria-current", "page")
    await expect(page.getByTestId("ondo-b-map-entry")).toBeVisible()
    await expect(page.getByTestId("ondo-b-my-korea-entry")).toHaveCount(0)
    await expect(placePeek(page, OFFICIAL_TARGET)).toHaveCount(0)
    await expect.poll(async () => (await historySnapshot(page)).receipt).toBeNull()
    await expect.poll(() => discoveryEntry(page)).toMatchObject({ level: "city", city: "busan", view: "list" })
    const fallback = await historySnapshot(page)
    expect(fallback.url).toBe(before.url)
    expect(fallback.historyLength).toBe(before.historyLength + 1)
    expect(JSON.stringify(fallback)).not.toContain("raw-account-note")
    await expectNavigationPrivacy(page, journeyId)
  })

  test("choosing another tab explicitly abandons only the active My return receipt", async ({ page }) => {
    installBRuntimeGuard(page)
    await page.setViewportSize(PORTRAIT_VIEWPORT)
    await seedSavedJourney(page)
    await gotoB(page, "?city=busan&view=list")
    const { scrollTop } = await openMyKoreaAtNonzeroSavedScroll(page, OFFICIAL_TARGET)
    await expectSavedPeek(page, OFFICIAL_TARGET)
    const journeyId = await expectReturnReceipt(page, OFFICIAL_TARGET, "place", scrollTop)
    await page.evaluate(() => history.back())
    await expectExactMyOrigin(page, OFFICIAL_TARGET, scrollTop, journeyId)
    const origin = await historySnapshot(page)

    await page.getByTestId("nav-settings").click()
    await expect(page.getByTestId("ondo-b-settings-entry")).toBeVisible()
    await expect(page.getByTestId("nav-settings")).toHaveAttribute("aria-current", "page")
    const abandoned = await historySnapshot(page)
    expect(abandoned.receipt).toBeNull()
    expect(abandoned.discovery).toEqual(origin.discovery)
    expect(abandoned.url).toBe(origin.url)
    expect(abandoned.historyLength).toBe(origin.historyLength)
    await expectNavigationPrivacy(page, journeyId)

    // Explicit abandonment prunes the forward Place child. A stale receipt
    // must not resurrect the journey or switch Settings back to Explore.
    await page.evaluate(() => history.forward())
    await page.waitForTimeout(100)
    await expect(page.getByTestId("nav-settings")).toHaveAttribute("aria-current", "page")
    await expect(page.getByTestId("ondo-b-settings-entry")).toBeVisible()
    expect((await historySnapshot(page)).receipt).toBeNull()

    await page.getByTestId("nav-my").click()
    await expect(page.getByTestId("ondo-b-my-korea-entry")).toBeVisible()
    expect((await historySnapshot(page)).receipt).toBeNull()
  })

  test("A keeps its existing saved-place return behavior", async ({ page }) => {
    const legacyVenueId = "seoul-seongsu-gukbap"
    await seedB(page, { local: { savedVenueIds: [legacyVenueId] } })
    await page.goto("/ondo", { waitUntil: "domcontentloaded" })
    await page.getByTestId("nav-my").click()
    await page.getByTestId(`saved-venue-${legacyVenueId}`).click()
    await expect(page.getByTestId("place-peek")).toBeVisible()
    await expect(page.getByTestId("place-details")).toBeFocused()
    await expect(page).not.toHaveURL(/__ondoBDiscovery|private-account-id/)
  })
})
