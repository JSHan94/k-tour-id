"use client"

import type { KeyboardEvent } from "react"
import { useEffect, useRef, useState } from "react"
import { ChevronRight, Languages, LockKeyhole, RotateCcw, SlidersHorizontal } from "lucide-react"
import { ONDO_B_DISCOVERY_PREFERENCES } from "../shared/state/ondo-b-preferences"
import { useOndoB } from "../shared/state/ondo-b-provider"
import { useModalIsolation } from "../shared/ui/use-modal-isolation"
import styles from "../shared/ui/production-local.module.css"

function DeviceClearConfirmation({ locale, onCancel, onConfirm }: {
  locale: "en" | "ko"
  onCancel(): void
  onConfirm(): void
}) {
  const layerRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
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
        <h2 id="b-clear-title">{locale === "ko" ? "이 브라우저의 저장 내용을 지울까요?" : "Clear saved content from this browser?"}</h2>
        <p>{locale === "ko" ? "저장한 장소, 최근 본 장소, 참여한 테이블, 로컬 시그널 기록, 탐색 선택, 개인 메모와 OOKRW Test 영수증을 삭제합니다." : "This removes saved places, recent views, joined Tables, Local Signal history, discovery choices, private notes, and OOKRW Test receipts."}</p>
        <strong>{locale === "ko" ? "언어와 시작 설정은 유지됩니다." : "Language and initial setup stay unchanged."}</strong>
        <div>
          <button ref={cancelRef} type="button" onClick={onCancel}>{locale === "ko" ? "내용 유지" : "Keep content"}</button>
          <button ref={confirmRef} type="button" onClick={onConfirm}>{locale === "ko" ? "저장 내용 지우기" : "Clear saved content"}</button>
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

  return (
    <div className={styles.screen} data-testid="ondo-b-settings-entry">
      <header className={styles.header}>
        <p>{locale === "ko" ? "내 기기" : "ON THIS DEVICE"}</p>
        <h1>{locale === "ko" ? "설정" : "Settings"}</h1>
        <span>{locale === "ko" ? "언어와 탐색 선택, 내 한국에 이 브라우저가 저장한 내용을 관리하세요." : "Manage language, discovery choices, and My Korea content stored in this browser."}</span>
      </header>

      <section className={styles.settingsSection} aria-labelledby="b-language-heading">
        <div className={styles.sectionHeading}><Languages size={18} aria-hidden="true" /><h2 id="b-language-heading">{locale === "ko" ? "언어" : "Language"}</h2></div>
        <div className={styles.segmented}>
          <button type="button" aria-pressed={locale === "en"} onClick={() => actions.setLocale("en")}>English</button>
          <button type="button" aria-pressed={locale === "ko"} onClick={() => actions.setLocale("ko")}>한국어</button>
        </div>
      </section>

      <section className={styles.settingsSection} aria-labelledby="b-choices-heading">
        <div className={styles.sectionHeading}><SlidersHorizontal size={18} aria-hidden="true" /><h2 id="b-choices-heading">{locale === "ko" ? "탐색 선택" : "Discovery choices"}</h2></div>
        <details className={styles.settingsDisclosure} data-testid="ondo-b-discovery-settings">
          <summary>
            <span>
              <strong>{locale === "ko" ? `${selectedPreferenceCount}개 선택됨` : `${selectedPreferenceCount} selected`}</strong>
              <small>{locale === "ko" ? "음식·분위기·식이 조건 편집" : "Edit food, mood, and dietary interests"}</small>
            </span>
            <ChevronRight size={18} aria-hidden="true" />
          </summary>
          <div className={styles.settingsDisclosureBody}>
            <p>{locale === "ko" ? "이 선택은 추천 맥락만 조정합니다. 공식 기록에서 지원 여부가 확인되지 않은 장소를 숨기거나 지원 장소로 표시하지 않아요." : "These choices shape discovery context only. They never hide places or claim support that official records do not confirm."}</p>
            <div className={styles.preferenceChips}>
              {ONDO_B_DISCOVERY_PREFERENCES.map((option) => (
                <button key={option.id} type="button" aria-pressed={state.discoveryPreferences.includes(option.id)} onClick={() => togglePreference(option.id)}>
                  {option.label[locale]}
                </button>
              ))}
            </div>
            <div className={styles.setupReset}>
              <p>{locale === "ko" ? "처음 설정을 다시 해도 저장한 장소와 활동은 유지됩니다." : "Restarting setup keeps your saved places and activity."}</p>
              <button type="button" onClick={() => actions.resetOnboarding()} data-testid="ondo-b-onboarding-reset">
                <RotateCcw size={17} aria-hidden="true" />
                {locale === "ko" ? "ONDO 다시 설정하기" : "Set up ONDO again"}
              </button>
            </div>
          </div>
        </details>
      </section>

      <section className={styles.settingsSection} aria-labelledby="b-privacy-heading">
        <div className={styles.sectionHeading}><LockKeyhole size={18} aria-hidden="true" /><h2 id="b-privacy-heading">{locale === "ko" ? "이 브라우저의 데이터" : "Data in this browser"}</h2></div>
        <details className={styles.settingsDisclosure} data-testid="ondo-b-device-data-settings">
          <summary>
            <span>
              <strong>{locale === "ko" ? "이 기기에만 저장" : "Stored on this device"}</strong>
              <small>{locale === "ko" ? "저장 범위와 삭제 관리" : "Review storage and clear content"}</small>
            </span>
            <ChevronRight size={18} aria-hidden="true" />
          </summary>
          <div className={styles.settingsDisclosureBody}>
            <p>{locale === "ko" ? "저장한 장소, 최근 조회, 참여한 테이블, 탐색 선택, 개인 메모, 게시한 로컬 시그널과 OOKRW Test 영수증은 이 브라우저에 남습니다. 신원 확인 결과와 지갑 연결 상태는 새로고침하면 초기화되며 외부로 전송되지 않습니다." : "Saved places, recent views, joined Tables, discovery choices, private notes, posted Local Signals, and OOKRW Test receipts stay in this browser. Identity results and wallet connection readiness reset on reload and are not sent outside the app."}</p>
            <button ref={clearButtonRef} className={styles.clearButton} type="button" onClick={() => setClearOpen(true)} data-testid="ondo-b-clear-device-open">
              <RotateCcw size={17} aria-hidden="true" />
              {locale === "ko" ? "저장한 내용 지우기" : "Clear saved content"}
            </button>
          </div>
        </details>
      </section>

      {clearOpen ? <DeviceClearConfirmation
        locale={locale}
        onCancel={closeClear}
        onConfirm={() => {
          const cleared = actions.clearBDeviceContent()
          actions.notify(cleared
            ? locale === "ko" ? "이 브라우저의 저장 내용을 지웠어요." : "Saved content cleared from this browser."
            : locale === "ko" ? "저장 내용을 지우지 못했어요. 브라우저 저장 공간을 확인한 뒤 다시 시도해 주세요." : "Saved content could not be cleared. Check browser storage and try again.")
          closeClear()
        }}
      /> : null}
    </div>
  )
}
