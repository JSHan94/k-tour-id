import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"
import { gatePlanForBAction } from "../../features/ondo/identity-b/action-gate-contract-b"
import { ACTIVE_TABLE_ID } from "../../features/ondo/connect/table-policy-b"

const APP_ROOT = process.cwd()
const source = (path: string) => readFileSync(resolve(APP_ROOT, path), "utf8")

test("B-PULSE-001 B navigation and product mount one live Pulse Table surface", () => {
  const app = source("features/ondo/app/ondo-app-b.tsx")
  const product = source("features/ondo/app/ondo-product-b.tsx")
  expect(app).toContain('id: "tables"')
  expect(app).toContain('tables: "Tables"')
  expect(app).toContain('tables: "테이블"')
  expect(app).toContain('data-nav-count="5"')
  expect(product).toContain("PulseTablesEntryB")
  expect(product).toContain("tables: <PulseTablesEntryB />")
})

test("B-PULSE-002 each Table anchors a local meal plan without inventing a venue booking, host, or seat", () => {
  const tables = source("features/ondo/connect/tables-entry-b.tsx")
  const tableModel = source("features/ondo/connect/table-model.ts")
  const tablePolicy = source("features/ondo/connect/table-policy-b.ts")
  expect(tables).toContain('import { ACTIVE_TABLE_ID, TABLE_VENUE_ID, bTableCheckInFixtureEvidenceId } from "./table-policy-b"')
  expect(tables).toContain('export { ACTIVE_TABLE_ID, TABLE_VENUE_ID } from "./table-policy-b"')
  expect(tableModel).toContain('venueId: "mois-0021cd596bc5b2a922ad"')
  expect(tablePolicy).toContain('import { ONDO_B_TABLE, ONDO_B_TABLES } from "./table-model"')
  expect(tablePolicy).toContain("export const TABLE_VENUE_ID = ONDO_B_TABLE.venueId")
  expect(tablePolicy).toContain("ONDO_B_TABLES.map((table)")
  expect(tables).toContain("canonicalMapVenueById(table.venueId)")
  expect(tables).toContain("editorialPlaceById(table.venueId)")
  expect(tableModel).toContain('id: "table-jeju-haenyeo-supper"')
  expect(tableModel).toContain('placeKind: "editorial"')
  for (const evidence of [
    'official: "Place"',
    "This place anchors the plan. No booking is sent to the venue.",
    "table-sample-time",
    "table-sample-menu",
    "table-sample-language",
    "table-sample-cost",
    "table-sample-participants",
  ]) expect(tables).toContain(evidence)
  for (const field of ["table-meeting-point", "Up to 4 people", "Save this meal plan"]) expect(tables).toContain(field)
  expect(tables).not.toMatch(/The host chose|\d+ joined · \d+ left|Join this Table|Confirm my seat|Your seat is ready/)
})

