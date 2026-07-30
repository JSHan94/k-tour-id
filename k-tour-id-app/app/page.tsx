"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { QrCode, ChevronRight, ScanLine } from "lucide-react"
import { PhoneFrame, HomeHeader, StayStrip, SectionTitle } from "@/components/app/shell"
import { WalletCard } from "@/components/app/cards"
import { QuickActionTile, ServiceCard, VerifiedStrip } from "@/components/app/service"
import { ReceiveModal, TopUpModal, PayModal, type PayItem } from "@/components/app/modals"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import { QUICK_ACTIONS, SERVICE_ITEMS, STAY } from "@/lib/mock-data"
import type { ServiceCategory } from "@/lib/types"
import { cn } from "@/lib/utils"
import { serviceCopy } from "@/lib/service-copy"

const TABS: { key: ServiceCategory; labelKey: string }[] = [
  { key: "food", labelKey: "tab.food" },
  { key: "shopping", labelKey: "tab.shopping" },
  { key: "medical", labelKey: "tab.medical" },
]

export default function HomePage() {
  const router = useRouter()
  const { session, openCopilot, hydrated } = useApp()
  const { t, lang } = useLang()
  const ko = lang === "ko"
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
        {/* One clear start point for a visitor standing at a participating shop. */}
        <Link href="/present" className="card-credential pressable flex min-h-[88px] items-center gap-4 rounded-3xl p-4 text-white">
          <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            <ScanLine className="h-6 w-6 text-gold" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-gold">{ko ? "매장에서" : "At a participating shop"}</p>
            <p className="mt-1 text-[18px] font-extrabold">{ko ? "여행자 할인받기" : "Get your traveler discount"}</p>
            <p className="mt-1 text-[12px] leading-snug text-white/75">{ko ? "공유할 정보와 할인 금액을 먼저 확인해요" : "Review what you share and how much you save"}</p>
          </div>
          <ChevronRight className="h-5 w-5 flex-shrink-0 text-white/45" />
        </Link>

        <VerifiedStrip onClick={() => router.push("/pass")} />

        {/* Wallet + QR */}
        <div className="flex gap-3">
          <Link href="/wallet" className="min-w-0 flex-1">
            <WalletCard wallet={session.wallet} userType={session.userType} label={ko ? "여행 잔액" : "Travel balance"} className="pressable h-full" />
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
                  onClick={() => {
                    const copy = serviceCopy(item, lang)
                    setPayItem({
                      merchant: copy.name,
                      amountKRW: item.priceKRW,
                      category: payCategory(item.category),
                      location: copy.location,
                      fulfilment: item.category === "food"
                        ? `${copy.eta} · ${ko ? "배달" : "delivery"}`
                        : item.category === "medical"
                          ? `${copy.eta} · ${ko ? "가장 빠른 예약" : "next available appointment"}`
                          : `${copy.eta} · ${ko ? "예약" : "reservation"}`,
                    })
                  }}
                />
              </div>
            ))}
          </div>
        </div>

      </div>

      <ReceiveModal open={showReceive} onOpenChange={setShowReceive} />
      <TopUpModal open={showTopUp} onOpenChange={setShowTopUp} />
      <PayModal open={!!payItem} onOpenChange={(v) => { if (!v) setPayItem(null) }} item={payItem} />
    </PhoneFrame>
  )
}
