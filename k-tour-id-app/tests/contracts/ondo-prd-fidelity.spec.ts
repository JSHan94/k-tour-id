import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { dirname, extname, relative, resolve } from "node:path"
import { expect, test } from "@playwright/test"
import { CANONICAL_MAP_VENUES_COMPACT } from "../../lib/ondo/venues/map-data"
import { sanitizeLocalSignalVenueIds } from "../../features/ondo/my/my-korea-model"
import { ONDO_DEFERRED, ONDO_MUST_LIVE } from "../helpers/ondo-prd-fidelity"

const APP_ROOT = process.cwd()
const ROUTE_ENTRY = resolve(APP_ROOT, "app/page.tsx")
const STAGE_ROOT = resolve(APP_ROOT, ".ondo-b-standalone")
const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".css", ".json"] as const

function localImportTargets(source: string) {
  const pattern = /(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g
  return [...source.matchAll(pattern)].map((match) => match[1]).filter((target) => target.startsWith(".") || target.startsWith("@/"))
}

function resolveSource(importer: string, target: string) {
  const base = target.startsWith("@/") ? resolve(APP_ROOT, target.slice(2)) : resolve(dirname(importer), target)
  const candidates = extname(base)
    ? [base]
    : [...SOURCE_EXTENSIONS.map((extension) => `${base}${extension}`), ...SOURCE_EXTENSIONS.map((extension) => resolve(base, `index${extension}`))]
  return candidates.find((candidate) => existsSync(candidate)) ?? null
}

function routeImportGraph() {
  const pending = [ROUTE_ENTRY]
  const visited = new Set<string>()
  while (pending.length > 0) {
    const file = pending.pop()
    if (!file || visited.has(file)) continue
    visited.add(file)
    for (const target of localImportTargets(readFileSync(file, "utf8"))) {
      const dependency = resolveSource(file, target)
      if (dependency && !visited.has(dependency)) pending.push(dependency)
    }
  }
  return [...visited].sort()
}

function filesBelow(root: string, prefix = ""): string[] {
  if (!existsSync(root)) return []
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name
    return entry.isDirectory() ? filesBelow(resolve(root, entry.name), path) : [path]
  }).sort()
}

function source(path: string) {
  return readFileSync(resolve(APP_ROOT, path), "utf8")
}

function runProbe(mode: "pulse" | "meal") {
  const result = spawnSync("pnpm", ["exec", "tsx", "tests/helpers/ondo-fidelity-runtime-probe.ts", mode], {
    cwd: APP_ROOT,
    encoding: "utf8",
    env: process.env,
  })
  expect(result.status, result.stderr || result.stdout || `${mode} runtime probe failed`).toBe(0)
  return JSON.parse(result.stdout) as Record<string, any>
}

const liveFiles = routeImportGraph()
const livePaths = liveFiles.map((file) => relative(APP_ROOT, file))
const liveSource = liveFiles.map((file) => readFileSync(file, "utf8")).join("\n")

const appSource = source

function expectReachable(path: string) {
  expect(livePaths, `${path} must be reachable from canonical app/page.tsx; a detached file cannot satisfy fidelity`).toContain(path)
}

function expectLiveEvidence(evidence: readonly string[]) {
  for (const token of evidence) {
    expect(liveSource, `missing live canonical / evidence: ${token}`).toContain(token)
  }
}

test("FID-G0-001 inventory is additive and independently matches the golden must-live contract", () => {
  expect(ONDO_MUST_LIVE.map((item) => item.id)).toEqual([
    "ONDO-G0-GUEST-DISCOVERY",
    "ONDO-G0-ONBOARDING",
    "ONDO-G0-PULSE-HOT",
    "ONDO-G0-MY-KOREA",
    "ONDO-G0-LOCAL-SIGNAL-PULSE",
    "ONDO-G0-TABLE",
    "ONDO-G0-AFTER19",
    "ONDO-G0-ID-WALLET",
    "ONDO-G0-MEAL-OFFER",
    "ONDO-G0-PAYMENT",
    "ONDO-G0-BENEFIT-VOUCHER",
    "ONDO-G0-REFUND-SETTLEMENT",
    "ONDO-G0-AI-BENEFIT-PREVIEW",
    "ONDO-G0-RETURN-TO",
    "ONDO-G0-INCLUSIVE-WEB",
  ])
  expect(ONDO_MUST_LIVE.every((item) => item.removalPolicy === "FAIL_RELEASE")).toBe(true)
})

