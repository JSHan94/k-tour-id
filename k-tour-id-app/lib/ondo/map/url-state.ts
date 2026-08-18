import type { DiscoveryFilters, DiscoveryUrlState, TimeFilter } from "./models"

export const DEFAULT_FILTERS: DiscoveryFilters = {
  query: "",
  time: "now",
  hotOnly: false,
  calmOnly: false,
  openOnly: false,
}

function isTimeFilter(value: string | null): value is TimeFilter {
  return value === "now" || value === "dinner" || value === "late"
}

export function readDiscoveryUrl(search: string): DiscoveryUrlState {
  const params = new URLSearchParams(search)
  const city = params.get("city")
  return {
    query: params.get("q") ?? "",
    time: isTimeFilter(params.get("time")) ? params.get("time") as TimeFilter : "now",
    hotOnly: params.get("hot") === "1",
    calmOnly: params.get("calm") === "1",
    openOnly: params.get("open") === "1",
    city: city === "seoul" || city === "busan" ? city : undefined,
    neighborhood: params.get("neighborhood") ?? undefined,
    venueId: params.get("venueId") ?? undefined,
    view: params.get("view") === "list" ? "list" : "map",
  }
}

export function writeDiscoveryUrl(next: DiscoveryUrlState) {
  if (typeof window === "undefined") return
  const url = new URL(window.location.href)
  const pairs: Array<[string, string | undefined]> = [
    ["q", next.query || undefined],
    ["time", next.time === "now" ? undefined : next.time],
    ["hot", next.hotOnly ? "1" : undefined],
    ["calm", next.calmOnly ? "1" : undefined],
    ["open", next.openOnly ? "1" : undefined],
    ["city", next.city],
    ["neighborhood", next.neighborhood],
    ["venueId", next.venueId],
    ["view", next.view === "list" ? "list" : undefined],
  ]
  for (const [key, value] of pairs) {
    if (value == null) url.searchParams.delete(key)
    else url.searchParams.set(key, value)
  }
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`)
}
