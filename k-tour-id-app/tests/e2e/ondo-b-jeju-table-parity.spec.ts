import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { gotoB, prepareBPage, seedB } from "../helpers/ondo-b-qa"

const FOOD_PLACE_ID = "jeju-haenyeo-kitchen-bukchon"
const GENERAL_FOOD_PLACE_ID = "jeju-donsadon"
const LANDMARK_ID = "jeju-seongsan-ilchulbong"
const TABLE_ID = "table-jeju-haenyeo-supper"
const DEVICE_KEY = "ondo-b.device.v1"

async function openEditorialDetail(page: Page, placeId: string) {
  await gotoB(page, "?city=jeju&view=list")
  await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-map-state", /ready|partial|error/, { timeout: 20_000 })
  const list = page.getByTestId("ondo-b-editorial-place-list")
  const opener = list.locator(`[data-editorial-place-id='${placeId}'] [data-editorial-place-opener='${placeId}']`)
  await expect(opener).toBeVisible()
  await opener.scrollIntoViewIfNeeded()
  await opener.click()
  const peek = page.getByTestId("ondo-b-editorial-place-peek")
  await expect(peek).toHaveAttribute("data-editorial-place-id", placeId)
  await peek.getByTestId("ondo-b-editorial-place-details").click()
  const detail = page.getByTestId("ondo-b-editorial-place-overlay")
  await expect(detail).toHaveAttribute("data-editorial-place-id", placeId)
  return detail
}

test.describe("Jeju editorial place · Table parity", () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90_000)
    await prepareBPage(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await seedB(page, { locale: "en", local: { autoNight: false } })
  })

  test("verified food place opens its exact Table, joins with Account only, and returns from My Korea", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 })
    const place = await openEditorialDetail(page, FOOD_PLACE_ID)
    await expect(place).toHaveAttribute("data-official-record", "false")
    const tableAction = place.getByTestId("ondo-b-editorial-place-table")
    await expect(tableAction).toBeVisible()
    await expect(tableAction).toContainText("Dinner in Bukchon")

    const expectDetailStack = async () => {
      const heroBox = await place.getByTestId("ondo-b-editorial-place-hero").boundingBox()
      const identityBox = await place.getByTestId("ondo-b-editorial-place-identity").boundingBox()
      const temperatureBox = await place.getByTestId("ondo-b-editorial-place-temperature").boundingBox()
      expect(heroBox).not.toBeNull()
      expect(identityBox).not.toBeNull()
      expect(temperatureBox).not.toBeNull()
      expect(identityBox!.y).toBeGreaterThanOrEqual(heroBox!.y + heroBox!.height + 8)
      expect(temperatureBox!.y).toBeGreaterThanOrEqual(identityBox!.y + identityBox!.height + 8)
    }
    await expectDetailStack()
    await page.setViewportSize({ width: 390, height: 844 })
    await expectDetailStack()

    await tableAction.click()

    await expect(page.getByTestId("nav-tables")).toHaveAttribute("aria-current", "page")
    const table = page.getByTestId("table-detail")
    await expect(table).toHaveAttribute("data-table-id", TABLE_ID)
    await expect(table).toHaveAttribute("data-venue-id", FOOD_PLACE_ID)
    await expect(table.getByTestId("table-place-context")).toHaveAttribute("data-place-kind", "editorial")
    await expect(table.getByTestId("table-place-context")).toContainText("Haenyeo’s Kitchen Bukchon Branch")
    await expect(table.locator("[data-fact-kind]")).toHaveCount(6)
    await expect(table.locator("[data-fact-kind='cost']")).toContainText("₩32,000")
    await expect(table).not.toContainText(/official record|reservation sent|sample|preview|fixture/i)
    await expect(table.locator("[class*='ageNotice']")).toHaveCount(0)

    const axe = await new AxeBuilder({ page }).include("[data-testid='table-detail']").analyze()
    expect(axe.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])

    await table.getByTestId("table-join").click()
    const gate = page.getByTestId("ondo-b-action-gate")
    await expect(gate).toHaveAttribute("data-active-gate", "account")
    await expect(gate.getByTestId("action-gate-return-context")).toHaveAttribute("data-return-table", TABLE_ID)
    await expect(gate.getByTestId("action-gate-return-context")).toHaveAttribute("data-return-venue", FOOD_PLACE_ID)
    await gate.getByTestId("action-gate-confirm").click()
    await expect(gate).toHaveCount(0)
    await expect(table.getByTestId("table-join-confirmation")).toBeVisible()
    await expect(page.getByTestId("after19-start")).toHaveCount(0)

    await table.getByTestId("table-join-confirm").click()
    await expect(table.getByTestId("table-open-chat")).toBeVisible()
    await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}").plannedTableRefs ?? [], DEVICE_KEY)).toEqual([{
      tableId: TABLE_ID,
      venueId: FOOD_PLACE_ID,
    }])

    await table.locator("header").getByRole("button", { name: "Close Table" }).first().click()
    await expect(table).toHaveCount(0)
    await page.getByTestId("nav-my").click()
    const planned = page.getByTestId(`planned-table-${TABLE_ID}`)
    await expect(planned).toContainText("Haenyeo’s Kitchen Bukchon Branch")
    await planned.getByRole("button", { name: "Open Table" }).click()
    await expect(page.getByTestId("table-detail")).toHaveAttribute("data-table-id", TABLE_ID)
    await expect(page.getByTestId("table-open-chat")).toBeVisible()
  })

  test("non-food Jeju landmark does not fabricate a Table entry", async ({ page }) => {
    const place = await openEditorialDetail(page, LANDMARK_ID)
    await expect(place).toHaveAttribute("data-official-record", "false")
    await expect(place.getByTestId("ondo-b-editorial-place-table")).toHaveCount(0)
    await expect(place.getByTestId("ondo-b-editorial-place-browse-tables")).toHaveCount(0)
  })

  test("food place without an exact event can browse Tables without claiming availability", async ({ page }) => {
    const place = await openEditorialDetail(page, GENERAL_FOOD_PLACE_ID)
    await expect(place).toHaveAttribute("data-official-record", "false")
    await expect(place.getByTestId("ondo-b-editorial-place-table")).toHaveCount(0)

    const browse = place.getByTestId("ondo-b-editorial-place-browse-tables")
    await expect(browse).toBeVisible()
    await expect(browse).toHaveText("Browse Tables")
    await browse.click()

    await expect(page.getByTestId("nav-tables")).toHaveAttribute("aria-current", "page")
    await expect(page.getByTestId("table-detail")).toHaveCount(0)
    await expect(page.getByTestId("tables-entry")).toBeVisible()
  })
})
