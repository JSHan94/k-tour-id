import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Browser, type Locator } from "@playwright/test"
import { sampleTravelerActivityB } from "../../features/ondo/contracts/traveler-activity-b"
import { researchedFoodByIdB, researchFoodIllustrationB } from "../../features/ondo/map/researched-food-b"
import { createBRuntimeContext, expectBRuntimeContextsClean, seedBContextDevicePreferences } from "../helpers/ondo-b-runtime-context"

test.afterEach(async ({}, testInfo) => { await expectBRuntimeContextsClean(testInfo) })
const DAMIBOKGUK = "mois-89dfce67a7a11084ff09"
const SCENARIOS = [{ width: 390, appearance: "light" }, { width: 320, appearance: "dark" }] as const
type ResearchFixture = { id: string; name: { en: string }; address: string; latitude: number; longitude: number; checkedAt: string; sources: Array<{ url: string; title: string }> }
const CITY_RESEARCH = (["seoul", "busan", "jeju"] as const).map(city => ({ city, places: JSON.parse(readFileSync(resolve(`data/ondo/research/${city}-food-pulse.json`), "utf8")) as ResearchFixture[] }))

async function deviceContext(browser: Browser, scenario: typeof SCENARIOS[number], baseURL: string | undefined, reducedMotion: "reduce" | "no-preference" = "reduce") {
  const context = await createBRuntimeContext(browser, {
    viewport: { width: scenario.width, height: 844 },
    colorScheme: scenario.appearance,
    reducedMotion,
    locale: "en-US",
    timezoneId: "Asia/Seoul",
  }, test.info())
  // Device preferences only. No QA globals, identity receipts or private map
  // hooks: the tests enter the same public sample journey as a visitor.
  await seedBContextDevicePreferences(context, baseURL, { locale: "en", appearancePreference: scenario.appearance, onboarding: "ONB-COMPLETE" })
  return context
}

async function expectOwnedIllustration(container: Locator) {
  const figure = container.locator('[data-food-photo="illustration"]').first()
  await expect(figure).toBeVisible()
  await expect(figure).toHaveAttribute("data-photo-state", "loaded")
  await expect(figure.locator("figcaption")).toHaveText("Food illustration")
  const image = figure.getByRole("img")
  await expect(image).toHaveAccessibleName("Illustrative food image, not a photo of this venue or its menu")
  await expect(image).toHaveAttribute("src", /^\/editorial\/food\/[a-z0-9-]+\.jpg$/)
  expect(await image.evaluate(node => {
    const image = node as HTMLImageElement
    return image.complete && image.naturalWidth > 0 && image.naturalHeight > 0
  })).toBe(true)
}

async function expectCategoryGuideGeometry(figure: Locator) {
  const icon = figure.locator("svg")
  const title = figure.locator("strong")
  const caption = figure.locator("figcaption")
  await expect(icon).toBeVisible()
  await expect(title).toBeVisible()
  await expect(caption).toBeVisible()
  const geometry = await figure.evaluate(node => {
    const bounds = (element: Element) => {
      const { left, top, right, bottom, width, height } = element.getBoundingClientRect()
      return { left, top, right, bottom, width, height }
    }
    return {
      tile: bounds(node),
      icon: bounds(node.querySelector("svg")!),
      title: bounds(node.querySelector("strong")!),
      caption: bounds(node.querySelector("figcaption")!),
      overflows: node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1,
    }
  })
  expect(geometry.overflows, "category guide must fit without clipped content").toBe(false)
  for (const part of ["icon", "title", "caption"] as const) {
    const box = geometry[part]
    expect(box.width, `${part} retains a visible width`).toBeGreaterThan(0)
    expect(box.height, `${part} retains a visible height`).toBeGreaterThan(0)
    expect(box.left, `${part} stays inside the tile's left edge`).toBeGreaterThanOrEqual(geometry.tile.left + 1)
    expect(box.top, `${part} stays inside the tile's top edge`).toBeGreaterThanOrEqual(geometry.tile.top + 1)
    expect(box.right, `${part} stays inside the tile's right edge`).toBeLessThanOrEqual(geometry.tile.right - 1)
    expect(box.bottom, `${part} stays inside the tile's bottom edge`).toBeLessThanOrEqual(geometry.tile.bottom - 1)
  }
  expect(geometry.title.top - geometry.icon.bottom, "icon and wrapped category title remain separate").toBeGreaterThanOrEqual(1)
  expect(geometry.caption.top - geometry.title.bottom, "Category guide must not overlap a wrapped title").toBeGreaterThanOrEqual(1)
}

