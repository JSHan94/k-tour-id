"use client"

import type { KeyboardEvent } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AlertTriangle, BadgeCheck, BookOpenCheck, ChevronRight, CircleUserRound, CreditCard, IdCard, RotateCcw, ShieldCheck, Smartphone, UserRoundCheck, X } from "lucide-react"
import {
  GLOBAL_AFTER19_SESSION_EVENT,
  GLOBAL_AFTER19_SESSION_KEY,
  isGlobalAfter19AgeCurrent,
  recordGlobalAfter19AgeEligibilityB,
  restoreGlobalAfter19B,
  type GlobalAfter19SessionB,
} from "../after19/after19-global-b-model"
import { ONDO_OPEN_TABLE_EVENT } from "../connect/tables-entry-b"
import { useOndoB } from "../shared/state/ondo-b-provider"
import { useModalIsolation } from "../shared/ui/use-modal-isolation"
import { readQaRuntime } from "../shared/ui/use-qa-controls"
import {
  B_ACTION_GATE_CANCEL_EVENT,
  B_ACTION_AXIS_SESSION_EVENT,
  B_ACTION_AXIS_TTL_MS,
  B_ACTION_GATE_COMPLETE_EVENT,
  B_ACTION_GATE_READY_EVENT,
  B_ACTION_GATE_REQUEST_EVENT,
  DEFAULT_B_ACTION_GATE_SESSION,
  isBActionReturnPending,
  persistBActionGateSession,
  renewBActionReturnTo,
  restoreBActionGateSession,
  type BActionAxis,
  type BActionGateKind,
  type BActionGateOutcome,
  type BActionGateSession,
  type BPersonRouteB,
  type BActionReturnTo,
} from "./action-gate-contract-b"
import styles from "./action-gate-coordinator-b.module.css"

const FOCUSABLE = "button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex='-1'])"

type GateView = "intro" | "failure" | "unavailable" | "expired"
type GateQaOutcome = Exclude<GateView, "intro">
type QaRuntime = {
  actionGate?: Partial<Record<BActionGateKind, GateQaOutcome>>
  eligibility?: "success" | "cancel" | "failure" | "unavailable" | "expired"
  after19?: GateQaOutcome
  paymentKyc?: GateQaOutcome
}
type TableIntentWindow = Window & {
  __ONDO_B_TABLE_INTENT__?: { tableId: string; venueId: string; mode: string; draft?: string }
}

