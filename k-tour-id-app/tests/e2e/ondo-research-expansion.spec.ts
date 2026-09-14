import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test, type Locator } from "@playwright/test"
import { expectBRuntimeClean, installBRuntimeGuard } from "../helpers/ondo-b-qa"

type Locale = "ko" | "en" | "ja"
type ResearchFixture = {
  id: string
  name: Record<Locale, string>
  signature: Record<Locale, string>
  address: string
  latitude: number
  longitude: number
  checkedAt: string
  sources: Array<{ url: string; title: string }>
}

const COPY = {
  ko: { close: "닫기", directions: "길찾기", map: "지도에서 보기", source: "선정 정보", checked: "리서치 확인", category: "메뉴 분류 안내", photoTruth: "메뉴 분류 일러스트. 이 장소나 실제 메뉴 사진이 아닙니다", researchTruth: "공개 가이드를 바탕으로 골랐어요. 실시간 인기 순위는 아니며, 오늘의 영업시간과 메뉴는 매장에 확인해 주세요.", activityTruth: "샘플 30분 동안의 방문·사진·업데이트 예시예요. 실제 방문자, 게시된 사진이나 장소 평점은 아니에요." },
  en: { close: "Close", directions: "Directions", map: "On map", source: "About this pick", checked: "Research checked", category: "Category guide", photoTruth: "Category illustration, not a photo of this venue or its menu", researchTruth: "Selected from published guides, not a live popularity ranking. Check today’s hours and menu with the venue.", activityTruth: "Prepared visits, photos and updates in a sample 30-minute window. Not real visitors, posted photos or a place rating." },
  ja: { close: "閉じる", directions: "ルート", map: "地図で見る", source: "選定について", checked: "調査確認", category: "メニューの分類", photoTruth: "メニュー分類のイラスト。この店や実際のメニューの写真ではありません", researchTruth: "公開ガイドから選んだスポットです。リアルタイムの人気順位ではありません。当日の営業時間とメニューはお店にご確認ください。", activityTruth: "サンプル30分間の訪問・写真・更新のイメージ。実際の訪問者、投稿写真や店舗評価ではありません。" },
} as const

const SCENARIOS = [
  { city: "seoul", width: 320, locale: "ko", appearance: "dark", review: true, additions: [{ id: "research-seoul-okdongsik", subject: "soup" }, { id: "research-seoul-geumdwaeji-sikdang", subject: "grill" }] },
  { city: "busan", width: 390, locale: "en", appearance: "light", review: true, additions: [{ id: "research-busan-hapcheon-gukbapjip", subject: "soup" }, { id: "research-busan-haeundae-amso-galbijip", subject: "grill" }] },
  { city: "jeju", width: 430, locale: "ja", appearance: "dark", review: false, additions: [{ id: "research-jeju-oneunjeong-gimbap", subject: "food" }, { id: "research-jeju-yaksuteo-olle-market", subject: "beer" }] },
] as const

async function expectCategoryIllustration(container: Locator, subject: string, locale: Locale) {
  const figure = container.locator("[data-food-photo]")
  await expect(figure).toHaveAttribute("data-food-photo", "category-placeholder")
  await expect(figure).toHaveAttribute("data-food-subject", subject)
  await expect(figure).toHaveAttribute("data-photo-state", "not-provided")
  expect(await figure.getAttribute("aria-label")).toContain(COPY[locale].photoTruth)
  await expect(figure.locator("figcaption")).toHaveText(COPY[locale].category)
  await expect(figure.locator("img")).toHaveCount(0)
}

test.afterEach(async ({ page }, testInfo) => {
  await expectBRuntimeClean(page, testInfo)
})

