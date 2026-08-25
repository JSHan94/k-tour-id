import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test"
import {
  gotoB,
  openCanonicalVenue,
  prepareBPage,
  seedB,
  seedFreshOnboarding,
} from "../helpers/ondo-b-qa"

const VIEWPORTS = [
  { id: "320x800", width: 320, height: 800 },
  { id: "390x844", width: 390, height: 844 },
  { id: "844x390", width: 844, height: 390 },
  { id: "1440x1000", width: 1440, height: 1000 },
] as const

const LOCALES = ["en", "ko"] as const

async function seedCompletedBDevice(page: Page, locale: (typeof LOCALES)[number]) {
  await page.addInitScript(({ deviceLocale }) => {
    localStorage.setItem("ondo-b.device.v1", JSON.stringify({
      locale: deviceLocale,
      onboarding: "ONB-COMPLETE",
      persona: "short_term",
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
      recentVenueIds: [],
      plannedTableRefs: [],
      localSignalPostedVenueIds: [],
      localPulseEvidenceByVenue: {},
      localInteractionBoundarySeen: false,
      commerceLocalBoundarySeen: false,
      commerceReceipts: [],
    }))
  }, { deviceLocale: locale })
}

async function expectNoClip(scope: Locator) {
  const clipped = await scope.evaluateAll((nodes) => nodes.map((node) => ({
    horizontal: node.scrollWidth > node.clientWidth + 1,
    vertical: node.scrollHeight > node.clientHeight + 1,
  })))
  expect(clipped).toEqual(clipped.map(() => ({ horizontal: false, vertical: false })))
}

async function expectNoPageOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
}

async function screenshot(page: Page, testInfo: TestInfo, name: string) {
  await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true, animations: "disabled" })
}

