import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const ACCOUNT_KEY = "ondo-b.account.v1"
const ACTION_KEY = "ondo-b.action-gates.v1"
const ACTIVITY_KEY = "ondo-b.activity-profile.v1"
const AFTER19_PREFERENCE_KEY = "ondo-b.after19.preferences.v1"
const AFTER19_SESSION_KEY = "ondo-b.after19.session.v1"
const VENUE_ID = "mois-0021cd596bc5b2a922ad"

type Locale = "en" | "ko" | "ja"

async function seed(page: Page, locale: Locale, stamps = 0) {
  await page.addInitScript(({ deviceKey, accountKey, actionKey, activityKey, language, stampCount }) => {
    if (localStorage.getItem(deviceKey) == null) {
      localStorage.setItem(deviceKey, JSON.stringify({
        locale: language,
        onboarding: "ONB-COMPLETE",
        persona: null,
        discoveryPreferences: [],
        savedVenueIds: [],
        privateNotesByVenue: {},
        recentVenueIds: [],
        plannedTableRefs: [],
        localSignalPostedVenueIds: [],
        localPulseEvidenceByVenue: {},
        localInteractionBoundarySeen: true,
        commerceLocalBoundarySeen: true,
        commerceReceipts: [],
      }))
    }
    if (sessionStorage.getItem(accountKey) == null) sessionStorage.setItem(accountKey, JSON.stringify({ account: "ACC-ACTIVE", returnTo: null }))
    if (sessionStorage.getItem(actionKey) == null) {
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
      sessionStorage.setItem(actionKey, JSON.stringify({
        version: 1,
        person: { status: "eligible", expiresAt },
        payment: { status: "eligible", expiresAt },
        pending: null,
        lastConsumed: null,
        outcome: null,
      }))
    }
    if (sessionStorage.getItem(activityKey) == null) {
      sessionStorage.setItem(activityKey, JSON.stringify({
        profile: {
          displayName: "Traveler",
          from: { value: "", consent: false },
          livesIn: { value: "", consent: false },
          languages: { value: [], consent: false },
        },
        reputation: { visit: stampCount ? "repeat" : "new", contribution: "new", meetup: "new" },
        stamps: stampCount,
        acceptedEvidenceIds: Array.from({ length: stampCount }, (_, index) => `visit:seed-${index + 1}`),
      }))
    }
  }, {
    deviceKey: DEVICE_KEY,
    accountKey: ACCOUNT_KEY,
    actionKey: ACTION_KEY,
    activityKey: ACTIVITY_KEY,
    language: locale,
    stampCount: stamps,
  })
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("blockedbyclient"))
}

async function openTravelPass(page: Page, locale: Locale, query = "") {
  await seed(page, locale)
  await page.goto(`/ondo-b${query}`, { waitUntil: "domcontentloaded" })
  await expect(page.locator("html")).toHaveAttribute("lang", locale)
  await page.getByTestId("nav-id").click()
  await expect(page.getByTestId("ondo-b-traveler-id")).toBeVisible()
}

async function openOffer(page: Page) {
  await page.locator("[data-city='seoul']").click()
  const toggle = page.getByTestId("ondo-b-view-toggle")
  if (await toggle.count()) await toggle.click()
  const venue = page.getByTestId("ondo-b-venue-list").locator(`[data-venue-id='${VENUE_ID}'] button`)
  await venue.scrollIntoViewIfNeeded()
  await venue.click()
  await page.getByTestId("canonical-place-details").click()
  await page.getByTestId("canonical-meal-benefit-open").click()
  return page.getByTestId("ondo-b-id-wallet-commerce")
}

