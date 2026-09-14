/**
 * Keep modal focus traps aligned with the browser's sequential-focus model.
 * In particular, Chromium can report layout boxes and an offset parent for
 * controls hidden inside a closed details element.
 */
export function isRenderedProgrammaticFocusTarget(element: HTMLElement) {
  if (element.matches(":disabled") || element.closest("[hidden],[inert],[aria-hidden='true']")) return false

  for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
    if (ancestor.tagName !== "DETAILS" || ancestor.hasAttribute("open")) continue
    const summary = Array.from(ancestor.children).find((child) => child.tagName === "SUMMARY")
    if (!summary?.contains(element)) return false
  }

  const style = window.getComputedStyle(element)
  if (element.getClientRects().length === 0 || style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse") return false

  // `tabindex=-1` is intentionally absent from sequential keyboard navigation,
  // but remains a valid programmatic target for dialog headings. Only accept a
  // negative tab index when the author explicitly declared it.
  if (element.tabIndex < 0 && !element.hasAttribute("tabindex")) return false

  return typeof element.checkVisibility !== "function"
    || element.checkVisibility({ visibilityProperty: true })
}

export function isRenderedFocusable(element: HTMLElement) {
  return element.tabIndex >= 0 && isRenderedProgrammaticFocusTarget(element)
}
