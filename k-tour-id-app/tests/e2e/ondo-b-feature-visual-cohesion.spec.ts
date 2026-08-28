import { expect, test, type Locator, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const TABLE_ID = "table-seoul-night-bites"

async function seed(page: Page, locale: "en" | "ko" = "en") {
  await page.addInitScript(({ key, nextLocale }) => {
    localStorage.setItem(key, JSON.stringify({
      locale: nextLocale,
      onboarding: "ONB-COMPLETE",
      persona: null,
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
    }))
  }, { key: DEVICE_KEY, nextLocale: locale })
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("blockedbyclient"))
}

async function expectNoHorizontalOverflow(locator: Locator) {
  const { clientWidth, scrollWidth } = await locator.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }))
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
}

async function expectVisibleDirectTextAtLeast12(locator: Locator) {
  const undersized = await locator.evaluate((root) => {
    const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))] as HTMLElement[]
    return elements.flatMap((element) => {
      if (element.closest("[aria-hidden='true']")) return []
      if (element.matches(".sr-only,[class*='srOnly'],[class*='visuallyHidden']")) return []
      const style = getComputedStyle(element)
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return []
      if (element.getClientRects().length === 0) return []
      const directText = Array.from(element.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent?.replace(/\s+/g, " ").trim() ?? "")
        .filter(Boolean)
        .join(" ")
      if (!directText) return []
      const fontSize = Number.parseFloat(style.fontSize)
      return fontSize < 12 ? [{ tag: element.tagName.toLowerCase(), text: directText.slice(0, 80), fontSize }] : []
    })
  })
  expect(undersized).toEqual([])
}

test("Tables stays polished and closable at 360, 390, and 430 CSS pixels", async ({ page }) => {
  await seed(page)
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 800 })
    await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
    await page.getByTestId("nav-tables").click()
    const entry = page.getByTestId("tables-entry")
    await expect(entry.getByRole("heading", { name: "ONDO Tables" })).toBeVisible()
    await expectNoHorizontalOverflow(entry)
    const activeCard = page.getByTestId(`table-card-${TABLE_ID}`)
    await activeCard.scrollIntoViewIfNeeded()
    await expect(activeCard).toBeVisible()

    await page.getByTestId(`table-open-${TABLE_ID}`).click()
    const detail = page.getByTestId("table-detail")
    const close = detail.locator("header").getByRole("button", { name: "Close Table" }).first()
    await detail.evaluate((element) => { element.scrollTop = element.scrollHeight })
    await expect(close).toBeVisible()
    const closeBox = await close.boundingBox()
    expect(closeBox?.height ?? 0).toBeGreaterThanOrEqual(43.9)
    expect(closeBox?.y ?? -1).toBeGreaterThanOrEqual(0)
    expect((closeBox?.y ?? 10_000) + (closeBox?.height ?? 0)).toBeLessThanOrEqual(800)
    await close.click()
  }
})

test("short-landscape Table modal reclaims the hidden navigation lane in EN and KO", async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })

  for (const locale of ["en", "ko"] as const) {
    await seed(page, locale)
    await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
    const nav = page.getByTestId("ondo-main-nav")
    await page.getByTestId("nav-tables").click()
    await page.getByTestId(`table-open-${TABLE_ID}`).click()

    const layer = page.getByTestId("table-detail")
    const article = layer.locator("article")
    await expect(layer).toBeVisible()
    await expect(nav).toHaveAttribute("aria-hidden", "true")
    await expect(nav).toHaveAttribute("inert", "")

    const geometry = await layer.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      const hit = document.elementFromPoint(window.innerWidth / 2, window.innerHeight - 30)
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        hitInside: Boolean(hit?.closest("[data-testid='table-detail']")),
      }
    })
    expect(geometry.x).toBeCloseTo(0, 0)
    expect(geometry.y).toBeCloseTo(0, 0)
    expect(geometry.width).toBeCloseTo(844, 0)
    expect(geometry.height).toBeCloseTo(390, 0)
    expect(geometry.bottom).toBeCloseTo(390, 0)
    expect(geometry.hitInside).toBe(true)

    await article.evaluate((element) => { element.scrollTop = element.scrollHeight })
    await expect(article.getByTestId("table-join")).toBeVisible()
    await article.locator("header").getByRole("button", { name: locale === "ko" ? "테이블 닫기" : "Close Table" }).first().click()
    await expect(layer).toBeHidden()
    await expect(nav).toBeVisible()
    await expect(nav).not.toHaveAttribute("inert", "")
    await expect(page.getByTestId("nav-tables")).toBeVisible()
  }
})

