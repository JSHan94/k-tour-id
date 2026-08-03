"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { Check, CircleAlert, Clock3, RotateCcw, ShieldCheck } from "lucide-react"
import { PageHeader, PhoneFrame } from "@/components/app/shell"
import { useExternalServiceOrders } from "@/lib/external-service-orders"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"

export default function ConnectedServiceReceiptPage() {
  const params = useParams<{ orderId: string }>()
  const { session, hydrated } = useApp()
  const { lang } = useLang()
  const ko = lang === "ko"
  const orders = useExternalServiceOrders(session.identity?.did ?? "guest")
  const order = orders.find((candidate) => candidate.id === params.orderId)
  if (!hydrated) return null
  if (!order) return <PhoneFrame><PageHeader title={ko ? "이용 내역" : "Service receipt"} back="/wallet" /><main className="px-6 py-20 text-center"><CircleAlert className="mx-auto h-8 w-8 text-muted-foreground" /><h1 className="font-display mt-4 text-[25px] font-semibold">{ko ? "내역을 불러오지 못했어요" : "Receipt unavailable"}</h1><p className="mt-2 text-[13px] text-muted-foreground">{ko ? "이 기기에 저장된 연결 예시 내역을 찾을 수 없어요." : "This connection-preview record is not stored on this device."}</p><Link href="/wallet" className="mt-5 inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4">{ko ? "ID·지갑으로 돌아가기" : "Back to ID · Wallet"}</Link></main></PhoneFrame>

  const statusMeta = order.status === "confirmed"
    ? { icon: Check, title: ko ? "이용이 확인됐어요" : "Service confirmed", tone: "bg-success-surface text-success" }
    : order.status === "cancelled"
      ? { icon: RotateCcw, title: ko ? "이용을 취소했어요" : "Service cancelled", tone: "bg-secondary text-muted-foreground" }
      : order.status === "pending"
        ? { icon: Clock3, title: ko ? "결과 확인이 필요해요" : "Result needs review", tone: "bg-[#f6ecd6] text-[#7b5b20]" }
        : { icon: CircleAlert, title: ko ? "연결을 완료하지 못했어요" : "Connection wasn't completed", tone: "bg-primary/8 text-primary" }
  const Icon = statusMeta.icon
  return <PhoneFrame><PageHeader title={ko ? "이용 내역" : "Service receipt"} back="/wallet" /><main className="px-6 pb-10 pt-7"><div className="text-center"><span className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${statusMeta.tone}`}><Icon className="h-7 w-7" /></span><p className="mt-5 text-[12px] font-semibold text-primary">{order.provider} · {ko ? "연결 예시" : "Connection preview"}</p><h1 className="font-display mt-2 text-[28px] font-semibold">{statusMeta.title}</h1><p className="mt-2 text-[13px] text-muted-foreground">{new Intl.DateTimeFormat(ko ? "ko-KR" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.createdAt))}</p></div><section className="mt-8 rounded-[20px] bg-card p-5 ring-1 ring-border"><h2 className="text-[15px] font-semibold">{ko ? order.title : order.titleEn}</h2><p className="mt-2 text-[12px] leading-5 text-muted-foreground">{ko ? order.optionLabel : order.optionLabelEn}</p><div className="mt-4 border-t border-foreground/10 pt-2"><ReceiptRow label={ko ? "서비스 예상가" : "Estimated service price"} value={`₩${order.grossKRW.toLocaleString()}`} />{order.benefitAppliedKRW > 0 && <ReceiptRow label={ko ? "K-Tour ID 혜택" : "K-Tour ID benefit"} value={`−₩${order.benefitAppliedKRW.toLocaleString()}`} success />}<ReceiptRow label={ko ? "결제 금액" : "Amount charged"} value={`₩${order.paidKRW.toLocaleString()}`} strong /><ReceiptRow label={ko ? "참조 번호" : "Reference"} value={order.id} mono /></div></section><div className="mt-5 flex items-start gap-3 rounded-[16px] bg-success-surface p-4 text-success"><ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" /><p className="text-[12px] leading-5">{ko ? "실제 제휴·결제 전의 연결 예시 내역입니다. 실제 연동 시 제공자 상태와 문의·취소 경로가 이 화면에 함께 표시됩니다." : "This is a connection-preview record before live partnership and payment. A live integration would also show provider status and support or cancellation paths."}</p></div><Link href={`/services/${order.serviceId}`} className="pressable mt-6 flex min-h-14 items-center justify-center rounded-[14px] bg-ink text-[14px] font-semibold text-white">{ko ? "서비스 다시 보기" : "View service again"}</Link></main></PhoneFrame>
}

function ReceiptRow({ label, value, success = false, strong = false, mono = false }: { label: string; value: string; success?: boolean; strong?: boolean; mono?: boolean }) {
  return <div className={`flex items-start justify-between gap-4 py-3 text-[13px] ${strong ? "border-t border-foreground/10" : ""}`}><span className="text-muted-foreground">{label}</span><span className={`${success ? "text-success" : ""} ${strong ? "font-bold" : "font-semibold"} ${mono ? "break-all font-mono text-[12px]" : "tabular"}`}>{value}</span></div>
}
