import { mkdirSync, writeFileSync } from "node:fs"
import { expect, test, type Browser, type BrowserContext, type Locator, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const OUT = "artifacts/qa/wave3-visual-red"
const VENUE_ID = "mois-0021cd596bc5b2a922ad"
const TABLE_ID = "table-seoul-night-bites"
const PLACE_ID = "jeju-seongsan-ilchulbong"

type Locale = "ko" | "en" | "ja"
type Receipt = {
  file: string
  viewport: string
  locale: Locale
  rootOverflow: number
  bodyBg: string
  smallTargets: Array<{ testid: string | null; text: string; width: number; height: number }>
  clippedText: Array<{ tag: string; testid: string | null; text: string; dw: number; dh: number }>
  outsideFixed: Array<{ testid: string | null; text: string; x: number; y: number; right: number; bottom: number }>
}

mkdirSync(OUT, { recursive: true })
const receipts: Receipt[] = []

function device(locale: Locale, account = false) {
  return {
    locale,
    onboarding: "ONB-COMPLETE",
    persona: null,
    discoveryPreferences: [],
    savedVenueIds: [],
    savedEditorialPlaceIds: [],
    privateNotesByVenue: {},
    recentVenueIds: [],
    recentEditorialPlaceIds: [],
    plannedTableRefs: [],
    localSignalPostedVenueIds: [],
    localPulseEvidenceByVenue: {},
    localInteractionBoundarySeen: true,
    commerceLocalBoundarySeen: true,
    commerceReceipts: [],
    ...(account ? { account: "ACC-ACTIVE" } : {}),
  }
}

async function seed(page: Page, locale: Locale, options?: { account?: boolean; axes?: boolean }) {
  await page.addInitScript(({ key, value, account, axes }) => {
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem(key, JSON.stringify(value))
    if (account) sessionStorage.setItem("ondo-b.account.v1", JSON.stringify({ account: "ACC-ACTIVE", returnTo: null }))
    if (axes) {
      const issuedAt = new Date(Date.now() - 1_000).toISOString()
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
      const axis = (gate: "person" | "payment_kyc") => ({ status: "eligible", expiresAt, reviewReceipt: { issuer: "ONDO_REVIEW_FIXTURE", executionTruth: "FIXTURE_REVIEW", provenanceTruth: "SIMULATED", fixtureId: gate === "person" ? "FX-PER-VISUAL-SEED" : "FX-PKY-VISUAL-SEED", issuedAt, expiresAt } })
      sessionStorage.setItem("ondo-b.action-gates.v1", JSON.stringify({ version: 1, person: axis("person"), payment: axis("payment_kyc"), pending: null, lastConsumed: null, outcome: null }))
    }
  }, { key: DEVICE_KEY, value: device(locale, options?.account), account: options?.account, axes: options?.axes })
}

async function capture(page: Page, locale: Locale, name: string, scope: Locator = page.getByTestId("ondo-b-root")) {
  await page.evaluate(async () => { await document.fonts.ready; await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))) })
  const viewport = page.viewportSize()!
  const file = `${OUT}/${name}.png`
  const metrics = await scope.evaluate((root) => {
    const visible = (node: Element) => {
      const box = node.getBoundingClientRect()
      const style = getComputedStyle(node)
      return box.width > 0 && box.height > 0 && style.visibility !== "hidden" && style.display !== "none"
    }
    const rootNode = root as HTMLElement
    const controls = Array.from(root.querySelectorAll<HTMLElement>("button,a[href],summary,input,textarea,select")).filter(visible)
    const textNodes = Array.from(root.querySelectorAll<HTMLElement>("h1,h2,h3,p,span,strong,small,button,summary,label,li,dd,dt")).filter((node) => visible(node) && Boolean(node.innerText.trim()))
    const fixed = Array.from(root.querySelectorAll<HTMLElement>("*")).filter((node) => visible(node) && ["fixed", "sticky"].includes(getComputedStyle(node).position))
    return {
      rootOverflow: Math.max(0, rootNode.scrollWidth - rootNode.clientWidth),
      bodyBg: getComputedStyle(document.body).backgroundColor,
      smallTargets: controls.map((node) => ({ node, box: node.getBoundingClientRect() })).filter(({ box }) => box.width < 43.5 || box.height < 43.5).slice(0, 20).map(({ node, box }) => ({ testid: node.getAttribute("data-testid"), text: node.innerText.trim().slice(0, 60), width: Math.round(box.width), height: Math.round(box.height) })),
      clippedText: textNodes.filter((node) => node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1).slice(0, 20).map((node) => ({ tag: node.tagName, testid: node.getAttribute("data-testid"), text: node.innerText.trim().slice(0, 80), dw: node.scrollWidth - node.clientWidth, dh: node.scrollHeight - node.clientHeight })),
      outsideFixed: fixed.map((node) => ({ node, box: node.getBoundingClientRect() })).filter(({ box }) => box.left < -1 || box.top < -1 || box.right > innerWidth + 1 || box.bottom > innerHeight + 1).slice(0, 20).map(({ node, box }) => ({ testid: node.getAttribute("data-testid"), text: node.innerText.trim().slice(0, 60), x: Math.round(box.x), y: Math.round(box.y), right: Math.round(box.right), bottom: Math.round(box.bottom) })),
    }
  })
  await page.screenshot({ path: file, animations: "disabled", caret: "hide" })
  receipts.push({ file, viewport: `${viewport.width}x${viewport.height}`, locale, ...metrics })
  return file
}

