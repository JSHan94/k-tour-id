import { expect, test, type Browser, type Locator, type Page } from "@playwright/test"

type Locale = "en" | "ko" | "ja"

const DEVICE_KEY = "ondo-b.device.v1"
const OUTPUT = "artifacts/qa/explore-direction"
const MATRIX = [
  { locale: "en" as const, width: 320, height: 720 },
  { locale: "ja" as const, width: 390, height: 844 },
  { locale: "ko" as const, width: 844, height: 390 },
  { locale: "en" as const, width: 1440, height: 1000 },
]

async function seed(page: Page, locale: Locale) {
  await page.addInitScript(({ key, language }) => {
    localStorage.setItem(key, JSON.stringify({
      locale: language,
      onboarding: "ONB-COMPLETE",
      persona: "travelling",
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
      recentVenueIds: [],
      plannedTableRefs: [],
      localSignalPostedVenueIds: [],
      localPulseEvidenceByVenue: {},
      localInteractionBoundarySeen: false,
      commerceReceipts: [],
    }))
  }, { key: DEVICE_KEY, language: locale })
}

async function openSeededPage(browser: Browser, locale: Locale, width: number, height: number, path: string) {
  const context = await browser.newContext({ viewport: { width, height } })
  const page = await context.newPage()
  await seed(page, locale)
  await page.goto(path, { waitUntil: "domcontentloaded" })
  await expect(page.locator("html")).toHaveAttribute("lang", locale)
  return { context, page }
}

function overlapArea(a: NonNullable<Awaited<ReturnType<Locator["boundingBox"]>>>, b: NonNullable<Awaited<ReturnType<Locator["boundingBox"]>>>) {
  return Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x))
    * Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y))
}

async function box(locator: Locator) {
  const value = await locator.boundingBox()
  expect(value).not.toBeNull()
  return value!
}

async function noHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
}

