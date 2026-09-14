"use client"

import { useLayoutEffect, useRef, useState } from "react"

export const SHEET_EXIT_DURATION_MS = 260
const SHEET_EXIT_DEADLINE_MS = SHEET_EXIT_DURATION_MS + 160

export type SheetPresencePhase = "open" | "closing" | "closed"

export type SheetPresence<T> =
  | { value: T; phase: "open" | "closing" }
  | { value: null; phase: "closed" }

const CLOSED_PRESENCE = { value: null, phase: "closed" } as const

/**
 * Keeps the last rendered sheet value around only for its visual exit.
 * Callers still clear their domain state immediately; this hook never delays
 * or replays that mutation.
 */
export function useSheetPresence<T>(desired: T | null): SheetPresence<T> {
  const initialPresence: SheetPresence<T> = desired === null
    ? CLOSED_PRESENCE
    : { value: desired, phase: "open" }
  const [presence, setPresence] = useState<SheetPresence<T>>(initialPresence)
  const presenceRef = useRef<SheetPresence<T>>(initialPresence)
  const desiredRef = useRef(desired)
  const firstExitFrameRef = useRef<number | null>(null)
  const paintedExitFrameRef = useRef<number | null>(null)
  const closeTimerRef = useRef<number | null>(null)
  const exitDeadlineTimerRef = useRef<number | null>(null)
  const exitLifecycleCleanupRef = useRef<(() => void) | null>(null)

  function commitPresence(next: SheetPresence<T>) {
    presenceRef.current = next
    setPresence(next)
  }

  function cancelExitSchedule() {
    if (firstExitFrameRef.current !== null) window.cancelAnimationFrame(firstExitFrameRef.current)
    if (paintedExitFrameRef.current !== null) window.cancelAnimationFrame(paintedExitFrameRef.current)
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current)
    if (exitDeadlineTimerRef.current !== null) window.clearTimeout(exitDeadlineTimerRef.current)
    exitLifecycleCleanupRef.current?.()
    firstExitFrameRef.current = null
    paintedExitFrameRef.current = null
    closeTimerRef.current = null
    exitDeadlineTimerRef.current = null
    exitLifecycleCleanupRef.current = null
  }

  function finishExit() {
    if (desiredRef.current !== null) return
    cancelExitSchedule()
    commitPresence(CLOSED_PRESENCE)
  }

  useLayoutEffect(() => {
    // Timers must observe committed intent. Mutating this ref during render can
    // poison an existing close when a concurrent reopen render is abandoned.
    desiredRef.current = desired
    cancelExitSchedule()

    if (desired !== null) {
      const current = presenceRef.current
      if (current.value !== desired || current.phase !== "open") commitPresence({ value: desired, phase: "open" })
      return
    }

    const current = presenceRef.current
    if (current.value === null) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      commitPresence(CLOSED_PRESENCE)
      return
    }

    if (current.phase !== "closing") commitPresence({ value: current.value, phase: "closing" })
    const finishWhenHidden = () => {
      if (document.hidden) finishExit()
    }
    const finishOnPageHide = () => finishExit()
    document.addEventListener("visibilitychange", finishWhenHidden)
    window.addEventListener("pagehide", finishOnPageHide)
    exitLifecycleCleanupRef.current = () => {
      document.removeEventListener("visibilitychange", finishWhenHidden)
      window.removeEventListener("pagehide", finishOnPageHide)
    }
    if (document.hidden) {
      finishExit()
      return
    }
    // requestAnimationFrame can be heavily throttled when a user backgrounds
    // the tab during a close. Keep the painted two-frame exit for foreground
    // motion, but never leave an invisible sheet owning focus/scroll forever.
    exitDeadlineTimerRef.current = window.setTimeout(finishExit, SHEET_EXIT_DEADLINE_MS)
    // The first frame commits the closing attributes. The second frame gives
    // the browser a paint opportunity before the full animation interval
    // begins, so a fast state mutation cannot consume the exit duration.
    firstExitFrameRef.current = window.requestAnimationFrame(() => {
      firstExitFrameRef.current = null
      paintedExitFrameRef.current = window.requestAnimationFrame(() => {
        paintedExitFrameRef.current = null
        if (desiredRef.current !== null) return
        closeTimerRef.current = window.setTimeout(() => {
          closeTimerRef.current = null
          finishExit()
        }, SHEET_EXIT_DURATION_MS)
      })
    })

    return cancelExitSchedule
  }, [desired])

  useLayoutEffect(() => cancelExitSchedule, [])

  return presence
}
