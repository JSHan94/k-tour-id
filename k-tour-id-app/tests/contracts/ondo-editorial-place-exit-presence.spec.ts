import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

test("EDITORIAL-EXIT-001 the mount retains the exact Jeju subject after immediate discovery mutation", () => {
  const mount = source("features/ondo/place/editorial-place-mount-b.tsx")
  const overlay = source("features/ondo/place/editorial-place-overlay-b.tsx")
  const presence = source("features/ondo/shared/ui/use-sheet-presence.ts")
  const close = overlay.slice(overlay.indexOf("function close()"), overlay.indexOf("function closeDetails()"))

  expect(mount).toContain("useSheetPresence(desiredSubject)")
  expect(mount).toContain("key={presented.key}")
  expect(mount).toContain("editorialPlaceId={presented.editorialPlaceId}")
  expect(mount).toContain("locale={presented.locale}")
  expect(mount).toContain('state.tab === "ondo" && state.surface.kind === "editorial_place"')
  expect(mount).toContain('const presentedPhase = desiredSubject?.key === presented?.key && presence.phase === "open" ? "open" : "closing"')
  expect(mount).toContain("presenceState={presentedPhase}")
  expect(presence).toContain("export const SHEET_EXIT_DURATION_MS = 260")
  expect(close.indexOf("exitRequestedRef.current = true")).toBeLessThan(close.indexOf("closeBDiscoveryPlace()"))
  expect(close).toContain("closeBDiscoveryPlace()")
  expect(close).toContain('actions.setSurface({ kind: "map" })')
  expect(close).not.toMatch(/setTimeout|requestAnimationFrame/)
})

test("EDITORIAL-EXIT-002 the complete painted place freezes for the 260ms exit", () => {
  const overlay = source("features/ondo/place/editorial-place-overlay-b.tsx")
  const css = source("features/ondo/place/editorial-place-overlay-b.module.css")

  expect(overlay).toContain("type EditorialPlaceVisualSnapshot")
  expect(overlay).toContain("if (!closing && !exitRequestedRef.current) visualSnapshotRef.current = liveVisualSnapshot")
  expect(overlay).toContain("const visualSnapshot = closing || exitRequestedRef.current ? visualSnapshotRef.current : liveVisualSnapshot")
  expect(overlay).toContain("const expandedView = visualSnapshot.expanded")
  expect(overlay).toContain("const locale = visualSnapshot.locale")
  expect(overlay).toContain("const saved = visualSnapshot.saved")
  expect(overlay).toContain("visualSnapshot.saveError")
  expect(overlay).toContain("data-editorial-presence={presenceState}")
  expect(css).toContain('.peek[data-editorial-presence="closing"]')
  expect(css).toContain('.layer[data-editorial-presence="closing"] .backdrop')
  expect(css).toContain('.layer[data-editorial-presence="closing"] .sheet')
  expect(css.match(/260ms/g)?.length).toBeGreaterThanOrEqual(3)
})

test("EDITORIAL-EXIT-003 retained peek and detail keep modal, scroll and input ownership", () => {
  const overlay = source("features/ondo/place/editorial-place-overlay-b.tsx")
  const css = source("features/ondo/place/editorial-place-overlay-b.module.css")
  const detailBack = overlay.slice(overlay.indexOf("function closeDetails()"), overlay.indexOf("function trapFocus"))
  const focusTrap = overlay.slice(overlay.indexOf("function trapFocus"), overlay.indexOf("function toggleSaved"))
  const save = overlay.slice(overlay.indexOf("function toggleSaved()"), overlay.indexOf("function openDetails()"))
  const openDetail = overlay.slice(overlay.indexOf("function openDetails()"), overlay.indexOf("function consumeClosingInput"))
  const input = overlay.slice(overlay.indexOf("function consumeClosingInput"), overlay.indexOf("if (!expandedView)"))

  expect(overlay).toContain("useModalIsolation(Boolean(place), expandedView ? layerRef : peekRef)")
  expect(overlay).toContain("useDocumentScrollLock(Boolean(place))")
  expect(overlay).toContain('aria-busy={closing ? "true" : undefined}')
  expect(overlay).toContain("onClickCapture={consumeClosingInput}")
  expect(overlay).toContain("onPointerDownCapture={consumeClosingInput}")
  expect(overlay).toContain("onKeyDownCapture={consumeClosingInput}")
  expect(overlay).toContain("event.nativeEvent.stopImmediatePropagation()")
  expect(overlay).toContain('window.addEventListener("keydown", consumeClosingKey, true)')
  expect(overlay).toContain('activeLayer?.closest("[inert],[aria-hidden=\'true\']")')
  for (const guardedAction of [detailBack, focusTrap, save, openDetail]) {
    expect(guardedAction).toContain("closingRef.current || exitRequestedRef.current")
  }
  expect(input).toContain("!closingRef.current && !exitRequestedRef.current")
  expect(css).not.toContain('[data-editorial-presence="closing"] { pointer-events: none; }')
})

