import { spawn } from "node:child_process"
import { resolve } from "node:path"
import { APP_ROOT, STAGE_ROOT } from "./policy.mjs"
import { prepareStandaloneSource } from "./prepare.mjs"
import { scanStandaloneArtifact } from "./scan-artifact.mjs"

function run(command, args, options) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { ...options, stdio: "inherit" })
    child.once("error", reject)
    child.once("exit", (code, signal) => {
      if (code === 0) resolvePromise()
      else reject(new Error(`${command} exited with ${signal ?? code}`))
    })
  })
}

await prepareStandaloneSource()
await run(resolve(APP_ROOT, "node_modules/.bin/vinext"), ["build"], {
  cwd: STAGE_ROOT,
  env: {
    ...process.env,
    WRANGLER_WRITE_LOGS: "false",
    WRANGLER_LOG_PATH: resolve(STAGE_ROOT, ".wrangler/logs"),
    MINIFLARE_REGISTRY_PATH: resolve(STAGE_ROOT, ".wrangler/registry"),
  },
})
await scanStandaloneArtifact()
