// Operator-only deployment helper. Private values stay out of source/output.
// Run from app: node --env-file=.env.local scripts/kyc/deploy-sumsub-preview.mjs
// Secrets apply to this Preview deployment, never project-wide/Production.
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
const sha = spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).stdout.trim()
const args = ["deploy", "--target", "preview", "--yes", "--no-wait", "--archive=tgz", "--build-env", "NEXT_PUBLIC_ONDO_SUMSUB_SANDBOX=1", "--meta", `githubCommitRef=${branch}`, "--meta", `githubCommitSha=${sha}`]
for (const name of names) {
  if (!process.env[name]) throw new Error(`Missing ${name}`)
  args.push("--env", `${name}=${process.env[name]}`)
}
const result = spawnSync("vercel", args, { cwd: root, encoding: "utf8", timeout: 180000 })
let output = [result.stdout, result.stderr].filter(Boolean).join("\n")
for (const name of names.filter(name => !["NEXT_PUBLIC_ONDO_SUMSUB_SANDBOX", "SUMSUB_MODE", "SUMSUB_LEVEL_NAME"].includes(name))) output = output.replaceAll(process.env[name], "[REDACTED]")
console.log(output)
if (result.status !== 0) process.exitCode = 1
