import { expect, test, type Locator, type Page } from "@playwright/test"
import { expectBRuntimeClean, installBRuntimeGuard } from "../helpers/ondo-b-qa"

test.beforeEach(({ page }) => installBRuntimeGuard(page))
test.afterEach(async ({ page }, testInfo) => { await expectBRuntimeClean(page, testInfo) })

async function openPublicLabs(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await page.getByTestId("onboarding-guest-skip").click()
  await page.getByTestId("nav-my").click()
  await page.getByTestId("open-labs").click()
  await page.getByTestId("labs-acknowledge").click()
  const labs = page.getByTestId("labs-overlay")
  await expect(labs).toBeVisible()
  await labs.getByTestId("labs-sample-scenarios").locator("summary").click()
  return labs
}

async function prepareSigner(labs: Locator) {
  await labs.getByTestId("labs-connect-wallet").click()
  await expect(labs).toHaveAttribute("data-wallet-state", "WAL-READY")
}

async function finishRoute(labs: Locator) {
  await labs.getByTestId("labs-bridge-quote").click()
  await labs.getByTestId("labs-bridge-confirm").click()
  await labs.getByTestId("labs-bridge-submit").click()
  for (let i = 0; i < 3; i += 1) await labs.getByTestId("labs-bridge-advance").click()
  await expect(labs).toHaveAttribute("data-bridge-state", "BRG-SIMULATED-SUCCESS")
  await expect(labs.getByTestId("labs-bridge-receipt")).toContainText("balances and transactions unchanged")
}

for (const [index, scenario] of ["oauth_cancel", "epoch_expired", "salt_recovery", "prover_failed"].entries()) {
  test(`public signer ${scenario} has an honest failure and working retry`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: [320, 390, 430, 390][index], height: 844 })
    await page.emulateMedia({ colorScheme: index % 2 ? "dark" : "light" })
    const labs = await openPublicLabs(page)
    await labs.getByTestId("labs-sample-case").selectOption(scenario)
    await labs.getByTestId("labs-connect-wallet").click()
    await expect(labs).toHaveAttribute("data-wallet-state", "WAL-FAILED")
    await expect(labs.getByTestId("labs-wallet-outcome")).toHaveAttribute("data-signer-issue", scenario)
    await expect(labs.getByTestId("labs-bridge-quote")).toBeDisabled()
    await expect(labs.getByTestId("labs-badge-mint")).toHaveCount(0)
    expect(await labs.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath(`${scenario}.png`) })
    await prepareSigner(labs)
    await expect(labs.getByTestId("labs-sample-case")).toHaveValue("success")
    await labs.getByTestId("labs-back").click()
    await page.getByTestId("nav-id").click()
    await expect(page.getByTestId("traveler-id-person")).toHaveAttribute("data-status", "none")
    expect(await page.evaluate(() => (window as Window & { __ONDO_B_QA__?: unknown }).__ONDO_B_QA__)).toBeUndefined()
  })
}

for (const scenario of ["wrong_network", "sponsor_denied", "quote_expired", "bridge_failed"]) {
  test(`public route ${scenario} recovers with a fresh quote without changing money`, async ({ page }) => {
    const labs = await openPublicLabs(page)
    await prepareSigner(labs)
    const balances = labs.getByTestId("labs-consumer-balances").locator("strong")
    const before = await balances.allTextContents()
    expect(before).toEqual(["USD", "$37.50", "KRW", "₩18,000"])
    await labs.getByTestId("labs-sample-case").selectOption(scenario)
    await labs.getByTestId("labs-bridge-quote").click()
    await labs.getByTestId("labs-bridge-confirm").click()
    if (scenario !== "quote_expired") {
      await labs.getByTestId("labs-bridge-submit").click()
      if (scenario === "bridge_failed") {
        await labs.getByTestId("labs-bridge-advance").click()
        await labs.getByTestId("labs-bridge-advance").click()
      }
    }
    await expect(labs).toHaveAttribute("data-bridge-state", scenario === "quote_expired" ? "BRG-EXPIRED" : "BRG-FAILED")
    await expect(labs.getByTestId("labs-bridge-receipt")).toHaveCount(0)
    expect(await balances.allTextContents()).toEqual(before)
    await finishRoute(labs)
    expect(await balances.allTextContents()).toEqual(before)
  })
}

