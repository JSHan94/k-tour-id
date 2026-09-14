import seoul from "@/data/ondo/research/seoul-food-pulse.json" with { type: "json" }
import busan from "@/data/ondo/research/busan-food-pulse.json" with { type: "json" }
import jeju from "@/data/ondo/research/jeju-food-pulse.json" with { type: "json" }
import type { FoodPhotoSubjectB } from "./food-photo-b"

type Localized = Record<"en" | "ko" | "ja", string>
export type ResearchedFoodB = {
  id: string; city: "seoul" | "busan" | "jeju"; name: Localized; district: Localized
  kind: "food" | "cafe" | "bar"; signature: Localized; address: string
  latitude: number; longitude: number; coordinateSourceUrl: string; checkedAt: string
  reason: Localized
  sources: Array<{ url: string; title: string; publishedAt: string | null; evidence: "operator" | "tourism" | "award" | "editorial" }>
  canonicalVenueId: string | null
  photo: { url: string; sourceUrl: string; credit: string; license: string; licenseUrl: string } | null
}

/** Editorial research, NOT the official venue directory or live activity feed. */
export const RESEARCHED_FOOD_B = [...seoul, ...busan, ...jeju] as ResearchedFoodB[]
export function researchedFoodByIdB(id: string) { return RESEARCHED_FOOD_B.find(place => place.id === id) ?? null }
export function researchFoodMatchesB(place: ResearchedFoodB, query: string) {
  const needle = query.trim().toLocaleLowerCase()
  return !needle || [...Object.values(place.name), ...Object.values(place.district), ...Object.values(place.signature), place.address].join(" ").toLocaleLowerCase().includes(needle)
}
/** No licensed venue/menu photos are recorded for these picks. Broad cuisine
 * mood photos cannot accurately represent their named signature dishes. */
const RESEARCH_FOOD_SUBJECTS_B: Readonly<Record<string, FoodPhotoSubjectB>> = {
  "research-seoul-zest": "cocktail",
  "research-seoul-bar-cham": "cocktail",
  "research-seoul-gosari-express": "noodles",
  "research-seoul-3rd-samgyetang": "soup",
  "research-seoul-onion-anguk": "bakery",
  "research-seoul-london-bagel-dosan": "bakery",
  "research-busan-moemiljip": "noodles",
  "research-busan-songheonjip": "grill",
  "research-busan-momos-yeongdo": "coffee",
  "research-busan-waveon-coffee": "coffee",
  "research-busan-sour-yeongdo": "beer",
  "research-busan-living-room-bar": "cocktail",
  "research-jeju-woojin-haejangguk": "soup",
  "research-jeju-gozip-dolwurock-jungmun": "seafood",
  "research-jeju-azulejo": "bakery",
  "research-jeju-moasi": "coffee",
  "research-jeju-delmoondo-hamdeok": "bakery",
  "research-jeju-magpie-tapdong": "beer",
  "research-seoul-okdongsik": "soup",
  "research-seoul-geumdwaeji-sikdang": "grill",
  "research-busan-hapcheon-gukbapjip": "soup",
  "research-busan-haeundae-amso-galbijip": "grill",
  "research-jeju-oneunjeong-gimbap": "food",
  "research-jeju-yaksuteo-olle-market": "beer",
}
const RESEARCH_FOOD_ILLUSTRATIONS_B: Readonly<Record<string, string>> = {
  "research-busan-moemiljip": "/editorial/food/perilla-noodles-illustration-v1.jpg",
  "research-busan-songheonjip": "/editorial/food/tteokgalbi-illustration-v1.jpg",
  "research-busan-momos-yeongdo": "/editorial/food/coffee-croissant-illustration-v1.jpg",
  "research-busan-waveon-coffee": "/editorial/food/coffee-croissant-illustration-v1.jpg",
  "research-jeju-moasi": "/editorial/food/coffee-croissant-illustration-v1.jpg",
  "research-jeju-delmoondo-hamdeok": "/editorial/food/coffee-croissant-illustration-v1.jpg",
}
export function researchFoodIllustrationB(place: ResearchedFoodB): { src: string | null; subject: FoodPhotoSubjectB } {
  const subject = RESEARCH_FOOD_SUBJECTS_B[place.id] ?? (place.kind === "cafe" ? "coffee" : place.kind === "bar" ? "cocktail" : "food")
  // Inspected owned cocktail illustrations match this category. Keep them
  // explicitly illustrative; a highball is not evidence of any venue's menu.
  const src = RESEARCH_FOOD_ILLUSTRATIONS_B[place.id] ?? (subject === "cocktail"
    ? `/editorial/food/ondo-category-night-${place.id === "research-seoul-bar-cham" ? "v3" : "v1"}.jpg`
    : null)
  return { src, subject }
}
export function researchFoodDirectionsB(place: ResearchedFoodB) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${place.latitude},${place.longitude}`)}`
}
