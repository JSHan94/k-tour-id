"use client"

import type { ReactNode } from "react"
import { useEffect, useRef } from "react"
import { Bookmark, Compass, Settings, UsersRound } from "lucide-react"
import { OndoBProvider, useOndoB, type OndoBTab } from "../shared/state/ondo-b-provider"
import styles from "./ondo-shell.module.css"

export type OndoBAppSlots = {
  explore: ReactNode
  saved: ReactNode
  tables: ReactNode
  settings: ReactNode
  overlays?: ReactNode
}

const B_NAV: Array<{ id: OndoBTab; icon: typeof Compass }> = [
  { id: "ondo", icon: Compass },
  { id: "my", icon: Bookmark },
  { id: "tables", icon: UsersRound },
  { id: "id", icon: Settings },
]

const B_NAV_COPY = {
  en: { ondo: "Explore", my: "Saved", tables: "Tables", id: "Settings" },
  ko: { ondo: "탐색", my: "저장", tables: "테이블", id: "설정" },
} as const

function OndoBShell({ slots }: { slots: OndoBAppSlots }) {
  const { state, actions } = useOndoB()
  const previousSurface = useRef(state.surface)
  const previousDocumentLanguage = useRef<string | null>(null)
  const appliedDocumentLanguage = useRef(state.locale)
  const active = state.tab === "my" ? slots.saved : state.tab === "tables" ? slots.tables : state.tab === "id" ? slots.settings : slots.explore
  const onboardingActive = state.onboarding !== "ONB-COMPLETE"

  useEffect(() => {
    previousDocumentLanguage.current = document.documentElement.lang
    const languageObserver = new MutationObserver(() => {
      if (document.documentElement.lang === appliedDocumentLanguage.current) return
      previousDocumentLanguage.current = document.documentElement.lang
      document.documentElement.lang = appliedDocumentLanguage.current
    })
    languageObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] })
    return () => {
      languageObserver.disconnect()
      if (document.documentElement.lang === appliedDocumentLanguage.current && previousDocumentLanguage.current) {
        document.documentElement.lang = previousDocumentLanguage.current
      }
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = state.locale
    appliedDocumentLanguage.current = state.locale
  }, [state.locale])

  useEffect(() => {
    const before = previousSurface.current
    previousSurface.current = state.surface
    if (before.kind === "venue" || state.surface.kind !== "venue") return
    const timer = window.setTimeout(() => {
      document.querySelector<HTMLElement>("[data-testid='canonical-place-details']")?.focus({ preventScroll: true })
    }, 100)
    return () => window.clearTimeout(timer)
  }, [state.surface])

  return (
    <main className={styles.stage} data-ondo-locale={state.locale} data-testid="ondo-b-root" data-variant="B" data-locale={state.locale}>
      <section className={styles.canvas} aria-label={state.locale === "ko" ? "ONDO 공식 식음료 장소 앱" : "ONDO official food place app"} data-testid="ondo-canvas">
        <div className={styles.content} data-active-tab={state.tab} inert={onboardingActive ? true : undefined} aria-hidden={onboardingActive ? true : undefined}>{active}</div>
        <nav className={styles.nav} data-testid="ondo-main-nav" data-nav-count="4" aria-label={state.locale === "en" ? "Main navigation" : "주요 메뉴"} inert={onboardingActive ? true : undefined} aria-hidden={onboardingActive ? true : undefined}>
          {B_NAV.map(({ id, icon: Icon }) => (
            <button key={id} type="button" className={state.tab === id ? styles.navActive : undefined} aria-current={state.tab === id ? "page" : undefined} data-testid={`nav-${id}`} onClick={() => actions.setTab(id)}>
              <span><Icon size={20} strokeWidth={state.tab === id ? 2.25 : 1.7} /></span>
              <small>{B_NAV_COPY[state.locale][id]}</small>
            </button>
          ))}
        </nav>
        {slots.overlays}
        {state.toast ? <div className={styles.toast} data-testid="ondo-toast" role="status">{state.toast}</div> : null}
      </section>
    </main>
  )
}

export function OndoAppB({ slots }: { slots: OndoBAppSlots }) {
  return <OndoBProvider><OndoBShell slots={slots} /></OndoBProvider>
}
