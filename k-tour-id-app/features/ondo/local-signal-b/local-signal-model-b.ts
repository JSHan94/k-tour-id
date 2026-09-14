import { isCanonicalVenueId } from "@/lib/ondo/venues/canonical-allowlist"
import type { PulseLocalSignalTagB } from "../pulse-b/pulse-model-b"

export type LocalSignalTagB = PulseLocalSignalTagB

export const LOCAL_SIGNAL_UPL_STATES_B = [
  "UPL-IDLE",
  "UPL-PREVIEW",
  "UPL-SENDING",
  "UPL-SENT",
  "UPL-FAILED",
  "UPL-REMOVED",
] as const

export const LOCAL_SIGNAL_MUTATION_AXES_B = ["visit", "contribution"] as const
export const LOCAL_SIGNAL_LOCAL_SUBJECT_REF_B = "account:local"

export type LocalSignalUplStateB = (typeof LOCAL_SIGNAL_UPL_STATES_B)[number]
export type LocalSignalMutationAxisB = (typeof LOCAL_SIGNAL_MUTATION_AXES_B)[number]
export type LocalSignalOutcomeB = "draft" | "gate" | "ready" | "saving" | "unique" | "duplicate" | "failed"

export type LocalSignalFlowStateB = Readonly<{
  upload: LocalSignalUplStateB
  hasPreview: boolean
  outcome: LocalSignalOutcomeB
}>

export type LocalSignalFlowEventB =
  | Readonly<{ type: "reset" }>
  | Readonly<{ type: "photo_ready" }>
  | Readonly<{ type: "photo_failed"; preservePreview: boolean }>
  | Readonly<{ type: "photo_removed" }>
  | Readonly<{ type: "gate_requested" }>
  | Readonly<{ type: "gate_ready" }>
  | Readonly<{ type: "gate_returned" }>
  | Readonly<{ type: "save_requested" }>
  | Readonly<{ type: "save_unique" }>
  | Readonly<{ type: "save_duplicate" }>
  | Readonly<{ type: "save_failed" }>

export const INITIAL_LOCAL_SIGNAL_FLOW_STATE_B: LocalSignalFlowStateB = Object.freeze({
  upload: "UPL-IDLE",
  hasPreview: false,
  outcome: "draft",
})

/**
 * Canonical local-only media and submission states. `UPL-SENT` is an internal
 * lifecycle marker for a successful device write; consumer copy must never
 * call the photo uploaded or published.
 */
export function reduceLocalSignalFlowB(
  state: LocalSignalFlowStateB,
  event: LocalSignalFlowEventB,
): LocalSignalFlowStateB {
  if (event.type === "reset") return INITIAL_LOCAL_SIGNAL_FLOW_STATE_B
  if (event.type === "photo_ready") return { ...state, upload: "UPL-PREVIEW", hasPreview: true, outcome: "draft" }
  if (event.type === "photo_failed") return { ...state, upload: "UPL-FAILED", hasPreview: event.preservePreview, outcome: "draft" }
  if (event.type === "photo_removed") return { ...state, upload: "UPL-REMOVED", hasPreview: false, outcome: "draft" }
  if (event.type === "gate_requested") return { ...state, outcome: "gate" }
  if (event.type === "gate_ready") return { ...state, outcome: "ready" }
  if (event.type === "gate_returned") return { ...state, outcome: "draft" }
  if (event.type === "save_requested") {
    return { ...state, upload: state.hasPreview ? "UPL-SENDING" : state.upload, outcome: "saving" }
  }
  if (event.type === "save_unique") {
    return { ...state, upload: state.hasPreview ? "UPL-SENT" : state.upload, outcome: "unique" }
  }
  if (event.type === "save_duplicate") {
    // A duplicate is a verified no-op. The local preview is discarded when the
    // flow completes, but it was never written or sent a second time.
    return {
      ...state,
      upload: state.hasPreview ? "UPL-REMOVED" : state.upload,
      hasPreview: false,
      outcome: "duplicate",
    }
  }
  return {
    ...state,
    upload: state.hasPreview ? "UPL-PREVIEW" : state.upload === "UPL-SENDING" ? "UPL-IDLE" : state.upload,
    outcome: "failed",
  }
}

