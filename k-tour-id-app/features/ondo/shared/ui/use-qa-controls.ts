"use client"

import { useEffect, useState } from "react"
import { SAMPLE_ENVIRONMENT_ENABLED } from "../../contracts/sample-environment"

/**
 * Deterministic failure injection is compiled into an explicitly opted-in QA
 * build only. Production and standalone artifacts keep this false, so query
 * parameters and console globals cannot alter traveler-visible state.
 */
export const QA_RUNTIME_ENABLED = process.env.NEXT_PUBLIC_ONDO_QA_CONTROLS === "1"

const QA_ENABLED_KEY = "ondo.qa.controls.v1"
const QA_SCENARIO_KEY = "ondo.qa.scenario.v1"
const REVIEW_ENABLED_KEY = "ondo.review.flow.v1"
export const REVIEW_FLOW_CHANGE_EVENT = "ondo-review-flow-change"
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

export function hasReviewSessionOptIn() {
  if (typeof window === "undefined") return false
  const choice = new URLSearchParams(window.location.search).get("review")
  if (choice === "0") return false
  if (choice === "1") return true
  try {
    const stored = window.sessionStorage.getItem(REVIEW_ENABLED_KEY)
    return stored === "1" || (stored !== "0" && SAMPLE_ENVIRONMENT_ENABLED)
  } catch {
    return SAMPLE_ENVIRONMENT_ENABLED
  }
}

/**
 * Starts the prepared, session-only review path from a traveler-visible dead
 * end. This does not enable authoring QA controls and cannot inject failures.
 * External integrations remain disconnected; downstream code must still mint
 * a live review-fixture authority before accepting any successful result.
 */
export function enterReviewSample() {
  if (typeof window === "undefined") return false
  try {
    window.sessionStorage.setItem(REVIEW_ENABLED_KEY, "1")
    const url = new URL(window.location.href)
    url.searchParams.set("review", "1")
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`)
    window.dispatchEvent(new Event(REVIEW_FLOW_CHANGE_EVENT))
    return true
  } catch {
    return false
  }
}

/** End the traveler-visible sample environment and reload the same product
 * location without carrying review authority into later actions. */
export function exitReviewSample() {
  if (typeof window === "undefined") return false
  try {
    window.sessionStorage.setItem(REVIEW_ENABLED_KEY, "0")
    const url = new URL(window.location.href)
    url.searchParams.set("review", "0")
    window.dispatchEvent(new Event(REVIEW_FLOW_CHANGE_EVENT))
    window.location.replace(`${url.pathname}${url.search}${url.hash}`)
    return true
  } catch {
    return false
  }
}

function hasRuntimeQaSessionOptIn() {
  if (!QA_RUNTIME_ENABLED || typeof window === "undefined") return false
  try {
    return window.sessionStorage.getItem(QA_ENABLED_KEY) === "1"
  } catch {
    return false
  }
}

export function hasQaSessionOptIn() {
  return hasReviewSessionOptIn() || hasRuntimeQaSessionOptIn()
}

/**
 * Storage and authority consumers must consult the live tab opt-in instead of
 * the build flag. A QA-enabled bundle alone is never permission to accept a
 * serialized review receipt.
 */
export function qaReviewFixtureOptions() {
  return { allowReviewFixture: hasQaSessionOptIn() } as const
}

/** Capture the explicit QA seam before discovery URL canonicalization removes
 * all non-product query keys. Values stay session-only and are allow-listed. */
export function captureQaControls(search: string) {
  if (typeof window === "undefined") return
  const params = new URLSearchParams(search)
  const currentPath = window.location.pathname
  if (qaCapturedForDocument && qaCapturedPath === currentPath && !params.has("qa") && !params.has("review")) return
  qaCapturedForDocument = true
  qaCapturedPath = currentPath
  try {
    const requestedReview = params.get("review")
    if (requestedReview === "1") window.sessionStorage.setItem(REVIEW_ENABLED_KEY, "1")
    else if (requestedReview !== null) window.sessionStorage.setItem(REVIEW_ENABLED_KEY, "0")

    if (!QA_RUNTIME_ENABLED) return
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
  if (!hasRuntimeQaSessionOptIn()) return null
  try {
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
    captureQaControls(window.location.search)
    const sync = () => setEnabled(hasQaSessionOptIn())
    sync()
    window.addEventListener(REVIEW_FLOW_CHANGE_EVENT, sync)
    window.addEventListener("popstate", sync)
    return () => {
      window.removeEventListener(REVIEW_FLOW_CHANGE_EVENT, sync)
      window.removeEventListener("popstate", sync)
    }
  }, [])

  return enabled
}

/** Product-shell visibility for the explicit sample boundary. This is kept
 * separate from authoring QA, which must never create traveler-visible state. */
export function useReviewSampleSession() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const sync = () => setEnabled(hasReviewSessionOptIn())
    sync()
    window.addEventListener(REVIEW_FLOW_CHANGE_EVENT, sync)
    window.addEventListener("popstate", sync)
    return () => {
      window.removeEventListener(REVIEW_FLOW_CHANGE_EVENT, sync)
      window.removeEventListener("popstate", sync)
    }
  }, [])

  return enabled
}

/**
 * Read an allowlisted fixture only after this tab has explicitly opted into QA.
 * The session marker survives product-URL canonicalization, while a QA-enabled
 * build and a console global alone never authorize fixture state.
 */
export function readQaRuntime<T extends object>() {
  if (!hasQaSessionOptIn()) return undefined
  if (!hasRuntimeQaSessionOptIn()) return undefined
  return (window as Window & { __ONDO_B_QA__?: T }).__ONDO_B_QA__
}
