"use client"

import type { KeyboardEvent, ReactNode } from "react"
import { useEffect, useRef } from "react"
import { X } from "lucide-react"
import { useOndo } from "../state/ondo-provider"
import styles from "./ui.module.css"

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",")

export function Sheet({
  children,
  label,
  onClose,
  showClose = true,
  size = "medium",
}: {
  children: ReactNode
  label: string
  onClose(): void
  showClose?: boolean
  size?: "peek" | "medium" | "full"
}) {
  const { state } = useOndo()
  const dialogRef = useRef<HTMLElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const closeLabel = state.locale === "ko" ? "닫기" : "Close"

  useEffect(() => {
    const activeElement = document.activeElement
    returnFocusRef.current = activeElement instanceof HTMLElement && activeElement !== document.body ? activeElement : null
    const dialog = dialogRef.current
    const preferred = dialog?.querySelector<HTMLElement>("[data-sheet-initial-focus]")
    const first = preferred ?? dialog?.querySelector<HTMLElement>(FOCUSABLE) ?? dialog
    const focusInitial = () => first?.focus({ preventScroll: true })
    window.requestAnimationFrame(() => window.requestAnimationFrame(focusInitial))
    const focusRecoveryTimer = window.setTimeout(() => {
      if (dialogRef.current && !dialogRef.current.contains(document.activeElement)) focusInitial()
    }, 160)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const interceptEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape" || !dialogRef.current?.contains(document.activeElement)) return
      event.preventDefault()
      event.stopImmediatePropagation()
      onClose()
    }
    document.addEventListener("keydown", interceptEscape, true)
    return () => {
      document.removeEventListener("keydown", interceptEscape, true)
      window.clearTimeout(focusRecoveryTimer)
      document.body.style.overflow = previousOverflow
      window.setTimeout(() => {
        if (document.querySelector("[role='dialog'][aria-modal='true'], [role='alertdialog'][aria-modal='true']")) return
        const previous = returnFocusRef.current
        if (previous?.isConnected) previous.focus({ preventScroll: true })
        else document.querySelector<HTMLElement>("[data-sheet-return-focus], [data-testid='canonical-place-details'], [data-testid='place-details'], [aria-current='page']")?.focus({ preventScroll: true })
      }, 80)
    }
  }, [showClose])

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault()
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== "Tab") return
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
      .filter((element) => element.offsetParent !== null)
    if (!focusable.length) {
      event.preventDefault()
      dialogRef.current?.focus()
      return
    }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div className={styles.layer}>
      <button type="button" tabIndex={-1} className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <section
        ref={dialogRef}
        className={`${styles.sheet} ${styles[size]}`}
        data-testid="ondo-sheet"
        data-sheet-size={size}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.grabber} aria-hidden="true" />
        {showClose ? <button type="button" data-sheet-initial-focus className={styles.close} onClick={onClose} aria-label={closeLabel}><X size={19} /></button> : null}
        <div className={styles.viewport}>{children}</div>
      </section>
    </div>
  )
}

export function InlineNotice({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warm" | "danger" | "success" }) {
  return <div className={`${styles.notice} ${styles[`notice_${tone}`]}`}>{children}</div>
}
