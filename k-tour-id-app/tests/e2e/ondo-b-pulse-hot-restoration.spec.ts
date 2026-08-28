import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

const DEVICE_KEY = "ondo-b.device.v1"

test.beforeEach(async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, JSON.stringify({
    locale: "en",
    onboarding: "ONB-COMPLETE",
    persona: null,
    discoveryPreferences: [],
    savedVenueIds: [],
    privateNotesByVenue: {},
    recentVenueIds: [],
    plannedTableRefs: [],
    localSignalPostedVenueIds: [],
    localPulseEvidenceByVenue: {},
    localInteractionBoundarySeen: false,
  })), DEVICE_KEY)
})

async function openSeoulList(page: import("@playwright/test").Page) {
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
  await activate(page.locator("[data-city='seoul']"))
  await activate(page.getByTestId("ondo-b-view-toggle"))
  await expect(page.getByTestId("ondo-b-list-panel")).toBeVisible()
}

async function activate(locator: import("@playwright/test").Locator) {
  await locator.focus()
  await expect(locator).toBeFocused()
  await locator.press("Enter")
}

test("Pulse is reachable from city list to selected confidence and Too Hot alternatives", async ({ page }) => {
  await openSeoulList(page)
  await expect(page.getByTestId("ondo-b-pulse-city-status")).toContainText("Curated Pulse active")
  const curatedRow = page.locator("[data-venue-id='mois-0021cd596bc5b2a922ad']")
  await expect(curatedRow.getByTestId("ondo-b-list-pulse")).toContainText(/Pulse \d+ · (PEAK|HOT|RISING|WARMING|LOW)/)

  await activate(curatedRow.locator("button"))
  await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-selected-venue-id", "mois-0021cd596bc5b2a922ad")
  await expect(page.getByTestId("ondo-b-selected-marker-status")).toContainText("ONDO temperature 91 · PEAK")
  const selectedPeek = page.getByTestId("canonical-place-peek")
  await expect(selectedPeek).toHaveAttribute("role", "dialog")
  await expect(selectedPeek).toHaveAttribute("aria-label", /로바/)
  await expect(page.getByTestId("canonical-place-pulse")).toContainText(/Pulse \d+ · (PEAK|HOT|RISING|WARMING|LOW)/)
  await activate(page.getByTestId("canonical-place-details"))
  await activate(page.getByTestId("canonical-place-pulse").locator("summary"))
  await expect(page.getByTestId("pulse-confidence")).toBeVisible()
  await expect(page.getByTestId("canonical-place-pulse")).toContainText("Curated visit signals")
  await expect(page.getByTestId("pulse-too-hot")).toBeVisible()
  const accessibility = await new AxeBuilder({ page })
    .include("[data-testid='canonical-place-overlay']")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(accessibility.violations).toEqual([])

  const alternative = page.getByTestId("pulse-alternative").first()
  const alternativeId = await alternative.getAttribute("data-venue-id")
  await activate(alternative)
  await expect(page.getByTestId("canonical-place-peek")).toHaveAttribute("data-venue-id", alternativeId!)
  await expect.poll(() => page.evaluate(() => history.state?.__ondoBDiscovery)).toMatchObject({ level: "peek", venueId: alternativeId })

  await activate(page.getByTestId("canonical-place-details"))
  await expect.poll(() => page.evaluate(() => history.state?.__ondoBDiscovery)).toMatchObject({ level: "detail", venueId: alternativeId })
  const access = page.getByTestId("canonical-after19-access")
  await activate(access.getByTestId("canonical-after19-unlock"))
  let prompt = page.getByTestId("global-after19-prompt-layer")
  await expect(prompt.getByTestId("global-after19-return-context")).toHaveAttribute("data-return-venue", alternativeId!)
  await prompt.getByTestId("global-after19-cancel").click()
  await expect(page.getByTestId("canonical-place-overlay")).toHaveAttribute("data-venue-id", alternativeId!)
  await expect(access).toHaveAttribute("data-after19-venue-status", "locked")
  await expect.poll(() => page.evaluate(() => history.state?.__ondoBDiscovery)).toMatchObject({ level: "detail", venueId: alternativeId })

  await activate(access.getByTestId("canonical-after19-unlock"))
  prompt = page.getByTestId("global-after19-prompt-layer")
  await expect(prompt.getByTestId("global-after19-return-context")).toHaveAttribute("data-return-venue", alternativeId!)
  await prompt.getByTestId("global-after19-confirm").click()
  await expect(page.getByTestId("canonical-place-overlay")).toHaveAttribute("data-venue-id", alternativeId!)
  await expect(access).toHaveAttribute("data-after19-venue-status", "unlocked")
  await expect.poll(() => page.evaluate(() => history.state?.__ondoBDiscovery)).toMatchObject({ level: "detail", venueId: alternativeId })
})

