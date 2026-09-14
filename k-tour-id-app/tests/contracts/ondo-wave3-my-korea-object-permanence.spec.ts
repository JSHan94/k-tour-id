import { expect, test } from "@playwright/test"
import {
  B_DEVICE_KEY,
  commerceSessionFromReceipts,
  persistBDeviceStateToStorage,
  reconcileBAccountSaveHydration,
  restoreBDeviceState,
  transitionCanonicalSavedVenueMembershipB,
  type OndoBCommerceReceipt,
} from "../../features/ondo/shared/state/ondo-b-provider"
import { resolveSavedRemovalFocusIndex } from "../../features/ondo/my/my-korea-model"
import { REVIEW_PROVENANCE_TRUTH } from "../../features/ondo/contracts/execution-mode"
import {
  STABLE_B_OFFER_ID,
  STABLE_B_OPENING_BALANCE,
  STABLE_B_OOKRW_PRICE,
  STABLE_B_RECEIPT_ID,
  STABLE_B_VOUCHER_VALUE,
} from "../../features/ondo/commerce-b/stable-commerce-model-b"

const VENUE = "mois-0021cd596bc5b2a922ad"
const OTHER_VENUE = "mois-18939eecb43c15ab4305"
const EXACT_NOTE = "Window seat, then ask for the quiet menu."

class DeviceStorage {
  private value: string | null
  failure: "none" | "ignored" | "mismatch" | "throw" = "none"
  private mismatchNextRead = false

  constructor(value: string | null) {
    this.value = value
  }

  getItem(key: string) {
    if (key !== B_DEVICE_KEY) return null
    if (this.mismatchNextRead) {
      this.mismatchNextRead = false
      return `${this.value ?? ""}#mismatch`
    }
    return this.value
  }

  setItem(key: string, value: string) {
    if (key !== B_DEVICE_KEY) return
    const failure = this.failure
    this.failure = "none"
    if (failure === "ignored") return
    if (failure === "throw") throw new Error("atomic device write failure")
    this.value = value
    if (failure === "mismatch") this.mismatchNextRead = true
  }

  removeItem(key: string) {
    if (key === B_DEVICE_KEY) this.value = null
  }

  raw() {
    return this.value
  }
}

function durableFixture(savedVenueIds: string[] = [VENUE]) {
  return restoreBDeviceState({
    locale: "en",
    onboarding: "ONB-COMPLETE",
    persona: "short_trip",
    discoveryArea: null,
    discoveryPreferences: ["cafe"],
    savedVenueIds,
    savedEditorialPlaceIds: [],
    accountSaveTransaction: null,
    privateNotesByVenue: { [VENUE]: EXACT_NOTE, [OTHER_VENUE]: "Another canonical note" },
    recentVenueIds: [VENUE, OTHER_VENUE],
    recentEditorialPlaceIds: [],
    plannedTableRefs: [{ tableId: "table-seoul-night-bites", venueId: VENUE }],
    localSignalPostedVenueIds: [VENUE],
    localPulseEvidenceByVenue: { [VENUE]: { tags: ["calm_now"], postedAt: "2026-09-04T01:02:03.000Z" } },
    localInteractionBoundarySeen: true,
    commerceLocalBoundarySeen: true,
    commerceFundingSource: "travel_balance",
    commerceReceipts: [],
  })
}

test("W3-MY-P0-001 unsave changes membership only and a later re-save reveals the byte-identical note", () => {
  const durable = durableFixture()
  const runtimeReceipt: OndoBCommerceReceipt = Object.freeze({
    executionTruth: "FIXTURE_REVIEW",
    provenanceTruth: REVIEW_PROVENANCE_TRUTH,
    receiptId: STABLE_B_RECEIPT_ID,
    refundReceiptId: null,
    offerId: STABLE_B_OFFER_ID,
    venueId: VENUE,
    status: "paid",
    paidOOKRW: STABLE_B_OOKRW_PRICE - STABLE_B_VOUCHER_VALUE,
    benefitOOKRW: STABLE_B_VOUCHER_VALUE,
    balanceOOKRW: STABLE_B_OPENING_BALANCE - (STABLE_B_OOKRW_PRICE - STABLE_B_VOUCHER_VALUE),
  })
  const commerceSession = commerceSessionFromReceipts([runtimeReceipt])
  const current = {
    ...durable,
    saveStatusByVenue: { [VENUE]: "SAV-SAVED" as const },
    commerceOrigin: { kind: "canonical_place" as const, venueId: VENUE },
    commerceReceiptVenueId: VENUE,
    commerceSession,
    commerceReceipts: [runtimeReceipt],
  }

  const unsaved = transitionCanonicalSavedVenueMembershipB(current, VENUE, false)
  expect(unsaved).toEqual({
    ...current,
    savedVenueIds: [],
    saveStatusByVenue: { [VENUE]: "SAV-IDLE" },
  })
  for (const axis of [
    "privateNotesByVenue", "recentVenueIds", "recentEditorialPlaceIds", "plannedTableRefs",
    "localSignalPostedVenueIds", "localPulseEvidenceByVenue", "commerceOrigin",
    "commerceReceiptVenueId", "commerceSession", "commerceReceipts",
  ] as const) expect(unsaved[axis], axis).toBe(current[axis])
  expect(unsaved.privateNotesByVenue[VENUE]).toBe(EXACT_NOTE)

  const resaved = transitionCanonicalSavedVenueMembershipB(unsaved, VENUE, true)
  expect(resaved).toEqual({
    ...current,
    savedVenueIds: [VENUE],
    saveStatusByVenue: { [VENUE]: "SAV-SAVED" },
  })
  expect(resaved.privateNotesByVenue[VENUE]).toBe(EXACT_NOTE)
  expect(resaved.privateNotesByVenue).toBe(current.privateNotesByVenue)
})

