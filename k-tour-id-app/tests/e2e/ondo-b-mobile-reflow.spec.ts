import { test } from "@playwright/test"
import {
  CURRENT_REFERENCE_VISUAL_CASES,
  expectCurrentReferenceVisualGuards,
  prepareCurrentReferenceVisualPage,
  setupCurrentReferenceVisualCase,
  stabilizeCurrentReferenceVisual,
  type CurrentReferenceState,
} from "../helpers/ondo-b-current-reference-visual"

const MOBILE_REFLOW_STATES = [
  "nation-atlas",
  "seoul-map",
  "seoul-list",
  "place-detail",
  "onboarding-value",
  "onboarding-preferences",
  "opendid-consent",
  "opendid-document",
  "opendid-credential-ready",
  "table-detail",
  "table-joined",
  "my-korea-active",
  "id-wallet",
  "settings-ja",
  "labs-ready-ja",
] as const satisfies readonly CurrentReferenceState[]

const PREFERRED_CASE_ID_BY_STATE: Partial<Record<CurrentReferenceState, string>> = {
  "nation-atlas": "CR-PX-033-NATION-ATLAS-MOBILE-JA",
  "seoul-map": "CR-PX-014-SEOUL-MAP-PULSE",
  "seoul-list": "CR-PX-032-SEOUL-LIST-PULSE-JA",
  "place-detail": "CR-PX-034-PLACE-DETAIL-MOBILE-JA",
  "onboarding-value": "CR-PX-004-ONBOARDING-VALUE-KO",
  "onboarding-preferences": "CR-PX-009-ONBOARDING-PREFERENCES-JA",
  "opendid-consent": "CR-PX-022-OPENDID-CONSENT-JA",
  "opendid-document": "CR-PX-023-OPENDID-DOCUMENT-EN",
  "opendid-credential-ready": "CR-PX-011-OPENDID-CREDENTIAL-READY",
  "table-detail": "CR-PX-017-TABLE-DETAIL",
  "table-joined": "CR-PX-028-TABLE-JOINED-KO",
  "my-korea-active": "CR-PX-019-MY-KOREA-ACTIVE",
  "id-wallet": "CR-PX-020-ID-WALLET",
  "settings-ja": "CR-PX-021-SETTINGS-JA",
  "labs-ready-ja": "CR-PX-031-LABS-READY-JA",
}

test.describe("ONDO B 390×844 product-wide mobile reflow gate", () => {
  test.describe.configure({ mode: "default", timeout: 90_000 })

  for (const state of MOBILE_REFLOW_STATES) {
    const id = PREFERRED_CASE_ID_BY_STATE[state]
    const source = CURRENT_REFERENCE_VISUAL_CASES.find((item) => item.id === id)
    if (!source) throw new Error(`missing current-reference source case for ${state}`)
    const item = { ...source, viewport: { width: 390, height: 844 } } as const

    test(`${state} keeps its complete B-native surface usable at 390×844`, async ({ page }) => {
      await page.setViewportSize(item.viewport)
      await page.emulateMedia({ reducedMotion: "reduce" })
      await prepareCurrentReferenceVisualPage(page, item)
      await setupCurrentReferenceVisualCase(page, item)
      await stabilizeCurrentReferenceVisual(page)
      await expectCurrentReferenceVisualGuards(page, item)
    })
  }
})
