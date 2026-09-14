/**
 * Small, synchronous helpers shared by return-to contracts.
 *
 * The hash is an observability/CAS fingerprint, not an authentication primitive.
 * A return envelope is still validated against its allowlist and entity registry
 * before a product mutation is allowed.
 */

export type CanonicalSnapshotScalar = string | number | boolean | null
export type CanonicalSnapshotValue =
  | CanonicalSnapshotScalar
  | readonly CanonicalSnapshotValue[]
  | { readonly [key: string]: CanonicalSnapshotValue }

export type ReturnToSnapshotHash = `RT-HASH-${string}`

const RETURN_TO_CTA = /^[A-Z][A-Z0-9_]{0,63}$/
const FNV_64_OFFSET = 0xcbf29ce484222325n
const FNV_64_PRIME = 0x100000001b3n
const FNV_64_MASK = 0xffffffffffffffffn

function timestamp(value: Date | string | number) {
  const milliseconds = value instanceof Date
    ? value.getTime()
    : typeof value === "number"
      ? value
      : Date.parse(value)
  if (!Number.isSafeInteger(milliseconds)) throw new Error("Invalid return timestamp")
  return milliseconds
}

export function createDeterministicReturnToToken<Cta extends string>(
  cta: Cta,
  createdAt: Date | string | number,
): `RT-${Cta}-${number}` {
  if (!RETURN_TO_CTA.test(cta)) throw new Error("Invalid return CTA")
  return `RT-${cta}-${timestamp(createdAt)}`
}

export function hasExactOwnKeys(
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[] = [],
) {
  const keys = Reflect.ownKeys(value)
  if (keys.some((key) => typeof key !== "string")) return false
  const allowed = new Set([...required, ...optional])
  return required.every((key) => Object.prototype.hasOwnProperty.call(value, key))
    && keys.every((key) => allowed.has(key as string))
}

function canonicalize(value: CanonicalSnapshotValue, seen: Set<object>): string {
  if (value === null) return "null"
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value)
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Snapshot numbers must be finite")
    return Object.is(value, -0) ? "0" : JSON.stringify(value)
  }
  if (seen.has(value)) throw new Error("Snapshot must not contain cycles")
  seen.add(value)
  try {
    if (Array.isArray(value)) return `[${value.map((item) => canonicalize(item, seen)).join(",")}]`
    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) throw new Error("Snapshot must contain plain objects")
    const record = value as { readonly [key: string]: CanonicalSnapshotValue }
    const keys = Object.keys(record).sort()
    if (Reflect.ownKeys(record).length !== keys.length) throw new Error("Snapshot keys must be strings")
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalize(record[key], seen)}`).join(",")}}`
  } finally {
    seen.delete(value)
  }
}

export function serializeReturnToSnapshot(snapshot: CanonicalSnapshotValue) {
  return canonicalize(snapshot, new Set())
}

/** Stable FNV-1a/64 fingerprint for exact-return comparison and telemetry. */
export function hashReturnToSnapshot(snapshot: CanonicalSnapshotValue): ReturnToSnapshotHash {
  const bytes = new TextEncoder().encode(serializeReturnToSnapshot(snapshot))
  let hash = FNV_64_OFFSET
  for (const byte of bytes) {
    hash ^= BigInt(byte)
    hash = (hash * FNV_64_PRIME) & FNV_64_MASK
  }
  return `RT-HASH-${hash.toString(16).padStart(16, "0")}`
}
