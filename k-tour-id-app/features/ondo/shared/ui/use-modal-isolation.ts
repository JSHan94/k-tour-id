"use client"

import type { RefObject } from "react"
import { useEffect, useLayoutEffect, useRef } from "react"

const FOCUSABLE = "a[href],button:not([disabled]):not([tabindex='-1']),input:not([disabled]):not([type='hidden']),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex='-1'])"

type AttributeSnapshot = {
  element: HTMLElement
  inert: string | null
  ariaHidden: string | null
  role: string | null
  ariaModal: string | null
}

type IsolationRecord = AttributeSnapshot & {
  owners: Set<symbol>
  semanticOwners: Set<symbol>
}

/**
 * Isolation is shared across every ONDO modal mounted in this document. A
 * nested gate may cover the same content/nav branches as its parent sheet;
 * the first owner captures the real pre-modal attributes and the last owner
 * restores them. This avoids treating another modal's temporary `inert` as
 * permanent state when React unmounts overlapping surfaces in either order.
 */
const isolationByElement = new WeakMap<HTMLElement, IsolationRecord>()

function isDialogSemantic(element: HTMLElement, snapshot?: AttributeSnapshot) {
  const role = snapshot?.role ?? element.getAttribute("role")
  return role === "dialog" || role === "alertdialog" || snapshot?.ariaModal === "true" || element.getAttribute("aria-modal") === "true"
}

function restoreAttribute(element: HTMLElement, name: string, value: string | null) {
  if (value == null) element.removeAttribute(name)
  else element.setAttribute(name, value)
}

type ModalBoundaryRecord = Map<symbol, number>

/**
 * A modal can live inside the ONDO canvas or in a body portal. Publishing the
 * active owners on the canvas gives the shell one topology-independent source
 * of truth for hiding its dock and freezing its scroll owner. The registry is
 * reference counted because a decision or identity gate can temporarily sit
 * above its parent task.
 */
const modalOwnersByBoundary = new WeakMap<HTMLElement, ModalBoundaryRecord>()
export const ONDO_MODAL_ENTRY_EVENT = "ondo:modal-entry"

type ActiveModalRecord = {
  owner: symbol
  modal: HTMLElement
  boundary: HTMLElement
  order: number
  covered: Set<HTMLElement>
  semanticCovered: Set<HTMLElement>
}

type BoundaryObserverRecord = {
  count: number
  observer: MutationObserver
}

const activeModalsByBoundary = new WeakMap<HTMLElement, Map<symbol, ActiveModalRecord>>()
const modalObserversByBoundary = new WeakMap<HTMLElement, BoundaryObserverRecord>()
let modalMountOrder = 0

function syncModalBoundary(boundary: HTMLElement, owners: ModalBoundaryRecord) {
  if (!owners.size) {
    boundary.removeAttribute("data-ondo-modal-open")
    boundary.removeAttribute("data-ondo-modal-priority")
    modalOwnersByBoundary.delete(boundary)
    return
  }
  boundary.dataset.ondoModalOpen = "true"
  boundary.dataset.ondoModalPriority = String(Math.max(...owners.values()))
}

function acquireModalBoundary(boundary: HTMLElement, owner: symbol, priority: number) {
  const owners = modalOwnersByBoundary.get(boundary) ?? new Map<symbol, number>()
  owners.set(owner, priority)
  modalOwnersByBoundary.set(boundary, owners)
  syncModalBoundary(boundary, owners)
  boundary.dispatchEvent(new CustomEvent(ONDO_MODAL_ENTRY_EVENT, { detail: { priority } }))
}

function releaseModalBoundary(boundary: HTMLElement, owner: symbol) {
  const owners = modalOwnersByBoundary.get(boundary)
  if (!owners) return
  owners.delete(owner)
  syncModalBoundary(boundary, owners)
}

function priorityOf(element: HTMLElement) {
  const value = Number(element.dataset.modalLayerPriority ?? "0")
  return Number.isFinite(value) ? value : 0
}

