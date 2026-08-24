"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { LangProvider } from "@/lib/i18n/lang-provider"
import { LocationProvider } from "@/lib/location/location-provider"
import { AppProvider } from "@/lib/store/app-provider"

export function AppProviders({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isProductionDirectory = pathname === "/ondo-b" || pathname.startsWith("/ondo-b/")

  if (isProductionDirectory) return children

  return (
    <LangProvider>
      <LocationProvider>
        <AppProvider>{children}</AppProvider>
      </LocationProvider>
    </LangProvider>
  )
}
