import { EventEmitter } from "node:events"
import { expect, test, type Page, type Request } from "@playwright/test"
import {
  normalizeBDiscoveryHistoryForActiveDocument,
  replaceBDiscoveryHistoryForActiveDocument,
  restoreBDiscoveryCityContext,
  restoreBDiscoveryVenueContext,
} from "../../features/ondo/map/b-discovery-history"
import {
  allowBNextNavigationAbort,
  expectBRuntimeClean,
  getBRuntimeEvidence,
  installBRuntimeGuard,
} from "../helpers/ondo-b-qa"

const VENUE_ID = "mois-0021cd596bc5b2a922ad"
const ORIGIN = "http://127.0.0.1:3112"

test("B-HISTORY-PRIVACY raw private and non-canonical history is always replaced, while exact state stays idempotent", () => {
  let currentUrl = new URL("/ondo-b?city=seoul&view=list", ORIGIN)
  const location = {
    get origin() { return currentUrl.origin },
    get pathname() { return currentUrl.pathname },
    get search() { return currentUrl.search },
    get hash() { return currentUrl.hash },
    get href() { return currentUrl.href },
  }
  class ContractHistory {
    state: unknown
    replaceCalls = 0
    pushCalls = 0

    constructor(state: unknown) { this.state = state }
    replaceState(state: unknown, _unused: string, url?: string | URL | null) {
      this.replaceCalls += 1
      this.state = state
      if (url != null) currentUrl = new URL(String(url), currentUrl)
    }
    pushState(state: unknown, _unused: string, url?: string | URL | null) {
      this.pushCalls += 1
      this.state = state
      if (url != null) currentUrl = new URL(String(url), currentUrl)
    }
  }
  const nextInternal = { tree: "preserved" }
  const history = new ContractHistory({
    nextInternal,
    __ondoBDiscovery: {
      v: 3,
      documentId: "stale-document",
      level: "city",
      city: "seoul",
      view: "list",
      query: "",
      category: "all",
    },
  })
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window")
  const previousHistory = Object.getOwnPropertyDescriptor(globalThis, "History")
  Object.defineProperty(globalThis, "History", { configurable: true, value: ContractHistory })
  Object.defineProperty(globalThis, "window", { configurable: true, value: { history, location } })

  try {
    const first = normalizeBDiscoveryHistoryForActiveDocument()
    expect(first).not.toBeNull()
    expect(history.replaceCalls).toBe(1)
    expect((history.state as Record<string, unknown>).nextInternal).toBe(nextInternal)

    normalizeBDiscoveryHistoryForActiveDocument()
    expect(history.replaceCalls, "an exact raw entry must not cause duplicate Next reconciliation").toBe(1)

    const safeQuery = "x".repeat(120)
    const canonical = (history.state as Record<string, unknown>).__ondoBDiscovery as Record<string, unknown>
    history.state = {
      nextInternal,
      __ondoBDiscovery: {
        ...canonical,
        query: `${safeQuery}PRIVATE-TAIL`,
        privateDraft: { note: "must not survive" },
        credential: { accessToken: "must not survive" },
      },
    }
    currentUrl = new URL(`/ondo-b?city=seoul&view=list&q=${safeQuery}`, ORIGIN)
    normalizeBDiscoveryHistoryForActiveDocument()
    expect(history.replaceCalls).toBe(2)
    const sanitized = (history.state as Record<string, unknown>).__ondoBDiscovery as Record<string, unknown>
    expect(sanitized.query).toBe(safeQuery)
    expect(Reflect.ownKeys(sanitized).sort()).toEqual(["category", "city", "documentId", "level", "query", "v", "view"])
    expect(JSON.stringify(history.state)).not.toContain("PRIVATE-TAIL")
    expect(JSON.stringify(history.state)).not.toContain("privateDraft")
    expect(JSON.stringify(history.state)).not.toContain("accessToken")

    const missingCategory = { ...sanitized }
    Reflect.deleteProperty(missingCategory, "category")
    history.state = { nextInternal, __ondoBDiscovery: missingCategory }
    currentUrl = new URL("/ondo-b?city=seoul&view=list&q=" + safeQuery, ORIGIN)
    normalizeBDiscoveryHistoryForActiveDocument()
    expect(history.replaceCalls, "a missing required key must not match its sanitized default").toBe(3)

    currentUrl = new URL(`${currentUrl.pathname}${currentUrl.search}#private-fragment`, ORIGIN)
    normalizeBDiscoveryHistoryForActiveDocument()
    expect(history.replaceCalls, "a non-canonical hash must force the exact URL rewrite").toBe(4)
    expect(currentUrl.hash).toBe("")

    const preservedTree = { segment: "restored" }
    const current = normalizeBDiscoveryHistoryForActiveDocument()!
    replaceBDiscoveryHistoryForActiveDocument(current, { preservedTree })
    expect(history.replaceCalls, "missing preserved outer state must force replacement").toBe(5)
    expect((history.state as Record<string, unknown>).preservedTree).toBe(preservedTree)
    replaceBDiscoveryHistoryForActiveDocument(current, { preservedTree })
    expect(history.replaceCalls, "the exact preserved outer state must remain idempotent").toBe(5)

    expect(restoreBDiscoveryVenueContext({
      city: "seoul",
      view: "list",
      query: `${safeQuery}PRIVATE-TAIL`,
      category: "all",
      venueId: VENUE_ID,
      level: "detail",
    })?.query).toBe(safeQuery)
    const restoredVenue = (history.state as Record<string, unknown>).__ondoBDiscovery as Record<string, unknown>
    expect(restoredVenue).toMatchObject({ level: "detail", city: "seoul", venueId: VENUE_ID, query: safeQuery })
    expect(Reflect.ownKeys(restoredVenue)).not.toContain("privateDraft")

    expect(restoreBDiscoveryCityContext({
      city: "seoul",
      view: "list",
      query: "safe fallback",
      category: "night",
      focus: "search",
    })).toMatchObject({ level: "city", city: "seoul", focus: { kind: "search" } })
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow)
    else Reflect.deleteProperty(globalThis, "window")
    if (previousHistory) Object.defineProperty(globalThis, "History", previousHistory)
    else Reflect.deleteProperty(globalThis, "History")
  }
})

