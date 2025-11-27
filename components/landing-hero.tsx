import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Zap, Brain, Heart, Leaf, Dumbbell } from "lucide-react"
import { FoldedDrift, RippleBloom } from "@/components/patterns"

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 px-4">
      <FoldedDrift placement="full" gradient="plasma" className="-inset-10" opacity={0.16} />
      <RippleBloom
        placement="corner"
        gradient="neon"
        size="420px"
        className="-right-10 -top-10 rotate-6"
        opacity={0.24}
      />
      <div className="container relative z-10 mx-auto max-w-7xl">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary font-medium">Your Biological Operating System</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-balance">
            Master Your Biology.{" "}
            <span className="bg-gradient-to-r from-primary via-cyan-400 to-green-400 bg-clip-text text-transparent">
              Unlock Your Potential.
            </span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
            Liberture unifies the fragmented world of human optimization into one intelligent platform. Track, gamify,
            and optimize every aspect of your biological performance.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/login">
              <Button size="lg" className="bg-primary hover:bg-primary/90 gap-2 text-lg px-8">
                Start Optimizing <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent">
                Learn More
              </Button>
            </Link>
          </div>

          {/* Pillar Icons */}
          <div className="flex items-center justify-center gap-6 md:gap-10">
            {[
              { icon: Brain, color: "text-cognition", label: "Cognition" },
              { icon: Heart, color: "text-recovery", label: "Recovery" },
              { icon: Leaf, color: "text-fueling", label: "Fueling" },
              { icon: Zap, color: "text-mental", label: "Mental" },
              { icon: Dumbbell, color: "text-physicality", label: "Physicality" },
            ].map((pillar) => (
              <div key={pillar.label} className="flex flex-col items-center gap-2 group">
                <div
                  className={`p-3 rounded-xl bg-card border border-border/50 group-hover:border-border transition-colors`}
                >
                  <pillar.icon className={`h-6 w-6 ${pillar.color}`} />
                </div>
                <span className="text-xs text-muted-foreground">{pillar.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
