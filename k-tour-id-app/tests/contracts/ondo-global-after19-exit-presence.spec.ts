import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

test("GLOBAL-AFTER19-STACK-001 place handoff paints outside map chrome and above its retained detail", () => {
  const ui = source("features/ondo/after19/after19-global-b.tsx")
  const css = source("features/ondo/after19/after19-global-b.module.css")
  const mapCss = source("features/ondo/map/map-b.module.css")

  expect(ui).toContain('import { createPortal } from "react-dom"')
  expect(ui).toContain('document.querySelector("[data-testid=\'ondo-canvas\']")')
  expect(ui).toContain("createPortal(gate, canvas)")
  expect(ui).toContain("data-modal-layer-priority={ONDO_MODAL_PRIORITY.fullTask}")
  expect(css).toMatch(/\.layer\s*\{[^}]*z-index:\s*140;/)
  expect(css).toContain(".layer button:focus-visible")
  expect(mapCss).toContain('[data-testid="ondo-canvas"][data-ondo-modal-open="true"]')
})

test("GLOBAL-AFTER19-EXIT-001 retains one immutable last-painted gate subject for the shared 260ms exit", () => {
  const ui = source("features/ondo/after19/after19-global-b.tsx")
  const css = source("features/ondo/after19/after19-global-b.module.css")
  const presence = source("features/ondo/shared/ui/use-sheet-presence.ts")

  expect(ui).toContain("type GlobalAfter19GatePresentationB")
  expect(ui).toContain("useMemo<GlobalAfter19GatePresentationB | null>(() => gateOpen ? {")
  expect(ui).toContain("context: { ...context }")
  expect(ui).toContain('placeReturn: placeReturn ? { ...placeReturn, gateQueue: ["age"] } : null')
  expect(ui).toContain("preference: { ...preference }")
  expect(ui).toContain("const gatePresence = useSheetPresence(desiredGatePresentation)")
  expect(ui).toContain("const gatePresentation = gatePresence.value")
  expect(ui).toContain("const { context, gateView, locale, placeReturn, preference, reviewRequested, reviewResult } = presentation")
  expect(ui).toContain("{gatePresentation ? renderGate(gatePresentation) : null}")
  expect(ui).toContain("data-after19-gate-subject={presentation.key}")
  expect(ui).toContain("data-after19-gate-presence={gatePresence.phase}")
  expect(presence).toContain("export const SHEET_EXIT_DURATION_MS = 260")
  expect(css.match(/260ms/g)?.length).toBeGreaterThanOrEqual(2)
})

test("GLOBAL-AFTER19-EXIT-002 X, Escape, cancel and success close through retained presence without delaying durable mutations", () => {
  const ui = source("features/ondo/after19/after19-global-b.tsx")
  const cancel = ui.slice(ui.indexOf("function cancelGate()"), ui.indexOf("function runCheck()"))
  const finish = ui.slice(ui.indexOf("function finishPlaceReturn("), ui.indexOf("function retryExpiredPlaceReturn()"))
  const genericSuccess = ui.slice(ui.indexOf("function finishConfirmedCheck("), ui.indexOf("function runCheck()"))

  expect(ui).toContain('data-testid="global-after19-close"')
  expect(ui).toContain("onClick={cancelGate}")
  expect(ui).toContain('if (event.key === "Escape")')
  expect(ui).toContain('data-testid="global-after19-cancel" onClick={cancelGate}')
  expect(cancel).toContain("beginGateExit({ kind: \"opener\"")
  expect(genericSuccess.indexOf("commitSession(nextSession, completedAt)")).toBeLessThan(genericSuccess.indexOf('beginGateExit({ kind: "active-control" })'))
  expect(finish.indexOf("completePlaceAfter19Return(placeReturn, outcome, now)")).toBeLessThan(finish.indexOf("restorePlaceContext(placeReturn)"))
  expect(finish.indexOf("restorePlaceContext(placeReturn)")).toBeLessThan(finish.indexOf("beginGateExit(exitIntent)"))
  expect(finish).not.toMatch(/setTimeout|requestAnimationFrame|dispatchPlaceReturnUiRestore/)
})

test("GLOBAL-AFTER19-EXIT-003 modal isolation, document lock and all input ownership survive until actual removal", () => {
  const ui = source("features/ondo/after19/after19-global-b.tsx")
  const css = source("features/ondo/after19/after19-global-b.module.css")

  expect(ui).toContain("useModalIsolation(Boolean(gatePresentation), layerRef)")
  expect(ui).toContain("useDocumentScrollLock(Boolean(gatePresentation))")
  expect(ui).toContain('aria-busy={gateClosing ? "true" : undefined}')
  expect(ui).toContain("onClickCapture={consumeGateClosingInput}")
  expect(ui).toContain("onPointerDownCapture={consumeGateClosingInput}")
  expect(ui).toContain("onKeyDownCapture={consumeGateClosingInput}")
  expect(ui).toContain("event.nativeEvent.stopImmediatePropagation()")
  expect(ui).toContain('window.addEventListener("keydown", consumeClosingKey, true)')
  expect(ui).toContain('layer.closest("[inert],[aria-hidden=\'true\']")')
  expect(css).not.toMatch(/data-after19-gate-presence=[^\n]+pointer-events:\s*none/)
})

