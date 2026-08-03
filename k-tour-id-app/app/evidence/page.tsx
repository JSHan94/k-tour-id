"use client"

import Link from "next/link"
import { Check, ChevronRight, Database, ExternalLink, Fingerprint, Link2, ReceiptText, Server, ShieldCheck, Smartphone } from "lucide-react"
import { PhoneFrame, PageHeader, SectionTitle } from "@/components/app/shell"
import { IntegrationEvidenceCard, IntegrationModeBadge } from "@/components/app/integration-status"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import { shortHash } from "@/lib/format"

const INTEGRATIONS = [
  { name: "Mobile ID · OmniOne CX", role: { ko: "모바일 신분증 요청·확인", en: "Mobile ID request and verification" }, state: "simulated" as const, icon: Smartphone },
  { name: "Passport eKYC adapter", role: { ko: "단기 방문자를 위한 MRZ/NFC·얼굴 일치·실재성 확인", en: "MRZ/NFC, face match and liveness for short-stay visitors" }, state: "simulated" as const, icon: Fingerprint },
  { name: "OpenDID Issuer / Wallet / Verifier", role: { ko: "민간 여행 서비스 자격 발급·제출·확인", en: "Private travel credential issuance, presentation and verification" }, state: "simulated" as const, icon: ShieldCheck },
  { name: "OmniOne Chain anchor", role: { ko: "개인정보를 제외한 이벤트·정산 감사 기록", en: "Non-PII event commitments and settlement audit trail" }, state: "simulated" as const, icon: Link2 },
]

export default function EvidencePage() {
  const { events, demoJourney } = useApp()
  const { lang } = useLang()
  const ko = lang === "ko"
  const latest = events[0]

  return (
    <PhoneFrame hideNav>
      <PageHeader title={ko ? "연동 증거" : "Integration evidence"} back="/pass" />
      <div className="space-y-6 px-5 pb-8 pt-1">
        <div>
          <p className="text-[13px] font-semibold text-primary">{ko ? "연동 상태 · 증거 범위" : "Integration status · evidence scope"}</p>
          <h1 className="mt-1 text-[22px] font-extrabold tracking-tight text-foreground">{ko ? "무엇이 실제이고, 무엇이 목업인지" : "What is real, sandboxed or mocked"}</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            {ko ? "각 어댑터의 실행 모드와 요청·응답 증거를 분리합니다. 현재 해시와 DID는 시연 데이터이며 실제 OmniOne 트랜잭션으로 표시하지 않습니다." : "Each adapter exposes its execution mode and evidence. Current hashes and DIDs are demo data and are never presented as live OmniOne transactions."}
          </p>
        </div>

        <div>
          <SectionTitle>{ko ? "통합 상태" : "Integration status"}</SectionTitle>
          <div className="divide-y divide-border rounded-2xl bg-card px-4 ring-1 ring-border">
            {INTEGRATIONS.map(({ name, role, state, icon: Icon }) => (
              <div key={name} className="flex items-start gap-3 py-4">
                <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-secondary text-primary"><Icon className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-bold text-foreground">{name}</p>
                    <IntegrationModeBadge mode={state} compact />
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{role[lang]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>{ko ? "신뢰 경로" : "Trust path"}</SectionTitle>
          <div className="rounded-2xl bg-surface-2 p-4 ring-1 ring-border">
            {[
              [Smartphone, ko ? "신원 소스 검증" : "Verify identity source"],
              [Server, ko ? "K-Tour ID 서비스 VC 발급" : "Issue K-Tour service VC"],
              [ShieldCheck, ko ? "사용자 동의 후 VP 제출" : "Create VP after consent"],
              [Database, ko ? "정책·혜택·정산 결과 앵커" : "Anchor policy and settlement"],
            ].map(([Icon, label], index) => {
              const StepIcon = Icon as typeof Smartphone
              return (
                <div key={label as string} className="flex items-center gap-3 py-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-card text-primary ring-1 ring-border"><StepIcon className="h-4 w-4" /></span>
                  <p className="flex-1 text-[12px] font-semibold text-foreground">{label as string}</p>
                  {index < 3 ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <Check className="h-4 w-4 text-success" />}
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <SectionTitle>{ko ? "공통 거래 영수증" : "Shared transaction receipt"}</SectionTitle>
          <div className="rounded-2xl bg-ink p-4 text-white">
            <div className="flex items-center justify-between gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-gold"><ReceiptText className="h-5 w-5" /></span>
              <IntegrationModeBadge mode="simulated" compact />
            </div>
            <p className="mt-3 text-[14px] font-bold">{ko ? demoJourney.productKo : demoJourney.product}</p>
            <p className="mt-1 text-[12px] text-white/72">{demoJourney.merchantDisplay} · {demoJourney.stage}</p>
            <dl className="mt-4 grid grid-cols-[88px_1fr] gap-y-2 text-[12px]">
              <dt className="text-white/60">{ko ? "영수증" : "Receipt"}</dt><dd className="truncate font-mono">{demoJourney.receiptId}</dd>
              <dt className="text-white/60">{ko ? "요청" : "Request"}</dt><dd className="truncate font-mono">{demoJourney.requestId}</dd>
              <dt className="text-white/60">{ko ? "자격 제출" : "Presentation"}</dt><dd className="truncate font-mono">{demoJourney.presentationId}</dd>
              <dt className="text-white/60">{ko ? "정산" : "Settlement"}</dt><dd className="truncate font-mono">{demoJourney.settlementId}</dd>
            </dl>
          </div>
        </div>

        {latest && (
          <IntegrationEvidenceCard
            title={latest.type}
            provider={latest.evidence?.network ?? "Chain adapter"}
            requestId={latest.id}
            timestamp={new Date(latest.timestamp).toLocaleString(ko ? "ko-KR" : "en-US")}
            payloadHash={latest.evidence?.payloadHash ?? latest.txHash}
            mode={latest.integrationMode ?? "simulated"}
          />
        )}

        <div>
          <SectionTitle>{ko ? "이벤트 영수증" : "Event receipts"}</SectionTitle>
          <div className="space-y-2">
            {events.map((event) => (
              <div key={event.id} className="rounded-2xl bg-card p-3.5 ring-1 ring-border">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] font-bold text-foreground">{event.type}</p>
                  <IntegrationModeBadge mode={event.integrationMode ?? "simulated"} compact />
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{event.summary}</p>
                <p className="mt-2 font-mono text-[12px] text-muted-foreground">{shortHash(event.txHash)}</p>
              </div>
            ))}
          </div>
        </div>

        <Link href="/partner/verify" className="pressable flex min-h-12 items-center justify-between rounded-2xl bg-ink px-4 text-[13px] font-bold text-white">
          <span className="inline-flex items-center gap-2"><ExternalLink className="h-4 w-4 text-gold" /> {ko ? "가맹점 검증 콘솔 열기" : "Open merchant verifier"}</span>
          <ChevronRight className="h-4 w-4 text-white/45" />
        </Link>
      </div>
    </PhoneFrame>
  )
}
