import { expect, test } from "@playwright/test"
import { CANONICAL_MAP_VENUES_COMPACT } from "../../lib/ondo/venues/map-data"
import { applyBActivityEvidence } from "../../features/ondo/identity-b/activity-profile-b-provider"
import {
  createLocalSignalDraftBindingB,
  createLocalSignalEvidenceIdentityB,
  createLocalSignalMutationPayloadB,
  INITIAL_LOCAL_SIGNAL_FLOW_STATE_B,
  localSignalActivityEvidenceIdB,
  reduceLocalSignalFlowB,
  sameLocalSignalDraftBindingB,
} from "../../features/ondo/local-signal-b/local-signal-model-b"

const venueId = CANONICAL_MAP_VENUES_COMPACT[0].id

test("FL012 canonical media lifecycle preserves a good preview through a failed replacement", () => {
  const preview = reduceLocalSignalFlowB(INITIAL_LOCAL_SIGNAL_FLOW_STATE_B, { type: "photo_ready" })
  expect(preview).toEqual({ upload: "UPL-PREVIEW", hasPreview: true, outcome: "draft" })
  const failedReplacement = reduceLocalSignalFlowB(preview, { type: "photo_failed", preservePreview: true })
  expect(failedReplacement).toEqual({ upload: "UPL-FAILED", hasPreview: true, outcome: "draft" })
  expect(reduceLocalSignalFlowB(failedReplacement, { type: "photo_removed" })).toEqual({
    upload: "UPL-REMOVED",
    hasPreview: false,
    outcome: "draft",
  })
})

test("FL012 exact return binding rejects any revision, tag, note, or photo drift", () => {
  const exact = createLocalSignalDraftBindingB({
    venueId,
    revision: `draft:${venueId}:1`,
    tags: ["calm_now", "welcoming"],
    note: "Window seat",
    photo: "preview",
  })
  expect(exact).not.toBeNull()
  expect(sameLocalSignalDraftBindingB(exact, exact)).toBe(true)
  for (const drift of [
    { ...exact!, revision: `draft:${venueId}:2` },
    { ...exact!, tags: ["calm_now"] as const },
    { ...exact!, note: "Counter seat" },
    { ...exact!, photo: "none" as const },
  ]) expect(sameLocalSignalDraftBindingB(exact, createLocalSignalDraftBindingB(drift))).toBe(false)
})

test("FL012 stable evidence accepts once, then returns duplicate without another reputation mutation", () => {
  const first = createLocalSignalMutationPayloadB({ venueId, tags: ["lively_now"] })
  const retry = createLocalSignalMutationPayloadB({ venueId, tags: ["welcoming"] })
  expect(first).not.toBeNull()
  expect(retry?.evidenceId).toBe(first?.evidenceId)
  expect(first?.axes).toEqual(["visit", "contribution"])
  expect(Object.keys(first ?? {}).sort()).toEqual(["axes", "evidenceId", "identity", "tags"])
  expect(first).not.toHaveProperty("note")
  expect(first).not.toHaveProperty("photo")

  const initial = {
    reputation: { visit: "new" as const, contribution: "new" as const, meetup: "new" as const },
    stamps: 0,
    acceptedEvidenceIds: [] as string[],
    evidenceReceipts: [],
  }
  const accepted = applyBActivityEvidence(initial, { evidenceId: first!.evidenceId, axes: first!.axes, addVisitStamp: false })
  expect(accepted.result).toBe("accepted")
  expect(accepted.snapshot).toMatchObject({
    reputation: { visit: "recent", contribution: "helpful", meetup: "new" },
    stamps: 0,
  })
  const duplicate = applyBActivityEvidence(accepted.snapshot, { evidenceId: retry!.evidenceId, axes: retry!.axes, addVisitStamp: false })
  expect(duplicate.result).toBe("duplicate")
  expect(duplicate.snapshot).toEqual(accepted.snapshot)
})

test("FL012 evidence identity is canonical and malformed payloads fail closed", () => {
  const identity = createLocalSignalEvidenceIdentityB(venueId)
  expect(identity).toEqual({ venueId, subjectRef: "account:local", evidenceRef: `local-signal:${venueId}` })
  expect(localSignalActivityEvidenceIdB(identity!)).toBe(`activity:local-signal:${venueId}:account:local`)
  expect(createLocalSignalEvidenceIdentityB("not-a-canonical-place")).toBeNull()
  expect(createLocalSignalMutationPayloadB({ venueId, tags: [] })).toBeNull()
  expect(createLocalSignalMutationPayloadB({ venueId, tags: ["calm_now", "calm_now"] })).toBeNull()
})

test("FL012 has distinct unique and duplicate terminal states", () => {
  const preview = reduceLocalSignalFlowB(INITIAL_LOCAL_SIGNAL_FLOW_STATE_B, { type: "photo_ready" })
  const saving = reduceLocalSignalFlowB(preview, { type: "save_requested" })
  expect(reduceLocalSignalFlowB(saving, { type: "save_unique" })).toEqual({ upload: "UPL-SENT", hasPreview: true, outcome: "unique" })
  expect(reduceLocalSignalFlowB(saving, { type: "save_duplicate" })).toEqual({ upload: "UPL-REMOVED", hasPreview: false, outcome: "duplicate" })
})

test("FL012 UI keeps a durable venue duplicate terminal without a second related mutation", async () => {
  const source = await import("node:fs/promises").then(({ readFile }) => readFile(
    new URL("../../features/ondo/local-signal-b/local-signal-layer-b.tsx", import.meta.url),
    "utf8",
  ))
  expect(source).toContain("state.localSignalPostedVenueIds.includes(activeVenue.id)")
  expect(source).toMatch(/if \(knownDuplicate\) \{\s*mutationResult = "duplicate"\s*return true\s*\}/)
  expect(source.indexOf("if (knownDuplicate)")).toBeLessThan(source.indexOf("activityActions.recordActivityAxes"))
  expect(source).toContain('data-result-tone={flow.outcome === "unique" ? "success" : "neutral"}')
  expect(source).toContain('flow.outcome === "unique" ? <div className={styles.resultAxes}')
  expect(source).toContain('flow.outcome === "unique" ? copy.savedBody : copy.duplicateBody')
})
