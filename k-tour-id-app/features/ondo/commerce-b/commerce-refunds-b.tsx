"use client"

import { useEffect, useState } from "react"
import { Check, ChevronDown, Clock3, LoaderCircle, RotateCcw } from "lucide-react"
import { useOndoB } from "../shared/state/ondo-b-provider"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import { commerceSampleResponseB } from "./commerce-sample-response-b"
import { stableCommerceRefundableKrwB, stableCommerceRefundedKrwB, type CommerceRefundOperationB } from "./stable-commerce-model-b"
import styles from "./commerce-operations-b.module.css"

export function CommerceRefundsB({ locale, scope, reviewMode }: { locale: OndoBLocale; scope: "checkout" | "wallet"; reviewMode: boolean }) {
  const { state, actions } = useOndoB()
  const commerce = state.commerceSession
  const remaining = stableCommerceRefundableKrwB(commerce)
  const refunded = stableCommerceRefundedKrwB(commerce)
  const operations = commerce.refundOperations ?? []
  const active = operations.find(item => item.phase === "pending" || item.phase === "unknown")
  const [amount, setAmount] = useState("5000")
  const [outcome, setOutcome] = useState<"success" | "failure" | "unknown">("success")
  const [error, setError] = useState(false)
  const words = (en: string, ko: string, ja: string) => locale === "ko" ? ko : locale === "ja" ? ja : en
  const money = (value: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(value)
  function finish(operation: CommerceRefundOperationB, result: typeof outcome) {
    const execution = commerceSampleResponseB({ operationId: operation.operationId, stage: "refund", outcome: result, amountKrw: operation.amountKrw })
    if (!execution || !actions.dispatchCommerce({ type: "REFUND_RESULT", operationId: operation.operationId, outcome: result, now: Date.now(), execution })) setError(true)
    else setError(false)
  }
  useEffect(() => {
    if (!reviewMode || active?.phase !== "pending") return
    const timer = window.setTimeout(() => finish(active, active.sampleOutcome ?? "success"), 650)
    return () => window.clearTimeout(timer)
  }, [reviewMode, active?.operationId, active?.phase, active?.attempts])
  if (!reviewMode || commerce.status === "idle") return null
  const numeric = Number(amount)
  const valid = /^\d+$/.test(amount) && Number.isSafeInteger(numeric) && numeric > 0 && numeric <= remaining
  function submit() {
    if (!valid || active) return
    setError(!actions.dispatchCommerce({ type: "REFUND_REQUEST", operationId: `sample-refund:${crypto.randomUUID()}`, amountKrw: numeric, now: Date.now(), sampleOutcome: outcome }))
  }
  return <details className={styles.refunds} data-testid={`${scope}-refund-panel`}>
    <summary><RotateCcw size={18} aria-hidden="true" /><span>{words("Refund options", "환불 관리", "返金の管理")}</span><small>{refunded ? money(refunded) : null}</small><ChevronDown size={17} aria-hidden="true" /></summary>
    <div className={styles.body}>
      <dl className={styles.amounts}><div><dt>{words("Refunded", "환불 완료", "返金済み")}</dt><dd data-testid={`${scope}-refund-total`}>{money(refunded)}</dd></div><div><dt>{words("Still refundable", "환불 가능", "返金可能")}</dt><dd data-testid={`${scope}-refund-remaining`}>{money(remaining)}</dd></div></dl>
      {remaining > 0 ? <p className={styles.note}>{words("Only the refunded amount returns to your balance and allowance. A used benefit returns after the full payment is refunded.", "환불된 금액만 잔액과 한도로 돌아와요. 사용한 혜택은 전액환불 후 복원됩니다.", "返金分のみ残高と上限に戻ります。使用済み特典は全額返金後に戻ります。")}</p> : null}
      {operations.length ? <ol className={styles.history} aria-label={words("Refund history", "환불 내역", "返金履歴")}>{operations.map(operation => <li key={operation.operationId} data-testid={`${scope}-refund-operation`} data-phase={operation.phase} data-operation-id={operation.operationId}>
        {operation.phase === "settled" ? <Check size={18} aria-hidden="true" /> : operation.phase === "pending" ? <LoaderCircle className={styles.spinner} size={18} aria-hidden="true" /> : <Clock3 size={18} aria-hidden="true" />}
        <span><strong>{money(operation.amountKrw)}</strong><small>{operation.phase === "settled" ? words("Refunded", "환불 완료", "返金済み") : operation.phase === "pending" ? words("Processing", "처리 중", "処理中") : operation.phase === "unknown" ? words("Result not confirmed", "결과 확인 필요", "結果の確認が必要") : words("Not refunded", "환불 미완료", "返金未完了")}</small></span>
        {operation.phase === "unknown" ? <button type="button" data-testid={`${scope}-refund-check`} onClick={() => finish(operation, outcome === "failure" ? "failure" : "success")}>{words("Check status", "상태 확인", "状況を確認")}</button> : operation.phase === "failed" && !active && operation.amountKrw <= remaining ? <button type="button" data-testid={`${scope}-refund-retry`} onClick={() => setError(!actions.dispatchCommerce({ type: "REFUND_RETRY", operationId: operation.operationId }))}>{words("Retry", "다시 시도", "再試行")}</button> : null}
      </li>)}</ol> : null}
      {active ? <p className={styles.note} role="status">{words("Check this refund before requesting another. Unconfirmed refunds do not change your balance.", "이 환불을 확인한 뒤 다음 요청을 할 수 있어요. 미확정 결과는 잔액을 바꾸지 않습니다.", "次の申請の前にこの返金を確認してください。未確定の結果では残高は変わりません。")}</p> : remaining > 0 ? <>
        <label className={styles.amountInput}>{words("Refund amount", "환불 금액", "返金額")}<span><b>₩</b><input data-testid={`${scope}-refund-amount`} type="text" inputMode="numeric" value={amount} onChange={event => setAmount(event.target.value)} aria-invalid={!valid} /></span></label>
        <div className={styles.choices}><button type="button" onClick={() => setAmount(String(Math.max(1, Math.floor(remaining / 2))))}>{words("Half", "절반", "半額")}</button><button type="button" data-testid={`${scope}-refund-all`} onClick={() => setAmount(String(remaining))}>{words("Remaining amount", "남은 전액", "残り全額")}</button></div>
        {!valid ? <p className={styles.note}>{words("Enter a whole-won amount within the remaining payment.", "남은 결제 금액 안에서 원 단위로 입력해 주세요.", "残りの決済額以内で1ウォン単位で入力してください。")}</p> : null}
        <button className={styles.primary} type="button" data-testid={`${scope}-refund-submit`} disabled={!valid} onClick={submit}>{words("Refund", "환불", "返金")} {valid ? money(numeric) : ""}</button>
      </> : null}
      {remaining > 0 ? <details className={styles.samples}><summary>{words("Sample response", "샘플 응답", "サンプル応答")}</summary><select data-testid={`${scope}-refund-case`} value={outcome} onChange={event => setOutcome(event.target.value as typeof outcome)} aria-label={words("Sample refund response", "샘플 환불 응답", "サンプル返金応答")}><option value="success">{words("Completed", "완료", "完了")}</option><option value="failure">{words("Failed · retry", "실패 · 재시도", "失敗・再試行")}</option><option value="unknown">{words("Unknown · check status", "불명 · 상태 조회", "不明・状況確認")}</option></select><p className={styles.note}>{words("Sample only. No real payment or refund is sent.", "샘플이에요. 실제 결제나 환불은 전송하지 않습니다.", "サンプルです。実際の決済や返金は送信しません。")}</p></details> : null}
      {error ? <p className={styles.error} role="alert">{words("This result was not saved. Your balance is unchanged; check the same refund again.", "결과를 저장하지 못했어요. 잔액은 그대로이며 같은 환불을 다시 확인해 주세요.", "結果を保存できませんでした。残高は変わっていません。同じ返金を再確認してください。")}</p> : null}
      {error && active?.phase === "pending" ? <button type="button" onClick={() => finish(active, active.sampleOutcome ?? "success")}>{words("Check again", "다시 확인", "再確認")}</button> : null}
    </div>
  </details>
}
