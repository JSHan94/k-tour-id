"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, CircleDot, Landmark, ScanLine } from "lucide-react"
import { Seal } from "@/components/app/seal"
import { cn } from "@/lib/utils"
import { useApp } from "@/lib/store/app-provider"

export type EnvironmentKind = "LIVE" | "SANDBOX" | "SIMULATED"

const ENV_STYLES: Record<EnvironmentKind, string> = {
  LIVE: "border-[#5b7553]/25 bg-[#e7ede4] text-[#46603f]",
  SANDBOX: "border-[#b88a3d]/30 bg-[#f5ecdc] text-[#8a642b]",
  SIMULATED: "border-[#c2392f]/20 bg-[#f7e8e4] text-[#a63129]",
}

export function EnvironmentBadge({ kind, className }: { kind: EnvironmentKind; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-extrabold tracking-[0.1em]",
        ENV_STYLES[kind],
        className,
      )}
    >
      <CircleDot className="h-2.5 w-2.5" />
      {kind}
    </span>
  )
}

const NAV = [
  { href: "/partner/verify", label: "Benefit check", sub: "Scan and confirm", icon: ScanLine },
  { href: "/partner/settlements", label: "Payouts", sub: "Review and submit", icon: Landmark },
] as const

export function PartnerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { demoJourney } = useApp()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen w-full max-w-[1480px] lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden border-r border-border bg-card/70 px-5 py-6 lg:flex lg:flex-col">
          <PartnerBrand />
          <div className="mt-8 rounded-2xl border border-border bg-surface-2 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Demo workspace</p>
              <EnvironmentBadge kind="SIMULATED" />
            </div>
            <p className="mt-2 text-[14px] font-bold">{demoJourney.merchantDisplay}</p>
            <p className="mt-1 break-all text-[12px] leading-relaxed text-muted-foreground">{demoJourney.campaignId} · current transaction</p>
          </div>

          <nav aria-label="Partner console" className="mt-5 space-y-1.5">
            {NAV.map(({ href, label, sub, icon: Icon }) => {
              const active = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-14 items-center gap-3 rounded-2xl px-3.5 py-2.5 transition-colors",
                    active ? "bg-ink text-white shadow-sm" : "text-foreground hover:bg-secondary",
                  )}
                >
                  <span className={cn("grid h-9 w-9 place-items-center rounded-xl", active ? "bg-white/10 text-gold" : "bg-secondary text-primary")}>
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-bold">{label}</span>
                    <span className={cn("block text-[12px]", active ? "text-white/70" : "text-muted-foreground")}>{sub}</span>
                  </span>
                </Link>
              )
            })}
          </nav>

          <p className="mt-auto px-2 text-[12px] leading-relaxed text-muted-foreground">Prototype workspace · no real payment is sent.</p>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-40 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-3 lg:justify-end">
              <div className="lg:hidden"><PartnerBrand /></div>
              <div className="flex items-center gap-2">
                <EnvironmentBadge kind="SIMULATED" className="lg:hidden" />
                <span
                  className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card text-foreground"
                  role="img"
                  aria-label={`${demoJourney.merchantDisplay} account`}
                >
                  <Building2 className="h-[18px] w-[18px]" />
                </span>
              </div>
            </div>
            <nav aria-label="Partner console mobile" className="mt-3 grid grid-cols-2 gap-2 lg:hidden">
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center justify-center gap-2 rounded-xl border text-[12px] font-bold",
                      active ? "border-ink bg-ink text-white" : "border-border bg-card text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </Link>
                )
              })}
            </nav>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  )
}

function PartnerBrand() {
  return (
    <div className="flex items-center gap-3">
      <Seal size={38} />
      <div>
        <p className="text-[15px] font-extrabold tracking-tight">K-Tour ID</p>
        <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Merchant workspace</p>
      </div>
    </div>
  )
}

export function Panel({
  children,
  className,
  title,
  eyebrow,
  action,
}: {
  children: React.ReactNode
  className?: string
  title?: string
  eyebrow?: string
  action?: React.ReactNode
}) {
  return (
    <section className={cn("rounded-3xl border border-border bg-card shadow-[0_12px_38px_rgba(28,24,19,0.05)]", className)}>
      {(title || eyebrow || action) && (
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div>
            {eyebrow && <p className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-primary">{eyebrow}</p>}
            {title && <h2 className="mt-0.5 text-[16px] font-extrabold tracking-tight">{title}</h2>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function PageIntro({ eyebrow, title, body, children }: { eyebrow: string; title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div className="max-w-3xl">
        <p className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
        <h1 className="mt-1 text-[clamp(26px,4vw,38px)] font-extrabold leading-tight tracking-[-0.035em]">{title}</h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground sm:text-[14px]">{body}</p>
      </div>
      {children}
    </div>
  )
}
