import { readFileSync } from "node:fs"
import { expect, test } from "@playwright/test"

const place = readFileSync("features/ondo/place/canonical-place-overlay.tsx", "utf8")
const styles = readFileSync("features/ondo/place/canonical-place.module.css", "utf8")

test("FL-002 restores one compact Place opener on the shared global After 19 model", () => {
  for (const evidence of [
    "restoreGlobalAfter19B",
    "GLOBAL_AFTER19_SESSION_EVENT",
    "global-after19-toggle",
    "global-after19-prompt-layer",
    "canonical-after19-access",
    "canonical-after19-unlock",
    "data-after19-venue-id",
  ]) expect(place).toContain(evidence)

  expect(place).not.toContain("createBTableActionReturn")
  expect(place).not.toContain("B_ACTION_GATE_REQUEST_EVENT")
})

test("FL-002 states ONDO policy truth in English, Korean, and Japanese without restoring the verbose legacy panel", () => {
  for (const truth of [
    "ONDO policy · not an official restriction for this place.",
    "ONDO 정책 · 이 장소의 공식 이용 제한이 아니에요.",
    "ONDOの方針・この場所の公式な利用制限ではありません。",
  ]) expect(place).toContain(truth)

  expect(place).not.toContain("ONDO locks this simulated night preview behind its own 19+ policy")
  expect(styles).toContain(".after19Access")
  expect(styles).toContain("min-height: 44px")
  expect(styles).not.toMatch(/\.after19Access (?:small|button|em)[^{]*\{[^}]*font-size:\s*11px/)
})
