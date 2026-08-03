"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronDown, Gift, RefreshCcw, RotateCcw, ShieldCheck } from "lucide-react"
import { PhoneFrame, PageHeader } from "@/components/app/shell"
import { useLang } from "@/lib/i18n/lang-provider"
import { useApp } from "@/lib/store/app-provider"

const FAQS = [
  {
    icon: ShieldCheck,
    titleKo: "혜택 이용처에는 어떤 정보가 공유되나요?",
    titleEn: "What information does a benefit location receive?",
    bodyKo: "할인에 필요한 자격 결과만 공유해요. 이름, 여권번호, 생년월일 같은 원문 정보는 혜택 이용처에 전달하지 않습니다. 제출 전 화면에서 공유 항목을 다시 확인할 수 있어요.",
    bodyEn: "Only the eligibility result needed for the benefit is shared. The benefit location does not receive your name, passport number or date of birth. You can review every item before submitting.",
    href: "/pass",
    ctaKo: "개인정보 안내 보기",
    ctaEn: "View privacy details",
  },
  {
    icon: Gift,
    titleKo: "여행자 혜택은 어떻게 사용하나요?",
    titleEn: "How do I use a traveler benefit?",
    bodyKo: "K-Tour ID 혜택 이용처에서 ID를 제시하고 이용처의 요청을 확인하세요. 자격 확인이 끝나면 사용할 혜택과 최종 결제 금액을 보고 결제할 수 있습니다.",
    bodyEn: "Present your K-Tour ID at a benefit location and review its request. Once eligibility is confirmed, choose the benefit and review the final amount before paying.",
    href: "/present",
    ctaKo: "여행자 할인받기",
    ctaEn: "Get a traveler discount",
  },
  {
    icon: RotateCcw,
    titleKo: "결제를 취소하거나 환불받고 싶어요",
    titleEn: "How do cancellation and refunds work?",
    bodyKo: "결제 전에는 주문 화면에서 나갈 수 있어요. 아직 이용 전인 완료 주문은 영수증의 ‘주문 취소’에서 바로 취소할 수 있고, 결제 금액과 여행자 혜택이 모두 돌아옵니다.",
    bodyEn: "You can leave before confirming payment. If a completed order has not been used, choose ‘Cancel order’ on the receipt. Both the payment amount and traveler benefit are restored.",
    href: "/benefits",
    ctaKo: "최근 영수증 보기",
    ctaEn: "View recent receipt",
  },
  {
    icon: RefreshCcw,
    titleKo: "K-Tour ID가 만료되면 어떻게 하나요?",
    titleEn: "What if my K-Tour ID expires?",
    bodyKo: "K-Tour ID 화면에서 사용 상태와 기한을 확인할 수 있어요. 만료되었거나 사용할 수 없는 경우 신원을 다시 확인해 새 ID를 발급받으면 됩니다.",
    bodyEn: "Check availability and expiry on the K-Tour ID screen. If it has expired or is unavailable, verify your identity again to create a new ID.",
    href: "/onboarding?mode=renew",
    ctaKo: "K-Tour ID 갱신하기",
    ctaEn: "Renew K-Tour ID",
  },
] as const

export default function HelpPage() {
  const { lang } = useLang()
  const { orders } = useApp()
  const ko = lang === "ko"
  const [back, setBack] = useState("/profile")
  const recentOrderHref = orders[0] ? `/orders/${orders[0].id}` : "/wallet"

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("from") === "receipt") setBack("/benefits")
  }, [])

  return (
    <PhoneFrame>
      <PageHeader title={ko ? "도움말" : "Help"} back={back} />
      <main className="px-5 pt-1">
        <div className="mb-6">
          <h1 className="text-[22px] font-extrabold tracking-tight text-foreground">{ko ? "무엇을 도와드릴까요?" : "How can we help?"}</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
            {ko ? "여행 중 자주 필요한 내용을 빠르게 확인하세요." : "Find quick answers for the things you may need during your trip."}
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map(({ icon: Icon, titleKo, titleEn, bodyKo, bodyEn, href, ctaKo, ctaEn }) => (
            <details key={titleEn} className="group rounded-2xl bg-card ring-1 ring-border open:ring-primary/25">
              <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
                <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-secondary text-primary"><Icon className="h-5 w-5" /></span>
                <span className="flex-1 text-[14px] font-bold leading-snug text-foreground">{ko ? titleKo : titleEn}</span>
                <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="border-t border-border px-4 pb-4 pt-3">
                <p className="text-[13px] leading-relaxed text-muted-foreground">{ko ? bodyKo : bodyEn}</p>
                <Link href={href === "/benefits" ? recentOrderHref : href} className="pressable mt-3 inline-flex min-h-11 items-center rounded-xl bg-surface-2 px-3 text-[13px] font-bold text-primary ring-1 ring-border">
                  {ko ? ctaKo : ctaEn}
                </Link>
              </div>
            </details>
          ))}
        </div>
      </main>
    </PhoneFrame>
  )
}
