import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"
import {
  B_ACTIVITY_PROFILE_KEY,
  expectBRuntimeClean,
  gotoB,
  installBRuntimeGuard,
  openCanonicalVenue,
  prepareBPage,
  seedB,
  type BLocale,
} from "../helpers/ondo-b-qa"

const PROFILE = {
  displayName: "Mina",
  from: { value: "Canada", consent: true },
  livesIn: { value: "Private City", consent: false },
  languages: { value: ["日本語"], consent: false },
}

const COPY = {
  en: {
    profile: "Public profile", edit: "Edit", lives: "Lives in", cancel: "Cancel", discard: "Discard",
    save: "Save changes", retry: "Try again", details: "Before you go", status: "Not confirmed", source: "Official directory", closeEvidence: "Close evidence",
  },
  ko: {
    profile: "공개 프로필", edit: "편집", lives: "현재 생활권", cancel: "취소", discard: "변경사항 버리기",
    save: "변경사항 저장", retry: "다시 시도", details: "가기 전 확인", status: "확인된 정보 없음", source: "공식 등록 정보", closeEvidence: "근거 닫기",
  },
  ja: {
    profile: "公開プロフィール", edit: "編集", lives: "居住地", cancel: "キャンセル", discard: "変更を破棄",
    save: "変更を保存", retry: "もう一度試す", details: "行く前に確認", status: "確認情報なし", source: "公的登録情報", closeEvidence: "根拠を閉じる",
  },
} as const

async function openProfile(page: Page, locale: BLocale = "en", query = "") {
  await seedB(page, {
    locale,
    session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", profile: PROFILE },
  })
  await gotoB(page, query)
  await page.getByTestId("nav-id").click()
  const surface = page.getByTestId("ondo-b-profile-activity")
  await expect(surface).toBeVisible()
  return surface
}

async function expectNoHorizontalOverflow(locator: Locator, label: string) {
  const dimensions = await locator.evaluate((node) => ({ client: node.clientWidth, scroll: node.scrollWidth }))
  expect(dimensions.scroll, label).toBeLessThanOrEqual(dimensions.client + 1)
}

