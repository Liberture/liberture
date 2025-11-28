"use client"

import { useEffect, useState } from "react"
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
    name: "Work",
  },
  recovery: {
    icon: Heart,
    color: "text-recovery",
    bgColor: "bg-recovery/10",
    borderColor: "border-recovery/30",
    name: "Sleep",
  },
  fueling: {
    icon: Leaf,
    color: "text-fueling",
    bgColor: "bg-fueling/10",
    borderColor: "border-fueling/30",
    name: "Nutrition",
  },
  mental: {
    icon: Zap,
    color: "text-mental",
    bgColor: "bg-mental/10",
    borderColor: "border-mental/30",
    name: "Mind",
  },
  physicality: {
    icon: Dumbbell,
    color: "text-physicality",
    bgColor: "bg-physicality/10",
    borderColor: "border-physicality/30",
    name: "Exercise",
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

const radarColors: Record<(typeof pillarOrder)[number], string> = {
  cognition: "var(--color-cognition)",
  recovery: "var(--color-recovery)",
  fueling: "var(--color-fueling)",
  mental: "var(--color-mental)",
  physicality: "var(--color-physicality)",
  finance: "var(--color-finance)",
}

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

interface SocialPost {
  id: number
  platform: string
  author: string
  avatar: string
  content: string
  likes: number
  time: string
  sentiment: string
}

interface PlatformComment {
  id: number
  author: string
  bosLevel: number
  avatar: string
  content: string
  upvotes: number
  replies: number
  time: string
  pillar: keyof typeof pillarConfig
}

export function ContentProfilePage({ id }: { id: string }) {
  const [content, setContent] = useState<ContentItem | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [socialFilter, setSocialFilter] = useState<"all" | "positive" | "neutral" | "critical">("all")
  const [commentSort, setCommentSort] = useState<"newest" | "helpful" | "pillar">("helpful")
  const [newComment, setNewComment] = useState("")

  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([])
  const [platformComments, setPlatformComments] = useState<PlatformComment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        const [contentResponse, socialResponse, commentsResponse] = await Promise.all([
          fetch(`/api/content/${id}`),
          fetch(`/api/social-posts`),
          fetch(`/api/platform-comments`),
        ])

        if (!isMounted) return

        if (contentResponse.ok) {
          setContent(await contentResponse.json())
        } else {
          const fallbackResponse = await fetch(`/api/content`)
          if (fallbackResponse.ok) {
            const fallbackContent: ContentItem[] = await fallbackResponse.json()
            setContent(fallbackContent[0] || null)
          }
        }

        if (socialResponse.ok) {
          setSocialPosts(await socialResponse.json())
        }

        if (commentsResponse.ok) {
          setPlatformComments(await commentsResponse.json())
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [id])

  const pillar = content ? pillarConfig[content.pillar] : null
  const PillarIcon = pillar ? pillar.icon : Brain

  const filteredSocialPosts = socialPosts.filter((post) => socialFilter === "all" || post.sentiment === socialFilter)

  const sortedComments = [...platformComments].sort((a, b) => {
    if (commentSort === "helpful") return b.upvotes - a.upvotes
    if (commentSort === "newest") return 0 // Demo: already sorted by time
    return 0
  })

  if (!content || !pillar) {
    return (
      <main className="min-h-screen topo-pattern">
        <TopographicBackground />
        <LandingNav />
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <p className="text-center text-muted-foreground">{isLoading ? "Loading content..." : "Content not found."}</p>
        </div>
      </main>
    )
  }

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
                    <AvatarImage src={content.author.avatarUrl || "/examples/placeholders/placeholder.svg"} />
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
                    <div className="grid grid-cols-1 gap-6 items-center">
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
                            {pillarOrder.map((key, i) => {
                              const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
                              const x2 = 100 + 85 * Math.cos(angle)
                              const y2 = 100 + 85 * Math.sin(angle)

                              return (
                                  <line
                                      key={key}
                                      x1={100}
                                      y1={100}
                                      x2={x2}
                                      y2={y2}
                                      style={{ stroke: "var(--border)" }}
                                      strokeOpacity={0.12}
                                      strokeWidth={1}
                                  />
                              )
                            })}
                            {/* Data polygon */}
                            <polygon
                                points={getDataPoints(100, 100, 85, content.impactDistribution, pillarOrder)}
                                style={{
                                  fill: "color-mix(in oklch, var(--color-primary) 25%, transparent)",
                                  stroke: "var(--color-primary)",
                                }}
                                strokeWidth={2}
                            />
                            {/* Outer dots */}
                            {pillarOrder.map((key, i) => {
                              const value = content.impactDistribution[key] || 0
                              const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
                              const r = (85 * value) / 100
                              const x = 100 + r * Math.cos(angle)
                              const y = 100 + r * Math.sin(angle)
                              const color = radarColors[key]

                              return (
                                  <circle
                                      key={key}
                                      cx={x}
                                      cy={y}
                                      r={3}
                                      style={{ fill: color, stroke: color }}
                                      fillOpacity={0.9}
                                  />
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
                      <AvatarImage src={content.author.avatarUrl || "/examples/placeholders/placeholder.svg"} />
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
                          <AvatarImage src={post.avatar || "/examples/placeholders/placeholder.svg"} />
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
                            <AvatarImage src={comment.avatar || "/examples/placeholders/placeholder.svg"} />
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
