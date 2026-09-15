"use client"

import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useRef, useState } from "react"
import { ArrowRight, Check, Clock3, ShieldCheck, TriangleAlert } from "lucide-react"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import { readSumsubPassportSnapshot as snapshotFrom, resolveSumsubStatusFailure, type SumsubPassportSnapshot as Snapshot, type SumsubPassportStatus as Status } from "./sumsub-passport-status-b"
import styles from "./sumsub-passport-step-b.module.css"

export const SUMSUB_PASSPORT_DISCLOSURE = {
  en: { scope: "Sandbox · identity check only", purpose: "Test the passport verification flow", evidence: "Passport and selfie / liveness", provider: "Sumsub Sandbox", retention: "Use test materials only. Documents and selfies may be sent to Sumsub Sandbox. K-Tour ID does not store the original images. Closing this screen does not delete data already sent to the provider.", boundary: "This is a Sandbox identity check, not a verified K-Tour ID. No pass is issued and age, residency, payments and benefits stay unchanged.", returnStep: "Return" },
  ko: { scope: "Sandbox · 신원 확인 테스트", purpose: "여권 신원 확인 흐름 테스트", evidence: "여권과 셀피·실재성 확인", provider: "Sumsub Sandbox", retention: "테스트 자료만 사용하세요. 문서와 셀피가 Sumsub Sandbox에 전송될 수 있어요. K-Tour ID는 원본 이미지를 저장하지 않아요. 화면을 닫아도 이미 제공자에게 전송된 자료는 삭제되지 않아요.", boundary: "Sandbox 신원 확인 테스트이며, 인증된 K-Tour ID가 아니에요. 패스는 발급되지 않고 나이·체류 자격·결제·혜택 권한은 바뀌지 않아요.", returnStep: "돌아가기" },
  ja: { scope: "Sandbox・本人確認テスト", purpose: "パスポート本人確認フローのテスト", evidence: "パスポートとセルフィー・実在性確認", provider: "Sumsub Sandbox", retention: "テスト資料のみ使用してください。書類やセルフィーがSumsub Sandboxに送信される場合があります。K-Tour IDは元画像を保存しません。画面を閉じても送信済みデータは事業者から削除されません。", boundary: "Sandboxの本人確認テストであり、認証済みK-Tour IDではありません。パスは発行されず、年齢・滞在資格・決済・特典の権限は変わりません。", returnStep: "戻る" },
} as const

