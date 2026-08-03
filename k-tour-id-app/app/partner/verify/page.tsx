"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  ScanLine,
  TicketCheck,
  XCircle,
} from "lucide-react"
import { QRCode } from "@/components/qr-code"
import { PageIntro, Panel } from "@/components/partner/partner-shell"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import { cn } from "@/lib/utils"

type VerifyState = "waiting" | "submitted" | "verified" | "failed" | "expired" | "offline" | "refunded"

const PREVIEW_STATES: VerifyState[] = ["waiting", "submitted", "verified", "failed", "expired", "offline", "refunded"]

const MERCHANT_KO: Record<string, string> = {
  "Bukchon Craft House": "북촌 공방",
  "Seoul Living Mobility": "서울 생활 모빌리티",
  "Suwon Local Culture Lab": "수원 로컬문화연구소",
  "Yeonhui Table": "연희 테이블",
  "Euljiro Design Market": "을지로 디자인 마켓",
  "Insadong Tea Room": "인사동 찻집",
}

export default function PartnerVerifyPage() {
  const { demoJourney } = useApp()
  const { lang } = useLang()
  const ko = lang === "ko"
  const [state, setState] = useState<VerifyState>("waiting")
  const merchant = ko ? (MERCHANT_KO[demoJourney.merchantDisplay] ?? demoJourney.merchantDisplay) : demoJourney.merchantDisplay
  const product = ko ? demoJourney.productKo : demoJourney.product
  const qrValue = useMemo(
    () => "ktourid://present?request=" + demoJourney.requestId + "&mode=simulated",
    [demoJourney.requestId],
  )

  useEffect(() => {
    const preview = new URLSearchParams(window.location.search).get("preview") as VerifyState | null
    if (preview && PREVIEW_STATES.includes(preview)) {
      setState(preview)
      return
    }
    if (demoJourney.stage === "checking") setState("submitted")
    else if (demoJourney.stage === "presentation-expired") setState("expired")
    else if (demoJourney.stage === "presentation-offline") setState("offline")
    else if (demoJourney.stage === "presentation-created" || demoJourney.stage === "presentation-revoked") setState("failed")
    else if (demoJourney.stage === "refunded") setState("refunded")
    else if (["benefit-ready", "paid", "settlement-submitted", "anchored"].includes(demoJourney.stage)) setState("verified")
    else setState("waiting")
  }, [demoJourney.stage])

  return (
    <>
      <PageIntro
        eyebrow={ko ? "현장 혜택 확인" : "In-store benefit check"}
        title={ko ? "방문객의 이용 혜택을 확인하세요." : "Check the visitor's benefit."}
        body={ko ? "카운터에서 이 화면을 열어 두세요. 방문객이 K-Tour ID에서 요청을 승인하면 확인 결과가 바로 표시됩니다." : "Keep this screen open at the counter. The result appears as soon as the visitor approves the request in K-Tour ID."}
      />

      <div className="mx-auto max-w-5xl" aria-live="polite" aria-busy={state === "submitted"}>
        {state === "waiting" && <WaitingCard qrValue={qrValue} ko={ko} merchant={merchant} product={product} />}
        {state === "submitted" && <CheckingCard ko={ko} />}
        {state === "verified" && (
          <ApprovedCard
            gross={demoJourney.grossKRW}
            discount={demoJourney.voucherKRW}
            payable={demoJourney.paidKRW}
            paid={["paid", "settlement-submitted", "anchored"].includes(demoJourney.stage)}
            ko={ko}
            merchant={merchant}
          />
        )}
        {state === "refunded" && <RefundedCard gross={demoJourney.grossKRW} originalPaid={demoJourney.paidKRW} returned={demoJourney.refundCashKRW ?? demoJourney.paidKRW} restoredVoucher={demoJourney.refundVoucherKRW ?? 0} benefitReversed={(demoJourney.reversedBenefitKRW ?? 0) > 0} settledUsageDays={demoJourney.settledUsageDays} ko={ko} />}
        {(state === "failed" || state === "expired" || state === "offline") && <NotApprovedCard reason={state === "expired" ? "expired" : state === "offline" ? "offline" : "policy"} gross={demoJourney.grossKRW} ko={ko} />}
      </div>
    </>
  )
}