function highestPriorityIn(branch: HTMLElement) {
  let highest = branch.hasAttribute("data-modal-layer-priority") ? priorityOf(branch) : 0
  branch.querySelectorAll<HTMLElement>("[data-modal-layer-priority]").forEach((layer) => {
    highest = Math.max(highest, priorityOf(layer))
  })
  return highest
}

function topActiveModal(records: Map<symbol, ActiveModalRecord>, excludedOwner?: symbol) {
  return Array.from(records.values())
    .filter((record) => record.owner !== excludedOwner && record.modal.isConnected)
    .sort((left, right) => priorityOf(right.modal) - priorityOf(left.modal) || right.order - left.order)[0] ?? null
}

let documentScrollLockCount = 0
let documentScrollSnapshot: { overflow: string; overscrollBehavior: string } | null = null

/**
 * The app canvas owns scrolling, but a modal must also stop the document from
 * rubber-banding behind it on iOS. The lock is reference counted so replacing
 * one decision with the next cannot briefly unlock the page.
 */
export function useDocumentScrollLock(locked: boolean) {
  useLayoutEffect(() => {
    if (!locked) return
    if (documentScrollLockCount === 0) {
      documentScrollSnapshot = {
        overflow: document.body.style.overflow,
        overscrollBehavior: document.body.style.overscrollBehavior,
      }
      document.body.style.overflow = "hidden"
      document.body.style.overscrollBehavior = "none"
    }
    documentScrollLockCount += 1

    return () => {
      documentScrollLockCount = Math.max(0, documentScrollLockCount - 1)
      if (documentScrollLockCount !== 0 || !documentScrollSnapshot) return
      document.body.style.overflow = documentScrollSnapshot.overflow
      document.body.style.overscrollBehavior = documentScrollSnapshot.overscrollBehavior
      documentScrollSnapshot = null
    }
  }, [locked])
}

/**
 * Constrain a modal layer to the part of its containing canvas that is visible
 * above an on-screen keyboard. CSS keeps the sheet anchored; this hook only
 * publishes the current visual-viewport rectangle and never owns scrolling.
 */
export function useModalVisualViewport(layerRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const layer = layerRef.current
    if (!layer) return
    const containingBlock = layer.offsetParent instanceof HTMLElement
      ? layer.offsetParent
      : layer.closest<HTMLElement>("[data-testid='ondo-canvas']")
    let frame = 0

    const sync = () => {
      frame = 0
      const blockRect = containingBlock?.getBoundingClientRect() ?? {
        top: 0,
        bottom: window.innerHeight,
        height: window.innerHeight,
      }
      const viewport = window.visualViewport
      const viewportTop = viewport?.offsetTop ?? 0
      const viewportBottom = viewportTop + (viewport?.height ?? window.innerHeight)
      const visibleTop = Math.max(blockRect.top, viewportTop)
      const visibleBottom = Math.min(blockRect.bottom, viewportBottom)
      const height = Math.max(0, Math.min(blockRect.height, visibleBottom - visibleTop))
      layer.style.setProperty("--ondo-sheet-viewport-top", `${Math.max(0, visibleTop - blockRect.top)}px`)
      layer.style.setProperty("--ondo-sheet-viewport-height", `${height}px`)
    }
    const schedule = () => {
      if (frame) window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(sync)
    }
    const observer = containingBlock && typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(schedule)
      : null

    if (observer && containingBlock) observer.observe(containingBlock)
    window.addEventListener("resize", schedule)
    window.visualViewport?.addEventListener("resize", schedule)
    window.visualViewport?.addEventListener("scroll", schedule)
    sync()

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      observer?.disconnect()
      window.removeEventListener("resize", schedule)
      window.visualViewport?.removeEventListener("resize", schedule)
      window.visualViewport?.removeEventListener("scroll", schedule)
      layer.style.removeProperty("--ondo-sheet-viewport-top")
      layer.style.removeProperty("--ondo-sheet-viewport-height")
    }
  }, [layerRef])
}

