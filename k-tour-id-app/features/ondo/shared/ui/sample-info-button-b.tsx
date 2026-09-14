"use client"

import { FlaskConical } from "lucide-react"
import { useOndoB } from "../state/ondo-b-provider"
import { useReviewSampleSession } from "./use-qa-controls"
import styles from "./sample-info-button-b.module.css"

export const SAMPLE_INFO_EVENT = "ondo:b:sample-info"

/** Shared disclosure copy for the header indicator and its compact-map entry. */
export function sampleInfoCopyB(locale: "en" | "ko" | "ja") {
  return locale === "ko" ? { label: "데모", about: "데모 안내" }
    : locale === "ja" ? { label: "デモ", about: "デモについて" }
      : { label: "Demo", about: "About this demo" }
}

/** Fits inside the page header, never floats over map controls or the dock. */
export function SampleInfoButtonB() {
  const { state } = useOndoB()
  const enabled = useReviewSampleSession()
  const copy = sampleInfoCopyB(state.locale)
  if (!enabled) return null
  return <button type="button" className={styles.button} data-testid="review-sample-indicator" aria-label={copy.about} onClick={() => window.dispatchEvent(new Event(SAMPLE_INFO_EVENT))}><FlaskConical size={14} aria-hidden="true" /><span>{copy.label}</span></button>
}