test.describe("ONDO Explore approved visual direction", () => {
  test.describe.configure({ mode: "serial", timeout: 360_000 })

  test("Polarsteps-inspired Korea atlas keeps geographic anchors separate at every product breakpoint", async ({ browser }) => {
    for (const profile of MATRIX) {
      const { context, page } = await openSeededPage(browser, profile.locale, profile.width, profile.height, "/ondo-b")

      const atlas = page.getByTestId("ondo-b-korea-atlas")
      const nodes = ["seoul", "busan", "jeju"].map((city) => atlas.locator(`[data-city='${city}']`))
      await expect(atlas).toBeVisible()
      await expect(page.getByTestId("ondo-main-nav")).toHaveAttribute("data-nav-count", "5")
      await expect(nodes[2]).toHaveAttribute("data-truth-kind", "editorial-region")
      await expect(nodes[2]).not.toHaveAttribute("data-official-count", /.+/)

      const atlasBox = await box(atlas)
      const nodeBoxes = await Promise.all(nodes.map(box))
      for (const nodeBox of nodeBoxes) {
        expect(nodeBox.x).toBeGreaterThanOrEqual(atlasBox.x - .5)
        expect(nodeBox.y).toBeGreaterThanOrEqual(atlasBox.y - .5)
        expect(nodeBox.x + nodeBox.width).toBeLessThanOrEqual(atlasBox.x + atlasBox.width + .5)
        expect(nodeBox.y + nodeBox.height).toBeLessThanOrEqual(atlasBox.y + atlasBox.height + .5)
        expect(nodeBox.height).toBeGreaterThanOrEqual(44)
      }
      for (let left = 0; left < nodeBoxes.length; left += 1) {
        for (let right = left + 1; right < nodeBoxes.length; right += 1) {
          expect(overlapArea(nodeBoxes[left], nodeBoxes[right])).toBe(0)
        }
      }
      await expect(atlas.locator("details")).toHaveCount(0)
      for (const node of nodes) await expect(node).not.toContainText(/\d|official|record|idea|공식|기록|아이디어|active|growing|운영|확장/i)
      expect(Math.max(...nodeBoxes.map((node) => node.height)) - Math.min(...nodeBoxes.map((node) => node.height))).toBeLessThanOrEqual(1)

      const atlasStyle = await atlas.evaluate((element) => {
        const style = getComputedStyle(element)
        return { radius: Number.parseFloat(style.borderRadius), shadow: style.boxShadow, background: style.backgroundImage }
      })
      expect(atlasStyle.radius).toBeGreaterThanOrEqual(profile.width >= 801 && profile.height > 500 ? 36 : 24)
      expect(atlasStyle.shadow).not.toBe("none")
      expect(atlasStyle.background).toContain("radial-gradient")
      if (profile.width === 320) {
        const truthMetrics = await atlas.locator("[data-city] em, p").evaluateAll((elements) => elements.map((element) => {
          const node = element as HTMLElement
          const style = getComputedStyle(node)
          return {
            text: node.textContent?.trim() ?? "",
            textOverflow: style.textOverflow,
            horizontalOverflow: node.scrollWidth - node.clientWidth,
            verticalOverflow: node.scrollHeight - node.clientHeight,
          }
        }))
        expect(truthMetrics.every((item) => item.textOverflow !== "ellipsis" && item.horizontalOverflow <= 1 && item.verticalOverflow <= 1)).toBe(true)
      }
      if (profile.width === 844) {
        const cityTruthMetrics = await atlas.locator("[data-city='seoul'] em, [data-city='busan'] em").evaluateAll((elements) => elements.map((element) => {
          const node = element as HTMLElement
          return {
            textOverflow: getComputedStyle(node).textOverflow,
            horizontalOverflow: node.scrollWidth - node.clientWidth,
            verticalOverflow: node.scrollHeight - node.clientHeight,
          }
        }))
        expect(cityTruthMetrics.every((item) => item.textOverflow !== "ellipsis" && item.horizontalOverflow <= 1 && item.verticalOverflow <= 1)).toBe(true)
      }
      await noHorizontalOverflow(page)
      await page.screenshot({ path: `${OUTPUT}/${profile.locale}-${profile.width}-atlas.png` })
      await context.close()
    }
  })

  test("Mapstr plus Beli city canvas keeps a neutral basemap, compact controls, Pulse truth, and tactile list rows", async ({ browser }) => {
    for (const profile of MATRIX) {
      const { context, page } = await openSeededPage(browser, profile.locale, profile.width, profile.height, "/ondo-b?city=seoul")

      const root = page.getByTestId("ondo-b-map-entry")
      await expect(root).toHaveAttribute("data-pulse-visual-grammar", "aura-scale-selection-label")
      await expect(root).toHaveAttribute("data-cluster-grammar", "official-record-count")
      await expect(root).toHaveAttribute("data-effective-view", "map")
      await expect(root).toHaveAttribute("data-map-state", /ready|error/, { timeout: 45_000 })
      const mapState = await root.getAttribute("data-map-state")

      const mapCanvas = page.getByTestId("maplibre-map").locator(".maplibregl-canvas")
      if (mapState === "ready") {
        await expect(page.getByTestId("ondo-b-map-key")).toBeVisible()
        await expect(mapCanvas).toHaveCount(1)
        expect(await mapCanvas.evaluate((element) => getComputedStyle(element).filter)).toContain("saturate(0.78)")
      } else {
        await expect(page.getByTestId("ondo-b-map-key")).toHaveCount(0)
        const fallback = page.getByTestId("ondo-b-map-fallback-status")
        await expect(fallback).toBeVisible()
        const recovery = fallback.getByRole("button")
        await expect(recovery).toBeVisible()
        expect((await box(recovery)).height).toBeGreaterThanOrEqual(44)
        await expect(page.getByTestId("ondo-b-venue-list")).toBeVisible()
      }
      const searchRadius = await page.getByTestId("ondo-b-search-shell").evaluate((element) => Number.parseFloat(getComputedStyle(element).borderRadius))
      const resultRadius = await page.getByTestId("ondo-b-result-bar").evaluate((element) => Number.parseFloat(getComputedStyle(element).borderRadius))
      expect(searchRadius).toBeGreaterThanOrEqual(14)
      expect(resultRadius).toBeGreaterThanOrEqual(14)
      await expect(page.getByTestId("ondo-b-japan-first-discovery")).toHaveAttribute("data-city-context", "seoul")
      if (profile.width === 844) {
        const searchBox = await box(page.getByTestId("ondo-b-search-shell"))
        const railBox = await box(page.getByTestId("ondo-b-category-rail"))
        const sharedRow = Math.max(0, Math.min(searchBox.y + searchBox.height, railBox.y + railBox.height) - Math.max(searchBox.y, railBox.y))
        expect(sharedRow / Math.min(searchBox.height, railBox.height)).toBeGreaterThan(.75)
        expect(searchBox.x + searchBox.width).toBeLessThanOrEqual(railBox.x - 6)
      }
      await noHorizontalOverflow(page)
      await page.screenshot({ path: `${OUTPUT}/${profile.locale}-${profile.width}-map.png` })

      await page.goto("/ondo-b?city=seoul&view=list", { waitUntil: "domcontentloaded" })
      const firstRow = page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id]").first()
      const rowButton = firstRow.getByRole("button")
      await expect(firstRow).toHaveAttribute("data-pulse-priority", /peak|hot|rising|warming|low|limited/)
      expect((await box(rowButton)).height).toBeGreaterThanOrEqual(44)
      const rowRadius = await firstRow.evaluate((element) => Number.parseFloat(getComputedStyle(element).borderRadius))
      expect(rowRadius).toBeGreaterThanOrEqual(16)
      expect(rowRadius).toBeLessThanOrEqual(20)
      const storyMarker = page.getByTestId("ondo-b-editorial-collection-marker")
      const storyBox = await box(storyMarker)
      const visibleButtons = page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id] > button:visible")
      const visibleButtonBoxes = await visibleButtons.evaluateAll((elements) => elements.map((element) => {
        const rect = element.getBoundingClientRect()
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
      }))
      for (const buttonBox of visibleButtonBoxes) expect(overlapArea(storyBox, buttonBox)).toBe(0)
      if (profile.width === 844) {
        const panelBox = await box(page.getByTestId("ondo-b-list-panel"))
        const fullyVisible = visibleButtonBoxes.filter((buttonBox) => buttonBox.y >= panelBox.y - .5 && buttonBox.y + buttonBox.height <= panelBox.y + panelBox.height + .5)
        expect(fullyVisible.length).toBeGreaterThanOrEqual(4)
      }
      await noHorizontalOverflow(page)
      await page.screenshot({ path: `${OUTPUT}/${profile.locale}-${profile.width}-list.png` })
      await context.close()
    }
  })

  for (const locale of ["en", "ko", "ja"] as const) {
    test(`Modern editorial and Place sheets retain truth and actions in ${locale}`, async ({ browser }) => {
      const { context, page } = await openSeededPage(browser, locale, 390, 844, "/ondo-b?city=seoul")

      const discovery = page.getByTestId("ondo-b-japan-first-discovery")
      await discovery.locator(":scope > summary").click()
      await expect(discovery).toHaveAttribute("open", "")
      await expect(discovery.locator(":scope > summary small")).toBeHidden()
      const openTruth = discovery.locator(":scope > summary em")
      const openTruthMetrics = await openTruth.evaluate((element) => ({
        horizontalOverflow: element.scrollWidth - element.clientWidth,
        verticalOverflow: element.scrollHeight - element.clientHeight,
        textOverflow: getComputedStyle(element).textOverflow,
        whiteSpace: getComputedStyle(element).whiteSpace,
      }))
      expect(openTruthMetrics).toEqual({ horizontalOverflow: 0, verticalOverflow: 0, textOverflow: "clip", whiteSpace: "normal" })
      const panel = discovery.locator(":scope > div")
      const firstStory = discovery.locator("[data-content-id]").first()
      const firstMedia = firstStory.locator("figure")
      const panelRadius = await panel.evaluate((element) => Number.parseFloat(getComputedStyle(element).borderRadius))
      const storyRadius = await firstStory.evaluate((element) => Number.parseFloat(getComputedStyle(element).borderRadius))
      expect(panelRadius).toBeGreaterThanOrEqual(16)
      expect(panelRadius).toBeLessThanOrEqual(20)
      expect(storyRadius).toBeGreaterThanOrEqual(15)
      expect(storyRadius).toBeLessThanOrEqual(18)
      expect((await box(firstMedia)).height / (await box(firstStory)).height).toBeGreaterThan(.38)
      await page.screenshot({ path: `${OUTPUT}/${locale}-390-editorial.png` })
      const sourceDisclosure = firstStory.locator("details")
      if (await sourceDisclosure.count()) {
        const sourceSummary = sourceDisclosure.locator(":scope > summary")
        await sourceSummary.scrollIntoViewIfNeeded()
        const sourceBox = await box(sourceSummary)
        const sourceHit = await page.evaluate(({ x, y }) => {
          const hit = document.elementFromPoint(x, y)
          return Boolean(hit?.closest("summary")?.contains(hit))
        }, { x: sourceBox.x + sourceBox.width / 2, y: sourceBox.y + sourceBox.height / 2 })
        expect(sourceHit).toBe(true)
        await sourceSummary.click()
      }
      await expect(firstStory.locator("a[target='_blank']").first()).toBeVisible()
      await expect(discovery).not.toContainText(/\bP[01]\b/)
      await page.screenshot({ path: `${OUTPUT}/${locale}-390-editorial-sources.png` })

      const supportingStory = discovery.locator("[data-editorial-role='supporting']").first()
      await supportingStory.scrollIntoViewIfNeeded()
      await expect(supportingStory).toBeVisible()
      await page.screenshot({ path: `${OUTPUT}/${locale}-390-editorial-supporting.png` })

      await page.goto("/ondo-b?city=jeju", { waitUntil: "domcontentloaded" })
      const jejuDiscovery = page.getByTestId("ondo-b-japan-first-discovery")
      await jejuDiscovery.locator(":scope > summary").click()
      const jejuSources = page.getByTestId("ondo-b-jeju-editorial-seeds")
      await jejuSources.locator(":scope > summary").click()
      await expect(jejuSources.locator("a[target='_blank']")).toHaveCount(4)
      await page.screenshot({ path: `${OUTPUT}/${locale}-390-jeju-expanded.png` })

      await page.goto("/ondo-b?city=seoul&view=list", { waitUntil: "domcontentloaded" })
      await page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id] button").first().click()
      const peek = page.getByTestId("canonical-place-peek")
      await expect(peek).toBeVisible()
      await page.waitForTimeout(360)
      const peekRadius = await peek.evaluate((element) => Number.parseFloat(getComputedStyle(element).borderRadius))
      expect(peekRadius).toBeGreaterThanOrEqual(20)
      expect(peekRadius).toBeLessThanOrEqual(24)
      await expect(peek.getByTestId("canonical-venue-directions")).toHaveAttribute("data-visual-priority", "primary")
      await expect(peek.getByTestId("canonical-place-details")).toHaveAttribute("data-visual-priority", "secondary")
      await expect(peek.getByTestId("canonical-place-pulse")).toHaveAttribute("data-pulse-numeric", /shown|hidden/)
      await page.screenshot({ path: `${OUTPUT}/${locale}-390-peek.png` })

      await peek.getByTestId("canonical-place-details").click()
      const detail = page.getByTestId("canonical-place-overlay")
      await expect(detail).toBeVisible()
      await page.waitForTimeout(420)
      const pulseRadius = await detail.getByTestId("canonical-place-pulse").evaluate((element) => Number.parseFloat(getComputedStyle(element).borderRadius))
      expect(pulseRadius).toBeGreaterThanOrEqual(18)
      expect(pulseRadius).toBeLessThanOrEqual(22)
      await expect(detail.getByTestId("canonical-place-decisions")).toBeVisible()
      await expect(detail.getByTestId("canonical-meal-benefit-open")).toBeVisible()
      await expect(detail.getByTestId("canonical-local-signal-open")).toBeVisible()
      await expect(detail.getByTestId("canonical-source-evidence")).toBeAttached()
      await noHorizontalOverflow(page)
      await page.screenshot({ path: `${OUTPUT}/${locale}-390-detail.png` })
      await context.close()
    })
  }

  test("modern desktop Place keeps the cartographic identity stage in the first viewport", async ({ browser }) => {
    const { context, page } = await openSeededPage(browser, "en", 1440, 1000, "/ondo-b?city=seoul&view=list")
    await page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id] button").first().click()
    await page.getByTestId("canonical-place-peek").getByTestId("canonical-place-details").click()
    const desktopDetail = page.getByTestId("canonical-place-overlay")
    const identity = desktopDetail.getByTestId("canonical-place-identity-stage")
    await expect(identity).toBeVisible()
    const detailBox = await box(desktopDetail)
    const identityBox = await box(identity)
    expect(identityBox.x).toBeGreaterThanOrEqual(detailBox.x)
    expect(identityBox.y).toBeGreaterThanOrEqual(detailBox.y)
    expect(identityBox.x + identityBox.width).toBeLessThanOrEqual(detailBox.x + detailBox.width + .5)
    expect(identityBox.y + identityBox.height).toBeLessThanOrEqual(Math.min(1000, detailBox.y + detailBox.height) + .5)
    expect(identityBox.width).toBeGreaterThanOrEqual(280)
    await page.screenshot({ path: `${OUTPUT}/en-1440-detail.png` })
    await context.close()
  })
})
