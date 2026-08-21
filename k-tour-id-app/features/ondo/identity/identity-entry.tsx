"use client"

import { useState } from "react"
import { BadgeCheck, ChevronRight, CircleUserRound, Clock3, CreditCard, FlaskConical, Globe2, LogOut, Shield, UserRound } from "lucide-react"
import type { Locale } from "../contracts/domain"
import { useOndo } from "../shared/state/ondo-provider"
import { ResetConfirmationSheet } from "../shared/ui/reset-confirmation-sheet"
import { ProfilePanel } from "../profile/profile-panel"
import { TrustPanel } from "../trust/trust-panel"
import styles from "./identity.module.css"

const COPY = {
  en: {
    eyebrow: "ONDO ID",
    title: "Account and identity checks",
    guest: "Exploring without an account",
    accountReady: "Account ready",
    accountFailed: "Account setup failed",
    personNone: "Identity check not completed",
    personPending: "Identity check in progress",
    personReady: "Identity check complete · Simulated",
    personUnavailable: "Identity check route unavailable",
    personFailed: "Identity check needs attention",
    ageNone: "19+ not checked",
    ageReady: "19+ confirmed · Simulated",
    ageFailed: "19+ check needs attention",
    paymentNone: "Payment KYC not completed",
    paymentPending: "Payment KYC in progress",
    paymentReady: "Payment KYC complete · Simulated",
    paymentFailed: "Payment KYC needs attention",
    boundary: "Account, identity, 19+, and Payment KYC remain separate. None guarantees safety, character, or expertise.",
    jitTitle: "Checks appear only when needed",
    jitBody: "Explore without an account. Saving, joining a Table, After 19, and checkout ask only for their minimum checks and return you to the same task.",
    jitBodyReady: "Your account is ready. Joining a Table, After 19, and checkout still ask only for the additional checks each action needs, then return you to the same task.",
    routes: "Preview flow",
    routePreview: "When an experience needs an identity check, ONDO opens the route prepared for your selected intent—Mobile ID, Mobile Residence Card availability, or a neutral passport provider—and then returns to the same task.",
    routeTruth: "Preview only · No request is sent to an external provider.",
    labs: "Labs",
    labsBody: "Experimental signing, asset, chain-link, and souvenir hypotheses",
    after19Setting: "After 19 auto-open",
    after19SettingBody: "Open the night preview automatically only after a current 19+ check and 19:00 Korea time.",
    sessionTitle: "Browser session",
    sessionBody: "Manage the simulated account and private activity kept only in this browser tab.",
    sessionOpen: "Sign out and clear this session",
    sessionOpenGuest: "Clear this session",
    sessionDialog: "Sign out and clear this session?",
    sessionDialogGuest: "Clear this session?",
    sessionDescription: "This signs out of the simulated browser account and clears identity, 19+, Payment KYC, profile, activity, Tables, chat, reports, Labs, accepted visits, and payment progress. No server account is created or deleted.",
    sessionDescriptionGuest: "This clears identity, 19+, Payment KYC, profile, activity, Tables, chat, reports, Labs, accepted visits, and payment progress from this browser tab. This preview has no connected server account.",
    sessionPreserved: "Your language, guide, After 19 setting, saved places, and discovery choices stay on this device.",
    sessionCancel: "Keep this session",
    sessionConfirm: "Sign out and clear",
    sessionConfirmGuest: "Clear session",
    sessionReceipt: "Browser session cleared. You are now exploring without an account. Saved places and discovery settings remain.",
  },
  ko: {
    eyebrow: "ONDO ID",
    title: "계정과 신원 확인",
    guest: "계정 없이 둘러보는 중",
    accountReady: "계정 사용 가능",
    accountFailed: "계정 준비 실패",
    personNone: "본인 확인 전",
    personPending: "본인 확인 중",
    personReady: "본인 확인 완료 · 시뮬레이션",
    personUnavailable: "본인 확인 경로 미연결",
    personFailed: "본인 확인 재시도 필요",
    ageNone: "19+ 확인 전",
    ageReady: "19+ 확인됨 · 시뮬레이션",
    ageFailed: "19+ 확인 재시도 필요",
    paymentNone: "결제용 본인 확인(KYC) 전",
    paymentPending: "결제용 본인 확인(KYC) 중",
    paymentReady: "결제용 본인 확인(KYC) 완료 · 시뮬레이션",
    paymentFailed: "결제용 본인 확인(KYC) 재시도 필요",
    boundary: "계정·본인·19+·결제용 KYC는 서로 분리되어 있으며, 어느 단계도 안전·성품·전문성을 보증하지 않습니다.",
    jitTitle: "신원·연령·결제 확인은 필요한 순간에만",
    jitBody: "계정 없이 먼저 둘러보세요. 저장·Table·After 19·결제는 각 행동에 필요한 최소 절차만 요청하고 같은 작업으로 돌아옵니다.",
    jitBodyReady: "계정은 준비됐어요. Table·After 19·결제는 각 행동에 추가로 필요한 절차만 요청한 뒤 같은 작업으로 돌아옵니다.",
    routes: "신원 확인 경로 미리보기",
    routePreview: "본인 확인이 필요한 경험에서는 선택한 이용 목적에 맞춰 모바일 신분증, 모바일 외국인등록증 지원 여부 또는 중립적인 여권 확인 경로를 열고 같은 작업으로 돌아옵니다.",
    routeTruth: "미리보기 · 외부 인증기관으로 요청을 보내지 않습니다.",
    labs: "기술 실험실",
    labsBody: "서명·자산·체인 연결·기념 배지 기술 가설 실험 영역",
    after19Setting: "After 19 자동 열기",
    after19SettingBody: "현재 유효한 19+ 확인과 한국 시간 19:00 이후 조건이 모두 맞을 때만 밤 프리뷰를 자동으로 열어요.",
    sessionTitle: "브라우저 세션",
    sessionBody: "이 브라우저 탭에만 남는 시뮬레이션 계정과 비공개 활동을 관리해요.",
    sessionOpen: "로그아웃하고 이 세션 지우기",
    sessionOpenGuest: "이 세션 지우기",
    sessionDialog: "로그아웃하고 이 세션을 지울까요?",
    sessionDialogGuest: "이 세션을 지울까요?",
    sessionDescription: "시뮬레이션 브라우저 계정에서 로그아웃하고 본인·19+·결제용 KYC·프로필·활동·모임·대화·신고·Labs·인정된 방문·결제 진행 상태를 지웁니다. 서버 계정을 만들거나 삭제하지 않아요.",
    sessionDescriptionGuest: "본인·19+·결제용 KYC·프로필·활동·모임·대화·신고·Labs·인정된 방문·결제 진행 상태를 이 브라우저 탭에서 지웁니다. 이 미리보기에는 연결된 서버 계정이 없어요.",
    sessionPreserved: "언어, 가이드, After 19 설정, 저장한 장소와 둘러보기 선택은 이 기기에 남아요.",
    sessionCancel: "이 세션 유지",
    sessionConfirm: "로그아웃하고 지우기",
    sessionConfirmGuest: "세션 지우기",
    sessionReceipt: "브라우저 세션을 지웠어요. 계정 없이 둘러보는 중이며 저장한 장소와 둘러보기 설정은 남아 있어요.",
  },
} satisfies Record<Locale, Record<string, string>>

