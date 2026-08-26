import { expect, test, type Locator, type Page } from "@playwright/test"

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
  test.describe.configure({ timeout: 180_000 })

  test("Polarsteps-inspired Korea atlas keeps geographic anchors separate at every product breakpoint", async ({ page }) => {
    for (const profile of MATRIX) {
      await page.setViewportSize({ width: profile.width, height: profile.height })
      await seed(page, profile.locale)
      await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })

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

      const atlasStyle = await atlas.evaluate((element) => {
        const style = getComputedStyle(element)
        return { radius: Number.parseFloat(style.borderRadius), shadow: style.boxShadow, background: style.backgroundImage }
      })
      expect(atlasStyle.radius).toBeGreaterThanOrEqual(profile.width >= 801 && profile.height > 500 ? 36 : 28)
      expect(atlasStyle.shadow).not.toBe("none")
      expect(atlasStyle.background).toContain("radial-gradient")
      await noHorizontalOverflow(page)
      await page.screenshot({ path: `${OUTPUT}/${profile.locale}-${profile.width}-atlas.png` })
    }
  })

  test("Mapstr plus Beli city canvas keeps a warm basemap, compact controls, Pulse truth, and tactile list rows", async ({ page }) => {
    for (const profile of MATRIX) {
      await page.setViewportSize({ width: profile.width, height: profile.height })
      await seed(page, profile.locale)
      await page.goto("/ondo-b?city=seoul", { waitUntil: "domcontentloaded" })

      const root = page.getByTestId("ondo-b-map-entry")
      await expect(root).toHaveAttribute("data-pulse-visual-grammar", "borderless-aura-core-label")
      await expect(root).toHaveAttribute("data-cluster-grammar", "official-record-count")
      await expect(root).toHaveAttribute("data-effective-view", "map")
      await expect(root).toHaveAttribute("data-map-state", /ready|error/, { timeout: 25_000 })

      const mapCanvas = page.getByTestId("maplibre-map").locator(".maplibregl-canvas")
      if (await mapCanvas.count()) {
        expect(await mapCanvas.evaluate((element) => getComputedStyle(element).filter)).toContain("saturate(0.82)")
      } else {
        const recovery = root.locator("[role='alert'] button")
        await expect(recovery).toBeVisible()
        expect((await box(recovery)).height).toBeGreaterThanOrEqual(44)
      }
      const searchRadius = await page.getByTestId("ondo-b-search-shell").evaluate((element) => Number.parseFloat(getComputedStyle(element).borderRadius))
      const resultRadius = await page.getByTestId("ondo-b-result-bar").evaluate((element) => Number.parseFloat(getComputedStyle(element).borderRadius))
      expect(searchRadius).toBeGreaterThanOrEqual(18)
      expect(resultRadius).toBeGreaterThanOrEqual(18)
      await expect(page.getByTestId("ondo-b-map-key")).toBeVisible()
      await expect(page.getByTestId("ondo-b-japan-first-discovery")).toHaveAttribute("data-city-context", "seoul")
      await noHorizontalOverflow(page)
      await page.screenshot({ path: `${OUTPUT}/${profile.locale}-${profile.width}-map.png` })

      await page.goto("/ondo-b?city=seoul&view=list", { waitUntil: "domcontentloaded" })
      const firstRow = page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id]").first()
      const rowButton = firstRow.getByRole("button")
      await expect(firstRow).toHaveAttribute("data-pulse-priority", /peak|hot|rising|warming|low|limited/)
      expect((await box(rowButton)).height).toBeGreaterThanOrEqual(44)
      expect(await firstRow.evaluate((element) => Number.parseFloat(getComputedStyle(element).borderRadius))).toBeGreaterThanOrEqual(20)
      await noHorizontalOverflow(page)
      await page.screenshot({ path: `${OUTPUT}/${profile.locale}-${profile.width}-list.png` })
    }
  })

  test("Infatuation and Guides editorial cards plus Apple and Airbnb place sheets retain all truth and actions", async ({ page }) => {
    for (const locale of ["en", "ko", "ja"] as const) {
      await page.setViewportSize({ width: 390, height: 844 })
      await seed(page, locale)
      await page.goto("/ondo-b?city=seoul", { waitUntil: "domcontentloaded" })

      const discovery = page.getByTestId("ondo-b-japan-first-discovery")
      await discovery.locator(":scope > summary").click()
      await expect(discovery).toHaveAttribute("open", "")
      const panel = discovery.locator(":scope > div")
      const firstStory = discovery.locator("[data-content-id]").first()
      const firstMedia = firstStory.locator("figure")
      expect(await panel.evaluate((element) => Number.parseFloat(getComputedStyle(element).borderRadius))).toBeGreaterThanOrEqual(24)
      expect(await firstStory.evaluate((element) => Number.parseFloat(getComputedStyle(element).borderRadius))).toBeGreaterThanOrEqual(20)
      expect((await box(firstMedia)).height / (await box(firstStory)).height).toBeGreaterThan(.38)
      const sourceDisclosure = firstStory.locator("details")
      if (await sourceDisclosure.count()) await sourceDisclosure.locator(":scope > summary").click()
      await expect(firstStory.locator("a[target='_blank']").first()).toBeVisible()
      await expect(discovery).not.toContainText(/\bP[01]\b/)
      await page.screenshot({ path: `${OUTPUT}/${locale}-390-editorial.png` })

      await page.goto("/ondo-b?city=seoul&view=list", { waitUntil: "domcontentloaded" })
      await page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id] button").first().click()
      const peek = page.getByTestId("canonical-place-peek")
      await expect(peek).toBeVisible()
      await page.waitForTimeout(360)
      expect(await peek.evaluate((element) => Number.parseFloat(getComputedStyle(element).borderRadius))).toBeGreaterThanOrEqual(30)
      await expect(peek.getByTestId("canonical-venue-directions")).toHaveAttribute("data-visual-priority", "primary")
      await expect(peek.getByTestId("canonical-place-details")).toHaveAttribute("data-visual-priority", "secondary")
      await expect(peek.getByTestId("canonical-place-pulse")).toHaveAttribute("data-pulse-numeric", /shown|hidden/)
      await page.screenshot({ path: `${OUTPUT}/${locale}-390-peek.png` })

      await peek.getByTestId("canonical-place-details").click()
      const detail = page.getByTestId("canonical-place-overlay")
      await expect(detail).toBeVisible()
      await page.waitForTimeout(420)
      expect(await detail.getByTestId("canonical-place-pulse").evaluate((element) => Number.parseFloat(getComputedStyle(element).borderRadius))).toBeGreaterThanOrEqual(24)
      await expect(detail.getByTestId("canonical-place-decisions")).toBeVisible()
      await expect(detail.getByTestId("canonical-meal-benefit-open")).toBeVisible()
      await expect(detail.getByTestId("canonical-local-signal-open")).toBeVisible()
      await expect(detail.getByTestId("canonical-source-evidence")).toBeAttached()
      await noHorizontalOverflow(page)
      await page.screenshot({ path: `${OUTPUT}/${locale}-390-detail.png` })
    }
  })
})