const COPY = {
  en: { title: "Check your passport", lead: "Complete the steps below. Your test result is checked with the verification service.", accessTitle: "Enter the test access code", accessBody: "This preview is available to invited testers only.", accessLabel: "Test access code", start: "Start passport test", resume: "Continue passport test", checking: "Checking your test status…", starting: "Opening the secure check…", pending: "Your test is being reviewed", pendingBody: "You do not need to submit again. Keep this screen open or return later to check the result.", approved: "Identity test complete", approvedBody: "The verification service approved this Sandbox check. K-Tour ID issuance is a separate step and is not connected here.", retry: "One more step is needed", retryBody: "Open the check again to see what needs updating.", rejected: "This test was not approved", rejectedBody: "No pass was issued. Your trip and existing pass are unchanged.", expired: "This test session expired", expiredBody: "Start again when you’re ready. Existing trip details are unchanged.", unavailable: "Passport testing is not ready", unavailableBody: "The test connection is not configured or is temporarily unavailable. You can keep exploring.", error: "We couldn’t confirm the status", errorBody: "Check your connection and try again. Nothing has been marked as verified.", sdkError: "The check could not continue", sdkErrorBody: "If camera access was blocked, allow it in your browser’s site settings and reopen the check. You can also try your phone’s main browser.", codeError: "Check the test access code and try again.", cancelError: "We couldn’t confirm cancellation. The camera is closed. Try cancelling again; provider data is not deleted.", cancelling: "Closing the test session…", check: "Check status", tryAgain: "Try again", cancel: "Cancel test and return", cancelRetry: "Retry cancellation", back: "Return to my trip", privacy: "Test data & privacy", testOnly: "Sandbox · no pass issued", rateLimit: "Please wait a moment before trying again.", returnNote: "Closing the check does not delete materials already sent." },
  ko: { title: "여권을 확인해요", lead: "아래 안내에 따라 진행하세요. 결과는 신원 확인 서비스에 다시 확인해요.", accessTitle: "테스트 접속 코드를 입력해 주세요", accessBody: "초대받은 테스터만 사용할 수 있는 미리보기예요.", accessLabel: "테스트 접속 코드", start: "여권 확인 테스트 시작", resume: "여권 확인 이어하기", checking: "테스트 상태를 확인하고 있어요…", starting: "확인 화면을 열고 있어요…", pending: "테스트 결과를 검토 중이에요", pendingBody: "다시 제출할 필요는 없어요. 화면을 열어 두거나 나중에 돌아와 결과를 확인해 주세요.", approved: "신원 확인 테스트 완료", approvedBody: "신원 확인 서비스에서 Sandbox 테스트가 승인됐어요. K-Tour ID 발급은 별도 단계이며 아직 연결되지 않았어요.", retry: "한 번 더 확인이 필요해요", retryBody: "확인 화면을 다시 열어 수정할 내용을 확인하세요.", rejected: "이번 테스트는 승인되지 않았어요", rejectedBody: "패스는 발급되지 않았어요. 여행과 기존 패스는 그대로예요.", expired: "테스트 세션이 만료됐어요", expiredBody: "준비되면 다시 시작하세요. 기존 여행 정보는 그대로예요.", unavailable: "여권 테스트를 준비 중이에요", unavailableBody: "테스트 연결 설정이 없거나 잠시 이용할 수 없어요. 지도 탐색은 계속할 수 있어요.", error: "상태를 확인하지 못했어요", errorBody: "연결 상태를 확인하고 다시 시도해 주세요. 인증 완료로 처리된 내용은 없어요.", sdkError: "확인을 계속하지 못했어요", sdkErrorBody: "카메라가 차단됐다면 브라우저의 사이트 설정에서 허용하고 다시 열어 주세요. 휴대폰의 기본 브라우저에서도 시도할 수 있어요.", codeError: "테스트 접속 코드를 확인하고 다시 입력해 주세요.", cancelError: "취소 여부를 확인하지 못했어요. 카메라는 닫았어요. 취소를 다시 시도해 주세요. 제공자에게 전송된 자료는 삭제되지 않아요.", cancelling: "테스트 세션을 닫고 있어요…", check: "진행 상태 확인", tryAgain: "다시 시도", cancel: "테스트 취소하고 돌아가기", cancelRetry: "취소 다시 시도", back: "여행으로 돌아가기", privacy: "테스트 자료와 개인정보", testOnly: "Sandbox · 패스 미발급", rateLimit: "잠시 기다린 뒤 다시 시도해 주세요.", returnNote: "확인을 닫아도 이미 전송한 자료는 삭제되지 않아요." },
  ja: { title: "パスポートを確認", lead: "以下の案内に沿って進めてください。結果は本人確認サービスに再確認します。", accessTitle: "テスト用アクセスコードを入力", accessBody: "招待されたテスターのみ利用できるプレビューです。", accessLabel: "テスト用アクセスコード", start: "パスポート確認テストを開始", resume: "パスポート確認を続ける", checking: "テスト状況を確認中…", starting: "確認画面を開いています…", pending: "テスト結果を審査中です", pendingBody: "再提出は不要です。この画面で待つか、後で戻って結果を確認してください。", approved: "本人確認テスト完了", approvedBody: "本人確認サービスでSandboxテストが承認されました。K-Tour IDの発行は別の手順で、ここでは接続されていません。", retry: "もう一度確認が必要です", retryBody: "確認画面を再度開き、修正が必要な内容を確認してください。", rejected: "今回のテストは承認されませんでした", rejectedBody: "パスは発行されていません。旅行と既存のパスは変わりません。", expired: "テストセッションの期限が切れました", expiredBody: "準備ができたら再開してください。旅行情報は変わりません。", unavailable: "パスポートテストの準備中です", unavailableBody: "テストの接続設定がないか、一時的に利用できません。地図の探索は続けられます。", error: "状況を確認できませんでした", errorBody: "接続を確認して再試行してください。認証完了として扱われたものはありません。", sdkError: "確認を続けられませんでした", sdkErrorBody: "カメラがブロックされた場合は、ブラウザのサイト設定で許可し、再度開いてください。端末の標準ブラウザでも試せます。", codeError: "テスト用アクセスコードを確認してください。", cancelError: "キャンセルを確認できませんでした。カメラは閉じています。もう一度お試しください。送信済みデータは削除されません。", cancelling: "テストセッションを閉じています…", check: "状況を確認", tryAgain: "再試行", cancel: "テストをキャンセルして戻る", cancelRetry: "キャンセルを再試行", back: "旅行に戻る", privacy: "テスト資料と個人情報", testOnly: "Sandbox・パス未発行", rateLimit: "少し待ってから再試行してください。", returnNote: "確認を閉じても送信済みの資料は削除されません。" },
} as const

