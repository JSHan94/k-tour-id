"use client"

import type { KeyboardEvent, ReactNode } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowRight, BadgeCheck, Camera, Check, ChevronLeft, FileCheck2, FileKey2, IdCard,
  BookOpenCheck, Nfc, RefreshCw, ScanFace, ShieldCheck, Smartphone, TriangleAlert, WalletCards, X,
} from "lucide-react"
import { useOndoB } from "../shared/state/ondo-b-provider"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import { useModalIsolation } from "../shared/ui/use-modal-isolation"
import {
  createIdentitySetupSessionB,
  isIdentitySetupSessionActiveB,
  KTOUR_ID_RECOVERY_CODES,
  type OndoBCredentialStatus,
  type OndoBIdentityMethod,
  type OndoBIdentityRecoveryCode,
  type OndoBIdentitySetupSession,
} from "./ktour-id-setup-model-b"
import styles from "./ktour-id-setup-b.module.css"

type Phase =
  | "method_select" | "consent" | "route_prepare" | "cx_handoff_preview"
  | "document_preview" | "face_liveness_preview" | "provider_processing_preview"
  | "evidence_preview" | "issuance_preview" | "holder_delivery_preview"
  | "credential_ready" | "presentation_request" | "presentation_consent"
  | "presentation_result" | "failed" | "unavailable" | "expired"

type QaWindow = Window & {
  __ONDO_B_QA__?: {
    identitySetupOutcome?: "success" | OndoBIdentityRecoveryCode
    credentialStatus?: Exclude<OndoBCredentialStatus, "none">
    identity?: {
      outcome?: "IDENTITY_METHOD_UNAVAILABLE"
      credentialStatus?: Exclude<OndoBCredentialStatus, "none">
      presentationOutcome?: "PRESENTATION_DENIED" | "PRESENTATION_REQUEST_EXPIRED" | "PRESENTATION_REPLAY"
    }
  }
}