export type LocalSignalDraftBindingB = Readonly<{
  venueId: string
  revision: string
  tags: readonly LocalSignalTagB[]
  note: string
  photo: "none" | "preview"
}>

export function createLocalSignalDraftBindingB(input: LocalSignalDraftBindingB): LocalSignalDraftBindingB | null {
  if (!isCanonicalVenueId(input.venueId) || !/^[a-z0-9:-]{1,180}$/i.test(input.revision)) return null
  const tags = [...new Set(input.tags)]
  if (tags.length !== input.tags.length || input.note.length > 240) return null
  return Object.freeze({ ...input, tags: Object.freeze(tags), note: input.note.slice(0, 240) })
}

export function sameLocalSignalDraftBindingB(
  left: LocalSignalDraftBindingB | null,
  right: LocalSignalDraftBindingB | null,
) {
  return Boolean(left && right
    && left.venueId === right.venueId
    && left.revision === right.revision
    && left.note === right.note
    && left.photo === right.photo
    && left.tags.length === right.tags.length
    && left.tags.every((tag, index) => tag === right.tags[index]))
}

export type LocalSignalEvidenceIdentityB = Readonly<{
  venueId: string
  subjectRef: string
  evidenceRef: string
}>

const SAFE_EVIDENCE_PART_B = /^[a-z0-9][a-z0-9:_-]{0,79}$/i
const LOCAL_SIGNAL_TAGS_B = new Set<LocalSignalTagB>(["calm_now", "lively_now", "quick_stop", "welcoming"])

/** One device account + one canonical venue owns one stable first-mission key. */
export function createLocalSignalEvidenceIdentityB(
  venueId: string,
  subjectRef = LOCAL_SIGNAL_LOCAL_SUBJECT_REF_B,
): LocalSignalEvidenceIdentityB | null {
  const evidenceRef = `local-signal:${venueId}`
  if (!isCanonicalVenueId(venueId) || !SAFE_EVIDENCE_PART_B.test(subjectRef) || !SAFE_EVIDENCE_PART_B.test(evidenceRef)) return null
  return Object.freeze({ venueId, subjectRef, evidenceRef })
}

export function localSignalActivityEvidenceIdB(identity: LocalSignalEvidenceIdentityB) {
  if (!isCanonicalVenueId(identity.venueId)
    || !SAFE_EVIDENCE_PART_B.test(identity.subjectRef)
    || !SAFE_EVIDENCE_PART_B.test(identity.evidenceRef)
    || identity.evidenceRef !== `local-signal:${identity.venueId}`) return null
  const id = `activity:${identity.evidenceRef}:${identity.subjectRef}`
  return id.length <= 120 ? id : null
}

export type LocalSignalMutationPayloadB = Readonly<{
  identity: LocalSignalEvidenceIdentityB
  evidenceId: string
  axes: readonly LocalSignalMutationAxisB[]
  tags: readonly LocalSignalTagB[]
}>

/**
 * The durable mutation excludes note/photo/file metadata. Those remain in the
 * mounted task only; accepted payloads can alter Visit and Contribution only.
 */
export function createLocalSignalMutationPayloadB(input: {
  venueId: string
  tags: readonly LocalSignalTagB[]
  subjectRef?: string
}): LocalSignalMutationPayloadB | null {
  const identity = createLocalSignalEvidenceIdentityB(input.venueId, input.subjectRef)
  const evidenceId = identity ? localSignalActivityEvidenceIdB(identity) : null
  const tags = [...new Set(input.tags)]
  if (!identity || !evidenceId || tags.length === 0 || tags.length !== input.tags.length || tags.some((tag) => !LOCAL_SIGNAL_TAGS_B.has(tag))) return null
  return Object.freeze({
    identity,
    evidenceId,
    axes: LOCAL_SIGNAL_MUTATION_AXES_B,
    tags: Object.freeze(tags),
  })
}
