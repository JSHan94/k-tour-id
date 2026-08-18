"use client"

import type { ReactNode } from "react"
import { X } from "lucide-react"
import styles from "./ui.module.css"

export function Sheet({
  children,
  label,
  onClose,
  size = "medium",
}: {
  children: ReactNode
  label: string
  onClose(): void
  size?: "peek" | "medium" | "full"
}) {
  return (
    <div className={styles.layer} role="dialog" aria-modal="true" aria-label={label}>
      <button type="button" className={styles.backdrop} onClick={onClose} aria-label="Close" />
      <section className={`${styles.sheet} ${styles[size]}`}>
        <div className={styles.grabber} aria-hidden="true" />
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close"><X size={19} /></button>
        {children}
      </section>
    </div>
  )
}

export function InlineNotice({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warm" | "danger" | "success" }) {
  return <div className={`${styles.notice} ${styles[`notice_${tone}`]}`}>{children}</div>
}
