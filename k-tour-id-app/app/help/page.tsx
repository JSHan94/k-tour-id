"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  Gift,
  LifeBuoy,
  Phone,
  RefreshCcw,
  RotateCcw,
  Send,
  ShieldCheck,
} from "lucide-react";
import { PhoneFrame, PageHeader } from "@/components/app/shell";
import { useExternalServiceOrders } from "@/lib/external-service-orders";
import { useLang } from "@/lib/i18n/lang-provider";
import { useApp } from "@/lib/store/app-provider";
import {
  createSupportCase,
  readSupportCases,
  type SupportCase,
  type SupportTopic,
} from "@/lib/support-cases";

const SUPPORT_TOPICS: Array<{
  id: SupportTopic;
  ko: string;
  en: string;
}> = [
  { id: "payment", ko: "결제·주문", en: "Payment or order" },
  { id: "refund", ko: "취소·환불", en: "Cancellation or refund" },
  { id: "id", ko: "K-Tour ID", en: "K-Tour ID" },
  { id: "safety", ko: "안전·긴급 도움", en: "Safety or emergency" },
  { id: "other", ko: "기타", en: "Something else" },
];

const FAQS = [
  {
    icon: ShieldCheck,
    titleKo: "혜택 이용처에는 어떤 정보가 공유되나요?",
    titleEn: "What information does a benefit location receive?",
    bodyKo:
      "할인에 필요한 자격 결과만 공유해요. 이름, 여권번호, 생년월일 같은 원문 정보는 혜택 이용처에 전달하지 않습니다. 제출 전 화면에서 공유 항목을 다시 확인할 수 있어요.",
    bodyEn:
      "Only the eligibility result needed for the benefit is shared. The benefit location does not receive your name, passport number or date of birth. You can review every item before submitting.",
    href: "/pass",
    ctaKo: "개인정보 안내 보기",
    ctaEn: "View privacy details",
  },
  {
    icon: Gift,
    titleKo: "여행자 혜택은 어떻게 사용하나요?",
    titleEn: "How do I use a traveler benefit?",
    bodyKo:
      "K-Tour ID 혜택 이용처에서 ID를 제시하고 이용처의 요청을 확인하세요. 자격 확인이 끝나면 사용할 혜택과 최종 결제 금액을 보고 결제할 수 있습니다.",
    bodyEn:
      "Present your K-Tour ID at a benefit location and review its request. Once eligibility is confirmed, choose the benefit and review the final amount before paying.",
    href: "/present",
    ctaKo: "여행자 할인받기",
    ctaEn: "Get a traveler discount",
  },
  {
    icon: RotateCcw,
    titleKo: "결제를 취소하거나 환불받고 싶어요",
    titleEn: "How do cancellation and refunds work?",
    bodyKo:
      "결제 전에는 주문 화면에서 나갈 수 있어요. 아직 이용 전인 완료 주문은 영수증의 ‘주문 취소’에서 바로 취소할 수 있고, 결제 금액과 여행자 혜택이 모두 돌아옵니다.",
    bodyEn:
      "You can leave before confirming payment. If a completed order has not been used, choose ‘Cancel order’ on the receipt. Both the payment amount and traveler benefit are restored.",
    href: "/benefits",
    ctaKo: "최근 영수증 보기",
    ctaEn: "View recent receipt",
  },
  {
    icon: RefreshCcw,
    titleKo: "K-Tour ID가 만료되면 어떻게 하나요?",
    titleEn: "What if my K-Tour ID expires?",
    bodyKo:
      "K-Tour ID 화면에서 사용 상태와 기한을 확인할 수 있어요. 만료되었거나 사용할 수 없는 경우 신원을 다시 확인해 새 ID를 발급받으면 됩니다.",
    bodyEn:
      "Check availability and expiry on the K-Tour ID screen. If it has expired or is unavailable, verify your identity again to create a new ID.",
    href: "/onboarding?mode=renew",
    ctaKo: "K-Tour ID 갱신하기",
    ctaEn: "Renew K-Tour ID",
  },
] as const;

