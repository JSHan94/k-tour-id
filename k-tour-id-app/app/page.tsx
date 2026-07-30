"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { QrCode, ChevronRight, ScanLine, ShieldCheck } from "lucide-react"
import { PhoneFrame, HomeHeader, StayStrip, SectionTitle } from "@/components/app/shell"
import { WalletCard } from "@/components/app/cards"
import { QuickActionTile, ServiceCard, VerifiedStrip } from "@/components/app/service"
import { ReceiveModal, TopUpModal, PayModal, type PayItem } from "@/components/app/modals"
import { Seal } from "@/components/app/seal"
import { BrandMark } from "@/components/app/brand"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import { QUICK_ACTIONS, SERVICE_ITEMS, STAY, PARTNERS } from "@/lib/mock-data"
import { BRANDS, type BrandKey } from "@/lib/brands"
import type { ServiceCategory } from "@/lib/types"
import { cn } from "@/lib/utils"
import { JourneyProgress } from "@/components/app/journey-progress"

const TABS: { key: ServiceCategory; labelKey: string }[] = [
  { key: "food", labelKey: "tab.food" },
  { key: "shopping", labelKey: "tab.shopping" },
  { key: "medical", labelKey: "tab.medical" },
]

export default function HomePage() {
  const router = useRouter()
  const { session, openCopilot, hydrated } = useApp()
  const { t } = useLang()
  const [activeTab, setActiveTab] = useState<ServiceCategory>("food")
  const [showReceive, setShowReceive] = useState(false)
  const [showTopUp, setShowTopUp] = useState(false)
  const [payItem, setPayItem] = useState<PayItem | null>(null)

  // Fresh / signed-out visitors belong in the K-Pass ceremony, not a blank home.
  useEffect(() => {
    if (hydrated && !session.onboarded) router.replace("/onboarding")
  }, [hydrated, session.onboarded, router])
  if (!session.onboarded) return null

  const name = session.capsule?.holderName ?? session.identity?.displayName ?? t("home.guest")
  const items = SERVICE_ITEMS.filter((i) => i.category === activeTab)

  const onQuickAction = (key: string) => {
    if (key === "topup") setShowTopUp(true)
    else if (key === "ai") openCopilot()
    else if (key === "medical") setActiveTab("medical")
    else if (key === "mobility") router.push("/wallet")
  }

  const payCategory = (c: ServiceCategory) => (c === "food" ? "delivery" : c === "medical" ? "reservation" : "shopping")

  return (
    <PhoneFrame>
      <HomeHeader name={name} avatar={session.identity?.photoUrl} />
      <StayStrip day={STAY.day} total={STAY.total} city={STAY.city} cityKo={STAY.cityKo} />

      <div className="mt-4 space-y-5 px-5">
        {/* Trust strip (replaces the old presale banner) */}
        <VerifiedStrip onClick={() => router.push("/pass")} />

        <JourneyProgress />

        {/* The product's primary action: present the credential, not receive funds. */}
        <Link href="/present" className="card-credential pressable flex min-h-[88px] items-center gap-4 rounded-3xl p-4 text-white">
          <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            <ScanLine className="h-6 w-6 text-gold" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gold">Privacy-preserving proof</p>
            <p className="mt-1 text-[16px] font-extrabold">{t("home.present.title")}</p>
            <p className="mt-0.5 text-[11px] text-white/60">{t("home.present.sub")}</p>
          </div>
          <ChevronRight className="h-5 w-5 flex-shrink-0 text-white/45" />
        </Link>

        {/* Wallet + QR */}
        <div className="flex gap-3">
          <Link href="/wallet" className="min-w-0 flex-1">
            <WalletCard wallet={session.wallet} userType={session.userType} className="pressable h-full" />
          </Link>
          <button
            type="button"
            onClick={() => setShowReceive(true)}
            aria-label={t("home.qr")}
            className="pressable grid w-[80px] flex-shrink-0 place-items-center rounded-3xl bg-card shadow-[0_2px_14px_rgba(20,22,30,0.08)] ring-1 ring-border"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary">
              <QrCode className="h-7 w-7 text-foreground" />
            </span>
          </button>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-2">
          {QUICK_ACTIONS.map((a) => (
            <QuickActionTile key={a.key} action={a} onClick={() => onQuickAction(a.key)} />
          ))}
        </div>

        {/* Target integrations, explicitly not represented as signed partnerships. */}
        <div>
          <SectionTitle action={<span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-[9px] font-bold text-muted-foreground"><ShieldCheck className="h-3 w-3" /> {t("home.partners.demo")}</span>}>{t("home.partners")}</SectionTitle>
          <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5">
            {PARTNERS.map((p) => (
              <div key={p} className="flex w-[52px] flex-shrink-0 flex-col items-center gap-1.5">
                <BrandMark brand={p as BrandKey} size={46} />
                <span className="w-full truncate text-center text-[10px] text-muted-foreground">{BRANDS[p].name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Service tabs */}
        <div>
          <div className="flex gap-5 border-b border-border">
            {TABS.map((tab) => {
              const active = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "relative -mb-px flex min-h-11 items-center pb-2 text-[14px] font-semibold transition-colors",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground/70",
                  )}
                >
                  {t(tab.labelKey)}
                  {active && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />}
                </button>
              )
            })}
          </div>

          <div className="no-scrollbar -mx-5 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1">
            {items.map((item) => (
              <div key={item.id} className="w-[46%] flex-shrink-0 snap-start">
                <ServiceCard
                  item={item}
                  onClick={() =>
                    setPayItem({
                      merchant: item.name,
                      amountKRW: item.priceKRW,
                      category: payCategory(item.category),
                      location: item.location,
                      fulfilment: item.category === "food"
                        ? `${item.etaLabel} · demo delivery`
                        : item.category === "medical"
                          ? `${item.etaLabel} · next available appointment`
                          : `${item.etaLabel} · demo reservation`,
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>

        {/* K-Pass shortcut */}
        <Link
          href="/pass"
          className="pressable flex items-center gap-3 rounded-2xl bg-surface-2 p-3.5 ring-1 ring-border hover:bg-secondary"
        >
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-secondary ring-1 ring-border">
            <Seal size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-foreground">{t("home.kpass.title")}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {t("home.kpass.sub")} · {session.capsule?.stayPeriod ?? "—"}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>

      <ReceiveModal open={showReceive} onOpenChange={setShowReceive} />
      <TopUpModal open={showTopUp} onOpenChange={setShowTopUp} />
      <PayModal open={!!payItem} onOpenChange={(v) => { if (!v) setPayItem(null) }} item={payItem} />
    </PhoneFrame>
  )
}
