import { expect, test, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const APPROVED_MOOD_IMAGES = [
  "/editorial/food/ondo-category-casual-v1.jpg",
  "/editorial/food/ondo-category-chinese-v1.jpg",
  "/editorial/food/ondo-category-global-v1.jpg",
  "/editorial/food/ondo-category-japanese-v1.jpg",
  "/editorial/food/ondo-category-korean-v1.jpg",
  "/editorial/food/ondo-category-night-v1.jpg",
  "/editorial/food/ondo-category-night-v2.jpg",
  "/editorial/food/ondo-category-night-v3.jpg",
  "/editorial/food/ondo-category-specialty-v1.jpg",
]

async function seedDirectory(page: Page) {
  await page.addInitScript((key) => {
    localStorage.setItem(key, JSON.stringify({
      locale: "en",
      onboarding: "ONB-COMPLETE",
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
    }))
  }, DEVICE_KEY)
}

test.describe("venue list photography", () => {
  test.describe.configure({ timeout: 90_000 })

  for (const viewport of [
    { width: 320, height: 720 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 1440, height: 1000 },
  ]) {
    test(`${viewport.width}x${viewport.height} keeps food imagery, truth and the touch target together`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await seedDirectory(page)
      await page.goto("/?city=seoul&view=list", { waitUntil: "domcontentloaded" })

      const cards = page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id]")
      await expect(cards.first()).toBeVisible()
      const firstCard = cards.first()
      await expect.poll(() => firstCard.locator("button").evaluate((node) => getComputedStyle(node).display)).toBe("grid")
      const media = firstCard.locator("[data-image-kind='category-mood']")
      const image = media.locator("img")

      await expect(media).toHaveAttribute("aria-hidden", "true")
      await expect(media).toHaveAttribute("data-photo-kind", "category-illustration")
      await expect(media).toHaveAttribute("data-photo-state", "loaded")
      await expect(image).toHaveAttribute("alt", "")
      await expect(image).toHaveAttribute("loading", "lazy")
      await expect(image).toHaveJSProperty("complete", true)
      expect(await image.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
      expect(APPROVED_MOOD_IMAGES).toContain(new URL(await image.getAttribute("src") ?? "", page.url()).pathname)

      const geometry = await firstCard.locator("button").evaluate((button) => {
        const mediaBox = button.querySelector<HTMLElement>("[data-image-kind='category-mood']")!.getBoundingClientRect()
        const copyBox = button.querySelector<HTMLElement>(":scope > span:nth-child(2)")!.getBoundingClientRect()
        const chevronBox = button.querySelector<SVGElement>(":scope > svg")!.getBoundingClientRect()
        const buttonBox = button.getBoundingClientRect()
        return {
          buttonHeight: buttonBox.height,
          buttonClientWidth: button.clientWidth,
          buttonScrollWidth: button.scrollWidth,
          mediaWidth: mediaBox.width,
          mediaInside: mediaBox.left >= buttonBox.left && mediaBox.right <= buttonBox.right,
          copyAfterMedia: copyBox.left >= mediaBox.right,
          chevronAfterCopy: chevronBox.left >= copyBox.right - .5,
        }
      })
      expect(geometry.buttonHeight).toBeGreaterThanOrEqual(80)
      expect(geometry.buttonScrollWidth).toBeLessThanOrEqual(geometry.buttonClientWidth + 1)
      expect(geometry.mediaWidth).toBeGreaterThanOrEqual(viewport.height <= 500 ? 48 : viewport.width <= 340 ? 60 : 78)
      expect(geometry.mediaInside).toBe(true)
      expect(geometry.copyAfterMedia).toBe(true)
      expect(geometry.chevronAfterCopy).toBe(true)

      const lens = page.getByTestId("ondo-b-preference-summary")
      await expect(lens).toBeVisible()
      const [lensBox, cardBox] = await Promise.all([lens.boundingBox(), firstCard.boundingBox()])
      expect(lensBox).not.toBeNull()
      expect(cardBox).not.toBeNull()
      const overlaps = lensBox!.x < cardBox!.x + cardBox!.width
        && lensBox!.x + lensBox!.width > cardBox!.x
        && lensBox!.y < cardBox!.y + cardBox!.height
        && lensBox!.y + lensBox!.height > cardBox!.y
      expect(overlaps).toBe(false)

      await expect(firstCard.getByTestId("official-source-name")).not.toBeEmpty()
      await expect(firstCard.getByTestId("ondo-b-list-pulse")).toHaveAttribute("data-pulse-numeric", "hidden")
    })
  }

  test("a single-category night list does not repeat one thumbnail down the first fold", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedDirectory(page)
    await page.goto("/?city=seoul&view=list&category=night", { waitUntil: "domcontentloaded" })

    const images = page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id] img")
    await expect(images.first()).toBeVisible()
    const firstFourSources = await images.evaluateAll((nodes) => nodes.slice(0, 4).map((node) => new URL((node as HTMLImageElement).src).pathname))
    expect(new Set(firstFourSources).size).toBeGreaterThanOrEqual(2)
    expect(firstFourSources.every((source) => APPROVED_MOOD_IMAGES.includes(source))).toBe(true)
  })

  test("a failed category image falls back without changing the card action", async ({ page }) => {
    await seedDirectory(page)
    await page.route("**/editorial/food/*.jpg", (route) => route.abort("failed"))
    await page.goto("/?city=seoul&view=list", { waitUntil: "domcontentloaded" })

    const firstCard = page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id]").first()
    const media = firstCard.locator("[data-photo-kind='category-illustration']")
    await expect(media).toHaveAttribute("data-photo-state", "error")
    await firstCard.locator("button").click()
    await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
  })
})
