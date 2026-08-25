"use client"

import type { KeyboardEvent } from "react"
import { useEffect, useRef, useState } from "react"
import { ArrowLeft, Bookmark, ChevronRight, CircleHelp, MapPin, Navigation, NotebookPen, WalletCards, X } from "lucide-react"
import type { CanonicalVenueDetail, CanonicalVenueDetailResponse } from "@/lib/ondo/venues/detail-contract"
import { canonicalMapVenueById } from "@/lib/ondo/venues/map-data"
import { venueDistrictLabel, venueNamePresentation } from "@/lib/ondo/venues/display"
import { B_DISCOVERY_TRAVERSAL_EVENT, closeBDiscoveryPlace, goBackFromBDiscovery, openBDiscoveryDetail, openBDiscoveryVenue, readBDiscoveryHistory, readBDiscoveryTraversal } from "../map/b-discovery-history"
import { PULSE_DISCLOSURE, pulseAlternativesForVenue, pulseForVenue, pulseLevelLabel, type PulseLocalSignalTagB } from "../pulse-b/pulse-model-b"
import { useOndoB } from "../shared/state/ondo-b-provider"
import { useModalIsolation } from "../shared/ui/use-modal-isolation"
import styles from "./canonical-place.module.css"

const COPY = {
  en: {
    active: "Official LOCALDATA record",
    source: "Official source record",
    sourceBody: "Ministry of the Interior and Safety LOCALDATA · General food-service licence directory",
    sourceBoundary: "The record confirms an active licence at the source date. It does not confirm that the business is open today.",
    before: "Information not provided by this source",
    unknown: "Not provided by this source",
    unknownShort: "Not provided",
    hours: "Current opening hours",
    card: "Foreign-issued card support",
    menu: "Menu and prices",
    language: "English-language support",
    category: "Official business type",
    licence: "Licence status",
    activeLicence: "Active at source date",
    opened: "Licence start date",
    modified: "Source record updated",
    details: "Official record details",
    directions: "Directions",
    save: "Save on this device",
    saved: "Saved on this device",
    removeSaved: "Remove from Saved",
    localSignal: "Add a Local Signal",
    localSignalPosted: "Update Local Signal on this device",
    localSignalBoundary: "The note is discarded; selected tag IDs, post time, and place marker stay on this device as your Pulse evidence.",
    demoOffer: "Try ONDO demo meal offer",
    demoOfferBody: "Separate ONDO walkthrough · not an official place fact and not evidence that this LOCALDATA business accepts payment or OOKRW.",
    close: "Close place",
    back: "Back to place summary",
    saveFailed: "This device could not save the place. The selected place remains open.",
    retrySave: "Retry device save",
    detailLoading: "Loading official address evidence…",
    detailUnavailable: "Official address evidence is temporarily unavailable",
    retryDetail: "Retry official record",
    sourceSnapshot: "Source snapshot",
    sourceRecord: "LOCALDATA management ID",
    sourceReference: "Source reference",
    pulseSignals: "walkthrough signals",
    pulseLimited: "Explore · limited signals",
    pulseConfidence: "Confidence",
    pulseFreshness: "Freshness",
    pulseEvidence: "Why this Pulse",
    pulseHigh: "High",
    pulseMedium: "Medium",
    pulseLow: "Low",
    pulseLimitedConfidence: "Limited",
    pulseFixedSnapshot: "Fixed walkthrough snapshot",
    pulseGrowingSnapshot: "Growing fixed walkthrough snapshot",
    pulseTooHot: "Too hot?",
    pulseTooHotBody: "Try a calmer place from the same curated walkthrough set.",
    pulseAlternative: "Open calmer place",
    pulseLocalEvidence: "On this device",
  },
  ko: {
    active: "공식 LOCALDATA 기록",
    source: "공식 출처 기록",
    sourceBody: "행정안전부 LOCALDATA · 일반음식점 인허가 디렉터리",
    sourceBoundary: "출처 기준일의 유효 인허가 상태를 확인합니다. 현재 영업 중이라는 뜻은 아닙니다.",
    before: "이 출처에서 제공하지 않는 정보",
    unknown: "이 출처에서 제공하지 않음",
    unknownShort: "미제공",
    hours: "현재 영업시간",
    card: "해외 발급 카드 지원",
    menu: "메뉴와 가격",
    language: "영어 지원",
    category: "공식 업태구분명",
    licence: "인허가 상태",
    activeLicence: "출처 기준일 영업 상태",
    opened: "인허가 시작일",
    modified: "출처 기록 수정일",
    details: "공식 기록 상세",
    directions: "길찾기",
    save: "이 기기에 저장",
    saved: "이 기기에 저장됨",
    removeSaved: "저장 취소",
    localSignal: "로컬 시그널 남기기",
    localSignalPosted: "이 기기의 로컬 시그널 업데이트",
    localSignalBoundary: "메모는 폐기하고 선택한 태그 ID·게시 시각·장소 표시만 이 기기의 Pulse 근거로 남겨요.",
    demoOffer: "ONDO 데모 식사 혜택 체험",
    demoOfferBody: "별도 ONDO 둘러보기 · 공식 장소 정보가 아니며 이 LOCALDATA 업소가 결제나 OOKRW를 지원한다는 근거가 아닙니다.",
    close: "장소 닫기",
    back: "장소 요약으로",
    saveFailed: "이 기기에 장소를 저장하지 못했어요. 선택한 장소 화면은 그대로 유지됩니다.",
    retrySave: "기기 저장 다시 시도",
    detailLoading: "공식 주소 근거를 불러오는 중…",
    detailUnavailable: "공식 주소 근거를 잠시 불러올 수 없어요",
    retryDetail: "공식 기록 다시 불러오기",
    sourceSnapshot: "출처 스냅샷",
    sourceRecord: "LOCALDATA 관리번호",
    sourceReference: "출처 참조",
    pulseSignals: "둘러보기 신호",
    pulseLimited: "탐색 · 신호 부족",
    pulseConfidence: "신뢰도",
    pulseFreshness: "최신성",
    pulseEvidence: "이 Pulse의 근거",
    pulseHigh: "높음",
    pulseMedium: "보통",
    pulseLow: "낮음",
    pulseLimitedConfidence: "신호 부족",
    pulseFixedSnapshot: "고정 둘러보기 스냅샷",
    pulseGrowingSnapshot: "성장 중인 고정 둘러보기 스냅샷",
    pulseTooHot: "너무 핫한가요?",
    pulseTooHotBody: "같은 선별 둘러보기 세트에서 더 여유로운 장소를 살펴보세요.",
    pulseAlternative: "더 여유로운 장소 열기",
    pulseLocalEvidence: "이 기기에서",
  },
} as const

