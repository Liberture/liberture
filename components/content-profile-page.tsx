"use client"

import { useState } from "react"
import Link from "next/link"
import { LandingNav } from "@/components/landing-nav"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { TopographicBackground } from "@/components/topographic-background"
import {
  Brain,
  Heart,
  Leaf,
  Zap,
  Dumbbell,
  Wallet,
  Star,
  Clock,
  Users,
  BookOpen,
  ArrowLeft,
  ExternalLink,
  ThumbsUp,
  MessageSquare,
  Flag,
  Twitter,
  Youtube,
  Share2,
  TrendingUp,
  Target,
  Award,
  ChevronUp,
  ChevronDown,
  Filter,
} from "lucide-react"

const pillarConfig = {
  cognition: {
    icon: Brain,
    color: "text-cognition",
    bgColor: "bg-cognition/10",
    borderColor: "border-cognition/30",
    name: "Cognition",
  },
  recovery: {
    icon: Heart,
    color: "text-recovery",
    bgColor: "bg-recovery/10",
    borderColor: "border-recovery/30",
    name: "Recovery",
  },
  fueling: {
    icon: Leaf,
    color: "text-fueling",
    bgColor: "bg-fueling/10",
    borderColor: "border-fueling/30",
    name: "Fueling",
  },
  mental: {
    icon: Zap,
    color: "text-mental",
    bgColor: "bg-mental/10",
    borderColor: "border-mental/30",
    name: "Mental State",
  },
  physicality: {
    icon: Dumbbell,
    color: "text-physicality",
    bgColor: "bg-physicality/10",
    borderColor: "border-physicality/30",
    name: "Physicality",
  },
  finance: {
    icon: Wallet,
    color: "text-finance",
    bgColor: "bg-finance/10",
    borderColor: "border-finance/30",
    name: "Finance",
  },
}

const pillarOrder = ["cognition", "recovery", "fueling", "mental", "physicality", "finance"] as const