const COPY = {
  en: {
    header: "Minimum check · this tab only",
    accountTitle: "Create a local account",
    accountBody: "Account comes first. It does not complete Person, 19+, identity, or Payment checks.",
    personTitle: "Confirm Person for this action",
    personBody: "Choose the route you want to use. Success records only this tab’s Person answer and returns to the exact Local Signal draft. No route is inferred from your travel intent. No identity provider is connected and no credential is created.",
    ageTitle: "Confirm 19+ for this Table",
    ageBody: "Only an eligibility result and expiry are kept in this tab. No birth date or official venue restriction is claimed.",
    paymentTitle: "Prepare Payment eligibility",
    paymentBody: "Payment eligibility is independent from Account, Person, and 19+. No payment or KYC provider is connected.",
    accountAction: "Create local account and continue",
    personAction: "Confirm Person and continue",
    mobileAction: "Continue with Mobile ID",
    residenceAction: "Check Residence Card availability",
    passportAction: "Continue with Passport eKYC",
    routeChoiceLegend: "Choose a Person route",
    routeChoiceMobile: "Mobile ID / CX",
    routeChoiceResidence: "Residence Card · registered residents",
    routeChoicePassport: "Passport eKYC",
    providerDetails: "Provider and data details",
    routeLabel: "Person route",
    mobileTitle: "Mobile ID · OmniOne CX",
    mobileNote: "On-device handoff using OmniOne CX semantics. No request is sent and no Mobile ID or K-Tour credential is created.",
    residenceTitle: "Mobile Residence Card",
    residenceNote: "Route for registered foreign residents. No configured or verified provider profile is connected.",
    passportTitle: "Passport eKYC",
    passportNote: "Separate provider-neutral route — not OmniOne CX and not equivalent to a Residence Card check.",
    residenceUnavailableTitle: "Mobile Residence Card is not connected yet",
    residenceUnavailableBody: "The resident route has no configured provider profile. Your exact Local Signal draft is unchanged; use the separate Passport eKYC route or return.",
    usePassport: "Use Passport eKYC instead",
    ageAction: "Confirm 19+ and continue",
    paymentAction: "Prepare Payment check and continue",
    returnLabel: "Return to",
    table: "Table and host note",
    signal: "Local Signal draft",
    checkout: "Meal offer checkout",
    truth: "ON-DEVICE CHECK · no external provider, credential, document, or raw identity data",
    cancel: "Not now — return without changing the action",
    failureTitle: "This check did not complete",
    failureBody: "The exact action context is unchanged. Nothing was submitted, joined, or paid.",
    unavailableTitle: "This check is unavailable",
    unavailableBody: "Keep the pending action and retry later, or return without changing it.",
    expiredTitle: "The check or return path expired",
    expiredBody: "Refresh the same return path to continue without losing its registered context.",
    retry: "Try again",
    renew: "Refresh return path",
    consentRequester: "Requested by",
    consentRequesterValue: "ONDO Travel Pass",
    consentPurpose: "Used for",
    consentPurposeValue: "Post your Local Signal and return to the note you were writing.",
    consentMinimum: "Answer shared",
    consentMinimumValue: "Person — separate from age or legal identity",
    consentRetention: "Kept for",
    consentRetentionValue: "No name, document, birth date, profile, or credential is saved.",
    planLabel: "Required checks",
    planAccount: "Account",
    planPerson: "Person",
    planAge: "19+",
    planPayment: "Payment",
  },
  ko: {
    header: "최소 확인 · 이 탭에서만",
    accountTitle: "로컬 계정 만들기",
    accountBody: "계정을 먼저 준비합니다. 본인·19+·신원·결제 확인은 완료되지 않습니다.",
    personTitle: "이 작업의 본인 여부 확인",
    personBody: "사용할 경로를 직접 선택하세요. 성공 시 이 탭의 본인 여부만 기록하고 정확한 로컬 시그널 초안으로 돌아갑니다. 여행 목적에서 경로를 추론하지 않습니다.",
    ageTitle: "이 테이블의 19+ 확인",
    ageBody: "충족 결과와 만료 시각만 이 탭에 남습니다. 생년월일이나 장소의 공식 제한을 주장하지 않습니다.",
    paymentTitle: "결제 자격 준비",
    paymentBody: "결제 자격은 계정·본인·19+와 별개입니다. 연결된 결제 또는 KYC 공급자는 없습니다.",
    accountAction: "로컬 계정 만들고 계속",
    personAction: "본인 확인하고 계속",
    mobileAction: "모바일 신분증으로 계속",
    residenceAction: "모바일 외국인등록증 연결 확인",
    passportAction: "여권 eKYC로 계속",
    routeChoiceLegend: "본인 확인 경로 선택",
    routeChoiceMobile: "모바일 신분증 / CX",
    routeChoiceResidence: "외국인등록증 · 등록 거주자",
    routeChoicePassport: "여권 eKYC",
    providerDetails: "공급자 및 데이터 세부정보",
    routeLabel: "본인 확인 경로",
    mobileTitle: "모바일 신분증 · OmniOne CX",
    mobileNote: "OmniOne CX 의미 체계를 따라 기기 안에서 진행합니다. 실제 요청을 보내거나 모바일 신분증·K-Tour 자격증명을 만들지 않습니다.",
    residenceTitle: "모바일 외국인등록증",
    residenceNote: "등록외국인용 경로입니다. 구성·검증된 제공자 프로필은 연결되지 않았습니다.",
    passportTitle: "여권 eKYC",
    passportNote: "OmniOne CX가 아닌 별도의 공급자 중립 경로이며, 외국인등록증 확인과 동등하지 않습니다.",
    residenceUnavailableTitle: "모바일 외국인등록증 경로는 아직 연결 전이에요",
    residenceUnavailableBody: "거주자 경로에 구성된 제공자 프로필이 없습니다. 정확한 로컬 시그널 초안은 그대로이며, 별도 여권 eKYC 경로를 사용하거나 돌아갈 수 있어요.",
    usePassport: "여권 eKYC로 대신 진행",
    ageAction: "19+ 확인하고 계속",
    paymentAction: "결제 확인 준비하고 계속",
    returnLabel: "돌아갈 곳",
    table: "테이블과 호스트 메모",
    signal: "로컬 시그널 초안",
    checkout: "식사 혜택 결제",
    truth: "기기 내 확인 · 외부 공급자·자격증명·문서·원본 신원 정보 없음",
    cancel: "나중에 — 작업을 바꾸지 않고 돌아가기",
    failureTitle: "확인을 완료하지 못했어요",
    failureBody: "정확한 작업 맥락은 그대로입니다. 게시·참여·결제된 내용은 없습니다.",
    unavailableTitle: "지금은 확인할 수 없어요",
    unavailableBody: "진행 중인 작업을 유지해 나중에 다시 시도하거나, 바꾸지 않고 돌아갈 수 있습니다.",
    expiredTitle: "확인 또는 복귀 경로가 만료됐어요",
    expiredBody: "등록된 맥락을 잃지 않고 같은 복귀 경로를 새로 만들어 계속하세요.",
    retry: "다시 시도",
    renew: "복귀 경로 새로 만들기",
    consentRequester: "요청자",
    consentRequesterValue: "ONDO 여행 패스",
    consentPurpose: "사용 목적",
    consentPurposeValue: "로컬 시그널을 게시하고 작성 중이던 메모로 정확히 돌아갑니다.",
    consentMinimum: "공유되는 답변",
    consentMinimumValue: "본인 여부만 · 나이 또는 법적 신원과 별개",
    consentRetention: "저장 범위",
    consentRetentionValue: "이름·문서·생년월일·프로필·자격증명을 저장하지 않습니다.",
    planLabel: "필요한 확인",
    planAccount: "계정",
    planPerson: "본인",
    planAge: "19+",
    planPayment: "결제",
  },
  ja: {
    header: "必要最小限の確認 · このタブのみ",
    accountTitle: "ローカルアカウントを作成",
    accountBody: "最初にアカウントを準備します。本人、19歳以上、身元、決済の確認は完了しません。",
    personTitle: "この操作の本人確認",
    personBody: "使用する経路を明示的に選んでください。成功時はこのタブの本人回答だけを記録し、元のLocal Signal下書きに戻ります。旅行目的から経路を推測しません。",
    ageTitle: "このテーブルの19歳以上確認",
    ageBody: "適格結果と有効期限だけをこのタブに保持します。生年月日や店舗の公式制限は示しません。",
    paymentTitle: "決済利用条件を準備",
    paymentBody: "決済利用条件はアカウント、本人、19歳以上とは独立しています。決済・KYCサービスには接続しません。",
    accountAction: "ローカルアカウントを作成して続ける",
    personAction: "本人確認をして続ける",
    mobileAction: "モバイルIDで続ける",
    residenceAction: "モバイル在留カードの接続を確認",
    passportAction: "パスポートeKYCで続ける",
    routeChoiceLegend: "本人確認経路を選択",
    routeChoiceMobile: "モバイルID / CX",
    routeChoiceResidence: "在留カード · 登録済み居住者",
    routeChoicePassport: "パスポートeKYC",
    providerDetails: "事業者とデータの詳細",
    routeLabel: "本人確認経路",
    mobileTitle: "モバイルID · OmniOne CX",
    mobileNote: "OmniOne CXの意味体系に沿って端末内で進めます。実際の要求やモバイルID、K-Tour資格情報は作成しません。",
    residenceTitle: "モバイル在留カード",
    residenceNote: "外国人登録済み居住者向けの経路です。設定・検証済みの事業者プロファイルは接続されていません。",
    passportTitle: "パスポートeKYC",
    passportNote: "OmniOne CXとは別の事業者中立経路で、在留カード確認と同等ではありません。",
    residenceUnavailableTitle: "モバイル在留カード経路はまだ接続されていません",
    residenceUnavailableBody: "居住者向け経路に事業者設定がありません。元のLocal Signal下書きは変わりません。別のパスポートeKYC経路を使うか、そのまま戻れます。",
    usePassport: "パスポートeKYCを代わりに使う",
    ageAction: "19歳以上を確認して続ける",
    paymentAction: "決済確認を準備して続ける",
    returnLabel: "戻る場所",
    table: "テーブルとホストへのメモ",
    signal: "Local Signalの下書き",
    checkout: "食事特典のお支払い",
    truth: "端末内確認 · 外部サービス、資格情報、書類、元の本人情報は使用しません",
    cancel: "今回はしない — 操作を変えずに戻る",
    failureTitle: "確認を完了できませんでした",
    failureBody: "操作の正確なコンテキストは変わりません。投稿、参加、決済は行われていません。",
    unavailableTitle: "現在この確認を利用できません",
    unavailableBody: "保留中の操作を維持して後で再試行するか、変更せずに戻れます。",
    expiredTitle: "確認または戻り先の有効期限が切れました",
    expiredBody: "登録済みのコンテキストを失わず、同じ戻り先を更新して続けてください。",
    retry: "もう一度試す",
    renew: "戻り先を更新",
    consentRequester: "リクエスト元",
    consentRequesterValue: "ONDOトラベルパス",
    consentPurpose: "使用目的",
    consentPurposeValue: "Local Signalを投稿し、編集中のメモへ正確に戻ります。",
    consentMinimum: "共有する回答",
    consentMinimumValue: "本人かどうかのみ · 年齢や法的身元とは別です",
    consentRetention: "保存範囲",
    consentRetentionValue: "氏名、書類、生年月日、プロフィール、資格情報は保存しません。",
    planLabel: "必要な確認",
    planAccount: "アカウント",
    planPerson: "本人",
    planAge: "19+",
    planPayment: "決済",
  },
} as const

