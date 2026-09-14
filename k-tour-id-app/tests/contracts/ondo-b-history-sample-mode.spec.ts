import { expect, test } from "@playwright/test"
import { SAMPLE_ENVIRONMENT_ENABLED } from "../../features/ondo/contracts/sample-environment"
import { initializeBDiscoveryHistory, normalizeBDiscoveryHistoryForActiveDocument, restoreBDiscoveryCityContext } from "../../features/ondo/map/b-discovery-history"

function withHistory(path: string, storedReview: "0" | "1" | null, check: (state: {
  url: () => URL
  history: { state: unknown; replaceCalls: number }
  nextTree: object
}) => void) {
  let currentUrl = new URL(path, "http://localhost:3018")
  const stored = new Map<string, string>(storedReview === null ? [] : [["ondo.review.flow.v1", storedReview]])
  const nextTree = { tree: ["", { children: ["__PAGE__", {}] }] }
  class ContractHistory {
    state: unknown = { __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: nextTree }
    replaceCalls = 0
    replaceState(state: unknown, _unused: string, url?: string | URL | null) {
      this.state = state
      this.replaceCalls += 1
      if (url != null) currentUrl = new URL(String(url), currentUrl)
    }
    pushState(state: unknown, _unused: string, url?: string | URL | null) {
      this.state = state
      if (url != null) currentUrl = new URL(String(url), currentUrl)
    }
  }
  const history = new ContractHistory()
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window")
  const previousHistory = Object.getOwnPropertyDescriptor(globalThis, "History")
  Object.defineProperty(globalThis, "History", { configurable: true, value: ContractHistory })
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    history,
    location: {
      get origin() { return currentUrl.origin },
      get pathname() { return currentUrl.pathname },
      get search() { return currentUrl.search },
      get hash() { return currentUrl.hash },
      get href() { return currentUrl.href },
    },
    sessionStorage: {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => stored.set(key, value),
      removeItem: (key: string) => stored.delete(key),
    },
  } })
  try { check({ url: () => currentUrl, history, nextTree }) } finally {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow)
    else Reflect.deleteProperty(globalThis, "window")
    if (previousHistory) Object.defineProperty(globalThis, "History", previousHistory)
    else Reflect.deleteProperty(globalThis, "History")
  }
}

test("B-HISTORY-SAMPLE-001 default artifact entry keeps '/' stable and preserves Next hydration metadata", () => {
  withHistory("/", null, ({ url, history, nextTree }) => {
    initializeBDiscoveryHistory(() => undefined)
    expect(url().pathname + url().search).toBe("/")
    expect(history.state).toMatchObject({ __NA: true })
    expect((history.state as Record<string, unknown>).__PRIVATE_NEXTJS_INTERNALS_TREE).toBe(nextTree)
    const calls = history.replaceCalls
    normalizeBDiscoveryHistoryForActiveDocument()
    expect(history.replaceCalls).toBe(calls)
  })
})

for (const choice of ["0", "1"] as const) {
  test(`B-HISTORY-SAMPLE-002 explicit review=${choice} survives city changes`, () => {
    withHistory(`/?review=${choice}&city=jeju`, null, ({ url, history, nextTree }) => {
      initializeBDiscoveryHistory(() => undefined)
      expect(url().searchParams.get("review")).toBe(choice)
      restoreBDiscoveryCityContext({ city: "busan", view: "map", query: "", category: "all", focus: "search" })
      expect(url().searchParams.get("review")).toBe(choice)
      expect(url().searchParams.get("city")).toBe("busan")
      expect((history.state as Record<string, unknown>).__PRIVATE_NEXTJS_INTERNALS_TREE).toBe(nextTree)
    })
  })
}

test("B-HISTORY-SAMPLE-003 stored opt-out stays outside the default sample environment", () => {
  withHistory("/?city=seoul", "0", ({ url }) => {
    initializeBDiscoveryHistory(() => undefined)
    expect(url().searchParams.get("review")).toBe(SAMPLE_ENVIRONMENT_ENABLED ? "0" : null)
    expect(url().searchParams.get("city")).toBe("seoul")
  })
})

test("B-HISTORY-SAMPLE-004 explicit session opt-in needs a query only in a provider artifact", () => {
  withHistory("/?city=seoul", "1", ({ url }) => {
    initializeBDiscoveryHistory(() => undefined)
    expect(url().searchParams.get("review")).toBe(SAMPLE_ENVIRONMENT_ENABLED ? null : "1")
    expect(url().searchParams.get("city")).toBe("seoul")
  })
})
