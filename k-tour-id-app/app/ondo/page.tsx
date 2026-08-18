import type { Metadata } from "next"
import { OndoProduct } from "@/features/ondo/app/ondo-product"

export const metadata: Metadata = {
  title: "ONDO — Where locals eat now",
  description: "A food-first heat map of Korea, powered by fresh local signals.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "ONDO — Where locals eat now",
    description: "See which Korean neighborhoods are heating up, then find a meal you can actually enjoy.",
    images: [{ url: "/og-ondo.png", width: 1200, height: 630, alt: "ONDO food heat map of Korea" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ONDO — Where locals eat now",
    description: "Fresh local food signals across Korea.",
    images: ["/og-ondo.png"],
  },
}

export default function OndoPage() {
  return <OndoProduct />
}
