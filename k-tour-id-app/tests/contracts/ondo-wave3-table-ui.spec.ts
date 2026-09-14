import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8")
const table = read("features/ondo/connect/tables-entry-b.tsx")
const css = read("features/ondo/connect/pulse-table-b.module.css")

test("FL003 list is photo-led and detail preserves all six decision facts", () => {
  expect(table).toContain('data-testid="table-card-image"')
  expect(css).toContain(".cardActive > .cardMedia { display: block")
  expect(table).toContain("className={styles.detailMedia}")
  for (const kind of ["time", "seats", "format", "menu", "language", "cost"]) expect(table).toContain(`data-fact-kind={kind}`)
  expect(table).toContain('kind: "time"')
  expect(table).toContain('kind: "seats"')
  expect(table).toContain('kind: "format"')
  expect(table.match(/teaser: true/g)).toHaveLength(3)
})

test("FL003 exposes one booking consequence and one detail navigation action", () => {
  for (const copy of [
    "Local meal plan only · no seat or venue booking is sent.",
    "로컬 식사 계획 · 좌석이나 장소 예약은 전송되지 않아요.",
    "端末内の食事プランです。席や店舗の予約は送信されません。",
  ]) expect(table).toContain(copy)
  expect(table).toContain("className={styles.bookingTruth}")
  expect(table).toMatch(/className=\{styles\.bookingTruth\}[\s\S]*?data-testid="table-join"/)
  expect(table).toContain('className={styles.backdrop} tabIndex={-1} aria-hidden="true"')
  expect(table).not.toContain('<button type="button" onClick={closeTable} aria-label={t.close}><X')
})

test("FL003 keeps member-only chat, media lifecycle, recovery and terminal evidence", () => {
  expect(table).toContain('joinStage === "joined"')
  expect(table).toContain('joinStage === "chat"')
  for (const marker of ["removeChatImage", "retryMessage", "table-message-status", "table-check-in", "table-feedback-submit", "table-report", "table-block", "table-leave"]) expect(table).toContain(marker)
  expect(table).toContain("finalizeConsumedBActionWithMutation")
  for (const axis of ["data-table-availability", "data-table-membership", "data-table-failure", "data-chat-access"]) expect(table).toContain(axis)
  expect(table).toContain('runtimeRef.current.chatAccess !== "CHA-OPEN"')
  expect(table).toContain('data-testid="table-chat-locked"')
  expect(table).toContain('data-testid="table-join-recovery"')
  expect(table).toContain('data-testid="table-message-image-fallback"')
})

test("FL003 mobile and landscape layouts remain reachable", () => {
  expect(css).toContain("@media (max-width:360px)")
  expect(css).toContain("orientation:landscape")
  expect(css).toContain("max-height:500px")
  expect(css).toContain("forced-colors:active")
  expect(css).toContain("env(safe-area-inset-bottom)")
  expect(table).toContain("window.visualViewport")
  expect(css).toContain("--table-viewport-height")
  expect(css).toContain("--table-keyboard-inset")
  expect(css).toContain("@media (max-width: 280px)")
})
