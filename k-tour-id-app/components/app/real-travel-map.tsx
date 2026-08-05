"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import type { GeoJSONSource, Map as MapLibreMap, Marker } from "maplibre-gl"
import type { NearbyLocation } from "@/lib/location/location-provider"
import { cn } from "@/lib/utils"

const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty"
const DEFAULT_CENTER: [number, number] = [126.978, 37.5665]

type PointLayer = "experience" | "food" | "mobility" | "essentials" | "together"

export interface RealTravelMapPoint {
  id: string
  layer: PointLayer
  title: string
  subtitle: string
  geo: { latitude: number; longitude: number }
  benefitLabel?: string
}

export interface RealTravelMapHandle {
  zoomIn: () => void
  zoomOut: () => void
  flyToLocation: (location: Pick<NearbyLocation, "latitude" | "longitude">) => void
}

interface RealTravelMapProps {
  points: RealTravelMapPoint[]
  selectedId?: string
  currentLocation: NearbyLocation | null
  routePreview: boolean
  heritageLayer: boolean
  lang: "ko" | "en"
  onSelect: (id: string) => void
  onUnavailable: () => void
}

const MARKER_SYMBOLS: Record<PointLayer, string> = {
  experience: "✦",
  food: "●",
  mobility: "↗",
  essentials: "■",
  together: "◎",
}

function isWebglSupported() {
  if (!("WebGLRenderingContext" in window)) return false
  try {
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl")
    return Boolean(context && typeof context.getParameter === "function")
  } catch {
    return false
  }
}

function markerLabel(point: RealTravelMapPoint, lang: "ko" | "en") {
  const category = {
    experience: lang === "ko" ? "할 거리" : "Things to do",
    food: lang === "ko" ? "먹기" : "Eat",
    mobility: lang === "ko" ? "이동" : "Move",
    essentials: lang === "ko" ? "필수품" : "Essentials",
    together: lang === "ko" ? "동행" : "Together",
  }[point.layer]
  return `${category}, ${point.title}, ${point.subtitle}`
}

function createRouteData(
  from: Pick<NearbyLocation, "latitude" | "longitude">,
  to: RealTravelMapPoint["geo"],
) {
  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates: [
        [from.longitude, from.latitude],
        [to.longitude, to.latitude],
      ],
    },
  }
}

