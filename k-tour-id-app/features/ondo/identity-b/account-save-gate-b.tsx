"use client"

import type { KeyboardEvent } from "react"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { AlertTriangle, ArrowLeft, BookmarkCheck, CircleUserRound, LoaderCircle, RotateCcw, ShieldCheck, X } from "lucide-react"
import { canonicalMapVenueById } from "@/lib/ondo/venues/map-data"
import { venueNamePresentation } from "@/lib/ondo/venues/display"
import { hashBAccountReturnTo, type BAccountReturnToEnvelope } from "../contracts/return-to-b"
import { localActual } from "../contracts/execution-mode"
import { openBDiscoveryDetail, openBDiscoveryEditorialDetail, openSavedBDiscoveryEditorialPlace, openSavedBDiscoveryVenue, readBDiscoveryHistory, type BDiscoveryCity } from "../map/b-discovery-history"
import { editorialPlaceById } from "../pulse-b/japan-first-pulse-model-b"
import { useOndoB } from "../shared/state/ondo-b-provider"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import { focusFirstAvailableDestination } from "../shared/ui/focus-destination"
import { isRenderedFocusable } from "../shared/ui/is-rendered-focusable"
import { ONDO_MODAL_PRIORITY } from "../shared/ui/modal-layer-priority"
import { useDocumentScrollLock, useModalIsolation } from "../shared/ui/use-modal-isolation"
import { readQaRuntime, useQaControls, useReviewSampleSession } from "../shared/ui/use-qa-controls"
import { useSheetPresence, type SheetPresencePhase } from "../shared/ui/use-sheet-presence"
import styles from "./account-save-gate-b.module.css"

type AccountGateView = "intro" | "processing" | "failure"

type AccountSaveGateBProps = {
  locale: OndoBLocale
  returnTo: BAccountReturnToEnvelope
  presenceState: Exclude<SheetPresencePhase, "closed">
  snapshotKey: string
  venueLabel: string
  onBegin(): boolean
  onCancel(): boolean
  onComplete(): "saved" | "save_failed" | "account_failed"
}

type AccountSaveGateVisualSnapshot = Readonly<{
  key: string
  locale: OndoBLocale
  returnTo: BAccountReturnToEnvelope
  venueLabel: string
  venueCityId: BDiscoveryCity | null
  focusSelector: string
}>

const FOCUSABLE = "button:not([disabled]),[href],summary,[tabindex]:not([tabindex='-1'])"

const COPY = {
  en: {
    header: "Account",
    trust: "For this visit · this tab only",
    title: "Save this place?",
    reason: "Create an account and return here.",
    boundary: "Privacy details",
    predicate: "Your account stays in this tab. Person, 19+, and payment are checked separately only when an action needs them.",
    context: "Place",
    contextBody: "This exact place stays open. There is no note draft in this save action.",
    start: "Create account and save",
    creatingTitle: "Creating your account…",
    creatingBody: "This place stays open while we finish.",
    fail: "Review failure",
    failedTitle: "This place wasn’t saved",
    failedBody: "Nothing changed. Try saving again, or return to the place.",
    retry: "Try again",
    cancel: "Go back",
  },
  ko: {
    header: "계정",
    trust: "이번 방문 · 이 탭에서만",
    title: "이 장소를 저장할까요?",
    reason: "계정을 만들고 이 장소로 바로 돌아와요.",
    boundary: "개인정보 안내",
    predicate: "계정은 이 탭에만 유지돼요. 본인·19+·결제는 행동에 필요할 때 각각 따로 확인합니다.",
    context: "장소",
    contextBody: "지금 연 장소를 그대로 유지합니다. 이 저장 작업에는 메모 초안이 없습니다.",
    start: "계정 만들고 저장",
    creatingTitle: "계정을 만들고 있어요…",
    creatingBody: "완료되는 동안 이 장소를 그대로 유지해요.",
    fail: "실패 상태 보기",
    failedTitle: "장소를 저장하지 못했어요",
    failedBody: "바뀐 내용은 없어요. 다시 저장하거나 장소로 돌아갈 수 있어요.",
    retry: "다시 시도",
    cancel: "돌아가기",
  },
  ja: {
    header: "アカウント",
    trust: "今回の滞在・このタブのみ",
    title: "この場所を保存しますか？",
    reason: "アカウントを作成して、この場所に戻ります。",
    boundary: "プライバシーの詳細",
    predicate: "アカウントはこのタブだけに保持されます。本人、19歳以上、決済は操作に必要な時だけ個別に確認します。",
    context: "場所",
    contextBody: "今開いている同じ場所に戻ります。この保存操作にメモの下書きはありません。",
    start: "アカウントを作成して保存",
    creatingTitle: "アカウントを作成しています…",
    creatingBody: "完了するまで、このスポットをそのまま保持します。",
    fail: "失敗状態を表示",
    failedTitle: "スポットを保存できませんでした",
    failedBody: "変更はありません。もう一度保存するか、スポットに戻れます。",
    retry: "もう一度試す",
    cancel: "戻る",
  },
} as const satisfies Record<OndoBLocale, Record<string, string>>

