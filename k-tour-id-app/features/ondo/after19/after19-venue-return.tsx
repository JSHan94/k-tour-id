"use client"

import { useEffect, useRef } from "react"
import { useOndo } from "../shared/state/ondo-provider"

export const AFTER19_VENUE_RETURN_PARAM = "after19Return"

/**
 * B-only adapter for a venue-scoped After 19 JIT action. The shared gate keeps
 * its generic map return; this mount restores the exact B venue after the gate
 * has been consumed without changing the A product route.
 */
export function After19VenueReturn() {
  const { state, actions } = useOndo()
  const handledToken = useRef<string | null>(null)

  useEffect(() => {
    const gate = state.gate
    if (
      !gate?.consumedAt
      || gate.cta !== "OPEN_AFTER19"
      || !gate.venueId
      || state.after19 !== "A19-ON"
      || handledToken.current === gate.tokenId
    ) return

    handledToken.current = gate.tokenId
    const url = new URL(window.location.href)
    url.searchParams.set("venueId", gate.venueId)
    url.searchParams.set(AFTER19_VENUE_RETURN_PARAM, gate.venueId)
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`)
    actions.setSurface({ kind: "venue", venueId: gate.venueId })
  }, [actions, state.after19, state.gate])

  return null
}
