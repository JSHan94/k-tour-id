import type React from "react"
import type { Metadata, Viewport } from "next"
import "@fontsource-variable/noto-sans-kr"
import "@fontsource-variable/noto-serif-kr"
import "./globals.css"
import { AppProvider } from "@/lib/store/app-provider"
import { LangProvider } from "@/lib/i18n/lang-provider"

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://k-tour-id.phenixnet-jl.chatgpt.site",
  ),
  title: "K-Tour ID — Prove less. Travel more.",
  description:
    "K-Tour ID turns verified identity sources into a privacy-preserving visitor credential for benefits, payments, vouchers and partner settlement.",
  generator: "K-Tour ID",
  openGraph: {
    title: "K-Tour ID",
    description: "Prove less. Travel more. · Simulation build",
    type: "website",
    images: [{ url: "/seoul-after-rain-hero.jpg", width: 933, height: 1400, alt: "Seoul after rain" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "K-Tour ID",
    description: "Prove less. Travel more. · Simulation build",
    images: ["/seoul-after-rain-hero.jpg"],
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
          <AppProvider>{children}</AppProvider>
        </LangProvider>
      </body>
    </html>
  )
}
