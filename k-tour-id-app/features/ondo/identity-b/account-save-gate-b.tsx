"use client"

import type { KeyboardEvent } from "react"
import { useEffect, useRef, useState } from "react"
import { AlertTriangle, ArrowLeft, BookmarkCheck, CircleUserRound, RotateCcw, ShieldCheck } from "lucide-react"
import { canonicalMapVenueById } from "@/lib/ondo/venues/map-data"
import { venueNamePresentation } from "@/lib/ondo/venues/display"
import type { BAccountReturnToEnvelope } from "../contracts/return-to-b"
import { openBDiscoveryDetail, openSavedBDiscoveryVenue, readBDiscoveryHistory } from "../map/b-discovery-history"
import { useOndoB } from "../shared/state/ondo-b-provider"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import { focusFirstAvailableDestination } from "../shared/ui/focus-destination"
import { useModalIsolation } from "../shared/ui/use-modal-isolation"
import { readQaRuntime, useQaControls } from "../shared/ui/use-qa-controls"
import styles from "./account-save-gate-b.module.css"

type AccountGateView = "intro" | "review" | "failure"

type AccountSaveGateBProps = {
  locale: OndoBLocale
  returnTo: BAccountReturnToEnvelope
  venueLabel: string
  onCancel(): void
  onComplete(): "saved" | "save_failed" | "account_failed"
}

const FOCUSABLE = "button:not([disabled]),[href],[tabindex]:not([tabindex='-1'])"

const COPY = {
  en: {
    header: "Account",
    trust: "On-device · this tab",
    title: "Create an account to save this place",
    reason: "Explore stays open to guests. A local Account is needed only when you save this place on your device.",
    boundary: "What this step does",
    predicate: "No account provider is connected, no credential is created, and nothing is sent to ONDO or the place. Account is kept only for this tab. Person, 19+, and payment checks remain separate and incomplete.",
    context: "Return after Account",
    contextBody: "This exact place stays open. There is no note draft in this save action.",
    start: "Create local account",
    reviewTitle: "Save this place after Account?",
    reviewBody: "Completing the local Account returns here and saves only this place on this device.",
    complete: "Complete account setup",
    fail: "Simulate failure",
    failedTitle: "The Account step did not complete",
    failedBody: "The place is still open and unsaved. Try the same save again, or return without changes.",
    retry: "Try again",
    cancel: "Return to previous screen",
  },
  ko: {
    header: "계정",
    trust: "기기 내 계정 · 이 탭",
    title: "이 장소를 저장하려면 계정이 필요해요",
    reason: "게스트도 계속 둘러볼 수 있어요. 이 장소를 기기에 저장할 때만 로컬 계정이 필요합니다.",
    boundary: "이 절차가 하는 일",
    predicate: "연결된 계정 제공기관이나 생성되는 자격증명은 없고, ONDO나 장소로 전송되는 정보도 없습니다. 계정 상태는 이 탭에만 유지됩니다. 본인·19+·결제 확인은 별개이며 완료되지 않습니다.",
    context: "계정 후 돌아올 곳",
    contextBody: "지금 연 장소를 그대로 유지합니다. 이 저장 작업에는 메모 초안이 없습니다.",
    start: "로컬 계정 만들기",
    reviewTitle: "계정을 만든 뒤 저장할까요?",
    reviewBody: "로컬 계정 설정을 마치면 이 장소로 돌아와 이 장소만 기기에 저장합니다.",
    complete: "계정 설정 완료",
    fail: "실패 상태 보기",
    failedTitle: "계정 절차를 완료하지 못했어요",
    failedBody: "장소는 열린 채로 아직 저장되지 않았어요. 같은 저장을 다시 시도하거나 변경 없이 돌아갈 수 있습니다.",
    retry: "다시 시도",
    cancel: "이전 화면으로 돌아가기",
  },
  ja: {
    header: "アカウント",
    trust: "端末内アカウント · このタブ",
    title: "この場所の保存にはアカウントが必要です",
    reason: "ゲストのまま探し続けられます。この場所を端末に保存するときだけ、ローカルアカウントが必要です。",
    boundary: "この手続きで行うこと",
    predicate: "アカウント提供事業者への接続や資格情報の作成はなく、ONDOや場所にも何も送信しません。アカウント状態はこのタブだけに保持されます。本人、19歳以上、決済の確認は別で、完了しません。",
    context: "アカウント後の戻り先",
    contextBody: "今開いている同じ場所に戻ります。この保存操作にメモの下書きはありません。",
    start: "ローカルアカウントを作成",
    reviewTitle: "アカウント作成後に保存しますか？",
    reviewBody: "ローカルアカウントの設定が完了すると、ここに戻り、この場所だけを端末に保存します。",
    complete: "アカウント設定を完了",
    fail: "失敗状態を表示",
    failedTitle: "アカウント手続きを完了できませんでした",
    failedBody: "場所は開いたままで、まだ保存されていません。同じ保存を再試行するか、変更せずに戻れます。",
    retry: "もう一度試す",
    cancel: "前の画面に戻る",
  },
} as const satisfies Record<OndoBLocale, Record<string, string>>

