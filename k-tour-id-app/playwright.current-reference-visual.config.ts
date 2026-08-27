import { defineConfig, devices } from "@playwright/test"

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3296"

export default defineConfig({
  testDir: ".",
  testMatch: "tests/visual/ondo-b-current-reference-visual.spec.ts",
  outputDir: "artifacts/qa/current-reference-visual",
  snapshotPathTemplate: "tests/visual/ondo-b-current-reference-snapshots/{projectName}/{arg}{ext}",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: "list",
  expect: { timeout: 15_000 },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "pnpm exec next dev --webpack -H 127.0.0.1 -p 3296",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    browserName: "chromium",
    colorScheme: "light",
    locale: "en-US",
    timezoneId: "Asia/Seoul",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "current-reference-chromium",
      testMatch: "tests/visual/ondo-b-current-reference-visual.spec.ts",
    },
  ],
})
