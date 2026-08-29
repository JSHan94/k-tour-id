"use client"

import type { KeyboardEvent, ReactNode } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowRight, BadgeCheck, Camera, Check, ChevronLeft, FileCheck2, FileKey2, IdCard,
  BookOpenCheck, RefreshCw, ScanFace, ShieldCheck, Smartphone, TriangleAlert, WalletCards, X,
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
import { PassportOcrStepB } from "./passport-ocr-step-b"
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
    env: "ON-DEVICE",
    envDetail: "No identity provider or OpenDID service is connected.",
    boundary: "Private K-Tour service credential · not a government ID, visa, residence card, residence permit or immigration status.",
    optional: "OPTIONAL · EXPLORE WITHOUT IT", title: "Set up a private K-Tour ID",
    lead: "Choose the route that applies to you. Guest Explore stays open without it. K-Tour ID does not complete Person, 19+, Account, or Payment.",
    mobile: "Korean Mobile ID", mobileNote: "Korean national · OmniOne CX",
    residence: "Mobile Residence Card", residenceNote: "Registered foreign resident · OmniOne CX",
    passport: "Passport eKYC", passportNote: "Short-term traveler · separate NFC / OCR, face and liveness provider", notConfigured: "not configured",
    separate: "Passport eKYC uses a separate provider — not OmniOne CX.", review: "Review consent", later: "Not now — keep exploring",
    consentTitle: "Review this request", consentBody: "Nothing starts until you agree. File selection opens only when you choose it; no camera capture, NFC reader or provider connection starts automatically.",
    requester: "Requester", requesterValue: "ONDO K-Tour ID", purpose: "Purpose", purposeValue: "Create a minimum travel-eligibility result for a private service credential",
    provider: "Proofing route", evidence: "Requested evidence", retention: "Retention", retentionValue: "A selected image stays in memory only until replace, remove, continue or close; no document, face, provider result or credential is saved",
    accept: "Agree and continue", decline: "Decline and return", prepare: "Prepare the route", prepareBody: "This on-device walkthrough creates no provider request, signed callback or official verification.", next: "Continue",
    cx: "Connect Mobile ID", cxBody: "A connected environment would open a Mobile ID request and validate a signed callback. Nothing leaves this device here.",
    document: "Choose a passport image", documentBody: "This tab decodes one selected image on-device for the OCR flow. It does not extract or retain passport data.",
    face: "Face and liveness", faceBody: "A connected provider would return only a normalized result and risk flags. The camera is not connected here.",
    processing: "Check the route", processingBody: "This device prepares a normalized response. There is no live receipt, callback or transaction.",
    evidenceTitle: "Review the minimum evidence", evidenceBody: "The selected route completed on this device. No name, document number, image, biometric or provider token is exposed.",
    issue: "Issue with OpenDID", issueBody: "OpenDID delivers the travel eligibility result to your Travel Pass and supports one-time sharing later. Passport and face checks stay with the selected proofing route.",
    holder: "Add to Travel Pass", holderBody: "Keep this travel eligibility result in this tab. Nothing is written to an external wallet or file.", holderLabel: "Private travel credential",
    ready: "K-Tour ID ready", readyBody: "Your private travel credential and local travel wallet are ready in this tab.",
    walletReady: "Travel wallet ready", walletReadyNote: "On-device balance · no provider or network connected",
    present: "Share eligibility", request: "Share travel eligibility", requestBody: "This flow asks for one minimum yes/no result. No reusable identifier is shared.",
    presentConsent: "Approve this one request?", presentConsentBody: "Approval applies once. There is no always allow, and denial does not change the credential.",
    presentationRequester: "ONDO Table", presentationPurpose: "Minimum trip eligibility for this one request",
    presentationEvidence: "K-Tour travel eligibility · yes/no only", presentationRetention: "This request only · expires automatically · result not stored",
    presentationPredicate: "K-Tour travel eligibility · yes/no only", presentationPredicateRetention: "One request · result not stored",
    credentialReadyEyebrow: "READY · THIS TAB", presentationRequestEyebrow: "TRAVEL ELIGIBILITY",
    presentationResultApproved: "APPROVED ONCE", presentationResultNotApproved: "NOT APPROVED", unchanged: "unchanged",
    approve: "Approve once", deny: "Deny", result: "Sharing complete", resultBody: "Only the yes/no result is shown. Nothing reusable is shared or stored.",
    returnOnboarding: "Return to guest setup", returnTraveler: "Return to Travel Pass", backToKTourId: "Back to K-Tour ID",
    unavailable: "This route is not configured", unavailableBody: "Mobile Residence Card is for registered foreign residents, but no provider profile is connected.",
    assurance: "Passport eKYC does not verify registered-resident status and is not an equivalent residence-card check.", usePassport: "Use Passport eKYC instead",
    failure: "This step did not complete", failureBody: "No evidence or credential was created. Retry the safe step or choose another route.",
    expired: "This setup session expired", expiredBody: "The ten-minute setup window ended. Start a new route without losing guest Explore.", retry: "Retry safe step", another: "Choose another route",
    expiredStatus: "This local credential expired.", suspendedStatus: "This local credential is suspended.", revokedStatus: "This local credential is revoked.",
    onDevice: "ON-DEVICE", mobileEyebrow: "OmniOne CX · MOBILE ID", faceEyebrow: "FACE + LIVENESS", evidenceEyebrow: "MINIMUM RESULT", issuanceEyebrow: "OpenDID · ISSUE", holderEyebrow: "TRAVEL PASS", holderMeta: "THIS TAB ONLY", issuerState: "THIS TAB",
    technicalTruth: "Protocol details: OpenDID issue and holder delivery; no DID or VC payload is created; presentation uses nonce and expiry semantics; no VP is stored. Credential type:",
    chooseStep: "Choose", checkStep: "Check", issueStep: "Issue", presentStep: "Present",
  },
  ko: {
    dialog: "선택형 K-Tour ID 설정", close: "K-Tour ID 설정 닫기", back: "이전 단계",
    env: "기기 내",
    envDetail: "신원확인 기관이나 OpenDID 서비스에 연결하지 않습니다.",
    boundary: "민간 K-Tour 서비스 자격증명 · 정부 신분증·비자·외국인등록증·체류허가·체류자격이 아닙니다.",
    optional: "선택 사항 · 없어도 게스트 탐색 가능", title: "민간 K-Tour ID 설정",
    lead: "나에게 맞는 경로를 직접 선택하세요. 없어도 탐색할 수 있고 계정·본인·19+·결제 상태와는 각각 별개입니다.",
    mobile: "한국인 모바일 신분증", mobileNote: "한국 국적자 · OmniOne CX",
    residence: "모바일 외국인등록증", residenceNote: "외국인등록을 마친 거주자 · OmniOne CX",
    passport: "여권 eKYC", passportNote: "단기 여행자 · 별도 NFC / OCR, 얼굴·라이브니스 제공자", notConfigured: "구성되지 않음",
    separate: "여권 eKYC는 OmniOne CX가 아닌 별도 제공자입니다.", review: "동의 내용 보기", later: "나중에 — 게스트로 계속",
    consentTitle: "요청 내용 확인", consentBody: "동의 전에는 아무것도 시작하지 않습니다. 직접 선택할 때만 파일 선택을 열고 카메라 촬영·NFC·기관 연결은 자동으로 시작하지 않습니다.",
    requester: "요청자", requesterValue: "ONDO K-Tour ID", purpose: "목적", purposeValue: "민간 서비스 자격증명을 위한 최소 여행 자격 결과 만들기",
    provider: "확인 경로", evidence: "요청 증빙", retention: "보관", retentionValue: "선택 이미지는 교체·삭제·계속·닫기 전까지만 메모리에 있고 문서·얼굴·기관 결과·자격증명은 저장하지 않음",
    accept: "동의하고 계속", decline: "거절하고 돌아가기", prepare: "경로 준비", prepareBody: "기기 안에서 절차를 진행하며 기관 요청·서명 콜백·공식 인증을 만들지 않습니다.", next: "계속",
    cx: "모바일 신분증 연결", cxBody: "연결된 환경에서는 모바일 신분증 요청을 열고 서명 콜백을 검증합니다. 여기서는 기기 밖으로 아무것도 보내지 않습니다.",
    document: "여권 이미지 선택", documentBody: "이 탭에서 선택 이미지 한 장을 해석해 OCR 흐름을 진행하며 여권 데이터를 추출하거나 보관하지 않습니다.",
    face: "얼굴·라이브니스", faceBody: "연결된 제공자는 정규화 결과와 위험 플래그만 반환합니다. 여기서는 카메라를 연결하지 않습니다.",
    processing: "확인 경로 처리", processingBody: "이 기기에서 정규화 응답을 준비합니다. 실제 영수증·콜백·거래는 없습니다.",
    evidenceTitle: "최소 증빙 결과 확인", evidenceBody: "선택한 경로를 이 기기에서 완료했습니다. 이름·문서번호·이미지·생체정보·기관 토큰을 노출하지 않습니다.",
    issue: "OpenDID로 발급", issueBody: "OpenDID는 여행 자격 결과를 여행 패스에 전달하고 필요할 때 한 번만 제시하도록 관리합니다. 여권·얼굴 확인은 선택한 확인 경로에서 따로 처리해요.",
    holder: "여행 패스에 담기", holderBody: "여행 자격 결과를 이 탭에 보관합니다. 외부 지갑이나 파일에는 저장하지 않아요.", holderLabel: "민간 여행 자격",
    ready: "K-Tour ID 준비 완료", readyBody: "민간 여행 자격증명과 로컬 여행 지갑이 이 탭에 준비됐어요.",
    walletReady: "여행 지갑 준비 완료", walletReadyNote: "기기 내 잔액 · 제공자·네트워크 연결 없음",
    present: "여행 자격 공유", request: "여행 자격 공유", requestBody: "이 흐름은 예/아니오로 답하는 최소 조건 하나만 요청하며 재사용 식별자는 공유하지 않습니다.",
    presentConsent: "이번 요청에만 동의할까요?", presentConsentBody: "승인은 한 번만 적용됩니다. 항상 허용은 없고 거절해도 자격증명은 바뀌지 않습니다.",
    presentationRequester: "ONDO 테이블", presentationPurpose: "이번 한 번의 요청을 위한 최소 여행 자격 확인",
    presentationEvidence: "K-Tour 여행 자격 · 예/아니오만", presentationRetention: "이번 요청에만 사용 · 자동 만료 · 결과 저장 안 함",
    presentationPredicate: "K-Tour 여행 자격 · 예/아니오만", presentationPredicateRetention: "한 번의 요청 · 결과 저장 안 함",
    credentialReadyEyebrow: "준비 완료 · 이 탭", presentationRequestEyebrow: "여행 자격 확인",
    presentationResultApproved: "한 번 승인됨", presentationResultNotApproved: "승인하지 않음", unchanged: "상태 변경 없음",
    approve: "한 번만 승인", deny: "거절", result: "공유 완료", resultBody: "예/아니오 결과만 표시합니다. 다시 쓸 수 있는 정보는 공유하거나 저장하지 않아요.",
    returnOnboarding: "게스트 설정으로 돌아가기", returnTraveler: "여행 패스로 돌아가기", backToKTourId: "K-Tour ID로 돌아가기",
    unavailable: "이 경로는 구성되지 않았어요", unavailableBody: "모바일 외국인등록증은 등록외국인을 위한 경로지만 연결된 제공자 프로필이 없습니다.",
    assurance: "여권 eKYC는 등록외국인 체류 자격을 확인하지 않으며 외국인등록증 확인과 동등하지 않습니다.", usePassport: "여권 eKYC로 대신 진행",
    failure: "이 단계를 완료하지 못했어요", failureBody: "증빙이나 자격증명을 만들지 않았습니다. 안전한 단계부터 다시 시도하거나 다른 경로를 고르세요.",
    expired: "설정 세션이 만료됐어요", expiredBody: "10분 설정 시간이 끝났습니다. 게스트 탐색은 유지한 채 새 경로를 시작하세요.", retry: "안전한 단계 다시 시도", another: "다른 경로 선택",
    expiredStatus: "이 로컬 자격증명은 만료됐습니다.", suspendedStatus: "이 로컬 자격증명은 정지됐습니다.", revokedStatus: "이 로컬 자격증명은 폐기됐습니다.",
    onDevice: "기기 내 처리", mobileEyebrow: "OmniOne CX · 모바일 신분증", faceEyebrow: "얼굴 + 라이브니스", evidenceEyebrow: "최소 결과", issuanceEyebrow: "OpenDID · 발급", holderEyebrow: "여행 패스", holderMeta: "이 탭에만 보관", issuerState: "이 탭",
    technicalTruth: "프로토콜 상세: OpenDID 발급과 holder 전달, DID·VC 원문 미생성, nonce·만료를 적용한 제시, VP 미보관. 자격증명 유형:",
    chooseStep: "선택", checkStep: "확인", issueStep: "발급", presentStep: "제시",
  },
  ja: {
    dialog: "任意のK-Tour ID設定", close: "K-Tour ID設定を閉じる", back: "前のステップ",
    env: "端末内",
    envDetail: "本人確認事業者やOpenDIDサービスには接続しません。",
    boundary: "民間のK-Tourサービス資格情報 · 公的身分証、ビザ、在留カード、在留許可、在留資格ではありません。",
    optional: "任意 · 設定なしでもゲスト利用可能", title: "民間のK-Tour IDを設定",
    lead: "該当する方法を自分で選びます。設定なしでも探せて、アカウント、本人、19歳以上、決済とは別です。",
    mobile: "韓国人向けモバイル身分証", mobileNote: "韓国籍の方 · OmniOne CX",
    residence: "モバイル在留カード", residenceNote: "外国人登録済みの居住者 · OmniOne CX",
    passport: "パスポートeKYC", passportNote: "短期旅行者 · 別のNFC / OCR、顔・ライブネス事業者", notConfigured: "未設定",
    separate: "パスポートeKYCはOmniOne CXではなく別の事業者です。", review: "同意内容を確認", later: "今はしない — ゲスト利用を続ける",
    consentTitle: "依頼内容を確認", consentBody: "同意前には何も始まりません。自分で選んだ時だけファイル選択を開き、カメラ撮影、NFC、事業者接続は自動で始まりません。",
    requester: "依頼者", requesterValue: "ONDO K-Tour ID", purpose: "目的", purposeValue: "民間サービス資格情報のための最小限の旅行資格結果を作成",
    provider: "確認ルート", evidence: "依頼する証拠", retention: "保持", retentionValue: "選択画像は差し替え、削除、続行、終了までメモリ内だけにあり、文書、顔、事業者結果、資格情報は保存しない",
    accept: "同意して続ける", decline: "拒否して戻る", prepare: "ルートを準備", prepareBody: "端末内で手続きを進め、事業者依頼、署名コールバック、公的確認は作りません。", next: "続ける",
    cx: "モバイルIDを接続", cxBody: "接続環境ではMobile ID依頼を開き署名済みコールバックを検証します。ここでは端末外へ何も送信しません。",
    document: "パスポート画像を選択", documentBody: "選択画像1枚をこのタブ内で読み取りOCRの流れを進めます。パスポート情報は抽出・保持しません。",
    face: "顔・ライブネス", faceBody: "接続済み事業者は正規化した結果とリスクフラグだけを返します。ここではカメラに接続しません。",
    processing: "確認ルートを処理", processingBody: "この端末で正規化した応答を準備します。実際のレシート、コールバック、取引はありません。",
    evidenceTitle: "最小限の証拠を確認", evidenceBody: "選択ルートをこの端末で完了しました。氏名、文書番号、画像、生体情報、事業者トークンは表示しません。",
    issue: "OpenDIDで発行", issueBody: "OpenDIDは旅行資格の結果をトラベルパスへ渡し、必要なときに一度だけ提示できるよう管理します。パスポートと顔の確認は選択した確認方法で別に行います。",
    holder: "トラベルパスに追加", holderBody: "旅行資格の結果をこのタブに保ちます。外部ウォレットやファイルには保存しません。", holderLabel: "民間の旅行資格",
    ready: "K-Tour IDの準備完了", readyBody: "民間の旅行資格情報とローカルのトラベルウォレットをこのタブに用意しました。",
    walletReady: "トラベルウォレット準備完了", walletReadyNote: "端末内残高 · 事業者・ネットワーク未接続",
    present: "旅行資格を共有", request: "旅行資格を共有", requestBody: "この手続きでは可否で答える最小条件を一つだけ求め、再利用できる識別子は共有しません。",
    presentConsent: "今回だけ承認しますか？", presentConsentBody: "承認は一回だけです。「常に許可」はなく、拒否しても資格情報は変わりません。",
    presentationRequester: "ONDOテーブル", presentationPurpose: "今回一回の依頼に必要な最小限の旅行資格確認",
    presentationEvidence: "K-Tour旅行資格 · 可否のみ", presentationRetention: "今回の依頼だけに使用 · 自動で期限切れ · 結果は保存しない",
    presentationPredicate: "K-Tour旅行資格 · 可否のみ", presentationPredicateRetention: "一回の依頼 · 結果は保存しない",
    credentialReadyEyebrow: "準備完了 · このタブのみ", presentationRequestEyebrow: "旅行資格の確認",
    presentationResultApproved: "一回のみ承認", presentationResultNotApproved: "承認しない", unchanged: "状態変更なし",
    approve: "一回だけ承認", deny: "拒否", result: "共有完了", resultBody: "可否だけを表示します。再利用できる情報は共有・保存しません。",
    returnOnboarding: "ゲスト設定に戻る", returnTraveler: "トラベルパスに戻る", backToKTourId: "K-Tour IDに戻る",
    unavailable: "このルートは未設定です", unavailableBody: "Mobile Residence Cardは外国人登録済み居住者向けですが、接続済みの事業者設定はありません。",
    assurance: "パスポートeKYCは登録居住者の在留資格を確認せず、在留カード確認と同等ではありません。", usePassport: "パスポートeKYCを利用",
    failure: "この手順を完了できませんでした", failureBody: "証拠や資格情報は作成していません。安全な段階から再試行するか別の方法を選べます。",
    expired: "設定セッションが期限切れです", expiredBody: "10分の設定時間が終了しました。ゲスト利用を失わず新しい方法を始められます。", retry: "安全な段階を再試行", another: "別の方法を選ぶ",
    expiredStatus: "このローカル資格情報は期限切れです。", suspendedStatus: "このローカル資格情報は停止中です。", revokedStatus: "このローカル資格情報は失効済みです。",
    onDevice: "端末内処理", mobileEyebrow: "OmniOne CX · モバイルID", faceEyebrow: "顔 + ライブネス", evidenceEyebrow: "最小結果", issuanceEyebrow: "OpenDID · 発行", holderEyebrow: "トラベルパス", holderMeta: "このタブのみ", issuerState: "このタブ",
    technicalTruth: "プロトコル詳細: OpenDIDによる発行とholder配信、DID・VC本文は未作成、nonceと有効期限を使う提示、VPは未保存。資格情報タイプ:",
    chooseStep: "選択", checkStep: "確認", issueStep: "発行", presentStep: "提示",
  },
} satisfies Record<OndoBLocale, Record<string, string>>

