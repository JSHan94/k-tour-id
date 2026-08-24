"use client"

import { useOndoB } from "../shared/state/ondo-b-provider"
import { CanonicalPlaceOverlay } from "./canonical-place-overlay"

export function CanonicalPlaceMount() {
  const { state } = useOndoB()
  if (state.surface.kind !== "venue" || !state.surface.venueId.startsWith("mois-")) return null
  return <CanonicalPlaceOverlay />
}
