import { expect, test } from "@playwright/test"
import { openSavedBDiscoveryVenue } from "../../features/ondo/map/b-discovery-history"

const CANONICAL_VENUE_ID = "mois-0021cd596bc5b2a922ad"

test("saved return from detail requests native Back without a mounted traversal guard", () => {
  const detailEntry = {
    v: 1,
    documentId: "contract-document",
    level: "detail",
    city: "seoul",
    view: "list",
    query: "",
    heat: "all",
    venueId: CANONICAL_VENUE_ID,
  }
  const originalState = { nextInternal: { preserved: true }, __ondoBDiscovery: detailEntry }
  let backCalls = 0
  const fakeHistory = {
    state: originalState,
    back() { backCalls += 1 },
  }
  const fakeLocation = {
    pathname: "/",
    search: `?campaign=detail-contract&city=seoul&view=list&venueId=${CANONICAL_VENUE_ID}&detail=1`,
    hash: "#saved-return",
  }
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window")
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { history: fakeHistory, location: fakeLocation },
  })

  try {
    expect(openSavedBDiscoveryVenue(CANONICAL_VENUE_ID, "seoul")).toBe(true)
    expect(backCalls).toBe(1)
    expect(fakeHistory.state).toBe(originalState)
    expect(fakeLocation).toEqual({
      pathname: "/",
      search: `?campaign=detail-contract&city=seoul&view=list&venueId=${CANONICAL_VENUE_ID}&detail=1`,
      hash: "#saved-return",
    })
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow)
    else Reflect.deleteProperty(globalThis, "window")
  }
})
