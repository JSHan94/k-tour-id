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

const READY_SESSION = {
  account: "ACC-ACTIVE",
  person: "PER-VERIFIED",
  age: "AGE-UNVERIFIED",
  paymentKyc: "PKY-NOT-STARTED",
  reputation: { identity: "verified", visit: "repeat", contribution: "helpful", meetup: "reliable" },
}

const DIETARY = {
  en: ["Vegetarian", "Vegan", "Halal", "Allergy-aware"],
  ko: ["채식", "비건", "할랄", "알레르기 주의"],
} as const

const PROFILE = {
  en: {
    edit: "Edit public fields",
    fields: [
      { id: "profile-from", name: "From", privateName: "From: private. Show From publicly", publicName: "From: public. Make From private" },
      { id: "profile-lives-in", name: "Lives in", privateName: "Lives in: private. Show Lives in publicly", publicName: "Lives in: public. Make Lives in private" },
      { id: "profile-languages", name: "Languages", privateName: "Languages: private. Show Languages publicly", publicName: "Languages: public. Make Languages private" },
    ],
    description: "Self-declared",
  },
  ko: {
    edit: "공개 필드 편집",
    fields: [
      { id: "profile-from", name: "출신", privateName: "출신: 비공개. 출신 공개하기", publicName: "출신: 공개 중. 출신 비공개로 전환" },
      { id: "profile-lives-in", name: "거주지", privateName: "거주지: 비공개. 거주지 공개하기", publicName: "거주지: 공개 중. 거주지 비공개로 전환" },
      { id: "profile-languages", name: "사용 언어", privateName: "사용 언어: 비공개. 사용 언어 공개하기", publicName: "사용 언어: 공개 중. 사용 언어 비공개로 전환" },
    ],
    description: "본인 입력",
  },
} as const

