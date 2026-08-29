"use client"

import { useEffect, useRef, useState } from "react"
import {
  CalendarClock,
  ChevronRight,
  CircleUserRound,
  Compass,
  FileKey2,
  MapPinned,
  Settings,
  ShieldCheck,
  UserRoundCheck,
  WalletCards,
} from "lucide-react"
import { useOndoB } from "../shared/state/ondo-b-provider"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import { LocalCheckWalkthroughB, type LocalCheckKind, type LocalCheckOutcome } from "./local-check-walkthrough-b"
import { IdWalletCommerceB } from "../commerce-b/id-wallet-commerce-b"
import {
  GLOBAL_AFTER19_SESSION_EVENT,
  GLOBAL_AFTER19_SESSION_KEY,
  isGlobalAfter19AgeCurrent,
  recordGlobalAfter19AgeEligibilityB,
  restoreGlobalAfter19B,
  type GlobalAfter19SessionB,
} from "../after19/after19-global-b-model"
import {
  B_ACTION_AXIS_SESSION_EVENT,
  DEFAULT_B_ACTION_GATE_SESSION,
  persistBActionGateSession,
  restoreBActionGateSession,
  updateBActionAxisSession,
  type BActionAxis,
  type BActionGateSession,
} from "./action-gate-contract-b"
import { ProfileReputationB } from "./profile-reputation-b"
import styles from "./traveler-id-entry-b.module.css"

