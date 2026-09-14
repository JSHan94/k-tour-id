"use client"

import type { ExpressionSpecification, GeoJSONSource, HeatmapLayerSpecification, Map as MapLibreMap, MapLayerMouseEvent } from "maplibre-gl"
import { Pause, Play, SkipForward } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  advanceTemperatureSample, canRunTemperatureSample, createTemperatureSampleBlend, createTemperatureSampleFrame, normalizeTemperatureSampleMinute,
  TEMPERATURE_SAMPLE_COLOR_STOPS, TEMPERATURE_SAMPLE_NIGHT_COLOR_STOPS,
  TEMPERATURE_SAMPLE_DISSOLVE_MS,
  TEMPERATURE_SAMPLE_END_MINUTE, TEMPERATURE_SAMPLE_INITIAL_MINUTE,
  TEMPERATURE_SAMPLE_START_MINUTE, TEMPERATURE_SAMPLE_TICK_MS,
  temperatureSampleTimeLabel, type TemperatureSampleCity, type TemperatureSampleDirection, type TemperatureSamplePoint,
} from "../contracts/temperature-timeline"
import { clearSampleTemperaturePresentationB, publishSampleTemperaturePresentationB } from "./sample-temperature-presentation-b"
import styles from "./temperature-timeline-b.module.css"

const SOURCE_ID = "ondo-sample-temperature"
const LAYER_ID = "ondo-sample-temperature-field"
const BLEND_LAYER_ID = "ondo-sample-temperature-blend"
const HALO_IDS = ["ondo-sample-temperature-aura", "ondo-sample-temperature-aura-blend"] as const
const CORE_IDS = ["ondo-sample-temperature-core", "ondo-sample-temperature-core-blend"] as const
const HIT_ID = "ondo-sample-temperature-hit"
const FIELD_OPACITY: ExpressionSpecification = ["interpolate", ["linear"], ["zoom"], 8, .38, 11, .57, 15, .52]
const COPY = {
  en: { sample: "Sample", control: "Sample temperature timeline", pause: "Pause sample evening", play: "Play sample evening", step: "Next sample time", time: "Sample time, Korea time", title: "An evening in motion", note: "A prepared evening, replayed forward and back. Not live visitor counts or place ratings.", jeju: "Jeju’s editorial coverage stays separate from this illustration." },
  ko: { sample: "샘플", control: "샘플 온도 타임라인", pause: "샘플 저녁 일시정지", play: "샘플 저녁 재생", step: "다음 샘플 시간", time: "샘플 시간, 한국 시간", title: "저녁의 흐름", note: "준비된 저녁을 앞뒤로 재생해요. 실시간 방문자 수나 장소 평점은 아니에요.", jeju: "제주의 에디토리얼 분포와는 별개인 예시예요." },
  ja: { sample: "サンプル", control: "サンプル温度タイムライン", pause: "サンプルの夜を一時停止", play: "サンプルの夜を再生", step: "次のサンプル時刻", time: "サンプル時刻、韓国時間", title: "夜の移り変わり", note: "用意された夜を前後に再生します。実際の来客数や店舗評価ではありません。", jeju: "済州の編集スポット分布とは別のイメージです。" },
} as const

const SAMPLE_HEAT: ExpressionSpecification = [
  "interpolate", ["linear"], ["heatmap-density"],
  0, "rgba(241,174,67,0)", .16, "rgba(244,187,73,.18)",
  .36, "rgba(249,142,64,.46)", .58, "rgba(242,91,91,.7)",
  .8, "rgba(218,53,119,.84)", 1, "rgba(169,35,113,.94)",
]
const AFTER19_SAMPLE_HEAT: ExpressionSpecification = [
  "interpolate", ["linear"], ["heatmap-density"],
  0, "rgba(255,193,98,0)", .18, "rgba(255,191,105,.3)",
  .4, "rgba(255,143,70,.55)", .65, "rgba(255,89,125,.74)",
  .84, "rgba(235,55,143,.86)", 1, "rgba(255,142,183,.94)",
]

function coreColor(weight: "sampleWeight" | "sampleBlendWeight", after19: boolean): ExpressionSpecification {
  return ["interpolate", ["linear"], ["get", weight], ...(after19 ? TEMPERATURE_SAMPLE_NIGHT_COLOR_STOPS : TEMPERATURE_SAMPLE_COLOR_STOPS).flatMap(([stop, color]) => [stop, color])]
}

