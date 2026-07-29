"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Send, ShieldCheck, Copy, Check } from "lucide-react"
import { Seal } from "@/components/app/seal"
import { ASK_SUGGESTIONS, matchFaq } from "@/lib/ask-fallback"

interface Msg {
  role: "user" | "ai"
  text: string
  fallback?: boolean
}

const GREETING =
  "안녕하세요 — K-Tour ID 기술 어시스턴트입니다. 개발팀이 아키텍처(OmniOne · Open DID · OmniOne Chain), DID/VC, 가맹점 VP 검증, 온체인 프라이버시·보안 등을 정리해 두었어요. 무엇이든 물어보세요. (Ask me anything — I answer in your language.)"

// light cleanup so any stray Markdown doesn't render as raw artifacts
function clean(t: string): string {
  return t.replace(/\*\*/g, "").replace(/^#{1,6}\s+/gm, "").trim()
}

export default function AskPage() {
  const [messages, setMessages] = useState<Msg[]>([{ role: "ai", text: GREETING }])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)
  const composing = useRef(false)
  const endRef = useRef<HTMLDivElement>(null)
  const lastRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const last = messages[messages.length - 1]
    if (busy) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    else if (last?.role === "ai") lastRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    else endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages.length, busy])

  const ask = async (text: string) => {
    const q = text.trim()
    if (!q || busy) return
    setInput("")
    // send recent turns so follow-up / pronoun questions keep context
    const history = messages.slice(-8).map((m) => ({ role: m.role === "user" ? "user" : "model", text: m.text }))
    setMessages((m) => [...m, { role: "user", text: q }])
    setBusy(true)
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: q, history }),
      })
      if (res.ok) {
        const data = (await res.json()) as { reply?: string }
        const reply = (data.reply ?? "").trim() || matchFaq(q)
        setMessages((m) => [...m, { role: "ai", text: reply }])
      } else {
        setMessages((m) => [...m, { role: "ai", text: matchFaq(q), fallback: true }])
      }
    } catch {
      setMessages((m) => [...m, { role: "ai", text: matchFaq(q), fallback: true }])
    } finally {
      setBusy(false)
    }
  }

  const copy = (i: number, t: string) => {
    navigator.clipboard?.writeText(t).then(
      () => {
        setCopied(i)
        setTimeout(() => setCopied((c) => (c === i ? null : c)), 1500)
      },
      () => {},
    )
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      <div className="mx-auto flex h-full w-full max-w-[720px] flex-col px-5">
        {/* header */}
        <header className="flex flex-shrink-0 items-center justify-between gap-3 pb-4 pt-8">
          <div className="flex min-w-0 items-center gap-3">
            <Seal size={44} />
            <div className="min-w-0">
              <h1 className="text-[20px] font-extrabold tracking-tight text-foreground">K-Tour ID · 기술 Q&amp;A</h1>
              <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                개발팀이 정리한 지식 기반 AI · OmniOne / Open DID
              </p>
            </div>
          </div>
          <Link
            href="/architecture"
            className="pressable flex-shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-[12px] font-semibold text-primary"
          >
            아키텍처 →
          </Link>
        </header>

        {/* thread */}
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto py-2">
          {messages.map((m, i) => {
            const isLast = i === messages.length - 1
            if (m.role === "user")
              return (
                <div key={i} ref={isLast ? lastRef : null} className="flex justify-end">
                  <div className="max-w-[82%] whitespace-pre-wrap break-words [overflow-wrap:anywhere] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[14px] leading-relaxed text-white">
                    {m.text}
                  </div>
                </div>
              )
            return (
              <div key={i} ref={isLast ? lastRef : null} className="flex flex-col items-start gap-1">
                <div className="max-w-[88%] whitespace-pre-wrap break-words [overflow-wrap:anywhere] rounded-2xl rounded-bl-md bg-card px-4 py-3 text-[14px] leading-relaxed text-foreground ring-1 ring-border">
                  {clean(m.text)}
                </div>
                <div className="flex items-center gap-2 pl-1 text-[11px] text-muted-foreground">
                  {i !== 0 && (
                    <button type="button" onClick={() => copy(i, clean(m.text))} className="pressable inline-flex items-center gap-1 hover:text-foreground">
                      {copied === i ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                      {copied === i ? "복사됨" : "복사"}
                    </button>
                  )}
                  {m.fallback && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px]">오프라인 답변(키 미연결)</span>}
                </div>
              </div>
            )
          })}
          {busy && (
            <div className="flex justify-start" role="status" aria-live="polite">
              <span className="sr-only">답변을 작성하고 있어요</span>
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-card px-4 py-4 ring-1 ring-border">
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary/55 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary/55 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary/55" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* suggestion chips (wrap, no off-screen) */}
        <div className="flex flex-shrink-0 flex-wrap gap-2 pb-2 pt-1">
          {ASK_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              disabled={busy}
              className="pressable rounded-full border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground/80 disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        {/* input */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (composing.current) return
            ask(input)
          }}
          className="sticky bottom-0 flex flex-shrink-0 items-center gap-2 bg-background pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onCompositionStart={() => (composing.current = true)}
            onCompositionEnd={() => (composing.current = false)}
            maxLength={2000}
            placeholder="질문을 입력하세요 — 예: 보안은 어떻게 보장하나요?"
            className="flex-1 rounded-full bg-card px-4 py-3 text-[14px] outline-none ring-1 ring-border focus:ring-primary"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            title="질문 보내기"
            className="bg-brand-gradient pressable grid h-11 w-11 flex-shrink-0 place-items-center rounded-full text-white disabled:opacity-50"
            aria-label="질문 보내기"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
