import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { runInNewContext } from "node:vm"
import { expect, test } from "@playwright/test"
import ts from "typescript"

const PRIMARY = "https://ktour-id.vercel.app"
const IMAGE = "/og-ktour-food-v2.png"
const appRoot = process.cwd()
const pageSource = readFileSync(resolve(appRoot, "app/page.tsx"), "utf8")
const preparer = readFileSync(resolve(appRoot, "scripts/ondo-b-standalone/prepare.mjs"), "utf8")
type Env = Record<string, string | undefined>

// Execute the real metadata functions with isolated request headers and env.
// No Next server, packaging-stage regeneration, or global process mutation.
function executeMetadataModule(source: string, env: Env, requestHeaders: Record<string, string> = {}) {
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const exports: Record<string, any> = {}
  runInNewContext(code, {
    exports,
    URL,
    process: { env },
    require(id: string) {
      if (id === "next/headers") return { headers: async () => new Headers(requestHeaders) }
      if (id === "@/features/ondo/app/ondo-product-b") return { OndoProductB: () => null }
      if (id === "@/features/ondo/shared/state/ondo-b-appearance") return { ONDO_B_APPEARANCE_BOOTSTRAP_SCRIPT: "" }
      if (id === "react/jsx-runtime" || id.endsWith(".css")) return {}
      throw new Error(`Unexpected metadata dependency: ${id}`)
    },
  }, { timeout: 1_000 })
  return exports
}

async function metadataFor(host: string, env: Env, additionalHeaders: Record<string, string> = {}) {
  return executeMetadataModule(pageSource, env, { host, ...additionalHeaders }).generateMetadata()
}

function expectOrigin(metadata: any, expected: string) {
  expect(metadata.metadataBase.origin).toBe(expected)
  expect(new URL(metadata.alternates.canonical, metadata.metadataBase).href).toBe(`${expected}/`)
  expect(new URL(metadata.openGraph.url, metadata.metadataBase).href).toBe(`${expected}/`)
  expect(metadata.openGraph.images[0].url).toBe(`${expected}${IMAGE}`)
  expect(metadata.twitter.images).toEqual([`${expected}${IMAGE}`])
  expect(metadata.title).toBe("K-Tour ID")
  expect(metadata.robots).toEqual({ index: false, follow: false })
}

test("KTOUR-ORIGIN-001 production aliases and stale config resolve to the one public canonical", async () => {
  for (const host of ["ktour-id.vercel.app", "ondo-k-tour-id.vercel.app", "ondo-tau.vercel.app", "ondo-deployment-123.vercel.app"]) {
    expectOrigin(await metadataFor(host, { VERCEL_ENV: "production", NEXT_PUBLIC_ONDO_B_ORIGIN: "https://ondo-k-tour-id.vercel.app" }), PRIMARY)
  }
  expectOrigin(await metadataFor("ktour-id.vercel.app", { VERCEL_ENV: "production" }, { "x-forwarded-host": "other-preview.vercel.app" }), PRIMARY)
})

test("KTOUR-ORIGIN-002 Preview metadata remains on its deployment rather than production", async () => {
  expectOrigin(await metadataFor("ondo-preview-123.vercel.app", { VERCEL_ENV: "preview", NEXT_PUBLIC_ONDO_B_ORIGIN: PRIMARY }), "https://ondo-preview-123.vercel.app")
  expectOrigin(await metadataFor("internal.invalid", { VERCEL_ENV: "preview" }, { "x-forwarded-host": "ONDO-PREVIEW-123.vercel.app, proxy.invalid" }), "https://ondo-preview-123.vercel.app")
  expectOrigin(await metadataFor("review.phenixnet-jl.chatgpt.site", {}), "https://review.phenixnet-jl.chatgpt.site")
})

test("KTOUR-ORIGIN-003 local QA retains its port and HTTP even with production env inherited", async () => {
  for (const host of ["localhost:3097", "127.0.0.1:3097"]) {
    expectOrigin(await metadataFor(host, { VERCEL_ENV: "production", NEXT_PUBLIC_ONDO_B_ORIGIN: PRIMARY }), `http://${host}`)
  }
})

test("KTOUR-ORIGIN-004 untrusted hosts never become canonical from suffix matching", async () => {
  for (const host of ["ktour-id.vercel.app.attacker.test", "user@ktour-id.vercel.app", "vercel.app", "ktour-id.vercel.app:443", "attacker.test"]) {
    expectOrigin(await metadataFor(host, { VERCEL_ENV: "preview" }), "https://ondo-directory.invalid")
  }
  expectOrigin(await metadataFor("unknown.example", { NEXT_PUBLIC_ONDO_B_ORIGIN: "https://configured.example/path" }), "https://configured.example")
  for (const origin of ["http://configured.example", "not-a-url", "javascript:alert(1)"]) {
    expectOrigin(await metadataFor("unknown.example", { NEXT_PUBLIC_ONDO_B_ORIGIN: origin }), "https://ondo-directory.invalid")
  }
})

test("KTOUR-ORIGIN-005 generated standalone layout uses the same production default", () => {
  const layoutSource = preparer.match(/const ROOT_LAYOUT = `([\s\S]*?)`\n/)?.[1]
  expect(layoutSource).toBeTruthy()
  for (const env of [{}, { VERCEL_ENV: "production", NEXT_PUBLIC_ONDO_B_ORIGIN: "https://ondo-k-tour-id.vercel.app" }]) {
    const metadata = executeMetadataModule(layoutSource!, env).metadata
    expect(metadata.metadataBase.origin).toBe(PRIMARY)
    expect(new URL(metadata.openGraph.images[0].url, metadata.metadataBase).href).toBe(`${PRIMARY}${IMAGE}`)
  }
  const preview = executeMetadataModule(layoutSource!, { VERCEL_ENV: "preview", NEXT_PUBLIC_ONDO_B_ORIGIN: "https://preview.example" }).metadata
  expect(preview.metadataBase.origin).toBe("https://preview.example")
})
