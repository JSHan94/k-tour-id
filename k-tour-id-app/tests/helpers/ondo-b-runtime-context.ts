import type { Browser, BrowserContext, BrowserContextOptions, Page, TestInfo } from "@playwright/test"
import { expectBRuntimeClean, installBRuntimeGuard } from "./ondo-b-qa"

// Custom browser contexts do not use Playwright's default page fixture.
// Track every page, including already-closed pages, so a later failed
// assertion cannot silently discard its runtime evidence.
const pagesByTest = new WeakMap<TestInfo, Page[]>()

export async function createBRuntimeContext(browser: Browser, options: BrowserContextOptions, testInfo: TestInfo) {
  const context = await browser.newContext(options)
  context.on("page", page => {
    installBRuntimeGuard(page)
    const pages = pagesByTest.get(testInfo) ?? []
    pages.push(page)
    pagesByTest.set(testInfo, pages)
  })
  return context
}

export async function seedBContextDevicePreferences(context: BrowserContext, baseURL: string | undefined, device: Readonly<Record<string, unknown>>) {
  if (!baseURL) throw new Error("Device fixtures require an explicit application base URL")
  const appURL = new URL(baseURL)
  if (appURL.protocol !== "https:" && appURL.protocol !== "http:") throw new Error("Device fixtures require an HTTP(S) application origin")
  await context.addInitScript(({ origin, device }) => {
    // Context scripts also run on the initial opaque about:blank document and
    // unrelated child documents. Touch storage only on the intended app origin.
    // Storage failures on that origin must still throw into the strict guard.
    if (window.location.origin !== origin) return
    localStorage.setItem("ondo-b.device.v1", JSON.stringify(device))
  }, { origin: appURL.origin, device })
}

export async function expectBRuntimeContextsClean(testInfo: TestInfo) {
  const pages = pagesByTest.get(testInfo) ?? []
  const results = await Promise.allSettled(pages.map((page, index) => expectBRuntimeClean(page, {
    attach: testInfo.attach.bind(testInfo),
    outputPath: () => testInfo.outputPath(`runtime-page-${index + 1}.json`),
  })))
  pagesByTest.delete(testInfo)
  const failure = results.find(result => result.status === "rejected")
  if (failure?.status === "rejected") throw failure.reason
}
