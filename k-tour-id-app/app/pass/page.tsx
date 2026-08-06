"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, ArrowRight, BadgeCheck, Eye, RefreshCcw, ScanLine, XCircle } from "lucide-react"
import { PhoneFrame, PageHeader } from "@/components/app/shell"
import { KPassCard } from "@/components/app/cards"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import { PERSONA_CONFIG } from "@/lib/catalog"
import { effectiveCredentialStatus, isCredentialUsable } from "@/lib/credential-status"

function benefitLabel(benefit: string, ko: boolean) {
  if (!ko) return benefit
  if (benefit === "Visitor workshop benefit") return "북촌 공예 체험 할인"
  if (benefit === "Welcome coupon pack") return "K-Tour ID 웰컴 쿠폰"
  if (benefit === "Everyday transit benefit") return "생활 교통 혜택"
  if (benefit === "Neighborhood service offers") return "동네 생활 서비스"
  if (benefit === "Regional culture program") return "지역 문화 프로그램"
  if (benefit === "Local mobility offers") return "지역 모빌리티 혜택"
  if (benefit === "Travel transit offers") return "여행 교통 혜택"
  return benefit
}

export default function PassPage() {
  const { session, hydrated } = useApp()
  const { t, lang } = useLang()
  const { capsule, identity } = session
  const ko = lang === "ko"
  const [statusPreview, setStatusPreview] = useState<"revoked" | "expired" | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("panel") !== "status") return
    const preview = params.get("preview")
    if (preview === "revoked" || preview === "expired") setStatusPreview(preview)
  }, [])

  if (!hydrated) return null

  if (!capsule) {
    return (
      <PhoneFrame>
        <PageHeader title={t("pass.title")} back="/wallet" />
        <main className="flex min-h-[70vh] flex-col justify-center px-6 pb-10 text-center">
          <p className="text-[13px] font-semibold text-primary">K-Tour ID</p>
          <h1 className="font-display text-balance mt-3 text-[31px] font-semibold leading-[1.25]">{ko ? "여행 서비스 자격을\n준비해 보세요." : "Create a private credential\nfor travel services."}</h1>
          <p className="mt-3 text-[15px] leading-6 text-muted-foreground">{ko ? "필요한 자격만 보여주고 여행자 혜택을 편리하게 이용할 수 있어요. 정부 신분증·비자·체류 허가를 대신하지 않습니다." : "Share only the eligibility you need and unlock traveler benefits. This is not a government ID, visa or immigration status."}</p>
          <Link href="/onboarding" className="pressable mt-8 flex min-h-14 items-center justify-center rounded-[14px] bg-primary px-5 text-[16px] font-semibold text-white">{ko ? "K-Tour ID 만들기" : "Create K-Tour ID"}</Link>
        </main>
      </PhoneFrame>
    )
  }

  const effectiveStatus = effectiveCredentialStatus(capsule)
  const unavailable = statusPreview != null || !isCredentialUsable(capsule)
  const statusTitle = statusPreview === "expired" || effectiveStatus === "expired"
    ? (ko ? "사용 기간이 끝났어요" : "Your K-Tour ID has expired")
    : (ko ? "지금은 사용할 수 없어요" : "Your K-Tour ID is unavailable")
  const persona = PERSONA_CONFIG[capsule.userType]

  return (
    <PhoneFrame>
      <PageHeader title={t("pass.title")} back="/wallet" />
      <main className="space-y-7 px-6 pt-2">
        {unavailable && (
          <section role="status" className="border-l-2 border-destructive py-1 pl-4 text-destructive">
            <div className="flex items-start gap-3">
              {statusPreview === "revoked" ? <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0" /> : <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />}
              <div><p className="text-[15px] font-semibold">{statusTitle}</p><p className="mt-1 text-[13px] leading-5 text-destructive/80">{ko ? "신원을 다시 확인해 새 K-Tour ID를 발급해 주세요." : "Verify your identity again to create a new K-Tour ID."}</p></div>
            </div>
            <Link href="/onboarding?mode=renew" className="pressable mt-3 flex min-h-11 items-center gap-2 pl-8 text-[13px] font-semibold underline underline-offset-4"><RefreshCcw className="h-4 w-4" /> {ko ? "다시 발급하기" : "Renew K-Tour ID"}</Link>
          </section>
        )}

        <KPassCard capsule={capsule} identity={identity} />

        <p className="border-l-2 border-gold pl-3 text-[13px] leading-5 text-muted-foreground">{ko ? "K-Tour ID는 민간 여행 서비스 자격이며 정부 신분증·비자·체류 허가를 대신하지 않아요." : "K-Tour ID is a private travel-service credential, not a government ID, visa or immigration status."}</p>

        {!unavailable && (
          <Link href={`/explore/${persona.firstItemId}`} className="pressable flex min-h-14 items-center justify-between rounded-[14px] bg-primary px-5 text-white">
            <span className="flex items-center gap-3 text-[16px] font-semibold"><BadgeCheck className="h-5 w-5" /> {persona.primaryCta[lang]}</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        )}

        {!unavailable && (
          <Link href="/present" className="pressable flex min-h-13 items-center justify-between border-y border-foreground/10 px-1 py-3 text-[14px] font-semibold">
            <span className="flex items-center gap-3"><ScanLine className="h-5 w-5 text-primary" />{ko ? "매장 QR로 자격 제시" : "Present eligibility at a merchant QR"}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        )}

        <section>
          <p className="text-[14px] font-semibold text-muted-foreground">{ko ? "이용 가능한 혜택" : "Available benefits"}</p>
          <div className="mt-3 divide-y divide-foreground/10 border-y border-foreground/10">
            {capsule.benefits.filter((benefit) => !benefit.toLowerCase().includes("concept") && (capsule.userType === "foreigner" || benefit !== "Visitor workshop benefit")).map((benefit) => (
              <div key={benefit} className="flex min-h-[58px] items-center gap-3 py-3">
                <BadgeCheck className="h-4 w-4 flex-shrink-0 text-success" />
                <span className="text-[14px] font-medium">{benefitLabel(benefit, ko)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-start gap-3 pb-3">
          <Eye className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
          <div><h2 className="text-[14px] font-semibold">{ko ? "개인정보는 필요한 만큼만" : "Only share what is needed"}</h2><p className="mt-1 text-[13px] leading-5 text-muted-foreground">{ko ? "매장에는 이름이나 여권번호 대신, 자격이 맞는지만 알려줘요." : "The shop receives eligibility—not your name or passport number."}</p></div>
        </section>
      </main>
    </PhoneFrame>
  )
}
