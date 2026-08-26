import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

test("FLOW7-DIR-001 Local Signal declares one Apple contribution and Strava completion grammar", () => {
  const signal = source("features/ondo/local-signal-b/local-signal-layer-b.tsx")
  const styles = source("features/ondo/local-signal-b/local-signal-layer-b.module.css")

  expect(signal).toContain('data-visual-direction="apple-contribution-strava"')
  expect(signal).toContain("data-signal-stage={signalStage}")
  expect(signal).toContain("data-photo-stage={photoStage}")

  for (const token of [
    "--signal-ink",
    "--signal-paper",
    "--signal-coral",
    "--signal-plum",
    "--signal-mint",
    "--signal-motion-fast: 180ms",
    "--signal-motion-state: 240ms",
    "--signal-motion-complete: 320ms",
  ]) expect(styles).toContain(token)

  expect(styles).toContain("@media (prefers-reduced-motion: reduce)")
  expect(styles).toMatch(/min-height:\s*(?:4[4-9]|[5-9]\d)px/)
  expect(styles).toContain(":focus-visible")
})

test("FLOW7-TRUTH-002 every Local Signal action and recovery state remains reachable without public claims", () => {
  const signal = source("features/ondo/local-signal-b/local-signal-layer-b.tsx")
  const walkthrough = source("features/ondo/identity-b/local-check-walkthrough-b.tsx")

  for (const testId of [
    "ondo-b-local-signal",
    "local-signal-draft",
    "local-signal-photo-input",
    "local-signal-photo-replace",
    "local-signal-photo-remove",
    "local-signal-photo-error",
    "local-signal-photo-retry",
    "local-signal-photo-choose-another",
    "local-signal-person-check",
    "local-signal-post",
    "local-signal-post-error",
  ]) expect(signal).toContain(`data-testid=\"${testId}\"`)

  for (const truth of [
    "nothing is uploaded",
    "Shared Pulse scores and counts do not change",
    "Your exact draft and place remain open",
    "note and photo are discarded",
    "failure",
    "unavailable",
    "expired",
  ]) expect(`${signal}\n${walkthrough}`).toContain(truth)

  expect(signal).toContain("copy.update")
  expect(signal).toContain("copy.updated")
  expect(`${signal}\n${walkthrough}`).not.toMatch(/public reputation|uploaded successfully|shared publicly|verified visit|official Pulse score increased/i)
})

test("FLOW7-PERSIST-003 only canonical tag IDs and post time enter device history", () => {
  const provider = source("features/ondo/shared/state/ondo-b-provider.tsx")
  const signal = source("features/ondo/local-signal-b/local-signal-layer-b.tsx")
  const my = source("features/ondo/my/saved-entry-b.tsx")

  for (const evidence of [
    "localSignalPostedVenueIds",
    "localPulseEvidenceByVenue",
    "safeTags",
    "postedAt",
    "markLocalSignalPosted",
    "state.localSignalPostedVenueIds",
  ]) expect(`${provider}\n${signal}\n${my}`).toContain(evidence)

  const deviceType = provider.slice(provider.indexOf("type OndoBDeviceState"), provider.indexOf("const B_DEVICE_KEY"))
  expect(deviceType).not.toMatch(/localSignalDraft|photoFile|photoUrl|note:/)
  expect(signal).toContain("if (!actions.markLocalSignalPosted(activeVenue.id))")
  expect(signal).toContain("setPostFailed(true)")
  expect(signal).toContain("removePhoto()")
})

test("FLOW7-RETURN-004 nested Person checks preserve exact draft/place and own modal isolation", () => {
  const signal = source("features/ondo/local-signal-b/local-signal-layer-b.tsx")
  const walkthrough = source("features/ondo/identity-b/local-check-walkthrough-b.tsx")
  const isolation = source("features/ondo/shared/ui/use-modal-isolation.ts")

  expect(signal).toContain("useModalIsolation(open, layerRef)")
  expect(walkthrough).toContain("useModalIsolation(true, layerRef)")
  expect(isolation).toContain('element.setAttribute("inert", "")')
  expect(signal).toContain("onReturn={handleGateReturn}")
  expect(signal).toContain("activeDraft.note")
  expect(signal).toContain("activeDraft.tags")
  expect(signal).toContain("activeVenue.id")
  expect(signal).toContain('event.key === "Escape"')
})

