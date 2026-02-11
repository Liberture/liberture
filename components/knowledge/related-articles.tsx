"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, BookOpen, Clock } from "lucide-react"

interface RelatedArticle {
  id: string
  title: string
  description: string
  pillar: string
  tags: string[]
  author: string
  readTime: number
  url: string
  slug: string
  relevanceScore: number
}

interface RelatedArticlesProps {
  articleId: string
  limit?: number
  className?: string
}

const pillarColors: Record<string, string> = {
  Cognition: "text-cognition border-cognition/30 bg-cognition/10",
  Recovery: "text-recovery border-recovery/30 bg-recovery/10",
  Fueling: "text-fueling border-fueling/30 bg-fueling/10",
  Mental: "text-mental border-mental/30 bg-mental/10",
  Physicality: "text-physicality border-physicality/30 bg-physicality/10",
  Finance: "text-finance border-finance/30 bg-finance/10",
}

export function RelatedArticles({ 
  articleId, 
  limit = 4,
  className = "" 
}: RelatedArticlesProps) {
  const [articles, setArticles] = useState<RelatedArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/knowledge/${articleId}/related?limit=${limit}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch related articles')
        }

        const data = await response.json()
        setArticles(data.related || [])
      } catch (err) {
        console.error('Error fetching related articles:', err)
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }

    if (articleId) {
      fetchRelated()
    }
  }, [articleId, limit])

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <h3 className="text-xl font-semibold mb-4">Related Articles</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <Card className="border-destructive/50">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              Unable to load related articles. {error}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (articles.length === 0) {
    return null // Don't show section if no related articles
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-semibold">Related Articles</h3>
        <Badge variant="outline" className="ml-auto">
          {articles.length} {articles.length === 1 ? 'article' : 'articles'}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {articles.map((article) => (
          <Card 
            key={article.id}
            className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2 mb-2">
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
              <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-2">
                {article.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {article.description}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-xs text-muted-foreground">
                  {article.author}
                </span>
                <Link 
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Read
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {articles.length >= limit && (
        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">
            Showing top {limit} related articles
          </p>
        </div>
      )}
    </div>
  )
}
