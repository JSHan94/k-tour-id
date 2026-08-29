import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Browser, type Locator, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const SYNTHETIC_PASSPORT_IMAGE = {
  name: "synthetic-passport-placeholder.png",
  mimeType: "image/png",
  buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"),
}

type Locale = "en" | "ko" | "ja"
type IdentityMethod = "mobile_id" | "mobile_residence_card" | "passport_ekyc"
type CredentialFixture = "expired" | "suspended" | "revoked"
type PresentationFixture = "PRESENTATION_DENIED" | "PRESENTATION_REQUEST_EXPIRED" | "PRESENTATION_REPLAY"
type IdentityQa = {
  identitySetupOutcome?: "PROVIDER_TIMEOUT"
  identity?: {
    outcome?: "IDENTITY_METHOD_UNAVAILABLE"
    credentialStatus?: CredentialFixture
    presentationOutcome?: PresentationFixture
  }
}

const COPY = {
  en: {
    guest: "Explore without setup",
    environment: "ON-DEVICE",
    privateCredential: "Private K-Tour service credential · no identity provider or OpenDID service is connected, so no real DID or VC is issued. Not a government ID, visa, residence card, permit or immigration status.",
    mobileRetention: "No Mobile ID payload, name, birth date, signed callback or provider result is stored.",
    residenceRetention: "No residence-card payload, name, birth date, signed callback or provider result is stored.",
    passportRetention: "No passport fields, face image, provider result, DID or VC payload is stored.",
    walletConsent: "After K-Tour ID is ready, ONDO prepares a device-only travel balance in this tab.",
    passportProvider: "Passport eKYC uses a separate provider — not OmniOne CX",
    assuranceChange: "Passport eKYC does not verify registered-resident status and is not an equivalent residence-card check.",
    presentationRequester: "ONDO Table",
    presentationPurpose: "Minimum trip eligibility for this one request",
    presentationEvidence: "K-Tour travel eligibility · yes/no only",
    presentationRetention: "This request only · expires automatically · result not stored",
    presentationApproved: "APPROVED ONCE",
    unchanged: "unchanged",
    backToKTourId: "Back to K-Tour ID",
    returnTraveler: "Return to Travel Pass",
    ocrTitle: "Choose one passport image",
    ocrReviewTitle: "Review the minimum result",
    ocrResult: "No provider decision",
  },
  ko: {
    guest: "설정 없이 탐색",
    environment: "기기 내",
    privateCredential: "민간 K-Tour 서비스 자격증명 · 신원확인 기관과 OpenDID 서비스가 연결되지 않아 실제 DID·VC를 발급하지 않습니다. 정부 신분증·비자·외국인등록증·체류허가·체류자격이 아닙니다.",
    mobileRetention: "모바일 신분증 원문·이름·생년월일·서명 콜백·기관 응답은 저장하지 않습니다.",
    residenceRetention: "외국인등록증 원문·이름·생년월일·서명 콜백·기관 응답은 저장하지 않습니다.",
    passportRetention: "여권 항목·얼굴 이미지·기관 결과·DID·VC 원문은 저장하지 않고",
    walletConsent: "K-Tour ID 준비가 끝나면 ONDO가 이 탭에 기기 전용 여행 잔액을 준비합니다.",
    passportProvider: "여권 eKYC는 OmniOne CX가 아닌 별도 제공자",
    assuranceChange: "여권 eKYC는 등록외국인 체류 자격을 확인하지 않으며 외국인등록증 확인과 동등하지 않습니다.",
    presentationRequester: "ONDO 테이블",
    presentationPurpose: "이번 한 번의 요청을 위한 최소 여행 자격 확인",
    presentationEvidence: "K-Tour 여행 자격 · 예/아니오만",
    presentationRetention: "이번 요청에만 사용 · 자동 만료 · 결과 저장 안 함",
    presentationApproved: "한 번 승인됨",
    unchanged: "상태 변경 없음",
    backToKTourId: "K-Tour ID로 돌아가기",
    returnTraveler: "여행 패스로 돌아가기",
    ocrTitle: "여권 이미지 한 장 선택",
    ocrReviewTitle: "최소 결과 확인",
    ocrResult: "제공자 판정 없음",
  },
  ja: {
    guest: "設定せずに見る",
    environment: "端末内",
    privateCredential: "民間のK-Tourサービス資格情報 · 本人確認事業者とOpenDIDサービスは未接続のため、実際のDID・VCは発行しません。公的身分証、ビザ、在留カード、在留許可、在留資格ではありません。",
    mobileRetention: "モバイルID本文、氏名、生年月日、署名済みコールバック、事業者結果は保存しません。",
    residenceRetention: "在留カード本文、氏名、生年月日、署名済みコールバック、事業者結果は保存しません。",
    passportRetention: "パスポート項目、顔画像、事業者結果、DID・VC本文は保存せず",
    walletConsent: "K-Tour IDの準備後、ONDOがこのタブに端末専用の旅行残高を用意します。",
    passportProvider: "パスポートeKYCはOmniOne CXではなく別の事業者",
    assuranceChange: "パスポートeKYCは登録居住者の在留資格を確認せず、在留カード確認と同等ではありません。",
    presentationRequester: "ONDOテーブル",
    presentationPurpose: "今回一回の依頼に必要な最小限の旅行資格確認",
    presentationEvidence: "K-Tour旅行資格 · 可否のみ",
    presentationRetention: "今回の依頼だけに使用 · 自動で期限切れ · 結果は保存しない",
    presentationApproved: "一回のみ承認",
    unchanged: "状態変更なし",
    backToKTourId: "K-Tour IDに戻る",
    returnTraveler: "トラベルパスに戻る",
    ocrTitle: "パスポート画像を1枚選択",
    ocrReviewTitle: "最小限の結果を確認",
    ocrResult: "事業者の判定なし",
  },
} as const

