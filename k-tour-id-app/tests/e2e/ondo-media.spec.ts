import { expect, test } from "@playwright/test"
import { MAX_IMAGE_BYTES, uploadFixtureId, validateImageMeta } from "../../features/ondo/media/media-model"

test("E2E-FL-003 and E2E-FL-012 image inputs enforce type and size", () => {
  expect(validateImageMeta({ type: "image/jpeg", size: MAX_IMAGE_BYTES })).toEqual({ ok: true })
  expect(validateImageMeta({ type: "image/gif", size: 10 })).toEqual({ ok: false, reason: "type" })
  expect(validateImageMeta({ type: "image/webp", size: MAX_IMAGE_BYTES + 1 })).toEqual({ ok: false, reason: "size" })
})

test("E2E-FL-003 and E2E-FL-012 upload fixture contexts never collapse", () => {
  expect(uploadFixtureId("chat_image", "success")).toBe("FX-MSG-IMAGE-SUCCESS")
  expect(uploadFixtureId("local_signal", "success")).toBe("FX-UPL-LOCAL-SIGNAL-SUCCESS")
  expect(uploadFixtureId("chat_image", "failed")).not.toBe(uploadFixtureId("local_signal", "failed"))
})
