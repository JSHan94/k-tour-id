/** A prepared account's sample journal. Never stores a real account or session. */
export const ACCOUNT_SERVICES_SAMPLE_KEY_B = "ondo-b.account-services-sample.v1"
export type AccountServiceOperationB = "export" | "revoke" | "delete"
export type AccountServicePhaseB = "review" | "pending" | "unknown" | "failed" | "done"
export type AccountServiceOutcomeB = "success" | "failure" | "unknown"
export interface AccountServiceSampleB {
  version: 1
  sampleOnly: true
  operation: AccountServiceOperationB
  phase: AccountServicePhaseB
  outcome: AccountServiceOutcomeB
  operationId: string | null
  signedOut: boolean
}
export type AccountServiceActionB =
  | { type: "choose"; operation: AccountServiceOperationB }
  | { type: "outcome"; outcome: AccountServiceOutcomeB }
  | { type: "request"; operationId: string }
  | { type: "resolve"; operationId: string; outcome: AccountServiceOutcomeB }
  | { type: "another" }

const OPERATIONS = ["export", "revoke", "delete"] as const
const PHASES = ["review", "pending", "unknown", "failed", "done"] as const
const OUTCOMES = ["success", "failure", "unknown"] as const
const validId = (value: unknown): value is string => typeof value === "string" && /^sample-account-[a-zA-Z0-9-]{8,80}$/.test(value)

export function initialAccountServiceSampleB(): AccountServiceSampleB {
  return { version: 1, sampleOnly: true, operation: "export", phase: "review", outcome: "success", operationId: null, signedOut: false }
}

export function reduceAccountServiceSampleB(state: AccountServiceSampleB, action: AccountServiceActionB): AccountServiceSampleB {
  switch (action.type) {
    case "choose":
      return state.phase === "review" && OPERATIONS.includes(action.operation) ? { ...state, operation: action.operation } : state
    case "outcome":
      return state.phase === "review" && OUTCOMES.includes(action.outcome) ? { ...state, outcome: action.outcome } : state
    case "request": {
      if (!["review", "failed", "unknown"].includes(state.phase) || !validId(action.operationId)) return state
      // A result lookup/retry must retain the durable operation, never resubmit it.
      if (state.phase !== "review" && state.operationId !== action.operationId) return state
      return { ...state, phase: "pending", operationId: action.operationId }
    }
    case "resolve": {
      if (state.phase !== "pending" || state.operationId !== action.operationId || !OUTCOMES.includes(action.outcome)) return state
      const phase = action.outcome === "success" ? "done" : action.outcome === "failure" ? "failed" : "unknown"
      return { ...state, phase, signedOut: state.signedOut || (phase === "done" && state.operation === "revoke") }
    }
    case "another":
      return state.phase === "done" ? { ...initialAccountServiceSampleB(), signedOut: state.signedOut } : state
  }
}

export function restoreAccountServiceSampleB(value: unknown): AccountServiceSampleB | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const input = value as Partial<AccountServiceSampleB>
  if (input.version !== 1 || input.sampleOnly !== true || !OPERATIONS.includes(input.operation as AccountServiceOperationB)
    || !PHASES.includes(input.phase as AccountServicePhaseB) || !OUTCOMES.includes(input.outcome as AccountServiceOutcomeB)
    || typeof input.signedOut !== "boolean") return null
  if (input.phase === "review" ? input.operationId !== null : !validId(input.operationId)) return null
  if (input.phase === "done" && input.operation === "revoke" && !input.signedOut) return null
  // An interrupted timer is not evidence that the external-shaped action failed
  // or completed. The public UI must query the same request after re-entry.
  return {
    version: 1, sampleOnly: true,
    operation: input.operation!, phase: input.phase === "pending" ? "unknown" : input.phase!, outcome: input.outcome!,
    operationId: input.operationId!, signedOut: input.signedOut,
  }
}
