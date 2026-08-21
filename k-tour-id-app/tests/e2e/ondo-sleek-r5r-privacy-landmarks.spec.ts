import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"
import { B_SLEEK_VIEWPORTS } from "../helpers/ondo-b-visual-evidence"
import {
  expectBRuntimeClean,
  gotoB,
  installBRuntimeGuard,
  prepareBPage,
  seedB,
} from "../helpers/ondo-b-qa"

const FEATURE_SESSION_KEYS = [
  "ondo.chat.v2",
  "ondo.table-outcomes.v2",
  "ondo.labs.v2",
  "ondo.accepted-visits.v2",
] as const

const LOCAL_SEED = {
  guideSeen: true,
  autoNight: false,
  savedVenueIds: ["mois-0021cd596bc5b2a922ad"],
  discoveryPreferences: ["vegan", "late"],
}

const SESSION_SEED = {
  onboarding: "ONB-COMPLETE",
  persona: "long_term_resident" as const,
  account: "ACC-ACTIVE",
  person: "PER-VERIFIED",
  age: "AGE-VERIFIED",
  ageExpiresAt: "2026-08-20T20:30:00.000Z",
  paymentKyc: "PKY-VERIFIED",
  after19: "A19-MANUAL-OFF",
  tableMembershipById: { "table-seongsu-dinner": "confirmed" },
  reputation: { identity: "verified", visit: "repeat", contribution: "helpful", meetup: "reliable" },
  acceptedActivityEventKeys: ["visit:r5r"],
  stamps: 10,
  profile: {
    displayName: "Mina",
    from: "Canada",
    livesIn: "Seoul",
    languages: ["English", "한국어"],
    shareFrom: true,
    shareLivesIn: true,
    shareLanguages: true,
  },
}

const RESET_SESSION_EXPECTED = {
  onboarding: SESSION_SEED.onboarding,
  persona: SESSION_SEED.persona,
  account: "ACC-GUEST",
  person: "PER-UNVERIFIED",
  age: "AGE-UNVERIFIED",
  paymentKyc: "PKY-NOT-STARTED",
  after19: "A19-OFF",
  gate: null,
  gateState: "idle",
  tableMembershipById: {},
  reputation: { identity: "unverified", visit: "new", contribution: "new", meetup: "new" },
  acceptedActivityEventKeys: [],
  stamps: 9,
  profile: {
    displayName: "Daniel Kim",
    languages: ["English"],
    shareFrom: false,
    shareLivesIn: false,
    shareLanguages: false,
  },
}

const CLEARED_SENSITIVE_SESSION_PATHS = [
  "ageExpiresAt",
  "profile.from",
  "profile.livesIn",
] as const

const COPY = {
  en: {
    sessionOpen: "Sign out and clear this session",
    sessionDialog: "Sign out and clear this session?",
    sessionCancel: "Keep this session",
    sessionConfirm: "Sign out and clear",
    sessionReceipt: /Browser session cleared.*exploring without an account/i,
    discoveryOpen: "Reset discovery choices",
    discoveryDialog: "Reset discovery choices?",
    discoveryCancel: "Keep choices",
    discoveryConfirm: "Reset choices",
    discoveryReceipt: /Discovery choices reset.*saved places.*session/i,
    labsOpen: "Open Labs",
  },
  ko: {
    sessionOpen: "로그아웃하고 이 세션 지우기",
    sessionDialog: "로그아웃하고 이 세션을 지울까요?",
    sessionCancel: "이 세션 유지",
    sessionConfirm: "로그아웃하고 지우기",
    sessionReceipt: /브라우저 세션을 지웠어요.*계정 없이 둘러보는 중/,
    discoveryOpen: "둘러보기 선택 초기화",
    discoveryDialog: "둘러보기 선택을 초기화할까요?",
    discoveryCancel: "선택 유지",
    discoveryConfirm: "선택 초기화",
    discoveryReceipt: /둘러보기 선택을 초기화했어요.*저장한 장소.*세션/,
    labsOpen: "Labs 열기",
  },
} as const

async function seedPrivacyState(page: Page, locale: "en" | "ko") {
  await seedB(page, { locale, local: LOCAL_SEED, session: SESSION_SEED, clearFeatures: false })
  await page.addInitScript((keys) => {
    if (sessionStorage.getItem("ondo.qa.r5r-privacy-seeded") !== "1") {
      sessionStorage.setItem(keys[0], JSON.stringify({ table: [{ body: "hello" }] }))
      sessionStorage.setItem(keys[1], JSON.stringify({ "table-seongsu-dinner": { reportReason: "harassment", participantBlocked: true } }))
      sessionStorage.setItem(keys[2], JSON.stringify({ acknowledged: true, wallet: "WAL-READY", bridge: "BRG-QUOTED" }))
      sessionStorage.setItem(keys[3], JSON.stringify(["visit-r5r"]))
      sessionStorage.setItem("ondo.qa.r5r-privacy-seeded", "1")
    }
    sessionStorage.setItem("unrelated.session.fixture", "preserve-session-byte")
    localStorage.setItem("unrelated.local.fixture", "preserve-local-byte")
  }, FEATURE_SESSION_KEYS)
}

