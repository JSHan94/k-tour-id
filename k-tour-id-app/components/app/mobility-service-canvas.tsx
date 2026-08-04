"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Luggage, LocateFixed, MapPin } from "lucide-react";
import type { Lang } from "@/lib/i18n/dict";
import type { ServiceConfiguration } from "@/lib/service-flow";

type LocalizedOption = {
  ko: string;
  en: string;
  fareDeltaKRW: number;
};

type VehicleOption = LocalizedOption & {
  etaMinutes: number;
  noteKo: string;
  noteEn: string;
};

const VEHICLES: VehicleOption[] = [
  {
    ko: "일반 택시",
    en: "Standard taxi",
    noteKo: "최대 4명",
    noteEn: "Up to 4 people",
    etaMinutes: 4,
    fareDeltaKRW: 0,
  },
  {
    ko: "쾌적한 차량",
    en: "Comfort ride",
    noteKo: "넓은 좌석",
    noteEn: "More room",
    etaMinutes: 7,
    fareDeltaKRW: 7_000,
  },
  {
    ko: "대형 차량",
    en: "Large vehicle",
    noteKo: "짐이 많을 때",
    noteEn: "For extra luggage",
    etaMinutes: 11,
    fareDeltaKRW: 15_000,
  },
];

const ACTIVATIONS: LocalizedOption[] = [
  { ko: "오늘 개시", en: "Start today", fareDeltaKRW: 0 },
  { ko: "내일 개시", en: "Start tomorrow", fareDeltaKRW: 0 },
];

function destinationsFor(serviceId: string): LocalizedOption[] {
  if (serviceId === "kakao-t-airport") {
    return [
      {
        ko: "인천공항 제1터미널",
        en: "Incheon Airport T1",
        fareDeltaKRW: 0,
      },
      {
        ko: "인천공항 제2터미널",
        en: "Incheon Airport T2",
        fareDeltaKRW: 3_000,
      },
    ];
  }
  return [
    { ko: "성수", en: "Seongsu", fareDeltaKRW: 0 },
    { ko: "북촌한옥마을", en: "Bukchon Hanok Village", fareDeltaKRW: 4_000 },
  ];
}

function estimatedBaseFare(serviceId: string) {
  return serviceId === "kakao-t-airport" ? 62_000 : 24_000;
}

export function MobilityServiceCanvas({
  serviceId,
  lang,
  locationLabel,
  locationGranted,
  onChange,
}: {
  serviceId: string;
  lang: Lang;
  locationLabel: string;
  locationGranted: boolean;
  onChange: (configuration: ServiceConfiguration) => void;
}) {
  if (serviceId === "tmoney-visitor-pass") {
    return <TransitPassCanvas lang={lang} onChange={onChange} />;
  }

  return (
    <RideCanvas
      serviceId={serviceId}
      lang={lang}
      locationLabel={locationLabel}
      locationGranted={locationGranted}
      onChange={onChange}
    />
  );
}