const COPY = {
  en: {
    dialog: "Optional K-Tour ID setup", close: "Close K-Tour ID setup", back: "Previous step",
    env: "SIMULATED · No identity provider or OpenDID service is contacted.",
    boundary: "Private K-Tour service credential · not a government ID, visa, residence card, residence permit or immigration status.",
    optional: "OPTIONAL · EXPLORE WITHOUT IT", title: "Set up a private K-Tour ID",
    lead: "Choose the route that applies to you. Guest Explore stays open without it. K-Tour ID does not complete Person, 19+, Account, or Payment.",
    mobile: "Korean Mobile ID", mobileNote: "Korean national · OmniOne CX",
    residence: "Mobile Residence Card", residenceNote: "Registered foreign resident · OmniOne CX",
    passport: "Passport eKYC", passportNote: "Short-term traveler · separate NFC / OCR, face and liveness provider",
    separate: "Passport eKYC uses a separate provider — not OmniOne CX.", review: "Review consent", later: "Not now — keep exploring",
    consentTitle: "Review this simulated request", consentBody: "Nothing starts until you agree. No camera, NFC reader, file picker or provider connection will open.",
    requester: "Requester", requesterValue: "ONDO K-Tour ID demo", purpose: "Purpose", purposeValue: "Create a minimum travel-eligibility result for a private service credential",
    provider: "Proofing route", evidence: "Requested evidence", retention: "Retention", retentionValue: "No document, face, provider result or credential is saved; this tab only",
    accept: "Agree and preview", decline: "Decline and return", prepare: "Prepare the route", prepareBody: "This is a UI walkthrough. It creates no provider request, signed callback or official verification.", next: "Continue preview",
    cx: "Preview the OmniOne CX handoff", cxBody: "A configured environment would open a Mobile ID request and validate a signed callback. This demo sends nothing.",
    document: "Preview passport document checks", documentBody: "A separate provider would use NFC / OCR and authenticity checks. No passport image, MRZ or chip data is captured.",
    face: "Preview face and liveness", faceBody: "A separate provider would return only a normalized result and risk flags. This demo never opens the camera.",
    processing: "Preview provider processing", processingBody: "This models a normalized response. There is no live receipt, callback or transaction.",
    evidenceTitle: "Review the minimum evidence", evidenceBody: "Demo result: the selected method completed. No name, document number, image, biometric or provider token is exposed.",
    issue: "Preview OpenDID issuance", issueBody: "OpenDID covers issue, holder delivery, status and presentation. It does not perform passport, document, face or liveness verification.",
    holder: "Deliver to the demo holder", holderBody: "The marker remains in memory in this tab. No DID, VC payload or holder file is created or stored.",
    ready: "Simulated K-Tour ID ready", readyBody: "This private demo credential is available only in this tab. Check its status before any separate presentation request.",
    present: "Preview presentation", request: "Presentation request", requestBody: "A demo verifier asks for one minimum predicate. No VP or reusable identifier is exposed.",
    presentConsent: "Approve this one request?", presentConsentBody: "Approval applies once. There is no always allow, and denial does not change the credential.",
    approve: "Approve once", deny: "Deny", result: "Presentation preview complete", resultBody: "Only a simulated yes/no result was shown. No live VP, receipt or transaction exists.",
    returnOnboarding: "Return to guest setup", returnTraveler: "Return to Travel Pass",
    unavailable: "This route is not configured", unavailableBody: "Mobile Residence Card is for registered foreign residents, but no provider profile is configured in this demo.",
    assurance: "Passport eKYC does not verify registered-resident status and is not an equivalent residence-card check.", usePassport: "Use Passport eKYC instead",
    failure: "The simulated step did not complete", failureBody: "No evidence or credential was created. Retry the safe step or choose another route.",
    expired: "This setup session expired", expiredBody: "The ten-minute preview ended. Start a new route without losing guest Explore.", retry: "Retry safe step", another: "Choose another route",
    expiredStatus: "This demo credential expired.", suspendedStatus: "This demo credential is suspended.", revokedStatus: "This demo credential is revoked.",
    chooseStep: "Choose", checkStep: "Check", issueStep: "Issue", presentStep: "Present",
  },
  ko: {
    dialog: "선택형 K-Tour ID 설정", close: "K-Tour ID 설정 닫기", back: "이전 단계",
    env: "시뮬레이션 · 신원확인 기관이나 OpenDID 서비스에 요청을 보내지 않습니다.",
    boundary: "민간 K-Tour 서비스 자격증명 · 정부 신분증·비자·외국인등록증·체류허가·체류자격이 아닙니다.",
    optional: "선택 사항 · 없어도 게스트 탐색 가능", title: "민간 K-Tour ID 설정",
    lead: "나에게 맞는 경로를 직접 선택하세요. 없어도 탐색할 수 있고 계정·본인·19+·결제 상태와는 각각 별개입니다.",
    mobile: "한국인 모바일 신분증", mobileNote: "한국 국적자 · OmniOne CX",
    residence: "모바일 외국인등록증", residenceNote: "외국인등록을 마친 거주자 · OmniOne CX",
    passport: "여권 eKYC", passportNote: "단기 여행자 · 별도 NFC / OCR, 얼굴·라이브니스 제공자",
    separate: "여권 eKYC는 OmniOne CX가 아닌 별도 제공자입니다.", review: "동의 내용 보기", later: "나중에 — 게스트로 계속",
    consentTitle: "시뮬레이션 요청 확인", consentBody: "동의 전에는 아무것도 시작하지 않습니다. 카메라·NFC·파일 선택·기관 연결을 열지 않습니다.",
    requester: "요청자", requesterValue: "ONDO K-Tour ID 데모", purpose: "목적", purposeValue: "민간 서비스 자격증명을 위한 최소 여행 자격 결과 만들기",
    provider: "확인 경로", evidence: "요청 증빙", retention: "보관", retentionValue: "문서·얼굴·기관 결과·자격증명은 저장하지 않으며 이 탭에서만 유지",
    accept: "동의하고 미리보기", decline: "거절하고 돌아가기", prepare: "경로 준비", prepareBody: "화면 흐름만 보여주는 시뮬레이션입니다. 기관 요청·서명 콜백·공식 인증을 만들지 않습니다.", next: "미리보기 계속",
    cx: "OmniOne CX 전달 미리보기", cxBody: "실제 구성 환경은 모바일 신분증 요청을 열고 서명 콜백을 검증합니다. 이 데모는 아무것도 보내지 않습니다.",
    document: "여권 문서 확인 미리보기", documentBody: "별도 제공자가 NFC / OCR과 진위 검사를 수행합니다. 여권 이미지·MRZ·칩 데이터는 수집하지 않습니다.",
    face: "얼굴·라이브니스 미리보기", faceBody: "별도 제공자는 정규화 결과와 위험 플래그만 반환합니다. 이 데모는 카메라를 열지 않습니다.",
    processing: "기관 처리 미리보기", processingBody: "정규화 응답 화면만 재현합니다. 실제 영수증·콜백·거래는 없습니다.",
    evidenceTitle: "최소 증빙 결과 확인", evidenceBody: "데모 결과: 선택한 경로 완료. 이름·문서번호·이미지·생체정보·기관 토큰을 노출하지 않습니다.",
    issue: "OpenDID 발급 미리보기", issueBody: "OpenDID는 발급·holder 전달·상태·제시를 담당하며 여권·문서·얼굴·라이브니스를 검증하지 않습니다.",
    holder: "데모 holder에 전달", holderBody: "표식은 이 탭 메모리에만 유지됩니다. DID·VC 원문·holder 파일을 만들거나 저장하지 않습니다.",
    ready: "시뮬레이션 K-Tour ID 준비 완료", readyBody: "민간 데모 자격증명은 이 탭에서만 사용할 수 있고 별도 제시 요청 전에 상태를 확인합니다.",
    present: "제시 미리보기", request: "자격증명 제시 요청", requestBody: "데모 검증자가 최소 조건 하나만 요청합니다. VP나 재사용 식별자는 노출하지 않습니다.",
    presentConsent: "이번 요청에만 동의할까요?", presentConsentBody: "승인은 한 번만 적용됩니다. 항상 허용은 없고 거절해도 자격증명은 바뀌지 않습니다.",
    approve: "한 번만 승인", deny: "거절", result: "제시 미리보기 완료", resultBody: "시뮬레이션된 예/아니오 결과만 표시했습니다. 실제 VP·영수증·거래는 없습니다.",
    returnOnboarding: "게스트 설정으로 돌아가기", returnTraveler: "여행 패스로 돌아가기",
    unavailable: "이 경로는 구성되지 않았어요", unavailableBody: "모바일 외국인등록증은 등록외국인을 위한 경로지만 이번 데모에는 제공자 프로필이 없습니다.",
    assurance: "여권 eKYC는 등록외국인 체류 자격을 확인하지 않으며 외국인등록증 확인과 동등하지 않습니다.", usePassport: "여권 eKYC로 대신 진행",
    failure: "시뮬레이션 단계를 완료하지 못했어요", failureBody: "증빙이나 자격증명을 만들지 않았습니다. 안전한 단계부터 다시 시도하거나 다른 경로를 고르세요.",
    expired: "설정 세션이 만료됐어요", expiredBody: "10분짜리 미리보기가 끝났습니다. 게스트 탐색은 유지한 채 새 경로를 시작하세요.", retry: "안전한 단계 다시 시도", another: "다른 경로 선택",
    expiredStatus: "이 데모 자격증명은 만료됐습니다.", suspendedStatus: "이 데모 자격증명은 정지됐습니다.", revokedStatus: "이 데모 자격증명은 폐기됐습니다.",
    chooseStep: "선택", checkStep: "확인", issueStep: "발급", presentStep: "제시",
  },
  ja: {
    dialog: "任意のK-Tour ID設定", close: "K-Tour ID設定を閉じる", back: "前のステップ",
    env: "シミュレーション · 本人確認事業者やOpenDIDサービスには送信しません。",
    boundary: "民間のK-Tourサービス資格情報 · 公的身分証、ビザ、在留カード、在留許可、在留資格ではありません。",
    optional: "任意 · 設定なしでもゲスト利用可能", title: "民間のK-Tour IDを設定",
    lead: "該当する方法を自分で選びます。設定なしでも探せて、アカウント、本人、19歳以上、決済とは別です。",
    mobile: "韓国人向けモバイル身分証", mobileNote: "韓国籍の方 · OmniOne CX",
    residence: "モバイル在留カード", residenceNote: "外国人登録済みの居住者 · OmniOne CX",
    passport: "パスポートeKYC", passportNote: "短期旅行者 · 別のNFC / OCR、顔・ライブネス事業者",
    separate: "パスポートeKYCはOmniOne CXではなく別の事業者です。", review: "同意内容を確認", later: "今はしない — ゲスト利用を続ける",
    consentTitle: "シミュレーション依頼を確認", consentBody: "同意前には何も始まりません。カメラ、NFC、ファイル選択、事業者接続は開きません。",
    requester: "依頼者", requesterValue: "ONDO K-Tour IDデモ", purpose: "目的", purposeValue: "民間サービス資格情報のための最小限の旅行資格結果を作成",
    provider: "確認ルート", evidence: "依頼する証拠", retention: "保持", retentionValue: "文書、顔、事業者結果、資格情報は保存せず、このタブのみ",
    accept: "同意してプレビュー", decline: "拒否して戻る", prepare: "ルートを準備", prepareBody: "画面遷移だけのシミュレーションです。事業者依頼、署名コールバック、公的確認は作りません。", next: "プレビューを続ける",
    cx: "OmniOne CX連携プレビュー", cxBody: "実環境ではMobile ID依頼を開き署名済みコールバックを検証します。このデモは何も送信しません。",
    document: "パスポート文書確認のプレビュー", documentBody: "別事業者がNFC / OCRと真正性確認を行います。画像、MRZ、チップ情報は取得しません。",
    face: "顔・ライブネスのプレビュー", faceBody: "別事業者は正規化した結果とリスクフラグだけを返します。このデモはカメラを開きません。",
    processing: "事業者処理のプレビュー", processingBody: "正規化した応答画面だけを再現します。実際のレシート、コールバック、取引はありません。",
    evidenceTitle: "最小限の証拠を確認", evidenceBody: "デモ結果：選択ルート完了。氏名、文書番号、画像、生体情報、事業者トークンは表示しません。",
    issue: "OpenDID発行プレビュー", issueBody: "OpenDIDは発行、holder配信、状態、提示を担い、パスポート、文書、顔、ライブネスは確認しません。",
    holder: "デモholderへ配信", holderBody: "印はこのタブのメモリだけに残ります。DID、VC本文、holderファイルは作成・保存しません。",
    ready: "シミュレーションK-Tour ID準備完了", readyBody: "民間デモ資格情報はこのタブだけで使え、別の提示依頼の前に状態を確認します。",
    present: "提示をプレビュー", request: "資格情報の提示依頼", requestBody: "デモ検証者が最小条件を一つだけ求めます。VPや再利用識別子は出しません。",
    presentConsent: "今回だけ承認しますか？", presentConsentBody: "承認は一回だけです。「常に許可」はなく、拒否しても資格情報は変わりません。",
    approve: "一回だけ承認", deny: "拒否", result: "提示プレビュー完了", resultBody: "シミュレーションの可否だけを表示しました。実際のVP、レシート、取引はありません。",
    returnOnboarding: "ゲスト設定に戻る", returnTraveler: "トラベルパスに戻る",
    unavailable: "このルートは未設定です", unavailableBody: "Mobile Residence Cardは外国人登録済み居住者向けですが、このデモに事業者設定はありません。",
    assurance: "パスポートeKYCは登録居住者の在留資格を確認せず、在留カード確認と同等ではありません。", usePassport: "パスポートeKYCを利用",
    failure: "シミュレーションを完了できませんでした", failureBody: "証拠や資格情報は作成していません。安全な段階から再試行するか別の方法を選べます。",
    expired: "設定セッションが期限切れです", expiredBody: "10分のプレビューが終了しました。ゲスト利用を失わず新しい方法を始められます。", retry: "安全な段階を再試行", another: "別の方法を選ぶ",
    expiredStatus: "このデモ資格情報は期限切れです。", suspendedStatus: "このデモ資格情報は停止中です。", revokedStatus: "このデモ資格情報は失効済みです。",
    chooseStep: "選択", checkStep: "確認", issueStep: "発行", presentStep: "提示",
  },
} satisfies Record<OndoBLocale, Record<string, string>>

