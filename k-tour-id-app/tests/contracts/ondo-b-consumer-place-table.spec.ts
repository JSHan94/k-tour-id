import { readFileSync } from "node:fs"
import { expect, test } from "@playwright/test"

function source(path: string) {
  return readFileSync(path, "utf8")
}

test("consumer Place exposes the contextual Table, 19+, Local Signal, and benefit actions", () => {
  const place = source("features/ondo/place/canonical-place-overlay.tsx")

  for (const testId of [
    "canonical-place-table",
    "canonical-after19-required",
    "canonical-local-signal-open",
    "canonical-meal-benefit-open",
  ]) expect(place).toContain(`data-testid=\"${testId}\"`)
  expect(place).toContain("ONDO_OPEN_TABLE_EVENT")
})

test("normal After19 is a single eligibility path and outcome authoring is QA-only", () => {
  const after19 = source("features/ondo/identity-b/action-gate-coordinator-b.tsx")
  const actionGateContract = source("features/ondo/identity-b/action-gate-contract-b.ts")
  const ageModel = source("features/ondo/after19/after19-global-b-model.ts")

  expect(after19).toContain("readQaRuntime<QaRuntime>()")
  expect(after19).toContain('if (gate === "age" && qa?.after19)')
  expect(after19).toContain("Confirm 19+ and continue")
  expect(after19).toContain("Not now — return without changing the action")
  expect(after19).toContain('data-testid={gate === "person" ? "ondo-b-local-check-walkthrough" : gate === "age" ? "after19-walkthrough" : undefined}')
  expect(after19).toContain('data-testid={gate === "person" ? "local-check-boundary-continue" : gate === "age" ? "after19-start" : "action-gate-confirm"}')
  expect(actionGateContract).toContain('if (cta === "JOIN_TABLE") return ["account", "age"]')
  expect(ageModel).toContain("recordGlobalAfter19AgeEligibilityB")
  expect(after19).not.toContain('choices: "Choose an example outcome"')
  expect(after19).not.toContain('data-testid="gate-failure-choice"')
  expect(after19).not.toContain('data-testid="gate-unsupported-choice"')
  expect(after19).not.toContain('data-testid="gate-expired-choice"')
  expect(`${after19}\n${ageModel}`).not.toMatch(/dateOfBirth|passportNumber|credentialPayload|providerResponse/i)
})

test("Tables and Local Signal own photo, retry, chat, check-in, and feedback states", () => {
  const tables = source("features/ondo/connect/tables-entry-b.tsx")
  const tableStyles = source("features/ondo/connect/pulse-table-b.module.css")
  const signal = source("features/ondo/local-signal-b/local-signal-layer-b.tsx")

  for (const testId of [
    "table-chat-compose",
    "table-chat-image",
    "table-message-retry",
    "table-check-in",
    "table-feedback-submit",
    "table-reputation-receipt",
  ]) expect(tables).toContain(`data-testid=\"${testId}\"`)

  for (const testId of [
    "local-signal-photo-input",
    "local-signal-photo-replace",
    "local-signal-photo-remove",
    "local-signal-photo-retry",
  ]) expect(signal).toContain(`data-testid=\"${testId}\"`)

  expect(tables).toContain("MAX_TABLE_CHAT_IMAGE_BYTES")
  expect(tables).toContain("image/jpeg")
  expect(tables).toContain("URL.revokeObjectURL")
  expect(tables).toContain('data-testid="table-chat-image-error"')
  expect(tables).toContain('aria-describedby="tables-editorial-provenance"')
  expect(tables).toContain('id="tables-editorial-provenance"')
  expect(tableStyles).toContain("clip-path: inset(50%)")
  expect(signal).toContain("MAX_LOCAL_SIGNAL_PHOTO_BYTES")
  expect(signal).toContain('data-testid="local-signal-photo-error"')
  expect(signal).toContain("JPEG, PNG, or WebP")
  expect(signal).toContain("10 MB or smaller")
})

test("destructive copy and contextual benefit copy state their exact device and venue boundaries", () => {
  const settings = source("features/ondo/settings/settings-entry-b.tsx")
  const place = source("features/ondo/place/canonical-place-overlay.tsx")

  expect(settings).toContain("Travel Wallet receipts")
  expect(settings).toContain("여행 지갑 영수증")
  expect(place).toContain('demoOffer: "K-Tour ID benefit"')
  expect(place).toContain('demoOfferBody: "₩22,000 · save ₩3,000"')
  expect(place).toContain('demoOfferPrice: "₩19,000"')
  expect(place).not.toContain("Confirm payment support with the venue")
})

test("consumer copy removes internal scenario-runner vocabulary", () => {
  const paths = [
    "features/ondo/place/canonical-place-overlay.tsx",
    "features/ondo/connect/tables-entry-b.tsx",
    "features/ondo/identity-b/action-gate-coordinator-b.tsx",
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
