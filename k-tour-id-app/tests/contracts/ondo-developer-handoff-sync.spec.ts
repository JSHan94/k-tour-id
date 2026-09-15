import { existsSync, readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { expect, test } from "@playwright/test"

const root = resolve(process.cwd(), "..")
const doc = (name: string) => readFileSync(resolve(root, "docs", name), "utf8")
const guide = doc("DEVELOPER_START_HERE.md")
const spec = doc("DEPLOYMENT_SPEC.md")
const work = doc("BACKEND_HANDOFF_CHECKLIST_2026-09-09.md")
const matrix = doc("HACKATHON_INTEGRATION_MATRIX_2026-09-08.md")
const groups = ["G01", "G02", "G03", "G04", "G05", "G06", "G07", "G08", "G08-R", "G09", "G09-S", "G10", "G11", "G12", "G13"]

// These guards check documentation traceability, not provider implementation
// or browser coverage. Runtime evidence is deliberately recorded separately.
test("HANDOFF-SYNC-008 concise handoff keeps the flow, all four integrations, resources and delivery scope", () => {
  const brief = doc("HARVEY_HACKATHON_HANDOFF_2026-09-14.md")
  const detailed = doc("HACKATHON_ONE_WEEK_SPEC_2026-09-14.md")
  expect(brief).toContain("OmniOne CX + OpenDID + OmniOne Chain + Sui")
  for (const requirement of ["Move", "zkLogin", "PTB", "Agentic AI", "DeepSurge", "provenance"]) {
    expect(brief, requirement).toContain(requirement)
  }
  expect(brief).toContain("HACKATHON_SUI_REQUIRED_ADDENDUM_2026-09-14.md")
  expect(brief).toContain("2026-09-21(월) 18:00 KST")
  expect(brief).toContain("https://github.com/woogieboogie-jl/k-tour-id")
  expect(brief).toContain("handoff/harvey-20260914")
  expect(brief).not.toContain("최신 인계 브랜치는 별도 공유 예정")
  expect(brief).toContain("대표 사용자 플로우")
  expect(brief).toContain("구현할 작업")
  expect(brief).toContain("참고 리소스")
  expect(brief).toContain("1주 개발 명세")
  expect(brief).toContain("외부 앱 복귀")
  expect(brief).toContain("취소·잘못된 증명·만료·철회")
  expect(brief).toContain("아래 해커톤 여정은 현재 목업이며, 네 기술 연동은 개발 대상")
  expect(brief).toContain("SUMSUB_SANDBOX_HANDOFF_2026-09-14.md")
  expect(brief).toContain("실제 WebSDK/API 테스트이며 운영 신원 확인이나 실제 얼굴/liveness 완료 증거가 아닙니다")
  expect(brief).toContain("위 네 기술의 필수 개발을 대신하지 않습니다")
  expect(brief).toContain("https://github.com/OmniOneID/did-release")
  expect(brief.length).toBeLessThan(6000)
  expect(detailed).toContain("이번 팀의 필수 구현 범위")
  expect(detailed).not.toContain("M0-only 제출로 축소할지 결정")
  expect(detailed).toContain("HARVEY_HACKATHON_HANDOFF_2026-09-14.md")
})

test("HANDOFF-SYNC-009 required Sui scope includes real execution, distinct service finality and bounty evidence", () => {
  const sui = doc("HACKATHON_SUI_REQUIRED_ADDENDUM_2026-09-14.md")
  const detailed = doc("HACKATHON_ONE_WEEK_SPEC_2026-09-14.md")
  for (const term of ["zkLogin + PTB", "Agentic AI", "Move package", "DeepSurge", "provenance", "fulfillment_blocked", "durable intent", "A13", "A20"]) {
    expect(sui, term).toContain(term)
  }
  expect(sui).toContain("Sui 권한 행사 성공은 혜택 사용 완료가 아니다")
  expect(sui).toContain("코드 완료와 접수/수상/격려금 지급은 별도 판정")
  expect(detailed).not.toContain("이번 인계에서는 Sui를 구현 범위에서 제외한다")
  expect(detailed).not.toContain("Sui: 이번 범위 제외")
  expect(detailed).toContain("M2: 팀 필수 Sui 바운티 범위")
  expect(detailed).toContain("A01–A20")
})

test("HANDOFF-SYNC-001 every current flow group has an assigned work package and detailed contract", () => {
  const rows = guide.split("\n").filter(row => /^\| G\d{2}(?:-[RS])? /.test(row))
  expect(rows.map(row => row.split("|")[1].trim().split(" ")[0])).toEqual(groups)
  for (const row of rows) {
    const group = row.split("|")[1].trim().split(" ")[0]
    expect(row, group).toMatch(/BE-\d{2}/)
    expect(spec, group).toContain(group)
  }
  for (let i = 1; i <= 16; i++) {
    const id = "BE-" + String(i).padStart(2, "0")
    expect(guide, id).toContain(id)
    expect(work, id).toContain("| " + id + " |")
  }
})

test("HANDOFF-SYNC-002 every concrete B source touchpoint in the start guide exists", () => {
  const paths = [...guide.matchAll(/`B\/([^\`]+\.(?:tsx?|css))`/g)].map(match => match[1])
  expect(paths.length).toBeGreaterThanOrEqual(14)
  for (const path of paths) expect(existsSync(resolve(process.cwd(), "features/ondo", path)), path).toBe(true)
})

test("HANDOFF-SYNC-003 current handoff and README local document links resolve", () => {
  for (const file of ["README.md", "docs/DEVELOPER_START_HERE.md", "docs/DEPLOYMENT_SPEC.md", "docs/BACKEND_HANDOFF_CHECKLIST_2026-09-09.md", "docs/HACKATHON_INTEGRATION_MATRIX_2026-09-08.md", "docs/HACKATHON_ONE_WEEK_SPEC_2026-09-14.md", "docs/HARVEY_HACKATHON_HANDOFF_2026-09-14.md", "docs/HACKATHON_SUI_REQUIRED_ADDENDUM_2026-09-14.md", "docs/MAP_FIRST_ENTRY_2026-09-14.md", "docs/PLACE_AFTER19_FIX_2026-09-14.md"]) {
    const text = readFileSync(resolve(root, file), "utf8")
    const links = [...text.matchAll(/\]\(([^)]+)\)/g)].map(match => match[1])
    for (const link of links.filter(link => !/^(?:https?:|#)/.test(link))) {
      const target = link.split("#")[0]
      expect(existsSync(resolve(dirname(resolve(root, file)), target)), file + " -> " + link).toBe(true)
    }
  }
})

test("HANDOFF-SYNC-004 proposed recovery APIs cover pending operations, history and asynchronous jobs", () => {
  for (const api of [
    "GET /operations/{id}", "POST /identity/sessions/{id}/additional-evidence",
    "POST /credentials/{id}/recovery-sessions", "POST /payments/{id}/capture",
    "GET /partner/disputes?settlementId&cursor", "GET /partner/settlement-exports/{id}",
    "GET /me/data-exports/{id}", "GET /me/account-deletions/{id}", "GET /badges/claims/{id}",
  ]) expect(spec, api).toContain(api)
  expect(guide).toContain("아래 개발 작업의 API는 앱/BFF 구현 제안")
  expect(guide).toContain("위 장소/Sandbox API와 구분한다")
  for (const route of ["/api/kyc/sumsub/session", "/api/kyc/sumsub/status"]) {
    expect(guide, route).toContain(route)
    expect(spec, route).toContain(route)
    expect(existsSync(resolve(process.cwd(), "app", route.slice(1), "route.ts")), route).toBe(true)
  }
  expect(guide).toContain("`POST`/`DELETE /api/kyc/sumsub/session`, `GET /api/kyc/sumsub/status`가 구현되어 있다")
  expect(guide).toContain("generic Demo 검증만으로")
  expect(spec).toContain("SettlementSupportB")
  expect(spec).not.toContain("IntegrationSettlementSupportB")
})

test("HANDOFF-SYNC-005 all provider work retains separate responsibility and official/project distinctions", () => {
  for (const name of ["OmniOne CX", "OpenDID", "OmniOne Chain", "Sui"]) {
    expect(guide, name).toContain(name)
    expect(matrix, name).toContain(name)
  }
  for (const id of ["ADR-AUTH-01", "ADR-DID-01", "ADR-AGE-01", "ADR-RESIDENCE-01", "ADR-PAYMENT-01", "ADR-CHAIN-01", "ADR-SUI-01", "ADR-DATA-01"]) {
    expect(spec, id).toContain("| " + id + " |")
  }
  const readme = readFileSync(resolve(root, "README.md"), "utf8")
  expect(readme).toContain("./docs/DEVELOPER_START_HERE.md")
  expect(readme).not.toContain("| `/partner/verify` |")
  expect(guide).toContain("실제 연동·테스트 자금 이동·운영 credential 발급을 목업 완료의 조건으로 요구하지 않는다")
})

test("HANDOFF-SYNC-006 current Sandbox Preview stays distinct from the historical production release and flow QA", () => {
  const releaseName = "BRAND_SHARE_REFRESH_2026-09-14.md"
  const release = doc(releaseName)
  const source = release.match(/배포 source `([a-f0-9]{7})`/)?.[1]
  expect(source).toBeDefined()
  const readme = readFileSync(resolve(root, "README.md"), "utf8")
  const detailed = doc("HACKATHON_ONE_WEEK_SPEC_2026-09-14.md")
  const previewRecord = readFileSync(resolve(process.cwd(), "docs/branding/KTOUR_BRAND_UNIFICATION_2026-09-15.md"), "utf8")
  const previewSource = previewRecord.match(/App source: `([a-f0-9]{7})`/)?.[1]
  const previewUrl = previewRecord.match(/Verified Ready \*\*Preview\*\*: (https:\/\/[^\s]+)/)?.[1]
  expect(previewSource).toBeDefined()
  expect(previewUrl).toBeDefined()
  expect(previewSource).not.toBe(source)
  for (const text of [readme, guide, spec, work, matrix, detailed, doc("HARVEY_HACKATHON_HANDOFF_2026-09-14.md")]) {
    expect(text).toContain(previewUrl!)
    expect(text).toContain("feat/sumsub-sandbox-onboarding-20260914")
    expect(text).toContain("SUMSUB_SANDBOX_HANDOFF_2026-09-14.md")
  }
  expect(readme).toContain("branded Preview source `" + previewSource + "`")
  const guideCurrent = guide.split("\n").filter(line => line.startsWith("현재 앱:"))
  expect(guideCurrent).toHaveLength(1)
  expect(guideCurrent[0]).toContain(previewSource!)
  for (const text of [readme, guide, spec, work, matrix]) expect(text).toContain(releaseName)
  const guideBases = guide.split("\n").filter(line => line.startsWith("기존 운영·인계 기준은"))
  expect(guideBases).toHaveLength(1)
  expect(guideBases[0]).toContain(source!)
  expect(guideBases[0]).toContain("당시 배포·검수 기록이며 현재 Preview와 구분")
  expect(readme).toContain("./docs/HACKATHON_ONE_WEEK_SPEC_2026-09-14.md")
  expect(guide).toContain("./HACKATHON_ONE_WEEK_SPEC_2026-09-14.md")
  expect(detailed).toContain("runtime `" + source + "`는 이전 운영 배포 참고값")
  // These legacy marker names remain part of the original handoff record, not the new Preview's QA.
  for (const text of [spec, work, matrix]) {
    expect(text).toContain("원 운영·인계 기준선이며 현재 Preview의 검수 결과가 아니다")
  }
  const historicalRelease = spec.split("\n").find(line => line.includes("`release:current`"))
  expect(historicalRelease).toContain(source!)
  expect(work).toContain("`baseline:current:" + source + "`")
  const readmeRelease = readme.split("\n").find(line => line.includes("[original production app]"))
  expect(readmeRelease?.match(/(?:deployment )?source(?:\/runtime)? `([a-f0-9]{7})`/i)?.[1]).toBe(source)
  expect(readmeRelease).toContain("separate from the current Preview")
  expect(release).toContain("실제 provider 연결")
  expect(release).toContain("실제 iPhone Safari/Android")
  expect(readme).toContain("last functional-flow QA baseline is historical `e2ad7c4`")
  expect(guide).toContain("마지막 기능 흐름 검수 기준은 이전 `e2ad7c4`")
  expect(release).toContain("계약833/833")
  expect(release).toContain("이번 소스에서 재실행한 결과가 아님")
})

test("HANDOFF-SYNC-007 map-wallet journeys have matching place, order and reservation backend contracts", () => {
  const record = "MAP_WALLET_JOURNEYS_2026-09-12.md"
  for (const text of [guide, spec, work, matrix]) expect(text).toContain(record)
  const journeys = doc(record)
  for (const id of ["MW-01", "MW-02", "MW-03", "MW-04", "MW-05"]) expect(journeys).toContain("| " + id + " |")
  for (const api of ["GET /places/{id}/services", "GET /places?capability=wallet&cityId&cursor", "GET /orders?cursor", "GET /orders/{id}", "GET /reservations?venueId&cursor"]) expect(spec).toContain(api)
  for (const boundary of ["PREPARE_QUOTE", "sampleOnly: true", "PLACE_SERVICE_RETURN_EVENT_B", "SHOW_BALANCE_PLACES_EVENT_B", "CommerceOrderContextB"]) expect(spec).toContain(boundary)
})
