import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "tests/contracts",
  outputDir: "artifacts/qa/contracts",
  fullyParallel: true,
  reporter: [
    ["list"],
    ["json", { outputFile: "artifacts/qa/contracts/contract-data.json" }],
    ["junit", { outputFile: "artifacts/qa/contracts/junit.xml" }],
  ],
  projects: [{ name: "contracts" }],
})
