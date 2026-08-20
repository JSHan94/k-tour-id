/**
 * Search-only traveler vocabulary for the Map discovery surface.
 *
 * Every rule is gated by a token that is already present in the sourced
 * official Korean place name. These aliases are never merged into canonical
 * venue fields, rendered as a place/menu fact, or used by ONDO scoring.
 */
type MapDiscoveryAliasRule = Readonly<{
  aliases: readonly string[]
  officialNameIncludes: readonly string[]
}>

export const MAP_FOOD_INTENT_ALIAS_RULES: readonly MapDiscoveryAliasRule[] = Object.freeze([
  { aliases: ["pizza"], officialNameIncludes: ["피자"] },
  { aliases: ["chicken", "fried chicken"], officialNameIncludes: ["치킨", "통닭"] },
  { aliases: ["coffee", "cafe", "café"], officialNameIncludes: ["커피", "카페"] },
  { aliases: ["gukbap"], officialNameIncludes: ["국밥"] },
  { aliases: ["kalguksu"], officialNameIncludes: ["칼국수"] },
  { aliases: ["gimbap", "kimbap"], officialNameIncludes: ["김밥"] },
  { aliases: ["tteokbokki"], officialNameIncludes: ["떡볶이"] },
  { aliases: ["naengmyeon"], officialNameIncludes: ["냉면"] },
])

export function mapFoodIntentAliases(officialKoreanName: string) {
  return MAP_FOOD_INTENT_ALIAS_RULES.flatMap((rule) => (
    rule.officialNameIncludes.some((token) => officialKoreanName.includes(token))
      ? rule.aliases
      : []
  ))
}
