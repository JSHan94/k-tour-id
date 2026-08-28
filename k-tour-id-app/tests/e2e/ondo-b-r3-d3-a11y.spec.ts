import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"
import {
  CANONICAL_VENUE_ID,
  gotoB,
  openCanonicalVenue,
  openLabs,
  prepareBPage,
  seedB,
  TABLE_ID,
} from "../helpers/ondo-b-qa"

const READY_SESSION = {
  account: "ACC-ACTIVE",
  person: "PER-VERIFIED",
  age: "AGE-VERIFIED",
  ageExpiresAt: "2026-08-20T20:30:00+09:00",
  paymentKyc: "PKY-VERIFIED",
  stamps: 10,
}

async function seedD3(page: Page, locale: "en" | "ko", { labs = false } = {}) {
  await seedB(page, {
    locale,
    local: { autoNight: false },
    session: { ...READY_SESSION, onboarding: "ONB-COMPLETE", persona: "short_term", after19: "A19-OFF", tableMembershipById: {} },
  })
  await page.addInitScript(({ withLabs }) => {
    if (withLabs) {
      sessionStorage.setItem("ondo-b.labs.v1", JSON.stringify({
        acknowledged: true,
        wallet: "WAL-DISCONNECTED",
        bridge: "BRG-IDLE",
        phase: "none",
        mint: "NFT-ELIGIBLE",
        consent: false,
        quoteExpiresAt: null,
        traitStates: {},
      }))
    } else {
      sessionStorage.removeItem("ondo-b.labs.v1")
    }
  }, { withLabs: labs })
}

async function expectNoSeriousAxe(page: Page, selector: string) {
  const result = await new AxeBuilder({ page })
    .include(selector)
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(result.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([])
}

async function expectControlDescription(control: Locator, message: Locator) {
  const id = await message.getAttribute("id")
  expect(id).toBeTruthy()
  await expect(control).toHaveAttribute("aria-describedby", id!)
}

async function expectHydratedShell(page: Page) {
  const nav = page.getByTestId("ondo-main-nav")
  await expect(nav).not.toHaveAttribute("aria-hidden", "true")
  await expect(nav).toHaveJSProperty("inert", false)
}

async function expectCenterHit(control: Locator) {
  await expect.poll(() => control.evaluate((element) => {
    const box = element.getBoundingClientRect()
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
    return hit === element || (hit != null && element.contains(hit))
  })).toBe(true)
}

async function installOneShotDeviceWriteFailure(page: Page) {
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    let pending = true
    Storage.prototype.setItem = function (key, value) {
      if (this === localStorage && key === "ondo-b.device.v1" && pending) {
        pending = false
        throw new DOMException("Quota exceeded", "QuotaExceededError")
      }
      return original.call(this, key, value)
    }
  })
}

async function openTable(page: Page, locale: "en" | "ko", scenario: string) {
  await seedD3(page, locale)
  await gotoB(page, `?qa=1&scenario=${scenario}`)
  await expect(page.getByTestId("ondo-b-root")).toHaveAttribute("data-locale", locale)
  await expectHydratedShell(page)
  const tablesNav = page.getByTestId("nav-tables")
  await expect(tablesNav).toHaveAccessibleName(locale === "ko" ? "테이블" : "Tables")
  await expectCenterHit(tablesNav)
  await tablesNav.click()
  const tables = page.getByTestId("tables-entry")
  await expect(tables).toBeVisible()
  await tables.getByTestId(`table-open-${TABLE_ID}`).click()
  await expect(page.getByTestId("table-join")).toBeVisible()
}

async function seedLabs(page: Page, locale: "en" | "ko") {
  await seedD3(page, locale, { labs: true })
  await gotoB(page, "?qa=1&scenario=labs-wallet-fail")
  await expect(page.getByTestId("ondo-b-root")).toHaveAttribute("data-locale", locale)
  await expectHydratedShell(page)
  await expectCenterHit(page.getByTestId("nav-my"))
  await openLabs(page)
  await expect(page.getByTestId("labs-overlay")).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await prepareBPage(page)
})

