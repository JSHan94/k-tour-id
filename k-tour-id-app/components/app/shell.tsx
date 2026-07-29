"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Home, Wallet, User, ChevronLeft, Signal, Wifi, BatteryFull, Gift, BadgeCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLang } from "@/lib/i18n/lang-provider"
import { Seal } from "@/components/app/seal"
import { SealCopilot } from "@/components/app/seal-copilot"
import { SimulationStrip } from "@/components/app/integration-status"

export function PhoneFrame({
  children,
  hideNav = false,
  className,
}: {
  children: React.ReactNode
  hideNav?: boolean
  className?: string
}) {
  return (
    <div className="min-h-screen w-full bg-background flex justify-center">
      <div className="relative w-full max-w-[420px] min-h-screen bg-card shadow-[0_0_60px_rgba(28,24,19,0.08)] overflow-hidden">
        <div className={cn("min-h-screen", hideNav ? "" : "pb-24", className)}>
          <StatusBar />
          <SimulationStrip />
          {children}
        </div>
        {!hideNav && <BottomNav />}
        {!hideNav && <SealCopilot />}
      </div>
    </div>
  )
}

/** Fake iOS status bar so screenshots read as a real device. */
export function StatusBar() {
  const [time, setTime] = useState("9:41")
  useEffect(() => {
    const tick = () => {
      const d = new Date()
      setTime(`${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`)
    }
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="flex items-center justify-between px-6 pb-1 pt-2.5 text-[13px] font-semibold text-foreground">
      <span className="tabular">{time}</span>
      <div className="flex items-center gap-1.5">
        <Signal className="h-3.5 w-3.5" />
        <Wifi className="h-3.5 w-3.5" />
        <BatteryFull className="h-[18px] w-[18px]" />
      </div>
    </div>
  )
}

const NAV_ITEMS = [
  { href: "/", labelKey: "nav.home", icon: Home },
  { href: "/benefits", labelKey: "nav.benefits", icon: Gift },
  { href: "/wallet", labelKey: "nav.wallet", icon: Wallet },
  { href: "/pass", labelKey: "nav.pass", icon: BadgeCheck },
  { href: "/profile", labelKey: "nav.profile", icon: User },
] as const

export function BottomNav() {
  const pathname = usePathname()
  const { t } = useLang()
  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[420px] -translate-x-1/2 border-t border-border bg-card/95 backdrop-blur-md">
      <div className="grid grid-cols-5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
          const active = href === "/"
            ? pathname === "/"
            : href === "/pass"
              ? pathname.startsWith("/pass") || pathname.startsWith("/present")
              : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              aria-label={t(labelKey)}
              className="pressable relative flex min-h-14 flex-col items-center justify-center gap-1 pt-1.5"
            >
              {active && <span className="absolute top-0 h-[3px] w-7 rounded-full bg-primary" />}
              <Icon className={cn("h-[22px] w-[22px]", active ? "text-primary" : "text-muted-foreground")} strokeWidth={active ? 2.3 : 1.9} />
              <span className={cn("text-[10px] font-medium", active ? "text-primary" : "text-muted-foreground")}>{t(labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

/** Brand mark = the dojang seal. */
export function Logo({ size = 28, withWordmark = false }: { size?: number; withWordmark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Seal size={size} />
      {withWordmark && <span className="text-[16px] font-bold tracking-tight text-foreground">K-Tour ID</span>}
    </span>
  )
}

export function LangToggle() {
  const { lang, toggle } = useLang()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle language"
      className="pressable grid h-11 min-w-11 place-items-center rounded-full bg-secondary px-2.5 text-[12px] font-bold text-foreground/70"
    >
      {lang === "ko" ? "EN" : "한"}
    </button>
  )
}

export function HomeHeader({ name, avatar }: { name: string; avatar?: string }) {
  const { t } = useLang()
  return (
    <header className="flex items-center justify-between px-5 pb-3 pt-3">
      <div className="min-w-0">
        <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">{t("home.hello")}</p>
        <h1 className="truncate text-[24px] font-extrabold leading-tight tracking-tight text-foreground">{name}</h1>
      </div>
      <div className="flex items-center gap-2.5">
        <LangToggle />
        <Link
          href="/alerts"
          className="pressable grid h-11 w-11 place-items-center rounded-full bg-secondary text-foreground/70"
          aria-label={t("nav.alerts")}
        >
          <Bell className="h-[18px] w-[18px]" />
        </Link>
        <Link href="/profile" aria-label={t("nav.profile")} className="pressable">
          <img src={avatar ?? "/portraits/peter.jpg"} alt="Profile" className="h-11 w-11 rounded-full object-cover ring-1 ring-border" />
        </Link>
      </div>
    </header>
  )
}

/** Slim stay-timeline strip: "Day 47 of 90 in Seoul" with a progress hairline. */
export function StayStrip({ day, total, city, cityKo }: { day: number; total: number; city: string; cityKo: string }) {
  const { t, lang } = useLang()
  const pct = Math.round((day / total) * 100)
  return (
    <div className="flex items-center gap-3 px-5 pb-1">
      <p className="text-[12px] font-medium text-muted-foreground">{t("home.stay", { city: lang === "ko" ? cityKo : city, day, total })}</p>
      <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
      </div>
      <p className="tabular text-[12px] font-bold text-primary">D-{total - day}</p>
    </div>
  )
}

export function PageHeader({
  title,
  back = "/",
  right,
}: {
  title: string
  back?: string
  right?: React.ReactNode
}) {
  const { t } = useLang()
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between bg-card/85 px-4 pb-3 pt-3 backdrop-blur-md">
      <Link
        href={back}
        className="pressable grid h-11 w-11 place-items-center rounded-full text-foreground/70 hover:bg-secondary"
        aria-label={t("common.back")}
      >
        <ChevronLeft className="h-5 w-5" />
      </Link>
      <h1 className="text-[17px] font-bold tracking-tight text-foreground">{title}</h1>
      <div className="flex h-11 min-w-11 items-center justify-center">{right ?? <LangToggle />}</div>
    </header>
  )
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[12px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{children}</h2>
      {action}
    </div>
  )
}
