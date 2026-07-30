"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, BadgeCheck, ChevronRight, Eye, RefreshCcw, ScanLine, ShieldCheck, XCircle } from "lucide-react"
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
  const [statusPreview, setStatusPreview] = useState<"revoked" | "expired" | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("panel") !== "status") return
    const preview = params.get("preview")
    if (preview === "revoked" || preview === "expired") setStatusPreview(preview)
  }, [])

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
        {statusPreview && (
          <div className="rounded-3xl border border-primary/20 bg-[#f7e8e4] p-4 text-primary">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-card ring-1 ring-primary/15">{statusPreview === "revoked" ? <XCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2"><p className="text-[13px] font-extrabold">{statusPreview === "revoked" ? (lang === "ko" ? "Credential 폐기 판정" : "Credential revoked") : (lang === "ko" ? "Credential 만료 판정" : "Credential expired")}</p><IntegrationModeBadge compact /></div>
                <p className="mt-1 text-[11px] leading-relaxed text-primary/75">{lang === "ko" ? "데모 상태 확인 결과입니다. 현재 저장된 Credential은 변경하지 않았으며, 재발급 흐름으로 계속할 수 있습니다." : "This is a simulated status result. The stored credential was not changed; continue to the reissue flow."}</p>
              </div>
            </div>
            <Link href="/onboarding?mode=renew" className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[12px] font-bold text-white"><RefreshCcw className="h-4 w-4" /> {lang === "ko" ? "새 K-Tour ID 발급" : "Reissue K-Tour ID"}</Link>
          </div>
        )}

        <KPassCard capsule={capsule} identity={identity} />

        {statusPreview ? (
          <div className="flex min-h-14 items-center gap-3 rounded-2xl bg-secondary px-4 text-muted-foreground ring-1 ring-border">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-card"><ScanLine className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-foreground">{lang === "ko" ? "Credential 제시 불가" : "Presentation unavailable"}</p>
              <p className="mt-0.5 text-[11px]">{lang === "ko" ? "재발급 후 다시 제시할 수 있습니다" : "Reissue the credential before presenting again"}</p>
            </div>
          </div>
        ) : (
          <Link href="/present" className="bg-brand-gradient pressable flex min-h-14 items-center gap-3 rounded-2xl px-4 text-white shadow-sm">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/12"><ScanLine className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold">{lang === "ko" ? "K-Tour ID 제시" : "Present K-Tour ID"}</p>
              <p className="mt-0.5 text-[11px] text-white/65">{lang === "ko" ? "필요한 정보만 공개하고 혜택을 인증합니다" : "Share only what is needed to unlock a benefit"}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-white/55" />
          </Link>
        )}

        <div className={statusPreview ? "flex items-center justify-between rounded-2xl bg-[#f7e8e4] px-4 py-3 ring-1 ring-primary/20" : "flex items-center justify-between rounded-2xl bg-success-surface px-4 py-3 ring-1 ring-success/20"}>
          <span className={statusPreview ? "inline-flex items-center gap-2 text-[12px] font-bold text-primary" : "inline-flex items-center gap-2 text-[12px] font-bold text-success"}>{statusPreview ? <XCircle className="h-4 w-4" /> : <BadgeCheck className="h-4 w-4" />} {statusPreview ? (statusPreview === "revoked" ? "Credential revoked" : "Credential expired") : (lang === "ko" ? "Credential 활성" : "Credential active")}</span>
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