const METHOD_TEST_IDS: Record<IdentityMethod, string> = {
  mobile_id: "k-tour-id-method-mobile-id",
  mobile_residence_card: "k-tour-id-method-mobile-residence-card",
  passport_ekyc: "k-tour-id-method-passport-ekyc",
}

const RAW_PROTOCOL_COPY = /KTourVisitorCredential|\bholder\b|\bDID\b|\bVC\b|\bVP\b|\bnonce\b/i

const METHOD_EVIDENCE = {
  en: {
    mobile_id: /Mobile ID/i,
    mobile_residence_card: /Mobile Residence Card/i,
    passport_ekyc: /NFC\s*\/\s*OCR.*face.*liveness/i,
  },
  ko: {
    mobile_id: /모바일 신분증/,
    mobile_residence_card: /모바일 외국인등록증/,
    passport_ekyc: /NFC\s*\/\s*OCR.*얼굴.*라이브니스/,
  },
  ja: {
    mobile_id: /モバイル身分証/,
    mobile_residence_card: /モバイル在留カード/,
    passport_ekyc: /NFC\s*\/\s*OCR.*顔.*ライブネス/,
  },
} as const

const EXISTING_AXIS_TEST_IDS = [
  "traveler-id-account",
  "traveler-id-person",
  "traveler-id-age",
  "traveler-id-payment",
] as const

test.describe.configure({ timeout: 120_000 })

