"use client"

import type { KeyboardEvent } from "react"
import { useEffect, useRef, useState } from "react"
import { AlertTriangle, ArrowLeft, BadgeCheck, RotateCcw, ShieldCheck } from "lucide-react"
import type { BReturnToEnvelope } from "../contracts/return-to-b"
import { consumeBReturnTo } from "../contracts/return-to-b"
import { focusFirstAvailableDestination } from "../shared/ui/focus-destination"
import { useModalIsolation } from "../shared/ui/use-modal-isolation"
import styles from "./after19-jit-b.module.css"

type GateView = "intro" | "choices" | "failure" | "unsupported" | "expired"

type After19JitBProps = {
  open: boolean
  locale: "en" | "ko"
  returnTo: BReturnToEnvelope | null
  tableTitle: string
  venueLabel: string
  onCancel(): void
  onEligible(returnTo: BReturnToEnvelope): void
}

const FOCUSABLE = "button:not([disabled]),[href],input:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])"

const COPY = {
  en: {
    title: "Confirm 19+ for this sample Table",
    reason: "Organizer marked this sample Table 19+. This is not an official venue restriction; the LOCALDATA venue record does not provide age-access rules.",
    boundary: "Local interactive example · No request is sent to an external provider. No real credential or verification is created.",
    predicate: "Only the 19+ predicate is returned to this Table example.",
    privacy: "Date of birth is never requested or stored.",
    context: "Your exact return context",
    start: "Review local outcome choices",
    cancel: "Cancel and return to the same Table",
    choices: "Choose an example outcome",
    success: "Continue with eligible 19+ example",
    failChoice: "Show failure example",
    unsupportedChoice: "Show provider-unavailable example",
    expiredChoice: "Show expired-proof example",
    failedTitle: "The 19+ example did not complete",
    failedBody: "Your Table, official place, and join note are unchanged.",
    unsupportedTitle: "An external provider is unavailable",
    unsupportedBody: "There is no provider connected here. Return without changing the Table or try another local outcome.",
    expiredTitle: "The local 19+ example has expired",
    expiredBody: "Restart the choice without losing the Table, place, or note.",
    retry: "Try again",
    return: "Return to the same Table",
  },
  ko: {
    title: "이 샘플 테이블의 19+ 확인",
    reason: "주최자가 이 샘플 테이블을 19+로 표시했습니다. 공식 장소의 출입 제한이 아니며 LOCALDATA 장소 기록은 연령 출입 규칙을 제공하지 않습니다.",
    boundary: "로컬 인터랙티브 예시 · 외부 제공기관으로 요청을 보내지 않습니다. 실제 자격증명이나 인증 결과를 만들지 않습니다.",
    predicate: "이 테이블 예시에는 19+ 충족 여부만 전달됩니다.",
    privacy: "생년월일을 요청하거나 저장하지 않습니다.",
    context: "정확한 복귀 문맥",
    start: "로컬 결과 선택 보기",
    cancel: "취소하고 같은 테이블로 돌아가기",
    choices: "예시 결과 선택",
    success: "19+ 충족 예시로 계속",
    failChoice: "실패 예시 보기",
    unsupportedChoice: "제공기관 미연결 예시 보기",
    expiredChoice: "증명 만료 예시 보기",
    failedTitle: "19+ 예시를 완료하지 못했습니다",
    failedBody: "테이블·공식 장소·참여 메모가 그대로 유지됩니다.",
    unsupportedTitle: "외부 제공기관을 사용할 수 없습니다",
    unsupportedBody: "연결된 제공기관이 없습니다. 테이블을 변경하지 않고 돌아가거나 다른 로컬 결과를 선택할 수 있습니다.",
    expiredTitle: "로컬 19+ 예시가 만료되었습니다",
    expiredBody: "테이블·장소·메모를 잃지 않고 다시 선택할 수 있습니다.",
    retry: "다시 시도",
    return: "같은 테이블로 돌아가기",
  },
} as const

