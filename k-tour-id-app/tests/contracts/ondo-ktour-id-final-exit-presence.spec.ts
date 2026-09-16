import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const SETUP_PATH = "features/ondo/identity-b/ktour-id-setup-b.tsx"
const CSS_PATH = "features/ondo/identity-b/ktour-id-setup-b.module.css"
const PRESENCE_PATH = "features/ondo/shared/ui/use-sheet-presence.ts"
const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

test("KTOUR-EXIT-001 the desired origin clears immediately while one exact painted subject remains", () => {
  const setup = source(SETUP_PATH)
  const liveDialog = setup.slice(setup.indexOf("const liveDialog ="), setup.indexOf("return <div", setup.indexOf("const liveDialog =")))

  expect(setup).toContain("const desiredOrigin = state.identitySetupOrigin")
  expect(setup).toContain("const setupPresence = useSheetPresence(desiredOrigin)")
  expect(setup).toContain("const origin = setupPresence.value")
  expect(setup).toContain("const exitVisualSnapshotRef = useRef<ReactNode>(null)")
  expect(liveDialog).toContain('data-phase={phase} data-method={method} data-origin={origin}')
  expect(liveDialog).toContain("if (!finalExitActive) exitVisualSnapshotRef.current = liveDialog")
  expect(liveDialog).toContain("const renderedDialog = finalExitActive ? exitVisualSnapshotRef.current ?? liveDialog : liveDialog")
  expect(setup).toContain("data-identity-presence={setupPresence.phase}")
})

test("KTOUR-EXIT-002 every true dismissal shares one guarded boundary while internal steps stay immediate", () => {
  const setup = source(SETUP_PATH)
  const dismiss = setup.slice(setup.indexOf("function beginFinalDismiss"), setup.indexOf("function fail"))
  const dialog = setup.slice(setup.indexOf("const liveDialog ="), setup.indexOf("if (!finalExitActive)"))
  const escape = setup.slice(setup.indexOf("const onEscape"), setup.indexOf("document.addEventListener", setup.indexOf("const onEscape")))

  expect(dismiss).toContain("if (!origin || closing || exitRequestedRef.current || desiredOriginRef.current === null) return false")
  expect(dismiss).toContain("exitRequestedRef.current = true")
  expect(dismiss).toContain("restoreFocusAfterExitRef.current = true")
  expect(dismiss).toContain("actions.closeIdentitySetup()")
  expect(dialog).not.toContain("onClick={actions.closeIdentitySetup}")
  expect(dialog).toContain('data-testid="k-tour-id-cancel" aria-label={copy.close} onClick={requestFinalDismiss}')
  expect(dialog).toContain('data-testid="k-tour-id-return" className={styles.secondary} onClick={requestFinalDismiss}')
  for (const phase of ["unavailable", "expired", "cancelled"]) {
    const status = dialog.slice(dialog.indexOf(`{phase === "${phase}"`)).split(" : null}")[0]
    expect(status, `${phase} returns through guarded dismissal`).toContain("onSecondary={requestFinalDismiss}")
  }
  expect(escape).toContain("requestFinalDismiss()")
  expect(dialog).toContain('onClick={() => setPhase("credential_ready")}')
  expect(dialog).toContain('onSecondary={startFreshRequest}')
  const restart = setup.slice(setup.indexOf("function startFreshRequest"), setup.indexOf("function retrySampleStep"))
  expect(restart).toContain('setPhase("method_select")')
  expect(restart).not.toContain("closeIdentitySetup")
})

test("KTOUR-EXIT-003 action-gate issuance freezes before the atomic credential and origin mutation", () => {
  const setup = source(SETUP_PATH)
  const finish = setup.slice(setup.indexOf("function finishHolder"), setup.indexOf("function openPresentation"))

  expect(finish).toContain('if (origin === "action_gate" && !beginFinalDismiss()) return')
  const completion = finish.indexOf("actions.completeIdentitySetup(")
  expect(completion).toBeGreaterThanOrEqual(0)
  expect(finish.indexOf("beginFinalDismiss()")).toBeLessThan(completion)
  expect(finish).toContain("const saved = actions.completeIdentitySetup(method, experiencePersonRef.current")
  expect(finish).toContain('? { issuanceScope: "person", experiencePersonHandoff: experiencePersonRef.current }')
  expect(finish).toContain(": sampleRecovery ? { sampleRecovery: true } : undefined)")
  const refused = finish.slice(finish.indexOf("if (!saved)"), finish.indexOf("// The provider atomically"))
  expect(refused).toContain("issuedOnceRef.current = false")
  expect(refused).toContain("exitRequestedRef.current = false")
  expect(refused).toContain("restoreFocusAfterExitRef.current = false")
  expect(refused).toContain('return fail("IDENTITY_SESSION_EXPIRED", experiencePersonRef.current ? "verified_person_consent" : "holder_delivery_preview")')
  expect(refused).not.toContain("completeIdentitySetup")
  expect(finish.indexOf("if (!saved)")).toBeGreaterThan(completion)
  expect(finish.indexOf('if (origin === "action_gate") return')).toBeGreaterThan(finish.indexOf("if (!saved)"))
  expect(finish).toContain('if (origin === "action_gate") return')
  expect(finish).not.toContain("actions.closeIdentitySetup()")
})

