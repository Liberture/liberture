"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Brain,
  Heart,
  Leaf,
  Zap,
  Dumbbell,
  Wallet,
  BookOpen,
  Search,
  Star,
  ExternalLink,
  Trophy,
  Users,
  TrendingUp,
  ThumbsUp,
  Plus,
} from "lucide-react"

type Pillar = "all" | "cognition" | "recovery" | "fueling" | "mental" | "physicality" | "finance"

const pillars = [
  { id: "all" as const, name: "All Domains", icon: null },
  {
    id: "cognition" as const,
    name: "Cognition",
    icon: Brain,
    color: "text-cognition",
    bg: "bg-cognition/10 border-cognition/30",
  },
  {
    id: "recovery" as const,
    name: "Recovery",
    icon: Heart,
    color: "text-recovery",
    bg: "bg-recovery/10 border-recovery/30",
  },
  { id: "fueling" as const, name: "Fueling", icon: Leaf, color: "text-fueling", bg: "bg-fueling/10 border-fueling/30" },
  { id: "mental" as const, name: "Mental State", icon: Zap, color: "text-mental", bg: "bg-mental/10 border-mental/30" },
  {
    id: "physicality" as const,
    name: "Physicality",
    icon: Dumbbell,
    color: "text-physicality",
    bg: "bg-physicality/10 border-physicality/30",
  },
  {
    id: "finance" as const,
    name: "Finance",
    icon: Wallet,
    color: "text-finance",
    bg: "bg-finance/10 border-finance/30",
  },
]

const tags = [
  "Mitochondria",
  "Ketosis",
  "Cold Therapy",
  "Intermittent Fasting",
  "Epigenetics",
  "Nootropics",
  "HRV",
  "Sleep Cycles",
  "Meditation",
  "Strength Training",
  "FIRE",
  "Index Funds",
  "Tax Optimization",
  "Compound Interest",
]

// Liberture 100 Books
const liberture100Books = [
  {
    id: 1,
    rank: 1,
    title: "Why We Sleep",
    author: "Matthew Walker",
    pillar: "recovery" as const,
    influenceScore: 98,
    summary: "The definitive guide to sleep science and optimization.",
  },
  {
    id: 2,
    rank: 2,
    title: "Atomic Habits",
    author: "James Clear",
    pillar: "mental" as const,
    influenceScore: 97,
    summary: "Transform your life through small habit changes.",
  },
  {
    id: 3,
    rank: 3,
    title: "The 4-Hour Body",
    author: "Tim Ferriss",
    pillar: "physicality" as const,
    influenceScore: 96,
    summary: "Unconventional methods for rapid body transformation.",
  },
  {
    id: 4,
    rank: 4,
    title: "Deep Work",
    author: "Cal Newport",
    pillar: "cognition" as const,
    influenceScore: 95,
    summary: "Rules for focused success in a distracted world.",
  },
  {
    id: 5,
    rank: 5,
    title: "The Psychology of Money",
    author: "Morgan Housel",
    pillar: "finance" as const,
    influenceScore: 95,
    summary: "Timeless lessons on wealth, greed, and happiness.",
  },
  {
    id: 6,
    rank: 6,
    title: "Lifespan",
    author: "David Sinclair",
    pillar: "recovery" as const,
    influenceScore: 94,
    summary: "Why we age and why we don't have to.",
  },
  {
    id: 7,
    rank: 7,
    title: "The Obesity Code",
    author: "Jason Fung",
    pillar: "fueling" as const,
    influenceScore: 93,
    summary: "Unlocking the secrets of weight loss through fasting.",
  },
  {
    id: 8,
    rank: 8,
    title: "Breath",
    author: "James Nestor",
    pillar: "recovery" as const,
    influenceScore: 92,
    summary: "The new science of a lost art.",
  },
  {
    id: 9,
    rank: 9,
    title: "Outlive",
    author: "Peter Attia",
    pillar: "physicality" as const,
    influenceScore: 92,
    summary: "The science and art of longevity.",
  },
  {
    id: 10,
    rank: 10,
    title: "The Richest Man in Babylon",
    author: "George S. Clason",
    pillar: "finance" as const,
    influenceScore: 91,
    summary: "Ancient wisdom for modern wealth building.",
  },
  {
    id: 11,
    rank: 11,
    title: "Limitless",
    author: "Jim Kwik",
    pillar: "cognition" as const,
    influenceScore: 90,
    summary: "Upgrade your brain, learn anything faster.",
  },
  {
    id: 12,
    rank: 12,
    title: "The Wim Hof Method",
    author: "Wim Hof",
    pillar: "recovery" as const,
    influenceScore: 89,
    summary: "Activate your full human potential through cold and breath.",
  },
  {
    id: 13,
    rank: 13,
    title: "I Will Teach You to Be Rich",
    author: "Ramit Sethi",
    pillar: "finance" as const,
    influenceScore: 89,
    summary: "No guilt, no excuses - just a 6-week wealth program.",
  },
  {
    id: 14,
    rank: 14,
    title: "The Mind Illuminated",
    author: "Culadasa",
    pillar: "mental" as const,
    influenceScore: 88,
    summary: "Complete meditation guide integrating Buddhist wisdom and brain science.",
  },
  {
    id: 15,
    rank: 15,
    title: "Super Human",
    author: "Dave Asprey",
    pillar: "fueling" as const,
    influenceScore: 87,
    summary: "The bulletproof plan to age backward.",
  },
]

