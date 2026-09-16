import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"
import { researchedFoodByIdB, researchFoodMediaB } from "../../features/ondo/map/researched-food-b"
import { resolveCommercePlaceB, supportedCommercePlacesB } from "../../features/ondo/commerce-b/place-service-registry-b"

const PLACE_ID = "research-jeju-sinseoloreum"
const PHOTO = "/media/venues/research-jeju-sinseoloreum/momguk-gong-seokbae-20190723-v1.jpg"

test("SINSEOL-CONTENT-001 named historical photograph is local, byte-exact and attributed", async () => {
  const place = researchedFoodByIdB(PLACE_ID)
  expect(place).toBeDefined()
  expect(place!.photo).toMatchObject({
    localSrc: PHOTO,
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:신설오름_몸국.jpg",
  })
  expect(place!.photo!.credit).toContain("공석배")
  expect(place!.photo!.credit).toContain("2019-07-23")
  expect(place!.photo!.credit).toContain("display crop only")
  expect(place!.photo).not.toHaveProperty("publishedAt") // known capture date is not a publication date
  for (const locale of ["en", "ko", "ja"] as const) expect(place!.photo!.alt![locale]).toContain("2019")
  expect(researchFoodMediaB(place!).photograph?.src).toBe(PHOTO)
  const bytes = readFileSync(resolve("public", PHOTO.slice(1)))
  expect(bytes.length).toBe(229740)
  expect(bytes.subarray(0, 2).toString("hex")).toBe("ffd8")
  expect(createHash("sha256").update(bytes).digest("hex")).toBe("1550a36f18e307d644c5856573de445e0ae62530137cb1d4f2e945c983885666")
  const { PUBLIC_FILES } = await import("../../scripts/ondo-b-standalone/policy.mjs")
  expect(PUBLIC_FILES).toContain(`public${PHOTO}`)
})

test("SINSEOL-CONTENT-002 two-source content never adds commerce, booking or live activity authority", () => {
  const place = researchedFoodByIdB(PLACE_ID)!
  expect(place).toMatchObject({ city: "jeju", kind: "food", canonicalVenueId: null, checkedAt: "2026-09-16", latitude: 33.50546, longitude: 126.54163, address: "제주특별자치도 제주시 고마로17길 2" })
  expect(place.sources.map(source => new URL(source.url).hostname)).toEqual(["www.visitjeju.net", "korean.visitkorea.or.kr"])
  expect(place.sources.every(source => source.evidence === "tourism" && source.publishedAt === null)).toBe(true)
  expect(resolveCommercePlaceB(PLACE_ID)).toBeNull()
  expect(supportedCommercePlacesB()).toHaveLength(27)
  for (const field of ["commerce", "reservation", "tableId", "heat", "observedAt", "liveCount", "openNow", "verifiedVisits", "pulseEligible"]) expect(place).not.toHaveProperty(field)
})

test("SINSEOL-CONTENT-003 category provenance remains explicit and at least eleven pixels", () => {
  const css = readFileSync(resolve("features/ondo/map/food-photo-b.module.css"), "utf8")
  const rule = css.match(/\.photo\[data-food-photo="category-placeholder"\] figcaption\s*\{([^}]+)\}/)?.[1]
  expect(rule).toBeDefined()
  expect(rule).toMatch(/font-size:\s*11px/)
  expect(readFileSync(resolve("features/ondo/map/food-photo-b.tsx"), "utf8")).toContain("not a photo of this venue or its menu")
})
