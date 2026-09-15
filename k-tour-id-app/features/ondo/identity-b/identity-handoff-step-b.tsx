"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowRight, Check, Clock3, IdCard, ShieldCheck, Smartphone } from "lucide-react"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import { KTourIdMark } from "../shared/ui/ktour-id-mark"
import type { OndoBIdentitySetupSession } from "./ktour-id-setup-model-b"
import { resolveIdentityDemoHandoff, returnIdentityDemoHandoff, startIdentityDemoHandoff, type IdentityDemoHandoff } from "./identity-demo-boundary-b"
import styles from "./ktour-id-setup-b.module.css"

const COPY = {
  en: {
    title: "Try the ID app handoff", body: "Follow the approval and return steps with a prepared response.",
    demo: "DEMO APP · NOT CONNECTED", boundary: "This screen stays inside K-Tour ID. No ID app opens, no QR is generated, and nothing is sent to Mobile ID or OmniOne CX.",
    route: "ID handoff steps", consent: "Consent reviewed", consentNote: "Your selected method and trip stay in place.",
    check: "Approve in the demo app", checkNote: "Choose a prepared approval or decline.",
    return: "Return to K-Tour ID", returnNote: "Review the response before saving a sample pass.",
    start: "Start demo handoff", waiting: "Waiting for your sample choice", waitingBody: "In a connected service, you would decide in your ID app. Here, choose a demo response below. This sample window lasts 45 seconds.",
    approve: "Simulate approval", decline: "Simulate decline", cancel: "Cancel handoff", timeout: "Try a timeout",
    approved: "Sample approval is ready", approvedBody: "Return this prepared response to K-Tour ID. No identity was verified and no pass has been saved.",
    declined: "Sample request declined", declinedBody: "Return without a pass. Your selected method and trip are unchanged.",
    cancelled: "Handoff cancelled", timeoutTitle: "Sample handoff timed out", timeoutBody: "Return to retry the same method. Late responses cannot complete this request.",
  },
  ko: {
    title: "신분증 앱 연결을 체험해요", body: "준비된 응답으로 승인부터 돌아오기까지 살펴봐요.",
    demo: "데모 앱 · 실제 연결 없음", boundary: "K-Tour ID 안의 예시 화면이에요. 신분증 앱을 열거나 QR을 만들지 않으며, 모바일 신분증·OmniOne CX에 전송하지 않아요.",
    route: "신분증 연결 단계", consent: "동의 내용 확인", consentNote: "선택한 확인 방법과 여행은 유지돼요.",
    check: "데모 앱에서 승인", checkNote: "준비된 승인 또는 거절 응답을 선택해요.",
    return: "K-Tour ID로 돌아가기", returnNote: "응답을 확인한 뒤 샘플 패스를 보관해요.",
    start: "데모 연결 시작", waiting: "샘플 선택을 기다려요", waitingBody: "실제 서비스에서는 신분증 앱에서 결정해요. 여기서는 아래 데모 응답을 선택하세요. 샘플 대기 시간은 45초예요.",
    approve: "승인 응답 체험", decline: "거절 응답 체험", cancel: "연결 취소", timeout: "시간 초과 체험",
    approved: "샘플 승인 응답이 준비됐어요", approvedBody: "준비된 응답과 함께 K-Tour ID로 돌아가요. 실제 신원 확인이나 패스 저장은 아직 없어요.",
    declined: "샘플 요청을 거절했어요", declinedBody: "패스를 만들지 않고 돌아가요. 선택한 방법과 여행은 그대로예요.",
    cancelled: "연결을 취소했어요", timeoutTitle: "샘플 연결 시간이 지났어요", timeoutBody: "돌아가서 같은 방법으로 다시 시도하세요. 늦게 도착한 응답은 이 요청을 완료할 수 없어요.",
  },
  ja: {
    title: "IDアプリ連携を体験", body: "用意された応答で、承認から戻るまでを確認します。",
    demo: "デモアプリ・実際の接続なし", boundary: "K-Tour ID内のサンプル画面です。IDアプリは開かず、QRも生成せず、モバイルIDやOmniOne CXへの送信もありません。",
    route: "ID連携の手順", consent: "同意内容を確認", consentNote: "選んだ確認方法と旅行は維持されます。",
    check: "デモアプリで承認", checkNote: "用意された承認または拒否を選びます。",
    return: "K-Tour IDに戻る", returnNote: "応答を確認してからサンプルパスを保存します。",
    start: "デモ連携を開始", waiting: "サンプルの選択を待っています", waitingBody: "接続済みサービスではIDアプリで決定します。ここでは下のデモ応答を選んでください。サンプルの待機時間は45秒です。",
    approve: "承認をシミュレーション", decline: "拒否をシミュレーション", cancel: "連携をキャンセル", timeout: "タイムアウトを体験",
    approved: "サンプル承認の準備ができました", approvedBody: "用意された応答でK-Tour IDに戻ります。実際の本人確認やパスの保存は行われていません。",
    declined: "サンプル依頼を拒否しました", declinedBody: "パスを作らず戻ります。選んだ方法と旅行は変わりません。",
    cancelled: "連携をキャンセルしました", timeoutTitle: "サンプル連携がタイムアウトしました", timeoutBody: "戻って同じ方法で再試行できます。遅れた応答でこの依頼を完了することはできません。",
  },
} as const

