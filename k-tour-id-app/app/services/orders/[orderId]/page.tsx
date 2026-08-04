"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  Check,
  CircleAlert,
  Clock3,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { PageHeader, PhoneFrame } from "@/components/app/shell";
import { ServiceLiveTracker } from "@/components/app/service-live-tracker";
import {
  effectiveExternalOrderStatus,
  effectiveFulfilmentStep,
  externalPassPhase,
  saveExternalOrder,
  useExternalServiceOrders,
} from "@/lib/external-service-orders";
import { useLang } from "@/lib/i18n/lang-provider";
import { flowForService } from "@/lib/service-flow";
import { useApp } from "@/lib/store/app-provider";

export default function ServiceReceiptPage() {
  const params = useParams<{ orderId: string }>();
  const searchParams = useSearchParams();
  const { session, hydrated, refundExternalPayment } = useApp();
  const { lang } = useLang();
  const ko = lang === "ko";
  const [checking, setChecking] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [actionError, setActionError] = useState("");
  const [refundReason, setRefundReason] = useState<
    "cancel" | "missing-item" | "service-issue" | null
  >(null);
  const [previewNow, setPreviewNow] = useState(() => Date.now());
  const orders = useExternalServiceOrders(session.identity?.did ?? "guest");
  const order = orders.find((candidate) => candidate.id === params.orderId);
  const did = session.identity?.did ?? "guest";
  const flow = order ? flowForService(order.serviceId) : undefined;

  useEffect(() => {
    const timer = window.setInterval(() => setPreviewNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  if (!hydrated) return null;

  if (!order) {
    return (
      <PhoneFrame>
        <PageHeader title={ko ? "내 이용" : "My services"} back="/wallet" />
        <main className="px-6 py-20 text-center">
          <CircleAlert className="mx-auto h-8 w-8 text-muted-foreground" />
          <h1 className="font-display mt-4 text-[25px] font-semibold">
            {ko ? "내역을 불러오지 못했어요" : "Receipt unavailable"}
          </h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            {ko
              ? "이 기기에 저장된 이용 내역을 찾을 수 없어요."
              : "This service record is not stored on this device."}
          </p>
          <Link
            href="/wallet"
            className="mt-5 inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4"
          >
            {ko ? "ID·지갑으로 돌아가기" : "Back to ID · Wallet"}
          </Link>
        </main>
      </PhoneFrame>
    );
  }

  const stepCount = flow?.fulfilment.length ?? 1;
  const passPhase = externalPassPhase(order, previewNow);
  const currentStep = effectiveFulfilmentStep(order, stepCount, previewNow);
  const effectiveStatus = effectiveExternalOrderStatus(
    order,
    stepCount,
    previewNow,
  );
  const statusMeta =
    order.status === "confirmed" && passPhase === "scheduled"
      ? {
          icon: Clock3,
          title: ko ? "교통패스 개시 예정이에요" : "Transit pass scheduled",
          tone: "bg-[#f6ecd6] text-[#7b5b20]",
          label: ko ? "개시 예정" : "Scheduled",
        }
      : order.status === "confirmed" && passPhase === "active"
        ? {
            icon: Check,
            title: ko ? "교통패스를 이용 중이에요" : "Transit pass active",
            tone: "bg-success-surface text-success",
            label: ko ? "이용 중" : "Active",
          }
        : effectiveStatus === "confirmed"
      ? {
          icon: Check,
          title: ko ? "이용이 진행 중이에요" : "Service in progress",
          tone: "bg-success-surface text-success",
          label: ko ? "진행 중" : "In progress",
        }
      : effectiveStatus === "completed"
        ? {
            icon: Check,
            title: ko ? "이용을 완료했어요" : "Service completed",
            tone: "bg-success-surface text-success",
            label: ko ? "이용 완료" : "Completed",
          }
        : order.status === "cancelled"
          ? {
              icon: RotateCcw,
              title: ko ? "이용을 취소했어요" : "Service cancelled",
              tone: "bg-secondary text-muted-foreground",
              label: ko ? "취소" : "Cancelled",
            }
          : order.status === "pending"
            ? {
                icon: Clock3,
                title: ko ? "결과를 확인하고 있어요" : "Checking the result",
                tone: "bg-[#f6ecd6] text-[#7b5b20]",
                label: ko ? "확인 중" : "Checking",
              }
            : order.status === "refund-pending"
              ? {
                  icon: Clock3,
                  title: ko ? "환불을 요청했어요" : "Refund requested",
                  tone: "bg-[#f6ecd6] text-[#7b5b20]",
                  label: ko ? "환불 요청 중" : "Refund pending",
                }
              : order.status === "partially-refunded"
                ? {
                    icon: RotateCcw,
                    title: ko ? "부분 환불을 완료했어요" : "Partial refund completed",
                    tone: "bg-success-surface text-success",
                    label: ko ? "부분 환불 완료" : "Partially refunded",
                  }
                : order.status === "refunded"
                ? {
                    icon: RotateCcw,
                    title: ko ? "환불을 완료했어요" : "Refund completed",
                    tone: "bg-success-surface text-success",
                    label: ko ? "환불 완료" : "Refunded",
                  }
                : {
                    icon: CircleAlert,
                    title: ko
                      ? "연결을 완료하지 못했어요"
                      : "Connection wasn't completed",
                    tone: "bg-primary/8 text-primary",
                    label: ko ? "연결 실패" : "Failed",
                  };
  const Icon = statusMeta.icon;
  const backHref =
    searchParams.get("from") === "explore" ? "/explore" : "/wallet";
  const foodConfiguration =
    order.configuration?.kind === "food-delivery"
      ? order.configuration
      : null;
  const firstItemRefundKRW = foodConfiguration?.items[0]
    ? Math.min(
        order.paidKRW,
        foodConfiguration.items[0].unitPriceKRW *
          foodConfiguration.items[0].quantity,
      )
    : order.paidKRW;
  const proposedRefundKRW =
    refundReason === "missing-item" ? firstItemRefundKRW : order.paidKRW;
  const updateOrder = (changes: Partial<typeof order>) =>
    saveExternalOrder(did, {
      ...order,
      ...changes,
      statusUpdatedAt: new Date().toISOString(),
    });
  const reconcile = async () => {
    if (checking) return;
    setChecking(true);
    setActionError("");
    await new Promise((resolve) => setTimeout(resolve, 550));
    if (
      order.paidKRW > 0 &&
      order.paymentStatus === "captured" &&
      order.providerStatus === "accepted"
    ) {
      const saved = updateOrder({
        status: "confirmed",
        fulfilmentStep: 0,
        executionState: "reference-simulated",
      });
      if (!saved)
        setActionError(
          ko
            ? "확인 결과를 이용 내역에 저장하지 못했어요. 다시 확인해 주세요."
            : "The result could not be saved to this service record. Check again.",
        );
    } else if (order.paidKRW === 0) {
      updateOrder({
        status: "failed",
        benefitAppliedKRW: 0,
        platformFeeKRW: 0,
        providerReceivableKRW: 0,
        executionState: "status-unknown",
      });
    } else {
      setActionError(
        ko
          ? "결제 기록은 있지만 제공자 응답 근거가 없어요. 중복 결제하지 말고 문의해 주세요."
          : "A payment record exists without provider evidence. Do not pay again; contact support.",
      );
    }
    setChecking(false);
  };
  const completeRefund = async () => {
    if (refunding) return;
    setRefunding(true);
    setActionError("");
    if (
      order.refundQuoteExpiresAt &&
      Date.now() > new Date(order.refundQuoteExpiresAt).getTime()
    ) {
      setActionError(
        ko
          ? "환불 견적이 만료됐어요. 문제 유형을 다시 선택해 주세요."
          : "The refund quote expired. Select the issue again.",
      );
      updateOrder({
        status: order.refundReturnStatus ?? "confirmed",
        refundProviderStatus: "rejected",
      });
      setRefunding(false);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 450));
    if (searchParams.get("refund") === "rejected") {
      updateOrder({
        status: order.refundReturnStatus ?? "confirmed",
        refundProviderStatus: "rejected",
        providerStatus: "accepted",
      });
      setActionError(
        ko
          ? "목업 제공자가 이 환불 조건을 승인하지 않았어요. 문의에서 다시 검토할 수 있어요."
          : "The reference provider rejected this refund quote. You can ask support for another review.",
      );
      setRefunding(false);
      return;
    }
    const refundAmountKRW = order.refundRequestedKRW ?? order.paidKRW;
    const refunded = await refundExternalPayment({
      operationId: order.operationId ?? order.id,
      merchant: order.provider,
      amountKRW: refundAmountKRW,
      category:
        order.category === "mobility"
          ? "transport"
          : order.category === "delivery"
            ? "delivery"
            : "shopping",
    });
    if (refunded) {
      const refundedAt = new Date().toISOString();
      const isFullRefund = refundAmountKRW >= order.paidKRW;
      const remainingRatio = Math.max(
        0,
        (order.paidKRW - refundAmountKRW) / order.paidKRW,
      );
      const remainingBenefitKRW = Math.round(
        order.benefitAppliedKRW * remainingRatio,
      );
      const remainingPlatformFeeKRW = Math.round(
        order.platformFeeKRW * remainingRatio,
      );
      const remainingProviderReceivableKRW = Math.max(
        0,
        order.paidKRW -
          refundAmountKRW +
          (order.benefitFunding === "tourism-campaign"
            ? remainingBenefitKRW
            : 0) -
          remainingPlatformFeeKRW,
      );
      const saved = updateOrder({
        status: isFullRefund ? "refunded" : "partially-refunded",
        paymentStatus: isFullRefund ? "refunded" : "captured",
        refundedKRW: refundAmountKRW,
        refundedAt,
        refundReference: `RFD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        benefitAppliedKRW: isFullRefund ? 0 : remainingBenefitKRW,
        platformFeeKRW: isFullRefund ? 0 : remainingPlatformFeeKRW,
        providerReceivableKRW: isFullRefund
          ? 0
          : remainingProviderReceivableKRW,
        providerStatus: "accepted",
        refundProviderStatus: "approved",
        executionState: "reference-simulated",
      });
      if (!saved)
        setActionError(
          ko
            ? "환불은 처리됐지만 이용 내역 저장에 실패했어요. 다시 누르면 같은 환불 영수증으로 복구합니다."
            : "The refund succeeded but the service record was not saved. Retry to restore it from the same refund receipt.",
        );
    } else {
      setActionError(
        ko
          ? "환불 상태를 완료하지 못했어요. 잠시 후 다시 확인해 주세요."
          : "The refund could not be completed. Please check again shortly.",
      );
    }
    setRefunding(false);
  };

  return (
    <PhoneFrame>
      <PageHeader title={ko ? "내 이용" : "My services"} back={backHref} />
      <main className="px-6 pb-10 pt-7">
        <div className="text-center">
          <span
            className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${statusMeta.tone}`}
          >
            <Icon className="h-7 w-7" />
          </span>
          <p className="mt-5 text-[12px] font-semibold text-primary">
            {order.provider} · K-Tour ID
          </p>
          <h1 className="font-display mt-2 text-[28px] font-semibold">
            {statusMeta.title}
          </h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            {new Intl.DateTimeFormat(ko ? "ko-KR" : "en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(order.createdAt))}
          </p>
        </div>

        {flow && ["confirmed", "completed"].includes(effectiveStatus) && (
          <div className="mt-8">
            <ServiceLiveTracker
              order={order}
              lang={lang}
              steps={flow.fulfilment}
              currentStep={currentStep}
            />
          </div>
        )}

        <section className="mt-5 rounded-[20px] bg-card p-5 ring-1 ring-border">
          <h2 className="text-[15px] font-semibold">
            {ko ? order.title : order.titleEn}
          </h2>
          <p className="mt-2 text-[12px] leading-5 text-muted-foreground">
            {ko ? order.optionLabel : order.optionLabelEn}
          </p>
          <div className="mt-4 border-t border-foreground/10 pt-2">
            <ReceiptRow
              label={ko ? "상태" : "Status"}
              value={statusMeta.label}
            />
            <ReceiptRow
              label={ko ? "서비스 예상가" : "Estimated service price"}
              value={`₩${order.grossKRW.toLocaleString()}`}
            />
            {order.benefitAppliedKRW > 0 && (
              <ReceiptRow
                label={ko ? "K-Tour ID 혜택" : "K-Tour ID benefit"}
                value={`−₩${order.benefitAppliedKRW.toLocaleString()}`}
                success
              />
            )}
            <ReceiptRow
              label={ko ? "결제 금액" : "Amount charged"}
              value={`₩${order.paidKRW.toLocaleString()}`}
              strong
            />
            {order.refundedKRW != null && order.refundedKRW > 0 && (
              <ReceiptRow
                label={ko ? "환불 금액" : "Amount refunded"}
                value={`+₩${order.refundedKRW.toLocaleString()}`}
                success
              />
            )}
            <ReceiptRow
              label={ko ? "연동 예시 번호" : "Reference flow ID"}
              value={order.providerReference ?? order.id}
              mono
            />
            {order.quoteExpiresAt && (
              <ReceiptRow
                label={ko ? "견적 유효 시각" : "Quote valid until"}
                value={new Intl.DateTimeFormat(ko ? "ko-KR" : "en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(order.quoteExpiresAt))}
              />
            )}
          </div>
        </section>

        <div className="mt-5 flex items-start gap-3 rounded-[16px] bg-success-surface p-4 text-success">
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p className="text-[12px] leading-5">
            {ko
              ? "이 목업은 결제·혜택·서비스 상태가 한 기록에 연결되는 방식을 보여줘요. 실제 연동에서는 제공자 이벤트로 상태를 갱신합니다."
              : "This mockup shows payment, benefit, and service status in one record. A real integration would update it from provider events."}
          </p>
        </div>

        {order.status === "pending" && (
          <button
            type="button"
            disabled={checking}
            onClick={reconcile}
            className="pressable mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-primary text-[14px] font-semibold text-white disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${checking ? "animate-spin" : ""}`}
            />
            {checking
              ? ko
                ? "확인 중…"
                : "Checking…"
              : ko
                ? "서비스 상태 다시 확인"
                : "Check service status"}
          </button>
        )}
        {["confirmed", "completed"].includes(effectiveStatus) && (
          <button
            type="button"
            onClick={() =>
              setRefundReason(
                effectiveStatus === "completed" && foodConfiguration
                  ? "missing-item"
                  : effectiveStatus === "completed"
                    ? "service-issue"
                    : "cancel",
              )
            }
            className="pressable mt-6 flex min-h-12 w-full items-center justify-center rounded-[14px] bg-secondary text-[13px] font-semibold"
          >
            {effectiveStatus === "completed"
              ? ko
                ? "문제 신고·환불 요청"
                : "Report an issue or request refund"
              : ko
                ? "취소·환불 요청"
                : "Request cancellation & refund"}
          </button>
        )}
        {refundReason && ["confirmed", "completed"].includes(effectiveStatus) && (
          <section className="mt-3 rounded-[18px] bg-card p-4 ring-1 ring-border">
            <h2 className="text-[14px] font-semibold">
              {ko ? "환불 조건 확인" : "Review refund terms"}
            </h2>
            {effectiveStatus === "completed" && foodConfiguration && (
              <div
                role="group"
                aria-label={ko ? "문제 유형" : "Issue type"}
                className="mt-3 grid grid-cols-2 gap-2"
              >
                <button
                  type="button"
                  aria-pressed={refundReason === "missing-item"}
                  onClick={() => setRefundReason("missing-item")}
                  className={`min-h-12 rounded-[12px] px-3 text-[12px] font-semibold ring-1 ${refundReason === "missing-item" ? "bg-ink text-white ring-ink" : "bg-surface-2 ring-border"}`}
                >
                  {ko ? "일부 상품 누락" : "Missing item"}
                </button>
                <button
                  type="button"
                  aria-pressed={refundReason === "service-issue"}
                  onClick={() => setRefundReason("service-issue")}
                  className={`min-h-12 rounded-[12px] px-3 text-[12px] font-semibold ring-1 ${refundReason === "service-issue" ? "bg-ink text-white ring-ink" : "bg-surface-2 ring-border"}`}
                >
                  {ko ? "전체 주문 문제" : "Whole order issue"}
                </button>
              </div>
            )}
            <div className="mt-4 flex items-end justify-between border-t border-foreground/10 pt-4">
              <span className="text-[12px] text-muted-foreground">
                {ko ? "제공자 확인 후 예상 환불" : "Estimated after provider review"}
              </span>
              <strong className="font-display tabular text-[22px]">
                ₩{proposedRefundKRW.toLocaleString()}
              </strong>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
              {ko
                ? "실제 연동에서는 제공자 환불 견적과 취소 수수료를 먼저 받은 뒤 확정해요."
                : "A real integration confirms a provider refund quote and any cancellation fee first."}
            </p>
            <button
              type="button"
              onClick={() => {
                updateOrder({
                  status: "refund-pending",
                  refundRequestedKRW: proposedRefundKRW,
                  refundReason,
                  refundQuoteId: `RFQ-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
                  refundQuoteExpiresAt: new Date(
                    Date.now() + 10 * 60 * 1000,
                  ).toISOString(),
                  refundProviderStatus: "pending",
                  refundReturnStatus:
                    effectiveStatus === "completed" ? "completed" : "confirmed",
                  providerStatus: "pending",
                });
                setRefundReason(null);
              }}
              className="mt-4 min-h-12 w-full rounded-[12px] bg-primary px-4 text-[13px] font-semibold text-white"
            >
              {ko ? "이 조건으로 환불 요청" : "Request with this quote"}
            </button>
          </section>
        )}
        {order.status === "refund-pending" && (
          <button
            type="button"
            disabled={refunding}
            onClick={completeRefund}
            className="pressable mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-secondary text-[13px] font-semibold disabled:opacity-50"
          >
            {refunding && <RefreshCw className="h-4 w-4 animate-spin" />}
            {refunding
              ? ko
                ? "환불 확인 중…"
                : "Checking refund…"
              : ko
                ? "목업 제공자 결과 확인"
                : "Check reference provider result"}
          </button>
        )}
        {actionError && (
          <p
            role="alert"
            className="mt-3 rounded-[12px] bg-primary/8 px-3 py-2 text-[12px] font-semibold text-primary"
          >
            {actionError}
          </p>
        )}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Link
            href={`/help?order=${encodeURIComponent(order.id)}`}
            className="pressable flex min-h-12 items-center justify-center gap-2 rounded-[14px] bg-card text-[13px] font-semibold ring-1 ring-border"
          >
            <MessageCircle className="h-4 w-4" />
            {ko ? "문의하기" : "Get help"}
          </Link>
          <Link
            href={`/services/${order.serviceId}?from=explore`}
            className="pressable flex min-h-12 items-center justify-center rounded-[14px] bg-ink px-3 text-center text-[13px] font-semibold text-white"
          >
            {ko ? "다시 보기" : "View again"}
          </Link>
        </div>
      </main>
    </PhoneFrame>
  );
}

function ReceiptRow({
  label,
  value,
  success = false,
  strong = false,
  mono = false,
}: {
  label: string;
  value: string;
  success?: boolean;
  strong?: boolean;
  mono?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-4 py-3 text-[13px] ${strong ? "border-t border-foreground/10" : ""}`}
    >
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`${success ? "text-success" : ""} ${strong ? "font-bold" : "font-semibold"} ${mono ? "break-all font-mono text-[12px]" : "tabular"}`}
      >
        {value}
      </span>
    </div>
  );
}
