"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  ChevronRight,
  Check,
  Loader2,
  ScanLine,
  Smartphone,
  Plane,
  Contact,
  Bus,
  Gift,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react"
import { PhoneFrame, Logo, LangToggle } from "@/components/app/shell"
import { Seal } from "@/components/app/seal"
import { KPassCard } from "@/components/app/cards"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import type { Identity, IdentityMethod, UserType } from "@/lib/types"
import { cn } from "@/lib/utils"

type Step = "lang" | "value" | "type" | "verify" | "confirm" | "issue" | "done"

const DOTS: Record<Step, number> = { lang: -1, value: 0, type: 0, verify: 1, confirm: 1, issue: 2, done: 2 }

const TYPES: {
  key: UserType
  method: IdentityMethod
  titleK: string
  capK: string
  metaK: string
  vtK: string
  vdK: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { key: "korean", method: "mobile-id", titleK: "ob.korean", capK: "ob.korean.cap", metaK: "ob.korean.meta", vtK: "ob.verify.mobileId", vdK: "ob.verify.mobileId.desc", icon: Smartphone },
  { key: "foreigner", method: "passport-did", titleK: "ob.foreigner", capK: "ob.foreigner.cap", metaK: "ob.foreigner.meta", vtK: "ob.verify.passport", vdK: "ob.verify.passport.desc", icon: Plane },
  { key: "long-term", method: "foreigner-id", titleK: "ob.longstay", capK: "ob.longstay.cap", metaK: "ob.longstay.meta", vtK: "ob.verify.foreignerId", vdK: "ob.verify.foreignerId.desc", icon: Contact },
]

const VALUE_ROWS = [
  { icon: Bus, key: "ob.value.r1" },
  { icon: Gift, key: "ob.value.r2" },
  { icon: ShieldCheck, key: "ob.value.r3" },
]
const ISSUE_STEPS = ["ob.issuing.c1", "ob.issuing.c2", "ob.issuing.c3"]

