import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
  abandonPendingBAction,
  B_ACTION_GATE_SESSION_KEY,
  createBTableActionReturn,
  persistBActionGateSession,
  restoreBActionGateSession,
  type BTableActionReturn,
} from "../../features/ondo/identity-b/action-gate-contract-b"
import { ACTIVE_TABLE_ID, TABLE_VENUE_ID } from "../../features/ondo/connect/table-policy-b"

const TABLE_PATH = "features/ondo/connect/tables-entry-b.tsx"
const ACTION_PATH = "features/ondo/identity-b/action-gate-contract-b.ts"
const CSS_PATH = "features/ondo/connect/pulse-table-b.module.css"
const PROFILE_PATH = "features/ondo/identity-b/profile-reputation-b.tsx"
const PRESENCE_PATH = "features/ondo/shared/ui/use-sheet-presence.ts"
const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")
const NOW = new Date("2026-08-28T03:00:00.000Z")

class MemoryStorage {
  private readonly values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
}

function persistTablePending(storage: MemoryStorage, pending: BTableActionReturn) {
  return persistBActionGateSession(storage as unknown as Storage, {
    version: 1,
    person: { status: "unverified", expiresAt: null },
    payment: { status: "unverified", expiresAt: null },
    pending,
    personRoute: null,
    presentation: null,
    lastConsumed: null,
    outcome: null,
  }, NOW)
}

test("TABLE-EXIT-HARDEN-001 same token, Table, and venue cannot abandon a divergent full envelope", () => {
  const storage = new MemoryStorage()
  const pending = createBTableActionReturn({ tableId: ACTIVE_TABLE_ID, venueId: TABLE_VENUE_ID, draft: "window seat", now: NOW })
  expect(persistTablePending(storage, pending)).toBe(true)
  const durableBefore = storage.getItem(B_ACTION_GATE_SESSION_KEY)

  const divergent = { ...pending, consumedAt: new Date(NOW.getTime() + 1).toISOString() }
  expect(divergent).toMatchObject({ tokenId: pending.tokenId, tableId: pending.tableId, venueId: pending.venueId })
  expect(abandonPendingBAction(storage as unknown as Storage, divergent, new Date(NOW.getTime() + 2))).toBe(false)
  expect(storage.getItem(B_ACTION_GATE_SESSION_KEY)).toBe(durableBefore)
  expect(restoreBActionGateSession(storage as unknown as Storage, NOW).pending).toEqual(pending)
  expect(abandonPendingBAction(storage as unknown as Storage, pending, new Date(NOW.getTime() + 2))).toBe(true)
  expect(restoreBActionGateSession(storage as unknown as Storage, NOW).pending).toBeNull()

  const abandon = source(ACTION_PATH).slice(
    source(ACTION_PATH).indexOf("export function abandonPendingBAction"),
    source(ACTION_PATH).indexOf("/** Called only after", source(ACTION_PATH).indexOf("export function abandonPendingBAction")),
  )
  expect(abandon).toContain('expected: BActionReturnTo')
  expect(abandon).toContain("!sameBActionReturn(latest.pending, expected)")
})

test("TABLE-EXIT-HARDEN-002 confirmation authority and the complete painted surface stay immutable through exit", () => {
  const table = source(TABLE_PATH)
  const gateReady = table.slice(table.indexOf("function gateComplete"), table.indexOf("function gateCancel"))
  const retainedSurface = table.slice(table.indexOf("const liveTableSurface"), table.indexOf("})()}", table.indexOf("const liveTableSurface")))

  expect(table).toContain("function freezeTableActionReturn(value: BTableActionReturn)")
  expect(table).toContain("Object.freeze({ ...value, gatePlan: Object.freeze([...value.gatePlan]) })")
  expect(gateReady).toContain("const frozenDetail = freezeTableActionReturn(detail)")
  expect(gateReady).toContain("setReturnTo(frozenDetail)")
  expect(table).toContain("const tableExitVisualSnapshotRef = useRef<ReactNode>(null)")
  expect(retainedSurface).toContain("const liveTableSurface = <article")
  expect(retainedSurface).toContain("if (selected) tableExitVisualSnapshotRef.current = liveTableSurface")
  expect(retainedSurface).toContain("return selected ? liveTableSurface : tableExitVisualSnapshotRef.current ?? liveTableSurface")
  expect(retainedSurface).toContain('data-testid="table-join-confirmation"')
  expect(retainedSurface).toContain('data-testid="table-chat"')
  expect(retainedSurface).toContain('data-testid="table-join-save-error"')
})

