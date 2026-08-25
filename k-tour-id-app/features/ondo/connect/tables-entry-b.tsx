"use client"

import type { ChangeEvent, KeyboardEvent } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { AlertTriangle, ArrowLeft, CalendarClock, Camera, Check, ChevronRight, CircleDollarSign, Flag, ImagePlus, Languages, MapPin, MessageCircle, RotateCcw, Send, ShieldCheck, Star, UserRoundX, UsersRound, Utensils, X } from "lucide-react"
import { canonicalMapVenueById } from "@/lib/ondo/venues/map-data"
import { venueDistrictLabel, venueNamePresentation } from "@/lib/ondo/venues/display"
import { After19JitB } from "../after19/after19-jit-b"
import type { BReturnToEnvelope } from "../contracts/return-to-b"
import { createBReturnTo } from "../contracts/return-to-b"
import { useOndoB } from "../shared/state/ondo-b-provider"
import { focusFirstAvailableDestination } from "../shared/ui/focus-destination"
import { useModalIsolation } from "../shared/ui/use-modal-isolation"
import styles from "./pulse-table-b.module.css"

export const TABLE_VENUE_ID = "mois-0021cd596bc5b2a922ad"
export const ACTIVE_TABLE_ID = "table-seoul-night-bites"
export const ONDO_OPEN_TABLE_EVENT = "ondo:b:open-table"

type JoinStage = "idle" | "confirm" | "joined" | "chat"
type MessageState = "ready" | "failed"
type ChatMessage = { id: number; text: string; imageUrl: string | null; state: MessageState }

const FOCUSABLE = "button:not([disabled]),[href],input:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])"

