export const UNIFIED_PULSE_WEIGHTS = Object.freeze({
  japanMomentum: 0.4,
  koreaLocalMomentum: 0.4,
  ondoMomentum: 0.2,
} as const)

export type UnifiedPulseDriverB = keyof typeof UNIFIED_PULSE_WEIGHTS

export type UnifiedPulseSourceReferenceB = {
  id: string
  sourceType: "official-tourism" | "original-creator" | "editorial" | "korea-local" | "ondo-first-party"
  url: string
  observedAt: string
  verifiedAt: string
  verificationState: "verified" | "pending" | "rejected"
  canonicalVenueId: string
  placeEdgeVerified: boolean
  sponsorship: "organic" | "paid" | "unknown"
}

export type UnifiedPulseEvidenceB = {
  value: number
  valueExcludesSponsored: true
  biasReview: "passed" | "pending" | "failed"
  references: readonly UnifiedPulseSourceReferenceB[]
}

export type UnifiedPulseInputB = Record<UnifiedPulseDriverB, UnifiedPulseEvidenceB | null>

export type UnifiedPulseResultB = {
  score: number | null
  confidence: "high" | "medium" | "growing"
  publicState: "scored" | "growing"
  publicScoreCount: 0 | 1
  excludedSponsoredEvidence: number
  drivers: Readonly<Record<UnifiedPulseDriverB, number | null>>
}

export const PULSE_COMPOSITION_DISCLOSURE = Object.freeze({
  en: "Fixed walkthrough snapshots — not weather, live crowding or official LOCALDATA facts. Production place temperature will use only verified Japan-interest, Korea-local and first-party evidence; paid placements never count.",
  ko: "날씨·실시간 혼잡도·공식 LOCALDATA 사실이 아닌 고정 워크스루 스냅샷입니다. 실제 장소 온도는 검증된 일본 관심도·한국 로컬·자체 서비스 근거만 합산하며, 유료 노출은 제외합니다.",
  ja: "気温・リアルタイムの混雑状況・LOCALDATAの公式情報ではない固定スナップショットです。実運用のスポットのにぎわいでは、検証済みの日本での関心、韓国ローカル、自社サービスの根拠のみを使用し、広告・有料掲載は算定に含めません。",
})

export const PULSE_PRODUCTION_DRIVER_DISCLOSURE = Object.freeze({
  en: [
    { id: "japan", label: "Japan interest", state: "Growing", detail: "Source and place links pending verification" },
    { id: "korea", label: "Korea local", state: "Growing", detail: "Current local evidence not connected" },
    { id: "ondo", label: "K-Tour ID", state: "Growing", detail: "First-party production evidence not connected" },
  ],
  ko: [
    { id: "japan", label: "일본 관심도", state: "성장 중", detail: "출처와 장소 연결 검증 중" },
    { id: "korea", label: "한국 로컬", state: "성장 중", detail: "최신 로컬 근거 미연결" },
    { id: "ondo", label: "K-Tour ID", state: "성장 중", detail: "실서비스 자체 근거 미연결" },
  ],
  ja: [
    { id: "japan", label: "日本での関心", state: "拡充中", detail: "情報源と場所リンクを確認中" },
    { id: "korea", label: "韓国ローカル", state: "拡充中", detail: "最新のローカル根拠は未接続" },
    { id: "ondo", label: "K-Tour ID", state: "拡充中", detail: "実運用の自社データは未接続" },
  ],
})

export const PULSE_EVIDENCE_MAX_AGE_DAYS = 30

// Jeju reuses the same field/aura/core renderer as Seoul and Busan, but its
// verified VISITKOREA points are editorial coverage rather than scored ONDO
// evidence. Keep this truth in one contract so map, list and place detail
// cannot drift into Hot/Peak semantics independently.
export const JEJU_EDITORIAL_TEMPERATURE = Object.freeze({
  mode: "editorial-coverage",
  model: "editorial-unscored",
  level: "limited",
  score: null,
  pulseEligible: false,
  officialRecord: false,
} as const)

export const JEJU_EDITORIAL_COVERAGE_LABEL = Object.freeze({
  en: "Editorial place coverage",
  ko: "편집 장소 분포",
  ja: "編集スポットの分布",
} as const)

export type JejuEditorialCoverageIntensityB = "sparse" | "clustered" | "dense"

export const JEJU_EDITORIAL_COVERAGE_INTENSITY_LABEL = Object.freeze({
  sparse: { en: "Sparse", ko: "분산", ja: "分散" },
  clustered: { en: "Grouped", ko: "모임", ja: "まとまり" },
  dense: { en: "Dense", ko: "밀집", ja: "密集" },
} satisfies Record<JejuEditorialCoverageIntensityB, Record<"en" | "ko" | "ja", string>>)

export const JEJU_EDITORIAL_UNSCORED_LABEL = Object.freeze({
  en: "No popularity score",
  ko: "인기 점수 없음",
  ja: "人気スコアなし",
} as const)

function validDate(value: string) {
  return !Number.isNaN(Date.parse(value))
}

function parseHttpsUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "https:" && url.hostname && !url.username && !url.password ? url : null
  } catch {
    return null
  }
}

const DRIVER_SOURCE_TYPES: Readonly<Record<UnifiedPulseDriverB, readonly UnifiedPulseSourceReferenceB["sourceType"][]>> = Object.freeze({
  japanMomentum: ["official-tourism", "original-creator", "editorial"],
  koreaLocalMomentum: ["korea-local"],
  ondoMomentum: ["ondo-first-party"],
})

function validSourceReference(reference: UnifiedPulseSourceReferenceB, driver: UnifiedPulseDriverB, targetVenueId: string, asOf: string) {
  if (reference.verificationState !== "verified" || reference.sponsorship !== "organic" || !reference.placeEdgeVerified || !reference.canonicalVenueId.trim()) return false
  if (!reference.id.trim() || reference.canonicalVenueId !== targetVenueId || !DRIVER_SOURCE_TYPES[driver].includes(reference.sourceType)) return false
  if (!parseHttpsUrl(reference.url)) return false
  if (!validDate(reference.observedAt) || !validDate(reference.verifiedAt) || !validDate(asOf)) return false
  const observedAt = Date.parse(reference.observedAt)
  const verifiedAt = Date.parse(reference.verifiedAt)
  const releaseAt = Date.parse(asOf)
  if (observedAt > verifiedAt || verifiedAt > releaseAt) return false
  return releaseAt - observedAt <= PULSE_EVIDENCE_MAX_AGE_DAYS * 86_400_000
}

function acceptedReferences(evidence: UnifiedPulseEvidenceB | null, driver: UnifiedPulseDriverB, targetVenueId: string, asOf: string) {
  if (!evidence) return []
  return evidence.references.filter((reference) => validSourceReference(reference, driver, targetVenueId, asOf))
}

const MULTIPART_PUBLIC_SUFFIXES = new Set(["co.jp", "ne.jp", "co.kr", "or.kr", "go.kr", "co.uk", "com.au"])

function publisherIdentity(value: string) {
  const parsed = parseHttpsUrl(value)
  if (!parsed) return null
  const parts = parsed.hostname.toLowerCase().replace(/^(?:www|m|mobile|amp)\./, "").split(".")
  const suffix = parts.slice(-2).join(".")
  return parts.slice(MULTIPART_PUBLIC_SUFFIXES.has(suffix) ? -3 : -2).join(".")
}

function canonicalEvidenceUrl(value: string) {
  const url = parseHttpsUrl(value)
  if (!url) return null
  url.hash = ""
  for (const key of [...url.searchParams.keys()]) if (/^(?:utm_|fbclid|gclid)/i.test(key)) url.searchParams.delete(key)
  url.searchParams.sort()
  url.hostname = url.hostname.toLowerCase().replace(/^(?:www|m|mobile|amp)\./, "")
  return url.toString()
}

function validEvidence(evidence: UnifiedPulseEvidenceB | null, driver: UnifiedPulseDriverB, targetVenueId: string, asOf: string): evidence is UnifiedPulseEvidenceB {
  if (!evidence || evidence.valueExcludesSponsored !== true || evidence.biasReview !== "passed") return false
  if (!Number.isFinite(evidence.value) || evidence.value < 0 || evidence.value > 100) return false
  const accepted = acceptedReferences(evidence, driver, targetVenueId, asOf)
  if (accepted.length < 1) return false
  if (accepted.length !== evidence.references.length) return false
  return new Set(accepted.map((reference) => reference.id)).size === accepted.length
}

export function composeUnifiedPulseB(targetVenueId: string, input: UnifiedPulseInputB, asOf: string): UnifiedPulseResultB {
  const excludedSponsoredEvidence = Object.values(input).reduce((total, evidence) => (
    total + (evidence?.references.filter((reference) => reference.sponsorship !== "organic").length ?? 0)
  ), 0)
  const allReferences = Object.values(input).flatMap((evidence) => evidence?.references ?? [])
  const canonicalUrls = allReferences.map((reference) => canonicalEvidenceUrl(reference.url))
  const globallyUnique = canonicalUrls.every((url): url is string => url !== null)
    && new Set(allReferences.map((reference) => reference.id)).size === allReferences.length
    && new Set(canonicalUrls).size === allReferences.length
  const accepted = Object.fromEntries((Object.keys(UNIFIED_PULSE_WEIGHTS) as UnifiedPulseDriverB[]).map((driver) => [
    driver,
    globallyUnique && targetVenueId.trim() && validEvidence(input[driver], driver, targetVenueId, asOf) ? input[driver] : null,
  ])) as Record<UnifiedPulseDriverB, UnifiedPulseEvidenceB | null>
  const drivers = Object.freeze({
    japanMomentum: accepted.japanMomentum?.value ?? null,
    koreaLocalMomentum: accepted.koreaLocalMomentum?.value ?? null,
    ondoMomentum: accepted.ondoMomentum?.value ?? null,
  })
  if (Object.values(accepted).some((evidence) => evidence === null)) {
    return {
      score: null,
      confidence: "growing",
      publicState: "growing",
      publicScoreCount: 0,
      excludedSponsoredEvidence,
      drivers,
    }
  }
  const score = Math.round((Object.keys(UNIFIED_PULSE_WEIGHTS) as UnifiedPulseDriverB[]).reduce((sum, driver) => (
    sum + accepted[driver]!.value * UNIFIED_PULSE_WEIGHTS[driver]
  ), 0))
  const acceptedByDriver = (Object.keys(UNIFIED_PULSE_WEIGHTS) as UnifiedPulseDriverB[]).map((driver) => acceptedReferences(accepted[driver], driver, targetVenueId, asOf))
  const independentPerDriver = acceptedByDriver.every((references) => new Set(references.map((reference) => publisherIdentity(reference.url)).filter(Boolean)).size >= 2)
  const sourceTypeDiversity = new Set(acceptedByDriver.flat().map((reference) => reference.sourceType)).size
  const confidence = independentPerDriver && sourceTypeDiversity >= 3 ? "high" : "medium"
  return {
    score,
    confidence,
    publicState: "scored",
    publicScoreCount: 1,
    excludedSponsoredEvidence,
    drivers,
  }
}

