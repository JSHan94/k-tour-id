"use client"

import { useState } from "react"
import { ChevronRight, Loader2, LocateFixed, MapPinOff } from "lucide-react"
import { useLang } from "@/lib/i18n/lang-provider"
import { useNearbyLocation } from "@/lib/location/location-provider"
import { cn } from "@/lib/utils"

export function LocationControl({ compact = false }: { compact?: boolean }) {
  const { lang } = useLang()
  const { location, status, requestLocation, clearLocation } = useNearbyLocation()
  const [manageOpen, setManageOpen] = useState(false)
  const ko = lang === "ko"
  const granted = status === "granted" && location
  const requesting = status === "requesting"
  const blocked = status === "denied" || status === "unavailable"

  const title = granted
    ? (ko ? (location.areaKo === "현재 위치" ? "내 위치 기준" : `내 위치 · ${location.areaKo} 근처`) : (location.areaEn === "your current location" ? "Using your current location" : `Near ${location.areaEn}`))
    : blocked
      ? (ko ? "위치 없이 둘러보는 중" : "Browsing without location")
      : (ko ? "내 위치로 주변 찾기" : "Find what’s nearby")
  const detail = granted
    ? (ko ? "거리와 이동시간이 가까운 순으로 보여요" : "Sorted by distance and travel time")
    : blocked
      ? (ko ? "서울 중심 추천 · 눌러서 다시 설정" : "Central Seoul picks · tap to retry")
      : (ko ? "허용하면 가까운 혜택부터 보여드려요" : "Enable location to rank nearby benefits")

  return (
    <div>
      <button
        type="button"
        onClick={() => granted ? setManageOpen((value) => !value) : void requestLocation()}
        disabled={requesting}
        aria-expanded={granted ? manageOpen : undefined}
        className={cn(
          "pressable flex w-full items-center gap-3 rounded-[16px] border text-left",
          compact ? "min-h-[58px] border-foreground/10 bg-card px-3.5" : "min-h-[72px] border-success/15 bg-success-surface/55 px-4",
        )}
      >
        <span className={cn("grid flex-shrink-0 place-items-center rounded-full", compact ? "h-9 w-9 bg-secondary" : "h-11 w-11 bg-card", granted ? "text-success" : "text-primary")}>
          {requesting ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : blocked ? <MapPinOff className="h-[18px] w-[18px]" /> : <LocateFixed className="h-[18px] w-[18px]" />}
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block text-[13px] font-semibold">{requesting ? (ko ? "현재 위치를 확인하고 있어요" : "Finding your location") : title}</strong>
          <span className="mt-1 block text-[12px] leading-5 text-muted-foreground">{detail}</span>
        </span>
        <ChevronRight className={cn("h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform", manageOpen && "rotate-90")} />
      </button>
      {granted && manageOpen && (
        <div className="mt-2 flex items-center justify-end gap-4 px-2 text-[12px] font-medium">
          <button type="button" onClick={() => void requestLocation()} className="pressable min-h-10 text-primary underline decoration-primary/30 underline-offset-4">{ko ? "위치 새로고침" : "Refresh location"}</button>
          <button type="button" onClick={() => { clearLocation(); setManageOpen(false) }} className="pressable min-h-10 text-muted-foreground underline decoration-foreground/20 underline-offset-4">{ko ? "위치 사용 끄기" : "Turn location off"}</button>
        </div>
      )}
    </div>
  )
}
