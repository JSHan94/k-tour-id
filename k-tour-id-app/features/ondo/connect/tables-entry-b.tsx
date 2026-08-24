"use client"

import type { KeyboardEvent } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { AlertTriangle, ArrowLeft, Ban, CalendarClock, Check, ChevronRight, CircleDollarSign, Flag, Languages, MessageCircle, ShieldCheck, UserRoundX, UsersRound, Utensils, X } from "lucide-react"
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

type TableState = "TABLE-OPEN" | "TABLE-FULL" | "TABLE-CANCELLED" | "TABLE-ENDED"
type JoinStage = "idle" | "confirm" | "joined" | "chat"

const FOCUSABLE = "button:not([disabled]),[href],input:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])"

const TABLES: readonly { id: string; state: TableState; title: { en: string; ko: string }; note: { en: string; ko: string } }[] = [
  { id: ACTIVE_TABLE_ID, state: "TABLE-OPEN", title: { en: "Night bites, one shared table", ko: "야식 한 상, 함께 앉는 테이블" }, note: { en: "One representative Table with a local 19+ walkthrough", ko: "로컬 19+ 안내가 포함된 대표 테이블" } },
  { id: "table-seoul-full", state: "TABLE-FULL", title: { en: "Late plate swap", ko: "늦은 한 접시 교환" }, note: { en: "All 4 sample seats are filled", ko: "샘플 좌석 4석이 모두 찼습니다" } },
  { id: "table-seoul-cancelled", state: "TABLE-CANCELLED", title: { en: "Small dishes after work", ko: "퇴근 뒤 작은 접시" }, note: { en: "Organizer cancelled this example", ko: "주최자가 이 예시를 취소했습니다" } },
  { id: "table-seoul-ended", state: "TABLE-ENDED", title: { en: "Neighbourhood supper", ko: "동네 저녁 한 끼" }, note: { en: "This example has ended", ko: "이 예시는 종료되었습니다" } },
] as const

const COPY = {
  en: {
    eyebrow: "Pulse · place-based group plans",
    title: "Pulse Tables",
    intro: "See one bounded group-meal example connected to an official place record. There is no matching, open DM, live chat, or booking service.",
    official: "Official LOCALDATA venue",
    organizer: "Organizer sample · not official venue data",
    officialBoundary: "The source confirms the licensed place record only. The Table plan below is authored for this local example.",
    timeLabel: "Sample time",
    time: "Friday · 20:30 KST",
    menuLabel: "Sample food plan",
    menu: "Share two savoury plates; order at the venue",
    languageLabel: "Group language",
    language: "Korean + English",
    costLabel: "Expected split",
    cost: "About ₩18,000 each · not a quote",
    participantsLabel: "Sample participants",
    participants: "3 of 4 seats",
    open: "View Table",
    full: "Full",
    cancelled: "Cancelled",
    ended: "Ended",
    alternative: "View available Table",
    close: "Close Table",
    ageNotice: "Organizer marked this sample Table 19+. This is not an official venue restriction.",
    draftLabel: "Join note kept with this Table",
    draftHint: "Optional language, seating, or food note",
    join: "Review 19+ and join",
    confirmTitle: "Confirm your sample seat",
    returnTitle: "Returned to the same Table, place, and note",
    confirm: "Confirm join",
    joinedTitle: "Sample seat confirmed",
    joinedBody: "This changes only the current local example. Nothing was booked or sent.",
    openChat: "Open group conversation preview",
    chatTitle: "Group conversation",
    chatBoundary: "Read-only group conversation example · messages are not sent or received.",
    report: "Report participant",
    reportTitle: "Report this sample message?",
    reportConfirm: "Save report in this example",
    reportDone: "Report saved only in this example.",
    block: "Block participant",
    blocked: "Participant hidden in this example.",
    leave: "Leave Table",
    leaveTitle: "Leave this sample Table?",
    leaveConfirm: "Confirm leave",
    keep: "Keep my seat",
    tableOpen: "Open",
  },
  ko: {
    eyebrow: "펄스 · 장소 기반 그룹 계획",
    title: "펄스 테이블",
    intro: "공식 장소 기록에 연결된 제한된 그룹 식사 예시 하나를 살펴보세요. 매칭·오픈 DM·실시간 채팅·예약 서비스는 제공하지 않습니다.",
    official: "공식 LOCALDATA 장소",
    organizer: "주최자 샘플 · 공식 장소 데이터 아님",
    officialBoundary: "출처는 인허가 장소 기록만 확인합니다. 아래 테이블 계획은 로컬 예시를 위해 작성되었습니다.",
    timeLabel: "샘플 시간",
    time: "금요일 · 한국 시간 20:30",
    menuLabel: "샘플 음식 계획",
    menu: "짭짤한 요리 두 가지를 나누고 장소에서 주문",
    languageLabel: "그룹 언어",
    language: "한국어 + 영어",
    costLabel: "예상 분담",
    cost: "1인 약 18,000원 · 견적 아님",
    participantsLabel: "샘플 참여자",
    participants: "4석 중 3석",
    open: "테이블 보기",
    full: "정원 마감",
    cancelled: "취소됨",
    ended: "종료됨",
    alternative: "참여 가능한 테이블 보기",
    close: "테이블 닫기",
    ageNotice: "주최자가 이 샘플 테이블을 19+로 표시했습니다. 공식 장소의 출입 제한이 아닙니다.",
    draftLabel: "이 테이블에 유지되는 참여 메모",
    draftHint: "선택 사항: 언어·좌석·음식 메모",
    join: "19+ 확인 후 참여 검토",
    confirmTitle: "샘플 좌석 확인",
    returnTitle: "같은 테이블·장소·메모로 돌아왔습니다",
    confirm: "참여 확인",
    joinedTitle: "샘플 좌석 확인됨",
    joinedBody: "현재 로컬 예시만 변경됩니다. 예약하거나 전송한 내용은 없습니다.",
    openChat: "그룹 대화 미리보기 열기",
    chatTitle: "그룹 대화",
    chatBoundary: "읽기 전용 그룹 대화 예시 · 메시지를 보내거나 받지 않습니다.",
    report: "참여자 신고",
    reportTitle: "이 샘플 메시지를 신고할까요?",
    reportConfirm: "이 예시에 신고 저장",
    reportDone: "이 예시에만 신고를 저장했습니다.",
    block: "참여자 차단",
    blocked: "이 예시에서 참여자를 숨겼습니다.",
    leave: "테이블 나가기",
    leaveTitle: "이 샘플 테이블에서 나갈까요?",
    leaveConfirm: "나가기 확인",
    keep: "좌석 유지",
    tableOpen: "참여 가능",
  },
} as const

