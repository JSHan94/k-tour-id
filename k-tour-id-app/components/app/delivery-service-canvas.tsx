"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  Check,
  CheckCircle2,
  Clock3,
  Home,
  MapPin,
  Minus,
  PhoneOff,
  Plus,
  ShoppingBag,
} from "lucide-react";
import type { Lang } from "@/lib/i18n/dict";
import type { ServiceConfiguration } from "@/lib/service-flow";

type MenuOption = {
  nameKo: string;
  nameEn: string;
  deltaKRW: number;
};

type MenuItem = {
  id: string;
  nameKo: string;
  nameEn: string;
  descriptionKo: string;
  descriptionEn: string;
  image: string;
  unitPriceKRW: number;
  soldOut?: boolean;
  options: MenuOption[];
};

const BAEMIN_MENU: MenuItem[] = [
  {
    id: "bulgogi-bowl",
    nameKo: "불고기 덮밥",
    nameEn: "Bulgogi rice bowl",
    descriptionKo: "간장 불고기 · 계란 · 제철 나물",
    descriptionEn: "Soy bulgogi · egg · seasonal greens",
    image: "/korean-bulgogi.png",
    unitPriceKRW: 12_500,
    options: [
      { nameKo: "기본 구성", nameEn: "Standard", deltaKRW: 0 },
      { nameKo: "고기 추가", nameEn: "Extra beef", deltaKRW: 3_500 },
    ],
  },
  {
    id: "kimchi-stew",
    nameKo: "김치찌개 정식",
    nameEn: "Kimchi stew set",
    descriptionKo: "돼지고기 김치찌개 · 밥 · 반찬",
    descriptionEn: "Pork kimchi stew · rice · sides",
    image: "/korean-kimchi-stew.png",
    unitPriceKRW: 13_500,
    options: [
      { nameKo: "보통맛", nameEn: "Regular", deltaKRW: 0 },
      { nameKo: "덜 맵게", nameEn: "Less spicy", deltaKRW: 0 },
    ],
  },
  {
    id: "tteokbokki-set",
    nameKo: "떡볶이 튀김 세트",
    nameEn: "Tteokbokki & fries",
    descriptionKo: "떡볶이 · 모둠튀김 · 김말이",
    descriptionEn: "Tteokbokki · assorted fries · seaweed roll",
    image: "/korean-tteokbokki.png",
    unitPriceKRW: 15_900,
    options: [
      { nameKo: "보통맛", nameEn: "Regular", deltaKRW: 0 },
      { nameKo: "순한맛", nameEn: "Mild", deltaKRW: 0 },
    ],
  },
  {
    id: "bibimbap",
    nameKo: "제철 비빔밥",
    nameEn: "Seasonal bibimbap",
    descriptionKo: "여섯 가지 나물 · 계란 · 고추장",
    descriptionEn: "Six vegetables · egg · gochujang",
    image: "/korean-bibimbap.png",
    unitPriceKRW: 11_500,
    options: [
      { nameKo: "고추장 별도", nameEn: "Sauce on the side", deltaKRW: 0 },
      { nameKo: "기본 비빔", nameEn: "Mixed", deltaKRW: 0 },
    ],
  },
  {
    id: "fried-chicken",
    nameKo: "후라이드 치킨",
    nameEn: "Korean fried chicken",
    descriptionKo: "오늘 준비 수량이 모두 소진됐어요",
    descriptionEn: "Sold out for today",
    image: "/korean-fried-chicken.png",
    unitPriceKRW: 18_900,
    soldOut: true,
    options: [
      { nameKo: "뼈", nameEn: "Bone-in", deltaKRW: 0 },
      { nameKo: "순살", nameEn: "Boneless", deltaKRW: 2_000 },
    ],
  },
];

const COUPANG_MENU: MenuItem[] = [
  BAEMIN_MENU[2],
  BAEMIN_MENU[4],
  BAEMIN_MENU[0],
  BAEMIN_MENU[1],
  BAEMIN_MENU[3],
];

const DELIVERY_METHODS = [
  {
    icon: Home,
    nameKo: "문 앞에 두기",
    nameEn: "Leave at the door",
    detailKo: "도착 알림으로 확인",
    detailEn: "Get an arrival alert",
  },
  {
    icon: Building2,
    nameKo: "로비에서 받기",
    nameEn: "Meet in the lobby",
    detailKo: "중계 연락으로 만나기",
    detailEn: "Meet via contact relay",
  },
] as const;

