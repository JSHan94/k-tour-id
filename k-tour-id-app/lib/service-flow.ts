import type { CommercialCategory } from "@/lib/commercial-services";
import type { LocalizedText, ServiceCategory } from "@/lib/types";

export type CoreIntent = "mobility" | "food" | "shopping" | "experience";

export interface IntentDefinition {
  label: LocalizedText;
  prompt: LocalizedText;
  hint: LocalizedText;
}

export const CORE_INTENTS: Record<CoreIntent, IntentDefinition> = {
  mobility: {
    label: { ko: "교통", en: "Move" },
    prompt: { ko: "어디로 이동하세요?", en: "Where are you going?" },
    hint: { ko: "패스 · 택시 · 이동 시간", en: "Passes · rides · travel time" },
  },
  food: {
    label: { ko: "음식", en: "Eat" },
    prompt: { ko: "지금 무엇을 드실래요?", en: "What would you like to eat?" },
    hint: {
      ko: "배달 · 픽업 · 도착 시간",
      en: "Delivery · pickup · arrival time",
    },
  },
  shopping: {
    label: { ko: "쇼핑·생활", en: "Shop" },
    prompt: { ko: "오늘 필요한 게 있나요?", en: "What do you need today?" },
    hint: { ko: "가까운 재고 · 빠른 픽업", en: "Nearby stock · quick pickup" },
  },
  experience: {
    label: { ko: "예약·체험", en: "Experience" },
    prompt: { ko: "무엇을 해보고 싶나요?", en: "What would you like to do?" },
    hint: { ko: "날짜 · 인원 · 언어", en: "Date · people · language" },
  },
};

export function commercialCategoryToIntent(
  category: CommercialCategory,
): CoreIntent {
  if (category === "delivery") return "food";
  if (category === "mobility") return "mobility";
  return "shopping";
}

export function serviceCategoryToIntent(
  category: ServiceCategory,
): CoreIntent | null {
  if (
    category === "mobility" ||
    category === "food" ||
    category === "shopping" ||
    category === "experience"
  )
    return category;
  return null;
}

export interface ServiceFlowDefinition {
  intent: CoreIntent;
  subtype: LocalizedText;
  choiceLabel: LocalizedText;
  choices: LocalizedText[];
  context: Array<{ label: LocalizedText; value: LocalizedText }>;
  fulfilment: LocalizedText[];
}

export type ServiceConfiguration =
  | { kind: "food-delivery"; address: string; quantity: number }
  | {
      kind: "store-pickup";
      pickupTimeKo: string;
      pickupTimeEn: string;
      quantity: number;
    };

export interface ServiceQuote {
  id: string;
  configuration: ServiceConfiguration | null;
  grossKRW: number;
  benefitKRW: number;
  totalKRW: number;
  expiresAt: string;
}

export function formatServiceConfiguration(
  configuration: ServiceConfiguration | null,
  lang: "ko" | "en",
) {
  if (!configuration) return "";
  if (configuration.kind === "food-delivery")
    return `${configuration.address} · ${configuration.quantity}${lang === "ko" ? "개" : " item(s)"}`;
  return `${lang === "ko" ? configuration.pickupTimeKo : configuration.pickupTimeEn} · ${configuration.quantity}${lang === "ko" ? "개" : " item(s)"}`;
}

export function configurationQuantity(
  configuration: ServiceConfiguration | null,
) {
  return configuration?.quantity ?? 1;
}

