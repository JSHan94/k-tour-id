"use client"

import type { KeyboardEvent } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowRight, Check, ChevronLeft, Compass, MapPin, Sparkles, Utensils } from "lucide-react"
import type { DiscoveryPreference, Locale, Persona } from "../contracts/domain"
import { useOndo } from "../shared/state/ondo-provider"
import { focusFirstAvailableDestination } from "../shared/ui/focus-destination"
import { DISCOVERY_PREFERENCE_OPTIONS } from "./discovery-options"
import styles from "./onboarding.module.css"

type Step = "value" | "intent" | "preferences"

const FOCUSABLE = "a[href],button:not([disabled]),input:not([disabled]):not([type='hidden']),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])"

const PERSONAS: Array<{
  id: Persona
  icon: typeof Compass
  ko: string
  en: string
  noteKo: string
  noteEn: string
}> = [
  { id: "short_term", icon: Compass, ko: "한국을 여행 중이에요", en: "I’m visiting Korea", noteKo: "단기 여행자를 위한 식음료 발견", noteEn: "Food and drink discovery for a short stay" },
  { id: "long_term_resident", icon: MapPin, ko: "한국에 거주하고 있어요", en: "I live in Korea", noteKo: "거주 지역과 장기 이용에 맞춘 경로", noteEn: "A route for residents and longer stays" },
  { id: "korean_local", icon: Sparkles, ko: "한국 로컬이에요", en: "I’m a local in Korea", noteKo: "내가 아는 식음료 신호와 Table 공유", noteEn: "Share local food signals and Tables" },
]

const TEXT = {
  en: {
    eyebrow: "A meal in Korea",
    title: "Find what you want to eat now, even if you do not know the neighborhood.",
    body: "ONDO starts with food and drink coverage in Seoul and Busan, then grows across Korea.",
    start: "Get started",
    guest: "Explore as a guest",
    signal: "Example ONDO score · Simulated preview, not weather or a live crowd count.",
    intentTitle: "How will you use ONDO?",
    intentBody: "This only prepares recommendations and verification routes. You can change it later.",
    preferenceTitle: "What kind of meal are you looking for?",
    preferenceBody: "This only sets your starting filters. You can change it without an account.",
    mealGroup: "Meal type",
    moodGroup: "Mood and timing",
    dietaryGroup: "Dietary requirements",
    dietaryBoundary: "These choices describe your needs only. ONDO does not yet confirm that any venue supports them.",
    continueToPreferences: "Choose meal preferences",
    open: "Open the ONDO map",
    defaults: "Continue with defaults",
    skip: "Skip and explore",
    boundary: "Account creation and identity checks happen separately, only when an experience needs them.",
    fallback: "We could not save those preferences. You can still explore the map with the defaults.",
    continueFallback: "Open map with defaults",
    back: "Go back",
  },
  ko: {
    eyebrow: "한국에서의 한 끼",
    title: "지역 이름을 몰라도, 지금 먹고 싶은 분위기로 찾아보세요.",
    body: "ONDO는 서울과 부산의 식음료 정보부터 시작해 한국으로 넓혀갑니다.",
    start: "시작하기",
    guest: "먼저 둘러보기",
    signal: "ONDO 점수 예시 · 실제 기온이나 실시간 인파가 아닌 시뮬레이션 미리보기예요.",
    intentTitle: "ONDO를 어떻게 사용하시나요?",
    intentBody: "추천과 인증 경로를 준비하는 데만 사용하며, 나중에 바꿀 수 있어요.",
    preferenceTitle: "어떤 한 끼를 찾고 있나요?",
    preferenceBody: "처음 보이는 필터에만 반영하며 계정 없이도 바꿀 수 있어요.",
    mealGroup: "먹고 싶은 것",
    moodGroup: "분위기와 시간",
    dietaryGroup: "식이 요구사항",
    dietaryBoundary: "필요한 조건을 직접 고르는 항목입니다. ONDO는 아직 어떤 장소가 이를 지원한다고 확인하지 않아요.",
    continueToPreferences: "한 끼 취향 고르기",
    open: "ONDO 지도 열기",
    defaults: "기본 설정으로 계속",
    skip: "건너뛰고 둘러보기",
    boundary: "계정 생성과 본인 확인은 필요한 경험을 시작할 때 별도로 진행합니다.",
    fallback: "선택한 설정을 저장하지 못했어요. 기본 설정으로 지도를 둘러볼 수 있어요.",
    continueFallback: "기본 설정으로 지도 열기",
    back: "뒤로",
  },
} satisfies Record<Locale, Record<string, string>>

