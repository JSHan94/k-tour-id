/** A single-color K / route mark. It inherits the current light or dark ink. */
export function KTourIdMark({ size = 32, className }: { size?: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true" focusable="false" data-ktour-mark="monochrome">
    <path d="M8 7v18M9 19 23 7M15 14l9 11" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="23" cy="7" r="3.25" fill="currentColor" />
  </svg>
}
