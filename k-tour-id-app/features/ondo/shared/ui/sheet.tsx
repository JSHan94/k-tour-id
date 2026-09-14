"use client"

import type { ButtonHTMLAttributes, KeyboardEvent, ReactNode } from "react"
import { useEffect, useLayoutEffect, useRef } from "react"
import { ArrowLeft, X } from "lucide-react"
import { useOndo } from "../state/ondo-provider"
import { isRenderedFocusable, isRenderedProgrammaticFocusTarget } from "./is-rendered-focusable"
import { useDocumentScrollLock, useModalIsolation, useModalVisualViewport } from "./use-modal-isolation"
import styles from "./ui.module.css"

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  "[tabindex]:not([tabindex='-1'])",
].join(",")

export type SheetVariant = "peek" | "decision" | "detail" | "full-task"
export type SheetNavigation = "close" | "back" | "none"

type SheetFrameProps = {
  children: ReactNode
  label: string
  onClose(): void
  showClose?: boolean
  size?: "peek" | "medium" | "full"
  variant?: SheetVariant
  header?: ReactNode
  footer?: ReactNode
  navigation?: SheetNavigation
  onBack?(): void
  /** A nested, fully isolated decision owns modality while this is true. */
  suspended?: boolean
  /** Prefer a task-local action over the generic Close control on entry. */
  initialFocusSelector?: string
}

export function Sheet(props: SheetFrameProps) {
  const { state } = useOndo()
  return <SheetFrame {...props} closeLabel={state.locale === "ko" ? "닫기" : "Close"} backLabel={state.locale === "ko" ? "뒤로" : "Back"} />
}

/** Provider-neutral sheet for Variant B surfaces that reuse an established
 * modal flow without mounting the legacy OndoProvider beside OndoBProvider. */
export function SheetB({ locale, ...props }: SheetFrameProps & { locale: "en" | "ko" | "ja" }) {
  const closeLabel = locale === "ko" ? "닫기" : locale === "ja" ? "閉じる" : "Close"
  const backLabel = locale === "ko" ? "뒤로" : locale === "ja" ? "戻る" : "Back"
  return <SheetFrame {...props} closeLabel={closeLabel} backLabel={backLabel} />
}

