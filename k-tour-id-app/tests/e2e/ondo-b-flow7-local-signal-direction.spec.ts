import { mkdirSync } from "node:fs"
import { expect, test, type Locator, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const ACTION_GATE_KEY = "ondo-b.action-gates.v1"
const VENUE_ID = "mois-0021cd596bc5b2a922ad"
const OTHER_SIGNAL_VENUE_IDS = [
  "mois-02d77be9fc4b43fbb360", "mois-10dc6ac2751c13751604", "mois-2a37cbb20954007d7e30",
  "mois-3263fd989386997c87e7", "mois-3a0676cb833422b6b778", "mois-53b20aca46ab5d114b88",
  "mois-58b4a54e257cd45fa440", "mois-5dd00545d8f7c7d8df53", "mois-5fbfe0b73d6d508efcab",
  "mois-68ca97d50aca6cb13438", "mois-68dc154a4661821c4ab6", "mois-820a8bd1d389d6ad1f70",
] as const
const ARTIFACT_DIR = "artifacts/qa/flow7-local-signal"

type Locale = "en" | "ko" | "ja"
type EligibilityOutcome = "success" | "failure" | "unavailable" | "expired"
type Viewport = { label: string; width: number; height: number }

const VIEWPORTS: readonly Viewport[] = [
  { label: "320x568", width: 320, height: 568 },
  { label: "320x720", width: 320, height: 720 },
  { label: "390x844", width: 390, height: 844 },
  { label: "430x932", width: 430, height: 932 },
  { label: "768x1024", width: 768, height: 1024 },
  { label: "844x390", width: 844, height: 390 },
  { label: "1440x1000", width: 1440, height: 1000 },
]

const COPY = {
  en: {
    action: "Save to my visits",
    postFailure: "Couldn’t save. Your draft is still here.",
    photoAlt: "Private photo preview",
  },
  ko: {
    action: "내 방문에 저장",
    postFailure: "저장하지 못했어요. 작성 내용은 그대로예요.",
    photoAlt: "비공개 사진 미리보기",
  },
  ja: {
    action: "訪問履歴に保存",
    postFailure: "保存できませんでした。下書きはそのままです。",
    photoAlt: "非公開写真のプレビュー",
  },
} as const

test.describe.configure({ timeout: 180_000, mode: "serial" })

async function seed(page: Page, locale: Locale = "en", posted = false) {
  await page.addInitScript(({ key, language, active, venueId }) => {
    if (localStorage.getItem(key) !== null) return
    localStorage.setItem(key, JSON.stringify({
      locale: language,
      onboarding: "ONB-COMPLETE",
      persona: null,
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
      recentVenueIds: [],
      plannedTableRefs: [],
      localSignalPostedVenueIds: active ? [venueId] : [],
      localPulseEvidenceByVenue: active ? { [venueId]: { tags: ["calm_now"], postedAt: "2026-08-26T12:00:00.000Z" } } : {},
      localInteractionBoundarySeen: true,
      commerceLocalBoundarySeen: true,
      commerceReceipts: [],
    }))
  }, { key: DEVICE_KEY, language: locale, active: posted, venueId: VENUE_ID })
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("blockedbyclient"))
}

async function waitForShell(page: Page) {
  const region = page.getByTestId("ondo-scroll-region")
  await expect(region).toBeVisible()
  await expect.poll(
    () => region.evaluate((element) => element.style.getPropertyValue("--ondo-scroll-viewport")),
    { timeout: 30_000 },
  ).not.toBe("")
}

async function openSignal(page: Page, locale: Locale = "en", posted = false) {
  await seed(page, locale, posted)
  // This suite exercises deterministic review-fixture outcomes. Ordinary `/`
  // intentionally remains provider-unavailable and fail-closed.
  await page.goto("/?qa=1", { waitUntil: "domcontentloaded" })
  await waitForShell(page)
  const cityPin = page.getByTestId("ondo-b-nation").locator("[data-city='seoul']")
  await expect(cityPin).toBeEnabled()
  await cityPin.evaluate((button: HTMLButtonElement) => button.click())
  const cityRoot = page.locator("[data-testid='ondo-b-map-entry'][data-city='seoul']")
  await expect(cityRoot).toBeVisible()
  const toggle = page.getByTestId("ondo-b-view-toggle")
  await expect(toggle).toBeVisible()
  if (!await page.getByTestId("ondo-b-venue-list").isVisible()) await toggle.click({ force: true })
  await expect(page.getByTestId("ondo-b-venue-list")).toBeVisible()
  await page.getByTestId("ondo-b-venue-list").locator(`[data-venue-id='${VENUE_ID}'] button`).click({ force: true })
  await page.getByTestId("canonical-place-details").click({ force: true })
  const place = page.getByTestId("canonical-place-overlay")
  await expect(place).toHaveAttribute("data-venue-id", VENUE_ID)
  await place.getByTestId("canonical-local-signal-open").click({ force: true })
  const signal = page.getByTestId("ondo-b-local-signal")
  await expect(signal).toBeVisible()
  return { signal, place }
}

async function setEligibility(page: Page, outcome: EligibilityOutcome) {
  await page.evaluate((eligibility) => {
    const qaWindow = window as typeof window & { __ONDO_B_QA__?: Record<string, unknown> }
    qaWindow.__ONDO_B_QA__ = { ...(qaWindow.__ONDO_B_QA__ ?? {}), eligibility }
  }, outcome)
}

async function openPersonConsent(page: Page, signal: Locator) {
  await signal.getByTestId("local-signal-person-check").click()
  const actionGate = page.getByTestId("ondo-b-action-gate")
  const accountConfirm = actionGate.getByTestId("action-gate-confirm")
  if (await accountConfirm.isVisible().catch(() => false)) {
    await accountConfirm.click()
  }
  const gate = page.getByTestId("ondo-b-local-check-walkthrough")
  await expect(gate).toBeVisible()
  return gate
}

