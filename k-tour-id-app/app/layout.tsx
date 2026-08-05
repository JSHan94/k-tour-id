import type React from "react"
import type { Metadata, Viewport } from "next"
import "maplibre-gl/dist/maplibre-gl.css"
import "@fontsource-variable/noto-sans-kr"
import "@fontsource-variable/noto-serif-kr"
import "./globals.css"
import { AppProvider } from "@/lib/store/app-provider"
import { LangProvider } from "@/lib/i18n/lang-provider"
import { LocationProvider } from "@/lib/location/location-provider"

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://k-tour-id-app.vercel.app",
  ),
  alternates: { canonical: "/" },
  title: "K-Tour ID — Prove less. Travel more.",
  description:
    "One K-Tour ID for tailored travel, everyday services, local benefits and privacy-preserving payments in Korea.",
  generator: "K-Tour ID",
  openGraph: {
    title: "K-Tour ID",
    description: "A map-first travel atlas connecting places, activities, mobility and K-Tour ID benefits across Korea.",
    type: "website",
    images: [{ url: "/og-map-first.png", width: 1731, height: 909, alt: "K-Tour ID · 한국을 여행하는 새로운 지도" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "K-Tour ID",
    description: "A map-first travel atlas connecting places, activities, mobility and K-Tour ID benefits across Korea.",
    images: ["/og-map-first.png"],
  },
}

export const viewport: Viewport = {
  themeColor: "#f7f5f0",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // so env(safe-area-inset-*) resolves on notched iOS
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className="antialiased">
      <body className="font-sans">
        <LangProvider>
          <LocationProvider>
            <AppProvider>{children}</AppProvider>
          </LocationProvider>
        </LangProvider>
      </body>
    </html>
  )
}
