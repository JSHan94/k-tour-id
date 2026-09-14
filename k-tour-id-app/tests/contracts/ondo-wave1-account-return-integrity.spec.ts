import { expect, test } from "@playwright/test"
import {
  B_ACCOUNT_RETURN_TO_TTL_MS,
  consumeBAccountReturnTo,
  createBAccountSaveTransactionMarker,
  createBAccountReturnTo,
  createBEditorialAccountReturnTo,
  discardBAccountReturnTo,
  finalizeConsumedBAccountReturnTo,
  hashBAccountReturnTo,
  isBAccountReturnToStructurallyValid,
  isBAccountReturnToUsable,
  restoreBAccountSaveTransactionMarker,
  restoreConsumedBAccountReturnTo,
  type BAccountReturnToEnvelope,
  type BAccountSaveTransactionMarker,
} from "../../features/ondo/contracts/return-to-b"
import {
  B_DEVICE_KEY,
  B_ACCOUNT_SESSION_KEY,
  clearPendingBAccountReturn,
  commitBAccountSaveTransaction,
  persistBAccountSessionToStorage,
  persistBDeviceStateToStorage,
  persistPendingBAccountReturn,
  reconcileBAccountSaveHydration,
  restoreBAccountSession,
  restoreBDeviceState,
  restoreStoredBAccountSession,
  settleBAccountSaveHydration,
  type BAccountSessionState,
} from "../../features/ondo/shared/state/ondo-b-provider"

const BASE = Date.parse("2026-09-04T03:00:00.000Z")
const VENUE = "mois-0021cd596bc5b2a922ad"
const OTHER_VENUE = "mois-18939eecb43c15ab4305"

function at(offset: number) {
  return new Date(BASE + offset)
}

function forgedCanonical(now: Date): BAccountReturnToEnvelope {
  return {
    tokenId: `RT-B-SAVE_VENUE-${now.getTime()}`,
    action: "SAVE_VENUE",
    activeGate: "account",
    targetKind: "canonical",
    venueId: VENUE,
    returnLevel: "detail",
    draft: null,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + B_ACCOUNT_RETURN_TO_TTL_MS).toISOString(),
    consumedAt: null,
  }
}

class AccountStorage {
  private values = new Map<string, string>()
  failNextSet = false
  ignoreNextSet = false
  mismatchAfterNextSet = false
  private mismatchNextRead = false

  constructor(value?: string, key = B_ACCOUNT_SESSION_KEY) {
    if (value !== undefined) this.values.set(key, value)
  }

  getItem(key: string) {
    if (this.mismatchNextRead) {
      this.mismatchNextRead = false
      return `${this.values.get(key) ?? ""}#mismatch`
    }
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    if (this.ignoreNextSet) { this.ignoreNextSet = false; return }
    if (this.failNextSet) { this.failNextSet = false; throw new Error("spec-atomic failure") }
    this.values.set(key, value)
    if (this.mismatchAfterNextSet) {
      this.mismatchAfterNextSet = false
      this.mismatchNextRead = true
    }
  }

  removeItem(key: string) { this.values.delete(key) }
  raw(key = B_ACCOUNT_SESSION_KEY) { return this.values.get(key) ?? null }
}

function transactionState(savedVenueIds: string[] = []) {
  return {
    savedVenueIds,
    savedEditorialPlaceIds: [] as never[],
    accountSaveTransaction: null as BAccountSaveTransactionMarker | null,
  }
}

