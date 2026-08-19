import { expect, type Page } from "@playwright/test"

export const B_ROUTE = "/ondo-b"
export const B_ROUTE_SEAM_READY = false

export const B_FLOW_IDS = [
  "FL-001", "FL-002", "FL-003", "FL-004", "FL-005", "FL-006",
  "FL-007", "FL-008", "FL-009", "FL-010", "FL-011", "FL-012",
  "FL-013", "FL-014", "FL-015", "FL-016", "FL-017", "FL-018",
] as const

export const B_CHECKPOINTS = [
  "ENTRY", "DECISION", "CANCEL", "ERROR", "RETRY", "TERMINAL", "RETURN",
] as const

export type BFlowId = (typeof B_FLOW_IDS)[number]
export type BCheckpoint = (typeof B_CHECKPOINTS)[number]
export type BLocale = "en" | "ko"

const checkpointValue: Record<BCheckpoint, string> = {
  ENTRY: "entry",
  DECISION: "decision",
  CANCEL: "cancel",
  ERROR: "error",
  RETRY: "retry",
  TERMINAL: "terminal",
  RETURN: "return",
}

export type BBrowserCase = {
  id: `B-E2E-${BFlowId}-${BCheckpoint}`
  flow: BFlowId
  checkpoint: BCheckpoint
  locale: BLocale
}

export type BPixelCase = {
  id: `B-PX-${BFlowId}-${"ENTRY-390-EN" | "ERROR-390-KO" | "TERMINAL-430-EN" | "RETURN-DESKTOP-EN"}`
  flow: BFlowId
  checkpoint: "ENTRY" | "ERROR" | "TERMINAL" | "RETURN"
  locale: BLocale
  width: 390 | 430 | 1440
  height: 844 | 932 | 1000
  project: "mobile-chromium" | "desktop-chromium"
}

export const B_BROWSER_CASES: readonly BBrowserCase[] = B_FLOW_IDS.flatMap((flow) =>
  B_CHECKPOINTS.map((checkpoint) => ({
    id: `B-E2E-${flow}-${checkpoint}` as const,
    flow,
    checkpoint,
    locale: checkpoint === "CANCEL" || checkpoint === "ERROR" ? "ko" as const : "en" as const,
  })),
)

export const B_PIXEL_CASES: readonly BPixelCase[] = B_FLOW_IDS.flatMap((flow) => [
  { id: `B-PX-${flow}-ENTRY-390-EN` as const, flow, checkpoint: "ENTRY" as const, locale: "en" as const, width: 390 as const, height: 844 as const, project: "mobile-chromium" as const },
  { id: `B-PX-${flow}-ERROR-390-KO` as const, flow, checkpoint: "ERROR" as const, locale: "ko" as const, width: 390 as const, height: 844 as const, project: "mobile-chromium" as const },
  { id: `B-PX-${flow}-TERMINAL-430-EN` as const, flow, checkpoint: "TERMINAL" as const, locale: "en" as const, width: 430 as const, height: 932 as const, project: "mobile-chromium" as const },
  { id: `B-PX-${flow}-RETURN-DESKTOP-EN` as const, flow, checkpoint: "RETURN" as const, locale: "en" as const, width: 1440 as const, height: 1000 as const, project: "desktop-chromium" as const },
])

export const B_CONTENT_CASES = B_FLOW_IDS.flatMap((flow) => (["ko", "en"] as const).map((locale) => ({
  id: `B-COPY-${flow}-${locale.toUpperCase()}` as const,
  flow,
  locale,
})))

const runtimeFailures = new WeakMap<Page, string[]>()

export function installBRuntimeGuard(page: Page) {
  const failures: string[] = []
  runtimeFailures.set(page, failures)
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console: ${message.text()}`)
  })
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`))
}

export async function expectBRuntimeClean(page: Page) {
  expect(runtimeFailures.get(page) ?? []).toEqual([])
}