test("GLOBAL-AFTER19-EXIT-004 exact opener, active control and exact venue UI restore only after the layer unmounts", () => {
  const ui = source("features/ondo/after19/after19-global-b.tsx")
  const removalEffect = ui.slice(ui.indexOf("if (gatePresence.value !== null) return"), ui.indexOf("}, [gatePresence.value])"))
  const finish = ui.slice(ui.indexOf("function finishPlaceReturn("), ui.indexOf("function retryExpiredPlaceReturn()"))

  expect(removalEffect).toContain("const plan = gateExitPlanRef.current")
  expect(removalEffect).toContain("plan.serial !== gateLifecycleSerialRef.current")
  expect(removalEffect).toContain("dispatchPlaceReturnUiRestore(plan.uiSnapshot, new Date())")
  expect(removalEffect).toContain("plan.opener")
  expect(removalEffect).toContain("reviewToggleRef.current ?? activeOffRef.current")
  expect(removalEffect).toContain("isRenderedFocusable(exact)")
  expect(removalEffect).toContain("[data-testid='canonical-after19-access']")
  expect(removalEffect).toContain("[data-testid='ondo-b-view-toggle']")
  expect(removalEffect).toContain("[data-testid='ondo-b-search']")
  expect(removalEffect).toContain("EXIT_FOCUS_RETRY_LIMIT")
  expect(finish).not.toContain("dispatchPlaceReturnUiRestore")
})

test("GLOBAL-AFTER19-EXIT-005 internal result views, off notice and review provenance close immediately", () => {
  const ui = source("features/ondo/after19/after19-global-b.tsx")
  const closeReview = ui.slice(ui.indexOf("function closeReviewDetails("), ui.indexOf("function clearPendingCheck()"))
  const turnOff = ui.slice(ui.indexOf("function turnOff()"), ui.indexOf("function undoOff()"))
  const dismissNotice = ui.slice(ui.indexOf("function dismissNotice()"), ui.indexOf("function consumeGateClosingInput"))

  expect(closeReview).toContain("setReviewDetailsOpen(false)")
  expect(closeReview).not.toContain("beginGateExit")
  expect(turnOff).toContain("closeReviewDetails(false)")
  expect(turnOff).toContain('mode: "manual-off"')
  expect(turnOff).toContain('setNotice("off")')
  expect(turnOff).not.toContain("beginGateExit")
  expect(dismissNotice).toContain("setNotice(null)")
  expect(dismissNotice).not.toContain("beginGateExit")
  for (const view of ['setGateView("pending")', 'setGateView("failure")', 'setGateView("unavailable")', 'setGateView("expired")']) {
    expect(ui).toContain(view)
  }
})

test("GLOBAL-AFTER19-EXIT-006 rapid reopen, return-subject replacement, stale checks and reduced motion cannot replay an old exit", () => {
  const ui = source("features/ondo/after19/after19-global-b.tsx")
  const css = source("features/ondo/after19/after19-global-b.module.css")
  const presence = source("features/ondo/shared/ui/use-sheet-presence.ts")

  expect(ui).toContain("gateLifecycleSerialRef.current += 1")
  expect(ui).toContain("gateExitPlanRef.current = null")
  expect(ui).toContain("clearPendingCheck()")
  expect(ui).toContain("if (!gateOpenRef.current || gateLifecycleSerialRef.current !== checkSerial) return")
  expect(ui).toContain("if (gateOpenRef.current || plan.serial !== gateLifecycleSerialRef.current) return")
  expect(ui).toContain('key: placeReturn ? `return:${placeReturn.tokenId}`')
  expect(presence).toContain("cancelExitSchedule()")
  expect(presence).toContain('window.matchMedia("(prefers-reduced-motion: reduce)").matches')
  expect(css).toContain('@media (orientation: landscape) and (max-height: 500px)')
  expect(css).toContain("after19-gate-dialog-exit-right")
  expect(css).toContain("@media (prefers-reduced-motion: reduce)")
  expect(css).toContain('.layer[data-after19-gate-presence="closing"] .dialog { animation: none;')
})

test("GLOBAL-AFTER19-EXIT-007 lifecycle hardening preserves Age-only, guest memory, fail-closed and manual-off contracts", () => {
  const ui = source("features/ondo/after19/after19-global-b.tsx")

  expect(ui).toContain('providerUnavailable("age")')
  expect(ui).toContain("readGuestAfter19MemoryB")
  expect(ui).toContain("writeGuestAfter19MemoryB")
  expect(ui).toContain('mode: "manual-off"')
  expect(ui).toContain('value: { predicate: "AGE_GTE_19" as const, outcome: "eligible" as const }')
  expect(ui).toContain('context.cityId === "jeju" ? t.jejuBody : t.body')
  expect(ui).not.toMatch(/dateOfBirth|birthDate|passportNumber|payment|fetch\(|XMLHttpRequest|WebSocket/)
})
