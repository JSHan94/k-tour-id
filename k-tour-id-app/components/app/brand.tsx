import { BRANDS, type Brand, type BrandKey } from "@/lib/brands"
import { cn } from "@/lib/utils"

/** Real partner logo on a white app-icon chip; falls back to a brand-colored monogram. */
export function BrandMark({
  brand,
  size = 40,
  className,
  ring = true,
  decorative = false,
}: {
  brand: BrandKey
  size?: number
  className?: string
  ring?: boolean
  decorative?: boolean
}) {
  const b = BRANDS[brand] as Brand | undefined
  if (b?.logo) {
    return (
      <span
        className={cn("grid flex-shrink-0 place-items-center overflow-hidden rounded-full bg-white", ring && "ring-1 ring-border", className)}
        style={{ width: size, height: size }}
      >
        <img src={b.logo} alt={decorative ? "" : b.name} aria-hidden={decorative || undefined} className="object-contain" style={{ width: size * 0.66, height: size * 0.66 }} />
      </span>
    )
  }
  return (
    <span
      aria-hidden={decorative || undefined}
      className={cn("grid flex-shrink-0 place-items-center rounded-[12px] bg-white px-1.5 text-center font-bold leading-none ring-1 ring-border", className)}
      style={{ width: size, height: size, color: b?.color ?? "#59554f", fontSize: Math.max(9, Math.min(12, size * 0.2)) }}
    >
      {b?.name ?? "Service"}
    </span>
  )
}

export { type BrandKey }
