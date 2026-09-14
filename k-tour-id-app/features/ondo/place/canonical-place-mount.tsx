"use client"

import { useEffect, useLayoutEffect, useMemo, useRef } from "react"
import { useOndoB } from "../shared/state/ondo-b-provider"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import { focusFirstAvailableDestination } from "../shared/ui/focus-destination"
import { isRenderedFocusable } from "../shared/ui/is-rendered-focusable"
import { useSheetPresence } from "../shared/ui/use-sheet-presence"
import { CanonicalPlaceOverlay } from "./canonical-place-overlay"

type CanonicalPlaceSubject = Readonly<{
  key: string
  locale: OndoBLocale
  venueId: string
}>

const FALLBACK_DESTINATIONS = [
  "[data-testid='ondo-b-view-toggle']",
  "[data-testid='ondo-b-search']",
  "#ondo-active-panel",
] as const

export function CanonicalPlaceMount() {
  const { state } = useOndoB()
  const desiredVenueId = state.tab === "ondo" && state.surface.kind === "venue" && state.surface.venueId.startsWith("mois-")
    ? state.surface.venueId
    : null
  const desiredSubject = useMemo<CanonicalPlaceSubject | null>(() => desiredVenueId ? {
    key: desiredVenueId,
    locale: state.locale,
    venueId: desiredVenueId,
  } : null, [desiredVenueId, state.locale])
  const presence = useSheetPresence(desiredSubject)
  const presented = presence.value
  // A traversal/tab handoff can clear the domain subject one render before
  // useSheetPresence commits its retained `closing` phase in a layout effect.
  // Mark that render as closing too so the overlay never snapshots post-exit
  // context as its final painted frame.
  const presentedPhase = desiredSubject?.key === presented?.key && presence.phase === "open" ? "open" : "closing"
  const exactOpenerRef = useRef<HTMLElement | null>(null)
  const openerSelectorRef = useRef<string | null>(null)
  const restoreAfterExitRef = useRef(false)
  const desiredWasOpenRef = useRef(false)
  const desiredKeyRef = useRef<string | null>(null)

  useLayoutEffect(() => {
    if (!desiredSubject) {
      if (desiredWasOpenRef.current) restoreAfterExitRef.current = true
      desiredWasOpenRef.current = false
      return
    }

    const freshSubject = !desiredWasOpenRef.current || desiredKeyRef.current !== desiredSubject.key
    desiredWasOpenRef.current = true
    if (!freshSubject) return

    desiredKeyRef.current = desiredSubject.key
    restoreAfterExitRef.current = false
    const selector = `[data-venue-opener='${CSS.escape(desiredSubject.venueId)}']`
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const exactOpener = active?.matches(selector) ? active : active?.closest<HTMLElement>(selector) ?? null
    exactOpenerRef.current = exactOpener
    openerSelectorRef.current = selector
  }, [desiredSubject])

  useEffect(() => {
    if (presence.value !== null || !restoreAfterExitRef.current) return
    restoreAfterExitRef.current = false
    const exactOpener = exactOpenerRef.current
    const openerSelector = openerSelectorRef.current
    exactOpenerRef.current = null
    openerSelectorRef.current = null
    let cancelFallback: (() => void) | undefined
    const frame = window.requestAnimationFrame(() => {
      const active = document.activeElement
      const claimed = active instanceof HTMLElement
        && active !== document.body
        && active !== document.documentElement
        && active.isConnected
        && !active.closest("[inert],[aria-hidden='true']")
      if (claimed) return
      if (exactOpener?.isConnected && openerSelector && exactOpener.matches(openerSelector) && isRenderedFocusable(exactOpener)) {
        exactOpener.focus({ preventScroll: true })
        return
      }
      cancelFallback = focusFirstAvailableDestination(openerSelector
        ? [openerSelector, ...FALLBACK_DESTINATIONS]
        : FALLBACK_DESTINATIONS)
    })
    return () => {
      window.cancelAnimationFrame(frame)
      cancelFallback?.()
    }
  }, [presence.value])

  if (!presented) return null
  return (
    <CanonicalPlaceOverlay
      key={presented.key}
      locale={presented.locale}
      presenceState={presentedPhase}
      venueId={presented.venueId}
    />
  )
}
