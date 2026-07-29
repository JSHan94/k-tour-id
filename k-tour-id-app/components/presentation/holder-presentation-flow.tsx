"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  ExternalLink,
  EyeOff,
  FileCheck2,
  Fingerprint,
  KeyRound,
  Loader2,
  LockKeyhole,
  QrCode,
  RefreshCcw,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TicketCheck,
  TimerReset,
  Unplug,
  XCircle,
} from "lucide-react"
import { PhoneFrame, LangToggle } from "@/components/app/shell"
import { Seal } from "@/components/app/seal"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { useLang } from "@/lib/i18n/lang-provider"
import { cn } from "@/lib/utils"

type FlowStep = "scan" | "request" | "consent" | "creating" | "result"
type DemoResult = "success" | "expired" | "revoked" | "offline"

type Copy = {
  [key: string]: string
}

const COPY: Record<"ko" | "en", Copy> = {
  ko: {
    title: "K-Tour ID 제시",
    simulation: "SIMULATION",
    simulationBody: "실제 개인정보·결제·체인 트랜잭션은 발생하지 않습니다.",
    scanEyebrow: "혜택 인증 요청",
    scanTitle: "가맹점 QR을 스캔하세요",
    scanBody: "필요한 정보만 선택해 증명하고 여행자 혜택을 받을 수 있어요.",
    scanCta: "데모 QR 스캔",
    nearby: "주변의 검증 요청을 찾았어요",
    requestTitle: "북촌 공예관이\n여행자 인증을 요청했어요",
    verifiedMerchant: "K-Tour ID 검증 가맹점",
    requestValidity: "요청 유효시간 04:42",
    requestedInfo: "요청 정보",
    requestPurpose: "사용 목적",
    purposeValue: "외국인 여행자 현장 할인 적용",
    retention: "보관 정책",
    retentionValue: "원본 정보 미보관 · 검증 결과만 30일",
    reviewCta: "공개 정보 확인",
    decline: "요청 거절",
    privacyTitle: "내가 공개할 정보를 확인하세요",
    privacyBody: "이름, 국적, 여권번호는 전달되지 않습니다. 아래 결과값만 가맹점에 증명합니다.",
    required: "필수",
    optional: "선택",
    claimEligible: "외국인 여행자 혜택 대상",
    claimEligibleMeta: "true / false만 공개",
    claimTrip: "여행 기간 유효",
    claimTripMeta: "유효 여부만 공개 · 날짜 비공개",
    claimVoucher: "이 혜택을 아직 사용하지 않음",
    claimVoucherMeta: "쿠폰 ID·사용 여부만 공개",
    consentPurpose: "위 목적과 보관 정책을 확인했으며, 선택한 정보를 1회 제출하는 데 동의합니다.",
    consentHelper: "필수 정보 2개와 제출 동의가 필요해요.",
    createCta: "안전하게 증명 만들기",
    back: "이전",
    creatingTitle: "증명을 만들고 있어요",
    creatingBody: "K-Tour ID 지갑 안에서 서명합니다. 원본 신분증은 기기를 떠나지 않아요.",
    phaseClaims: "선택한 Claim 준비",
    phaseSign: "Holder DID로 VP 서명",
    phaseVerify: "가맹점 Verifier에 제출",
    successEyebrow: "혜택 인증 완료",
    successTitle: "여행자 10% 할인이\n적용됐어요",
    successBody: "북촌 공예관이 필요한 조건만 확인했습니다.",
    benefit: "현장 체험 할인",
    original: "정상가",
    discount: "K-Tour ID 할인",
    total: "결제 예정 금액",
    evidence: "검증 증거",
    verifier: "Verifier",
    proof: "Presentation",
    credentialStatus: "Credential status",
    receiptAnchor: "검증 영수증",
    valid: "Active · status checked",
    simulatedAnchor: "OmniOne Chain · simulated",
    payCta: "할인 금액으로 결제하기",
    doneCta: "K-Tour ID로 돌아가기",
    privacyReceipt: "가맹점에는 판정 결과와 검증 영수증만 남습니다.",
    expiredTitle: "K-Tour ID 유효기간이 끝났어요",
    expiredBody: "새 Credential을 발급받은 뒤 다시 증명해 주세요.",
    revokedTitle: "사용할 수 없는 K-Tour ID예요",
    revokedBody: "발급자가 Credential을 폐기했습니다. 상태를 확인하거나 재발급해 주세요.",
    offlineTitle: "검증 서버에 연결할 수 없어요",
    offlineBody: "네트워크가 안정되면 다시 시도해 주세요. 정보는 제출되지 않았습니다.",
    renewCta: "K-Tour ID 갱신하기",
    statusCta: "발급 상태 확인",
    retryCta: "다시 제출하기",
    cancelCta: "가맹점 요청으로 돌아가기",
    demoControls: "데모 결과",
    resultSuccess: "성공",
    resultExpired: "만료",
    resultRevoked: "폐기",
    resultOffline: "연결 실패",
    details: "기술 상세",
    requestId: "Request ID",
    holderDid: "Holder DID",
    verifierDid: "Verifier DID",
    standard: "Proof format",
    noPii: "원본 PII 미전송",
    noPiiBody: "선택한 조건 판정만 VP에 포함",
    stoppedTitle: "OpenDID 검증이 안전하게 중단됐어요",
    stoppedBody: "혜택·결제·체인 영수증은 생성되지 않았습니다.",
  },
  en: {
    title: "Present K-Tour ID",
    simulation: "SIMULATION",
    simulationBody: "No real personal data, payment, or chain transaction is created.",
    scanEyebrow: "Benefit verification request",
    scanTitle: "Scan the merchant QR",
    scanBody: "Prove only what is needed and unlock your traveler benefit.",
    scanCta: "Scan demo QR",
    nearby: "A nearby verification request was found",
    requestTitle: "Bukchon Craft House\nrequests traveler proof",
    verifiedMerchant: "K-Tour ID verified merchant",
    requestValidity: "Request expires in 04:42",
    requestedInfo: "Requested information",
    requestPurpose: "Purpose",
    purposeValue: "Apply an in-store foreign traveler discount",
    retention: "Retention",
    retentionValue: "No raw data · decision receipt for 30 days",
    reviewCta: "Review shared information",
    decline: "Decline request",
    privacyTitle: "Choose what you share",
    privacyBody: "Your name, nationality, and passport number are not shared. Only the results below are proven.",
    required: "Required",
    optional: "Optional",
    claimEligible: "Eligible foreign traveler",
    claimEligibleMeta: "Shares true / false only",
    claimTrip: "Trip period is active",
    claimTripMeta: "Shares status only · dates stay private",
    claimVoucher: "This benefit is unused",
    claimVoucherMeta: "Shares coupon ID and use status",
    consentPurpose: "I reviewed the purpose and retention policy and agree to a one-time presentation of the selected data.",
    consentHelper: "Two required claims and your consent are needed.",
    createCta: "Create proof securely",
    back: "Back",
    creatingTitle: "Creating your proof",
    creatingBody: "Your K-Tour ID wallet signs it locally. The source ID never leaves your device.",
    phaseClaims: "Preparing selected claims",
    phaseSign: "Signing VP with Holder DID",
    phaseVerify: "Submitting to merchant verifier",
    successEyebrow: "Benefit verified",
    successTitle: "Your 10% traveler discount\nis ready",
    successBody: "Bukchon Craft House verified only the required conditions.",
    benefit: "In-store workshop",
    original: "Original price",
    discount: "K-Tour ID discount",
    total: "Total due",
    evidence: "Verification evidence",
    verifier: "Verifier",
    proof: "Presentation",
    credentialStatus: "Credential status",
    receiptAnchor: "Verification receipt",
    valid: "Active · status checked",
    simulatedAnchor: "OmniOne Chain · simulated",
    payCta: "Pay discounted amount",
    doneCta: "Back to K-Tour ID",
    privacyReceipt: "The merchant retains only the decision and verification receipt.",
    expiredTitle: "Your K-Tour ID has expired",
    expiredBody: "Renew your Credential, then create a new presentation.",
    revokedTitle: "This K-Tour ID cannot be used",
    revokedBody: "The issuer revoked this Credential. Check its status or request a reissue.",
    offlineTitle: "Verifier is unavailable",
    offlineBody: "Try again on a stable network. No information was submitted.",
    renewCta: "Renew K-Tour ID",
    statusCta: "Check issuance status",
    retryCta: "Try presentation again",
    cancelCta: "Back to merchant request",
    demoControls: "Demo result",
    resultSuccess: "Success",
    resultExpired: "Expired",
    resultRevoked: "Revoked",
    resultOffline: "Offline",
    details: "Technical details",
    requestId: "Request ID",
    holderDid: "Holder DID",
    verifierDid: "Verifier DID",
    standard: "Proof format",
    noPii: "No raw PII shared",
    noPiiBody: "Only selected policy decisions are included in the VP",
    stoppedTitle: "OpenDID verification stopped safely",
    stoppedBody: "No benefit, payment, or chain receipt was created.",
  },
}

