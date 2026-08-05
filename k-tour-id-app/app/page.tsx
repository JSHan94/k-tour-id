"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { FirstRunGuide } from "@/components/app/first-run-guide"
import { PhoneFrame } from "@/components/app/shell"
import { TravelAtlasMap } from "@/components/app/travel-atlas-map"
import { useApp } from "@/lib/store/app-provider"

/**
 * Variant B: a map-first Korea travel atlas.
 * Variant A remains untouched on `main`; this page only exists on the experiment branch.
 */
export default function HomePage() {
  const router = useRouter()
  const { session, hydrated } = useApp()

  useEffect(() => {
    if (hydrated && !session.onboarded) router.replace("/onboarding")
  }, [hydrated, router, session.onboarded])

  if (!hydrated || !session.onboarded || !session.userType) return null

  return (
    <PhoneFrame fullBleed>
      <FirstRunGuide />
      <TravelAtlasMap />
    </PhoneFrame>
  )
}
