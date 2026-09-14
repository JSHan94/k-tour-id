"use client"

import { useEffect, useRef, useState } from "react"
import { Check, ChevronRight, Clock3, Download, FlaskConical, LogOut, ShieldCheck, Trash2 } from "lucide-react"
import { SheetB } from "../shared/ui/sheet-b"
import { useReviewSampleSession } from "../shared/ui/use-qa-controls"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import { B_TABLE_ACTIVITY_CLEAR_EVENT } from "../connect/table-activity-b"
import { ACCOUNT_SERVICES_SAMPLE_KEY_B, initialAccountServiceSampleB, reduceAccountServiceSampleB, restoreAccountServiceSampleB, type AccountServiceActionB, type AccountServiceOutcomeB } from "./account-services-sample-model-b"
import styles from "./account-services-sample-b.module.css"

const COPY = {
  en: {
    entry: "Account services", sample: "Sample", boundary: "Prepared account · your real trip data stays unchanged.", storage: "Couldn’t save this step. Your request has not advanced.", resultStorage: "The result could not be saved. Keep this request and retry saving it.", retryStorage: "Save result again",
    export: "Export data", revoke: "Sign out devices", delete: "Delete account", exportBody: "Preview a portable archive of a prepared sample account.", revokeBody: "End the sample laptop session. This device stays signed in.", deleteBody: "Remove a prepared sample account. Your current saved places and pass are not deleted.",
    request: "Request export", confirmRevoke: "Sign out sample laptop", confirmDelete: "Delete sample account", cancelled: "Not now", retry: "Retry", query: "Check request", done: "Done", download: "Download sample JSON",
    review: "Review your choice", pending: "Processing…", unknown: "Waiting for confirmation", failed: "Couldn’t complete the request", completed: "Sample request completed", unknownNote: "Check this request instead of submitting again.", failedNote: "Nothing changed. Retry this request.",
    exportDone: "Your sample archive is ready. It contains no actual identity or payment data.", revokeDone: "The sample laptop session has ended. This browser’s session is unchanged.", deleteDone: "The prepared sample account was removed. No real account or credential was revoked.", cases: "Try another response", success: "Complete", failure: "Failed", delayed: "Delayed", session: "Sample laptop", active: "Signed in", signedOut: "Signed out", retained: "A real deletion must explain required retention and outstanding payments before consent.", another: "Another service",
  },
  ko: {
    entry: "계정 서비스", sample: "샘플", boundary: "준비된 계정 예시 · 내 여행 데이터는 그대로예요.", storage: "이 단계를 저장하지 못했어요. 요청은 진행되지 않았어요.", resultStorage: "결과를 저장하지 못했어요. 같은 요청의 결과를 다시 저장해 주세요.", retryStorage: "결과 다시 저장",
    export: "데이터 내보내기", revoke: "기기 로그아웃", delete: "계정 삭제", exportBody: "샘플 계정의 데이터를 가져가는 흐름을 확인해요.", revokeBody: "샘플 노트북의 접속을 종료해요. 이 기기는 유지돼요.", deleteBody: "준비된 샘플 계정을 삭제해요. 지금 저장한 장소와 패스는 삭제되지 않아요.",
    request: "내보내기 요청", confirmRevoke: "샘플 노트북 로그아웃", confirmDelete: "샘플 계정 삭제", cancelled: "지금은 안 할게요", retry: "다시 시도", query: "요청 상태 확인", done: "완료", download: "샘플 JSON 받기",
    review: "선택을 확인해 주세요", pending: "처리 중…", unknown: "결과를 기다리고 있어요", failed: "요청을 완료하지 못했어요", completed: "샘플 요청을 완료했어요", unknownNote: "다시 제출하지 말고 이 요청의 상태를 확인해 주세요.", failedNote: "변경된 내용이 없어요. 같은 요청으로 다시 시도해 주세요.",
    exportDone: "샘플 파일이 준비됐어요. 실제 신원·결제 정보는 포함하지 않아요.", revokeDone: "샘플 노트북의 접속을 종료했어요. 이 브라우저의 세션은 그대로예요.", deleteDone: "준비된 샘플 계정을 삭제했어요. 실제 계정이나 자격을 폐기한 것은 아니에요.", cases: "다른 상황 체험", success: "완료", failure: "실패", delayed: "응답 지연", session: "샘플 노트북", active: "접속 중", signedOut: "로그아웃됨", retained: "실제 삭제 전에는 보존이 필요한 정보와 미정산 내역을 설명하고 동의받아야 해요.", another: "다른 서비스",
  },
  ja: {
    entry: "アカウントサービス", sample: "サンプル", boundary: "準備されたアカウント例・実際の旅データは変わりません。", storage: "この手順を保存できませんでした。依頼は進んでいません。", resultStorage: "結果を保存できませんでした。同じ依頼の結果を再保存してください。", retryStorage: "結果を再保存",
    export: "データを書き出す", revoke: "端末のログアウト", delete: "アカウント削除", exportBody: "サンプルアカウントのアーカイブを確認します。", revokeBody: "サンプルPCの接続を終了します。この端末は維持されます。", deleteBody: "準備されたサンプルアカウントを削除します。保存した場所やパスは削除しません。",
    request: "書き出しを依頼", confirmRevoke: "サンプルPCをログアウト", confirmDelete: "サンプルアカウントを削除", cancelled: "今はしない", retry: "再試行", query: "状況を確認", done: "完了", download: "サンプルJSONを取得",
    review: "選択を確認してください", pending: "処理中…", unknown: "確認を待っています", failed: "依頼を完了できませんでした", completed: "サンプル依頼が完了しました", unknownNote: "再送信せず、この依頼の状況を確認してください。", failedNote: "変更はありません。同じ依頼で再試行できます。",
    exportDone: "サンプルファイルができました。実際の本人・決済情報は含みません。", revokeDone: "サンプルPCの接続を終了しました。このブラウザは変わりません。", deleteDone: "準備されたサンプルアカウントを削除しました。実際のアカウントや資格は失効していません。", cases: "別のケース", success: "完了", failure: "失敗", delayed: "応答遅延", session: "サンプルPC", active: "接続中", signedOut: "ログアウト済み", retained: "実際の削除前には必要な保存情報や未精算の説明と同意が必要です。", another: "別のサービス",
  },
} as const
const ICON = { export: Download, revoke: LogOut, delete: Trash2 }
export function AccountServicesSampleB({ locale }: { locale: OndoBLocale }) {
  return useReviewSampleSession() ? <EnabledAccountServicesSampleB locale={locale} /> : null
}
function EnabledAccountServicesSampleB({ locale }: { locale: OndoBLocale }) {
  const t = COPY[locale]
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(initialAccountServiceSampleB)
  const current = useRef(view)
  const { operation, phase, outcome, signedOut, operationId } = view
  const [storageError, setStorageError] = useState(false)
  const pendingResult = useRef<AccountServiceActionB | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (open && document.activeElement === document.body) headingRef.current?.focus({ preventScroll: true })
  }, [open, phase])
  function commit(action: AccountServiceActionB) {
    const next = reduceAccountServiceSampleB(current.current, action)
    if (next === current.current) return false
    try {
      const serialized = JSON.stringify(next)
      sessionStorage.setItem(ACCOUNT_SERVICES_SAMPLE_KEY_B, serialized)
      if (sessionStorage.getItem(ACCOUNT_SERVICES_SAMPLE_KEY_B) !== serialized) throw new Error("readback")
    } catch { setStorageError(true); return false }
    current.current = next; setView(next); setStorageError(false)
    return true
  }
  useEffect(() => {
    try {
      const restored = restoreAccountServiceSampleB(JSON.parse(sessionStorage.getItem(ACCOUNT_SERVICES_SAMPLE_KEY_B) ?? "null"))
      if (restored) { current.current = restored; setView(restored) }
    } catch { /* A corrupt sample journal grants no account authority. */ }
    const clear = () => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = null; pendingResult.current = null
      const next = initialAccountServiceSampleB()
      current.current = next; setView(next); setStorageError(false); setOpen(false)
    }
    window.addEventListener(B_TABLE_ACTIVITY_CLEAR_EVENT, clear)
    return () => {
      if (timer.current) clearTimeout(timer.current)
      window.removeEventListener(B_TABLE_ACTIVITY_CLEAR_EVENT, clear)
    }
  }, [])
  function request(retry = false) {
    const previous = current.current
    if (!["review", "failed", "unknown"].includes(previous.phase)) return
    const id = previous.operationId ?? `sample-account-${crypto.randomUUID()}`
    if (!commit({ type: "request", operationId: id })) return
    timer.current = setTimeout(() => {
      timer.current = null
      if (current.current.phase !== "pending" || current.current.operationId !== id) return
      const action: AccountServiceActionB = { type: "resolve", operationId: id, outcome: retry ? "success" : previous.outcome }
      if (!commit(action)) pendingResult.current = action
    }, 650)
  }
  function retryResultStorage() {
    if (pendingResult.current && commit(pendingResult.current)) pendingResult.current = null
  }
  function another() { commit({ type: "another" }) }
  function download() {
    const payload = { execution: "sample", externalEffect: "none", account: "prepared-guest", locale, bookmarks: [], notes: [], identityDataIncluded: false, financialDataIncluded: false }
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }))
    const link = document.createElement("a"); link.href = url; link.download = "ondo-sample-account.json"; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const Icon = ICON[operation]
  return <>
    <button type="button" className={styles.entry} onClick={() => setOpen(true)} data-testid="account-services-open"><FlaskConical size={18} /><span>{t.entry}<small>{t.sample}</small></span><ChevronRight size={17} /></button>
    {open && <SheetB locale={locale} label={t.entry} variant="full-task" header={<span>{t.entry}</span>} onClose={() => setOpen(false)} initialFocusSelector="[data-account-services-heading]" footer={<div className={styles.footer}>
      {storageError && pendingResult.current ? <button type="button" className={styles.primary} data-testid="account-services-storage-retry" onClick={retryResultStorage}>{t.retryStorage}</button>
        : phase === "done" ? <><button type="button" className={styles.primary} onClick={operation === "export" ? download : () => setOpen(false)}>{operation === "export" ? <Download size={17} /> : <Check size={17} />}{operation === "export" ? t.download : t.done}</button><button type="button" className={styles.quiet} onClick={another}>{t.another}</button></>
        : <><button type="button" className={styles.primary} disabled={phase === "pending"} data-testid="account-services-submit" onClick={() => request(phase === "failed" || phase === "unknown")}>{phase === "pending" ? t.pending : phase === "unknown" ? t.query : phase === "failed" ? t.retry : operation === "export" ? t.request : operation === "revoke" ? t.confirmRevoke : t.confirmDelete}</button><button type="button" className={styles.quiet} onClick={() => setOpen(false)}>{t.cancelled}</button></>}
    </div>}><div className={styles.body} data-testid="account-services-sample" data-phase={phase} data-operation-id={operationId ?? ""}>
      <p className={styles.boundary}><FlaskConical size={14} />{t.boundary}</p>
      {phase === "review" && <div className={styles.choices}>{(["export", "revoke", "delete"] as const).map(value => { const Glyph = ICON[value]; return <button key={value} type="button" aria-pressed={operation === value} onClick={() => commit({ type: "choose", operation: value })} data-testid={`account-services-${value}`}><Glyph size={19} /><span>{t[value]}</span></button> })}</div>}
      <span className={styles.glyph}>{phase === "done" ? <ShieldCheck /> : phase === "pending" || phase === "unknown" ? <Clock3 /> : <Icon />}</span>
      <h2 ref={headingRef} tabIndex={-1} data-account-services-heading>{phase === "review" ? t[operation] : phase === "done" ? t.completed : t[phase]}</h2>
      <p role="status">{phase === "review" || phase === "pending" ? t[`${operation}Body`] : phase === "done" ? t[`${operation}Done`] : phase === "failed" ? t.failedNote : t.unknownNote}</p>
      {operation === "revoke" && <div className={styles.session}><span>{t.session}</span><strong>{signedOut ? t.signedOut : t.active}</strong></div>}
      {operationId && <code>SAMPLE-{operationId.slice(-8).toUpperCase()}</code>}
      {storageError && <p role="alert" data-testid="account-services-storage-error">{pendingResult.current ? t.resultStorage : t.storage}</p>}
      {phase === "review" && <details className={styles.details}><summary>{t.cases}</summary><select data-testid="account-services-outcome" aria-label={t.cases} value={outcome} onChange={event => commit({ type: "outcome", outcome: event.target.value as AccountServiceOutcomeB })}><option value="success">{t.success}</option><option value="failure">{t.failure}</option><option value="unknown">{t.delayed}</option></select>{operation === "delete" && <p>{t.retained}</p>}</details>}
    </div></SheetB>}
  </>
}
