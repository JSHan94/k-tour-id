// Seed content for the demo. Screens read from here; nothing is hard-coded in
// components. Swap for live data once the OmniOne/payment adapters land.

import type {
  Activity,
  AppNotification,
  BenefitOffer,
  ChainEvent,
  ConnectMessage,
  Identity,
  KPassCapsule,
  Peer,
  ServiceItem,
  Session,
  Transaction,
  Voucher,
  Wallet,
} from "@/lib/types"
import { vouchersForUserType } from "@/lib/catalog"

export const USD_RATE = 1381.7

// ---- Default onboarded session (Daniel Miller, foreign tourist) ------------

export const DEFAULT_IDENTITY: Identity = {
  method: "passport-did",
  displayName: "Daniel Miller",
  nationality: "United States",
  nationalityFlag: "🇺🇸",
  photoUrl: "/portraits/daniel-v2.jpg",
  verified: true,
  did: "did:omn:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
}

export const DEFAULT_CAPSULE: KPassCapsule = {
  id: "kpass:7d2a1f9c4b3e",
  holderName: "Daniel Miller",
  userType: "foreigner",
  did: DEFAULT_IDENTITY.did,
  issuedAt: "2026-06-12T09:20:00+09:00",
  expiresAt: "2026-09-10T09:20:00+09:00",
  stayPeriod: "Service trip window · 90 days",
  paymentLimitKRW: 5_000_000,
  trustLevel: "verified",
  status: "active",
  issuer: "K-Tour ID",
  credentialType: "KTourServiceCredential",
  services: ["transport", "shopping", "delivery", "reservation", "benefit"],
  benefits: ["Visitor workshop benefit", "Transit voucher concept", "Welcome coupon pack"],
}

export const DEFAULT_WALLET: Wallet = {
  address: "0x1234567890abcdef1234567890abcdef12345678",
  balanceKRW: 1_520_768,
  usdRate: USD_RATE,
  provider: "k-tour-id",
  connected: true,
}

export const DEFAULT_SESSION: Session = {
  onboarded: true,
  userType: "foreigner",
  identity: DEFAULT_IDENTITY,
  capsule: DEFAULT_CAPSULE,
  wallet: DEFAULT_WALLET,
}

export const GUEST_SESSION: Session = {
  onboarded: false,
  userType: null,
  identity: null,
  capsule: null,
  wallet: { ...DEFAULT_WALLET, connected: false, balanceKRW: 0 },
}

// ---- Transactions (mirrors the product mockup) -----------------------------

export const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-0",
    merchant: "Starbucks",
    brand: "starbucks",
    category: "shopping",
    amountKRW: -6_300,
    date: "2026-06-22T08:15:00+09:00",
    icon: "card",
    iconBg: "#ece6da",
    chainEvent: "PaymentAuthorized",
    txHash: "0x5c2e9b7a1f4d8c6b3a0e2f5c8d1b4a7e0c3f6a9d2b5e8c1f4a7d0b3e6c9f2a5d",
  },
  {
    id: "tx-1",
    merchant: "Olive Young",
    brand: "oliveyoung",
    category: "shopping",
    amountKRW: -135_727,
    date: "2026-06-20T10:34:00+09:00",
    icon: "beauty",
    iconBg: "#f1e8e0",
    chainEvent: "PaymentAuthorized",
    txHash: "0x17c8b10c5c2142a854c869709fac7f47465e79e3ef1c11a0c6bac4f6f5c291e6",
    // dated after KPassIssued/WalletLinked (2026-06-12), before today (2026-06-23)
  },
  {
    id: "tx-2",
    merchant: "Baedal Minjok",
    brand: "baemin",
    category: "delivery",
    amountKRW: -59_505,
    date: "2026-06-19T22:34:00+09:00",
    icon: "delivery",
    iconBg: "#e7ede4",
    chainEvent: "PaymentAuthorized",
    txHash: "0xa8f2d9c7b4e1f6a3c8d5e9f2a7b4c1d8e5f2a9c6b3d0e7f4a1b8c5d2e9f6a3c0",
  },
  {
    id: "tx-3",
    merchant: "National Museum of Korea",
    brand: "museum",
    category: "reservation",
    amountKRW: -121_070,
    date: "2026-06-18T11:56:00+09:00",
    icon: "museum",
    iconBg: "#ece6da",
    chainEvent: "PaymentAuthorized",
    txHash: "0x3f7a8d2e9c6b1f4a7d0e3c6f9a2d5e8b1c4f7a0d3e6c9b2f5a8d1e4c7f0a3d6b",
  },
  {
    id: "tx-4",
    merchant: "Coupang",
    brand: "coupang",
    category: "shopping",
    amountKRW: -28_900,
    date: "2026-06-16T20:42:00+09:00",
    icon: "card",
    iconBg: "#ece6da",
    chainEvent: "PaymentAuthorized",
    txHash: "0xb8c5d2e9f6a3c0e7b4d1f8a5c2e9b6d3f0a7c4e1b8d5f2a9c6e3b0d7f4a1c8e5",
  },
]

