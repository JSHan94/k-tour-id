"use client"

import type { ReactNode } from "react"
import { useEffect, useLayoutEffect, useRef } from "react"
import { Bookmark, IdCard, MapPinned, Settings, UsersRound } from "lucide-react"
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

const B_NAV: Array<{ id: OndoBTab; icon: typeof MapPinned }> = [
  { id: "ondo", icon: MapPinned },
  { id: "my", icon: Bookmark },
  { id: "tables", icon: UsersRound },
  { id: "id", icon: IdCard },
  { id: "settings", icon: Settings },
]

const B_NAV_COPY = {
  en: { ondo: "Explore", my: "My Korea", tables: "Tables", id: "ID · Wallet", settings: "Settings" },
  ko: { ondo: "탐색", my: "내 한국", tables: "테이블", id: "ID · 지갑", settings: "설정" },
  ja: { ondo: "探す", my: "マイ韓国", tables: "テーブル", id: "ID・ウォレット", settings: "設定" },
} as const

const B_NAV_DISPLAY_COPY = {
  en: { ondo: "Explore", my: "Saved", tables: "Tables", id: "Pass", settings: "Settings" },
  ko: { ondo: "탐색", my: "저장", tables: "테이블", id: "패스", settings: "설정" },
  ja: { ondo: "探す", my: "保存", tables: "テーブル", id: "パス", settings: "設定" },
} as const

const B_NAV_ARIA_COPY = {
  en: { ondo: "Explore", my: "Saved · My Korea", tables: "Tables", id: "Pass · ID and Wallet", settings: "Settings" },
  ko: { ondo: "탐색", my: "저장 · 내 한국", tables: "테이블", id: "패스 · ID와 지갑", settings: "설정" },
  ja: { ondo: "探す", my: "保存・マイ韓国", tables: "テーブル", id: "パス・IDとウォレット", settings: "設定" },
} as const

const SHELL_COPY = {
  en: { app: "ONDO Korea food and travel app", content: "content", nav: "Main navigation" },
  ko: { app: "ONDO 한국 먹거리·여행 앱", content: "콘텐츠", nav: "주요 메뉴" },
  ja: { app: "ONDO 韓国フード・旅行アプリ", content: "コンテンツ", nav: "メインメニュー" },
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

  useLayoutEffect(() => {
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

  useLayoutEffect(() => {
    appliedDocumentLanguage.current = state.locale
    document.documentElement.lang = state.locale
  }, [state.locale])

  useEffect(() => {
    const before = previousSurface.current
    previousSurface.current = state.surface
    if (before.kind === "venue" || state.surface.kind !== "venue") return
    const timer = window.setTimeout(() => {
      const peek = document.querySelector<HTMLElement>("[data-testid='canonical-place-peek']")
      if (peek && !peek.contains(document.activeElement)) peek.focus({ preventScroll: true })
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
    let restoreFrame: number | null = null
    const syncModalScroll = () => {
      const hasModal = canvas.querySelector("[aria-modal='true']:not([aria-hidden='true']):not([inert])") !== null
      if (hasModal && restoreAt === null) {
        if (restoreFrame !== null) {
          window.cancelAnimationFrame(restoreFrame)
          restoreFrame = null
        }
        restoreAt = Math.max(region.scrollTop, scrollPositions.current[state.tab] ?? 0)
        region.scrollTop = 0
      } else if (!hasModal && restoreAt !== null) {
        const requestedTop = restoreAt
        restoreAt = null
        restoreFrame = window.requestAnimationFrame(() => {
          restoreFrame = window.requestAnimationFrame(() => {
            restoreFrame = null
            const nextTop = Math.min(requestedTop, Math.max(0, region.scrollHeight - region.clientHeight))
            region.scrollTop = nextTop
            scrollPositions.current[state.tab] = nextTop
          })
        })
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
    return () => {
      observer.disconnect()
      if (restoreFrame !== null) window.cancelAnimationFrame(restoreFrame)
    }
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
      <section ref={canvasRef} className={styles.canvas} aria-label={SHELL_COPY[state.locale].app} data-testid="ondo-canvas" data-responsive-shell="mobile-dock-desktop-rail">
        <div
          ref={contentRef}
          className={styles.content}
          id="ondo-active-panel"
          role="region"
          tabIndex={0}
          aria-label={`${activeLabel} ${SHELL_COPY[state.locale].content}`}
          data-active-tab={state.tab}
          data-scroll-owner="true"
          data-testid="ondo-scroll-region"
          inert={onboardingActive ? true : undefined}
          aria-hidden={onboardingActive ? true : undefined}
          onScroll={(event) => { scrollPositions.current[state.tab] = event.currentTarget.scrollTop }}
        >
          {active}
        </div>
        <nav className={styles.nav} data-testid="ondo-main-nav" data-nav-count="5" data-navigation-mode="responsive" data-nav-presentation="labeled-universal-icons" aria-label={SHELL_COPY[state.locale].nav} inert={onboardingActive ? true : undefined} aria-hidden={onboardingActive ? true : undefined}>
          {B_NAV.map(({ id, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={state.tab === id ? styles.navActive : undefined}
              aria-current={state.tab === id ? "page" : undefined}
              aria-controls="ondo-active-panel"
              aria-label={B_NAV_ARIA_COPY[state.locale][id]}
              data-state={state.tab === id ? "selected" : "idle"}
              data-testid={`nav-${id}`}
              onFocus={(event) => event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" })}
              onClick={() => selectTab(id)}
            >
              <span className={styles.navIcon} aria-hidden="true">
                <Icon size={22} strokeWidth={state.tab === id ? 2.35 : 1.75} />
              </span>
              <small className={styles.navLabel} aria-hidden="true">{B_NAV_DISPLAY_COPY[state.locale][id]}</small>
            </button>
          ))}
        </nav>
        {slots.overlays}
        {state.toast && !onboardingActive ? <div className={styles.toast} data-testid="ondo-toast" role="status">{state.toast}</div> : null}
      </section>
    </main>
  )
}

export function OndoAppB({ slots }: { slots: OndoBAppSlots }) {
  return <OndoBProvider><OndoBShell slots={slots} /></OndoBProvider>
}
