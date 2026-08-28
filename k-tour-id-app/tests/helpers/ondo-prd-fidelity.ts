export type OndoFidelityTier = "GOLDEN_MUST_LIVE" | "ACTUAL_INTEGRATION_DEFERRED"

export type OndoFidelityItem = {
  id: `ONDO-${"G0" | "EXT"}-${string}`
  tier: OndoFidelityTier
  journey: string
  acceptance: readonly string[]
  requiredModules: readonly string[]
  providerBoundary: "OFFICIAL_READ_ONLY" | "DETERMINISTIC_LOCAL_PREVIEW" | "ACTUAL_INTEGRATION_DEFERRED"
  removalPolicy: "FAIL_RELEASE" | "DEFER_IMPLEMENTATION_ONLY"
}

/**
 * Additive golden-candidate inventory distilled from the root proposal,
 * PULSE direction, execution PRD, scope memory, and the latest product
 * decision. This file declares obligations; it is deliberately not used as
 * the assertion oracle in ondo-prd-fidelity.spec.ts.
 */
export const ONDO_FIDELITY_INVENTORY: readonly OndoFidelityItem[] = [
  {
    id: "ONDO-G0-GUEST-DISCOVERY",
    tier: "GOLDEN_MUST_LIVE",
    journey: "Guest discovery",
    acceptance: ["official Seoul and Busan records", "map/list/search/place/directions", "no ID or wallet gate"],
    requiredModules: ["features/ondo/map/map-entry-b.tsx", "features/ondo/place/canonical-place-overlay.tsx"],
    providerBoundary: "OFFICIAL_READ_ONLY",
    removalPolicy: "FAIL_RELEASE",
  },
  {
    id: "ONDO-G0-ONBOARDING",
    tier: "GOLDEN_MUST_LIVE",
    journey: "Onboarding",
    acceptance: ["language and value", "intent", "preferences", "guest completion"],
    requiredModules: ["features/ondo/onboarding/official-directory-onboarding.tsx"],
    providerBoundary: "DETERMINISTIC_LOCAL_PREVIEW",
    removalPolicy: "FAIL_RELEASE",
  },
  {
    id: "ONDO-G0-PULSE-HOT",
    tier: "GOLDEN_MUST_LIVE",
    journey: "Pulse / Hot evidence",
    acceptance: ["evidence count", "freshness", "confidence", "Limited", "Hot", "Too Hot"],
    requiredModules: ["features/ondo/pulse-b/pulse-model-b.ts", "features/ondo/map/map-entry-b.tsx", "features/ondo/place/canonical-place-overlay.tsx"],
    providerBoundary: "DETERMINISTIC_LOCAL_PREVIEW",
    removalPolicy: "FAIL_RELEASE",
  },
  {
    id: "ONDO-G0-MY-KOREA",
    tier: "GOLDEN_MUST_LIVE",
    journey: "My Korea",
    acceptance: ["saved", "recently viewed", "planned meal", "local contribution history"],
    requiredModules: ["features/ondo/my/saved-entry-b.tsx", "features/ondo/my/my-korea-model.ts"],
    providerBoundary: "DETERMINISTIC_LOCAL_PREVIEW",
    removalPolicy: "FAIL_RELEASE",
  },
  {
    id: "ONDO-G0-LOCAL-SIGNAL-PULSE",
    tier: "GOLDEN_MUST_LIVE",
    journey: "Local Signal to Pulse",
    acceptance: ["exact place draft", "success/failure recovery", "unique post appears as separate local-device evidence", "shared Pulse score/count unchanged", "duplicate suppression"],
    requiredModules: ["features/ondo/local-signal-b/local-signal-layer-b.tsx", "features/ondo/pulse-b/pulse-model-b.ts"],
    providerBoundary: "DETERMINISTIC_LOCAL_PREVIEW",
    removalPolicy: "FAIL_RELEASE",
  },
  {
    id: "ONDO-G0-TABLE",
    tier: "GOLDEN_MUST_LIVE",
    journey: "Pulse Table",
    acceptance: ["place-based Table", "join and recovery", "participant chat", "leave/report/block"],
    requiredModules: ["features/ondo/connect/tables-entry-b.tsx"],
    providerBoundary: "DETERMINISTIC_LOCAL_PREVIEW",
    removalPolicy: "FAIL_RELEASE",
  },
  {
    id: "ONDO-G0-AFTER19",
    tier: "GOLDEN_MUST_LIVE",
    journey: "After19",
    acceptance: ["success", "cancel", "failure/retry", "unavailable", "expiry", "minimum exact return"],
    requiredModules: [
      "features/ondo/after19/after19-global-b-model.ts",
      "features/ondo/after19/after19-global-b.tsx",
      "features/ondo/identity-b/action-gate-contract-b.ts",
      "features/ondo/identity-b/action-gate-coordinator-b.tsx",
    ],
    providerBoundary: "DETERMINISTIC_LOCAL_PREVIEW",
    removalPolicy: "FAIL_RELEASE",
  },
  {
    id: "ONDO-G0-ID-WALLET",
    tier: "GOLDEN_MUST_LIVE",
    journey: "ID · Wallet",
    acceptance: ["one navigation entry", "independent Person/19+/payment axes", "visible OOKRW preview balance is not fiat or a chain asset"],
    requiredModules: ["features/ondo/identity-b/traveler-id-entry-b.tsx", "features/ondo/commerce-b/id-wallet-commerce-b.tsx"],
    providerBoundary: "DETERMINISTIC_LOCAL_PREVIEW",
    removalPolicy: "FAIL_RELEASE",
  },
  {
    id: "ONDO-G0-MEAL-OFFER",
    tier: "GOLDEN_MUST_LIVE",
    journey: "Representative meal service orchestration",
    acceptance: ["separately labeled ONDO demo meal offer", "explore", "quote", "eligibility/benefit", "consent", "payment/request", "provider boundary", "refund/support", "no official LOCALDATA merchant-payment claim"],
    requiredModules: ["features/ondo/commerce-b/id-wallet-commerce-b.tsx", "features/ondo/commerce-b/stable-commerce-model-b.ts"],
    providerBoundary: "DETERMINISTIC_LOCAL_PREVIEW",
    removalPolicy: "FAIL_RELEASE",
  },
  {
    id: "ONDO-G0-PAYMENT",
    tier: "GOLDEN_MUST_LIVE",
    journey: "Stable preview payment",
    acceptance: ["success", "cancel", "failure/retry", "insufficient balance", "double-click gives one OOKRW debit and one receipt", "payment and provider states separated"],
    requiredModules: ["features/ondo/commerce-b/stable-commerce-model-b.ts"],
    providerBoundary: "DETERMINISTIC_LOCAL_PREVIEW",
    removalPolicy: "FAIL_RELEASE",
  },
  {
    id: "ONDO-G0-BENEFIT-VOUCHER",
    tier: "GOLDEN_MUST_LIVE",
    journey: "Benefit / voucher",
    acceptance: ["eligibility and expiry", "minimum spend", "single use", "no double redemption", "refund restoration"],
    requiredModules: ["features/ondo/commerce-b/stable-commerce-model-b.ts"],
    providerBoundary: "DETERMINISTIC_LOCAL_PREVIEW",
    removalPolicy: "FAIL_RELEASE",
  },
  {
    id: "ONDO-G0-REFUND-SETTLEMENT",
    tier: "GOLDEN_MUST_LIVE",
    journey: "Refund and settlement mirror",
    acceptance: ["holder and merchant entries share operation/receipt", "opposite deltas reconcile", "refund reverses both sides once"],
    requiredModules: ["features/ondo/commerce-b/stable-commerce-model-b.ts"],
    providerBoundary: "DETERMINISTIC_LOCAL_PREVIEW",
    removalPolicy: "FAIL_RELEASE",
  },
  {
    id: "ONDO-G0-AI-BENEFIT-PREVIEW",
    tier: "GOLDEN_MUST_LIVE",
    journey: "AI benefit preview",
    acceptance: ["deterministic local policy inputs", "recommend/accept/decline", "no AI or provider call", "no eligibility/payment decision", "no money or voucher mutation before acceptance"],
    requiredModules: ["features/ondo/commerce-b/stable-commerce-model-b.ts", "features/ondo/commerce-b/id-wallet-commerce-b.tsx"],
    providerBoundary: "DETERMINISTIC_LOCAL_PREVIEW",
    removalPolicy: "FAIL_RELEASE",
  },
  {
    id: "ONDO-G0-RETURN-TO",
    tier: "GOLDEN_MUST_LIVE",
    journey: "Exact returnTo",
    acceptance: ["origin CTA and public context", "cancel/failure/insufficient preserve", "success consumes once", "no private state in URL"],
    requiredModules: ["features/ondo/contracts/return-to-b.ts", "features/ondo/commerce-b/stable-commerce-model-b.ts"],
    providerBoundary: "DETERMINISTIC_LOCAL_PREVIEW",
    removalPolicy: "FAIL_RELEASE",
  },
  {
    id: "ONDO-G0-INCLUSIVE-WEB",
    tier: "GOLDEN_MUST_LIVE",
    journey: "Inclusive responsive web",
    acceptance: ["English", "Korean", "390px mobile", "desktop", "keyboard completion", "dialog focus containment and exact focus return"],
    requiredModules: ["features/ondo/app/ondo-app-b.tsx", "features/ondo/commerce-b/id-wallet-commerce-b.tsx"],
    providerBoundary: "DETERMINISTIC_LOCAL_PREVIEW",
    removalPolicy: "FAIL_RELEASE",
  },
  {
    id: "ONDO-EXT-REAL-IDENTITY",
    tier: "ACTUAL_INTEGRATION_DEFERRED",
    journey: "Actual identity providers and credential issuance",
    acceptance: ["deferred until provider contracts, security, privacy, and receipts exist"],
    requiredModules: [],
    providerBoundary: "ACTUAL_INTEGRATION_DEFERRED",
    removalPolicy: "DEFER_IMPLEMENTATION_ONLY",
  },
  {
    id: "ONDO-EXT-REAL-MONEY-CHAIN-BACKEND",
    tier: "ACTUAL_INTEGRATION_DEFERRED",
    journey: "Actual money, chain, provider, and canonical backend",
    acceptance: ["deferred; local preview must never claim these integrations"],
    requiredModules: [],
    providerBoundary: "ACTUAL_INTEGRATION_DEFERRED",
    removalPolicy: "DEFER_IMPLEMENTATION_ONLY",
  },
  {
    id: "ONDO-EXT-BROAD-SERVICE-INTEGRATIONS",
    tier: "ACTUAL_INTEGRATION_DEFERRED",
    journey: "Actual transport, delivery, shopping, and reservation integrations",
    acceptance: ["deferred individually; representative meal offer proves the reusable orchestration now"],
    requiredModules: [],
    providerBoundary: "ACTUAL_INTEGRATION_DEFERRED",
    removalPolicy: "DEFER_IMPLEMENTATION_ONLY",
  },
] as const

export const ONDO_MUST_LIVE = ONDO_FIDELITY_INVENTORY.filter((item) => item.tier === "GOLDEN_MUST_LIVE")
export const ONDO_DEFERRED = ONDO_FIDELITY_INVENTORY.filter((item) => item.tier === "ACTUAL_INTEGRATION_DEFERRED")
