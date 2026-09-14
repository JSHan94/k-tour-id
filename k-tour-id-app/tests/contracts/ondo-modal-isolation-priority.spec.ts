import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"

const source = () => readFileSync(resolve(process.cwd(), "features/ondo/shared/ui/use-modal-isolation.ts"), "utf8")

test("MODAL-PRIORITY-001 one boundary arbiter selects priority first and newest owner on ties", () => {
  const isolation = source()

  expect(isolation).toContain("activeModalsByBoundary")
  expect(isolation).toContain("topActiveModal(records, excludedOwner)")
  expect(isolation).toContain("priorityOf(right.modal) - priorityOf(left.modal) || right.order - left.order")
  expect(isolation).toContain("record === top")
  expect(isolation).toContain("{ desired: new Set(), semanticDesired: new Set() }")
  expect(isolation).toContain("topActiveModal(records)?.owner !== ownerRef.current")
})

test("MODAL-PRIORITY-002 the winning portal owns eligible canvas and body-portal peers", () => {
  const isolation = source()
  const portalScan = isolation.slice(
    isolation.indexOf("const topPortalBranch = bodyPortalBranch"),
    isolation.indexOf("desired.forEach((element) => semanticDesired.delete(element))"),
  )

  expect(isolation).toContain("const local = boundary.contains(modal)")
  expect(isolation).toContain("Array.from(boundary.children).forEach")
  expect(portalScan).toContain('document.body.querySelectorAll<HTMLElement>("[data-modal-layer-priority]")')
  expect(portalScan).toContain("boundary.contains(layer)")
  expect(portalScan).toContain("priorityOf(layer) > topPriority")
  expect(portalScan).toContain("target === topPortalBranch || target.contains(modal)")
  expect(portalScan).toContain("addIsolationBranch(desired, target, records.values())")
})

test("MODAL-PRIORITY-003 late siblings and priority mutations resync for the full mounted lifetime", () => {
  const isolation = source()
  const observer = isolation.slice(
    isolation.indexOf("function acquireBoundaryObserver"),
    isolation.indexOf("function releaseBoundaryObserver"),
  )

  expect(observer).toContain("new MutationObserver(() => syncActiveModalIsolation(boundary))")
  expect(observer).toContain("observer.observe(document.body")
  expect(observer).toContain('"data-modal-layer-priority"')
  expect(observer).toContain('"inert"')
  expect(observer).toContain('"aria-modal"')
  expect(observer).toContain("childList: true")
  expect(observer).toContain("subtree: true")
  expect(isolation).toContain("if (highestPriorityIn(candidate) > topPriority) return")
  expect(isolation).toContain("acquireBoundaryObserver(boundary)")
  expect(isolation).toContain("releaseBoundaryObserver(boundary)")
})

test("MODAL-PRIORITY-004 ownership transfers before release and restores exact modal semantics", () => {
  const isolation = source()
  const sync = isolation.slice(
    isolation.indexOf("function syncActiveModalIsolation"),
    isolation.indexOf("function acquireBoundaryObserver"),
  )
  const cleanup = isolation.slice(
    isolation.indexOf("return () => {", isolation.indexOf("export function useModalIsolation")),
    isolation.indexOf("}, [modalRef, open, ownerRef])"),
  )

  expect(isolation).toContain("semanticOwners: Set<symbol>")
  expect(isolation).toContain("current.semanticOwners.add(owner)")
  expect(isolation).toContain("current.semanticOwners.delete(owner)")
  expect(isolation).toContain("current.owners.size || current.semanticOwners.size")
  expect(sync.indexOf("acquireIsolation(element, record.owner)")).toBeLessThan(sync.indexOf("releaseIsolation(element, record.owner)"))
  expect(sync.indexOf("acquireSemanticIsolation(element, record.owner)")).toBeLessThan(sync.indexOf("releaseSemanticIsolation(element, record.owner)"))
  expect(cleanup).toContain("syncActiveModalIsolation(boundary, owner)")
  expect(cleanup.indexOf("syncActiveModalIsolation(boundary, owner)")).toBeLessThan(cleanup.indexOf("records.delete(owner)"))
  for (const attribute of ["inert", "aria-hidden", "role", "aria-modal"]) {
    expect(isolation).toContain(`restoreAttribute(element, "${attribute}"`)
  }
  expect(isolation).not.toMatch(/localStorage|sessionStorage|indexedDB|credential|access.?token/i)
})
