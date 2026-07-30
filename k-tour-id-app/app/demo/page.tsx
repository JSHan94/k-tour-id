"use client"

import Link from "next/link"
import { ArrowRight, BadgeCheck, Building2, CircleAlert, FileSearch, House, Landmark, RefreshCcw, ShieldCheck, Smartphone } from "lucide-react"
import { JourneyProgress } from "@/components/app/journey-progress"
import { Seal } from "@/components/app/seal"
import { useApp } from "@/lib/store/app-provider"

const SCENARIOS = [
  { href: "/present", label: "Happy path", copy: "QR, consent, discount, payment and receipt", icon: BadgeCheck },
  { href: "/present?result=expired", label: "Expired ID", copy: "Recovery path for an expired K-Tour ID", icon: CircleAlert },
  { href: "/present?result=revoked", label: "Unavailable ID", copy: "Recovery path for an ID that can no longer be used", icon: ShieldCheck },
  { href: "/present?result=offline", label: "Network issue", copy: "Retry path when eligibility cannot be checked", icon: Smartphone },
] as const

export default function DemoHubPage() {
  const { loadDemoAccount, demoJourney } = useApp()

  const reset = () => {
    loadDemoAccount()
  }

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><Seal size={46} /><div><p className="text-[13px] font-bold uppercase tracking-[0.12em] text-primary">Presenter workspace</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight">K-Tour ID demo control</h1></div></div>
          <div className="flex flex-wrap gap-2"><Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-bold"><House className="h-4 w-4" /> Consumer app</Link><button type="button" onClick={reset} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-bold text-white"><RefreshCcw className="h-4 w-4" /> Reset scenario</button></div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
          <section>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Canonical journey</p>
            <h2 className="mt-2 text-2xl font-extrabold">Bukchon traveler discount</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">One foreign tourist checks eligibility, receives a ₩5,000 benefit, pays ₩45,000, and creates the merchant payout record. Product screens stay user-focused; this workspace holds presentation controls.</p>
            <div className="mt-5 max-w-md"><JourneyProgress /></div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Consumer scenarios</p><h2 className="mt-1 text-xl font-extrabold">Choose a presentation state</h2></div><span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-bold">{demoJourney.stage}</span></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">{SCENARIOS.map(({ href, label, copy, icon: Icon }) => <Link key={href} href={href} className="group flex min-h-28 items-start gap-3 rounded-2xl border border-border p-4 hover:border-primary/40 hover:bg-primary/[0.025]"><span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-secondary text-primary"><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-extrabold">{label}</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{copy}</span></span><ArrowRight className="mt-2 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" /></Link>)}</div>
            <div className="mt-5 border-t border-border pt-5">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Merchant previews</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  ["/partner/verify?preview=waiting", "QR waiting"],
                  ["/partner/verify?preview=submitted", "Checking"],
                  ["/partner/verify?preview=verified", "Approved"],
                  ["/partner/verify?preview=failed", "Not approved"],
                  ["/partner/verify?preview=expired", "Expired"],
                  ["/partner/verify?preview=offline", "Offline"],
                  ["/partner/verify?preview=refunded", "Refunded"],
                ].map(([href, label]) => <Link key={href} href={href} className="inline-flex min-h-10 items-center rounded-full bg-surface-2 px-3 text-xs font-bold text-foreground ring-1 ring-border hover:bg-secondary">{label}</Link>)}
              </div>
            </div>
          </section>
        </div>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <RoleCard href="/" icon={Smartphone} eyebrow="Tourist" title="Consumer app" copy="K-Tour ID, benefit, payment and receipt" />
          <RoleCard href="/partner/verify" icon={Building2} eyebrow="Merchant" title="Store counter" copy="Eligibility verdict, discount and payment state" />
          <RoleCard href="/partner/settlements" icon={Landmark} eyebrow="Settlement" title="Payout desk" copy="Reconciliation, refund adjustments and payout" />
          <RoleCard href="/evidence" icon={FileSearch} eyebrow="Appendix" title="Technical evidence" copy="Implementation references kept outside the product UI" />
        </section>
      </div>
    </main>
  )
}

function RoleCard({ href, icon: Icon, eyebrow, title, copy }: { href: string; icon: typeof Smartphone; eyebrow: string; title: string; copy: string }) {
  return <Link href={href} className="group flex min-h-32 items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm"><span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl bg-ink text-gold"><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="text-xs font-bold uppercase tracking-[0.1em] text-primary">{eyebrow}</span><span className="mt-1 block text-base font-extrabold">{title}</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{copy}</span></span><ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" /></Link>
}
