import { expect, test, type Page } from "@playwright/test"
import { expectBRuntimeClean, installBRuntimeGuard } from "../helpers/ondo-b-qa"

test.beforeEach(({ page }) => installBRuntimeGuard(page))
test.afterEach(async ({ page }, testInfo) => { await expectBRuntimeClean(page, testInfo) })

const VENUE_ID = "mois-0021cd596bc5b2a922ad"
const DEVICE_KEY = "ondo-b.device.v1"
const ACCOUNT_KEY = "ondo-b.account.v1"
const LEGACY_KEY = "ondo.session.v3"
const SEED_KEY = "ondo-b.test.account-save.seeded"

const COPY = {
  en: { saved: "Remove from Saved", close: "Close place", title: "Save this place?" },
  ko: { saved: "저장 취소", close: "장소 닫기", title: "이 장소를 저장할까요?" },
  ja: { saved: "保存を解除", close: "場所を閉じる", title: "この場所を保存しますか？" },
} as const

type Locale = keyof typeof COPY

async function seed(page: Page, locale: Locale, account: "guest" | "active" = "guest") {
  await page.addInitScript(({ deviceKey, accountKey, legacyKey, seedKey, nextLocale, nextAccount }) => {
    if (sessionStorage.getItem(seedKey) === "1") return
    localStorage.setItem(deviceKey, JSON.stringify({
      locale: nextLocale,
      onboarding: "ONB-COMPLETE",
      discoveryPreferences: [],
      savedVenueIds: [],
      savedEditorialPlaceIds: [],
      privateNotesByVenue: {},
    }))
    sessionStorage.removeItem(legacyKey)
    if (nextAccount === "active") sessionStorage.setItem(accountKey, JSON.stringify({ account: "ACC-ACTIVE", returnTo: null }))
    else sessionStorage.removeItem(accountKey)
    sessionStorage.setItem(seedKey, "1")
  }, { deviceKey: DEVICE_KEY, accountKey: ACCOUNT_KEY, legacyKey: LEGACY_KEY, seedKey: SEED_KEY, nextLocale: locale, nextAccount: account })
}

async function openVenue(page: Page, query = "") {
  await page.goto(`/?city=seoul&view=list${query}`, { waitUntil: "domcontentloaded" })
  const row = page.getByTestId("ondo-b-venue-list").locator(`li[data-venue-id='${VENUE_ID}'] > button`)
  await expect(row).toBeVisible({ timeout: 15_000 })
  await row.click()
  const peek = page.getByTestId("canonical-place-peek")
  await expect(peek).toBeVisible()
  await page.getByTestId("canonical-place-details").click()
  const detail = page.getByTestId("canonical-place-overlay")
  await expect(detail).toBeVisible()
  await expect(page).toHaveURL((url) => url.searchParams.get("venueId") === VENUE_ID && url.searchParams.get("detail") === "1")
  await expect(detail.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", /ready|error/)
  return detail
}

for (const locale of ["en", "ko", "ja"] as const) {
  test(`B-ACCOUNT-E2E-${locale.toUpperCase()} guest cancel and completion preserve the exact venue`, async ({ page }) => {
    await seed(page, locale)
    const detail = await openVenue(page)
    const exactVenueUrl = page.url()

    await page.getByTestId("canonical-venue-save").click()
    const gate = page.getByTestId("account-save-gate")
    await expect(gate).toBeVisible()
    await expect(gate).toHaveAttribute("data-account-return-venue", VENUE_ID)
    await expect(gate).toHaveAttribute("data-account-return-level", "detail")
    await expect(gate).toHaveAttribute("data-account-return-draft", "none")
    await expect(gate.getByTestId("account-return-context")).toBeVisible()
    await expect(gate.locator("#account-save-session-truth")).toHaveCount(0)
    await expect(gate.getByTestId("account-start")).toBeFocused()
    expect(await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "{}"), ACCOUNT_KEY)).toMatchObject({
      account: "ACC-GUEST",
      returnTo: { action: "SAVE_VENUE", activeGate: "account", venueId: VENUE_ID, draft: null },
    })

    await gate.getByTestId("gate-cancel").click()
    await expect(gate).toHaveCount(0)
    await expect(detail).toBeVisible()
    await expect(page).toHaveURL(exactVenueUrl)
    await expect(page.getByTestId("canonical-venue-save")).toBeFocused()
    expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}").savedVenueIds, DEVICE_KEY)).toEqual([])

    await page.getByTestId("canonical-venue-save").click()
    await page.getByTestId("account-start").click()

    await expect(page.getByTestId("ondo-gate-overlay")).toHaveCount(0)
    await expect(detail).toBeVisible()
    await expect(page).toHaveURL(exactVenueUrl)
    await expect(page.getByTestId("canonical-venue-save")).toContainText(COPY[locale].saved)
    await expect(page.getByTestId("canonical-venue-save")).toBeFocused()
    const stored = await page.evaluate(({ deviceKey, accountKey }) => ({
      device: JSON.parse(localStorage.getItem(deviceKey) ?? "{}"),
      account: JSON.parse(sessionStorage.getItem(accountKey) ?? "{}"),
    }), { deviceKey: DEVICE_KEY, accountKey: ACCOUNT_KEY })
    expect(stored.device.savedVenueIds).toEqual([VENUE_ID])
    expect(stored.device).not.toHaveProperty("account")
    expect(stored.device).not.toHaveProperty("person")
    expect(stored.device).not.toHaveProperty("age")
    expect(stored.device).not.toHaveProperty("paymentKyc")
    expect(stored.account).toEqual({ account: "ACC-ACTIVE", returnTo: null })

    await page.reload({ waitUntil: "domcontentloaded" })
    const restoredDetail = page.getByTestId("canonical-place-overlay")
    await expect(restoredDetail).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId("canonical-place-peek")).toHaveCount(0)
    await expect(restoredDetail.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", /ready|error/)
    await expect(page.getByTestId("canonical-venue-save")).toContainText(COPY[locale].saved)
    await page.getByRole("button", { name: COPY[locale].close, exact: true }).click()
    await page.getByTestId("nav-id").click()
    await expect(page.getByTestId("traveler-id-account")).toHaveAttribute("data-status", "active")
  })
}

