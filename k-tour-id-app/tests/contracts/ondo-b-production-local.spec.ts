import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const appRoot = resolve(process.cwd())
const appFile = (path: string) => readFileSync(resolve(appRoot, path), "utf8")

test("B-PROD-LOCAL-001 B preserves the sourced map, local save, settings, and canonical detail foundation", () => {
  const product = appFile("features/ondo/app/ondo-product-b.tsx")
  for (const component of ["MapEntryB", "SavedEntryB", "SettingsEntryB", "CanonicalPlaceMount"]) expect(product).toContain(component)
})

test("B-PROD-LOCAL-002 navigation preserves Explore and device-local collections without fixing a maximum tab count", () => {
  const app = appFile("features/ondo/app/ondo-app-b.tsx")
  expect(app).toContain('ondo: "Explore"')
  expect(app).toContain('ondo: "탐색"')
  expect(app).toContain('my: "Saved"')
  expect(app).toContain('my: "저장"')
  expect(app).toContain("B_NAV")
})

test("B-PROD-LOCAL-003 device persistence keeps the canonical discovery allowlist", () => {
  const provider = appFile("features/ondo/shared/state/ondo-b-provider.tsx")

  expect(provider).toContain('const B_DEVICE_KEY = "ondo-b.device.v1"')
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
  for (const field of ["locale", "onboarding", "persona", "discoveryPreferences", "savedVenueIds", "privateNotesByVenue"]) {
    expect(deviceType).toContain(field)
  }
  for (const forbidden of ["account:", "person:", "age:", "paymentKyc:", "gate:", "tableMembershipById:", "reputation:", "stamps:", "profile:"]) {
    expect(deviceType).not.toContain(forbidden)
  }
})

test("B-PROD-LOCAL-004 canonical local saves are real device behavior", () => {
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

test("B-PROD-LOCAL-005 private notes and reset retain their explicit device boundary", () => {
  const saved = appFile("features/ondo/my/saved-entry-b.tsx")
  const settings = appFile("features/ondo/settings/settings-entry-b.tsx")
  const note = appFile("features/ondo/my/private-note.tsx")
  const productCopy = `${saved}\n${settings}\n${note}`
  expect(productCopy).not.toMatch(/demo|simulation|simulated|fixture|preview|account|identity|KYC|Labs|stamp|trust/i)
  expect(note).toContain("actions.setPrivateNote")
  expect(note).toContain("stays only in this browser")
  expect(settings).toContain("actions.clearBDeviceContent")
})
