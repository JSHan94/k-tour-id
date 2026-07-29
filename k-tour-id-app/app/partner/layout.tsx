import type React from "react"
import { PartnerShell } from "@/components/partner/partner-shell"

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return <PartnerShell>{children}</PartnerShell>
}
