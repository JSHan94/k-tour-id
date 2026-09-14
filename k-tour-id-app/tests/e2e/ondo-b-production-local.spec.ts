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

async function seedProductionB(page: import("@playwright/test").Page, savedVenueIds: string[] = [], privateNotesByVenue: Record<string, string> = {}, locale: "en" | "ko" | "ja" = "en", receiptState: "none" | "paid" = "none") {
  await page.addInitScript(({ key, venueIds, notes, language, receipt, receiptVenueId }) => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify({
        locale: language,
        onboarding: "ONB-COMPLETE",
        discoveryPreferences: [],
        savedVenueIds: venueIds,
        privateNotesByVenue: notes,
        commerceLocalBoundarySeen: true,
        commerceReceipts: receipt === "paid" ? [{
          executionTruth: "FIXTURE_REVIEW",
          provenanceTruth: "SIMULATED",
          receiptId: "ONDO-LOCAL-20260825-001",
          refundReceiptId: null,
          offerId: "meal-offer-gukbap",
          venueId: receiptVenueId,
          status: "paid",
          paidOOKRW: 19,
          benefitOOKRW: 3,
          balanceOOKRW: 41,
        }] : [],
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
  }, { key: DEVICE_KEY, venueIds: savedVenueIds, notes: privateNotesByVenue, language: locale, receipt: receiptState, receiptVenueId: CANONICAL_VENUE_ID })
}

test.describe("ONDO B production local-device shell", () => {
  test.beforeEach(async ({ page }) => installBRuntimeGuard(page))
  test.afterEach(async ({ page }) => expectBRuntimeClean(page))

  test("B-PROD-E2E-001 synthetic legacy session and QA query cannot alter B-owned surfaces", async ({ page }) => {
    await seedProductionB(page)
    await page.goto("/?qa=1&scenario=bridge-failed&profile=failure", { waitUntil: "domcontentloaded" })

    const nav = page.getByTestId("ondo-main-nav")
    await expect(nav.getByTestId("nav-ondo")).toHaveAccessibleName("Explore")
    await expect(nav.getByTestId("nav-my")).toHaveAccessibleName("My Korea · saved and recent places")
    await expect(nav.getByTestId("nav-tables")).toHaveAccessibleName("Tables")
    await expect(nav.getByTestId("nav-id")).toHaveAccessibleName("K-Tour ID · ID and Wallet")
    await expect(nav.getByTestId("nav-settings")).toHaveAccessibleName("Settings")
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
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await page.getByTestId("nav-my").click()

    const note = page.getByTestId(`private-note-${CANONICAL_VENUE_ID}`)
    await expect(note.getByRole("textbox")).toHaveCount(0)
    await note.getByRole("button", { name: "Add private note: 로바" }).click()
    await note.getByRole("textbox").fill("Order at the counter before taking a seat.")
    await note.getByRole("button", { name: "Save private note" }).click()
    await expect(note.getByRole("status")).toContainText("Saved on this device")

    await page.reload({ waitUntil: "domcontentloaded" })
    await page.getByTestId("nav-my").click()
    await page.getByTestId(`private-note-${CANONICAL_VENUE_ID}`).getByRole("button", { name: "Edit private note: 로바" }).click()
    await expect(page.getByTestId(`private-note-${CANONICAL_VENUE_ID}`).getByRole("textbox"))
      .toHaveValue("Order at the counter before taking a seat.")
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}"), DEVICE_KEY)
    expect(stored).not.toHaveProperty("account")
    expect(stored).not.toHaveProperty("reputation")
    expect(stored).not.toHaveProperty("stamps")
  })

  test("B-PROD-E2E-003 a real storage exception reports failure and keeps the draft", async ({ page }) => {
    await seedProductionB(page, [CANONICAL_VENUE_ID])
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await page.getByTestId("nav-my").click()
    const note = page.getByTestId(`private-note-${CANONICAL_VENUE_ID}`)
    await note.getByRole("button", { name: "Add private note: 로바" }).click()
    await note.getByRole("textbox").fill("Keep this draft")
    await page.evaluate((key) => {
      const original = Storage.prototype.setItem
      Storage.prototype.setItem = function (name: string, value: string) {
        if (name === key) throw new DOMException("Quota exceeded", "QuotaExceededError")
        return original.call(this, name, value)
      }
    }, DEVICE_KEY)
    await note.getByRole("button", { name: "Save private note" }).click()
    await expect(note.getByRole("alert")).toContainText("Couldn’t save")
    await expect(note.getByRole("textbox")).toHaveValue("Keep this draft")
  })

  test("B-PROD-E2E-003B removing a saved place protects its exact private note, reports failure, and returns focus", async ({ page }) => {
    const exactNote = "Keep the window-seat ordering note."
    await seedProductionB(page, [CANONICAL_VENUE_ID], { [CANONICAL_VENUE_ID]: exactNote })
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await page.getByTestId("nav-my").click()

    const card = page.getByTestId(`saved-card-${CANONICAL_VENUE_ID}`)
    const remove = card.getByRole("button", { name: "Remove from saved: 로바" })
    await remove.click()
    const dialog = page.getByTestId("saved-remove-dialog")
    await expect(dialog).toContainText("로바")
    await expect(dialog).toContainText("Only this saved bookmark will be removed")
    await expect(dialog).toContainText("Your private note and activity will stay")
    await expect(dialog.getByRole("button", { name: "Remove from saved" })).toBeVisible()
    await expect(dialog.getByRole("button", { name: "Keep it" })).toBeFocused()
    await dialog.getByRole("button", { name: "Keep it" }).click()
    await expect(remove).toBeFocused()
    await expect(card).toBeVisible()

    await page.evaluate((key) => {
      const original = Storage.prototype.setItem
      ;(window as typeof window & { __restoreOndoDeviceWrite?: () => void }).__restoreOndoDeviceWrite = () => { Storage.prototype.setItem = original }
      Storage.prototype.setItem = function (name: string, value: string) {
        if (name === key) throw new DOMException("Quota exceeded", "QuotaExceededError")
        return original.call(this, name, value)
      }
    }, DEVICE_KEY)
    await remove.click()
    await dialog.getByRole("button", { name: "Remove from saved" }).click()
    await expect(dialog.getByRole("alert")).toContainText("Nothing changed")
    await expect(dialog.getByRole("button", { name: "Remove from saved" })).toBeFocused()
    await expect(card).toBeVisible()

    await dialog.getByRole("button", { name: "Keep it" }).click()
    await card.getByRole("button", { name: "Edit private note: 로바" }).click()
    await expect(card.getByRole("textbox", { name: "Private note: 로바" })).toHaveValue(exactNote)
    await card.getByRole("button", { name: "Cancel" }).click()

    await page.evaluate(() => (window as typeof window & { __restoreOndoDeviceWrite?: () => void }).__restoreOndoDeviceWrite?.())
    await remove.click()
    await dialog.getByRole("button", { name: "Remove from saved" }).click()
    await expect(dialog).toHaveCount(0)
    await expect(card).toHaveCount(0)
    await expect(page.getByRole("heading", { name: "Saved places" })).toBeFocused()

    const afterUnsave = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}"), DEVICE_KEY)
    expect(afterUnsave.savedVenueIds).not.toContain(CANONICAL_VENUE_ID)
    expect(afterUnsave.privateNotesByVenue[CANONICAL_VENUE_ID]).toBe(exactNote)

    await page.evaluate(() => {
      sessionStorage.setItem("ondo-b.account.v1", JSON.stringify({ account: "ACC-ACTIVE", returnTo: null }))
    })
    await page.goto(`/?city=seoul&view=list&venueId=${CANONICAL_VENUE_ID}&detail=1`, { waitUntil: "domcontentloaded" })
    const detail = page.getByTestId("canonical-place-overlay")
    await expect(detail).toBeVisible({ timeout: 15_000 })
    await expect(detail.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", /ready|error/)
    await detail.getByTestId("canonical-venue-save").click()
    await expect(detail).toHaveAttribute("data-save-state", "SAV-SAVED")
    await detail.getByRole("button", { name: "Close place", exact: true }).click()
    await page.getByTestId("nav-my").click()
    const restoredCard = page.getByTestId(`saved-card-${CANONICAL_VENUE_ID}`)
    await restoredCard.getByRole("button", { name: "Edit private note: 로바" }).click()
    await expect(restoredCard.getByRole("textbox", { name: "Private note: 로바" })).toHaveValue(exactNote)
  })

  test("B-PROD-E2E-003C Japanese progressive notes and removal reflow at 320/390/430 and 200% text", async ({ page }) => {
    await seedProductionB(page, [CANONICAL_VENUE_ID], { [CANONICAL_VENUE_ID]: "窓側の注文メモを残す。" }, "ja")
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await page.getByTestId("nav-my").click()
    const card = page.getByTestId(`saved-card-${CANONICAL_VENUE_ID}`)
    const edit = card.getByRole("button", { name: /プライベートメモを編集:/ })
    const remove = card.getByRole("button", { name: /保存から削除:/ })

    for (const width of [320, 390, 430]) {
      await page.setViewportSize({ width, height: width === 320 ? 720 : 844 })
      await expect(edit).toBeVisible()
      for (const control of [edit, remove]) {
        const box = await control.boundingBox()
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
        expect(box?.width ?? 0).toBeGreaterThanOrEqual(44)
      }
      const widthReceipt = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
      expect(widthReceipt.scroll).toBeLessThanOrEqual(widthReceipt.client + 1)
    }

    await page.evaluate(() => {
      document.documentElement.style.setProperty("-webkit-text-size-adjust", "200%")
      document.documentElement.style.setProperty("text-size-adjust", "200%")
    })
    await edit.click()
    const note = card.getByRole("textbox", { name: /プライベートメモ:/ })
    await expect(note).toBeFocused()
    for (const control of await card.locator("button:visible").all()) {
      expect((await control.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44)
    }
    const editorWidth = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
    expect(editorWidth.scroll).toBeLessThanOrEqual(editorWidth.client + 1)
    await card.getByRole("button", { name: "キャンセル" }).click()
    await expect(edit).toBeFocused()

    await remove.click()
    const dialog = page.getByTestId("saved-remove-dialog")
    await expect(dialog).toContainText("保存したブックマークだけを削除します")
    await expect(dialog).toContainText("プライベートメモとアクティビティは残ります")
    await expect(dialog.getByRole("button", { name: "保存から削除" })).toBeVisible()
    for (const control of await dialog.getByRole("button").all()) {
      expect((await control.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44)
    }
    const dialogWidth = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
    expect(dialogWidth.scroll).toBeLessThanOrEqual(dialogWidth.client + 1)
    await dialog.getByRole("button", { name: "残す" }).click()
    await expect(remove).toBeFocused()
  })

  test("B-PROD-E2E-003D reload quarantines a stored review receipt instead of presenting it as live activity", async ({ page }) => {
    await seedProductionB(page, [], {}, "en", "paid")
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await page.getByTestId("nav-my").click()
    await expect(page.getByTestId("my-korea-receipts")).toHaveCount(0)
    await page.getByTestId("nav-id").click()
    await expect(page.getByTestId("wallet-balance")).toHaveAttribute("data-wallet-state", "disconnected")
    await expect(page.getByTestId("wallet-activity-receipt")).toHaveCount(0)
    await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}").commerceReceipts ?? [], DEVICE_KEY)).toEqual([])
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

    await page.goto("/", { waitUntil: "domcontentloaded" })
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
    const response = await request.get("/", {
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
      const response = await request.get("/", { headers: { host } })
      expect(response.ok()).toBeTruthy()
      const html = await response.text()
      expect(html).toContain("K-TOUR ID | ONDO 溫圖")
      expect(html).toContain('<link rel="canonical"')
      expect(html).not.toContain("NEXT_HTTP_ERROR_FALLBACK")
      expect(html).not.toContain("attacker.example")
    }
  })

  test("B-PROD-SEC-003 HTML responses apply baseline browser security policy", async ({ request }) => {
    const response = await request.get("/")
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
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await waitForBHydration(page)
    await page.locator("[data-city='seoul']").click()
    await page.getByRole("button", { name: "List", exact: true }).click()
    await page.getByTestId("ondo-b-venue-list").locator("li button").first().click()
    await page.getByTestId("canonical-place-details").click()

    const detail = page.getByTestId("canonical-place-overlay")
    await expect(detail.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "error")
    await expect(detail.getByRole("alert")).toContainText("temporarily unavailable")
    failDetail = false
    await detail.getByRole("button", { name: "Retry place details" }).click()
    await expect(detail.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")
  })

  test("B-PROD-SEC-005 location control discloses external map processing before permission", async ({ page }) => {
    await seedProductionB(page)
    await page.goto("/", { waitUntil: "domcontentloaded" })
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
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await page.locator("[data-city='seoul']").click()
    const search = page.getByTestId("ondo-b-search")
    expect(await search.getAttribute("maxlength")).toBe("120")
    await search.fill("x".repeat(10_000))
    expect((await search.inputValue()).length).toBeLessThanOrEqual(120)
  })

  test("B-PROD-SEC-007 B metadata does not inherit the stale A canonical URL", async ({ request }) => {
    const response = await request.get("/")
    expect(response.ok()).toBeTruthy()
    const html = await response.text()
    expect(html).not.toContain("https://k-tour-id.vercel.app")
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1]
    expect(canonical).toBeTruthy()
    expect(new URL(canonical!).pathname).toBe("/")
  })

  test("B-PROD-ROUTE-008 legacy /ondo-b permanently redirects to / and preserves only discovery context", async ({ request }) => {
    const response = await request.get("/ondo-b?city=seoul&view=list&token=private", { maxRedirects: 0 })
    expect(response.status()).toBe(308)
    const location = new URL(response.headers().location, "http://ondo.local")
    expect(location.pathname).toBe("/")
    expect(Object.fromEntries(location.searchParams)).toEqual({ city: "seoul", view: "list" })
  })
})