test("W1-ACCOUNT-RT-001 Account return envelopes use exact target-specific own keys", () => {
  expect(B_ACCOUNT_RETURN_TO_TTL_MS).toBe(15 * 60 * 1000)
  const canonical = createBAccountReturnTo(VENUE, at(0))
  const editorial = createBEditorialAccountReturnTo("jeju-donsadon", at(10))

  expect(Object.keys(canonical).sort()).toEqual([
    "action", "activeGate", "consumedAt", "createdAt", "draft", "expiresAt",
    "returnLevel", "targetKind", "tokenId", "venueId",
  ])
  expect(Object.keys(editorial).sort()).toEqual([
    "action", "activeGate", "consumedAt", "createdAt", "draft", "editorialPlaceId",
    "expiresAt", "returnLevel", "targetKind", "tokenId",
  ])
  expect(isBAccountReturnToStructurallyValid({ ...canonical, credential: "private" })).toBe(false)
  expect(isBAccountReturnToStructurallyValid({ ...canonical, editorialPlaceId: "jeju-donsadon" })).toBe(false)
  const symbolInjected = { ...canonical } as Record<PropertyKey, unknown>
  symbolInjected[Symbol("private")] = true
  expect(isBAccountReturnToStructurallyValid(symbolInjected)).toBe(false)

  const marker = createBAccountSaveTransactionMarker(canonical, false, "prepared")
  expect(Object.keys(marker).sort()).toEqual(["phase", "snapshotHash", "targetId", "targetKind", "targetWasSaved", "tokenId"])
  expect(restoreBAccountSaveTransactionMarker(marker)).toEqual(marker)
  expect(restoreBAccountSaveTransactionMarker({ ...marker, targetId: OTHER_VENUE })).toBeNull()
  expect(restoreBAccountSaveTransactionMarker({ ...marker, privateState: true })).toBeNull()
})

test("W1-ACCOUNT-RT-002 unstaged and same-token target-swapped envelopes cannot mutate", () => {
  const expected = createBAccountReturnTo(VENUE, at(100))
  const swapped = { ...expected, venueId: OTHER_VENUE }
  const unstaged = forgedCanonical(at(200))
  const extra = { ...expected, credential: "private" }
  let mutationCount = 0

  expect(isBAccountReturnToStructurallyValid(swapped)).toBe(true)
  expect(hashBAccountReturnTo(swapped)).not.toBe(hashBAccountReturnTo(expected))
  expect(isBAccountReturnToUsable(swapped, at(101))).toBe(false)
  expect(isBAccountReturnToStructurallyValid(unstaged)).toBe(true)
  expect(isBAccountReturnToUsable(unstaged, at(201))).toBe(false)
  expect(isBAccountReturnToStructurallyValid(extra)).toBe(false)
  for (const candidate of [swapped, unstaged, extra]) {
    if (consumeBAccountReturnTo(candidate, at(202))) mutationCount += 1
  }
  expect(mutationCount).toBe(0)
})

test("W1-ACCOUNT-RT-003 consume is one-shot, with exact rollback and finalize transitions", () => {
  const pending = createBAccountReturnTo(VENUE, at(300))
  const first = consumeBAccountReturnTo(pending, at(301))
  expect(first?.consumedAt).toBe(at(301).toISOString())
  expect(consumeBAccountReturnTo(pending, at(302))).toBeNull()

  expect(restoreConsumedBAccountReturnTo(first!, at(303))).toBe(true)
  const retried = consumeBAccountReturnTo(pending, at(304))
  expect(retried?.consumedAt).toBe(at(304).toISOString())
  expect(finalizeConsumedBAccountReturnTo(retried!)).toBe(true)
  expect(restoreConsumedBAccountReturnTo(retried!, at(305))).toBe(false)
  expect(consumeBAccountReturnTo(pending, at(306))).toBeNull()
})

test("W1-ACCOUNT-RT-004 future, expired and discarded returns stay mutation-free", () => {
  const future = createBAccountReturnTo(VENUE, at(400))
  const expired = createBAccountReturnTo(VENUE, at(500))
  const discarded = createBAccountReturnTo(VENUE, at(600))
  expect(isBAccountReturnToUsable(future, at(399))).toBe(false)
  expect(isBAccountReturnToUsable(expired, at(500 + B_ACCOUNT_RETURN_TO_TTL_MS))).toBe(false)
  expect(discardBAccountReturnTo(discarded)).toBe(true)

  let mutationCount = 0
  for (const [candidate, now] of [
    [future, at(399)],
    [expired, at(500 + B_ACCOUNT_RETURN_TO_TTL_MS)],
    [discarded, at(601)],
  ] as const) {
    if (consumeBAccountReturnTo(candidate, now)) mutationCount += 1
  }
  expect(mutationCount).toBe(0)
})

