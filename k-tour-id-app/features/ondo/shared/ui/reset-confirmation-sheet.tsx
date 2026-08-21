"use client"

import { useRef } from "react"
import { createPortal } from "react-dom"
import { AlertTriangle } from "lucide-react"
import { Sheet } from "./sheet"
import styles from "./reset-confirmation.module.css"

export function ResetConfirmationSheet({
  testId,
  title,
  description,
  preserved,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  testId: string
  title: string
  description: string
  preserved: string
  cancelLabel: string
  confirmLabel: string
  onCancel(): void
  onConfirm(): void
}) {
  const confirmed = useRef(false)
  const returnFocus = useRef<HTMLElement | null>(
    typeof document !== "undefined" && document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  )

  function restoreOpener() {
    window.setTimeout(() => {
      if (returnFocus.current?.isConnected) returnFocus.current.focus({ preventScroll: true })
    }, 120)
  }

  function cancelAndRestore() {
    onCancel()
    restoreOpener()
  }

  function confirmOnce() {
    if (confirmed.current) return
    confirmed.current = true
    onConfirm()
    // Keep the isolated layer mounted through the browser's double-click
    // window so a second pointer event cannot land on navigation underneath.
    window.setTimeout(() => {
      onCancel()
      restoreOpener()
    }, 180)
  }

  const sheet = (
    <Sheet
      label={title}
      onClose={cancelAndRestore}
      showClose={false}
      initialFocusSelector="[data-reset-cancel]"
    >
      <div className={styles.content} data-testid={testId}>
        <span className={styles.icon} aria-hidden="true"><AlertTriangle size={22} /></span>
        <h2>{title}</h2>
        <p>{description}</p>
        <p className={styles.preserved}>{preserved}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} data-reset-cancel onClick={cancelAndRestore}>{cancelLabel}</button>
          <button type="button" className={styles.confirm} onClick={confirmOnce}>{confirmLabel}</button>
        </div>
      </div>
    </Sheet>
  )
  const canvas = typeof document === "undefined" ? null : document.querySelector("[data-testid='ondo-canvas']")
  return canvas ? createPortal(sheet, canvas) : sheet
}
