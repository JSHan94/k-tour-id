import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"
import {
  completePlaceAfter19Return,
  consumePendingPlaceAfter19ReturnJournal,
  createPlaceAfter19Return,
  isPlaceAfter19ReturnPending,
  isPlaceAfter19ReturnStructurallyValid,
  PLACE_AFTER19_RETURN_SESSION_KEY,
  PLACE_AFTER19_RETURN_TTL_MS,
  preparePlaceAfter19Return,
  renewPlaceAfter19Return,
  renewPreparedPlaceAfter19Return,
  requestPlaceAfter19Return,
  restorePlaceAfter19ReturnSession,
} from "../../features/ondo/after19/after19-place-return-b-model"
import {
  DEFAULT_GLOBAL_AFTER19_SESSION,
  GLOBAL_AFTER19_AGE_TTL_MS,
  GLOBAL_AFTER19_SESSION_KEY,
  persistGlobalAfter19SessionB,
  rollbackPersistedGlobalAfter19SessionB,
  type GlobalAfter19SessionB,
} from "../../features/ondo/after19/after19-global-b-model"
import type { PlaceReturnUiSnapshotInputB } from "../../features/ondo/map/place-return-ui-snapshot-b"

const NOW = new Date("2026-08-28T03:00:00.000Z")
const VENUE_ID = "mois-0021cd596bc5b2a922ad"
const SECOND_VENUE_ID = "mois-02d77be9fc4b43fbb360"

class MemoryStorage {
  protected readonly values: Record<string, string>
  constructor(values: Record<string, string> = {}) { this.values = { ...values } }
  getItem(key: string) { return this.values[key] ?? null }
  setItem(key: string, value: string) { this.values[key] = value }
  removeItem(key: string) { delete this.values[key] }
  raw(key: string) { return this.values[key] ?? null }
  clone() { return new MemoryStorage(this.values) }
}

class SelectiveStorage extends MemoryStorage {
  failNextSet = false
  ignoreNextSet = false
  mismatchAfterNextSet = false
  private mismatchNextRead = false
  override getItem(key: string) {
    if (this.mismatchNextRead) {
      this.mismatchNextRead = false
      return `${super.getItem(key) ?? ""}#mismatch`
    }
    return super.getItem(key)
  }
  override setItem(key: string, value: string) {
    if (this.ignoreNextSet) {
      this.ignoreNextSet = false
      return
    }
    if (this.failNextSet) {
      this.failNextSet = false
      throw new Error("selective write failure")
    }
    super.setItem(key, value)
    if (this.mismatchAfterNextSet) {
      this.mismatchAfterNextSet = false
      this.mismatchNextRead = true
    }
  }
}

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

function uiInput(tokenId: string, venueId = VENUE_ID): PlaceReturnUiSnapshotInputB {
  return {
    tokenId,
    venueId,
    camera: { longitude: 127.027621, latitude: 37.497942, zoom: 14.625, bearing: -12.5, pitch: 34 },
    detail: {
      sheetSnap: "detail",
      section: "after19",
      openSections: ["temperature", "pre_visit"],
      scrollTop: 438,
      focus: "after19_unlock",
    },
  }
}

