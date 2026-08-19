"use client"

import type { KeyboardEvent } from "react"
import { useEffect, useRef, useState } from "react"
import { ArrowLeft, Bookmark, ChevronRight, CircleHelp, CreditCard, MapPin, MessageCircle, Navigation, Users, X } from "lucide-react"
import { canonicalVenueById } from "@/lib/ondo/venues"
import { B_DEMO_SIGNAL_BY_VENUE_ID } from "@/lib/ondo/venues/demo-signals"
import { venueDisplayName, venueDistrictLabel } from "@/lib/ondo/venues/display"
import { HEAT_COLORS, HEAT_LABELS } from "@/lib/ondo/map/heat"
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
    noEnglish: "English name pending · Korean source name shown",
    contributed: "Your visit signal is recorded. More local signals are needed before an ONDO score is calculated.",
    signalCount: "preview signals",
    confidence: "confidence",
    freshness: "Freshness",
    contributionIncluded: "Your session signal is recorded separately; the preview score is not recalculated.",
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
    noEnglish: "영문명 확인 중 · 공식 한글명 표시",
    contributed: "내 방문 신호가 기록됐어요. ONDO 점수를 산출하려면 로컬 신호가 더 필요해요.",
    signalCount: "개 프리뷰 신호",
    confidence: "신뢰도",
    freshness: "최신성",
    contributionIncluded: "내 세션 신호는 별도로 기록되며 프리뷰 점수는 다시 계산하지 않아요.",
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
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const detailRef = useRef<HTMLElement | null>(null)
  const openRef = useRef<HTMLButtonElement | null>(null)
  const venueId = state.surface.kind === "venue" ? state.surface.venueId : undefined
  const venue = venueId ? canonicalVenueById(venueId) : undefined
  const signal = venueId ? B_DEMO_SIGNAL_BY_VENUE_ID.get(venueId) : undefined
  const locale = state.locale
  const copy = COPY[locale]

  useEffect(() => { setExpanded(false) }, [venueId])
  useEffect(() => { if (expanded) closeRef.current?.focus() }, [expanded])

  if (!venue || state.tab !== "ondo") return null
  const koreanName = venue.name.ko.value ?? "—"
  const name = venueDisplayName(koreanName, locale)
  const district = venueDistrictLabel(venue.cityId, venue.districtId, locale)
  const address = venue.address.road.value ?? venue.address.lot.value ?? copy.unknown
  const saved = state.savedVenueIds.includes(venue.id)
  const palette = HEAT_COLORS[signal?.level ?? "limited"]
  const contributed = state.acceptedActivityEventKeys.some((key) => key.includes(`local-signal:${venue.id}:`))

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
    if (saved) return
    actions.beginAction({ cta: "SAVE_VENUE", gates: ["account"], venueId: venue!.id })
  }
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${venue.location.latitude},${venue.location.longitude}`)}`

  if (!expanded) return (
    <aside className={styles.peek} role="dialog" aria-modal="false" aria-label={name} data-testid="canonical-place-peek">
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
    </aside>
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
          <p className={styles.address}><MapPin size={16} />{address}</p>

          <section className={styles.signalDetail} data-signal-truth={signal ? "SIMULATED" : "UNKNOWN"}>
            <b style={{ background: palette.fill, color: palette.text, borderColor: palette.stroke }}>{signal?.score ?? "—"}</b>
            <div><small>{signal ? copy.simulated : "ONDO"}</small><h3>{signal ? HEAT_LABELS[locale][signal.level] : copy.signalPending}</h3><p>{signal ? signal.reason[locale] : contributed ? copy.contributed : copy.signalPendingBody}</p>{signal ? <dl className={styles.signalEvidence}><div><dt>{copy.signalCount}</dt><dd>{signal.signalCount}</dd></div><div><dt>{copy.confidence}</dt><dd>{Math.round(signal.confidence * 100)}%</dd></div><div><dt>{copy.freshness}</dt><dd>{signal.freshness[locale]}</dd></div></dl> : null}{signal && contributed ? <p className={styles.contributionNote}>{copy.contributionIncluded}</p> : null}</div>
          </section>

          <section className={styles.before}>
            <h3>{copy.before}</h3>
            {[[copy.hours, copy.unknown], [copy.card, copy.unknown], [copy.menu, copy.unknown], [copy.phone, copy.unknown]].map(([label, value]) => <div key={label}><CircleHelp size={17} /><span><strong>{label}</strong><small>{value}</small></span></div>)}
          </section>

          <section className={styles.source}>
            <h3>{copy.source}</h3>
            <p>{copy.sourceBody}</p>
            <dl><div><dt>Snapshot</dt><dd>{venue.sourceSnapshotAt.slice(0, 10)}</dd></div><div><dt>Record</dt><dd>{venue.id.slice(5, 15)}</dd></div></dl>
          </section>

          <nav className={styles.secondaryActions} aria-label={locale === "ko" ? "장소 추가 작업" : "More place actions"}>
            <button type="button" onClick={save} disabled={saved} data-testid="canonical-venue-save"><Bookmark size={18} />{saved ? copy.saved : copy.save}<ChevronRight size={16} /></button>
            <button type="button" onClick={() => actions.setSurface({ kind: "local_signal", venueId: venue.id })} data-testid="canonical-venue-signal"><MessageCircle size={18} />{copy.signal}<ChevronRight size={16} /></button>
            <button type="button" onClick={() => actions.setTab("tables")} data-testid="canonical-venue-tables"><Users size={18} />{copy.tables}<ChevronRight size={16} /></button>
            <button type="button" onClick={() => actions.setSurface({ kind: "checkout", venueId: venue.id })} data-testid="canonical-venue-checkout"><CreditCard size={18} />{copy.checkout}<ChevronRight size={16} /></button>
          </nav>

          <a className={styles.primary} href={directions} target="_blank" rel="noreferrer"><Navigation size={18} />{copy.directions}</a>
        </div>
      </article>
    </div>
  )
}
