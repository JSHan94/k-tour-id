import { mkdirSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test, type Locator, type Page } from "@playwright/test"
import {
  gotoB,
  openCanonicalVenue,
  prepareBPage,
  seedB,
  seedFreshOnboarding,
} from "../helpers/ondo-b-qa"

const EVIDENCE_DIR = resolve(process.cwd(), "artifacts/qa/wave3-flow-visual")

async function capture(page: Page, name: string) {
  await page.screenshot({ path: resolve(EVIDENCE_DIR, `${name}.png`), animations: "disabled" })
}

async function expectNoHorizontalOverflow(page: Page) {
  expect(await page.locator("html").evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
}

async function expectTarget(control: Locator) {
  await expect(control).toBeVisible()
  const box = await control.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.width).toBeGreaterThanOrEqual(44)
  expect(box!.height).toBeGreaterThanOrEqual(44)
}

async function expectTargetHit(control: Locator) {
  await expectTarget(control)
  expect(await control.evaluate((node) => {
    const rect = node.getBoundingClientRect()
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
    return hit === node || node.contains(hit)
  })).toBe(true)
}

async function expectTargetFullyVisibleAndHit(page: Page, control: Locator) {
  await expectTargetHit(control)
  const [box, viewport] = await Promise.all([control.boundingBox(), Promise.resolve(page.viewportSize())])
  expect(box).not.toBeNull()
  expect(viewport).not.toBeNull()
  expect(box!.y).toBeGreaterThanOrEqual(0)
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height + 1)
}

async function expectDialogContained(page: Page, dialog: Locator) {
  await expect(dialog).toBeVisible()
  const [box, viewport] = await Promise.all([dialog.boundingBox(), Promise.resolve(page.viewportSize())])
  expect(box).not.toBeNull()
  expect(viewport).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.y).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1)
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height + 1)
}

async function freshPage(page: Page, locale: "en" | "ko" | "ja") {
  await prepareBPage(page)
  await seedFreshOnboarding(page, locale)
  await gotoB(page)
}

async function openKtourFromOnboarding(page: Page, locale: "en" | "ko" | "ja") {
  await freshPage(page, locale)
  await page.getByTestId("onboarding-personalize-start").click()
  await page.getByTestId("persona-travelling").click()
  await page.getByTestId("onboarding-continue").click()
  await page.getByTestId("onboarding-preference-classic").click()
  await page.getByTestId("onboarding-finish").click()
  await expect(page.getByTestId("k-tour-id-setup")).toBeVisible()
}