const COPY = {
  en: {
    eyebrow: "Upcoming in Seoul",
    title: "Pulse Tables",
    intro: "Small plans anchored to a real place, with the details you need before choosing a seat.",
    truth: "Your activity stays in this tab. Nothing is booked, sent to the venue, or charged.",
    official: "Place record",
    officialBoundary: "An official Korean restaurant licence record confirms the place. The host provides the gathering details.",
    timeLabel: "When",
    time: "Fri, Aug 28 · 20:30 KST",
    menuLabel: "Food plan",
    menu: "Share two savoury plates; order together",
    languageLabel: "Languages",
    language: "Korean + English",
    costLabel: "Expected share",
    cost: "About ₩18,000 each",
    participantsLabel: "Seats",
    participants: "3 joined · 1 left",
    meetingLabel: "Meet",
    meeting: "By the main entrance at 20:20",
    open: "View Table",
    close: "Close Table",
    ageNotice: "19+ Table · eligibility is checked only when you choose to join.",
    draftLabel: "Note for the host",
    draftHint: "Language, seating, or food preference (optional)",
    join: "Join this Table",
    confirmTitle: "Your seat is ready",
    returnTitle: "Your Table, place, and note are unchanged.",
    confirm: "Confirm my seat",
    joinedTitle: "You’re in",
    joinedBody: "The plan is now saved in My Korea on this device.",
    openChat: "Open Table chat",
    chatTitle: "Table chat",
    chatBoundary: "Use this space for the meetup. Messages and photos remain in this tab.",
    compose: "Message the Table",
    attach: "Add photo",
    replacePhoto: "Replace photo",
    removePhoto: "Remove attached photo",
    send: "Send",
    sendFailed: "Message could not be added.",
    retry: "Retry",
    checkIn: "Check in at the meetup",
    checkedIn: "Checked in · 20:20",
    feedbackTitle: "How was the Table?",
    helpful: "Helpful table",
    welcoming: "Welcoming host",
    feedback: "Save feedback",
    feedbackSaved: "Feedback saved",
    meetup: "Meetup",
    contribution: "Contribution",
    meetupValue: "Checked in",
    contributionValue: "Helpful note shared",
    report: "Report",
    reportTitle: "Report this message?",
    reportConfirm: "Report message",
    reportDone: "Report recorded in this tab.",
    block: "Block",
    blocked: "Participant hidden in this tab.",
    leave: "Leave",
    leaveTitle: "Leave this Table?",
    leaveConfirm: "Leave Table",
    keep: "Keep my seat",
    tableOpen: "1 seat left",
  },
  ko: {
    eyebrow: "서울의 다음 모임",
    title: "펄스 테이블",
    intro: "실제 장소에 연결된 작은 약속을 보고, 참여에 필요한 정보를 한눈에 확인하세요.",
    truth: "활동은 이 탭에만 남아요. 예약·장소 전송·결제는 일어나지 않습니다.",
    official: "장소 기록",
    officialBoundary: "한국의 공식 음식점 인허가 기록으로 장소를 확인하며, 모임 정보는 호스트가 제공합니다.",
    timeLabel: "시간",
    time: "8월 28일 금요일 · 20:30 KST",
    menuLabel: "음식 계획",
    menu: "짭짤한 요리 두 가지를 함께 주문해 나눠요",
    languageLabel: "언어",
    language: "한국어 + 영어",
    costLabel: "예상 분담",
    cost: "1인 약 18,000원",
    participantsLabel: "좌석",
    participants: "3명 참여 · 1자리 남음",
    meetingLabel: "만남",
    meeting: "20:20 정문 앞",
    open: "테이블 보기",
    close: "테이블 닫기",
    ageNotice: "19+ 테이블 · 참여할 때만 자격을 확인해요.",
    draftLabel: "호스트에게 남길 메모",
    draftHint: "언어·좌석·음식 선호 (선택)",
    join: "이 테이블 참여",
    confirmTitle: "좌석이 준비됐어요",
    returnTitle: "테이블·장소·메모가 그대로 유지됐어요.",
    confirm: "내 좌석 확정",
    joinedTitle: "참여했어요",
    joinedBody: "이 기기의 My Korea에 계획을 저장했어요.",
    openChat: "테이블 채팅 열기",
    chatTitle: "테이블 채팅",
    chatBoundary: "모임을 위해 이용하세요. 메시지와 사진은 이 탭에만 남아요.",
    compose: "테이블에 메시지",
    attach: "사진 추가",
    replacePhoto: "사진 교체",
    removePhoto: "첨부 사진 삭제",
    send: "보내기",
    sendFailed: "메시지를 추가하지 못했어요.",
    retry: "다시 시도",
    checkIn: "모임 체크인",
    checkedIn: "체크인 · 20:20",
    feedbackTitle: "테이블은 어땠나요?",
    helpful: "도움이 된 테이블",
    welcoming: "친절한 호스트",
    feedback: "피드백 저장",
    feedbackSaved: "피드백 저장됨",
    meetup: "만남",
    contribution: "기여",
    meetupValue: "체크인 완료",
    contributionValue: "도움이 된 메모 공유",
    report: "신고",
    reportTitle: "이 메시지를 신고할까요?",
    reportConfirm: "메시지 신고",
    reportDone: "이 탭에 신고를 기록했어요.",
    block: "차단",
    blocked: "이 탭에서 참여자를 숨겼어요.",
    leave: "나가기",
    leaveTitle: "이 테이블에서 나갈까요?",
    leaveConfirm: "테이블 나가기",
    keep: "좌석 유지",
    tableOpen: "1자리 남음",
  },
} as const

