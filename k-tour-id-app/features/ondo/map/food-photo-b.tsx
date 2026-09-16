"use client"

import { useState } from "react"
import { Beer, Coffee, Croissant, Fish, Flame, Martini, Soup, Utensils } from "lucide-react"
import styles from "./food-photo-b.module.css"

const COPY = {
  en: { label: "Food illustration", alt: "Illustrative food image, not a photo of this venue or its menu", category: "Category guide", categoryAlt: "Category illustration, not a photo of this venue or its menu", noodles: "Noodles", grill: "From the grill", soup: "Soup & broth", seafood: "Seafood", bakery: "From the bakery", coffee: "Coffee", cocktail: "Cocktails", beer: "Craft beer", food: "Food" },
  ko: { label: "음식 예시", alt: "음식 분위기 예시 이미지. 이 장소나 실제 메뉴 사진이 아닙니다", category: "메뉴 분류 안내", categoryAlt: "메뉴 분류 일러스트. 이 장소나 실제 메뉴 사진이 아닙니다", noodles: "면 요리", grill: "구이 요리", soup: "국물 요리", seafood: "해산물", bakery: "베이커리", coffee: "커피", cocktail: "칵테일", beer: "수제맥주", food: "식사" },
  ja: { label: "料理イメージ", alt: "料理のイメージ。この店や実際のメニューの写真ではありません", category: "メニューの分類", categoryAlt: "メニュー分類のイラスト。この店や実際のメニューの写真ではありません", noodles: "麺料理", grill: "グリル料理", soup: "スープ料理", seafood: "魚介料理", bakery: "ベーカリー", coffee: "コーヒー", cocktail: "カクテル", beer: "クラフトビール", food: "食事" },
} as const

export type FoodPhotoSubjectB = "noodles" | "grill" | "soup" | "seafood" | "bakery" | "coffee" | "cocktail" | "beer" | "food"
export type FoodPhotographB = { src: string; alt: Record<"en" | "ko" | "ja", string>; objectPosition?: "50% 0%" }
const CATEGORY_ICONS = { noodles: Soup, grill: Flame, soup: Soup, seafood: Fish, bakery: Croissant, coffee: Coffee, cocktail: Martini, beer: Beer, food: Utensils }

/** Only approved local photographs use the photo presentation. All existing
 * illustrative assets retain their explicit label; metadata is not a service capability. */
export function FoodPhotoB({ src: illustration, photograph, locale, compact = false, subject = "food" }: { src: string | null; photograph?: FoodPhotographB; locale: "en" | "ko" | "ja"; compact?: boolean; subject?: FoodPhotoSubjectB }) {
  const [failedSource, setFailedSource] = useState<string | null>(null)
  const [loadedSource, setLoadedSource] = useState<string | null>(null)
  const copy = COPY[locale]
  const src = photograph?.src ?? illustration
  if (src === null) {
    const Icon = CATEGORY_ICONS[subject]
    return <figure className={styles.photo} role="img" aria-label={`${copy[subject]} · ${copy.categoryAlt}`} data-food-photo="category-placeholder" data-food-subject={subject} data-compact={compact} data-photo-state="not-provided">
      <div className={styles.categoryArt} aria-hidden="true"><Icon size={32} strokeWidth={1.3} /><strong>{copy[subject]}</strong></div>
      <figcaption>{copy.category}</figcaption>
    </figure>
  }
  const failed = failedSource === src
  const alt = photograph?.alt[locale] ?? copy.alt
  const unavailable = locale === "ko" ? "사진을 불러오지 못했어요" : locale === "ja" ? "写真を読み込めませんでした" : "Photo unavailable"
  const photoLabel = locale === "ko" ? "매장 사진" : locale === "ja" ? "お店の写真" : "Place photo"
  return <figure className={styles.photo} data-food-photo={photograph ? "photograph" : "illustration"} data-food-subject={subject} data-compact={compact} data-photo-state={failed ? "error" : loadedSource === src ? "loaded" : "pending"}>
    {failed ? <div className={styles.failed} role="img" aria-label={`${unavailable}. ${alt}`}><Utensils aria-hidden="true" /><span>{unavailable}</span></div> : <img src={src} alt={alt} style={photograph?.objectPosition ? { objectPosition: photograph.objectPosition } : undefined} width={720} height={720} decoding="async" loading="lazy" onLoad={() => setLoadedSource(src)} onError={() => setFailedSource(src)} />}
    {!failed && <figcaption>{photograph ? photoLabel : copy.label}</figcaption>}
  </figure>
}
