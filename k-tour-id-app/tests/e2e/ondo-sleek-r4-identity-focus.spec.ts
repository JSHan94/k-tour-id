import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"
import {
  expectBRuntimeClean,
  installBRuntimeGuard,
  openCanonicalVenue,
  prepareBPage,
  seedB,
  seedFreshOnboarding,
  sessionState,
} from "../helpers/ondo-b-qa"

const COPY = {
  en: {
    start: "Personalize guest Explore",
    guest: "Explore without setup",
    preferences: "Choose meal preferences",
    fallback: "Open map with defaults",
    accountStart: "Create account · Simulated",
    accountComplete: "Complete account simulation",
    personStart: "Start check",
    personComplete: "Complete simulated check",
    residenceAlternate: "Use passport provider instead",
    after19Start: "Start 19+ check simulation",
    after19Complete: "Confirm 19+ · Simulated",
    after19Prompt: "Confirm 19+",
  },
  ko: {
    start: "취향 설정 후 게스트 탐색",
    guest: "설정 없이 탐색",
    preferences: "한 끼 취향 고르기",
    fallback: "기본 설정으로 지도 열기",
    accountStart: "계정 만들기 · 시뮬레이션",
    accountComplete: "계정 시뮬레이션 완료",
    personStart: "본인 확인 시작",
    personComplete: "본인 확인 시뮬레이션 완료",
    residenceAlternate: "여권 확인 경로로 대신 진행",
    after19Start: "19+ 확인 시뮬레이션 시작",
    after19Complete: "19+ 확인 · 시뮬레이션",
    after19Prompt: "19+ 확인하기",
  },
} as const

const COMPACT_VIEWPORT = { width: 360, height: 800 } as const

