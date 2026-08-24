"use client"

import type { KeyboardEvent } from "react"
import { useEffect, useRef, useState } from "react"
import { AlertTriangle, BadgeCheck, Ban, ChevronLeft, CircleOff, FileKey2, ShieldCheck, X } from "lucide-react"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import { useModalIsolation } from "../shared/ui/use-modal-isolation"
import styles from "./local-check-walkthrough-b.module.css"

export type LocalCheckKind = "person" | "age"
export type LocalCheckOutcome = "success" | "cancel" | "failure" | "unavailable" | "expired"
export type LocalCheckOrigin = "local_signal" | "traveler_id"

type Props = {
  locale: OndoBLocale
  check: LocalCheckKind
  origin: LocalCheckOrigin
  boundarySeen: boolean
  onAcknowledgeBoundary(): boolean
  onReturn(outcome: LocalCheckOutcome): void
}

type Phase = "boundary" | "consent" | "outcome"
const FOCUSABLE = "button:not([disabled]),[href],input:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])"

const COPY = {
  en: {
    dialog: "Local interactive check walkthrough",
    close: "Close walkthrough",
    back: "Back to consent",
    boundaryEyebrow: "ONE-TIME LOCAL BOUNDARY",
    boundaryTitle: "This is an interactive walkthrough on this device.",
    boundary: "No camera scan, data transmission, provider call, DID, or real verifiable credential occurs. You choose every return immediately; it does not verify a real person or age.",
    boundaryKeep: "Only the fact that you saw this boundary is kept on this device, so it is shown once. Clearing device content shows it again.",
    boundaryContinue: "I understand — review consent",
    boundaryError: "This device could not remember the boundary. Nothing was sent. Check browser storage and try again.",
    consentTitle: "Review the minimum request",
    requester: "Requester",
    purpose: "Purpose",
    minimum: "Minimum predicate",
    retention: "Retention",
    person: "Person",
    age: "19+",
    personMinimum: "Person walkthrough completed — not a legal identity or age result",
    ageMinimum: "19+ walkthrough completed — separate from Person and not a legal age result",
    retentionBody: "No result, claim, DID, profile, or credential is saved. Only the one-time boundary choice and a posted Local Signal venue marker can stay on this device.",
    signalRequester: "ONDO Local Signals",
    idRequester: "ONDO Traveler ID",
    signalPurpose: "Return to your exact draft for this place and allow one local-device post.",
    personPurpose: "Review how a future minimum Person request would work without creating an identity.",
    agePurpose: "Review a separate future 19+ request without creating or inferring an identity.",
    decline: "Decline and return to draft",
    declineId: "Decline and return to Traveler ID",
    approvePerson: "Approve Person walkthrough",
    approveAge: "Approve 19+ walkthrough",
    outcomeTitle: "Choose the local return",
    outcomeBody: "No provider is connected. Each button returns a synchronous local state so success, recovery, and expiry can be reviewed without pretending that verification occurred.",
    success: "Return completed",
    failure: "Return failed",
    unavailable: "Return unavailable",
    expired: "Return expired",
  },
  ko: {
    dialog: "로컬 대화형 확인 둘러보기",
    close: "둘러보기 닫기",
    back: "동의 화면으로",
    boundaryEyebrow: "최초 1회 로컬 경계",
    boundaryTitle: "이 기기 안에서만 작동하는 대화형 둘러보기입니다.",
    boundary: "카메라 스캔·데이터 전송·공급자 호출·DID·실제 검증가능자격증명은 일어나지 않습니다. 모든 반환 결과를 직접 즉시 선택하며 실제 본인이나 나이를 확인하지 않아요.",
    boundaryKeep: "이 안내를 봤다는 사실만 이 기기에 저장해 한 번만 보여줍니다. 기기 내용을 지우면 다시 표시됩니다.",
    boundaryContinue: "이해했어요 — 동의 내용 보기",
    boundaryError: "이 기기에 안내 확인을 저장하지 못했어요. 전송된 정보는 없습니다. 브라우저 저장 공간을 확인하고 다시 시도해 주세요.",
    consentTitle: "최소 요청 확인",
    requester: "요청자",
    purpose: "목적",
    minimum: "최소 조건",
    retention: "보관",
    person: "본인",
    age: "19+",
    personMinimum: "본인 둘러보기 완료 — 법적 신원이나 나이 결과가 아님",
    ageMinimum: "19+ 둘러보기 완료 — 본인과 별개이며 법적 나이 결과가 아님",
    retentionBody: "결과·주장·DID·프로필·자격증명은 저장하지 않습니다. 최초 1회 경계 확인과 게시된 로컬 시그널의 장소 표시만 이 기기에 남을 수 있어요.",
    signalRequester: "ONDO 로컬 시그널",
    idRequester: "ONDO 여행자 ID",
    signalPurpose: "이 장소의 정확한 작성 내용으로 돌아가 기기 내 게시 1회를 허용합니다.",
    personPurpose: "신원을 만들지 않고 향후 최소 본인 요청이 어떻게 작동할지 살펴봅니다.",
    agePurpose: "신원을 만들거나 추론하지 않고 별도의 향후 19+ 요청을 살펴봅니다.",
    decline: "거절하고 작성 내용으로 돌아가기",
    declineId: "거절하고 여행자 ID로 돌아가기",
    approvePerson: "본인 둘러보기 동의",
    approveAge: "19+ 둘러보기 동의",
    outcomeTitle: "로컬 반환 결과 선택",
    outcomeBody: "연결된 공급자가 없습니다. 실제 확인인 것처럼 꾸미지 않고 성공·복구·만료 흐름을 검토할 수 있도록 각 버튼이 동기식 로컬 상태를 반환합니다.",
    success: "완료로 반환",
    failure: "실패로 반환",
    unavailable: "이용 불가로 반환",
    expired: "만료로 반환",
  },
} as const

