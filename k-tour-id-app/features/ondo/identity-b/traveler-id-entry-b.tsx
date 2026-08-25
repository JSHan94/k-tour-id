"use client"

import { useRef, useState } from "react"
import {
  BadgeCheck,
  CalendarClock,
  ChevronRight,
  CircleUserRound,
  Fingerprint,
  Settings,
  ShieldCheck,
  UserRoundCheck,
  WalletCards,
} from "lucide-react"
import { useOndoB } from "../shared/state/ondo-b-provider"
import { LocalCheckWalkthroughB, type LocalCheckKind, type LocalCheckOutcome } from "./local-check-walkthrough-b"
import { IdWalletCommerceB } from "../commerce-b/id-wallet-commerce-b"
import styles from "./traveler-id-entry-b.module.css"

const COPY = {
  en: {
    eyebrow: "YOUR KOREA, YOUR CONTROL",
    title: "Travel Pass",
    body: "Keep the few answers and payment tools your trip may need — separate, private, and ready only when you choose.",
    passLabel: "ONDO · KOREA TRAVEL PASS",
    passState: "Guest pass",
    passBody: "Explore first. Activate only when saving, joining or paying needs it.",
    readiness: "Trip readiness",
    readinessBody: "Each item stands on its own. Complete only the one an action asks for.",
    accountTitle: "Account",
    accountGuest: "Guest",
    accountBody: "No account needed to explore Korea.",
    personTitle: "Person",
    personBody: "Person does not prove 19+.",
    ageTitle: "19+",
    ageBody: "19+ does not prove identity.",
    paymentTitle: "Payment",
    paymentBody: "A separate test wallet for ONDO benefits.",
    notChecked: "Not checked",
    success: "Ready this session",
    cancel: "Not completed",
    failure: "Try again",
    unavailable: "Unavailable",
    expired: "Expired",
    walletReady: "Ready",
    walletNotReady: "Set up",
    checkPerson: "Check Person",
    checkAge: "Check 19+",
    prototype: "Privacy & availability",
    prototypeBody: "Person, 19+ and payment readiness are independent and remain only while this screen is open. No provider, credential or live money service is connected.",
    settings: "Device settings",
  },
  ko: {
    eyebrow: "나의 한국 여행, 나의 선택",
    title: "여행 패스",
    body: "여행에 필요한 최소 답과 결제 도구를 따로, 안전하게 준비하고 원할 때만 사용하세요.",
    passLabel: "ONDO · KOREA TRAVEL PASS",
    passState: "게스트 패스",
    passBody: "먼저 둘러보세요. 저장·참여·결제에 필요할 때만 활성화합니다.",
    readiness: "여행 준비 상태",
    readinessBody: "각 항목은 서로 독립적이에요. 작업이 요청하는 한 가지만 완료하세요.",
    accountTitle: "계정",
    accountGuest: "게스트",
    accountBody: "한국을 둘러보는 데 계정은 필요 없어요.",
    personTitle: "본인",
    personBody: "본인 확인은 19+를 증명하지 않습니다.",
    ageTitle: "19+",
    ageBody: "19+는 본인을 증명하지 않습니다.",
    paymentTitle: "결제",
    paymentBody: "ONDO 혜택용 별도 테스트 지갑입니다.",
    notChecked: "확인 전",
    success: "이 세션에서 준비됨",
    cancel: "완료 전",
    failure: "다시 시도",
    unavailable: "이용 불가",
    expired: "만료됨",
    walletReady: "준비됨",
    walletNotReady: "설정 필요",
    checkPerson: "본인 확인",
    checkAge: "19+ 확인",
    prototype: "개인정보와 이용 범위",
    prototypeBody: "본인·19+·결제 준비 상태는 서로 독립적이며 이 화면을 여는 동안에만 유지됩니다. 공급자·자격증명·실제 결제 서비스는 연결되지 않습니다.",
    settings: "기기 설정",
  },
} as const

function outcomeLabel(locale: "en" | "ko", outcome: LocalCheckOutcome | null) {
  const copy = COPY[locale]
  if (!outcome) return copy.notChecked
  return copy[outcome]
}