function SheetFrame({
  children,
  label,
  onClose,
  showClose = true,
  size = "medium",
  variant,
  header,
  footer,
  navigation,
  onBack,
  suspended = false,
  initialFocusSelector,
  closeLabel,
  backLabel,
}: SheetFrameProps & { closeLabel: string; backLabel: string }) {
  const layerRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)
  const onBackRef = useRef(onBack)
  const semanticVariant = variant ?? (size === "peek" ? "peek" : size === "full" ? "full-task" : "decision")
  const navigationKind = navigation ?? (showClose ? "close" : "none")
  const variantClass = semanticVariant === "full-task" ? styles.fulltask : styles[semanticVariant]

  useLayoutEffect(() => {
    onCloseRef.current = onClose
    onBackRef.current = onBack
  }, [onBack, onClose])

  useLayoutEffect(() => {
    const activeElement = document.activeElement
    if (activeElement instanceof HTMLElement && activeElement !== document.body && !dialogRef.current?.contains(activeElement)) {
      returnFocusRef.current = activeElement
    }
  }, [])

  useModalIsolation(!suspended, layerRef)
  useDocumentScrollLock(true)
  useModalVisualViewport(layerRef)

  useEffect(() => {
    if (suspended) return
    const dialog = dialogRef.current
    const preferredCandidate = (initialFocusSelector ? dialog?.querySelector<HTMLElement>(initialFocusSelector) : null)
      ?? dialog?.querySelector<HTMLElement>("[data-sheet-initial-focus]")
    const preferred = preferredCandidate && isRenderedProgrammaticFocusTarget(preferredCandidate) ? preferredCandidate : null
    const first = preferred
      ?? Array.from(dialog?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).find(isRenderedFocusable)
      ?? dialog
    const focusInitial = () => {
      if (dialog?.contains(document.activeElement)) return
      first?.focus({ preventScroll: true })
    }
    let focusFrame = window.requestAnimationFrame(() => {
      focusFrame = window.requestAnimationFrame(focusInitial)
    })
    const focusRecoveryTimer = window.setTimeout(() => {
      if (dialogRef.current && !dialogRef.current.contains(document.activeElement)) focusInitial()
    }, 160)

    const interceptEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape" || !dialogRef.current?.contains(document.activeElement)) return
      event.preventDefault()
      event.stopImmediatePropagation()
      onCloseRef.current()
    }
    document.addEventListener("keydown", interceptEscape, true)
    return () => {
      document.removeEventListener("keydown", interceptEscape, true)
      window.cancelAnimationFrame(focusFrame)
      window.clearTimeout(focusRecoveryTimer)
      window.setTimeout(() => {
        if (document.querySelector("[role='dialog'][aria-modal='true'], [role='alertdialog'][aria-modal='true']")) return
        const active = document.activeElement
        // A destination reached during this delay owns focus already. Only
        // restore when unmounting the Sheet left focus genuinely unclaimed.
        if (active && active !== document.body && active !== document.documentElement && active.isConnected) return
        const previous = returnFocusRef.current
        if (previous?.isConnected) previous.focus({ preventScroll: true })
        else document.querySelector<HTMLElement>("[data-sheet-return-focus], [data-testid='canonical-place-details'], [data-testid='place-details'], [aria-current='page']")?.focus({ preventScroll: true })
      }, 80)
    }
  }, [initialFocusSelector, suspended])

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (suspended) return
    if (event.key === "Escape") {
      event.preventDefault()
      event.stopPropagation()
      onCloseRef.current()
      return
    }
    if (event.key !== "Tab") return
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
      .filter(isRenderedFocusable)
    if (!focusable.length) {
      event.preventDefault()
      dialogRef.current?.focus()
      return
    }
    const first = focusable[0]
    const last = focusable.at(-1)!
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const navigate = navigationKind === "back" ? () => (onBackRef.current ?? onCloseRef.current)() : () => onCloseRef.current()
  const navigationControl = navigationKind === "none" ? null : (
    <button
      type="button"
      data-sheet-initial-focus
      data-sheet-navigation={navigationKind}
      className={styles.close}
      onClick={navigate}
      aria-label={navigationKind === "back" ? backLabel : closeLabel}
    >
      {navigationKind === "back" ? <ArrowLeft size={20} aria-hidden="true" /> : <X size={19} aria-hidden="true" />}
    </button>
  )

  return (
    <div ref={layerRef} className={styles.layer} data-sheet-layer="true">
      <button type="button" tabIndex={-1} className={styles.backdrop} onClick={() => onCloseRef.current()} aria-hidden="true" disabled={suspended} />
      <section
        ref={dialogRef}
        className={`${styles.sheet} ${variantClass}`}
        data-testid="ondo-sheet"
        data-sheet-size={size}
        data-sheet-variant={semanticVariant}
        data-sheet-navigation={navigationKind}
        role={suspended ? undefined : "dialog"}
        aria-modal={suspended ? undefined : "true"}
        aria-label={label}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        {header ? (
          <header className={styles.sheetHeader} data-sheet-header="true">
            {navigationKind === "back" ? navigationControl : <span className={styles.headerSpacer} aria-hidden="true" />}
            <div className={styles.headerContent}>{header}</div>
            {navigationKind === "close" ? navigationControl : <span className={styles.headerSpacer} aria-hidden="true" />}
          </header>
        ) : (
          <>
            {semanticVariant === "full-task" ? null : <div className={styles.grabber} aria-hidden="true" />}
            {navigationControl}
          </>
        )}
        <div className={styles.viewport} data-sheet-scroll-owner="true">{children}</div>
        {footer ? <footer className={styles.sheetFooter} data-sheet-footer="true">{footer}</footer> : null}
      </section>
    </div>
  )
}

type IconActionProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children" | "title"> & {
  icon: ReactNode
  label: string
}

/** Icon-only controls keep a required, action-oriented accessible name. */
export function IconAction({ icon, label, className, ...props }: IconActionProps) {
  const accessibleName = label.trim()
  if (!accessibleName) throw new Error("IconAction requires a non-empty localized label")
  return <button {...props} type={props.type ?? "button"} className={`${styles.iconAction}${className ? ` ${className}` : ""}`} aria-label={accessibleName}><span aria-hidden="true">{icon}</span></button>
}

export function InlineNotice({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warm" | "danger" | "success" }) {
  return <div className={`${styles.notice} ${styles[`notice_${tone}`]}`}>{children}</div>
}