test("B-ACCOUNT-E2E-JA-REFLOW keeps the account gate inside every required portrait width", async ({ page }) => {
  await seed(page, "ja")
  await openVenue(page)
  await page.getByTestId("canonical-venue-save").click()

  for (const width of [320, 360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 })
    const gate = page.getByTestId("account-save-gate")
    await expect(gate).toBeVisible()
    await expect(gate.getByRole("heading", { name: COPY.ja.title })).toBeVisible()
    await expect(gate.locator("#account-save-session-truth")).toHaveCount(0)
    const geometry = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth)
    await expect(gate).toBeInViewport()
  }
})

test("B-ACCOUNT-E2E-FAIL explicit QA failure retries the same save task", async ({ page }) => {
  await seed(page, "en")
  await openVenue(page, "&qa=1")

  await page.getByTestId("canonical-venue-save").click()
  await page.getByTestId("account-simulate-failure").click()
  await expect(page.getByTestId("gate-failure")).toBeVisible()
  await expect(page.getByTestId("gate-retry")).toBeFocused()
  await page.getByTestId("gate-retry").click()
  await expect(page.getByTestId("account-save-gate")).toHaveAttribute("data-gate-view", "intro")
  await expect(page.getByTestId("account-start")).toBeFocused()
  await page.getByTestId("account-start").click()

  await expect(page.getByTestId("ondo-gate-overlay")).toHaveCount(0)
  await expect(page.getByTestId("canonical-venue-save")).toContainText("Remove from Saved")
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}"), DEVICE_KEY)).toMatchObject({ savedVenueIds: [VENUE_ID] })
})

test("B-ACCOUNT-E2E-SAVE-FAIL active Account keeps save failure and retry separate", async ({ page }) => {
  await seed(page, "en", "active")
  await openVenue(page, "&qa=1&scenario=save-failed")

  await page.getByTestId("canonical-venue-save").click()
  await expect(page.getByTestId("ondo-gate-overlay")).toHaveCount(0)
  await expect(page.getByTestId("canonical-save-error")).toBeVisible()
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}").savedVenueIds, DEVICE_KEY)).toEqual([])

  await page.getByTestId("canonical-save-retry").click()
  await expect(page.getByTestId("canonical-save-error")).toHaveCount(0)
  await expect(page.getByTestId("canonical-venue-save")).toContainText("Remove from Saved")
})

test("B-ACCOUNT-E2E-MIGRATION admits only the legacy Account status without mutating its owner", async ({ page }) => {
  const legacyBytes = JSON.stringify({
    account: "ACC-ACTIVE",
    person: "PER-VERIFIED",
    age: "AGE-VERIFIED",
    paymentKyc: "PKY-VERIFIED",
    profile: { displayName: "Must not migrate" },
  })
  await page.addInitScript(({ deviceKey, accountKey, legacyKey, legacy }) => {
    localStorage.setItem(deviceKey, JSON.stringify({ locale: "en", onboarding: "ONB-COMPLETE", savedVenueIds: [] }))
    sessionStorage.removeItem(accountKey)
    sessionStorage.setItem(legacyKey, legacy)
  }, { deviceKey: DEVICE_KEY, accountKey: ACCOUNT_KEY, legacyKey: LEGACY_KEY, legacy: legacyBytes })
  await openVenue(page)

  await page.getByTestId("canonical-venue-save").click()
  await expect(page.getByTestId("ondo-gate-overlay")).toHaveCount(0)
  await expect(page.getByTestId("canonical-venue-save")).toContainText("Remove from Saved")
  const result = await page.evaluate(({ accountKey, legacyKey }) => ({
    account: JSON.parse(sessionStorage.getItem(accountKey) ?? "{}"),
    legacy: sessionStorage.getItem(legacyKey),
  }), { accountKey: ACCOUNT_KEY, legacyKey: LEGACY_KEY })
  expect(result.legacy).toBe(legacyBytes)
  expect(result.account).toEqual({ account: "ACC-ACTIVE", returnTo: null })
  expect(result.account).not.toHaveProperty("person")
  expect(result.account).not.toHaveProperty("age")
  expect(result.account).not.toHaveProperty("paymentKyc")
  expect(result.account).not.toHaveProperty("profile")
})