function coreRadius(weight: "sampleWeight" | "sampleBlendWeight", selectedId: string | null): ExpressionSpecification {
  return ["case", ["==", ["get", "id"], selectedId ?? ""], 7,
    ["interpolate", ["linear"], ["get", weight], 0, 2.5, .35, 3.1, .7, 4, 1, 5.5]]
}

export function TemperatureTimelineB({ map, city, locale, points, active, after19, selectedVenueId = null, onSelectPoint }: {
  map: MapLibreMap | null
  city: TemperatureSampleCity
  locale: "en" | "ko" | "ja"
  points: readonly TemperatureSamplePoint[]
  active: boolean
  after19: boolean
  selectedVenueId?: string | null
  onSelectPoint?: (id: string) => void
}) {
  const copy = COPY[locale]
  const [minute, setMinute] = useState(TEMPERATURE_SAMPLE_INITIAL_MINUTE)
  const [direction, setDirection] = useState<TemperatureSampleDirection>(1)
  const [requested, setRequested] = useState(true)
  const [motion, setMotion] = useState({ initialized: false, reduced: true, documentVisible: true })
  const rootRef = useRef<HTMLDivElement>(null)
  const frame = useMemo(() => createTemperatureSampleFrame(city, points, minute), [city, points, minute])
  const frameRef = useRef(frame)
  frameRef.current = frame
  const paintedFrameRef = useRef(frame)
  const paintedSlotRef = useRef<0 | 1>(0)
  const paintGenerationRef = useRef(0)
  const presentationOwner = useRef(Symbol("sample-map-presentation"))
  const onSelectPointRef = useRef(onSelectPoint)
  onSelectPointRef.current = onSelectPoint
  const running = motion.initialized && canRunTemperatureSample({
    requested, visible: active && !!map && points.length > 0,
    documentVisible: motion.documentVisible, reducedMotion: motion.reduced, minute,
  })

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setMotion({ initialized: true, reduced: media.matches, documentVisible: document.visibilityState === "visible" })
    sync()
    media.addEventListener("change", sync)
    document.addEventListener("visibilitychange", sync)
    return () => {
      media.removeEventListener("change", sync)
      document.removeEventListener("visibilitychange", sync)
    }
  }, [])

  useEffect(() => {
    if (!map || !map.getLayer("ondo-pulse-halo")) return
    paintedSlotRef.current = 0
    paintedFrameRef.current = frameRef.current
    map.addSource(SOURCE_ID, { type: "geojson", data: createTemperatureSampleBlend(frameRef.current, frameRef.current, 0) })
    const paint: HeatmapLayerSpecification["paint"] = {
        "heatmap-weight": ["get", "sampleWeight"],
        "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 8, 1.05, 11, 1.45, 15, 2.1],
        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 8, 28, 11, 46, 15, 76],
        "heatmap-opacity": FIELD_OPACITY,
        "heatmap-opacity-transition": { duration: TEMPERATURE_SAMPLE_DISSOLVE_MS, delay: 0 },
        "heatmap-color": SAMPLE_HEAT,
    }
    for (const id of [LAYER_ID, BLEND_LAYER_ID]) {
      map.addLayer({
        id, type: "heatmap", source: SOURCE_ID, minzoom: 8,
        metadata: { origin: "PREPARED_ILLUSTRATION", officialScore: null },
        paint: id === LAYER_ID ? paint : { ...paint, "heatmap-weight": ["get", "sampleBlendWeight"], "heatmap-opacity": 0 },
      }, "ondo-pulse-halo")
    }
    for (const [index, weight] of (["sampleWeight", "sampleBlendWeight"] as const).entries()) {
      map.addLayer({
        id: HALO_IDS[index], type: "circle", source: SOURCE_ID, minzoom: 8,
        paint: {
          "circle-color": coreColor(weight, after19),
          "circle-radius": ["interpolate", ["linear"], ["get", weight], 0, 7, .4, 12, 1, 24],
          "circle-blur": .8, "circle-opacity": index === 0 ? .18 : 0,
          "circle-opacity-transition": { duration: TEMPERATURE_SAMPLE_DISSOLVE_MS },
          "circle-pitch-alignment": "map",
        },
      }, "ondo-pulse-halo")
      map.addLayer({
        id: CORE_IDS[index], type: "circle", source: SOURCE_ID, minzoom: 8,
        paint: {
          "circle-color": coreColor(weight, after19), "circle-radius": coreRadius(weight, selectedVenueId),
          "circle-opacity": index === 0 ? .98 : 0, "circle-opacity-transition": { duration: TEMPERATURE_SAMPLE_DISSOLVE_MS },
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": ["case", ["==", ["get", "id"], selectedVenueId ?? ""], 2.3, 1],
          "circle-stroke-opacity": index === 0 ? .95 : 0,
          "circle-stroke-opacity-transition": { duration: TEMPERATURE_SAMPLE_DISSOLVE_MS },
          "circle-pitch-alignment": "viewport",
        },
      }, "ondo-pulse-halo")
    }
    map.addLayer({ id: HIT_ID, type: "circle", source: SOURCE_ID, minzoom: 8, paint: { "circle-radius": 22, "circle-opacity": 0, "circle-pitch-alignment": "viewport" } })
    const select = (event: MapLayerMouseEvent) => {
      // Hit areas are generous, but close places resolve to the nearest actual
      // coordinate, never paint order or the highest curated score.
      const nearest = (event.features ?? []).flatMap((feature) => {
        if (feature.geometry.type !== "Point" || typeof feature.properties?.id !== "string") return []
        const point = map.project(feature.geometry.coordinates as [number, number])
        return [{ id: feature.properties.id, distance: Math.hypot(point.x - event.point.x, point.y - event.point.y) }]
      }).sort((left, right) => left.distance - right.distance)[0]
      if (nearest) onSelectPointRef.current?.(nearest.id)
    }
    map.on("click", HIT_ID, select)
    return () => {
      paintGenerationRef.current += 1
      clearSampleTemperaturePresentationB(presentationOwner.current)
      // The shared canvas may have been removed by a parent retry/unmount.
      try {
        map.off("click", HIT_ID, select)
        for (const id of [HIT_ID, ...CORE_IDS, ...HALO_IDS]) if (map.getLayer(id)) map.removeLayer(id)
        if (map.getLayer(BLEND_LAYER_ID)) map.removeLayer(BLEND_LAYER_ID)
        if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
      } catch { /* Map destruction already owns resource cleanup. */ }
    }
  }, [map])

  useEffect(() => {
    if (!map?.getLayer(LAYER_ID)) return
    for (const id of [LAYER_ID, BLEND_LAYER_ID]) map.setPaintProperty(id, "heatmap-color", after19 ? AFTER19_SAMPLE_HEAT : SAMPLE_HEAT)
    for (const [index, weight] of (["sampleWeight", "sampleBlendWeight"] as const).entries()) {
      map.setPaintProperty(HALO_IDS[index], "circle-color", coreColor(weight, after19))
      map.setPaintProperty(CORE_IDS[index], "circle-color", coreColor(weight, after19))
      map.setPaintProperty(CORE_IDS[index], "circle-stroke-color", "#ffffff")
      map.setPaintProperty(CORE_IDS[index], "circle-radius", coreRadius(weight, selectedVenueId))
      map.setPaintProperty(CORE_IDS[index], "circle-stroke-width", ["case", ["==", ["get", "id"], selectedVenueId ?? ""], 2.3, 1])
    }
  }, [after19, map, selectedVenueId])

  useEffect(() => {
    const source = map?.getSource(SOURCE_ID) as GeoJSONSource | undefined
    if (!source || !map) return
    const generation = ++paintGenerationRef.current
    const previous = paintedFrameRef.current
    const animate = running && previous !== frame && !map.isMoving()
    const nextSlot = animate ? (paintedSlotRef.current === 0 ? 1 : 0) : paintedSlotRef.current
    const blend = createTemperatureSampleBlend(animate ? previous : frame, frame, nextSlot)
    // One local payload per sample tick. Await the worker before changing
    // slots: a slower device must not reveal the preceding source contents.
    void source.setData(blend, true).then(() => {
      if (generation !== paintGenerationRef.current || !map.getLayer(LAYER_ID)) return
      for (const [index, id] of [LAYER_ID, BLEND_LAYER_ID].entries()) {
        map.setPaintProperty(id, "heatmap-opacity-transition", { duration: animate ? TEMPERATURE_SAMPLE_DISSOLVE_MS : 0, delay: 0 })
        map.setPaintProperty(id, "heatmap-opacity", index === nextSlot ? FIELD_OPACITY : 0)
        for (const layer of [HALO_IDS[index], CORE_IDS[index]]) {
          map.setPaintProperty(layer, "circle-opacity-transition", { duration: animate ? TEMPERATURE_SAMPLE_DISSOLVE_MS : 0, delay: 0 })
          map.setPaintProperty(layer, "circle-opacity", index === nextSlot ? layer === CORE_IDS[index] ? .98 : .18 : 0)
        }
        map.setPaintProperty(CORE_IDS[index], "circle-stroke-opacity-transition", { duration: animate ? TEMPERATURE_SAMPLE_DISSOLVE_MS : 0, delay: 0 })
        map.setPaintProperty(CORE_IDS[index], "circle-stroke-opacity", index === nextSlot ? .95 : 0)
      }
      paintedFrameRef.current = frame
      paintedSlotRef.current = nextSlot
      publishSampleTemperaturePresentationB(presentationOwner.current, { city, minute, direction, running: animate, after19, frame })
      if (rootRef.current) {
        rootRef.current.dataset.sampleDissolve = animate ? "native" : "still"
        rootRef.current.dataset.sampleDissolveDuration = String(animate ? TEMPERATURE_SAMPLE_DISSOLVE_MS : 0)
        rootRef.current.dataset.sampleSourceMinute = String(minute)
        rootRef.current.dataset.sampleWeightSignature = frame.features.map((feature) => feature.properties.sampleWeight).join(",")
        rootRef.current.dataset.sampleCoreSignature = frame.features.map((feature) => `${feature.id}:${feature.properties.sampleWeight}`).join(",")
      }
    }).catch(() => { /* The parent owns map failure/retry; never fake a painted frame. */ })
  }, [frame, map, minute, running, after19, city, direction])

  useEffect(() => {
    if (!running || !map) return
    const timer = window.setInterval(() => {
      // Camera gestures and the existing nation->city flight keep priority.
      if (document.visibilityState !== "visible" || map.isMoving()) return
      const next = advanceTemperatureSample(minute, direction)
      setMinute(next.minute)
      setDirection(next.direction)
    }, TEMPERATURE_SAMPLE_TICK_MS)
    return () => window.clearInterval(timer)
  }, [running, map, minute, direction])

  function toggle() {
    if (motion.reduced) {
      setRequested(false)
      setMinute((current) => current >= TEMPERATURE_SAMPLE_END_MINUTE ? TEMPERATURE_SAMPLE_START_MINUTE : Math.min(TEMPERATURE_SAMPLE_END_MINUTE, current + 30))
      return
    }
    setRequested((current) => !current)
  }

  return (
    <div ref={rootRef} className={styles.controls} data-testid="ondo-temperature-timeline" data-origin="PREPARED_ILLUSTRATION" data-city={city} data-running={running} data-reduced-motion={motion.reduced} data-minute={minute} data-playback-direction={direction === 1 ? "forward" : "backward"} data-sample-core-count={frame.features.length}>
      <details className={styles.disclosure} name="ondo-map-disclosure">
        <summary aria-label={`${copy.control} · ${temperatureSampleTimeLabel(minute)}`}>
          <small>{copy.sample}</small><time>{temperatureSampleTimeLabel(minute)}</time>
          <span className={styles.thermalTrace} aria-hidden="true"><b style={{ width: `${((minute - TEMPERATURE_SAMPLE_START_MINUTE) / (TEMPERATURE_SAMPLE_END_MINUTE - TEMPERATURE_SAMPLE_START_MINUTE)) * 100}%` }} /></span>
        </summary>
        <div className={styles.panel}>
          <strong>{copy.title}</strong>
          <input aria-label={copy.time} aria-valuetext={`${temperatureSampleTimeLabel(minute)} KST`} type="range" min={TEMPERATURE_SAMPLE_START_MINUTE} max={TEMPERATURE_SAMPLE_END_MINUTE} step={10} value={minute}
            onChange={(event) => { setRequested(false); const next = normalizeTemperatureSampleMinute(Number(event.currentTarget.value)); setMinute(next); setDirection(next >= TEMPERATURE_SAMPLE_END_MINUTE ? -1 : 1) }} />
          <div className={styles.ticks} aria-hidden="true"><span>17:00</span><span>20:00</span><span>23:00</span></div>
          <p>{copy.note}{city === "jeju" ? ` ${copy.jeju}` : ""}</p>
        </div>
      </details>
      <button className={styles.play} type="button" data-testid="ondo-temperature-play" aria-label={motion.reduced ? copy.step : running ? copy.pause : copy.play} onClick={toggle}>
        {motion.reduced ? <SkipForward size={16} aria-hidden="true" /> : running ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
      </button>
    </div>
  )
}