// ---- OmniOne Chain event log (issuance + linking) --------------------------

export const DEFAULT_EVENTS: ChainEvent[] = [
  {
    id: "evt-1",
    type: "KPassIssued",
    txHash: "0x9a1c3e5f7b2d4a6c8e0f1a3c5e7b9d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2d",
    timestamp: "2026-06-12T09:20:00+09:00",
    summary: "Verifiable Credential issued · commitment recorded",
    integrationMode: "simulated",
    evidence: {
      network: "OmniOne Chain adapter · simulated",
      payloadHash: "0x9a1c3e5f7b2d4a6c8e0f1a3c5e7b9d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2d",
    },
  },
  {
    id: "evt-2",
    type: "WalletLinked",
    txHash: "0x4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2d4f6a",
    timestamp: "2026-06-12T09:21:00+09:00",
    summary: "Demo KRW travel balance linked to the K-Tour credential holder",
    integrationMode: "simulated",
    evidence: {
      network: "OmniOne Chain adapter · simulated",
      payloadHash: "0x4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2d4f6a",
    },
  },
]

/** Demo inventory. Partner/municipal funding is deliberately separated from user funds. */
export const DEFAULT_VOUCHERS: Voucher[] = [
  ...vouchersForUserType("foreigner"),
]

// ---- Home: quick actions ---------------------------------------------------

export type QuickAction = {
  key: string
  label: string
  iconKey: "topup" | "mobility" | "medical" | "sparkles"
  color: string
  bg: string
  href?: string
}

export const QUICK_ACTIONS: QuickAction[] = [
  { key: "topup", label: "Top up", iconKey: "topup", color: "var(--c-topup)", bg: "var(--c-topup-bg)" },
  { key: "mobility", label: "Mobility", iconKey: "mobility", color: "var(--c-mobility)", bg: "var(--c-mobility-bg)" },
  { key: "medical", label: "Medical", iconKey: "medical", color: "var(--c-medical)", bg: "var(--c-medical-bg)" },
  { key: "ai", label: "AI Guide", iconKey: "sparkles", color: "var(--c-game)", bg: "var(--c-game-bg)", href: "/ai" },
]

// ---- Home: service catalog -------------------------------------------------

