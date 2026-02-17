import { MotionSection } from "@/components/animations"
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
      <MotionSection delay={0.1}>
        <LandingFeatures />
      </MotionSection>
      <MotionSection delay={0.2}>
        <LandingPillars />
      </MotionSection>
      <MotionSection delay={0.1}>
        <LandingMarketplace />
      </MotionSection>
      <MotionSection delay={0.1}>
        <LandingKnowledge />
      </MotionSection>
      <MotionSection delay={0.1}>
        <LandingNewsletter />
      </MotionSection>
      <MotionSection delay={0.1}>
        <LandingCTA />
      </MotionSection>
    </main>
  )
}
