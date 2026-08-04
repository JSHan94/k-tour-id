"use client";

import {
  CalendarClock,
  CarFront,
  Check,
  Clock3,
  Home,
  PackageCheck,
  TicketCheck,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ExternalServiceOrder } from "@/lib/external-service-orders";
import type { Lang } from "@/lib/i18n/dict";
import type { ServiceConfiguration } from "@/lib/service-flow";
import type { LocalizedText } from "@/lib/types";

type RideConfiguration = Extract<ServiceConfiguration, { kind: "ride" }>;
type FoodConfiguration = Extract<
  ServiceConfiguration,
  { kind: "food-delivery" }
>;
type TransitPassConfiguration = Extract<
  ServiceConfiguration,
  { kind: "transit-pass" }
>;

export function ServiceLiveTracker({
  order,
  lang,
  steps,
  currentStep,
}: {
  order: ExternalServiceOrder;
  lang: Lang;
  steps: LocalizedText[];
  currentStep: number;
}) {
  const kind = (order.configuration as { kind?: string } | null | undefined)
    ?.kind;
  const stepIndex = clampStep(currentStep, steps.length);
  const currentStatus = steps[stepIndex]?.[lang];
  const statusAnnouncement = currentStatus ? (
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {lang === "ko" ? "현재 예상 상태" : "Current expected status"}: {currentStatus}
    </p>
  ) : null;

  if (
    kind === "ride" ||
    kind === "ride-hailing" ||
    (order.category === "mobility" && order.serviceId !== "tmoney-visitor-pass")
  ) {
    return (
      <TrackerShell order={order} lang={lang}>
        {statusAnnouncement}
        <RideTracker order={order} lang={lang} currentStep={stepIndex} />
        <AccessibleSteps steps={steps} currentStep={stepIndex} lang={lang} />
      </TrackerShell>
    );
  }

  if (kind === "food-delivery") {
    return (
      <TrackerShell order={order} lang={lang}>
        {statusAnnouncement}
        <FoodTracker order={order} lang={lang} currentStep={stepIndex} />
        <AccessibleSteps steps={steps} currentStep={stepIndex} lang={lang} />
      </TrackerShell>
    );
  }

  if (kind === "transit-pass" || order.serviceId === "tmoney-visitor-pass") {
    return (
      <TrackerShell order={order} lang={lang}>
        {statusAnnouncement}
        <TransitPassTracker order={order} lang={lang} />
        <AccessibleSteps steps={steps} currentStep={stepIndex} lang={lang} />
      </TrackerShell>
    );
  }

  return (
    <TrackerShell order={order} lang={lang}>
      {statusAnnouncement}
      <AccessibleSteps steps={steps} currentStep={stepIndex} lang={lang} />
    </TrackerShell>
  );
}

function TrackerShell({
  order,
  lang,
  children,
}: {
  order: ExternalServiceOrder;
  lang: Lang;
  children: React.ReactNode;
}) {
  const ko = lang === "ko";
  const updatedAt = order.statusUpdatedAt || order.createdAt;

  return (
    <section
      aria-labelledby="service-live-status-title"
      className="rounded-[22px] bg-card p-5 ring-1 ring-border"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold text-primary">
            {ko ? "연동 상태 미리보기" : "INTEGRATION STATUS PREVIEW"}
          </p>
          <h2
            id="service-live-status-title"
            className="font-display mt-1 text-[21px] font-semibold leading-tight"
          >
            {ko ? order.title : order.titleEn}
          </h2>
        </div>
        <p className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-secondary px-3 text-[11px] font-semibold text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{ko ? "최근 갱신" : "Updated"}</span>
          <time dateTime={updatedAt}>{formatTime(updatedAt, lang)}</time>
        </p>
      </div>

      <div className="mt-5">{children}</div>

      <p className="mt-5 border-t border-foreground/10 pt-4 text-[11px] leading-5 text-muted-foreground">
        {ko
          ? "현재 상태는 목업용 예상 흐름이에요. 실제 연동에서는 파트너가 서명한 이벤트만 K‑Tour ID 이용 내역에 기록해요."
          : "This is a reference status flow. A real integration records only partner-signed events in K‑Tour ID history."}
      </p>
    </section>
  );
}

