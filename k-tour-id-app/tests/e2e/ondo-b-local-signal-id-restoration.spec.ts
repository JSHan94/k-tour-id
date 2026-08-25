import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"

async function seedB(page: Page, locale: "en" | "ko" = "en") {
  await page.addInitScript(() => {
    window.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style")
      style.textContent = "nextjs-portal { display: none !important; }"
      document.head.append(style)
    }, { once: true })
  })
  await page.addInitScript(({ key, language }) => {
    localStorage.setItem(key, JSON.stringify({
      locale: language,
      onboarding: "ONB-COMPLETE",
      persona: null,
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
      localSignalPostedVenueIds: [],
      localInteractionBoundarySeen: false,
    }))
  }, { key: DEVICE_KEY, language: locale })
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("blockedbyclient"))
}

async function openCanonicalSignal(page: Page) {
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
  await page.locator("[data-city='seoul']").click()
  await page.getByRole("button", { name: "List", exact: true }).click()
  await page.getByTestId("ondo-b-venue-list").locator("li button").first().click()
  await page.getByTestId("canonical-place-details").click()
  const place = page.getByTestId("canonical-place-overlay")
  const venueId = await place.getAttribute("data-venue-id")
  expect(venueId).toBeTruthy()
  await place.getByTestId("canonical-local-signal-open").click()
  return { place, venueId: venueId! }
}

async function runEligibility(page: Page, outcome: "success" | "failure" | "unavailable" | "expired" = "success") {
  await page.evaluate((eligibility) => {
    (window as Window & { __ONDO_B_QA__?: { eligibility?: typeof eligibility } }).__ONDO_B_QA__ = { eligibility }
  }, outcome)
  const walkthrough = page.getByTestId("ondo-b-local-check-walkthrough")
  await walkthrough.getByTestId("local-check-boundary-continue").click()
  if (outcome === "success") await expect(walkthrough).toBeHidden()
  else await expect(walkthrough.getByTestId("local-check-result")).toHaveAttribute("data-result", outcome)
  return walkthrough
}

test("B P0 keeps Explore guest-open and exposes separate ID · Wallet and Settings tabs", async ({ page }) => {
  await seedB(page)
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })

  await expect(page.getByTestId("ondo-b-nation")).toBeVisible()
  const nav = page.getByTestId("ondo-main-nav")
  await expect(nav.getByTestId("nav-ondo")).toContainText("Explore")
  await expect(nav.getByTestId("nav-my")).toContainText("My Korea")
  await expect(nav.getByTestId("nav-id")).toContainText("ID · Wallet")
  await expect(nav.getByTestId("nav-settings")).toContainText("Settings")
  await nav.getByTestId("nav-id").click()
  await expect(page.getByTestId("ondo-b-traveler-id")).toBeVisible()
  await nav.getByTestId("nav-settings").click()
  await expect(page.getByTestId("ondo-b-settings-entry")).toBeVisible()
})

test("B P0 returns once to the exact Local Signal draft/place and persists only a coarse posted marker", async ({ page }) => {
  await seedB(page)
  const { place, venueId } = await openCanonicalSignal(page)
  const draft = page.getByTestId("local-signal-draft")
  await draft.getByRole("button", { name: "Calm right now", exact: true }).click()
  await draft.getByRole("textbox", { name: "Optional local note" }).fill("Window seats are quiet before lunch.")
  await draft.getByTestId("local-signal-person-check").click()

  const walkthrough = page.getByTestId("ondo-b-local-check-walkthrough")
  await expect(walkthrough).toContainText("No identity provider is connected and no credential is created")
  await expect(walkthrough.getByTestId("consent-requester")).toContainText("ONDO Travel Pass")
  await expect(walkthrough.getByTestId("consent-purpose")).toContainText("return to the note")
  await expect(walkthrough.getByTestId("consent-minimum")).toContainText("Person — separate from age")
  await expect(walkthrough.getByTestId("consent-retention")).toContainText("No name, document, birth date, profile, or credential is saved")
  await runEligibility(page)

  await expect(draft).toHaveAttribute("data-gate-return", "success")
  await expect(draft.getByRole("textbox", { name: "Optional local note" })).toHaveValue("Window seats are quiet before lunch.")
  await expect(draft.getByRole("button", { name: "Calm right now", exact: true })).toHaveAttribute("aria-pressed", "true")
  await draft.getByRole("button", { name: "Post on this device", exact: true }).click()
  await expect(place).toBeVisible()
  await expect(place).toHaveAttribute("data-venue-id", venueId)

  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}") as Record<string, unknown>, DEVICE_KEY)
  expect(stored).toMatchObject({ localSignalPostedVenueIds: [venueId], localInteractionBoundarySeen: true })
  for (const forbidden of ["localSignalDraft", "person", "age", "claim", "credential", "did", "profile", "outcome"]) {
    expect(stored).not.toHaveProperty(forbidden)
  }
  expect(JSON.stringify(stored)).not.toContain("Window seats")
})

