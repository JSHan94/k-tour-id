import { existsSync, readFileSync, readdirSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"

const APP_ROOT = process.cwd()
const PROTECTED_A_PROJECT = "appgprj_6a69e0a4fff48191892ff4022ebf08b2"
const STAGE_ROOT = resolve(APP_ROOT, ".ondo-b-standalone")

function filesBelow(root: string, prefix = ""): string[] {
  if (!existsSync(root)) return []
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name
    return entry.isDirectory()
      ? filesBelow(resolve(root, entry.name), relative)
      : [relative]
  }).sort()
}

test.describe("ONDO B standalone Sites packaging", () => {
  test.describe.configure({ mode: "serial" })

  test("B-STANDALONE-001 declares a deterministic B-only build, scan, and probe lane", () => {
    const manifest = JSON.parse(readFileSync(resolve(APP_ROOT, "package.json"), "utf8")) as {
      scripts?: Record<string, string>
    }
    expect(manifest.scripts).toMatchObject({
      "prepare:sites:ondo-b": "node scripts/ondo-b-standalone/prepare.mjs",
      "build:sites:ondo-b": "node scripts/ondo-b-standalone/build.mjs",
      "scan:sites:ondo-b": "node scripts/ondo-b-standalone/scan-artifact.mjs",
      "probe:sites:ondo-b": "node scripts/ondo-b-standalone/probe-http.mjs",
    })
    for (const script of ["prepare.mjs", "build.mjs", "scan-artifact.mjs", "probe-http.mjs", "policy.mjs"]) {
      expect(existsSync(resolve(APP_ROOT, "scripts/ondo-b-standalone", script)), script).toBe(true)
    }
  })

  test("B-STANDALONE-002 keeps the checked-in A hosting identity byte-for-byte protected", () => {
    const hosting = JSON.parse(readFileSync(resolve(APP_ROOT, ".openai/hosting.json"), "utf8")) as {
      project_id?: string
      d1?: unknown
      r2?: unknown
    }
    expect(hosting).toEqual({ project_id: PROTECTED_A_PROJECT, d1: null, r2: null })

    const scripts = filesBelow(resolve(APP_ROOT, "scripts/ondo-b-standalone"))
      .map((file) => readFileSync(resolve(APP_ROOT, "scripts/ondo-b-standalone", file), "utf8"))
      .join("\n")
    expect(scripts).toContain("ONDO_B_SITE_PROJECT_ID")
    expect(scripts).not.toContain(PROTECTED_A_PROJECT)
  })

  test("B-STANDALONE-003 prepared source contains only the production route and canonical venue API", async () => {
    const { prepareStandaloneSource } = await import("../../scripts/ondo-b-standalone/prepare.mjs")
    await prepareStandaloneSource({ projectId: "appgprj_local_ondo_b_artifact" })

    const routeFiles = filesBelow(resolve(STAGE_ROOT, "app"))
      .filter((file) => /(?:page|route|layout)\.(?:ts|tsx)$/.test(file))
    expect(routeFiles).toEqual([
      "api/ondo/venues/[venueId]/route.ts",
      "layout.tsx",
      "ondo-b/page.tsx",
      "page.tsx",
    ])

    const files = filesBelow(STAGE_ROOT)
    expect(files).toContain("public/og-ondo-directory.png")
    expect(files).toContain("features/ondo/onboarding/official-directory-onboarding.module.css")
    expect(files).not.toContain("features/ondo/onboarding/onboarding.module.css")
    expect(files.filter((file) => file.startsWith("public/"))).toEqual([
      "public/og-ondo-directory.png",
    ])
    expect(files.some((file) => /(^|\/)(?:demo|wallet|ask|chat|connect|partner|profile|labs|commerce|identity|after19|fixtures)(\/|\.)/i.test(file))).toBe(false)
  })

  test("B-STANDALONE-004 generated package is explicitly isolated from legacy providers and routes", async () => {
    await (await import("../../scripts/ondo-b-standalone/prepare.mjs")).prepareStandaloneSource({ projectId: "appgprj_local_ondo_b_artifact" })
    const sourceFiles = filesBelow(STAGE_ROOT)
      .filter((file) => /\.(?:ts|tsx|js|mjs|json)$/.test(file))
    const source = sourceFiles
      .map((file) => `${file}\n${readFileSync(resolve(STAGE_ROOT, file), "utf8")}`)
      .join("\n")
    const visibleSource = sourceFiles
      .filter((file) => file.endsWith(".tsx"))
      .map((file) => readFileSync(resolve(STAGE_ROOT, file), "utf8"))
      .join("\n")

    expect(source).not.toMatch(/AppProvider|LangProvider|LocationProvider|demo-journey|mock-data|features\/ondo\/(?:after19|commerce|connect|identity|labs|rewards|trust|fixtures)/i)
    expect(source).not.toMatch(/(?:^|["'`])\/(?:demo|wallet|ondo|ask|chat|connect|partner|profile|services|pass|present|journey|benefits|architecture|evidence)(?:[/?"'`]|$)/im)
    expect(visibleSource).not.toMatch(/\bdemo(?:nstration)?\b|\bsimulat(?:e|ed|es|ing|ion|ions)\b|데모|시뮬레이션|모의\s*(?:성공|결제|인증)/i)
  })

  test("B-STANDALONE-005 scanner rejects exact compiled legacy UI identifiers while source-only truth types remain allowed", async () => {
    const { BANNED_ARTIFACT_TEXT } = await import("../../scripts/ondo-b-standalone/policy.mjs")
    const blocked = [
      "{\"simulation\":null}",
      "CheckoutOverlay",
      "Payment KYC",
      "ChatOverlay",
      "RewardsEntry",
      "LabsEntry",
      "After19Layer",
      "demo-journey",
    ]
    for (const sample of blocked) {
      expect(BANNED_ARTIFACT_TEXT.some((pattern: RegExp) => pattern.test(sample)), sample).toBe(true)
    }

    const contracts = readFileSync(resolve(APP_ROOT, "lib/ondo/venues/contracts.ts"), "utf8")
    expect(contracts).toContain("simulation: null")
  })

  test("B-STANDALONE-006 prepared onboarding CSS contains the B-native guest setup and no external-product surface", async () => {
    await (await import("../../scripts/ondo-b-standalone/prepare.mjs")).prepareStandaloneSource({ projectId: "appgprj_local_ondo_b_artifact" })
    const css = readFileSync(resolve(STAGE_ROOT, "features/ondo/onboarding/official-directory-onboarding.module.css"), "utf8")
    expect(css).toContain(".sourceIntro")
    expect(css).toContain(":global([data-variant=\"B\"]) .layer")
    expect(css).toContain(".personaSelected")
    expect(css).toContain(".preferenceGroups")
    expect(css).not.toMatch(/(?:KYC|payment|chat|reward|Labs|After19|demo|simulation)/i)
    const details = readFileSync(resolve(STAGE_ROOT, "data/ondo-venues/canonical-venues.json"), "utf8")
    expect(details).not.toMatch(/"simulation"\s*:/i)
  })
})