function acquireIsolation(element: HTMLElement, owner: symbol) {
  const current = isolationByElement.get(element)
  if (current) {
    current.owners.add(owner)
    if (!element.hasAttribute("inert")) element.setAttribute("inert", "")
    if (element.getAttribute("aria-hidden") !== "true") element.setAttribute("aria-hidden", "true")
    if (isDialogSemantic(element, current)) {
      if (element.hasAttribute("role")) element.removeAttribute("role")
      if (element.hasAttribute("aria-modal")) element.removeAttribute("aria-modal")
    }
    return
  }
  const record: IsolationRecord = {
    element,
    inert: element.getAttribute("inert"),
    ariaHidden: element.getAttribute("aria-hidden"),
    role: element.getAttribute("role"),
    ariaModal: element.getAttribute("aria-modal"),
    owners: new Set([owner]),
    semanticOwners: new Set(),
  }
  isolationByElement.set(element, record)
  element.setAttribute("inert", "")
  element.setAttribute("aria-hidden", "true")
  if (isDialogSemantic(element, record)) {
    element.removeAttribute("role")
    element.removeAttribute("aria-modal")
  }
}

function releaseIsolation(element: HTMLElement, owner: symbol) {
  const current = isolationByElement.get(element)
  if (!current) return
  current.owners.delete(owner)
  if (current.owners.size) return
  if (!element.isConnected) {
    isolationByElement.delete(element)
    return
  }
  restoreAttribute(element, "inert", current.inert)
  restoreAttribute(element, "aria-hidden", current.ariaHidden)
  if (current.semanticOwners.size) {
    element.removeAttribute("role")
    element.removeAttribute("aria-modal")
    return
  }
  isolationByElement.delete(element)
  restoreAttribute(element, "role", current.role)
  restoreAttribute(element, "aria-modal", current.ariaModal)
}

function acquireSemanticIsolation(element: HTMLElement, owner: symbol) {
  const current = isolationByElement.get(element)
  if (current) {
    current.semanticOwners.add(owner)
  } else {
    isolationByElement.set(element, {
      element,
      inert: element.getAttribute("inert"),
      ariaHidden: element.getAttribute("aria-hidden"),
      role: element.getAttribute("role"),
      ariaModal: element.getAttribute("aria-modal"),
      owners: new Set(),
      semanticOwners: new Set([owner]),
    })
  }
  if (element.hasAttribute("role")) element.removeAttribute("role")
  if (element.hasAttribute("aria-modal")) element.removeAttribute("aria-modal")
}

function releaseSemanticIsolation(element: HTMLElement, owner: symbol) {
  const current = isolationByElement.get(element)
  if (!current) return
  current.semanticOwners.delete(owner)
  if (current.owners.size || current.semanticOwners.size) return
  isolationByElement.delete(element)
  if (!element.isConnected) return
  restoreAttribute(element, "inert", current.inert)
  restoreAttribute(element, "aria-hidden", current.ariaHidden)
  restoreAttribute(element, "role", current.role)
  restoreAttribute(element, "aria-modal", current.ariaModal)
}

function bodyPortalBranch(element: HTMLElement, boundary: HTMLElement) {
  if (boundary.contains(element)) return null
  let branch = element
  while (branch.parentElement && branch.parentElement !== document.body) branch = branch.parentElement
  return branch.parentElement === document.body ? branch : element
}

function addIsolationBranch(
  desired: Set<HTMLElement>,
  branch: HTMLElement,
  records: Iterable<ActiveModalRecord>,
) {
  desired.add(branch)
  branch.querySelectorAll<HTMLElement>("[role='dialog'],[role='alertdialog']").forEach((dialog) => desired.add(dialog))
  // Covered dialogs temporarily have no role. Carry them into the next owner
  // before the prior owner releases so priority hand-offs never expose a
  // background frame or capture an already-mutated attribute snapshot.
  for (const record of records) {
    record.covered.forEach((element) => {
      if (branch !== element && branch.contains(element)) desired.add(element)
    })
  }
}

