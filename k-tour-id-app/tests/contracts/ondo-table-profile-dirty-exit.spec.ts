import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const PROFILE_PATH = "features/ondo/identity-b/profile-reputation-b.tsx"
const TABLE_PATH = "features/ondo/connect/tables-entry-b.tsx"
const PRESENCE_PATH = "features/ondo/shared/ui/use-sheet-presence.ts"
const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

function between(value: string, start: string, end: string) {
  const from = value.indexOf(start)
  const to = value.indexOf(end, from + start.length)
  expect(from, `missing start marker: ${start}`).toBeGreaterThanOrEqual(0)
  expect(to, `missing end marker: ${end}`).toBeGreaterThan(from)
  return value.slice(from, to)
}

test("TABLE-PROFILE-EXIT-001 X, backdrop, and Escape share the same hosted-profile guard", () => {
  const table = source(TABLE_PATH)
  const close = between(table, "function closeTable()", "function beginJoin()")
  const escape = between(table, "function closeDetailOnEscape", "window.addEventListener")
  const detailKeys = between(table, "function handleDetailKeyDown", "const canRequestSeat")

  expect(table).toContain('className={styles.backdrop} tabIndex={-1} aria-hidden="true" disabled={safetyOpen || tableClosing} onClick={closeTable}')
  expect(table).toContain('onClick={closeTable} aria-label={t.close}')
  expect(escape).toContain("closeTable()")
  expect(detailKeys).toContain("closeTable()")
  expect(close).toMatch(/if \(profileGuard\) \{\s*profileGuard\.requestExit\(commitCloseTable\)\s*return\s*\}/)
  expect(close.indexOf("profileGuard.requestExit(commitCloseTable)")).toBeLessThan(close.indexOf("commitCloseTable()"))
})

test("TABLE-PROFILE-EXIT-002 pending saves cancel before a stable Keep-or-Discard decision", () => {
  const profile = source(PROFILE_PATH)
  const request = between(profile, "requestExit(continueExit)", "resumeAfterInterruptedExit()")
  const keep = between(profile, "function keepEditingAfterExitRequest", "function discardEditorChanges")
  const discard = between(profile, "function discardEditorChanges", "function exitEntry")

  expect(request.indexOf("if (confirmingDiscard)")).toBeLessThan(request.indexOf("if (pending) stopPendingSave()"))
  expect(request.indexOf("if (pending) stopPendingSave()")).toBeLessThan(request.indexOf("if (editing && dirty)"))
  expect(request).toContain("pendingHostExitRef.current ??= continueExit")
  expect(request).toContain("pendingHostExitRef.current = continueExit")
  expect(request).toContain("setConfirmingDiscard(true)")
  expect(keep).toContain("pendingHostExitRef.current = null")
  expect(keep).toContain("setConfirmingDiscard(false)")
  expect(discard).toContain("continueWithFrozenHostExit(continueHostExit)")
  expect(discard).toContain("pendingHostExitRef.current = continueHostExit")
})

test("TABLE-PROFILE-EXIT-003 the decision is the only operable modal and owns Escape", () => {
  const profile = source(PROFILE_PATH)
  const table = source(TABLE_PATH)
  const prompt = between(profile, "ref={discardPromptRef}", ") : (")
  const escape = between(table, "function closeDetailOnEscape", "window.addEventListener")
  const detailKeys = between(table, "function handleDetailKeyDown", "const canRequestSeat")

  expect(profile).toContain("useModalIsolation(confirmingDiscard, discardPromptRef)")
  expect(profile).toContain("useDocumentScrollLock(confirmingDiscard)")
  expect(prompt).toContain('role="alertdialog"')
  expect(prompt).toContain('aria-modal="true"')
  expect(prompt).toContain("data-modal-layer-priority={ONDO_MODAL_PRIORITY.finalCritical}")
  expect(prompt).toContain('event.key !== "Escape"')
  expect(prompt).toContain("event.preventDefault()")
  expect(prompt).toContain("event.stopPropagation()")
  expect(prompt).toContain("keepEditingAfterExitRequest()")
  for (const handler of [escape, detailKeys]) {
    expect(handler).toContain("[data-testid='profile-discard-prompt']")
    expect(handler).toContain("closest(\"[inert],[aria-hidden='true']\")")
  }
})