async function seedB(page: Page, locale: Locale, onboarding: "ONB-NEW" | "ONB-COMPLETE", qa?: IdentityQa) {
  await page.addInitScript(({ key, language, onboardingState, injected }) => {
    localStorage.setItem(key, JSON.stringify({
      locale: language,
      onboarding: onboardingState,
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
    if (injected) (window as Window & { __ONDO_B_QA__?: IdentityQa }).__ONDO_B_QA__ = injected
  }, { key: DEVICE_KEY, language: locale, onboardingState: onboarding, injected: qa })
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("blockedbyclient"))
}

async function openB(page: Page, locale: Locale, onboarding: "ONB-NEW" | "ONB-COMPLETE", qa?: IdentityQa) {
  await seedB(page, locale, onboarding, qa)
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await expect(page.locator("html")).toHaveAttribute("lang", locale)
  await expect(page.getByTestId("ondo-b-root")).toBeVisible()
}

async function openOnboardingSetup(page: Page, locale: Locale = "en") {
  await openB(page, locale, "ONB-NEW")
  const onboarding = page.getByTestId("ondo-onboarding")
  const opener = onboarding.getByTestId("k-tour-id-setup-open")
  await expect(page.getByTestId("onboarding-step-value")).toBeVisible()
  await expect(opener).toBeVisible()
  await opener.click()
  const setup = page.getByTestId("k-tour-id-setup")
  await expect(setup).toBeVisible()
  return { onboarding, opener, setup }
}

async function openTravelerSetup(page: Page, locale: Locale = "en", qa?: IdentityQa) {
  await openB(page, locale, "ONB-COMPLETE", qa)
  await page.getByTestId("nav-id").click()
  const traveler = page.getByTestId("ondo-b-traveler-id")
  await expect(traveler).toBeVisible()
  for (const testId of EXISTING_AXIS_TEST_IDS) await expect(traveler.getByTestId(testId)).toBeVisible()
  const credential = traveler.getByTestId("traveler-id-credential")
  const opener = traveler.getByTestId("traveler-id-ktour-id-open")
  await expect(credential).toHaveAttribute("data-status", "none")
  await expect(opener).toBeVisible()
  await opener.click()
  const setup = page.getByTestId("k-tour-id-setup")
  await expect(setup).toBeVisible()
  return { traveler, credential, opener, setup }
}

async function selectMethod(setup: Locator, method: IdentityMethod) {
  await setup.getByTestId(METHOD_TEST_IDS[method]).click()
  const consent = setup.getByTestId("k-tour-id-consent")
  await expect(consent).toBeVisible()
  for (const testId of [
    "identity-consent-requester",
    "identity-consent-purpose",
    "identity-consent-provider",
    "identity-consent-evidence",
    "identity-consent-retention",
    "identity-consent-wallet",
  ]) await expect(consent.getByTestId(testId)).not.toBeEmpty()
  return consent
}

async function advanceUntil(setup: Locator, testId: string, limit = 14) {
  const target = setup.getByTestId(testId)
  for (let attempt = 0; attempt < limit; attempt += 1) {
    if (await target.isVisible().catch(() => false)) return target
    const advance = setup.getByTestId("k-tour-id-continue")
    await expect(advance, `no continuation action before ${testId}`).toBeVisible()
    await advance.click()
  }
  await expect(target, `journey did not reach ${testId}`).toBeVisible()
  return target
}

async function approveConsent(setup: Locator) {
  await setup.getByTestId("k-tour-id-consent-approve").click()
}

async function reachPassportDocument(setup: Locator) {
  const consent = await selectMethod(setup, "passport_ekyc")
  await expect(consent.getByTestId("identity-consent-provider")).toContainText(/separate provider|별도 제공자|別の事業者/i)
  await approveConsent(setup)
  return advanceUntil(setup, "k-tour-id-passport-document")
}

async function completeSimulatedPassportOcr(setup: Locator) {
  const document = setup.getByTestId("k-tour-id-passport-document")
  await document.getByTestId("passport-ocr-input").setInputFiles(SYNTHETIC_PASSPORT_IMAGE)
  await expect(document).toHaveAttribute("data-ocr-stage", "preview")
  await expect(document.getByTestId("passport-ocr-preview")).toBeVisible()
  await document.getByTestId("passport-ocr-start").click()
  await expect(document.getByTestId("passport-ocr-processing")).toBeVisible()
  await expect(document).toHaveAttribute("data-ocr-stage", "review")
  await expect(document.getByTestId("passport-ocr-review")).toBeVisible()
  await document.getByTestId("k-tour-id-continue").click()
}

async function reachPassportEvidence(setup: Locator) {
  await reachPassportDocument(setup)
  await completeSimulatedPassportOcr(setup)
  await expect(setup.getByTestId("k-tour-id-passport-face")).toBeVisible()
  return advanceUntil(setup, "k-tour-id-evidence-preview")
}

async function reachCredential(setup: Locator, rapidIssue = false, consumerLocale?: Exclude<Locale, "en">) {
  await reachPassportEvidence(setup)
  const issuance = await advanceUntil(setup, "k-tour-id-issuance-preview")
  await expect(issuance).toBeVisible()
  if (rapidIssue) {
    const issue = setup.getByTestId("k-tour-id-continue")
    await expect(issue).toBeVisible()
    await issue.evaluate((button) => {
      for (let attempt = 0; attempt < 10; attempt += 1) (button as HTMLButtonElement).click()
    })
  }
  const holder = await advanceUntil(setup, "k-tour-id-holder-delivery")
  await expect(holder).toBeVisible()
  if (consumerLocale) await expect(holder).not.toContainText(RAW_PROTOCOL_COPY)
  return advanceUntil(setup, "k-tour-id-credential")
}

async function reachSuccessfulPresentationResult(setup: Locator) {
  await reachCredential(setup)
  await setup.getByTestId("k-tour-id-presentation-open").click()
  await advanceUntil(setup, "k-tour-id-presentation-consent")
  await setup.getByTestId("k-tour-id-presentation-approve").click()
  const result = setup.getByTestId("k-tour-id-presentation-result")
  await expect(result).toHaveAttribute("data-result", "success")
  return result
}

async function setIdentityQa(page: Page, qa: NonNullable<IdentityQa["identity"]>) {
  await page.evaluate((identity) => {
    const target = window as Window & { __ONDO_B_QA__?: IdentityQa }
    target.__ONDO_B_QA__ = { ...(target.__ONDO_B_QA__ ?? {}), identity }
  }, qa)
}

async function storageSnapshot(page: Page) {
  return page.evaluate(async () => ({
    local: Object.fromEntries(Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
      .filter((key): key is string => key !== null)
      .map((key) => [key, localStorage.getItem(key)])),
    session: Object.fromEntries(Array.from({ length: sessionStorage.length }, (_, index) => sessionStorage.key(index))
      .filter((key): key is string => key !== null)
      .map((key) => [key, sessionStorage.getItem(key)])),
    databases: (await indexedDB.databases()).map(({ name, version }) => ({ name, version })),
    caches: await caches.keys(),
  }))
}

async function installStorageWriteProbe(page: Page) {
  await page.evaluate(() => {
    const target = window as Window & { __KTOUR_ID_STORAGE_WRITES__?: string[] }
    target.__KTOUR_ID_STORAGE_WRITES__ = []
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key: string, value: string) {
      if (this === localStorage || this === sessionStorage) {
        target.__KTOUR_ID_STORAGE_WRITES__?.push(`${this === localStorage ? "local" : "session"}:${key}:${value}`)
      }
      return original.call(this, key, value)
    }
  })
}

async function storageWrites(page: Page) {
  return page.evaluate(() => (window as Window & { __KTOUR_ID_STORAGE_WRITES__?: string[] }).__KTOUR_ID_STORAGE_WRITES__ ?? [])
}

async function newSeededPage(browser: Browser, locale: Locale, qa?: IdentityQa) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  await openB(page, locale, "ONB-COMPLETE", qa)
  return { context, page }
}

test("OPENDID-E2E-001 guest skip remains ungated and preserves the existing onboarding contract", async ({ page }) => {
  await openB(page, "en", "ONB-NEW")
  await expect(page.getByTestId("ondo-onboarding")).toBeVisible()
  await expect(page.getByTestId("onboarding-step-value")).toBeVisible()
  await page.getByRole("button", { name: COPY.en.guest, exact: true }).click()

  await expect(page.getByTestId("ondo-onboarding")).toHaveCount(0)
  await expect(page.getByTestId("k-tour-id-setup")).toHaveCount(0)
  await expect(page.getByTestId("ondo-b-nation")).toBeVisible()
  await expect(page.getByTestId("nav-ondo")).toHaveAttribute("aria-current", "page")
  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}"), DEVICE_KEY)
  expect(stored).toMatchObject({ onboarding: "ONB-COMPLETE", persona: null, discoveryPreferences: [] })
})

