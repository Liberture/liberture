import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/auth-context"
import { CookieConsent } from "@/components/CookieConsent"
import "./globals.css"

// Using Inter as primary font per design system
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "Liberture | Biological Operating System",
  description: "Master your biology. Unlock your potential. The unified platform for human optimization.",
  keywords: [
    "biological operating system",
    "human performance platform",
    "wellness optimization",
    "bio-tracking",
    "habit coaching",
    "Liberture",
  ],
  openGraph: {
    title: "Liberture | Biological Operating System",
    description:
      "A unified platform combining data-driven insights, coaching, and tools to help you unlock peak performance.",
    url: "https://liberture.com",
    siteName: "Liberture",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Liberture | Biological Operating System",
    description:
      "Master your biology with Liberture, the platform built for tracking, coaching, and optimizing your wellbeing.",
  },
  icons: {
    icon: [
      {
        url: "/icons/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icons/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icons/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/icons/apple-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#111827",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}>
        <AuthProvider>{children}</AuthProvider>
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  )
}
