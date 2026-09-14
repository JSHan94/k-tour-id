import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const table = readFileSync(resolve(process.cwd(), "features/ondo/connect/tables-entry-b.tsx"), "utf8")

function between(start: string, end: string) {
  return table.slice(table.indexOf(start), table.indexOf(end, table.indexOf(start)))
}

test("TABLE-EPHEMERAL-001 every fresh Table boundary resets private UI state and restores only target-keyed durable facts", () => {
  const reset = between("function resetTableEphemeralState", "function openTable")
  const placeOpen = between("function openFromPlace", "window.addEventListener(ONDO_OPEN_TABLE_EVENT")
  const cardOpen = between("function openTable", "function closeTable")
  const close = between("function commitCloseTable", "function beginJoin")
  const leave = between("function confirmLeave", "function restoreSafetyFocus")

  expect(reset).toContain("invalidateTableAsyncWork()")
  expect(reset).toContain("releaseTableObjectUrls()")
  expect(reset).toContain("readBTableReport(window.sessionStorage, nextTable.id)")
  expect(reset).toContain("readBTableFeedback(window.sessionStorage, nextTable.id)")
  for (const resetCall of [
    "setDraft(nextDraft)",
    "setReturnTo(null)",
    'setTableView("detail")',
    "setJoinRequestPending(false)",
    'setCompose("")',
    "setChatImage(null)",
    "setMessages([])",
    "setReportOpen(false)",
    "setReportReason(null)",
    "setReportBlock(false)",
    "setReportReceipt(storedReport)",
    "setBlocked(storedReport?.participantBlocked ?? false)",
    "setFeedback(storedFeedback)",
    "setFeedbackSaved(Boolean(storedFeedback))",
  ]) expect(reset).toContain(resetCall)

  expect(placeOpen).toContain("resetTableEphemeralState(requestedTable, nextDraft)")
  expect(cardOpen).toContain("resetTableEphemeralState(table)")
  expect(close).toContain("resetTableEphemeralState(null)")
  expect(leave).toContain("resetTableEphemeralState(null)")
})

test("TABLE-EPHEMERAL-002 close and table switches invalidate every pending callback before it can mutate another Table", () => {
  const invalidate = between("function invalidateTableAsyncWork", "function releaseTableObjectUrls")
  const join = between("function confirmJoin", "function saveFeedback")
  const arrival = between("function markArrival", "function retryActivity")
  const message = between("function settleMessage", "function sendMessage")

  expect(table).toContain("const tableInteractionEpochRef = useRef(0)")
  expect(invalidate).toContain("tableInteractionEpochRef.current += 1")
  expect(invalidate).toContain("window.clearTimeout(joinTimerRef.current)")
  expect(invalidate).toContain("clearMessageTimers()")
  expect(invalidate).toContain("clearActivityTimers()")

  expect(join).toContain("joinTimerRef.current !== joinTimer")
  expect(join).toContain("operationEpoch !== tableInteractionEpochRef.current")
  expect(join).toContain("activeTableRef.current.id !== pending.tableId")
  expect(arrival).toContain("arrivalTimerRef.current !== arrivalTimer")
  expect(arrival).toContain("completionTimerRef.current !== completionTimer")
  expect(arrival).toContain("activeTableRef.current.id !== targetTable.id")
  expect(message).toContain("messageTimersRef.current.get(id) !== timer")
  expect(message).toContain("activeTableRef.current.id !== tableId")
})
