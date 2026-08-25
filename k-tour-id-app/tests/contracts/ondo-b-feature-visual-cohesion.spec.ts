import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

test("B-VISUAL-FEATURE-001 Tables uses the same warm-paper sans display system as the other product roots", () => {
  const tables = source("features/ondo/connect/pulse-table-b.module.css")

  expect(tables).not.toContain("var(--font-noto-serif-kr)")
  expect(tables).toContain("--feature-paper: #f6f2eb")
  expect(tables).toContain("--feature-ink: #24211e")
  expect(tables).toContain("--feature-accent: #b24e3b")
  expect(tables).toContain("padding: max(32px, env(safe-area-inset-top)) 18px")
  expect(tables).toContain("padding-bottom: calc(36px + env(safe-area-inset-bottom))")
  expect(tables).not.toMatch(/padding-bottom:\s*calc\((?:9[0-9]|1[0-9]{2})px/)
})

test("B-VISUAL-FEATURE-002 feature cards share premium border, radius, and elevation semantics", () => {
  const tables = source("features/ondo/connect/pulse-table-b.module.css")
  const commerce = source("features/ondo/commerce-b/id-wallet-commerce-b.module.css")
  const local = source("features/ondo/shared/ui/production-local.module.css")

  for (const css of [tables, commerce, local]) {
    expect(css).toContain("--feature-card: rgb(255 253 249 / 92%)")
    expect(css).toContain("--feature-border: rgb(65 52 42 / 12%)")
    expect(css).toContain("--feature-shadow: 0 18px 48px rgb(52 38 27 / 9%)")
    expect(css).toContain("border-radius: 22px")
  }
})

test("B-VISUAL-FEATURE-003 sheets are scrollable, safe-area aware, and consistent on phones and short landscape", () => {
  const tables = source("features/ondo/connect/pulse-table-b.module.css")
  const after19 = source("features/ondo/after19/after19-jit-b.module.css")
  const commerce = source("features/ondo/commerce-b/id-wallet-commerce-b.module.css")

  for (const css of [tables, after19, commerce]) {
    expect(css).toContain("overscroll-behavior: contain")
    expect(css).toContain("env(safe-area-inset-bottom)")
    expect(css).toContain("@media (orientation: landscape) and (max-height: 500px)")
  }
  expect(after19).toContain("max-height: 100dvh")
  expect(commerce).toContain("-webkit-overflow-scrolling: touch")
})

test("B-VISUAL-FEATURE-004 controls retain accessible touch and focus states without blue browser-default chrome", () => {
  const css = [
    source("features/ondo/connect/pulse-table-b.module.css"),
    source("features/ondo/after19/after19-jit-b.module.css"),
    source("features/ondo/commerce-b/id-wallet-commerce-b.module.css"),
    source("features/ondo/shared/ui/production-local.module.css"),
  ].join("\n")

  expect(css.match(/min-height: 44px/g)?.length ?? 0).toBeGreaterThanOrEqual(8)
  expect(css.match(/:focus-visible/g)?.length ?? 0).toBeGreaterThanOrEqual(4)
  expect(css).toContain("outline: 3px solid rgb(178 78 59 / 38%)")
  expect(css).toContain("-webkit-tap-highlight-color: transparent")
})

test("B-VISUAL-FEATURE-005 feature roots leave navigation reservation to the shared canvas scroll owner", () => {
  const roots = [
    source("features/ondo/connect/pulse-table-b.module.css"),
    source("features/ondo/identity-b/traveler-id-entry-b.module.css"),
    source("features/ondo/shared/ui/production-local.module.css"),
  ].join("\n")

  expect(roots).not.toMatch(/padding(?:-bottom)?:[^;]*(?:96|100|104|108|112|116|120|124|128)px/)
  expect(source("features/ondo/identity-b/traveler-id-entry-b.module.css")).toContain("calc(36px + env(safe-area-inset-bottom))")
})

test("B-VISUAL-FEATURE-006 owned feature CSS never renders visible product copy below 12px", () => {
  const ownedCss = [
    "features/ondo/connect/pulse-table-b.module.css",
    "features/ondo/after19/after19-jit-b.module.css",
    "features/ondo/commerce-b/id-wallet-commerce-b.module.css",
    "features/ondo/identity-b/local-check-walkthrough-b.module.css",
    "features/ondo/identity-b/traveler-id-entry-b.module.css",
    "features/ondo/shared/ui/production-local.module.css",
  ].map(source).join("\n")

  expect(ownedCss).not.toMatch(/font-size:\s*(?:[0-9](?:\.[0-9]+)?|1[01](?:\.[0-9]+)?)px/)
})