test("W1-ACCOUNT-RT-005 provider begin/cancel storage failures keep mutation and overlay truth aligned", () => {
  expect(restoreBAccountSession({ account: "ACC-CREATING", returnTo: null })).toEqual({ account: "ACC-GUEST", returnTo: null })
  const failedBegin = createBAccountReturnTo(VENUE, at(700))
  let failedBeginWrites = 0
  expect(persistPendingBAccountReturn({
    account: "ACC-GUEST",
    returnTo: failedBegin,
    persistAccount: () => { failedBeginWrites += 1; return false },
    now: at(701),
  })).toBe(false)
  expect(failedBeginWrites).toBe(1)
  expect(isBAccountReturnToUsable(failedBegin, at(701))).toBe(false)

  const pending = createBAccountReturnTo(VENUE, at(710))
  const sessions: BAccountSessionState[] = []
  expect(persistPendingBAccountReturn({
    account: "ACC-GUEST",
    returnTo: pending,
    persistAccount: (session) => { sessions.push(session); return true },
    now: at(711),
  })).toBe(true)
  expect(clearPendingBAccountReturn({
    account: "ACC-GUEST",
    returnTo: pending,
    persistAccount: () => false,
  })).toBe(false)
  expect(isBAccountReturnToUsable(pending, at(711))).toBe(true)
  expect(clearPendingBAccountReturn({
    account: "ACC-GUEST",
    returnTo: pending,
    persistAccount: (session) => { sessions.push(session); return true },
  })).toBe(true)
  expect(sessions.at(-1)).toEqual({ account: "ACC-GUEST", returnTo: null })
  expect(isBAccountReturnToUsable(pending, at(712))).toBe(false)
})

test("W1-ACCOUNT-RT-006 provider commit rejects forged contexts before every mutation callback", () => {
  const pending = createBAccountReturnTo(VENUE, at(800))
  const candidates: unknown[] = [
    { ...pending, venueId: OTHER_VENUE },
    { ...pending, credential: "private" },
    forgedCanonical(at(810)),
  ]

  for (const returnTo of candidates) {
    let mutationCount = 0
    const result = commitBAccountSaveTransaction({
      currentState: transactionState(),
      returnTo,
      rollbackSession: { account: "ACC-GUEST", returnTo: pending },
      buildNextState: () => { mutationCount += 1; return transactionState([OTHER_VENUE]) },
      persistDevice: () => { mutationCount += 1; return true },
      persistAccount: () => { mutationCount += 1; return true },
      now: at(801),
    })
    expect(result.outcome).toBe("account_failed")
    expect(mutationCount).toBe(0)
  }
})

test("W1-ACCOUNT-RT-007 provider commit rolls back durable save and restores the exact token on write failure", () => {
  const deviceFailureReturn = createBAccountReturnTo(VENUE, at(900))
  const current = transactionState()
  let storedDevice = current
  let accountWrites = 0
  const deviceFailure = commitBAccountSaveTransaction({
    currentState: current,
    returnTo: deviceFailureReturn,
    rollbackSession: { account: "ACC-GUEST", returnTo: deviceFailureReturn },
    buildNextState: (consumed) => transactionState([consumed.targetKind === "canonical" ? consumed.venueId : "unexpected"]),
    persistDevice: () => false,
    persistAccount: () => { accountWrites += 1; return true },
    now: at(901),
  })
  expect(deviceFailure.outcome).toBe("save_failed")
  expect(accountWrites).toBe(0)
  expect(storedDevice).toEqual(current)
  expect(isBAccountReturnToUsable(deviceFailureReturn, at(902))).toBe(true)

  const accountFailureReturn = createBAccountReturnTo(VENUE, at(910))
  storedDevice = current
  let deviceWrites = 0
  const accountFailure = commitBAccountSaveTransaction({
    currentState: current,
    returnTo: accountFailureReturn,
    rollbackSession: { account: "ACC-GUEST", returnTo: accountFailureReturn },
    buildNextState: (consumed) => transactionState([consumed.targetKind === "canonical" ? consumed.venueId : "unexpected"]),
    persistDevice: (next) => { deviceWrites += 1; storedDevice = next; return true },
    persistAccount: () => false,
    now: at(911),
  })
  expect(accountFailure.outcome).toBe("account_failed")
  expect(deviceWrites).toBe(2)
  expect(storedDevice).toEqual(current)
  expect(isBAccountReturnToUsable(accountFailureReturn, at(912))).toBe(true)
})