async function openEligibilityResult(page: Page, signal: Locator, outcome: EligibilityOutcome) {
  await setEligibility(page, outcome)
  const gate = await openPersonConsent(page, signal)
  await gate.getByTestId("person-route-choice-mobile_id_cx").click()
  await gate.getByTestId("local-check-boundary-continue").click()
  if (outcome === "success") {
    await expect(gate).toBeHidden()
    return gate
  }
  await expect(gate.getByTestId("local-check-result")).toHaveAttribute("data-result", outcome)
  return gate
}

async function returnFromEligibility(gate: Locator) {
  await gate.getByTestId("local-check-result").getByRole("button").last().click()
  await expect(gate).toBeHidden()
}

async function installOneShotDeviceWriteFailure(page: Page) {
  await page.evaluate((key) => {
    const original = Storage.prototype.setItem
    let pending = true
    Storage.prototype.setItem = function (name: string, value: string) {
      if (this === localStorage && name === key && pending) {
        pending = false
        throw new DOMException("Quota exceeded", "QuotaExceededError")
      }
      return original.call(this, name, value)
    }
  }, DEVICE_KEY)
}

async function expectNoHorizontalOverflow(locator: Locator) {
  const dimensions = await locator.evaluate((element) => ({ client: element.clientWidth, scroll: element.scrollWidth }))
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1)
}

async function expectControlGeometry(root: Locator) {
  for (const control of await root.locator("button:visible, textarea:visible").all()) {
    const box = await control.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.height).toBeGreaterThanOrEqual(44)
  }
}

async function returnFromSignalResult(signal: Locator, result: "unique" | "duplicate" = "unique") {
  await expect(signal).toHaveAttribute("data-signal-stage", result)
  await expect(signal.getByTestId("local-signal-result")).toHaveAttribute("data-result", result)
  await signal.getByTestId("local-signal-return").click()
  await expect(signal).toBeHidden()
}

async function discardSignalDraft(signal: Locator) {
  await signal.getByTestId("local-signal-close").click()
  await expect(signal.getByTestId("local-signal-discard")).toBeVisible()
  await signal.getByTestId("local-signal-discard").click()
  await expect(signal).toBeHidden()
}

async function quietCapture(page: Page, name: string) {
  mkdirSync(ARTIFACT_DIR, { recursive: true })
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" })
  await page.evaluate(async () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    await document.fonts.ready
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  })
  const root = page.getByTestId("ondo-b-root")
  await expect(root).toBeVisible()
  await root.screenshot({
    path: `${ARTIFACT_DIR}/${name}.png`,
    animations: "disabled",
    caret: "hide",
    scale: (page.viewportSize()?.width ?? 0) >= 1200 ? "css" : "device",
  })
}

async function sharedPlacePulseTuple(place: Locator) {
  const pulse = place.getByTestId("canonical-place-pulse")
  return pulse.evaluate((element) => ({
    level: element.getAttribute("data-pulse-level"),
    numeric: element.getAttribute("data-pulse-numeric"),
    title: element.querySelector("h3")?.textContent?.trim() ?? element.querySelector(":scope > strong")?.textContent?.trim(),
    score: element.querySelector("[data-testid='pulse-score'] dd")?.textContent?.trim() ?? null,
    count: element.querySelector("[data-testid='pulse-signal-count'] dd")?.textContent?.trim() ?? null,
    confidence: element.querySelector("[data-testid='pulse-confidence'] dd")?.textContent?.trim() ?? null,
    freshnessUpdatedAt: Array.from(element.querySelectorAll("dl > div")).at(-1)?.querySelector("dd")?.textContent?.trim()
      ?? element.querySelector(":scope > small")?.textContent?.trim(),
  }))
}

for (const viewport of VIEWPORTS.filter(({ width }) => width <= 430)) {
  test(`FLOW7-VIS-001 Local Signal keeps its in-flow continuation in the first useful ${viewport.label} viewport`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    const { signal } = await openSignal(page)
    await expect(signal).toHaveAttribute("data-visual-direction", "apple-contribution-strava")
    await expect(signal).toHaveAttribute("data-signal-stage", "draft")
    await expectNoHorizontalOverflow(signal)
    const primary = signal.getByTestId("local-signal-person-check")
    await expect(primary).toBeDisabled()
    await signal.locator("fieldset button").first().click()
    await expect(primary).toBeEnabled()
    await expect(primary.locator("xpath=..")).toHaveCSS("position", "relative")
    const box = await primary.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.height).toBeGreaterThanOrEqual(48)
    expect(box!.y).toBeGreaterThanOrEqual(0)
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height)
    await expect(signal).toHaveCSS("background-color", "rgb(255, 255, 255)")
    const privacyToggle = signal.getByTestId("local-signal-privacy-toggle")
    expect((await privacyToggle.boundingBox())!.height).toBeGreaterThanOrEqual(44)
    await expectControlGeometry(signal)
  })
}

test("FLOW7-TRUTH-001A privacy disclosure states the exact draft, device, and JIT account boundaries", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const { signal } = await openSignal(page)
  const privacy = signal.getByTestId("local-signal-privacy")
  await privacy.getByTestId("local-signal-privacy-toggle").click()
  await expect(privacy).toContainText("Only this place, your picks and the time are kept on this device")
  await expect(privacy).toContainText("The note and photo disappear when you close")
  await expect(privacy).toContainText("Saving may ask for an account, then a one-time person check")
  await expect(privacy).not.toContainText("No account, ID, or credential is created")
})

test("FLOW7-MEDIA-002 photo MIME, size, prepare, retry, replace, and remove remain distinct local states", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => { window.__ONDO_B_QA__ = { localSignalPhoto: "failure" } })
  const { signal } = await openSignal(page)
  const input = signal.getByTestId("local-signal-photo-input")

  await input.setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") })
  await expect(signal).toHaveAttribute("data-photo-stage", "photoTypeError")
  await expect(signal.getByTestId("local-signal-photo-choose-another")).toBeVisible()

  await input.setInputFiles({ name: "too-large.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc((10 * 1024 * 1024) + 1) })
  await expect(signal).toHaveAttribute("data-photo-stage", "photoSizeError")
  await expect(signal.getByTestId("local-signal-photo-choose-another")).toBeVisible()

  await input.setInputFiles("public/seoul-after-rain-hero.jpg")
  await expect(signal).toHaveAttribute("data-photo-stage", "photoPrepareError")
  await signal.getByTestId("local-signal-photo-retry").click()
  await expect(signal).toHaveAttribute("data-photo-stage", "ready")
  await expect(signal.getByTestId("local-signal-photo-preview")).toBeVisible()
  await expect(signal.getByTestId("local-signal-photo-preview")).toHaveAttribute("alt", COPY.en.photoAlt)
  await signal.getByTestId("local-signal-photo-remove").click()
  await expect(signal).toHaveAttribute("data-photo-stage", "empty")
})