test.describe("ONDO Explore visual-excellence contract", () => {
  test.describe.configure({ timeout: 240_000 })

  test.beforeEach(async ({ page }) => {
    await prepareBPage(page)
  })

  for (const locale of LOCALES) {
    test(`${locale.toUpperCase()} onboarding is a branded Pulse journey without clipped truth or phone-width desktop framing`, async ({ page }, testInfo) => {
      await seedFreshOnboarding(page, locale)

      for (const viewport of VIEWPORTS) {
        await test.step(viewport.id, async () => {
          await page.setViewportSize(viewport)
          await gotoB(page)
          const dialog = page.getByTestId("ondo-onboarding")
          const value = page.getByTestId("onboarding-step-value")
          await expect(dialog).toBeVisible()
          await expectNoClip(value.locator("section span"))
          await expectNoPageOverflow(page)

          const composition = await dialog.evaluate((element) => {
            const valueStep = element.querySelector("[data-testid='onboarding-step-value']")!
            const layer = element.getBoundingClientRect()
            const scene = getComputedStyle(valueStep, "::after")
            return {
              layerWidth: layer.width,
              sceneBackground: scene.backgroundImage,
              sceneOpacity: Number.parseFloat(scene.opacity || "1"),
            }
          })
          expect(composition.sceneBackground).not.toBe("none")
          expect(composition.sceneOpacity).toBeGreaterThan(.2)
          if (viewport.width >= 800) expect(composition.layerWidth).toBeGreaterThan(viewport.width * .82)

          await screenshot(page, testInfo, `explore-onboarding-${locale}-${viewport.id}`)
        })
      }
    })

    test(`${locale.toUpperCase()} Nation and Seoul list share the same elevated Pulse material grammar`, async ({ page }, testInfo) => {
      await seedB(page, { locale })
      await seedCompletedBDevice(page, locale)

      for (const viewport of VIEWPORTS) {
        await test.step(viewport.id, async () => {
          await page.setViewportSize(viewport)
          await gotoB(page)

          const nation = page.getByTestId("ondo-b-nation")
          const city = nation.locator("[data-city='seoul']")
          const atlas = nation.locator("svg").locator("..")
          const cityMaterial = await city.evaluate((element) => {
            const style = getComputedStyle(element)
            return { radius: Number.parseFloat(style.borderRadius), background: style.backgroundImage, shadow: style.boxShadow }
          })
          const atlasScene = await atlas.evaluate((element) => getComputedStyle(element, "::before").backgroundImage)
          expect(cityMaterial.radius).toBeGreaterThanOrEqual(22)
          expect(cityMaterial.background).not.toBe("none")
          expect(cityMaterial.shadow).not.toBe("none")
          expect(atlasScene).not.toBe("none")
          await expectNoPageOverflow(page)
          await screenshot(page, testInfo, `explore-nation-${locale}-${viewport.id}`)

          await gotoB(page, "?city=seoul&view=list")
          const list = page.getByTestId("ondo-b-venue-list")
          const first = list.locator("li[data-venue-id]").first()
          await expect(first).toBeVisible()
          const rowMaterial = await first.evaluate((element) => {
            const style = getComputedStyle(element)
            const rail = getComputedStyle(element, "::before")
            return {
              radius: Number.parseFloat(style.borderRadius),
              background: style.backgroundImage,
              shadow: style.boxShadow,
              railWidth: Number.parseFloat(rail.width),
              railBackground: rail.backgroundColor,
            }
          })
          expect(rowMaterial.radius).toBeGreaterThanOrEqual(18)
          expect(rowMaterial.background).not.toBe("none")
          expect(rowMaterial.shadow).not.toBe("none")
          expect(rowMaterial.railWidth).toBeGreaterThanOrEqual(3)
          expect(rowMaterial.railBackground).not.toBe("rgba(0, 0, 0, 0)")
          await expectNoPageOverflow(page)
          await screenshot(page, testInfo, `explore-list-${locale}-${viewport.id}`)
        })
      }
    })

    test(`${locale.toUpperCase()} place summary and detail create a tactile decision hierarchy`, async ({ page }, testInfo) => {
      await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED" } })
      await seedCompletedBDevice(page, locale)

      for (const viewport of VIEWPORTS) {
        await test.step(viewport.id, async () => {
          await page.setViewportSize(viewport)
          await openCanonicalVenue(page, { expanded: false })
          const peek = page.getByTestId("canonical-place-peek")
          const peekMaterial = await peek.evaluate((element) => {
            const style = getComputedStyle(element)
            const title = getComputedStyle(element.querySelector("h2")!)
            const pulse = getComputedStyle(element.querySelector("[data-testid='canonical-place-pulse']")!)
            return {
              radius: Number.parseFloat(style.borderRadius),
              titleClamp: title.webkitLineClamp,
              pulseBackground: pulse.backgroundImage,
              shadow: style.boxShadow,
            }
          })
          expect(peekMaterial.radius).toBeGreaterThanOrEqual(26)
          expect(peekMaterial.titleClamp).toBe("2")
          expect(peekMaterial.pulseBackground).not.toBe("none")
          expect(peekMaterial.shadow).not.toBe("none")
          await expectNoPageOverflow(page)
          await screenshot(page, testInfo, `explore-peek-${locale}-${viewport.id}`)

          await page.getByTestId("canonical-place-details").click()
          const overlay = page.getByTestId("canonical-place-overlay")
          await expect(overlay.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")
          const detailComposition = await overlay.evaluate((element) => {
            const article = element.querySelector("article")!
            const body = article.querySelector(":scope > div")!
            const articleStyle = getComputedStyle(article)
            const bodyStyle = getComputedStyle(body)
            return {
              width: article.getBoundingClientRect().width,
              radius: Number.parseFloat(articleStyle.borderTopLeftRadius),
              bodyDisplay: bodyStyle.display,
              bodyColumns: bodyStyle.gridTemplateColumns.split(" ").filter(Boolean).length,
            }
          })
          expect(detailComposition.radius).toBeGreaterThanOrEqual(26)
          if (viewport.width >= 1200) {
            expect(detailComposition.width).toBeGreaterThanOrEqual(820)
            expect(detailComposition.bodyDisplay).toBe("grid")
            expect(detailComposition.bodyColumns).toBeGreaterThanOrEqual(2)
          }
          await expectNoPageOverflow(page)
          await screenshot(page, testInfo, `explore-detail-${locale}-${viewport.id}`)
        })
      }
    })
  }

  test("reduced motion removes decorative entrance movement without removing content", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await seedFreshOnboarding(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoB(page)
    expect(await page.getByTestId("onboarding-step-value").evaluate((element) => getComputedStyle(element).animationName)).toBe("none")
    await page.getByRole("button", { name: "Explore as a guest", exact: true }).click()
    await openCanonicalVenue(page, { expanded: false })
    expect(await page.getByTestId("canonical-place-peek").evaluate((element) => getComputedStyle(element).animationName)).toBe("none")
  })
})
