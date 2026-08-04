"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CarFront,
  Check,
  ChevronRight,
  Clock3,
  MapPin,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Utensils,
  UsersRound,
  X,
} from "lucide-react";
import { BrandMark } from "@/components/app/brand";
import { LocationControl } from "@/components/app/location-control";
import { LangToggle, PhoneFrame } from "@/components/app/shell";
import { itemsForUserType } from "@/lib/catalog";
import {
  COMMERCIAL_SERVICES,
  type CommercialService,
} from "@/lib/commercial-services";
import { isCredentialUsable } from "@/lib/credential-status";
import { useExternalServiceOrders } from "@/lib/external-service-orders";
import { useLang } from "@/lib/i18n/lang-provider";
import {
  distanceKm,
  pointProximityLabel,
  proximityLabel,
  useNearbyLocation,
} from "@/lib/location/location-provider";
import {
  commercialCategoryToIntent,
  CORE_INTENTS,
  flowForService,
  serviceCategoryToIntent,
  type CoreIntent,
} from "@/lib/service-flow";
import { useApp } from "@/lib/store/app-provider";
import type { MarketplaceItem, Voucher } from "@/lib/types";
import { cn } from "@/lib/utils";
import { isVoucherAvailable } from "@/lib/voucher-policy";

type Filter = "all" | CoreIntent;
type UnifiedOffer =
  | {
      kind: "marketplace";
      item: MarketplaceItem;
      distance: number;
      rank: number;
    }
  | {
      kind: "partner";
      service: CommercialService;
      distance: number;
      rank: number;
    };

const INTENT_ORDER: CoreIntent[] = [
  "mobility",
  "food",
  "shopping",
  "experience",
];
const INTENT_ICONS = {
  mobility: CarFront,
  food: Utensils,
  shopping: ShoppingBag,
  experience: CalendarDays,
} satisfies Record<CoreIntent, ComponentType<{ className?: string }>>;