async function expectNoSeriousAxe(page: Page, selector: string) {
  const result = await new AxeBuilder({ page })
    .include(selector)
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(result.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
}

async function expectVisibleFocus(page: Page, destination: Locator) {
  await expect(destination).toBeVisible()
  await expect(destination).toBeFocused()
  await expect.poll(() => page.evaluate(() => {
    const active = document.activeElement
    if (!(active instanceof HTMLElement)) return null
    const rect = active.getBoundingClientRect()
    return {
      tag: active.tagName,
      visible: rect.width > 0 && rect.height > 0
        && rect.top >= 0 && rect.left >= 0
        && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth,
      covered: Boolean(active.closest("[inert], [aria-hidden='true']")),
    }
  })).toEqual({ tag: await destination.evaluate((element) => element.tagName), visible: true, covered: false })

  await page.keyboard.press("Tab")
  await expect.poll(() => page.evaluate(() => {
    const active = document.activeElement
    if (!(active instanceof HTMLElement)) return false
    const rect = active.getBoundingClientRect()
    return active !== document.body && active.isConnected && rect.width > 0 && rect.height > 0
      && !active.closest("[inert], [aria-hidden='true']")
  })).toBe(true)
}

async function openLocalSignal(page: Page, locale: "en" | "ko", persona: "korean_local" | "long_term_resident") {
  await seedB(page, {
    locale,
    session: {
      persona,
      account: "ACC-ACTIVE",
      person: "PER-UNVERIFIED",
      age: "AGE-UNVERIFIED",
      paymentKyc: "PKY-NOT-STARTED",
    },
  })
  await openCanonicalVenue(page)
  await page.getByTestId("canonical-venue-signal").click()
  const signal = page.getByTestId("local-signal-overlay")
  await signal.locator("textarea").fill(locale === "ko" ? "메뉴는 카운터에서 주문해요." : "The menu is ordered at the counter.")
  await signal.getByTestId("local-signal-submit").dblclick()
  await expect(page.getByTestId("ondo-gate-overlay")).toBeVisible()
  return signal
}

async function expectOnboardingTerminal(page: Page, locale: "en" | "ko", mode: "finish" | "skip" | "fallback") {
  const copy = COPY[locale]
  await seedFreshOnboarding(page, locale)
  await page.goto(`/ondo-b${mode === "fallback" ? "?onboarding=failure" : ""}`, { waitUntil: "domcontentloaded" })
  const onboarding = page.getByTestId("ondo-onboarding")

  if (mode === "skip") {
    await onboarding.getByRole("button", { name: copy.guest, exact: true }).click()
  } else {
    await onboarding.getByRole("button", { name: copy.start, exact: true }).click()
    await onboarding.getByTestId("persona-short_term").click()
    await onboarding.getByRole("button", { name: copy.preferences, exact: true }).click()
    await page.getByTestId("onboarding-finish").click()
    if (mode === "fallback") {
      await expect(onboarding.getByRole("alert")).toBeVisible()
      await onboarding.getByRole("button", { name: copy.fallback, exact: true }).click()
    }
  }

  await expect(onboarding).toBeHidden()
  await expectVisibleFocus(page, page.locator("[data-testid='ondo-b-nation'] [data-city='seoul']"))
  expect(await sessionState(page)).toMatchObject({ onboarding: "ONB-COMPLETE" })
}

async function expectGlobalAfter19Terminal(page: Page, locale: "en" | "ko") {
  const copy = COPY[locale]
  await seedB(page, {
    locale,
    session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", age: "AGE-UNVERIFIED", paymentKyc: "PKY-NOT-STARTED" },
    local: { autoNight: false },
  })
  await page.goto("/ondo-b?city=seoul", { waitUntil: "domcontentloaded" })
  await page.getByTestId("after19-toggle").click()
  await page.getByTestId("after19-prompt-layer").getByRole("button", { name: copy.after19Prompt, exact: true }).click()
  const gate = page.getByTestId("ondo-gate-overlay")
  await gate.getByRole("button", { name: copy.after19Start, exact: true }).click()
  await gate.getByRole("button", { name: copy.after19Complete, exact: true }).click()

  await expect(gate).toBeHidden()
  await expectVisibleFocus(page, page.getByTestId("after19-auto-banner"))
  expect(await sessionState(page)).toMatchObject({ age: "AGE-VERIFIED", after19: "A19-ON", gate: null, gateState: "idle" })
}

test.beforeEach(async ({ page }, testInfo) => {
  testInfo.setTimeout(90_000)
  installBRuntimeGuard(page)
  await prepareBPage(page)
  await page.setViewportSize(testInfo.project.name === "mobile-chromium"
    ? { width: 390, height: 844 }
    : { width: 1440, height: 1000 })
})

test.afterEach(async ({ page }) => {
  await expectBRuntimeClean(page)
})

for (const locale of ["en", "ko"] as const) {
  test(`R4 terminal focus · ${locale} onboarding finish reaches the Nation decision`, async ({ page }) => {
    await expectOnboardingTerminal(page, locale, "finish")
  })

  for (const mode of ["skip", "fallback"] as const) {
    test(`R4 terminal focus · ${locale} onboarding ${mode} reaches the Nation decision`, async ({ page }) => {
      await expectOnboardingTerminal(page, locale, mode)
    })
  }

  test(`R4 terminal focus · ${locale} compact onboarding finish, skip, and fallback reach the Nation decision`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium")
    await page.setViewportSize(COMPACT_VIEWPORT)
    for (const mode of ["finish", "skip", "fallback"] as const) {
      await test.step(mode, () => expectOnboardingTerminal(page, locale, mode))
    }
  })

  test(`R4 terminal focus · ${locale} Account Save completion focuses the resumed place`, async ({ page }) => {
    const copy = COPY[locale]
    await seedB(page, { locale, session: { account: "ACC-GUEST", person: "PER-UNVERIFIED" } })
    await openCanonicalVenue(page)
    const place = page.getByTestId("canonical-place-overlay")
    await page.getByTestId("canonical-venue-save").dblclick()
    const gate = page.getByTestId("ondo-gate-overlay")
    await gate.getByRole("button", { name: copy.accountStart, exact: true }).dblclick()
    await gate.getByRole("button", { name: copy.accountComplete, exact: true }).dblclick()

    await expect(gate).toBeHidden()
    await expect(page.getByTestId("canonical-venue-save")).toBeDisabled()
    await expectVisibleFocus(page, place.locator("#canonical-place-title"))
    expect(await sessionState(page)).toMatchObject({ account: "ACC-ACTIVE" })
  })

  test(`R4 terminal focus · ${locale} Korean CX completion resumes the exact draft`, async ({ page }) => {
    const copy = COPY[locale]
    const signal = await openLocalSignal(page, locale, "korean_local")
    const gate = page.getByTestId("ondo-gate-overlay")
    await gate.getByRole("button", { name: copy.personStart, exact: true }).dblclick()
    await gate.getByRole("button", { name: copy.personComplete, exact: true }).dblclick()

    await expect(gate).toBeHidden()
    await expect(signal.locator("textarea")).toHaveValue(locale === "ko" ? "메뉴는 카운터에서 주문해요." : "The menu is ordered at the counter.")
    await expectVisibleFocus(page, signal.getByTestId("local-signal-submit"))
    expect(await sessionState(page)).toMatchObject({ person: "PER-VERIFIED", gate: null, gateState: "idle" })
  })

  test(`R4 terminal focus · ${locale} Residence alternate completion resumes the exact draft`, async ({ page }) => {
    const copy = COPY[locale]
    const signal = await openLocalSignal(page, locale, "long_term_resident")
    const gate = page.getByTestId("ondo-gate-overlay")
    await gate.getByRole("button", { name: copy.personStart, exact: true }).dblclick()
    await expect(page.getByTestId("gate-unsupported")).toBeVisible()
    await gate.getByRole("button", { name: copy.residenceAlternate, exact: true }).dblclick()
    await gate.getByRole("button", { name: copy.personStart, exact: true }).dblclick()
    await gate.getByRole("button", { name: copy.personComplete, exact: true }).dblclick()

    await expect(gate).toBeHidden()
    await expect(signal.locator("textarea")).toHaveValue(locale === "ko" ? "메뉴는 카운터에서 주문해요." : "The menu is ordered at the counter.")
    await expectVisibleFocus(page, signal.getByTestId("local-signal-submit"))
    expect(await sessionState(page)).toMatchObject({ person: "PER-VERIFIED", gate: null, gateState: "idle" })
  })

  test(`R4 terminal focus · ${locale} compact Account Save completion focuses the resumed place`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium")
    await page.setViewportSize(COMPACT_VIEWPORT)
    const copy = COPY[locale]
    await seedB(page, { locale, session: { account: "ACC-GUEST", person: "PER-UNVERIFIED" } })
    await openCanonicalVenue(page)
    const place = page.getByTestId("canonical-place-overlay")
    await page.getByTestId("canonical-venue-save").click()
    const gate = page.getByTestId("ondo-gate-overlay")
    await gate.getByRole("button", { name: copy.accountStart, exact: true }).click()
    await gate.getByRole("button", { name: copy.accountComplete, exact: true }).click()
    await expect(gate).toBeHidden()
    await expectVisibleFocus(page, place.locator("#canonical-place-title"))
  })

  test(`R4 terminal focus · ${locale} compact Korean CX completion resumes the exact draft`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium")
    await page.setViewportSize(COMPACT_VIEWPORT)
    const copy = COPY[locale]
    const signal = await openLocalSignal(page, locale, "korean_local")
    const gate = page.getByTestId("ondo-gate-overlay")
    await gate.getByRole("button", { name: copy.personStart, exact: true }).click()
    await gate.getByRole("button", { name: copy.personComplete, exact: true }).click()
    await expect(gate).toBeHidden()
    await expectVisibleFocus(page, signal.getByTestId("local-signal-submit"))
  })

  test(`R4 terminal focus · ${locale} compact Residence alternate completion resumes the exact draft`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium")
    await page.setViewportSize(COMPACT_VIEWPORT)
    const copy = COPY[locale]
    const signal = await openLocalSignal(page, locale, "long_term_resident")
    const gate = page.getByTestId("ondo-gate-overlay")
    await gate.getByRole("button", { name: copy.personStart, exact: true }).click()
    await expect(page.getByTestId("gate-unsupported")).toBeVisible()
    await gate.getByRole("button", { name: copy.residenceAlternate, exact: true }).click()
    await gate.getByRole("button", { name: copy.personStart, exact: true }).click()
    await gate.getByRole("button", { name: copy.personComplete, exact: true }).click()
    await expect(gate).toBeHidden()
    await expectVisibleFocus(page, signal.getByTestId("local-signal-submit"))
  })

  test(`R4 terminal focus · ${locale} global FL-013 manual 19+ completion reaches its banner`, async ({ page }) => {
    await expectGlobalAfter19Terminal(page, locale)
  })

  test(`R4 terminal focus · ${locale} compact global FL-013 manual 19+ completion reaches its banner`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium")
    await page.setViewportSize(COMPACT_VIEWPORT)
    await expectGlobalAfter19Terminal(page, locale)
  })

  test(`R4 modal ownership · ${locale} nested Age Gate is sole owner and returns exact venue focus`, async ({ page }) => {
    const copy = COPY[locale]
    await seedB(page, {
      locale,
      session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", age: "AGE-UNVERIFIED", paymentKyc: "PKY-NOT-STARTED" },
      local: { autoNight: false },
    })
    await openCanonicalVenue(page)
    const place = page.getByTestId("canonical-place-overlay")
    const unlock = page.getByTestId("canonical-after19-unlock")
    await unlock.dblclick()
    const gate = page.getByTestId("ondo-gate-overlay")

    await expect(gate).toBeVisible()
    await expect(page.locator("[role='dialog'][aria-modal='true'], [role='alertdialog'][aria-modal='true']")).toHaveCount(1)
    await expect(page.locator("[aria-modal='true']")).toHaveCount(1)
    await expect(place).toHaveAttribute("inert", "")
    await expect(place).toHaveAttribute("aria-hidden", "true")
    await expect(place).not.toHaveAttribute("role")
    await expect(place).not.toHaveAttribute("aria-modal")
    await expectNoSeriousAxe(page, "[data-testid='ondo-gate-overlay']")

    await page.keyboard.press("Escape")
    await expect(gate).toBeHidden()
    await expect(place).toHaveAttribute("role", "dialog")
    await expect(place).toHaveAttribute("aria-modal", "true")
    await expect(unlock).toBeFocused()

    await unlock.dblclick()
    await gate.getByRole("button", { name: copy.after19Start, exact: true }).dblclick()
    await gate.getByRole("button", { name: copy.after19Complete, exact: true }).dblclick()
    await expect(gate).toBeHidden({ timeout: 20_000 })
    await expect(place).toBeVisible()
    await expect(page.getByTestId("canonical-after19-access")).toHaveAttribute("data-after19-venue-status", "unlocked")
    await expect.poll(() => sessionState(page), { timeout: 20_000 }).toMatchObject({
      age: "AGE-VERIFIED",
      after19: "A19-ON",
      gate: null,
      gateState: "idle",
    })
    await expect.poll(() => page.evaluate(() => document.activeElement?.tagName)).not.toBe("BODY")
    await expect.poll(() => place.evaluate((element) => element.contains(document.activeElement))).toBe(true)
    await page.keyboard.press("Tab")
    await expect.poll(() => place.evaluate((element) => element.contains(document.activeElement))).toBe(true)
  })
}
