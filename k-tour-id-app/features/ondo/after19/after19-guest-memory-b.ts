import {
  DEFAULT_GLOBAL_AFTER19_SESSION,
  sanitizeGlobalAfter19Session,
  type GlobalAfter19SessionB,
} from "./after19-global-b-model"

type RestoreOptions = { allowReviewFixture?: boolean }

// Guest eligibility belongs to this JavaScript document only: it survives
// dock-driven unmount/remounts, but a real reload creates a fresh module and
// returns to locked. No browser storage, raw identity input or provider
// response is involved.
let guestSession: GlobalAfter19SessionB = { ...DEFAULT_GLOBAL_AFTER19_SESSION }

export function readGuestAfter19MemoryB(now = new Date(), options: RestoreOptions = {}) {
  guestSession = sanitizeGlobalAfter19Session(guestSession, now, options)
  return guestSession
}

export function writeGuestAfter19MemoryB(value: unknown, now = new Date(), options: RestoreOptions = {}) {
  guestSession = sanitizeGlobalAfter19Session(value, now, options)
  return guestSession
}

export function clearGuestAfter19MemoryB() {
  guestSession = { ...DEFAULT_GLOBAL_AFTER19_SESSION }
}
