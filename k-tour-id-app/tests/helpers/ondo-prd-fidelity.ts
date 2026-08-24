export type OndoFidelityTier = "P0_MUST_LIVE" | "P2_DEFERRED"

export type OndoFidelityItem = {
  id: `ONDO-${"P0" | "P2"}-${string}`
  tier: OndoFidelityTier
  journey: string
  acceptance: readonly string[]
  providerBoundary: "NO_REAL_PROVIDER_REQUIRED" | "NOT_IN_CURRENT_GATE"
  removalPolicy: "FAIL_RELEASE" | "DEFERRED_ALLOWED"
}

/**
 * Product-fidelity inventory for the ONDO frontend candidate.
 *
 * P0 entries are additive release obligations. A missing implementation is
 * RED; deleting its UI, test, copy, module, or fixture cannot satisfy it.
 * Real providers and backends are not a prerequisite for any P0 entry.
 */
export const ONDO_FIDELITY_INVENTORY: readonly OndoFidelityItem[] = [
  {
    id: "ONDO-P0-GUEST-DISCOVERY",
    tier: "P0_MUST_LIVE",
    journey: "Guest Explore",
    acceptance: ["official Seoul/Busan discovery", "search/list/map", "place detail", "directions", "no identity gate"],
    providerBoundary: "NO_REAL_PROVIDER_REQUIRED",
    removalPolicy: "FAIL_RELEASE",
  },
  {
    id: "ONDO-P0-ONBOARDING",
    tier: "P0_MUST_LIVE",
    journey: "Three-step onboarding",
    acceptance: ["language and value", "intent and persona", "preferences", "guest map arrival"],
    providerBoundary: "NO_REAL_PROVIDER_REQUIRED",
    removalPolicy: "FAIL_RELEASE",
  },
  {
    id: "ONDO-P0-MY-KOREA",
    tier: "P0_MUST_LIVE",
    journey: "My Korea",
    acceptance: ["saved", "recently viewed", "planned meals"],
    providerBoundary: "NO_REAL_PROVIDER_REQUIRED",
    removalPolicy: "FAIL_RELEASE",
  },
  {
    id: "ONDO-P0-LOCAL-SIGNAL",
    tier: "P0_MUST_LIVE",
    journey: "Local Signal contribution",
    acceptance: ["open draft from place", "contribute note or photo", "success/failure", "return to same place"],
    providerBoundary: "NO_REAL_PROVIDER_REQUIRED",
    removalPolicy: "FAIL_RELEASE",
  },
  {
    id: "ONDO-P0-PULSE-TABLE",
    tier: "P0_MUST_LIVE",
    journey: "Pulse Table / Connect",
    acceptance: ["open one place-based Table", "join", "open participant chat", "cancel/failure/unavailable recovery"],
    providerBoundary: "NO_REAL_PROVIDER_REQUIRED",
    removalPolicy: "FAIL_RELEASE",
  },
  {
    id: "ONDO-P0-AFTER19",
    tier: "P0_MUST_LIVE",
    journey: "After 19",
    acceptance: ["success", "cancel", "failure and retry", "provider unavailable", "proof expiry", "exact return"],
    providerBoundary: "NO_REAL_PROVIDER_REQUIRED",
    removalPolicy: "FAIL_RELEASE",
  },
  {
    id: "ONDO-P0-ID",
    tier: "P0_MUST_LIVE",
    journey: "ID and just-in-time walkthrough",
    acceptance: ["Person status", "19+ status", "consent status", "independent axes", "one-time interactive walkthrough", "truthful preview boundary"],
    providerBoundary: "NO_REAL_PROVIDER_REQUIRED",
    removalPolicy: "FAIL_RELEASE",
  },
  {
    id: "ONDO-P0-RETURN-TO",
    tier: "P0_MUST_LIVE",
    journey: "Exact returnTo",
    acceptance: ["original CTA and public context preserved", "cancel restores context", "success resumes once", "failure/unavailable/expiry never lose context"],
    providerBoundary: "NO_REAL_PROVIDER_REQUIRED",
    removalPolicy: "FAIL_RELEASE",
  },
  {
    id: "ONDO-P0-INCLUSIVE-WEB",
    tier: "P0_MUST_LIVE",
    journey: "Inclusive responsive web",
    acceptance: ["English", "Korean", "390px mobile", "desktop", "keyboard-only completion and focus return"],
    providerBoundary: "NO_REAL_PROVIDER_REQUIRED",
    removalPolicy: "FAIL_RELEASE",
  },
  {
    id: "ONDO-P2-WALLET",
    tier: "P2_DEFERRED",
    journey: "Wallet",
    acceptance: ["deferred; does not block P0 candidate"],
    providerBoundary: "NOT_IN_CURRENT_GATE",
    removalPolicy: "DEFERRED_ALLOWED",
  },
  {
    id: "ONDO-P2-PAYMENT",
    tier: "P2_DEFERRED",
    journey: "Payment",
    acceptance: ["deferred; does not block P0 candidate"],
    providerBoundary: "NOT_IN_CURRENT_GATE",
    removalPolicy: "DEFERRED_ALLOWED",
  },
  {
    id: "ONDO-P2-VOUCHER",
    tier: "P2_DEFERRED",
    journey: "Voucher",
    acceptance: ["deferred; does not block P0 candidate"],
    providerBoundary: "NOT_IN_CURRENT_GATE",
    removalPolicy: "DEFERRED_ALLOWED",
  },
] as const

export const ONDO_MUST_LIVE = ONDO_FIDELITY_INVENTORY.filter((item) => item.tier === "P0_MUST_LIVE")
export const ONDO_DEFERRED = ONDO_FIDELITY_INVENTORY.filter((item) => item.tier === "P2_DEFERRED")
