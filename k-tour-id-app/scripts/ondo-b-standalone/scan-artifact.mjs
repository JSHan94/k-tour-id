import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises"
import { extname, relative, resolve } from "node:path"
import { createHash } from "node:crypto"
import {
  APP_ROOT,
  LEGACY_ARTIFACT_PATH,
  LEGACY_ARTIFACT_TEXT,
  EXPECTED_ROUTE_FILES,
  FORBIDDEN_QA_ARTIFACT_TEXT,
  HISTORICAL_B_PROJECT_ID,
  PUBLIC_FILES,
  STAGE_DIST,
  STAGE_ROOT,
} from "./policy.mjs"

const TEXT_EXTENSIONS = new Set([".css", ".html", ".js", ".json", ".mjs", ".txt", ".xml"])

async function filesBelow(root, prefix = "") {
  const entries = await readdir(root, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const item = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) files.push(...await filesBelow(resolve(root, entry.name), item))
    else files.push(item)
  }
  return files.sort()
}

async function digest(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex")
}

function fail(message, details = []) {
  throw new Error(`${message}${details.length ? `\n${details.join("\n")}` : ""}`)
}

export async function scanStandaloneArtifact() {
  const serverEntry = resolve(STAGE_DIST, "server/index.js")
  const hostingEntry = resolve(STAGE_DIST, ".openai/hosting.json")
  await Promise.all([stat(serverEntry), stat(hostingEntry)])

  const sourceRoutes = (await filesBelow(resolve(STAGE_ROOT, "app")))
    .filter((file) => /(?:page|route|layout)\.(?:ts|tsx)$/.test(file))
  if (JSON.stringify(sourceRoutes) !== JSON.stringify(EXPECTED_ROUTE_FILES)) {
    fail("Standalone source route census drifted", sourceRoutes)
  }

  const artifactFiles = await filesBelow(STAGE_DIST)
  const legacyPaths = artifactFiles.filter((file) => LEGACY_ARTIFACT_PATH.test(file))
  if (legacyPaths.length) fail("Legacy-named files were emitted", legacyPaths)

  const textHits = []
  for (const file of artifactFiles.filter((item) => TEXT_EXTENSIONS.has(extname(item)))) {
    const text = await readFile(resolve(STAGE_DIST, file), "utf8")
    for (const pattern of LEGACY_ARTIFACT_TEXT) {
      if (pattern.test(text)) textHits.push(`${file}: ${pattern}`)
    }
  }
  if (textHits.length) fail("Legacy route or product content was emitted", textHits)

  const qaHits = []
  for (const file of artifactFiles.filter((item) => TEXT_EXTENSIONS.has(extname(item)))) {
    const text = await readFile(resolve(STAGE_DIST, file), "utf8")
    for (const pattern of FORBIDDEN_QA_ARTIFACT_TEXT) {
      if (pattern.test(text)) qaHits.push(`${file}: ${pattern}`)
    }
  }
  if (qaHits.length) fail("Production QA controls were emitted", qaHits)

  const serverBundle = await readFile(serverEntry, "utf8")
  const emittedRoutes = [...serverBundle.matchAll(/\n\t\tpattern: "([^"]+)",/g)]
    .map((match) => match[1])
    .sort()
  const expectedEmittedRoutes = ["/", "/api/ondo/venues/:venueId", "/ondo-b"]
  if (JSON.stringify(emittedRoutes) !== JSON.stringify(expectedEmittedRoutes)) {
    fail("Vinext emitted route manifest drifted", emittedRoutes)
  }

  const emittedImages = artifactFiles.filter((file) => /\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(file))
  const expectedOg = "public/og-ktour-food-v1.png"
  if (!PUBLIC_FILES.includes(expectedOg)) fail("The production social card is absent from the public allowlist")
  const ogPath = expectedOg.replace(/^public\//, "")
  const emittedOg = emittedImages.find((file) => file.endsWith(`/${ogPath}`) || file === ogPath)
  if (!emittedOg) fail("The production K-TOUR ID social card is missing")
  if (await digest(resolve(STAGE_DIST, emittedOg)) !== await digest(resolve(APP_ROOT, expectedOg))) {
    fail("The emitted K-TOUR ID social card differs from the validated source")
  }
  for (const publicFile of PUBLIC_FILES) {
    const publicPath = publicFile.replace(/^public\//, "")
    const emittedFile = emittedImages.find((file) => file === publicPath || file.endsWith(`/${publicPath}`))
    if (!emittedFile) fail("A required ONDO public image is missing", [publicPath])
    if (await digest(resolve(STAGE_DIST, emittedFile)) !== await digest(resolve(APP_ROOT, publicFile))) {
      fail("An emitted ONDO public image differs from the validated source", [publicPath])
    }
  }
  const requiredPublicImage = (file) => PUBLIC_FILES.some((publicFile) => {
    const publicPath = publicFile.replace(/^public\//, "")
    return file === publicPath || file.endsWith(`/${publicPath}`)
  })
  const legacyImages = emittedImages.filter((file) => !requiredPublicImage(file)
    && /(?:modern-atlas|ondo-v2|ondo-baljajwi|placeholder|portrait|korean-|demo)/i.test(file))
  if (legacyImages.length) fail("Legacy public imagery was emitted", legacyImages)

  const protectedHosting = JSON.parse(await readFile(resolve(APP_ROOT, ".openai/hosting.json"), "utf8"))
  const artifactHosting = JSON.parse(await readFile(hostingEntry, "utf8"))
  if (!artifactHosting.project_id || artifactHosting.project_id === protectedHosting.project_id || artifactHosting.project_id === HISTORICAL_B_PROJECT_ID) {
    fail("Artifact hosting identity is absent or aliases an existing protected project")
  }

  const records = await Promise.all(artifactFiles.map(async (file) => ({
    file,
    bytes: (await stat(resolve(STAGE_DIST, file))).size,
  })))
  const census = {
    generatedAt: new Date().toISOString(),
    projectId: artifactHosting.project_id,
    routeFiles: sourceRoutes,
    emittedRoutes,
    artifact: {
      files: records.length,
      bytes: records.reduce((sum, record) => sum + record.bytes, 0),
      javascriptFiles: records.filter((record) => /\.(?:js|mjs)$/.test(record.file)).length,
      cssFiles: records.filter((record) => record.file.endsWith(".css")).length,
      imageFiles: emittedImages.length,
    },
    files: records,
  }
  const censusPath = resolve(APP_ROOT, "artifacts/qa/ondo-b-standalone-census.json")
  await mkdir(resolve(censusPath, ".."), { recursive: true })
  await writeFile(censusPath, `${JSON.stringify(census, null, 2)}\n`)
  process.stdout.write(`${JSON.stringify({ ...census, files: undefined }, null, 2)}\n`)
  return census
}

if (process.argv[1] === import.meta.filename) await scanStandaloneArtifact()
