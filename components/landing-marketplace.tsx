import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Brain, Heart, Leaf, BookOpen, Video, Gamepad2, FileText, Users, Crown, ArrowRight } from "lucide-react"

const contentTypes = [
  { name: "Premium Protocols", icon: Crown, count: 47 },
  { name: "Open Source", icon: FileText, count: 124 },
  { name: "Coaching", icon: Users, count: 32 },
  { name: "Books & Guides", icon: BookOpen, count: 89 },
  { name: "Video & Media", icon: Video, count: 156 },
  { name: "Interactive Games", icon: Gamepad2, count: 23 },
]

const featuredItems = [
  {
    title: "7-Day Ketogenic Induction Protocol",
    pillar: "Fueling",
    type: "Premium Protocol",
    author: "Dr. Sarah Chen",
    color: "bg-fueling/20 border-fueling/30",
    icon: Leaf,
  },
  {
    title: "Deep Sleep Architecture Masterclass",
    pillar: "Recovery",
    type: "Video Course",
    author: "Prof. Matthew Walker",
    color: "bg-recovery/20 border-recovery/30",
    icon: Heart,
  },
  {
    title: "Flow State Activation Training",
    pillar: "Cognition",
    type: "Interactive Game",
    author: "Liberture Labs",
    color: "bg-cognition/20 border-cognition/30",
    icon: Brain,
  },
]

export function LandingMarketplace() {
  return (
    <section id="marketplace" className="py-20 px-4 bg-card/30">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <span className="text-primary text-sm font-medium uppercase tracking-wider">Knowledge Hub</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">The Liberture Marketplace</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Your central hub for actionable protocols, expert coaching, and educational resources. Curated content
            aligned with your optimization journey.
          </p>
        </div>

        {/* Content Type Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-12">
          {contentTypes.map((type) => (
            <div
              key={type.name}
              className="p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/50 transition-colors text-center"
            >
              <type.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">{type.name}</p>
              <p className="text-xs text-muted-foreground">{type.count} items</p>
            </div>
          ))}
        </div>

        {/* Featured Items */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {featuredItems.map((item) => (
            <div
              key={item.title}
              className={`p-6 rounded-2xl ${item.color} border hover:scale-[1.02] transition-transform cursor-pointer`}
            >
              <div className="flex items-center gap-2 mb-3">
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{item.pillar}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-background/50">{item.type}</span>
              </div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">by {item.author}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/marketplace">
            <Button size="lg" variant="outline" className="gap-2 bg-transparent">
              Explore Full Marketplace <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
