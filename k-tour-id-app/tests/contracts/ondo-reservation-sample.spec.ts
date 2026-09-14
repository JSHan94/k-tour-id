import { test, expect } from "@playwright/test"
import { initialReservationB, reduceReservationB, restoreReservationB, RESERVATION_CITIES, reservationSampleDatesB, selectReservationPlaceB, validReservationDraftB } from "../../features/ondo/reservation-b/reservation-model-b"
import { supportedCommercePlacesB } from "../../features/ondo/commerce-b/place-service-registry-b"
import { readFileSync } from "node:fs"
const id = "sample-booking-11111111-2222-3333-4444-555555555555"
const sent = () => reduceReservationB(initialReservationB(), { type: "submit", operationId: id })
test("three cities share the same explicit sample request and cancellation journey", () => {
  for (const city of RESERVATION_CITIES) {
    let state = reduceReservationB(initialReservationB(city), { type: "submit", operationId: id })
    state = reduceReservationB(state, { type: "resolve", operationId: id, outcome: "success" })
    expect(state.phase).toBe("confirmed"); expect(state.draft.city).toBe(city)
    expect(state.confirmationRef).toMatch(/^SAMPLE-/)
    state = reduceReservationB(state, { type: "cancel" })
    state = reduceReservationB(state, { type: "resolve_cancel", operationId: id, outcome: "success" })
    expect(state.phase).toBe("cancelled")
  }
})
test("unknown cannot submit again or change context; status query uses the same operation", () => {
  const unknown = reduceReservationB(sent(), { type: "resolve", operationId: id, outcome: "unknown" })
  expect(reduceReservationB(unknown, { type: "submit", operationId: `${id}-2` })).toBe(unknown)
  expect(reduceReservationB(unknown, { type: "edit", draft: { ...unknown.draft, party: 4 } })).toBe(unknown)
  const checked = reduceReservationB(unknown, { type: "query" })
  expect(checked.operationId).toBe(id)
  expect(reduceReservationB(checked, { type: "resolve", operationId: `${id}-stale`, outcome: "success" })).toBe(checked)
  expect(reduceReservationB(checked, { type: "resolve", operationId: id, outcome: "success" }).phase).toBe("confirmed")
})
test("reload turns in-flight request and cancellation into queryable unknown, never success", () => {
  expect(restoreReservationB(sent())?.phase).toBe("unknown")
  const confirmed = reduceReservationB(sent(), { type: "resolve", operationId: id, outcome: "success" })
  const cancelling = reduceReservationB(confirmed, { type: "cancel" })
  expect(restoreReservationB(cancelling)?.phase).toBe("cancel_unknown")
  const failed = reduceReservationB(cancelling, { type: "resolve_cancel", operationId: id, outcome: "failure" })
  expect(failed.confirmationRef).toBe(confirmed.confirmationRef)
  expect(reduceReservationB(failed, { type: "submit", operationId: `${id}-2` })).toBe(failed)
})
test("invalid storage and duplicate result do not create a booking", () => {
  expect(restoreReservationB({ ...initialReservationB(), phase: "confirmed" })).toBeNull()
  expect(restoreReservationB({ ...initialReservationB(), draft: { city: "unknown" } })).toBeNull()
  const confirmed = reduceReservationB(sent(), { type: "resolve", operationId: id, outcome: "success" })
  expect(reduceReservationB(confirmed, { type: "resolve", operationId: id, outcome: "success" })).toBe(confirmed)
})
test("sample date windows use Korean midnight, independent of browser timezone", () => {
  expect(reservationSampleDatesB(Date.parse("2026-09-09T15:01:00Z"))).toEqual(["2026-09-11", "2026-09-12", "2026-09-13"])
})

const reservable = supportedCommercePlacesB().filter(place => place.reservation)
const firstPlace = reservable[0]
const secondPlace = reservable.find(place => place.cityId === firstPlace.cityId && place.id !== firstPlace.id)!
const secondId = "sample-booking-22222222-3333-4444-5555-666666666666"

