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
  setup: string
  surfaceSelector: `[data-testid='${string}']${string}`
  description: string
}

export type BProductionStructuralVisualCase = BProductionVisualCase & {
  viewport: {
    id: "430x720" | "667x320"
    width: 430 | 667
    height: 720 | 320
    owner: "structural"
  }
  expectedLayoutMode: "compact-map" | "ultra-short"
  expectedRequestedView: "map"
  expectedEffectiveView: "map" | "list"
}

/**
 * Preserved official-source guest-discovery foundation. These six flows stay
 * release obligations, but they are a subset of the P0 fidelity inventory in
 * tests/helpers/ondo-prd-fidelity.ts, not a maximum product scope.
 */
export const B_PRODUCTION_FLOWS: readonly BProductionFlow[] = [
  {
    id: "PR-FL-001",
    name: "Guest setup",
    capability: "Choose a language, trip intent, food and dietary preferences, or skip directly into the same official guest directory.",
    evidence: ["language", "intent-persona", "food-preferences", "dietary-needs", "guest-directory-entry", "skip"],
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
    capability: "Change actual device preferences, restart guest setup, and reset only saved ONDO B content after confirmation.",
    evidence: ["language-setting", "onboarding-reset", "device-data-boundary", "reset-confirmation", "reset-result"],
  },
] as const

/**
 * Planned production pixel census. Baselines are deliberately not part of
 * this commit: each case must first be implemented and functionally accepted.
 */
export const B_PRODUCTION_VISUAL_CASES: readonly BProductionVisualCase[] = [
  { id: "PR-PX-FIRST-RUN-EN", flowIds: ["PR-FL-001"], locale: "en", state: "first-run", setup: "first-run", surfaceSelector: "[data-testid='ondo-onboarding']", description: "English first-run directory value and language choice" },
  { id: "PR-PX-FIRST-RUN-KO", flowIds: ["PR-FL-001"], locale: "ko", state: "first-run", setup: "first-run", surfaceSelector: "[data-testid='ondo-onboarding']", description: "Korean first-run directory value and language choice" },
  { id: "PR-PX-NATION-EN", flowIds: ["PR-FL-001", "PR-FL-002"], locale: "en", state: "nation", setup: "nation", surfaceSelector: "[data-testid='ondo-b-nation']", description: "Official directory overview before a city is selected" },
  { id: "PR-PX-CITY-MAP-EN", flowIds: ["PR-FL-002"], locale: "en", state: "city-map", setup: "city-map", surfaceSelector: "[data-testid='ondo-b-map-entry']", description: "English city map with canonical place markers" },
  { id: "PR-PX-CITY-MAP-KO", flowIds: ["PR-FL-002"], locale: "ko", state: "city-map", setup: "city-map", surfaceSelector: "[data-testid='ondo-b-map-entry']", description: "Korean city map with canonical place markers" },
  { id: "PR-PX-CITY-LIST-EN", flowIds: ["PR-FL-002"], locale: "en", state: "city-list", setup: "city-list", surfaceSelector: "[data-testid='ondo-b-list-panel']", description: "Sourced place list for the selected city" },
  { id: "PR-PX-SEARCH-EN", flowIds: ["PR-FL-002"], locale: "en", state: "search-results", setup: "search-results", surfaceSelector: "[data-testid='ondo-b-venue-list']", description: "Directory search with matching canonical records" },
  { id: "PR-PX-SEARCH-EMPTY-KO", flowIds: ["PR-FL-002"], locale: "ko", state: "search-empty", setup: "search-empty", surfaceSelector: "[data-testid='ondo-b-empty-results']", description: "Korean no-results recovery without invented places" },
  { id: "PR-PX-PLACE-PEEK-EN", flowIds: ["PR-FL-003"], locale: "en", state: "place-peek", setup: "place-peek", surfaceSelector: "[data-testid='canonical-place-peek']", description: "Selected canonical place summary" },
  { id: "PR-PX-PLACE-DETAIL-KO", flowIds: ["PR-FL-003"], locale: "ko", state: "place-detail", setup: "place-detail", surfaceSelector: "[data-testid='canonical-place-overlay']", description: "Korean sourced place facts and action boundary" },
  { id: "PR-PX-HISTORY-RETURN-EN", flowIds: ["PR-FL-003"], locale: "en", state: "history-return", setup: "history-return", surfaceSelector: "[data-testid='ondo-b-list-panel']", description: "Exact directory context restored after Back" },
  { id: "PR-PX-DIRECTIONS-EN", flowIds: ["PR-FL-003"], locale: "en", state: "directions", setup: "directions", surfaceSelector: "[data-testid='canonical-place-peek']", description: "Directions handoff using canonical coordinates" },
  { id: "PR-PX-LOCATION-READY-KO", flowIds: ["PR-FL-004"], locale: "ko", state: "location-ready", setup: "location-ready", surfaceSelector: "[data-testid='ondo-b-location-message']", description: "Browser-granted location represented without tracking claims" },
  { id: "PR-PX-LOCATION-DENIED-EN", flowIds: ["PR-FL-004"], locale: "en", state: "location-denied", setup: "location-denied", surfaceSelector: "[data-testid='ondo-b-location-message']", description: "Real permission denial with continued directory access" },
  { id: "PR-PX-OFFLINE-FALLBACK-KO", flowIds: ["PR-FL-004"], locale: "ko", state: "offline-fallback", setup: "offline-fallback", surfaceSelector: "[data-testid='ondo-b-list-panel']", description: "Complete sourced list when map delivery is unavailable" },
  { id: "PR-PX-SAVED-EMPTY-EN", flowIds: ["PR-FL-005"], locale: "en", state: "saved-empty", setup: "saved-empty", surfaceSelector: "[data-testid='ondo-b-saved-entry']", description: "Device-local Saved empty state" },
  { id: "PR-PX-SAVED-PLACE-KO", flowIds: ["PR-FL-005"], locale: "ko", state: "saved-place", setup: "saved-place", surfaceSelector: "[data-testid='saved-card-mois-0021cd596bc5b2a922ad']", description: "Korean device-local saved canonical place" },
  { id: "PR-PX-PRIVATE-NOTE-EN", flowIds: ["PR-FL-005"], locale: "en", state: "private-note", setup: "private-note", surfaceSelector: "[data-testid='private-note-mois-0021cd596bc5b2a922ad']", description: "Optional private note with explicit device boundary" },
  { id: "PR-PX-SETTINGS-EN", flowIds: ["PR-FL-006"], locale: "en", state: "settings", setup: "settings", surfaceSelector: "[data-testid='ondo-b-settings-entry']", description: "Actual language and device-data settings" },
  { id: "PR-PX-RESET-CONFIRM-KO", flowIds: ["PR-FL-006"], locale: "ko", state: "reset-confirm", setup: "reset-confirm", surfaceSelector: "[data-testid='ondo-b-clear-device-confirm']", description: "Korean destructive reset confirmation" },
] as const

