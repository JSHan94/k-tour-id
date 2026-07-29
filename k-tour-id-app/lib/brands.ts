// Real partner brands for the demo. `logo` points to a locally-embedded mark
// (public/logos/*) so nothing depends on a network at demo time; brands without
// a clean logo fall back to a brand-colored monogram.

export interface Brand {
  name: string
  logo?: string
  color: string
  mono?: string
}

export const BRANDS = {
  baemin: { name: "배달의민족", logo: "/logos/baemin.png", color: "#2AC1BC" },
  oliveyoung: { name: "Olive Young", logo: "/logos/oliveyoung.png", color: "#94c01f" },
  coupangeats: { name: "쿠팡이츠", color: "#1aafe6", mono: "쿠" },
  yogiyo: { name: "요기요", logo: "/logos/yogiyo.png", color: "#fa0050" },
  socar: { name: "쏘카", logo: "/logos/socar.png", color: "#2d6df6" },
  tmoney: { name: "T-money", logo: "/logos/tmoney.png", color: "#00a0e9" },
  kakaopay: { name: "카카오페이", logo: "/logos/kakaopay.png", color: "#ffeb00" },
  naver: { name: "NAVER", logo: "/logos/naver.png", color: "#03c75a" },
  museum: { name: "국립중앙박물관", logo: "/logos/museum.png", color: "#2e2e2e" },
  starbucks: { name: "스타벅스", logo: "/logos/starbucks.png", color: "#00704a" },
  coupang: { name: "쿠팡", logo: "/logos/coupang.png", color: "#e02020" },
  omnione: { name: "OmniOne", logo: "/logos/omnione.png", color: "#1f3a5f" },
  raonsecure: { name: "RaonSecure", logo: "/logos/raonsecure.png", color: "#0a3d91" },
} as const

export type BrandKey = keyof typeof BRANDS

/** map the free-text partner field on service items to a brand key */
export function partnerToBrand(partner?: string): BrandKey | null {
  switch (partner) {
    case "Baemin":
      return "baemin"
    case "Yogiyo":
      return "yogiyo"
    case "Coupang Eats":
      return "coupangeats"
    case "Olive Young":
      return "oliveyoung"
    default:
      return null
  }
}
