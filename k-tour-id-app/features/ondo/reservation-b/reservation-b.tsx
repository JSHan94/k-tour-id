"use client"

import { CalendarDays, Check, ChevronRight, Clock3, FlaskConical, MapPin, RotateCcw, UsersRound, Utensils } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { B_TABLE_ACTIVITY_CLEAR_EVENT } from "../connect/table-activity-b"
import { requestPlaceServiceReturnB, resolveCommercePlaceB } from "../commerce-b/place-service-registry-b"
import { useOndoB } from "../shared/state/ondo-b-provider"
import { SheetB } from "../shared/ui/sheet-b"
import { useReviewSampleSession } from "../shared/ui/use-qa-controls"
import { RESERVATION_COPY_B } from "./reservation-copy-b"
import { initialReservationB, OPEN_RESERVATION_SAMPLE_EVENT, reduceReservationB, RESERVATION_CITIES, RESERVATION_SAMPLE_CHANGE_EVENT, RESERVATION_SAMPLE_KEY, reservationSampleDatesB, restoreReservationB, type ReservationActionB, type ReservationOutcomeB } from "./reservation-model-b"
import styles from "./reservation-b.module.css"

export function ReservationSampleB() {
  return useReviewSampleSession() ? <EnabledReservationSampleB /> : null
}
function EnabledReservationSampleB() {
  const { state, actions } = useOndoB()
  const t = RESERVATION_COPY_B[state.locale]
  const [view, setView] = useState(initialReservationB)
  const current = useRef(view)
  const [open, setOpen] = useState(false)
  const [outcome, setOutcome] = useState<ReservationOutcomeB>("success")
  const [cancelOutcome, setCancelOutcome] = useState<"success" | "failure" | "unknown">("success")
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const [blockedPlaceId, setBlockedPlaceId] = useState<string | null>(null)
  const returningToPlace = useRef(false)
  const pendingResult = useRef<ReservationActionB | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())
  useEffect(() => {
    // Async results replace the clicked footer. Keep keyboard ownership in
    // this task when that removed button would otherwise leave focus on body.
    if (open && document.activeElement === document.body) headingRef.current?.focus({ preventScroll: true })
  }, [open, view.phase])
  function commit(action: ReservationActionB) {
    const next = reduceReservationB(current.current, action)
    if (next === current.current) return false
    try {
      const serialized = JSON.stringify(next)
      sessionStorage.setItem(RESERVATION_SAMPLE_KEY, serialized)
      if (sessionStorage.getItem(RESERVATION_SAMPLE_KEY) !== serialized) throw new Error("readback")
    } catch { setStorageError(true); return false }
    current.current = next; setView(next); setStorageError(false)
    window.dispatchEvent(new Event(RESERVATION_SAMPLE_CHANGE_EVENT))
    return true
  }
  function openPlace(venueId: string) {
    if (!resolveCommercePlaceB(venueId)?.reservation) return false
    if (current.current.draft.venueId !== venueId) {
      if (!commit({ type: "select_place", venueId })) { setBlockedPlaceId(venueId); return false }
      // A previous venue's in-flight work is now an unknown history record;
      // it must not settle into the newly opened venue.
      for (const timer of timers.current) clearTimeout(timer)
      timers.current.clear(); pendingResult.current = null
      setOutcome("success"); setCancelOutcome("success")
    }
    setBlockedPlaceId(null)
    return true
  }
  useEffect(() => {
    try {
      const restored = restoreReservationB(JSON.parse(sessionStorage.getItem(RESERVATION_SAMPLE_KEY) ?? "null"))
      if (restored) { current.current = restored; setView(restored) }
    } catch { /* No sample authority is recovered from invalid storage. */ }
    const show = (event: Event) => {
      const { city, venueId } = (event as CustomEvent).detail ?? {}
      if (venueId !== undefined) {
        if (!resolveCommercePlaceB(venueId)?.reservation) return
        openPlace(venueId)
      } else {
        setBlockedPlaceId(null)
        if (RESERVATION_CITIES.includes(city) && !current.current.draft.venueId && current.current.phase === "draft") commit({ type: "edit", draft: { ...current.current.draft, city } })
      }
      returningToPlace.current = false; setConfirmCancel(false)
      setOpen(true)
    }
    const clear = () => {
      for (const timer of timers.current) clearTimeout(timer)
      timers.current.clear()
      const next = initialReservationB(); current.current = next; setView(next); setOpen(false); setConfirmCancel(false); setStorageError(false); setBlockedPlaceId(null); pendingResult.current = null
    }
    window.addEventListener(OPEN_RESERVATION_SAMPLE_EVENT, show)
    window.addEventListener(B_TABLE_ACTIVITY_CLEAR_EVENT, clear)
    return () => {
      window.removeEventListener(OPEN_RESERVATION_SAMPLE_EVENT, show)
      window.removeEventListener(B_TABLE_ACTIVITY_CLEAR_EVENT, clear)
      for (const timer of timers.current) clearTimeout(timer)
    }
  }, [])
  function settle(action: ReservationActionB) {
    const timer = setTimeout(() => {
      timers.current.delete(timer)
      if ((action.type !== "resolve" && action.type !== "resolve_cancel") || action.operationId !== current.current.operationId) return
      if (!commit(action) && ["requesting", "cancelling"].includes(current.current.phase)) pendingResult.current = action
    }, 650)
    timers.current.add(timer)
  }
  function retryResultStorage() {
    const action = pendingResult.current
    if (action && commit(action)) pendingResult.current = null
  }
  function submit(retry = false) {
    const operationId = `sample-booking-${crypto.randomUUID()}`
    if (commit({ type: "submit", operationId })) settle({ type: "resolve", operationId, outcome: retry ? "success" : outcome })
  }
  function cancel(retry = false) {
    const operationId = current.current.operationId
    if (operationId && commit({ type: "cancel" })) { setConfirmCancel(false); settle({ type: "resolve_cancel", operationId, outcome: retry ? "success" : cancelOutcome }) }
  }
  function query() {
    const { operationId, phase } = current.current
    if (operationId && commit({ type: "query" })) settle(phase === "unknown" ? { type: "resolve", operationId, outcome: "success" } : { type: "resolve_cancel", operationId, outcome: "success" })
  }
  const close = () => { setConfirmCancel(false); setOpen(false) }
  const returnToPlace = () => {
    const venueId = blockedPlaceId ?? current.current.draft.venueId
    if (!venueId || !resolveCommercePlaceB(venueId)) return
    returningToPlace.current = true
    close()
    actions.setTab("ondo")
    window.requestAnimationFrame(() => requestPlaceServiceReturnB(venueId, "reservation"))
  }
  if (!open) return null
  if (blockedPlaceId) return <SheetB locale={state.locale} label={t.title} variant="full-task" onClose={close} shouldRestoreFocus={() => !returningToPlace.current}>
    <div className={styles.body} data-testid="reservation-open-error" data-venue-id={blockedPlaceId}>
      <h2>{resolveCommercePlaceB(blockedPlaceId)?.name[state.locale]}</h2><p role="alert">{t.switchStorage}</p>
      <button type="button" onClick={() => openPlace(blockedPlaceId)}>{t.retryStorage}</button><button type="button" onClick={returnToPlace}>{t.returnPlace}</button>
    </div>
  </SheetB>
  const editable = ["draft", "full", "failed", "cancelled"].includes(view.phase)
  const busy = view.phase === "requesting" || view.phase === "cancelling"
  const dateLabel = (date: string) => new Intl.DateTimeFormat(state.locale, { weekday: "short", month: "short", day: "numeric", timeZone: "Asia/Seoul" }).format(new Date(`${date}T12:00:00+09:00`))
  const phaseNote = `${view.phase}Note` as keyof typeof t
  const venueName = view.draft.venueName?.[state.locale] ?? t.venue
  return <SheetB locale={state.locale} label={t.title} variant="full-task" header={<span>{t.title}</span>} onClose={close} shouldRestoreFocus={() => !returningToPlace.current} initialFocusSelector="[data-reservation-heading]" footer={<div className={styles.footer}>
    {storageError && pendingResult.current ? <button type="button" className={styles.primary} data-testid="reservation-storage-retry" onClick={retryResultStorage}><RotateCcw size={18} />{t.retryStorage}</button>
      : confirmCancel ? <><strong>{t.confirmCancel}<br />{venueName} · {dateLabel(view.draft.date)} · {view.draft.time} KST · {view.draft.party}</strong><div className={styles.two}><button type="button" className={styles.secondary} onClick={() => setConfirmCancel(false)}>{t.keep}</button><button type="button" className={styles.primary} data-testid="reservation-confirm-cancel" onClick={() => cancel()}>{t.cancel}</button></div></>
      : view.phase === "unknown" || view.phase === "cancel_unknown" ? <button type="button" className={styles.primary} onClick={query} data-testid="reservation-query"><RotateCcw size={18} />{t.query}</button>
      : view.phase === "cancel_failed" ? <button type="button" className={styles.primary} onClick={() => cancel(true)}>{t.retryCancel}</button>
      : view.phase === "confirmed" ? <><button type="button" className={styles.primary} onClick={view.draft.venueId ? returnToPlace : close} data-testid={view.draft.venueId ? "reservation-return-place" : undefined}>{view.draft.venueId ? t.returnPlace : t.done}<Check size={18} /></button><button type="button" className={styles.secondary} onClick={() => setConfirmCancel(true)} data-testid="reservation-cancel">{t.cancel}</button></>
      : view.phase === "cancelled" ? <button type="button" className={styles.primary} onClick={() => commit({ type: "edit", draft: { ...view.draft, date: reservationSampleDatesB()[0] } })}>{t.newBooking}</button>
      : <button type="button" className={styles.primary} disabled={busy} onClick={() => submit(view.phase === "failed")} data-testid="reservation-submit">{busy ? t[view.phase as "requesting" | "cancelling"] : view.phase === "failed" ? t.retry : t.request}{!busy && <ChevronRight size={18} />}</button>}
    {view.draft.venueId && view.phase !== "confirmed" && !confirmCancel ? <button type="button" className={styles.secondary} onClick={returnToPlace} data-testid="reservation-return-place">{t.returnPlace}</button> : null}
  </div>}>
    <div className={styles.body} data-testid="reservation-sample" data-phase={view.phase} data-operation-id={view.operationId ?? ""} data-venue-id={view.draft.venueId ?? ""}>
      <div className={styles.sample}><FlaskConical size={15} aria-hidden="true" />{t.sample}</div>
      <div className={styles.hero}>
        <span className={styles.glyph} aria-hidden="true">{view.phase === "confirmed" || view.phase === "cancelled" ? <Check /> : busy || view.phase.includes("unknown") ? <Clock3 /> : <Utensils />}</span>
        <h2 ref={headingRef} tabIndex={-1} data-reservation-heading>{view.phase === "draft" ? venueName : t[view.phase]}</h2>
        {view.draft.venueId && view.phase !== "draft" ? <strong data-testid="reservation-venue-name">{venueName}</strong> : null}
        <p role="status">{view.phase === "draft" || busy ? t.boundary : t[phaseNote] ?? t.boundary}</p>
      </div>
      {editable && view.phase !== "cancelled" ? <div className={styles.fields}>
        {view.draft.venueId ? <p className={styles.placeContext} data-testid="reservation-place-context"><MapPin size={16} />{t[view.draft.city]} · {venueName}</p> : <fieldset><legend><MapPin size={16} />{t.city}</legend><div className={styles.choices}>{RESERVATION_CITIES.map(city => <button key={city} type="button" aria-pressed={view.draft.city === city} onClick={() => commit({ type: "edit", draft: { ...view.draft, city } })}>{t[city]}</button>)}</div></fieldset>}
        <label><span><CalendarDays size={16} />{t.date}</span><select aria-label={t.date} value={view.draft.date} onChange={e => commit({ type: "edit", draft: { ...view.draft, date: e.target.value } })}>{Array.from(new Set([view.draft.date, ...reservationSampleDatesB()])).map(date => <option key={date} value={date}>{dateLabel(date)}</option>)}</select></label>
        <div className={styles.two}><label><span><Clock3 size={16} />{t.time}</span><select aria-label={t.time} value={view.draft.time} onChange={e => commit({ type: "edit", draft: { ...view.draft, time: e.target.value } })}>{["18:00", "18:30", "19:00"].map(time => <option key={time}>{time}</option>)}</select></label><label><span><UsersRound size={16} />{t.party}</span><select aria-label={t.party} value={view.draft.party} onChange={e => commit({ type: "edit", draft: { ...view.draft, party: Number(e.target.value) } })}>{[1, 2, 3, 4].map(party => <option key={party}>{party}</option>)}</select></label></div>
      </div> : <div className={styles.ticket} data-testid="reservation-receipt" data-venue-id={view.draft.venueId ?? ""}><strong><MapPin size={17} />{t[view.draft.city]} · {venueName}</strong><span><CalendarDays size={17} />{dateLabel(view.draft.date)}</span><span><Clock3 size={17} />{view.draft.time} KST <UsersRound size={17} />{view.draft.party}</span>{view.confirmationRef && <code>{view.confirmationRef}</code>}</div>}
      <section className={styles.conditions} data-testid="reservation-conditions" aria-label={t.conditions}><h3>{t.conditions}</h3><p>{t.noAccount}</p><p>{t.free}</p><p>{t.cancellationPolicy}</p></section>
      {storageError && <p className={styles.error} data-testid="reservation-storage-error" role="alert">{pendingResult.current ? t.resultStorage : t.storage}</p>}
      {!busy && <details className={styles.details}><summary>{t.alternate}</summary>{editable ? <label>{t.sample}<select value={outcome} onChange={e => setOutcome(e.target.value as ReservationOutcomeB)} data-testid="reservation-outcome"><option value="success">{t.success}</option><option value="full">{t.responseFull}</option><option value="failure">{t.failure}</option><option value="unknown">{t.responseUnknown}</option></select></label> : view.phase === "confirmed" ? <label>{t.cancelResponse}<select value={cancelOutcome} onChange={e => setCancelOutcome(e.target.value as typeof cancelOutcome)} data-testid="reservation-cancel-outcome"><option value="success">{t.cancelSuccess}</option><option value="failure">{t.cancelFailure}</option><option value="unknown">{t.responseUnknown}</option></select></label> : null}<p>{t.noAccount}</p></details>}
    </div>
  </SheetB>
}
