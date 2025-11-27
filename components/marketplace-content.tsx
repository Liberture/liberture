"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Brain,
  Heart,
  Leaf,
  Zap,
  Dumbbell,
  Wallet,
  BookOpen,
  Video,
  Gamepad2,
  FileText,
  Users,
  Crown,
  Search,
  Filter,
  Star,
  Clock,
  ArrowRight,
  GraduationCap,
} from "lucide-react"

type Pillar = "all" | "cognition" | "recovery" | "fueling" | "mental" | "physicality" | "finance"
type ContentType = "all" | "premium" | "opensource" | "coaching" | "books" | "video" | "interactive" | "references"

const pillars = [
  { id: "all" as const, name: "All Domains", icon: null },
  { id: "cognition" as const, name: "Cognition", icon: Brain, color: "text-cognition" },
  { id: "recovery" as const, name: "Recovery", icon: Heart, color: "text-recovery" },
  { id: "fueling" as const, name: "Fueling", icon: Leaf, color: "text-fueling" },
  { id: "mental" as const, name: "Mental State", icon: Zap, color: "text-mental" },
  { id: "physicality" as const, name: "Physicality", icon: Dumbbell, color: "text-physicality" },
  { id: "finance" as const, name: "Finance", icon: Wallet, color: "text-finance" },
]

const contentTypes = [
  { id: "all" as const, name: "All Types", icon: Filter },
  { id: "premium" as const, name: "Premium Protocols", icon: Crown },
  { id: "opensource" as const, name: "Open Source", icon: FileText },
  { id: "coaching" as const, name: "Coaching Services", icon: Users },
  { id: "books" as const, name: "Books & Text", icon: BookOpen },
  { id: "video" as const, name: "Video & Media", icon: Video },
  { id: "interactive" as const, name: "Interactive & Games", icon: Gamepad2 },
  { id: "references" as const, name: "References & History", icon: GraduationCap },
]

