import type { ServiceItem } from "@/lib/types"

const KOREAN: Record<string, { name: string; location: string; eta: string }> = {
  f1: { name: "후라이드 치킨", location: "서울 서대문구", eta: "30분" },
  f2: { name: "떡볶이", location: "서울 중구", eta: "20분" },
  f3: { name: "비빔밥", location: "서울 종로구", eta: "25분" },
  f4: { name: "김치찌개", location: "서울 강남구", eta: "35분" },
  f5: { name: "불고기", location: "서울 이태원", eta: "40분" },
  s1: { name: "K-뷰티 세트", location: "서울 명동", eta: "1일" },
  s2: { name: "한복 대여", location: "서울 북촌", eta: "4시간" },
  s3: { name: "K-팝 굿즈", location: "서울 홍대", eta: "2시간" },
  s4: { name: "한국 전통차 세트", location: "서울 인사동", eta: "3시간" },
  m1: { name: "건강검진", location: "강남 메디컬센터", eta: "2시간" },
  m2: { name: "치아 스케일링", location: "서울 치과", eta: "1시간" },
  m3: { name: "피부 관리", location: "압구정 K-뷰티 클리닉", eta: "90분" },
}

export function serviceCopy(item: ServiceItem, lang: "ko" | "en") {
  if (lang === "ko" && KOREAN[item.id]) return KOREAN[item.id]
  return { name: item.name, location: item.location, eta: item.etaLabel }
}
