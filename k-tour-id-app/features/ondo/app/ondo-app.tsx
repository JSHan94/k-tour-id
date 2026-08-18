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

function OndoShell({ slots }: { slots: OndoAppSlots }) {
  const { state, actions } = useOndo()
  const previousSurface = useRef(state.surface)
  const copy = COPY[state.locale]
  const active = state.tab === "ondo" ? slots.map : state.tab === "my" ? slots.my : state.tab === "tables" ? slots.tables : slots.id

  useEffect(() => {
    const before = previousSurface.current
    previousSurface.current = state.surface
    if (before.kind === "map" || state.surface.kind !== "venue") return
    const timer = window.setTimeout(() => {
      document.querySelector<HTMLElement>("[data-testid='place-details']")?.focus({ preventScroll: true })
    }, 100)
    return () => window.clearTimeout(timer)
  }, [state.surface])

  return (
    <main className={styles.stage} data-ondo-locale={state.locale}>
      <section className={styles.canvas} aria-label="ONDO travel food app">
        <div className={styles.content}>{active}</div>
        <nav className={styles.nav} aria-label={state.locale === "en" ? "Main navigation" : "주요 메뉴"}>
          {NAV.map(({ id, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={state.tab === id ? styles.navActive : undefined}
              aria-current={state.tab === id ? "page" : undefined}
              onClick={() => actions.setTab(id)}
            >
              <span><Icon size={20} strokeWidth={state.tab === id ? 2.25 : 1.7} /></span>
              <small>{copy.tabs[id]}</small>
              {id === "tables" && state.unreadTables > 0 ? <i>{Math.min(99, state.unreadTables)}</i> : null}
            </button>
          ))}
        </nav>
        {slots.overlays}
        {state.toast ? <div className={styles.toast} role="status">{state.toast}</div> : null}
      </section>
    </main>
  )
}

export function OndoApp({ slots }: { slots: OndoAppSlots }) {
  return <OndoProvider><OndoShell slots={slots} /></OndoProvider>
}
