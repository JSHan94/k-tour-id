"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronLeft,
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
import { DeliveryServiceCanvas } from "@/components/app/delivery-service-canvas";
import { MobilityServiceCanvas } from "@/components/app/mobility-service-canvas";
import { ServiceConfigurator } from "@/components/app/service-configurator";
import { LangToggle, PageHeader, PhoneFrame } from "@/components/app/shell";
import { commercialServiceById } from "@/lib/commercial-services";
import { isCredentialUsable } from "@/lib/credential-status";
import {
  reserveExternalOrder,
  saveExternalOrder,
  useExternalServiceOrders,
  type ExternalServiceOrder,
} from "@/lib/external-service-orders";
import { useLang } from "@/lib/i18n/lang-provider";
import {
  distanceKm,
  useNearbyLocation,
} from "@/lib/location/location-provider";
import {
  commercialCategoryToIntent,
  configurationGrossKRW,
  flowForService,
  formatServiceConfiguration,
  type ServiceConfiguration,
  type ServiceQuote,
} from "@/lib/service-flow";
import { useApp } from "@/lib/store/app-provider";

type Step = "configure" | "review" | "processing" | "result";
type ResultKind =
  | "payment-failed"
  | "payment-reversed"
  | "provider-rejected"
  | "status-unknown";