test("FL-002/013 public hand-off is minimal while exact UI is a sibling in one strict journal", () => {
  const storage = new MemoryStorage()
  const envelope = createPlaceAfter19Return({ venueId: VENUE_ID, now: NOW })

  expect(PLACE_AFTER19_RETURN_TTL_MS).toBe(15 * 60 * 1000)
  expect(envelope).toMatchObject({ cta: "OPEN_AFTER19", venueId: VENUE_ID, gateQueue: ["age"], activeGate: "age" })
  expect(Object.keys(envelope).sort()).toEqual([
    "activeGate", "createdAt", "cta", "expiresAt", "gateQueue", "tokenId", "venueId",
  ].sort())
  expect(envelope).not.toHaveProperty("camera")
  expect(envelope).not.toHaveProperty("detail")
  expect(preparePlaceAfter19Return(storage as unknown as Storage, envelope, uiInput(envelope.tokenId), NOW)).toBe(true)

  const journal = JSON.parse(storage.raw(PLACE_AFTER19_RETURN_SESSION_KEY)!)
  expect(Object.keys(journal).sort()).toEqual([
    "version", "revision", "phase", "publicEnvelope", "publicExpectation", "privateUiSnapshot",
    "privateUiExpectation", "lastConsumed", "consumedTokens",
  ].sort())
  expect(journal).toMatchObject({ version: 2, revision: 1, phase: "pending", publicEnvelope: envelope })
  expect(journal.publicEnvelope).not.toHaveProperty("camera")
  expect(journal.privateUiSnapshot).toMatchObject({ tokenId: envelope.tokenId, venueId: VENUE_ID, detail: { scrollTop: 438 } })
  expect(storage.raw(PLACE_AFTER19_RETURN_SESSION_KEY)).not.toMatch(/birth|account|person|payment|passport|credential|photo|secret/i)

  expect(() => createPlaceAfter19Return({ venueId: "mois-aaaaaaaaaaaaaaaaaaaa", now: NOW })).toThrow()
  expect(isPlaceAfter19ReturnStructurallyValid({ ...envelope, query: "gukbap" })).toBe(false)
})

test("FL-002 reload restores the same atomic pending pair and success consumes it exactly once", () => {
  const storage = new MemoryStorage()
  const envelope = createPlaceAfter19Return({ venueId: VENUE_ID, now: NOW })
  expect(preparePlaceAfter19Return(storage as unknown as Storage, envelope, uiInput(envelope.tokenId), NOW)).toBe(true)

  const reloaded = storage.clone()
  expect(restorePlaceAfter19ReturnSession(reloaded as unknown as Storage, NOW)).toMatchObject({
    phase: "pending", publicEnvelope: envelope, privateUiSnapshot: { camera: uiInput(envelope.tokenId).camera, detail: uiInput(envelope.tokenId).detail },
  })
  const completed = consumePendingPlaceAfter19ReturnJournal(reloaded as unknown as Storage, envelope, "success", new Date(NOW.getTime() + 1))
  expect(completed).toMatchObject({ returnTo: { tokenId: envelope.tokenId, consumedAt: new Date(NOW.getTime() + 1).toISOString() }, uiSnapshot: { detail: { scrollTop: 438 } } })
  expect(restorePlaceAfter19ReturnSession(reloaded as unknown as Storage, NOW)).toMatchObject({
    phase: "consumed", publicEnvelope: null, privateUiSnapshot: null,
    lastConsumed: { tokenId: envelope.tokenId, outcome: "success" },
  })
  expect(consumePendingPlaceAfter19ReturnJournal(reloaded as unknown as Storage, envelope, "success", NOW)).toBeNull()
})

test("FL-002 a spec-atomic stage throw dispatches no request and leaves no half journal", () => {
  for (const failure of ["throw"] as const) {
    const storage = new SelectiveStorage()
    if (failure === "throw") storage.failNextSet = true
    const envelope = createPlaceAfter19Return({ venueId: VENUE_ID, now: NOW })
    let dispatches = 0
    const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window")
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { sessionStorage: storage, dispatchEvent: () => { dispatches += 1 } },
    })
    try {
      expect(requestPlaceAfter19Return(envelope, uiInput(envelope.tokenId), NOW)).toBe(false)
      expect(dispatches).toBe(0)
      expect(storage.raw(PLACE_AFTER19_RETURN_SESSION_KEY)).toBeNull()
    } finally {
      if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow)
      else Reflect.deleteProperty(globalThis, "window")
    }
  }
})

