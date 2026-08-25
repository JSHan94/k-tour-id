"use client"

import type { ReactNode } from "react"
import { useEffect, useLayoutEffect, useRef } from "react"
import { Bookmark, Compass, Fingerprint, Settings, UsersRound } from "lucide-react"
import { OndoBProvider, useOndoB, type OndoBTab } from "../shared/state/ondo-b-provider"
import styles from "./ondo-shell.module.css"

export type OndoBAppSlots = {
  explore: ReactNode
  saved: ReactNode
  tables: ReactNode
  travelerId: ReactNode
  settings: ReactNode
  overlays?: ReactNode
}

const B_NAV: Array<{ id: OndoBTab; icon: typeof Compass }> = [
  { id: "ondo", icon: Compass },
  { id: "my", icon: Bookmark },
  { id: "tables", icon: UsersRound },
  { id: "id", icon: Fingerprint },
  { id: "settings", icon: Settings },
]

const B_NAV_COPY = {
  en: { ondo: "Explore", my: "My Korea", tables: "Tables", id: "ID · Wallet", settings: "Settings" },
  ko: { ondo: "탐색", my: "내 한국", tables: "테이블", id: "ID · 지갑", settings: "설정" },
} as const

function OndoBShell({ slots }: { slots: OndoBAppSlots }) {
  const { state, actions } = useOndoB()
  const canvasRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const scrollPositions = useRef<Partial<Record<OndoBTab, number>>>({})
  const previousSurface = useRef(state.surface)
  const previousDocumentLanguage = useRef<string | null>(null)
  const appliedDocumentLanguage = useRef(state.locale)
  const active = state.tab === "my"
    ? slots.saved
    : state.tab === "tables"
      ? slots.tables
      : state.tab === "id"
        ? slots.travelerId
        : state.tab === "settings"
          ? slots.settings
          : slots.explore
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

  useLayoutEffect(() => {
    const region = contentRef.current
    if (!region) return
    const remembered = scrollPositions.current[state.tab] ?? 0
    region.scrollTop = Math.min(remembered, Math.max(0, region.scrollHeight - region.clientHeight))
  }, [state.tab])

  useLayoutEffect(() => {
    const region = contentRef.current
    if (!region) return
    const syncViewport = () => region.style.setProperty("--ondo-scroll-viewport", `${region.clientHeight}px`)
    const observer = new ResizeObserver(syncViewport)
    observer.observe(region)
    syncViewport()
    return () => {
      observer.disconnect()
      region.style.removeProperty("--ondo-scroll-viewport")
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const region = contentRef.current
    if (!canvas || !region) return
    let restoreAt: number | null = null
    const syncModalScroll = () => {
      const hasModal = canvas.querySelector("[aria-modal='true']:not([aria-hidden='true']):not([inert])") !== null
      if (hasModal && restoreAt === null) {
        restoreAt = region.scrollTop
        region.scrollTop = 0
      } else if (!hasModal && restoreAt !== null) {
        const nextTop = Math.min(restoreAt, Math.max(0, region.scrollHeight - region.clientHeight))
        restoreAt = null
        region.scrollTop = nextTop
        scrollPositions.current[state.tab] = nextTop
      }
    }
    const observer = new MutationObserver(syncModalScroll)
    observer.observe(canvas, {
      attributes: true,
      attributeFilter: ["aria-hidden", "aria-modal", "inert"],
      childList: true,
      subtree: true,
    })
    syncModalScroll()
    return () => observer.disconnect()
  }, [state.tab])

  const selectTab = (tab: OndoBTab) => {
    const region = contentRef.current
    if (region) scrollPositions.current[state.tab] = region.scrollTop
    if (tab === state.tab) {
      if (region) {
        region.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })
        scrollPositions.current[tab] = 0
      }
      return
    }
    actions.setTab(tab)
  }

  const activeLabel = B_NAV_COPY[state.locale][state.tab]

  return (
    <main className={styles.stage} data-ondo-locale={state.locale} data-testid="ondo-b-root" data-variant="B" data-locale={state.locale}>
      <section ref={canvasRef} className={styles.canvas} aria-label={state.locale === "ko" ? "ONDO 공식 식음료 장소 앱" : "ONDO official food place app"} data-testid="ondo-canvas">
        <div
          ref={contentRef}
          className={styles.content}
          id="ondo-active-panel"
          role="region"
          tabIndex={0}
          aria-label={state.locale === "ko" ? `${activeLabel} 콘텐츠` : `${activeLabel} content`}
          data-active-tab={state.tab}
          data-scroll-owner="true"
          data-testid="ondo-scroll-region"
          inert={onboardingActive ? true : undefined}
          aria-hidden={onboardingActive ? true : undefined}
          onScroll={(event) => { scrollPositions.current[state.tab] = event.currentTarget.scrollTop }}
        >
          {active}
        </div>
        <nav className={styles.nav} data-testid="ondo-main-nav" data-nav-count="5" aria-label={state.locale === "en" ? "Main navigation" : "주요 메뉴"} inert={onboardingActive ? true : undefined} aria-hidden={onboardingActive ? true : undefined}>
          {B_NAV.map(({ id, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={state.tab === id ? styles.navActive : undefined}
              aria-current={state.tab === id ? "page" : undefined}
              aria-controls="ondo-active-panel"
              aria-label={B_NAV_COPY[state.locale][id]}
              data-state={state.tab === id ? "selected" : "idle"}
              data-testid={`nav-${id}`}
              onFocus={(event) => event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" })}
              onClick={() => selectTab(id)}
            >
              <span className={styles.navIcon} aria-hidden="true"><Icon size={22} strokeWidth={state.tab === id ? 2.35 : 1.75} /></span>
              <small className={styles.navLabel}>{B_NAV_COPY[state.locale][id]}</small>
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
