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
    title: "Settings",
    lead: "Manage language, discovery choices, and My Korea content stored in this browser.",
    language: "Language",
    discovery: "Discovery choices",
    selected: (count: number) => `${count} selected`,
    editChoices: "Edit food, mood, and dietary interests",
    choicesBoundary: "These choices shape discovery context only. They never hide places or claim dietary support that has not been confirmed.",
    resetBoundary: "Restarting setup keeps your saved places and activity.",
    reset: "Set up ONDO again",
    resetFailed: "Setup could not be reset. Check browser storage and try again.",
    data: "Data in this browser",
    stored: "Stored on this device",
    reviewData: "Review storage and clear content",
    dataBoundary: "Saved places and trip activity stay in this browser. Account, Person, 19+, Payment, profile, activity signals, visit stamps, test receipts, and Labs stay on this device and are not sent outside the app.",
    clear: "Clear saved content",
    confirmTitle: "Clear saved content from this browser?",
    confirmBody: "This removes saved places, recent views, joined Tables, Local Signals, discovery choices, private notes, Account, Person, 19+, Payment, profile, activity signals, visit stamps, OOKRW Test receipts, After 19 preferences, and Labs state.",
    confirmBoundary: "Language and initial setup stay unchanged.",
    keep: "Keep content",
    cleared: "Saved content cleared from this browser.",
    clearFailed: "Saved content could not be cleared. Check browser storage and try again.",
  },
  ko: {
    title: "설정",
    lead: "언어와 탐색 선택, 내 한국에 이 브라우저가 저장한 내용을 관리하세요.",
    language: "언어",
    discovery: "탐색 선택",
    selected: (count: number) => `${count}개 선택됨`,
    editChoices: "음식·분위기·식이 조건 편집",
    choicesBoundary: "이 선택은 추천 맥락만 조정합니다. 장소를 숨기거나 확인되지 않은 식이 지원을 표시하지 않아요.",
    resetBoundary: "처음 설정을 다시 해도 저장한 장소와 활동은 유지됩니다.",
    reset: "ONDO 다시 설정하기",
    resetFailed: "시작 설정을 초기화하지 못했어요. 브라우저 저장 공간을 확인한 뒤 다시 시도해 주세요.",
    data: "이 브라우저의 데이터",
    stored: "이 기기에만 저장",
    reviewData: "저장 범위와 삭제 관리",
    dataBoundary: "저장한 장소와 여행 활동은 이 브라우저에 남습니다. 계정·본인·19+·결제·프로필·활동 신호·방문 스탬프·테스트 영수증·Labs도 이 기기에만 남고 앱 밖으로 전송되지 않습니다.",
    clear: "저장한 내용 지우기",
    confirmTitle: "이 브라우저의 저장 내용을 지울까요?",
    confirmBody: "저장한 장소, 최근 본 장소, 참여한 테이블, 로컬 시그널, 탐색 선택, 개인 메모, 계정·본인·19+·결제 상태, 프로필·활동 신호·방문 스탬프, OOKRW Test 영수증, After 19 설정과 Labs 상태를 삭제합니다.",
    confirmBoundary: "언어와 시작 설정은 유지됩니다.",
    keep: "내용 유지",
    cleared: "이 브라우저의 저장 내용을 지웠어요.",
    clearFailed: "저장 내용을 지우지 못했어요. 브라우저 저장 공간을 확인한 뒤 다시 시도해 주세요.",
  },
  ja: {
    title: "設定",
    lead: "言語、探索の設定、このブラウザに保存された「マイ韓国」の内容を管理します。",
    language: "言語",
    discovery: "探索の設定",
    selected: (count: number) => `${count}件選択中`,
    editChoices: "食、雰囲気、食事条件を編集",
    choicesBoundary: "これらの選択は探索の文脈だけを調整します。場所を隠したり、未確認の食事対応を表示したりすることはありません。",
    resetBoundary: "初期設定をやり直しても、保存した場所とアクティビティは残ります。",
    reset: "ONDOをもう一度設定",
    resetFailed: "初期設定をリセットできませんでした。ブラウザの保存容量を確認して、もう一度お試しください。",
    data: "このブラウザのデータ",
    stored: "この端末にのみ保存",
    reviewData: "保存範囲の確認と削除",
    dataBoundary: "保存した場所と旅のアクティビティはこのブラウザに残ります。アカウント、本人、19歳以上、決済、プロフィール、活動シグナル、訪問スタンプ、テストレシート、Labsもこの端末だけに残り、アプリの外には送信されません。",
    clear: "保存内容を削除",
    confirmTitle: "このブラウザの保存内容を削除しますか？",
    confirmBody: "保存した場所、最近見た場所、参加したTable、ローカルシグナル、探索設定、プライベートメモ、アカウント・本人・19歳以上・決済の状態、プロフィール・活動シグナル、訪問スタンプ、OOKRW Testのレシート、After 19設定、Labsの状態を削除します。",
    confirmBoundary: "言語と初期設定はそのまま残ります。",
    keep: "内容を残す",
    cleared: "このブラウザの保存内容を削除しました。",
    clearFailed: "保存内容を削除できませんでした。ブラウザの保存容量を確認して、もう一度お試しください。",
  },
} as const

function DeviceClearConfirmation({ locale, error, onCancel, onConfirm }: {
  locale: OndoBLocale
  error: boolean
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
        {error ? <p className={styles.settingsInlineAlert} role="alert" data-testid="ondo-b-clear-device-error">{copy.clearFailed}</p> : null}
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
  const [clearError, setClearError] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const clearButtonRef = useRef<HTMLButtonElement>(null)
  const resetButtonRef = useRef<HTMLButtonElement>(null)
  const locale = state.locale
  const copy = COPY[locale]
  const selectedPreferenceCount = state.discoveryPreferences.length

  function closeClear() {
    setClearOpen(false)
    setClearError(false)
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
      <header className={`${styles.header} ${styles.settingsHeader}`}>
        <img className={styles.settingsMark} src="/brand/ondo-mark-micro-24.svg" alt="" aria-hidden="true" />
        <div className={styles.settingsTitle}>
          <h1>{copy.title}</h1>
        </div>
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
              {resetError ? <p className={styles.settingsInlineAlert} role="alert" data-testid="ondo-b-onboarding-reset-status">{resetError}</p> : null}
              <button ref={resetButtonRef} type="button" onClick={() => {
                setResetError(null)
                if (!actions.resetOnboarding()) {
                  setResetError(copy.resetFailed)
                  window.requestAnimationFrame(() => resetButtonRef.current?.scrollIntoView({ block: "nearest" }))
                }
              }} data-testid="ondo-b-onboarding-reset">
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
            <button ref={clearButtonRef} className={styles.clearButton} type="button" onClick={() => { setClearError(false); setClearOpen(true) }} data-testid="ondo-b-clear-device-open">
              <RotateCcw size={17} aria-hidden="true" />
              {copy.clear}
            </button>
          </div>
        </details>
      </section>

      {clearOpen ? <DeviceClearConfirmation
        locale={locale}
        error={clearError}
        onCancel={closeClear}
        onConfirm={() => {
          const cleared = actions.clearBDeviceContent()
          setClearError(!cleared)
          if (cleared) {
            actions.notify(copy.cleared)
            closeClear()
          }
        }}
      /> : null}
    </div>
  )
}
