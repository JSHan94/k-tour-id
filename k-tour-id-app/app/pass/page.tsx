"use client"

import Link from "next/link"
import { BadgeCheck, ChevronRight, Eye, ScanLine, ShieldCheck } from "lucide-react"
import { PhoneFrame, PageHeader, SectionTitle } from "@/components/app/shell"
import { KPassCard } from "@/components/app/cards"
import { Seal } from "@/components/app/seal"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import { formatTxDate, shortDid, shortHash } from "@/lib/format"
import { IntegrationModeBadge } from "@/components/app/integration-status"

const METHOD_LABEL: Record<string, string> = {
  "mobile-id": "Mobile ID / OmniOne CX",
  "passport-did": "Passport DID + eKYC",
  "foreigner-id": "Foreigner ID Adapter",
}

export default function PassPage() {
  const { session, events } = useApp()
  const { t, lang } = useLang()
  const { capsule, identity } = session

  if (!capsule) {
    return (
      <PhoneFrame>
        <PageHeader title={t("pass.title")} />
        <div className="flex flex-col items-center gap-4 px-6 pt-20 text-center">
          <Seal size={56} />
          <p className="text-[14px] text-muted-foreground">
            No K-Tour ID yet. Verify an identity source to receive your private service credential.
          </p>
          <Link href="/onboarding" className="bg-brand-gradient pressable rounded-xl px-5 py-2.5 text-[14px] font-semibold text-white">
            {t("ob.enter")}
          </Link>
        </div>
      </PhoneFrame>
    )
  }

  return (
    <PhoneFrame>
      <PageHeader
        title={t("pass.title")}
        right={
          <Link href="/evidence" aria-label="Integration evidence" className="pressable grid h-11 w-11 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground">
            <ShieldCheck className="h-4 w-4" />
          </Link>
        }
      />

      <div className="space-y-6 px-5 pt-1">
        <KPassCard capsule={capsule} identity={identity} />

        <Link href="/present" className="bg-brand-gradient pressable flex min-h-14 items-center gap-3 rounded-2xl px-4 text-white shadow-sm">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/12"><ScanLine className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold">{lang === "ko" ? "K-Tour ID 제시" : "Present K-Tour ID"}</p>
            <p className="mt-0.5 text-[11px] text-white/65">{lang === "ko" ? "필요한 정보만 공개하고 혜택을 인증합니다" : "Share only what is needed to unlock a benefit"}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-white/55" />
        </Link>

        <div className="flex items-center justify-between rounded-2xl bg-success-surface px-4 py-3 ring-1 ring-success/20">
          <span className="inline-flex items-center gap-2 text-[12px] font-bold text-success"><BadgeCheck className="h-4 w-4" /> {lang === "ko" ? "Credential 활성" : "Credential active"}</span>
          <IntegrationModeBadge compact />
        </div>

        <div>
          <SectionTitle>{t("pass.credential")}</SectionTitle>
          <div className="divide-y divide-border rounded-2xl bg-surface-2 px-4 ring-1 ring-border">
            <DetailRow label={t("pass.holder")} value={capsule.holderName} />
            <DetailRow label={t("pass.nationality")} value={`${identity?.nationalityFlag ?? ""} ${identity?.nationality ?? "—"}`} />
            <DetailRow label={t("pass.verifiedVia")} value={identity ? METHOD_LABEL[identity.method] : "—"} />
            <DetailRow label={t("pass.issuer")} value={capsule.issuer} />
            <DetailRow label="Type" value={capsule.credentialType} mono />
            <DetailRow label={t("pass.did")} value={shortDid(capsule.did)} mono />
            <DetailRow label={t("pass.issued")} value={formatTxDate(capsule.issuedAt)} />
            <DetailRow label={t("pass.validUntil")} value={formatTxDate(capsule.expiresAt)} />
          </div>
        </div>

        <div>
          <SectionTitle>{t("pass.benefits")}</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {capsule.benefits.map((b) => (
              <span key={b} className="rounded-full bg-primary/8 px-3 py-1.5 text-[12px] font-medium text-primary">
                {b}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-surface-2 p-4 ring-1 ring-border">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <h3 className="text-[14px] font-bold text-foreground">{t("pass.privacyEdge")}</h3>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{t("pass.privacyBody")}</p>
        </div>

        <div>
          <SectionTitle action={<Link href="/evidence" className="text-[11px] font-bold text-primary">{lang === "ko" ? "연동 증거" : "Evidence"}</Link>}>{t("pass.eventLog")}</SectionTitle>
          <div className="space-y-2">
            {events.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-2xl bg-surface-2 px-3.5 py-3 ring-1 ring-border">
                <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-foreground">{t(`evt.${e.type}`)}</p>
                  <p className="truncate text-[10px] text-muted-foreground/70">🔒 {t("pass.localOnly")} · {e.summary}</p>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">{shortHash(e.txHash)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PhoneFrame>
  )
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 text-[13px]">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-[12px] font-medium text-foreground" : "font-medium text-foreground"}>
        {value}
      </span>
    </div>
  )
}