export default function HelpPage() {
  const { lang } = useLang();
  const { orders, session } = useApp();
  const ko = lang === "ko";
  const [back, setBack] = useState("/profile");
  const [requestedOrderId, setRequestedOrderId] = useState("");
  const [topic, setTopic] = useState<SupportTopic>("other");
  const [message, setMessage] = useState("");
  const [cases, setCases] = useState<SupportCase[]>([]);
  const [receipt, setReceipt] = useState<SupportCase | null>(null);
  const [submitError, setSubmitError] = useState(false);
  const externalOrders = useExternalServiceOrders(
    session.identity?.did ?? "guest",
  );
  const requestedOrder = externalOrders.find(
    (order) => order.id === requestedOrderId,
  );
  const requestedCommerceOrder = orders.find(
    (order) => order.id === requestedOrderId,
  );
  const requestedOrderLabel = requestedOrder
    ? `${requestedOrder.provider} · ${ko ? requestedOrder.title : requestedOrder.titleEn}`
    : requestedCommerceOrder
      ? `${requestedCommerceOrder.merchant} · ${ko ? requestedCommerceOrder.title : requestedCommerceOrder.titleEn}`
      : "";
  const recentOrderHref = requestedOrder
    ? `/services/orders/${requestedOrder.id}`
    : externalOrders[0]
      ? `/services/orders/${externalOrders[0].id}`
      : orders[0]
        ? `/orders/${orders[0].id}`
        : "/wallet";

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const orderId = query.get("order") ?? "";
    const requestedTopic = normalizeTopic(query.get("topic"));
    setRequestedOrderId(orderId);
    setTopic(requestedTopic ?? (orderId ? "payment" : "other"));
    setCases(readSupportCases(session.identity?.did ?? "guest"));
    if (orderId) setBack(query.get("source") === "commerce" ? `/orders/${orderId}` : `/services/orders/${orderId}`);
    else if (query.get("from") === "receipt") setBack("/benefits");
  }, [session.identity?.did]);

  useEffect(() => {
    if (!requestedCommerceOrder || requestedOrder) return;
    setBack(`/orders/${requestedCommerceOrder.id}`);
  }, [requestedCommerceOrder, requestedOrder]);

  const selectedTopic = useMemo(
    () => SUPPORT_TOPICS.find((candidate) => candidate.id === topic)!,
    [topic],
  );

  const submitCase = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(false);
    if (message.trim().length < 5) {
      setSubmitError(true);
      return;
    }
    const next = createSupportCase(session.identity?.did ?? "guest", {
      topic,
      message: message.trim(),
      orderId: requestedOrderId || undefined,
      orderLabel: requestedOrderLabel || undefined,
    });
    if (!next) {
      setSubmitError(true);
      return;
    }
    setReceipt(next);
    setCases((current) => [next, ...current].slice(0, 12));
    setMessage("");
  };

  return (
    <PhoneFrame>
      <PageHeader title={ko ? "도움말" : "Help"} back={back} />
      <main className="px-5 pt-1">
        <div className="mb-6">
          <h1 className="text-[22px] font-extrabold tracking-tight text-foreground">
            {ko ? "무엇을 도와드릴까요?" : "How can we help?"}
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
            {ko
              ? "여행 중 자주 필요한 내용을 빠르게 확인하세요."
              : "Find quick answers for the things you may need during your trip."}
          </p>
        </div>

        {(requestedOrder || requestedCommerceOrder) && (
          <section className="mb-5 rounded-2xl bg-surface-2 p-4 ring-1 ring-border">
            <p className="text-[12px] font-bold text-primary">
              {ko ? "문의할 이용 내역" : "SERVICE IN QUESTION"}
            </p>
            <h2 className="mt-2 text-[14px] font-bold">
              {requestedOrderLabel}
            </h2>
            <p className="mt-1 font-mono text-[12px] text-muted-foreground">
              {requestedOrder?.providerReference ?? requestedCommerceOrder?.receiptId ?? requestedOrderId}
            </p>
            <Link
              href={requestedOrder ? `/services/orders/${requestedOrder.id}` : `/orders/${requestedCommerceOrder!.id}`}
              className="pressable mt-3 inline-flex min-h-11 items-center rounded-xl bg-card px-3 text-[12px] font-bold text-primary ring-1 ring-border"
            >
              {ko ? "이용 내역으로 돌아가기" : "Back to service record"}
            </Link>
          </section>
        )}

        <section className="mb-6 rounded-[22px] bg-card p-4 ring-1 ring-border" aria-labelledby="support-case-title">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
              <LifeBuoy className="h-5 w-5" />
            </span>
            <div>
              <h2 id="support-case-title" className="text-[16px] font-bold">
                {ko ? "담당자에게 문의하기" : "Contact support"}
              </h2>
              <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
                {ko
                  ? "접수하면 이 화면에서 접수번호와 예상 답변 시각을 바로 확인할 수 있어요."
                  : "Submit a case to receive a case number and expected response time here."}
              </p>
            </div>
          </div>

          {receipt ? (
            <div role="status" className="mt-4 rounded-2xl bg-success/10 p-4 ring-1 ring-success/20">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-[14px] font-bold">{ko ? "문의가 접수됐어요" : "Your case is received"}</p>
              </div>
              <p className="mt-3 font-mono text-[13px] font-semibold text-foreground">{receipt.id}</p>
              <p className="mt-2 flex items-center gap-2 text-[12px] leading-5 text-muted-foreground">
                <Clock3 className="h-4 w-4 shrink-0" />
                {ko ? "예상 답변" : "Expected reply"} · {formatCaseDate(receipt.expectedReplyAt, ko)}
              </p>
              <button
                type="button"
                onClick={() => setReceipt(null)}
                className="pressable mt-3 min-h-11 text-[13px] font-bold text-primary underline underline-offset-4"
              >
                {ko ? "새 문의 작성" : "Create another case"}
              </button>
            </div>
          ) : (
            <form className="mt-4" onSubmit={submitCase}>
              <label htmlFor="support-topic" className="text-[12px] font-bold text-foreground">
                {ko ? "문의 유형" : "Topic"}
              </label>
              <select
                id="support-topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value as SupportTopic)}
                className="mt-2 min-h-12 w-full rounded-[14px] border border-border bg-background px-3 text-[14px] font-semibold outline-none focus:border-primary"
              >
                {SUPPORT_TOPICS.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>{ko ? candidate.ko : candidate.en}</option>
                ))}
              </select>

              {topic === "safety" && (
                <div className="mt-3 rounded-[14px] bg-primary/8 p-3">
                  <p className="text-[12px] font-bold text-foreground">
                    {ko ? "지금 위험하다면 앱 답변을 기다리지 마세요." : "If you are in immediate danger, do not wait for an app reply."}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <a href="tel:112" className="pressable flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-[13px] font-bold text-white">
                      <Phone className="h-4 w-4" />{ko ? "경찰 112" : "Police 112"}
                    </a>
                    <a href="tel:1330" className="pressable flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink px-3 text-[13px] font-bold text-white">
                      <Phone className="h-4 w-4" />{ko ? "여행 1330" : "Travel 1330"}
                    </a>
                  </div>
                </div>
              )}

              <label htmlFor="support-message" className="mt-4 block text-[12px] font-bold text-foreground">
                {ko ? `${selectedTopic.ko}에 필요한 내용을 알려주세요` : `Tell us about your ${selectedTopic.en.toLowerCase()} issue`}
              </label>
              <textarea
                id="support-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                required
                minLength={5}
                maxLength={600}
                rows={4}
                placeholder={ko ? "문제가 발생한 시각과 원하는 해결 방법을 적어주세요." : "Include when it happened and what outcome you need."}
                className="mt-2 w-full resize-none rounded-[14px] border border-border bg-background p-3 text-[14px] leading-6 outline-none placeholder:text-muted-foreground focus:border-primary"
              />
              <div className="mt-1 flex items-center justify-between text-[12px] text-muted-foreground">
                <span>{supportSla(topic, ko)}</span>
                <span>{message.length}/600</span>
              </div>
              {submitError && <p role="alert" className="mt-2 text-[12px] font-semibold text-destructive">{ko ? "문의 내용을 5자 이상 입력한 뒤 다시 시도해 주세요." : "Enter at least 5 characters, then try again."}</p>}
              <button
                type="submit"
                className="pressable mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-primary px-4 text-[14px] font-bold text-white"
              >
                <Send className="h-4 w-4" />{ko ? "문의 접수" : "Submit case"}
              </button>
            </form>
          )}

          <div className="mt-4 border-t border-border pt-4">
            <p className="text-[12px] leading-5 text-muted-foreground">
              {ko ? "전화 안내가 필요하면 한국관광공사 여행안내 1330으로 연결할 수 있어요." : "For phone assistance, call the Korea Travel Hotline at 1330."}
            </p>
            <a href="tel:1330" className="pressable mt-2 inline-flex min-h-11 items-center gap-2 text-[13px] font-bold text-primary underline underline-offset-4">
              <Phone className="h-4 w-4" />{ko ? "여행안내 1330 전화" : "Call Travel Hotline 1330"}
            </a>
          </div>
        </section>

        {cases.length > 0 && (
          <section className="mb-6" aria-labelledby="case-history-title">
            <h2 id="case-history-title" className="text-[14px] font-bold">{ko ? "최근 문의" : "Recent cases"}</h2>
            <div className="mt-2 space-y-2">
              {cases.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-2xl bg-surface-2 p-3 ring-1 ring-border">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-[12px] font-semibold">{item.id}</p>
                    <span className="rounded-full bg-success/10 px-2 py-1 text-[12px] font-bold text-success">{ko ? "접수" : "Received"}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-muted-foreground">{item.message}</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">{ko ? "예상 답변" : "Expected reply"} · {formatCaseDate(item.expectedReplyAt, ko)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="space-y-3">
          {FAQS.map(
            ({
              icon: Icon,
              titleKo,
              titleEn,
              bodyKo,
              bodyEn,
              href,
              ctaKo,
              ctaEn,
            }) => (
              <details
                key={titleEn}
                className="group rounded-2xl bg-card ring-1 ring-border open:ring-primary/25"
              >
                <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
                  <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="flex-1 text-[14px] font-bold leading-snug text-foreground">
                    {ko ? titleKo : titleEn}
                  </span>
                  <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <div className="border-t border-border px-4 pb-4 pt-3">
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    {ko ? bodyKo : bodyEn}
                  </p>
                  <Link
                    href={href === "/benefits" ? recentOrderHref : href}
                    className="pressable mt-3 inline-flex min-h-11 items-center rounded-xl bg-surface-2 px-3 text-[13px] font-bold text-primary ring-1 ring-border"
                  >
                    {ko ? ctaKo : ctaEn}
                  </Link>
                </div>
              </details>
            ),
          )}
        </div>
      </main>
    </PhoneFrame>
  );
}

function normalizeTopic(value: string | null): SupportTopic | null {
  if (value === "order" || value === "payment") return "payment";
  if (value === "refund" || value === "cancel") return "refund";
  if (value === "id" || value === "credential") return "id";
  if (value === "safety" || value === "emergency") return "safety";
  if (value === "other" || value === "general") return "other";
  return null;
}

function formatCaseDate(value: string, ko: boolean) {
  return new Intl.DateTimeFormat(ko ? "ko-KR" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function supportSla(topic: SupportTopic, ko: boolean) {
  if (topic === "safety") return ko ? "안전 문의: 1시간 이내 답변" : "Safety cases: reply within 1 hour";
  if (topic === "refund") return ko ? "환불 문의: 4시간 이내 답변" : "Refund cases: reply within 4 hours";
  return ko ? "보통 2시간 이내 답변" : "Usually replies within 2 hours";
}
