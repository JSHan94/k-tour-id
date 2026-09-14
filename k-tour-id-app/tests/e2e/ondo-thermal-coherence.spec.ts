import { mkdirSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"
import { temperatureSampleColor, temperatureSampleWeight } from "../../features/ondo/contracts/temperature-timeline"

const EVIDENCE = resolve("artifacts/qa/thermal-coherence-20260909")

for (const scenario of [{ width: 390, appearance: "light" }, { width: 320, appearance: "dark" }] as const) {
  test(`a geographic sample point opens a synchronized live sample peek: ${scenario.width}px ${scenario.appearance}`, async ({ browser, baseURL }) => {
    test.setTimeout(75_000)
    const context = await browser.newContext({ viewport: { width: scenario.width, height: 844 }, reducedMotion: "no-preference", colorScheme: scenario.appearance })
    await context.addInitScript(({ appearance }) => localStorage.setItem("ondo-b.device.v1", JSON.stringify({ locale: "en", appearancePreference: appearance, onboarding: "ONB-COMPLETE" })), scenario)
    const page = await context.newPage()
    const errors: string[] = []
    page.on("pageerror", error => errors.push(error.message))
    await page.goto(`${baseURL}/?city=busan&q=${encodeURIComponent("다미복국")}`, { waitUntil: "domcontentloaded" })
    const map = page.getByTestId("maplibre-map")
    const timeline = page.getByTestId("ondo-temperature-timeline")
    await expect(map).toHaveAttribute("data-map-state", "ready")
    await expect(timeline).toHaveAttribute("data-sample-core-count", "1")
    await expect(timeline).toHaveAttribute("data-running", "true")
    const mapBox = await map.boundingBox()
    expect(mapBox).not.toBeNull()
    // One filtered canonical coordinate sits at the map camera center. This
    // exercises the real MapLibre hit layer, not a DOM marker or QA shortcut.
    await page.mouse.click(mapBox!.x + mapBox!.width / 2, mapBox!.y + mapBox!.height / 2)
    const peek = page.getByTestId("canonical-place-peek")
    await expect(peek).toBeVisible()
    await expect(peek).toHaveAttribute("data-venue-id", "mois-89dfce67a7a11084ff09")
    const meter = peek.getByTestId("canonical-place-pulse")
    await expect(meter).toHaveAttribute("data-origin", "PREPARED_ILLUSTRATION")
    await expect(timeline).toHaveAttribute("data-running", "true")
    const before = await meter.getAttribute("data-sample-weight")
    await expect.poll(() => meter.getAttribute("data-sample-weight"), { timeout: 7000 }).not.toBe(before)
    await expect.poll(async () => (await meter.getAttribute("data-sample-minute")) === (await timeline.getAttribute("data-sample-source-minute"))).toBe(true)
    const presentation = await meter.evaluate(node => ({ weight: Number(node.getAttribute("data-sample-weight")), color: (node as HTMLElement).style.getPropertyValue("--sample-color") }))
    expect(presentation.color).toBe(temperatureSampleColor(presentation.weight))
    expect(await page.locator("html").evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
    const peekBox = await peek.boundingBox()
    expect(peekBox!.y + peekBox!.height).toBeLessThanOrEqual(845)
    mkdirSync(EVIDENCE, { recursive: true })
    await page.screenshot({ path: resolve(EVIDENCE, `sample-peek-${scenario.width}-${scenario.appearance}.png`) })
    await page.getByRole("button", { name: "Close place", exact: true }).click()
    await expect(peek).toHaveCount(0)
    await timeline.getByRole("button", { name: "Pause sample evening" }).click()
    const paused = await timeline.getAttribute("data-minute")
    await page.waitForTimeout(1300)
    await expect(timeline).toHaveAttribute("data-minute", paused!)
    expect(errors).toEqual([])
    await context.close()
  })
}

test("sample replay reaches the evening boundary and reverses without becoming a stopped map", async ({ browser, baseURL }) => {
  test.setTimeout(35_000)
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "no-preference" })
  await context.addInitScript(() => localStorage.setItem("ondo-b.device.v1", JSON.stringify({ locale: "en", onboarding: "ONB-COMPLETE" })))
  const page = await context.newPage()
  await page.goto(`${baseURL}/?city=busan`, { waitUntil: "domcontentloaded" })
  const timeline = page.getByTestId("ondo-temperature-timeline")
  await expect(timeline).toHaveAttribute("data-running", "true")
  mkdirSync(EVIDENCE, { recursive: true })
  await page.screenshot({ path: resolve(EVIDENCE, "busan-motion-before.png") })
  const firstCores = await timeline.getAttribute("data-sample-core-signature")
  await page.waitForTimeout(5000)
  await expect(timeline).not.toHaveAttribute("data-sample-core-signature", firstCores!)
  await page.screenshot({ path: resolve(EVIDENCE, "busan-motion-after-5s.png") })
  await timeline.locator("summary").click()
  await timeline.getByRole("slider").fill("1370")
  await timeline.locator("summary").click()
  await timeline.getByRole("button", { name: "Play sample evening" }).click()
  await expect(timeline).toHaveAttribute("data-playback-direction", "backward")
  await expect(timeline).toHaveAttribute("data-running", "true")
  await expect.poll(async () => Number(await timeline.getAttribute("data-minute"))).toBeLessThan(1380)
  await expect(timeline).toHaveAttribute("data-running", "true")
  await context.close()
})

