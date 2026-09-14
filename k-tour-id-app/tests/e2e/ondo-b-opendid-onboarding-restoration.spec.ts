import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Browser, type Locator, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
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
    guest: "Skip for now",
    environment: "K-Tour ID",
    privateCredential: [/identity (?:service|provider).*connected/i, /no (?:real )?DID or VC is issued/i, /not (?:an identity check or official ID|a government ID)/i],
    mobileRetention: "No Mobile ID payload, name, birth date, signed callback or provider result is stored.",
    residenceRetention: "No residence-card payload, name, birth date, signed callback or provider result is stored.",
    passportRetention: "No user image, passport field, face image or provider result is collected or stored.",
    walletSeparate: "Payments stay separate",
    passportProvider: "Passport eKYC uses a separate provider — not OmniOne CX",
    assuranceChange: "A passport does not confirm registered-resident status or replace a Residence Card check.",
    presentationRequester: "ONDO Table",
    presentationPurpose: "Minimum trip eligibility for this one request",
    presentationEvidence: "K-Tour travel eligibility · yes/no only",
    presentationRetention: "This request only · expires automatically · result not stored",
    presentationApproved: "APPROVED ONCE",
    unchanged: "unchanged",
    backToKTourId: "Back to K-Tour ID",
    returnTraveler: "Return to Travel Pass",
    ocrEyebrow: "PASSPORT",
    ocrTitle: "Check the passport page",
    ocrReviewTitle: "Sample check complete",
    ocrResult: "Review result · no external service confirmation",
    ocrPrivacyDetails: "Review details",
    ocrTechnicalPrivacy: "bundled redacted sample",
  },
  ko: {
    guest: "건너뛰기",
    environment: "K-Tour ID",
    privateCredential: [/신원확인 (?:서비스|기관).*연결되지 않/, /DID·VC.*발급하지 않/, /(?:신원 확인이나 공식 신분증|정부 신분증).*아니/],
    mobileRetention: "모바일 신분증 원문·이름·생년월일·서명 콜백·기관 응답은 저장하지 않습니다.",
    residenceRetention: "외국인등록증 원문·이름·생년월일·서명 콜백·기관 응답은 저장하지 않습니다.",
    passportRetention: "사용자 이미지·여권 항목·얼굴 이미지·기관 결과를 수집하거나 저장하지 않습니다.",
    walletSeparate: "결제는 별도로 준비",
    passportProvider: "여권 eKYC는 OmniOne CX가 아닌 별도 제공자",
    assuranceChange: "여권은 등록외국인 체류 자격을 확인하거나 외국인등록증 확인을 대신할 수 없어요.",
    presentationRequester: "ONDO 테이블",
    presentationPurpose: "이번 한 번의 요청을 위한 최소 여행 자격 확인",
    presentationEvidence: "K-Tour 여행 자격 · 예/아니오만",
    presentationRetention: "이번 요청에만 사용 · 자동 만료 · 결과 저장 안 함",
    presentationApproved: "한 번 승인됨",
    unchanged: "상태 변경 없음",
    backToKTourId: "K-Tour ID로 돌아가기",
    returnTraveler: "여행 패스로 돌아가기",
    ocrEyebrow: "여권",
    ocrTitle: "여권 면을 확인해요",
    ocrReviewTitle: "샘플 확인 완료",
    ocrResult: "검토용 결과 · 외부 서비스 확인 없음",
    ocrPrivacyDetails: "검토 상세",
    ocrTechnicalPrivacy: "가림 처리 샘플",
  },
  ja: {
    guest: "スキップ",
    environment: "K-Tour ID",
    privateCredential: [/本人確認(?:サービス|事業者).*接続/, /DID・VC.*発行しません/, /公的身分証.*(?:ではありません|ではなく)/],
    mobileRetention: "モバイルID本文、氏名、生年月日、署名済みコールバック、事業者結果は保存しません。",
    residenceRetention: "在留カード本文、氏名、生年月日、署名済みコールバック、事業者結果は保存しません。",
    passportRetention: "利用者の画像、パスポート項目、顔画像、事業者結果は収集・保存しません。",
    walletSeparate: "支払いは別に設定",
    passportProvider: "パスポートeKYCはOmniOne CXではなく別の事業者",
    assuranceChange: "パスポートでは登録外国人としての在留資格を確認できず、在留カード確認の代わりにはなりません。",
    presentationRequester: "ONDOテーブル",
    presentationPurpose: "今回一回の依頼に必要な最小限の旅行資格確認",
    presentationEvidence: "K-Tour旅行資格 · 可否のみ",
    presentationRetention: "今回の依頼だけに使用 · 自動で期限切れ · 結果は保存しない",
    presentationApproved: "一回のみ承認",
    unchanged: "状態変更なし",
    backToKTourId: "K-Tour IDに戻る",
    returnTraveler: "トラベルパスに戻る",
    ocrEyebrow: "パスポート",
    ocrTitle: "パスポート面を確認",
    ocrReviewTitle: "サンプル確認完了",
    ocrResult: "検証用の結果・外部サービスによる確認なし",
    ocrPrivacyDetails: "検証の詳細",
    ocrTechnicalPrivacy: "マスキング済みサンプル",
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
    mobile_residence_card: /Residence Card/i,
    passport_ekyc: /Passport check/i,
  },
  ko: {
    mobile_id: /모바일 신분증/,
    mobile_residence_card: /체류 카드/,
    passport_ekyc: /여권 확인/,
  },
  ja: {
    mobile_id: /モバイルID/,
    mobile_residence_card: /在留カード/,
    passport_ekyc: /パスポート確認/,
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
    localStorage.clear()
    sessionStorage.clear()
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

async function openB(page: Page, locale: Locale, onboarding: "ONB-NEW" | "ONB-COMPLETE", qa?: IdentityQa, review = false) {
  await seedB(page, locale, onboarding, qa)
  await page.goto(review ? "/?qa=1" : "/", { waitUntil: "domcontentloaded" })
  await expect(page.locator("html")).toHaveAttribute("lang", locale)
  await expect(page.getByTestId("ondo-b-root")).toBeVisible()
}

async function completePersonalizedOnboarding(page: Page, locale: Locale = "en") {
  await openB(page, locale, "ONB-NEW", undefined, true)
  const onboardingBackdrop = page.getByTestId("ondo-onboarding-backdrop")
  const onboarding = page.getByTestId("ondo-onboarding")
  await expect(onboardingBackdrop).toHaveAttribute("data-onboarding-step", "intent")
  await expect(onboarding.getByTestId("onboarding-step-intent")).toBeVisible()
  await expect(onboarding.getByText(/K-Tour ID|OmniOne|identity provider|optional/i)).toHaveCount(0)
  await expect(onboarding.getByTestId("k-tour-id-setup-open")).toHaveCount(0)
  await onboarding.getByTestId("persona-short_trip").click()
  await onboardingBackdrop.getByTestId("onboarding-continue").click()
  await expect(onboardingBackdrop).toHaveAttribute("data-onboarding-step", "area")
  await expect(onboarding.getByTestId("onboarding-step-area")).toBeVisible()
  await onboarding.getByTestId("onboarding-area-seoul").click()
  await onboardingBackdrop.getByTestId("onboarding-continue").click()
  await expect(onboardingBackdrop).toHaveAttribute("data-onboarding-step", "preferences")
  await expect(onboarding.getByTestId("onboarding-step-preferences")).toBeVisible()
  await onboarding.getByTestId("onboarding-preference-classic").click()
  await onboardingBackdrop.getByTestId("onboarding-finish").click()
  await expect(onboardingBackdrop).toHaveCount(0)
  await expect(page.getByTestId("k-tour-id-setup")).toHaveCount(0)
  await expect(page.getByTestId("ondo-b-map-entry")).toBeVisible()
  await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-city", "seoul")
}

async function openTravelerSetup(page: Page, locale: Locale = "en", qa?: IdentityQa) {
  await openB(page, locale, "ONB-COMPLETE", qa, true)
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
    "identity-consent-evidence",
  ]) {
    await expect(consent.getByTestId(testId)).not.toBeEmpty()
    await expect(consent.getByTestId(testId)).toBeVisible()
  }
  const provider = consent.getByTestId("identity-consent-provider")
  const retention = consent.getByTestId("identity-consent-retention")
  await expect(provider).not.toBeEmpty()
  await expect(retention).not.toBeEmpty()
  await expect(provider).not.toBeVisible()
  await expect(retention).not.toBeVisible()
  const providerDetails = provider.locator("xpath=ancestor::details")
  await expect(providerDetails).not.toHaveAttribute("open", "")
  await providerDetails.locator(":scope > summary").click()
  await expect(provider).toBeVisible()
  await expect(retention).toBeVisible()
  await providerDetails.locator(":scope > summary").click()
  return consent
}

