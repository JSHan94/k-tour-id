import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

test("FLOW6-DIR-001 Tables, detail, and 19+ expose one stateful Timeleft direction without changing product truth", () => {
  const tables = source("features/ondo/connect/tables-entry-b.tsx")
  const gate = source("features/ondo/after19/after19-jit-b.tsx")

  expect(tables).toContain('data-visual-direction="timeleft-warm-atlas"')
  expect(tables).toContain("data-join-stage={joinStage}")
  expect(gate).toContain('data-visual-direction="timeleft-checkpoint"')
  expect(gate).toContain("data-gate-view={view}")

  for (const truth of [
    "Nothing is booked, sent to the venue, or charged.",
    "No provider is connected and no credential is created.",
    "The age check belongs to the Table, not the venue record.",
    "Messages and photos remain in this tab.",
  ]) expect(`${tables}\n${gate}`).toContain(truth)

  expect(`${tables}\n${gate}`).not.toMatch(/booking confirmed|reservation confirmed|matched with|live host|live chat|payment completed/i)
})

test("FLOW6-DIR-002 the social visual system has an explicit warm-atlas palette, staged motion, and reduced-motion closure", () => {
  const tableCss = source("features/ondo/connect/pulse-table-b.module.css")
  const gateCss = source("features/ondo/after19/after19-jit-b.module.css")
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
  const gate = source("features/ondo/after19/after19-jit-b.tsx")
  const returnContract = source("features/ondo/contracts/return-to-b.ts")

  expect(`${tables}\n${gate}`).toMatch(/retryExpired|refreshReturn|renewReturn|onExpiredRetry/)
  for (const evidence of ["tableId", "venueId", "draft", "B_RETURN_TO_TTL_MS", "consumeBReturnTo"]) {
    expect(`${tables}\n${gate}\n${returnContract}`).toContain(evidence)
  }
})
