"use client";

import { useEffect, useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import type { Lang } from "@/lib/i18n/dict";
import type {
  ServiceConfiguration,
  ServiceFlowDefinition,
} from "@/lib/service-flow";

const PICKUP_TIMES = [
  { ko: "10분 후", en: "In 10 min" },
  { ko: "20분 후", en: "In 20 min" },
  { ko: "오늘 18:00", en: "Today 18:00" },
] as const;

export function ServiceConfigurator({
  flow,
  lang,
  onChange,
}: {
  serviceId: string;
  flow: ServiceFlowDefinition;
  lang: Lang;
  locationLabel: string;
  onChange: (configuration: ServiceConfiguration | null) => void;
}) {
  const ko = lang === "ko";
  const [quantity, setQuantity] = useState(1);
  const [pickupTimeIndex, setPickupTimeIndex] = useState(1);

  useEffect(() => {
    if (flow.intent === "shopping") {
      const pickupTime = PICKUP_TIMES[pickupTimeIndex] ?? PICKUP_TIMES[1];
      onChange({
        kind: "store-pickup",
        pickupTimeKo: pickupTime.ko,
        pickupTimeEn: pickupTime.en,
        quantity,
      });
    } else onChange(null);
  }, [flow.intent, onChange, pickupTimeIndex, quantity]);

  if (flow.intent === "shopping") {
    return (
      <section className="mt-6 rounded-[20px] bg-surface-2 p-5 ring-1 ring-border">
        <p className="text-[12px] font-semibold text-primary">
          {ko ? "픽업 상세" : "Pickup details"}
        </p>
        <div
          role="group"
          aria-label={ko ? "픽업 시간" : "Pickup time"}
          className="mt-4 flex flex-wrap gap-2"
        >
          {PICKUP_TIMES.map((time, index) => (
            <button
              key={time.en}
              type="button"
              aria-pressed={pickupTimeIndex === index}
              onClick={() => setPickupTimeIndex(index)}
              className={`pressable inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold ${pickupTimeIndex === index ? "bg-ink text-white" : "bg-card text-muted-foreground ring-1 ring-border"}`}
            >
              {pickupTimeIndex === index && <Check className="h-3.5 w-3.5" />}
              {time[lang]}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-foreground/10 pt-4">
          <p className="text-[13px] font-semibold">
            {ko ? "수량" : "Quantity"}
          </p>
          <QuantityControl
            value={quantity}
            onChange={setQuantity}
            label={ko ? "상품 수량" : "Item quantity"}
          />
        </div>
      </section>
    );
  }

  return null;
}

function QuantityControl({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-3">
      <button
        type="button"
        aria-label={`${label} −1`}
        disabled={value <= 1}
        onClick={() => onChange(Math.max(1, value - 1))}
        className="pressable grid h-11 w-11 place-items-center rounded-full bg-card ring-1 ring-border disabled:opacity-35"
      >
        <Minus className="h-4 w-4" />
      </button>
      <strong className="tabular min-w-5 text-center text-[15px]">
        {value}
      </strong>
      <button
        type="button"
        aria-label={`${label} +1`}
        disabled={value >= 5}
        onClick={() => onChange(Math.min(5, value + 1))}
        className="pressable grid h-11 w-11 place-items-center rounded-full bg-card ring-1 ring-border disabled:opacity-35"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
