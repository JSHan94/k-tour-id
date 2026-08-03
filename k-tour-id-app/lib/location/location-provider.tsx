"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { MarketplaceItem } from "@/lib/types"

const STORAGE_KEY = "k-tour-id-location-v1"

export type LocationStatus = "idle" | "requesting" | "granted" | "denied" | "unavailable"

export interface NearbyLocation {
  latitude: number
  longitude: number
  areaKo: string
  areaEn: string
  updatedAt: string
}

interface LocationContextValue {
  location: NearbyLocation | null
  status: LocationStatus
  requestLocation: () => Promise<boolean>
  clearLocation: () => void
}

const LocationContext = createContext<LocationContextValue | null>(null)

const AREA_REFERENCES = [
  { latitude: 37.5826, longitude: 126.983, areaKo: "북촌", areaEn: "Bukchon" },
  { latitude: 37.574, longitude: 126.985, areaKo: "인사동", areaEn: "Insadong" },
  { latitude: 37.566, longitude: 126.991, areaKo: "을지로", areaEn: "Euljiro" },
  { latitude: 37.569, longitude: 126.929, areaKo: "연희동", areaEn: "Yeonhui-dong" },
  { latitude: 37.557, longitude: 126.924, areaKo: "홍대", areaEn: "Hongdae" },
  { latitude: 37.498, longitude: 127.028, areaKo: "강남", areaEn: "Gangnam" },
  { latitude: 37.285, longitude: 127.014, areaKo: "수원 행궁동", areaEn: "Haenggung-dong, Suwon" },
  { latitude: 35.18, longitude: 129.075, areaKo: "부산", areaEn: "Busan" },
  { latitude: 33.5, longitude: 126.531, areaKo: "제주", areaEn: "Jeju" },
] as const

function toRadians(value: number) {
  return value * Math.PI / 180
}

export function distanceKm(
  from: Pick<NearbyLocation, "latitude" | "longitude">,
  to: { latitude: number; longitude: number },
) {
  const earthRadiusKm = 6371
  const latDelta = toRadians(to.latitude - from.latitude)
  const lngDelta = toRadians(to.longitude - from.longitude)
  const fromLat = toRadians(from.latitude)
  const toLat = toRadians(to.latitude)
  const a = Math.sin(latDelta / 2) ** 2 + Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lngDelta / 2) ** 2
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function nearestArea(latitude: number, longitude: number) {
  const point = { latitude, longitude }
  const nearest = AREA_REFERENCES.reduce((current, candidate) =>
    distanceKm(point, candidate) < distanceKm(point, current) ? candidate : current,
  )
  return distanceKm(point, nearest) > 180
    ? { latitude, longitude, areaKo: "현재 위치", areaEn: "your current location" }
    : nearest
}

export function itemDistance(item: MarketplaceItem, location: NearbyLocation | null) {
  if (!location || !item.geo) return null
  return distanceKm(location, item.geo)
}

export function sortItemsByDistance(items: MarketplaceItem[], location: NearbyLocation | null) {
  if (!location) return items
  return [...items].sort((a, b) => {
    const aDistance = itemDistance(a, location) ?? Number.POSITIVE_INFINITY
    const bDistance = itemDistance(b, location) ?? Number.POSITIVE_INFINITY
    return aDistance - bDistance
  })
}

export function proximityLabel(item: MarketplaceItem, location: NearbyLocation | null, lang: "ko" | "en") {
  return item.geo ? pointProximityLabel(item.geo, location, lang) : undefined
}

export function pointProximityLabel(point: { latitude: number; longitude: number }, location: NearbyLocation | null, lang: "ko" | "en") {
  const km = location ? distanceKm(location, point) : null
  if (km == null) return undefined
  const distance = km < 1 ? `${Math.max(100, Math.round(km * 10) * 100)}m` : `${km < 10 ? km.toFixed(1) : Math.round(km)}km`
  if (km > 300) return lang === "ko" ? `${distance} · 현재 여행지에서 멀어요` : `${distance} · far from your trip area`
  if (km <= 1.5) {
    const minutes = Math.max(3, Math.round((km / 4.5) * 60 / 2) * 2)
    return lang === "ko" ? `${distance} · 도보 약 ${minutes}분` : `${distance} · about ${minutes} min walk`
  }
  const minutes = Math.max(12, Math.round((km / 24) * 60 / 5) * 5 + 5)
  return lang === "ko" ? `${distance} · 이동 약 ${minutes}분` : `${distance} · about ${minutes} min away`
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<NearbyLocation | null>(null)
  const [status, setStatus] = useState<LocationStatus>("idle")

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const saved = JSON.parse(raw) as NearbyLocation
      if (Number.isFinite(saved.latitude) && Number.isFinite(saved.longitude)) {
        setLocation(saved)
        setStatus("granted")
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const requestLocation = useCallback(async () => {
    if (!("geolocation" in navigator)) {
      setStatus("unavailable")
      return false
    }
    setStatus("requesting")
    return new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = Number(position.coords.latitude.toFixed(3))
          const longitude = Number(position.coords.longitude.toFixed(3))
          const area = nearestArea(latitude, longitude)
          const next: NearbyLocation = {
            latitude,
            longitude,
            areaKo: area.areaKo,
            areaEn: area.areaEn,
            updatedAt: new Date().toISOString(),
          }
          setLocation(next)
          setStatus("granted")
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* unavailable */ }
          resolve(true)
        },
        (error) => {
          setStatus(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable")
          resolve(false)
        },
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: 10 * 60 * 1000 },
      )
    })
  }, [])

  const clearLocation = useCallback(() => {
    setLocation(null)
    setStatus("idle")
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* unavailable */ }
  }, [])

  const value = useMemo(() => ({ location, status, requestLocation, clearLocation }), [clearLocation, location, requestLocation, status])
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export function useNearbyLocation() {
  const context = useContext(LocationContext)
  if (!context) throw new Error("useNearbyLocation must be used within LocationProvider")
  return context
}
