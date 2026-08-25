import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

const PALETTE = {
  peak: "#7A2048",
  hot: "#C94832",
  rising: "#E6843B",
  warming: "#EBC463",
  low: "#EFE1B7",
  limited: "#CFCAC0",
} as const

test("B-PLACE-PALETTE-001 map, model, and canonical place use one exact Pulse palette", () => {
  const map = `${source("lib/ondo/map/heat.ts")}\n${source("features/ondo/map/map-b.module.css")}`.toUpperCase()
  const model = source("features/ondo/pulse-b/pulse-model-b.ts").toUpperCase()
  const place = source("features/ondo/place/canonical-place.module.css")
  const placeUpper = place.toUpperCase()

  for (const [level, color] of Object.entries(PALETTE)) {
    expect(map).toContain(color)
    expect(model).toContain(color)
    expect(placeUpper).toContain(color)
    expect(place).toContain(`[data-pulse-level="${level}"]`)
  }

  expect(place).toContain('[data-pulse-level="limited"]')
  expect(place).toContain("--pulse-border-style: dashed")
  expect(place).toContain("border-style: var(--pulse-border-style)")
})

test("B-PLACE-PALETTE-002 canonical peek and detail keep a 12px text floor and interaction geometry", () => {
  const place = source("features/ondo/place/canonical-place.module.css")

  expect(place).not.toMatch(/font-size:\s*(?:[0-9](?:\.[0-9]+)?|1[01](?:\.[0-9]+)?)px/)
  expect(place).toContain("min-height: 44px")
  expect(place).toContain("overflow-y: auto")
  expect(place).toContain(":focus-visible")
  expect(place).toContain("var(--ondo-focus, #1d66d1)")
  expect(place).toContain("overscroll-behavior: contain")
})
