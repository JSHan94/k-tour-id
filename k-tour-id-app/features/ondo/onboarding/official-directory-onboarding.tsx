"use client"

import type { KeyboardEvent } from "react"
import { useMemo, useEffect, useRef, useState } from "react"
import { ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, Compass, Database, KeyRound, NotebookPen } from "lucide-react"
import type { OndoBDiscoveryPreference, OndoBLocale, OndoBPersona } from "../shared/state/ondo-b-preferences"
import { ONDO_B_DISCOVERY_PREFERENCES } from "../shared/state/ondo-b-preferences"
import { useOndoB } from "../shared/state/ondo-b-provider"
import { focusFirstAvailableDestination } from "../shared/ui/focus-destination"
import styles from "./official-directory-onboarding.module.css"

type Step = "value" | "intent" | "preferences"

const FOCUSABLE = "a[href],button:not([disabled]),summary,input:not([disabled]):not([type='hidden']),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])"

const PERSONAS: ReadonlyArray<{
  id: OndoBPersona
  icon: typeof Compass
  label: Record<OndoBLocale, string>
  note: Record<OndoBLocale, string>
}> = [
  {
    id: "travelling",
    icon: Compass,
    label: { en: "I’m travelling in Korea", ko: "한국을 여행 중이에요", ja: "韓国を旅行中" },
    note: { en: "Find a useful meal near where you are now.", ko: "지금 머무는 곳 가까이에서 한 끼를 찾아요.", ja: "今いる場所の近くで食事を探します。" },
  },
  {
    id: "preparing",
    icon: CalendarDays,
    label: { en: "I’m preparing a Korea trip", ko: "한국 여행을 준비 중이에요", ja: "韓国旅行を準備中" },
    note: { en: "Explore and save places before you arrive.", ko: "도착 전에 장소를 둘러보고 저장해요.", ja: "出発前に場所を探して保存します。" },
  },
  {
    id: "local_contributor",
    icon: NotebookPen,
    label: { en: "I contribute local food knowledge", ko: "로컬 식음료 정보를 나누고 싶어요", ja: "現地の食情報を共有したい" },
    note: { en: "Start from official records and keep your own local notes.", ko: "공식 기록에서 시작해 나만의 로컬 메모를 남겨요.", ja: "公式記録を起点に、自分の現地メモを残します。" },
  },
]

