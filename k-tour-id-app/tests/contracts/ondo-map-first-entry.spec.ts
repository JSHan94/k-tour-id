import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"
import { restoreBDeviceState } from "../../features/ondo/shared/state/ondo-b-provider"

const source = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8")

test("MAP-FIRST-001 fresh and legacy interrupted discovery state never implies an open wizard", () => {
  expect(restoreBDeviceState({})).toMatchObject({ onboarding: "ONB-NEW", persona: null, discoveryPreferences: [] })
  const interrupted = restoreBDeviceState({ onboarding: "ONB-IN-PROGRESS", persona: "short_trip", discoveryArea: "busan", discoveryPreferences: ["classic", "vegan"] })
  expect(interrupted).toMatchObject({ onboarding: "ONB-NEW", persona: "short_trip", discoveryArea: "busan", discoveryPreferences: ["classic", "vegan"] })
  const layer = source("features/ondo/onboarding/official-directory-onboarding.tsx")
  const shell = source("features/ondo/app/ondo-app-b.tsx")
  expect(layer).toContain('useSheetPresence(state.hydrated && state.onboarding === "ONB-IN-PROGRESS" ? true : null)')
  expect(shell).toContain('const onboardingActive = state.hydrated && state.onboarding === "ONB-IN-PROGRESS"')
})

test("MAP-FIRST-002 only explicit setup can replace map history with its nation preview", () => {
  const map = source("features/ondo/map/map-entry-b.tsx")
  expect(map).toContain('let initial = state.onboarding === "ONB-IN-PROGRESS"')
  expect(map).not.toContain('let initial = state.onboarding !== "ONB-COMPLETE"')
  expect(map).toContain('state.onboarding !== "ONB-IN-PROGRESS" && (entry.level === "peek" || entry.level === "detail")')
  expect(map).toContain('data-testid="ondo-b-personalization-edit"')
  expect(map).toContain('onPreferences={() => { flushSync(() => setMapOptionsOpen(false)); actions.setTab("settings") }}')
  expect(source("features/ondo/map/map-options-b.tsx")).toContain('data-testid="ondo-b-map-options-preferences"')
})

test("MAP-FIRST-003 optional setup edits a saved draft without choosing a venue", () => {
  const layer = source("features/ondo/onboarding/official-directory-onboarding.tsx")
  expect(layer).toContain("setIntent(state.persona)")
  expect(layer).toContain("setArea(state.discoveryArea)")
  expect(layer).toContain("setPreferences([...state.discoveryPreferences])")
  expect(layer).toContain("actions.completeOnboarding({ intent, area, preferences })")
  expect(layer).toContain("actions.cancelOnboarding()")
  expect(layer).not.toContain("actions.skipOnboarding()")
  expect(layer).not.toMatch(/ranked\[0\]|CanonicalVenueCapsuleB|onboarding-map-preview|CANONICAL_MAP_VENUES_COMPACT/)
  expect(layer).toContain('<PreferenceGroup group="meal"')
  expect(layer).toContain('<PreferenceGroup group="dietary"')
})

test("MAP-FIRST-004 opening and cancelling setup preserve preferences and unrelated authorities", () => {
  const provider = source("features/ondo/shared/state/ondo-b-provider.tsx")
  const settings = source("features/ondo/settings/settings-entry-b.tsx")
  const open = provider.slice(provider.indexOf("beginOnboarding: () =>"), provider.indexOf("cancelOnboarding: () =>"))
  const cancel = provider.slice(provider.indexOf("cancelOnboarding: () =>"), provider.indexOf("completeOnboarding: (draft) =>"))
  expect(open).toContain("commitEphemeral")
  expect(open).not.toContain("persistBDeviceState")
  expect(cancel).toContain('onboarding: onboardingBeforeSetupRef.current ?? "ONB-NEW"')
  for (const block of [open, cancel]) expect(block).not.toMatch(/persona:|discoveryArea:|discoveryPreferences:|identityCredential|commerceSession|after19/i)
  expect(settings).toContain("closeSheet(); actions.beginOnboarding()")
  expect(settings).not.toContain("actions.resetOnboarding()")
})

test("MAP-FIRST-005 saved returning-user choices survive hydration without granting identity", () => {
  const saved = restoreBDeviceState({ onboarding: "ONB-COMPLETE", persona: "living", discoveryArea: "busan", discoveryPreferences: ["cafe", "halal"], person: "PER-VERIFIED", identityCredential: { forged: true } })
  expect(saved).toMatchObject({ onboarding: "ONB-COMPLETE", persona: "living", discoveryArea: "busan", discoveryPreferences: ["cafe", "halal"] })
  expect(saved).not.toHaveProperty("person")
  expect(saved).not.toHaveProperty("identityCredential")
})

test("MAP-FIRST-006 failed remote tiles do not disable fitting local atlas city controls after resize", () => {
  const map = source("features/ondo/map/map-entry-b.tsx")
  const end = map.indexOf("}, [beginNationProjection, city, mapState])")
  const refit = map.slice(map.lastIndexOf("useLayoutEffect(() => {", end), end)
  expect(refit).toContain('if (!map || !container || city || (mapState !== "ready" && mapState !== "error")) return')
  expect(refit).toContain("const projection = beginNationProjection(map, container)")
  expect(refit).toContain("sequence !== refitSequence || !projection.isCurrent()")
  expect(refit).toContain("map.stop()")
  expect(refit).toContain("map.resize()")
  expect(refit).toContain("fitNationOverview(map, container)")
  expect(refit).toContain("projection.waitForMoveThenPaint()")
  expect(refit).toContain("observer.observe(container)")
  expect(refit).not.toContain("setMapState")
})
