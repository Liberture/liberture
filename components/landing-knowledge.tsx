import { Button } from "@/components/ui/button"
import { BookOpen, Trophy, Users, ArrowRight } from "lucide-react"
import Link from "next/link"
import { translations } from "@/lib/translations"

const knowledgeIcons = {
  "Document Library": BookOpen,
  "The Liberture 100": Trophy,
  "50 Influencers Index": Users,
}

export function LandingKnowledge() {
  const { knowledge } = translations.en.landing
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{knowledge.heading}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{knowledge.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {knowledge.cards.map((card) => {
            const iconKey = card.title as keyof typeof knowledgeIcons
            const Icon = knowledgeIcons[iconKey] ?? BookOpen
            const iconColor =
              card.accent === "yellow"
                ? "text-yellow-500"
                : card.accent === "cyan"
                  ? "text-cyan-400"
                  : "text-primary"
            const hoverBorder =
              card.accent === "yellow"
                ? "hover:border-yellow-500/50"
                : card.accent === "cyan"
                  ? "hover:border-cyan-400/50"
                  : "hover:border-primary/50"

            return (
              <div
                key={card.title}
                className={`p-6 rounded-2xl bg-card/50 border border-border/50 transition-colors ${hoverBorder}`}
              >
                <Icon className={`h-10 w-10 ${iconColor} mb-4`} />
                <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </div>
            )
          })}
        </div>

        <div className="text-center">
          <Link href="/knowledge">
            <Button size="lg" className="gap-2">
              {knowledge.cta}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
