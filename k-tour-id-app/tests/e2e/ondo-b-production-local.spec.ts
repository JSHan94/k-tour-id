import { expect, test } from "@playwright/test"
import { CANONICAL_VENUE_ID, expectBRuntimeClean, installBRuntimeGuard } from "../helpers/ondo-b-qa"

const DEVICE_KEY = "ondo-b.device.v1"

async function waitForBHydration(page: import("@playwright/test").Page) {
  const root = page.getByTestId("ondo-b-root")
  await expect(root).toHaveAttribute("data-variant", "B")
  await expect.poll(() => page.getByTestId("ondo-canvas").evaluate((canvas) => getComputedStyle(canvas).display), {
    message: "ONDO B canvas should own its hydrated grid before pointer input",
  }).toBe("grid")
}

async function seedProductionB(page: import("@playwright/test").Page, savedVenueIds: string[] = []) {
  await page.addInitScript(({ key, venueIds }) => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify({
        locale: "en",
        onboarding: "ONB-COMPLETE",
        discoveryPreferences: [],
        savedVenueIds: venueIds,
        privateNotesByVenue: {},
      }))
    }
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({
      onboarding: "ONB-COMPLETE",
      account: "ACC-ACTIVE",
      person: "PER-VERIFIED",
      age: "AGE-VERIFIED",
      paymentKyc: "PKY-VERIFIED",
      gate: { cta: "START_CHECKOUT" },
      tableMembershipById: { "table-seongsu-dinner": "confirmed" },
      reputation: { identity: "verified", visit: "repeat", contribution: "established", meetup: "established" },
      stamps: 10,
      profile: { displayName: "Daniel Kim" },
    }))
  }, { key: DEVICE_KEY, venueIds: savedVenueIds })
}

