import { canonicalMapVenueById } from "@/lib/ondo/venues/map-data"
import { venueDisplayName } from "@/lib/ondo/venues/display"
import { RESEARCHED_FOOD_B } from "../map/researched-food-b"
import { editorialPlaceById } from "../pulse-b/japan-first-pulse-model-b"
import { ONDO_B_TABLES } from "../connect/table-model"

export type CommercePlaceOriginB = "canonical" | "editorial" | "research"
export type CommercePlaceCityB = "seoul" | "busan" | "jeju"
export type CommercePlaceB = Readonly<{
  id: string
  originKind: CommercePlaceOriginB
  cityId: CommercePlaceCityB
  name: Readonly<Record<"en" | "ko" | "ja", string>>
  latitude: number
  longitude: number
  tableId: string | null
  reservation: boolean
  commerce: Readonly<{ offerId: string; grossKrw: number; benefitKrw: number; minimumKrw: number; sampleOnly: true }> | null
}>

/** Explicit walkthrough capabilities, NOT merchant acceptance, real menus,
 * inventory or a partnership claim. Public production adapters must supply
 * independently verified capabilities; a directory listing never grants them.
 * Keep source ids intact: editorial/research is not a canonical license record.
 */
// Preserve the original 24 walkthroughs explicitly. Adding editorial content
// or media must never implicitly create payment, benefit or reservation rights.
const RESEARCH_WALKTHROUGH_IDS_B: ReadonlySet<string> = new Set([
  "research-seoul-zest",
  "research-seoul-bar-cham",
  "research-seoul-gosari-express",
  "research-seoul-3rd-samgyetang",
  "research-seoul-onion-anguk",
  "research-seoul-london-bagel-dosan",
  "research-seoul-okdongsik",
  "research-seoul-geumdwaeji-sikdang",
  "research-busan-moemiljip",
  "research-busan-songheonjip",
  "research-busan-momos-yeongdo",
  "research-busan-waveon-coffee",
  "research-busan-sour-yeongdo",
  "research-busan-living-room-bar",
  "research-busan-hapcheon-gukbapjip",
  "research-busan-haeundae-amso-galbijip",
  "research-jeju-woojin-haejangguk",
  "research-jeju-gozip-dolwurock-jungmun",
  "research-jeju-azulejo",
  "research-jeju-moasi",
  "research-jeju-delmoondo-hamdeok",
  "research-jeju-magpie-tapdong",
  "research-jeju-oneunjeong-gimbap",
  "research-jeju-yaksuteo-olle-market",
])
const researchPlaces: CommercePlaceB[] = RESEARCHED_FOOD_B.filter(place => RESEARCH_WALKTHROUGH_IDS_B.has(place.id)).map(place => {
  const grossKrw = place.kind === "cafe" ? 12_000 : place.kind === "bar" ? 28_000 : 22_000
  return Object.freeze({
    id: place.id, originKind: "research" as const, cityId: place.city,
    name: place.name, latitude: place.latitude, longitude: place.longitude,
    tableId: null, reservation: place.kind !== "cafe",
    commerce: Object.freeze({ offerId: `visit-offer-${place.id}`, grossKrw,
      benefitKrw: place.kind === "cafe" ? 2_000 : 3_000, minimumKrw: grossKrw, sampleOnly: true as const }),
  })
})

const tablePlaces: CommercePlaceB[] = ONDO_B_TABLES.flatMap(table => {
  const canonical = canonicalMapVenueById(table.venueId)
  const editorial = canonical ? null : editorialPlaceById(table.venueId)
  if (!canonical && !editorial) return []
  const legacy = table.venueId === "mois-0021cd596bc5b2a922ad"
  const grossKrw = legacy ? 22_000 : table.estimatedPriceKRW
  return [Object.freeze({
    id: table.venueId, originKind: canonical ? "canonical" as const : "editorial" as const,
    cityId: (canonical?.cityId ?? "jeju") as CommercePlaceCityB,
    name: canonical ? { en: venueDisplayName(canonical.name.ko, "en"), ko: canonical.name.ko, ja: venueDisplayName(canonical.name.ko, "ja") } : editorial!.name,
    latitude: canonical?.latitude ?? editorial!.location.latitude,
    longitude: canonical?.longitude ?? editorial!.location.longitude,
    tableId: table.id, reservation: true,
    commerce: Object.freeze({ offerId: legacy ? "meal-offer-gukbap" : `visit-offer-${table.venueId}`,
      grossKrw, benefitKrw: 3_000, minimumKrw: grossKrw, sampleOnly: true as const }),
  })]
})

const places: readonly CommercePlaceB[] = Object.freeze([...tablePlaces, ...researchPlaces])
const byId = new Map(places.map(place => [place.id, place]))
const byOffer = new Map(places.filter(place => place.commerce).map(place => [place.commerce!.offerId, place]))

export function resolveCommercePlaceB(venueId: unknown): CommercePlaceB | null {
  return typeof venueId === "string" ? byId.get(venueId) ?? null : null
}
export function supportedCommercePlacesB(cityId?: CommercePlaceCityB): readonly CommercePlaceB[] {
  return cityId ? places.filter(place => place.cityId === cityId) : places
}
export function commercePlaceByOfferIdB(offerId: unknown): CommercePlaceB | null {
  return typeof offerId === "string" ? byOffer.get(offerId) ?? null : null
}

export const PLACE_SERVICE_RETURN_EVENT_B = "ondo:b:place-service-return"
export const SHOW_BALANCE_PLACES_EVENT_B = "ondo:b:show-balance-places"
export type PlaceServiceReturnB = { placeId: string; focus?: "offer" | "reservation" | "table" | "experience" }
export type ShowBalancePlacesB = { cityId?: CommercePlaceCityB }

export function requestPlaceServiceReturnB(placeId: string, focus?: PlaceServiceReturnB["focus"]) {
  if (!resolveCommercePlaceB(placeId) || typeof window === "undefined") return false
  window.dispatchEvent(new CustomEvent<PlaceServiceReturnB>(PLACE_SERVICE_RETURN_EVENT_B, { detail: { placeId, focus } }))
  return true
}
export function requestBalancePlacesB(cityId?: CommercePlaceCityB) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent<ShowBalancePlacesB>(SHOW_BALANCE_PLACES_EVENT_B, { detail: { cityId } }))
}
