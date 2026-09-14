import { defineConfig, devices } from "@playwright/test"

// Public production journeys only: no authoring harness or injected approvals.
export default defineConfig({
  testDir: "tests/e2e",
  testMatch: ["ondo-demo-mobile-surfaces.spec.ts", "ondo-did-demo-journeys.spec.ts", "ondo-funding-rail-journeys.spec.ts"],
  outputDir: "artifacts/qa/public-safari",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  workers: 1,
  use: {
    ...devices["iPhone 13"],
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3019",
    locale: "en-US",
    timezoneId: "Asia/Seoul",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  reporter: [["list"], ["json", { outputFile: "artifacts/qa/public-safari/results.json" }]],
  projects: [{ name: "mobile-webkit", use: { browserName: "webkit" } }],
})
