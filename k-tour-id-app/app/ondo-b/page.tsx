import type { Metadata } from "next"
import { OndoProductB } from "@/features/ondo/app/ondo-product-b"

export const metadata: Metadata = {
  title: "ONDO B — A quieter map of what locals eat",
  description: "Baljajwi-inspired ONDO food discovery experiment for Seoul and Busan.",
  openGraph: {
    title: "ONDO — Where locals eat now",
    description: "A quiet food-signal map built around 200 official place records in Seoul and 200 in Busan.",
    images: [{
      url: "/og-ondo-baljajwi-v1.png",
      width: 1731,
      height: 909,
      alt: "A dotted map of Korea with restrained ONDO food signals in Seoul and Busan",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ONDO — Where locals eat now",
    description: "A quiet food-signal map for Seoul and Busan.",
    images: ["/og-ondo-baljajwi-v1.png"],
  },
  robots: { index: false, follow: false },
}

export default function OndoBPage() {
  return <OndoProductB />
}
