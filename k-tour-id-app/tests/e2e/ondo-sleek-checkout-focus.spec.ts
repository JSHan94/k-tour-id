import { expect, test, type Locator, type Page } from "@playwright/test"
import {
  CANONICAL_VENUE_ID,
  openCanonicalVenue,
  prepareBPage,
  seedB,
  type BLocale,
} from "../helpers/ondo-b-qa"

const READY_SESSION = {
  account: "ACC-ACTIVE",
  person: "PER-VERIFIED",
  age: "AGE-VERIFIED",
  ageExpiresAt: "2026-08-21T20:00:00+09:00",
  paymentKyc: "PKY-VERIFIED",
  stamps: 9,
}

async function settleFocusOwner(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 0)))
  }))
}

async function holdAnimationFrames(page: Page) {
  await page.evaluate(() => {
    type HeldFrameWindow = Window & typeof globalThis & {
      __checkoutNativeRaf?: typeof requestAnimationFrame
      __checkoutNativeCancelRaf?: typeof cancelAnimationFrame
      __checkoutHeldFrames?: Map<number, FrameRequestCallback>
      __checkoutNextFrameId?: number
    }
    const frameWindow = window as HeldFrameWindow
    if (frameWindow.__checkoutNativeRaf) return
    frameWindow.__checkoutNativeRaf = window.requestAnimationFrame.bind(window)
    frameWindow.__checkoutNativeCancelRaf = window.cancelAnimationFrame.bind(window)
    frameWindow.__checkoutHeldFrames = new Map()
    frameWindow.__checkoutNextFrameId = 1_000_000
    window.requestAnimationFrame = (callback) => {
      const id = frameWindow.__checkoutNextFrameId ?? 1_000_000
      frameWindow.__checkoutNextFrameId = id + 1
      frameWindow.__checkoutHeldFrames?.set(id, callback)
      return id
    }
    window.cancelAnimationFrame = (id) => {
      if (frameWindow.__checkoutHeldFrames?.delete(id)) return
      frameWindow.__checkoutNativeCancelRaf?.(id)
    }
  })
}

async function flushHeldAnimationFrames(page: Page) {
  await page.evaluate(async () => {
    type HeldFrameWindow = Window & typeof globalThis & {
      __checkoutNativeRaf?: typeof requestAnimationFrame
      __checkoutNativeCancelRaf?: typeof cancelAnimationFrame
      __checkoutHeldFrames?: Map<number, FrameRequestCallback>
      __checkoutNextFrameId?: number
    }
    const frameWindow = window as HeldFrameWindow
    for (let round = 0; round < 3; round += 1) {
      const batch = [...(frameWindow.__checkoutHeldFrames?.values() ?? [])]
      frameWindow.__checkoutHeldFrames?.clear()
      batch.forEach((callback) => callback(performance.now()))
    }
    if (frameWindow.__checkoutNativeRaf) window.requestAnimationFrame = frameWindow.__checkoutNativeRaf
    if (frameWindow.__checkoutNativeCancelRaf) window.cancelAnimationFrame = frameWindow.__checkoutNativeCancelRaf
    delete frameWindow.__checkoutNativeRaf
    delete frameWindow.__checkoutNativeCancelRaf
    delete frameWindow.__checkoutHeldFrames
    delete frameWindow.__checkoutNextFrameId
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
  })
}

async function holdCheckoutCompletion(page: Page) {
  await page.evaluate(() => {
    type HeldCompletionWindow = Window & typeof globalThis & {
      __checkoutNativeSetTimeout?: typeof setTimeout
      __checkoutNativeClearTimeout?: typeof clearTimeout
      __checkoutCompletion?: { id: number; handler: TimerHandler; args: unknown[]; cancelled: boolean }
    }
    const timerWindow = window as HeldCompletionWindow
    timerWindow.__checkoutNativeSetTimeout = window.setTimeout.bind(window)
    timerWindow.__checkoutNativeClearTimeout = window.clearTimeout.bind(window)
    window.setTimeout = ((handler: TimerHandler, timeout = 0, ...args: unknown[]) => {
      if (timeout === 520 && !timerWindow.__checkoutCompletion) {
        const id = 2_000_000
        timerWindow.__checkoutCompletion = { id, handler, args, cancelled: false }
        return id
      }
      return timerWindow.__checkoutNativeSetTimeout?.(handler, timeout, ...args) ?? 0
    }) as typeof window.setTimeout
    window.clearTimeout = ((id: number | undefined) => {
      const completion = timerWindow.__checkoutCompletion
      if (completion && id === completion.id) {
        completion.cancelled = true
        return
      }
      timerWindow.__checkoutNativeClearTimeout?.(id)
    }) as typeof window.clearTimeout
  })
}

async function releaseCheckoutCompletion(page: Page) {
  await page.evaluate(() => {
    type HeldCompletionWindow = Window & typeof globalThis & {
      __checkoutNativeSetTimeout?: typeof setTimeout
      __checkoutNativeClearTimeout?: typeof clearTimeout
      __checkoutCompletion?: { id: number; handler: TimerHandler; args: unknown[]; cancelled: boolean }
    }
    const timerWindow = window as HeldCompletionWindow
    const completion = timerWindow.__checkoutCompletion
    if (timerWindow.__checkoutNativeSetTimeout) window.setTimeout = timerWindow.__checkoutNativeSetTimeout
    if (timerWindow.__checkoutNativeClearTimeout) window.clearTimeout = timerWindow.__checkoutNativeClearTimeout
    delete timerWindow.__checkoutNativeSetTimeout
    delete timerWindow.__checkoutNativeClearTimeout
    delete timerWindow.__checkoutCompletion
    if (!completion || completion.cancelled || typeof completion.handler !== "function") return
    completion.handler(...completion.args)
  })
}

