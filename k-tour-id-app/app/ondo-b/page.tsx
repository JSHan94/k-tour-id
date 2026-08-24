import type { Metadata } from "next"
import { headers } from "next/headers"
import { OndoProductB } from "@/features/ondo/app/ondo-product-b"

const title = "ONDO — Licensed food-place records in Seoul and Busan"
const description = "Browse 400 licensed food-service records from the Ministry of the Interior and Safety LOCALDATA snapshot, with source dates and clear coverage limits."

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers()
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host")
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https")
  const imageUrl = host ? `${protocol}://${host}/og-ondo-directory.png` : "/og-ondo-directory.png"

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: "ONDO licensed food-place directory for Seoul and Busan with 400 public records",
      }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    robots: { index: false, follow: false },
  }
}

export default function OndoBPage() {
  return <OndoProductB />
}