test("FLOW7-MEDIA-003 invalid and unpreparable replacement preserve the last good local preview", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const { signal } = await openSignal(page)
  const input = signal.getByTestId("local-signal-photo-input")
  await input.setInputFiles("public/seoul-after-rain-hero.jpg")
  const image = signal.getByTestId("local-signal-photo-preview")
  await expect(image).toBeVisible()
  const initialSource = await image.getAttribute("src")

  await input.setInputFiles({ name: "replacement.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") })
  await expect(signal).toHaveAttribute("data-photo-stage", "photoTypeError")
  await expect(image).toHaveAttribute("src", initialSource!)

  await page.evaluate(() => { URL.createObjectURL = () => { throw new DOMException("prepare failed") } })
  await input.setInputFiles({ name: "replacement.png", mimeType: "image/png", buffer: Buffer.from([137, 80, 78, 71]) })
  await expect(signal).toHaveAttribute("data-photo-stage", "photoPrepareError")
  await expect(image).toHaveAttribute("src", initialSource!)
})

test("FLOW7-GATE-003 Person cancel, failure, unavailable, expired, and Escape return to the exact draft/place", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const { signal, place } = await openSignal(page)
  const draft = signal.getByTestId("local-signal-draft")
  const note = draft.getByTestId("local-signal-note")
  await draft.locator("fieldset button").first().click()
  await note.fill("Keep this exact Local Signal draft.")
  await signal.getByTestId("local-signal-photo-input").setInputFiles("public/seoul-after-rain-hero.jpg")

  let gate = await openPersonConsent(page, signal)
  await expect(gate.getByTestId("action-gate-signal-anchor")).toHaveAttribute("data-selected-count", "1")
  await expect(gate.getByTestId("action-gate-signal-anchor")).toHaveAttribute("data-photo", "preview")
  await expect(signal).toHaveAttribute("inert", "")
  await page.keyboard.press("Escape")
  await expect(gate).toBeHidden()
  await expect(signal.getByTestId("local-signal-person-check")).toBeFocused()
  await expect(note).toHaveValue("Keep this exact Local Signal draft.")
  await expect(place).toHaveAttribute("data-venue-id", VENUE_ID)

  for (const outcome of ["failure", "unavailable", "expired"] as const) {
    gate = await openEligibilityResult(page, signal, outcome)
    await returnFromEligibility(gate)
    await expect(draft).toHaveAttribute("data-gate-return", outcome)
    await expect(note).toHaveValue("Keep this exact Local Signal draft.")
    await expect(place).toHaveAttribute("data-venue-id", VENUE_ID)
  }
})

test("FLOW7-CANCEL-003B dirty close requires an explicit choice and Escape keeps the exact draft", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const { signal } = await openSignal(page)
  const note = signal.getByTestId("local-signal-note")
  await signal.getByTestId("local-signal-tag-calm_now").click()
  await note.fill("Keep this local note")
  await signal.getByTestId("local-signal-close").click()
  await expect(signal.getByTestId("local-signal-discard")).toBeVisible()
  await expect(signal.getByRole("button", { name: "Keep editing" })).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(signal.getByTestId("local-signal-discard")).toBeHidden()
  await expect(note).toHaveValue("Keep this local note")
  await expect(signal.getByTestId("local-signal-tag-calm_now")).toHaveAttribute("aria-pressed", "true")
  await expect(signal.getByTestId("local-signal-close")).toBeFocused()
})

test("FLOW7-EXIT-003C accepted discard keeps one frozen modal until removal, then restores the exact Place action", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await page.setViewportSize({ width: 390, height: 844 })
  const { signal, place } = await openSignal(page)
  const placeOpener = place.getByTestId("canonical-local-signal-open")
  await signal.getByTestId("local-signal-tag-calm_now").click()
  await signal.getByTestId("local-signal-note").fill("Keep the painted exit exact")
  await signal.getByTestId("local-signal-close").click()
  const decision = signal.getByTestId("local-signal-discard")
  await expect(decision).toBeVisible()

  await decision.click()
  await expect(signal).toHaveAttribute("data-signal-presence", "closing")
  await expect(decision).toBeVisible()
  await expect(placeOpener).not.toBeFocused()
  await page.waitForTimeout(140)
  await expect(signal).toBeVisible()
  await expect(decision).toBeVisible()

  await expect(signal).toHaveCount(0)
  await expect(place).toBeVisible()
  await expect(placeOpener).toBeFocused()
})