export type JapanFirstContentIdB = "C01" | "C02" | "C03" | "C06" | "C08" | "C12" | "C18" | "C20" | "C22"

export type JapanFirstLaunchContentB = {
  id: JapanFirstContentIdB
  title: { en: string; ko: string; ja: string }
  jaHook: string
  cityIds: readonly ("seoul" | "busan" | "jeju")[]
  sourceReferences: readonly {
    label: string
    url: string
    type: "original-creator" | "official-tourism" | "official-context" | "editorial" | "secondary-reporting"
    publishedOrObservedAt: string | null
    importedAt: "2026-08-26"
    liveCheckedAt: string | null
    verificationState: "report-linked"
    sponsorship: "organic-official" | "unknown"
    rightsMode: "link-only"
  }[]
  sourceVerification: "report-linked"
  placeEdgeVerification: "pending" | "verified"
  sponsorship: "organic-official" | "unknown"
  rightsMode: "link-only"
  researchRecordedAt: "2026-08-24"
  pulseEligible: false
  editorialMedia?: {
    src: string
    alt: { en: string; ko: string; ja: string }
    credit: { en: string; ko: string; ja: string }
    rightsMode: "ondo-original"
  }
}

export const JAPAN_FIRST_FEATURED_CONTENT_IDS = Object.freeze(["C01", "C03", "C06"] as const)

