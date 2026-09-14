import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")
const selectorDeclarations = (css: string, selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))
  expect(match, `missing ${selector} declaration`).not.toBeNull()
  return match?.[1] ?? ""
}

test("B-VISUAL-FEATURE-001 Tables uses the same appearance-aware sans display system as the other product roots", () => {
  const tables = source("features/ondo/connect/pulse-table-b.module.css")

  expect(tables).not.toContain("var(--font-noto-serif-kr)")
  expect(tables).toContain("--feature-paper: var(--ondo-canvas, #fff)")
  expect(tables).toContain("--feature-ink: var(--ondo-ink, #191919)")
  expect(tables).toContain("--feature-accent: #4f4f4f")
  expect(tables).toContain("padding: max(32px, env(safe-area-inset-top)) 18px")
  expect(tables).toContain("padding-bottom: calc(36px + env(safe-area-inset-bottom))")
  expect(tables).not.toMatch(/padding-bottom:\s*calc\((?:9[0-9]|1[0-9]{2})px/)
})

test("B-VISUAL-FEATURE-002 feature cards share appearance-aware border, radius, and elevation semantics", () => {
  const tables = source("features/ondo/connect/pulse-table-b.module.css")
  const commerce = source("features/ondo/commerce-b/id-wallet-commerce-b.module.css")
  const local = source("features/ondo/shared/ui/production-local.module.css")

  for (const css of [tables, commerce]) {
    expect(css).toContain("--feature-card: var(--ondo-surface, #fff)")
    expect(css).toMatch(/--feature-border:\s*var\(--ondo-line,/)
    expect(css).toMatch(/--feature-shadow:\s*var\(--ondo-shadow,/)
    expect(css).toContain("border-radius: 22px")
  }
  expect(local).toContain("--feature-card: var(--ondo-surface, #fff)")
  expect(local).toContain("--feature-border: var(--ondo-line,")
  expect(local).toContain("--feature-shadow: var(--ondo-shadow,")
  expect(local).toContain("border-radius: 22px")
})

test("B-VISUAL-FEATURE-003 sheets are scrollable, safe-area aware, and consistent on phones and short landscape", () => {
  const tables = source("features/ondo/connect/pulse-table-b.module.css")
  const after19 = source("features/ondo/identity-b/action-gate-coordinator-b.module.css")
  const commerce = source("features/ondo/commerce-b/id-wallet-commerce-b.module.css")

  for (const css of [tables, after19, commerce]) {
    expect(css).toContain("overscroll-behavior: contain")
    expect(css).toContain("env(safe-area-inset-bottom)")
  }
  expect(tables).toContain("@media (orientation: landscape) and (max-height: 500px)")
  expect(after19).toContain("@media (min-width: 600px) and (max-height: 520px) and (orientation: landscape)")
  expect(after19).toContain("max-height: calc(100dvh - max(16px, env(safe-area-inset-top) + env(safe-area-inset-bottom)))")
  expect(after19).toContain("-webkit-overflow-scrolling: touch")
  expect(commerce).toContain("@media (orientation: landscape) and (max-height: 500px)")
  expect(commerce).toContain("-webkit-overflow-scrolling: touch")
})

test("B-VISUAL-FEATURE-004 controls retain accessible touch and focus states without blue browser-default chrome", () => {
  const after19 = source("features/ondo/identity-b/action-gate-coordinator-b.module.css")
  const shell = source("features/ondo/app/ondo-shell.module.css")
  const css = [
    source("features/ondo/connect/pulse-table-b.module.css"),
    after19,
    source("features/ondo/commerce-b/id-wallet-commerce-b.module.css"),
    source("features/ondo/shared/ui/production-local.module.css"),
    shell,
  ].join("\n")

  expect(css.match(/min-height: 44px/g)?.length ?? 0).toBeGreaterThanOrEqual(8)
  expect(css.match(/:focus-visible/g)?.length ?? 0).toBeGreaterThanOrEqual(4)
  expect(css).toContain("outline: 3px solid var(--ondo-focus, #1d66d1)")
  expect(css).toContain("-webkit-tap-highlight-color: transparent")
  expect(after19).toContain(".dialog button")
  expect(shell).toMatch(/\.stage :focus-visible\s*\{[^}]*outline:\s*2px solid var\(--ondo-focus\)/)
})

test("B-VISUAL-FEATURE-005 feature roots leave navigation reservation to the shared canvas scroll owner", () => {
  const roots = [
    selectorDeclarations(source("features/ondo/connect/pulse-table-b.module.css"), ".entry"),
    selectorDeclarations(source("features/ondo/identity-b/traveler-id-entry-b.module.css"), ".screen"),
    selectorDeclarations(source("features/ondo/shared/ui/production-local.module.css"), ".screen"),
  ].join("\n")

  expect(roots).not.toMatch(/padding(?:-bottom)?:[^;]*(?:96|100|104|108|112|116|120|124|128)px/)
  expect(source("features/ondo/identity-b/traveler-id-entry-b.module.css")).toContain("calc(44px + env(safe-area-inset-bottom))")
})

test("B-VISUAL-FEATURE-006 owned feature CSS never renders visible product copy below 12px", () => {
  const productionLocal = source("features/ondo/shared/ui/production-local.module.css")
  const savedEntry = source("features/ondo/my/saved-entry-b.tsx")
  const ownedCss = [
    "features/ondo/connect/pulse-table-b.module.css",
    "features/ondo/identity-b/action-gate-coordinator-b.module.css",
    "features/ondo/commerce-b/id-wallet-commerce-b.module.css",
    "features/ondo/identity-b/local-check-walkthrough-b.module.css",
    "features/ondo/identity-b/traveler-id-entry-b.module.css",
    "features/ondo/identity-b/ktour-id-setup-b.module.css",
    "features/ondo/labs/labs.module.css",
    "features/ondo/my/saved-entry-b.module.css",
    "features/ondo/map/map-balance-entry-b.module.css",
    "features/ondo/place/place-service-actions-b.module.css",
  ].map(source).join("\n")

  expect(ownedCss).not.toMatch(/font-size:\s*(?:[0-9](?:\.[0-9]+)?|1[01](?:\.[0-9]+)?)px/)
  expect(savedEntry).toContain('<details className={styles.receiptDetails} data-testid="my-korea-receipt-details">')
  expect(selectorDeclarations(productionLocal, ".receiptDetails > summary")).toContain("min-height: 44px")
  // The only sub-12px exception is a user-opened, monospaced receipt identifier,
  // never first-frame product copy. Freeze that narrow exception explicitly.
  const foldedReceiptReference = selectorDeclarations(productionLocal, ".receiptDetails > p")
  expect(foldedReceiptReference).toContain("font-family: ui-monospace")
  expect(foldedReceiptReference).toContain("font-size: 12px")
})
