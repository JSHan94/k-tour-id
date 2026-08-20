import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const TABLE_ID = "table-seongsu-dinner"
const CANONICAL_VENUE_ID = "mois-0021cd596bc5b2a922ad"

async function settleFocusFrames(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  }))
}

async function seed(page: Page, locale: "en" | "ko", options: { membership?: "confirmed"; person?: "PER-VERIFIED" | "PER-UNVERIFIED" } = {}) {
  await page.addInitScript(() => {
    window.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style")
      style.textContent = "nextjs-portal { display: none !important; }"
      document.head.append(style)
    }, { once: true })
  })
  await page.goto("/ondo-b")
  await page.evaluate(({ locale, membership, person, tableId }) => {
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale, guideSeen: true, autoNight: true, savedVenueIds: [], discoveryPreferences: [] }))
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({
      onboarding: "ONB-COMPLETE",
      persona: "short_term",
      account: "ACC-ACTIVE",
      person,
      age: "AGE-VERIFIED",
      ageExpiresAt: "2026-08-21T20:00:00+09:00",
      paymentKyc: "PKY-VERIFIED",
      tableMembershipById: membership ? { [tableId]: membership } : {},
      stamps: 9,
    }))
    sessionStorage.removeItem("ondo.chat.v2")
    sessionStorage.removeItem("ondo.table-outcomes.v2")
  }, { locale, membership: options.membership, person: options.person ?? "PER-VERIFIED", tableId: TABLE_ID })
  await page.reload()
  await expect(page.getByRole("dialog", { name: /ONDO onboarding|ONDO 온보딩/ })).toHaveCount(0)
}

async function openJoinedChat(page: Page, locale: "en" | "ko" = "en") {
  if (await page.getByTestId("table-open-chat").isVisible()) {
    await page.getByTestId("table-open-chat").click()
  } else if (!await page.getByTestId("table-chat").isVisible()) {
    await page.getByRole("button", { name: locale === "ko" ? "모임" : "Tables", exact: true }).click()
    await page.getByRole("region", { name: /Joined|참여 중/ }).locator(`[data-table-id='${TABLE_ID}']`).click()
  }
  await expect(page.getByTestId("table-chat")).toBeVisible()
}

async function openSignal(page: Page, query = "") {
  await page.goto(`/ondo-b${query ? `?${query}&` : "?"}venueId=${CANONICAL_VENUE_ID}`)
  await page.getByTestId("canonical-place-details").click()
  await page.getByTestId("canonical-venue-signal").click()
  await expect(page.getByTestId("local-signal-overlay")).toBeVisible()
}

