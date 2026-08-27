"use client"

import { useOndoB } from "../shared/state/ondo-b-provider"
import { EditorialPlaceOverlayB } from "./editorial-place-overlay-b"

export function EditorialPlaceMountB() {
  const { state } = useOndoB()
  return state.surface.kind === "editorial_place" ? <EditorialPlaceOverlayB /> : null
}
