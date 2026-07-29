import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AppProvider } from "@/lib/store/app-provider"
import { LangProvider } from "@/lib/i18n/lang-provider"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})
// Korean glyphs render via the OS Korean fonts in the --font-sans stack
// (Apple SD Gothic Neo / Malgun Gothic / Noto Sans KR) — no webfont gamble.

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://k-tour-id.phenixnet-jl.chatgpt.site",
  ),
  title: "K-Tour ID — AI Tourist Trust Wallet",
  description:
    "K-Tour ID turns verified identity sources into a privacy-preserving visitor credential for benefits, payments, vouchers and partner settlement.",
  generator: "K-Tour ID",
  openGraph: {
    title: "K-Tour ID",
    description: "Prove less. Travel more. · Simulation build",
    type: "website",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "K-Tour ID simulation build social preview" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "K-Tour ID",
    description: "Prove less. Travel more. · Simulation build",
    images: ["/og.png"],
  },
}

export const viewport: Viewport = {
  themeColor: "#1c1813", // 먹 ink — matches the warm palette
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
    <html lang="ko" className={`${inter.variable} antialiased`}>
      <body className="font-sans">
        <LangProvider>
          <AppProvider>{children}</AppProvider>
        </LangProvider>
      </body>
    </html>
  )
}
