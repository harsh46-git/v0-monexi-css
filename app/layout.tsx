import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AnimatedBackground } from "@/components/animated-background"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Monexi - Next Gen Personal Finance",
  description: "Smart Budgeting. AI Advice. Real-time Market Tracking...",
  verification: {
    google: 'WVS6iIGzckZZXfDCVwKiELDlegqRuY4NWlhEkfsN5tM',
  },
  
  icons: {
    icon: '/monexi.png',
    shortcut: '/monexi.png',
    apple: '/monexi.png',
  },
  metadataBase: new URL("https://www.monexi.in"),
  openGraph: {
    title: "Monexi - Next Gen Personal Finance",
    description: "Finance without the complexity. Smart budgeting, AI-powered advice, and real-time market tracking.",
    url: "https://www.monexi.in",
    siteName: "Monexi",
    images: [{ url: "/monexi.png", width: 512, height: 512, alt: "Monexi - Next Gen Personal Finance" }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Monexi - Next Gen Personal Finance",
    description: "Finance without the complexity. AI-powered personal finance.",
    images: ["/monexi.png"],
  },
  generator: "v0.app",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f1729",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AnimatedBackground />
        <div className="relative z-10">{children}</div>
        <Analytics />
      </body>
    </html>
  )
}
