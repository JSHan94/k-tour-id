import { readFileSync } from "node:fs"
import { expect, test } from "@playwright/test"

function source(path: string) {
  return readFileSync(path, "utf8")
}

test("consumer Place exposes the contextual Table, 19+, Local Signal, and benefit actions", () => {
  const place = source("features/ondo/place/canonical-place-overlay.tsx")

  for (const testId of [
    "canonical-table-open",
    "canonical-after19-open",
    "canonical-local-signal-open",
    "canonical-demo-meal-offer-open",
  ]) expect(place).toContain(`data-testid=\"${testId}\"`)
  expect(place).toContain("ONDO_OPEN_TABLE_EVENT")
})

test("normal After19 is a single eligibility path and outcome authoring is QA-only", () => {
  const after19 = source("features/ondo/after19/after19-jit-b.tsx")

  expect(after19).toContain("useQaControls")
  expect(after19).toContain("qaControls ?")
  expect(after19).toContain("Verify and continue")
  expect(after19).toContain("Not now")
  expect(after19).not.toContain('choices: "Choose an example outcome"')
})

test("Tables and Local Signal own photo, retry, chat, check-in, and feedback states", () => {
  const tables = source("features/ondo/connect/tables-entry-b.tsx")
  const signal = source("features/ondo/local-signal-b/local-signal-layer-b.tsx")

  for (const testId of [
    "table-chat-compose",
    "table-chat-photo",
    "table-message-retry",
    "table-check-in",
    "table-feedback-submit",
    "table-reputation-receipt",
  ]) expect(tables).toContain(`data-testid=\"${testId}\"`)

  for (const testId of [
    "local-signal-photo",
    "local-signal-photo-replace",
    "local-signal-photo-remove",
    "local-signal-photo-retry",
  ]) expect(signal).toContain(`data-testid=\"${testId}\"`)
})

test("consumer copy removes internal scenario-runner vocabulary", () => {
  const paths = [
    "features/ondo/place/canonical-place-overlay.tsx",
    "features/ondo/connect/tables-entry-b.tsx",
    "features/ondo/after19/after19-jit-b.tsx",
    "features/ondo/local-signal-b/local-signal-layer-b.tsx",
  ]
  const consumerCopy = paths.map(source).join("\n")

  for (const phrase of [
    "Choose an example outcome",
    "Show failure example",
    "Show provider-unavailable example",
    "Show expired-proof example",
    "Organizer sample",
    "Sample time",
    "Open group conversation preview",
  ]) expect(consumerCopy).not.toContain(phrase)
})
