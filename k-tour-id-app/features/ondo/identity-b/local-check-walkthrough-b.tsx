"use client"

import type { KeyboardEvent } from "react"
import { useEffect, useRef, useState } from "react"
import { AlertTriangle, BadgeCheck, CircleOff, LoaderCircle, ShieldCheck, X } from "lucide-react"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import { useModalIsolation } from "../shared/ui/use-modal-isolation"
import styles from "./local-check-walkthrough-b.module.css"

export type LocalCheckKind = "person" | "age"
export type LocalCheckOutcome = "success" | "cancel" | "failure" | "unavailable" | "expired"
export type LocalCheckOrigin = "local_signal" | "traveler_id"
type IdentityLocale = OndoBLocale

type Props = {
  locale: IdentityLocale
  check: LocalCheckKind
  origin: LocalCheckOrigin
  boundarySeen: boolean
  onAcknowledgeBoundary(): boolean
  onReturn(outcome: LocalCheckOutcome): void
}

type Phase = "consent" | "processing" | "result"
type QaWindow = Window & { __ONDO_B_QA__?: { eligibility?: LocalCheckOutcome } }

const FOCUSABLE = "button:not([disabled]),[href],input:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])"

const COPY = {
  en: {
    dialog: "Eligibility check",
    close: "Not now",
    eyebrow: "JUST FOR THIS ACTION",
    title: "Share one simple answer",
    account: "ONDO Travel Pass",
    requester: "Requested by",
    purpose: "Used for",
    minimum: "Answer shared",
    retention: "Kept for",
    person: "Person",
    age: "19+",
    personMinimum: "Person — separate from age or legal identity",
    ageMinimum: "19+ — separate from identity or Person",
    signalPurpose: "Post your Local Signal and return to the note you were writing.",
    personPurpose: "Complete the current action without sharing your name or profile.",
    agePurpose: "Confirm age eligibility for this action without sharing a birth date.",
    retentionBody: "This result lasts only for this open screen. No name, document, birth date, profile, or credential is saved.",
    prototype: "How this check works",
    prototypeBody: "No identity provider is connected and no credential is created. Only the minimum result is used for this session.",
    boundaryError: "This device could not save your notice preference. Nothing was sent; please try again.",
    approvePerson: "Verify and continue",
    approveAge: "Verify and continue",
    decline: "Not now — return to note",
    declineId: "Not now",
    processing: "Checking only what is needed…",
    processingBody: "Your name, document and birth date stay out of this request.",
    successTitle: "You’re ready",
    successBody: "The minimum answer is ready for this action.",
    failureTitle: "We couldn’t complete the check",
    failureBody: "Nothing was saved or shared. Try again when you’re ready.",
    unavailableTitle: "Check temporarily unavailable",
    unavailableBody: "Your pending action is safe. You can retry without starting over.",
    expiredTitle: "This answer expired",
    expiredBody: "Run the minimum check again to continue.",
    retry: "Try again",
    return: "Return without checking",
  },
  ko: {
    dialog: "자격 확인",
    close: "나중에",
    eyebrow: "이 작업에만 사용",
    title: "간단한 답 하나만 공유해요",
    account: "ONDO 여행 패스",
    requester: "요청자",
    purpose: "사용 목적",
    minimum: "공유하는 답",
    retention: "보관 기간",
    person: "본인",
    age: "19+",
    personMinimum: "본인 — 나이·법적 신원과 별개",
    ageMinimum: "19+ — 신원·본인과 별개",
    signalPurpose: "작성하던 내용으로 돌아가 로컬 시그널을 게시합니다.",
    personPurpose: "이름이나 프로필을 공유하지 않고 현재 작업을 완료합니다.",
    agePurpose: "생년월일을 공유하지 않고 이 작업의 나이 조건만 확인합니다.",
    retentionBody: "열려 있는 이 화면에서만 유지됩니다. 이름·문서·생년월일·프로필·자격증명은 저장하지 않습니다.",
    prototype: "확인 방식 안내",
    prototypeBody: "연결된 신원 공급자나 생성되는 자격증명은 없습니다. 이 세션에는 최소 결과만 사용합니다.",
    boundaryError: "이 기기에 안내 설정을 저장하지 못했어요. 전송된 정보는 없습니다. 다시 시도해 주세요.",
    approvePerson: "확인하고 계속",
    approveAge: "확인하고 계속",
    decline: "나중에 — 작성 내용으로 돌아가기",
    declineId: "나중에",
    processing: "필요한 답만 확인 중…",
    processingBody: "이름·문서·생년월일은 이 요청에 포함되지 않아요.",
    successTitle: "준비됐어요",
    successBody: "이 작업에 필요한 최소 답이 준비됐습니다.",
    failureTitle: "확인을 완료하지 못했어요",
    failureBody: "저장되거나 공유된 정보가 없습니다. 준비되면 다시 시도해 주세요.",
    unavailableTitle: "지금은 확인할 수 없어요",
    unavailableBody: "진행하던 작업은 그대로예요. 처음부터 시작하지 않고 다시 시도할 수 있습니다.",
    expiredTitle: "확인 결과가 만료됐어요",
    expiredBody: "최소 확인을 다시 진행해 주세요.",
    retry: "다시 시도",
    return: "확인 없이 돌아가기",
  },
  ja: {
    dialog: "利用条件の確認",
    close: "今回はしない",
    eyebrow: "この操作にだけ使用",
    title: "必要な答えをひとつだけ共有",
    account: "ONDO トラベルパス",
    requester: "確認元",
    purpose: "利用目的",
    minimum: "共有する答え",
    retention: "保持期間",
    person: "本人",
    age: "19歳以上",
    personMinimum: "本人であること — 年齢や法的身元とは別",
    ageMinimum: "19歳以上 — 身元や本人確認とは別",
    signalPurpose: "書きかけの内容に戻り、Local Signalを投稿します。",
    personPurpose: "名前やプロフィールを共有せずに、この操作を完了します。",
    agePurpose: "生年月日を共有せず、この操作に必要な年齢条件だけを確認します。",
    retentionBody: "結果はこの画面を開いている間だけ保持されます。名前、書類、生年月日、プロフィール、資格情報は保存しません。",
    prototype: "この確認の仕組み",
    prototypeBody: "本人確認サービスには接続せず、資格情報も作成しません。このセッションでは必要最小限の結果だけを使用します。",
    boundaryError: "このブラウザに案内設定を保存できませんでした。情報は送信されていません。もう一度お試しください。",
    approvePerson: "確認して続ける",
    approveAge: "確認して続ける",
    decline: "今回はしない — 入力内容に戻る",
    declineId: "今回はしない",
    processing: "必要な項目だけを確認しています…",
    processingBody: "名前、書類、生年月日はこの確認に含まれません。",
    successTitle: "準備できました",
    successBody: "この操作に必要な最小限の結果を用意しました。",
    failureTitle: "確認を完了できませんでした",
    failureBody: "保存・共有された情報はありません。準備ができたら、もう一度お試しください。",
    unavailableTitle: "現在、この確認を利用できません",
    unavailableBody: "進行中の操作はそのままです。最初からやり直さずに再試行できます。",
    expiredTitle: "確認結果の有効期限が切れました",
    expiredBody: "続けるには、必要最小限の確認をもう一度行ってください。",
    retry: "もう一度試す",
    return: "確認せずに戻る",
  },
} as const

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

