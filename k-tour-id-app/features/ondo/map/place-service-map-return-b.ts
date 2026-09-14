/** The mounted map owns private camera/query/scroll state. Place actions only
 * ask it to capture a return point; no private map state enters an event URL. */
let capture: ((placeId: string) => boolean) | null = null

export function registerPlaceServiceMapCaptureB(next: (placeId: string) => boolean) {
  capture = next
  return () => { if (capture === next) capture = null }
}

export function capturePlaceServiceMapReturnB(placeId: string) {
  return capture?.(placeId) ?? false
}
