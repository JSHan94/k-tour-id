"use client"

import { useEffect, useState } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronRight, CreditCard, Bell, HelpCircle, LogOut, BadgeCheck } from "lucide-react"
import { PhoneFrame, PageHeader, SectionTitle } from "@/components/app/shell"
import { Seal } from "@/components/app/seal"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import { formatKRW, localizedNationality } from "@/lib/format"
import { isCredentialUsable } from "@/lib/credential-status"

const MENU = [
  { icon: CreditCard, title: "Travel balance", titleKo: "여행 잔액", subtitle: "Transactions, add money and receive", subtitleKo: "거래 내역·충전·받기", href: "/wallet" },
  { icon: Bell, title: "Notifications", titleKo: "알림", subtitle: "Payments, benefits and security", subtitleKo: "결제·혜택·보안 알림", href: "/alerts" },
  { icon: HelpCircle, title: "Help & Support", titleKo: "도움말·지원", subtitle: "Benefits, refunds and ID renewal", subtitleKo: "혜택·취소·환불·ID 갱신 안내", href: "/help" },
]

export default function ProfilePage() {
  const router = useRouter()
  const { session, transactions, vouchers, reset, hydrated } = useApp()
  const { t, lang } = useLang()
  const { capsule, identity } = session
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  const name = capsule?.holderName ?? identity?.displayName ?? t("home.guest")
  const spent = Math.max(0, transactions.filter((tx) => tx.category !== "topup").reduce((sum, tx) => sum - tx.amountKRW, 0))
  const saved = vouchers.filter((voucher) => voucher.status === "redeemed").reduce((sum, voucher) => sum + voucher.valueKRW, 0)

  useEffect(() => {
    if (hydrated && !session.onboarded) router.replace("/onboarding")
  }, [hydrated, router, session.onboarded])

  if (!hydrated || !session.onboarded) return null

  const stats = [
    { label: t("profile.spent"), value: formatKRW(spent) },
    { label: t("profile.payments"), value: String(transactions.filter((tx) => tx.amountKRW < 0).length) },
    { label: t("profile.saved"), value: formatKRW(saved) },
  ]

  const signOut = () => {
    reset()
    router.push("/onboarding")
  }

  return (
    <PhoneFrame>
      <PageHeader title={t("profile.title")} />

      <div className="space-y-8 px-6 pt-2">
        <div>
          <div className="flex items-center gap-3">
            <img src={identity?.photoUrl ?? "/abstract-profile.png"} alt={name} className="h-14 w-14 rounded-full object-cover ring-1 ring-border" />
            <div className="min-w-0 flex-1">
              <h2 className="font-display break-words text-[23px] font-semibold leading-tight text-foreground">{name}</h2>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {identity?.verified && <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-success">
                  <BadgeCheck className="h-3.5 w-3.5" /> {lang === "ko" ? "신원 확인 완료" : "Identity checked"}
                </span>}
              </div>
              {identity && <p className="mt-1 text-[13px] text-muted-foreground">{identity.nationalityFlag} {localizedNationality(identity.nationality, lang)} · {identity.method === "mobile-id" ? (lang === "ko" ? "모바일 신분증 확인" : "Mobile ID") : identity.method === "foreigner-id" ? (lang === "ko" ? "외국인등록증 확인" : "Residence Card") : (lang === "ko" ? "여권 확인" : "Passport check")}</p>}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 divide-x divide-foreground/10 border-y border-foreground/10 py-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-[14px] font-bold tabular-nums text-foreground">{s.value}</p>
                <p className="mt-1 text-[12px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/pass"
          className="pressable flex items-center gap-3 border-b border-foreground/10 pb-5"
        >
          <span className="grid h-11 w-11 flex-shrink-0 place-items-center">
            <Seal size={28} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-foreground">{t("profile.kpass")}</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">{capsule ? isCredentialUsable(capsule) ? (lang === "ko" ? "여행 중 사용 가능" : "Ready to use during your trip") : (lang === "ko" ? "상태 확인·갱신 필요" : "Review status or renew") : (lang === "ko" ? "아직 발급되지 않았어요" : "Not created yet")}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        <div>
          <SectionTitle>{t("profile.settings")}</SectionTitle>
          <div className="divide-y divide-foreground/10 border-y border-foreground/10">
            {MENU.map(({ icon: Icon, title, titleKo, subtitle, subtitleKo, href }) => (
              <Link key={title} href={href} className="pressable flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary/60">
                <span className="grid h-9 w-9 flex-shrink-0 place-items-center text-foreground/55">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-foreground">{lang === "ko" ? titleKo : title}</p>
                  <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{lang === "ko" ? subtitleKo : subtitle}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setConfirmSignOut(true)}
          className="pressable flex min-h-12 w-full items-center justify-center gap-2 border-t border-foreground/10 py-3 text-[14px] font-semibold text-foreground/70"
        >
          <LogOut className="h-4 w-4" /> {t("profile.signout")}
        </button>
      </div>
      <DialogPrimitive.Root open={confirmSignOut} onOpenChange={setConfirmSignOut}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-black/35" />
          <DialogPrimitive.Content className="safe-bottom fixed bottom-0 left-1/2 z-[81] w-full max-w-[420px] -translate-x-1/2 rounded-t-[28px] bg-background px-6 pb-7 pt-6 shadow-2xl">
            <p className="text-[13px] font-semibold text-primary">{lang === "ko" ? "로그아웃 확인" : "SIGN OUT"}</p>
            <DialogPrimitive.Title className="font-display mt-1 text-[25px] font-semibold">{lang === "ko" ? "이 기기의 여행 상태를 초기화할까요?" : "Reset this device's travel state?"}</DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-3 text-[14px] leading-6 text-muted-foreground">{lang === "ko" ? "현재 ID·지갑·예약·여정은 이 기기에 보관돼요. 로그아웃하면 이 기기의 상태가 모두 초기화됩니다." : "ID, wallet, bookings and journeys are stored on this device. Signing out clears that local state."}</DialogPrimitive.Description>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <DialogPrimitive.Close asChild><button type="button" className="pressable min-h-12 rounded-[14px] bg-card text-[14px] font-semibold ring-1 ring-border">{lang === "ko" ? "취소" : "Cancel"}</button></DialogPrimitive.Close>
              <button type="button" onClick={signOut} className="pressable min-h-12 rounded-[14px] bg-destructive text-[14px] font-semibold text-white">{lang === "ko" ? "로그아웃·초기화" : "Sign out & reset"}</button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </PhoneFrame>
  )
}
