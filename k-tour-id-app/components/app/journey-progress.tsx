"use client"

import Link from "next/link"
import { Check, ChevronRight, Landmark, ReceiptText, RotateCcw, ScanLine, TicketCheck } from "lucide-react"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import { cn } from "@/lib/utils"

const STEPS = [
  { icon: ScanLine, ko: "자격 증명", en: "Prove" },
  { icon: TicketCheck, ko: "혜택·결제", en: "Pay" },
  { icon: Landmark, ko: "가맹점 정산", en: "Settle" },
  { icon: ReceiptText, ko: "증거 완료", en: "Evidence" },
] as const

export function JourneyProgress() {
  const { demoJourney, resetDemoJourney } = useApp()
  const { lang } = useLang()
  const ko = lang === "ko"
  const refunded = demoJourney.stage === "refunded"
  const active = ["request-ready", "checking", "presentation-created", "presentation-expired", "presentation-revoked", "presentation-offline"].includes(demoJourney.stage)
    ? 0
    : demoJourney.stage === "benefit-ready"
      ? 1
      : demoJourney.stage === "paid"
        ? 2
        : 3
  const complete = demoJourney.stage === "anchored" || refunded
  const href = active === 0
    ? "/present"
    : active === 1
      ? `/benefits?verified=1&presentation=${encodeURIComponent(demoJourney.presentationId)}`
      : active === 2
        ? "/partner/settlements"
        : refunded ? "/benefits" : "/evidence"

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_10px_30px_rgba(28,24,19,0.045)]">
      <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4">
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-primary">90-sec demo journey</p>
          <p className="mt-0.5 text-[13px] font-bold">{refunded ? (ko ? "환불 완료 · 거래 종료" : "Refunded · transaction closed") : complete ? (ko ? "하나의 영수증으로 전체 흐름 완료" : "One receipt completed the full journey") : (ko ? "다음 단계까지 이어서 시연" : "Continue the same transaction")}</p>
        </div>
        {complete && <button type="button" onClick={resetDemoJourney} aria-label={ko ? "데모 초기화" : "Reset demo"} className="pressable grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground"><RotateCcw className="h-4 w-4" /></button>}
      </div>
      <div className="grid grid-cols-4 gap-1 px-3 pb-3">
        {STEPS.map(({ icon: Icon, ko: koLabel, en }, index) => {
          const done = complete || index < active
          const current = !complete && index === active
          return (
            <div key={en} className={cn("rounded-2xl px-1 py-2 text-center", current ? "bg-primary/7" : "bg-surface-2/70")}>
              <span className={cn("mx-auto grid h-7 w-7 place-items-center rounded-full", done ? "bg-success text-white" : current ? "bg-primary text-white" : "bg-card text-muted-foreground ring-1 ring-border")}>
                {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              </span>
              <p className={cn("mt-1 text-[9px] font-bold", current ? "text-primary" : done ? "text-success" : "text-muted-foreground")}>{ko ? koLabel : en}</p>
            </div>
          )
        })}
      </div>
      <Link href={href} className="pressable flex min-h-11 items-center justify-between border-t border-border bg-surface-2 px-4 text-[11px] font-bold">
        <span>{refunded ? (ko ? "환불 영수증 보기" : "View refund receipt") : complete ? (ko ? "공통 영수증 보기" : "View shared receipt") : (ko ? "이 거래 계속하기" : "Continue this transaction")}</span>
        <span className="inline-flex items-center gap-1 font-mono text-[9px] text-muted-foreground">{demoJourney.receiptId}<ChevronRight className="h-3.5 w-3.5" /></span>
      </Link>
    </section>
  )
}