async function context(browser: Browser, locale: Locale, width: number, height: number, options?: { account?: boolean; axes?: boolean }) {
  const ctx = await browser.newContext({ viewport: { width, height } })
  const page = await ctx.newPage()
  await seed(page, locale, options)
  return { ctx, page }
}

test.describe.configure({ mode: "serial", timeout: 240_000 })

test("wave3 atlas matrix", async ({ browser }) => {
  for (const locale of ["ko", "en", "ja"] as const) {
    for (const [width, height] of [[320, 720], [390, 844], [430, 932], [844, 390]] as const) {
      const { ctx, page } = await context(browser, locale, width, height)
      await page.goto("/", { waitUntil: "domcontentloaded" })
      await expect(page.getByTestId("ondo-b-korea-atlas")).toBeVisible()
      await capture(page, locale, `atlas-${locale}-${width}x${height}`)
      await ctx.close()
    }
  }
})

test("wave3 city loading fallback and After19", async ({ browser }) => {
  {
    const { ctx, page } = await context(browser, "ko", 390, 844)
    await page.route("https://tiles.openfreemap.org/**", async (route) => { await new Promise((resolve) => setTimeout(resolve, 5_500)); await route.abort("timedout") })
    await page.goto("/?city=seoul&view=map", { waitUntil: "domcontentloaded" })
    const loadingAudit: unknown[] = []
    const auditLoading = async (at: string) => loadingAudit.push(await page.evaluate((label) => {
      const visible = (node: Element | null) => {
        if (!node) return false
        const box = node.getBoundingClientRect(); const style = getComputedStyle(node)
        return box.width > 0 && box.height > 0 && style.display !== "none" && style.visibility !== "hidden"
      }
      const root = document.querySelector("[data-testid='ondo-b-map-entry']")
      return {
        at: label,
        mapState: root?.getAttribute("data-map-state"),
        loadingContext: visible(document.querySelector("[data-testid='ondo-b-map-loading-context']")),
        partialFailure: root?.getAttribute("data-map-partial-failure"),
        progress: document.querySelector("[data-testid='ondo-b-map-loading']")?.textContent?.trim() ?? null,
        transport: document.querySelector("[data-testid='ondo-b-map-transport-status']")?.textContent?.trim() ?? null,
        resultTruth: document.querySelector("[data-testid='ondo-b-result-truth']")?.textContent?.trim() ?? null,
        visibleList: Boolean(Array.from(document.querySelectorAll("[data-testid='ondo-b-venue-list'] [data-venue-id]")).find(visible)),
        listControlVisible: visible(document.querySelector("[data-testid='ondo-b-view-toggle']")),
        query: (document.querySelector("[data-testid='ondo-b-search']") as HTMLInputElement | null)?.value ?? null,
        retryCount: document.querySelectorAll("[data-testid='ondo-b-map-fallback-status'] button").length,
      }
    }, at))
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-map-state", "loading")
    await auditLoading("immediate")
    await capture(page, "ko", "city-ko-390-loading-immediate")
    await page.waitForTimeout(900)
    await capture(page, "ko", "city-ko-390-loading-context")
    await auditLoading("900ms")
    await page.waitForTimeout(5_200)
    await capture(page, "ko", "city-ko-390-slow-fallback")
    await auditLoading("6100ms")
    expect(loadingAudit).toEqual([
      expect.objectContaining({ at: "immediate", mapState: "loading", loadingContext: true, partialFailure: "none", progress: null, transport: null, visibleList: false, listControlVisible: true, query: "", retryCount: 0 }),
      expect.objectContaining({ at: "900ms", mapState: "loading", loadingContext: true, partialFailure: "none", progress: "지도를 불러오는 중…", transport: null, visibleList: false, listControlVisible: true, retryCount: 0 }),
      expect.objectContaining({ at: "6100ms", mapState: "ready", loadingContext: false, partialFailure: "recoverable", progress: null, transport: "지도 배경을 불러오지 못했어요", resultTruth: expect.stringContaining("장소 목록은 계속 볼 수 있지만"), visibleList: false, listControlVisible: true, retryCount: 0 }),
    ])
    writeFileSync(`${OUT}/loading-state-receipt.json`, JSON.stringify(loadingAudit, null, 2))
    await ctx.close()
  }
  {
    const { ctx, page } = await context(browser, "ja", 844, 390)
    await page.goto("/?city=seoul&view=map", { waitUntil: "domcontentloaded" })
    await expect(page.getByTestId("ondo-b-map-entry")).toBeVisible()
    await capture(page, "ja", "city-ja-844x390")
    const after = page.getByTestId("global-after19-toggle")
    if (await after.isVisible().catch(() => false)) {
      await after.click()
      await expect(page.getByTestId("global-after19-prompt-layer")).toBeVisible()
      await capture(page, "ja", "after19-ja-844x390", page.getByTestId("global-after19-prompt-layer"))
    }
    await ctx.close()
  }
})

