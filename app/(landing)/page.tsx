import { LandingNav } from "@/components/landing-nav"
import { LandingFooter } from "@/components/landing-footer"
import { TopographicBackground } from "@/components/topographic-background"
import { AuthProvider } from "@/lib/auth-context"
import { LandingCTA } from "./components/landing-cta"
import { LandingFeatures } from "./components/landing-features"
import { LandingHero } from "./components/landing-hero"
import { LandingKnowledge } from "./components/landing-knowledge"
import { LandingMarketplace } from "./components/landing-marketplace"
import { LandingPillars } from "./components/landing-pillars"

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