test("a signer expiring after quote cannot submit the pending route", async ({ page }) => {
  const labs = await openPublicLabs(page)
  await prepareSigner(labs)
  await labs.getByTestId("labs-bridge-quote").click()
  await labs.getByTestId("labs-bridge-confirm").click()
  await labs.getByTestId("labs-sample-case").selectOption("epoch_expired")
  await labs.getByTestId("labs-bridge-submit").click()
  await expect(labs).toHaveAttribute("data-wallet-state", "WAL-FAILED")
  await expect(labs).toHaveAttribute("data-bridge-state", "BRG-FAILED")
  await expect(labs.getByTestId("labs-bridge-receipt")).toHaveCount(0)
  await prepareSigner(labs)
  await finishRoute(labs)
})

test("the public merchant check error retries only its specific condition", async ({ page }) => {
  const labs = await openPublicLabs(page)
  await labs.getByTestId("labs-sample-case").selectOption("trait_failed")
  const trait = labs.getByTestId("trait-seongsu-card")
  await trait.getByTestId("trait-retry-seongsu-card").click()
  await expect(trait).toHaveAttribute("data-trait-state", "failed")
  await trait.getByTestId("trait-retry-seongsu-card").click()
  await expect(trait).toHaveAttribute("data-trait-state", "eligible")
  await expect(labs).toHaveAttribute("data-wallet-state", "WAL-DISCONNECTED")
  await expect(labs.getByTestId("labs-badge-result")).toHaveCount(0)
})

test("public 9-to-10 distinct visits, badge opt-in, failed mint and idempotent retry need no hidden seed", async ({ page }, testInfo) => {
  test.setTimeout(90_000)
  await page.setViewportSize({ width: 390, height: 844 })
  const labs = await openPublicLabs(page)
  await prepareSigner(labs)
  await expect(labs.getByTestId("labs-badge-mint")).toHaveCount(0)
  await labs.getByTestId("labs-sample-visit-setup").locator("summary").click()
  await labs.getByTestId("labs-load-sample-visits").click()
  await expect(labs.getByTestId("visit-stamp-receipt")).toHaveAttribute("data-stamp-count", "9")
  await expect(labs.getByTestId("labs-badge-mint")).toHaveCount(0)
  await labs.getByTestId("visit-proof-check").click()
  await expect(labs.getByTestId("labs-visit-milestone")).toBeVisible()
  await expect(labs.getByTestId("labs-badge-mint")).toBeDisabled()
  await labs.getByLabel("Use only place activity in the public badge.").check()
  await labs.getByTestId("labs-sample-case").selectOption("mint_failed")
  await labs.getByTestId("labs-badge-mint").click()
  const gate = page.getByTestId("ondo-b-action-gate")
  await expect(gate).toHaveAttribute("data-return-cta", "MINT_BADGE")
  await gate.getByTestId("person-route-choice-mobile_id_cx").click()
  await gate.getByTestId("local-check-boundary-continue").click()
  await expect(gate).toBeHidden()
  await expect(labs).toHaveAttribute("data-mint-state", "NFT-FAILED")
  await expect(labs.getByTestId("labs-badge-result")).toContainText("Nothing was published.")
  await labs.getByTestId("labs-badge-mint").click()
  await expect(labs).toHaveAttribute("data-mint-state", "NFT-MINTED")
  await expect(labs.getByTestId("labs-badge-result")).toHaveAttribute("data-review-provenance", "simulated")
  await page.screenshot({ path: testInfo.outputPath("public-tenth-visit-badge.png") })
  const original = await page.evaluate(() => sessionStorage.getItem("ondo-b.labs.v1"))
  expect(original).not.toBeNull()
  expect(JSON.parse(original!).badgeReview).not.toBeNull()
  await labs.getByTestId("labs-badge-repeat").click()
  await expect(labs.getByTestId("labs-badge-duplicate")).toContainText("No second badge was created")
  expect(await page.evaluate(() => sessionStorage.getItem("ondo-b.labs.v1"))).toBe(original)
  await expect(labs.getByTestId("labs-badge-mint")).toHaveCount(0)
  expect(await labs.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
})