const marketplaceItems = [
  // Cognition
  {
    id: 1,
    title: "Flow State Activation Protocol",
    description: "A 21-day program to reliably access deep focus and flow states on demand.",
    pillar: "cognition" as const,
    type: "premium" as const,
    author: "Dr. Andrew Huberman",
    rating: 4.9,
    reviews: 234,
    price: 79,
    duration: "21 days",
    color: "bg-cognition/10 border-cognition/30 hover:border-cognition/50",
    iconColor: "text-cognition",
  },
  {
    id: 2,
    title: "Beginner Nootropic Stack Guide",
    description: "Community-vetted introduction to cognitive enhancement supplements.",
    pillar: "cognition" as const,
    type: "opensource" as const,
    author: "Liberture Community",
    rating: 4.6,
    reviews: 892,
    price: 0,
    duration: "Self-paced",
    color: "bg-cognition/10 border-cognition/30 hover:border-cognition/50",
    iconColor: "text-cognition",
  },
  {
    id: 3,
    title: "Speed Reading Neural Trainer",
    description: "Interactive game to increase reading speed while maintaining comprehension.",
    pillar: "cognition" as const,
    type: "interactive" as const,
    author: "Liberture Labs",
    rating: 4.7,
    reviews: 156,
    price: 0,
    duration: "10 min/day",
    color: "bg-cognition/10 border-cognition/30 hover:border-cognition/50",
    iconColor: "text-cognition",
  },
  // Recovery
  {
    id: 4,
    title: "Sleep Architecture Masterclass",
    description: "Complete video course on optimizing every stage of your sleep cycle.",
    pillar: "recovery" as const,
    type: "video" as const,
    author: "Prof. Matthew Walker",
    rating: 4.9,
    reviews: 1247,
    price: 149,
    duration: "8 hours",
    color: "bg-recovery/10 border-recovery/30 hover:border-recovery/50",
    iconColor: "text-recovery",
  },
  {
    id: 5,
    title: "Cold Exposure Recovery Protocol",
    description: "Step-by-step guide to implementing cold therapy for faster recovery.",
    pillar: "recovery" as const,
    type: "opensource" as const,
    author: "Wim Hof Method Community",
    rating: 4.5,
    reviews: 567,
    price: 0,
    duration: "4 weeks",
    color: "bg-recovery/10 border-recovery/30 hover:border-recovery/50",
    iconColor: "text-recovery",
  },
  {
    id: 6,
    title: "1:1 Sleep Optimization Coaching",
    description: "Personal consultation with a certified sleep specialist.",
    pillar: "recovery" as const,
    type: "coaching" as const,
    author: "Dr. Rebecca Chen, PhD",
    rating: 5.0,
    reviews: 89,
    price: 199,
    duration: "60 min session",
    color: "bg-recovery/10 border-recovery/30 hover:border-recovery/50",
    iconColor: "text-recovery",
  },
  // Fueling
  {
    id: 7,
    title: "7-Day Ketogenic Induction Protocol",
    description: "Comprehensive guide to transitioning into nutritional ketosis safely.",
    pillar: "fueling" as const,
    type: "premium" as const,
    author: "Dr. Dom D'Agostino",
    rating: 4.8,
    reviews: 423,
    price: 49,
    duration: "7 days",
    color: "bg-fueling/10 border-fueling/30 hover:border-fueling/50",
    iconColor: "text-fueling",
  },
  {
    id: 8,
    title: "The Metabolic Flexibility Bible",
    description: "Deep dive into metabolic switching and fuel utilization optimization.",
    pillar: "fueling" as const,
    type: "books" as const,
    author: "Dr. Peter Attia",
    rating: 4.7,
    reviews: 312,
    price: 29,
    duration: "350 pages",
    color: "bg-fueling/10 border-fueling/30 hover:border-fueling/50",
    iconColor: "text-fueling",
  },
  {
    id: 9,
    title: "History of Fasting Practices",
    description: "Academic exploration of fasting from ancient traditions to modern science.",
    pillar: "fueling" as const,
    type: "references" as const,
    author: "Dr. Jason Fung",
    rating: 4.4,
    reviews: 178,
    price: 0,
    duration: "Research paper",
    color: "bg-fueling/10 border-fueling/30 hover:border-fueling/50",
    iconColor: "text-fueling",
  },
  // Mental State
  {
    id: 10,
    title: "HRV Biofeedback Training Game",
    description: "Real-time heart rate variability training through gamified exercises.",
    pillar: "mental" as const,
    type: "interactive" as const,
    author: "HeartMath Institute",
    rating: 4.8,
    reviews: 234,
    price: 0,
    duration: "15 min/day",
    color: "bg-mental/10 border-mental/30 hover:border-mental/50",
    iconColor: "text-mental",
  },
  {
    id: 11,
    title: "Stress Resilience Protocol",
    description: "30-day program to build psychological resilience and stress tolerance.",
    pillar: "mental" as const,
    type: "premium" as const,
    author: "Dr. Kelly McGonigal",
    rating: 4.7,
    reviews: 567,
    price: 89,
    duration: "30 days",
    color: "bg-mental/10 border-mental/30 hover:border-mental/50",
    iconColor: "text-mental",
  },
  {
    id: 12,
    title: "Performance Psychology Coaching",
    description: "Group sessions on mental performance with elite sports psychologist.",
    pillar: "mental" as const,
    type: "coaching" as const,
    author: "Dr. Michael Gervais",
    rating: 4.9,
    reviews: 145,
    price: 79,
    duration: "90 min group",
    color: "bg-mental/10 border-mental/30 hover:border-mental/50",
    iconColor: "text-mental",
  },
  // Physicality
  {
    id: 13,
    title: "Strength Periodization Masterplan",
    description: "12-week progressive overload program for maximum strength gains.",
    pillar: "physicality" as const,
    type: "premium" as const,
    author: "Dr. Andy Galpin",
    rating: 4.9,
    reviews: 892,
    price: 99,
    duration: "12 weeks",
    color: "bg-physicality/10 border-physicality/30 hover:border-physicality/50",
    iconColor: "text-physicality",
  },
  {
    id: 14,
    title: "Mobility & Movement Library",
    description: "Over 200 video tutorials for joint mobility and movement quality.",
    pillar: "physicality" as const,
    type: "video" as const,
    author: "Dr. Kelly Starrett",
    rating: 4.8,
    reviews: 1567,
    price: 119,
    duration: "200+ videos",
    color: "bg-physicality/10 border-physicality/30 hover:border-physicality/50",
    iconColor: "text-physicality",
  },
  {
    id: 15,
    title: "Beginner Calisthenics Routine",
    description: "Community-built bodyweight training progression for beginners.",
    pillar: "physicality" as const,
    type: "opensource" as const,
    author: "Reddit BWF Community",
    rating: 4.6,
    reviews: 2341,
    price: 0,
    duration: "Ongoing",
    color: "bg-physicality/10 border-physicality/30 hover:border-physicality/50",
    iconColor: "text-physicality",
  },
  {
    id: 16,
    title: "Financial Independence Blueprint",
    description: "Complete roadmap to achieving FIRE through strategic investing and saving.",
    pillar: "finance" as const,
    type: "premium" as const,
    author: "Mr. Money Mustache",
    rating: 4.9,
    reviews: 1892,
    price: 99,
    duration: "Self-paced",
    color: "bg-finance/10 border-finance/30 hover:border-finance/50",
    iconColor: "text-finance",
  },
  {
    id: 17,
    title: "Wealth Building Fundamentals",
    description: "Essential principles of compound growth, asset allocation, and tax optimization.",
    pillar: "finance" as const,
    type: "books" as const,
    author: "Morgan Housel",
    rating: 4.8,
    reviews: 2341,
    price: 24,
    duration: "280 pages",
    color: "bg-finance/10 border-finance/30 hover:border-finance/50",
    iconColor: "text-finance",
  },
  {
    id: 18,
    title: "1:1 Financial Optimization Coaching",
    description: "Personal consultation with a certified financial planner for biohackers.",
    pillar: "finance" as const,
    type: "coaching" as const,
    author: "Ramit Sethi Team",
    rating: 4.9,
    reviews: 456,
    price: 299,
    duration: "90 min session",
    color: "bg-finance/10 border-finance/30 hover:border-finance/50",
    iconColor: "text-finance",
  },
  {
    id: 19,
    title: "Passive Income Simulator",
    description: "Interactive game to model wealth accumulation strategies and outcomes.",
    pillar: "finance" as const,
    type: "interactive" as const,
    author: "Liberture Labs",
    rating: 4.6,
    reviews: 234,
    price: 0,
    duration: "Unlimited",
    color: "bg-finance/10 border-finance/30 hover:border-finance/50",
    iconColor: "text-finance",
  },
  {
    id: 20,
    title: "Crypto & DeFi Safety Guide",
    description: "Community-vetted introduction to secure cryptocurrency investing.",
    pillar: "finance" as const,
    type: "opensource" as const,
    author: "Liberture Community",
    rating: 4.4,
    reviews: 567,
    price: 0,
    duration: "Self-paced",
    color: "bg-finance/10 border-finance/30 hover:border-finance/50",
    iconColor: "text-finance",
  },
]