export default function CommercialServiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session, pay, refundExternalPayment, hydrated } = useApp();
  const { lang } = useLang();
  const { location, status: locationStatus } = useNearbyLocation();
  const ko = lang === "ko";
  const service = commercialServiceById(params.id);
  const priorOrders = useExternalServiceOrders(
    session.identity?.did ?? "guest",
  );
  const [step, setStep] = useState<Step>("configure");
  const [configuration, setConfiguration] =
    useState<ServiceConfiguration | null>(null);
  const [quote, setQuote] = useState<ServiceQuote | null>(null);
  const [quoteExpired, setQuoteExpired] = useState(false);
  const [consented, setConsented] = useState(false);
  const [result, setResult] = useState<ResultKind | null>(null);
  const [receiptId, setReceiptId] = useState("");
  const operationIdRef = useRef("");
  const busyRef = useRef(false);
  const stageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (hydrated && !session.onboarded) router.replace("/onboarding");
    if (new URLSearchParams(window.location.search).get("preview") === "failed") {
      setResult("payment-failed");
      setStep("result");
    }
  }, [hydrated, router, session.onboarded]);

  useEffect(() => {
    if (step !== "configure" || quoteExpired)
      requestAnimationFrame(() => stageRef.current?.focus());
  }, [quoteExpired, step]);

  if (!session.onboarded) return null;
  if (!service)
    return (
      <PhoneFrame>
        <PageHeader
          title={ko ? "서비스" : "Service"}
          back="/explore"
          right={<LangToggle />}
        />
        <main className="px-6 py-20 text-center">
          <CircleAlert className="mx-auto h-8 w-8 text-muted-foreground" />
          <h1 className="font-display mt-4 text-[25px] font-semibold">
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
  const listHref = `/explore?focus=${commercialCategoryToIntent(service.category)}`;
  const returnHref = `/services/${service.id}?from=explore`;
  const configurationSummary = formatServiceConfiguration(configuration, lang);
  const configurationSummaryKo = formatServiceConfiguration(configuration, "ko");
  const configurationSummaryEn = formatServiceConfiguration(configuration, "en");
  const personaEligible =
    !!session.userType &&
    service.benefitEligibleUserTypes.includes(session.userType);
  const benefitUsed = priorOrders.some(
    (order) =>
      ["pending", "confirmed", "completed", "refund-pending"].includes(
        order.status,
      ) &&
      order.benefitId === service.benefitId &&
      order.benefitAppliedKRW > 0,
  );
  const credentialAvailable =
    isCredentialUsable(session.capsule) &&
    !!session.capsule?.services.includes(service.serviceKey);
  const benefitAvailable =
    personaEligible && credentialAvailable && !benefitUsed;
  const grossKRW = configurationGrossKRW(configuration, service.grossKRW);
  const benefitKRW = benefitAvailable
    ? Math.min(grossKRW, service.benefitKRW)
    : 0;
  const finalKRW = Math.max(0, grossKRW - benefitKRW);
  const configurationValid = configurationIsValid(configuration);
  const withinLimit = finalKRW <= (session.capsule?.paymentLimitKRW ?? 0);
  const enoughBalance = session.wallet.balanceKRW >= finalKRW;
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
          ? `${location.areaKo} 숙소`
          : `Stay in ${location.areaEn}`
        : ko
          ? `${location.areaKo} 주변`
          : `Near ${location.areaEn}`
      : service.context[lang];

  const beginReview = () => {
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
    setConsented(false);
    setStep("review");
  };

  const submitService = async () => {
    if (busyRef.current || !quote) return;
    if (new Date(quote.expiresAt).getTime() <= Date.now()) {
      setQuoteExpired(true);
      setQuote(null);
      setConsented(false);
      setStep("configure");
      return;
    }
    busyRef.current = true;
    setStep("processing");
    const did = session.identity?.did ?? "guest";
    const operationId = operationIdRef.current || crypto.randomUUID();
    operationIdRef.current = operationId;
    const id = `KTI-${operationId.slice(0, 8).toUpperCase()}`;
    const createdAt = new Date().toISOString();
    const platformFeeKRW = Math.round(quote.grossKRW * 0.015);
    const campaignReimbursementKRW =
      service.benefitFunding === "tourism-campaign" ? quote.benefitKRW : 0;
    const baseOrder: ExternalServiceOrder = {
      id,
      serviceId: service.id,
      provider: service.provider,
      title: service.title.ko,
      titleEn: service.title.en,
      optionLabel: configurationSummaryKo || service.option.ko,
      optionLabelEn: configurationSummaryEn || service.option.en,
      category: service.category,
      status: "pending",
      integrationMode: "simulated",
      paymentStatus: "not-started",
      providerStatus: "pending",
      benefitId: service.benefitId,
      benefitFunding: service.benefitFunding,
      grossKRW: quote.grossKRW,
      benefitAppliedKRW: quote.benefitKRW,
      paidKRW: 0,
      platformFeeKRW: 0,
      providerReceivableKRW: 0,
      settlementStatus: "pending",
      createdAt,
      statusUpdatedAt: createdAt,
      providerReference: `REF-${operationId.slice(-6).toUpperCase()}`,
      quoteId: quote.id,
      quoteExpiresAt: quote.expiresAt,
      fulfilmentStep: 0,
      operationId,
      executionState: "status-unknown",
      configuration: quote.configuration,
    };

    let paymentCaptured = false;
    try {
      if (!reserveExternalOrder(did, baseOrder))
        throw new Error("ORDER_RESERVATION_FAILED");
      await new Promise((resolve) => setTimeout(resolve, 650));
      const referenceRejected =
        new URLSearchParams(window.location.search).get("preview") ===
        "rejected";
      if (referenceRejected) {
        const rejectedOrder: ExternalServiceOrder = {
          ...baseOrder,
          status: "cancelled",
          providerStatus: "rejected",
          benefitAppliedKRW: 0,
          statusUpdatedAt: new Date().toISOString(),
          executionState: "reference-simulated",
        };
        saveExternalOrder(did, rejectedOrder);
        setReceiptId(id);
        setResult("provider-rejected");
        setStep("result");
        return;
      }
      const stillEligible =
        isCredentialUsable(session.capsule) &&
        !!session.capsule?.services.includes(service.serviceKey) &&
        quote.totalKRW <= (session.capsule?.paymentLimitKRW ?? 0);
      const paid =
        stillEligible &&
        locationEligible &&
        (await pay(
          service.provider,
          quote.totalKRW,
          service.serviceKey,
          operationId,
        ));
      if (!paid) throw new Error("PAYMENT_FAILED");
      paymentCaptured = true;

      const acceptedOrder: ExternalServiceOrder = {
        ...baseOrder,
        status: "confirmed",
        paidKRW: quote.totalKRW,
        paymentStatus: "captured",
        providerStatus: "accepted",
        benefitAppliedKRW: quote.benefitKRW,
        platformFeeKRW,
        providerReceivableKRW:
          quote.totalKRW + campaignReimbursementKRW - platformFeeKRW,
        fulfilmentStep: service.id === "tmoney-visitor-pass" ? 1 : 0,
        statusUpdatedAt: new Date().toISOString(),
        executionState: "reference-simulated",
      };
      if (!saveExternalOrder(did, acceptedOrder))
        throw new Error("ORDER_STORAGE_FAILED");
      setReceiptId(id);
      router.replace(`/services/orders/${id}`);
    } catch (error) {
      const reversed = paymentCaptured
        ? await refundExternalPayment({
            operationId,
            merchant: service.provider,
            amountKRW: quote.totalKRW,
            category: service.serviceKey,
          })
        : false;
      const failedOrder: ExternalServiceOrder = {
        ...baseOrder,
        status: reversed ? "refunded" : paymentCaptured ? "pending" : "failed",
        paidKRW: paymentCaptured ? quote.totalKRW : 0,
        paymentStatus: reversed
          ? "refunded"
          : paymentCaptured
            ? "captured"
            : "not-started",
        providerStatus: paymentCaptured ? "accepted" : "unknown",
        refundedKRW: reversed ? quote.totalKRW : undefined,
        refundedAt: reversed ? new Date().toISOString() : undefined,
        refundReference: reversed
          ? `RFD-${operationId.slice(-6).toUpperCase()}`
          : undefined,
        benefitAppliedKRW: 0,
        executionState: "status-unknown",
      };
      saveExternalOrder(did, failedOrder);
      setReceiptId(id);
      setResult(
        reversed
          ? "payment-reversed"
          : paymentCaptured
            ? "status-unknown"
            : error instanceof Error && error.message === "PAYMENT_FAILED"
              ? "payment-failed"
              : "status-unknown",
      );
      setStep("result");
    } finally {
      busyRef.current = false;
    }
  };

  const retry = () => {
    setStep("configure");
    setResult(null);
    setQuote(null);
    setQuoteExpired(false);
    setConsented(false);
    setReceiptId("");
    operationIdRef.current = "";
  };

  return (
    <PhoneFrame hideNav={step === "processing"}>
      <p className="sr-only" role="status" aria-live="polite">
        {step === "review"
          ? ko
            ? "이용 조건과 결제 검토"
            : "Review service and payment"
          : step === "processing"
            ? ko
              ? "결제와 서비스 접수 확인 중"
              : "Confirming payment and service request"
            : step === "result"
              ? ko
                ? "서비스 결과"
                : "Service result"
              : ""}
      </p>
      {step === "configure" ? (
        <PageHeader
          title={flow?.subtype[lang] ?? service.name[lang]}
          back={listHref}
          right={<LangToggle />}
        />
      ) : step === "review" ? (
        <header className="safe-top sticky top-0 z-30 flex items-center justify-between bg-background/88 px-4 pb-3 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setStep("configure")}
            aria-label={ko ? "이전" : "Back"}
            className="pressable grid h-11 w-11 place-items-center rounded-full text-foreground/70"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-[17px] font-semibold tracking-tight">
            {ko ? "요청 확인" : "Review request"}
          </h1>
          <div className="flex h-11 min-w-11 items-center justify-center">
            <LangToggle />
          </div>
        </header>
      ) : null}

      <main ref={stageRef} tabIndex={-1} className="pb-8 outline-none">
        {step === "configure" && (
          <>
            <section className="px-6 pb-2 pt-3">
              <div className="flex items-center gap-3">
                <BrandMark brand={service.brand} size={42} decorative />
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-primary">
                  {ko ? "제휴 연동 레퍼런스" : "PARTNER UX REFERENCE"} ·{" "}
                  {service.name[lang]}
                  </p>
                  <h1 className="font-display mt-0.5 text-[23px] font-semibold leading-tight">
                    {service.title[lang]}
                  </h1>
                </div>
              </div>
            </section>

            {service.category === "mobility" ? (
              <div className="px-6">
                <MobilityServiceCanvas
                  serviceId={service.id}
                  lang={lang}
                  locationLabel={locationContext}
                  locationGranted={locationStatus === "granted"}
                  onChange={setConfiguration}
                />
              </div>
            ) : service.category === "delivery" ? (
              <div className="px-6">
                <DeliveryServiceCanvas
                  serviceId={service.id}
                  lang={lang}
                  locationLabel={
                    locationStatus === "granted" ? locationContext : ""
                  }
                  locationVerified={
                    locationStatus === "granted" && locationEligible
                  }
                  onChange={setConfiguration}
                />
              </div>
            ) : flow ? (
              <div className="px-6">
                <ServiceConfigurator
                  serviceId={service.id}
                  flow={flow}
                  lang={lang}
                  locationLabel={locationContext}
                  onChange={setConfiguration}
                />
              </div>
            ) : null}

            <section className="mt-5 px-6">
              <div className="rounded-[22px] bg-card p-5 ring-1 ring-border">
                <div className="flex items-start gap-3">
                  <span
                    className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-full ${benefitAvailable ? "bg-success-surface text-success" : "bg-secondary text-muted-foreground"}`}
                  >
                    <BadgeCheck className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] text-muted-foreground">
                      {ko ? "K‑Tour ID 혜택" : "K‑Tour ID benefit"}
                    </p>
                    <strong className="mt-1 block text-[14px]">
                      {benefitAvailable
                        ? service.benefit[lang]
                        : benefitUsed
                          ? ko
                            ? "이번 혜택은 이미 사용했어요"
                            : "This benefit has already been used"
                          : ko
                            ? "정상 예상가로 이용할 수 있어요"
                            : "Continue at the regular estimated price"}
                    </strong>
                  </div>
                  {benefitKRW > 0 && (
                    <strong className="tabular text-[14px] text-success">
                      −₩{benefitKRW.toLocaleString()}
                    </strong>
                  )}
                </div>
                <div className="mt-4 border-t border-foreground/10 pt-4">
                  <MoneyRow
                    label={ko ? "서비스 예상가" : "Estimated price"}
                    value={grossKRW}
                  />
                  <MoneyRow
                    label={ko ? "예상 결제액" : "Estimated total"}
                    value={finalKRW}
                    strong
                  />
                </div>
              </div>
              {quoteExpired && (
                <p
                  role="alert"
                  className="mt-3 rounded-[12px] bg-[#f6ecd6] px-3 py-2 text-[12px] font-semibold text-[#7b5b20]"
                >
                  {ko
                    ? "이전 견적이 만료돼 현재 조건으로 다시 계산했어요."
                    : "The previous quote expired, so it was recalculated."}
                </p>
              )}
            </section>

            <div className="sticky bottom-[76px] mt-6 bg-background/94 px-6 py-3 backdrop-blur-xl">
              {!locationEligible ? (
                <Link
                  href={listHref}
                  className="pressable flex min-h-14 items-center justify-between rounded-[15px] bg-secondary px-5 text-[14px] font-semibold"
                >
                  {ko ? "현재 위치에서 가능한 선택 보기" : "See nearby choices"}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              ) : !credentialAvailable || !withinLimit ? (
                <Link
                  href={`/onboarding?mode=renew&returnTo=${encodeURIComponent(returnHref)}`}
                  className="pressable flex min-h-14 items-center justify-between rounded-[15px] bg-primary px-5 text-[14px] font-semibold text-white"
                >
                  {ko ? "K‑Tour ID 확인하고 돌아오기" : "Review K‑Tour ID"}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              ) : !enoughBalance ? (
                <Link
                  href={`/wallet?topup=1&requiredKRW=${finalKRW}&returnTo=${encodeURIComponent(returnHref)}`}
                  className="pressable flex min-h-14 items-center justify-between rounded-[15px] bg-primary px-5 text-[14px] font-semibold text-white"
                >
                  {ko ? "여행 잔액 충전하기" : "Top up travel balance"}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={!configurationValid}
                  onClick={beginReview}
                  className="pressable flex min-h-14 w-full items-center justify-between rounded-[15px] bg-primary px-5 text-[15px] font-semibold text-white disabled:opacity-45"
                >
                  {configurationValid
                    ? ko
                      ? `₩${finalKRW.toLocaleString()} 예상 · 확인하기`
                      : `Review · est. ₩${finalKRW.toLocaleString()}`
                    : ko
                      ? "이용 조건을 먼저 선택해 주세요"
                      : "Choose your service details first"}
                  <ArrowRight className="h-5 w-5" />
                </button>
              )}
            </div>
          </>
        )}

        {step === "review" && quote && (
          <section className="px-6 pt-4">
            <div className="flex items-center gap-3">
              <BrandMark brand={service.brand} size={48} decorative />
              <div>
                <p className="text-[12px] font-semibold text-primary">
                  {service.name[lang]}
                </p>
                <h1 className="font-display mt-1 text-[25px] font-semibold">
                  {ko ? "요청 전 마지막 확인" : "One last review"}
                </h1>
              </div>
            </div>

            <div className="mt-6 rounded-[20px] bg-card p-5 ring-1 ring-border">
              <ReviewRow
                icon={MapPin}
                label={ko ? "이용 내용" : "Service"}
                value={configurationSummary || service.option[lang]}
              />
              <ReviewRow
                icon={Wallet}
                label={ko ? "결제수단" : "Payment"}
                value={`${ko ? "여행 잔액" : "Travel balance"} · ₩${session.wallet.balanceKRW.toLocaleString()}`}
              />
              <ReviewRow
                icon={BadgeCheck}
                label={ko ? "혜택" : "Benefit"}
                value={
                  quote.benefitKRW > 0
                    ? `−₩${quote.benefitKRW.toLocaleString()}`
                    : ko
                      ? "적용 없음"
                      : "None"
                }
                last
              />
            </div>

            <div className="mt-4 rounded-[20px] bg-surface-2 p-5 ring-1 ring-border">
              <MoneyRow
                label={ko ? "서비스 예상가" : "Estimated price"}
                value={quote.grossKRW}
              />
              {quote.benefitKRW > 0 && (
                <MoneyRow
                  label={ko ? "K‑Tour ID 혜택" : "K‑Tour ID benefit"}
                  value={-quote.benefitKRW}
                  success
                />
              )}
              <MoneyRow
                label={ko ? "예상 결제액" : "Estimated total"}
                value={quote.totalKRW}
                strong
              />
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" />
                {ko
                  ? "견적은 10분 동안 유효하며 변경 시 다시 확인해요."
                  : "This quote is valid for 10 minutes and changes require review."}
              </p>
            </div>

            <details className="group mt-4 rounded-[18px] bg-card ring-1 ring-border">
              <summary className="pressable flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 text-[13px] font-semibold [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  {ko ? "제휴사에 전달되는 정보" : "Information shared"}
                </span>
                <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
              </summary>
              <div className="border-t border-border px-4 py-4 text-[12px] leading-5 text-muted-foreground">
                <p>
                  {ko
                    ? "선택한 이용 조건과 혜택 대상 여부만 전달해요. 이름·여권번호·신분증 원본은 전달하지 않습니다."
                    : "Only your selected service details and benefit eligibility are shared. Name, passport number, and original ID are not shared."}
                </p>
                <p className="mt-2">
                  {ko
                    ? `실제 연동 시 서비스 제공과 운영 상태는 ${service.name.ko}에서, 자격·혜택·여행 잔액은 K‑Tour ID에서 관리해요.`
                    : `When connected, ${service.name.en} provides service operations; K‑Tour ID manages eligibility, benefits, and travel balance.`}
                </p>
              </div>
            </details>

            <label className="pressable mt-4 flex min-h-14 cursor-pointer items-center gap-3 border-y border-foreground/10 py-3 text-[13px] font-semibold">
              <input
                type="checkbox"
                checked={consented}
                onChange={(event) => setConsented(event.target.checked)}
                className="h-5 w-5 accent-[var(--primary)]"
              />
              {ko
                ? "위 조건으로 결제하고 서비스를 요청할게요"
                : "Pay and request the service with these details"}
            </label>

            <button
              type="button"
              disabled={!consented}
              onClick={submitService}
              className="pressable mt-6 flex min-h-14 w-full items-center justify-between rounded-[15px] bg-ink px-5 text-[15px] font-semibold text-white disabled:opacity-40"
            >
              {ko
                ? `₩${quote.totalKRW.toLocaleString()} 결제하고 요청`
                : `Pay ₩${quote.totalKRW.toLocaleString()} & request`}
              <ExternalLink className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setStep("configure")}
              className="pressable mt-2 min-h-11 w-full text-[12px] font-semibold text-muted-foreground"
            >
              {ko ? "이용 조건 다시 보기" : "Edit service details"}
            </button>
            <p className="mt-3 text-center text-[11px] leading-5 text-muted-foreground">
              {ko
                ? "표시된 화면과 상태는 실제 연동 시 제공되는 예상 경험입니다."
                : "Screens and statuses illustrate the expected connected experience."}
            </p>
          </section>
        )}

        {step === "processing" && (
          <section
            role="status"
            aria-live="polite"
            aria-busy="true"
            className="grid min-h-[70vh] place-items-center px-6 text-center"
          >
            <div>
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <h1 className="font-display mt-5 text-[26px] font-semibold">
                {ko
                  ? "제공 가능 여부와 결제를 확인하고 있어요"
                  : "Checking availability and payment"}
              </h1>
              <p className="mx-auto mt-2 max-w-[310px] text-[13px] leading-6 text-muted-foreground">
                {ko
                  ? "목업용 파트너 응답을 먼저 확인한 뒤 결제를 진행하고, 두 결과를 하나의 이용 내역으로 연결해요."
                  : "This reference flow checks a mock partner response before payment and links both results in one record."}
              </p>
            </div>
          </section>
        )}

        {step === "result" && result && (
          <section className="px-6 pt-12 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/8 text-primary">
              <CircleAlert className="h-7 w-7" />
            </span>
            <h1 className="font-display mt-5 text-[28px] font-semibold">
              {result === "provider-rejected"
                ? ko
                  ? "제공 가능한 조건이 아니에요"
                  : "The provider couldn't accept this request"
                : result === "payment-reversed"
                  ? ko
                    ? "결제액을 바로 돌려드렸어요"
                    : "Your payment was returned"
                  : result === "status-unknown"
                    ? ko
                      ? "결제 상태를 다시 확인해야 해요"
                      : "Payment status needs review"
                    : ko
                      ? "결제를 완료하지 못했어요"
                      : "Payment wasn't completed"}
            </h1>
            <p className="mx-auto mt-3 max-w-[320px] text-[13px] leading-6 text-muted-foreground">
              {result === "provider-rejected"
                ? ko
                  ? "결제 전 제공 가능 여부 확인에서 중단됐어요. 잔액은 차감되지 않았습니다."
                  : "The reference provider check stopped before payment. Your balance was not charged."
                : result === "payment-reversed"
                  ? ko
                    ? "이용 내역 저장을 완료하지 못해 결제액을 여행 잔액으로 자동 복구했어요."
                    : "The service record couldn't be saved, so the payment was automatically returned to your travel balance."
                  : result === "status-unknown"
                    ? ko
                      ? "중복 결제를 피하기 위해 다시 결제하지 말고 내 이용에서 상태를 확인해 주세요."
                      : "To avoid a duplicate charge, do not pay again. Check the record in My services."
                    : ko
                      ? "결제가 승인되지 않았고 잔액은 차감되지 않았습니다. 조건을 확인한 뒤 다시 시도할 수 있어요."
                      : "Payment was not approved and your balance was not charged. Review the details and try again."}
            </p>
            {receiptId && (
              <Link
                href={`/services/orders/${receiptId}?from=explore`}
                className="pressable mt-7 flex min-h-14 w-full items-center justify-center rounded-[14px] bg-primary text-[13px] font-semibold text-white"
              >
                {ko ? "내 이용에서 상태 확인" : "Check My services"}
              </Link>
            )}
            {result !== "status-unknown" && (
              <button
                type="button"
                onClick={retry}
                className="pressable mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-[15px] bg-secondary text-[13px] font-semibold"
              >
                <RotateCcw className="h-4 w-4" />
                {ko ? "조건 다시 보기" : "Review details"}
              </button>
            )}
          </section>
        )}
      </main>
    </PhoneFrame>
  );
}

function configurationIsValid(configuration: ServiceConfiguration | null) {
  if (!configuration) return false;
  if (configuration.kind === "ride")
    return (
      configuration.pickupKo.trim().length >= 4 &&
      configuration.destinationKo.trim().length >= 2 &&
      ["device", "reference-checked"].includes(
        configuration.pickupVerification,
      )
    );
  if (configuration.kind === "food-delivery") {
    const itemsTotalKRW = configuration.items.reduce(
      (sum, item) => sum + item.unitPriceKRW * item.quantity,
      0,
    );
    return (
      configuration.address.trim().length >= 4 &&
      configuration.deliverability === "available" &&
      configuration.items.length > 0 &&
      itemsTotalKRW >= configuration.minimumOrderKRW
    );
  }
  return true;
}

function MoneyRow({
  label,
  value,
  strong = false,
  success = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
  success?: boolean;
}) {
  return (
    <div
      className={`flex items-end justify-between gap-4 py-2.5 text-[13px] ${strong ? "mt-2 border-t border-foreground/10 pt-4" : ""}`}
    >
      <span className={strong ? "font-semibold" : "text-muted-foreground"}>
        {label}
      </span>
      <strong
        className={`tabular ${strong ? "font-display text-[25px]" : "text-[13px]"} ${success ? "text-success" : ""}`}
      >
        {value < 0 ? "−" : ""}₩{Math.abs(value).toLocaleString()}
      </strong>
    </div>
  );
}

function ReviewRow({
  icon: Icon,
  label,
  value,
  last = false,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 py-3 ${last ? "" : "border-b border-foreground/10"}`}
    >
      <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-secondary text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <strong className="mt-1 block text-[13px] leading-5">{value}</strong>
      </div>
      {last && <Check className="mt-2 h-4 w-4 text-success" />}
    </div>
  );
}
