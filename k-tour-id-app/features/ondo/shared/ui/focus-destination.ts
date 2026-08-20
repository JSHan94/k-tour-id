"use client"

const TEMPORARY_TAB_INDEX = "data-ondo-focus-handoff"

function isAvailable(element: HTMLElement) {
  if (!element.isConnected || element.closest("[inert], [aria-hidden='true']")) return false
  const style = window.getComputedStyle(element)
  if (style.display === "none" || style.visibility === "hidden") return false
  const rect = element.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

function hasClaimedFocus() {
  const active = document.activeElement
  return active instanceof HTMLElement
    && active !== document.body
    && active !== document.documentElement
    && active.isConnected
    && !active.closest("[inert], [aria-hidden='true']")
}

function focusDestination(element: HTMLElement) {
  const hadTabIndex = element.hasAttribute("tabindex")
  if (!hadTabIndex) {
    element.setAttribute("tabindex", "-1")
    element.setAttribute(TEMPORARY_TAB_INDEX, "")
  }
  element.focus({ preventScroll: true })
  if (!hadTabIndex && document.activeElement === element) {
    element.addEventListener("blur", () => {
      if (!element.hasAttribute(TEMPORARY_TAB_INDEX)) return
      element.removeAttribute(TEMPORARY_TAB_INDEX)
      element.removeAttribute("tabindex")
    }, { once: true })
  }
}

/**
 * Hand focus to the first rendered destination after an unmounting transition.
 * A short bounded retry covers React sibling effects (for example the
 * venue-scoped After 19 return) without stealing focus after the user has moved
 * elsewhere.
 */
export function focusFirstAvailableDestination(selectors: readonly string[]) {
  let attempts = 0
  let timer: number | null = null

  const tryFocus = () => {
    timer = null
    if (hasClaimedFocus()) return
    for (const selector of selectors) {
      const destination = Array.from(document.querySelectorAll<HTMLElement>(selector)).find(isAvailable)
      if (!destination) continue
      focusDestination(destination)
      return
    }
    attempts += 1
    if (attempts < 24) timer = window.setTimeout(tryFocus, 50)
  }

  window.requestAnimationFrame(tryFocus)
  return () => { if (timer != null) window.clearTimeout(timer) }
}