test("a limited place returns from Local Signal with device evidence and no invented shared metrics", async ({ page }) => {
  const venueId = "mois-02d77be9fc4b43fbb360"
  await openSeoulList(page)
  await page.locator(`[data-venue-id='${venueId}'] button`).click()
  await page.getByTestId("canonical-place-details").click()
  const pulse = page.getByTestId("canonical-place-pulse")
  await expect(pulse).toContainText("Pulse · LIMITED")
  await expect(pulse.getByTestId("pulse-score")).toHaveCount(0)
  await expect(pulse.getByTestId("pulse-signal-count")).toHaveCount(0)

  await page.getByTestId("canonical-local-signal-open").click()
  await expect(page.getByTestId("ondo-b-local-signal")).toBeFocused()
  await page.getByRole("button", { name: "Lively right now" }).click()
  await page.getByRole("textbox", { name: "Optional local note" }).fill("A short device-only note")
  await page.getByTestId("local-signal-person-check").click()
  await expect(page.getByTestId("ondo-b-action-gate")).toHaveAttribute("data-active-gate", "account")
  await page.getByTestId("action-gate-confirm").click()
  await expect(page.getByTestId("ondo-b-action-gate")).toHaveAttribute("data-active-gate", "person")
  await page.getByTestId("person-route-choice-mobile_id_cx").click()
  await expect(page.getByTestId("person-route-choice-mobile_id_cx")).toHaveAttribute("aria-pressed", "true")
  await page.getByTestId("local-check-boundary-continue").click()
  await expect(page.getByTestId("ondo-b-local-check-walkthrough")).toBeHidden()
  await page.getByTestId("local-signal-post").click()

  await expect(page.getByTestId("canonical-place-overlay")).toHaveAttribute("data-venue-id", venueId)
  await expect(page.getByTestId("pulse-local-device-evidence")).toContainText("On this device")
  await expect(pulse).toContainText("Pulse · LIMITED")
  await expect(pulse.getByTestId("pulse-score")).toHaveCount(0)
  await expect(pulse.getByTestId("pulse-signal-count")).toHaveCount(0)
  const saved = await page.evaluate((key) => localStorage.getItem(key), DEVICE_KEY)
  expect(saved).toContain("lively_now")
  expect(saved).not.toContain("A short device-only note")
})

test("Korean Pulse copy keeps the non-live, non-LOCALDATA boundary", async ({ page }) => {
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
  await activate(page.locator("[data-language-target='ja']"))
  await activate(page.locator("[data-language-target='ko']"))
  await activate(page.locator("[data-city='seoul']"))
  await activate(page.getByTestId("ondo-b-view-toggle"))
  await expect(page.getByTestId("ondo-b-pulse-city-status")).toContainText("선별 Pulse 운영 중")
  await expect(page.getByTestId("ondo-b-pulse-disclosure")).toContainText("실시간 혼잡도나 공식 LOCALDATA 사실이 아닙니다")
})