const SESSION_COPY = {
  en: { cancel: "Close test and return", cancelRetry: "Retry closing", cancelError: "The camera is closed, but we couldn’t confirm that this browser session ended. Try again. This does not delete or cancel checks at the verification service.", pendingBody: "No need to submit again. Keep this screen open to check the result. Closing ends this browser session, not the service’s review.", autoPaused: "Automatic updates are paused. Use Check status to refresh the result." },
  ko: { cancel: "테스트 닫고 돌아가기", cancelRetry: "세션 종료 다시 시도", cancelError: "카메라는 닫았지만 브라우저 세션 종료를 확인하지 못했어요. 다시 시도해 주세요. 신원 확인 서비스의 심사나 자료를 취소·삭제하는 기능은 아니에요.", pendingBody: "다시 제출할 필요는 없어요. 이 화면에서 결과를 확인하세요. 화면을 닫으면 브라우저 세션만 종료되고 제공자의 검토는 취소되지 않아요.", autoPaused: "자동 확인을 잠시 멈췄어요. 진행 상태 확인을 눌러 결과를 확인하세요." },
  ja: { cancel: "テストを閉じて戻る", cancelRetry: "セッション終了を再試行", cancelError: "カメラは閉じましたが、ブラウザのセッション終了を確認できませんでした。再試行してください。本人確認サービスの審査やデータを取り消す機能ではありません。", pendingBody: "再提出は不要です。この画面で結果を確認してください。画面を閉じるとブラウザのセッションのみ終了し、事業者の審査は取り消されません。", autoPaused: "自動更新を一時停止しました。「状況を確認」で結果を更新できます。" },
} as const

type Issue = "connection" | "sdk" | "access" | "cancel" | "rate" | null
type SdkInstance = { destroy(): void }
const TERMINAL: readonly Status[] = ["approved", "rejected", "expired", "unavailable", "access_required"]

class RequestError extends Error {
  constructor(readonly status: number, readonly snapshot?: Snapshot, readonly code?: string) { super("SANDBOX_REQUEST_FAILED") }
}
class TransportError extends Error { constructor() { super("SANDBOX_CONNECTION_FAILED") } }

export type SumsubPassportStepHandle = { requestExit(): Promise<boolean> }

