"use client"

import { useEffect, useState } from "react"

/**
 * Deterministic failure injection is compiled into an explicitly opted-in QA
 * build only. Production and standalone artifacts keep this false, so query
 * parameters and console globals cannot alter traveler-visible state.
 */
export const QA_RUNTIME_ENABLED = process.env.NEXT_PUBLIC_ONDO_QA_CONTROLS === "1"

const QA_ENABLED_KEY = "ondo.qa.controls.v1"
const QA_SCENARIO_KEY = "ondo.qa.scenario.v1"
const QA_SCENARIOS = new Set([
  "bridge-expired",
  "bridge-failed",
  "labs-wallet-fail",
  "local-signal-fail",
  "location-denied",
  "media-failed",
  "mint-failed",
  "payment-declined",
  "save-failed",
  "table-full",
  "table-network",
  "table-policy",
  "tile-error",
  "trait-retry-fail",
])

let qaCapturedForDocument = false
let qaCapturedPath: string | null = null

/** Capture the explicit QA seam before discovery URL canonicalization removes
 * all non-product query keys. Values stay session-only and are allow-listed. */
export function captureQaControls(search: string) {
  if (!QA_RUNTIME_ENABLED) return
  if (typeof window === "undefined") return
  const params = new URLSearchParams(search)
  const currentPath = window.location.pathname
  if (qaCapturedForDocument && qaCapturedPath === currentPath && !params.has("qa")) return
  qaCapturedForDocument = true
  qaCapturedPath = currentPath
  try {
    if (params.get("qa") !== "1") {
      window.sessionStorage.removeItem(QA_ENABLED_KEY)
      window.sessionStorage.removeItem(QA_SCENARIO_KEY)
      return
    }
    window.sessionStorage.setItem(QA_ENABLED_KEY, "1")
    const scenario = params.get("scenario")
    if (scenario && QA_SCENARIOS.has(scenario)) window.sessionStorage.setItem(QA_SCENARIO_KEY, scenario)
    else window.sessionStorage.removeItem(QA_SCENARIO_KEY)
  } catch {
    // Storage-disabled browsers keep the ordinary traveler journey fail-closed.
  }
}

export function readQaScenario() {
  if (!QA_RUNTIME_ENABLED) return null
  if (typeof window === "undefined") return null
  try {
    if (window.sessionStorage.getItem(QA_ENABLED_KEY) !== "1") return null
    const scenario = window.sessionStorage.getItem(QA_SCENARIO_KEY)
    return scenario && QA_SCENARIOS.has(scenario) ? scenario : null
  } catch {
    return null
  }
}

/**
 * Keeps deterministic authoring controls out of the ordinary traveler journey.
 * The explicit query seam remains stable for Playwright and visual QA.
 */
export function useQaControls() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (!QA_RUNTIME_ENABLED) return
    captureQaControls(window.location.search)
    try {
      setEnabled(window.sessionStorage.getItem(QA_ENABLED_KEY) === "1")
    } catch {
      setEnabled(false)
    }
  }, [])

  return enabled
}

/** Read an allowlisted test fixture installed by Playwright in an opted-in QA build. */
export function readQaRuntime<T extends object>() {
  if (!QA_RUNTIME_ENABLED || typeof window === "undefined") return undefined
  return (window as Window & { __ONDO_B_QA__?: T }).__ONDO_B_QA__
}
