import { expect, test, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const LOCALES = ["en", "ko", "ja"] as const
const VIEWPORTS = [
  { name: "phone-narrow", width: 320, height: 720 },
  { name: "phone-standard", width: 390, height: 844 },
  { name: "short-landscape", width: 844, height: 390 },
  { name: "desktop", width: 1440, height: 1000 },
] as const

const PRESENTATION_COPY = {
  en: { requester: "ONDO Table demo verifier", evidence: "K-Tour travel eligibility · yes/no only", retention: "One request · nonce and expiry semantics · no VP stored", approved: "SIMULATED · APPROVED ONCE", unchanged: "unchanged" },
  ko: { requester: "ONDO 테이블 데모 검증자", evidence: "K-Tour 여행 자격 · 예/아니오만", retention: "한 번의 요청 · nonce와 만료 의미 적용 · VP 저장 안 함", approved: "시뮬레이션 · 한 번 승인됨", unchanged: "상태 변경 없음" },
  ja: { requester: "ONDOテーブルのデモ検証者", evidence: "K-Tour旅行資格 · 可否のみ", retention: "一回の依頼 · nonceと有効期限を適用 · VPは保存しない", approved: "シミュレーション · 一回のみ承認", unchanged: "状態変更なし" },
} as const

async function seed(page: Page, locale: typeof LOCALES[number]) {
  await page.addInitScript(({ key, language }) => {
    localStorage.setItem(key, JSON.stringify({
      locale: language,
      onboarding: "ONB-COMPLETE",
      persona: null,
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
      recentVenueIds: [],
      plannedTableRefs: [],
      localSignalPostedVenueIds: [],
      localPulseEvidenceByVenue: {},
      localInteractionBoundarySeen: false,
      commerceLocalBoundarySeen: false,
      commerceReceipts: [],
    }))
  }, { key: DEVICE_KEY, language: locale })
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("blockedbyclient"))
}

async function expectResponsiveTruth(page: Page) {
  const dialog = page.getByTestId("k-tour-id-setup")
  const viewport = page.viewportSize()
  expect(viewport).not.toBeNull()
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveAttribute("data-environment", "simulated")
  await expect(dialog).toHaveAttribute("data-integration-status", "not_configured")
  await expect(page.getByTestId("k-tour-id-environment")).toBeVisible()
  await expect(page.getByTestId("k-tour-id-private-boundary")).toBeAttached()

  const geometry = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    dialog: (() => {
      const rect = document.querySelector<HTMLElement>("[data-testid='k-tour-id-setup']")?.getBoundingClientRect()
      return rect ? { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom } : null
    })(),
  }))
  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1)
  expect(geometry.dialog).not.toBeNull()
  expect(geometry.dialog!.left).toBeGreaterThanOrEqual(-1)
  expect(geometry.dialog!.right).toBeLessThanOrEqual(geometry.viewportWidth + 1)
  expect(geometry.dialog!.top).toBeGreaterThanOrEqual(-1)
  expect(geometry.dialog!.bottom).toBeLessThanOrEqual((viewport?.height ?? 0) + 1)

  const undersized = await dialog.locator("button:visible").evaluateAll((buttons) => buttons.flatMap((button) => {
    const rect = button.getBoundingClientRect()
    return rect.width < 44 || rect.height < 44 ? [{ width: rect.width, height: rect.height, text: button.textContent }] : []
  }))
  expect(undersized).toEqual([])

  const tinyText = await dialog.locator("p:visible,small:visible,dt:visible,dd:visible,strong:visible").evaluateAll((elements) => elements.flatMap((element) => {
    if (element.closest("[aria-hidden='true']")) return []
    const size = Number.parseFloat(getComputedStyle(element).fontSize)
    return size < 12 ? [{ size, text: element.textContent }] : []
  }))
  expect(tinyText).toEqual([])
}

for (const locale of LOCALES) {
  for (const viewport of VIEWPORTS) {
    test(`OPENDID-PIXEL ${locale} ${viewport.name} completes the truthful journey without clipping`, async ({ page }, testInfo) => {
      const pageErrors: string[] = []
      page.on("pageerror", (error) => pageErrors.push(error.message))
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await seed(page, locale)
      await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
      await expect(page.getByTestId("ondo-b-root")).toHaveAttribute("data-locale", locale)
      await page.getByTestId("nav-id").click()
      await page.getByTestId("traveler-id-ktour-id-open").click()
      await expectResponsiveTruth(page)
      await testInfo.attach("method-select", { body: await page.getByTestId("k-tour-id-setup").screenshot(), contentType: "image/png" })

      await page.getByTestId("k-tour-id-method-passport-ekyc").click()
      await expect(page.getByTestId("k-tour-id-consent")).toBeVisible()
      await expectResponsiveTruth(page)
      await testInfo.attach("consent", { body: await page.getByTestId("k-tour-id-setup").screenshot(), contentType: "image/png" })
      await page.getByTestId("k-tour-id-consent-approve").click()

      for (let step = 0; step < 7; step += 1) {
        const action = page.getByTestId("k-tour-id-continue")
        await expect(action).toBeVisible()
        await action.click()
      }
      const credential = page.getByTestId("k-tour-id-credential")
      await expect(credential).toHaveAttribute("data-status", "simulated_ready")
      await expect(credential).toHaveAttribute("data-issuance-count", "1")
      await expectResponsiveTruth(page)
      await testInfo.attach("credential-ready", { body: await page.getByTestId("k-tour-id-setup").screenshot(), contentType: "image/png" })

      await page.getByTestId("k-tour-id-presentation-open").click()
      const request = page.getByTestId("k-tour-id-presentation-request")
      await expect(request.getByTestId("identity-presentation-requester")).toContainText(PRESENTATION_COPY[locale].requester)
      await expect(request.getByTestId("identity-presentation-evidence")).toContainText(PRESENTATION_COPY[locale].evidence)
      await expect(request.getByTestId("identity-presentation-retention")).toContainText(PRESENTATION_COPY[locale].retention)
      await page.getByTestId("k-tour-id-continue").click()
      await expect(page.getByTestId("identity-presentation-predicate")).toContainText(PRESENTATION_COPY[locale].evidence)
      await page.getByTestId("k-tour-id-presentation-approve").click()
      await expect(page.getByTestId("k-tour-id-presentation-result")).toHaveAttribute("data-result", "success")
      await expect(page.getByTestId("identity-presentation-result-status")).toHaveText(PRESENTATION_COPY[locale].approved)
      await expect(page.getByTestId("identity-presentation-credential-state")).toContainText(PRESENTATION_COPY[locale].unchanged)
      await expectResponsiveTruth(page)
      expect(pageErrors).toEqual([])
    })
  }
}