const FOCUSABLE = "button:not([disabled]),summary,[href],[tabindex]:not([tabindex='-1'])"
const ISSUER = "K-Tour ID Demo Issuer"
const CREDENTIAL_TYPE = "KTourVisitorCredential"

function methodDetails(method: OndoBIdentityMethod, copy: typeof COPY.en) {
  if (method === "mobile_id") return { title: copy.mobile, note: copy.mobileNote, provider: "OmniOne CX", evidence: copy.mobile }
  if (method === "mobile_residence_card") return { title: copy.residence, note: copy.residenceNote, provider: "OmniOne CX", evidence: copy.residence }
  return { title: copy.passport, note: copy.passportNote, provider: `${copy.separate} · not configured`, evidence: copy.passportNote }
}

function progressStep(phase: Phase) {
  if (["method_select", "consent", "unavailable"].includes(phase)) return 1
  if (["route_prepare", "cx_handoff_preview", "document_preview", "face_liveness_preview", "provider_processing_preview", "evidence_preview", "failed", "expired"].includes(phase)) return 2
  if (["issuance_preview", "holder_delivery_preview", "credential_ready"].includes(phase)) return 3
  return 4
}

export function KTourIdSetupB() {
  const { state, actions } = useOndoB()
  const [method, setMethod] = useState<OndoBIdentityMethod>("passport_ekyc")
  const [phase, setPhase] = useState<Phase>("method_select")
  const [session, setSession] = useState<OndoBIdentitySetupSession | null>(null)
  const [recoveryCode, setRecoveryCode] = useState<OndoBIdentityRecoveryCode | null>(null)
  const [retryPhase, setRetryPhase] = useState<Phase>("route_prepare")
  const [presentationApproved, setPresentationApproved] = useState<boolean | null>(null)
  const issuedOnceRef = useRef(false)
  const layerRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const origin = state.identitySetupOrigin
  const active = origin !== null
  const copy = COPY[state.locale]
  const details = methodDetails(method, copy)
  const injectedStatus = typeof window === "undefined" ? undefined : ((window as QaWindow).__ONDO_B_QA__?.identity?.credentialStatus ?? (window as QaWindow).__ONDO_B_QA__?.credentialStatus)
  const credentialStatus: OndoBCredentialStatus = injectedStatus ?? state.identityCredential?.status ?? "none"
  const returnLabel = origin === "onboarding" ? copy.returnOnboarding : copy.returnTraveler
  const steps = [copy.chooseStep, copy.checkStep, copy.issueStep, copy.presentStep]
  const currentStep = progressStep(phase)

  const routes = useMemo(() => [
    { id: "mobile_id" as const, icon: Smartphone, title: copy.mobile, note: copy.mobileNote, oldId: "ktour-id-route-mobile-id", newId: "k-tour-id-method-mobile-id" },
    { id: "mobile_residence_card" as const, icon: IdCard, title: copy.residence, note: copy.residenceNote, oldId: "ktour-id-route-residence-card", newId: "k-tour-id-method-mobile-residence-card" },
    { id: "passport_ekyc" as const, icon: BookOpenCheck, title: copy.passport, note: copy.passportNote, oldId: "ktour-id-route-passport", newId: "k-tour-id-method-passport-ekyc" },
  ], [copy])

  useEffect(() => {
    if (!active) return
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setMethod(state.identityCredential?.method ?? "passport_ekyc")
    setPhase(state.identityCredential ? "credential_ready" : "method_select")
    setSession(null); setRecoveryCode(null); setPresentationApproved(null)
    issuedOnceRef.current = Boolean(state.identityCredential)
    return () => {
      window.requestAnimationFrame(() => {
        const opener = openerRef.current
        if (opener?.isConnected && !opener.closest("[inert],[aria-hidden='true']")) opener.focus({ preventScroll: true })
      })
    }
  }, [active, origin, state.identityCredential])

  useModalIsolation(active, layerRef)

  useEffect(() => {
    if (!active) return
    const frame = window.requestAnimationFrame(() => {
      dialogRef.current?.scrollTo({ top: 0, behavior: "instant" })
      ;(dialogRef.current?.querySelector<HTMLElement>("[data-identity-initial-focus]") ?? dialogRef.current)?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [active, phase])

  useEffect(() => {
    if (!active) return
    const onEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return
      event.preventDefault(); event.stopImmediatePropagation(); actions.closeIdentitySetup()
    }
    document.addEventListener("keydown", onEscape, true)
    return () => document.removeEventListener("keydown", onEscape, true)
  }, [actions, active])

  if (!active || !origin) return null

  function fail(code: OndoBIdentityRecoveryCode, safePhase: Phase) {
    setRecoveryCode(code); setRetryPhase(safePhase)
    setPhase(code === "IDENTITY_SESSION_EXPIRED" ? "expired" : code === "IDENTITY_METHOD_UNAVAILABLE" ? "unavailable" : "failed")
  }

  function advance(next: Phase, safePhase = phase) {
    if (!session || !isIdentitySetupSessionActiveB(session)) return fail("IDENTITY_SESSION_EXPIRED", "route_prepare")
    const qa = (window as QaWindow).__ONDO_B_QA__
    const outcome = qa?.identity?.outcome ?? qa?.identitySetupOutcome ?? "success"
    if (outcome !== "success") return fail(outcome, safePhase)
    setPhase(next)
  }

  function acceptConsent() {
    setSession(createIdentitySetupSessionB(origin!, method)); setRecoveryCode(null); setPhase("route_prepare")
  }

  function beginRoute() {
    if (method === "mobile_residence_card") return fail("IDENTITY_METHOD_UNAVAILABLE", "route_prepare")
    advance(method === "mobile_id" ? "cx_handoff_preview" : "document_preview", "route_prepare")
  }

  function finishHolder() {
    if (issuedOnceRef.current) return setPhase("credential_ready")
    if (!session || !isIdentitySetupSessionActiveB(session)) return fail("IDENTITY_SESSION_EXPIRED", "holder_delivery_preview")
    issuedOnceRef.current = true
    actions.completeIdentitySetup(method)
    setPhase("credential_ready")
  }

  function goBack() {
    const previous: Partial<Record<Phase, Phase>> = {
      consent: "method_select", route_prepare: "consent", cx_handoff_preview: "route_prepare", document_preview: "route_prepare",
      face_liveness_preview: "document_preview", provider_processing_preview: method === "passport_ekyc" ? "face_liveness_preview" : "cx_handoff_preview",
      evidence_preview: "provider_processing_preview", issuance_preview: "evidence_preview", holder_delivery_preview: "issuance_preview",
      presentation_request: "credential_ready", presentation_consent: "presentation_request", presentation_result: "credential_ready",
    }
    setPhase(previous[phase] ?? "method_select")
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab") return
    const elements = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter((element) => element.offsetParent !== null)
    const first = elements[0]; const last = elements.at(-1)
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }

  const statusMessage = credentialStatus === "expired" ? copy.expiredStatus : credentialStatus === "suspended" ? copy.suspendedStatus : credentialStatus === "revoked" ? copy.revokedStatus : null

  return <div ref={layerRef} className={styles.root} data-testid="ondo-b-ktour-id-setup">
    <button type="button" className={styles.backdrop} tabIndex={-1} aria-hidden="true" onClick={actions.closeIdentitySetup} />
    <section ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-label={copy.dialog} tabIndex={-1}
      data-testid="k-tour-id-setup" data-phase={phase} data-method={method} data-environment="simulated" data-integration-status="not_configured" onKeyDown={handleKeyDown}>
      <header className={styles.header}>
        {phase === "method_select" ? <span className={styles.brandMark}><ShieldCheck size={19} aria-hidden="true" /></span> : <button type="button" className={styles.iconButton} aria-label={copy.back} onClick={goBack}><ChevronLeft size={21} aria-hidden="true" /></button>}
        <p data-testid="k-tour-id-environment"><i aria-hidden="true" />{copy.env}</p>
        <button type="button" className={styles.iconButton} data-identity-initial-focus={phase === "method_select" ? true : undefined} data-testid="k-tour-id-cancel" aria-label={copy.close} onClick={actions.closeIdentitySetup}><X size={20} aria-hidden="true" /></button>
      </header>
      <div className={styles.progress} role="list" aria-label={copy.dialog}>{steps.map((label, index) => <div key={label} role="listitem" data-current={currentStep === index + 1} data-complete={currentStep > index + 1}><span>{currentStep > index + 1 ? <Check size={12} aria-hidden="true" /> : index + 1}</span><small>{label}</small></div>)}</div>

      {phase === "method_select" ? <div className={styles.body}>
        <p className={styles.eyebrow}>{copy.optional}</p><h1>{copy.title}</h1><p className={styles.lead}>{copy.lead}</p>
        <div className={styles.routes} data-testid="k-tour-id-methods">{routes.map(({ id, icon: Icon, title, note, oldId, newId }) => <button key={id} type="button" data-testid={oldId} className={method === id ? styles.routeSelected : styles.route} aria-pressed={method === id} onClick={() => { setMethod(id); setPhase("consent") }}><span data-testid={newId}><Icon size={22} aria-hidden="true" /></span><span><strong>{title}</strong><small>{note}</small></span><i>{method === id ? <Check size={14} aria-hidden="true" /> : null}</i></button>)}</div>
        <p className={styles.routeBoundary}>{copy.separate}</p>
        <div className={styles.actions}><button type="button" className={styles.primary} onClick={() => setPhase("consent")}>{copy.review}<ArrowRight size={17} aria-hidden="true" /></button><button type="button" className={styles.secondary} onClick={actions.closeIdentitySetup}>{copy.later}</button></div>
      </div> : null}

      {phase === "consent" ? <div className={styles.body} data-testid="k-tour-id-consent"><p className={styles.eyebrow}>{details.title}</p><h1>{copy.consentTitle}</h1><p className={styles.lead}>{copy.consentBody}</p>
        <Disclosure rows={[[copy.requester, copy.requesterValue, "identity-consent-requester"], [copy.purpose, copy.purposeValue, "identity-consent-purpose"], [copy.provider, details.provider, "identity-consent-provider"], [copy.evidence, details.evidence, "identity-consent-evidence"], [copy.retention, copy.retentionValue, "identity-consent-retention"]]} />
        <div className={styles.actions}><button type="button" data-identity-initial-focus data-testid="k-tour-id-consent-approve" className={styles.primary} onClick={acceptConsent}>{copy.accept}</button><button type="button" className={styles.secondary} onClick={actions.closeIdentitySetup}>{copy.decline}</button></div>
      </div> : null}

      {phase === "route_prepare" ? <Panel testId="k-tour-id-route-step" icon={<ShieldCheck />} eyebrow={details.title} title={copy.prepare} body={copy.prepareBody} action={copy.next} onAction={beginRoute} /> : null}
      {phase === "cx_handoff_preview" ? <Panel testId="k-tour-id-route-step" aliases={["ktour-id-mobile-handoff"]} icon={<Smartphone />} eyebrow="OmniOne CX · SIMULATED" title={copy.cx} body={copy.cxBody} action={copy.next} onAction={() => advance("provider_processing_preview", "cx_handoff_preview")} visual="phone" /> : null}
      {phase === "document_preview" ? <Panel testId="k-tour-id-passport-document" aliases={["ktour-id-passport-document", "k-tour-id-route-step"]} icon={<BookOpenCheck />} eyebrow="Passport eKYC · SIMULATED" title={copy.document} body={copy.documentBody} action={copy.next} onAction={() => advance("face_liveness_preview", "document_preview")} visual="document" /> : null}
      {phase === "face_liveness_preview" ? <Panel testId="k-tour-id-passport-face" aliases={["ktour-id-passport-face", "k-tour-id-route-step"]} icon={<ScanFace />} eyebrow="FACE + LIVENESS · SIMULATED" title={copy.face} body={copy.faceBody} action={copy.next} onAction={() => advance("provider_processing_preview", "face_liveness_preview")} visual="face" /> : null}
      {phase === "provider_processing_preview" ? <Panel testId="k-tour-id-route-step" icon={<RefreshCw />} eyebrow={`${details.provider} · SIMULATED`} title={copy.processing} body={copy.processingBody} action={copy.next} onAction={() => advance("evidence_preview", "provider_processing_preview")} visual="processing" /> : null}
      {phase === "evidence_preview" ? <Panel testId="k-tour-id-evidence-preview" icon={<FileCheck2 />} eyebrow="MINIMUM RESULT · SIMULATED" title={copy.evidenceTitle} body={copy.evidenceBody} action={copy.next} onAction={() => advance("issuance_preview", "evidence_preview")} visual="evidence" /> : null}
      {phase === "issuance_preview" ? <Panel testId="k-tour-id-issuance-preview" aliases={["ktour-id-opendid-issue"]} icon={<FileKey2 />} eyebrow="OpenDID · ISSUE PREVIEW" title={copy.issue} body={copy.issueBody} action={copy.next} onAction={() => advance("holder_delivery_preview", "issuance_preview")} meta={[ISSUER, CREDENTIAL_TYPE]} /> : null}
      {phase === "holder_delivery_preview" ? <Panel testId="k-tour-id-holder-delivery" icon={<WalletCards />} eyebrow="OpenDID · HOLDER DELIVERY PREVIEW" title={copy.holder} body={copy.holderBody} action={copy.next} onAction={finishHolder} meta={[CREDENTIAL_TYPE, "IN-MEMORY · THIS TAB"]} /> : null}

      {phase === "credential_ready" ? <div className={`${styles.body} ${styles.centered}`} data-testid="k-tour-id-credential" data-status={credentialStatus} data-code={statusMessage ? `CREDENTIAL_${credentialStatus.toUpperCase()}` : undefined} data-issuance-count={issuedOnceRef.current ? 1 : 0}><span data-testid="ktour-id-result" className={styles.heroIcon}><BadgeCheck size={31} aria-hidden="true" /></span><p className={styles.eyebrow}>SIMULATED READY · THIS TAB</p><h1>{copy.ready}</h1><p className={styles.lead}>{copy.readyBody}</p><div className={styles.credential}><FileKey2 size={27} aria-hidden="true" /><span><strong>{CREDENTIAL_TYPE}</strong><small>{ISSUER} · SIMULATED</small></span></div>{statusMessage ? <p className={styles.statusWarning} role="alert">{statusMessage}</p> : null}<div className={styles.actions}><button type="button" data-testid="k-tour-id-presentation-open" disabled={Boolean(statusMessage)} className={styles.primary} onClick={() => setPhase("presentation_request")}>{copy.present}<ArrowRight size={17} aria-hidden="true" /></button><button type="button" data-identity-initial-focus data-testid="k-tour-id-return" className={styles.secondary} onClick={actions.closeIdentitySetup}>{returnLabel}</button></div></div> : null}

      {phase === "presentation_request" ? <div className={styles.body} data-testid="k-tour-id-presentation-request"><p className={styles.eyebrow}>OpenDID · PRESENTATION REQUEST</p><h1>{copy.request}</h1><p className={styles.lead}>{copy.requestBody}</p><Disclosure rows={[[copy.requester, "ONDO Table demo verifier"], [copy.purpose, "Minimum trip eligibility for this one request"], [copy.evidence, "K-Tour travel eligibility · yes/no only"], [copy.retention, "One request · nonce and expiry semantics · no VP stored"]]} /><div className={styles.actions}><button type="button" data-testid="k-tour-id-continue" className={styles.primary} onClick={() => setPhase("presentation_consent")}>{copy.next}</button><button type="button" className={styles.secondary} onClick={() => setPhase("credential_ready")}>{copy.later}</button></div></div> : null}
      {phase === "presentation_consent" ? <div className={styles.body} data-testid="k-tour-id-presentation-consent"><p className={styles.eyebrow}>ONDO TABLE DEMO VERIFIER</p><h1>{copy.presentConsent}</h1><p className={styles.lead}>{copy.presentConsentBody}</p><div className={styles.predicate}><ShieldCheck size={22} aria-hidden="true" /><span><strong>K-Tour travel eligibility · yes/no only</strong><small>One request · no VP stored</small></span></div><div className={styles.actions}><button type="button" data-testid="k-tour-id-presentation-approve" className={styles.primary} onClick={() => { const outcome = (window as QaWindow).__ONDO_B_QA__?.identity?.presentationOutcome; setPresentationApproved(outcome ? false : true); setRecoveryCode(outcome ?? null); setPhase("presentation_result") }}>{copy.approve}</button><button type="button" className={styles.secondary} onClick={() => { setPresentationApproved(false); setRecoveryCode("PRESENTATION_DENIED"); setPhase("presentation_result") }}>{copy.deny}</button></div></div> : null}
      {phase === "presentation_result" ? <div className={`${styles.body} ${styles.centered}`} data-testid="k-tour-id-presentation-result" data-result={recoveryCode === "PRESENTATION_REQUEST_EXPIRED" ? "expired" : recoveryCode === "PRESENTATION_REPLAY" ? "replay" : recoveryCode === "PRESENTATION_DENIED" ? "denied" : "success"} data-code={recoveryCode ?? undefined}><span className={styles.heroIcon}>{presentationApproved ? <BadgeCheck size={31} aria-hidden="true" /> : <X size={31} aria-hidden="true" />}</span><p className={styles.eyebrow}>{presentationApproved ? "SIMULATED · APPROVED ONCE" : `SIMULATED · ${recoveryCode ?? "PRESENTATION_DENIED"}`}</p><h1>{copy.result}</h1><p className={styles.lead}>{copy.resultBody}</p><div className={styles.credential} data-testid="k-tour-id-credential" data-status={credentialStatus} data-issuance-count={issuedOnceRef.current ? 1 : 0}><FileKey2 size={24} aria-hidden="true" /><span><strong>{CREDENTIAL_TYPE}</strong><small>{ISSUER} · unchanged</small></span></div><div className={styles.actions}><button type="button" className={styles.primary} onClick={() => setPhase("credential_ready")}>{copy.returnTraveler}</button><button type="button" data-testid="k-tour-id-return" className={styles.secondary} onClick={actions.closeIdentitySetup}>{returnLabel}</button></div></div> : null}

      {phase === "unavailable" ? <StatusPanel testId="k-tour-id-unavailable" alias="ktour-id-setup-unavailable" code="IDENTITY_METHOD_UNAVAILABLE" title={copy.unavailable} body={copy.unavailableBody} extra={copy.assurance} primary={copy.usePassport} onPrimary={() => { setMethod("passport_ekyc"); setPhase("consent") }} primaryTestId="k-tour-id-alternate-passport" secondary={copy.another} onSecondary={() => setPhase("method_select")} /> : null}
      {phase === "failed" ? <StatusPanel testId="k-tour-id-failure" alias="ktour-id-setup-failure" code={recoveryCode ?? "PROVIDER_TIMEOUT"} title={copy.failure} body={copy.failureBody} primary={copy.retry} onPrimary={() => { setRecoveryCode(null); setPhase(retryPhase) }} primaryTestId="k-tour-id-retry" secondary={copy.another} onSecondary={() => setPhase("method_select")} /> : null}
      {phase === "expired" ? <StatusPanel testId="k-tour-id-expired" alias="ktour-id-setup-expired" code="IDENTITY_SESSION_EXPIRED" title={copy.expired} body={copy.expiredBody} primary={copy.retry} onPrimary={() => { setSession(createIdentitySetupSessionB(origin, method)); setPhase("route_prepare") }} primaryTestId="k-tour-id-retry" secondary={copy.later} onSecondary={actions.closeIdentitySetup} /> : null}

      <p className={styles.privateBoundary} data-testid="k-tour-id-private-boundary"><ShieldCheck size={15} aria-hidden="true" />{copy.boundary}</p>
      <span className={styles.contractOnly} aria-hidden="true">{KTOUR_ID_RECOVERY_CODES.join(" ")}</span>
    </section>
  </div>
}

function Disclosure({ rows }: { rows: Array<[string, string, string?]> }) {
  return <dl className={styles.disclosure}>{rows.map(([term, value, testId]) => <div key={`${term}:${value}`} data-testid={testId}><dt>{term}</dt><dd>{value}</dd></div>)}</dl>
}

function Panel({ testId, aliases = [], icon, eyebrow, title, body, action, onAction, visual, meta }: { testId: string; aliases?: string[]; icon: ReactNode; eyebrow: string; title: string; body: string; action: string; onAction: () => void; visual?: "phone" | "document" | "face" | "processing" | "evidence"; meta?: [string, string] }) {
  return <div className={`${styles.body} ${styles.centered}`} data-testid={testId}><span data-testid={aliases[0]} className={styles.heroIcon}><span data-testid={aliases[1]}>{icon}</span></span><p className={styles.eyebrow}>{eyebrow}</p><h1>{title}</h1><p className={styles.lead}>{body}</p>{visual ? <div className={styles.visual} data-visual={visual} aria-hidden="true">{visual === "document" ? <><BookOpenCheck /><Nfc /></> : visual === "face" ? <><Camera /><ScanFace /></> : visual === "phone" ? <><Smartphone /><BadgeCheck /></> : visual === "processing" ? <><RefreshCw /><i /></> : <><FileCheck2 /><Check /></>}</div> : null}{meta ? <div className={styles.meta}><strong>{meta[0]}</strong><span>{meta[1]}</span></div> : null}<div className={styles.actions}><button type="button" data-identity-initial-focus data-testid="k-tour-id-continue" className={styles.primary} onClick={onAction}>{action}<ArrowRight size={17} aria-hidden="true" /></button></div></div>
}

function StatusPanel({ testId, alias, code, title, body, extra, primary, onPrimary, primaryTestId, secondary, onSecondary }: { testId: string; alias: string; code: string; title: string; body: string; extra?: string; primary: string; onPrimary: () => void; primaryTestId?: string; secondary: string; onSecondary: () => void }) {
  return <div className={`${styles.body} ${styles.centered}`} data-testid={testId} data-code={code} role="alert"><span data-testid={alias} className={styles.issueIcon}><TriangleAlert size={30} aria-hidden="true" /></span><p className={styles.errorCode}>{code}</p><h1>{title}</h1><p className={styles.lead}>{body}</p>{extra ? <p className={styles.assurance}>{extra}</p> : null}<div className={styles.actions}><button type="button" data-identity-initial-focus data-testid={primaryTestId} className={styles.primary} onClick={onPrimary}><RefreshCw size={17} aria-hidden="true" />{primary}</button><button type="button" className={styles.secondary} onClick={onSecondary}>{secondary}</button></div></div>
}
