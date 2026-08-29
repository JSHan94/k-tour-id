import { existsSync, readFileSync, readdirSync } from "node:fs"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"

const APP_ROOT = process.cwd()
const PROTECTED_A_PROJECT = "appgprj_6a69e0a4fff48191892ff4022ebf08b2"
const PROTECTED_HISTORICAL_B_PROJECT = "appgprj_6a85de65d6148191aa042ae9c2787dd2"
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

test.describe("ONDO B standalone Sites packaging contract", () => {
  test.describe.configure({ mode: "serial" })

  test("B-STANDALONE-001 declares a deterministic build, scan, and probe lane", () => {
    const manifest = JSON.parse(readFileSync(resolve(APP_ROOT, "package.json"), "utf8")) as { scripts?: Record<string, string> }
    const buildRunner = readFileSync(resolve(APP_ROOT, "scripts/ondo-b-standalone/build.mjs"), "utf8")
    expect(manifest.scripts).toMatchObject({
      "prepare:sites:ondo-b": "node scripts/ondo-b-standalone/prepare.mjs",
      "build:sites:ondo-b": "node scripts/ondo-b-standalone/build.mjs",
      "scan:sites:ondo-b": "node scripts/ondo-b-standalone/scan-artifact.mjs",
      "probe:sites:ondo-b": "node scripts/ondo-b-standalone/probe-http.mjs",
    })
    expect(manifest.scripts?.["test:visual:b"]).toContain("test:visual:b:current && pnpm test:visual:b:production && pnpm test:visual:b:legacy")
    expect(manifest.scripts?.["test:visual:b:production"]).toContain("playwright.production-visual.config.ts")
    expect(manifest.scripts?.["qa:b"]).toContain("test:e2e:a-regression")
    expect(manifest.scripts?.["qa:b"]).toContain("probe:sites:ondo-b")
    expect(buildRunner).toContain('child.once("close"')
    expect(buildRunner).not.toContain('child.once("exit"')
  })

  test("B-STANDALONE-002 keeps both existing hosting identities protected", async () => {
    const hosting = JSON.parse(readFileSync(resolve(APP_ROOT, ".openai/hosting.json"), "utf8"))
    expect(hosting).toEqual({ project_id: PROTECTED_A_PROJECT, d1: null, r2: null })
    const scripts = ["prepare.mjs", "build.mjs", "scan-artifact.mjs", "probe-http.mjs", "policy.mjs"]
      .map((file) => readFileSync(resolve(APP_ROOT, "scripts/ondo-b-standalone", file), "utf8"))
      .join("\n")
    expect(scripts).toContain("ONDO_B_SITE_PROJECT_ID")
    expect(scripts).not.toContain(PROTECTED_A_PROJECT)
    expect(scripts).toContain(PROTECTED_HISTORICAL_B_PROJECT)

    const { prepareStandaloneSource } = await import("../../scripts/ondo-b-standalone/prepare.mjs")
    await expect(prepareStandaloneSource({ projectId: PROTECTED_A_PROJECT })).rejects.toThrow("existing protected project identity")
    await expect(prepareStandaloneSource({ projectId: PROTECTED_HISTORICAL_B_PROJECT })).rejects.toThrow("existing protected project identity")
  })

  test("B-STANDALONE-003 prepared source contains the complete current /ondo-b closure", async () => {
    const { assertStandaloneLocalImportClosure, prepareStandaloneSource } = await import("../../scripts/ondo-b-standalone/prepare.mjs")
    await prepareStandaloneSource({ projectId: "appgprj_local_ondo_b_artifact" })
    const closure = await assertStandaloneLocalImportClosure()
    expect(closure.scannedFileCount).toBeGreaterThan(0)
    expect(closure.localImportCount).toBeGreaterThan(0)

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
    expect(files).toContain("features/ondo/onboarding/official-directory-onboarding.tsx")
    expect(files).toContain("features/ondo/onboarding/official-directory-onboarding.module.css")
    expect(files.filter((file) => file.startsWith("public/"))).toEqual([
      "public/brand/ondo-lockup.svg",
      "public/brand/ondo-mark-inverse.svg",
      "public/brand/ondo-mark-micro-24.svg",
      "public/brand/ondo-mark.svg",
      "public/editorial/japan-first-c01-sesame-oil.jpg",
      "public/editorial/japan-first-c03-seoul-eight-hours.jpg",
      "public/editorial/japan-first-c06-beauty-research.jpg",
      "public/editorial/japan-first-c18-jeju-screen-route.jpg",
      "public/editorial/japan-first-c20-jeju-kpop-route.jpg",
      "public/editorial/people/ondo-my-korea-inspiration-v2-landscape.jpg",
      "public/editorial/people/ondo-onboarding-travelers-v2-landscape.jpg",
      "public/editorial/people/ondo-tables-dinner-v2-landscape.jpg",
      "public/og-ondo-directory.png",
    ])
    expect(files).toContain("features/ondo/identity-b/local-check-walkthrough-b.tsx")
    expect(files).toContain("features/ondo/identity-b/traveler-id-entry-b.tsx")
    expect(files).toContain("features/ondo/local-signal-b/local-signal-layer-b.tsx")
    for (const file of [
      "features/ondo/after19/after19-global-b-model.ts",
      "features/ondo/after19/after19-global-b.tsx",
      "features/ondo/after19/after19-global-b.module.css",
      "features/ondo/after19/after19-place-return-b-model.ts",
      "features/ondo/identity-b/action-gate-contract-b.ts",
      "features/ondo/identity-b/action-gate-coordinator-b.tsx",
      "features/ondo/identity-b/action-gate-coordinator-b.module.css",
      "features/ondo/identity-b/activity-profile-b-provider.tsx",
      "features/ondo/identity-b/profile-reputation-b.tsx",
      "features/ondo/identity-b/profile-reputation-b.module.css",
      "features/ondo/pulse-b/pulse-model-b.ts",
      "features/ondo/commerce-b/stable-commerce-model-b.ts",
      "features/ondo/commerce-b/id-wallet-commerce-b.tsx",
      "features/ondo/commerce-b/id-wallet-commerce-b.module.css",
      "features/ondo/commerce-b/visit-stamp-receipt-b.tsx",
      "features/ondo/commerce-b/visit-stamp-receipt-b.module.css",
      "features/ondo/labs/labs-entry.tsx",
      "features/ondo/labs/labs-model.ts",
      "features/ondo/labs/labs.module.css",
      "features/ondo/place/editorial-place-mount-b.tsx",
      "features/ondo/place/editorial-place-overlay-b.tsx",
      "features/ondo/place/editorial-place-overlay-b.module.css",
    ]) expect(files, `${file} is required positive standalone content`).toContain(file)
  })

  test("B-STANDALONE-004 generated package stays isolated from retired providers and routes", async () => {
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

    expect(source).not.toMatch(/AppProvider|LangProvider|LocationProvider|WalletProvider|useOndo\b|ondo-provider|demo-journey|mock-data|features\/ondo\/(?:commerce\/|identity\/|rewards\/|trust\/|fixtures\/)/i)
    expect(source).toContain("export function LabsEntryB()")
    expect(source).not.toContain("export function LabsEntry()")
    expect(source).toContain("export function SheetB(")
    expect(source).not.toContain("export function Sheet(")
    expect(source).not.toMatch(/(?:^|["'`])\/(?:demo|wallet|ondo|ask|chat|connect|partner|profile|services|pass|present|journey|benefits|architecture|evidence)(?:[/?"'`]|$)/im)
    expect(visibleSource).toContain("OOKRW Test is a non-live product balance")
    expect(visibleSource).toContain("This flow contacts no wallet, merchant, stablecoin network or payment provider and moves no money")
    expect(visibleSource).toContain("This offer comes from ONDO, not the official place record or venue")
  })

  test("B-STANDALONE-005 scanner rejects exact compiled legacy UI identifiers while source-only truth types remain allowed", async () => {
    const { LEGACY_ARTIFACT_TEXT } = await import("../../scripts/ondo-b-standalone/policy.mjs")
    const blocked = [
      "{\"simulation\":null}",
      "CheckoutOverlay",
      "ChatOverlay",
      "RewardsEntry",
      "LabsEntry",
      "demo-journey",
      "WalletProvider",
      "k-tour-id.wallet",
    ]
    for (const sample of blocked) {
      expect(LEGACY_ARTIFACT_TEXT.some((pattern: RegExp) => pattern.test(sample)), sample).toBe(true)
    }
    for (const requiredTruth of ["K-Tour ID ready", "Passport eKYC"]) {
      expect(LEGACY_ARTIFACT_TEXT.some((pattern: RegExp) => pattern.test(requiredTruth)), requiredTruth).toBe(false)
    }

    const contracts = readFileSync(resolve(APP_ROOT, "lib/ondo/venues/contracts.ts"), "utf8")
    expect(contracts).toContain("simulation: null")
  })

  test("B-STANDALONE-006 prepared onboarding CSS contains the B-native guest setup and no false-provider surface", async () => {
    await (await import("../../scripts/ondo-b-standalone/prepare.mjs")).prepareStandaloneSource({ projectId: "appgprj_local_ondo_b_artifact" })
    const css = readFileSync(resolve(STAGE_ROOT, "features/ondo/onboarding/official-directory-onboarding.module.css"), "utf8")
    expect(css).toContain(".sourceIntro")
    expect(css).toContain(":global([data-variant=\"B\"]) .layer")
    expect(css).toContain(".personaSelected")
    expect(css).toContain(".preferenceGroups")
    expect(css).not.toMatch(/(?:KYC|payment|chat|reward|Labs|After19|demo|simulation)/i)
    const details = readFileSync(resolve(STAGE_ROOT, "data/ondo-venues/canonical-venues.json"), "utf8")
    expect(details).not.toMatch(/"simulation"\s*:/i)
    const shell = readFileSync(resolve(STAGE_ROOT, "features/ondo/app/ondo-shell.module.css"), "utf8")
    expect(shell).toContain('.content[data-active-tab="tables"]')
    expect(shell).toContain('.content[data-active-tab="settings"]')
    expect(shell).toContain("grid-template-columns: repeat(5, 1fr)")
  })

  test("B-STANDALONE-007 policy preserves legacy rejection without denying P0 journey modules", async () => {
    const policy = await import("../../scripts/ondo-b-standalone/policy.mjs") as Record<string, unknown>
    expect(policy).not.toHaveProperty("BANNED_ARTIFACT_PATH")
    expect(policy).not.toHaveProperty("BANNED_ARTIFACT_TEXT")

    const { LEGACY_ARTIFACT_PATH, LEGACY_ARTIFACT_TEXT } = policy as {
      LEGACY_ARTIFACT_PATH: RegExp
      LEGACY_ARTIFACT_TEXT: readonly RegExp[]
    }
    for (const path of [
      "features/ondo/after19/after19-layer.tsx",
      "features/ondo/connect/tables-entry.tsx",
      "features/ondo/identity/identity-entry.tsx",
      "features/ondo/identity-b/profile-reputation-b.tsx",
      "features/ondo/identity-b/profile-reputation-b.module.css",
      "features/ondo/pulse-b/pulse-model-b.ts",
      "features/ondo/commerce-b/stable-commerce-model-b.ts",
    ]) {
      expect(LEGACY_ARTIFACT_PATH.test(path), path).toBe(false)
    }
    for (const symbol of [
      "After19Layer",
      "TablesEntry",
      "ConnectOverlays",
      "GateOverlay",
      "IdentityEntry",
      "Pulse",
      "Too Hot",
      "ID Wallet",
      "payment",
      "benefit",
      "voucher",
      "refund",
      "settlement",
      "OOKRW",
      "ONDO demo meal offer",
      "truthful preview",
    ]) {
      expect(LEGACY_ARTIFACT_TEXT.some((pattern) => pattern.test(symbol)), symbol).toBe(false)
    }
  })

  test("B-STANDALONE-008 current closure ships B-native Pulse Table, After19, and exact return modules", async () => {
    const { SOURCE_FILES } = await import("../../scripts/ondo-b-standalone/policy.mjs")
    for (const path of [
      "features/ondo/connect/tables-entry-b.tsx",
      "features/ondo/connect/pulse-table-b.module.css",
      "features/ondo/after19/after19-global-b-model.ts",
      "features/ondo/after19/after19-global-b.tsx",
      "features/ondo/after19/after19-place-return-b-model.ts",
      "features/ondo/identity-b/action-gate-contract-b.ts",
      "features/ondo/identity-b/action-gate-coordinator-b.tsx",
      "features/ondo/identity-b/action-gate-coordinator-b.module.css",
      "features/ondo/contracts/return-to-b.ts",
    ]) expect(SOURCE_FILES, `${path} must ship with /ondo-b`).toContain(path)
  })

  test("B-STANDALONE-009 current closure also ships B-native Local Signal and Traveler ID modules", async () => {
    const { SOURCE_FILES } = await import("../../scripts/ondo-b-standalone/policy.mjs")
    for (const path of [
      "features/ondo/identity-b/local-check-walkthrough-b.tsx",
      "features/ondo/identity-b/local-check-walkthrough-b.module.css",
      "features/ondo/identity-b/traveler-id-entry-b.tsx",
      "features/ondo/identity-b/traveler-id-entry-b.module.css",
      "features/ondo/local-signal-b/local-signal-layer-b.tsx",
      "features/ondo/local-signal-b/local-signal-layer-b.module.css",
      "features/ondo/after19/after19-global-b-model.ts",
      "features/ondo/after19/after19-global-b.tsx",
      "features/ondo/after19/after19-global-b.module.css",
      "features/ondo/after19/after19-place-return-b-model.ts",
      "features/ondo/identity-b/action-gate-contract-b.ts",
      "features/ondo/identity-b/action-gate-coordinator-b.tsx",
      "features/ondo/identity-b/action-gate-coordinator-b.module.css",
    ]) expect(SOURCE_FILES, `${path} must ship with /ondo-b`).toContain(path)
  })

  test("B-STANDALONE-010 current closure positively ships Pulse and B-native commerce state/UI/CSS", async () => {
    const { SOURCE_FILES } = await import("../../scripts/ondo-b-standalone/policy.mjs")
    for (const path of [
      "features/ondo/pulse-b/pulse-model-b.ts",
      "features/ondo/commerce-b/stable-commerce-model-b.ts",
      "features/ondo/commerce-b/id-wallet-commerce-b.tsx",
      "features/ondo/commerce-b/id-wallet-commerce-b.module.css",
    ]) expect(SOURCE_FILES, `${path} must ship with /ondo-b`).toContain(path)
  })

  test("B-STANDALONE-011 ships optional OpenDID setup and every referenced editorial brand asset", async () => {
    const { PUBLIC_FILES, SOURCE_FILES } = await import("../../scripts/ondo-b-standalone/policy.mjs")
    for (const path of [
      "features/ondo/identity-b/ktour-id-setup-b.tsx",
      "features/ondo/identity-b/ktour-id-setup-b.module.css",
      "features/ondo/identity-b/ktour-id-setup-model-b.ts",
    ]) expect(SOURCE_FILES, `${path} must ship with /ondo-b`).toContain(path)
    for (const path of [
      "public/brand/ondo-lockup.svg",
      "public/brand/ondo-mark.svg",
      "public/brand/ondo-mark-inverse.svg",
      "public/brand/ondo-mark-micro-24.svg",
      "public/editorial/people/ondo-my-korea-inspiration-v2-landscape.jpg",
      "public/editorial/people/ondo-onboarding-travelers-v2-landscape.jpg",
      "public/editorial/people/ondo-tables-dinner-v2-landscape.jpg",
    ]) expect(PUBLIC_FILES, `${path} is referenced by the shipped UI`).toContain(path)
  })

  test("B-STANDALONE-012 positively ships B Labs while exact legacy Labs symbols remain denied", async () => {
    const { LEGACY_ARTIFACT_PATH, LEGACY_ARTIFACT_TEXT, REQUIRED_B_NATIVE_LABS_FILES, SOURCE_FILES } = await import("../../scripts/ondo-b-standalone/policy.mjs")
    const required = [
      "features/ondo/contracts/commerce.ts",
      "features/ondo/contracts/domain.ts",
      "features/ondo/contracts/evidence.ts",
      "features/ondo/labs/labs-entry.tsx",
      "features/ondo/labs/labs-model.ts",
      "features/ondo/labs/labs.module.css",
      "features/ondo/shared/ui/sheet-b.tsx",
      "features/ondo/shared/ui/ui.module.css",
      "features/ondo/shared/ui/use-qa-controls.ts",
    ]
    expect(REQUIRED_B_NATIVE_LABS_FILES).toEqual(required)
    for (const path of required) expect(SOURCE_FILES, `${path} must ship with /ondo-b`).toContain(path)
    for (const path of required) expect(LEGACY_ARTIFACT_PATH.test(path), `${path} is positive closure, not a retired path`).toBe(false)
    for (const validProductTerm of ["Labs", "LabsEntryB", "LABS · SIMULATED"]) {
      expect(LEGACY_ARTIFACT_TEXT.some((pattern: RegExp) => pattern.test(validProductTerm)), validProductTerm).toBe(false)
    }
    expect(LEGACY_ARTIFACT_TEXT.some((pattern: RegExp) => pattern.test("LabsEntry"))).toBe(true)
  })

  test("B-STANDALONE-013 ships the My Korea cartographic memory without a parallel data source", async () => {
    const { SOURCE_FILES } = await import("../../scripts/ondo-b-standalone/policy.mjs")
    for (const path of [
      "features/ondo/my/korea-memory-map-b.tsx",
      "features/ondo/my/korea-memory-map-b.module.css",
    ]) expect(SOURCE_FILES, `${path} must ship with /ondo-b`).toContain(path)
  })

  test("B-STANDALONE-014 staged local-import closure rejects an unresolved dependency", async () => {
    const fixtureRoot = await mkdtemp(resolve(tmpdir(), "ondo-b-source-closure-"))
    try {
      await mkdir(resolve(fixtureRoot, "feature"))
      await writeFile(resolve(fixtureRoot, "feature/entry.ts"), 'import "./missing"\n')
      const { assertStandaloneLocalImportClosure } = await import("../../scripts/ondo-b-standalone/prepare.mjs")
      await expect(assertStandaloneLocalImportClosure(fixtureRoot)).rejects.toThrow("missing local import ./missing from feature/entry.ts")
      await writeFile(resolve(fixtureRoot, "feature/missing.ts"), "export const staged = true\n")
      await expect(assertStandaloneLocalImportClosure(fixtureRoot)).resolves.toMatchObject({ scannedFileCount: 2, localImportCount: 1 })
    } finally {
      await rm(fixtureRoot, { recursive: true, force: true })
    }
  })
})