async function expectConciseMethodSurface(setup: Locator, locale: Locale) {
  const heading = locale === "en" ? "Choose a method" : locale === "ko" ? "확인 방법을 선택하세요" : "確認方法を選択"
  const labels = locale === "en"
    ? ["Mobile ID", "Residence Card", "Passport"]
    : locale === "ko"
      ? ["모바일 신분증", "체류 카드", "여권"]
      : ["モバイルID", "在留カード", "パスポート"]
  await expect(setup).toHaveAttribute("data-phase", "method_select")
  await expect(setup.getByRole("heading", { name: heading, exact: true })).toBeVisible()
  for (const [index, label] of labels.entries()) await expect(setup.getByTestId(METHOD_TEST_IDS[(["mobile_id", "mobile_residence_card", "passport_ekyc"] as const)[index]]).locator("xpath=ancestor::button")).toContainText(label)
  for (const technology of [/ON-DEVICE/i, /OmniOne/i, /optional/i, /registered foreign resident/i]) {
    await expect(setup.getByText(technology)).toHaveCount(0)
  }

  const protocol = setup.getByTestId("k-tour-id-technical-truth").locator("xpath=ancestor::details")
  await expect(protocol).not.toHaveAttribute("open", "")
  await expect(setup.getByTestId("k-tour-id-technical-truth")).not.toBeVisible()
  await expect(setup.getByTestId("k-tour-id-private-boundary")).not.toBeVisible()
  await protocol.locator(":scope > summary").click()
  await expect(setup.getByTestId("k-tour-id-technical-truth")).toBeVisible()
  const privateBoundary = setup.getByTestId("k-tour-id-private-boundary")
  for (const truth of COPY[locale].privateCredential) await expect(privateBoundary).toContainText(truth)
  await protocol.locator(":scope > summary").click()
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

async function completePassportReview(setup: Locator) {
  const document = setup.getByTestId("k-tour-id-passport-document")
  await expect(document).toHaveAttribute("data-ocr-stage", "sample")
  await expect(document).toHaveAttribute("data-review-fixture", "redacted-passport")
  await expect(document.getByTestId("passport-ocr-preview")).toBeVisible()
  await document.getByTestId("passport-ocr-start").click()
  await expect(document.getByTestId("passport-ocr-processing")).toBeVisible()
  await expect(document).toHaveAttribute("data-ocr-stage", "review")
  await expect(document.getByTestId("passport-ocr-review")).toBeVisible()
  await document.getByTestId("k-tour-id-continue").click()
}

async function reachPassportProcessing(setup: Locator) {
  await reachPassportDocument(setup)
  await completePassportReview(setup)
  const face = setup.getByTestId("k-tour-id-passport-face")
  await expect(face).toBeVisible()
  await face.getByTestId("k-tour-id-continue").click()
  const processing = setup.getByTestId("k-tour-id-route-step")
  await expect(processing).toBeVisible()
  return processing
}

async function reachCredential(setup: Locator, rapidIssue = false, consumerLocale?: Exclude<Locale, "en">) {
  await reachPassportProcessing(setup)
  const holder = setup.getByTestId("k-tour-id-holder-delivery")
  await expect(holder).toBeVisible()
  if (consumerLocale) await expect(holder).not.toContainText(RAW_PROTOCOL_COPY)
  const issue = holder.getByTestId("k-tour-id-continue")
  await expect(issue).toBeVisible()
  if (rapidIssue) {
    await issue.evaluate((button) => {
      for (let attempt = 0; attempt < 10; attempt += 1) (button as HTMLButtonElement).click()
    })
  } else {
    await issue.click()
  }
  const credential = setup.getByTestId("k-tour-id-credential")
  await expect(credential).toBeVisible()
  return credential
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
  await openB(page, locale, "ONB-COMPLETE", qa, true)
  return { context, page }
}

test("OPENDID-E2E-001 guest skip remains ungated and preserves the existing onboarding contract", async ({ page }) => {
  await openB(page, "en", "ONB-NEW")
  const onboardingBackdrop = page.getByTestId("ondo-onboarding-backdrop")
  const onboarding = page.getByTestId("ondo-onboarding")
  await expect(onboarding).toBeVisible()
  await expect(onboardingBackdrop).toHaveAttribute("data-onboarding-step", "intent")
  await expect(onboarding.getByTestId("onboarding-step-intent")).toBeVisible()
  await expect(onboarding.getByText(/K-Tour ID|OmniOne|identity provider|optional/i)).toHaveCount(0)
  await expect(onboarding.getByTestId("k-tour-id-setup-open")).toHaveCount(0)
  const guestSkip = onboardingBackdrop.getByTestId("onboarding-guest-skip")
  await expect(guestSkip).toHaveText(COPY.en.guest)
  await guestSkip.click()

  await expect(onboardingBackdrop).toHaveCount(0)
  await expect(page.getByTestId("k-tour-id-setup")).toHaveCount(0)
  await expect(page.getByTestId("ondo-b-nation")).toBeVisible()
  await expect(page.getByTestId("nav-ondo")).toHaveAttribute("aria-current", "page")
  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}"), DEVICE_KEY)
  expect(stored).toMatchObject({ onboarding: "ONB-COMPLETE", persona: null, discoveryPreferences: [] })
})

