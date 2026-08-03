import type { BrandKey } from "@/lib/brands"
import type { LocalizedText, ServiceKey, UserType } from "@/lib/types"

export type CommercialCategory = "mobility" | "delivery" | "shopping" | "convenience"
export type CommercialSource = "proposal-brand" | "proposal-category" | "expansion"

export interface CommercialService {
  id: string
  category: CommercialCategory
  source: CommercialSource
  brand: BrandKey
  provider: string
  name: LocalizedText
  title: LocalizedText
  description: LocalizedText
  context: LocalizedText
  benefit: LocalizedText
  benefitId: string
  benefitFunding: "provider" | "tourism-campaign"
  benefitEligibleUserTypes: UserType[]
  option: LocalizedText
  fulfilment: LocalizedText
  serviceKey: Exclude<ServiceKey, "benefit">
  geo: { latitude: number; longitude: number }
  coverageKm: number
  grossKRW: number
  benefitKRW: number
}

export const COMMERCIAL_CATEGORIES: Record<CommercialCategory, LocalizedText> = {
  mobility: { ko: "이동", en: "Mobility" },
  delivery: { ko: "배달", en: "Delivery" },
  shopping: { ko: "쇼핑", en: "Shopping" },
  convenience: { ko: "편의점", en: "Convenience" },
}

