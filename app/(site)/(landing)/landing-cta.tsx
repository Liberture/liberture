import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { translations } from "@/lib/translations"

export function LandingCTA() {
  const { cta } = translations.en.landing
  return (
    <section id="how-it-works" className="py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-primary/20 via-card to-cyan-400/10 border border-primary/20">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{cta.heading}</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">{cta.description}</p>
          <Link href="/get-started">
            <Button size="lg" className="bg-primary hover:bg-primary/90 gap-2 text-lg px-8">
              {cta.primary} <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
