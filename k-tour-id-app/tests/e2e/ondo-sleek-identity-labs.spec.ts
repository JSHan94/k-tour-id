import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import {
  gotoB,
  seedB,
} from "../helpers/ondo-b-qa"

const READY_SESSION = {
  account: "ACC-ACTIVE",
  person: "PER-VERIFIED",
  age: "AGE-VERIFIED",
  ageExpiresAt: "2026-08-21T20:00:00+09:00",
  stamps: 10,
}

async function seedCurrentActivity(page: Page, stamps: number) {
  await page.addInitScript((currentStamps) => {
    sessionStorage.setItem("ondo-b.activity-profile.v1", JSON.stringify({
      profile: {
        displayName: "Traveler",
        from: { value: "", consent: false },
        livesIn: { value: "", consent: false },
        languages: { value: [], consent: false },
      },
      reputation: { visit: currentStamps > 1 ? "repeat" : currentStamps === 1 ? "recent" : "new", contribution: "new", meetup: "new" },
      stamps: currentStamps,
      acceptedEvidenceIds: Array.from({ length: currentStamps }, (_, index) => `visit:seed-${index + 1}`),
    }))
  }, stamps)
}

async function seedAcknowledgedLabs(page: Page, query = "", paymentKyc = "PKY-NOT-STARTED") {
  await seedB(page, { session: { ...READY_SESSION, paymentKyc }, clearFeatures: false })
  await seedCurrentActivity(page, 10)
  await page.addInitScript(() => {
    sessionStorage.setItem("ondo-b.labs.v1", JSON.stringify({
      acknowledged: true,
      wallet: "WAL-INVALID",
      bridge: "BRG-INVALID",
      phase: "invalid_phase",
      mint: "NFT-ELIGIBLE",
      consent: false,
      quoteExpiresAt: null,
      traitStates: {},
    }))
  })
  await gotoB(page, query)
}

