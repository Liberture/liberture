import { Brain, Heart, Leaf, Zap, Dumbbell, Wallet } from "lucide-react"

const pillars = [
  {
    name: "Cognition",
    icon: Brain,
    color: "from-cognition/20 to-cognition/5",
    borderColor: "border-cognition/30",
    textColor: "text-cognition",
    description:
      "Optimize focus, memory, learning, and mental clarity through nootropics, brain training, and cognitive protocols.",
  },
  {
    name: "Recovery",
    icon: Heart,
    color: "from-recovery/20 to-recovery/5",
    borderColor: "border-recovery/30",
    textColor: "text-recovery",
    description:
      "Master sleep, stress management, and regeneration to maximize your body's natural healing and restoration.",
  },
  {
    name: "Fueling",
    icon: Leaf,
    color: "from-fueling/20 to-fueling/5",
    borderColor: "border-fueling/30",
    textColor: "text-fueling",
    description: "Dial in nutrition, hydration, and supplementation for peak energy and metabolic performance.",
  },
  {
    name: "Mental State",
    icon: Zap,
    color: "from-mental/20 to-mental/5",
    borderColor: "border-mental/30",
    textColor: "text-mental",
    description:
      "Cultivate emotional resilience, mindfulness, and psychological well-being for sustainable performance.",
  },
  {
    name: "Physicality",
    icon: Dumbbell,
    color: "from-physicality/20 to-physicality/5",
    borderColor: "border-physicality/30",
    textColor: "text-physicality",
    description: "Build strength, endurance, mobility, and physical capacity through optimized training protocols.",
  },
  {
    name: "Finance",
    icon: Wallet,
    color: "from-finance/20 to-finance/5",
    borderColor: "border-finance/30",
    textColor: "text-finance",
    description: "Master wealth creation, financial independence, and resource optimization for life freedom.",
  },
]

export function LandingPillars() {
  return (
    <section id="pillars" className="py-20 px-4 bg-card/30">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">The Six Pillars of Optimization</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Each pillar represents a critical domain of human performance. Balance all six to achieve true optimization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pillars.map((pillar) => (
            <div
              key={pillar.name}
              className={`p-6 rounded-2xl bg-gradient-to-b ${pillar.color} border ${pillar.borderColor} hover:scale-105 transition-transform`}
            >
              <pillar.icon className={`h-10 w-10 ${pillar.textColor} mb-4`} />
              <h3 className={`text-lg font-semibold mb-2 ${pillar.textColor}`}>{pillar.name}</h3>
              <p className="text-sm text-muted-foreground">{pillar.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
