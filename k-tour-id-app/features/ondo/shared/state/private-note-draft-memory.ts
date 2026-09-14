export type PrivateNoteDraftMemory = Readonly<{
  value: string
  editing: boolean
}>

// Unsaved private-note text survives an in-app tab change, but deliberately
// never enters persistent browser storage or any public activity model. A
// reload or explicit device-content clear drops this process-local memory.
const privateNoteDrafts = new Map<string, PrivateNoteDraftMemory>()

export function readPrivateNoteDraftMemory(venueId: string) {
  return privateNoteDrafts.get(venueId) ?? null
}

export function writePrivateNoteDraftMemory(venueId: string, draft: PrivateNoteDraftMemory) {
  privateNoteDrafts.set(venueId, draft)
}

export function clearPrivateNoteDraftMemory(venueId: string) {
  privateNoteDrafts.delete(venueId)
}

export function clearAllPrivateNoteDraftMemory() {
  privateNoteDrafts.clear()
}
