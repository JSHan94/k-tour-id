// Display formatters. Kept pure so screens stay presentational.

export function formatKRW(amount: number, opts: { sign?: boolean } = {}): string {
  const sign = opts.sign && amount > 0 ? "+" : amount < 0 ? "-" : ""
  const abs = Math.abs(Math.round(amount))
  return `${sign}₩${abs.toLocaleString("en-US")}`
}

/** Korean-native: "1,520,768원" (ko-KR grouping, trailing 원). */
export function formatWon(amount: number, opts: { sign?: boolean } = {}): string {
  const sign = opts.sign && amount > 0 ? "+" : amount < 0 ? "-" : ""
  const abs = Math.abs(Math.round(amount))
  return `${sign}${abs.toLocaleString("ko-KR")}원`
}

/** Korean 만원 reading for hero figures: 1,520,768 → "152만원", 5,000,000 → "500만원". */
export function formatManwon(amount: number): string {
  const abs = Math.abs(amount)
  if (abs < 10000) return `${Math.round(amount).toLocaleString("ko-KR")}원`
  const man = Math.round(amount / 10000)
  return `${man.toLocaleString("ko-KR")}만원`
}

export function formatUSD(krw: number, rate: number, opts: { sign?: boolean } = {}): string {
  const usd = krw / rate
  const sign = opts.sign && usd > 0 ? "+" : usd < 0 ? "-" : ""
  const abs = Math.abs(usd)
  return `${sign}$${abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** "2025/07/23 | 10:34 AM" — matches the product mockup. */
export function formatTxDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  let h = d.getHours()
  const min = String(d.getMinutes()).padStart(2, "0")
  const ampm = h >= 12 ? "PM" : "AM"
  h = h % 12 || 12
  return `${y}/${m}/${day} | ${String(h).padStart(2, "0")}:${min} ${ampm}`
}

export function formatDateTime(iso: string, lang: "ko" | "en"): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat(lang === "ko" ? "ko-KR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function localizedNationality(nationality: string, lang: "ko" | "en"): string {
  if (lang === "en") return nationality
  const names: Record<string, string> = {
    "Republic of Korea": "대한민국",
    "South Korea": "대한민국",
    "United States": "미국",
    Vietnam: "베트남",
    Nigeria: "나이지리아",
    Germany: "독일",
    France: "프랑스",
    Japan: "일본",
    China: "중국",
  }
  return names[nationality] ?? nationality
}

export function daysUntil(iso: string): number {
  const time = new Date(iso).getTime()
  if (Number.isNaN(time)) return 0
  return Math.max(0, Math.ceil((time - Date.now()) / 86_400_000))
}

export function shortHash(hash: string): string {
  if (!hash) return ""
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`
}

export function shortAddress(addr: string | null | undefined): string {
  if (!addr) return ""
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

/** Render an Open DID in its native form, shortened: did:omn:8f2d…1d8e */
export function shortDid(did: string | null | undefined): string {
  if (!did) return ""
  const body = did.replace(/^did:omn:/, "")
  if (body.length <= 10) return `did:omn:${body}`
  return `did:omn:${body.slice(0, 4)}…${body.slice(-4)}`
}
