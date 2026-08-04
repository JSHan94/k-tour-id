"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
import {
  saveExternalOrder,
  useExternalServiceOrders,
} from "@/lib/external-service-orders";
import { useLang } from "@/lib/i18n/lang-provider";
import { flowForService } from "@/lib/service-flow";
import { useApp } from "@/lib/store/app-provider";

export default function ServiceReceiptPage() {
  const params = useParams<{ orderId: string }>();
  const { session, hydrated, refundExternalPayment } = useApp();
  const { lang } = useLang();
  const ko = lang === "ko";
  const [checking, setChecking] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [actionError, setActionError] = useState("");
  const orders = useExternalServiceOrders(session.identity?.did ?? "guest");
  const order = orders.find((candidate) => candidate.id === params.orderId);
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

  const statusMeta =
    order.status === "confirmed"
      ? {
          icon: Check,
          title: ko ? "이용이 진행 중이에요" : "Service in progress",
          tone: "bg-success-surface text-success",
          label: ko ? "진행 중" : "In progress",
        }
      : order.status === "completed"
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
  const flow = flowForService(order.serviceId);
  const currentStep = Math.min(
    order.fulfilmentStep ?? 0,
    Math.max(0, (flow?.fulfilment.length ?? 1) - 1),
  );
  const did = session.identity?.did ?? "guest";
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
    if (order.paidKRW > 0) {
      updateOrder({
        status: "confirmed",
        fulfilmentStep: 0,
        executionState: "provider-confirmed",
      });
    } else {
      updateOrder({
        status: "failed",
        benefitAppliedKRW: 0,
        platformFeeKRW: 0,
        providerReceivableKRW: 0,
        executionState: "status-unknown",
      });
    }
    setChecking(false);
  };
  const advance = () => {
    if (!flow) return;
    const next = Math.min(currentStep + 1, flow.fulfilment.length - 1);
    updateOrder({
      fulfilmentStep: next,
      status: next === flow.fulfilment.length - 1 ? "completed" : "confirmed",
      executionState: "provider-confirmed",
    });
  };
  const completeRefund = async () => {
    if (refunding) return;
    setRefunding(true);
    setActionError("");
    const refunded = await refundExternalPayment({
      operationId: order.operationId ?? order.id,
      merchant: order.provider,
      amountKRW: order.paidKRW,
      category:
        order.category === "mobility"
          ? "transport"
          : order.category === "delivery"
            ? "delivery"
            : "shopping",
    });
    if (refunded) {
      const refundedAt = new Date().toISOString();
      updateOrder({
        status: "refunded",
        refundedKRW: order.paidKRW,
        refundedAt,
        refundReference: `RFD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        benefitAppliedKRW: 0,
        platformFeeKRW: 0,
        providerReceivableKRW: 0,
        executionState: "provider-confirmed",
      });
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
      <PageHeader title={ko ? "내 이용" : "My services"} back="/wallet" />
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

        {flow && ["confirmed", "completed"].includes(order.status) && (
          <section className="mt-8 rounded-[20px] bg-surface-2 p-5 ring-1 ring-border">
            <p className="text-[12px] font-semibold text-primary">
              {flow.subtype[lang]} · {ko ? "진행 상태" : "Progress"}
            </p>
            <ol
              className="mt-4 grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${flow.fulfilment.length}, minmax(0, 1fr))`,
              }}
              aria-label={ko ? "이용 진행 단계" : "Service progress"}
            >
              {flow.fulfilment.map((step, index) => (
                <li
                  key={step.ko}
                  aria-current={index === currentStep ? "step" : undefined}
                  className="relative text-center"
                >
                  <div
                    className={`mx-auto grid h-8 w-8 place-items-center rounded-full ${index <= currentStep ? "bg-success text-white" : "bg-card text-muted-foreground ring-1 ring-border"}`}
                  >
                    {index <= currentStep ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <p
                    className={`mt-2 text-[11px] font-semibold ${index === currentStep ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {step[lang]}
                  </p>
                  {index < flow.fulfilment.length - 1 && (
                    <span
                      className={`absolute left-[calc(50%+18px)] top-4 h-px w-[calc(100%-36px)] ${index < currentStep ? "bg-success" : "bg-foreground/10"}`}
                    />
                  )}
                </li>
              ))}
            </ol>
            {order.status === "confirmed" && (
              <button
                type="button"
                onClick={advance}
                className="pressable mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-card text-[12px] font-semibold ring-1 ring-border"
              >
                <RefreshCw className="h-4 w-4" />
                {ko ? "제공자 상태 동기화" : "Sync provider status"}
              </button>
            )}
          </section>
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
              label={ko ? "제공자 참조" : "Provider reference"}
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
              ? "결제, 혜택, 서비스 상태를 하나의 이용 내역으로 보관해요. 문제가 생기면 제공자 참조 번호로 문의할 수 있어요."
              : "Payment, benefit, and service status stay together in one record. Use the provider reference if you need support."}
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
        {order.status === "confirmed" && (
          <button
            type="button"
            onClick={() => updateOrder({ status: "refund-pending" })}
            className="pressable mt-6 flex min-h-12 w-full items-center justify-center rounded-[14px] bg-secondary text-[13px] font-semibold"
          >
            {ko ? "취소·환불 요청" : "Request cancellation & refund"}
          </button>
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
                ? "환불 상태 확인"
                : "Check refund status"}
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