const COPY = {
  en: {
    dialog: "ONDO guest setup",
    back: "Go back",
    progress: "Setup progress",
    eyebrow: "Official places, shaped around you",
    title: "Find a meal that fits your Korea—grounded in public records.",
    body: "Browse 400 licensed food-service records across Seoul and Busan, then save a starting intent and food preferences on this device.",
    categoryLabel: "What the directory knows",
    category: "The 200 records in each city come from the Ministry of the Interior and Safety LOCALDATA source. Categories use only each record’s official business type.",
    boundaryLabel: "Coverage boundary",
    boundary: "The source confirms an active licence at its Aug 19, 2026 snapshot. Current hours, menu, popularity, price and payment support are not provided.",
    sourceSummary: "Official source · what it confirms",
    start: "Set guest preferences",
    guest: "Explore without setup",
    identityTitle: "Set up K-Tour ID",
    identityNote: "Optional simulated identity route · guest Explore stays open",
    intentTitle: "What brings you to ONDO?",
    intentBody: "This choice stays on this device. Every option opens the same guest Explore and does not unlock or restrict features.",
    continueToPreferences: "Choose food preferences",
    skip: "Skip and explore",
    preferenceTitle: "What food and dietary needs are you looking for?",
    preferenceBody: "Choose anything useful. These preferences do not hide or relabel official records, and you can change them later in Settings.",
    mealGroup: "Food interests",
    moodGroup: "Mood and timing",
    dietaryGroup: "Dietary needs",
    dietaryBoundary: "Official records do not confirm dietary support. Check with each place before relying on a selection.",
    finish: "Open guest Explore",
    localeFailed: "Language could not be saved on this device.",
    intentFailed: "Intent could not be saved.",
    setupFailed: "Setup could not be saved.",
    guestFailed: "Guest setup could not be saved.",
  },
  ko: {
    dialog: "ONDO 게스트 시작 설정",
    back: "뒤로",
    progress: "시작 설정 진행",
    eyebrow: "공식 장소를 나에게 맞게",
    title: "나에게 맞는 한국의 한 끼를, 공공 기록에서 찾아보세요.",
    body: "서울과 부산의 일반음식점 인허가 기록 400개를 살펴보고, 이용 목적과 음식 취향을 이 기기에 저장할 수 있어요.",
    categoryLabel: "디렉터리가 아는 것",
    category: "각 도시 200개 기록은 행정안전부 LOCALDATA 출처에서 가져오며, 분류는 공식 업태구분명만을 사용합니다.",
    boundaryLabel: "확인 범위",
    boundary: "출처는 2026년 8월 19일 기준 유효 인허가 상태를 확인합니다. 현재 영업시간·메뉴·인기도·가격·결제 지원은 제공하지 않습니다.",
    sourceSummary: "공식 출처 · 확인 범위",
    start: "게스트 취향 설정",
    guest: "설정 없이 탐색",
    identityTitle: "K-Tour ID 설정",
    identityNote: "선택형 신원 경로 시뮬레이션 · 게스트 탐색은 그대로",
    intentTitle: "어떤 목적으로 ONDO를 찾았나요?",
    intentBody: "선택은 이 기기에만 저장됩니다. 세 선택 모두 같은 게스트 탐색으로 이어지며 기능을 열거나 제한하지 않아요.",
    continueToPreferences: "음식 취향 고르기",
    skip: "건너뛰고 탐색",
    preferenceTitle: "어떤 음식과 식이 조건을 찾고 있나요?",
    preferenceBody: "필요한 항목을 골라보세요. 공식 기록을 숨기거나 새 라벨을 붙이지 않으며 나중에 설정에서 바꿀 수 있어요.",
    mealGroup: "음식 관심사",
    moodGroup: "분위기와 시간",
    dietaryGroup: "식이 요구사항",
    dietaryBoundary: "공식 기록은 식이 요구사항 지원 여부를 확인하지 않습니다. 선택에 의존하기 전에 각 장소에 직접 확인해 주세요.",
    finish: "게스트 탐색 열기",
    localeFailed: "언어 설정을 이 기기에 저장하지 못했어요.",
    intentFailed: "이용 목적을 저장하지 못했어요.",
    setupFailed: "시작 설정을 저장하지 못했어요.",
    guestFailed: "게스트 시작 설정을 저장하지 못했어요.",
  },
  ja: {
    dialog: "ONDO ゲスト設定",
    back: "戻る",
    progress: "設定の進行状況",
    eyebrow: "公式記録から、自分らしい旅へ",
    title: "韓国で自分に合う一食を、公的な記録から探そう。",
    body: "ソウルと釜山の飲食店営業許可記録400件を見ながら、旅の目的や食の好みをこの端末に保存できます。",
    categoryLabel: "このディレクトリで分かること",
    category: "各都市200件の記録は韓国行政安全部のLOCALDATAを出典とし、分類には公式の業種名のみを使用しています。",
    boundaryLabel: "確認できる範囲",
    boundary: "出典日時点（2026年8月19日）の有効な営業許可を示します。現在の営業時間、メニュー、人気、価格、決済対応は確認できません。",
    sourceSummary: "公式出典 · 確認できる範囲",
    start: "ゲストの好みを設定",
    guest: "設定せずに見る",
    identityTitle: "K-Tour IDを設定",
    identityNote: "任意の本人確認ルートをシミュレーション · ゲスト利用はそのまま",
    intentTitle: "ONDOを使う目的は？",
    intentBody: "選択内容はこの端末にのみ保存されます。どの選択肢でも同じゲスト向けの「探す」画面が開き、機能の解放や制限には使いません。",
    continueToPreferences: "食の好みを選ぶ",
    skip: "スキップして見る",
    preferenceTitle: "どんな食事や食の希望・制限がありますか？",
    preferenceBody: "役立つ項目を選んでください。公式記録を非表示にしたり別のラベルを付けたりせず、後から設定で変更できます。",
    mealGroup: "食の興味",
    moodGroup: "雰囲気・時間帯",
    dietaryGroup: "食の希望・制限",
    dietaryBoundary: "公式記録では食の希望・制限への対応を確認できません。利用前に各店舗へ直接確認してください。",
    finish: "ゲスト向けの「探す」を開く",
    localeFailed: "言語設定をこの端末に保存できませんでした。",
    intentFailed: "利用目的を保存できませんでした。",
    setupFailed: "初期設定を保存できませんでした。",
    guestFailed: "ゲスト設定を保存できませんでした。",
  },
} satisfies Record<OndoBLocale, Record<string, string>>