function Dots({ index, label }: { index: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5" role="img" aria-label={label}>
      {[0, 1, 2].map((i) => (
        <span aria-hidden="true" key={i} className={cn("h-1.5 rounded-full transition-all", i <= index ? "w-6 bg-primary" : "w-2 bg-border")} />
      ))}
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const { verifyIdentity, issueCapsule, session, loadDemoAccount, hydrated } = useApp()
  const { t, lang, setLang } = useLang()
  const [step, setStep] = useState<Step>("lang")
  const [selected, setSelected] = useState<UserType | null>(null)
  const [consent, setConsent] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [issueError, setIssueError] = useState<string | null>(null)
  const [renewMode, setRenewMode] = useState(false)

  useEffect(() => {
    if (!hydrated || renewMode) return
    const renew = new URLSearchParams(window.location.search).get("mode") === "renew"
    if (!renew) return
    setRenewMode(true)
    setSelected(session.userType ?? "foreigner")
    setStep("type")
  }, [hydrated, renewMode, session.userType])

  const chosen = TYPES.find((ty) => ty.key === selected) ?? null
  const stepLabel = {
    lang: lang === "ko" ? "언어 선택" : "Choose language",
    value: lang === "ko" ? "서비스 안내" : "Service overview",
    type: lang === "ko" ? "사용자 유형과 동의" : "Traveler type and consent",
    verify: lang === "ko" ? "본인 확인" : "Identity check",
    confirm: lang === "ko" ? "확인 결과 검토" : "Review identity result",
    issue: lang === "ko" ? "K-Tour ID 만드는 중" : "Creating K-Tour ID",
    done: lang === "ko" ? "K-Tour ID 준비 완료" : "K-Tour ID ready",
  }[step]

  const runVerify = async () => {
    if (!chosen) return
    setVerifyError(null)
    setVerifying(true)
    try {
      const id = await verifyIdentity(chosen.key, chosen.method)
      setIdentity(id)
      setStep("confirm")
    } catch (error) {
      setVerifyError(error instanceof Error ? error.message : t("ob.verify.error"))
    } finally {
      setVerifying(false)
    }
  }

  const runIssue = async () => {
    if (!identity || !chosen) return
    setIssueError(null)
    setStep("issue")
    try {
      await issueCapsule(identity, chosen.key)
      setStep("done")
    } catch (error) {
      setIssueError(error instanceof Error ? error.message : t("ob.issue.error"))
      setStep("confirm")
    }
  }

  return (
    <PhoneFrame hideNav>
      <div className="flex min-h-[calc(100vh-2.5rem)] flex-col px-6 pb-8 pt-2">
        <p className="sr-only" role="status" aria-live="polite">{stepLabel}</p>
        {/* top bar (hidden on the cover) */}
        {step !== "lang" && (
          <div className="mb-7 flex items-center justify-between">
            <Dots index={DOTS[step]} label={lang === "ko" ? `가입 진행: ${stepLabel}` : `Onboarding progress: ${stepLabel}`} />
            <LangToggle />
          </div>
        )}

        {renewMode && step !== "done" && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl bg-[#fbf2d9] p-3.5 text-[#735116] ring-1 ring-[#ead59d]">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div><p className="text-[13px] font-bold">{lang === "ko" ? "K-Tour ID 갱신" : "Renew K-Tour ID"}</p><p className="mt-1 text-[12px] leading-relaxed">{lang === "ko" ? "본인 확인을 다시 마치면 새 K-Tour ID를 사용할 수 있어요." : "Verify your identity again to use a renewed K-Tour ID."}</p></div>
          </div>
        )}

        {/* ── 0 · Language-first hero ───────────────────────────── */}
        {step === "lang" && (
          <div className="flex flex-1 flex-col items-center pt-10 text-center">
            <Seal size={88} stamp />
            <p className="mt-5 text-[17px] font-bold tracking-tight text-foreground">K-Tour ID</p>
            <h1 className="mt-4 text-[26px] font-extrabold leading-tight tracking-tight text-foreground">{t("ob.hero.title")}</h1>
            <p className="mt-2 max-w-[280px] text-[13px] leading-relaxed text-muted-foreground">{t("ob.hero.sub")}</p>

            <p className="mt-9 text-[12px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{t("ob.hero.chooseLang")}</p>
            <div className="mt-3 grid w-full grid-cols-2 gap-3">
              {(["ko", "en"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => {
                    setLang(l)
                    setStep("value")
                  }}
                  className={cn(
                    "pressable rounded-2xl border py-4 text-[15px] font-bold transition-all",
                    lang === l ? "border-primary bg-primary/5 text-primary ring-1 ring-primary" : "border-border text-foreground hover:bg-secondary",
                  )}
                >
                  {l === "ko" ? "한국어" : "English"}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => { loadDemoAccount(); router.push("/") }}
              className="pressable mt-5 text-[12px] font-medium text-muted-foreground underline underline-offset-2"
            >
              {t("ob.skip")}
            </button>

          </div>
        )}

        {/* ── 1 · Value preview ─────────────────────────────────── */}
        {step === "value" && (
          <div className="flex flex-1 flex-col">
            <h1 className="text-[24px] font-extrabold tracking-tight text-foreground">{t("ob.value.title")}</h1>
            <p className="mt-1 text-[14px] text-muted-foreground">{t("ob.value.sub")}</p>

            <div className="mt-6 space-y-3">
              {VALUE_ROWS.map(({ icon: Icon, key }) => (
                <div key={key} className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3.5 ring-1 ring-border">
                  <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-card text-primary ring-1 ring-border">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="text-[13px] font-medium leading-snug text-foreground">{t(key)}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setStep("type")}
              className="bg-brand-gradient pressable mt-auto flex items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-semibold text-white"
            >
              {t("ob.value.cta")} <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-2 text-center text-[12px] text-muted-foreground">{t("ob.value.helper")}</p>
          </div>
        )}

        {/* ── 2 · Method picker + consent ───────────────────────── */}
        {step === "type" && (
          <div className="flex flex-1 flex-col">
            <h1 className="whitespace-pre-line text-[24px] font-extrabold leading-tight tracking-tight text-foreground">{t("ob.title")}</h1>
            <p className="mt-2 text-[14px] text-muted-foreground">{t("ob.subtitle")}</p>

            <div className="mt-6 space-y-3">
              {TYPES.map((ty) => {
                const Icon = ty.icon
                const active = selected === ty.key
                return (
                  <button
                    key={ty.key}
                    type="button"
                    onClick={() => setSelected(ty.key)}
                    aria-pressed={active}
                    className={cn(
                      "pressable flex w-full items-center gap-3 rounded-2xl border p-4 text-left",
                      active ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-secondary",
                    )}
                  >
                    <span className={cn("grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl", active ? "bg-brand-gradient text-white" : "bg-secondary text-foreground")}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-foreground">{t(ty.titleK)}</p>
                      <p className="text-[12px] leading-snug text-muted-foreground">{t(ty.capK)}</p>
                      <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{t(ty.metaK)}</p>
                    </div>
                    <ChevronRight className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => setConsent((c) => !c)}
              role="checkbox"
              aria-checked={consent}
              className="mt-4 flex min-h-11 items-start gap-2.5 text-left"
            >
              <span className={cn("mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-md border", consent ? "border-primary bg-primary text-white" : "border-border")}>
                {consent && <Check className="h-3.5 w-3.5" />}
              </span>
              <span className="text-[12px] leading-snug text-muted-foreground">{t("ob.consent")}</span>
            </button>

            <details className="mt-2 rounded-2xl bg-card px-3.5 py-3 text-[12px] ring-1 ring-border">
              <summary className="flex min-h-11 cursor-pointer items-center font-bold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                {lang === "ko" ? "개인정보 처리 안내·이용약관" : "Privacy notice & terms"}
              </summary>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                {lang === "ko" ? "본인 확인 결과는 K-Tour ID를 만드는 데만 사용합니다. 확인한 신분증 원본은 저장하지 않으며, 발급 전에는 언제든 동의를 철회할 수 있어요." : "We use the identity-check result only to create your K-Tour ID. Source identity documents are not stored, and you can withdraw before issuance."}
              </p>
            </details>

            <button
              type="button"
              disabled={!selected || !consent}
              onClick={() => setStep("verify")}
              className="bg-brand-gradient pressable mt-auto flex items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-semibold text-white transition-opacity disabled:opacity-40"
            >
              {t("common.continue")} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── 3 · Verify (dark scan) ────────────────────────────── */}
        {step === "verify" && chosen && (
          <div className="flex flex-1 flex-col">
            <h1 className="text-[22px] font-extrabold tracking-tight text-foreground">{t(chosen.vtK)}</h1>
            <p className="mt-2 text-[14px] text-muted-foreground">{t(chosen.vdK)}</p>

            <VerificationPreview method={chosen.method} verifying={verifying} />

            {verifying && <p className="mb-3 text-center text-[12px] text-muted-foreground">{t("ob.verify.progress")}</p>}
            {verifyError && (
              <div role="alert" className="mb-3 flex items-start gap-2 rounded-xl bg-primary/8 px-3 py-2.5 text-[12px] leading-relaxed text-primary ring-1 ring-primary/15">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {verifyError}
              </div>
            )}

            <button
              type="button"
              onClick={runVerify}
              disabled={verifying}
              className="bg-brand-gradient pressable flex items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-semibold text-white disabled:opacity-70"
            >
              {verifying ? t("ob.verifying") : t("ob.verifyBtn", { x: t(chosen.vtK) })}
            </button>
            <button type="button" onClick={() => setStep("type")} disabled={verifying} className="mt-1 py-2 text-[13px] font-medium text-muted-foreground disabled:opacity-50">
              {t("common.back")}
            </button>
          </div>
        )}

        {/* ── 4 · Portrait confirm ──────────────────────────────── */}
        {step === "confirm" && identity && (
          <div className="flex flex-1 flex-col items-center pt-2 text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-primary">{t("ob.confirm.overline")}</p>
            <h1 className="mt-1 text-[24px] font-extrabold tracking-tight text-foreground">{t("ob.confirm.title")}</h1>

            <div className="relative mt-7">
              <img
                src={identity.photoUrl ?? "/abstract-profile.png"}
                alt={identity.displayName}
                className="h-28 w-28 rounded-full object-cover ring-2 ring-[var(--gold)]"
                style={{ animation: "pop-in 0.45s ease-out" }}
              />
              <span className="absolute -bottom-1 -right-1">
                <Seal size={32} />
              </span>
            </div>

            <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-success-surface px-2.5 py-1 text-[12px] font-semibold text-success">
              <Check className="h-3 w-3" /> {t("ob.confirm.chip")}
            </span>
            <p className="mt-2 text-[12px] text-muted-foreground">{t(chosen?.method === "foreigner-id" ? "ob.confirm.caption.foreignerId" : chosen?.method === "passport-did" ? "ob.confirm.caption.passport" : "ob.confirm.caption.mobileId")}</p>

            <div className="mt-4 w-full rounded-2xl bg-surface-2 px-4 py-3 ring-1 ring-border">
              <p className="flex items-center justify-center gap-1.5 text-[16px] font-bold text-foreground">
                {identity.displayName} <span className="text-[14px]">{identity.nationalityFlag}</span>
              </p>
              <p className="text-[12px] text-muted-foreground">{identity.nationality}</p>
            </div>

            <p className="mt-3 max-w-[300px] text-[12px] leading-relaxed text-muted-foreground">{t("ob.confirm.privacy")}</p>
            {issueError && (
              <p role="alert" className="mt-3 rounded-xl bg-primary/8 px-3 py-2 text-[12px] font-medium text-primary ring-1 ring-primary/15">{issueError}</p>
            )}

            <button
              type="button"
              onClick={runIssue}
              className="bg-brand-gradient pressable mt-auto flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-semibold text-white"
            >
              {t("ob.confirm.cta")} <ArrowRight className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setStep("verify")} className="mt-1 py-2 text-[13px] font-medium text-muted-foreground">
              {t("ob.confirm.rescan")}
            </button>
          </div>
        )}

        {/* ── 5 · Issuing (stamp + chain checklist) ─────────────── */}
        {step === "issue" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
            <span className="relative grid h-24 w-24 place-items-center rounded-3xl card-credential text-white">
              <Seal size={56} stamp />
            </span>
            <div>
              <h1 className="text-[20px] font-extrabold tracking-tight text-foreground">{t("ob.issuing")}</h1>
            </div>
            <div className="w-full space-y-2">
              {ISSUE_STEPS.map((k, i) => (
                <div
                  key={k}
                  className="flex items-center gap-2.5 rounded-xl bg-surface-2 px-4 py-2.5 text-[13px] text-foreground ring-1 ring-border"
                  style={{ animation: `pop-in 0.4s ease-out ${i * 0.45 + 0.3}s both` }}
                >
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-success-surface">
                    <Check className="h-3.5 w-3.5 text-success" />
                  </span>
                  {t(k)}
                </div>
              ))}
            </div>
            <p className="inline-flex items-center gap-2 text-[12px] text-muted-foreground">
              {t("common.issuedBy")}
            </p>
          </div>
        )}

        {/* ── 6 · Done (payoff) ─────────────────────────────────── */}
        {step === "done" && session.capsule && (
          <div className="flex flex-1 flex-col">
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-success-surface" style={{ animation: "pop-in 0.4s ease-out" }}>
                <Check className="h-5 w-5 text-success" />
              </span>
              <h1 className="text-[22px] font-extrabold tracking-tight text-foreground">{t("ob.done")}</h1>
            </div>
            <p className="mb-4 text-[13px] text-muted-foreground">{t("ob.doneSub")}</p>

            <KPassCard capsule={session.capsule} identity={session.identity} stamp />

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-primary/8 px-3 py-1.5 text-[12px] font-semibold text-primary">
                {t("wallet.label")} ₩{session.wallet.balanceKRW.toLocaleString("en-US")}
              </span>
              <span className="rounded-full bg-surface-2 px-3 py-1.5 text-[12px] font-medium text-foreground ring-1 ring-border">{t("ob.done.coupon")}</span>
            </div>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="bg-brand-gradient pressable mt-auto flex items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-semibold text-white"
            >
              {t("ob.enter")} <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-2 text-center text-[12px] text-muted-foreground">{t("ob.done.valid")}</p>
          </div>
        )}
      </div>
    </PhoneFrame>
  )
}

function VerificationPreview({ method, verifying }: { method: IdentityMethod; verifying: boolean }) {
  const { t } = useLang()
  const isPassport = method === "passport-did"
  const isResidence = method === "foreigner-id"
  return (
    <div className="my-7 flex flex-1 flex-col items-center justify-center gap-4">
      <div className={cn("card-ink relative grid place-items-center overflow-hidden rounded-3xl text-white", isPassport ? "h-44 w-full" : "h-60 w-60")}>
        <div className="absolute inset-6 rounded-2xl border-2 border-white/20" />
        <div className={cn("absolute inset-x-9 h-0.5 bg-primary shadow-[0_0_12px_2px_var(--primary)]", verifying ? "animate-[scan_1.6s_ease-in-out_infinite]" : "top-1/2")} />
        {verifying ? (
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        ) : isPassport ? (
          <div className="relative flex w-full items-center gap-4 px-12">
            <span className="grid h-16 w-14 place-items-center rounded-lg border border-white/20 bg-white/8"><Plane className="h-7 w-7 text-gold" /></span>
            <div className="flex-1 space-y-2"><span className="block h-2 rounded bg-white/20" /><span className="block h-2 w-3/4 rounded bg-white/15" /><span className="mt-4 block h-5 rounded bg-white/10" /></div>
          </div>
        ) : (
          <div className="text-center">
            {isResidence ? <Contact className="mx-auto h-12 w-12 text-white/70" /> : <Smartphone className="mx-auto h-12 w-12 text-white/70" />}
            <div className="mt-3 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-bold text-white/70">{t("ob.verify.mobileId")}</div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {(isPassport ? ["Document", "Photo", "Face"] : isResidence ? ["Card", "Consent", "Result"] : ["ID", "Consent", "Result"]).map((label) => (
          <span key={label} className="rounded-full bg-secondary px-2.5 py-1 text-[12px] font-bold text-muted-foreground ring-1 ring-border">{label}</span>
        ))}
      </div>
      <p className="max-w-[300px] text-center text-[12px] leading-relaxed text-muted-foreground">
        {isPassport ? t("ob.verify.path.passport") : isResidence ? t("ob.verify.path.residence") : t("ob.verify.path.mobileId")}
      </p>
    </div>
  )
}