export function TravelerIdEntryB() {
  const { state, actions } = useOndoB()
  const [personOutcome, setPersonOutcome] = useState<LocalCheckOutcome | null>(null)
  const [ageOutcome, setAgeOutcome] = useState<LocalCheckOutcome | null>(null)
  const [activeCheck, setActiveCheck] = useState<LocalCheckKind | null>(null)
  const personRef = useRef<HTMLButtonElement>(null)
  const ageRef = useRef<HTMLButtonElement>(null)
  const locale = state.locale
  const copy = COPY[locale]
  const walletStatus = state.commerceWalletStatus

  function returnFromCheck(outcome: LocalCheckOutcome) {
    const returningCheck = activeCheck
    if (returningCheck === "person") setPersonOutcome(outcome)
    if (returningCheck === "age") setAgeOutcome(outcome)
    setActiveCheck(null)
    window.requestAnimationFrame(() => (returningCheck === "person" ? personRef.current : ageRef.current)?.focus({ preventScroll: true }))
  }

  return (
    <div className={styles.root}>
      <div className={styles.screen} data-testid="ondo-b-traveler-id">
        <header className={styles.header}>
          <p>{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <span>{copy.body}</span>
        </header>

        <section className={styles.pass} aria-label={copy.passState}>
          <div className={styles.passGlow} aria-hidden="true" />
          <div className={styles.passTop}><span>{copy.passLabel}</span><Fingerprint size={28} strokeWidth={1.5} aria-hidden="true" /></div>
          <div className={styles.passMain}>
            <div><small>{copy.passState}</small><strong>SEOUL — BUSAN</strong></div>
            <BadgeCheck size={23} aria-hidden="true" />
          </div>
          <p>{copy.passBody}</p>
        </section>

        <IdWalletCommerceB />

        <section className={styles.readiness} data-testid="travel-pass-status" aria-labelledby="travel-readiness-title">
          <div className={styles.sectionHeading}>
            <div><h2 id="travel-readiness-title">{copy.readiness}</h2><p>{copy.readinessBody}</p></div>
            <ShieldCheck size={21} aria-hidden="true" />
          </div>

          <div className={styles.statusGrid}>
            <article className={styles.statusCard} data-testid="traveler-id-account" data-status="guest">
              <div className={styles.statusTop}><CircleUserRound size={20} aria-hidden="true" /><span>{copy.accountGuest}</span></div>
              <h3>{copy.accountTitle}</h3>
              <p>{copy.accountBody}</p>
            </article>

            <article className={styles.statusCard} data-testid="traveler-id-person" data-status={personOutcome ?? "none"}>
              <div className={styles.statusTop}><UserRoundCheck size={20} aria-hidden="true" /><span>{outcomeLabel(locale, personOutcome)}</span></div>
              <h3>{copy.personTitle}</h3>
              <p>{copy.personBody}</p>
              <button ref={personRef} type="button" onClick={() => setActiveCheck("person")}>{copy.checkPerson}<ChevronRight size={17} aria-hidden="true" /></button>
            </article>

            <article className={styles.statusCard} data-testid="traveler-id-age" data-status={ageOutcome ?? "none"}>
              <div className={styles.statusTop}><CalendarClock size={20} aria-hidden="true" /><span>{outcomeLabel(locale, ageOutcome)}</span></div>
              <h3>{copy.ageTitle}</h3>
              <p>{copy.ageBody}</p>
              <button ref={ageRef} type="button" onClick={() => setActiveCheck("age")}>{copy.checkAge}<ChevronRight size={17} aria-hidden="true" /></button>
            </article>

            <article className={styles.statusCard} data-testid="traveler-id-payment" data-status={walletStatus}>
              <div className={styles.statusTop}><WalletCards size={20} aria-hidden="true" /><span>{walletStatus === "ready" ? copy.walletReady : copy.walletNotReady}</span></div>
              <h3>{copy.paymentTitle}</h3>
              <p>{copy.paymentBody}</p>
            </article>
          </div>
        </section>

        <footer className={styles.footer}>
          <details>
            <summary>{copy.prototype}</summary>
            <p>{copy.prototypeBody}</p>
          </details>
          <button type="button" onClick={() => actions.setTab("settings")}><Settings size={17} aria-hidden="true" />{copy.settings}</button>
        </footer>
      </div>

      {activeCheck ? (
        <LocalCheckWalkthroughB
          locale={locale}
          check={activeCheck}
          origin="traveler_id"
          boundarySeen={state.localInteractionBoundarySeen}
          onAcknowledgeBoundary={actions.acknowledgeLocalInteractionBoundary}
          onReturn={returnFromCheck}
        />
      ) : null}
    </div>
  )
}