export function IdentityEntry() {
  const { state, actions } = useOndo()
  const [sessionResetOpen, setSessionResetOpen] = useState(false)
  const t = COPY[state.locale]
  const hasAccount = state.account === "ACC-ACTIVE"
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
        <div><h2>{t.jitTitle}</h2><p>{state.account === "ACC-ACTIVE" ? t.jitBodyReady : t.jitBody}</p></div>
      </section>

      <section className={styles.routes}>
        <h2>{t.routes}</h2>
        <p className={styles.routePreview}>{t.routePreview}</p>
        <p>{t.routeTruth}</p>
      </section>

      <label className={styles.preferenceRow} data-testid="after19-auto-setting">
        <span><strong>{t.after19Setting}</strong><small>{t.after19SettingBody}</small></span>
        <input type="checkbox" checked={state.autoNight} onChange={(event) => {
          actions.setAutoNight(event.target.checked)
          if (!event.target.checked && state.after19 === "A19-ON") actions.setAfter19("A19-OFF")
        }} />
        <i aria-hidden="true"><b /></i>
      </label>

      <ProfilePanel />
      <TrustPanel />

      <section className={styles.sessionCard} aria-labelledby="session-controls-title">
        <span className={styles.sessionIcon}><LogOut size={19} /></span>
        <div><h2 id="session-controls-title">{t.sessionTitle}</h2><p>{t.sessionBody}</p></div>
        <button type="button" data-testid="session-reset-open" onClick={() => setSessionResetOpen(true)}>{hasAccount ? t.sessionOpen : t.sessionOpenGuest}</button>
      </section>

      <button type="button" className={styles.labsEntry} onClick={() => actions.setSurface({ kind: "labs" })} data-testid="open-labs-id">
        <span><FlaskConical size={19} /></span><div><strong>{t.labs}</strong><small>{t.labsBody}</small></div><ChevronRight size={18} />
      </button>
      {sessionResetOpen ? <ResetConfirmationSheet
        testId="session-reset-confirm"
        title={hasAccount ? t.sessionDialog : t.sessionDialogGuest}
        description={hasAccount ? t.sessionDescription : t.sessionDescriptionGuest}
        preserved={t.sessionPreserved}
        cancelLabel={t.sessionCancel}
        confirmLabel={hasAccount ? t.sessionConfirm : t.sessionConfirmGuest}
        onCancel={() => setSessionResetOpen(false)}
        onConfirm={() => {
          actions.resetSession()
          actions.notify(t.sessionReceipt)
        }}
      /> : null}
    </div>
  )
}
