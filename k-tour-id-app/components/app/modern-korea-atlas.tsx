"use client"

import type { CSSProperties } from "react"
import {
  KOREA_OUTLINE_COORDINATES,
  KOREA_REGIONS,
  type KoreaRegionId,
} from "@/lib/map/korea-atlas-data"
import { cn } from "@/lib/utils"

const WIDTH = 300
const HEIGHT = 410
const BOUNDS = {
  minLongitude: 125.72,
  maxLongitude: 129.72,
  minLatitude: 33.02,
  maxLatitude: 38.62,
}

type AtlasDot = {
  id: string
  x: number
  y: number
  regionId: KoreaRegionId
  signal: boolean
}

function project(longitude: number, latitude: number) {
  return {
    x: 24 + ((longitude - BOUNDS.minLongitude) / (BOUNDS.maxLongitude - BOUNDS.minLongitude)) * 252,
    y: 20 + ((BOUNDS.maxLatitude - latitude) / (BOUNDS.maxLatitude - BOUNDS.minLatitude)) * 360,
  }
}

function pointInRing(longitude: number, latitude: number, ring: readonly (readonly [number, number])[]) {
  let inside = false
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const [x, y] = ring[index]
    const [previousX, previousY] = ring[previous]
    const crosses = ((y > latitude) !== (previousY > latitude))
      && (longitude < ((previousX - x) * (latitude - y)) / (previousY - y) + x)
    if (crosses) inside = !inside
  }
  return inside
}

function pointInKorea(longitude: number, latitude: number) {
  return KOREA_OUTLINE_COORDINATES.some((polygon) =>
    polygon.some((ring) => pointInRing(longitude, latitude, ring)),
  )
}

function regionForPoint(longitude: number, latitude: number) {
  return KOREA_REGIONS.reduce((nearest, region) => {
    const distance = ((latitude - region.center[0]) ** 2) + ((longitude - region.center[1]) ** 2)
    return distance < nearest.distance ? { id: region.id, distance } : nearest
  }, { id: "capital" as KoreaRegionId, distance: Number.POSITIVE_INFINITY }).id
}

const DOTS: AtlasDot[] = (() => {
  const dots: AtlasDot[] = []
  let row = 0
  for (let y = 24; y <= 379; y += 7.25) {
    const offset = row % 2 === 0 ? 0 : 3.625
    for (let x = 25 + offset; x <= 276; x += 7.25) {
      const longitude = BOUNDS.minLongitude
        + ((x - 24) / 252) * (BOUNDS.maxLongitude - BOUNDS.minLongitude)
      const latitude = BOUNDS.maxLatitude
        - ((y - 20) / 360) * (BOUNDS.maxLatitude - BOUNDS.minLatitude)
      if (!pointInKorea(longitude, latitude)) continue
      const regionId = regionForPoint(longitude, latitude)
      dots.push({
        id: `${row}-${Math.round(x * 10)}`,
        x,
        y,
        regionId,
        signal: (row + Math.round(x)) % 6 === 0,
      })
    }
    row += 1
  }
  return dots
})()

const REGION_LABEL_OFFSET: Record<KoreaRegionId, { x: number; y: number }> = {
  capital: { x: -34, y: -6 },
  gangwon: { x: 28, y: -4 },
  jeonju: { x: -42, y: 6 },
  gyeongju: { x: 36, y: -2 },
  busan: { x: 44, y: 17 },
  jeju: { x: -2, y: 22 },
}

function shortRegionName(regionId: KoreaRegionId, lang: "ko" | "en") {
  const names: Record<KoreaRegionId, { ko: string; en: string }> = {
    capital: { ko: "서울", en: "Seoul" },
    gangwon: { ko: "강원", en: "Gangwon" },
    jeonju: { ko: "전주", en: "Jeonju" },
    gyeongju: { ko: "경주", en: "Gyeongju" },
    busan: { ko: "부산", en: "Busan" },
    jeju: { ko: "제주", en: "Jeju" },
  }
  return names[regionId][lang]
}

export function ModernKoreaAtlas({
  lang,
  variant = "discover",
  regionCounts,
  visitedRegionIds = [],
  currentRegionId,
  compact = false,
  onRegionSelect,
  className,
}: {
  lang: "ko" | "en"
  variant?: "discover" | "footprint"
  regionCounts?: Partial<Record<KoreaRegionId, number>>
  visitedRegionIds?: KoreaRegionId[]
  currentRegionId?: KoreaRegionId
  compact?: boolean
  onRegionSelect?: (regionId: KoreaRegionId) => void
  className?: string
}) {
  const visited = new Set(visitedRegionIds)
  const label = variant === "discover"
    ? (lang === "ko" ? "대한민국 여행 권역 지도" : "Travel regions of Korea")
    : (lang === "ko" ? "나의 대한민국 발자취" : "My footprints across Korea")

  return (
    <div className={cn("modern-korea-atlas", compact && "modern-korea-atlas-compact", className)}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={label}>
        <g className="modern-atlas-dots">
          {DOTS.map((dot) => {
            const discovered = visited.has(dot.regionId)
            const current = currentRegionId === dot.regionId
            const hasChoices = (regionCounts?.[dot.regionId] ?? 0) > 0
            return (
              <circle
                key={dot.id}
                cx={dot.x}
                cy={dot.y}
                r={compact ? 2.4 : 2.55}
                className={cn(
                  "modern-atlas-dot",
                  discovered && "modern-atlas-dot-visited",
                  current && dot.signal && "modern-atlas-dot-current",
                  variant === "discover" && hasChoices && dot.signal && "modern-atlas-dot-choice",
                )}
              />
            )
          })}
          <circle cx="284" cy="92" r="2.5" className="modern-atlas-dot modern-atlas-dot-island" />
          <circle cx="292" cy="82" r="1.8" className="modern-atlas-dot modern-atlas-dot-island" />
        </g>
      </svg>

      {variant === "discover" && KOREA_REGIONS.map((region) => {
        const point = project(region.labelCenter[1], region.labelCenter[0])
        const offset = REGION_LABEL_OFFSET[region.id]
        const count = regionCounts?.[region.id] ?? 0
        const style = {
          "--atlas-label-x": `${((point.x + offset.x) / WIDTH) * 100}%`,
          "--atlas-label-y": `${((point.y + offset.y) / HEIGHT) * 100}%`,
        } as CSSProperties
        return (
          <button
            key={region.id}
            type="button"
            style={style}
            onClick={() => onRegionSelect?.(region.id)}
            className="modern-atlas-region pressable"
            aria-label={`${region.name[lang]}, ${count}${lang === "ko" ? "개 여행 선택" : " travel choices"}`}
          >
            <span>{shortRegionName(region.id, lang)}</span>
            <small>{count}</small>
          </button>
        )
      })}
    </div>
  )
}