export const SERVICE_ITEMS: ServiceItem[] = [
  // Food delivery
  { id: "f1", category: "food", name: "Korean Fried Chicken", location: "Seodaemun-gu, Seoul", priceKRW: 65_000, etaLabel: "30 min", rating: 4.9, image: "/korean-fried-chicken.png", partner: "Baemin", url: "https://www.baemin.com/" },
  { id: "f2", category: "food", name: "Tteokbokki", location: "Jung-gu, Seoul", priceKRW: 32_500, etaLabel: "20 min", rating: 4.7, image: "/korean-tteokbokki.png", partner: "Yogiyo", url: "https://www.yogiyo.co.kr/" },
  { id: "f3", category: "food", name: "Bibimbap", location: "Jongno-gu, Seoul", priceKRW: 28_000, etaLabel: "25 min", rating: 4.6, image: "/korean-bibimbap.png", partner: "Coupang Eats", url: "https://www.coupangeats.com/" },
  { id: "f4", category: "food", name: "Kimchi Jjigae", location: "Gangnam-gu, Seoul", priceKRW: 22_000, etaLabel: "35 min", rating: 4.4, image: "/korean-kimchi-stew.png", partner: "Yogiyo", url: "https://www.yogiyo.co.kr/" },
  { id: "f5", category: "food", name: "Bulgogi", location: "Itaewon, Seoul", priceKRW: 55_000, etaLabel: "40 min", rating: 4.8, image: "/korean-bulgogi.png", partner: "Baemin", url: "https://www.baemin.com/" },
  // Shopping
  { id: "s1", category: "shopping", name: "K-Beauty Set", location: "Myeongdong, Seoul", priceKRW: 85_000, etaLabel: "1 day", rating: 4.9, image: "/korean-pop-merchandise.png", partner: "Olive Young" },
  { id: "s2", category: "shopping", name: "Hanbok Rental", location: "Bukchon, Seoul", priceKRW: 45_000, etaLabel: "4 hours", rating: 4.7, image: "/traditional-korean-hanbok.png" },
  { id: "s3", category: "shopping", name: "K-Pop Merchandise", location: "Hongdae, Seoul", priceKRW: 35_000, etaLabel: "2 hours", rating: 4.8, image: "/korean-pop-merchandise.png" },
  { id: "s4", category: "shopping", name: "Korean Tea Set", location: "Insadong, Seoul", priceKRW: 120_000, etaLabel: "3 hours", rating: 4.5, image: "/korean-tea-ceremony.png" },
  // Medical
  { id: "m1", category: "medical", name: "Health Checkup", location: "Gangnam Medical Center", priceKRW: 180_000, etaLabel: "2 hours", rating: 4.9, image: "/medical-health-checkup.png" },
  { id: "m2", category: "medical", name: "Dental Cleaning", location: "Seoul Dental Clinic", priceKRW: 95_000, etaLabel: "1 hour", rating: 4.6, image: "/dental-cleaning-teeth-care.png" },
  { id: "m3", category: "medical", name: "Skin Treatment", location: "K-Beauty Clinic, Apgujeong", priceKRW: 250_000, etaLabel: "90 min", rating: 4.8, image: "/placeholder.svg" },
]

// ---- AI Benefit Router offers ----------------------------------------------

export const BENEFIT_OFFERS: BenefitOffer[] = [
  {
    id: "b1",
    title: "Olive Young 15% cashback",
    detail: "On your next K-beauty purchase in Myeongdong",
    kind: "cashback",
    valueLabel: "+₩12,000",
    reason: "You shopped beauty twice this week",
    icon: "coins",
  },
  {
    id: "b2",
    title: "Leftover demo KRW → return-trip voucher",
    detail: "Choose whether to convert projected unused ₩180,000 before departure",
    kind: "coupon",
    valueLabel: "₩180,000",
    reason: "12 days left · user-funded · returnable while unused",
    icon: "transit",
  },
  {
    id: "b3",
    title: "Gyeongbokgung Hanbok Tour NFT",
    detail: "Collectible pass + 20% photo studio discount",
    kind: "nft",
    valueLabel: "Limited",
    reason: "Popular with first-time visitors near you",
    icon: "stamp",
  },
  {
    id: "b4",
    title: "K-drama Landmark stamp tour",
    detail: "Visit 5 filming spots, earn a reward coupon",
    kind: "tour",
    valueLabel: "Earn ₩30,000",
    reason: "Matches your reservation history",
    icon: "camera",
  },
]

// Real partner brands shown in the home "where you can pay" strip
export const PARTNERS = ["baemin", "oliveyoung", "coupang", "yogiyo", "socar", "tmoney", "kakaopay", "naver"] as const

// Trip context for the wallet "money instrument" + stay timeline
export const STAY = { day: 47, total: 90, city: "Seoul", cityKo: "서울" }
export const TRIP_BUDGET_KRW = 2_000_000
export const TRIP_SPENT_KRW = 316_302
/** last 7 days of KRW balance (for the wallet sparkline) */
export const DAILY_BALANCE_KRW = [1_837_000, 1_792_000, 1_710_000, 1_668_000, 1_603_000, 1_558_000, 1_520_768]

