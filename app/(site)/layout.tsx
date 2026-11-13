import { LocalizedLinksProvider } from "@/components/i18n/localized-link"
import { getEntitySlugMap } from "@/lib/i18n/entity-slugs.server"
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup"
import { captchaSiteKey } from "@/lib/newsletter/captcha"
import { SiteBreadcrumbs } from "@/components/seo/site-breadcrumbs"
import type { ReactNode } from "react"

import { getLocale } from "next-intl/server"
import { LandingFooter } from "@/components/layout/landing-footer"
import { LandingNav } from "@/components/layout/landing-nav"
import { AnimatedBackground } from "@/components/illustrations/AnimatedBackground"
// import { PageTransition } from "@/components/animations/PageTransition"

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale()
  const slugs = locale === "es" ? await getEntitySlugMap() : new Map<string, string>()
  return (
    <LocalizedLinksProvider slugs={slugs}>
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex flex-col">
      <AnimatedBackground />
      <LandingNav />
      <main className="flex-1 pt-16">
        <SiteBreadcrumbs />
        {children}
      </main>
      <NewsletterSignup siteKey={captchaSiteKey} />
      <LandingFooter />
    </div>
    </LocalizedLinksProvider>
  )
}
