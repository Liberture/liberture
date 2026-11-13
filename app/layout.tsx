import { cookies, headers } from "next/headers"
import { managedAuthEnabled } from "@/lib/identity/config"
import { ImpersonationNotice } from "@/app/admin/users/impersonation-notice"
import { TooltipProvider } from "@/components/ui/tooltip"
import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getTranslations } from "next-intl/server"
import { currentPageAlternates } from "@/lib/i18n/route-metadata.server"
import { ServiceWorkerRegister } from "@/components/habits/service-worker-register"
import { HabitsSessionProvider } from "@/components/habits/session-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { ahrefsScript } from "@/lib/ahrefs"
import { CookieConsent } from "@/components/legal/CookieConsent"
import { OrganizationSchema, WebSiteSchema } from "@/components/seo/JsonLd"
import "./globals.css"

// Using Inter as primary font per design system
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t, alternates] = await Promise.all([
    getLocale(), getTranslations("siteMetadata"), currentPageAlternates(),
  ])
  const title = t("title")
  const description = t("description")
  const images = [{ url: "/og-image.jpg", width: 1200, height: 630, alt: t("imageAlt") }]
  return {
    metadataBase: new URL("https://liberture.com"),
    title: { default: title, template: "%s | Liberture" },
    description,
    keywords: t.raw("keywords"),
    authors: [{ name: "Liberture" }],
    creator: "Liberture",
    publisher: "Liberture",
    alternates,
    openGraph: {
      title, description, siteName: "Liberture", type: "website", images,
      locale: locale === "es" ? "es_ES" : "en_US",
      url: alternates?.canonical?.toString() ?? "./",
    },
    twitter: {
      card: "summary_large_image", title, description, images,
      site: "@liberture", creator: "@liberture",
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
        { url: "/pwa-icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      shortcut: "/favicon.ico",
      apple: "/apple-icon.png",
    },
    manifest: "/manifest.webmanifest",
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
  }
}

export const viewport: Viewport = {
  themeColor: "#111827",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("siteMetadata")])
  const requestHeaders = await headers()
  const isAhrefsAudit = /\bAhrefsSiteAudit\b/i.test(requestHeaders.get("user-agent") ?? "")
  let impersonatedName: string | undefined
  if (managedAuthEnabled()) {
    const jar = await cookies()
    if (jar.has("better-auth.admin_session") || jar.has("__Secure-better-auth.admin_session")) {
      const { identity } = await import("@/lib/identity/server")
      const current = await identity().api.getSession({ headers: requestHeaders })
      if (current?.session.impersonatedBy) impersonatedName = current.user.name
    }
  }
  return (
    // next-themes owns the class from here; "dark" is also rendered on the
    // server so the first paint is right. Only the dark palette exists in
    // globals.css, so it is the only theme offered (see settings/preferences-tab).
    <html lang={locale} className="dark" suppressHydrationWarning>
      <head>{isAhrefsAudit && <script {...ahrefsScript} />}</head>
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}>
        <OrganizationSchema description={t("description")} />
        <WebSiteSchema description={t("description")} locale={locale} />
        <ThemeProvider attribute="class" defaultTheme="dark" themes={["dark"]} enableSystem={false} disableTransitionOnChange>
          <NextIntlClientProvider>
            {impersonatedName && <ImpersonationNotice name={impersonatedName} />}
            <HabitsSessionProvider><TooltipProvider delayDuration={250}>{children}</TooltipProvider></HabitsSessionProvider>
            <ServiceWorkerRegister />
            <CookieConsent ahrefsInHead={isAhrefsAudit} />
            <Analytics />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
