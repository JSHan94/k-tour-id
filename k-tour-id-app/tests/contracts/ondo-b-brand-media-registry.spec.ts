import { expect, test } from "@playwright/test"
import { existsSync, readFileSync, statSync } from "node:fs"
import { resolve } from "node:path"

const root = process.cwd()
const media = [
  "public/editorial/people/ondo-onboarding-travelers-v1.jpg",
  "public/editorial/people/ondo-tables-dinner-v1.jpg",
  "public/editorial/people/ondo-my-korea-memory-v1.jpg",
] as const
const marks = [
  "public/brand/ondo-mark.svg",
  "public/brand/ondo-mark-inverse.svg",
  "public/brand/ondo-lockup.svg",
] as const

test("BRAND-MEDIA-001 generated people are bounded, registered editorial assets", () => {
  const registry = readFileSync(resolve(root, "docs/ONDO_GENERATED_MEDIA_REGISTRY.md"), "utf8")

  for (const path of media) {
    const absolute = resolve(root, path)
    expect(existsSync(absolute), path).toBe(true)
    expect(statSync(absolute).size, `${path} should be optimized for product delivery`).toBeGreaterThan(100_000)
    expect(statSync(absolute).size, `${path} should remain below the product media ceiling`).toBeLessThan(800_000)
    expect(registry).toContain(path)
  }

  expect(registry).toMatch(/not documentary\s+evidence/)
  expect(registry).toContain("Never use in identity, eKYC or credential proof")
})

test("BRAND-MEDIA-002 ONDO mark is a flat vector brand object, not an official seal", () => {
  const registry = readFileSync(resolve(root, "docs/ONDO_GENERATED_MEDIA_REGISTRY.md"), "utf8")

  for (const path of marks) {
    const source = readFileSync(resolve(root, path), "utf8")
    expect(source).toContain("<svg")
    expect(source).not.toMatch(/<(?:filter|linearGradient|radialGradient|text)\b/)
    expect(registry).toContain(path)
  }

  expect(readFileSync(resolve(root, "public/brand/ondo-mark.svg"), "utf8")).toContain("#722044")
  expect(registry).toContain("not a government, identity or payment seal")
})

test("BRAND-MEDIA-003 fictional people never enter identity or evidence source code", () => {
  const forbiddenConsumers = [
    "features/ondo/identity-b/local-check-walkthrough-b.tsx",
    "features/ondo/identity-b/traveler-id-entry-b.tsx",
    "features/ondo/commerce-b/id-wallet-commerce-b.tsx",
    "features/ondo/pulse-b/japan-first-pulse-model-b.ts",
  ]
  const names = media.map((path) => path.split("/").at(-1)!)

  for (const path of forbiddenConsumers) {
    const source = readFileSync(resolve(root, path), "utf8")
    for (const name of names) expect(source).not.toContain(name)
  }
})