const CATEGORY = {
  korean: { en: "Korean", ko: "한식" },
  casual: { en: "Quick service", ko: "분식·간편식" },
  japanese: { en: "Japanese", ko: "일식" },
  chinese: { en: "Chinese", ko: "중식" },
  global: { en: "Western & international", ko: "경양식·외국음식" },
  night: { en: "Pub & café licence types", ko: "주점·카페 업태" },
  specialty: { en: "Grills & specialty", ko: "구이·횟집·전문점" },
} as const

const FOCUSABLE = "a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])"

function evidenceValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback
}

function sourceDate(value: string | null | undefined, fallback: string) {
  if (!value) return fallback
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString().slice(0, 10)
}

function localTagLabel(tag: PulseLocalSignalTagB, locale: "en" | "ko") {
  const labels = {
    calm_now: { en: "Calm right now", ko: "지금은 여유로움" },
    lively_now: { en: "Lively right now", ko: "지금은 활기참" },
    quick_stop: { en: "Good for a quick stop", ko: "빠르게 들르기 좋음" },
    welcoming: { en: "Welcoming service", ko: "친절한 응대" },
  } as const
  return labels[tag][locale]
}

export function CanonicalPlaceOverlay() {
  const { state, actions } = useOndoB()
  const [expanded, setExpanded] = useState(() => readBDiscoveryHistory()?.level === "detail")
  const [detail, setDetail] = useState<CanonicalVenueDetail | null>(null)
  const [detailState, setDetailState] = useState<"idle" | "loading" | "ready" | "error">("idle")
  const [detailAttempt, setDetailAttempt] = useState(0)
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const layerRef = useRef<HTMLDivElement | null>(null)
  const detailRef = useRef<HTMLElement | null>(null)
  const peekRef = useRef<HTMLDivElement | null>(null)
  const openRef = useRef<HTMLButtonElement | null>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const venueId = state.surface.kind === "venue" ? state.surface.venueId : undefined
  const venue = venueId ? canonicalMapVenueById(venueId) : undefined
  const locale = state.locale
  const copy = COPY[locale]

  useEffect(() => {
    setDetail(null)
    setDetailState("idle")
    setDetailAttempt(0)
    if (!venueId) {
      setExpanded(false)
      return
    }
    const historyEntry = readBDiscoveryHistory()
    setExpanded(historyEntry?.level === "detail" && historyEntry.venueId === venueId)
  }, [venueId])

  useEffect(() => {
    const syncHistory = (event: Event) => {
      const entry = readBDiscoveryTraversal(event)?.entry
      if (!entry || entry.venueId !== venueId) return
      setExpanded(entry.level === "detail")
    }
    window.addEventListener(B_DISCOVERY_TRAVERSAL_EVENT, syncHistory)
    return () => window.removeEventListener(B_DISCOVERY_TRAVERSAL_EVENT, syncHistory)
  }, [venueId])

  useEffect(() => { if (expanded) closeRef.current?.focus() }, [expanded])

  useEffect(() => {
    if (!venueId || expanded) return
    const active = document.activeElement
    if (!returnFocusRef.current && active instanceof HTMLElement && active !== document.body && active.matches(`[data-venue-opener='${CSS.escape(venueId)}']`)) returnFocusRef.current = active
    const frame = window.requestAnimationFrame(() => openRef.current?.focus({ preventScroll: true }))
    return () => window.cancelAnimationFrame(frame)
  }, [expanded, venueId])

  useModalIsolation(state.tab === "ondo" && Boolean(venueId), expanded ? layerRef : peekRef)

  useEffect(() => {
    if (!expanded || !venueId || detail?.id === venueId) return
    const controller = new AbortController()
    let requestFrame: number | null = null
    setDetailState("loading")
    requestFrame = window.requestAnimationFrame(() => {
      requestFrame = null
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
    })
    return () => {
      if (requestFrame != null) window.cancelAnimationFrame(requestFrame)
      controller.abort()
    }
  }, [detail?.id, detailAttempt, expanded, venueId])

  if (!venue || state.tab !== "ondo") return null
  const name = venueNamePresentation(venue.name.ko, locale)
  const district = venueDistrictLabel(venue.cityId, venue.districtId, locale)
  const category = CATEGORY[venue.primaryCategory][locale]
  const addressEvidence = detail?.address.road.value ? detail.address.road : detail?.address.lot.value ? detail.address.lot : null
  const address = addressEvidence?.value ?? (detailState === "error" ? copy.detailUnavailable : detailState === "ready" ? copy.unknown : copy.detailLoading)
  const saved = state.savedVenueIds.includes(venue.id) || state.saveStatusByVenue[venue.id] === "SAV-SAVED"
  const saveStatus = state.saveStatusByVenue[venue.id] ?? "SAV-IDLE"
  const localSignalPosted = state.localSignalPostedVenueIds.includes(venue.id)
  const pulse = pulseForVenue(venue.id, state.localPulseEvidenceByVenue[venue.id] ?? null)
  const pulseAlternatives = pulseAlternativesForVenue(venue.id)
  const pulseTitle = pulse.score == null
    ? `Pulse · ${pulseLevelLabel(pulse.level, locale)}`
    : `Pulse ${pulse.score}° · ${pulseLevelLabel(pulse.level, locale)}`
  const confidence = ({ high: copy.pulseHigh, medium: copy.pulseMedium, low: copy.pulseLow, limited: copy.pulseLimitedConfidence } as const)[pulse.confidence]
  const fixedSnapshot = pulse.updatedAt
    ? `${pulse.freshness === "growing" ? copy.pulseGrowingSnapshot : copy.pulseFixedSnapshot} · ${pulse.updatedAt.slice(0, 16).replace("T", " ")} UTC`
    : copy.pulseLimited
  const currentVenueId = venue.id
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${venue.latitude},${venue.longitude}`)}`

  function restorePeekOpener() {
    const opener = returnFocusRef.current
    const fallback = document.querySelector<HTMLElement>("[data-testid='ondo-b-view-toggle']")
    const target = opener?.isConnected ? opener : fallback
    target?.focus({ preventScroll: true })
  }

  function close() {
    if (closeBDiscoveryPlace()) return
    actions.setSurface({ kind: "map" })
    window.requestAnimationFrame(restorePeekOpener)
  }

  function closeDetails() {
    if (goBackFromBDiscovery("detail")) return
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

  function handlePeekKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault()
      close()
      return
    }
    if (event.key !== "Tab") return
    const focusable = Array.from(peekRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter((element) => element.offsetParent !== null)
    const first = focusable[0]
    const last = focusable.at(-1)
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }

  function toggleSave() {
    if (saved) actions.toggleSavedVenue(currentVenueId)
    else actions.saveVenue(currentVenueId)
  }

  function openPulseAlternative(alternativeVenueId: string) {
    openBDiscoveryVenue(alternativeVenueId)
    actions.recordRecentVenue(alternativeVenueId)
    actions.setSurface({ kind: "venue", venueId: alternativeVenueId })
    setExpanded(false)
  }

  if (!expanded) return (
    <div id="canonical-place-dialog" ref={peekRef} className={styles.peek} role="dialog" aria-modal="true" aria-label={`${name.officialName} · ${name.officialNameLabel}`} data-testid="canonical-place-peek" data-venue-id={venue.id} onKeyDown={handlePeekKeyDown}>
      <div className={styles.grabber} />
      <button type="button" className={styles.close} onClick={close} aria-label={copy.close}><X size={18} /></button>
      <div className={styles.meta}><span>{district} · {category}</span><i>{copy.active}</i></div>
      <h2>{name.officialName}</h2>
      <div className={styles.nameProvenance} data-testid="canonical-name-provenance"><span>{name.officialNameLabel}</span><strong>{name.transliteration}</strong><small>{name.transliterationLabel}</small></div>
      <section className={styles.pulsePeek} data-testid="canonical-place-pulse" data-pulse-level={pulse.level} data-pulse-numeric={pulse.score == null ? "hidden" : "shown"}>
        <strong>{pulseTitle}</strong>
        <small>{pulse.signalCount == null ? copy.pulseLimited : `${pulse.signalCount} ${copy.pulseSignals}`} · {fixedSnapshot}</small>
        <p>{PULSE_DISCLOSURE[locale]}</p>
        {pulse.localEvidence ? <em data-testid="pulse-local-device-evidence">{copy.pulseLocalEvidence} · {pulse.localEvidence.tags.map((tag) => localTagLabel(tag, locale)).join(" · ")}</em> : null}
      </section>
      <section className={styles.recordSummary} data-testid="canonical-place-source-summary">
        <strong>{copy.source}</strong>
        <p>{copy.sourceBoundary}</p>
      </section>
      <div className={styles.peekActions}>
        <button ref={openRef} type="button" onClick={() => { openBDiscoveryDetail(venue.id); setExpanded(true) }} data-testid="canonical-place-details" data-visual-priority="primary">{copy.details}<ChevronRight size={17} /></button>
        <a href={directions} target="_blank" rel="noreferrer" data-testid="canonical-venue-directions" data-visual-priority="secondary"><Navigation size={17} />{copy.directions}</a>
      </div>
    </div>
  )

  return (
    <div id="canonical-place-dialog" ref={layerRef} className={styles.layer} role="dialog" aria-modal="true" aria-labelledby="canonical-place-title" data-testid="canonical-place-overlay" data-venue-id={venue.id} data-save-state={saveStatus}>
      <button type="button" className={styles.backdrop} onClick={closeDetails} aria-label={copy.back} tabIndex={-1} />
      <article ref={detailRef} className={styles.detail} onKeyDown={handleDetailKeyDown}>
        <header>
          <button ref={closeRef} type="button" onClick={closeDetails} aria-label={copy.back}><ArrowLeft size={19} /></button>
          <span>{district}</span>
          <button type="button" onClick={close} aria-label={copy.close}><X size={19} /></button>
        </header>
        <div className={styles.body}>
          <p className={styles.eyebrow}>{district} · {category}</p>
          <h2 id="canonical-place-title">{name.officialName}</h2>
          <div className={styles.detailNameProvenance} data-testid="canonical-detail-name-provenance"><span>{name.officialNameLabel}</span><strong>{name.transliteration}</strong><small>{name.transliterationLabel}</small></div>
          {detailState === "error" ? (
            <section className={styles.detailError} role="alert" data-detail-state="error" data-address-truth="ERROR">
              <p><MapPin size={16} />{copy.detailUnavailable}</p>
              <button type="button" onClick={() => { setDetail(null); setDetailState("loading"); setDetailAttempt((attempt) => attempt + 1) }}>{copy.retryDetail}</button>
            </section>
          ) : (
            <p className={styles.address} role={detailState === "loading" ? "status" : undefined} aria-live={detailState === "loading" ? "polite" : undefined} data-detail-state={detailState} data-address-truth={addressEvidence?.truth ?? (detailState === "ready" ? "UNKNOWN" : detailState.toUpperCase())}><MapPin size={16} />{address}</p>
          )}

          <section className={styles.pulsePanel} data-testid="canonical-place-pulse" data-pulse-level={pulse.level} data-pulse-numeric={pulse.score == null ? "hidden" : "shown"}>
            <header>
              <div><span>ONDO PULSE</span><h3>{pulseTitle}</h3></div>
              <i data-level={pulse.level}>{pulseLevelLabel(pulse.level, locale)}</i>
            </header>
            <p className={styles.pulseBoundary}>{PULSE_DISCLOSURE[locale]}</p>
            <dl>
              {pulse.score == null ? null : <div data-testid="pulse-score"><dt>Pulse</dt><dd>{pulse.score}°</dd></div>}
              {pulse.signalCount == null ? null : <div data-testid="pulse-signal-count"><dt>{copy.pulseSignals}</dt><dd>{pulse.signalCount}</dd></div>}
              <div data-testid="pulse-confidence"><dt>{copy.pulseConfidence}</dt><dd>{confidence}</dd></div>
              <div><dt>{copy.pulseFreshness}</dt><dd>{fixedSnapshot}</dd></div>
            </dl>
            <div className={styles.pulseEvidence} data-testid="pulse-evidence">
              <strong>{copy.pulseEvidence}</strong>
              <ul>{pulse.evidence.map((item, index) => <li key={`${item.origin}-${index}`} data-origin={item.origin}>{item.label[locale]}</li>)}</ul>
              {pulse.localEvidence ? <p data-testid="pulse-local-device-evidence"><b>{copy.pulseLocalEvidence}</b> · {pulse.localEvidence.tags.map((tag) => localTagLabel(tag, locale)).join(" · ")} · {pulse.localEvidence.postedAt.slice(0, 16).replace("T", " ")} UTC</p> : null}
            </div>
            {pulseAlternatives.length ? (
              <section className={styles.pulseAlternatives} data-testid="pulse-too-hot">
                <h4>{copy.pulseTooHot}</h4>
                <p>{copy.pulseTooHotBody}</p>
                <div>{pulseAlternatives.map((alternative) => {
                  const alternativeVenue = canonicalMapVenueById(alternative.venueId)
                  if (!alternativeVenue) return null
                  const alternativeName = venueNamePresentation(alternativeVenue.name.ko, locale).officialName
                  return <button key={alternative.venueId} type="button" data-testid="pulse-alternative" data-venue-id={alternative.venueId} aria-label={`${copy.pulseAlternative}: ${alternativeName}, Pulse ${alternative.score}°, ${pulseLevelLabel(alternative.level, locale)}`} onClick={() => openPulseAlternative(alternative.venueId)}><span><strong>{alternativeName}</strong><small>Pulse {alternative.score}° · {pulseLevelLabel(alternative.level, locale)}</small></span><ChevronRight size={17} aria-hidden="true" /></button>
                })}</div>
              </section>
            ) : null}
          </section>

          <div className={styles.decisionActions} data-testid="canonical-place-decisions">
            <a href={directions} target="_blank" rel="noreferrer" data-testid="canonical-venue-primary-directions" data-visual-priority="primary"><Navigation size={18} />{copy.directions}</a>
            <button type="button" onClick={toggleSave} aria-pressed={saved} data-testid="canonical-venue-save" data-visual-priority="secondary"><Bookmark size={18} />{saved ? copy.removeSaved : copy.save}</button>
          </div>

          <section className={styles.localSignalAction}>
            <button type="button" onClick={() => actions.openLocalSignal(currentVenueId)} data-testid="canonical-local-signal-open">
              <NotebookPen size={18} aria-hidden="true" />
              <span><strong>{localSignalPosted ? copy.localSignalPosted : copy.localSignal}</strong><small>{copy.localSignalBoundary}</small></span>
              <ChevronRight size={17} aria-hidden="true" />
            </button>
          </section>

          <section className={styles.demoOfferAction} aria-label={copy.demoOffer}>
            <button type="button" onClick={() => actions.openDemoMealOfferFromPlace(currentVenueId)} data-testid="canonical-demo-meal-offer-open">
              <WalletCards size={18} aria-hidden="true" />
              <span><strong>{copy.demoOffer}</strong><small>{copy.demoOfferBody}</small></span>
              <ChevronRight size={17} aria-hidden="true" />
            </button>
          </section>

          {saveStatus === "SAV-FAILED" ? <section className={styles.saveError} role="alert" data-testid="canonical-save-error"><p>{copy.saveFailed}</p><button type="button" onClick={() => actions.saveVenue(currentVenueId)} data-testid="canonical-save-retry" data-visual-priority="primary">{copy.retrySave}</button></section> : null}

          <section className={styles.sourceEvidence} data-testid="canonical-source-evidence">
            <h3>{copy.source}</h3>
            <p>{copy.sourceBoundary}</p>
            <dl>
              <div><dt>{copy.category}</dt><dd>{evidenceValue(detail?.sourceCategory.value, copy.unknown)}</dd></div>
              <div><dt>{copy.licence}</dt><dd>{detail?.licenseStatus.value === "ACTIVE_LICENSE_RECORD" ? copy.activeLicence : copy.unknown}</dd></div>
              <div><dt>{copy.opened}</dt><dd>{sourceDate(detail?.licenseOpenedAt.value, copy.unknown)}</dd></div>
              <div><dt>{copy.modified}</dt><dd>{sourceDate(detail?.sourceModifiedAt.value, copy.unknown)}</dd></div>
            </dl>
          </section>

          <section className={styles.before}>
            <h3>{copy.before}</h3>
            {[
              [copy.hours, evidenceValue(detail?.facts.openingHours.value, copy.unknown)],
              [copy.card, evidenceValue(detail?.facts.foreignCardAccepted.value, copy.unknown)],
              [copy.menu, evidenceValue(detail?.facts.menu.value, copy.unknown)],
              [copy.language, evidenceValue(detail?.facts.englishSupport.value, copy.unknown)],
            ].map(([label, value]) => <div key={label}><CircleHelp size={17} /><span><strong>{label}</strong><small>{value}</small></span></div>)}
          </section>

          <section className={styles.source} data-detail-source={detail?.address.road.sourceRefId ?? detail?.address.lot.sourceRefId ?? "NOT_LOADED"}>
            <h3>{copy.source}</h3>
            <p>{copy.sourceBody}</p>
            <dl>
              <div><dt>{copy.sourceSnapshot}</dt><dd>{venue.sourceSnapshotAt.slice(0, 10)}</dd></div>
              <div><dt>{copy.sourceRecord}</dt><dd>{detail?.sourceIds.moisManagementId ?? copy.unknownShort}</dd></div>
              <div><dt>{copy.sourceReference}</dt><dd>MOIS LOCALDATA</dd></div>
            </dl>
          </section>
        </div>
      </article>
    </div>
  )
}