test("TABLE-PROFILE-EXIT-004 the exact last-painted profile and Table survive the full 260ms exit", () => {
  const profile = source(PROFILE_PATH)
  const table = source(TABLE_PATH)
  const presence = source(PRESENCE_PATH)
  const freeze = between(profile, "function continueWithFrozenHostExit", "useEffect(() => {")
  const painted = between(profile, "useLayoutEffect(() => {", "return hostExitVisualSnapshotRef.current")
  const retainedTable = between(table, "const liveTableSurface", "})()}")

  expect(freeze).toContain("hostExitVisualSnapshotRef.current = lastPaintedProfileRef.current ?? liveProfileSurface")
  expect(freeze.indexOf("hostExitVisualSnapshotRef.current = lastPaintedProfileRef.current ?? liveProfileSurface")).toBeLessThan(freeze.indexOf("continueExit()"))
  expect(freeze).toContain("if (!exited) hostExitVisualSnapshotRef.current = null")
  expect(painted).toContain("lastPaintedProfileRef.current = liveProfileSurface")
  expect(profile).toContain("return hostExitVisualSnapshotRef.current ?? liveProfileSurface")
  expect(retainedTable).toContain("tableExitVisualSnapshotRef.current = liveTableSurface")
  expect(retainedTable).toContain("tableExitVisualSnapshotRef.current ?? liveTableSurface")
  expect(presence).toContain("export const SHEET_EXIT_DURATION_MS = 260")
})

test("TABLE-PROFILE-EXIT-005 failed close stays live; clean close and interrupted rapid reopen are deterministic", () => {
  const profile = source(PROFILE_PATH)
  const table = source(TABLE_PATH)
  const request = between(profile, "requestExit(continueExit)", "resumeAfterInterruptedExit()")
  const resume = between(profile, "resumeAfterInterruptedExit() {", "registerHostExitGuard(guard)")
  const prepareOpen = between(table, "function prepareTableOpen", "function openTable")
  const commit = between(table, "function commitCloseTable", "function beginJoin")

  expect(request).toContain("return continueWithFrozenHostExit(continueExit)")
  expect(commit).toContain("return false")
  expect(commit.indexOf("return false")).toBeLessThan(commit.indexOf("setSelected(false)"))
  expect(commit).toContain("return true")
  expect(resume).toContain("hostExitVisualSnapshotRef.current = null")
  expect(resume).toContain("pendingHostExitRef.current = null")
  expect(resume).toContain("setDraft(draftFrom(state.profile))")
  expect(prepareOpen).toContain("!selectedRef.current && layerRef.current?.isConnected")
  expect(prepareOpen).toContain("resumeAfterInterruptedExit()")
  expect(prepareOpen.indexOf("resumeAfterInterruptedExit()")).toBeLessThan(prepareOpen.indexOf("if (layerRef.current?.isConnected) return"))
})

test("TABLE-PROFILE-EXIT-006 focus waits for removal, falls back visibly, and My Korea stays unguarded", () => {
  const profile = source(PROFILE_PATH)
  const table = source(TABLE_PATH)
  const focus = between(table, "if (tableSheetPresence.value !== null || !restoreFocusAfterExitRef.current) return", "useEffect(() => {")

  expect(focus).toContain("returnTarget?.isConnected && isRenderedFocusable(returnTarget)")
  expect(focus).toContain("returnTarget.focus({ preventScroll: true })")
  expect(focus).toContain("focusFirstAvailableDestination")
  expect(focus).toContain("if (selectedRef.current) return")
  expect(table).toContain('origin="table_host" registerHostExitGuard={registerProfileHostExitGuard}')
  expect(profile).toContain('data-testid={origin === "my_korea" ? "my-korea-profile-open" : "table-host-profile-open"}')
  expect(profile).not.toMatch(/origin === "my_korea"[\s\S]{0,180}registerHostExitGuard/)
})
