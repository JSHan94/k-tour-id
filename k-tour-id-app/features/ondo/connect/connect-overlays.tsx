"use client"

import { useRef, useState } from "react"
import { AlertTriangle, ArrowLeft, Check, Clock3, ImagePlus, Languages, MapPin, MessageCircle, MoreHorizontal, Send, ShieldCheck, Users } from "lucide-react"
import { activityIdempotencyKey, firstMissionEvents, type ActivityEvent } from "../contracts/activity"
import type { MessageStatus } from "../contracts/domain"
import { LocalPhotoPicker, withUploadState } from "../media/local-photo-picker"
import type { LocalPhoto } from "../media/media-model"
import { InlineNotice, Sheet } from "../shared/ui/sheet"
import { useOndo } from "../shared/state/ondo-provider"
import { CheckoutOverlay } from "../commerce/checkout-overlay"
import { LabsEntry } from "../labs/labs-entry"
import { TABLES, initialTableRuntime, joinFailureRuntime, tableStatusCopy, toCanonicalMembership, type TableFailureState } from "./table-model"
import { VENUE_NAMES } from "./tables-entry"
import styles from "./connect.module.css"

export function ConnectOverlays() {
  const { state } = useOndo()
  if (state.surface.kind === "table") return <TableDetail tableId={state.surface.tableId} />
  if (state.surface.kind === "chat") return <TableChat tableId={state.surface.tableId} />
  if (state.surface.kind === "local_signal") return <LocalSignal venueId={state.surface.venueId} />
  if (state.surface.kind === "checkout") return <CheckoutOverlay venueId={state.surface.venueId} />
  if (state.surface.kind === "labs") return <LabsEntry />
  return null
}

