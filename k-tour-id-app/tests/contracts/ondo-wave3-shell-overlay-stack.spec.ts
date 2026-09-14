import fs from "node:fs"
import path from "node:path"
import { expect, test } from "@playwright/test"

const ROOT = process.cwd()
const read = (file: string) => fs.readFileSync(path.join(ROOT, file), "utf8")

test("W3-SHELL-001 modal isolation publishes a ref-counted canvas state for local and portal dialogs", () => {
  const isolation = read("features/ondo/shared/ui/use-modal-isolation.ts")
  const shell = read("features/ondo/app/ondo-shell.module.css")

  expect(isolation).toContain("modalOwnersByBoundary")
  expect(isolation).toContain("acquireModalBoundary(boundary, owner, priority)")
  expect(isolation).toContain("releaseModalBoundary(boundary, owner)")
  expect(isolation).toContain('boundary.dataset.ondoModalOpen = "true"')
  expect(isolation).toContain("ONDO_MODAL_ENTRY_EVENT")
  expect(isolation).toContain("boundary.dispatchEvent(new CustomEvent")
  expect(shell).toContain('.canvas[data-ondo-modal-open="true"] .nav')
  expect(shell).toContain('.canvas[data-ondo-modal-open="true"] .content')
})

test("W3-SHELL-002 semantic SheetB variants own an explicit shared z-order", () => {
  const sheet = read("features/ondo/shared/ui/sheet-b.tsx")
  const css = read("features/ondo/shared/ui/ui.module.css")
  const priorities = read("features/ondo/shared/ui/modal-layer-priority.ts")

  expect(sheet).toContain("data-sheet-variant={semanticVariant}")
  expect(sheet).toContain("data-modal-layer-priority={modalPriority}")
  expect(sheet).toContain("document.activeElement !== activeAtMount")
  expect(sheet).toContain("ONDO_MODAL_PRIORITY.fullTask")
  expect(priorities).toContain("fullTask: 140")
  expect(priorities).toContain("critical: 160")
  expect(priorities).toContain("nestedCritical: 161")
  expect(css).toContain('.layer[data-sheet-variant="peek"] { z-index: 80; }')
  expect(css).toContain('.layer[data-sheet-variant="decision"] { z-index: 100; }')
  expect(css).toContain('.layer[data-sheet-variant="detail"] { z-index: 120; }')
  expect(css).toContain('.layer[data-sheet-variant="full-task"] { z-index: 140; }')
})

test("W3-SHELL-003 transient toast never competes with a modal task", () => {
  const shell = read("features/ondo/app/ondo-shell.module.css")
  const app = read("features/ondo/app/ondo-app-b.tsx")
  const provider = read("features/ondo/shared/state/ondo-b-provider.tsx")
  expect(shell).toContain('.canvas[data-ondo-modal-open="true"] .toast { display: none; }')
  expect(app).toContain("actions.discardToast()")
  expect(provider).toContain("toastGenerationRef")
  expect(provider).toContain("discardToast")
})

test("W3-SHELL-004 Explore keeps one map instance while non-map destinations remain isolated", () => {
  const app = read("features/ondo/app/ondo-app-b.tsx")
  const map = read("features/ondo/map/map-entry-b.tsx")
  const css = read("features/ondo/app/ondo-shell.module.css")

  expect(app).toContain('data-tab-panel="ondo"')
  expect(app).toContain('{slots.explore}')
  expect(app).toContain('inert={state.tab === "ondo" ? undefined : true}')
  expect(app).toContain('key={state.tab}')
  expect(map).toContain('if (state.tab !== "ondo") return')
  expect(map).toContain("mapRef.current?.resize()")
  expect(css).toContain("animation: tabReveal 180ms")
  expect(app).toContain("previousTab")
  expect(app).toContain("contentRef.current?.focus({ preventScroll: true })")
})

test("W3-SHELL-005 an unsaved private note survives only in process memory across tab remounts", () => {
  const note = read("features/ondo/my/private-note.tsx")
  const memory = read("features/ondo/shared/state/private-note-draft-memory.ts")
  const provider = read("features/ondo/shared/state/ondo-b-provider.tsx")

  expect(memory).toContain("const privateNoteDrafts = new Map")
  expect(memory).not.toContain("localStorage")
  expect(memory).not.toContain("sessionStorage")
  expect(note).toContain("readPrivateNoteDraftMemory")
  expect(note).toContain("writePrivateNoteDraftMemory")
  expect(note).toContain("clearPrivateNoteDraftMemory")
  expect(provider).toContain("clearAllPrivateNoteDraftMemory()")
})
