import { expect, test } from "@playwright/test"
import { existsSync, readFileSync, statSync } from "node:fs"
import { resolve } from "node:path"

const root = process.cwd()
const media = [
  "public/editorial/people/ondo-onboarding-travelers-v2-landscape.jpg",
  "public/editorial/people/ondo-tables-dinner-v2-landscape.jpg",
  "public/editorial/people/ondo-my-korea-inspiration-v2-landscape.jpg",
] as const
const marks = [
  "public/brand/ondo-mark.svg",
  "public/brand/ondo-mark-inverse.svg",
  "public/brand/ondo-lockup.svg",
  "public/brand/ondo-mark-micro-16.svg",
  "public/brand/ondo-mark-micro-20.svg",
  "public/brand/ondo-mark-micro-24.svg",
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
  expect(registry).toContain("Never use in identity, eKYC, credential, official evidence or verified-traveler UI")
  expect(registry).toContain("Never use in Table detail, chat, avatar, matching, attendance, check-in, venue evidence or safety proof")
  expect(registry).toContain("Hide when user history exists")
})

test("BRAND-MEDIA-002 ONDO mark is a flat vector brand object, not an official seal", () => {
  const registry = readFileSync(resolve(root, "docs/ONDO_GENERATED_MEDIA_REGISTRY.md"), "utf8")

  for (const path of marks) {
    const source = readFileSync(resolve(root, path), "utf8")
    expect(source).toContain("<svg")
    expect(source).not.toMatch(/<(?:filter|linearGradient|radialGradient|text)\b/)
    expect(registry).toContain(path)
  }

  const primary = readFileSync(resolve(root, "public/brand/ondo-mark.svg"), "utf8")
  expect(primary).toContain("#191817")
  expect(primary).not.toContain("<circle")
  expect(primary.match(/<path\b/g)).toHaveLength(3)
  expect(primary).toContain('fill-rule="evenodd"')
  expect(registry).toContain("not a government, identity or payment seal")
})

test("BRAND-MEDIA-004 ONDO ships optically tuned micro marks and written usage guards", () => {
  const guide = readFileSync(resolve(root, "public/brand/README.md"), "utf8")
  const expected = [16, 20, 24] as const

  for (const size of expected) {
    const path = resolve(root, `public/brand/ondo-mark-micro-${size}.svg`)
    const source = readFileSync(path, "utf8")
    expect(existsSync(path)).toBe(true)
    expect(source).toContain(`width="${size}"`)
    expect(source).toContain(`height="${size}"`)
    expect(source).toContain('shape-rendering="geometricPrecision"')
    expect(source).not.toMatch(/<(?:circle|filter|linearGradient|radialGradient|text)\b/)
  }

  expect(guide).toContain("Clear space")
  expect(guide).toContain("16–24 px")
  expect(guide).toContain("32 px and above")
  expect(guide).toContain("Never use the ONDO mark as")
  expect(guide).toMatch(/favicon|app icon/i)
  expect(guide).toMatch(/identity|eKYC|credential/i)
})

test("BRAND-MEDIA-005 lockup is path-native and has a wider optical field", () => {
  const source = readFileSync(resolve(root, "public/brand/ondo-lockup.svg"), "utf8")
  const component = readFileSync(resolve(root, "features/ondo/shared/ui/ondo-brand-lockup-b.tsx"), "utf8")
  expect(source).toContain('viewBox="0 0 288 64"')
  expect(source).not.toContain("<circle")
  expect(source).not.toContain("#722044")
  expect(source).not.toContain("<text")
  expect(source).toContain('data-part="wordmark"')
  expect(component).toContain('aria-label="ONDO"')
  expect(component).toContain('lang="ko-Hani"')
  expect(component).toContain("溫圖")
  expect(component).toContain('aria-hidden="true"')
})

test("BRAND-MEDIA-003 fictional people never enter identity or evidence source code", () => {
  const forbiddenConsumers = [
    "features/ondo/identity-b/local-check-walkthrough-b.tsx",
    "features/ondo/identity-b/traveler-id-entry-b.tsx",
    "features/ondo/identity-b/ktour-id-setup-b.tsx",
    "features/ondo/after19/after19-global-b.tsx",
    "features/ondo/identity-b/action-gate-coordinator-b.tsx",
    "features/ondo/commerce-b/id-wallet-commerce-b.tsx",
    "features/ondo/pulse-b/japan-first-pulse-model-b.ts",
  ]
  const names = media.map((path) => path.split("/").at(-1)!)

  for (const path of forbiddenConsumers) {
    const source = readFileSync(resolve(root, path), "utf8")
    for (const name of names) expect(source).not.toContain(name)
  }
})