export function LocalCheckWalkthroughB({ locale, check, origin, boundarySeen, onAcknowledgeBoundary, onReturn }: Props) {
  const [phase, setPhase] = useState<Phase>("consent")
  const [result, setResult] = useState<Exclude<LocalCheckOutcome, "cancel"> | null>(null)
  const [boundaryError, setBoundaryError] = useState(false)
  const layerRef = useRef<HTMLDivElement>(null)
  const returnedRef = useRef(false)
  const copy = COPY[locale]
  useModalIsolation(true, layerRef)

  function finish(outcome: LocalCheckOutcome) {
    if (returnedRef.current) return
    returnedRef.current = true
    onReturn(outcome)
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const layer = layerRef.current
      layer?.scrollTo({ top: 0, behavior: "instant" })
      layer?.querySelector<HTMLElement>("[data-local-check-initial-focus]")?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [phase])

  useEffect(() => {
    if (phase !== "processing") return
    return runAfterFrames(() => {
      const injected = (window as QaWindow).__ONDO_B_QA__?.eligibility ?? "success"
      if (injected === "cancel") { finish("cancel"); return }
      setResult(injected)
      setPhase("result")
    }, 22)
  }, [phase])

  useEffect(() => {
    if (phase !== "result" || result !== "success") return
    return runAfterFrames(() => finish("success"), 18)
  }, [phase, result])

  function begin() {
    if (!boundarySeen && !onAcknowledgeBoundary()) {
      setBoundaryError(true)
      return
    }
    setBoundaryError(false)
    setResult(null)
    setPhase("processing")
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

  const resultCopy = result === "success"
    ? [copy.successTitle, copy.successBody]
    : result === "unavailable"
      ? [copy.unavailableTitle, copy.unavailableBody]
      : result === "expired"
        ? [copy.expiredTitle, copy.expiredBody]
        : [copy.failureTitle, copy.failureBody]

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
        <div className={styles.grabber} aria-hidden="true" />
        <header>
          <span>{copy.account}</span>
          <button type="button" data-local-check-initial-focus={phase === "consent" ? true : undefined} onClick={() => finish("cancel")} aria-label={copy.close}><X size={20} aria-hidden="true" /></button>
        </header>

        {phase === "consent" ? (
          <section className={styles.body} data-testid="local-check-consent">
            <div className={styles.heroIcon}><ShieldCheck size={28} strokeWidth={1.8} aria-hidden="true" /></div>
            <p className={styles.eyebrow}>{copy.eyebrow}</p>
            <h2>{copy.title}</h2>
            <p className={styles.lead}>{purpose}</p>

            <dl className={styles.consent}>
              <div data-testid="consent-requester"><dt>{copy.requester}</dt><dd>{copy.account}</dd></div>
              <div data-testid="consent-purpose"><dt>{copy.purpose}</dt><dd>{purpose}</dd></div>
              <div data-testid="consent-minimum"><dt>{copy.minimum}</dt><dd>{check === "person" ? copy.personMinimum : copy.ageMinimum}</dd></div>
              <div data-testid="consent-retention"><dt>{copy.retention}</dt><dd>{copy.retentionBody}</dd></div>
            </dl>

            {!boundarySeen ? (
              <details className={styles.prototype} data-testid="local-check-boundary">
                <summary>{copy.prototype}</summary>
                <p>{copy.prototypeBody}</p>
              </details>
            ) : null}
            {boundaryError ? <p className={styles.error} role="alert">{copy.boundaryError}</p> : null}

            <div className={styles.actions}>
              <button type="button" className={styles.primary} data-testid="local-check-boundary-continue" onClick={begin}>
                <BadgeCheck size={18} aria-hidden="true" />{check === "person" ? copy.approvePerson : copy.approveAge}
              </button>
              <button type="button" className={styles.secondary} onClick={() => finish("cancel")}>
                {origin === "local_signal" ? copy.decline : copy.declineId}
              </button>
            </div>
          </section>
        ) : null}

        {phase === "processing" ? (
          <section className={`${styles.body} ${styles.status}`} data-testid="local-check-processing" aria-live="polite">
            <div className={styles.loader}><LoaderCircle size={28} aria-hidden="true" /></div>
            <h2>{copy.processing}</h2>
            <p className={styles.lead}>{copy.processingBody}</p>
          </section>
        ) : null}

        {phase === "result" ? (
          <section className={`${styles.body} ${styles.status}`} data-testid="local-check-result" data-result={result} aria-live="polite">
            <div className={result === "success" ? styles.successIcon : styles.issueIcon}>
              {result === "success" ? <BadgeCheck size={31} aria-hidden="true" /> : result === "expired" ? <CircleOff size={30} aria-hidden="true" /> : <AlertTriangle size={30} aria-hidden="true" />}
            </div>
            <h2>{resultCopy[0]}</h2>
            <p className={styles.lead}>{resultCopy[1]}</p>
            {result !== "success" ? (
              <div className={styles.actions}>
                <button type="button" className={styles.primary} data-local-check-initial-focus onClick={begin}>{copy.retry}</button>
                <button type="button" className={styles.secondary} onClick={() => finish(result ?? "failure")}>{copy.return}</button>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  )
}
