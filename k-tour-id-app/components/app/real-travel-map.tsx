"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import type {
  CircleMarker,
  LatLngExpression,
  Map as LeafletMap,
  Marker as LeafletMarker,
  Polyline,
} from "leaflet"
import type { NearbyLocation } from "@/lib/location/location-provider"
import { cn } from "@/lib/utils"

const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
const DEFAULT_CENTER: LatLngExpression = [37.5665, 126.978]

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

function markerElement(point: RealTravelMapPoint, active: boolean, lang: "ko" | "en") {
  const element = document.createElement("button")
  element.type = "button"
  element.className = cn(
    "atlas-map-marker",
    `atlas-map-marker-${point.layer}`,
    active && "atlas-map-marker-active",
  )
  element.setAttribute("aria-label", markerLabel(point, lang))
  element.setAttribute("aria-pressed", String(active))

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
  return element
}

function cameraCenterAboveSheet(map: LeafletMap, point: RealTravelMapPoint, zoom: number) {
  const markerPixel = map.project([point.geo.latitude, point.geo.longitude], zoom)
  return map.unproject(markerPixel.add([0, 70]), zoom)
}

export const RealTravelMap = forwardRef<RealTravelMapHandle, RealTravelMapProps>(function RealTravelMap(
  { points, selectedId, currentLocation, routePreview, heritageLayer, lang, onSelect, onUnavailable },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const leafletRef = useRef<typeof import("leaflet") | null>(null)
  const markersRef = useRef<LeafletMarker[]>([])
  const locationMarkerRef = useRef<CircleMarker | null>(null)
  const routeLineRef = useRef<Polyline | null>(null)
  const onSelectRef = useRef(onSelect)
  const onUnavailableRef = useRef(onUnavailable)
  const [mapStarted, setMapStarted] = useState(false)

  onSelectRef.current = onSelect
  onUnavailableRef.current = onUnavailable

  useImperativeHandle(ref, () => ({
    zoomIn: () => mapRef.current?.zoomIn(1, { animate: true }),
    zoomOut: () => mapRef.current?.zoomOut(1, { animate: true }),
    flyToLocation: (location) => {
      const map = mapRef.current
      if (!map) return
      map.flyTo(
        [location.latitude, location.longitude],
        Math.max(map.getZoom(), 13),
        { animate: true, duration: 0.5 },
      )
    },
  }), [])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let disposed = false
    let startedMap: LeafletMap | null = null
    let animationFrame: number | null = null
    let invalidateSize: (() => void) | null = null

    const startMap = async () => {
      try {
        const L = await import("leaflet")
        if (disposed || !containerRef.current) return

        const firstPoint = points.find((point) => point.id === selectedId) ?? points[0]
        const map = L.map(containerRef.current, {
          zoomControl: false,
          attributionControl: true,
          preferCanvas: false,
          zoomAnimation: true,
          fadeAnimation: true,
          markerZoomAnimation: true,
        }).setView(
          firstPoint ? [firstPoint.geo.latitude, firstPoint.geo.longitude] : DEFAULT_CENTER,
          12,
        )

        L.tileLayer(TILE_URL, {
          minZoom: 3,
          maxZoom: 19,
          maxNativeZoom: 19,
          detectRetina: false,
          crossOrigin: true,
          updateWhenIdle: true,
          keepBuffer: 2,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map)
        map.attributionControl.setPrefix(false)

        startedMap = map
        mapRef.current = map
        leafletRef.current = L
        invalidateSize = () => map.invalidateSize({ animate: false })
        animationFrame = window.requestAnimationFrame(invalidateSize)
        window.addEventListener("resize", invalidateSize)
        setMapStarted(true)
      } catch {
        if (!disposed) onUnavailableRef.current()
      }
    }

    void startMap()

    return () => {
      disposed = true
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame)
      if (invalidateSize) window.removeEventListener("resize", invalidateSize)
      markersRef.current = []
      locationMarkerRef.current = null
      routeLineRef.current = null
      startedMap?.remove()
      mapRef.current = null
      leafletRef.current = null
    }
    // The map instance owns its initial camera. Later point changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const L = leafletRef.current
    if (!map || !L || !mapStarted) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = points.map((point) => {
      const active = point.id === selectedId
      const size = active ? 46 : 38
      const icon = L.divIcon({
        className: "atlas-leaflet-icon",
        html: markerElement(point, active, lang),
        iconSize: [size, size + 7],
        iconAnchor: [size / 2, size + 7],
      })
      const marker = L.marker([point.geo.latitude, point.geo.longitude], {
        icon,
        keyboard: true,
        title: markerLabel(point, lang),
        riseOnHover: true,
        zIndexOffset: active ? 1000 : 0,
      }).addTo(map)
      marker.on("click", () => onSelectRef.current(point.id))
      return marker
    })
  }, [lang, mapStarted, points, selectedId])

  useEffect(() => {
    const map = mapRef.current
    const selected = points.find((point) => point.id === selectedId)
    if (!map || !mapStarted || !selected) return

    const zoom = Math.max(map.getZoom(), 12)
    map.flyTo(cameraCenterAboveSheet(map, selected, zoom), zoom, {
      animate: true,
      duration: 0.45,
    })
  }, [mapStarted, points, selectedId])

  useEffect(() => {
    const map = mapRef.current
    const L = leafletRef.current
    if (!map || !L || !mapStarted) return

    locationMarkerRef.current?.remove()
    locationMarkerRef.current = null
    if (!currentLocation) return

    locationMarkerRef.current = L.circleMarker(
      [currentLocation.latitude, currentLocation.longitude],
      {
        radius: 9,
        color: "#ffffff",
        weight: 4,
        fillColor: "#3478c4",
        fillOpacity: 1,
        className: "atlas-leaflet-user-marker",
      },
    ).addTo(map)
    map.flyTo(
      [currentLocation.latitude, currentLocation.longitude],
      Math.max(map.getZoom(), 13),
      { animate: true, duration: 0.5 },
    )
  }, [currentLocation, mapStarted])

  useEffect(() => {
    const map = mapRef.current
    const L = leafletRef.current
    const selected = points.find((point) => point.id === selectedId)
    if (!map || !L || !mapStarted) return

    routeLineRef.current?.remove()
    routeLineRef.current = null
    if (!routePreview || !currentLocation || !selected) return

    routeLineRef.current = L.polyline(
      [
        [currentLocation.latitude, currentLocation.longitude],
        [selected.geo.latitude, selected.geo.longitude],
      ],
      {
        color: "#263e4c",
        weight: 4,
        opacity: 0.88,
        dashArray: "7 6",
        lineCap: "round",
      },
    ).addTo(map)
  }, [currentLocation, mapStarted, points, routePreview, selectedId])

  return (
    <div className={cn("atlas-real-map absolute inset-0", heritageLayer && "atlas-real-map-heritage")}>
      <div
        ref={containerRef}
        className="absolute inset-0"
        aria-label={lang === "ko" ? "인터랙티브 서울 여행 지도" : "Interactive Seoul travel map"}
      />
    </div>
  )
})