test("OPENDID-E2E-002 both optional entries open the same simulated setup without replacing frozen testids", async ({ browser }) => {
  const onboardingContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const onboardingPage = await onboardingContext.newPage()
  const onboardingEntry = await openOnboardingSetup(onboardingPage)
  await expect(onboardingEntry.setup.getByTestId("k-tour-id-environment")).toHaveText(COPY.en.environment)
  await expect(onboardingEntry.setup.getByTestId("k-tour-id-private-boundary")).toHaveText(COPY.en.privateCredential)
  await onboardingEntry.setup.getByTestId("k-tour-id-cancel").click()
  await expect(onboardingEntry.setup).toHaveCount(0)
  await expect(onboardingEntry.opener).toBeFocused()
  await onboardingContext.close()

  const travelerContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const travelerPage = await travelerContext.newPage()
  const travelerEntry = await openTravelerSetup(travelerPage)
  await expect(travelerEntry.setup.getByTestId("k-tour-id-environment")).toHaveText(COPY.en.environment)
  await expect(travelerEntry.setup.getByTestId("k-tour-id-private-boundary")).toHaveText(COPY.en.privateCredential)
  await travelerEntry.setup.getByTestId("k-tour-id-cancel").click()
  await expect(travelerEntry.setup).toHaveCount(0)
  await expect(travelerEntry.opener).toBeFocused()
  await travelerContext.close()
})

test("OPENDID-E2E-003 EN KO JA expose all three consent/provider truths", async ({ browser }) => {
  for (const locale of ["en", "ko", "ja"] as const) {
    for (const method of ["mobile_id", "mobile_residence_card", "passport_ekyc"] as const) {
      const { context, page } = await newSeededPage(browser, locale)
      await page.getByTestId("nav-id").click()
      await page.getByTestId("traveler-id-ktour-id-open").click()
      const setup = page.getByTestId("k-tour-id-setup")
      await expect(setup.getByTestId("k-tour-id-environment")).toHaveText(COPY[locale].environment)
      await expect(setup.getByTestId("k-tour-id-private-boundary")).toHaveText(COPY[locale].privateCredential)
      const consent = await selectMethod(setup, method)
      const provider = consent.getByTestId("identity-consent-provider")
      const evidence = consent.getByTestId("identity-consent-evidence")
      const retention = consent.getByTestId("identity-consent-retention")
      if (method === "passport_ekyc") await expect(provider).toContainText(COPY[locale].passportProvider)
      else await expect(provider).toContainText("OmniOne CX")
      await expect(evidence).toContainText(METHOD_EVIDENCE[locale][method])
      await expect(retention).toContainText(COPY[locale][`${method === "passport_ekyc" ? "passport" : method === "mobile_id" ? "mobile" : "residence"}Retention`])
      await expect(consent.getByTestId("identity-consent-wallet")).toContainText(COPY[locale].walletConsent)
      await context.close()
    }
  }
})

test("OPENDID-E2E-003B EN KO JA localize the complete one-shot presentation decision", async ({ browser }) => {
  for (const locale of ["en", "ko", "ja"] as const) {
    const { context, page } = await newSeededPage(browser, locale)
    await page.getByTestId("nav-id").click()
    await page.getByTestId("traveler-id-ktour-id-open").click()
    const setup = page.getByTestId("k-tour-id-setup")
    await reachCredential(setup, false, locale === "en" ? undefined : locale)

    const ready = setup.getByTestId("k-tour-id-credential")
    if (locale !== "en") await expect(ready).not.toContainText(RAW_PROTOCOL_COPY)

    await setup.getByTestId("k-tour-id-presentation-open").click()
    const request = setup.getByTestId("k-tour-id-presentation-request")
    if (locale !== "en") await expect(request).not.toContainText(RAW_PROTOCOL_COPY)
    await expect(request.getByTestId("identity-presentation-requester")).toContainText(COPY[locale].presentationRequester)
    await expect(request.getByTestId("identity-presentation-purpose")).toContainText(COPY[locale].presentationPurpose)
    await expect(request.getByTestId("identity-presentation-evidence")).toContainText(COPY[locale].presentationEvidence)
    await expect(request.getByTestId("identity-presentation-retention")).toContainText(COPY[locale].presentationRetention)

    await setup.getByTestId("k-tour-id-continue").click()
    const consent = setup.getByTestId("k-tour-id-presentation-consent")
    await expect(consent).toContainText(COPY[locale].presentationRequester)
    await expect(consent.getByTestId("identity-presentation-predicate")).toContainText(COPY[locale].presentationEvidence)
    await setup.getByTestId("k-tour-id-presentation-approve").click()
    if (locale !== "en") await expect(setup.getByTestId("k-tour-id-presentation-result")).not.toContainText(RAW_PROTOCOL_COPY)
    await expect(setup.getByTestId("identity-presentation-result-status")).toHaveText(COPY[locale].presentationApproved)
    await expect(setup.getByTestId("identity-presentation-credential-state")).toContainText(COPY[locale].unchanged)
    await expect(setup.getByTestId("k-tour-id-result-back")).toHaveText(COPY[locale].backToKTourId)
    await expect(setup.getByTestId("k-tour-id-return")).toHaveText(COPY[locale].returnTraveler)
    await setup.getByTestId("k-tour-id-result-back").click()
    const readyAgain = setup.getByTestId("k-tour-id-credential")
    await expect(readyAgain).toHaveAttribute("data-status", "simulated_ready")
    await expect(readyAgain).toHaveAttribute("data-wallet-provisioning", "aa-assumed-local")
    await expect(readyAgain.getByTestId("k-tour-id-wallet-ready")).toBeVisible()
    await setup.getByTestId("k-tour-id-return").click()
    await expect(setup).toHaveCount(0)
    await expect(page.getByTestId("ondo-b-id-wallet-commerce")).toHaveAttribute("data-wallet", "ready")
    await context.close()
  }
})