async function expectResearchIllustration(container: Locator, id: string) {
  const media = researchFoodIllustrationB(researchedFoodByIdB(id)!)
  const figure = container.locator("[data-food-photo]").first()
  await expect(figure).toHaveAttribute("data-food-subject", media.subject)
  if (media.src) {
    await expectOwnedIllustration(container)
    await expect(figure.locator("img")).toHaveAttribute("src", media.src)
  } else {
    await expect(figure).toBeVisible()
    await expect(figure).toHaveAttribute("data-food-photo", "category-placeholder")
    await expect(figure).toHaveAttribute("data-photo-state", "not-provided")
    await expect(figure).toHaveAccessibleName(/not a photo of this venue or its menu/)
    await expect(figure.locator("img")).toHaveCount(0)
    await expect(figure.locator("figcaption")).toHaveText("Category guide")
    await expectCategoryGuideGeometry(figure)
  }
}

for (const scenario of SCENARIOS) {
  test(`native food peek opens the same-place contribution and public identity sample: ${scenario.width}px ${scenario.appearance}`, async ({ browser, baseURL }) => {
    test.setTimeout(75_000)
    const context = await deviceContext(browser, scenario, baseURL)
    try {
      const page = await context.newPage()
      const errors: string[] = []
      page.on("pageerror", error => errors.push(error.message))
      await page.goto(`${baseURL}/?city=busan&q=${encodeURIComponent("다미복국")}`, { waitUntil: "domcontentloaded" })
      const map = page.getByTestId("maplibre-map")
      const timeline = page.getByTestId("ondo-temperature-timeline")
      await expect(map).toHaveAttribute("data-map-state", "ready")
      await expect(timeline).toHaveAttribute("data-sample-core-count", "1")
      await expect(timeline).toHaveAttribute("data-reduced-motion", "true")
      await expect(timeline).toHaveAttribute("data-running", "false")
      const box = await map.boundingBox()
      expect(box).not.toBeNull()
      // A filtered canonical coordinate is the actual camera centre. Tap the
      // native hit layer, not a DOM bubble, programmatic click or hidden seam.
      await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2)
      const peek = page.getByTestId("canonical-place-peek")
      await expect(peek).toHaveAttribute("data-venue-id", DAMIBOKGUK)
      await expectOwnedIllustration(peek)
      const pulse = peek.getByTestId("canonical-place-pulse")
      await expect(pulse).toHaveAttribute("data-origin", "PREPARED_ILLUSTRATION")
      await expect(pulse).toHaveAttribute("data-sample-venue-id", DAMIBOKGUK)
      await expect(pulse).toHaveAttribute("data-temperature-score", "none")
      const contributions = pulse.getByTestId("sample-traveler-contributions")
      await expect(contributions).toHaveAttribute("data-activity-origin", "PREPARED_ILLUSTRATION")
      await expect(contributions).toHaveAttribute("data-window-minutes", "30")
      await expect(contributions).toHaveAccessibleName(/Not real visitors, posted photos or a place rating/)
      const sample = sampleTravelerActivityB("busan", DAMIBOKGUK, Number(await pulse.getAttribute("data-sample-minute")))
      await expect(contributions.locator("b")).toHaveText([sample.arrivals, sample.photos, sample.updates].map(String))
      await expect(contributions.locator("small")).toHaveText(["visits", "photos", "updates"])
      expect(await peek.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
      const peekBox = await peek.boundingBox()
      expect(peekBox!.y + peekBox!.height).toBeLessThanOrEqual(845)
      await page.screenshot({ path: test.info().outputPath(`food-peek-${scenario.width}-${scenario.appearance}.png`) })
      const peekContrast = await new AxeBuilder({ page }).include('[data-testid="canonical-place-peek"]').withRules(["color-contrast"]).analyze()
      expect(peekContrast.violations, "food peek copy retains readable light/dark contrast").toEqual([])

      await peek.getByTestId("sample-add-moment").click()
      const signal = page.getByTestId("ondo-b-local-signal")
      await expect(signal).toHaveAttribute("data-venue-id", DAMIBOKGUK)
      await expect(signal).toContainText("다미복국")
      await signal.getByTestId("local-signal-tag-calm_now").click()
      const note = signal.getByTestId("local-signal-note")
      await note.fill("Food pulse journey — preserve this exact place draft")
      await signal.getByTestId("local-signal-person-check").click()
      const gate = page.getByTestId("ondo-b-action-gate")
      await expect(gate).toHaveAttribute("data-return-cta", "SUBMIT_LOCAL_SIGNAL")
      await expect(gate.getByTestId("action-gate-return-context")).toHaveAttribute("data-return-venue", DAMIBOKGUK)
      if (await gate.getAttribute("data-active-gate") === "account") {
        await gate.getByTestId("action-gate-confirm").click()
      }
      await expect(gate).toHaveAttribute("data-active-gate", "person")
      await expect(gate).toHaveAttribute("data-execution-mode", "review")
      await gate.getByTestId("person-route-choice-mobile_id_cx").click()
      await expect(gate.getByTestId("local-check-boundary-continue")).toBeVisible()
      // First exercise cancellation; it must not discard the new CTA's draft.
      await gate.getByTestId("action-gate-cancel").click()
      await expect(gate).toBeHidden()
      await expect(signal.getByTestId("local-signal-draft")).toHaveAttribute("data-gate-return", "cancel")
      await expect(note).toHaveValue("Food pulse journey — preserve this exact place draft")
      await signal.getByTestId("local-signal-person-check").click()
      await expect(gate).toHaveAttribute("data-active-gate", "person")
      await expect(gate.getByTestId("action-gate-return-context")).toHaveAttribute("data-return-venue", DAMIBOKGUK)
      await gate.getByTestId("person-route-choice-mobile_id_cx").click()
      await gate.getByTestId("local-check-boundary-continue").click()
      await expect(gate).toBeHidden()
      await expect(signal.getByTestId("local-signal-draft")).toHaveAttribute("data-gate-return", "success")
      await expect(signal.getByTestId("local-signal-post")).toBeEnabled()
      // Do not post a contribution merely to verify navigation.
      await signal.getByTestId("local-signal-close").click()
      await signal.getByTestId("local-signal-discard").click()
      await expect(signal).toBeHidden()
      await expect(peek).toHaveAttribute("data-venue-id", DAMIBOKGUK)
      await expect(peek).toBeVisible()
      await peek.getByRole("button", { name: "Close place", exact: true }).click()
      await expect(peek).toBeHidden()
      expect(errors).toEqual([])
    } finally {
      await context.close()
    }
  })

  for (const review of [true, false]) {
    test(`three cities keep sourced food picks and restore their list: ${scenario.width}px ${scenario.appearance}, ${review ? "sample" : "review=0"}`, async ({ browser, baseURL }) => {
      test.setTimeout(110_000)
      const context = await deviceContext(browser, scenario, baseURL)
      try {
        const page = await context.newPage()
        const errors: string[] = []
        page.on("pageerror", error => errors.push(error.message))
        for (const { city, places } of CITY_RESEARCH) {
          await page.goto(`${baseURL}/?city=${city}${review ? "" : "&review=0"}`, { waitUntil: "domcontentloaded" })
          await expect(page.getByTestId("maplibre-map")).toHaveAttribute("data-map-state", "ready")
          if (!review) {
            await expect(page.getByTestId("ondo-temperature-timeline")).toHaveCount(0)
            await expect(page.getByTestId("sample-traveler-map-events")).toHaveCount(0)
          }
          await page.getByTestId("ondo-b-view-toggle").click()
          const list = page.getByTestId("researched-food-list")
          await expect(list).toBeVisible()
          await expect(list.locator("button[data-research-id]")).toHaveCount(places.length)
          expect(await list.locator("button[data-research-id]").evaluateAll(nodes => nodes.map(node => node.getAttribute("data-research-id")))).toEqual(places.map(place => place.id))
          const first = places[0]
          const card = list.locator(`button[data-research-id="${first.id}"]`)
          await expectResearchIllustration(card, first.id)
          await card.click()
          const detail = page.getByTestId("researched-food-detail")
          const sheet = page.getByTestId("ondo-sheet").filter({ has: detail })
          await expect(detail).toHaveAttribute("data-research-id", first.id)
          await expect(detail).toHaveAttribute("data-origin", "EDITORIAL_RESEARCH")
          await expect(detail.getByRole("heading", { name: first.name.en, exact: true })).toBeVisible()
          await expectResearchIllustration(detail, first.id)
          const sheetBounds = await sheet.boundingBox()
          const photoBounds = await detail.locator("[data-food-photo]").boundingBox()
          const reasonBounds = await detail.getByRole("heading", { name: "Why this stop", exact: true }).boundingBox()
          const identityGeometry = await detail.locator("[data-food-photo]").evaluate(media => {
            const identity = media.parentElement!
            const copy = media.nextElementSibling!
            return {
              gridLeft: identity.getBoundingClientRect().left,
              gridRight: identity.getBoundingClientRect().right,
              mediaLeft: media.getBoundingClientRect().left,
              mediaRight: media.getBoundingClientRect().right,
              copyLeft: copy.getBoundingClientRect().left,
              copyRight: copy.getBoundingClientRect().right,
              gap: Number.parseFloat(getComputedStyle(identity).columnGap),
            }
          })
          expect(identityGeometry.mediaLeft, "food media stays inside its identity grid").toBeGreaterThanOrEqual(identityGeometry.gridLeft)
          expect(identityGeometry.mediaRight, "food media stays within its assigned grid track").toBeLessThanOrEqual(identityGeometry.copyLeft - identityGeometry.gap + .5)
          expect(identityGeometry.gap, "media and venue copy retain a real gap").toBeGreaterThanOrEqual(12)
          expect(identityGeometry.copyRight, "venue copy stays inside its identity grid").toBeLessThanOrEqual(identityGeometry.gridRight + .5)
          expect(photoBounds!.x - sheetBounds!.x, "research photo needs a real sheet inset").toBeGreaterThanOrEqual(16)
          expect(reasonBounds!.x - sheetBounds!.x, "research prose must not touch the screen edge").toBeGreaterThanOrEqual(16)
          await detail.locator("summary").click()
          await expect(detail).toContainText("not a live popularity ranking")
          await expect(detail).toContainText(first.checkedAt)
          await expect(detail).toContainText(first.address)
          await expect(detail.locator("details li a")).toHaveCount(first.sources.length)
          for (const source of first.sources) {
            await expect(detail.getByRole("link", { name: source.title, exact: true })).toHaveAttribute("href", source.url)
          }
          const directions = sheet.getByRole("link", { name: "Directions", exact: true })
          const expectedDirections = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${first.latitude},${first.longitude}`)}`
          await expect(directions).toHaveAttribute("href", expectedDirections)
          await expect(directions).toHaveAttribute("target", "_blank")
          await expect(directions).toHaveAttribute("rel", "noopener noreferrer")
          // Research provenance must never be promoted to observed activity.
          if (!review) {
            await expect(detail.getByTestId("sample-traveler-contributions")).toHaveCount(0)
            await expect(detail.getByTestId("canonical-place-pulse")).toHaveCount(0)
            await expect(detail.getByTestId("sample-add-moment")).toHaveCount(0)
          }
          expect(await sheet.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
          expect(await page.locator("html").evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
          await page.screenshot({ path: test.info().outputPath(`research-${city}-${scenario.width}-${scenario.appearance}-${review ? "sample" : "normal"}.png`) })
          const guideContrast = await new AxeBuilder({ page }).include('[data-testid="ondo-sheet"]:has([data-testid="researched-food-detail"])').withRules(["color-contrast"]).analyze()
          expect(guideContrast.violations, "research guide dialog retains readable light/dark contrast").toEqual([])
          await sheet.getByRole("button", { name: "Close", exact: true }).click()
          await expect(detail).toBeHidden()
          await expect(list).toBeVisible()
          await expect(card).toBeFocused()
          await expect(page.getByTestId("ondo-b-view-toggle")).toHaveAccessibleName("Map")

          // A research-only match must not inherit the empty state from the
          // separate canonical/editorial directories. Its on-map action must
          // use this record's verified coordinates, not the city centre.
          await card.click()
          await sheet.getByRole("button", { name: "On map", exact: true }).click()
          await expect(detail).toBeHidden()
          await expect(page.getByTestId("ondo-b-view-toggle")).toHaveAccessibleName("List")
          const map = page.getByTestId("maplibre-map")
          await expect.poll(async () => {
            const [longitude, latitude] = (await map.getAttribute("data-map-center") ?? "").split(",").map(Number)
            return Math.abs(longitude - first.longitude) < .0001 && Math.abs(latitude - first.latitude) < .0001
          }).toBe(true)
          await page.getByRole("textbox", { name: "Place, district or category", exact: true }).fill(first.name.en)
          await expect(page.getByTestId("ondo-b-result-bar")).toHaveAttribute("data-result-count", "1")
          await expect(page.getByTestId("ondo-b-result-bar")).toHaveAttribute("data-result-source", "directory-and-editorial-research")
          await page.getByTestId("ondo-b-view-toggle").click()
          await expect(list.locator("button[data-research-id]")).toHaveCount(1)
          await expect(card).toBeVisible()
          await expect(page.getByTestId("ondo-b-empty-results")).toHaveCount(0)
          if (!review) await expect(page.getByTestId("sample-traveler-contributions")).toHaveCount(0)
        }
        expect(errors).toEqual([])
      } finally {
        await context.close()
      }
    })
  }
}

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`coordinate-bound traveler bubble opens its own place, motion=${reducedMotion}`, async ({ browser, baseURL }) => {
    test.setTimeout(45_000)
    const context = await deviceContext(browser, SCENARIOS[0], baseURL, reducedMotion)
    try {
      const page = await context.newPage()
      await page.goto(`${baseURL}/?city=busan&q=${encodeURIComponent("다미복국")}`, { waitUntil: "domcontentloaded" })
      await expect(page.getByTestId("maplibre-map")).toHaveAttribute("data-map-state", "ready")
      const timeline = page.getByTestId("ondo-temperature-timeline")
      const events = page.getByTestId("sample-traveler-map-events")
      await expect(events).toHaveAttribute("data-origin", "PREPARED_ILLUSTRATION")
      const bubble = events.locator(`button[data-venue-id="${DAMIBOKGUK}"]`)
      await expect(bubble).toBeVisible()
      await expect(events.locator("button")).toHaveCount(1)
      await expect(bubble).toHaveAccessibleName(/^Sample · .+\. Open place: Damibokguk$/)
      await expect(bubble).toHaveAttribute("data-running", String(reducedMotion === "no-preference"))
      if (reducedMotion === "reduce") {
        await expect(timeline).toHaveAttribute("data-running", "false")
        const minute = await timeline.getAttribute("data-minute")
        const sequence = await events.getAttribute("data-sequence")
        expect(await bubble.locator("svg").evaluate(node => getComputedStyle(node).animationName)).toBe("none")
        await page.waitForTimeout(1300)
        await expect(timeline).toHaveAttribute("data-minute", minute!)
        await expect(events).toHaveAttribute("data-sequence", sequence!)
      } else {
        await expect(timeline).toHaveAttribute("data-running", "true")
        const element = await bubble.elementHandle()
        const sequence = await events.getAttribute("data-sequence")
        await bubble.focus()
        await expect(bubble).toHaveAttribute("data-running", "false")
        await page.waitForTimeout(4000)
        await expect(events).not.toHaveAttribute("data-sequence", sequence!)
        await expect(bubble).toBeFocused()
        expect(await element!.evaluate(node => node.isConnected && node === document.activeElement)).toBe(true)
      }
      await page.screenshot({ path: test.info().outputPath(`traveler-bubble-${reducedMotion}.png`) })
      const peek = page.getByTestId("canonical-place-peek")
      if (reducedMotion === "no-preference") {
        await bubble.press("Enter")
        await expect(peek).toHaveAttribute("data-venue-id", DAMIBOKGUK)
        await peek.getByRole("button", { name: "Close place", exact: true }).click()
        await expect(peek).toBeHidden()
        await expect(bubble).toBeVisible()
      }
      const beforeHover = await bubble.boundingBox()
      await page.mouse.move(beforeHover!.x + beforeHover!.width / 2, beforeHover!.y + beforeHover!.height / 2)
      const hovered = await bubble.boundingBox()
      expect(Math.abs(hovered!.x - beforeHover!.x)).toBeLessThan(3)
      expect(Math.abs(hovered!.y - beforeHover!.y)).toBeLessThan(3)
      await page.mouse.down()
      const pressed = await bubble.boundingBox()
      // Shell hover/press motion must not replace geographic placement and
      // teleport this coordinate-bound button to (0,0) before pointerup.
      expect(Math.abs(pressed!.x - hovered!.x)).toBeLessThan(3)
      expect(Math.abs(pressed!.y - hovered!.y)).toBeLessThan(3)
      await page.mouse.up()
      await expect(peek).toHaveAttribute("data-venue-id", DAMIBOKGUK)
      await expect(events).toHaveCount(0)
    } finally {
      await context.close()
    }
  })
}