test("B P0 preserves the draft through cancel, failure, unavailable, expired, and retry returns", async ({ page }) => {
  await seedB(page)
  await openCanonicalSignal(page)
  const draft = page.getByTestId("local-signal-draft")
  const note = draft.getByRole("textbox", { name: "Optional local note" })
  await note.fill("Keep this exact draft")

  await draft.getByTestId("local-signal-person-check").click()
  let walkthrough = page.getByTestId("ondo-b-local-check-walkthrough")
  await walkthrough.getByRole("button", { name: "Not now — return to note", exact: true }).click()
  await expect(draft).toHaveAttribute("data-gate-return", "cancel")
  await expect(note).toHaveValue("Keep this exact draft")

  for (const outcome of ["failure", "unavailable", "expired"] as const) {
    await draft.getByTestId("local-signal-person-check").click()
    walkthrough = await runEligibility(page, outcome)
    await walkthrough.getByRole("button", { name: "Return without checking", exact: true }).click()
    await expect(draft).toHaveAttribute("data-gate-return", outcome)
    await expect(note).toHaveValue("Keep this exact draft")
    await expect(draft.getByTestId("local-signal-person-check")).toBeFocused()
  }
})

test("B P0 keeps Person and 19+ outcomes independent and out of storage", async ({ page }) => {
  await seedB(page)
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
  await page.getByTestId("nav-id").click()
  const identity = page.getByTestId("ondo-b-traveler-id")
  await identity.getByTestId("traveler-id-person").getByRole("button", { name: "Check Person" }).click()
  await runEligibility(page)
  await expect(identity.getByTestId("traveler-id-person")).toContainText("Ready this session")
  await expect(identity.getByTestId("traveler-id-age")).toContainText("Not checked")

  await identity.getByTestId("traveler-id-age").getByRole("button", { name: "Check 19+" }).click()
  const walkthrough = await runEligibility(page, "expired")
  await walkthrough.getByRole("button", { name: "Return without checking", exact: true }).click()
  await expect(identity.getByTestId("traveler-id-age")).toContainText("Expired")
  await expect(identity.getByTestId("traveler-id-person")).toContainText("Ready this session")

  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}") as Record<string, unknown>, DEVICE_KEY)
  expect(JSON.stringify(stored)).not.toMatch(/personCheck|ageCheck|claim|credential|did|profile|outcome/i)
})

test("B P0 Korean Local Signal remains keyboard-contained and reflows in short landscape", async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  await seedB(page, "ko")
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
  await page.locator("[data-city='seoul']").click()
  const listToggle = page.getByRole("button", { name: "목록", exact: true })
  if (await listToggle.count()) await listToggle.click()
  await page.getByTestId("ondo-b-venue-list").locator("li button").first().click()
  await page.getByTestId("canonical-place-details").click()
  await page.getByTestId("canonical-local-signal-open").click()

  const signal = page.getByTestId("ondo-b-local-signal")
  await expect(signal.getByRole("heading", { name: "로컬 시그널 남기기" })).toBeVisible()
  await expect(signal).toBeFocused()
  const close = signal.getByRole("button", { name: "로컬 시그널 닫기" })
  const continueButton = signal.getByTestId("local-signal-person-check")
  await close.focus()
  await page.keyboard.press("Shift+Tab")
  await expect(continueButton).toBeFocused()
  await continueButton.focus()
  await page.keyboard.press("Tab")
  await expect(close).toBeFocused()
  const bounds = await signal.boundingBox()
  expect(bounds?.width ?? 0).toBeLessThanOrEqual(700)
  expect(await signal.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true)

  const axe = await new AxeBuilder({ page }).include("[data-testid='ondo-b-local-signal']").analyze()
  expect(axe.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
})
