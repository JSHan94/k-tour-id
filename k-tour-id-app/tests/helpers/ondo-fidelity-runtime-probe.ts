import { pathToFileURL } from "node:url"
import { resolve } from "node:path"
import { readFileSync } from "node:fs"

type UnknownModule = Record<string, (...args: never[]) => unknown>

async function load(relativePath: string) {
  return await import(pathToFileURL(resolve(process.cwd(), relativePath)).href) as UnknownModule
}

async function probePulse() {
  const module = await load("features/ondo/pulse-b/pulse-model-b.ts")
  const pulseForVenue = module.pulseForVenue as (venueId: string, localEvidence?: { tags: string[]; postedAt: string }) => unknown
  if (typeof pulseForVenue !== "function") throw new Error("Pulse contract exports pulseForVenue")

  const canonical = JSON.parse(readFileSync(resolve(process.cwd(), "data/ondo-venues/canonical-venues.json"), "utf8")) as { venues: Array<{ id: string }> }
  const curated = new Set(["mois-0021cd596bc5b2a922ad", "mois-0348cfe16225dbbcec8a"])
  const uncuratedVenueId = canonical.venues.map((venue) => venue.id).find((venueId) => !curated.has(venueId))
  if (!uncuratedVenueId) throw new Error("Expected at least one uncurated canonical venue")
  const local = { tags: ["lively_now"], postedAt: "2026-08-19T11:45:00.000Z" }
  return {
    peak: pulseForVenue("mois-0021cd596bc5b2a922ad"),
    hot: pulseForVenue("mois-0348cfe16225dbbcec8a"),
    uncurated: pulseForVenue(uncuratedVenueId),
    afterUniqueLocalPost: pulseForVenue("mois-0021cd596bc5b2a922ad", local),
    afterDuplicateLocalPost: pulseForVenue("mois-0021cd596bc5b2a922ad", local),
  }
}

async function probeMeal() {
  const module = await load("features/ondo/commerce-b/stable-commerce-model-b.ts")
  const create = module.createStableCommerceBState as () => unknown
  const transition = module.stableCommerceBReducer as (state: unknown, action: unknown) => unknown
  const quote = module.stableCommerceQuoteDebitB as (state: unknown) => unknown
  const balance = module.stableCommerceBalanceB as (state: unknown) => unknown
  const settlement = module.stableCommerceSettlementB as (state: unknown) => unknown
  if ([create, transition, quote, balance, settlement].some((value) => typeof value !== "function")) {
    throw new Error("Commerce contract exports createStableCommerceBState, stableCommerceBReducer, and quote/balance/settlement helpers")
  }

  const snapshot = (state: unknown) => ({ state, quoteDebit: quote(state), holderBalance: balance(state), merchantSettlement: settlement(state) })
  const initial = create()
  const benefitSelected = transition(initial, { type: "SET_VOUCHER", selected: true })
  const confirmed = transition(benefitSelected, { type: "CONFIRM" })
  const success = transition(confirmed, { type: "PAYMENT_RETURN", outcome: "success" })
  const successReplay = transition(success, { type: "PAYMENT_RETURN", outcome: "success" })

  const failed = transition(confirmed, { type: "PAYMENT_RETURN", outcome: "failure" })
  const retryConfirmed = transition(failed, { type: "CONFIRM" })
  const retried = transition(retryConfirmed, { type: "PAYMENT_RETURN", outcome: "success" })
  const insufficient = transition(confirmed, { type: "PAYMENT_RETURN", outcome: "insufficient" })
  const refunded = transition(success, { type: "REFUND" })
  const refundReplay = transition(refunded, { type: "REFUND" })

  return {
    initial: snapshot(initial),
    benefitSelected: snapshot(benefitSelected),
    confirmed: snapshot(confirmed),
    success: snapshot(success),
    successReplay: snapshot(successReplay),
    failed: snapshot(failed),
    retried: snapshot(retried),
    insufficient: snapshot(insufficient),
    refunded: snapshot(refunded),
    refundReplay: snapshot(refundReplay),
  }
}

const mode = process.argv[2]
const result = mode === "pulse" ? await probePulse() : mode === "meal" ? await probeMeal() : (() => { throw new Error("Expected pulse or meal") })()
process.stdout.write(`${JSON.stringify(result)}\n`)