export const JAPAN_FIRST_LAUNCH_CONTENT: readonly JapanFirstLaunchContentB[] = Object.freeze([
  {
    id: "C01",
    title: { en: "Fact-check Seoul's fresh sesame-oil pilgrimage", ko: "서울 즉석 참기름 성지 팩트체크", ja: "ソウル『ごま油の聖地』を検証" },
    jaHook: "ソウルの『ごま油の聖地』を検証",
    editorialMedia: {
      src: "/editorial/japan-first-c01-sesame-oil.jpg",
      alt: {
        en: "Editorial still life of freshly pressed sesame oil in a Seoul market",
        ko: "서울 시장의 즉석 참기름을 표현한 편집 이미지",
        ja: "ソウル市場の搾りたてごま油を表現した編集画像",
      },
      credit: { en: "K-Tour ID original editorial illustration", ko: "K-Tour ID 오리지널 편집 이미지", ja: "K-Tour ID 編集イラスト" },
      rightsMode: "ondo-original",
    },
    cityIds: ["seoul"],
    sourceReferences: [
      { label: "Rurubu & more", url: "https://rurubu.jp/andmore/article/25110", type: "editorial", publishedOrObservedAt: null, importedAt: "2026-08-26", liveCheckedAt: null, verificationState: "report-linked", sponsorship: "unknown", rightsMode: "link-only" },
      { label: "The Fact 2026", url: "https://news.tf.co.kr/read/video/2324687.htm", type: "secondary-reporting", publishedOrObservedAt: "2026-06-02", importedAt: "2026-08-26", liveCheckedAt: null, verificationState: "report-linked", sponsorship: "unknown", rightsMode: "link-only" },
    ],
    sourceVerification: "report-linked", placeEdgeVerification: "pending", sponsorship: "unknown", rightsMode: "link-only", researchRecordedAt: "2026-08-24", pulseEligible: false,
  },
  {
    id: "C02",
    title: { en: "Follow a monthly Korea travel creator's 14 stops", ko: "매달 서울 가는 일본 여행 크리에이터의 14곳", ja: "毎月渡韓する旅クリエイターの14選" },
    jaHook: "毎月渡韓する旅クリエイターの14選",
    cityIds: ["seoul"],
    sourceReferences: [{ label: "YouTube · 大人の休日CH", url: "https://www.youtube.com/watch?v=G7hPMdA7HG4", type: "original-creator", publishedOrObservedAt: null, importedAt: "2026-08-26", liveCheckedAt: null, verificationState: "report-linked", sponsorship: "unknown", rightsMode: "link-only" }],
    sourceVerification: "report-linked", placeEdgeVerification: "pending", sponsorship: "unknown", rightsMode: "link-only", researchRecordedAt: "2026-08-24", pulseEligible: false,
  },
  {
    id: "C03",
    title: { en: "What fits into an eight-hour Seoul stop?", ko: "서울 체류 8시간, 어디까지 가능할까?", ja: "ソウル滞在8時間、どこまで楽しめる？" },
    jaHook: "滞在8時間、ソウルでどこまでできる？",
    editorialMedia: {
      src: "/editorial/japan-first-c03-seoul-eight-hours.jpg",
      alt: {
        en: "Editorial collage of an eight-hour route through Seoul",
        ko: "서울 8시간 여행 동선을 표현한 편집 콜라주",
        ja: "ソウル8時間の旅程を表現した編集コラージュ",
      },
      credit: { en: "K-Tour ID original editorial illustration", ko: "K-Tour ID 오리지널 편집 이미지", ja: "K-Tour ID 編集イラスト" },
      rightsMode: "ondo-original",
    },
    cityIds: ["seoul"],
    sourceReferences: [{ label: "YouTube · Haru", url: "https://www.youtube.com/watch?v=6D3xv0y688I", type: "original-creator", publishedOrObservedAt: null, importedAt: "2026-08-26", liveCheckedAt: null, verificationState: "report-linked", sponsorship: "unknown", rightsMode: "link-only" }],
    sourceVerification: "report-linked", placeEdgeVerification: "pending", sponsorship: "unknown", rightsMode: "link-only", researchRecordedAt: "2026-08-24", pulseEligible: false,
  },
  {
    id: "C06",
    title: { en: "Nana's monthly Korea beauty research", ko: "Nana의 한국 뷰티 취재 지도", ja: "Nanaの韓国美容リサーチ" },
    jaHook: "月1渡韓の視点で見る韓国美容リサーチ",
    editorialMedia: {
      src: "/editorial/japan-first-c06-beauty-research.jpg",
      alt: {
        en: "Editorial beauty-research desk with skincare objects and a Seoul map",
        ko: "스킨케어 오브제와 서울 지도를 담은 뷰티 취재 편집 이미지",
        ja: "スキンケア用品とソウル地図を配した美容取材の編集画像",
      },
      credit: { en: "K-Tour ID original editorial illustration", ko: "K-Tour ID 오리지널 편집 이미지", ja: "K-Tour ID 編集イラスト" },
      rightsMode: "ondo-original",
    },
    cityIds: ["seoul"],
    sourceReferences: [
      { label: "Hanako 2025", url: "https://hanako.tokyo/travel/465904/", type: "editorial", publishedOrObservedAt: null, importedAt: "2026-08-26", liveCheckedAt: null, verificationState: "report-linked", sponsorship: "unknown", rightsMode: "link-only" },
      { label: "Ministry of Health and Welfare", url: "https://mohw.go.kr/board.es?act=view&bid=0027&list_no=1485191&mid=a10503010300&nPage=19&tag=", type: "official-context", publishedOrObservedAt: null, importedAt: "2026-08-26", liveCheckedAt: null, verificationState: "report-linked", sponsorship: "organic-official", rightsMode: "link-only" },
    ],
    sourceVerification: "report-linked", placeEdgeVerification: "pending", sponsorship: "unknown", rightsMode: "link-only", researchRecordedAt: "2026-08-24", pulseEligible: false,
  },
  {
    id: "C08",
    title: { en: "Twenty Korean-supermarket gifts picked in Japan", ko: "일본 잡지가 고른 한국 슈퍼 선물 20", ja: "日本の雑誌が選ぶ韓国スーパー土産20" },
    jaHook: "日本の雑誌が選んだ『韓国スーパー土産20』",
    cityIds: ["seoul"],
    sourceReferences: [{ label: "Hanako 2026", url: "https://hanako.tokyo/food/504388/", type: "editorial", publishedOrObservedAt: null, importedAt: "2026-08-26", liveCheckedAt: null, verificationState: "report-linked", sponsorship: "unknown", rightsMode: "link-only" }],
    sourceVerification: "report-linked", placeEdgeVerification: "pending", sponsorship: "unknown", rightsMode: "link-only", researchRecordedAt: "2026-08-24", pulseEligible: false,
  },
  {
    id: "C12",
    title: { en: "A Netflix chef-restaurant pilgrimage", ko: "Netflix 셰프 식당 성지순례", ja: "Netflixシェフの店を巡る旅" },
    jaHook: "『白と黒のスプーン』出演シェフ店巡礼",
    cityIds: ["seoul"],
    sourceReferences: [
      { label: "Hanako 2025", url: "https://hanako.tokyo/tags/202504-special-korea/", type: "editorial", publishedOrObservedAt: "2025-04-01", importedAt: "2026-08-26", liveCheckedAt: null, verificationState: "report-linked", sponsorship: "unknown", rightsMode: "link-only" },
      { label: "Korea Tourism Data Lab", url: "https://datalab.visitkorea.or.kr/site/portal/ex/bbs/View.do?bcIdx=310879&cateCont=omt03&cbIdx=1132&pageIndex=1", type: "official-context", publishedOrObservedAt: null, importedAt: "2026-08-26", liveCheckedAt: null, verificationState: "report-linked", sponsorship: "organic-official", rightsMode: "link-only" },
    ],
    sourceVerification: "report-linked", placeEdgeVerification: "pending", sponsorship: "unknown", rightsMode: "link-only", researchRecordedAt: "2026-08-24", pulseEligible: false,
  },
  {
    id: "C18",
    title: { en: "Step into Jeju's When Life Gives You Tangerines", ko: "〈폭싹 속았수다〉 제주 장면 속으로", ja: "『おつかれさま』の済州ロケ地へ" },
    jaHook: "『おつかれさま』の済州へ",
    editorialMedia: {
      src: "/editorial/japan-first-c18-jeju-screen-route.jpg",
      alt: {
        en: "Editorial Jeju landscape with tangerines, stone walls and the sea",
        ko: "귤과 돌담, 바다로 구성한 제주 촬영지 편집 이미지",
        ja: "みかん、石垣、海で構成した済州ロケ地の編集画像",
      },
      credit: { en: "K-Tour ID original editorial illustration", ko: "K-Tour ID 오리지널 편집 이미지", ja: "K-Tour ID 編集イラスト" },
      rightsMode: "ondo-original",
    },
    cityIds: ["jeju"],
    sourceReferences: [{ label: "VISITKOREA Japanese", url: "https://japanese.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=222180", type: "official-tourism", publishedOrObservedAt: null, importedAt: "2026-08-26", liveCheckedAt: null, verificationState: "report-linked", sponsorship: "organic-official", rightsMode: "link-only" }],
    sourceVerification: "report-linked", placeEdgeVerification: "verified", sponsorship: "organic-official", rightsMode: "link-only", researchRecordedAt: "2026-08-24", pulseEligible: false,
  },
  {
    id: "C20",
    title: { en: "Follow K-pop stars through Jeju", ko: "K-pop 스타가 먹고 머문 제주", ja: "K-popスターが巡った済州" },
    jaHook: "K-popスターが巡った済州",
    editorialMedia: {
      src: "/editorial/japan-first-c20-jeju-kpop-route.jpg",
      alt: {
        en: "Editorial Jeju coastal route with music and performance motifs",
        ko: "음악과 공연 모티프를 담은 제주 해안 여행 편집 이미지",
        ja: "音楽とステージのモチーフを配した済州海岸ルートの編集画像",
      },
      credit: { en: "K-Tour ID original editorial illustration", ko: "K-Tour ID 오리지널 편집 이미지", ja: "K-Tour ID 編集イラスト" },
      rightsMode: "ondo-original",
    },
    cityIds: ["jeju"],
    sourceReferences: [{ label: "VISITKOREA Japanese", url: "https://japanese.visitkorea.or.kr/svc/whereToGo/hdrdslt/hdrdsltView.do?crsSn=372386", type: "official-tourism", publishedOrObservedAt: null, importedAt: "2026-08-26", liveCheckedAt: null, verificationState: "report-linked", sponsorship: "organic-official", rightsMode: "link-only" }],
    sourceVerification: "report-linked", placeEdgeVerification: "verified", sponsorship: "organic-official", rightsMode: "link-only", researchRecordedAt: "2026-08-24", pulseEligible: false,
  },
  {
    id: "C22",
    title: { en: "Fact-check the Nolan family Korea list", ko: "Nolan Korea List 팩트체크", ja: "ノーラン一家の韓国リストを検証" },
    jaHook: "ノーラン一家の韓国リストを検証",
    cityIds: ["seoul"],
    sourceReferences: [
      { label: "Unedited interview", url: "https://www.youtube.com/watch?v=2QGqdzpcGE0", type: "original-creator", publishedOrObservedAt: null, importedAt: "2026-08-26", liveCheckedAt: null, verificationState: "report-linked", sponsorship: "unknown", rightsMode: "link-only" },
      { label: "Yonhap 2026-08-03", url: "https://www.yna.co.kr/view/AKR20260803065651005", type: "secondary-reporting", publishedOrObservedAt: "2026-08-03", importedAt: "2026-08-26", liveCheckedAt: null, verificationState: "report-linked", sponsorship: "unknown", rightsMode: "link-only" },
      { label: "Edaily 2026-08-04", url: "https://en.edaily.co.kr/news/eda202608045876/", type: "secondary-reporting", publishedOrObservedAt: "2026-08-04", importedAt: "2026-08-26", liveCheckedAt: null, verificationState: "report-linked", sponsorship: "unknown", rightsMode: "link-only" },
    ],
    sourceVerification: "report-linked", placeEdgeVerification: "pending", sponsorship: "unknown", rightsMode: "link-only", researchRecordedAt: "2026-08-24", pulseEligible: false,
  },
])

