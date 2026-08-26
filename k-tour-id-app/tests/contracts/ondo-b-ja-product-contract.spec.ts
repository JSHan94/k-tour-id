import { expect, test } from "@playwright/test"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

test("JA-B-001 Japanese is a complete persisted locale, not a partial visual toggle", () => {
  const preferences = source("features/ondo/shared/state/ondo-b-preferences.ts")
  const provider = source("features/ondo/shared/state/ondo-b-provider.tsx")
  const onboarding = source("features/ondo/onboarding/official-directory-onboarding.tsx")
  const settings = source("features/ondo/settings/settings-entry-b.tsx")
  const app = source("features/ondo/app/ondo-app-b.tsx")

  expect(preferences).toContain('export type OndoBLocale = "en" | "ko" | "ja"')
  expect(preferences).toContain('["en", "ko", "ja"]')
  expect(provider).toContain('record.locale === "ko" || record.locale === "ja" ? record.locale : "en"')
  expect(provider).toContain('startsWith("ja")')
  for (const locale of ["en", "ko", "ja"]) {
    expect(onboarding).toContain(`data-locale-choice="${locale}"`)
    expect(onboarding).toContain(`actions.setLocale("${locale}")`)
  }
  expect(settings).toContain('setLocale("ja")')
  expect(settings).toContain("日本語")
  expect(app).toContain('data-nav-count="5"')
})

test("JA-B-002 every reachable B journey owns Japanese truth copy without changing actions", () => {
  const sources = [
    "features/ondo/map/map-entry-b.tsx",
    "features/ondo/place/canonical-place-overlay.tsx",
    "features/ondo/connect/tables-entry-b.tsx",
    "features/ondo/after19/after19-jit-b.tsx",
    "features/ondo/local-signal-b/local-signal-layer-b.tsx",
    "features/ondo/identity-b/local-check-walkthrough-b.tsx",
    "features/ondo/identity-b/traveler-id-entry-b.tsx",
    "features/ondo/commerce-b/id-wallet-commerce-b.tsx",
    "features/ondo/my/saved-entry-b.tsx",
    "features/ondo/settings/settings-entry-b.tsx",
  ].map(source)

  for (const item of sources) expect(item).toMatch(/\bja\s*:/)
  expect(sources.join("\n")).toContain("ステーブルコインやオンチェーン資産")
  expect(sources.join("\n")).toContain("生年月日")
  expect(sources.join("\n")).toContain("公式")
})

test("JA-B-003 Korean official facts remain Korean while Japanese labels explain their boundary", () => {
  const display = source("lib/ondo/venues/display.ts")
  const place = source("features/ondo/place/canonical-place-overlay.tsx")
  const map = source("features/ondo/map/map-entry-b.tsx")

  expect(display).toContain('return locale === "ko" ? name : romanizeKorean(name)')
  expect(display).toContain("韓国語の公式名称")
  expect(display).toContain("公式日本語名ではありません")
  expect(place).toContain("韓国行政安全部 LOCALDATA")
  expect(map).toContain("公式ディレクトリ記録ではありません")
})

test("JA-B-004 original editorial art is visually primary and external provenance stays separate", () => {
  const model = source("features/ondo/pulse-b/japan-first-pulse-model-b.ts")
  const discovery = source("features/ondo/map/japan-first-discovery-b.tsx")
  const css = source("features/ondo/map/japan-first-discovery-b.module.css")
  const assets = [
    "japan-first-c01-sesame-oil.jpg",
    "japan-first-c03-seoul-eight-hours.jpg",
    "japan-first-c06-beauty-research.jpg",
    "japan-first-c18-jeju-screen-route.jpg",
    "japan-first-c20-jeju-kpop-route.jpg",
  ]

  for (const asset of assets) {
    const path = resolve(process.cwd(), "public/editorial", asset)
    expect(existsSync(path), asset).toBe(true)
    const bytes = readFileSync(path)
    expect(bytes.subarray(0, 2).toString("hex")).toBe("ffd8")
  }
  expect(model.match(/rightsMode: "ondo-original",/g)?.length).toBe(5)
  expect(model.match(/ja: "ONDO編集イラスト"/g)?.length).toBe(5)
  expect(discovery).toContain("item.editorialMedia.credit[locale]")
  expect(discovery).not.toMatch(/<figcaption>\{item\.sourceReferences\[0\]\.label\}/)
  expect(discovery).toContain("<SourceLinks")
  expect(css).toContain("aspect-ratio: 3 / 2")
  expect(css).toContain("min-height: 44px")
})

test("JA-B-005 Japanese-first editorial UI does not repeat its Japanese headline or imply live heat", () => {
  const discovery = source("features/ondo/map/japan-first-discovery-b.tsx")
  const model = source("features/ondo/pulse-b/japan-first-pulse-model-b.ts")

  expect(discovery).toContain('locale === "ja" ? null : <p lang="ja">')
  expect(discovery).toContain("BookOpenText")
  expect(discovery).not.toContain("<Flame")
  expect(model).not.toContain("クリニックMAP")
})
