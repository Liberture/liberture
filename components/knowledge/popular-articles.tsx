"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Clock, ExternalLink } from "lucide-react"

interface PopularArticle {
  id: string
  title: string
  description: string
  pillar: string
  tags: string[]
  author: string
  readTime: number
  url: string
  slug: string
  publishedAt: string
}

interface PopularArticlesProps {
  limit?: number
  className?: string
  showHeader?: boolean
}

const pillarColors: Record<string, string> = {
  Cognition: "bg-cognition/10 text-cognition border-cognition/30",
  Recovery: "bg-recovery/10 text-recovery border-recovery/30",
  Fueling: "bg-fueling/10 text-fueling border-fueling/30",
  Mental: "bg-mental/10 text-mental border-mental/30",
  Physicality: "bg-physicality/10 text-physicality border-physicality/30",
  Finance: "bg-finance/10 text-finance border-finance/30",
}

export function PopularArticles({ 
  limit = 6,
  className = "",
  showHeader = true,
}: PopularArticlesProps) {
  const [articles, setArticles] = useState<PopularArticle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/knowledge/popular?limit=${limit}`)
        
        if (!response.ok) throw new Error('Failed to fetch')

        const data = await response.json()
        setArticles(data.popular || [])
      } catch (err) {
        console.error('Error fetching popular articles:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPopular()
  }, [limit])

  if (loading) {
    return (
      <div className={className}>
        {showHeader && (
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Trending Articles</h2>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (articles.length === 0) {
    return null
  }

  return (
    <div className={className}>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Trending Articles</h2>
          </div>
          <Badge variant="outline" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            {articles.length} articles
          </Badge>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article, index) => (
          <Card 
            key={article.id}
            className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
          >
            {index < 3 && (
              <div className="absolute top-2 right-2 z-10">
                <Badge className="bg-primary/90 backdrop-blur">
                  #{index + 1}
                </Badge>
              </div>
            )}
            
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <Badge 
                  variant="outline"
                  className={pillarColors[article.pillar] || ""}
                >
                  {article.pillar}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{article.readTime} min</span>
                </div>
              </div>

              <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors">
                {article.title}
              </h3>

              <p className="text-sm text-muted-foreground line-clamp-2">
                {article.description}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-xs text-muted-foreground truncate">
                  {article.author}
                </span>
                <Link 
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline flex-shrink-0"
                >
                  Read
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
