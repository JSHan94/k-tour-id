import type { Metadata } from "next"
import { OndoProduct } from "@/features/ondo/app/ondo-product"
import { OndoProductB } from "@/features/ondo/app/ondo-product-b"

export const metadata: Metadata = {
  title: "ONDO — Where locals eat now",
  description: "A food-first heat map of Korea, powered by fresh local signals.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "ONDO — Where locals eat now",
    description: "See which Korean neighborhoods are heating up, then find a meal you can actually enjoy.",
    images: [{ url: "/og-ondo-v2.png", width: 1731, height: 909, alt: "ONDO food heat signals across a modern Korean map" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ONDO — Where locals eat now",
    description: "Fresh local food signals across Korea.",
    images: ["/og-ondo-v2.png"],
  },
}

export default function OndoPage() {
  return process.env.NEXT_PUBLIC_ONDO_QA_VARIANT === "B" ? <OndoProductB /> : <OndoProduct />
}