function runAfterFrames(callback: () => void, count: number) {
  let frame = 0
  let remaining = count
  const tick = () => {
    if (remaining <= 0) { callback(); return }
    remaining -= 1
    frame = window.requestAnimationFrame(tick)
  }
  frame = window.requestAnimationFrame(tick)
  return () => window.cancelAnimationFrame(frame)
}

function exactSaveSelector(returnTo: BAccountReturnToEnvelope) {
  return returnTo.targetKind === "editorial"
    ? `[data-testid='ondo-b-editorial-place-overlay'][data-editorial-place-id='${returnTo.editorialPlaceId}'] [data-testid='ondo-b-editorial-place-save']`
    : `[data-testid='canonical-place-overlay'][data-venue-id='${returnTo.venueId}'] [data-testid='canonical-venue-save']`
}

export function AccountSaveGateMountB() {
  const { state, actions } = useOndoB()
  const returnTo = state.accountReturnTo
  const envelopeHash = returnTo ? hashBAccountReturnTo(returnTo) : null
  const desiredSnapshot = useMemo<AccountSaveGateVisualSnapshot | null>(() => {
    if (!returnTo || !envelopeHash) return null
    const venue = returnTo.targetKind === "canonical" ? canonicalMapVenueById(returnTo.venueId) : null
    const editorialPlace = returnTo.targetKind === "editorial" ? editorialPlaceById(returnTo.editorialPlaceId) : null
    if (!venue && !editorialPlace) return null
    return {
      key: `${returnTo.tokenId}:${envelopeHash}`,
      locale: state.locale,
      returnTo,
      venueLabel: editorialPlace
        ? editorialPlace.name[state.locale]
        : venueNamePresentation(venue!.name.ko, state.locale).officialName,
      venueCityId: venue?.cityId ?? null,
      focusSelector: exactSaveSelector(returnTo),
    }
  }, [envelopeHash, returnTo, state.locale])
  const presence = useSheetPresence(desiredSnapshot)
  const presented = presence.value
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const returnSelectorRef = useRef<string | null>(null)
  const restoreFocusAfterExitRef = useRef(false)
  const desiredWasOpenRef = useRef(false)
  const desiredKeyRef = useRef<string | null>(null)

  useLayoutEffect(() => {
    if (!desiredSnapshot) {
      desiredWasOpenRef.current = false
      return
    }
    const isFreshOpen = !desiredWasOpenRef.current || desiredKeyRef.current !== desiredSnapshot.key
    desiredWasOpenRef.current = true
    if (!isFreshOpen) return
    desiredKeyRef.current = desiredSnapshot.key
    restoreFocusAfterExitRef.current = false
    returnSelectorRef.current = desiredSnapshot.focusSelector
    const active = document.activeElement
    returnFocusRef.current = active instanceof HTMLElement && active.matches(desiredSnapshot.focusSelector)
      ? active
      : null
  }, [desiredSnapshot])

  useEffect(() => {
    if (presence.value !== null || !restoreFocusAfterExitRef.current) return
    restoreFocusAfterExitRef.current = false
    const exactTarget = returnFocusRef.current
    const selector = returnSelectorRef.current
    returnFocusRef.current = null
    returnSelectorRef.current = null
    let cancelFallback: (() => void) | undefined
    const frame = window.requestAnimationFrame(() => {
      if (exactTarget?.isConnected && selector && exactTarget.matches(selector) && isRenderedFocusable(exactTarget)) {
        exactTarget.focus({ preventScroll: true })
        return
      }
      if (selector) cancelFallback = focusFirstAvailableDestination([selector])
    })
    return () => {
      window.cancelAnimationFrame(frame)
      cancelFallback?.()
    }
  }, [presence.value])

  if (!presented) return null

  function restoreExactVenue(snapshot: AccountSaveGateVisualSnapshot) {
    const activeReturnTo = snapshot.returnTo
    if (activeReturnTo.targetKind === "editorial") {
      const current = readBDiscoveryHistory()
      if (current?.level === "detail" && current.editorialPlaceId === activeReturnTo.editorialPlaceId && state.surface.kind === "editorial_place" && state.surface.editorialPlaceId === activeReturnTo.editorialPlaceId) return
      openSavedBDiscoveryEditorialPlace(activeReturnTo.editorialPlaceId)
      openBDiscoveryEditorialDetail(activeReturnTo.editorialPlaceId)
      actions.setSurface({ kind: "editorial_place", editorialPlaceId: activeReturnTo.editorialPlaceId })
      return
    }
    const current = readBDiscoveryHistory()
    if (current?.level === "detail" && current.venueId === activeReturnTo.venueId && state.surface.kind === "venue" && state.surface.venueId === activeReturnTo.venueId) return
    if (!snapshot.venueCityId) return
    openSavedBDiscoveryVenue(activeReturnTo.venueId, snapshot.venueCityId)
    openBDiscoveryDetail(activeReturnTo.venueId)
    actions.setSurface({ kind: "venue", venueId: activeReturnTo.venueId })
  }

  function stageFocusRestore(snapshot: AccountSaveGateVisualSnapshot) {
    restoreFocusAfterExitRef.current = true
    returnSelectorRef.current = snapshot.focusSelector
  }

  return (
    <AccountSaveGateB
      key={presented.key}
      locale={presented.locale}
      returnTo={presented.returnTo}
      presenceState={presence.phase}
      snapshotKey={presented.key}
      venueLabel={presented.venueLabel}
      onBegin={actions.beginAccountActivation}
      onCancel={() => {
        const canceled = actions.cancelAccountSave()
        if (canceled) {
          restoreExactVenue(presented)
          stageFocusRestore(presented)
        }
        return canceled
      }}
      onComplete={() => {
        const outcome = actions.completeAccountSave()
        if (outcome === "saved") {
          restoreExactVenue(presented)
          stageFocusRestore(presented)
        }
        return outcome
      }}
    />
  )
}