export const COMMERCIAL_SERVICES: CommercialService[] = [
  {
    id: "tmoney-visitor-pass", category: "mobility", source: "proposal-brand", brand: "tmoney", provider: "T-money",
    name: { ko: "T-money", en: "T-money" },
    title: { ko: "단기 방문 교통패스", en: "Short-stay transit pass" },
    description: { ko: "체류 기간에 맞는 대중교통 이용권을 고르고 K-Tour ID 잔액으로 결제하는 연동 시나리오예요.", en: "Choose a transit pass for your stay and pay from your K-Tour ID travel balance." },
    context: { ko: "서울 전역 · 지하철·버스", en: "Seoul · subway and bus" },
    benefit: { ko: "방문자 웰컴 혜택", en: "Visitor welcome benefit" },
    benefitId: "welcome-tmoney-v1", benefitFunding: "tourism-campaign", benefitEligibleUserTypes: ["foreigner"],
    option: { ko: "3일권 · 오늘 개시", en: "3-day pass · starts today" },
    fulfilment: { ko: "결제 후 모바일 패스로 발급", en: "Issued as a mobile pass after payment" },
    serviceKey: "transport", geo: { latitude: 37.566, longitude: 126.978 }, coverageKm: 55, grossKRW: 18_000, benefitKRW: 3_000,
  },
  {
    id: "kakao-t-airport", category: "mobility", source: "proposal-brand", brand: "kakaot", provider: "Kakao T",
    name: { ko: "카카오 T", en: "Kakao T" },
    title: { ko: "공항 이동 택시", en: "Airport taxi" },
    description: { ko: "현재 위치와 목적지를 넘겨 호출하고, 완료 상태를 K-Tour ID로 돌려받는 왕복 흐름이에요.", en: "Send pickup and destination details, then return to K-Tour ID with the ride status." },
    context: { ko: "연남동 → 인천공항 T1", en: "Yeonnam → Incheon Airport T1" },
    benefit: { ko: "공항 이동 ₩5,000 혜택", en: "₩5,000 airport ride benefit" },
    benefitId: "airport-ride-v1", benefitFunding: "tourism-campaign", benefitEligibleUserTypes: ["foreigner"],
    option: { ko: "일반 호출 · 예상 54분", en: "Standard · about 54 min" },
    fulfilment: { ko: "카카오 T 호출 화면으로 이동", en: "Continue in the Kakao T request screen" },
    serviceKey: "transport", geo: { latitude: 37.557, longitude: 126.924 }, coverageKm: 70, grossKRW: 62_000, benefitKRW: 5_000,
  },
  {
    id: "uber-city-ride", category: "mobility", source: "expansion", brand: "uber", provider: "Uber",
    name: { ko: "Uber", en: "Uber" },
    title: { ko: "서울 시내 이동", en: "Ride across Seoul" },
    description: { ko: "익숙한 호출 방식으로 서울 시내 이동 예상 금액과 K-Tour ID 혜택을 먼저 확인해요.", en: "Review the estimated fare and K-Tour ID benefit before requesting a familiar ride." },
    context: { ko: "명동 → 성수", en: "Myeongdong → Seongsu" },
    benefit: { ko: "첫 이동 ₩3,000 혜택", en: "₩3,000 first-ride benefit" },
    benefitId: "first-city-ride-v1", benefitFunding: "provider", benefitEligibleUserTypes: ["foreigner", "long-term"],
    option: { ko: "택시 · 예상 28분", en: "Taxi · about 28 min" },
    fulfilment: { ko: "Uber 호출 화면으로 이동", en: "Continue in the Uber request screen" },
    serviceKey: "transport", geo: { latitude: 37.564, longitude: 126.986 }, coverageKm: 45, grossKRW: 24_000, benefitKRW: 3_000,
  },
  {
    id: "baemin-local-meal", category: "delivery", source: "proposal-brand", brand: "baemin", provider: "배달의민족",
    name: { ko: "배달의민족", en: "Baemin" },
    title: { ko: "동네 맛집 한 끼", en: "A meal from a local favorite" },
    description: { ko: "배달 주소와 메뉴를 확인하고 K-Tour ID 혜택을 적용한 뒤 주문 앱으로 이어져요.", en: "Confirm the delivery address and meal, apply your benefit, then continue to the delivery app." },
    context: { ko: "연희동 숙소 · 약 32분", en: "Yeonhui stay · about 32 min" },
    benefit: { ko: "첫 주문 ₩4,000 혜택", en: "₩4,000 first-order benefit" },
    benefitId: "first-local-meal-v1", benefitFunding: "provider", benefitEligibleUserTypes: ["foreigner", "long-term"],
    option: { ko: "불고기 덮밥 · 1인", en: "Bulgogi rice bowl · serves 1" },
    fulfilment: { ko: "숙소 주소로 배달", en: "Delivery to your stay" },
    serviceKey: "delivery", geo: { latitude: 37.569, longitude: 126.929 }, coverageKm: 8, grossKRW: 17_500, benefitKRW: 4_000,
  },
  {
    id: "coupang-eats-night", category: "delivery", source: "expansion", brand: "coupangeats", provider: "쿠팡이츠",
    name: { ko: "쿠팡이츠", en: "Coupang Eats" },
    title: { ko: "늦은 밤 간편식", en: "Late-night comfort food" },
    description: { ko: "늦은 시간에도 배달 예상 시간과 K-Tour ID 혜택을 한 번에 확인해요.", en: "Review late-night delivery timing and your K-Tour ID benefit in one place." },
    context: { ko: "홍대입구 숙소 · 약 24분", en: "Hongdae stay · about 24 min" },
    benefit: { ko: "배달비 ₩3,000 혜택", en: "₩3,000 delivery benefit" },
    benefitId: "delivery-fee-night-v1", benefitFunding: "provider", benefitEligibleUserTypes: ["foreigner", "long-term"],
    option: { ko: "떡볶이 세트 · 1인", en: "Tteokbokki set · serves 1" },
    fulfilment: { ko: "숙소 주소로 배달", en: "Delivery to your stay" },
    serviceKey: "delivery", geo: { latitude: 37.557, longitude: 126.924 }, coverageKm: 10, grossKRW: 15_900, benefitKRW: 3_000,
  },
  {
    id: "oliveyoung-pickup", category: "shopping", source: "expansion", brand: "oliveyoung", provider: "Olive Young",
    name: { ko: "올리브영", en: "Olive Young" },
    title: { ko: "여행 필수품 바로 픽업", en: "Pick up travel essentials" },
    description: { ko: "가까운 매장의 재고와 K-Tour ID 혜택을 확인하고 픽업으로 이어져요.", en: "Check nearby stock and your K-Tour ID benefit, then continue to pickup." },
    context: { ko: "홍대 타운점 · 도보 7분", en: "Hongdae Town · 7 min walk" },
    benefit: { ko: "K-뷰티 ₩5,000 혜택", en: "₩5,000 K-beauty benefit" },
    benefitId: "kbeauty-pickup-v1", benefitFunding: "provider", benefitEligibleUserTypes: ["foreigner", "long-term"],
    option: { ko: "선케어 여행 세트", en: "Travel sun-care set" },
    fulfilment: { ko: "매장 픽업 · 20분 후", en: "Store pickup · ready in 20 min" },
    serviceKey: "shopping", geo: { latitude: 37.556, longitude: 126.923 }, coverageKm: 12, grossKRW: 29_000, benefitKRW: 5_000,
  },
  {
    id: "gs25-arrival-kit", category: "convenience", source: "proposal-category", brand: "gs25", provider: "GS25",
    name: { ko: "GS25", en: "GS25" },
    title: { ko: "도착 첫날 편의 키트", en: "First-night essentials" },
    description: { ko: "도착 첫날 필요한 물품을 가까운 편의점에서 빠르게 픽업해요.", en: "Pick up first-night essentials quickly from a nearby convenience store." },
    context: { ko: "연남 중앙점 · 도보 3분", en: "Yeonnam Central · 3 min walk" },
    benefit: { ko: "도착 키트 ₩2,000 혜택", en: "₩2,000 arrival-kit benefit" },
    benefitId: "arrival-kit-v1", benefitFunding: "tourism-campaign", benefitEligibleUserTypes: ["foreigner"],
    option: { ko: "물·어댑터·간편식", en: "Water · adapter · snack" },
    fulfilment: { ko: "매장 픽업 · 10분 후", en: "Store pickup · ready in 10 min" },
    serviceKey: "shopping", geo: { latitude: 37.568, longitude: 126.929 }, coverageKm: 5, grossKRW: 12_500, benefitKRW: 2_000,
  },
]

export function commercialServiceById(id: string) {
  return COMMERCIAL_SERVICES.find((service) => service.id === id)
}
