import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"
import type { GateKind, ReturnToCta } from "../../features/ondo/contracts/domain"
import {
  areRequiredReturnToGatesSatisfied,
  createReturnTo,
  hasExactReturnToGatePlan,
  isReturnToUsable,
  restoreReturnTo,
} from "../../features/ondo/contracts/return-to"

const appFile = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")
const canonicalDoc = (name: string) => readFileSync(resolve(process.cwd(), `../docs/ondo-execution/${name}`), "utf8")

const RETURN_TO_CTAS = [
  "SAVE_VENUE",
  "JOIN_TABLE",
  "OPEN_CHAT",
  "SUBMIT_LOCAL_SIGNAL",
  "START_CHECKOUT",
  "OPEN_AFTER19",
  "MINT_BADGE",
] as const satisfies readonly ReturnToCta[]

const GATES = ["account", "person", "age", "payment_kyc"] as const satisfies readonly GateKind[]
const FEATURE_SESSION_KEYS = ["ondo.chat.v2", "ondo.table-outcomes.v2", "ondo.labs.v2", "ondo.accepted-visits.v2"] as const

test("CONTRACT-DATA-017 v3 persistence keys and stored field allowlists stay canonical", () => {
  const provider = appFile("features/ondo/shared/state/ondo-provider.tsx")
  const stateModel = canonicalDoc("04_STATE_MODEL.md")
  const adapters = canonicalDoc("05_DATA_ADAPTER_CONTRACTS.md")

  expect(provider).toContain('const LOCAL_KEY = "ondo.preferences.v3"')
  expect(provider).toContain('const SESSION_KEY = "ondo.session.v3"')
  for (const key of FEATURE_SESSION_KEYS) expect(provider).toContain(`"${key}"`)

  for (const doc of [stateModel, adapters]) {
    expect(doc).toContain("`ondo.preferences.v3`")
    expect(doc).toContain("`ondo.session.v3`")
    for (const key of FEATURE_SESSION_KEYS) expect(doc).toContain(`\`${key}\``)
    expect(doc).not.toContain("ondo.pref.v2")
    expect(doc).not.toContain("ondo.returnTo.v2")
  }

  expect(stateModel).toContain("locale, guideSeen, autoNight, savedVenueIds, discoveryPreferences")
  expect(stateModel).toContain("onboarding, persona, account, person, age, ageExpiresAt, paymentKyc, after19, gate, gateState, tableMembershipById, reputation, acceptedActivityEventKeys, stamps, profile")
  expect(adapters).toContain("locale, guideSeen, autoNight, savedVenueIds, discoveryPreferences")
  expect(adapters).toContain("onboarding, persona, account, person, age, ageExpiresAt, paymentKyc, after19, gate, gateState, tableMembershipById, reputation, acceptedActivityEventKeys, stamps, profile")
})

test("CONTRACT-DATA-018 return envelope identifiers and shape stay aligned with canonical docs", () => {
  const domain = appFile("features/ondo/contracts/domain.ts")
  const flowCatalog = canonicalDoc("03_FLOW_CATALOG.md")
  const stateModel = canonicalDoc("04_STATE_MODEL.md")
  const adapters = canonicalDoc("05_DATA_ADAPTER_CONTRACTS.md")
  const now = new Date("2026-08-19T10:00:00.000Z")

  for (const cta of RETURN_TO_CTAS) {
    const envelope = createReturnTo({ cta, gateQueue: ["account"], venueId: "public-venue", now })
    expect(envelope).toEqual({
      tokenId: `RT-${cta}-${now.getTime()}`,
      cta,
      gateQueue: ["account"],
      activeGate: "account",
      venueId: "public-venue",
      tableId: undefined,
      createdAt: now.toISOString(),
      expiresAt: "2026-08-19T10:15:00.000Z",
    })
    for (const doc of [flowCatalog, stateModel, adapters]) {
      expect(doc).toContain(`\`${cta}\``)
      expect(doc).toContain(`RT-${cta}-<epoch-ms>`)
    }
  }
  for (const gate of GATES) expect(domain).toContain(`"${gate}"`)
  for (const obsolete of ["RT-SAVE→save", "RT-CHECKOUT→checkout", '"RT-SAVE"', '"RT-CHECKOUT"']) {
    expect(flowCatalog).not.toContain(obsolete)
    expect(stateModel).not.toContain(obsolete)
    expect(adapters).not.toContain(obsolete)
  }
})