export function PulseTablesEntryB() {
  const { state, actions } = useOndoB()
  const locale = state.locale
  const t = locale === "ko" ? COPY.ko : COPY.en
  const venue = canonicalMapVenueById(TABLE_VENUE_ID)
  const [selected, setSelected] = useState(false)
  const [draft, setDraft] = useState("")
  const [returnTo, setReturnTo] = useState<BReturnToEnvelope | null>(null)
  const [gateOpen, setGateOpen] = useState(false)
  const [joinStage, setJoinStage] = useState<JoinStage>("idle")
  const [reportOpen, setReportOpen] = useState(false)
  const [reported, setReported] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [compose, setCompose] = useState("")
  const [chatImage, setChatImage] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [failedOnce, setFailedOnce] = useState(false)
  const [checkedIn, setCheckedIn] = useState(false)
  const [feedback, setFeedback] = useState<"helpful" | "welcoming" | null>(null)
  const [feedbackSaved, setFeedbackSaved] = useState(false)
  const layerRef = useRef<HTMLDivElement | null>(null)
  const detailRef = useRef<HTMLElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const openerRef = useRef<HTMLButtonElement | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)

  useModalIsolation(selected, layerRef)

  const venuePresentation = useMemo(() => venue ? venueNamePresentation(venue.name.ko, locale) : null, [locale, venue])
  const district = venue ? venueDistrictLabel(venue.cityId, venue.districtId, locale) : ""

  useEffect(() => {
    function openFromPlace(event?: Event) {
      const detail = event instanceof CustomEvent ? event.detail as { tableId?: string; venueId?: string; mode?: string } : null
      const pending = window.__ONDO_B_TABLE_INTENT__
      if (detail && (detail.tableId !== ACTIVE_TABLE_ID || detail.venueId !== TABLE_VENUE_ID)) return
      if (!detail && !pending) return
      window.__ONDO_B_TABLE_INTENT__ = undefined
      setSelected(true)
    }
    openFromPlace()
    window.addEventListener(ONDO_OPEN_TABLE_EVENT, openFromPlace)
    return () => window.removeEventListener(ONDO_OPEN_TABLE_EVENT, openFromPlace)
  }, [])

  useEffect(() => {
    if (!selected) return
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }))
    return () => window.cancelAnimationFrame(frame)
  }, [selected])

  if (!venue || !venuePresentation) return <section className={styles.entry} data-testid="tables-entry" role="alert">Official venue record unavailable.</section>

  function openActiveTable() { setSelected(true) }

  function closeTable() {
    setGateOpen(false)
    setReturnTo(null)
    setSelected(false)
    window.requestAnimationFrame(() => openerRef.current?.focus({ preventScroll: true }))
  }

  function beginJoin() {
    const envelope = createBReturnTo({ tableId: ACTIVE_TABLE_ID, venueId: TABLE_VENUE_ID, draft })
    setReturnTo(envelope)
    setGateOpen(true)
  }

  function cancelGate() { setGateOpen(false); setReturnTo(null) }

  function completeGate(consumed: BReturnToEnvelope) {
    setReturnTo(consumed)
    setGateOpen(false)
    setJoinStage("confirm")
  }

  function confirmJoin() {
    const recorded = actions.recordPlannedTable(ACTIVE_TABLE_ID, TABLE_VENUE_ID)
    if (!recorded) actions.notify(locale === "ko" ? "좌석은 열렸지만 My Korea에 저장하지 못했어요." : "Your seat opened, but My Korea could not save it on this device.")
    setJoinStage("joined")
    focusFirstAvailableDestination(["[data-testid='table-open-chat']"])
  }

  function confirmLeave() {
    const removed = actions.removePlannedTable(ACTIVE_TABLE_ID)
    if (!removed) actions.notify(locale === "ko" ? "테이블에서는 나갔지만 My Korea 계획을 지우지 못했어요." : "You left the Table, but My Korea could not remove the plan.")
    setJoinStage("idle"); setReturnTo(null); setReportOpen(false); setReported(false); setBlocked(false); setLeaveOpen(false)
    setMessages([]); setCheckedIn(false); setFeedback(null); setFeedbackSaved(false)
    focusFirstAvailableDestination(["[data-testid='table-detail'] [data-testid='table-join']"])
  }

  function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setChatImage(URL.createObjectURL(file))
    event.target.value = ""
  }

  function removeChatImage() { setChatImage(null) }

  function sendMessage() {
    if (!compose.trim() && !chatImage) return
    const shouldFail = window.__ONDO_B_QA__?.tableMessage === "failure" && !failedOnce
    setMessages((current) => [...current, { id: Date.now(), text: compose.trim(), imageUrl: chatImage, state: shouldFail ? "failed" : "ready" }])
    setCompose(""); setChatImage(null)
    if (shouldFail) setFailedOnce(true)
  }

  function retryMessage(id: number) {
    setMessages((current) => current.map((message) => message.id === id ? { ...message, state: "ready" } : message))
  }

  function handleDetailKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (gateOpen) return
    if (event.key === "Escape") { event.preventDefault(); closeTable(); return }
    if (event.key !== "Tab") return
    const focusable = Array.from(detailRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter((element) => element.offsetParent !== null && !element.closest("[inert],[aria-hidden='true']"))
    const first = focusable[0]
    const last = focusable.at(-1)
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }

  return (
    <section className={styles.entry} data-testid="tables-entry">
      <header className={styles.entryHeader}>
        <p>{t.eyebrow}</p><h1>{t.title}</h1><span>{t.intro}</span>
        <small className={styles.prototypeTruth}>{t.truth}</small>
      </header>

      <div className={styles.cards}>
        <article className={styles.cardActive} data-testid={`table-card-${ACTIVE_TABLE_ID}`} data-table-state="TABLE-OPEN">
          <div className={styles.cardTop}><span>{t.tableOpen}</span><ShieldCheck size={18} aria-hidden="true" /></div>
          <h2>{locale === "ko" ? "야식 한 상, 함께 앉는 테이블" : "Night bites, one shared table"}</h2>
          <p>{locale === "ko" ? "강남에서 가볍게 나누는 금요일 저녁" : "A relaxed Friday meal in Gangnam"}</p>
          <OfficialVenue venueName={venuePresentation.officialName} district={district} copy={t} />
          <PlanFields copy={t} />
          <button ref={openerRef} type="button" className={styles.openButton} data-testid={`table-open-${ACTIVE_TABLE_ID}`} onClick={openActiveTable}>{t.open}<ChevronRight size={17} aria-hidden="true" /></button>
        </article>
      </div>

      {selected ? (
        <div ref={layerRef} className={styles.layer} role="dialog" aria-modal="true" aria-labelledby="table-b-title" data-testid="table-detail" data-table-id={ACTIVE_TABLE_ID} data-venue-id={TABLE_VENUE_ID}>
          <button type="button" className={styles.backdrop} tabIndex={-1} aria-label={t.close} onClick={closeTable} />
          <article ref={detailRef} className={styles.detail} onKeyDown={handleDetailKeyDown}>
            <header className={styles.detailHeader}>
              <button ref={closeRef} type="button" onClick={closeTable} aria-label={t.close}><ArrowLeft size={18} aria-hidden="true" /></button>
              <span>Pulse Table</span>
              <button type="button" onClick={closeTable} aria-label={t.close}><X size={18} aria-hidden="true" /></button>
            </header>
            <div className={styles.detailBody}>
              <p className={styles.detailEyebrow}>{district} · {t.tableOpen}</p>
              <h2 id="table-b-title">{locale === "ko" ? "야식 한 상, 함께 앉는 테이블" : "Night bites, one shared table"}</h2>
              <OfficialVenue venueName={venuePresentation.officialName} district={district} copy={t} />
              <PlanFields copy={t} />
              <aside className={styles.ageNotice}><ShieldCheck size={18} aria-hidden="true" /><span>{t.ageNotice}</span></aside>

              {joinStage === "idle" ? <section className={styles.joinPanel}>
                <label htmlFor="table-join-draft">{t.draftLabel}</label>
                <textarea id="table-join-draft" data-testid="table-join-draft" maxLength={280} value={draft} placeholder={t.draftHint} onChange={(event) => setDraft(event.target.value)} />
                <button type="button" className={styles.primary} data-testid="table-join" onClick={beginJoin}>{t.join}</button>
              </section> : null}

              {joinStage === "confirm" && returnTo ? <section className={styles.confirmation} data-testid="table-join-confirmation" data-return-table={returnTo.tableId} data-return-venue={returnTo.venueId}>
                <Check size={24} aria-hidden="true" /><h3>{t.confirmTitle}</h3><p>{t.returnTitle}</p>
                {returnTo.draft ? <blockquote data-testid="after19-return">{returnTo.draft}</blockquote> : null}
                <button type="button" className={styles.primary} data-testid="table-join-confirm" onClick={confirmJoin}>{t.confirm}</button>
              </section> : null}

              {joinStage === "joined" ? <section className={styles.joined}>
                <UsersRound size={25} aria-hidden="true" /><h3>{t.joinedTitle}</h3><p>{t.joinedBody}</p>
                <button type="button" className={styles.primary} data-testid="table-open-chat" onClick={() => setJoinStage("chat")}><MessageCircle size={17} aria-hidden="true" />{t.openChat}</button>
              </section> : null}

              {joinStage === "chat" ? <section className={styles.chat} data-testid="table-chat">
                <header><span><UsersRound size={18} aria-hidden="true" />{t.chatTitle}</span><small>4</small></header>
                <p className={styles.chatBoundary}>{t.chatBoundary}</p>
                <div className={styles.messages} aria-live="polite">
                  <p><strong>Min</strong><span>{locale === "ko" ? "20:20에 입구 옆에서 만나요." : "Let’s meet by the entrance at 20:20."}</span></p>
                  {!blocked ? <p><strong>Jae</strong><span>{locale === "ko" ? "저는 영어와 한국어 모두 괜찮아요." : "English or Korean both work for me."}</span></p> : null}
                  {messages.map((message) => <article key={message.id} className={styles.myMessage} data-state={message.state}>
                    <strong>{locale === "ko" ? "나" : "You"}</strong>
                    {message.imageUrl ? <img src={message.imageUrl} alt="" /> : null}
                    {message.text ? <span>{message.text}</span> : null}
                    {message.state === "failed" ? <span className={styles.messageError}>{t.sendFailed}<button type="button" data-testid="table-message-retry" onClick={() => retryMessage(message.id)}><RotateCcw size={14} aria-hidden="true" />{t.retry}</button></span> : null}
                  </article>)}
                </div>
                <div className={styles.composer}>
                  {chatImage ? <div className={styles.chatImage}><img src={chatImage} alt="" /><button type="button" onClick={removeChatImage} aria-label={t.removePhoto}><X size={15} aria-hidden="true" /></button></div> : null}
                  <label><span>{t.compose}</span><textarea data-testid="table-chat-compose" value={compose} onChange={(event) => setCompose(event.target.value)} /></label>
                  <input ref={imageInputRef} className={styles.fileInput} type="file" accept="image/jpeg,image/png,image/webp" aria-label={t.attach} data-testid="table-chat-image" onChange={chooseImage} />
                  <div><button type="button" className={styles.attachButton} onClick={() => imageInputRef.current?.click()}><ImagePlus size={17} aria-hidden="true" />{chatImage ? t.replacePhoto : t.attach}</button><button type="button" className={styles.sendButton} data-testid="table-message-send" disabled={!compose.trim() && !chatImage} onClick={sendMessage}><Send size={17} aria-hidden="true" />{t.send}</button></div>
                </div>
                <button type="button" className={checkedIn ? styles.checkedIn : styles.checkIn} data-testid="table-check-in" onClick={() => setCheckedIn(true)}><MapPin size={17} aria-hidden="true" />{checkedIn ? t.checkedIn : t.checkIn}</button>
                {checkedIn ? <section className={styles.feedback}>
                  <h3>{t.feedbackTitle}</h3><div><button type="button" aria-pressed={feedback === "helpful"} onClick={() => setFeedback("helpful")}><Star size={16} aria-hidden="true" />{t.helpful}</button><button type="button" aria-pressed={feedback === "welcoming"} onClick={() => setFeedback("welcoming")}><UsersRound size={16} aria-hidden="true" />{t.welcoming}</button></div>
                  <button type="button" className={styles.primary} data-testid="table-feedback-submit" disabled={!feedback} onClick={() => setFeedbackSaved(true)}>{t.feedback}</button>
                  {feedbackSaved ? <aside className={styles.reputationReceipt} data-testid="table-reputation-receipt"><strong>{t.feedbackSaved}</strong><dl><div><dt>{t.meetup}</dt><dd>{t.meetupValue}</dd></div><div><dt>{t.contribution}</dt><dd>{t.contributionValue}</dd></div></dl></aside> : null}
                </section> : null}
                {reported ? <p className={styles.status} role="status">{t.reportDone}</p> : null}
                {blocked ? <p className={styles.status} role="status">{t.blocked}</p> : null}
                <div className={styles.safetyActions}><button type="button" data-testid="table-report" onClick={() => setReportOpen(true)}><Flag size={16} aria-hidden="true" />{t.report}</button><button type="button" data-testid="table-block" onClick={() => setBlocked(true)}><UserRoundX size={16} aria-hidden="true" />{t.block}</button><button type="button" data-testid="table-leave" onClick={() => setLeaveOpen(true)}><X size={16} aria-hidden="true" />{t.leave}</button></div>
                {reportOpen ? <ConfirmPanel title={t.reportTitle} confirm={t.reportConfirm} cancel={t.keep} confirmTestId="table-report-confirm" onConfirm={() => { setReported(true); setReportOpen(false) }} onCancel={() => setReportOpen(false)} /> : null}
                {leaveOpen ? <ConfirmPanel title={t.leaveTitle} confirm={t.leaveConfirm} cancel={t.keep} confirmTestId="table-leave-confirm" onConfirm={confirmLeave} onCancel={() => setLeaveOpen(false)} /> : null}
              </section> : null}
            </div>
          </article>
          <After19JitB open={gateOpen} locale={locale} returnTo={returnTo} tableTitle={locale === "ko" ? "야식 한 상, 함께 앉는 테이블" : "Night bites, one shared table"} venueLabel={venuePresentation.officialName} onCancel={cancelGate} onEligible={completeGate} />
        </div>
      ) : null}
    </section>
  )
}

