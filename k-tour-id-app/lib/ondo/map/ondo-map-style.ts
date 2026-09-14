import type { ExpressionSpecification, StyleSpecification } from "maplibre-gl"

type MapLocale = "en" | "ko" | "ja"
export type OndoMapAppearance = "light" | "dark"

// OpenMapTiles/OpenFreeMap building fields, verified against the tile schema.
// This is deliberately shallow cartographic relief, not a measured 3D skyline.
export const ONDO_BUILDING_RELIEF_HEIGHT: ExpressionSpecification = [
  "min", 18, ["max", 0, ["to-number", ["get", "render_height"], 0]],
]
export const ONDO_BUILDING_RELIEF_BASE: ExpressionSpecification = [
  "min", ONDO_BUILDING_RELIEF_HEIGHT,
  ["max", 0, ["to-number", ["get", "render_min_height"], 0]],
]

export function ondoBasemapLabel(locale: MapLocale): ExpressionSpecification {
  return locale === "ko"
    ? ["coalesce", ["get", "name:ko"], ["get", "name"], ["get", "name:latin"]]
    : locale === "ja"
      ? ["coalesce", ["get", "name:ja"], ["get", "name:en"], ["get", "name:latin"], ["get", "name"], ["get", "name:ko"]]
      : ["coalesce", ["get", "name:en"], ["get", "name:latin"], ["get", "name"], ["get", "name:ko"]]
}

/**
 * A deliberately quiet OpenMapTiles style. Roads and labels provide just enough
 * wayfinding context; heat is rendered by ONDO's own data layers, never by the basemap.
 */
export function ondoMapPalette(appearance: OndoMapAppearance = "light", after19 = false) {
  // Appearance owns luminance. After19 is a discovery lens: a subtle lavender
  // cast and thermal accents, never an implicit switch from Light to Dark.
  return appearance === "dark"
    ? {
        canvas: after19 ? "#1b1c29" : "#171d22",
        park: after19 ? "#242d31" : "#203029", parkOpacity: 0.7,
        water: after19 ? "#26324b" : "#203647",
        building: after19 ? "#363548" : "#303a40",
        buildingLine: after19 ? "#4d4960" : "#44545b", buildingOpacity: 0.66,
        buildingExtrusion: after19 ? "#504b5c" : "#405359", buildingExtrusionOpacity: 0.38,
        minorRoad: after19 ? "#373748" : "#344149",
        majorRoad: after19 ? "#77758a" : "#73858d",
        secondaryRoad: after19 ? "#545469" : "#4c6069",
        boundary: "#747d8c", label: "#dce2e8",
        labelHalo: after19 ? "#1b1c29" : "#171d22", labelHaloWidth: 1.2,
      }
    : {
        canvas: after19 ? "#f4f1f7" : "#f5f7f6",
        park: after19 ? "#e6e9ed" : "#e5ece5", parkOpacity: 0.62,
        water: after19 ? "#e0e4f0" : "#dce9ed",
        building: after19 ? "#e1dce8" : "#e2e9e6",
        buildingLine: after19 ? "#d0cbd9" : "#d0dcd6", buildingOpacity: 0.58,
        buildingExtrusion: after19 ? "#c2b9d0" : "#bdcfc7", buildingExtrusionOpacity: 0.42,
        minorRoad: after19 ? "#e1dce8" : "#dde4e1",
        majorRoad: after19 ? "#c5bdd2" : "#bdceca",
        secondaryRoad: after19 ? "#d4cddd" : "#d0dbd7",
        boundary: after19 ? "#91879f" : "#849a94",
        label: after19 ? "#61556f" : "#4b605d",
        labelHalo: after19 ? "#f8f5fb" : "#f7f9f8", labelHaloWidth: 1.2,
      }
}

export function ondoMapStyle(locale: MapLocale, appearance: OndoMapAppearance = "light", after19 = false): StyleSpecification {
  const palette = ondoMapPalette(appearance, after19)
  return {
    version: 8,
    light: { anchor: "viewport", color: "#ffffff", intensity: 0.35, position: [1.15, 210, 38] },
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sources: {
      openmaptiles: {
        type: "vector",
        url: "https://tiles.openfreemap.org/planet",
        attribution: "OpenFreeMap © OpenMapTiles · © OpenStreetMap contributors",
      },
    },
    layers: [
      { id: "canvas", type: "background", paint: { "background-color": palette.canvas } },
      {
        id: "park",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "landcover",
        filter: ["in", ["get", "class"], ["literal", ["wood", "grass", "farmland"]]],
        paint: { "fill-color": palette.park, "fill-opacity": palette.parkOpacity },
      },
      {
        id: "water",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "water",
        paint: { "fill-color": palette.water },
      },
      {
        id: "buildings",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "building",
        minzoom: 14,
        paint: { "fill-color": palette.building, "fill-outline-color": palette.buildingLine, "fill-opacity": palette.buildingOpacity },
      },
      {
        id: "buildings-relief",
        type: "fill-extrusion",
        source: "openmaptiles",
        "source-layer": "building",
        minzoom: 14,
        filter: ["!=", ["to-string", ["get", "hide_3d"]], "true"],
        paint: {
          "fill-extrusion-color": palette.buildingExtrusion,
          "fill-extrusion-opacity": palette.buildingExtrusionOpacity,
          "fill-extrusion-height": ONDO_BUILDING_RELIEF_HEIGHT,
          "fill-extrusion-base": ONDO_BUILDING_RELIEF_BASE,
          "fill-extrusion-vertical-gradient": true,
        },
      },
      {
        id: "roads-minor",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 16,
        filter: ["in", ["get", "class"], ["literal", ["minor", "service", "path", "track"]]],
        paint: { "line-color": palette.minorRoad, "line-width": ["interpolate", ["linear"], ["zoom"], 14, 0.4, 17, 1.1] },
      },
      {
        id: "roads-major",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 12,
        filter: ["in", ["get", "class"], ["literal", ["primary", "trunk", "motorway"]]],
        paint: { "line-color": palette.majorRoad, "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.4, 15, 1.8] },
      },
      {
        id: "roads-secondary",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 14,
        filter: ["in", ["get", "class"], ["literal", ["secondary", "tertiary"]]],
        paint: { "line-color": palette.secondaryRoad, "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.45, 16, 1.25] },
      },
      {
        id: "city-boundaries",
        type: "line",
        source: "openmaptiles",
        "source-layer": "boundary",
        filter: ["<=", ["get", "admin_level"], 6],
        paint: { "line-color": palette.boundary, "line-width": 0.6, "line-dasharray": [2, 3], "line-opacity": 0.28 },
      },
      {
        id: "place-labels",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "place",
        minzoom: 7,
        filter: ["in", ["get", "class"], ["literal", ["city", "town", "suburb", "neighbourhood"]]],
        layout: {
          "text-field": ondoBasemapLabel(locale),
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 7, 11, 14, 13],
          "text-max-width": 8,
        },
        paint: {
          "text-color": palette.label,
          "text-halo-color": palette.labelHalo,
          "text-halo-width": palette.labelHaloWidth,
        },
      },
    ],
  }
}
