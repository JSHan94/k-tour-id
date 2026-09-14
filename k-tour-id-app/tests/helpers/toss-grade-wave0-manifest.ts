export const TOSS_GRADE_LOCALES = ["en", "ko", "ja"] as const

export const TOSS_GRADE_VIEWPORTS = [
  { id: "320x568", width: 320, height: 568, family: "short-phone" },
  { id: "320x800", width: 320, height: 800, family: "narrow-phone" },
  { id: "360x800", width: 360, height: 800, family: "android-phone" },
  { id: "390x844", width: 390, height: 844, family: "reference-phone" },
  { id: "430x932", width: 430, height: 932, family: "large-phone" },
  { id: "768x1024", width: 768, height: 1024, family: "tablet" },
  { id: "844x390", width: 844, height: 390, family: "short-landscape" },
  { id: "1440x900", width: 1440, height: 900, family: "desktop" },
] as const

export const TOSS_GRADE_ATTACKS = [
  "success",
  "cancel",
  "failure",
  "retry",
  "exact-return",
] as const

export const TOSS_GRADE_REQUIREMENTS = Array.from(
  { length: 19 },
  (_, index) => `REQ-${String(index + 1).padStart(3, "0")}` as const,
)

export type TossGradeLocale = (typeof TOSS_GRADE_LOCALES)[number]
export type TossGradeViewport = (typeof TOSS_GRADE_VIEWPORTS)[number]["id"]
export type TossGradeAttack = (typeof TOSS_GRADE_ATTACKS)[number]
export type TossGradeRequirement = `REQ-${string}`
export type TossGradeFlowId = `FL-${string}`

type RequirementLink = {
  id: TossGradeRequirement
  role: "owner" | "support"
}

type CurrentEvidence = {
  behavior: string
  visualRegistry: string
  adversarial: string
}

export type TossGradeFlowManifest = {
  id: TossGradeFlowId
  name: string
  doc: string
  acceptanceCount: number
  requirements: readonly RequirementLink[]
  currentEvidence: CurrentEvidence
}

const FLOW_BEHAVIOR = "tests/e2e/ondo-b-flow-coverage.spec.ts"
const FLOW_VISUAL_REGISTRY = "tests/helpers/ondo-b-visual-evidence.ts"

const owner = (...ids: TossGradeRequirement[]): readonly RequirementLink[] => ids.map((id) => ({ id, role: "owner" }))

