"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import type { CSSProperties } from "react"
import type {
  CircleMarker,
  LatLngExpression,
  Map as LeafletMap,
  Marker as LeafletMarker,
  Path,
  Polyline,
} from "leaflet"
import {
  DOKDO_COORDINATE,
  HERITAGE_MOUNTAIN_PATHS,
  HERITAGE_WATER_PATHS,
  KOREA_LIMIT_BOUNDS,
  KOREA_OUTLINE_COORDINATES,
  KOREA_OVERVIEW_BOUNDS,
  KOREA_REGIONS,
  type KoreaRegion,
  type KoreaRegionId,
} from "@/lib/map/korea-atlas-data"
import type { NearbyLocation } from "@/lib/location/location-provider"
import { cn } from "@/lib/utils"

const DEFAULT_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
const TILE_URL = process.env.NEXT_PUBLIC_KTOUR_TILE_URL ?? DEFAULT_TILE_URL
const TILE_ATTRIBUTION = process.env.NEXT_PUBLIC_KTOUR_TILE_ATTRIBUTION
  ?? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
const DEFAULT_CENTER: LatLngExpression = [36.15, 127.85]

const WORLD_RING: [number, number][] = [
  [-85, -180],
  [85, -180],
  [85, 180],
  [-85, 180],
  [-85, -180],
]

const KOREA_RINGS: [number, number][][] = KOREA_OUTLINE_COORDINATES.map((polygon) =>
  polygon[0].map(([longitude, latitude]) => [latitude, longitude]),
)
const KOREA_LIMITS: [[number, number], [number, number]] = [
  [...KOREA_LIMIT_BOUNDS[0]],
  [...KOREA_LIMIT_BOUNDS[1]],
]
const KOREA_OVERVIEW: [[number, number], [number, number]] = [
  [...KOREA_OVERVIEW_BOUNDS[0]],
  [...KOREA_OVERVIEW_BOUNDS[1]],
]

type PointLayer = "experience" | "food" | "mobility" | "essentials" | "together"
export type MapViewLevel = "nation" | "region" | "place"

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
  showKorea: () => void
  showRegion: (regionId: KoreaRegionId) => void
  flyToLocation: (location: Pick<NearbyLocation, "latitude" | "longitude">) => void
}

interface RealTravelMapProps {
  points: RealTravelMapPoint[]
  selectedId?: string
  focusToken: number
  regionCounts: Record<KoreaRegionId, number>
  currentLocation: NearbyLocation | null
  routePreview: boolean
  heritageLayer: boolean
  topChromeHeight: number
  bottomChromeHeight: number
  lang: "ko" | "en"
  onSelect: (id: string) => void
  onViewLevelChange: (level: MapViewLevel, regionId?: KoreaRegionId) => void
  onUnavailable: () => void
}

const MARKER_SYMBOLS: Record<"ko" | "en", Record<PointLayer, string>> = {
  ko: { experience: "볼", food: "맛", mobility: "길", essentials: "필", together: "함" },
  en: { experience: "DO", food: "EAT", mobility: "GO", essentials: "KIT", together: "MEET" },
}

function markerLabel(point: RealTravelMapPoint, lang: "ko" | "en") {
  const category = {
    experience: lang === "ko" ? "할 거리" : "Things to do",
    food: lang === "ko" ? "먹기" : "Eat",
    mobility: lang === "ko" ? "이동" : "Move",
    essentials: lang === "ko" ? "필수품" : "Essentials",
    together: lang === "ko" ? "액티비티로 친구 만나기" : "Meet through activities",
  }[point.layer]
  const benefit = point.benefitLabel ? (lang === "ko" ? ", 혜택 있음" : ", benefit available") : ""
  return `${category}, ${point.title}, ${point.subtitle}${benefit}`
}