function RideTracker({
  order,
  lang,
  currentStep,
}: {
  order: ExternalServiceOrder;
  lang: Lang;
  currentStep: number;
}) {
  const ko = lang === "ko";
  const route = routeForOrder(order, lang);
  const configuration = order.configuration as RideConfiguration | null;
  const eta = rideEta(
    order.serviceId,
    currentStep,
    order.status === "completed",
    lang,
  );
  const assigned = currentStep >= 1 && order.status !== "failed";

  return (
    <div>
      <div
        className="relative min-h-[220px] overflow-hidden rounded-[20px] bg-[#111821] ring-1 ring-white/10"
        aria-hidden="true"
      >
        <div className="absolute left-[8%] top-[10%] h-14 w-[22%] rounded-xl bg-[#1d2734]" />
        <div className="absolute left-[37%] top-[4%] h-20 w-[20%] rounded-xl bg-[#1d2734]" />
        <div className="absolute right-[7%] top-[12%] h-16 w-[23%] rounded-xl bg-[#1d2734]" />
        <div className="absolute bottom-[9%] left-[6%] h-20 w-[18%] rounded-xl bg-[#1d2734]" />
        <div className="absolute bottom-[7%] left-[34%] h-14 w-[25%] rounded-xl bg-[#1d2734]" />
        <div className="absolute bottom-[11%] right-[7%] h-20 w-[20%] rounded-xl bg-[#1d2734]" />
        <div className="absolute inset-x-0 top-[48%] h-3 bg-[#273548]" />
        <div className="absolute bottom-0 left-[48%] top-0 w-3 bg-[#273548]" />
        <div className="absolute bottom-[20%] left-[13%] h-2 w-[73%] origin-left -rotate-[16deg] rounded-full bg-[#5489ff]" />
        <span className="absolute bottom-[15%] left-[11%] h-8 w-8 rounded-full border-[8px] border-[#70dca2] bg-[#111821]" />
        <span className="absolute right-[10%] top-[22%] grid h-10 w-10 place-items-center rounded-full bg-[#e65a5f] text-sm font-bold text-white">
          ●
        </span>
        <span className="absolute right-4 top-4 rounded-full bg-black/70 px-3 py-2 text-[12px] font-semibold text-white">
          {eta}
        </span>
      </div>

      <div className="mt-4 rounded-[18px] bg-surface-2 p-4">
        <div className="grid grid-cols-[20px_minmax(0,1fr)] gap-x-3 gap-y-4">
          <span
            className="mt-1 h-3 w-3 rounded-full bg-success"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">
              {ko ? "출발" : "Pickup"}
            </p>
            <p className="mt-0.5 break-words text-[13px] font-semibold">
              {route.origin}
            </p>
          </div>
          <span
            className="mt-1 h-3 w-3 rounded-[3px] bg-destructive"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">
              {ko ? "도착" : "Destination"}
            </p>
            <p className="mt-0.5 break-words text-[13px] font-semibold">
              {route.destination}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 border-t border-foreground/10 pt-4 sm:grid-cols-2">
          <StatusFact
            icon={UserRound}
            label={ko ? "기사·차량" : "Driver & vehicle"}
            value={
              assigned
                ? configuration
                  ? ko
                    ? `배차 정보 확인됨 · ${configuration.vehicleKo}`
                    : `Match received · ${configuration.vehicleEn}`
                  : ko
                    ? "배차 정보 확인됨 · 일반 차량"
                    : "Match received · standard vehicle"
                : ko
                  ? "배차 대기 중"
                  : "Waiting for a match"
            }
          />
          <StatusFact
            icon={CarFront}
            label={ko ? "예상 이동" : "Estimated journey"}
            value={eta}
          />
        </div>
      </div>
    </div>
  );
}

