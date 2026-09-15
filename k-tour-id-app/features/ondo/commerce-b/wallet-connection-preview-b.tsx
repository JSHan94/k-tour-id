"use client"

import { useEffect, useRef, useState } from "react"
import { Fingerprint, WalletCards } from "lucide-react"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import type { StablecoinSignerMethodB } from "./funding-rail-model-b"
import styles from "./stablecoin-funding-b.module.css"

/** A provider-shaped sample permission screen. It never opens a real wallet. */
export function WalletConnectionPreviewB({ locale, method, onApprove, onReturn }: {
  locale: OndoBLocale; method: StablecoinSignerMethodB; onApprove(): void; onReturn(): void
}) {
  const [status, setStatus] = useState<"waiting" | "declined" | "timed_out">("waiting")
  const heading = useRef<HTMLHeadingElement>(null)
  const consumed = useRef(false)
  const w = (en: string, ko: string, ja: string) => locale === "ko" ? ko : locale === "ja" ? ja : en
  useEffect(() => {
    heading.current?.focus()
    if (status !== "waiting") return
    const timer = setTimeout(() => setStatus("timed_out"), 60_000)
    return () => clearTimeout(timer)
  }, [status])
  return <section className={styles.connectionPreview} data-testid="stablecoin-connection-preview" data-status={status} aria-labelledby="wallet-connection-heading">
    {method === "zklogin" ? <Fingerprint size={28} aria-hidden="true" /> : <WalletCards size={28} aria-hidden="true" />}
    <small>{w("Wallet approval · demo", "지갑 승인 · 데모", "ウォレット承認・デモ")}</small>
    <h3 id="wallet-connection-heading" ref={heading} tabIndex={-1}>{status === "waiting" ? w("Continue in your wallet", "지갑에서 이어서 확인해요", "ウォレットで続けましょう") : status === "declined" ? w("Connection cancelled", "연결을 취소했어요", "接続をキャンセルしました") : w("The connection timed out", "연결 대기 시간이 지났어요", "接続がタイムアウトしました")}</h3>
    <p>{method === "zklogin" ? w("A preview of sign-in and wallet permission. No account details are collected.", "로그인과 지갑 권한 확인의 예시예요. 실제 계정 정보는 수집하지 않아요.", "ログインとウォレット権限の確認例です。実際のアカウント情報は収集しません。") : w("A preview of the request in your wallet app. Connecting does not approve a transfer.", "지갑 앱에 표시될 요청의 예시예요. 연결만으로 전송을 승인하지 않아요.", "ウォレットアプリに表示される確認例です。接続だけでは送信を承認しません。")}</p>
    <dl className={styles.facts}><div><dt>{w("Requested by", "요청 서비스", "リクエスト元")}</dt><dd>K-Tour ID</dd></div><div><dt>{w("Permission", "요청 권한", "権限")}</dt><dd>{w("Connect sample wallet only", "샘플 지갑 연결만", "サンプル接続のみ")}</dd></div><div><dt>{w("Network", "네트워크", "ネットワーク")}</dt><dd>Sui Testnet · {w("sample", "샘플", "サンプル")}</dd></div></dl>
    {status === "waiting" ? <>
      <button type="button" className={styles.primary} data-testid="stablecoin-connection-approve" onClick={() => { if (consumed.current) return; consumed.current = true; onApprove() }}>{w("Approve in sample wallet", "샘플 지갑에서 승인", "サンプルウォレットで承認")}</button>
      <button type="button" className={styles.textButton} data-testid="stablecoin-connection-decline" onClick={() => setStatus("declined")}>{w("Cancel connection", "연결 취소", "接続をキャンセル")}</button>
      <details className={styles.details}><summary>{w("Try a timeout", "시간 초과 체험", "タイムアウトを試す")}</summary><button type="button" className={styles.secondary} data-testid="stablecoin-connection-timeout" onClick={() => setStatus("timed_out")}>{w("Simulate no response", "응답 없음 체험", "応答なしを試す")}</button></details>
    </> : <><p role="status">{w("Your balance is unchanged. No transfer was requested.", "잔액은 그대로예요. 전송을 요청하지 않았어요.", "残高は変わりません。送信はリクエストされていません。")}</p><button type="button" className={styles.secondary} data-testid="stablecoin-connection-retry" onClick={() => setStatus("waiting")}>{w("Try connecting again", "다시 연결하기", "接続を再試行")}</button></>}
    <button type="button" className={styles.textButton} data-testid="stablecoin-connection-return" onClick={onReturn}>{w("Back to quote", "견적으로 돌아가기", "見積もりに戻る")}</button>
  </section>
}