const CLAIMS = [
  { id: "eligibility", label: "claimEligible", meta: "claimEligibleMeta", required: true, icon: BadgeCheck },
  { id: "trip", label: "claimTrip", meta: "claimTripMeta", required: true, icon: Clock3 },
  { id: "voucher", label: "claimVoucher", meta: "claimVoucherMeta", required: false, icon: TicketCheck },
] as const

const RESULT_OPTIONS: { value: DemoResult; label: string }[] = [
  { value: "success", label: "resultSuccess" },
  { value: "expired", label: "resultExpired" },
  { value: "revoked", label: "resultRevoked" },
  { value: "offline", label: "resultOffline" },
]

export function HolderPresentationFlow() {
  const { lang } = useLang()
  const c = COPY[lang]
  const [step, setStep] = useState<FlowStep>("scan")
  const [result, setResult] = useState<DemoResult>("success")
  const [claims, setClaims] = useState<Record<string, boolean>>({ eligibility: true, trip: true, voucher: true })
  const [consented, setConsented] = useState(false)
  const [progress, setProgress] = useState(10)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const requested = params.get("result")
    const requestedStep = params.get("step")
    if (RESULT_OPTIONS.some((option) => option.value === requested)) setResult(requested as DemoResult)
    if (["scan", "request", "consent", "result"].includes(requestedStep ?? "")) setStep(requestedStep as FlowStep)
  }, [])

  useEffect(() => {
    if (step !== "creating") return
    setProgress(10)
    const first = window.setTimeout(() => setProgress(42), 350)
    const second = window.setTimeout(() => setProgress(74), 900)
    const third = window.setTimeout(() => setProgress(100), 1450)
    const finish = window.setTimeout(() => setStep("result"), 1850)
    return () => [first, second, third, finish].forEach(window.clearTimeout)
  }, [step])

  const requiredReady = useMemo(
    () => CLAIMS.filter((claim) => claim.required).every((claim) => claims[claim.id]),
    [claims],
  )
  const canPresent = requiredReady && consented

  const goBack = () => {
    if (step === "request") setStep("scan")
    else if (step === "consent") setStep("request")
    else if (step === "result") setStep("request")
    else window.history.back()
  }

  const updateResult = (next: DemoResult) => {
    setResult(next)
    const url = new URL(window.location.href)
    url.searchParams.set("result", next)
    window.history.replaceState({}, "", url)
  }

  return (
    <PhoneFrame hideNav className="bg-card">
      <div className="flex min-h-[calc(100vh-2.5rem)] flex-col">
        <header className="flex items-center justify-between px-4 pb-3 pt-2">
          <button
            type="button"
            onClick={goBack}
            aria-label={c.back}
            className="pressable grid h-11 w-11 place-items-center rounded-full text-foreground/70 hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <p className="text-[16px] font-bold tracking-tight text-foreground">{c.title}</p>
            <span className="mt-0.5 inline-flex items-center rounded-full bg-[#f3e3b8] px-2 py-0.5 text-[9px] font-extrabold tracking-[0.13em] text-[#735116]">
              {c.simulation}
            </span>
          </div>
          <div className="grid h-11 w-11 place-items-center"><LangToggle /></div>
        </header>

        {step === "scan" && <ScanStep c={c} onScan={() => setStep("request")} />}
        {step === "request" && (
          <RequestStep
            c={c}
            result={result}
            onResult={updateResult}
            onContinue={() => setStep("consent")}
            onDecline={() => setStep("scan")}
          />
        )}
        {step === "consent" && (
          <ConsentStep
            c={c}
            claims={claims}
            consented={consented}
            canPresent={canPresent}
            onClaim={(id, value) => setClaims((current) => ({ ...current, [id]: value }))}
            onConsent={setConsented}
            onContinue={() => setStep("creating")}
          />
        )}
        {step === "creating" && <CreatingStep c={c} progress={progress} />}
        {step === "result" && (
          <ResultStep
            c={c}
            result={result}
            showDetails={showDetails}
            onToggleDetails={() => setShowDetails((value) => !value)}
            onRetry={() => setStep("request")}
          />
        )}
      </div>
    </PhoneFrame>
  )
}