test("B-PULSE-003 saving confirms before local plan notes and keeps the recovery actions reachable", () => {
  const tables = source("features/ondo/connect/tables-entry-b.tsx")
  for (const evidence of ["table-join", "table-join-confirm", "table-open-chat", "table-chat", "table-chat-compose", "table-chat-image", "table-check-in", "table-feedback-submit", "table-report", "table-block", "table-leave"]) {
    expect(tables).toContain(evidence)
  }
  expect(tables).toContain("Everything stays on this device")
  expect(tables).toContain("Your saved plan, notes and photos stay on this device")
  expect(tables).toContain("Nothing was sent to the place or another person")
  expect(tables).not.toContain("Nothing is booked, sent to the venue, or charged")
  expect(tables).not.toMatch(/\bopenDm\b|\bdirectMessage\b|\bmatchmaking\b|["']\/connect\/chat|chat-message-input/)
})

test("B-AFTER19-001 Table action eligibility returns only the 19+ predicate and never claims an official venue restriction", () => {
  const gate = source("features/ondo/identity-b/action-gate-coordinator-b.tsx")
  const ageModel = source("features/ondo/after19/after19-global-b-model.ts")
  for (const evidence of [
    "after19-walkthrough",
    "Confirm 19+",
    "No date of birth is requested or stored",
    "Only a temporary 19+ result returns to this Table",
    "it is not a rule for the venue",
    'data-testid="age-privacy-disclosure"',
  ]) expect(gate).toContain(evidence)
  for (const evidence of [
    'age: "unverified" | "eligible"',
    "ageExpiresAt: string | null",
    "GLOBAL_AFTER19_AGE_TTL_MS",
    "recordGlobalAfter19ReviewEligibilityB",
  ]) expect(ageModel).toContain(evidence)
  expect(`${gate}\n${ageModel}`).not.toMatch(/dateOfBirth|birthDate|passportNumber|credentialPayload|verifyAge\(|providerResponse/i)
})

test("B-AFTER19-002 normal controls are single-path while fixture-driven recovery retains exact context", () => {
  const tables = source("features/ondo/connect/tables-entry-b.tsx")
  const gate = source("features/ondo/identity-b/action-gate-coordinator-b.tsx")
  const returnTo = source("features/ondo/identity-b/action-gate-contract-b.ts")
  const ageModel = source("features/ondo/after19/after19-global-b-model.ts")
  const provider = source("features/ondo/shared/state/ondo-b-provider.tsx")
  const credentialModel = source("features/ondo/identity-b/ktour-id-setup-model-b.ts")
  for (const evidence of ["after19-start", "action-gate-cancel", "action-gate-retry", "local-check-result", 'type GateView = "intro" | "failure" | "unavailable" | "unsupported" | "expired"', "data-gate-view={resolvedView}", "data-result={resolvedView === \"intro\" ? undefined : resolvedView}", "renewExpiredPendingBAction", "action-gate-return-context"]) {
    expect(gate).toContain(evidence)
  }
  for (const hiddenControl of ["gate-failure-choice", "gate-unsupported-choice", "gate-expired-choice"]) expect(gate).not.toContain(hiddenControl)
  expect(gate).toContain("readQaRuntime<QaRuntime>()")
  expect(gate).toContain('if (gate === "age" && qa?.after19)')
  expect(gatePlanForBAction("JOIN_TABLE", { tableId: ACTIVE_TABLE_ID })).toEqual(["account", "age"])
  expect(gatePlanForBAction("JOIN_TABLE", { tableId: "unregistered" })).toEqual(["account", "person", "age"])
  expect(returnTo).toContain("ondoBTablePolicyById(context?.tableId)")
  expect(returnTo).toContain('...(table.requiresPerson ? ["person" as const] : [])')
  expect(returnTo).toContain('...(table.alcohol ? ["age" as const] : [])')
  expect(returnTo).toContain('return hasExactKeys(candidate, ["tableId"])')
  expect(returnTo).toContain("const privateActionContextByToken = new Map<string, BPrivateActionRecord>()")
  expect(returnTo).toContain('rememberPrivateActionContext(returnTo, { cta: "JOIN_TABLE", draft: input.draft.trim().slice(0, 280) })')
  expect(returnTo.match(/export type BTableActionReturn[\s\S]*?\n\}/)?.[0] ?? "").not.toContain("draft:")
  for (const evidence of ["BTableActionReturn", 'cta: "JOIN_TABLE"', "tableId", "venueId", "draft", "gatePlan", "B_ACTION_GATE_TTL_MS", "expiresAt", "consumedAt", "createBTableActionReturn", "renewBActionReturnTo", "consumeBActionReturnTo", "consumePendingBActionAtMutation"]) {
    expect(returnTo).toContain(evidence)
  }
  expect(gate).toContain('data-return-table={pending.cta === "JOIN_TABLE" ? pending.tableId : "none"}')
  expect(gate).toContain('data-return-venue={pending.cta === "MINT_BADGE" ? "none" : pending.venueId}')
  expect(gate).toMatch(/const authority = createReviewFixtureAuthority\(\{\s*qaRuntimeEnabled: reviewMode,\s*explicitlyRequested: reviewMode,\s*fixtureId: "FX-AGE-SUCCESS"/)
  expect(gate).toMatch(/const execution = reviewFixture\(authority,\s*\{\s*outcome: "success",\s*value: \{ predicate: "AGE_GTE_19" as const, outcome: "eligible" as const \},\s*now: actionAt,/)
  expect(gate).toContain("recordGlobalAfter19ReviewEligibilityB(execution, actionAt)")
  expect(gate).toContain("ageReviewRef.current = { tokenId: pending.tokenId, session: nextAge, execution }")
  expect(gate).toContain('if (!reviewMode || staged?.tokenId !== pending.tokenId)')
  expect(gate).toMatch(/if \(state.identityCredential\?\.claims.ageOver19 === null\) \{\s*if \(!staged.execution \|\| !actions.completeAgeProof\(staged.execution\)\)/)
  expect(gate).toContain('evaluateKPassService(state.identityCredential, { service: "age", now: now.getTime() }).status !== "allowed"')
  expect(provider).toContain("completeKPassDemoAgeProofB(stateRef.current.identityCredential, execution, options, now.getTime())")
  expect(credentialModel).toContain("options.allowReviewFixture !== true || !isLiveReviewFixtureExecution(execution)")
  expect(credentialModel).toContain("credential.claims.ageOver19 !== null")
  expect(credentialModel).toContain("!isSimulatedCredentialActiveB(credential, now)")
  expect(gate).toContain('explicitlyRequested: reviewMode')
  expect(gate).not.toContain("recordGlobalAfter19AgeEligibilityB")
  expect(tables).toContain("requestBActionGate(createBTableActionReturn({ tableId: activeTable.id, venueId: activeVenueId, draft }), actionGateSessionOptions())")
  expect(tables).toContain('detail.cta !== "JOIN_TABLE" || detail.tableId !== activeTableRef.current.id || detail.venueId !== activeTableRef.current.venueId || detail.consumedAt !== null')
  expect(tables).toContain("ondoBTableById(pending.tableId)")
  expect(tables).toContain("targetTable.venueId !== pending.venueId")
  expect(tables).toContain("consumePendingBActionAtMutation(window.sessionStorage, pending, satisfied, new Date(), { ...actionGateSessionOptions(), credential: credentialRef.current })")
  expect(`${gate}\n${returnTo}\n${ageModel}`).not.toMatch(/fetch\(|XMLHttpRequest|WebSocket|EventSource/)
  expect(ageModel).toContain("GlobalAfter19PredicateReceiptB")
  expect(ageModel).toContain('disclosure: "predicate_only"')
  expect(ageModel).not.toMatch(/setTimeout|payment|providerResponse/i)
})

test("B-PULSE-004 the slice keeps concise truth plus EN/KO/JA, modal, keyboard, and responsive contracts", () => {
  const tables = source("features/ondo/connect/tables-entry-b.tsx")
  const gate = source("features/ondo/identity-b/action-gate-coordinator-b.tsx")
  const css = `${source("features/ondo/connect/pulse-table-b.module.css")}\n${source("features/ondo/identity-b/action-gate-coordinator-b.module.css")}`
  const productSource = `${tables}\n${gate}`
  expect(productSource).toContain("No date of birth is requested or stored")
  expect(productSource).toContain('data-testid="age-privacy-disclosure"')
  expect(productSource).toContain("Your saved plan, notes and photos stay on this device")
  expect(tables).toContain('<details className={styles.tablePrivacy} data-testid="tables-truth-notice">')
  for (const locale of ["en", "ko", "ja"]) expect(productSource).toContain(`${locale}: {`)
  expect(productSource).toContain("useModalIsolation")
  expect(productSource).toContain("onKeyDown")
  expect(productSource).toContain("focusFirstAvailableDestination")
  expect(gate).toContain('data-check-origin={pending.cta === "SUBMIT_LOCAL_SIGNAL" ? "local_signal" : pending.cta === "JOIN_TABLE" ? "table" : "checkout"}')
  expect(gate).toContain('data-visual-direction={gate === "age" && pending.cta === "JOIN_TABLE" ? "timeleft-checkpoint" : undefined}')
  expect(css).toContain("@media")
  expect(css).toContain("min-height: 44px")
  expect(css).toContain('.dialog[data-visual-direction="timeleft-checkpoint"] > header::after')
})
