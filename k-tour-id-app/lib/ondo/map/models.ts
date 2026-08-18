import type { HeatLevel, LocalizedText, Venue } from "../../../features/ondo/contracts/domain"

export type CoverageTier = "complete" | "seed" | "growing"
export type FreshnessBand = "recent" | "today" | "aging" | "stale" | "unknown"
export type ConfidenceBand = "high" | "medium" | "low" | "unknown" | "limited"
export type DiscoveryLevel = "nation" | "city" | "neighborhood" | "venue"
export type TimeFilter = "now" | "dinner" | "late"

export type MapRegion = {
  id: string
  cityId?: "seoul" | "busan"
  name: LocalizedText
  latitude: number
  longitude: number
  bounds: [[number, number], [number, number]]
  coverage: CoverageTier
  ondoScore: number | null
  heatLevel: HeatLevel
  signalCount: number
  confidence: ConfidenceBand
  freshness: FreshnessBand
  nextExpansionLabel?: LocalizedText
}

export type MapNeighborhood = {
  id: string
  cityId: "seoul" | "busan"
  name: LocalizedText
  latitude: number
  longitude: number
  ondoScore: number
  heatLevel: Exclude<HeatLevel, "limited">
  signalCount: number
  confidence: Exclude<ConfidenceBand, "unknown" | "limited">
  freshness: FreshnessBand
}

export type MapVenue = Venue & {
  address: LocalizedText
  openingStatus: "open" | "closed" | "unknown"
  coverage: Exclude<CoverageTier, "growing">
  freshness: FreshnessBand
  sourceLabel: LocalizedText
  reservationUrl?: string
}

export type DiscoveryFilters = {
  query: string
  time: TimeFilter
  hotOnly: boolean
  calmOnly: boolean
  openOnly: boolean
}

export type DiscoveryUrlState = DiscoveryFilters & {
  city?: "seoul" | "busan"
  neighborhood?: string
  venueId?: string
  view: "map" | "list"
}

export type HeatDisplay = {
  score: number | null
  level: HeatLevel
  signalCount: number
  confidence: ConfidenceBand
  freshness: FreshnessBand
}