function TableDetail({ tableId }: { tableId: string }) {
  const { state, actions } = useOndo()
  const table = TABLES.find((candidate) => candidate.id === tableId)
  const [failure, setFailure] = useState<TableFailureState>(
    table?.availability === "TAV-FULL"
      ? "TFR-FULL"
      : table?.availability === "TAV-CANCELLED"
        ? "TFR-CANCELLED"
        : "TFR-NONE",
  )
  const membership = toCanonicalMembership(state.tableMembershipById[tableId])
  const runtime = table ? { ...initialTableRuntime(table, state.tableMembershipById[tableId]), failure } : null
  const locale = state.locale

  if (!table || !runtime) {
    return <Sheet label="Table unavailable" onClose={() => actions.setSurface({ kind: "map" })}><div className={styles.sheetBody}><h2>{locale === "ko" ? "Table을 찾지 못했어요." : "This Table is unavailable."}</h2><button type="button" className={styles.primary} onClick={() => { actions.setTab("tables"); actions.setSurface({ kind: "map" }) }}>{locale === "ko" ? "다른 Table 보기" : "View other Tables"}</button></div></Sheet>
  }
  const activeTable = table

  const date = new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", { month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Seoul" }).format(new Date(table.startsAt))
  const confirmed = ["TMB-CONFIRMED", "TMB-CHECKED-IN", "TMB-COMPLETED"].includes(membership)
  const unavailable = runtime.availability !== "TAV-OPEN"

  function join() {
    if (unavailable) return
    const scenario = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("scenario")
    if (scenario === "table-network" || scenario === "table-policy") {
      const outcome = joinFailureRuntime(activeTable, scenario === "table-network" ? "network" : "policy")
      actions.setMembership(activeTable.id, "failed")
      setFailure(outcome.failure)
      return
    }
    const gates: Array<"account" | "person" | "age"> = ["account"]
    if (activeTable.requiresPerson) gates.push("person")
    if (activeTable.alcohol) gates.push("age")
    actions.beginAction({ cta: "JOIN_TABLE", gates, venueId: activeTable.venueId, tableId: activeTable.id })
  }

  const failureCopy = failure === "TFR-NETWORK"
    ? locale === "ko" ? "연결 문제로 참여를 완료하지 못했어요." : "A connection problem interrupted the request."
    : failure === "TFR-POLICY"
      ? locale === "ko" ? "이 Table의 참여 조건을 충족하지 못했어요." : "The Table policy was not met."
      : null

  return (
    <Sheet label={table.title[locale]} onClose={() => actions.setSurface({ kind: "map" })} size="full">
      <article className={styles.sheetBody} data-table-membership={membership} data-chat-access={runtime.chatAccess} data-table-failure={runtime.failure}>
        <p className={styles.eyebrow}>{locale === "ko" ? "같이 먹는 한 끼" : "A meal shared locally"}</p>
        <h2>{table.title[locale]}</h2>
        <p className={styles.lead}>{locale === "ko" ? "같은 장소와 시간에 식사하고 싶은 사람들이 만나는 자리예요." : "A table for people who want to eat at the same place and time."}</p>

        <div className={styles.placeStrip}><MapPin size={18} /><div><strong>{VENUE_NAMES[table.venueId]?.[locale] ?? table.venueId}</strong><span>{table.menu[locale]}</span></div></div>
        <dl className={styles.detailGrid}>
          <div><dt><Clock3 size={15} /> {locale === "ko" ? "시간" : "Time"}</dt><dd>{date}</dd></div>
          <div><dt><Users size={15} /> {locale === "ko" ? "자리" : "Seats"}</dt><dd>{tableStatusCopy(table, locale)}</dd></div>
          <div><dt><Languages size={15} /> {locale === "ko" ? "사용 언어" : "Languages"}</dt><dd>{table.languages.join(" · ")}</dd></div>
          <div><dt>{locale === "ko" ? "예상 비용" : "Expected cost"}</dt><dd>~₩{table.estimatedPriceKRW.toLocaleString()}</dd></div>
        </dl>

        <div className={styles.hostCard}>
          <span className={styles.avatar} aria-hidden="true">{table.hostName.slice(0, 1)}</span>
          <div><strong>{table.hostName}</strong><span>{table.hostRole[locale]}</span></div>
          <small>{locale === "ko" ? "공개 프로필 정보" : "Public profile info"}</small>
        </div>

        <InlineNotice tone={table.alcohol ? "warm" : "neutral"}>
          <ShieldCheck size={18} />
          <span>{table.alcohol
            ? locale === "ko" ? "주류가 포함될 수 있어 19+ 확인이 필요합니다. 사람 확인은 만남의 안전을 보증하지 않습니다." : "This Table may include alcohol, so a 19+ check is required. A person check does not guarantee meeting safety."
            : locale === "ko" ? "성별·국적을 맞추지 않습니다. 장소, 시간과 사용 언어를 보고 자발적으로 참여해요." : "There is no gender or nationality matching. Join based on the place, time, and languages."}</span>
        </InlineNotice>

        {unavailable ? <InlineNotice tone="warm"><AlertTriangle size={18} /><span>{tableStatusCopy(table, locale)} {locale === "ko" ? "근처 다른 Table을 확인해 주세요." : "Choose another nearby Table."}</span></InlineNotice> : null}
        {failureCopy ? <InlineNotice tone="danger"><AlertTriangle size={18} /><span>{failureCopy}</span></InlineNotice> : null}

        {confirmed ? (
          <button type="button" className={styles.primary} onClick={() => actions.setSurface({ kind: "chat", tableId })}><MessageCircle size={18} /> {locale === "ko" ? "대화 열기" : "Open chat"}</button>
        ) : (
          <button type="button" className={styles.primary} onClick={join} disabled={unavailable || membership === "TMB-REQUESTING"}>
            {membership === "TMB-REQUESTING" ? locale === "ko" ? "참여 요청 중" : "Requesting a seat" : locale === "ko" ? "Table 참여하기" : "Join this Table"}
          </button>
        )}
        {failureCopy ? <button type="button" className={styles.secondary} onClick={() => { setFailure("TFR-NONE"); actions.setMembership(table.id, "none") }}>{locale === "ko" ? "참여 다시 시도" : "Try joining again"}</button> : null}
        {unavailable ? <button type="button" className={styles.secondary} onClick={() => { actions.setTab("tables"); actions.setSurface({ kind: "map" }) }}>{locale === "ko" ? "근처 다른 Table 보기" : "View another Table nearby"}</button> : null}
      </article>
    </Sheet>
  )
}