test("TABLE-EXIT-HARDEN-003 focus returns only after removal to an operable exact opener or deterministic Tables fallback", () => {
  const table = source(TABLE_PATH)
  const focusExit = table.slice(
    table.indexOf("if (tableSheetPresence.value !== null || !restoreFocusAfterExitRef.current) return"),
    table.indexOf("useEffect(() => {", table.indexOf("if (tableSheetPresence.value !== null || !restoreFocusAfterExitRef.current) return") + 1),
  )

  expect(focusExit).toContain("if (selectedRef.current) return")
  expect(focusExit).toContain("returnTarget?.isConnected && isRenderedFocusable(returnTarget)")
  expect(focusExit).toContain("returnTarget.focus({ preventScroll: true })")
  expect(focusExit).toContain("focusFirstAvailableDestination")
  expect(focusExit).toContain("`[data-testid='table-open-${activeTable.id}']`")
  expect(focusExit).toContain('"[data-testid=\'tables-entry\']"')
  expect(focusExit).toContain("tableExitVisualSnapshotRef.current = null")
})

test("TABLE-EXIT-HARDEN-004 the safety decision is the sole modal owner and yields Escape to a higher layer", () => {
  const table = source(TABLE_PATH)
  const safetyEscape = table.slice(table.indexOf("function ownSafetyEscape"), table.indexOf("window.addEventListener", table.indexOf("function ownSafetyEscape")))
  const panel = table.slice(table.indexOf("function ConfirmPanel"))

  expect(panel).toContain("useModalIsolation(true, panelRef)")
  expect(panel).toContain('role="alertdialog" aria-modal="true"')
  expect(panel).toContain('data-testid="table-safety-decision"')
  expect(panel).toContain("data-modal-layer-priority={ONDO_MODAL_PRIORITY.fullTask}")
  expect(panel).not.toContain("data-modal-layer-priority={ONDO_MODAL_PRIORITY.critical}")
  expect(panel).toContain("panelRef.current?.closest(\"[inert],[aria-hidden='true']\")")
  expect(table).not.toContain("inert={safetyOpen}")
  expect(safetyEscape).toContain("activeDecision.closest(\"[inert],[aria-hidden='true']\")")
  expect(safetyEscape).toContain("event.stopImmediatePropagation()")
})

test("TABLE-EXIT-HARDEN-005 closing consumes pointer, click, key, and Escape while reduced motion removes immediately", () => {
  const table = source(TABLE_PATH)
  const presence = source(PRESENCE_PATH)
  const css = source(CSS_PATH)
  const layer = table.slice(table.indexOf('data-testid="table-detail"'), table.indexOf("<button type=\"button\" className={styles.backdrop}"))

  for (const capture of ["onClickCapture", "onPointerDownCapture", "onKeyDownCapture"]) {
    expect(layer).toContain(capture)
  }
  expect(layer.match(/event\.nativeEvent\.stopImmediatePropagation\(\)/g)).toHaveLength(3)
  expect(table).toContain("if (tableClosing) return")
  expect(table).toContain("restoreFocusAfterExitRef.current = false")
  expect(presence).toContain('window.matchMedia("(prefers-reduced-motion: reduce)").matches')
  expect(presence).toContain("commitPresence(CLOSED_PRESENCE)")
  expect(css).toContain('@media (prefers-reduced-motion: reduce)')
  expect(css).toContain('.layer[data-table-presence="closing"] .detail { animation: none; }')
})

test("TABLE-EXIT-HARDEN-006 a dirty hosted profile blocks every outer Table exit until an explicit decision", () => {
  const table = source(TABLE_PATH)
  const profile = source(PROFILE_PATH)
  const close = table.slice(table.indexOf("function closeTable()"), table.indexOf("function beginJoin()"))

  expect(table).toContain("const profileHostExitGuardRef = useRef<ProfileHostExitGuardB | null>(null)")
  expect(table).toContain("registerHostExitGuard={registerProfileHostExitGuard}")
  expect(close).toContain("profileGuard.requestExit(commitCloseTable)")
  expect(close).toMatch(/if \(profileGuard\) \{[\s\S]*profileGuard\.requestExit\(commitCloseTable\)[\s\S]*return[\s\S]*\}/)
  expect(close).toContain("function commitCloseTable()")
  expect(profile).toContain("requestExit(continueExit: () => boolean): boolean")
  expect(profile).toContain("resumeAfterInterruptedExit(): void")
  expect(profile).toContain("pendingHostExitRef.current = continueExit")
  expect(profile).toContain("setConfirmingDiscard(true)")
  expect(profile).toContain('data-testid="profile-discard-keep"')
  expect(profile).toContain('data-testid="profile-discard-confirm"')
  expect(profile).toContain("if (continueHostExit)")
  expect(profile).toContain("continueWithFrozenHostExit(continueHostExit)")
})
