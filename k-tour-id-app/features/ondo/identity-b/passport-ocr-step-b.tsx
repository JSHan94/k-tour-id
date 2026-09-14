"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowRight, BookOpenCheck, Camera, Check, ShieldCheck, Smartphone } from "lucide-react"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import styles from "./passport-ocr-step-b.module.css"

type PassportReviewStage = "sample" | "permission" | "denied" | "capture" | "checking" | "review"

const DEMO_COPY = {
  en: { permission: "Try the camera permission step", permissionBody: "Demo prompt only. No device permission is requested and your camera stays off.", allow: "Allow sample camera step", deny: "Try permission denied", denied: "Sample permission denied", deniedBody: "Nothing was captured. Retry when ready, or go back to your method.", retry: "Try sample again", capture: "Frame the sample page", captureBody: "Check that all four corners of the redacted page are inside the frame.", captureAction: "Capture redacted sample", retake: "Retake sample", nfc: "Try the NFC chip step", nfcBody: "Imagine holding the passport against the back of a phone. Use the prepared chip response; no NFC hardware is accessed.", read: "Read sample chip" },
  ko: { permission: "카메라 권한 단계를 체험해요", permissionBody: "데모 안내예요. 기기 권한을 요청하지 않고 카메라도 켜지지 않아요.", allow: "샘플 카메라 단계 허용", deny: "권한 거절 체험", denied: "샘플 권한을 거절했어요", deniedBody: "촬영된 내용은 없어요. 준비되면 다시 시도하거나 확인 방법으로 돌아가세요.", retry: "샘플 다시 시도", capture: "샘플 여권 면을 맞춰요", captureBody: "가림 처리된 페이지의 네 모서리가 프레임 안에 있는지 확인하세요.", captureAction: "가림 처리 샘플 촬영", retake: "샘플 다시 촬영", nfc: "NFC 칩 단계를 체험해요", nfcBody: "휴대폰 뒷면에 여권을 대는 단계를 상상해 보세요. 준비된 칩 응답만 사용하며 NFC 기기에 접근하지 않아요.", read: "샘플 칩 읽기" },
  ja: { permission: "カメラ許可の手順を体験", permissionBody: "デモの案内です。端末の許可は求めず、カメラも起動しません。", allow: "サンプルカメラ手順を許可", deny: "許可の拒否を体験", denied: "サンプルの許可を拒否しました", deniedBody: "撮影された内容はありません。再試行するか、確認方法に戻れます。", retry: "サンプルを再試行", capture: "サンプルのページを合わせる", captureBody: "マスキング済みページの四隅が枠内にあることを確認してください。", captureAction: "マスキング済みサンプルを撮影", retake: "サンプルを撮り直す", nfc: "NFCチップの手順を体験", nfcBody: "スマートフォンの背面にパスポートを当てる手順です。用意されたチップ応答のみを使い、NFC機器にはアクセスしません。", read: "サンプルチップを読む" },
} as const

