"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowRight, Check, WalletCards } from "lucide-react"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import styles from "./ktour-id-setup-b.module.css"

const COPY = {
  en: { eyebrow: "TRAVEL PASS", title: "Review delivery to your pass", body: "Prepare a sample receipt before saving anything in this tab.", start: "Prepare sample receipt", receipt: "Sample receipt ready", receiptBody: "K-Tour ID draft · this browser tab only. Nothing is saved until you acknowledge below.", acknowledge: "Acknowledge & save sample pass", cancel: "Cancel delivery", boundary: "Demo only. This is not a wallet connection, official ID or DID/VC issuance." },
  ko: { eyebrow: "여행 패스", title: "패스 보관 내용을 확인해요", body: "이 탭에 저장하기 전에 샘플 수신 내역을 준비해요.", start: "샘플 수신 내역 준비", receipt: "샘플 수신 내역이 준비됐어요", receiptBody: "K-Tour ID 초안 · 이 브라우저 탭 전용. 아래에서 확인하기 전에는 저장되지 않아요.", acknowledge: "수신 확인하고 샘플 패스 저장", cancel: "보관 취소", boundary: "데모 전용이에요. 지갑 연결이나 공식 신분증·DID·VC 발급이 아니에요." },
  ja: { eyebrow: "トラベルパス", title: "パスへの保存内容を確認", body: "このタブに保存する前に、サンプル受領内容を準備します。", start: "サンプル受領内容を準備", receipt: "サンプル受領内容の準備完了", receiptBody: "K-Tour IDの下書き・このブラウザタブ専用。下で確認するまで保存されません。", acknowledge: "受領を確認してサンプルパスを保存", cancel: "保存をキャンセル", boundary: "デモ専用です。ウォレット接続、公的ID、DID・VCの発行ではありません。" },
} as const

export function IdentityHolderStepB({ locale, onPrepare, onAcknowledge, onCancel }: {
  locale: OndoBLocale; onPrepare: () => boolean; onAcknowledge: () => void; onCancel: () => void
}) {
  const copy = COPY[locale]
  const [receipt, setReceipt] = useState(false)
  const acknowledgedRef = useRef(false)
  const actionRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { actionRef.current?.focus({ preventScroll: true }) }, [receipt])
  function continueDelivery() {
    if (acknowledgedRef.current) return
    if (!receipt) { if (onPrepare()) setReceipt(true); return }
    acknowledgedRef.current = true
    onAcknowledge()
  }
  return <div className={`${styles.body} ${styles.sampleTask}`} data-testid="k-tour-id-holder-delivery" data-holder-state={receipt ? "receipt" : "ready"} data-sample-only="true">
    <span className={styles.heroIcon}>{receipt ? <Check size={28} aria-hidden="true" /> : <WalletCards size={28} aria-hidden="true" />}</span>
    <p className={styles.eyebrow}>{copy.eyebrow}</p><h1>{receipt ? copy.receipt : copy.title}</h1>
    <p className={styles.lead} role="status" data-testid={receipt ? "identity-holder-receipt" : undefined}>{receipt ? copy.receiptBody : copy.body}</p>
    <p className={styles.sampleBoundary}>{copy.boundary}</p>
    <div className={styles.actions}><button ref={actionRef} type="button" data-identity-initial-focus data-testid="k-tour-id-continue" className={styles.primary} onClick={continueDelivery}>{receipt ? copy.acknowledge : copy.start}<ArrowRight size={17} aria-hidden="true" /></button><button type="button" className={styles.secondary} data-testid="identity-holder-cancel" onClick={onCancel}>{copy.cancel}</button></div>
  </div>
}