function FoodTracker({
  order,
  lang,
  currentStep,
}: {
  order: ExternalServiceOrder;
  lang: Lang;
  currentStep: number;
}) {
  const ko = lang === "ko";
  const configuration = order.configuration as FoodConfiguration | null;
  const eta = foodEta(
    order.serviceId,
    currentStep,
    order.status === "completed",
    lang,
  );
  const itemLabel = configuration?.items.length
    ? configuration.items
        .map((item) => {
          const option = ko ? item.optionKo : item.optionEn;
          return ko
            ? `${item.nameKo}${option ? ` · ${option}` : ""} ${item.quantity}개`
            : `${item.nameEn}${option ? ` · ${option}` : ""} ×${item.quantity}`;
        })
        .join(" · ")
    : (ko ? order.optionLabel : order.optionLabelEn).split(" · ")[0];

  return (
    <div className="rounded-[20px] bg-surface-2 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground">
            {ko ? "현재 상태" : "Current status"}
          </p>
          <p className="mt-1 text-[18px] font-semibold">
            {foodStatusLabel(currentStep, lang)}
          </p>
        </div>
        <p className="inline-flex min-h-11 items-center rounded-full bg-success-surface px-3 text-[12px] font-semibold text-success">
          {eta}
        </p>
      </div>

      <div className="mt-4 grid gap-3 border-t border-foreground/10 pt-4">
        <StatusFact
          icon={PackageCheck}
          label={ko ? "주문 상품" : "Order"}
          value={itemLabel}
        />
        <StatusFact
          icon={Home}
          label={ko ? "수령지" : "Delivery address"}
          value={
            configuration?.address ||
            (ko ? "선택한 수령지" : "Selected delivery address")
          }
        />
      </div>
    </div>
  );
}

