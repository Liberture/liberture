import Link from "next/link"
import { BookOpen, Video, Gamepad2, FileText, Users, Crown, ArrowRight } from "lucide-react"

import { PILLAR_ICON_MAP } from "@/lib/pillars"
import { translations } from "@/lib/translations"
import { Button } from "@/components/ui/button"
import { IconCardGrid } from "./icon-card-grid"
import { LandingSection, LandingSectionHeader } from "./landing-section"

type MarketplaceTypeWithCount = (typeof translations.en.common.marketplaceTypes)[number] & { count: number }

const contentTypeIcons = {
  premium: Crown,
  opensource: FileText,
  coaching: Users,
  books: BookOpen,
  video: Video,
  interactive: Gamepad2,
  references: FileText,
}

export function LandingMarketplace() {
  const { marketplace } = translations.en.landing
  const contentTypes: MarketplaceTypeWithCount[] = translations.en.common.marketplaceTypes.filter(
    (type): type is MarketplaceTypeWithCount => type.count !== undefined,
  )

  const contentTypeCards = contentTypes.map((type) => {
    const Icon = contentTypeIcons[type.id] ?? FileText
    return {
      title: type.name,
      description: `${type.count} items`,
      icon: Icon,
      iconClassName: "h-6 w-6 text-primary mx-auto mb-2",
      contentClassName: "text-center",
      cardClassName: "hover:border-primary/50",
      titleClassName: "text-sm font-medium",
      descriptionClassName: "text-xs text-muted-foreground",
    }
  })
  return (
    <LandingSection id="marketplace" className="bg-card/30">
      <LandingSectionHeader
        badge={marketplace.badge}
        heading={marketplace.heading}
        description={marketplace.description}
      />

      {/* Content Type Grid */}
      <IconCardGrid
        items={contentTypeCards}
        gridClassName="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-12"
        cardBaseClassName="p-4 rounded-xl bg-card/50 border border-border/50 transition-colors"
        defaultIconClassName="h-6 w-6 mx-auto mb-2"
        defaultTitleClassName="text-sm font-medium"
        defaultDescriptionClassName="text-xs text-muted-foreground"
      />

      {/* Featured Items */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {marketplace.featuredItems.map((item) => {
          const Icon = PILLAR_ICON_MAP[item.icon] ?? PILLAR_ICON_MAP.cognition
          return (
            <div
              key={item.title}
              className={`p-6 rounded-2xl ${item.color} border hover:scale-[1.02] transition-transform cursor-pointer`}
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{item.pillar}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-background/50">{item.type}</span>
              </div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">by {item.author}</p>
            </div>
          )
        })}
      </div>

      {/* CTA */}
      <div className="text-center">
        <Link href="/marketplace">
          <Button size="lg" variant="outline" className="gap-2 bg-transparent">
            {marketplace.cta} <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </LandingSection>
  )
}