test("FL-002 spec-atomic consume throw and readback mismatch release nothing and retain exact retry state", () => {
  for (const failure of ["throw", "mismatch"] as const) {
    const storage = new SelectiveStorage()
    const envelope = createPlaceAfter19Return({ venueId: VENUE_ID, now: NOW })
    expect(preparePlaceAfter19Return(storage as unknown as Storage, envelope, uiInput(envelope.tokenId), NOW)).toBe(true)
    const pendingRaw = storage.raw(PLACE_AFTER19_RETURN_SESSION_KEY)
    if (failure === "throw") storage.failNextSet = true
    else storage.mismatchAfterNextSet = true

    expect(consumePendingPlaceAfter19ReturnJournal(storage as unknown as Storage, envelope, "success", new Date(NOW.getTime() + 1))).toBeNull()
    expect(storage.raw(PLACE_AFTER19_RETURN_SESSION_KEY)).toBe(pendingRaw)
    expect(restorePlaceAfter19ReturnSession(storage as unknown as Storage, new Date(NOW.getTime() + 2))).toMatchObject({
      phase: "pending", publicEnvelope: envelope, privateUiSnapshot: { detail: { scrollTop: 438, focus: "after19_unlock" } },
    })
  }
})

test("FL-002 a failed consume CAS emits no completion event", () => {
  const storage = new SelectiveStorage()
  const envelope = createPlaceAfter19Return({ venueId: VENUE_ID, now: NOW })
  expect(preparePlaceAfter19Return(storage as unknown as Storage, envelope, uiInput(envelope.tokenId), NOW)).toBe(true)
  storage.mismatchAfterNextSet = true
  let dispatches = 0
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window")
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { sessionStorage: storage, dispatchEvent: () => { dispatches += 1 } },
  })
  try {
    expect(completePlaceAfter19Return(envelope, "success", new Date(NOW.getTime() + 1))).toBeNull()
    expect(dispatches).toBe(0)
    expect(restorePlaceAfter19ReturnSession(storage as unknown as Storage, new Date(NOW.getTime() + 2)).phase).toBe("pending")
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow)
    else Reflect.deleteProperty(globalThis, "window")
  }
})

test("FL-002 Account receipt ignored/set/readback failures publish no durable eligible state", () => {
  const expiresAt = new Date(NOW.getTime() + GLOBAL_AFTER19_AGE_TTL_MS).toISOString()
  const eligible: GlobalAfter19SessionB = {
    version: 1,
    age: "eligible",
    ageExpiresAt: expiresAt,
    eligibilityReceipt: {
      schema: "review-age-predicate.v1",
      predicate: "AGE_GTE_19",
      outcome: "eligible",
      issuerType: "REVIEW_FIXTURE",
      provenanceTruth: "SIMULATED",
      fixtureId: "FX-AGE-GLOBAL-001",
      issuedAt: NOW.toISOString(),
      expiresAt,
      disclosure: "predicate_only",
    },
    mode: "on",
    activation: "manual",
    expiryNotice: false,
  }
  for (const failure of ["ignored", "throw", "mismatch"] as const) {
    const previous = JSON.stringify(DEFAULT_GLOBAL_AFTER19_SESSION)
    const storage = new SelectiveStorage({ [GLOBAL_AFTER19_SESSION_KEY]: previous })
    if (failure === "ignored") storage.ignoreNextSet = true
    else if (failure === "throw") storage.failNextSet = true
    else storage.mismatchAfterNextSet = true
    expect(persistGlobalAfter19SessionB(storage as unknown as Storage, eligible, NOW, { allowReviewFixture: true })).toBeNull()
    expect(storage.raw(GLOBAL_AFTER19_SESSION_KEY)).toBe(previous)
  }

  const persistedStorage = new SelectiveStorage({ [GLOBAL_AFTER19_SESSION_KEY]: JSON.stringify(DEFAULT_GLOBAL_AFTER19_SESSION) })
  const persisted = persistGlobalAfter19SessionB(persistedStorage as unknown as Storage, eligible, NOW, { allowReviewFixture: true })
  expect(persisted).not.toBeNull()
  expect(rollbackPersistedGlobalAfter19SessionB(persistedStorage as unknown as Storage, persisted!)).toBe(true)
  expect(persistedStorage.raw(GLOBAL_AFTER19_SESSION_KEY)).toBe(JSON.stringify(DEFAULT_GLOBAL_AFTER19_SESSION))

  const global = source("features/ondo/after19/after19-global-b.tsx")
  const persistIndex = global.indexOf("persistGlobalAfter19SessionB(window.sessionStorage, nextSession")
  const finishIndex = global.indexOf('finishPlaceReturn("success"', persistIndex)
  const reactIndex = global.indexOf("commitSession(nextSession", finishIndex)
  expect(persistIndex).toBeGreaterThan(0)
  expect(finishIndex).toBeGreaterThan(persistIndex)
  expect(reactIndex).toBeGreaterThan(finishIndex)
  expect(global).toContain("rollbackPersistedGlobalAfter19SessionB(window.sessionStorage, accountPersistence)")
})

