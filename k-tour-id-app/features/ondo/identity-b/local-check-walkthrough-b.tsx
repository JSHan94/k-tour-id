"use client"

import type { KeyboardEvent } from "react"
import { useEffect, useRef, useState } from "react"
import { AlertTriangle, BadgeCheck, BookOpenCheck, ChevronRight, CircleOff, IdCard, LoaderCircle, ShieldCheck, Smartphone, X } from "lucide-react"
import { createReviewFixtureAuthority, providerUnavailable, reviewFixture, type ReviewFixtureOutcome } from "../contracts/execution-mode"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import { isRenderedFocusable } from "../shared/ui/is-rendered-focusable"
import { ONDO_MODAL_PRIORITY } from "../shared/ui/modal-layer-priority"
import { useDocumentScrollLock, useModalIsolation } from "../shared/ui/use-modal-isolation"
import type { SheetPresencePhase } from "../shared/ui/use-sheet-presence"
import { enterReviewSample, readQaRuntime, useQaControls } from "../shared/ui/use-qa-controls"
import styles from "./local-check-walkthrough-b.module.css"

export type LocalCheckKind = "person" | "age"
export type LocalCheckOutcome = "success" | "cancel" | "failure" | "unavailable" | "unsupported" | "expired"
export type LocalCheckOrigin = "local_signal" | "traveler_id"
export type LocalPersonRoute = "mobile_id" | "residence_card" | "passport"
type IdentityLocale = OndoBLocale

type Props = {
  locale: IdentityLocale
  check: LocalCheckKind
  origin: LocalCheckOrigin
  accountActive: boolean
  onActivateAccount(): boolean
  boundarySeen: boolean
  onAcknowledgeBoundary(): boolean
  onReturn(outcome: LocalCheckOutcome): boolean
  presenceState?: Exclude<SheetPresencePhase, "closed">
}

type Phase = "account" | "route" | "consent" | "processing" | "result"
type ResidenceAvailability = "supported" | "unsupported" | "outage"
type LocalCheckResult = Exclude<LocalCheckOutcome, "cancel">
const FOCUSABLE = "button:not([disabled]),[href],input:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex='-1'])"

