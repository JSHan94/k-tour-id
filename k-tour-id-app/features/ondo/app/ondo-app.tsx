"use client"

import type { ReactNode } from "react"
import { useEffect, useRef } from "react"
import { BadgeCheck, Map, MessageCircle, NotebookTabs } from "lucide-react"
import { OndoProvider, useOndo } from "../shared/state/ondo-provider"
import { COPY } from "../shared/i18n/copy"
import type { OndoTab } from "../contracts/domain"
import styles from "./ondo-shell.module.css"

export type OndoAppSlots = {
  map: ReactNode
  my: ReactNode
  tables: ReactNode
  id: ReactNode
  overlays?: ReactNode
}

const NAV: Array<{ id: OndoTab; icon: typeof Map }> = [
  { id: "ondo", icon: Map },
  { id: "my", icon: NotebookTabs },
  { id: "tables", icon: MessageCircle },
  { id: "id", icon: BadgeCheck },
]

function OndoShell({ slots, variant = "A" }: { slots: OndoAppSlots; variant?: "A" | "B" }) {
  const { state, actions } = useOndo()
  const previousSurface = useRef(state.surface)
  const previousDocumentLanguage = useRef<string | null>(null)
  const appliedDocumentLanguage = useRef(state.locale)
  const copy = COPY[state.locale]
  const active = state.tab === "ondo" ? slots.map : state.tab === "my" ? slots.my : state.tab === "tables" ? slots.tables : slots.id
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
      document.querySelector<HTMLElement>("[data-testid='canonical-place-details'], [data-testid='place-details']")?.focus({ preventScroll: true })
    }, 100)
    return () => window.clearTimeout(timer)
  }, [state.surface])

  return (
    <main
      className={styles.stage}
      data-ondo-locale={state.locale}
      data-testid={variant === "B" ? "ondo-b-root" : undefined}
      data-variant={variant}
      data-locale={state.locale}
    >
      <section className={styles.canvas} aria-label={state.locale === "ko" ? "ONDO 여행 식음료 앱" : "ONDO travel food app"} data-testid="ondo-canvas">
        <div className={styles.content} data-active-tab={state.tab} inert={onboardingActive ? true : undefined} aria-hidden={onboardingActive ? true : undefined}>{active}</div>
        <nav className={styles.nav} data-testid="ondo-main-nav" aria-label={state.locale === "en" ? "Main navigation" : "주요 메뉴"} inert={onboardingActive ? true : undefined} aria-hidden={onboardingActive ? true : undefined}>
          {NAV.map(({ id, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={state.tab === id ? styles.navActive : undefined}
              aria-current={state.tab === id ? "page" : undefined}
              data-testid={`nav-${id}`}
              onClick={() => actions.setTab(id)}
            >
              <span><Icon size={20} strokeWidth={state.tab === id ? 2.25 : 1.7} /></span>
              <small>{copy.tabs[id]}</small>
              {id === "tables" && state.unreadTables > 0 ? <i>{Math.min(99, state.unreadTables)}</i> : null}
            </button>
          ))}
        </nav>
        {slots.overlays}
        {state.toast ? <div className={styles.toast} data-testid="ondo-toast" role="status">{state.toast}</div> : null}
      </section>
    </main>
  )
}

export function OndoApp({ slots, variant = "A" }: { slots: OndoAppSlots; variant?: "A" | "B" }) {
  return <OndoProvider><OndoShell slots={slots} variant={variant} /></OndoProvider>
}
