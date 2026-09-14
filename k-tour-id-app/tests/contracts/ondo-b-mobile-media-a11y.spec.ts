import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const root = process.cwd()
const source = (path: string) => readFileSync(resolve(root, path), "utf8")

test("Table message photos keep meaningful localized alternatives", () => {
  const table = source("features/ondo/connect/tables-entry-b.tsx")

  expect(table).toContain('messagePhotoAlt: "Photo in your Table message"')
  expect(table).toContain('messagePhotoAlt: "내 테이블 메시지에 담긴 사진"')
  expect(table).toContain('messagePhotoAlt: "自分のTableメッセージに添付した写真"')
  expect(table).toContain('alt={t.messagePhotoAlt}')
  expect(table).toContain('alt={t.selectedPhotoAlt}')
  expect(table).not.toMatch(/message\.imageUrl\s*\?\s*<img[^>]+alt=""/)
  expect(table).not.toMatch(/className=\{styles\.chatImage\}><img[^>]+alt=""/)
})

test("Passport privacy disclosure remains a full mobile touch target", () => {
  const styles = source("features/ondo/identity-b/passport-ocr-step-b.module.css")

  expect(styles).toMatch(/\.details summary\s*\{[^}]*min-height:\s*44px/s)
})

test("Saved receipt disclosure remains a full mobile touch target", () => {
  const styles = source("features/ondo/shared/ui/production-local.module.css")

  expect(styles).toMatch(/\.receiptDetails\s*>\s*summary\s*\{[^}]*min-height:\s*44px/s)
})