type JejuEditorialSeedBaseB = {
  id: `jeju-${string}`
  cityId: "jeju"
  name: { en: string; ko: string; ja: string }
  category: "screen-location" | "food" | "market" | "culture-shopping"
  priority: "P0" | "P1"
  sourceType: "editorial-research"
  sourceLabel: "VISITKOREA Japanese"
  sourceCollection: { en: string; ko: string; ja: string }
  sourceUrl: string
  publishedOrObservedAt: string | null
  importedAt: "2026-08-26"
  liveCheckedAt: string | null
  sourceVerification: "report-linked" | "place-page-verified"
  researchRecordedAt: "2026-08-24"
  sponsorship: "organic-official"
  rightsMode: "link-only"
  canonicalVenueId: null
  officialRecordCount: null
}

export type EditorialPlaceB = JejuEditorialSeedBaseB & {
  kind: "editorial-place"
  placeEdgeVerification: "verified"
  sourceVerification: "place-page-verified"
  liveCheckedAt: "2026-08-28"
  placeSourceUrl: string
  placeSourceLabel: "VISITKOREA"
  address: { en: string; ko: string }
  location: {
    latitude: number
    longitude: number
    crs: "EPSG:4326"
    coordinateSource: "VISITKOREA_EMBEDDED_MAP"
    verifiedAt: "2026-08-28"
  }
  storyIds: readonly Extract<JapanFirstContentIdB, "C18" | "C20">[]
  officialRecord: false
  pulseEligible: false
}