function RefundedCard({ gross, originalPaid, returned, restoredVoucher, benefitReversed, settledUsageDays, ko }: { gross: number; originalPaid: number; returned: number; restoredVoucher: number; benefitReversed: boolean; settledUsageDays?: number; ko: boolean }) {
  const partialRefund = returned < originalPaid
  return (
    <Panel>
      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-8">
        <div>
          <StatusPill icon={CheckCircle2} label={ko ? "환불 완료" : "Refund complete"} tone="success" />
          <h2 className="mt-5 text-[30px] font-extrabold tracking-tight">{partialRefund ? (ko ? "사용 기간을 반영해 일부 환불됐습니다." : "The unused portion was refunded.") : restoredVoucher > 0 ? (ko ? "결제와 고객 소유 바우처가 반환됐습니다." : "Payment and customer-owned voucher were restored.") : benefitReversed ? (ko ? "결제와 혜택 사용이 취소됐습니다." : "Payment and benefit reversed.") : (ko ? "결제가 환불됐습니다." : "Payment refunded.")}</h2>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">{partialRefund ? (ko ? `${settledUsageDays ?? 1}일 이용분을 정산하고 방문객에게 ₩${returned.toLocaleString()}이 반환됐습니다. 이미 사용한 혜택은 복구되지 않습니다.` : `After settling ${settledUsageDays ?? 1} active day${(settledUsageDays ?? 1) === 1 ? "" : "s"}, ₩${returned.toLocaleString()} was returned. The used benefit remains redeemed.`) : restoredVoucher > 0 ? (ko ? `방문객에게 여행 잔액 ₩${returned.toLocaleString()}과 고객 소유 바우처 ₩${restoredVoucher.toLocaleString()}이 각각 돌아갔습니다.` : `The visitor received ₩${returned.toLocaleString()} in travel balance and ₩${restoredVoucher.toLocaleString()} in customer-owned voucher value.`) : benefitReversed ? (ko ? `방문객에게 ₩${returned.toLocaleString()}이 반환됐고, 이용 전 혜택도 다시 사용할 수 있습니다.` : `The visitor received ₩${returned.toLocaleString()} back and the unused benefit is available again.`) : (ko ? `방문객에게 ₩${returned.toLocaleString()}이 반환됐습니다.` : `The visitor received ₩${returned.toLocaleString()} back.`)}</p>
          <div className="mt-6 rounded-2xl bg-surface-2 p-4">
            <p className="text-[13px] font-extrabold">{ko ? "카운터에서 추가로 처리할 일은 없습니다" : "No action needed at the counter"}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{ko ? "이 주문은 종료됐습니다. 방문객이 새로 주문할 때만 혜택 확인을 다시 시작하세요." : "This order is closed. Start a new benefit request only if the visitor places another order."}</p>
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5">
          <p className="text-[12px] font-bold text-muted-foreground">{ko ? "기존 주문 금액" : "Original order"}</p>
          <p className="mt-1 text-[38px] font-extrabold tracking-tight tabular-nums">₩{gross.toLocaleString()}</p>
          <p className="mt-5 border-t border-border pt-4 text-[12px] leading-relaxed text-muted-foreground">{ko ? "현재 결제할 금액: ₩0" : "Amount due for this order: ₩0"}</p>
        </div>
      </div>
    </Panel>
  )
}