/**
 * Sparse structural supplements are intentionally separate from the canonical
 * twenty-case cross-product. Their exact four rows are implemented only after
 * the structural visual contract has first demonstrated RED.
 */
export const B_PRODUCTION_STRUCTURAL_VISUAL_CASES: readonly BProductionStructuralVisualCase[] = [
  { id: "PR-PX-STRUCTURAL-COMPACT-EN", flowIds: ["PR-FL-002"], locale: "en", state: "structural-compact-map", setup: "structural-compact-map", surfaceSelector: "[data-testid='ondo-b-map-chrome']", description: "English compact map chrome and visible directory truth", viewport: { id: "430x720", width: 430, height: 720, owner: "structural" }, expectedLayoutMode: "compact-map", expectedRequestedView: "map", expectedEffectiveView: "map" },
  { id: "PR-PX-STRUCTURAL-COMPACT-KO", flowIds: ["PR-FL-002"], locale: "ko", state: "structural-compact-map", setup: "structural-compact-map", surfaceSelector: "[data-testid='ondo-b-map-chrome']", description: "Korean compact map chrome and visible directory truth", viewport: { id: "430x720", width: 430, height: 720, owner: "structural" }, expectedLayoutMode: "compact-map", expectedRequestedView: "map", expectedEffectiveView: "map" },
  { id: "PR-PX-STRUCTURAL-ULTRA-EN", flowIds: ["PR-FL-002"], locale: "en", state: "structural-ultra-short", setup: "structural-ultra-short", surfaceSelector: "[data-testid='ondo-b-list-panel']", description: "English ultra-short truthful automatic list presentation", viewport: { id: "667x320", width: 667, height: 320, owner: "structural" }, expectedLayoutMode: "ultra-short", expectedRequestedView: "map", expectedEffectiveView: "list" },
  { id: "PR-PX-STRUCTURAL-ULTRA-KO", flowIds: ["PR-FL-002"], locale: "ko", state: "structural-ultra-short", setup: "structural-ultra-short", surfaceSelector: "[data-testid='ondo-b-list-panel']", description: "Korean ultra-short truthful automatic list presentation", viewport: { id: "667x320", width: 667, height: 320, owner: "structural" }, expectedLayoutMode: "ultra-short", expectedRequestedView: "map", expectedEffectiveView: "list" },
] as const
