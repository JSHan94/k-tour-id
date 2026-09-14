"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { Check, Compass, House, LocateFixed, MapPin } from "lucide-react"
import { requestBDiscoveryFocus } from "../map/b-discovery-focus"
import type { OndoBDiscoveryArea, OndoBDiscoveryIntent, OndoBDiscoveryPreference, OndoBLocale } from "../shared/state/ondo-b-preferences"
import { ONDO_B_DISCOVERY_PREFERENCES } from "../shared/state/ondo-b-preferences"
import { useOndoB } from "../shared/state/ondo-b-provider"
import { SheetB } from "../shared/ui/sheet-b"
import { useSheetPresence } from "../shared/ui/use-sheet-presence"
import styles from "./official-directory-onboarding.module.css"

type Step = "intent" | "area" | "preferences"
const COPY = {
  en: { label: "Set up your map", intentTitle: "What brings you here?", intentBody: "", short_trip: "Travel in Korea", nearby: "Explore nearby", living: "Living in Korea", areaTitle: "Where should we begin?", areaBody: "", areaOptional: "", seoul: "Seoul", busan: "Busan", jeju: "Jeju", tasteTitle: "What sounds good?", tasteBody: "Places stay visible.", meal: "Food", mood: "Moment", dietary: "Dietary", dietaryHint: "Check dietary needs with each place.", previewMatch: "A taste match", previewNone: "No confirmed taste match yet", previewUnknown: "Dietary details need checking", next: "Next", finish: "Open map", defaults: "Skip for now", error: "Couldn’t save. Try again or skip for now.", selected: "Selected" },
  ko: { label: "내 지도 설정", intentTitle: "어떤 한국을 찾고 있나요?", intentBody: "", short_trip: "한국 여행", nearby: "내 주변 탐색", living: "한국에서 생활", areaTitle: "어디서 시작할까요?", areaBody: "", areaOptional: "", seoul: "서울", busan: "부산", jeju: "제주", tasteTitle: "지금 끌리는 건?", tasteBody: "장소는 모두 그대로 보여요.", meal: "음식", mood: "분위기", dietary: "식이 조건", dietaryHint: "식이 조건은 방문 전 장소에 확인해 주세요.", previewMatch: "취향과 맞는 곳", previewNone: "확인된 취향 일치는 아직 없어요", previewUnknown: "식이 정보는 확인이 필요해요", next: "다음", finish: "지도 열기", defaults: "건너뛰기", error: "저장하지 못했어요. 다시 시도하거나 건너뛰세요.", selected: "선택됨" },
  ja: { label: "マップ設定", intentTitle: "どんな韓国を探しますか？", intentBody: "", short_trip: "韓国旅行", nearby: "近くを探す", living: "韓国で暮らす", areaTitle: "どこから始めますか？", areaBody: "", areaOptional: "", seoul: "ソウル", busan: "釜山", jeju: "済州", tasteTitle: "今の気分は？", tasteBody: "すべての場所は表示されます。", meal: "食", mood: "雰囲気", dietary: "食の条件", dietaryHint: "食の条件は訪問前に店舗へ確認してください。", previewMatch: "好みに合う場所", previewNone: "確認できた一致はまだありません", previewUnknown: "食の条件は確認が必要です", next: "次へ", finish: "マップを開く", defaults: "スキップ", error: "保存できませんでした。もう一度試すか、スキップしてください。", selected: "選択済み" },
} satisfies Record<OndoBLocale, Record<string, string>>

const INTENTS: { id: OndoBDiscoveryIntent; icon: typeof Compass }[] = [
  { id: "short_trip", icon: Compass }, { id: "nearby", icon: LocateFixed }, { id: "living", icon: House },
]
const AREAS: Exclude<OndoBDiscoveryArea, null>[] = ["seoul", "busan", "jeju"]