async function expectNoSeriousAxe(page: Page, selector: string) {
  const result = await new AxeBuilder({ page })
    .include(selector)
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(result.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical"))
    .toEqual([])
}

async function activateTab(page: Page, name: "My Korea" | "ID", targetTestId: string) {
  const tab = page.getByTestId(name === "My Korea" ? "nav-my" : "nav-id")
  await expect.poll(async () => {
    await tab.click({ force: true, timeout: 1_000 }).catch(() => undefined)
    return page.getByTestId(targetTestId).isVisible().catch(() => false)
  }, { timeout: 30_000 }).toBe(true)
}

async function openCheckout(page: Page, query = "") {
  const suffix = query ? `?${query.replace(/^\?/, "")}` : ""
  await page.goto(`/${suffix}`, { waitUntil: "domcontentloaded" })
  await expect(page.getByTestId("ondo-b-root")).toBeVisible({ timeout: 30_000 })
  const seoul = page.locator("[data-testid='ondo-b-nation'] [data-city='seoul']")
  await expect.poll(async () => {
    await seoul.click({ force: true, timeout: 1_000 }).catch(() => undefined)
    return page.getByRole("button", { name: "List", exact: true }).count()
  }, { timeout: 30_000 }).toBe(1)
  await page.getByRole("button", { name: "List", exact: true }).click()
  await expect(page.getByTestId("ondo-b-venue-list")).toBeVisible()
  await page.getByRole("search").getByRole("textbox").fill("로바")
  await page.getByText("로바", { exact: true }).locator("xpath=ancestor::button").click({ force: true })
  await expect(page.getByTestId("canonical-place-peek")).toBeVisible({ timeout: 30_000 })
  await page.getByTestId("canonical-place-details").click()
  const place = page.getByTestId("canonical-place-overlay")
  await expect(place).toBeVisible({ timeout: 20_000 })
  await expect(place.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready", { timeout: 20_000 })
  await page.getByTestId("canonical-venue-checkout").click()
  await expect(page.getByTestId("checkout-overlay")).toBeVisible()
}

test.beforeEach(async ({ page }, testInfo) => {
  testInfo.setTimeout(60_000)
  page.setDefaultTimeout(20_000)
  page.setDefaultNavigationTimeout(60_000)
})

test("SLK-004 keyboard close restores the exact My and ID origin tab and opener", async ({ page }) => {
  await seedAcknowledgedLabs(page)

  await activateTab(page, "My Korea", "ondo-my-entry")
  const myOpener = page.getByTestId("open-labs-milestone")
  await myOpener.focus()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("button", { name: "Return to My Korea" })).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(page.getByTestId("ondo-my-entry")).toBeVisible()
  await expect(myOpener).toBeFocused()

  await activateTab(page, "ID", "ondo-identity-entry")
  const idOpener = page.getByTestId("open-labs-id")
  await idOpener.focus()
  await page.keyboard.press("Enter")
  const returnToId = page.getByRole("button", { name: "Return to ID" })
  await expect(returnToId).toBeFocused()
  await returnToId.click()
  await expect(page.getByTestId("ondo-identity-entry")).toBeVisible()
  await expect(idOpener).toBeFocused()
})

test("SLK-009 exact / Labs contains no QA author controls or phrases", async ({ page }) => {
  await seedAcknowledgedLabs(page)
  await expect(page).toHaveURL(/\/$/)
  await activateTab(page, "My Korea", "ondo-my-entry")
  await page.getByTestId("open-labs-milestone").click()
  const labs = page.getByTestId("labs-overlay")
  await expect(labs).toBeVisible()
  await expect(labs).not.toContainText(/fixture|Advance fixture phase|View quote mismatch example|Simulate signer connection/i)
})

test("SLK-009 public Labs boundary starts one session-only sample and completes the existing reviewed route", async ({ page }) => {
  await seedB(page, { session: READY_SESSION })
  await seedCurrentActivity(page, 10)
  await gotoB(page)
  await activateTab(page, "My Korea", "ondo-b-my-korea-entry")
  const milestone = page.getByTestId("open-labs-milestone")
  if (await milestone.isVisible().catch(() => false)) await milestone.click()
  else await page.getByTestId("open-labs").click()

  const targetTruth = page.getByTestId("labs-target-truth")
  await expect(targetTruth).toContainText("Balances stay unchanged")
  expect(await targetTruth.innerText()).not.toMatch(/USDC|USDT|OOKRW|Testnet|fixture|simulated|preview/i)
  await page.getByTestId("labs-acknowledge").click()
  await expect(page).toHaveURL(/(?:\?|&)review=1(?:&|$)/)
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("ondo.review.flow.v1"))).toBe("1")

  const labs = page.getByTestId("labs-overlay")
  await labs.getByTestId("labs-connect-wallet").click()
  await expect(labs).toHaveAttribute("data-wallet-state", "WAL-READY")
  await expect(labs.getByTestId("labs-consumer-balances")).toContainText("USD")
  await expect(labs.getByTestId("labs-consumer-balances")).toContainText("KRW")
  expect(await labs.getByTestId("labs-consumer-balances").innerText()).not.toMatch(/USDC|USDT|OOKRW|Testnet|fixture|simulated/i)
  const exchangeCard = labs.getByRole("region", { name: "Exchange route" })
  await expect(exchangeCard).toContainText("USD $13.50")
  await expect(exchangeCard).toContainText("KRW ₩13,460")
  expect(await exchangeCard.innerText()).not.toMatch(/USDC|USDT|OOKRW|Testnet|fixture|simulated/i)
  await labs.getByTestId("labs-bridge-quote").click()
  await labs.getByTestId("labs-bridge-confirm").click()
  await labs.getByTestId("labs-bridge-submit").click()
  for (let index = 0; index < 3; index += 1) await labs.getByTestId("labs-bridge-advance").click()
  await expect(labs.getByTestId("labs-bridge-receipt")).toContainText("balances and transactions unchanged")
  expect(await labs.getByTestId("labs-bridge-receipt").innerText()).not.toMatch(/USDC|USDT|OOKRW|Testnet|fixture|simulated/i)

  const trait = labs.getByTestId("trait-seongsu-card")
  await trait.getByTestId("trait-retry-seongsu-card").click()
  await expect(trait).toHaveAttribute("data-trait-state", "eligible")

  // Serialized visit counts are intentionally non-authoritative. Prepare the
  // public sample history, then record a distinct tenth visit before opting in.
  await labs.getByTestId("labs-sample-visit-setup").locator("summary").click()
  await labs.getByTestId("labs-load-sample-visits").click()
  await expect(labs.getByTestId("visit-stamp-receipt")).toHaveAttribute("data-stamp-count", "9")
  await labs.getByTestId("visit-proof-check").click()
  await expect(labs.getByTestId("labs-visit-milestone")).toBeVisible()
  await labs.getByLabel("Use only place activity in the public badge.").check()
  await labs.getByTestId("labs-badge-mint").click()

  // The sample keeps the production gate intact: a first-time traveler still
  // chooses a person-check route, then the exact pending badge action resumes.
  const badgeGate = page.getByTestId("ondo-b-action-gate")
  await expect(badgeGate).toHaveAttribute("data-return-cta", "MINT_BADGE")
  await badgeGate.getByTestId("person-route-choice-mobile_id_cx").click()
  await badgeGate.getByTestId("local-check-boundary-continue").click()
  await expect(badgeGate).toBeHidden()

  await expect(labs).toHaveAttribute("data-mint-state", "NFT-MINTED")
  await expect(labs.getByTestId("labs-badge-result")).toContainText("Nothing was published.")

  for (const viewport of [
    { width: 320, height: 720 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
  ]) {
    await page.setViewportSize(viewport)
    await expect.poll(() => labs.evaluate((root) => root.scrollWidth <= root.clientWidth + 1)).toBe(true)
    await expect(labs.getByTestId("labs-back")).toBeInViewport()
  }

  await labs.getByTestId("labs-back").click()
  await expect(page.getByTestId("ondo-b-my-korea-entry")).toBeVisible()
})