export const TOSS_GRADE_FLOW_MANIFEST: readonly TossGradeFlowManifest[] = [
  { id: "FL-001", name: "Guest Discover", doc: "FL-001_GUEST_DISCOVER.md", acceptanceCount: 12, requirements: owner("REQ-007", "REQ-013", "REQ-017", "REQ-018", "REQ-019"), currentEvidence: { behavior: FLOW_BEHAVIOR, visualRegistry: FLOW_VISUAL_REGISTRY, adversarial: "tests/e2e/ondo-b-map-truth.spec.ts" } },
  { id: "FL-002", name: "Age proof → exact After19 venue", doc: "FL-002_AFTER19_EXACT_VENUE.md", acceptanceCount: 11, requirements: owner("REQ-005", "REQ-012"), currentEvidence: { behavior: FLOW_BEHAVIOR, visualRegistry: FLOW_VISUAL_REGISTRY, adversarial: "tests/e2e/ondo-b-place-after19-restoration.spec.ts" } },
  { id: "FL-003", name: "Table → Image Chat → Feedback", doc: "FL-003_TABLE_CHAT_FEEDBACK.md", acceptanceCount: 12, requirements: owner("REQ-008", "REQ-009", "REQ-010", "REQ-015"), currentEvidence: { behavior: FLOW_BEHAVIOR, visualRegistry: FLOW_VISUAL_REGISTRY, adversarial: "tests/e2e/ondo-b-consumer-place-table.spec.ts" } },
  { id: "FL-004", name: "Checkout/Labs → Stamp", doc: "FL-004_CHECKOUT_STAMP.md", acceptanceCount: 12, requirements: owner("REQ-006", "REQ-011", "REQ-016"), currentEvidence: { behavior: FLOW_BEHAVIOR, visualRegistry: FLOW_VISUAL_REGISTRY, adversarial: "tests/e2e/ondo-b-flow-coverage.spec.ts" } },
  { id: "FL-005", name: "Korean CX", doc: "FL-005_KOREAN_MOBILE_ID.md", acceptanceCount: 14, requirements: owner("REQ-001", "REQ-005"), currentEvidence: { behavior: FLOW_BEHAVIOR, visualRegistry: FLOW_VISUAL_REGISTRY, adversarial: "tests/e2e/ondo-b-person-route-restoration.spec.ts" } },
  { id: "FL-006", name: "Residence Card", doc: "FL-006_RESIDENCE_CARD.md", acceptanceCount: 12, requirements: owner("REQ-002", "REQ-003", "REQ-005"), currentEvidence: { behavior: FLOW_BEHAVIOR, visualRegistry: FLOW_VISUAL_REGISTRY, adversarial: "tests/e2e/ondo-b-person-route-restoration.spec.ts" } },
  { id: "FL-007", name: "Short-term onboarding", doc: "FL-007_SHORT_TERM_ONBOARDING.md", acceptanceCount: 8, requirements: owner("REQ-003", "REQ-005", "REQ-018"), currentEvidence: { behavior: FLOW_BEHAVIOR, visualRegistry: FLOW_VISUAL_REGISTRY, adversarial: "tests/e2e/ondo-b-onboarding-restoration.spec.ts" } },
  { id: "FL-008", name: "Korean local onboarding", doc: "FL-008_KOREAN_LOCAL_ONBOARDING.md", acceptanceCount: 8, requirements: owner("REQ-001", "REQ-005", "REQ-018"), currentEvidence: { behavior: FLOW_BEHAVIOR, visualRegistry: FLOW_VISUAL_REGISTRY, adversarial: "tests/e2e/ondo-b-onboarding-restoration.spec.ts" } },
  { id: "FL-009", name: "Resident onboarding", doc: "FL-009_RESIDENT_ONBOARDING.md", acceptanceCount: 8, requirements: owner("REQ-002", "REQ-005", "REQ-018"), currentEvidence: { behavior: FLOW_BEHAVIOR, visualRegistry: FLOW_VISUAL_REGISTRY, adversarial: "tests/e2e/ondo-b-onboarding-restoration.spec.ts" } },
  { id: "FL-010", name: "Account gate", doc: "FL-010_ACCOUNT_GATE.md", acceptanceCount: 10, requirements: owner("REQ-005", "REQ-008", "REQ-011"), currentEvidence: { behavior: FLOW_BEHAVIOR, visualRegistry: FLOW_VISUAL_REGISTRY, adversarial: "tests/e2e/ondo-b-account-save-gate.spec.ts" } },
  { id: "FL-011", name: "Save / My Korea", doc: "FL-011_SAVE_MY_KOREA.md", acceptanceCount: 9, requirements: owner("REQ-005", "REQ-016"), currentEvidence: { behavior: FLOW_BEHAVIOR, visualRegistry: FLOW_VISUAL_REGISTRY, adversarial: "tests/e2e/ondo-b-my-korea-restoration.spec.ts" } },
  { id: "FL-012", name: "Local signal / first mission", doc: "FL-012_LOCAL_SIGNAL.md", acceptanceCount: 10, requirements: owner("REQ-003", "REQ-007", "REQ-009", "REQ-015"), currentEvidence: { behavior: FLOW_BEHAVIOR, visualRegistry: FLOW_VISUAL_REGISTRY, adversarial: "tests/e2e/ondo-b-local-signal-id-restoration.spec.ts" } },
  { id: "FL-013", name: "Manual 19+ proof", doc: "FL-013_MANUAL_AFTER19.md", acceptanceCount: 10, requirements: owner("REQ-012"), currentEvidence: { behavior: FLOW_BEHAVIOR, visualRegistry: FLOW_VISUAL_REGISTRY, adversarial: "tests/e2e/ondo-b-global-after19.spec.ts" } },
  { id: "FL-014", name: "Auto After19", doc: "FL-014_AUTO_AFTER19.md", acceptanceCount: 12, requirements: [...owner("REQ-012"), { id: "REQ-019", role: "support" }], currentEvidence: { behavior: FLOW_BEHAVIOR, visualRegistry: FLOW_VISUAL_REGISTRY, adversarial: "tests/e2e/ondo-b-global-after19.spec.ts" } },
  { id: "FL-015", name: "Optional public profile", doc: "FL-015_PUBLIC_PROFILE.md", acceptanceCount: 11, requirements: owner("REQ-008", "REQ-015"), currentEvidence: { behavior: FLOW_BEHAVIOR, visualRegistry: FLOW_VISUAL_REGISTRY, adversarial: "tests/e2e/ondo-b-profile-reputation-milestone.spec.ts" } },
  { id: "FL-016", name: "Evidence / merchant trait", doc: "FL-016_EVIDENCE_MERCHANT_TRAIT.md", acceptanceCount: 11, requirements: owner("REQ-004", "REQ-013", "REQ-014"), currentEvidence: { behavior: FLOW_BEHAVIOR, visualRegistry: FLOW_VISUAL_REGISTRY, adversarial: "tests/e2e/ondo-b-production-disclosure-focus.spec.ts" } },
  { id: "FL-017", name: "Payment KYC", doc: "FL-017_PAYMENT_KYC.md", acceptanceCount: 12, requirements: owner("REQ-005", "REQ-011"), currentEvidence: { behavior: FLOW_BEHAVIOR, visualRegistry: FLOW_VISUAL_REGISTRY, adversarial: "tests/e2e/ondo-b-flow-coverage.spec.ts" } },
  { id: "FL-018", name: "Labs wallet / bridge", doc: "FL-018_LABS_WALLET_BRIDGE.md", acceptanceCount: 13, requirements: owner("REQ-004", "REQ-005", "REQ-006", "REQ-014", "REQ-016"), currentEvidence: { behavior: FLOW_BEHAVIOR, visualRegistry: FLOW_VISUAL_REGISTRY, adversarial: "tests/e2e/ondo-b-flow8-wallet-direction.spec.ts" } },
] as const

