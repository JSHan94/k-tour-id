import { expect, test, type Locator, type Page } from "@playwright/test"
import { gotoB, prepareBPage, seedB } from "../helpers/ondo-b-qa"

const CANONICAL_VENUE_ID = "mois-0021cd596bc5b2a922ad"

async function seed(page: Page, options: { ready?: boolean; saved?: string[]; preferences?: string[] } = {}) {
  const ready = options.ready ?? false
  await seedB(page, {
    session: {
      onboarding: "ONB-COMPLETE",
      persona: "short_term",
      account: ready ? "ACC-ACTIVE" : "ACC-GUEST",
      person: ready ? "PER-VERIFIED" : "PER-UNVERIFIED",
      age: "AGE-UNVERIFIED",
      paymentKyc: "PKY-NOT-STARTED",
      after19: "A19-OFF",
      stamps: 0,
    },
    local: {
      savedVenueIds: options.saved ?? [],
      discoveryPreferences: options.preferences ?? [],
    },
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

async function openCanonicalVenueFromList(page: Page) {
  await gotoB(page)
  await page.locator("[data-city='seoul']").click()
  const list = page.getByTestId("ondo-b-venue-list")
  if (!await list.isVisible()) await page.getByTestId("ondo-b-view-toggle").click()
  await expect(list).toBeVisible()
  await list.locator(`[data-venue-id='${CANONICAL_VENUE_ID}'] button`).click()
  await page.getByTestId("canonical-place-details").click()
  const detail = page.getByTestId("canonical-place-overlay")
  await expect(detail).toHaveAttribute("data-venue-id", CANONICAL_VENUE_ID)
  await expect(detail.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")
}

test.beforeEach(async ({ page }) => {
  await prepareBPage(page)
})

test("After 19 stays out of the B nation hero and appears after city selection", async ({ page }) => {
  await seed(page)
  await gotoB(page)
  await expectHydratedShell(page)

  const after19 = page.getByTestId("global-after19-toggle")
  await expect(page.getByTestId("ondo-b-nation")).toBeVisible()
  await expect(after19).toBeHidden()

  const seoul = page.locator("[data-city='seoul']")
  await expectCenterHit(seoul)
  await seoul.click()
  await expect(after19).toBeVisible()
})

test("Local Signal requires an observation and states the private-draft and public-Pulse boundaries", async ({ page }) => {
  await seed(page, { ready: true })
  await openCanonicalVenueFromList(page)
  await page.getByTestId("canonical-local-signal-open").click()

  const signal = page.getByTestId("ondo-b-local-signal")
  const confirm = signal.getByTestId("local-signal-person-check")
  await expect(page.getByRole("dialog", { name: "Add a Local Signal", exact: true })).toBeVisible()
  await expect(signal).toHaveAttribute("data-signal-stage", "draft")
  await expect(confirm).toHaveText("Confirm for this action")
  await expect(confirm).toBeDisabled()
  await expect(signal).toContainText("Choose one or more. This is your observation, not an official LOCALDATA fact.")
  await expect(signal).toContainText("Tags and post time stay on this device")
  await expect(signal).toContainText("Your note and photo are discarded when this screen closes; nothing is uploaded.")

  const note = signal.getByLabel("Optional local note")
  await note.fill("Order at the counter.")
  await expect(confirm).toBeDisabled()
  await note.fill("")
  await expect(confirm).toBeDisabled()

  await signal.getByTestId("local-signal-photo-input").setInputFiles({
    name: "meal.png",
    mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"),
  })
  await expect(signal).toHaveAttribute("data-photo-stage", "ready")
  await expect(confirm).toBeDisabled()

  await signal.getByRole("button", { name: "Calm right now", exact: true }).click()
  await expect(confirm).toBeEnabled()
  await confirm.click()
  await expect(signal).toHaveAttribute("data-signal-stage", "ready")

  const submit = signal.getByTestId("local-signal-post")
  await expect(submit).toHaveText("Save Local Signal on this device")
  await submit.click()
  await expect(signal).toHaveCount(0)
  await expect(page.getByTestId("ondo-toast")).toContainText("the public Pulse score, count, level, and ranking do not change")
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("ondo-b.device.v1") ?? "{}").localSignalPostedVenueIds)).toEqual([CANONICAL_VENUE_ID])
})

test("My Korea preserves a bilingual save while setup edits persona and preferences and localizes independent ID axes", async ({ page }) => {
  await seed(page, { saved: [CANONICAL_VENUE_ID], preferences: ["classic"] })
  await gotoB(page)
  await expectHydratedShell(page)
  const myKorea = page.getByRole("button", { name: "My Korea", exact: true })
  await expectCenterHit(myKorea)
  await myKorea.click()

  const saved = page.getByTestId(`saved-venue-${CANONICAL_VENUE_ID}`)
  await expect(saved).toContainText("로바")
  await expect(saved).toContainText("Official Korean source name")
  await expect(saved).toContainText("Roba")
  await expect(saved).toContainText("Transliterated for navigation · Generated, not an official English name")

  await page.getByTestId("nav-settings").click()
  const discovery = page.getByTestId("ondo-b-discovery-settings")
  await discovery.locator(":scope > summary").click()
  await expect(discovery.getByRole("button", { name: "Local classics", exact: true })).toHaveAttribute("aria-pressed", "true")
  await discovery.getByRole("button", { name: "Cafés and dessert", exact: true }).click()
  await discovery.getByRole("button", { name: "Vegan", exact: true }).click()
  await expect(discovery).toContainText("These choices shape discovery context only.")
  await expect(discovery).toContainText("They never hide places or claim dietary support that has not been confirmed.")
  await expect.poll(() => page.evaluate(() => {
    const device = JSON.parse(localStorage.getItem("ondo-b.device.v1") ?? "{}")
    return [device.persona, device.discoveryPreferences]
  })).toEqual(["travelling", ["classic", "cafe", "vegan"]])

  await page.getByTestId("ondo-b-onboarding-reset").click()
  const onboarding = page.getByTestId("ondo-onboarding")
  await onboarding.getByRole("button", { name: "Set guest preferences", exact: true }).click()
  await onboarding.getByTestId("persona-preparing").click()
  await onboarding.getByRole("button", { name: "Choose food preferences", exact: true }).click()
  const dietary = onboarding.getByRole("region", { name: "Dietary needs", exact: true })
  await expect(dietary).toBeVisible()
  await onboarding.getByRole("button", { name: "Cafés and dessert", exact: true }).click()
  await onboarding.getByRole("button", { name: "Vegan", exact: true }).click()
  await expect(onboarding).toContainText("Official records do not confirm dietary support.")
  await onboarding.getByTestId("onboarding-finish").click()
  await expect(onboarding).toHaveCount(0)
  await expect.poll(() => page.evaluate(() => {
    const device = JSON.parse(localStorage.getItem("ondo-b.device.v1") ?? "{}")
    return [device.persona, device.discoveryPreferences, device.savedVenueIds]
  })).toEqual(["preparing", ["cafe", "vegan"], [CANONICAL_VENUE_ID]])

  await page.getByTestId("nav-my").click()
  await expect(page.getByTestId(`saved-venue-${CANONICAL_VENUE_ID}`)).toBeVisible()

  await page.getByTestId("nav-id").click()
  let identity = page.getByTestId("ondo-b-traveler-id")
  await expect(identity.getByRole("heading", { name: "Travel Pass", exact: true })).toBeVisible()
  await expect(identity.getByTestId("traveler-id-person")).toContainText("Person does not prove 19+.")
  await expect(identity.getByTestId("traveler-id-age")).toContainText("19+ does not prove identity.")

  await page.getByTestId("nav-settings").click()
  await page.getByTestId("settings-language-control").getByRole("button", { name: "한국어", exact: true }).click()
  await expect(page.getByTestId("nav-id")).toHaveAttribute("aria-label", "ID · 지갑")
  await page.getByTestId("nav-id").click()
  identity = page.getByTestId("ondo-b-traveler-id")
  await expect(identity.getByRole("heading", { name: "여행 패스", exact: true })).toBeVisible()
  await expect(identity.getByTestId("traveler-id-account").getByRole("heading", { name: "계정", exact: true })).toBeVisible()
  await expect(identity.getByTestId("traveler-id-person")).toContainText("본인 확인은 19+를 증명하지 않습니다.")
  await expect(identity.getByTestId("traveler-id-age")).toContainText("19+는 본인을 증명하지 않습니다.")
  await expect(identity.getByTestId("traveler-id-payment").getByRole("heading", { name: "결제", exact: true })).toBeVisible()
})
