import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
  applyBActivityReviewFixture,
  B_ACTIVITY_PROFILE_SESSION_KEY,
  publishBActivityProfileStorage,
  publicBActivityProfile,
  restoreBActivityProfile,
  restoreLegacyBActivityProfile,
  scheduleAfterNextPaintB,
  type BActivityProfile,
} from "../../features/ondo/identity-b/activity-profile-b-provider"
import {
  CANONICAL_FACT_STATES,
  EVIDENCE_SOURCE_CLASSES,
  canonicalEvidenceState,
  canonicalFactFreshness,
  canonicalFactState,
  canonicalFactStateWithRetry,
  evidenceSourceClass,
  isPositiveFactState,
  isPositiveMerchantTraitState,
  merchantTraitState,
  nextCanonicalFactFreshnessTransition,
  sanitizeCanonicalFactState,
  sanitizeEvidenceSourceClass,
  type CanonicalEvidenceEnvelope,
  type MerchantTraitReceipt,
} from "../../features/ondo/contracts/evidence"
import type { Provenance } from "../../features/ondo/contracts/domain"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

const contractOnly: Provenance = {
  truth: "CONTRACT_ONLY",
  fixtureId: "FX-WAVE1",
  sourceKind: "adapter",
  fetchedAt: "2026-08-19T10:00:00Z",
  isSimulation: false,
}

test("W1-PROFILE-001 empty values fail closed and never retain public consent", () => {
  const restored = restoreBActivityProfile({
    profile: {
      displayName: "Mina",
      from: { value: "   ", consent: true },
      livesIn: { value: "Seoul", consent: true },
      languages: { value: [], consent: true },
    },
  })

  expect(restored.profile.from).toEqual({ value: "", consent: false })
  expect(restored.profile.livesIn).toEqual({ value: "Seoul", consent: true })
  expect(restored.profile.languages).toEqual({ value: [], consent: false })
})

test("W1-PROFILE-002 the public boundary omits every private field instead of masking it", () => {
  const profile: BActivityProfile = {
    displayName: "Mina",
    from: { value: "Canada", consent: true },
    livesIn: { value: "Private City", consent: false },
    languages: { value: ["English", "日本語"], consent: false },
  }
  const published = publicBActivityProfile(profile)

  expect(published).toEqual({ displayName: "Mina", from: "Canada" })
  expect(published).not.toHaveProperty("livesIn")
  expect(published).not.toHaveProperty("languages")
  expect(JSON.stringify(published)).not.toContain("Private City")
  expect(JSON.stringify(published)).not.toContain("日本語")
})

test("W1-PROFILE-PROVENANCE current and legacy aggregates cannot forge reputation or a 10-stamp milestone", () => {
  const aggregate = {
    profile: { displayName: "Mina" },
    reputation: { visit: "repeat", contribution: "established", meetup: "established" },
    stamps: 10,
    acceptedEvidenceIds: Array.from({ length: 10 }, (_, index) => `visit:forged-${index}`),
    acceptedActivityEventKeys: Array.from({ length: 10 }, (_, index) => `visit:legacy-forged-${index}`),
  }
  const current = restoreBActivityProfile(aggregate)
  const legacy = restoreLegacyBActivityProfile(aggregate)
  for (const restored of [current, legacy]) {
    expect(restored.reputation).toEqual({ visit: "new", contribution: "new", meetup: "new" })
    expect(restored.stamps).toBe(0)
    expect(restored.acceptedEvidenceIds).toEqual([])
    expect(restored.evidenceReceipts).toEqual([])
  }

  const mismatchedProvenance = restoreBActivityProfile({
    evidenceReceipts: [{
      evidenceId: "visit:forged",
      axes: ["visit"],
      addsVisitStamp: true,
      recordedAt: "2026-09-04T10:00:00.000Z",
      provenance: { truth: "LOCAL_INTERACTION", source: "local_signal" },
    }],
  })
  expect(mismatchedProvenance.stamps).toBe(0)

  const typedLocalReceipt = {
    evidenceReceipts: [{
      evidenceId: "activity:local-signal:venue-1:nonce-1",
      axes: ["visit", "contribution"],
      addsVisitStamp: false,
      recordedAt: "2026-09-04T10:00:00.000Z",
      provenance: { truth: "LOCAL_INTERACTION", source: "local_signal" },
    }],
  }
  const forgedLocalAction = restoreBActivityProfile(typedLocalReceipt)
  expect(forgedLocalAction.reputation).toEqual({ visit: "new", contribution: "new", meetup: "new" })
  expect(forgedLocalAction.stamps).toBe(0)
  expect(forgedLocalAction.acceptedEvidenceIds).toEqual([])
  expect(forgedLocalAction.evidenceReceipts).toEqual([])

  const typedReviewReceipts = {
    ...aggregate,
    evidenceReceipts: Array.from({ length: 10 }, (_, index) => ({
      evidenceId: `visit:forged-review-${index}`,
      axes: ["visit"],
      addsVisitStamp: true,
      recordedAt: "2026-09-04T10:00:00.000Z",
      provenance: { truth: "REVIEW_FIXTURE", source: "review_fixture" },
    })),
  }
  for (const restored of [restoreBActivityProfile(typedReviewReceipts), restoreLegacyBActivityProfile(typedReviewReceipts)]) {
    expect(restored).toMatchObject({
      reputation: { visit: "new", contribution: "new", meetup: "new" },
      stamps: 0,
      acceptedEvidenceIds: [],
      evidenceReceipts: [],
    })
  }

  const mountedReview = applyBActivityReviewFixture(Array.from({ length: 10 }, (_, index) => ({
    evidenceId: `visit:qa-memory-${index}`,
    axes: ["visit"],
    addVisitStamp: true,
  })))
  expect(mountedReview.reputation.visit).toBe("repeat")
  expect(mountedReview.stamps).toBe(10)
})

