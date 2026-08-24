"use client"

import type { KeyboardEvent } from "react"
import { useEffect, useRef } from "react"
import { ArrowRight, Database, Languages } from "lucide-react"
import type { Locale } from "../contracts/domain"
import { useOndoB } from "../shared/state/ondo-b-provider"
import { focusFirstAvailableDestination } from "../shared/ui/focus-destination"
import styles from "./onboarding.module.css"

const FOCUSABLE = "a[href],button:not([disabled]),input:not([disabled]):not([type='hidden']),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])"

const COPY = {
  en: {
    eyebrow: "Official food-service directory",
    title: "Start with 400 public food-service licence records.",
    body: "Browse Seoul and Busan with 200 records in each city from the Ministry of the Interior and Safety LOCALDATA source.",
    category: "Categories are normalized only from each record’s official business type.",
    boundary: "The source confirms an active licence at its Aug 19, 2026 snapshot. Current hours, menu, popularity, price and payment support are not provided.",
    open: "Browse the directory",
    dialog: "ONDO official directory introduction",
  },
  ko: {
    eyebrow: "공식 일반음식점 디렉터리",
    title: "공공 일반음식점 인허가 기록 400개로 시작해요.",
    body: "행정안전부 LOCALDATA 출처에서 서울과 부산 각각 200개 기록을 살펴볼 수 있습니다.",
    category: "분류는 각 기록의 공식 업태구분명만을 기준으로 정규화합니다.",
    boundary: "출처는 2026년 8월 19일 기준 유효 인허가 상태를 확인합니다. 현재 영업시간·메뉴·인기도·가격·결제 지원은 제공하지 않습니다.",
    open: "디렉터리 둘러보기",
    dialog: "ONDO 공식 디렉터리 시작 안내",
  },
} satisfies Record<Locale, Record<string, string>>

export function OfficialDirectoryOnboardingLayer() {
  const { state, actions } = useOndoB()
  const dialogRef = useRef<HTMLElement>(null)
  const copy = COPY[state.locale]

  useEffect(() => {
    if (!state.hydrated || state.onboarding === "ONB-COMPLETE") return
    const frame = window.requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>("[data-onboarding-initial-focus]")?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [state.hydrated, state.onboarding])

  if (!state.hydrated || state.onboarding === "ONB-COMPLETE") return null

  const finish = () => {
    actions.completeOnboarding()
    focusFirstAvailableDestination([
      "[data-testid='ondo-b-nation'] [data-city='seoul']",
      "[data-testid='ondo-b-map-entry'] button",
      "[data-testid='nav-ondo']",
    ])
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault()
      finish()
      return
    }
    if (event.key !== "Tab") return
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter((element) => element.offsetParent !== null)
    const first = focusable[0]
    const last = focusable.at(-1)
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }

  return (
    <div className={styles.backdrop} data-testid="ondo-onboarding-backdrop">
      <section ref={dialogRef} className={styles.layer} data-testid="ondo-onboarding" role="dialog" aria-modal="true" aria-label={copy.dialog} tabIndex={-1} onKeyDown={handleKeyDown}>
        <header className={styles.header}>
          <span />
          <span />
          <button type="button" className={styles.language} onClick={() => actions.setLocale(state.locale === "en" ? "ko" : "en")} aria-label={state.locale === "en" ? "한국어로 보기" : "View in English"}>
            <Languages size={15} />{state.locale === "en" ? "KO" : "EN"}
          </button>
        </header>
        <div className={styles.value} data-testid="onboarding-step-value">
          <div className={styles.seal}><Database size={27} /><span>ONDO</span></div>
          <p className={styles.eyebrow}>{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p className={styles.lead}>{copy.body}</p>
          <section className={styles.sourceIntro} aria-label={state.locale === "ko" ? "출처와 분류 안내" : "Source and category notes"}>
            <p><strong>LOCALDATA</strong><span>{copy.category}</span></p>
            <p><strong>{state.locale === "ko" ? "확인 범위" : "Coverage boundary"}</strong><span>{copy.boundary}</span></p>
          </section>
          <div className={styles.actions}>
            <button type="button" data-onboarding-initial-focus className={styles.primary} onClick={finish} data-testid="onboarding-finish">
              {copy.open}<ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
