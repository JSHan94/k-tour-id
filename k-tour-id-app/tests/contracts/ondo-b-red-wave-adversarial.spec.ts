import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

const map = source("features/ondo/map/map-entry-b.tsx")
const canonicalPlace = source("features/ondo/place/canonical-place-overlay.tsx")
const editorialPlace = source("features/ondo/place/editorial-place-overlay-b.tsx")
const provider = source("features/ondo/shared/state/ondo-b-provider.tsx")
const returnTo = source("features/ondo/contracts/return-to-b.ts")
const accountGate = source("features/ondo/identity-b/account-save-gate-b.tsx")
const actionGate = source("features/ondo/identity-b/action-gate-coordinator-b.tsx")
const tables = source("features/ondo/connect/tables-entry-b.tsx")
const commerce = source("features/ondo/commerce-b/id-wallet-commerce-b.tsx")
const mapCss = source("features/ondo/map/map-b.module.css")

test("RED-MAP-LOAD-001 has separate immediate, 800ms-context, and 5s-fallback stages", () => {
  expect(map, "an immediate loading state must exist").toContain('setMapState("loading")')
  expect(map, "800ms must enrich—not replace—the current city/query/filter context").toMatch(/MAP_LOAD_CONTEXT_DELAY_MS\s*=\s*800|setTimeout\([^,]+,\s*800\)/)
  expect(map, "the usable list fallback must be reached by 5 seconds").toMatch(/MAP_LOAD_FALLBACK_DELAY_MS\s*=\s*5_000|setTimeout\([^,]+,\s*5_000\)/)
})

test("RED-MAP-LOAD-002 a recoverable tile/source error cannot collapse the whole map", () => {
  expect(map, "MapLibre's generic error event currently sends every partial failure to the full fallback").not.toContain('instance.on("error", failMap)')
  expect(map, "the implementation needs an explicit recoverable/terminal error classification").toMatch(/recoverable.*(?:tile|source)|(?:tile|source).*recoverable/i)
  expect(map, "a bare `source` word would hide local source/layer validation errors as network failures").not.toContain("/abort|fetch|network|source|sprite|tile|timeout/i")
  expect(map, "recoverable errors need resource evidence, not a generic source-name match").toMatch(/resourceEvent\.tile[\s\S]*AJAXError/)
})

