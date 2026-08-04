"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  ExternalLink,
  Loader2,
  MapPin,
  RotateCcw,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { BrandMark } from "@/components/app/brand";
import { ServiceConfigurator } from "@/components/app/service-configurator";
import { LangToggle, PageHeader, PhoneFrame } from "@/components/app/shell";
import { commercialServiceById } from "@/lib/commercial-services";
import {
  reserveExternalOrder,
  saveExternalOrder,
  useExternalServiceOrders,
  type ExternalOrderStatus,
  type ExternalServiceOrder,
} from "@/lib/external-service-orders";
import { isCredentialUsable } from "@/lib/credential-status";
import {
  distanceKm,
  useNearbyLocation,
} from "@/lib/location/location-provider";
import { useApp } from "@/lib/store/app-provider";
import { useLang } from "@/lib/i18n/lang-provider";
import {
  commercialCategoryToIntent,
  configurationQuantity,
  flowForService,
  formatServiceConfiguration,
  type ServiceConfiguration,
  type ServiceQuote,
} from "@/lib/service-flow";

type Step = "detail" | "consent" | "handoff" | "processing" | "result";

export default function CommercialServiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session, pay, hydrated } = useApp();
  const { lang } = useLang();
  const { location, status: locationStatus } = useNearbyLocation();
  const ko = lang === "ko";
  const service = commercialServiceById(params.id);
  const priorOrders = useExternalServiceOrders(
    session.identity?.did ?? "guest",
  );
  const [step, setStep] = useState<Step>("detail");
  const [consented, setConsented] = useState(false);
  const [status, setStatus] = useState<ExternalOrderStatus | null>(null);
  const [receiptId, setReceiptId] = useState("");
  const [resultOrder, setResultOrder] = useState<ExternalServiceOrder | null>(
    null,
  );
  const [choiceIndex, setChoiceIndex] = useState(0);
  const [configuration, setConfiguration] =
    useState<ServiceConfiguration | null>(null);
  const [quote, setQuote] = useState<ServiceQuote | null>(null);
  const [quoteExpired, setQuoteExpired] = useState(false);
  const stageRef = useRef<HTMLElement>(null);
  const busy = useRef(false);
  const operationIdRef = useRef("");

  useEffect(() => {
    if (hydrated && !session.onboarded) router.replace("/onboarding");
    const query = new URLSearchParams(window.location.search);
    if (query.get("preview") === "failed") {
      setReceiptId(`KTI-${crypto.randomUUID().slice(0, 8).toUpperCase()}`);
      setStatus("failed");
      setStep("result");
    }
  }, [hydrated, router, session.onboarded]);
  useEffect(() => {
    if (step !== "detail")
      requestAnimationFrame(() => stageRef.current?.focus());
  }, [step]);
  if (!session.onboarded) return null;
  if (!service)
    return (
      <PhoneFrame>
        <PageHeader
          title={ko ? "서비스 상세" : "Service details"}
          back="/explore"
        />
        <main className="px-6 py-20 text-center">
          <h1 className="font-display text-[26px] font-semibold">
            {ko ? "서비스를 찾지 못했어요" : "Service not found"}
          </h1>
          <Link
            href="/explore"
            className="mt-5 inline-flex min-h-11 items-center text-[13px] font-semibold text-primary underline underline-offset-4"
          >
            {ko ? "탐색으로 돌아가기" : "Back to Explore"}
          </Link>
        </main>
      </PhoneFrame>
    );

  const flow = flowForService(service.id);
  const choices = flow?.choices ?? [service.option];
  const baseSelectedChoice =
    choices[choiceIndex]?.[lang] ?? choices[0]?.[lang] ?? service.option[lang];
  const configurationSummary = formatServiceConfiguration(configuration, lang);
  const selectedChoice = configurationSummary
    ? `${baseSelectedChoice} · ${configurationSummary}`
    : baseSelectedChoice;
  const personaEligible =
    !!session.userType &&
    service.benefitEligibleUserTypes.includes(session.userType);
  const benefitUsed = priorOrders.some(
    (order) =>
      ["confirmed", "completed", "refund-pending"].includes(order.status) &&
      order.benefitId === service.benefitId &&
      order.benefitAppliedKRW > 0,
  );
  const credentialAvailable =
    isCredentialUsable(session.capsule) &&
    !!session.capsule?.services.includes(service.serviceKey);
  const benefitAvailable =
    personaEligible && credentialAvailable && !benefitUsed;
  const configurationSummaryKo = formatServiceConfiguration(
    configuration,
    "ko",
  );
  const configurationSummaryEn = formatServiceConfiguration(
    configuration,
    "en",
  );
  const routeDeltaKRW =
    flow?.intent === "mobility" && service.id !== "tmoney-visitor-pass"
      ? choiceIndex * 3_000
      : 0;
  const grossKRW =
    service.grossKRW * configurationQuantity(configuration) + routeDeltaKRW;
  const benefitKRW = benefitAvailable
    ? Math.min(grossKRW, service.benefitKRW)
    : 0;
  const finalKRW = grossKRW - benefitKRW;
  const configurationValid =
    configuration?.kind !== "food-delivery" ||
    configuration.address.trim().length >= 4;
  const withinLimit = finalKRW <= (session.capsule?.paymentLimitKRW ?? 0);
  const enoughBalance = session.wallet.balanceKRW >= finalKRW;
  const listHref = `/explore?focus=${commercialCategoryToIntent(service.category)}`;
  const returnHref = `/services/${service.id}?from=explore`;
  const receiptStored = priorOrders.some((order) => order.id === receiptId);
  const locationDistanceKm =
    locationStatus === "granted" && location
      ? distanceKm(location, service.geo)
      : null;
  const locationEligible =
    locationDistanceKm == null || locationDistanceKm <= service.coverageKm;
  const locationContext =
    locationStatus === "granted" && location
      ? service.category === "delivery"
        ? ko
          ? `${location.areaKo} 숙소로 배달`
          : `Delivery to your stay in ${location.areaEn}`
        : service.category === "mobility"
          ? ko
            ? `${location.areaKo} 주변에서 출발`
            : `Starting near ${location.areaEn}`
          : ko
            ? `${location.areaKo} 주변 매장`
            : `Stores near ${location.areaEn}`
      : service.context[lang];

  const createQuoteAndContinue = () => {
    if (!configurationValid) return;
    const operationId = operationIdRef.current || crypto.randomUUID();
    operationIdRef.current = operationId;
    setQuote({
      id: `Q-${operationId.slice(0, 8).toUpperCase()}`,
      configuration,
      grossKRW,
      benefitKRW,
      totalKRW: finalKRW,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    setQuoteExpired(false);
    setStep("consent");
  };

  const finish = async (
    requestedStatus: "confirmed" | "cancelled" | "failed",
  ) => {
    if (busy.current) return;
    if (
      requestedStatus === "confirmed" &&
      (!quote || new Date(quote.expiresAt).getTime() <= Date.now())
    ) {
      setQuoteExpired(true);
      setQuote(null);
      setConsented(false);
      setStep("detail");
      return;
    }
    busy.current = true;
    setStep("processing");
    const did = session.identity?.did ?? "guest";
    const operationId = operationIdRef.current || crypto.randomUUID();
    operationIdRef.current = operationId;
    const id = `KTI-${operationId.slice(0, 8).toUpperCase()}`;
    const quotedGrossKRW = quote?.grossKRW ?? grossKRW;
    const quotedBenefitKRW = quote?.benefitKRW ?? benefitKRW;
    const quotedTotalKRW = quote?.totalKRW ?? finalKRW;
    const quotedConfiguration = quote?.configuration ?? configuration;
    const platformFeeKRW = Math.round(quotedGrossKRW * 0.015);
    const campaignReimbursementKRW =
      service.benefitFunding === "tourism-campaign" ? quotedBenefitKRW : 0;
    const createdAt = new Date();
    const baseOrder: ExternalServiceOrder = {
      id,
      serviceId: service.id,
      provider: service.provider,
      title: service.title.ko,
      titleEn: service.title.en,
      optionLabel: `${choices[choiceIndex]?.ko ?? service.option.ko}${configurationSummaryKo ? ` · ${configurationSummaryKo}` : ""}`,
      optionLabelEn: `${choices[choiceIndex]?.en ?? service.option.en}${configurationSummaryEn ? ` · ${configurationSummaryEn}` : ""}`,
      category: service.category,
      status: "pending",
      integrationMode: "simulated",
      benefitId: service.benefitId,
      benefitFunding: service.benefitFunding,
      grossKRW: quotedGrossKRW,
      benefitAppliedKRW: quotedBenefitKRW,
      paidKRW: 0,
      platformFeeKRW,
      providerReceivableKRW: 0,
      settlementStatus: "pending",
      createdAt: createdAt.toISOString(),
      statusUpdatedAt: createdAt.toISOString(),
      providerReference: `PRV-${operationId.slice(-6).toUpperCase()}`,
      quoteId: quote?.id ?? `Q-${operationId.slice(0, 8).toUpperCase()}`,
      quoteExpiresAt:
        quote?.expiresAt ??
        new Date(createdAt.getTime() + 10 * 60 * 1000).toISOString(),
      fulfilmentStep: 0,
      operationId,
      executionState: "status-unknown",
      configuration: quotedConfiguration,
    };
    try {
      if (!reserveExternalOrder(did, baseOrder))
        throw new Error("ORDER_STORAGE_OR_BENEFIT_UNAVAILABLE");
      let resolvedStatus: ExternalOrderStatus = requestedStatus;
      let storedOrder: ExternalServiceOrder = baseOrder;
      if (requestedStatus === "confirmed") {
        const stillEligible =
          isCredentialUsable(session.capsule) &&
          !!session.capsule?.services.includes(service.serviceKey) &&
          quotedTotalKRW <= (session.capsule?.paymentLimitKRW ?? 0);
        const paid =
          stillEligible &&
          locationEligible &&
          (await pay(
            service.provider,
            quotedTotalKRW,
            service.serviceKey,
            operationId,
          ));
        if (paid) {
          storedOrder = {
            ...baseOrder,
            paidKRW: quotedTotalKRW,
            benefitAppliedKRW: quotedBenefitKRW,
            providerReceivableKRW:
              quotedTotalKRW + campaignReimbursementKRW - platformFeeKRW,
            executionState: "user-returned",
          };
          if (!saveExternalOrder(did, storedOrder))
            throw new Error("ORDER_STORAGE_UNAVAILABLE_AFTER_PAYMENT");
        } else {
          resolvedStatus = "failed";
        }
      }
      const finalOrder: ExternalServiceOrder = {
        ...storedOrder,
        status: resolvedStatus,
        statusUpdatedAt: new Date().toISOString(),
        paidKRW: resolvedStatus === "confirmed" ? storedOrder.paidKRW : 0,
        benefitAppliedKRW:
          resolvedStatus === "confirmed" ? storedOrder.benefitAppliedKRW : 0,
        platformFeeKRW:
          resolvedStatus === "confirmed" ? storedOrder.platformFeeKRW : 0,
        providerReceivableKRW:
          resolvedStatus === "confirmed"
            ? storedOrder.providerReceivableKRW
            : 0,
        executionState:
          resolvedStatus === "confirmed"
            ? "provider-confirmed"
            : "status-unknown",
      };
      if (!saveExternalOrder(did, finalOrder)) resolvedStatus = "pending";
      await new Promise((resolve) => setTimeout(resolve, 650));
      setResultOrder(resolvedStatus === "pending" ? storedOrder : finalOrder);
      setReceiptId(id);
      setStatus(resolvedStatus);
      setStep("result");
    } catch {
      setResultOrder({
        ...baseOrder,
        status: "failed",
        benefitAppliedKRW: 0,
        paidKRW: 0,
        platformFeeKRW: 0,
        providerReceivableKRW: 0,
        executionState: "status-unknown",
      });
      setReceiptId(id);
      setStatus("failed");
      setStep("result");
    } finally {
      busy.current = false;
    }
  };

  const reset = () => {
    setStep("detail");
    setConsented(false);
    setStatus(null);
    setReceiptId("");
    setResultOrder(null);
    setQuote(null);
    setQuoteExpired(false);
    operationIdRef.current = "";
  };
  const hideNav = step === "handoff" || step === "processing";

  return (
    <PhoneFrame hideNav={hideNav}>
      <p className="sr-only" role="status" aria-live="polite">
        {step === "consent"
          ? ko
            ? "정보 전달 확인 단계"
            : "Information sharing review"
          : step === "handoff"
            ? ko
              ? "연결 서비스 단계"
              : "Connected service step"
            : step === "processing"
              ? ko
                ? "이용 결과 확인 중"
                : "Checking the result"
              : step === "result"
                ? ko
                  ? "이용 결과"
                  : "Service result"
                : ""}
      </p>
      {step === "detail" ? (
        <PageHeader
          title={ko ? "서비스 상세" : "Service details"}
          back={listHref}
          right={<LangToggle />}
        />
      ) : (
        <header className="safe-top flex items-center justify-between px-5 pb-3">
          <button
            type="button"
            onClick={() =>
              step === "consent"
                ? setStep("detail")
                : step === "handoff"
                  ? setStep("consent")
                  : router.push(listHref)
            }
            className="pressable min-h-11 text-[13px] font-semibold text-muted-foreground"
          >
            {ko ? "이전" : "Back"}
          </button>
          <strong className="text-[15px]">{service.name[lang]}</strong>
          <LangToggle />
        </header>
      )}
      <main ref={stageRef} tabIndex={-1} className="pb-8 outline-none">
        {step === "detail" && (
          <>
            <section className="px-6 pt-4">
              <div className="flex items-start justify-between">
                <BrandMark brand={service.brand} size={58} decorative />
                <span className="rounded-full bg-secondary px-2.5 py-1.5 text-[12px] font-semibold text-muted-foreground">
                  {flow?.subtype[lang] ?? service.name[lang]}
                </span>
              </div>
              <p className="mt-5 text-[12px] font-semibold text-primary">
                {service.name[lang]}
              </p>
              <h1 className="font-display text-balance mt-2 text-[31px] font-semibold leading-[1.2] tracking-[-0.035em]">
                {service.title[lang]}
              </h1>
              <p className="mt-3 text-[14px] leading-6 text-muted-foreground">
                {service.description[lang]}
              </p>
              <div className="mt-6 space-y-3 border-y border-foreground/10 py-5">
                <Fact icon={MapPin} label={locationContext} />
                <Fact icon={Check} label={selectedChoice} />
                <Fact icon={ExternalLink} label={service.fulfilment[lang]} />
              </div>
            </section>
            {flow && (
              <div className="px-6">
                <ServiceConfigurator
                  serviceId={service.id}
                  flow={flow}
                  lang={lang}
                  locationLabel={locationContext}
                  onChange={setConfiguration}
                />
              </div>
            )}
            <section className="mt-8 px-6">
              <p className="text-[12px] font-semibold text-primary">
                01 · {ko ? "내 이용 조건" : "Your service setup"}
              </p>
              <h2 className="font-display mt-1 text-[23px] font-semibold">
                {flow?.choiceLabel[lang] ??
                  (ko ? "이용 옵션" : "Service option")}
              </h2>
              <div className="mt-3 grid gap-2">
                {choices.map((choice, index) => (
                  <button
                    key={choice.ko}
                    type="button"
                    aria-pressed={choiceIndex === index}
                    onClick={() => setChoiceIndex(index)}
                    className={`pressable flex min-h-14 items-center justify-between rounded-[14px] px-4 text-left text-[13px] font-semibold ring-1 ${choiceIndex === index ? "bg-ink text-white ring-ink" : "bg-card ring-border"}`}
                  >
                    <span>{choice[lang]}</span>
                    {choiceIndex === index && (
                      <Check className="h-4 w-4 text-gold" />
                    )}
                  </button>
                ))}
              </div>
              {flow && (
                <div className="mt-4 divide-y divide-foreground/10 border-y border-foreground/10">
                  {flow.context.map((item) => (
                    <div
                      key={item.label.ko}
                      className="flex items-start justify-between gap-5 py-3.5 text-[13px]"
                    >
                      <span className="text-muted-foreground">
                        {item.label[lang]}
                      </span>
                      <strong className="text-right">{item.value[lang]}</strong>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section className="mt-8 px-6">
              <p className="text-[12px] font-semibold text-primary">
                02 · {ko ? "혜택·예상 결제액" : "Benefit & estimated total"}
              </p>
              <div className="mt-3 rounded-[20px] bg-card p-5 ring-1 ring-border">
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-full ${benefitAvailable ? "bg-success-surface text-success" : "bg-secondary text-muted-foreground"}`}
                  >
                    <BadgeCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <strong className="text-[14px]">
                      {benefitAvailable
                        ? service.benefit[lang]
                        : benefitUsed
                          ? ko
                            ? "혜택 사용 완료"
                            : "Benefit already used"
                          : ko
                            ? "현재 K-Tour ID의 혜택 대상 아님"
                            : "Not eligible with this K-Tour ID"}
                    </strong>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      {benefitAvailable
                        ? ko
                          ? "한 번만 사용할 수 있어요"
                          : "Available once"
                        : ko
                          ? "정상 예상가로 계속 이용 가능"
                          : "You can continue at the regular estimated price"}
                    </p>
                  </div>
                </div>
                <div className="mt-5 space-y-2 border-t border-foreground/10 pt-4 text-[13px]">
                  <Price
                    label={ko ? "서비스 예상가" : "Estimated service price"}
                    value={grossKRW}
                  />
                  {benefitKRW > 0 && (
                    <Price
                      label={ko ? "K-Tour ID 혜택" : "K-Tour ID benefit"}
                      value={-benefitKRW}
                      success
                    />
                  )}
                  <div className="mt-3 flex items-end justify-between border-t border-foreground/10 pt-4">
                    <strong>{ko ? "예상 결제액" : "Estimated total"}</strong>
                    <strong className="font-display tabular text-[30px]">
                      ₩{finalKRW.toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>
              {quoteExpired && (
                <p
                  role="alert"
                  className="mt-3 rounded-[12px] bg-[#f6ecd6] px-3 py-2 text-[12px] font-semibold text-[#7b5b20]"
                >
                  {ko
                    ? "견적이 만료돼 현재 조건으로 다시 계산했어요."
                    : "Your quote expired, so we recalculated it with the current setup."}
                </p>
              )}
            </section>
            <section className="mt-8 px-6">
              <p className="text-[12px] font-semibold text-primary">
                03 · {ko ? "이용 준비" : "Ready to continue"}
              </p>
              <div className="mt-3 divide-y divide-foreground/10 border-y border-foreground/10">
                <StatusRow
                  icon={BadgeCheck}
                  title="K-Tour ID"
                  detail={
                    !withinLimit
                      ? ko
                        ? "1회 결제 한도 초과"
                        : "Over the per-payment limit"
                      : credentialAvailable
                        ? ko
                          ? "사용 가능"
                          : "Active"
                        : ko
                          ? "갱신 또는 이용 권한 확인 필요"
                          : "Renewal or service access needed"
                  }
                  ok={credentialAvailable && withinLimit}
                />
                <StatusRow
                  icon={MapPin}
                  title={ko ? "이용 지역" : "Service area"}
                  detail={
                    locationEligible
                      ? locationContext
                      : ko
                        ? `현재 위치에서 약 ${Math.round(locationDistanceKm ?? 0)}km · 이용 범위 밖`
                        : `About ${Math.round(locationDistanceKm ?? 0)}km away · outside service area`
                  }
                  ok={locationEligible}
                />
                <StatusRow
                  icon={Wallet}
                  title={ko ? "여행 잔액" : "Travel balance"}
                  detail={`₩${session.wallet.balanceKRW.toLocaleString()}`}
                  ok={enoughBalance}
                />
              </div>
            </section>
            <div className="sticky bottom-[76px] mt-8 bg-background/94 px-6 py-3 backdrop-blur-xl">
              {!locationEligible ? (
                <Link
                  href={listHref}
                  className="pressable flex min-h-14 items-center justify-between rounded-[14px] bg-secondary px-5 text-[15px] font-semibold"
                >
                  {ko
                    ? "현재 위치에서 가능한 선택 보기"
                    : "See choices available near you"}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              ) : !credentialAvailable || !withinLimit ? (
                <Link
                  href={`/onboarding?mode=renew&returnTo=${encodeURIComponent(returnHref)}`}
                  className="pressable flex min-h-14 items-center justify-between rounded-[14px] bg-primary px-5 text-[15px] font-semibold text-white"
                >
                  {ko
                    ? "K-Tour ID 확인하고 돌아오기"
                    : "Review K-Tour ID and return"}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              ) : !enoughBalance ? (
                <Link
                  href={`/wallet?topup=1&requiredKRW=${finalKRW}&returnTo=${encodeURIComponent(returnHref)}`}
                  className="pressable flex min-h-14 items-center justify-between rounded-[14px] bg-primary px-5 text-[15px] font-semibold text-white"
                >
                  {ko
                    ? `₩${(finalKRW - session.wallet.balanceKRW).toLocaleString()} 이상 충전`
                    : `Top up at least ₩${(finalKRW - session.wallet.balanceKRW).toLocaleString()}`}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={!configurationValid}
                  onClick={createQuoteAndContinue}
                  className="pressable flex min-h-14 w-full items-center justify-between rounded-[14px] bg-primary px-5 text-[15px] font-semibold text-white disabled:opacity-45"
                >
                  {!configurationValid
                    ? ko
                      ? "받는 주소를 먼저 입력해 주세요"
                      : "Enter a delivery address first"
                    : ko
                      ? `${service.name.ko}에서 이어가기`
                      : `Continue with ${service.name.en}`}
                  <ArrowRight className="h-5 w-5" />
                </button>
              )}
            </div>
          </>
        )}

        {step === "consent" && (
          <section className="px-6 pt-6">
            <p className="text-[12px] font-semibold text-primary">
              {ko ? "외부 서비스로 이동하기 전" : "BEFORE YOU CONTINUE"}
            </p>
            <h1 className="font-display text-balance mt-2 text-[29px] font-semibold leading-tight">
              {ko
                ? "보내는 정보만 확인해 주세요"
                : "Review only what will be shared"}
            </h1>
            <p className="mt-3 text-[14px] leading-6 text-muted-foreground">
              {ko
                ? `${service.name.ko}에서 이용을 이어가기 위해 아래 정보만 한 번 전달해요.`
                : `These details are shared once so you can continue with ${service.name.en}.`}
            </p>
            <div className="mt-6 rounded-[20px] bg-card p-5 ring-1 ring-border">
              <SharedRow
                label={ko ? "이용 내용" : "Service details"}
                value={selectedChoice}
              />
              <SharedRow
                label={ko ? "혜택 확인" : "Benefit proof"}
                value={
                  benefitKRW > 0
                    ? ko
                      ? "대상 여부만 · 원본 ID 제외"
                      : "Eligibility only · no raw ID"
                    : ko
                      ? "전달하지 않음"
                      : "Not shared"
                }
              />
              <SharedRow
                label={ko ? "예상 결제액" : "Estimated total"}
                value={`₩${(quote?.totalKRW ?? finalKRW).toLocaleString()}`}
              />
              <SharedRow
                label={ko ? "보관" : "Retention"}
                value={
                  ko
                    ? "임시 전달 정보는 삭제 · 이용 내역은 ID·지갑에 보관"
                    : "Temporary handoff data deleted · service record kept in ID · Wallet"
                }
                last
              />
            </div>
            <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
              {ko
                ? "표시된 금액과 상태는 실제 연동 시 제공되는 예상 흐름입니다."
                : "Prices and statuses illustrate the flow provided when the service is connected."}
            </p>
            <div className="mt-5 flex items-start gap-3 rounded-[18px] bg-success-surface p-4 text-success">
              <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <p className="text-[12px] leading-5">
                {ko
                  ? "이름·여권 정보·신분증 원본은 보내지 않아요. 혜택 자격과 선택한 이용 조건만 전달해요."
                  : "Name, passport data, and original ID documents are not shared. Only eligibility and your selected service setup are sent."}
              </p>
            </div>
            <label className="pressable mt-5 flex min-h-14 cursor-pointer items-center gap-3 border-y border-foreground/10 py-3 text-[13px] font-semibold">
              <input
                type="checkbox"
                checked={consented}
                onChange={(event) => setConsented(event.target.checked)}
                className="h-5 w-5 accent-[var(--primary)]"
              />
              {ko
                ? "위 정보를 보내고 이용을 이어갈게요"
                : "Share these details and continue"}
            </label>
            <button
              type="button"
              disabled={!consented}
              onClick={() => setStep("handoff")}
              className="pressable mt-6 flex min-h-14 w-full items-center justify-between rounded-[14px] bg-primary px-5 text-[15px] font-semibold text-white disabled:opacity-40"
            >
              {ko ? `${service.name.ko} 열기` : `Open ${service.name.en}`}
              <ExternalLink className="h-5 w-5" />
            </button>
          </section>
        )}

        {step === "handoff" && (
          <section className="px-6 pt-6">
            <div className="mx-auto flex max-w-[330px] flex-col items-center text-center">
              <BrandMark brand={service.brand} size={72} decorative />
              {benefitKRW > 0 ? (
                <p className="mt-5 rounded-full bg-success-surface px-2.5 py-1 text-[12px] font-semibold text-success">
                  K-Tour ID {ko ? "혜택 적용" : "benefit applied"}
                </p>
              ) : (
                <p className="mt-5 rounded-full bg-secondary px-2.5 py-1 text-[12px] font-semibold text-muted-foreground">
                  K-Tour ID{" "}
                  {ko ? "자격 확인 · 정상가" : "verified · regular price"}
                </p>
              )}
              <h1 className="font-display mt-3 text-[28px] font-semibold">
                {service.name[lang]}
              </h1>
              <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
                {service.title[lang]}
                <br />
                {selectedChoice}
              </p>
            </div>
            <div className="mt-8 rounded-[24px] bg-white p-5 shadow-[0_12px_32px_rgba(25,24,22,.08)] ring-1 ring-border">
              <p className="text-[12px] text-muted-foreground">
                {ko
                  ? "예상 결제액 · 10분간 유효"
                  : "Estimated total · valid for 10 min"}
              </p>
              <div className="mt-1 flex items-end justify-between">
                <strong className="font-display tabular text-[31px]">
                  ₩{(quote?.totalKRW ?? finalKRW).toLocaleString()}
                </strong>
                {(quote?.benefitKRW ?? benefitKRW) > 0 && (
                  <span className="rounded-full bg-success-surface px-2.5 py-1 text-[12px] font-semibold text-success">
                    K-Tour ID −₩
                    {(quote?.benefitKRW ?? benefitKRW).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <button
                type="button"
                onClick={() => finish("confirmed")}
                className="pressable flex min-h-14 w-full items-center justify-between rounded-[14px] bg-ink px-5 text-[15px] font-semibold text-white"
              >
                {ko ? "신청하고 상태 확인" : "Submit and check status"}
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => finish("cancelled")}
                className="pressable flex min-h-12 w-full items-center justify-between rounded-[14px] bg-secondary px-5 text-[13px] font-semibold"
              >
                {ko ? "취소하고 돌아오기" : "Cancel and return"}
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => finish("failed")}
                className="pressable min-h-11 w-full text-[12px] text-muted-foreground underline underline-offset-4"
              >
                {ko
                  ? "연결 실패 상태로 돌아가기"
                  : "Return with a connection error"}
              </button>
            </div>
          </section>
        )}

        {step === "processing" && (
          <section
            role="status"
            aria-live="polite"
            aria-busy="true"
            className="grid min-h-[65vh] place-items-center px-6 text-center"
          >
            <div>
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <h1 className="font-display mt-5 text-[25px] font-semibold">
                {ko
                  ? "서비스 응답을 확인하고 있어요"
                  : "Checking the service response"}
              </h1>
              <p className="mt-2 text-[13px] text-muted-foreground">
                {ko
                  ? "복귀와 응답 순서가 달라도 같은 요청으로 확인해요."
                  : "Return and response are reconciled as one request."}
              </p>
            </div>
          </section>
        )}

        {step === "result" && status && (
          <section
            role="status"
            aria-live="polite"
            className="px-6 pt-10 text-center"
          >
            <span
              className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${status === "confirmed" ? "bg-success-surface text-success" : status === "cancelled" ? "bg-secondary text-muted-foreground" : status === "pending" ? "bg-[#f6ecd6] text-[#7b5b20]" : "bg-primary/8 text-primary"}`}
            >
              {status === "confirmed" ? (
                <Check className="h-8 w-8" />
              ) : status === "cancelled" ? (
                <RotateCcw className="h-7 w-7" />
              ) : status === "pending" ? (
                <Clock3 className="h-7 w-7" />
              ) : (
                <CircleAlert className="h-7 w-7" />
              )}
            </span>
            <p className="mt-5 text-[12px] font-semibold text-primary">
              {service.name[lang]} · K-Tour ID
            </p>
            <h1 className="font-display mt-2 text-[29px] font-semibold">
              {status === "confirmed"
                ? ko
                  ? "이용이 확인됐어요"
                  : "Service confirmed"
                : status === "cancelled"
                  ? ko
                    ? "이용을 취소했어요"
                    : "Service cancelled"
                  : status === "pending"
                    ? ko
                      ? "결과를 확인하고 있어요"
                      : "Checking the result"
                    : ko
                      ? "연결을 완료하지 못했어요"
                      : "Connection wasn't completed"}
            </h1>
            <p className="mx-auto mt-3 max-w-[330px] text-[13px] leading-6 text-muted-foreground">
              {status === "confirmed"
                ? ko
                  ? "결제와 혜택, 이용 상태를 ID·지갑의 내 이용에 함께 보관했어요."
                  : "Payment, benefit, and service status are saved together in My services."
                : status === "cancelled"
                  ? ko
                    ? "결제되거나 혜택이 사용되지 않았어요."
                    : "Nothing was charged and no benefit was used."
                  : status === "pending"
                    ? ko
                      ? "요청은 안전하게 보관했어요. ID·지갑에서 최종 상태를 다시 확인할게요."
                      : "Your request is saved. ID · Wallet will keep checking its final status."
                    : ko
                      ? "결제되거나 혜택이 사용되지 않았어요. 연결 상태를 확인한 뒤 다시 시도해 주세요."
                      : "Nothing was charged and no benefit was used. Check the connection and retry."}
            </p>
            <div className="mt-7 rounded-[20px] bg-card p-5 text-left ring-1 ring-border">
              <SharedRow
                label={ko ? "상태" : "Status"}
                value={
                  status === "confirmed"
                    ? ko
                      ? "이용 확인"
                      : "Confirmed"
                    : status === "cancelled"
                      ? ko
                        ? "취소"
                        : "Cancelled"
                      : status === "pending"
                        ? ko
                          ? "확인 중"
                          : "Checking"
                        : ko
                          ? "연결 실패"
                          : "Failed"
                }
              />
              <SharedRow
                label={ko ? "결제 금액" : "Amount charged"}
                value={
                  status === "pending"
                    ? ko
                      ? "확인 중"
                      : "Checking"
                    : `₩${(status === "confirmed" ? (resultOrder?.paidKRW ?? 0) : 0).toLocaleString()}`
                }
              />
              <SharedRow
                label={ko ? "참조 번호" : "Reference"}
                value={receiptId}
                last
              />
            </div>
            <div className="mt-7 space-y-2">
              {status !== "confirmed" && status !== "pending" && (
                <button
                  type="button"
                  onClick={reset}
                  className="pressable flex min-h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-primary text-[15px] font-semibold text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                  {ko ? "다시 시도" : "Try again"}
                </button>
              )}
              {receiptStored ? (
                <Link
                  href={`/services/orders/${receiptId}`}
                  className="pressable flex min-h-13 w-full items-center justify-center gap-2 rounded-[14px] bg-secondary text-[14px] font-semibold"
                >
                  <Wallet className="h-4 w-4" />
                  {ko ? "내 이용 보기" : "View My services"}
                </Link>
              ) : (
                <Link
                  href="/wallet"
                  className="pressable flex min-h-13 w-full items-center justify-center gap-2 rounded-[14px] bg-secondary text-[14px] font-semibold"
                >
                  <Wallet className="h-4 w-4" />
                  {ko ? "ID·지갑 확인" : "Check ID · Wallet"}
                </Link>
              )}
              <Link
                href={listHref}
                className="pressable inline-flex min-h-11 items-center text-[13px] font-semibold text-muted-foreground underline underline-offset-4"
              >
                {ko ? "다른 선택 보기" : "Browse other choices"}
              </Link>
            </div>
          </section>
        )}
      </main>
    </PhoneFrame>
  );
}

function Fact({ icon: Icon, label }: { icon: typeof MapPin; label: string }) {
  return (
    <div className="flex items-start gap-2.5 text-[13px]">
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
      <span className="leading-5 text-muted-foreground">{label}</span>
    </div>
  );
}
function Price({
  label,
  value,
  success = false,
}: {
  label: string;
  value: number;
  success?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`tabular font-semibold ${success ? "text-success" : ""}`}
      >
        {value < 0 ? "−" : ""}₩{Math.abs(value).toLocaleString()}
      </span>
    </div>
  );
}
function StatusRow({
  icon: Icon,
  title,
  detail,
  ok,
}: {
  icon: typeof Wallet;
  title: string;
  detail: string;
  ok: boolean;
}) {
  return (
    <div className="flex min-h-[70px] items-center gap-3 py-3">
      <span
        className={`grid h-9 w-9 place-items-center rounded-full ${ok ? "bg-success-surface text-success" : "bg-primary/8 text-primary"}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <strong className="text-[13px]">{title}</strong>
        <p className="mt-1 text-[12px] text-muted-foreground">{detail}</p>
      </div>
      {ok ? (
        <Check className="h-4 w-4 text-success" />
      ) : (
        <CircleAlert className="h-4 w-4 text-primary" />
      )}
    </div>
  );
}
function SharedRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-4 py-3 text-[12px] ${last ? "" : "border-b border-foreground/10"}`}
    >
      <span className="flex-shrink-0 text-muted-foreground">{label}</span>
      <strong className="max-w-[67%] text-right leading-5">{value}</strong>
    </div>
  );
}