// Demo content data
const contentDatabase: Record<string, ContentItem> = {
  "1": {
    id: "1",
    title: "Flow State Activation Protocol",
    description:
      "A comprehensive 21-day program designed to help you reliably access deep focus and flow states on demand. Based on the latest neuroscience research on attention, motivation, and cognitive performance.",
    pillar: "cognition",
    type: "Premium Protocol",
    author: { name: "Dr. Andrew Huberman", isInfluencer: true, avatarUrl: "/andrew-huberman-portrait.jpg" },
    price: 79,
    duration: "21 days",
    userRating: 4.9,
    reviewCount: 234,
    relevanceScore: 94,
    efficacyRating: 87,
    efficacyDescription: "87% of users reported improved focus duration after completing this protocol",
    impactDistribution: { cognition: 95, recovery: 30, fueling: 15, mental: 70, physicality: 10, finance: 5 },
    tags: ["Focus", "Dopamine", "Neuroplasticity", "Attention", "Productivity"],
    references: [
      { title: "Attention and Self-Regulation", author: "Posner & Rothbart", year: 2007, type: "Academic Paper" },
      {
        title: "Flow: The Psychology of Optimal Experience",
        author: "Mihaly Csikszentmihalyi",
        year: 1990,
        type: "Book",
      },
    ],
    relatedProtocols: [
      { id: "2", title: "Beginner Nootropic Stack Guide", pillar: "cognition" },
      { id: "11", title: "Stress Resilience Protocol", pillar: "mental" },
    ],
    similarContent: [
      { id: "3", title: "Speed Reading Neural Trainer", pillar: "cognition", type: "Interactive" },
      { id: "10", title: "HRV Biofeedback Training Game", pillar: "mental", type: "Interactive" },
    ],
  },
  "4": {
    id: "4",
    title: "Sleep Architecture Masterclass",
    description:
      "A complete video course on optimizing every stage of your sleep cycle. Learn the science behind deep sleep, REM, and how to hack your circadian rhythm for peak recovery and cognitive performance.",
    pillar: "recovery",
    type: "Video Course",
    author: { name: "Prof. Matthew Walker", isInfluencer: true, avatarUrl: "/matthew-walker-professor.jpg" },
    price: 149,
    duration: "8 hours",
    userRating: 4.9,
    reviewCount: 1247,
    relevanceScore: 98,
    efficacyRating: 92,
    efficacyDescription: "92% of users reported improved sleep quality within 2 weeks",
    impactDistribution: { cognition: 60, recovery: 98, fueling: 20, mental: 75, physicality: 40, finance: 5 },
    tags: ["Sleep", "Circadian Rhythm", "Deep Sleep", "REM", "Melatonin"],
    references: [
      { title: "Why We Sleep", author: "Matthew Walker", year: 2017, type: "Book" },
      { title: "Sleep, Cognition, and Normal Aging", author: "Scullin & Bliwise", year: 2015, type: "Academic Paper" },
    ],
    relatedProtocols: [
      { id: "5", title: "Cold Exposure Recovery Protocol", pillar: "recovery" },
      { id: "6", title: "1:1 Sleep Optimization Coaching", pillar: "recovery" },
    ],
    similarContent: [
      { id: "5", title: "Cold Exposure Recovery Protocol", pillar: "recovery", type: "Open Source" },
      { id: "11", title: "Stress Resilience Protocol", pillar: "mental", type: "Premium" },
    ],
  },
  "16": {
    id: "16",
    title: "Financial Independence Blueprint",
    description:
      "A complete roadmap to achieving financial independence through strategic investing, tax optimization, and lifestyle design. Learn the FIRE principles from one of the movement's pioneers.",
    pillar: "finance",
    type: "Premium Protocol",
    author: { name: "Mr. Money Mustache", isInfluencer: true, avatarUrl: "/mr-money-mustache-blogger.jpg" },
    price: 99,
    duration: "Self-paced",
    userRating: 4.9,
    reviewCount: 1892,
    relevanceScore: 96,
    efficacyRating: 84,
    efficacyDescription: "84% of users increased their savings rate by at least 10% within 3 months",
    impactDistribution: { cognition: 20, recovery: 15, fueling: 10, mental: 60, physicality: 5, finance: 98 },
    tags: ["FIRE", "Investing", "Savings", "Financial Freedom", "Compound Growth"],
    references: [
      { title: "The Simple Path to Wealth", author: "JL Collins", year: 2016, type: "Book" },
      { title: "Your Money or Your Life", author: "Vicki Robin", year: 1992, type: "Book" },
    ],
    relatedProtocols: [
      { id: "17", title: "Wealth Building Fundamentals", pillar: "finance" },
      { id: "18", title: "1:1 Financial Optimization Coaching", pillar: "finance" },
    ],
    similarContent: [
      { id: "19", title: "Passive Income Simulator", pillar: "finance", type: "Interactive" },
      { id: "20", title: "Crypto & DeFi Safety Guide", pillar: "finance", type: "Open Source" },
    ],
  },
}

// Social wall demo posts
const socialPosts = [
  {
    id: 1,
    platform: "twitter",
    author: "@biohacker_mike",
    avatar: "/mike-avatar.jpg",
    content:
      "Just finished week 2 of the Flow State Protocol. The morning routine changes alone have been game-changing for my focus! 🧠",
    likes: 234,
    time: "2h ago",
    sentiment: "positive",
  },
  {
    id: 2,
    platform: "youtube",
    author: "OptimizeLife",
    avatar: "/optimize-life-avatar.jpg",
    content:
      "Great breakdown of the science behind this protocol. The dopamine scheduling aspect is particularly well-researched.",
    likes: 89,
    time: "1d ago",
    sentiment: "positive",
  },
  {
    id: 3,
    platform: "reddit",
    author: "u/neurohacker42",
    avatar: "/reddit-avatar.jpg",
    content:
      "Has anyone combined this with their existing nootropic stack? Wondering about potential interactions with racetams.",
    likes: 45,
    time: "3d ago",
    sentiment: "neutral",
  },
  {
    id: 4,
    platform: "twitter",
    author: "@focus_coach",
    avatar: "/coach-avatar.png",
    content:
      "I've recommended this to several clients. The results have been consistently positive, especially for knowledge workers.",
    likes: 156,
    time: "5d ago",
    sentiment: "positive",
  },
  {
    id: 5,
    platform: "reddit",
    author: "u/skeptical_scientist",
    avatar: "/scientist-avatar.png",
    content:
      "The claims about 'reliably accessing flow states' seem overstated. Flow is complex and context-dependent. That said, the habits here are solid.",
    likes: 78,
    time: "1w ago",
    sentiment: "critical",
  },
]