const FOCUSABLE = "button:not([disabled]),input:not([disabled]):not([tabindex='-1']),summary,[href],[tabindex]:not([tabindex='-1'])"
const ISSUER = "ONDO K-Tour ID"
const CREDENTIAL_TYPE = "KTourVisitorCredential"

function methodDetails(method: OndoBIdentityMethod, copy: typeof COPY.en) {
  if (method === "mobile_id") return { title: copy.mobile, note: copy.mobileNote, provider: "OmniOne CX", evidence: copy.mobile }
  if (method === "mobile_residence_card") return { title: copy.residence, note: copy.residenceNote, provider: "OmniOne CX", evidence: copy.residence }
  return { title: copy.passport, note: copy.passportNote, provider: `${copy.separate} · ${copy.notConfigured}`, evidence: copy.passportNote }
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
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    return () => {
      window.requestAnimationFrame(() => {
        if (opener?.isConnected && !opener.closest("[inert],[aria-hidden='true']")) opener.focus({ preventScroll: true })
      })
    }
  }, [active, origin])

  useEffect(() => {
    if (!active) return
    setMethod(state.identityCredential?.method ?? "passport_ekyc")
    setPhase(state.identityCredential ? "credential_ready" : "method_select")
    setSession(null); setRecoveryCode(null); setPresentationApproved(null)
    issuedOnceRef.current = Boolean(state.identityCredential)
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
    actions.setCommerceWalletStatus("ready")
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
        <p role="note" data-testid="k-tour-id-environment" aria-label={`${copy.env} · ${copy.envDetail}`}><i aria-hidden="true" /><span aria-hidden="true">{copy.env}</span></p>
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
      {phase === "cx_handoff_preview" ? <Panel testId="k-tour-id-route-step" aliases={["ktour-id-mobile-handoff"]} icon={<Smartphone />} eyebrow={copy.mobileEyebrow} title={copy.cx} body={copy.cxBody} action={copy.next} onAction={() => advance("provider_processing_preview", "cx_handoff_preview")} visual="phone" /> : null}
      {phase === "document_preview" ? <div className={styles.body}><PassportOcrStepB locale={state.locale} onComplete={() => advance("face_liveness_preview", "document_preview")} /></div> : null}
      {phase === "face_liveness_preview" ? <Panel testId="k-tour-id-passport-face" aliases={["ktour-id-passport-face", "k-tour-id-route-step"]} icon={<ScanFace />} eyebrow={copy.faceEyebrow} title={copy.face} body={copy.faceBody} action={copy.next} onAction={() => advance("provider_processing_preview", "face_liveness_preview")} visual="face" /> : null}
      {phase === "provider_processing_preview" ? <Panel testId="k-tour-id-route-step" icon={<RefreshCw />} eyebrow={`${details.provider} · ${copy.onDevice}`} title={copy.processing} body={copy.processingBody} action={copy.next} onAction={() => advance("evidence_preview", "provider_processing_preview")} visual="processing" /> : null}
      {phase === "evidence_preview" ? <Panel testId="k-tour-id-evidence-preview" icon={<FileCheck2 />} eyebrow={copy.evidenceEyebrow} title={copy.evidenceTitle} body={copy.evidenceBody} action={copy.next} onAction={() => advance("issuance_preview", "evidence_preview")} visual="evidence" /> : null}
      {phase === "issuance_preview" ? <Panel testId="k-tour-id-issuance-preview" aliases={["ktour-id-opendid-issue"]} icon={<FileKey2 />} eyebrow={copy.issuanceEyebrow} title={copy.issue} body={copy.issueBody} action={copy.next} onAction={() => advance("holder_delivery_preview", "issuance_preview")} meta={[ISSUER, copy.holderLabel]} /> : null}
      {phase === "holder_delivery_preview" ? <Panel testId="k-tour-id-holder-delivery" icon={<WalletCards />} eyebrow={copy.holderEyebrow} title={copy.holder} body={copy.holderBody} action={copy.next} onAction={finishHolder} meta={[copy.holderLabel, copy.holderMeta]} /> : null}

      {phase === "credential_ready" ? <div className={`${styles.body} ${styles.centered}`} data-testid="k-tour-id-credential" data-status={credentialStatus} data-code={statusMessage ? `CREDENTIAL_${credentialStatus.toUpperCase()}` : undefined} data-issuance-count={issuedOnceRef.current ? 1 : 0} data-wallet-provisioning="aa-assumed-local"><span data-testid="ktour-id-result" className={styles.heroIcon}><BadgeCheck size={31} aria-hidden="true" /></span><p className={styles.eyebrow}>{copy.credentialReadyEyebrow}</p><h1>{copy.ready}</h1><p className={styles.lead}>{copy.readyBody}</p><div className={styles.credential}><FileKey2 size={27} aria-hidden="true" /><span><strong>{copy.holderLabel}</strong><small>{ISSUER} · {copy.issuerState}</small></span></div><div className={styles.credential} data-testid="k-tour-id-wallet-ready"><WalletCards size={27} aria-hidden="true" /><span><strong>{copy.walletReady}</strong><small>{copy.walletReadyNote}</small></span></div>{statusMessage ? <p className={styles.statusWarning} role="alert">{statusMessage}</p> : null}<div className={styles.actions}><button type="button" data-testid="k-tour-id-presentation-open" disabled={Boolean(statusMessage)} className={styles.primary} onClick={() => setPhase("presentation_request")}>{copy.present}<ArrowRight size={17} aria-hidden="true" /></button><button type="button" data-identity-initial-focus data-testid="k-tour-id-return" className={styles.secondary} onClick={actions.closeIdentitySetup}>{returnLabel}</button></div></div> : null}

      {phase === "presentation_request" ? <div className={styles.body} data-testid="k-tour-id-presentation-request"><p className={styles.eyebrow}>{copy.presentationRequestEyebrow}</p><h1>{copy.request}</h1><p className={styles.lead}>{copy.requestBody}</p><Disclosure rows={[[copy.requester, copy.presentationRequester, "identity-presentation-requester"], [copy.purpose, copy.presentationPurpose, "identity-presentation-purpose"], [copy.evidence, copy.presentationEvidence, "identity-presentation-evidence"], [copy.retention, copy.presentationRetention, "identity-presentation-retention"]]} /><div className={styles.actions}><button type="button" data-testid="k-tour-id-continue" className={styles.primary} onClick={() => setPhase("presentation_consent")}>{copy.next}</button><button type="button" className={styles.secondary} onClick={() => setPhase("credential_ready")}>{copy.later}</button></div></div> : null}
      {phase === "presentation_consent" ? <div className={styles.body} data-testid="k-tour-id-presentation-consent"><p className={styles.eyebrow}>{copy.presentationRequester}</p><h1>{copy.presentConsent}</h1><p className={styles.lead}>{copy.presentConsentBody}</p><div className={styles.predicate} data-testid="identity-presentation-predicate"><ShieldCheck size={22} aria-hidden="true" /><span><strong>{copy.presentationPredicate}</strong><small>{copy.presentationPredicateRetention}</small></span></div><div className={styles.actions}><button type="button" data-testid="k-tour-id-presentation-approve" className={styles.primary} onClick={() => { const outcome = (window as QaWindow).__ONDO_B_QA__?.identity?.presentationOutcome; setPresentationApproved(outcome ? false : true); setRecoveryCode(outcome ?? null); setPhase("presentation_result") }}>{copy.approve}</button><button type="button" className={styles.secondary} onClick={() => { setPresentationApproved(false); setRecoveryCode("PRESENTATION_DENIED"); setPhase("presentation_result") }}>{copy.deny}</button></div></div> : null}
      {phase === "presentation_result" ? <div className={`${styles.body} ${styles.centered}`} data-testid="k-tour-id-presentation-result" data-result={recoveryCode === "PRESENTATION_REQUEST_EXPIRED" ? "expired" : recoveryCode === "PRESENTATION_REPLAY" ? "replay" : recoveryCode === "PRESENTATION_DENIED" ? "denied" : "success"} data-code={recoveryCode ?? undefined}><span className={styles.heroIcon}>{presentationApproved ? <BadgeCheck size={31} aria-hidden="true" /> : <X size={31} aria-hidden="true" />}</span><p className={styles.eyebrow} data-testid="identity-presentation-result-status">{presentationApproved ? copy.presentationResultApproved : copy.presentationResultNotApproved}</p><h1>{copy.result}</h1><p className={styles.lead}>{copy.resultBody}</p><div className={styles.credential} data-testid="k-tour-id-credential" data-status={credentialStatus} data-issuance-count={issuedOnceRef.current ? 1 : 0}><FileKey2 size={24} aria-hidden="true" /><span><strong>{copy.holderLabel}</strong><small data-testid="identity-presentation-credential-state">{ISSUER} · {copy.unchanged}</small></span></div><div className={styles.actions}><button type="button" data-testid="k-tour-id-result-back" className={styles.primary} onClick={() => setPhase("credential_ready")}>{copy.backToKTourId}</button><button type="button" data-testid="k-tour-id-return" className={styles.secondary} onClick={actions.closeIdentitySetup}>{returnLabel}</button></div></div> : null}

      {phase === "unavailable" ? <StatusPanel testId="k-tour-id-unavailable" alias="ktour-id-setup-unavailable" code="IDENTITY_METHOD_UNAVAILABLE" title={copy.unavailable} body={copy.unavailableBody} extra={copy.assurance} primary={copy.usePassport} onPrimary={() => { setMethod("passport_ekyc"); setPhase("consent") }} primaryTestId="k-tour-id-alternate-passport" secondary={copy.another} onSecondary={() => setPhase("method_select")} /> : null}
      {phase === "failed" ? <StatusPanel testId="k-tour-id-failure" alias="ktour-id-setup-failure" code={recoveryCode ?? "PROVIDER_TIMEOUT"} title={copy.failure} body={copy.failureBody} primary={copy.retry} onPrimary={() => { setRecoveryCode(null); setPhase(retryPhase) }} primaryTestId="k-tour-id-retry" secondary={copy.another} onSecondary={() => setPhase("method_select")} /> : null}
      {phase === "expired" ? <StatusPanel testId="k-tour-id-expired" alias="ktour-id-setup-expired" code="IDENTITY_SESSION_EXPIRED" title={copy.expired} body={copy.expiredBody} primary={copy.retry} onPrimary={() => { setSession(createIdentitySetupSessionB(origin, method)); setPhase("route_prepare") }} primaryTestId="k-tour-id-retry" secondary={copy.later} onSecondary={actions.closeIdentitySetup} /> : null}

      <p className={styles.privateBoundary} data-testid="k-tour-id-private-boundary"><ShieldCheck size={15} aria-hidden="true" />{copy.boundary}</p>
      <span className={styles.contractOnly} data-testid="k-tour-id-technical-truth">{copy.technicalTruth} {CREDENTIAL_TYPE}</span>
      <span className={styles.contractOnly} aria-hidden="true">{KTOUR_ID_RECOVERY_CODES.join(" ")}</span>
    </section>
  </div>
}

function Disclosure({ rows }: { rows: Array<[string, string, string?]> }) {
  return <dl className={styles.disclosure}>{rows.map(([term, value, testId]) => <div key={`${term}:${value}`} data-testid={testId}><dt>{term}</dt><dd>{value}</dd></div>)}</dl>
}

function Panel({ testId, aliases = [], icon, eyebrow, title, body, action, onAction, visual, meta }: { testId: string; aliases?: string[]; icon: ReactNode; eyebrow: string; title: string; body: string; action: string; onAction: () => void; visual?: "phone" | "face" | "processing" | "evidence"; meta?: [string, string] }) {
  return <div className={`${styles.body} ${styles.centered}`} data-testid={testId}><span data-testid={aliases[0]} className={styles.heroIcon}><span data-testid={aliases[1]}>{icon}</span></span><p className={styles.eyebrow}>{eyebrow}</p><h1>{title}</h1><p className={styles.lead}>{body}</p>{visual ? <div className={styles.visual} data-visual={visual} aria-hidden="true">{visual === "face" ? <><Camera /><ScanFace /></> : visual === "phone" ? <><Smartphone /><BadgeCheck /></> : visual === "processing" ? <><RefreshCw /><i /></> : <><FileCheck2 /><Check /></>}</div> : null}{meta ? <div className={styles.meta}><strong>{meta[0]}</strong><span>{meta[1]}</span></div> : null}<div className={styles.actions}><button type="button" data-identity-initial-focus data-testid="k-tour-id-continue" className={styles.primary} onClick={onAction}>{action}<ArrowRight size={17} aria-hidden="true" /></button></div></div>
}

function StatusPanel({ testId, alias, code, title, body, extra, primary, onPrimary, primaryTestId, secondary, onSecondary }: { testId: string; alias: string; code: string; title: string; body: string; extra?: string; primary: string; onPrimary: () => void; primaryTestId?: string; secondary: string; onSecondary: () => void }) {
  return <div className={`${styles.body} ${styles.centered}`} data-testid={testId} data-code={code} role="alert"><span data-testid={alias} className={styles.issueIcon}><TriangleAlert size={30} aria-hidden="true" /></span><p className={styles.errorCode}>{code}</p><h1>{title}</h1><p className={styles.lead}>{body}</p>{extra ? <p className={styles.assurance}>{extra}</p> : null}<div className={styles.actions}><button type="button" data-identity-initial-focus data-testid={primaryTestId} className={styles.primary} onClick={onPrimary}><RefreshCw size={17} aria-hidden="true" />{primary}</button><button type="button" className={styles.secondary} onClick={onSecondary}>{secondary}</button></div></div>
}
