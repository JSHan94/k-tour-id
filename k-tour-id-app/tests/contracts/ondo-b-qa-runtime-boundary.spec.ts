import { expect, test } from "@playwright/test"
import { execFileSync } from "node:child_process"

test("QA runtime requires this tab's explicit marker and preserves it through URL canonicalization", () => {
  const script = String.raw`
    const values = new Map()
    const storage = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    }
    const location = { pathname: "/" }
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { sessionStorage: storage, location, __ONDO_B_QA__: { probe: "fixture" } },
    })

    const qa = await import("./features/ondo/shared/ui/use-qa-controls.ts")
    const assert = (condition, message) => { if (!condition) throw new Error(message) }

    assert(qa.readQaRuntime() === undefined, "a QA build/global without tab opt-in must stay closed")
    storage.setItem("ondo.qa.controls.v1", "true")
    assert(qa.readQaRuntime() === undefined, "only the exact allowlisted marker may opt in")

    qa.captureQaControls("?qa=1&scenario=save-failed")
    assert(qa.readQaRuntime()?.probe === "fixture", "explicit query opt-in must expose the fixture")
    assert(qa.readQaScenario() === "save-failed", "the allowlisted scenario must be available")

    qa.captureQaControls("")
    assert(qa.readQaRuntime()?.probe === "fixture", "same-document URL canonicalization must preserve opt-in")

    storage.removeItem("ondo.qa.controls.v1")
    assert(qa.readQaRuntime() === undefined, "removing the tab marker must immediately close the boundary")
  `

  expect(() => execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "--eval", script], {
    cwd: process.cwd(),
    env: { ...process.env, NEXT_PUBLIC_ONDO_QA_CONTROLS: "1" },
    stdio: "pipe",
  })).not.toThrow()
})

test("public review opt-in enables the honest walkthrough without opening QA injection", () => {
  const script = String.raw`
    const values = new Map()
    const storage = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    }
    const location = { pathname: "/" }
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { sessionStorage: storage, location, __ONDO_B_QA__: { probe: "must-stay-hidden" } },
    })

    const controls = await import("./features/ondo/shared/ui/use-qa-controls.ts")
    const assert = (condition, message) => { if (!condition) throw new Error(message) }

    controls.captureQaControls("?review=1&scenario=save-failed")
    assert(controls.hasQaSessionOptIn(), "explicit review URL must open the review walkthrough")
    assert(controls.qaReviewFixtureOptions().allowReviewFixture, "review authority must be session-scoped")
    assert(controls.readQaRuntime() === undefined, "public review must not expose injected runtime controls")
    assert(controls.readQaScenario() === null, "public review must not accept failure scenarios")

    controls.captureQaControls("")
    assert(controls.hasQaSessionOptIn(), "same-document canonicalization must preserve review authority")
  `

  expect(() => execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "--eval", script], {
    cwd: process.cwd(),
    env: { ...process.env, NEXT_PUBLIC_ONDO_QA_CONTROLS: "0" },
    stdio: "pipe",
  })).not.toThrow()
})