test.describe("ONDO B production local-device shell", () => {
  test.beforeEach(async ({ page }) => installBRuntimeGuard(page))
  test.afterEach(async ({ page }) => expectBRuntimeClean(page))

  test("B-PROD-E2E-001 synthetic legacy session and QA query cannot alter B-owned surfaces", async ({ page }) => {
    await seedProductionB(page)
    await page.goto("/ondo-b?qa=1&scenario=bridge-failed&profile=failure", { waitUntil: "domcontentloaded" })

    const nav = page.getByTestId("ondo-main-nav")
    await expect(nav.getByTestId("nav-ondo")).toContainText("Explore")
    await expect(nav.getByTestId("nav-my")).toContainText("My Korea")
    await expect(nav.getByTestId("nav-tables")).toContainText("Tables")
    await expect(nav.getByTestId("nav-id")).toContainText("ID · Wallet")
    await expect(nav.getByTestId("nav-settings")).toContainText("Settings")
    for (const testId of ["ondo-gate-overlay", "ondo-after19-layer", "checkout-overlay", "labs-overlay", "ondo-identity-entry", "ondo-trust-panel"]) {
      await expect(page.getByTestId(testId)).toHaveCount(0)
    }

    await nav.getByTestId("nav-my").click()
    await expect(page.getByTestId("ondo-b-saved-entry")).toBeVisible()
    await expect(page.getByTestId("open-labs")).toBeVisible()
    await expect(page.getByTestId("labs-overlay")).toHaveCount(0)
    await expect(page.getByText(/stamp|trust|identity|KYC/i)).toHaveCount(0)
    await nav.getByTestId("nav-tables").click()
    await expect(page.getByTestId("tables-entry")).toBeVisible()
    await nav.getByTestId("nav-id").click()
    await expect(page.getByTestId("ondo-b-traveler-id")).toBeVisible()
    await nav.getByTestId("nav-settings").click()
    await expect(page.getByTestId("ondo-b-settings-entry")).toBeVisible()
    await expect(page.getByText("Daniel Kim")).toHaveCount(0)
  })

  test("B-PROD-E2E-002 a private note persists locally and never creates activity state", async ({ page }) => {
    await seedProductionB(page, [CANONICAL_VENUE_ID])
    await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
    await page.getByTestId("nav-my").click()

    const note = page.getByTestId(`private-note-${CANONICAL_VENUE_ID}`)
    await note.getByRole("textbox").fill("Order at the counter before taking a seat.")
    await note.getByRole("button", { name: "Save private note" }).click()
    await expect(note.getByRole("status")).toContainText("Saved on this device")

    await page.reload({ waitUntil: "domcontentloaded" })
    await page.getByTestId("nav-my").click()
    await expect(page.getByTestId(`private-note-${CANONICAL_VENUE_ID}`).getByRole("textbox"))
      .toHaveValue("Order at the counter before taking a seat.")
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}"), DEVICE_KEY)
    expect(stored).not.toHaveProperty("account")
    expect(stored).not.toHaveProperty("reputation")
    expect(stored).not.toHaveProperty("stamps")
  })

  test("B-PROD-E2E-003 a real storage exception reports failure and keeps the draft", async ({ page }) => {
    await seedProductionB(page, [CANONICAL_VENUE_ID])
    await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
    await page.getByTestId("nav-my").click()
    const note = page.getByTestId(`private-note-${CANONICAL_VENUE_ID}`)
    await note.getByRole("textbox").fill("Keep this draft")
    await page.evaluate((key) => {
      const original = Storage.prototype.setItem
      Storage.prototype.setItem = function (name: string, value: string) {
        if (name === key) throw new DOMException("Quota exceeded", "QuotaExceededError")
        return original.call(this, name, value)
      }
    }, DEVICE_KEY)
    await note.getByRole("button", { name: "Save private note" }).click()
    await expect(note.getByRole("alert")).toContainText("could not be saved")
    await expect(note.getByRole("textbox")).toHaveValue("Keep this draft")
  })

  test("B-PROD-SEC-001 visiting B does not read-rewrite or delete A-owned storage", async ({ browser }) => {
    const page = await browser.newPage()
    const aState = JSON.stringify({ session: { onboarded: true }, ownerMarker: "A-OWNER-BYTE" })
    const malformedALocation = "{A-OWNER-MALFORMED-BYTE"
    await page.addInitScript(({ expectedAState, expectedALocation, deviceKey }) => {
      localStorage.setItem("k-tour-id-state-v7", expectedAState)
      sessionStorage.setItem("k-tour-id-location-v1", expectedALocation)
      localStorage.setItem(deviceKey, JSON.stringify({
        locale: "en",
        onboarding: "ONB-COMPLETE",
        discoveryPreferences: [],
        savedVenueIds: [],
        privateNotesByVenue: {},
      }))
      const originalGetItem = Storage.prototype.getItem
      ;(window as typeof window & { __ondoBAStorageReads?: string[] }).__ondoBAStorageReads = []
      Storage.prototype.getItem = function (key: string) {
        if (key.startsWith("k-tour-id")) {
          ;(window as typeof window & { __ondoBAStorageReads?: string[] }).__ondoBAStorageReads?.push(key)
        }
        return originalGetItem.call(this, key)
      }
    }, { expectedAState: aState, expectedALocation: malformedALocation, deviceKey: DEVICE_KEY })

    await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
    await expect(page.getByTestId("ondo-b-root")).toBeVisible()
    await page.waitForTimeout(250)

    expect(await page.evaluate(() => ({
      aReads: [...((window as typeof window & { __ondoBAStorageReads?: string[] }).__ondoBAStorageReads ?? [])],
      aState: localStorage.getItem("k-tour-id-state-v7"),
      aLocation: sessionStorage.getItem("k-tour-id-location-v1"),
    }))).toEqual({ aState, aLocation: malformedALocation, aReads: [] })
    await page.close()
  })
})

