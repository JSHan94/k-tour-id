"use client"

import type React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, BadgeCheck, Building2, ChevronDown, CircleAlert, Contact, FileSearch, House, Landmark, Plane, RefreshCcw, ShieldCheck, Smartphone } from "lucide-react"
import { JourneyProgress } from "@/components/app/journey-progress"
import { Seal } from "@/components/app/seal"
import { PERSONA_CONFIG } from "@/lib/catalog"
import { useApp } from "@/lib/store/app-provider"
import type { UserType } from "@/lib/types"
import { useNearbyLocation } from "@/lib/location/location-provider"

const PERSONA_ICONS = { foreigner: Plane, "long-term": Contact, korean: Smartphone } as const
const STAGE_LABELS: Record<string, string> = {
  "request-ready": "Ready to start",
  checking: "Checking eligibility",
  "presentation-created": "Proof created",
  "benefit-ready": "Benefit ready",
  paid: "Payment complete",
  "settlement-submitted": "Settlement submitted",
  anchored: "Settlement logged",
  refunded: "Refund complete",
}

export default function DemoHubPage() {
  const router = useRouter()
  const { reset, loadDemoAccount, loadDemoPersona, demoJourney } = useApp()
  const { clearLocation } = useNearbyLocation()

  const clearMockState = () => {
    reset()
    clearLocation()
    try {
      const prefixes = [
        "k-tour-id-state-",
        "k-tour-id-first-guide-",
        "k-tour-id:activity-memberships:",
        "k-tour-id:activity-safety:",
        "k-tour-id:journey-checkin:",
        "k-tour-id:external-orders:",
        "k-tour-id:ledger-",
        "k-tour-id:ledger-operation:",
        "k-tour-id-location-",
      ]
      const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)).filter((key): key is string => Boolean(key))
      keys.filter((key) => prefixes.some((prefix) => key.startsWith(prefix))).forEach((key) => localStorage.removeItem(key))
    } catch { /* unavailable */ }
  }

  const startOnboarding = (userType: UserType) => {
    clearMockState()
    router.push(`/onboarding?persona=${userType}&demo=1`)
  }
  const startCommerce = (userType: UserType) => {
    loadDemoPersona(userType)
    router.push(`/explore/${PERSONA_CONFIG[userType].firstItemId}`)
  }
  const startDiscount = () => {
    loadDemoAccount()
    router.push("/present?auto=1")
  }
  const startInsufficient = () => {
    loadDemoPersona("long-term", 1_000)
    router.push("/explore/seoul-transit-30")
  }
  const startIneligible = () => {
    loadDemoPersona("korean")
    router.push("/explore/bukchon-workshop")
  }
  const startSoldOut = () => {
    loadDemoPersona("long-term")
    router.push("/explore/seoul-transit-30?preview=soldout")
  }

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><Seal size={46} /><div><p className="text-[13px] font-bold uppercase tracking-[0.12em] text-primary">Presenter workspace</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight">K-Tour ID scenario hub</h1></div></div>
          <div className="flex flex-wrap gap-2"><Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-bold"><House className="h-4 w-4" /> Consumer app</Link><button type="button" onClick={clearMockState} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-bold text-white"><RefreshCcw className="h-4 w-4" /> Clear all state</button></div>
        </header>

        <section className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Start here · four core stories</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-extrabold">Choose the audience, then show the outcome</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Every onboarding story resets identity, wallet, vouchers, recommendations, orders and the merchant journey before it starts.</p></div><span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-bold">{STAGE_LABELS[demoJourney.stage] ?? "Recovery preview"}</span></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(["foreigner", "long-term", "korean"] as UserType[]).map((userType) => {
              const config = PERSONA_CONFIG[userType]
              const Icon = PERSONA_ICONS[userType]
              return <ScenarioButton key={userType} icon={Icon} eyebrow="Onboarding" title={config.label.ko} copy={`온보딩 → 완료 → 맞춤 홈 → 첫 상품`} onClick={() => startOnboarding(userType)} />
            })}
            <ScenarioButton icon={BadgeCheck} eyebrow="Returning user" title="기존 가입자 매장 할인" copy="QR → 자격 확인 → ₩5,000 할인 → 결제·영수증" onClick={startDiscount} />
          </div>
        </section>

        <section className="mt-10 rounded-[28px] border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div className="max-w-xl"><p className="text-xs font-bold uppercase tracking-[0.12em] text-success">Commerce journeys</p><h2 className="mt-2 text-xl font-extrabold">One complete purchase for every persona</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Open a pre-issued persona account directly at its representative product. These stories cover detail, option, benefit, final price, payment, pass or receipt, and refund.</p></div><div className="w-full max-w-md"><JourneyProgress /></div></div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <CommerceButton title="단기 방문 · 북촌 공예" copy="선택적 자격 공개와 가맹점 정산까지" onClick={() => startCommerce("foreigner")} />
            <CommerceButton title="장기 체류 · 생활 교통 30일권" copy="디지털 발급, 결제, 환불까지" onClick={() => startCommerce("long-term")} />
            <CommerceButton title="국내 여행 · 지역 문화 프로그램" copy="일정 선택, 지역 혜택, 입장권까지" onClick={() => startCommerce("korean")} />
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-border bg-card p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Commercial service handoff</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-extrabold">Familiar services, with a complete return state</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Proposal-core entrypoints show benefit, consent, provider handoff, success, cancel and connection failure without implying a live partnership.</p></div><Link href="/services" onClick={loadDemoAccount} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-bold text-white">All services <ArrowRight className="h-4 w-4" /></Link></div>
          <div className="mt-5 grid gap-3 md:grid-cols-3"><PreviewLink href="/services/tmoney-visitor-pass" label="T-money visitor pass" copy="Pass · benefit · issuance return" icon={Smartphone} onClick={loadDemoAccount} /><PreviewLink href="/services/kakao-t-airport" label="Kakao T airport ride" copy="Route · consent · provider return" icon={Smartphone} onClick={loadDemoAccount} /><PreviewLink href="/services/baemin-local-meal" label="Baemin local meal" copy="Address · discount · order return" icon={Smartphone} onClick={loadDemoAccount} /></div>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-muted-foreground"><span className="rounded-full bg-surface-2 px-3 py-1.5">Proposal brands · T-money · KakaoTaxi · Baemin</span><span className="rounded-full bg-surface-2 px-3 py-1.5">Proposal category example · GS25</span><span className="rounded-full bg-surface-2 px-3 py-1.5">Expansion · Uber · Coupang Eats · Olive Young</span></div>
        </section>

        <details className="mt-6 rounded-[24px] border border-border bg-card p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Recovery states</p><h2 className="mt-1 text-lg font-extrabold">Eligibility, network and refund recovery</h2></div><ChevronDown className="h-5 w-5 text-muted-foreground" /></summary>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <PreviewLink href="/present?result=expired" label="Expired ID" copy="Renew and return" icon={CircleAlert} onClick={loadDemoAccount} />
            <PreviewLink href="/present?result=offline" label="Network issue" copy="Retry safely" icon={Smartphone} onClick={loadDemoAccount} />
            <PreviewLink href="/explore/seoul-transit-30?preview=soldout" label="Sold out" copy="Show available alternatives" icon={CircleAlert} onClick={startSoldOut} />
            <PreviewLink href="/explore/bukchon-workshop" label="Not eligible" copy="Explain why and reroute" icon={ShieldCheck} onClick={startIneligible} />
            <PreviewLink href="/explore/seoul-transit-30" label="Insufficient balance" copy="Top up without losing the order" icon={Smartphone} onClick={startInsufficient} />
            <PreviewLink href="/services/kakao-t-airport?preview=failed" label="Service handoff failure" copy="No charge · retry safely" icon={CircleAlert} onClick={loadDemoAccount} />
            <PreviewLink href="/partner/verify?preview=refunded" label="Refunded" copy="Customer and merchant view" icon={RefreshCcw} onClick={loadDemoAccount} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">{[["/partner/verify?preview=waiting", "QR waiting"], ["/partner/verify?preview=submitted", "Checking"], ["/partner/verify?preview=verified", "Approved"], ["/partner/verify?preview=failed", "Not approved"], ["/partner/verify?preview=offline", "Offline"]].map(([href, label]) => <Link key={href} href={href} onClick={loadDemoAccount} className="inline-flex min-h-10 items-center rounded-full bg-surface-2 px-3 text-xs font-bold ring-1 ring-border">{label}</Link>)}</div>
        </details>

        <details className="mt-4 rounded-[24px] border border-border bg-card p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Business operations</p><h2 className="mt-1 text-lg font-extrabold">Merchant, settlement and evidence</h2></div><ChevronDown className="h-5 w-5 text-muted-foreground" /></summary>
          <section className="mt-5 grid gap-4 sm:grid-cols-3"><RoleCard href="/partner/verify" icon={Building2} eyebrow="Merchant" title="Store counter" copy="Eligibility, discount and payment" /><RoleCard href="/partner/settlements" icon={Landmark} eyebrow="Settlement" title="Payout desk" copy="Reconciliation and refund adjustments" /><RoleCard href="/evidence" icon={FileSearch} eyebrow="Appendix" title="Technical evidence" copy="Transaction references outside the app UI" /></section>
        </details>
      </div>
    </main>
  )
}
function ScenarioButton({ icon: Icon, eyebrow, title, copy, onClick }: { icon: typeof Smartphone; eyebrow: string; title: string; copy: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="group flex min-h-44 items-start gap-4 rounded-[24px] border border-border bg-card p-5 text-left shadow-sm transition-colors hover:border-primary/35"><span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-secondary text-primary"><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary">{eyebrow}</span><span className="mt-2 block break-keep text-[15px] font-extrabold leading-snug">{title}</span><span className="mt-2 block text-xs leading-relaxed text-muted-foreground">{copy}</span></span><ArrowRight className="mt-2 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" /></button>
}

function CommerceButton({ title, copy, onClick }: { title: string; copy: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="group flex min-h-28 items-center gap-4 rounded-2xl bg-surface-2 p-4 text-left ring-1 ring-border"><span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-success-surface text-success"><BadgeCheck className="h-5 w-5" /></span><span className="min-w-0 flex-1"><strong className="block text-sm">{title}</strong><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{copy}</span></span><ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" /></button>
}

function PreviewLink({ href, label, copy, icon: Icon, onClick }: { href: string; label: string; copy: string; icon: typeof Smartphone; onClick: () => void }) {
  return <Link href={href} onClick={onClick} className="flex min-h-24 items-center gap-3 rounded-2xl bg-surface-2 p-4 ring-1 ring-border"><Icon className="h-5 w-5 text-primary" /><span><strong className="block text-sm">{label}</strong><span className="mt-1 block text-xs text-muted-foreground">{copy}</span></span></Link>
}

function RoleCard({ href, icon: Icon, eyebrow, title, copy }: { href: string; icon: typeof Smartphone; eyebrow: string; title: string; copy: string }) {
  return <Link href={href} className="group flex min-h-28 items-center gap-4 rounded-2xl bg-surface-2 p-4 ring-1 ring-border"><span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-ink text-gold"><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary">{eyebrow}</span><span className="mt-1 block text-sm font-extrabold">{title}</span><span className="mt-1 block text-xs text-muted-foreground">{copy}</span></span></Link>
}
