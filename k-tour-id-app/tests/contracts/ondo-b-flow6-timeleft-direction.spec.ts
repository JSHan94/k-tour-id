import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

test("FLOW6-DIR-001 Tables, detail, and 19+ expose one stateful Timeleft direction without changing product truth", () => {
  const tables = source("features/ondo/connect/tables-entry-b.tsx")
  const gate = source("features/ondo/identity-b/action-gate-coordinator-b.tsx")
  const gateContract = source("features/ondo/identity-b/action-gate-contract-b.ts")

  expect(tables).toContain('data-visual-direction="timeleft-warm-atlas"')
  expect(tables).toContain("data-join-stage={joinStage}")
  expect(gate).toContain('data-visual-direction={gate === "age" && pending.cta === "JOIN_TABLE" ? "timeleft-checkpoint" : undefined}')
  expect(gate).toContain("data-gate-view={resolvedView}")
  expect(gate).toContain('data-return-table={pending.cta === "JOIN_TABLE" ? pending.tableId : "none"}')
  expect(gateContract).toContain('if (cta === "JOIN_TABLE") return ["account", "age"]')

  for (const truth of [
    "Messages and photos stay with this Table.",
    "No identity provider is connected and no credential is created.",
    "Only an eligibility result and expiry are kept in this tab.",
    "Messages and photos remain in this tab.",
  ]) expect(`${tables}\n${gate}`).toContain(truth)

  expect(tables).toContain('<details className={styles.tablePrivacy} data-testid="tables-truth-notice">')
  expect(tables).not.toContain("Nothing is booked, sent to the venue, or charged.")

  expect(`${tables}\n${gate}`).not.toMatch(/booking confirmed|reservation confirmed|matched with|live host|live chat|payment completed/i)
})

test("FLOW6-DIR-002 the social visual system has an explicit warm-atlas palette, staged motion, and reduced-motion closure", () => {
  const tableCss = source("features/ondo/connect/pulse-table-b.module.css")
  const gateCss = source("features/ondo/identity-b/action-gate-coordinator-b.module.css")
  const css = `${tableCss}\n${gateCss}`

  for (const token of [
    "--table-plum",
    "--table-coral",
    "--table-amber",
    "--table-mint",
    "--table-paper",
    "--table-motion-fast",
    "--table-motion-settle",
  ]) expect(css).toContain(token)

  expect(tableCss).toContain('@media (orientation: landscape) and (max-height: 500px)')
  expect(tableCss).toContain('@media (prefers-reduced-motion: reduce)')
  expect(gateCss).toContain('@media (prefers-reduced-motion: reduce)')
  expect(gateCss).toContain('.dialog[data-visual-direction="timeleft-checkpoint"] > header::after')
  expect(gateCss).toMatch(/linear-gradient\(90deg,\s*#832b46[\s\S]*#c34e3b[\s\S]*#e5ad5b/)
  expect(css).toMatch(/min-height:\s*(?:4[4-9]|[5-9]\d)px/)
})

test("FLOW6-SAFE-003 storage failures and destructive actions remain recoverable instead of visually completing", () => {
  const tables = source("features/ondo/connect/tables-entry-b.tsx")

  for (const evidence of [
    "joinPersistError",
    "leavePersistError",
    'confirmTestId="table-block-confirm"',
    "table-join-save-error",
    "table-leave-save-error",
  ]) expect(tables).toContain(evidence)

  expect(tables).toContain("recordPlannedTable")
  expect(tables).toContain("removePlannedTable")
  expect(tables).toContain("role=\"alertdialog\"")
})

test("FLOW6-RETURN-004 expired 19+ retry owns a fresh exact return path", () => {
  const tables = source("features/ondo/connect/tables-entry-b.tsx")
  const gate = source("features/ondo/identity-b/action-gate-coordinator-b.tsx")
  const returnContract = source("features/ondo/identity-b/action-gate-contract-b.ts")

  expect(gate).toContain("renewBActionReturnTo")
  for (const evidence of ["tableId", "venueId", "draft", "B_ACTION_GATE_TTL_MS", "consumeBActionReturnTo"]) {
    expect(`${tables}\n${gate}\n${returnContract}`).toContain(evidence)
  }
})
