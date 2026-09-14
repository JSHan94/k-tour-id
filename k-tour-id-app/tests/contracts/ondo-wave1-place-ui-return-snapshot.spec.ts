import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"
import { createPlaceAfter19Return, PLACE_AFTER19_RETURN_TTL_MS } from "../../features/ondo/after19/after19-place-return-b-model"
import { clearGuestAfter19MemoryB, readGuestAfter19MemoryB, writeGuestAfter19MemoryB } from "../../features/ondo/after19/after19-guest-memory-b"
import { GLOBAL_AFTER19_AGE_TTL_MS } from "../../features/ondo/after19/after19-global-b-model"
import {
  consumePlaceReturnUiSnapshot,
  discardPlaceReturnUiSnapshot,
  PLACE_RETURN_UI_SNAPSHOT_SESSION_KEY,
  PLACE_RETURN_UI_SNAPSHOT_TTL_MS,
  renewPlaceReturnUiSnapshot,
  restorePlaceReturnUiSnapshot,
  stagePlaceReturnUiSnapshot,
  type PlaceReturnUiSnapshotB,
} from "../../features/ondo/map/place-return-ui-snapshot-b"

const NOW = new Date("2026-08-28T03:00:00.000Z")
const VENUE_ID = "mois-0021cd596bc5b2a922ad"
const OTHER_VENUE_ID = "mois-02d77be9fc4b43fbb360"

class MemoryStorage {
  constructor(private readonly values: Record<string, string> = {}) {}
  getItem(key: string) { return this.values[key] ?? null }
  setItem(key: string, value: string) { this.values[key] = value }
  removeItem(key: string) { delete this.values[key] }
  raw(key: string) { return this.values[key] ?? null }
  clone() { return new MemoryStorage({ ...this.values }) }
}

const camera = { longitude: 127.027621, latitude: 37.497942, zoom: 14.625, bearing: -12.5, pitch: 34 }
const detail = {
  sheetSnap: "detail" as const,
  section: "after19" as const,
  openSections: ["temperature", "pre_visit"] as const,
  scrollTop: 438,
  focus: "after19_unlock" as const,
}

function input(tokenId: string, venueId = VENUE_ID) {
  return { tokenId, venueId, camera, detail }
}

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

test("FL-002/013 UI state is a strict token-keyed session snapshot, never public return context", () => {
  const storage = new MemoryStorage()
  const returnTo = createPlaceAfter19Return({ venueId: VENUE_ID, now: NOW })

  expect(stagePlaceReturnUiSnapshot(storage as unknown as Storage, input(returnTo.tokenId), NOW)).toBe(true)
  expect(Object.keys(returnTo).sort()).toEqual([
    "activeGate", "createdAt", "cta", "expiresAt", "gateQueue", "tokenId", "venueId",
  ].sort())
  expect(returnTo).not.toHaveProperty("camera")
  expect(returnTo).not.toHaveProperty("detail")
  expect(returnTo).not.toHaveProperty("focus")

  const raw = storage.raw(PLACE_RETURN_UI_SNAPSHOT_SESSION_KEY)
  expect(raw).not.toBeNull()
  expect(JSON.parse(raw!)).toEqual({
    version: 1,
    entries: {
      [returnTo.tokenId]: {
        tokenId: returnTo.tokenId,
        venueId: VENUE_ID,
        capturedAt: NOW.toISOString(),
        expiresAt: new Date(NOW.getTime() + PLACE_RETURN_UI_SNAPSHOT_TTL_MS).toISOString(),
        camera,
        detail,
      },
    },
  })
  expect(raw).not.toMatch(/birth|dob|passport|credential|provider.?response|account|payment|photo|blob|secret/i)
  expect(PLACE_RETURN_UI_SNAPSHOT_TTL_MS).toBe(2 * PLACE_AFTER19_RETURN_TTL_MS)
})

