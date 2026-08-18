"use client"

import { useEffect, useRef, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  CreditCard,
  Heart,
  Info,
  MapPin,
  MessageSquarePlus,
  Navigation,
  Users,
  X,
} from "lucide-react"
import { useOndo } from "../shared/state/ondo-provider"
import { MAP_VENUE_BY_ID } from "../../../lib/ondo/map/fixtures"
import { CONFIDENCE_LABELS, FRESHNESS_LABELS, HEAT_COLORS, HEAT_LABELS, resolveFreshness } from "../../../lib/ondo/map/heat"
import { readDiscoveryUrl, writeDiscoveryUrl } from "../../../lib/ondo/map/url-state"
import type { MapVenue } from "../../../lib/ondo/map/models"
import styles from "./place.module.css"

const PLACE_COPY = {
  en: {
    ondoTitle: "ONDO at this place",
    ondoExplain: "Based on recent local food and drink signals.",
    before: "Before you go",
    beforeNote: "Please also check the venue’s latest information before visiting.",
    source: "Signal source",
    save: "Save",
    saved: "Saved",
    directions: "Directions",
    details: "View details",
    table: "View Tables here",
    actionTitle: "Continue at this place",
    signal: "Share a visit signal",
    checkout: "Checkout simulation",
    accountHint: "Create an account to save this place. You’ll return here afterwards; person verification is not required.",
    close: "Close place",
    back: "Back to place summary",
    dismissDetails: "Dismiss place details",
    open: "Open",
    closed: "Closed",
    unknown: "Hours pending",
    staleFact: "Previous signal · ",
    staleFactsNotice: "These access details are outside their freshness window. Check the latest venue information.",
    seed: "Early coverage · smaller sample",
    scoreBoundary: "ONDO is a recent local food signal, not temperature, live crowding, or a safety score.",
  },
  ko: {
    ondoTitle: "이 장소의 ONDO",
    ondoExplain: "최근 로컬 식음료 신호를 바탕으로 계산했어요.",
    before: "가기 전 확인",
    beforeNote: "방문 전 장소의 최신 안내도 함께 확인해 주세요.",
    source: "신호 출처",
    save: "저장",
    saved: "저장됨",
    directions: "길찾기",
    details: "상세 보기",
    table: "이 장소의 Table 보기",
    actionTitle: "이 장소에서 이어서 하기",
    signal: "방문 신호 남기기",
    checkout: "결제 시뮬레이션",
    accountHint: "저장하려면 계정이 필요해요. 계정을 만든 뒤 이 장소로 돌아오며, 신원 확인은 아직 필요하지 않아요.",
    close: "장소 닫기",
    back: "장소 요약으로 돌아가기",
    dismissDetails: "장소 상세 닫기",
    open: "영업 중",
    closed: "영업 종료",
    unknown: "영업 정보 확인 중",
    staleFact: "이전 신호 · ",
    staleFactsNotice: "이용 정보의 최신 확인 시점이 지났어요. 방문 전 장소의 최신 안내를 확인해 주세요.",
    seed: "먼저 채워지는 지역 · 적은 표본",
    scoreBoundary: "ONDO는 최근 로컬 식음료 신호이며 기온·실시간 인파·안전 점수가 아니에요.",
  },
} as const

