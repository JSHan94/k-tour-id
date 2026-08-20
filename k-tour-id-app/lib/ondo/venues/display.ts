const INITIALS = ["g", "kk", "n", "d", "tt", "r", "m", "b", "pp", "s", "ss", "", "j", "jj", "ch", "k", "t", "p", "h"]
const MEDIALS = ["a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae", "oe", "yo", "u", "wo", "we", "wi", "yu", "eu", "ui", "i"]
const FINALS = ["", "k", "k", "ks", "n", "nj", "nh", "t", "l", "lk", "lm", "lb", "ls", "lt", "lp", "lh", "m", "p", "ps", "t", "t", "ng", "t", "t", "k", "t", "p", "h"]

const DISTRICTS: Record<string, string> = {
  "seoul:강남구": "Gangnam-gu", "seoul:광진구": "Gwangjin-gu", "seoul:마포구": "Mapo-gu",
  "seoul:서대문구": "Seodaemun-gu", "seoul:성동구": "Seongdong-gu", "seoul:송파구": "Songpa-gu",
  "seoul:영등포구": "Yeongdeungpo-gu", "seoul:용산구": "Yongsan-gu", "seoul:종로구": "Jongno-gu", "seoul:중구": "Jung-gu",
  "busan:기장군": "Gijang-gun", "busan:남구": "Nam-gu", "busan:동구": "Dong-gu", "busan:동래구": "Dongnae-gu",
  "busan:부산진구": "Busanjin-gu", "busan:서구": "Seo-gu", "busan:수영구": "Suyeong-gu", "busan:영도구": "Yeongdo-gu",
  "busan:중구": "Jung-gu", "busan:해운대구": "Haeundae-gu",
}

export function romanizeKorean(value: string) {
  const result = Array.from(value).map((character) => {
    const code = character.charCodeAt(0) - 0xac00
    if (code < 0 || code > 11171) return character
    const initial = Math.floor(code / 588)
    const medial = Math.floor((code % 588) / 28)
    const final = code % 28
    return `${INITIALS[initial]}${MEDIALS[medial]}${FINALS[final]}`
  }).join("")
  return result.replace(/(^|[\s(])([a-z])/g, (_, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`)
}

export function venueDisplayName(name: string, locale: "en" | "ko") {
  return locale === "ko" ? name : romanizeKorean(name)
}

export function venueNamePresentation(name: string, locale: "en" | "ko") {
  const transliteration = romanizeKorean(name)
  return {
    officialName: name,
    officialNameLabel: locale === "ko" ? "공식 출처 한글명" : "Official Korean source name",
    transliteration,
    transliterationLabel: locale === "ko"
      ? "길찾기용 생성 로마자 표기 · 공식 영문명 아님"
      : "Transliterated for navigation · Generated, not an official English name",
  }
}

export function venueDistrictLabel(cityId: "seoul" | "busan", districtId: string, locale: "en" | "ko") {
  return locale === "ko" ? districtId : DISTRICTS[`${cityId}:${districtId}`] ?? romanizeKorean(districtId)
}

export function venueLabelById(id: string, locale: "en" | "ko") {
  const venue = canonicalMapVenueById(id)
  return venue ? venueDisplayName(venue.name.ko, locale) : undefined
}
import { canonicalMapVenueById } from "./map-data"