// ---- Notifications ---------------------------------------------------------

export const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  { id: 1, type: "transaction", title: "Payment Successful", message: "You paid ₩135,727 to Olive Young", time: "2 hours ago", read: false, icon: "check", iconBg: "#e7ede4" },
  { id: 2, type: "promotion", title: "AI Benefit", message: "Turn leftover KRW into a T-money voucher before you leave", time: "4 hours ago", read: false, icon: "gift", iconBg: "#f3ece0" },
  { id: 3, type: "security", title: "K-Tour ID verified", message: "Demo credential status confirmed by the simulated verifier", time: "1 day ago", read: true, icon: "shield", iconBg: "#ece6da" },
  { id: 4, type: "transaction", title: "Voucher issued", message: "₩10,000 welcome coupon added to your benefit wallet", time: "2 days ago", read: true, icon: "ticket", iconBg: "#f1e8e0" },
  { id: 5, type: "system", title: "K-Tour ID updated", message: "Your service trip window and payment limit were refreshed", time: "3 days ago", read: true, icon: "refresh", iconBg: "#ece6da" },
]

// ---- Badge banner (Magpie & Tiger) -----------------------------------------

export const BADGE_BANNER = {
  title: "Magpie & Tiger Badge",
  subtitle: "7th Pre-Order Sale",
  image: "/korean-tiger-badge.png",
}

// ---- Verified Connect: activities + people (all DID-verified) --------------

export const ACTIVITIES: Activity[] = [
  {
    id: "act-1",
    category: "food",
    title: "한강 치맥 번개 🍗",
    titleEn: "Hangang Chicken & Beer 🍗",
    host: "김민준",
    hostFlag: "🇰🇷",
    hostPhoto: "/portraits/minjun-v2.jpg",
    hostType: "korean",
    trustLevel: "verified",
    place: "여의도 한강공원",
    placeEn: "Yeouido Hangang Park",
    time: "오늘 19:00",
    timeEn: "Today 19:00",
    capacity: 6,
    joined: 3,
    participants: ["/portraits/minjun-v2.jpg", "/portraits/daniel-v2.jpg", "/portraits/emma-v2.jpg"],
    costKRW: 18000,
  },
  {
    id: "act-2",
    category: "language",
    title: "한국어 ↔ English 언어교환",
    titleEn: "Korean ↔ English Language Exchange",
    host: "이지은",
    hostFlag: "🇰🇷",
    hostPhoto: "/portraits/jieun-v2.jpg",
    hostType: "korean",
    trustLevel: "verified",
    place: "홍대 앞 카페",
    placeEn: "Café near Hongdae",
    time: "토 15:00",
    timeEn: "Sat 15:00",
    capacity: 8,
    joined: 5,
    participants: ["/portraits/jieun-v2.jpg", "/portraits/daniel-v2.jpg", "/portraits/amara-v2.jpg", "/portraits/emma-v2.jpg"],
  },
  {
    id: "act-3",
    category: "tour",
    title: "경복궁 한복 투어",
    titleEn: "Gyeongbokgung Hanbok Tour",
    host: "Nguyen Van An",
    hostFlag: "🇻🇳",
    hostPhoto: "/portraits/nguyen-v2.jpg",
    hostType: "long-term",
    trustLevel: "verified",
    place: "경복궁 정문",
    placeEn: "Gyeongbokgung Main Gate",
    time: "내일 14:00",
    timeEn: "Tomorrow 14:00",
    capacity: 4,
    joined: 2,
    participants: ["/portraits/nguyen-v2.jpg", "/portraits/amara-v2.jpg"],
  },
  {
    id: "act-4",
    category: "play",
    title: "강남 보드게임 모임",
    titleEn: "Gangnam Board Game Meetup",
    host: "김민준",
    hostFlag: "🇰🇷",
    hostPhoto: "/portraits/minjun-v2.jpg",
    hostType: "korean",
    trustLevel: "verified",
    place: "강남역 보드게임카페",
    placeEn: "Board Game Café, Gangnam",
    time: "일 16:00",
    timeEn: "Sun 16:00",
    capacity: 6,
    joined: 4,
    participants: ["/portraits/minjun-v2.jpg", "/portraits/emma-v2.jpg"],
  },
  {
    id: "act-5",
    category: "tour",
    title: "남산 야경 산책",
    titleEn: "Namsan Night Walk",
    host: "Emma Clarke",
    hostFlag: "🇬🇧",
    hostPhoto: "/portraits/emma-v2.jpg",
    hostType: "foreigner",
    trustLevel: "verified",
    place: "남산서울타워",
    placeEn: "N Seoul Tower",
    time: "금 20:00",
    timeEn: "Fri 20:00",
    capacity: 5,
    joined: 2,
    participants: ["/portraits/emma-v2.jpg", "/portraits/daniel-v2.jpg"],
  },
]

