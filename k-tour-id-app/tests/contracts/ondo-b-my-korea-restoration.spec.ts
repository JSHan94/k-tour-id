import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"

const APP_ROOT = process.cwd()
const source = (path: string) => {
  const absolute = resolve(APP_ROOT, path)
  return existsSync(absolute) ? readFileSync(absolute, "utf8") : ""
}

function functionBody(file: string, name: string, nextName: string) {
  const start = file.indexOf(`function ${name}`)
  const end = file.indexOf(`function ${nextName}`, start + 1)
  return start >= 0 ? file.slice(start, end >= 0 ? end : undefined) : ""
}

test("B-MY-001 My Korea keeps Saved and adds recent, planned, and contribution landmarks", () => {
  const app = source("features/ondo/app/ondo-app-b.tsx")
  const my = source("features/ondo/my/saved-entry-b.tsx")

  expect(app).toContain('my: "My Korea"')
  expect(app).toContain('my: "내 한국"')
  for (const evidence of [
    "ondo-b-my-korea-entry",
    "ondo-b-saved-entry",
    "my-korea-recent",
    "my-korea-planned",
    "my-korea-contributions",
    "PrivateNote",
  ]) expect(my).toContain(evidence)
  expect(my).toContain("Recently viewed official places")
  expect(my).toContain("최근 본 공식 장소")
  expect(my).toContain("Planned meals")
  expect(my).toContain("식사 계획")
})

test("B-MY-002 device history accepts only canonical IDs and bounded local references", () => {
  const model = source("features/ondo/my/my-korea-model.ts")
  const provider = source("features/ondo/shared/state/ondo-b-provider.tsx")

  for (const evidence of [
    "MY_KOREA_HISTORY_LIMIT",
    "isCanonicalVenueId",
    "sanitizeRecentVenueIds",
    "sanitizePlannedTableRefs",
    "recordRecentVenue",
    "recordPlannedTable",
  ]) expect(model).toContain(evidence)
  for (const evidence of ["recentVenueIds", "plannedTableRefs", "localSignalPostedVenueIds"]) {
    expect(provider).toContain(evidence)
  }
  expect(`${model}\n${provider}`).not.toMatch(/fetch\(|XMLHttpRequest|WebSocket|EventSource|sessionStorage/)
  expect(model).not.toMatch(/draft|note|message|account|person|dateOfBirth|passport/i)
})

test("B-MY-003 activity is created only by explicit place-open and final join actions", () => {
  const map = source("features/ondo/map/map-entry-b.tsx")
  const my = source("features/ondo/my/saved-entry-b.tsx")
  const tables = source("features/ondo/connect/tables-entry-b.tsx")

  expect(map).toContain("actions.recordRecentVenue(venue.id)")
  expect(my).toContain("actions.recordRecentVenue(venueId)")
  expect(functionBody(tables, "confirmJoin", "confirmLeave")).toContain("actions.recordPlannedTable")
  expect(functionBody(tables, "beginJoin", "cancelGate")).not.toContain("recordPlannedTable")
  expect(functionBody(tables, "completeGate", "confirmJoin")).not.toContain("recordPlannedTable")
  expect(functionBody(tables, "confirmLeave", "handleDetailKeyDown")).toContain("actions.removePlannedTable")
})

test("B-MY-004 Local Signal owns one merge contract without inventing contributions", () => {
  const provider = source("features/ondo/shared/state/ondo-b-provider.tsx")
  const localSignal = source("features/ondo/local-signal-b/local-signal-layer-b.tsx")
  const my = source("features/ondo/my/saved-entry-b.tsx")
  const integration = source("docs/ONDO_B_MY_KOREA_INTEGRATION.md")

  expect(provider).toContain("markLocalSignalPosted(venueId: string): boolean")
  expect(localSignal.match(/actions\.markLocalSignalPosted\(activeVenue\.id\)/g)).toHaveLength(1)
  expect(my).toContain("state.localSignalPostedVenueIds")
  expect(my).toContain("No Local Signals yet")
  expect(my).toContain("아직 로컬 시그널이 없어요")
  expect(integration).toContain("markLocalSignalPosted")
  expect(integration).toContain("successful explicit local submit")
  expect(integration).toContain("must not")
})

test("B-MY-005 reset, reload persistence, EN/KO, privacy, and responsive contracts stay explicit", () => {
  const provider = source("features/ondo/shared/state/ondo-b-provider.tsx")
  const settings = source("features/ondo/settings/settings-entry-b.tsx")
  const my = source("features/ondo/my/saved-entry-b.tsx")
  const css = source("features/ondo/shared/ui/production-local.module.css")
  const policy = source("scripts/ondo-b-standalone/policy.mjs")

  expect(provider).toContain("recentVenueIds: []")
  expect(provider).toContain("plannedTableRefs: []")
  expect(provider).toContain("localSignalPostedVenueIds: []")
  expect(settings).toContain("recent views")
  expect(settings).toContain("최근 본 장소")
  expect(my).toContain("not visits, reservations, or synced activity")
  expect(my).toContain("방문·예약·동기화된 활동 기록이 아닙니다")
  expect(my).not.toMatch(/URLSearchParams|history\.(?:pushState|replaceState)/)
  expect(css).toContain(".activitySections")
  expect(css).toContain("@media (min-width: 700px)")
  expect(policy).toContain('"features/ondo/my/my-korea-model.ts"')
})
