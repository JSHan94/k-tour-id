"use client"

import type { KeyboardEvent } from "react"
import { useEffect, useRef, useState } from "react"
import { ArrowLeft, Bookmark, ChevronRight, CircleHelp, CreditCard, LockKeyhole, MapPin, MessageCircle, Moon, Navigation, Users, X } from "lucide-react"
import type { CanonicalVenueDetail, CanonicalVenueDetailResponse } from "@/lib/ondo/venues/detail-contract"
import { canonicalMapVenueById } from "@/lib/ondo/venues/map-data"
import { B_DEMO_SIGNAL_BY_VENUE_ID } from "@/lib/ondo/venues/demo-signals"
import { venueDisplayName, venueDistrictLabel } from "@/lib/ondo/venues/display"
import { HEAT_COLORS, HEAT_LABELS } from "@/lib/ondo/map/heat"
import { AFTER19_VENUE_RETURN_PARAM } from "../after19/after19-venue-return"
import { useOndo } from "../shared/state/ondo-provider"
import styles from "./canonical-place.module.css"

const COPY = {
  en: {
    active: "Official place record",
    signalPending: "ONDO signal pending",
    signalPendingBody: "This is a sourced place record. No ONDO score has been calculated yet.",
    simulated: "Preview signal · Simulated",
    source: "Official place source",
    sourceBody: "MOIS LOCALDATA · Active general restaurant licence record",
    before: "Before you go",
    unknown: "Not confirmed by this source",
    hours: "Opening hours",
    card: "Foreign-issued cards",
    menu: "English menu",
    phone: "Korean phone requirement",
    details: "Place details",
    directions: "Directions",
    save: "Save",
    saved: "Saved",
    signal: "Share a visit signal",
    checkout: "Checkout simulation",
    tables: "Open Pulse Tables preview",
    close: "Close place",
    back: "Back to place summary",
    noEnglish: "Official English name unavailable · Korean source name shown",
    contributed: "Your visit signal is recorded. More local signals are needed before an ONDO score is calculated.",
    signalCount: "preview signals",
    confidence: "confidence",
    freshness: "Freshness",
    contributionIncluded: "Your session signal is recorded separately; the preview score is not recalculated.",
    after19Eyebrow: "AFTER 19 · PREVIEW",
    after19Title: "Night preview for this place",
    after19Locked: "See this place’s night preview after one current 19+ check. The official place record stays visible, and identity details never appear on the map.",
    after19Unlocked: "After 19 is on for this place. Opening hours, alcohol service, and admission are still not confirmed by the official source.",
    after19Unlock: "Confirm 19+ and return here",
    after19Ready: "After 19 preview on",
    saving: "Saving…",
    saveFailed: "This place was not saved. Your venue context is unchanged.",
    retrySave: "Retry save",
    dismissSave: "Not now",
    detailLoading: "Loading official address evidence…",
    detailUnavailable: "Official address evidence is temporarily unavailable",
  },
  ko: {
    active: "공식 장소 기록",
    signalPending: "ONDO 신호 수집 중",
    signalPendingBody: "공식 장소 기록은 확인됐지만 ONDO 점수는 아직 산출하지 않았어요.",
    simulated: "신호 프리뷰 · 시뮬레이션",
    source: "공식 장소 출처",
    sourceBody: "행정안전부 LOCALDATA · 영업 상태가 유효한 일반음식점 인허가 기록",
    before: "가기 전 확인",
    unknown: "이 출처로는 확인되지 않음",
    hours: "영업시간",
    card: "해외 발급 카드",
    menu: "영문 메뉴",
    phone: "한국 전화번호 필요 여부",
    details: "장소 상세",
    directions: "길찾기",
    save: "저장",
    saved: "저장됨",
    signal: "방문 신호 남기기",
    checkout: "결제 시뮬레이션",
    tables: "Pulse Tables 프리뷰 열기",
    close: "장소 닫기",
    back: "장소 요약으로",
    noEnglish: "공식 영문명 미제공 · 공식 한글명 표시",
    contributed: "내 방문 신호가 기록됐어요. ONDO 점수를 산출하려면 로컬 신호가 더 필요해요.",
    signalCount: "개 프리뷰 신호",
    confidence: "신뢰도",
    freshness: "최신성",
    contributionIncluded: "내 세션 신호는 별도로 기록되며 프리뷰 점수는 다시 계산하지 않아요.",
    after19Eyebrow: "AFTER 19 · 프리뷰",
    after19Title: "이 장소의 야간 프리뷰",
    after19Locked: "현재 유효한 19+ 확인 한 번으로 이 장소의 밤 프리뷰를 볼 수 있어요. 공식 장소 정보는 계속 보이며 신원 상세는 지도에 표시하지 않아요.",
    after19Unlocked: "이 장소에서 After 19가 켜졌어요. 영업시간·주류 제공·입장 가능 여부는 공식 출처로 확인되지 않았어요.",
    after19Unlock: "19+ 확인 후 이 장소로 돌아오기",
    after19Ready: "After 19 프리뷰 켜짐",
    saving: "저장 중…",
    saveFailed: "장소를 저장하지 못했어요. 선택한 장소 화면은 그대로 유지돼요.",
    retrySave: "저장 다시 시도",
    dismissSave: "나중에",
    detailLoading: "공식 주소 근거를 불러오는 중…",
    detailUnavailable: "공식 주소 근거를 잠시 불러올 수 없어요",
  },
} as const

