import { AnimatedSection } from "@/components/animations/AnimatedSection"
import { LandingCTA } from "./landing-cta"
import { LandingFeatures } from "./landing-features"
import { LandingHero } from "./landing-hero"
import { LandingKnowledge } from "./landing-knowledge"
import { LandingMarketplace } from "./landing-marketplace"
import { LandingNewsletter } from "./landing-newsletter"
import { LandingPillars } from "./landing-pillars"

export default function Home() {
  return (
    <main className="min-h-screen">
      <LandingHero />
      <AnimatedSection delay={0.1}>
        <LandingFeatures />
      </AnimatedSection>
      <AnimatedSection delay={0.2}>
        <LandingPillars />
      </AnimatedSection>
      <AnimatedSection delay={0.1}>
        <LandingMarketplace />
      </AnimatedSection>
      <AnimatedSection delay={0.1}>
        <LandingKnowledge />
      </AnimatedSection>
      <AnimatedSection delay={0.1}>
        <LandingNewsletter />
      </AnimatedSection>
      <AnimatedSection delay={0.1}>
        <LandingCTA />
      </AnimatedSection>
    </main>
  )
}
