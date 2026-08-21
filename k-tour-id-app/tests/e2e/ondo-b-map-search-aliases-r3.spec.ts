import { expect, test, type Page } from "@playwright/test"
import { MAP_FOOD_INTENT_ALIAS_RULES, mapFoodIntentAliases } from "../../lib/ondo/venues/map-discovery-aliases"
import { expectBRuntimeClean, gotoB, installBRuntimeGuard, prepareBPage, seedB } from "../helpers/ondo-b-qa"

type Locale = "en" | "ko"
type CityId = "seoul" | "busan"

const SEARCH_LABEL = {
  en: "Food place or neighborhood",
  ko: "가게 이름, 지역, 음식 검색",
} as const

const RESULT_SUFFIX = {
  en: "sourced food places",
  ko: "곳의 공식 식음료 장소",
} as const

function resultLabel(locale: Locale, count: number) {
  return locale === "ko" ? `${count}${RESULT_SUFFIX.ko}` : `${count} ${count === 1 ? "sourced food place" : RESULT_SUFFIX.en}`
}

async function openCityList(page: Page, city: CityId) {
  await gotoB(page, `?city=${city}&view=list`)
  await expect(page.getByTestId("ondo-b-venue-list")).toBeVisible()
}

async function search(page: Page, locale: Locale, query: string, count: number) {
  await page.getByLabel(SEARCH_LABEL[locale]).fill(query)
  await expect(page.getByText(resultLabel(locale, count), { exact: true })).toBeVisible()
  const names = page.getByTestId("ondo-b-venue-list").getByTestId("official-source-name")
  await expect(names).toHaveCount(Math.min(count, 30))
  return names.allTextContents()
}

