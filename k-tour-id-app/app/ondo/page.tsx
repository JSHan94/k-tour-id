import type { Metadata } from "next"
import { OndoProduct } from "@/features/ondo/app/ondo-product"

export const metadata: Metadata = {
  title: "ONDO A — archived control",
  description: "The preserved ONDO control experience.",
  alternates: { canonical: "/ondo-a" },
  robots: { index: false, follow: false },
}

export default function LegacyOndoPage() {
  return <OndoProduct />
}