test("registered venue reservations carry exact localized name and city through result and cancellation", () => {
  expect(reservable.length).toBeGreaterThan(3)
  for (const place of reservable) {
    let state = selectReservationPlaceB(initialReservationB(), place.id)
    expect(state.draft).toMatchObject({ venueId: place.id, venueName: place.name, city: place.cityId })
    expect(validReservationDraftB(state.draft)).toBe(true)
    state = reduceReservationB(state, { type: "edit", draft: { ...state.draft, party: 4, time: "19:00" } })
    state = reduceReservationB(state, { type: "submit", operationId: id })
    state = reduceReservationB(state, { type: "resolve", operationId: id, outcome: "success" })
    state = reduceReservationB(state, { type: "cancel" })
    state = reduceReservationB(state, { type: "resolve_cancel", operationId: id, outcome: "success" })
    expect(restoreReservationB(JSON.parse(JSON.stringify(state)))).toMatchObject({ phase: "cancelled", operationId: id,
      draft: { venueId: place.id, venueName: place.name, city: place.cityId, party: 4, time: "19:00" } })
  }
})

test("unsupported places and relabeled venue drafts cannot acquire reservation context", () => {
  const empty = initialReservationB()
  expect(selectReservationPlaceB(empty, "invented-venue")).toBe(empty)
  for (const place of supportedCommercePlacesB().filter(place => !place.reservation)) {
    expect(selectReservationPlaceB(empty, place.id)).toBe(empty)
  }
  const first = selectReservationPlaceB(empty, firstPlace.id)
  const second = selectReservationPlaceB(empty, secondPlace.id)
  expect(reduceReservationB(first, { type: "edit", draft: second.draft })).toBe(first)
  expect(validReservationDraftB({ ...first.draft, venueId: secondPlace.id })).toBe(false)
  expect(validReservationDraftB({ ...first.draft, city: "not-a-city" })).toBe(false)
  expect(restoreReservationB({ ...first, draft: { ...first.draft, venueName: { ...first.draft.venueName, en: "Wrong venue" } } })).toBeNull()
})

test("switching same-city venues never shows the previous booking and restores each exact request", () => {
  let state = selectReservationPlaceB(initialReservationB(), firstPlace.id)
  state = reduceReservationB(state, { type: "edit", draft: { ...state.draft, party: 3, time: "19:00" } })
  state = reduceReservationB(state, { type: "submit", operationId: id })
  state = reduceReservationB(state, { type: "resolve", operationId: id, outcome: "success" })
  const firstDate = state.draft.date
  state = selectReservationPlaceB(state, secondPlace.id)
  expect(state).toMatchObject({ phase: "draft", operationId: null, confirmationRef: null, draft: { venueId: secondPlace.id, venueName: secondPlace.name, party: 2 } })
  expect(state.history).toHaveLength(1)
  expect(state.history[0]).toMatchObject({ phase: "confirmed", operationId: id, draft: { venueId: firstPlace.id, party: 3 } })
  state = reduceReservationB(state, { type: "submit", operationId: secondId })
  state = reduceReservationB(state, { type: "resolve", operationId: secondId, outcome: "full" })
  state = selectReservationPlaceB(restoreReservationB(JSON.parse(JSON.stringify(state)))!, firstPlace.id)
  expect(state).toMatchObject({ phase: "confirmed", operationId: id, draft: { venueId: firstPlace.id, venueName: firstPlace.name, date: firstDate, party: 3, time: "19:00" } })
  expect(state.history[0]).toMatchObject({ phase: "full", operationId: secondId, draft: { venueId: secondPlace.id } })
  expect(selectReservationPlaceB(state, firstPlace.id)).toBe(state)
  expect(selectReservationPlaceB(state, secondPlace.id)).toMatchObject({ phase: "full", operationId: secondId, draft: { venueId: secondPlace.id } })
})

