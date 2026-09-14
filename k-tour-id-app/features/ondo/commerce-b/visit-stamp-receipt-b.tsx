"use client"

import { useEffect, useRef, useState } from "react"
import { Check, ChevronRight, Footprints, LoaderCircle, RotateCcw, Sparkles } from "lucide-react"
import { canonicalMapVenueById } from "@/lib/ondo/venues/map-data"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import { useOndoB } from "../shared/state/ondo-b-provider"
import { useBActivityProfile } from "../identity-b/activity-profile-b-provider"
import { useQaControls } from "../shared/ui/use-qa-controls"
import styles from "./visit-stamp-receipt-b.module.css"

const COPY = {
  en: {
    title: "Remember this visit",
    body: "Your meal balance and visit history stay separate. Check this visit when you’re here.",
    confirm: "Check this visit",
    checking: "Checking visit",
    recorded: "Visit saved",
    duplicate: "Already recorded",
    failed: "Couldn’t save the visit in this tab.",
    retry: "Try again",
    details: "Privacy & visit details",
    boundary: "This front-end check uses local place evidence. No live venue or location provider is connected.",
    milestone: "10th place reached",
    milestoneBody: "An optional souvenir is ready in Labs.",
    open: "View souvenir",
    reviewScope: "Review visit · no external visit confirmation",
    unavailable: "Visit check isn’t available here yet",
  },
  ko: {
    title: "이번 방문 기억하기",
    body: "여행 잔액과 방문 기록은 별개예요. 현장에서 이 방문을 확인하세요.",
    confirm: "방문 확인",
    checking: "방문 확인 중",
    recorded: "방문 저장됨",
    duplicate: "이미 기록됨",
    failed: "이 탭에 방문 기록을 저장하지 못했어요.",
    retry: "다시 시도",
    details: "개인정보 및 방문 기록 안내",
    boundary: "프런트엔드 로컬 장소 근거를 사용합니다. 실시간 장소·위치 제공자는 연결되어 있지 않습니다.",
    milestone: "열 번째 장소 도착",
    milestoneBody: "선택형 기념품이 Labs에 준비됐어요.",
    open: "기념품 보기",
    reviewScope: "검토용 방문 기록 · 외부 방문 확인 없음",
    unavailable: "아직 여기서는 방문을 확인할 수 없어요",
  },
  ja: {
    title: "この訪問を記録",
    body: "旅の残高と訪問履歴は別です。現地でこの訪問を確認してください。",
    confirm: "訪問を確認",
    checking: "訪問を確認中",
    recorded: "訪問を保存しました",
    duplicate: "記録済みです",
    failed: "このタブに訪問を保存できませんでした。",
    retry: "もう一度試す",
    details: "プライバシー・訪問記録の詳細",
    boundary: "フロントエンドのローカルな場所証跡を使います。店舗・位置情報のライブ提供元には接続していません。",
    milestone: "10か所目に到達",
    milestoneBody: "任意の記念アイテムをLabsで確認できます。",
    open: "記念アイテムを見る",
    reviewScope: "検証用の訪問記録・外部での訪問確認なし",
    unavailable: "ここではまだ訪問を確認できません",
  },
} as const

export function VisitStampReceiptB({ locale, venueId }: { locale: OndoBLocale; venueId: string }) {
  const reviewMode = useQaControls()
  const { state, actions } = useBActivityProfile()
  const { actions: ondoActions } = useOndoB()
  const [failure, setFailure] = useState(false)
  const [duplicate, setDuplicate] = useState(false)
  const [checking, setChecking] = useState(false)
  const retryRef = useRef<HTMLButtonElement>(null)
  const proofFrameRef = useRef<number | null>(null)
  const evidenceId = `visit:${venueId}`
  const recorded = state.acceptedEvidenceIds.includes(evidenceId)
  const copy = COPY[locale]

  useEffect(() => () => {
    if (proofFrameRef.current != null) window.cancelAnimationFrame(proofFrameRef.current)
  }, [])

  function confirmVisit() {
    if (!reviewMode) return
    setFailure(false)
    setDuplicate(false)
    setChecking(true)
    proofFrameRef.current = window.requestAnimationFrame(() => {
      proofFrameRef.current = window.requestAnimationFrame(() => {
        proofFrameRef.current = null
        const hasLocalPlaceEvidence = Boolean(canonicalMapVenueById(venueId))
        const result = hasLocalPlaceEvidence ? actions.recordUniqueVisit(evidenceId) : "invalid"
        setChecking(false)
        if (result === "accepted") return
        if (result === "duplicate") {
          setDuplicate(true)
          return
        }
        setFailure(true)
        window.requestAnimationFrame(() => retryRef.current?.focus({ preventScroll: true }))
      })
    })
  }

  return (
    <section className={styles.root} data-testid="visit-stamp-receipt" data-recorded={recorded} data-proof-state={checking ? "checking" : recorded ? "saved" : failure ? "failed" : "idle"} data-stamp-count={state.stamps}>
      <div className={styles.heading}>
        <span><Footprints size={20} aria-hidden="true" /></span>
        <div><h3>{recorded && state.stamps === 10 ? copy.milestone : copy.title}</h3><p>{recorded && state.stamps === 10 ? copy.milestoneBody : copy.body}</p></div>
        <strong>{state.stamps}<small>/10</small></strong>
      </div>
      <div className={styles.track} role="img" aria-label={`${state.stamps}/10`}>
        {Array.from({ length: 10 }, (_, index) => <i key={index} data-filled={index < state.stamps}>{index < state.stamps ? <Check size={10} aria-hidden="true" /> : null}</i>)}
      </div>
      {reviewMode || recorded ? <p className={styles.reviewScope} data-testid="visit-review-provenance"><Sparkles size={14} aria-hidden="true" />{copy.reviewScope}</p> : null}
      {failure ? <p className={styles.error} role="alert">{copy.failed}</p> : null}
      {duplicate ? <p className={styles.status} role="status">{copy.duplicate}</p> : null}
      {recorded && state.stamps === 10 ? (
        <button type="button" className={styles.primary} data-testid="checkout-stamp-milestone" onClick={() => ondoActions.setSurface({ kind: "labs" })}><Sparkles size={16} aria-hidden="true" />{copy.open}<ChevronRight size={16} aria-hidden="true" /></button>
      ) : recorded ? (
        <p className={styles.status} role="status"><Check size={15} aria-hidden="true" />{copy.recorded}</p>
      ) : reviewMode ? (
        <button ref={retryRef} type="button" className={styles.primary} data-testid="visit-proof-check" disabled={checking} aria-busy={checking} onClick={confirmVisit}>{checking ? <LoaderCircle className={styles.spinner} size={16} aria-hidden="true" /> : failure ? <RotateCcw size={16} aria-hidden="true" /> : <Footprints size={16} aria-hidden="true" />}{checking ? copy.checking : failure ? copy.retry : copy.confirm}</button>
      ) : <p className={styles.unavailable}><Footprints size={15} aria-hidden="true" />{copy.unavailable}</p>}
      <details className={styles.details} data-testid="visit-stamp-details">
        <summary>{copy.details}<ChevronRight size={14} aria-hidden="true" /></summary>
        <p>{copy.boundary}</p>
      </details>
    </section>
  )
}