function TransitPassTracker({
  order,
  lang,
}: {
  order: ExternalServiceOrder;
  lang: Lang;
}) {
  const ko = lang === "ko";
  const configuration = order.configuration as TransitPassConfiguration | null;
  const activationAt = new Date(configuration?.activationAt ?? order.createdAt);
  const expiresAt = new Date(
    configuration?.expiresAt ??
      activationAt.getTime() + (configuration?.durationDays ?? 3) * 86_400_000,
  );
  const now = Date.now();
  const scheduled = now < activationAt.getTime();
  const expired = now >= expiresAt.getTime();
  const active = !scheduled && !expired && order.status !== "refunded";

  return (
    <div className="rounded-[20px] bg-ink p-5 text-white">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium text-white/65">
            {ko ? "모바일 교통패스" : "Mobile transit pass"}
          </p>
          <p className="mt-1 text-[20px] font-semibold">
            {configuration
              ? ko
                ? `${configuration.activationKo} · ${configuration.durationDays}일권`
                : `${configuration.activationEn} · ${configuration.durationDays}-day pass`
              : ko
                ? order.optionLabel
                : order.optionLabelEn}
          </p>
        </div>
        <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-3 text-[12px] font-semibold">
          {active ? (
            <Check className="h-4 w-4 text-[#70dca2]" aria-hidden="true" />
          ) : (
            <Clock3 className="h-4 w-4 text-gold" aria-hidden="true" />
          )}
          {expired
            ? ko
              ? "사용 기간 종료"
              : "Expired"
            : scheduled
              ? ko
                ? "개시 예정"
                : "Scheduled"
              : active
                ? ko
                  ? "사용 가능"
                  : "Ready to use"
                : ko
                  ? "발급 확인 중"
                  : "Issuance pending"}
        </span>
      </div>

      <div className="mt-5 grid gap-3 border-t border-white/15 pt-4 sm:grid-cols-2">
        <StatusFact
          icon={TicketCheck}
          label={ko ? "활성 상태" : "Activation"}
          value={
            expired
              ? ko
                ? "만료"
                : "Expired"
              : scheduled
                ? ko
                  ? "개시 예정"
                  : "Scheduled"
                : active
                  ? ko
                    ? "활성"
                    : "Active"
                  : ko
                    ? "준비 중"
                    : "Preparing"
          }
          dark
        />
        <StatusFact
          icon={CalendarClock}
          label={ko ? "예상 만료" : "Expected expiry"}
          value={new Intl.DateTimeFormat(ko ? "ko-KR" : "en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(expiresAt)}
          dark
        />
      </div>
    </div>
  );
}

function AccessibleSteps({
  steps,
  currentStep,
  lang,
}: {
  steps: LocalizedText[];
  currentStep: number;
  lang: Lang;
}) {
  const ko = lang === "ko";
  if (steps.length === 0) return null;

  return (
    <ol
      aria-label={ko ? "서비스 진행 단계" : "Service progress"}
      className="mt-5 grid gap-2"
    >
      {steps.map((step, index) => {
        const complete = index < currentStep;
        const active = index === currentStep;
        return (
          <li
            key={`${step.ko}-${index}`}
            aria-current={active ? "step" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-[12px] px-3 py-2 text-[12px] ${active ? "bg-primary/8 font-semibold text-foreground" : "text-muted-foreground"}`}
          >
            <span
              className={`grid h-6 w-6 flex-none place-items-center rounded-full border text-[11px] font-bold ${complete ? "border-success bg-success text-white" : active ? "border-primary bg-primary text-white" : "border-foreground/20 bg-card"}`}
              aria-hidden="true"
            >
              {complete ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </span>
            <span className="min-w-0 flex-1 break-words">{step[lang]}</span>
            <span className="font-medium">
              {complete
                ? ko
                  ? "완료"
                  : "Done"
                : active
                  ? ko
                    ? "진행 중"
                    : "In progress"
                  : ko
                    ? "예정"
                    : "Upcoming"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function StatusFact({
  icon: Icon,
  label,
  value,
  dark = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  dark?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span
        className={`grid h-10 w-10 flex-none place-items-center rounded-full ${dark ? "bg-white/10 text-white" : "bg-card text-primary"}`}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 pt-0.5">
        <p
          className={`text-[11px] ${dark ? "text-white/60" : "text-muted-foreground"}`}
        >
          {label}
        </p>
        <p className="mt-0.5 break-words text-[12px] font-semibold leading-5">
          {value}
        </p>
      </div>
    </div>
  );
}

function routeForOrder(order: ExternalServiceOrder, lang: Lang) {
  const configuration = order.configuration as RideConfiguration | null;
  if (configuration?.pickupKo && configuration.destinationKo) {
    return {
      origin: lang === "ko" ? configuration.pickupKo : configuration.pickupEn,
      destination:
        lang === "ko"
          ? configuration.destinationKo
          : configuration.destinationEn,
    };
  }
  const label = lang === "ko" ? order.optionLabel : order.optionLabelEn;
  const routeText = label.split(" · ")[0] ?? label;
  const [origin, destination] = routeText.split("→").map((part) => part.trim());
  return {
    origin: origin || (lang === "ko" ? "현재 위치" : "Current location"),
    destination:
      destination || (lang === "ko" ? "선택한 목적지" : "Selected destination"),
  };
}

function rideEta(
  serviceId: string,
  currentStep: number,
  completed: boolean,
  lang: Lang,
) {
  if (completed) return lang === "ko" ? "도착 완료" : "Arrived";
  const initial = serviceId === "kakao-t-airport" ? 54 : 28;
  const minutes = Math.max(4, initial - currentStep * 8);
  return lang === "ko" ? `약 ${minutes}분` : `About ${minutes} min`;
}

function foodEta(
  serviceId: string,
  currentStep: number,
  completed: boolean,
  lang: Lang,
) {
  if (completed) return lang === "ko" ? "도착 완료" : "Delivered";
  const initial = serviceId === "baemin-local-meal" ? 32 : 24;
  const minutes = Math.max(5, initial - currentStep * 7);
  return lang === "ko" ? `약 ${minutes}분` : `About ${minutes} min`;
}

function foodStatusLabel(currentStep: number, lang: Lang) {
  const labels = {
    ko: ["주문 확인 중", "조리 중", "배달 중", "배달 완료"],
    en: ["Confirming order", "Preparing", "On the way", "Delivered"],
  };
  const choices = labels[lang];
  return choices[Math.min(currentStep, choices.length - 1)] ?? choices[0];
}

function formatTime(value: string, lang: Lang) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()))
    return lang === "ko" ? "확인 전" : "Not available";
  return new Intl.DateTimeFormat(lang === "ko" ? "ko-KR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function clampStep(currentStep: number, length: number) {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(currentStep, length - 1));
}
