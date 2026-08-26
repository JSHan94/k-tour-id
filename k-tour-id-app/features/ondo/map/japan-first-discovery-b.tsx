"use client"

import { ArrowUpRight, ChevronRight, Flame, MapPinned, Sparkles } from "lucide-react"
import {
  JAPAN_FIRST_LAUNCH_CONTENT,
  JAPAN_FIRST_FEATURED_CONTENT_IDS,
  JEJU_EDITORIAL_SEEDS,
  type JapanFirstLaunchContentB,
} from "../pulse-b/japan-first-pulse-model-b"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import styles from "./japan-first-discovery-b.module.css"

const COPY = {
  en: {
    eyebrow: "Stories from Japanese travel sources",
    title: "9 stories · 10 Jeju ideas",
    seoulTitle: "7 stories from Japanese travel sources",
    jejuTitle: "2 stories · 10 Jeju ideas",
    seoulSummary: "Editorial collection · exact places pending",
    jejuSummary: "Editorial collection · place links pending",
    summary: "One Pulse · places verified before linking",
    body: "Original sources and exact place links are checked before a story can affect Pulse or open a place.",
    content: "Top stories",
    jeju: "Jeju · Growing",
    jejuBody: "10 editorial ideas · not official directory records",
    jejuSources: "Official Jeju source collections",
    pending: "Source linked · place match pending",
    viewSource: "View source",
    viewSources: "View sources",
    method: "How this was checked",
    marker: "Stories",
    language: "App guidance is available in English and Korean.",
    sourceBoundary: "Place facts must be reverified before an idea can become a map pin.",
    newTab: "opens in a new tab",
  },
  ko: {
    eyebrow: "일본 여행 출처의 이야기",
    title: "콘텐츠 9개 · 제주 아이디어 10곳",
    seoulTitle: "일본 여행 출처의 서울 이야기 7개",
    jejuTitle: "제주 이야기 2개 · 아이디어 10곳",
    seoulSummary: "편집 컬렉션 · 정확한 장소 확인 중",
    jejuSummary: "편집 컬렉션 · 장소 연결 확인 중",
    summary: "하나의 Pulse · 장소 검증 후 연결",
    body: "원본 출처와 정확한 장소 연결을 확인한 뒤에만 Pulse에 반영하거나 장소를 엽니다.",
    content: "주요 콘텐츠",
    jeju: "제주 · 성장 중",
    jejuBody: "편집 아이디어 10곳 · 공식 디렉터리 기록 아님",
    jejuSources: "제주 공식 출처 모음",
    pending: "출처 연결됨 · 장소 매칭 확인 중",
    viewSource: "원문 보기",
    viewSources: "출처 보기",
    method: "확인 방식",
    marker: "여행 이야기",
    language: "앱 안내는 영어와 한국어로 제공합니다.",
    sourceBoundary: "장소 정보는 지도 핀으로 연결하기 전에 다시 검증합니다.",
    newTab: "새 탭에서 열림",
  },
} satisfies Record<OndoBLocale, Record<string, string>>

type Copy = typeof COPY.en

function SourceLinks({ item, copy, locale }: { item: JapanFirstLaunchContentB; copy: Copy; locale: OndoBLocale }) {
  const links = item.sourceReferences.map((source) => (
    <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
      <span>{source.label}</span><ArrowUpRight aria-hidden="true" size={15} />
      <span className={styles.srOnly}>({copy.newTab})</span>
    </a>
  ))
  if (links.length === 1) return <nav aria-label={`${copy.viewSource}: ${item.title[locale]}`}>{links}</nav>
  return (
    <details className={styles.sourceDisclosure} data-testid={`ondo-b-story-sources-${item.id}`}>
      <summary>{copy.viewSources} ({links.length})<ChevronRight aria-hidden="true" size={15} /></summary>
      <nav aria-label={`${copy.viewSources}: ${item.title[locale]}`}>{links}</nav>
    </details>
  )
}