test("KTOUR-EXIT-004 focus waits for removal, rejects stale reopen, then uses exact opener or an origin fallback", () => {
  const setup = source(SETUP_PATH)
  const focus = setup.slice(
    setup.indexOf("if (setupPresence.value !== null || !restoreFocusAfterExitRef.current) return"),
    setup.indexOf("useLayoutEffect(() =>", setup.indexOf("if (setupPresence.value !== null || !restoreFocusAfterExitRef.current) return")),
  )

  expect(focus).toContain("if (desiredOriginRef.current !== null) return")
  expect(focus).toContain("opener?.isConnected && isRenderedFocusable(opener)")
  expect(focus).toContain("opener.focus({ preventScroll: true })")
  expect(focus).toContain("focusFirstAvailableDestination(fallback)")
  for (const destination of [
    "[data-testid='ondo-b-action-gate'] [data-action-gate-initial-focus]",
    "[data-testid='traveler-id-ktour-id-open']",
    "[data-testid='nav-tables']",
    "[data-testid='nav-id']",
    "[data-testid='nav-ondo']",
  ]) expect(focus).toContain(destination)
  expect(setup).toContain("A rapid reopen keeps the original outside control")
})

test("KTOUR-EXIT-005 the retained modal owns isolation and consumes every input class through removal", () => {
  const setup = source(SETUP_PATH)
  const css = source(CSS_PATH)
  const root = setup.slice(setup.indexOf("return <div"), setup.indexOf("</div>\n}", setup.indexOf("return <div")))
  const consume = setup.slice(setup.indexOf("function consumeFinalExitInput"), setup.indexOf("function beginFinalDismiss"))

  expect(setup).toContain("useModalIsolation(active, layerRef)")
  expect(setup).toContain("useDocumentScrollLock(active)")
  expect(root).toContain("<div className={styles.dialogGuard} inert={finalExitActive ? true : undefined}>{renderedDialog}</div>")
  expect(root).toContain('<span className={styles.exitShield} aria-hidden="true" />')
  expect(root).toContain("aria-busy={finalExitActive ? \"true\" : undefined}")
  for (const capture of ["onClickCapture", "onPointerDownCapture", "onKeyDownCapture"]) expect(root).toContain(capture)
  expect(consume).toContain("event.nativeEvent.stopImmediatePropagation()")
  expect(css).toContain(".exitShield { position: absolute; z-index: 10; inset: 0; pointer-events: auto; touch-action: none; }")
  expect(setup).toContain('layerRef.current?.closest("[inert],[aria-hidden=\'true\']")')
  expect(root).toContain("ONDO_MODAL_PRIORITY.nestedCritical")
})

test("KTOUR-EXIT-006 the 260ms exit, async guards, and reduced-motion removal cannot replay stale state", () => {
  const setup = source(SETUP_PATH)
  const css = source(CSS_PATH)
  const presence = source(PRESENCE_PATH)

  // Check the actual async owners rather than counting guard occurrences; the
  // recovery journey adds a session-expiry effect and a manual-review callback.
  for (const guard of [
    "if (!active || finalExitActive || !session",
    "if (!active || finalExitActive || !state.identityCredential)",
    "if (!active || finalExitActive || !presentationRequest",
    'if (!active || finalExitActive || phase !== "provider_processing_preview")',
  ]) expect(setup).toContain(guard)
  expect(setup).toContain('if (phase !== "manual_review" || !active || finalExitActive) setManualChecking(false)')
  expect(setup).toContain("if (manualTimerRef.current !== null) window.clearTimeout(manualTimerRef.current)")
  expect(setup).toContain("manualReviewRef.current !== expected || sessionRef.current?.nonce !== nonce")
  expect(setup).toContain("if (exitRequestedRef.current || desiredOriginRef.current === null) return")
  expect(css).toContain('.root[data-identity-presence="closing"] .backdrop { animation: ktour-backdrop-out 260ms')
  expect(css).toContain('.root[data-identity-presence="closing"] .dialog { animation: ktour-dialog-out 260ms')
  expect(css).toContain("@media (prefers-reduced-motion: reduce)")
  expect(css).toContain('.root[data-identity-presence] .dialog { animation: none; }')
  expect(presence).toContain('window.matchMedia("(prefers-reduced-motion: reduce)").matches')
  expect(presence).toContain("commitPresence(CLOSED_PRESENCE)")
  expect(presence).toContain("SHEET_EXIT_DURATION_MS = 260")
})

test("KTOUR-EXIT-007 ordinary copy stays product-facing while unavailable-provider truth remains progressive", () => {
  const setup = source(SETUP_PATH)
  const copy = setup.slice(setup.indexOf("const COPY"), setup.indexOf("const FOCUSABLE"))

  expect(copy).not.toMatch(/\b(?:on-device|simulated|test)\b/i)
  expect(copy).toContain("Preview the ID handoff")
  expect(copy).toContain("No ID app opens and no personal data is sent.")
  expect(copy).toContain("No identity service is connected, no DID or VC is issued")
  expect(copy).toContain("신원확인 서비스와 연결되지 않고 DID·VC를 발급하지 않습니다")
  expect(copy).toContain("本人確認サービスには接続せず、DID・VCも発行しません")
  for (const method of ["mobile_id", "mobile_residence_card", "passport_ekyc"]) expect(setup).toContain(`id: "${method}" as const`)
})
