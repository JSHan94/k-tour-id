/** Prepared evening illustrations. No value is a live observation or a venue rating. */
export const TEMPERATURE_SAMPLE_START_MINUTE = 17 * 60
export const TEMPERATURE_SAMPLE_END_MINUTE = 23 * 60
export const TEMPERATURE_SAMPLE_INITIAL_MINUTE = 19 * 60
export const TEMPERATURE_SAMPLE_TICK_MS = 1_000
export const TEMPERATURE_SAMPLE_DISSOLVE_MS = 900
export const TEMPERATURE_SAMPLE_STEP_MINUTES = 10
export const TEMPERATURE_SAMPLE_MAX_POINTS = 48
export type TemperatureSampleCity = "seoul" | "busan" | "jeju"
export type TemperatureSamplePoint = Readonly<{ id: string; longitude: number; latitude: number }>
export type TemperatureSampleDirection = 1 | -1
export const TEMPERATURE_SAMPLE_COLOR_STOPS = [
  [0, "#4b9fa6"], [.24, "#e6b74d"], [.48, "#f18b43"], [.7, "#ed5960"], [1, "#b32c79"],
] as const
export const TEMPERATURE_SAMPLE_NIGHT_COLOR_STOPS = [
  [0, "#7cbec1"], [.24, "#f5c766"], [.48, "#ff9a56"], [.7, "#ff7383"], [1, "#e84d9c"],
] as const
export type TemperatureSampleProperties = {
  id: string
  sampleWeight: number
  sampleMinute: number
  sampleOrigin: "PREPARED_ILLUSTRATION"
  observedAt: null
  officialScore: null
}

// Early meals, dinner, late evenings and a steadier pattern. Distinct temporal
// profiles make places warm and cool independently, rather than globally blink.
const EVENING_PROFILES = [
  [.22, .85, 1, .63, .25, .1, .08],
  [.1, .28, .68, 1, .9, .42, .2],
  [.08, .12, .22, .42, .72, 1, .64],
  [.34, .45, .5, .62, .68, .56, .34],
] as const

export function normalizeTemperatureSampleMinute(minute: number) {
  if (!Number.isFinite(minute)) return TEMPERATURE_SAMPLE_INITIAL_MINUTE
  return Math.min(TEMPERATURE_SAMPLE_END_MINUTE, Math.max(TEMPERATURE_SAMPLE_START_MINUTE, Math.round(minute)))
}

export function temperatureSampleTimeLabel(minute: number) {
  const normalized = normalizeTemperatureSampleMinute(minute)
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`
}

/** Rehearsed time travels back through the evening instead of jumping from
 * 23:00 to 17:00. It is deliberately a sample replay, never a live clock. */
export function advanceTemperatureSample(minute: number, direction: TemperatureSampleDirection) {
  const next = normalizeTemperatureSampleMinute(minute) + direction * TEMPERATURE_SAMPLE_STEP_MINUTES
  if (next >= TEMPERATURE_SAMPLE_END_MINUTE) return { minute: TEMPERATURE_SAMPLE_END_MINUTE, direction: -1 as const }
  if (next <= TEMPERATURE_SAMPLE_START_MINUTE) return { minute: TEMPERATURE_SAMPLE_START_MINUTE, direction: 1 as const }
  return { minute: next, direction }
}

/** The exact same continuous palette is used by the map core and the peek.
 * This is illustrative activity, not a rewritten curated rating. */
export function temperatureSampleColor(weight: number, after19 = false) {
  const stops = after19 ? TEMPERATURE_SAMPLE_NIGHT_COLOR_STOPS : TEMPERATURE_SAMPLE_COLOR_STOPS
  const value = Math.max(0, Math.min(1, Number.isFinite(weight) ? weight : 0))
  const index = Math.max(1, stops.findIndex(([stop]) => stop >= value))
  const [left, leftColor] = stops[index - 1]
  const [right, rightColor] = stops[index]
  const progress = Math.min(1, Math.max(0, (value - left) / (right - left)))
  const channel = (color: string, offset: number) => Number.parseInt(color.slice(offset, offset + 2), 16)
  return `#${[1, 3, 5].map((offset) => Math.round(channel(leftColor, offset) + (channel(rightColor, offset) - channel(leftColor, offset)) * progress).toString(16).padStart(2, "0")).join("")}`
}