test("FLOW7-SESSION-004 Person success expires on the actual clock and cannot cross close, venue, navigation, or reload boundaries", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  let { signal, place } = await openSignal(page)
  await signal.locator("fieldset button").first().click()
  await openEligibilityResult(page, signal, "success")
  await expect(signal.getByTestId("local-signal-post")).toBeVisible()
  const personExpiresAt = await page.evaluate((key) => {
    const session = JSON.parse(sessionStorage.getItem(key) ?? "{}") as { person?: { expiresAt?: unknown } }
    return typeof session.person?.expiresAt === "string" ? session.person.expiresAt : null
  }, ACTION_GATE_KEY)
  expect(personExpiresAt).toEqual(expect.any(String))
  await page.clock.setFixedTime(new Date(Date.parse(personExpiresAt!) + 1))
  await signal.getByTestId("local-signal-post").click()
  await expect(signal.getByTestId("local-signal-person-check")).toBeVisible()
  await expect(signal.getByTestId("local-signal-draft")).toHaveAttribute("data-gate-return", "expired")
  await page.clock.resume()

  await discardSignalDraft(signal)
  await place.getByRole("button", { name: "Close place" }).click()
  await expect(place).toBeHidden()
  const venueList = page.getByTestId("ondo-b-venue-list")
  if (!await venueList.isVisible()) await page.getByTestId("ondo-b-view-toggle").click({ force: true })
  await expect(venueList).toBeVisible()
  const venueButtons = venueList.locator("li button")
  await venueButtons.nth(1).scrollIntoViewIfNeeded()
  await venueButtons.nth(1).click()
  const switchedPeek = page.getByTestId("canonical-place-peek")
  await expect(switchedPeek).toBeVisible()
  const switchedVenue = await switchedPeek.getAttribute("data-venue-id")
  expect(switchedVenue).not.toBe(VENUE_ID)
  await switchedPeek.getByTestId("canonical-place-details").click()
  place = page.getByTestId("canonical-place-overlay")
  await expect(place).toBeVisible()
  await place.getByTestId("canonical-local-signal-open").click({ force: true })
  signal = page.getByTestId("ondo-b-local-signal")
  await expect(signal.getByTestId("local-signal-draft")).toHaveAttribute("data-gate-return", "none")
  await expect(signal.getByTestId("local-signal-person-check")).toBeVisible()

  await signal.getByTestId("local-signal-close").click()
  await expect(signal).toBeHidden()
  await place.getByRole("button", { name: "Close place" }).click()
  await expect(place).toBeHidden()
  await page.getByTestId("nav-my").click({ force: true })
  await page.getByTestId("nav-ondo").click({ force: true })
  await page.reload({ waitUntil: "domcontentloaded" })
  await waitForShell(page)
  await expect(page.getByTestId("ondo-b-local-signal")).toBeHidden()
})

test("FLOW7-POST-005 device persistence is durable-first, keeps Pulse invariant, and preserves the exact draft on failure", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  const { signal, place } = await openSignal(page)
  const draft = signal.getByTestId("local-signal-draft")
  const note = draft.getByTestId("local-signal-note")
  const pulseBefore = await place.getByTestId("canonical-place-pulse").evaluate((element) => ({
    level: element.getAttribute("data-pulse-level"),
    numeric: element.getAttribute("data-pulse-numeric"),
    score: element.querySelector("[data-testid='pulse-score']")?.textContent,
    count: element.querySelector("[data-testid='pulse-signal-count']")?.textContent,
  }))
  await draft.locator("fieldset button").first().click()
  await note.fill("This note must never enter storage.")
  await openEligibilityResult(page, signal, "success")

  await installOneShotDeviceWriteFailure(page)
  await signal.getByTestId("local-signal-post").click()
  await expect(signal.getByTestId("local-signal-post-error")).toHaveText(COPY.en.postFailure)
  await expect(signal).toHaveAttribute("data-signal-stage", "failed")
  await expect(note).toHaveValue("This note must never enter storage.")
  let stored = await page.evaluate((key) => localStorage.getItem(key) ?? "", DEVICE_KEY)
  expect(stored).not.toContain("This note must never enter storage")
  expect(JSON.parse(stored).localSignalPostedVenueIds).toEqual([])

  await signal.getByTestId("local-signal-post").click()
  await returnFromSignalResult(signal)
  await expect(place).toBeVisible()
  await expect(place).toHaveAttribute("data-venue-id", VENUE_ID)
  const pulseAfter = await place.getByTestId("canonical-place-pulse").evaluate((element) => ({
    level: element.getAttribute("data-pulse-level"),
    numeric: element.getAttribute("data-pulse-numeric"),
    score: element.querySelector("[data-testid='pulse-score']")?.textContent,
    count: element.querySelector("[data-testid='pulse-signal-count']")?.textContent,
  }))
  expect(pulseAfter).toEqual(pulseBefore)
  stored = await page.evaluate((key) => localStorage.getItem(key) ?? "", DEVICE_KEY)
  expect(stored).not.toContain("This note must never enter storage")
  expect(JSON.parse(stored).localPulseEvidenceByVenue[VENUE_ID].tags).toEqual(["calm_now"])
  expect(Date.parse(JSON.parse(stored).localPulseEvidenceByVenue[VENUE_ID].postedAt)).not.toBeNaN()
})

test("FLOW7-DUPLICATE-006 an already-posted venue is terminally deduplicated without replacing local evidence", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const { signal } = await openSignal(page, "en", true)
  await expect(signal).toHaveAttribute("data-signal-stage", "draft")
  await signal.locator("fieldset button").nth(1).click()
  await openEligibilityResult(page, signal, "success")
  await expect(signal.getByTestId("local-signal-post")).toHaveText(COPY.en.action)
  await signal.getByTestId("local-signal-post").click()
  await expect(signal.getByTestId("local-signal-result")).toHaveAttribute("data-result", "duplicate")
  await expect(signal.getByTestId("local-signal-result")).toHaveAttribute("data-result-tone", "neutral")
  await expect(signal).not.toHaveAttribute("data-upl-state", "UPL-SENT")
  await expect(signal.getByTestId("local-signal-result-axes")).toHaveCount(0)
  const evidence = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}").localPulseEvidenceByVenue["mois-0021cd596bc5b2a922ad"], DEVICE_KEY)
  expect(evidence).toEqual({ tags: ["calm_now"], postedAt: "2026-08-26T12:00:00.000Z" })
  await returnFromSignalResult(signal, "duplicate")
})

