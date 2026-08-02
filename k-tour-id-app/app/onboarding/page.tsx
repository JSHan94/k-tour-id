"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Check, Contact, Loader2, Plane, ShieldCheck, Smartphone } from "lucide-react"
import { PhoneFrame, LangToggle } from "@/components/app/shell"
import { KPassCard } from "@/components/app/cards"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import type { IdentityMethod, UserType } from "@/lib/types"
import { cn } from "@/lib/utils"

type Step = "cover" | "verify" | "done"

const METHODS: {
  key: UserType
  method: IdentityMethod
  ko: string
  en: string
  detailKo: string
  detailEn: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { key: "foreigner", method: "passport-did", ko: "여권", en: "Passport", detailKo: "단기 방문 여행자", detailEn: "Short-stay visitor", icon: Plane },
  { key: "long-term", method: "foreigner-id", ko: "외국인등록증", en: "Residence card", detailKo: "장기 체류자", detailEn: "Long-term resident", icon: Contact },
  { key: "korean", method: "mobile-id", ko: "모바일 신분증", en: "Mobile ID", detailKo: "대한민국 국민", detailEn: "Korean national", icon: Smartphone },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { verifyIdentity, issueCapsule, session, loadDemoAccount, hydrated } = useApp()
  const { lang } = useLang()
  const ko = lang === "ko"
  const [step, setStep] = useState<Step>("cover")
  const [selected, setSelected] = useState<UserType>("foreigner")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [renewMode, setRenewMode] = useState(false)

  useEffect(() => {
    if (!hydrated) return
    const renew = new URLSearchParams(window.location.search).get("mode") === "renew"
    if (!renew) return
    setRenewMode(true)
    setSelected(session.userType ?? "foreigner")
    setStep("verify")
  }, [hydrated, session.userType])

  const chosen = useMemo(() => METHODS.find((item) => item.key === selected) ?? METHODS[0], [selected])

  const completeVerification = async () => {
    if (busy) return
    setBusy(true)
    setError("")
    try {
      const identity = await verifyIdentity(chosen.key, chosen.method)
      await issueCapsule(identity, chosen.key)
      setStep("done")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : (ko ? "본인 확인을 완료하지 못했어요." : "We couldn't complete verification."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <PhoneFrame hideNav>
      {step === "cover" && (
        <main className="flex min-h-screen flex-col bg-background">
          <section className="relative min-h-[54vh] overflow-hidden bg-ink text-white">
            <img src="/seoul-after-rain-hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-[55%_48%]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,16,25,.46),rgba(10,16,25,.06)_48%,rgba(10,16,25,.78))]" />
            <div className="safe-top relative z-10 flex items-center justify-between px-6">
              <p className="font-display text-[20px] font-semibold">K-Tour ID</p>
              <div className="text-white"><LangToggle /></div>
            </div>
            <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-7">
              <p className="text-[13px] font-medium text-white/66">Seoul, made personal</p>
              <h1 className="font-display text-balance mt-2 whitespace-pre-line text-[34px] font-semibold leading-[1.17] tracking-[-0.035em]">
                {ko ? "낯선 곳에서도,\n당신답게 여행하세요." : "Feel at home,\nwherever you travel."}
              </h1>
            </div>
          </section>

          <section className="safe-bottom flex flex-1 flex-col px-6 pt-6">
            <p className="text-balance text-[15px] leading-6 text-muted-foreground">
              {ko ? "여권으로 한 번만 확인하면, 필요한 정보만 보여주고 여행자 혜택을 바로 받을 수 있어요." : "Verify once with your passport. Share only what is needed and unlock traveler benefits."}
            </p>
            <button type="button" onClick={() => { setSelected("foreigner"); setStep("verify") }} className="pressable mt-6 flex min-h-14 items-center justify-between rounded-[14px] bg-primary px-5 text-[16px] font-semibold text-white">
              <span className="flex items-center gap-3"><Plane className="h-5 w-5" /> {ko ? "여권으로 시작" : "Continue with passport"}</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            <details className="mt-2 text-[13px] text-muted-foreground">
              <summary className="pressable flex min-h-11 cursor-pointer items-center justify-center font-medium">{ko ? "다른 신분증 사용" : "Use another ID"}</summary>
              <div className="mt-2 divide-y divide-foreground/10 border-y border-foreground/10">
                {METHODS.slice(1).map((item) => {
                  const Icon = item.icon
                  return (
                    <button key={item.key} type="button" onClick={() => { setSelected(item.key); setStep("verify") }} className="pressable flex min-h-[64px] w-full items-center gap-3 text-left text-foreground">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span className="flex-1"><strong className="block text-[14px] font-semibold">{ko ? item.ko : item.en}</strong><span className="mt-0.5 block text-[12px] text-muted-foreground">{ko ? item.detailKo : item.detailEn}</span></span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )
                })}
              </div>
            </details>
            <button type="button" onClick={() => { loadDemoAccount(); router.push("/") }} className="pressable mt-auto min-h-11 text-[13px] font-medium text-muted-foreground underline decoration-foreground/25 underline-offset-4">
              {ko ? "데모 계정으로 둘러보기" : "Explore with a demo account"}
            </button>
          </section>
        </main>
      )}

      {step === "verify" && (
        <main className="safe-bottom safe-top flex min-h-screen flex-col px-6">
          <header className="flex items-center justify-between">
            <button type="button" onClick={() => renewMode ? router.push("/pass") : setStep("cover")} disabled={busy} aria-label={ko ? "뒤로" : "Back"} className="pressable grid h-11 w-11 place-items-center rounded-full text-foreground disabled:opacity-40"><ArrowLeft className="h-5 w-5" /></button>
            <p className="text-[13px] font-medium text-muted-foreground">2 / 3</p>
            <LangToggle />
          </header>

          <div className="mt-8">
            <p className="text-[13px] font-semibold text-primary">{renewMode ? (ko ? "K-Tour ID 갱신" : "Renew K-Tour ID") : (ko ? "안전한 본인 확인" : "Secure identity check")}</p>
            <h1 className="font-display text-balance mt-2 text-[31px] font-semibold leading-[1.24] tracking-[-0.03em]">
              {ko ? `${chosen.ko}을 확인할게요.` : `Let's verify your ${chosen.en.toLowerCase()}.`}
            </h1>
            <p className="mt-3 text-[15px] leading-6 text-muted-foreground">
              {ko ? "신분증 원본은 저장하지 않아요. 확인 결과로 여행에 필요한 K-Tour ID만 만듭니다." : "We don't store your original ID. Only the result is used to create your K-Tour ID."}
            </p>
          </div>

          <div className="my-9 flex flex-1 items-center justify-center">
            <div className="card-credential relative flex h-[248px] w-full flex-col justify-between overflow-hidden rounded-[28px] p-6 text-white">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-white/65">IDENTITY CHECK</span>
                <chosen.icon className="h-6 w-6 text-gold" />
              </div>
              <div>
                <div className="mb-5 h-px w-full bg-white/15" />
                <p className="font-display text-[27px] font-semibold">{ko ? chosen.ko : chosen.en}</p>
                <p className="mt-2 text-[13px] text-white/62">{ko ? chosen.detailKo : chosen.detailEn}</p>
              </div>
              {busy && <div className="absolute inset-x-6 top-1/2 h-px animate-[scan_1.5s_ease-in-out_infinite] bg-gold shadow-[0_0_12px_rgba(174,138,80,.75)]" />}
            </div>
          </div>

          {error && <p role="alert" className="mb-3 border-l-2 border-destructive pl-3 text-[13px] leading-5 text-destructive">{error}</p>}
          <button type="button" onClick={completeVerification} disabled={busy} className="pressable flex min-h-14 items-center justify-center gap-3 rounded-[14px] bg-primary px-5 text-[16px] font-semibold text-white disabled:opacity-65">
            {busy ? <><Loader2 className="h-5 w-5 animate-spin" /> {ko ? "확인하고 있어요…" : "Verifying…"}</> : <>{ko ? `${chosen.ko} 확인하기` : `Verify ${chosen.en}`} <ArrowRight className="h-5 w-5" /></>}
          </button>
          <details className="mt-2 text-[12px] leading-5 text-muted-foreground">
            <summary className="flex min-h-11 cursor-pointer items-center justify-center font-medium">{ko ? "개인정보 안내" : "Privacy notice"}</summary>
            <p className="pb-2">{ko ? "계속하면 본인 확인과 K-Tour ID 발급을 위한 개인정보 처리에 동의합니다. 발급 전에는 언제든 중단할 수 있어요." : "By continuing, you agree to identity verification and the privacy notice for issuing K-Tour ID. You can stop before issuance."}</p>
          </details>
        </main>
      )}

      {step === "done" && session.capsule && (
        <main className="safe-bottom safe-top flex min-h-screen flex-col px-6">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-success">3 / 3 · {ko ? "준비 완료" : "Ready"}</p>
            <span className="grid h-11 w-11 place-items-center rounded-full border border-success/20 text-success" style={{ animation: "seal-stamp 360ms cubic-bezier(.2,.8,.2,1)" }}><Check className="h-5 w-5" /></span>
          </div>
          <h1 className="font-display text-balance mt-8 text-[34px] font-semibold leading-[1.18] tracking-[-0.035em]">
            {ko ? "서울을 누릴 준비가\n됐어요." : "You're ready\nfor Seoul."}
          </h1>
          <p className="mt-3 text-[15px] leading-6 text-muted-foreground">
            {ko ? "이제 이름이나 여권번호 대신, 필요한 자격만 가볍게 보여주세요." : "Now you can show only the eligibility you need—not your name or passport number."}
          </p>
          <div className="mt-8"><KPassCard capsule={session.capsule} identity={session.identity} stamp /></div>
          <div className="mt-6 flex items-center gap-3 border-y border-foreground/10 py-4 text-[14px]">
            <ShieldCheck className="h-5 w-5 text-success" />
            <span className="flex-1">{selected === "foreigner"
              ? (ko ? "북촌 공예 체험 ₩5,000 할인 가능" : "₩5,000 Bukchon workshop discount ready")
              : (ko ? "현재 신분 유형에 맞는 여행 서비스 이용 가능" : "Travel services for your ID type are ready")}</span>
          </div>
          <button type="button" onClick={() => router.push("/")} className="pressable mt-auto flex min-h-14 items-center justify-between rounded-[14px] bg-primary px-5 text-[16px] font-semibold text-white">
            {ko ? "첫 혜택 만나기" : "Discover your first benefit"}<ArrowRight className="h-5 w-5" />
          </button>
        </main>
      )}
    </PhoneFrame>
  )
}
