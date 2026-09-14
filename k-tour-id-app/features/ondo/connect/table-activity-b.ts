export const B_TABLE_ACTIVITY_SESSION_KEY = "ondo-b.table-activity.v1"
export const B_TABLE_ACTIVITY_CLEAR_EVENT = "ondo:b:table-activity-clear"

export type BTableActivityStage = "checked_in" | "completed"
export type BTableFeedback = "helpful" | "welcoming"
export type BTableReportReason = "no_show" | "behavior" | "other"
export type BTableReportReceipt = {
  reason: BTableReportReason
  participantBlocked: boolean
}

type BTableActivityEnvelope = {
  version: 1
  byTableId: Record<string, BTableActivityStage>
  feedbackByTableId: Record<string, BTableFeedback>
  reportsByTableId: Record<string, BTableReportReceipt>
}

const EMPTY_TABLE_ACTIVITY: BTableActivityEnvelope = { version: 1, byTableId: {}, feedbackByTableId: {}, reportsByTableId: {} }
const TABLE_ID = /^[a-z0-9][a-z0-9-]{0,79}$/i
const TABLE_FEEDBACK = new Set<BTableFeedback>(["helpful", "welcoming"])
const REPORT_REASONS = new Set<BTableReportReason>(["no_show", "behavior", "other"])

type BTableActivityStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">

function publishBTableActivityStorage(storage: BTableActivityStorage, nextRaw: string | null) {
  let previousRaw: string | null = null
  let previousCaptured = false
  try {
    previousRaw = storage.getItem(B_TABLE_ACTIVITY_SESSION_KEY)
    previousCaptured = true
    if (nextRaw == null) storage.removeItem(B_TABLE_ACTIVITY_SESSION_KEY)
    else storage.setItem(B_TABLE_ACTIVITY_SESSION_KEY, nextRaw)
    if (storage.getItem(B_TABLE_ACTIVITY_SESSION_KEY) === nextRaw) return true
  } catch {
    // The exact prior bytes are restored below. Callers never publish success.
  }
  // If even the initial read failed, no write was attempted and no exact
  // rollback value exists. Do not guess that the previous value was null.
  if (!previousCaptured) return false
  try {
    if (previousRaw == null) storage.removeItem(B_TABLE_ACTIVITY_SESSION_KEY)
    else storage.setItem(B_TABLE_ACTIVITY_SESSION_KEY, previousRaw)
    storage.getItem(B_TABLE_ACTIVITY_SESSION_KEY)
  } catch {
    // A failed rollback is still a failed operation and cannot update UI state.
  }
  return false
}

/** Exact byte restoration used by the cross-key Leave transaction. */
export function restoreBTableActivitySnapshot(storage: BTableActivityStorage, raw: string | null) {
  return publishBTableActivityStorage(storage, raw)
}

export function restoreBTableActivity(value: unknown): BTableActivityEnvelope {
  if (!value || typeof value !== "object" || Array.isArray(value)) return EMPTY_TABLE_ACTIVITY
  const record = value as Record<string, unknown>
  if (record.version !== 1 || !record.byTableId || typeof record.byTableId !== "object" || Array.isArray(record.byTableId)) return EMPTY_TABLE_ACTIVITY
  const byTableId = Object.fromEntries(Object.entries(record.byTableId as Record<string, unknown>)
    .filter(([tableId, stage]) => TABLE_ID.test(tableId) && (stage === "checked_in" || stage === "completed"))
    .slice(-12)) as Record<string, BTableActivityStage>
  const rawFeedback = record.feedbackByTableId && typeof record.feedbackByTableId === "object" && !Array.isArray(record.feedbackByTableId)
    ? record.feedbackByTableId as Record<string, unknown>
    : {}
  const feedbackByTableId = Object.fromEntries(Object.entries(rawFeedback)
    .filter(([tableId, feedback]) => TABLE_ID.test(tableId) && TABLE_FEEDBACK.has(feedback as BTableFeedback))
    .slice(-12)) as Record<string, BTableFeedback>
  const rawReports = record.reportsByTableId && typeof record.reportsByTableId === "object" && !Array.isArray(record.reportsByTableId)
    ? record.reportsByTableId as Record<string, unknown>
    : {}
  const reportsByTableId = Object.fromEntries(Object.entries(rawReports)
    .filter(([tableId, receipt]) => {
      if (!TABLE_ID.test(tableId) || !receipt || typeof receipt !== "object" || Array.isArray(receipt)) return false
      const candidate = receipt as Record<string, unknown>
      return REPORT_REASONS.has(candidate.reason as BTableReportReason) && typeof candidate.participantBlocked === "boolean"
    })
    .slice(-12)
    .map(([tableId, receipt]) => {
      const candidate = receipt as Record<string, unknown>
      return [tableId, { reason: candidate.reason, participantBlocked: candidate.participantBlocked }]
    })) as Record<string, BTableReportReceipt>
  return { version: 1, byTableId, feedbackByTableId, reportsByTableId }
}