test("OPENDID-E2E-002 personalized onboarding keeps identity JIT while Travel Pass makes it explicit", async ({ browser }) => {
  const onboardingContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const onboardingPage = await onboardingContext.newPage()
  await completePersonalizedOnboarding(onboardingPage)
  await expect(onboardingPage.getByTestId("nav-ondo")).toHaveAttribute("aria-current", "page")
  await onboardingContext.close()

  const travelerContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const travelerPage = await travelerContext.newPage()
  const travelerEntry = await openTravelerSetup(travelerPage)
  await expectConciseMethodSurface(travelerEntry.setup, "en")
  await expect(travelerEntry.setup.getByTestId("k-tour-id-environment")).toHaveText(COPY.en.environment)
  await travelerEntry.setup.getByTestId("k-tour-id-cancel").click()
  await expect(travelerEntry.setup).toHaveCount(0)
  await expect(travelerEntry.opener).toBeFocused()
  await travelerContext.close()
})

test("OPENDID-E2E-002R explicit public review completes all three routes without exposing QA injection", async ({ browser }) => {
  const routes: readonly [IdentityMethod, Locale][] = [
    ["mobile_id", "en"],
    ["mobile_residence_card", "ko"],
    ["passport_ekyc", "ja"],
  ]
  for (const [method, locale] of routes) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await context.newPage()
    await seedB(page, locale, "ONB-COMPLETE", { identity: { outcome: "IDENTITY_METHOD_UNAVAILABLE" } })
    await page.goto("/?review=1", { waitUntil: "domcontentloaded" })
    await expect.poll(() => new URL(page.url()).search).toBe("?review=1")
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem("ondo.review.flow.v1"))).toBe("1")
    await expect(page.locator("html")).toHaveAttribute("lang", locale)

    await page.getByTestId("nav-id").click()
    await page.getByTestId("traveler-id-ktour-id-open").click()
    const setup = page.getByTestId("k-tour-id-setup")
    await expect(setup).toHaveAttribute("data-execution-mode", "review")
    for (const methodTestId of Object.values(METHOD_TEST_IDS)) {
      await expect(setup.getByTestId(methodTestId).locator("xpath=ancestor::button")).toHaveAttribute("data-availability", "review")
    }

    if (method === "passport_ekyc") {
      await reachCredential(setup)
    } else {
      await selectMethod(setup, method)
      await approveConsent(setup)
      const handoff = setup.getByTestId("k-tour-id-route-step")
      await expect(handoff).toBeVisible()
      await expect(handoff.getByTestId("ktour-id-mobile-handoff")).toBeVisible()
      await handoff.getByTestId("k-tour-id-continue").click()
      const holder = setup.getByTestId("k-tour-id-holder-delivery")
      await expect(holder).toBeVisible()
      await holder.getByTestId("k-tour-id-continue").click()
      await expect(setup.getByTestId("k-tour-id-credential")).toBeVisible()
    }
    await expect(setup).not.toHaveAttribute("data-phase", "unavailable")
    await context.close()
  }
})

