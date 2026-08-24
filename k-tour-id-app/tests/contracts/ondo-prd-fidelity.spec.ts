import { existsSync, readFileSync } from "node:fs"
import { dirname, extname, relative, resolve } from "node:path"
import { expect, test } from "@playwright/test"
import { CANONICAL_MAP_VENUES_COMPACT } from "../../lib/ondo/venues/map-data"
import { ONDO_DEFERRED, ONDO_MUST_LIVE } from "../helpers/ondo-prd-fidelity"

const APP_ROOT = process.cwd()
const ROUTE_ENTRY = resolve(APP_ROOT, "app/ondo-b/page.tsx")
const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".css", ".json"] as const

function localImportTargets(source: string) {
  const pattern = /(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g
  return [...source.matchAll(pattern)]
    .map((match) => match[1])
    .filter((target) => target.startsWith(".") || target.startsWith("@/"))
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

const liveFiles = routeImportGraph()
const livePaths = liveFiles.map((file) => relative(APP_ROOT, file))
const liveSource = liveFiles.map((file) => readFileSync(file, "utf8")).join("\n")

function appSource(path: string) {
  return readFileSync(resolve(APP_ROOT, path), "utf8")
}

function expectReachable(path: string) {
  expect(livePaths, `${path} must be reachable from app/ondo-b/page.tsx; a detached module does not satisfy the journey`).toContain(path)
}

function expectLiveEvidence(evidence: readonly string[]) {
  for (const token of evidence) expect(liveSource, `missing live /ondo-b evidence: ${token}`).toContain(token)
}

test("FID-P0-001 preserved Guest Explore remains a live official-source journey", () => {
  expectReachable("features/ondo/map/map-entry-b.tsx")
  expectReachable("features/ondo/place/canonical-place-overlay.tsx")
  expectLiveEvidence(["ondo-b-map-entry", "ondo-b-venue-list", "canonical-place-details", "canonical-venue-directions"])
  expect(CANONICAL_MAP_VENUES_COMPACT).toHaveLength(400)
  expect(CANONICAL_MAP_VENUES_COMPACT.filter((venue) => venue.cityId === "seoul")).toHaveLength(200)
  expect(CANONICAL_MAP_VENUES_COMPACT.filter((venue) => venue.cityId === "busan")).toHaveLength(200)
})

test("FID-P0-002 Explore is usable without account, Person, 19+, consent, or provider setup", () => {
  const map = appSource("features/ondo/map/map-entry-b.tsx")
  const place = appSource("features/ondo/place/canonical-place-overlay.tsx")
  for (const source of [map, place]) {
    expect(source).not.toContain("beginAction(")
    expect(source).not.toContain("ondo-gate-overlay")
  }
  expect(place).toContain("canonical-venue-directions")
})

test("FID-P0-003 /ondo-b has three-step language/value, intent/persona, preferences onboarding and guest map arrival", () => {
  expectReachable("features/ondo/onboarding/official-directory-onboarding.tsx")
  expectLiveEvidence(["onboarding-step-value", "onboarding-step-intent", "onboarding-step-preferences", "Explore as a guest", "Open guest Explore"])
})

test("FID-P0-004 My Korea keeps saved, recently viewed, and planned-meal semantics live", () => {
  expectReachable("features/ondo/my/saved-entry-b.tsx")
  expectLiveEvidence(["ondo-b-saved-entry", "my-korea-recent", "my-korea-planned"])
})

test("FID-P0-005 a Local Signal draft can contribute and return to the exact place", () => {
  expectReachable("features/ondo/place/place-overlay.tsx")
  expectReachable("features/ondo/connect/connect-overlays.tsx")
  expectLiveEvidence(["venue-local-signal", "local-signal-overlay", "local-signal-submit", "local-signal-outcome", "local-signal-return"])
})

test("FID-P0-006 one Pulse Table / Connect journey reaches join, recovery, and participant chat", () => {
  expectReachable("features/ondo/connect/tables-entry.tsx")
  expectReachable("features/ondo/connect/connect-overlays.tsx")
  expectLiveEvidence(["tables-entry", "table-join", "table-join-retry", "table-view-alternative", "table-open-chat", "table-chat"])
})

test("FID-P0-007 After 19 keeps success, cancel, failure, unavailable, expiry, and exact-return outcomes", () => {
  expectReachable("features/ondo/after19/after19-layer.tsx")
  expectReachable("features/ondo/after19/after19-venue-return.tsx")
  expectReachable("features/ondo/identity/gate-overlay.tsx")
  expectLiveEvidence(["A19-ON", "A19-MANUAL-OFF", "gate-failure", "gate-unsupported", "after19-expiry-notice", "OPEN_AFTER19", "canonical-after19-access"])
})

test("FID-P0-008 ID exposes independent Person, 19+, and consent states", () => {
  expectReachable("features/ondo/identity/identity-entry.tsx")
  expectLiveEvidence(["ondo-identity-entry", "data-person-state", "data-age-state", "data-consent-state"])
})

test("FID-P0-009 ID has a truthful one-time interactive walkthrough boundary", () => {
  expectReachable("features/ondo/identity/gate-overlay.tsx")
  expectLiveEvidence(["identity-walkthrough", "identity-walkthrough-complete", "identityWalkthroughSeen", "No request is sent to an external provider."])
})

test("FID-P0-010 every JIT result preserves and consumes an exact returnTo once", () => {
  expectReachable("features/ondo/contracts/return-to.ts")
  expectReachable("features/ondo/shared/state/ondo-provider.tsx")
  expectLiveEvidence(["ReturnToEnvelope", "tokenId", "gateQueue", "activeGate", "expiresAt", "consumedAt", "SAVE_VENUE", "JOIN_TABLE", "SUBMIT_LOCAL_SIGNAL", "OPEN_AFTER19"])
})

test("FID-P0-011 all must-live surfaces retain EN/KO, responsive, and keyboard/focus evidence", () => {
  for (const path of [
    "features/ondo/onboarding/official-directory-onboarding.tsx",
    "features/ondo/my/my-entry.tsx",
    "features/ondo/connect/connect-overlays.tsx",
    "features/ondo/after19/after19-layer.tsx",
    "features/ondo/identity/identity-entry.tsx",
  ]) expectReachable(path)
  expectLiveEvidence(["locale === \"ko\"", "onKeyDown", "useModalIsolation", "focusFirstAvailableDestination"])
  expect(liveFiles.filter((file) => file.endsWith(".css")).map((file) => readFileSync(file, "utf8")).join("\n")).toContain("@media")
})

test("FID-LOOP-001 packaging cannot pass by globally denying journey names, modules, or truthful preview vocabulary", () => {
  const policy = appSource("scripts/ondo-b-standalone/policy.mjs")
  expect(policy).not.toContain("BANNED_ARTIFACT_PATH")
  expect(policy).not.toContain("BANNED_ARTIFACT_TEXT")
})

test("FID-LOOP-002 every P0 inventory item is non-removable", () => {
  expect(ONDO_MUST_LIVE.map((item) => item.id)).toEqual([
    "ONDO-P0-GUEST-DISCOVERY",
    "ONDO-P0-ONBOARDING",
    "ONDO-P0-MY-KOREA",
    "ONDO-P0-LOCAL-SIGNAL",
    "ONDO-P0-PULSE-TABLE",
    "ONDO-P0-AFTER19",
    "ONDO-P0-ID",
    "ONDO-P0-RETURN-TO",
    "ONDO-P0-INCLUSIVE-WEB",
  ])
  expect(ONDO_MUST_LIVE.every((item) => item.removalPolicy === "FAIL_RELEASE")).toBe(true)
})

test("FID-SCOPE-001 P0 needs no real provider/backend while wallet, payment, and voucher remain P2", () => {
  expect(ONDO_MUST_LIVE.every((item) => item.providerBoundary === "NO_REAL_PROVIDER_REQUIRED")).toBe(true)
  expect(ONDO_DEFERRED.map((item) => item.id)).toEqual(["ONDO-P2-WALLET", "ONDO-P2-PAYMENT", "ONDO-P2-VOUCHER"])
  expect(ONDO_DEFERRED.every((item) => item.removalPolicy === "DEFERRED_ALLOWED")).toBe(true)
})
