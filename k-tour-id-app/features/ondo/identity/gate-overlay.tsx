"use client"

import type { KeyboardEvent, MouseEvent } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, ArrowLeft, BadgeCheck, Check, ChevronRight, CircleUserRound, Clock3, CreditCard, FileKey2, LoaderCircle, ShieldCheck, X } from "lucide-react"
import type { GateKind, Locale, Persona } from "../contracts/domain"
import { isReturnToUsable } from "../contracts/return-to"
import { useOndo } from "../shared/state/ondo-provider"
import { focusFirstAvailableDestination } from "../shared/ui/focus-destination"
import { useModalIsolation } from "../shared/ui/use-modal-isolation"
import { useQaControls } from "../shared/ui/use-qa-controls"
import styles from "./identity.module.css"

type PersonRoute = "cx" | "residence" | "passport"

const FOCUSABLE = "a[href],button:not([disabled]),input:not([disabled]):not([type='hidden']),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])"

const COPY = {
  en: {
    close: "Return to previous screen",
    progress: "Required checks",
    simulation: "Simulation",
    previewTruth: "Preview only · No request is sent to an external provider.",
    unavailableTruth: "Not connected",
    accountTitle: "Create an account to continue",
    accountSave: "Create an account to save this place",
    accountTable: "Create an account to join this Table",
    accountMessage: "Create an account to send a message",
    accountCheckout: "Create an account to continue checkout",
    accountBody: "You’ll return to the same task after account creation. This does not complete an identity check.",
    accountStart: "Create account · Simulated",
    accountSuccess: "Complete account simulation",
    personTitle: "Complete an identity check",
    personBody: "This simulates the selected ID or passport route. It does not verify real-world activity or guarantee safety, character, or expertise.",
    cx: "Check with Mobile ID",
    cxNote: "Simulates the OmniOne CX route.",
    residence: "Check with Mobile Residence Card",
    residenceNote: "The credential path is documented; this demo provider profile is not configured.",
    passport: "Check with a passport verification provider",
    passportNote: "A provider-neutral label is used until a vendor is contracted.",
    selectRoute: "Choose a route to continue",
    startCheck: "Start check",
    completeCheck: "Complete simulated check",
    unavailable: "Show unavailable route",
    unsupportedTitle: "This verification route is not connected yet.",
    unsupportedBody: "Mobile Residence Card is a documented credential path. This demo environment has not configured or verified its provider profile. You can use the passport-provider preview or return to the previous task.",
    alternate: "Use passport provider instead",
    ageTitle: "Confirm 19+ to continue",
    ageBody: "Only the required eligibility is shown here. This simulation does not claim that an external provider uses zero-knowledge proofs.",
    ageStart: "Start 19+ check simulation",
    ageSuccess: "Confirm 19+ · Simulated",
    paymentTitle: "Complete Payment KYC",
    paymentBody: "Payment KYC is separate from your account, identity check, and 19+ status.",
    paymentStart: "Start Payment KYC simulation",
    paymentSuccess: "Complete Payment KYC · Simulated",
    fail: "Simulate failure",
    failedTitle: "The check could not be completed.",
    failedBody: "Try again with the same task preserved, or return without making changes.",
    retry: "Try again",
    return: "Return without changes",
    invalid: "We could not reopen your previous task. Please try again from the map.",
    working: "Checking simulated result…",
    queued: "Next",
  },
  ko: {
    close: "이전 화면으로 돌아가기",
    progress: "필요한 절차",
    simulation: "시뮬레이션",
    previewTruth: "미리보기 · 외부 인증기관으로 요청을 보내지 않습니다.",
    unavailableTruth: "연결 전",
    accountTitle: "계정을 만들고 계속하기",
    accountSave: "저장하려면 계정이 필요해요",
    accountTable: "Table에 참여하려면 계정이 필요해요",
    accountMessage: "메시지를 보내려면 계정이 필요해요",
    accountCheckout: "결제를 이어가려면 계정이 필요해요",
    accountBody: "계정을 만든 뒤 지금 하던 작업으로 돌아옵니다. 본인 확인은 아직 완료되지 않아요.",
    accountStart: "계정 만들기 · 시뮬레이션",
    accountSuccess: "계정 시뮬레이션 완료",
    personTitle: "본인 확인을 완료해 주세요",
    personBody: "선택한 신분증 또는 여권 경로를 시뮬레이션합니다. 실제 활동이나 안전·성품·전문성을 보증하지 않습니다.",
    cx: "모바일 신분증으로 확인",
    cxNote: "OmniOne CX 경로를 시뮬레이션합니다.",
    residence: "모바일 외국인등록증으로 확인",
    residenceNote: "자격증명 경로는 문서화됐지만, 이번 데모 제공자 프로필은 미구성입니다.",
    passport: "여권 확인 서비스로 확인",
    passportNote: "실제 업체 계약 전까지 중립 명칭을 사용합니다.",
    selectRoute: "계속할 본인 확인 경로를 선택하세요",
    startCheck: "본인 확인 시작",
    completeCheck: "본인 확인 시뮬레이션 완료",
    unavailable: "미연결 상태 보기",
    unsupportedTitle: "이 확인 경로는 아직 연결되지 않았어요.",
    unsupportedBody: "모바일 외국인등록증은 문서화된 자격증명 경로입니다. 이번 데모 환경에서는 제공자 프로필을 구성·검증하지 않았습니다. 여권 확인 프리뷰를 사용하거나 이전 작업으로 돌아갈 수 있어요.",
    alternate: "여권 확인 경로로 대신 진행",
    ageTitle: "계속하려면 19+ 확인이 필요해요",
    ageBody: "필요한 자격만 표시합니다. 이 시뮬레이션은 외부 인증기관의 영지식 증명 사용을 주장하지 않습니다.",
    ageStart: "19+ 확인 시뮬레이션 시작",
    ageSuccess: "19+ 확인 · 시뮬레이션",
    paymentTitle: "결제용 KYC를 완료해 주세요",
    paymentBody: "결제용 KYC는 계정·본인 확인·19+ 상태와 분리되어 있습니다.",
    paymentStart: "결제용 KYC 시뮬레이션 시작",
    paymentSuccess: "결제용 KYC 완료 · 시뮬레이션",
    fail: "실패 상태 보기",
    failedTitle: "확인을 완료하지 못했어요.",
    failedBody: "같은 작업을 유지한 채 다시 시도하거나, 변경 없이 이전 화면으로 돌아갈 수 있어요.",
    retry: "다시 시도",
    return: "변경 없이 돌아가기",
    invalid: "이전 작업을 다시 열지 못했어요. 지도에서 다시 시도해 주세요.",
    working: "시뮬레이션 결과 확인 중…",
    queued: "다음",
  },
} satisfies Record<Locale, Record<string, string>>