test("Jeju sample peek shares map activity without inventing an editorial score", async ({ browser, baseURL }) => {
  test.setTimeout(45_000)
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "no-preference" })
  await context.addInitScript(() => localStorage.setItem("ondo-b.device.v1", JSON.stringify({ locale: "en", onboarding: "ONB-COMPLETE" })))
  const page = await context.newPage()
  await page.goto(`${baseURL}/?city=jeju&q=${encodeURIComponent("성산일출봉")}&editorialPlaceId=jeju-seongsan-ilchulbong`, { waitUntil: "domcontentloaded" })
  const map = page.getByTestId("maplibre-map")
  const timeline = page.getByTestId("ondo-temperature-timeline")
  await expect(map).toHaveAttribute("data-map-state", "ready")
  const peek = page.getByTestId("ondo-b-editorial-place-peek")
  await expect(peek).toBeVisible()
  await peek.getByRole("button", { name: "Close place", exact: true }).click()
  await expect(peek).toHaveCount(0)
  await expect(timeline).toHaveAttribute("data-sample-core-count", "1")
  await timeline.getByRole("button", { name: "Pause sample evening" }).click()
  await expect(timeline).toHaveAttribute("data-running", "false")
  await expect.poll(async () => (await timeline.getAttribute("data-minute")) === (await timeline.getAttribute("data-sample-source-minute"))).toBe(true)
  const minute = Number(await timeline.getAttribute("data-minute"))
  const color = temperatureSampleColor(temperatureSampleWeight("jeju", "jeju-seongsan-ilchulbong", minute))
  const mapBox = await map.boundingBox()
  const renderedMap = (await map.screenshot()).toString("base64")
  // The Jeju camera preserves UI padding, so its real geographic point is
  // NOT the element's center. Locate the only rendered core in the PNG, then
  // tap that visible pixel. No private map hook, forced click or state write.
  const renderedCore = await page.evaluate(async ({ png, color }) => {
    const bitmap = new Image()
    bitmap.src = `data:image/png;base64,${png}`
    await bitmap.decode()
    const canvas = document.createElement("canvas")
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const context = canvas.getContext("2d")!
    context.drawImage(bitmap, 0, 0)
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height)
    const expected = [1, 3, 5].map(offset => Number.parseInt(color.slice(offset, offset + 2), 16))
    let totalX = 0, totalY = 0, count = 0
    for (let y = Math.ceil(canvas.height * .32); y < canvas.height * .87; y++) {
      for (let x = Math.ceil(canvas.width * .05); x < canvas.width * .95; x++) {
        const offset = (y * canvas.width + x) * 4
        const rgb = [data[offset], data[offset + 1], data[offset + 2]]
        const distance = Math.hypot(...rgb.map((value, index) => value - expected[index]))
        if (Math.max(...rgb) - Math.min(...rgb) > 65 && distance < 40) { totalX += x; totalY += y; count++ }
      }
    }
    return count ? { x: totalX / count / canvas.width, y: totalY / count / canvas.height, count } : null
  }, { png: renderedMap, color })
  expect(renderedCore, "one visible sample core must be present at its real coordinate").not.toBeNull()
  await timeline.getByRole("button", { name: "Play sample evening" }).click()
  await page.mouse.click(mapBox!.x + renderedCore!.x * mapBox!.width, mapBox!.y + renderedCore!.y * mapBox!.height)
  await expect(peek).toBeVisible()
  const meter = peek.locator('[data-origin="PREPARED_ILLUSTRATION"]')
  await expect(meter).toHaveAttribute("data-temperature-score", "none")
  await expect(meter).toHaveAttribute("data-sample-venue-id", "jeju-seongsan-ilchulbong")
  const before = await meter.getAttribute("data-sample-weight")
  await expect.poll(() => meter.getAttribute("data-sample-weight"), { timeout: 7000 }).not.toBe(before)
  await expect.poll(async () => (await meter.getAttribute("data-sample-minute")) === (await timeline.getAttribute("data-sample-source-minute"))).toBe(true)
  mkdirSync(EVIDENCE, { recursive: true })
  await page.screenshot({ path: resolve(EVIDENCE, "sample-peek-jeju-390.png") })
  await peek.getByTestId("ondo-b-editorial-place-details").click()
  await expect(page.getByTestId("ondo-b-editorial-place-temperature")).toHaveAttribute("data-temperature-score", "none")
  await context.close()
})