test("My Korea, ID · Wallet, and Settings share natural scrolling and premium touch targets", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await seed(page, "ko")
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })

  for (const [nav, root] of [
    ["nav-my", "ondo-b-my-korea-entry"],
    ["nav-id", "ondo-b-traveler-id"],
    ["nav-settings", "ondo-b-settings-entry"],
  ] as const) {
    await page.getByTestId(nav).click()
    const surface = page.getByTestId(root)
    await expect(surface).toBeVisible()
    await expectNoHorizontalOverflow(surface)
  }

  await page.getByTestId("nav-id").click()
  const checks = page.locator("[data-testid='traveler-id-person'], [data-testid='traveler-id-age']")
  await expect(checks).toHaveCount(2)
  for (const button of await checks.getByRole("button").all()) {
    const box = await button.boundingBox()
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(43.9)
  }
})

test("visible direct feature text stays at least 12px in EN and KO across phone and short landscape", async ({ page }) => {
  test.setTimeout(180_000)
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("blockedbyclient"))
  for (const locale of ["en", "ko"] as const) {
    for (const viewport of [{ width: 360, height: 800 }, { width: 390, height: 844 }, { width: 430, height: 800 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(viewport)
      await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
      await page.evaluate(({ key, nextLocale }) => {
        localStorage.setItem(key, JSON.stringify({
          locale: nextLocale,
          onboarding: "ONB-COMPLETE",
          persona: null,
          discoveryPreferences: [],
          savedVenueIds: [],
          privateNotesByVenue: {},
        }))
        sessionStorage.removeItem("ondo-b.account.v1")
        sessionStorage.removeItem("ondo-b.action-gates.v1")
        sessionStorage.removeItem("ondo-b.after19.session.v1")
      }, { key: DEVICE_KEY, nextLocale: locale })
      await page.reload({ waitUntil: "domcontentloaded" })

      await page.getByTestId("nav-tables").click()
      await expectVisibleDirectTextAtLeast12(page.getByTestId("tables-entry"))
      await page.getByTestId(`table-open-${TABLE_ID}`).click()
      await expectVisibleDirectTextAtLeast12(page.getByTestId("table-detail"))
      await page.getByTestId("table-join").click()
      const accountGate = page.getByTestId("ondo-b-action-gate")
      await expect(accountGate).toHaveAttribute("data-active-gate", "account")
      await expectVisibleDirectTextAtLeast12(accountGate)
      await accountGate.getByTestId("action-gate-confirm").click()
      await expectVisibleDirectTextAtLeast12(page.getByTestId("after19-walkthrough"))
      await page.getByTestId("after19-walkthrough").getByTestId("action-gate-cancel").click()
      await expect(page.getByTestId("after19-walkthrough")).toBeHidden()
      await expect(page.getByTestId("ondo-b-action-gate")).toBeHidden()
      await page.getByTestId("table-detail").locator("header").getByRole("button", { name: locale === "ko" ? "테이블 닫기" : "Close Table" }).first().click()
      await expect(page.getByTestId("table-detail")).toBeHidden()

      for (const [nav, root] of [
        ["nav-my", "ondo-b-my-korea-entry"],
        ["nav-id", "ondo-b-traveler-id"],
        ["nav-settings", "ondo-b-settings-entry"],
      ] as const) {
        await page.getByTestId(nav).click()
        await expectVisibleDirectTextAtLeast12(page.getByTestId(root))
      }
    }
  }
})
