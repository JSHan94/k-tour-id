import { createHash } from "node:crypto"
import { epsg5174ToWgs84 } from "./epsg5174.mjs"
import { DISTRICT_CATEGORY_QUOTA } from "./source-config.mjs"

const CATEGORY_RULES = [
  ["korean", ["한식"]],
  ["casual", ["분식", "김밥", "패스트푸드"]],
  ["japanese", ["일식"]],
  ["chinese", ["중국식"]],
  ["global", ["경양식", "외국음식전문점"]],
  ["night", ["호프/통닭", "정종/대포집/소주방", "감성주점", "까페"]],
  ["specialty", ["횟집", "식육(숯불구이)", "통닭(치킨)"]],
]

export const UNKNOWN_FIELD_NAMES = [
  "nameEn",
  "openingHours",
  "openNow",
  "foreignCardAccepted",
  "menu",
  "priceRange",
  "reservationPolicy",
  "englishSupport",
  "image",
]

export function clean(value) {
  return String(value ?? "").replace(/\u0000/g, "").trim()
}

function categoryFor(rawCategory) {
  for (const [category, terms] of CATEGORY_RULES) {
    if (terms.some((term) => rawCategory.includes(term))) return category
  }
  return null
}

function normalizeDate(value) {
  const digits = clean(value).replace(/\D/g, "")
  if (digits.length < 8) return null
  const timestamp = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}T${digits.slice(8, 10) || "00"}:${digits.slice(10, 12) || "00"}:${digits.slice(12, 14) || "00"}+09:00`
  return Number.isNaN(Date.parse(timestamp)) ? null : timestamp
}

function official(value, field, sourceRecordDigest) {
  return { value, truth: "OFFICIAL_SOURCE", sourceRefId: "MOIS_LOCALDATA_GENERAL_RESTAURANTS", sourceField: field, sourceRecordDigest }
}

function unknown() {
  return { value: null, truth: "UNKNOWN", sourceRefId: null, sourceField: null, sourceRecordDigest: null }
}

function stableDigest(value) {
  return createHash("sha256").update(value).digest("hex")
}

export function candidateFromRow(row, cityId, cityConfig) {
  if (clean(row["영업상태명"]) !== "영업/정상" || clean(row["상세영업상태명"]) !== "영업") return null
  const managementId = clean(row["관리번호"])
  const municipalityCode = clean(row["개방자치단체코드"])
  const nameKo = clean(row["사업장명"])
  const roadAddress = clean(row["도로명주소"])
  const lotAddress = clean(row["지번주소"])
  const address = roadAddress || lotAddress
  const rawCategory = clean(row["업태구분명"] || row["위생업태명"])
  const primaryCategory = categoryFor(rawCategory)
  const districtId = cityConfig.districts.find((district) => address.includes(district))
  const sourceX = Number.parseFloat(clean(row["좌표정보(X)"]))
  const sourceY = Number.parseFloat(clean(row["좌표정보(Y)"]))
  if (!managementId || !nameKo || !address || !districtId || !primaryCategory || !Number.isFinite(sourceX) || !Number.isFinite(sourceY)) return null
  const { latitude, longitude } = epsg5174ToWgs84(sourceX, sourceY)
  const bounds = cityConfig.bounds
  if (latitude < bounds.south || latitude > bounds.north || longitude < bounds.west || longitude > bounds.east) return null

  const evidencePayload = [municipalityCode, managementId, nameKo, rawCategory, roadAddress, lotAddress, sourceX, sourceY, clean(row["영업상태명"]), clean(row["상세영업상태명"]), clean(row["최종수정시점"])].join("|")
  const sourceRecordDigest = stableDigest(evidencePayload)
  const id = `mois-${stableDigest(managementId).slice(0, 20)}`
  const unknownFacts = Object.fromEntries(UNKNOWN_FIELD_NAMES.map((field) => [field, unknown()]))

  return {
    id,
    sourceIds: { moisManagementId: managementId, municipalityCode },
    cityId,
    districtId,
    name: { ko: official(nameKo, "사업장명", sourceRecordDigest), en: unknown() },
    primaryCategory,
    sourceCategory: official(rawCategory, "업태구분명", sourceRecordDigest),
    address: {
      road: roadAddress ? official(roadAddress, "도로명주소", sourceRecordDigest) : unknown(),
      lot: lotAddress ? official(lotAddress, "지번주소", sourceRecordDigest) : unknown(),
    },
    location: {
      latitude,
      longitude,
      crs: "EPSG:4326",
      source: { x: sourceX, y: sourceY, crs: "EPSG:5174", sourceFieldX: "좌표정보(X)", sourceFieldY: "좌표정보(Y)" },
      truth: "OFFICIAL_SOURCE",
      sourceRefId: "MOIS_LOCALDATA_GENERAL_RESTAURANTS",
      transformation: "EPSG:5174_TO_EPSG:4326__EPSG_OPERATION_5174",
      sourceRecordDigest,
    },
    licenseStatus: official("ACTIVE_LICENSE_RECORD", "영업상태명+상세영업상태명", sourceRecordDigest),
    licenseOpenedAt: clean(row["인허가일자"]) ? official(normalizeDate(row["인허가일자"]), "인허가일자", sourceRecordDigest) : unknown(),
    sourceModifiedAt: clean(row["최종수정시점"]) ? official(normalizeDate(row["최종수정시점"]), "최종수정시점", sourceRecordDigest) : unknown(),
    facts: unknownFacts,
    heat: { score: null, level: null, signalCount: null, confidence: null, freshness: null, truth: "UNKNOWN", simulation: null },
    sourceRefs: ["MOIS_LOCALDATA_GENERAL_RESTAURANTS"],
  }
}

function deterministicRank(candidate) {
  return stableDigest(`${candidate.cityId}|${candidate.districtId}|${candidate.primaryCategory}|${candidate.sourceIds.moisManagementId}`)
}

export function selectQuota(candidates, cityConfig) {
  const selected = []
  for (const districtId of cityConfig.districts) {
    const district = candidates.filter((candidate) => candidate.districtId === districtId)
    for (const [primaryCategory, quota] of Object.entries(DISTRICT_CATEGORY_QUOTA)) {
      const categoryCandidates = district
        .filter((candidate) => candidate.primaryCategory === primaryCategory)
        .sort((a, b) => deterministicRank(a).localeCompare(deterministicRank(b)))
      if (categoryCandidates.length < quota) throw new Error(`${districtId}/${primaryCategory}: ${categoryCandidates.length} candidates cannot satisfy quota ${quota}`)
      selected.push(...categoryCandidates.slice(0, quota))
    }
  }
  return selected.sort((a, b) => a.cityId.localeCompare(b.cityId) || a.districtId.localeCompare(b.districtId, "ko") || a.id.localeCompare(b.id))
}

export function deduplicateCandidates(candidates) {
  const byIdentity = new Map()
  for (const candidate of candidates) {
    const address = candidate.address.road.value ?? candidate.address.lot.value
    const key = `${candidate.name.ko.value.replace(/\s+/g, "").toLowerCase()}|${address.replace(/\s+/g, "").toLowerCase()}`
    const previous = byIdentity.get(key)
    const previousModified = Date.parse(previous?.sourceModifiedAt.value ?? "") || 0
    const currentModified = Date.parse(candidate.sourceModifiedAt.value ?? "") || 0
    if (!previous || currentModified > previousModified || currentModified === previousModified && candidate.id < previous.id) byIdentity.set(key, candidate)
  }
  return [...byIdentity.values()]
}