function personRouteForIdentityMethod(method: "mobile_id" | "mobile_residence_card" | "passport_ekyc" | null): BPersonRouteB | null {
  if (method === "mobile_id") return "mobile_id_cx"
  return method
}

function writeGlobalAge(session: GlobalAfter19SessionB) {
  try {
    window.sessionStorage.setItem(GLOBAL_AFTER19_SESSION_KEY, JSON.stringify(session))
    window.dispatchEvent(new CustomEvent(GLOBAL_AFTER19_SESSION_EVENT, { detail: session }))
    return true
  } catch {
    return false
  }
}

function axisReady(axis: BActionAxis, now: Date) {
  return axis.status === "eligible" && axis.expiresAt !== null && Date.parse(axis.expiresAt) > now.getTime()
}

function readyAxis(now = new Date()): BActionAxis {
  return { status: "eligible", expiresAt: new Date(now.getTime() + B_ACTION_AXIS_TTL_MS).toISOString() }
}

function returnLabel(returnTo: BActionReturnTo, copy: (typeof COPY)[keyof typeof COPY]) {
  if (returnTo.cta === "JOIN_TABLE") return copy.table
  if (returnTo.cta === "SUBMIT_LOCAL_SIGNAL") return copy.signal
  return copy.checkout
}

export function BActionGateCoordinator() {
  const { state, actions } = useOndoB()
  const [session, setSession] = useState<BActionGateSession>(DEFAULT_B_ACTION_GATE_SESSION)
  const [ageSession, setAgeSession] = useState<GlobalAfter19SessionB | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [clock, setClock] = useState(() => new Date())
  const [view, setView] = useState<GateView>("intro")
  const [readyTokenId, setReadyTokenId] = useState<string | null>(null)
  const layerRef = useRef<HTMLDivElement | null>(null)
  const dialogRef = useRef<HTMLElement | null>(null)
  const pending = session.pending
  const copy = COPY[state.locale]
  const personRoute = pending && session.personRoute?.tokenId === pending.tokenId ? session.personRoute.route : null

  const restoreContext = useCallback((returnTo: BActionReturnTo) => {
    if (returnTo.cta === "JOIN_TABLE") {
      actions.setTab("tables")
      ;(window as TableIntentWindow).__ONDO_B_TABLE_INTENT__ = { tableId: returnTo.tableId, venueId: returnTo.venueId, mode: "view", draft: returnTo.draft }
      window.setTimeout(() => window.dispatchEvent(new CustomEvent(ONDO_OPEN_TABLE_EVENT, { detail: { tableId: returnTo.tableId, venueId: returnTo.venueId, mode: "view", draft: returnTo.draft } })), 0)
      return
    }
    if (returnTo.cta === "SUBMIT_LOCAL_SIGNAL") {
      actions.setTab("ondo")
      actions.setSurface({ kind: "venue", venueId: returnTo.venueId })
      actions.openLocalSignal(returnTo.venueId)
      actions.updateLocalSignalDraft({ tags: returnTo.tags, note: returnTo.note })
      return
    }
    actions.openMealBenefitFromPlace(returnTo.venueId)
  }, [actions])

  useEffect(() => {
    if (!state.hydrated || hydrated) return
    const restored = restoreBActionGateSession(window.sessionStorage)
    const restoredAge = restoreGlobalAfter19B(window.localStorage, window.sessionStorage).session
    persistBActionGateSession(window.sessionStorage, restored)
    setSession(restored)
    setAgeSession(restoredAge)
    setView(restored.outcome?.status ?? (restored.pending && !isBActionReturnPending(restored.pending) ? "expired" : "intro"))
    setHydrated(true)
    if (restored.pending) restoreContext(restored.pending)
  }, [hydrated, restoreContext, state.hydrated])

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 15_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    function requested(event: Event) {
      const detail = event instanceof CustomEvent ? event.detail : null
      const restored = restoreBActionGateSession(window.sessionStorage)
      if (!detail || restored.pending?.tokenId !== detail.tokenId) return
      setSession(restored)
      setReadyTokenId(null)
      setView("intro")
    }
    function syncAge() { setAgeSession(restoreGlobalAfter19B(window.localStorage, window.sessionStorage).session) }
    function syncActionAxes() { setSession(restoreBActionGateSession(window.sessionStorage)) }
    function completed() {
      setSession(restoreBActionGateSession(window.sessionStorage))
      setReadyTokenId(null)
    }
    window.addEventListener(B_ACTION_GATE_REQUEST_EVENT, requested)
    window.addEventListener(GLOBAL_AFTER19_SESSION_EVENT, syncAge)
    window.addEventListener(B_ACTION_AXIS_SESSION_EVENT, syncActionAxes)
    window.addEventListener(B_ACTION_GATE_COMPLETE_EVENT, completed)
    return () => {
      window.removeEventListener(B_ACTION_GATE_REQUEST_EVENT, requested)
      window.removeEventListener(GLOBAL_AFTER19_SESSION_EVENT, syncAge)
      window.removeEventListener(B_ACTION_AXIS_SESSION_EVENT, syncActionAxes)
      window.removeEventListener(B_ACTION_GATE_COMPLETE_EVENT, completed)
    }
  }, [])

  const satisfied = useMemo(() => {
    const result = new Set<BActionGateKind>()
    if (state.account === "ACC-ACTIVE") result.add("account")
    if (axisReady(session.person, clock)) result.add("person")
    if (ageSession && isGlobalAfter19AgeCurrent(ageSession, clock)) result.add("age")
    if (axisReady(session.payment, clock)) result.add("payment_kyc")
    return result
  }, [ageSession, clock, session.payment, session.person, state.account])

  const activeGate = pending?.gatePlan.find((gate) => !satisfied.has(gate)) ?? null
  const expiredReturn = pending ? !isBActionReturnPending(pending, clock) : false
  useModalIsolation(Boolean(pending && readyTokenId !== pending.tokenId && (activeGate || expiredReturn)), layerRef)

  useEffect(() => {
    if (!pending || !activeGate) return
    const frame = window.requestAnimationFrame(() => {
      const layer = layerRef.current
      // Let a higher-priority portal isolate a newly mounted lower gate before
      // it can claim focus. Immediate Escape is owned independently below.
      if (!layer || layer.closest("[inert],[aria-hidden='true']")) return
      dialogRef.current?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [activeGate, pending?.tokenId, view])

  useEffect(() => {
    if (!pending || readyTokenId === pending.tokenId || (!activeGate && !expiredReturn)) return
    const ownEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return
      const layer = layerRef.current
      // A higher-priority portal can temporarily isolate this gate. In that
      // case Escape belongs to the exposed modal, not this inert descendant.
      if (!layer || layer.closest("[inert],[aria-hidden='true']")) return
      event.preventDefault()
      event.stopImmediatePropagation()
      cancel()
    }
    document.addEventListener("keydown", ownEscape, true)
    return () => document.removeEventListener("keydown", ownEscape, true)
  }, [activeGate, expiredReturn, pending?.tokenId, readyTokenId])

  useEffect(() => {
    if (!pending || session.personRoute || !pending.gatePlan.includes("person")) return
    const route = personRouteForIdentityMethod(state.identityCredential?.method ?? null)
    if (!route) return
    const next: BActionGateSession = { ...session, personRoute: { tokenId: pending.tokenId, route } }
    if (persistBActionGateSession(window.sessionStorage, next)) setSession(next)
  }, [pending, session, state.identityCredential?.method])

  useEffect(() => {
    if (!pending || !isBActionReturnPending(pending, clock) || activeGate) return
    releaseReady(pending)
  // releaseReady is deliberately reached only after a state/axis transition makes the full plan true.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGate, clock, pending, satisfied])

  function commit(next: BActionGateSession) {
    if (!persistBActionGateSession(window.sessionStorage, next)) return false
    setSession(next)
    window.dispatchEvent(new CustomEvent(B_ACTION_AXIS_SESSION_EVENT, { detail: next }))
    return true
  }

  function gateOutcome(gate: BActionGateKind): GateQaOutcome | null {
    const qa = readQaRuntime<QaRuntime>()
    const explicit = qa?.actionGate?.[gate]
    if (explicit) { delete qa?.actionGate?.[gate]; return explicit }
    if (gate === "age" && qa?.after19) { const outcome = qa.after19; delete qa.after19; return outcome }
    if ((gate === "person" || gate === "age") && qa?.eligibility && qa.eligibility !== "success" && qa.eligibility !== "cancel") {
      const outcome = qa.eligibility
      delete qa.eligibility
      return outcome
    }
    if (gate === "payment_kyc" && qa?.paymentKyc) { const outcome = qa.paymentKyc; delete qa.paymentKyc; return outcome }
    return null
  }

  function fail(gate: BActionGateKind, status: GateQaOutcome) {
    if (!pending) return
    const outcome: BActionGateOutcome = { tokenId: pending.tokenId, gate, status }
    const axisStatus: BActionAxis["status"] = status === "failure" ? "failed" : status
    const next: BActionGateSession = {
      ...session,
      person: gate === "person" ? { status: axisStatus, expiresAt: null } : session.person,
      payment: gate === "payment_kyc" ? { status: axisStatus, expiresAt: null } : session.payment,
      outcome,
    }
    commit(next)
    setView(status)
  }

  function confirm() {
    if (!pending || !activeGate || !isBActionReturnPending(pending, clock)) { setView("expired"); return }
    if (activeGate === "person" && !personRoute) return
    if (activeGate === "person" && personRoute === "mobile_residence_card") {
      fail(activeGate, gateOutcome(activeGate) ?? "unavailable")
      return
    }
    const injected = gateOutcome(activeGate)
    if (injected) { fail(activeGate, injected); return }

    if (activeGate === "account") {
      if (!actions.activateAccount()) { fail(activeGate, "failure"); return }
      commit({ ...session, outcome: null })
      setView("intro")
      return
    }
    if (activeGate === "person") {
      if (!commit({ ...session, person: readyAxis(clock), outcome: null })) { fail(activeGate, "failure"); return }
      setView("intro")
      return
    }
    if (activeGate === "age") {
      const eligible = recordGlobalAfter19AgeEligibilityB(clock)
      const nextAge = ageSession?.mode === "manual-off" ? { ...eligible, mode: "manual-off" as const } : eligible
      if (!writeGlobalAge(nextAge)) { fail(activeGate, "failure"); return }
      setAgeSession(nextAge)
      commit({ ...session, outcome: null })
      setView("intro")
      return
    }
    if (!commit({ ...session, payment: readyAxis(clock), outcome: null })) { fail(activeGate, "failure"); return }
    setView("intro")
  }

  function usePassportAlternative() {
    if (!pending || activeGate !== "person" || personRoute !== "mobile_residence_card") return
    const next: BActionGateSession = {
      ...session,
      person: { status: "unverified", expiresAt: null },
      personRoute: { tokenId: pending.tokenId, route: "passport_ekyc" },
      outcome: null,
    }
    if (!commit(next)) { setView("failure"); return }
    setView("intro")
  }

  function selectPersonRoute(route: BPersonRouteB) {
    if (!pending || activeGate !== "person" || !isBActionReturnPending(pending, clock)) return
    const next: BActionGateSession = {
      ...session,
      person: { status: "unverified", expiresAt: null },
      personRoute: { tokenId: pending.tokenId, route },
      outcome: null,
    }
    if (!commit(next)) { setView("failure"); return }
    setView("intro")
  }

  function releaseReady(returnTo: BActionReturnTo) {
    if (readyTokenId === returnTo.tokenId) return
    const latest = restoreBActionGateSession(window.sessionStorage, clock)
    if (latest.pending?.tokenId !== returnTo.tokenId) return
    setReadyTokenId(returnTo.tokenId)
    restoreContext(returnTo)
    window.setTimeout(() => window.dispatchEvent(new CustomEvent(B_ACTION_GATE_READY_EVENT, { detail: returnTo })), 0)
  }

  function cancel() {
    if (!pending) return
    const latest = restoreBActionGateSession(window.sessionStorage, clock)
    if (latest.pending?.tokenId !== pending.tokenId) return
    const returning = latest.pending
    const cleared: BActionGateSession = { ...latest, pending: null, personRoute: null, outcome: null }
    if (!persistBActionGateSession(window.sessionStorage, cleared)) { setView("failure"); return }
    setSession(cleared)
    setReadyTokenId(null)
    restoreContext(returning)
    const gateOutcome = latest.outcome?.tokenId === returning.tokenId ? latest.outcome.status : "cancel"
    window.setTimeout(() => window.dispatchEvent(new CustomEvent(B_ACTION_GATE_CANCEL_EVENT, { detail: { ...returning, gateOutcome } })), 0)
  }

  function retry() {
    if (!pending) return
    if (!isBActionReturnPending(pending, clock)) {
      const renewed = renewBActionReturnTo(pending, clock)
      const renewedRoute = personRoute ? { tokenId: renewed.tokenId, route: personRoute } : null
      commit({ ...session, pending: renewed, personRoute: renewedRoute, outcome: null })
      restoreContext(renewed)
    } else {
      commit({ ...session, outcome: null })
    }
    setView("intro")
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); cancel(); return }
    if (event.key !== "Tab") return
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter((node) => node.offsetParent !== null)
    const first = focusable[0]
    const last = focusable.at(-1)
    if (!first || !last) return
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus({ preventScroll: true }) }
    else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) { event.preventDefault(); first.focus({ preventScroll: true }) }
  }

  if (!hydrated || !pending || readyTokenId === pending.tokenId) return null
  // A fully satisfied live plan releases on the effect above. Keep that
  // handoff visually silent instead of flashing the last gate for one frame.
  if (!expiredReturn && !activeGate) return null
  const resolvedView: GateView = expiredReturn ? "expired" : view
  const gate = activeGate ?? pending.gatePlan.at(-1) ?? "account"
  const residenceUnavailable = gate === "person" && personRoute === "mobile_residence_card" && resolvedView === "unavailable"
  const title = resolvedView === "failure" ? copy.failureTitle
    : residenceUnavailable ? copy.residenceUnavailableTitle
      : resolvedView === "unavailable" ? copy.unavailableTitle
      : resolvedView === "expired" ? copy.expiredTitle
        : gate === "account" ? copy.accountTitle : gate === "person" ? copy.personTitle : gate === "age" ? copy.ageTitle : copy.paymentTitle
  const body = resolvedView === "failure" ? copy.failureBody
    : residenceUnavailable ? copy.residenceUnavailableBody
      : resolvedView === "unavailable" ? copy.unavailableBody
      : resolvedView === "expired" ? copy.expiredBody
        : gate === "account" ? copy.accountBody : gate === "person" ? copy.personBody : gate === "age" ? copy.ageBody : copy.paymentBody
  const action = gate === "account" ? copy.accountAction
    : gate === "person" ? personRoute === "mobile_id_cx" ? copy.mobileAction : personRoute === "mobile_residence_card" ? copy.residenceAction : personRoute === "passport_ekyc" ? copy.passportAction : copy.personAction
      : gate === "age" ? copy.ageAction : copy.paymentAction
  const GateIcon = gate === "account" ? CircleUserRound : gate === "person" ? UserRoundCheck : gate === "age" ? BadgeCheck : CreditCard
  const PersonRouteIcon = personRoute === "mobile_id_cx" ? Smartphone : personRoute === "mobile_residence_card" ? IdCard : personRoute === "passport_ekyc" ? BookOpenCheck : null
  const personRouteTitle = personRoute === "mobile_id_cx" ? copy.mobileTitle : personRoute === "mobile_residence_card" ? copy.residenceTitle : personRoute === "passport_ekyc" ? copy.passportTitle : null
  const personRouteNote = personRoute === "mobile_id_cx" ? copy.mobileNote : personRoute === "mobile_residence_card" ? copy.residenceNote : personRoute === "passport_ekyc" ? copy.passportNote : null
  const routeChoices = [
    { route: "mobile_id_cx", label: copy.routeChoiceMobile, Icon: Smartphone },
    { route: "mobile_residence_card", label: copy.routeChoiceResidence, Icon: IdCard },
    { route: "passport_ekyc", label: copy.routeChoicePassport, Icon: BookOpenCheck },
  ] as const

  return (
    <div ref={layerRef} className={styles.layer} data-testid="ondo-b-action-gate" data-modal-layer-priority="100" data-active-gate={gate} data-person-route={gate === "person" ? personRoute ?? "unselected" : undefined} data-gate-view={resolvedView} data-return-cta={pending.cta}>
      <div className={styles.backdrop} aria-hidden="true" />
      <section ref={dialogRef} className={styles.dialog} role="dialog" tabIndex={-1} aria-modal="true" aria-labelledby="b-action-gate-title" data-testid={gate === "person" ? "ondo-b-local-check-walkthrough" : gate === "age" ? "after19-walkthrough" : undefined} data-check-kind={gate} data-check-origin={pending.cta === "SUBMIT_LOCAL_SIGNAL" ? "local_signal" : pending.cta === "JOIN_TABLE" ? "table" : "checkout"} data-visual-direction={gate === "age" && pending.cta === "JOIN_TABLE" ? "timeleft-checkpoint" : undefined} onKeyDown={handleKeyDown}>
        <header><span><ShieldCheck size={18} aria-hidden="true" />{copy.header}</span><button type="button" aria-label={copy.cancel} onClick={cancel}><X size={18} aria-hidden="true" /></button></header>
        <div className={styles.body}>
          <div className={styles.content}>
            <div className={resolvedView === "intro" ? styles.hero : styles.heroError}>{resolvedView === "intro" ? <GateIcon size={31} aria-hidden="true" /> : <AlertTriangle size={31} aria-hidden="true" />}</div>
            <h2 id="b-action-gate-title">{title}</h2>
            <p className={styles.lead}>{body}</p>
            {gate === "person" && resolvedView === "intro" ? <fieldset className={styles.routeChoices} data-testid="person-route-choices">
              <legend>{copy.routeChoiceLegend}</legend>
              <div>{routeChoices.map(({ route, label, Icon }) => <button key={route} type="button" aria-pressed={personRoute === route} data-selected={personRoute === route ? "true" : "false"} data-testid={`person-route-choice-${route}`} onClick={() => selectPersonRoute(route)}><Icon size={18} aria-hidden="true" /><span>{label}</span></button>)}</div>
            </fieldset> : null}
            {gate === "person" && personRoute && PersonRouteIcon ? <section className={styles.personRoute} data-testid={`person-route-${personRoute}`} data-route-status={residenceUnavailable ? "unavailable" : resolvedView === "failure" ? "failed" : "ready"}>
              <span className={styles.personRouteIcon}><PersonRouteIcon size={21} aria-hidden="true" /></span>
              <span><small>{copy.routeLabel}</small><strong>{personRouteTitle}</strong></span>
            </section> : null}
            {gate === "person" ? <details className={styles.disclosure} data-testid="person-provider-disclosure">
              <summary>{copy.providerDetails}<ChevronRight size={17} aria-hidden="true" /></summary>
              <div>
                {personRouteNote ? <p className={styles.routeNote}>{personRouteNote}</p> : null}
                <p className={styles.truth}><ShieldCheck size={16} aria-hidden="true" />{copy.truth}</p>
                {resolvedView === "intro" ? <section className={styles.consent} data-testid="local-check-consent">
                  <p data-testid="consent-requester"><small>{copy.consentRequester}</small><strong>{copy.consentRequesterValue}</strong></p>
                  <p data-testid="consent-purpose"><small>{copy.consentPurpose}</small><strong>{copy.consentPurposeValue}</strong></p>
                  <p data-testid="consent-minimum"><small>{copy.consentMinimum}</small><strong>{copy.consentMinimumValue}</strong></p>
                  <p data-testid="consent-retention"><small>{copy.consentRetention}</small><strong>{copy.consentRetentionValue}</strong></p>
                </section> : null}
              </div>
            </details> : <p className={styles.truth}><ShieldCheck size={16} aria-hidden="true" />{copy.truth}</p>}
            <section className={styles.returnContext} data-testid="action-gate-return-context" data-return-venue={pending.venueId} data-return-table={pending.cta === "JOIN_TABLE" ? pending.tableId : "none"} data-return-nonce={pending.cta === "SUBMIT_LOCAL_SIGNAL" ? pending.draftNonce : "none"}>
              <small>{copy.returnLabel}</small><strong>{returnLabel(pending, copy)}</strong>
              {pending.cta === "JOIN_TABLE" && pending.draft ? <blockquote>{pending.draft}</blockquote> : null}
              {pending.cta === "SUBMIT_LOCAL_SIGNAL" && pending.note ? <blockquote>{pending.note}</blockquote> : null}
            </section>
            <ol className={styles.plan} aria-label={copy.planLabel}>{pending.gatePlan.map((item) => <li key={item} data-state={satisfied.has(item) ? "complete" : item === activeGate ? "active" : "upcoming"}>{satisfied.has(item) ? <BadgeCheck size={15} aria-hidden="true" /> : <i aria-hidden="true" />}{item === "payment_kyc" ? copy.planPayment : item === "person" ? copy.planPerson : item === "age" ? copy.planAge : copy.planAccount}</li>)}</ol>
          </div>
          <div className={styles.actions} data-testid={resolvedView === "intro" ? undefined : "local-check-result"} data-result={resolvedView === "intro" ? undefined : resolvedView}>
            {resolvedView === "intro" ? gate !== "person" || personRoute ? <button type="button" className={styles.primary} data-testid={gate === "person" ? "local-check-boundary-continue" : gate === "age" ? "after19-start" : "action-gate-confirm"} onClick={confirm}>{action}<ChevronRight size={17} aria-hidden="true" /></button> : null
              : residenceUnavailable ? <button type="button" className={styles.primary} data-testid="local-check-passport-alternate" onClick={usePassportAlternative}><BookOpenCheck size={17} aria-hidden="true" />{copy.usePassport}</button>
                : <button type="button" className={styles.primary} data-testid="action-gate-retry" onClick={retry}><RotateCcw size={17} aria-hidden="true" />{resolvedView === "expired" ? copy.renew : copy.retry}</button>}
            <button type="button" className={styles.secondary} data-testid="action-gate-cancel" onClick={cancel}>{copy.cancel}</button>
          </div>
        </div>
      </section>
    </div>
  )
}