test("OPENDID-E2E-003 EN KO JA expose all three consent/provider truths", async ({ browser }) => {
  for (const locale of ["en", "ko", "ja"] as const) {
    for (const method of ["mobile_id", "mobile_residence_card", "passport_ekyc"] as const) {
      const { context, page } = await newSeededPage(browser, locale)
      await page.getByTestId("nav-id").click()
      await page.getByTestId("traveler-id-ktour-id-open").click()
      const setup = page.getByTestId("k-tour-id-setup")
      await expectConciseMethodSurface(setup, locale)
      await expect(setup.getByTestId("k-tour-id-environment")).toHaveText(COPY[locale].environment)
      const consent = await selectMethod(setup, method)
      const provider = consent.getByTestId("identity-consent-provider")
      const evidence = consent.getByTestId("identity-consent-evidence")
      const retention = consent.getByTestId("identity-consent-retention")
      if (method === "passport_ekyc") await expect(provider).toContainText(COPY[locale].passportProvider)
      else await expect(provider).toContainText("OmniOne CX")
      await expect(evidence).toContainText(METHOD_EVIDENCE[locale][method])
      await expect(retention).toContainText(COPY[locale][`${method === "passport_ekyc" ? "passport" : method === "mobile_id" ? "mobile" : "residence"}Retention`])
      await expect(consent.getByTestId("identity-consent-wallet")).toHaveCount(0)
      await context.close()
    }
  }
})