type ChatItem = { id: string; kind: "text" | "image"; text?: string; previewUrl?: string; status: MessageStatus }

function TableChat({ tableId }: { tableId: string }) {
  const { state, actions } = useOndo()
  const table = TABLES.find((candidate) => candidate.id === tableId)
  const membership = toCanonicalMembership(state.tableMembershipById[tableId])
  const allowed = ["TMB-CONFIRMED", "TMB-CHECKED-IN", "TMB-COMPLETED"].includes(membership) && table?.availability !== "TAV-CANCELLED"
  const locale = state.locale
  const [text, setText] = useState("")
  const [photo, setPhoto] = useState<LocalPhoto | null>(null)
  const [messages, setMessages] = useState<ChatItem[]>([])
  const [confirm, setConfirm] = useState<"leave" | "report" | null>(null)

  if (!table || !allowed) {
    return (
      <Sheet label="Chat locked" onClose={() => actions.setSurface({ kind: "table", tableId })}>
        <div className={styles.sheetBody} data-chat-access="CHA-LOCKED">
          <p className={styles.eyebrow}>{locale === "ko" ? "참가자 대화" : "Participant chat"}</p>
          <h2>{locale === "ko" ? "참여가 확정되면 대화를 볼 수 있어요." : "Chat opens after participation is confirmed."}</h2>
          <p className={styles.lead}>{locale === "ko" ? "계정이 있어도 이 Table의 확정 참가자가 아니면 대화를 읽거나 보낼 수 없습니다." : "An account alone does not unlock chat. Only confirmed participants can read or send messages."}</p>
          <button type="button" className={styles.primary} onClick={() => actions.setSurface({ kind: "table", tableId })}>{locale === "ko" ? "Table로 돌아가기" : "Return to Table"}</button>
        </div>
      </Sheet>
    )
  }
  const activeTable = table

  function outcomeFails() {
    return typeof window !== "undefined" && new URLSearchParams(window.location.search).get("scenario") === "media-failed"
  }

  function sendText() {
    const trimmed = text.trim()
    if (!trimmed) return
    const id = `text-${Date.now()}`
    setMessages((current) => [...current, { id, kind: "text", text: trimmed, status: "MSG-SENDING" }])
    setText("")
    window.setTimeout(() => setMessages((current) => current.map((message) => message.id === id ? { ...message, status: outcomeFails() ? "MSG-FAILED" : "MSG-SENT" } : message)), 420)
  }

  function sendImage() {
    if (!photo) return
    const id = `image-${Date.now()}`
    setPhoto(withUploadState(photo, "UPL-SENDING"))
    setMessages((current) => [...current, { id, kind: "image", previewUrl: photo.previewUrl, status: "MSG-SENDING" }])
    window.setTimeout(() => {
      const failed = outcomeFails()
      setMessages((current) => current.map((message) => message.id === id ? { ...message, status: failed ? "MSG-FAILED" : "MSG-SENT" } : message))
      setPhoto((current) => current ? withUploadState(current, failed ? "UPL-FAILED" : "UPL-SENT") : null)
    }, 480)
  }

  function retryMessage(id: string) {
    setMessages((current) => current.map((message) => message.id === id ? { ...message, status: "MSG-SENDING" } : message))
    window.setTimeout(() => setMessages((current) => current.map((message) => message.id === id ? { ...message, status: "MSG-SENT" } : message)), 360)
  }

  function checkIn() {
    actions.setMembership(activeTable.id, "checked_in")
    const event: ActivityEvent = { id: `checkin:${activeTable.id}`, kind: "visit", subjectRef: "account:fixture", evidenceRef: `visit:${activeTable.id}:2026-08-19`, occurredAt: "2026-08-19T20:30:00+09:00" }
    actions.recordActivityEvents([event])
    actions.notify(locale === "ko" ? "체크인했어요. 방문 이력만 업데이트됐어요." : "Checked in. Only visit history was updated.")
  }

  function completeAndFeedback() {
    actions.setMembership(activeTable.id, "completed")
    const event: ActivityEvent = { id: `meetup:${activeTable.id}`, kind: "meetup", subjectRef: "account:fixture", evidenceRef: `meetup:${activeTable.id}:2026-08-19`, occurredAt: "2026-08-19T22:00:00+09:00" }
    actions.recordActivityEvents([event])
    actions.notify(locale === "ko" ? "피드백이 완료한 Table 이력에 반영됐어요." : "Feedback updated your completed Table history.")
  }

  return (
    <Sheet label={table.title[locale]} onClose={() => actions.setSurface({ kind: "table", tableId })} size="full">
      <div className={styles.chat} data-chat-access="CHA-OPEN" data-membership={membership}>
        <header className={styles.chatHeader}>
          <button type="button" onClick={() => actions.setSurface({ kind: "table", tableId })} aria-label={locale === "ko" ? "Table로 돌아가기" : "Back to Table"}><ArrowLeft size={20} /></button>
          <div><strong>{table.title[locale]}</strong><span>{locale === "ko" ? "이 기기의 미리보기 · 확정 참가자만" : "This preview stays on this device · Confirmed members only"}</span></div>
          <button type="button" onClick={() => setConfirm(confirm ? null : "report")} aria-label={locale === "ko" ? "대화 메뉴" : "Chat menu"}><MoreHorizontal size={20} /></button>
        </header>

        <div className={styles.messageList} aria-live="polite">
          <div className={styles.systemMessage}>{locale === "ko" ? "사진과 메시지는 이 세션의 시뮬레이션에만 남습니다." : "Photos and messages remain only in this session simulation."}</div>
          <div className={styles.received}><strong>Jieun</strong><p>{locale === "ko" ? "입구 오른쪽에서 만나요!" : "Let’s meet to the right of the entrance!"}</p><time>8:12 PM</time></div>
          {messages.map((message) => (
            <div key={message.id} className={`${styles.sent} ${message.status === "MSG-FAILED" ? styles.failedMessage : ""}`} data-message-status={message.status}>
              {message.kind === "image" && message.previewUrl ? <img src={message.previewUrl} alt={locale === "ko" ? "대화 사진 로컬 미리보기" : "Chat photo local preview"} /> : <p>{message.text}</p>}
              <small>{message.status === "MSG-SENDING" ? locale === "ko" ? "보내는 중" : "Sending" : message.status === "MSG-FAILED" ? locale === "ko" ? "보내지 못했어요." : "Could not send" : locale === "ko" ? "보냄 · 시뮬레이션" : "Sent · Simulated"}</small>
              {message.status === "MSG-FAILED" ? <button type="button" onClick={() => retryMessage(message.id)}>{locale === "ko" ? "다시 보내기" : "Try again"}</button> : null}
            </div>
          ))}
        </div>

        <div className={styles.chatTools}>
          <LocalPhotoPicker locale={locale} purpose="chat_image" value={photo} onChange={setPhoto} disabled={photo?.state === "UPL-SENDING"} />
          {photo ? <button type="button" className={styles.secondary} onClick={sendImage} disabled={photo.state === "UPL-SENDING"}><ImagePlus size={17} /> {photo.state === "UPL-FAILED" ? locale === "ko" ? "사진 다시 보내기" : "Retry photo" : locale === "ko" ? "사진 보내기" : "Send photo"}</button> : null}
          <div className={styles.composer}>
            <label className={styles.srOnly} htmlFor={`message-${table.id}`}>{locale === "ko" ? "Table에 메시지 보내기" : "Message the Table"}</label>
            <input id={`message-${table.id}`} value={text} onChange={(event) => setText(event.target.value)} placeholder={locale === "ko" ? "Table에 메시지 보내기" : "Message the Table"} onKeyDown={(event) => { if (event.key === "Enter") sendText() }} />
            <button type="button" onClick={sendText} disabled={!text.trim()} aria-label={locale === "ko" ? "보내기" : "Send"}><Send size={18} /></button>
          </div>
          <div className={styles.chatActions}>
            {membership === "TMB-CONFIRMED" ? <button type="button" onClick={checkIn}>{locale === "ko" ? "현장 체크인" : "Check in"}</button> : null}
            {membership === "TMB-CHECKED-IN" ? <button type="button" onClick={completeAndFeedback}>{locale === "ko" ? "피드백 남기기" : "Submit feedback"}</button> : null}
            <button type="button" onClick={() => setConfirm("report")}>{locale === "ko" ? "신고하기" : "Report"}</button>
            <button type="button" onClick={() => setConfirm("leave")}>{locale === "ko" ? "Table 나가기" : "Leave Table"}</button>
          </div>
        </div>

        {confirm ? (
          <div className={styles.confirmPanel} role="alertdialog" aria-modal="true" aria-labelledby="confirm-action-title">
            <h3 id="confirm-action-title">{confirm === "leave" ? locale === "ko" ? "Table을 나갈까요?" : "Leave this Table?" : locale === "ko" ? "이 대화를 신고할까요?" : "Report this chat?"}</h3>
            <p>{confirm === "leave" ? locale === "ko" ? "나가면 대화를 더 이상 볼 수 없어요." : "You will no longer be able to view this chat." : locale === "ko" ? "신고 접수 상태를 시뮬레이션하고 Table로 돌아갑니다." : "This records a simulated report and returns to the Table."}</p>
            <div><button type="button" onClick={() => setConfirm(null)}>{locale === "ko" ? "취소" : "Cancel"}</button><button type="button" onClick={() => { if (confirm === "leave") actions.setMembership(table.id, "left"); else actions.notify(locale === "ko" ? "신고가 접수된 것으로 시뮬레이션했어요." : "The report was recorded in this simulation."); setConfirm(null); actions.setSurface({ kind: "table", tableId }) }}>{locale === "ko" ? "확인" : "Confirm"}</button></div>
          </div>
        ) : null}
      </div>
    </Sheet>
  )
}

