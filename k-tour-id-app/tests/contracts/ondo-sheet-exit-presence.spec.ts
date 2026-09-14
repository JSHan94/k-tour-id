import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

test("SHEET-PRESENCE-001 domain close stays immediate while the last visual value exits for 260ms", () => {
  const presence = source("features/ondo/shared/ui/use-sheet-presence.ts")
  const onboarding = source("features/ondo/onboarding/official-directory-onboarding.tsx")

  expect(presence).toContain("export const SHEET_EXIT_DURATION_MS = 260")
  expect(presence).toContain('{ value: current.value, phase: "closing" }')
  expect(presence).toContain("setTimeout(() =>")
  expect(onboarding).toContain("actions.completeOnboarding({ intent, area, preferences })")
  expect(onboarding).toContain("actions.cancelOnboarding()")
  expect(onboarding).not.toContain("afterExit")
  expect(onboarding).not.toMatch(/setTimeout\([\s\S]*actions\.(completeOnboarding|cancelOnboarding)/)
})

test("SHEET-PRESENCE-002 close timers are effect-owned, cancel on reopen, and reduced motion closes immediately", () => {
  const presence = source("features/ondo/shared/ui/use-sheet-presence.ts")
  const updaterStart = presence.indexOf("setPresence(")
  const timerStart = presence.indexOf("closeTimerRef.current = window.setTimeout")

  expect(presence).toContain('window.matchMedia("(prefers-reduced-motion: reduce)").matches')
  expect(presence).toContain("window.clearTimeout(closeTimerRef.current)")
  expect(presence.match(/window\.requestAnimationFrame\(/g)).toHaveLength(2)
  expect(presence.indexOf("firstExitFrameRef.current = window.requestAnimationFrame")).toBeLessThan(timerStart)
  expect(presence).toContain("window.cancelAnimationFrame(firstExitFrameRef.current)")
  expect(presence).toContain("window.cancelAnimationFrame(paintedExitFrameRef.current)")
  expect(presence).toContain("if (desiredRef.current !== null) return")
  expect(presence).toContain("if (desired !== null)")
  expect(timerStart).toBeGreaterThan(updaterStart)
  expect(presence).not.toContain("setPresence((")
  expect(presence.indexOf("window.clearTimeout(closeTimerRef.current)")).toBeLessThan(presence.indexOf("if (desired !== null)"))
})

test("SHEET-PRESENCE-003 closing retains modal ownership but consumes repeated pointer and keyboard input", () => {
  const sheet = source("features/ondo/shared/ui/sheet-b.tsx")
  const css = source("features/ondo/shared/ui/ui.module.css")

  expect(sheet).toContain("useModalIsolation(!suspended, layerRef)")
  expect(sheet).toContain("useDocumentScrollLock(true)")
  expect(sheet).toContain('role={suspended ? undefined : "dialog"}')
  expect(sheet).toContain('aria-modal={suspended ? undefined : "true"}')
  expect(sheet).toContain("if (closingRef.current) return")
  expect(sheet).toContain("onClickCapture=")
  expect(sheet).toContain("onPointerDownCapture=")
  expect(sheet).toContain("onKeyDownCapture=")
  expect(sheet).toContain('disabled={suspended || closing}')
  expect(css).not.toContain('.layer[data-sheet-presence="closing"] { pointer-events: none; }')
  expect(css).toContain("animation: sheet-exit 260ms")
  expect(css).toContain("animation-name: sheet-exit-right")
})

test("SHEET-PRESENCE-004 focus restores only after the retained sheet unmounts", () => {
  const sheet = source("features/ondo/shared/ui/sheet-b.tsx")
  const labs = source("features/ondo/labs/labs-entry.tsx")
  const settings = source("features/ondo/settings/settings-entry-b.tsx")

  expect(sheet).toContain("returnFocusRef.current")
  expect(sheet).toContain("if (previous && isRenderedFocusable(previous)) previous.focus")
  expect(labs).not.toContain("const opener = originOpener.current")
  expect(settings).not.toContain("window.requestAnimationFrame(() => privacyRowRef.current?.focus")
})

test("SHEET-PRESENCE-005 dirty refusal stays open and all core B/legacy sheets share presence", () => {
  const signal = source("features/ondo/local-signal-b/local-signal-layer-b.tsx")
  const settings = source("features/ondo/settings/settings-entry-b.tsx")
  const onboarding = source("features/ondo/onboarding/official-directory-onboarding.tsx")
  const product = source("features/ondo/app/ondo-product-b.tsx")
  const legacy = source("features/ondo/connect/connect-overlays.tsx")

  const requestClose = signal.slice(signal.indexOf("function requestClose()"), signal.indexOf("function keepDraftEditing()"))
  expect(requestClose).toContain("else setCloseDecision(true)")
  expect(requestClose).not.toContain("actions.closeLocalSignal()")
  expect(signal).toContain("useSheetPresence")
  expect(settings).toContain("useSheetPresence(sheet)")
  expect(onboarding).toContain("useSheetPresence")
  expect(product).toContain("<LabsEntryB presenceState={presence.phase}")
  expect(legacy).toContain("<LabsEntry presenceState={labsPresence.phase}")
})

test("SHEET-PRESENCE-006 closing freezes the last painted presentation and restores the exact opener over stray background focus", () => {
  const sheet = source("features/ondo/shared/ui/sheet-b.tsx")
  expect(sheet).toContain("const presentationRef = useRef({ children, footer, header, label })")
  expect(sheet).toContain("if (!closing) presentationRef.current = { children, footer, header, label }")
  expect(sheet).toContain("presentation.children")
  expect(sheet).toContain("presentation.footer")
  expect(sheet).toContain("presentation.header")
  expect(sheet).toContain("presentation.label")
  expect(sheet).toContain("const remainingDialogs = Array.from")
  expect(sheet).toContain("if (remainingDialog.contains(document.activeElement)) return")
  expect(sheet).toContain("else if (previous && isRenderedFocusable(previous)) previous.focus")
  expect(sheet).not.toContain("active && active !== document.body && active !== document.documentElement && active.isConnected")
})

test("SHEET-PRESENCE-007 Labs gives the replacement task an explicit focus destination", () => {
  const labs = source("features/ondo/labs/labs-entry.tsx")

  expect(labs).toContain("initialFocusSelector=\"[data-testid='labs-back']\"")
  expect(labs).toContain('data-testid="labs-back"')
})

test("SHEET-PRESENCE-008 exit deadlines observe committed intent and release hidden pages", () => {
  const presence = source("features/ondo/shared/ui/use-sheet-presence.ts")
  const renderSection = presence.slice(
    presence.indexOf("export function useSheetPresence"),
    presence.indexOf("useLayoutEffect(() => {"),
  )

  expect(renderSection).not.toContain("desiredRef.current = desired")
  expect(presence).toContain("desiredRef.current = desired\n    cancelExitSchedule()")
  expect(presence).toContain("exitDeadlineTimerRef.current = window.setTimeout(finishExit")
  expect(presence).toContain('document.addEventListener("visibilitychange", finishWhenHidden)')
  expect(presence).toContain('window.addEventListener("pagehide", finishOnPageHide)')
  expect(presence).toContain('document.removeEventListener("visibilitychange", finishWhenHidden)')
  expect(presence).toContain('window.removeEventListener("pagehide", finishOnPageHide)')
})
