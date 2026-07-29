"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Utensils, Landmark, Languages, Dices, BadgeCheck, MessageCircle, ChevronRight } from "lucide-react"
import { PhoneFrame, LangToggle } from "@/components/app/shell"
import { Seal } from "@/components/app/seal"
import { useLang } from "@/lib/i18n/lang-provider"
import { formatWon } from "@/lib/format"
import { ACTIVITIES, PEERS } from "@/lib/mock-data"
import type { Activity, ActivityCategory, Peer } from "@/lib/types"
import { cn } from "@/lib/utils"

const CAT_ICON: Record<ActivityCategory, React.ComponentType<{ className?: string }>> = {
  food: Utensils,
  tour: Landmark,
  language: Languages,
  play: Dices,
}

function VerifiedBadge() {
  const { t } = useLang()
  return (
    <span className="inline-flex flex-shrink-0 items-center gap-0.5 rounded-full bg-success-surface px-1.5 py-0.5 text-[10px] font-semibold text-success">
      <BadgeCheck className="h-2.5 w-2.5" /> {t("connect.verified")}
    </span>
  )
}

export default function ConnectPage() {
  const router = useRouter()
  const { t } = useLang()
  const [tab, setTab] = useState<"activities" | "people">("activities")

  return (
    <PhoneFrame>
      <header className="flex items-center justify-between px-5 pb-2 pt-3">
        <h1 className="text-[24px] font-extrabold tracking-tight text-foreground">{t("connect.title")}</h1>
        <LangToggle />
      </header>

      {/* trust hero */}
      <div className="mx-5 mb-4 flex items-center gap-3 rounded-2xl bg-surface-2 p-3 ring-1 ring-border">
        <Seal size={30} />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-foreground">{t("connect.hero")}</p>
          <p className="text-[11px] text-muted-foreground">{t("connect.heroSub")}</p>
        </div>
      </div>

      {/* tabs */}
      <div className="mx-5 mb-4 flex gap-5 border-b border-border">
        {(["activities", "people"] as const).map((tb) => {
          const active = tab === tb
          return (
            <button
              key={tb}
              type="button"
              onClick={() => setTab(tb)}
              className={cn(
                "relative -mb-px pb-2 text-[14px] font-semibold transition-colors",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground/70",
              )}
            >
              {t(`connect.tab.${tb}`)}
              {active && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />}
            </button>
          )
        })}
      </div>

      <div className="space-y-3 px-5">
        {tab === "activities"
          ? ACTIVITIES.map((a) => (
              <ActivityCard key={a.id} a={a} onOpen={() => router.push(`/connect/chat?with=${encodeURIComponent(a.host)}`)} />
            ))
          : PEERS.map((p) => (
              <PeerCard key={p.id} p={p} onOpen={() => router.push(`/connect/chat?with=${encodeURIComponent(p.name)}`)} />
            ))}
      </div>
    </PhoneFrame>
  )
}

function ActivityCard({ a, onOpen }: { a: Activity; onOpen: () => void }) {
  const { t, lang } = useLang()
  const Icon = CAT_ICON[a.category]
  return (
    <button type="button" onClick={onOpen} className="pressable w-full rounded-2xl bg-card p-4 text-left ring-1 ring-border">
      <div className="mb-2 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg bg-secondary text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <span className="truncate">{t(`connect.cat.${a.category}`)} · {lang === "en" ? a.placeEn ?? a.place : a.place}</span>
        <span className="ml-auto flex-shrink-0">{lang === "en" ? a.timeEn ?? a.time : a.time}</span>
      </div>

      <h3 className="text-[15px] font-bold text-foreground">{lang === "en" ? a.titleEn ?? a.title : a.title}</h3>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <img src={a.hostPhoto} alt={a.host} className="h-6 w-6 rounded-full object-cover ring-1 ring-border" />
        <span className="text-[12px] font-semibold text-foreground">{a.host} {a.hostFlag}</span>
        <VerifiedBadge />
        <span className="rounded-full bg-primary/8 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{t(`connect.trust.${a.trustLevel}`)}</span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {a.participants.slice(0, 4).map((p, i) => (
              <img key={i} src={p} alt="" className="h-6 w-6 rounded-full object-cover ring-2 ring-card" />
            ))}
          </div>
          <span className="ml-2 text-[11px] tabular text-muted-foreground">{a.joined}/{a.capacity}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {a.costKRW != null && (
            <span className="tabular rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground/70">
              {t("connect.split")} {lang === "ko" ? formatWon(a.costKRW) : `₩${a.costKRW.toLocaleString("en-US")}`}
            </span>
          )}
          <span className="bg-brand-gradient inline-flex items-center gap-0.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-white">
            {t("connect.join")} <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </button>
  )
}

function PeerCard({ p, onOpen }: { p: Peer; onOpen: () => void }) {
  const { t, lang } = useLang()
  return (
    <button type="button" onClick={onOpen} className="pressable flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left ring-1 ring-border">
      <img src={p.photo} alt={p.name} className="h-12 w-12 flex-shrink-0 rounded-full object-cover ring-1 ring-border" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[14px] font-bold text-foreground">{p.name} {p.flag}</span>
          <VerifiedBadge />
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="rounded-full bg-primary/8 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{t(`connect.role.${p.role}`)}</span>
          <span className="text-[10px] text-muted-foreground">{p.langs.join(" · ")}</span>
        </div>
        <p className="mt-1 truncate text-[12px] text-muted-foreground">{lang === "en" ? p.bioEn ?? p.bio : p.bio}</p>
      </div>
      <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-secondary text-primary">
        <MessageCircle className="h-4 w-4" />
      </span>
    </button>
  )
}
