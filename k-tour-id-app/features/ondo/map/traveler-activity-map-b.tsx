"use client"

import type { Map as MapLibreMap } from "maplibre-gl"
import { Camera, Footprints, MessageCircle } from "lucide-react"
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"
import { sampleTravelerActivityB } from "../contracts/traveler-activity-b"
import { readSampleTemperaturePresentationB, readServerSampleTemperaturePresentationB, subscribeSampleTemperaturePresentationB } from "./sample-temperature-presentation-b"
import styles from "./traveler-activity-map-b.module.css"

const COPY = {
  en: { sample: "Sample", arrival: "A traveler checked in", photo: "A food photo was added", mood: "The atmosphere was updated", open: "Open place" },
  ko: { sample: "샘플", arrival: "여행자가 방문했어요", photo: "음식 사진이 올라왔어요", mood: "분위기가 업데이트됐어요", open: "장소 열기" },
  ja: { sample: "サンプル", arrival: "旅人がチェックイン", photo: "料理写真を追加", mood: "雰囲気を更新", open: "スポットを開く" },
} as const

/** Two tiny, coordinate-bound contribution cues, using the SAME painted sample.
 * No moving fake people, paths, user identities or claims of real photo uploads. */
export function TravelerActivityMapB({ map, locale, enabled, onSelect, placeLabel }: {
  map: MapLibreMap | null; locale: "en" | "ko" | "ja"; enabled: boolean; onSelect: (id: string) => void; placeLabel: (id: string) => string
}) {
  const snapshot = useSyncExternalStore(subscribeSampleTemperaturePresentationB, readSampleTemperaturePresentationB, readServerSampleTemperaturePresentationB)
  const nodes = useRef<Array<HTMLButtonElement | null>>([])
  const [focusedIds, setFocusedIds] = useState<string[] | null>(null)
  useEffect(() => { if (!enabled) setFocusedIds(null) }, [enabled])
  const [, setViewportRevision] = useState(0)
  useEffect(() => {
    if (!map || !enabled) return
    const refresh = () => setViewportRevision(value => value + 1)
    map.on("moveend", refresh)
    map.on("resize", refresh)
    return () => { map.off("moveend", refresh); map.off("resize", refresh) }
  }, [map, enabled])
  const copy = COPY[locale]
  const sequence = Math.floor((snapshot?.minute ?? 0) / 30)
  // Rank all points before choosing visible ones, so selection never rewrites
  // geographic coordinates or awards an official place a made-up reputation.
  const candidates = snapshot?.frame.features.filter(feature => {
    if (!map) return false
    const point = map.project(feature.geometry.coordinates as [number, number])
    const box = map.getContainer().getBoundingClientRect()
    return point.x > 42 && point.x < box.width - 42 && point.y > Math.min(260, box.height * .35) && point.y < box.height - 145
  }) ?? []
  const offset = candidates.length ? sequence % candidates.length : 0
  const first = candidates[offset]
  const second = first && map ? candidates.find(feature => {
    const a = map.project(first.geometry.coordinates as [number, number])
    const b = map.project(feature.geometry.coordinates as [number, number])
    return Math.hypot(a.x - b.x, a.y - b.y) > 90
  }) : null
  const features = focusedIds ? (snapshot?.frame.features.filter(feature => focusedIds.includes(String(feature.id))) ?? []) : first ? second ? [first, second] : [first] : []
  const signature = features.map(feature => feature.id).join(":")

  useLayoutEffect(() => {
    if (!map) return
    const position = () => features.forEach((feature, index) => {
      const node = nodes.current[index]
      if (!node) return
      const point = map.project(feature.geometry.coordinates as [number, number])
      const height = map.getContainer().clientHeight
      const width = map.getContainer().clientWidth
      // Position is not a button press transform: shell :active feedback must
      // never move this geographic hit target between pointerdown and click.
      node.style.left = `${point.x.toFixed(1)}px`
      node.style.top = `${(point.y - 26).toFixed(1)}px`
      node.style.translate = "-50% -100%"
      node.hidden = map.isMoving() || point.x < 42 || point.x > width - 42 || point.y < Math.min(260, height * .35) || point.y > height - 145
    })
    position()
    map.on("move", position)
    map.on("moveend", position)
    return () => { map.off("move", position); map.off("moveend", position) }
  }, [map, signature, enabled, sequence])

  if (!map || !snapshot || !enabled) return null
  return createPortal(<div className={styles.layer} data-testid="sample-traveler-map-events" data-origin="PREPARED_ILLUSTRATION" data-sequence={sequence}>
    {features.map((feature, index) => {
      const event = sampleTravelerActivityB(snapshot.city, String(feature.id), snapshot.minute)
      const Icon = event.kind === "photo" ? Camera : event.kind === "arrival" ? Footprints : MessageCircle
      return <button key={feature.id} ref={node => { nodes.current[index] = node }} type="button" className={styles.event} data-event-kind={event.kind} data-venue-id={feature.id} data-running={snapshot.running && !focusedIds}
        title={`${copy.sample} · ${copy[event.kind]} · ${placeLabel(String(feature.id))}`} aria-label={`${copy.sample} · ${copy[event.kind]}. ${copy.open}: ${placeLabel(String(feature.id))}`}
        onFocus={() => setFocusedIds(features.map(feature => String(feature.id)))}
        onBlur={event => { if (!event.currentTarget.parentElement?.contains(event.relatedTarget)) setFocusedIds(null) }}
        onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); onSelect(String(feature.id)) }}>
        <span className={styles.symbol}><Icon size={17} /><b>+1</b></span><small>{copy.sample}</small>
      </button>
    })}
  </div>, map.getContainer())
}
