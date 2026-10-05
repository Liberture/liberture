import type { ReactNode } from "react"

import { getRequestLocale } from "@/lib/habits/i18n/server"
import { LandingFooter } from "@/components/layout/landing-footer"
import { LandingNav } from "@/components/layout/landing-nav"
import { AnimatedBackground } from "@/components/illustrations/AnimatedBackground"
// import { PageTransition } from "@/components/animations/PageTransition"

export default async function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex flex-col">
      <AnimatedBackground />
      <LandingNav />
      <main className="flex-1 pt-16">
        {children}
      </main>
      <LandingFooter locale={await getRequestLocale()} />
    </div>
  )
}
