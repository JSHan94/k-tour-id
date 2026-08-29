"use client"

import type { KeyboardEvent } from "react"
import { useEffect, useRef, useState } from "react"
import { AlertTriangle, ChevronRight, MoonStar, RotateCcw, ShieldCheck, X } from "lucide-react"
import { canonicalMapVenueById } from "@/lib/ondo/venues/map-data"
import { venueDisplayName } from "@/lib/ondo/venues/display"
import { restoreBDiscoveryCityContext, restoreBDiscoveryVenueContext } from "../map/b-discovery-history"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import { useModalIsolation } from "../shared/ui/use-modal-isolation"
import { readQaRuntime } from "../shared/ui/use-qa-controls"
import {
  canAutoOpenGlobalAfter19B,
  completeGlobalAfter19AgeB,
  DEFAULT_GLOBAL_AFTER19_PREFERENCE,
  DEFAULT_GLOBAL_AFTER19_SESSION,
  GLOBAL_AFTER19_PREFERENCE_KEY,
  GLOBAL_AFTER19_SESSION_EVENT,
  GLOBAL_AFTER19_SESSION_KEY,
  isGlobalAfter19AgeCurrent,
  restoreGlobalAfter19B,
  type GlobalAfter19PreferenceB,
  type GlobalAfter19SessionB,
} from "./after19-global-b-model"
import {
  completePlaceAfter19Return,
  isPlaceAfter19ReturnPending,
  persistPlaceAfter19ReturnSession,
  PLACE_AFTER19_RETURN_REQUEST_EVENT,
  renewPlaceAfter19Return,
  requestPlaceAfter19Return,
  restorePlaceAfter19ReturnSession,
  type PlaceAfter19ReturnB,
  type PlaceAfter19ReturnOutcomeB,
} from "./after19-place-return-b-model"
import styles from "./after19-global-b.module.css"

export type GlobalAfter19ContextB = {
  cityId: "seoul" | "busan" | "jeju"
  cityLabel: string
  venueId: string | null
  venueLabel: string | null
}

type GlobalAfter19BProps = {
  locale: OndoBLocale
  context: GlobalAfter19ContextB
  onActiveChange?(active: boolean, activation: GlobalAfter19SessionB["activation"]): void
}

type Notice = "off" | "expired" | null
type GateView = "intro" | "failure" | "unavailable" | "expired"

const FOCUSABLE = "button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex='-1'])"

