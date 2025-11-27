import { LandingNav } from "@/components/landing-nav"
import { LandingHero } from "@/components/landing-hero"
import { LandingFeatures } from "@/components/landing-features"
import { LandingPillars } from "@/components/landing-pillars"
import { LandingMarketplace } from "@/components/landing-marketplace"
import { LandingKnowledge } from "@/components/landing-knowledge"
import { LandingCTA } from "@/components/landing-cta"
import { LandingFooter } from "@/components/landing-footer"
import { PatternUsageGuide } from "@/components/pattern-usage-guide"
import { AuthProvider } from "@/lib/auth-context"

export default function Home() {
  return (
    <AuthProvider>
      <main className="min-h-screen bg-background">
        <LandingNav />
        <LandingHero />
        <LandingFeatures />
        <LandingPillars />
        <LandingMarketplace />
        <LandingKnowledge />
        <LandingCTA />
        <LandingFooter />
        <PatternUsageGuide />
      </main>
    </AuthProvider>
  )
}