test("FL-002 Account receipt rolls back when the original action consume CAS fails", () => {
  const expiresAt = new Date(NOW.getTime() + GLOBAL_AFTER19_AGE_TTL_MS).toISOString()
  const eligible: GlobalAfter19SessionB = {
    version: 1,
    age: "eligible",
    ageExpiresAt: expiresAt,
    eligibilityReceipt: {
      schema: "review-age-predicate.v1", predicate: "AGE_GTE_19", outcome: "eligible",
      issuerType: "REVIEW_FIXTURE", provenanceTruth: "SIMULATED", fixtureId: "FX-AGE-GLOBAL-001",
      issuedAt: NOW.toISOString(), expiresAt, disclosure: "predicate_only",
    },
    mode: "on", activation: "manual", expiryNotice: false,
  }
  const storage = new SelectiveStorage({ [GLOBAL_AFTER19_SESSION_KEY]: JSON.stringify(DEFAULT_GLOBAL_AFTER19_SESSION) })
  const envelope = createPlaceAfter19Return({ venueId: VENUE_ID, now: NOW })
  expect(preparePlaceAfter19Return(storage as unknown as Storage, envelope, uiInput(envelope.tokenId), NOW)).toBe(true)
  const persisted = persistGlobalAfter19SessionB(storage as unknown as Storage, eligible, NOW, { allowReviewFixture: true })
  expect(persisted).not.toBeNull()
  storage.mismatchAfterNextSet = true
  expect(consumePendingPlaceAfter19ReturnJournal(storage as unknown as Storage, envelope, "success", new Date(NOW.getTime() + 1))).toBeNull()
  expect(rollbackPersistedGlobalAfter19SessionB(storage as unknown as Storage, persisted!)).toBe(true)
  expect(storage.raw(GLOBAL_AFTER19_SESSION_KEY)).toBe(JSON.stringify(DEFAULT_GLOBAL_AFTER19_SESSION))
  expect(restorePlaceAfter19ReturnSession(storage as unknown as Storage, new Date(NOW.getTime() + 2))).toMatchObject({
    phase: "pending", publicEnvelope: envelope, privateUiSnapshot: { venueId: VENUE_ID },
  })
})

test("FL-002 cancel is the same atomic one-shot and a transient failure remains retryable", () => {
  const storage = new MemoryStorage()
  const envelope = createPlaceAfter19Return({ venueId: VENUE_ID, now: NOW })
  expect(preparePlaceAfter19Return(storage as unknown as Storage, envelope, uiInput(envelope.tokenId), NOW)).toBe(true)
  expect(restorePlaceAfter19ReturnSession(storage as unknown as Storage, new Date(NOW.getTime() + 8_000)).phase).toBe("pending")
  expect(consumePendingPlaceAfter19ReturnJournal(storage as unknown as Storage, envelope, "cancel", new Date(NOW.getTime() + 9_000))).toMatchObject({
    returnTo: { tokenId: envelope.tokenId }, uiSnapshot: { camera: uiInput(envelope.tokenId).camera },
  })
  expect(consumePendingPlaceAfter19ReturnJournal(storage as unknown as Storage, envelope, "cancel", new Date(NOW.getTime() + 10_000))).toBeNull()
})

