"use client"

import type { KeyboardEvent } from "react"
import { useEffect, useRef, useState } from "react"
import { ChevronRight, Languages, LockKeyhole, RotateCcw, SlidersHorizontal } from "lucide-react"
import { ONDO_B_DISCOVERY_PREFERENCES, type OndoBLocale } from "../shared/state/ondo-b-preferences"
import { useOndoB } from "../shared/state/ondo-b-provider"
import { useModalIsolation } from "../shared/ui/use-modal-isolation"
import styles from "../shared/ui/production-local.module.css"

const COPY = {
  en: {
    eyebrow: "ON THIS DEVICE",
    title: "Settings",
    lead: "Manage language, discovery choices, and My Korea content stored in this browser.",
    language: "Language",
    discovery: "Discovery choices",
    selected: (count: number) => `${count} selected`,
    editChoices: "Edit food, mood, and dietary interests",
    choicesBoundary: "These choices shape discovery context only. They never hide places or claim support that official records do not confirm.",
    resetBoundary: "Restarting setup keeps your saved places and activity.",
    reset: "Set up ONDO again",
    data: "Data in this browser",
    stored: "Stored on this device",
    reviewData: "Review storage and clear content",
    dataBoundary: "Saved places, recent views, joined Tables, discovery choices, private notes, posted Local Signals, and OOKRW Test receipts stay in this browser. Identity results and wallet connection readiness reset on reload and are not sent outside the app.",
    clear: "Clear saved content",
    confirmTitle: "Clear saved content from this browser?",
    confirmBody: "This removes saved places, recent views, joined Tables, Local Signal history, discovery choices, private notes, and OOKRW Test receipts.",
    confirmBoundary: "Language and initial setup stay unchanged.",
    keep: "Keep content",
    cleared: "Saved content cleared from this browser.",
    clearFailed: "Saved content could not be cleared. Check browser storage and try again.",
  },
  ko: {
    eyebrow: "내 기기",
    title: "설정",
    lead: "언어와 탐색 선택, 내 한국에 이 브라우저가 저장한 내용을 관리하세요.",
    language: "언어",
    discovery: "탐색 선택",
    selected: (count: number) => `${count}개 선택됨`,
    editChoices: "음식·분위기·식이 조건 편집",
    choicesBoundary: "이 선택은 추천 맥락만 조정합니다. 공식 기록에서 지원 여부가 확인되지 않은 장소를 숨기거나 지원 장소로 표시하지 않아요.",
    resetBoundary: "처음 설정을 다시 해도 저장한 장소와 활동은 유지됩니다.",
    reset: "ONDO 다시 설정하기",
    data: "이 브라우저의 데이터",
    stored: "이 기기에만 저장",
    reviewData: "저장 범위와 삭제 관리",
    dataBoundary: "저장한 장소, 최근 조회, 참여한 테이블, 탐색 선택, 개인 메모, 게시한 로컬 시그널과 OOKRW Test 영수증은 이 브라우저에 남습니다. 신원 확인 결과와 지갑 연결 상태는 새로고침하면 초기화되며 외부로 전송되지 않습니다.",
    clear: "저장한 내용 지우기",
    confirmTitle: "이 브라우저의 저장 내용을 지울까요?",
    confirmBody: "저장한 장소, 최근 본 장소, 참여한 테이블, 로컬 시그널 기록, 탐색 선택, 개인 메모와 OOKRW Test 영수증을 삭제합니다.",
    confirmBoundary: "언어와 시작 설정은 유지됩니다.",
    keep: "내용 유지",
    cleared: "이 브라우저의 저장 내용을 지웠어요.",
    clearFailed: "저장 내용을 지우지 못했어요. 브라우저 저장 공간을 확인한 뒤 다시 시도해 주세요.",
  },
  ja: {
    eyebrow: "この端末",
    title: "設定",
    lead: "言語、探索の設定、このブラウザに保存された「マイ韓国」の内容を管理します。",
    language: "言語",
    discovery: "探索の設定",
    selected: (count: number) => `${count}件選択中`,
    editChoices: "食、雰囲気、食事条件を編集",
    choicesBoundary: "これらの選択は探索の文脈だけを調整します。公式記録で対応が確認されていない場所を隠したり、対応済みと表示したりすることはありません。",
    resetBoundary: "初期設定をやり直しても、保存した場所とアクティビティは残ります。",
    reset: "ONDOをもう一度設定",
    data: "このブラウザのデータ",
    stored: "この端末にのみ保存",
    reviewData: "保存範囲の確認と削除",
    dataBoundary: "保存した場所、最近見た場所、参加したテーブル、探索の設定、プライベートメモ、投稿したローカルシグナル、OOKRW Testのレシートはこのブラウザに保存されます。本人確認の結果とウォレットの接続状態は再読み込みするとリセットされ、外部には送信されません。",
    clear: "保存内容を削除",
    confirmTitle: "このブラウザの保存内容を削除しますか？",
    confirmBody: "保存した場所、最近見た場所、参加したテーブル、ローカルシグナル履歴、探索の設定、プライベートメモ、OOKRW Testのレシートを削除します。",
    confirmBoundary: "言語と初期設定はそのまま残ります。",
    keep: "内容を残す",
    cleared: "このブラウザの保存内容を削除しました。",
    clearFailed: "保存内容を削除できませんでした。ブラウザの保存容量を確認して、もう一度お試しください。",
  },
} as const

