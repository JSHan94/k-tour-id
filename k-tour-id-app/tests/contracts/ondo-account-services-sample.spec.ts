import { expect, test } from "@playwright/test"
import { initialAccountServiceSampleB, reduceAccountServiceSampleB, restoreAccountServiceSampleB, type AccountServiceOperationB } from "../../features/ondo/settings/account-services-sample-model-b"

const id = "sample-account-11111111-2222-3333-4444-555555555555"
const sent = (operation: AccountServiceOperationB = "export") => reduceAccountServiceSampleB(
  reduceAccountServiceSampleB(initialAccountServiceSampleB(), { type: "choose", operation }), { type: "request", operationId: id },
)
for (const operation of ["export", "revoke", "delete"] as const) {
  test(`sample ${operation} completes only its matching pending operation`, () => {
    const pending = sent(operation)
    expect(pending.phase).toBe("pending")
    expect(pending.sampleOnly).toBe(true)
    expect(reduceAccountServiceSampleB(pending, { type: "resolve", operationId: `${id}-stale`, outcome: "success" })).toBe(pending)
    const done = reduceAccountServiceSampleB(pending, { type: "resolve", operationId: id, outcome: "success" })
    expect(done.phase).toBe("done")
    expect(done.signedOut).toBe(operation === "revoke")
    expect(reduceAccountServiceSampleB(done, { type: "resolve", operationId: id, outcome: "success" })).toBe(done)
    expect(reduceAccountServiceSampleB(done, { type: "request", operationId: `${id}-new` })).toBe(done)
  })
}
test("interrupted account work restores unknown and keeps the same durable request", () => {
  const restored = restoreAccountServiceSampleB(sent("delete"))!
  expect(restored.phase).toBe("unknown")
  expect(restored.operationId).toBe(id)
  expect(restored.operation).toBe("delete")
  expect(reduceAccountServiceSampleB(restored, { type: "request", operationId: `${id}-new` })).toBe(restored)
  expect(reduceAccountServiceSampleB(restored, { type: "choose", operation: "revoke" })).toBe(restored)
  expect(reduceAccountServiceSampleB(restored, { type: "outcome", outcome: "success" })).toBe(restored)
  expect(reduceAccountServiceSampleB(restored, { type: "another" })).toBe(restored)
  const queried = reduceAccountServiceSampleB(restored, { type: "request", operationId: id })
  expect(queried.phase).toBe("pending")
  expect(reduceAccountServiceSampleB(queried, { type: "resolve", operationId: id, outcome: "success" }).phase).toBe("done")
})
for (const outcome of ["unknown", "failure"] as const) {
  test(`${outcome} can query/retry the same operation but cannot sign out a session`, () => {
    const unresolved = reduceAccountServiceSampleB(sent("revoke"), { type: "resolve", operationId: id, outcome })
    expect(unresolved.signedOut).toBe(false)
    expect(reduceAccountServiceSampleB(unresolved, { type: "resolve", operationId: id, outcome: "success" })).toBe(unresolved)
    const retried = reduceAccountServiceSampleB(unresolved, { type: "request", operationId: id })
    const done = reduceAccountServiceSampleB(retried, { type: "resolve", operationId: id, outcome: "success" })
    expect(done.operationId).toBe(id)
    expect(done.signedOut).toBe(true)
  })
}
test("only a completed operation may begin another; prior sample session termination is retained", () => {
  const pending = sent("revoke")
  expect(reduceAccountServiceSampleB(pending, { type: "another" })).toBe(pending)
  const done = reduceAccountServiceSampleB(pending, { type: "resolve", operationId: id, outcome: "success" })
  const next = reduceAccountServiceSampleB(done, { type: "another" })
  expect(next).toEqual({ ...initialAccountServiceSampleB(), signedOut: true })
  expect(restoreAccountServiceSampleB(next)).toEqual(next)
})
test("the prepared journal strictly validates state, operation IDs and excludes injected PII", () => {
  for (const input of [null, [], {}, { ...sent(), version: 2 }, { ...sent(), sampleOnly: false }, { ...sent(), operation: "real-delete" }, { ...sent(), phase: "approved" }, { ...sent(), outcome: "live" }, { ...sent(), operationId: "" }, { ...initialAccountServiceSampleB(), operationId: id }, { ...sent(), signedOut: "true" }, { ...sent("revoke"), phase: "done", signedOut: false }]) {
    expect(restoreAccountServiceSampleB(input)).toBeNull()
  }
  const restored = restoreAccountServiceSampleB({ ...sent(), passportNumber: "not-allowed", address: "not-allowed" })!
  expect(Object.keys(restored).sort()).toEqual(["operation", "operationId", "outcome", "phase", "sampleOnly", "signedOut", "version"])
})