test.describe("ONDO B production security and resilience boundaries", () => {
  test("B-PROD-SEC-002 social metadata rejects forwarded-host and scheme poisoning", async ({ request }) => {
    const response = await request.get("/ondo-b", {
      headers: {
        "x-forwarded-host": "attacker.example",
        "x-forwarded-proto": "javascript",
      },
    })
    expect(response.ok()).toBeTruthy()
    const html = await response.text()
    expect(html).not.toContain("javascript://")
    expect(html).not.toContain("attacker.example")
  })

  test("B-PROD-SEC-002B invalid local ports fail closed without dropping metadata", async ({ request }) => {
    for (const host of ["localhost:65536", "localhost:99999"]) {
      const response = await request.get("/ondo-b", { headers: { host } })
      expect(response.ok()).toBeTruthy()
      const html = await response.text()
      expect(html).toContain("ONDO 溫圖 — Korea Pulse map for Seoul, Busan, and Jeju")
      expect(html).toContain('<link rel="canonical"')
      expect(html).not.toContain("NEXT_HTTP_ERROR_FALLBACK")
      expect(html).not.toContain("attacker.example")
    }
  })

  test("B-PROD-SEC-003 HTML responses apply baseline browser security policy", async ({ request }) => {
    const response = await request.get("/ondo-b")
    expect(response.ok()).toBeTruthy()
    const headers = response.headers()
    expect(headers["content-security-policy"]).toContain("default-src")
    expect(headers["content-security-policy"]).toContain("object-src 'none'")
    expect(headers["content-security-policy"]).toContain("frame-ancestors")
    expect(headers["x-content-type-options"]).toBe("nosniff")
    expect(headers["referrer-policy"]).toBeTruthy()
    expect(headers["permissions-policy"]).toContain("geolocation=(self)")
  })

  test("B-PROD-SEC-004 official-detail failure is announced and directly retryable", async ({ page }) => {
    await seedProductionB(page)
    let failDetail = true
    await page.route("**/api/ondo/venues/**", async (route) => {
      if (failDetail) await route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"temporarily unavailable"}' })
      else await route.continue()
    })
    await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
    await waitForBHydration(page)
    await page.locator("[data-city='seoul']").click()
    await page.getByRole("button", { name: "List", exact: true }).click()
    await page.getByTestId("ondo-b-venue-list").locator("li button").first().click()
    await page.getByTestId("canonical-place-details").click()

    const detail = page.getByTestId("canonical-place-overlay")
    await expect(detail.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "error")
    await expect(detail.getByRole("alert")).toContainText("temporarily unavailable")
    failDetail = false
    await detail.getByRole("button", { name: "Retry official record" }).click()
    await expect(detail.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")
  })

  test("B-PROD-SEC-005 location control discloses external map processing before permission", async ({ page }) => {
    await seedProductionB(page)
    await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
    await page.locator("[data-city='seoul']").click()
    const locate = page.getByTestId("ondo-b-locate")
    await expect(locate).toBeVisible()
    const descriptionIds = (await locate.getAttribute("aria-describedby"))?.trim().split(/\s+/).filter(Boolean) ?? []
    expect(descriptionIds.length).toBeGreaterThan(0)
    const disclosure = await page.locator(descriptionIds.map((id) => `#${id}`).join(",")).allTextContents()
    expect(disclosure.join(" ")).toMatch(/OpenFreeMap/i)
    expect(disclosure.join(" ")).toMatch(/location|위치/i)
  })

  test("B-PROD-SEC-006 directory search bounds pasted input before filtering", async ({ page }) => {
    await seedProductionB(page)
    await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
    await page.locator("[data-city='seoul']").click()
    const search = page.getByTestId("ondo-b-search")
    expect(await search.getAttribute("maxlength")).toBe("120")
    await search.fill("x".repeat(10_000))
    expect((await search.inputValue()).length).toBeLessThanOrEqual(120)
  })

  test("B-PROD-SEC-007 B metadata does not inherit the stale A canonical URL", async ({ request }) => {
    const response = await request.get("/ondo-b")
    expect(response.ok()).toBeTruthy()
    const html = await response.text()
    expect(html).not.toContain("https://k-tour-id.vercel.app")
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1]
    expect(canonical).toMatch(/\/ondo-b\/?$/)
  })
})
