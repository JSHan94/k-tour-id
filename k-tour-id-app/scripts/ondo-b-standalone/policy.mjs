import { resolve } from "node:path"

export const APP_ROOT = resolve(import.meta.dirname, "../..")
export const STAGE_ROOT = resolve(APP_ROOT, ".ondo-b-standalone")
export const STAGE_DIST = resolve(STAGE_ROOT, "dist")
export const LOCAL_ONLY_PROJECT_ID = "appgprj_local_only_ondo_b_artifact"
export const HISTORICAL_B_PROJECT_ID = "appgprj_6a85de65d6148191aa042ae9c2787dd2"

// These modules are intentionally B-native: they implement truthful,
// synchronous device-local walkthroughs and do not import the legacy provider,
// KYC, wallet, chain, or mock-product graph.
export const B_NATIVE_INTERACTIVE_FILES = Object.freeze([
  "features/ondo/after19/after19-global-b-model.ts",
  "features/ondo/after19/after19-global-b.tsx",
  "features/ondo/after19/after19-global-b.module.css",
  "features/ondo/after19/after19-place-return-b-model.ts",
  "features/ondo/identity-b/account-save-gate-b.tsx",
  "features/ondo/identity-b/account-save-gate-b.module.css",
  "features/ondo/identity-b/action-gate-contract-b.ts",
  "features/ondo/identity-b/action-gate-coordinator-b.tsx",
  "features/ondo/identity-b/action-gate-coordinator-b.module.css",
  "features/ondo/identity-b/activity-profile-b-provider.tsx",
  "features/ondo/identity-b/profile-reputation-b.tsx",
  "features/ondo/identity-b/profile-reputation-b.module.css",
  "features/ondo/identity-b/local-check-walkthrough-b.tsx",
  "features/ondo/identity-b/local-check-walkthrough-b.module.css",
  "features/ondo/identity-b/traveler-id-entry-b.tsx",
  "features/ondo/identity-b/traveler-id-entry-b.module.css",
  "features/ondo/identity-b/ktour-id-setup-b.tsx",
  "features/ondo/identity-b/ktour-id-setup-b.module.css",
  "features/ondo/identity-b/ktour-id-setup-model-b.ts",
  "features/ondo/local-signal-b/local-signal-layer-b.tsx",
  "features/ondo/local-signal-b/local-signal-layer-b.module.css",
])

// Product-owned commerce walkthroughs are positively required. They are kept
// separate from the retired provider/checkout graph and cannot be omitted by a
// broad legacy scanner rule.
export const REQUIRED_B_NATIVE_COMMERCE_FILES = Object.freeze([
  "features/ondo/commerce-b/stable-commerce-model-b.ts",
  "features/ondo/commerce-b/id-wallet-commerce-b.tsx",
  "features/ondo/commerce-b/id-wallet-commerce-b.module.css",
  "features/ondo/commerce-b/visit-stamp-receipt-b.tsx",
  "features/ondo/commerce-b/visit-stamp-receipt-b.module.css",
])

// Labs is a product-owned, deterministic technical preview. The standalone
// preparation keeps only its B adapter so the legacy OndoProvider graph never
// crosses the isolated artifact boundary.
export const REQUIRED_B_NATIVE_LABS_FILES = Object.freeze([
  "features/ondo/contracts/commerce.ts",
  "features/ondo/contracts/domain.ts",
  "features/ondo/contracts/evidence.ts",
  "features/ondo/labs/labs-entry.tsx",
  "features/ondo/labs/labs-model.ts",
  "features/ondo/labs/labs.module.css",
  "features/ondo/shared/ui/sheet-b.tsx",
  "features/ondo/shared/ui/ui.module.css",
  "features/ondo/shared/ui/use-qa-controls.ts",
])

