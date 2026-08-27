"use client"

import Image from "next/image"
import { useRef } from "react"
import { ArrowUpRight, BookOpenText, ChevronRight, CircleDashed, MapPin, MapPinned, Sparkles } from "lucide-react"
import {
  editorialPlacesForStory,
  JAPAN_FIRST_LAUNCH_CONTENT,
  JAPAN_FIRST_FEATURED_CONTENT_IDS,
  JEJU_EDITORIAL_PLACES,
  JEJU_EDITORIAL_SEEDS,
  type EditorialPlaceB,
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
    jejuSummary: "8 verified places · 2 still checking",
    summary: "One Pulse · places verified before linking",
    body: "Original sources and exact place links are checked before a story can affect Pulse or open a place.",
    content: "Top stories",
    jeju: "Jeju · Growing",
    jejuBody: "10 editorial ideas · not official directory records",
    jejuSources: "Official Jeju source collections",
    pending: "Source linked · place match pending",
    verified: "Verified editorial place",
    viewOnMap: "View on map",
    viewSource: "View source",
    viewSources: "View sources",
    method: "How this was checked",
    marker: "Stories",
    language: "App guidance is available in English and Korean.",
    sourceBoundary: "Eight place pages and map coordinates were verified on Aug 28, 2026. Two ideas remain link-only.",
    newTab: "opens in a new tab",
  },
  ko: {
    eyebrow: "일본 여행 출처의 이야기",
    title: "콘텐츠 9개 · 제주 아이디어 10곳",
    seoulTitle: "일본 여행 출처의 서울 이야기 7개",
    jejuTitle: "제주 이야기 2개 · 아이디어 10곳",
    seoulSummary: "편집 컬렉션 · 정확한 장소 확인 중",
    jejuSummary: "검증된 장소 8곳 · 2곳 확인 중",
    summary: "하나의 Pulse · 장소 검증 후 연결",
    body: "원본 출처와 정확한 장소 연결을 확인한 뒤에만 Pulse에 반영하거나 장소를 엽니다.",
    content: "주요 콘텐츠",
    jeju: "제주 · 성장 중",
    jejuBody: "편집 아이디어 10곳 · 공식 디렉터리 기록 아님",
    jejuSources: "제주 공식 출처 모음",
    pending: "출처 연결됨 · 장소 매칭 확인 중",
    verified: "검증된 편집 장소",
    viewOnMap: "지도에서 보기",
    viewSource: "원문 보기",
    viewSources: "출처 보기",
    method: "확인 방식",
    marker: "여행 이야기",
    language: "앱 안내는 영어와 한국어로 제공합니다.",
    sourceBoundary: "장소 페이지와 지도 좌표 8곳을 2026년 8월 28일 확인했습니다. 2곳은 출처 링크만 제공합니다.",
    newTab: "새 탭에서 열림",
  },
  ja: {
    eyebrow: "日本の旅行メディアから見つけた物語",
    title: "ストーリー9件・済州アイデア10件",
    seoulTitle: "日本の旅行メディアから見つけたソウルの物語7件",
    jejuTitle: "済州の物語2件・アイデア10件",
    seoulSummary: "編集コレクション・正確な場所は確認中",
    jejuSummary: "確認済み8か所・確認中2か所",
    summary: "Pulseはひとつ・場所確認後にリンク",
    body: "元の情報源と正確な場所の対応を確認した後にのみ、Pulseへの反映や場所ページへのリンクを行います。",
    content: "注目のストーリー",
    jeju: "済州・成長中",
    jejuBody: "編集アイデア10件・公式ディレクトリ記録ではありません",
    jejuSources: "済州の公式情報コレクション",
    pending: "情報源あり・場所の一致を確認中",
    verified: "確認済みの編集スポット",
    viewOnMap: "地図で見る",
    viewSource: "元の情報を見る",
    viewSources: "情報源を見る",
    method: "確認方法",
    marker: "ストーリー",
    language: "アプリの案内は日本語・英語・韓国語に対応しています。",
    sourceBoundary: "8か所の公式ページと地図座標を2026年8月28日に確認しました。2件は情報源リンクのみです。",
    newTab: "新しいタブで開きます",
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

function Story({ item, copy, locale, compact = false, visualRole = compact ? "compact" : "supporting", onSelectEditorialPlace }: {
  item: JapanFirstLaunchContentB
  copy: Copy
  locale: OndoBLocale
  compact?: boolean
  visualRole?: "lead" | "supporting" | "compact"
  onSelectEditorialPlace?(place: EditorialPlaceB): void
}) {
  const mappedPlace = editorialPlacesForStory(item.id)[0]
  return (
    <article className={compact ? styles.compactStory : undefined} data-content-id={item.id} data-editorial-role={visualRole} data-verification={item.sourceVerification} data-place-edge={item.placeEdgeVerification}>
      {item.editorialMedia && !compact ? (
        <figure className={styles.storyMedia} data-rights-mode={item.editorialMedia.rightsMode}>
          <Image
            alt={item.editorialMedia.alt[locale]}
            fill
            sizes="(max-width: 800px) 76vw, 320px"
            src={item.editorialMedia.src}
          />
          <figcaption>{item.editorialMedia.credit[locale]}</figcaption>
        </figure>
      ) : <small>{item.sourceReferences[0].label}</small>}
      <div className={styles.storyCopy}>
        <strong>{item.title[locale]}</strong>
        {locale === "ja" ? null : <p lang="ja">{item.jaHook}</p>}
        <em>{mappedPlace ? <MapPin aria-hidden="true" size={14} /> : <CircleDashed aria-hidden="true" size={14} />}{mappedPlace ? copy.verified : copy.pending}</em>
      </div>
      {mappedPlace && onSelectEditorialPlace ? <button type="button" className={styles.mapCta} data-testid={`ondo-b-story-map-${item.id}`} data-editorial-story-opener={mappedPlace.id} onClick={() => onSelectEditorialPlace(mappedPlace)}><MapPin aria-hidden="true" size={16} /><span>{copy.viewOnMap}</span><ChevronRight aria-hidden="true" size={15} /></button> : null}
      <SourceLinks item={item} copy={copy} locale={locale} />
    </article>
  )
}

export function JapanFirstDiscoveryB({ locale, city, presentation = "map", onOpenChange, onSelectEditorialPlace }: { locale: OndoBLocale; city: "seoul" | "jeju"; presentation?: "map" | "list"; onOpenChange?(open: boolean): void; onSelectEditorialPlace?(place: EditorialPlaceB): void }) {
  const rootRef = useRef<HTMLDetailsElement>(null)
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
    <details ref={rootRef} className={styles.root} data-testid="ondo-b-japan-first-discovery" data-city-context={city} data-presentation={presentation} data-truth-kind="editorial-collection" data-geometry-basis={city === "jeju" ? "verified-points" : "region"} data-place-point-count={city === "jeju" ? JEJU_EDITORIAL_PLACES.length : 0} onToggle={(event) => onOpenChange?.(event.currentTarget.open)}>
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
          <span><BookOpenText aria-hidden="true" size={18} /><strong>{copy.content}</strong></span>
          <details className={styles.method}>
            <summary>{copy.method}<ChevronRight aria-hidden="true" size={15} /></summary>
            <p>{copy.body}</p>
            <small>{copy.language}</small>
          </details>
        </header>
        <div className={styles.contentRail} data-testid="ondo-b-editorial-guide-grid">
          {featured.map((item, index) => <Story key={item.id} item={item} copy={copy} locale={locale} visualRole={index === 0 ? "lead" : "supporting"} onSelectEditorialPlace={city === "jeju" ? (place) => { if (rootRef.current) rootRef.current.open = false; onOpenChange?.(false); onSelectEditorialPlace?.(place) } : undefined} />)}
        </div>
        {remaining.length ? (
          <details className={styles.moreStories} data-testid="ondo-b-japan-more-stories">
            <summary>{locale === "ko" ? `콘텐츠 ${remaining.length}개 더 보기` : locale === "ja" ? `ほかのストーリー${remaining.length}件` : `${remaining.length} more stories`}<ChevronRight aria-hidden="true" size={16} /></summary>
            <div>
              {remaining.map((item) => <Story key={item.id} item={item} copy={copy} locale={locale} compact visualRole="compact" />)}
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