test("switching during a request preserves queryable unknown and ignores its late result", () => {
  let state = reduceReservationB(selectReservationPlaceB(initialReservationB(), firstPlace.id), { type: "submit", operationId: id })
  state = selectReservationPlaceB(state, secondPlace.id)
  expect(state.history[0]).toMatchObject({ phase: "unknown", operationId: id, draft: { venueId: firstPlace.id } })
  expect(reduceReservationB(state, { type: "resolve", operationId: id, outcome: "success" })).toBe(state)
  state = selectReservationPlaceB(state, firstPlace.id)
  expect(reduceReservationB(state, { type: "submit", operationId: secondId })).toBe(state)
  state = reduceReservationB(state, { type: "query" })
  expect(state.operationId).toBe(id)
  state = reduceReservationB(state, { type: "resolve", operationId: id, outcome: "success" })
  expect(state).toMatchObject({ phase: "confirmed", draft: { venueId: firstPlace.id } })
})

test("cancellation history remains tied to the same confirmation through venue switching", () => {
  let state = reduceReservationB(selectReservationPlaceB(initialReservationB(), firstPlace.id), { type: "submit", operationId: id })
  state = reduceReservationB(state, { type: "resolve", operationId: id, outcome: "success" })
  const confirmationRef = state.confirmationRef
  state = reduceReservationB(state, { type: "cancel" })
  state = selectReservationPlaceB(state, secondPlace.id)
  state = selectReservationPlaceB(restoreReservationB(state)!, firstPlace.id)
  expect(state).toMatchObject({ phase: "cancel_unknown", operationId: id, confirmationRef })
  state = reduceReservationB(state, { type: "query" })
  state = reduceReservationB(state, { type: "resolve_cancel", operationId: id, outcome: "success" })
  expect(state).toMatchObject({ phase: "cancelled", operationId: id, confirmationRef, draft: { venueId: firstPlace.id, venueName: firstPlace.name } })
})

test("restoration rejects foreign, relabeled or duplicate history records", () => {
  const first = selectReservationPlaceB(initialReservationB(), firstPlace.id)
  const second = selectReservationPlaceB(first, secondPlace.id)
  expect(restoreReservationB({ ...second, history: [second.history[0], second.history[0]] })).toBeNull()
  expect(restoreReservationB({ ...second, history: [{ ...second.history[0], draft: { ...second.history[0].draft, venueId: "invented-venue" } }] })).toBeNull()
  expect(restoreReservationB({ ...second, history: [{ ...second, history: undefined }] })).toBeNull()
})

test("venue reservation UI has visible no-payment conditions, exact returns and Tables history", () => {
  const reservation = readFileSync("features/ondo/reservation-b/reservation-b.tsx", "utf8")
  const tables = readFileSync("features/ondo/connect/tables-entry-b.tsx", "utf8")
  const tableCss = readFileSync("features/ondo/connect/pulse-table-b.module.css", "utf8")
  expect(reservation).toContain('data-testid="reservation-conditions"')
  expect(reservation).toContain('requestPlaceServiceReturnB(venueId, "reservation")')
  expect(reservation).toContain('data-testid="reservation-open-error"')
  expect(reservation).not.toMatch(/requestBActionGate|paymentKyc|identityCredential|walletService|fetch\(/)
  expect(tables).toContain('data-testid="tables-reservation-history"')
  expect(tables).toContain('className={styles.reservationHistory} aria-label={reservationCopy.history}')
  expect(tableCss).toContain(".reservationHistory { grid-area: reservation-history;")
  expect(tableCss).toContain('"reservation-history" "cards"')
  expect(tableCss).toContain(".official strong { color: var(--ondo-ink, #191919); }")
  expect(tables).toContain('requestPlaceServiceReturnB(venueId, "table")')
  expect(tables).toContain('requestReservationSampleB({ venueId })')
})
