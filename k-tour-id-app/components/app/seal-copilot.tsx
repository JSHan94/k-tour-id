"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Loader2, Check, Send, X, ShieldCheck } from "lucide-react"
import { Sheet, SheetContent } from "@/components/app/sheet"
import { AppIcon, type IconKey } from "@/lib/icon-map"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import { formatWon } from "@/lib/format"
import { pickContext, type CopilotCommand, D_DAY } from "@/lib/copilot/context"
import { STAY, TRIP_BUDGET_KRW } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

type Phase = "idle" | "confirm" | "processing" | "done" | "error"

export function SealCopilot() {
  const pathname = usePathname()
  const router = useRouter()
  const { t, lang } = useLang()
  const {
    session, transactions, notifications,
    copilotOpen, openCopilot, closeCopilot,
    copilotThread, copilotThinking, copilotSeed, copilotSend, copilotPushAi,
    dismissedNudges,
    pay, topUp, convertLeftover, markAllRead,
  } = useApp()

  const ctx = pickContext(pathname, dismissedNudges, { userType: session.userType, balanceKRW: session.wallet.balanceKRW })
  const [phase, setPhase] = useState<Record<string, Phase>>({})
  const [input, setInput] = useState("")
  const endRef = useRef<HTMLDivElement>(null)
  const running = useRef<Set<string>>(new Set())

  // seed the greeting the first time the sheet opens
  useEffect(() => {
    if (copilotOpen) copilotSeed(t("ai.greeting"))
  }, [copilotOpen, copilotSeed, t])

  useEffect(() => {
    if (copilotOpen) requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }))
  }, [copilotThread.length, copilotThinking, copilotOpen])

  // hide on the chat screen (its own bottom input/send would collide with the FAB)
  if (!session.onboarded || pathname.startsWith("/connect/chat")) return null

  const money = (krw?: number) => (krw == null ? "" : lang === "ko" ? formatWon(krw) : `₩${krw.toLocaleString("en-US")}`)
  const spentKRW = transactions.filter((tx) => tx.amountKRW < 0).reduce((sum, tx) => sum + Math.abs(tx.amountKRW), 0)
  const tripRemainingPct = Math.max(0, Math.round(((TRIP_BUDGET_KRW - spentKRW) / TRIP_BUDGET_KRW) * 100))

  const contextLine = (() => {
    const bal = money(session.wallet.balanceKRW)
    if (pathname === "/") {
      if (session.userType === "foreigner") return `${STAY.cityKo && lang === "ko" ? STAY.cityKo : STAY.city} · D-${D_DAY} · ${bal}`
      if (session.userType === "long-term") return `${lang === "ko" ? "서울 생활 혜택" : "Seoul resident benefits"} · ${bal}`
      return `${lang === "ko" ? "국내 여행 혜택" : "Local travel benefits"} · ${bal}`
    }
    if (pathname.startsWith("/wallet")) return `${t("wallet.budgetLeft")} ${tripRemainingPct}% · ${bal}`
    if (pathname.startsWith("/pass")) return session.capsule ? `${session.capsule.stayPeriod} · ${t("pass.statusActive")}` : ""
    if (pathname.startsWith("/alerts")) return `${notifications.filter((n) => !n.read).length} unread`
    return bal
  })()

  const screenChip = (() => {
    if (pathname === "/") return t("nav.home")
    if (pathname.startsWith("/wallet")) return t("nav.wallet")
    if (pathname.startsWith("/pass")) return t("pass.title")
    if (pathname.startsWith("/alerts")) return t("nav.alerts")
    if (pathname.startsWith("/profile")) return t("nav.profile")
    return t("nav.home")
  })()

  const isMoney = (k: CopilotCommand["kind"]) => k === "pay" || k === "topup" || k === "convert"
  const doneSubtitle = (k: CopilotCommand["kind"]) =>
    k === "pay" ? t("modal.loggedOmnione.pay")
      : k === "topup" ? t("modal.loggedOmnione.topup")
        : k === "convert" ? t("modal.loggedOmnione.convert")
          : t("modal.loggedOmnione.markRead")

  const runCommand = async (c: CopilotCommand) => {
    if (running.current.has(c.id)) return
    if (c.kind === "navigate" && c.href) {
      closeCopilot()
      router.push(c.href)
      return
    }
    if (c.kind === "explain") {
      if (c.sayKey) copilotPushAi(t(c.sayKey))
      return
    }
    // money actions require a deliberate second tap — never a single-tap spend
    if (isMoney(c.kind) && (phase[c.id] ?? "idle") !== "confirm") {
      setPhase((p) => ({ ...p, [c.id]: "confirm" }))
      setTimeout(() => setPhase((p) => (p[c.id] === "confirm" ? { ...p, [c.id]: "idle" } : p)), 5000)
      return
    }
    running.current.add(c.id) // synchronous lock — blocks the double-tap race
    setPhase((p) => ({ ...p, [c.id]: "processing" }))
    try {
      let succeeded = true
      let failure = ""
      if (c.kind === "pay" && c.merchant && c.amountKRW != null) {
        succeeded = await pay(c.merchant, c.amountKRW, (c.category as never) ?? "shopping")
        if (!succeeded) failure = lang === "ko" ? "여행 잔액이 부족해요. 지갑에서 충전한 뒤 다시 시도해 주세요." : "Your travel balance is too low. Top up in Wallet and try again."
      } else if (c.kind === "topup" && c.amountKRW != null) await topUp(c.amountKRW)
      else if (c.kind === "convert" && c.amountKRW != null) {
        const result = await convertLeftover(c.amountKRW)
        succeeded = result.ok
        if (!result.ok) failure = result.error?.code === "INSUFFICIENT_BALANCE"
          ? (lang === "ko" ? "전환할 여행 잔액이 부족해요. 금액을 확인해 주세요." : "There isn't enough travel balance to convert.")
          : (lang === "ko" ? "바우처를 만들지 못했어요. 다시 시도해 주세요." : "We couldn't create the voucher. Please try again.")
      } else if (c.kind === "markRead") markAllRead()
      if (!succeeded) {
        setPhase((p) => ({ ...p, [c.id]: "error" }))
        copilotPushAi(failure)
        return
      }
      setPhase((p) => ({ ...p, [c.id]: "done" }))
      if (isMoney(c.kind) && c.amountKRW != null) {
        copilotPushAi(lang === "ko"
          ? `${c.kind === "convert" ? "재방문 바우처 생성" : c.kind === "topup" ? "여행 잔액 충전" : "결제"}이 완료됐어요. 최신 잔액과 사용처는 ID·지갑에서 확인할 수 있어요.`
          : `${c.kind === "convert" ? "Return-trip voucher created" : c.kind === "topup" ? "Travel balance top-up" : "Payment"} complete. Check ID · Wallet for the current balance and next action.`)
      }
    } catch {
      setPhase((p) => ({ ...p, [c.id]: "error" }))
    } finally {
      running.current.delete(c.id)
      setTimeout(() => setPhase((p) => ({ ...p, [c.id]: "idle" })), 1600)
    }
  }

  const send = (text: string) => {
    const q = text.trim()
    if (!q || copilotThinking) return
    setInput("")
    copilotSend(q)
  }

  return (
    <>
      <Sheet open={copilotOpen} onOpenChange={(v) => (v ? openCopilot() : closeCopilot())}>
        <SheetContent title={t("seal.title")}>
          {/* context read */}
          <div className="mb-3 flex items-center justify-center gap-1.5 text-[12px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-medium text-foreground/70">
              <ShieldCheck className="h-3 w-3 text-primary" /> {screenChip}
            </span>
            <span className="tabular">{contextLine}</span>
          </div>

          {/* commands */}
          <div className="space-y-2">
            {ctx.commands.map((c) => {
              const ph = phase[c.id] ?? "idle"
              const confirming = ph === "confirm"
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => runCommand(c)}
                  disabled={ph === "processing"}
                  className={cn(
                    "pressable flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left ring-1",
                    confirming ? "bg-primary/5 ring-primary" : "bg-surface-2 ring-border",
                  )}
                >
                  <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-card text-primary ring-1 ring-border">
                    {ph === "processing" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : ph === "done" ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : ph === "error" ? (
                      <X className="h-4 w-4 text-primary" />
                    ) : (
                      <AppIcon name={c.icon as IconKey} className="h-[18px] w-[18px]" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-[13px] font-semibold leading-snug text-foreground">{c.label ?? t(c.labelKey ?? "")}</p>
                    <p className={cn("break-words text-[12px] leading-snug", confirming ? "font-semibold text-primary" : "text-muted-foreground")}>
                      {ph === "done"
                        ? doneSubtitle(c.kind)
                        : ph === "error"
                          ? lang === "ko" ? "완료하지 못했어요 · 변경 없음" : "Could not complete · no change"
                        : confirming
                          ? c.kind === "convert"
                            ? lang === "ko" ? "사용자 재원 · 365일 유효 · 미사용 시 전액 복귀 · 다시 눌러 확인" : "User-funded · valid for 365 days · fully returnable while unused · tap again"
                            : lang === "ko" ? "한 번 더 눌러 확인" : "Tap again to confirm"
                          : c.reason ?? ""}
                    </p>
                  </div>
                  {c.amountKRW != null && ph !== "done" && (
                    <span
                      className={cn(
                        "tabular flex-shrink-0 rounded-full px-2 py-0.5 text-[12px] font-semibold",
                        confirming ? "bg-primary text-white" : "bg-primary/10 text-primary",
                      )}
                    >
                      {money(c.amountKRW)}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* chat thread */}
          <div className="mt-4 max-h-[200px] space-y-2.5 overflow-y-auto border-t border-border pt-3" aria-live="polite" aria-busy={copilotThinking}>
            {copilotThread.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[80%] rounded-2xl rounded-br-md bg-primary px-3 py-2 text-[12px] text-white"
                      : "max-w-[84%] rounded-2xl rounded-bl-md bg-surface-2 px-3 py-2 text-[12px] text-foreground"
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}
            {copilotThinking && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-surface-2 px-3 py-2 text-[12px] text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> {t("ai.thinking")}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* chips */}
          <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
            {ctx.chips.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => send(t(k))}
                className="pressable min-h-10 flex-shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground/80"
              >
                {t(k)}
              </button>
            ))}
          </div>

          {/* input */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            className="mt-2 flex items-center gap-2"
          >
            <input
              aria-label={lang === "ko" ? "K-Tour ID 가이드에게 질문" : "Ask K-Tour ID Guide"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("ai.placeholder")}
              className="flex-1 rounded-full bg-surface-2 px-4 py-2.5 text-[13px] outline-none ring-1 ring-border focus:ring-primary"
            />
            <button
              type="submit"
              disabled={copilotThinking || !input.trim()}
              className="bg-brand-gradient pressable grid h-11 w-11 flex-shrink-0 place-items-center rounded-full text-white disabled:opacity-50"
              aria-label={lang === "ko" ? "보내기" : "Send"}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
