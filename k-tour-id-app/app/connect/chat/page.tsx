"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { BadgeCheck, MapPin, Receipt, Send, ShieldCheck, UsersRound } from "lucide-react"
import { PhoneFrame, PageHeader } from "@/components/app/shell"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import { formatWon } from "@/lib/format"
import { ACTIVITIES, CONNECT_MESSAGES } from "@/lib/mock-data"
import type { Activity, ConnectMessage } from "@/lib/types"
import { useActivityMembership } from "@/app/connect/use-activity-membership"

const SPLIT_KRW = 18000
const SPLIT_MERCHANT = "한강 치맥 (1/n)"
const DEFAULT_ACTIVITY = ACTIVITIES[0]

export default function ConnectChatPage() {
  const router = useRouter()
  const { pay, transactions, session, hydrated } = useApp()
  const { t, lang } = useLang()
  const { joinedActivityIds, ready: membershipsReady, isJoined } = useActivityMembership(session.identity?.did)
  const [activity, setActivity] = useState<Activity | null>(null)
  const [messages, setMessages] = useState<ConnectMessage[]>([])
  const [input, setInput] = useState("")
  const [splitState, setSplitState] = useState<"idle" | "confirming" | "failed" | "done">("idle")
  const splitBusy = useRef(false)
  const touched = useRef(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (hydrated && !session.onboarded) router.replace("/onboarding")
  }, [hydrated, router, session.onboarded])

  useEffect(() => {
    if (!hydrated || !session.onboarded || !membershipsReady) return
    const id = new URLSearchParams(window.location.search).get("activity")
    const next = ACTIVITIES.find((candidate) => candidate.id === id)
    if (!next || !isJoined(next.id)) {
      router.replace("/connect")
      return
    }
    setActivity(next)
  }, [hydrated, isJoined, joinedActivityIds, membershipsReady, router, session.onboarded])

  useEffect(() => {
    if (!activity || touched.current) return
    if (activity.id === DEFAULT_ACTIVITY.id) {
      setMessages(CONNECT_MESSAGES)
      return
    }
    const ko = lang === "ko"
    setMessages([
      { id: "g1", fromMe: false, senderName: activity.host, senderPhoto: activity.hostPhoto, text: ko ? "어서 오세요! 참가가 확인돼서 그룹 채팅방이 열렸어요 🙂" : "Welcome! Your spot is confirmed, so the group chat is now open 🙂", time: ko ? "방금" : "Just now" },
      { id: "g2", fromMe: true, text: ko ? "안녕하세요! 같이하게 되어 반가워요." : "Hi everyone! Glad to join you.", time: ko ? "방금" : "Just now" },
      { id: "g3", fromMe: false, senderName: activity.host, senderPhoto: activity.hostPhoto, text: ko ? "반가워요. 시작 10분 전에 장소에서 만나요!" : "Great to meet you. Let's meet at the place 10 minutes early!", time: ko ? "방금" : "Just now" },
    ])
  }, [activity, lang])

  useEffect(() => {
    if (!activity || activity.id !== DEFAULT_ACTIVITY.id) {
      setSplitState("idle")
      return
    }
    if (transactions.some((tx) => tx.merchant === SPLIT_MERCHANT)) setSplitState("done")
  }, [activity, transactions])

  useEffect(() => {
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }))
  }, [messages.length])

  const push = (message: Omit<ConnectMessage, "id" | "time">) =>
    setMessages((current) => [...current, { ...message, id: `m-${current.length + 1}`, time: lang === "ko" ? "지금" : "now" }])

  const send = (text: string) => {
    const value = text.trim()
    if (!value || !activity) return
    const currentActivity = activity
    touched.current = true
    setInput("")
    push({ fromMe: true, text: value })
    setTimeout(() => push({ fromMe: false, senderName: currentActivity.host, senderPhoto: currentActivity.hostPhoto, text: lang === "ko" ? "좋아요! 그때 같이 봬요 🙂" : "Great — see you all then! 🙂" }), 800)
  }

  const executeSplit = async () => {
    if (!activity || !isJoined(activity.id)) {
      router.replace("/connect")
      return
    }
    if (splitState !== "confirming" || splitBusy.current) return
    splitBusy.current = true
    touched.current = true
    try {
      const paid = await pay(SPLIT_MERCHANT, SPLIT_KRW, "delivery")
      if (!paid) {
        setSplitState("failed")
        push({ fromMe: false, senderName: activity.host, senderPhoto: activity.hostPhoto, text: lang === "ko" ? "결제가 완료되지 않았어요. 여행 잔액을 확인한 뒤 다시 시도해 주세요." : "Payment was not completed. Check your travel balance and try again." })
        return
      }
      setSplitState("done")
      push({ fromMe: true, text: lang === "ko" ? `같이 결제 ${formatWon(SPLIT_KRW)} 완료 ✓` : `Split pay ₩${SPLIT_KRW.toLocaleString("en-US")} done ✓` })
      setTimeout(() => push({ fromMe: false, senderName: activity.host, senderPhoto: activity.hostPhoto, text: lang === "ko" ? "확인했어요! 결제 내역은 Wallet 거래 기록에서 볼 수 있어요 🙆" : "Got it — the payment is recorded in your Wallet activity 🙆" }), 700)
    } catch {
      setSplitState("failed")
      push({ fromMe: false, senderName: activity.host, senderPhoto: activity.hostPhoto, text: lang === "ko" ? "일시적인 오류로 결제가 완료되지 않았어요. 잠시 후 다시 시도해 주세요." : "Payment was not completed because of a temporary error. Try again shortly." })
    } finally {
      splitBusy.current = false
    }
  }

  if (!hydrated || !session.onboarded || !membershipsReady || !activity || !isJoined(activity.id)) return null

  const ko = lang === "ko"
  const title = lang === "en" ? activity.titleEn ?? activity.title : activity.title
  const place = lang === "en" ? activity.placeEn ?? activity.place : activity.place
  const time = lang === "en" ? activity.timeEn ?? activity.time : activity.time
  const rich = activity.id === DEFAULT_ACTIVITY.id

  return (
    <PhoneFrame hideNav>
      <PageHeader title={title} back="/connect" right={<span className="inline-flex items-center gap-1 text-[12px] font-semibold text-success"><UsersRound className="h-4 w-4" />{Math.min(activity.capacity, activity.joined + 1)}</span>} />

      <section className="mx-5 mb-4 border-y border-foreground/10 py-3">
        <div className="flex items-center justify-between gap-3 text-[12px] text-muted-foreground"><span className="flex min-w-0 items-center gap-1.5"><MapPin className="h-3.5 w-3.5 flex-shrink-0 text-primary" /><span className="truncate">{place}</span></span><span className="flex-shrink-0">{time}</span></div>
        <div className="mt-3 flex items-center justify-between"><div className="flex -space-x-2">{activity.participants.slice(0, 5).map((photo, index) => <img key={index} src={photo} alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-background" />)}</div><span className="inline-flex items-center gap-1 text-[12px] font-semibold text-success"><BadgeCheck className="h-3.5 w-3.5" />K-Tour ID {ko ? "확인" : "checked"}</span></div>
      </section>

      <div className="mx-5 mb-4 flex items-start gap-2 text-[12px] leading-relaxed text-muted-foreground"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />{t("connect.chat.safety")}</div>

      <div className="space-y-3 px-5 pb-3">
        {messages.map((message) => (
          <div key={message.id} className={message.fromMe ? "flex justify-end" : "flex items-end gap-2"}>
            {!message.fromMe && <img src={message.senderPhoto ?? activity.hostPhoto} alt="" className="h-7 w-7 flex-shrink-0 rounded-full object-cover" />}
            <div className="max-w-[78%]">
              {!message.fromMe && <p className="mb-1 text-[11px] font-medium text-muted-foreground">{message.senderName ?? activity.host}</p>}
              <div className={message.fromMe ? "rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-[13px] text-white" : "rounded-2xl rounded-bl-md bg-surface-2 px-3.5 py-2.5 text-[13px] text-foreground ring-1 ring-border"}>{lang === "ko" ? message.text : message.textEn ?? message.text}</div>
              <p className={cnTime(message.fromMe)}>{lang === "ko" ? message.time : message.timeEn ?? message.time}</p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {rich && <div className="px-5 pb-2">
        {splitState === "idle" && <button type="button" onClick={() => setSplitState("confirming")} className="pressable flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-surface-2 py-2.5 text-[12px] font-semibold text-foreground ring-1 ring-border"><Receipt className="h-3.5 w-3.5 text-primary" />{`${t("connect.split")} · ${ko ? formatWon(SPLIT_KRW) : `₩${SPLIT_KRW.toLocaleString("en-US")}`}`}</button>}
        {splitState === "confirming" && <div className="flex gap-2"><button type="button" onClick={() => setSplitState("idle")} className="pressable min-h-11 flex-1 rounded-xl bg-surface-2 py-2.5 text-[12px] font-semibold ring-1 ring-border">{ko ? "취소" : "Cancel"}</button><button type="button" onClick={executeSplit} className="pressable min-h-11 flex-1 rounded-xl bg-primary py-2.5 text-[12px] font-semibold text-white">{ko ? `₩${SPLIT_KRW.toLocaleString("ko-KR")} 결제 확인` : `Confirm ₩${SPLIT_KRW.toLocaleString("en-US")}`}</button></div>}
        {splitState === "failed" && <div role="alert" className="rounded-xl bg-destructive/10 p-3 text-center"><p className="text-[12px] font-semibold text-destructive">{ko ? "결제가 완료되지 않았어요" : "Payment was not completed"}</p><button type="button" onClick={() => setSplitState("confirming")} className="pressable mt-2 min-h-10 text-[12px] font-semibold text-primary underline underline-offset-4">{ko ? "잔액 확인 후 다시 시도" : "Check balance and retry"}</button></div>}
        {splitState === "done" && <div className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-surface-2 px-3 py-2.5 text-center text-[12px] font-semibold text-muted-foreground ring-1 ring-border"><Receipt className="h-3.5 w-3.5 flex-shrink-0 text-primary" />{ko ? "결제 완료 · Wallet 거래 기록에 저장" : "Payment complete · recorded in Wallet activity"}</div>}
      </div>}

      <div className="sticky bottom-0 bg-card px-5 pb-4 pt-2">
        <form onSubmit={(event) => { event.preventDefault(); send(input) }} className="flex items-center gap-2">
          <input aria-label={ko ? "메시지 입력" : "Message"} value={input} onChange={(event) => setInput(event.target.value)} placeholder={t("connect.chat.placeholder")} className="flex-1 rounded-full bg-surface-2 px-4 py-2.5 text-[13px] outline-none ring-1 ring-border focus:ring-primary" />
          <button type="submit" disabled={!input.trim()} className="bg-brand-gradient pressable grid h-11 w-11 flex-shrink-0 place-items-center rounded-full text-white disabled:opacity-50" aria-label={ko ? "보내기" : "Send"}><Send className="h-4 w-4" /></button>
        </form>
      </div>
    </PhoneFrame>
  )
}

function cnTime(fromMe: boolean) {
  return `mt-0.5 text-[12px] text-muted-foreground ${fromMe ? "text-right" : ""}`
}
