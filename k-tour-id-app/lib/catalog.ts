import type { Identity, KPassCapsule, LocalizedText, MarketplaceItem, Session, UserType, Voucher } from "@/lib/types"

export interface PersonaConfig {
  heroImage: string
  heroPosition: string
  label: LocalizedText
  shortLabel: LocalizedText
  verification: LocalizedText
  value: LocalizedText
  completionTitle: LocalizedText
  completionBody: LocalizedText
  homeContext: LocalizedText
  homeHeadline: LocalizedText
  homeBody: LocalizedText
  primaryCta: LocalizedText
  balanceLabel: LocalizedText
  statusDetail: LocalizedText
  firstItemId: string
}

export const PERSONA_CONFIG: Record<UserType, PersonaConfig> = {
  foreigner: {
    heroImage: "/seoul-after-rain-hero.jpg",
    heroPosition: "58% 54%",
    label: { ko: "해외에서 한국을 단기 방문했어요", en: "I'm a short-term visitor from abroad" },
    shortLabel: { ko: "단기 해외 방문자", en: "Overseas visitor" },
    verification: { ko: "여권으로 확인", en: "Verify with passport" },
    value: { ko: "여행자 할인 · 교통 · 체험", en: "Visitor savings · transit · experiences" },
    completionTitle: { ko: "90일 K-Tour ID 이용이\n준비됐어요.", en: "Your 90-day K-Tour ID\nis ready." },
    completionBody: { ko: "여행자 혜택과 영어로 이용 가능한 체험을 먼저 골라두었어요.", en: "We selected visitor benefits and English-friendly experiences for you." },
    homeContext: { ko: "서울에서 이용 중", en: "Active in Seoul" },
    homeHeadline: { ko: "낯선 곳에서도,\n가볍게 증명하세요.", en: "Prove less.\nTravel more." },
    homeBody: { ko: "오늘 바로 쓸 수 있는 여행자 혜택을 골랐어요.", en: "A few visitor benefits are ready for today." },
    primaryCta: { ko: "오늘의 여행자 혜택 보기", en: "See today's visitor benefit" },
    balanceLabel: { ko: "여행 잔액", en: "Travel balance" },
    statusDetail: { ko: "여행 기간", en: "Trip period" },
    firstItemId: "bukchon-workshop",
  },
  "long-term": {
    heroImage: "/editorial-seoul-transit.jpg",
    heroPosition: "52% 50%",
    label: { ko: "한국에 거주하는 외국인이에요", en: "I'm a foreign resident in Korea" },
    shortLabel: { ko: "거주 외국인", en: "Foreign resident" },
    verification: { ko: "외국인등록증으로 확인", en: "Verify with residence card" },
    value: { ko: "생활 교통 · 배달 · 일상 혜택", en: "Everyday transit · delivery · local savings" },
    completionTitle: { ko: "서울의 일상이\n조금 더 가벼워졌어요.", en: "Everyday Seoul\njust got easier." },
    completionBody: { ko: "출퇴근과 생활 서비스에서 바로 쓸 수 있는 혜택을 준비했어요.", en: "Everyday transit and neighborhood services are ready for you." },
    homeContext: { ko: "서울에서 이어가는 일상", en: "Everyday life in Seoul" },
    homeHeadline: { ko: "오늘의 생활을,\n조금 더 가볍게.", en: "Make everyday life\na little lighter." },
    homeBody: { ko: "교통과 동네 생활에서 지금 쓸 수 있는 선택이에요.", en: "Useful choices for transit and neighborhood life today." },
    primaryCta: { ko: "오늘 쓸 생활 혜택 보기", en: "See today's living benefits" },
    balanceLabel: { ko: "여행 잔액", en: "Travel balance" },
    statusDetail: { ko: "생활형", en: "Resident" },
    firstItemId: "seoul-transit-30",
  },
  korean: {
    heroImage: "/editorial-regional-craft.jpg",
    heroPosition: "54% 50%",
    label: { ko: "대한민국 국민으로 국내 여행 중이에요", en: "I'm a Korean citizen traveling locally" },
    shortLabel: { ko: "대한민국 국민", en: "Korean citizen" },
    verification: { ko: "모바일 신분증으로 확인", en: "Verify with Mobile ID" },
    value: { ko: "지역 문화 · 모빌리티 · 로컬 혜택", en: "Regional culture · mobility · local offers" },
    completionTitle: { ko: "익숙한 지역을\n더 깊게 만나요.", en: "Discover familiar places\nmore deeply." },
    completionBody: { ko: "이번 여행지의 문화 프로그램과 지역 혜택을 골라두었어요.", en: "Regional programs and destination benefits are ready for this trip." },
    homeContext: { ko: "이번 국내 여행", en: "This domestic trip" },
    homeHeadline: { ko: "익숙한 곳을,\n새로운 시선으로.", en: "See a familiar place\nwith fresh eyes." },
    homeBody: { ko: "지역에서만 만날 수 있는 문화와 이동 혜택이에요.", en: "Local culture and mobility benefits selected for this trip." },
    primaryCta: { ko: "이번 여행지 혜택 보기", en: "See destination benefits" },
    balanceLabel: { ko: "여행 잔액", en: "Travel balance" },
    statusDetail: { ko: "이번 주말", en: "This weekend" },
    firstItemId: "regional-craft-day",
  },
}

