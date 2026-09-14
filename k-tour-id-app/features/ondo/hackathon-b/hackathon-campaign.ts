/** Designated venue for the hackathon demo entitlement (one venue, one campaign).
 * The server is the authority (HK_CAMPAIGN_VENUE_ID); this constant only decides
 * where the CTA renders. Keep in sync with the server env. */
export const HACKATHON_CAMPAIGN_VENUE_ID = process.env.NEXT_PUBLIC_HK_CAMPAIGN_VENUE_ID ?? "mois-0021cd596bc5b2a922ad"
export const HACKATHON_ENABLED = process.env.NEXT_PUBLIC_HK_ENABLED !== "0"

export const HACKATHON_OPEN_EVENT_B = "ondo:b:hackathon-open"
export const HACKATHON_PENDING_KEY = "ondo-b.hackathon.pending.v1"

export type HackathonOpenDetail = { venueId: string; locale: "en" | "ko" | "ja"; resumeOperationId?: string }

export function isHackathonVenue(venueId: unknown) {
  return HACKATHON_ENABLED && typeof venueId === "string" && venueId === HACKATHON_CAMPAIGN_VENUE_ID
}

export function requestHackathonOpenB(detail: HackathonOpenDetail) {
  if (typeof window === "undefined") return false
  window.dispatchEvent(new CustomEvent<HackathonOpenDetail>(HACKATHON_OPEN_EVENT_B, { detail }))
  return true
}

export function readPendingHackathon(): HackathonOpenDetail | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(HACKATHON_PENDING_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as HackathonOpenDetail & { savedAt?: number }
    if (!parsed.venueId || !parsed.resumeOperationId) return null
    if (parsed.savedAt && Date.now() - parsed.savedAt > 60 * 60 * 1000) { window.sessionStorage.removeItem(HACKATHON_PENDING_KEY); return null }
    return parsed
  } catch { return null }
}
export function writePendingHackathon(detail: HackathonOpenDetail | null) {
  if (typeof window === "undefined") return
  try {
    if (!detail) window.sessionStorage.removeItem(HACKATHON_PENDING_KEY)
    else window.sessionStorage.setItem(HACKATHON_PENDING_KEY, JSON.stringify({ ...detail, savedAt: Date.now() }))
  } catch { /* storage unavailable */ }
}