test("wave3 three-city temperature grammar and control collision receipt", async ({ browser }) => {
  const audit: unknown[] = []
  for (const city of ["seoul", "busan", "jeju"] as const) {
    const { ctx, page } = await context(browser, "ko", 390, 844)
    await page.goto(`/?city=${city}&view=map`, { waitUntil: "domcontentloaded" })
    const root = page.getByTestId("ondo-b-map-entry")
    await expect(root).toBeVisible()
    await expect(root).toHaveAttribute("data-map-state", /ready|partial|error/, { timeout: 20_000 })
    await capture(page, "ko", `city-${city}-ko-390-ready`)
    audit.push(await page.evaluate((cityId) => {
      const rect = (node: Element | null) => node ? (() => { const b = node.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height, right: b.right, bottom: b.bottom } })() : null
      const overlap = (a: ReturnType<typeof rect>, b: ReturnType<typeof rect>) => a && b ? Math.max(0, Math.min(a.right, b.right) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y)) : 0
      const nav = document.querySelector("[data-testid='ondo-main-nav']")
      const active = document.querySelector("[data-testid='ondo-main-nav'] [aria-current='page']")
      const controls = Array.from(document.querySelectorAll(".maplibregl-ctrl button")).filter((node) => { const b = node.getBoundingClientRect(); return b.width > 0 && b.height > 0 })
      const navBox = rect(nav); const activeBox = rect(active)
      return {
        city: cityId,
        mapState: document.querySelector("[data-testid='ondo-b-map-entry']")?.getAttribute("data-map-state"),
        pulseStatus: document.querySelector("[data-testid='ondo-b-pulse-city-status']")?.textContent?.trim(),
        editorialCount: document.querySelector("[data-testid='ondo-b-map-entry']")?.getAttribute("data-editorial-point-count"),
        navBox,
        activeBox,
        activeAfter: active ? getComputedStyle(active, "::after").cssText : null,
        controls: controls.map((node) => ({ rect: rect(node), navOverlap: overlap(rect(node), navBox), activeOverlap: overlap(rect(node), activeBox), aria: node.getAttribute("aria-label") })),
      }
    }, city))
    await ctx.close()
  }
  writeFileSync(`${OUT}/city-control-receipts.json`, JSON.stringify(audit, null, 2))
})