export default function ExplorePage() {
  const router = useRouter();
  const { session, vouchers, hydrated } = useApp();
  const { lang } = useLang();
  const { location, status: locationStatus } = useNearbyLocation();
  const ko = lang === "ko";
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const externalOrders = useExternalServiceOrders(
    session.identity?.did ?? "guest",
  );

  useEffect(() => {
    if (hydrated && !session.onboarded) router.replace("/onboarding");
    const focus = new URLSearchParams(window.location.search).get("focus");
    const normalized =
      focus === "delivery"
        ? "food"
        : focus === "convenience"
          ? "shopping"
          : focus;
    if (normalized && INTENT_ORDER.includes(normalized as CoreIntent))
      setFilter(normalized as CoreIntent);
  }, [hydrated, router, session.onboarded]);

  const userType = session.userType ?? "foreigner";
  const offers = useMemo<UnifiedOffer[]>(() => {
    const nearby = locationStatus === "granted" ? location : null;
    const marketplace: UnifiedOffer[] = itemsForUserType(userType).map(
      (item, index) => ({
        kind: "marketplace",
        item,
        distance:
          nearby && item.geo
            ? distanceKm(nearby, item.geo)
            : Number.POSITIVE_INFINITY,
        rank: index * 2,
      }),
    );
    const partner: UnifiedOffer[] = COMMERCIAL_SERVICES.map(
      (service, index) => ({
        kind: "partner" as const,
        service,
        distance: nearby
          ? distanceKm(nearby, service.geo)
          : Number.POSITIVE_INFINITY,
        rank: index * 2 + 1,
      }),
    ).filter((offer) => !nearby || offer.distance <= offer.service.coverageKm);
    return [...marketplace, ...partner];
  }, [location, locationStatus, userType]);

  const shown = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return offers
      .filter((offer) => {
        const intent =
          offer.kind === "marketplace"
            ? serviceCategoryToIntent(offer.item.category)
            : commercialCategoryToIntent(offer.service.category);
        if (!intent || (filter !== "all" && intent !== filter)) return false;
        if (!normalized) return true;
        const searchable =
          offer.kind === "marketplace"
            ? [
                offer.item.title.ko,
                offer.item.title.en,
                offer.item.merchant,
                offer.item.location.ko,
                offer.item.location.en,
              ]
            : [
                offer.service.name.ko,
                offer.service.name.en,
                offer.service.title.ko,
                offer.service.title.en,
                offer.service.context.ko,
                offer.service.context.en,
              ];
        return searchable.some((value) =>
          value.toLowerCase().includes(normalized),
        );
      })
      .sort((a, b) => {
        if (Number.isFinite(a.distance) || Number.isFinite(b.distance))
          return a.distance - b.distance;
        return a.rank - b.rank;
      });
  }, [filter, offers, query]);

  if (!session.onboarded) return null;
  const activeIntent = filter === "all" ? null : CORE_INTENTS[filter];

  const chooseIntent = (intent: CoreIntent) => {
    setFilter(intent);
    window.history.replaceState(null, "", `/explore?focus=${intent}`);
  };

  return (
    <PhoneFrame>
      <header className="safe-top px-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold text-primary">
              {ko ? "한 곳에서 찾고 이용해요" : "ONE PLACE TO EXPLORE"}
            </p>
            <h1 className="font-display text-balance mt-1 text-[30px] font-semibold leading-[1.2] tracking-[-0.035em]">
              {ko ? "지금 무엇이\n필요하세요?" : "What do you\nneed right now?"}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <LangToggle />
            <Link
              href="/alerts"
              aria-label={ko ? "알림" : "Alerts"}
              className="pressable grid h-11 w-11 place-items-center rounded-full bg-secondary"
            >
              <Bell className="h-[18px] w-[18px]" />
            </Link>
          </div>
        </div>

        {filter === "all" ? (
          <div
            role="group"
            className="mt-6 grid grid-cols-2 gap-2.5"
            aria-label={ko ? "서비스 목적" : "Service intents"}
          >
            {INTENT_ORDER.map((intent) => {
              const definition = CORE_INTENTS[intent];
              const Icon = INTENT_ICONS[intent];
              return (
                <button
                  key={intent}
                  type="button"
                  onClick={() => chooseIntent(intent)}
                  className="pressable min-h-[92px] rounded-[18px] bg-card p-4 text-left text-foreground ring-1 ring-border"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <strong className="mt-3 block text-[14px]">
                    {definition.label[lang]}
                  </strong>
                  <span className="mt-1 block text-[12px] text-muted-foreground">
                    {definition.hint[lang]}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div
            role="group"
            aria-label={ko ? "서비스 목적" : "Service intents"}
            className="no-scrollbar -mx-6 mt-5 flex gap-2 overflow-x-auto px-6 pb-1"
          >
            <button
              type="button"
              onClick={() => {
                setFilter("all");
                window.history.replaceState(null, "", "/explore");
              }}
              className="pressable min-h-11 flex-shrink-0 rounded-full bg-secondary px-4 text-[12px] font-semibold text-muted-foreground"
            >
              {ko ? "전체" : "All"}
            </button>
            {INTENT_ORDER.map((intent) => {
              const Icon = INTENT_ICONS[intent];
              return (
                <button
                  key={intent}
                  type="button"
                  aria-pressed={filter === intent}
                  onClick={() => chooseIntent(intent)}
                  className={cn(
                    "pressable inline-flex min-h-11 flex-shrink-0 items-center gap-2 rounded-full px-4 text-[12px] font-semibold",
                    filter === intent
                      ? "bg-ink text-white"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {CORE_INTENTS[intent].label[lang]}
                </button>
              );
            })}
          </div>
        )}
        <div className="mt-3">
          <LocationControl compact />
        </div>

        <label className="mt-4 flex min-h-12 items-center gap-3 rounded-[14px] bg-card px-4 ring-1 ring-foreground/10 focus-within:ring-primary/40">
          <Search className="h-[18px] w-[18px] text-muted-foreground" />
          <input
            aria-label={ko ? "서비스·지역 검색" : "Search services and places"}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              ko ? "서비스, 음식, 장소 검색" : "Search services, food, places"
            }
            className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={ko ? "검색어 지우기" : "Clear search"}
              className="grid h-9 w-9 place-items-center"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </label>
      </header>

      <main className="px-6 pb-8">
        <section className="border-t border-foreground/10 pt-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-success">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {locationStatus === "granted"
                  ? ko
                    ? "내 위치에서 가까운 순"
                    : "Closest to your location"
                  : ko
                    ? "내 K-Tour ID로 가능한 순"
                    : "Matched to your K-Tour ID"}
              </p>
              <h2 className="font-display text-balance mt-1 text-[24px] font-semibold">
                {activeIntent
                  ? activeIntent.prompt[lang]
                  : ko
                    ? "오늘 가능한 선택"
                    : "Available today"}
              </h2>
            </div>
            <span
              role="status"
              aria-live="polite"
              className="flex-shrink-0 text-[12px] text-muted-foreground"
            >
              {shown.length}
              {ko ? "개" : " choices"}
            </span>
          </div>

          {shown.length > 0 ? (
            <div className="mt-4 space-y-3">
              {shown.map((offer) =>
                offer.kind === "marketplace" ? (
                  <MarketplaceOfferCard
                    key={`market-${offer.item.id}`}
                    item={offer.item}
                    voucher={vouchers.find(
                      (voucher) => voucher.id === offer.item.voucherId,
                    )}
                    proximity={proximityLabel(offer.item, location, lang)}
                  />
                ) : (
                  <PartnerOfferCard
                    key={`partner-${offer.service.id}`}
                    service={offer.service}
                    userType={session.userType ?? undefined}
                    credentialActive={
                      isCredentialUsable(session.capsule) &&
                      !!session.capsule?.services.includes(
                        offer.service.serviceKey,
                      )
                    }
                    usedBenefitIds={externalOrders
                      .filter(
                        (order) =>
                          ["confirmed", "completed", "refund-pending"].includes(
                            order.status,
                          ) && order.benefitAppliedKRW > 0,
                      )
                      .map((order) => order.benefitId)}
                    proximity={
                      locationStatus === "granted"
                        ? pointProximityLabel(offer.service.geo, location, lang)
                        : undefined
                    }
                  />
                ),
              )}
            </div>
          ) : (
            <div className="mt-8 rounded-[20px] bg-surface-2 px-5 py-8 text-center ring-1 ring-border">
              <Search className="mx-auto h-5 w-5 text-muted-foreground" />
              <h3 className="font-display mt-4 text-[21px] font-semibold">
                {ko ? "맞는 선택을 찾지 못했어요" : "No matching choices"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
                className="mt-4 min-h-11 text-[13px] font-semibold text-primary underline underline-offset-4"
              >
                {ko ? "조건 초기화" : "Reset filters"}
              </button>
            </div>
          )}
        </section>

        {(filter === "experience" || filter === "all") && (
          <Link
            href="/connect"
            className="pressable mt-8 flex min-h-[82px] items-center gap-4 rounded-[20px] bg-success-surface p-4 text-success ring-1 ring-success/10"
          >
            <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-white/70">
              <UsersRound className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-[14px]">
                {ko ? "함께하는 액티비티" : "Activities with new friends"}
              </strong>
              <span className="mt-1 block text-[12px] leading-5 opacity-75">
                {ko
                  ? "참여가 확정된 사람끼리만 채팅해요"
                  : "Chat opens only for confirmed participants"}
              </span>
            </span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </main>
    </PhoneFrame>
  );
}

function MarketplaceOfferCard({
  item,
  voucher,
  proximity,
}: {
  item: MarketplaceItem;
  voucher?: Voucher;
  proximity?: string;
}) {
  const { lang } = useLang();
  const ko = lang === "ko";
  const discount =
    voucher && isVoucherAvailable(voucher)
      ? Math.min(item.priceKRW, voucher.valueKRW)
      : 0;
  const taskLabel =
    item.fulfilment === "booking"
      ? ko
        ? "시간 예약"
        : "Timed booking"
      : item.fulfilment === "delivery"
        ? ko
          ? "숙소 배달"
          : "Delivery"
        : item.fulfilment === "pickup"
          ? ko
            ? "매장 픽업"
            : "Store pickup"
          : ko
            ? "모바일 이용권"
            : "Mobile pass";
  return (
    <Link
      href={`/explore/${item.id}`}
      className="pressable block rounded-[20px] bg-card p-4 ring-1 ring-border"
    >
      <div className="flex items-start gap-3.5">
        <img
          src={item.image}
          alt=""
          className="h-14 w-14 flex-shrink-0 rounded-[16px] object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-primary">
              {taskLabel}
            </span>
          </div>
          <h3 className="font-display mt-1 text-[19px] font-semibold leading-snug">
            {item.title[lang]}
          </h3>
          <p className="mt-1.5 truncate text-[12px] text-muted-foreground">
            {item.merchant} · {proximity ?? item.location[lang]}
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between border-t border-foreground/10 pt-3">
        <div>
          <p className="flex items-center gap-1 text-[12px] text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5" />
            {item.availability[lang]}
          </p>
          {discount > 0 && (
            <p className="mt-1 text-[12px] font-semibold text-success">
              {ko
                ? `K-Tour ID 혜택 −₩${discount.toLocaleString()}`
                : `K-Tour ID benefit −₩${discount.toLocaleString()}`}
            </p>
          )}
        </div>
        <span className="flex items-center gap-2">
          <strong className="tabular text-[16px]">
            ₩{(item.priceKRW - discount).toLocaleString()}
          </strong>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </span>
      </div>
    </Link>
  );
}

function PartnerOfferCard({
  service,
  userType,
  credentialActive,
  usedBenefitIds,
  proximity,
}: {
  service: CommercialService;
  userType?: "foreigner" | "long-term" | "korean";
  credentialActive: boolean;
  usedBenefitIds: string[];
  proximity?: string;
}) {
  const { lang } = useLang();
  const ko = lang === "ko";
  const eligible =
    !!userType &&
    credentialActive &&
    service.benefitEligibleUserTypes.includes(userType) &&
    !usedBenefitIds.includes(service.benefitId);
  const benefit = eligible ? service.benefitKRW : 0;
  const intent = CORE_INTENTS[commercialCategoryToIntent(service.category)];
  const taskLabel =
    flowForService(service.id)?.subtype[lang] ?? intent.label[lang];
  return (
    <Link
      href={`/services/${service.id}?from=explore`}
      className="pressable block rounded-[20px] bg-card p-4 ring-1 ring-border"
    >
      <div className="flex items-start gap-3.5">
        <BrandMark brand={service.brand} size={56} decorative />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-semibold text-primary">
              {taskLabel}
            </span>
          </div>
          <h3 className="font-display mt-1 text-[19px] font-semibold leading-snug">
            {service.title[lang]}
          </h3>
          <p className="mt-1.5 truncate text-[12px] text-muted-foreground">
            {service.name[lang]} · {proximity ?? service.context[lang]}
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between border-t border-foreground/10 pt-3">
        <div>
          <p className="flex items-center gap-1 text-[12px] text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {service.fulfilment[lang]}
          </p>
          {benefit > 0 && (
            <p className="mt-1 text-[12px] font-semibold text-success">
              {service.benefit[lang]} −₩{benefit.toLocaleString()}
            </p>
          )}
        </div>
        <span className="flex items-center gap-2">
          <strong className="tabular text-[16px]">
            ₩{(service.grossKRW - benefit).toLocaleString()}
          </strong>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </span>
      </div>
    </Link>
  );
}