test.describe("R3 D5-R3-002 bounded Map food-intent aliases", () => {
  test.beforeEach(async ({ page }) => {
    installBRuntimeGuard(page)
    await prepareBPage(page)
  })

  test.afterEach(async ({ page }) => {
    await expectBRuntimeClean(page)
  })

  test("the reviewable index only maps explicit source-name tokens to search vocabulary", () => {
    expect(MAP_FOOD_INTENT_ALIAS_RULES).toHaveLength(8)
    for (const rule of MAP_FOOD_INTENT_ALIAS_RULES) {
      expect(Object.keys(rule).sort()).toEqual(["aliases", "officialNameIncludes"])
      expect(rule.aliases.length).toBeGreaterThan(0)
      expect(rule.officialNameIncludes.length).toBeGreaterThan(0)
    }
    expect(mapFoodIntentAliases("이름에 음식 토큰이 없는 공식 장소")).toEqual([])
    expect(mapFoodIntentAliases("피자와 치킨")).toEqual(expect.arrayContaining(["pizza", "chicken"]))
  })

  test("English food intents find only sourced Korean-name matches in Seoul and Busan", async ({ page }) => {
    await seedB(page, { locale: "en" })

    const cityCases = [
      {
        city: "seoul",
        intents: [
          { query: "pizza", count: 3, sourceTokens: ["피자"], example: "고피자 신촌1호점", category: "Global food" },
          { query: "chicken", count: 4, sourceTokens: ["치킨", "통닭"], example: "교촌치킨 명지대점", category: "Specialty" },
          { query: "coffee", count: 4, sourceTokens: ["커피", "카페"], example: "서울커피", category: "Food & drink" },
          { query: "gukbap", count: 3, sourceTokens: ["국밥"], example: "국밥쟁이", category: "Korean food" },
          { query: "kalguksu", count: 5, sourceTokens: ["칼국수"], example: "대선 칼국수", category: "Korean food" },
          { query: "kimbap", count: 3, sourceTokens: ["김밥"], example: "김밥천국", category: "Korean food" },
          { query: "tteokbokki", count: 2, sourceTokens: ["떡볶이"], example: "맛있는 할매 집 떡볶이", category: "Casual meal" },
        ],
      },
      {
        city: "busan",
        intents: [
          { query: "pizza", count: 5, sourceTokens: ["피자"], example: "도미노피자 명지점", category: "Global food" },
          { query: "chicken", count: 11, sourceTokens: ["치킨", "통닭"], example: "국제통닭 수영직영점", category: "Korean food" },
          { query: "coffee", count: 3, sourceTokens: ["커피", "카페"], example: "커피센터(COFFEE CENTRE)", category: "Global food" },
        ],
      },
    ] as const

    for (const { city, intents } of cityCases) {
      await openCityList(page, city)
      for (const intent of intents) {
        const names = await search(page, "en", intent.query, intent.count)
        expect(names.every((name) => intent.sourceTokens.some((token) => name.includes(token)))).toBe(true)
        const card = page.getByTestId("ondo-b-venue-list").locator("li", { hasText: intent.example })
        await expect(card).toContainText(intent.category)
        await expect(card.getByText(intent.example, { exact: true })).toBeVisible()
      }

      const aliasNames = await search(page, "en", "pizza", city === "seoul" ? 3 : 5)
      const literalNames = await search(page, "en", "피자", city === "seoul" ? 3 : 5)
      expect(literalNames).toEqual(aliasNames)
    }

    await openCityList(page, "seoul")
    await search(page, "en", "pizza", 3)
    const card = page.getByTestId("ondo-b-venue-list").locator("li", { hasText: "고피자 신촌1호점" })
    await expect(card.getByTestId("official-source-name")).toHaveText("고피자 신촌1호점")
    await expect(card.locator("em")).toHaveText("Official Korean source name")
    const transliteration = card.getByText("Gopija Sinchon1hojeom", { exact: true }).locator("..")
    await expect(transliteration).toContainText("Transliterated for navigation · Generated, not an official English name")
    await card.getByRole("button").click()
    const peek = page.getByTestId("canonical-place-peek")
    await expect(peek).toContainText("고피자 신촌1호점")
    await peek.getByTestId("canonical-place-details").click()
    const detail = page.getByTestId("canonical-place-overlay")
    await expect(detail.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")
    await expect(detail.getByRole("heading", { name: "고피자 신촌1호점", exact: true })).toBeVisible()
    const detailProvenance = detail.getByTestId("canonical-detail-name-provenance")
    await expect(detailProvenance).toContainText("Official Korean source name")
    await expect(detailProvenance).toContainText("Gopija Sinchon1hojeom")
    await expect(detailProvenance).toContainText("Transliterated for navigation · Generated, not an official English name")
    await expect(detail.getByText("English menu").locator("..")).toContainText("Not confirmed by this source")
    await expect(detail).not.toContainText("pizza")
  })

  for (const locale of ["en", "ko"] as const) {
    test(`${locale.toUpperCase()} literal name, district, category, romanization, and zero-result reset remain intact`, async ({ page }) => {
      await seedB(page, { locale })
      await openCityList(page, "seoul")

      await search(page, locale, "고피자 신촌1호점", 1)
      await expect(page.getByTestId("ondo-b-venue-list")).toContainText("고피자 신촌1호점")

      await search(page, locale, locale === "ko" ? "강남구" : "Gangnam-gu", 20)
      await search(page, locale, locale === "ko" ? "한식" : "Korean food", 50)

      await search(page, locale, "Gopija", 1)
      await expect(page.getByTestId("ondo-b-venue-list")).toContainText("고피자 신촌1호점")

      await page.getByLabel(SEARCH_LABEL[locale]).fill("definitely-no-such-ondo-place")
      const empty = page.getByTestId("ondo-b-empty-results")
      await expect(empty).toBeVisible()
      await empty.getByRole("button", { name: locale === "ko" ? "검색어와 필터 초기화" : "Clear search and filters" }).click()
      await expect(page.getByLabel(SEARCH_LABEL[locale])).toHaveValue("")
      await expect(page.getByText(resultLabel(locale, 200), { exact: true })).toBeVisible()
      await expect(empty).toHaveCount(0)
    })
  }
})
