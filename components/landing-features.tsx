import { Card, CardContent } from "@/components/ui/card"
import { Target, Trophy, BarChart3, Layers, Gamepad2, LineChart } from "lucide-react"
import { IslandRidge, TriadBasins } from "@/components/patterns"

const features = [
  {
    icon: Layers,
    title: "Six Optimization Pillars",
    description: "Cognition, Recovery, Fueling, Mental State, Physicality, and Finance - all unified in one system.",
  },
  {
    icon: Gamepad2,
    title: "Gamified Progress",
    description: "Earn XP, level up your BOS, and complete protocols that turn optimization into an engaging journey.",
  },
  {
    icon: BarChart3,
    title: "BOS Level Tracking",
    description: "Your Biological Operating System level reflects your overall optimization state across all domains.",
  },
  {
    icon: Target,
    title: "Smart Protocols",
    description: "AI-curated routines that guide you through proven optimization techniques and habits.",
  },
  {
    icon: Trophy,
    title: "Achievement System",
    description: "Unlock achievements, complete quests, and track milestones in your optimization journey.",
  },
  {
    icon: LineChart,
    title: "Unified Analytics",
    description: "See how your pillars interact and identify patterns to optimize your performance holistically.",
  },
]

export function LandingFeatures() {
  return (
    <section id="features" className="relative overflow-hidden py-20 px-4">
      <TriadBasins
        placement="corner"
        gradient="acidLime"
        size="360px"
        className="-left-10 top-0"
        opacity={0.22}
      />
      <IslandRidge
        placement="corner"
        gradient="magma"
        size="420px"
        className="-right-10 bottom-0 rotate-6"
        opacity={0.2}
      />
      <div className="container relative z-10 mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Optimize</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Stop juggling multiple apps. Liberture brings all aspects of human optimization under one roof.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-border transition-colors"
            >
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