test("FL-002 reload preserves exact camera/sheet/section/scroll/focus; success consumes once", () => {
  const storage = new MemoryStorage()
  const returnTo = createPlaceAfter19Return({ venueId: VENUE_ID, now: NOW })
  expect(stagePlaceReturnUiSnapshot(storage as unknown as Storage, input(returnTo.tokenId), NOW)).toBe(true)

  const reloaded = storage.clone()
  expect(restorePlaceReturnUiSnapshot(reloaded as unknown as Storage, returnTo.tokenId, VENUE_ID, new Date(NOW.getTime() + 1))).toMatchObject({
    tokenId: returnTo.tokenId,
    venueId: VENUE_ID,
    camera,
    detail,
  })
  expect(consumePlaceReturnUiSnapshot(reloaded as unknown as Storage, returnTo.tokenId, VENUE_ID, new Date(NOW.getTime() + 2))).toMatchObject({ camera, detail })
  expect(restorePlaceReturnUiSnapshot(reloaded as unknown as Storage, returnTo.tokenId, VENUE_ID, new Date(NOW.getTime() + 3))).toBeNull()
  expect(consumePlaceReturnUiSnapshot(reloaded as unknown as Storage, returnTo.tokenId, VENUE_ID, new Date(NOW.getTime() + 4))).toBeNull()
  expect(reloaded.raw(PLACE_RETURN_UI_SNAPSHOT_SESSION_KEY)).toBeNull()
})

test("FL-002 failure keeps the snapshot retryable and cancel consumes the same exact UI once", () => {
  const storage = new MemoryStorage()
  const returnTo = createPlaceAfter19Return({ venueId: VENUE_ID, now: NOW })
  expect(stagePlaceReturnUiSnapshot(storage as unknown as Storage, input(returnTo.tokenId), NOW)).toBe(true)

  // A transient provider failure does not terminate or consume the return.
  expect(restorePlaceReturnUiSnapshot(storage as unknown as Storage, returnTo.tokenId, VENUE_ID, new Date(NOW.getTime() + 4_000))).toMatchObject({ detail })
  expect(restorePlaceReturnUiSnapshot(storage as unknown as Storage, returnTo.tokenId, VENUE_ID, new Date(NOW.getTime() + 8_000))).toMatchObject({ detail })

  // Cancel/general-details is terminal and gets the same exact local restore.
  expect(consumePlaceReturnUiSnapshot(storage as unknown as Storage, returnTo.tokenId, VENUE_ID, new Date(NOW.getTime() + 9_000))).toMatchObject({ camera, detail })
  expect(consumePlaceReturnUiSnapshot(storage as unknown as Storage, returnTo.tokenId, VENUE_ID, new Date(NOW.getTime() + 10_000))).toBeNull()
})

test("FL-002 expired public return has bounded UI grace, supports retry re-key, then expires closed", () => {
  const storage = new MemoryStorage()
  const returnTo = createPlaceAfter19Return({ venueId: VENUE_ID, now: NOW })
  expect(stagePlaceReturnUiSnapshot(storage as unknown as Storage, input(returnTo.tokenId), NOW)).toBe(true)

  const publicExpiry = new Date(NOW.getTime() + PLACE_AFTER19_RETURN_TTL_MS)
  expect(restorePlaceReturnUiSnapshot(storage as unknown as Storage, returnTo.tokenId, VENUE_ID, publicExpiry)).toMatchObject({ camera, detail })
  const renewed = createPlaceAfter19Return({ venueId: VENUE_ID, now: publicExpiry })
  expect(renewPlaceReturnUiSnapshot(storage as unknown as Storage, returnTo.tokenId, renewed.tokenId, VENUE_ID, publicExpiry)).toBe(true)
  expect(restorePlaceReturnUiSnapshot(storage as unknown as Storage, returnTo.tokenId, VENUE_ID, publicExpiry)).toMatchObject({ camera, detail })
  expect(restorePlaceReturnUiSnapshot(storage as unknown as Storage, renewed.tokenId, VENUE_ID, publicExpiry)).toMatchObject({ camera, detail })
  expect(discardPlaceReturnUiSnapshot(storage as unknown as Storage, returnTo.tokenId, publicExpiry)).toBe(true)
  expect(restorePlaceReturnUiSnapshot(storage as unknown as Storage, returnTo.tokenId, VENUE_ID, publicExpiry)).toBeNull()

  const uiExpiry = new Date(publicExpiry.getTime() + PLACE_RETURN_UI_SNAPSHOT_TTL_MS)
  expect(restorePlaceReturnUiSnapshot(storage as unknown as Storage, renewed.tokenId, VENUE_ID, uiExpiry)).toBeNull()
  expect(consumePlaceReturnUiSnapshot(storage as unknown as Storage, renewed.tokenId, VENUE_ID, uiExpiry)).toBeNull()
  expect(storage.raw(PLACE_RETURN_UI_SNAPSHOT_SESSION_KEY)).toBeNull()
})