export const SERVICE_FLOWS: Record<string, ServiceFlowDefinition> = {
  "tmoney-visitor-pass": {
    intent: "mobility",
    subtype: { ko: "대중교통 패스", en: "Transit pass" },
    choiceLabel: { ko: "개시일", en: "Activation" },
    choices: [
      { ko: "3일권 · 오늘 개시", en: "3-day pass · starts today" },
      { ko: "3일권 · 내일 개시", en: "3-day pass · starts tomorrow" },
    ],
    context: [
      {
        label: { ko: "이용 범위", en: "Coverage" },
        value: { ko: "서울 지하철·버스", en: "Seoul subway and bus" },
      },
      {
        label: { ko: "발급 방식", en: "Delivery" },
        value: { ko: "결제 후 모바일 패스", en: "Mobile pass after payment" },
      },
    ],
    fulfilment: [
      { ko: "발급 준비", en: "Issuing" },
      { ko: "사용 가능", en: "Ready" },
      { ko: "이용 중", en: "Active" },
      { ko: "이용 완료", en: "Completed" },
    ],
  },
  "kakao-t-airport": {
    intent: "mobility",
    subtype: { ko: "택시 호출", en: "Ride hailing" },
    choiceLabel: { ko: "출발지", en: "Pickup" },
    choices: [
      {
        ko: "현재 위치 → 인천공항 T1",
        en: "Current location → Incheon Airport T1",
      },
      { ko: "숙소 → 인천공항 T1", en: "My stay → Incheon Airport T1" },
    ],
    context: [
      {
        label: { ko: "차량", en: "Vehicle" },
        value: { ko: "일반 호출", en: "Standard taxi" },
      },
      {
        label: { ko: "예상 시간", en: "ETA" },
        value: { ko: "약 54분", en: "About 54 min" },
      },
    ],
    fulfilment: [
      { ko: "호출 요청", en: "Requesting" },
      { ko: "기사 배차", en: "Driver matched" },
      { ko: "이동 중", en: "On the way" },
      { ko: "도착", en: "Arrived" },
    ],
  },
  "uber-city-ride": {
    intent: "mobility",
    subtype: { ko: "택시 호출", en: "Ride hailing" },
    choiceLabel: { ko: "이동 경로", en: "Route" },
    choices: [
      { ko: "현재 위치 → 성수", en: "Current location → Seongsu" },
      { ko: "명동 → 성수", en: "Myeongdong → Seongsu" },
    ],
    context: [
      {
        label: { ko: "차량", en: "Vehicle" },
        value: { ko: "일반 택시", en: "Standard taxi" },
      },
      {
        label: { ko: "예상 시간", en: "ETA" },
        value: { ko: "약 28분", en: "About 28 min" },
      },
    ],
    fulfilment: [
      { ko: "호출 요청", en: "Requesting" },
      { ko: "기사 배차", en: "Driver matched" },
      { ko: "이동 중", en: "On the way" },
      { ko: "도착", en: "Arrived" },
    ],
  },
  "baemin-local-meal": {
    intent: "food",
    subtype: { ko: "숙소 배달", en: "Delivery" },
    choiceLabel: { ko: "메뉴", en: "Menu" },
    choices: [
      { ko: "불고기 덮밥 · 1인", en: "Bulgogi bowl · serves 1" },
      { ko: "비빔밥 · 1인", en: "Bibimbap · serves 1" },
    ],
    context: [
      {
        label: { ko: "받는 곳", en: "Address" },
        value: { ko: "선택한 숙소 · 문 앞", en: "Selected stay · at the door" },
      },
      {
        label: { ko: "예상 도착", en: "Arrival" },
        value: { ko: "약 32분", en: "About 32 min" },
      },
    ],
    fulfilment: [
      { ko: "주문 접수", en: "Accepted" },
      { ko: "조리 중", en: "Preparing" },
      { ko: "배달 중", en: "Delivering" },
      { ko: "배달 완료", en: "Delivered" },
    ],
  },
  "coupang-eats-night": {
    intent: "food",
    subtype: { ko: "숙소 배달", en: "Delivery" },
    choiceLabel: { ko: "메뉴", en: "Menu" },
    choices: [
      { ko: "떡볶이 세트 · 1인", en: "Tteokbokki set · serves 1" },
      { ko: "김치찌개 · 1인", en: "Kimchi stew · serves 1" },
    ],
    context: [
      {
        label: { ko: "받는 곳", en: "Address" },
        value: { ko: "선택한 숙소 · 문 앞", en: "Selected stay · at the door" },
      },
      {
        label: { ko: "예상 도착", en: "Arrival" },
        value: { ko: "약 24분", en: "About 24 min" },
      },
    ],
    fulfilment: [
      { ko: "주문 접수", en: "Accepted" },
      { ko: "조리 중", en: "Preparing" },
      { ko: "배달 중", en: "Delivering" },
      { ko: "배달 완료", en: "Delivered" },
    ],
  },
  "oliveyoung-pickup": {
    intent: "shopping",
    subtype: { ko: "매장 픽업", en: "Store pickup" },
    choiceLabel: { ko: "재고 매장·상품", en: "Store & item" },
    choices: [
      { ko: "홍대 타운점 · 선케어 세트", en: "Hongdae Town · sun-care set" },
      { ko: "연남점 · 선케어 세트", en: "Yeonnam · sun-care set" },
    ],
    context: [
      {
        label: { ko: "재고", en: "Stock" },
        value: { ko: "선택 매장 재고 있음", en: "In stock at selected store" },
      },
      {
        label: { ko: "픽업", en: "Pickup" },
        value: { ko: "결제 후 약 20분", en: "About 20 min after payment" },
      },
    ],
    fulfilment: [
      { ko: "재고 확보", en: "Reserved" },
      { ko: "준비 중", en: "Preparing" },
      { ko: "픽업 가능", en: "Ready" },
      { ko: "픽업 완료", en: "Picked up" },
    ],
  },
  "gs25-arrival-kit": {
    intent: "shopping",
    subtype: { ko: "빠른 픽업", en: "Quick pickup" },
    choiceLabel: { ko: "매장·상품", en: "Store & items" },
    choices: [
      { ko: "연남 중앙점 · 도착 키트", en: "Yeonnam Central · arrival kit" },
      { ko: "홍대입구점 · 도착 키트", en: "Hongdae Station · arrival kit" },
    ],
    context: [
      {
        label: { ko: "구성", en: "Contents" },
        value: { ko: "물·어댑터·간편식", en: "Water · adapter · snack" },
      },
      {
        label: { ko: "픽업", en: "Pickup" },
        value: { ko: "결제 후 약 10분", en: "About 10 min after payment" },
      },
    ],
    fulfilment: [
      { ko: "재고 확보", en: "Reserved" },
      { ko: "포장 중", en: "Packing" },
      { ko: "픽업 가능", en: "Ready" },
      { ko: "픽업 완료", en: "Picked up" },
    ],
  },
};

export function flowForService(id: string) {
  return SERVICE_FLOWS[id];
}
