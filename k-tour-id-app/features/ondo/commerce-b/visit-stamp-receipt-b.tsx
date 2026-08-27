"use client"

import { useRef, useState } from "react"
import { Check, ChevronRight, Footprints, RotateCcw, Sparkles } from "lucide-react"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import { useOndoB } from "../shared/state/ondo-b-provider"
import { useBActivityProfile } from "../identity-b/activity-profile-b-provider"
import styles from "./visit-stamp-receipt-b.module.css"

const COPY = {
  en: {
    title: "Remember this visit",
    body: "Payment never adds a stamp. Confirm a separate local visit record if you were here.",
    confirm: "Add visit stamp",
    recorded: "Visit stamp added",
    duplicate: "Already recorded",
    failed: "Couldn’t save the visit in this tab.",
    retry: "Try again",
    boundary: "Your confirmation · this tab only · no venue or location verification",
    milestone: "10th place reached",
    milestoneBody: "An optional souvenir is ready in Labs.",
    open: "View souvenir",
  },
  ko: {
    title: "이번 방문 기억하기",
    body: "결제만으로 스탬프가 생기지 않아요. 실제로 방문했다면 별도 로컬 방문 기록을 남기세요.",
    confirm: "방문 스탬프 추가",
    recorded: "방문 스탬프 추가됨",
    duplicate: "이미 기록됨",
    failed: "이 탭에 방문 기록을 저장하지 못했어요.",
    retry: "다시 시도",
    boundary: "사용자 확인 · 이 탭에만 저장 · 장소·위치 검증 없음",
    milestone: "열 번째 장소 도착",
    milestoneBody: "선택형 기념품이 Labs에 준비됐어요.",
    open: "기념품 보기",
  },
  ja: {
    title: "この訪問を記録",
    body: "支払いだけではスタンプは増えません。実際に訪れた場合だけ、別のローカル訪問記録を追加してください。",
    confirm: "訪問スタンプを追加",
    recorded: "訪問スタンプを追加しました",
    duplicate: "記録済みです",
    failed: "このタブに訪問を保存できませんでした。",
    retry: "もう一度試す",
    boundary: "本人の確認 · このタブだけ · 店舗・位置情報による検証なし",
    milestone: "10か所目に到達",
    milestoneBody: "任意の記念アイテムをLabsで確認できます。",
    open: "記念アイテムを見る",
  },
} as const

export function VisitStampReceiptB({ locale, venueId }: { locale: OndoBLocale; venueId: string }) {
  const { state, actions } = useBActivityProfile()
  const { actions: ondoActions } = useOndoB()
  const [failure, setFailure] = useState(false)
  const [duplicate, setDuplicate] = useState(false)
  const retryRef = useRef<HTMLButtonElement>(null)
  const evidenceId = `visit:${venueId}`
  const recorded = state.acceptedEvidenceIds.includes(evidenceId)
  const copy = COPY[locale]

  function confirmVisit() {
    setFailure(false)
    const result = actions.recordUniqueVisit(evidenceId)
    if (result === "accepted") return
    if (result === "duplicate") {
      setDuplicate(true)
      return
    }
    setFailure(true)
    window.requestAnimationFrame(() => retryRef.current?.focus({ preventScroll: true }))
  }

  return (
    <section className={styles.root} data-testid="visit-stamp-receipt" data-recorded={recorded} data-stamp-count={state.stamps}>
      <div className={styles.heading}>
        <span><Footprints size={20} aria-hidden="true" /></span>
        <div><h3>{recorded && state.stamps === 10 ? copy.milestone : copy.title}</h3><p>{recorded && state.stamps === 10 ? copy.milestoneBody : copy.body}</p></div>
        <strong>{state.stamps}<small>/10</small></strong>
      </div>
      <div className={styles.track} role="img" aria-label={`${state.stamps}/10`}>
        {Array.from({ length: 10 }, (_, index) => <i key={index} data-filled={index < state.stamps}>{index < state.stamps ? <Check size={10} aria-hidden="true" /> : null}</i>)}
      </div>
      {failure ? <p className={styles.error} role="alert">{copy.failed}</p> : null}
      {duplicate ? <p className={styles.status} role="status">{copy.duplicate}</p> : null}
      {recorded && state.stamps === 10 ? (
        <button type="button" className={styles.primary} data-testid="checkout-stamp-milestone" onClick={() => ondoActions.setSurface({ kind: "labs" })}><Sparkles size={16} aria-hidden="true" />{copy.open}<ChevronRight size={16} aria-hidden="true" /></button>
      ) : recorded ? (
        <p className={styles.status} role="status"><Check size={15} aria-hidden="true" />{copy.recorded}</p>
      ) : (
        <button ref={retryRef} type="button" className={styles.primary} data-testid="visit-proof-check" onClick={confirmVisit}>{failure ? <RotateCcw size={16} aria-hidden="true" /> : <Footprints size={16} aria-hidden="true" />}{failure ? copy.retry : copy.confirm}</button>
      )}
      <small className={styles.boundary}>{copy.boundary}</small>
    </section>
  )
}