const CATEGORY = {
  korean: { en: "Korean food", ko: "한식" },
  casual: { en: "Casual meal", ko: "간편식" },
  japanese: { en: "Japanese food", ko: "일식" },
  chinese: { en: "Chinese food", ko: "중식" },
  global: { en: "Global food", ko: "세계 음식" },
  night: { en: "Food & drink", ko: "식음료" },
  specialty: { en: "Specialty", ko: "전문점" },
} as const

const FOCUSABLE = "a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])"

export function CanonicalPlaceOverlay() {
  const { state, actions } = useOndo()
  const [expanded, setExpanded] = useState(false)
  const [detail, setDetail] = useState<CanonicalVenueDetail | null>(null)
  const [detailState, setDetailState] = useState<"idle" | "loading" | "ready" | "error">("idle")
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const detailRef = useRef<HTMLElement | null>(null)
  const openRef = useRef<HTMLButtonElement | null>(null)
  const saveAttemptRef = useRef(0)
  const saveTimerRef = useRef<number | null>(null)
  const venueId = state.surface.kind === "venue" ? state.surface.venueId : undefined
  const venue = venueId ? canonicalMapVenueById(venueId) : undefined
  const signal = venueId ? B_DEMO_SIGNAL_BY_VENUE_ID.get(venueId) : undefined
  const locale = state.locale
  const copy = COPY[locale]

  useEffect(() => {
    setExpanded(false)
    setDetail(null)
    setDetailState("idle")
    saveAttemptRef.current = 0
    if (saveTimerRef.current != null) window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = null
    if (!venueId) return
    const url = new URL(window.location.href)
    if (url.searchParams.get(AFTER19_VENUE_RETURN_PARAM) !== venueId) return
    url.searchParams.delete(AFTER19_VENUE_RETURN_PARAM)
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`)
    setExpanded(true)
  }, [venueId])
  useEffect(() => () => { if (saveTimerRef.current != null) window.clearTimeout(saveTimerRef.current) }, [])
  useEffect(() => { if (expanded) closeRef.current?.focus() }, [expanded])
  useEffect(() => {
    if (!expanded || !venueId || detail?.id === venueId) return
    const controller = new AbortController()
    setDetailState("loading")
    fetch(`/api/ondo/venues/${encodeURIComponent(venueId)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Venue detail request failed: ${response.status}`)
        return response.json() as Promise<CanonicalVenueDetailResponse>
      })
      .then((payload) => {
        if (payload.venue.id !== venueId) throw new Error("Venue detail id mismatch")
        setDetail(payload.venue)
        setDetailState("ready")
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setDetailState("error")
      })
    return () => controller.abort()
  }, [detail?.id, expanded, venueId])

  if (!venue || state.tab !== "ondo") return null
  const koreanName = venue.name.ko
  const name = venueDisplayName(koreanName, locale)
  const district = venueDistrictLabel(venue.cityId, venue.districtId, locale)
  const addressEvidence = detail?.address.road.value ? detail.address.road : detail?.address.lot.value ? detail.address.lot : null
  const address = addressEvidence?.value ?? (detailState === "error" ? copy.detailUnavailable : detailState === "ready" ? copy.unknown : copy.detailLoading)
  const saved = state.savedVenueIds.includes(venue.id)
  const saveStatus = state.saveStatusByVenue[venue.id] ?? "SAV-IDLE"
  const saving = saveStatus === "SAV-SAVING"
  const palette = HEAT_COLORS[signal?.level ?? "limited"]
  const contributed = state.acceptedActivityEventKeys.some((key) => key.includes(`local-signal:${venue.id}:`))
  const ageCurrent = state.age === "AGE-VERIFIED" && state.ageExpiresAt != null && new Date(state.ageExpiresAt).getTime() > Date.now()
  const after19Unlocked = state.after19 === "A19-ON" && ageCurrent
  const currentVenueId = venue.id

  function close() { actions.setSurface({ kind: "map" }) }
  function closeDetails() {
    setExpanded(false)
    window.requestAnimationFrame(() => openRef.current?.focus())
  }
  function handleDetailKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault()
      closeDetails()
      return
    }
    if (event.key !== "Tab") return
    const focusable = Array.from(detailRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter((element) => element.offsetParent !== null)
    const first = focusable[0]
    const last = focusable.at(-1)
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }
  function save() {
    if (saved || saving) return
    if (state.account !== "ACC-ACTIVE") {
      actions.beginAction({ cta: "SAVE_VENUE", gates: ["account"], venueId: currentVenueId })
      return
    }
    saveAttemptRef.current += 1
    const attempt = saveAttemptRef.current
    actions.setSaveStatus(currentVenueId, "SAV-SAVING")
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null
      const scenario = new URLSearchParams(window.location.search).get("scenario")
      if (scenario === "save-failed" && attempt === 1) {
        actions.setSaveStatus(currentVenueId, "SAV-FAILED")
        return
      }
      actions.beginAction({ cta: "SAVE_VENUE", gates: ["account"], venueId: currentVenueId })
    }, 360)
  }
  function openAfter19Venue() {
    if (after19Unlocked) return
    if (ageCurrent) {
      actions.setAfter19("A19-ON")
      return
    }
    actions.beginAction({ cta: "OPEN_AFTER19", gates: ["age"], venueId: currentVenueId })
  }
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${venue.latitude},${venue.longitude}`)}`

  if (!expanded) return (
    <div className={styles.peek} role="dialog" aria-modal="false" aria-label={name} data-testid="canonical-place-peek">
      <div className={styles.grabber} />
      <button type="button" className={styles.close} onClick={close} aria-label={copy.close}><X size={18} /></button>
      <div className={styles.meta}><span>{district} · {CATEGORY[venue.primaryCategory][locale]}</span><i>{copy.active}</i></div>
      <h2>{name}</h2>
      <p>{locale === "en" ? koreanName : copy.noEnglish}</p>
      <div className={styles.signal} data-signal-truth={signal ? "SIMULATED" : "UNKNOWN"}>
        <b style={{ background: palette.fill, color: palette.text, borderColor: palette.stroke }}>{signal?.score ?? "—"}</b>
        <span><strong>{signal ? HEAT_LABELS[locale][signal.level] : copy.signalPending}</strong><small>{signal ? copy.simulated : contributed ? copy.contributed : copy.signalPendingBody}</small></span>
      </div>
      <div className={styles.peekActions}>
        <a href={directions} target="_blank" rel="noreferrer" data-testid="canonical-venue-directions"><Navigation size={17} />{copy.directions}</a>
        <button ref={openRef} type="button" onClick={() => setExpanded(true)} data-testid="canonical-place-details">{copy.details}<ChevronRight size={17} /></button>
      </div>
    </div>
  )

  return (
    <div className={styles.layer} role="dialog" aria-modal="true" aria-labelledby="canonical-place-title" data-testid="canonical-place-overlay">
      <button type="button" className={styles.backdrop} onClick={closeDetails} aria-label={copy.back} tabIndex={-1} />
      <article ref={detailRef} className={styles.detail} onKeyDown={handleDetailKeyDown}>
        <header>
          <button ref={closeRef} type="button" onClick={closeDetails} aria-label={copy.back}><ArrowLeft size={19} /></button>
          <span>{district}</span>
          <button type="button" onClick={close} aria-label={copy.close}><X size={19} /></button>
        </header>
        <div className={styles.body}>
          <p className={styles.eyebrow}>{district} · {CATEGORY[venue.primaryCategory][locale]}</p>
          <h2 id="canonical-place-title">{name}</h2>
          <p className={styles.secondaryName}>{locale === "en" ? `${koreanName} · Transliterated for navigation` : copy.noEnglish}</p>
          <p className={styles.address} data-detail-state={detailState} data-address-truth={addressEvidence?.truth ?? (detailState === "ready" ? "UNKNOWN" : detailState.toUpperCase())}><MapPin size={16} />{address}</p>

          <section className={styles.signalDetail} data-signal-truth={signal ? "SIMULATED" : "UNKNOWN"}>
            <b style={{ background: palette.fill, color: palette.text, borderColor: palette.stroke }}>{signal?.score ?? "—"}</b>
            <div><small>{signal ? copy.simulated : "ONDO"}</small><h3>{signal ? HEAT_LABELS[locale][signal.level] : copy.signalPending}</h3><p>{signal ? signal.reason[locale] : contributed ? copy.contributed : copy.signalPendingBody}</p>{signal ? <dl className={styles.signalEvidence}><div><dt>{copy.signalCount}</dt><dd>{signal.signalCount}</dd></div><div><dt>{copy.confidence}</dt><dd>{Math.round(signal.confidence * 100)}%</dd></div><div><dt>{copy.freshness}</dt><dd>{signal.freshness[locale]}</dd></div></dl> : null}{signal && contributed ? <p className={styles.contributionNote}>{copy.contributionIncluded}</p> : null}</div>
          </section>

          {signal?.after19 ? (
            <section className={styles.after19Access} data-testid="canonical-after19-access" data-after19-venue-status={after19Unlocked ? "unlocked" : "locked"}>
              <span className={styles.after19Icon}>{after19Unlocked ? <Moon size={21} /> : <LockKeyhole size={21} />}</span>
              <div><small>{copy.after19Eyebrow}</small><h3>{copy.after19Title}</h3><p>{after19Unlocked ? copy.after19Unlocked : copy.after19Locked}</p></div>
              {after19Unlocked ? <strong>{copy.after19Ready}</strong> : <button type="button" onClick={openAfter19Venue} data-testid="canonical-after19-unlock">{copy.after19Unlock}<ChevronRight size={17} /></button>}
            </section>
          ) : null}

          <section className={styles.before}>
            <h3>{copy.before}</h3>
            {[[copy.hours, copy.unknown], [copy.card, copy.unknown], [copy.menu, copy.unknown], [copy.phone, copy.unknown]].map(([label, value]) => <div key={label}><CircleHelp size={17} /><span><strong>{label}</strong><small>{value}</small></span></div>)}
          </section>

          <section className={styles.source} data-detail-source={detail?.address.road.sourceRefId ?? detail?.address.lot.sourceRefId ?? "NOT_LOADED"}>
            <h3>{copy.source}</h3>
            <p>{copy.sourceBody}</p>
            <dl><div><dt>Snapshot</dt><dd>{venue.sourceSnapshotAt.slice(0, 10)}</dd></div><div><dt>Record</dt><dd>{venue.id.slice(5, 15)}</dd></div></dl>
          </section>

          <nav className={styles.secondaryActions} aria-label={locale === "ko" ? "장소 추가 작업" : "More place actions"}>
            <button type="button" onClick={save} disabled={saved || saving} data-testid="canonical-venue-save"><Bookmark size={18} />{saved ? copy.saved : saving ? copy.saving : copy.save}<ChevronRight size={16} /></button>
            <button type="button" onClick={() => actions.setSurface({ kind: "local_signal", venueId: venue.id })} data-testid="canonical-venue-signal"><MessageCircle size={18} />{copy.signal}<ChevronRight size={16} /></button>
            <button type="button" onClick={() => actions.setTab("tables")} data-testid="canonical-venue-tables"><Users size={18} />{copy.tables}<ChevronRight size={16} /></button>
            <button type="button" onClick={() => actions.setSurface({ kind: "checkout", venueId: venue.id })} data-testid="canonical-venue-checkout"><CreditCard size={18} />{copy.checkout}<ChevronRight size={16} /></button>
          </nav>

          {saveStatus === "SAV-FAILED" ? (
            <section className={styles.saveError} role="alert" data-testid="canonical-save-error">
              <p>{copy.saveFailed}</p>
              <div><button type="button" onClick={save} data-testid="canonical-save-retry">{copy.retrySave}</button><button type="button" onClick={() => actions.setSaveStatus(venue.id, "SAV-IDLE")} data-testid="canonical-save-dismiss">{copy.dismissSave}</button></div>
            </section>
          ) : null}

          <a className={styles.primary} href={directions} target="_blank" rel="noreferrer"><Navigation size={18} />{copy.directions}</a>
        </div>
      </article>
    </div>
  )
}