function Story({ item, copy, locale, compact = false }: {
  item: JapanFirstLaunchContentB
  copy: Copy
  locale: OndoBLocale
  compact?: boolean
}) {
  return (
    <article className={compact ? styles.compactStory : undefined} data-content-id={item.id} data-verification={item.sourceVerification} data-place-edge={item.placeEdgeVerification}>
      <small>{item.sourceReferences[0].label}</small>
      <strong>{item.title[locale]}</strong>
      <p lang="ja">{item.jaHook}</p>
      <em>{copy.pending}</em>
      <SourceLinks item={item} copy={copy} locale={locale} />
    </article>
  )
}

export function JapanFirstDiscoveryB({ locale, city, onOpenChange }: { locale: OndoBLocale; city: "seoul" | "jeju"; onOpenChange?(open: boolean): void }) {
  const copy = COPY[locale]
  const cityItems = JAPAN_FIRST_LAUNCH_CONTENT.filter((item) => item.cityIds.includes(city))
  const featured = city === "seoul"
    ? JAPAN_FIRST_FEATURED_CONTENT_IDS.map((id) => cityItems.find((item) => item.id === id)!).filter(Boolean)
    : cityItems
  const remaining = cityItems.filter((item) => !featured.some((featuredItem) => featuredItem.id === item.id))
  const jejuSources = [...new Map(JEJU_EDITORIAL_SEEDS.map((item) => [item.sourceUrl, item])).values()]
  const title = city === "seoul" ? copy.seoulTitle : copy.jejuTitle
  const summary = city === "seoul" ? copy.seoulSummary : copy.jejuSummary
  return (
    <details className={styles.root} data-testid="ondo-b-japan-first-discovery" data-city-context={city} data-truth-kind="editorial-collection" data-geometry-basis="region" data-place-point-count="0" onToggle={(event) => onOpenChange?.(event.currentTarget.open)}>
      <summary data-testid="ondo-b-editorial-collection-marker" aria-label={`${title}. ${summary}`}>
        <span className={styles.mark}><Sparkles aria-hidden="true" size={20} /><b>{copy.marker}</b></span>
        <span>
          <small>{copy.eyebrow}</small>
          <strong>{title}</strong>
          <em>{summary}</em>
        </span>
        <ChevronRight aria-hidden="true" size={18} strokeWidth={2.1} />
      </summary>
      <div className={styles.panel}>
        <header>
          <span><Flame aria-hidden="true" size={18} /><strong>{copy.content}</strong></span>
          <details className={styles.method}>
            <summary>{copy.method}<ChevronRight aria-hidden="true" size={15} /></summary>
            <p>{copy.body}</p>
            <small>{copy.language}</small>
          </details>
        </header>
        <div className={styles.contentRail}>
          {featured.map((item) => <Story key={item.id} item={item} copy={copy} locale={locale} />)}
        </div>
        {remaining.length ? (
          <details className={styles.moreStories} data-testid="ondo-b-japan-more-stories">
            <summary>{locale === "ko" ? `콘텐츠 ${remaining.length}개 더 보기` : `${remaining.length} more stories`}<ChevronRight aria-hidden="true" size={16} /></summary>
            <div>
              {remaining.map((item) => <Story key={item.id} item={item} copy={copy} locale={locale} compact />)}
            </div>
          </details>
        ) : null}
        {city === "jeju" ? (
          <details className={styles.jeju} data-testid="ondo-b-jeju-editorial-seeds" data-seed-count={JEJU_EDITORIAL_SEEDS.length} data-source-type="editorial-research" data-official-record-count="none">
            <summary>
              <MapPinned aria-hidden="true" size={20} />
              <span><strong>{copy.jeju}</strong><small>{copy.jejuBody}</small></span>
              <ChevronRight aria-hidden="true" size={16} />
            </summary>
            <div>
              <strong>{copy.jejuSources}</strong>
              <nav aria-label={copy.jejuSources}>
                {jejuSources.map((source) => (
                  <a key={source.sourceUrl} href={source.sourceUrl} target="_blank" rel="noreferrer">
                    <span>{source.sourceCollection[locale]}</span><ArrowUpRight aria-hidden="true" size={15} />
                    <span className={styles.srOnly}>({copy.newTab})</span>
                  </a>
                ))}
              </nav>
              <small>{copy.sourceBoundary}</small>
            </div>
          </details>
        ) : null}
      </div>
    </details>
  )
}
