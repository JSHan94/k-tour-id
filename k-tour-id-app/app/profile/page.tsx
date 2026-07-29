"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronRight, CreditCard, ShieldCheck, Bell, HelpCircle, LogOut, BadgeCheck } from "lucide-react"
import { PhoneFrame, PageHeader, SectionTitle } from "@/components/app/shell"
import { Seal } from "@/components/app/seal"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import { formatKRW, shortDid } from "@/lib/format"

const MENU = [
  { icon: CreditCard, title: "Payment Methods", subtitle: "KRW wallet, KakaoPay on-ramp" },
  { icon: ShieldCheck, title: "Security & Privacy", subtitle: "DID keys, selective disclosure" },
  { icon: Bell, title: "Notifications", subtitle: "Push, benefit alerts" },
  { icon: HelpCircle, title: "Help & Support", subtitle: "FAQ, contact us" },
]

export default function ProfilePage() {
  const router = useRouter()
  const { session, transactions, reset } = useApp()
  const { t } = useLang()
  const { capsule, identity, wallet } = session

  const name = capsule?.holderName ?? identity?.displayName ?? t("home.guest")
  const email = `${name.split(" ")[0].toLowerCase()}@ktourid.io`
  const spent = transactions.filter((tx) => tx.amountKRW < 0).reduce((a, tx) => a + Math.abs(tx.amountKRW), 0)
  const showUsd = session.userType !== "korean"

  const stats = [
    { label: t("profile.spent"), value: formatKRW(spent), period: t("profile.thisStay") },
    { label: t("profile.payments"), value: String(transactions.length), period: t("profile.thisStay") },
    { label: t("profile.saved"), value: "₩156,890", period: t("profile.withBenefits") },
  ]

  const signOut = () => {
    reset()
    router.push("/onboarding")
  }

  return (
    <PhoneFrame>
      <PageHeader title={t("profile.title")} />

      <div className="space-y-6 px-5 pt-1">
        <div className="rounded-2xl bg-card p-4 shadow-[0_2px_14px_rgba(20,22,30,0.06)] ring-1 ring-border">
          <div className="flex items-center gap-3">
            <img src={identity?.photoUrl ?? "/portraits/peter.jpg"} alt={name} className="h-14 w-14 rounded-full object-cover ring-1 ring-border" />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[16px] font-bold text-foreground">{name}</h2>
              <p className="truncate text-[12px] text-muted-foreground">{email}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-success-surface px-2 py-0.5 text-[10px] font-semibold text-success">
                  <BadgeCheck className="h-3 w-3" /> {t("profile.verified")}
                </span>
                {capsule && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold capitalize text-primary">
                    {capsule.trustLevel}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-[14px] font-bold tabular-nums text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                <p className="text-[9px] text-muted-foreground/70">{s.period}</p>
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/pass"
          className="pressable flex items-center gap-3 rounded-2xl bg-surface-2 p-4 ring-1 ring-border hover:bg-secondary"
        >
          <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-secondary ring-1 ring-border">
            <Seal size={28} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-foreground">{t("profile.kpass")}</p>
            <p className="truncate font-mono text-[11px] text-muted-foreground">
              {identity ? shortDid(identity.did) : "Not issued"} · Open DID
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        <div>
          <SectionTitle>{t("profile.settings")}</SectionTitle>
          <div className="divide-y divide-border rounded-2xl bg-card ring-1 ring-border">
            {MENU.map(({ icon: Icon, title, subtitle }) => (
              <button key={title} type="button" className="pressable flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary/60">
                <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-secondary text-foreground/70">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-foreground">{title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={signOut}
          className="pressable flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3 text-[14px] font-semibold text-foreground/70 hover:bg-secondary"
        >
          <LogOut className="h-4 w-4" /> {t("profile.signout")}
        </button>
      </div>
    </PhoneFrame>
  )
}
