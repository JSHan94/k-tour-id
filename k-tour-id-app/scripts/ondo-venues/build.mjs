import { createHash } from "node:crypto"
import { readFile, mkdir, stat, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { rowsAsObjects } from "./csv.mjs"
import { candidateFromRow, deduplicateCandidates, selectQuota, UNKNOWN_FIELD_NAMES } from "./normalize.mjs"
import { CITY_SOURCES, DISTRICT_CATEGORY_QUOTA, LOCALDATA_SOURCE } from "./source-config.mjs"

function argument(name) {
  const prefix = `--${name}=`
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length)
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex")
}

async function loadCity(filePath, cityId) {
  const raw = await readFile(filePath)
  const text = new TextDecoder("euc-kr").decode(raw)
  const candidates = []
  let sourceRowCount = 0
  rowsAsObjects(text, (row) => {
    sourceRowCount += 1
    const candidate = candidateFromRow(row, cityId, CITY_SOURCES[cityId])
    if (candidate) candidates.push(candidate)
  })
  return {
    selected: selectQuota(deduplicateCandidates(candidates), CITY_SOURCES[cityId]),
    source: { cityId, orgCode: CITY_SOURCES[cityId].orgCode, fileName: path.basename(filePath), byteSize: raw.byteLength, sha256: sha256(raw), sourceRowCount, eligibleCandidateCount: candidates.length },
  }
}

function geoJson(venues) {
  return {
    type: "FeatureCollection",
    schemaVersion: "ondo-venues-1.0.0",
    features: venues.map((venue) => ({
      type: "Feature",
      id: venue.id,
      geometry: { type: "Point", coordinates: [venue.location.longitude, venue.location.latitude] },
      properties: {
        id: venue.id,
        cityId: venue.cityId,
        districtId: venue.districtId,
        nameKo: venue.name.ko.value,
        nameEn: null,
        primaryCategory: venue.primaryCategory,
        licenseStatus: "ACTIVE_LICENSE_RECORD",
        openNow: null,
        ondoScore: null,
        heatTruth: "UNKNOWN",
        sourceSnapshotAt: venue.sourceSnapshotAt,
        sourceRefId: LOCALDATA_SOURCE.id,
      },
    })),
  }
}

function countBy(venues, key) {
  return Object.fromEntries([...new Set(venues.map((venue) => venue[key]))].sort((a, b) => a.localeCompare(b, "ko")).map((value) => [value, venues.filter((venue) => venue[key] === value).length]))
}

function countByCityDistrict(venues) {
  return Object.fromEntries([...new Set(venues.map((venue) => `${venue.cityId}/${venue.districtId}`))].sort((a, b) => a.localeCompare(b, "ko")).map((value) => [value, venues.filter((venue) => `${venue.cityId}/${venue.districtId}` === value).length]))
}