export function MarketplaceContent() {
  const [selectedPillar, setSelectedPillar] = useState<Pillar>("all")
  const [selectedType, setSelectedType] = useState<ContentType>("all")
  const [searchQuery, setSearchQuery] = useState("")

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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Liberture Marketplace</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover protocols, expert coaching, and educational resources curated for your optimization journey.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xl mx-auto mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search protocols, coaches, books..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-xl bg-card/50 border-border/50"
          />
        </div>

        {/* Primary Filters - Pillars */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-3">Filter by Optimization Domain</p>
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

        {/* Secondary Filters - Content Types */}
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-3">Filter by Content Type</p>
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
            Showing <span className="text-foreground font-medium">{filteredItems.length}</span> resources
          </p>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const TypeIcon = getTypeIcon(item.type)
            const PillarIcon = pillars.find((p) => p.id === item.pillar)?.icon || Brain

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
                      {pillars.find((p) => p.id === item.pillar)?.name}
                    </Badge>
                  </div>
                  <Badge variant={item.price === 0 ? "outline" : "default"} className="text-xs">
                    {item.price === 0 ? "Free" : `$${item.price}`}
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
                  <p className="text-xs text-muted-foreground">by {item.author}</p>
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
            <p className="text-muted-foreground mb-4">No resources found matching your filters.</p>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedPillar("all")
                setSelectedType("all")
                setSearchQuery("")
              }}
            >
              Clear all filters
            </Button>
          </div>
        )}

        {/* Recommendation Banner */}
        <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-primary/20 via-card to-cyan-400/10 border border-primary/20 text-center">
          <h3 className="text-xl font-semibold mb-2">Personalized Recommendations</h3>
          <p className="text-muted-foreground mb-4 max-w-xl mx-auto">
            Sign in to get AI-powered recommendations based on your BOS Level and performance gaps.
          </p>
          <Button className="gap-2">
            Get Personalized Picks <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
