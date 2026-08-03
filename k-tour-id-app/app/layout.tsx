import type React from "react"
import type { Metadata, Viewport } from "next"
import "@fontsource-variable/noto-sans-kr"
import "@fontsource-variable/noto-serif-kr"
import "./globals.css"
import { AppProvider } from "@/lib/store/app-provider"
import { LangProvider } from "@/lib/i18n/lang-provider"
import { LocationProvider } from "@/lib/location/location-provider"

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://k-tour-id.phenixnet-jl.chatgpt.site",
  ),
  title: "K-Tour ID — Prove less. Travel more.",
  description:
    "One K-Tour ID for tailored travel, everyday services, local benefits and privacy-preserving payments in Korea.",
  generator: "K-Tour ID",
  openGraph: {
    title: "K-Tour ID",
    description: "Persona-aware onboarding, curated local services and K-Tour ID benefits",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "K-Tour ID · Prove less. Travel more." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "K-Tour ID",
    description: "Persona-aware onboarding, curated local services and K-Tour ID benefits",
    images: ["/og.png"],
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
