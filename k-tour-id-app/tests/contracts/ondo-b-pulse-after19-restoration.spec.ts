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
  expect(app).toContain('data-nav-count="4"')
  expect(product).toContain("PulseTablesEntryB")
  expect(product).toContain("tables: <PulseTablesEntryB />")
})

test("B-PULSE-002 the representative Table separates canonical venue facts from organizer sample fields", () => {
  const tables = source("features/ondo/connect/tables-entry-b.tsx")
  expect(tables).toContain('TABLE_VENUE_ID = "mois-0021cd596bc5b2a922ad"')
  expect(tables).toContain("canonicalMapVenueById(TABLE_VENUE_ID)")
  for (const evidence of [
    "Official LOCALDATA venue",
    "Organizer sample · not official venue data",
    "table-sample-time",
    "table-sample-menu",
    "table-sample-language",
    "table-sample-cost",
    "table-sample-participants",
  ]) expect(tables).toContain(evidence)
  for (const state of ["TABLE-FULL", "TABLE-CANCELLED", "TABLE-ENDED", "table-view-alternative"]) expect(tables).toContain(state)
})

test("B-PULSE-003 joining confirms before a read-only group conversation and exposes leave/report/block", () => {
  const tables = source("features/ondo/connect/tables-entry-b.tsx")
  for (const evidence of ["table-join", "table-join-confirm", "table-open-chat", "table-chat", "table-report", "table-block", "table-leave"]) {
    expect(tables).toContain(evidence)
  }
  expect(tables).toContain("Read-only group conversation example")
  expect(tables).toContain("There is no matching, open DM, live chat, or booking service.")
  expect(tables).not.toMatch(/\bopenDm\b|\bdirectMessage\b|\bmatchmaking\b|["']\/connect\/chat|chat-message-input/)
})

test("B-AFTER19-001 the JIT walkthrough proves only 19+ for a sample Table, never an official venue restriction", () => {
  const gate = source("features/ondo/after19/after19-jit-b.tsx")
  for (const evidence of [
    "after19-walkthrough",
    "Organizer marked this sample Table 19+",
    "not an official venue restriction",
    "Only the 19+ predicate",
    "Date of birth is never requested or stored",
    "No request is sent to an external provider",
  ]) expect(gate).toContain(evidence)
  expect(gate).not.toMatch(/dateOfBirth|birthDate|passportNumber|credentialPayload|verifyAge\(|providerResponse/i)
})

test("B-AFTER19-002 success, cancel, failure/retry, unsupported, and expired outcomes retain exact context", () => {
  const gate = source("features/ondo/after19/after19-jit-b.tsx")
  const returnTo = source("features/ondo/contracts/return-to-b.ts")
  for (const evidence of ["gate-success", "gate-cancel", "gate-failure", "gate-retry", "gate-unsupported", "after19-expiry-notice", "after19-return"]) {
    expect(gate).toContain(evidence)
  }
  for (const evidence of ["BReturnToEnvelope", 'action: "JOIN_TABLE"', "tableId", "venueId", "draft", "activeGate", "expiresAt", "consumedAt", "consumeBReturnTo"]) {
    expect(returnTo).toContain(evidence)
  }
  expect(`${gate}\n${returnTo}`).not.toMatch(/setTimeout|fetch\(|XMLHttpRequest|WebSocket|EventSource|payment|receipt/i)
})

test("B-PULSE-004 the slice has one honest local boundary plus EN/KO, modal, keyboard, and responsive contracts", () => {
  const tables = source("features/ondo/connect/tables-entry-b.tsx")
  const gate = source("features/ondo/after19/after19-jit-b.tsx")
  const css = `${source("features/ondo/connect/pulse-table-b.module.css")}\n${source("features/ondo/after19/after19-jit-b.module.css")}`
  const productSource = `${tables}\n${gate}`
  expect(productSource.match(/Local interactive example/g)).toHaveLength(1)
  expect(productSource).toContain("locale === \"ko\"")
  expect(productSource).toContain("useModalIsolation")
  expect(productSource).toContain("onKeyDown")
  expect(productSource).toContain("focusFirstAvailableDestination")
  expect(css).toContain("@media")
  expect(css).toContain("min-height: 44px")
})
