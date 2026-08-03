// Pure context engine for the Seal Copilot. Given the current route (+ live
// numbers), returns the right commands, chat chips, and at most one nudge.
// Anti-paperclip: silent by default; one dot; whisper only for the leftover case.

import { STAY } from "@/lib/mock-data"
import type { UserType } from "@/lib/types"

export type CmdKind = "pay" | "topup" | "convert" | "markRead" | "navigate" | "explain"

export interface CopilotCommand {
  id: string
  kind: CmdKind
  /** literal label (merchant/offer) — takes precedence over labelKey */
  label?: string
  labelKey?: string
  icon: string
  /** KRW amount; the component formats the value pill from this */
  amountKRW?: number
  reason?: string
  merchant?: string
  category?: string
  href?: string
  /** explain: a canned assistant answer (i18n key) + the question to echo */
  sayKey?: string
  askKey?: string
}

export interface CopilotNudge {
  id: string
  kind: "dot" | "whisper"
  textKey?: string
}

export interface CopilotContext {
  commands: CopilotCommand[]
  chips: string[]
  nudge: CopilotNudge | null
}

export const LEFTOVER_KRW = 180_000
export const D_DAY = STAY.total - STAY.day

const convertCommand = (balanceKRW: number): CopilotCommand => ({ id: "convert", kind: "convert", labelKey: "seal.cmd.convert", icon: "ticket", amountKRW: Math.min(LEFTOVER_KRW, Math.max(0, balanceKRW)), reason: `D-${D_DAY} · unused funds stay yours` })
const TOPUP: CopilotCommand = { id: "topup", kind: "topup", labelKey: "seal.cmd.topup", icon: "topup", amountKRW: 100_000 }

function routeKey(pathname: string): "home" | "wallet" | "pass" | "alerts" | "profile" | "connect" | "ai" | "other" {
  if (pathname === "/") return "home"
  if (pathname.startsWith("/wallet")) return "wallet"
  if (pathname.startsWith("/pass")) return "pass"
  if (pathname.startsWith("/connect")) return "connect"
  if (pathname.startsWith("/alerts")) return "alerts"
  if (pathname.startsWith("/profile")) return "profile"
  if (pathname.startsWith("/ai")) return "ai"
  return "other"
}

export function pickContext(pathname: string, dismissed: string[], persona: { userType: UserType | null; balanceKRW: number }): CopilotContext {
  const r = routeKey(pathname)
  const notDismissed = (id: string) => !dismissed.includes(id)
  const canConvert = persona.userType === "foreigner" && persona.balanceKRW > 0
  const convert = convertCommand(persona.balanceKRW)

  switch (r) {
    case "wallet":
      return {
        commands: [
          TOPUP,
          { id: "pay-gs25", kind: "pay", label: "GS25 Convenience", icon: "card", amountKRW: 4_500, merchant: "GS25 Convenience", category: "shopping" },
          ...(canConvert ? [convert] : []),
        ],
        chips: ["seal.chip.budget", "ai.s3"],
        nudge: notDismissed("leftover") ? { id: "leftover", kind: "dot" } : null,
      }
    case "pass":
      return {
        commands: [
          { id: "explain-pass", kind: "explain", labelKey: "seal.cmd.explainPass", icon: "shield", sayKey: "seal.say.pass", askKey: "seal.ask.pass" },
          { id: "reissue", kind: "navigate", labelKey: "seal.cmd.reissue", icon: "stamp", href: "/onboarding" },
        ],
        chips: ["seal.chip.verify", "ai.s2"],
        nudge: null,
      }
    case "alerts":
      return {
        commands: [
          { id: "markread", kind: "markRead", labelKey: "seal.cmd.markRead", icon: "check" },
          ...(canConvert ? [convert] : []),
        ],
        chips: ["seal.chip.tidy"],
        nudge: notDismissed("alerts") ? { id: "alerts", kind: "dot" } : null,
      }
    case "connect":
      return {
        commands: [
          { id: "find-activity", kind: "navigate", labelKey: "connect.cmd.find", icon: "sparkles", href: "/connect" },
        ],
        chips: ["connect.chip.find", "seal.chip.help"],
        nudge: null,
      }
    case "profile":
      return {
        commands: [
          { id: "explain-cap", kind: "explain", labelKey: "seal.cmd.whatCanIDo", icon: "sparkles", sayKey: "seal.say.help", askKey: "seal.ask.help" },
          { id: "reonboard", kind: "navigate", labelKey: "seal.cmd.reonboard", icon: "stamp", href: "/onboarding" },
        ],
        chips: ["seal.chip.help"],
        nudge: null,
      }
    case "home":
    default:
      if (persona.userType === "korean") return {
        commands: [
          { id: "regional-pick", kind: "navigate", label: "지역 문화 혜택", icon: "ticket", href: "/explore/regional-craft-day", reason: "모바일 ID로 확인 가능한 국내 여행 혜택" },
          TOPUP,
        ],
        chips: ["ai.s1", "seal.chip.help"],
        nudge: null,
      }
      if (persona.userType === "long-term") return {
        commands: [
          { id: "resident-transit", kind: "navigate", label: "서울 생활 교통 30일권", icon: "transit", href: "/explore/seoul-transit-30", reason: "장기 체류 K-Tour ID로 이용 가능" },
          TOPUP,
        ],
        chips: ["ai.s2", "seal.chip.budget"],
        nudge: null,
      }
      return {
        commands: [
          { id: "pay-food", kind: "pay", label: "Korean Fried Chicken", icon: "delivery", amountKRW: 65_000, merchant: "Korean Fried Chicken", category: "delivery", reason: "Baemin 10%" },
          ...(canConvert ? [convert] : []),
          TOPUP,
        ],
        chips: ["ai.s1", "ai.s2", "ai.s3"],
        // the one allowed auto-peek: leftover before departure (home only)
        nudge: r === "home" && notDismissed("leftover") ? { id: "leftover", kind: "whisper", textKey: "seal.whisper.leftover" } : null,
      }
  }
}