test("FLOW7-HISTORY-007 reload keeps only device evidence, opens its exact Place, and failed clear keeps it", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const { signal } = await openSignal(page)
  await signal.locator("fieldset button").first().click()
  await openEligibilityResult(page, signal, "success")
  await signal.getByTestId("local-signal-post").click()
  await returnFromSignalResult(signal)
  await page.reload({ waitUntil: "domcontentloaded" })
  await waitForShell(page)
  const restoredPlace = page.getByTestId("canonical-place-overlay")
  await expect(restoredPlace).toHaveAttribute("data-venue-id", VENUE_ID)
  await restoredPlace.getByRole("button", { name: "Close place" }).click()
  await page.getByTestId("nav-my").click({ force: true })
  const history = page.getByTestId(`contribution-venue-${VENUE_ID}`)
  await expect(history).toBeVisible()
  await history.click()
  const historyPeek = page.getByTestId("canonical-place-peek")
  await expect(historyPeek).toHaveAttribute("data-venue-id", VENUE_ID)
  await historyPeek.getByTestId("canonical-place-details").click()
  const historyPlace = page.getByTestId("canonical-place-overlay")
  await expect(historyPlace).toHaveAttribute("data-venue-id", VENUE_ID)
  await historyPlace.getByRole("button", { name: "Close place" }).click()

  await page.getByTestId("nav-settings").click({ force: true })
  const disclosure = page.getByTestId("ondo-b-device-data-settings")
  await disclosure.click()
  await page.getByTestId("ondo-b-clear-device-open").click()
  await installOneShotDeviceWriteFailure(page)
  const confirm = page.getByTestId("ondo-b-clear-device-confirm")
  await confirm.getByRole("button", { name: "Delete saved data", exact: true }).click()
  await expect(confirm.getByTestId("ondo-b-clear-device-error")).toBeVisible()
  await expect(page.getByTestId("ondo-toast")).toBeHidden()
  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}"), DEVICE_KEY)
  expect(stored.localSignalPostedVenueIds).toEqual([VENUE_ID])
  expect(stored.localPulseEvidenceByVenue[VENUE_ID].tags).toEqual(["calm_now"])
  await confirm.getByRole("button", { name: "Delete saved data", exact: true }).click()
  await expect(confirm).toBeHidden()
  const cleared = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}"), DEVICE_KEY)
  expect(cleared.localSignalPostedVenueIds).toEqual([])
  expect(cleared.localPulseEvidenceByVenue).toEqual({})
})

test("FLOW7-MEDIA-008 MIME-valid corrupt media is rejected atomically and every object URL is revoked once", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await page.addInitScript(() => {
    const originalCreate = URL.createObjectURL.bind(URL)
    const originalRevoke = URL.revokeObjectURL.bind(URL)
    const read = (key: string) => JSON.parse(sessionStorage.getItem(key) ?? "[]") as string[]
    URL.createObjectURL = (value) => {
      const url = originalCreate(value)
      if (value instanceof Blob && value.type.startsWith("image/")) {
        sessionStorage.setItem("flow7-created", JSON.stringify([...read("flow7-created"), url]))
      }
      return url
    }
    URL.revokeObjectURL = (url) => {
      if (read("flow7-created").includes(url)) {
        sessionStorage.setItem("flow7-revoked", JSON.stringify([...read("flow7-revoked"), url]))
      }
      originalRevoke(url)
    }
  })
  const { signal, place } = await openSignal(page)
  const input = signal.getByTestId("local-signal-photo-input")
  await input.setInputFiles("public/seoul-after-rain-hero.jpg")
  const preview = signal.getByTestId("local-signal-photo-preview")
  await expect(preview).toBeVisible()
  await preview.evaluate((image) => (image as HTMLImageElement).decode())
  const readySource = await preview.getAttribute("src")

  await input.setInputFiles({ name: "corrupt.jpg", mimeType: "image/jpeg", buffer: Buffer.from("not a decodable jpeg") })
  await expect(preview).toHaveAttribute("src", readySource!)
  const error = signal.getByTestId("local-signal-photo-error")
  const chooseAnother = signal.getByTestId("local-signal-photo-choose-another")
  await expect(error).toHaveAttribute("data-error", "photoPrepareError")
  await expect(chooseAnother).toBeVisible()
  await expect(signal.getByTestId("local-signal-photo-replace")).toBeVisible()
  await expect(signal.getByTestId("local-signal-photo-remove")).toBeVisible()
  for (const locator of [preview, error, chooseAnother]) await expect(locator).toBeInViewport()
  let urls = await page.evaluate(() => ({
    created: JSON.parse(sessionStorage.getItem("flow7-created") ?? "[]") as string[],
    revoked: JSON.parse(sessionStorage.getItem("flow7-revoked") ?? "[]") as string[],
  }))
  expect(urls.created).toHaveLength(2)
  expect(urls.revoked).toEqual([urls.created[1]])

  await signal.getByTestId("local-signal-photo-remove").click()
  urls = await page.evaluate(() => ({
    created: JSON.parse(sessionStorage.getItem("flow7-created") ?? "[]") as string[],
    revoked: JSON.parse(sessionStorage.getItem("flow7-revoked") ?? "[]") as string[],
  }))
  expect(urls.revoked).toEqual([urls.created[1], urls.created[0]])

  await input.setInputFiles("public/seoul-after-rain-hero.jpg")
  await expect(preview).toBeVisible()
  await discardSignalDraft(signal)
  await expect(signal).toBeHidden()
  urls = await page.evaluate(() => ({
    created: JSON.parse(sessionStorage.getItem("flow7-created") ?? "[]") as string[],
    revoked: JSON.parse(sessionStorage.getItem("flow7-revoked") ?? "[]") as string[],
  }))
  expect(urls.revoked).toEqual([urls.created[1], urls.created[0], urls.created[2]])

  await place.getByTestId("canonical-local-signal-open").click()
  const postSignal = page.getByTestId("ondo-b-local-signal")
  await postSignal.locator("fieldset button").first().click()
  await postSignal.getByTestId("local-signal-photo-input").setInputFiles("public/seoul-after-rain-hero.jpg")
  await openEligibilityResult(page, postSignal, "success")
  await postSignal.getByTestId("local-signal-post").click()
  await returnFromSignalResult(postSignal)
  urls = await page.evaluate(() => ({
    created: JSON.parse(sessionStorage.getItem("flow7-created") ?? "[]") as string[],
    revoked: JSON.parse(sessionStorage.getItem("flow7-revoked") ?? "[]") as string[],
  }))
  expect(urls.revoked.at(-1)).toBe(urls.created.at(-1))
  expect(new Set(urls.revoked).size).toBe(urls.revoked.length)
})