test("W1-PROFILE-PAINT pending crosses a paint boundary and stays cancellable before mutation", () => {
  let nextHandle = 1
  const queued = new Map<number, FrameRequestCallback>()
  const scheduler = {
    requestAnimationFrame(callback: FrameRequestCallback) {
      const handle = nextHandle++
      queued.set(handle, callback)
      return handle
    },
    cancelAnimationFrame(handle: number) { queued.delete(handle) },
  }
  const flushOne = () => {
    const first = queued.entries().next().value as [number, FrameRequestCallback] | undefined
    if (!first) return
    queued.delete(first[0])
    first[1](0)
  }

  let mutations = 0
  const cancel = scheduleAfterNextPaintB(scheduler, () => { mutations += 1 })
  flushOne()
  expect(mutations).toBe(0)
  cancel()
  flushOne()
  expect(mutations).toBe(0)

  scheduleAfterNextPaintB(scheduler, () => { mutations += 1 })
  flushOne()
  expect(mutations).toBe(0)
  flushOne()
  expect(mutations).toBe(1)
})

test("W1-PROFILE-STORAGE ignored, throwing, mismatched, and failed removals never publish success", () => {
  const makeStorage = (mode: "ok" | "ignore-set" | "throw-set" | "mismatch-set" | "ignore-remove" | "throw-remove") => {
    let raw: string | null = "old-profile"
    let writes = 0
    const storage = {
      getItem(key: string) { return key === B_ACTIVITY_PROFILE_SESSION_KEY ? raw : null },
      setItem(key: string, value: string) {
        if (key !== B_ACTIVITY_PROFILE_SESSION_KEY) return
        writes += 1
        if (mode === "throw-set") throw new DOMException("quota", "QuotaExceededError")
        if (mode === "ignore-set" && writes === 1) return
        if (mode === "mismatch-set" && writes === 1) { raw = "wrong-profile"; return }
        raw = value
      },
      removeItem(key: string) {
        if (key !== B_ACTIVITY_PROFILE_SESSION_KEY) return
        if (mode === "throw-remove") throw new DOMException("quota", "QuotaExceededError")
        if (mode !== "ignore-remove") raw = null
      },
      raw: () => raw,
    }
    return storage
  }

  const success = makeStorage("ok")
  expect(publishBActivityProfileStorage(success, "new-profile")).toEqual({ ok: true, previousRaw: "old-profile" })
  expect(success.raw()).toBe("new-profile")

  for (const mode of ["ignore-set", "throw-set", "mismatch-set"] as const) {
    const storage = makeStorage(mode)
    expect(publishBActivityProfileStorage(storage, "new-profile").ok, mode).toBe(false)
    expect(storage.raw(), `${mode} must retain or restore the old exact bytes`).toBe("old-profile")
  }

  for (const mode of ["ignore-remove", "throw-remove"] as const) {
    const removal = makeStorage(mode)
    expect(publishBActivityProfileStorage(removal, null).ok, mode).toBe(false)
    expect(removal.raw()).toBe("old-profile")
  }

  const provider = source("features/ondo/identity-b/activity-profile-b-provider.tsx")
  expect(provider.match(/publishBActivityProfileStorage\(window\.sessionStorage/g)?.length).toBeGreaterThanOrEqual(4)
  expect(provider).toContain('if (!publication.ok) return false')
  expect(provider).toContain('if (!publication.ok) return "storage_failed"')
})

test("W1-EVIDENCE-001 fact states never promote unknown, loading or errors to a positive check", () => {
  const states = [
    canonicalFactState({ requestState: "loading", truth: null, value: null }),
    canonicalFactState({ requestState: "ready", truth: "UNKNOWN", value: null }),
    canonicalFactState({ requestState: "error", truth: "OFFICIAL_SOURCE", value: true }),
  ]
  expect(states).toEqual(["loading", "unknown", "error"])
  expect(states.every((state) => !isPositiveFactState(state))).toBe(true)
  expect(canonicalFactState({ requestState: "ready", truth: "OFFICIAL_SOURCE", value: true })).toBe("yes")
  expect(canonicalFactState({ requestState: "ready", truth: "OFFICIAL_SOURCE", value: false })).toBe("no")
  expect(canonicalFactState({ requestState: "ready", truth: "OFFICIAL_SOURCE", value: "Call ahead" })).toBe("conditional")
  expect(canonicalFactState({ requestState: "ready", truth: "OFFICIAL_SOURCE", value: true, freshness: "stale" })).toBe("stale")
  expect(CANONICAL_FACT_STATES).toEqual(["yes", "no", "conditional", "unknown", "loading", "stale", "error"])
  for (const state of CANONICAL_FACT_STATES) expect(sanitizeCanonicalFactState(state)).toBe(state)
  expect(sanitizeCanonicalFactState("eligible")).toBe("unknown")
})

test("W1-EVIDENCE-002 source standards stay distinct and expired envelopes become stale", () => {
  const envelope: CanonicalEvidenceEnvelope = {
    id: "ev-1",
    sourceStandard: "OpenDID",
    adapterId: "opendid-adapter",
    subjectRef: "person-1",
    claimType: "person",
    claimValue: true,
    issuedAt: "2026-08-19T10:00:00Z",
    expiresAt: "2026-08-20T10:00:00Z",
    provenance: contractOnly,
  }

  expect(evidenceSourceClass("OpenDID")).toBe("opendid")
  expect(evidenceSourceClass("EAS")).toBe("eas")
  expect(evidenceSourceClass("ONDO_LOCAL")).toBe("ondo")
  expect(canonicalEvidenceState(envelope, new Date("2026-08-19T11:00:00Z"))).toBe("valid")
  expect(canonicalEvidenceState(envelope, new Date("2026-08-20T10:00:00Z"))).toBe("stale")
  expect(canonicalEvidenceState({ ...envelope, issuedAt: "not-a-date" })).toBe("invalid")
  expect(EVIDENCE_SOURCE_CLASSES).toEqual(["official_directory", "editorial", "ondo", "merchant", "opendid", "eas"])
  for (const sourceClass of EVIDENCE_SOURCE_CLASSES) expect(sanitizeEvidenceSourceClass(sourceClass)).toBe(sourceClass)
  expect(sanitizeEvidenceSourceClass("verified")).toBe("official_directory")
  expect(canonicalFactFreshness("2026-08-19T10:00:00Z", new Date("2026-09-01T10:00:00Z"))).toBe("current")
  expect(canonicalFactFreshness("2026-08-19T10:00:00Z", new Date("2026-09-20T10:00:00Z"))).toBe("stale")
  expect(canonicalFactFreshness("invalid", new Date("2026-09-01T10:00:00Z"))).toBe("stale")
  expect(nextCanonicalFactFreshnessTransition(
    ["2026-08-19T10:00:00Z", "invalid"],
    new Date("2026-09-01T10:00:00Z"),
  )).toBe(Date.parse("2026-09-18T10:00:00.001Z"))
  expect(nextCanonicalFactFreshnessTransition(["2026-08-01T10:00:00Z"], new Date("2026-09-01T10:00:00Z"))).toBeNull()
  expect(canonicalFactStateWithRetry({ factKey: "card", phase: "loading" }, "hours", "yes")).toBe("yes")
  expect(canonicalFactStateWithRetry({ factKey: "card", phase: "loading" }, "card", "unknown")).toBe("loading")
  expect(canonicalFactStateWithRetry({ factKey: "card", phase: "error" }, "card", "yes")).toBe("error")
})

test("W1-TRAIT-001 stale, error, unknown and ineligible receipts never become eligible", () => {
  const receipt: MerchantTraitReceipt = {
    merchantId: "merchant-1",
    offerId: "offer-1",
    policyId: "policy-1",
    result: "eligible",
    checkedAt: "2026-08-19T10:00:00Z",
    expiresAt: "2026-08-19T10:05:00Z",
    provenance: contractOnly,
  }
  const states = [
    merchantTraitState(null),
    merchantTraitState({ ...receipt, result: "ineligible", expiresAt: undefined }),
    merchantTraitState({ ...receipt, result: "stale" }),
    merchantTraitState({ ...receipt, result: "error" }),
    merchantTraitState(receipt, new Date("2026-08-19T10:06:00Z")),
  ]
  expect(states).toEqual(["unknown", "ineligible", "stale", "error", "stale"])
  expect(states.every((state) => !isPositiveMerchantTraitState(state))).toBe(true)
  expect(merchantTraitState({ ...receipt, expiresAt: "2026-08-19T10:10:00Z" }, new Date("2026-08-19T10:06:00Z"))).toBe("eligible")
})

test("W1-SURFACE-001 consumer surfaces use field consent and fact glyphs without maker vocabulary", () => {
  const profile = source("features/ondo/identity-b/profile-reputation-b.tsx")
  const place = source("features/ondo/place/canonical-place-overlay.tsx")
  const consumer = `${profile}\n${place}`

  for (const token of [
    "data-testid=\"public-profile-view\"",
    "data-public-field=\"from\"",
    "data-public-field=\"lives-in\"",
    "data-public-field=\"languages\"",
    "data-fact-state={fact.state}",
    "aria-expanded={opened}",
    "evidenceCopy[fact.sourceClass]",
    "canonicalFactState",
    "qaReviewFixtureOptions",
  ]) expect(consumer).toContain(token)

  expect(profile).not.toMatch(/preview|simulated|on-device|technical|trust score|safety score|local score/i)
  expect(place).not.toContain("This is an ONDO presentation choice")
  expect(place).not.toMatch(/verified merchant|safety guaranteed|licensed venue/i)
  expect(consumer).not.toMatch(/on this device|이 기기에서|この端末/i)
})

test("W1-PROFILE-003 hydration, announcements and contextual exact-return stay bounded", () => {
  const profile = source("features/ondo/identity-b/profile-reputation-b.tsx")
  const saved = source("features/ondo/my/saved-entry-b.tsx")
  const tables = source("features/ondo/connect/tables-entry-b.tsx")
  const css = source("features/ondo/identity-b/profile-reputation-b.module.css")

  expect(profile).toContain("const liveProfileSurface = !state.hydrated ?")
  expect(profile).toContain('data-profile-hydration="loading"')
  expect(profile.match(/aria-live=/g)).toHaveLength(1)
  expect(profile).toContain('role="status" aria-live="polite" aria-atomic="true"')
  expect(profile).toContain('data-testid="profile-save-result"')
  expect(profile).toContain('"save-pending"')
  expect(profile).toContain('aria-busy={pending}')
  expect(profile).toContain("scheduleAfterNextPaintB(window")
  expect(profile).toContain('if (pending) stopPendingSave()')
  expect(profile).toContain('className={styles.cancelButton} onClick={requestCancel}')
  expect(profile).not.toMatch(/className=\{styles\.cancelButton\}[^>]*disabled=\{pending\}/)
  expect(profile.indexOf("setSavePhase(\"pending\")")).toBeLessThan(profile.indexOf("actions.updateProfile(candidate)"))
  const editorStart = profile.indexOf('<div className={styles.editorLayout}>')
  expect(profile.indexOf('<PublicProfileView locale={locale}', editorStart)).toBeLessThan(profile.indexOf('<div className={styles.formActions}>', editorStart))
  expect(profile).toContain('maxLength={60}')
  expect(profile).toContain('aria-pressed={consent}')
  expect(profile).not.toContain('role="switch" aria-checked={consent}')
  const publicView = profile.slice(profile.indexOf("const PublicProfileView"), profile.indexOf("type ProfileEntryOrigin"))
  expect(publicView).not.toContain("aria-live")
  for (const field of ["from", "lives-in", "languages"]) expect(publicView).toContain(`data-public-field="${field}"`)

  expect(profile).toContain("nearestScrollOwner")
  expect(profile).toContain("snapshot.owner.scrollTop")
  expect(profile).toContain("openerRef.current?.focus({ preventScroll: true })")
  expect(profile).toContain("B_ACTION_AXIS_SESSION_EVENT")
  expect(profile).toContain("window.setTimeout(refresh")
  expect(profile).toContain("expiresAt - now + 16")
  expect(saved).toContain('<ProfileReputationEntryB locale={locale} accountActive={state.account === "ACC-ACTIVE"} origin="my_korea" />')
  expect(tables).toContain('<ProfileReputationEntryB locale={locale} accountActive={state.account === "ACC-ACTIVE"} origin="table_host" registerHostExitGuard={registerProfileHostExitGuard} />')
  expect(profile).toContain('"my-korea-profile-open"')
  expect(profile).toContain('"table-host-profile-open"')
  expect(profile).toContain('data-testid={`profile-axis-evidence-${axis.id}`}')
  expect(profile).toContain("state.evidenceReceipts")
  expect(profile).toContain("if (onExit) onExit()")
  const provider = source("features/ondo/identity-b/activity-profile-b-provider.tsx")
  expect(provider).not.toContain("allowReviewFixture")
  expect(provider).toContain("applyBActivityReviewFixture(readQaRuntime")
  expect(provider).toContain("profile: cleanProfile(state.profile)")

  expect(css).toContain("container-type: inline-size")
  expect(css).toContain("repeat(auto-fit, minmax(min(100%, 320px), 1fr))")
  expect(css).not.toContain("@media (min-width: 680px)")
  expect(css).toContain("(orientation: landscape) and (max-height: 500px) and (min-width: 700px)")
  expect(css).not.toMatch(/orientation: landscape[\s\S]{0,300}\.editorLayout\s*\{\s*grid-template-columns/)
})

test("W1-EVIDENCE-003 the nested drawer exposes every honest state/source and owns retry", () => {
  const place = source("features/ondo/place/canonical-place-overlay.tsx")
  const css = source("features/ondo/place/canonical-place.module.css")
  const qaTypes = source("tests/types/ondo-b-qa-runtime.d.ts")

  expect(place).toContain("readQaRuntime<PlaceQaRuntime>()?.evidenceFacts")
  expect(place).toContain("sanitizeCanonicalFactState")
  expect(place).toContain("sanitizeEvidenceSourceClass")
  expect(place).toContain('data-testid="canonical-evidence-drawer"')
  expect(place).toContain('data-testid="canonical-evidence-sheet"')
  expect(place).toContain('data-testid="canonical-evidence-retry"')
  expect(place).toContain("setIgnoredQaFactKeys")
  expect(place).toContain("canonicalFactStateWithRetry")
  expect(place).toContain("nextCanonicalFactFreshnessTransition")
  expect(place).toContain('setFactRetry({ factKey, phase: "loading" })')
  expect(place).toContain("useMemo(() => createRef<HTMLDivElement>(), [expanded])")
  expect(place).toContain("useModalVisualViewport(evidenceLayerRef)")
  expect(place).toContain("evidenceReturnScrollRef.current = bodyRef.current?.scrollTop ?? 0")
  expect(place).toContain("bodyRef.current.scrollTop = evidenceReturnScrollRef.current")
  expect(place).toContain('data-testid="canonical-evidence-venue"')
  expect(place).toContain('className={styles.detailCategoryPictogram}')
  expect(place).toContain('<section className={styles.before}')
  expect(place).not.toContain('<details className={styles.before}')
  expect(place).toContain('className={styles.factValue}')
  expect(place).toContain('fact.sourceClass === "official_directory" ? null')
  expect(place).toContain("factOpenerRefs.current[factKey]?.focus({ preventScroll: true })")
  for (const state of CANONICAL_FACT_STATES) expect(place).toContain(`state === "${state}"`)
  for (const sourceClass of EVIDENCE_SOURCE_CLASSES) expect(place).toContain(`sourceClass === "${sourceClass}"`)
  expect(place).toContain("factEvidenceValue")
  expect(place).toContain("canonicalFactFreshness")
  expect(place).toContain("data-detail-source={venue.sourceRefId}")
  expect(place).toContain('data-source-presentation="nonvisual-metadata"')
  expect(place).not.toContain("<details className={styles.sourceEvidence}")
  expect(css).toContain("max-height: min(88dvh, var(--ondo-sheet-viewport-height, 88dvh))")
  expect(css).toContain(".evidenceDrawerBody")
  expect(css).toMatch(/\.evidenceDrawerBody\s*\{[\s\S]{0,180}overflow-y:\s*auto/)
  expect(qaTypes).toContain("evidenceFacts?: Partial<Record")
})
