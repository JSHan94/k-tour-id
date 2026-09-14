"use client"

import { KOREA_OUTLINE_COORDINATES } from "@/lib/map/korea-atlas-data"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import styles from "./korea-memory-map-b.module.css"

export type KoreaMemoryCityB = "seoul" | "busan" | "jeju"

const COPY = {
  en: { title: "Your Korea map", item: "place", items: "places", empty: "No mapped places", cities: { seoul: "Seoul", busan: "Busan", jeju: "Jeju" } },
  ko: { title: "나의 한국 지도", item: "장소", items: "장소", empty: "표시할 장소 없음", cities: { seoul: "서울", busan: "부산", jeju: "제주" } },
  ja: { title: "わたしの韓国マップ", item: "スポット", items: "スポット", empty: "表示するスポットはありません", cities: { seoul: "ソウル", busan: "釜山", jeju: "済州" } },
} as const

const BOUNDS = { minLon: 125.55, maxLon: 130.05, minLat: 32.9, maxLat: 38.65 }
const VIEW = { width: 220, height: 230, edge: 12 }

type AtlasCoordinate = readonly [number, number]
type AtlasRing = readonly AtlasCoordinate[]
type AtlasPolygon = readonly AtlasRing[]

function project([longitude, latitude]: readonly [number, number]) {
  const x = VIEW.edge + ((longitude - BOUNDS.minLon) / (BOUNDS.maxLon - BOUNDS.minLon)) * (VIEW.width - VIEW.edge * 2)
  const y = VIEW.edge + ((BOUNDS.maxLat - latitude) / (BOUNDS.maxLat - BOUNDS.minLat)) * (VIEW.height - VIEW.edge * 2)
  return [Number(x.toFixed(2)), Number(y.toFixed(2))] as const
}

const KOREA_MEMORY_POLYGONS: readonly AtlasPolygon[] = KOREA_OUTLINE_COORDINATES

const KOREA_MEMORY_OUTLINE = KOREA_MEMORY_POLYGONS
  .flatMap((polygon) => polygon)
  .map((ring) => {
    const points = ring.length > 24
      ? ring.filter((_, index) => index % 3 === 0 || index === ring.length - 1)
      : ring
    return `${points.map((point, index) => {
      const [x, y] = project(point)
      return `${index === 0 ? "M" : "L"}${x} ${y}`
    }).join(" ")} Z`
  }).join(" ")

const CITY_POINTS: Readonly<Record<KoreaMemoryCityB, readonly [number, number]>> = {
  seoul: project([126.978, 37.5665]),
  busan: project([129.0756, 35.1796]),
  jeju: project([126.5312, 33.4996]),
}

export function KoreaMemoryMapB({ locale, cityCounts }: {
  locale: OndoBLocale
  cityCounts: Readonly<Record<KoreaMemoryCityB, number>>
}) {
  const copy = COPY[locale]
  const activeCities = (Object.keys(CITY_POINTS) as KoreaMemoryCityB[]).filter((city) => cityCounts[city] > 0)
  const itemCount = activeCities.reduce((total, city) => total + cityCounts[city], 0)
  const countLabel = itemCount === 0
    ? copy.empty
    : locale === "en"
      ? `${itemCount} ${itemCount === 1 ? copy.item : copy.items}`
      : `${itemCount}${copy.items}`
  const accessibleLabel = `${copy.title}. ${countLabel}. ${activeCities.map((city) => `${copy.cities[city]} ${cityCounts[city]}`).join(", ")}`

  return (
    <figure className={styles.memory} data-testid="my-korea-map-memory" aria-label={accessibleLabel}>
      <svg viewBox={`0 0 ${VIEW.width} ${VIEW.height}`} aria-hidden="true" focusable="false">
        <path className={styles.outline} d={KOREA_MEMORY_OUTLINE} />
        {activeCities.map((city) => {
          const [x, y] = CITY_POINTS[city]
          return <g key={city} className={styles.point} transform={`translate(${x} ${y})`} data-city={city}>
            <circle className={styles.aura} r="12" />
            <circle className={styles.core} r="4.5" />
          </g>
        })}
      </svg>
      <figcaption>
        <span><strong>{copy.title}</strong></span>
        <b>{countLabel}</b>
      </figcaption>
      <ul aria-hidden="true">
        {activeCities.map((city) => <li key={city}><i data-city={city} />{copy.cities[city]}<b>{cityCounts[city]}</b></li>)}
      </ul>
    </figure>
  )
}