const COPY = {
  en: {
    chip: "After 19",
    chipLabel: "Open After 19",
    active: "After 19 on",
    activeAuto: "Opened after 19:00 KST",
    activeManual: "Opened for this tab",
    turnOff: "Turn off After 19 now",
    header: "19+ · After 19",
    title: "Turn on After 19?",
    body: "For this experience, a temporary 19+ result stays on this device. No identity provider is contacted.",
    truth: "Narrows this map to official business types associated with bars and pubs. Actual alcohol service, entry and age rules are not confirmed.",
    jejuTruth: "Jeju keeps its editorial places and stories; ONDO does not infer pubs or cafés from those sources.",
    context: "Return to",
    venue: "Selected place",
    city: "Current map",
    boundary: "What this changes",
    boundaryBody: "No OpenDID provider is connected and no credential is issued. The temporary result does not confirm opening hours, alcohol service, admission, or a venue restriction. Your date of birth is never requested or stored.",
    auto: "Open after 19:00 KST when eligible",
    primary: "Turn on After 19",
    cancel: "Stay on this map",
    failedTitle: "After 19 did not turn on",
    failedBody: "Your city, selected place, filters, and map position are unchanged.",
    unavailableTitle: "19+ check is unavailable",
    unavailableBody: "Nothing changed. Retry the private predicate check or stay on this map.",
    expiredReturnTitle: "This return request expired",
    expiredReturnBody: "Check 19+ again or stay with the restored Place context.",
    missingVenue: "That place is no longer available. Return to the same city discovery view.",
    retry: "Try again",
    offNotice: "After 19 is off for this tab and will not reopen automatically.",
    undo: "Turn back on",
    expired: "The 19+ result expired. The same map remains open.",
    checkAgain: "Check again",
    dismiss: "Dismiss",
  },
  ko: {
    chip: "After 19",
    chipLabel: "After 19 열기",
    active: "After 19 켜짐",
    activeAuto: "한국 시간 19:00 이후 자동으로 열림",
    activeManual: "이 탭에서 직접 열림",
    turnOff: "After 19 바로 끄기",
    header: "19+ · After 19",
    title: "After 19을 켤까요?",
    body: "이 경험에서는 임시 19+ 결과가 이 기기에만 남아요. 신원확인 기관에는 연결하지 않습니다.",
    truth: "공식 업태상 주점에 해당하는 장소만 모아 보여줘요. 실제 주류 제공·입장·연령 조건은 확인되지 않았어요.",
    jejuTruth: "제주는 편집 장소와 여행 이야기를 그대로 보여주며, 해당 출처로 주점·카페를 추정하지 않아요.",
    context: "돌아갈 곳",
    venue: "선택한 장소",
    city: "현재 지도",
    boundary: "바뀌는 내용",
    boundaryBody: "OpenDID 제공기관에 연결하거나 자격증명을 발급하지 않아요. 임시 결과는 영업시간·주류 제공·입장 가능 여부나 장소 제한을 확인하지 않으며, 생년월일도 요청하거나 저장하지 않습니다.",
    auto: "조건 충족 시 한국 시간 19:00 이후 자동으로 열기",
    primary: "After 19 켜기",
    cancel: "이 지도에 머물기",
    failedTitle: "After 19을 켜지 못했어요",
    failedBody: "도시·선택 장소·필터·지도 위치는 그대로 유지됩니다.",
    unavailableTitle: "19+ 확인을 사용할 수 없어요",
    unavailableBody: "바뀐 내용은 없어요. 비공개 조건 확인을 다시 시도하거나 이 지도에 머물 수 있어요.",
    expiredReturnTitle: "장소 복귀 요청이 만료됐어요",
    expiredReturnBody: "19+를 다시 확인하거나 복구된 장소 탐색 화면에 머물 수 있어요.",
    missingVenue: "해당 장소를 더 이상 찾을 수 없어 같은 도시의 탐색 화면으로 돌아갑니다.",
    retry: "다시 시도",
    offNotice: "이 탭에서 After 19를 껐으며 자동으로 다시 열리지 않습니다.",
    undo: "다시 켜기",
    expired: "19+ 결과가 만료됐어요. 같은 지도는 그대로 열려 있습니다.",
    checkAgain: "다시 확인",
    dismiss: "닫기",
  },
  ja: {
    chip: "After 19",
    chipLabel: "After 19を開く",
    active: "After 19 オン",
    activeAuto: "韓国時間19:00以降に自動で開始",
    activeManual: "このタブで開始",
    turnOff: "After 19を今すぐオフにする",
    header: "19+ · After 19",
    title: "After 19をオンにしますか？",
    body: "この体験では一時的な19歳以上の結果を端末内だけに残します。本人確認事業者には接続しません。",
    truth: "公式業態で居酒屋・パブに当たる場所だけを表示します。実際の酒類提供、入店、年齢条件は確認していません。",
    jejuTruth: "済州では編集スポットとストーリーをそのまま表示し、その情報源からパブやカフェを推定しません。",
    context: "戻る場所",
    venue: "選択中の場所",
    city: "現在の地図",
    boundary: "変更される内容",
    boundaryBody: "OpenDID事業者には接続せず、資格情報も発行しません。一時的な結果は営業時間、酒類提供、入場可否、施設制限を確認するものではなく、生年月日も要求・保存しません。",
    auto: "条件を満たす場合、韓国時間19:00以降に自動で開く",
    primary: "After 19をオンにする",
    cancel: "この地図にとどまる",
    failedTitle: "After 19をオンにできませんでした",
    failedBody: "都市、選択中の場所、フィルター、地図位置は変わっていません。",
    unavailableTitle: "19歳以上の確認を利用できません",
    unavailableBody: "変更はありません。非公開の条件確認を再試行するか、この地図にとどまれます。",
    expiredReturnTitle: "場所への復帰リクエストの有効期限が切れました",
    expiredReturnBody: "19歳以上をもう一度確認するか、復元した場所の探索画面にとどまれます。",
    missingVenue: "この場所は利用できなくなったため、同じ都市の探索画面に戻ります。",
    retry: "もう一度試す",
    offNotice: "このタブではAfter 19をオフにし、自動では再開しません。",
    undo: "もう一度オンにする",
    expired: "19+結果の有効期限が切れました。同じ地図は開いたままです。",
    checkAgain: "もう一度確認",
    dismiss: "閉じる",
  },
} as const satisfies Record<OndoBLocale, Record<string, string>>

