import { REQUIRED_ENV } from "./source-config.mjs"

for (const [capability, names] of Object.entries(REQUIRED_ENV)) {
  console.log(JSON.stringify({
    capability,
    requiredNames: names,
    configured: names.length === 0 || names.every((name) => Boolean(process.env[name])),
  }))
}