test("SLK-009 ?qa=1 exposes the deterministic Labs seam", async ({ page }) => {
  await seedAcknowledgedLabs(page, "?qa=1")
  await activateTab(page, "My Korea", "ondo-my-entry")
  await page.getByTestId("open-labs-milestone").click()
  await expect(page.getByTestId("labs-overlay")).toContainText("ondo_fixture")
  await expect(page.getByRole("button", { name: "View quote mismatch example" })).toBeVisible()
})

test("SLK-009 Japanese B Labs localizes the boundary, decisions, failures, retries, receipts, traits, and badge", async ({ page }) => {
  await seedB(page, {
    locale: "ja",
    local: {
      recentVenueIds: [
        "mois-0021cd596bc5b2a922ad",
        "mois-02c79775c050624e474d",
        "mois-03041681b54ea5399763",
        "mois-0348cfe16225dbbcec8a",
        "mois-0907f914f70fc6e4b7ed",
        "mois-0977b107c7db944e75cf",
        "mois-110f0d9867977ae410e8",
        "mois-18939eecb43c15ab4305",
        "mois-003cb1bed588108df9a5",
        "mois-0086f1fedf9b9ef2889c",
      ],
    },
  })
  await seedCurrentActivity(page, 10)
  await gotoB(page, "?qa=1&review=1")
  await expect.poll(async () => {
    await page.getByTestId("nav-my").click({ force: true }).catch(() => undefined)
    return page.getByTestId("ondo-b-my-korea-entry").isVisible().catch(() => false)
  }, { timeout: 30_000 }).toBe(true)
  await page.getByTestId("open-labs").click({ force: true })

  const boundary = page.getByRole("dialog", { name: "Labs" })
  await expect(boundary).toContainText("ウォレット、経路、旅の記念機能を試せます")
  const targetTruth = boundary.getByTestId("labs-target-truth")
  await expect(targetTruth).toContainText("USD → KRW サンプル")
  await expect(targetTruth).toContainText("残高は変更されません")
  expect(await targetTruth.innerText()).not.toMatch(/USDC|USDT|OOKRW|Testnet|fixture|シミュレーション|プレビュー/i)
  await expect(boundary.getByTestId("labs-acknowledge")).toHaveAccessibleName("Labsを開く")
  await expect.poll(() => boundary.getByTestId("labs-boundary-disclosure").evaluate((node) => (node as HTMLDetailsElement).open)).toBe(false)
  await boundary.getByTestId("labs-acknowledge").click()

  const labs = page.getByTestId("labs-overlay")
  await expect(labs).toContainText("資産")
  await expect(labs).toContainText("交換ルート")
  await expect(labs).toContainText("店舗の利用条件")
  await expect(labs).toContainText("2026年8月1日")
  expect(await labs.getByTestId("labs-consumer-balances").innerText()).not.toMatch(/USDC|USDT|OOKRW|Testnet|fixture|シミュレーション|プレビュー/i)

  await page.evaluate(() => {
    sessionStorage.setItem("ondo.qa.controls.v1", "1")
    sessionStorage.setItem("ondo.qa.scenario.v1", "labs-wallet-fail")
  })
  await labs.getByTestId("labs-connect-wallet").click()
  await expect(labs.getByTestId("labs-wallet-outcome")).toContainText("署名の準備を完了できませんでした")
  await expect(labs.getByTestId("labs-connect-wallet")).toHaveAccessibleName("もう一度試す")
  await page.evaluate(() => sessionStorage.removeItem("ondo.qa.scenario.v1"))
  await labs.getByTestId("labs-connect-wallet").click()
  await expect(labs).toHaveAttribute("data-wallet-state", "WAL-READY")

  await labs.getByTestId("labs-bridge-quote").click()
  await expect(labs.getByTestId("labs-quote")).toContainText("推定経路手数料")
  await labs.getByTestId("labs-bridge-confirm").click()
  await labs.getByTestId("labs-bridge-submit").click()
  for (let index = 0; index < 3; index += 1) await labs.getByTestId("labs-bridge-advance").click()
  await expect(labs.getByTestId("labs-bridge-receipt")).toContainText("サンプル結果")
  await expect(labs.getByTestId("labs-bridge-receipt")).toContainText("サンプルのみ・残高と取引は変更なし")

  const trait = labs.getByTestId("trait-seongsu-card")
  await expect(trait).toContainText("聖水テジクッパ")
  await expect(trait.getByTestId("trait-retry-seongsu-card")).toHaveAccessibleName("聖水テジクッパの海外発行カードの案内を再確認")
  await page.evaluate(() => sessionStorage.setItem("ondo.qa.scenario.v1", "trait-retry-fail"))
  await trait.getByTestId("trait-retry-seongsu-card").click()
  await expect(trait).toHaveAttribute("data-trait-state", "failed")
  await expect(trait).toContainText("再確認できませんでした。店舗の最新情報をご確認ください")
  await page.evaluate(() => sessionStorage.removeItem("ondo.qa.scenario.v1"))
  await trait.getByTestId("trait-retry-seongsu-card").click()
  await expect(trait).toHaveAttribute("data-trait-state", "eligible")
  await expect(trait).toContainText("この利用条件は満たしています")

  await labs.getByTestId("labs-sample-visit-setup").locator("summary").click()
  await labs.getByTestId("labs-load-sample-visits").click()
  await expect(labs.getByTestId("visit-stamp-receipt")).toHaveAttribute("data-stamp-count", "9")
  await labs.getByTestId("visit-proof-check").click()
  await expect(labs.getByTestId("labs-visit-milestone")).toBeVisible()
  const consent = labs.getByLabel("公開バッジには場所のアクティビティだけを使います。")
  await consent.check()
  await page.evaluate(() => sessionStorage.setItem("ondo.qa.scenario.v1", "mint-failed"))
  await labs.getByTestId("labs-badge-mint").click()
  const badgeGate = page.getByTestId("ondo-b-action-gate")
  await expect(badgeGate).toHaveAttribute("data-return-cta", "MINT_BADGE")
  await badgeGate.getByTestId("person-route-choice-mobile_id_cx").click()
  await page.evaluate(() => {
    const url = new URL(window.location.href)
    url.searchParams.set("qa", "1")
    url.searchParams.set("review", "1")
    url.searchParams.set("scenario", "mint-failed")
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`)
    sessionStorage.setItem("ondo.qa.controls.v1", "1")
    sessionStorage.setItem("ondo.qa.scenario.v1", "mint-failed")
  })
  await badgeGate.getByTestId("local-check-boundary-continue").click()
  await expect(badgeGate).toBeHidden()
  await expect(labs).toHaveAttribute("data-mint-state", "NFT-FAILED")
  await expect(labs).toContainText("バッジ情報を準備できませんでした")
  await page.evaluate(() => {
    const url = new URL(window.location.href)
    url.searchParams.delete("scenario")
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`)
    sessionStorage.removeItem("ondo.qa.scenario.v1")
  })
  await labs.getByTestId("labs-badge-mint").click()
  await expect(labs).toHaveAttribute("data-mint-state", "NFT-MINTED")
  await expect(labs).toContainText("公開された内容はありません")
})

