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

const JAPANESE_DISTRICTS: Record<string, string> = {
  "seoul:강남구": "江南区", "seoul:광진구": "広津区", "seoul:마포구": "麻浦区",
  "seoul:서대문구": "西大門区", "seoul:성동구": "城東区", "seoul:송파구": "松坡区",
  "seoul:영등포구": "永登浦区", "seoul:용산구": "龍山区", "seoul:종로구": "鍾路区", "seoul:중구": "中区",
  "busan:기장군": "機張郡", "busan:남구": "南区", "busan:동구": "東区", "busan:동래구": "東萊区",
  "busan:부산진구": "釜山鎮区", "busan:서구": "西区", "busan:수영구": "水営区", "busan:영도구": "影島区",
  "busan:중구": "中区", "busan:해운대구": "海雲台区",
}

const KATAKANA_ROWS: Record<string, readonly string[]> = {
  "": ["ア", "エ", "ヤ", "イェ", "オ", "エ", "ヨ", "イェ", "オ", "ワ", "ウェ", "ウェ", "ヨ", "ウ", "ウォ", "ウェ", "ウィ", "ユ", "ウ", "ウィ", "イ"],
  g: ["ガ", "ゲ", "ギャ", "ギェ", "ゴ", "ゲ", "ギョ", "ギェ", "ゴ", "グァ", "グェ", "グェ", "ギョ", "グ", "グォ", "グェ", "グィ", "ギュ", "グ", "グィ", "ギ"],
  kk: ["カ", "ケ", "キャ", "キェ", "コ", "ケ", "キョ", "キェ", "コ", "クァ", "クェ", "クェ", "キョ", "ク", "クォ", "クェ", "クィ", "キュ", "ク", "クィ", "キ"],
  n: ["ナ", "ネ", "ニャ", "ニェ", "ノ", "ネ", "ニョ", "ニェ", "ノ", "ヌァ", "ヌェ", "ヌェ", "ニョ", "ヌ", "ヌォ", "ヌェ", "ヌィ", "ニュ", "ヌ", "ヌィ", "ニ"],
  d: ["ダ", "デ", "ディャ", "ディェ", "ド", "デ", "ディョ", "ディェ", "ド", "ドァ", "ドェ", "ドェ", "ディョ", "ドゥ", "ドォ", "ドェ", "ドィ", "デュ", "ドゥ", "ドィ", "ディ"],
  tt: ["タ", "テ", "ティャ", "ティェ", "ト", "テ", "ティョ", "ティェ", "ト", "トァ", "トェ", "トェ", "ティョ", "トゥ", "トォ", "トェ", "トィ", "テュ", "トゥ", "トィ", "ティ"],
  r: ["ラ", "レ", "リャ", "リェ", "ロ", "レ", "リョ", "リェ", "ロ", "ルァ", "ルェ", "ルェ", "リョ", "ル", "ルォ", "ルェ", "ルィ", "リュ", "ル", "ルィ", "リ"],
  m: ["マ", "メ", "ミャ", "ミェ", "モ", "メ", "ミョ", "ミェ", "モ", "ムァ", "ムェ", "ムェ", "ミョ", "ム", "ムォ", "ムェ", "ムィ", "ミュ", "ム", "ムィ", "ミ"],
  b: ["バ", "ベ", "ビャ", "ビェ", "ボ", "ベ", "ビョ", "ビェ", "ボ", "ブァ", "ブェ", "ブェ", "ビョ", "ブ", "ブォ", "ブェ", "ブィ", "ビュ", "ブ", "ブィ", "ビ"],
  pp: ["パ", "ペ", "ピャ", "ピェ", "ポ", "ペ", "ピョ", "ピェ", "ポ", "プァ", "プェ", "プェ", "ピョ", "プ", "プォ", "プェ", "プィ", "ピュ", "プ", "プィ", "ピ"],
  s: ["サ", "セ", "シャ", "シェ", "ソ", "セ", "ショ", "シェ", "ソ", "スァ", "スェ", "スェ", "ショ", "ス", "スォ", "スェ", "スィ", "シュ", "ス", "スィ", "シ"],
  ss: ["サ", "セ", "シャ", "シェ", "ソ", "セ", "ショ", "シェ", "ソ", "スァ", "スェ", "スェ", "ショ", "ス", "スォ", "スェ", "スィ", "シュ", "ス", "スィ", "シ"],
  j: ["ジャ", "ジェ", "ジャ", "ジェ", "ジョ", "ジェ", "ジョ", "ジェ", "ジョ", "ジュァ", "ジュェ", "ジュェ", "ジョ", "ジュ", "ジュォ", "ジュェ", "ジュィ", "ジュ", "ジュ", "ジュィ", "ジ"],
  jj: ["ジャ", "ジェ", "ジャ", "ジェ", "ジョ", "ジェ", "ジョ", "ジェ", "ジョ", "ジュァ", "ジュェ", "ジュェ", "ジョ", "ジュ", "ジュォ", "ジュェ", "ジュィ", "ジュ", "ジュ", "ジュィ", "ジ"],
  ch: ["チャ", "チェ", "チャ", "チェ", "チョ", "チェ", "チョ", "チェ", "チョ", "チュァ", "チュェ", "チュェ", "チョ", "チュ", "チュォ", "チュェ", "チュィ", "チュ", "チュ", "チュィ", "チ"],
  k: ["カ", "ケ", "キャ", "キェ", "コ", "ケ", "キョ", "キェ", "コ", "クァ", "クェ", "クェ", "キョ", "ク", "クォ", "クェ", "クィ", "キュ", "ク", "クィ", "キ"],
  t: ["タ", "テ", "ティャ", "ティェ", "ト", "テ", "ティョ", "ティェ", "ト", "トァ", "トェ", "トェ", "ティョ", "トゥ", "トォ", "トェ", "トィ", "テュ", "トゥ", "トィ", "ティ"],
  p: ["パ", "ペ", "ピャ", "ピェ", "ポ", "ペ", "ピョ", "ピェ", "ポ", "プァ", "プェ", "プェ", "ピョ", "プ", "プォ", "プェ", "プィ", "ピュ", "プ", "プィ", "ピ"],
  h: ["ハ", "ヘ", "ヒャ", "ヒェ", "ホ", "ヘ", "ヒョ", "ヒェ", "ホ", "ファ", "フェ", "フェ", "ヒョ", "フ", "フォ", "フェ", "フィ", "ヒュ", "フ", "フィ", "ヒ"],
}

