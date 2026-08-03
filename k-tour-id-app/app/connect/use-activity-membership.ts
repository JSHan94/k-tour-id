"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { Activity } from "@/lib/types"

const STORAGE_PREFIX = "k-tour-id:activity-memberships:v1"
const MEMBERSHIP_EVENT = "k-tour-id:activity-memberships-changed"

type StoredMemberships = {
  joinedActivityIds: string[]
}

export type JoinActivityResult =
  | { ok: true; alreadyJoined: boolean }
  | { ok: false; reason: "not-ready" | "full" | "storage" }

function readMemberships(storageKey: string): string[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? "null") as StoredMemberships | null
    if (!parsed || !Array.isArray(parsed.joinedActivityIds)) return []
    return [...new Set(parsed.joinedActivityIds.filter((id): id is string => typeof id === "string" && id.length > 0))]
  } catch {
    return []
  }
}

function writeMemberships(storageKey: string, joinedActivityIds: string[]) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify({ joinedActivityIds } satisfies StoredMemberships))
    window.dispatchEvent(new CustomEvent(MEMBERSHIP_EVENT, { detail: { storageKey, joinedActivityIds } }))
    return true
  } catch {
    return false
  }
}

export function useActivityMembership(ownerId?: string) {
  const storageKey = useMemo(
    () => ownerId ? `${STORAGE_PREFIX}:${encodeURIComponent(ownerId)}` : null,
    [ownerId],
  )
  const [joinedActivityIds, setJoinedActivityIds] = useState<string[]>([])
  const [ready, setReady] = useState(false)
  const joinedRef = useRef<string[]>([])

  const apply = useCallback((next: string[]) => {
    joinedRef.current = next
    setJoinedActivityIds(next)
  }, [])

  useEffect(() => {
    setReady(false)
    if (!storageKey) {
      apply([])
      setReady(true)
      return
    }

    apply(readMemberships(storageKey))
    setReady(true)

    const sync = (event: Event) => {
      if (event instanceof StorageEvent) {
        if (event.key === storageKey) apply(readMemberships(storageKey))
        return
      }
      const detail = (event as CustomEvent<{ storageKey?: string; joinedActivityIds?: unknown }>).detail
      if (detail?.storageKey !== storageKey || !Array.isArray(detail.joinedActivityIds)) return
      apply(detail.joinedActivityIds.filter((id): id is string => typeof id === "string"))
    }

    window.addEventListener("storage", sync)
    window.addEventListener(MEMBERSHIP_EVENT, sync)
    return () => {
      window.removeEventListener("storage", sync)
      window.removeEventListener(MEMBERSHIP_EVENT, sync)
    }
  }, [apply, storageKey])

  const isJoined = useCallback((activityId: string) => joinedRef.current.includes(activityId), [])

  const joinActivity = useCallback((activity: Activity): JoinActivityResult => {
    if (!ready || !storageKey) return { ok: false, reason: "not-ready" }
    if (joinedRef.current.includes(activity.id)) return { ok: true, alreadyJoined: true }
    if (activity.joined >= activity.capacity) return { ok: false, reason: "full" }

    const next = [...joinedRef.current, activity.id]
    if (!writeMemberships(storageKey, next)) return { ok: false, reason: "storage" }
    apply(next)
    return { ok: true, alreadyJoined: false }
  }, [apply, ready, storageKey])

  const leaveActivity = useCallback((activityId: string) => {
    if (!ready || !storageKey || !joinedRef.current.includes(activityId)) return false
    const next = joinedRef.current.filter((id) => id !== activityId)
    if (!writeMemberships(storageKey, next)) return false
    apply(next)
    return true
  }, [apply, ready, storageKey])

  return { joinedActivityIds, ready, isJoined, joinActivity, leaveActivity }
}