export function AccountSaveGateMountB() {
  const { state, actions } = useOndoB()
  const returnTo = state.accountReturnTo
  const venue = returnTo ? canonicalMapVenueById(returnTo.venueId) : null
  if (!returnTo || !venue) return null
  const activeReturnTo = returnTo
  const activeVenue = venue
  const venueLabel = venueNamePresentation(activeVenue.name.ko, state.locale).officialName

  function restoreExactVenue() {
    const current = readBDiscoveryHistory()
    if (current?.level === "detail" && current.venueId === activeReturnTo.venueId && state.surface.kind === "venue" && state.surface.venueId === activeReturnTo.venueId) return
    openSavedBDiscoveryVenue(activeVenue.id, activeVenue.cityId)
    openBDiscoveryDetail(activeVenue.id)
    actions.setSurface({ kind: "venue", venueId: activeVenue.id })
  }

  return (
    <AccountSaveGateB
      locale={state.locale}
      returnTo={activeReturnTo}
      venueLabel={venueLabel}
      onCancel={() => {
        actions.cancelAccountSave()
        restoreExactVenue()
      }}
      onComplete={() => {
        const outcome = actions.completeAccountSave()
        if (outcome !== "account_failed") restoreExactVenue()
        return outcome
      }}
    />
  )
}

export function AccountSaveGateB({ locale, returnTo, venueLabel, onCancel, onComplete }: AccountSaveGateBProps) {
  const [view, setView] = useState<AccountGateView>("intro")
  const layerRef = useRef<HTMLDivElement | null>(null)
  const dialogRef = useRef<HTMLElement | null>(null)
  const startRef = useRef<HTMLButtonElement | null>(null)
  const qaControls = useQaControls()
  const t = COPY[locale]

  useModalIsolation(true, layerRef)

  useEffect(() => {
    setView("intro")
    const frame = window.requestAnimationFrame(() => startRef.current?.focus({ preventScroll: true }))
    return () => window.cancelAnimationFrame(frame)
  }, [returnTo.tokenId])

  function restoreSaveFocus() {
    focusFirstAvailableDestination(["[data-testid='canonical-venue-save']"])
  }

  function cancel() {
    onCancel()
    restoreSaveFocus()
  }

  function start() {
    if (readQaRuntime<{ account?: "failure" }>()?.account === "failure") setView("failure")
    else setView("review")
  }

  function complete() {
    const outcome = onComplete()
    if (outcome === "account_failed") {
      setView("failure")
      return
    }
    restoreSaveFocus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    event.stopPropagation()
    if (event.key === "Escape") {
      event.preventDefault()
      cancel()
      return
    }
    if (event.key !== "Tab") return
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
      .filter((element) => element.offsetParent !== null)
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
    <div ref={layerRef} className={styles.layer} data-testid="ondo-gate-overlay">
      <div className={styles.backdrop} aria-hidden="true" />
      <section
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-save-title"
        data-testid="account-save-gate"
        data-gate-view={view}
        data-account-return-venue={returnTo.venueId}
        data-account-return-level={returnTo.returnLevel}
        data-account-return-draft="none"
        onKeyDown={handleKeyDown}
      >
        <header className={styles.header}>
          <span><ShieldCheck size={18} aria-hidden="true" />{t.header}</span>
          <strong>{t.trust}</strong>
        </header>

        {view === "intro" ? (
          <div className={styles.body}>
            <CircleUserRound className={styles.heroIcon} size={34} aria-hidden="true" />
            <h2 id="account-save-title">{t.title}</h2>
            <p className={styles.reason}>{t.reason}</p>
            <details className={styles.boundary} data-testid="account-boundary"><summary>{t.boundary}</summary><p>{t.predicate}</p></details>
            <section className={styles.returnContext} data-testid="account-return-context">
              <h3>{t.context}</h3>
              <p><strong>{venueLabel}</strong><span>{t.contextBody}</span></p>
            </section>
            <div className={styles.actions}>
              <button ref={startRef} type="button" className={styles.primary} data-testid="account-start" onClick={start}>{t.start}</button>
              {qaControls ? <button type="button" className={styles.secondary} data-testid="account-simulate-failure" onClick={() => setView("failure")}>{t.fail}</button> : null}
              <button type="button" className={styles.secondary} data-testid="gate-cancel" onClick={cancel}>{t.cancel}</button>
            </div>
          </div>
        ) : null}

        {view === "review" ? (
          <div className={styles.body}>
            <BookmarkCheck className={styles.heroIcon} size={34} aria-hidden="true" />
            <h2 id="account-save-title">{t.reviewTitle}</h2>
            <p className={styles.reason}>{t.reviewBody}</p>
            <section className={styles.returnContext} data-testid="account-return-context"><h3>{t.context}</h3><p><strong>{venueLabel}</strong><span>{t.contextBody}</span></p></section>
            <div className={styles.actions}>
              <button type="button" className={styles.primary} data-testid="account-complete" onClick={complete}><BookmarkCheck size={18} aria-hidden="true" />{t.complete}</button>
              <button type="button" className={styles.secondary} data-testid="gate-cancel" onClick={cancel}>{t.cancel}</button>
            </div>
          </div>
        ) : null}

        {view === "failure" ? (
          <div className={styles.body} role="alert" data-testid="gate-failure">
            <AlertTriangle className={styles.heroIcon} size={34} aria-hidden="true" />
            <h2 id="account-save-title">{t.failedTitle}</h2>
            <p className={styles.reason}>{t.failedBody}</p>
            <div className={styles.actions}>
              <button type="button" className={styles.primary} data-testid="gate-retry" onClick={() => setView("intro")}><RotateCcw size={17} aria-hidden="true" />{t.retry}</button>
              <button type="button" className={styles.secondary} onClick={cancel}><ArrowLeft size={17} aria-hidden="true" />{t.cancel}</button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