export const PEERS: Peer[] = [
  { id: "p-1", name: "김민준", flag: "🇰🇷", photo: "/portraits/minjun-v2.jpg", userType: "korean", trustLevel: "verified", role: "guide", bio: "서울 토박이 — 맛집·교통·행정 도와드려요", bioEn: "Seoul native — food, transit & admin help", langs: ["KO", "EN"] },
  { id: "p-2", name: "이지은", flag: "🇰🇷", photo: "/portraits/jieun-v2.jpg", userType: "korean", trustLevel: "verified", role: "tutor", bio: "한국어 튜터 · 카페에서 편하게 언어교환", bioEn: "Korean tutor · easy language exchange at a café", langs: ["KO", "EN"] },
  { id: "p-3", name: "Nguyen Van An", flag: "🇻🇳", photo: "/portraits/nguyen-v2.jpg", userType: "long-term", trustLevel: "verified", role: "buddy", bio: "5년차 서울러 · 베트남어·한국어로 도와드려요", bioEn: "5 years in Seoul · happy to help in Vietnamese or Korean", langs: ["VI", "KO", "EN"] },
  { id: "p-4", name: "Amara Lewis", flag: "🇺🇸", photo: "/portraits/amara-v2.jpg", userType: "foreigner", trustLevel: "verified", role: "buddy", bio: "K-pop·전시 좋아해요 · 같이 다녀요", bioEn: "Love K-pop & exhibitions · let's explore together", langs: ["EN"] },
  { id: "p-5", name: "Daniel Miller", flag: "🇺🇸", photo: "/portraits/daniel-v2.jpg", userType: "foreigner", trustLevel: "verified", role: "buddy", bio: "여행 3주차 · 같이 다닐 사람 찾아요", bioEn: "3 weeks traveling · looking for travel buddies", langs: ["EN", "KO"] },
]

/** Seeded demo chat room (with the 한강 치맥 host). */
export const CONNECT_MESSAGES: ConnectMessage[] = [
  { id: "m1", fromMe: false, text: "안녕하세요! 한강 치맥 번개 호스트 김민준이에요 🙂", textEn: "Hi! I'm Minjun, host of the Hangang chicken & beer meetup 🙂", time: "오후 5:02", timeEn: "5:02 PM" },
  { id: "m2", fromMe: true, text: "오 안녕하세요! 저도 참여 가능할까요?", textEn: "Oh hi! Could I join too?", time: "오후 5:04", timeEn: "5:04 PM" },
  { id: "m3", fromMe: false, text: "그럼요, K-Tour ID가 활성 상태라 바로 환영이에요. 7시에 여의도에서 봬요!", textEn: "Of course — your K-Tour ID is active, so welcome aboard. See you at Yeouido at 7!", time: "오후 5:05", timeEn: "5:05 PM" },
  { id: "m4", fromMe: true, text: "치킨은 어떻게 주문해요?", textEn: "How do we order the chicken?", time: "오후 5:06", timeEn: "5:06 PM" },
  { id: "m5", fromMe: false, text: "배민으로 같이 시키고 '같이 결제'로 1/n 해요. 1인 ₩18,000이에요 👍", textEn: "We order together on Baemin and split 1/n with 'Split pay' — ₩18,000 each 👍", time: "오후 5:07", timeEn: "5:07 PM" },
]
