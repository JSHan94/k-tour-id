import type {
  OndoBDiscoveryIntent,
  OndoBDiscoveryPreference,
} from "../shared/state/ondo-b-preferences"
import { ondoBDiscoveryPreferenceCapability } from "../shared/state/ondo-b-preferences"

type DietaryPreferenceB = Extract<
  OndoBDiscoveryPreference,
  "vegetarian" | "vegan" | "halal" | "allergy_aware"
>

type NonDietaryPreferenceB = Exclude<OndoBDiscoveryPreference, DietaryPreferenceB>

type DiscoveryDescriptorBaseB = Readonly<{
  id: string
  /** Preserve an already meaningful source/list order. */
  originalIndex?: number
  /** Passthrough only. ONDO temperature is never a proxy for mood or taste. */
  pulseScore?: number | null
  /** Positive recommendation facts supplied by the place source or curator. */
  preferenceEvidence?: readonly NonDietaryPreferenceB[]
  /** Missing evidence stays unknown and never becomes a positive dietary claim. */
  dietaryEvidence?: Readonly<Partial<Record<DietaryPreferenceB, boolean>>>
}>

export type BCanonicalDiscoveryDescriptor = DiscoveryDescriptorBaseB & Readonly<{
  kind: "canonical"
  primaryCategory: "korean" | "casual" | "japanese" | "chinese" | "global" | "night" | "specialty"
}>

export type BEditorialDiscoveryDescriptor = DiscoveryDescriptorBaseB & Readonly<{
  kind: "editorial"
  category: "food" | "market" | "screen-location" | "culture-shopping"
}>

export type BDiscoveryPersonalizationDescriptor =
  | BCanonicalDiscoveryDescriptor
  | BEditorialDiscoveryDescriptor

export type BDiscoveryPersonalizationInput = Readonly<{
  /** Optional recommendation context; never identity evidence or a gate. */
  intent?: OndoBDiscoveryIntent | null
  preferences: readonly OndoBDiscoveryPreference[]
}>

export type BDiscoveryPersonalizationResult<T extends BDiscoveryPersonalizationDescriptor> = Readonly<{
  item: T
  matchCount: number
  matchedPreferenceIds: readonly OndoBDiscoveryPreference[]
  dietaryUnknown: boolean
  originalIndex: number
}>

export type BCanonicalDiscoveryPlaceInput = Readonly<{
  id: string
  primaryCategory: BCanonicalDiscoveryDescriptor["primaryCategory"]
  /**
   * Presentation policy derived from the official category. This is never
   * evidence that a venue is open late or has a lively atmosphere.
   */
  after19PresentationEligible: boolean
}>

export type BCanonicalDiscoveryPlaceResult<T extends BCanonicalDiscoveryPlaceInput> = Readonly<{
  place: T
  matchCount: number
  matchedPreferenceIds: readonly OndoBDiscoveryPreference[]
  dietaryUnknown: boolean
  originalIndex: number
}>

export type BDiscoveryPreferencePresentation = Readonly<{
  effective: readonly OndoBDiscoveryPreference[]
  dietaryUnknown: readonly OndoBDiscoveryPreference[]
  unsupportedLegacy: readonly OndoBDiscoveryPreference[]
}>

/**
 * Classifies persisted choices for consumer presentation without deleting
 * backwards-compatible values. Mood choices currently have no source-backed
 * place facts, so they cannot be shown as if they changed the map. Dietary
 * choices remain visible only with an explicit unknown-evidence cue.
 */
export function classifyBDiscoveryPreferencePresentation(
  preferences: readonly OndoBDiscoveryPreference[],
): BDiscoveryPreferencePresentation {
  const uniquePreferences = [...new Set(preferences)]
  return {
    effective: uniquePreferences.filter((preference) => ondoBDiscoveryPreferenceCapability(preference) === "effective"),
    dietaryUnknown: uniquePreferences.filter((preference) => ondoBDiscoveryPreferenceCapability(preference) === "dietary_unknown"),
    unsupportedLegacy: uniquePreferences.filter((preference) => ondoBDiscoveryPreferenceCapability(preference) === "unsupported_legacy"),
  }
}

