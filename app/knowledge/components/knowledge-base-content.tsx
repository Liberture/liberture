"use client"

import { useEffect, useState } from "react"
import { PillarFilter } from "@/components/pillars/pillar-filter"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
  import {
    BookOpen,
    Bed,
    ChefHat,
    Clapperboard,
    Dumbbell,
    FileText,
    Infinity,
    Microscope,
  Pill,
  Search,
  Star,
  User,
  Wand,
  ExternalLink,
  Trophy,
  Users,
  TrendingUp,
  ThumbsUp,
  Plus,
} from "lucide-react"
import { translations } from "@/lib/translations"
import { createPillarFilterOptions } from "@/lib/pillars"
import type { PillarId } from "@/lib/translations"

type Pillar = "all" | PillarId

type KnowledgeVertical =
  | "nutrition"
  | "sleep"
  | "exercise"
  | "longevity"
  | "mental-health"
  | "supplements"

type KnowledgeType = "books" | "videos" | "experts" | "tools" | "articles"

const knowledgeVerticalIcons: Record<KnowledgeVertical, any> = {
  nutrition: ChefHat,
  sleep: Bed,
  exercise: Dumbbell,
  longevity: Infinity,
  "mental-health": Wand,
  supplements: Pill,
}

const knowledgeTypeIcons: Record<KnowledgeType, any> = {
  books: BookOpen,
  videos: Clapperboard,
  experts: User,
  tools: Microscope,
  articles: FileText,
}

interface KnowledgeVerticalMeta {
  id: KnowledgeVertical
  label: string
  accent: string
  glow: string
}

interface KnowledgeTypeMeta {
  id: KnowledgeType
  label: string
}

interface KnowledgeCard {
  id: string
  title: string
  blurb: string
  image: string
  vertical: KnowledgeVertical
  type: KnowledgeType
}

interface LibertureBook {
  id: number
  rank: number
  title: string
  author: string
  pillar: PillarId
  influenceScore: number
  summary: string
}

interface Influencer {
  id: number
  name: string
  domains: PillarId[]
  expertise: string
  followers: string
  publications: number
  image: string
}

interface LibraryDocument {
  id: number
  title: string
  author: string
  type: string
  pillar: PillarId
  tags: string[]
  rating: number
  external: boolean
}

interface KnowledgeData {
  tags: string[]
  knowledgeVerticals: KnowledgeVerticalMeta[]
  knowledgeTypes: KnowledgeTypeMeta[]
  knowledgeCards: KnowledgeCard[]
  liberture100Books: LibertureBook[]
  influencers: Influencer[]
  libraryDocuments: LibraryDocument[]
}

const pillarFilters = createPillarFilterOptions<Pillar>(translations.en.common.filters.allDomains)

