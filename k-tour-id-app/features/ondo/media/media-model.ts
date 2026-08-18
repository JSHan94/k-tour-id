import type { UploadStatus } from "../contracts/domain"

export type UploadPurpose = "local_signal" | "chat_image"

export type LocalPhoto = {
  id: string
  file: File
  previewUrl: string
  purpose: UploadPurpose
  state: UploadStatus
}

export type ImageValidationResult = { ok: true } | { ok: false; reason: "type" | "size" }

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024

export function validateImageMeta(input: { type: string; size: number }): ImageValidationResult {
  if (!ALLOWED_TYPES.has(input.type)) return { ok: false, reason: "type" }
  if (input.size > MAX_IMAGE_BYTES) return { ok: false, reason: "size" }
  return { ok: true }
}

export function uploadFixtureId(purpose: UploadPurpose, result: "pending" | "success" | "failed") {
  if (purpose === "local_signal") {
    return result === "pending" ? "FX-UPL-PHOTO-PREVIEW" : result === "success" ? "FX-UPL-LOCAL-SIGNAL-SUCCESS" : "FX-UPL-LOCAL-SIGNAL-FAIL"
  }
  return result === "pending" ? "FX-MSG-IMAGE-PENDING" : result === "success" ? "FX-MSG-IMAGE-SUCCESS" : "FX-MSG-IMAGE-FAIL"
}