export type JejuEditorialSeedB = EditorialPlaceB | (JejuEditorialSeedBaseB & {
  kind: "editorial-place-candidate"
  placeEdgeVerification: "pending"
})

const JEJU_SCREEN_SOURCE = "https://japanese.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=222180"
const JEJU_STAR_SOURCE = "https://japanese.visitkorea.or.kr/svc/whereToGo/hdrdslt/hdrdsltView.do?crsSn=372386"
const JEJU_CULTURE_SOURCE = "https://japanese.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=1592039"
const JEJU_HAENYEO_SOURCE = "https://japanese.visitkorea.or.kr/svc/contents/contentsView.do?menuSn=352&vcontsId=187785"
const jejuTruth = (sourceUrl: string, sourceCollection: { en: string; ko: string; ja: string }) => ({ sourceType: "editorial-research" as const, sourceLabel: "VISITKOREA Japanese" as const, sourceCollection, sourceUrl, publishedOrObservedAt: null, importedAt: "2026-08-26" as const, researchRecordedAt: "2026-08-24" as const, sponsorship: "organic-official" as const, rightsMode: "link-only" as const, canonicalVenueId: null, officialRecordCount: null })

const verifiedJejuPlace = (input: Omit<EditorialPlaceB, keyof ReturnType<typeof jejuTruth> | "kind" | "cityId" | "sourceVerification" | "liveCheckedAt" | "placeEdgeVerification" | "placeSourceLabel" | "officialRecord" | "pulseEligible"> & { sourceUrl: string; sourceCollection: { en: string; ko: string; ja: string } }): EditorialPlaceB => ({
  kind: "editorial-place",
  cityId: "jeju",
  ...jejuTruth(input.sourceUrl, input.sourceCollection),
  ...input,
  sourceVerification: "place-page-verified",
  liveCheckedAt: "2026-08-28",
  placeEdgeVerification: "verified",
  placeSourceLabel: "VISITKOREA",
  officialRecord: false,
  pulseEligible: false,
})

const pendingJejuPlace = (input: Pick<JejuEditorialSeedBaseB, "id" | "name" | "category" | "priority"> & { sourceUrl: string; sourceCollection: { en: string; ko: string; ja: string } }): JejuEditorialSeedB => ({
  kind: "editorial-place-candidate",
  cityId: "jeju",
  ...input,
  ...jejuTruth(input.sourceUrl, input.sourceCollection),
  liveCheckedAt: null,
  sourceVerification: "report-linked",
  placeEdgeVerification: "pending",
})

