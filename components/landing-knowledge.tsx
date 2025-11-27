import { Button } from "@/components/ui/button"
import { BookOpen, Trophy, Users, ArrowRight } from "lucide-react"
import Link from "next/link"

export function LandingKnowledge() {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Curated Knowledge Library</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Access the definitive educational resource for biohackers. Community-vetted books, research, and expert
            insights.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/50 transition-colors">
            <BookOpen className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Document Library</h3>
            <p className="text-sm text-muted-foreground">
              Books, e-books, white papers, academic articles, and long-form guides tagged by pillar and topic.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-yellow-500/50 transition-colors">
            <Trophy className="h-10 w-10 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">The Liberture 100</h3>
            <p className="text-sm text-muted-foreground">
              The 100 most influential biohacking books, ranked by community ratings and expert review.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-cyan-400/50 transition-colors">
            <Users className="h-10 w-10 text-cyan-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">50 Influencers Index</h3>
            <p className="text-sm text-muted-foreground">
              The most renowned biohacking authors, researchers, and content creators by domain expertise.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link href="/knowledge">
            <Button size="lg" className="gap-2">
              Explore Knowledge Base
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
