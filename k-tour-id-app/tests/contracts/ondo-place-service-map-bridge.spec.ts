import { readFileSync } from "node:fs"
import { expect, test } from "@playwright/test"
import { capturePlaceServiceMapReturnB, registerPlaceServiceMapCaptureB } from "../../features/ondo/map/place-service-map-return-b"
import { ONDO_B_TABLES } from "../../features/ondo/connect/table-model"

test("a place action captures its exact source id without exporting private map state", () => {
  const captured: string[] = []
  const release = registerPlaceServiceMapCaptureB(placeId => { captured.push(placeId); return true })
  expect(capturePlaceServiceMapReturnB("research-busan-moemiljip")).toBe(true)
  expect(captured).toEqual(["research-busan-moemiljip"])
  release()
  expect(capturePlaceServiceMapReturnB("research-busan-moemiljip")).toBe(false)
})

test("cleanup of an old map cannot remove the active map capture owner", () => {
  const oldRelease = registerPlaceServiceMapCaptureB(() => false)
  const newRelease = registerPlaceServiceMapCaptureB(() => true)
  oldRelease()
  expect(capturePlaceServiceMapReturnB("research-seoul-zest")).toBe(true)
  newRelease()
})

test("registered Busan Tables are directly reachable with their own venue and policy", () => {
  const source = readFileSync("features/ondo/place/canonical-place-overlay.tsx", "utf8")
  const busan = ONDO_B_TABLES.find(table => table.id === "table-busan-gijang-dinner")
  expect(busan?.venueId).toBe("mois-03041681b54ea5399763")
  expect(source).toContain("ONDO_B_TABLES.find((table) => table.venueId === venueId)")
  expect(source).toContain("tableId: placeTable.id, venueId: currentVenueId")
  expect(source).toContain("placeTable.alcohol ?")
  expect(source).not.toContain('tableId: "table-seoul-night-bites"')
})

test("sample service entry preserves source identity and keeps directions secondary", () => {
  const actions = readFileSync("features/ondo/place/place-service-actions-b.tsx", "utf8")
  const research = readFileSync("features/ondo/map/researched-food-panel-b.tsx", "utf8")
  expect(actions).toContain("if (!sampleMode || !place")
  expect(actions).toContain("capturePlaceServiceMapReturnB(place.id)")
  expect(actions).toContain("actions.openMealBenefitFromPlace(place.id)")
  expect(actions).toContain("requestReservationSampleB({ venueId: place.id })")
  expect(research).toContain("<PlaceServiceActionsB placeId={place.id}")
  expect(research).toContain('data-origin="EDITORIAL_RESEARCH"')
})

test("map balance and supported-place return use shared money and private map snapshots", () => {
  const balance = readFileSync("features/ondo/map/map-balance-entry-b.tsx", "utf8")
  const map = readFileSync("features/ondo/map/map-entry-b.tsx", "utf8")
  expect(balance).toContain("stableCommerceBalanceB(state.commerceSession)")
  expect(balance).toContain("stableCommerceHeldKrwB(state.commerceSession)")
  for (const key of ["snapshot.city", "snapshot.view", "snapshot.query", "snapshot.category", "snapshot.editorialCategory", "snapshot.listScroll", "snapshot.camera", "snapshot.detailScroll"]) expect(map).toContain(key)
  expect(map).toContain("after19Active && !balancePlacesActive")
  expect(map).toContain("PLACE_SERVICE_RETURN_EVENT_B")
  expect(map).toContain("SHOW_BALANCE_PLACES_EVENT_B")
})
