"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import qrcode from "qrcode-generator"
import { Camera, Landmark, Smartphone } from "lucide-react"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import type { PartnerRequestViewB } from "./integration-demo-model-b"
import styles from "./integration-demo-b.module.css"

const words = (locale: OndoBLocale) => (en: string, ko: string, ja: string) => locale === "ko" ? ko : locale === "ja" ? ja : en

export function PartnerDeviceSetupB({ locale, onReady }: { locale: OndoBLocale; onReady(): void }) {
  const w = words(locale)
  const [step, setStep] = useState<"sign_in" | "device">("sign_in")
  const [consent, setConsent] = useState(false)
  return <section className={styles.card} data-testid="partner-device-setup" data-step={step}>
    <Landmark size={28} aria-hidden="true" />
    <small>{w("Partner workspace · demo", "파트너 작업 공간 · 데모", "パートナー画面・デモ")}</small>
    <h2>{step === "sign_in" ? w("Welcome to the counter", "매장 카운터에서 시작해요", "店舗カウンターから始めましょう") : w("Prepare this counter", "이 기기를 확인에 사용해요", "この端末を確認に使用")}</h2>
    <p>{w("Use the prepared K-Tour ID sample café account. No real sign-in or device registration takes place.", "준비된 K-Tour ID 샘플 카페 계정을 사용해요. 실제 로그인이나 기기 등록은 하지 않아요.", "用意されたK-Tour ID サンプルカフェのアカウントを使います。実際のログインや端末登録は行いません。")}</p>
    {step === "sign_in" ? <button className={styles.primary} data-testid="partner-sample-sign-in" onClick={() => setStep("device")}>{w("Enter sample workspace", "샘플 작업 공간 열기", "サンプル画面を開く")}</button> : <>
      <label className={styles.deviceConsent}><input type="checkbox" data-testid="partner-device-consent" checked={consent} onChange={event => setConsent(event.target.checked)} /><span>{w("Use this browser as the sample café counter. Only the requested eligibility result will be shown.", "이 브라우저를 샘플 카페 카운터로 사용합니다. 요청한 자격 결과만 표시돼요.", "このブラウザーをサンプルカフェの端末として使います。要求した資格結果のみを表示します。")}</span></label>
      <button className={styles.primary} disabled={!consent} data-testid="partner-device-ready" onClick={onReady}>{w("Prepare sample counter", "샘플 카운터 준비", "サンプル端末を準備")}</button>
      <button className={styles.secondary} onClick={() => { setStep("sign_in"); setConsent(false) }}>{w("Go back", "뒤로", "戻る")}</button>
    </>}
  </section>
}

/** Encodes only an opaque sample request reference, never a credential/claim.
 * This is intentionally not a public verification URL or a real camera SDK. */
export function PartnerRequestHandoffB({ request, locale, onOpen, onCancel }: {
  request: PartnerRequestViewB; locale: OndoBLocale; onOpen(): void; onCancel(): void
}) {
  const w = words(locale)
  const [view, setView] = useState<"counter" | "permission" | "scan" | "denied">("counter")
  const heading = useRef<HTMLHeadingElement>(null)
  const consumed = useRef(false)
  useEffect(() => { if (view !== "counter") heading.current?.focus() }, [view])
  const qr = useMemo(() => {
    const code = qrcode(0, "M")
    code.addData("ondo-demo:" + request.requestRef, "Byte"); code.make()
    const size = code.getModuleCount()
    let path = ""
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (code.isDark(y, x)) path += `M${x + 4},${y + 4}h1v1h-1z`
    return { size: size + 8, path }
  }, [request.requestRef])
  const open = () => { if (!consumed.current) { consumed.current = true; onOpen() } }
  return <section className={styles.handoff} data-testid="partner-request-handoff" data-view={view} data-request-ref={request.requestRef}>
    <small>{view === "counter" ? w("Café counter", "매장 화면", "店舗画面") : w("Visitor phone · demo", "방문자 휴대폰 · 데모", "旅行者のスマートフォン・デモ")}</small>
    <h3 ref={heading} tabIndex={-1}>{view === "counter" ? w("One request. Just the result.", "한 번의 요청, 필요한 결과만.", "1回のリクエスト。必要な結果だけ。") : view === "denied" ? w("Camera access declined", "카메라 사용을 취소했어요", "カメラへのアクセスを拒否") : view === "permission" ? w("Try the scanner", "스캔을 체험해요", "スキャンを体験") : w("Scan the sample request", "샘플 요청을 스캔해요", "サンプルリクエストをスキャン")}</h3>
    <p>{w("A same-browser rehearsal. This QR contains a sample request reference, not an identity credential or a live verification link.", "같은 브라우저에서 체험하는 예시예요. QR에는 샘플 요청 번호만 있으며, 신분증 정보나 실제 인증 링크는 없어요.", "同じブラウザーでの体験です。QRにはサンプルのリクエスト番号のみが含まれ、身分証や実際の認証リンクではありません。")}</p>
    {view === "counter" || view === "scan" ? <div className={styles.qrFrame}><svg data-testid="partner-sample-qr" role="img" aria-label={w("QR for this sample request", "현재 샘플 요청 QR", "このサンプルリクエストのQR")} viewBox={`0 0 ${qr.size} ${qr.size}`} shapeRendering="crispEdges"><rect width={qr.size} height={qr.size} fill="#fff" /><path d={qr.path} fill="#171717" /></svg></div> : <Camera size={36} aria-hidden="true" />}
    {view === "counter" ? <>
      <button className={styles.primary} data-testid="integration-holder-open" onClick={() => setView("permission")}><Smartphone size={18} aria-hidden="true" />{w("Try on visitor phone", "방문자 화면으로 체험", "旅行者画面で試す")}</button>
      <button className={styles.secondary} data-testid="partner-demo-deeplink" onClick={open}>{w("Open request on this device", "이 기기에서 요청 열기", "この端末でリクエストを開く")}</button>
    </> : view === "permission" ? <>
      <p>{w("No camera is opened. Choose a sample permission response.", "실제 카메라는 켜지지 않아요. 권한 응답을 선택해 주세요.", "実際のカメラは起動しません。権限のサンプル応答を選んでください。")}</p>
      <button className={styles.primary} data-testid="partner-camera-allow" onClick={() => setView("scan")}>{w("Allow sample scanner", "샘플 스캔 허용", "サンプルスキャンを許可")}</button>
      <button className={styles.secondary} data-testid="partner-camera-deny" onClick={() => setView("denied")}>{w("Not now", "지금은 안 할게요", "今はしない")}</button>
    </> : view === "scan" ? <button className={styles.primary} data-testid="partner-qr-scan" onClick={open}>{w("Use this sample request", "이 샘플 요청 확인", "このサンプルを確認")}</button>
      : <button className={styles.primary} data-testid="partner-camera-retry" onClick={() => setView("permission")}>{w("Try permission again", "권한 확인 다시 하기", "権限の確認を再試行")}</button>}
    {view !== "counter" ? <button className={styles.secondary} data-testid="partner-return-counter" onClick={() => setView("counter")}>{w("Return to the same request", "같은 요청으로 돌아가기", "同じリクエストに戻る")}</button> : null}
    <button className={styles.secondary} data-testid="partner-request-cancel" onClick={onCancel}>{w("Cancel request", "요청 취소", "リクエストをキャンセル")}</button>
  </section>
}
