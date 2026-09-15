import styles from "./ondo-brand-lockup-b.module.css"
import { KTourIdMark } from "./ktour-id-mark"

export function OndoBrandLockupB({ size = "full" }: { size?: "compact" | "full" }) {
  return (
    <span className={styles.root} data-ondo-brand-lockup={size} role="img" aria-label="K-Tour ID">
      <KTourIdMark size={size === "compact" ? 30 : 38} />
      <b aria-hidden="true">K-Tour ID</b>
    </span>
  )
}
