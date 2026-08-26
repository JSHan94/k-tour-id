"use client"

import type { KeyboardEvent } from "react"
import { useEffect, useRef, useState } from "react"
import { AlertTriangle, ArrowLeft, BadgeCheck, RotateCcw, ShieldCheck } from "lucide-react"
import type { BReturnToEnvelope } from "../contracts/return-to-b"
import { consumeBReturnTo } from "../contracts/return-to-b"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import { focusFirstAvailableDestination } from "../shared/ui/focus-destination"
import { useModalIsolation } from "../shared/ui/use-modal-isolation"
import styles from "./after19-jit-b.module.css"

declare global {
  interface Window {
    __ONDO_B_QA__?: { after19?: "failure" | "unavailable" | "expired"; tableMessage?: "failure"; localSignalPhoto?: "failure" }
    __ONDO_B_TABLE_INTENT__?: { tableId: string; venueId: string; mode: "view" }
  }
}

type GateView = "intro" | "review" | "failure" | "unsupported" | "expired"
type SocialLocale = OndoBLocale

type After19JitBProps = {
  open: boolean
  locale: SocialLocale
  returnTo: BReturnToEnvelope | null
  tableTitle: string
  venueLabel: string
  onCancel(): void
  onEligible(returnTo: BReturnToEnvelope): void
  onExpiredRetry(): void
}

const FOCUSABLE = "button:not([disabled]),[href],input:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])"

const COPY = {
  en: {
    title: "Before you join",
    reason: "Only an eligible 19+ result returns to this Table on this device. Your date of birth stays private.",
    boundary: "How this check works",
    predicate: "No provider is connected and no credential is created. The age check belongs to the Table, not the venue record. Only an eligible 19+ result returns to this Table. Date of birth is never requested or stored. Nothing is sent to ONDO or the host.",
    context: "You will return here",
    start: "Review and continue",
    cancel: "Not now",
    choices: "Ready to continue?",
    success: "Verify and continue",
    failedTitle: "The 19+ check did not complete",
    failedBody: "Your Table, official place, and join note are unchanged.",
    unsupportedTitle: "Age check unavailable",
    unsupportedBody: "Return without changing your Table, or try the check again.",
    expiredTitle: "Your age check expired",
    expiredBody: "Restart without losing the Table, place, or note.",
    retry: "Try again",
    return: "Return to the same Table",
    header: "19+ check",
    trust: "Private by default",
  },
  ko: {
    title: "참여 전 확인",
    reason: "이 기기에서 19+ 충족 결과만 이 테이블로 돌아옵니다. 생년월일은 비공개로 유지됩니다.",
    boundary: "확인 방식 안내",
    predicate: "연결된 제공기관이나 생성되는 자격증명은 없어요. 연령 확인은 장소 기록이 아닌 테이블에만 적용되며, 이 테이블에는 19+ 충족 결과만 돌아갑니다. 생년월일을 요청하거나 저장하지 않으며 ONDO나 호스트에게 전송되는 정보도 없습니다.",
    context: "이곳으로 돌아와요",
    start: "확인하고 계속",
    cancel: "나중에",
    choices: "계속할까요?",
    success: "확인 후 계속",
    failedTitle: "19+ 확인을 완료하지 못했어요",
    failedBody: "테이블·공식 장소·참여 메모가 그대로 유지됩니다.",
    unsupportedTitle: "외부 제공기관을 사용할 수 없습니다",
    unsupportedBody: "테이블을 변경하지 않고 돌아가거나 다시 시도할 수 있어요.",
    expiredTitle: "19+ 확인이 만료되었어요",
    expiredBody: "테이블·장소·메모를 잃지 않고 다시 선택할 수 있습니다.",
    retry: "다시 시도",
    return: "같은 테이블로 돌아가기",
    header: "19+ 확인",
    trust: "기본 비공개",
  },
  ja: {
    title: "参加前の確認",
    reason: "この端末上で、19歳以上という適格結果だけがこのTableに戻ります。生年月日は非公開のままです。",
    boundary: "確認方法",
    predicate: "接続された提供事業者はなく、資格情報も作成されません。年齢確認は場所の記録ではなく、このTableにだけ適用されます。このTableに戻るのは19歳以上という結果だけで、生年月日を求めたり保存したりしません。ONDOやホストにも何も送信されません。",
    context: "ここに戻ります",
    start: "確認して続ける",
    cancel: "今はしない",
    choices: "続けますか？",
    success: "確認して続ける",
    failedTitle: "19+確認を完了できませんでした",
    failedBody: "Table、公式の場所、参加メモはそのままです。",
    unsupportedTitle: "年齢確認を利用できません",
    unsupportedBody: "Tableを変更せずに戻るか、もう一度確認できます。",
    expiredTitle: "年齢確認の有効期限が切れました",
    expiredBody: "Table、場所、メモを失わずにやり直せます。",
    retry: "もう一度試す",
    return: "同じTableに戻る",
    header: "19+確認",
    trust: "初期設定で非公開",
  },
} as const satisfies Record<SocialLocale, Record<string, string>>

