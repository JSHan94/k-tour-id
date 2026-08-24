import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const appRoot = resolve(process.cwd())
const appFile = (path: string) => readFileSync(resolve(appRoot, path), "utf8")

test("B-PROD-LOCAL-001 B composes only production local-device surfaces", () => {
  const product = appFile("features/ondo/app/ondo-product-b.tsx")

  expect(product).toContain("SavedEntryB")
  expect(product).toContain("SettingsEntryB")
  expect(product).not.toMatch(/After19|ConnectOverlays|TablesEntry|GateOverlay|IdentityEntry|Labs|PlaceOverlay/)
})

test("B-PROD-LOCAL-002 B navigation is Explore, Saved, Settings without a hidden external branch", () => {
  const app = appFile("features/ondo/app/ondo-app-b.tsx")

  expect(app).toContain('en: { ondo: "Explore", my: "Saved", id: "Settings" }')
  expect(app).toContain('ko: { ondo: "탐색", my: "저장", id: "설정" }')
  expect(app).toContain("B_NAV")
  const bNav = app.slice(app.indexOf("const B_NAV"), app.indexOf("const B_NAV_COPY"))
  expect(bNav).not.toContain('"tables"')
})

test("B-PROD-LOCAL-003 B persistence is an explicit allowlist and never restores synthetic session state", () => {
  const provider = appFile("features/ondo/shared/state/ondo-b-provider.tsx")

  expect(provider).toContain('const B_DEVICE_KEY = "ondo-b.device.v1"')
  expect(provider).toContain("type OndoBDeviceState")
  expect(provider).toContain("privateNotesByVenue")
  expect(provider).toContain("isProductionPath")
  expect(provider).toContain("restoreBDeviceState")
  expect(provider).toContain("persistBDeviceState")
  expect(provider).toContain("canonicalMapVenueById")

  const deviceTypeStart = provider.indexOf("type OndoBDeviceState")
  const deviceType = provider.slice(deviceTypeStart, provider.indexOf("\n}", deviceTypeStart) + 2)
  for (const field of ["locale", "onboarding", "discoveryPreferences", "savedVenueIds", "privateNotesByVenue"]) {
    expect(deviceType).toContain(field)
  }
  for (const forbidden of ["account:", "person:", "age:", "paymentKyc:", "gate:", "tableMembershipById:", "reputation:", "stamps:", "profile:"]) {
    expect(deviceType).not.toContain(forbidden)
  }
})

test("B-PROD-LOCAL-004 canonical local saves have no account gate, timer, or query-controlled outcome", () => {
  const provider = appFile("features/ondo/shared/state/ondo-b-provider.tsx")
  const actionsType = provider.slice(provider.indexOf("type OndoBActions"), provider.indexOf("type OndoBDeviceState"))
  const actionsBody = provider.slice(provider.indexOf("const actions ="), provider.indexOf("const value ="))

  expect(actionsType).toContain("saveVenue(venueId: string): void")
  expect(actionsType).toContain("toggleSavedVenue(venueId: string): void")
  expect(actionsBody).toContain("persistCanonicalSavedVenue")
  const saveAction = actionsBody.slice(actionsBody.indexOf("saveVenue"), actionsBody.indexOf("toggleSavedVenue"))
  expect(saveAction).not.toContain("beginAction(")
  expect(saveAction).not.toContain("setTimeout")
  expect(saveAction).not.toContain("URLSearchParams")
})

test("B-PROD-LOCAL-005 Saved, Settings, and private notes expose only real device behavior", () => {
  const saved = appFile("features/ondo/my/saved-entry-b.tsx")
  const settings = appFile("features/ondo/settings/settings-entry-b.tsx")
  const note = appFile("features/ondo/my/private-note.tsx")
  const productCopy = `${saved}\n${settings}\n${note}`

  expect(productCopy).not.toMatch(/demo|simulation|simulated|fixture|preview|account|identity|KYC|Labs|stamp|trust/i)
  expect(note).toContain("actions.setPrivateNote")
  expect(note).toContain("stays only in this browser")
  expect(settings).toContain("actions.clearBDeviceContent")
})
