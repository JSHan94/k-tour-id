import styles from "./ondo-brand-lockup-b.module.css"

export function OndoBrandLockupB({ size = "full" }: { size?: "compact" | "full" }) {
  return (
    <span className={styles.root} data-ondo-brand-lockup={size} role="img" aria-label="ONDO">
      <img src="/brand/ondo-lockup.svg" alt="" aria-hidden="true" />
      <i aria-hidden="true" />
      <b lang="ko-Hani" aria-hidden="true">溫圖</b>
    </span>
  )
}
