import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

test("ACCOUNT-EXIT-001 a successful durable mutation clears immediately while its exact envelope snapshot exits", () => {
  const gate = source("features/ondo/identity-b/account-save-gate-b.tsx")

  expect(gate).toContain("useSheetPresence(desiredSnapshot)")
  expect(gate).toContain("hashBAccountReturnTo(returnTo)")
  expect(gate).toContain('key: `${returnTo.tokenId}:${envelopeHash}`')
  expect(gate).toContain("key={presented.key}")
  expect(gate).toContain("returnTo={presented.returnTo}")
  expect(gate).toContain("presenceState={presence.phase}")
  expect(gate.indexOf("actions.cancelAccountSave()")).toBeLessThan(gate.indexOf("stageFocusRestore(presented)"))
  expect(gate.indexOf("actions.completeAccountSave()")).toBeLessThan(gate.lastIndexOf("stageFocusRestore(presented)"))
})

test("ACCOUNT-EXIT-002 persistence refusal stays open and never starts visual closing", () => {
  const gate = source("features/ondo/identity-b/account-save-gate-b.tsx")
  const cancel = gate.slice(gate.indexOf("function cancel()"), gate.indexOf("function start()"))
  const complete = gate.slice(gate.indexOf("function complete()"), gate.indexOf("function handleKeyDown"))

  expect(cancel).toContain('setView("failure")')
  expect(cancel).toContain("return")
  expect(cancel).not.toContain("stageFocusRestore")
  expect(complete).toContain('outcome !== "saved"')
  expect(complete).toContain('setView("failure")')
  expect(complete).not.toContain("stageFocusRestore")
})

test("ACCOUNT-EXIT-003 closing retains modal and scroll ownership while consuming duplicate input", () => {
  const gate = source("features/ondo/identity-b/account-save-gate-b.tsx")
  const css = source("features/ondo/identity-b/account-save-gate-b.module.css")

  expect(gate).toContain("useModalIsolation(true, layerRef)")
  expect(gate).toContain("useDocumentScrollLock(true)")
  expect(gate).toContain('data-account-presence={presenceState}')
  expect(gate).toContain("if (closing) return")
  expect(gate).toContain("closing || exitRequestedRef.current")
  expect(gate).toContain("onClickCapture=")
  expect(gate).toContain("onPointerDownCapture=")
  expect(gate).toContain("onKeyDownCapture=")
  expect(gate).toContain("event.stopImmediatePropagation()")
  expect(gate).toContain("disabled={closing}")
  expect(css).toContain('animation: accountDialogExit 260ms')
  expect(css).toContain("animation-name: accountDialogExitRight")
  expect(css).not.toContain('[data-account-presence="closing"] { pointer-events: none; }')
})

test("ACCOUNT-EXIT-004 focus returns to the exact originating Save only after retained DOM removal", () => {
  const gate = source("features/ondo/identity-b/account-save-gate-b.tsx")

  expect(gate).toContain("returnFocusRef.current")
  expect(gate).toContain("restoreFocusAfterExitRef.current = true")
  expect(gate).toContain("if (presence.value !== null || !restoreFocusAfterExitRef.current) return")
  expect(gate).toContain("exactTarget?.isConnected")
  expect(gate).toContain("exactTarget.matches(selector)")
  expect(gate).toContain("focusFirstAvailableDestination([selector])")
  expect(gate).toContain("desiredWasOpenRef.current")
  expect(gate).toContain("desiredKeyRef.current !== desiredSnapshot.key")
  expect(gate).toContain("restoreFocusAfterExitRef.current = false")
  expect(gate).not.toContain("restoreSaveFocus")
})
