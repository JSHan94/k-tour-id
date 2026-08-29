"use client"

import type { KeyboardEvent } from "react"
import { useEffect, useRef, useState } from "react"
import { ArrowLeft, BadgeCheck, Bookmark, ChevronRight, CircleHelp, MapPin, MoonStar, Navigation, NotebookPen, UsersRound, WalletCards, X } from "lucide-react"
import type { CanonicalVenueDetail, CanonicalVenueDetailResponse } from "@/lib/ondo/venues/detail-contract"
import { canonicalMapVenueById } from "@/lib/ondo/venues/map-data"
import { venueDistrictLabel, venueNamePresentation } from "@/lib/ondo/venues/display"
import {
  DEFAULT_GLOBAL_AFTER19_SESSION,
  GLOBAL_AFTER19_SESSION_EVENT,
  isGlobalAfter19AgeCurrent,
  restoreGlobalAfter19B,
  sanitizeGlobalAfter19Session,
  type GlobalAfter19SessionB,
} from "../after19/after19-global-b-model"
import {
  createPlaceAfter19Return,
  PLACE_AFTER19_RETURN_COMPLETE_EVENT,
  PLACE_AFTER19_RETURN_REQUEST_EVENT,
  requestPlaceAfter19Return,
  restorePlaceAfter19ReturnSession,
} from "../after19/after19-place-return-b-model"
import { B_DISCOVERY_TRAVERSAL_EVENT, closeBDiscoveryPlace, consumeBDiscoveryPeekTraversalFocus, goBackFromBDiscovery, openBDiscoveryAlternativeVenue, openBDiscoveryDetail, readBDiscoveryHistory, readBDiscoveryTraversal } from "../map/b-discovery-history"
import { pulseAlternativesForVenue, pulseForVenue, pulseLevelLabel, type PulseLocalSignalTagB } from "../pulse-b/pulse-model-b"
import { useOndoB } from "../shared/state/ondo-b-provider"
import { useModalIsolation } from "../shared/ui/use-modal-isolation"
import styles from "./canonical-place.module.css"

const TABLE_VENUE_ID = "mois-0021cd596bc5b2a922ad"
const ACTIVE_TABLE_STARTS_AT = "2026-09-18T20:30:00+09:00"
export const ONDO_OPEN_TABLE_EVENT = "ondo:b:open-table"