test("CONTRACT-DATA-019 canonical persistence boundary never permits sensitive browser storage", () => {
  const stateModel = canonicalDoc("04_STATE_MODEL.md")
  const adapters = canonicalDoc("05_DATA_ADAPTER_CONTRACTS.md")
  const requiredDenials = ["credential", "생년월일", "국적", "payment instrument", "사진", "private key", "access token", "raw provider response"]

  for (const doc of [stateModel, adapters]) {
    for (const denial of requiredDenials) expect(doc).toContain(denial)
  }
})

test("CONTRACT-DATA-020 restored gates reject non-allowlisted data and strip unknown fields", () => {
  const now = new Date("2026-08-19T10:00:00.000Z")
  const envelope = createReturnTo({ cta: "SAVE_VENUE", gateQueue: ["account"], venueId: "public-venue", now })
  expect(isReturnToUsable({ ...envelope, cta: "OPEN_REDIRECT" } as never, new Date("2026-08-19T10:01:00.000Z"))).toBeFalsy()
  expect(isReturnToUsable({ ...envelope, tokenId: "RT-START_CHECKOUT-1787133600000" }, new Date("2026-08-19T10:01:00.000Z"))).toBeFalsy()
  expect(isReturnToUsable({ ...envelope, gateQueue: ["account", "admin"] } as never, new Date("2026-08-19T10:01:00.000Z"))).toBeFalsy()
  expect(restoreReturnTo({ ...envelope, credential: "must-not-survive" }, new Date("2026-08-19T10:01:00.000Z"))).toEqual(envelope)
  for (const malformed of [{}, { ...envelope, tokenId: 42 }, { ...envelope, cta: null }, { ...envelope, gateQueue: null }]) {
    expect(() => restoreReturnTo(malformed, new Date("2026-08-19T10:01:00.000Z"))).not.toThrow()
    expect(restoreReturnTo(malformed, new Date("2026-08-19T10:01:00.000Z"))).toBeNull()
  }
})

test("CONTRACT-DATA-021 each return CTA accepts only its real gate sequence and context", () => {
  const now = new Date("2026-08-19T10:00:00.000Z")
  const valid = [
    createReturnTo({ cta: "SAVE_VENUE", gateQueue: ["account"], venueId: "public-venue", now }),
    createReturnTo({ cta: "JOIN_TABLE", gateQueue: ["account", "person", "age"], venueId: "public-venue", tableId: "public-table", now }),
    createReturnTo({ cta: "JOIN_TABLE", gateQueue: ["person", "age"], venueId: "public-venue", tableId: "public-table", now }),
    createReturnTo({ cta: "OPEN_CHAT", gateQueue: ["account"], tableId: "public-table", now }),
    createReturnTo({ cta: "SUBMIT_LOCAL_SIGNAL", gateQueue: ["account", "person"], venueId: "public-venue", now }),
    createReturnTo({ cta: "START_CHECKOUT", gateQueue: ["account", "payment_kyc"], venueId: "public-venue", now }),
    createReturnTo({ cta: "OPEN_AFTER19", gateQueue: ["age"], now }),
    createReturnTo({ cta: "OPEN_AFTER19", gateQueue: ["age"], venueId: "public-venue", now }),
    createReturnTo({ cta: "MINT_BADGE", gateQueue: ["person"], now }),
  ]

  for (const envelope of valid) {
    expect(isReturnToUsable(envelope, new Date("2026-08-19T10:01:00.000Z"))).toBeTruthy()
    expect(restoreReturnTo(envelope, new Date("2026-08-19T10:01:00.000Z"))).toEqual(envelope)
  }
})