async function expectNoSeriousAxe(page: Page, selector: string) {
  const result = await new AxeBuilder({ page })
    .include(selector)
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(result.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
}

async function expectTextWraps(scope: Locator, viewport: string) {
  const overflow = await scope.evaluate((root) => {
    const nodes = [root, ...root.querySelectorAll<HTMLElement>("h1, h2, h3, p, small, strong, label, legend, button, [role='button']")]
    return nodes
      .filter((node) => node.getClientRects().length > 0 && node.clientWidth > 0 && node.scrollWidth > node.clientWidth + 1)
      .map((node) => ({ tag: node.tagName, text: node.textContent?.trim().slice(0, 100), clientWidth: node.clientWidth, scrollWidth: node.scrollWidth }))
  })
  expect(overflow, `text clipping at ${viewport}`).toEqual([])
}

async function expectLocalVisibleFocus(page: Page, scope: Locator) {
  await expect.poll(async () => scope.evaluate((root) => root.contains(document.activeElement))).toBe(true)
  const focused = page.locator(":focus")
  await expect(focused).toHaveCount(1)
  await expect(focused).toBeVisible()
  expect(await focused.evaluate((node) => node.tagName)).not.toBe("BODY")
  const rect = await focused.evaluate((node) => {
    const box = node.getBoundingClientRect()
    return { top: box.top, bottom: box.bottom, left: box.left, right: box.right, viewportWidth: innerWidth, viewportHeight: innerHeight }
  })
  expect(rect.bottom).toBeGreaterThan(0)
  expect(rect.top).toBeLessThan(rect.viewportHeight)
  expect(rect.right).toBeGreaterThan(0)
  expect(rect.left).toBeLessThan(rect.viewportWidth)
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
  test(`D4-001 ${locale} My and Trust keep four truthful browser-local axes at all six widths`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium")
    await seedB(page, { locale, session: READY_SESSION })

    for (const viewport of B_SLEEK_VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await gotoB(page)
      await page.getByTestId("nav-my").click()
      const my = page.getByTestId("ondo-my-entry")
      const historyName = locale === "ko" ? "활동 이력" : "Activity history"
      const history = my.getByRole("region", { name: historyName })
      const expected = locale === "ko"
        ? ["본인 확인", "시뮬레이션 방문 기록", "로컬 미리보기 기여", "로컬 미리보기 모임"]
        : ["Identity check", "Simulated visit records", "Local-preview contributions", "Local-preview Tables"]
      for (const label of expected) await expect(history.getByText(label, { exact: true })).toBeVisible()
      await expect(history).not.toContainText(/Confirmed visits|확인된 방문|specific evidence|특정 증거|verified visits|검증된 방문/i)
      await expectTextWraps(history, `${locale} My ${viewport.id}`)

      await page.getByTestId("nav-id").click()
      const trust = page.getByTestId("ondo-trust-panel")
      for (const label of expected) await expect(trust.getByText(label, { exact: true })).toBeVisible()
      await expect(trust).not.toContainText(/Confirmed visits|확인된 방문|specific evidence|특정 증거|verified visits|검증된 방문/i)
      await expectTextWraps(trust, `${locale} Trust ${viewport.id}`)
      await expectNoSeriousAxe(page, "[data-testid='ondo-trust-panel']")
    }
  })

  test(`D4-002 ${locale} navigation, identity root, and person gate use contextual identity language`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium")
    await seedB(page, {
      locale,
      session: { account: "ACC-ACTIVE", person: "PER-UNVERIFIED", age: "AGE-UNVERIFIED", paymentKyc: "PKY-NOT-STARTED" },
    })

    for (const viewport of B_SLEEK_VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await gotoB(page)
      const nav = page.getByTestId("ondo-main-nav")
      if (locale === "ko") {
        await expect(nav.getByText("신원", { exact: true })).toBeVisible()
        await expect(nav.getByText("확인", { exact: true })).toHaveCount(0)
      }
      await page.getByTestId("nav-id").click()
      const identity = page.getByTestId("ondo-identity-entry")
      if (locale === "ko") {
        await expect(identity.getByRole("heading", { name: "계정과 신원 확인", exact: true })).toBeVisible()
        for (const copy of ["계정 사용 가능", "본인 확인 전", "19+ 확인 전", "결제용 본인 확인(KYC) 전"]) await expect(identity.getByText(copy, { exact: true })).toBeVisible()
        await expect(identity).not.toContainText(/사람 확인|특정 신원 관련 자격/)
      } else {
        for (const copy of ["Account ready", "Identity check not completed", "19+ not checked", "Payment KYC not completed"]) await expect(identity.getByText(copy, { exact: true })).toBeVisible()
      }
      await expectTextWraps(identity, `${locale} identity ${viewport.id}`)

      await page.evaluate(() => {
        const current = JSON.parse(sessionStorage.getItem("ondo.session.v3") ?? "{}")
        sessionStorage.setItem("ondo.session.v3", JSON.stringify({
          ...current,
          gate: {
            tokenId: "RT-MINT_BADGE-D4-002",
            cta: "MINT_BADGE",
            gateQueue: ["person"],
            activeGate: "person",
            createdAt: "2026-08-19T11:29:00.000Z",
            expiresAt: "2026-08-19T11:44:00.000Z",
          },
          gateState: "pending",
        }))
      })
      await page.reload({ waitUntil: "domcontentloaded" })
      const gate = page.getByTestId("ondo-gate-overlay")
      await expect(gate).toBeVisible()
      if (locale === "ko") {
        await expect(gate.getByRole("heading", { name: "본인 확인을 완료해 주세요", exact: true })).toBeVisible()
        await expect(gate.getByText("본인 확인", { exact: true })).toBeVisible()
        await expect(gate).not.toContainText(/사람 확인|특정 신원 관련 자격/)
      } else {
        await expect(gate.getByRole("heading", { name: "Complete an identity check", exact: true })).toBeVisible()
        await expect(gate.getByText("Identity", { exact: true })).toBeVisible()
      }
      await expectTextWraps(gate, `${locale} identity gate ${viewport.id}`)
      await expectNoSeriousAxe(page, "[data-testid='ondo-gate-overlay']")
      await gate.getByRole("button", { name: locale === "ko" ? "변경 없이 돌아가기" : "Return without changes", exact: true }).click()
    }
  })

  test(`D4-003 ${locale} concrete dietary needs persist from onboarding to My at all six widths`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium")
    await gotoB(page)

    for (const viewport of B_SLEEK_VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.evaluate((nextLocale) => {
        localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale: nextLocale, guideSeen: true, autoNight: true, savedVenueIds: [], discoveryPreferences: [] }))
        sessionStorage.removeItem("ondo.session.v3")
      }, locale)
      await page.reload({ waitUntil: "domcontentloaded" })
      const onboarding = page.getByTestId("ondo-onboarding")
      await onboarding.getByRole("button", { name: locale === "ko" ? "시작하기" : "Get started", exact: true }).click()
      await onboarding.getByTestId("persona-short_term").click()
      await onboarding.getByRole("button", { name: locale === "ko" ? "한 끼 취향 고르기" : "Choose meal preferences", exact: true }).click()
      const preferences = onboarding.getByTestId("onboarding-step-preferences")
      await expect(preferences.getByRole("heading", { name: locale === "ko" ? "식이 요구사항" : "Dietary requirements", exact: true })).toBeVisible()
      for (const name of DIETARY[locale]) await expect(preferences.getByRole("button", { name, exact: true })).toHaveAttribute("aria-pressed", "false")
      await expect(preferences).not.toContainText(/Dietary preferences|식이 선택/)
      await preferences.getByRole("button", { name: DIETARY[locale][1], exact: true }).click()
      await preferences.getByRole("button", { name: DIETARY[locale][3], exact: true }).click()
      await expectTextWraps(preferences, `${locale} onboarding dietary ${viewport.id}`)
      await expectNoSeriousAxe(page, "[data-testid='ondo-onboarding']")
      await page.getByTestId("onboarding-finish").click()

      await page.getByTestId("nav-my").click()
      const settings = page.getByTestId("discovery-settings")
      await expect(settings.getByRole("group", { name: locale === "ko" ? "식이 요구사항" : "Dietary requirements", exact: true })).toBeVisible()
      await expect(settings.getByTestId("discovery-preference-vegan")).toHaveAttribute("aria-pressed", "true")
      await expect(settings.getByTestId("discovery-preference-allergy_aware")).toHaveAttribute("aria-pressed", "true")
      await expect(settings).not.toContainText(/Dietary preferences|식이 선택/)
      await expectTextWraps(settings, `${locale} My dietary ${viewport.id}`)
      await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem("ondo.preferences.v3") ?? "{}").discoveryPreferences)).toEqual(["vegan", "allergy_aware"])
    }
  })

  test(`D4-004 ${locale} profile field descriptions and per-field toggle names remain separate at all six widths`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium")
    await seedB(page, {
      locale,
      session: {
        account: "ACC-ACTIVE",
        profile: { displayName: "Mina", languages: [], shareFrom: false, shareLivesIn: false, shareLanguages: false },
      },
    })
    const copy = PROFILE[locale]

    for (const viewport of B_SLEEK_VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await gotoB(page)
      await page.getByTestId("nav-id").click()
      const profile = page.getByTestId("ondo-profile-panel")
      await profile.getByRole("button", { name: copy.edit, exact: true }).click()

      for (const field of copy.fields) {
        const textbox = profile.getByRole("textbox", { name: field.name, exact: true })
        await expect(textbox).toHaveCount(1)
        await expect(textbox).toHaveAttribute("aria-describedby", `${field.id}-description`)
        await expect(profile.locator(`#${field.id}-description`)).toHaveText(copy.description)
        await expect(profile.getByRole("textbox", { name: `${field.name} ${copy.description}`, exact: true })).toHaveCount(0)
        await expect(profile.getByRole("button", { name: field.privateName, exact: true })).toHaveCount(1)
      }
      expect(new Set(copy.fields.map(({ privateName }) => privateName)).size).toBe(copy.fields.length)

      const firstToggle = profile.getByRole("button", { name: copy.fields[0].privateName, exact: true })
      await firstToggle.click()
      await expect(profile.getByRole("button", { name: copy.fields[0].publicName, exact: true })).toHaveAttribute("aria-pressed", "true")
      await profile.getByRole("textbox", { name: copy.fields[0].name, exact: true }).focus()
      await expectLocalVisibleFocus(page, profile)
      await page.keyboard.press("Tab")
      await expect(profile.getByRole("button", { name: copy.fields[0].publicName, exact: true })).toBeFocused()
      await expectLocalVisibleFocus(page, profile)
      await page.keyboard.press("Tab")
      await expectLocalVisibleFocus(page, profile)
      await expectTextWraps(profile, `${locale} Profile ${viewport.id}`)
      await expectNoSeriousAxe(page, "[data-testid='ondo-profile-panel']")
    }
  })
}

test("D4-003 legacy umbrella preference is discarded instead of becoming a concrete dietary claim", async ({ page }) => {
  await seedB(page, { local: { discoveryPreferences: ["diet"] } })
  await gotoB(page)
  await page.getByTestId("nav-my").click()
  const settings = page.getByTestId("discovery-settings")
  await expect(settings).not.toContainText(/Dietary preferences|식이 선택/)
  for (const id of ["vegetarian", "vegan", "halal", "allergy_aware"]) {
    await expect(settings.getByTestId(`discovery-preference-${id}`)).toHaveAttribute("aria-pressed", "false")
  }
  await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem("ondo.preferences.v3") ?? "{}").discoveryPreferences)).toEqual([])
})