const influencers = [
  {
    id: 1,
    name: "Andrew Huberman",
    domains: ["cognition", "mental", "recovery"] as const,
    expertise: "Neuroscience & Protocols",
    followers: "5.2M",
    publications: 12,
    image: "/andrew-huberman-portrait.jpg",
  },
  {
    id: 2,
    name: "Peter Attia",
    domains: ["physicality", "fueling", "recovery"] as const,
    expertise: "Longevity & Medicine",
    followers: "1.8M",
    publications: 8,
    image: "/peter-attia-portrait.jpg",
  },
  {
    id: 3,
    name: "Rhonda Patrick",
    domains: ["fueling", "recovery"] as const,
    expertise: "Nutrition & Genetics",
    followers: "2.1M",
    publications: 15,
    image: "/rhonda-patrick-portrait.jpg",
  },
  {
    id: 4,
    name: "David Sinclair",
    domains: ["recovery", "fueling"] as const,
    expertise: "Aging & Genetics",
    followers: "1.5M",
    publications: 6,
    image: "/david-sinclair-portrait.jpg",
  },
  {
    id: 5,
    name: "Morgan Housel",
    domains: ["finance"] as const,
    expertise: "Behavioral Finance",
    followers: "890K",
    publications: 4,
    image: "/morgan-housel-portrait.jpg",
  },
  {
    id: 6,
    name: "Tim Ferriss",
    domains: ["physicality", "cognition", "finance"] as const,
    expertise: "Performance & Lifestyle",
    followers: "4.1M",
    publications: 9,
    image: "/tim-ferriss-portrait.jpg",
  },
  {
    id: 7,
    name: "Wim Hof",
    domains: ["recovery", "mental"] as const,
    expertise: "Cold Exposure & Breath",
    followers: "3.2M",
    publications: 3,
    image: "/wim-hof-portrait.jpg",
  },
  {
    id: 8,
    name: "James Clear",
    domains: ["mental", "cognition"] as const,
    expertise: "Habits & Behavior",
    followers: "2.8M",
    publications: 2,
    image: "/james-clear-portrait.jpg",
  },
  {
    id: 9,
    name: "Ramit Sethi",
    domains: ["finance"] as const,
    expertise: "Personal Finance",
    followers: "1.2M",
    publications: 5,
    image: "/ramit-sethi-portrait.jpg",
  },
  {
    id: 10,
    name: "Matthew Walker",
    domains: ["recovery"] as const,
    expertise: "Sleep Science",
    followers: "980K",
    publications: 7,
    image: "/matthew-walker-portrait.jpg",
  },
  {
    id: 11,
    name: "Andy Galpin",
    domains: ["physicality"] as const,
    expertise: "Exercise Physiology",
    followers: "720K",
    publications: 11,
    image: "/andy-galpin-portrait.jpg",
  },
  {
    id: 12,
    name: "Kelly Starrett",
    domains: ["physicality", "recovery"] as const,
    expertise: "Mobility & Movement",
    followers: "1.1M",
    publications: 4,
    image: "/kelly-starrett-portrait.jpg",
  },
]