test("CONTRACT-DATA-022 malformed context, gate sequences, and token epochs never restore", () => {
  const now = new Date("2026-08-19T10:00:00.000Z")
  const make = (cta: ReturnToCta, gateQueue: [GateKind, ...GateKind[]], context: { venueId?: string; tableId?: string } = {}) => (
    createReturnTo({ cta, gateQueue, ...context, now })
  )
  const invalid = [
    make("SAVE_VENUE", ["account"]),
    make("SAVE_VENUE", ["account"], { venueId: "public-venue", tableId: "unrelated-table" }),
    make("SAVE_VENUE", ["age"], { venueId: "public-venue" }),
    make("SAVE_VENUE", ["account", "account"], { venueId: "public-venue" }),
    make("JOIN_TABLE", ["account"], { venueId: "public-venue" }),
    make("JOIN_TABLE", ["account"], { tableId: "public-table" }),
    make("OPEN_CHAT", ["account"]),
    make("OPEN_CHAT", ["account"], { venueId: "unrelated-venue", tableId: "public-table" }),
    make("SUBMIT_LOCAL_SIGNAL", ["age"], { venueId: "public-venue" }),
    make("START_CHECKOUT", ["payment_kyc", "account"], { venueId: "public-venue" }),
    make("OPEN_AFTER19", ["account"], { venueId: "public-venue" }),
    make("OPEN_AFTER19", ["age"], { venueId: "public-venue", tableId: "unrelated-table" }),
    make("MINT_BADGE", ["person"], { venueId: "unrelated-venue" }),
    { ...make("SAVE_VENUE", ["account"], { venueId: "public-venue" }), venueId: null },
    { ...make("OPEN_AFTER19", ["age"]), venueId: null },
    { ...make("SAVE_VENUE", ["account"], { venueId: "public-venue" }), tokenId: "RT-SAVE_VENUE-1787133600001" },
  ]

  for (const envelope of invalid) {
    expect(isReturnToUsable(envelope as never, new Date("2026-08-19T10:01:00.000Z"))).toBeFalsy()
    expect(restoreReturnTo(envelope, new Date("2026-08-19T10:01:00.000Z"))).toBeNull()
  }
})

test("CONTRACT-DATA-023 canonical docs own the CTA gate/context matrix and Labs has no default fallthrough", () => {
  const stateModel = canonicalDoc("04_STATE_MODEL.md")
  const adapters = canonicalDoc("05_DATA_ADAPTER_CONTRACTS.md")
  const provider = appFile("features/ondo/shared/state/ondo-provider.tsx")
  const expectedRows = [
    "| `SAVE_VENUE` | `account` | required | forbidden |",
    "| `JOIN_TABLE` | `account` + `person` when `table.requiresPerson` + `age` when `table.alcohol` | required | required |",
    "| `OPEN_CHAT` | `account` | forbidden | required |",
    "| `SUBMIT_LOCAL_SIGNAL` | `account → person` | required | forbidden |",
    "| `START_CHECKOUT` | `account → payment_kyc` | required | forbidden |",
    "| `OPEN_AFTER19` | `age` | optional | forbidden |",
    "| `MINT_BADGE` | `person` | forbidden | forbidden |",
  ]
  for (const doc of [stateModel, adapters]) for (const row of expectedRows) expect(doc).toContain(row)

  const applyStart = provider.indexOf("function applyReturnTo")
  const applyEnd = provider.indexOf("export function OndoProvider")
  const applyBody = provider.slice(applyStart, applyEnd).trim()
  expect(applyBody).toContain('if (envelope.cta === "MINT_BADGE")')
  expect(applyBody).toMatch(/return \{ \.\.\.state, gate: null, gateState: "idle", surface: \{ kind: "map" \} \}\n\}$/)
})

test("CONTRACT-DATA-024 hydration validates return contexts against canonical entity registries", () => {
  const provider = appFile("features/ondo/shared/state/ondo-provider.tsx")

  expect(provider).toContain('import { canonicalMapVenueById } from "@/lib/ondo/venues/map-data"')
  expect(provider).toContain('import { TABLES } from "../../connect/table-model"')
  expect(provider).toContain("function hasRegisteredReturnContext(envelope: ReturnToEnvelope)")
  expect(provider).toContain("const restoredGate = restoreReturnTo(session.gate)")
  expect(provider).toContain("const pendingGate = restoredGate")
  expect(provider).toContain("&& hasRegisteredReturnContext(restoredGate)")
  expect(provider).toContain("? restoredGate")
  expect(provider).toContain("table.venueId === envelope.venueId")
})

test("CONTRACT-DATA-025 canonical docs type and describe registry-safe return restoration exactly", () => {
  const stateModel = canonicalDoc("04_STATE_MODEL.md")
  const adapters = canonicalDoc("05_DATA_ADAPTER_CONTRACTS.md")
  const returnCtaType = stateModel.indexOf("type ReturnToCta =")
  const returnStateType = stateModel.indexOf("type ReturnToState =")

  expect(returnCtaType).toBeGreaterThan(-1)
  expect(returnCtaType).toBeLessThan(returnStateType)
  expect(stateModel.slice(returnStateType, stateModel.indexOf("type CanonicalDomainState"))).toContain("cta: ReturnToCta;")
  for (const doc of [stateModel, adapters]) {
    expect(doc).toContain("canonical map 또는 Table venue registry")
    expect(doc).toContain("canonical `TABLES` registry")
    expect(doc).toContain("table↔venue pair")
    expect(doc).toContain("별도 toast 없이 안전한 map surface")
  }
  expect(adapters).not.toContain("허용되지 않은 route")
  expect(adapters).toContain("허용되지 않은 context")
})