export function KnowledgeBaseContent() {
  const [knowledgeVerticals, setKnowledgeVerticals] = useState<KnowledgeVerticalMeta[]>([])
  const [knowledgeTypes, setKnowledgeTypes] = useState<KnowledgeTypeMeta[]>([])
  const [knowledgeCards, setKnowledgeCards] = useState<KnowledgeCard[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [liberture100Books, setLiberture100Books] = useState<LibertureBook[]>([])
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [libraryDocuments, setLibraryDocuments] = useState<LibraryDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadKnowledge = async () => {
      try {
        const response = await fetch("/api/knowledge")
        if (!response.ok) return

        const data: KnowledgeData = await response.json()
        if (!isMounted) return

        setAvailableTags(data.tags || [])
        setKnowledgeVerticals(data.knowledgeVerticals || [])
        setKnowledgeTypes(data.knowledgeTypes || [])
        setKnowledgeCards(data.knowledgeCards || [])
        setLiberture100Books(data.liberture100Books || [])
        setInfluencers(data.influencers || [])
        setLibraryDocuments(data.libraryDocuments || [])
      } catch (error) {
        console.error("Failed to load knowledge data", error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadKnowledge()

    return () => {
      isMounted = false
    }
  }, [])

  const [activeTab, setActiveTab] = useState("library")
  const [selectedPillar, setSelectedPillar] = useState<Pillar>("all")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"influence" | "date" | "pillar">("influence")
  const [selectedVertical, setSelectedVertical] = useState<KnowledgeVertical>("longevity")
  const [selectedType, setSelectedType] = useState<KnowledgeType>("books")

  const knowledgeTypeIconMap = knowledgeTypeIcons

  const activeVertical = knowledgeVerticals.find((vertical) => vertical.id === selectedVertical)

  const filteredHeroCards = knowledgeCards.filter((card) => {
    const matchesVertical = selectedVertical ? card.vertical === selectedVertical : true
    const matchesType = selectedType ? card.type === selectedType : true
    return matchesVertical && matchesType
  })

  const heroCardsToShow = filteredHeroCards.length > 0 ? filteredHeroCards : knowledgeCards.slice(0, 6)

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const filteredDocuments = libraryDocuments.filter((doc) => {
    const matchesPillar = selectedPillar === "all" || doc.pillar === selectedPillar
    const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => doc.tags.includes(tag))
    const matchesSearch =
      searchQuery === "" ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.author.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesPillar && matchesTags && matchesSearch
  })

  const filteredBooks = liberture100Books
    .filter((book) => {
      const matchesPillar = selectedPillar === "all" || book.pillar === selectedPillar
      const matchesSearch =
        searchQuery === "" ||
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesPillar && matchesSearch
    })
    .sort((a, b) => {
      if (sortBy === "influence") return b.influenceScore - a.influenceScore
      if (sortBy === "pillar") return a.pillar.localeCompare(b.pillar)
      return a.rank - b.rank
    })

  const filteredInfluencers = influencers.filter((inf) => {
    const matchesPillar = selectedPillar === "all" || inf.domains.includes(selectedPillar as any)
    const matchesSearch =
      searchQuery === "" ||
      inf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inf.expertise.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesPillar && matchesSearch
  })

  const getPillarInfo = (pillarId: string) => pillarFilters.find((p) => p.id === pillarId)

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Hero Router */}
        <section className="mb-12">
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/70 shadow-2xl backdrop-blur">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5" />
            <div className="relative p-6 md:p-10 space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <p className="text-sm uppercase tracking-[0.2em] text-primary/70">Knowledge Router</p>
                  <h1 className="text-4xl md:text-5xl font-semibold leading-tight">Explore knowledge fast</h1>
                  <p className="text-lg text-muted-foreground">Choose your lane and your format.</p>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="rounded-full bg-muted px-3 py-1 font-medium">{activeVertical?.label} first</span>
                    <span className="rounded-full border px-3 py-1 capitalize">{selectedType}</span>
                    <span className="hidden sm:inline text-border">•</span>
                    <span className="hidden sm:inline">Auto-curated on load</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 md:gap-3 lg:justify-end">
                  {knowledgeVerticals.map((vertical) => {
                    const Icon = knowledgeVerticalIcons[vertical.id]
                    const isActive = vertical.id === selectedVertical
                    return (
                      <button
                        key={vertical.id}
                        onClick={() => setSelectedVertical(vertical.id)}
                        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all shadow-sm ${
                          isActive
                            ? `bg-gradient-to-r ${vertical.accent} text-white border-transparent scale-[1.03]`
                            : "bg-card/70 hover:border-primary/40 hover:-translate-y-0.5"
                        }`}
                      >
                        {Icon && <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-muted-foreground"}`} />}
                        {vertical.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[170px_1fr]">
                <div className="flex lg:flex-col gap-3">
                  {knowledgeTypes.map((type) => {
                    const Icon = knowledgeTypeIcons[type.id]
                    const isActive = selectedType === type.id
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`group flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-base font-semibold transition-all ${
                          isActive
                            ? "bg-primary text-primary-foreground border-primary/70 shadow-lg shadow-primary/20"
                            : "bg-card/70 hover:border-primary/40 hover:-translate-y-0.5"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          {Icon && <Icon className="h-5 w-5" />}
                          {type.label}
                        </span>
                        <span className="text-xs text-muted-foreground group-hover:text-foreground">{isActive ? "Active" : "View"}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {heroCardsToShow.length === 0 && (
                    <p className="col-span-full text-muted-foreground text-sm">
                      {isLoading ? "Loading knowledge cards..." : "No knowledge cards available."}
                    </p>
                  )}
                  {heroCardsToShow.map((card) => {
                    const verticalMeta = knowledgeVerticals.find((v) => v.id === card.vertical)
                    const TypeIcon = knowledgeTypeIconMap[card.type]
                    const VerticalIcon = knowledgeVerticalIcons[card.vertical]

                    return (
                      <div
                        key={card.id}
                        className={`group relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 transition-all hover:-translate-y-1 hover:shadow-2xl ${
                          verticalMeta?.glow || ""
                        }`}
                      >
                        <div className="relative h-40">
                          <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${card.image})` }}
                          />
                          <div
                            className={`absolute inset-0 bg-gradient-to-t from-black/65 via-black/35 to-transparent ${
                              verticalMeta ? `mix-blend-multiply` : ""
                            }`}
                          />
                          {verticalMeta && (
                            <div
                              className={`absolute inset-x-0 bottom-0 h-16 opacity-90 bg-gradient-to-r ${verticalMeta.accent}`}
                            />
                          )}
                          <div className="absolute left-4 bottom-4 flex items-center gap-2 text-white drop-shadow-md">
                            {TypeIcon && <TypeIcon className="h-5 w-5" />}
                            <span className="text-sm font-medium capitalize">{card.type}</span>
                          </div>
                        </div>
                        <div className="space-y-3 p-4">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            <div className="flex items-center gap-1 rounded-full border px-3 py-1">
                              {VerticalIcon && <VerticalIcon className="h-4 w-4" />}
                              <span className="capitalize">{card.vertical.replace("-", " ")}</span>
                            </div>
                            <span className="text-border">•</span>
                            <span className="rounded-full bg-muted px-3 py-1 capitalize">{card.type}</span>
                          </div>
                          <h3 className="text-xl font-semibold leading-tight">{card.title}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">{card.blurb}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="h-10 w-10 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold">Dig deeper</h2>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            The definitive curated library for biohackers. Books, research, white papers, and expert insights across all
            six optimization pillars.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xl mx-auto mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search books, authors, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-xl bg-card/50 border-border/50"
          />
        </div>

        <PillarFilter
          label="Filter by Pillar"
          options={pillarFilters}
          selected={selectedPillar}
          onSelect={(value) => setSelectedPillar(value as Pillar)}
        />

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card/50 p-1">
            <TabsTrigger value="library" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Document Library
            </TabsTrigger>
            <TabsTrigger value="liberture100" className="gap-2">
              <Trophy className="h-4 w-4" />
              Liberture 100
            </TabsTrigger>
            <TabsTrigger value="influencers" className="gap-2">
              <Users className="h-4 w-4" />
              50 Influencers
            </TabsTrigger>
          </TabsList>

          {/* Document Library Tab */}
          <TabsContent value="library" className="space-y-6">
            {/* Tag Filters */}
            <div>
              <p className="text-sm text-muted-foreground mb-3">Filter by Tags</p>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/20"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Results */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing <span className="text-foreground font-medium">{filteredDocuments.length}</span> documents
              </p>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Plus className="h-4 w-4" />
                Suggest Resource
              </Button>
            </div>

            {/* Document Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDocuments.map((doc) => {
                const pillarInfo = getPillarInfo(doc.pillar)
                const PillarIcon = pillarInfo?.icon || BookOpen

                return (
                  <Card
                    key={doc.id}
                    className={`${pillarInfo?.bg} border hover:scale-[1.02] transition-all cursor-pointer`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <PillarIcon className={`h-5 w-5 ${pillarInfo?.color}`} />
                          <Badge variant="secondary" className="text-xs">
                            {doc.type}
                          </Badge>
                        </div>
                        {doc.external ? (
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Internal
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg mb-1">{doc.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">by {doc.author}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {doc.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span className="text-sm font-medium">{doc.rating}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* Liberture 100 Tab */}
          <TabsContent value="liberture100" className="space-y-6">
            <Card className="bg-gradient-to-br from-primary/20 via-card to-cyan-400/10 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  The Liberture 100: Essential Biohacking Books
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  A constantly updated list of the 100 most influential and important biohacking books covering all six
                  pillars. Ranked by community ratings, sales data, and expert review.
                </p>
              </CardContent>
            </Card>

            {/* Sort Options */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <div className="flex gap-2">
                {[
                  { id: "influence", label: "Influence Score" },
                  { id: "pillar", label: "Pillar" },
                ].map((option) => (
                  <Button
                    key={option.id}
                    variant={sortBy === option.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy(option.id as any)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Books List */}
            <div className="space-y-3">
              {filteredBooks.map((book) => {
                const pillarInfo = getPillarInfo(book.pillar)
                const PillarIcon = pillarInfo?.icon || BookOpen

                return (
                  <div
                    key={book.id}
                    className={`p-4 rounded-xl ${pillarInfo?.bg} border flex items-center gap-4 hover:scale-[1.01] transition-all cursor-pointer`}
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-background/50 flex items-center justify-center">
                      <span className="text-2xl font-bold text-muted-foreground">#{book.rank}</span>
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{book.title}</h3>
                        <PillarIcon className={`h-4 w-4 ${pillarInfo?.color} flex-shrink-0`} />
                      </div>
                      <p className="text-sm text-muted-foreground">by {book.author}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{book.summary}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-400" />
                        <span className="font-bold text-lg">{book.influenceScore}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Influence</p>
                    </div>
                    <ExternalLink className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                )
              })}
            </div>
          </TabsContent>

          {/* 50 Influencers Tab */}
          <TabsContent value="influencers" className="space-y-6">
            <Card className="bg-gradient-to-br from-cyan-400/20 via-card to-primary/10 border-cyan-400/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-cyan-400" />
                  The 50 Influencers Index
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  A categorized index of the 50 most renowned biohacking authors, content creators, and researchers.
                  Each tagged with their primary domains of expertise.
                </p>
              </CardContent>
            </Card>

            {/* Influencers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInfluencers.map((influencer) => (
                <Card
                  key={influencer.id}
                  className="bg-card/50 border hover:scale-[1.02] transition-all cursor-pointer"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <img
                        src={influencer.image || "/examples/placeholders/placeholder.svg"}
                        alt={influencer.name}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                      <div className="flex-grow min-w-0">
                        <h3 className="font-semibold text-lg">{influencer.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{influencer.expertise}</p>
                        <div className="flex flex-wrap gap-1">
                          {influencer.domains.map((domain) => {
                            const pInfo = getPillarInfo(domain)
                            const Icon = pInfo?.icon
                            return Icon ? (
                              <div key={domain} className={`p-1 rounded ${pInfo?.bg}`}>
                                <Icon className={`h-3.5 w-3.5 ${pInfo?.color}`} />
                              </div>
                            ) : null
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Followers: </span>
                        <span className="font-medium">{influencer.followers}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Publications: </span>
                        <span className="font-medium">{influencer.publications}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Community Suggestion CTA */}
        <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-primary/20 via-card to-cyan-400/10 border border-primary/20">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-grow text-center md:text-left">
              <h3 className="text-xl font-semibold mb-2">Contribute to the Knowledge Base</h3>
              <p className="text-muted-foreground max-w-xl">
                Suggest books and resources for community review. Achieve BOS Level 20+ to gain voting privileges and
                help curate the library.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2 bg-transparent">
                <ThumbsUp className="h-4 w-4" />
                Vote on Suggestions
              </Button>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Suggest Resource
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
