import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8")
const commerce = read("features/ondo/commerce-b/id-wallet-commerce-b.tsx")
const stablecoin = read("features/ondo/commerce-b/stablecoin-funding-b.tsx")
const gate = read("features/ondo/identity-b/action-gate-coordinator-b.tsx")
const funding = commerce.slice(commerce.indexOf("function FundingSourceSheet"), commerce.indexOf("function CanonicalCommerceOfferB"))

test("TX16-01 place payment language does not invent a meal or a visit", () => {
  for (const label of ['title: "Review payment"', 'title: "결제 금액 확인"', 'title: "支払いを確認"', 'price: "Payment amount"', 'price: "이용 금액"', 'price: "利用金額"']) expect(commerce).toContain(label)
  for (const label of ['checkout: "Place payment"', 'checkout: "매장 결제"', 'checkout: "お店への支払い"']) expect(gate).toContain(label)
  const nextPayment = commerce.split("\n").find(line => line.includes('data-testid="payment-new-order"'))!
  expect(nextPayment).toContain("Start another payment here")
  expect(nextPayment).toContain("{ newOrder: true }")
  expect(nextPayment).not.toContain("visit")
  expect(commerce).toContain("No external order or real money movement")
})

test("TX16-02 funding context uses the same presented payment and is absent from wallet-only entry", () => {
  expect(commerce).toContain("returnVenueName: presented.transactionVenueName")
  expect(commerce).toContain("returnShortageKrw: Math.max(0, Math.round((stableCommerceQuoteDebitB(presented.commerce) - stableCommerceBalanceB(presented.commerce)) * 1_000))")
  expect(funding).toContain('returnVenueName ? <section className={styles.fundingReturnContext}')
  const walletHost = commerce.slice(commerce.indexOf("return presence.value ? <FundingSourceSheet"), commerce.indexOf("export function IdWalletCommerceB"))
  expect(walletHost).toContain("subject={presence.value.context}")
  expect(walletHost).not.toContain("returnVenueName=")
  expect(walletHost).not.toContain("returnShortageKrw=")
})

test("TX16-03 a retained shortage is historical and hidden after credit, with no extra-consent promise", () => {
  expect(funding).toContain("!creditComplete && returnShortageKrw !== undefined && returnShortageKrw > 0")
  for (const text of ["Shortfall before top-up:", "충전 전 부족 금액", "チャージ前の不足額"]) expect(funding).toContain(text)
  expect(funding).toContain("Adding funds is separate from paying the place.")
  expect(funding).not.toContain("Payment is confirmed separately.")
  // The displayed shortfall must not choose a new amount or change the quote.
  const context = funding.slice(funding.indexOf('returnVenueName ? <section'), funding.indexOf('</section> : null}', funding.indexOf('returnVenueName ? <section')))
  for (const mutation of ["editQuote(", "onAction(", "dispatchCommerce(", "setConsent("]) expect(context).not.toContain(mutation)
  expect(funding).toContain("creditKrw: 30_000")
  expect(stablecoin).toContain("FUNDING_CREDIT_AMOUNTS_B.map")
})

test("TX16-04 connection method is ordinary language while exact technology stays in details", () => {
  const technicalIndex = stablecoin.indexOf('data-testid="stablecoin-technical-details"')
  expect(technicalIndex).toBeGreaterThan(0)
  const primary = stablecoin.slice(0, technicalIndex)
  const technical = stablecoin.slice(technicalIndex)
  for (const label of ["Connect with a social account", "소셜 계정으로 연결", "ソーシャルアカウントで接続"]) expect(primary).toContain(label)
  for (const retired of ["Sui zkLogin", "Your signer is not your DID", '"OmniOne route"', '"Interoperability hypothesis"']) expect(primary).not.toContain(retired)
  for (const boundary of ["Sui zkLogin", "DID verification or payment approval", "Sui → OmniOne", "not a supported native bridge", "not redeemable won", "no AMM swap is executed"]) expect(technical).toContain(boundary)
})

test("TX16-05 asset, network, fees, expiry and explicit transfer permission remain visible", () => {
  const primary = stablecoin.slice(0, stablecoin.indexOf('data-testid="stablecoin-technical-details"'))
  for (const retained of ["Sui Testnet", "Included route fee", "stable.feeAtomic", "stable.sourceAmountAtomic", "Quote valid until", 'data-testid="funding-consent"', "stablecoinCanAuthorizeB(operation)", '(phase === "authorize" && !consent)', 'type: "AUTHORIZE", quoteId: quote.quoteId, consent']) expect(primary).toContain(retained)
  const connection = read("features/ondo/commerce-b/wallet-connection-preview-b.tsx")
  expect(connection).toContain("Connect sample wallet only")
  expect(connection).toContain("Connecting does not approve a transfer.")
})

test("TX16-06 copy changes do not automate source/arrival checks or manufacture a credited balance", () => {
  for (const retained of ['data-testid={sourceDone ? "stablecoin-check-destination" : "stablecoin-check-source"}', 'type: destination ? "DESTINATION_STATUS" : "SOURCE_STATUS"', "onClick={() => check(sourceDone)}", "creditComplete ? onUseBalance : onCreditRetry", "Unchanged until arrival is confirmed", "Check the same operation; don’t send again."]) expect(stablecoin).toContain(retained)
  expect(stablecoin).not.toContain("setInterval(")
  expect(stablecoin).not.toContain("useEffect(")
})