test("OPENDID-E2E-003C Japanese consent and progress have no serious accessibility violations", async ({ page }) => {
  const { setup } = await openTravelerSetup(page, "ja")
  await selectMethod(setup, "passport_ekyc")
  const result = await new AxeBuilder({ page })
    .include("[data-testid='k-tour-id-setup']")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(result.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
})

test("OPENDID-E2E-003F EN KO JA keep the local OCR boundary and masked review explicit", async ({ browser }) => {
  for (const locale of ["en", "ko", "ja"] as const) {
    const { context, page } = await newSeededPage(browser, locale)
    await page.getByTestId("nav-id").click()
    await page.getByTestId("traveler-id-ktour-id-open").click()
    const setup = page.getByTestId("k-tour-id-setup")
    const document = await reachPassportDocument(setup)
    await expect(document.getByText(locale === "en" ? "ON-DEVICE OCR" : locale === "ko" ? "기기 내 OCR" : "端末内OCR", { exact: true })).toBeVisible()
    await expect(document.getByRole("heading", { name: COPY[locale].ocrTitle, exact: true })).toBeVisible()
    await document.getByTestId("passport-ocr-input").setInputFiles(SYNTHETIC_PASSPORT_IMAGE)
    await expect(document).toHaveAttribute("data-ocr-stage", "preview")
    await document.getByTestId("passport-ocr-start").click()
    await expect(document).toHaveAttribute("data-ocr-stage", "review")
    await expect(document.getByRole("heading", { name: COPY[locale].ocrReviewTitle, exact: true })).toBeVisible()
    await expect(document.getByTestId("passport-ocr-review")).toContainText(COPY[locale].ocrResult)
    await context.close()
  }
})

for (const viewport of [{ width: 320, height: 720 }, { width: 844, height: 390 }] as const) {
  test(`OPENDID-E2E-003G ${viewport.width}x${viewport.height} keeps selected passport and on-device OCR action usable together`, async ({ page }) => {
    await page.setViewportSize(viewport)
    const { setup } = await openTravelerSetup(page)
    const document = await reachPassportDocument(setup)
    await document.getByTestId("passport-ocr-input").setInputFiles(SYNTHETIC_PASSPORT_IMAGE)
    await expect(document).toHaveAttribute("data-ocr-stage", "preview")
    const action = document.getByTestId("passport-ocr-start")
    const preview = document.getByTestId("passport-ocr-preview")
    await expect(preview).toBeVisible()
    await expect(action).toBeVisible()
    await expect(action).toBeFocused()
    const actionBox = await action.boundingBox()
    expect(actionBox).not.toBeNull()
    expect(actionBox!.y).toBeGreaterThanOrEqual(0)
    expect(actionBox!.y + actionBox!.height).toBeLessThanOrEqual(viewport.height)
  })
}

test("OPENDID-E2E-003D passport OCR requires a decodable bounded image and exposes a masked local-only review", async ({ page }) => {
  const { setup } = await openTravelerSetup(page)
  const document = await reachPassportDocument(setup)
  const input = document.getByTestId("passport-ocr-input")
  await expect(input).toHaveAttribute("type", "file")
  await expect(input).toHaveAttribute("accept", "image/jpeg,image/png,image/webp")
  await expect(input).toHaveAttribute("capture", "environment")
  await expect(document.getByTestId("passport-ocr-start")).toBeDisabled()
  await expect(setup.getByTestId("k-tour-id-passport-face")).toHaveCount(0)

  await input.setInputFiles({ name: "not-an-image.pdf", mimeType: "application/pdf", buffer: Buffer.from("not an image") })
  await expect(document).toHaveAttribute("data-ocr-error", "type")
  await expect(document.getByTestId("passport-ocr-error")).toHaveText("Choose a JPEG, PNG or WebP image.")
  await expect(document.getByTestId("passport-ocr-retry")).toBeFocused()

  await input.setInputFiles({ name: "too-large.png", mimeType: "image/png", buffer: Buffer.alloc(12 * 1024 * 1024 + 1) })
  await expect(document).toHaveAttribute("data-ocr-error", "size")
  await expect(document.getByTestId("passport-ocr-error")).toContainText("larger than 12 MB")

  await input.setInputFiles({ name: "cannot-decode.png", mimeType: "image/png", buffer: Buffer.from("invalid png bytes") })
  await expect(document).toHaveAttribute("data-ocr-error", "decode")
  await expect(document.getByTestId("passport-ocr-error")).toContainText("could not be decoded")

  await input.setInputFiles(SYNTHETIC_PASSPORT_IMAGE)
  await expect(document).toHaveAttribute("data-ocr-stage", "preview")
  await expect(document.getByTestId("passport-ocr-preview").locator("img")).toBeVisible()
  await expect(document).not.toContainText(SYNTHETIC_PASSPORT_IMAGE.name)
  await document.getByTestId("passport-ocr-start").click()
  const processing = document.getByTestId("passport-ocr-processing")
  await expect(processing).toBeVisible()
  await expect(processing).not.toContainText("%")
  await expect(document).toHaveAttribute("data-ocr-stage", "review")
  const review = document.getByTestId("passport-ocr-review")
  await expect(review).toContainText("•••••••• · masked example")
  await expect(review).toContainText("Not extracted or retained")
  await expect(review).toContainText("No provider decision")
  await expect(document.getByTestId("k-tour-id-continue")).toBeFocused()
  await document.getByTestId("k-tour-id-continue").click()
  await expect(setup.getByTestId("k-tour-id-passport-face")).toBeVisible()
})

test("OPENDID-E2E-003D2 passport image retry keeps the OCR CTA clear of the sticky header in short landscape", async ({ page }) => {
  await page.setViewportSize({ width: 667, height: 320 })
  const { setup } = await openTravelerSetup(page)
  const documentStep = await reachPassportDocument(setup)
  const input = documentStep.getByTestId("passport-ocr-input")

  const expectOwnedDocumentAction = async (testId: "passport-ocr-choose" | "passport-ocr-retry" | "passport-ocr-start") => {
    const action = documentStep.getByTestId(testId)
    await expect(action).toBeFocused()
    const receipt = await action.evaluate((button) => {
      const actionBox = button.getBoundingClientRect()
      const dialog = button.closest<HTMLElement>("[role='dialog']")!
      const dialogBox = dialog.getBoundingClientRect()
      const header = dialog.querySelector<HTMLElement>("header")!
      const headerBox = header.getBoundingClientRect()
      const owner = document.elementFromPoint(actionBox.left + actionBox.width / 2, actionBox.top + actionBox.height / 2)
      return {
        dialogScrollTop: dialog.scrollTop,
        actionTop: actionBox.top,
        actionBottom: actionBox.bottom,
        visibleBottom: Math.min(dialogBox.bottom, window.innerHeight),
        headerBottom: headerBox.bottom,
        hitOwned: owner === button || button.contains(owner),
      }
    })
    expect(receipt.dialogScrollTop).toBe(0)
    expect(receipt.actionTop).toBeGreaterThanOrEqual(receipt.headerBottom)
    expect(receipt.actionBottom).toBeLessThanOrEqual(receipt.visibleBottom)
    expect(receipt.hitOwned).toBe(true)
  }

  await expectOwnedDocumentAction("passport-ocr-choose")

  await input.setInputFiles({ name: "not-an-image.pdf", mimeType: "application/pdf", buffer: Buffer.from("not an image") })
  const retry = documentStep.getByTestId("passport-ocr-retry")
  await expectOwnedDocumentAction("passport-ocr-retry")
  await retry.click()
  await input.setInputFiles(SYNTHETIC_PASSPORT_IMAGE)

  const action = documentStep.getByTestId("passport-ocr-start")
  await expect(documentStep).toHaveAttribute("data-ocr-stage", "preview")
  await expectOwnedDocumentAction("passport-ocr-start")
  await expect(action).toBeVisible()
})

test("OPENDID-E2E-003E passport previews revoke every object URL on replace, remove, close and continue", async ({ page }) => {
  await page.addInitScript(() => {
    const target = window as Window & { __PASSPORT_OBJECT_URLS__?: { created: string[]; revoked: string[] } }
    target.__PASSPORT_OBJECT_URLS__ = { created: [], revoked: [] }
    const create = URL.createObjectURL.bind(URL)
    const revoke = URL.revokeObjectURL.bind(URL)
    URL.createObjectURL = (object: Blob | MediaSource) => {
      const url = create(object)
      target.__PASSPORT_OBJECT_URLS__?.created.push(url)
      return url
    }
    URL.revokeObjectURL = (url: string) => {
      target.__PASSPORT_OBJECT_URLS__?.revoked.push(url)
      revoke(url)
    }
  })

  const firstEntry = await openTravelerSetup(page)
  let document = await reachPassportDocument(firstEntry.setup)
  let input = document.getByTestId("passport-ocr-input")

  await input.setInputFiles(SYNTHETIC_PASSPORT_IMAGE)
  await expect(document).toHaveAttribute("data-ocr-stage", "preview")
  const replace = document.getByTestId("passport-ocr-replace")
  const chooserPromise = page.waitForEvent("filechooser")
  await replace.click()
  await chooserPromise
  await expect(document).toHaveAttribute("data-ocr-stage", "preview")
  await expect(document.getByTestId("passport-ocr-preview")).toBeVisible()
  await expect(replace).toBeFocused()

  await input.setInputFiles(SYNTHETIC_PASSPORT_IMAGE)
  await expect(document).toHaveAttribute("data-ocr-stage", "preview")
  await document.getByTestId("passport-ocr-remove").click()
  await expect(document).toHaveAttribute("data-ocr-stage", "select")
  await expect(document.getByTestId("passport-ocr-choose")).toBeFocused()

  await input.setInputFiles(SYNTHETIC_PASSPORT_IMAGE)
  await expect(document).toHaveAttribute("data-ocr-stage", "preview")
  await firstEntry.setup.getByTestId("k-tour-id-cancel").click()
  await expect(firstEntry.setup).toHaveCount(0)
  await expect(firstEntry.opener).toBeFocused()

  await firstEntry.opener.click()
  const secondSetup = page.getByTestId("k-tour-id-setup")
  await expect(secondSetup).toBeVisible()
  document = await reachPassportDocument(secondSetup)
  input = document.getByTestId("passport-ocr-input")
  await input.setInputFiles(SYNTHETIC_PASSPORT_IMAGE)
  await expect(document).toHaveAttribute("data-ocr-stage", "preview")
  await document.getByTestId("passport-ocr-start").click()
  await expect(document.getByTestId("passport-ocr-processing")).toBeVisible()
  await expect(document.getByTestId("passport-ocr-processing-title")).toBeFocused()

  const objectUrls = await page.evaluate(() => (window as Window & {
    __PASSPORT_OBJECT_URLS__?: { created: string[]; revoked: string[] }
  }).__PASSPORT_OBJECT_URLS__)
  expect(objectUrls?.created).toHaveLength(4)
  expect(objectUrls?.revoked).toHaveLength(4)
  expect(objectUrls?.revoked.sort()).toEqual(objectUrls?.created.sort())
  const storedText = await page.evaluate(() => `${JSON.stringify(localStorage)} ${JSON.stringify(sessionStorage)}`)
  expect(storedText).not.toContain(SYNTHETIC_PASSPORT_IMAGE.name)
})

test("OPENDID-E2E-004 passport completes evidence, issuance, holder and presentation with zero network/storage and independent axes", async ({ page }) => {
  const { traveler, credential, setup } = await openTravelerSetup(page)
  const originalAxes = Object.fromEntries(await Promise.all(EXISTING_AXIS_TEST_IDS.map(async (testId) => [
    testId,
    await traveler.getByTestId(testId).getAttribute("data-status"),
  ])))
  const beforeStorage = await storageSnapshot(page)
  await installStorageWriteProbe(page)

  const identityRequests: string[] = []
  const origin = new URL(page.url()).origin
  page.on("request", (request) => {
    if (!["fetch", "xhr", "websocket"].includes(request.resourceType())) return
    const url = request.url()
    const parsed = new URL(url)
    const identityNamed = /identity|passport|opendid|credential|presentation|ekyc|omnione|callback/i.test(`${parsed.pathname}${parsed.search}`)
    if (parsed.origin !== origin || identityNamed) identityRequests.push(url)
  })

  await reachPassportEvidence(setup)
  const issuance = await advanceUntil(setup, "k-tour-id-issuance-preview")
  await expect(issuance).toBeVisible()
  const issue = setup.getByTestId("k-tour-id-continue")
  await expect(issue).toBeVisible()
  await issue.evaluate((button) => {
    for (let attempt = 0; attempt < 10; attempt += 1) (button as HTMLButtonElement).click()
  })
  await advanceUntil(setup, "k-tour-id-holder-delivery")
  const ready = await advanceUntil(setup, "k-tour-id-credential")
  await expect(ready).toHaveAttribute("data-status", "simulated_ready")
  await expect(ready).toHaveAttribute("data-issuance-count", "1")
  await expect(setup.getByTestId("k-tour-id-credential")).toHaveCount(1)

  for (const [testId, status] of Object.entries(originalAxes)) {
    await expect(traveler.getByTestId(testId)).toHaveAttribute("data-status", status ?? "")
  }
  await expect(credential).toHaveAttribute("data-status", "simulated_ready")

  await setup.getByTestId("k-tour-id-presentation-open").click()
  await expect(setup.getByTestId("k-tour-id-presentation-request")).toBeVisible()
  await advanceUntil(setup, "k-tour-id-presentation-consent")
  await setup.getByTestId("k-tour-id-presentation-approve").click()
  await expect(setup.getByTestId("k-tour-id-presentation-result")).toHaveAttribute("data-result", "success")

  expect(identityRequests).toEqual([])
  expect(await storageWrites(page)).toEqual([])
  expect(await storageSnapshot(page)).toEqual(beforeStorage)
  const persisted = JSON.stringify(await storageSnapshot(page))
  expect(persisted).not.toMatch(/passport|credential|presentation|issuerDid|holderDid|liveness|faceImage|documentNumber/i)
})

test("OPENDID-E2E-005 residence unavailable changes to passport only with the assurance-change warning", async ({ browser }) => {
  for (const locale of ["en", "ko", "ja"] as const) {
    const qa: IdentityQa = { identity: { outcome: "IDENTITY_METHOD_UNAVAILABLE" } }
    const { context, page } = await newSeededPage(browser, locale, qa)
    await page.getByTestId("nav-id").click()
    await page.getByTestId("traveler-id-ktour-id-open").click()
    const setup = page.getByTestId("k-tour-id-setup")
    await selectMethod(setup, "mobile_residence_card")
    await approveConsent(setup)
    const unavailable = await advanceUntil(setup, "k-tour-id-unavailable")
    await expect(unavailable).toHaveAttribute("data-code", "IDENTITY_METHOD_UNAVAILABLE")
    await expect(unavailable).toContainText(COPY[locale].assuranceChange)
    await unavailable.getByTestId("k-tour-id-alternate-passport").click()
    const passportConsent = setup.getByTestId("k-tour-id-consent")
    await expect(passportConsent.getByTestId("identity-consent-provider")).toContainText(COPY[locale].passportProvider)
    await context.close()
  }
})

test("OPENDID-E2E-006 cancel and Escape restore focus to each exact optional entry", async ({ browser }) => {
  const onboardingContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const onboardingPage = await onboardingContext.newPage()
  const onboardingEntry = await openOnboardingSetup(onboardingPage)
  await onboardingEntry.setup.getByTestId("k-tour-id-cancel").click()
  await expect(onboardingEntry.opener).toBeFocused()
  await onboardingEntry.opener.click()
  await onboardingPage.keyboard.press("Escape")
  await expect(onboardingEntry.opener).toBeFocused()
  await onboardingEntry.opener.click()
  await reachSuccessfulPresentationResult(onboardingEntry.setup)
  await onboardingEntry.setup.getByTestId("k-tour-id-return").click()
  await expect(onboardingEntry.setup).toHaveCount(0)
  await expect(onboardingEntry.opener).toBeFocused()
  await onboardingContext.close()

  const travelerContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const travelerPage = await travelerContext.newPage()
  const travelerEntry = await openTravelerSetup(travelerPage)
  await travelerPage.keyboard.press("Escape")
  await expect(travelerEntry.setup).toHaveCount(0)
  await expect(travelerEntry.opener).toBeFocused()
  await travelerEntry.opener.click()
  await reachSuccessfulPresentationResult(travelerEntry.setup)
  await travelerEntry.setup.getByTestId("k-tour-id-return").click()
  await expect(travelerEntry.setup).toHaveCount(0)
  await expect(travelerEntry.opener).toBeFocused()
  await travelerContext.close()
})

for (const status of ["expired", "suspended", "revoked"] as const) {
  const code = `CREDENTIAL_${status.toUpperCase()}`
  test(`OPENDID-E2E-007 credential ${status} fixture remains separate and blocks presentation`, async ({ page }) => {
    const qa: IdentityQa = { identity: { credentialStatus: status } }
    const { traveler, setup } = await openTravelerSetup(page, "en", qa)
    const ready = await reachCredential(setup)
    await expect(ready).toHaveAttribute("data-status", status)
    await expect(ready).toHaveAttribute("data-code", code)
    await expect(setup.getByTestId("k-tour-id-presentation-open")).toBeDisabled()
    for (const testId of EXISTING_AXIS_TEST_IDS) {
      const expected = testId === "traveler-id-account" ? "guest" : "none"
      await expect(traveler.getByTestId(testId)).toHaveAttribute("data-status", expected)
    }
  })
}

for (const outcome of ["PRESENTATION_DENIED", "PRESENTATION_REQUEST_EXPIRED", "PRESENTATION_REPLAY"] as const) {
  const result = outcome === "PRESENTATION_DENIED" ? "denied" : outcome === "PRESENTATION_REQUEST_EXPIRED" ? "expired" : "replay"
  const visibleTitle = outcome === "PRESENTATION_DENIED" ? "Not shared" : outcome === "PRESENTATION_REQUEST_EXPIRED" ? "Request expired" : "Request already used"
  test(`OPENDID-E2E-008 presentation ${result} fixture is explicit and retry-safe`, async ({ page }) => {
    const { setup } = await openTravelerSetup(page)
    await reachCredential(setup)
    await setIdentityQa(page, { presentationOutcome: outcome })
    await setup.getByTestId("k-tour-id-presentation-open").click()
    await expect(setup.getByTestId("k-tour-id-presentation-request")).toBeVisible()
    await advanceUntil(setup, "k-tour-id-presentation-consent")
    await setup.getByTestId("k-tour-id-presentation-approve").click()
    const presentation = setup.getByTestId("k-tour-id-presentation-result")
    await expect(presentation).toHaveAttribute("data-result", result)
    await expect(presentation).toHaveAttribute("data-code", outcome)
    await expect(presentation.getByRole("heading", { level: 1 })).toHaveText(visibleTitle)
    if (outcome !== "PRESENTATION_DENIED") await expect(presentation.getByTestId("k-tour-id-result-back")).toHaveText("Start a new request")
    await expect(setup.getByTestId("k-tour-id-credential")).toHaveAttribute("data-issuance-count", "1")
  })
}

test("OPENDID-E2E-008B credential expiry during consent blocks the one-shot presentation", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-08-29T10:00:00.000Z") })
  const { traveler, setup } = await openTravelerSetup(page)
  await reachCredential(setup)
  await page.clock.fastForward((119 * 60) * 1_000)
  await setup.getByTestId("k-tour-id-presentation-open").click()
  await advanceUntil(setup, "k-tour-id-presentation-consent")
  await page.clock.fastForward(61_000)
  await setup.getByTestId("k-tour-id-presentation-approve").click()

  const credential = setup.getByTestId("k-tour-id-credential")
  await expect(credential).toHaveAttribute("data-status", "expired")
  await expect(credential).toHaveAttribute("data-code", "CREDENTIAL_EXPIRED")
  await expect(setup.getByTestId("k-tour-id-presentation-result")).toHaveCount(0)
  await setup.getByTestId("k-tour-id-return").click()
  await expect(traveler.getByTestId("traveler-id-credential")).toHaveAttribute("data-status", "expired")
})

test("OPENDID-E2E-009 a one-shot provider failure recovers through the visible retry", async ({ page }) => {
  const { setup } = await openTravelerSetup(page, "en", { identitySetupOutcome: "PROVIDER_TIMEOUT" })
  await selectMethod(setup, "mobile_id")
  await approveConsent(setup)
  const failure = await advanceUntil(setup, "k-tour-id-failure")
  await expect(failure).toHaveAttribute("data-code", "PROVIDER_TIMEOUT")
  await failure.getByTestId("k-tour-id-retry").click()
  await expect(setup.getByTestId("k-tour-id-route-step")).toBeVisible()
  await advanceUntil(setup, "ktour-id-mobile-handoff")
})
