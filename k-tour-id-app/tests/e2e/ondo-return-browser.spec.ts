import { expect, test, type Page } from "@playwright/test"

const runtimeFailures = new WeakMap<Page, string[]>()

test.beforeEach(async ({ page }) => {
  const failures: string[] = []
  runtimeFailures.set(page, failures)
  page.on("console", (message) => { if (message.type() === "error") failures.push(`console: ${message.text()}`) })
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`))
})

test.afterEach(async ({ page }) => {
  expect(runtimeFailures.get(page) ?? []).toEqual([])
})

async function seed(page: Page, session: Record<string, unknown> = {}, local: Record<string, unknown> = {}) {
  await page.addInitScript(({ nextSession, nextLocal }) => {
    if (!localStorage.getItem("ondo.preferences.v3")) {
      localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale: "en", guideSeen: true, autoNight: true, savedVenueIds: [], discoveryPreferences: [], ...nextLocal }))
    }
    if (!sessionStorage.getItem("ondo.session.v3")) {
      sessionStorage.setItem("ondo.session.v3", JSON.stringify({
        onboarding: "ONB-COMPLETE",
        persona: "short_term",
        account: "ACC-GUEST",
        person: "PER-UNVERIFIED",
        age: "AGE-UNVERIFIED",
        paymentKyc: "PKY-NOT-STARTED",
        stamps: 9,
        ...nextSession,
      }))
    }
  }, { nextSession: session, nextLocal: local })
  await page.addInitScript(() => {
    window.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style")
      style.textContent = "nextjs-portal { display: none !important; }"
      document.head.append(style)
    }, { once: true })
  })
}

async function finishAccountGate(page: Page) {
  await page.getByRole("button", { name: "Create account · Simulated" }).click()
  await page.getByRole("button", { name: "Complete account simulation" }).click()
}

async function finishPersonGate(page: Page) {
  await page.getByRole("button", { name: "Start check" }).click()
  await page.getByRole("button", { name: "Complete simulated check" }).click()
}

async function finishAgeGate(page: Page) {
  await page.getByRole("button", { name: "Start 19+ check simulation" }).click()
  await page.getByRole("button", { name: "Confirm 19+ · Simulated" }).click()
}

test("@core Table JIT completes Account, Person and 19+ then resumes the original join", async ({ page }) => {
  await seed(page)
  await page.goto("/ondo")
  await page.getByRole("button", { name: "Tables", exact: true }).click()
  await page.getByRole("region", { name: "Tables by place" }).locator("[data-table-id='table-euljiro-night']").click()
  await page.getByTestId("table-join").click()

  const gate = page.getByTestId("ondo-gate-overlay")
  await expect(gate).toContainText("Account")
  await finishAccountGate(page)
  await expect(gate).toContainText("Complete a person check")
  await finishPersonGate(page)
  await expect(gate).toContainText("Confirm 19+ to continue")
  await finishAgeGate(page)

  await expect(gate).toBeHidden()
  await expect(page.getByTestId("table-requesting")).toBeVisible()
  await expect(page.getByRole("button", { name: "Open chat" })).toBeVisible()
  await expect.poll(() => page.evaluate(() => {
    const current = JSON.parse(sessionStorage.getItem("ondo.session.v3") ?? "{}")
    return [current.account, current.person, current.age, current.tableMembershipById?.["table-euljiro-night"]]
  })).toEqual(["ACC-ACTIVE", "PER-VERIFIED", "AGE-VERIFIED", "confirmed"])
})

test("@core Payment KYC returns to the same checkout and can complete a simulated receipt", async ({ page }) => {
  await seed(page, { account: "ACC-ACTIVE", person: "PER-VERIFIED" })
  await page.goto("/ondo?venueId=seoul-seongsu-gukbap")
  await page.getByTestId("place-details").click()
  await page.getByTestId("venue-checkout").click()
  await page.getByTestId("checkout-start").click()

  const gate = page.getByTestId("ondo-gate-overlay")
  await expect(gate).toContainText("Complete Payment KYC")
  await page.getByRole("button", { name: "Start Payment KYC simulation" }).click()
  await page.getByRole("button", { name: "Complete Payment KYC · Simulated" }).click()

  await expect(gate).toBeHidden()
  await expect(page.getByTestId("checkout-overlay")).toBeVisible()
  await page.getByTestId("checkout-start").click()
  await page.getByTestId("checkout-confirm").click()
  await expect(page.getByTestId("checkout-receipt")).toContainText("Preview reference · SIM-SG01")
  await expect(page.getByTestId("checkout-overlay")).toHaveAttribute("data-stamp-count", "9")
})

test("saved places persist through reload and return from My Korea to the venue", async ({ page }) => {
  await seed(page, { account: "ACC-ACTIVE" })
  await page.goto("/ondo?venueId=seoul-seongsu-gukbap")
  await page.getByTestId("place-details").click()
  await page.getByTestId("venue-save").click()
  await expect(page.getByTestId("venue-save")).toHaveAttribute("aria-label", "Saved")

  await page.reload()
  await page.getByRole("button", { name: "My Korea", exact: true }).click()
  const saved = page.getByTestId("saved-venue-seoul-seongsu-gukbap")
  await expect(saved).toBeVisible()
  await saved.click()
  await expect(page.getByTestId("place-peek")).toContainText("Seongsu Dwaeji Gukbap")
})

test("Labs acknowledgement, signer and quote states survive a session reload", async ({ page }) => {
  await seed(page, { account: "ACC-ACTIVE", person: "PER-VERIFIED", paymentKyc: "PKY-VERIFIED", stamps: 10 })
  await page.goto("/ondo")
  await page.getByRole("button", { name: "My Korea", exact: true }).click()
  await page.getByTestId("open-labs-milestone").click()
  await page.getByTestId("labs-acknowledge").click()
  await page.getByTestId("labs-connect-wallet").click()
  await page.getByTestId("labs-bridge-quote").click()
  await expect(page.getByTestId("labs-overlay")).toHaveAttribute("data-bridge-state", "BRG-QUOTED")

  await page.reload()
  await page.getByRole("button", { name: "My Korea", exact: true }).click()
  await page.getByTestId("open-labs-milestone").click()
  await expect(page.getByTestId("labs-acknowledge")).toHaveCount(0)
  await expect(page.getByTestId("labs-overlay")).toHaveAttribute("data-wallet-state", "WAL-READY")
  await expect(page.getByTestId("labs-overlay")).toHaveAttribute("data-bridge-state", "BRG-QUOTED")
})
