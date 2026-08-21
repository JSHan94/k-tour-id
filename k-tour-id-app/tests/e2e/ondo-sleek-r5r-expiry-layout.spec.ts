import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import {
  expectBRuntimeClean,
  gotoB,
  installBRuntimeGuard,
  prepareBPage,
  seedB,
  type BLocale,
} from "../helpers/ondo-b-qa"

const FROZEN_VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 801, height: 1000 },
  { width: 1440, height: 1000 },
] as const

const REFLOW_VIEWPORTS = [
  { width: 320, height: 800 },
  { width: 740, height: 360 },
  { width: 844, height: 390 },
  { width: 926, height: 428 },
] as const

type GeometryEvidence = {
  viewport: { width: number; height: number }
  listPanel: RectEvidence
  notice: RectEvidence
  resultBar: RectEvidence
  resultToggle: ControlEvidence
  recheck: ControlEvidence
  close: ControlEvidence
  rowIntersections: Array<{
    row: string
    recheckArea: number
    closeArea: number
  }>
}

type RectEvidence = {
  x: number
  y: number
  width: number
  height: number
  top: number
  right: number
  bottom: number
  left: number
}

type ControlEvidence = RectEvidence & { centerHit: boolean }

function area(first: RectEvidence, second: RectEvidence) {
  const width = Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left))
  const height = Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top))
  return width * height
}

async function collectGeometry(page: Page, locale: BLocale): Promise<GeometryEvidence> {
  return page.evaluate((nextLocale) => {
    const rect = (element: Element) => {
      const box = element.getBoundingClientRect()
      return {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        top: box.top,
        right: box.right,
        bottom: box.bottom,
        left: box.left,
      }
    }
    const intersectionArea = (first: ReturnType<typeof rect>, second: ReturnType<typeof rect>) => {
      const width = Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left))
      const height = Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top))
      return width * height
    }
    const control = (element: Element) => {
      const box = rect(element)
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
      return { ...box, centerHit: hit === element || element.contains(hit) }
    }
    const notice = document.querySelector<HTMLElement>("[data-testid='after19-expiry-notice']")
    const listPanel = document.querySelector<HTMLElement>("[data-testid='ondo-b-list-panel']")
    const list = document.querySelector<HTMLElement>("[data-testid='ondo-b-venue-list']")
    const resultToggle = document.querySelector<HTMLElement>("[data-testid='ondo-b-view-toggle']")
    const resultBar = resultToggle?.parentElement
    if (!notice || !listPanel || !list || !resultToggle || !resultBar) throw new Error("expiry notice or list layout is missing")
    const recheck = Array.from(notice.querySelectorAll("button")).find((button) => button.textContent?.includes(nextLocale === "ko" ? "19+ 다시 확인" : "Check 19+ again"))
    const close = notice.querySelector(`button[aria-label='${nextLocale === "ko" ? "닫기" : "Close"}']`)
    if (!recheck || !close) throw new Error("expiry notice controls are missing")
    const recheckRect = control(recheck)
    const closeRect = control(close)
    const listRect = rect(listPanel)
    const rowIntersections = Array.from(list.querySelectorAll<HTMLElement>("li > button")).flatMap((row) => {
      const style = getComputedStyle(row)
      const rawRowRect = rect(row)
      const rowRect = {
        x: Math.max(0, listRect.left, rawRowRect.left),
        y: Math.max(0, listRect.top, rawRowRect.top),
        left: Math.max(0, listRect.left, rawRowRect.left),
        right: Math.min(innerWidth, listRect.right, rawRowRect.right),
        top: Math.max(0, listRect.top, rawRowRect.top),
        bottom: Math.min(innerHeight, listRect.bottom, rawRowRect.bottom),
        width: 0,
        height: 0,
      }
      rowRect.width = Math.max(0, rowRect.right - rowRect.left)
      rowRect.height = Math.max(0, rowRect.bottom - rowRect.top)
      if (style.display === "none" || style.visibility === "hidden" || rowRect.bottom <= 0 || rowRect.top >= innerHeight) return []
      const rowHit = document.elementFromPoint(rowRect.left + rowRect.width / 2, rowRect.top + rowRect.height / 2)
      if (!rowHit || (rowHit !== row && !row.contains(rowHit))) return []
      const recheckArea = intersectionArea(rowRect, recheckRect)
      const closeArea = intersectionArea(rowRect, closeRect)
      if (recheckArea <= .5 && closeArea <= .5) return []
      return [{
        row: row.textContent?.trim().replace(/\s+/g, " ").slice(0, 100) ?? "venue row",
        recheckArea,
        closeArea,
      }]
    })
    return {
      viewport: { width: innerWidth, height: innerHeight },
      listPanel: listRect,
      notice: rect(notice),
      resultBar: rect(resultBar),
      resultToggle: control(resultToggle),
      recheck: recheckRect,
      close: closeRect,
      rowIntersections,
    }
  }, locale)
}