for (const locale of ["en", "ko"] as const) {
  test(`SLEEK-R2 D2-001 Chat Close returns to the exact Table and Open chat focus (${locale})`, async ({ page }) => {
    test.setTimeout(90_000)
    await seed(page, locale, { membership: "confirmed" })
    const closeName = locale === "ko" ? "닫기" : "Close"
    const openName = locale === "ko" ? "대화 열기" : "Open chat"
    for (const activation of ["click", "Enter", "Space"] as const) {
      await openJoinedChat(page, locale)
      const close = page.getByTestId("ondo-sheet").getByRole("button", { name: closeName })
      if (activation === "click") await close.click()
      else await close.press(activation)
      await expect(page.getByTestId("table-chat")).toHaveCount(0)
      await expect(page.locator(`[data-table-membership='TMB-CONFIRMED']`)).toBeVisible()
      await expect(page.getByRole("button", { name: openName })).toBeFocused()
    }
  })

  test(`SLEEK-R2 D5-001/004 and D4-003/004 Table truth is unambiguous (${locale})`, async ({ page }) => {
    test.setTimeout(90_000)
    await seed(page, locale, { membership: "confirmed", person: "PER-UNVERIFIED" })
    await page.getByRole("button", { name: locale === "ko" ? "모임" : "Tables", exact: true }).click()
    const tables = page.getByTestId("tables-entry")
    const truth = page.getByTestId("tables-truth-notice")
    if (locale === "ko") {
      await expect(truth).toContainText("2026년 8월 19일 오후 6시 KST 기준")
      await expect(truth).toContainText("현재 정보가 아닌 고정 예시")
    } else {
      await expect(truth).toContainText("Fixed at Aug 19, 2026, 6:00 PM KST")
      await expect(truth).toContainText("not current availability")
      await expect(truth).not.toContainText("fixture")
    }
    await expect(tables.locator(`[data-table-id='${TABLE_ID}']`).first()).toContainText("2026")
    await expect(tables.locator(`[data-table-id='${TABLE_ID}']`).first()).toContainText("KST")
    await tables.locator(`[data-table-id='${TABLE_ID}']`).first().click()
    const chat = page.getByTestId("table-chat")
    await expect(chat).toContainText(locale === "ko"
      ? "로컬 미리보기 참여자만 · 참가자 신원은 확인되지 않음"
      : "Local-preview members only · Participant identities are not verified")
    await expect(chat).not.toContainText(/Confirmed members only|확정 참가자만/)

    await page.getByLabel(locale === "ko" ? "Table로 돌아가기" : "Back to Table").click()
    await page.getByTestId("ondo-sheet").getByRole("button", { name: locale === "ko" ? "닫기" : "Close" }).click()
    await page.goto(`/ondo-b?venueId=${CANONICAL_VENUE_ID}`)
    await page.getByTestId("canonical-place-details").click()
    await page.getByTestId("canonical-venue-tables").click()
    if (locale === "ko") {
      await expect(page.getByTestId("tables-back-to-venue")).toHaveText("장소로 돌아가기")
      await expect(page.getByTestId("tables-entry")).not.toContainText("(으)로")
    }
  })

  test(`SLEEK-R2 D2-004 Local Signal success, failure and cancel retain local focus (${locale})`, async ({ page }) => {
    test.setTimeout(90_000)
    await seed(page, locale)
    await openSignal(page)
    const note = page.getByTestId("local-signal-overlay").locator("textarea")
    await note.fill(locale === "ko" ? "입구에서 번호표를 먼저 받아요." : "Take a number at the entrance first.")
    await page.getByTestId("local-signal-submit").click()
    await expect(page.getByTestId("local-signal-return")).toBeFocused()
    await expect(page.locator("body")).not.toBeFocused()

    await openSignal(page, "scenario=local-signal-fail")
    await page.getByTestId("local-signal-overlay").locator("textarea").fill(locale === "ko" ? "실패 후에도 남는 초안" : "Draft survives failure")
    await page.getByTestId("local-signal-submit").click()
    await expect(page.getByTestId("local-signal-submit")).toBeFocused()
    await expect(page.getByTestId("local-signal-submit")).toHaveText(locale === "ko" ? "다시 시도" : "Try again")

    await openSignal(page)
    await page.getByRole("button", { name: locale === "ko" ? "작성 취소" : "Cancel draft" }).click()
    await expect(page.getByTestId("canonical-place-details")).toBeFocused()
    await expect(page.locator("body")).not.toBeFocused()
  })
}