test("wave3 onboarding and K-Tour ID JIT", async ({ browser }) => {
  const jitAudit: unknown[] = []
  for (const [locale, width, height] of [["ko", 320, 720], ["ja", 844, 390]] as const) {
    const ctx = await browser.newContext({ viewport: { width, height } })
    const page = await ctx.newPage()
    await page.addInitScript(({ key, value }) => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem(key, JSON.stringify(value)) }, { key: DEVICE_KEY, value: { ...device(locale), onboarding: "ONB-NEW" } })
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await expect(page.getByTestId("ondo-onboarding")).toBeVisible()
    await capture(page, locale, `onboarding-${locale}-${width}x${height}`, page.getByTestId("ondo-onboarding"))
    await page.getByTestId("k-tour-id-setup-open").click()
    const setup = page.getByTestId("k-tour-id-setup")
    await expect(setup).toBeVisible()
    await capture(page, locale, `ktour-method-${locale}-${width}x${height}`, setup)
    jitAudit.push(await setup.evaluate((root, meta) => {
      const visibleControls = Array.from(root.querySelectorAll<HTMLElement>("button")).filter((node) => {
        const b = node.getBoundingClientRect(); const style = getComputedStyle(node); return b.width > 0 && b.height > 0 && style.visibility !== "hidden" && style.display !== "none" && b.bottom > 0 && b.top < innerHeight
      }).map((node) => ({ testid: node.dataset.testid ?? null, text: node.innerText.trim().slice(0, 80), top: Math.round(node.getBoundingClientRect().top), bottom: Math.round(node.getBoundingClientRect().bottom) }))
      return { ...meta, stage: "method", visibleControls }
    }, { locale, width, height }))
    await setup.getByTestId("k-tour-id-method-passport-ekyc").click()
    await capture(page, locale, `ktour-consent-${locale}-${width}x${height}`, setup)
    jitAudit.push(await setup.evaluate((root, meta) => {
      const controls = Array.from(root.querySelectorAll<HTMLElement>("button")).filter((node) => {
        const b = node.getBoundingClientRect(); const style = getComputedStyle(node); return b.width > 0 && b.height > 0 && style.visibility !== "hidden" && style.display !== "none"
      }).map((node) => ({ testid: node.dataset.testid ?? null, text: node.innerText.trim().slice(0, 80), top: Math.round(node.getBoundingClientRect().top), bottom: Math.round(node.getBoundingClientRect().bottom), inViewport: node.getBoundingClientRect().bottom > 0 && node.getBoundingClientRect().top < innerHeight }))
      return { ...meta, stage: "consent", controls }
    }, { locale, width, height }))
    await ctx.close()
  }
  writeFileSync(`${OUT}/ktour-jit-receipt.json`, JSON.stringify(jitAudit, null, 2))
})

test("wave3 exact Jeju save return", async ({ browser }) => {
  const { ctx, page } = await context(browser, "ko", 390, 844)
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await page.locator("[data-city='jeju']").click()
  await page.getByTestId("ondo-b-view-toggle").click()
  const places = page.getByTestId("ondo-b-editorial-place-list")
  await places.locator(`[data-editorial-place-id='${PLACE_ID}'] button, button`).first().click()
  await page.getByTestId("ondo-b-editorial-place-details").click()
  const detail = page.getByTestId("ondo-b-editorial-place-overlay")
  await expect(detail).toBeVisible()
  await capture(page, "ko", "jeju-detail-ko-390", detail)
  await detail.getByTestId("ondo-b-editorial-place-save").click()
  const gate = page.getByTestId("account-save-gate")
  await expect(gate).toHaveAttribute("data-account-return-editorial-place", PLACE_ID)
  await capture(page, "ko", "jeju-account-gate-ko-390", gate)
  await gate.getByTestId("account-start").click()
  await expect(gate).toHaveCount(0)
  await expect(detail).toHaveAttribute("data-save-state", "saved")
  await capture(page, "ko", "jeju-return-saved-ko-390", detail)
  await ctx.close()
})

