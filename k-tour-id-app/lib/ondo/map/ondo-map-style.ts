import type { ExpressionSpecification, StyleSpecification } from "maplibre-gl"

const LABEL: ExpressionSpecification = ["coalesce", ["get", "name:ko"], ["get", "name:latin"], ["get", "name"]]

/**
 * A deliberately quiet OpenMapTiles style. Roads and labels provide just enough
 * wayfinding context; heat is rendered by ONDO's own data layers, never by the basemap.
 */
export const ONDO_MAP_STYLE: StyleSpecification = {
  version: 8,
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  sources: {
    openmaptiles: {
      type: "vector",
      url: "https://tiles.openfreemap.org/planet",
      attribution: "OpenFreeMap © OpenMapTiles · © OpenStreetMap contributors",
    },
  },
  layers: [
    { id: "canvas", type: "background", paint: { "background-color": "#faf9f6" } },
    {
      id: "park",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landcover",
      filter: ["in", ["get", "class"], ["literal", ["wood", "grass", "farmland"]]],
      paint: { "fill-color": "#edf0e9", "fill-opacity": 0.62 },
    },
    {
      id: "water",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "water",
      paint: { "fill-color": "#e8eef0" },
    },
    {
      id: "buildings",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "building",
      minzoom: 15,
      paint: { "fill-color": "#f0efec", "fill-outline-color": "#e7e4df", "fill-opacity": 0.66 },
    },
    {
      id: "roads-minor",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 14,
      filter: ["in", ["get", "class"], ["literal", ["minor", "service", "path", "track"]]],
      paint: { "line-color": "#e4e1dc", "line-width": ["interpolate", ["linear"], ["zoom"], 14, 0.4, 17, 1.1] },
    },
    {
      id: "roads-major",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 8,
      filter: ["in", ["get", "class"], ["literal", ["primary", "trunk", "motorway"]]],
      paint: { "line-color": "#d8d4cd", "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.4, 15, 1.8] },
    },
    {
      id: "roads-secondary",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 12,
      filter: ["in", ["get", "class"], ["literal", ["secondary", "tertiary"]]],
      paint: { "line-color": "#dedbd5", "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.45, 16, 1.25] },
    },
    {
      id: "city-boundaries",
      type: "line",
      source: "openmaptiles",
      "source-layer": "boundary",
      filter: ["<=", ["get", "admin_level"], 6],
      paint: { "line-color": "#c8c3ba", "line-width": 0.7, "line-dasharray": [2, 3], "line-opacity": 0.72 },
    },
    {
      id: "place-labels",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      minzoom: 7,
      filter: ["in", ["get", "class"], ["literal", ["city", "town", "suburb", "neighbourhood"]]],
      layout: {
        "text-field": LABEL,
        "text-font": ["Noto Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 7, 11, 14, 13],
        "text-max-width": 8,
      },
      paint: {
        "text-color": "#4f4b45",
        "text-halo-color": "#faf9f6",
        "text-halo-width": 1.2,
      },
    },
  ],
}
