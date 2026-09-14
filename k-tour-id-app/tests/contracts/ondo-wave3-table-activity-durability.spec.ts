import { expect, test } from "@playwright/test"
import {
  B_TABLE_ACTIVITY_SESSION_KEY,
  clearBTableActivity,
  readBTableActivity,
  readBTableFeedback,
  readBTableReport,
  restoreBTableActivitySnapshot,
  writeBTableActivity,
  writeBTableFeedback,
  writeBTableReport,
} from "../../features/ondo/connect/table-activity-b"

type SetBehavior = "normal" | "ignore-once" | "mismatch-once" | "mutate-then-throw-once"

class ScriptedStorage {
  raw: string | null
  setBehavior: SetBehavior = "normal"
  ignoreRemoveOnce = false
  throwInitialRead = false
  private reads = 0

  constructor(raw: string | null = null) { this.raw = raw }

  getItem() {
    this.reads += 1
    if (this.throwInitialRead && this.reads === 1) throw new Error("read blocked")
    return this.raw
  }

  setItem(_key: string, value: string) {
    const behavior = this.setBehavior
    this.setBehavior = "normal"
    if (behavior === "ignore-once") return
    if (behavior === "mismatch-once") { this.raw = `${value}:mismatch`; return }
    if (behavior === "mutate-then-throw-once") { this.raw = value; throw new Error("write interrupted") }
    this.raw = value
  }

  removeItem() {
    if (this.ignoreRemoveOnce) { this.ignoreRemoveOnce = false; return }
    this.raw = null
  }
}

const asStorage = (storage: ScriptedStorage) => storage as unknown as Storage

test("FL003 activity, feedback, and report publish only after exact readback", () => {
  const storage = new ScriptedStorage()
  expect(writeBTableActivity(asStorage(storage), "table-a", "checked_in")).toBe(true)
  expect(readBTableActivity(asStorage(storage), "table-a")).toBe("checked_in")
  expect(writeBTableFeedback(asStorage(storage), "table-a", "helpful")).toBe(true)
  expect(readBTableFeedback(asStorage(storage), "table-a")).toBe("helpful")
  expect(writeBTableReport(asStorage(storage), "table-a", { reason: "behavior", participantBlocked: true })).toBe(true)
  expect(readBTableReport(asStorage(storage), "table-a")).toEqual({ reason: "behavior", participantBlocked: true })
  expect(clearBTableActivity(asStorage(storage), "table-a")).toBe(true)
  expect(readBTableActivity(asStorage(storage), "table-a")).toBeNull()
  expect(readBTableFeedback(asStorage(storage), "table-a")).toBeNull()
  expect(readBTableReport(asStorage(storage), "table-a")).toBeNull()
})

test("FL003 activity, feedback, and report failures restore the exact previous bytes", () => {
  const previous = JSON.stringify({ version: 1, byTableId: { "table-a": "checked_in" }, feedbackByTableId: {}, reportsByTableId: {} })
  const writers = [
    (storage: Storage) => writeBTableActivity(storage, "table-a", "completed"),
    (storage: Storage) => writeBTableFeedback(storage, "table-a", "welcoming"),
    (storage: Storage) => writeBTableReport(storage, "table-a", { reason: "other", participantBlocked: false }),
  ]
  for (const write of writers) {
    for (const behavior of ["ignore-once", "mismatch-once", "mutate-then-throw-once"] as const) {
      const storage = new ScriptedStorage(previous)
      storage.setBehavior = behavior
      expect(write(asStorage(storage))).toBe(false)
      expect(storage.raw).toBe(previous)
    }
  }
})

test("FL003 snapshot removal and unreadable storage fail closed without inventing null", () => {
  const previous = JSON.stringify({ version: 1, byTableId: {}, feedbackByTableId: {}, reportsByTableId: {} })
  const ignoredRemove = new ScriptedStorage(previous)
  ignoredRemove.ignoreRemoveOnce = true
  expect(restoreBTableActivitySnapshot(asStorage(ignoredRemove), null)).toBe(false)
  expect(ignoredRemove.raw).toBe(previous)

  const unreadable = new ScriptedStorage(previous)
  unreadable.throwInitialRead = true
  expect(writeBTableFeedback(asStorage(unreadable), "table-a", "helpful")).toBe(false)
  expect(unreadable.raw).toBe(previous)
})
