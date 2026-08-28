import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { dirname, extname, relative, resolve } from "node:path"
import {
  APP_ROOT,
  HISTORICAL_B_PROJECT_ID,
  LOCAL_ONLY_PROJECT_ID,
  PUBLIC_FILES,
  SOURCE_FILES,
  STAGE_ROOT,
} from "./policy.mjs"

const ROOT_LAYOUT = `import type React from "react"
import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  applicationName: "ONDO",
  title: "ONDO 溫圖 — Korea temperature map for Seoul, Busan, and Jeju",
  description: "Browse 400 licensed Seoul and Busan food-service records alongside a separate source-linked Jeju editorial collection.",
  openGraph: { siteName: "ONDO" },
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko" className="antialiased"><body>{children}</body></html>
}
`

const ROOT_PAGE = `import { redirect } from "next/navigation"

export default function HomePage() {
  redirect("/ondo-b")
}
`

const GLOBALS = `@import "maplibre-gl/dist/maplibre-gl.css";

:root { --focus: #1d66d1; color-scheme: light; }
* { box-sizing: border-box; }
html, body { min-height: 100%; margin: 0; }
body { background: #efefed; color: #1f1e1c; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif; }
button, input, textarea, select { font: inherit; }
button, a { -webkit-tap-highlight-color: transparent; }
button { cursor: pointer; }
`

const NEXT_CONFIG = `const securityHeaders = [
  { key: "Content-Security-Policy", value: "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data: https://tiles.openfreemap.org; img-src 'self' data: blob: https:; connect-src 'self' https://tiles.openfreemap.org https://openfreemap.org; worker-src 'self' blob:" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=(), payment=(), usb=()" },
  { key: "X-Frame-Options", value: "DENY" },
]

export default {
  images: { unoptimized: true },
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/", headers: securityHeaders },
      { source: "/ondo-b", headers: securityHeaders },
      { source: "/api/ondo/venues/:path*", headers: securityHeaders },
    ]
  },
}
`

const VITE_CONFIG = `import vinext from "vinext"
import { defineConfig } from "vite"
import { sites } from "./build/sites-vite-plugin"

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: [],
  r2_buckets: [],
}

export default defineConfig(async () => {
  process.env.WRANGLER_WRITE_LOGS ??= "false"
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs"
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry"
  const { cloudflare } = await import("@cloudflare/vite-plugin")
  return {
    plugins: [
      vinext(),
      sites(),
      cloudflare({ viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] }, config: localBindingConfig }),
    ],
  }
})
`

const WORKER = `import {
  DEFAULT_DEVICE_SIZES,
  DEFAULT_IMAGE_SIZES,
  handleImageOptimization,
} from "vinext/server/image-optimization"
import handler from "vinext/server/app-router-entry"

interface Fetcher { fetch(request: Request): Promise<Response> }
interface Env {
  ASSETS: Fetcher
  IMAGES: { input(stream: ReadableStream): { transform(options: Record<string, unknown>): { output(options: { format: string; quality: number }): Promise<{ response(): Response }> } } }
}
interface ExecutionContext { waitUntil(promise: Promise<unknown>): void; passThroughOnException(): void }

const securityHeaders = {
  "Content-Security-Policy": "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data: https://tiles.openfreemap.org; img-src 'self' data: blob: https:; connect-src 'self' https://tiles.openfreemap.org https://openfreemap.org; worker-src 'self' blob:",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(self), camera=(), microphone=(), payment=(), usb=()",
  "X-Frame-Options": "DENY",
}

const allowedPublicAssetPaths = new Set(${JSON.stringify(PUBLIC_FILES.map((path) => `/${path.replace(/^public\//, "")}`))})

function secure(response: Response) {
  const headers = new Headers(response.headers)
  for (const [key, value] of Object.entries(securityHeaders)) headers.set(key, value)
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

function isAllowed(pathname: string) {
  return pathname === "/"
    || pathname === "/ondo-b"
    || /^\\/api\\/ondo\\/venues\\/[^/]+$/.test(pathname)
    || pathname === "/_vinext/image"
    || pathname === "/icon.svg"
    || allowedPublicAssetPaths.has(pathname)
    || pathname.startsWith("/_next/")
    || pathname.startsWith("/assets/")
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    if (!isAllowed(url.pathname)) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } })
    if (url.pathname === "/_vinext/image") {
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality })
          return result.response()
        },
      }, [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES])
    }
    const response = await handler.fetch(request, env, ctx)
    return url.pathname === "/" || url.pathname === "/ondo-b" || url.pathname.startsWith("/api/ondo/venues/")
      ? secure(response)
      : response
  },
}

