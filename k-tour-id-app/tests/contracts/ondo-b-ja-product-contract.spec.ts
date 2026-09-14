import { expect, test } from "@playwright/test"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { transliterateKoreanForJapanese, venueDistrictLabel, venueNamePresentation } from "../../lib/ondo/venues/display"
import { ONDO_B_JEJU_TABLE } from "../../features/ondo/connect/table-model"
import { gatePlanForBAction } from "../../features/ondo/identity-b/action-gate-contract-b"

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
  expect(onboarding).toContain("actions.setLocale(locale)")
  expect(onboarding).toContain('(["en", "ko", "ja"] as const).map((locale)')
  expect(onboarding).toContain("aria-pressed={state.locale === locale}")
  expect(settings).toContain("actions.setLocale(next)")
  expect(settings).toContain('(["ko", "en", "ja"] as const).map((choice)')
  expect(settings).toContain("日本語")
  expect(app).toContain('data-nav-count="5"')
})

test("JA-B-002 every reachable B journey owns Japanese truth copy without changing actions", () => {
  const actionGate = source("features/ondo/identity-b/action-gate-coordinator-b.tsx")
  const actionGateContract = source("features/ondo/identity-b/action-gate-contract-b.ts")
  const tablePolicy = source("features/ondo/connect/table-policy-b.ts")
  const tableModel = source("features/ondo/connect/table-model.ts")
  const ageModel = source("features/ondo/after19/after19-global-b-model.ts")
  const sources = [
    "features/ondo/map/map-entry-b.tsx",
    "features/ondo/place/canonical-place-overlay.tsx",
    "features/ondo/connect/tables-entry-b.tsx",
    "features/ondo/identity-b/action-gate-coordinator-b.tsx",
    "features/ondo/local-signal-b/local-signal-layer-b.tsx",
    "features/ondo/identity-b/local-check-walkthrough-b.tsx",
    "features/ondo/identity-b/traveler-id-entry-b.tsx",
    "features/ondo/commerce-b/id-wallet-commerce-b.tsx",
    "features/ondo/my/saved-entry-b.tsx",
    "features/ondo/settings/settings-entry-b.tsx",
  ].map(source)

  for (const item of sources) expect(item).toMatch(/\bja\s*:/)
  expect(sources.join("\n")).toContain("実際のお金やデジタル資産は移動しません")
  expect(sources.join("\n")).toContain("USDCやUSDTは資金元として選択した場合にだけこの詳細に表示します")
  expect(sources.join("\n")).toContain("生年月日")
  expect(sources.join("\n")).toContain("公式")
  for (const truth of [
    "このセッションで使うアカウントを作成します。本人、19+、K-Tour ID、決済確認は必要な時だけ個別に行います。",
    "19歳以上の確認",
    "生年月日は要求・保存しません。一時的な19歳以上の結果だけがこのTableに戻り、店舗の規則としては表示しません。",
    "本人確認事業者には接続されていません。本人情報は送信せず、資格情報も作成しません。",
    "テーブルとホストへのメモ",
    'cancel: "戻る"',
  ]) expect(actionGate).toContain(truth)
  expect(actionGate).toContain('data-return-table={pending.cta === "JOIN_TABLE" ? pending.tableId : "none"}')
  expect(actionGateContract).toContain("ondoBTablePolicyById(context?.tableId)")
  expect(actionGateContract).toContain('if (!table) return ["account", "person", "age"]')
  expect(actionGateContract).toContain('...(table.requiresPerson ? ["person" as const] : [])')
  expect(actionGateContract).toContain('...(table.alcohol ? ["age" as const] : [])')
  expect(tablePolicy).toContain("ONDO_B_TABLES.map((table)")
  expect(tablePolicy).toContain("requiresPerson: table.requiresPerson")
  expect(tablePolicy).toContain("alcohol: table.alcohol")
  expect(tableModel).toMatch(/export const ONDO_B_TABLE[\s\S]*alcohol:\s*true[\s\S]*requiresPerson:\s*false/)
  expect(tableModel).toContain('id: "table-jeju-haenyeo-supper"')
  expect(gatePlanForBAction("JOIN_TABLE", { tableId: ONDO_B_JEJU_TABLE.id })).toEqual(["account"])
  expect(ageModel).toContain("recordGlobalAfter19ReviewEligibilityB")
  expect(actionGate).toContain('explicitlyRequested: reviewMode')
  expect(actionGate).not.toContain("recordGlobalAfter19AgeEligibilityB")
})

test("JA-B-003 Korean official facts remain Korean while Japanese labels explain their boundary", () => {
  const display = source("lib/ondo/venues/display.ts")
  const place = source("features/ondo/place/canonical-place-overlay.tsx")
  const map = source("features/ondo/map/map-entry-b.tsx")

  expect(transliterateKoreanForJapanese("로바")).toBe("ロバ")
  expect(transliterateKoreanForJapanese("미야비")).toBe("ミヤビ")
  expect(venueNamePresentation("로바", "ja").transliteration).not.toMatch(/[A-Za-z]/)
  expect(venueDistrictLabel("seoul", "마포구", "ja")).toBe("麻浦区")
  expect(venueDistrictLabel("seoul", "강남구", "ja")).toBe("江南区")
  expect(display).toContain("transliterateKoreanForJapanese")
  expect(display).toContain("韓国語の公式名称")
  expect(display).toContain("公式日本語名ではありません")
  expect(place).toContain("韓国行政安全部・LOCALDATA飲食店データ")
  expect(map).toContain("済州・VISITKOREAの編集スポット")
})

test("JA-B-003A Japanese traveler surfaces productize Jeju and OpenDID implementation truth", () => {
  const editorialPlace = source("features/ondo/place/editorial-place-overlay-b.tsx")
  const saved = source("features/ondo/my/saved-entry-b.tsx")
  const setup = source("features/ondo/identity-b/ktour-id-setup-b.tsx")

  expect(editorialPlace).toContain('truth: "済州の旅スポット"')
  expect(editorialPlace).toContain('sourceDetails: "情報源の詳細"')
  expect(editorialPlace).toContain("<details className={styles.sources}")
  expect(saved).toContain('removeEditorial: "保存から削除"')
  expect(setup).toContain('holder: "トラベルパスに追加"')
  expect(setup).toContain('presentationRetention: "今回の依頼だけに使用 · 自動で期限切れ · 結果は保存しない"')
  expect(setup).toContain("<IdentityHolderStepB locale={state.locale}")
  const holder = source("features/ondo/identity-b/identity-holder-step-b.tsx")
  expect(holder).toContain('eyebrow: "トラベルパス"')
  expect(holder).toContain("K-Tour IDの下書き")
  expect(holder).toContain("デモ専用です。")
  expect(setup).not.toContain("meta={[CREDENTIAL_TYPE, copy.holderMeta]}")
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
