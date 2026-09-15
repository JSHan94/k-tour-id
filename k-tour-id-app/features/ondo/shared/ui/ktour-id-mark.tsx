import { useId } from "react"

/** Monochrome adaptation of the supplied K / pin / route; matches the app icon. */
export function KTourIdMark({ size = 32, className }: { size?: number; className?: string }) {
  const maskId = useId()
  return <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true" focusable="false" data-ktour-mark="monochrome">
    <defs>
      <mask id={maskId} x="0" y="0" width="64" height="64" maskUnits="userSpaceOnUse" style={{ maskType: "luminance" }}>
        <path fill="#fff" d="M12 24a5 5 0 0 1 5-5h3v20l24-18a5.5 5.5 0 0 1 7 8.5L35 42l15 9a5.5 5.5 0 0 1-6 9L20 45v10h-3a5 5 0 0 1-5-5Z" transform="translate(0 -3)" />
        <path fill="#fff" d="M31 7a10 10 0 0 0-10 10c0 7 10 16 10 16s10-9 10-16A10 10 0 0 0 31 7Z" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
        <circle cx="31" cy="16" r="4" fill="#000" />
        <path d="M20 19c2 13 18 17 20 23 1.5 5-8 9-19 14" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" />
      </mask>
    </defs>
    <path fill="currentColor" d="M0 0h64v64H0z" mask={`url(#${maskId})`} />
  </svg>
}
