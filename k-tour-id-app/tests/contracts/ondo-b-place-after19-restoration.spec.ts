import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"
import {
  consumePendingPlaceAfter19Return,
  createPlaceAfter19Return,
  isPlaceAfter19ReturnPending,
  isPlaceAfter19ReturnStructurallyValid,
  PLACE_AFTER19_RETURN_SESSION_KEY,
  PLACE_AFTER19_RETURN_TTL_MS,
  renewPlaceAfter19Return,
  restorePlaceAfter19ReturnSession,
  stagePlaceAfter19Return,
} from "../../features/ondo/after19/after19-place-return-b-model"

const NOW = new Date("2026-08-28T03:00:00.000Z")
const VENUE_ID = "mois-0021cd596bc5b2a922ad"

class MemoryStorage {
  constructor(private readonly values: Record<string, string> = {}) {}
  getItem(key: string) { return this.values[key] ?? null }
  setItem(key: string, value: string) { this.values[key] = value }
  raw(key: string) { return this.values[key] ?? null }
}

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

test("FL-002 OPEN_AFTER19 carries one strict tab-scoped 15-minute canonical Place return", () => {
  const envelope = createPlaceAfter19Return({
    venueId: VENUE_ID,
    cityId: "seoul",
    view: "list",
    query: "gukbap",
    category: "korean",
    now: NOW,
  })

  expect(PLACE_AFTER19_RETURN_TTL_MS).toBe(15 * 60 * 1000)
  expect(envelope).toMatchObject({
    version: 1,
    cta: "OPEN_AFTER19",
    venueId: VENUE_ID,
    cityId: "seoul",
    level: "detail",
    view: "list",
    query: "gukbap",
    category: "korean",
    focusTarget: "canonical-after19-access",
    consumedAt: null,
  })
  expect(envelope.tokenId).toMatch(/^RT-OPEN_AFTER19-\d{13}-[0-9a-f-]{36}$/i)
  expect(Date.parse(envelope.expiresAt) - Date.parse(envelope.createdAt)).toBe(PLACE_AFTER19_RETURN_TTL_MS)
  expect(isPlaceAfter19ReturnPending(envelope, NOW)).toBe(true)
  expect(Object.keys(envelope).sort()).toEqual([
    "category", "cityId", "consumedAt", "createdAt", "cta", "expiresAt", "focusTarget",
    "level", "query", "tokenId", "venueId", "version", "view",
  ].sort())
  expect(JSON.stringify(envelope)).not.toMatch(/birth|dateOfBirth|account|person|payment|passport|credential/i)

  expect(() => createPlaceAfter19Return({ ...envelope, cityId: "busan", now: NOW })).toThrow()
  expect(isPlaceAfter19ReturnStructurallyValid({ ...envelope, privateDraft: "must not survive" })).toBe(false)
  expect(isPlaceAfter19ReturnStructurallyValid({ ...envelope, query: "x".repeat(121) })).toBe(false)
  expect(isPlaceAfter19ReturnStructurallyValid({ ...envelope, focusTarget: "global-after19-banner" })).toBe(false)
})

test("FL-002 pending restore survives reload, rejects replacement, and consumes success exactly once", () => {
  const storage = new MemoryStorage()
  const envelope = createPlaceAfter19Return({ venueId: VENUE_ID, cityId: "seoul", view: "map", query: "", category: "all", now: NOW })
  const competing = createPlaceAfter19Return({ venueId: VENUE_ID, cityId: "seoul", view: "map", query: "", category: "all", now: new Date(NOW.getTime() + 1) })

  expect(stagePlaceAfter19Return(storage as unknown as Storage, envelope, NOW)).toBe(true)
  expect(stagePlaceAfter19Return(storage as unknown as Storage, competing, NOW)).toBe(false)
  expect(restorePlaceAfter19ReturnSession(storage as unknown as Storage).pending).toEqual(envelope)

  const consumed = consumePendingPlaceAfter19Return(storage as unknown as Storage, envelope, "success", NOW)
  expect(consumed?.consumedAt).toBe(NOW.toISOString())
  expect(restorePlaceAfter19ReturnSession(storage as unknown as Storage)).toMatchObject({
    pending: null,
    lastConsumed: { tokenId: envelope.tokenId, cta: "OPEN_AFTER19", outcome: "success", consumedAt: NOW.toISOString() },
  })
  expect(consumePendingPlaceAfter19Return(storage as unknown as Storage, envelope, "success", NOW)).toBeNull()
  expect(storage.raw(PLACE_AFTER19_RETURN_SESSION_KEY)).not.toMatch(/birth|account|person|payment|passport|credential/i)
})

