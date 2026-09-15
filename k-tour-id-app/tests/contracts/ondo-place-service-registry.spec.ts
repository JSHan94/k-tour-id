import { expect, test } from "@playwright/test"
import { commercePlaceByOfferIdB, resolveCommercePlaceB, supportedCommercePlacesB } from "../../features/ondo/commerce-b/place-service-registry-b"
import { RESEARCHED_FOOD_B } from "../../features/ondo/map/researched-food-b"
import { ONDO_B_TABLES } from "../../features/ondo/connect/table-model"

const ORIGINAL_RESEARCH_WALKTHROUGHS = [
  "research-seoul-zest", "research-seoul-bar-cham", "research-seoul-gosari-express", "research-seoul-3rd-samgyetang",
  "research-seoul-onion-anguk", "research-seoul-london-bagel-dosan", "research-seoul-okdongsik", "research-seoul-geumdwaeji-sikdang",
  "research-busan-moemiljip", "research-busan-songheonjip", "research-busan-momos-yeongdo", "research-busan-waveon-coffee",
  "research-busan-sour-yeongdo", "research-busan-living-room-bar", "research-busan-hapcheon-gukbapjip", "research-busan-haeundae-amso-galbijip",
  "research-jeju-woojin-haejangguk", "research-jeju-gozip-dolwurock-jungmun", "research-jeju-azulejo", "research-jeju-moasi",
  "research-jeju-delmoondo-hamdeok", "research-jeju-magpie-tapdong", "research-jeju-oneunjeong-gimbap", "research-jeju-yaksuteo-olle-market",
] as const

test("MW-REG-01 the original 24 research walkthroughs preserve source identity and capabilities; new content grants none", () => {
  expect(supportedCommercePlacesB().filter(place => place.originKind === "research").map(place => place.id).sort()).toEqual([...ORIGINAL_RESEARCH_WALKTHROUGHS].sort())
  for (const research of RESEARCHED_FOOD_B) {
    const place = resolveCommercePlaceB(research.id)
    if (!(ORIGINAL_RESEARCH_WALKTHROUGHS as readonly string[]).includes(research.id)) {
      expect(place, `Content alone cannot grant services: ${research.id}`).toBeNull()
      expect(commercePlaceByOfferIdB(`visit-offer-${research.id}`)).toBeNull()
      continue
    }
    expect(place).not.toBeNull()
    expect(place?.originKind).toBe("research")
    expect(place?.cityId).toBe(research.city)
    expect(place?.name).toEqual(research.name)
    expect(place?.latitude).toBe(research.latitude)
    expect(place?.longitude).toBe(research.longitude)
    expect(place?.commerce?.sampleOnly).toBe(true)
    expect(place?.tableId).toBeNull()
    expect(place?.reservation).toBe(research.kind !== "cafe")
    expect(research.canonicalVenueId).toBeNull()
  }
})

test("MW-REG-02 each Table maps to its own place instead of Seoul fallback", () => {
  for (const table of ONDO_B_TABLES) {
    const place = resolveCommercePlaceB(table.venueId)
    expect(place?.tableId).toBe(table.id)
    expect(place?.reservation).toBe(true)
    expect(place?.commerce?.sampleOnly).toBe(true)
  }
  expect(resolveCommercePlaceB("jeju-haenyeo-kitchen-bukchon")?.originKind).toBe("editorial")
})

test("MW-REG-03 unique offer ownership and supported-city filters retain exact prices", () => {
  const all = supportedCommercePlacesB()
  expect(all).toHaveLength(27)
  expect(new Set(all.map(place => place.id)).size).toBe(all.length)
  expect(new Set(all.map(place => place.commerce!.offerId)).size).toBe(all.length)
  for (const place of all) {
    expect(commercePlaceByOfferIdB(place.commerce!.offerId)).toBe(place)
    expect(place.commerce!.grossKrw).toBeGreaterThan(place.commerce!.benefitKrw)
    expect(place.commerce!.minimumKrw).toBe(place.commerce!.grossKrw)
    expect(supportedCommercePlacesB(place.cityId)).toContain(place)
  }
  expect(commercePlaceByOfferIdB("meal-offer-gukbap")?.commerce?.grossKrw).toBe(22_000)
})

test("MW-REG-04 arbitrary ids and display labels cannot mint merchant capability", () => {
  for (const value of [null, undefined, {}, "Jeju", "unknown", "research-jeju-yaksuteo-olle-market:edited", "__proto__"]) {
    expect(resolveCommercePlaceB(value)).toBeNull()
    expect(commercePlaceByOfferIdB(value)).toBeNull()
  }
})

test("MW-REG-05 sourced Hakrim content and media never become a partner offer, reservation or table", () => {
  expect(RESEARCHED_FOOD_B.some(place => place.id === "research-seoul-hakrim-dabang" && place.photo?.localSrc)).toBe(true)
  expect(resolveCommercePlaceB("research-seoul-hakrim-dabang")).toBeNull()
  expect(commercePlaceByOfferIdB("visit-offer-research-seoul-hakrim-dabang")).toBeNull()
  expect(ONDO_B_TABLES.some(table => table.venueId === "research-seoul-hakrim-dabang")).toBe(false)
  expect(supportedCommercePlacesB()).toHaveLength(27)
})
