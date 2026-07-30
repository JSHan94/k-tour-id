"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, BadgeCheck, ChevronRight, Eye, RefreshCcw, ScanLine, XCircle } from "lucide-react"
import { PhoneFrame, PageHeader, SectionTitle } from "@/components/app/shell"
import { Seal } from "@/components/app/seal"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"

const USER_TYPE = {
  korean: { ko: "국내 여행자", en: "Korean traveler" },
  foreigner: { ko: "외국인 여행자", en: "International visitor" },
  "long-term": { ko: "장기 체류 여행자", en: "Long-stay visitor" },
} as const

function benefitLabel(benefit: string, ko: boolean) {
  if (!ko) return benefit
  if (benefit === "Visitor workshop benefit") return "북촌 공예 체험 할인"
  if (benefit === "Welcome coupon pack") return "K-Tour 웰컴 쿠폰"
  return benefit
}

export default function PassPage() {
  const { session } = useApp()
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

  if (!capsule) {
    return (
      <PhoneFrame>
        <PageHeader title={t("pass.title")} />
        <div className="flex flex-col items-center gap-4 px-6 pt-20 text-center">
          <Seal size={56} />
          <p className="max-w-[290px] text-[14px] leading-relaxed text-muted-foreground">
            {ko ? "K-Tour ID를 발급하면 여행자 혜택을 편리하게 이용할 수 있어요." : "Create your K-Tour ID to use eligible traveler benefits."}
          </p>
          <Link href="/onboarding" className="bg-brand-gradient pressable flex min-h-12 items-center rounded-xl px-5 text-[14px] font-semibold text-white">
            {ko ? "K-Tour ID 만들기" : "Create K-Tour ID"}
          </Link>
        </div>
      </PhoneFrame>
    )
  }

  const unavailable = statusPreview != null || capsule.status !== "active"
  const statusTitle = statusPreview === "expired"
    ? (ko ? "사용 기간이 끝났어요" : "Your K-Tour ID has expired")
    : statusPreview === "revoked"
      ? (ko ? "지금은 사용할 수 없어요" : "Your K-Tour ID is unavailable")
      : (ko ? "여행 중 사용 가능" : "Ready to use during your trip")
  const validUntil = new Intl.DateTimeFormat(ko ? "ko-KR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(capsule.expiresAt))
  const typeLabel = USER_TYPE[capsule.userType][ko ? "ko" : "en"]

  return (
    <PhoneFrame>
      <PageHeader title={t("pass.title")} />

      <div className="space-y-6 px-5 pt-1">
        {unavailable && (
          <div role="status" className="rounded-3xl border border-primary/20 bg-[#f7e8e4] p-4 text-primary">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-card ring-1 ring-primary/15">
                {statusPreview === "revoked" ? <XCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-extrabold">{statusTitle}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-primary/85">
                  {ko ? "신원을 다시 확인해 새 K-Tour ID를 발급해 주세요." : "Verify your identity again to create a new K-Tour ID."}
                </p>
              </div>
            </div>
            <Link href="/onboarding?mode=renew" className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-bold text-white">
              <RefreshCcw className="h-4 w-4" /> {ko ? "K-Tour ID 다시 발급하기" : "Renew K-Tour ID"}
            </Link>
          </div>
        )}

        <section className="card-credential relative overflow-hidden rounded-3xl p-5 text-white">
          <Seal size={52} className="absolute right-4 top-4" />
          <p className="text-[13px] font-semibold text-gold">K-Tour ID</p>
          <div className="mt-6 flex items-center gap-3">
            <img
              src={identity?.photoUrl ?? "/abstract-profile.png"}
              alt={ko ? `${capsule.holderName} 프로필 사진` : `${capsule.holderName} profile photo`}
              className="h-14 w-14 rounded-full object-cover ring-2 ring-[var(--gold)]/70"
            />
            <div className="min-w-0">
              <h1 className="break-words text-[20px] font-bold leading-tight">{capsule.holderName}</h1>
              <p className="mt-0.5 text-[13px] text-white/75">{typeLabel}</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/15 pt-4">
            <div>
              <p className="text-[12px] text-white/70">{ko ? "상태" : "Status"}</p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-[14px] font-bold">
                {unavailable ? <XCircle className="h-4 w-4" /> : <BadgeCheck className="h-4 w-4 text-gold" />}
                {unavailable ? (ko ? "사용 불가" : "Unavailable") : (ko ? "사용 가능" : "Available")}
              </p>
            </div>
            <div>
              <p className="text-[12px] text-white/70">{ko ? "사용 기한" : "Valid until"}</p>
              <p className="mt-1 text-[14px] font-bold tabular-nums">{validUntil}</p>
            </div>
          </div>
        </section>

        {!unavailable && (
          <Link href="/present" className="bg-brand-gradient pressable flex min-h-14 items-center gap-3 rounded-2xl px-4 text-white shadow-sm">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/12"><ScanLine className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold">{ko ? "여행자 할인받기" : "Get a traveler discount"}</p>
              <p className="mt-0.5 text-[12px] text-white/75">{ko ? "매장 요청을 확인하고 필요한 정보만 공유해요" : "Review the shop request and share only what is needed"}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-white/70" />
          </Link>
        )}

        <section>
          <SectionTitle>{ko ? "이용 가능한 혜택" : "Available benefits"}</SectionTitle>
          <div className="space-y-2">
            {capsule.benefits.filter((benefit) => !benefit.toLowerCase().includes("concept")).map((benefit) => (
              <div key={benefit} className="flex min-h-12 items-center gap-3 rounded-2xl bg-card px-4 ring-1 ring-border">
                <BadgeCheck className="h-4 w-4 flex-shrink-0 text-success" />
                <span className="text-[14px] font-medium text-foreground">{benefitLabel(benefit, ko)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-surface-2 p-4 ring-1 ring-border">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <h2 className="text-[15px] font-bold text-foreground">{ko ? "개인정보는 필요한 만큼만" : "Only share what is needed"}</h2>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            {ko ? "혜택을 받을 때 이름이나 여권번호 대신, 자격이 맞는지만 매장에 알려줘요. 공유할 내용은 제출 전에 확인할 수 있습니다." : "When you use a benefit, the shop receives an eligibility result instead of your name or passport number. You can review it before sharing."}
          </p>
        </section>
      </div>
    </PhoneFrame>
  )
}