const COPY = {
  en: {
    eyebrow: "PASSPORT", title: "Check the passport page", lead: "Use the redacted sample for this review.",
    sample: "Redacted review sample", sampleAlt: "Redacted passport sample with no personal information", start: "Check sample",
    checking: "Checking the sample…", reviewTitle: "Sample check complete", reviewLead: "Continue to the face check.",
    reviewTruth: "Review result · no external service confirmation", privacy: "No photo or personal details are collected.",
    privacyDetails: "Review details", technicalPrivacy: "This review uses a bundled redacted sample across the OCR, NFC and face/liveness connector boundaries. Camera and file upload stay unavailable until a passport-check service is connected.",
    continue: "Continue", unavailableTitle: "Passport check is unavailable", unavailableLead: "Choose another method or return to your trip.",
  },
  ko: {
    eyebrow: "여권", title: "여권 면을 확인해요", lead: "검토용 가림 처리 샘플을 사용합니다.",
    sample: "가림 처리된 검토 샘플", sampleAlt: "개인정보가 없는 가림 처리 여권 샘플", start: "샘플 확인",
    checking: "샘플 확인 중…", reviewTitle: "샘플 확인 완료", reviewLead: "얼굴 확인으로 계속하세요.",
    reviewTruth: "검토용 결과 · 외부 서비스 확인 없음", privacy: "사진이나 개인정보를 수집하지 않아요.",
    privacyDetails: "검토 상세", technicalPrivacy: "이 검토는 OCR·NFC·얼굴/라이브니스 연결 경계 전반에서 앱에 포함된 가림 처리 샘플만 사용합니다. 여권 확인 서비스가 연결되기 전에는 카메라와 파일 업로드를 제공하지 않습니다.",
    continue: "계속", unavailableTitle: "여권 확인을 이용할 수 없어요", unavailableLead: "다른 방법을 선택하거나 여행으로 돌아가세요.",
  },
  ja: {
    eyebrow: "パスポート", title: "パスポート面を確認", lead: "検証用のマスキング済みサンプルを使います。",
    sample: "マスキング済み検証サンプル", sampleAlt: "個人情報を含まないマスキング済みパスポートサンプル", start: "サンプルを確認",
    checking: "サンプルを確認中…", reviewTitle: "サンプル確認完了", reviewLead: "顔の確認へ進んでください。",
    reviewTruth: "検証用の結果・外部サービスによる確認なし", privacy: "写真や個人情報は収集しません。",
    privacyDetails: "検証の詳細", technicalPrivacy: "この検証ではOCR・NFC・顔/ライブネス連携の境界全体で、アプリ内のマスキング済みサンプルだけを使います。パスポート確認サービスが接続されるまで、カメラとファイルアップロードは利用できません。",
    continue: "続ける", unavailableTitle: "パスポート確認は利用できません", unavailableLead: "別の方法を選ぶか、旅行に戻れます。",
  },
} as const satisfies Record<OndoBLocale, Record<string, string>>