test("SLK-009 B Labs isolates its session from A and cannot restore a badge without the local milestone", async ({ page }) => {
  await seedB(page)
  await seedCurrentActivity(page, 0)
  await page.addInitScript(() => {
    sessionStorage.setItem("ondo.labs.v2", JSON.stringify({
      acknowledged: true,
      wallet: "WAL-READY",
      bridge: "BRG-SIMULATED-SUCCESS",
      phase: "destination_confirmed",
      mint: "NFT-MINTED",
      consent: true,
      quoteExpiresAt: null,
      traitStates: {},
    }))
  })
  await gotoB(page)
  await activateTab(page, "My Korea", "ondo-b-my-korea-entry")
  await page.getByTestId("open-labs").click()
  const boundary = page.getByRole("dialog", { name: "Labs" })
  await expect(boundary.getByTestId("labs-acknowledge")).toBeVisible()
  // Unmount the unacknowledged boundary before installing the independent B
  // session. Otherwise its persistence effect can race the fixture write.
  await page.keyboard.press("Escape")
  await expect(boundary).toBeHidden()

  await page.evaluate(() => {
    sessionStorage.setItem("ondo-b.labs.v1", JSON.stringify({
      acknowledged: true,
      wallet: "WAL-READY",
      bridge: "BRG-IDLE",
      phase: "none",
      mint: "NFT-MINTED",
      consent: true,
      quoteExpiresAt: null,
      traitStates: {},
    }))
  })
  await page.reload({ waitUntil: "domcontentloaded" })
  await activateTab(page, "My Korea", "ondo-b-my-korea-entry")
  await page.getByTestId("open-labs").click()
  const labs = page.getByTestId("labs-overlay")
  await expect(labs).toHaveAttribute("data-wallet-state", "WAL-DISCONNECTED")
  await expect(labs).toHaveAttribute("data-bridge-state", "BRG-IDLE")
  await expect(labs).toHaveAttribute("data-mint-state", "NFT-LOCKED")
  await expect(labs.getByTestId("labs-badge-mint")).toHaveCount(0)
  await expect(labs).toContainText("0/10")
  await expect(labs).toContainText("local activity across ten different places")
})