test("FL-002 snapshot tampering and token/venue substitution fail closed and delete one-shot state", () => {
  const returnTo = createPlaceAfter19Return({ venueId: VENUE_ID, now: NOW })
  const scenarios: Array<(snapshot: PlaceReturnUiSnapshotB) => unknown> = [
    (snapshot) => ({ ...snapshot, rawPassport: "forbidden" }),
    (snapshot) => ({ ...snapshot, camera: { ...snapshot.camera, latitude: 120 } }),
    (snapshot) => ({ ...snapshot, detail: { ...snapshot.detail, focus: "body" } }),
    (snapshot) => ({ ...snapshot, detail: { ...snapshot.detail, openSections: ["source", "source"] } }),
    (snapshot) => ({ ...snapshot, tokenId: `RT-OPEN_AFTER19-${NOW.getTime() + 1}` }),
  ]

  for (const mutate of scenarios) {
    const storage = new MemoryStorage()
    expect(stagePlaceReturnUiSnapshot(storage as unknown as Storage, input(returnTo.tokenId), NOW)).toBe(true)
    const session = JSON.parse(storage.raw(PLACE_RETURN_UI_SNAPSHOT_SESSION_KEY)!)
    session.entries[returnTo.tokenId] = mutate(session.entries[returnTo.tokenId])
    storage.setItem(PLACE_RETURN_UI_SNAPSHOT_SESSION_KEY, JSON.stringify(session))
    expect(restorePlaceReturnUiSnapshot(storage as unknown as Storage, returnTo.tokenId, VENUE_ID, NOW)).toBeNull()
    expect(consumePlaceReturnUiSnapshot(storage as unknown as Storage, returnTo.tokenId, VENUE_ID, NOW)).toBeNull()
    expect(storage.raw(PLACE_RETURN_UI_SNAPSHOT_SESSION_KEY)).toBeNull()
  }

  const substituted = new MemoryStorage()
  expect(stagePlaceReturnUiSnapshot(substituted as unknown as Storage, input(returnTo.tokenId), NOW)).toBe(true)
  expect(consumePlaceReturnUiSnapshot(substituted as unknown as Storage, returnTo.tokenId, OTHER_VENUE_ID, NOW)).toBeNull()
  expect(substituted.raw(PLACE_RETURN_UI_SNAPSHOT_SESSION_KEY)).toBeNull()
})

test("FL-002/013 runtime integration restores camera and the actual scroll owner without persisting Guest age", () => {
  const model = source("features/ondo/map/place-return-ui-snapshot-b.ts")
  const map = source("features/ondo/map/map-entry-b.tsx")
  const place = source("features/ondo/place/canonical-place-overlay.tsx")
  const after19 = source("features/ondo/after19/after19-global-b.tsx")

  for (const evidence of ["hasExactKeys", "sanitizeCamera", "sanitizeDetail", "isCanonicalVenueId", "removeItem", "MAX_SNAPSHOTS", "trustedRestoreEvents"]) {
    expect(model).toContain(evidence)
  }
  expect(model).not.toMatch(/localStorage|query|category|dateOfBirth|passport|credential/)
  for (const evidence of ["registerPlaceReturnCameraReader", "PLACE_RETURN_UI_RESTORE_EVENT", "map.jumpTo", "getBearing", "getPitch"]) {
    expect(map).toContain(evidence)
  }
  for (const evidence of [
    "requestPlaceAfter19Return", "readPlaceReturnCamera", "data-place-return-sheet-snap=\"detail\"",
    "data-place-return-scroll=\"detail\"", "data-place-return-open-section", "data-place-return-focus=\"after19_unlock\"",
    "bodyRef.current?.scrollTop", "accountActive", "DEFAULT_GLOBAL_AFTER19_SESSION",
  ]) expect(place).toContain(evidence)
  expect(place).toContain("accountActive\n          ? restoreGlobalAfter19B")
  expect(place).toContain(": readGuestAfter19MemoryB")
  for (const evidence of ["completePlaceAfter19Return", "dispatchPlaceReturnUiRestore", "renewPreparedPlaceAfter19Return"]) {
    expect(after19).toContain(evidence)
  }
})

