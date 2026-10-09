import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { LocaleProvider } from "@/components/i18n/locale-provider"
import { ServiceWorkerRegister } from "@/components/habits/service-worker-register"
import { HabitsSessionProvider } from "@/components/habits/session-provider"
import { NostrAuthProvider } from "@/lib/habits/nostr/auth-context"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { getRequestLocale } from "@/lib/habits/i18n/server"
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
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Liberture: your habits, by voice. A habit tracker for ChatGPT and Claude",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Liberture | Biological Operating System",
    description:
      "Master your biology with Liberture, the platform built for tracking, coaching, and optimizing your wellbeing.",
    images: ["/og-image.jpg"],
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
  // Google takes the site icon from these links (48px multiples work best), so
  // every entry is the hexagon logo — never the tracker's old bolt.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.webmanifest",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
}

export const viewport: Viewport = {
  themeColor: "#111827",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getRequestLocale()
  return (
    // next-themes owns the class from here; "dark" is also rendered on the
    // server so the first paint is right. Only the dark palette exists in
    // globals.css, so it is the only theme offered (see settings/preferences-tab).
    <html lang={locale} className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}>
        <OrganizationSchema />
        <WebSiteSchema />
        <ThemeProvider attribute="class" defaultTheme="dark" themes={["dark"]} enableSystem={false} disableTransitionOnChange>
          <LocaleProvider locale={locale}>
            <NostrAuthProvider>
              <HabitsSessionProvider>{children}</HabitsSessionProvider>
            </NostrAuthProvider>
          </LocaleProvider>
        </ThemeProvider>
        <ServiceWorkerRegister />
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  )
}