test("SLK-009 B Labs rejects incoherent stored bridge and phase tuples", async ({ page }) => {
  await seedB(page, { clearFeatures: false })
  await page.addInitScript(() => {
    sessionStorage.setItem("ondo-b.labs.v1", JSON.stringify({
      acknowledged: true,
      wallet: "WAL-READY",
      bridge: "BRG-SIMULATED-SUCCESS",
      phase: "none",
      mint: "NFT-LOCKED",
      consent: false,
      quoteExpiresAt: null,
      traitStates: {},
    }))
  })
  await gotoB(page)
  await activateTab(page, "My Korea", "ondo-b-my-korea-entry")
  await page.getByTestId("open-labs").click()
  let labs = page.getByTestId("labs-overlay")
  await expect(labs).toHaveAttribute("data-bridge-state", "BRG-IDLE")
  await expect(labs).toHaveAttribute("data-bridge-phase", "none")
  await expect(labs.getByTestId("labs-bridge-receipt")).toHaveCount(0)

  await page.evaluate(() => {
    sessionStorage.setItem("ondo-b.labs.v1", JSON.stringify({
      acknowledged: true,
      wallet: "WAL-READY",
      bridge: "BRG-IDLE",
      phase: "destination_confirmed",
      mint: "NFT-LOCKED",
      consent: false,
      quoteExpiresAt: null,
      traitStates: {},
    }))
  })
  await page.reload({ waitUntil: "domcontentloaded" })
  await activateTab(page, "My Korea", "ondo-b-my-korea-entry")
  await page.getByTestId("open-labs").click()
  labs = page.getByTestId("labs-overlay")
  await expect(labs).toHaveAttribute("data-bridge-state", "BRG-IDLE")
  await expect(labs).toHaveAttribute("data-bridge-phase", "none")
  await expect(labs.getByTestId("labs-bridge-receipt")).toHaveCount(0)
})

