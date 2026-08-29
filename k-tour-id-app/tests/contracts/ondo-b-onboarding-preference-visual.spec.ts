import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

test("B-PREFERENCE-VIS-001 onboarding choices keep state semantics with neutral and black visual states", () => {
  const component = source("features/ondo/onboarding/official-directory-onboarding.tsx")
  const styles = source("features/ondo/onboarding/official-directory-onboarding.module.css")

  expect(component).toContain("aria-pressed={selected}")
  expect(component).toContain("preferences.includes(preference.id)")
  expect(component).toContain("current.filter((id) => id !== preference.id)")
  expect(styles).toMatch(/\.chipSelected\s*\{[^}]*background: #171717;/s)
  expect(styles).toMatch(/\.chip,\s*\.chipSelected\s*\{[^}]*min-height: 48px;/s)
  expect(styles).toContain(".chip:focus-visible")
  expect(styles).toContain("outline: 3px solid #171717")
})

test("B-SETTINGS-VIS-002 device persistence stays in details without an eyebrow above Settings", () => {
  const settings = source("features/ondo/settings/settings-entry-b.tsx")

  expect(settings).not.toContain("eyebrow:")
  expect(settings).not.toContain("copy.eyebrow")
  for (const truth of ["Stored on this device", "이 기기에만 저장", "この端末にのみ保存"]) {
    expect(settings).toContain(truth)
  }
})