test("SLEEK-R2 D2-002 report and leave decisions are the sole modal and pointer-isolate Chat", async ({ page }) => {
  test.setTimeout(90_000)
  await seed(page, "en", { membership: "confirmed" })
  await openJoinedChat(page)

  for (const kind of ["report", "leave"] as const) {
    const invoker = page.getByTestId(kind === "report" ? "table-report" : "table-leave")
    const backgroundTargets = [
      page.getByTestId("table-chat").locator("header button").first(),
      page.getByTestId("ondo-sheet").locator("button[data-sheet-initial-focus]"),
      page.getByTestId("table-chat").locator("input[aria-label='Message the Table']"),
      page.getByTestId(kind === "report" ? "table-leave" : "table-report"),
    ]
    const backgroundBoxes = await Promise.all(backgroundTargets.map((target) => target.boundingBox()))
    backgroundBoxes.forEach((box) => expect(box).not.toBeNull())
    await invoker.click()
    const layer = page.getByTestId("chat-confirm-layer")
    const dialog = page.getByTestId("chat-confirm-dialog")
    await expect(dialog).toHaveAttribute("aria-modal", "true")
    await expect(page.locator("[role='dialog'][aria-modal='true']:not([aria-hidden='true']):not([inert]), [role='alertdialog'][aria-modal='true']:not([aria-hidden='true']):not([inert])")).toHaveCount(1)
    await expect(page.getByTestId("ondo-sheet")).not.toHaveAttribute("role")
    await expect(page.getByTestId("ondo-sheet")).not.toHaveAttribute("aria-modal")
    const isolated = await invoker.evaluate((element) => {
      const covered = element.closest<HTMLElement>("[inert][aria-hidden='true']")
      return Boolean(covered)
    })
    expect(isolated).toBe(true)
    const uncoveredBackgroundControls = await page.getByTestId("ondo-sheet").locator("button,input,select,textarea,a[href]").evaluateAll((elements) => elements
      .filter((element) => !element.closest("[data-testid='chat-confirm-layer']"))
      .filter((element) => !element.closest("[inert][aria-hidden='true']"))
      .map((element) => element.outerHTML.slice(0, 120)))
    expect(uncoveredBackgroundControls).toEqual([])

    if (kind === "report") {
      await expect(page.getByTestId("report-reason")).toBeFocused()
      await page.keyboard.press("Shift+Tab")
      await expect(page.getByTestId("confirm-cancel")).toBeFocused()
      await page.keyboard.press("Tab")
      await expect(page.getByTestId("report-reason")).toBeFocused()
    } else {
      await expect(page.getByTestId("confirm-cancel")).toBeFocused()
    }

    let rawBackgroundClicks = 0
    for (const [index, box] of backgroundBoxes.entries()) {
      const point = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 }
      const hit = await backgroundTargets[index].evaluate((element, targetPoint) => {
        const top = document.elementFromPoint(targetPoint.x, targetPoint.y)
        return {
          reachedBackgroundControl: top === element || element.contains(top),
          insideDecision: Boolean(top?.closest("[data-testid='chat-confirm-dialog']")),
          insideDecisionLayer: Boolean(top?.closest("[data-testid='chat-confirm-layer']")),
        }
      }, point)
      expect(hit.reachedBackgroundControl).toBe(false)
      expect(hit.insideDecisionLayer).toBe(true)
      if (hit.insideDecision) continue
      for (let attempt = 0; attempt < 3; attempt += 1) {
        await page.mouse.click(point.x, point.y)
        rawBackgroundClicks += 1
        await settleFocusFrames(page)
        await expect(dialog).toBeVisible()
        await expect(page.getByTestId("table-chat")).toBeVisible()
        expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true)
      }
    }
    expect(rawBackgroundClicks).toBeGreaterThanOrEqual(6)
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true)
    const axe = await new AxeBuilder({ page }).include("[data-testid='chat-confirm-layer']").analyze()
    expect(axe.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([])
    await page.keyboard.press("Escape")
    await expect(layer).toHaveCount(0)
    await expect(invoker).toBeFocused()
  }
})

test("SLEEK-R2 Connect decision geometry holds at 360/430/768/801", async ({ page }, testInfo) => {
  test.setTimeout(90_000)
  if (testInfo.project.name !== "desktop-chromium") return
  await seed(page, "en", { membership: "confirmed" })
  await openJoinedChat(page)
  for (const viewport of [
    { width: 360, height: 800 },
    { width: 430, height: 932 },
    { width: 768, height: 1024 },
    { width: 801, height: 1000 },
  ]) {
    await page.setViewportSize(viewport)
    await page.getByTestId("table-report").click()
    const layerBox = await page.getByTestId("chat-confirm-layer").boundingBox()
    const dialogBox = await page.getByTestId("chat-confirm-dialog").boundingBox()
    expect(layerBox).toEqual({ x: 0, y: 0, width: viewport.width, height: viewport.height })
    expect(dialogBox).not.toBeNull()
    expect(dialogBox!.x).toBeGreaterThanOrEqual(0)
    expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(viewport.width)
    expect(dialogBox!.y).toBeGreaterThanOrEqual(0)
    expect(dialogBox!.y + dialogBox!.height).toBeLessThanOrEqual(viewport.height)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)
    await page.keyboard.press("Escape")
  }
})
