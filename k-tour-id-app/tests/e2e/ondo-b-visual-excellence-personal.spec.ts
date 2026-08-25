import { expect, test, type Locator, type Page } from "@playwright/test"
import { mkdirSync } from "node:fs"
import { resolve } from "node:path"

const DEVICE_KEY = "ondo-b.device.v1"
const VENUE_ID = "mois-0021cd596bc5b2a922ad"
const EVIDENCE_DIR = resolve(process.cwd(), "artifacts/qa/personal-excellence")

async function seed(page: Page, locale: "en" | "ko", options: { active?: boolean } = {}) {
  await page.addInitScript(({ key, nextLocale, venueId, active }) => {
    localStorage.setItem(key, JSON.stringify({
      locale: nextLocale,
      onboarding: "ONB-COMPLETE",
      persona: "short_term",
      discoveryPreferences: [],
      savedVenueIds: active ? [venueId] : [],
      privateNotesByVenue: {},
      recentVenueIds: active ? [venueId] : [],
      plannedTableRefs: active ? [{ tableId: "table-seoul-night-bites", venueId }] : [],
      localSignalPostedVenueIds: active ? [venueId] : [],
      localPulseEvidenceByVenue: {},
      localInteractionBoundarySeen: false,
      commerceLocalBoundarySeen: false,
      commerceReceipts: active ? [{
        receiptId: "ONDO-LOCAL-20260825-001",
        refundReceiptId: "ONDO-LOCAL-REFUND-20260825-001",
        offerId: "meal-offer-gukbap",
        venueId,
        status: "refunded",
        paidOOKRW: 19,
        benefitOOKRW: 3,
        balanceOOKRW: 60,
      }] : [],
    }))
  }, { key: DEVICE_KEY, nextLocale: locale, venueId: VENUE_ID, active: options.active === true })
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("blockedbyclient"))
}

async function openTab(page: Page, nav: "nav-my" | "nav-id" | "nav-settings", root: string) {
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
  await page.getByTestId(nav).click()
  const surface = page.getByTestId(root)
  await expect(surface).toBeVisible()
  return surface
}

async function expectNoTrustClamps(surface: Locator) {
  const issues = await surface.locator("header > span, section p").evaluateAll((elements) => elements.flatMap((element) => {
    const node = element as HTMLElement
    const style = getComputedStyle(node)
    if (style.display === "none" || style.visibility === "hidden" || node.getClientRects().length === 0) return []
    const lineClamp = style.getPropertyValue("-webkit-line-clamp")
    return lineClamp !== "none" && lineClamp !== "0" && lineClamp !== ""
      || style.textOverflow === "ellipsis"
      ? [{ text: node.innerText.slice(0, 80), lineClamp, textOverflow: style.textOverflow }]
      : []
  }))
  expect(issues).toEqual([])
}

