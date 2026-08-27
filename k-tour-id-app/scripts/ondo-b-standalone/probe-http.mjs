import { spawn } from "node:child_process"
import { createServer } from "node:net"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import {
  APP_ROOT,
  BLOCKED_HTTP_PATHS,
  LEGACY_ARTIFACT_TEXT,
  PUBLIC_FILES,
  STAGE_ROOT,
} from "./policy.mjs"

const VENUE_ID = "mois-0021cd596bc5b2a922ad"

function reservePort() {
  return new Promise((resolvePromise, reject) => {
    const server = createServer()
    server.once("error", reject)
    server.listen(0, "127.0.0.1", () => {
      const address = server.address()
      if (!address || typeof address === "string") return reject(new Error("Could not reserve a local probe port"))
      const port = address.port
      server.close((error) => error ? reject(error) : resolvePromise(port))
    })
  })
}

async function waitForServer(baseUrl, child) {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    if (child.exitCode != null) throw new Error(`Local artifact server exited with ${child.exitCode}`)
    try {
      await fetch(baseUrl, { redirect: "manual" })
      return
    } catch {
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 200))
    }
  }
  throw new Error("Timed out waiting for the local artifact server")
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function request(baseUrl, path, expectedStatus) {
  const response = await fetch(new URL(path, baseUrl), { redirect: "manual" })
  assert(response.status === expectedStatus, `${path}: expected ${expectedStatus}, received ${response.status}`)
  return response
}

function assertNoLegacyText(text, label) {
  for (const pattern of LEGACY_ARTIFACT_TEXT) {
    assert(!pattern.test(text), `${label}: emitted blocked text ${pattern}`)
  }
}

export async function probeStandaloneHttp(baseUrl) {
  const root = await fetch(baseUrl, { redirect: "manual" })
  assert([307, 308].includes(root.status), `/: expected redirect, received ${root.status}`)
  const redirectLocation = root.headers.get("location")
  assert(redirectLocation != null && new URL(redirectLocation, baseUrl).pathname === "/ondo-b", `/: unexpected redirect ${redirectLocation}`)

  const page = await request(baseUrl, "/ondo-b", 200)
  const html = await page.text()
  assert(/ONDO/.test(html), "/ondo-b: product identity missing")
  assert(/LOCALDATA|공식 일반음식점/.test(html), "/ondo-b: production directory content missing")
  assertNoLegacyText(html, "/ondo-b")
  for (const header of ["content-security-policy", "x-content-type-options", "referrer-policy", "permissions-policy", "x-frame-options"]) {
    assert(page.headers.has(header), `/ondo-b: security header missing: ${header}`)
  }

  const api = await request(baseUrl, `/api/ondo/venues/${VENUE_ID}`, 200)
  const payload = await api.json()
  assert(payload?.venue?.id === VENUE_ID, "Canonical venue API returned the wrong record")
  await request(baseUrl, "/api/ondo/venues/mois-does-not-exist", 404)

  for (const path of BLOCKED_HTTP_PATHS) {
    const response = await request(baseUrl, path, 404)
    assertNoLegacyText(await response.text(), path)
  }

  for (const publicFile of PUBLIC_FILES) {
    const path = `/${publicFile.replace(/^public\//, "")}`
    const asset = await request(baseUrl, path, 200)
    assert(asset.headers.get("content-type")?.startsWith("image/"), `${path}: expected an image content type`)
  }
  await request(baseUrl, "/icon.svg", 200)

  const assets = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map((match) => match[1])
    .filter((path) => path.startsWith("/_next/") || path.startsWith("/assets/"))
  assert(assets.length > 0, "No built assets were referenced by /ondo-b")
  for (const path of [...new Set(assets)]) {
    const response = await request(baseUrl, path, 200)
    const contentType = response.headers.get("content-type") ?? ""
    if (/javascript|css|json|text/.test(contentType)) assertNoLegacyText(await response.text(), path)
  }

  const result = { baseUrl, redirect: root.status, page: page.status, blocked: BLOCKED_HTTP_PATHS.length, assets: new Set(assets).size, publicAssets: PUBLIC_FILES.length }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  return result
}

async function startLocalArtifact() {
  const port = await reservePort()
  const baseUrl = `http://127.0.0.1:${port}`
  const config = resolve(STAGE_ROOT, "dist/server/wrangler.json")
  await readFile(config)
  const child = spawn(resolve(APP_ROOT, "node_modules/.bin/wrangler"), [
    "dev",
    "--config", config,
    "--ip", "127.0.0.1",
    "--port", String(port),
    "--log-level", "error",
  ], { cwd: resolve(STAGE_ROOT, "dist/server"), stdio: ["ignore", "pipe", "pipe"] })
  let logs = ""
  child.stdout.on("data", (chunk) => { logs += chunk })
  child.stderr.on("data", (chunk) => { logs += chunk })
  try {
    await waitForServer(baseUrl, child)
    return { baseUrl, child }
  } catch (error) {
    child.kill("SIGTERM")
    throw new Error(`${error instanceof Error ? error.message : error}\n${logs.slice(-4000)}`)
  }
}

if (process.argv[1] === import.meta.filename) {
  const externalBaseUrl = process.env.ONDO_B_PROBE_BASE_URL
  if (externalBaseUrl) await probeStandaloneHttp(externalBaseUrl)
  else {
    const { baseUrl, child } = await startLocalArtifact()
    try {
      await probeStandaloneHttp(baseUrl)
    } finally {
      child.kill("SIGTERM")
    }
  }
}