test("FLOW7-TRAVERSAL-009 Back and Forward discard the draft, photo, and Person session instead of resurrecting the layer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const { signal } = await openSignal(page)
  await signal.locator("fieldset button").first().click()
  await signal.getByTestId("local-signal-note").fill("Must disappear on traversal")
  await signal.getByTestId("local-signal-photo-input").setInputFiles("public/seoul-after-rain-hero.jpg")
  await openEligibilityResult(page, signal, "success")

  await page.goBack()
  await expect(signal).toBeHidden()
  await expect(page.getByTestId("canonical-place-peek")).toHaveAttribute("data-venue-id", VENUE_ID)
  await page.goForward()
  const place = page.getByTestId("canonical-place-overlay")
  await expect(place).toHaveAttribute("data-venue-id", VENUE_ID)
  await expect(page.getByTestId("ondo-b-local-signal")).toBeHidden()
  await place.getByTestId("canonical-local-signal-open").click()
  const reopened = page.getByTestId("ondo-b-local-signal")
  await expect(reopened.getByTestId("local-signal-note")).toHaveValue("")
  await expect(reopened.locator("fieldset button[aria-pressed='true']")).toHaveCount(0)
  await expect(reopened.getByTestId("local-signal-photo-preview")).toHaveCount(0)
  await expect(reopened).toHaveAttribute("data-signal-stage", "draft")
})

test("FLOW7-DATA-010 a thirteenth post is bounded in React and disk before and after reload", async ({ page }) => {
  await page.addInitScript(({ key, venueIds }) => {
    if (localStorage.getItem(key) !== null) return
    const localPulseEvidenceByVenue = Object.fromEntries(venueIds.map((venueId, index) => [venueId, { tags: ["calm_now"], postedAt: `2026-08-${String(index + 1).padStart(2, "0")}T12:00:00.000Z` }]))
    localStorage.setItem(key, JSON.stringify({
      locale: "en", onboarding: "ONB-COMPLETE", persona: null, discoveryPreferences: [], savedVenueIds: [], privateNotesByVenue: {},
      recentVenueIds: [], plannedTableRefs: [], localSignalPostedVenueIds: venueIds, localPulseEvidenceByVenue,
      localInteractionBoundarySeen: true, commerceLocalBoundarySeen: true, commerceReceipts: [],
    }))
  }, { key: DEVICE_KEY, venueIds: OTHER_SIGNAL_VENUE_IDS })
  const { signal } = await openSignal(page)
  await signal.locator("fieldset button").first().click()
  await openEligibilityResult(page, signal, "success")
  await signal.getByTestId("local-signal-post").click()
  await returnFromSignalResult(signal)

  for (const phase of ["runtime", "reload"] as const) {
    if (phase === "reload") {
      await page.reload({ waitUntil: "domcontentloaded" })
      await waitForShell(page)
    }
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}"), DEVICE_KEY)
    expect(stored.localSignalPostedVenueIds).toHaveLength(12)
    expect(Object.keys(stored.localPulseEvidenceByVenue)).toHaveLength(12)
    expect(stored.localSignalPostedVenueIds[0]).toBe(VENUE_ID)
    expect(Object.keys(stored.localPulseEvidenceByVenue).sort()).toEqual([...stored.localSignalPostedVenueIds].sort())
    const place = page.getByTestId("canonical-place-overlay")
    if (await place.isVisible()) await place.getByRole("button", { name: "Close place" }).click()
    await page.getByTestId("nav-my").click({ force: true })
    await expect(page.locator("[data-testid^='contribution-venue-']")).toHaveCount(12)
    if (phase === "runtime") await page.getByTestId("nav-ondo").click({ force: true })
  }
})

test("FLOW7-PULSE-011 posting preserves the full shared tuple on Place, List, Map, and reload", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const { signal, place } = await openSignal(page)
  const before = await sharedPlacePulseTuple(place)
  expect(before).toEqual({
    level: "peak", numeric: "hidden", title: "ONDO temperature · PEAK", score: "91", count: "24", confidence: "High",
    freshnessUpdatedAt: "Curated snapshot · 2026-08-25 02:20 UTC",
  })
  await signal.locator("fieldset button").first().click()
  await openEligibilityResult(page, signal, "success")
  await signal.getByTestId("local-signal-post").click()
  await returnFromSignalResult(signal)
  expect(await sharedPlacePulseTuple(place)).toEqual(before)

  await page.reload({ waitUntil: "domcontentloaded" })
  await waitForShell(page)
  const reloadedPlace = page.getByTestId("canonical-place-overlay")
  expect(await sharedPlacePulseTuple(reloadedPlace)).toEqual(before)
  await reloadedPlace.getByRole("button", { name: "Close place" }).click()
  const list = page.getByTestId("ondo-b-venue-list")
  const rows = list.locator("li[data-venue-id]")
  const targetRow = rows.filter({ has: page.locator(`[data-venue-id='${VENUE_ID}']`) })
  const rowIndex = await rows.evaluateAll((items, venueId) => items.findIndex((item) => item.getAttribute("data-venue-id") === venueId), VENUE_ID)
  // A device-local contribution must not promote the venue ahead of the
  // shared curated ordering. This fixture is fourth in that stable tuple.
  expect(rowIndex).toBe(3)
  const listPulse = list.locator(`[data-venue-id='${VENUE_ID}'] [data-testid='ondo-b-list-pulse']`)
  await expect(listPulse).toHaveAttribute("data-pulse-numeric", "hidden")
  await expect(listPulse).toHaveAttribute("aria-label", "Place temperature · PEAK · Your Local Signal is included on this device")
  expect(await targetRow.count()).toBeLessThanOrEqual(1)
  await page.getByTestId("ondo-b-view-toggle").click()
  const accessible = page.getByTestId("ondo-b-pulse-marker-accessible-detail").locator("li")
  await expect(accessible.first()).toContainText("Place temperature · PEAK · freshness curated snapshot · confidence high")
})

