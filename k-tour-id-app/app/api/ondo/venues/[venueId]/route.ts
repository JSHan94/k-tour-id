import { canonicalVenueDetailById } from "@/lib/ondo/venues/detail-server"
import type { CanonicalVenueDetailResponse } from "@/lib/ondo/venues/detail-contract"

export async function GET(_request: Request, context: { params: Promise<{ venueId: string }> }) {
  const { venueId } = await context.params
  const venue = canonicalVenueDetailById(venueId)
  if (!venue) return Response.json({ error: "Venue not found" }, { status: 404 })
  const response: CanonicalVenueDetailResponse = { venue }
  return Response.json(response, {
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  })
}
