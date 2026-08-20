"use client"

import { useEffect, useState } from "react"

/**
 * Keeps deterministic authoring controls out of the ordinary traveler journey.
 * The explicit query seam remains stable for Playwright and visual QA.
 */
export function useQaControls() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    setEnabled(new URLSearchParams(window.location.search).get("qa") === "1")
  }, [])

  return enabled
}
