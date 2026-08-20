import type { Locale } from "../../contracts/domain"

export type Copy = {
  brand: string
  search: string
  tabs: { ondo: string; my: string; tables: string; id: string }
  heat: { low: string; warming: string; rising: string; hot: string; peak: string; limited: string }
}

export const COPY: Record<Locale, Copy> = {
  en: {
    brand: "ONDO",
    search: "What do you want to eat in Korea?",
    tabs: { ondo: "ONDO", my: "My Korea", tables: "Tables", id: "ID" },
    heat: { low: "Low pulse", warming: "Warming", rising: "Rising", hot: "Hot now", peak: "Peak", limited: "Limited signals" },
  },
  ko: {
    brand: "온도",
    search: "한국에서 지금 무엇을 먹어볼까요?",
    tabs: { ondo: "ONDO", my: "나의 한국", tables: "모임", id: "신원" },
    heat: { low: "미온", warming: "데워지는 중", rising: "들썩임", hot: "지금 핫함", peak: "피크", limited: "신호 부족" },
  },
}
