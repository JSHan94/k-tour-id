import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"
import {
  B_SLEEK_VIEWPORTS,
} from "../helpers/ondo-b-visual-evidence"
import {
  gotoB,
  openCanonicalVenue,
  openLabs,
  prepareBPage,
  seedB,
  type BLocale,
} from "../helpers/ondo-b-qa"

const READY_SESSION = {
  account: "ACC-ACTIVE",
  person: "PER-VERIFIED",
  age: "AGE-VERIFIED",
  ageExpiresAt: "2026-08-21T20:00:00+09:00",
  paymentKyc: "PKY-VERIFIED",
  stamps: 9,
}

const BANNED_KO_ENGINEERING_NOUNS = /\b(?:Receipt|fixture|Quote|transaction|adapter|canonical envelope|Deferred|badge|metadata|CONTRACT ONLY)\b/i

async function seedReady(page: Page, locale: BLocale, clearFeatures = true) {
  await prepareBPage(page)
  await seedB(page, { locale, session: READY_SESSION, clearFeatures })
}

async function expectFocusWithinViewport(page: Page, surface: Locator) {
  await expect.poll(async () => surface.evaluate((node) => node.contains(document.activeElement))).toBe(true)
  const focused = page.locator(":focus")
  await expect(focused).toHaveCount(1)
  await expect(focused).toBeVisible()
  expect(await focused.evaluate((node) => node.tagName)).not.toBe("BODY")
  const rect = await focused.evaluate((node) => {
    const box = node.getBoundingClientRect()
    return { top: box.top, bottom: box.bottom, left: box.left, right: box.right, width: innerWidth, height: innerHeight }
  })
  expect(rect.bottom).toBeGreaterThan(0)
  expect(rect.top).toBeLessThan(rect.height)
  expect(rect.right).toBeGreaterThan(0)
  expect(rect.left).toBeLessThan(rect.width)
}

