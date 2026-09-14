import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: ["ondo-did-demo-journeys.spec.ts", "ondo-kpass-age-recovery.spec.ts", "ondo-kpass-service-journeys.spec.ts"],
  outputDir: "artifacts/qa/did-demo-20260908",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  workers: 2,
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL ?? process.env.DID_DEMO_BASE_URL ?? "http://localhost:3018", trace: "retain-on-failure", screenshot: "only-on-failure" },
  reporter: [["list"], ["json", { outputFile: "artifacts/qa/did-demo-20260908/results.json" }]],
  projects: [
    { name: "mobile-390", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: "small-320", use: { viewport: { width: 320, height: 740 }, isMobile: true, hasTouch: true } },
    { name: "desktop", use: { viewport: { width: 1280, height: 900 } } },
  ],
})
