import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import ts from "typescript"

// Execute the exact pure helper without importing its CSS-owning React file.
const holderSource = readFileSync(resolve(process.cwd(), "features/ondo/identity-b/identity-holder-step-b.tsx"), "utf8")
const helperSource = holderSource.slice(holderSource.indexOf("export function prepareHolderOnceB"), holderSource.indexOf("export function IdentityHolderStepB"))
const helperExports: { prepareHolderOnceB?: (attempt: { attempted: boolean; prepared: boolean }, prepare: () => boolean) => boolean } = {}
new Function("exports", ts.transpileModule(helperSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText)(helperExports)
const prepareHolderOnceB = helperExports.prepareHolderOnceB!

test("HOLDER-AUTO-001 repeated preparation observations execute the same preparation at most once", () => {
  const attempt = { attempted: false, prepared: false }
  let preparations = 0
  const prepare = () => { preparations += 1; return true }
  expect(prepareHolderOnceB(attempt, prepare)).toBe(true)
  expect(prepareHolderOnceB(attempt, prepare)).toBe(true)
  expect(prepareHolderOnceB(attempt, () => { throw new Error("stale callback must not execute") })).toBe(true)
  expect(preparations).toBe(1)
})

test("HOLDER-AUTO-002 a rejected preparation stays rejected until an explicit new attempt boundary", () => {
  const attempt = { attempted: false, prepared: false }
  let preparations = 0
  expect(prepareHolderOnceB(attempt, () => { preparations += 1; return false })).toBe(false)
  expect(prepareHolderOnceB(attempt, () => { preparations += 1; return true })).toBe(false)
  expect(preparations).toBe(1)
  expect(prepareHolderOnceB({ attempted: false, prepared: false }, () => { preparations += 1; return true })).toBe(true)
  expect(preparations).toBe(2)
})

test("HOLDER-AUTO-003 reentrant callbacks cannot dispatch another preparation", () => {
  const attempt = { attempted: false, prepared: false }
  let preparations = 0
  expect(prepareHolderOnceB(attempt, () => {
    preparations += 1
    expect(prepareHolderOnceB(attempt, () => { preparations += 1; return true })).toBe(false)
    return true
  })).toBe(true)
  expect(preparations).toBe(1)
})

test("HOLDER-AUTO-004 only the live experience handoff opts in; acknowledgement and all boundary guards remain", () => {
  const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")
  const holder = source("features/ondo/identity-b/identity-holder-step-b.tsx")
  const setup = source("features/ondo/identity-b/ktour-id-setup-b.tsx")
  expect(holder).toContain("autoPrepare = false")
  expect(setup).toContain("autoPrepare={experiencePersonRef.current !== null}")
  const effect = holder.slice(holder.indexOf("if (autoPrepare &&"), holder.indexOf("function continueDelivery"))
  expect(effect).toContain("prepareHolderOnceB(preparationRef.current, onPrepare)")
  expect(effect).not.toContain("onAcknowledge")
  expect(holder).toContain("if (!receipt) { if (!autoPrepare && onPrepare()) setReceipt(true); return }")
  expect(holder).toContain("if (acknowledgedRef.current) return")
  expect(holder).toContain("disabled={autoPrepare && !receipt}")
  const prepare = setup.slice(setup.indexOf("function prepareHolder"), setup.indexOf("function finishHolder"))
  const finish = setup.slice(setup.indexOf("function finishHolder"), setup.indexOf("function openPresentation"))
  for (const boundary of [prepare, finish]) {
    expect(boundary).toContain("experiencePersonRef.current && !experienceHandoffCurrent()")
    expect(boundary).toContain("isIdentitySetupSessionActiveB(session)")
    expect(boundary).toContain('applySampleCheckpoint("holder", "holder_delivery_preview")')
  }
  expect(finish).toContain("if (!holderReceiptRef.current || !reviewMode) return")
  expect(finish).toContain("if (!saved)")
  expect(setup).toContain('data-testid="experience-pass-approve"')
})