test("SLK-009 B Labs sample fails closed when session storage writes are blocked", async ({ page }) => {
  const runtimeErrors: string[] = []
  page.on("pageerror", (error) => runtimeErrors.push(error.message))
  await seedB(page)
  await gotoB(page)
  await activateTab(page, "My Korea", "ondo-b-my-korea-entry")
  await page.getByTestId("open-labs").click()
  const acknowledge = page.getByTestId("labs-acknowledge")
  await expect(acknowledge).toBeVisible()
  await page.evaluate(() => {
    Object.defineProperty(window.sessionStorage, "setItem", {
      configurable: true,
      value: () => { throw new DOMException("blocked", "SecurityError") },
    })
  })
  await acknowledge.click()
  await expect(acknowledge).toBeVisible()
  await expect(page.getByTestId("labs-overlay")).toHaveCount(0)
  expect(runtimeErrors.filter((message) => !message.includes("Internal Next.js error: Router action dispatched before initialization"))).toEqual([])
})

test("SLK-009 ?qa=1 exposes the deterministic Gate seam", async ({ page }) => {
  await seedB(page, { local: { autoNight: false }, session: { ...READY_SESSION, paymentKyc: "PKY-NOT-STARTED" } })
  await openCheckout(page, "qa=1")
  await page.getByTestId("checkout-start").click()
  await expect(page.getByRole("button", { name: "Simulate failure" })).toBeVisible()
})

