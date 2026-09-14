import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

test("TABLE-EXIT-001 outer detail retains its exact subject for the shared 260ms presence lifecycle", () => {
  const table = source("features/ondo/connect/tables-entry-b.tsx")
  const presence = source("features/ondo/shared/ui/use-sheet-presence.ts")
  const css = source("features/ondo/connect/pulse-table-b.module.css")

  expect(table).toContain('useSheetPresence(selected ? `${activeTable.id}:${activeVenueId}` : null)')
  expect(table).toContain("data-table-subject={tableSheetPresence.value}")
  expect(table).toContain("data-table-presence={tableSheetPresence.phase}")
  expect(presence).toContain("export const SHEET_EXIT_DURATION_MS = 260")
  expect(css).toContain('.layer[data-table-presence="closing"] .detail')
  expect(css).toContain("animation: tableSheetExit 260ms")
  expect(css).toContain("animation-name: tableSheetExitRight")
})

test("TABLE-EXIT-002 closing keeps modal and scroll ownership while consuming repeated input", () => {
  const table = source("features/ondo/connect/tables-entry-b.tsx")

  expect(table).toContain("useModalIsolation(tableSheetPresence.value !== null, layerRef)")
  expect(table).toContain("useDocumentScrollLock(tableSheetPresence.value !== null)")
  expect(table).toContain("if (tableClosing) return")
  expect(table).toContain("event.stopImmediatePropagation()")
  expect(table).toContain("onClickCapture=")
  expect(table).toContain("onPointerDownCapture=")
  expect(table).toContain("onKeyDownCapture=")
  expect(table).toContain("disabled={safetyOpen || tableClosing}")
})

test("TABLE-EXIT-003 pending abandonment stays immediate and fail-closed before presentation exit", () => {
  const table = source("features/ondo/connect/tables-entry-b.tsx")
  // The new post-close place/reservation navigation also precedes beginJoin;
  // inspect the close transaction itself, not unrelated next-frame routing.
  const close = table.slice(table.indexOf("function closeTable()"), table.indexOf("function continueFromTable("))

  expect(close.indexOf("abandonPendingBAction")).toBeLessThan(close.indexOf("setSelected(false)"))
  expect(close).toContain("if (!abandoned)")
  expect(close).toContain("return")
  expect(close.indexOf("restoreFocusAfterExitRef.current = true")).toBeLessThan(close.indexOf("setSelected(false)"))
  expect(close).not.toContain("requestAnimationFrame")

  const continuation = table.slice(table.indexOf("function continueFromTable("), table.indexOf("function returnToTablePlace()"))
  expect(continuation).toContain("if (!commitCloseTable()) return false")
  expect(continuation.indexOf("if (!commitCloseTable()) return false")).toBeLessThan(continuation.indexOf("window.requestAnimationFrame(nextAction)"))
  expect(continuation).toContain("profileGuard.requestExit(exit)")
})

test("TABLE-EXIT-004 exact opener focus waits for retained DOM removal and rapid reopen cancels it", () => {
  const table = source("features/ondo/connect/tables-entry-b.tsx")

  expect(table).toContain("returnFocusRef.current = active instanceof HTMLElement")
  expect(table).toContain("restoreFocusAfterExitRef.current = false")
  expect(table).toContain("if (tableSheetPresence.value !== null || !restoreFocusAfterExitRef.current) return")
  expect(table).toContain("returnTarget?.isConnected && isRenderedFocusable(returnTarget)")
  expect(table).toContain("returnTarget.focus({ preventScroll: true })")
  expect(table).toContain("if (selectedRef.current) return")
  expect(table).toContain("focusFirstAvailableDestination")
})