function writeStorage(storage: Storage, key: string, value: unknown) {
  try {
    storage.setItem(key, JSON.stringify(value))
  } catch {
    // The in-memory tab state remains usable when browser storage is blocked.
  }
}

export function GlobalAfter19B({ locale, context, onActiveChange }: GlobalAfter19BProps) {
  const [hydrated, setHydrated] = useState(false)
  const [preference, setPreference] = useState<GlobalAfter19PreferenceB>(DEFAULT_GLOBAL_AFTER19_PREFERENCE)
  const [session, setSession] = useState<GlobalAfter19SessionB>(DEFAULT_GLOBAL_AFTER19_SESSION)
  const [clock, setClock] = useState(() => new Date())
  const [gateOpen, setGateOpen] = useState(false)
  const [gateView, setGateView] = useState<GateView>("intro")
  const [placeReturn, setPlaceReturn] = useState<PlaceAfter19ReturnB | null>(null)
  const [notice, setNotice] = useState<Notice>(null)
  const layerRef = useRef<HTMLDivElement | null>(null)
  const dialogRef = useRef<HTMLElement | null>(null)
  const chipRef = useRef<HTMLButtonElement | null>(null)
  const primaryRef = useRef<HTMLButtonElement | null>(null)
  const activeOffRef = useRef<HTMLButtonElement | null>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const consumedQaOutcomeRef = useRef<"failure" | "unavailable" | null>(null)
  const t = COPY[locale]

  useModalIsolation(gateOpen, layerRef)

  useEffect(() => {
    const restored = restoreGlobalAfter19B(window.localStorage, window.sessionStorage, new Date())
    setPreference(restored.preference)
    setSession(restored.session)
    setNotice(restored.session.expiryNotice ? "expired" : null)
    writeStorage(window.localStorage, GLOBAL_AFTER19_PREFERENCE_KEY, restored.preference)
    writeStorage(window.sessionStorage, GLOBAL_AFTER19_SESSION_KEY, restored.session)
    const restoredReturn = restorePlaceAfter19ReturnSession(window.sessionStorage)
    persistPlaceAfter19ReturnSession(window.sessionStorage, restoredReturn)
    if (restoredReturn.pending) {
      setPlaceReturn(restoredReturn.pending)
      setGateView(isPlaceAfter19ReturnPending(restoredReturn.pending) ? "intro" : "expired")
      setGateOpen(true)
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    const requested = (event: Event) => {
      const tokenId = event instanceof CustomEvent ? (event.detail as { tokenId?: unknown } | null)?.tokenId : null
      const restored = restorePlaceAfter19ReturnSession(window.sessionStorage)
      if (!restored.pending || restored.pending.tokenId !== tokenId) return
      setPlaceReturn(restored.pending)
      setGateView(isPlaceAfter19ReturnPending(restored.pending) ? "intro" : "expired")
      setNotice(null)
      setGateOpen(true)
    }
    window.addEventListener(PLACE_AFTER19_RETURN_REQUEST_EVENT, requested)
    return () => window.removeEventListener(PLACE_AFTER19_RETURN_REQUEST_EVENT, requested)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const syncSession = () => {
      const now = new Date()
      const restored = restoreGlobalAfter19B(window.localStorage, window.sessionStorage, now)
      setClock(now)
      setSession(restored.session)
      setNotice(restored.session.expiryNotice ? "expired" : null)
      writeStorage(window.sessionStorage, GLOBAL_AFTER19_SESSION_KEY, restored.session)
    }
    window.addEventListener(GLOBAL_AFTER19_SESSION_EVENT, syncSession)
    return () => window.removeEventListener(GLOBAL_AFTER19_SESSION_EVENT, syncSession)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    onActiveChange?.(session.mode === "on", session.activation)
  }, [hydrated, onActiveChange, session.activation, session.mode])

  useEffect(() => {
    if (!hydrated) return
    if (session.age === "eligible" && !isGlobalAfter19AgeCurrent(session, clock)) {
      commitSession({
        version: 1,
        age: "unverified",
        ageExpiresAt: null,
        eligibilityReceipt: null,
        mode: "off",
        activation: null,
        expiryNotice: true,
      })
      setNotice("expired")
      return
    }
    const autoEligible = canAutoOpenGlobalAfter19B(preference, session, clock)
    if (session.mode === "off" && autoEligible) {
      commitSession({ ...session, mode: "on", activation: "auto", expiryNotice: false })
    } else if (session.mode === "on" && session.activation === "auto" && !autoEligible) {
      commitSession({ ...session, mode: "off", activation: null })
    }
  }, [clock, hydrated, preference, session])

  useEffect(() => {
    if (placeReturn && !isPlaceAfter19ReturnPending(placeReturn, clock)) setGateView("expired")
  }, [clock, placeReturn])

  useEffect(() => {
    if (!gateOpen) return
    const frame = window.requestAnimationFrame(() => primaryRef.current?.focus({ preventScroll: true }))
    return () => window.cancelAnimationFrame(frame)
  }, [gateOpen, gateView])

  useEffect(() => {
    if (!gateOpen) return
    const ownEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape" || !dialogRef.current?.contains(document.activeElement)) return
      event.preventDefault()
      event.stopImmediatePropagation()
      cancelGate()
    }
    document.addEventListener("keydown", ownEscape, true)
    return () => document.removeEventListener("keydown", ownEscape, true)
  }, [gateOpen, placeReturn])

  function commitSession(next: GlobalAfter19SessionB) {
    setSession(next)
    writeStorage(window.sessionStorage, GLOBAL_AFTER19_SESSION_KEY, next)
    window.dispatchEvent(new CustomEvent(GLOBAL_AFTER19_SESSION_EVENT, { detail: next }))
  }

  function commitPreference(next: GlobalAfter19PreferenceB) {
    setPreference(next)
    writeStorage(window.localStorage, GLOBAL_AFTER19_PREFERENCE_KEY, next)
  }

  function openGate() {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : chipRef.current
    setPlaceReturn(null)
    setGateView("intro")
    consumedQaOutcomeRef.current = null
    setNotice(null)
    setGateOpen(true)
  }

  function restoreOpener() {
    window.requestAnimationFrame(() => {
      const opener = openerRef.current
      const target = opener?.isConnected && !opener.closest("[inert],[aria-hidden='true']") ? opener : chipRef.current
      target?.focus({ preventScroll: true })
    })
  }

  function cancelGate() {
    if (placeReturn) {
      finishPlaceReturn("cancel")
      return
    }
    setGateOpen(false)
    restoreOpener()
  }

  function runCheck() {
    const now = new Date()
    setClock(now)
    if (placeReturn && !isPlaceAfter19ReturnPending(placeReturn, now)) {
      setGateView("expired")
      return
    }
    const qa = readQaRuntime<{ after19Global?: "failure" | "unavailable" }>()
    const qaOutcome = qa?.after19Global
    if (qaOutcome && consumedQaOutcomeRef.current !== qaOutcome) {
      consumedQaOutcomeRef.current = qaOutcome
      setGateView(qaOutcome)
      return
    }
    if (placeReturn) {
      if (!finishPlaceReturn("success", now)) return
      commitSession(completeGlobalAfter19AgeB(now))
    } else {
      commitSession(completeGlobalAfter19AgeB(now))
      setGateOpen(false)
      window.requestAnimationFrame(() => activeOffRef.current?.focus({ preventScroll: true }))
    }
  }

  function restorePlaceContext(returnTo: PlaceAfter19ReturnB) {
    const venue = canonicalMapVenueById(returnTo.venueId)
    const restored = venue?.cityId === returnTo.cityId
      ? restoreBDiscoveryVenueContext({
          city: returnTo.cityId,
          view: returnTo.view,
          query: returnTo.query,
          category: returnTo.category,
          venueId: returnTo.venueId,
          level: returnTo.level,
        })
      : restoreBDiscoveryCityContext({
          city: returnTo.cityId,
          view: returnTo.view,
          query: returnTo.query,
          category: returnTo.category,
          focus: returnTo.view === "list" ? "search" : "view-toggle",
        })
    if (restored) window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }))
    return Boolean(restored && venue?.cityId === returnTo.cityId)
  }

  function focusPlaceDestination(returnTo: PlaceAfter19ReturnB, exactVenue: boolean, attempt = 0) {
    const target = exactVenue
      ? document.querySelector<HTMLElement>(`[data-testid='canonical-after19-access'][data-after19-venue-id='${CSS.escape(returnTo.venueId)}']`)
      : document.querySelector<HTMLElement>(returnTo.view === "list" ? "[data-testid='ondo-b-search']" : "[data-testid='ondo-b-view-toggle']")
    if (target?.isConnected && !target.closest("[inert],[aria-hidden='true']")) {
      target.focus({ preventScroll: true })
      if (document.activeElement === target) return
    }
    if (attempt < 9) window.requestAnimationFrame(() => focusPlaceDestination(returnTo, exactVenue, attempt + 1))
  }

  function finishPlaceReturn(outcome: PlaceAfter19ReturnOutcomeB, now = new Date()) {
    if (!placeReturn) return false
    const exactVenue = restorePlaceContext(placeReturn)
    const consumed = completePlaceAfter19Return(placeReturn, outcome, now)
    if (!consumed) {
      setGateView("expired")
      return false
    }
    setPlaceReturn(null)
    setGateOpen(false)
    window.requestAnimationFrame(() => focusPlaceDestination(placeReturn, exactVenue))
    return true
  }

  function retryExpiredPlaceReturn() {
    if (!placeReturn) return
    const venue = canonicalMapVenueById(placeReturn.venueId)
    if (!venue || venue.cityId !== placeReturn.cityId) {
      finishPlaceReturn("cancel")
      return
    }
    const now = new Date()
    setClock(now)
    const renewed = renewPlaceAfter19Return(placeReturn, now)
    if (!requestPlaceAfter19Return(renewed, now)) {
      setGateView("failure")
      return
    }
    setPlaceReturn(renewed)
    setGateView("intro")
  }

  function turnOff() {
    commitSession({ ...session, mode: "manual-off", activation: null, expiryNotice: false })
    setNotice("off")
    window.requestAnimationFrame(() => chipRef.current?.focus({ preventScroll: true }))
  }

  function undoOff() {
    if (isGlobalAfter19AgeCurrent(session, clock)) {
      commitSession({ ...session, mode: "on", activation: "manual", expiryNotice: false })
      setNotice(null)
      window.requestAnimationFrame(() => activeOffRef.current?.focus({ preventScroll: true }))
    } else {
      openGate()
    }
  }

  function dismissNotice() {
    setNotice(null)
    if (session.expiryNotice) commitSession({ ...session, expiryNotice: false })
    window.requestAnimationFrame(() => chipRef.current?.focus({ preventScroll: true }))
  }

  function handleGateKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault()
      event.stopPropagation()
      cancelGate()
      return
    }
    if (event.key !== "Tab") return
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
      .filter((element) => element.offsetParent !== null)
    const first = focusable[0]
    const last = focusable.at(-1)
    if (!first || !last) {
      event.preventDefault()
      dialogRef.current?.focus({ preventScroll: true })
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus({ preventScroll: true })
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus({ preventScroll: true })
    }
  }

  if (!hydrated) return null

  const returnVenue = placeReturn ? canonicalMapVenueById(placeReturn.venueId) : null
  const returnVenueLabel = returnVenue ? venueDisplayName(returnVenue.name.ko, locale) : null
  const returnCityLabel = placeReturn
    ? ({
        en: { seoul: "Seoul", busan: "Busan", jeju: "Jeju" },
        ko: { seoul: "서울", busan: "부산", jeju: "제주" },
        ja: { seoul: "ソウル", busan: "釜山", jeju: "済州" },
      } as const)[locale][placeReturn.cityId]
    : context.cityLabel
  const contextLabel = returnVenueLabel ?? (placeReturn ? returnCityLabel : context.venueLabel ?? context.cityLabel)
  const contextKind = returnVenueLabel || (!placeReturn && context.venueLabel) ? t.venue : t.city
  const returnCityId = placeReturn?.cityId ?? context.cityId
  const returnVenueId = placeReturn?.venueId ?? context.venueId

  return (
    <div
      className={styles.root}
      data-testid="ondo-b-after19-global"
      data-after19-mode={session.mode}
      data-after19-activation={session.activation ?? "none"}
      data-after19-age={session.age}
      data-after19-age-expires-at={session.ageExpiresAt ?? "none"}
      data-after19-predicate={session.eligibilityReceipt?.predicate ?? "none"}
      data-after19-issuer-type={session.eligibilityReceipt?.issuerType ?? "none"}
      data-context-city={context.cityId}
      data-context-venue={context.venueId ?? "none"}
    >
      {session.mode !== "on" ? (
        <button ref={chipRef} type="button" className={styles.chip} onClick={openGate} data-testid="global-after19-toggle" aria-label={t.chipLabel}>
          <MoonStar size={17} aria-hidden="true" /><span>{t.chip}</span>
        </button>
      ) : (
        <section className={styles.banner} data-testid="global-after19-banner" data-activation={session.activation ?? "manual"}>
          <MoonStar size={19} aria-hidden="true" />
          <span role="status"><strong>{t.active}</strong><small>{session.activation === "auto" ? t.activeAuto : t.activeManual} · {context.cityLabel}</small></span>
          <button ref={activeOffRef} type="button" onClick={turnOff} aria-label={t.turnOff}><MoonStar size={17} aria-hidden="true" /></button>
        </section>
      )}

      {notice ? (
        <section className={styles.notice} role="status" data-testid={notice === "expired" ? "global-after19-expiry-notice" : "global-after19-off-notice"}>
          <span>{notice === "expired" ? t.expired : t.offNotice}</span>
          <button type="button" onClick={notice === "expired" ? openGate : undoOff}>{notice === "expired" ? t.checkAgain : t.undo}</button>
          <button type="button" className={styles.noticeDismiss} onClick={dismissNotice} aria-label={t.dismiss}><X size={16} aria-hidden="true" /></button>
        </section>
      ) : null}

      {gateOpen ? (
        <div ref={layerRef} className={styles.layer} data-testid="global-after19-prompt-layer">
          <div className={styles.backdrop} aria-hidden="true" />
          <section ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="global-after19-title" tabIndex={-1} data-gate-view={gateView} onKeyDown={handleGateKeyDown}>
            <header className={styles.dialogHeader}><span><ShieldCheck size={18} aria-hidden="true" />{t.header}</span><i aria-hidden="true" /></header>
            <div className={styles.body}>
              {gateView === "failure" || gateView === "unavailable" ? <AlertTriangle className={styles.heroFailure} size={27} aria-hidden="true" /> : <MoonStar className={styles.hero} size={27} aria-hidden="true" />}
              <h2 id="global-after19-title">{gateView === "failure" ? t.failedTitle : gateView === "unavailable" ? t.unavailableTitle : gateView === "expired" ? t.expiredReturnTitle : t.title}</h2>
              <p className={styles.lead}>{gateView === "failure" ? t.failedBody : gateView === "unavailable" ? t.unavailableBody : gateView === "expired" ? t.expiredReturnBody : t.body}</p>
              <p className={styles.truth}><ShieldCheck size={16} aria-hidden="true" />{context.cityId === "jeju" ? t.jejuTruth : t.truth}</p>
              <section className={styles.returnContext} data-testid="global-after19-return-context" data-return-cta={placeReturn?.cta ?? "OPEN_AFTER19"} data-return-city={returnCityId} data-return-venue={returnVenueId ?? "none"} data-return-level={placeReturn?.level ?? (context.venueId ? "detail" : "city")} data-return-focus={placeReturn?.focusTarget ?? "global-after19-toggle"}>
                <small>{t.context} · {contextKind}</small>
                <strong>{contextLabel}</strong>
                {returnVenueLabel || (!placeReturn && context.venueLabel) ? <span>{returnCityLabel}</span> : null}
                {placeReturn && !returnVenue ? <span>{t.missingVenue}</span> : null}
              </section>
              {gateView === "intro" ? (
                <>
                  <details className={styles.boundary}><summary>{t.boundary}<ChevronRight size={16} aria-hidden="true" /></summary><p>{t.boundaryBody}</p></details>
                  <button type="button" role="switch" aria-checked={preference.autoOpen} className={styles.autoSetting} onClick={() => commitPreference({ version: 1, autoOpen: !preference.autoOpen })}>
                    <span>{t.auto}</span><i aria-hidden="true"><b /></i>
                  </button>
                </>
              ) : null}
              <div className={styles.actions}>
                <button ref={primaryRef} type="button" className={styles.primary} data-testid={gateView === "failure" || gateView === "unavailable" || gateView === "expired" ? "global-after19-retry" : "global-after19-confirm"} onClick={gateView === "expired" ? retryExpiredPlaceReturn : runCheck}>
                  {gateView === "failure" || gateView === "unavailable" || gateView === "expired" ? <RotateCcw size={17} aria-hidden="true" /> : <ShieldCheck size={17} aria-hidden="true" />}
                  {gateView === "failure" || gateView === "unavailable" || gateView === "expired" ? t.retry : t.primary}
                </button>
                <button type="button" className={styles.secondary} data-testid="global-after19-cancel" onClick={cancelGate}>{t.cancel}</button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