test("EDITORIAL-EXIT-004 focus restores only after removal to exact map, story or My Korea opener", () => {
  const mount = source("features/ondo/place/editorial-place-mount-b.tsx")

  expect(mount).toContain("if (presence.value !== null || !restoreAfterExitRef.current) return")
  expect(mount.indexOf("if (!presented) return null")).toBeLessThan(mount.indexOf("<EditorialPlaceOverlayB"))
  expect(mount).toContain("exactOpenerRef.current")
  expect(mount).toContain("const activeAtSelection = useMemo<HTMLElement | null>")
  expect(mount).toContain("const active = activeAtSelection ??")
  expect(mount).toContain("[data-editorial-place-opener=")
  expect(mount).toContain("MY_KOREA_SAVED_EDITORIAL_OPENER_ATTRIBUTE")
  expect(mount).toContain("[data-editorial-story-opener=")
  expect(mount).toContain("foremostRemainingDialog()")
  expect(mount).toContain("focusDestination(exactOpener)")
  expect(mount).toContain("restorationSerialRef.current !== serial || desiredWasOpenRef.current")
  expect(mount).toContain("if (attempts < 24)")
})

test("EDITORIAL-EXIT-005 detail-peek navigation stays immediate while only final dismissal exits", () => {
  const overlay = source("features/ondo/place/editorial-place-overlay-b.tsx")
  const internalBack = overlay.slice(overlay.indexOf("function closeDetails()"), overlay.indexOf("function trapFocus"))
  const openDetail = overlay.slice(overlay.indexOf("function openDetails()"), overlay.indexOf("function consumeClosingInput"))

  expect(overlay).toContain("B_DISCOVERY_TRAVERSAL_EVENT")
  expect(overlay).toContain('setExpanded(entry.level === "detail")')
  expect(internalBack).toContain('goBackFromBDiscovery("detail")')
  expect(internalBack).toContain("setExpanded(false)")
  expect(internalBack).not.toMatch(/setTimeout|requestAnimationFrame/)
  expect(openDetail).toContain("openBDiscoveryEditorialDetail(activePlace.id)")
  expect(openDetail).toContain("setExpanded(true)")
  expect(overlay).toContain("readMyKoreaPlaceReturnNavigation()?.receipt.phase === \"place\"")
})

test("EDITORIAL-EXIT-006 rapid replacement, landscape and reduced motion cannot replay stale exit UI", () => {
  const mount = source("features/ondo/place/editorial-place-mount-b.tsx")
  const overlay = source("features/ondo/place/editorial-place-overlay-b.tsx")
  const css = source("features/ondo/place/editorial-place-overlay-b.module.css")

  expect(mount).toContain("const freshSubject = !desiredWasOpenRef.current || desiredKeyRef.current !== desiredSubject.key")
  expect(mount).toContain("restoreAfterExitRef.current = false")
  expect(mount).toContain("restorationSerialRef.current += 1")
  expect(overlay).toContain("if (closingRef.current || exitRequestedRef.current) return")
  expect(overlay).toContain("if (wasClosingRef.current && !closing) exitRequestedRef.current = false")
  expect(css).toContain("@media (orientation: landscape) and (max-height: 500px)")
  expect(css).toContain("animation-name: editorialSheetExitRight")
  expect(css).toContain("@media (prefers-reduced-motion: reduce)")
  expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*data-editorial-presence="closing"[\s\S]*animation: none/)
})