test("RED-RUNTIME-002B superseded venue detail work is discarded without abort noise or stale state", () => {
  const effect = canonicalPlace.match(/useEffect\(\(\) => \{\n    const rowRetry[\s\S]*?\n  \}, \[detail\?\.id, detailAttempt, expanded, factRetry, venueId\]\)/)?.[0] ?? ""
  expect(effect, "the venue-detail effect must remain independently auditable").not.toBe("")
  expect(effect, "intentional surface changes must not create requestfailed ERR_ABORTED evidence").not.toContain("AbortController")
  expect(effect).not.toMatch(/fetch\([^\n]+signal/)
  expect(effect).toContain("let disposed = false")
  expect(effect.match(/if \(disposed\) return/g)?.length, "both success and failure results must be ignored after cleanup").toBeGreaterThanOrEqual(2)
  expect(effect).toContain("disposed = true")
  expect(effect).toContain("window.cancelAnimationFrame(requestFrame)")
})

test("RED-MAP-RETRY-003 retry is a state-preserving map operation", () => {
  const retry = map.match(/function retryMap\(\) \{([\s\S]*?)\n  \}/)?.[1] ?? ""
  expect(retry).not.toBe("")
  for (const destructiveMutation of ["setCity(", "setQuery(", "setCategory(", "setSelectedVenueId(", "setSelectedEditorialPlaceId(", "history.pushState", "history.replaceState"]) {
    expect(retry, `retry must not mutate ${destructiveMutation}`).not.toContain(destructiveMutation)
  }
})

test("RED-MAP-MOTION-004 every animated camera path has an explicit reduced-motion zero duration", () => {
  const wrapper = map.match(/function moveMap\([\s\S]*?\n\}\n\nfunction NationDirectory/)?.[0] ?? ""
  expect(wrapper, "camera motion must be centralized so new call sites cannot bypass the preference").not.toBe("")
  expect(wrapper).toContain('window.matchMedia("(prefers-reduced-motion: reduce)").matches')
  expect(wrapper).toContain("map.jumpTo(options)")
  expect(wrapper).toContain("map.easeTo({ ...options, duration: CITY_FOCUS_DURATION_MS })")
  expect(wrapper.indexOf("map.jumpTo(options)")).toBeLessThan(wrapper.indexOf("map.easeTo("))
  expect(wrapper.indexOf("return")).toBeLessThan(wrapper.indexOf("map.easeTo("))
  expect(map.replace(wrapper, ""), "no camera path may animate outside the reduced-motion boundary").not.toContain(".easeTo(")
  expect(map).toContain("if (entryTransitionCity !== city || historyCamera) map.jumpTo(destination)")
  expect(map).toContain("else moveMap(map, {")
  expect((map.match(/moveMap\(/g)?.length ?? 0) - 1, "city entry, semantic preview, cluster, venue, editorial, and location camera paths must use the wrapper").toBeGreaterThanOrEqual(6)
})

test("RED-MAP-PREFERENCE-004B the compact map lens keeps its information badge legible", () => {
  const mobileLens = mapCss.match(/@media \(max-width: 430px\) and \(orientation: portrait\) \{[\s\S]*?button\[data-preference-count\][\s\S]*?\n\}/)?.[0] ?? ""
  expect(mobileLens, "the compact preference lens must remain independently auditable").not.toBe("")
  expect(mobileLens).toMatch(/min-width:\s*(?:2[0-9]|[3-9][0-9])px/)
  expect(mobileLens).toMatch(/font-size:\s*(?:1[2-9]|[2-9][0-9])px/)
  expect(mobileLens).not.toMatch(/font-size:\s*(?:[0-9]|1[01])px/)
})

test("RED-JEJU-SAVE-005 editorial save reuses Account gate with an exact editorial return envelope", () => {
  expect(editorialPlace, "the overlay must delegate save policy to the provider").toContain("actions.toggleSavedEditorialPlace(activePlace.id)")

  const toggle = provider.match(/toggleSavedEditorialPlace: \(editorialPlaceId\) => \{[\s\S]*?\n    \},\n    setPrivateNote/)?.[0] ?? ""
  expect(toggle, "the provider's editorial toggle branch must remain independently auditable").not.toBe("")
  expect(toggle).toContain("isEditorialPlaceId(editorialPlaceId)")
  expect(toggle).toContain('stateRef.current.account !== "ACC-ACTIVE"')
  expect(toggle).toContain("beginEditorialAccountSave(editorialPlaceId)")

  const begin = provider.match(/const beginEditorialAccountSave = useCallback\([\s\S]*?\n  \}, \[commitEphemeral\]\)/)?.[0] ?? ""
  expect(begin).toContain("createBEditorialAccountReturnTo(editorialPlaceId)")
  expect(begin).toContain("persistPendingBAccountReturn")
  expect(begin).toContain("persistAccount: persistBAccountSession")
  expect(begin).toContain("accountReturnTo: returnTo")

  expect(returnTo).toContain('| { targetKind: "editorial"; venueId?: never; editorialPlaceId: EditorialPlaceB["id"] }')
  expect(returnTo).toContain("createBEditorialAccountReturnTo(editorialPlaceId")
  expect(returnTo).toContain('targetKind: "editorial"')
  expect(returnTo).toContain("isEditorialPlaceId(candidate.editorialPlaceId)")

  const complete = provider.match(/const completeAccountSave = useCallback[\s\S]*?\n  \}, \[[^\]]*\]\)/)?.[0] ?? ""
  expect(complete).toContain("commitBAccountSaveTransaction")
  expect(provider).toContain("consumeBAccountReturnTo(input.returnTo, input.now)")
  expect(complete).toContain('consumed.targetKind === "editorial"')
  expect(complete).toContain("savedEditorialPlaceIds")
  expect(complete).toContain("consumed.editorialPlaceId")

  expect(accountGate).toContain('returnTo.targetKind === "editorial"')
  expect(accountGate).toContain("openSavedBDiscoveryEditorialPlace(activeReturnTo.editorialPlaceId)")
  expect(accountGate).toContain("openBDiscoveryEditorialDetail(activeReturnTo.editorialPlaceId)")
  expect(accountGate).toContain('actions.setSurface({ kind: "editorial_place", editorialPlaceId: activeReturnTo.editorialPlaceId })')
  expect(accountGate).toContain("[data-testid='ondo-b-editorial-place-overlay'][data-editorial-place-id='")
  expect(accountGate).toContain("[data-testid='ondo-b-editorial-place-save']")
  expect(accountGate).toContain('data-account-return-kind={returnTo.targetKind === "editorial" ? "editorial" : "canonical"}')
  expect(accountGate).toContain('data-account-return-editorial-place')
})

test("RED-OBJECT-006 Table, gate, checkout, and receipt expose the same object context", () => {
  expect(tables).toContain('data-testid="table-detail"')
  expect(tables).toContain('data-table-id={activeTable.id}')
  expect(tables).toContain('data-venue-id={activeVenueId}')
  expect(tables).toContain('data-testid="table-join-confirmation"')
  expect(tables).toContain('data-return-table={returnTo.tableId}')
  expect(tables).toContain('data-return-venue={returnTo.venueId}')
  expect(actionGate).toContain('data-return-venue={pending.cta === "MINT_BADGE" ? "none" : pending.venueId}')
  expect(actionGate).toContain('data-return-table={pending.cta === "JOIN_TABLE" ? pending.tableId : "none"}')
  expect(commerce).toContain('data-origin-venue-id={originVenueId}')
  expect(commerce).toContain('data-transaction-venue-id={venueId}')
  expect(commerce).toContain('data-testid="payment-receipt"')
  expect(commerce.indexOf('data-origin-venue-id={originVenueId}')).toBeLessThan(commerce.indexOf('data-testid="payment-receipt"'))
})