export function OfficialDirectoryOnboardingLayer() {
  const { state, actions } = useOndoB()
  const rootRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState<Step>("intent")
  const [intent, setIntent] = useState<OndoBDiscoveryIntent | null>(null)
  const [area, setArea] = useState<OndoBDiscoveryArea>(null)
  const [preferences, setPreferences] = useState<OndoBDiscoveryPreference[]>([])
  const [saveError, setSaveError] = useState(false)
  const [exiting, setExiting] = useState(false)
  const previousOnboarding = useRef(state.onboarding)
  // The map is the first-run experience. Only the explicit Settings setup
  // action starts this optional wizard; NEW is not a request to open a sheet.
  const sheetPresence = useSheetPresence(state.hydrated && state.onboarding === "ONB-IN-PROGRESS" ? true : null)
  const copy = COPY[state.locale]

  useEffect(() => {
    if (previousOnboarding.current !== "ONB-IN-PROGRESS" && state.onboarding === "ONB-IN-PROGRESS") {
      setStep("intent"); setIntent(state.persona); setArea(state.discoveryArea); setPreferences([...state.discoveryPreferences]); setSaveError(false); setExiting(false)
      requestBDiscoveryFocus({ city: null, source: "onboarding", motion: "standard" })
    }
    previousOnboarding.current = state.onboarding
  }, [state.discoveryArea, state.discoveryPreferences, state.onboarding, state.persona])

  useLayoutEffect(() => {
    if (!state.hydrated || state.onboarding !== "ONB-IN-PROGRESS") return
    const scrollOwner = rootRef.current?.querySelector<HTMLElement>('[data-sheet-scroll-owner="true"]')
    if (scrollOwner) scrollOwner.scrollTop = 0
    rootRef.current?.querySelector<HTMLElement>(`[data-onboarding-heading="${step}"]`)?.focus({ preventScroll: true })
  }, [state.hydrated, state.onboarding, step])

  if (!sheetPresence.value) return null

  const resetMap = () => requestBDiscoveryFocus({ city: null, source: "onboarding", motion: "standard" })
  const escape = () => {
    if (exiting) return
    resetMap()
    setSaveError(false)
    setExiting(true)
    actions.cancelOnboarding()
  }
  const goBack = () => { if (exiting) return; setSaveError(false); if (step === "area") resetMap(); setStep(step === "preferences" ? "area" : "intent") }
  const finish = () => {
    if (!intent || exiting) return
    if (area) requestBDiscoveryFocus({ city: area, source: "onboarding", motion: "standard" })
    setSaveError(false)
    setExiting(true)
    const result = actions.completeOnboarding({ intent, area, preferences })
    if (!result.ok) {
      setExiting(false)
      setSaveError(true)
    }
  }
  const next = () => {
    setSaveError(false)
    if (step === "intent" && intent) { actions.beginOnboarding(); setStep("area") }
    else if (step === "area" && (intent === "short_trip" || area)) {
      setStep("preferences")
      requestBDiscoveryFocus({ city: area, source: "onboarding", motion: "standard", personalization: { intent: intent ?? "short_trip", preferences } })
    }
    else if (step === "preferences") finish()
  }
  const toggle = (choice: OndoBDiscoveryPreference) => {
    const nextPreferences = preferences.includes(choice) ? preferences.filter((item) => item !== choice) : [...preferences, choice]
    setPreferences(nextPreferences)
    requestBDiscoveryFocus({ city: area, source: "onboarding", motion: "standard", personalization: { intent: intent ?? "short_trip", preferences: nextPreferences } })
  }
  const canContinue = step === "intent" ? Boolean(intent) : step === "area" ? intent === "short_trip" || Boolean(area) : true
  const primaryLabel = step === "preferences" ? copy.finish : step === "intent"
    ? state.locale === "ko" ? "지역 고르기" : state.locale === "ja" ? "地域を選ぶ" : "Choose area"
    : state.locale === "ko" ? "취향 고르기" : state.locale === "ja" ? "好みを選ぶ" : "Choose tastes"

  return <div ref={rootRef} className={styles.root} data-onboarding-step={step} data-testid="ondo-onboarding-backdrop"><SheetB presenceState={sheetPresence.phase} locale={state.locale} label={copy.label} variant="decision" navigation={step === "intent" ? "close" : "back"} onBack={goBack} onClose={escape} initialFocusSelector={`[data-onboarding-heading="${step}"]`}
    header={<div className={styles.header}><div className={styles.locales} aria-label={state.locale === "ko" ? "언어" : state.locale === "ja" ? "言語" : "Language"}>{(["en", "ko", "ja"] as const).map((locale) => <button key={locale} type="button" disabled={exiting} aria-pressed={state.locale === locale} onClick={() => { if (!actions.setLocale(locale)) setSaveError(true) }}>{locale.toUpperCase()}</button>)}</div></div>}
    footer={<div className={styles.footer}>{saveError && <p className={styles.error} role="alert" data-testid="onboarding-save-status">{copy.error}</p>}<button className={styles.primary} type="button" disabled={!canContinue || exiting} onClick={next} data-testid={step === "preferences" ? "onboarding-finish" : "onboarding-continue"}>{primaryLabel}</button><button className={styles.secondary} type="button" disabled={exiting} onClick={escape} data-testid="onboarding-guest-skip">{copy.defaults}</button></div>}>
    <div key={step} className={styles.content} data-testid="ondo-onboarding" aria-busy={exiting ? "true" : undefined}>
      {step === "intent" && <section data-testid="onboarding-step-intent"><StageHeading step="intent" title={copy.intentTitle} body={copy.intentBody} /><div className={styles.choiceGrid} role="radiogroup" aria-label={copy.intentTitle}>{INTENTS.map(({ id, icon: Icon }) => <button key={id} type="button" role="radio" aria-checked={intent === id} data-testid={`persona-${id}`} className={styles.choice} onClick={() => setIntent(id)}><Icon aria-hidden="true" /><span>{copy[id]}</span>{intent === id && <Check aria-label={copy.selected} />}</button>)}</div></section>}
      {step === "area" && <section data-testid="onboarding-step-area"><StageHeading step="area" title={copy.areaTitle} body={intent === "short_trip" ? copy.areaOptional : copy.areaBody} /><div className={styles.areaGrid} role="radiogroup" aria-label={copy.areaTitle}>{AREAS.map((city) => <button key={city} type="button" role="radio" aria-checked={area === city} data-testid={`onboarding-area-${city}`} className={styles.areaChoice} onClick={() => { setArea(city); requestBDiscoveryFocus({ city, source: "onboarding", motion: "standard", personalization: { intent: intent ?? "short_trip", preferences } }) }}><MapPin aria-hidden="true" /><span>{copy[city]}</span>{area === city && <Check aria-label={copy.selected} />}</button>)}</div></section>}
      {step === "preferences" && <section data-testid="onboarding-step-preferences"><StageHeading step="preferences" title={copy.tasteTitle} body={copy.tasteBody} /><PreferenceGroup group="meal" label={copy.meal} locale={state.locale} preferences={preferences} toggle={toggle} /><details className={styles.dietaryDisclosure} data-testid="onboarding-dietary-disclosure"><summary>{copy.dietary}</summary><PreferenceGroup group="dietary" label={null} locale={state.locale} preferences={preferences} toggle={toggle} /><small>{copy.dietaryHint}</small></details></section>}
    </div>
  </SheetB></div>
}

function StageHeading({ step, title, body }: { step: Step; title: string; body: string }) { return <header className={styles.stageHeading}><h1 tabIndex={-1} data-onboarding-heading={step}>{title}</h1>{body && <p>{body}</p>}</header> }

function PreferenceGroup({ group, label, locale, preferences, toggle }: { group: "meal" | "mood" | "dietary"; label: string | null; locale: OndoBLocale; preferences: OndoBDiscoveryPreference[]; toggle(choice: OndoBDiscoveryPreference): void }) {
  return <fieldset className={styles.group}>{label && <legend>{label}</legend>}<div className={styles.chips}>{ONDO_B_DISCOVERY_PREFERENCES.filter((item) => item.group === group).map((item) => <button type="button" key={item.id} aria-pressed={preferences.includes(item.id)} data-testid={`onboarding-preference-${item.id}`} onClick={() => toggle(item.id)}>{item.label[locale]}{preferences.includes(item.id) && <Check aria-hidden="true" />}</button>)}</div></fieldset>
}
