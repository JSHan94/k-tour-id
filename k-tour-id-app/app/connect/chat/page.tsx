"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { AlertTriangle, BadgeCheck, Ban, CircleHelp, LogOut, MapPin, MoreHorizontal, Receipt, Send, ShieldCheck, UsersRound, X } from "lucide-react"
import { PhoneFrame, PageHeader } from "@/components/app/shell"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import { formatWon } from "@/lib/format"
import { ACTIVITIES, CONNECT_MESSAGES } from "@/lib/mock-data"
import type { Activity, ConnectMessage } from "@/lib/types"
import { useActivityMembership, useActivitySafety } from "@/app/connect/use-activity-membership"
import { isCredentialUsable } from "@/lib/credential-status"

const SPLIT_KRW = 18000
const SPLIT_MERCHANT = "한강 치맥 비용 나누기"
const DEFAULT_ACTIVITY = ACTIVITIES[0]

type SafetyAction = "leave" | "report" | "block" | "help"

export default function ConnectChatPage() {
  const router = useRouter()
  const { pay, transactions, session, hydrated } = useApp()
  const { t, lang } = useLang()
  const { joinedActivityIds, ready: membershipsReady, isJoined, leaveActivity } = useActivityMembership(session.identity?.did)
  const [activity, setActivity] = useState<Activity | null>(null)
  const { blockedHost, reports, ready: safetyReady, blockHost, reportHost } = useActivitySafety(session.identity?.did, activity?.id)
  const [messages, setMessages] = useState<ConnectMessage[]>([])
  const [input, setInput] = useState("")
  const [splitState, setSplitState] = useState<"idle" | "confirming" | "failed" | "done">("idle")
  const [safetyMenuOpen, setSafetyMenuOpen] = useState(false)
  const [pendingSafetyAction, setPendingSafetyAction] = useState<SafetyAction | null>(null)
  const [completedSafetyAction, setCompletedSafetyAction] = useState<SafetyAction | null>(null)
  const [safetyError, setSafetyError] = useState(false)
  const [reportReceiptId, setReportReceiptId] = useState<string | null>(null)
  const splitBusy = useRef(false)
  const touched = useRef(false)
  const endRef = useRef<HTMLDivElement>(null)
  const safetyTriggerRef = useRef<HTMLButtonElement>(null)
  const credentialActive = isCredentialUsable(session.capsule)

  useEffect(() => {
    if (hydrated && !session.onboarded) router.replace("/onboarding")
  }, [hydrated, router, session.onboarded])

  useEffect(() => {
    if (!hydrated || !session.onboarded || credentialActive) return
    const activityId = new URLSearchParams(window.location.search).get("activity")
    const returnTo = activityId ? `/connect/chat?activity=${encodeURIComponent(activityId)}` : "/connect"
    router.replace(`/onboarding?mode=renew&returnTo=${encodeURIComponent(returnTo)}`)
  }, [credentialActive, hydrated, router, session.onboarded])

  useEffect(() => {
    if (!hydrated || !session.onboarded || !membershipsReady) return
    const id = new URLSearchParams(window.location.search).get("activity")
    const next = ACTIVITIES.find((candidate) => candidate.id === id)
    if (!next || (!isJoined(next.id) && completedSafetyAction !== "leave")) {
      router.replace("/connect")
      return
    }
    setActivity(next)
  }, [completedSafetyAction, hydrated, isJoined, joinedActivityIds, membershipsReady, router, session.onboarded])

  useEffect(() => {
    if (!activity || touched.current) return
    if (activity.id === DEFAULT_ACTIVITY.id) {
      setMessages(CONNECT_MESSAGES)
      return
    }
    const ko = lang === "ko"
    setMessages([
      { id: "g1", fromMe: false, senderName: activity.host, senderPhoto: activity.hostPhoto, text: ko ? "어서 오세요! 참여가 확인돼 그룹 채팅방이 열렸어요 🙂" : "Welcome! Your spot is confirmed, so the group chat is now open 🙂", time: ko ? "방금" : "Just now" },
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

  const hostBlocked = Boolean(activity && blockedHost === activity.host)
  const latestReport = reports.length > 0 ? reports[reports.length - 1] : null
  const visibleMessages = activity
    ? messages.filter((message) => message.fromMe || !hostBlocked || (message.senderName ?? activity.host) !== activity.host)
    : messages

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
      push({ fromMe: true, text: lang === "ko" ? `비용 나누기 ${formatWon(SPLIT_KRW)} 완료 ✓` : `Cost split ₩${SPLIT_KRW.toLocaleString("en-US")} complete ✓` })
      setTimeout(() => push({ fromMe: false, senderName: activity.host, senderPhoto: activity.hostPhoto, text: lang === "ko" ? "확인했어요! 결제 내역은 ID·지갑 거래 내역에서 볼 수 있어요 🙆" : "You can find the payment in ID · Wallet transaction history 🙆" }), 700)
    } catch {
      setSplitState("failed")
      push({ fromMe: false, senderName: activity.host, senderPhoto: activity.hostPhoto, text: lang === "ko" ? "일시적인 오류로 결제가 완료되지 않았어요. 잠시 후 다시 시도해 주세요." : "Payment was not completed because of a temporary error. Try again shortly." })
    } finally {
      splitBusy.current = false
    }
  }

  const confirmSafetyAction = () => {
    if (!pendingSafetyAction || !activity) return
    setSafetyError(false)
    if (pendingSafetyAction === "leave" && !leaveActivity(activity.id)) {
      setSafetyError(true)
      return
    }
    if (pendingSafetyAction === "block" && !blockHost(activity.host)) {
      setSafetyError(true)
      return
    }
    if (pendingSafetyAction === "report") {
      const result = reportHost(activity.host)
      if (!result.ok) {
        setSafetyError(true)
        return
      }
      setReportReceiptId(result.report.id)
    }
    setCompletedSafetyAction(pendingSafetyAction)
    setPendingSafetyAction(null)
  }

  const restoreSafetyFocus = () => window.requestAnimationFrame(() => safetyTriggerRef.current?.focus())
  const closeSafetyMenu = () => { setSafetyMenuOpen(false); restoreSafetyFocus() }
  const closePendingSafety = () => { setPendingSafetyAction(null); setSafetyError(false); restoreSafetyFocus() }

  if (!hydrated || !session.onboarded || !credentialActive || !membershipsReady || !safetyReady || !activity || (!isJoined(activity.id) && completedSafetyAction !== "leave")) return null

  const ko = lang === "ko"
  const title = lang === "en" ? activity.titleEn ?? activity.title : activity.title
  const place = lang === "en" ? activity.placeEn ?? activity.place : activity.place
  const time = lang === "en" ? activity.timeEn ?? activity.time : activity.time
  const rich = activity.id === DEFAULT_ACTIVITY.id

  return (
    <PhoneFrame hideNav className="flex h-[100dvh] min-h-0 flex-col overflow-hidden">
      <div className="shrink-0"><PageHeader title={title} back="/connect" right={<div className="flex items-center gap-1"><span className="inline-flex items-center gap-1 text-[12px] font-semibold text-success"><UsersRound className="h-4 w-4" />{Math.min(activity.capacity, activity.joined + 1)}</span><button ref={safetyTriggerRef} type="button" onClick={() => setSafetyMenuOpen(true)} aria-label={ko ? "액티비티 안전 메뉴" : "Activity safety menu"} className="pressable grid h-11 w-11 place-items-center rounded-full text-foreground/70 hover:bg-secondary"><MoreHorizontal className="h-5 w-5" /></button></div>} /></div>

      <section className="mx-5 mb-3 shrink-0 border-y border-foreground/10 py-3">
        <div className="flex items-center justify-between gap-3 text-[12px] text-muted-foreground"><span className="flex min-w-0 items-center gap-1.5"><MapPin className="h-3.5 w-3.5 flex-shrink-0 text-primary" /><span className="truncate">{place}</span></span><span className="flex-shrink-0">{time}</span></div>
        <div className="mt-3 flex items-center justify-between"><div className="flex -space-x-2">{activity.participants.slice(0, 5).map((photo, index) => <img key={index} src={photo} alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-background" />)}</div><span className="inline-flex items-center gap-1 text-[12px] font-semibold text-success"><BadgeCheck className="h-3.5 w-3.5" />K-Tour ID {ko ? "확인" : "checked"}</span></div>
      </section>

      <div className="mx-5 mb-3 flex shrink-0 items-start gap-2 text-[12px] leading-relaxed text-muted-foreground"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />{ko ? "같은 액티비티 참여가 확정된 사람들에게만 보이는 그룹 채팅이에요" : "This group chat is visible only to confirmed participants in the same activity"}</div>

      {hostBlocked && <div role="status" className="mx-5 mb-3 shrink-0 rounded-xl bg-secondary px-3 py-2 text-[12px] leading-relaxed text-muted-foreground">{ko ? `${activity.host}님의 메시지를 숨겼어요. 다른 참여자에게는 계속 메시지를 보낼 수 있어요.` : `Messages from ${activity.host} are hidden. You can keep messaging other participants.`}</div>}
      {latestReport && <div role="status" className="mx-5 mb-3 shrink-0 rounded-xl bg-success-surface px-3 py-2 text-[12px] font-medium text-success">{ko ? "최근 안전 신고 접수" : "Latest safety report"} · <span className="tabular-nums">{latestReport.id}</span></div>}

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3">
        <div className="space-y-3">
        {visibleMessages.map((message) => (
          <div key={message.id} className={message.fromMe ? "flex justify-end" : "flex items-end gap-2"}>
            {!message.fromMe && <img src={message.senderPhoto ?? activity.hostPhoto} alt="" className="h-7 w-7 flex-shrink-0 rounded-full object-cover" />}
            <div className="max-w-[78%]">
              {!message.fromMe && <p className="mb-1 text-[12px] font-medium text-muted-foreground">{message.senderName ?? activity.host}</p>}
              <div className={message.fromMe ? "rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-[13px] text-white" : "rounded-2xl rounded-bl-md bg-surface-2 px-3.5 py-2.5 text-[13px] text-foreground ring-1 ring-border"}>{lang === "ko" ? message.text : message.textEn ?? message.text}</div>
              <p className={cnTime(message.fromMe)}>{lang === "ko" ? message.time : message.timeEn ?? message.time}</p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
        </div>
      </div>

      {rich && <div className="shrink-0 px-5 pb-2">
        {splitState === "idle" && <button type="button" onClick={() => setSplitState("confirming")} className="pressable flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-surface-2 py-2.5 text-[12px] font-semibold text-foreground ring-1 ring-border"><Receipt className="h-3.5 w-3.5 text-primary" />{`${ko ? "비용 나누기" : t("connect.split")} · ${ko ? formatWon(SPLIT_KRW) : `₩${SPLIT_KRW.toLocaleString("en-US")}`}`}</button>}
        {splitState === "confirming" && <div className="flex gap-2"><button type="button" onClick={() => setSplitState("idle")} className="pressable min-h-11 flex-1 rounded-xl bg-surface-2 py-2.5 text-[12px] font-semibold ring-1 ring-border">{ko ? "취소" : "Cancel"}</button><button type="button" onClick={executeSplit} className="pressable min-h-11 flex-1 rounded-xl bg-primary py-2.5 text-[12px] font-semibold text-white">{ko ? `₩${SPLIT_KRW.toLocaleString("ko-KR")} 결제 확인` : `Confirm ₩${SPLIT_KRW.toLocaleString("en-US")}`}</button></div>}
        {splitState === "failed" && <div role="alert" className="rounded-xl bg-destructive/10 p-3 text-center"><p className="text-[12px] font-semibold text-destructive">{ko ? "결제가 완료되지 않았어요" : "Payment was not completed"}</p><button type="button" onClick={() => setSplitState("confirming")} className="pressable mt-2 min-h-10 text-[12px] font-semibold text-primary underline underline-offset-4">{ko ? "잔액 확인 후 다시 시도" : "Check balance and retry"}</button></div>}
        {splitState === "done" && <div className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-surface-2 px-3 py-2.5 text-center text-[12px] font-semibold text-muted-foreground ring-1 ring-border"><Receipt className="h-3.5 w-3.5 flex-shrink-0 text-primary" />{ko ? "결제 완료 · ID·지갑 거래 내역에 저장" : "Payment complete · saved to ID · Wallet transaction history"}</div>}
      </div>}

      <div className="shrink-0 border-t border-foreground/10 bg-card px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
        <form onSubmit={(event) => { event.preventDefault(); send(input) }} className="flex items-center gap-2">
          <input aria-label={ko ? "메시지 입력" : "Message"} value={input} onChange={(event) => setInput(event.target.value)} placeholder={t("connect.chat.placeholder")} className="min-w-0 flex-1 rounded-full bg-surface-2 px-4 py-2.5 text-[13px] outline-none ring-1 ring-border focus:ring-primary" />
          <button type="submit" disabled={!input.trim()} className="bg-brand-gradient pressable grid h-11 w-11 flex-shrink-0 place-items-center rounded-full text-white disabled:opacity-50" aria-label={ko ? "보내기" : "Send"}><Send className="h-4 w-4" /></button>
        </form>
      </div>

      <SafetyLayer
        ko={ko}
        activityTitle={title}
        targetName={activity.host}
        reportReceiptId={reportReceiptId}
        menuOpen={safetyMenuOpen}
        pending={pendingSafetyAction}
        completed={completedSafetyAction}
        error={safetyError}
        onCloseMenu={closeSafetyMenu}
        onSelect={(action) => { setSafetyMenuOpen(false); setSafetyError(false); setPendingSafetyAction(action) }}
        onClosePending={closePendingSafety}
        onConfirm={confirmSafetyAction}
        onCloseCompleted={() => {
          if (completedSafetyAction === "leave") router.push("/connect")
          else { setCompletedSafetyAction(null); restoreSafetyFocus() }
        }}
      />
    </PhoneFrame>
  )
}

function SafetyLayer({
  ko,
  activityTitle,
  targetName,
  reportReceiptId,
  menuOpen,
  pending,
  completed,
  error,
  onCloseMenu,
  onSelect,
  onClosePending,
  onConfirm,
  onCloseCompleted,
}: {
  ko: boolean
  activityTitle: string
  targetName: string
  reportReceiptId: string | null
  menuOpen: boolean
  pending: SafetyAction | null
  completed: SafetyAction | null
  error: boolean
  onCloseMenu: () => void
  onSelect: (action: SafetyAction) => void
  onClosePending: () => void
  onConfirm: () => void
  onCloseCompleted: () => void
}) {
  const details: Record<SafetyAction, { label: string; labelEn: string; description: string; descriptionEn: string; confirm: string; confirmEn: string }> = {
    leave: { label: "액티비티 나가기", labelEn: "Leave activity", description: "참여 상태와 이 채팅방이 내 목록에서 사라져요. 자리가 남아 있으면 다시 참여할 수 있어요.", descriptionEn: "This activity and chat will be removed from your list. You can rejoin later if a spot is available.", confirm: "나가기", confirmEn: "Leave" },
    report: { label: `${targetName}님 신고`, labelEn: `Report ${targetName}`, description: "최근 메시지와 액티비티 정보를 안전 검토 대상으로 접수해요. 상대방에게 신고 사실을 알리지 않아요.", descriptionEn: "Recent messages and activity details will be submitted for a safety review. The other person will not be notified.", confirm: "신고 접수", confirmEn: "Submit report" },
    block: { label: `${targetName}님 차단`, labelEn: `Block ${targetName}`, description: "이 액티비티에서 해당 참여자의 메시지만 숨겨요. 나는 다른 참여자에게 계속 메시지를 보낼 수 있어요. 신고가 필요하면 별도로 접수해 주세요.", descriptionEn: "Hide this participant's messages in the activity. You can keep messaging other participants. Submit a report separately if needed.", confirm: "차단하기", confirmEn: "Block" },
    help: { label: "안전 도움", labelEn: "Safety help", description: "위급한 상황은 112에, 여행 통역과 안내는 1330에 연락할 수 있어요.", descriptionEn: "For emergencies in Korea, call 112. For travel interpretation and assistance, call 1330.", confirm: "안전 도움 확인", confirmEn: "View safety help" },
  }

  if (!menuOpen && !pending && !completed) return null

  const action = pending ?? completed
  const copy = action ? details[action] : null
  const closeCurrent = completed ? onCloseCompleted : pending ? onClosePending : onCloseMenu
  const layerKey = menuOpen ? "menu" : pending ? `pending-${pending}` : `completed-${completed}`

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => { if (!open) closeCurrent() }}>
      <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-black/35" />
      <DialogPrimitive.Content key={layerKey} className="safe-bottom fixed bottom-0 left-1/2 z-[81] max-h-[calc(100dvh-2rem)] w-full max-w-[420px] -translate-x-1/2 overflow-y-auto rounded-t-[28px] bg-background px-6 pb-7 pt-5 shadow-2xl">
      {menuOpen && <>
        <DialogPrimitive.Description className="sr-only">{ko ? "액티비티 나가기, 신고, 차단 또는 안전 도움을 선택합니다." : "Choose to leave, report, block or open safety help."}</DialogPrimitive.Description>
        <div className="flex items-center justify-between"><div><p className="text-[12px] font-semibold text-primary">{ko ? "안전과 참여 관리" : "SAFETY & PARTICIPATION"}</p><DialogPrimitive.Title className="font-display mt-1 text-[22px] font-semibold">{activityTitle}</DialogPrimitive.Title></div><DialogPrimitive.Close asChild><button type="button" aria-label={ko ? "닫기" : "Close"} className="pressable grid h-11 w-11 place-items-center rounded-full bg-secondary"><X className="h-4 w-4" /></button></DialogPrimitive.Close></div>
        <div role="menu" className="mt-5 divide-y divide-foreground/10 border-y border-foreground/10">
          <SafetyMenuButton icon={LogOut} label={ko ? details.leave.label : details.leave.labelEn} onClick={() => onSelect("leave")} />
          <SafetyMenuButton icon={AlertTriangle} label={ko ? details.report.label : details.report.labelEn} onClick={() => onSelect("report")} />
          <SafetyMenuButton icon={Ban} label={ko ? details.block.label : details.block.labelEn} onClick={() => onSelect("block")} />
          <SafetyMenuButton icon={CircleHelp} label={ko ? details.help.label : details.help.labelEn} onClick={() => onSelect("help")} />
        </div>
      </>}

      {pending && copy && <>
        <DialogPrimitive.Description className="sr-only">{ko ? copy.description : copy.descriptionEn}</DialogPrimitive.Description>
        <p className="text-[12px] font-semibold text-primary">{ko ? "한 번 더 확인해 주세요" : "PLEASE CONFIRM"}</p>
        <DialogPrimitive.Title className="font-display mt-1 text-[24px] font-semibold">{ko ? copy.label : copy.labelEn}</DialogPrimitive.Title>
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{ko ? copy.description : copy.descriptionEn}</p>
        {error && <p role="alert" className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-[12px] font-semibold text-destructive">{ko ? "상태를 저장하지 못했어요. 잠시 후 다시 시도해 주세요." : "We couldn't save this change. Try again shortly."}</p>}
        <div className="mt-6 flex gap-2"><button type="button" onClick={onClosePending} className="pressable min-h-12 flex-1 rounded-xl bg-surface-2 text-[13px] font-semibold ring-1 ring-border">{ko ? "취소" : "Cancel"}</button><button type="button" onClick={onConfirm} className={`pressable min-h-12 flex-1 rounded-xl text-[13px] font-semibold text-white ${pending === "help" ? "bg-primary" : "bg-destructive"}`}>{ko ? copy.confirm : copy.confirmEn}</button></div>
      </>}

      {completed && copy && <div className="text-center">
        <DialogPrimitive.Description className="sr-only">{ko ? "선택한 안전 작업이 완료되었습니다." : "The selected safety action is complete."}</DialogPrimitive.Description>
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary text-primary"><ShieldCheck className="h-6 w-6" /></span>
        <p className="mt-4 text-[12px] font-semibold text-success">{ko ? "완료" : "DONE"}</p>
        <DialogPrimitive.Title className="font-display mt-1 text-[24px] font-semibold">{ko ? copy.label : copy.labelEn}</DialogPrimitive.Title>
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{completed === "help" ? (ko ? "위급한 상황은 112, 여행 통역과 안내는 1330을 이용하세요." : "Call 112 for emergencies or 1330 for travel interpretation and assistance.") : completed === "leave" ? (ko ? "내 액티비티와 채팅 목록에서 제거했어요." : "The activity and chat were removed from your list.") : completed === "report" ? (ko ? "안전 검토 대상으로 접수했어요." : "Your report was submitted for a safety review.") : (ko ? `${targetName}님의 메시지를 숨겼어요. 다른 참여자와는 계속 대화할 수 있어요.` : `Messages from ${targetName} are hidden. You can keep chatting with other participants.`)}</p>
        {completed === "report" && reportReceiptId && <p className="tabular-nums mt-3 rounded-xl bg-success-surface px-3 py-2 text-[12px] font-semibold text-success">{ko ? "신고 접수 ID" : "Report receipt ID"} · {reportReceiptId}</p>}
        <button type="button" onClick={onCloseCompleted} className="pressable mt-6 min-h-12 w-full rounded-xl bg-primary text-[13px] font-semibold text-white">{completed === "leave" ? (ko ? "액티비티 목록으로" : "Back to activities") : (ko ? "확인" : "Done")}</button>
      </div>}
      </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function SafetyMenuButton({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return <button type="button" role="menuitem" onClick={onClick} className="pressable flex min-h-13 w-full items-center gap-3 py-3.5 text-left text-[14px] font-semibold"><Icon className="h-4.5 w-4.5 text-primary" />{label}</button>
}

function cnTime(fromMe: boolean) {
  return `mt-0.5 text-[12px] text-muted-foreground ${fromMe ? "text-right" : ""}`
}
