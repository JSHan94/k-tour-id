import { expect, test, type Page } from "@playwright/test"

async function seedPrepared(page: Page, overrides: Record<string, unknown> = {}) {
  await page.addInitScript((next) => {
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale: "en", guideSeen: true, autoNight: true, savedVenueIds: [], discoveryPreferences: [] }))
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({
      onboarding: "ONB-COMPLETE",
      persona: "short_term",
      account: "ACC-ACTIVE",
      person: "PER-VERIFIED",
      age: "AGE-VERIFIED",
      ageExpiresAt: "2026-08-20T20:00:00+09:00",
      paymentKyc: "PKY-VERIFIED",
      tableMembershipById: {},
      stamps: 9,
      ...next,
    }))
    sessionStorage.removeItem("ondo.chat.v2")
  }, overrides)
}

async function openTable(page: Page, query = "") {
  await page.goto(`/ondo${query}`)
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" })
  await page.getByRole("button", { name: "Tables", exact: true }).click()
  await page.locator("[data-table-id='table-seongsu-dinner']").first().click()
  await expect(page.getByRole("dialog", { name: "First gukbap together" })).toBeVisible()
}

test("@core FL-003 Table request visibly resolves, image chat works, and private feedback stays separate", async ({ page }) => {
  await seedPrepared(page)
  await openTable(page)

  await page.getByTestId("table-join").click()
  await expect(page.getByTestId("table-requesting")).toBeVisible()
  await expect(page.getByRole("button", { name: "Open chat" })).toBeVisible()
  await page.getByRole("button", { name: "Open chat" }).click()

  const chat = page.getByTestId("table-chat")
  await expect(chat).toHaveAttribute("data-chat-access", "CHA-OPEN")
  await page.locator("input[type='file']").setInputFiles({ name: "meal.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64") })
  await page.getByRole("button", { name: "Send photo" }).click()
  await expect(page.locator("[data-message-status='MSG-SENT']")).toBeVisible()

  await page.getByTestId("table-check-in").click()
  await page.getByTestId("table-finish-meal").click()
  await expect(page.getByTestId("table-feedback")).toBeVisible()
  await page.getByTestId("feedback-helpful-yes").click()
  await page.getByTestId("feedback-respectful-yes").click()
  await page.getByLabel("Private note · Optional").fill("Kept on this device for the preview.")
  await page.getByTestId("feedback-submit").click()
  await expect(chat).toContainText("Feedback recorded. No overall score was created.")
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem("ondo.session.v3") ?? "{}").reputation)).toMatchObject({ meetup: "reliable", contribution: "helpful" })
})

test("FL-003 report requires a reason, supports blocking, returns a receipt, and leave can be cancelled", async ({ page }) => {
  await seedPrepared(page, { tableMembershipById: { "table-seongsu-dinner": "confirmed" } })
  await openTable(page)
  const openChat = page.getByRole("button", { name: "Open chat" })
  if (await openChat.count()) await openChat.click()
  await expect(page.getByTestId("table-chat")).toBeVisible()

  await page.getByTestId("table-report").click()
  const report = page.getByRole("alertdialog")
  await expect(report.getByRole("button", { name: "Record report" })).toBeDisabled()
  await page.getByTestId("report-reason").selectOption("harassment")
  await page.getByTestId("report-block").check()
  await report.getByRole("button", { name: "Record report" }).click()
  await expect(page.getByTestId("table-chat")).toContainText("Report receipt")

  await page.getByTestId("table-leave").click()
  await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click()
  await expect(page.getByTestId("table-chat")).toBeVisible()
})

test("FL-003 join failure is visible and retryable without unlocking chat", async ({ page }) => {
  await seedPrepared(page)
  await openTable(page, "?scenario=table-network")
  await page.getByTestId("table-join").click()
  await expect(page.getByTestId("table-requesting")).toBeVisible()
  await expect(page.getByText("A connection problem interrupted the request.")).toBeVisible()
  await expect(page.getByTestId("table-join-retry")).toBeVisible()
  await expect(page.getByRole("button", { name: "Open chat" })).toHaveCount(0)
})

test("FL-003 an interrupted sending message recovers as retryable after reload", async ({ page }) => {
  await seedPrepared(page, { tableMembershipById: { "table-seongsu-dinner": "confirmed" } })
  await page.addInitScript(() => {
    sessionStorage.setItem("ondo.chat.v2", JSON.stringify({
      "table-seongsu-dinner": [{ id: "text-interrupted", kind: "text", text: "Still there?", status: "MSG-SENDING" }],
    }))
  })
  await openTable(page)
  await page.getByRole("button", { name: "Open chat" }).click()

  const recovered = page.locator("[data-message-status='MSG-FAILED']").filter({ hasText: "Still there?" })
  await expect(recovered).toBeVisible()
  await recovered.getByRole("button", { name: "Try again" }).click()
  await expect(page.locator("[data-message-status='MSG-SENT']").filter({ hasText: "Still there?" })).toBeVisible()
})

test("@core FL-012 Local Signal accepts only Visit and Contribution, with retry on failure", async ({ page }) => {
  await seedPrepared(page)
  await page.goto("/ondo?venueId=seoul-seongsu-gukbap")
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" })
  await page.getByTestId("place-details").click()
  await page.getByTestId("venue-local-signal").click()
  await page.getByLabel("Helpful note · Optional").fill("Order at the counter before choosing a seat.")
  await page.getByTestId("local-signal-submit").click()
  const signal = page.getByTestId("local-signal-overlay")
  await expect(signal).toHaveAttribute("data-signal-status", "submitted")
  await expect(signal).toHaveAttribute("data-signal-invariants", "preserved")
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem("ondo.session.v3") ?? "{}").reputation)).toMatchObject({ visit: "recent", contribution: "helpful", meetup: "new" })
})

test("FL-012 Local Signal failure keeps the draft and exposes retry", async ({ page }) => {
  await seedPrepared(page)
  await page.goto("/ondo?venueId=seoul-seongsu-gukbap&scenario=local-signal-fail")
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" })
  await page.getByTestId("place-details").click()
  await page.getByTestId("venue-local-signal").click()
  await page.getByLabel("Helpful note · Optional").fill("Draft survives.")
  await page.getByTestId("local-signal-submit").click()
  await expect(page.getByTestId("local-signal-overlay")).toHaveAttribute("data-signal-status", "failed")
  await expect(page.getByLabel("Helpful note · Optional")).toHaveValue("Draft survives.")
  await expect(page.getByTestId("local-signal-submit")).toHaveText("Try again")
})
