"use client"

import type { RefObject } from "react"
import { useEffect, useLayoutEffect } from "react"

const FOCUSABLE = "a[href],button:not([disabled]):not([tabindex='-1']),input:not([disabled]):not([type='hidden']),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])"

type AttributeSnapshot = {
  element: HTMLElement
  inert: string | null
  ariaHidden: string | null
}

type IsolationRecord = AttributeSnapshot & {
  owners: Set<symbol>
}

/**
 * Isolation is shared across every ONDO modal mounted in this document. A
 * nested gate may cover the same content/nav branches as its parent sheet;
 * the first owner captures the real pre-modal attributes and the last owner
 * restores them. This avoids treating another modal's temporary `inert` as
 * permanent state when React unmounts overlapping surfaces in either order.
 */
const isolationByElement = new WeakMap<HTMLElement, IsolationRecord>()

function acquireIsolation(element: HTMLElement, owner: symbol) {
  const current = isolationByElement.get(element)
  if (current) {
    current.owners.add(owner)
    return
  }
  isolationByElement.set(element, {
    element,
    inert: element.getAttribute("inert"),
    ariaHidden: element.getAttribute("aria-hidden"),
    owners: new Set([owner]),
  })
  element.setAttribute("inert", "")
  element.setAttribute("aria-hidden", "true")
}

function releaseIsolation(element: HTMLElement, owner: symbol) {
  const current = isolationByElement.get(element)
  if (!current) return
  current.owners.delete(owner)
  if (current.owners.size) return
  isolationByElement.delete(element)
  if (!element.isConnected) return
  if (current.inert == null) element.removeAttribute("inert")
  else element.setAttribute("inert", current.inert)
  if (current.ariaHidden == null) element.removeAttribute("aria-hidden")
  else element.setAttribute("aria-hidden", current.ariaHidden)
}

/**
 * Isolate a modal from every sibling branch up to the ONDO canvas.
 *
 * The dialog remains in its existing visual stacking context, while content,
 * navigation, and peer overlays are removed from pointer/programmatic access.
 * Existing attributes are restored exactly when the modal closes.
 */
export function useModalIsolation(open: boolean, modalRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    if (!open) return
    const modal = modalRef.current
    const boundary = modal?.closest<HTMLElement>("[data-testid='ondo-canvas']")
    if (!modal || !boundary) return

    const covered = new Set<HTMLElement>()
    const owner = Symbol("ondo-modal-isolation")
    let branch: HTMLElement = modal

    const remember = (element: HTMLElement) => {
      if (covered.has(element)) return
      covered.add(element)
    }

    while (branch !== boundary) {
      const parent = branch.parentElement
      if (!parent) break
      Array.from(parent.children).forEach((candidate) => {
        if (!(candidate instanceof HTMLElement) || candidate === branch || candidate.contains(modal)) return
        remember(candidate)
        candidate.querySelectorAll<HTMLElement>("[role='dialog'],[role='alertdialog']").forEach(remember)
      })
      branch = parent
    }

    covered.forEach((element) => acquireIsolation(element, owner))

    return () => {
      covered.forEach((element) => releaseIsolation(element, owner))
    }
  }, [modalRef, open])

  // Keep focus movement passive so a modal owner can snapshot its opener in an
  // earlier passive effect. Isolation itself remains layout-synchronous above,
  // preventing an exposed background frame without changing focus contracts.
  useEffect(() => {
    if (!open) return
    const modal = modalRef.current
    if (!modal) return
    const active = document.activeElement
    if (active instanceof HTMLElement && !modal.contains(active)) {
      modal.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true })
    }
  }, [modalRef, open])
}
