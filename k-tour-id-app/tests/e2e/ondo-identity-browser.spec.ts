import { expect, test, type Page } from "@playwright/test"

type Seed = {
  persona?: "short_term" | "long_term_resident" | "korean_local"
  account?: "ACC-GUEST" | "ACC-ACTIVE"
  person?: "PER-UNVERIFIED" | "PER-VERIFIED"
  age?: "AGE-UNVERIFIED" | "AGE-VERIFIED"
  ageExpiresAt?: string
  after19?: "A19-OFF" | "A19-MANUAL-OFF"
}

async function seedReady(page: Page, seed: Seed = {}, onlyWhenMissing = false) {
  await page.addInitScript(({ next, preserve }) => {
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale: "en", guideSeen: true, autoNight: true, savedVenueIds: [], discoveryPreferences: [] }))
    if (preserve && sessionStorage.getItem("ondo.session.v3")) return
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({
      onboarding: "ONB-COMPLETE",
      persona: next.persona ?? "short_term",
      account: next.account ?? "ACC-GUEST",
      person: next.person ?? "PER-UNVERIFIED",
      age: next.age ?? "AGE-UNVERIFIED",
      ageExpiresAt: next.ageExpiresAt,
      paymentKyc: "PKY-NOT-STARTED",
      after19: next.after19 ?? "A19-OFF",
    }))
  }, { next: seed, preserve: onlyWhenMissing })
}

async function openVenue(page: Page, venueId = "seoul-seongsu-gukbap") {
  await page.goto(`/ondo?venueId=${venueId}`)
  await expect(page.getByTestId("place-peek")).toBeVisible()
  await page.getByTestId("place-details").click()
  await expect(page.getByTestId("place-overlay")).toBeVisible()
}

test("account JIT cancel preserves the unsaved venue and restores focus", async ({ page }) => {
  await seedReady(page)
  await openVenue(page)
  const save = page.getByTestId("venue-save")
  await save.click()

  const gate = page.getByTestId("ondo-gate-overlay")
  await expect(gate).toContainText("Create an account to save this place")
  await expect(page.getByRole("button", { name: "Return to previous screen" })).toBeFocused()
  await page.keyboard.press("Escape")

  await expect(gate).toBeHidden()
  await expect(page.getByTestId("place-overlay")).toBeVisible()
  await expect(save).toBeFocused()
  await expect(page.getByTestId("venue-save")).toHaveAttribute("aria-label", "Save")
})

test("an unfinished account gate survives reload and resumes the original save once", async ({ page }) => {
  await seedReady(page, {}, true)
  await openVenue(page)
  await page.getByTestId("venue-save").click()
  await expect(page.getByTestId("ondo-gate-overlay")).toContainText("Create an account to save this place")

  await page.reload()
  const gate = page.getByTestId("ondo-gate-overlay")
  await expect(gate).toContainText("Create an account to save this place")
  await page.getByRole("button", { name: "Create account · Simulated" }).click()
  await page.getByRole("button", { name: "Complete account simulation" }).click()

  await expect(gate).toBeHidden()
  await expect(page.getByTestId("place-peek")).toBeVisible()
  await page.getByTestId("place-details").click()
  await expect(page.getByTestId("venue-save")).toHaveAttribute("aria-label", "Saved")
  await expect(page.getByTestId("venue-save")).toBeDisabled()
})

test("account and person JIT failures retry, succeed, and return to the visit signal draft", async ({ page }) => {
  await seedReady(page, { persona: "short_term" })
  await openVenue(page)
  await page.getByTestId("venue-local-signal").click()
  const signal = page.getByRole("dialog", { name: "Share a visit signal" })
  await expect(signal).toBeVisible()
  await page.getByRole("button", { name: "Submit signal" }).click()

  const gate = page.getByTestId("ondo-gate-overlay")
  await expect(gate).toContainText("Create an account to continue")
  await page.getByRole("button", { name: "Simulate failure" }).click()
  await expect(page.getByTestId("gate-failure")).toBeVisible()
  await page.getByRole("button", { name: "Try again", exact: true }).click()
  await page.getByRole("button", { name: "Create account · Simulated" }).click()
  await page.getByRole("button", { name: "Complete account simulation" }).click()

  await expect(gate).toContainText("Complete a person check")
  await page.getByRole("button", { name: "Start check" }).click()
  await page.getByRole("button", { name: "Simulate failure" }).click()
  await expect(page.getByTestId("gate-failure")).toBeVisible()
  await page.getByRole("button", { name: "Try again", exact: true }).click()
  await page.getByRole("button", { name: "Start check" }).click()
  await page.getByRole("button", { name: "Complete simulated check" }).click()

  await expect(gate).toBeHidden()
  await expect(signal).toBeVisible()
  await expect.poll(() => page.evaluate(() => {
    const state = JSON.parse(sessionStorage.getItem("ondo.session.v3") ?? "{}")
    return [state.account, state.person, state.age, state.paymentKyc]
  })).toEqual(["ACC-ACTIVE", "PER-VERIFIED", "AGE-UNVERIFIED", "PKY-NOT-STARTED"])
})

