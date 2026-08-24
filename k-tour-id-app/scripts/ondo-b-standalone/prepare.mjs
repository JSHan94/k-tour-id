import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import {
  APP_ROOT,
  LOCAL_ONLY_PROJECT_ID,
  PUBLIC_FILES,
  SOURCE_FILES,
  STAGE_ROOT,
} from "./policy.mjs"

const ROOT_LAYOUT = `import type React from "react"
import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "ONDO — Licensed food-place records in Seoul and Busan",
  description: "Browse 400 licensed food-service records from the Ministry of the Interior and Safety LOCALDATA snapshot.",
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: "#fbfaf7",
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
    || pathname === "/og-ondo-directory.png"
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

async function copyFile(relativePath) {
  const source = resolve(APP_ROOT, relativePath)
  const target = resolve(STAGE_ROOT, relativePath)
  await mkdir(dirname(target), { recursive: true })
  await cp(source, target)
}

async function assertProjectIsolation(projectId) {
  const protectedHosting = JSON.parse(await readFile(resolve(APP_ROOT, ".openai/hosting.json"), "utf8"))
  if (projectId === protectedHosting.project_id) {
    throw new Error("Refusing to package ONDO B with the checked-in protected project identity")
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
  return STAGE_ROOT
}

if (process.argv[1] === import.meta.filename) {
  const stage = await prepareStandaloneSource()
  process.stdout.write(`Prepared isolated ONDO B source at ${stage}\n`)
}
