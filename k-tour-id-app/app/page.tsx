import type { Metadata } from "next"
import { headers } from "next/headers"
import { OndoProductB } from "@/features/ondo/app/ondo-product-b"

const title = "K-Tour ID"
const description = "Find your next food stop in Korea with K-Tour ID—discover restaurants, cafés and bars on the map, and keep your travel pass close."
const socialImage = "/og-ktour-food-v2.png"
const productionOrigin = "https://ktour-id.vercel.app"

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
  // Production aliases share one public identity; preview and local QA remain
  // on their own origins instead of advertising the production deployment.
  if (process.env.VERCEL_ENV === "production") return productionOrigin
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
    applicationName: "K-Tour ID",
    title,
    description,
    icons: {
      icon: [
        { url: "/brand/ktour-id-mono-v1-16.png", type: "image/png", sizes: "16x16" },
        { url: "/brand/ktour-id-mono-v1-32.png", type: "image/png", sizes: "32x32" },
        { url: "/brand/ktour-id-mono-v1-192.png", type: "image/png", sizes: "192x192" },
        { url: "/brand/ktour-id-mono-v1.svg", type: "image/svg+xml", sizes: "any" },
      ],
      apple: [{ url: "/brand/ktour-id-mono-v1-180.png", type: "image/png", sizes: "180x180" }],
    },
    alternates: { canonical: "/" },
    openGraph: {
      siteName: "K-Tour ID",
      title,
      description,
      type: "website",
      url: "/",
      images: [{
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: "K-Tour ID — Food, Cafés and Bars in Korea",
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
