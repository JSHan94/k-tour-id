"use client"

import { ArrowDownRight, ArrowRight, ArrowUpRight, Camera, Check, Footprints, MessageCircle, Plus } from "lucide-react"
import { useSyncExternalStore, type CSSProperties, type ReactNode } from "react"
import { temperatureSampleColor, temperatureSampleTimeLabel, temperatureSampleWeight, type TemperatureSampleCity } from "../contracts/temperature-timeline"
import { readSampleTemperaturePresentationB, readServerSampleTemperaturePresentationB, subscribeSampleTemperaturePresentationB } from "./sample-temperature-presentation-b"
import styles from "./sample-activity-meter-b.module.css"
import { sampleTravelerActivityB } from "../contracts/traveler-activity-b"

const COPY = {
  en: { title: "Traveler pulse", sample: "Sample", rising: "Picking up", cooling: "Settling down", steady: "Good company", visits: "visits", photos: "photos", updates: "updates", add: "Add your moment", saved: "Your update · on this device", disclosure: "Prepared visits, photos and updates in a sample 30-minute window. Not real visitors, posted photos or a place rating." },
  ko: { title: "여행자들의 온도", sample: "샘플", rising: "발길이 모이는 중", cooling: "조금 여유로워졌어요", steady: "꾸준히 머무는 곳", visits: "방문", photos: "사진", updates: "업데이트", add: "나도 분위기 남기기", saved: "내 업데이트 · 이 기기에 저장", disclosure: "샘플 30분 동안의 방문·사진·업데이트 예시예요. 실제 방문자, 게시된 사진이나 장소 평점은 아니에요." },
  ja: { title: "旅人たちの温度", sample: "サンプル", rising: "人が集まりつつ", cooling: "少し落ち着いて", steady: "心地よいにぎわい", visits: "訪問", photos: "写真", updates: "更新", add: "今の雰囲気を残す", saved: "自分の更新・この端末に保存", disclosure: "サンプル30分間の訪問・写真・更新のイメージ。実際の訪問者、投稿写真や店舗評価ではありません。" },
} as const

/** Only this compact presentation subscribes to the map's painted sample.
 * The underlying place facts/curated score/credential flow never tick. */
export function SampleActivityMeterB({ city, venueId, locale, fallback, onContribute, contributionPosted = false }: {
  city: TemperatureSampleCity
  venueId: string
  locale: "en" | "ko" | "ja"
  fallback: ReactNode
  onContribute?: () => void
  contributionPosted?: boolean
}) {
  const snapshot = useSyncExternalStore(subscribeSampleTemperaturePresentationB, readSampleTemperaturePresentationB, readServerSampleTemperaturePresentationB)
  const feature = snapshot?.city === city ? snapshot.frame.features.find((candidate) => candidate.id === venueId) : null
  if (!snapshot || !feature) return fallback
  const copy = COPY[locale]
  const weight = feature.properties.sampleWeight
  const color = temperatureSampleColor(weight, snapshot.after19)
  const activity = sampleTravelerActivityB(city, venueId, snapshot.minute)
  const nearby = temperatureSampleWeight(city, venueId, snapshot.minute + snapshot.direction * 20)
  const trend = nearby - weight > .025 ? "rising" : weight - nearby > .025 ? "cooling" : "steady"
  const Trend = trend === "rising" ? ArrowUpRight : trend === "cooling" ? ArrowDownRight : ArrowRight
  const coordinates = Array.from({ length: 13 }, (_, index) => {
    const value = temperatureSampleWeight(city, venueId, snapshot.minute + (index - 12) * snapshot.direction * 10)
    return `${index * 8},${(28 - value * 24).toFixed(2)}`
  }).join(" ")
  return (
    <section className={styles.meter} style={{ "--sample-color": color, "--sample-position": `${5 + weight * 90}%` } as CSSProperties}
      data-testid="canonical-place-pulse" data-origin="PREPARED_ILLUSTRATION" data-temperature-score="none" data-temperature-model="prepared-activity" data-sample-minute={snapshot.minute} data-sample-weight={weight}
      data-sample-running={snapshot.running} data-sample-venue-id={venueId} data-after19={snapshot.after19}
      role="group" aria-label={`${copy.title} · ${copy.sample} ${temperatureSampleTimeLabel(snapshot.minute)} · ${copy[trend]}. ${copy.disclosure}`}>
      <div className={styles.heading}><span>{copy.title}</span><small>{copy.sample} <time>{temperatureSampleTimeLabel(snapshot.minute)}</time></small></div>
      <div className={styles.signal} aria-hidden="true">
        <div className={styles.reading}><Trend size={18} /><strong>{copy[trend]}</strong></div>
        <svg viewBox="0 0 100 32" className={styles.sparkline}><polyline points={coordinates} /><circle cx="96" cy={(28 - weight * 24).toFixed(2)} r="2.5" /></svg>
      </div>
      <div className={styles.contributions} data-testid="sample-traveler-contributions" data-activity-origin="PREPARED_ILLUSTRATION" data-window-minutes="30" aria-label={copy.disclosure}>
        <span><Footprints size={14} aria-hidden="true" /><b>{activity.arrivals}</b><small>{copy.visits}</small></span>
        <span><Camera size={14} aria-hidden="true" /><b>{activity.photos}</b><small>{copy.photos}</small></span>
        <span><MessageCircle size={14} aria-hidden="true" /><b>{activity.updates}</b><small>{copy.updates}</small></span>
      </div>
      <span className={styles.scale} data-testid="canonical-place-temperature-meter" aria-hidden="true"><i /></span>
      {onContribute ? <button type="button" className={styles.contribute} onClick={onContribute} data-testid="sample-add-moment">
        {contributionPosted ? <Check size={15} /> : <Plus size={15} />}<span>{contributionPosted ? copy.saved : copy.add}</span>
      </button> : null}
    </section>
  )
}