test("CONTRACT-DATA-026 return queues equal the unsatisfied gates from the resolved full plan", () => {
  const envelope = createReturnTo({
    cta: "JOIN_TABLE",
    gateQueue: ["account", "person", "age"],
    venueId: "seoul-euljiro-nogari",
    tableId: "table-euljiro-night",
    now: new Date("2026-08-19T10:00:00.000Z"),
  })
  const satisfaction = (satisfied: readonly GateKind[]) => (gate: GateKind) => satisfied.includes(gate)
  const joinPlan: readonly GateKind[] = ["account", "person", "age"]

  expect(hasExactReturnToGatePlan({ ...envelope, gateQueue: ["age"], activeGate: "age" }, joinPlan, satisfaction([]))).toBeFalsy()
  expect(hasExactReturnToGatePlan({ ...envelope, gateQueue: ["person", "age"], activeGate: "person" }, joinPlan, satisfaction(["account"]))).toBeTruthy()
  expect(hasExactReturnToGatePlan({ ...envelope, gateQueue: ["age"], activeGate: "age" }, joinPlan, satisfaction(["account", "person"]))).toBeTruthy()
  expect(hasExactReturnToGatePlan({ ...envelope, gateQueue: ["person", "age"], activeGate: "person" }, joinPlan, satisfaction(["account", "person"]))).toBeFalsy()
  expect(hasExactReturnToGatePlan({ ...envelope, gateQueue: ["age"], activeGate: "age" }, ["account"], satisfaction([]))).toBeFalsy()
  expect(hasExactReturnToGatePlan({ ...envelope, cta: "SUBMIT_LOCAL_SIGNAL", gateQueue: ["person"], activeGate: "person" }, ["account", "person"], satisfaction([]))).toBeFalsy()
  expect(hasExactReturnToGatePlan({ ...envelope, cta: "START_CHECKOUT", gateQueue: ["payment_kyc"], activeGate: "payment_kyc" }, ["account", "payment_kyc"], satisfaction([]))).toBeFalsy()
  expect(areRequiredReturnToGatesSatisfied(joinPlan, satisfaction(["account", "person"]))).toBeFalsy()
  expect(areRequiredReturnToGatesSatisfied(joinPlan, satisfaction(["account", "person", "age"]))).toBeTruthy()
})

test("CONTRACT-DATA-027 provider and canonical docs enforce progress coherence through mutation", () => {
  const provider = appFile("features/ondo/shared/state/ondo-provider.tsx")
  const stateModel = canonicalDoc("04_STATE_MODEL.md")
  const adapters = canonicalDoc("05_DATA_ADAPTER_CONTRACTS.md")

  expect(provider).toContain("function requiredReturnToGatePlan(envelope: ReturnToEnvelope)")
  expect(provider).toContain("table.requiresPerson")
  expect(provider).toContain("table.alcohol")
  expect(provider).toContain("hasExactReturnToGatePlan(restoredGate, restoredGatePlan, (gate) => gateSatisfied(restoredGateState, gate))")
  expect(provider).toContain("hasExactReturnToGatePlan(state.gate, persistentGatePlan, (gate) => gateSatisfied(state, gate))")
  expect(provider).toContain("!areRequiredReturnToGatesSatisfied(requiredGatePlan, (gate) => gateSatisfied(state, gate))")
  expect(provider).toContain("gateQueue: remainingQueue")
  for (const doc of [stateModel, adapters]) {
    expect(doc).toContain("CTA와 등록된 context에서 full required gate plan을 다시 계산")
    expect(doc).toContain("`gateQueue`는 그 plan에서 현재 session이 아직 충족하지 못한 gate의 정확한 목록")
    expect(doc).toContain("생략된 required gate는 session에서 이미 충족")
    expect(doc).toContain("원 CTA mutation 직전에 full required gate plan 전체를 다시 검증")
  }
})