test("wave3 Table gate context", async ({ browser }) => {
  for (const [locale, width, height] of [["en", 320, 720], ["ja", 844, 390]] as const) {
    const { ctx, page } = await context(browser, locale, width, height)
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await page.getByTestId("nav-tables").click()
    await page.getByTestId(`table-open-${TABLE_ID}`).click()
    const table = page.getByTestId("table-detail")
    await capture(page, locale, `table-detail-${locale}-${width}x${height}`, table)
    await table.getByTestId("table-join").click()
    const gate = page.getByTestId("ondo-b-action-gate")
    await expect(gate.getByTestId("action-gate-return-context")).toHaveAttribute("data-return-table", TABLE_ID)
    await capture(page, locale, `table-account-gate-${locale}-${width}x${height}`, gate)
    await ctx.close()
  }
})

test("wave3 wallet settings and payment receipt", async ({ browser }) => {
  for (const [locale, width, height] of [["ko", 320, 720], ["ja", 844, 390]] as const) {
    const { ctx, page } = await context(browser, locale, width, height, { account: true, axes: true })
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await page.getByTestId("nav-id").click()
    await capture(page, locale, `wallet-${locale}-${width}x${height}`, page.getByTestId("ondo-b-traveler-id"))
    await page.getByTestId("wallet-link-open").click()
    await capture(page, locale, `wallet-connect-${locale}-${width}x${height}`, page.getByTestId("wallet-connect-sheet"))
    await page.keyboard.press("Escape")
    await page.getByTestId("nav-settings").click()
    await capture(page, locale, `settings-${locale}-${width}x${height}`, page.getByTestId("ondo-b-settings-entry"))
    await ctx.close()
  }

  const { ctx, page } = await context(browser, "en", 390, 844, { account: true, axes: true })
  await page.goto(`/?city=seoul&view=list&venueId=${VENUE_ID}&detail=1`, { waitUntil: "domcontentloaded" })
  const place = page.getByTestId("canonical-place-overlay")
  await expect(place).toBeVisible()
  await place.getByTestId("canonical-meal-benefit-open").click()
  const offer = page.getByTestId("ondo-b-id-wallet-commerce")
  await capture(page, "en", "checkout-en-390", offer)
  await offer.getByTestId("benefit-accept").click()
  await offer.getByTestId("payment-confirm").click()
  await page.getByTestId("wallet-connect-sheet").getByRole("button", { name: "Set up travel wallet", exact: true }).click()
  await offer.getByTestId("payment-minimum-consent").locator("input").check()
  await offer.getByTestId("payment-confirm").click()
  await expect(offer.getByTestId("payment-receipt")).toBeVisible()
  await capture(page, "en", "receipt-en-390", offer.getByTestId("payment-receipt"))
  await ctx.close()
})