test("SLK-012 active Gate owns the modal tree, traps focus, and restores Checkout", async ({ page }) => {
  await seedB(page, { local: { autoNight: false }, session: { ...READY_SESSION, paymentKyc: "PKY-NOT-STARTED" } })
  await openCheckout(page)
  const checkoutDialog = page.getByTestId("ondo-sheet")
  await expect(checkoutDialog).toHaveAttribute("role", "dialog")
  await expect(checkoutDialog).toHaveAttribute("aria-modal", "true")
  await page.evaluate(() => new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve())))
  await page.evaluate(() => {
    const originalRequest = window.requestAnimationFrame.bind(window)
    const originalCancel = window.cancelAnimationFrame.bind(window)
    const queued = new Map<number, FrameRequestCallback>()
    let nextFrame = 1_000_000
    window.requestAnimationFrame = (callback) => {
      const frame = nextFrame++
      queued.set(frame, callback)
      return frame
    }
    window.cancelAnimationFrame = (frame) => {
      if (!queued.delete(frame)) originalCancel(frame)
    }
    ;(window as Window & { flushGateFocusFrames?: () => void }).flushGateFocusFrames = () => {
      window.requestAnimationFrame = originalRequest
      window.cancelAnimationFrame = originalCancel
      const callbacks = [...queued.values()]
      queued.clear()
      callbacks.forEach((callback) => callback(performance.now()))
    }
  })
  await page.getByTestId("checkout-start").click()

  await expect(checkoutDialog).toHaveAttribute("inert", "")
  await expect(checkoutDialog).toHaveAttribute("aria-hidden", "true")
  await expect(checkoutDialog).not.toHaveAttribute("role")
  await expect(checkoutDialog).not.toHaveAttribute("aria-modal")
  await expect(page.locator("[role='dialog'][aria-modal='true'], [role='alertdialog'][aria-modal='true']")).toHaveCount(1)
  const gate = page.getByTestId("ondo-gate-overlay")
  await expect(gate).not.toContainText(/Simulate failure|Show unavailable route/i)
  const close = gate.getByRole("button", { name: "Return to previous screen" })
  await expect(close).toBeFocused()
  await page.keyboard.press("Shift+Tab")
  const returnWithoutChanges = gate.getByRole("button", { name: "Return without changes" })
  await expect(returnWithoutChanges).toBeFocused()
  await page.evaluate(() => (window as Window & { flushGateFocusFrames?: () => void }).flushGateFocusFrames?.())
  await expect(returnWithoutChanges).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(close).toBeFocused()
  await expectNoSeriousAxe(page, "[data-testid='ondo-gate-overlay']")

  await page.keyboard.press("Escape")
  await expect(page.getByTestId("ondo-gate-overlay")).toHaveCount(0)
  await expect(checkoutDialog).not.toHaveAttribute("inert", "")
  await expect(checkoutDialog).not.toHaveAttribute("aria-hidden", "true")
  await expect(checkoutDialog).toHaveAttribute("role", "dialog")
  await expect(checkoutDialog).toHaveAttribute("aria-modal", "true")
  await expect(page.getByTestId("checkout-start")).toBeFocused()
})

test("SLK-016 traits identify place, condition, status, checked-at and retry only their own row", async ({ page }) => {
  await seedAcknowledgedLabs(page, "?scenario=trait-retry-fail")
  await activateTab(page, "My Korea", "ondo-my-entry")
  await page.getByTestId("open-labs-milestone").click()

  const seongsu = page.getByTestId("trait-seongsu-card")
  const euljiro = page.getByTestId("trait-euljiro-over19")
  await expect(seongsu).toContainText("Seongsu Dwaeji Gukbap")
  await expect(seongsu).toContainText("Foreign-issued card information")
  await expect(seongsu).toContainText("StatusOut of date")
  await expect(seongsu).toContainText("Checked atAug 1, 2026")
  await expect(euljiro).toContainText("Euljiro Nogari")
  await expect(euljiro).toContainText("19+ access condition")
  await expect(euljiro).toContainText("StatusUnavailable")
  await expect(page.getByTestId("labs-overlay")).not.toContainText(/merchant-seongsu|offer-foreign-card|policy-v3/)

  await page.getByRole("button", { name: "Retry Foreign-issued card information for Seongsu Dwaeji Gukbap" }).click()
  await expect(seongsu).toHaveAttribute("data-trait-state", "failed")
  await expect(seongsu).toContainText("Still unavailable")
  await expect(euljiro).toHaveAttribute("data-trait-state", "idle")

  const evidence = page.getByText("Evidence adapter boundaries", { exact: true })
  await expect(evidence).toBeVisible()
  await expect(evidence.locator("xpath=ancestor::summary")).toContainText("CONTRACT ONLY")
  await evidence.locator("xpath=ancestor::summary").focus()
  await page.keyboard.press("Enter")
  await expect(page.getByText("A live EAS implementation is deferred.")).toBeVisible()
  await expectNoSeriousAxe(page, "[data-testid='labs-overlay']")
})
