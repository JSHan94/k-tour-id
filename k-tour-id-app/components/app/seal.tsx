import { cn } from "@/lib/utils"

/**
 * 도장 (dojang) — a Korean name seal in 인주 red. Used as the K-Tour ID brand
 * mark and the credential verification stamp. Character 信 = "trust".
 */
export function Seal({
  size = 56,
  stamp = false,
  className,
}: {
  size?: number
  stamp?: boolean
  className?: string
}) {
  return (
    <span
      className={cn("inline-block", className)}
      style={{ width: size, height: size, animation: stamp ? "seal-stamp 0.4s ease-out both" : undefined }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
        <rect x="6" y="6" width="88" height="88" rx="18" fill="var(--seal)" />
        <rect x="6" y="6" width="88" height="88" rx="18" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" />
        <rect x="15" y="15" width="70" height="70" rx="12" fill="none" stroke="rgba(255,253,248,0.85)" strokeWidth="2.5" />
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="46"
          fontWeight="700"
          fill="#fffdf8"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          信
        </text>
      </svg>
    </span>
  )
}