test("FL-002 failure/retry leaves pending intact, expiry is bounded, and cancel abandons it once", () => {
  const storage = new MemoryStorage()
  const envelope = createPlaceAfter19Return({ venueId: VENUE_ID, cityId: "seoul", view: "list", query: "late soup", category: "korean", now: NOW })
  stagePlaceAfter19Return(storage as unknown as Storage, envelope, NOW)
  const failedSnapshot = storage.raw(PLACE_AFTER19_RETURN_SESSION_KEY)

  expect(isPlaceAfter19ReturnPending(envelope, new Date(Date.parse(envelope.expiresAt)))).toBe(false)
  expect(consumePendingPlaceAfter19Return(storage as unknown as Storage, envelope, "success", new Date(Date.parse(envelope.expiresAt)))).toBeNull()
  expect(storage.raw(PLACE_AFTER19_RETURN_SESSION_KEY)).toBe(failedSnapshot)

  const renewed = renewPlaceAfter19Return(envelope, new Date(Date.parse(envelope.expiresAt)))
  expect(renewed.tokenId).not.toBe(envelope.tokenId)
  expect(renewed).toMatchObject({ venueId: envelope.venueId, cityId: envelope.cityId, level: "detail", view: envelope.view, query: envelope.query, category: envelope.category, focusTarget: envelope.focusTarget })
  expect(stagePlaceAfter19Return(storage as unknown as Storage, renewed, new Date(Date.parse(envelope.expiresAt)))).toBe(true)
  expect(consumePendingPlaceAfter19Return(storage as unknown as Storage, renewed, "cancel", new Date(Date.parse(envelope.expiresAt)))?.tokenId).toBe(renewed.tokenId)
  expect(consumePendingPlaceAfter19Return(storage as unknown as Storage, renewed, "cancel", new Date(Date.parse(envelope.expiresAt)))).toBeNull()
})

test("FL-002 a formerly canonical missing venue stays sanitized for same-city fallback", () => {
  const envelope = createPlaceAfter19Return({ venueId: VENUE_ID, cityId: "seoul", view: "list", query: "safe", category: "all", now: NOW })
  const removedVenue = { ...envelope, venueId: "mois-aaaaaaaaaaaaaaaaaaaa" }
  const storage = new MemoryStorage({
    [PLACE_AFTER19_RETURN_SESSION_KEY]: JSON.stringify({ version: 1, pending: removedVenue, lastConsumed: null }),
  })

  expect(isPlaceAfter19ReturnStructurallyValid(removedVenue)).toBe(true)
  expect(restorePlaceAfter19ReturnSession(storage as unknown as Storage).pending).toMatchObject({
    venueId: "mois-aaaaaaaaaaaaaaaaaaaa",
    cityId: "seoul",
    view: "list",
    query: "safe",
  })
})

test("FL-002 Place requests the shared global prompt by contract and restores canonical history/focus", () => {
  const place = source("features/ondo/place/canonical-place-overlay.tsx")
  const global = source("features/ondo/after19/after19-global-b.tsx")
  const model = source("features/ondo/after19/after19-place-return-b-model.ts")
  const styles = source("features/ondo/place/canonical-place.module.css")

  for (const evidence of [
    "createPlaceAfter19Return", "requestPlaceAfter19Return", "PLACE_AFTER19_RETURN_COMPLETE_EVENT",
    "canonical-after19-access", "data-after19-focus-target=\"persistent\"",
  ]) expect(place).toContain(evidence)
  expect(place).not.toContain("globalOpener.click()")
  expect(place).not.toContain("createBTableActionReturn")
  expect(place).not.toContain("B_ACTION_GATE_REQUEST_EVENT")

  for (const evidence of [
    "restorePlaceAfter19ReturnSession", "completePlaceAfter19Return", "restoreBDiscoveryVenueContext",
    "restoreBDiscoveryCityContext", "focusPlaceDestination", "PopStateEvent", "canonical-after19-access",
  ]) expect(global).toContain(evidence)
  expect(model).toContain('cta: "OPEN_AFTER19"')
  expect(model).toContain('focusTarget: "canonical-after19-access"')
  expect(styles).toContain(".after19Access:focus-visible")
})

test("FL-002 Place stays concise while the gate owns the user-facing boundary", () => {
  const place = source("features/ondo/place/canonical-place-overlay.tsx")
  const global = source("features/ondo/after19/after19-global-b.tsx")
  expect(place).not.toMatch(/ONDO policy|ONDO 정책|ONDOの方針/)
  for (const truth of [
    "Narrows this map to pub & café licence types. Actual entry, age and alcohol-service rules are not confirmed.",
    "주점·카페 업태만 모아 보여줘요. 실제 입장·연령·주류 제공 조건은 확인되지 않았어요.",
    "パブ・カフェの営業許可業種に絞って表示します。実際の入店・年齢・酒類提供条件は確認していません。",
  ]) expect(global).toContain(truth)
  for (const locale of ["en", "ko", "ja"]) expect(global).toContain(`${locale}: {`)
  expect(global).not.toMatch(/activateAccount|paymentKyc|passport|dateOfBirth|birthDate|credentialPayload|verifyAge\(/i)
})
