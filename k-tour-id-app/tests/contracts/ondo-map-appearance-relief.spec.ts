import { createRequire } from "node:module"
import { expect, test } from "@playwright/test"
import { ONDO_BUILDING_RELIEF_BASE, ONDO_BUILDING_RELIEF_HEIGHT, ondoMapPalette, ondoMapStyle } from "../../lib/ondo/map/ondo-map-style"

// Validate against the exact style-spec shipped with the installed MapLibre,
// not a newer online schema with unsupported paint properties.
const localRequire = createRequire(import.meta.url)
const mapLibreRequire = createRequire(localRequire.resolve("maplibre-gl/package.json"))
const { validateStyleMin, createExpression } = mapLibreRequire("@maplibre/maplibre-gl-style-spec") as {
  validateStyleMin: (style: unknown) => unknown[]
  createExpression: (expression: unknown) => { result: string; value: { evaluate: (globals: object, feature: object) => number } }
}
function luminance(hex: string) {
  const rgb = hex.slice(1).match(/../g)!.map(component => parseInt(component, 16) / 255)
    .map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4)
  return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2]
}

for (const appearance of ["light", "dark"] as const) {
  for (const after19 of [false, true]) {
    test(`MAP-AXES ${appearance} × ${after19 ? "after19" : "standard"} keeps appearance luminance and validates in installed MapLibre`, () => {
      const palette = ondoMapPalette(appearance, after19)
      expect(validateStyleMin(ondoMapStyle("en", appearance, after19))).toEqual([])
      if (appearance === "light") {
        expect(luminance(palette.canvas)).toBeGreaterThan(.8)
        expect(luminance(palette.water)).toBeGreaterThan(.7)
      } else {
        expect(luminance(palette.canvas)).toBeLessThan(.06)
        expect(luminance(palette.water)).toBeLessThan(.08)
      }
      expect((Math.max(luminance(palette.label), luminance(palette.canvas)) + .05) /
        (Math.min(luminance(palette.label), luminance(palette.canvas)) + .05)).toBeGreaterThan(4.5)
    })
  }
}

test("MAP-RELIEF real building source is shallow, bounded and does not add a costly terrain provider", () => {
  const style = ondoMapStyle("en")
  const relief = style.layers.find(layer => layer.id === "buildings-relief")!
  expect(relief.type).toBe("fill-extrusion")
  if (relief.type !== "fill-extrusion") throw new Error("Missing building relief")
  expect(relief.source).toBe("openmaptiles")
  expect(relief["source-layer"]).toBe("building")
  expect(relief.minzoom).toBe(14)
  expect(relief.filter).toEqual(["!=", ["to-string", ["get", "hide_3d"]], "true"])
  expect(style.terrain).toBeUndefined()
  expect(Object.keys(style.sources)).toEqual(["openmaptiles"])

  const height = createExpression(ONDO_BUILDING_RELIEF_HEIGHT)
  const base = createExpression(ONDO_BUILDING_RELIEF_BASE)
  expect(height.result).toBe("success")
  expect(base.result).toBe("success")
  for (const [properties, expectedHeight, expectedBase] of [
    [{ render_height: 7, render_min_height: 2 }, 7, 2],
    [{ render_height: 300, render_min_height: 100 }, 18, 18],
    [{ render_height: -1, render_min_height: -2 }, 0, 0],
    [{}, 0, 0],
    [{ render_height: "invalid", render_min_height: 15 }, 0, 0],
  ] as const) {
    expect(height.value.evaluate({}, { properties })).toBe(expectedHeight)
    expect(base.value.evaluate({}, { properties })).toBe(expectedBase)
  }
})
