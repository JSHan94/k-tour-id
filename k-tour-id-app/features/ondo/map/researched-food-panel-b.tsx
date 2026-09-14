"use client"

import { ChevronRight, MapPin, Navigation, Utensils } from "lucide-react"
import { SheetB } from "../shared/ui/sheet-b"
import { FoodPhotoB } from "./food-photo-b"
import { SampleActivityMeterB } from "./sample-activity-meter-b"
import { researchFoodDirectionsB, researchFoodIllustrationB, type ResearchedFoodB } from "./researched-food-b"
import { PlaceServiceActionsB } from "../place/place-service-actions-b"
import styles from "./researched-food-panel-b.module.css"

type Locale = "en" | "ko" | "ja"
const COPY = {
  en: { title: "Worth a stop", subtitle: "Food, coffee & a good evening", guide: "Selected guide", why: "Why this stop", directions: "Directions", map: "On map", source: "About this pick", truth: "Selected from published guides, not a live popularity ranking. Check today’s hours and menu with the venue.", checked: "Research checked", food: "Food", cafe: "Coffee & bakery", bar: "Bars" },
  ko: { title: "들러볼 만한 곳", subtitle: "맛있는 한 끼, 커피, 좋은 저녁", guide: "에디터 픽", why: "이곳을 고른 이유", directions: "길찾기", map: "지도에서 보기", source: "선정 정보", truth: "공개 가이드를 바탕으로 골랐어요. 실시간 인기 순위는 아니며, 오늘의 영업시간과 메뉴는 매장에 확인해 주세요.", checked: "리서치 확인", food: "식사", cafe: "커피·베이커리", bar: "바·주점" },
  ja: { title: "立ち寄りたい場所", subtitle: "おいしい食事、コーヒー、いい夜", guide: "編集ピック", why: "選んだ理由", directions: "ルート", map: "地図で見る", source: "選定について", truth: "公開ガイドから選んだスポットです。リアルタイムの人気順位ではありません。当日の営業時間とメニューはお店にご確認ください。", checked: "調査確認", food: "食事", cafe: "カフェ・ベーカリー", bar: "バー" },
} as const

export function ResearchedFoodListB({ places, locale, onSelect }: { places: readonly ResearchedFoodB[]; locale: Locale; onSelect: (place: ResearchedFoodB) => void }) {
  if (!places.length) return null
  const copy = COPY[locale]
  return <section className={styles.section} data-testid="researched-food-list" aria-label={copy.title}>
    <header><div><h2>{copy.title}</h2><p>{copy.subtitle}</p></div><Utensils size={20} aria-hidden="true" /></header>
    <div className={styles.cards}>{places.map(place => <button type="button" className={styles.card} key={place.id} aria-label={`${place.name[locale]} · ${place.signature[locale]}`} data-research-id={place.id} onClick={() => onSelect(place)}>
      <FoodPhotoB {...researchFoodIllustrationB(place)} locale={locale} />
      <span className={styles.cardCopy}><small>{place.district[locale]} · {copy[place.kind]}</small><strong>{place.name[locale]}</strong><span>{place.signature[locale]}</span></span>
    </button>)}</div>
  </section>
}

export function ResearchedFoodPanelB({ place, locale, onClose, onMap, returnFocus }: { place: ResearchedFoodB; locale: Locale; onClose: () => void; onMap: () => void; returnFocus?: "offer" | "reservation" | "table" }) {
  const copy = COPY[locale]
  return <SheetB locale={locale} label={place.name[locale]} onClose={onClose} variant="detail" initialFocusSelector={returnFocus ? `[data-place-service='${returnFocus}']` : undefined} header={<span>{copy.title}</span>} footer={<div className={styles.actions}>
    <a href={researchFoodDirectionsB(place)} target="_blank" rel="noopener noreferrer"><Navigation size={18} />{copy.directions}</a>
    <button type="button" onClick={onMap}><MapPin size={18} />{copy.map}</button>
  </div>}>
    <article className={styles.detail} data-testid="researched-food-detail" data-research-id={place.id} data-origin="EDITORIAL_RESEARCH">
      <div className={styles.identity}><FoodPhotoB {...researchFoodIllustrationB(place)} locale={locale} /><div><small>{copy.guide} · {copy[place.kind]}</small><h2>{place.name[locale]}</h2><p>{place.signature[locale]}</p><span>{place.district[locale]}</span></div></div>
      <PlaceServiceActionsB placeId={place.id} locale={locale} />
      <SampleActivityMeterB venueId={place.id} city={place.city} locale={locale} fallback={null} />
      <div className={styles.reason}><h3>{copy.why}</h3><p>{place.reason[locale]}</p></div>
      <details className={styles.disclosure}><summary>{copy.source}<ChevronRight size={16} /></summary><p>{copy.truth}</p><p>{copy.checked}: {place.checkedAt}</p><p>{place.address}</p><ul>{place.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul></details>
    </article>
  </SheetB>
}