test.describe("Wave 3 mobile flow visual evidence", () => {
  test.describe.configure({ timeout: 180_000 })
  test.beforeAll(() => mkdirSync(EVIDENCE_DIR, { recursive: true }))

  test("320px onboarding keeps all three decisions scannable and reachable", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 })
    await freshPage(page, "ko")
    const onboarding = page.getByTestId("ondo-onboarding")
    await capture(page, "ko-320-onboarding-value")

    await onboarding.getByTestId("onboarding-personalize-start").click()
    const intent = onboarding.getByTestId("onboarding-step-intent")
    await expect(intent).toBeVisible()
    const evidenceRoutes = onboarding.getByTestId("onboarding-evidence-routes")
    await expect(evidenceRoutes).not.toHaveAttribute("open", "")
    const evidenceSummary = evidenceRoutes.locator("summary")
    await expectTarget(evidenceSummary)
    expect(await evidenceSummary.evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(12)
    await capture(page, "ko-320-onboarding-intent")

    await onboarding.getByTestId("persona-travelling").click()
    const continueButton = onboarding.getByTestId("onboarding-continue")
    await continueButton.scrollIntoViewIfNeeded()
    await expectTarget(continueButton)
    await continueButton.click()
    const preferences = onboarding.getByTestId("onboarding-step-preferences")
    await expect(preferences).toBeVisible()
    const finish = onboarding.getByTestId("onboarding-finish")
    await finish.scrollIntoViewIfNeeded()
    await expectTarget(finish)
    await capture(page, "ko-320-onboarding-preferences")
    await expectNoHorizontalOverflow(page)
  })

  test("K-Tour ID, Account and wallet JIT sheets preserve decisions at 320px", async ({ browser }) => {
    const identityContext = await browser.newContext({ viewport: { width: 320, height: 720 }, reducedMotion: "reduce" })
    const identityPage = await identityContext.newPage()
    await openKtourFromOnboarding(identityPage, "en")
    const identity = identityPage.getByTestId("k-tour-id-setup")
    await expectDialogContained(identityPage, identity)
    await capture(identityPage, "en-320-ktour-method")
    await identity.getByTestId("k-tour-id-method-passport-ekyc").click()
    const consent = identity.getByTestId("k-tour-id-consent")
    await expect(consent).toBeVisible()
    const approve = identity.getByTestId("k-tour-id-consent-approve")
    await approve.scrollIntoViewIfNeeded()
    await expectTarget(approve)
    await capture(identityPage, "en-320-ktour-passport-consent")
    await approve.click()
    const passport = identity.getByTestId("k-tour-id-passport-document")
    for (let attempt = 0; attempt < 12 && !await passport.isVisible().catch(() => false); attempt += 1) {
      await identity.getByTestId("k-tour-id-continue").click()
    }
    await expect(passport).toBeVisible()
    await expect(passport.getByTestId("passport-ocr-preview")).toBeVisible()
    await passport.getByTestId("passport-ocr-start").click()
    await expect(passport.getByTestId("passport-ocr-review")).toBeVisible()
    await capture(identityPage, "en-320-ktour-passport-photo-ready")
    await expectNoHorizontalOverflow(identityPage)
    await identityContext.close()

    const accountContext = await browser.newContext({ viewport: { width: 320, height: 720 }, reducedMotion: "reduce" })
    const accountPage = await accountContext.newPage()
    await prepareBPage(accountPage)
    await seedB(accountPage, { locale: "ja", session: { account: "ACC-GUEST" } })
    await openCanonicalVenue(accountPage)
    await accountPage.getByTestId("canonical-venue-save").click()
    const account = accountPage.getByTestId("account-save-gate")
    await expectDialogContained(accountPage, account)
    await expectTarget(account.getByTestId("account-start"))
    await capture(accountPage, "ja-320-account-gate")
    await expectNoHorizontalOverflow(accountPage)
    await accountContext.close()

    const walletContext = await browser.newContext({ viewport: { width: 320, height: 568 }, reducedMotion: "reduce" })
    const walletPage = await walletContext.newPage()
    await prepareBPage(walletPage)
    await seedB(walletPage, { locale: "ko", session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", paymentKyc: "PKY-VERIFIED" } })
    await gotoB(walletPage)
    await walletPage.getByTestId("nav-id").click()
    await walletPage.getByTestId("wallet-link-open").click()
    const wallet = walletPage.getByTestId("wallet-connect-sheet")
    await expectDialogContained(walletPage, wallet)
    const setup = wallet.getByRole("button", { name: "여행 지갑 설정", exact: true })
    await setup.scrollIntoViewIfNeeded()
    await expectTarget(setup)
    await capture(walletPage, "ko-320x568-wallet-setup")
    await expectNoHorizontalOverflow(walletPage)
    await walletContext.close()
  })

  test("Table, checkout, receipt and Settings retain object context across mobile sizes", async ({ browser }) => {
    const paymentContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" })
    const paymentPage = await paymentContext.newPage()
    await prepareBPage(paymentPage)
    await seedB(paymentPage, { locale: "ja", session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", paymentKyc: "PKY-VERIFIED" } })
    await gotoB(paymentPage)
    await paymentPage.getByTestId("nav-tables").click()
    const tableContext = paymentPage.getByTestId("table-place-context")
    await expect(tableContext).toBeVisible()
    await capture(paymentPage, "ja-390-tables")

    await openCanonicalVenue(paymentPage)
    await paymentPage.getByTestId("canonical-meal-benefit-open").click()
    const checkout = paymentPage.getByTestId("ondo-b-id-wallet-commerce")
    await expect(checkout.getByTestId("commerce-place-context")).toBeVisible()
    await expect(checkout.getByTestId("commerce-funding-source")).toBeVisible()
    await expect(checkout.getByTestId("commerce-payment-details")).toBeVisible()
    await capture(paymentPage, "ja-390-checkout")

    await checkout.getByTestId("benefit-accept").click()
    await checkout.getByTestId("payment-confirm").click()
    const wallet = paymentPage.getByTestId("wallet-connect-sheet")
    await wallet.getByRole("button", { name: "旅のウォレットを設定", exact: true }).click()
    await expect(checkout).toHaveAttribute("data-wallet-status", "ready")
    await expect(wallet).toBeHidden()
    await checkout.getByTestId("payment-minimum-consent").getByRole("checkbox").check()
    await checkout.getByTestId("payment-confirm").click()
    const receipt = checkout.getByTestId("payment-receipt")
    await expect(receipt).toBeVisible()
    await expect(receipt.getByTestId("receipt-place-context")).toBeVisible()
    await capture(paymentPage, "ja-390-receipt")
    await expectNoHorizontalOverflow(paymentPage)
    await paymentContext.close()

    const settingsContext = await browser.newContext({ viewport: { width: 430, height: 932 }, reducedMotion: "reduce" })
    const settingsPage = await settingsContext.newPage()
    await prepareBPage(settingsPage)
    await seedB(settingsPage, { locale: "ko" })
    await gotoB(settingsPage)
    await settingsPage.getByTestId("nav-settings").click()
    const settings = settingsPage.getByTestId("ondo-b-settings-entry")
    await expect(settings).toBeVisible()
    await capture(settingsPage, "ko-430-settings")
    await expectNoHorizontalOverflow(settingsPage)
    await settingsContext.close()

    const landscapeContext = await browser.newContext({ viewport: { width: 844, height: 390 }, reducedMotion: "reduce" })
    const landscape = await landscapeContext.newPage()
    await prepareBPage(landscape)
    await seedB(landscape, { locale: "en", session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", paymentKyc: "PKY-VERIFIED" } })
    await gotoB(landscape)
    await landscape.getByTestId("nav-id").click()
    await landscape.getByTestId("traveler-id-ktour-id-open").click()
    await expectDialogContained(landscape, landscape.getByTestId("k-tour-id-setup"))
    await capture(landscape, "en-844x390-ktour-method")
    await landscape.getByTestId("k-tour-id-cancel").click()
    await landscape.getByTestId("wallet-link-open").click()
    await expectDialogContained(landscape, landscape.getByTestId("wallet-connect-sheet"))
    await capture(landscape, "en-844x390-wallet-setup")
    await expectNoHorizontalOverflow(landscape)
    await landscapeContext.close()
  })

  test("200 percent layout equivalent keeps onboarding and nav actions available", async ({ page }) => {
    await page.setViewportSize({ width: 215, height: 700 })
    await freshPage(page, "ja")
    await expectTarget(page.getByTestId("onboarding-guest-skip"))
    await page.getByTestId("onboarding-guest-skip").click()
    const nav = page.getByTestId("ondo-main-nav")
    await expect(nav.getByRole("button")).toHaveCount(5)
    for (const button of await nav.getByRole("button").all()) await expectTarget(button)
    await capture(page, "ja-215-200pct-nav")
    await expectNoHorizontalOverflow(page)
  })

  test("After 19 keeps the primary landscape decision compact while retaining its truth disclosure", async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 })
    await prepareBPage(page)
    await seedB(page, { locale: "ja", local: { autoNight: false } })
    await gotoB(page, "?city=seoul")
    await page.getByTestId("global-after19-toggle").click()
    const gate = page.getByTestId("global-after19-prompt-layer")
    const details = gate.locator("details")
    await expectDialogContained(page, gate.getByRole("dialog"))
    await expect(details).not.toHaveAttribute("open", "")
    await expect(gate.getByText("公式業態で居酒屋・パブに当たる場所だけを表示します。実際の酒類提供、入店、年齢条件は確認していません。")).not.toBeVisible()
    await expectTargetHit(gate.getByTestId("global-after19-confirm"))
    await expectTargetHit(gate.getByTestId("global-after19-cancel"))
    await capture(page, "ja-844x390-after19-decision")

    const summary = details.locator("summary")
    await expectTarget(summary)
    await summary.click()
    await expect(details).toContainText("OpenDID事業者には接続せず、資格情報も発行しません")
    await expect(details).toContainText("公式業態で居酒屋・パブに当たる場所だけを表示します")
    await expectNoHorizontalOverflow(page)
  })

  test("JA K-Tour consent keeps its primary decision fully visible in short landscape", async ({ browser }) => {
    const identityContext = await browser.newContext({ viewport: { width: 844, height: 390 } })
    const identityPage = await identityContext.newPage()
    await openKtourFromOnboarding(identityPage, "ja")
    const identity = identityPage.getByTestId("k-tour-id-setup")
    await identity.getByTestId("k-tour-id-method-passport-ekyc").click()
    const approve = identity.getByTestId("k-tour-id-consent-approve")
    await expectTargetFullyVisibleAndHit(identityPage, approve)
    await capture(identityPage, "ja-844x390-ktour-passport-consent")
    await identityContext.close()
  })

  test("JA Tables keeps its primary decision fully visible in short landscape", async ({ browser }) => {
    const tablesContext = await browser.newContext({ viewport: { width: 844, height: 390 } })
    const tablesPage = await tablesContext.newPage()
    await prepareBPage(tablesPage)
    await seedB(tablesPage, { locale: "ja" })
    await gotoB(tablesPage)
    await tablesPage.getByTestId("nav-tables").click()
    const openTable = tablesPage.getByTestId("table-open-table-seoul-night-bites")
    await expectTargetFullyVisibleAndHit(tablesPage, openTable)
    await capture(tablesPage, "ja-844x390-tables-entry")
    await openTable.click()
    const joinTable = tablesPage.getByTestId("table-join")
    await expectTargetFullyVisibleAndHit(tablesPage, joinTable)
    await capture(tablesPage, "ja-844x390-table-detail")
    await tablesContext.close()
  })

  test("K-Tour consent and Table participation retain 44px reachable decisions across portrait phones", async ({ browser }) => {
    for (const viewport of [
      { width: 320, height: 720 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
    ]) {
      const identityContext = await browser.newContext({ viewport, reducedMotion: "reduce" })
      const identityPage = await identityContext.newPage()
      await openKtourFromOnboarding(identityPage, "ja")
      const identity = identityPage.getByTestId("k-tour-id-setup")
      await identity.getByTestId("k-tour-id-method-passport-ekyc").click()
      const approve = identity.getByTestId("k-tour-id-consent-approve")
      await approve.scrollIntoViewIfNeeded()
      await expectTargetFullyVisibleAndHit(identityPage, approve)
      await expectNoHorizontalOverflow(identityPage)
      await identityContext.close()

      const tablesContext = await browser.newContext({ viewport, reducedMotion: "reduce" })
      const tablesPage = await tablesContext.newPage()
      await prepareBPage(tablesPage)
      await seedB(tablesPage, { locale: "ja" })
      await gotoB(tablesPage)
      await tablesPage.getByTestId("nav-tables").click()
      await tablesPage.getByTestId("table-open-table-seoul-night-bites").click()
      await expectTargetFullyVisibleAndHit(tablesPage, tablesPage.getByTestId("table-join"))
      await expectNoHorizontalOverflow(tablesPage)
      await tablesContext.close()
    }
  })

  test("Jeju editorial Save Account gate stays above the place layer at every mobile target", async ({ browser }) => {
    for (const viewport of [
      { width: 320, height: 720 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
      { width: 844, height: 390 },
    ]) {
      const context = await browser.newContext({ viewport, reducedMotion: "reduce" })
      const page = await context.newPage()
      await prepareBPage(page)
      await seedB(page, { locale: "ko", session: { account: "ACC-GUEST" } })
      await gotoB(page, "?city=jeju&editorialPlaceId=jeju-seongsan-ilchulbong&detail=1")
      const place = page.getByTestId("ondo-b-editorial-place-overlay")
      await expect(place).toBeVisible()
      await place.getByTestId("ondo-b-editorial-place-save").click()
      const gate = page.getByTestId("account-save-gate")
      await expectDialogContained(page, gate)
      await expect(gate).toHaveAttribute("data-account-return-kind", "editorial")
      await expectTargetHit(gate.getByTestId("account-start"))
      await expectTargetHit(gate.getByTestId("gate-cancel"))
      await capture(page, `ko-${viewport.width}x${viewport.height}-jeju-account-gate`)
      await expectNoHorizontalOverflow(page)
      await context.close()
    }
  })
})
