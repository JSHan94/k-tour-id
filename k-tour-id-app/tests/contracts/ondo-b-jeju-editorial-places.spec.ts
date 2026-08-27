import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { CANONICAL_MAP_VENUES_COMPACT } from "../../lib/ondo/venues/map-data"
import {
  JEJU_EDITORIAL_PLACES,
  JEJU_EDITORIAL_SEEDS,
  sanitizeEditorialPlaceIds,
} from "../../features/ondo/pulse-b/japan-first-pulse-model-b"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

const EXPECTED_PLACES = [
  ["jeju-seongsan-ilchulbong", 33.4580801942424, 126.941500386507, "https://english.visitkorea.or.kr/svc/whereToGo/locIntrdn/rgnContentsView.do?vcontsId=110731"],
  ["jeju-gwangchigi-beach", 33.452277804193, 126.923932706058, "https://english.visitkorea.or.kr/svc/contents/contentsView.do?menuSn=351&vcontsId=222094"],
  ["jeju-gwaneumsa", 33.4237307637202, 126.558131212009, "https://english.visitkorea.or.kr/svc/whereToGo/locIntrdn/rgnContentsView.do?vcontsId=90109"],
  ["jeju-donsadon", 33.4788811707717, 126.464058148407, "https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=53559"],
  ["jeju-oneunjeong-gimbap", 33.249619622742216, 126.56757861250604, "https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=199581"],
  ["jeju-haenyeo-kitchen-bukchon", 33.5498765904388, 126.693440739934, "https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=187159"],
  ["jeju-dongmun-market", 33.5115311377898, 126.526046080257, "https://english.visitkorea.or.kr/svc/whereToGo/locIntrdn/rgnContentsView.do?vcontsId=91650"],
  ["jeju-seogwipo-olle-market", 33.2501482431274, 126.563223568437, "https://english.visitkorea.or.kr/svc/whereToGo/locIntrdn/rgnContentsView.do?vcontsId=90960"],
] as const

test("B-JEJU-EDITORIAL-001 exact VISITKOREA place-page coordinates are the only map points", () => {
  expect(JEJU_EDITORIAL_PLACES.map((place) => [place.id, place.location.latitude, place.location.longitude, place.placeSourceUrl])).toEqual(EXPECTED_PLACES)
  expect(JEJU_EDITORIAL_PLACES.every((place) => place.location.crs === "EPSG:4326" && place.location.coordinateSource === "VISITKOREA_EMBEDDED_MAP")).toBe(true)
  expect(JEJU_EDITORIAL_PLACES.every((place) => place.location.verifiedAt === "2026-08-28" && place.liveCheckedAt === "2026-08-28")).toBe(true)
  expect(JEJU_EDITORIAL_SEEDS.filter((place) => place.kind === "editorial-place-candidate").map((place) => place.id)).toEqual(["jeju-tamura", "jeju-sogil-byeolha"])
})

test("B-JEJU-EDITORIAL-002 editorial IDs never enter the canonical 400-record or Pulse domains", () => {
  const canonicalIds = new Set(CANONICAL_MAP_VENUES_COMPACT.map((venue) => venue.id))
  expect(CANONICAL_MAP_VENUES_COMPACT).toHaveLength(400)
  expect(JEJU_EDITORIAL_PLACES.every((place) => !canonicalIds.has(place.id))).toBe(true)
  expect(JEJU_EDITORIAL_PLACES.every((place) => place.canonicalVenueId === null && place.officialRecordCount === null)).toBe(true)
  expect(JEJU_EDITORIAL_PLACES.every((place) => place.officialRecord === false && place.pulseEligible === false)).toBe(true)
})

test("B-JEJU-EDITORIAL-003 storage sanitizer accepts only the eight verified editorial IDs", () => {
  expect(sanitizeEditorialPlaceIds([EXPECTED_PLACES[0][0], EXPECTED_PLACES[0][0], "jeju-tamura", "mois-0021cd596bc5b2a922ad", null])).toEqual([EXPECTED_PLACES[0][0]])
})

test("B-JEJU-EDITORIAL-004 internal editorial detail preserves the reduced truth-safe action set", () => {
  const detail = source("features/ondo/place/editorial-place-overlay-b.tsx")
  const saved = source("features/ondo/my/saved-entry-b.tsx")
  const history = source("features/ondo/map/b-discovery-history.ts")

  expect(detail).toContain('data-truth-kind="editorial-place"')
  expect(detail).toContain('data-official-record="false"')
  expect(detail).toContain('data-pulse-eligible="false"')
  expect(detail).toContain('data-testid="ondo-b-editorial-place-directions"')
  expect(detail).toContain('data-testid="ondo-b-editorial-place-save"')
  expect(detail).not.toMatch(/canonical-place-table|checkout|Local Signal|after19|meal benefit/i)
  expect(saved).toContain("savedEditorialPlaceIds")
  expect(saved).toContain("recentEditorialPlaceIds")
  expect(saved).toContain("openSavedBDiscoveryEditorialPlace")
  expect(history).toContain('kind: "editorial-place"')
  expect(history).toContain("editorialPlaceId")
})