for (const locale of ["en", "ko", "ja"] as const) {
  test(`profile and four independent activity axes remain polished and local in ${locale}`, async ({ page }) => {
    await openTravelPass(page, locale)
    const surface = page.getByTestId("ondo-b-profile-activity")
    await expect(surface).toBeVisible()
    await expect(surface.locator("[data-axis]" )).toHaveCount(4)
    await expect(surface.locator("[data-axis='identity']")).not.toHaveAttribute("data-axis", "visit")
    await expect(surface).not.toContainText(/trust score|reputation score|nationality|국적|国籍/i)
    const overflow = await surface.evaluate((node) => ({ client: node.clientWidth, scroll: node.scrollWidth }))
    expect(overflow.scroll).toBeLessThanOrEqual(overflow.client + 1)
    const axe = await new AxeBuilder({ page }).include("[data-testid='ondo-b-profile-activity']").analyze()
    expect(axe.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
  })
}

test("profile, axes, and stamps reflow without clipping from 320px through landscape and tablet", async ({ page }) => {
  await seed(page, "ko", 9)
  for (const viewport of [
    { width: 320, height: 720 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 768, height: 1024 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
    await page.getByTestId("nav-id").click()
    const surface = page.getByTestId("ondo-b-profile-activity")
    await expect(surface).toBeVisible()
    const dimensions = await surface.evaluate((node) => ({ client: node.clientWidth, scroll: node.scrollWidth }))
    expect(dimensions.scroll, `${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(dimensions.client + 1)
    for (const button of await surface.locator("button:visible").all()) {
      const box = await button.boundingBox()
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(43.9)
    }
  }
})

test("profile consent, failure retry, and reload persistence keep previous data safe", async ({ page }) => {
  await page.addInitScript(() => { (window as Window & { __ONDO_B_QA__?: { profile?: "failure" } }).__ONDO_B_QA__ = { profile: "failure" } })
  await openTravelPass(page, "en")
  const profile = page.getByTestId("ondo-profile-panel")
  await profile.getByRole("button", { name: "Edit", exact: true }).click()
  const inputs = profile.locator("input")
  await inputs.nth(0).fill("Mina Park")
  await inputs.nth(1).fill("Canada")
  await inputs.nth(2).fill("Seoul")
  await inputs.nth(3).fill("English, 日本語")
  await profile.getByRole("switch", { name: /From/ }).click()
  await profile.getByRole("switch", { name: /Languages/ }).click()
  await profile.getByRole("button", { name: "Save profile" }).click()
  await expect(profile.getByRole("alert")).toBeVisible()
  await expect(inputs.nth(0)).toHaveValue("Mina Park")
  await profile.getByRole("button", { name: "Try saving again" }).click()
  await expect(profile).toContainText("Mina Park")
  await expect(profile).toContainText("Canada")
  await expect(profile).toContainText("English")
  await expect(profile).not.toContainText("Seoul")

  await page.reload({ waitUntil: "domcontentloaded" })
  await page.getByTestId("nav-id").click()
  await expect(page.getByTestId("ondo-profile-panel")).toContainText("Mina Park")
  const stored = await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "null"), ACTIVITY_KEY)
  expect(stored.profile).not.toHaveProperty("nationality")
})

test("payment alone never adds a stamp; a unique visit reaches 10 once and opens Labs", async ({ page }) => {
  await seed(page, "en", 9)
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
  const offer = await openOffer(page)
  await offer.getByTestId("payment-confirm").click()
  await page.getByTestId("wallet-connect-sheet").getByRole("button", { name: "Prepare test wallet", exact: true }).click()
  await offer.getByTestId("benefit-accept").click()
  await offer.getByTestId("payment-minimum-consent").locator("input").check()
  await offer.getByTestId("payment-confirm").click()
  await expect(offer.getByTestId("payment-receipt")).toBeVisible()
  const visit = offer.getByTestId("visit-stamp-receipt")
  await expect(visit).toHaveAttribute("data-stamp-count", "9")
  expect(await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "null").stamps, ACTIVITY_KEY)).toBe(9)

  await visit.getByTestId("visit-proof-check").click()
  await expect(visit).toHaveAttribute("data-stamp-count", "10")
  expect(await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "null").stamps, ACTIVITY_KEY)).toBe(10)
  await expect(visit.getByTestId("visit-proof-check")).toHaveCount(0)
  await visit.getByTestId("checkout-stamp-milestone").click()
  await expect(page.getByTestId("labs-acknowledge")).toBeVisible()
  await page.getByTestId("labs-acknowledge").click()
  await expect(page.getByTestId("labs-overlay")).toBeVisible()
  await expect(page.getByTestId("labs-badge-mint")).toBeVisible()
})

test("clear saved content tombstones every B session axis without reviving legacy data", async ({ page }) => {
  await seed(page, "en", 9)
  await page.addInitScript(({ preferenceKey, sessionKey }) => {
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({ account: "ACC-ACTIVE", person: "PER-VERIFIED", paymentKyc: "PKY-VERIFIED", stamps: 10 }))
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({ autoNight: false }))
    localStorage.setItem(preferenceKey, JSON.stringify({ version: 1, autoOpen: false }))
    sessionStorage.setItem(sessionKey, JSON.stringify({ version: 1, age: "eligible", ageExpiresAt: new Date(Date.now() + 86_400_000).toISOString(), mode: "manual-off", activation: null, expiryNotice: false }))
  }, { preferenceKey: AFTER19_PREFERENCE_KEY, sessionKey: AFTER19_SESSION_KEY })
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
  await page.getByTestId("nav-settings").click()
  const settings = page.getByTestId("ondo-b-device-data-settings")
  await settings.locator("summary").click()
  await page.getByTestId("ondo-b-clear-device-open").click()
  await page.getByTestId("ondo-b-clear-device-confirm").getByRole("button", { name: "Clear saved content" }).click()
  const state = await page.evaluate(({ accountKey, actionKey, activityKey, preferenceKey, sessionKey }) => ({
    account: JSON.parse(sessionStorage.getItem(accountKey) ?? "null"),
    action: JSON.parse(sessionStorage.getItem(actionKey) ?? "null"),
    activity: JSON.parse(sessionStorage.getItem(activityKey) ?? "null"),
    preference: JSON.parse(localStorage.getItem(preferenceKey) ?? "null"),
    after19: JSON.parse(sessionStorage.getItem(sessionKey) ?? "null"),
    legacy: sessionStorage.getItem("ondo.session.v3"),
  }), { accountKey: ACCOUNT_KEY, actionKey: ACTION_KEY, activityKey: ACTIVITY_KEY, preferenceKey: AFTER19_PREFERENCE_KEY, sessionKey: AFTER19_SESSION_KEY })
  expect(state.account).toEqual({ account: "ACC-GUEST", returnTo: null })
  expect(state.action).toMatchObject({ person: { status: "unverified" }, payment: { status: "unverified" }, pending: null })
  expect(state.activity).toMatchObject({ stamps: 0, acceptedEvidenceIds: [] })
  expect(state.preference).toEqual({ version: 1, autoOpen: true })
  expect(state.after19).toMatchObject({ age: "unverified", mode: "off" })
  expect(state.legacy).toContain("PER-VERIFIED")
})