test("FLOW7-CONSENT-012 phone Person gate keeps both 44px decisions visible and details progressively reachable", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  const { signal } = await openSignal(page)
  await signal.locator("fieldset button").first().click()
  const gate = await openPersonConsent(page, signal)
  await gate.getByTestId("person-route-choice-mobile_id_cx").click()
  const verify = gate.getByTestId("local-check-boundary-continue")
  const decline = gate.getByTestId("action-gate-cancel")
  for (const action of [verify, decline]) {
    await expect(action).toBeInViewport()
    const box = await action.boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(44)
  }
  for (const row of ["consent-minimum", "consent-retention"]) {
    await gate.getByTestId(row).scrollIntoViewIfNeeded()
    await expect(gate.getByTestId(row)).toBeVisible()
  }
  await gate.getByTestId("person-provider-disclosure").locator("summary").click()
  for (const row of ["consent-requester", "consent-purpose"]) {
    await gate.getByTestId(row).scrollIntoViewIfNeeded()
    await expect(gate.getByTestId(row)).toBeVisible()
  }
  await quietCapture(page, "successor-en-320x720-person-consent")
})

test("FLOW7-VIS-013 photo error decisions stay visible on phones and landscape photo states reset below the header", async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: width === 320 ? 720 : 844 })
    if (page.url() !== "about:blank") await page.evaluate(() => localStorage.clear())
    const { signal } = await openSignal(page)
    const input = signal.getByTestId("local-signal-photo-input")
    await input.setInputFiles("public/seoul-after-rain-hero.jpg")
    const preview = signal.getByTestId("local-signal-photo-preview")
    await preview.evaluate((image) => (image as HTMLImageElement).decode())
    const readySource = await preview.getAttribute("src")
    await input.setInputFiles({ name: "corrupt.png", mimeType: "image/png", buffer: Buffer.from("not a decodable png") })
    await expect(preview).toHaveAttribute("src", readySource!)
    for (const visible of [preview, signal.getByTestId("local-signal-photo-error"), signal.getByTestId("local-signal-photo-choose-another")]) {
      await expect(visible).toBeInViewport()
    }
    await quietCapture(page, `successor-en-${width}x${width === 320 ? 720 : 844}-photo-decode-error-preserved`)
    await discardSignalDraft(signal)
  }

  for (const locale of ["ko", "ja"] as const) {
    await page.setViewportSize({ width: 844, height: 390 })
    await page.evaluate(({ key, language }) => {
      const current = JSON.parse(localStorage.getItem(key) ?? "{}")
      localStorage.setItem(key, JSON.stringify({ ...current, locale: language, localSignalPostedVenueIds: [], localPulseEvidenceByVenue: {} }))
    }, { key: DEVICE_KEY, language: locale })
    await page.addInitScript(() => { window.__ONDO_B_QA__ = { localSignalPhoto: "failure" } })
    const { signal } = await openSignal(page, locale)
    const body = signal.locator(":scope > div")
    const photoControl = signal.getByTestId("local-signal-photo-input")
    const header = signal.locator(":scope > header")
    const expectPhotoStateBelowHeader = async () => {
      const visiblePhotoState = signal.getByTestId("local-signal-photo-slot")
      await visiblePhotoState.scrollIntoViewIfNeeded()
      const [photoBox, headerBox] = await Promise.all([visiblePhotoState.boundingBox(), header.boundingBox()])
      expect(photoBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height)
      await expect(photoControl).toBeAttached()
    }
    await body.evaluate((element) => element.scrollTo({ top: element.scrollHeight, behavior: "instant" }))
    await signal.getByTestId("local-signal-photo-input").setInputFiles("public/seoul-after-rain-hero.jpg")
    await expect(signal.getByTestId("local-signal-photo-error")).toHaveAttribute("data-error", "photoPrepareError")
    await expectPhotoStateBelowHeader()
    await quietCapture(page, `successor-${locale}-844x390-photo-prepare-error`)
    await body.evaluate((element) => element.scrollTo({ top: element.scrollHeight, behavior: "instant" }))
    await signal.getByTestId("local-signal-photo-retry").click()
    await expect(signal.getByTestId("local-signal-photo-preview")).toBeVisible()
    await expectPhotoStateBelowHeader()
    await quietCapture(page, `successor-${locale}-844x390-photo-ready`)
    await body.evaluate((element) => element.scrollTo({ top: element.scrollHeight, behavior: "instant" }))
    await signal.getByTestId("local-signal-photo-remove").click()
    await expectPhotoStateBelowHeader()
    await quietCapture(page, `successor-${locale}-844x390-photo-removed`)
    await discardSignalDraft(signal)
  }
})

test("FLOW7-REFLOW-014 320px at 200% keeps picks, photo states and the anchored action in one scroll axis", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 })
  const { signal } = await openSignal(page, "ja")
  await page.evaluate(() => {
    document.documentElement.style.setProperty("-webkit-text-size-adjust", "200%")
    document.documentElement.style.setProperty("text-size-adjust", "200%")
  })
  await signal.getByTestId("local-signal-tag-calm_now").click()
  const photo = signal.getByTestId("local-signal-photo-slot")
  await photo.scrollIntoViewIfNeeded()
  const geometry = await signal.evaluate((element) => ({ clientWidth: element.clientWidth, scrollWidth: element.scrollWidth }))
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1)
  const photoBox = await photo.boundingBox()
  expect(photoBox!.width / photoBox!.height).toBeCloseTo(4 / 3, 1)
  await expect(signal.getByTestId("local-signal-draft-anchor")).toBeVisible()
  await expect(signal.getByTestId("local-signal-person-check")).toBeInViewport()
})