async function expectNoSeriousAxe(page: Page, selector: string) {
  const result = await new AxeBuilder({ page })
    .include(selector)
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(result.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
}

async function openCheckout(page: Page, query = "") {
  await openCanonicalVenue(page, { query })
  await page.getByTestId("canonical-venue-checkout").click()
  await expect(page.getByTestId("checkout-overlay")).toBeVisible()
}

async function seedAcknowledgedLabs(page: Page, locale: BLocale, query: string) {
  await seedReady(page, locale, false)
  await page.addInitScript(() => {
    sessionStorage.setItem("ondo.labs.v2", JSON.stringify({
      acknowledged: true,
      wallet: "WAL-READY",
      bridge: "BRG-IDLE",
      phase: "none",
      mint: "NFT-ELIGIBLE",
      consent: false,
      quoteExpiresAt: null,
      traitStates: {},
    }))
  })
  await gotoB(page, query)
  await openLabs(page)
  await expect(page.getByTestId("labs-overlay")).toBeVisible()
}

test.beforeEach(async ({ page }, testInfo) => {
  testInfo.setTimeout(90_000)
  page.setDefaultTimeout(20_000)
})

for (const locale of ["en", "ko"] as const) {
  test(`D2-004 ${locale} Checkout cancel and completion hand focus to the local recovery or status`, async ({ page }) => {
    await seedReady(page, locale)
    await openCheckout(page)
    const checkout = page.getByTestId("checkout-overlay")

    await page.getByTestId("checkout-start").click()
    await expect(page.getByTestId("checkout-confirm")).toBeFocused()
    await page.getByTestId("checkout-cancel").click()
    await expect(page.getByTestId("checkout-retry")).toBeFocused()
    await expectFocusWithinViewport(page, checkout)
    await page.keyboard.press("Tab")
    await expectFocusWithinViewport(page, checkout)

    await page.getByTestId("checkout-retry").click()
    await expect(page.getByTestId("checkout-confirm")).toBeFocused()
    await page.getByTestId("checkout-confirm").click()
    const receipt = page.getByTestId("checkout-receipt")
    await expect(receipt).toBeVisible()
    await expect(receipt).toBeFocused()
    await expectFocusWithinViewport(page, checkout)
    await page.keyboard.press("Tab")
    await expect(page.getByTestId("visit-proof-check")).toBeFocused()
    await expectNoSeriousAxe(page, "[data-testid='checkout-overlay']")
  })

  test(`D2-004 ${locale} Profile cancel, save failure, and retry preserve keyboard position`, async ({ page }) => {
    await seedReady(page, locale)
    await gotoB(page, "?profile=failure")
    await page.getByTestId("nav-id").click()
    const identity = page.getByTestId("ondo-identity-entry")
    const profile = page.getByTestId("ondo-profile-panel")
    const labels = locale === "ko"
      ? { edit: "프로필 미리보기 편집", name: "표시 이름", cancel: "미리보기 편집 취소", save: "프로필 미리보기 저장", retry: "미리보기 저장 다시 시도", show: "출신: 브라우저 미리보기에서 제외됨. 출신 포함하기" }
      : { edit: "Edit profile preview", name: "Display name", cancel: "Cancel preview editing", save: "Save profile preview", retry: "Try saving preview again", show: "From: excluded from browser preview. Include From in preview" }

    await profile.getByRole("button", { name: labels.edit }).click()
    await expect(profile.getByLabel(labels.name)).toBeFocused()
    await profile.getByRole("button", { name: labels.cancel }).click()
    await expect(profile.getByRole("button", { name: labels.edit })).toBeFocused()
    await expectFocusWithinViewport(page, identity)
    await page.keyboard.press("Tab")
    await expectFocusWithinViewport(page, identity)

    await profile.getByRole("button", { name: labels.edit }).click()
    await profile.getByRole("button", { name: labels.show, exact: true }).click()
    await profile.getByRole("button", { name: labels.save }).click()
    await expect(profile.getByRole("alert")).toBeVisible()
    await expect(profile.getByRole("button", { name: labels.retry })).toBeFocused()
    await profile.getByRole("button", { name: labels.retry }).click()
    await expect(profile.getByRole("button", { name: labels.edit })).toBeFocused()
    await expectFocusWithinViewport(page, identity)
    await page.keyboard.press("Tab")
    await expectFocusWithinViewport(page, identity)
    await expectNoSeriousAxe(page, "[data-testid='ondo-profile-panel']")
  })

  test(`D2-004 ${locale} Labs bridge cancel, failure, and success retain focus and Tab continuation`, async ({ page }) => {
    await seedAcknowledgedLabs(page, locale, "?qa=1&scenario=bridge-failed")
    const labs = page.getByTestId("labs-overlay")

    await page.getByTestId("labs-bridge-quote").click()
    await expect(page.getByTestId("labs-bridge-confirm")).toBeFocused()
    await page.getByTestId("labs-bridge-cancel").click()
    await expect(page.getByTestId("labs-bridge-quote")).toBeFocused()
    await expectFocusWithinViewport(page, labs)
    await page.keyboard.press("Tab")
    await expectFocusWithinViewport(page, labs)

    await page.getByTestId("labs-bridge-quote").click()
    await page.getByTestId("labs-bridge-confirm").click()
    await expect(page.getByTestId("labs-bridge-submit")).toBeFocused()
    await page.getByTestId("labs-bridge-submit").click()
    await expect(page.getByTestId("labs-bridge-advance")).toBeFocused()
    await page.getByTestId("labs-bridge-advance").click()
    await page.getByTestId("labs-bridge-advance").click()
    await expect(labs).toHaveAttribute("data-bridge-state", "BRG-FAILED")
    await expect(page.getByTestId("labs-bridge-quote")).toBeFocused()
    await expectFocusWithinViewport(page, labs)

    await page.evaluate(() => history.replaceState(null, "", "/ondo-b?qa=1"))
    await page.getByTestId("labs-bridge-quote").click()
    await page.getByTestId("labs-bridge-confirm").click()
    await page.getByTestId("labs-bridge-submit").click()
    for (let index = 0; index < 3; index += 1) await page.getByTestId("labs-bridge-advance").click()
    const receipt = page.getByTestId("labs-bridge-receipt")
    await expect(receipt).toBeVisible()
    await expect(receipt).toBeFocused()
    await expectFocusWithinViewport(page, labs)
    await page.keyboard.press("Tab")
    await expectFocusWithinViewport(page, labs)
    await expectNoSeriousAxe(page, "[data-testid='labs-overlay']")
  })
}

test("D4-005 KO consumer explanations avoid raw English engineering nouns; ordinary EN avoids fixture jargon", async ({ page }) => {
  await seedReady(page, "ko")
  await openCheckout(page, "qa=1&scenario=payment-declined")
  await page.getByTestId("checkout-start").click()
  await page.getByTestId("checkout-confirm").click()
  await expect(page.getByTestId("checkout-overlay")).toHaveAttribute("data-payment-state", "PAY-FAILED")
  await expect(page.getByTestId("checkout-overlay")).not.toContainText(BANNED_KO_ENGINEERING_NOUNS)

  await gotoB(page, "?qa=1")
  await page.getByTestId("nav-id").click()
  await expect(page.getByTestId("ondo-identity-entry")).not.toContainText(BANNED_KO_ENGINEERING_NOUNS)

  await page.addInitScript(() => {
    sessionStorage.setItem("ondo.labs.v2", JSON.stringify({ acknowledged: true, wallet: "WAL-READY", bridge: "BRG-IDLE", phase: "none", mint: "NFT-ELIGIBLE", consent: false, quoteExpiresAt: null, traitStates: {} }))
  })
  await gotoB(page, "?qa=1")
  await openLabs(page)
  const labsKo = page.getByTestId("labs-overlay")
  await expect(labsKo).not.toContainText(BANNED_KO_ENGINEERING_NOUNS)
  await expect(labsKo).toContainText("표준 식별자: OpenDID")
  await expect(labsKo).toContainText("경로 식별자: Sui Testnet → OmniOne")

  await page.evaluate(() => {
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale: "en", guideSeen: true, autoNight: true, savedVenueIds: [], discoveryPreferences: [] }))
  })
  await gotoB(page)
  await openLabs(page)
  await expect(page.getByTestId("labs-overlay")).not.toContainText(/\bfixture\b/i)
})

test("D4-005 long KO owned-surface copy wraps without horizontal clipping at all six canonical widths", async ({ page }) => {
  await seedAcknowledgedLabs(page, "ko", "?qa=1")

  for (const viewport of B_SLEEK_VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await gotoB(page, "?qa=1")
    await openLabs(page)
    const labs = page.getByTestId("labs-overlay")
    await expect(labs).toBeVisible()
    const overflow = await labs.evaluate((root) => {
      const nodes = [root, ...root.querySelectorAll<HTMLElement>("section, article, p, small, strong, code, button, dt, dd")]
      return nodes
        .filter((node) => node.clientWidth > 0 && node.scrollWidth > node.clientWidth + 1)
        .map((node) => ({ tag: node.tagName, text: node.textContent?.trim().slice(0, 90), clientWidth: node.clientWidth, scrollWidth: node.scrollWidth }))
    })
    expect(overflow, `horizontal clipping at ${viewport.id}`).toEqual([])
    await page.getByRole("button", { name: "My Korea로 돌아가기" }).click()
  }
})
