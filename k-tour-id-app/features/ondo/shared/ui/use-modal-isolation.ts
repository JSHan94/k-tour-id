"use client"

import type { RefObject } from "react"
import { useEffect } from "react"

const FOCUSABLE = "a[href],button:not([disabled]):not([tabindex='-1']),input:not([disabled]):not([type='hidden']),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])"

type AttributeSnapshot = {
  element: HTMLElement
  inert: string | null
  ariaHidden: string | null
}

/**
 * Isolate a modal from every sibling branch up to the ONDO canvas.
 *
 * The dialog remains in its existing visual stacking context, while content,
 * navigation, and peer overlays are removed from pointer/programmatic access.
 * Existing attributes are restored exactly when the modal closes.
 */
export function useModalIsolation(open: boolean, modalRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return
    const modal = modalRef.current
    const boundary = modal?.closest<HTMLElement>("[data-testid='ondo-canvas']")
    if (!modal || !boundary) return

    const covered = new Map<HTMLElement, AttributeSnapshot>()
    let branch: HTMLElement = modal

    while (branch !== boundary) {
      const parent = branch.parentElement
      if (!parent) break
      Array.from(parent.children).forEach((candidate) => {
        if (!(candidate instanceof HTMLElement) || candidate === branch || candidate.contains(modal)) return
        if (!covered.has(candidate)) {
          covered.set(candidate, {
            element: candidate,
            inert: candidate.getAttribute("inert"),
            ariaHidden: candidate.getAttribute("aria-hidden"),
          })
        }
      })
      branch = parent
    }

    const active = document.activeElement
    if (active instanceof HTMLElement && !modal.contains(active)) {
      modal.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true })
    }

    covered.forEach(({ element }) => {
      element.setAttribute("inert", "")
      element.setAttribute("aria-hidden", "true")
    })

    return () => {
      covered.forEach(({ element, inert, ariaHidden }) => {
        if (!element.isConnected) return
        if (inert == null) element.removeAttribute("inert")
        else element.setAttribute("inert", inert)
        if (ariaHidden == null) element.removeAttribute("aria-hidden")
        else element.setAttribute("aria-hidden", ariaHidden)
      })
    }
  }, [modalRef, open])
}