function WaitingCard({ qrValue, ko, merchant, product }: { qrValue: string; ko: boolean; merchant: string; product: string }) {
  return (
    <Panel>
      <div className="grid gap-8 p-6 md:grid-cols-[240px_minmax(0,1fr)] md:items-center md:p-8">
        <div className="mx-auto w-fit rounded-3xl border border-border bg-white p-4 shadow-sm md:mx-0">
          <QRCode value={qrValue} size={208} className="border-0" ariaLabel={ko ? "K-Tour ID 혜택 확인 요청 QR 코드" : "K-Tour ID benefit request QR code"} />
        </div>
        <div className="text-center md:text-left">
          <StatusPill icon={Clock3} label={ko ? "방문객 승인 대기 중" : "Waiting for visitor"} tone="waiting" />
          <h2 className="mt-5 text-[26px] font-extrabold tracking-tight">{product}</h2>
          <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-muted-foreground">
            {ko ? `방문객에게 K-Tour ID로 QR을 스캔해 달라고 안내하세요. ${merchant}의 요청 내용을 확인한 뒤 휴대폰에서 승인합니다.` : `Ask the visitor to scan this QR with K-Tour ID. They will review ${merchant}'s request and approve it on their phone.`}
          </p>
          <div className="mt-6 rounded-2xl bg-surface-2 p-4">
            <p className="text-[12px] font-bold">{ko ? "방문객에게 표시되는 정보" : "What the visitor sees"}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              {ko ? "가맹점 이름, 적용할 혜택, 이용 조건 확인에 필요한 정보가 표시됩니다." : "Your store name, the benefit and the information needed to check eligibility."}
            </p>
          </div>
        </div>
      </div>
    </Panel>
  )
}

function CheckingCard({ ko }: { ko: boolean }) {
  return (
    <Panel>
      <div className="grid min-h-[420px] place-items-center p-8 text-center" aria-live="polite">
        <div>
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#f7e8e4] text-primary">
            <LoaderCircle className="h-9 w-9 animate-spin" />
          </span>
          <h2 className="mt-6 text-[26px] font-extrabold tracking-tight">{ko ? "혜택을 확인하고 있어요…" : "Checking the benefit…"}</h2>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-muted-foreground">
            {ko ? "방문객이 요청을 승인했습니다. 결과가 표시될 때까지 이 화면을 열어 두세요." : "The visitor approved the request. Keep this screen open for the result."}
          </p>
        </div>
      </div>
    </Panel>
  )
}