test("FID-G0-002 actual integrations are deferred without deferring wallet, payment, voucher, or refund UX", () => {
  expect(ONDO_DEFERRED.map((item) => item.id)).toEqual([
    "ONDO-EXT-REAL-IDENTITY",
    "ONDO-EXT-REAL-MONEY-CHAIN-BACKEND",
    "ONDO-EXT-BROAD-SERVICE-INTEGRATIONS",
  ])
  expect(ONDO_DEFERRED.every((item) => item.removalPolicy === "DEFER_IMPLEMENTATION_ONLY")).toBe(true)
  expect(ONDO_DEFERRED.map((item) => item.journey).join(" ")).not.toMatch(/^(?:wallet|payment|voucher|refund)$/i)
})

test("FID-G0-003 guest discovery and onboarding remain reachable without identity or payment gates", () => {
  for (const path of [
    "features/ondo/map/map-entry-b.tsx",
    "features/ondo/place/canonical-place-overlay.tsx",
    "features/ondo/onboarding/official-directory-onboarding.tsx",
  ]) expectReachable(path)
  expect(CANONICAL_MAP_VENUES_COMPACT.filter((venue) => venue.cityId === "seoul")).toHaveLength(200)
  expect(CANONICAL_MAP_VENUES_COMPACT.filter((venue) => venue.cityId === "busan")).toHaveLength(200)
  for (const path of ["features/ondo/map/map-entry-b.tsx", "features/ondo/place/canonical-place-overlay.tsx"]) {
    expect(source(path)).not.toMatch(/beginAction\(|ondo-gate-overlay|paymentKyc/)
  }
})

test("FID-G0-004 every existing and restored golden surface is reachable from canonical /", () => {
  for (const path of [
    "features/ondo/my/saved-entry-b.tsx",
    "features/ondo/my/my-korea-model.ts",
    "features/ondo/local-signal-b/local-signal-layer-b.tsx",
    "features/ondo/connect/tables-entry-b.tsx",
    "features/ondo/after19/after19-global-b.tsx",
    "features/ondo/identity-b/action-gate-coordinator-b.tsx",
    "features/ondo/identity-b/activity-profile-b-provider.tsx",
    "features/ondo/identity-b/profile-reputation-b.tsx",
    "features/ondo/identity-b/traveler-id-entry-b.tsx",
    "features/ondo/contracts/return-to-b.ts",
    "features/ondo/pulse-b/pulse-model-b.ts",
    "features/ondo/commerce-b/stable-commerce-model-b.ts",
    "features/ondo/commerce-b/id-wallet-commerce-b.tsx",
    "features/ondo/commerce-b/visit-stamp-receipt-b.tsx",
    "features/ondo/labs/labs-entry.tsx",
  ]) expectReachable(path)
})

test("FID-STATE-001 curated Pulse truth and separate Local Signal evidence are executable", () => {
  const result = runProbe("pulse")
  expect(result.peak).toMatchObject({
    venueId: "mois-0021cd596bc5b2a922ad", level: "peak", score: 91, signalCount: 24,
    updatedAt: "2026-08-25T02:20:00.000Z", freshness: "curated-snapshot", confidence: "high",
    evidence: expect.arrayContaining([expect.objectContaining({ origin: "curated-walkthrough" })]), localEvidence: null,
  })
  expect(result.hot).toMatchObject({
    venueId: "mois-0348cfe16225dbbcec8a", level: "hot", score: 84, signalCount: 19,
    updatedAt: "2026-08-25T02:05:00.000Z", freshness: "curated-snapshot", confidence: "high",
    evidence: expect.arrayContaining([expect.objectContaining({ origin: "curated-walkthrough" })]), localEvidence: null,
  })
  expect(result.uncurated).toMatchObject({ level: "limited", score: null, signalCount: null, updatedAt: null, freshness: "limited", confidence: "limited", evidence: [], localEvidence: null })
  expect(result.afterUniqueLocalPost).toMatchObject({
    venueId: result.peak.venueId,
    level: result.peak.level,
    score: result.peak.score,
    signalCount: result.peak.signalCount,
    updatedAt: result.peak.updatedAt,
    freshness: result.peak.freshness,
    confidence: result.peak.confidence,
    evidence: expect.arrayContaining([expect.objectContaining({ origin: "local-device" })]),
    localEvidence: expect.objectContaining({ origin: "local-device" }),
  })
  expect(result.afterDuplicateLocalPost).toEqual(result.afterUniqueLocalPost)
  expect(sanitizeLocalSignalVenueIds([result.peak.venueId, result.peak.venueId])).toEqual([result.peak.venueId])
})

test("FID-STATE-002 deterministic payment reducer covers success, fail/retry, insufficient, and double-click idempotency", () => {
  const result = runProbe("meal")
  expect(result.initial).toMatchObject({
    quoteDebit: 22, holderBalance: 60, merchantSettlement: 0,
    state: {
      status: "idle", providerOrder: "NOT_CONNECTED", voucher: "available", confirmationPending: false, confirmationCount: 0,
      receiptCount: 0, refundCount: 0, chargedDebit: 0, receiptId: null, lastOutcome: null, ledger: [],
    },
  })
  expect(result.success).toMatchObject({
    quoteDebit: 19, holderBalance: 41, merchantSettlement: 19,
    state: {
      status: "paid", providerOrder: "NOT_CONNECTED", voucher: "consumed", confirmationPending: false, confirmationCount: 1,
      receiptCount: 1, refundCount: 0, chargedDebit: 19, receiptId: "ONDO-LOCAL-20260825-001", lastOutcome: "success",
    },
  })
  expect(result.successReplay).toEqual(result.success)
  expect(result.success.state.ledger).toHaveLength(2)
  expect(new Set(result.success.state.ledger.map((entry: any) => entry.receiptId))).toEqual(new Set(["ONDO-LOCAL-20260825-001"]))
  expect(result.success.state.ledger.map((entry: any) => entry.amount)).toEqual([-19, 19])

  for (const [snapshot, outcome] of [[result.failed, "failure"], [result.insufficient, "insufficient"]] as const) {
    expect(snapshot).toMatchObject({
      holderBalance: 60, merchantSettlement: 0,
      state: { status: "idle", voucher: "selected", receiptCount: 0, chargedDebit: 0, receiptId: null, lastOutcome: outcome, ledger: [] },
    })
  }
  expect(result.retried).toMatchObject({ holderBalance: 41, merchantSettlement: 19, state: { status: "paid", voucher: "consumed", receiptCount: 1, chargedDebit: 19, lastOutcome: "success" } })
})

test("FID-STATE-003 one-use voucher, refund restoration, and holder/merchant mirror are executable", () => {
  const result = runProbe("meal")
  expect(result.benefitSelected).toMatchObject({ quoteDebit: 19, holderBalance: 60, merchantSettlement: 0, state: { status: "idle", voucher: "selected", receiptCount: 0, ledger: [] } })
  expect(result.confirmed).toMatchObject({ quoteDebit: 19, holderBalance: 60, merchantSettlement: 0, state: { confirmationPending: true, confirmationCount: 1, voucher: "selected", ledger: [] } })

  expect(result.refunded).toMatchObject({
    quoteDebit: 22, holderBalance: 60, merchantSettlement: 0,
    state: { status: "refunded", providerOrder: "NOT_CONNECTED", voucher: "available", receiptCount: 1, refundCount: 1, chargedDebit: 19, receiptId: "ONDO-LOCAL-20260825-001", lastOutcome: "success" },
  })
  expect(result.refunded.state.ledger).toHaveLength(4)
  for (const kind of ["PAYMENT", "REFUND"]) {
    const pair = result.refunded.state.ledger.filter((entry: any) => entry.kind === kind)
    expect(pair).toHaveLength(2)
    expect(new Set(pair.map((entry: any) => entry.operationId)).size).toBe(1)
    expect(new Set(pair.map((entry: any) => entry.receiptId)).size).toBe(1)
    expect(pair.reduce((sum: number, entry: any) => sum + entry.amount, 0)).toBe(0)
  }
  expect(result.refundReplay).toEqual(result.refunded)
})

test("FID-PACK-001 standalone policy positively includes every restored golden module and may not ban journey names", async () => {
  const policy = await import("../../scripts/ondo-b-standalone/policy.mjs") as {
    SOURCE_FILES: readonly string[]
    LEGACY_ARTIFACT_PATH: RegExp
    LEGACY_ARTIFACT_TEXT: readonly RegExp[]
  }
  const required = [
    "features/ondo/pulse-b/pulse-model-b.ts",
    "features/ondo/commerce-b/stable-commerce-model-b.ts",
    "features/ondo/commerce-b/id-wallet-commerce-b.tsx",
    "features/ondo/commerce-b/id-wallet-commerce-b.module.css",
  ]
  for (const path of required) {
    expect(policy.SOURCE_FILES, `${path} must be positively shipped`).toContain(path)
    expect(policy.LEGACY_ARTIFACT_PATH.test(path), `${path} must not be rejected by a name denylist`).toBe(false)
  }
  for (const productTerm of ["Pulse", "Too Hot", "After19", "ID Wallet", "payment", "benefit", "voucher", "refund", "settlement", "OOKRW", "ONDO demo meal offer"]) {
    expect(policy.LEGACY_ARTIFACT_TEXT.some((pattern) => pattern.test(productTerm)), `${productTerm} is a required journey, not legacy evidence`).toBe(false)
  }
})

test("FID-PACK-002 standalone positive closure names real reachable source files", async () => {
  const { SOURCE_FILES } = await import("../../scripts/ondo-b-standalone/policy.mjs")
  for (const path of [
    "features/ondo/pulse-b/pulse-model-b.ts",
    "features/ondo/commerce-b/stable-commerce-model-b.ts",
    "features/ondo/commerce-b/id-wallet-commerce-b.tsx",
    "features/ondo/commerce-b/id-wallet-commerce-b.module.css",
  ]) {
    expect(existsSync(resolve(APP_ROOT, path)), `${path} must exist as product source`).toBe(true)
    expect(SOURCE_FILES, `${path} must be copied by standalone preparation`).toContain(path)
    expect(livePaths, `${path} must be reachable before packaging`).toContain(path)
  }
})

test("FID-P0-012 ID · Wallet and truthful stable checkout are live B-native journeys", () => {
  expectReachable("features/ondo/commerce-b/stable-commerce-model-b.ts")
  expectReachable("features/ondo/commerce-b/id-wallet-commerce-b.tsx")
  expectReachable("features/ondo/commerce-b/id-wallet-commerce-b.module.css")
  expectLiveEvidence([
    "ondo-b-id-wallet-commerce",
    "travel-pass-status",
    "wallet-balance",
    "wallet-benefit",
    "wallet-activity",
    "wallet-link-open",
    "wallet-connect-sheet",
    "wallet-link-retry",
    "OOKRW",
    "payment-minimum-consent",
    "payment-confirm",
    "payment-cancel",
    "payment-recovery",
    "payment-retry",
    "payment-receipt",
    "commerce-provider-status",
    "NOT_CONNECTED",
    "payment-refund",
    "canonical-meal-benefit-open",
    "commerce-origin-return",
    "__ONDO_B_QA__",
  ])
})

test("FID-P0-013 commerce boundary and persistence rules cannot be weakened", () => {
  const commerce = appSource("features/ondo/commerce-b/id-wallet-commerce-b.tsx")
  const provider = appSource("features/ondo/shared/state/ondo-b-provider.tsx")
  const deviceTypeStart = provider.indexOf("type OndoBDeviceState")
  const deviceType = provider.slice(deviceTypeStart, provider.indexOf("\n}", deviceTypeStart) + 2)
  expect(commerce).toContain("No wallet, merchant, stablecoin network or payment provider is contacted")
  expect(commerce).toContain("외부 지갑·가맹점·네트워크·결제 공급자에 연결하지 않습니다")
  expect(commerce).toContain("OOKRW is a device-only product balance")
  expect(commerce).toContain("not a stablecoin or on-chain asset")
  expect(commerce).toContain("OOKRW는 이 기기에서만 작동하는 제품용 잔액")
  expect(commerce).toContain("스테이블코인이나 온체인 자산이 아닙니다")
  expect(commerce).toContain('data-provider-order={commerce.providerOrder}')
  expect(commerce).toContain("No order was placed with the venue")
  expect(commerce).toContain('data-testid="commerce-operation-id"')
  expect(commerce).toContain('data-testid="commerce-holder-delta"')
  expect(commerce).toContain('data-testid="commerce-merchant-delta"')
  expect(commerce).toContain('data-testid="commerce-settlement-total"')
  expect(commerce).toMatch(/<details className=\{styles\.testDetails\}[^>]*data-testid="commerce-payment-details"/)
  expect(commerce).not.toMatch(/fetch\(|XMLHttpRequest|WebSocket|localStorage|URLSearchParams/)
  expect(commerce).toContain("restoreBActionGateSession(window.sessionStorage)")
  expect(commerce).toContain("consumePendingBActionAtMutation(window.sessionStorage")
  expect(commerce).not.toMatch(/sessionStorage\.(?:setItem|removeItem)|dateOfBirth|passport|documentNumber/i)
  expect(commerce).not.toContain('data-testid="payment-outcomes"')
  expect(commerce).not.toContain('data-testid="payment-ledgers"')
  expect(deviceType).toContain("commerceReceipts: OndoBCommerceReceipt[]")
  expect(provider).toContain("sanitizeCommerceReceipts")
  expect(deviceType).not.toMatch(/wallet|balance|payment|voucher|settlement|claim|consent|origin/i)
})
