import type { Metadata } from "next"
import { headers } from "next/headers"
import { OndoProductB } from "@/features/ondo/app/ondo-product-b"

const title = "ONDO 溫圖 — Korea Pulse map for Seoul, Busan, and Jeju"
const description = "Browse 400 licensed Seoul and Busan food-service records alongside a source-linked Jeju editorial collection; pending places remain separate from official records."

function configuredOrigin() {
  const configured = process.env.NEXT_PUBLIC_ONDO_B_ORIGIN
  if (!configured) return null
  try {
    const url = new URL(configured)
    return url.protocol === "https:" ? url.origin : null
  } catch {
    return null
  }
}

function requestOrigin(requestHeaders: Awaited<ReturnType<typeof headers>>) {
  const configured = configuredOrigin()
  if (configured) return configured
  const host = requestHeaders.get("host")?.toLowerCase() ?? ""
  if (/^(?:localhost|127\.0\.0\.1)(?::\d{1,5})?$/.test(host)) {
    try {
      return new URL(`http://${host}`).origin
    } catch {
      return "https://ondo-directory.invalid"
    }
  }
  if (/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.phenixnet-jl\.chatgpt\.site$/.test(host)) return `https://${host}`
  return "https://ondo-directory.invalid"
}

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers()
  const origin = requestOrigin(requestHeaders)
  const imageUrl = new URL("/og-ondo-directory.png", origin).toString()

  return {
    metadataBase: new URL(origin),
    applicationName: "ONDO",
    title,
    description,
    alternates: { canonical: "/ondo-b" },
    openGraph: {
      siteName: "ONDO",
      title,
      description,
      images: [{
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: "ONDO 溫圖 Korea map with 400 official Seoul and Busan records and a separate Jeju editorial collection",
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