const COPY = {
  en: {
    active: "LOCALDATA place information",
    source: "Source details",
    sourceBody: "Ministry of the Interior and Safety · LOCALDATA food-service dataset",
    sourceBoundary: "Listed in LOCALDATA at the source date. Check today’s opening directly with the place.",
    before: "Information not provided by this source",
    unknown: "Not provided by this source",
    unknownShort: "Not provided",
    hours: "Current opening hours",
    card: "Foreign-issued card support",
    menu: "Menu and prices",
    language: "English-language support",
    category: "Place type",
    licence: "Source status",
    activeLicence: "Listed at source date",
    opened: "First listed",
    modified: "Source record updated",
    details: "Place details",
    directions: "Directions",
    save: "Save on this device",
    saved: "Saved on this device",
    removeSaved: "Remove from Saved",
    localSignal: "Add a Local Signal",
    localSignalPosted: "Update Local Signal on this device",
    localSignalBoundary: "Choose a quick observation and optional photo in this open, device-local flow. Only saved selections and time enter history; the photo is discarded.",
    demoOffer: "See ONDO meal benefit",
    demoOfferBody: "See an ONDO meal benefit for this place.",
    close: "Close place",
    back: "Back to place summary",
    saveFailed: "This device could not save the place. The selected place remains open.",
    retrySave: "Retry device save",
    detailLoading: "Loading official address evidence…",
    detailUnavailable: "Official address evidence is temporarily unavailable",
    retryDetail: "Retry place details",
    sourceSnapshot: "Source snapshot",
    sourceRecord: "LOCALDATA management ID",
    sourceReference: "Source reference",
    pulseSignals: "recent signals",
    pulseLimited: "Explore · limited signals",
    pulseConfidence: "Confidence",
    pulseFreshness: "Freshness",
    pulseEvidence: "Why this ONDO temperature",
    temperature: "ONDO temperature",
    pulseHigh: "High",
    pulseMedium: "Medium",
    pulseLow: "Low",
    pulseLimitedConfidence: "Limited",
    pulseFixedSnapshot: "Curated snapshot",
    pulseGrowingSnapshot: "Recently updated",
    pulseTooHot: "Too hot?",
    pulseTooHotBody: "Compare a calmer place from the same curated area.",
    pulseAlternative: "Open calmer place",
    pulseLocalEvidence: "On this device",
    table: "View Table",
    tableBody: "Fri, Sep 18 · 20:30 KST · Korean + English · 1 seat left",
    tableClosedBody: "This Table has ended · view details",
    tablesAtPlace: "Tables at this place",
    noTables: "No open Table here yet",
    noTablesBody: "Keep this exact place open, or browse all local Tables.",
    backToPlace: "Back to this place",
    browseTables: "Browse all Tables",
    after19: "19+ required",
    after19Body: "You’ll verify after choosing Join.",
    after19Preview: "After 19",
    after19Unlock: "Turn on After 19",
    after19Ready: "On",
    pulseBoundary: "Curated visit signals · not live crowding or official venue facts.",
  },
  ko: {
    active: "LOCALDATA 장소 정보",
    source: "출처 상세",
    sourceBody: "행정안전부 · LOCALDATA 음식점 데이터",
    sourceBoundary: "출처 기준일에 LOCALDATA에 등록된 장소입니다. 오늘 영업 여부는 장소에 직접 확인해 주세요.",
    before: "이 출처에서 제공하지 않는 정보",
    unknown: "이 출처에서 제공하지 않음",
    unknownShort: "미제공",
    hours: "현재 영업시간",
    card: "해외 발급 카드 지원",
    menu: "메뉴와 가격",
    language: "영어 지원",
    category: "장소 유형",
    licence: "출처 상태",
    activeLicence: "출처 기준일 등록",
    opened: "최초 등록일",
    modified: "출처 기록 수정일",
    details: "장소 상세",
    directions: "길찾기",
    save: "이 기기에 저장",
    saved: "이 기기에 저장됨",
    removeSaved: "저장 취소",
    localSignal: "로컬 시그널 남기기",
    localSignalPosted: "이 기기의 로컬 시그널 업데이트",
    localSignalBoundary: "이 기기에서 열린 흐름에 짧은 관찰과 선택 사진을 더하세요. 선택한 관찰과 시각만 기록에 남고 사진은 폐기됩니다.",
    demoOffer: "ONDO 식사 혜택 보기",
    demoOfferBody: "이 장소에서 쓸 수 있는 ONDO 식사 혜택을 확인하세요.",
    close: "장소 닫기",
    back: "장소 요약으로",
    saveFailed: "이 기기에 장소를 저장하지 못했어요. 선택한 장소 화면은 그대로 유지됩니다.",
    retrySave: "기기 저장 다시 시도",
    detailLoading: "공식 주소 근거를 불러오는 중…",
    detailUnavailable: "공식 주소 근거를 잠시 불러올 수 없어요",
    retryDetail: "장소 상세 다시 불러오기",
    sourceSnapshot: "출처 스냅샷",
    sourceRecord: "LOCALDATA 관리번호",
    sourceReference: "출처 참조",
    pulseSignals: "최근 시그널",
    pulseLimited: "탐색 · 신호 부족",
    pulseConfidence: "신뢰도",
    pulseFreshness: "최신성",
    pulseEvidence: "이 온도의 근거",
    temperature: "온도",
    pulseHigh: "높음",
    pulseMedium: "보통",
    pulseLow: "낮음",
    pulseLimitedConfidence: "신호 부족",
    pulseFixedSnapshot: "선별 스냅샷",
    pulseGrowingSnapshot: "최근 업데이트",
    pulseTooHot: "너무 핫한가요?",
    pulseTooHotBody: "같은 선별 지역에서 더 여유로운 장소를 살펴보세요.",
    pulseAlternative: "더 여유로운 장소 열기",
    pulseLocalEvidence: "이 기기에서",
    table: "테이블 보기",
    tableBody: "9월 18일 금요일 · 20:30 KST · 한국어 + 영어 · 1자리 남음",
    tableClosedBody: "종료된 테이블 · 상세 보기",
    tablesAtPlace: "이 장소의 테이블",
    noTables: "아직 열린 테이블이 없어요",
    noTablesBody: "이 장소를 그대로 보거나 전체 로컬 테이블을 둘러보세요.",
    backToPlace: "이 장소로 돌아가기",
    browseTables: "전체 테이블 보기",
    after19: "19+ 필수",
    after19Body: "참여를 누른 뒤 확인해요.",
    after19Preview: "After 19",
    after19Unlock: "After 19 켜기",
    after19Ready: "켜짐",
    pulseBoundary: "선별된 방문 시그널 · 실시간 혼잡도나 공식 장소 정보가 아니에요.",
  },
  ja: {
    active: "LOCALDATAの場所情報",
    source: "出典の詳細",
    sourceBody: "韓国行政安全部・LOCALDATA飲食店データ",
    sourceBoundary: "出典日時点でLOCALDATAに掲載された場所です。現在の営業状況は店舗に確認してください。",
    before: "この出典では確認できない情報",
    unknown: "この出典では確認できません",
    unknownShort: "情報なし",
    hours: "現在の営業時間",
    card: "海外発行カードへの対応",
    menu: "メニューと価格",
    language: "日本語・英語への対応",
    category: "場所タイプ",
    licence: "出典での状態",
    activeLicence: "出典日時点で掲載",
    opened: "初回掲載日",
    modified: "出典記録の更新日",
    details: "場所の詳細",
    directions: "経路を見る",
    save: "この端末に保存",
    saved: "この端末に保存済み",
    removeSaved: "保存を解除",
    localSignal: "ローカルシグナルを追加",
    localSignalPosted: "この端末のローカルシグナルを更新",
    localSignalBoundary: "この端末で開いている操作に短い観察と任意の写真を加えます。選んだ内容と時刻だけが履歴に残り、写真は破棄されます。",
    demoOffer: "ONDOの食事特典を見る",
    demoOfferBody: "この場所で使えるONDOの食事特典を確認できます。",
    close: "場所を閉じる",
    back: "場所の概要に戻る",
    saveFailed: "この端末に場所を保存できませんでした。選択中の場所は開いたままです。",
    retrySave: "もう一度保存",
    detailLoading: "公式住所の根拠を読み込み中…",
    detailUnavailable: "公式住所の根拠を一時的に読み込めません",
    retryDetail: "場所の詳細を再読み込み",
    sourceSnapshot: "出典スナップショット",
    sourceRecord: "LOCALDATA管理番号",
    sourceReference: "出典参照",
    pulseSignals: "最近のシグナル",
    pulseLimited: "探索中・シグナル不足",
    pulseConfidence: "確度",
    pulseFreshness: "更新状況",
    pulseEvidence: "このONDO温度の根拠",
    temperature: "ONDO温度",
    pulseHigh: "高い",
    pulseMedium: "中程度",
    pulseLow: "低い",
    pulseLimitedConfidence: "シグナル不足",
    pulseFixedSnapshot: "選定スナップショット",
    pulseGrowingSnapshot: "最近更新",
    pulseTooHot: "混みそう？",
    pulseTooHotBody: "同じ選定エリアから、より落ち着いた場所を比べられます。",
    pulseAlternative: "落ち着いた場所を開く",
    pulseLocalEvidence: "この端末",
    table: "テーブルを見る",
    tableBody: "9月18日（金）・20:30 KST・韓国語＋英語・残り1席",
    tableClosedBody: "終了したTable・詳細を見る",
    tablesAtPlace: "この場所のテーブル",
    noTables: "現在募集中のテーブルはありません",
    noTablesBody: "この場所に戻るか、すべてのローカルテーブルを見られます。",
    backToPlace: "この場所に戻る",
    browseTables: "すべてのテーブルを見る",
    after19: "19歳以上の確認が必要",
    after19Body: "参加を選んだ後に確認します。",
    after19Preview: "After 19",
    after19Unlock: "After 19をオンにする",
    after19Ready: "オン",
    pulseBoundary: "選定した訪問シグナルに基づく参考値です。リアルタイムの混雑状況でも、公式の場所情報でもありません。",
  },
} as const

