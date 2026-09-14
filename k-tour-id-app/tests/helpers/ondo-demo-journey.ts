import { expect, type Page } from "@playwright/test"

export type IdentityDemoMethod = "mobile_id" | "residence_card" | "passport_ekyc"
export type PartnerHandoff = "phone" | "deeplink"

/** Open the compact K-Pass service disclosure before using an action inside it. */
export async function openKPassServices(page: Page) {
  const disclosure = page.getByTestId("kpass-service-disclosure")
  if ((await disclosure.getAttribute("open")) === null) await page.getByTestId("kpass-service-toggle").click()
}

export async function clickKPassService(page: Page, service: string) {
  await openKPassServices(page)
  await page.getByTestId(`kpass-service-${service}`).click()
}

/** Open the readiness disclosure before using an identity readiness action. */
export async function openTravelPassReadiness(page: Page) {
  const readiness = page.getByTestId("travel-pass-status")
  if ((await readiness.getAttribute("open")) === null) await page.getByTestId("travel-pass-readiness-toggle").click()
}

export async function clickTravelPassAction(page: Page, action: string) {
  await openTravelPassReadiness(page)
  await page.getByTestId(action).click()
}

/**
 * Advance only the currently rendered identity-demo control. Every transition
 * is explicit and bounded; this helper never changes the sample scenario or
 * bypasses an unavailable/failed state.
 */
export async function advanceIdentityJourney(page: Page, method: IdentityDemoMethod, maxSteps = 16) {
  const setup = page.getByTestId("k-tour-id-setup")
  const routeTestId: Record<IdentityDemoMethod, string> = {
    mobile_id: "ktour-id-route-mobile-id",
    residence_card: "ktour-id-route-residence-card",
    passport_ekyc: "ktour-id-route-passport",
  }

  for (let step = 0; step < maxSteps; step += 1) {
    const phase = await setup.getAttribute("data-phase")
    if (phase === "credential_ready") return
    if (phase === "method_select") {
      await page.getByTestId(routeTestId[method]).click()
      continue
    }
    if (phase === "consent") {
      await page.getByTestId("k-tour-id-consent-approve").click()
      continue
    }
    if (phase === "cx_handoff_preview") {
      const handoff = page.getByTestId("k-tour-id-route-step")
      const state = await handoff.getAttribute("data-handoff-state")
      if (state === "ready") await handoff.getByTestId("k-tour-id-continue").click()
      else if (state === "waiting") await handoff.getByTestId("identity-handoff-approve").click()
      else if (state === "approved") await handoff.getByTestId("k-tour-id-continue").click()
      else throw new Error(`Unexpected identity handoff state: ${state ?? "missing"}`)
      continue
    }
    if (phase === "document_preview") {
      const document = page.getByTestId("k-tour-id-passport-document")
      const stage = await document.getAttribute("data-ocr-stage")
      if (stage === "sample") await page.getByTestId("passport-ocr-start").click()
      else if (stage === "permission") await page.getByTestId("passport-demo-permission-allow").click()
      else if (stage === "capture") await page.getByTestId("passport-demo-capture").click()
      else if (stage === "checking") await page.getByTestId("passport-demo-nfc-read").click()
      else if (stage === "review") await document.getByTestId("k-tour-id-continue").click()
      else throw new Error(`Unexpected passport OCR stage: ${stage ?? "missing"}`)
      continue
    }
    if (phase === "face_liveness_preview") {
      const face = page.getByTestId("k-tour-id-passport-face")
      const stage = await face.getAttribute("data-face-stage")
      if (stage === "permission" || stage === "capture" || stage === "review") await face.getByTestId("k-tour-id-continue").click()
      else throw new Error(`Unexpected passport face stage: ${stage ?? "missing"}`)
      continue
    }
    if (phase === "provider_processing_preview") {
      await expect(setup).toHaveAttribute("data-phase", "holder_delivery_preview")
      continue
    }
    if (phase === "holder_delivery_preview") {
      await page.getByTestId("k-tour-id-holder-delivery").getByTestId("k-tour-id-continue").click()
      continue
    }
    throw new Error(`Unexpected identity journey phase: ${phase ?? "missing"}`)
  }

  throw new Error(`Identity journey exceeded its ${maxSteps}-step bound`)
}

/** Complete the one-time partner sample counter setup when it is present. */
export async function preparePartnerDevice(page: Page) {
  const setup = page.getByTestId("partner-device-setup")
  if (await setup.count() === 0) return
  await expect(setup).toBeVisible()
  const signIn = page.getByTestId("partner-sample-sign-in")
  if (await signIn.isVisible()) await signIn.click()
  const consent = page.getByTestId("partner-device-consent")
  if (!(await consent.isChecked())) await consent.check()
  await page.getByTestId("partner-device-ready").click()
  await expect(setup).toHaveCount(0)
}

export async function runPartnerCheck(page: Page, consent = true, handoff: PartnerHandoff = "phone") {
  await page.getByTestId("integration-verifier-create").click()
  await expect(page.getByTestId("integration-holder-request")).toHaveAttribute("data-phase", "request")
  if (handoff === "deeplink") {
    await page.getByTestId("partner-demo-deeplink").click()
  } else {
    await page.getByTestId("integration-holder-open").click()
    await expect(page.getByTestId("partner-request-handoff")).toHaveAttribute("data-view", "permission")
    await page.getByTestId("partner-camera-allow").click()
    await expect(page.getByTestId("partner-request-handoff")).toHaveAttribute("data-view", "scan")
    await page.getByTestId("partner-qr-scan").click()
  }
  await expect(page.getByTestId("integration-holder-request")).toHaveAttribute("data-phase", "consent")
  await page.getByTestId(consent ? "integration-holder-approve" : "integration-holder-deny").click()
}
