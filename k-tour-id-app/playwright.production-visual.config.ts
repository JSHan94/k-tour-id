import { defineConfig, devices } from "@playwright/test"

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3112"

export default defineConfig({
  testDir: ".",
  testMatch: [
    "tests/visual/ondo-b-production-visual-mobile.spec.ts",
    "tests/visual/ondo-b-production-visual-desktop.spec.ts",
    "tests/visual/ondo-b-production-visual-responsive.spec.ts",
    "tests/visual/ondo-b-production-visual-structural.spec.ts",
  ],
  outputDir: "artifacts/qa/production-visual",
  snapshotPathTemplate: "tests/visual/ondo-b-production-snapshots/{projectName}/{arg}{ext}",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [
    ["list"],
    ["json", { outputFile: "artifacts/qa/production-visual/results.json" }],
    ["junit", { outputFile: "artifacts/qa/production-visual/junit.xml" }],
  ],
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    colorScheme: "light",
    locale: "en-US",
    timezoneId: "Asia/Seoul",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "pnpm exec next build --webpack && pnpm exec next start -H 127.0.0.1 -p 3112",
        url: baseURL,
        reuseExistingServer: false,
        timeout: 180_000,
      },
  projects: [
    {
      name: "production-mobile-chromium",
      testMatch: "tests/visual/ondo-b-production-visual-mobile.spec.ts",
      use: {
        ...devices["iPhone 13"],
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "production-desktop-chromium",
      testMatch: [
        "tests/visual/ondo-b-production-visual-desktop.spec.ts",
        "tests/visual/ondo-b-production-visual-responsive.spec.ts",
        "tests/visual/ondo-b-production-visual-structural.spec.ts",
      ],
      use: {
        ...devices["Desktop Chrome"],
        browserName: "chromium",
        viewport: { width: 1440, height: 1000 },
      },
    },
  ],
})
