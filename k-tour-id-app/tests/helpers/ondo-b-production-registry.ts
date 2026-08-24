export type BProductionFlowId = `PR-FL-${"001" | "002" | "003" | "004" | "005" | "006"}`

export type BProductionFlow = {
  id: BProductionFlowId
  name: string
  capability: string
  evidence: readonly string[]
}

export type BProductionVisualCase = {
  id: `PR-PX-${string}`
  flowIds: readonly BProductionFlowId[]
  locale: "en" | "ko"
  state: string
  description: string
}

/**
 * Release-facing ONDO B flows. This registry intentionally excludes every
 * externally unconfigured identity, social, commerce, reputation, and Labs
 * concept that appeared in the historical prototype evidence.
 */
export const B_PRODUCTION_FLOWS: readonly BProductionFlow[] = [
  {
    id: "PR-FL-001",
    name: "First-run directory",
    capability: "Choose a language and enter the official Seoul/Busan place directory as a guest.",
    evidence: ["onboarding", "locale", "guest-directory-entry"],
  },
  {
    id: "PR-FL-002",
    name: "Explore directory",
    capability: "Browse the official directory by map or list and narrow it with local search.",
    evidence: ["map", "list", "search", "empty-results"],
  },
  {
    id: "PR-FL-003",
    name: "Place and return",
    capability: "Inspect sourced place facts, open directions, and return through browser history.",
    evidence: ["place-peek", "place-detail", "directions", "history-return"],
  },
  {
    id: "PR-FL-004",
    name: "Location and fallback",
    capability: "Use browser location when granted and retain the complete list when location or map delivery fails.",
    evidence: ["location-granted", "location-denied", "offline-list-fallback", "retry"],
  },
  {
    id: "PR-FL-005",
    name: "Device-local places",
    capability: "Save canonical places and keep an optional private note on this device.",
    evidence: ["saved-empty", "saved-place", "private-note", "reload-persistence"],
  },
  {
    id: "PR-FL-006",
    name: "Settings and reset",
    capability: "Change actual device preferences and reset only ONDO B device data after confirmation.",
    evidence: ["language-setting", "device-data-boundary", "reset-confirmation", "reset-result"],
  },
] as const

/**
 * Planned production pixel census. Baselines are deliberately not part of
 * this commit: each case must first be implemented and functionally accepted.
 */
export const B_PRODUCTION_VISUAL_CASES: readonly BProductionVisualCase[] = [
  { id: "PR-PX-FIRST-RUN-EN", flowIds: ["PR-FL-001"], locale: "en", state: "first-run", description: "English first-run directory value and language choice" },
  { id: "PR-PX-FIRST-RUN-KO", flowIds: ["PR-FL-001"], locale: "ko", state: "first-run", description: "Korean first-run directory value and language choice" },
  { id: "PR-PX-NATION-EN", flowIds: ["PR-FL-001", "PR-FL-002"], locale: "en", state: "nation", description: "Official directory overview before a city is selected" },
  { id: "PR-PX-CITY-MAP-EN", flowIds: ["PR-FL-002"], locale: "en", state: "city-map", description: "English city map with canonical place markers" },
  { id: "PR-PX-CITY-MAP-KO", flowIds: ["PR-FL-002"], locale: "ko", state: "city-map", description: "Korean city map with canonical place markers" },
  { id: "PR-PX-CITY-LIST-EN", flowIds: ["PR-FL-002"], locale: "en", state: "city-list", description: "Sourced place list for the selected city" },
  { id: "PR-PX-SEARCH-EN", flowIds: ["PR-FL-002"], locale: "en", state: "search-results", description: "Directory search with matching canonical records" },
  { id: "PR-PX-SEARCH-EMPTY-KO", flowIds: ["PR-FL-002"], locale: "ko", state: "search-empty", description: "Korean no-results recovery without invented places" },
  { id: "PR-PX-PLACE-PEEK-EN", flowIds: ["PR-FL-003"], locale: "en", state: "place-peek", description: "Selected canonical place summary" },
  { id: "PR-PX-PLACE-DETAIL-KO", flowIds: ["PR-FL-003"], locale: "ko", state: "place-detail", description: "Korean sourced place facts and action boundary" },
  { id: "PR-PX-HISTORY-RETURN-EN", flowIds: ["PR-FL-003"], locale: "en", state: "history-return", description: "Exact directory context restored after Back" },
  { id: "PR-PX-DIRECTIONS-EN", flowIds: ["PR-FL-003"], locale: "en", state: "directions", description: "Directions handoff using canonical coordinates" },
  { id: "PR-PX-LOCATION-READY-KO", flowIds: ["PR-FL-004"], locale: "ko", state: "location-ready", description: "Browser-granted location represented without tracking claims" },
  { id: "PR-PX-LOCATION-DENIED-EN", flowIds: ["PR-FL-004"], locale: "en", state: "location-denied", description: "Real permission denial with continued directory access" },
  { id: "PR-PX-OFFLINE-FALLBACK-KO", flowIds: ["PR-FL-004"], locale: "ko", state: "offline-fallback", description: "Complete sourced list when map delivery is unavailable" },
  { id: "PR-PX-SAVED-EMPTY-EN", flowIds: ["PR-FL-005"], locale: "en", state: "saved-empty", description: "Device-local Saved empty state" },
  { id: "PR-PX-SAVED-PLACE-KO", flowIds: ["PR-FL-005"], locale: "ko", state: "saved-place", description: "Korean device-local saved canonical place" },
  { id: "PR-PX-PRIVATE-NOTE-EN", flowIds: ["PR-FL-005"], locale: "en", state: "private-note", description: "Optional private note with explicit device boundary" },
  { id: "PR-PX-SETTINGS-EN", flowIds: ["PR-FL-006"], locale: "en", state: "settings", description: "Actual language and device-data settings" },
  { id: "PR-PX-RESET-CONFIRM-KO", flowIds: ["PR-FL-006"], locale: "ko", state: "reset-confirm", description: "Korean destructive reset confirmation" },
] as const