for (const locale of ["en", "ko", "ja"] as const) {
  for (const viewport of VIEWPORTS) {
    test(`FLOW7-CAPTURE ${locale} ${viewport.label} complete state matrix`, async ({ page }) => {
      test.skip(process.env.ONDO_FLOW7_CAPTURE !== "1", "Run after PRODUCT seal with ONDO_FLOW7_CAPTURE=1")
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.addInitScript(() => { window.__ONDO_B_QA__ = { localSignalPhoto: "failure" } })
      const { signal, place } = await openSignal(page, locale)
      const body = signal.locator(":scope > div")
      await body.evaluate((element) => element.scrollTo({ top: 0, behavior: "instant" }))
      await quietCapture(page, `${locale}-${viewport.label}-initial`)

      const draft = signal.getByTestId("local-signal-draft")
      const note = draft.getByTestId("local-signal-note")
      await draft.locator("fieldset button").first().click()
      await note.fill("Same place, same local draft.")
      await note.scrollIntoViewIfNeeded()
      await quietCapture(page, `${locale}-${viewport.label}-selected-note`)

      const input = signal.getByTestId("local-signal-photo-input")
      await input.setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") })
      await signal.getByTestId("local-signal-photo-error").scrollIntoViewIfNeeded()
      await quietCapture(page, `${locale}-${viewport.label}-photo-mime-error`)
      await input.setInputFiles({ name: "too-large.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc((10 * 1024 * 1024) + 1) })
      await quietCapture(page, `${locale}-${viewport.label}-photo-size-error`)
      await input.setInputFiles("public/seoul-after-rain-hero.jpg")
      await expect(signal.getByTestId("local-signal-photo-retry")).toBeVisible()
      await quietCapture(page, `${locale}-${viewport.label}-photo-prepare-error`)
      await signal.getByTestId("local-signal-photo-retry").click()
      await expect(signal.getByTestId("local-signal-photo-preview")).toBeVisible()
      await signal.getByTestId("local-signal-photo-preview").evaluate((image) => (image as HTMLImageElement).decode())
      await quietCapture(page, `${locale}-${viewport.label}-photo-ready`)
      const readySource = await signal.getByTestId("local-signal-photo-preview").getAttribute("src")
      await input.setInputFiles({ name: "bad-replacement.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") })
      await expect(signal.getByTestId("local-signal-photo-preview")).toHaveAttribute("src", readySource!)
      await quietCapture(page, `${locale}-${viewport.label}-photo-invalid-replacement-preserved`)
      await signal.getByTestId("local-signal-photo-remove").click()
      await quietCapture(page, `${locale}-${viewport.label}-photo-removed`)
      await input.setInputFiles("public/seoul-after-rain-hero.jpg")
      await expect(signal.getByTestId("local-signal-photo-preview")).toBeVisible()

      let gate = await openPersonConsent(page, signal)
      await quietCapture(page, `${locale}-${viewport.label}-person-consent`)
      await gate.locator("header button").click()
      await expect(gate).toBeHidden()
      await quietCapture(page, `${locale}-${viewport.label}-person-cancel-return`)

      for (const outcome of ["failure", "unavailable", "expired"] as const) {
        gate = await openEligibilityResult(page, signal, outcome)
        await quietCapture(page, `${locale}-${viewport.label}-person-${outcome}`)
        await returnFromEligibility(gate)
      }

      await openEligibilityResult(page, signal, "success")
      await signal.getByTestId("local-signal-post").scrollIntoViewIfNeeded()
      await quietCapture(page, `${locale}-${viewport.label}-person-ready`)
      await installOneShotDeviceWriteFailure(page)
      await signal.getByTestId("local-signal-post").click()
      const postError = signal.getByTestId("local-signal-post-error")
      const retryPost = signal.getByTestId("local-signal-post")
      await expect(postError).toHaveText(COPY[locale].postFailure)
      await expect(postError).toBeInViewport()
      await expect(retryPost).toBeInViewport()
      await quietCapture(page, `${locale}-${viewport.label}-post-storage-failure`)
      await retryPost.click()
      await returnFromSignalResult(signal)
      await expect(place).toBeVisible()
      await quietCapture(page, `${locale}-${viewport.label}-posted-return-place`)

      await place.getByTestId("canonical-local-signal-open").click()
      const updateSignal = page.getByTestId("ondo-b-local-signal")
      await updateSignal.locator("fieldset button").nth(1).click()
      await openEligibilityResult(page, updateSignal, "success")
      await expect(updateSignal.getByTestId("local-signal-post")).toHaveText(COPY[locale].action)
      await updateSignal.getByTestId("local-signal-post").scrollIntoViewIfNeeded()
      await quietCapture(page, `${locale}-${viewport.label}-already-posted-update`)
      await updateSignal.getByTestId("local-signal-post").click()
      await returnFromSignalResult(updateSignal, "duplicate")
      await page.reload({ waitUntil: "domcontentloaded" })
      await waitForShell(page)
      const reloadedPlace = page.getByTestId("canonical-place-overlay")
      await expect(reloadedPlace).toHaveAttribute("data-venue-id", VENUE_ID)
      await quietCapture(page, `${locale}-${viewport.label}-reloaded-exact-place`)
      await reloadedPlace.locator("header button").last().click()
      await page.getByTestId("nav-my").click({ force: true })
      await page.getByTestId(`contribution-venue-${VENUE_ID}`).scrollIntoViewIfNeeded()
      await quietCapture(page, `${locale}-${viewport.label}-my-history-reload`)
      await page.getByTestId(`contribution-venue-${VENUE_ID}`).click()
      const historyPeek = page.getByTestId("canonical-place-peek")
      await expect(historyPeek).toHaveAttribute("data-venue-id", VENUE_ID)
      await historyPeek.getByTestId("canonical-place-details").click()
      const historyPlace = page.getByTestId("canonical-place-overlay")
      await expect(historyPlace).toHaveAttribute("data-venue-id", VENUE_ID)
      await quietCapture(page, `${locale}-${viewport.label}-my-history-exact-place`)
      await historyPlace.locator("header button").last().click()
      await page.getByTestId("nav-settings").click({ force: true })
      const disclosure = page.getByTestId("ondo-b-device-data-settings")
      await disclosure.click()
      await page.getByTestId("ondo-b-clear-device-open").click()
      await installOneShotDeviceWriteFailure(page)
      const clearConfirm = page.getByTestId("ondo-b-clear-device-confirm")
      await clearConfirm.locator("button").last().click()
      await expect(clearConfirm.getByTestId("ondo-b-clear-device-error")).toBeVisible()
      await quietCapture(page, `${locale}-${viewport.label}-clear-storage-failure`)
    })
  }
}
