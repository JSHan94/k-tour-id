"use client"

// /ai is retired — the assistant is now the always-on Seal Copilot (a layer,
// not a page). This route opens the copilot and bounces home, so old links work.
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/lib/store/app-provider"

export default function AiRedirect() {
  const router = useRouter()
  const { openCopilot } = useApp()
  useEffect(() => {
    openCopilot()
    router.replace("/")
  }, [openCopilot, router])
  return null
}