export function IdentityHandoffStepB({ locale, session, reviewMode, methodTitle, onComplete, onInterrupted }: {
  locale: OndoBLocale; session: OndoBIdentitySetupSession | null; reviewMode: boolean; methodTitle: string
  onComplete: () => void; onInterrupted: (reason: "cancelled" | "timeout" | "expired") => void
}) {
  const copy = COPY[locale]
  const [request, setRequest] = useState<IdentityDemoHandoff | null>(null)
  const requestRef = useRef(request)
  const completedRef = useRef(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const actionRef = useRef<HTMLButtonElement>(null)
  const status = request?.status ?? "ready"
  function update(next: IdentityDemoHandoff) { requestRef.current = next; setRequest(next) }
  function resolve(decision: "approve" | "decline" | "cancel" | "timeout") {
    if (!reviewMode || !requestRef.current || !session || completedRef.current) return
    update(resolveIdentityDemoHandoff(requestRef.current, decision, session.nonce))
  }
  useEffect(() => { actionRef.current?.focus({ preventScroll: true }) }, [status])
  useEffect(() => {
    if (!request || !["waiting", "approved"].includes(request.status)) return
    const timer = window.setTimeout(() => {
      const current = requestRef.current
      if (!current || !session || completedRef.current || !rootRef.current
        || rootRef.current.closest('[data-identity-presence="closing"], [inert]')) return
      update(current.status === "approved" ? returnIdentityDemoHandoff(current, session.nonce) : resolveIdentityDemoHandoff(current, "timeout", session.nonce))
    }, Math.max(0, request.expiresAt - Date.now()) + 16)
    return () => window.clearTimeout(timer)
  }, [request, session])
  function start() {
    if (requestRef.current || completedRef.current) return
    const next = session ? startIdentityDemoHandoff(session, reviewMode) : null
    if (!next) return onInterrupted("expired")
    update(next)
  }
  function returnToOndo() {
    if (!reviewMode || completedRef.current || !requestRef.current || !session) return
    const current = requestRef.current
    const next = returnIdentityDemoHandoff(current, session.nonce)
    update(next)
    completedRef.current = true
    if (current.status === "approved" && next.status === "returned") onComplete()
    else onInterrupted(next.status === "timed_out" ? "timeout" : "cancelled")
  }
  const title = status === "ready" ? copy.title : status === "waiting" ? copy.waiting : status === "approved" ? copy.approved : status === "timed_out" ? copy.timeoutTitle : status === "declined" ? copy.declined : copy.cancelled
  const body = status === "ready" ? copy.body : status === "waiting" ? copy.waitingBody : status === "approved" ? copy.approvedBody : status === "timed_out" ? copy.timeoutBody : copy.declinedBody
  return <div ref={rootRef} className={`${styles.body} ${styles.handoff}`} data-testid="k-tour-id-route-step" data-handoff-state={status} data-sample-only="true">
    <div className={styles.handoffHeading}>
      <span className={styles.handoffMark} data-testid="ktour-id-mobile-handoff">{session?.method === "mobile_residence_card" ? <IdCard size={28} aria-hidden="true" /> : <Smartphone size={28} aria-hidden="true" />}</span>
      <p className={styles.eyebrow}>{methodTitle}</p><h1>{title}</h1><p className={styles.lead} role="status">{body}</p>
    </div>
    {status === "ready" ? <ol className={styles.handoffSteps} aria-label={copy.route} data-testid="identity-handoff-stages">
      <li data-stage="complete"><span className={styles.handoffGlyph}><Check size={20} aria-hidden="true" /></span><div><strong>{copy.consent}</strong><p>{copy.consentNote}</p></div></li>
      <li data-stage="current" aria-current="step"><span className={styles.handoffGlyph}><ShieldCheck size={21} aria-hidden="true" /></span><div><strong>{copy.check}</strong><p>{copy.checkNote}</p></div></li>
      <li data-stage="next"><span className={styles.handoffGlyph}><KTourIdMark size={22} /></span><div><strong>{copy.return}</strong><p>{copy.returnNote}</p></div></li>
    </ol> : null}
    {status === "waiting" ? <section className={styles.demoSurface} aria-label={copy.demo} data-testid="identity-demo-app" data-provider-connected="false">
      <p className={styles.demoLabel}><Smartphone size={16} aria-hidden="true" />{copy.demo}</p><p>{copy.boundary}</p>
      <div className={styles.demoActions}><button ref={actionRef} type="button" className={styles.primary} data-testid="identity-handoff-approve" onClick={() => resolve("approve")}>{copy.approve}</button><button type="button" className={styles.secondary} data-testid="identity-handoff-decline" onClick={() => resolve("decline")}>{copy.decline}</button></div>
    </section> : null}
    <div className={`${styles.actions} ${styles.singleAction}`}>
      {status === "ready" ? <button ref={actionRef} type="button" data-identity-initial-focus data-testid="k-tour-id-continue" className={styles.primary} onClick={start}>{copy.start}<ArrowRight size={17} aria-hidden="true" /></button>
        : status === "waiting" ? <><button type="button" className={styles.secondary} data-testid="identity-handoff-cancel" onClick={() => resolve("cancel")}>{copy.cancel}</button><button type="button" className={styles.textAction} data-testid="identity-handoff-timeout" onClick={() => resolve("timeout")}><Clock3 size={16} aria-hidden="true" />{copy.timeout}</button></>
          : <button ref={actionRef} type="button" data-identity-initial-focus data-testid="k-tour-id-continue" className={styles.primary} onClick={returnToOndo}>{copy.return}<ArrowRight size={17} aria-hidden="true" /></button>}
    </div>
  </div>
}
