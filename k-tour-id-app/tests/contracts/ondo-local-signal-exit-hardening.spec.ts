import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

test("LOCAL-SIGNAL-EXIT-001 final close preserves the last visual draft until retained unmount", () => {
  const signal = source("features/ondo/local-signal-b/local-signal-layer-b.tsx")
  const finish = signal.slice(
    signal.indexOf("function finishAndReturnToPlace()"),
    signal.indexOf("function requestClose()"),
  )
  const traversal = signal.slice(
    signal.indexOf("const discardOnTraversal"),
    signal.indexOf("window.addEventListener(B_DISCOVERY_TRAVERSAL_EVENT"),
  )

  expect(signal).toContain("const sheetPresence = useSheetPresence")
  expect(signal).toContain('const presentedSignalPhase = open && sheetPresence.phase === "open" ? "open" : "closing"')
  expect(signal).toContain("data-signal-presence={presentedSignalPhase}")
  expect(finish).toContain("actions.closeLocalSignal()")
  expect(finish).not.toMatch(/releasePhotoUrl|setGateSession|setGateBinding|setGateOpen|setCloseDecision/)
  expect(traversal).toContain("actions.closeLocalSignal()")
  expect(traversal).not.toContain("releasePhotoUrl()")
})

test("LOCAL-SIGNAL-EXIT-002 discard is part of the one outer dialog, not a nested modal", () => {
  const signal = source("features/ondo/local-signal-b/local-signal-layer-b.tsx")
  expect(signal).toContain('className={styles.closeDecision} aria-labelledby="local-signal-discard-title"')
  expect(signal).not.toMatch(/className=\{styles\.closeDecision\}[^>]*role="alertdialog"/)
})

test("LOCAL-SIGNAL-EXIT-003 the live result excludes its interactive return control", () => {
  const signal = source("features/ondo/local-signal-b/local-signal-layer-b.tsx")
  const result = signal.slice(
    signal.indexOf('<section className={styles.result}'),
    signal.indexOf(") : (\n            <>", signal.indexOf('<section className={styles.result}')),
  )
  const announcementEnd = result.indexOf("</div>\n              <button")

  expect(result).toContain('className={styles.resultAnnouncement} role="status" aria-live="polite"')
  expect(announcementEnd).toBeGreaterThan(0)
  expect(result.slice(0, announcementEnd)).not.toContain('data-testid="local-signal-return"')
  expect(result.slice(announcementEnd)).toContain('data-testid="local-signal-return"')
})

test("LOCAL-SIGNAL-EXIT-004 category art never presents itself as official source media", () => {
  const signal = source("features/ondo/local-signal-b/local-signal-layer-b.tsx")
  expect(signal).toContain('data-source-class="category_illustration"')
  expect(signal).toContain('aria-label={copy.categoryImage}')
  expect(signal).not.toContain('data-source-class="official_directory"')
  expect(signal).not.toContain("copy.officialSource")
})
