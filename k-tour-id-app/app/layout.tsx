import type React from "react"
import type { Metadata, Viewport } from "next"
import "leaflet/dist/leaflet.css"
import "./globals.css"
import { AppProviders } from "./app-providers"

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://ondo-directory.invalid",
  ),
  alternates: { canonical: "/" },
  applicationName: "ONDO",
  title: "ONDO 溫圖 — Korea food & travel map",
  description:
    "Official Seoul and Busan food-service records, Jeju editorial travel ideas, and a source-bounded ONDO temperature map.",
  generator: "ONDO",
  icons: { icon: "/brand/ondo-mark-micro-16.svg" },
  openGraph: {
    siteName: "ONDO",
    title: "ONDO 溫圖 — Korea food & travel map",
    description: "서울·부산 공식 식음료 기록과 제주 편집 여행 아이디어를 한 지도에서 탐색하세요.",
    type: "website",
    images: [{ url: "/og-ondo-directory.png", width: 1200, height: 630, alt: "ONDO 溫圖 Korea food and travel map" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ONDO 溫圖 — Korea food & travel map",
    description: "서울·부산 공식 식음료 기록과 제주 편집 여행 아이디어를 한 지도에서 탐색하세요.",
    images: ["/og-ondo-directory.png"],
  },
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
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
