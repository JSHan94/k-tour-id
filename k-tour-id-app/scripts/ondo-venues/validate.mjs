import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { epsg5174ToWgs84 } from "./epsg5174.mjs"
import { CITY_SOURCES, DISTRICT_CATEGORY_QUOTA } from "./source-config.mjs"

export function validateDataset(dataset, provenance) {
  const errors = []
  const venues = dataset.venues ?? []
  const ids = new Set()
  const sourceIds = new Set()
  if (venues.length !== 400) errors.push(`Expected 400 venues, received ${venues.length}`)
  for (const cityId of Object.keys(CITY_SOURCES)) {
    const city = venues.filter((venue) => venue.cityId === cityId)
    if (city.length !== 200) errors.push(`${cityId} must contain 200 venues, received ${city.length}`)
    for (const districtId of CITY_SOURCES[cityId].districts) {
      const district = city.filter((venue) => venue.districtId === districtId)
      if (district.length !== 20) errors.push(`${cityId}/${districtId} must contain 20 venues, received ${district.length}`)
      for (const [category, quota] of Object.entries(DISTRICT_CATEGORY_QUOTA)) {
        const count = district.filter((venue) => venue.primaryCategory === category).length
        if (count !== quota) errors.push(`${cityId}/${districtId}/${category} expected ${quota}, received ${count}`)
      }
    }
  }
  for (const venue of venues) {
    if (ids.has(venue.id)) errors.push(`Duplicate canonical id ${venue.id}`)
    ids.add(venue.id)
    if (sourceIds.has(venue.sourceIds.moisManagementId)) errors.push(`Duplicate management id ${venue.sourceIds.moisManagementId}`)
    sourceIds.add(venue.sourceIds.moisManagementId)
    if (!venue.id.startsWith("mois-") || ["seoul-seongsu-gukbap", "seoul-euljiro-nogari", "seoul-mangwon-kalguksu", "busan-jagalchi-grill"].includes(venue.id)) errors.push(`Unsafe or fixture-colliding id ${venue.id}`)
    if (venue.licenseStatus.value !== "ACTIVE_LICENSE_RECORD" || venue.licenseStatus.truth !== "OFFICIAL_SOURCE") errors.push(`${venue.id} has no official active-license evidence`)
    if (venue.heat.score !== null || venue.heat.truth !== "UNKNOWN") errors.push(`${venue.id} invents heat`)
    for (const [field, evidence] of Object.entries(venue.facts)) if (evidence.value !== null || evidence.truth !== "UNKNOWN") errors.push(`${venue.id}.${field} must remain UNKNOWN`)
    if (venue.name.en.value !== null || venue.name.en.truth !== "UNKNOWN") errors.push(`${venue.id}.name.en must remain UNKNOWN`)
    const bounds = CITY_SOURCES[venue.cityId].bounds
    if (venue.location.latitude < bounds.south || venue.location.latitude > bounds.north || venue.location.longitude < bounds.west || venue.location.longitude > bounds.east) errors.push(`${venue.id} outside ${venue.cityId} bounds`)
  }
  for (const vector of provenance.coordinateTransformation.validationVectors) {
    const converted = epsg5174ToWgs84(vector.source[0], vector.source[1])
    if (Math.abs(converted.longitude - vector.expectedWgs84[0]) > vector.toleranceDegrees || Math.abs(converted.latitude - vector.expectedWgs84[1]) > vector.toleranceDegrees) errors.push(`Coordinate validation vector failed: ${vector.source.join(",")}`)
  }
  return errors
}

async function main() {
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
  const directory = process.argv.find((value) => value.startsWith("--data="))?.slice("--data=".length) ?? path.resolve(scriptDirectory, "../../data/ondo-venues")
  const [dataset, provenance] = await Promise.all([
    readFile(path.join(directory, "canonical-venues.json"), "utf8").then(JSON.parse),
    readFile(path.join(directory, "provenance-manifest.json"), "utf8").then(JSON.parse),
  ])
  const errors = validateDataset(dataset, provenance)
  if (errors.length) throw new Error(errors.join("\n"))
  console.log(`PASS: ${dataset.venues.length} canonical venues; Seoul ${dataset.counts.byCity.seoul}; Busan ${dataset.counts.byCity.busan}`)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
