import Link from "next/link"
import { Brain, Droplet, Utensils, Dumbbell, Heart, Wallet, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const games = [
  {
    id: "sleep",
    title: "Learn to Sleep",
    description: "Master sleep hygiene: control bedtime, meal timing, and light exposure to optimize your rest.",
    icon: Brain,
    color: "from-purple-500/20 to-purple-500/5 border-purple-500/30",
    status: "available",
  },
  {
    id: "hydration",
    title: "Learn to Drink Water",
    description: "Track hydration throughout the day and see how it impacts your energy and performance.",
    icon: Droplet,
    color: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30",
    status: "coming-soon",
  },
  {
    id: "nutrition",
    title: "Learn to Eat",
    description: "Balance calories and macros, manage glucose spikes, and optimize body composition.",
    icon: Utensils,
    color: "from-green-500/20 to-green-500/5 border-green-500/30",
    status: "coming-soon",
  },
  {
    id: "exercise",
    title: "Learn to Exercise",
    description: "Build strength, endurance, and mobility through optimized training protocols.",
    icon: Dumbbell,
    color: "from-orange-500/20 to-orange-500/5 border-orange-500/30",
    status: "coming-soon",
  },
  {
    id: "meditation",
    title: "Learn to Meditate",
    description: "Develop mindfulness and mental resilience through guided meditation practices.",
    icon: Heart,
    color: "from-pink-500/20 to-pink-500/5 border-pink-500/30",
    status: "coming-soon",
  },
  {
    id: "finances",
    title: "Learn about Finances",
    description: "Master budgeting, saving, and investing to achieve financial independence.",
    icon: Wallet,
    color: "from-yellow-500/20 to-yellow-500/5 border-yellow-500/30",
    status: "coming-soon",
  },
]

export default function GamesPage() {
  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Interactive Life Skills
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Learn fundamental biohacking skills through immersive simulations. 
            Control time, observe cause and effect, and master your biology.
          </p>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => {
            const Icon = game.icon
            return (
              <div
                key={game.id}
                className={`p-6 rounded-2xl bg-gradient-to-b ${game.color} border relative overflow-hidden group`}
              >
                {/* Status Badge */}
                {game.status === "coming-soon" && (
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-background/50 text-xs font-medium">
                    Coming Soon
                  </div>
                )}

                {/* Icon */}
                <div className="h-12 w-12 rounded-xl bg-card border border-border/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="h-6 w-6" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold mb-2">{game.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {game.description}
                </p>

                {/* CTA */}
                {game.status === "available" ? (
                  <Link href={`/games/${game.id}`}>
                    <Button size="sm" className="gap-2 group-hover:gap-3 transition-all">
                      Play Now <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Button size="sm" variant="ghost" disabled>
                    Coming Soon
                  </Button>
                )}
              </div>
            )
          })}
        </div>

        {/* Info Section */}
        <div className="mt-16 p-8 rounded-2xl bg-card/50 border border-border/50">
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2">🕐 Control Time</h3>
              <p className="text-sm text-muted-foreground">
                Speed up or slow down time to see long-term effects of your choices.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">📊 Track Progress</h3>
              <p className="text-sm text-muted-foreground">
                Real-time markers show how your actions impact health metrics.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🎯 Learn by Doing</h3>
              <p className="text-sm text-muted-foreground">
                Make decisions, observe outcomes, and optimize your behavior.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
