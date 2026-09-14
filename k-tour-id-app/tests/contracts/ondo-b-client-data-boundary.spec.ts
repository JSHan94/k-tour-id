import { existsSync, readFileSync } from "node:fs"
import { dirname, extname, relative, resolve } from "node:path"
import { expect, test } from "@playwright/test"

const APP_ROOT = process.cwd()
const B_CLIENT_ENTRY = resolve(APP_ROOT, "features/ondo/app/ondo-product-b.tsx")
const B_SERVER_ENTRY = resolve(APP_ROOT, "app/api/ondo/venues/[venueId]/route.ts")
const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"] as const

function localImportTargets(source: string) {
  const targets: Array<{ target: string; typeOnly: boolean }> = []
  const pattern = /import\s+(type\s+)?(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g
  for (const match of source.matchAll(pattern)) {
    if (match[2].startsWith(".") || match[2].startsWith("@/")) {
      targets.push({ target: match[2], typeOnly: Boolean(match[1]) })
    }
  }
  return targets
}

function resolveSource(importer: string, target: string) {
  const base = target.startsWith("@/")
    ? resolve(APP_ROOT, target.slice(2))
    : resolve(dirname(importer), target)
  const candidates = extname(base)
    ? [base]
    : [
        ...SOURCE_EXTENSIONS.map((extension) => `${base}${extension}`),
        ...SOURCE_EXTENSIONS.map((extension) => resolve(base, `index${extension}`)),
      ]
  return candidates.find((candidate) => existsSync(candidate)) ?? null
}

function runtimeImportGraph(entry: string) {
  const pending = [entry]
  const visited = new Set<string>()
  while (pending.length > 0) {
    const file = pending.pop()
    if (!file || visited.has(file)) continue
    visited.add(file)
    const source = readFileSync(file, "utf8")
    for (const { target, typeOnly } of localImportTargets(source)) {
      if (typeOnly) continue
      const dependency = resolveSource(file, target)
      if (dependency && !visited.has(dependency)) pending.push(dependency)
    }
  }
  return [...visited].map((file) => relative(APP_ROOT, file)).sort()
}

test("PROD-B-DATA-001 initial B client graph uses only compact venue data and the canonical allowlist", () => {
  const clientGraph = runtimeImportGraph(B_CLIENT_ENTRY)

  expect(clientGraph).toContain("lib/ondo/venues/canonical-allowlist.ts")
  expect(clientGraph).toContain("lib/ondo/venues/map-data.ts")
  expect(clientGraph).not.toContain("lib/ondo/venues/index.ts")
  expect(clientGraph).not.toContain("lib/ondo/venues/detail-server.ts")
  expect(clientGraph).not.toContain("lib/kyc/sumsub-sandbox.ts")

  const clientSource = clientGraph.map((file) => readFileSync(resolve(APP_ROOT, file), "utf8")).join("\n")
  expect(clientSource).toContain("canonical-venues-map.json")
  expect(clientSource).not.toContain("canonical-venues.json")
})

test("PROD-B-DATA-002 venue detail API retains the full canonical server dataset", () => {
  const serverGraph = runtimeImportGraph(B_SERVER_ENTRY)
  expect(serverGraph).toContain("lib/ondo/venues/detail-server.ts")

  const serverSource = serverGraph.map((file) => readFileSync(resolve(APP_ROOT, file), "utf8")).join("\n")
  expect(serverSource).toContain("canonical-venues.json")
})