async function expectTouchTarget(control: Locator) {
  const box = await control.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.width).toBeGreaterThanOrEqual(44)
  expect(box!.height).toBeGreaterThanOrEqual(44)
}

async function expectModalIsolation(page: Page) {
  await expect(page.locator("[data-active-tab]")).toHaveAttribute("inert", "")
  await expect(page.getByTestId("ondo-main-nav")).toHaveAttribute("inert", "")
  await expect(page.locator("[aria-modal='true']:not([aria-hidden='true']):not([inert])")).toHaveCount(1)
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(results.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
}

test.beforeEach(async ({ page }, testInfo) => {
  testInfo.setTimeout(180_000)
  page.setDefaultTimeout(20_000)
  installBRuntimeGuard(page)
  await prepareBPage(page)
})

test.afterEach(async ({ page }) => {
  await expectBRuntimeClean(page)
})

for (const locale of ["en", "ko"] as const) {
  test(`R5R privacy ${locale} session reset is confirmed, scoped, persistent, and focus-safe`, async ({ page }) => {
    const copy = COPY[locale]
    await seedPrivacyState(page, locale)
    await gotoB(page)
    await page.getByTestId("nav-id").click()

    await page.evaluate(() => {
      const current = JSON.parse(sessionStorage.getItem("ondo.session.v3") ?? "{}")
      sessionStorage.setItem("ondo.session.v3", JSON.stringify({
        ...current,
        gate: {
          tokenId: "RT-R5R-PRIVACY",
          cta: "OPEN_AFTER19",
          gateQueue: ["age"],
          activeGate: "age",
          createdAt: "2026-08-19T11:25:00.000Z",
          expiresAt: "2026-08-19T11:40:00.000Z",
        },
        gateState: "pending",
      }))
    })

    const opener = page.getByTestId("session-reset-open")
    await expect(opener).toHaveAccessibleName(copy.sessionOpen)
    await expectTouchTarget(opener)
    const localBefore = await page.evaluate(() => localStorage.getItem("ondo.preferences.v3"))

    await opener.click()
    const dialog = page.getByRole("dialog", { name: copy.sessionDialog })
    const cancel = dialog.getByRole("button", { name: copy.sessionCancel, exact: true })
    const confirm = dialog.getByRole("button", { name: copy.sessionConfirm, exact: true })
    await expect(dialog).toBeVisible()
    await expect(cancel).toBeFocused()
    await expectTouchTarget(cancel)
    await expectTouchTarget(confirm)
    await expectModalIsolation(page)

    const sessionBeforeCancel = await page.evaluate(() => sessionStorage.getItem("ondo.session.v3"))
    await page.keyboard.press("Escape")
    await expect(dialog).toHaveCount(0)
    await expect(opener).toBeFocused()
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem("ondo.session.v3"))).toBe(sessionBeforeCancel)

    await opener.click()
    const backdrop = dialog.locator("..").locator("button[aria-hidden='true']")
    const backdropBox = await backdrop.boundingBox()
    expect(backdropBox).not.toBeNull()
    await page.mouse.click(backdropBox!.x + backdropBox!.width / 2, backdropBox!.y + 40)
    await expect(dialog).toHaveCount(0)
    await expect(opener).toBeFocused()
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem("ondo.session.v3"))).toBe(sessionBeforeCancel)

    await opener.click()
    await confirm.dblclick()
    await expect(dialog).toHaveCount(0)
    await expect(page.getByTestId("session-reset-open")).toBeFocused()
    await expect(page.getByTestId("ondo-toast")).toContainText(copy.sessionReceipt)

    await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem("ondo.session.v3") ?? "{}"))).toEqual(RESET_SESSION_EXPECTED)
    const resetSession = await page.evaluate(() => JSON.parse(sessionStorage.getItem("ondo.session.v3") ?? "{}"))
    expect(resetSession.onboarding).toBe(SESSION_SEED.onboarding)
    expect(resetSession.persona).toBe(SESSION_SEED.persona)
    for (const path of CLEARED_SENSITIVE_SESSION_PATHS) expect(resetSession, `cleared sensitive path: ${path}`).not.toHaveProperty(path)
    await expect.poll(() => page.evaluate((keys) => keys.map((key) => sessionStorage.getItem(key)), FEATURE_SESSION_KEYS)).toEqual([null, null, null, null])
    expect(await page.evaluate(() => localStorage.getItem("ondo.preferences.v3"))).toBe(localBefore)
    expect(await page.evaluate(() => localStorage.getItem("unrelated.local.fixture"))).toBe("preserve-local-byte")
    expect(await page.evaluate(() => sessionStorage.getItem("unrelated.session.fixture"))).toBe("preserve-session-byte")

    await page.reload({ waitUntil: "domcontentloaded" })
    await page.getByTestId("nav-id").click()
    await expect(page.getByTestId("ondo-identity-entry")).toBeVisible()
    await expect(page.getByTestId("ondo-identity-entry")).toContainText(locale === "ko" ? "계정 없이 둘러보는 중" : "Exploring without an account")
    await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem("ondo.session.v3") ?? "{}"))).toEqual(RESET_SESSION_EXPECTED)
    await expect.poll(() => page.evaluate((keys) => keys.map((key) => sessionStorage.getItem(key)), FEATURE_SESSION_KEYS)).toEqual([null, null, null, null])
    expect(await page.evaluate(() => localStorage.getItem("ondo.preferences.v3"))).toBe(localBefore)
  })

  test(`R5R privacy ${locale} discovery reset changes only discovery preferences`, async ({ page }) => {
    const copy = COPY[locale]
    await seedPrivacyState(page, locale)
    await gotoB(page, "?city=seoul&query=tteokbokki")
    await page.getByTestId("nav-my").click()

    const opener = page.getByTestId("discovery-reset-open")
    await expect(opener).toHaveAccessibleName(copy.discoveryOpen)
    await expectTouchTarget(opener)
    const sessionBefore = await page.evaluate(() => sessionStorage.getItem("ondo.session.v3"))
    const urlBefore = page.url()

    await opener.click()
    const dialog = page.getByRole("dialog", { name: copy.discoveryDialog })
    const cancel = dialog.getByRole("button", { name: copy.discoveryCancel, exact: true })
    const confirm = dialog.getByRole("button", { name: copy.discoveryConfirm, exact: true })
    await expect(cancel).toBeFocused()
    await expectModalIsolation(page)
    await cancel.click()
    await expect(dialog).toHaveCount(0)
    await expect(opener).toBeFocused()
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("ondo.preferences.v3") ?? "{}").discoveryPreferences)).toEqual(["vegan", "late"])

    await opener.click()
    await confirm.dblclick()
    await expect(page.getByTestId("discovery-reset-open")).toBeFocused()
    await expect(page.getByTestId("ondo-toast")).toContainText(copy.discoveryReceipt)
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("ondo.preferences.v3") ?? "{}").discoveryPreferences)).toEqual([])
    expect(await page.evaluate(() => sessionStorage.getItem("ondo.session.v3"))).toBe(sessionBefore)
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("ondo.preferences.v3") ?? "{}").savedVenueIds)).toEqual(LOCAL_SEED.savedVenueIds)
    expect(page.url()).toBe(urlBefore)
    expect(await page.evaluate(() => sessionStorage.getItem("unrelated.session.fixture"))).toBe("preserve-session-byte")

    await page.reload({ waitUntil: "domcontentloaded" })
    await page.getByTestId("nav-my").click()
    await expect(page.getByTestId("ondo-my-entry")).toBeVisible()
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("ondo.preferences.v3") ?? "{}").discoveryPreferences)).toEqual([])
    expect(await page.evaluate(() => sessionStorage.getItem("ondo.session.v3"))).toBe(sessionBefore)
  })

  test(`R5R landmarks ${locale} keep one top-level main across My and Labs at six widths`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium")
    const copy = COPY[locale]
    await seedPrivacyState(page, locale)

    for (const viewport of B_SLEEK_VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await gotoB(page)
      await page.getByTestId("nav-my").click()
      await expect(page.locator("main")).toHaveCount(1)
      await expectTouchTarget(page.getByTestId("discovery-reset-open"))

      await page.getByTestId("open-labs").click()
      await expect(page.getByTestId("labs-overlay")).toBeVisible()
      await expect(page.locator("main")).toHaveCount(1)
      const axe = await new AxeBuilder({ page }).withRules(["landmark-main-is-top-level", "landmark-no-duplicate-main", "landmark-unique"]).analyze()
      expect(axe.violations, `${locale} ${viewport.id}`).toEqual([])
      await page.getByRole("button", { name: locale === "ko" ? "My Korea로 돌아가기" : "Return to My Korea" }).click()
      await expect(page.getByTestId("open-labs")).toBeFocused()
      await expect(page.getByTestId("discovery-reset-open")).toHaveAccessibleName(copy.discoveryOpen)
    }
  })
}