const COPY = {
  en: {
    dialog: "Eligibility check",
    close: "Not now",
    eyebrow: "JUST FOR THIS ACTION",
    title: "Share one simple answer",
    accountEyebrow: "PERSON",
    accountTitle: "Set up a visit account",
    accountBody: "Then choose a confirmation method. Your 19+ and payment status stay separate.",
    accountDetails: "What stays separate",
    accountScope: "Visit account",
    accountScopeBody: "Kept for this visit only",
    accountAction: "Continue with a visit account",
    accountFailureTitle: "We couldn’t create the visit account",
    accountFailureBody: "Nothing changed. Try again or return to your Travel Pass.",
    routeEyebrow: "PERSON",
    routeTitle: "Choose your ID",
    routeBody: "Use the option that applies to you.",
    mobileId: "Mobile ID",
    residenceCard: "Residence Card",
    passport: "Passport",
    routeUnavailable: "Unavailable now",
    routeReview: "Review path",
    residenceUnsupported: "Card method not supported",
    reviewTruth: "Review result · no external service confirmation",
    residenceUnavailableTitle: "Residence Card isn’t connected yet",
    residenceUnavailableBody: "Choose Passport or another ID. Your Travel Pass stays right here.",
    residenceOutageTitle: "Residence Card is temporarily unavailable",
    residenceOutageBody: "Use Passport while this method is unavailable. Your Travel Pass stays right here.",
    residenceUnsupportedTitle: "This Residence Card method isn’t supported",
    residenceUnsupportedBody: "Use Passport instead. Your Travel Pass stays right here.",
    usePassport: "Use Passport",
    chooseAnother: "Choose another ID",
    backToPass: "Back to Travel Pass",
    selectedRoute: "Selected ID",
    account: "ONDO Travel Pass",
    requester: "Requested by",
    purpose: "Used for",
    minimum: "Answer shared",
    retention: "Kept for",
    person: "Person",
    age: "19+",
    personMinimum: "Person · yes/no only — separate from 19+",
    ageMinimum: "19+ — separate from identity or Person",
    signalPurpose: "Post your Local Signal and return to the note you were writing.",
    personPurpose: "Prepare Person for your Travel Pass without sharing your name or profile.",
    agePurpose: "Confirm age eligibility for this action without sharing a birth date.",
    personRetention: "This tab · up to 1 hour · no personal data saved",
    ageRetention: "This tab · up to 24 hours · no birth date saved",
    prototype: "How this check works",
    prototypeBody: "Only the minimum result for this action is kept. Personal details are not saved.",
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
    unavailableBody: "Continue with prepared sample data, or return without changing your action.",
    sample: "Continue with sample",
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
    accountEyebrow: "본인",
    accountTitle: "방문 계정을 준비하세요",
    accountBody: "그다음 확인 방법을 선택해요. 19+와 결제 상태는 별개로 유지됩니다.",
    accountDetails: "별도로 확인하는 항목",
    accountScope: "방문 계정",
    accountScopeBody: "이번 방문 동안만 유지",
    accountAction: "방문 계정으로 계속",
    accountFailureTitle: "방문 계정을 만들지 못했어요",
    accountFailureBody: "바뀐 내용은 없어요. 다시 시도하거나 여행 패스로 돌아가세요.",
    routeEyebrow: "본인",
    routeTitle: "신분증을 선택하세요",
    routeBody: "나에게 맞는 방법 하나를 선택하세요.",
    mobileId: "모바일 신분증",
    residenceCard: "외국인등록증",
    passport: "여권",
    routeUnavailable: "현재 이용할 수 없음",
    routeReview: "검토 경로",
    residenceUnsupported: "지원하지 않는 카드 방식",
    reviewTruth: "검토용 결과 · 외부 서비스 확인 없음",
    residenceUnavailableTitle: "외국인등록증은 아직 연결 전이에요",
    residenceUnavailableBody: "여권이나 다른 신분증을 선택하세요. 여행 패스는 그대로 유지됩니다.",
    residenceOutageTitle: "외국인등록증 확인을 잠시 이용할 수 없어요",
    residenceOutageBody: "지금은 여권을 이용하세요. 여행 패스는 그대로 유지됩니다.",
    residenceUnsupportedTitle: "이 외국인등록증 방식은 지원하지 않아요",
    residenceUnsupportedBody: "대신 여권을 이용하세요. 여행 패스는 그대로 유지됩니다.",
    usePassport: "여권으로 계속",
    chooseAnother: "다른 신분증 선택",
    backToPass: "여행 패스로 돌아가기",
    selectedRoute: "선택한 신분증",
    account: "ONDO 여행 패스",
    requester: "요청자",
    purpose: "사용 목적",
    minimum: "공유하는 답",
    retention: "보관 기간",
    person: "본인",
    age: "19+",
    personMinimum: "본인 여부 · 예/아니오만 · 19+와 별개",
    ageMinimum: "19+ — 신원·본인과 별개",
    signalPurpose: "작성하던 내용으로 돌아가 로컬 시그널을 게시합니다.",
    personPurpose: "이름이나 프로필을 공유하지 않고 여행 패스의 본인 상태를 준비합니다.",
    agePurpose: "생년월일을 공유하지 않고 이 작업의 나이 조건만 확인합니다.",
    personRetention: "이 탭 · 최대 1시간 · 개인정보 저장 안 함",
    ageRetention: "이 탭 · 최대 24시간 · 생년월일 저장 안 함",
    prototype: "확인 방식 안내",
    prototypeBody: "이 행동에 필요한 최소 결과만 유지하며 개인정보는 저장하지 않아요.",
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
    unavailableBody: "준비된 샘플로 이어보거나, 진행하던 작업을 바꾸지 않고 돌아가세요.",
    sample: "샘플로 계속",
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
    accountEyebrow: "本人",
    accountTitle: "トリップアカウントを準備",
    accountBody: "次に確認方法を選びます。19歳以上と決済の状態は別のままです。",
    accountDetails: "別に確認する項目",
    accountScope: "トリップアカウント",
    accountScopeBody: "今回の利用中だけ保持",
    accountAction: "トリップアカウントで続ける",
    accountFailureTitle: "トリップアカウントを作成できませんでした",
    accountFailureBody: "変更はありません。もう一度試すか、トラベルパスへ戻れます。",
    routeEyebrow: "本人",
    routeTitle: "身分証を選択",
    routeBody: "自分に合う方法を選んでください。",
    mobileId: "モバイルID",
    residenceCard: "在留カード",
    passport: "パスポート",
    routeUnavailable: "現在利用できません",
    routeReview: "検証用ルート",
    residenceUnsupported: "このカード方式は非対応",
    reviewTruth: "検証用の結果・外部サービスによる確認なし",
    residenceUnavailableTitle: "在留カードはまだ接続されていません",
    residenceUnavailableBody: "パスポートか別の身分証を選べます。トラベルパスはそのままです。",
    residenceOutageTitle: "在留カードの確認を一時的に利用できません",
    residenceOutageBody: "現在はパスポートを利用できます。トラベルパスはそのままです。",
    residenceUnsupportedTitle: "この在留カード方式には対応していません",
    residenceUnsupportedBody: "代わりにパスポートを利用できます。トラベルパスはそのままです。",
    usePassport: "パスポートで続ける",
    chooseAnother: "別の身分証を選ぶ",
    backToPass: "トラベルパスに戻る",
    selectedRoute: "選択した身分証",
    account: "ONDO トラベルパス",
    requester: "確認元",
    purpose: "利用目的",
    minimum: "共有する答え",
    retention: "保持期間",
    person: "本人",
    age: "19歳以上",
    personMinimum: "本人であること・はい／いいえのみ・19歳以上とは別",
    ageMinimum: "19歳以上 — 身元や本人確認とは別",
    signalPurpose: "書きかけの内容に戻り、Local Signalを投稿します。",
    personPurpose: "名前やプロフィールを共有せず、トラベルパスの本人状態を準備します。",
    agePurpose: "生年月日を共有せず、この操作に必要な年齢条件だけを確認します。",
    personRetention: "このタブ・最長1時間・個人情報は保存しません",
    ageRetention: "このタブ・最長24時間・生年月日は保存しません",
    prototype: "この確認の仕組み",
    prototypeBody: "この操作に必要な最小限の結果だけを保持し、個人情報は保存しません。",
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
    unavailableBody: "用意されたサンプルで続けるか、操作を変更せずに戻れます。",
    sample: "サンプルで続ける",
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

export function LocalCheckWalkthroughB({ locale, check, origin, accountActive, onActivateAccount, boundarySeen, onAcknowledgeBoundary, onReturn, presenceState = "open" }: Props) {
  const reviewMode = useQaControls()
  const [phase, setPhase] = useState<Phase>(() => check === "person" ? accountActive ? "route" : "account" : "consent")
  const [personRoute, setPersonRoute] = useState<LocalPersonRoute | null>(null)
  const [result, setResult] = useState<LocalCheckResult | null>(null)
  const [selectedResidenceAvailability, setSelectedResidenceAvailability] = useState<ResidenceAvailability | null>(null)
  const [accountFailure, setAccountFailure] = useState(false)
  const [boundaryError, setBoundaryError] = useState(false)
  const layerRef = useRef<HTMLDivElement>(null)
  const returnedRef = useRef(false)
  const reviewRunRef = useRef(false)
  const copy = COPY[locale]
  const residenceQa = reviewMode ? readQaRuntime<{ residenceCard?: ResidenceAvailability }>() : undefined
  const configuredResidenceAvailability: ResidenceAvailability = reviewMode ? residenceQa?.residenceCard ?? "supported" : "outage"
  const residenceAvailability = selectedResidenceAvailability ?? configuredResidenceAvailability
  const closing = presenceState === "closing"
  useModalIsolation(true, layerRef)
  useDocumentScrollLock(origin === "traveler_id")

  function finish(outcome: LocalCheckOutcome) {
    if (closing || returnedRef.current) return
    reviewRunRef.current = false
    if (!onReturn(outcome)) {
      setAccountFailure(false)
      setResult("failure")
      setPhase("result")
      return
    }
    returnedRef.current = true
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const layer = layerRef.current
      layer?.querySelector<HTMLElement>("[data-local-check-body]")?.scrollTo({ top: 0, behavior: "instant" })
      const target = boundaryError
        ? layer?.querySelector<HTMLElement>("[data-local-check-error-focus]")
        : layer?.querySelector<HTMLElement>("[data-local-check-initial-focus]")
      target?.focus({ preventScroll: !boundaryError })
      if (boundaryError) target?.scrollIntoView({ block: "nearest" })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [boundaryError, phase, result])

  useEffect(() => {
    if (phase !== "processing") return
    const frames = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 22
    return runAfterFrames(() => {
      if (!reviewMode || !reviewRunRef.current) {
        setResult("unavailable")
        setPhase("result")
        return
      }
      setResult("success")
      setPhase("result")
    }, frames)
  }, [phase, reviewMode])

  useEffect(() => {
    if (phase !== "result" || result !== "success") return
    const frames = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 18
    return runAfterFrames(() => finish("success"), frames)
  }, [phase, result])

  useEffect(() => {
    const interceptEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return
      if (layerRef.current?.closest("[inert],[aria-hidden='true']")) return
      event.preventDefault()
      event.stopImmediatePropagation()
      if (closing) return
      finish("cancel")
    }
    document.addEventListener("keydown", interceptEscape, true)
    return () => document.removeEventListener("keydown", interceptEscape, true)
  }, [closing])

  function begin() {
    if (check === "person" && !personRoute) {
      setPhase("route")
      return
    }
    if (!boundarySeen && !onAcknowledgeBoundary()) {
      setBoundaryError(true)
      return
    }
    setBoundaryError(false)
    setAccountFailure(false)
    setResult(null)
    if (!reviewMode) {
      const execution = providerUnavailable(check === "person" ? "person" : "age")
      if (execution.result !== "PROVIDER_UNAVAILABLE") return
      setResult("unavailable")
      setPhase("result")
      return
    }
    const qa = readQaRuntime<{ eligibility?: LocalCheckOutcome }>()
    const requestedValue = (qa?.eligibility as LocalCheckOutcome | undefined) ?? "success"
    // `unsupported` belongs only to the explicit Residence availability seam.
    // A generic/untyped eligibility injection must remain fail-closed.
    const requested: Exclude<LocalCheckOutcome, "unsupported"> = requestedValue === "unsupported" ? "unavailable" : requestedValue
    if (qa?.eligibility) delete qa.eligibility
    if (personRoute === "residence_card" && requested === "unavailable") setSelectedResidenceAvailability("outage")
    const route = check === "age" ? "AGE" : personRoute === "mobile_id" ? "CX" : personRoute === "residence_card" ? "RESIDENCE" : "PASSPORT"
    const suffix = requested === "failure" ? "FAIL" : requested.toUpperCase()
    const authority = createReviewFixtureAuthority({
      qaRuntimeEnabled: reviewMode,
      explicitlyRequested: reviewMode,
      fixtureId: `FX-${check === "age" ? "AGE" : `PER-${route}`}-${suffix}`,
    })
    if (!authority) {
      setResult("unavailable")
      setPhase("result")
      return
    }
    const execution = requested === "success"
      ? reviewFixture(authority, { outcome: "success", value: { check, route: personRoute } })
      : reviewFixture(authority, { outcome: requested as Exclude<ReviewFixtureOutcome, "success"> })
    if (execution.result === "FIXTURE_CANCEL") { finish("cancel"); return }
    if (execution.result === "FIXTURE_FAILURE") { setResult("failure"); setPhase("result"); return }
    if (execution.result === "FIXTURE_EXPIRED") { setResult("expired"); setPhase("result"); return }
    if (execution.result === "FIXTURE_UNAVAILABLE") { setResult("unavailable"); setPhase("result"); return }
    reviewRunRef.current = true
    setPhase("processing")
  }

  function prepareAccount() {
    if (accountActive || onActivateAccount()) {
      setAccountFailure(false)
      setPhase("route")
      return
    }
    setAccountFailure(true)
    setResult("failure")
    setPhase("result")
  }

  function choosePersonRoute(route: LocalPersonRoute) {
    setAccountFailure(false)
    setPersonRoute(route)
    setBoundaryError(false)
    if (route === "residence_card") {
      setSelectedResidenceAvailability(residenceAvailability)
      if (reviewMode && residenceQa?.residenceCard) delete residenceQa.residenceCard
      if (residenceAvailability !== "supported") {
        if (reviewMode) {
          const authority = createReviewFixtureAuthority({
            qaRuntimeEnabled: reviewMode,
            explicitlyRequested: reviewMode,
            fixtureId: `FX-PER-RESIDENCE-${residenceAvailability === "unsupported" ? "UNSUPPORTED" : "OUTAGE"}`,
          })
          const execution = authority ? reviewFixture(authority, { outcome: "unavailable" }) : null
          setResult(execution?.result === "FIXTURE_UNAVAILABLE" && residenceAvailability === "unsupported" ? "unsupported" : "unavailable")
        } else {
          const execution = providerUnavailable("person")
          setResult(execution.result === "PROVIDER_UNAVAILABLE" ? "unavailable" : "failure")
        }
        setPhase("result")
        return
      }
    }
    if (!reviewMode) {
      const execution = providerUnavailable("person")
      setResult(execution.result === "PROVIDER_UNAVAILABLE" ? "unavailable" : "failure")
      setPhase("result")
      return
    }
    setResult(null)
    setPhase("consent")
  }

  function chooseAnotherRoute() {
    reviewRunRef.current = false
    setResult(null)
    setPersonRoute(null)
    setPhase("route")
  }

  function continueWithSample() {
    if (!enterReviewSample()) return
    reviewRunRef.current = false
    setResult(null)
    setPhase(check === "person" && !personRoute ? "route" : "consent")
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (closing) { event.preventDefault(); event.stopPropagation(); return }
    if (event.key !== "Tab") return
    const focusable = Array.from(layerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
      .filter(isRenderedFocusable)
    const first = focusable[0]
    const last = focusable.at(-1)
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }

  const purpose = origin === "local_signal"
    ? copy.signalPurpose
    : check === "person" ? copy.personPurpose : copy.agePurpose

  const resultCopy = accountFailure
    ? [copy.accountFailureTitle, copy.accountFailureBody]
    : result === "success"
    ? [copy.successTitle, copy.successBody]
    : result === "unavailable"
      ? check === "person" && personRoute === "residence_card"
        ? reviewMode && selectedResidenceAvailability === "outage"
          ? [copy.residenceOutageTitle, copy.residenceOutageBody]
          : [copy.residenceUnavailableTitle, copy.residenceUnavailableBody]
        : [copy.unavailableTitle, copy.unavailableBody]
      : result === "unsupported"
        ? [copy.residenceUnsupportedTitle, copy.residenceUnsupportedBody]
      : result === "expired"
        ? [copy.expiredTitle, copy.expiredBody]
        : [copy.failureTitle, copy.failureBody]

  return (
    <div
      className={styles.backdrop}
      data-check-presence={presenceState}
      onClickCapture={(event) => {
        if (!closing) return
        event.preventDefault()
        event.stopPropagation()
      }}
      onPointerDownCapture={(event) => {
        if (!closing) return
        event.preventDefault()
        event.stopPropagation()
      }}
      onKeyDownCapture={(event) => {
        if (!closing) return
        event.preventDefault()
        event.stopPropagation()
      }}
    >
      <div
        ref={layerRef}
        className={styles.layer}
        role="dialog"
        aria-modal="true"
        aria-label={copy.dialog}
        aria-labelledby="local-check-title"
        aria-busy={closing ? "true" : undefined}
        data-testid="ondo-b-local-check-walkthrough"
        data-ondo-layer="full-task"
        data-modal-layer-priority={ONDO_MODAL_PRIORITY.fullTask}
        data-check-kind={check}
        data-check-phase={phase}
        data-check-origin={origin}
        data-execution-mode={reviewMode ? "review" : "normal"}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.grabber} aria-hidden="true" />
        <header>
          <span>{copy.account}</span>
          <button type="button" onClick={() => finish("cancel")} aria-label={copy.close}><X size={20} aria-hidden="true" /></button>
        </header>

        {phase === "account" ? (
          <section className={styles.body} data-local-check-body data-testid="direct-person-account">
            <h2 id="local-check-title">{copy.accountTitle}</h2>
            <details className={styles.prototype}>
              <summary>{copy.accountDetails}</summary>
              <p>{copy.accountBody} {copy.accountScopeBody}</p>
            </details>
            <div className={styles.actions}>
              <button type="button" className={styles.primary} data-local-check-initial-focus data-testid="direct-person-account-continue" onClick={prepareAccount}>
                {copy.accountAction}<ChevronRight size={18} aria-hidden="true" />
              </button>
              <button type="button" className={styles.secondary} data-testid="direct-person-return" onClick={() => finish("cancel")}>{copy.backToPass}</button>
            </div>
          </section>
        ) : null}

        {phase === "route" ? (
          <section className={styles.body} data-local-check-body data-testid="direct-person-route">
            <h2 id="local-check-title">{copy.routeTitle}</h2>
            {reviewMode ? <p className={styles.reviewScope} data-testid="direct-person-review-scope"><ShieldCheck size={15} aria-hidden="true" />{copy.reviewTruth}</p> : null}
            <div className={styles.routeChoices} role="group" aria-label={copy.routeTitle}>
              <button type="button" data-local-check-initial-focus data-testid="direct-person-route-mobile-id" data-availability={reviewMode ? "review" : "unavailable"} onClick={() => choosePersonRoute("mobile_id")}><Smartphone size={22} aria-hidden="true" /><span><strong>{copy.mobileId}</strong><small>{reviewMode ? copy.routeReview : copy.routeUnavailable}</small></span><ChevronRight size={17} aria-hidden="true" /></button>
              <button type="button" data-testid="direct-person-route-residence-card" data-availability={reviewMode ? residenceAvailability : "unavailable"} onClick={() => choosePersonRoute("residence_card")}><IdCard size={22} aria-hidden="true" /><span><strong>{copy.residenceCard}</strong><small>{residenceAvailability === "supported" ? copy.routeReview : residenceAvailability === "unsupported" ? copy.residenceUnsupported : copy.routeUnavailable}</small></span><ChevronRight size={17} aria-hidden="true" /></button>
              <button type="button" data-testid="direct-person-route-passport" data-availability={reviewMode ? "review" : "unavailable"} onClick={() => choosePersonRoute("passport")}><BookOpenCheck size={22} aria-hidden="true" /><span><strong>{copy.passport}</strong><small>{reviewMode ? copy.routeReview : copy.routeUnavailable}</small></span><ChevronRight size={17} aria-hidden="true" /></button>
            </div>
            <button type="button" className={styles.routeReturn} data-testid="direct-person-return" onClick={() => finish("cancel")}>{copy.backToPass}</button>
          </section>
        ) : null}

        {phase === "consent" ? (
          <section className={styles.body} data-local-check-body data-testid="local-check-consent">
            {reviewMode ? <p className={styles.reviewScope} data-testid="direct-person-review-scope"><ShieldCheck size={15} aria-hidden="true" />{copy.reviewTruth}</p> : null}
            {check === "person" && personRoute ? (
              <div className={styles.selectedRoute} data-testid="direct-person-selected-route" data-person-route={personRoute}>
                {personRoute === "mobile_id" ? <Smartphone size={20} aria-hidden="true" /> : personRoute === "residence_card" ? <IdCard size={20} aria-hidden="true" /> : <BookOpenCheck size={20} aria-hidden="true" />}
                <span><small>{copy.selectedRoute}</small><strong>{personRoute === "mobile_id" ? copy.mobileId : personRoute === "residence_card" ? copy.residenceCard : copy.passport}</strong></span>
              </div>
            ) : null}
            <h2 id="local-check-title" tabIndex={-1} data-local-check-initial-focus>{copy.title}</h2>
            <p className={styles.lead}>{purpose}</p>
            <section id="local-check-consent-minimum" className={styles.decisionTruth}>
              <div className={styles.minimumAnswer} data-testid="consent-minimum">
                <ShieldCheck size={20} aria-hidden="true" />
                <span><small>{copy.minimum}</small><strong>{check === "person" ? copy.personMinimum : copy.ageMinimum}</strong></span>
              </div>
              <div className={styles.retentionAnswer} data-testid="consent-retention">
                <span aria-hidden="true">↳</span>
                <span><small>{copy.retention}</small><strong>{check === "person" ? copy.personRetention : copy.ageRetention}</strong></span>
              </div>
            </section>

            <details className={styles.prototype} data-testid="local-check-boundary" data-boundary-acknowledged={boundarySeen ? "true" : "false"}>
              <summary>{copy.prototype}</summary>
              <p>{copy.prototypeBody}</p>
              <dl className={styles.consent}>
                <div data-testid="consent-requester"><dt>{copy.requester}</dt><dd>{copy.account}</dd></div>
                <div data-testid="consent-purpose"><dt>{copy.purpose}</dt><dd>{purpose}</dd></div>
              </dl>
            </details>
            {boundaryError ? <p className={styles.error} role="alert" tabIndex={-1} data-local-check-error-focus>{copy.boundaryError}</p> : null}

            <div className={styles.actions}>
              <button type="button" className={styles.primary} data-testid="local-check-boundary-continue" aria-describedby="local-check-consent-minimum" onClick={begin}>
                <BadgeCheck size={18} aria-hidden="true" />{check === "person" ? copy.approvePerson : copy.approveAge}
              </button>
              <button type="button" className={styles.secondary} onClick={() => finish("cancel")}>
                {origin === "local_signal" ? copy.decline : copy.declineId}
              </button>
            </div>
          </section>
        ) : null}

        {phase === "processing" ? (
          <section className={`${styles.body} ${styles.status}`} data-local-check-body data-testid="local-check-processing" aria-live="polite">
            <div className={styles.loader}><LoaderCircle size={28} aria-hidden="true" /></div>
            <h2 id="local-check-title" tabIndex={-1} data-local-check-initial-focus>{copy.processing}</h2>
          </section>
        ) : null}

        {phase === "result" ? (
          <section className={`${styles.body} ${styles.status}`} data-local-check-body data-testid="local-check-result" data-result={result} aria-live="polite">
            <div className={result === "success" ? styles.successIcon : styles.issueIcon}>
              {result === "success" ? <BadgeCheck size={31} aria-hidden="true" /> : result === "expired" ? <CircleOff size={30} aria-hidden="true" /> : <AlertTriangle size={30} aria-hidden="true" />}
            </div>
            <h2 id="local-check-title" tabIndex={-1} data-local-check-initial-focus={result === "success" ? true : undefined}>{resultCopy[0]}</h2>
            {reviewMode ? <p className={styles.reviewScope} data-testid="direct-person-review-scope"><ShieldCheck size={15} aria-hidden="true" />{copy.reviewTruth}</p> : null}
            {result !== "success" ? <p className={styles.lead}>{resultCopy[1]}</p> : null}
            {result !== "success" ? (
              <div className={styles.actions}>
                {result === "unavailable" && !reviewMode ? (
                  <>
                    <button type="button" className={styles.primary} data-local-check-initial-focus data-testid="direct-check-sample-continue" onClick={continueWithSample}>{copy.sample}<ChevronRight size={17} aria-hidden="true" /></button>
                    <button type="button" className={`${styles.secondary} ${styles.quietReturn}`} data-testid="direct-person-return" onClick={() => finish("unavailable")}>{check === "person" ? copy.backToPass : copy.return}</button>
                  </>
                ) : accountFailure ? (
                  <>
                    <button type="button" className={styles.primary} data-local-check-initial-focus data-testid="direct-person-account-retry" onClick={prepareAccount}>{copy.retry}</button>
                    <button type="button" className={`${styles.secondary} ${styles.quietReturn}`} data-testid="direct-person-return" onClick={() => finish("cancel")}>{copy.backToPass}</button>
                  </>
                ) : check === "person" ? (
                  <>
                    <button type="button" className={styles.primary} data-local-check-initial-focus data-testid={(result === "unavailable" || result === "unsupported") && personRoute === "residence_card" ? "direct-person-use-passport" : result === "unavailable" ? "direct-person-choose-another" : "direct-person-retry"} onClick={(result === "unavailable" || result === "unsupported") && personRoute === "residence_card" ? () => choosePersonRoute("passport") : result === "unavailable" ? chooseAnotherRoute : begin}>{(result === "unavailable" || result === "unsupported") && personRoute === "residence_card" ? copy.usePassport : result === "unavailable" ? copy.chooseAnother : copy.retry}</button>
                    {result === "unavailable" && personRoute !== "residence_card" ? null : <button type="button" className={styles.secondary} data-testid="direct-person-choose-another" onClick={chooseAnotherRoute}>{copy.chooseAnother}</button>}
                    <button type="button" className={`${styles.secondary} ${styles.quietReturn}`} data-testid="direct-person-return" onClick={() => finish(result ?? "failure")}>{copy.backToPass}</button>
                  </>
                ) : (
                  <>
                    <button type="button" className={styles.primary} data-local-check-initial-focus onClick={begin}>{copy.retry}</button>
                    <button type="button" className={styles.secondary} onClick={() => finish(result ?? "failure")}>{copy.return}</button>
                  </>
                )}
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  )
}