test("FLOW7-SESSION-005 Person results are exact, expiring, component-only envelopes", () => {
  const signal = source("features/ondo/local-signal-b/local-signal-layer-b.tsx")
  const provider = source("features/ondo/shared/state/ondo-b-provider.tsx")

  for (const field of ["origin", "venueId", "draftNonce", "issuedAt", "expiresAt", "outcome"]) {
    expect(signal).toContain(field)
  }
  expect(signal).toContain("LOCAL_SIGNAL_PERSON_RESULT_TTL_MS")
  expect(signal).toContain("Date.now()")
  expect(signal).toMatch(/expiresAt\s*<=\s*Date\.now\(\)/)
  expect(signal).toContain("setGateSession(null)")
  expect(signal).toContain("setWalkthroughOpen(false)")

  const deviceType = provider.slice(provider.indexOf("type OndoBDeviceState"), provider.indexOf("const B_DEVICE_KEY"))
  expect(deviceType).not.toMatch(/draftNonce|issuedAt|expiresAt|gateSession|personReady/)
})

test("FLOW7-MEDIA-006 invalid replacement never destroys a prepared local preview", () => {
  const signal = source("features/ondo/local-signal-b/local-signal-layer-b.tsx")

  expect(signal).toContain("const previousUrl = photoUrlRef.current")
  expect(signal).toMatch(/try\s*\{[\s\S]*URL\.createObjectURL\(file\)[\s\S]*\}\s*catch/)
  expect(signal).toMatch(/LOCAL_SIGNAL_PHOTO_TYPES\.has\(file\.type\)[\s\S]*file\.size > MAX_LOCAL_SIGNAL_PHOTO_BYTES[\s\S]*URL\.createObjectURL/)
  expect(signal).toContain("if (previousUrl) URL.revokeObjectURL(previousUrl)")
})

test("FLOW7-COPY-007 local-only draft copy never promises benefit or public contribution", () => {
  const signal = source("features/ondo/local-signal-b/local-signal-layer-b.tsx")
  const place = source("features/ondo/place/canonical-place-overlay.tsx")

  expect(`${signal}\n${place}`).not.toMatch(/help another traveler|help another visitor|다른 여행자|다른 방문자|ほかの旅行者|ほかの訪問者/i)
  for (const truth of [
    "Save Local Signal on this device",
    "이 기기에 로컬 시그널 저장",
    "この端末にLocal Signalを保存",
    "No account, ID, or credential is created",
    "계정·ID·자격증명을 만들지",
    "アカウント、ID、資格情報は作成されません",
  ]) expect(signal).toContain(truth)
  for (const consumerTruth of [
    "AT THIS OFFICIAL-LISTED PLACE",
    "공식 목록에 있는 이 장소에서",
    "公式リストに掲載されたこの場所で",
    "Person check complete",
    "사람 확인을 마쳤어요",
    "Personチェックが完了しました",
    "Could not save this Local Signal on this device",
  ]) expect(signal).toContain(consumerTruth)
  expect(signal).not.toMatch(/FROM THIS OFFICIAL PLACE|Identity check complete|posted marker|게시 표시|投稿済みの印/)
})

test("FLOW7-DATA-008 restored Local Signal history and evidence are one canonical bounded intersection", () => {
  const provider = source("features/ondo/shared/state/ondo-b-provider.tsx")

  expect(provider).toContain("const restoredLocalSignalVenueIds = sanitizeLocalSignalVenueIds")
  expect(provider).toContain("const localSignalPostedVenueIds = restoredLocalSignalVenueIds.filter")
  expect(provider).toContain("const boundedLocalPulseEvidenceByVenue = Object.fromEntries")
  expect(provider).toContain("localSignalPostedVenueIds,")
  expect(provider).toContain("localPulseEvidenceByVenue: boundedLocalPulseEvidenceByVenue")
})

test("FLOW7-STORAGE-009 Settings keeps a persistent inline retry decision when clear fails", () => {
  const settings = source("features/ondo/settings/settings-entry-b.tsx")

  expect(settings).toContain("data-testid=\"ondo-b-clear-device-error\"")
  expect(settings).toContain('role="alert"')
  expect(settings).toContain("if (cleared) closeClear()")
  expect(settings).toContain("setClearError(!cleared)")
})