for (const scenario of SCENARIOS) {
  // Expected directions come from the raw source fixture, not the application
  // URL builder or map state. A wrong implementation must not certify itself.
  const places = JSON.parse(readFileSync(resolve(`data/ondo/research/${scenario.city}-food-pulse.json`), "utf8")) as ResearchFixture[]
  test(`RESEARCH-EXPANSION ${scenario.city}: both new picks preserve public discovery, ${scenario.width}px ${scenario.locale} ${scenario.appearance} ${scenario.review ? "sample" : "review=0"}`, async ({ page }, testInfo) => {
    test.setTimeout(90_000)
    installBRuntimeGuard(page)
    await page.setViewportSize({ width: scenario.width, height: 844 })
    await page.emulateMedia({ colorScheme: scenario.appearance, reducedMotion: "reduce" })
    // Only device preferences are prepared. No private map hooks, identity
    // receipts, account state or reviewer overrides are injected.
    await page.addInitScript(({ locale, appearance }) => {
      localStorage.setItem("ondo-b.device.v1", JSON.stringify({ locale, appearancePreference: appearance, onboarding: "ONB-COMPLETE" }))
    }, { locale: scenario.locale, appearance: scenario.appearance })
    await page.goto(`/?city=${scenario.city}&review=${scenario.review ? "1" : "0"}`, { waitUntil: "domcontentloaded" })
    const entry = page.getByTestId("ondo-b-map-entry")
    const map = page.getByTestId("maplibre-map")
    const toggle = page.getByTestId("ondo-b-view-toggle")
    const search = page.getByTestId("ondo-b-search")
    const list = page.getByTestId("researched-food-list")
    const copy = COPY[scenario.locale]
    await expect(entry).toHaveAttribute("data-city", scenario.city)
    await expect(entry).toHaveAttribute("data-map-appearance", scenario.appearance)
    await expect(map).toHaveAttribute("data-map-state", "ready", { timeout: 30_000 })
    await expect(entry).toHaveAttribute("data-effective-view", "map")
    if (!scenario.review) {
      await expect(page.getByTestId("ondo-temperature-timeline")).toHaveCount(0)
      await expect(page.getByTestId("sample-traveler-map-events")).toHaveCount(0)
    }
    await toggle.click()
    await expect(entry).toHaveAttribute("data-effective-view", "list")
    await expect(list.locator("button[data-research-id]")).toHaveCount(8)
    expect(places).toHaveLength(8)

    for (const addition of scenario.additions) {
      await test.step(`${addition.id}: search → detail → close → on map → restored list`, async () => {
        const place = places.find(candidate => candidate.id === addition.id)
        expect(place, "the added public record must exist in its source city").toBeDefined()
        if (!place) throw new Error(`Missing fixture ${addition.id}`)
        expect(place.checkedAt).toBe("2026-09-11")
        await expect(list.locator(`button[data-research-id="${place.id}"]`)).toHaveCount(1)
        await search.fill(place.name[scenario.locale])
        await expect(entry).toHaveAttribute("data-research-result-count", "1")
        await expect(page.getByTestId("ondo-b-result-bar")).toHaveAttribute("data-result-source", "directory-and-editorial-research")
        await expect(list.locator("button[data-research-id]")).toHaveCount(1)
        await expect(page.getByTestId("ondo-b-empty-results")).toHaveCount(0)
        const card = list.locator(`button[data-research-id="${place.id}"]`)
        await expect(card).toHaveAccessibleName(`${place.name[scenario.locale]} · ${place.signature[scenario.locale]}`)
        await expectCategoryIllustration(card, addition.subject, scenario.locale)
        await card.click()
        const detail = page.getByTestId("researched-food-detail")
        const sheet = page.getByTestId("ondo-sheet").filter({ has: detail })
        await expect(detail).toHaveAttribute("data-research-id", place.id)
        await expect(detail).toHaveAttribute("data-origin", "EDITORIAL_RESEARCH")
        await expect(detail.getByRole("heading", { name: place.name[scenario.locale], exact: true })).toBeVisible()
        await expectCategoryIllustration(detail, addition.subject, scenario.locale)
        const disclosure = detail.locator("details")
        const checked = disclosure.getByText(`${copy.checked}: ${place.checkedAt}`, { exact: true })
        await expect(disclosure).not.toHaveAttribute("open", "")
        await expect(checked).toBeHidden()
        await disclosure.locator("summary").filter({ hasText: copy.source }).click()
        await expect(disclosure).toHaveAttribute("open", "")
        await expect(checked).toBeVisible()
        await expect(disclosure.getByText(copy.researchTruth, { exact: true })).toBeVisible()
        await expect(disclosure.getByText(place.address, { exact: true })).toBeVisible()
        await expect(disclosure.locator("li a")).toHaveCount(place.sources.length)
        for (const source of place.sources) {
          const link = disclosure.getByRole("link", { name: source.title, exact: true })
          await expect(link).toHaveAttribute("href", source.url)
          await expect(link).toHaveAttribute("target", "_blank")
          await expect(link).toHaveAttribute("rel", "noopener noreferrer")
        }
        const footer = sheet.locator("[data-sheet-footer]")
        const directions = footer.getByRole("link", { name: copy.directions, exact: true })
        await expect(directions).toHaveAttribute("href", `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${place.latitude},${place.longitude}`)}`)
        await expect(directions).toHaveAttribute("target", "_blank")
        await expect(directions).toHaveAttribute("rel", "noopener noreferrer")
        // This is sourced discovery, not a booking, identity-verification or
        // rating flow: its only footer actions are directions and map return.
        await expect(footer.getByRole("link")).toHaveCount(1)
        await expect(footer.getByRole("button")).toHaveCount(1)
        await expect(detail.getByRole("button")).toHaveCount(0)
        await expect(page.getByTestId("ondo-b-action-gate")).toHaveCount(0)
        await expect(page.getByTestId("k-tour-id-setup")).toHaveCount(0)
        // List view unmounts the painted map sample and clears its ephemeral
        // presentation. Sourced research must not manufacture a pulse here.
        await expect(detail.getByTestId("canonical-place-pulse")).toHaveCount(0)
        await expect(detail.getByTestId("sample-traveler-contributions")).toHaveCount(0)
        await expect(detail.getByTestId("sample-add-moment")).toHaveCount(0)
        expect(await sheet.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
        expect(await page.locator("html").evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
        await checked.scrollIntoViewIfNeeded()
        await page.screenshot({ path: testInfo.outputPath(`${place.id}-${scenario.locale}-${scenario.width}-sources.png`) })

        await sheet.getByRole("button", { name: copy.close, exact: true }).click()
        await expect(detail).toBeHidden()
        await expect(entry).toHaveAttribute("data-effective-view", "list")
        await expect(search).toHaveValue(place.name[scenario.locale])
        await expect(card).toBeFocused()
        await card.click()
        await footer.getByRole("button", { name: copy.map, exact: true }).click()
        await expect(detail).toBeHidden()
        await expect(entry).toHaveAttribute("data-effective-view", "map")
        await expect(entry).toHaveAttribute("data-city", scenario.city)
        await expect(search).toHaveValue(place.name[scenario.locale])
        await expect.poll(async () => {
          const [longitude, latitude] = (await map.getAttribute("data-map-center") ?? "").split(",").map(Number)
          return Math.abs(longitude - place.longitude) < .0001 && Math.abs(latitude - place.latitude) < .0001
        }, { message: "On map must return to the exact source-fixture coordinates" }).toBe(true)
        if (scenario.review) {
          // A pulse is available only once the native map paints this sample.
          // Open the same filtered point through its real map hit layer, then
          // retain the positive sample/no-rating assertions in that context.
          const timeline = page.getByTestId("ondo-temperature-timeline")
          await expect(timeline).toHaveAttribute("data-sample-core-signature", new RegExp(`${place.id}:`))
          const bounds = await map.boundingBox()
          expect(bounds).not.toBeNull()
          await page.mouse.click(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2)
          await expect(detail).toHaveAttribute("data-research-id", place.id)
          await expect(detail).toHaveAttribute("data-origin", "EDITORIAL_RESEARCH")
          const pulse = detail.getByTestId("canonical-place-pulse")
          await expect(pulse).toHaveAttribute("data-origin", "PREPARED_ILLUSTRATION")
          await expect(pulse).toHaveAttribute("data-temperature-score", "none")
          await expect(pulse).toHaveAttribute("data-sample-venue-id", place.id)
          await expect(pulse.getByTestId("sample-traveler-contributions")).toHaveAccessibleName(copy.activityTruth)
          await expect(detail.getByTestId("sample-add-moment")).toHaveCount(0)
          await sheet.getByRole("button", { name: copy.close, exact: true }).click()
          await expect(detail).toBeHidden()
          await expect(entry).toHaveAttribute("data-effective-view", "map")
          await expect(search).toHaveValue(place.name[scenario.locale])
        }
        await toggle.click()
        await expect(entry).toHaveAttribute("data-effective-view", "list")
        await expect(card).toBeVisible()
        await expect(list.locator("button[data-research-id]")).toHaveCount(1)
        await search.fill("")
        await expect(list.locator("button[data-research-id]")).toHaveCount(8)
      })
    }
  })
}