function DeviceClearConfirmation({ locale, onCancel, onConfirm }: {
  locale: OndoBLocale
  onCancel(): void
  onConfirm(): void
}) {
  const layerRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const copy = COPY[locale]
  useModalIsolation(true, layerRef)

  useEffect(() => {
    cancelRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <div className={styles.confirmLayer} ref={layerRef} role="dialog" aria-modal="true" aria-labelledby="b-clear-title" data-testid="ondo-b-clear-device-confirm" onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") { event.preventDefault(); onCancel(); return }
      if (event.key !== "Tab") return
      if (event.shiftKey && document.activeElement === cancelRef.current) { event.preventDefault(); confirmRef.current?.focus() }
      else if (!event.shiftKey && document.activeElement === confirmRef.current) { event.preventDefault(); cancelRef.current?.focus() }
    }}>
      <div className={styles.confirmCard}>
        <h2 id="b-clear-title">{copy.confirmTitle}</h2>
        <p>{copy.confirmBody}</p>
        <strong>{copy.confirmBoundary}</strong>
        <div>
          <button ref={cancelRef} type="button" onClick={onCancel}>{copy.keep}</button>
          <button ref={confirmRef} type="button" onClick={onConfirm}>{copy.clear}</button>
        </div>
      </div>
    </div>
  )
}

export function SettingsEntryB() {
  const { state, actions } = useOndoB()
  const [clearOpen, setClearOpen] = useState(false)
  const clearButtonRef = useRef<HTMLButtonElement>(null)
  const locale = state.locale
  const copy = COPY[locale]
  const selectedPreferenceCount = state.discoveryPreferences.length

  function closeClear() {
    setClearOpen(false)
    window.requestAnimationFrame(() => clearButtonRef.current?.focus({ preventScroll: true }))
  }

  function togglePreference(id: (typeof ONDO_B_DISCOVERY_PREFERENCES)[number]["id"]) {
    actions.setDiscoveryPreferences(state.discoveryPreferences.includes(id)
      ? state.discoveryPreferences.filter((preference) => preference !== id)
      : [...state.discoveryPreferences, id])
  }

  function setLocale(nextLocale: OndoBLocale) {
    actions.setLocale(nextLocale)
  }

  return (
    <div className={styles.screen} data-testid="ondo-b-settings-entry" data-visual-direction="warm-living-atlas">
      <header className={styles.header}>
        <p>{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <span>{copy.lead}</span>
      </header>

      <section className={styles.settingsSection} aria-labelledby="b-language-heading">
        <div className={styles.sectionHeading}><Languages size={18} aria-hidden="true" /><h2 id="b-language-heading">{copy.language}</h2></div>
        <div className={styles.segmented} role="group" aria-label={copy.language} data-testid="settings-language-control">
          <button type="button" aria-pressed={locale === "en"} onClick={() => setLocale("en")}>English</button>
          <button type="button" aria-pressed={locale === "ko"} onClick={() => setLocale("ko")}>한국어</button>
          <button type="button" aria-pressed={locale === "ja"} onClick={() => setLocale("ja")}>日本語</button>
        </div>
      </section>

      <section className={styles.settingsSection} aria-labelledby="b-choices-heading">
        <div className={styles.sectionHeading}><SlidersHorizontal size={18} aria-hidden="true" /><h2 id="b-choices-heading">{copy.discovery}</h2></div>
        <details className={styles.settingsDisclosure} data-testid="ondo-b-discovery-settings">
          <summary>
            <span>
              <strong>{copy.selected(selectedPreferenceCount)}</strong>
              <small>{copy.editChoices}</small>
            </span>
            <ChevronRight size={18} aria-hidden="true" />
          </summary>
          <div className={styles.settingsDisclosureBody}>
            <p>{copy.choicesBoundary}</p>
            <div className={styles.preferenceChips}>
              {ONDO_B_DISCOVERY_PREFERENCES.map((option) => (
                <button key={option.id} type="button" aria-pressed={state.discoveryPreferences.includes(option.id)} onClick={() => togglePreference(option.id)}>
                  {option.label[locale]}
                </button>
              ))}
            </div>
            <div className={styles.setupReset}>
              <p>{copy.resetBoundary}</p>
              <button type="button" onClick={() => actions.resetOnboarding()} data-testid="ondo-b-onboarding-reset">
                <RotateCcw size={17} aria-hidden="true" />
                {copy.reset}
              </button>
            </div>
          </div>
        </details>
      </section>

      <section className={styles.settingsSection} aria-labelledby="b-privacy-heading">
        <div className={styles.sectionHeading}><LockKeyhole size={18} aria-hidden="true" /><h2 id="b-privacy-heading">{copy.data}</h2></div>
        <details className={styles.settingsDisclosure} data-testid="ondo-b-device-data-settings">
          <summary>
            <span>
              <strong>{copy.stored}</strong>
              <small>{copy.reviewData}</small>
            </span>
            <ChevronRight size={18} aria-hidden="true" />
          </summary>
          <div className={styles.settingsDisclosureBody}>
            <p>{copy.dataBoundary}</p>
            <button ref={clearButtonRef} className={styles.clearButton} type="button" onClick={() => setClearOpen(true)} data-testid="ondo-b-clear-device-open">
              <RotateCcw size={17} aria-hidden="true" />
              {copy.clear}
            </button>
          </div>
        </details>
      </section>

      {clearOpen ? <DeviceClearConfirmation
        locale={locale}
        onCancel={closeClear}
        onConfirm={() => {
          const cleared = actions.clearBDeviceContent()
          actions.notify(cleared ? copy.cleared : copy.clearFailed)
          closeClear()
        }}
      /> : null}
    </div>
  )
}
