import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"
import { RESEARCHED_FOOD_B, researchedFoodByIdB, researchFoodIllustrationB, researchFoodMediaB } from "../../features/ondo/map/researched-food-b"

const source = (path: string) => readFileSync(resolve(path), "utf8")

test("PASS-FOOD-001 named noodle and tteokgalbi picks use distinct illustrative dishes, never bibimbap", () => {
  const noodles = researchFoodIllustrationB(researchedFoodByIdB("research-busan-moemiljip")!)
  const grill = researchFoodIllustrationB(researchedFoodByIdB("research-busan-songheonjip")!)
  expect(noodles).toEqual({ src: "/editorial/food/perilla-noodles-illustration-v1.jpg", subject: "noodles" })
  expect(grill).toEqual({ src: "/editorial/food/tteokgalbi-illustration-v1.jpg", subject: "grill" })
  expect(noodles.src).not.toEqual(grill.src)
  for (const pick of RESEARCHED_FOOD_B) {
    const provenanceBefore = structuredClone(pick.photo)
    const media = researchFoodIllustrationB(pick)
    expect(media.src, pick.id).not.toBe("/editorial/food/ondo-category-korean-v1.jpg")
    if (media.src) expect(existsSync(resolve("public", media.src.slice(1))), pick.id).toBe(true)
    // The decorative media mapping never changes the sourced photo provenance.
    expect(pick.photo, pick.id).toEqual(provenanceBefore)
  }
})

test("PASS-FOOD-004 a licensed local venue photo is distinct from illustrations and never becomes a remote hotlink", () => {
  const onion = researchedFoodByIdB("research-seoul-onion-anguk")!
  const media = researchFoodMediaB(onion)
  expect(media.photograph?.src).toBe("/media/venues/onion-anguk-christopher-phua-20250301.jpg")
  expect(existsSync(resolve("public", media.photograph!.src.slice(1)))).toBe(true)
  expect(media.photograph?.alt.en).toContain("Onion Anguk")
  expect(onion.photo?.credit).toBe("Christopher Phua / Unsplash")
  expect(researchFoodIllustrationB(onion).src).toBeNull()
  // A source/licensing URL alone is not a deployable photo.
  expect(researchFoodMediaB({ ...onion, photo: { ...onion.photo!, localSrc: undefined } }).photograph).toBeUndefined()
  expect(researchFoodMediaB({ ...onion, photo: { ...onion.photo!, localSrc: "https://example.com/unapproved.jpg" } }).photograph).toBeUndefined()
  expect(researchFoodMediaB(researchedFoodByIdB("research-seoul-london-bagel-dosan")!).photograph).toBeUndefined()
})

test("PASS-FOOD-002 unmatched dishes keep honest category fallbacks, not unrelated café or Korean photos", () => {
  for (const [id, subject] of [
    ["research-seoul-gosari-express", "noodles"],
    ["research-seoul-3rd-samgyetang", "soup"],
    ["research-seoul-london-bagel-dosan", "bakery"],
    ["research-jeju-azulejo", "bakery"],
    ["research-jeju-gozip-dolwurock-jungmun", "seafood"],
    ["research-busan-sour-yeongdo", "beer"],
  ]) expect(researchFoodIllustrationB(researchedFoodByIdB(id)!)).toEqual({ src: null, subject })
  expect(new Set(RESEARCHED_FOOD_B.map(place => researchFoodIllustrationB(place).subject)).size).toBeGreaterThanOrEqual(8)
  const photo = source("features/ondo/map/food-photo-b.tsx")
  expect(photo).toContain('data-food-photo="category-placeholder"')
  expect(photo).toContain('data-photo-state="not-provided"')
  expect(photo).toContain("not a photo of this venue or its menu")
})

test("PASS-FOOD-005 Hakrim uses its licensed local entrance photo, top-aligned at square detail size", () => {
  const place = researchedFoodByIdB("research-seoul-hakrim-dabang")!
  const media = researchFoodMediaB(place)
  expect(media.subject).toBe("coffee")
  expect(media.photograph).toEqual({ src: "/media/venues/research-seoul-hakrim-dabang/exterior-seefooddiet-20250110-v1.jpg", alt: place.photo!.alt, objectPosition: "50% 0%" })
  expect(place.photo?.license).toBe("CC BY-SA 4.0")
  expect(place.photo?.credit).toContain("Wikimedia 960px thumbnail; top-aligned display crop")
  expect(source("features/ondo/map/food-photo-b.tsx")).toContain("objectPosition: photograph.objectPosition")
  expect(source("features/ondo/map/researched-food-panel-b.tsx")).toContain('<div className={styles.identity}><FoodPhotoB {...researchFoodMediaB(place)} locale={locale} compact />')
})

test("PASS-FOOD-003 secondary readiness uses a native disclosure and preserves all independent controls", () => {
  const pass = source("features/ondo/identity-b/traveler-id-entry-b.tsx")
  expect(pass).toContain('<KPassServiceCardB paymentReady={paymentStatus === "success"} compact />')
  expect(pass).toMatch(/<details[^>]+data-testid="travel-pass-status"/)
  expect(pass).toMatch(/<summary[^>]+data-testid="travel-pass-readiness-toggle"/)
  for (const id of ["traveler-id-account", "traveler-id-person", "traveler-id-age", "traveler-id-credential", "traveler-id-payment", "traveler-id-person-check", "traveler-id-age-check", "traveler-id-ktour-id-open"])
    expect(pass).toContain(`data-testid="${id}"`)
  expect(pass.indexOf("<IdWalletCommerceB")).toBeLessThan(pass.indexOf('data-testid="travel-pass-status"'))
  const services = source("features/ondo/identity-b/kpass-service-card-b.tsx")
  expect(services).toMatch(/<details[^>]+data-testid="kpass-service-disclosure"/)
  expect(services).toContain('data-testid="kpass-start-setup"')
  expect(services).toContain('data-testid="kpass-manage-setup"')
  expect(services).toContain('data-testid="kpass-sample-picker"')
  expect(services).toContain('evaluateKPassService(credential, { service: id, paymentKyc: paymentReady, amountKrw: 22_000 })')
})