// All library documents
const libraryDocuments = [
  {
    id: 1,
    title: "Why We Sleep",
    author: "Matthew Walker",
    type: "Book",
    pillar: "recovery" as const,
    tags: ["Sleep Cycles", "HRV"],
    rating: 4.9,
    external: true,
  },
  {
    id: 2,
    title: "Mitochondrial Biogenesis Protocol",
    author: "Liberture Research",
    type: "White Paper",
    pillar: "cognition" as const,
    tags: ["Mitochondria", "Nootropics"],
    rating: 4.7,
    external: false,
  },
  {
    id: 3,
    title: "Intermittent Fasting Meta-Analysis",
    author: "Dr. Jason Fung",
    type: "Academic Article",
    pillar: "fueling" as const,
    tags: ["Intermittent Fasting", "Ketosis"],
    rating: 4.8,
    external: false,
  },
  {
    id: 4,
    title: "Cold Exposure Adaptation Guide",
    author: "Wim Hof Method",
    type: "E-Book",
    pillar: "recovery" as const,
    tags: ["Cold Therapy", "HRV"],
    rating: 4.6,
    external: true,
  },
  {
    id: 5,
    title: "The Psychology of Money",
    author: "Morgan Housel",
    type: "Book",
    pillar: "finance" as const,
    tags: ["Compound Interest", "Index Funds"],
    rating: 4.9,
    external: true,
  },
  {
    id: 6,
    title: "Epigenetic Markers of Aging",
    author: "Harvard Medical",
    type: "Academic Article",
    pillar: "recovery" as const,
    tags: ["Epigenetics"],
    rating: 4.5,
    external: false,
  },
  {
    id: 7,
    title: "HRV Training Complete Guide",
    author: "Liberture Community",
    type: "Long-form Guide",
    pillar: "mental" as const,
    tags: ["HRV", "Meditation"],
    rating: 4.7,
    external: false,
  },
  {
    id: 8,
    title: "Strength Training Periodization",
    author: "Dr. Andy Galpin",
    type: "E-Book",
    pillar: "physicality" as const,
    tags: ["Strength Training"],
    rating: 4.8,
    external: true,
  },
  {
    id: 9,
    title: "Tax-Advantaged Investing Guide",
    author: "Liberture Finance",
    type: "White Paper",
    pillar: "finance" as const,
    tags: ["Tax Optimization", "FIRE"],
    rating: 4.6,
    external: false,
  },
  {
    id: 10,
    title: "Nootropic Stack Research Review",
    author: "Examine.com",
    type: "Academic Article",
    pillar: "cognition" as const,
    tags: ["Nootropics", "Mitochondria"],
    rating: 4.4,
    external: false,
  },
]

export function KnowledgeBaseContent() {
  const [activeTab, setActiveTab] = useState("library")
  const [selectedPillar, setSelectedPillar] = useState<Pillar>("all")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"influence" | "date" | "pillar">("influence")

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

  const getPillarInfo = (pillarId: string) => pillars.find((p) => p.id === pillarId)

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold">Knowledge Base</h1>
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

        {/* Pillar Filters */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-3">Filter by Pillar</p>
          <div className="flex flex-wrap gap-2">
            {pillars.map((pillar) => (
              <Button
                key={pillar.id}
                variant={selectedPillar === pillar.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPillar(pillar.id)}
                className={`gap-2 ${selectedPillar === pillar.id ? "" : "bg-card/50"}`}
              >
                {pillar.icon && (
                  <pillar.icon className={`h-4 w-4 ${selectedPillar === pillar.id ? "" : pillar.color}`} />
                )}
                {pillar.name}
              </Button>
            ))}
          </div>
        </div>

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
                {tags.map((tag) => (
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
                        src={influencer.image || "/placeholder.svg"}
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