test("FL-002 retry renewal re-keys public and private siblings in one CAS", () => {
  const storage = new MemoryStorage()
  const envelope = createPlaceAfter19Return({ venueId: VENUE_ID, now: NOW })
  expect(preparePlaceAfter19Return(storage as unknown as Storage, envelope, uiInput(envelope.tokenId), NOW)).toBe(true)
  const expiry = new Date(Date.parse(envelope.expiresAt))
  expect(isPlaceAfter19ReturnPending(envelope, expiry)).toBe(false)
  const renewed = renewPlaceAfter19Return(envelope, expiry)
  expect(renewPreparedPlaceAfter19Return(storage as unknown as Storage, envelope, renewed, expiry)).toBe(true)
  expect(restorePlaceAfter19ReturnSession(storage as unknown as Storage, expiry)).toMatchObject({
    phase: "pending", publicEnvelope: { tokenId: renewed.tokenId }, privateUiSnapshot: { tokenId: renewed.tokenId, venueId: VENUE_ID },
  })
  expect(consumePendingPlaceAfter19ReturnJournal(storage as unknown as Storage, renewed, "success", new Date(expiry.getTime() + 1))).not.toBeNull()
})

test("FL-002 an expired decision can cancel back through the bounded private UI grace without granting Age", () => {
  const storage = new MemoryStorage()
  const envelope = createPlaceAfter19Return({ venueId: VENUE_ID, now: NOW })
  expect(preparePlaceAfter19Return(storage as unknown as Storage, envelope, uiInput(envelope.tokenId), NOW)).toBe(true)
  const expired = new Date(Date.parse(envelope.expiresAt) + 1)
  expect(isPlaceAfter19ReturnPending(envelope, expired)).toBe(false)
  expect(consumePendingPlaceAfter19ReturnJournal(storage as unknown as Storage, envelope, "success", expired)).toBeNull()
  expect(consumePendingPlaceAfter19ReturnJournal(storage as unknown as Storage, envelope, "cancel", expired)).toMatchObject({
    returnTo: { tokenId: envelope.tokenId },
    uiSnapshot: { detail: { section: "after19", scrollTop: 438 } },
  })
})

test("FL-013 same-token field swaps and exact-key additions quarantine the whole pair", () => {
  const mutations: Array<(journal: Record<string, any>) => void> = [
    (journal) => { journal.publicEnvelope.venueId = SECOND_VENUE_ID },
    (journal) => { journal.privateUiSnapshot.camera.longitude = 126.978 },
    (journal) => { journal.privateUiSnapshot.detail.scrollTop = 439 },
    (journal) => { journal.privateUiSnapshot.detail.focus = "detail_close" },
    (journal) => { journal.privateUiSnapshot.detail.openSections = ["source"] },
    (journal) => { journal.privateUiSnapshot.extra = "forbidden" },
  ]

  for (const mutate of mutations) {
    const storage = new MemoryStorage()
    const envelope = createPlaceAfter19Return({ venueId: VENUE_ID, now: NOW })
    expect(preparePlaceAfter19Return(storage as unknown as Storage, envelope, uiInput(envelope.tokenId), NOW)).toBe(true)
    const journal = JSON.parse(storage.raw(PLACE_AFTER19_RETURN_SESSION_KEY)!)
    mutate(journal)
    storage.setItem(PLACE_AFTER19_RETURN_SESSION_KEY, JSON.stringify(journal))
    expect(restorePlaceAfter19ReturnSession(storage as unknown as Storage, NOW)).toMatchObject({ phase: "idle", publicEnvelope: null, privateUiSnapshot: null })
    expect(storage.raw(PLACE_AFTER19_RETURN_SESSION_KEY)).toBeNull()
    expect(consumePendingPlaceAfter19ReturnJournal(storage as unknown as Storage, envelope, "success", NOW)).toBeNull()
  }
})

