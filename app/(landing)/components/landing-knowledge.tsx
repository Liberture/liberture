import { Button } from "@/components/ui/button"
import { BookOpen, Trophy, Users, ArrowRight } from "lucide-react"
import Link from "next/link"
import { translations } from "@/lib/translations"
import { IconCardGrid } from "./icon-card-grid"

const knowledgeIcons = {
  "Document Library": BookOpen,
  "The Liberture 100": Trophy,
  "50 Influencers Index": Users,
}

export function LandingKnowledge() {
  const { knowledge } = translations.en.landing
  const knowledgeItems = knowledge.cards.map((card) => {
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

    return {
      title: card.title,
      description: card.description,
      icon: Icon,
      iconClassName: iconColor,
      cardClassName: hoverBorder,
    }
  })
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{knowledge.heading}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{knowledge.description}</p>
        </div>

        <IconCardGrid
          items={knowledgeItems}
          gridClassName="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
          defaultCardClassName="bg-card/50 border border-border/50"
        />

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