function ApprovedCard({ gross, discount, payable, paid, ko, merchant }: { gross: number; discount: number; payable: number; paid: boolean; ko: boolean; merchant: string }) {
  return (
    <Panel>
      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-8">
        <div>
          <StatusPill icon={CheckCircle2} label={ko ? "혜택 확인 완료" : "Benefit approved"} tone="success" />
          <h2 className="mt-5 text-[30px] font-extrabold tracking-tight">{ko ? `₩${discount.toLocaleString()} 혜택을 적용하세요.` : `Apply the ₩${discount.toLocaleString()} benefit.`}</h2>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
            {ko ? `이 방문객은 ${merchant} 혜택을 1회 이용할 수 있습니다. 카운터에서 신분증을 별도로 확인하거나 복사할 필요는 없습니다.` : `This visitor can use the ${merchant} benefit once. No identity document needs to be checked at the counter.`}
          </p>

          <div className={cn("mt-6 flex items-start gap-3 rounded-2xl p-4", paid ? "bg-success-surface" : "bg-[#fbf2d9]")}>
            {paid ? <TicketCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" /> : <ScanLine className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#8a642b]" />}
            <div>
              <p className={cn("text-[13px] font-extrabold", paid ? "text-success" : "text-[#735116]")}>{paid ? (ko ? "결제 확인 완료" : "Payment confirmed") : (ko ? "다음 단계: 방문객 결제" : "Next: customer payment")}</p>
              <p className={cn("mt-1 text-[12px] leading-relaxed", paid ? "text-success/80" : "text-[#735116]/80")}>{paid ? (ko ? "결제가 완료됐습니다. 방문객과 예약 내용을 확인하세요." : "The order is paid. Confirm the booking with the visitor.") : (ko ? `방문객에게 K-Tour ID에서 ₩${payable.toLocaleString()} 결제를 승인해 달라고 안내하세요.` : `Ask the visitor to approve ₩${payable.toLocaleString()} in K-Tour ID.`)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-ink p-5 text-white">
          <p className="text-[12px] font-bold text-white/70">{ko ? "방문객 결제 금액" : "Customer total"}</p>
          <p className="mt-1 text-[38px] font-extrabold tracking-tight tabular-nums">₩{payable.toLocaleString()}</p>
          <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
            <PriceRow label={ko ? "상품 금액" : "Order total"} value={"₩" + gross.toLocaleString()} />
            <PriceRow label={ko ? "방문객 혜택" : "Visitor benefit"} value={"−₩" + discount.toLocaleString()} accent />
          </div>
        </div>
      </div>
    </Panel>
  )
}

function NotApprovedCard({ reason, gross, ko }: { reason: "expired" | "offline" | "policy"; gross: number; ko: boolean }) {
  const retry = reason === "expired" || reason === "offline"
  return (
    <Panel>
      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-8">
        <div>
          <StatusPill icon={retry ? AlertTriangle : XCircle} label={reason === "offline" ? (ko ? "연결 상태를 확인해 주세요" : "Connection issue") : (ko ? "혜택을 확인할 수 없습니다" : "Benefit not approved")} tone="danger" />
          <h2 className="mt-5 text-[30px] font-extrabold tracking-tight">{reason === "offline" ? (ko ? "혜택 적용을 잠시 보류하세요." : "Wait before applying the benefit.") : (ko ? "혜택을 적용하지 마세요." : "Do not apply the benefit.")}</h2>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
            {reason === "expired"
              ? (ko ? "방문객이 제한 시간 안에 승인을 마치지 못했습니다. 준비되면 새 QR 요청을 스캔하도록 안내하세요." : "The visitor did not finish before the request expired. Ask them to scan a new request when they are ready.")
              : reason === "offline"
                ? (ko ? "서비스 연결 문제로 이용 조건을 확인하지 못했습니다. 연결이 복구되면 다시 시도해 주세요." : "Eligibility could not be checked because the service is unavailable. Ask the visitor to retry when the connection returns.")
              : (ko ? "방문객이 이 캠페인의 이용 조건에 해당하지 않습니다. 신분증을 확인하거나 복사할 필요는 없습니다." : "The visitor does not meet this campaign's conditions. You do not need to inspect or copy their identity document.")}
          </p>
          <div className="mt-6 rounded-2xl bg-surface-2 p-4">
            <p className="text-[13px] font-extrabold">{ko ? "다음 단계: 방문객 의사 확인" : "Next: confirm with the visitor"}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              {ko ? `방문객이 동의하면 정상가 ₩${gross.toLocaleString()}으로 진행하고, 원하지 않으면 주문을 취소하세요.` : `Continue at the regular ₩${gross.toLocaleString()} price only if the visitor agrees, or cancel the order.`}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5">
          <p className="text-[12px] font-bold text-muted-foreground">{ko ? "정상가" : "Regular total"}</p>
          <p className="mt-1 text-[38px] font-extrabold tracking-tight tabular-nums">₩{gross.toLocaleString()}</p>
          <p className="mt-5 border-t border-border pt-4 text-[12px] leading-relaxed text-muted-foreground">{ko ? "혜택은 사용되지 않았고 할인 결제도 생성되지 않았습니다." : "No benefit was used and no discounted payment was created."}</p>
        </div>
      </div>
    </Panel>
  )
}

function StatusPill({ icon: Icon, label, tone }: { icon: typeof Clock3; label: string; tone: "waiting" | "success" | "danger" }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-extrabold",
      tone === "success" ? "bg-success-surface text-success" : tone === "danger" ? "bg-[#f7e8e4] text-primary" : "bg-[#f5ecdc] text-[#8a642b]",
    )}>
      <Icon className="h-4 w-4" /> {label}
    </span>
  )
}

function PriceRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 text-[13px]">
      <span className="text-white/60">{label}</span>
      <span className={cn("font-bold tabular-nums", accent && "text-gold")}>{value}</span>
    </div>
  )
}