test("W1-ACCOUNT-RT-008 provider success persists both records then terminalizes the one-shot return", () => {
  const pending = createBAccountReturnTo(VENUE, at(1_000))
  const current = transactionState()
  const deviceWrites: Array<typeof current> = []
  const accountWrites: BAccountSessionState[] = []
  const result = commitBAccountSaveTransaction({
    currentState: current,
    returnTo: pending,
    rollbackSession: { account: "ACC-GUEST", returnTo: pending },
    buildNextState: (consumed) => transactionState([consumed.targetKind === "canonical" ? consumed.venueId : "unexpected"]),
    persistDevice: (next) => { deviceWrites.push(next); return true },
    persistAccount: (session) => { accountWrites.push(session); return true },
    now: at(1_001),
  })
  expect(result.outcome).toBe("saved")
  expect(deviceWrites).toHaveLength(2)
  expect(deviceWrites[0]).toMatchObject({ savedVenueIds: [], accountSaveTransaction: { phase: "prepared", targetId: VENUE } })
  expect(deviceWrites[1]).toMatchObject({ savedVenueIds: [VENUE], accountSaveTransaction: { phase: "terminal", targetId: VENUE } })
  expect(accountWrites).toEqual([{ account: "ACC-ACTIVE", returnTo: null }])
  expect(consumeBAccountReturnTo(pending, at(1_002))).toBeNull()
})

test("W1-ACCOUNT-RT-009 Account session writes require exact readback before cancel or success can publish", () => {
  const previous = JSON.stringify({ account: "ACC-GUEST", returnTo: forgedCanonical(at(1_100)) })
  for (const failure of ["ignored", "throw", "mismatch"] as const) {
    const storage = new AccountStorage(previous)
    if (failure === "ignored") storage.ignoreNextSet = true
    else if (failure === "throw") storage.failNextSet = true
    else storage.mismatchAfterNextSet = true
    expect(persistBAccountSessionToStorage(storage as unknown as Storage, { account: "ACC-GUEST", returnTo: null })).toBe(false)
    expect(storage.raw()).toBe(previous)
  }

  const storage = new AccountStorage(previous)
  expect(persistBAccountSessionToStorage(storage as unknown as Storage, { account: "ACC-GUEST", returnTo: null })).toBe(true)
  expect(storage.raw()).toBe(JSON.stringify({ account: "ACC-GUEST", returnTo: null }))
})

test("W1-ACCOUNT-RT-010 reload/private-context loss quarantines the stale public token", () => {
  const stale = JSON.stringify({ account: "ACC-GUEST", returnTo: forgedCanonical(at(1_200)) })
  const storage = new AccountStorage(stale)
  expect(restoreStoredBAccountSession(storage as unknown as Storage, stale, at(1_201))).toEqual({ account: "ACC-GUEST", returnTo: null })
  expect(storage.raw()).toBe(JSON.stringify({ account: "ACC-GUEST", returnTo: null }))

  const extra = JSON.stringify({ account: "ACC-ACTIVE", returnTo: null, credential: "must-not-persist" })
  const extraStorage = new AccountStorage(extra)
  expect(restoreStoredBAccountSession(extraStorage as unknown as Storage, extra, at(1_202))).toEqual({ account: "ACC-ACTIVE", returnTo: null })
  expect(extraStorage.raw()).toBe(JSON.stringify({ account: "ACC-ACTIVE", returnTo: null }))
  expect(extraStorage.raw()).not.toContain("credential")
})