// Platform comments demo
const platformComments = [
  {
    id: 1,
    author: "Sarah Chen",
    bosLevel: 47,
    avatar: "/sarah-avatar.png",
    content:
      "This protocol completely changed my morning routine. The key insight for me was the delayed caffeine intake - I was undermining my adenosine clearance for years!",
    upvotes: 89,
    replies: 12,
    time: "2 days ago",
    pillar: "cognition",
  },
  {
    id: 2,
    author: "Marcus Johnson",
    bosLevel: 62,
    avatar: "/marcus-avatar.jpg",
    content:
      "Week 3 check-in: The 90-minute focus blocks are challenging but effective. Pro tip - pair this with the Cold Exposure protocol for an extra dopamine boost.",
    upvotes: 67,
    replies: 8,
    time: "4 days ago",
    pillar: "recovery",
  },
  {
    id: 3,
    author: "Dr. Emily Roberts",
    bosLevel: 78,
    avatar: "/emily-doctor-avatar.jpg",
    content:
      "As a neuroscientist, I appreciate how this protocol accurately represents the underlying research. The ultradian rhythm approach is particularly well-implemented.",
    upvotes: 156,
    replies: 23,
    time: "1 week ago",
    pillar: "cognition",
  },
  {
    id: 4,
    author: "Alex Kim",
    bosLevel: 34,
    avatar: "/alex-avatar.png",
    content:
      "Struggling with day 5. The meditation component feels forced. Anyone else have tips for making it more natural?",
    upvotes: 23,
    replies: 15,
    time: "1 week ago",
    pillar: "mental",
  },
]

interface ContentItem {
  id: string
  title: string
  description: string
  pillar: keyof typeof pillarConfig
  type: string
  author: { name: string; isInfluencer: boolean; avatarUrl: string }
  price: number
  duration: string
  userRating: number
  reviewCount: number
  relevanceScore: number
  efficacyRating: number
  efficacyDescription: string
  impactDistribution: Record<string, number>
  tags: string[]
  references: { title: string; author: string; year: number; type: string }[]
  relatedProtocols: { id: string; title: string; pillar: string }[]
  similarContent: { id: string; title: string; pillar: string; type: string }[]
}

