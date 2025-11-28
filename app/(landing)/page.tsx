import { LandingNav } from "@/components/landing-nav"
import { LandingFooter } from "@/components/landing-footer"
import { TopographicBackground } from "@/components/topographic-background"
import { AuthProvider } from "@/lib/auth-context"
import { LandingCTA } from "./landing-cta"
import { LandingFeatures } from "./landing-features"
import { LandingHero } from "./landing-hero"
import { LandingKnowledge } from "./landing-knowledge"
import { LandingMarketplace } from "./landing-marketplace"
import { LandingPillars } from "./landing-pillars"

export default function Home() {
  return (
    <AuthProvider>
      <main className="min-h-screen bg-background topo-pattern">
        <TopographicBackground />
        <LandingNav />
        <LandingHero />
        <LandingFeatures />
        <LandingPillars />
        <LandingMarketplace />
        <LandingKnowledge />
        <LandingCTA />
        <LandingFooter />
      </main>
    </AuthProvider>
  )
}