export const SOURCE_FILES = Object.freeze([
  "app/icon.svg",
  "app/ondo-b/page.tsx",
  "app/api/ondo/venues/[venueId]/route.ts",
  "build/sites-vite-plugin.ts",
  "data/ondo-venues/canonical-venues.json",
  "data/ondo-venues/canonical-venues-map.json",
  "features/ondo/app/ondo-app-b.tsx",
  "features/ondo/app/ondo-product-b.tsx",
  "features/ondo/app/ondo-shell.module.css",
  "features/ondo/connect/tables-entry-b.tsx",
  "features/ondo/connect/pulse-table-b.module.css",
  "features/ondo/contracts/return-to-b.ts",
  "features/ondo/map/b-discovery-history.ts",
  "features/ondo/map/map-b.module.css",
  "features/ondo/map/map-entry-b.tsx",
  "features/ondo/map/japan-first-discovery-b.tsx",
  "features/ondo/map/japan-first-discovery-b.module.css",
  "features/ondo/my/private-note.tsx",
  "features/ondo/my/my-korea-model.ts",
  "features/ondo/my/korea-memory-map-b.tsx",
  "features/ondo/my/korea-memory-map-b.module.css",
  "features/ondo/my/saved-entry-b.tsx",
  "features/ondo/onboarding/official-directory-onboarding.tsx",
  "features/ondo/onboarding/official-directory-onboarding.module.css",
  "features/ondo/place/canonical-place-mount.tsx",
  "features/ondo/place/canonical-place-overlay.tsx",
  "features/ondo/place/canonical-place.module.css",
  "features/ondo/place/editorial-place-mount-b.tsx",
  "features/ondo/place/editorial-place-overlay-b.tsx",
  "features/ondo/place/editorial-place-overlay-b.module.css",
  "features/ondo/pulse-b/pulse-model-b.ts",
  "features/ondo/pulse-b/japan-first-pulse-model-b.ts",
  "features/ondo/settings/settings-entry-b.tsx",
  "features/ondo/shared/state/ondo-b-preferences.ts",
  "features/ondo/shared/state/ondo-b-provider.tsx",
  "features/ondo/shared/ui/focus-destination.ts",
  "features/ondo/shared/ui/ondo-brand-lockup-b.tsx",
  "features/ondo/shared/ui/ondo-brand-lockup-b.module.css",
  "features/ondo/shared/ui/production-local.module.css",
  "features/ondo/shared/ui/use-modal-isolation.ts",
  "lib/map/korea-atlas-data.ts",
  "lib/ondo/map/ondo-map-style.ts",
  "lib/ondo/venues/contracts.ts",
  "lib/ondo/venues/canonical-allowlist.ts",
  "lib/ondo/venues/detail-contract.ts",
  "lib/ondo/venues/detail-server.ts",
  "lib/ondo/venues/display.ts",
  "lib/ondo/venues/map-data.ts",
  "lib/ondo/venues/map-discovery-aliases.ts",
  ...B_NATIVE_INTERACTIVE_FILES,
  ...REQUIRED_B_NATIVE_COMMERCE_FILES,
  ...REQUIRED_B_NATIVE_LABS_FILES,
])

export const PUBLIC_FILES = Object.freeze([
  "public/og-ondo-directory.png",
  "public/brand/ondo-lockup.svg",
  "public/brand/ondo-mark.svg",
  "public/brand/ondo-mark-inverse.svg",
  "public/brand/ondo-mark-micro-24.svg",
  "public/editorial/people/ondo-my-korea-inspiration-v2-landscape.jpg",
  "public/editorial/people/ondo-onboarding-travelers-v2-landscape.jpg",
  "public/editorial/people/ondo-tables-dinner-v2-landscape.jpg",
  "public/editorial/japan-first-c01-sesame-oil.jpg",
  "public/editorial/japan-first-c03-seoul-eight-hours.jpg",
  "public/editorial/japan-first-c06-beauty-research.jpg",
  "public/editorial/japan-first-c18-jeju-screen-route.jpg",
  "public/editorial/japan-first-c20-jeju-kpop-route.jpg",
])

export const EXPECTED_ROUTE_FILES = Object.freeze([
  "api/ondo/venues/[venueId]/route.ts",
  "layout.tsx",
  "ondo-b/page.tsx",
  "page.tsx",
])

export const BLOCKED_HTTP_PATHS = Object.freeze([
  "/ai",
  "/alerts",
  "/api/ask",
  "/api/chat",
  "/architecture",
  "/ask",
  "/benefits",
  "/connect",
  "/connect/chat",
  "/demo",
  "/evidence",
  "/explore",
  "/help",
  "/journey",
  "/ondo",
  "/onboarding",
  "/orders/legacy",
  "/partner/settlements",
  "/partner/verify",
  "/pass",
  "/present",
  "/profile",
  "/services",
  "/wallet",
  "/og-modern-atlas.png",
  "/og-ondo.png",
])

// Keep retired prototype clusters out of the standalone artifact without
// treating required journey truth (including simulated OpenDID/eKYC) as a
// failure. Retired overlay symbols stay blocked below; current Payment KYC is
// a required, provider-neutral B axis and is proven by the positive source list.
export const LEGACY_ARTIFACT_PATH = /(^|\/)(?:(?:demo|fixtures?|mock|partner|rewards|trust|wallet)(?:[./_-]|\/|$)|profile(?:\/|$))/i

export const LEGACY_ARTIFACT_TEXT = Object.freeze([
  /"simulation"\s*:\s*null/i,
  /\b(?:reward|rewards)\b/i,
  /demo-journey/i,
  /mock-data/i,
  /WalletProvider|chainProvider|blockchain/i,
  /ondo-after19/i,
  /Checkout simulation/i,
  /CheckoutOverlay|ChatOverlay|RewardsEntry/i,
  /결제 시뮬레이션/i,
  /Labs · (?:Local|로컬)/i,
  /CheckoutOverlay|ChatOverlay|RewardsEntry|\bLabsEntry\b/,
  /k-tour-id\.wallet/i,
  /(?:^|["'`])\/(?:demo|wallet|ondo|ask|chat|connect|partner|profile|services|pass|present|journey|benefits|architecture|evidence)(?:[/?"'`]|$)/m,
])
