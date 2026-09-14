"use client"

import { ChevronRight, Landmark } from "lucide-react"
import type { CanonicalMapVenue, VenuePrimaryCategory } from "@/lib/ondo/venues/contracts"
import { venueDistrictLabel, venueNamePresentation } from "@/lib/ondo/venues/display"
import { pulseForVenue, pulseLevelLabel, type PulseLocalEvidenceB } from "../pulse-b/pulse-model-b"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import styles from "./canonical-venue-capsule-b.module.css"

const CATEGORY_COPY: Record<VenuePrimaryCategory, Record<OndoBLocale, string>> = {
  korean: { en: "Korean", ko: "한식", ja: "韓国料理" },
  casual: { en: "Quick service", ko: "분식·간편식", ja: "軽食・ファストフード" },
  japanese: { en: "Japanese", ko: "일식", ja: "日本料理" },
  chinese: { en: "Chinese", ko: "중식", ja: "中華料理" },
  global: { en: "Western & international", ko: "경양식·외국음식", ja: "洋食・各国料理" },
  night: { en: "Pubs & cafés", ko: "주점·카페", ja: "パブ・カフェ" },
  specialty: { en: "Grills & specialty", ko: "구이·횟집·전문점", ja: "焼き物・専門店" },
}

const TEMPERATURE_NAME: Record<OndoBLocale, string> = {
  en: "ONDO temperature",
  ko: "온도",
  ja: "ONDO温度",
}

const PERSONAL_MATCH: Record<OndoBLocale, string> = {
  en: "Matches your map",
  ko: "나의 지도와 맞음",
  ja: "自分のマップに一致",
}

const LOCAL_SIGNAL: Record<OndoBLocale, string> = {
  en: "local signal",
  ko: "로컬 신호",
  ja: "ローカルシグナル",
}

const OFFICIAL_SOURCE: Record<OndoBLocale, string> = {
  en: "Official directory source",
  ko: "공식 디렉터리 출처",
  ja: "公式ディレクトリ出典",
}

const VENUE_MOOD_IMAGES: Record<VenuePrimaryCategory, readonly string[]> = {
  korean: ["/editorial/food/ondo-category-korean-v1.jpg"],
  casual: ["/editorial/food/ondo-category-casual-v1.jpg"],
  japanese: ["/editorial/food/ondo-category-japanese-v1.jpg"],
  chinese: ["/editorial/food/ondo-category-chinese-v1.jpg"],
  global: ["/editorial/food/ondo-category-global-v1.jpg"],
  night: [
    "/editorial/food/ondo-category-night-v1.jpg",
    "/editorial/food/ondo-category-night-v2.jpg",
    "/editorial/food/ondo-category-night-v3.jpg",
  ],
  specialty: ["/editorial/food/ondo-category-specialty-v1.jpg"],
}

export function canonicalVenueMoodImage(venue: CanonicalMapVenue) {
  const images = VENUE_MOOD_IMAGES[venue.primaryCategory]
  let hash = 0
  for (const character of venue.id) hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0
  return images[Math.abs(hash) % images.length]
}

export function canonicalVenueCategoryLabel(venue: CanonicalMapVenue, locale: OndoBLocale) {
  return CATEGORY_COPY[venue.primaryCategory][locale]
}

export function CanonicalVenueCapsuleB({
  venue,
  locale,
  localEvidence = null,
  matchCount = 0,
  dietaryUnknown = false,
  selected = false,
  density = "list",
  testId,
  onOpen,
}: {
  venue: CanonicalMapVenue
  locale: OndoBLocale
  localEvidence?: PulseLocalEvidenceB | null
  matchCount?: number
  dietaryUnknown?: boolean
  selected?: boolean
  density?: "list" | "preview"
  testId?: string
  onOpen?: () => void
}) {
  const presentation = venueNamePresentation(venue.name.ko, locale)
  const category = canonicalVenueCategoryLabel(venue, locale)
  const pulse = pulseForVenue(venue.id, localEvidence)
  const pulseSummary = `${TEMPERATURE_NAME[locale]} · ${pulseLevelLabel(pulse.level, locale)}`
  const accessibleLabel = `${presentation.officialName} · ${presentation.transliteration} · ${venueDistrictLabel(venue.cityId, venue.districtId, locale)} · ${category} · ${OFFICIAL_SOURCE[locale]} · ${pulseSummary}${matchCount > 0 ? ` · ${PERSONAL_MATCH[locale]}` : ""}`
  const content = <>
    <span
      className={styles.media}
      data-image-kind="category-mood"
      data-photo-kind="category-illustration"
      data-photo-state="pending"
      aria-hidden="true"
    >
      <img
        src={canonicalVenueMoodImage(venue)}
        alt=""
        width={720}
        height={720}
        loading="lazy"
        decoding="async"
        onLoad={(event) => event.currentTarget.parentElement?.setAttribute("data-photo-state", "loaded")}
        onError={(event) => {
          event.currentTarget.hidden = true
          event.currentTarget.parentElement?.setAttribute("data-photo-state", "error")
        }}
      />
    </span>
    <span className={styles.body}>
      <span className={styles.meta}>
        <span className={styles.sourceGlyph} data-source-glyph="official-directory" aria-hidden="true"><Landmark /></span>
        <small>{venueDistrictLabel(venue.cityId, venue.districtId, locale)} · {category}</small>
      </span>
      <strong data-testid="official-source-name">{presentation.officialName}</strong>
      <span
        className={styles.temperature}
        role="img"
        data-testid="ondo-b-list-pulse"
        data-pulse-level={pulse.level}
        data-pulse-numeric="hidden"
        aria-label={`${pulseSummary}${pulse.localEvidence ? ` · ${LOCAL_SIGNAL[locale]}` : ""}`}
      >
        <span className={styles.temperatureSignal} aria-hidden="true"><i /><i /><i /></span>
        <span className={styles.srOnly}>{pulseSummary}</span>
      </span>
      {locale === "ko" ? null : <small className={styles.transliteration}>{presentation.transliteration}</small>}
    </span>
    {onOpen ? <ChevronRight className={styles.chevron} size={17} aria-hidden="true" /> : null}
  </>
  const common = {
    className: `${styles.capsule} ${density === "preview" ? styles.preview : styles.list}`,
    "data-testid": testId,
    "data-canonical-venue-capsule": "true",
    "data-venue-id": venue.id,
    "data-source-class": "official_directory",
    "data-personalization-match-count": matchCount,
    "data-personalized-match": matchCount > 0 ? "true" : "false",
    "data-dietary-evidence": dietaryUnknown ? "unknown" : undefined,
  } as const

  if (onOpen) return <button
    {...common}
    type="button"
    onClick={onOpen}
    data-venue-opener={venue.id}
    aria-haspopup="dialog"
    aria-expanded={selected}
    aria-controls={selected ? "canonical-place-dialog" : undefined}
    aria-label={accessibleLabel}
  >{content}</button>

  return <div {...common} role="group" aria-label={accessibleLabel}>{content}</div>
}
