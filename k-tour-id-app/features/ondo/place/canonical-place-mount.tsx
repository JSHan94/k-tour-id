"use client"

import { useOndo } from "../shared/state/ondo-provider"
import { CanonicalPlaceOverlay } from "./canonical-place-overlay"

export function CanonicalPlaceMount() {
  const { state } = useOndo()
  if (state.surface.kind !== "venue" || !state.surface.venueId.startsWith("mois-")) return null
  return <CanonicalPlaceOverlay />
}
