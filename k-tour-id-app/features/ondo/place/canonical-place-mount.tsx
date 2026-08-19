"use client"

import { lazy, Suspense } from "react"
import { useOndo } from "../shared/state/ondo-provider"

const CanonicalPlaceOverlay = lazy(() => import("./canonical-place-overlay").then((module) => ({ default: module.CanonicalPlaceOverlay })))

export function CanonicalPlaceMount() {
  const { state } = useOndo()
  if (state.surface.kind !== "venue" || !state.surface.venueId.startsWith("mois-")) return null
  return <Suspense fallback={null}><CanonicalPlaceOverlay /></Suspense>
}