function isDietaryPreference(value: OndoBDiscoveryPreference): value is DietaryPreferenceB {
  return ondoBDiscoveryPreferenceCapability(value) === "dietary_unknown"
}

function evidenceFor<T extends BDiscoveryPersonalizationDescriptor>(
  item: T,
  preference: OndoBDiscoveryPreference,
) {
  if (ondoBDiscoveryPreferenceCapability(preference) === "unsupported_legacy") return undefined
  if (isDietaryPreference(preference)) return item.dietaryEvidence?.[preference]
  return item.preferenceEvidence?.includes(preference) === true
}

/**
 * Computes presentation-only recommendation evidence. The intent is accepted
 * as discovery context, but is deliberately never interpreted as nationality,
 * residence, identity, or place eligibility.
 */
export function describeBDiscoveryPersonalization<T extends BDiscoveryPersonalizationDescriptor>(
  item: T,
  input: BDiscoveryPersonalizationInput,
  fallbackIndex = 0,
): BDiscoveryPersonalizationResult<T> {
  // Intent may tailor future discovery context, but preference presentation is
  // useful to a guest too. Its absence must never suppress an explicit taste.
  void input.intent
  const uniquePreferences = [...new Set(input.preferences)]
  const matchedPreferenceIds = uniquePreferences.filter((preference) => evidenceFor(item, preference) === true)
  const dietaryUnknown = uniquePreferences.some((preference) => (
    isDietaryPreference(preference) && evidenceFor(item, preference) === undefined
  ))
  const originalIndex = Number.isSafeInteger(item.originalIndex) && item.originalIndex! >= 0
    ? item.originalIndex!
    : fallbackIndex

  return {
    item,
    matchCount: matchedPreferenceIds.length,
    matchedPreferenceIds,
    dietaryUnknown,
    originalIndex,
  }
}

export function compareBDiscoveryPersonalization<T extends BDiscoveryPersonalizationDescriptor>(
  left: BDiscoveryPersonalizationResult<T>,
  right: BDiscoveryPersonalizationResult<T>,
) {
  if (left.matchCount !== right.matchCount) return right.matchCount - left.matchCount
  if (left.originalIndex !== right.originalIndex) return left.originalIndex - right.originalIndex
  return left.item.id.localeCompare(right.item.id)
}

/**
 * Returns every original object exactly once. Only presentation order and
 * keyline metadata change; source, temperature and eligibility remain owned by
 * their original models.
 */
export function orderBDiscoveryByPersonalization<T extends BDiscoveryPersonalizationDescriptor>(
  items: readonly T[],
  input: BDiscoveryPersonalizationInput,
) {
  return items
    .map((item, index) => describeBDiscoveryPersonalization(item, input, index))
    .sort(compareBDiscoveryPersonalization)
}

/**
 * Source-backed canonical mapper shared by the real map and onboarding's
 * live preview. The current source contains no dietary facts, so those choices
 * deliberately remain unknown and can never produce a positive keyline.
 */
export function orderBCanonicalDiscoveryPlaces<T extends BCanonicalDiscoveryPlaceInput>(
  places: readonly T[],
  input: BDiscoveryPersonalizationInput,
): readonly BCanonicalDiscoveryPlaceResult<T>[] {
  const byId = new Map(places.map((place) => [place.id, place]))
  const descriptors = places.map((place, originalIndex): BCanonicalDiscoveryDescriptor => ({
    kind: "canonical",
    id: place.id,
    primaryCategory: place.primaryCategory,
    originalIndex,
    preferenceEvidence: place.primaryCategory === "korean"
      ? ["classic"]
      : place.primaryCategory === "night" && !place.after19PresentationEligible
        ? ["cafe"]
        : [],
  }))
  return orderBDiscoveryByPersonalization(descriptors, input).map((result) => ({
    place: byId.get(result.item.id)!,
    matchCount: result.matchCount,
    matchedPreferenceIds: result.matchedPreferenceIds,
    dietaryUnknown: result.dietaryUnknown,
    originalIndex: result.originalIndex,
  }))
}