// This component deliberately has no credential/claim completion callback.
// Even a server-confirmed Sandbox approval cannot issue a VC or unlock a gate.
export const SumsubPassportStepB = forwardRef<SumsubPassportStepHandle, { locale: OndoBLocale; onReturn(): void }>(function SumsubPassportStepB({ locale, onReturn }, ref) {
  const copy = { ...COPY[locale], ...SESSION_COPY[locale] }
  const disclosure = SUMSUB_PASSPORT_DISCLOSURE[locale]
  const containerId = `sumsub-passport-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [issue, setIssue] = useState<Issue>(null)
  const [busy, setBusy] = useState<"checking" | "starting" | "cancelling" | null>("checking")
  const [sdkActive, setSdkActive] = useState(false)
  const [accessCode, setAccessCode] = useState("")
  const [autoPaused, setAutoPaused] = useState(false)
  const mounted = useRef(false)
  const epoch = useRef(0)
  const snapshotRef = useRef<Snapshot | null>(null)
  const sdk = useRef<SdkInstance | null>(null)
  const sdkBlocked = useRef(false)
  const controllers = useRef(new Set<AbortController>())
  const postControllers = useRef(new Set<AbortController>())
  const tokenRequest = useRef<Promise<Response> | null>(null)
  const statusBusy = useRef(false)
  const actionBusy = useRef(false)
  const exiting = useRef(false)
  const sessionStarted = useRef(false)
  const autoChecks = useRef(0)
  const autoDeadline = useRef(Date.now() + 10 * 60 * 1000)
  const lastAutoCheck = useRef(0)

  const destroySdk = useCallback(() => {
    try { sdk.current?.destroy() } catch { /* Provider cleanup must not trap the user in the sheet. */ } finally { sdk.current = null }
    if (mounted.current) setSdkActive(false)
  }, [])

  const request = useCallback(async (path: string, init?: RequestInit) => {
    const controller = new AbortController()
    controllers.current.add(controller)
    if (init?.method === "POST") postControllers.current.add(controller)
    const timer = window.setTimeout(() => controller.abort(), 15000)
    try {
      const headers = new Headers(init?.headers)
      headers.set("X-KTour-KYC", "1")
      let response: Response
      try { response = await fetch(path, { ...init, headers, credentials: "same-origin", cache: "no-store", signal: controller.signal }) }
      catch { throw new TransportError() }
      if (!response.ok) {
        let remote: Snapshot | undefined
        let code: string | undefined
        try {
          const body: unknown = await response.json()
          if (body && typeof body === "object" && "error" in body && typeof body.error === "string"
            && ["provider_unavailable", "provider_binding_mismatch", "invalid_provider_response", "request_not_allowed", "session_expired"].includes(body.error)) code = body.error
          remote = snapshotFrom(body)
        } catch { /* Never display untrusted error bodies. */ }
        throw new RequestError(response.status, remote, code)
      }
      return response
    } finally {
      window.clearTimeout(timer)
      controllers.current.delete(controller)
      postControllers.current.delete(controller)
    }
  }, [])

  const refreshStatus = useCallback(async (manual = false) => {
    if (!mounted.current || statusBusy.current || exiting.current) return
    if (!manual && (autoChecks.current >= 60 || Date.now() >= autoDeadline.current)) { setAutoPaused(true); return }
    if (!manual && Date.now() - lastAutoCheck.current < 10000) return
    if (!manual) { autoChecks.current += 1; lastAutoCheck.current = Date.now() }
    const expected = epoch.current
    statusBusy.current = true
    try {
      const response = await request("/api/kyc/sumsub/status")
      const next = snapshotFrom(await response.json())
      if (!mounted.current || epoch.current !== expected || exiting.current) return
      snapshotRef.current = next
      setSnapshot(next)
      sdkBlocked.current = TERMINAL.includes(next.status)
      setIssue(current => current === "connection" || current === "rate" ? null : current)
      if (TERMINAL.includes(next.status)) destroySdk()
    } catch (error) {
      if (mounted.current && epoch.current === expected && !exiting.current) {
        const failure = error instanceof TransportError ? { source: "transport" as const }
          : error instanceof RequestError ? { source: "http" as const, httpStatus: error.status, errorCode: error.code, snapshot: error.snapshot }
          : { source: "invalid_response" as const }
        const decision = resolveSumsubStatusFailure(snapshotRef.current, failure)
        snapshotRef.current = decision.snapshot; setSnapshot(decision.snapshot)
        if (decision.stopSdk) { sdkBlocked.current = true; destroySdk() }
        setIssue(decision.issue)
      }
    } finally {
      if (epoch.current === expected) {
        statusBusy.current = false
        if (mounted.current) setBusy(current => current === "checking" ? null : current)
      }
    }
  }, [destroySdk, request])

  useEffect(() => {
    mounted.current = true
    void refreshStatus()
    return () => {
      mounted.current = false
      epoch.current += 1
      statusBusy.current = false
      lastAutoCheck.current = 0
      controllers.current.forEach(controller => controller.abort())
      controllers.current.clear()
      destroySdk()
    }
  }, [destroySdk, refreshStatus])

  useEffect(() => {
    if ((!sdkActive && snapshot?.status !== "pending" && snapshot?.status !== "in_progress") || issue === "cancel" || autoPaused) return
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refreshStatus() }, 10000)
    const onVisible = () => { if (document.visibilityState === "visible") void refreshStatus() }
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("focus", onVisible)
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); window.removeEventListener("focus", onVisible) }
  }, [autoPaused, issue, refreshStatus, sdkActive, snapshot?.status])

  async function requestToken(code?: string) {
    if (!mounted.current || exiting.current || snapshotRef.current?.status === "approved" || snapshotRef.current?.status === "rejected") throw new Error("SESSION_CLOSED")
    sessionStarted.current = true
    const pending = request("/api/kyc/sumsub/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ consent: true, locale, ...(code ? { accessCode: code } : {}) }) })
    tokenRequest.current = pending
    let response: Response
    try { response = await pending } finally { if (tokenRequest.current === pending) tokenRequest.current = null }
    const value: unknown = await response.json()
    if (!value || typeof value !== "object") throw new Error("INVALID_TOKEN_RESPONSE")
    const data = value as Record<string, unknown>
    if (data.environment !== "sandbox" || typeof data.accessToken !== "string" || !data.accessToken || data.accessToken.length > 8192) throw new Error("INVALID_TOKEN_RESPONSE")
    return data.accessToken
  }

  async function start() {
    if (actionBusy.current || exiting.current || !snapshot?.configured || TERMINAL.includes(snapshot.status) && !["access_required", "expired"].includes(snapshot.status)) return
    actionBusy.current = true
    sdkBlocked.current = false
    const expected = epoch.current
    setBusy("starting"); setIssue(null)
    destroySdk()
    try {
      const token = await requestToken(accessCode.trim() || undefined)
      // Never write this short-lived SDK token or the access code to storage.
      if (!mounted.current || epoch.current !== expected || exiting.current || sdkBlocked.current) return
      setAccessCode("")
      const { default: builder } = await import("@sumsub/websdk")
      if (!mounted.current || epoch.current !== expected || exiting.current || sdkBlocked.current) return
      const instance = builder.init(token, async () => {
        try { return await requestToken() } catch (error) {
          if (mounted.current && epoch.current === expected && !exiting.current) {
            destroySdk(); setIssue("connection"); void refreshStatus()
          }
          throw error
        }
      }).withConf({ lang: locale, theme: document.documentElement.dataset.ondoTheme === "dark" ? "dark" : "light" })
        .withOptions({ addViewportTag: false, adaptIframeHeight: true, enableScrollIntoView: true })
        .onMessage((type: string) => {
          // Events trigger a signed-server status refresh, never an approval.
          if (["idCheck.onApplicantSubmitted", "idCheck.onApplicantStatusChanged", "idCheck.onApplicantResubmitted", "idCheck.onStepCompleted", "idCheck.onApplicantReviewComplete", "idCheck.onApplicantVerificationCompleted"].includes(type)) void refreshStatus()
        })
        .on("idCheck.onError", () => {
          if (!mounted.current || epoch.current !== expected || exiting.current || snapshotRef.current?.status === "approved" || snapshotRef.current?.status === "rejected") return
          destroySdk(); setIssue("sdk")
        }).build()
      if (sdkBlocked.current || snapshotRef.current?.status === "approved" || snapshotRef.current?.status === "rejected") { instance.destroy(); return }
      sdk.current = instance
      setSnapshot({ status: "in_progress", configured: true, environment: "sandbox" })
      snapshotRef.current = { status: "in_progress", configured: true, environment: "sandbox" }
      setSdkActive(true)
      await new Promise<void>(resolve => window.requestAnimationFrame(() => resolve()))
      if (!mounted.current || epoch.current !== expected || exiting.current || sdkBlocked.current || snapshotRef.current?.status === "approved" || snapshotRef.current?.status === "rejected") { instance.destroy(); return }
      instance.launch(`#${containerId}`)
    } catch (error) {
      if (!mounted.current || epoch.current !== expected || exiting.current) return
      const denied = error instanceof RequestError && error.status === 401
      if (error instanceof RequestError && error.snapshot) {
        snapshotRef.current = error.snapshot; setSnapshot(error.snapshot)
      } else if (denied) {
        const next: Snapshot = { status: "access_required", configured: true, environment: "sandbox" }
        snapshotRef.current = next; setSnapshot(next)
      }
      setIssue(denied && (!(error instanceof RequestError) || error.snapshot?.status !== "expired") ? "access" : error instanceof RequestError && error.status === 429 ? "rate" : "connection")
    } finally {
      actionBusy.current = false
      if (mounted.current && epoch.current === expected) setBusy(null)
    }
  }

  const requestExit = useCallback(async () => {
    if (exiting.current) return false
    exiting.current = true
    epoch.current += 1
    statusBusy.current = false
    // Let an in-flight token response settle before clearing the browser cookie,
    // so its Set-Cookie cannot race after our DELETE response. Camera stops now.
    controllers.current.forEach(controller => { if (!postControllers.current.has(controller)) controller.abort() })
    destroySdk()
    const current = snapshotRef.current
    if (!sessionStarted.current && (!current || ["not_started", "access_required", "unavailable"].includes(current.status)) || current?.status === "approved" || current?.status === "rejected") return true
    setBusy("cancelling"); setIssue(null)
    try {
      await tokenRequest.current?.catch(() => undefined)
      await request("/api/kyc/sumsub/session", { method: "DELETE" })
      return mounted.current
    } catch {
      if (mounted.current) { setIssue("cancel"); setBusy(null) }
      exiting.current = false
      return false
    }
  }, [destroySdk, request])
  useImperativeHandle(ref, () => ({ requestExit }), [requestExit])

  const status = snapshot?.status
  const approved = status === "approved"
  const canStart = snapshot?.configured && ["not_started", "access_required", "in_progress", "retry", "expired"].includes(status ?? "") && !sdkActive && issue !== "cancel"
  const title = approved ? copy.approved : status === "pending" ? copy.pending : status === "rejected" ? copy.rejected : status === "expired" ? copy.expired : status === "retry" ? copy.retry : status === "unavailable" ? copy.unavailable : status === "access_required" ? copy.accessTitle : issue === "sdk" ? copy.sdkError : issue === "connection" && !sdkActive ? copy.error : copy.title
  const lead = approved ? copy.approvedBody : status === "pending" ? copy.pendingBody : status === "rejected" ? copy.rejectedBody : status === "expired" ? copy.expiredBody : status === "retry" ? copy.retryBody : status === "unavailable" ? copy.unavailableBody : status === "access_required" ? copy.accessBody : issue === "sdk" ? copy.sdkErrorBody : issue === "connection" && !sdkActive ? copy.errorBody : copy.lead

  return <div className={styles.root} data-testid="sumsub-passport-step" data-environment="sandbox" data-status={status ?? "loading"} data-pass-issued="false">
    <p className={styles.badge}><ShieldCheck size={14} aria-hidden="true" />{copy.testOnly}</p>
    {!sdkActive ? <span className={styles.icon} aria-hidden="true">{approved ? <Check /> : status === "pending" ? <Clock3 /> : issue || status === "rejected" ? <TriangleAlert /> : <ShieldCheck />}</span> : null}
    <h1 data-identity-initial-focus tabIndex={-1}>{title}</h1>
    <p className={styles.lead}>{lead}</p>
    <div id={containerId} className={styles.sdk} hidden={!sdkActive} data-testid="sumsub-sdk-container" />
    <p className={styles.live} role="status" aria-live="polite">{busy === "checking" ? copy.checking : busy === "starting" ? copy.starting : busy === "cancelling" ? copy.cancelling : ""}</p>
    {autoPaused && !approved && status !== "rejected" ? <p className={styles.lead}>{copy.autoPaused}</p> : null}
    {issue === "access" || issue === "cancel" || issue === "rate" || issue === "connection" && (sdkActive || status === "pending" || status === "retry") ? <p className={styles.alert} role="alert">{issue === "access" ? copy.codeError : issue === "cancel" ? copy.cancelError : issue === "rate" ? copy.rateLimit : copy.errorBody}</p> : null}
    {canStart ? <form className={styles.form} onSubmit={event => { event.preventDefault(); void start() }}>
      {status === "access_required" ? <label>{copy.accessLabel}<input autoComplete="off" type="password" value={accessCode} maxLength={256} onChange={event => setAccessCode(event.target.value)} disabled={Boolean(busy)} data-testid="sumsub-access-code" /></label> : null}
      <button className={styles.primary} type="submit" disabled={Boolean(busy) || status === "access_required" && !accessCode.trim()} data-testid="sumsub-start">{status === "in_progress" || status === "retry" ? copy.resume : copy.start}<ArrowRight size={18} aria-hidden="true" /></button>
    </form> : null}
    <div className={styles.actions}>
      {(!approved && issue !== "cancel" && status !== "rejected" && status !== "access_required") ? <button type="button" className={styles.secondary} disabled={Boolean(busy)} data-testid="sumsub-check-status" onClick={() => { setBusy("checking"); void refreshStatus(true) }}>{issue === "connection" ? copy.tryAgain : copy.check}</button> : null}
      <button type="button" className={approved ? styles.primary : styles.textButton} disabled={busy === "cancelling"} data-testid="sumsub-return" onClick={async () => { if (await requestExit()) onReturn() }}>{issue === "cancel" ? copy.cancelRetry : approved || status === "rejected" || status === "unavailable" || status === "access_required" || !snapshot ? copy.back : copy.cancel}</button>
      {issue === "cancel" ? <button type="button" className={styles.textButton} data-testid="sumsub-close-screen" onClick={() => { destroySdk(); onReturn() }}>{locale === "ko" ? "이 화면만 닫기" : locale === "ja" ? "この画面だけ閉じる" : "Close this screen only"}</button> : null}
    </div>
    <details className={styles.privacy}><summary>{copy.privacy}</summary><p>{disclosure.retention}</p><p>{disclosure.boundary}</p></details>
  </div>
})