export async function prepareBPage(page: Page) {
  await page.clock.setFixedTime(new Date("2026-08-19T20:30:00+09:00"))
  await page.addInitScript(() => {
    window.addEventListener("unhandledrejection", (event) => {
      console.error(`unhandledrejection: ${String(event.reason)}`)
    })
  })
}

export function bCaseUrl(flow: BFlowId, checkpoint: BCheckpoint, locale: BLocale) {
  const id = `B-E2E-${flow}-${checkpoint}`
  return `${B_ROUTE}?qaCase=${encodeURIComponent(id)}&locale=${locale}`
}

export async function expectBRoot(page: Page, flow: BFlowId, checkpoint: BCheckpoint, locale: BLocale) {
  const root = page.getByTestId("ondo-b-root")
  await expect(root).toBeVisible()
  await expect(root).toHaveAttribute("data-variant", "B")
  await expect(root).toHaveAttribute("data-b-flow", flow)
  await expect(root).toHaveAttribute("data-b-checkpoint", checkpointValue[checkpoint])
  await expect(root).toHaveAttribute("data-locale", locale)
  return root
}

export async function expectNoRawTruthLeaks(page: Page) {
  const text = await page.getByTestId("ondo-b-root").innerText()
  for (const forbidden of [/\bFX-[A-Z0-9-]+\b/, /\bSCN-[A-Z0-9-]+\b/, /fixtureId/i, /stack trace/i, /\bundefined\b/i, /\bnull\b/i]) {
    expect(text, `forbidden product copy: ${String(forbidden)}`).not.toMatch(forbidden)
  }
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
}

export async function expectMinimumControlTargets(page: Page) {
  const undersized = await page.getByTestId("ondo-b-root").locator("button:visible, a[href]:visible, [role='button']:visible").evaluateAll((nodes) => nodes.flatMap((node) => {
    const element = node as HTMLElement
    if (element.getAttribute("aria-disabled") === "true" || (element instanceof HTMLButtonElement && element.disabled)) return []
    const box = element.getBoundingClientRect()
    return box.width < 44 || box.height < 44
      ? [{ action: element.getAttribute("data-b-action-id") ?? element.textContent?.trim() ?? element.tagName, width: box.width, height: box.height }]
      : []
  }))
  expect(undersized).toEqual([])
}

export async function expectActionInventory(page: Page) {
  const missing = await page.getByTestId("ondo-b-root").locator("button:visible, [role='button']:visible").evaluateAll((nodes) => nodes.flatMap((node) => {
    const element = node as HTMLElement
    if (element.getAttribute("aria-disabled") === "true" || (element instanceof HTMLButtonElement && element.disabled)) return []
    return element.hasAttribute("data-b-action-id")
      ? []
      : [element.textContent?.trim() || element.getAttribute("aria-label") || element.tagName]
  }))
  expect(missing, "every enabled product action must be in the B action inventory").toEqual([])
}

export function expectedAction(checkpoint: BCheckpoint) {
  if (checkpoint === "ENTRY" || checkpoint === "DECISION" || checkpoint === "RETRY" || checkpoint === "TERMINAL") return "primary" as const
  if (checkpoint === "CANCEL") return "cancel" as const
  if (checkpoint === "ERROR") return "retry" as const
  return "none" as const
}

export function expectedNextCheckpoint(checkpoint: BCheckpoint): BCheckpoint | null {
  if (checkpoint === "ENTRY") return "DECISION"
  if (checkpoint === "DECISION") return "TERMINAL"
  if (checkpoint === "CANCEL") return "RETURN"
  if (checkpoint === "ERROR") return "RETRY"
  if (checkpoint === "RETRY") return "DECISION"
  if (checkpoint === "TERMINAL") return "RETURN"
  return null
}

export function actionSelector(checkpoint: BCheckpoint) {
  const action = expectedAction(checkpoint)
  if (action === "primary") return "[data-b-primary-action]"
  if (action === "cancel") return "[data-b-cancel-action]"
  if (action === "retry") return "[data-b-retry-action]"
  return null
}
