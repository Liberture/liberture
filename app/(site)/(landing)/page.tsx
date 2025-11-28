import { LandingCTA } from "./landing-cta"
import { LandingFeatures } from "./landing-features"
import { LandingHero } from "./landing-hero"
import { LandingKnowledge } from "./landing-knowledge"
import { LandingMarketplace } from "./landing-marketplace"
import { LandingPillars } from "./landing-pillars"

export default function Home() {
  return (
    <main className="min-h-screen">
      <LandingHero />
      <LandingFeatures />
      <LandingPillars />
      <LandingMarketplace />
      <LandingKnowledge />
      <LandingCTA />
    </main>
  )
}
