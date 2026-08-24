import type { Metadata } from "next"
import { OndoProductB } from "@/features/ondo/app/ondo-product-b"

export const metadata: Metadata = {
  title: "ONDO — Licensed food-place discovery in Seoul and Busan",
  description: "Discover licensed food-place records for Seoul and Busan with clear source and preview labels.",
  openGraph: {
    title: "ONDO — Licensed food-place discovery in Seoul and Busan",
    description: "Discover licensed food-place records for Seoul and Busan with clear source and preview labels.",
    images: [{
      url: "/og-ondo-baljajwi-v1.png",
      width: 1731,
      height: 909,
      alt: "A dotted map of Korea with restrained ONDO food signals in Seoul and Busan",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ONDO — Licensed food-place discovery in Seoul and Busan",
    description: "Discover licensed food-place records for Seoul and Busan with clear source and preview labels.",
    images: ["/og-ondo-baljajwi-v1.png"],
  },
  robots: { index: false, follow: false },
}

export default function OndoBPage() {
  return <OndoProductB />
}
