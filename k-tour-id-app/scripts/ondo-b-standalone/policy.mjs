import { resolve } from "node:path"

export const APP_ROOT = resolve(import.meta.dirname, "../..")
export const STAGE_ROOT = resolve(APP_ROOT, ".ondo-b-standalone")
export const STAGE_DIST = resolve(STAGE_ROOT, "dist")
export const LOCAL_ONLY_PROJECT_ID = "appgprj_local_only_ondo_b_artifact"

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
  "features/ondo/map/b-discovery-history.ts",
  "features/ondo/map/map-b.module.css",
  "features/ondo/map/map-entry-b.tsx",
  "features/ondo/my/private-note.tsx",
  "features/ondo/my/saved-entry-b.tsx",
  "features/ondo/onboarding/official-directory-onboarding.tsx",
  "features/ondo/onboarding/official-directory-onboarding.module.css",
  "features/ondo/place/canonical-place-mount.tsx",
  "features/ondo/place/canonical-place-overlay.tsx",
  "features/ondo/place/canonical-place.module.css",
  "features/ondo/settings/settings-entry-b.tsx",
  "features/ondo/shared/state/ondo-b-preferences.ts",
  "features/ondo/shared/state/ondo-b-provider.tsx",
  "features/ondo/shared/ui/focus-destination.ts",
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
])

export const PUBLIC_FILES = Object.freeze([
  "public/og-ondo-directory.png",
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
// treating required P0 journey names (After19, Connect, Identity) as failures.
export const LEGACY_ARTIFACT_PATH = /(^|\/)(?:commerce|demo|fixtures?|labs|mock|partner|profile|rewards|trust|wallet)(?:[./_-]|\/|$)/i

export const LEGACY_ARTIFACT_TEXT = Object.freeze([
  /"simulation"\s*:\s*null/i,
  /\b(?:demo|simulation|simulated|KYC|reward|rewards|Labs)\b/i,
  /demo-journey/i,
  /mock-data/i,
  /Checkout simulation/i,
  /Payment KYC|paymentKyc|CheckoutOverlay|ChatOverlay|RewardsEntry/i,
  /결제 시뮬레이션/i,
  /Labs · (?:Local|로컬)/i,
  /CheckoutOverlay|ChatOverlay|RewardsEntry|LabsEntry/,
  /k-tour-id\.wallet/i,
  /(?:^|["'`])\/(?:demo|wallet|ondo|ask|chat|connect|partner|profile|services|pass|present|journey|benefits|architecture|evidence)(?:[/?"'`]|$)/m,
])