test("FL-002 collision/replay cannot replace or reopen an atomic journal", () => {
  const storage = new MemoryStorage()
  const first = createPlaceAfter19Return({ venueId: VENUE_ID, now: NOW })
  const collision = createPlaceAfter19Return({ venueId: SECOND_VENUE_ID, now: NOW })
  expect(preparePlaceAfter19Return(storage as unknown as Storage, first, uiInput(first.tokenId), NOW)).toBe(true)
  expect(preparePlaceAfter19Return(storage as unknown as Storage, collision, uiInput(collision.tokenId, SECOND_VENUE_ID), NOW)).toBe(false)
  expect(consumePendingPlaceAfter19ReturnJournal(storage as unknown as Storage, first, "success", new Date(NOW.getTime() + 1))).not.toBeNull()
  expect(preparePlaceAfter19Return(storage as unknown as Storage, first, uiInput(first.tokenId), new Date(NOW.getTime() + 2))).toBe(false)
})

test("FL-002 runtime ordering keeps storage/CAS before protected UI, navigation, or events", () => {
  const place = source("features/ondo/place/canonical-place-overlay.tsx")
  const global = source("features/ondo/after19/after19-global-b.tsx")
  const model = source("features/ondo/after19/after19-place-return-b-model.ts")
  const styles = source("features/ondo/map/map-b.module.css")

  expect(place.indexOf("requestPlaceAfter19Return(returnTo, privateUiSnapshot, now)")).toBeGreaterThan(place.indexOf("const privateUiSnapshot"))
  expect(place).not.toContain("stagePlaceReturnUiSnapshot")
  const prepareIndex = model.indexOf("preparePlaceAfter19Return(window.sessionStorage")
  const requestEventIndex = model.indexOf("window.dispatchEvent(new CustomEvent(PLACE_AFTER19_RETURN_REQUEST_EVENT")
  const persistIndex = global.indexOf("persistGlobalAfter19SessionB(window.sessionStorage, nextSession")
  const finishIndex = global.indexOf('finishPlaceReturn("success"', persistIndex)
  const publishIndex = global.indexOf("commitSession(nextSession", finishIndex)
  const consumeIndex = global.indexOf("completePlaceAfter19Return(placeReturn")
  const restoreIndex = global.indexOf("restorePlaceContext(placeReturn)", consumeIndex)
  for (const index of [prepareIndex, requestEventIndex, persistIndex, finishIndex, publishIndex, consumeIndex, restoreIndex]) {
    expect(index).toBeGreaterThan(0)
  }
  expect(prepareIndex).toBeLessThan(requestEventIndex)
  expect(persistIndex).toBeLessThan(finishIndex)
  expect(finishIndex).toBeLessThan(publishIndex)
  expect(consumeIndex).toBeLessThan(restoreIndex)
  expect(model).toContain("confirmedRaw === encoded")
  expect(model).toContain("rollbackRaw(storage, previousRaw)")
  expect(styles).toMatch(/global-after19-toggle[\s\S]*width: 64px[\s\S]*font-weight: 900/)
  expect(place).toContain('data-testid="canonical-after19-review-provenance"')
})

test("FL-002 Place stays concise while the shared gate owns privacy and place-rule boundaries", () => {
  const place = source("features/ondo/place/canonical-place-overlay.tsx")
  const global = source("features/ondo/after19/after19-global-b.tsx")
  expect(place).not.toMatch(/ONDO policy|ONDO 정책|ONDOの方針/)
  for (const truth of [
    "Category does not confirm opening hours or alcohol service.",
    "영업시간과 주류 제공 여부는 장소에서 확인해 주세요.",
    "営業時間や酒類提供の有無は各店舗でご確認ください。",
  ]) expect(global).toContain(truth)
  for (const provenance of [
    "Review result · no external check",
    "검토 결과 · 외부 확인 없음",
    "レビュー結果・外部確認なし",
  ]) expect(place).toContain(provenance)
  expect(global).not.toMatch(/activateAccount|paymentKyc|passport|dateOfBirth|birthDate|credentialPayload|verifyAge\(/i)
})
