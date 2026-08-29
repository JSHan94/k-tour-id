import type { Metadata } from "next"
import { headers } from "next/headers"
import { OndoProductB } from "@/features/ondo/app/ondo-product-b"

const title = "K-TOUR ID | ONDO 溫圖"
const description = "A map-first Korea travel experience by ONDO 溫圖—discover Seoul, Busan, and Jeju with a privacy-minded K-TOUR ID travel pass."
const socialImage = "/og-map-first.png"

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
  const forwardedHost = requestHeaders.get("x-forwarded-host")?.split(",")[0]?.trim().toLowerCase() ?? ""
  const host = (forwardedHost || requestHeaders.get("host")?.toLowerCase()) ?? ""
  if (/^(?:localhost|127\.0\.0\.1)(?::\d{1,5})?$/.test(host)) {
    try {
      return new URL(`http://${host}`).origin
    } catch {
      return "https://ondo-directory.invalid"
    }
  }
  if (/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.phenixnet-jl\.chatgpt\.site$/.test(host)) return `https://${host}`
  if (/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.vercel\.app$/.test(host)) return `https://${host}`
  const configured = configuredOrigin()
  if (configured) return configured
  return "https://ondo-directory.invalid"
}

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers()
  const origin = requestOrigin(requestHeaders)
  const imageUrl = new URL(socialImage, origin).toString()

  return {
    metadataBase: new URL(origin),
    applicationName: "K-TOUR ID",
    title,
    description,
    icons: {
      icon: [
        { url: "/brand/ktour-id-mark-32.png", type: "image/png", sizes: "32x32" },
        { url: "/brand/ktour-id-mark-192.png", type: "image/png", sizes: "192x192" },
      ],
      apple: [{ url: "/brand/ktour-id-mark-180.png", type: "image/png", sizes: "180x180" }],
    },
    alternates: { canonical: "/" },
    openGraph: {
      siteName: "K-TOUR ID",
      title,
      description,
      type: "website",
      url: "/",
      images: [{
        url: imageUrl,
        width: 1731,
        height: 909,
        alt: "K-TOUR ID by ONDO 溫圖 — a map-first Korea travel experience",
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

export default function HomePage() {
  return <OndoProductB />
}