export function OfficialDirectoryOnboardingLayer() {
  const { state, actions } = useOndoB()
  const [step, setStep] = useState<Step>("value")
  const [preferences, setPreferences] = useState<OndoBDiscoveryPreference[]>([])
  const [saveError, setSaveError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const previousOnboardingRef = useRef(state.onboarding)
  const focusValueActionRef = useRef(false)
  const copy = COPY[state.locale]
  const stepIndex = useMemo(() => ({ value: 1, intent: 2, preferences: 3 })[step], [step])

  useEffect(() => {
    focusValueActionRef.current = previousOnboardingRef.current === "ONB-COMPLETE" && state.onboarding === "ONB-NEW"
    previousOnboardingRef.current = state.onboarding
    if (state.onboarding !== "ONB-NEW") return
    setStep("value")
    setPreferences([])
    setSaveError(null)
  }, [state.onboarding])

  useEffect(() => {
    if (state.toast) setSaveError(state.toast)
  }, [state.toast])

  useEffect(() => {
    if (!state.hydrated || state.onboarding === "ONB-COMPLETE") return
    const frame = window.requestAnimationFrame(() => {
      const dialog = dialogRef.current
      if (!dialog) return
      dialog.scrollTop = 0
      const preferred = dialog.querySelector<HTMLElement>("[data-onboarding-initial-focus]")
      const dialogBounds = dialog.getBoundingClientRect()
      const preferredBounds = preferred?.getBoundingClientRect()
      const preferredIsFullyVisible = Boolean(preferredBounds
        && preferredBounds.top >= dialogBounds.top
        && preferredBounds.right <= dialogBounds.right
        && preferredBounds.bottom <= dialogBounds.bottom
        && preferredBounds.left >= dialogBounds.left)
      const resetAction = step === "value" && focusValueActionRef.current && preferredIsFullyVisible ? preferred : null
      ;(resetAction ?? (step === "value" ? dialog : preferredIsFullyVisible ? preferred : dialog))?.focus({ preventScroll: true })
      if (step === "value") focusValueActionRef.current = false
    })
    return () => window.cancelAnimationFrame(frame)
  }, [state.hydrated, state.onboarding, step])

  if (!state.hydrated || state.onboarding === "ONB-COMPLETE") return null

  const focusExplore = () => {
    focusFirstAvailableDestination([
      "[data-testid='ondo-b-nation'] [data-city='seoul']",
      "[data-testid='ondo-b-map-entry'] button",
      "[data-testid='nav-ondo']",
    ])
  }

  const showRecovery = (message: string) => {
    setSaveError(message)
    window.requestAnimationFrame(() => dialogRef.current
      ?.querySelector<HTMLElement>("[data-onboarding-recovery='true']")
      ?.scrollIntoView({ block: "end" }))
  }

  const finish = () => {
    if (!actions.completeOnboarding(preferences)) {
      showRecovery(copy.setupFailed)
      return
    }
    focusExplore()
  }

  const skip = () => {
    if (!actions.skipOnboarding()) {
      showRecovery(copy.guestFailed)
      return
    }
    setPreferences([])
    focusExplore()
  }

  const changeLocale = (locale: OndoBLocale) => {
    if (actions.setLocale(locale)) setSaveError(null)
    else showRecovery(copy.localeFailed)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault()
      event.stopPropagation()
      skip()
      return
    }
    if (event.key !== "Tab") return
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
      .filter((element) => element.offsetParent !== null)
    const first = focusable[0]
    const last = focusable.at(-1)
    if (!first || !last) {
      event.preventDefault()
      dialogRef.current?.focus()
      return
    }
    if (document.activeElement === dialogRef.current) {
      event.preventDefault()
      ;(event.shiftKey ? last : first).focus()
      return
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div className={styles.backdrop} data-testid="ondo-onboarding-backdrop">
      <section
        ref={dialogRef}
        className={styles.layer}
        data-testid="ondo-onboarding"
        data-visual-direction="arc-narrative"
        data-onboarding-step={step}
        role="dialog"
        aria-modal="true"
        aria-label={copy.dialog}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <header className={styles.header}>
          {step === "value" ? <span /> : (
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setStep(step === "preferences" ? "intent" : "value")}
              aria-label={copy.back}
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
          )}
          <div
            className={styles.progress}
            role="progressbar"
            aria-label={copy.progress}
            aria-valuemin={1}
            aria-valuemax={3}
            aria-valuenow={stepIndex}
          >
            {[1, 2, 3].map((item) => <i key={item} className={item <= stepIndex ? styles.progressActive : undefined} />)}
          </div>
          <div className={styles.language} role="group" aria-label="Language / 언어 / 言語" data-testid="onboarding-language-control">
            <button type="button" data-locale-choice="en" aria-label="View in English" aria-pressed={state.locale === "en"} onClick={() => changeLocale("en")}>EN</button>
            <button type="button" data-locale-choice="ko" aria-label="한국어로 보기" aria-pressed={state.locale === "ko"} onClick={() => changeLocale("ko")}>KO</button>
            <button type="button" data-locale-choice="ja" aria-label="日本語で表示" aria-pressed={state.locale === "ja"} onClick={() => changeLocale("ja")}>JA</button>
          </div>
        </header>

        {step === "value" ? (
          <div className={styles.value} data-testid="onboarding-step-value" data-stage="value">
            <div className={styles.seal}><Database size={26} aria-hidden="true" /><span>ONDO</span></div>
            <p className={styles.eyebrow}>{copy.eyebrow}</p>
            <h1>{copy.title}</h1>
            <p className={styles.lead}>{copy.body}</p>
            <div className={`${styles.actions} ${saveError ? styles.actionsRecovery : ""}`} data-onboarding-recovery={saveError ? "true" : undefined}>
              {saveError ? <p className={styles.inlineAlert} role="alert" data-testid="onboarding-save-status">{saveError}</p> : null}
              <button
                type="button"
                data-onboarding-initial-focus
                className={styles.primary}
                    onClick={() => {
                      setSaveError(null)
                      actions.beginOnboarding()
                  setStep("intent")
                }}
              >
                {copy.start}<ArrowRight size={18} aria-hidden="true" />
              </button>
              <button type="button" className={styles.secondary} onClick={skip}>{copy.guest}</button>
            </div>
            <button
              type="button"
              className={styles.identityEntry}
              data-testid="k-tour-id-setup-open"
              onClick={() => actions.openIdentitySetup("onboarding")}
            >
              <span data-testid="onboarding-ktour-id-open"><KeyRound size={19} aria-hidden="true" /></span>
              <span><strong>{copy.identityTitle}</strong><small>{copy.identityNote}</small></span>
              <span>SIMULATED</span>
              <ChevronRight size={18} aria-hidden="true" />
            </button>
            <details className={styles.sourceIntro} data-testid="onboarding-source-boundary">
              <summary>{copy.sourceSummary}<ChevronRight size={16} aria-hidden="true" /></summary>
              <div className={styles.sourceBody}>
                <p><strong>{copy.categoryLabel}</strong><span>{copy.category}</span></p>
                <p><strong>{copy.boundaryLabel}</strong><span>{copy.boundary}</span></p>
              </div>
            </details>
          </div>
        ) : null}

        {step === "intent" ? (
          <div className={styles.panel} data-testid="onboarding-step-intent" data-stage="intent">
            <div className={styles.heading}>
              <span>02</span>
              <h1>{copy.intentTitle}</h1>
              <p>{copy.intentBody}</p>
            </div>
            <div className={styles.personas}>
              {PERSONAS.map((persona) => {
                const Icon = persona.icon
                const selected = state.persona === persona.id
                return (
                  <button
                    key={persona.id}
                    type="button"
                    data-onboarding-initial-focus={persona.id === "travelling" ? "true" : undefined}
                    aria-pressed={selected}
                    className={selected ? styles.personaSelected : styles.persona}
                    onClick={() => {
                      if (actions.setPersona(persona.id)) setSaveError(null)
                      else showRecovery(copy.intentFailed)
                    }}
                    data-testid={`persona-${persona.id}`}
                  >
                    <span className={styles.personaIcon}><Icon size={20} aria-hidden="true" /></span>
                    <span><strong>{persona.label[state.locale]}</strong><small>{persona.note[state.locale]}</small></span>
                    <i aria-hidden="true">{selected ? <Check size={15} /> : null}</i>
                  </button>
                )
              })}
            </div>
            <div className={`${styles.actions} ${saveError ? styles.actionsRecovery : ""}`} data-onboarding-recovery={saveError ? "true" : undefined}>
              {saveError ? <p className={styles.inlineAlert} role="alert" data-testid="onboarding-save-status">{saveError}</p> : null}
              <button type="button" className={styles.primary} disabled={!state.persona} onClick={() => setStep("preferences")}>
                {copy.continueToPreferences}<ArrowRight size={18} aria-hidden="true" />
              </button>
              <button type="button" className={styles.secondary} onClick={skip}>{copy.skip}</button>
            </div>
          </div>
        ) : null}

        {step === "preferences" ? (
          <div className={styles.panel} data-testid="onboarding-step-preferences" data-stage="preferences">
            <div className={styles.heading}>
              <span>03</span>
              <h1>{copy.preferenceTitle}</h1>
              <p>{copy.preferenceBody}</p>
            </div>
            <div className={styles.preferenceGroups}>
              {[
                { id: "meal", title: copy.mealGroup, items: ONDO_B_DISCOVERY_PREFERENCES.filter((option) => option.group === "meal") },
                { id: "mood", title: copy.moodGroup, items: ONDO_B_DISCOVERY_PREFERENCES.filter((option) => option.group === "mood") },
                { id: "dietary", title: copy.dietaryGroup, note: copy.dietaryBoundary, items: ONDO_B_DISCOVERY_PREFERENCES.filter((option) => option.group === "dietary") },
              ].map((group) => (
                <section key={group.id} className={styles.preferenceGroup} aria-labelledby={`onboarding-${group.id}`}>
                  <h2 id={`onboarding-${group.id}`}>{group.title}</h2>
                  <div className={styles.chips}>
                    {group.items.map((preference, index) => {
                      const selected = preferences.includes(preference.id)
                      return (
                        <button
                          key={preference.id}
                          type="button"
                          data-onboarding-initial-focus={group.id === "meal" && index === 0 ? "true" : undefined}
                          aria-pressed={selected}
                          className={selected ? styles.chipSelected : styles.chip}
                          onClick={() => setPreferences((current) => selected
                            ? current.filter((id) => id !== preference.id)
                            : [...current, preference.id])}
                        >
                          {preference.label[state.locale]}
                        </button>
                      )
                    })}
                  </div>
                  {group.note ? <p className={styles.preferenceNote}>{group.note}</p> : null}
                </section>
              ))}
            </div>
            <div className={`${styles.actions} ${saveError ? styles.actionsRecovery : ""}`} data-onboarding-recovery={saveError ? "true" : undefined}>
              {saveError ? <p className={styles.inlineAlert} role="alert" data-testid="onboarding-save-status">{saveError}</p> : null}
              <button type="button" className={styles.primary} onClick={finish} data-testid="onboarding-finish">
                {copy.finish}<ArrowRight size={18} aria-hidden="true" />
              </button>
              <button type="button" className={styles.secondary} onClick={skip}>{copy.skip}</button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