function markerElement(point: RealTravelMapPoint, active: boolean, lang: "ko" | "en") {
  const element = document.createElement("span")
  element.className = cn(
    "atlas-map-marker",
    `atlas-map-marker-${point.layer}`,
    lang === "en" && "atlas-map-marker-en",
    active && "atlas-map-marker-active",
  )
  element.setAttribute("aria-hidden", "true")

  const glyph = document.createElement("span")
  glyph.className = "atlas-map-marker-glyph"
  glyph.textContent = MARKER_SYMBOLS[lang][point.layer]
  element.appendChild(glyph)

  if (point.benefitLabel) {
    const benefit = document.createElement("span")
    benefit.className = "atlas-map-marker-benefit"
    benefit.textContent = lang === "ko" ? "혜" : "%"
    benefit.setAttribute("aria-hidden", "true")
    element.appendChild(benefit)
  }
  return element
}

function clusterElement(count: number, lang: "ko" | "en") {
  const element = document.createElement("span")
  element.className = "atlas-map-cluster"
  element.setAttribute("aria-hidden", "true")
  const value = document.createElement("strong")
  value.textContent = String(count)
  element.appendChild(value)
  const label = document.createElement("span")
  label.textContent = lang === "ko" ? "여행 선택" : "PLACES"
  element.appendChild(label)
  return element
}

function pointInRegion(point: RealTravelMapPoint, region: KoreaRegion) {
  const [[south, west], [north, east]] = region.bounds
  return point.geo.latitude >= south && point.geo.latitude <= north
    && point.geo.longitude >= west && point.geo.longitude <= east
}

function closestRegion(center: { lat: number; lng: number }) {
  return KOREA_REGIONS.reduce((closest, region) => {
    const distance = ((center.lat - region.center[0]) ** 2) + ((center.lng - region.center[1]) ** 2)
    return distance < closest.distance ? { region, distance } : closest
  }, { region: KOREA_REGIONS[0], distance: Number.POSITIVE_INFINITY }).region
}

function regionElement(region: KoreaRegion, count: number, level: MapViewLevel, lang: "ko" | "en") {
  const element = document.createElement("span")
  element.className = cn("atlas-region-marker", `atlas-region-marker-${level}`)
  element.setAttribute("aria-hidden", "true")

  const name = document.createElement("strong")
  name.textContent = region.name[lang]
  element.appendChild(name)

  const detail = document.createElement("span")
  detail.textContent = level === "nation"
    ? `${count}${lang === "ko" ? "곳" : ""} · ${region.hook[lang]}`
    : lang === "ko" ? `${count}개 여행 선택` : `${count} travel choices`
  element.appendChild(detail)
  return element
}

function viewLevelForZoom(zoom: number): MapViewLevel {
  if (zoom < 8.5) return "nation"
  if (zoom < 10.5) return "region"
  return "place"
}

function isInsideKoreaLimit(location: Pick<NearbyLocation, "latitude" | "longitude">) {
  const insideOutline = KOREA_RINGS.some((ring) => {
    let inside = false
    for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
      const [latitude, longitude] = ring[index]
      const [previousLatitude, previousLongitude] = ring[previous]
      const crosses = ((latitude > location.latitude) !== (previousLatitude > location.latitude))
        && (location.longitude < ((previousLongitude - longitude) * (location.latitude - latitude))
          / (previousLatitude - latitude) + longitude)
      if (crosses) inside = !inside
    }
    return inside
  })
  if (insideOutline) return true
  return Math.hypot(
    location.latitude - DOKDO_COORDINATE[0],
    location.longitude - DOKDO_COORDINATE[1],
  ) < 0.06
}

function cameraCenterForChrome(
  map: LeafletMap,
  point: RealTravelMapPoint,
  zoom: number,
  topChromeHeight: number,
  bottomChromeHeight: number,
) {
  const markerPixel = map.project([point.geo.latitude, point.geo.longitude], zoom)
  const topChrome = Math.max(160, topChromeHeight)
  const bottomChrome = Math.min(map.getSize().y * 0.62, Math.max(160, bottomChromeHeight))
  return map.unproject(markerPixel.add([0, (bottomChrome - topChrome) / 2]), zoom)
}

