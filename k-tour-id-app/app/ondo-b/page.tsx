import type { Metadata } from "next"
import { OndoProductB } from "@/features/ondo/app/ondo-product-b"

export const metadata: Metadata = {
  title: "ONDO B — A quieter map of what locals eat",
  description: "Baljajwi-inspired ONDO food discovery experiment for Seoul and Busan.",
  robots: { index: false, follow: false },
}

export default function OndoBPage() {
  return <OndoProductB />
}
