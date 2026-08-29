"use client"

import type { KeyboardEvent } from "react"
import { useEffect, useRef, useState } from "react"
import { ArrowUpRight, Bookmark, ChevronRight, MapPin, Navigation, X } from "lucide-react"
import { closeBDiscoveryPlace } from "../map/b-discovery-history"
import { editorialPlaceById, JAPAN_FIRST_LAUNCH_CONTENT } from "../pulse-b/japan-first-pulse-model-b"
import { useOndoB } from "../shared/state/ondo-b-provider"
import { useModalIsolation } from "../shared/ui/use-modal-isolation"
import styles from "./editorial-place-overlay-b.module.css"

const FOCUSABLE = "a[href],button:not([disabled]),summary,[tabindex]:not([tabindex='-1'])"

const COPY = {
  en: {
    truth: "Jeju travel place",
    boundary: "Travel guide",
    address: "Address",
    directions: "Directions",
    save: "Save to My Korea",
    saved: "Saved in My Korea",
    remove: "Remove from My Korea",
    source: "Place source",
    sourceDetails: "Source details",
    imageSource: "Hero image",
    collection: "Story source",
    checked: "Place page and embedded map checked Aug 28, 2026",
    close: "Close place",
    saveFailed: "This device could not update the saved place. Try again.",
  },
  ko: {
    truth: "제주 여행 장소",
    boundary: "여행 가이드",
    address: "주소",
    directions: "길찾기",
    save: "내 한국에 저장",
    saved: "내 한국에 저장됨",
    remove: "내 한국에서 삭제",
    source: "장소 출처",
    sourceDetails: "출처 정보",
    imageSource: "대표 이미지",
    collection: "이야기 출처",
    checked: "장소 페이지와 내장 지도를 2026년 8월 28일 확인",
    close: "장소 닫기",
    saveFailed: "이 기기의 저장 장소를 업데이트하지 못했어요. 다시 시도해 주세요.",
  },
  ja: {
    truth: "済州の旅スポット",
    boundary: "旅ガイド",
    address: "住所",
    directions: "経路を見る",
    save: "マイ韓国に保存",
    saved: "マイ韓国に保存済み",
    remove: "マイ韓国から削除",
    source: "スポット情報源",
    sourceDetails: "情報源の詳細",
    imageSource: "メイン画像",
    collection: "ストーリー情報源",
    checked: "スポットページと埋め込み地図を2026年8月28日に確認",
    close: "スポットを閉じる",
    saveFailed: "この端末の保存内容を更新できませんでした。もう一度お試しください。",
  },
} as const

export function EditorialPlaceOverlayB() {
  const { state, actions } = useOndoB()
  const layerRef = useRef<HTMLDivElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const [saveError, setSaveError] = useState(false)
  const placeId = state.surface.kind === "editorial_place" ? state.surface.editorialPlaceId : undefined
  const place = editorialPlaceById(placeId)
  const locale = state.locale
  const copy = COPY[locale]
  const saved = place ? state.savedEditorialPlaceIds.includes(place.id) : false

  useModalIsolation(state.tab === "ondo" && Boolean(place), layerRef)

  useEffect(() => {
    setSaveError(false)
    if (!place) return
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }))
    return () => window.cancelAnimationFrame(frame)
  }, [place])

  if (!place || state.tab !== "ondo") return null
  const activePlace = place
  const address = locale === "en" ? activePlace.address.en : activePlace.address.ko
  const stories = activePlace.storyIds.flatMap((storyId) => {
    const story = JAPAN_FIRST_LAUNCH_CONTENT.find((item) => item.id === storyId)
    return story ? [story] : []
  })
  const fallbackJejuStory = JAPAN_FIRST_LAUNCH_CONTENT.find((item) => item.id === "C18")
  const heroMedia = stories.find((story) => story.editorialMedia)?.editorialMedia ?? fallbackJejuStory?.editorialMedia
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${activePlace.location.latitude},${activePlace.location.longitude}`)}`

  function close() {
    if (closeBDiscoveryPlace()) return
    actions.setSurface({ kind: "map" })
  }

  function trapFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault()
      close()
      return
    }
    if (event.key !== "Tab") return
    const focusable = Array.from(layerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter((element) => element.offsetParent !== null)
    const first = focusable[0]
    const last = focusable.at(-1)
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }

  function toggleSaved() {
    setSaveError(false)
    if (!actions.toggleSavedEditorialPlace(activePlace.id)) setSaveError(true)
  }

  return (
    <div ref={layerRef} className={styles.layer} role="dialog" aria-modal="true" aria-labelledby="editorial-place-title" data-testid="ondo-b-editorial-place-overlay" data-editorial-place-id={place.id} data-truth-kind="editorial-place" data-official-record="false" data-pulse-eligible="false" data-save-state={saved ? "saved" : "idle"} onKeyDown={trapFocus}>
      <button type="button" className={styles.backdrop} onClick={close} aria-label={copy.close} tabIndex={-1} />
      <article className={styles.sheet}>
        <header>
          <span><MapPin size={18} aria-hidden="true" />{copy.truth}</span>
          <button ref={closeRef} type="button" onClick={close} aria-label={copy.close}><X size={19} aria-hidden="true" /></button>
        </header>
        <div className={styles.body}>
          {heroMedia ? (
            <figure className={styles.hero} data-testid="ondo-b-editorial-place-hero">
              <img src={heroMedia.src} alt={heroMedia.alt[locale]} />
            </figure>
          ) : null}
          <section className={styles.identity}>
            <p>{place.sourceCollection[locale]}</p>
            <h2 id="editorial-place-title">{place.name[locale]}</h2>
            <small>{copy.boundary}</small>
          </section>
          <p className={styles.address}><MapPin size={17} aria-hidden="true" /><span><b>{copy.address}</b><span lang={locale === "en" ? "en" : "ko"}>{address}</span></span></p>
          <div className={styles.actions}>
            <a href={directions} target="_blank" rel="noreferrer" data-testid="ondo-b-editorial-place-directions"><Navigation size={18} aria-hidden="true" />{copy.directions}</a>
            <button type="button" onClick={toggleSaved} aria-pressed={saved} data-testid="ondo-b-editorial-place-save"><Bookmark size={18} aria-hidden="true" />{saved ? copy.remove : copy.save}</button>
          </div>
          {saveError ? <p className={styles.error} role="alert">{copy.saveFailed}</p> : null}
          <details className={styles.sources} aria-label={copy.source}>
            <summary><span>{copy.sourceDetails}</span><ChevronRight size={17} aria-hidden="true" /></summary>
            <div className={styles.sourceBody}>
              <p>{copy.checked}</p>
              {heroMedia ? <p className={styles.mediaCredit}><b>{copy.imageSource}</b><span>{heroMedia.credit[locale]}</span></p> : null}
              <a href={place.placeSourceUrl} target="_blank" rel="noreferrer"><span><b>{copy.source}</b><small>VISITKOREA · {place.location.coordinateSource}</small></span><ArrowUpRight size={17} aria-hidden="true" /></a>
              {stories.map((story) => <a key={story.id} href={story.sourceReferences[0].url} target="_blank" rel="noreferrer"><span><b>{copy.collection}</b><small>{story.title[locale]}</small></span><ArrowUpRight size={17} aria-hidden="true" /></a>)}
            </div>
          </details>
        </div>
      </article>
    </div>
  )
}