function LocalSignal({ venueId }: { venueId: string }) {
  const { state, actions } = useOndo()
  const locale = state.locale
  const [photo, setPhoto] = useState<LocalPhoto | null>(null)
  const [note, setNote] = useState("")
  const [status, setStatus] = useState<"draft" | "submitting" | "submitted" | "failed" | "duplicate">("draft")
  const before = useRef<null | { person: typeof state.person; age: typeof state.age; paymentKyc: typeof state.paymentKyc; stamps: number; meetup: typeof state.reputation.meetup }>(null)
  const venue = VENUE_NAMES[venueId]?.[locale] ?? venueId
  const gatesReady = state.account === "ACC-ACTIVE" && state.person === "PER-VERIFIED"

  function submit() {
    if (!gatesReady) {
      actions.beginAction({ cta: "SUBMIT_LOCAL_SIGNAL", gates: ["account", "person"], venueId })
      return
    }
    before.current = { person: state.person, age: state.age, paymentKyc: state.paymentKyc, stamps: state.stamps, meetup: state.reputation.meetup }
    setStatus("submitting")
    if (photo) setPhoto(withUploadState(photo, "UPL-SENDING"))
    window.setTimeout(() => {
      const shouldFail = new URLSearchParams(window.location.search).get("scenario") === "local-signal-fail"
      if (shouldFail) {
        setStatus("failed")
        if (photo) setPhoto((current) => current ? withUploadState(current, "UPL-FAILED") : null)
        return
      }
      const evidenceRef = `local-signal:${venueId}:2026-08-19`
      const events = firstMissionEvents({ subjectRef: "account:fixture", evidenceRef, occurredAt: "2026-08-19T20:00:00+09:00" })
      const duplicate = events.every((event) => state.acceptedActivityEventKeys.includes(activityIdempotencyKey(event)))
      actions.recordActivityEvents(events)
      setStatus(duplicate ? "duplicate" : "submitted")
      if (photo) setPhoto((current) => current ? withUploadState(current, "UPL-SENT") : null)
    }, 520)
  }

  const invariantsHold = before.current == null || (
    before.current.person === state.person
      && before.current.age === state.age
      && before.current.paymentKyc === state.paymentKyc
      && before.current.stamps === state.stamps
      && before.current.meetup === state.reputation.meetup
  )

  return (
    <Sheet label={locale === "ko" ? "방문 신호 남기기" : "Share a visit signal"} onClose={() => actions.setSurface({ kind: "venue", venueId })} size="full">
      <div className={styles.sheetBody} data-signal-status={status} data-signal-invariants={invariantsHold ? "preserved" : "changed"}>
        <p className={styles.eyebrow}>{locale === "ko" ? "현장의 최신 한마디" : "A fresh note from here"}</p>
        <h2>{locale === "ko" ? "방문 신호 남기기" : "Share a visit signal"}</h2>
        <p className={styles.lead}>{venue}</p>
        <InlineNotice tone="neutral"><ShieldCheck size={18} /><span>{locale === "ko" ? "최근 방문과 도움이 될 식음료 정보를 남겨주세요. 신원 등급, 19+, 결제 KYC, Meetup과 스탬프는 바뀌지 않아요." : "Share a recent visit and useful food information. Identity, 19+, Payment KYC, Meetup, and stamps do not change."}</span></InlineNotice>
        <label className={styles.fieldLabel} htmlFor={`signal-note-${venueId}`}>{locale === "ko" ? "도움이 될 정보 · 선택 사항" : "Helpful note · Optional"}</label>
        <textarea id={`signal-note-${venueId}`} value={note} onChange={(event) => setNote(event.target.value)} placeholder={locale === "ko" ? "메뉴, 주문 방법, 이용 팁을 남겨주세요." : "Share a menu, ordering, or access tip."} />
        <LocalPhotoPicker locale={locale} purpose="local_signal" value={photo} onChange={setPhoto} disabled={status === "submitting"} />
        {status === "failed" ? <InlineNotice tone="danger"><AlertTriangle size={18} /><span>{locale === "ko" ? "신호를 남기지 못했어요. 초안은 유지됐어요." : "The signal could not be submitted. Your draft was kept."}</span></InlineNotice> : null}
        {status === "submitted" ? <InlineNotice tone="success"><Check size={18} /><span>{locale === "ko" ? "방문 신호를 남겼어요. Visit과 Contribution 이력만 업데이트됐어요." : "Visit signal recorded. Only Visit and Contribution histories were updated."}</span></InlineNotice> : null}
        {status === "duplicate" ? <InlineNotice tone="warm"><AlertTriangle size={18} /><span>{locale === "ko" ? "이미 반영된 방문이에요. 활동 이력은 다시 늘어나지 않아요." : "This visit was already recorded. Activity history did not increase again."}</span></InlineNotice> : null}
        {status === "submitted" || status === "duplicate" ? <button type="button" className={styles.primary} onClick={() => actions.setSurface({ kind: "venue", venueId })}>{locale === "ko" ? "장소로 돌아가기" : "Return to venue"}</button> : <button type="button" className={styles.primary} onClick={submit} disabled={status === "submitting"}>{status === "submitting" ? locale === "ko" ? "신호를 남기는 중" : "Submitting signal" : status === "failed" ? locale === "ko" ? "다시 시도" : "Try again" : locale === "ko" ? "신호 남기기" : "Submit signal"}</button>}
        <button type="button" className={styles.secondary} onClick={() => actions.setSurface({ kind: "venue", venueId })}>{locale === "ko" ? "작성 취소" : "Cancel draft"}</button>
      </div>
    </Sheet>
  )
}