const GATE_LABELS: Record<Locale, Record<GateKind, string>> = {
  en: { account: "Account", person: "Identity", age: "19+", payment_kyc: "Payment KYC" },
  ko: { account: "계정", person: "본인 확인", age: "19+", payment_kyc: "결제용 KYC" },
}

const COMPLETION_DESTINATIONS = {
  SAVE_VENUE: [
    "[data-testid='canonical-place-overlay'] #canonical-place-title",
    "[data-testid='canonical-place-peek'] [data-testid='canonical-place-details']",
    "[data-testid='place-overlay'] #place-title",
    "[data-testid='place-peek'] [data-testid='place-details']",
  ],
  JOIN_TABLE: [
    "[data-testid='table-open-chat']",
    "[data-testid='table-action-message']",
    "[data-testid='ondo-sheet'] h2",
  ],
  OPEN_CHAT: [
    "[data-testid='ondo-sheet'] [data-testid='chat-message-input']",
    "[data-testid='ondo-sheet'] textarea",
    "[data-testid='ondo-sheet'] h2",
  ],
  SUBMIT_LOCAL_SIGNAL: [
    "[data-testid='local-signal-overlay'] [data-testid='local-signal-submit']",
    "[data-testid='local-signal-overlay'] textarea",
    "[data-testid='local-signal-overlay'] h2",
  ],
  START_CHECKOUT: [
    "[data-testid='checkout-overlay'] [data-testid='checkout-start']",
    "[data-testid='checkout-overlay'] h2",
  ],
  OPEN_AFTER19: [
    "[data-testid='canonical-place-overlay'] [data-testid='canonical-after19-access']",
    "[data-testid='after19-auto-banner']",
    "[data-testid='after19-toggle']",
  ],
  MINT_BADGE: [
    "[data-testid='labs-overlay'] [data-testid='mint-badge']",
    "[data-testid='labs-overlay'] h2",
    "[data-testid='open-labs-id']",
  ],
} as const