export function AccountSaveGateB({ locale, returnTo, presenceState, snapshotKey, venueLabel, onBegin, onCancel, onComplete }: AccountSaveGateBProps) {
  const [view, setView] = useState<AccountGateView>("intro")
  const layerRef = useRef<HTMLDivElement | null>(null)
  const dialogRef = useRef<HTMLElement | null>(null)
  const startRef = useRef<HTMLButtonElement | null>(null)
  const retryRef = useRef<HTMLButtonElement | null>(null)
  const exitRequestedRef = useRef(false)
  const qaControls = useQaControls()
  const sampleMode = useReviewSampleSession()
  const t = COPY[locale]
  const closing = presenceState === "closing"

  useModalIsolation(true, layerRef)
  useDocumentScrollLock(true)

  useEffect(() => {
    setView("intro")
  }, [returnTo.tokenId])

  useEffect(() => {
    if (closing) return
    const frame = window.requestAnimationFrame(() => {
      ;(view === "intro" ? startRef.current : view === "failure" ? retryRef.current : dialogRef.current)?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [closing, returnTo.tokenId, view])

  useEffect(() => {
    if (closing || view !== "processing") return
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    return runAfterFrames(complete, reducedMotion ? 0 : 10)
  // `onComplete` consumes the exact staged return only after the pending frame
  // has painted. A view change cancels the scheduled commit.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closing, returnTo.tokenId, view])

  useLayoutEffect(() => {
    if (!closing) return
    const consumeClosingKey = (event: globalThis.KeyboardEvent) => {
      event.preventDefault()
      event.stopImmediatePropagation()
    }
    window.addEventListener("keydown", consumeClosingKey, true)
    return () => window.removeEventListener("keydown", consumeClosingKey, true)
  }, [closing])

  function cancel() {
    if (closing || exitRequestedRef.current) return
    if (!onCancel()) {
      setView("failure")
      return
    }
    exitRequestedRef.current = true
  }

  function start() {
    if (closing) return
    if (qaControls && readQaRuntime<{ account?: "failure" }>()?.account === "failure") setView("failure")
    else if (!onBegin()) setView("failure")
    else setView("processing")
  }

  function complete() {
    if (closing || exitRequestedRef.current) return
    const outcome = onComplete()
    if (outcome !== "saved") {
      setView("failure")
      return
    }
    const execution = localActual("account", { action: "save_place" as const, tokenId: returnTo.tokenId })
    if (execution.result !== "LOCAL_COMMITTED") {
      setView("failure")
      return
    }
    exitRequestedRef.current = true
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    event.stopPropagation()
    if (closing) {
      event.preventDefault()
      return
    }
    if (event.key === "Escape") {
      event.preventDefault()
      cancel()
      return
    }
    if (event.key !== "Tab") return
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
      .filter(isRenderedFocusable)
    const first = focusable[0]
    const last = focusable.at(-1)
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div
      ref={layerRef}
      className={styles.layer}
      data-testid="ondo-gate-overlay"
      data-ondo-layer="critical"
      data-modal-layer-priority={ONDO_MODAL_PRIORITY.critical}
      data-account-presence={presenceState}
      data-account-snapshot-key={snapshotKey}
      onClickCapture={(event) => { if (closing) { event.preventDefault(); event.stopPropagation(); event.nativeEvent.stopImmediatePropagation() } }}
      onPointerDownCapture={(event) => { if (closing) { event.preventDefault(); event.stopPropagation(); event.nativeEvent.stopImmediatePropagation() } }}
      onKeyDownCapture={(event) => { if (closing) { event.preventDefault(); event.stopPropagation(); event.nativeEvent.stopImmediatePropagation() } }}
    >
      <div className={styles.backdrop} aria-hidden="true" />
      <section
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-save-title"
        aria-describedby={view === "intro" ? "account-save-reason" : view === "processing" ? "account-save-processing-reason" : "account-save-failure-reason"}
        data-testid="account-save-gate"
        data-gate-view={view}
        data-account-return-kind={returnTo.targetKind === "editorial" ? "editorial" : "canonical"}
        data-account-return-venue={returnTo.targetKind === "editorial" ? undefined : returnTo.venueId}
        data-account-return-editorial-place={returnTo.targetKind === "editorial" ? returnTo.editorialPlaceId : undefined}
        data-account-return-level={returnTo.returnLevel}
        data-account-return-draft="none"
        aria-busy={closing || view === "processing" ? "true" : undefined}
        onKeyDown={handleKeyDown}
      >
        <header className={styles.header}>
          <span><ShieldCheck size={18} aria-hidden="true" />{t.header}</span>
          <button type="button" className={styles.close} data-testid="account-gate-close" aria-label={t.cancel} disabled={closing} onClick={cancel}>
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        {view === "intro" ? (
          <div className={styles.body}>
            <section className={styles.returnContext} data-testid="account-return-context">
              <h3 className={styles.contextLabel}>{t.context}</h3>
              <p><strong>{venueLabel}</strong></p>
            </section>
            <CircleUserRound className={styles.heroIcon} size={34} aria-hidden="true" />
            <h2 id="account-save-title">{t.title}</h2>
            <p id="account-save-reason" className={styles.reason}>{t.reason}</p>
            <details className={styles.boundary} data-testid="account-boundary"><summary>{t.boundary}</summary><p>{t.predicate}</p></details>
            {sampleMode && <details className={styles.boundary}><summary>{locale === "ko" ? "샘플 상황 체험" : locale === "ja" ? "サンプルケース" : "Try a sample case"}</summary><button type="button" className={styles.secondary} disabled={closing} data-testid="account-sample-connection-failure" onClick={() => setView("failure")}>{locale === "ko" ? "연결 오류 체험" : locale === "ja" ? "接続エラーを体験" : "Try a connection error"}</button></details>}
            <div className={styles.actions}>
              <button ref={startRef} type="button" className={styles.primary} data-testid="account-start" disabled={closing} onClick={start}><BookmarkCheck size={18} aria-hidden="true" />{t.start}</button>
              {qaControls ? <button type="button" className={styles.secondary} data-testid="account-simulate-failure" disabled={closing} onClick={() => setView("failure")}>{t.fail}</button> : null}
              <button type="button" className={styles.secondary} data-testid="gate-cancel" disabled={closing} onClick={cancel}>{t.cancel}</button>
            </div>
          </div>
        ) : null}

        {view === "processing" ? (
          <div className={styles.body} role="status" aria-live="polite" aria-busy="true" data-testid="account-gate-processing">
            <section className={styles.returnContext} data-testid="account-return-context">
              <h3 className={styles.contextLabel}>{t.context}</h3>
              <p><strong>{venueLabel}</strong></p>
            </section>
            <LoaderCircle className={`${styles.heroIcon} ${styles.spinner}`} size={34} aria-hidden="true" />
            <h2 id="account-save-title" tabIndex={-1}>{t.creatingTitle}</h2>
            <p id="account-save-processing-reason" className={styles.reason}>{t.creatingBody}</p>
          </div>
        ) : null}

        {view === "failure" ? (
          <div className={styles.body} role="alert" data-testid="gate-failure">
            <section className={styles.returnContext} data-testid="account-return-context">
              <h3 className={styles.contextLabel}>{t.context}</h3>
              <p><strong>{venueLabel}</strong></p>
            </section>
            <AlertTriangle className={styles.heroIcon} size={34} aria-hidden="true" />
            <h2 id="account-save-title">{t.failedTitle}</h2>
            <p id="account-save-failure-reason" className={styles.reason}>{t.failedBody}</p>
            <div className={styles.actions}>
              <button ref={retryRef} type="button" className={styles.primary} data-testid="gate-retry" disabled={closing} onClick={() => setView("intro")}><RotateCcw size={17} aria-hidden="true" />{t.retry}</button>
              <button type="button" className={styles.secondary} disabled={closing} onClick={cancel}><ArrowLeft size={17} aria-hidden="true" />{t.cancel}</button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