export function readBTableActivity(storage: Storage, tableId: string): BTableActivityStage | null {
  try {
    return restoreBTableActivity(JSON.parse(storage.getItem(B_TABLE_ACTIVITY_SESSION_KEY) ?? "null")).byTableId[tableId] ?? null
  } catch {
    return null
  }
}

export function writeBTableActivity(storage: Storage, tableId: string, stage: BTableActivityStage): boolean {
  if (!TABLE_ID.test(tableId)) return false
  try {
    const current = restoreBTableActivity(JSON.parse(storage.getItem(B_TABLE_ACTIVITY_SESSION_KEY) ?? "null"))
    const currentStage = current.byTableId[tableId]
    const nextStage = currentStage === "completed" ? currentStage : stage
    const entries = Object.entries({ ...current.byTableId, [tableId]: nextStage }).slice(-12)
    return publishBTableActivityStorage(storage, JSON.stringify({ version: 1, byTableId: Object.fromEntries(entries), feedbackByTableId: current.feedbackByTableId, reportsByTableId: current.reportsByTableId }))
  } catch {
    return false
  }
}

export function readBTableReport(storage: Storage, tableId: string): BTableReportReceipt | null {
  try {
    return restoreBTableActivity(JSON.parse(storage.getItem(B_TABLE_ACTIVITY_SESSION_KEY) ?? "null")).reportsByTableId[tableId] ?? null
  } catch {
    return null
  }
}

export function readBTableFeedback(storage: Storage, tableId: string): BTableFeedback | null {
  try {
    return restoreBTableActivity(JSON.parse(storage.getItem(B_TABLE_ACTIVITY_SESSION_KEY) ?? "null")).feedbackByTableId[tableId] ?? null
  } catch {
    return null
  }
}

export function writeBTableFeedback(storage: Storage, tableId: string, feedback: BTableFeedback): boolean {
  if (!TABLE_ID.test(tableId) || !TABLE_FEEDBACK.has(feedback)) return false
  try {
    const current = restoreBTableActivity(JSON.parse(storage.getItem(B_TABLE_ACTIVITY_SESSION_KEY) ?? "null"))
    const entries = Object.entries({ ...current.feedbackByTableId, [tableId]: feedback }).slice(-12)
    return publishBTableActivityStorage(storage, JSON.stringify({ version: 1, byTableId: current.byTableId, feedbackByTableId: Object.fromEntries(entries), reportsByTableId: current.reportsByTableId }))
  } catch {
    return false
  }
}

export function writeBTableReport(storage: Storage, tableId: string, receipt: BTableReportReceipt): boolean {
  if (!TABLE_ID.test(tableId) || !REPORT_REASONS.has(receipt.reason) || typeof receipt.participantBlocked !== "boolean") return false
  try {
    const current = restoreBTableActivity(JSON.parse(storage.getItem(B_TABLE_ACTIVITY_SESSION_KEY) ?? "null"))
    const entries = Object.entries({ ...current.reportsByTableId, [tableId]: receipt }).slice(-12)
    return publishBTableActivityStorage(storage, JSON.stringify({ version: 1, byTableId: current.byTableId, feedbackByTableId: current.feedbackByTableId, reportsByTableId: Object.fromEntries(entries) }))
  } catch {
    return false
  }
}

export function clearBTableActivity(storage: Storage, tableId: string): boolean {
  if (!TABLE_ID.test(tableId)) return false
  try {
    const current = restoreBTableActivity(JSON.parse(storage.getItem(B_TABLE_ACTIVITY_SESSION_KEY) ?? "null"))
    const byTableId = { ...current.byTableId }
    const feedbackByTableId = { ...current.feedbackByTableId }
    const reportsByTableId = { ...current.reportsByTableId }
    delete byTableId[tableId]
    delete feedbackByTableId[tableId]
    delete reportsByTableId[tableId]
    return publishBTableActivityStorage(storage, JSON.stringify({ version: 1, byTableId, feedbackByTableId, reportsByTableId }))
  } catch {
    return false
  }
}
