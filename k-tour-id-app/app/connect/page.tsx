"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Utensils, Landmark, Languages, Dices, BadgeCheck, MessageCircle, ChevronRight, ShieldCheck } from "lucide-react"
import { PhoneFrame, LangToggle } from "@/components/app/shell"
import { Seal } from "@/components/app/seal"
import { useLang } from "@/lib/i18n/lang-provider"
import { formatWon } from "@/lib/format"
import { ACTIVITIES, PEERS } from "@/lib/mock-data"
import type { Activity, ActivityCategory, Peer } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useApp } from "@/lib/store/app-provider"

const CAT_ICON: Record<ActivityCategory, React.ComponentType<{ className?: string }>> = {
  food: Utensils,
  tour: Landmark,
  language: Languages,
  play: Dices,
}

function VerifiedBadge() {
  const { t } = useLang()
  return (
    <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-success-surface px-2 py-1 text-[12px] font-semibold text-success">
      <BadgeCheck className="h-3.5 w-3.5" /> {t("connect.verified")}
    </span>
  )
}

export default function ConnectPage() {
  const router = useRouter()
  const { session, hydrated } = useApp()
  const { t } = useLang()
  const [tab, setTab] = useState<"activities" | "people">("activities")
  const currentName = session.identity?.displayName
  const currentPhoto = session.identity?.photoUrl
  const activities = ACTIVITIES.filter((activity) => activity.host !== currentName)
  const peers = PEERS.filter((peer) => peer.name !== currentName)

  useEffect(() => {
    if (hydrated && !session.onboarded) router.replace("/onboarding")
  }, [hydrated, router, session.onboarded])

  if (!hydrated || !session.onboarded) return null

  return (
    <PhoneFrame>
      <header className="safe-top flex items-end justify-between px-6 pb-5">
        <div>
          <p className="text-[12px] font-semibold text-primary">PEOPLE · PLANS · TRUST</p>
          <h1 className="font-display mt-1 text-[30px] font-semibold tracking-[-0.03em] text-foreground">{t("connect.title")}</h1>
        </div>
        <LangToggle />
      </header>

      <div className="mx-6 mb-5 flex items-center gap-3 border-y border-foreground/10 py-4">
        <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-secondary"><Seal size={27} /></span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-foreground">{t("connect.hero")}</p>
          <p className="text-[12px] leading-snug text-muted-foreground">{t("connect.heroSub")}</p>
        </div>
      </div>
      <p className="mx-6 mb-5 flex items-start gap-2 text-[12px] leading-relaxed text-muted-foreground"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-success" />{t("connect.conceptNotice")}</p>

      {/* tabs */}
      <div className="mx-6 flex gap-6 border-b border-border">
        {(["activities", "people"] as const).map((tb) => {
          const active = tab === tb
          return (
            <button
              key={tb}
              type="button"
              onClick={() => setTab(tb)}
              aria-pressed={active}
              className={cn(
                "relative -mb-px min-h-11 pb-2 text-[14px] font-semibold transition-colors",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground/70",
              )}
            >
              {t(`connect.tab.${tb}`)}
              {active && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />}
            </button>
          )
        })}
      </div>

      <div className="mx-6 divide-y divide-foreground/10 border-b border-foreground/10">
        {tab === "activities"
          ? activities.map((a) => (
              <ActivityCard key={a.id} a={a} currentPhoto={currentPhoto} onOpen={() => router.push(`/connect/chat?with=${encodeURIComponent(a.host)}`)} />
            ))
          : peers.map((p) => (
              <PeerCard key={p.id} p={p} onOpen={() => router.push(`/connect/chat?with=${encodeURIComponent(p.name)}`)} />
            ))}
      </div>
    </PhoneFrame>
  )
}

function ActivityCard({ a, currentPhoto, onOpen }: { a: Activity; currentPhoto?: string; onOpen: () => void }) {
  const { t, lang } = useLang()
  const Icon = CAT_ICON[a.category]
  return (
    <button type="button" onClick={onOpen} className="pressable w-full py-5 text-left">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
        <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg bg-secondary text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <span>{t(`connect.cat.${a.category}`)} · {lang === "en" ? a.placeEn ?? a.place : a.place}</span>
        <span className="ml-auto flex-shrink-0">{lang === "en" ? a.timeEn ?? a.time : a.time}</span>
      </div>

      <h3 className="text-[15px] font-bold text-foreground">{lang === "en" ? a.titleEn ?? a.title : a.title}</h3>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <img src={a.hostPhoto} alt={a.host} className="h-6 w-6 rounded-full object-cover ring-1 ring-border" />
        <span className="text-[12px] font-semibold text-foreground">{a.host} {a.hostFlag}</span>
        <VerifiedBadge />
        <span className="rounded-full bg-primary/8 px-2 py-1 text-[12px] font-semibold text-primary">{t(`connect.trust.${a.trustLevel}`)}</span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {a.participants.filter((photo) => photo !== currentPhoto).slice(0, 4).map((p, i) => (
              <img key={i} src={p} alt="" className="h-6 w-6 rounded-full object-cover ring-2 ring-card" />
            ))}
          </div>
          <span className="ml-2 text-[12px] tabular text-muted-foreground">{a.joined}/{a.capacity}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {a.costKRW != null && (
            <span className="tabular rounded-full bg-secondary px-2 py-1 text-[12px] font-medium text-foreground/70">
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
    <button type="button" onClick={onOpen} className="pressable flex w-full items-center gap-3 py-5 text-left">
      <img src={p.photo} alt={p.name} className="h-12 w-12 flex-shrink-0 rounded-full object-cover ring-1 ring-border" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[14px] font-bold text-foreground">{p.name} {p.flag}</span>
          <VerifiedBadge />
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="rounded-full bg-primary/8 px-2 py-1 text-[12px] font-semibold text-primary">{t(`connect.role.${p.role}`)}</span>
          <span className="text-[12px] text-muted-foreground">{p.langs.join(" · ")}</span>
        </div>
        <p className="mt-1 break-words text-[12px] leading-snug text-muted-foreground">{lang === "en" ? p.bioEn ?? p.bio : p.bio}</p>
      </div>
      <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-secondary text-primary">
        <MessageCircle className="h-4 w-4" />
      </span>
    </button>
  )
}