test("W1-ACCOUNT-RT-011 a failed compensation leaves only a prepared marker and hydration hides the protected Save", () => {
  const pending = createBAccountReturnTo(VENUE, at(1_300))
  const current = transactionState()
  let durableDevice = current
  let durableAccount: BAccountSessionState = { account: "ACC-GUEST", returnTo: pending }
  let deviceWrites = 0
  let accountWrites = 0
  const failed = commitBAccountSaveTransaction({
    currentState: current,
    returnTo: pending,
    rollbackSession: durableAccount,
    buildNextState: () => transactionState([VENUE]),
    persistDevice: (next) => {
      deviceWrites += 1
      if (deviceWrites === 1) { durableDevice = next; return true }
      // Terminal Save and the later compensation both fail atomically.
      return false
    },
    persistAccount: (next) => {
      accountWrites += 1
      if (accountWrites === 1) { durableAccount = next; return true }
      // Account compensation also fails atomically.
      return false
    },
    now: at(1_301),
  })
  expect(failed.outcome).toBe("save_failed")
  expect(durableDevice).toMatchObject({ savedVenueIds: [], accountSaveTransaction: { phase: "prepared", targetId: VENUE, targetWasSaved: false } })
  expect(durableAccount).toEqual({ account: "ACC-ACTIVE", returnTo: null })
  expect(isBAccountReturnToUsable(pending, at(1_302))).toBe(true)

  const hydration = reconcileBAccountSaveHydration({
    device: restoreBDeviceState(durableDevice),
    accountSession: durableAccount,
    persistedMarkerPresent: true,
  })
  expect(hydration.blocked).toBe(true)
  expect(hydration.accountSession).toEqual({ account: "ACC-GUEST", returnTo: null })
  expect(hydration.device.savedVenueIds).toEqual([])
  expect(hydration.device.accountSaveTransaction).toBeNull()

  const retryWrites: typeof current[] = []
  const retried = commitBAccountSaveTransaction({
    currentState: current,
    returnTo: pending,
    rollbackSession: { account: "ACC-GUEST", returnTo: pending },
    buildNextState: () => transactionState([VENUE]),
    persistDevice: (next) => { retryWrites.push(next); return true },
    persistAccount: () => true,
    now: at(1_303),
  })
  expect(retried.outcome).toBe("saved")
  expect(retried.nextState).toMatchObject({ savedVenueIds: [VENUE], accountSaveTransaction: { phase: "terminal", targetId: VENUE } })
  const completedHydration = reconcileBAccountSaveHydration({
    device: restoreBDeviceState(retried.nextState),
    accountSession: { account: "ACC-ACTIVE", returnTo: null },
    persistedMarkerPresent: true,
  })
  expect(completedHydration.blocked).toBe(false)
  expect(completedHydration.accountSession.account).toBe("ACC-ACTIVE")
  expect(completedHydration.device.savedVenueIds).toEqual([VENUE])
})

test("W1-ACCOUNT-RT-012 prepared recovery preserves a target that was already saved", () => {
  const pending = createBAccountReturnTo(VENUE, at(1_400))
  const current = transactionState([VENUE])
  let durableDevice = current
  let writes = 0
  const failed = commitBAccountSaveTransaction({
    currentState: current,
    returnTo: pending,
    rollbackSession: { account: "ACC-GUEST", returnTo: pending },
    buildNextState: () => current,
    persistDevice: (next) => {
      writes += 1
      if (writes === 1) { durableDevice = next; return true }
      return false
    },
    persistAccount: () => false,
    now: at(1_401),
  })
  expect(failed.outcome).toBe("account_failed")
  expect(durableDevice).toMatchObject({ savedVenueIds: [VENUE], accountSaveTransaction: { phase: "prepared", targetWasSaved: true } })
  const hydration = reconcileBAccountSaveHydration({
    device: restoreBDeviceState(durableDevice),
    accountSession: { account: "ACC-GUEST", returnTo: null },
    persistedMarkerPresent: true,
  })
  expect(hydration.device.savedVenueIds).toEqual([VENUE])
  expect(hydration.accountSession.account).toBe("ACC-GUEST")
})