test.describe("personal surfaces visual excellence", () => {
  test.describe.configure({ timeout: 120_000 })

  for (const locale of ["en", "ko"] as const) {
    for (const width of [320, 390]) {
      test(`${locale} ${width}px My Korea is an unclipped trip timeline and Settings is a calm native group`, async ({ page }) => {
        await page.setViewportSize({ width, height: width === 320 ? 720 : 844 })
        await seed(page, locale, { active: true })
        const my = await openTab(page, "nav-my", "ondo-b-my-korea-entry")
        await expectNoTrustClamps(my)

        const timeline = my.locator(":scope > div").first()
        const firstMoment = my.getByTestId("my-korea-receipts")
        const timelineVisual = await timeline.evaluate((element) => ({
          position: getComputedStyle(element).position,
          rail: getComputedStyle(element, "::before").content,
        }))
        expect(timelineVisual.position).toBe("relative")
        expect(timelineVisual.rail).not.toBe("none")
        expect((await firstMoment.evaluate((element) => getComputedStyle(element, "::before").content))).not.toBe("none")

        await page.getByTestId("nav-settings").click()
        const settings = page.getByTestId("ondo-b-settings-entry")
        await expectNoTrustClamps(settings)
        const firstGroup = settings.locator(":scope > section").first()
        expect(await firstGroup.evaluate((element) => getComputedStyle(element).boxShadow)).toBe("none")
        for (const button of await settings.getByRole("button").all()) {
          const box = await button.boundingBox()
          expect(box?.height ?? 0).toBeGreaterThanOrEqual(43.9)
        }
      })
    }
  }

  test("desktop My Korea and Settings use deliberate asymmetric editorial space", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await seed(page, "en", { active: true })
    const my = await openTab(page, "nav-my", "ondo-b-my-korea-entry")
    const myRoot = await my.boundingBox()
    expect(myRoot?.width ?? 0).toBeGreaterThanOrEqual(1039)
    const recent = await my.getByTestId("my-korea-recent").boundingBox()
    const planned = await my.getByTestId("my-korea-planned").boundingBox()
    expect(Math.abs((recent?.y ?? 0) - (planned?.y ?? 100))).toBeLessThan(4)
    expect(recent?.width ?? 0).toBeGreaterThan((planned?.width ?? 1) * 1.08)

    await page.getByTestId("nav-settings").click()
    const settings = page.getByTestId("ondo-b-settings-entry")
    const settingsRoot = await settings.boundingBox()
    expect(settingsRoot?.width ?? 0).toBeGreaterThanOrEqual(1039)
    const groups = settings.locator(":scope > section")
    const language = await groups.nth(0).boundingBox()
    const discovery = await groups.nth(1).boundingBox()
    expect(Math.abs((language?.y ?? 0) - (discovery?.y ?? 100))).toBeLessThan(4)
    expect(discovery?.width ?? 0).toBeGreaterThan((language?.width ?? 1) * 1.2)
  })

  test("Travel Pass remains the benchmark while Wallet carries the same layered material", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seed(page, "en")
    const traveler = await openTab(page, "nav-id", "ondo-b-traveler-id")
    await expectNoTrustClamps(traveler)

    const travelPass = traveler.locator(":scope > section").first()
    const balance = page.getByTestId("wallet-balance")
    const passVisual = await travelPass.evaluate((element) => {
      const style = getComputedStyle(element)
      return { height: element.getBoundingClientRect().height, radius: parseFloat(style.borderRadius), background: style.backgroundImage }
    })
    expect(passVisual.height).toBeGreaterThanOrEqual(148)
    expect(passVisual.radius).toBeGreaterThanOrEqual(24)
    expect(passVisual.background).toContain("linear-gradient")

    const balanceVisual = await balance.evaluate((element) => ({
      background: getComputedStyle(element).backgroundImage,
      light: getComputedStyle(element, "::before").content,
    }))
    expect((balanceVisual.background.match(/gradient/g) ?? []).length).toBeGreaterThanOrEqual(3)
    expect(balanceVisual.light).not.toBe("none")

    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.reload({ waitUntil: "domcontentloaded" })
    await page.getByTestId("nav-id").click()
    expect(await page.getByTestId("ondo-b-traveler-id").evaluate((element) => parseFloat(getComputedStyle(element).maxWidth))).toBeGreaterThanOrEqual(1040)
  })

  test("short landscape presents Travel Pass and Wallet as one usable first frame", async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 })
    await seed(page, "en")
    const traveler = await openTab(page, "nav-id", "ondo-b-traveler-id")
    const pass = traveler.locator(":scope > section").first()
    const balance = page.getByTestId("wallet-balance")
    const [passBox, balanceBox] = await Promise.all([pass.boundingBox(), balance.boundingBox()])
    expect(passBox?.width ?? 844).toBeLessThan(390)
    expect(balanceBox?.x ?? 0).toBeGreaterThan((passBox?.x ?? 0) + (passBox?.width ?? 0))
    expect(balanceBox?.y ?? 390).toBeLessThan(180)
    expect((balanceBox?.y ?? 390) + (balanceBox?.height ?? 0)).toBeLessThanOrEqual(316)
  })

  test("desktop offer is asymmetric and payment/refund receipts read as distinct tickets", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize({ width: 1440, height: 1000 })
    await seed(page, "en")
    await page.goto(`/ondo-b?city=seoul&view=list&venueId=${VENUE_ID}&detail=1`, { waitUntil: "domcontentloaded" })
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" })
    await page.getByTestId("canonical-meal-benefit-open").click()
    const offer = page.getByTestId("ondo-b-id-wallet-commerce")
    const offerBody = offer.locator("header + div")
    expect((await offerBody.boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(900)
    const quote = offer.locator("section").nth(1)
    const benefit = offer.getByTestId("commerce-voucher")
    expect((await quote.boundingBox())?.x ?? 1000).toBeLessThan((await benefit.boundingBox())?.x ?? 0)
    mkdirSync(EVIDENCE_DIR, { recursive: true })
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "en-1440-offer.png") })

    await page.setViewportSize({ width: 390, height: 844 })
    await offer.getByTestId("benefit-accept").click()
    await offer.getByTestId("payment-confirm").click()
    await page.getByTestId("wallet-connect-sheet").getByRole("button", { name: "Connect wallet" }).click()
    await offer.getByTestId("payment-minimum-consent").locator("input").check()
    await offer.getByTestId("payment-confirm").click()

    const receipt = offer.getByTestId("payment-receipt")
    await expect(receipt).toBeVisible()
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "en-390-receipt.png") })
    const ticket = receipt.locator(":scope > section").first()
    expect(await ticket.evaluate((element) => getComputedStyle(element, "::before").content)).not.toBe("none")
    const mark = receipt.locator(":scope > div").first()
    const paidColor = await mark.evaluate((element) => getComputedStyle(element).backgroundColor)
    await receipt.locator("details summary").click()
    await receipt.getByTestId("payment-refund").click()
    await expect(receipt).toHaveAttribute("data-refunded", "true")
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "en-390-refund.png") })
    const refundedColor = await mark.evaluate((element) => getComputedStyle(element).backgroundColor)
    expect(refundedColor).not.toBe(paidColor)
  })

  test("personal-surface entrance motion resolves to stillness for reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize({ width: 390, height: 844 })
    await seed(page, "en", { active: true })
    const my = await openTab(page, "nav-my", "ondo-b-my-korea-entry")
    expect(await my.getByTestId("my-korea-receipts").evaluate((element) => getComputedStyle(element).animationName)).toBe("none")
    await page.getByTestId("nav-id").click()
    const pass = page.getByTestId("ondo-b-traveler-id").locator(":scope > section").first()
    expect(await pass.evaluate((element) => getComputedStyle(element).animationName)).toBe("none")
  })

  test("capture EN and KO personal surfaces at the sealed responsive matrix", async ({ browser }) => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })
    for (const locale of ["en", "ko"] as const) {
      for (const viewport of [
        { width: 320, height: 720, label: "320" },
        { width: 390, height: 844, label: "390" },
        { width: 844, height: 390, label: "844" },
        { width: 1440, height: 1000, label: "1440" },
      ]) {
        const context = await browser.newContext({ viewport, reducedMotion: "reduce" })
        const page = await context.newPage()
        await seed(page, locale, { active: true })
        await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
        // The local development harness reports React's CSP/eval diagnostic in
        // a Next.js portal. It is not part of the production UI or evidence.
        await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" })
        for (const [nav, surface] of [
          ["nav-my", "my"],
          ["nav-settings", "settings"],
          ["nav-id", "id-wallet"],
        ] as const) {
          await page.getByTestId(nav).click()
          await page.screenshot({ path: resolve(EVIDENCE_DIR, `${locale}-${viewport.label}-${surface}.png`) })
        }
        await context.close()
      }
    }
  })
})