function OfficialVenue({ venueName, district, copy }: { venueName: string; district: string; copy: typeof COPY.en | typeof COPY.ko }) {
  return <section className={styles.official}><strong>{copy.official}</strong><p>{venueName} · {district}</p><span>{copy.officialBoundary}</span></section>
}

function PlanFields({ copy }: { copy: typeof COPY.en | typeof COPY.ko }) {
  const fields = [
    { id: "table-sample-time", icon: CalendarClock, label: copy.timeLabel, value: copy.time },
    { id: "table-sample-menu", icon: Utensils, label: copy.menuLabel, value: copy.menu },
    { id: "table-sample-language", icon: Languages, label: copy.languageLabel, value: copy.language },
    { id: "table-sample-cost", icon: CircleDollarSign, label: copy.costLabel, value: copy.cost },
    { id: "table-sample-participants", icon: UsersRound, label: copy.participantsLabel, value: copy.participants },
    { id: "table-meeting-point", icon: Camera, label: copy.meetingLabel, value: copy.meeting },
  ]
  return <section className={styles.plan}><dl>{fields.map(({ id, icon: Icon, label, value }) => <div key={id} data-testid={id}><dt><Icon size={15} aria-hidden="true" />{label}</dt><dd>{value}</dd></div>)}</dl></section>
}

function ConfirmPanel({ title, confirm, cancel, confirmTestId, onConfirm, onCancel }: { title: string; confirm: string; cancel: string; confirmTestId: string; onConfirm(): void; onCancel(): void }) {
  return <section className={styles.inlineConfirm} role="alertdialog" aria-label={title}><AlertTriangle size={18} aria-hidden="true" /><strong>{title}</strong><div><button type="button" data-testid={confirmTestId} onClick={onConfirm}>{confirm}</button><button type="button" onClick={onCancel}>{cancel}</button></div></section>
}