function defaultRoute(persona: Persona | null): PersonRoute {
  if (persona === "korean_local") return "cx"
  if (persona === "long_term_resident") return "residence"
  return "passport"
}

export function GateOverlay() {
  const { state, actions } = useOndo()
  const [route, setRoute] = useState<PersonRoute>(() => defaultRoute(state.persona))
  const [started, setStarted] = useState(false)
  const [busy, setBusy] = useState(false)
  const completionLock = useRef(false)
  const terminalCompletionRef = useRef<keyof typeof COMPLETION_DESTINATIONS | null>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const qaControls = useQaControls()
  const t = COPY[state.locale]
  const gate = state.gate

  useEffect(() => {
    setRoute(defaultRoute(state.persona))
    setStarted(false)
    setBusy(false)
    completionLock.current = false
    terminalCompletionRef.current = null
  }, [gate?.activeGate, gate?.tokenId, state.persona])

  useEffect(() => {
    if (!gate) return
    if (gate.consumedAt) {
      actions.cancelGate()
      return
    }
    if (!isReturnToUsable(gate)) {
      actions.cancelGate()
      actions.notify(t.invalid)
    }
  }, [actions, gate, t.invalid])

  useEffect(() => {
    if (!gate || gate.consumedAt || !isReturnToUsable(gate)) return
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
      const completedCta = terminalCompletionRef.current
      if (completedCta) {
        focusFirstAvailableDestination(COMPLETION_DESTINATIONS[completedCta])
        return
      }
      window.requestAnimationFrame(() => {
        const opener = returnFocusRef.current
        if (opener?.isConnected && !opener.closest("[inert], [aria-hidden='true']")) opener.focus({ preventScroll: true })
      })
    }
  }, [gate?.tokenId])

  useModalIsolation(Boolean(gate && !gate.consumedAt && isReturnToUsable(gate)), layerRef)

  useEffect(() => {
    if (!gate || gate.consumedAt || !isReturnToUsable(gate)) return
    const interceptEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return
      event.preventDefault()
      event.stopImmediatePropagation()
      actions.cancelGate()
    }
    document.addEventListener("keydown", interceptEscape, true)
    return () => document.removeEventListener("keydown", interceptEscape, true)
  }, [actions, gate?.tokenId])

  useEffect(() => {
    if (!gate || gate.consumedAt || !isReturnToUsable(gate)) return
    const dialog = dialogRef.current
    if (!dialog?.contains(document.activeElement)) {
      dialog?.querySelector<HTMLElement>("[data-gate-initial-focus]")?.focus({ preventScroll: true })
    }
  }, [gate?.activeGate, gate?.tokenId, state.gateState])

  const queue = useMemo(() => gate?.gateQueue ?? [], [gate?.gateQueue])
  if (!gate || gate.consumedAt || !isReturnToUsable(gate)) return null

  const active = gate.activeGate
  const fail = (unsupported = false) => {
    completionLock.current = false
    setBusy(false)
    actions.failGate(active, unsupported)
  }
  const complete = () => {
    if (completionLock.current) return
    completionLock.current = true
    if (queue.indexOf(active) === queue.length - 1) terminalCompletionRef.current = gate.cta
    setBusy(true)
    window.setTimeout(() => actions.completeGate(active), 360)
  }
  const retry = () => {
    completionLock.current = false
    setBusy(false)
    setStarted(false)
    actions.setGateState("pending")
  }
  const chooseAlternate = (event: MouseEvent<HTMLButtonElement>) => {
    // A rapid second pointer click can land on this newly rendered button at
    // the same coordinates as the Residence start action. Require a distinct
    // activation so the unavailable result cannot be skipped accidentally.
    if (event.detail > 1) return
    setRoute("passport")
    setStarted(false)
    completionLock.current = false
    actions.setGateState("pending")
  }
  const startPersonCheck = (event: MouseEvent<HTMLButtonElement>) => {
    if (event.detail > 1) return
    if (route === "residence") {
      fail(true)
      return
    }
    setStarted(true)
  }

  function guardRapidGateActivation(event: MouseEvent<HTMLDivElement>) {
    if (event.detail <= 1) return
    event.preventDefault()
    event.stopPropagation()
    dialogRef.current?.querySelector<HTMLElement>("[data-gate-initial-focus]")?.focus({ preventScroll: true })
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault()
      event.stopPropagation()
      actions.cancelGate()
      return
    }
    if (event.key !== "Tab") return
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
      .filter((element) => element.offsetParent !== null)
    if (!focusable.length) {
      event.preventDefault()
      dialogRef.current?.focus()
      return
    }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const routeCopy = route === "cx"
    ? { title: t.cx, note: t.cxNote }
    : route === "residence"
      ? { title: t.residence, note: t.residenceNote }
      : { title: t.passport, note: t.passportNote }
  const accountTitle = gate.cta === "SAVE_VENUE"
    ? t.accountSave
    : gate.cta === "JOIN_TABLE"
      ? t.accountTable
      : gate.cta === "OPEN_CHAT"
        ? t.accountMessage
        : gate.cta === "START_CHECKOUT"
          ? t.accountCheckout
          : t.accountTitle

  return (
    <div ref={layerRef} className={styles.gateLayer} data-testid="ondo-gate-overlay" onClickCapture={guardRapidGateActivation}>
      <button type="button" tabIndex={-1} className={styles.backdrop} onClick={actions.cancelGate} aria-hidden="true" />
      <section ref={dialogRef} className={styles.gate} role="dialog" aria-modal="true" aria-labelledby="gate-title" tabIndex={-1} onKeyDown={handleDialogKeyDown}>
        <div className={styles.grabber} aria-hidden="true" />
        <header className={styles.gateHeader}>
          <button type="button" data-gate-initial-focus className={styles.close} onClick={actions.cancelGate} aria-label={t.close}><X size={19} /></button>
          <span className={styles.truth}><i />{state.gateState === "unsupported" ? t.unavailableTruth : t.simulation}</span>
        </header>

        <div className={styles.gateProgress} role="list" aria-label={t.progress} data-testid="ondo-gate-progress">
          {queue.map((kind, index) => {
            const currentIndex = queue.indexOf(active)
            const done = index < currentIndex
            const current = kind === active
            return (
              <div key={`${kind}-${index}`} role="listitem" className={current ? styles.gateStepCurrent : done ? styles.gateStepDone : styles.gateStep}>
                <span>{done ? <Check size={13} /> : index + 1}</span><small>{GATE_LABELS[state.locale][kind]}</small>
                {index < queue.length - 1 ? <ChevronRight size={13} /> : null}
              </div>
            )
          })}
        </div>
        <p className={styles.previewTruth}>{t.previewTruth}</p>

        {state.gateState === "failed" ? (
          <div className={styles.gateBody} role="alert" aria-atomic="true" data-testid="gate-failure">
            <span className={styles.stateIconDanger}><AlertCircle size={25} /></span>
            <h2 id="gate-title">{t.failedTitle}</h2>
            <p>{t.failedBody}</p>
            <button type="button" className={styles.primary} onClick={retry}>{t.retry}</button>
            <button type="button" className={styles.secondary} onClick={actions.cancelGate}><ArrowLeft size={16} />{t.return}</button>
          </div>
        ) : state.gateState === "unsupported" ? (
          <div className={styles.gateBody} data-testid="gate-unsupported">
            <span className={styles.stateIconNeutral}><FileKey2 size={25} /></span>
            <h2 id="gate-title">{t.unsupportedTitle}</h2>
            <p>{t.unsupportedBody}</p>
            <button type="button" className={styles.primary} onClick={chooseAlternate}>{t.alternate}</button>
            <button type="button" className={styles.secondary} onClick={actions.cancelGate}><ArrowLeft size={16} />{t.return}</button>
          </div>
        ) : active === "account" ? (
          <div className={styles.gateBody}>
            <span className={styles.stateIcon}><CircleUserRound size={26} /></span>
            <h2 id="gate-title">{accountTitle}</h2>
            <p>{t.accountBody}</p>
            {!started ? <button type="button" className={styles.primary} onClick={() => setStarted(true)}>{t.accountStart}</button> : <button type="button" className={styles.primary} disabled={busy} onClick={complete}>{busy ? <><LoaderCircle className={styles.spin} size={17} />{t.working}</> : t.accountSuccess}</button>}
            {qaControls ? <button type="button" className={styles.tertiary} onClick={() => fail()}>{t.fail}</button> : null}
            <button type="button" className={styles.secondary} onClick={actions.cancelGate}>{t.return}</button>
          </div>
        ) : active === "person" ? (
          <div className={styles.gateBody}>
            <span className={styles.stateIcon}><BadgeCheck size={26} /></span>
            <h2 id="gate-title">{t.personTitle}</h2>
            <p>{t.personBody}</p>
            {!started ? (
              <>
                <div className={styles.routePicker} aria-label={t.selectRoute}>
                  {(state.persona === "long_term_resident" ? ["residence", "passport"] : state.persona === "korean_local" ? ["cx"] : ["passport"]).map((item) => {
                    const itemRoute = item as PersonRoute
                    const content = itemRoute === "cx" ? { title: t.cx, note: t.cxNote } : itemRoute === "residence" ? { title: t.residence, note: t.residenceNote } : { title: t.passport, note: t.passportNote }
                    return <button key={item} type="button" className={route === itemRoute ? styles.routeSelected : styles.route} aria-pressed={route === itemRoute} onClick={() => setRoute(itemRoute)} data-testid={`person-route-${itemRoute}`}><ShieldCheck size={20} /><span><strong>{content.title}</strong><small>{content.note}</small></span>{route === itemRoute ? <Check size={16} /> : null}</button>
                  })}
                </div>
                <button type="button" className={styles.primary} onClick={startPersonCheck}>{t.startCheck}</button>
                {route === "residence" && qaControls ? <button type="button" className={styles.tertiary} onClick={() => fail(true)}>{t.unavailable}</button> : null}
              </>
            ) : (
              <>
                <div className={styles.providerCard}><ShieldCheck size={20} /><span><strong>{routeCopy.title}</strong><small>{routeCopy.note}</small></span></div>
                <button type="button" className={styles.primary} disabled={busy} onClick={complete}>{busy ? <><LoaderCircle className={styles.spin} size={17} />{t.working}</> : t.completeCheck}</button>
                {qaControls ? <button type="button" className={styles.tertiary} onClick={() => fail()}>{t.fail}</button> : null}
              </>
            )}
            <button type="button" className={styles.secondary} onClick={actions.cancelGate}>{t.return}</button>
          </div>
        ) : active === "age" ? (
          <div className={styles.gateBody}>
            <span className={styles.stateIconNight}><Clock3 size={26} /></span>
            <h2 id="gate-title">{t.ageTitle}</h2>
            <p>{t.ageBody}</p>
            {!started ? <button type="button" className={styles.primaryNight} onClick={() => setStarted(true)}>{t.ageStart}</button> : <button type="button" className={styles.primaryNight} disabled={busy} onClick={complete}>{busy ? <><LoaderCircle className={styles.spin} size={17} />{t.working}</> : t.ageSuccess}</button>}
            {qaControls ? <button type="button" className={styles.tertiary} onClick={() => fail()}>{t.fail}</button> : null}
            <button type="button" className={styles.secondary} onClick={actions.cancelGate}>{t.return}</button>
          </div>
        ) : (
          <div className={styles.gateBody}>
            <span className={styles.stateIcon}><CreditCard size={26} /></span>
            <h2 id="gate-title">{t.paymentTitle}</h2>
            <p>{t.paymentBody}</p>
            {!started ? <button type="button" className={styles.primary} onClick={() => setStarted(true)}>{t.paymentStart}</button> : <button type="button" className={styles.primary} disabled={busy} onClick={complete}>{busy ? <><LoaderCircle className={styles.spin} size={17} />{t.working}</> : t.paymentSuccess}</button>}
            {qaControls ? <button type="button" className={styles.tertiary} onClick={() => fail()}>{t.fail}</button> : null}
            <button type="button" className={styles.secondary} onClick={actions.cancelGate}>{t.return}</button>
          </div>
        )}
      </section>
    </div>
  )
}
