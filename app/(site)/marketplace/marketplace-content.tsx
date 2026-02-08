"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { PillarFilter } from "@/components/pillars/pillar-filter"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Video, Gamepad2, FileText, Users, Crown, Search, Filter, Star, Clock, ArrowRight, GraduationCap } from "lucide-react"
import { createPillarFilterOptions, PILLAR_ICON_MAP } from "@/lib/pillars"
import { translations } from "@/lib/translations"
import type { MarketplaceTypeId, PillarId } from "@/lib/translations"

type ContentType = "all" | MarketplaceTypeId
type Pillar = "all" | PillarId

const marketplaceTranslations = translations.en.marketplace
const pillarFilters = createPillarFilterOptions<Pillar>(translations.en.common.filters.allDomains, {
  includeBackground: false,
})

const contentTypeIcons = {
  premium: Crown,
  opensource: FileText,
  coaching: Users,
  books: BookOpen,
  video: Video,
  interactive: Gamepad2,
  references: GraduationCap,
}

const contentTypes = [
  { id: "all" as const, name: translations.en.common.filters.allTypes, icon: Filter },
  ...translations.en.common.marketplaceTypes.map((type) => ({
    id: type.id,
    name: marketplaceTranslations.filters.typeOverrides?.[type.id] ?? type.name,
    icon: contentTypeIcons[type.id],
  })),
]

interface MarketplaceItem {
  id: number
  title: string
  description: string
  pillar: PillarId
  type: MarketplaceTypeId
  author: string
  rating: number
  reviews: number
  price: number
  duration: string
  color: string
  iconColor: string
}



export function MarketplaceContent() {
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([])
  const [selectedPillar, setSelectedPillar] = useState<Pillar>("all")
  const [selectedType, setSelectedType] = useState<ContentType>("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    let isMounted = true

    const loadItems = async () => {
      try {
        const response = await fetch("/api/marketplace")
        if (!response.ok) return

        const data: MarketplaceItem[] = await response.json()
        if (isMounted) {
          setMarketplaceItems(data)
        }
      } catch (error) {
        console.error("Failed to load marketplace items", error)
      }
    }

    loadItems()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredItems = marketplaceItems.filter((item) => {
    const matchesPillar = selectedPillar === "all" || item.pillar === selectedPillar
    const matchesType = selectedType === "all" || item.type === selectedType
    const matchesSearch =
      searchQuery === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesPillar && matchesType && matchesSearch
  })

  const getTypeIcon = (type: ContentType) => {
    const found = contentTypes.find((t) => t.id === type)
    return found?.icon || FileText
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{marketplaceTranslations.heading}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">{marketplaceTranslations.description}</p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xl mx-auto mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={marketplaceTranslations.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-xl bg-card/50 border-border/50"
          />
        </div>

        <PillarFilter
          label={marketplaceTranslations.filters.pillarLabel}
          options={pillarFilters}
          selected={selectedPillar}
          onSelect={(value) => setSelectedPillar(value as Pillar)}
        />

        {/* Secondary Filters - Content Types */}
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-3">{marketplaceTranslations.filters.contentTypeLabel}</p>
          <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as ContentType)}>
            <TabsList className="flex-wrap h-auto gap-1 bg-card/50 p-1">
              {contentTypes.map((type) => (
                <TabsTrigger
                  key={type.id}
                  value={type.id}
                  className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <type.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{type.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {marketplaceTranslations.filters.resultsCount.replace("{count}", filteredItems.length.toString())}
          </p>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const TypeIcon = getTypeIcon(item.type)
            const pillarMeta = pillarFilters.find((p) => p.id === item.pillar)
            const PillarIcon = pillarMeta?.icon || PILLAR_ICON_MAP[item.pillar]

            return (
              <Link
                key={item.id}
                href={`/content/${item.id}`}
                className={`p-6 rounded-2xl border ${item.color} transition-all cursor-pointer group block`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <PillarIcon className={`h-5 w-5 ${item.iconColor}`} />
                    <Badge variant="secondary" className="text-xs">
                      {pillarMeta?.name}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="text-xs bg-green-500/20 border-green-500 text-green-400">
                    FREE
                  </Badge>
                </div>

                {/* Content */}
                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{item.description}</p>

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <TypeIcon className="h-3.5 w-3.5" />
                    {contentTypes.find((t) => t.id === item.type)?.name}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {item.duration}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    {marketplaceTranslations.meta.byPrefix} {item.author}
                  </p>
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                    <span className="text-xs font-medium">{item.rating}</span>
                    <span className="text-xs text-muted-foreground">({item.reviews})</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">{marketplaceTranslations.emptyState.message}</p>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedPillar("all")
                setSelectedType("all")
                setSearchQuery("")
              }}
            >
              {marketplaceTranslations.emptyState.reset}
            </Button>
          </div>
        )}

        {/* Recommendation Banner */}
        <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-primary/20 via-card to-cyan-400/10 border border-primary/20 text-center">
          <h3 className="text-xl font-semibold mb-2">{marketplaceTranslations.recommendation.title}</h3>
          <p className="text-muted-foreground mb-4 max-w-xl mx-auto">
            {marketplaceTranslations.recommendation.description}
          </p>
          <Button className="gap-2">
            {marketplaceTranslations.recommendation.cta} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
