"use client"

import type { KeyboardEvent } from "react"
import { useEffect, useRef, useState } from "react"
import { AlertTriangle, ChevronRight, MoonStar, RotateCcw, ShieldCheck, X } from "lucide-react"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import { useModalIsolation } from "../shared/ui/use-modal-isolation"
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
type GateView = "intro" | "failure"

const FOCUSABLE = "button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex='-1'])"

const COPY = {
  en: {
    chip: "After 19",
    chipLabel: "Open After 19",
    active: "After 19 on",
    activeAuto: "Opened after 19:00 KST",
    activeManual: "Opened for this tab",
    turnOff: "Turn off After 19 now",
    header: "19+ · ONDO preview",
    title: "Open ONDO’s After 19 preview?",
    body: "Use a 19+ eligibility result in this tab, then return to the same map.",
    truth: "This is an ONDO presentation choice, not an official restriction for this place.",
    context: "Return to",
    venue: "Selected place",
    city: "Current map",
    boundary: "What this changes",
    boundaryBody: "Only ONDO’s map presentation changes. This does not confirm opening hours, alcohol service, admission, or a venue age restriction. Your date of birth is not requested or stored; only an eligible result and its expiry stay in this tab.",
    auto: "Open after 19:00 KST when eligible",
    primary: "Use 19+ preview",
    cancel: "Stay on this map",
    failedTitle: "The 19+ preview did not complete",
    failedBody: "Your city, selected place, filters, and map position are unchanged.",
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
    header: "19+ · ONDO 프리뷰",
    title: "ONDO After 19 프리뷰를 열까요?",
    body: "이 탭의 19+ 충족 결과를 사용한 뒤 같은 지도로 돌아옵니다.",
    truth: "ONDO의 화면 선택이며, 이 장소의 공식 이용 제한이 아닙니다.",
    context: "돌아갈 곳",
    venue: "선택한 장소",
    city: "현재 지도",
    boundary: "바뀌는 내용",
    boundaryBody: "ONDO 지도 표현만 바뀝니다. 영업시간·주류 제공·입장 가능 여부나 장소의 연령 제한을 확인하지 않습니다. 생년월일은 요청하거나 저장하지 않고, 19+ 충족 결과와 만료 시각만 이 탭에 남습니다.",
    auto: "조건 충족 시 한국 시간 19:00 이후 자동으로 열기",
    primary: "19+ 프리뷰 사용",
    cancel: "이 지도에 머물기",
    failedTitle: "19+ 프리뷰를 완료하지 못했어요",
    failedBody: "도시·선택 장소·필터·지도 위치는 그대로 유지됩니다.",
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
    header: "19+ · ONDOプレビュー",
    title: "ONDOのAfter 19プレビューを開きますか？",
    body: "このタブの19歳以上という適格結果を使い、同じ地図に戻ります。",
    truth: "ONDO上の表示選択であり、この場所の公式な利用制限ではありません。",
    context: "戻る場所",
    venue: "選択中の場所",
    city: "現在の地図",
    boundary: "変更される内容",
    boundaryBody: "変わるのはONDOの地図表示だけです。営業時間、酒類提供、入場可否、施設の年齢制限は確認しません。生年月日は求めたり保存したりせず、19歳以上という結果と有効期限だけがこのタブに残ります。",
    auto: "条件を満たす場合、韓国時間19:00以降に自動で開く",
    primary: "19+プレビューを使う",
    cancel: "この地図にとどまる",
    failedTitle: "19+プレビューを完了できませんでした",
    failedBody: "都市、選択中の場所、フィルター、地図位置は変わっていません。",
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
  const [notice, setNotice] = useState<Notice>(null)
  const layerRef = useRef<HTMLDivElement | null>(null)
  const dialogRef = useRef<HTMLElement | null>(null)
  const chipRef = useRef<HTMLButtonElement | null>(null)
  const primaryRef = useRef<HTMLButtonElement | null>(null)
  const activeOffRef = useRef<HTMLButtonElement | null>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const t = COPY[locale]

  useModalIsolation(gateOpen, layerRef)

  useEffect(() => {
    const restored = restoreGlobalAfter19B(window.localStorage, window.sessionStorage, new Date())
    setPreference(restored.preference)
    setSession(restored.session)
    setNotice(restored.session.expiryNotice ? "expired" : null)
    writeStorage(window.localStorage, GLOBAL_AFTER19_PREFERENCE_KEY, restored.preference)
    writeStorage(window.sessionStorage, GLOBAL_AFTER19_SESSION_KEY, restored.session)
    setHydrated(true)
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
    onActiveChange?.(hydrated && session.mode === "on", session.activation)
  }, [hydrated, onActiveChange, session.activation, session.mode])

  useEffect(() => {
    if (!hydrated) return
    if (session.age === "eligible" && !isGlobalAfter19AgeCurrent(session, clock)) {
      commitSession({
        version: 1,
        age: "unverified",
        ageExpiresAt: null,
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
  }, [gateOpen])

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
    setGateView("intro")
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
    setGateOpen(false)
    restoreOpener()
  }

  function runCheck() {
    const qa = (window as Window & { __ONDO_B_QA__?: { after19Global?: "failure" } }).__ONDO_B_QA__
    if (qa?.after19Global === "failure") {
      setGateView("failure")
      return
    }
    commitSession(completeGlobalAfter19AgeB(clock))
    setGateOpen(false)
    window.requestAnimationFrame(() => activeOffRef.current?.focus({ preventScroll: true }))
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

  const contextLabel = context.venueLabel ?? context.cityLabel
  const contextKind = context.venueLabel ? t.venue : t.city

  return (
    <div
      className={styles.root}
      data-testid="ondo-b-after19-global"
      data-after19-mode={session.mode}
      data-after19-activation={session.activation ?? "none"}
      data-after19-age={session.age}
      data-after19-age-expires-at={session.ageExpiresAt ?? "none"}
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
          <button ref={activeOffRef} type="button" onClick={turnOff} aria-label={t.turnOff}><X size={17} aria-hidden="true" /></button>
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
              {gateView === "failure" ? <AlertTriangle className={styles.heroFailure} size={27} aria-hidden="true" /> : <MoonStar className={styles.hero} size={27} aria-hidden="true" />}
              <h2 id="global-after19-title">{gateView === "failure" ? t.failedTitle : t.title}</h2>
              <p className={styles.lead}>{gateView === "failure" ? t.failedBody : t.body}</p>
              <p className={styles.truth}><ShieldCheck size={16} aria-hidden="true" />{t.truth}</p>
              <section className={styles.returnContext} data-testid="global-after19-return-context" data-return-city={context.cityId} data-return-venue={context.venueId ?? "none"}>
                <small>{t.context} · {contextKind}</small>
                <strong>{contextLabel}</strong>
                {context.venueLabel ? <span>{context.cityLabel}</span> : null}
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
                <button ref={primaryRef} type="button" className={styles.primary} data-testid={gateView === "failure" ? "global-after19-retry" : "global-after19-confirm"} onClick={runCheck}>
                  {gateView === "failure" ? <RotateCcw size={17} aria-hidden="true" /> : <ShieldCheck size={17} aria-hidden="true" />}
                  {gateView === "failure" ? t.retry : t.primary}
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