const COPY = {
  en: {
    eyebrow: "YOUR KOREA, YOUR CONTROL",
    title: "Travel Pass",
    body: "Keep trip answers and payment tools private, ready only when you choose.",
    passLabel: "ONDO · KOREA TRAVEL PASS",
    passState: "Guest pass",
    passStateActive: "Account ready · this tab",
    passBody: "Explore first. Activate only when saving, joining or paying needs it.",
    passBoundary: "Local travel aid only · not an ID, credential or verification",
    readiness: "Trip readiness",
    readinessBody: "Each item stands on its own. Complete only the one an action asks for.",
    accountTitle: "Account",
    accountGuest: "Guest",
    accountActive: "Active · this tab",
    accountBody: "No account needed to explore Korea.",
    accountActiveBody: "Ready for saves in this tab. Person, 19+, and payment remain separate.",
    personTitle: "Person",
    personBody: "Person does not prove 19+.",
    ageTitle: "19+",
    ageBody: "19+ does not prove identity.",
    paymentTitle: "Payment",
    paymentBody: "Checked only when a payment action needs it. This is separate from the test wallet below.",
    credentialTitle: "K-Tour ID",
    credentialBody: "Optional private service credential · separate from Person and 19+.",
    credentialReady: "Simulated · this tab",
    credentialEmpty: "Not set up",
    credentialOpen: "Set up or present",
    notChecked: "Not checked",
    success: "Local result · this session",
    cancel: "Not completed",
    failure: "Try again",
    unavailable: "Unavailable",
    expired: "Expired",
    walletReady: "Test wallet ready",
    walletNotReady: "Set up",
    checkPerson: "Check Person",
    checkAge: "Check 19+",
    prototype: "Privacy & availability",
    prototypeBody: "Person, 19+ and payment readiness are independent session results kept only in this browser tab. No provider, credential or live money service is connected.",
    settings: "Device settings",
  },
  ko: {
    eyebrow: "나의 한국 여행, 나의 선택",
    title: "여행 패스",
    body: "여행 답변과 결제 도구는 이 기기에만 보관하고, 원할 때만 사용하세요.",
    passLabel: "ONDO · KOREA TRAVEL PASS",
    passState: "게스트 패스",
    passStateActive: "계정 준비됨 · 이 탭",
    passBody: "먼저 둘러보세요. 저장·참여·결제에 필요할 때만 활성화합니다.",
    passBoundary: "이 기기의 여행 도구 · 신분증·자격증명·공식 인증이 아님",
    readiness: "여행 준비 상태",
    readinessBody: "각 항목은 서로 독립적이에요. 작업이 요청하는 한 가지만 완료하세요.",
    accountTitle: "계정",
    accountGuest: "게스트",
    accountActive: "활성 · 이 탭",
    accountBody: "한국을 둘러보는 데 계정은 필요 없어요.",
    accountActiveBody: "이 탭에서 저장할 수 있어요. 본인·19+·결제 확인은 별개입니다.",
    personTitle: "본인",
    personBody: "본인 확인은 19+를 증명하지 않습니다.",
    ageTitle: "19+",
    ageBody: "19+는 본인을 증명하지 않습니다.",
    paymentTitle: "결제",
    paymentBody: "결제 작업에 필요할 때만 별도로 확인합니다. 아래 테스트 지갑과는 다른 상태예요.",
    credentialTitle: "K-Tour ID",
    credentialBody: "선택형 민간 서비스 자격증명 · 본인·19+와 별개입니다.",
    credentialReady: "시뮬레이션 · 이 탭",
    credentialEmpty: "설정 전",
    credentialOpen: "설정 또는 제시",
    notChecked: "확인 전",
    success: "이 세션의 로컬 결과",
    cancel: "완료 전",
    failure: "다시 시도",
    unavailable: "이용 불가",
    expired: "만료됨",
    walletReady: "테스트 지갑 준비됨",
    walletNotReady: "설정 필요",
    checkPerson: "본인 확인",
    checkAge: "19+ 확인",
    prototype: "개인정보와 이용 범위",
    prototypeBody: "본인·19+·결제 준비 상태는 서로 독립적인 세션 결과이며 이 브라우저 탭에만 남습니다. 공급자·자격증명·실제 결제 서비스는 연결되지 않습니다.",
    settings: "기기 설정",
  },
  ja: {
    eyebrow: "韓国の旅を、自分で管理",
    title: "トラベルパス",
    body: "旅の回答と決済ツールは端末内に保ち、必要な時だけ使えます。",
    passLabel: "ONDO · KOREA TRAVEL PASS",
    passState: "ゲストパス",
    passStateActive: "アカウント準備済み · このタブ",
    passBody: "まずは自由に探せます。保存・参加・支払いで必要になったときだけ準備します。",
    passBoundary: "この端末だけの旅の補助 · 身分証、資格情報、公的な確認ではありません",
    readiness: "旅の準備状況",
    readinessBody: "各項目は互いに独立しています。操作で求められた項目だけを完了してください。",
    accountTitle: "アカウント",
    accountGuest: "ゲスト",
    accountActive: "有効 · このタブ",
    accountBody: "韓国を探すだけなら、アカウントは不要です。",
    accountActiveBody: "このタブで保存できます。本人、19歳以上、決済の確認は別です。",
    personTitle: "本人",
    personBody: "本人確認だけでは、19歳以上であることを証明しません。",
    ageTitle: "19+",
    ageBody: "19歳以上という結果だけでは、本人であることを証明しません。",
    paymentTitle: "決済",
    paymentBody: "支払い操作で必要になったときだけ別に確認します。下のテストウォレットとは別の状態です。",
    credentialTitle: "K-Tour ID",
    credentialBody: "任意の民間サービス資格情報 · 本人・19歳以上とは別です。",
    credentialReady: "シミュレーション · このタブ",
    credentialEmpty: "未設定",
    credentialOpen: "設定または提示",
    notChecked: "未確認",
    success: "このセッションだけのローカル結果",
    cancel: "未完了",
    failure: "再試行が必要",
    unavailable: "利用不可",
    expired: "期限切れ",
    walletReady: "テストウォレット準備済み",
    walletNotReady: "設定が必要",
    checkPerson: "本人であることを確認",
    checkAge: "19歳以上を確認",
    prototype: "プライバシーと利用範囲",
    prototypeBody: "本人、19歳以上、決済準備は互いに独立したセッション結果で、このブラウザのタブだけに保持されます。本人確認サービス、資格情報、実際の決済サービスには接続しません。",
    settings: "このブラウザの設定",
  },
} as const

type IdentityLocale = OndoBLocale

function outcomeLabel(locale: IdentityLocale, outcome: LocalCheckOutcome | null) {
  const copy = COPY[locale]
  if (!outcome) return copy.notChecked
  return copy[outcome]
}