export function PassportOcrStepB({ locale, reviewMode, onComplete }: { locale: OndoBLocale; reviewMode: boolean; onComplete: () => void }) {
  const copy = COPY[locale]
  const demo = DEMO_COPY[locale]
  const [stage, setStage] = useState<PassportReviewStage>("sample")
  const actionRef = useRef<HTMLButtonElement>(null)
  const completedRef = useRef(false)

  useEffect(() => { actionRef.current?.focus({ preventScroll: true }) }, [stage])
  function complete() {
    if (!reviewMode || stage !== "review" || completedRef.current) return
    completedRef.current = true
    onComplete()
  }

  if (!reviewMode) return <div className={styles.root} data-testid="k-tour-id-passport-document" data-ocr-stage="unavailable">
    <span data-testid="ktour-id-passport-document" className={styles.heroIcon}><BookOpenCheck aria-hidden="true" /></span>
    <p className={styles.eyebrow}>{copy.eyebrow}</p><h1>{copy.unavailableTitle}</h1><p className={styles.lead}>{copy.unavailableLead}</p>
    <p className={styles.live} data-testid="passport-ocr-status" role="status">{copy.unavailableTitle}</p>
  </div>

  return <div className={styles.root} data-testid="k-tour-id-passport-document" data-ocr-stage={stage} data-review-stage={stage === "review" ? "ocr-nfc-complete" : stage === "checking" ? "sample-check" : "ocr-nfc"} data-review-fixture="redacted-passport" data-sample-only="true">
    <span data-testid="ktour-id-passport-document" className={styles.heroIcon}>{stage === "review" ? <Check aria-hidden="true" /> : <BookOpenCheck aria-hidden="true" />}</span>
    <p className={styles.eyebrow}>{copy.eyebrow}</p>
    {stage === "sample" ? <>
      <h1>{copy.title}</h1><p className={styles.lead}>{copy.lead}</p>
      <div className={styles.sample} data-testid="passport-ocr-preview" role="img" aria-label={copy.sampleAlt}><BookOpenCheck aria-hidden="true" /><span><i /><i /><i /></span><strong>{copy.sample}</strong></div>
      <p className={styles.truth}><ShieldCheck aria-hidden="true" />{copy.privacy}</p>
      <div className={styles.actions}><button ref={actionRef} type="button" data-identity-initial-focus data-testid="passport-ocr-start" className={styles.primary} onClick={() => setStage("permission")}>{copy.start}<ArrowRight aria-hidden="true" /></button></div>
    </> : null}
    {stage === "permission" ? <><h1>{demo.permission}</h1><p className={styles.lead}>{demo.permissionBody}</p><div className={styles.actions}><button ref={actionRef} type="button" data-identity-initial-focus data-testid="passport-demo-permission-allow" className={styles.primary} onClick={() => setStage("capture")}>{demo.allow}</button><button type="button" className={styles.secondary} data-testid="passport-demo-permission-deny" onClick={() => setStage("denied")}>{demo.deny}</button></div></> : null}
    {stage === "denied" ? <><h1>{demo.denied}</h1><p className={styles.lead}>{demo.deniedBody}</p><div className={styles.actions}><button ref={actionRef} type="button" data-identity-initial-focus data-testid="passport-demo-retry" className={styles.primary} onClick={() => setStage("permission")}>{demo.retry}</button></div></> : null}
    {stage === "capture" ? <><h1>{demo.capture}</h1><p className={styles.lead}>{demo.captureBody}</p><div className={styles.sample} data-testid="passport-ocr-preview" data-capture-frame="true" role="img" aria-label={copy.sampleAlt}><BookOpenCheck aria-hidden="true" /><span><i /><i /><i /></span><strong>{copy.sample}</strong></div><div className={styles.actions}><button ref={actionRef} type="button" data-identity-initial-focus data-testid="passport-demo-capture" className={styles.primary} onClick={() => setStage("checking")}><Camera aria-hidden="true" />{demo.captureAction}</button></div></> : null}
    {stage === "checking" ? <><h1 data-testid="passport-ocr-processing-title">{demo.nfc}</h1><p className={styles.lead}>{demo.nfcBody}</p><div className={styles.checking} data-testid="passport-ocr-processing" aria-hidden="true"><BookOpenCheck /><Smartphone /></div><div className={styles.actions}><button ref={actionRef} type="button" data-identity-initial-focus data-testid="passport-demo-nfc-read" className={styles.primary} onClick={() => setStage("review")}>{demo.read}<ArrowRight aria-hidden="true" /></button><button type="button" className={styles.secondary} data-testid="passport-demo-retake" onClick={() => setStage("capture")}>{demo.retake}</button></div></> : null}
    {stage === "review" ? <>
      <h1>{copy.reviewTitle}</h1><p className={styles.lead}>{copy.reviewLead}</p>
      <p className={styles.reviewTruth} data-testid="passport-ocr-review"><ShieldCheck aria-hidden="true" />{copy.reviewTruth}</p>
      <div className={styles.actions}><button ref={actionRef} type="button" data-identity-initial-focus data-testid="k-tour-id-continue" className={styles.primary} onClick={complete}>{copy.continue}<ArrowRight aria-hidden="true" /></button><button type="button" className={styles.secondary} data-testid="passport-demo-retake" onClick={() => setStage("capture")}>{demo.retake}</button></div>
    </> : null}
    {stage !== "checking" ? <details className={styles.details}><summary>{copy.privacyDetails}</summary><p>{copy.technicalPrivacy}</p></details> : null}
    <p className={styles.live} data-testid="passport-ocr-status" role="status" aria-live="polite" aria-atomic="true">{stage === "sample" ? copy.lead : stage === "permission" ? demo.permission : stage === "denied" ? demo.denied : stage === "capture" ? demo.capture : stage === "checking" ? demo.nfc : copy.reviewTitle}</p>
  </div>
}