const KATAKANA_FINALS = ["", "ク", "ク", "ク", "ン", "ン", "ン", "ッ", "ル", "ル", "ル", "ル", "ル", "ル", "ル", "ル", "ム", "プ", "プ", "ッ", "ッ", "ン", "ッ", "ッ", "ク", "ッ", "プ", ""] as const

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

export function transliterateKoreanForJapanese(value: string) {
  return Array.from(value).map((character) => {
    const code = character.charCodeAt(0) - 0xac00
    if (code < 0 || code > 11171) return character
    const initial = Math.floor(code / 588)
    const medial = Math.floor((code % 588) / 28)
    const final = code % 28
    return `${KATAKANA_ROWS[INITIALS[initial]]?.[medial] ?? character}${KATAKANA_FINALS[final]}`
  }).join("")
}

export function venueDisplayName(name: string, locale: "en" | "ko" | "ja") {
  if (locale === "ko") return name
  return locale === "ja" ? transliterateKoreanForJapanese(name) : romanizeKorean(name)
}

export function venueNamePresentation(name: string, locale: "en" | "ko" | "ja") {
  const transliteration = locale === "ja" ? transliterateKoreanForJapanese(name) : romanizeKorean(name)
  return {
    officialName: name,
    officialNameLabel: locale === "ko" ? "공식 출처 한글명" : locale === "ja" ? "韓国語の公式名称" : "Official Korean source name",
    transliteration,
    transliterationLabel: locale === "ko"
      ? "길찾기용 생성 로마자 표기 · 공식 영문명 아님"
      : locale === "ja"
        ? "読みやすさのための自動カタカナ表記・公式日本語名ではありません"
        : "Transliterated for navigation · Generated, not an official English name",
  }
}

export function venueDistrictLabel(cityId: "seoul" | "busan", districtId: string, locale: "en" | "ko" | "ja") {
  if (locale === "ko") return districtId
  if (locale === "ja") return JAPANESE_DISTRICTS[`${cityId}:${districtId}`] ?? transliterateKoreanForJapanese(districtId)
  return DISTRICTS[`${cityId}:${districtId}`] ?? romanizeKorean(districtId)
}

export function venueLabelById(id: string, locale: "en" | "ko" | "ja") {
  const venue = canonicalMapVenueById(id)
  return venue ? venueDisplayName(venue.name.ko, locale) : undefined
}
import { canonicalMapVenueById } from "./map-data"
