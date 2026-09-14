import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"
import { CANONICAL_MAP_VENUES_COMPACT } from "../../lib/ondo/venues/map-data"
import {
  JEJU_EDITORIAL_PLACES,
} from "../../features/ondo/pulse-b/japan-first-pulse-model-b"
import {
  editorialMemoryCardViewModelB,
  officialMemoryCardViewModelB,
  resolveVisibleMyKoreaMemorySequenceB,
} from "../../features/ondo/my/memory-venue-card-b-model"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

test("W3-MY-MEMORY-001 official records and editorial places keep record and media truth separate", () => {
  const official = officialMemoryCardViewModelB(CANONICAL_MAP_VENUES_COMPACT[0], "en")
  expect(official.source).toEqual(expect.objectContaining({ kind: "official_directory", officialRecord: true }))
  expect(official.recordProvenance.sourceId).toBe("MOIS_LOCALDATA_GENERAL_RESTAURANTS")
  expect(official.media).toEqual(expect.objectContaining({
    kind: "category_illustration",
    exactVenuePhoto: false,
    alt: "",
    rights: expect.objectContaining({ mode: "bundled_category_art" }),
  }))

  const c18 = JEJU_EDITORIAL_PLACES.find((place) => place.storyIds.includes("C18"))
  const c20 = JEJU_EDITORIAL_PLACES.find((place) => place.storyIds.includes("C20"))
  const withoutStory = JEJU_EDITORIAL_PLACES.find((place) => place.storyIds.length === 0)
  expect(c18 && c20 && withoutStory).toBeTruthy()

  const editorial = [c18!, c20!].map((place) => editorialMemoryCardViewModelB(place, "en"))
  expect(editorial.map((model) => model.media.src)).toEqual([
    "/editorial/japan-first-c18-jeju-screen-route.jpg",
    "/editorial/japan-first-c20-jeju-kpop-route.jpg",
  ])
  for (const model of editorial) {
    expect(model.source).toEqual(expect.objectContaining({ kind: "editorial_place", officialRecord: false }))
    expect(model.media.kind).toBe("editorial_illustration")
    expect(model.media.exactVenuePhoto).toBe(false)
    expect(model.media.rights.mode).toBe("ondo_original")
  }

  const fallback = editorialMemoryCardViewModelB(withoutStory!, "en")
  expect(fallback.media).toEqual(expect.objectContaining({
    kind: "pictogram_fallback",
    src: null,
    exactVenuePhoto: false,
    rights: expect.objectContaining({ mode: "interface_pictogram" }),
  }))
})

test("W3-MY-MEMORY-002 visible sequence crops are pure, locale-stable, and collision-free", () => {
  const venue = CANONICAL_MAP_VENUES_COMPACT[0]
  const en = officialMemoryCardViewModelB(venue, "en")
  const ko = officialMemoryCardViewModelB(venue, "ko")
  const input = Object.freeze([en, en, en, en, en])
  const before = JSON.stringify(input)
  const first = resolveVisibleMyKoreaMemorySequenceB(input)
  const second = resolveVisibleMyKoreaMemorySequenceB(input)
  const localized = resolveVisibleMyKoreaMemorySequenceB(Object.freeze([ko, ko, ko, ko, ko]))

  expect(JSON.stringify(input)).toBe(before)
  expect(first.map((model) => model.media.crop)).toEqual(second.map((model) => model.media.crop))
  expect(first.map((model) => model.media.crop)).toEqual(localized.map((model) => model.media.crop))
  for (let index = 1; index < first.length; index += 1) {
    const previous = first[index - 1].media
    const current = first[index].media
    expect(`${current.mediaSourceId}|${current.crop}`).not.toBe(`${previous.mediaSourceId}|${previous.crop}`)
  }
})

test("W3-MY-MEMORY-003 renderer reports fallback truth and uses opt-in container fit", () => {
  const component = source("features/ondo/my/memory-venue-card-b.tsx")
  const css = source("features/ondo/my/memory-venue-card-b.module.css")

  expect(component).toContain("data-media-kind={renderedMediaKind}")
  expect(component).toContain('data-memory-venue-card=""')
  expect(component).toContain("label?: string")
  expect(component).toContain("data-rendered-media-badge={renderedMediaKind}")
  expect(component).toContain("onError={() => setFailedSrc(model.media.src)}")
  expect(component).toContain('loading={priority ? "eager" : "lazy"}')
  expect(component).toContain('fetchPriority={priority ? "high" : "auto"}')
  expect(css).toContain("container-type: inline-size")
  expect(css).toContain('@container (min-width: 320px)')
  expect(css).toContain('.card[data-fit="compact-column"] .media')
  expect(css).toContain("aspect-ratio: 4 / 3")
  expect(css).toContain("aspect-ratio: 16 / 10")
  expect(css).not.toContain("@media (orientation: landscape)")
})

test("W3-MY-MEMORY-004 saved, recent and removal surfaces share the resolved memory presenter", () => {
  const entry = source("features/ondo/my/saved-entry-b.tsx")

  expect(entry).toContain("const visibleMemoryModels = resolveVisibleMyKoreaMemorySequenceB")
  expect(entry).toContain("{savedMemoryModels.map")
  expect(entry).toContain("{recentMemoryModels.map")
  expect(entry.match(/<MyKoreaMemoryVenueCardB/g)).toHaveLength(2)
  expect(entry).toContain("priority={index === 0}")
  expect(entry).toContain("priority={savedMemoryModels.length === 0 && index === 0}")
  expect(entry).toContain("<MyKoreaMemoryThumbnailB model={removalTarget.model} />")
  expect(entry).toContain("model }\n                    : { kind: \"editorial\"")
  expect(entry.match(/fit="adaptive"/g)).toHaveLength(2)
  expect(entry).not.toContain("matchMedia")
  expect(entry).toContain('data-testid="saved-remove-scroll"')
})