export function After19JitB({ open, locale, returnTo, tableTitle, venueLabel, onCancel, onEligible, onExpiredRetry }: After19JitBProps) {
  const [view, setView] = useState<GateView>("intro")
  const layerRef = useRef<HTMLDivElement | null>(null)
  const dialogRef = useRef<HTMLElement | null>(null)
  const startRef = useRef<HTMLButtonElement | null>(null)
  const t = COPY[locale]
  const qaOutcome = window.__ONDO_B_QA__?.after19 ?? null

  useModalIsolation(open, layerRef)

  useEffect(() => {
    if (!open) return
    setView("intro")
    const frame = window.requestAnimationFrame(() => startRef.current?.focus({ preventScroll: true }))
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  if (!open || !returnTo) return null

  function cancel() {
    onCancel()
    focusFirstAvailableDestination(["[data-testid='table-detail'] [data-testid='table-join']"])
  }

  function complete() {
    if (!returnTo) return
    const consumed = consumeBReturnTo(returnTo)
    if (!consumed) {
      setView("expired")
      return
    }
    onEligible(consumed)
    focusFirstAvailableDestination(["[data-testid='table-join-confirm']"])
  }

  function startReview() {
    if (qaOutcome === "failure") setView("failure")
    else if (qaOutcome === "unavailable") setView("unsupported")
    else if (qaOutcome === "expired") setView("expired")
    else setView("review")
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
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
    <div ref={layerRef} className={styles.layer} data-testid="after19-gate-layer">
      <div className={styles.backdrop} aria-hidden="true" />
      <section ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="after19-b-title" data-testid="after19-walkthrough" data-visual-direction="timeleft-checkpoint" data-gate-view={view} onKeyDown={handleKeyDown}>
        <header className={styles.header}>
          <span><ShieldCheck size={18} aria-hidden="true" />{t.header}</span>
          <strong>{t.trust}</strong>
        </header>

        {view === "intro" ? (
          <div className={styles.body}>
            <BadgeCheck className={styles.heroIcon} size={34} aria-hidden="true" />
            <h2 id="after19-b-title">{t.title}</h2>
            <p className={styles.reason}>{t.reason}</p>
            <details className={styles.boundary} data-testid="local-interactive-boundary"><summary>{t.boundary}</summary><p>{t.predicate}</p></details>
            <section className={styles.returnContext} data-testid="after19-return-context" data-return-table={returnTo.tableId} data-return-venue={returnTo.venueId}>
              <h3>{t.context}</h3>
              <p><strong>{tableTitle}</strong><span>{venueLabel}</span></p>
              {returnTo.draft ? <blockquote>{returnTo.draft}</blockquote> : null}
            </section>
            <div className={styles.actions}>
              <button ref={startRef} type="button" className={styles.primary} data-testid="after19-start" onClick={startReview}>{t.start}</button>
              <button type="button" className={styles.secondary} data-testid="gate-cancel" onClick={cancel}>{t.cancel}</button>
            </div>
          </div>
        ) : null}

        {view === "review" ? (
          <div className={styles.body}>
            <BadgeCheck className={styles.heroIcon} size={34} aria-hidden="true" />
            <h2 id="after19-b-title">{t.choices}</h2>
            <p className={styles.reason}>{t.reason}</p>
            <div className={styles.actions}>
              <button type="button" className={styles.primary} data-testid="gate-success" onClick={complete}><BadgeCheck size={19} aria-hidden="true" />{t.success}</button>
              <button type="button" className={styles.secondary} data-testid="gate-cancel" onClick={cancel}>{t.cancel}</button>
            </div>
          </div>
        ) : null}

        {view === "failure" ? <Outcome testId="gate-failure" title={t.failedTitle} body={t.failedBody} retry={t.retry} returnLabel={t.return} onRetry={() => setView("review")} onReturn={cancel} /> : null}
        {view === "unsupported" ? <Outcome testId="gate-unsupported" title={t.unsupportedTitle} body={t.unsupportedBody} retry={t.retry} returnLabel={t.return} onRetry={() => setView("review")} onReturn={cancel} /> : null}
        {view === "expired" ? <Outcome testId="after19-expiry-notice" title={t.expiredTitle} body={t.expiredBody} retry={t.retry} returnLabel={t.return} onRetry={() => { onExpiredRetry(); setView("review") }} onReturn={cancel} /> : null}
      </section>
    </div>
  )
}

function Outcome({ testId, title, body, retry, returnLabel, onRetry, onReturn }: {
  testId: "gate-failure" | "gate-unsupported" | "after19-expiry-notice"
  title: string
  body: string
  retry: string
  returnLabel: string
  onRetry(): void
  onReturn(): void
}) {
  return (
    <div className={styles.body} role="alert" data-testid={testId}>
      <AlertTriangle className={styles.heroIcon} size={34} aria-hidden="true" />
      <h2 id="after19-b-title">{title}</h2>
      <p className={styles.reason}>{body}</p>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} data-testid="gate-retry" onClick={onRetry}><RotateCcw size={17} aria-hidden="true" />{retry}</button>
        <button type="button" className={styles.secondary} data-testid="after19-return" onClick={onReturn}><ArrowLeft size={17} aria-hidden="true" />{returnLabel}</button>
      </div>
    </div>
  )
}