export function temperatureSampleWeight(city: TemperatureSampleCity, id: string, minute: number) {
  let hash = 2166136261
  for (const character of `${city}:${id}`) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0
  const profile = EVENING_PROFILES[hash % EVENING_PROFILES.length]
  const position = (normalizeTemperatureSampleMinute(minute) - TEMPERATURE_SAMPLE_START_MINUTE) / 60
  const left = Math.floor(position)
  const right = Math.min(profile.length - 1, left + 1)
  const progress = position - left
  const eased = progress * progress * (3 - 2 * progress)
  const amplitude = .82 + ((hash >>> 4) % 19) / 100
  return Number(((profile[left] + (profile[right] - profile[left]) * eased) * amplitude).toFixed(4))
}

export function createTemperatureSampleFrame(
  city: TemperatureSampleCity,
  points: readonly TemperatureSamplePoint[],
  minute: number,
): GeoJSON.FeatureCollection<GeoJSON.Point, TemperatureSampleProperties> {
  const ids = new Set<string>()
  const sampleMinute = normalizeTemperatureSampleMinute(minute)
  const safePoints = points.filter((point) => {
    if (!point.id || ids.has(point.id) || !Number.isFinite(point.longitude) || !Number.isFinite(point.latitude)
      || point.longitude < -180 || point.longitude > 180 || point.latitude < -85 || point.latitude > 85) return false
    ids.add(point.id)
    return true
  }).slice(0, TEMPERATURE_SAMPLE_MAX_POINTS)
  return {
    type: "FeatureCollection",
    features: safePoints.map((point) => ({
      type: "Feature", id: point.id,
      // Never displace a real point, jitter coordinates or alter its hit layer.
      geometry: { type: "Point", coordinates: [point.longitude, point.latitude] },
      properties: {
        id: point.id,
        sampleWeight: temperatureSampleWeight(city, point.id, sampleMinute),
        sampleMinute,
        sampleOrigin: "PREPARED_ILLUSTRATION",
        observedAt: null,
        officialScore: null,
      },
    })),
  }
}

export function canRunTemperatureSample(input: {
  requested: boolean; visible: boolean; documentVisible: boolean; reducedMotion: boolean; minute: number
}) {
  return input.requested && input.visible && input.documentVisible && !input.reducedMotion
}

export type TemperatureSampleFrame = ReturnType<typeof createTemperatureSampleFrame>
export type TemperatureSampleBlendProperties = TemperatureSampleProperties & { sampleBlendWeight: number }

/** Two render slots share ONE bounded source. The visible slot holds the old
 * weights while the other receives the next frame; the map's native paint
 * transition does the dissolve, without per-frame JS or coordinate animation. */
export function createTemperatureSampleBlend(
  previous: TemperatureSampleFrame,
  next: TemperatureSampleFrame,
  nextSlot: 0 | 1,
): GeoJSON.FeatureCollection<GeoJSON.Point, TemperatureSampleBlendProperties> {
  const previousWeights = new Map(previous.features.map((feature) => [feature.id, feature.properties.sampleWeight]))
  return {
    type: "FeatureCollection",
    features: next.features.map((feature) => {
      const previousWeight = previousWeights.get(feature.id) ?? feature.properties.sampleWeight
      return {
        ...feature,
        properties: {
          ...feature.properties,
          sampleWeight: nextSlot === 0 ? feature.properties.sampleWeight : previousWeight,
          sampleBlendWeight: nextSlot === 1 ? feature.properties.sampleWeight : previousWeight,
        },
      }
    }),
  }
}