export const MARKETPLACE_ITEMS: MarketplaceItem[] = [
  {
    id: "bukchon-workshop",
    category: "experience",
    service: "reservation",
    title: { ko: "북촌 자개 공예, 저녁 클래스", en: "Evening mother-of-pearl workshop" },
    description: { ko: "비 온 뒤 북촌의 한옥 공방에서 자개 조각을 골라 작은 생활 소품을 완성해요.", en: "Choose luminous shell pieces and finish a small keepsake in a quiet Bukchon hanok studio." },
    location: { ko: "서울 북촌", en: "Bukchon, Seoul" },
    geo: { latitude: 37.5826, longitude: 126.983 },
    availability: { ko: "오늘 18:30 · 4자리", en: "Today 18:30 · 4 spots" },
    duration: { ko: "약 90분", en: "About 90 min" },
    fulfilment: "booking",
    fulfilmentLabel: { ko: "예약 후 모바일 입장권", en: "Mobile ticket after booking" },
    cancellation: { ko: "체험 시작 전까지 무료 취소", en: "Free cancellation until the workshop starts" },
    languageLabels: ["한국어", "English"],
    merchant: "Bukchon Craft House",
    image: "/seoul-after-rain-hero.jpg",
    priceKRW: 50_000,
    rating: 4.9,
    options: [
      { id: "today-1830", label: { ko: "오늘 18:30", en: "Today 18:30" }, available: true },
      { id: "tomorrow-1400", label: { ko: "내일 14:00", en: "Tomorrow 14:00" }, available: true },
    ],
    eligibleUserTypes: ["foreigner"],
    featuredFor: ["foreigner"],
    voucherId: "voucher-bukchon-10",
    integrationMode: "simulated",
  },
  {
    id: "seoul-transit-30",
    category: "mobility",
    service: "transport",
    title: { ko: "서울 생활 교통 30일권", en: "30-day Seoul living transit pass" },
    description: { ko: "출퇴근과 일상 이동을 한 번에 준비하는 장기 체류자용 디지털 교통권이에요.", en: "A digital transit pass for everyday commuting and city travel." },
    location: { ko: "서울 전역", en: "Across Seoul" },
    geo: { latitude: 37.5665, longitude: 126.978 },
    availability: { ko: "오늘부터 사용 가능", en: "Available from today" },
    duration: { ko: "개시일로부터 30일", en: "30 days from activation" },
    fulfilment: "instant",
    fulfilmentLabel: { ko: "결제 후 ID·지갑에 즉시 발급", en: "Issued to ID · Wallet after payment" },
    cancellation: { ko: "개시 전 전액 취소 · 개시 후 잔여일 기준", en: "Full refund before activation; prorated after" },
    languageLabels: ["한국어", "English"],
    merchant: "Seoul Living Mobility",
    image: "/editorial-seoul-transit.jpg",
    priceKRW: 65_000,
    rating: 4.8,
    options: [
      { id: "start-today", label: { ko: "오늘 개시", en: "Start today" }, available: true },
      { id: "start-monday", label: { ko: "월요일 개시", en: "Start Monday" }, available: true },
    ],
    eligibleUserTypes: ["long-term"],
    featuredFor: ["long-term"],
    voucherId: "voucher-resident-transit",
    integrationMode: "simulated",
  },
  {
    id: "regional-craft-day",
    category: "experience",
    service: "reservation",
    title: { ko: "수원 한옥 공예의 날", en: "Suwon hanok craft day" },
    description: { ko: "지역 장인과 함께 작은 매듭 소품을 만들고 오래된 골목의 이야기를 들어요.", en: "Make a small knot craft with a local artisan and hear stories of the old neighborhood." },
    location: { ko: "수원 행궁동", en: "Haenggung-dong, Suwon" },
    geo: { latitude: 37.2851, longitude: 127.014 },
    availability: { ko: "토요일 15:00 · 6자리", en: "Saturday 15:00 · 6 spots" },
    duration: { ko: "약 2시간", en: "About 2 hours" },
    fulfilment: "booking",
    fulfilmentLabel: { ko: "예약 후 지역 프로그램 입장 QR", en: "Regional program entry QR" },
    cancellation: { ko: "이용 48시간 전까지 무료 취소", en: "Free cancellation until 48 hours before" },
    languageLabels: ["한국어"],
    merchant: "Suwon Local Culture Lab",
    image: "/editorial-regional-craft.jpg",
    priceKRW: 35_000,
    rating: 4.9,
    options: [
      { id: "sat-1500", label: { ko: "토요일 15:00", en: "Saturday 15:00" }, available: true },
      { id: "sun-1100", label: { ko: "일요일 11:00", en: "Sunday 11:00" }, available: true },
    ],
    eligibleUserTypes: ["korean"],
    featuredFor: ["korean"],
    voucherId: "voucher-local-culture",
    integrationMode: "simulated",
  },
  {
    id: "neighborhood-meal",
    category: "food",
    service: "delivery",
    title: { ko: "연희동 오늘의 집밥", en: "Yeonhui neighborhood supper" },
    description: { ko: "동네 부엌에서 오늘 만든 반찬과 따뜻한 국을 원하는 시간에 받아요.", en: "A warm soup and seasonal side dishes prepared today by a neighborhood kitchen." },
    location: { ko: "서울 서대문구 · 배달", en: "Seodaemun, Seoul · delivery" },
    geo: { latitude: 37.5689, longitude: 126.929 },
    availability: { ko: "주문 후 약 35분 도착", en: "Arrives about 35 min after ordering" },
    duration: { ko: "약 35분", en: "About 35 min" },
    fulfilment: "delivery",
    fulfilmentLabel: { ko: "문 앞 배달 · 주소 확인 필요", en: "Door delivery · address required" },
    cancellation: { ko: "조리 시작 전 무료 취소", en: "Free cancellation before preparation" },
    languageLabels: ["한국어", "English"],
    merchant: "Yeonhui Table",
    image: "/editorial-neighborhood-meal.jpg",
    priceKRW: 24_000,
    rating: 4.8,
    options: [
      { id: "one-person", label: { ko: "1인 저녁상", en: "Supper for one" }, available: true },
      { id: "two-person", label: { ko: "2인 저녁상", en: "Supper for two" }, priceDeltaKRW: 18_000, available: true },
    ],
    eligibleUserTypes: ["foreigner", "long-term", "korean"],
    featuredFor: ["long-term", "foreigner"],
    integrationMode: "simulated",
  },
  {
    id: "euljiro-design-pickup",
    category: "shopping",
    service: "shopping",
    title: { ko: "을지로 디자인 마켓 픽업", en: "Euljiro design-market pickup" },
    description: { ko: "서울의 작은 스튜디오가 만든 포스터와 생활 소품을 골라 매장에서 바로 받아요.", en: "Choose a print and small design object from independent Seoul studios, ready for store pickup." },
    location: { ko: "서울 을지로", en: "Euljiro, Seoul" },
    geo: { latitude: 37.566, longitude: 126.991 },
    availability: { ko: "다음 20:00 픽업 마감", en: "Next pickup closes at 20:00" },
    duration: { ko: "약 10분", en: "About 10 min" },
    fulfilment: "pickup",
    fulfilmentLabel: { ko: "결제 후 매장 픽업 번호 발급", en: "Store pickup number after payment" },
    cancellation: { ko: "픽업 준비 전 무료 취소", en: "Free cancellation before pickup preparation" },
    languageLabels: ["한국어", "English"],
    merchant: "Euljiro Design Market",
    image: "/korean-pop-merchandise.png",
    priceKRW: 35_000,
    rating: 4.7,
    options: [{ id: "pickup-today", label: { ko: "오늘 픽업", en: "Pickup today" }, available: true }],
    eligibleUserTypes: ["foreigner"],
    featuredFor: ["foreigner"],
    voucherId: "voucher-welcome-10",
    integrationMode: "simulated",
  },
  {
    id: "insadong-tea",
    category: "experience",
    service: "reservation",
    title: { ko: "인사동 저녁 차회", en: "Insadong evening tea gathering" },
    description: { ko: "작은 찻방에서 계절 차 세 가지와 다식을 천천히 맛봐요.", en: "Taste three seasonal teas and small sweets in an intimate tea room." },
    location: { ko: "서울 인사동", en: "Insadong, Seoul" },
    geo: { latitude: 37.574, longitude: 126.985 },
    availability: { ko: "내일 17:00 · 3자리", en: "Tomorrow 17:00 · 3 spots" },
    duration: { ko: "약 60분", en: "About 60 min" },
    fulfilment: "booking",
    fulfilmentLabel: { ko: "예약 확정 후 모바일 안내", en: "Mobile instructions after booking" },
    cancellation: { ko: "이용 24시간 전까지 무료 취소", en: "Free cancellation until 24 hours before" },
    languageLabels: ["한국어", "English"],
    merchant: "Insadong Tea Room",
    image: "/korean-tea-ceremony.png",
    priceKRW: 28_000,
    rating: 4.7,
    options: [{ id: "tomorrow-1700", label: { ko: "내일 17:00", en: "Tomorrow 17:00" }, available: true }],
    eligibleUserTypes: ["foreigner", "long-term", "korean"],
    featuredFor: ["korean", "foreigner"],
    integrationMode: "simulated",
  },
]