export function After19JitB({ open, locale, returnTo, tableTitle, venueLabel, onCancel, onEligible }: After19JitBProps) {
  const [view, setView] = useState<GateView>("intro")
  const layerRef = useRef<HTMLDivElement | null>(null)
  const dialogRef = useRef<HTMLElement | null>(null)
  const startRef = useRef<HTMLButtonElement | null>(null)
  const t = locale === "ko" ? COPY.ko : COPY.en

  useModalIsolation(open, layerRef)

  useEffect(() => {
    if (!open) return
    setView("intro")
    const frame = window.requestAnimationFrame(() => startRef.current?.focus({ preventScroll: true }))
    return () => window.cancelAnimationFrame(frame)
  }, [open, returnTo?.tokenId])

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
      <section ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="after19-b-title" data-testid="after19-walkthrough" onKeyDown={handleKeyDown}>
        <header className={styles.header}>
          <span><ShieldCheck size={18} aria-hidden="true" />After19</span>
          <strong>{view === "intro" ? "01" : "02"}</strong>
        </header>

        {view === "intro" ? (
          <div className={styles.body}>
            <BadgeCheck className={styles.heroIcon} size={34} aria-hidden="true" />
            <h2 id="after19-b-title">{t.title}</h2>
            <p className={styles.reason}>{t.reason}</p>
            <aside className={styles.boundary} data-testid="local-interactive-boundary"><strong>{t.boundary}</strong><span>{t.predicate}</span><span>{t.privacy}</span></aside>
            <section className={styles.returnContext} data-testid="after19-return-context" data-return-table={returnTo.tableId} data-return-venue={returnTo.venueId}>
              <h3>{t.context}</h3>
              <p><strong>{tableTitle}</strong><span>{venueLabel}</span></p>
              {returnTo.draft ? <blockquote>{returnTo.draft}</blockquote> : null}
            </section>
            <div className={styles.actions}>
              <button ref={startRef} type="button" className={styles.primary} data-testid="after19-start" onClick={() => setView("choices")}>{t.start}</button>
              <button type="button" className={styles.secondary} data-testid="gate-cancel" onClick={cancel}>{t.cancel}</button>
            </div>
          </div>
        ) : null}

        {view === "choices" ? (
          <div className={styles.body}>
            <h2 id="after19-b-title">{t.choices}</h2>
            <div className={styles.choiceGrid}>
              <button type="button" data-testid="gate-success" onClick={complete}><BadgeCheck size={19} aria-hidden="true" />{t.success}</button>
              <button type="button" data-testid="gate-failure-choice" onClick={() => setView("failure")}><AlertTriangle size={19} aria-hidden="true" />{t.failChoice}</button>
              <button type="button" data-testid="gate-unsupported-choice" onClick={() => setView("unsupported")}><ShieldCheck size={19} aria-hidden="true" />{t.unsupportedChoice}</button>
              <button type="button" data-testid="gate-expired-choice" onClick={() => setView("expired")}><RotateCcw size={19} aria-hidden="true" />{t.expiredChoice}</button>
            </div>
            <button type="button" className={styles.secondary} data-testid="gate-cancel" onClick={cancel}>{t.cancel}</button>
          </div>
        ) : null}

        {view === "failure" ? <Outcome testId="gate-failure" title={t.failedTitle} body={t.failedBody} retry={t.retry} returnLabel={t.return} onRetry={() => setView("choices")} onReturn={cancel} /> : null}
        {view === "unsupported" ? <Outcome testId="gate-unsupported" title={t.unsupportedTitle} body={t.unsupportedBody} retry={t.retry} returnLabel={t.return} onRetry={() => setView("choices")} onReturn={cancel} /> : null}
        {view === "expired" ? <Outcome testId="after19-expiry-notice" title={t.expiredTitle} body={t.expiredBody} retry={t.retry} returnLabel={t.return} onRetry={() => setView("choices")} onReturn={cancel} /> : null}
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
