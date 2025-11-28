import type { ReactNode } from "react"

import { LandingFooter } from "@/components/layout/landing-footer"
import { LandingNav } from "@/components/layout/landing-nav"
import { TopographicBackground } from "@/components/topographic-background"

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background topo-pattern flex flex-col">
      <TopographicBackground />
      <LandingNav />
      <main className="flex-1 pt-16">{children}</main>
      <LandingFooter />
    </div>
  )
}
