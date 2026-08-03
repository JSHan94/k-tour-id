"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BadgeCheck, Bell, Home, ChevronLeft, Compass, UsersRound } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLang } from "@/lib/i18n/lang-provider"
import { Seal } from "@/components/app/seal"
import { SealCopilot } from "@/components/app/seal-copilot"

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
    <div className="paper-grain min-h-screen w-full bg-background flex justify-center">
      <div className="relative w-full max-w-[420px] min-h-screen bg-background md:shadow-[0_0_50px_rgba(25,24,22,0.08)] overflow-hidden">
        <div className={cn("min-h-screen", hideNav ? "" : "pb-24", className)}>
          {children}
        </div>
        {!hideNav && <BottomNav />}
        {!hideNav && <SealCopilot />}
      </div>
    </div>
  )
}

const NAV_ITEMS = [
  { href: "/", labelKey: "nav.home", icon: Home },
  { href: "/explore", labelKey: "nav.explore", icon: Compass },
  { href: "/connect", labelKey: "nav.connect", icon: UsersRound },
  { href: "/wallet", labelKey: "nav.wallet", labelKo: "ID·지갑", labelEn: "ID · Wallet", icon: BadgeCheck },
] as const

export function BottomNav() {
  const pathname = usePathname()
  const { t, lang } = useLang()
  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[420px] -translate-x-1/2 border-t border-foreground/[0.07] bg-background/92 backdrop-blur-xl">
      <div className="grid grid-cols-4 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
        {NAV_ITEMS.map((item) => {
          const { href, labelKey, icon: Icon } = item
          const label = "labelKo" in item ? (lang === "ko" ? item.labelKo : item.labelEn) : t(labelKey)
          const active = href === "/"
            ? pathname === "/"
            : href === "/wallet"
              ? pathname.startsWith("/wallet") || pathname.startsWith("/pass") || pathname.startsWith("/present")
              : href === "/explore"
                ? pathname.startsWith("/explore") || pathname.startsWith("/services")
                : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              className="pressable relative flex min-h-[58px] flex-col items-center justify-center gap-1"
            >
              <Icon className={cn("h-[21px] w-[21px]", active ? "text-foreground" : "text-muted-foreground")} strokeWidth={active ? 2.1 : 1.7} />
              <span className={cn("text-[12px] font-medium", active ? "text-foreground" : "text-muted-foreground")}>{label}</span>
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
      aria-label={lang === "ko" ? "Switch to English" : "한국어로 전환"}
      className="pressable grid h-11 min-w-11 place-items-center rounded-full bg-white/10 px-2.5 text-[13px] font-semibold text-current backdrop-blur-md"
    >
      {lang === "ko" ? "EN" : "한"}
    </button>
  )
}

export function HomeHeader({ name, avatar }: { name: string; avatar?: string }) {
  const { t } = useLang()
  return (
    <header className="flex items-center justify-between px-6 pb-3 pt-5">
      <div className="min-w-0">
        <p className="text-[13px] text-muted-foreground">{t("home.hello")}</p>
        <h1 className="font-display break-words text-[26px] font-semibold leading-tight tracking-[-0.02em] text-foreground">{name}</h1>
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
          <img src={avatar ?? "/portraits/daniel-v2.jpg"} alt={`${name} profile`} className="h-11 w-11 rounded-full object-cover ring-1 ring-border" />
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
    <header className="safe-top sticky top-0 z-30 flex items-center justify-between bg-background/88 px-4 pb-3 backdrop-blur-xl">
      <Link
        href={back}
        className="pressable grid h-11 w-11 place-items-center rounded-full text-foreground/70 hover:bg-secondary"
        aria-label={t("common.back")}
      >
        <ChevronLeft className="h-5 w-5" />
      </Link>
      <h1 className="text-[17px] font-semibold tracking-tight text-foreground">{title}</h1>
      <div className="flex h-11 min-w-11 items-center justify-center">{right ?? <LangToggle />}</div>
    </header>
  )
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[14px] font-semibold text-muted-foreground">{children}</h2>
      {action}
    </div>
  )
}