export const TOSS_GRADE_CROSS_SURFACE_MANIFEST = [
  { id: "X-01", doc: "X-01_APP_SHELL_NAVIGATION.md", acceptanceCount: 10, requirements: ["REQ-005", "REQ-018"] },
  { id: "X-02", doc: "X-02_SETTINGS_DEVICE_DATA.md", acceptanceCount: 11, requirements: ["REQ-005", "REQ-012", "REQ-018"] },
  { id: "X-03", doc: "X-03_JAPANESE_JEJU_EDITORIAL_MEDIA.md", acceptanceCount: 10, requirements: ["REQ-007", "REQ-013", "REQ-017", "REQ-018", "REQ-019"] },
  { id: "X-04", doc: "X-04_LOADING_MOTION_RESPONSIVE.md", acceptanceCount: 10, requirements: ["REQ-005", "REQ-018"] },
] as const

export type TossGradeAttackCell = {
  id: string
  flowId: TossGradeFlowId
  requirement: TossGradeRequirement
  locale: TossGradeLocale
  viewport: TossGradeViewport
  attack: TossGradeAttack
  target: "required"
}

export const TOSS_GRADE_ATTACK_MATRIX: readonly TossGradeAttackCell[] = TOSS_GRADE_FLOW_MANIFEST.flatMap((flow) =>
  flow.requirements.flatMap((requirement) =>
    TOSS_GRADE_LOCALES.flatMap((locale) =>
      TOSS_GRADE_VIEWPORTS.flatMap((viewport) =>
        TOSS_GRADE_ATTACKS.map((attack) => ({
          id: `W0-${flow.id}-${requirement.id}-${locale}-${viewport.id}-${attack}`,
          flowId: flow.id,
          requirement: requirement.id,
          locale,
          viewport: viewport.id,
          attack,
          target: "required" as const,
        })),
      ),
    ),
  ),
)

/**
 * Honest current baseline. These are the shared committed pixel lanes, not a
 * claim that every flow already covers every locale × viewport × attack cell.
 * The target matrix above remains required until per-flow implementation QA
 * records evidence for each cell or an approved risk-based equivalence.
 */
export const CURRENT_SHARED_PIXEL_BASELINE = {
  locales: ["en", "ko"] as const,
  viewports: ["360x800", "390x844", "430x932", "768x1024", "801x1000", "1440x1000"] as const,
  knownTargetGaps: {
    locales: ["ja"] as const,
    viewports: ["320x568", "320x800", "844x390", "1440x900"] as const,
    combinationCoverage: "partial" as const,
  },
}