class RuntimePage extends EventEmitter {
  constructor(private currentUrl: string) { super() }
  url() { return this.currentUrl }
}

function runtimePage() {
  return new RuntimePage(`${ORIGIN}/ondo-b?city=seoul&view=list`) as unknown as Page
}

function failedRequest({
  url = `${ORIGIN}/ondo-b?city=seoul&view=list&_rsc=opaque-token`,
  method = "GET",
  reason = "net::ERR_ABORTED",
  resourceType = "fetch",
  headers = { rsc: "1", "next-router-state-tree": "%5B%22%22%5D" },
}: {
  url?: string
  method?: string
  reason?: string
  resourceType?: string
  headers?: Record<string, string>
} = {}) {
  return {
    request: {
      url: () => url,
      method: () => method,
      resourceType: () => resourceType,
      headers: () => headers,
      failure: () => ({ errorText: reason }),
    } as unknown as Request,
    reason,
  }
}

function emitFailed(page: Page, options?: Parameters<typeof failedRequest>[0]) {
  const { request } = failedRequest(options)
  ;(page as unknown as RuntimePage).emit("requestfailed", request)
}

test("B-RUNTIME-RSC an unconsumed strict Next abort is a product failure; one exact allowance consumes only one", async () => {
  const unconsumedPage = runtimePage()
  installBRuntimeGuard(unconsumedPage)
  emitFailed(unconsumedPage)
  expect(getBRuntimeEvidence(unconsumedPage)).toMatchObject({ product: [expect.stringContaining("net::ERR_ABORTED")], navigationAbort: [] })
  await expect(expectBRuntimeClean(unconsumedPage)).rejects.toThrow()

  const boundedPage = runtimePage()
  installBRuntimeGuard(boundedPage)
  const consumeFirstAbort = allowBNextNavigationAbort(boundedPage, {
    targetUrl: `${ORIGIN}/ondo-b?city=seoul&view=list`,
    count: 1,
  })
  emitFailed(boundedPage)
  emitFailed(boundedPage)
  expect(consumeFirstAbort()).toEqual([`${ORIGIN}/ondo-b?city=seoul&view=list&_rsc=opaque-token`])
  expect(getBRuntimeEvidence(boundedPage)).toMatchObject({ product: [expect.any(String)], navigationAbort: [expect.any(String)] })
  await expect(expectBRuntimeClean(boundedPage)).rejects.toThrow()
  expect(() => allowBNextNavigationAbort(boundedPage, {
    targetUrl: "/ondo-b?city=seoul&view=list",
    count: 1,
  })()).toThrow(/received 0/)

  const allowedPage = runtimePage()
  installBRuntimeGuard(allowedPage)
  const consumeAllowedAbort = allowBNextNavigationAbort(allowedPage, {
    targetUrl: "/ondo-b?city=seoul&view=list",
    count: 1,
  })
  emitFailed(allowedPage)
  consumeAllowedAbort()
  await expectBRuntimeClean(allowedPage)
})

test("B-RUNTIME-RSC allowance matching is strict across query, path, origin, method, resource type, and reason", () => {
  const cases = [
    { name: "query", request: {}, targetUrl: "/ondo-b?city=busan&view=list" },
    { name: "path", request: { url: `${ORIGIN}/ondo-b-extra?city=seoul&_rsc=opaque-token` }, targetUrl: "/ondo-b?city=seoul" },
    { name: "origin", request: { url: "https://example.test/ondo-b?city=seoul&_rsc=opaque-token" }, targetUrl: "/ondo-b?city=seoul" },
    { name: "method", request: { method: "POST" }, targetUrl: "/ondo-b?city=seoul&view=list" },
    { name: "resource type", request: { resourceType: "document" }, targetUrl: "/ondo-b?city=seoul&view=list" },
    { name: "reason", request: { reason: "net::ERR_FAILED" }, targetUrl: "/ondo-b?city=seoul&view=list" },
  ] as const

  for (const contractCase of cases) {
    const page = runtimePage()
    installBRuntimeGuard(page)
    const consumeAbort = allowBNextNavigationAbort(page, { targetUrl: contractCase.targetUrl, count: 1 })
    emitFailed(page, contractCase.request)
    expect(
      () => consumeAbort(),
      `${contractCase.name} mismatch must not be allowlisted`,
    ).toThrow(/received 0/)
    expect(getBRuntimeEvidence(page).product).toHaveLength(1)
    expect(getBRuntimeEvidence(page).navigationAbort).toEqual([])
  }
})