const PERSONA_VOUCHERS: Record<UserType, Voucher[]> = {
  foreigner: [
    {
      id: "voucher-bukchon-10", title: "Bukchon visitor workshop · 10%", partner: "Bukchon Craft House",
      valueKRW: 5_000, expiresAt: "2026-11-01T23:59:59+09:00", status: "available", eligibilityClaim: "visitorEligibility",
      funding: "municipal-campaign", applicableMerchant: "Bukchon Craft House", applicableService: "reservation",
      minimumSpendKRW: 50_000, redemption: "single-use", campaignId: "CAM-BUKCHON-2026-07", eligibleUserTypes: ["foreigner"], itemId: "bukchon-workshop",
    },
    {
      id: "voucher-welcome-10", title: "K-Tour ID welcome coupon", partner: "K-Tour ID partner network",
      valueKRW: 10_000, expiresAt: "2026-11-01T23:59:59+09:00", status: "available", eligibilityClaim: "couponUnused",
      funding: "partner-funded", applicableMerchant: "Euljiro Design Market", applicableService: "shopping",
      minimumSpendKRW: 30_000, redemption: "single-use", campaignId: "CAM-WELCOME-2026-Q3", eligibleUserTypes: ["foreigner"], itemId: "euljiro-design-pickup",
    },
  ],
  "long-term": [
    {
      id: "voucher-resident-transit", title: "Resident mobility welcome · ₩5,000", partner: "Seoul Living Mobility",
      valueKRW: 5_000, expiresAt: "2026-10-31T23:59:59+09:00", status: "available", eligibilityClaim: "couponUnused",
      funding: "municipal-campaign", applicableMerchant: "Seoul Living Mobility", applicableService: "transport",
      minimumSpendKRW: 65_000, redemption: "single-use", campaignId: "CAM-SEOUL-LIFE-2026", eligibleUserTypes: ["long-term"], itemId: "seoul-transit-30",
    },
  ],
  korean: [
    {
      id: "voucher-local-culture", title: "Regional culture week · ₩7,000", partner: "Suwon Local Culture Lab",
      valueKRW: 7_000, expiresAt: "2026-10-31T23:59:59+09:00", status: "available", eligibilityClaim: "couponUnused",
      funding: "municipal-campaign", applicableMerchant: "Suwon Local Culture Lab", applicableService: "reservation",
      minimumSpendKRW: 35_000, redemption: "single-use", campaignId: "CAM-SUWON-CULTURE-2026", eligibleUserTypes: ["korean"], itemId: "regional-craft-day",
    },
  ],
}

