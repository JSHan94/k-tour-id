import type React from "react"
import type { Metadata, Viewport } from "next"
import "leaflet/dist/leaflet.css"
import "./globals.css"
import { AppProviders } from "./app-providers"
import { ONDO_B_APPEARANCE_BOOTSTRAP_SCRIPT } from "@/features/ondo/shared/state/ondo-b-appearance"

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://ondo-directory.invalid",
  ),
  alternates: { canonical: "/" },
  applicationName: "K-Tour ID",
  title: "K-Tour ID",
  description:
    "Find your next food stop in Korea with K-Tour ID—discover restaurants, cafés and bars on the map, and keep your travel pass close.",
  generator: "K-Tour ID",
  icons: {
    icon: [
      { url: "/brand/ktour-id-mono-v1-16.png", type: "image/png", sizes: "16x16" },
      { url: "/brand/ktour-id-mono-v1-32.png", type: "image/png", sizes: "32x32" },
      { url: "/brand/ktour-id-mono-v1-192.png", type: "image/png", sizes: "192x192" },
      { url: "/brand/ktour-id-mono-v1.svg", type: "image/svg+xml", sizes: "any" },
    ],
    apple: [{ url: "/brand/ktour-id-mono-v1-180.png", type: "image/png", sizes: "180x180" }],
  },
  openGraph: {
    siteName: "K-Tour ID",
    title: "K-Tour ID",
    description: "Find your next food stop in Korea with K-Tour ID—discover restaurants, cafés and bars on the map, and keep your travel pass close.",
    type: "website",
    images: [{ url: "/og-ktour-korea-v3.png", width: 1200, height: 630, alt: "K-Tour ID — Korean hanok alley, barbecue and a café with yakgwa" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "K-Tour ID",
    description: "Find your next food stop in Korea with K-Tour ID—discover restaurants, cafés and bars on the map, and keep your travel pass close.",
    images: ["/og-ktour-korea-v3.png"],
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
    <html
      lang="ko"
      className="antialiased"
      data-ondo-theme="light"
      data-ondo-theme-preference="system"
      suppressHydrationWarning
    >
      <head>
        <script
          id="ondo-appearance-bootstrap"
          dangerouslySetInnerHTML={{ __html: ONDO_B_APPEARANCE_BOOTSTRAP_SCRIPT }}
        />
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
