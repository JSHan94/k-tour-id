import { defineConfig, devices } from "@playwright/test"

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3112"

export default defineConfig({
  testDir: ".",
  testMatch: ["tests/e2e/**/*.spec.ts", "tests/visual/**/*.spec.ts"],
  outputDir: "artifacts/qa/playwright",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ["list"],
    ["json", { outputFile: "artifacts/qa/playwright/results.json" }],
    ["junit", { outputFile: "artifacts/qa/playwright/junit.xml" }],
  ],
  use: {
    baseURL,
    colorScheme: "light",
    locale: "en-US",
    timezoneId: "Asia/Seoul",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  expect: { timeout: 8_000 },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
      command: "pnpm exec next dev --webpack -H 127.0.0.1 -p 3112",
      url: baseURL,
      // Never silently accept a server owned by another worktree. Opt-in reuse
      // remains available for a deliberately managed local preview.
      reuseExistingServer: process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER === "1",
      timeout: 120_000,
    },
  projects: [
    {
      name: "mobile-chromium",
      use: {
        ...devices["iPhone 13"],
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
  ],
})
