import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"
import type { GateKind, ReturnToCta } from "../../features/ondo/contracts/domain"
import { createReturnTo, isReturnToUsable, restoreReturnTo } from "../../features/ondo/contracts/return-to"

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