export function LocalCheckWalkthroughB({ locale, check, origin, boundarySeen, onAcknowledgeBoundary, onReturn }: Props) {
  const [phase, setPhase] = useState<Phase>(boundarySeen ? "consent" : "boundary")
  const [boundaryError, setBoundaryError] = useState(false)
  const layerRef = useRef<HTMLDivElement>(null)
  const returnedRef = useRef(false)
  const copy = COPY[locale]
  useModalIsolation(true, layerRef)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const layer = layerRef.current
      layer?.scrollTo({ top: 0, behavior: "instant" })
      layer?.querySelector<HTMLElement>("[data-local-check-initial-focus]")?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [phase])

  function finish(outcome: LocalCheckOutcome) {
    if (returnedRef.current) return
    returnedRef.current = true
    onReturn(outcome)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault()
      finish("cancel")
      return
    }
    if (event.key !== "Tab") return
    const focusable = Array.from(layerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
      .filter((element) => element.offsetParent !== null)
    const first = focusable[0]
    const last = focusable.at(-1)
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }

  const purpose = origin === "local_signal"
    ? copy.signalPurpose
    : check === "person" ? copy.personPurpose : copy.agePurpose
  const requester = origin === "local_signal" ? copy.signalRequester : copy.idRequester

  return (
    <div className={styles.backdrop}>
      <div
        ref={layerRef}
        className={styles.layer}
        role="dialog"
        aria-modal="true"
        aria-label={copy.dialog}
        data-testid="ondo-b-local-check-walkthrough"
        data-check-kind={check}
        data-check-phase={phase}
        onKeyDown={handleKeyDown}
      >
        <header>
          {phase === "outcome" ? (
            <button type="button" onClick={() => setPhase("consent")} aria-label={copy.back}><ChevronLeft size={20} aria-hidden="true" /></button>
          ) : <span />}
          <strong>{check === "person" ? copy.person : copy.age}</strong>
          <button type="button" onClick={() => finish("cancel")} aria-label={copy.close}><X size={20} aria-hidden="true" /></button>
        </header>

        {phase === "boundary" ? (
          <section className={styles.body} data-testid="local-check-boundary">
            <div className={styles.mark}><FileKey2 size={25} aria-hidden="true" /></div>
            <p className={styles.eyebrow}>{copy.boundaryEyebrow}</p>
            <h2>{copy.boundaryTitle}</h2>
            <p className={styles.lead}>{copy.boundary}</p>
            <p className={styles.quiet}>{copy.boundaryKeep}</p>
            {boundaryError ? <p className={styles.error} role="alert">{copy.boundaryError}</p> : null}
            <button
              type="button"
              className={styles.primary}
              data-local-check-initial-focus
              data-testid="local-check-boundary-continue"
              onClick={() => {
                if (!onAcknowledgeBoundary()) { setBoundaryError(true); return }
                setBoundaryError(false)
                setPhase("consent")
              }}
            >
              {copy.boundaryContinue}
            </button>
          </section>
        ) : null}

        {phase === "consent" ? (
          <section className={styles.body} data-testid="local-check-consent">
            <div className={styles.mark}><ShieldCheck size={25} aria-hidden="true" /></div>
            <h2>{copy.consentTitle}</h2>
            <dl className={styles.consent}>
              <div data-testid="consent-requester"><dt>{copy.requester}</dt><dd>{requester}</dd></div>
              <div data-testid="consent-purpose"><dt>{copy.purpose}</dt><dd>{purpose}</dd></div>
              <div data-testid="consent-minimum"><dt>{copy.minimum}</dt><dd>{check === "person" ? copy.personMinimum : copy.ageMinimum}</dd></div>
              <div data-testid="consent-retention"><dt>{copy.retention}</dt><dd>{copy.retentionBody}</dd></div>
            </dl>
            <div className={styles.actions}>
              <button type="button" className={styles.primary} data-local-check-initial-focus onClick={() => setPhase("outcome")}>
                <BadgeCheck size={18} aria-hidden="true" />{check === "person" ? copy.approvePerson : copy.approveAge}
              </button>
              <button type="button" className={styles.secondary} onClick={() => finish("cancel")}>
                {origin === "local_signal" ? copy.decline : copy.declineId}
              </button>
            </div>
          </section>
        ) : null}

        {phase === "outcome" ? (
          <section className={styles.body} data-testid="local-check-outcomes">
            <div className={styles.mark}><CircleOff size={25} aria-hidden="true" /></div>
            <h2>{copy.outcomeTitle}</h2>
            <p className={styles.lead}>{copy.outcomeBody}</p>
            <div className={styles.outcomes}>
              <button type="button" className={styles.primary} data-local-check-initial-focus data-testid="local-check-return-success" onClick={() => finish("success")}><BadgeCheck size={18} aria-hidden="true" />{copy.success}</button>
              <button type="button" data-testid="local-check-return-failure" onClick={() => finish("failure")}><AlertTriangle size={18} aria-hidden="true" />{copy.failure}</button>
              <button type="button" data-testid="local-check-return-unavailable" onClick={() => finish("unavailable")}><Ban size={18} aria-hidden="true" />{copy.unavailable}</button>
              <button type="button" data-testid="local-check-return-expired" onClick={() => finish("expired")}><CircleOff size={18} aria-hidden="true" />{copy.expired}</button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