function desiredIsolationFor(top: ActiveModalRecord, records: Map<symbol, ActiveModalRecord>) {
  const desired = new Set<HTMLElement>()
  const semanticDesired = new Set<HTMLElement>()
  const { boundary, modal } = top
  const topPriority = priorityOf(modal)
  const local = boundary.contains(modal)

  if (local) {
    let branch = modal
    let ancestor = modal.parentElement
    while (ancestor && ancestor !== boundary) {
      if (isDialogSemantic(ancestor, isolationByElement.get(ancestor))) semanticDesired.add(ancestor)
      ancestor = ancestor.parentElement
    }
    while (branch !== boundary) {
      const parent = branch.parentElement
      if (!parent) break
      Array.from(parent.children).forEach((candidate) => {
        if (!(candidate instanceof HTMLElement) || candidate === branch || candidate.contains(modal)) return
        if (highestPriorityIn(candidate) > topPriority) return
        addIsolationBranch(desired, candidate, records.values())
      })
      branch = parent
    }
  } else {
    Array.from(boundary.children).forEach((candidate) => {
      if (!(candidate instanceof HTMLElement) || highestPriorityIn(candidate) > topPriority) return
      addIsolationBranch(desired, candidate, records.values())
    })
    let ancestor = modal.parentElement
    while (ancestor && ancestor !== document.body) {
      if (isDialogSemantic(ancestor, isolationByElement.get(ancestor))) semanticDesired.add(ancestor)
      ancestor = ancestor.parentElement
    }
  }

  const topPortalBranch = bodyPortalBranch(modal, boundary)
  document.body.querySelectorAll<HTMLElement>("[data-modal-layer-priority]").forEach((layer) => {
    if (boundary.contains(layer) || layer === modal || modal.contains(layer) || layer.contains(modal)) return
    if (priorityOf(layer) > topPriority) return
    let target = bodyPortalBranch(layer, boundary)
    if (!target) return
    if (target === topPortalBranch || target.contains(modal)) target = layer
    if (target.contains(modal) || highestPriorityIn(target) > topPriority) return
    addIsolationBranch(desired, target, records.values())
  })

  desired.forEach((element) => semanticDesired.delete(element))
  return { desired, semanticDesired }
}

function syncActiveModalIsolation(boundary: HTMLElement, excludedOwner?: symbol) {
  const records = activeModalsByBoundary.get(boundary)
  if (!records) return
  records.forEach((record) => {
    const owners = modalOwnersByBoundary.get(boundary)
    if (owners?.has(record.owner)) owners.set(record.owner, priorityOf(record.modal))
  })
  const owners = modalOwnersByBoundary.get(boundary)
  if (owners) syncModalBoundary(boundary, owners)

  const top = topActiveModal(records, excludedOwner)
  const plans = new Map<symbol, { desired: Set<HTMLElement>; semanticDesired: Set<HTMLElement> }>()
  records.forEach((record) => {
    plans.set(record.owner, record === top
      ? desiredIsolationFor(record, records)
      : { desired: new Set(), semanticDesired: new Set() })
  })

  // Acquire the incoming owner before releasing the outgoing owner. The
  // shared element registry then preserves the real pre-modal attributes.
  records.forEach((record) => {
    const plan = plans.get(record.owner)!
    plan.desired.forEach((element) => {
      acquireIsolation(element, record.owner)
      record.covered.add(element)
    })
    plan.semanticDesired.forEach((element) => {
      acquireSemanticIsolation(element, record.owner)
      record.semanticCovered.add(element)
    })
  })
  records.forEach((record) => {
    const plan = plans.get(record.owner)!
    record.covered.forEach((element) => {
      if (plan.desired.has(element)) return
      releaseIsolation(element, record.owner)
      record.covered.delete(element)
    })
    record.semanticCovered.forEach((element) => {
      if (plan.semanticDesired.has(element)) return
      releaseSemanticIsolation(element, record.owner)
      record.semanticCovered.delete(element)
    })
  })
}

