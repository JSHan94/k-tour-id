"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowRight, ScanFace } from "lucide-react"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import styles from "./passport-ocr-step-b.module.css"

const COPY = {
  en: { title: "Try a face check", body: "Use the illustrated sample to rehearse positioning and liveness. Your camera stays off.", start: "Allow sample face step", capture: "Center the sample face", captureBody: "Imagine looking straight ahead, then slowly turning your head. No face image or movement is recorded.", action: "Simulate head turn", review: "Sample face check complete", reviewBody: "Prepared response only. This does not verify a real person.", deny: "Try permission denied", denied: "Sample permission denied", deniedBody: "Nothing was captured. Retry when you are ready.", retry: "Try sample again", continue: "Continue" },
  ko: { title: "얼굴 확인을 체험해요", body: "일러스트 샘플로 얼굴 위치와 실재성 확인을 체험해요. 카메라는 켜지지 않아요.", start: "샘플 얼굴 단계 허용", capture: "샘플 얼굴을 가운데 맞춰요", captureBody: "정면을 바라본 뒤 천천히 고개를 돌리는 단계예요. 얼굴 이미지나 움직임을 기록하지 않아요.", action: "고개 돌리기 체험", review: "샘플 얼굴 확인 완료", reviewBody: "준비된 응답일 뿐 실제 사람을 확인한 결과가 아니에요.", deny: "권한 거절 체험", denied: "샘플 권한을 거절했어요", deniedBody: "촬영된 내용은 없어요. 준비되면 다시 시도하세요.", retry: "샘플 다시 시도", continue: "계속" },
  ja: { title: "顔の確認を体験", body: "イラストのサンプルで位置合わせと実在性確認を体験します。カメラは起動しません。", start: "サンプルの顔確認を許可", capture: "サンプルの顔を中央に合わせる", captureBody: "正面を向いて、ゆっくり顔を動かす手順です。顔の画像や動きは記録しません。", action: "顔を動かす手順を体験", review: "サンプルの顔確認が完了", reviewBody: "用意された応答であり、実際の人物を確認した結果ではありません。", deny: "許可の拒否を体験", denied: "サンプルの許可を拒否しました", deniedBody: "撮影された内容はありません。準備ができたら再試行してください。", retry: "サンプルを再試行", continue: "続ける" },
} as const

export function PassportFaceStepB({ locale, reviewMode, onComplete }: { locale: OndoBLocale; reviewMode: boolean; onComplete: () => void }) {
  const copy = COPY[locale]
  const [stage, setStage] = useState<"permission" | "capture" | "review" | "denied">("permission")
  const actionRef = useRef<HTMLButtonElement>(null)
  const completedRef = useRef(false)
  useEffect(() => { actionRef.current?.focus({ preventScroll: true }) }, [stage])
  function proceed() {
    if (!reviewMode || completedRef.current) return
    if (stage === "permission") setStage("capture")
    else if (stage === "denied") setStage("permission")
    else if (stage === "capture") setStage("review")
    else { completedRef.current = true; onComplete() }
  }
  return <div className={styles.root} data-testid="k-tour-id-passport-face" data-face-stage={stage} data-sample-only="true">
    <span className={styles.heroIcon} data-testid="ktour-id-passport-face"><ScanFace aria-hidden="true" /></span><span data-testid="k-tour-id-route-step" />
    <h1>{stage === "permission" ? copy.title : stage === "capture" ? copy.capture : stage === "denied" ? copy.denied : copy.review}</h1><p className={styles.lead} role="status">{stage === "permission" ? copy.body : stage === "capture" ? copy.captureBody : stage === "denied" ? copy.deniedBody : copy.reviewBody}</p>
    {stage === "capture" ? <div className={styles.faceSample} aria-hidden="true"><ScanFace /></div> : null}
    <div className={styles.actions}><button ref={actionRef} type="button" data-identity-initial-focus data-testid="k-tour-id-continue" className={styles.primary} disabled={!reviewMode} onClick={proceed}>{stage === "permission" ? copy.start : stage === "capture" ? copy.action : stage === "denied" ? copy.retry : copy.continue}<ArrowRight aria-hidden="true" /></button>
      {stage === "permission" ? <button type="button" data-testid="passport-face-deny" className={styles.secondary} onClick={() => setStage("denied")}>{copy.deny}</button> : null}
      {stage === "review" ? <button type="button" data-testid="passport-face-retry" className={styles.secondary} onClick={() => setStage("capture")}>{copy.retry}</button> : null}
    </div>
  </div>
}
