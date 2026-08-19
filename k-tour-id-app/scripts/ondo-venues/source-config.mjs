export const LOCALDATA_SOURCE = {
  id: "MOIS_LOCALDATA_GENERAL_RESTAURANTS",
  agency: "Ministry of the Interior and Safety (MOIS)",
  datasetNameKo: "행정안전부_식품_일반음식점",
  infoUrl: "https://file.localdata.go.kr/file/general_restaurants/info",
  dataPortalUrl: "https://www.data.go.kr/data/15045016/fileData.do",
  apiPortalUrl: "https://www.data.go.kr/data/15154916/openapi.do",
  downloadPath: "/file/download/general_restaurants/info",
  validationPath: "/file/validate/download-count",
  sourceCrs: "EPSG:5174",
  encoding: "euc-kr",
  license: {
    code: "PUBLIC_DATA_UNRESTRICTED",
    labelKo: "이용허락범위 제한 없음",
    cost: "FREE",
  },
  cadence: "DAILY_WITH_REPORTED_TWO_DAY_LAG",
}

export const CITY_SOURCES = {
  seoul: {
    orgCode: "6110000_ALL",
    cityNameKo: "서울특별시",
    bounds: { south: 37.40, west: 126.70, north: 37.72, east: 127.30 },
    districts: ["종로구", "중구", "용산구", "성동구", "마포구", "강남구", "영등포구", "송파구", "광진구", "서대문구"],
  },
  busan: {
    orgCode: "6260000_ALL",
    cityNameKo: "부산광역시",
    bounds: { south: 34.85, west: 128.70, north: 35.40, east: 129.40 },
    districts: ["중구", "서구", "동구", "영도구", "부산진구", "동래구", "남구", "해운대구", "수영구", "기장군"],
  },
}

export const DISTRICT_CATEGORY_QUOTA = {
  korean: 5,
  casual: 3,
  japanese: 2,
  chinese: 2,
  global: 3,
  night: 3,
  specialty: 2,
}

export const REQUIRED_ENV = {
  localdataPublicCsv: [],
  moisApiOptional: ["DATA_GO_KR_SERVICE_KEY"],
  ktoEnrichmentOptional: ["KTO_TOUR_API_SERVICE_KEY", "KTO_TOUR_API_MOBILE_APP"],
}
