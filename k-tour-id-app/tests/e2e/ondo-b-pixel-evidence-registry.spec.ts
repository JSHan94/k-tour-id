import { execFileSync } from "node:child_process"
import { readdirSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"
import { B_FLOW_IDS } from "../helpers/ondo-b-qa"
import { B_SLEEK_VIEWPORTS, B_VISUAL_CASES } from "../helpers/ondo-b-visual-evidence"

const EXACT_STATES = [
  "ONBOARDING-VALUE", "ONBOARDING-PERSONAS", "ONBOARDING-PREFERENCES",
  "NATION", "CITY-LIVE", "CITY-LIST", "CITY-FILTERED-MAP", "CITY-FALLBACK", "PLACE-PEEK", "PLACE-DETAIL",
  "AFTER19-PROMPT", "AFTER19-VENUE-LOCKED", "AFTER19-VENUE-RETURN", "SAVE-FAILURE", "SAVE-RECOVERED",
  "GATE-ACCOUNT-FAIL", "GATE-PERSON-PASSPORT", "GATE-PERSON-CX", "GATE-PERSON-RESIDENCE-UNSUPPORTED", "GATE-AGE-FAIL", "GATE-PAYMENT", "GATE-PAYMENT-FAIL",
  "TABLES-LIST", "TABLES-VENUE-EMPTY", "TABLE-DETAIL", "TABLE-JOIN-FAIL", "CHAT", "CHAT-IMAGE-FAIL", "FEEDBACK", "REPORT",
  "LOCAL-SIGNAL-EMPTY", "LOCAL-SIGNAL-FAIL", "LOCAL-SIGNAL-SUCCESS",
  "CHECKOUT-IDLE", "CHECKOUT-CANCEL", "CHECKOUT-FAIL", "CHECKOUT-RECEIPT", "CHECKOUT-STAMP",
  "MY", "PROFILE", "TRUST-FOUR-AXES", "LABS", "LABS-TRAIT-FAIL", "LABS-BRIDGE-FAIL", "LABS-BRIDGE-SUCCESS",
] as const

const SNAPSHOT_DIRS = {
  "390x844": "ondo-b-flow-pixels-mobile.spec.ts-snapshots",
  "1440x1000": "ondo-b-flow-pixels-desktop.spec.ts-snapshots",
  "360x800": "ondo-b-flow-pixels-responsive.spec.ts-snapshots",
  "430x932": "ondo-b-flow-pixels-responsive.spec.ts-snapshots",
  "768x1024": "ondo-b-flow-pixels-responsive.spec.ts-snapshots",
  "801x1000": "ondo-b-flow-pixels-responsive.spec.ts-snapshots",
} as const

function pngSize(path: string) {
  const png = readFileSync(path)
  expect(png.subarray(1, 4).toString()).toBe("PNG")
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) }
}

test("B-EVIDENCE-REGISTRY covers FL-001..018 and every required layout family", () => {
  const coveredFlows = new Set(B_VISUAL_CASES.flatMap((item) => item.flows))
  const coveredStates = new Set(B_VISUAL_CASES.map((item) => item.state))
  expect([...B_FLOW_IDS].filter((flow) => !coveredFlows.has(flow))).toEqual([])
  expect(B_VISUAL_CASES).toHaveLength(47)
  expect([...coveredStates].sort()).toEqual([...EXACT_STATES].sort())
  expect(new Set(B_VISUAL_CASES.map((item) => item.id)).size).toBe(B_VISUAL_CASES.length)
  expect(B_VISUAL_CASES.every((item) => item.locale === "en" || item.locale === "ko")).toBe(true)
})

test("B-EVIDENCE-FINAL-INTEGRATION makes FL-002 and FL-011 reachable pixel cases", () => {
  const required = ["AFTER19-VENUE-LOCKED", "AFTER19-VENUE-RETURN", "SAVE-FAILURE", "SAVE-RECOVERED"]
  expect(required.filter((state) => !B_VISUAL_CASES.some((item) => item.state === state))).toEqual([])
  expect(B_VISUAL_CASES.filter((item) => required.includes(item.state)).every((item) => item.flows.includes(item.state.startsWith("AFTER19") ? "FL-002" : "FL-011"))).toBe(true)
  expect(B_SLEEK_VIEWPORTS.map(({ id }) => id)).toEqual(["360x800", "390x844", "430x932", "768x1024", "801x1000", "1440x1000"])
  expect(B_VISUAL_CASES.length * B_SLEEK_VIEWPORTS.length).toBe(282)
})

test("B-EVIDENCE-BASELINE-CENSUS owns exactly 282 committed, correctly sized PNGs", () => {
  const visualRoot = resolve(process.cwd(), "tests/visual")
  const responsiveFiles = readdirSync(resolve(visualRoot, SNAPSHOT_DIRS["360x800"])).filter((file) => file.endsWith(".png"))
  const mobileFiles = readdirSync(resolve(visualRoot, SNAPSHOT_DIRS["390x844"])).filter((file) => file.endsWith(".png"))
  const desktopFiles = readdirSync(resolve(visualRoot, SNAPSHOT_DIRS["1440x1000"])).filter((file) => file.endsWith(".png"))
  expect(mobileFiles).toHaveLength(47)
  expect(desktopFiles).toHaveLength(47)
  expect(responsiveFiles).toHaveLength(188)
  const tracked = execFileSync("git", ["ls-files", "--", "tests/visual/ondo-b-flow-pixels-mobile.spec.ts-snapshots/*.png", "tests/visual/ondo-b-flow-pixels-desktop.spec.ts-snapshots/*.png", "tests/visual/ondo-b-flow-pixels-responsive.spec.ts-snapshots/*.png"], { cwd: process.cwd(), encoding: "utf8" })
    .trim().split("\n").filter(Boolean)
  expect(tracked, "all 282 approved B baselines must be tracked").toHaveLength(282)

  for (const viewport of B_SLEEK_VIEWPORTS) {
    const files = viewport.id === "390x844" ? mobileFiles : viewport.id === "1440x1000" ? desktopFiles : responsiveFiles.filter((file) => file.includes(`-${viewport.id}-`))
    expect(files, `${viewport.id} baseline count`).toHaveLength(47)
    for (const item of B_VISUAL_CASES) {
      const matches = files.filter((file) => file.startsWith(`${item.id}-`) && file.includes(`-${item.locale}-${viewport.id}-`))
      expect(matches, `${viewport.id} ${item.id}`).toHaveLength(1)
      expect(pngSize(resolve(visualRoot, SNAPSHOT_DIRS[viewport.id], matches[0]))).toEqual({ width: viewport.width, height: viewport.height })
    }
  }
})
