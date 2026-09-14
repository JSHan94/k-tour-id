import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")
const commerce = source("features/ondo/commerce-b/id-wallet-commerce-b.tsx")
const css = source("features/ondo/commerce-b/id-wallet-commerce-b.module.css")

test("WALLET-FUNDING-P1-001 the portal follows the visual viewport and remains internally scrollable", () => {
  expect(commerce).toContain("useModalVisualViewport(layerRef)")
  expect(commerce).toContain("ref={layerRef}")
  expect(css).toContain("top: var(--ondo-sheet-viewport-top, 0px)")
  expect(css).toContain("height: var(--ondo-sheet-viewport-height, 100dvh)")
  expect(css).toContain("max-height: min(94dvh, var(--ondo-sheet-viewport-height, 94dvh))")
  expect(css).toMatch(/\.fundingSheetBody\s*\{[\s\S]*?overflow-y:\s*auto/)
})

test("WALLET-FUNDING-P1-002 closing consumes input without disabling the focused control", () => {
  const funding = commerce.slice(commerce.indexOf("function FundingSourceSheet"), commerce.indexOf("function CanonicalCommerceOfferB"))

  expect(funding).toContain("event.nativeEvent.stopImmediatePropagation()")
  expect(funding).toContain('aria-disabled={closing ? "true" : undefined}')
  expect(funding).not.toContain("disabled={closing}")
  expect(funding).toContain("if (closing) return")
  expect(funding).toContain("if (!closing) { setDraftSource(id); setSaveError(false) }")
})

test("WALLET-FUNDING-P1-003 removal restores the latest exact opener or its context-specific fallback", () => {
  expect(commerce).toContain("type FundingFocusReturn")
  expect(commerce).toContain("exact: trigger")
  expect(commerce).toContain("[data-testid='commerce-funding-source'] button")
  expect(commerce).toContain("[data-testid='wallet-funding-change']")
  expect(commerce).toContain("if (presence.value !== null)")
  expect(commerce).toContain("focusReturn?.exact.isConnected && isRenderedFocusable(focusReturn.exact)")
  expect(commerce).toContain("focusFirstAvailableDestination(focusReturn.fallbackSelectors)")
})

test("WALLET-FUNDING-P1-004 reopen and subject changes reset focus without replaying the entrance", () => {
  expect(commerce).toContain('if (presenceState !== "open") return')
  expect(commerce).toContain("[locale, presenceState, source, subject, walletReady, operation?.phase]")
  expect(commerce).toContain("if (closing) setHasEntered(true)")
  expect(commerce).toContain('data-funding-entered={hasEntered ? "true" : "false"}')
  expect(css).toContain('.fundingBackdrop[data-funding-entered="true"][data-funding-presence="open"]')
})

test("WALLET-FUNDING-P1-005 durable success closes after mutation while refusal and retained exit stay exact", () => {
  const choose = commerce.slice(commerce.indexOf("function commitFundingChoice()"), commerce.indexOf("return createPortal", commerce.indexOf("function commitFundingChoice()")))
  expect(choose.indexOf("onSelect(draftSource)")).toBeLessThan(choose.indexOf("onClose()"))
  expect(choose).toContain("if (onSelect(draftSource)) onClose()")
  expect(commerce).toContain("const presence = useSheetPresence(desiredSubject)")
  expect(commerce).toContain("locale={presence.value.locale}")
  expect(commerce).toContain("subject={presence.value.context}")
  expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*fundingBackdrop\[data-funding-presence="closing"\][\s\S]*animation: none/)
})

test("WALLET-FUNDING-P0-006 standalone funding is owned by the stable product overlay, not replaceable tab content", () => {
  const product = source("features/ondo/app/ondo-product-b.tsx")
  const wallet = commerce.slice(commerce.indexOf("export function IdWalletCommerceB"))
  const mount = commerce.slice(commerce.indexOf("export function WalletFundingMountB"), commerce.indexOf("export function IdWalletCommerceB"))

  expect(product).toContain("<WalletFundingMountB />")
  expect(mount).toContain("COMMERCE_WALLET_FUNDING_OPEN_EVENT")
  expect(mount).toContain('const desiredSubject = state.tab === "id" ? request?.subject ?? null : null')
  expect(mount).toContain("useSheetPresence(desiredSubject)")
  expect(wallet).toContain("openWalletFundingSheet(event.currentTarget")
  expect(wallet).not.toContain("<FundingSourceSheet")
  expect(wallet).not.toContain("useSheetPresence(")
})

test("WALLET-FUNDING-P0-007 owner loss, retained isolation, and rapid reopen are explicit", () => {
  const mount = commerce.slice(commerce.indexOf("export function WalletFundingMountB"), commerce.indexOf("export function IdWalletCommerceB"))

  expect(mount).toContain("new MutationObserver(closeWhenOwnerLeaves)")
  expect(mount).toContain("request.trigger.isConnected || requestRef.current?.serial !== request.serial")
  expect(mount).toContain('if (state.tab === "id" || requestRef.current === null) return')
  expect(mount).toContain("requestRef.current = null")
  expect(mount).toContain('const presentedPhase = desiredSubject && presence.phase === "open" ? "open" : "closing"')
  expect(mount).toContain("restorationSerial !== restorationSerialRef.current || requestRef.current")
  expect(mount).toContain("closeRequestedRef.current")
})
