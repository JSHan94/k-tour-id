import { EventEmitter } from "node:events"
import { expect, test, type Page } from "@playwright/test"
import { expectBRuntimeClean, getBRuntimeEvidence, installBRuntimeGuard } from "../helpers/ondo-b-qa"

const PREVIEW = "https://ondo-review-team.vercel.app/"
const TOOLBAR = "https://vercel.live/_next-live/feedback/feedback.js"
const BLOCKED = `Loading the script '${TOOLBAR}' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline'". Note that 'script-src-elem' was not explicitly set, so 'script-src' is used as a fallback. The action has been blocked.`

class RuntimePage extends EventEmitter {
  constructor(private currentUrl: string) { super() }
  url() { return this.currentUrl }
}

function guardedPage(url = PREVIEW) {
  const events = new RuntimePage(url)
  const page = events as unknown as Page
  installBRuntimeGuard(page)
  return { page, events }
}

function emitConsole(events: RuntimePage, text = BLOCKED) {
  events.emit("console", {
    type: () => "error", text: () => text,
    location: () => ({ url: PREVIEW + "_next/static/chunks/webpack-example.js" }),
  })
}

function emitRequest(events: RuntimePage, {
  url = TOOLBAR, method = "GET", resourceType = "script", reason = "csp",
}: { url?: string; method?: string; resourceType?: string; reason?: string } = {}) {
  events.emit("requestfailed", {
    url: () => url, method: () => method, resourceType: () => resourceType,
    failure: () => ({ errorText: reason }),
  })
}

test("exact blocked Vercel preview injection is retained and attached separately, not erased", async () => {
  const { page, events } = guardedPage()
  emitConsole(events)
  emitRequest(events)
  const evidence = getBRuntimeEvidence(page)
  expect(evidence.product).toEqual([])
  expect(evidence.externalPreview).toEqual([
    `console: ${BLOCKED} @ ${PREVIEW}_next/static/chunks/webpack-example.js`,
    `requestfailed: ${TOOLBAR} · csp`,
  ])
  const attachments: { name: string; body: unknown }[] = []
  await expectBRuntimeClean(page, { attach: async (name, options) => { attachments.push({ name, body: options?.body }) } })
  expect(attachments).toHaveLength(1)
  expect(attachments[0].name).toBe("runtime.json")
  expect(JSON.parse(String(attachments[0].body))).toEqual(evidence)
})

test("preview classification rejects local, custom, spoofed and credentialed page origins", async () => {
  for (const url of [
    "http://127.0.0.1:3438/", "https://ondo.example.com/",
    "http://ondo-review-team.vercel.app/", "https://vercel.app/",
    "https://ondo.vercel.app.evil.example/", "https://notvercel.app/",
    "https://ondo.vercel.app:8443/", "https://user:password@ondo.vercel.app/", "not a URL",
  ]) {
    const { page, events } = guardedPage(url)
    emitConsole(events)
    emitRequest(events)
    expect(getBRuntimeEvidence(page).externalPreview, url).toEqual([])
    expect(getBRuntimeEvidence(page).product, url).toHaveLength(2)
    await expect(expectBRuntimeClean(page)).rejects.toThrow()
  }
})

test("only the exact HTTPS GET script URL and csp failure reason can be preview evidence", async () => {
  for (const mismatch of [
    { url: TOOLBAR + "?app-error=1" }, { url: TOOLBAR + "#fragment" },
    { url: TOOLBAR + ".evil" }, { url: TOOLBAR.replace("vercel.live", "vercel.live.evil.example") },
    { url: TOOLBAR.replace("https:", "http:") }, { url: TOOLBAR.replace("vercel.live", "user:password@vercel.live") },
    { url: PREVIEW + "_next/static/chunks/app.js" },
    { method: "POST" }, { resourceType: "fetch" }, { resourceType: "document" },
    { reason: "net::ERR_FAILED" }, { reason: "net::ERR_ABORTED" }, { reason: "CSP" },
  ]) {
    const { page, events } = guardedPage()
    emitRequest(events, mismatch)
    expect(getBRuntimeEvidence(page).externalPreview, JSON.stringify(mismatch)).toEqual([])
    expect(getBRuntimeEvidence(page).product, JSON.stringify(mismatch)).toHaveLength(1)
    await expect(expectBRuntimeClean(page)).rejects.toThrow()
  }
})

test("console near misses and app CSP errors mentioning the toolbar remain product failures", async () => {
  for (const text of [
    "Application failed while loading " + TOOLBAR,
    BLOCKED + " Application chunk failed.",
    "unhandledrejection: " + BLOCKED,
    BLOCKED.replace(TOOLBAR, PREVIEW + "_next/static/chunks/app.js"),
    BLOCKED.replace(TOOLBAR, TOOLBAR + "?app=1"),
    BLOCKED.replace("script-src 'self' 'unsafe-inline'", "connect-src 'self'"),
    BLOCKED.replace("script-src 'self' 'unsafe-inline'", "script-src 'none'"),
    BLOCKED.replace("The action has been blocked.", "The policy is report-only."),
  ]) {
    const { page, events } = guardedPage()
    emitConsole(events, text)
    expect(getBRuntimeEvidence(page).externalPreview, text).toEqual([])
    expect(getBRuntimeEvidence(page).product, text).toHaveLength(1)
    await expect(expectBRuntimeClean(page)).rejects.toThrow()
  }
})

test("page exceptions and HTTP failures always remain product evidence, including toolbar URLs", async () => {
  const { page, events } = guardedPage()
  events.emit("pageerror", new Error(BLOCKED))
  events.emit("response", { status: () => 404, url: () => TOOLBAR })
  events.emit("response", { status: () => 500, url: () => PREVIEW + "_next/static/chunks/app.js" })
  expect(getBRuntimeEvidence(page).externalPreview).toEqual([])
  expect(getBRuntimeEvidence(page).product).toHaveLength(3)
  const attachments: unknown[] = []
  await expect(expectBRuntimeClean(page, { attach: async (_name, options) => { attachments.push(options?.body) } })).rejects.toThrow()
  expect(JSON.parse(String(attachments[0])).product).toEqual(getBRuntimeEvidence(page).product)
})