test("FL-002 same-token replacement and explicit discard cannot leave a replayable snapshot", () => {
  const storage = new MemoryStorage()
  const returnTo = createPlaceAfter19Return({ venueId: VENUE_ID, now: NOW })
  expect(stagePlaceReturnUiSnapshot(storage as unknown as Storage, input(returnTo.tokenId), NOW)).toBe(true)
  expect(stagePlaceReturnUiSnapshot(storage as unknown as Storage, input(returnTo.tokenId), NOW)).toBe(true)
  expect(stagePlaceReturnUiSnapshot(storage as unknown as Storage, input(returnTo.tokenId, OTHER_VENUE_ID), NOW)).toBe(false)
  expect(discardPlaceReturnUiSnapshot(storage as unknown as Storage, returnTo.tokenId, NOW)).toBe(true)
  expect(restorePlaceReturnUiSnapshot(storage as unknown as Storage, returnTo.tokenId, VENUE_ID, NOW)).toBeNull()
})

test("FL-002 storage write failure never hands off without the exact UI snapshot", () => {
  const returnTo = createPlaceAfter19Return({ venueId: VENUE_ID, now: NOW })
  const blocked = {
    getItem: () => null,
    setItem: () => { throw new Error("quota") },
    removeItem: () => { throw new Error("quota") },
  }
  expect(stagePlaceReturnUiSnapshot(blocked as unknown as Storage, input(returnTo.tokenId), NOW)).toBe(false)

  const place = source("features/ondo/place/canonical-place-overlay.tsx")
  const snapshotIndex = place.indexOf("const privateUiSnapshot")
  const requestIndex = place.indexOf("requestPlaceAfter19Return(returnTo, privateUiSnapshot, now)", snapshotIndex)
  expect(snapshotIndex).toBeGreaterThan(0)
  expect(requestIndex).toBeGreaterThan(snapshotIndex)
  expect(place).not.toContain("stagePlaceReturnUiSnapshot")

  const after19 = source("features/ondo/after19/after19-global-b.tsx")
  const renewalIndex = after19.indexOf("if (!renewPreparedPlaceAfter19Return")
  const renewedRequestIndex = after19.indexOf("setPlaceReturn(renewed)", renewalIndex)
  expect(renewalIndex).toBeGreaterThan(0)
  expect(renewedRequestIndex).toBeGreaterThan(renewalIndex)
  expect(after19).toContain("completePlaceAfter19Return(placeReturn, outcome, now)")
  expect(after19).not.toContain("discardPlaceReturnUiSnapshot")
})

test("FL-013 Guest 19+ survives same-document remount only; storage remains Account-only", () => {
  clearGuestAfter19MemoryB()
  const expiresAt = new Date(NOW.getTime() + GLOBAL_AFTER19_AGE_TTL_MS).toISOString()
  const eligible = {
    version: 1 as const,
    age: "eligible" as const,
    ageExpiresAt: expiresAt,
    eligibilityReceipt: {
      schema: "review-age-predicate.v1" as const,
      predicate: "AGE_GTE_19" as const,
      outcome: "eligible" as const,
      issuerType: "REVIEW_FIXTURE" as const,
      provenanceTruth: "SIMULATED" as const,
      fixtureId: "FX-AGE-GLOBAL-001" as const,
      issuedAt: NOW.toISOString(),
      expiresAt,
      disclosure: "predicate_only" as const,
    },
    mode: "on" as const,
    activation: "manual" as const,
    expiryNotice: false,
  }
  expect(writeGuestAfter19MemoryB(eligible, NOW, { allowReviewFixture: true })).toMatchObject({ age: "eligible", mode: "on" })
  expect(readGuestAfter19MemoryB(new Date(NOW.getTime() + 1), { allowReviewFixture: true })).toMatchObject({ age: "eligible", mode: "on" })
  clearGuestAfter19MemoryB()
  expect(readGuestAfter19MemoryB(new Date(NOW.getTime() + 2), { allowReviewFixture: true })).toMatchObject({ age: "unverified", mode: "off" })

  const memory = source("features/ondo/after19/after19-guest-memory-b.ts")
  const global = source("features/ondo/after19/after19-global-b.tsx")
  const place = source("features/ondo/place/canonical-place-overlay.tsx")
  expect(memory).not.toMatch(/localStorage|sessionStorage/)
  expect(global).toContain("readGuestAfter19MemoryB")
  expect(global).toContain("writeGuestAfter19MemoryB")
  expect(place).toContain("readGuestAfter19MemoryB")
  expect(global).toContain("accountActive ? window.sessionStorage : null")
  expect(place).toContain("accountActive\n          ? restoreGlobalAfter19B")
})
