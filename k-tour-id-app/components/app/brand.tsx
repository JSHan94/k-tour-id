import { BRANDS, type Brand, type BrandKey } from "@/lib/brands"
import { cn } from "@/lib/utils"

/** Real partner logo on a white app-icon chip; falls back to a brand-colored monogram. */
export function BrandMark({
  brand,
  size = 40,
  className,
  ring = true,
}: {
  brand: BrandKey
  size?: number
  className?: string
  ring?: boolean
}) {
  const b = BRANDS[brand] as Brand | undefined
  if (b?.logo) {
    return (
      <span
        className={cn("grid flex-shrink-0 place-items-center overflow-hidden rounded-full bg-white", ring && "ring-1 ring-border", className)}
        style={{ width: size, height: size }}
      >
        <img src={b.logo} alt={b.name} className="object-contain" style={{ width: size * 0.66, height: size * 0.66 }} />
      </span>
    )
  }
  return (
    <span
      className={cn("grid flex-shrink-0 place-items-center rounded-full font-bold text-white", className)}
      style={{ width: size, height: size, background: b?.color ?? "#8a8276", fontSize: size * 0.4 }}
    >
      {b?.mono ?? b?.name?.[0] ?? "?"}
    </span>
  )
}

export { type BrandKey }