export function DeliveryServiceCanvas({
  serviceId,
  lang,
  locationLabel,
  locationVerified,
  onChange,
}: {
  serviceId: string;
  lang: Lang;
  locationLabel: string;
  locationVerified: boolean;
  onChange: (configuration: ServiceConfiguration) => void;
}) {
  const ko = lang === "ko";
  const menu = serviceId === "coupang-eats-night" ? COUPANG_MENU : BAEMIN_MENU;
  const deliveryFeeKRW = serviceId === "coupang-eats-night" ? 3_000 : 2_500;
  const minimumOrderKRW = 12_000;
  const [address, setAddress] = useState(locationLabel);
  const [deliverability, setDeliverability] = useState<
    "available" | "unchecked" | "unavailable"
  >(locationVerified && locationLabel ? "available" : "unchecked");
  const [addressCheckId, setAddressCheckId] = useState(
    locationVerified && locationLabel ? "DEVICE-LOCATION" : "",
  );
  const [checkingAddress, setCheckingAddress] = useState(false);
  const addressCheckRequestRef = useRef("");
  const addButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const decreaseButtonRefs = useRef<Record<string, HTMLButtonElement | null>>(
    {},
  );
  const [deliveryMethodIndex, setDeliveryMethodIndex] = useState(0);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [optionIndexes, setOptionIndexes] = useState<Record<string, number>>(
    {},
  );
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  const selectedItems = useMemo(
    () =>
      menu.flatMap((item) => {
        const quantity = quantities[item.id] ?? 0;
        if (quantity <= 0) return [];
        const option =
          item.options[optionIndexes[item.id] ?? 0] ?? item.options[0];
        return [
          {
            id: item.id,
            nameKo: item.nameKo,
            nameEn: item.nameEn,
            optionId: `${item.id}:option-${optionIndexes[item.id] ?? 0}`,
            optionKo: option.nameKo,
            optionEn: option.nameEn,
            unitPriceKRW: item.unitPriceKRW + option.deltaKRW,
            quantity,
          },
        ];
      }),
    [menu, optionIndexes, quantities],
  );

  const itemsTotalKRW = selectedItems.reduce(
    (sum, item) => sum + item.unitPriceKRW * item.quantity,
    0,
  );
  const totalQuantity = selectedItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const deliveryMethod =
    DELIVERY_METHODS[deliveryMethodIndex] ?? DELIVERY_METHODS[0];

  useEffect(() => {
    onChange({
      kind: "food-delivery",
      address,
      deliveryMethodKo: deliveryMethod.nameKo,
      deliveryMethodEn: deliveryMethod.nameEn,
      deliverability,
      addressCheckId,
      minimumOrderKRW,
      items: selectedItems,
      deliveryFeeKRW,
    });
  }, [
    address,
    addressCheckId,
    deliveryFeeKRW,
    deliveryMethod,
    deliverability,
    minimumOrderKRW,
    onChange,
    selectedItems,
  ]);

  const setQuantity = (item: MenuItem, next: number) => {
    if (item.soldOut) return;
    const previous = quantities[item.id] ?? 0;
    setQuantities((current) => ({
      ...current,
      [item.id]: Math.max(0, Math.min(5, next)),
    }));
    if (next > 0) setOpenItemId(item.id);
    if (next <= 0 && openItemId === item.id) setOpenItemId(null);
    if (previous === 0 && next > 0)
      requestAnimationFrame(() => decreaseButtonRefs.current[item.id]?.focus());
    if (next <= 0)
      requestAnimationFrame(() => addButtonRefs.current[item.id]?.focus());
  };

  const addressReady = address.trim().length >= 4;
  const checkAddress = async () => {
    if (!addressReady || checkingAddress) return;
    const addressSnapshot = address.trim();
    const requestId = crypto.randomUUID();
    addressCheckRequestRef.current = requestId;
    setCheckingAddress(true);
    await new Promise((resolve) => setTimeout(resolve, 450));
    if (addressCheckRequestRef.current !== requestId) return;
    const outsideReferenceArea = /(부산|제주|busan|jeju)/i.test(
      addressSnapshot,
    );
    setDeliverability(outsideReferenceArea ? "unavailable" : "available");
    setAddressCheckId(
      `ADDR-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
    );
    setCheckingAddress(false);
  };

  return (
    <section
      aria-labelledby="delivery-canvas-title"
      className="mt-6 overflow-hidden rounded-[24px] bg-card ring-1 ring-border"
    >
      <div className="bg-ink px-5 py-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold text-white/60">
              {ko ? "배달 주문" : "Delivery order"}
            </p>
            <h2
              id="delivery-canvas-title"
              className="font-display mt-1 text-[23px] font-semibold"
            >
              {ko ? "숙소에서 편하게 받아요" : "Delivered to your stay"}
            </h2>
          </div>
          <span className="inline-flex min-h-8 flex-shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 text-[11px] font-semibold text-white/80">
            <Clock3 className="h-3.5 w-3.5" />
            {ko ? "예상 25–35분" : "25–35 min est."}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div
          className={`rounded-[18px] p-4 ${deliverability === "unavailable" ? "bg-primary/8 text-primary" : "bg-success-surface text-success"}`}
        >
          <div
            id="delivery-coverage-status"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="flex items-center gap-2 text-[12px] font-semibold"
          >
            {deliverability === "available" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            {deliverability === "available"
              ? ko
                ? "목업 제공 범위 확인 완료"
                : "Reference delivery coverage confirmed"
              : deliverability === "unavailable"
                ? ko
                  ? "현재 목업 제공 범위 밖이에요"
                  : "Outside the reference delivery area"
              : ko
                ? "주소를 입력한 뒤 제공 범위를 확인해 주세요"
                : "Enter an address and check coverage"}
          </div>
          <label
            htmlFor="delivery-stay-address"
            className="mt-3 block text-[11px] font-semibold text-foreground/65"
          >
            {ko ? "받는 주소" : "Delivery address"}
          </label>
          <div className="mt-1.5 flex min-h-12 items-center gap-2 rounded-[12px] bg-white px-3 text-foreground ring-1 ring-success/15">
            <MapPin className="h-4 w-4 flex-shrink-0 text-success" />
            <input
              id="delivery-stay-address"
              required
              aria-invalid={!addressReady}
              aria-describedby="delivery-coverage-status"
              value={address}
              onChange={(event) => {
                setAddress(event.target.value);
                addressCheckRequestRef.current = "";
                setCheckingAddress(false);
                setDeliverability("unchecked");
                setAddressCheckId("");
              }}
              className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold outline-none"
            />
          </div>
          <button
            type="button"
            disabled={!addressReady || checkingAddress}
            onClick={checkAddress}
            className="mt-2 min-h-11 w-full rounded-[11px] bg-ink px-3 text-[12px] font-semibold text-white disabled:opacity-40"
          >
            {checkingAddress
              ? ko
                ? "배달 가능 여부 확인 중…"
                : "Checking delivery…"
              : deliverability === "available"
                ? ko
                  ? "배달 가능 · 다시 확인"
                  : "Available · check again"
                : ko
                  ? "목업 제공 범위 확인"
                  : "Check reference coverage"}
          </button>
          <p className="mt-2 text-[10px] leading-4 text-foreground/55">
            {ko
              ? "여기서는 목업용 제공 범위를 확인해요. 실제 배달 가능 여부와 시간은 제공자 견적으로 확정돼요."
              : "This checks reference coverage only. A provider quote confirms actual availability and timing."}
          </p>
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-[16px] bg-surface-2 p-4">
          <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-card text-primary ring-1 ring-border">
            <PhoneOff className="h-4 w-4" />
          </span>
          <div>
            <strong className="text-[12px]">
              {ko
                ? "한국 전화번호 없이 주문 가능"
                : "Order without a Korean phone number"}
            </strong>
            <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
              {ko
                ? "가게·배달 기사와 필요한 연락만 K‑Tour ID가 중계해요."
                : "K‑Tour ID relays only the contact needed for the store and courier."}
            </p>
          </div>
        </div>

        <div className="mt-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold text-primary">
              {ko ? "오늘의 메뉴" : "Today’s menu"}
            </p>
            <h3 className="font-display mt-1 text-[21px] font-semibold">
              {ko ? "무엇을 드실래요?" : "What would you like?"}
            </h3>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {ko ? "최대 5개씩" : "Up to 5 each"}
          </span>
        </div>

        <ul className="mt-3 divide-y divide-foreground/10">
          {menu.map((item) => {
            const quantity = quantities[item.id] ?? 0;
            const optionIndex = optionIndexes[item.id] ?? 0;
            const option = item.options[optionIndex] ?? item.options[0];
            const unitPriceKRW = item.unitPriceKRW + option.deltaKRW;
            const expanded = openItemId === item.id && quantity > 0;
            return (
              <li key={item.id} className="py-4 first:pt-2">
                <div
                  className={`flex gap-3 ${item.soldOut ? "opacity-55" : ""}`}
                >
                  <div className="relative h-[82px] w-[82px] flex-shrink-0 overflow-hidden rounded-[15px] bg-surface-2">
                    <Image
                      src={item.image}
                      alt={ko ? item.nameKo : item.nameEn}
                      fill
                      sizes="82px"
                      className="object-cover"
                    />
                    {item.soldOut && (
                      <span className="absolute inset-0 grid place-items-center bg-ink/60 text-[11px] font-bold text-white">
                        {ko ? "품절" : "Sold out"}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <strong className="text-[14px]">
                      {ko ? item.nameKo : item.nameEn}
                    </strong>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted-foreground">
                      {ko ? item.descriptionKo : item.descriptionEn}
                    </p>
                    <div className="mt-2 flex min-h-11 items-center justify-between gap-2">
                      <span className="tabular text-[13px] font-semibold">
                        ₩{unitPriceKRW.toLocaleString()}
                      </span>
                      {quantity === 0 ? (
                        <button
                          ref={(node) => {
                            addButtonRefs.current[item.id] = node;
                          }}
                          type="button"
                          disabled={item.soldOut}
                          onClick={() => setQuantity(item, 1)}
                          aria-label={`${ko ? item.nameKo : item.nameEn} ${ko ? "담기" : "add"}`}
                          className="pressable inline-flex h-11 min-w-11 items-center justify-center rounded-full bg-secondary text-primary disabled:cursor-not-allowed disabled:text-muted-foreground"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      ) : (
                        <div
                          role="group"
                          aria-label={`${ko ? item.nameKo : item.nameEn} ${ko ? "수량" : "quantity"}`}
                          className="flex items-center gap-1 rounded-full bg-secondary p-0.5"
                        >
                          <button
                            ref={(node) => {
                              decreaseButtonRefs.current[item.id] = node;
                            }}
                            type="button"
                            onClick={() => setQuantity(item, quantity - 1)}
                            aria-label={
                              ko ? "수량 줄이기" : "Decrease quantity"
                            }
                            className="pressable grid h-10 w-10 place-items-center rounded-full"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <strong className="tabular min-w-5 text-center text-[13px]">
                            {quantity}
                          </strong>
                          <button
                            type="button"
                            disabled={quantity >= 5}
                            onClick={() => setQuantity(item, quantity + 1)}
                            aria-label={
                              ko ? "수량 늘리기" : "Increase quantity"
                            }
                            className="pressable grid h-10 w-10 place-items-center rounded-full disabled:opacity-35"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {expanded && (
                  <div className="mt-3 rounded-[16px] bg-surface-2 p-3 ring-1 ring-border">
                    <p className="text-[11px] font-semibold">
                      {ko ? "메뉴 옵션" : "Menu option"}
                    </p>
                    <div
                      role="group"
                      aria-label={ko ? "메뉴 옵션" : "Menu option"}
                      className="mt-2 grid grid-cols-2 gap-2"
                    >
                      {item.options.map((candidate, index) => (
                        <button
                          key={candidate.nameEn}
                          type="button"
                          aria-pressed={optionIndex === index}
                          onClick={() =>
                            setOptionIndexes((current) => ({
                              ...current,
                              [item.id]: index,
                            }))
                          }
                          className={`pressable flex min-h-11 items-center justify-between rounded-[11px] px-3 text-left text-[11px] font-semibold ring-1 ${optionIndex === index ? "bg-ink text-white ring-ink" : "bg-card ring-border"}`}
                        >
                          <span>
                            {ko ? candidate.nameKo : candidate.nameEn}
                          </span>
                          {candidate.deltaKRW > 0 ? (
                            <span className="ml-1 whitespace-nowrap opacity-70">
                              +₩{candidate.deltaKRW.toLocaleString()}
                            </span>
                          ) : optionIndex === index ? (
                            <Check className="ml-1 h-3.5 w-3.5 flex-shrink-0 text-gold" />
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-5 border-t border-foreground/10 pt-5">
          <p className="text-[11px] font-semibold text-primary">
            {ko ? "받는 방법" : "Delivery method"}
          </p>
          <div
            role="group"
            aria-label={ko ? "받는 방법" : "Delivery method"}
            className="mt-2 grid grid-cols-2 gap-2"
          >
            {DELIVERY_METHODS.map((method, index) => {
              const Icon = method.icon;
              const selected = deliveryMethodIndex === index;
              return (
                <button
                  key={method.nameEn}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setDeliveryMethodIndex(index)}
                  className={`pressable min-h-[82px] rounded-[15px] p-3 text-left ring-1 ${selected ? "bg-ink text-white ring-ink" : "bg-surface-2 ring-border"}`}
                >
                  <span className="flex items-center justify-between">
                    <Icon className="h-4 w-4" />
                    {selected && <Check className="h-4 w-4 text-gold" />}
                  </span>
                  <strong className="mt-2 block text-[12px]">
                    {ko ? method.nameKo : method.nameEn}
                  </strong>
                  <span
                    className={`mt-1 block text-[10px] ${selected ? "text-white/60" : "text-muted-foreground"}`}
                  >
                    {ko ? method.detailKo : method.detailEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          aria-live="polite"
          className="mt-6 rounded-[20px] bg-ink p-5 text-white"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-gold" />
              <strong className="text-[13px]">
                {ko ? "장바구니" : "Your cart"}
              </strong>
            </div>
            <span className="text-[11px] text-white/55">
              {ko ? `${totalQuantity}개` : `${totalQuantity} items`}
            </span>
          </div>
          {selectedItems.length === 0 ? (
            <p className="mt-4 rounded-[12px] bg-white/8 px-3 py-4 text-center text-[12px] text-white/55">
              {ko
                ? "메뉴를 담으면 예상 주문 금액을 보여드려요."
                : "Add a menu item to see your estimated order total."}
            </p>
          ) : (
            <>
              <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-[11px]">
                {selectedItems.map((item) => (
                  <div key={item.id} className="flex justify-between gap-4">
                    <span className="min-w-0 truncate text-white/65">
                      {ko ? item.nameKo : item.nameEn} ·{" "}
                      {ko ? item.optionKo : item.optionEn} × {item.quantity}
                    </span>
                    <span className="tabular flex-shrink-0">
                      ₩{(item.unitPriceKRW * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-[12px]">
                <div className="flex justify-between text-white/65">
                  <span>{ko ? "메뉴 금액" : "Items"}</span>
                  <span className="tabular">
                    ₩{itemsTotalKRW.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-white/65">
                  <span>{ko ? "예상 배달비" : "Estimated delivery fee"}</span>
                  <span className="tabular">
                    ₩{deliveryFeeKRW.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-end justify-between border-t border-white/10 pt-3">
                  <strong>{ko ? "주문 예상액" : "Estimated order"}</strong>
                  <strong className="font-display tabular text-[24px]">
                    ₩{(itemsTotalKRW + deliveryFeeKRW).toLocaleString()}
                  </strong>
                </div>
              </div>
              {itemsTotalKRW < minimumOrderKRW && (
                <p className="mt-3 rounded-[10px] bg-gold/12 px-3 py-2 text-[11px] font-semibold text-gold">
                  {ko
                    ? `최소 주문 금액까지 ₩${(minimumOrderKRW - itemsTotalKRW).toLocaleString()} 남았어요.`
                    : `Add ₩${(minimumOrderKRW - itemsTotalKRW).toLocaleString()} to reach the minimum order.`}
                </p>
              )}
              <p className="mt-3 text-[10px] leading-4 text-white/50">
                {ko
                  ? "K‑Tour ID 혜택과 최종 결제액은 다음 단계에서 확인해요."
                  : "Review your K‑Tour ID benefit and final total next."}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
