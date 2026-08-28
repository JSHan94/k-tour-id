"use client"

import type { RefObject } from "react"
import { useEffect, useLayoutEffect } from "react"

const FOCUSABLE = "a[href],button:not([disabled]):not([tabindex='-1']),input:not([disabled]):not([type='hidden']),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])"

type AttributeSnapshot = {
  element: HTMLElement
  inert: string | null
  ariaHidden: string | null
  role: string | null
  ariaModal: string | null
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
    role: element.getAttribute("role"),
    ariaModal: element.getAttribute("aria-modal"),
    owners: new Set([owner]),
  })
  element.setAttribute("inert", "")
  element.setAttribute("aria-hidden", "true")
  if (element.matches("[role='dialog'],[role='alertdialog']")) {
    element.removeAttribute("role")
    element.removeAttribute("aria-modal")
  }
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
  if (current.role == null) element.removeAttribute("role")
  else element.setAttribute("role", current.role)
  if (current.ariaModal == null) element.removeAttribute("aria-modal")
  else element.setAttribute("aria-modal", current.ariaModal)
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
    if (!modal) return
    const localBoundary = modal.closest<HTMLElement>("[data-testid='ondo-canvas']")
    const boundary = localBoundary ?? document.querySelector<HTMLElement>("[data-testid='ondo-canvas']")
    if (!boundary) return

    const owner = Symbol("ondo-modal-isolation")
    const covered = new Set<HTMLElement>()
    const priority = Number(modal.dataset.modalLayerPriority ?? "0") || 0
    let branch: HTMLElement = modal

    const remember = (element: HTMLElement) => {
      if (covered.has(element)) return
      covered.add(element)
    }

    let portalObserver: MutationObserver | null = null
    if (!localBoundary) {
      // A portal modal (currently the wallet-connect sheet) lives under
      // document.body rather than inside the ONDO canvas. Keep the canvas in
      // sync for the portal's whole lifetime so a lower-priority dialog that
      // mounts after the portal is isolated too, independent of mount order.
      const syncPortalIsolation = () => {
        const desired = new Set<HTMLElement>()
        Array.from(boundary.children).forEach((candidate) => {
          if (!(candidate instanceof HTMLElement)) return
          const priorityOwner = candidate.matches("[data-modal-layer-priority]")
            ? candidate
            : candidate.querySelector<HTMLElement>("[data-modal-layer-priority]")
          const candidatePriority = Number(priorityOwner?.dataset.modalLayerPriority ?? "0") || 0
          if (candidatePriority > priority) return
          desired.add(candidate)
          candidate.querySelectorAll<HTMLElement>("[role='dialog'],[role='alertdialog']").forEach((dialog) => desired.add(dialog))
        })
        // acquireIsolation intentionally removes dialog semantics. Preserve
        // those already-covered descendants while their eligible canvas
        // branch remains mounted, even when another child mutation triggers a
        // rescan and the role selector no longer matches them.
        covered.forEach((element) => {
          if (!element.isConnected || desired.has(element)) return
          if (Array.from(desired).some((candidate) => candidate !== element && candidate.contains(element))) desired.add(element)
        })
        covered.forEach((element) => {
          if (desired.has(element)) return
          releaseIsolation(element, owner)
          covered.delete(element)
        })
        desired.forEach((element) => {
          if (covered.has(element)) return
          covered.add(element)
          acquireIsolation(element, owner)
        })
      }
      syncPortalIsolation()
      portalObserver = new MutationObserver(syncPortalIsolation)
      portalObserver.observe(boundary, {
        attributes: true,
        attributeFilter: ["data-modal-layer-priority"],
        childList: true,
        subtree: true,
      })
    } else {
      while (branch !== boundary) {
        const parent = branch.parentElement
        if (!parent) break
        Array.from(parent.children).forEach((candidate) => {
          if (!(candidate instanceof HTMLElement) || candidate === branch || candidate.contains(modal)) return
          const priorityOwner = candidate.matches("[data-modal-layer-priority]")
            ? candidate
            : candidate.querySelector<HTMLElement>("[data-modal-layer-priority]")
          const candidatePriority = Number(priorityOwner?.dataset.modalLayerPriority ?? "0") || 0
          // A parent sheet can mount after a restored nested gate. Keep the
          // explicitly higher-priority child operable instead of making it inert
          // just because React committed the parent later on this reload.
          if (candidatePriority > priority) return
          remember(candidate)
          candidate.querySelectorAll<HTMLElement>("[role='dialog'],[role='alertdialog']").forEach(remember)
        })
        branch = parent
      }
    }

    if (localBoundary) covered.forEach((element) => acquireIsolation(element, owner))

    return () => {
      portalObserver?.disconnect()
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