export default worker
`

const TSCONFIG = JSON.stringify({
  compilerOptions: {
    lib: ["dom", "dom.iterable", "esnext"],
    target: "ES2020",
    skipLibCheck: true,
    strict: true,
    noEmit: true,
    esModuleInterop: true,
    module: "esnext",
    moduleResolution: "bundler",
    resolveJsonModule: true,
    isolatedModules: true,
    jsx: "react-jsx",
    paths: { "@/*": ["./*"] },
  },
  include: ["**/*.ts", "**/*.tsx"],
  exclude: ["node_modules", "dist"],
}, null, 2) + "\n"

const PACKAGE = JSON.stringify({
  name: "ondo-b-production-site",
  private: true,
  type: "module",
}, null, 2) + "\n"

const VENUE_INDEX = `export type {
  CanonicalMapVenue,
  CanonicalVenue,
  FieldEvidence,
  SourceTruth,
  VenueCityId,
  VenuePrimaryCategory,
} from "./contracts"
export {
  CANONICAL_PRIVATE_NOTE_MAX_LENGTH,
  isCanonicalVenueId,
  sanitizeCanonicalVenueIds,
  sanitizeCanonicalVenueNotes,
  type CanonicalVenueId,
} from "./canonical-allowlist"
`

const LOCAL_SOURCE_EXTENSIONS = Object.freeze([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".css"])
const SCANNED_SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"])

async function stagedFilesBelow(root, prefix = "") {
  const entries = await readdir(resolve(root, prefix), { withFileTypes: true })
  const files = await Promise.all(entries.map(async (entry) => {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name
    return entry.isDirectory() ? stagedFilesBelow(root, path) : [path]
  }))
  return files.flat()
}

function localImportSpecifiers(source) {
  const specifiers = []
  const staticPattern = /\b(?:import|export)\s+(?:type\s+)?(?:[^"'`;]*?\s+from\s+)?["']([^"']+)["']/g
  const dynamicPattern = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g
  for (const pattern of [staticPattern, dynamicPattern]) {
    for (const match of source.matchAll(pattern)) {
      const specifier = match[1].split(/[?#]/, 1)[0]
      if (specifier.startsWith(".") || specifier.startsWith("@/")) specifiers.push(specifier)
    }
  }
  return specifiers
}

function stagedImportCandidates(stageRoot, importer, specifier) {
  const base = specifier.startsWith("@/")
    ? resolve(stageRoot, specifier.slice(2))
    : resolve(dirname(resolve(stageRoot, importer)), specifier)
  const paths = extname(base)
    ? [base]
    : [
        base,
        ...LOCAL_SOURCE_EXTENSIONS.map((extension) => `${base}${extension}`),
        ...LOCAL_SOURCE_EXTENSIONS.map((extension) => resolve(base, `index${extension}`)),
      ]
  return paths.map((path) => relative(stageRoot, path).replaceAll("\\", "/"))
}

export async function assertStandaloneLocalImportClosure(stageRoot = STAGE_ROOT) {
  const files = await stagedFilesBelow(stageRoot)
  const staged = new Set(files)
  const scanned = files.filter((file) => SCANNED_SOURCE_EXTENSIONS.has(extname(file)))
  let localImportCount = 0
  for (const importer of scanned) {
    const source = await readFile(resolve(stageRoot, importer), "utf8")
    for (const specifier of localImportSpecifiers(source)) {
      localImportCount += 1
      const candidates = stagedImportCandidates(stageRoot, importer, specifier)
      if (!candidates.some((candidate) => staged.has(candidate))) {
        throw new Error(`Standalone source closure is missing local import ${specifier} from ${importer}`)
      }
    }
  }
  return { scannedFileCount: scanned.length, localImportCount }
}

async function copyFile(relativePath) {
  const source = resolve(APP_ROOT, relativePath)
  const target = resolve(STAGE_ROOT, relativePath)
  await mkdir(dirname(target), { recursive: true })
  await cp(source, target)
}

async function assertProjectIsolation(projectId) {
  const protectedHosting = JSON.parse(await readFile(resolve(APP_ROOT, ".openai/hosting.json"), "utf8"))
  if (projectId === protectedHosting.project_id || projectId === HISTORICAL_B_PROJECT_ID) {
    throw new Error("Refusing to package ONDO B with an existing protected project identity")
  }
}

async function writeProductionVenueDetails() {
  const path = resolve(STAGE_ROOT, "data/ondo-venues/canonical-venues.json")
  const source = JSON.parse(await readFile(path, "utf8"))
  const venues = source.venues.map((venue) => ({
    id: venue.id,
    sourceIds: venue.sourceIds,
    sourceSnapshotAt: venue.sourceSnapshotAt,
    primaryCategory: venue.primaryCategory,
    name: venue.name,
    address: venue.address,
    sourceCategory: venue.sourceCategory,
    licenseStatus: venue.licenseStatus,
    licenseOpenedAt: venue.licenseOpenedAt,
    sourceModifiedAt: venue.sourceModifiedAt,
    facts: {
      openingHours: venue.facts.openingHours,
      foreignCardAccepted: venue.facts.foreignCardAccepted,
      menu: venue.facts.menu,
      englishSupport: venue.facts.englishSupport,
    },
  }))
  await writeFile(path, `${JSON.stringify({
    generatedAt: source.generatedAt,
    truthNotice: source.truthNotice,
    venues,
  })}\n`)
}

export async function prepareStandaloneSource({ projectId = process.env.ONDO_B_SITE_PROJECT_ID ?? LOCAL_ONLY_PROJECT_ID } = {}) {
  await assertProjectIsolation(projectId)
  await rm(STAGE_ROOT, { recursive: true, force: true })
  await Promise.all([...SOURCE_FILES, ...PUBLIC_FILES].map(copyFile))
  await writeProductionVenueDetails()
  const generated = new Map([
    ["app/layout.tsx", ROOT_LAYOUT],
    ["app/page.tsx", ROOT_PAGE],
    ["app/globals.css", GLOBALS],
    ["next.config.mjs", NEXT_CONFIG],
    ["vite.config.ts", VITE_CONFIG],
    ["worker/index.ts", WORKER],
    ["tsconfig.json", TSCONFIG],
    ["package.json", PACKAGE],
    ["lib/ondo/venues/index.ts", VENUE_INDEX],
    [".openai/hosting.json", `${JSON.stringify({ project_id: projectId, d1: null, r2: null }, null, 2)}\n`],
  ])
  await Promise.all([...generated].map(async ([relativePath, contents]) => {
    const target = resolve(STAGE_ROOT, relativePath)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, contents)
  }))
  await assertStandaloneLocalImportClosure(STAGE_ROOT)
  return STAGE_ROOT
}

if (process.argv[1] === import.meta.filename) {
  const stage = await prepareStandaloneSource()
  process.stdout.write(`Prepared isolated ONDO B source at ${stage}\n`)
}