test("W3-MY-P0-002 orphan notes survive restore and fail-closed account reconciliation", () => {
  const restored = durableFixture([])
  expect(restored.savedVenueIds).toEqual([])
  expect(restored.privateNotesByVenue).toEqual({
    [VENUE]: EXACT_NOTE,
    [OTHER_VENUE]: "Another canonical note",
  })

  const reconciled = reconcileBAccountSaveHydration({
    device: restored,
    accountSession: { account: "ACC-ACTIVE", returnTo: null },
    persistedMarkerPresent: true,
  })
  expect(reconciled.blocked).toBe(true)
  expect(reconciled.accountSession).toEqual({ account: "ACC-GUEST", returnTo: null })
  const { accountSaveTransaction: restoredMarker, ...restoredDurableAxes } = restored
  const { accountSaveTransaction: reconciledMarker, ...reconciledDurableAxes } = reconciled.device
  expect(restoredMarker).toBeNull()
  expect(reconciledMarker).toBeNull()
  expect(reconciledDurableAxes).toEqual(restoredDurableAxes)
})

test("W3-MY-P0-003 ignored, mismatched and atomic-throw unsave writes roll back exactly", () => {
  const previous = durableFixture()
  const previousRaw = JSON.stringify(previous)
  const candidate = transitionCanonicalSavedVenueMembershipB({
    ...previous,
    saveStatusByVenue: { [VENUE]: "SAV-SAVED" as const },
  }, VENUE, false)

  for (const failure of ["ignored", "mismatch", "throw"] as const) {
    const storage = new DeviceStorage(previousRaw)
    storage.failure = failure
    expect(persistBDeviceStateToStorage(storage as unknown as Storage, candidate), failure).toBe(false)
    expect(storage.raw(), failure).toBe(previousRaw)
    const after = restoreBDeviceState(JSON.parse(storage.raw()!))
    expect(after.savedVenueIds, failure).toEqual([VENUE])
    expect(after.privateNotesByVenue[VENUE], failure).toBe(EXACT_NOTE)
  }
})

test("W3-MY-P0-004 a committed unsave persists the orphan note and every other durable axis", () => {
  const previous = durableFixture()
  const candidate = transitionCanonicalSavedVenueMembershipB({
    ...previous,
    saveStatusByVenue: { [VENUE]: "SAV-SAVED" as const },
  }, VENUE, false)
  const storage = new DeviceStorage(JSON.stringify(previous))

  expect(persistBDeviceStateToStorage(storage as unknown as Storage, candidate)).toBe(true)
  const persisted = restoreBDeviceState(JSON.parse(storage.raw()!))
  expect(persisted.savedVenueIds).toEqual([])
  expect(persisted.privateNotesByVenue).toEqual(previous.privateNotesByVenue)
  expect(persisted.recentVenueIds).toEqual(previous.recentVenueIds)
  expect(persisted.plannedTableRefs).toEqual(previous.plannedTableRefs)
  expect(persisted.localSignalPostedVenueIds).toEqual(previous.localSignalPostedVenueIds)
  expect(persisted.localPulseEvidenceByVenue).toEqual(previous.localPulseEvidenceByVenue)
  expect(persisted.commerceReceipts).toEqual([])
})

test("W3-MY-P0-005 removal focus selects the next surviving row, then the section heading", () => {
  expect(resolveSavedRemovalFocusIndex(0, 0)).toBeNull()
  expect(resolveSavedRemovalFocusIndex(0, 2)).toBe(0)
  expect(resolveSavedRemovalFocusIndex(1, 2)).toBe(1)
  expect(resolveSavedRemovalFocusIndex(2, 2)).toBe(1)
  expect(resolveSavedRemovalFocusIndex(-1, 2)).toBe(0)
})
