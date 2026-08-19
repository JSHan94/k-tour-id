import { createHash } from "node:crypto"
import { createWriteStream } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { Readable, Transform } from "node:stream"
import { pipeline } from "node:stream/promises"
import { pathToFileURL } from "node:url"
import { CITY_SOURCES, LOCALDATA_SOURCE } from "./source-config.mjs"

// LOCALDATA's file host rejects non-browser user agents before issuing its download session.
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"
const BROWSER_HEADERS = {
  "user-agent": USER_AGENT,
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "ko-KR,ko;q=0.9,en;q=0.8",
}

function cookieHeader(response) {
  const values = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : [response.headers.get("set-cookie")].filter(Boolean)
  return values.map((value) => value.split(";", 1)[0]).join("; ")
}

export async function downloadCity(cityId, outputDirectory) {
  const city = CITY_SOURCES[cityId]
  if (!city) throw new Error(`Unsupported city: ${cityId}`)
  const info = await fetch(LOCALDATA_SOURCE.infoUrl, { headers: BROWSER_HEADERS })
  if (!info.ok) throw new Error(`LOCALDATA info failed: ${info.status}`)
  const cookies = cookieHeader(info)
  const infoHtml = await info.text()
  const csrf = infoHtml.match(/<meta\s+name=["']_csrf["']\s+content=["']([^"']+)["']/i)?.[1]
  const csrfHeader = infoHtml.match(/<meta\s+name=["']_csrf_header["']\s+content=["']([^"']+)["']/i)?.[1] ?? "X-XSRF-TOKEN"
  const commonHeaders = { ...BROWSER_HEADERS, referer: LOCALDATA_SOURCE.infoUrl, cookie: cookies, ...(csrf ? { [csrfHeader]: csrf } : {}) }
  await fetch(new URL(LOCALDATA_SOURCE.validationPath, LOCALDATA_SOURCE.infoUrl), { headers: commonHeaders })

  const downloadUrl = new URL(LOCALDATA_SOURCE.downloadPath, LOCALDATA_SOURCE.infoUrl)
  downloadUrl.searchParams.set("orgCode", city.orgCode)
  const response = await fetch(downloadUrl, { headers: commonHeaders })
  if (!response.ok || !response.body) throw new Error(`LOCALDATA ${cityId} download failed: ${response.status}`)
  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.toLowerCase().includes("text/csv")) throw new Error(`Unexpected LOCALDATA content type: ${contentType}`)

  await mkdir(outputDirectory, { recursive: true })
  const destination = path.join(outputDirectory, `${cityId}-general-restaurants.csv`)
  const hash = createHash("sha256")
  let byteSize = 0
  const meter = new Transform({
    transform(chunk, _encoding, callback) {
      byteSize += chunk.length
      hash.update(chunk)
      callback(null, chunk)
    },
  })
  await pipeline(Readable.fromWeb(response.body), meter, createWriteStream(destination))
  const metadata = {
    sourceId: LOCALDATA_SOURCE.id,
    cityId,
    orgCode: city.orgCode,
    downloadUrl: downloadUrl.toString(),
    fetchedAt: new Date(response.headers.get("date") ?? Date.now()).toISOString(),
    contentType,
    contentDisposition: response.headers.get("content-disposition"),
    encoding: LOCALDATA_SOURCE.encoding,
    byteSize,
    sha256: hash.digest("hex"),
  }
  await writeFile(`${destination}.meta.json`, `${JSON.stringify(metadata, null, 2)}\n`)
  return { destination, metadata }
}

async function main() {
  const cityArg = process.argv.find((argument) => argument.startsWith("--city="))?.split("=")[1] ?? "all"
  const outArg = process.argv.find((argument) => argument.startsWith("--out="))?.slice("--out=".length)
  const outputDirectory = outArg ?? process.env.ONDO_VENUE_CACHE_DIR ?? path.join(os.tmpdir(), "ondo-venues-cache")
  const cities = cityArg === "all" ? Object.keys(CITY_SOURCES) : [cityArg]
  const results = []
  for (const city of cities) results.push(await downloadCity(city, outputDirectory))
  console.log(JSON.stringify(results.map(({ destination, metadata }) => ({ destination, ...metadata })), null, 2))
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
