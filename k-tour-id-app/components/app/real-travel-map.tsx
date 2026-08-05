"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import * as maplibregl from "maplibre-gl"
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
}

const MARKER_SYMBOLS: Record<PointLayer, string> = {
  experience: "✦",
  food: "●",
  mobility: "↗",
  essentials: "■",
  together: "◎",
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
  { points, selectedId, currentLocation, routePreview, heritageLayer, lang, onSelect },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markersRef = useRef<Array<{ id: string; marker: Marker; element: HTMLButtonElement }>>([])
  const locationMarkerRef = useRef<Marker | null>(null)
  const onSelectRef = useRef(onSelect)
  const [ready, setReady] = useState(false)
  const [timedOut, setTimedOut] = useState(false)

  onSelectRef.current = onSelect

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

    const firstPoint = points.find((point) => point.id === selectedId) ?? points[0]
    const map = new maplibregl.Map({
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

    map.touchZoomRotate.disableRotation()
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left")
    map.on("load", () => setReady(true))
    mapRef.current = map

    const timeout = window.setTimeout(() => setTimedOut(true), 12_000)
    return () => {
      window.clearTimeout(timeout)
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
    if (ready) setTimedOut(false)
  }, [ready])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return

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
  }, [lang, points, ready, selectedId])

  useEffect(() => {
    markersRef.current.forEach(({ id, element }) => {
      const active = id === selectedId
      element.classList.toggle("atlas-map-marker-active", active)
      element.setAttribute("aria-pressed", String(active))
    })

    const map = mapRef.current
    const selected = points.find((point) => point.id === selectedId)
    if (!map || !ready || !selected) return
    map.easeTo({
      center: [selected.geo.longitude, selected.geo.latitude],
      zoom: Math.max(map.getZoom(), 12.2),
      offset: [0, -64],
      duration: 520,
      essential: true,
    })
  }, [points, ready, selectedId])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return

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
  }, [currentLocation, lang, ready])

  useEffect(() => {
    const map = mapRef.current
    const selected = points.find((point) => point.id === selectedId)
    if (!map || !ready || !map.isStyleLoaded()) return

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
  }, [currentLocation, points, ready, routePreview, selectedId])

  return (
    <div className={cn("atlas-real-map absolute inset-0", heritageLayer && "atlas-real-map-heritage")}>
      <div ref={containerRef} className="absolute inset-0" aria-label={lang === "ko" ? "인터랙티브 서울 여행 지도" : "Interactive Seoul travel map"} />
      {!ready && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-[#e9e5d8]" role="status">
          <div className="rounded-full bg-[#fbfaf6]/94 px-4 py-2 text-[11px] font-semibold text-foreground shadow-sm ring-1 ring-black/5">
            {timedOut
              ? (lang === "ko" ? "지도를 불러오지 못했어요. 연결을 확인해 주세요." : "Map unavailable. Check your connection.")
              : (lang === "ko" ? "실제 지도를 불러오는 중…" : "Loading the live map…")}
          </div>
        </div>
      )}
    </div>
  )
})
