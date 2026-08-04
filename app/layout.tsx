import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/auth-context"
import { CookieConsent } from "@/components/legal/CookieConsent"
import { OrganizationSchema, WebSiteSchema } from "@/components/seo/JsonLd"
import "./globals.css"

// Using Inter as primary font per design system
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  metadataBase: new URL('https://liberture.com'),
  title: {
    default: "Liberture | Biological Operating System",
    template: "%s | Liberture",
  },
  description: "Master your biology. Unlock your potential. The unified platform for human optimization.",
  keywords: [
    "biological operating system",
    "human performance platform",
    "wellness optimization",
    "bio-tracking",
    "habit coaching",
    "biohacking",
    "longevity",
    "performance optimization",
    "Liberture",
  ],
  authors: [{ name: "Liberture" }],
  creator: "Liberture",
  publisher: "Liberture",
  // "./" resolves against the current route, giving every page a
  // self-referencing canonical unless it overrides `alternates`.
  alternates: {
    canonical: "./",
  },
  openGraph: {
    title: "Liberture | Biological Operating System",
    description:
      "A unified platform combining data-driven insights, coaching, and tools to help you unlock peak performance.",
    url: "https://liberture.com",
    siteName: "Liberture",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Liberture - Biological Operating System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Liberture | Biological Operating System",
    description:
      "Master your biology with Liberture, the platform built for tracking, coaching, and optimizing your wellbeing.",
    images: ["/og-image.png"],
    site: "@liberture",
    creator: "@liberture",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.json",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
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
        <OrganizationSchema />
        <WebSiteSchema />
        <AuthProvider>{children}</AuthProvider>
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  )
}
