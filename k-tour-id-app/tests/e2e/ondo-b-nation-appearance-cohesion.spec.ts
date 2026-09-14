import { expect, test } from "@playwright/test"
import { seedB } from "../helpers/ondo-b-qa"

test.describe("Korea overview appearance cohesion", () => {
  test.describe.configure({ timeout: 120_000 })

  for (const appearance of ["light", "dark"] as const) {
    test(`${appearance} owns the map intro, brand and geographic labels on phone and desktop`, async ({ page }) => {
      await seedB(page, { local: { appearancePreference: appearance } })

      for (const viewport of [
        { width: 390, height: 844 },
        { width: 1440, height: 1000 },
      ]) {
        await page.setViewportSize(viewport)
        await page.goto("/", { waitUntil: "domcontentloaded" })
        await expect(page.getByTestId("ondo-b-root")).toHaveAttribute("data-appearance", appearance)
        await expect(page.locator("html")).toHaveAttribute("data-ondo-theme", appearance)
        await expect(page.getByTestId("maplibre-map")).toHaveAttribute("data-map-projection-settled", "true")

        const atlas = page.getByTestId("ondo-b-korea-atlas")
        const heading = atlas.getByRole("heading", { level: 1 })
        const header = page.getByTestId("ondo-b-map-entry").locator("header").first()
        const brand = header.locator("[data-ondo-brand-lockup]")
        const tagline = header.locator("small")
        const language = header.locator("button")
        const cityLabel = atlas.locator("[data-city='seoul'] strong")

        await expect(atlas).toBeVisible()
        await expect(heading).toBeVisible()
        const palette = await atlas.evaluate((element) => {
          const headingElement = element.querySelector("h1")
          const city = element.querySelector("[data-city='seoul'] strong")
          const scrim = getComputedStyle(element, "::before")
          const box = element.getBoundingClientRect()
          return {
            heading: headingElement ? getComputedStyle(headingElement).color : "",
            city: city ? getComputedStyle(city).color : "",
            scrim: scrim.backgroundImage,
            scrimHeightRatio: Number.parseFloat(scrim.height) / box.height,
          }
        })

        const foreground = appearance === "dark" ? "rgb(244, 244, 245)" : "rgb(23, 23, 23)"
        expect(palette.heading).toBe(foreground)
        expect(palette.city).toBe(foreground)
        expect(palette.scrim).toContain(appearance === "dark"
          ? "rgba(8, 10, 14, 0.94)"
          : "rgba(255, 255, 255, 0.94)")
        expect(palette.scrimHeightRatio).toBeLessThanOrEqual(.43)
        await expect(brand).toHaveCSS("color", foreground)
        await expect(language).toHaveCSS("color", foreground)
        await expect(tagline).toHaveCSS("color", appearance === "dark" ? "rgb(183, 182, 188)" : "rgb(98, 98, 98)")
        expect(await page.locator("html").evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
      }
    })
  }
})