function SimulationNotice({ c, className }: { c: Copy; className?: string }) {
  return (
    <div className={cn("flex items-start gap-2 rounded-xl bg-[#fbf2d9] px-3 py-2.5 text-[#735116] ring-1 ring-[#ead59d]", className)}>
      <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
      <p className="text-[11px] leading-relaxed"><strong className="font-extrabold">{c.simulation}</strong> · {c.simulationBody}</p>
    </div>
  )
}

function ScanStep({ c, onScan }: { c: Copy; onScan: () => void }) {
  return (
    <main className="flex flex-1 flex-col px-5 pb-7">
      <div className="pt-6 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">{c.scanEyebrow}</p>
        <h1 className="mt-2 text-[25px] font-extrabold tracking-tight text-foreground">{c.scanTitle}</h1>
        <p className="mx-auto mt-2 max-w-[315px] text-[14px] leading-relaxed text-muted-foreground">{c.scanBody}</p>
      </div>

      <div className="my-8 flex flex-1 items-center justify-center">
        <div className="card-ink relative h-[270px] w-full max-w-[330px] overflow-hidden rounded-[28px] p-5 text-white shadow-card-hero">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "16px 16px" }} />
          <div className="relative flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/70"><Smartphone className="h-3.5 w-3.5" /> K-Tour ID Wallet</span>
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#8fb384]" />
          </div>
          <div className="absolute inset-x-10 top-[62px] bottom-10 rounded-[24px] border border-white/20">
            <span className="absolute -left-px -top-px h-8 w-8 rounded-tl-[24px] border-l-2 border-t-2 border-[var(--gold)]" />
            <span className="absolute -right-px -top-px h-8 w-8 rounded-tr-[24px] border-r-2 border-t-2 border-[var(--gold)]" />
            <span className="absolute -bottom-px -left-px h-8 w-8 rounded-bl-[24px] border-b-2 border-l-2 border-[var(--gold)]" />
            <span className="absolute -bottom-px -right-px h-8 w-8 rounded-br-[24px] border-b-2 border-r-2 border-[var(--gold)]" />
            <div className="absolute left-4 right-4 top-1/2 h-px animate-[scan_1.8s_ease-in-out_infinite] bg-[var(--gold)] shadow-[0_0_14px_2px_rgba(195,160,99,.65)]" />
            <div className="grid h-full place-items-center">
              <QrCode className="h-14 w-14 text-white/45" />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-center gap-2 text-[12px] font-medium text-muted-foreground">
        <span className="h-2 w-2 animate-pulse rounded-full bg-success" /> {c.nearby}
      </div>
      <button type="button" onClick={onScan} className="bg-brand-gradient pressable flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-bold text-white">
        <ScanLine className="h-5 w-5" /> {c.scanCta}
      </button>
      <SimulationNotice c={c} className="mt-3" />
    </main>
  )
}

