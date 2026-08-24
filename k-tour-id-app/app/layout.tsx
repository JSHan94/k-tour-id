import type React from "react"
import type { Metadata, Viewport } from "next"
import "leaflet/dist/leaflet.css"
import "./globals.css"
import { AppProviders } from "./app-providers"

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://k-tour-id.vercel.app",
  ),
  alternates: { canonical: "/" },
  title: "K-Tour Map — 여행할수록 채워지는 대한민국 지도",
  description:
    "One K-Tour ID for tailored travel, everyday services, local benefits and privacy-preserving payments in Korea.",
  generator: "K-Tour ID",
  openGraph: {
    title: "K-Tour Map",
    description: "여행할수록 채워지는 나만의 대한민국 지도. 장소, 액티비티, 이동과 K-Tour ID 혜택을 한 여정으로 연결합니다.",
    type: "website",
    images: [{ url: "/og-modern-atlas.png", width: 1672, height: 941, alt: "K-Tour Map · 여행할수록 채워지는 나만의 대한민국 지도" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "K-Tour Map",
    description: "여행할수록 채워지는 나만의 대한민국 지도.",
    images: ["/og-modern-atlas.png"],
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&amp;family=Noto+Serif+KR:wght@500;600;700&amp;display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