export const PERSONA_BALANCES: Record<UserType, number> = {
  foreigner: 420_000,
  "long-term": 186_500,
  korean: 238_000,
}

export function demoSessionForUserType(userType: UserType): Session {
  const identityByType: Record<UserType, Identity> = {
    foreigner: { method: "passport-did", displayName: "Daniel Miller", nationality: "United States", nationalityFlag: "🇺🇸", photoUrl: "/portraits/daniel-v2.jpg", verified: true, did: "did:omn:z6Mk-demo-visitor" },
    "long-term": { method: "foreigner-id", displayName: "Nguyen Van An", nationality: "Viet Nam", nationalityFlag: "🇻🇳", photoUrl: "/portraits/nguyen-v2.jpg", verified: true, did: "did:omn:z6Mk-demo-resident" },
    korean: { method: "mobile-id", displayName: "김민준", nationality: "Republic of Korea", nationalityFlag: "🇰🇷", photoUrl: "/portraits/minjun-v3.jpg", verified: true, did: "did:omn:z6Mk-demo-domestic" },
  }
  const identity = identityByType[userType]
  const capsule: KPassCapsule = {
    id: `kpass:demo-${userType}`,
    holderName: identity.displayName,
    userType,
    did: identity.did,
    issuedAt: "2026-08-01T09:00:00+09:00",
    expiresAt: userType === "long-term" ? "2027-08-01T09:00:00+09:00" : userType === "korean" ? "2026-09-01T09:00:00+09:00" : "2026-10-30T09:00:00+09:00",
    stayPeriod: userType === "long-term" ? "Resident service cycle · 12 months" : userType === "korean" ? "Domestic trip · 30 days" : "Visitor service window · 90 days",
    paymentLimitKRW: userType === "long-term" ? 2_000_000 : 5_000_000,
    trustLevel: "verified",
    status: "active",
    issuer: "K-Tour ID",
    credentialType: "KTourServiceCredential",
    services: ["transport", "shopping", "delivery", "reservation", "benefit"],
    benefits: userType === "long-term"
      ? ["Everyday transit benefit", "Neighborhood service offers"]
      : userType === "korean"
        ? ["Regional culture program", "Local mobility offers"]
        : ["Visitor workshop benefit", "Travel transit offers", "Welcome coupon pack"],
  }
  return {
    onboarded: true,
    userType,
    identity,
    capsule,
    wallet: { address: `0x-demo-${userType}`, balanceKRW: PERSONA_BALANCES[userType], usdRate: 1381.7, provider: "k-tour-id", connected: true },
  }
}

export function vouchersForUserType(userType: UserType): Voucher[] {
  return PERSONA_VOUCHERS[userType].map((voucher) => ({ ...voucher, eligibleUserTypes: voucher.eligibleUserTypes ? [...voucher.eligibleUserTypes] : undefined }))
}

export function itemById(id: string): MarketplaceItem | undefined {
  return MARKETPLACE_ITEMS.find((item) => item.id === id)
}

export function itemsForUserType(userType: UserType): MarketplaceItem[] {
  const first = PERSONA_CONFIG[userType].firstItemId
  return MARKETPLACE_ITEMS
    .filter((item) => item.eligibleUserTypes.includes(userType))
    .sort((a, b) => Number(b.id === first) - Number(a.id === first) || Number(b.featuredFor.includes(userType)) - Number(a.featuredFor.includes(userType)))
}