test("wave3 RED visual contracts", async ({ browser }) => {
  const contract: Record<string, unknown> = {}

  {
    const { ctx, page } = await context(browser, "ko", 390, 844)
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await page.locator("[data-city='jeju']").click()
    await page.getByTestId("ondo-b-view-toggle").click()
    const places = page.getByTestId("ondo-b-editorial-place-list")
    await places.locator(`[data-editorial-place-id='${PLACE_ID}'] button, button`).first().click()
    await page.getByTestId("ondo-b-editorial-place-details").click()
    await page.getByTestId("ondo-b-editorial-place-save").click()
    const gate = page.getByTestId("account-save-gate")
    await expect(gate).toBeVisible()
    await gate.evaluate(async (node) => {
      await Promise.all(node.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => undefined)))
    })
    const start = gate.getByTestId("account-start")
    const gateHit = await start.evaluate((button) => {
      const box = button.getBoundingClientRect()
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
      const gate = button.closest<HTMLElement>("[data-testid='account-save-gate']")!
      const layer = gate.closest<HTMLElement>("[data-testid='ondo-gate-overlay']")!
      const gateStyle = getComputedStyle(gate)
      const layerStyle = getComputedStyle(layer)
      return { box: { top: box.top, right: box.right, bottom: box.bottom, left: box.left }, hitTestId: hit instanceof HTMLElement ? hit.dataset.testid ?? null : null, gateOwnsHit: Boolean(hit && gate.contains(hit)), gateOpacity: gateStyle.opacity, gateVisibility: gateStyle.visibility, layerDisplay: layerStyle.display, layerZ: layerStyle.zIndex }
    })
    contract.jejuAccountGate = gateHit
    expect.soft(gateHit.gateOwnsHit, "Jeju Account save CTA must be the topmost hit target").toBe(true)
    await ctx.close()
  }

  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await ctx.newPage()
    await page.addInitScript(({ key, value }) => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem(key, JSON.stringify(value)) }, {
      key: DEVICE_KEY,
      value: { ...device("ko"), discoveryPreferences: ["classic", "cafe", "late"] },
    })
    await page.goto("/", { waitUntil: "domcontentloaded" })
    const lens = page.getByTestId("ondo-b-personalization-edit")
    const badge = await lens.evaluate((button) => {
      const style = getComputedStyle(button, "::after")
      return { count: button.dataset.preferenceCount, fontSize: Number.parseFloat(style.fontSize), width: Number.parseFloat(style.width), height: Number.parseFloat(style.height) }
    })
    contract.preferenceBadge = badge
    expect.soft(badge.fontSize, "informational preference count must remain legible").toBeGreaterThanOrEqual(12)
    expect.soft(Math.min(badge.width, badge.height), "informational preference badge must not collapse to decoration size").toBeGreaterThanOrEqual(20)
    await ctx.close()
  }

  {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } })
    const page = await ctx.newPage()
    await page.addInitScript(({ key, value }) => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem(key, JSON.stringify(value)) }, { key: DEVICE_KEY, value: { ...device("ja"), onboarding: "ONB-NEW" } })
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await page.getByTestId("k-tour-id-setup-open").click()
    await page.getByTestId("k-tour-id-method-passport-ekyc").click()
    const approve = page.getByTestId("k-tour-id-consent-approve")
    const consentBox = await approve.boundingBox()
    contract.ktourConsent = consentBox
    expect.soft(consentBox?.y ?? 9999, "K-Tour consent CTA top must be visible").toBeGreaterThanOrEqual(0)
    expect.soft((consentBox?.y ?? 9999) + (consentBox?.height ?? 9999), "K-Tour consent CTA must clear short-landscape viewport bottom").toBeLessThanOrEqual(390)
    await ctx.close()
  }

  {
    const { ctx, page } = await context(browser, "ja", 844, 390)
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await page.getByTestId("nav-tables").click()
    await page.getByTestId(`table-open-${TABLE_ID}`).click()
    const joinBox = await page.getByTestId("table-join").boundingBox()
    contract.tableJoin = joinBox
    expect.soft((joinBox?.y ?? 9999) + (joinBox?.height ?? 9999), "Table join CTA must clear short-landscape viewport bottom").toBeLessThanOrEqual(390)
    await ctx.close()
  }

  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" })
    const page = await ctx.newPage()
    await seed(page, "ko")
    await page.goto("/?city=seoul&view=map", { waitUntil: "domcontentloaded" })
    const root = page.getByTestId("ondo-b-map-entry")
    await expect(root).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
    await expect(root).toHaveAttribute("data-pulse-motion-applied", "static")
    const movingCss = await root.evaluate((node) => Array.from(node.querySelectorAll<HTMLElement>("*")).filter((element) => {
      const style = getComputedStyle(element)
      return style.animationName !== "none" && style.animationDuration !== "0s"
    }).length)
    contract.reducedMotion = { pulseMotion: await root.getAttribute("data-pulse-motion-applied"), movingCss }
    expect.soft(movingCss, "reduced-motion must stop CSS map motion").toBe(0)
    await ctx.close()
  }

  writeFileSync(`${OUT}/visual-contract-receipt.json`, JSON.stringify(contract, null, 2))
})

test.afterAll(() => writeFileSync(`${OUT}/receipts.json`, JSON.stringify(receipts, null, 2)))