export const JEJU_EDITORIAL_SEEDS: readonly JejuEditorialSeedB[] = Object.freeze([
  verifiedJejuPlace({ id: "jeju-seongsan-ilchulbong", name: { en: "Seongsan Ilchulbong Tuff Cone", ko: "성산일출봉", ja: "城山日出峰" }, category: "screen-location", priority: "P0", sourceUrl: JEJU_SCREEN_SOURCE, sourceCollection: { en: "Jeju screen locations", ko: "제주 촬영지 모음", ja: "済州ロケ地コレクション" }, placeSourceUrl: "https://english.visitkorea.or.kr/svc/whereToGo/locIntrdn/rgnContentsView.do?vcontsId=110731", address: { en: "284-12 Ilchul-ro, Seogwipo-si, Jeju-do", ko: "제주특별자치도 서귀포시 성산읍 일출로 284-12" }, location: { latitude: 33.4580801942424, longitude: 126.941500386507, crs: "EPSG:4326", coordinateSource: "VISITKOREA_EMBEDDED_MAP", verifiedAt: "2026-08-28" }, storyIds: ["C18"] }),
  verifiedJejuPlace({ id: "jeju-gwangchigi-beach", name: { en: "Gwangchigi Beach", ko: "광치기해변", ja: "クァンチギ海岸" }, category: "screen-location", priority: "P0", sourceUrl: JEJU_SCREEN_SOURCE, sourceCollection: { en: "Jeju screen locations", ko: "제주 촬영지 모음", ja: "済州ロケ地コレクション" }, placeSourceUrl: "https://english.visitkorea.or.kr/svc/contents/contentsView.do?menuSn=351&vcontsId=222094", address: { en: "Goseong-ri, Seongsan-eup, Seogwipo-si, Jeju-do", ko: "제주특별자치도 서귀포시 성산읍 고성리 224-33" }, location: { latitude: 33.452277804193, longitude: 126.923932706058, crs: "EPSG:4326", coordinateSource: "VISITKOREA_EMBEDDED_MAP", verifiedAt: "2026-08-28" }, storyIds: ["C18"] }),
  verifiedJejuPlace({ id: "jeju-gwaneumsa", name: { en: "Gwaneumsa Temple (Jeju)", ko: "관음사(제주)", ja: "観音寺（済州）" }, category: "screen-location", priority: "P0", sourceUrl: JEJU_SCREEN_SOURCE, sourceCollection: { en: "Jeju screen locations", ko: "제주 촬영지 모음", ja: "済州ロケ地コレクション" }, placeSourceUrl: "https://english.visitkorea.or.kr/svc/whereToGo/locIntrdn/rgnContentsView.do?vcontsId=90109", address: { en: "660 Sallokbuk-ro, Jeju-si, Jeju-do", ko: "제주특별자치도 제주시 산록북로 660" }, location: { latitude: 33.4237307637202, longitude: 126.558131212009, crs: "EPSG:4326", coordinateSource: "VISITKOREA_EMBEDDED_MAP", verifiedAt: "2026-08-28" }, storyIds: ["C18"] }),
  verifiedJejuPlace({ id: "jeju-donsadon", name: { en: "Donsadon Main Store", ko: "돈사돈 본점", ja: "トンサドン本店" }, category: "food", priority: "P0", sourceUrl: JEJU_STAR_SOURCE, sourceCollection: { en: "Jeju K-pop route", ko: "제주 K-pop 여행 코스", ja: "済州K-popルート" }, placeSourceUrl: "https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=53559", address: { en: "19 Upyeong-ro, Jeju-si, Jeju-do", ko: "제주특별자치도 제주시 우평로 19" }, location: { latitude: 33.4788811707717, longitude: 126.464058148407, crs: "EPSG:4326", coordinateSource: "VISITKOREA_EMBEDDED_MAP", verifiedAt: "2026-08-28" }, storyIds: ["C20"] }),
  verifiedJejuPlace({ id: "jeju-oneunjeong-gimbap", name: { en: "Oneunjeong Gimbap", ko: "오는정김밥", ja: "オヌンジョンキンパ" }, category: "food", priority: "P0", sourceUrl: JEJU_STAR_SOURCE, sourceCollection: { en: "Jeju K-pop route", ko: "제주 K-pop 여행 코스", ja: "済州K-popルート" }, placeSourceUrl: "https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=199581", address: { en: "2 Dongmundong-ro, Seogwipo-si, Jeju-do", ko: "제주특별자치도 서귀포시 동문동로 2" }, location: { latitude: 33.249619622742216, longitude: 126.56757861250604, crs: "EPSG:4326", coordinateSource: "VISITKOREA_EMBEDDED_MAP", verifiedAt: "2026-08-28" }, storyIds: ["C20"] }),
  pendingJejuPlace({ id: "jeju-tamura", name: { en: "TaMuRa", ko: "TaMuRa", ja: "TaMuRa" }, category: "food", priority: "P1", sourceUrl: JEJU_STAR_SOURCE, sourceCollection: { en: "Jeju K-pop route", ko: "제주 K-pop 여행 코스", ja: "済州K-popルート" } }),
  pendingJejuPlace({ id: "jeju-sogil-byeolha", name: { en: "Sogil Byeolha", ko: "소길별하", ja: "ソギルビョルハ" }, category: "culture-shopping", priority: "P0", sourceUrl: JEJU_STAR_SOURCE, sourceCollection: { en: "Jeju K-pop route", ko: "제주 K-pop 여행 코스", ja: "済州K-popルート" } }),
  verifiedJejuPlace({ id: "jeju-haenyeo-kitchen-bukchon", name: { en: "Haenyeo’s Kitchen Bukchon Branch", ko: "해녀의부엌 북촌점", ja: "海女の台所 北村店" }, category: "food", priority: "P0", sourceUrl: JEJU_HAENYEO_SOURCE, sourceCollection: { en: "Jeju haenyeo culture", ko: "제주 해녀 문화", ja: "済州の海女文化" }, placeSourceUrl: "https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=187159", address: { en: "31 Bukchon 9-gil, Jocheon-eup, Jeju-si, Jeju-do", ko: "제주특별자치도 제주시 북촌9길 31 북촌리어촌계" }, location: { latitude: 33.5498765904388, longitude: 126.693440739934, crs: "EPSG:4326", coordinateSource: "VISITKOREA_EMBEDDED_MAP", verifiedAt: "2026-08-28" }, storyIds: [] }),
  verifiedJejuPlace({ id: "jeju-dongmun-market", name: { en: "Dongmun Traditional Market", ko: "동문재래시장", ja: "済州東門市場" }, category: "market", priority: "P1", sourceUrl: JEJU_CULTURE_SOURCE, sourceCollection: { en: "Jeju culture and markets", ko: "제주 문화와 시장", ja: "済州の文化と市場" }, placeSourceUrl: "https://english.visitkorea.or.kr/svc/whereToGo/locIntrdn/rgnContentsView.do?vcontsId=91650", address: { en: "20 Gwandeok-ro 14-gil, Jeju-si, Jeju-do", ko: "제주특별자치도 제주시 관덕로14길 20" }, location: { latitude: 33.5115311377898, longitude: 126.526046080257, crs: "EPSG:4326", coordinateSource: "VISITKOREA_EMBEDDED_MAP", verifiedAt: "2026-08-28" }, storyIds: [] }),
  verifiedJejuPlace({ id: "jeju-seogwipo-olle-market", name: { en: "Seogwipo Maeil Olle Market", ko: "서귀포매일올레시장", ja: "西帰浦毎日オルレ市場" }, category: "market", priority: "P1", sourceUrl: JEJU_CULTURE_SOURCE, sourceCollection: { en: "Jeju culture and markets", ko: "제주 문화와 시장", ja: "済州の文化と市場" }, placeSourceUrl: "https://english.visitkorea.or.kr/svc/whereToGo/locIntrdn/rgnContentsView.do?vcontsId=90960", address: { en: "18 Jungang-ro 62beon-gil, Seogwipo-si, Jeju-do", ko: "제주특별자치도 서귀포시 서귀동 340" }, location: { latitude: 33.2501482431274, longitude: 126.563223568437, crs: "EPSG:4326", coordinateSource: "VISITKOREA_EMBEDDED_MAP", verifiedAt: "2026-08-28" }, storyIds: [] }),
])