export function OnboardingLayer() {
  const { state, actions } = useOndo()
  const [step, setStep] = useState<Step>("value")
  const [preferences, setPreferences] = useState<DiscoveryPreference[]>([])
  const [failed, setFailed] = useState(false)
  const dialogRef = useRef<HTMLElement>(null)
  const t = TEXT[state.locale]

  useEffect(() => {
    if (state.onboarding === "ONB-IN-PROGRESS" && step === "value") setStep("intent")
  }, [state.onboarding, step])

  useEffect(() => {
    if (!state.hydrated || state.onboarding === "ONB-COMPLETE") return
    window.requestAnimationFrame(() => {
      const preferred = dialogRef.current?.querySelector<HTMLElement>("[data-onboarding-initial-focus]")
      ;(preferred ?? dialogRef.current)?.focus()
    })
  }, [state.hydrated, state.onboarding, step])

  const stepIndex = useMemo(() => ({ value: 1, intent: 2, preferences: 3 })[step], [step])
  if (!state.hydrated || state.onboarding === "ONB-COMPLETE") return null

  const completeAndFocusMap = () => {
    actions.completeOnboarding()
    focusFirstAvailableDestination([
      "[data-testid='ondo-b-nation'] [data-city='seoul']",
      "[data-testid='ondo-b-map-entry'] button",
      "[data-testid='nav-ondo']",
    ])
  }

  const finish = () => {
    const shouldFail = new URLSearchParams(window.location.search).get("onboarding") === "failure"
    if (shouldFail && !failed) {
      setFailed(true)
      return
    }
    actions.setDiscoveryPreferences(failed ? [] : preferences)
    completeAndFocusMap()
  }

  const skip = () => {
    setFailed(false)
    completeAndFocusMap()
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
    if (!focusable.length) {
      event.preventDefault()
      dialogRef.current?.focus()
      return
    }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
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
      <section ref={dialogRef} className={styles.layer} data-testid="ondo-onboarding" role="dialog" aria-modal="true" aria-label={state.locale === "ko" ? "ONDO 시작 안내" : "ONDO onboarding"} tabIndex={-1} onKeyDown={handleKeyDown}>
      <div className={styles.ambient} aria-hidden="true"><i /><i /><i /></div>
      <header className={styles.header}>
        {step !== "value" ? (
          <button type="button" className={styles.iconButton} onClick={() => setStep(step === "preferences" ? "intent" : "value")} aria-label={t.back}>
            <ChevronLeft size={21} />
          </button>
        ) : <span />}
        <div className={styles.progress} role="progressbar" aria-label={state.locale === "ko" ? "온보딩 진행" : "Onboarding progress"} aria-valuemin={1} aria-valuemax={3} aria-valuenow={stepIndex}>
          {[1, 2, 3].map((item) => <i key={item} className={item <= stepIndex ? styles.progressActive : undefined} />)}
        </div>
        <button type="button" className={styles.language} onClick={() => actions.setLocale(state.locale === "en" ? "ko" : "en")}>
          {state.locale === "en" ? "KO" : "EN"}
        </button>
      </header>

      {step === "value" ? (
        <div className={styles.value} data-testid="onboarding-step-value">
          <div className={styles.seal}><Utensils size={27} /><span>ONDO</span></div>
          <p className={styles.eyebrow}>{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p className={styles.lead}>{t.body}</p>
          <div className={styles.signal} data-testid="onboarding-signal-truth"><span>72</span><p>{t.signal}</p></div>
          <div className={styles.actions}>
            <button type="button" data-onboarding-initial-focus className={styles.primary} onClick={() => { actions.beginOnboarding(); setStep("intent") }}>
              {t.start}<ArrowRight size={18} />
            </button>
            <button type="button" className={styles.secondary} data-dialog-exit onClick={skip}>{t.guest}</button>
          </div>
        </div>
      ) : null}

      {step === "intent" ? (
        <div className={styles.panel} data-testid="onboarding-step-intent">
          <div className={styles.heading}><span>02</span><h1>{t.intentTitle}</h1><p>{t.intentBody}</p></div>
          <div className={styles.personas}>
            {PERSONAS.map((persona) => {
              const Icon = persona.icon
              const selected = state.persona === persona.id
              return (
                <button key={persona.id} type="button" data-onboarding-initial-focus={persona.id === "short_term" ? "true" : undefined} aria-pressed={selected} className={selected ? styles.personaSelected : styles.persona} onClick={() => actions.setPersona(persona.id)} data-testid={`persona-${persona.id}`}>
                  <span className={styles.personaIcon}><Icon size={21} /></span>
                  <span><strong>{state.locale === "ko" ? persona.ko : persona.en}</strong><small>{state.locale === "ko" ? persona.noteKo : persona.noteEn}</small></span>
                  <i>{selected ? <Check size={16} /> : null}</i>
                </button>
              )
            })}
          </div>
          <p className={styles.boundary}>{t.boundary}</p>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} disabled={!state.persona} onClick={() => setStep("preferences")}>
              {t.continueToPreferences}<ArrowRight size={18} />
            </button>
            <button type="button" className={styles.secondary} data-dialog-exit onClick={skip}>{t.skip}</button>
          </div>
        </div>
      ) : null}

      {step === "preferences" ? (
        <div className={styles.panel} data-testid="onboarding-step-preferences">
          <div className={styles.heading}><span>03</span><h1>{t.preferenceTitle}</h1><p>{t.preferenceBody}</p></div>
          <div className={styles.preferenceGroups}>
            {[
              { id: "meal", title: t.mealGroup, items: DISCOVERY_PREFERENCE_OPTIONS.filter((option) => option.group === "meal") },
              { id: "mood", title: t.moodGroup, items: DISCOVERY_PREFERENCE_OPTIONS.filter((option) => option.group === "mood") },
              { id: "dietary", title: t.dietaryGroup, note: t.dietaryBoundary, items: DISCOVERY_PREFERENCE_OPTIONS.filter((option) => option.group === "dietary") },
            ].map((group) => <section key={group.title} className={styles.preferenceGroup}>
              <h2>{group.title}</h2>
              <div className={styles.chips}>
                {group.items.map((preference) => {
                  const selected = preferences.includes(preference.id)
                  return <button key={preference.id} type="button" aria-pressed={selected} className={selected ? styles.chipSelected : styles.chip} onClick={() => setPreferences((current) => selected ? current.filter((id) => id !== preference.id) : [...current, preference.id])}>{preference.label[state.locale]}</button>
                })}
              </div>
              {group.note ? <p className={styles.preferenceNote}>{group.note}</p> : null}
            </section>)}
          </div>
          {failed ? <div className={styles.error} role="alert">{t.fallback}</div> : null}
          <div className={styles.actions}>
            <button type="button" data-onboarding-initial-focus className={styles.primary} onClick={finish} data-testid="onboarding-finish">
              {failed ? t.continueFallback : t.open}<ArrowRight size={18} />
            </button>
            <button type="button" className={styles.secondary} data-dialog-exit onClick={skip}>{preferences.length ? t.defaults : t.skip}</button>
          </div>
        </div>
      ) : null}
      </section>
    </div>
  )
}
