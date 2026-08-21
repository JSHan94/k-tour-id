import { expect, test, type Locator, type Page } from "@playwright/test"
import { prepareBPage } from "../helpers/ondo-b-qa"

const CANONICAL_VENUE_ID = "mois-0021cd596bc5b2a922ad"

async function seed(page: Page, options: { ready?: boolean; saved?: string[]; preferences?: string[] } = {}) {
  await page.addInitScript(({ ready, saved, preferences }) => {
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({
      locale: "en",
      guideSeen: true,
      autoNight: true,
      savedVenueIds: saved,
      discoveryPreferences: preferences,
    }))
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({
      onboarding: "ONB-COMPLETE",
      persona: "short_term",
      account: ready ? "ACC-ACTIVE" : "ACC-GUEST",
      person: ready ? "PER-VERIFIED" : "PER-UNVERIFIED",
      age: "AGE-UNVERIFIED",
      paymentKyc: "PKY-NOT-STARTED",
      after19: "A19-OFF",
      stamps: 0,
    }))
  }, {
    ready: options.ready ?? false,
    saved: options.saved ?? [],
    preferences: options.preferences ?? [],
  })
}

async function expectHydratedShell(page: Page) {
  const nav = page.getByTestId("ondo-main-nav")
  await expect(nav).not.toHaveAttribute("aria-hidden", "true")
  await expect(nav).toHaveJSProperty("inert", false)
}

async function expectCenterHit(control: Locator) {
  await expect.poll(() => control.evaluate((element) => {
    const box = element.getBoundingClientRect()
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
    return hit === element || (hit != null && element.contains(hit))
  })).toBe(true)
}

test.beforeEach(async ({ page }) => {
  await prepareBPage(page)
})

test("After 19 stays out of the B nation hero and appears after city selection", async ({ page }) => {
  await seed(page)
  await page.goto("/ondo-b")
  await expectHydratedShell(page)

  const after19 = page.getByRole("button", { name: "After 19", exact: true })
  await expect(page.getByTestId("ondo-b-nation")).toBeVisible()
  await expect(after19).toBeHidden()

  const seoul = page.locator("[data-city='seoul']")
  await expectCenterHit(seoul)
  await seoul.click()
  await expect(after19).toBeVisible()
})

test("Local Signal requires a note or photo and states the simulated public-score boundary", async ({ page }) => {
  await seed(page, { ready: true })
  await page.goto("/ondo-b?city=seoul&view=list")
  await page.getByTestId("ondo-b-venue-list").locator("li button").first().click()
  await page.getByTestId("canonical-place-details").click()
  await page.getByTestId("canonical-venue-signal").click()

  const signal = page.getByTestId("local-signal-overlay")
  const submit = page.getByTestId("local-signal-submit")
  await expect(page.getByRole("dialog", { name: "Share a local tip", exact: true })).toBeVisible()
  await expect(submit).toHaveText("Submit local tip")
  await expect(signal).toHaveAttribute("data-signal-evidence", "required")
  await expect(submit).toBeDisabled()
  await expect(signal).toContainText("simulated contribution only")
  await expect(signal).toContainText("public ONDO score does not change immediately")

  const note = page.getByLabel("Helpful note · Add a note or photo")
  await note.fill("Order at the counter.")
  await expect(submit).toBeEnabled()
  await note.fill("")
  await expect(submit).toBeDisabled()

  await page.locator("input[type='file']").setInputFiles({
    name: "meal.png",
    mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"),
  })
  await expect(signal).toHaveAttribute("data-signal-evidence", "ready")
  await submit.click()
  await expect(signal).toHaveAttribute("data-signal-status", "submitted")
  await expect(signal).toHaveAttribute("data-signal-invariants", "preserved")
  await expect(signal).toContainText("updates only visit and contribution histories")
  await expect(signal).toContainText("saved to this device demo")
  await expect(signal).toContainText("public ONDO score does not change immediately")
  await expect(signal.getByRole("button", { name: "Cancel draft" })).toHaveCount(0)
})

test("My Korea edits persona and preferences and labels an English canonical save bilingually", async ({ page }) => {
  await seed(page, { saved: [CANONICAL_VENUE_ID], preferences: ["classic"] })
  await page.goto("/ondo-b")
  await expectHydratedShell(page)
  const myKorea = page.getByRole("button", { name: "My Korea", exact: true })
  await expectCenterHit(myKorea)
  await myKorea.click()

  const saved = page.getByTestId(`saved-venue-${CANONICAL_VENUE_ID}`)
  await expect(saved).toContainText("로바")
  await expect(saved).toContainText("Official Korean source name")
  await expect(saved).toContainText("Roba")
  await expect(saved).toContainText("Transliterated for navigation · Generated, not an official English name")

  await page.getByTestId("discovery-persona").selectOption("long_term_resident")
  await page.getByTestId("discovery-preference-cafe").click()
  const dietary = page.getByRole("group", { name: "Dietary requirements", exact: true })
  await expect(dietary).toBeVisible()
  await page.getByTestId("discovery-preference-vegan").click()
  await expect(page.getByTestId("discovery-preference-vegan")).toHaveAttribute("aria-pressed", "true")
  await expect(page.getByTestId("discovery-preference-truth")).toContainText("Saved only as discovery context on this device")
  await expect(page.getByTestId("discovery-preference-truth")).toContainText("neither hide venues nor label them as supported")
  await expect.poll(() => page.evaluate(() => {
    const session = JSON.parse(sessionStorage.getItem("ondo.session.v3") ?? "{}")
    const local = JSON.parse(localStorage.getItem("ondo.preferences.v3") ?? "{}")
    return [session.persona, local.discoveryPreferences]
  })).toEqual(["long_term_resident", ["classic", "cafe", "vegan"]])

  await page.getByTestId("nav-id").click()
  let identity = page.getByTestId("ondo-identity-entry")
  await expect(identity.getByRole("heading", { name: "Account and identity checks", exact: true })).toBeVisible()
  await page.getByRole("button", { name: "KO", exact: true }).click()
  await expect(page.getByTestId("nav-id")).toHaveText("신원")
  identity = page.getByTestId("ondo-identity-entry")
  await expect(identity.getByRole("heading", { name: "계정과 신원 확인", exact: true })).toBeVisible()
  await expect(identity).toContainText("본인 확인 전")
  await expect(identity).toContainText("계정·본인·19+·결제용 KYC는 서로 분리")
})
