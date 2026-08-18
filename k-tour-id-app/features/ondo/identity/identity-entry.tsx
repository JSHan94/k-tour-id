"use client"

import { BadgeCheck, ChevronRight, CircleUserRound, Clock3, CreditCard, FlaskConical, Globe2, Shield, UserRound } from "lucide-react"
import type { Locale } from "../contracts/domain"
import { useOndo } from "../shared/state/ondo-provider"
import { ProfilePanel } from "../profile/profile-panel"
import { TrustPanel } from "../trust/trust-panel"
import styles from "./identity.module.css"

const COPY = {
  en: {
    eyebrow: "ONDO ID",
    title: "Account and checks",
    guest: "Exploring without an account",
    accountReady: "Account ready",
    accountFailed: "Account setup failed",
    personNone: "Person check not completed",
    personPending: "Person check in progress",
    personReady: "Person check complete · Simulated",
    personUnavailable: "Person check route unavailable",
    personFailed: "Person check needs attention",
    ageNone: "19+ not checked",
    ageReady: "19+ confirmed · Simulated",
    ageFailed: "19+ check needs attention",
    paymentNone: "Payment KYC not completed",
    paymentPending: "Payment KYC in progress",
    paymentReady: "Payment KYC complete · Simulated",
    paymentFailed: "Payment KYC needs attention",
    boundary: "Checks confirm specific eligibility. They do not guarantee safety, character, or expertise.",
    jitTitle: "Checks appear only when needed",
    jitBody: "Explore without an account. Saving, joining a Table, After 19, and checkout ask only for their minimum checks and return you to the same task.",
    routes: "Preview flow",
    routePreview: "When a protected experience needs a person check, ONDO opens the route prepared for your selected intent—Mobile ID, Mobile Residence Card availability, or a neutral passport provider—and then returns to the same task.",
    routeTruth: "Preview only · No request is sent to an external provider.",
    labs: "Labs",
    labsBody: "Experimental signer, asset, bridge, and badge hypotheses",
  },
  ko: {
    eyebrow: "ONDO ID",
    title: "계정과 확인",
    guest: "계정 없이 둘러보는 중",
    accountReady: "계정 사용 가능",
    accountFailed: "계정 준비 실패",
    personNone: "사람 확인 전",
    personPending: "사람 확인 중",
    personReady: "사람 확인 완료 · 시뮬레이션",
    personUnavailable: "사람 확인 경로 미연결",
    personFailed: "사람 확인 재시도 필요",
    ageNone: "19+ 확인 전",
    ageReady: "19+ 확인됨 · 시뮬레이션",
    ageFailed: "19+ 확인 재시도 필요",
    paymentNone: "결제용 KYC 전",
    paymentPending: "결제용 KYC 확인 중",
    paymentReady: "결제용 KYC 확인됨 · 시뮬레이션",
    paymentFailed: "결제용 KYC 재시도 필요",
    boundary: "확인은 특정 자격만 확인하며, 안전·성품·전문성을 보증하지 않습니다.",
    jitTitle: "확인은 필요한 순간에만",
    jitBody: "계정 없이 먼저 둘러보세요. 저장·Table·After 19·결제는 각 행동에 필요한 최소 확인만 요청하고 같은 작업으로 돌아옵니다.",
    routes: "확인 흐름 미리보기",
    routePreview: "보호된 경험에 사람 확인이 필요하면 선택한 이용 목적에 맞춰 모바일 신분증, 모바일 외국인등록증 지원 확인 또는 중립 Passport provider 경로를 열고 같은 작업으로 돌아옵니다.",
    routeTruth: "미리보기 · 외부 인증기관으로 요청을 보내지 않습니다.",
    labs: "Labs",
    labsBody: "signer·asset·bridge·badge 기술 가설 실험 영역",
  },
} satisfies Record<Locale, Record<string, string>>

export function IdentityEntry() {
  const { state, actions } = useOndo()
  const t = COPY[state.locale]
  const personLabel = state.person === "PER-VERIFIED" ? t.personReady : state.person === "PER-PENDING" ? t.personPending : state.person === "PER-UNSUPPORTED" ? t.personUnavailable : ["PER-FAILED", "PER-EXPIRED"].includes(state.person) ? t.personFailed : t.personNone
  const ageLabel = state.age === "AGE-VERIFIED" ? t.ageReady : ["AGE-FAILED", "AGE-EXPIRED"].includes(state.age) ? t.ageFailed : t.ageNone
  const paymentLabel = state.paymentKyc === "PKY-VERIFIED" ? t.paymentReady : state.paymentKyc === "PKY-PENDING" ? t.paymentPending : ["PKY-FAILED", "PKY-EXPIRED"].includes(state.paymentKyc) ? t.paymentFailed : t.paymentNone

  return (
    <div className={styles.identityPage} data-testid="ondo-identity-entry">
      <header className={styles.identityHeader}>
        <div><p>{t.eyebrow}</p><h1>{t.title}</h1></div>
        <button type="button" onClick={() => actions.setLocale(state.locale === "en" ? "ko" : "en")}>{state.locale === "en" ? "KO" : "EN"}</button>
      </header>

      <section className={styles.accountCard}>
        <span className={state.account === "ACC-ACTIVE" ? styles.accountIconReady : styles.accountIcon}><CircleUserRound size={25} /></span>
        <div data-account-state={state.account}><strong>{state.account === "ACC-ACTIVE" ? t.accountReady : state.account === "ACC-FAILED" ? t.accountFailed : t.guest}</strong></div>
        <i className={state.account === "ACC-ACTIVE" ? styles.statusReady : styles.statusNeutral}>{state.account === "ACC-ACTIVE" ? <BadgeCheck size={18} /> : <UserRound size={18} />}</i>
      </section>

      <section className={styles.checks} aria-label={t.title}>
        <article data-person-state={state.person}><span><Shield size={18} /></span><div><strong>{personLabel}</strong></div></article>
        <article data-age-state={state.age}><span><Clock3 size={18} /></span><div><strong>{ageLabel}</strong></div></article>
        <article data-payment-kyc-state={state.paymentKyc}><span><CreditCard size={18} /></span><div><strong>{paymentLabel}</strong></div></article>
      </section>

      <p className={styles.boundary}><Shield size={15} />{t.boundary}</p>

      <section className={styles.jitCard}>
        <div className={styles.jitMark}><Globe2 size={22} /></div>
        <div><h2>{t.jitTitle}</h2><p>{t.jitBody}</p></div>
      </section>

      <section className={styles.routes}>
        <h2>{t.routes}</h2>
        <p className={styles.routePreview}>{t.routePreview}</p>
        <p>{t.routeTruth}</p>
      </section>

      <ProfilePanel />
      <TrustPanel />

      <button type="button" className={styles.labsEntry} onClick={() => actions.setSurface({ kind: "labs" })}>
        <span><FlaskConical size={19} /></span><div><strong>{t.labs}</strong><small>{t.labsBody}</small></div><ChevronRight size={18} />
      </button>
    </div>
  )
}