function prefersReducedMotion() {
  return typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export const RealTravelMap = forwardRef<RealTravelMapHandle, RealTravelMapProps>(function RealTravelMap(
  {
    points,
    selectedId,
    focusToken,
    regionCounts,
    currentLocation,
    routePreview,
    heritageLayer,
    topChromeHeight,
    bottomChromeHeight,
    lang,
    onSelect,
    onViewLevelChange,
    onUnavailable,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const leafletRef = useRef<typeof import("leaflet") | null>(null)
  const pointMarkersRef = useRef<LeafletMarker[]>([])
  const regionMarkersRef = useRef<LeafletMarker[]>([])
  const connectorLinesRef = useRef<Polyline[]>([])
  const locationMarkerRef = useRef<CircleMarker | null>(null)
  const routeLineRef = useRef<Polyline | null>(null)
  const heritagePathsRef = useRef<{ mountains: Path[]; water: Path[]; coast: Path[] }>({
    mountains: [],
    water: [],
    coast: [],
  })
  const onSelectRef = useRef(onSelect)
  const onUnavailableRef = useRef(onUnavailable)
  const onViewLevelChangeRef = useRef(onViewLevelChange)
  const activeRegionRef = useRef<KoreaRegionId | undefined>(undefined)
  const pendingRegionIdRef = useRef<KoreaRegionId | undefined>(undefined)
  const chromeInsetsRef = useRef({ top: topChromeHeight, bottom: bottomChromeHeight })
  const [mapStarted, setMapStarted] = useState(false)
  const [viewLevel, setViewLevel] = useState<MapViewLevel>("nation")
  const [viewZoom, setViewZoom] = useState(7)
  const [viewRegionId, setViewRegionId] = useState<KoreaRegionId | undefined>()

  onSelectRef.current = onSelect
  onUnavailableRef.current = onUnavailable
  onViewLevelChangeRef.current = onViewLevelChange
  chromeInsetsRef.current = { top: topChromeHeight, bottom: bottomChromeHeight }

  const showKorea = (map: LeafletMap) => {
    pendingRegionIdRef.current = undefined
    activeRegionRef.current = undefined
    setViewLevel("nation")
    setViewRegionId(undefined)
    onViewLevelChangeRef.current("nation")
    map.fitBounds(KOREA_OVERVIEW, {
      animate: !prefersReducedMotion(),
      duration: 0.48,
      paddingTopLeft: [18, Math.max(188, chromeInsetsRef.current.top)],
      paddingBottomRight: [76, Math.max(172, chromeInsetsRef.current.bottom)],
    })
  }

  const showRegion = (map: LeafletMap, region: KoreaRegion) => {
    pendingRegionIdRef.current = region.id
    activeRegionRef.current = region.id
    setViewLevel("region")
    setViewRegionId(region.id)
    onViewLevelChangeRef.current("region", region.id)
    const center: [number, number] = [...region.center]
    if (prefersReducedMotion()) map.setView(center, 9)
    else map.flyTo(center, 9, { animate: true, duration: 0.45 })
  }

  useImperativeHandle(ref, () => ({
    zoomIn: () => mapRef.current?.zoomIn(0.5, { animate: !prefersReducedMotion() }),
    zoomOut: () => mapRef.current?.zoomOut(0.5, { animate: !prefersReducedMotion() }),
    showKorea: () => {
      if (mapRef.current) showKorea(mapRef.current)
      else pendingRegionIdRef.current = undefined
    },
    showRegion: (regionId) => {
      const region = KOREA_REGIONS.find((candidate) => candidate.id === regionId)
      pendingRegionIdRef.current = regionId
      if (mapRef.current && region) showRegion(mapRef.current, region)
    },
    flyToLocation: (location) => {
      const map = mapRef.current
      if (!map) return
      if (!isInsideKoreaLimit(location)) {
        showKorea(map)
        return
      }
      if (prefersReducedMotion()) map.setView([location.latitude, location.longitude], Math.max(map.getZoom(), 12))
      else map.flyTo(
        [location.latitude, location.longitude],
        Math.max(map.getZoom(), 12),
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
    let tileWatchdog: number | null = null

    const startMap = async () => {
      try {
        const L = await import("leaflet")
        if (disposed || !containerRef.current) return

        const limitBounds = L.latLngBounds(KOREA_LIMITS[0], KOREA_LIMITS[1])
        const map = L.map(containerRef.current, {
          center: DEFAULT_CENTER,
          zoom: 7,
          zoomControl: false,
          attributionControl: true,
          preferCanvas: false,
          zoomAnimation: !prefersReducedMotion(),
          fadeAnimation: !prefersReducedMotion(),
          markerZoomAnimation: !prefersReducedMotion(),
          zoomSnap: 0.5,
          zoomDelta: 0.5,
          minZoom: 6,
          maxZoom: 19,
          maxBounds: limitBounds,
          maxBoundsViscosity: 1,
          worldCopyJump: false,
        })

        const maskPane = map.createPane("atlasMaskPane")
        maskPane.style.zIndex = "250"
        const terrainPane = map.createPane("atlasTerrainPane")
        terrainPane.style.zIndex = "350"
        terrainPane.style.pointerEvents = "none"
        const coastPane = map.createPane("atlasCoastPane")
        coastPane.style.zIndex = "360"
        coastPane.style.pointerEvents = "none"

        const tileLayer = L.tileLayer(TILE_URL, {
          minZoom: 6,
          maxZoom: 19,
          maxNativeZoom: 19,
          detectRetina: false,
          updateWhenIdle: true,
          keepBuffer: 2,
          noWrap: true,
          bounds: limitBounds,
          attribution: TILE_ATTRIBUTION,
        })

        let requestedTileCount = 0
        let loadedTileCount = 0
        let settledTileCount = 0
        let failedTileCount = 0
        let reportedFailure = false
        const startTileWatchdog = () => {
          requestedTileCount = 0
          loadedTileCount = 0
          settledTileCount = 0
          failedTileCount = 0
          reportedFailure = false
          if (tileWatchdog !== null) window.clearTimeout(tileWatchdog)
          tileWatchdog = window.setTimeout(() => {
            if (!reportedFailure && requestedTileCount > 0 && loadedTileCount === 0) {
              reportedFailure = true
              onUnavailableRef.current()
            }
          }, 8_000)
        }
        tileLayer.on("loading", startTileWatchdog)
        tileLayer.on("tileloadstart", () => {
          requestedTileCount += 1
        })
        tileLayer.on("tileload", () => {
          loadedTileCount += 1
          settledTileCount += 1
          reportedFailure = false
          if (settledTileCount >= requestedTileCount && tileWatchdog !== null) {
            window.clearTimeout(tileWatchdog)
            tileWatchdog = null
          }
        })
        tileLayer.on("tileerror", () => {
          settledTileCount += 1
          failedTileCount += 1
          if (
            !reportedFailure
            && requestedTileCount > 0
            && settledTileCount >= requestedTileCount
            && failedTileCount === requestedTileCount
          ) {
            reportedFailure = true
            onUnavailableRef.current()
          }
        })
        startTileWatchdog()
        tileLayer.addTo(map)

        L.polygon([WORLD_RING, ...KOREA_RINGS], {
          pane: "atlasMaskPane",
          interactive: false,
          stroke: false,
          fillColor: "#e8e1d3",
          fillOpacity: 0.965,
          fillRule: "evenodd",
          className: "atlas-korea-mask",
        }).addTo(map)

        heritagePathsRef.current.coast = KOREA_RINGS.map((ring, index) =>
          L.polygon(ring, {
            pane: "atlasCoastPane",
            interactive: false,
            color: "#2d2b23",
            opacity: 0.84,
            weight: index === 0 ? 2.4 : 1.4,
            fillColor: "#efe6d2",
            fillOpacity: 0.16,
            className: "atlas-korea-coast",
          }).addTo(map),
        )
        heritagePathsRef.current.coast.push(L.circle([...DOKDO_COORDINATE] as [number, number], {
          pane: "atlasCoastPane",
          interactive: false,
          radius: 1100,
          color: "#2d2b23",
          opacity: 0.84,
          weight: 1.2,
          fillColor: "#efe6d2",
          fillOpacity: 0.92,
          className: "atlas-korea-coast",
        }).addTo(map))

        heritagePathsRef.current.mountains = HERITAGE_MOUNTAIN_PATHS.map((path) =>
          L.polyline(path.map(([latitude, longitude]) => [latitude, longitude]), {
            pane: "atlasTerrainPane",
            interactive: false,
            color: "#68705b",
            opacity: 0.58,
            weight: 5,
            lineCap: "round",
            lineJoin: "round",
            className: "atlas-heritage-mountain",
          }).addTo(map),
        )

        heritagePathsRef.current.water = HERITAGE_WATER_PATHS.map((path) =>
          L.polyline(path.map(([latitude, longitude]) => [latitude, longitude]), {
            pane: "atlasTerrainPane",
            interactive: false,
            color: "#6d8790",
            opacity: 0.76,
            weight: 2.4,
            lineCap: "round",
            lineJoin: "round",
            className: "atlas-heritage-water",
          }).addTo(map),
        )

        map.attributionControl.setPrefix(false)
        map.attributionControl.addAttribution(
          '<a href="https://www.naturalearthdata.com/">Boundary: Natural Earth</a>',
        )

        const updateViewLevel = () => {
          const nextLevel = viewLevelForZoom(map.getZoom())
          const nextRegion = nextLevel === "nation"
            ? undefined
            : activeRegionRef.current ?? closestRegion(map.getCenter()).id
          activeRegionRef.current = nextRegion
          setViewLevel(nextLevel)
          setViewZoom(map.getZoom())
          setViewRegionId(nextRegion)
          onViewLevelChangeRef.current(nextLevel, nextRegion)
        }

        map.on("zoomend", updateViewLevel)
        const requestedRegion = KOREA_REGIONS.find((region) => region.id === pendingRegionIdRef.current)
        if (requestedRegion) showRegion(map, requestedRegion)
        else showKorea(map)
        updateViewLevel()

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
      if (tileWatchdog !== null) window.clearTimeout(tileWatchdog)
      if (invalidateSize) window.removeEventListener("resize", invalidateSize)
      pointMarkersRef.current = []
      regionMarkersRef.current = []
      connectorLinesRef.current = []
      locationMarkerRef.current = null
      routeLineRef.current = null
      heritagePathsRef.current = { mountains: [], water: [], coast: [] }
      startedMap?.remove()
      mapRef.current = null
      leafletRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapStarted) return

    const terrainVisible = heritageLayer && viewLevel !== "place"
    heritagePathsRef.current.mountains.forEach((path) => path.setStyle({
      opacity: terrainVisible ? (viewLevel === "nation" ? 0.62 : 0.28) : 0,
      weight: viewLevel === "nation" ? 5 : 3,
    }))
    heritagePathsRef.current.water.forEach((path) => path.setStyle({
      opacity: terrainVisible ? (viewLevel === "nation" ? 0.8 : 0.42) : 0,
      weight: viewLevel === "nation" ? 2.4 : 1.7,
    }))
    heritagePathsRef.current.coast.forEach((path) => path.setStyle({
      opacity: heritageLayer ? 0.88 : 0.5,
      fillOpacity: heritageLayer && viewLevel === "nation" ? 0.18 : 0,
    }))
  }, [heritageLayer, mapStarted, viewLevel])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapStarted || viewLevel !== "nation") return
    const frame = window.requestAnimationFrame(() => showKorea(map))
    return () => window.cancelAnimationFrame(frame)
  }, [bottomChromeHeight, mapStarted, topChromeHeight, viewLevel])

  useEffect(() => {
    const map = mapRef.current
    const L = leafletRef.current
    if (!map || !L || !mapStarted) return

    pointMarkersRef.current.forEach((marker) => marker.remove())
    regionMarkersRef.current.forEach((marker) => marker.remove())
    connectorLinesRef.current.forEach((line) => line.remove())
    pointMarkersRef.current = []
    regionMarkersRef.current = []
    connectorLinesRef.current = []

    if (viewLevel === "nation") {
      regionMarkersRef.current = KOREA_REGIONS.map((region) => {
        const count = regionCounts[region.id] ?? points.filter((point) => pointInRegion(point, region)).length
        const label = `${region.name[lang]}, ${region.hook[lang]}, ${count}${lang === "ko" ? "개 선택" : " choices"}`
        const width = 112
        const icon = L.divIcon({
          className: "atlas-leaflet-region-icon",
          html: regionElement(region, count, viewLevel, lang),
          iconSize: [width, 68],
          iconAnchor: [width / 2, 34],
        })
        const markerPosition = viewLevel === "nation" ? region.labelCenter : region.center
        connectorLinesRef.current.push(L.polyline([
          [...region.center] as [number, number],
          [...region.labelCenter] as [number, number],
        ], {
          pane: "atlasTerrainPane",
          interactive: false,
          color: "#4b493e",
          opacity: 0.42,
          weight: 1.2,
          className: "atlas-region-leader",
        }).addTo(map))
        const marker = L.marker([...markerPosition] as [number, number], {
          icon,
          keyboard: true,
          title: label,
          alt: label,
          riseOnHover: true,
        }).addTo(map)
        marker.on("click", () => showRegion(map, region))
        return marker
      })
      return
    }

    if (viewLevel === "region") {
      if (points.length === 0) return
      const center: [number, number] = [
        points.reduce((sum, point) => sum + point.geo.latitude, 0) / points.length,
        points.reduce((sum, point) => sum + point.geo.longitude, 0) / points.length,
      ]
      const label = lang === "ko" ? `${points.length}개 여행 선택, 확대해서 장소 보기` : `${points.length} travel choices, zoom in to see places`
      const icon = L.divIcon({
        className: "atlas-leaflet-cluster-icon",
        html: clusterElement(points.length, lang),
        iconSize: [64, 64],
        iconAnchor: [32, 32],
      })
      const marker = L.marker(center, {
        icon,
        keyboard: true,
        title: label,
        alt: label,
        riseOnHover: true,
      }).addTo(map)
      marker.on("click", () => {
        if (prefersReducedMotion()) map.setView(center, 11)
        else map.flyTo(center, 11, { animate: true, duration: 0.45 })
      })
      pointMarkersRef.current = [marker]
      return
    }

    const coordinateGroups: Array<{
      center: { x: number; y: number }
      points: RealTravelMapPoint[]
    }> = []
    points.forEach((point) => {
      const pixel = map.project([point.geo.latitude, point.geo.longitude], viewZoom)
      const nearbyGroup = coordinateGroups.find((group) => (
        Math.hypot(pixel.x - group.center.x, pixel.y - group.center.y) < 52
      ))
      if (!nearbyGroup) {
        coordinateGroups.push({ center: { x: pixel.x, y: pixel.y }, points: [point] })
        return
      }
      const nextCount = nearbyGroup.points.length + 1
      nearbyGroup.center = {
        x: ((nearbyGroup.center.x * nearbyGroup.points.length) + pixel.x) / nextCount,
        y: ((nearbyGroup.center.y * nearbyGroup.points.length) + pixel.y) / nextCount,
      }
      nearbyGroup.points.push(point)
    })

    const markerPositions = new Map<string, [number, number]>()
    coordinateGroups.forEach((group) => {
      if (group.points.length === 1) {
        const point = group.points[0]
        markerPositions.set(point.id, [point.geo.latitude, point.geo.longitude])
        return
      }
      const spreadRadius = Math.max(34, (group.points.length * 50) / (Math.PI * 2))
      group.points.forEach((point, index) => {
        const angle = (-Math.PI / 2) + ((Math.PI * 2 * index) / group.points.length)
        const shifted = map.unproject([
          group.center.x + (Math.cos(angle) * spreadRadius),
          group.center.y + (Math.sin(angle) * spreadRadius),
        ], viewZoom)
        const position: [number, number] = [shifted.lat, shifted.lng]
        markerPositions.set(point.id, position)
        connectorLinesRef.current.push(L.polyline([
          [point.geo.latitude, point.geo.longitude],
          position,
        ], {
          pane: "atlasTerrainPane",
          interactive: false,
          color: "#625e50",
          opacity: 0.4,
          weight: 1.2,
          className: "atlas-marker-connector",
        }).addTo(map))
      })
    })

    pointMarkersRef.current = points.map((point) => {
      const active = point.id === selectedId
      const touchSize = active ? 48 : 44
      const icon = L.divIcon({
        className: "atlas-leaflet-icon",
        html: markerElement(point, active, lang),
        iconSize: [touchSize, touchSize + 7],
        iconAnchor: [touchSize / 2, touchSize + 7],
      })
      const label = markerLabel(point, lang)
      const marker = L.marker(markerPositions.get(point.id) ?? [point.geo.latitude, point.geo.longitude], {
        icon,
        keyboard: true,
        title: label,
        alt: label,
        riseOnHover: true,
        zIndexOffset: active ? 1000 : 0,
      }).addTo(map)
      marker.on("click", () => onSelectRef.current(point.id))
      return marker
    })
  }, [lang, mapStarted, points, regionCounts, selectedId, viewLevel, viewRegionId, viewZoom])

  useEffect(() => {
    const map = mapRef.current
    const selected = points.find((point) => point.id === selectedId)
    if (!map || !mapStarted || !selected || focusToken === 0) return

    const zoom = Math.max(map.getZoom(), 12)
    const center = cameraCenterForChrome(
      map,
      selected,
      zoom,
      topChromeHeight,
      bottomChromeHeight,
    )
    if (prefersReducedMotion()) map.setView(center, zoom)
    else map.flyTo(center, zoom, { animate: true, duration: 0.45 })
  }, [bottomChromeHeight, focusToken, mapStarted, points, selectedId, topChromeHeight])

  useEffect(() => {
    const map = mapRef.current
    const L = leafletRef.current
    if (!map || !L || !mapStarted) return

    locationMarkerRef.current?.remove()
    locationMarkerRef.current = null
    if (!currentLocation || !isInsideKoreaLimit(currentLocation)) return

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
  }, [currentLocation, mapStarted])

  useEffect(() => {
    const map = mapRef.current
    const L = leafletRef.current
    const selected = points.find((point) => point.id === selectedId)
    if (!map || !L || !mapStarted) return

    routeLineRef.current?.remove()
    routeLineRef.current = null
    if (!routePreview || !currentLocation || !selected || !isInsideKoreaLimit(currentLocation)) return

    routeLineRef.current = L.polyline(
      [
        [currentLocation.latitude, currentLocation.longitude],
        [selected.geo.latitude, selected.geo.longitude],
      ],
      {
        color: "#263e4c",
        weight: 3,
        opacity: 0.74,
        dashArray: "3 8",
        lineCap: "round",
        className: "atlas-distance-line",
      },
    ).addTo(map)
  }, [currentLocation, mapStarted, points, routePreview, selectedId])

  return (
    <div
      className={cn(
        "atlas-real-map absolute inset-0",
        `atlas-real-map-${viewLevel}`,
        heritageLayer && "atlas-real-map-heritage",
      )}
      style={{ "--atlas-top-chrome": `${topChromeHeight}px` } as CSSProperties}
    >
      <div
        ref={containerRef}
        className="absolute inset-0"
        aria-label={lang === "ko" ? "대한민국 인터랙티브 여행지도" : "Interactive travel map of South Korea"}
      />
    </div>
  )
})