function RideCanvas({
  serviceId,
  lang,
  locationLabel,
  locationGranted,
  onChange,
}: {
  serviceId: string;
  lang: Lang;
  locationLabel: string;
  locationGranted: boolean;
  onChange: (configuration: ServiceConfiguration) => void;
}) {
  const ko = lang === "ko";
  const destinations = useMemo(() => destinationsFor(serviceId), [serviceId]);
  const [destinationIndex, setDestinationIndex] = useState(0);
  const [vehicleIndex, setVehicleIndex] = useState(0);
  const [luggage, setLuggage] = useState(1);
  const [manualPickup, setManualPickup] = useState("");
  const [pickupVerification, setPickupVerification] = useState<
    "device" | "reference-checked" | "unchecked" | "unavailable"
  >(locationGranted ? "device" : "unchecked");
  const [pickupCheckId, setPickupCheckId] = useState("");
  const [checkingPickup, setCheckingPickup] = useState(false);
  const pickupCheckRequestRef = useRef("");
  const destination = destinations[destinationIndex] ?? destinations[0];
  const vehicle = VEHICLES[vehicleIndex] ?? VEHICLES[0];
  const fareDeltaKRW = destination.fareDeltaKRW + vehicle.fareDeltaKRW;
  const estimatedFare = estimatedBaseFare(serviceId) + fareDeltaKRW;
  const tripMinutes = serviceId === "kakao-t-airport" ? 54 : 28;
  const pickupKo = locationGranted ? "현재 위치" : manualPickup.trim();
  const pickupEn = locationGranted ? "Current location" : manualPickup.trim();
  const pickupLabel = pickupKo || (ko ? "출발지 미확정" : "Pickup not set");

  useEffect(() => {
    onChange({
      kind: "ride",
      pickupKo,
      pickupEn,
      destinationKo: destination.ko,
      destinationEn: destination.en,
      vehicleKo: vehicle.ko,
      vehicleEn: vehicle.en,
      fareDeltaKRW,
      luggage,
      pickupVerification: locationGranted ? "device" : pickupVerification,
      pickupCheckId: locationGranted ? "DEVICE-LOCATION" : pickupCheckId,
    });
  }, [
    destination,
    fareDeltaKRW,
    locationGranted,
    luggage,
    onChange,
    pickupCheckId,
    pickupEn,
    pickupKo,
    pickupVerification,
    vehicle,
  ]);

  const checkManualPickup = async () => {
    if (manualPickup.trim().length < 4 || checkingPickup) return;
    const pickupSnapshot = manualPickup.trim();
    const requestId = crypto.randomUUID();
    pickupCheckRequestRef.current = requestId;
    setCheckingPickup(true);
    await new Promise((resolve) => setTimeout(resolve, 450));
    if (pickupCheckRequestRef.current !== requestId) return;
    const outsideReferenceArea = /(부산|제주|busan|jeju)/i.test(
      pickupSnapshot,
    );
    setPickupVerification(
      outsideReferenceArea ? "unavailable" : "reference-checked",
    );
    setPickupCheckId(
      `PICKUP-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
    );
    setCheckingPickup(false);
  };

  return (
    <section
      aria-labelledby="ride-canvas-title"
      className="mt-6 overflow-hidden rounded-[24px] bg-card ring-1 ring-border"
    >
      <div className="p-5">
        <p className="text-[12px] font-semibold text-primary">
          {ko ? "이동 설정" : "RIDE SETUP"}
        </p>
        <h2
          id="ride-canvas-title"
          className="font-display mt-1 text-[22px] font-semibold"
        >
          {ko ? "어디로 이동하세요?" : "Where are you going?"}
        </h2>
      </div>

      <div
        role="img"
        aria-label={
          ko
            ? `${pickupLabel}에서 ${destination.ko}까지의 예상 경로`
            : `Estimated route from ${pickupLabel} to ${destination.en}`
        }
        className="relative mx-5 h-[190px] overflow-hidden rounded-[20px] bg-[#e9eee9] ring-1 ring-foreground/10"
      >
        <div className="absolute left-[18%] top-0 h-full w-4 bg-white/80" />
        <div className="absolute left-[61%] top-0 h-full w-3 bg-white/75" />
        <div className="absolute left-0 top-[31%] h-4 w-full bg-white/85" />
        <div className="absolute left-0 top-[72%] h-3 w-full bg-white/75" />
        <div className="absolute left-[18%] top-[72%] h-1.5 w-[32%] origin-left -rotate-[18deg] rounded-full bg-primary" />
        <div className="absolute left-[47%] top-[62%] h-1.5 w-[27%] origin-left -rotate-[25deg] rounded-full bg-primary" />
        <div className="absolute bottom-[18%] left-[15%] grid h-8 w-8 place-items-center rounded-full border-[7px] border-success bg-white shadow-sm" />
        <div className="absolute right-[18%] top-[18%] grid h-10 w-10 place-items-center rounded-full bg-destructive text-white shadow-sm">
          <MapPin className="h-5 w-5" aria-hidden="true" />
        </div>
        <span className="absolute right-3 top-3 rounded-full bg-ink px-3 py-1.5 text-[11px] font-semibold text-white">
          {ko ? `약 ${tripMinutes}분` : `About ${tripMinutes} min`}
        </span>
      </div>

      <div className="p-5">
        <div className="rounded-[18px] bg-surface-2 p-4">
          <div className="grid grid-cols-[12px_1fr] gap-x-3 gap-y-4">
            <span className="mt-1.5 h-3 w-3 rounded-full bg-success" />
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">
                {ko ? "출발" : "PICKUP"}
              </p>
              {locationGranted ? (
                <>
                  <strong className="mt-1 block text-[14px]">
                    {ko ? "현재 위치" : "Current location"}
                  </strong>
                  <span className="mt-1 block text-[11px] leading-4 text-muted-foreground">
                    {locationLabel}
                  </span>
                </>
              ) : (
                <label className="mt-1 block">
                  <span className="sr-only">
                    {ko ? "출발지 직접 입력" : "Enter pickup address"}
                  </span>
                  <span className="flex min-h-11 items-center gap-2 rounded-[12px] bg-card px-3 ring-1 ring-border focus-within:ring-primary">
                    <LocateFixed className="h-4 w-4 flex-shrink-0 text-primary" />
                    <input
                      value={manualPickup}
                      aria-describedby="pickup-coverage-status"
                      onChange={(event) => {
                        setManualPickup(event.target.value);
                        pickupCheckRequestRef.current = "";
                        setCheckingPickup(false);
                        setPickupVerification("unchecked");
                        setPickupCheckId("");
                      }}
                      placeholder={
                        ko ? "호텔·주소를 입력하세요" : "Enter hotel or address"
                      }
                      className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold outline-none placeholder:font-normal placeholder:text-muted-foreground"
                    />
                  </span>
                  <button
                    type="button"
                    disabled={manualPickup.trim().length < 4 || checkingPickup}
                    onClick={checkManualPickup}
                    className="mt-2 min-h-11 w-full rounded-[11px] bg-ink px-3 text-[12px] font-semibold text-white disabled:opacity-40"
                  >
                    {checkingPickup
                      ? ko
                        ? "출발 가능 여부 확인 중…"
                        : "Checking pickup…"
                      : pickupVerification === "reference-checked"
                        ? ko
                          ? "출발 가능 · 다시 확인"
                          : "Pickup available · check again"
                        : ko
                          ? "목업 제공 범위 확인"
                          : "Check reference coverage"}
                  </button>
                  <span
                    id="pickup-coverage-status"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                    className={`mt-2 block text-[11px] font-semibold ${pickupVerification === "unavailable" ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {checkingPickup
                      ? ko
                        ? "목업 제공 범위를 확인하고 있어요."
                        : "Checking reference coverage."
                      : pickupVerification === "reference-checked"
                        ? ko
                          ? "목업 제공 범위 안의 출발지예요."
                          : "Pickup is within the reference coverage."
                        : pickupVerification === "unavailable"
                          ? ko
                            ? "이 주소는 현재 목업 제공 범위 밖이에요. 서울 주소를 입력해 주세요."
                            : "This address is outside the reference coverage. Enter a Seoul address."
                          : ko
                            ? "주소 입력 후 목업 제공 범위를 확인해 주세요."
                            : "Enter an address, then check reference coverage."}
                  </span>
                </label>
              )}
            </div>
            <span className="mt-1.5 h-3 w-3 rounded-[3px] bg-destructive" />
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">
                {ko ? "도착" : "DESTINATION"}
              </p>
              <strong className="mt-1 block text-[14px]">
                {destination[lang]}
              </strong>
              <span className="mt-1 block text-[11px] text-muted-foreground">
                {ko ? destination.en : destination.ko}
              </span>
            </div>
          </div>
        </div>

        <div
          role="group"
          aria-label={ko ? "도착지 선택" : "Choose a destination"}
          className="mt-4 grid gap-2"
        >
          {destinations.map((option, index) => (
            <button
              key={option.en}
              type="button"
              aria-pressed={destinationIndex === index}
              onClick={() => setDestinationIndex(index)}
              className={`pressable flex min-h-12 items-center justify-between rounded-[14px] px-4 text-left text-[13px] font-semibold ring-1 ${
                destinationIndex === index
                  ? "bg-ink text-white ring-ink"
                  : "bg-background ring-border"
              }`}
            >
              <span>
                {option[lang]}
                <small className="ml-2 text-[11px] font-normal opacity-70">
                  {ko ? option.en : option.ko}
                </small>
              </span>
              {destinationIndex === index && (
                <Check className="h-4 w-4 text-gold" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-end justify-between">
          <div>
            <p className="text-[12px] font-semibold text-primary">
              {ko ? "차량 선택" : "CHOOSE A RIDE"}
            </p>
            <h3 className="font-display mt-1 text-[19px] font-semibold">
              {ko ? "예상 배차 시간과 요금" : "Pickup time and fare"}
            </h3>
          </div>
          <strong className="tabular text-[17px]">
            ₩{estimatedFare.toLocaleString()}
          </strong>
        </div>
        <div
          role="group"
          aria-label={ko ? "차량 유형" : "Vehicle type"}
          className="mt-3 grid gap-2"
        >
          {VEHICLES.map((option, index) => (
            <button
              key={option.en}
              type="button"
              aria-pressed={vehicleIndex === index}
              onClick={() => setVehicleIndex(index)}
              className={`pressable flex min-h-[68px] items-center justify-between rounded-[16px] px-4 text-left ring-1 ${
                vehicleIndex === index
                  ? "bg-primary/10 ring-primary"
                  : "bg-background ring-border"
              }`}
            >
              <span>
                <strong className="block text-[13px]">{option[lang]}</strong>
                <small className="mt-1 block text-[11px] text-muted-foreground">
                  {ko ? option.noteKo : option.noteEn} · {option.etaMinutes}
                  {ko ? "분 후" : " min"}
                </small>
              </span>
              <span className="tabular text-[13px] font-semibold">
                {option.fareDeltaKRW === 0
                  ? ko
                    ? "기본"
                    : "Base"
                  : `+₩${option.fareDeltaKRW.toLocaleString()}`}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-5 flex min-h-14 items-center justify-between border-t border-foreground/10 pt-4">
          <div className="flex items-center gap-2">
            <Luggage className="h-4 w-4 text-primary" aria-hidden="true" />
            <div>
              <p className="text-[13px] font-semibold">
                {ko ? "캐리어" : "Luggage"}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {ko ? "차량 공간 확인용" : "Helps check vehicle space"}
              </p>
            </div>
          </div>
          <div
            role="group"
            aria-label={ko ? "캐리어 수" : "Number of bags"}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              aria-label={ko ? "캐리어 한 개 줄이기" : "Remove one bag"}
              disabled={luggage === 0}
              onClick={() => setLuggage((value) => Math.max(0, value - 1))}
              className="pressable grid h-11 w-11 place-items-center rounded-full bg-surface-2 text-[18px] disabled:opacity-35"
            >
              −
            </button>
            <strong className="tabular min-w-5 text-center text-[14px]">
              {luggage}
            </strong>
            <button
              type="button"
              aria-label={ko ? "캐리어 한 개 추가하기" : "Add one bag"}
              disabled={luggage === 4}
              onClick={() => setLuggage((value) => Math.min(4, value + 1))}
              className="pressable grid h-11 w-11 place-items-center rounded-full bg-surface-2 text-[18px] disabled:opacity-35"
            >
              +
            </button>
          </div>
        </div>
        <p className="mt-4 text-[11px] leading-5 text-muted-foreground">
          {ko
            ? "시간과 요금은 호출 전 예상값이며 교통 상황과 제휴사 조건에 따라 달라질 수 있어요."
            : "Times and fares are estimates before request and may change with traffic and provider conditions."}
        </p>
      </div>
    </section>
  );
}

function TransitPassCanvas({
  lang,
  onChange,
}: {
  lang: Lang;
  onChange: (configuration: ServiceConfiguration) => void;
}) {
  const ko = lang === "ko";
  const [activationIndex, setActivationIndex] = useState(0);
  const activation = ACTIVATIONS[activationIndex] ?? ACTIVATIONS[0];
  const { activationAt, expiresAt } = useMemo(() => {
    const starts = new Date();
    starts.setHours(0, 0, 0, 0);
    starts.setDate(starts.getDate() + activationIndex);
    const expires = new Date(starts);
    expires.setDate(expires.getDate() + 3);
    return {
      activationAt: starts.toISOString(),
      expiresAt: expires.toISOString(),
    };
  }, [activationIndex]);

  useEffect(() => {
    onChange({
      kind: "transit-pass",
      activationKo: activation.ko,
      activationEn: activation.en,
      activationAt,
      expiresAt,
      durationDays: 3,
      fareDeltaKRW: activation.fareDeltaKRW,
    });
  }, [activation, activationAt, expiresAt, onChange]);

  return (
    <section
      aria-labelledby="transit-pass-title"
      className="mt-6 overflow-hidden rounded-[24px] bg-card ring-1 ring-border"
    >
      <div className="bg-ink p-5 text-white">
        <p className="text-[12px] font-semibold text-gold">
          T-money · {ko ? "서울 교통패스" : "SEOUL TRANSIT PASS"}
        </p>
        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <h2
              id="transit-pass-title"
              className="font-display text-[30px] font-semibold"
            >
              {ko ? "3일권" : "3-day pass"}
            </h2>
            <p className="mt-2 text-[13px] leading-5 text-white/70">
              {ko
                ? "개시 후 연속 3일 동안 사용"
                : "Valid for 3 consecutive days after activation"}
            </p>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-2 text-[12px] font-semibold">
            {ko ? "모바일 발급" : "Mobile pass"}
          </span>
        </div>
        <div className="mt-6 flex items-center gap-2" aria-hidden="true">
          {["bg-[#2b70c9]", "bg-[#35a968]", "bg-[#e05b63]", "bg-[#d69a28]"].map(
            (color) => (
              <span
                key={color}
                className={`h-2 flex-1 rounded-full ${color}`}
              />
            ),
          )}
        </div>
      </div>

      <div className="p-5">
        <dl className="divide-y divide-foreground/10 border-y border-foreground/10">
          <PassFact
            label={ko ? "이용 범위" : "Coverage"}
            value={ko ? "서울 지하철·버스" : "Seoul subway and bus"}
          />
          <PassFact
            label={ko ? "유효 기간" : "Validity"}
            value={
              ko
                ? "개시 시점부터 연속 3일"
                : "3 consecutive days from activation"
            }
          />
          <PassFact
            label={ko ? "발급 방식" : "Delivery"}
            value={ko ? "결제 후 모바일 패스" : "Mobile pass after payment"}
          />
        </dl>

        <fieldset className="mt-6">
          <legend className="text-[12px] font-semibold text-primary">
            {ko ? "개시일 선택" : "CHOOSE ACTIVATION"}
          </legend>
          <p className="font-display mt-1 text-[19px] font-semibold">
            {ko ? "언제부터 사용하세요?" : "When will you start?"}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {ACTIVATIONS.map((option, index) => (
              <button
                key={option.en}
                type="button"
                aria-pressed={activationIndex === index}
                onClick={() => setActivationIndex(index)}
                className={`pressable flex min-h-14 items-center justify-between rounded-[14px] px-4 text-left text-[13px] font-semibold ring-1 ${
                  activationIndex === index
                    ? "bg-ink text-white ring-ink"
                    : "bg-background ring-border"
                }`}
              >
                {option[lang]}
                {activationIndex === index && (
                  <Check className="h-4 w-4 text-gold" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-5 rounded-[16px] bg-success-surface p-4 text-success">
          <strong className="text-[13px]">
            {ko
              ? `${activation.ko} · 3일 연속`
              : `${activation.en} · 3 consecutive days`}
          </strong>
          <p className="mt-1 text-[11px] leading-5">
            {ko
              ? "결제가 끝나면 Wallet에서 패스와 만료 시각을 확인할 수 있어요."
              : "After payment, find the pass and its expiry time in Wallet."}
          </p>
        </div>
      </div>
    </section>
  );
}

function PassFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 text-[13px]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}