for (const locale of ["en", "ko"] as const) {
  const copy = locale === "ko"
    ? {
        signalNote: "키오스크에서 먼저 주문해요.",
        walletFailure: "테스트용 연결을 완료하지 못했어요. ONDO 계정, 본인 확인(KYC), 멀티체인 지갑, 실제 자산, 거래 또는 실제 계정에는 아무 영향이 없습니다.",
        walletConnect: "서명 기능 연결 시뮬레이션",
        walletRetry: "다시 시도",
      }
    : {
        signalNote: "Order at the kiosk first.",
        walletFailure: "The test connection did not complete. No ONDO account, KYC, multichain wallet, real asset, transaction, or real account was affected.",
        walletConnect: "Simulate signer connection",
        walletRetry: "Try again",
      }

  test(`R3 D3-001 ${locale} Table device-save failure owns one alert and focuses its retry`, async ({ page }) => {
    test.setTimeout(45_000)
    await openTable(page, locale, "save-failed")
    const detail = page.getByTestId("table-detail")
    await detail.getByTestId("table-join-draft").fill(locale === "ko" ? "창가 자리, 한국어와 영어 모두 괜찮아요." : "Window seat; Korean and English both work.")
    await detail.getByTestId("table-join").click()
    const confirmation = detail.getByTestId("table-join-confirmation")
    await expect(confirmation).toBeVisible()

    const confirm = detail.getByTestId("table-join-confirm")
    await installOneShotDeviceWriteFailure(page)
    await confirm.click()
    const alert = detail.getByTestId("table-join-save-error")
    await expect(alert).toHaveAttribute("role", "alert")
    await expect(alert).toHaveText(locale === "ko"
      ? "My Korea에 계획을 저장하지 못해 아직 참여하지 않았어요. 다시 시도해 주세요."
      : "My Korea could not save the plan, so you have not joined. Try again.")
    await expect(detail.locator("[role='alert']")).toHaveCount(1)
    await expect(confirmation).toBeVisible()
    await expect(detail.getByTestId("table-open-chat")).toHaveCount(0)
    await expect(confirm).toBeFocused()
    await expectNoSeriousAxe(page, "[data-testid='table-detail']")

    await confirm.click()
    await expect(alert).toHaveCount(0)
    await expect(detail.getByTestId("table-open-chat")).toBeFocused()
  })

  test(`R3 D3-001 ${locale} Local Signal device-save failure preserves its exact draft and recovery`, async ({ page }) => {
    test.setTimeout(60_000)
    await seedD3(page, locale)
    await openCanonicalVenue(page)
    await expect(page.getByTestId("ondo-b-root")).toHaveAttribute("data-locale", locale)
    await page.getByTestId("canonical-local-signal-open").click()
    const signal = page.getByTestId("ondo-b-local-signal")
    const tag = signal.getByRole("button", { name: locale === "ko" ? "지금은 여유로워요" : "Calm right now", exact: true })
    await tag.click()
    await signal.locator("textarea").fill(copy.signalNote)
    await signal.getByTestId("local-signal-person-check").click()
    await expect(page.getByTestId("ondo-b-action-gate")).toHaveCount(0)
    await expect(signal.getByText(locale === "ko"
      ? "확인을 마쳤어요. 이 기기에 로컬 시그널을 저장할 수 있어요."
      : "Confirmation complete. Your Local Signal is ready to save on this device.", { exact: true })).toHaveAttribute("role", "status")
    const post = signal.getByTestId("local-signal-post")
    await expect(post).toBeVisible()
    await expect(post).toBeFocused()
    await installOneShotDeviceWriteFailure(page)
    await post.click()

    const alert = signal.getByTestId("local-signal-post-error")
    await expect(alert).toHaveAttribute("role", "alert")
    await expect(alert).toHaveText(locale === "ko"
      ? "이 기기에 이 로컬 시그널을 저장하지 못했어요. 정확한 작성 내용과 장소는 그대로 열려 있습니다."
      : "Could not save this Local Signal on this device. Your exact draft and place remain open.")
    await expect(signal.locator("[role='alert']")).toHaveCount(1)
    await expect(signal.locator("textarea")).toHaveValue(copy.signalNote)
    await expect(tag).toHaveAttribute("aria-pressed", "true")
    await expect(post).toBeFocused()
    await expectNoSeriousAxe(page, "[data-testid='ondo-b-local-signal']")

    await post.click()
    await expect(signal).toBeHidden()
    await expect(page.getByTestId("canonical-local-signal-open")).toBeFocused()
  })

  test(`R3 D3-002 ${locale} Labs wallet failure owns one alert and clears it on retry`, async ({ page }) => {
    test.setTimeout(45_000)
    await seedLabs(page, locale)
    const labs = page.getByTestId("labs-overlay")
    await labs.getByRole("button", { name: copy.walletConnect, exact: true }).click()
    await expect(labs).toHaveAttribute("data-wallet-state", "WAL-FAILED")

    const outcome = page.getByTestId("labs-wallet-outcome")
    await expect(outcome).toHaveAttribute("role", "alert")
    await expect(outcome).toHaveText(copy.walletFailure)
    await expect(labs.getByText(copy.walletFailure, { exact: true })).toHaveCount(1)
    await expect(labs.locator("[role='alert']")).toHaveCount(1)
    const retry = labs.getByRole("button", { name: copy.walletRetry, exact: true })
    await expect(retry).toBeFocused()
    await expectControlDescription(retry, outcome)
    await expectNoSeriousAxe(page, "[data-testid='labs-overlay']")

    await page.evaluate(() => {
      sessionStorage.removeItem("ondo.qa.scenario.v1")
      history.replaceState({}, "", `${location.pathname}?qa=1`)
    })
    await retry.click()
    await expect(page.getByTestId("labs-wallet-outcome")).toHaveCount(0)
    await expect(labs.locator("[role='alert']")).toHaveCount(0)
    await expect(labs).toHaveAttribute("data-wallet-state", "WAL-READY")
    await expect(page.getByText("0x8a71…ondo_fixture", { exact: true })).toBeVisible()
  })
}
