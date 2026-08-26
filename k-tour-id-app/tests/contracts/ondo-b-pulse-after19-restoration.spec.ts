import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"

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

test("B-PULSE-002 the consumer Table separates canonical venue facts from host-provided gathering fields", () => {
  const tables = source("features/ondo/connect/tables-entry-b.tsx")
  expect(tables).toContain('TABLE_VENUE_ID = "mois-0021cd596bc5b2a922ad"')
  expect(tables).toContain("canonicalMapVenueById(TABLE_VENUE_ID)")
  for (const evidence of [
    "Place record",
    "The host provides the gathering details",
    "table-sample-time",
    "table-sample-menu",
    "table-sample-language",
    "table-sample-cost",
    "table-sample-participants",
  ]) expect(tables).toContain(evidence)
  for (const field of ["table-meeting-point", "3 joined · 1 left", "Join this Table"]) expect(tables).toContain(field)
})

test("B-PULSE-003 joining confirms before Table chat and exposes message, check-in, feedback, leave/report/block", () => {
  const tables = source("features/ondo/connect/tables-entry-b.tsx")
  for (const evidence of ["table-join", "table-join-confirm", "table-open-chat", "table-chat", "table-chat-compose", "table-chat-image", "table-check-in", "table-feedback-submit", "table-report", "table-block", "table-leave"]) {
    expect(tables).toContain(evidence)
  }
  expect(tables).toContain("Messages and photos remain in this tab")
  expect(tables).toContain("Nothing is booked, sent to the venue, or charged")
  expect(tables).not.toMatch(/\bopenDm\b|\bdirectMessage\b|\bmatchmaking\b|["']\/connect\/chat|chat-message-input/)
})

test("B-AFTER19-001 JIT eligibility returns only the 19+ predicate and never claims an official venue restriction", () => {
  const gate = source("features/ondo/after19/after19-jit-b.tsx")
  for (const evidence of [
    "after19-walkthrough",
    "The age check belongs to the Table, not the venue record",
    "Only an eligible 19+ result returns to this Table",
    "Date of birth is never requested or stored",
    "No provider is connected",
  ]) expect(gate).toContain(evidence)
  expect(gate).not.toMatch(/dateOfBirth|birthDate|passportNumber|credentialPayload|verifyAge\(|providerResponse/i)
})

test("B-AFTER19-002 normal controls are single-path while fixture-driven recovery retains exact context", () => {
  const gate = source("features/ondo/after19/after19-jit-b.tsx")
  const returnTo = source("features/ondo/contracts/return-to-b.ts")
  for (const evidence of ["gate-success", "gate-cancel", "gate-failure", "gate-retry", "gate-unsupported", "after19-expiry-notice", "after19-return"]) {
    expect(gate).toContain(evidence)
  }
  for (const hiddenControl of ["gate-failure-choice", "gate-unsupported-choice", "gate-expired-choice"]) expect(gate).not.toContain(hiddenControl)
  expect(gate).toContain("window.__ONDO_B_QA__?.after19")
  for (const evidence of ["BReturnToEnvelope", 'action: "JOIN_TABLE"', "tableId", "venueId", "draft", "activeGate", "expiresAt", "consumedAt", "consumeBReturnTo"]) {
    expect(returnTo).toContain(evidence)
  }
  expect(`${gate}\n${returnTo}`).not.toMatch(/setTimeout|fetch\(|XMLHttpRequest|WebSocket|EventSource|payment|receipt/i)
})

test("B-PULSE-004 the slice keeps concise truth plus EN/KO/JA, modal, keyboard, and responsive contracts", () => {
  const tables = source("features/ondo/connect/tables-entry-b.tsx")
  const gate = source("features/ondo/after19/after19-jit-b.tsx")
  const css = `${source("features/ondo/connect/pulse-table-b.module.css")}\n${source("features/ondo/after19/after19-jit-b.module.css")}`
  const productSource = `${tables}\n${gate}`
  expect(productSource).toContain("How this check works")
  for (const locale of ["en", "ko", "ja"]) expect(productSource).toContain(`${locale}: {`)
  expect(productSource).toContain("useModalIsolation")
  expect(productSource).toContain("onKeyDown")
  expect(productSource).toContain("focusFirstAvailableDestination")
  expect(css).toContain("@media")
  expect(css).toContain("min-height: 44px")
})
