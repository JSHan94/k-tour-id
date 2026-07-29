"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Loader2, Check, Send, X, ShieldCheck } from "lucide-react"
import { Sheet, SheetContent } from "@/components/app/sheet"
import { AppIcon, type IconKey } from "@/lib/icon-map"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import { formatWon } from "@/lib/format"
import { pickContext, type CopilotCommand, D_DAY, TRIP_REMAINING_PCT } from "@/lib/copilot/context"
import { STAY } from "@/lib/mock-data"
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
    dismissedNudges, dismissNudge,
    pay, topUp, convertLeftover, markAllRead,
  } = useApp()

  const ctx = pickContext(pathname, dismissedNudges)
  const [phase, setPhase] = useState<Record<string, Phase>>({})
  const [input, setInput] = useState("")
  const [whisperOpen, setWhisperOpen] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const running = useRef<Set<string>>(new Set())

  // show the whisper once on entering a screen that has one; auto-retract to a dot
  useEffect(() => {
    if (ctx.nudge?.kind === "whisper") {
      setWhisperOpen(true)
      const id = setTimeout(() => setWhisperOpen(false), 6000)
      return () => clearTimeout(id)
    }
    setWhisperOpen(false)
  }, [pathname, ctx.nudge?.kind, ctx.nudge?.id])

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

  const contextLine = (() => {
    const bal = money(session.wallet.balanceKRW)
    if (pathname === "/") return `${STAY.cityKo && lang === "ko" ? STAY.cityKo : STAY.city} · D-${D_DAY} · ${bal}`
    if (pathname.startsWith("/wallet")) return `${t("wallet.budgetLeft")} ${TRIP_REMAINING_PCT}% · ${bal}`
    if (pathname.startsWith("/pass")) return session.capsule ? `${session.capsule.stayPeriod} · ${session.capsule.trustLevel}` : ""
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
      if (c.kind === "pay" && c.merchant && c.amountKRW != null) await pay(c.merchant, c.amountKRW, (c.category as never) ?? "shopping")
      else if (c.kind === "topup" && c.amountKRW != null) await topUp(c.amountKRW)
      else if (c.kind === "convert" && c.amountKRW != null) await convertLeftover(c.amountKRW)
      else if (c.kind === "markRead") markAllRead()
      setPhase((p) => ({ ...p, [c.id]: "done" }))
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

  const dot = ctx.nudge != null
  const whisper = ctx.nudge?.kind === "whisper" && whisperOpen && !copilotOpen

  return (
    <>
      {/* FAB — pinned inside the phone column, above the docked nav */}
      <div className="pointer-events-none fixed bottom-0 left-1/2 z-[60] h-0 w-full max-w-[420px] -translate-x-1/2">
        <div className="absolute bottom-[92px] right-4 flex items-center gap-2">
          {whisper && (
            <button
              type="button"
              onClick={() => {
                // open the copilot (showing the Convert command) — never auto-spend on a nudge tap
                setWhisperOpen(false)
                dismissNudge(ctx.nudge!.id)
                openCopilot()
              }}
              className="pointer-events-auto max-w-[230px] rounded-full border border-border bg-card px-3.5 py-2 text-left text-[12px] font-medium text-foreground shadow-[0_6px_24px_rgba(28,24,19,0.16)]"
              style={{ animation: "whisper-in 0.3s ease-out" }}
            >
              {t(ctx.nudge!.textKey ?? "")}
            </button>
          )}
          <button
            type="button"
            onClick={() => (copilotOpen ? closeCopilot() : openCopilot())}
            aria-label="K-Tour ID AI"
            className="bg-brand-gradient shadow-card-hero pointer-events-auto relative grid h-[54px] w-[54px] place-items-center rounded-full text-white"
            style={{ animation: "breathe 2.6s ease-in-out infinite" }}
          >
            <span className="text-[24px] font-bold leading-none" style={{ fontFamily: "var(--font-sans)" }}>信</span>
            {dot && !copilotOpen && (
              <span
                className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-card bg-[var(--seal)]"
                style={{ animation: "dot-pulse 0.6s ease-out" }}
              />
            )}
          </button>
        </div>
      </div>

      <Sheet open={copilotOpen} onOpenChange={(v) => (v ? openCopilot() : closeCopilot())}>
        <SheetContent title={t("seal.title")}>
          {/* context read */}
          <div className="mb-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
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
                    <p className="truncate text-[13px] font-semibold text-foreground">{c.label ?? t(c.labelKey ?? "")}</p>
                    <p className={cn("truncate text-[11px]", confirming ? "font-semibold text-primary" : "text-muted-foreground")}>
                      {ph === "done"
                        ? doneSubtitle(c.kind)
                        : ph === "error"
                          ? lang === "ko" ? "완료하지 못했어요 · 변경 없음" : "Could not complete · no change"
                        : confirming
                          ? lang === "ko" ? "한 번 더 눌러 확인" : "Tap again to confirm"
                          : c.reason ?? ""}
                    </p>
                  </div>
                  {c.amountKRW != null && ph !== "done" && (
                    <span
                      className={cn(
                        "tabular flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
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
          <div className="mt-4 max-h-[200px] space-y-2.5 overflow-y-auto border-t border-border pt-3">
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
                className="pressable flex-shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-medium text-foreground/80"
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
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("ai.placeholder")}
              className="flex-1 rounded-full bg-surface-2 px-4 py-2.5 text-[13px] outline-none ring-1 ring-border focus:ring-primary"
            />
            <button
              type="submit"
              disabled={copilotThinking || !input.trim()}
              className="bg-brand-gradient pressable grid h-10 w-10 flex-shrink-0 place-items-center rounded-full text-white disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