export const JEJU_EDITORIAL_PLACES: readonly EditorialPlaceB[] = Object.freeze(
  JEJU_EDITORIAL_SEEDS.filter((item): item is EditorialPlaceB => item.kind === "editorial-place"),
)

function editorialDistanceInMeters(left: EditorialPlaceB, right: EditorialPlaceB) {
  const radians = (degrees: number) => degrees * Math.PI / 180
  const latitudeDelta = radians(right.location.latitude - left.location.latitude)
  const longitudeDelta = radians(right.location.longitude - left.location.longitude)
  const leftLatitude = radians(left.location.latitude)
  const rightLatitude = radians(right.location.latitude)
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(leftLatitude) * Math.cos(rightLatitude) * Math.sin(longitudeDelta / 2) ** 2
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

export function jejuEditorialCoverageIntensity(place: EditorialPlaceB): JejuEditorialCoverageIntensityB {
  const nearbyVerifiedPlaces = JEJU_EDITORIAL_PLACES.filter((candidate) => editorialDistanceInMeters(place, candidate) <= 13_000).length
  if (nearbyVerifiedPlaces >= 3) return "dense"
  if (nearbyVerifiedPlaces >= 2) return "clustered"
  return "sparse"
}

export function jejuEditorialCoverageSummary(place: EditorialPlaceB, locale: "en" | "ko" | "ja", temperatureName: string) {
  const intensity = jejuEditorialCoverageIntensity(place)
  return `${temperatureName} · ${JEJU_EDITORIAL_COVERAGE_LABEL[locale]}: ${JEJU_EDITORIAL_COVERAGE_INTENSITY_LABEL[intensity][locale]} · ${JEJU_EDITORIAL_UNSCORED_LABEL[locale]}`
}

const editorialPlaceIds = new Set<string>(JEJU_EDITORIAL_PLACES.map((place) => place.id))

export function isEditorialPlaceId(value: unknown): value is EditorialPlaceB["id"] {
  return typeof value === "string" && editorialPlaceIds.has(value)
}

export function editorialPlaceById(value: unknown) {
  return isEditorialPlaceId(value) ? JEJU_EDITORIAL_PLACES.find((place) => place.id === value) : undefined
}

export function sanitizeEditorialPlaceIds(value: unknown): EditorialPlaceB["id"][] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter(isEditorialPlaceId))]
}

export function editorialPlacesForStory(storyId: JapanFirstContentIdB) {
  return JEJU_EDITORIAL_PLACES.filter((place) => place.storyIds.includes(storyId as Extract<JapanFirstContentIdB, "C18" | "C20">))
}