export function ContentProfilePage({ id }: { id: string }) {
  const [activeTab, setActiveTab] = useState("overview")
  const [socialFilter, setSocialFilter] = useState<"all" | "positive" | "neutral" | "critical">("all")
  const [commentSort, setCommentSort] = useState<"newest" | "helpful" | "pillar">("helpful")
  const [newComment, setNewComment] = useState("")

  // Get content from demo database or use default
  const content = contentDatabase[id] || contentDatabase["1"]
  const pillar = pillarConfig[content.pillar]
  const PillarIcon = pillar.icon

  const filteredSocialPosts = socialPosts.filter((post) => socialFilter === "all" || post.sentiment === socialFilter)

  const sortedComments = [...platformComments].sort((a, b) => {
    if (commentSort === "helpful") return b.upvotes - a.upvotes
    if (commentSort === "newest") return 0 // Demo: already sorted by time
    return 0
  })

  return (
    <main className="min-h-screen topo-pattern">
      <TopographicBackground />
      <LandingNav />

      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Back Button */}
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Link>

        {/* Header Section */}
        <div className={`p-6 md:p-8 rounded-2xl ${pillar.bgColor} border ${pillar.borderColor} mb-8`}>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left: Content Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <PillarIcon className={`h-6 w-6 ${pillar.color}`} />
                <Badge variant="secondary">{pillar.name}</Badge>
                <Badge variant="outline">{content.type}</Badge>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-4">{content.title}</h1>

              <div className="flex items-center gap-4 mb-4">
                <Link href="/knowledge" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={content.author.avatarUrl || "/placeholder.svg"} />
                    <AvatarFallback>{content.author.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{content.author.name}</p>
                    {content.author.isInfluencer && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Award className="h-3 w-3" /> Top 50 Influencer
                      </p>
                    )}
                  </div>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  <span className="font-medium text-foreground">{content.userRating}</span>
                  <span>({content.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {content.duration}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {(content.reviewCount * 3).toLocaleString()} enrolled
                </div>
              </div>
            </div>

            {/* Right: Price & CTA */}
            <div className="md:w-64 flex flex-col gap-4">
              <div className="text-center p-6 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50">
                <p className="text-3xl font-bold mb-2">{content.price === 0 ? "Free" : `$${content.price}`}</p>
                <Button className="w-full mb-3" size="lg">
                  {content.price === 0 ? "Start Now" : "Enroll Now"}
                </Button>
                <Button variant="outline" className="w-full gap-2 bg-transparent" size="sm">
                  <Share2 className="h-4 w-4" /> Share
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-card/50">
            <TabsTrigger value="overview" className="gap-2 py-3">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="attribution" className="gap-2 py-3">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Attribution</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-2 py-3">
              <Twitter className="h-4 w-4" />
              <span className="hidden sm:inline">Social Wall</span>
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-2 py-3">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Comments</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Scores & Description */}
              <div className="lg:col-span-2 space-y-6">
                {/* Performance Scores */}
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Performance Scoring</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 rounded-xl bg-background/50">
                        <div className="flex items-center justify-center gap-1 mb-2">
                          <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                        </div>
                        <p className="text-2xl font-bold">{content.userRating}</p>
                        <p className="text-xs text-muted-foreground">User Rating</p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-background/50">
                        <div className="flex items-center justify-center gap-1 mb-2">
                          <Target className={`h-5 w-5 ${pillar.color}`} />
                        </div>
                        <p className="text-2xl font-bold">{content.relevanceScore}</p>
                        <p className="text-xs text-muted-foreground">Relevance Score</p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-background/50">
                        <div className="flex items-center justify-center gap-1 mb-2">
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        </div>
                        <p className="text-2xl font-bold">{content.efficacyRating}%</p>
                        <p className="text-xs text-muted-foreground">Efficacy Rating</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4 text-center">{content.efficacyDescription}</p>
                  </CardContent>
                </Card>

                {/* Description */}
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{content.description}</p>

                    <div className="mt-6">
                      <p className="text-sm font-medium mb-3">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {content.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Similar Content */}
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Similar Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {content.similarContent.map((item) => {
                        const itemPillar = pillarConfig[item.pillar as keyof typeof pillarConfig]
                        const ItemIcon = itemPillar?.icon || Brain
                        return (
                          <Link
                            key={item.id}
                            href={`/content/${item.id}`}
                            className={`p-4 rounded-xl ${itemPillar?.bgColor || "bg-card"} border ${itemPillar?.borderColor || "border-border"} hover:scale-[1.02] transition-transform`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <ItemIcon className={`h-4 w-4 ${itemPillar?.color}`} />
                              <Badge variant="outline" className="text-xs">
                                {item.type}
                              </Badge>
                            </div>
                            <p className="font-medium text-sm">{item.title}</p>
                          </Link>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Impact Distribution */}
              <div className="space-y-6">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Impact Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 items-center">
                      <div className="relative w-full max-w-[420px] mx-auto">
                        <div className="aspect-square relative p-4 rounded-2xl bg-background/30 border border-border/40">
                          <svg viewBox="0 0 200 200" className="w-full h-full">
                            {/* Hexagon grid lines */}
                            {[0.25, 0.5, 0.75, 1].map((scale, i) => (
                              <polygon
                                key={i}
                                points={getHexagonPoints(100, 100, 85 * scale)}
                                fill="none"
                                stroke="currentColor"
                                strokeOpacity={0.08}
                                strokeWidth={1}
                              />
                            ))}
                            {/* Axis lines */}
                            {Object.keys(content.impactDistribution).map((_, i) => {
                              const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
                              const x2 = 100 + 85 * Math.cos(angle)
                              const y2 = 100 + 85 * Math.sin(angle)
                              return (
                                <line
                                  key={i}
                                  x1={100}
                                  y1={100}
                                  x2={x2}
                                  y2={y2}
                                  stroke="currentColor"
                                  strokeOpacity={0.12}
                                  strokeWidth={1}
                                />
                              )
                            })}
                            {/* Data polygon */}
                            <polygon
                              points={getDataPoints(100, 100, 85, content.impactDistribution)}
                              fill="hsl(var(--primary))"
                              fillOpacity={0.18}
                              stroke="hsl(var(--primary))"
                              strokeWidth={2}
                            />
                            {/* Outer dots */}
                            {Object.values(content.impactDistribution).map((value, i) => {
                              const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
                              const r = (85 * value) / 100
                              const x = 100 + r * Math.cos(angle)
                              const y = 100 + r * Math.sin(angle)
                              return (
                                <circle key={i} cx={x} cy={y} r={3} fill="hsl(var(--primary))" fillOpacity={0.8} />
                              )
                            })}
                          </svg>

                          {Object.entries(content.impactDistribution).map(([key], i) => {
                            const pillar = pillarConfig[key as keyof typeof pillarConfig]
                            const Icon = pillar.icon
                            const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
                            const positionRadius = 45
                            const left = 50 + positionRadius * Math.cos(angle)
                            const top = 50 + positionRadius * Math.sin(angle)
                            return (
                              <div
                                key={key}
                                className="absolute flex items-center gap-2 px-2 py-1 rounded-full bg-background/90 border border-border/50 shadow-sm text-xs"
                                style={{ left: `${left}%`, top: `${top}%`, transform: "translate(-50%, -50%)" }}
                              >
                                <Icon className={`h-3 w-3 ${pillar.color}`} />
                                <span className="font-medium">{pillar.name}</span>
                              </div>
                            )
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground text-center mt-3">
                          Spider diagram of the six impact pillars so you can see what this content teaches at a glance.
                        </p>
                      </div>

                      <div className="space-y-3 text-sm text-muted-foreground">
                        <p>
                          Each vertex represents one of the six verticals. The filled area highlights where this content is
                          likely to help you grow across cognition, recovery, fueling, mental state, physicality, and finance.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(content.impactDistribution).map(([key]) => {
                            const pillar = pillarConfig[key as keyof typeof pillarConfig]
                            const Icon = pillar.icon
                            return (
                              <div
                                key={key}
                                className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border/40"
                              >
                                <span className={`flex h-8 w-8 items-center justify-center rounded-full ${pillar.bgColor}`}>
                                  <Icon className={`h-4 w-4 ${pillar.color}`} />
                                </span>
                                <div>
                                  <p className="font-medium text-foreground">{pillar.name}</p>
                                  <p className="text-xs text-muted-foreground">Key learning vertical</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Attribution Tab */}
          <TabsContent value="attribution" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Author */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Author / Creator</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={content.author.avatarUrl || "/placeholder.svg"} />
                      <AvatarFallback>{content.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{content.author.name}</h3>
                      {content.author.isInfluencer && (
                        <Link
                          href="/knowledge"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <Award className="h-4 w-4" />
                          View in Top 50 Influencers Index
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                      <p className="text-sm text-muted-foreground mt-2">
                        Leading expert in neuroscience and human performance optimization.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Related Protocols */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Related Protocols</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {content.relatedProtocols.map((protocol) => {
                      const protocolPillar = pillarConfig[protocol.pillar as keyof typeof pillarConfig]
                      const ProtocolIcon = protocolPillar?.icon || Brain
                      return (
                        <Link
                          key={protocol.id}
                          href={`/content/${protocol.id}`}
                          className="flex items-center gap-3 p-3 rounded-xl bg-background/30 hover:bg-background/50 transition-colors"
                        >
                          <ProtocolIcon className={`h-5 w-5 ${protocolPillar?.color}`} />
                          <span className="font-medium text-sm">{protocol.title}</span>
                        </Link>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* References */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">References & Citations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {content.references.map((ref, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-background/30">
                        <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">{ref.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {ref.author} ({ref.year}) · {ref.type}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Social Wall Tab */}
          <TabsContent value="social" className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Social Wall</CardTitle>
                  <div className="flex gap-2">
                    {(["all", "positive", "neutral", "critical"] as const).map((filter) => (
                      <Button
                        key={filter}
                        variant={socialFilter === filter ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSocialFilter(filter)}
                        className="capitalize"
                      >
                        {filter}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredSocialPosts.map((post) => (
                    <div key={post.id} className="p-4 rounded-xl bg-background/30 border border-border/30">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={post.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{post.author.charAt(1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{post.author}</span>
                            {post.platform === "twitter" && <Twitter className="h-4 w-4 text-[#1DA1F2]" />}
                            {post.platform === "youtube" && <Youtube className="h-4 w-4 text-[#FF0000]" />}
                            {post.platform === "reddit" && <span className="text-xs font-bold text-[#FF4500]">r/</span>}
                            <span className="text-xs text-muted-foreground">{post.time}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{post.content}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" /> {post.likes}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Platform Comments Tab */}
          <TabsContent value="comments" className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-lg">Community Discussion</CardTitle>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    {(["helpful", "newest", "pillar"] as const).map((sort) => (
                      <Button
                        key={sort}
                        variant={commentSort === sort ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCommentSort(sort)}
                        className="capitalize"
                      >
                        {sort === "helpful" ? "Most Helpful" : sort}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* New Comment */}
                <div className="p-4 rounded-xl bg-background/30 border border-border/30">
                  <Textarea
                    placeholder="Share your experience or ask a question..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="mb-3 bg-background/50"
                  />
                  <div className="flex justify-end">
                    <Button size="sm">Post Comment</Button>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                  {sortedComments.map((comment) => {
                    const commentPillar = pillarConfig[comment.pillar as keyof typeof pillarConfig]
                    return (
                      <div key={comment.id} className="p-4 rounded-xl bg-background/30 border border-border/30">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={comment.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-medium text-sm">{comment.author}</span>
                              <Badge variant="outline" className="text-xs gap-1">
                                <Zap className="h-3 w-3" />
                                BOS Lvl {comment.bosLevel}
                              </Badge>
                              {commentPillar && (
                                <Badge variant="secondary" className={`text-xs ${commentPillar.color}`}>
                                  {commentPillar.name}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">{comment.time}</span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{comment.content}</p>
                            <div className="flex items-center gap-4 mt-3 text-xs">
                              <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                                <ChevronUp className="h-4 w-4" /> {comment.upvotes}
                              </button>
                              <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                                <ChevronDown className="h-4 w-4" />
                              </button>
                              <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                                <MessageSquare className="h-4 w-4" /> {comment.replies} replies
                              </button>
                              <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors ml-auto">
                                <Flag className="h-4 w-4" /> Report
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

// Helper functions for hexagonal radar chart
function getHexagonPoints(cx: number, cy: number, r: number): string {
  const points: string[] = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    points.push(`${x},${y}`)
  }
  return points.join(" ")
}

function getDataPoints(
  cx: number,
  cy: number,
  maxR: number,
  data: Record<string, number>,
  order: readonly string[]
): string {
  const points: string[] = []
  for (let i = 0; i < order.length; i++) {
    const angle = (Math.PI * 2 * i) / order.length - Math.PI / 2
    const r = (maxR * (data[order[i]] || 0)) / 100
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    points.push(`${x},${y}`)
  }
  return points.join(" ")
}