const CATEGORY = {
  korean: { en: "Korean", ko: "한식", ja: "韓国料理" },
  casual: { en: "Quick service", ko: "분식·간편식", ja: "軽食・ファストフード" },
  japanese: { en: "Japanese", ko: "일식", ja: "日本料理" },
  chinese: { en: "Chinese", ko: "중식", ja: "中華料理" },
  global: { en: "Western & international", ko: "경양식·외국음식", ja: "洋食・各国料理" },
  night: { en: "Pubs & cafés", ko: "주점·카페", ja: "パブ・カフェ" },
  specialty: { en: "Grills & specialty", ko: "구이·횟집·전문점", ja: "焼き物・専門店" },
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

function localTagLabel(tag: PulseLocalSignalTagB, locale: "en" | "ko" | "ja") {
  const labels = {
    calm_now: { en: "Calm right now", ko: "지금은 여유로움", ja: "今はゆったり" },
    lively_now: { en: "Lively right now", ko: "지금은 활기참", ja: "今はにぎやか" },
    quick_stop: { en: "Good for a quick stop", ko: "빠르게 들르기 좋음", ja: "短時間で立ち寄りやすい" },
    welcoming: { en: "Welcoming service", ko: "친절한 응대", ja: "親しみやすい対応" },
  } as const
  return labels[tag][locale]
}

export function CanonicalPlaceOverlay() {
  const { state, actions } = useOndoB()
  const [expanded, setExpanded] = useState(() => readBDiscoveryHistory()?.level === "detail")
  const [detail, setDetail] = useState<CanonicalVenueDetail | null>(null)
  const [detailState, setDetailState] = useState<"idle" | "loading" | "ready" | "error">("idle")
  const [detailAttempt, setDetailAttempt] = useState(0)
  const [tableScopeOpen, setTableScopeOpen] = useState(false)
  const [tableClockNow, setTableClockNow] = useState(() => Date.now())
  const tableStartsAtMs = Date.parse(ACTIVE_TABLE_STARTS_AT)
  const tableUpcoming = tableClockNow < tableStartsAtMs
  const [after19Session, setAfter19Session] = useState<GlobalAfter19SessionB>(DEFAULT_GLOBAL_AFTER19_SESSION)
  const [after19Handoff, setAfter19Handoff] = useState(false)
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const layerRef = useRef<HTMLDivElement | null>(null)
  const detailRef = useRef<HTMLElement | null>(null)
  const peekRef = useRef<HTMLDivElement | null>(null)
  const openRef = useRef<HTMLButtonElement | null>(null)
  const peekTraversalFocusPendingRef = useRef(false)
  const after19AccessRef = useRef<HTMLElement | null>(null)
  const tableScopeTriggerRef = useRef<HTMLButtonElement | null>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const venueId = state.surface.kind === "venue" ? state.surface.venueId : undefined
  const venue = venueId ? canonicalMapVenueById(venueId) : undefined
  const locale = state.locale
  const copy = COPY[locale]

  useEffect(() => {
    if (!tableUpcoming) return
    const remaining = tableStartsAtMs - Date.now()
    if (remaining <= 0) {
      setTableClockNow(Date.now())
      return
    }
    const timer = window.setTimeout(() => setTableClockNow(Date.now()), Math.min(remaining + 25, 2_147_000_000))
    return () => window.clearTimeout(timer)
  }, [tableClockNow, tableStartsAtMs, tableUpcoming])

  useEffect(() => {
    peekTraversalFocusPendingRef.current = false
    setDetail(null)
    setDetailState("idle")
    setDetailAttempt(0)
    setTableScopeOpen(false)
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
      peekTraversalFocusPendingRef.current = entry.level === "peek"
      setExpanded(entry.level === "detail")
    }
    window.addEventListener(B_DISCOVERY_TRAVERSAL_EVENT, syncHistory)
    return () => window.removeEventListener(B_DISCOVERY_TRAVERSAL_EVENT, syncHistory)
  }, [venueId])

  useEffect(() => { if (expanded) layerRef.current?.focus({ preventScroll: true }) }, [expanded])

  useEffect(() => {
    if (!venueId || expanded) return
    const storedTraversalFocus = consumeBDiscoveryPeekTraversalFocus(venueId)
    if (peekTraversalFocusPendingRef.current || storedTraversalFocus) {
      let frame: number | null = null
      const focusDetails = (attempt = 0) => {
        const target = openRef.current
        if (target?.isConnected && !target.closest("[inert],[aria-hidden='true']")) {
          target.focus({ preventScroll: true })
          if (document.activeElement === target) {
            peekTraversalFocusPendingRef.current = false
            return
          }
        }
        if (attempt < 7) frame = window.requestAnimationFrame(() => focusDetails(attempt + 1))
        else peekTraversalFocusPendingRef.current = false
      }
      frame = window.requestAnimationFrame(() => focusDetails())
      return () => { if (frame != null) window.cancelAnimationFrame(frame) }
    }
    const active = document.activeElement
    if (!returnFocusRef.current && active instanceof HTMLElement && active !== document.body && active.matches(`[data-venue-opener='${CSS.escape(venueId)}']`)) returnFocusRef.current = active
    const frame = window.requestAnimationFrame(() => peekRef.current?.focus({ preventScroll: true }))
    return () => window.cancelAnimationFrame(frame)
  }, [expanded, venueId])

  useModalIsolation(state.tab === "ondo" && Boolean(venueId) && !after19Handoff, expanded ? layerRef : peekRef)

  useEffect(() => {
    const syncAfter19 = (event?: Event) => {
      const detail = event instanceof CustomEvent ? event.detail : null
      setAfter19Session(detail
        ? sanitizeGlobalAfter19Session(detail)
        : restoreGlobalAfter19B(window.localStorage, window.sessionStorage).session)
    }
    syncAfter19()
    window.addEventListener(GLOBAL_AFTER19_SESSION_EVENT, syncAfter19)
    return () => window.removeEventListener(GLOBAL_AFTER19_SESSION_EVENT, syncAfter19)
  }, [])

  useEffect(() => {
    const pending = restorePlaceAfter19ReturnSession(window.sessionStorage).pending
    setAfter19Handoff(Boolean(pending))

    const requested = () => {
      const latest = restorePlaceAfter19ReturnSession(window.sessionStorage).pending
      if (latest) setAfter19Handoff(true)
    }
    const completed = (event: Event) => {
      const detail = event instanceof CustomEvent ? event.detail as { tokenId?: unknown } : null
      if (!pending || detail?.tokenId !== pending.tokenId) {
        const latest = restorePlaceAfter19ReturnSession(window.sessionStorage)
        if (latest.pending?.venueId === venueId) return
      }
      setAfter19Handoff(false)
      const focusAccess = (attempt = 0) => {
        const target = after19AccessRef.current
        if (target?.isConnected && !target.closest("[inert],[aria-hidden='true']")) {
          target.focus({ preventScroll: true })
          if (document.activeElement === target) return
        }
        if (attempt < 7) window.requestAnimationFrame(() => focusAccess(attempt + 1))
      }
      window.requestAnimationFrame(() => focusAccess())
    }
    window.addEventListener(PLACE_AFTER19_RETURN_REQUEST_EVENT, requested)
    window.addEventListener(PLACE_AFTER19_RETURN_COMPLETE_EVENT, completed)
    return () => {
      window.removeEventListener(PLACE_AFTER19_RETURN_REQUEST_EVENT, requested)
      window.removeEventListener(PLACE_AFTER19_RETURN_COMPLETE_EVENT, completed)
    }
  }, [venueId])

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
    ? `${copy.temperature} · ${pulseLevelLabel(pulse.level, locale)}`
    : `${copy.temperature} ${pulse.score} · ${pulseLevelLabel(pulse.level, locale)}`
  const confidence = ({ high: copy.pulseHigh, medium: copy.pulseMedium, low: copy.pulseLow, limited: copy.pulseLimitedConfidence } as const)[pulse.confidence]
  const fixedSnapshot = pulse.updatedAt
    ? `${pulse.freshness === "growing" ? copy.pulseGrowingSnapshot : copy.pulseFixedSnapshot} · ${pulse.updatedAt.slice(0, 16).replace("T", " ")} UTC`
    : copy.pulseLimited
  const currentVenueId = venue.id
  const currentVenueCity = venue.cityId
  const after19Unlocked = after19Session.mode === "on" && isGlobalAfter19AgeCurrent(after19Session)
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
    peekTraversalFocusPendingRef.current = true
    if (goBackFromBDiscovery("detail")) return
    setExpanded(false)
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
    const alternativeVenue = canonicalMapVenueById(alternativeVenueId)
    if (!alternativeVenue || alternativeVenue.cityId !== currentVenueCity
      || !openBDiscoveryAlternativeVenue(currentVenueId, alternativeVenue.id)) return
    actions.recordRecentVenue(alternativeVenue.id)
    actions.setSurface({ kind: "venue", venueId: alternativeVenue.id })
    setExpanded(false)
  }

  function openTableFromPlace() {
    window.__ONDO_B_TABLE_INTENT__ = { tableId: "table-seoul-night-bites", venueId: currentVenueId, mode: "view" }
    actions.setTab("tables")
    window.setTimeout(() => window.dispatchEvent(new CustomEvent(ONDO_OPEN_TABLE_EVENT, {
      detail: { tableId: "table-seoul-night-bites", venueId: currentVenueId, mode: "view" },
    })), 0)
  }

  function browseAllTables() {
    setTableScopeOpen(false)
    actions.setTab("tables")
  }

  function closeTableScope() {
    const target = tableScopeTriggerRef.current
    setTableScopeOpen(false)
    window.requestAnimationFrame(() => {
      if (target?.isConnected && !target.closest("[inert],[aria-hidden='true']")) target.focus({ preventScroll: true })
    })
  }

  function openAfter19FromPlace() {
    if (after19Unlocked) return
    const historyEntry = readBDiscoveryHistory()
    if (historyEntry?.level !== "detail" || historyEntry.venueId !== currentVenueId || historyEntry.city !== currentVenueCity) return
    const returnTo = createPlaceAfter19Return({
      venueId: currentVenueId,
      cityId: currentVenueCity,
      view: historyEntry.view,
      query: historyEntry.query,
      category: historyEntry.category,
    })
    if (requestPlaceAfter19Return(returnTo)) setAfter19Handoff(true)
  }

  if (!expanded) return (
    <div id="canonical-place-dialog" ref={peekRef} className={styles.peek} role="dialog" aria-modal="true" aria-label={`${name.officialName} · ${name.officialNameLabel}`} tabIndex={-1} data-testid="canonical-place-peek" data-venue-id={venue.id} onKeyDown={handlePeekKeyDown}>
      <div className={styles.grabber} />
      <button type="button" className={styles.close} onClick={close} aria-label={copy.close}><X size={18} /></button>
      <section className={styles.peekIdentityStage} data-testid="canonical-place-identity-stage" data-pulse-level={pulse.level}>
        <div className={styles.placeAtmosphere} data-testid="canonical-place-atmosphere" aria-hidden="true"><i /><i /><i /></div>
        <div className={styles.meta}><span>{district} · {category}</span><i className={styles.srOnly}>{copy.active}</i></div>
        <h2>{name.officialName}</h2>
        <div
          className={`${styles.nameProvenance} ${locale === "ko" ? styles.srOnly : ""}`}
          data-testid="canonical-name-provenance"
          aria-label={`${name.officialNameLabel}: ${name.officialName}. ${name.transliterationLabel}: ${name.transliteration}`}
        >
          <span className={styles.srOnly}>{name.officialNameLabel}</span>
          <strong>{name.transliteration}</strong>
          <small className={styles.srOnly}>{name.transliterationLabel}</small>
        </div>
      </section>
      <section className={styles.pulsePeek} role="group" aria-label={pulseTitle} data-testid="canonical-place-pulse" data-pulse-level={pulse.level} data-pulse-numeric="hidden">
        <span className={styles.pulseVisualLabel} aria-hidden="true">{copy.temperature}</span>
        <span className={styles.pulseVisualMeter} data-testid="canonical-place-temperature-meter" aria-hidden="true"><i /></span>
        <span className={styles.srOnly}>{pulseTitle} · {pulse.signalCount == null ? copy.pulseLimited : `${pulse.signalCount} ${copy.pulseSignals}`} · {fixedSnapshot} · {copy.pulseBoundary}</span>
        {pulse.localEvidence ? <span className={styles.srOnly} data-testid="pulse-local-device-evidence">{copy.pulseLocalEvidence} · {pulse.localEvidence.tags.map((tag) => localTagLabel(tag, locale)).join(" · ")}</span> : null}
      </section>
      <details className={styles.recordSummary} data-testid="canonical-place-source-summary" data-source-presentation="compact-ribbon">
        <summary><span><strong>{copy.source}</strong><small>{copy.activeLicence}</small></span><ChevronRight size={16} /></summary>
        <p>{copy.sourceBoundary}</p>
      </details>
      <div className={styles.peekActions}>
        <a href={directions} target="_blank" rel="noreferrer" data-testid="canonical-venue-directions" data-visual-priority="primary"><Navigation size={17} />{copy.directions}</a>
        <button ref={openRef} type="button" onClick={() => { openBDiscoveryDetail(venue.id); setExpanded(true) }} data-testid="canonical-place-details" data-visual-priority="secondary">{copy.details}<ChevronRight size={17} /></button>
      </div>
    </div>
  )

  return (
    <div id="canonical-place-dialog" ref={layerRef} className={styles.layer} role="dialog" aria-modal="true" aria-labelledby="canonical-place-title" tabIndex={-1} data-testid="canonical-place-overlay" data-venue-id={venue.id} data-save-state={saveStatus} onKeyDown={handleDetailKeyDown}>
      <button type="button" className={styles.backdrop} onClick={closeDetails} aria-label={copy.back} tabIndex={-1} />
      <article ref={detailRef} className={styles.detail}>
        <header>
          <button ref={closeRef} type="button" onClick={closeDetails} aria-label={copy.back}><ArrowLeft size={19} /></button>
          <span>{district}</span>
          <button type="button" onClick={close} aria-label={copy.close}><X size={19} /></button>
        </header>
        <div className={styles.body}>
          <section className={styles.detailIdentityStage} data-testid="canonical-place-identity-stage" data-pulse-level={pulse.level}>
            <div className={styles.placeAtmosphere} data-testid="canonical-place-atmosphere" aria-hidden="true"><i /><i /><i /></div>
            <p className={styles.eyebrow}>{district} · {category}</p>
            <h2 id="canonical-place-title">{name.officialName}</h2>
            <div
              className={`${styles.detailNameProvenance} ${locale === "ko" ? styles.srOnly : ""}`}
              data-testid="canonical-detail-name-provenance"
              aria-label={`${name.officialNameLabel}: ${name.officialName}. ${name.transliterationLabel}: ${name.transliteration}`}
            >
              <span className={styles.srOnly}>{name.officialNameLabel}</span>
              <strong>{name.transliteration}</strong>
              <small className={styles.srOnly}>{name.transliterationLabel}</small>
            </div>
            {detailState === "error" ? (
              <section className={styles.detailError} role="alert" data-detail-state="error" data-address-truth="ERROR">
                <p><MapPin size={16} />{copy.detailUnavailable}</p>
                <button type="button" onClick={() => { setDetail(null); setDetailState("loading"); setDetailAttempt((attempt) => attempt + 1) }}>{copy.retryDetail}</button>
              </section>
            ) : (
              <p className={styles.address} role={detailState === "loading" ? "status" : undefined} aria-live={detailState === "loading" ? "polite" : undefined} data-detail-state={detailState} data-address-truth={addressEvidence?.truth ?? (detailState === "ready" ? "UNKNOWN" : detailState.toUpperCase())}><MapPin size={16} />{address}</p>
            )}
          </section>

          <details className={styles.pulsePanel} data-testid="canonical-place-pulse" data-pulse-level={pulse.level} data-pulse-numeric="hidden">
            <summary aria-label={pulseTitle}>
              <div><span>{copy.temperature}</span><h3 className={styles.srOnly}>{pulseTitle}</h3><span className={styles.pulseVisualMeter} data-testid="canonical-place-temperature-meter" aria-hidden="true"><i /></span></div>
              <ChevronRight size={18} aria-hidden="true" />
            </summary>
            <div className={styles.pulsePanelBody}>
            <p className={styles.pulseBoundary}>{copy.pulseBoundary}</p>
            <dl>
              {pulse.score == null ? null : <div data-testid="pulse-score"><dt>{copy.temperature}</dt><dd>{pulse.score}</dd></div>}
              {pulse.signalCount == null ? null : <div data-testid="pulse-signal-count"><dt>{copy.pulseSignals}</dt><dd>{pulse.signalCount}</dd></div>}
              <div data-testid="pulse-confidence"><dt>{copy.pulseConfidence}</dt><dd>{confidence}</dd></div>
              <div><dt>{copy.pulseFreshness}</dt><dd>{fixedSnapshot}</dd></div>
            </dl>
            <div className={styles.pulseEvidence} data-testid="pulse-evidence">
              <strong>{copy.pulseEvidence}</strong>
              <ul>{pulse.evidence.map((item, index) => <li key={`${item.origin}-${index}`} data-origin={item.origin}>{item.label[locale].replace(/walkthrough/gi, "curated visit").replace(/둘러보기/g, "방문")}</li>)}</ul>
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
                  return <button key={alternative.venueId} type="button" data-testid="pulse-alternative" data-venue-id={alternative.venueId} aria-label={`${copy.pulseAlternative}: ${alternativeName}, ${copy.temperature} ${alternative.score}, ${pulseLevelLabel(alternative.level, locale)}`} onClick={() => openPulseAlternative(alternative.venueId)}><span><strong>{alternativeName}</strong><small>{copy.temperature} {alternative.score} · {pulseLevelLabel(alternative.level, locale)}</small></span><ChevronRight size={17} aria-hidden="true" /></button>
                })}</div>
              </section>
            ) : null}
            </div>
          </details>

          <div className={styles.decisionActions} data-testid="canonical-place-decisions">
            <a href={directions} target="_blank" rel="noreferrer" data-testid="canonical-venue-primary-directions" data-visual-priority="primary"><Navigation size={18} />{copy.directions}</a>
            <button type="button" onClick={toggleSave} aria-pressed={saved} data-testid="canonical-venue-save" data-visual-priority="secondary"><Bookmark size={18} />{saved ? copy.removeSaved : copy.save}</button>
          </div>

          <section ref={after19AccessRef} className={styles.after19Access} tabIndex={-1} aria-label={`${copy.after19Preview} · ${after19Unlocked ? copy.after19Ready : copy.after19Unlock}`} data-testid="canonical-after19-access" data-after19-focus-target="persistent" data-after19-venue-status={after19Unlocked ? "unlocked" : "locked"} data-after19-venue-id={currentVenueId}>
            <MoonStar size={18} aria-hidden="true" />
            <span><strong>{copy.after19Preview}</strong></span>
            {after19Unlocked ? <em role="status"><BadgeCheck size={15} aria-hidden="true" />{copy.after19Ready}</em> : <button type="button" onClick={openAfter19FromPlace} data-testid="canonical-after19-unlock" data-visual-priority="secondary">{copy.after19Unlock}<ChevronRight size={15} aria-hidden="true" /></button>}
          </section>

          {currentVenueId === TABLE_VENUE_ID ? (
            <section className={styles.tableActions} aria-label={locale === "ko" ? "이 장소의 테이블" : locale === "ja" ? "この場所のテーブル" : "Table at this place"}>
              <button type="button" className={styles.tablePrimary} onClick={openTableFromPlace} data-testid="canonical-place-table">
                <UsersRound size={18} aria-hidden="true" />
                <span><strong>{copy.table}</strong><small>{tableUpcoming ? copy.tableBody : copy.tableClosedBody}</small></span>
                <ChevronRight size={17} aria-hidden="true" />
              </button>
              <aside className={styles.eligibilityChip} data-testid="canonical-after19-required">
                <BadgeCheck size={18} aria-hidden="true" />
                <span><strong>{copy.after19}</strong><small>{copy.after19Body}</small></span>
              </aside>
            </section>
          ) : (
            <section className={styles.tableActions} aria-label={copy.tablesAtPlace} data-testid="venue-table-scope" data-empty-state={tableScopeOpen ? "open" : "closed"}>
              <button ref={tableScopeTriggerRef} type="button" className={styles.tablePrimary} data-testid="canonical-venue-tables" aria-expanded={tableScopeOpen} onClick={() => setTableScopeOpen((open) => !open)}>
                <UsersRound size={18} aria-hidden="true" />
                <span><strong>{copy.tablesAtPlace}</strong><small>{copy.noTables}</small></span>
                <ChevronRight size={17} aria-hidden="true" />
              </button>
              {tableScopeOpen ? <div className={styles.tableEmpty} data-testid="venue-tables-empty">
                <strong role="status">{copy.noTables}</strong><p>{copy.noTablesBody}</p>
                <div><button type="button" data-testid="tables-back-to-venue" onClick={closeTableScope}>{copy.backToPlace}</button><button type="button" data-testid="tables-browse-all" onClick={browseAllTables}>{copy.browseTables}</button></div>
              </div> : null}
            </section>
          )}

          <section className={styles.demoOfferAction} aria-label={copy.demoOffer}>
            <button type="button" onClick={() => actions.openMealBenefitFromPlace(currentVenueId)} data-testid="canonical-meal-benefit-open">
              <WalletCards size={18} aria-hidden="true" />
              <span><strong>{copy.demoOffer}</strong><small>{copy.demoOfferBody}</small></span>
              <ChevronRight size={17} aria-hidden="true" />
            </button>
          </section>

          <section className={styles.localSignalAction}>
            <button type="button" onClick={() => actions.openLocalSignal(currentVenueId)} data-testid="canonical-local-signal-open">
              <NotebookPen size={18} aria-hidden="true" />
              <span><strong>{localSignalPosted ? copy.localSignalPosted : copy.localSignal}</strong><small>{copy.localSignalBoundary}</small></span>
              <ChevronRight size={17} aria-hidden="true" />
            </button>
          </section>

          {saveStatus === "SAV-FAILED" ? <section className={styles.saveError} role="alert" data-testid="canonical-save-error"><p>{copy.saveFailed}</p><button type="button" onClick={() => actions.saveVenue(currentVenueId)} data-testid="canonical-save-retry" data-visual-priority="primary">{copy.retrySave}</button></section> : null}

          <details className={styles.sourceEvidence} data-testid="canonical-source-evidence" data-source-presentation="progressive-details">
            <summary><span><strong>{copy.source}</strong><small>{copy.activeLicence}</small></span><ChevronRight size={17} /></summary>
            <div className={styles.sourceDisclosureBody}>
              <p>{copy.sourceBoundary}</p>
              <dl>
                <div><dt>{copy.category}</dt><dd>{evidenceValue(detail?.sourceCategory.value, copy.unknown)}</dd></div>
                <div><dt>{copy.licence}</dt><dd>{detail?.licenseStatus.value === "ACTIVE_LICENSE_RECORD" ? copy.activeLicence : copy.unknown}</dd></div>
                <div><dt>{copy.opened}</dt><dd>{sourceDate(detail?.licenseOpenedAt.value, copy.unknown)}</dd></div>
                <div><dt>{copy.modified}</dt><dd>{sourceDate(detail?.sourceModifiedAt.value, copy.unknown)}</dd></div>
              </dl>
            </div>
          </details>

          <section className={styles.before}>
            <h3>{copy.before}</h3>
            {[
              [copy.hours, evidenceValue(detail?.facts.openingHours.value, copy.unknown)],
              [copy.card, evidenceValue(detail?.facts.foreignCardAccepted.value, copy.unknown)],
              [copy.menu, evidenceValue(detail?.facts.menu.value, copy.unknown)],
              [copy.language, evidenceValue(detail?.facts.englishSupport.value, copy.unknown)],
            ].map(([label, value]) => <div key={label}><CircleHelp size={17} /><span><strong>{label}</strong><small>{value}</small></span></div>)}
          </section>

          <details className={styles.source} data-detail-source={detail?.address.road.sourceRefId ?? detail?.address.lot.sourceRefId ?? "NOT_LOADED"} data-source-presentation="progressive-details">
            <summary><span><strong>{copy.sourceReference}</strong><small>MOIS LOCALDATA</small></span><ChevronRight size={17} /></summary>
            <div className={styles.sourceDisclosureBody}>
              <p>{copy.sourceBody}</p>
              <dl>
                <div><dt>{copy.sourceSnapshot}</dt><dd>{venue.sourceSnapshotAt.slice(0, 10)}</dd></div>
                <div><dt>{copy.sourceRecord}</dt><dd>{detail?.sourceIds.moisManagementId ?? copy.unknownShort}</dd></div>
                <div><dt>{copy.sourceReference}</dt><dd>MOIS LOCALDATA</dd></div>
              </dl>
            </div>
          </details>
        </div>
      </article>
    </div>
  )
}