test.describe("Wave 1 profile and evidence truth", () => {
  test.beforeEach(async ({ page }) => {
    installBRuntimeGuard(page)
    await prepareBPage(page)
  })

  test.afterEach(async ({ page }) => {
    await expectBRuntimeClean(page)
  })

  for (const locale of ["en", "ko", "ja"] as const) {
    test(`W1-PROFILE-${locale.toUpperCase()} exposes only consented fields`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      const surface = await openProfile(page, locale)
      const publicView = surface.getByTestId("public-profile-view")

      await expect(surface.getByRole("heading", { name: COPY[locale].profile, exact: true })).toBeVisible()
      await expect(publicView.locator("[data-public-field]")).toHaveCount(1)
      await expect(publicView.locator("[data-public-field='from']")).toContainText("Canada")
      await expect(publicView).not.toContainText("Private City")
      await expect(publicView).not.toContainText("日本語")
      await expect(surface.locator("[data-axis]")).toHaveCount(4)
      const visitAxis = surface.getByTestId("profile-axis-visit")
      await visitAxis.locator("summary").click()
      await expect(surface.getByTestId("profile-axis-evidence-visit")).toBeVisible()
      await expect(surface).not.toContainText(/trust score|reputation score|safety score|국적|nationality|国籍/i)
      await expectNoHorizontalOverflow(surface, `${locale} profile 390x844`)

      const axe = await new AxeBuilder({ page }).include("[data-testid='ondo-b-profile-activity']").analyze()
      expect(axe.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
    })
  }

  test("W1-PROFILE-RETURN dirty cancel and failed save keep the published snapshot exact", async ({ page }) => {
    const surface = await openProfile(page, "en", "?qa=1")
    // The explicit query opts this tab into QA first. Install the one-shot
    // failure only after that opt-in has been captured so the test does not
    // depend on init-script ordering across a canonical route rewrite.
    await expect.poll(() => page.evaluate(() => window.sessionStorage.getItem("ondo.qa.controls.v1"))).toBe("1")
    await page.evaluate(() => {
      window.__ONDO_B_QA__ = { ...(window.__ONDO_B_QA__ ?? {}), profile: "failure" }
    })
    const publicView = surface.getByTestId("public-profile-view")

    await surface.getByRole("button", { name: COPY.en.edit, exact: true }).click()
    await surface.getByRole("textbox", { name: COPY.en.lives, exact: true }).fill("Seoul")
    await surface.getByRole("button", { name: /Lives in/, pressed: false }).click()
    await expect(publicView.locator("[data-public-field='lives-in'] dd")).toHaveText("Seoul")

    await surface.getByRole("button", { name: COPY.en.cancel, exact: true }).click()
    await expect(surface.getByRole("alertdialog", { name: "Discard your changes?" })).toBeVisible()
    await surface.getByRole("button", { name: COPY.en.discard, exact: true }).click()
    await expect(publicView.locator("[data-public-field='lives-in']")).toHaveCount(0)
    await expect(publicView).not.toContainText("Seoul")

    await surface.getByRole("button", { name: COPY.en.edit, exact: true }).click()
    const lives = surface.getByRole("textbox", { name: COPY.en.lives, exact: true })
    await lives.fill("Seoul")
    await surface.getByRole("button", { name: /Lives in/, pressed: false }).click()
    await surface.getByRole("button", { name: COPY.en.save, exact: true }).click()

    const panel = surface.getByTestId("ondo-profile-panel")
    await expect(panel).toHaveAttribute("data-editor-state", "save-failed")
    await expect(lives).toHaveValue("Seoul")
    await expect(publicView.locator("[data-public-field='lives-in']")).toHaveCount(0)
    await expect(publicView).not.toContainText("Seoul")
    await expect(surface.getByRole("button", { name: COPY.en.retry, exact: true })).toBeFocused()

    await surface.getByRole("button", { name: COPY.en.retry, exact: true }).click()
    await expect(panel).toHaveAttribute("data-editor-state", "saved")
    await expect(surface.getByTestId("profile-save-result")).toBeVisible()
    await expect(publicView.locator("[data-public-field='lives-in'] dd")).toHaveText("Seoul")
    const stored = await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "null"), B_ACTIVITY_PROFILE_KEY)
    expect(stored.profile).toMatchObject({
      from: { value: "Canada", consent: true },
      livesIn: { value: "Seoul", consent: true },
      languages: { value: ["日本語"], consent: false },
    })
    await surface.getByRole("button", { name: "Done", exact: true }).click()
    await expect(panel).toHaveAttribute("data-editor-state", "published")
  })

  test("W1-PROFILE-LAYOUT reflows at every required viewport", async ({ page }) => {
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
      { width: 690, height: 844 },
      { width: 844, height: 390 },
      { width: 422, height: 195 }, // 844×390 at 200% CSS-pixel zoom
    ]) {
      await page.setViewportSize(viewport)
      const surface = await openProfile(page)
      await expectNoHorizontalOverflow(surface, `${viewport.width}x${viewport.height} profile`)
      for (const control of await surface.locator("button:visible").all()) {
        const box = await control.boundingBox()
        expect(box?.width ?? 0, `${viewport.width}x${viewport.height} button width`).toBeGreaterThanOrEqual(44)
        expect(box?.height ?? 0, `${viewport.width}x${viewport.height} button height`).toBeGreaterThanOrEqual(44)
      }
    }
  })

  for (const [locale, viewport] of [
    ["en", { width: 320, height: 568 }],
    ["ko", { width: 430, height: 932 }],
    ["ja", { width: 844, height: 390 }],
  ] as const) {
    test(`W1-EVIDENCE-${locale.toUpperCase()} keeps unknown facts visibly non-positive`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await seedB(page, { locale })
      await openCanonicalVenue(page)
      const place = page.getByTestId("canonical-place-overlay")
      const facts = place.getByTestId("canonical-place-details-to-check")

      await expect(facts).toContainText(COPY[locale].details)
      await expect(facts.locator("[data-fact-state='unknown']")).toHaveCount(4)
      await expect(facts.locator("[data-fact-state] .lucide-circle-help")).toHaveCount(4)
      await expect(facts.locator("[data-fact-state] .lucide-check")).toHaveCount(0)
      for (const row of await facts.locator("[data-fact-state]").all()) {
        await expect(row).toContainText(COPY[locale].status)
        await expect(row).not.toContainText(COPY[locale].source)
      }
      await expect(facts).toContainText(COPY[locale].source)
      const firstFact = facts.locator("[data-fact-state]").first()
      // Opening the nested modal correctly removes its background opener from
      // the accessibility tree. Keep a DOM locator so we can still verify the
      // disclosure state and exact focus restoration after the modal closes.
      const factOpener = firstFact.locator("button").first()
      await factOpener.click()
      await expect(factOpener).toHaveAttribute("aria-expanded", "true")
      const drawer = page.getByTestId("canonical-evidence-drawer")
      await expect(drawer).toBeVisible()
      await expect(drawer.getByRole("button", { name: COPY[locale].closeEvidence })).toHaveCount(1)
      await expect(drawer).toContainText("2026-08-19")
      await expect(drawer).toContainText(COPY[locale].source)
      const drawerBox = await page.getByTestId("canonical-evidence-sheet").boundingBox()
      expect(drawerBox?.height ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(viewport.height * .88 + 2)
      const evidenceAxe = await new AxeBuilder({ page }).include("[data-testid='canonical-evidence-drawer']").analyze()
      expect(evidenceAxe.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
      await drawer.getByRole("button", { name: COPY[locale].closeEvidence }).click()
      await expect(drawer).toBeHidden()
      await expect(factOpener).toBeFocused()
      await expect(factOpener).toHaveAttribute("aria-expanded", "false")
      const sourceDisclosure = place.getByTestId("canonical-source-evidence")
      await expect(sourceDisclosure.locator("dd")).toHaveCount(0)
      await sourceDisclosure.locator("summary").click()
      await expect(sourceDisclosure.locator("dd")).toHaveCount(7)
      await expect(place).not.toContainText(/safe place|safety guaranteed|verified merchant|simulated|preview|on-device|technical/i)
      await expectNoHorizontalOverflow(place, `${locale} evidence ${viewport.width}x${viewport.height}`)
    })
  }

  for (const [locale, width, height] of [
    ["en", 320, 568],
    ["ko", 390, 844],
    ["ja", 430, 932],
  ] as const) {
    test(`W1-EVIDENCE-COMPACT-${locale.toUpperCase()} keeps facts concise at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      await seedB(page, { locale })
      await openCanonicalVenue(page)
      const facts = page.getByTestId("canonical-place-details-to-check")
      await expect(facts.locator('[data-fact-label="long"]').first()).toBeHidden()
      await expect(facts.locator('[data-fact-label="short"]').first()).toBeVisible()
      await expectNoHorizontalOverflow(facts, `${locale} canonical facts ${width}px`)
      for (const decision of await facts.locator("[data-fact-state] button").all()) {
        await expectNoHorizontalOverflow(decision, `${locale} canonical fact decision ${width}px`)
      }
    })
  }

  test("W1-PROFILE-CONTEXT returns to the exact My Korea and Table host opener", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedB(page, { locale: "en", session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", profile: PROFILE } })
    await gotoB(page)

    await page.getByTestId("nav-my").click()
    const savedOpener = page.getByTestId("my-korea-profile-open")
    await savedOpener.click()
    await expect(page.getByTestId("profile-entry-panel-my_korea")).toBeVisible()
    const contextualProfile = page.getByTestId("profile-entry-panel-my_korea")
    await contextualProfile.getByRole("textbox", { name: COPY.en.lives, exact: true }).fill("Seoul")
    await contextualProfile.getByRole("button", { name: /Lives in/, pressed: false }).click()
    await contextualProfile.getByRole("button", { name: COPY.en.save, exact: true }).click()
    await expect(contextualProfile.getByTestId("profile-save-result")).toBeVisible()
    await contextualProfile.getByRole("button", { name: "Done", exact: true }).click()
    await expect(page.getByTestId("profile-entry-panel-my_korea")).toHaveCount(0)
    await expect(savedOpener).toBeFocused()
    await expect(page.getByTestId("ondo-b-my-korea-entry")).toBeVisible()

    await page.getByTestId("nav-tables").click()
    await page.getByTestId("table-open-table-seoul-night-bites").click()
    const table = page.getByTestId("table-detail")
    const tableOpener = table.getByTestId("table-host-profile-open")
    await tableOpener.scrollIntoViewIfNeeded()
    const beforeScroll = await table.locator("article").evaluate((node) => node.scrollTop)
    await tableOpener.click()
    await expect(table.getByTestId("profile-entry-panel-table_host")).toBeVisible()
    await table.getByRole("button", { name: "Close profile" }).click()
    await expect(tableOpener).toBeFocused()
    await expect(table).toHaveAttribute("data-table-id", "table-seoul-night-bites")
    await expect.poll(() => table.locator("article").evaluate((node) => node.scrollTop)).toBe(beforeScroll)
  })

  test("W1-EVIDENCE-QA reaches every state and source class without changing production defaults", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const install = async (evidenceFacts: Record<string, unknown>) => {
      await page.addInitScript((facts) => {
        let selected = facts
        try {
          const stored = window.sessionStorage.getItem("ondo.qa.wave1.evidence")
          if (stored) selected = JSON.parse(stored)
        } catch { /* ordinary QA fixture remains */ }
        window.__ONDO_B_QA__ = { ...(window.__ONDO_B_QA__ ?? {}), evidenceFacts: selected }
      }, evidenceFacts)
    }
    await install({
      hours: { state: "yes", sourceClass: "official_directory", value: true, observedAt: "2026-09-01T10:00:00Z" },
      card: { state: "no", sourceClass: "editorial", value: false, observedAt: "2026-09-01T10:00:00Z" },
      menu: { state: "conditional", sourceClass: "ondo", value: "Dinner menu only", observedAt: "2026-09-01T10:00:00Z" },
      language: { state: "stale", sourceClass: "merchant", value: "English menu", observedAt: "2026-01-01T10:00:00Z" },
    })
    await seedB(page, { locale: "en" })
    await openCanonicalVenue(page, { query: "qa=1" })
    const facts = page.getByTestId("canonical-place-details-to-check")
    for (const [key, state, sourceClass] of [
      ["hours", "yes", "official_directory"],
      ["card", "no", "editorial"],
      ["menu", "conditional", "ondo"],
      ["language", "stale", "merchant"],
    ] as const) {
      const row = facts.locator(`[data-fact-key='${key}'][data-fact-state='${state}']`)
      await expect(row).toHaveCount(1)
      await row.getByRole("button").click()
      const drawer = page.getByTestId("canonical-evidence-drawer")
      await expect(drawer).toHaveAttribute("data-source-class", sourceClass)
      if (key === "menu") await expect(drawer).toContainText("Dinner menu only")
      if (key === "card") await expect(drawer).toContainText("Not available")
      await drawer.getByRole("button", { name: "Close evidence" }).click()
    }

    await page.evaluate((next) => {
      window.sessionStorage.setItem("ondo.qa.wave1.evidence", JSON.stringify(next))
    }, {
          hours: { state: "unknown", sourceClass: "opendid", observedAt: "2026-09-01T10:00:00Z" },
          card: { state: "loading", sourceClass: "eas", observedAt: "2026-09-01T10:00:00Z" },
          menu: { state: "error", sourceClass: "official_directory", observedAt: "2026-09-01T10:00:00Z", recoverable: true },
    })
    await page.reload()
    await openCanonicalVenue(page, { query: "qa=1" })
    const reloadedFacts = page.getByTestId("canonical-place-details-to-check")
    for (const [key, state, sourceClass] of [
      ["hours", "unknown", "opendid"],
      ["card", "loading", "eas"],
      ["menu", "error", "official_directory"],
    ] as const) {
      const row = reloadedFacts.locator(`[data-fact-key='${key}'][data-fact-state='${state}']`)
      await expect(row).toHaveCount(1)
      await row.getByRole("button").click()
      await expect(page.getByTestId("canonical-evidence-drawer")).toHaveAttribute("data-source-class", sourceClass)
      await page.getByRole("button", { name: "Close evidence" }).click()
    }
    const error = reloadedFacts.locator("[data-fact-state='error'] button")
    await error.click()
    await expect(page.getByTestId("canonical-evidence-retry")).toBeVisible()
    await page.route("**/api/ondo/venues/**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 300))
      await route.continue()
    })
    await page.getByTestId("canonical-evidence-retry").click()
    await expect(reloadedFacts.locator("[data-fact-key='menu']")).toHaveAttribute("data-fact-state", "loading")
    await expect(reloadedFacts.locator("[data-fact-key='hours']")).toHaveAttribute("data-fact-state", "unknown")
    await expect(reloadedFacts.locator("[data-fact-state='loading']")).toHaveCount(2)
    await expect(reloadedFacts.locator("[data-fact-key='menu']")).toHaveAttribute("data-fact-state", "unknown")
  })
})