export const RealTravelMap = forwardRef<RealTravelMapHandle, RealTravelMapProps>(function RealTravelMap(
  { points, selectedId, currentLocation, routePreview, heritageLayer, lang, onSelect, onUnavailable },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markersRef = useRef<Array<{ id: string; marker: Marker; element: HTMLButtonElement }>>([])
  const locationMarkerRef = useRef<Marker | null>(null)
  const onSelectRef = useRef(onSelect)
  const onUnavailableRef = useRef(onUnavailable)
  const [mapStarted, setMapStarted] = useState(false)
  const [styleReady, setStyleReady] = useState(false)

  onSelectRef.current = onSelect
  onUnavailableRef.current = onUnavailable

  useImperativeHandle(ref, () => ({
    zoomIn: () => mapRef.current?.zoomIn({ duration: 260 }),
    zoomOut: () => mapRef.current?.zoomOut({ duration: 260 }),
    flyToLocation: (location) => {
      mapRef.current?.flyTo({
        center: [location.longitude, location.latitude],
        zoom: Math.max(mapRef.current.getZoom(), 13.5),
        essential: true,
      })
    },
  }), [])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    if (!isWebglSupported()) {
      onUnavailableRef.current()
      return
    }

    const firstPoint = points.find((point) => point.id === selectedId) ?? points[0]
    let map: MapLibreMap
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE_URL,
        center: firstPoint
          ? [firstPoint.geo.longitude, firstPoint.geo.latitude]
          : DEFAULT_CENTER,
        zoom: 12.2,
        minZoom: 6,
        maxZoom: 18,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
      })
    } catch {
      onUnavailableRef.current()
      return
    }

    map.touchZoomRotate.disableRotation()
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left")
    map.on("style.load", () => setStyleReady(true))
    mapRef.current = map
    setMapStarted(true)

    return () => {
      markersRef.current.forEach(({ marker }) => marker.remove())
      markersRef.current = []
      locationMarkerRef.current?.remove()
      locationMarkerRef.current = null
      map.remove()
      mapRef.current = null
    }
    // The map instance owns its initial camera. Later point changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapStarted) return

    markersRef.current.forEach(({ marker }) => marker.remove())
    markersRef.current = points.map((point) => {
      const element = document.createElement("button")
      element.type = "button"
      element.className = cn(
        "atlas-map-marker",
        `atlas-map-marker-${point.layer}`,
        point.id === selectedId && "atlas-map-marker-active",
      )
      element.setAttribute("aria-label", markerLabel(point, lang))
      element.setAttribute("aria-pressed", String(point.id === selectedId))

      const glyph = document.createElement("span")
      glyph.className = "atlas-map-marker-glyph"
      glyph.textContent = MARKER_SYMBOLS[point.layer]
      element.appendChild(glyph)

      if (point.benefitLabel) {
        const benefit = document.createElement("span")
        benefit.className = "atlas-map-marker-benefit"
        benefit.setAttribute("aria-hidden", "true")
        element.appendChild(benefit)
      }

      element.addEventListener("click", (event) => {
        event.stopPropagation()
        onSelectRef.current(point.id)
      })

      const marker = new maplibregl.Marker({ element, anchor: "bottom" })
        .setLngLat([point.geo.longitude, point.geo.latitude])
        .addTo(map)
      return { id: point.id, marker, element }
    })
  }, [lang, mapStarted, points, selectedId])

  useEffect(() => {
    markersRef.current.forEach(({ id, element }) => {
      const active = id === selectedId
      element.classList.toggle("atlas-map-marker-active", active)
      element.setAttribute("aria-pressed", String(active))
    })

    const map = mapRef.current
    const selected = points.find((point) => point.id === selectedId)
    if (!map || !mapStarted || !selected) return
    map.easeTo({
      center: [selected.geo.longitude, selected.geo.latitude],
      zoom: Math.max(map.getZoom(), 12.2),
      offset: [0, -64],
      duration: 520,
      essential: true,
    })
  }, [mapStarted, points, selectedId])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapStarted) return

    locationMarkerRef.current?.remove()
    locationMarkerRef.current = null
    if (!currentLocation) return

    const element = document.createElement("div")
    element.className = "atlas-map-user-marker"
    element.setAttribute("role", "img")
    element.setAttribute("aria-label", lang === "ko" ? "내 위치" : "My location")
    locationMarkerRef.current = new maplibregl.Marker({ element })
      .setLngLat([currentLocation.longitude, currentLocation.latitude])
      .addTo(map)
    map.flyTo({
      center: [currentLocation.longitude, currentLocation.latitude],
      zoom: Math.max(map.getZoom(), 13.2),
      duration: 620,
      essential: true,
    })
  }, [currentLocation, lang, mapStarted])

  useEffect(() => {
    const map = mapRef.current
    const selected = points.find((point) => point.id === selectedId)
    if (!map || !styleReady || !map.isStyleLoaded()) return

    const sourceId = "k-tour-preview-route"
    const layerId = "k-tour-preview-route-line"
    const shouldShow = Boolean(routePreview && currentLocation && selected)

    if (!shouldShow) {
      if (map.getLayer(layerId)) map.removeLayer(layerId)
      if (map.getSource(sourceId)) map.removeSource(sourceId)
      return
    }

    const data = createRouteData(currentLocation!, selected!.geo)
    const existingSource = map.getSource(sourceId) as GeoJSONSource | undefined
    if (existingSource) {
      existingSource.setData(data)
      return
    }

    map.addSource(sourceId, { type: "geojson", data })
    map.addLayer({
      id: layerId,
      type: "line",
      source: sourceId,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#263e4c",
        "line-width": 4,
        "line-dasharray": [1.4, 1.2],
        "line-opacity": 0.88,
      },
    })
  }, [currentLocation, points, routePreview, selectedId, styleReady])

  return (
    <div className={cn("atlas-real-map absolute inset-0", heritageLayer && "atlas-real-map-heritage")}>
      <div ref={containerRef} className="absolute inset-0" aria-label={lang === "ko" ? "인터랙티브 서울 여행 지도" : "Interactive Seoul travel map"} />
    </div>
  )
})