function acquireBoundaryObserver(boundary: HTMLElement) {
  const current = modalObserversByBoundary.get(boundary)
  if (current) {
    current.count += 1
    return
  }
  const observer = new MutationObserver(() => syncActiveModalIsolation(boundary))
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["data-modal-layer-priority", "inert", "aria-hidden", "role", "aria-modal"],
    childList: true,
    subtree: true,
  })
  modalObserversByBoundary.set(boundary, { count: 1, observer })
}

function releaseBoundaryObserver(boundary: HTMLElement) {
  const current = modalObserversByBoundary.get(boundary)
  if (!current) return
  current.count -= 1
  if (current.count > 0) return
  current.observer.disconnect()
  modalObserversByBoundary.delete(boundary)
}

/**
 * Isolate a modal from every sibling branch up to the ONDO canvas.
 *
 * The dialog remains in its existing visual stacking context, while content,
 * navigation, and peer overlays are removed from pointer/programmatic access.
 * Existing attributes are restored exactly when the modal closes.
 */
export function useModalIsolation(open: boolean, modalRef: RefObject<HTMLElement | null>) {
  const ownerRef = useRef<symbol | null>(null)
  if (ownerRef.current === null) ownerRef.current = Symbol("ondo-modal-isolation")

  useLayoutEffect(() => {
    if (!open) return
    const modal = modalRef.current
    if (!modal) return
    const localBoundary = modal.closest<HTMLElement>("[data-testid='ondo-canvas']")
    const boundary = localBoundary ?? document.querySelector<HTMLElement>("[data-testid='ondo-canvas']")
    if (!boundary) return

    const owner = ownerRef.current!
    const priority = Number(modal.dataset.modalLayerPriority ?? "0") || 0
    const records = activeModalsByBoundary.get(boundary) ?? new Map<symbol, ActiveModalRecord>()
    const record: ActiveModalRecord = {
      owner,
      modal,
      boundary,
      order: ++modalMountOrder,
      covered: new Set(),
      semanticCovered: new Set(),
    }

    acquireModalBoundary(boundary, owner, priority)
    records.set(owner, record)
    activeModalsByBoundary.set(boundary, records)
    acquireBoundaryObserver(boundary)
    syncActiveModalIsolation(boundary)

    return () => {
      // Recompute while the outgoing record is still available so an incoming
      // owner can acquire shared branches before this owner's snapshots leave.
      syncActiveModalIsolation(boundary, owner)
      records.delete(owner)
      record.covered.forEach((element) => releaseIsolation(element, owner))
      record.semanticCovered.forEach((element) => releaseSemanticIsolation(element, owner))
      if (!records.size) activeModalsByBoundary.delete(boundary)
      releaseBoundaryObserver(boundary)
      releaseModalBoundary(boundary, owner)
    }
  }, [modalRef, open, ownerRef])

  // Keep focus movement passive so a modal owner can snapshot its opener in an
  // earlier passive effect. Isolation itself remains layout-synchronous above,
  // preventing an exposed background frame without changing focus contracts.
  useEffect(() => {
    if (!open) return
    const modal = modalRef.current
    if (!modal) return
    const boundary = modal.closest<HTMLElement>("[data-testid='ondo-canvas']")
      ?? document.querySelector<HTMLElement>("[data-testid='ondo-canvas']")
    const records = boundary ? activeModalsByBoundary.get(boundary) : null
    if (!records || topActiveModal(records)?.owner !== ownerRef.current) return
    const active = document.activeElement
    if (active instanceof HTMLElement && !modal.contains(active)) {
      modal.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true })
    }
  }, [modalRef, open, ownerRef])
}