function externalDirectionsUrl(venue: MapVenue) {
  const query = encodeURIComponent(`${venue.latitude},${venue.longitude}`)
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`
}

function FactIcon({ tone }: { tone: MapVenue["facts"][number]["tone"] }) {
  if (tone === "positive") return <CheckCircle2 size={17} />
  if (tone === "notice") return <AlertTriangle size={17} />
  return <CircleHelp size={17} />
}

export function PlaceOverlay() {
  const { state, actions } = useOndo()
  const [expanded, setExpanded] = useState(false)
  const detailsButtonRef = useRef<HTMLButtonElement | null>(null)
  const detailRef = useRef<HTMLElement | null>(null)
  const detailCloseRef = useRef<HTMLButtonElement | null>(null)
  const venueId = state.surface.kind === "venue" ? state.surface.venueId : undefined
  const venue = venueId ? MAP_VENUE_BY_ID.get(venueId) : undefined
  const locale = state.locale
  const copy = PLACE_COPY[locale]
  const saved = venue ? state.savedVenueIds.includes(venue.id) || state.saveStatusByVenue[venue.id] === "SAV-SAVED" : false
  const savePending = Boolean(venue && state.gate?.cta === "SAVE_VENUE" && state.gate.venueId === venue.id && !saved)

  useEffect(() => { setExpanded(false) }, [venueId])

  useEffect(() => {
    if (!expanded) return
    const dialog = detailRef.current
    const previous = document.activeElement as HTMLElement | null
    detailCloseRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        setExpanded(false)
        return
      }
      if (event.key !== "Tab" || !dialog) return
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])"))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable.at(-1) ?? first
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      if (previous?.isConnected) previous.focus()
      else detailsButtonRef.current?.focus()
    }
  }, [expanded])

  if (!venue || state.tab !== "ondo") return null

  const selectedVenueId = venue.id
  const palette = HEAT_COLORS[venue.heatLevel]
  const freshness = resolveFreshness(venue)
  const venueCurrent = !["stale", "unknown"].includes(freshness)
  const opening = !venueCurrent ? copy.unknown : venue.openingStatus === "open" ? copy.open : venue.openingStatus === "closed" ? copy.closed : copy.unknown
  const factPresentation = (fact: MapVenue["facts"][number]) => {
    const factFreshness = resolveFreshness({ freshness: "today", updatedAt: fact.provenance.fetchedAt, provenance: fact.provenance })
    const current = !["stale", "unknown"].includes(factFreshness)
    return { current, tone: current ? fact.tone : "neutral" as const, value: `${current ? "" : copy.staleFact}${fact.value[locale]}` }
  }
  const hasStaleFacts = venue.facts.some((fact) => !factPresentation(fact).current)

  function close() {
    actions.setSurface({ kind: "map" })
    const current = readDiscoveryUrl(window.location.search)
    writeDiscoveryUrl({ ...current, venueId: undefined })
  }

  function save() {
    if (saved) return
    actions.beginAction({ cta: "SAVE_VENUE", gates: ["account"], venueId: selectedVenueId })
  }

  function showTables() {
    actions.setTab("tables")
  }

  function showLocalSignal() {
    actions.setSurface({ kind: "local_signal", venueId: selectedVenueId })
  }

  function showCheckout() {
    actions.setSurface({ kind: "checkout", venueId: selectedVenueId })
  }

  if (!expanded) {
    return (
      <aside className={styles.peek} role="dialog" aria-modal="false" aria-label={venue.name[locale]} data-testid="place-peek">
        <div className={styles.grabber} aria-hidden="true" />
        <button type="button" className={styles.close} onClick={close} aria-label={copy.close}><X size={19} /></button>
        <div className={styles.peekHeat}>
          <span style={{ background: palette.fill, color: palette.text, borderColor: palette.stroke }}>ONDO <b>{venue.ondoScore}</b></span>
          <small>{HEAT_LABELS[locale][venue.heatLevel]} · {FRESHNESS_LABELS[locale][freshness]}</small>
        </div>
        <h2>{venue.name[locale]}</h2>
        <p>{venue.name[locale === "en" ? "ko" : "en"]} · {opening} · {venue.priceLabel}</p>
        <div className={styles.peekFacts}>
          {venue.facts.slice(0, 2).map((fact) => {
            const presented = factPresentation(fact)
            return <span key={fact.id} data-fact-freshness={presented.current ? "current" : "stale"}><FactIcon tone={presented.tone} />{presented.value}</span>
          })}
        </div>
        {savePending ? <p className={styles.saveGateHint} role="status" data-testid="save-account-gate-hint">{copy.accountHint}</p> : null}
        <div className={styles.peekActions}>
          <a href={externalDirectionsUrl(venue)} target="_blank" rel="noreferrer" data-testid="venue-directions"><Navigation size={17} />{copy.directions}</a>
          <button ref={detailsButtonRef} type="button" onClick={() => setExpanded(true)} data-testid="place-details"><Info size={17} />{copy.details}</button>
        </div>
      </aside>
    )
  }

  return (
    <div className={styles.fullLayer} role="dialog" aria-modal="true" aria-labelledby="place-title" data-testid="place-overlay">
      <button type="button" className={styles.backdrop} onClick={() => setExpanded(false)} aria-label={copy.dismissDetails} tabIndex={-1} />
      <article ref={detailRef} className={styles.detail}>
        <div className={styles.hero}>
          <img src={venue.image} alt="" />
          <button ref={detailCloseRef} type="button" className={styles.detailClose} onClick={() => setExpanded(false)} aria-label={copy.back}><X size={20} /></button>
          <button type="button" className={`${styles.save} ${saved ? styles.saved : ""}`} onClick={save} disabled={saved} data-testid="venue-save" aria-label={saved ? copy.saved : copy.save}>
            <Heart size={20} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
        <div className={styles.body}>
          <div className={styles.kicker}>
            <span className={venueCurrent && venue.openingStatus === "open" ? styles.open : styles.statusMuted}>{opening}</span>
            <span>{venue.priceLabel}</span>
          </div>
          <h2 id="place-title">{venue.name[locale]}</h2>
          <p className={styles.englishName}>{venue.name[locale === "en" ? "ko" : "en"]}</p>
          <p className={styles.address}><MapPin size={15} />{venue.address[locale]}</p>

          <section className={styles.placeActions} aria-labelledby="place-actions-title">
            <h3 id="place-actions-title">{copy.actionTitle}</h3>
            <div>
              <button type="button" onClick={showLocalSignal} data-testid="venue-local-signal"><MessageSquarePlus size={18} /><span>{copy.signal}</span><ChevronRight size={16} /></button>
              <button type="button" onClick={showCheckout} data-testid="venue-checkout"><CreditCard size={18} /><span>{copy.checkout}</span><ChevronRight size={16} /></button>
            </div>
          </section>

          <section className={styles.ondoCard} aria-labelledby="place-ondo-title">
            <div className={styles.score} style={{ background: palette.fill, color: palette.text, borderColor: palette.stroke }}><span>ONDO</span><b>{venue.ondoScore}</b></div>
            <div className={styles.ondoSummary}>
              <h3 id="place-ondo-title">{copy.ondoTitle}</h3>
              <p>{copy.ondoExplain}</p>
              <div>
                <span>{HEAT_LABELS[locale][venue.heatLevel]}</span>
                <span><Clock3 size={13} />{FRESHNESS_LABELS[locale][freshness]}</span>
              </div>
            </div>
            <dl className={styles.signalMetrics}>
              <div><dt>{locale === "ko" ? "최근 신호" : "Recent signals"}</dt><dd>{venue.signalCount}</dd></div>
              <div><dt>{locale === "ko" ? "근거" : "Signal base"}</dt><dd>{CONFIDENCE_LABELS[locale][venue.confidence]}</dd></div>
              <div><dt>{locale === "ko" ? "확인 시각" : "Checked"}</dt><dd>2026-08-19</dd></div>
            </dl>
            {venue.coverage === "seed" ? <p className={styles.seed}><Info size={15} />{copy.seed}</p> : null}
            <p className={styles.boundary}>{copy.scoreBoundary}</p>
          </section>

          <section className={styles.section} aria-labelledby="before-title">
            <div className={styles.sectionTitle}><span><small>VISIT NOTES</small><h3 id="before-title">{copy.before}</h3></span></div>
            {hasStaleFacts ? <p className={styles.beforeNote} data-testid="stale-facts-notice"><AlertTriangle size={15} />{copy.staleFactsNotice}</p> : null}
            <div className={styles.factList}>
              {venue.facts.map((fact) => {
                const presented = factPresentation(fact)
                return (
                  <div key={fact.id} className={`${styles.fact} ${styles[`fact_${presented.tone}`]}`} data-fact-freshness={presented.current ? "current" : "stale"}>
                    <FactIcon tone={presented.tone} />
                    <span><strong>{presented.value}</strong><small>{fact.value[locale === "en" ? "ko" : "en"]}</small></span>
                  </div>
                )
              })}
            </div>
            <p className={styles.beforeNote}><Info size={15} />{copy.beforeNote}</p>
          </section>

          <section className={styles.section}>
            <h3>{copy.source}</h3>
            <p>{venue.sourceLabel[locale]}</p>
            <p className={styles.sourceMeta}>{locale === "ko" ? "확인" : "Checked"} · {venue.updatedAt.slice(0, 10)}</p>
          </section>

          {savePending ? <p className={styles.saveGateHint} role="status" data-testid="save-account-gate-hint">{copy.accountHint}</p> : null}
          <div className={styles.detailActions}>
            <a href={externalDirectionsUrl(venue)} target="_blank" rel="noreferrer" data-testid="venue-directions"><Navigation size={18} />{copy.directions}</a>
            <button type="button" onClick={showTables} data-testid="venue-tables"><Users size={18} />{copy.table}<ChevronRight size={17} /></button>
          </div>
        </div>
      </article>
    </div>
  )
}
