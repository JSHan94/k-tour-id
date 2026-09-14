import { normalizeTemperatureSampleMinute, temperatureSampleWeight, type TemperatureSampleCity } from "./temperature-timeline"

/** A rehearsed contribution window, never observed people or verified visits. */
export type SampleContributionKindB = "arrival" | "photo" | "mood"
export function sampleTravelerActivityB(city: TemperatureSampleCity, venueId: string, minute: number) {
  let hash = 2166136261
  for (const char of `${city}:${venueId}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0
  const normalizedMinute = normalizeTemperatureSampleMinute(minute)
  const weight = temperatureSampleWeight(city, venueId, normalizedMinute)
  const sequence = Math.floor(normalizedMinute / 30)
  return {
    origin: "PREPARED_ILLUSTRATION" as const,
    observedAt: null,
    windowMinutes: 30,
    arrivals: Math.round(2 + weight * 22),
    photos: Math.floor(weight * 7 + (hash % 3)),
    updates: Math.round(1 + weight * 9),
    kind: (["arrival", "photo", "mood"] as const)[(sequence + hash) % 3],
    sequence,
  }
}
