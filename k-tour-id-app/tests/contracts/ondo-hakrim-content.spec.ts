import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"
import { researchedFoodByIdB, researchFoodMediaB, researchFoodMatchesB } from "../../features/ondo/map/researched-food-b"
import { resolveCommercePlaceB, supportedCommercePlacesB } from "../../features/ondo/commerce-b/place-service-registry-b"

const id = "research-seoul-hakrim-dabang"
const publicPath = "public/media/venues/research-seoul-hakrim-dabang/exterior-seefooddiet-20250110-v1.jpg"
const sha256 = "8fdf8b238be3746975ed8eacb95a0a9318bceb0f5f024686a8a850fee97b6e76"

test("HAKRIM-01 translated place content retains official evidence and no merchant capabilities", () => {
  const place = researchedFoodByIdB(id)!
  expect(place).toMatchObject({ city: "seoul", kind: "cafe", address: "서울특별시 종로구 대학로 119 2층", latitude: 37.5819287995496, longitude: 127.001679855807, checkedAt: "2026-09-15", canonicalVenueId: null })
  expect(place.sources.some(item => item.evidence === "tourism" && item.url === place.coordinateSourceUrl)).toBe(true)
  for (const locale of ["en", "ko", "ja"] as const) {
    expect(researchFoodMatchesB(place, place.name[locale])).toBe(true)
    expect(place.photo?.alt?.[locale]).toContain("2025")
    expect(place.signature[locale]).toBeTruthy()
  }
  for (const field of ["commerce", "reservation", "tableId", "partner", "openNow", "liveCount"]) expect(place).not.toHaveProperty(field)
  expect(resolveCommercePlaceB(id)).toBeNull()
  expect(supportedCommercePlacesB()).toHaveLength(27)
})

test("HAKRIM-02 exact Wikimedia thumbnail is locally shipped below 500KB, without bitmap edits", async () => {
  const place = researchedFoodByIdB(id)!
  const photo = place.photo!
  const file = readFileSync(resolve(publicPath))
  expect(file.length).toBe(385_996)
  expect(file.length).toBeLessThan(500_000)
  expect(file.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]))
  expect(createHash("sha256").update(file).digest("hex")).toBe(sha256)
  expect(photo.deliveredUrl).toContain("thumb.wikimedia.org/wikipedia/commons/thumb/4/46/Hakrim_Dabang_01.jpg/960px-Hakrim_Dabang_01.jpg")
  expect(researchFoodMediaB(place).photograph?.src).toBe(`/${publicPath.slice("public/".length)}`)
  const policy = await import("../../scripts/ondo-b-standalone/policy.mjs")
  expect(policy.PUBLIC_FILES.filter((path: string) => path === publicPath)).toHaveLength(1)
})

test("HAKRIM-03 credit keeps author, source, license and supplied-thumbnail/display-crop notice", () => {
  const photo = researchedFoodByIdB(id)!.photo!
  expect(photo.sourceUrl).toBe("https://commons.wikimedia.org/wiki/File:Hakrim_Dabang_01.jpg")
  expect(photo.licenseUrl).toBe("https://creativecommons.org/licenses/by-sa/4.0/")
  for (const text of ["Seefooddiet", "Hakrim Dabang 01.jpg", "CC BY-SA 4.0", "Wikimedia 960px thumbnail", "top-aligned display crop"]) expect(photo.credit).toContain(text)
  expect(photo.objectPosition).toBe("50% 0%")
  expect(photo).not.toHaveProperty("publishedAt")
  const panel = readFileSync(resolve("features/ondo/map/researched-food-panel-b.tsx"), "utf8")
  for (const boundary of ['data-testid="research-photo-credit"', "place.photo.credit", "place.photo.sourceUrl", "place.photo.licenseUrl", "not a guarantee of today's menu"]) expect(panel).toContain(boundary)
})