test("W1-ACCOUNT-RT-013 ignored, mismatched and atomic-throw device writes cannot prepare or publish a Save", () => {
  for (const [index, failure] of (["ignored", "mismatch", "throw"] as const).entries()) {
    const pending = createBAccountReturnTo(VENUE, at(1_500 + index * 10))
    const current = restoreBDeviceState(transactionState())
    const previous = JSON.stringify(current)
    const storage = new AccountStorage(previous, B_DEVICE_KEY)
    if (failure === "ignored") storage.ignoreNextSet = true
    else if (failure === "mismatch") storage.mismatchAfterNextSet = true
    else storage.failNextSet = true
    let accountWrites = 0

    const result = commitBAccountSaveTransaction({
      currentState: current,
      returnTo: pending,
      rollbackSession: { account: "ACC-GUEST", returnTo: pending },
      buildNextState: () => restoreBDeviceState(transactionState([VENUE])),
      persistDevice: (next) => persistBDeviceStateToStorage(storage as unknown as Storage, next),
      persistAccount: () => { accountWrites += 1; return true },
      now: at(1_501 + index * 10),
    })

    expect(result.outcome).toBe("save_failed")
    expect(accountWrites).toBe(0)
    expect(storage.raw(B_DEVICE_KEY)).toBe(previous)
    expect(restoreBDeviceState(JSON.parse(storage.raw(B_DEVICE_KEY)!)).savedVenueIds).toEqual([])
    expect(isBAccountReturnToUsable(pending, at(1_502 + index * 10))).toBe(true)
  }
})

test("W1-ACCOUNT-RT-014 forged or corrupt transaction markers never add or remove existing Saves", () => {
  const venueReturn = createBAccountReturnTo(VENUE, at(1_600))
  const otherReturn = createBAccountReturnTo(OTHER_VENUE, at(1_610))
  const preparedFalse = createBAccountSaveTransactionMarker(venueReturn, false, "prepared")
  const preparedTrue = createBAccountSaveTransactionMarker(venueReturn, true, "prepared")
  const targetSwap = createBAccountSaveTransactionMarker(otherReturn, false, "prepared")
  const terminalMissingTarget = createBAccountSaveTransactionMarker(venueReturn, false, "terminal")
  const { snapshotHash: _missingHash, ...missingField } = preparedFalse

  const cases = [
    { name: "prepared false contradicts an existing Save", savedVenueIds: [VENUE], marker: preparedFalse },
    { name: "prepared true contradicts an absent Save", savedVenueIds: [], marker: preparedTrue },
    { name: "extra marker field", savedVenueIds: [VENUE], marker: { ...preparedFalse, credential: "forged" } },
    { name: "missing marker field", savedVenueIds: [VENUE], marker: missingField },
    { name: "same-shape target swap", savedVenueIds: [VENUE], marker: targetSwap },
    { name: "terminal marker without its target", savedVenueIds: [], marker: terminalMissingTarget },
  ] as const

  for (const candidate of cases) {
    const restored = restoreBDeviceState({
      savedVenueIds: [...candidate.savedVenueIds],
      savedEditorialPlaceIds: [],
      accountSaveTransaction: candidate.marker,
    })
    expect(restored.savedVenueIds, candidate.name).toEqual([...candidate.savedVenueIds])
    const reconciled = reconcileBAccountSaveHydration({
      device: restored,
      accountSession: { account: "ACC-ACTIVE", returnTo: null },
      persistedMarkerPresent: true,
    })
    expect(reconciled.blocked, candidate.name).toBe(true)
    expect(reconciled.accountSession.account, candidate.name).toBe("ACC-GUEST")
    expect(reconciled.device.savedVenueIds, candidate.name).toEqual([...candidate.savedVenueIds])
    expect(reconciled.device.accountSaveTransaction, candidate.name).toBeNull()
  }

  const terminal = createBAccountSaveTransactionMarker(venueReturn, false, "terminal")
  const completed = reconcileBAccountSaveHydration({
    device: restoreBDeviceState({ savedVenueIds: [VENUE], savedEditorialPlaceIds: [], accountSaveTransaction: terminal }),
    accountSession: { account: "ACC-ACTIVE", returnTo: null },
    persistedMarkerPresent: true,
  })
  expect(completed.blocked).toBe(false)
  expect(completed.accountSession.account).toBe("ACC-ACTIVE")
  expect(completed.device.savedVenueIds).toEqual([VENUE])
})