async function expectFocusOwner(page: Page, overlay: Locator, state: string, target: Locator, settle = true) {
  await expect(overlay).toHaveAttribute("data-payment-state", state)
  if (settle) await settleFocusOwner(page)
  await expect.poll(async () => target.evaluate((node) => {
    const box = node.getBoundingClientRect()
    return {
      state: node.closest<HTMLElement>("[data-payment-state]")?.dataset.paymentState,
      focused: document.activeElement === node,
      focusCount: document.querySelectorAll(":focus").length,
      inViewport: box.bottom > 0 && box.top < innerHeight && box.right > 0 && box.left < innerWidth,
    }
  }).catch(() => null)).toEqual({
    state,
    focused: true,
    focusCount: 1,
    inViewport: true,
  })
}

async function activateTwiceBeforeReactCommits(target: Locator) {
  await target.evaluate((node) => {
    const button = node as HTMLButtonElement
    button.click()
    button.click()
  })
}

async function openCheckout(page: Page, query = "") {
  await openCanonicalVenue(page, { query })
  await page.getByTestId("canonical-venue-checkout").click()
  await expect(page.getByTestId("checkout-overlay")).toBeVisible()
}

test.beforeEach(async ({ page }, testInfo) => {
  testInfo.setTimeout(60_000)
  page.setDefaultTimeout(20_000)
})

for (const locale of ["en", "ko"] as const satisfies readonly BLocale[]) {
  test(`Checkout has one settled focus owner through cancel, failure, retry and receipt (${locale})`, async ({ page }) => {
    await prepareBPage(page)
    await seedB(page, { locale, session: READY_SESSION })
    await openCheckout(page, "scenario=payment-declined")
    const checkout = page.getByTestId("checkout-overlay")
    const close = page.getByRole("button", { name: locale === "ko" ? "닫기" : "Close", exact: true })
    const returnToVenue = checkout.getByRole("button", { name: locale === "ko" ? "장소로 돌아가기" : "Return to venue" })

    await holdAnimationFrames(page)
    await page.getByTestId("checkout-start").click()
    await expectFocusOwner(page, checkout, "PAY-CONFIRMING", page.getByTestId("checkout-confirm"), false)
    await page.keyboard.press("Tab")
    await expect(page.getByTestId("checkout-cancel")).toBeFocused()
    await flushHeldAnimationFrames(page)
    await expect(page.getByTestId("checkout-cancel")).toBeFocused()

    await holdAnimationFrames(page)
    await page.keyboard.press("Enter")
    await expectFocusOwner(page, checkout, "PAY-CANCELLED", page.getByTestId("checkout-retry"), false)
    await page.keyboard.press("Shift+Tab")
    await expect(close).toBeFocused()
    await flushHeldAnimationFrames(page)
    await expect(close).toBeFocused()

    await activateTwiceBeforeReactCommits(page.getByTestId("checkout-retry"))
    await expectFocusOwner(page, checkout, "PAY-CONFIRMING", page.getByTestId("checkout-confirm"))

    await holdAnimationFrames(page)
    await holdCheckoutCompletion(page)
    await activateTwiceBeforeReactCommits(page.getByTestId("checkout-confirm"))
    await expectFocusOwner(page, checkout, "PAY-PROCESSING", checkout.getByRole("status"), false)
    await page.keyboard.press("Tab")
    await expect(returnToVenue).toBeFocused()
    await flushHeldAnimationFrames(page)
    await expect(returnToVenue).toBeFocused()
    await releaseCheckoutCompletion(page)
    await expectFocusOwner(page, checkout, "PAY-FAILED", page.getByTestId("checkout-retry"), false)
    await page.keyboard.press("Tab")
    await settleFocusOwner(page)
    await expect(returnToVenue).toBeFocused()

    await activateTwiceBeforeReactCommits(page.getByTestId("checkout-retry"))
    await expectFocusOwner(page, checkout, "PAY-CONFIRMING", page.getByTestId("checkout-confirm"))
    await page.evaluate((venueId) => history.replaceState(null, "", `/ondo-b?venueId=${venueId}`), CANONICAL_VENUE_ID)
    await holdAnimationFrames(page)
    await holdCheckoutCompletion(page)
    await activateTwiceBeforeReactCommits(page.getByTestId("checkout-confirm"))
    await expectFocusOwner(page, checkout, "PAY-PROCESSING", checkout.getByRole("status"), false)
    await releaseCheckoutCompletion(page)

    const receipt = page.getByTestId("checkout-receipt")
    await expectFocusOwner(page, checkout, "PAY-SIMULATED-SUCCESS", receipt, false)
    await expect(receipt).toHaveCount(1)
    await page.keyboard.press("Tab")
    await expect(page.getByTestId("visit-proof-check")).toBeFocused()
    await flushHeldAnimationFrames(page)
    await expect(page.getByTestId("visit-proof-check")).toBeFocused()
    await expect(page.getByTestId("visit-proof-check")).toBeInViewport()
  })
}