export async function build({ seoulFile, busanFile, outputDirectory, fetchedAt }) {
  if (!seoulFile || !busanFile) throw new Error("Both --seoul and --busan official LOCALDATA CSV paths are required")
  const timestamp = fetchedAt ?? new Date(Math.max((await stat(seoulFile)).mtimeMs, (await stat(busanFile)).mtimeMs)).toISOString()
  const [seoul, busan] = await Promise.all([loadCity(seoulFile, "seoul"), loadCity(busanFile, "busan")])
  const venues = [...seoul.selected, ...busan.selected].map((venue) => ({ ...venue, sourceSnapshotAt: timestamp }))
  const dataset = {
    schemaVersion: "ondo-venues-1.0.0",
    generatedAt: timestamp,
    truthNotice: "Records prove an active food-service license at the LOCALDATA snapshot. They do not prove current opening hours, popularity, tourist suitability, card acceptance, menu, price, or ONDO heat.",
    counts: { total: venues.length, byCity: countBy(venues, "cityId"), byCityDistrict: countByCityDistrict(venues), byCategory: countBy(venues, "primaryCategory") },
    venues,
  }
  const provenance = {
    schemaVersion: "ondo-venues-provenance-1.0.0",
    generatedAt: timestamp,
    source: {
      ...LOCALDATA_SOURCE,
      publicDownloadRequiresApiKey: false,
      sourceFiles: [seoul.source, busan.source],
      sourceFieldEvidence: {
        nameKo: "사업장명",
        primaryCategory: "업태구분명 (normalized; raw retained as sourceCategory)",
        address: ["도로명주소", "지번주소"],
        coordinates: ["좌표정보(X)", "좌표정보(Y)"],
        activeLicense: ["영업상태명=영업/정상", "상세영업상태명=영업"],
        sourceModifiedAt: "최종수정시점",
      },
    },
    selection: {
      objective: "A reproducible, geographically balanced directory seed; not a popularity or quality ranking.",
      cityQuota: { seoul: 200, busan: 200 },
      districtsPerCity: 10,
      recordsPerDistrict: 20,
      categoryQuotaPerDistrict: DISTRICT_CATEGORY_QUOTA,
      order: "SHA-256(city|district|category|managementId); first N after exact name+address deduplication",
      exclusions: ["non-active license", "missing name/address/coordinate", "outside city bounds", "unmapped category", "exact normalized name+address duplicate"],
    },
    unknownByPolicy: UNKNOWN_FIELD_NAMES,
    heatPolicy: "All published records carry heat.score=null and heat.truth=UNKNOWN. A future measured or SIMULATED heat overlay must be joined separately and must not mutate source facts.",
    imagePolicy: "No images are downloaded or published. Image rights are UNKNOWN until a separately licensed source is recorded.",
    coordinateTransformation: {
      from: "EPSG:5174 Korean 1985 / Modified Central Belt",
      to: "EPSG:4326 WGS 84",
      operation: "Inverse Transverse Mercator + EPSG Korean 1985 to WGS 84 (1) Molodensky-Badekas coordinate-frame transformation",
      epsgReference: "https://epsg.org/crs_5174/Korean-1985-Modified-Central-Belt.html",
      validationVectors: [
        { source: [198774.650399989, 453349.61464659], expectedWgs84: [126.9869151469787, 37.58244674288366], toleranceDegrees: 1e-7 },
        { source: [385182.895154091, 179636.640850239], expectedWgs84: [129.03165042328862, 35.09881516385051], toleranceDegrees: 1e-7 },
      ],
    },
    optionalEnrichment: {
      ktoTourApi: { status: "BLOCKED_MISSING_KEY", requiredEnv: ["KTO_TOUR_API_SERVICE_KEY", "KTO_TOUR_API_MOBILE_APP"], effect: "Only KTO matching/enrichment is blocked; the 400 official LOCALDATA records are complete without it.", portal: "https://www.data.go.kr/data/15101578/openapi.do" },
      moisOpenApi: { status: "OPTIONAL_KEY_NOT_CONFIGURED", requiredEnv: ["DATA_GO_KR_SERVICE_KEY"], effect: "Incremental API refresh is blocked; public city CSV refresh remains available.", portal: LOCALDATA_SOURCE.apiPortalUrl },
    },
  }

  await mkdir(outputDirectory, { recursive: true })
  await Promise.all([
    writeFile(path.join(outputDirectory, "canonical-venues.json"), `${JSON.stringify(dataset, null, 2)}\n`),
    writeFile(path.join(outputDirectory, "canonical-venues.geojson"), `${JSON.stringify(geoJson(venues), null, 2)}\n`),
    writeFile(path.join(outputDirectory, "canonical-venues-map.json"), `${JSON.stringify(geoJson(venues), null, 2)}\n`),
    writeFile(path.join(outputDirectory, "provenance-manifest.json"), `${JSON.stringify(provenance, null, 2)}\n`),
  ])
  return { dataset, provenance }
}

async function main() {
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
  const result = await build({
    seoulFile: argument("seoul"),
    busanFile: argument("busan"),
    fetchedAt: argument("fetched-at"),
    outputDirectory: argument("out") ?? path.resolve(scriptDirectory, "../../data/ondo-venues"),
  })
  console.log(JSON.stringify(result.dataset.counts, null, 2))
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