function MerchantHeader({ c }: { c: Copy }) {
  return (
    <div className="rounded-3xl bg-surface-2 p-4 ring-1 ring-border">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl bg-card text-navy ring-1 ring-border">
          <Building2 className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-bold text-foreground">Bukchon Craft House</p>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-success"><BadgeCheck className="h-3.5 w-3.5" /> {c.verifiedMerchant}</p>
        </div>
        <Seal size={34} />
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {c.requestValidity}</span>
        <span className="font-mono">REQ…7A31</span>
      </div>
    </div>
  )
}

function RequestStep({ c, result, onResult, onContinue, onDecline }: { c: Copy; result: DemoResult; onResult: (value: DemoResult) => void; onContinue: () => void; onDecline: () => void }) {
  return (
    <main className="flex flex-1 flex-col px-5 pb-7 pt-3">
      <h1 className="whitespace-pre-line text-[24px] font-extrabold leading-tight tracking-tight text-foreground">{c.requestTitle}</h1>
      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{c.scanBody}</p>

      <div className="mt-5">
        <MerchantHeader c={c} />
      </div>

      <section className="mt-5">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{c.requestedInfo}</h2>
        <div className="mt-2 divide-y divide-border rounded-2xl bg-card px-4 ring-1 ring-border">
          {CLAIMS.map(({ id, label, required, icon: Icon }) => (
            <div key={id} className="flex min-h-[52px] items-center gap-3 py-3">
              <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-xl bg-success-surface text-success"><Icon className="h-4 w-4" /></span>
              <span className="flex-1 text-[13px] font-semibold text-foreground">{c[label]}</span>
              <span className={cn("rounded-full px-2 py-1 text-[9px] font-bold", required ? "bg-primary/8 text-primary" : "bg-secondary text-muted-foreground")}>{required ? c.required : c.optional}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-2xl bg-surface-2 px-4 ring-1 ring-border">
        <InfoRow icon={Fingerprint} label={c.requestPurpose} value={c.purposeValue} />
        <InfoRow icon={TimerReset} label={c.retention} value={c.retentionValue} border />
      </section>

      <DemoControls c={c} value={result} onChange={onResult} />

      <div className="mt-auto pt-6">
        <button type="button" onClick={onContinue} className="bg-brand-gradient pressable flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-bold text-white">
          {c.reviewCta} <ChevronRight className="h-4 w-4" />
        </button>
        <button type="button" onClick={onDecline} className="pressable mt-2 min-h-11 w-full text-[13px] font-semibold text-muted-foreground">{c.decline}</button>
      </div>
    </main>
  )
}

function InfoRow({ icon: Icon, label, value, border }: { icon: typeof Fingerprint; label: string; value: string; border?: boolean }) {
  return (
    <div className={cn("flex gap-3 py-3.5", border && "border-t border-border")}>
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
      <div><p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-0.5 text-[12px] font-medium leading-relaxed text-foreground">{value}</p></div>
    </div>
  )
}

function DemoControls({ c, value, onChange }: { c: Copy; value: DemoResult; onChange: (value: DemoResult) => void }) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{c.demoControls} · {c.simulation}</p>
      <div className="grid grid-cols-4 gap-1 rounded-xl bg-secondary p-1">
        {RESULT_OPTIONS.map((option) => (
          <button key={option.value} type="button" onClick={() => onChange(option.value)} className={cn("pressable min-h-9 rounded-lg px-1 text-[10px] font-bold", value === option.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>{c[option.label]}</button>
        ))}
      </div>
    </div>
  )
}

function ConsentStep({ c, claims, consented, canPresent, onClaim, onConsent, onContinue }: { c: Copy; claims: Record<string, boolean>; consented: boolean; canPresent: boolean; onClaim: (id: string, value: boolean) => void; onConsent: (value: boolean) => void; onContinue: () => void }) {
  return (
    <main className="flex flex-1 flex-col px-5 pb-7 pt-3">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl bg-primary/8 text-primary"><LockKeyhole className="h-5 w-5" /></span>
        <div>
          <h1 className="text-[23px] font-extrabold leading-tight tracking-tight text-foreground">{c.privacyTitle}</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{c.privacyBody}</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {CLAIMS.map(({ id, label, meta, required, icon: Icon }) => (
          <label key={id} className={cn("flex min-h-[74px] cursor-pointer items-center gap-3 rounded-2xl p-4 ring-1 transition-colors", claims[id] ? "bg-success-surface ring-[#cddac9]" : "bg-card ring-border")}>
            <span className={cn("grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl", claims[id] ? "bg-card text-success" : "bg-secondary text-muted-foreground")}><Icon className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2"><span className="text-[13px] font-bold text-foreground">{c[label]}</span><span className="text-[9px] font-bold text-primary">{required ? c.required : c.optional}</span></span>
              <span className="mt-1 block text-[11px] text-muted-foreground">{c[meta]}</span>
            </span>
            <Switch checked={claims[id]} onCheckedChange={(checked) => onClaim(id, checked)} aria-label={c[label]} className="h-6 w-10 data-[state=checked]:bg-success [&_[data-slot=switch-thumb]]:size-5" />
          </label>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-surface-2 p-4 ring-1 ring-border">
        <label className="flex cursor-pointer items-start gap-3">
          <button type="button" role="checkbox" aria-checked={consented} onClick={() => onConsent(!consented)} className={cn("mt-0.5 grid h-6 w-6 flex-shrink-0 place-items-center rounded-lg border", consented ? "border-primary bg-primary text-white" : "border-border bg-card")}>
            {consented && <Check className="h-4 w-4" />}
          </button>
          <span className="text-[12px] leading-relaxed text-foreground">{c.consentPurpose}</span>
        </label>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-dashed border-border px-3 py-2.5">
        <EyeOff className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
        <p className="text-[11px] leading-relaxed text-muted-foreground"><strong className="text-foreground">{c.noPii}</strong><br />{c.noPiiBody}</p>
      </div>

      <div className="mt-auto pt-6">
        {!canPresent && <p className="mb-2 text-center text-[11px] font-medium text-primary">{c.consentHelper}</p>}
        <button type="button" disabled={!canPresent} onClick={onContinue} className="bg-brand-gradient pressable flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-bold text-white transition-opacity disabled:opacity-35">
          <KeyRound className="h-4 w-4" /> {c.createCta}
        </button>
      </div>
    </main>
  )
}

function CreatingStep({ c, progress }: { c: Copy; progress: number }) {
  const phases = [
    { threshold: 15, label: c.phaseClaims, icon: FileCheck2 },
    { threshold: 50, label: c.phaseSign, icon: KeyRound },
    { threshold: 80, label: c.phaseVerify, icon: ShieldCheck },
  ]
  return (
    <main className="flex flex-1 flex-col items-center px-6 pb-8 pt-14 text-center">
      <div className="card-credential relative grid h-36 w-36 place-items-center overflow-hidden rounded-[38px] text-white shadow-card-hero">
        <div className="absolute inset-0 animate-pulse bg-white/[0.03]" />
        <Seal size={66} stamp />
        <span className="absolute bottom-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-card text-primary"><Loader2 className="h-4 w-4 animate-spin" /></span>
      </div>
      <h1 className="mt-7 text-[25px] font-extrabold tracking-tight text-foreground">{c.creatingTitle}</h1>
      <p className="mt-2 max-w-[320px] text-[13px] leading-relaxed text-muted-foreground">{c.creatingBody}</p>
      <div className="mt-8 w-full rounded-3xl bg-surface-2 p-5 text-left ring-1 ring-border">
        <Progress value={progress} className="h-1.5 bg-border [&_[data-slot=progress-indicator]]:bg-success" />
        <p className="mt-2 text-right font-mono text-[10px] font-semibold text-muted-foreground">{progress}%</p>
        <div className="mt-4 space-y-4">
          {phases.map(({ threshold, label, icon: Icon }) => {
            const complete = progress >= threshold + 25
            const active = progress >= threshold && !complete
            return (
              <div key={label} className="flex items-center gap-3">
                <span className={cn("grid h-8 w-8 place-items-center rounded-full", complete ? "bg-success text-white" : active ? "bg-card text-primary ring-1 ring-border" : "bg-border text-muted-foreground")}>
                  {complete ? <Check className="h-4 w-4" /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                </span>
                <span className={cn("text-[12px] font-semibold", progress >= threshold ? "text-foreground" : "text-muted-foreground")}>{label}</span>
              </div>
            )
          })}
        </div>
      </div>
      <SimulationNotice c={c} className="mt-auto w-full" />
    </main>
  )
}

function ResultStep({ c, result, showDetails, onToggleDetails, onRetry }: { c: Copy; result: DemoResult; showDetails: boolean; onToggleDetails: () => void; onRetry: () => void }) {
  if (result !== "success") return <FailureResult c={c} result={result} onRetry={onRetry} />
  return (
    <main className="flex flex-1 flex-col px-5 pb-7 pt-4">
      <div className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success-surface text-success ring-1 ring-[#cddac9]"><CheckCircle2 className="h-8 w-8" strokeWidth={2.2} /></span>
        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-success">{c.successEyebrow}</p>
        <h1 className="mt-2 whitespace-pre-line text-[25px] font-extrabold leading-tight tracking-tight text-foreground">{c.successTitle}</h1>
        <p className="mt-2 text-[13px] text-muted-foreground">{c.successBody}</p>
      </div>

      <div className="card-ink mt-6 rounded-3xl p-5 text-white">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div><p className="text-[10px] uppercase tracking-[0.12em] text-white/50">{c.benefit}</p><p className="mt-1 text-[15px] font-bold">Mother-of-pearl workshop</p></div>
          <span className="rounded-full bg-[var(--gold)]/15 px-3 py-1.5 text-[11px] font-extrabold text-gold ring-1 ring-[var(--gold)]/25">−10%</span>
        </div>
        <div className="mt-4 space-y-2 text-[12px]">
          <MoneyRow label={c.original} value="₩50,000" />
          <MoneyRow label={c.discount} value="−₩5,000" positive />
          <MoneyRow label={c.total} value="₩45,000" total />
        </div>
      </div>

      <section className="mt-4 rounded-2xl bg-surface-2 ring-1 ring-border">
        <button type="button" onClick={onToggleDetails} className="pressable flex min-h-12 w-full items-center gap-2 px-4 text-left">
          <ShieldCheck className="h-4 w-4 text-success" />
          <span className="flex-1 text-[12px] font-bold text-foreground">{c.evidence} · OpenDID VP</span>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", showDetails && "rotate-180")} />
        </button>
        {showDetails && (
          <div className="border-t border-border px-4 py-1">
            <EvidenceRow label={c.verifier} value="Bukchon Craft House" />
            <EvidenceRow label={c.proof} value="vp:7a31…b8f2" mono />
            <EvidenceRow label={c.credentialStatus} value={c.valid} success />
            <EvidenceRow label={c.receiptAnchor} value={c.simulatedAnchor} />
            <EvidenceRow label={c.requestId} value="req:01J3…7A31" mono />
            <EvidenceRow label={c.holderDid} value="did:omn:holder…18d4" mono />
            <EvidenceRow label={c.verifierDid} value="did:omn:merchant…a202" mono />
            <EvidenceRow label={c.standard} value="W3C VC · OpenDID VP" />
          </div>
        )}
      </section>

      <p className="mt-3 flex items-start justify-center gap-1.5 text-center text-[10px] leading-relaxed text-muted-foreground"><LockKeyhole className="mt-0.5 h-3 w-3 flex-shrink-0" /> {c.privacyReceipt}</p>

      <div className="mt-auto pt-6">
        <Link href="/benefits?verified=1&presentation=vp%3A7a31-b8f2" className="bg-brand-gradient pressable flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-bold text-white">
          {c.payCta} <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/pass" className="pressable mt-2 flex min-h-11 w-full items-center justify-center text-[13px] font-semibold text-muted-foreground">{c.doneCta}</Link>
        <SimulationNotice c={c} className="mt-2" />
      </div>
    </main>
  )
}

function MoneyRow({ label, value, positive, total }: { label: string; value: string; positive?: boolean; total?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between", total && "mt-3 border-t border-white/10 pt-3 text-[15px] font-bold")}>
      <span className={total ? "text-white" : "text-white/55"}>{label}</span>
      <span className={cn("tabular font-semibold", positive ? "text-[#9dc294]" : "text-white")}>{value}</span>
    </div>
  )
}

function EvidenceRow({ label, value, mono, success }: { label: string; value: string; mono?: boolean; success?: boolean }) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-3 border-b border-border py-2.5 last:border-0">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className={cn("max-w-[62%] truncate text-right text-[10px] font-semibold text-foreground", mono && "font-mono", success && "text-success")}>{value}</span>
    </div>
  )
}

function FailureResult({ c, result, onRetry }: { c: Copy; result: Exclude<DemoResult, "success">; onRetry: () => void }) {
  const meta = {
    expired: { icon: TimerReset, title: c.expiredTitle, body: c.expiredBody, cta: c.renewCta, href: "/onboarding?mode=renew", code: "CREDENTIAL_EXPIRED" },
    revoked: { icon: XCircle, title: c.revokedTitle, body: c.revokedBody, cta: c.statusCta, href: "/pass?panel=status", code: "CREDENTIAL_REVOKED" },
    offline: { icon: Unplug, title: c.offlineTitle, body: c.offlineBody, cta: c.retryCta, href: "", code: "VERIFIER_UNAVAILABLE" },
  }[result]
  const Icon = meta.icon
  return (
    <main className="flex flex-1 flex-col px-5 pb-7 pt-14 text-center">
      <span className="mx-auto grid h-20 w-20 place-items-center rounded-[28px] bg-primary/8 text-primary ring-1 ring-primary/15"><Icon className="h-9 w-9" /></span>
      <p className="mt-6 font-mono text-[10px] font-bold tracking-wide text-primary">{meta.code}</p>
      <h1 className="mx-auto mt-2 max-w-[310px] text-[25px] font-extrabold leading-tight tracking-tight text-foreground">{meta.title}</h1>
      <p className="mx-auto mt-3 max-w-[315px] text-[13px] leading-relaxed text-muted-foreground">{meta.body}</p>

      <div className="mt-7 rounded-2xl bg-surface-2 p-4 text-left ring-1 ring-border">
        <div className="flex items-start gap-3">
          {result === "offline" ? <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" /> : <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />}
          <div><p className="text-[12px] font-bold text-foreground">{c.stoppedTitle}</p><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{c.stoppedBody}</p></div>
        </div>
      </div>

      <div className="mt-auto pt-8">
        {result === "offline" ? (
          <button type="button" onClick={onRetry} className="bg-brand-gradient pressable flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-bold text-white"><RefreshCcw className="h-4 w-4" /> {meta.cta}</button>
        ) : (
          <Link href={meta.href} className="bg-brand-gradient pressable flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-bold text-white">{meta.cta} <ExternalLink className="h-4 w-4" /></Link>
        )}
        <button type="button" onClick={onRetry} className="pressable mt-2 min-h-11 w-full text-[13px] font-semibold text-muted-foreground">{c.cancelCta}</button>
        <SimulationNotice c={c} className="mt-2" />
      </div>
    </main>
  )
}