test("OPENDID-E2E-003B EN KO JA keep requester-free setup separate from presentation", async ({ browser }) => {
  for (const locale of ["en", "ko", "ja"] as const) {
    const { context, page } = await newSeededPage(browser, locale)
    await page.getByTestId("nav-id").click()
    await page.getByTestId("traveler-id-ktour-id-open").click()
    const setup = page.getByTestId("k-tour-id-setup")
    await reachCredential(setup, false, locale === "en" ? undefined : locale)

    const ready = setup.getByTestId("k-tour-id-credential")
    if (locale !== "en") await expect(ready).not.toContainText(RAW_PROTOCOL_COPY)

    await expect(setup.getByTestId("k-tour-id-presentation-open")).toHaveCount(0)
    await expect(ready).toHaveAttribute("data-wallet-provisioning", "separate")
    await expect(ready.getByTestId("k-tour-id-wallet-separate")).toContainText(COPY[locale].walletSeparate)
    await setup.getByTestId("k-tour-id-return").click()
    await expect(setup).toHaveCount(0)
    await expect(page.getByTestId("ondo-b-id-wallet-commerce")).toHaveAttribute("data-wallet", "disconnected")
    await context.close()
  }
})

test("OPENDID-E2E-003H onboarding keeps tastes while JIT K-Tour ID and wallet remain independent", async ({ page }) => {
  await completePersonalizedOnboarding(page)
  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}"), DEVICE_KEY)
  expect(stored).toMatchObject({
    onboarding: "ONB-COMPLETE",
    persona: "short_trip",
    discoveryArea: "seoul",
    discoveryPreferences: ["classic"],
  })

  await page.getByTestId("nav-id").click()
  await page.getByTestId("traveler-id-ktour-id-open").click()
  const setup = page.getByTestId("k-tour-id-setup")
  await expectConciseMethodSurface(setup, "en")
  await reachCredential(setup)
  const ready = setup.getByTestId("k-tour-id-credential")
  await expect(ready).toHaveAttribute("data-wallet-provisioning", "separate")
  await expect(ready.getByTestId("k-tour-id-wallet-separate")).toContainText(COPY.en.walletSeparate)

  await setup.getByTestId("k-tour-id-return").click()
  await expect(setup).toHaveCount(0)
  await expect(page.getByTestId("ondo-onboarding")).toHaveCount(0)
  await expect(page.getByTestId("traveler-id-credential")).toHaveAttribute("data-status", "review-draft")
  await expect(page.getByTestId("ondo-b-id-wallet-commerce")).toHaveAttribute("data-wallet", "disconnected")
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

test("OPENDID-E2E-003F EN KO JA keep passport privacy folded and the next step explicit", async ({ browser }) => {
  for (const locale of ["en", "ko", "ja"] as const) {
    const { context, page } = await newSeededPage(browser, locale)
    await page.getByTestId("nav-id").click()
    await page.getByTestId("traveler-id-ktour-id-open").click()
    const setup = page.getByTestId("k-tour-id-setup")
    const document = await reachPassportDocument(setup)
    await expect(document.getByText(COPY[locale].ocrEyebrow, { exact: true })).toBeVisible()
    await expect(document.getByRole("heading", { name: COPY[locale].ocrTitle, exact: true })).toBeVisible()
    await expect(document).toHaveAttribute("data-ocr-stage", "sample")
    await expect(document).toHaveAttribute("data-review-fixture", "redacted-passport")
    const privacy = document
      .getByText(COPY[locale].ocrPrivacyDetails, { exact: true })
      .locator("xpath=ancestor::details[1]")
    const technicalPrivacy = privacy.locator(":scope > p")
    await expect(privacy).not.toHaveAttribute("open", "")
    await expect(technicalPrivacy).toContainText(COPY[locale].ocrTechnicalPrivacy)
    await expect(technicalPrivacy).not.toBeVisible()
    await privacy.locator(":scope > summary").click()
    await expect(technicalPrivacy).toBeVisible()
    await document.getByTestId("passport-ocr-start").click()
    await expect(document).toHaveAttribute("data-ocr-stage", "review")
    await expect(document.getByRole("heading", { name: COPY[locale].ocrReviewTitle, exact: true })).toBeVisible()
    await expect(document.getByTestId("passport-ocr-review")).toContainText(COPY[locale].ocrResult)
    await context.close()
  }
})

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 430, height: 932 }, { width: 844, height: 390 }] as const) {
  test(`OPENDID-E2E-003G ${viewport.width}x${viewport.height} keeps the redacted passport review action usable`, async ({ page }) => {
    await page.setViewportSize(viewport)
    const { setup } = await openTravelerSetup(page)
    const document = await reachPassportDocument(setup)
    await expect(document).toHaveAttribute("data-ocr-stage", "sample")
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

test("OPENDID-E2E-003D passport review uses only a bundled redacted sample and exposes the face/liveness boundary", async ({ page }) => {
  const { setup } = await openTravelerSetup(page)
  const document = await reachPassportDocument(setup)
  await expect(document.locator('input[type="file"]')).toHaveCount(0)
  await expect(document).toHaveAttribute("data-review-stage", "ocr-nfc")
  await expect(document).toHaveAttribute("data-review-fixture", "redacted-passport")
  await expect(document.getByTestId("passport-ocr-start")).toBeVisible()
  await expect(document.getByTestId("passport-ocr-preview")).toBeVisible()
  await expect(setup.getByTestId("k-tour-id-passport-face")).toHaveCount(0)
  await document.getByTestId("passport-ocr-start").click()
  const processing = document.getByTestId("passport-ocr-processing")
  await expect(processing).toBeVisible()
  await expect(processing).not.toContainText("%")
  await expect(document).toHaveAttribute("data-ocr-stage", "review")
  const review = document.getByTestId("passport-ocr-review")
  await expect(review).toContainText(COPY.en.ocrResult)
  await expect(document.locator('input[type="file"]')).toHaveCount(0)
  await expect(document.getByTestId("k-tour-id-continue")).toBeFocused()
  await document.getByTestId("k-tour-id-continue").click()
  await expect(setup.getByTestId("k-tour-id-passport-face")).toBeVisible()
})

test("OPENDID-E2E-003D2 passport sample CTA stays clear of the sticky header in short landscape", async ({ browser }) => {
  for (const locale of ["en", "ko", "ja"] as const) {
    const context = await browser.newContext({ viewport: { width: 667, height: 320 } })
    const page = await context.newPage()
    const { setup } = await openTravelerSetup(page, locale)
    const documentStep = await reachPassportDocument(setup)
    const action = documentStep.getByTestId("passport-ocr-start")
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
    await expect(documentStep).toHaveAttribute("data-ocr-stage", "sample")
    await expect(action).toBeVisible()
    await context.close()
  }
})

test("OPENDID-E2E-003E passport sample review collects and persists no raw media", async ({ page }) => {
  const { setup } = await openTravelerSetup(page)
  const document = await reachPassportDocument(setup)
  const before = await storageSnapshot(page)
  await expect(document.locator('input[type="file"]')).toHaveCount(0)
  await document.getByTestId("passport-ocr-start").click()
  await expect(document).toHaveAttribute("data-ocr-stage", "review")
  expect(await storageSnapshot(page)).toEqual(before)
  const storedText = JSON.stringify(await storageSnapshot(page))
  expect(storedText).not.toMatch(/passport|mrz|faceImage|documentNumber|redacted-passport/i)
})

test("OPENDID-E2E-004 passport review adds one private draft with zero network/storage and independent axes", async ({ page }) => {
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

  const processing = await reachPassportProcessing(setup)
  await expect(processing).toBeVisible()
  const holder = setup.getByTestId("k-tour-id-holder-delivery")
  await expect(holder).toBeVisible()
  const issue = holder.getByTestId("k-tour-id-continue")
  await expect(issue).toBeVisible()
  await issue.evaluate((button) => {
    for (let attempt = 0; attempt < 10; attempt += 1) (button as HTMLButtonElement).click()
  })
  const ready = setup.getByTestId("k-tour-id-credential")
  await expect(ready).toBeVisible()
  await expect(ready).toHaveAttribute("data-status", "review-draft")
  await expect(ready).toHaveAttribute("data-issuance-count", "1")
  await expect(setup.getByTestId("k-tour-id-credential")).toHaveCount(1)

  for (const [testId, status] of Object.entries(originalAxes)) {
    await expect(traveler.getByTestId(testId)).toHaveAttribute("data-status", status ?? "")
  }
  await expect(credential).toHaveAttribute("data-status", "review-draft")

  await expect(setup.getByTestId("k-tour-id-presentation-open")).toHaveCount(0)

  expect(identityRequests).toEqual([])
  expect(await storageWrites(page)).toEqual([])
  expect(await storageSnapshot(page)).toEqual(beforeStorage)
  const persisted = JSON.stringify(await storageSnapshot(page))
  expect(persisted).not.toMatch(/issuerDid|holderDid|liveness|faceImage|documentNumber|synthetic-passport-placeholder/i)
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

test("OPENDID-E2E-006 onboarding reaches Explore without interruption while traveler exits restore the explicit opener", async ({ browser }) => {
  const onboardingContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const onboardingPage = await onboardingContext.newPage()
  await completePersonalizedOnboarding(onboardingPage)
  await expect(onboardingPage.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-city", "seoul")
  await expect(onboardingPage.getByTestId("ondo-onboarding")).toHaveCount(0)
  await onboardingContext.close()

  const travelerContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const travelerPage = await travelerContext.newPage()
  const travelerEntry = await openTravelerSetup(travelerPage)
  await travelerPage.keyboard.press("Escape")
  await expect(travelerEntry.setup).toHaveCount(0)
  await expect(travelerEntry.opener).toBeFocused()
  await travelerEntry.opener.click()
  await reachCredential(travelerEntry.setup)
  await expect(travelerEntry.setup.getByTestId("k-tour-id-presentation-open")).toHaveCount(0)
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
    await expect(setup.getByTestId("k-tour-id-presentation-open")).toHaveCount(0)
    for (const testId of EXISTING_AXIS_TEST_IDS) {
      const expected = testId === "traveler-id-account" ? "guest" : "none"
      await expect(traveler.getByTestId(testId)).toHaveAttribute("data-status", expected)
    }
  })
}

for (const outcome of ["PRESENTATION_DENIED", "PRESENTATION_REQUEST_EXPIRED", "PRESENTATION_REPLAY"] as const) {
  test(`OPENDID-E2E-008 requester-free setup cannot consume ${outcome} presentation fixture`, async ({ page }) => {
    const { setup } = await openTravelerSetup(page)
    await reachCredential(setup)
    await setIdentityQa(page, { presentationOutcome: outcome })
    await expect(setup.getByTestId("k-tour-id-presentation-open")).toHaveCount(0)
    await expect(setup.getByTestId("k-tour-id-credential")).toHaveAttribute("data-status", "review-draft")
  })
}

test("OPENDID-E2E-008B expired credential remains non-shareable without a requester", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-08-29T10:00:00.000Z") })
  const { traveler, setup } = await openTravelerSetup(page)
  await reachCredential(setup)
  await page.clock.fastForward((120 * 60 + 1) * 1_000)

  const credential = setup.getByTestId("k-tour-id-credential")
  await expect(credential).toHaveAttribute("data-status", "expired")
  await expect(credential).toHaveAttribute("data-code", "CREDENTIAL_EXPIRED")
  await expect(setup.getByTestId("k-tour-id-presentation-open")).toHaveCount(0)
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