test("W1-ACCOUNT-RT-015 Guest session readback precedes marker cleanup across reloads", () => {
  const pending = createBAccountReturnTo(VENUE, at(1_700))
  const prepared = createBAccountSaveTransactionMarker(pending, false, "prepared")
  const deviceStorage = new AccountStorage(JSON.stringify({
    savedVenueIds: [],
    savedEditorialPlaceIds: [],
    accountSaveTransaction: prepared,
  }), B_DEVICE_KEY)
  const accountStorage = new AccountStorage(JSON.stringify({ account: "ACC-ACTIVE", returnTo: null }))

  const firstRawDevice = JSON.parse(deviceStorage.raw(B_DEVICE_KEY)!) as Record<string, unknown>
  const firstRestored = restoreBDeviceState(firstRawDevice)
  const firstReconciliation = reconcileBAccountSaveHydration({
    device: firstRestored,
    accountSession: restoreStoredBAccountSession(accountStorage as unknown as Storage, accountStorage.raw()!, at(1_701)),
    persistedMarkerPresent: true,
  })
  accountStorage.ignoreNextSet = true
  const firstSettled = settleBAccountSaveHydration({
    restoredDevice: firstRestored,
    reconciliation: firstReconciliation,
    persistGuest: (session) => persistBAccountSessionToStorage(accountStorage as unknown as Storage, session),
  })
  expect(firstSettled.devicePersistenceBlocked).toBe(true)
  expect(firstSettled.accountSession.account).toBe("ACC-GUEST")
  expect(firstSettled.device.accountSaveTransaction).toEqual(prepared)
  expect(accountStorage.raw()).toBe(JSON.stringify({ account: "ACC-ACTIVE", returnTo: null }))
  expect(deviceStorage.raw(B_DEVICE_KEY)).toContain(prepared.tokenId)

  // A later device write may be available, but the mounted state must refuse
  // to clear the marker while the Guest session is still uncommitted.
  const mountedState = { ...restoreBDeviceState(firstSettled.device), accountSaveRecoveryBlocked: true }
  expect(mountedState.accountSaveTransaction).toEqual(prepared)

  const secondRawDevice = JSON.parse(deviceStorage.raw(B_DEVICE_KEY)!) as Record<string, unknown>
  const secondRestored = restoreBDeviceState(secondRawDevice)
  const secondReconciliation = reconcileBAccountSaveHydration({
    device: secondRestored,
    accountSession: restoreStoredBAccountSession(accountStorage as unknown as Storage, accountStorage.raw()!, at(1_702)),
    persistedMarkerPresent: true,
  })
  const secondSettled = settleBAccountSaveHydration({
    restoredDevice: secondRestored,
    reconciliation: secondReconciliation,
    persistGuest: (session) => persistBAccountSessionToStorage(accountStorage as unknown as Storage, session),
  })
  expect(secondSettled.devicePersistenceBlocked).toBe(false)
  expect(secondSettled.device.accountSaveTransaction).toBeNull()
  expect(persistBDeviceStateToStorage(deviceStorage as unknown as Storage, secondSettled.device)).toBe(true)
  expect(accountStorage.raw()).toBe(JSON.stringify({ account: "ACC-GUEST", returnTo: null }))
  expect(restoreBDeviceState(JSON.parse(deviceStorage.raw(B_DEVICE_KEY)!)).accountSaveTransaction).toBeNull()
})
