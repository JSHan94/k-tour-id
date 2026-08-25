"use client"

import { useRef, useState } from "react"
import { BadgeCheck, CalendarClock, ChevronRight, Fingerprint, Settings, Shield, UserRoundCheck } from "lucide-react"
import { useOndoB } from "../shared/state/ondo-b-provider"
import { LocalCheckWalkthroughB, type LocalCheckKind, type LocalCheckOutcome } from "./local-check-walkthrough-b"
import { IdWalletCommerceB } from "../commerce-b/id-wallet-commerce-b"
import styles from "./traveler-id-entry-b.module.css"

const COPY = {
  en: {
    eyebrow: "ON THIS DEVICE",
    title: "ID · Wallet",
    body: "Review minimum identity requests before they appear in a task. These local walkthroughs create no account, identity, age proof, DID, or credential.",
    local: "Local interactive boundary",
    localBody: "No scan or provider is connected. You choose each return and results last only while this screen is mounted.",
    personTitle: "Person",
    personBody: "For a future contribution that needs a minimum Person predicate. Person does not prove 19+.",
    ageTitle: "19+",
    ageBody: "For a future age-restricted task. 19+ does not prove identity or satisfy Person.",
    personOpen: "Open Person walkthrough",
    ageOpen: "Open 19+ walkthrough",
    notChecked: "Not checked",
    success: "Completed in this session",
    cancel: "Declined — no result kept",
    failure: "Failed walkthrough return",
    unavailable: "Unavailable walkthrough return",
    expired: "Expired walkthrough return",
    separateTitle: "Independent by design",
    separateBody: "A Person return never changes 19+, and a 19+ return never changes Person. Neither is persisted or reused after this local session surface closes.",
    settingsTitle: "Device data and language",
    settingsBody: "Settings remains a separate destination for language, discovery choices, Local Signal markers, and device reset.",
    settings: "Open Settings",
  },
  ko: {
    eyebrow: "이 기기",
    title: "ID · 지갑",
    body: "작업 중 최소 신원 요청이 나타나기 전에 내용을 살펴보세요. 로컬 둘러보기는 계정·신원·나이 증명·DID·자격증명을 만들지 않습니다.",
    local: "로컬 대화형 경계",
    localBody: "연결된 스캔이나 공급자는 없습니다. 각 반환을 직접 선택하며 결과는 이 화면이 유지되는 동안에만 남아요.",
    personTitle: "본인",
    personBody: "향후 로컬 기여에 최소 본인 조건이 필요할 때를 위한 흐름입니다. 본인 확인은 19+를 증명하지 않습니다.",
    ageTitle: "19+",
    ageBody: "향후 연령 제한 작업을 위한 흐름입니다. 19+는 본인을 증명하지 않습니다. 본인 조건도 충족하지 않습니다.",
    personOpen: "본인 둘러보기 열기",
    ageOpen: "19+ 둘러보기 열기",
    notChecked: "확인 전",
    success: "이 세션에서 완료",
    cancel: "거절됨 — 보관된 결과 없음",
    failure: "실패 반환",
    unavailable: "이용 불가 반환",
    expired: "만료 반환",
    separateTitle: "서로 독립적으로 설계",
    separateBody: "본인 반환은 19+를 바꾸지 않고, 19+ 반환은 본인을 바꾸지 않습니다. 어느 결과도 저장되지 않으며 이 로컬 세션 화면을 닫은 뒤 재사용되지 않아요.",
    settingsTitle: "기기 데이터와 언어",
    settingsBody: "설정은 언어·탐색 선택·로컬 시그널 표시·기기 초기화를 위한 별도 메뉴로 유지됩니다.",
    settings: "설정 열기",
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

  function returnFromWalkthrough(outcome: LocalCheckOutcome) {
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

        <section className={styles.boundary} aria-labelledby="traveler-local-boundary">
          <Shield size={20} aria-hidden="true" />
          <div><h2 id="traveler-local-boundary">{copy.local}</h2><p>{copy.localBody}</p></div>
        </section>

        <IdWalletCommerceB />

        <div className={styles.checks}>
          <section className={styles.check} data-testid="traveler-id-person" aria-labelledby="traveler-person-title">
            <div className={styles.checkIcon}><UserRoundCheck size={22} aria-hidden="true" /></div>
            <div className={styles.checkCopy}>
              <span data-outcome={personOutcome ?? "none"}>{outcomeLabel(locale, personOutcome)}</span>
              <h2 id="traveler-person-title">{copy.personTitle}</h2>
              <p>{copy.personBody}</p>
            </div>
            <button ref={personRef} type="button" onClick={() => setActiveCheck("person")}>
              {copy.personOpen}<ChevronRight size={17} aria-hidden="true" />
            </button>
          </section>

          <section className={styles.check} data-testid="traveler-id-age" aria-labelledby="traveler-age-title">
            <div className={styles.checkIcon}><CalendarClock size={22} aria-hidden="true" /></div>
            <div className={styles.checkCopy}>
              <span data-outcome={ageOutcome ?? "none"}>{outcomeLabel(locale, ageOutcome)}</span>
              <h2 id="traveler-age-title">{copy.ageTitle}</h2>
              <p>{copy.ageBody}</p>
            </div>
            <button ref={ageRef} type="button" onClick={() => setActiveCheck("age")}>
              {copy.ageOpen}<ChevronRight size={17} aria-hidden="true" />
            </button>
          </section>
        </div>

        <section className={styles.separate}>
          <BadgeCheck size={19} aria-hidden="true" />
          <div><h2>{copy.separateTitle}</h2><p>{copy.separateBody}</p></div>
        </section>

        <section className={styles.settings}>
          <div><Fingerprint size={19} aria-hidden="true" /><span><h2>{copy.settingsTitle}</h2><p>{copy.settingsBody}</p></span></div>
          <button type="button" onClick={() => actions.setTab("settings")}><Settings size={17} aria-hidden="true" />{copy.settings}</button>
        </section>
      </div>

      {activeCheck ? (
        <LocalCheckWalkthroughB
          locale={locale}
          check={activeCheck}
          origin="traveler_id"
          boundarySeen={state.localInteractionBoundarySeen}
          onAcknowledgeBoundary={actions.acknowledgeLocalInteractionBoundary}
          onReturn={returnFromWalkthrough}
        />
      ) : null}
    </div>
  )
}