async function openExpiredList(page: Page, locale: BLocale) {
  await seedB(page, {
    locale,
    session: {
      age: "AGE-VERIFIED",
      ageExpiresAt: "2020-08-19T20:30:00+09:00",
      after19: "A19-ON",
    },
  })
  await gotoB(page, "?city=seoul&view=list")
  await expect(page.getByTestId("after19-expiry-notice")).toBeVisible()
  await expect(page.getByTestId("ondo-b-venue-list")).toBeAttached()
}

test.describe("SLEEK-R5 retry expired After 19 notice layout closure", () => {
  test.describe.configure({ timeout: 240_000 })

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "One actual-Chromium project owns the explicit viewport matrix.")
    installBRuntimeGuard(page)
    await prepareBPage(page)
  })

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.project.name === "desktop-chromium") await expectBRuntimeClean(page)
  })

  for (const locale of ["en", "ko"] as const) {
    for (const audited of [
      ...FROZEN_VIEWPORTS.map((viewport) => ({ viewport, matrix: "frozen" })),
      ...REFLOW_VIEWPORTS.map((viewport) => ({ viewport, matrix: "reflow" })),
    ] as const) {
      const { viewport, matrix } = audited
      test(`${locale.toUpperCase()} ${viewport.width}x${viewport.height} ${matrix} expiry notice keeps list controls independent`, async ({ page }, testInfo) => {
        await page.setViewportSize(viewport)
        await openExpiredList(page, locale)
        const geometry = await collectGeometry(page, locale)
        await testInfo.attach(`${locale}-${viewport.width}x${viewport.height}-expiry-geometry.json`, {
          body: JSON.stringify(geometry, null, 2),
          contentType: "application/json",
        })

        for (const control of [geometry.recheck, geometry.close]) {
          expect(control.width).toBeGreaterThanOrEqual(44)
          expect(control.height).toBeGreaterThanOrEqual(44)
          expect(control.centerHit).toBe(true)
          expect(area(geometry.notice, control)).toBeGreaterThanOrEqual(control.width * control.height - 1)
        }
        expect(geometry.rowIntersections).toEqual([])
        expect(geometry.listPanel.bottom).toBeLessThanOrEqual(geometry.notice.top - 7)
        expect(area(geometry.recheck, geometry.resultToggle)).toBeLessThanOrEqual(.5)
        expect(area(geometry.close, geometry.resultToggle)).toBeLessThanOrEqual(.5)

        const axe = await new AxeBuilder({ page }).include("[data-testid='ondo-b-root']").analyze()
        expect(axe.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")).toEqual([])

        const close = page.getByTestId("after19-expiry-notice").getByRole("button", { name: locale === "ko" ? "닫기" : "Close", exact: true })
        await close.click()
        await expect(page.getByTestId("after19-expiry-notice")).toHaveCount(0)
        const firstRow = page.getByTestId("ondo-b-venue-list").getByRole("button").first()
        await expect(firstRow).toBeVisible()
        await expect(firstRow).toBeEnabled()
        expect(await firstRow.evaluate((element) => {
          const rect = element.getBoundingClientRect()
          const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
          return hit === element || element.contains(hit)
        })).toBe(true)

        if ([320, 740, 926].includes(viewport.width)) {
          const lastRow = page.getByTestId("ondo-b-venue-list").locator("li > button").last()
          await lastRow.scrollIntoViewIfNeeded()
          expect(await lastRow.evaluate((element) => {
            const panel = document.querySelector<HTMLElement>("[data-testid='ondo-b-list-panel']")
            if (!panel) return false
            const rowRect = element.getBoundingClientRect()
            const panelRect = panel.getBoundingClientRect()
            const x = rowRect.left + rowRect.width / 2
            const y = rowRect.top + rowRect.height / 2
            const hit = document.elementFromPoint(x, y)
            return rowRect.top >= panelRect.top - .5
              && rowRect.bottom <= panelRect.bottom + .5
              && (hit === element || element.contains(hit))
          })).toBe(true)
        }
      })
    }
  }
})
