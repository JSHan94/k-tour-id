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

async function seedLabs(page: Page, scenario = "") {
  await page.addInitScript(() => {
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale: "en", guideSeen: true, autoNight: true, savedVenueIds: [], discoveryPreferences: [] }))
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({
      onboarding: "ONB-COMPLETE",
      persona: "short_term",
      account: "ACC-ACTIVE",
      person: "PER-VERIFIED",
      age: "AGE-VERIFIED",
      ageExpiresAt: "2026-08-20T20:00:00+09:00",
      paymentKyc: "PKY-VERIFIED",
      stamps: 10,
    }))
    sessionStorage.removeItem("ondo.labs.v2")
  })
  await page.goto(`/ondo${scenario ? `?scenario=${scenario}` : ""}`)
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" })
  await page.getByRole("button", { name: "My Korea", exact: true }).click()
  await page.getByTestId("open-labs-milestone").click()
  await page.getByTestId("labs-acknowledge").click()
  await expect(page.getByTestId("labs-overlay")).toBeVisible()
}

async function connectSigner(page: Page) {
  await page.getByTestId("labs-connect-wallet").click()
  await expect(page.getByTestId("labs-overlay")).toHaveAttribute("data-wallet-state", "WAL-READY")
}

test("@core FL-016/017/018 Labs shows ordered bridge receipt, trait retry, and opt-in badge without real assets", async ({ page }) => {
  await seedLabs(page)
  await connectSigner(page)
  await page.getByTestId("labs-bridge-quote").click()
  await page.getByTestId("labs-bridge-confirm").click()
  await page.getByTestId("labs-bridge-submit").click()
  for (let index = 0; index < 3; index += 1) await page.getByTestId("labs-bridge-advance").click()
  await expect(page.getByTestId("labs-overlay")).toHaveAttribute("data-bridge-state", "BRG-SIMULATED-SUCCESS")
  await expect(page.getByTestId("labs-bridge-receipt")).toContainText("Projected before and after · Read only")
  await expect(page.getByTestId("labs-bridge-receipt")).toContainText("Actual balances and transactions were not changed.")

  await page.getByTestId("trait-retry-offer-foreign-card").click()
  await expect(page.locator("[data-trait-state='eligible']").first()).toBeVisible()
  await page.getByLabel("I consent to the public badge simulation.").check()
  await page.getByTestId("labs-badge-mint").click()
  await expect(page.getByTestId("labs-overlay")).toHaveAttribute("data-mint-state", "NFT-MINTED")
  await expect(page.getByTestId("labs-overlay")).toContainText("No real NFT or transaction was created.")
})

test("FL-017 bridge quote expiry and cancellation submit nothing", async ({ page }) => {
  await seedLabs(page, "bridge-expired")
  await connectSigner(page)
  await page.getByTestId("labs-bridge-quote").click()
  await expect(page.getByTestId("labs-quote")).toContainText("Quote expired")
  await page.getByTestId("labs-bridge-confirm").click()
  await expect(page.getByTestId("labs-overlay")).toHaveAttribute("data-bridge-state", "BRG-EXPIRED")
  await expect(page.getByTestId("labs-overlay")).toContainText("nothing was submitted")

  await page.getByTestId("labs-bridge-quote").click()
  await page.getByTestId("labs-bridge-cancel").click()
  await expect(page.getByTestId("labs-overlay")).toHaveAttribute("data-bridge-state", "BRG-CANCELLED")
  await expect(page.getByTestId("labs-bridge-receipt")).toHaveCount(0)
})

test("FL-017 bridge failure preserves the last phase and exposes a fresh quote", async ({ page }) => {
  await seedLabs(page, "bridge-failed")
  await connectSigner(page)
  await page.getByTestId("labs-bridge-quote").click()
  await page.getByTestId("labs-bridge-confirm").click()
  await page.getByTestId("labs-bridge-submit").click()
  await page.getByTestId("labs-bridge-advance").click()
  await page.getByTestId("labs-bridge-advance").click()
  await expect(page.getByTestId("labs-overlay")).toHaveAttribute("data-bridge-state", "BRG-FAILED")
  await expect(page.getByTestId("labs-overlay")).toHaveAttribute("data-bridge-phase", "source_confirmed")
  await expect(page.getByTestId("labs-bridge-quote")).toBeVisible()
})