function axisOutcome(axis: BActionAxis): LocalCheckOutcome | null {
  if (axis.status === "eligible" && axis.expiresAt && Date.parse(axis.expiresAt) > Date.now()) return "success"
  if (axis.status === "failed") return "failure"
  if (axis.status === "unavailable") return "unavailable"
  if (axis.status === "expired" || (axis.status === "eligible" && axis.expiresAt)) return "expired"
  return null
}

function restoredAgeOutcome(session: GlobalAfter19SessionB | null): LocalCheckOutcome | null {
  if (!session) return null
  if (isGlobalAfter19AgeCurrent(session)) return "success"
  return session.expiryNotice ? "expired" : null
}

export function TravelerIdEntryB() {
  const { state, actions } = useOndoB()
  const [personOutcome, setPersonOutcome] = useState<LocalCheckOutcome | null>(null)
  const [ageOutcome, setAgeOutcome] = useState<LocalCheckOutcome | null>(null)
  const [actionSession, setActionSession] = useState<BActionGateSession>(DEFAULT_B_ACTION_GATE_SESSION)
  const [after19Session, setAfter19Session] = useState<GlobalAfter19SessionB | null>(null)
  const [activeCheck, setActiveCheck] = useState<LocalCheckKind | null>(null)
  const personRef = useRef<HTMLButtonElement>(null)
  const ageRef = useRef<HTMLButtonElement>(null)
  const locale = state.locale
  const copy = COPY[locale]
  const accountActive = state.account === "ACC-ACTIVE"
  const personStatus = personOutcome ?? axisOutcome(actionSession.person)
  const ageStatus = ageOutcome ?? restoredAgeOutcome(after19Session)
  const paymentStatus = axisOutcome(actionSession.payment)

  useEffect(() => {
    function syncActionSession() {
      const restored = restoreBActionGateSession(window.sessionStorage)
      persistBActionGateSession(window.sessionStorage, restored)
      setActionSession(restored)
    }
    function syncAfter19Session() {
      setAfter19Session(restoreGlobalAfter19B(window.localStorage, window.sessionStorage).session)
    }
    syncActionSession()
    syncAfter19Session()
    window.addEventListener(B_ACTION_AXIS_SESSION_EVENT, syncActionSession)
    window.addEventListener(GLOBAL_AFTER19_SESSION_EVENT, syncAfter19Session)
    return () => {
      window.removeEventListener(B_ACTION_AXIS_SESSION_EVENT, syncActionSession)
      window.removeEventListener(GLOBAL_AFTER19_SESSION_EVENT, syncAfter19Session)
    }
  }, [])

  function returnFromCheck(outcome: LocalCheckOutcome) {
    const returningCheck = activeCheck
    if (returningCheck === "person") {
      setPersonOutcome(outcome)
      if (outcome !== "cancel") {
        const status = outcome === "success" ? "eligible" : outcome === "failure" ? "failed" : outcome
        const next = updateBActionAxisSession(window.sessionStorage, "person", status)
        if (next) {
          setActionSession(next)
          window.dispatchEvent(new CustomEvent(B_ACTION_AXIS_SESSION_EVENT, { detail: next }))
        } else {
          setPersonOutcome("failure")
        }
      }
    }
    if (returningCheck === "age") {
      setAgeOutcome(outcome)
      if (outcome === "success") {
        const next = recordGlobalAfter19AgeEligibilityB()
        try {
          window.sessionStorage.setItem(GLOBAL_AFTER19_SESSION_KEY, JSON.stringify(next))
          setAfter19Session(next)
          window.dispatchEvent(new CustomEvent(GLOBAL_AFTER19_SESSION_EVENT, { detail: next }))
        } catch {
          setAgeOutcome("failure")
        }
      }
    }
    setActiveCheck(null)
    window.requestAnimationFrame(() => (returningCheck === "person" ? personRef.current : ageRef.current)?.focus({ preventScroll: true }))
  }

  return (
    <div className={styles.root}>
      <div className={styles.screen} data-testid="ondo-b-traveler-id" data-visual-direction="apple-wallet-flow8">
        <header className={styles.header}>
          <p>{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <span>{copy.body}</span>
        </header>

        <section className={styles.pass} aria-label={accountActive ? copy.passStateActive : copy.passState} data-testid="travel-pass-card" data-flow8-object="pass">
          <div className={styles.passGlow} aria-hidden="true" />
          <div className={styles.passTop}><span>{copy.passLabel}</span><MapPinned size={27} strokeWidth={1.55} aria-hidden="true" /></div>
          <div className={styles.passMain}>
            <div><small>{accountActive ? copy.passStateActive : copy.passState}</small><strong>SEOUL — BUSAN — JEJU</strong></div>
            <Compass size={23} aria-hidden="true" />
          </div>
          <p>{copy.passBody}</p>
          <small className={styles.passBoundary} data-testid="travel-pass-local-boundary">{copy.passBoundary}</small>
        </section>

        <div className={styles.walletPane}>
          <IdWalletCommerceB />
        </div>

        <section className={styles.readiness} data-testid="travel-pass-status" aria-labelledby="travel-readiness-title">
          <div className={styles.sectionHeading}>
            <div><h2 id="travel-readiness-title">{copy.readiness}</h2><p>{copy.readinessBody}</p></div>
            <ShieldCheck size={21} aria-hidden="true" />
          </div>

          <div className={styles.statusGrid}>
            <article className={styles.statusCard} data-testid="traveler-id-account" data-status={accountActive ? "active" : "guest"}>
              <div className={styles.statusTop}><CircleUserRound size={20} aria-hidden="true" /><span>{accountActive ? copy.accountActive : copy.accountGuest}</span></div>
              <h3>{copy.accountTitle}</h3>
              <p>{accountActive ? copy.accountActiveBody : copy.accountBody}</p>
            </article>

            <article className={styles.statusCard} data-testid="traveler-id-person" data-status={personStatus ?? "none"}>
              <div className={styles.statusTop}><UserRoundCheck size={20} aria-hidden="true" /><span>{outcomeLabel(locale, personStatus)}</span></div>
              <h3>{copy.personTitle}</h3>
              <p>{copy.personBody}</p>
              <button ref={personRef} type="button" onClick={() => setActiveCheck("person")}>{copy.checkPerson}<ChevronRight size={17} aria-hidden="true" /></button>
            </article>

            <article className={styles.statusCard} data-testid="traveler-id-age" data-status={ageStatus ?? "none"}>
              <div className={styles.statusTop}><CalendarClock size={20} aria-hidden="true" /><span>{outcomeLabel(locale, ageStatus)}</span></div>
              <h3>{copy.ageTitle}</h3>
              <p>{copy.ageBody}</p>
              <button ref={ageRef} type="button" onClick={() => setActiveCheck("age")}>{copy.checkAge}<ChevronRight size={17} aria-hidden="true" /></button>
            </article>

            <article className={styles.statusCard} data-testid="traveler-id-credential" data-status={state.identityCredential?.status ?? "none"}>
              <div className={styles.statusTop}><FileKey2 size={20} aria-hidden="true" /><span>{state.identityCredential ? copy.credentialReady : copy.credentialEmpty}</span></div>
              <h3>{copy.credentialTitle}</h3>
              <p>{copy.credentialBody}</p>
              <button type="button" data-testid="traveler-id-ktour-id-open" onClick={() => actions.openIdentitySetup("traveler_id")}>{copy.credentialOpen}<ChevronRight size={17} aria-hidden="true" /></button>
            </article>

            <article className={styles.statusCard} data-testid="traveler-id-payment" data-status={paymentStatus ?? "none"}>
              <div className={styles.statusTop}><WalletCards size={20} aria-hidden="true" /><span>{outcomeLabel(locale, paymentStatus)}</span></div>
              <h3>{copy.paymentTitle}</h3>
              <p>{copy.paymentBody}</p>
            </article>
          </div>
        </section>

        <div className={styles.profilePane}>
          <ProfileReputationB locale={locale} accountActive={accountActive} personVerified={personStatus === "success"} />
        </div>

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
