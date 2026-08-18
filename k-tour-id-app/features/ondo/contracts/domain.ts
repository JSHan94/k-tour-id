export type Locale = "en" | "ko"
export type Persona = "short_term" | "korean_local" | "long_term_resident"
export type DiscoveryPreference = "classic" | "cafe" | "late" | "lively" | "calm" | "diet"
export type OndoTab = "ondo" | "my" | "tables" | "id"

export type AccountStatus = "ACC-GUEST" | "ACC-CREATING" | "ACC-ACTIVE" | "ACC-FAILED"
export type PersonStatus =
  | "PER-UNVERIFIED"
  | "PER-PENDING"
  | "PER-VERIFIED"
  | "PER-UNSUPPORTED"
  | "PER-FAILED"
  | "PER-EXPIRED"
export type AgeStatus = "AGE-UNVERIFIED" | "AGE-PENDING" | "AGE-VERIFIED" | "AGE-FAILED" | "AGE-EXPIRED"
export type PaymentKycStatus = "PKY-NOT-STARTED" | "PKY-PENDING" | "PKY-VERIFIED" | "PKY-FAILED" | "PKY-EXPIRED"
export type After19Mode = "A19-OFF" | "A19-PROMPT" | "A19-ON" | "A19-MANUAL-OFF"
export type SaveStatus = "SAV-IDLE" | "SAV-SAVING" | "SAV-SAVED" | "SAV-FAILED"
export type UploadStatus = "UPL-IDLE" | "UPL-PREVIEW" | "UPL-SENDING" | "UPL-SENT" | "UPL-FAILED" | "UPL-REMOVED"
export type MessageStatus = "MSG-IDLE" | "MSG-SENDING" | "MSG-SENT" | "MSG-FAILED"

export type GateKind = "account" | "person" | "age" | "payment_kyc"
export type GateState = "idle" | "pending" | "failed" | "unsupported"

export type ReturnToCta =
  | "SAVE_VENUE"
  | "JOIN_TABLE"
  | "OPEN_CHAT"
  | "SUBMIT_LOCAL_SIGNAL"
  | "START_CHECKOUT"
  | "OPEN_AFTER19"
  | "MINT_BADGE"

export type ReturnToEnvelope = {
  tokenId: string
  cta: ReturnToCta
  gateQueue: GateKind[]
  activeGate: GateKind
  venueId?: string
  tableId?: string
  createdAt: string
  expiresAt: string
  consumedAt?: string
}

export type Surface =
  | { kind: "map" }
  | { kind: "venue"; venueId: string }
  | { kind: "table"; tableId: string }
  | { kind: "chat"; tableId: string }
  | { kind: "local_signal"; venueId: string }
  | { kind: "checkout"; venueId: string }
  | { kind: "labs" }

export type HeatLevel = "low" | "warming" | "rising" | "hot" | "peak" | "limited"
export type LocalizedText = { en: string; ko: string }

export type Provenance = {
  truth: "SIMULATED" | "CONTRACT_ONLY" | "NOT_CONFIGURED" | "TESTNET"
  fixtureId: string
  sourceKind: "fixture" | "adapter" | "network"
  fetchedAt: string
  expiresAt?: string
  evidenceRef?: string
  txRef?: string
  isSimulation: boolean
}

export type VenueFact = {
  id: string
  label: LocalizedText
  value: LocalizedText
  tone: "positive" | "notice" | "neutral"
  provenance: Provenance
}

export type Venue = {
  id: string
  cityId: "seoul" | "busan"
  neighborhoodId: string
  name: LocalizedText
  category: LocalizedText
  description: LocalizedText
  image: string
  latitude: number
  longitude: number
  priceLabel: string
  distanceLabel: LocalizedText
  ondoScore: number | null
  heatLevel: HeatLevel
  signalCount: number
  confidence: "high" | "medium" | "low" | "limited"
  updatedAt: string
  reasons: LocalizedText[]
  facts: VenueFact[]
  lateNight: boolean
  alcohol: boolean
  provenance: Provenance
}

export type Neighborhood = {
  id: string
  cityId: "seoul" | "busan"
  name: LocalizedText
  latitude: number
  longitude: number
  ondoScore: number | null
  heatLevel: HeatLevel
  signalCount: number
  confidence: "high" | "medium" | "low" | "limited"
  updatedAt: string
}

export type PulseTable = {
  id: string
  venueId: string
  title: LocalizedText
  startsAt: string
  hostName: string
  hostRole: LocalizedText
  seatsTaken: number
  seatsTotal: number
  languages: string[]
  estimatedPriceKRW: number
  alcohol: boolean
  status: "open" | "full" | "closed" | "cancelled"
}

export type ReputationSnapshot = {
  identity: "unverified" | "verified"
  visit: "new" | "recent" | "repeat"
  contribution: "new" | "helpful" | "established"
  meetup: "new" | "reliable" | "established"
}

export type AssetBalance = {
  id: string
  symbol: "USDC" | "USDT" | "OOKRW"
  chain: "Sui Testnet" | "OmniOne hypothesis"
  representation: "native" | "wrapped" | "test_token"
  amount: string
  estimatedUsd?: string
  provenance: Provenance
}
