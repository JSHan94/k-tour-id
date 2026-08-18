import type { After19Mode, AgeStatus } from "./domain"

export type After19GuardInput = {
  ageStatus: AgeStatus
  ageExpiresAt?: string
  koreanLocalTime: string
  autoNight: boolean
  mode: After19Mode
}

export function canAutoEnterAfter19(input: After19GuardInput): boolean {
  const now = new Date(input.koreanLocalTime)
  const hour = Number(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(now).find((part) => part.type === "hour")?.value)
  const proofIsCurrent = input.ageExpiresAt != null && new Date(input.ageExpiresAt).getTime() > now.getTime()
  return input.ageStatus === "AGE-VERIFIED"
    && proofIsCurrent
    && hour >= 19
    && input.autoNight
    && input.mode !== "A19-MANUAL-OFF"
}
