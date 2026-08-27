import { expect, test, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const ALLOWED_QUERY_KEYS = ["category", "city", "detail", "q", "venueId", "view"]
const KOREAN_CATEGORY_QUERY = "국밥쟁이"

async function seedDirectory(page: Page, locale: "en" | "ko") {
  await page.addInitScript(({ key, nextLocale }) => {
    localStorage.setItem(key, JSON.stringify({
      locale: nextLocale,
      onboarding: "ONB-COMPLETE",
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
    }))
  }, { key: DEVICE_KEY, nextLocale: locale })
}

async function canonicalLocation(page: Page) {
  return page.evaluate(() => {
    const url = new URL(location.href)
    return {
      hash: url.hash,
      keys: [...url.searchParams.keys()].sort(),
      params: Object.fromEntries(url.searchParams),
      discovery: history.state?.__ondoBDiscovery as Record<string, unknown> | undefined,
    }
  })
}

test.describe("ONDO B production discovery URL canonicalization", () => {
  for (const locale of ["en", "ko"] as const) {
    test(`strips every non-discovery key and hash while preserving ${locale.toUpperCase()} discovery history`, async ({ page }) => {
      await seedDirectory(page, locale)
      await page.goto(`/ondo-b?city=seoul&view=list&category=korean&q=${encodeURIComponent(KOREAN_CATEGORY_QUERY)}&qa=1&scenario=save-failed&profile=resident&token=secret-token&email=traveler%40example.com&legacy=1&heat=signal#private-fragment`, { waitUntil: "domcontentloaded" })

      const search = page.getByRole("search").getByRole("textbox")
      const category = page.getByRole("button", { name: locale === "ko" ? "한식" : "Korean", exact: true })
      await expect(search).toHaveValue(KOREAN_CATEGORY_QUERY)
      await expect(category).toHaveAttribute("aria-pressed", "true")

      const initial = await canonicalLocation(page)
      expect(initial.hash).toBe("")
      expect(initial.keys).toEqual(["category", "city", "q", "view"])
      expect(initial.params).toEqual({ city: "seoul", view: "list", q: KOREAN_CATEGORY_QUERY, category: "korean" })
      expect(initial.discovery).toMatchObject({ level: "city", city: "seoul", view: "list", query: KOREAN_CATEGORY_QUERY, category: "korean" })

      await expect.poll(() => page.evaluate(() => sessionStorage.getItem("ondo.qa.controls.v1"))).toBe("1")
      await expect.poll(() => page.evaluate(() => sessionStorage.getItem("ondo.qa.scenario.v1"))).toBe("save-failed")
      await page.getByTestId("nav-settings").click()
      await page.getByTestId("nav-ondo").click()
      await expect(search).toHaveValue(KOREAN_CATEGORY_QUERY)
      await expect.poll(() => page.evaluate(() => sessionStorage.getItem("ondo.qa.controls.v1"))).toBe("1")
      await expect.poll(() => page.evaluate(() => sessionStorage.getItem("ondo.qa.scenario.v1"))).toBe("save-failed")

      const opener = page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id] button").first()
      await opener.click()
      await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
      const peek = await canonicalLocation(page)
      expect(peek.hash).toBe("")
      expect(peek.keys.every((key) => ALLOWED_QUERY_KEYS.includes(key))).toBe(true)
      expect(peek.params).toMatchObject({ city: "seoul", view: "list", q: KOREAN_CATEGORY_QUERY, category: "korean" })
      expect(peek.discovery).toMatchObject({ level: "peek", city: "seoul", view: "list", query: KOREAN_CATEGORY_QUERY, category: "korean" })

      await page.goBack()
      await expect(page.getByTestId("canonical-place-peek")).toHaveCount(0)
      await expect(search).toHaveValue(KOREAN_CATEGORY_QUERY)
      await expect(category).toHaveAttribute("aria-pressed", "true")
      await page.goForward()
      await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
      await page.goBack()
      await expect(search).toHaveValue(KOREAN_CATEGORY_QUERY)

      await page.reload({ waitUntil: "domcontentloaded" })
      await expect(search).toHaveValue(KOREAN_CATEGORY_QUERY)
      await expect(category).toHaveAttribute("aria-pressed", "true")
      const reloaded = await canonicalLocation(page)
      expect(reloaded.hash).toBe("")
      expect(reloaded.keys).toEqual(["category", "city", "q", "view"])
      expect(reloaded.discovery).toMatchObject({ level: "city", city: "seoul", view: "list", query: KOREAN_CATEGORY_QUERY, category: "korean" })
    })
  }
})
