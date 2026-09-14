import type { TemperatureSampleCity, TemperatureSampleDirection, TemperatureSampleFrame } from "../contracts/temperature-timeline"

/** Ephemeral rendering channel only. No account, credential, eligibility,
 * score or storage writes. The map and its peek read one painted frame. */
export type SampleTemperaturePresentationB = Readonly<{
  city: TemperatureSampleCity
  minute: number
  direction: TemperatureSampleDirection
  running: boolean
  after19: boolean
  frame: TemperatureSampleFrame
}>

let owner: symbol | null = null
let snapshot: SampleTemperaturePresentationB | null = null
const listeners = new Set<() => void>()
export function readSampleTemperaturePresentationB() { return snapshot }
export function readServerSampleTemperaturePresentationB() { return null }
export function subscribeSampleTemperaturePresentationB(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
export function publishSampleTemperaturePresentationB(nextOwner: symbol, next: SampleTemperaturePresentationB) {
  owner = nextOwner
  snapshot = next
  for (const listener of listeners) listener()
}
export function clearSampleTemperaturePresentationB(previousOwner: symbol) {
  // An old city's cleanup must never clear a newly mounted city's frame.
  if (owner !== previousOwner) return
  owner = null
  snapshot = null
  for (const listener of listeners) listener()
}