export function PulseTablesEntryB() {
  const { state } = useOndoB()
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
  const layerRef = useRef<HTMLDivElement | null>(null)
  const detailRef = useRef<HTMLElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const openerRef = useRef<HTMLButtonElement | null>(null)

  useModalIsolation(selected, layerRef)

  useEffect(() => {
    if (!selected) return
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }))
    return () => window.cancelAnimationFrame(frame)
  }, [selected])

  const venuePresentation = useMemo(() => venue ? venueNamePresentation(venue.name.ko, locale) : null, [locale, venue])
  const district = venue ? venueDistrictLabel(venue.cityId, venue.districtId, locale) : ""

  if (!venue || !venuePresentation) return <section className={styles.entry} data-testid="tables-entry" role="alert">Official venue record unavailable.</section>

  function openActiveTable() {
    setSelected(true)
  }

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

  function cancelGate() {
    setGateOpen(false)
    setReturnTo(null)
  }

  function completeGate(consumed: BReturnToEnvelope) {
    setReturnTo(consumed)
    setGateOpen(false)
    setJoinStage("confirm")
  }

  function confirmJoin() {
    setJoinStage("joined")
    focusFirstAvailableDestination(["[data-testid='table-open-chat']"])
  }

  function confirmLeave() {
    setJoinStage("idle")
    setReturnTo(null)
    setReportOpen(false)
    setReported(false)
    setBlocked(false)
    setLeaveOpen(false)
    focusFirstAvailableDestination(["[data-testid='table-detail'] [data-testid='table-join']"])
  }

  function handleDetailKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (gateOpen) return
    if (event.key === "Escape") {
      event.preventDefault()
      closeTable()
      return
    }
    if (event.key !== "Tab") return
    const focusable = Array.from(detailRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
      .filter((element) => element.offsetParent !== null && !element.closest("[inert],[aria-hidden='true']"))
    const first = focusable[0]
    const last = focusable.at(-1)
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }

  return (
    <section className={styles.entry} data-testid="tables-entry">
      <header className={styles.entryHeader}>
        <p>{t.eyebrow}</p>
        <h1>{t.title}</h1>
        <span>{t.intro}</span>
      </header>

      <div className={styles.cards}>
        {TABLES.map((table) => {
          const isActive = table.id === ACTIVE_TABLE_ID
          const status = table.state === "TABLE-OPEN" ? t.tableOpen : table.state === "TABLE-FULL" ? t.full : table.state === "TABLE-CANCELLED" ? t.cancelled : t.ended
          return (
            <article key={table.id} className={isActive ? styles.cardActive : styles.card} data-testid={`table-card-${table.id}`} data-table-state={table.state}>
              <div className={styles.cardTop}><span>{status}</span>{isActive ? <ShieldCheck size={18} aria-hidden="true" /> : <Ban size={17} aria-hidden="true" />}</div>
              <h2>{table.title[locale]}</h2>
              <p>{table.note[locale]}</p>
              {isActive ? (
                <>
                  <OfficialVenue venueName={venuePresentation.officialName} district={district} copy={t} />
                  <PlanFields copy={t} />
                  <button ref={openerRef} type="button" className={styles.openButton} data-testid={`table-open-${table.id}`} onClick={openActiveTable}>{t.open}<ChevronRight size={17} aria-hidden="true" /></button>
                </>
              ) : (
                <button type="button" className={styles.alternative} data-testid="table-view-alternative" onClick={openActiveTable}>{t.alternative}<ChevronRight size={16} aria-hidden="true" /></button>
              )}
            </article>
          )
        })}
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
              <p className={styles.detailEyebrow}>{district}</p>
              <h2 id="table-b-title">{TABLES[0].title[locale]}</h2>
              <OfficialVenue venueName={venuePresentation.officialName} district={district} copy={t} />
              <PlanFields copy={t} />
              <aside className={styles.ageNotice}><ShieldCheck size={18} aria-hidden="true" /><span>{t.ageNotice}</span></aside>

              {joinStage === "idle" ? (
                <section className={styles.joinPanel}>
                  <label htmlFor="table-join-draft">{t.draftLabel}</label>
                  <textarea id="table-join-draft" data-testid="table-join-draft" maxLength={280} value={draft} placeholder={t.draftHint} onChange={(event) => setDraft(event.target.value)} />
                  <button type="button" className={styles.primary} data-testid="table-join" onClick={beginJoin}>{t.join}</button>
                </section>
              ) : null}

              {joinStage === "confirm" && returnTo ? (
                <section className={styles.confirmation} data-testid="table-join-confirmation" data-return-table={returnTo.tableId} data-return-venue={returnTo.venueId}>
                  <Check size={24} aria-hidden="true" />
                  <h3>{t.confirmTitle}</h3>
                  <p>{t.returnTitle}</p>
                  <blockquote data-testid="after19-return">{returnTo.draft || "—"}</blockquote>
                  <button type="button" className={styles.primary} data-testid="table-join-confirm" onClick={confirmJoin}>{t.confirm}</button>
                </section>
              ) : null}

              {joinStage === "joined" ? (
                <section className={styles.joined}>
                  <UsersRound size={25} aria-hidden="true" />
                  <h3>{t.joinedTitle}</h3>
                  <p>{t.joinedBody}</p>
                  <button type="button" className={styles.primary} data-testid="table-open-chat" onClick={() => setJoinStage("chat")}><MessageCircle size={17} aria-hidden="true" />{t.openChat}</button>
                </section>
              ) : null}

              {joinStage === "chat" ? (
                <section className={styles.chat} data-testid="table-chat">
                  <header><span><UsersRound size={18} aria-hidden="true" />{t.chatTitle}</span><small>4</small></header>
                  <p className={styles.chatBoundary}>{t.chatBoundary}</p>
                  <div className={styles.messages}>
                    <p><strong>Min</strong><span>{locale === "ko" ? "20:20에 입구 옆에서 만나요." : "Let’s meet by the entrance at 20:20."}</span></p>
                    {!blocked ? <p><strong>Jae</strong><span>{locale === "ko" ? "저는 영어와 한국어 모두 괜찮아요." : "English or Korean both work for me."}</span></p> : null}
                  </div>
                  {reported ? <p className={styles.status} role="status">{t.reportDone}</p> : null}
                  {blocked ? <p className={styles.status} role="status">{t.blocked}</p> : null}
                  <div className={styles.safetyActions}>
                    <button type="button" data-testid="table-report" onClick={() => setReportOpen(true)}><Flag size={16} aria-hidden="true" />{t.report}</button>
                    <button type="button" data-testid="table-block" onClick={() => setBlocked(true)}><UserRoundX size={16} aria-hidden="true" />{t.block}</button>
                    <button type="button" data-testid="table-leave" onClick={() => setLeaveOpen(true)}><X size={16} aria-hidden="true" />{t.leave}</button>
                  </div>
                  {reportOpen ? <ConfirmPanel title={t.reportTitle} confirm={t.reportConfirm} cancel={t.keep} confirmTestId="table-report-confirm" onConfirm={() => { setReported(true); setReportOpen(false) }} onCancel={() => setReportOpen(false)} /> : null}
                  {leaveOpen ? <ConfirmPanel title={t.leaveTitle} confirm={t.leaveConfirm} cancel={t.keep} confirmTestId="table-leave-confirm" onConfirm={confirmLeave} onCancel={() => setLeaveOpen(false)} /> : null}
                </section>
              ) : null}
            </div>
          </article>

          <After19JitB open={gateOpen} locale={locale} returnTo={returnTo} tableTitle={TABLES[0].title[locale]} venueLabel={venuePresentation.officialName} onCancel={cancelGate} onEligible={completeGate} />
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
  ]
  return <section className={styles.plan}><h3>{copy.organizer}</h3><dl>{fields.map(({ id, icon: Icon, label, value }) => <div key={id} data-testid={id}><dt><Icon size={15} aria-hidden="true" />{label}</dt><dd>{value}</dd></div>)}</dl></section>
}

function ConfirmPanel({ title, confirm, cancel, confirmTestId, onConfirm, onCancel }: { title: string; confirm: string; cancel: string; confirmTestId: string; onConfirm(): void; onCancel(): void }) {
  return <section className={styles.inlineConfirm} role="alertdialog" aria-label={title}><AlertTriangle size={18} aria-hidden="true" /><strong>{title}</strong><div><button type="button" data-testid={confirmTestId} onClick={onConfirm}>{confirm}</button><button type="button" onClick={onCancel}>{cancel}</button></div></section>
}
