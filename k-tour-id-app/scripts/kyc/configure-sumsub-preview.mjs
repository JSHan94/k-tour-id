// Operator helper: forwards private local values through stdin, never argv or
// console. Pins the approved project AND this feature branch's Preview scope.
// Run from app: node --env-file=.env.local scripts/kyc/configure-sumsub-preview.mjs
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { spawnSync } from "node:child_process"
const root = resolve(import.meta.dirname, "../../..")
const branch = "feat/sumsub-sandbox-onboarding-20260914"
const project = JSON.parse(readFileSync(resolve(root, ".vercel/project.json"), "utf8"))
if (project.projectId !== "prj_w5rckTz9B1DO55fvVRXjQRy9L5RM" || project.orgId !== "team_6kJAloQ9WlswvMtbbCmGI7Er" || project.projectName !== "ondo") throw new Error("Unexpected deployment target")
if (spawnSync("git", ["branch", "--show-current"], { cwd: root, encoding: "utf8" }).stdout.trim() !== branch) throw new Error("Unexpected branch")
if (process.env.SUMSUB_MODE !== "sandbox" || !process.env.SUMSUB_APP_TOKEN?.startsWith("sbx:")) throw new Error("Sandbox credentials required")
const names = ["NEXT_PUBLIC_ONDO_SUMSUB_SANDBOX", "SUMSUB_MODE", "SUMSUB_LEVEL_NAME", "SUMSUB_APP_TOKEN", "SUMSUB_SECRET_KEY", "SUMSUB_SESSION_SECRET", "SUMSUB_PREVIEW_ACCESS_CODE"]
for (const name of names) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  const sensitive = ["SUMSUB_APP_TOKEN", "SUMSUB_SECRET_KEY", "SUMSUB_SESSION_SECRET", "SUMSUB_PREVIEW_ACCESS_CODE"].includes(name)
  const result = spawnSync("vercel", ["env", "add", name, "preview", branch, ...(sensitive ? ["--sensitive"] : [])], { cwd: root, input: value, encoding: "utf8", timeout: 30000 })
  // Provider/CLI output can include credential input; only report the key name.
  if (result.status !== 0) throw new Error(`Could not add ${name}; inspect configuration without printing its value`)
  console.log(`Configured ${name}: branch-scoped Preview${sensitive ? " (sensitive)" : ""}`)
}
console.log("Production environment was not changed.")
