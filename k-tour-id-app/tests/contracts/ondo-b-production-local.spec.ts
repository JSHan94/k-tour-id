import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const appRoot = resolve(process.cwd())
const appFile = (path: string) => readFileSync(resolve(appRoot, path), "utf8")

test("B-PROD-LOCAL-001 B composes the complete B-native local-device product without retired providers", () => {
  const product = appFile("features/ondo/app/ondo-product-b.tsx")
  for (const component of [
    "MapEntryB",
    "SavedEntryB",
    "PulseTablesEntryB",
    "TravelerIdEntryB",
    "SettingsEntryB",
    "CanonicalPlaceMount",
    "EditorialPlaceMountB",
    "AccountSaveGateMountB",
    "LocalSignalLayerB",
    "KTourIdSetupB",
    "LabsEntryB",
  ]) expect(product).toContain(component)
  expect(product).not.toMatch(/ConnectOverlays|GateOverlay|IdentityEntry|PlaceOverlay|OndoProvider/)
})

test("B-PROD-LOCAL-002 navigation keeps Tables, ID · Wallet, and Settings as separate top-level destinations", () => {
  const app = appFile("features/ondo/app/ondo-app-b.tsx")
  expect(app).toContain('en: { ondo: "Explore", my: "My Korea", tables: "Tables", id: "ID · Wallet", settings: "Settings" }')
  expect(app).toContain('ko: { ondo: "탐색", my: "내 한국", tables: "테이블", id: "ID · 지갑", settings: "설정" }')
  expect(app).toContain("B_NAV")
  const bNav = app.slice(app.indexOf("const B_NAV"), app.indexOf("const B_NAV_COPY"))
  expect(bNav).toContain('id: "tables"')
  expect(bNav).toContain('id: "id"')
  expect(bNav).toContain('id: "settings"')
})

test("B-PROD-LOCAL-003 device persistence keeps the canonical discovery allowlist", () => {
  const provider = appFile("features/ondo/shared/state/ondo-b-provider.tsx")

  expect(provider).toContain("export const B_DEVICE_KEY = ONDO_B_DEVICE_STORAGE_KEY")
  expect(provider).toContain("type OndoBDeviceState")
  expect(provider).toContain("privateNotesByVenue")
  expect(provider).toContain("isProductionPath")
  expect(provider).toContain("restoreBDeviceState")
  expect(provider).toContain("persistBDeviceState")
  expect(provider).toContain("isCanonicalVenueId")
  expect(provider).toContain("sanitizeCanonicalVenueIds")
  expect(provider).toContain("sanitizeCanonicalVenueNotes")

  const deviceTypeStart = provider.indexOf("type OndoBDeviceState")
  const deviceType = provider.slice(deviceTypeStart, provider.indexOf("\n}", deviceTypeStart) + 2)
  for (const field of ["locale", "appearancePreference", "onboarding", "persona", "discoveryPreferences", "savedVenueIds", "savedEditorialPlaceIds", "privateNotesByVenue", "recentVenueIds", "recentEditorialPlaceIds", "plannedTableRefs", "localSignalPostedVenueIds", "localInteractionBoundarySeen"]) {
    expect(deviceType).toContain(field)
  }
  for (const forbidden of ["account:", "person:", "age:", "paymentKyc:", "gate:", "tableMembershipById:", "reputation:", "stamps:", "profile:"]) {
    expect(deviceType).not.toContain(forbidden)
  }
})

test("B-PROD-LOCAL-004 canonical local saves require a separate session Account and remain real device behavior", () => {
  const provider = appFile("features/ondo/shared/state/ondo-b-provider.tsx")
  const actionsType = provider.slice(provider.indexOf("type OndoBActions"), provider.indexOf("type OndoBDeviceState"))
  const actionsBody = provider.slice(provider.indexOf("const actions ="), provider.indexOf("const value ="))
  expect(actionsType).toContain("saveVenue(venueId: string): void")
  expect(actionsType).toContain("toggleSavedVenue(venueId: string): void")
  expect(actionsType).toContain("beginAccountSave(venueId: string): boolean")
  expect(actionsType).toContain("completeAccountSave()")
  expect(actionsBody).toContain("persistCanonicalSavedVenue")
  expect(provider).toContain('B_ACCOUNT_SESSION_KEY = "ondo-b.account.v1"')
  expect(provider).toContain('current.account !== "ACC-ACTIVE"')
  const saveAction = actionsBody.slice(actionsBody.indexOf("saveVenue"), actionsBody.indexOf("toggleSavedVenue"))
  expect(saveAction).not.toContain("beginAction(")
  expect(saveAction).not.toContain("setTimeout")
  expect(saveAction).not.toContain("URLSearchParams")
  expect(saveAction).toContain("beginAccountSave(venueId)")
})

test("B-PROD-LOCAL-005 private notes and reset retain their explicit privacy boundary", () => {
  const provider = appFile("features/ondo/shared/state/ondo-b-provider.tsx")
  const saved = appFile("features/ondo/my/saved-entry-b.tsx")
  const savedStyles = appFile("features/ondo/my/saved-entry-b.module.css")
  const settings = appFile("features/ondo/settings/settings-entry-b.tsx")
  const note = appFile("features/ondo/my/private-note.tsx")
  expect(note).not.toMatch(/demo|simulation|simulated|fixture|KYC|stamp|trust/i)
  for (const boundary of [
    "No charge made · private record",
    "실제 결제 없음 · 비공개 기록",
    "実際の決済なし・非公開の記録",
  ]) expect(saved).toContain(boundary)
  expect(note).toContain("actions.setPrivateNote")
  expect(note).toContain("Only on this device")
  expect(note).toContain("この端末にのみ保存")
  expect(note).toContain("aria-expanded={editing}")
  expect(saved).toContain("saved-remove-dialog")
  expect(saved).toContain("useModalIsolation(Boolean(removalTarget), removalLayerRef)")
  expect(saved).toContain("data-modal-layer-priority={ONDO_MODAL_PRIORITY.critical}")
  expect(saved).toContain("Nothing changed. Try again.")
  for (const savedOnlyCopy of [
    "Only this saved bookmark will be removed. Your private note and activity will stay.",
    "저장한 북마크만 삭제됩니다. 개인 메모와 활동 기록은 그대로 남아요.",
    "保存したブックマークだけを削除します。プライベートメモとアクティビティは残ります。",
  ]) expect(saved).toContain(savedOnlyCopy)
  const savedMembership = provider.slice(provider.indexOf("const persistCanonicalSavedVenue"), provider.indexOf("const beginAccountSave"))
  expect(savedMembership).not.toContain("delete privateNotesByVenue[venueId]")
  expect(provider).toContain("privateNotesByVenue: sanitizeCanonicalVenueNotes(record.privateNotesByVenue)")
  expect(provider).toContain("privateNotesByVenue: sanitizeCanonicalVenueNotes(input.device.privateNotesByVenue)")
  expect(savedStyles).toContain("min-height: 44px")
  expect(settings).toContain("visit stamps")
  expect(settings).toContain("방문 스탬프")
  expect(settings).toContain("訪問スタンプ")
  expect(settings).not.toMatch(/verified visit|official trust|public reputation|identity provider connected/i)
  expect(settings).toContain("actions.clearBDeviceContent")
})