test("age JIT cancel, failure, retry, and success are isolated from Payment KYC", async ({ page }) => {
  await seedReady(page, { account: "ACC-ACTIVE", person: "PER-VERIFIED" })
  await page.goto("/ondo")

  await page.getByRole("button", { name: "After 19", exact: true }).click()
  await expect(page.getByRole("button", { name: "Confirm 19+", exact: true })).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog", { name: /Confirm 19\+/ })).toHaveCount(0)

  await page.getByRole("button", { name: "After 19", exact: true }).click()
  await page.getByRole("button", { name: "Confirm 19+", exact: true }).click()
  const gate = page.getByTestId("ondo-gate-overlay")
  await expect(gate).toContainText("Confirm 19+ to continue")
  await expect(gate).not.toContainText("Complete Payment KYC")
  await page.getByRole("button", { name: "Simulate failure" }).click()
  await expect(page.getByTestId("gate-failure")).toBeVisible()
  await page.getByRole("button", { name: "Try again", exact: true }).click()
  await page.getByRole("button", { name: "Start 19+ check simulation" }).click()
  await page.getByRole("button", { name: "Confirm 19+ · Simulated" }).click()

  await expect(gate).toBeHidden()
  await expect(page.getByTestId("after19-auto-banner")).toBeVisible()
  await expect.poll(() => page.evaluate(() => {
    const state = JSON.parse(sessionStorage.getItem("ondo.session.v3") ?? "{}")
    return [state.age, state.paymentKyc, state.after19]
  })).toEqual(["AGE-VERIFIED", "PKY-NOT-STARTED", "A19-ON"])
})

test("After 19 manual-off survives a remount in the same browser session", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-08-19T19:30:00+09:00"))
  await seedReady(page, {
    account: "ACC-ACTIVE",
    person: "PER-VERIFIED",
    age: "AGE-VERIFIED",
    ageExpiresAt: "2026-08-20T19:30:00+09:00",
  }, true)
  await page.goto("/ondo")

  await expect(page.getByTestId("after19-auto-banner")).toBeVisible()
  await page.getByRole("button", { name: "Return to the main map" }).click()
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem("ondo.session.v3") ?? "{}").after19)).toBe("A19-MANUAL-OFF")

  await page.reload()
  await expect(page.getByTestId("after19-auto-banner")).toHaveCount(0)
  await expect(page.getByRole("button", { name: "After 19", exact: true })).toBeVisible()
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem("ondo.session.v3") ?? "{}").after19)).toBe("A19-MANUAL-OFF")
})

test("common Sheet traps focus, closes with Escape, and restores a safe return target", async ({ page }) => {
  await seedReady(page, { account: "ACC-ACTIVE", person: "PER-VERIFIED" })
  await openVenue(page)
  const launcher = page.getByTestId("venue-local-signal")
  await launcher.click()

  const sheet = page.getByRole("dialog", { name: "Share a visit signal" })
  await expect(sheet.getByRole("button", { name: "Close" })).toBeFocused()
  await page.keyboard.press("Shift+Tab")
  await expect.poll(() => sheet.evaluate((dialog) => dialog.contains(document.activeElement))).toBe(true)
  await page.keyboard.press("Escape")
  await expect(sheet).toBeHidden()
  await expect(page.getByTestId("place-peek")).toBeVisible()
  await expect(page.getByTestId("place-details")).toBeFocused()
})
