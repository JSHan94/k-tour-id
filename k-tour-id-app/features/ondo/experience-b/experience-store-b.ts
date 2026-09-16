import { createExperienceB, EXPERIENCE_KEY_B, reduceExperienceB, restoreExperienceB, type ExperienceCommandB, type ExperienceContextB, type ExperienceRecordB } from "./experience-model-b"

const DB_NAME = "ktour-experience-mock-v1"
const STORE = "experiences"
// Keep the existing database/store. The v2 save campaign has its own key;
// old v1 opening records are neither read as saves nor deleted or rewritten.
/** A single readwrite IndexedDB transaction serializes same-origin tabs.
 * No localStorage check-then-write fallback: denied storage is unavailable. */
function database(createIfMissing = true): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") { reject(new Error("storage_unavailable")); return }
    const request = indexedDB.open(DB_NAME, 1)
    let missing = false
    request.onupgradeneeded = () => {
      if (!createIfMissing) { missing = true; request.transaction?.abort(); return }
      request.result.createObjectStore(STORE, { keyPath: "key" })
    }
    request.onerror = () => reject(new Error(missing ? "history_not_created" : "storage_unavailable"))
    request.onblocked = () => reject(new Error("storage_blocked"))
    request.onsuccess = () => resolve(request.result)
  })
}
export async function readExperienceB(existingOnly = false): Promise<ExperienceRecordB | null> {
  const db = await database(!existingOnly).catch(error => {
    if (existingOnly && error instanceof Error && error.message === "history_not_created") return null
    throw error
  })
  if (!db) return null
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly")
    const get = tx.objectStore(STORE).get(EXPERIENCE_KEY_B)
    let value: ExperienceRecordB | null = null
    get.onsuccess = () => { value = restoreExperienceB(get.result); if (get.result !== undefined && !value) tx.abort() }
    tx.oncomplete = () => { db.close(); resolve(value) }
    tx.onerror = tx.onabort = () => { db.close(); reject(new Error("invalid_or_unavailable_history")) }
  })
}
export async function openExperienceB(now = Date.now()): Promise<ExperienceRecordB> {
  const db = await database()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite")
    const store = tx.objectStore(STORE)
    const get = store.get(EXPERIENCE_KEY_B)
    let value: ExperienceRecordB
    get.onsuccess = () => {
      const restored = restoreExperienceB(get.result)
      if (get.result !== undefined && !restored) { tx.abort(); return }
      value = restored ?? createExperienceB(`EXP-${crypto.randomUUID()}`, now)
      if (!restored) store.add(value)
    }
    tx.oncomplete = () => { db.close(); resolve(value) }
    tx.onerror = tx.onabort = () => { db.close(); reject(new Error("storage_unavailable")) }
  })
}
export async function commitExperienceB(expected: ExperienceRecordB, command: ExperienceCommandB, currentContext: () => ExperienceContextB): Promise<{ record: ExperienceRecordB; changed: boolean }> {
  const db = await database()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite")
    const store = tx.objectStore(STORE)
    const get = store.get(EXPERIENCE_KEY_B)
    let value: ExperienceRecordB; let changed = false
    get.onsuccess = () => {
      const latest = restoreExperienceB(get.result)
      if (!latest) { tx.abort(); return }
      value = latest
      if (latest.intentId !== expected.intentId || latest.revision !== expected.revision) return
      // Re-read the current eligibility closure INSIDE the transaction's turn.
      try {
        const context = currentContext()
        const next = reduceExperienceB(latest, command, { ...context, now: Math.max(Date.now(), context.now) })
        if (next !== latest) { value = next; changed = true; store.put(next) }
      } catch { tx.abort() }
    }
    tx.oncomplete = () => { db.close(); resolve({ record: value, changed }) }
    tx.onerror = tx.onabort = () => { db.close(); reject(new Error("storage_unavailable")) }
  })
}
