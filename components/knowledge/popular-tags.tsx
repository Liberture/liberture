"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Hash } from "lucide-react"

interface TagStat {
  tag: string
  articleCount: number
  totalViews: number
}

interface PopularTagsProps {
  limit?: number
  className?: string
  showHeader?: boolean
}

export function PopularTags({ 
  limit = 12,
  className = "",
  showHeader = true 
}: PopularTagsProps) {
  const [tags, setTags] = useState<TagStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/knowledge/analytics?limit=${limit}`)
        
        if (!response.ok) throw new Error('Failed to fetch')

        const data = await response.json()
        setTags(data.popularTags || [])
      } catch (err) {
        console.error('Error fetching popular tags:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTags()
  }, [limit])

  if (loading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Popular Topics
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div 
                key={i} 
                className="h-7 w-20 bg-muted/50 rounded-full animate-pulse"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (tags.length === 0) {
    return null
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Popular Topics
            <Badge variant="outline" className="ml-auto">
              <TrendingUp className="h-3 w-3 mr-1" />
              {tags.length}
            </Badge>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {tags.map((tagStat) => {
            // Size badges based on popularity
            const size = tagStat.articleCount >= 5 ? 'lg' : 'default'
            const variant = tagStat.totalViews > 0 ? 'default' : 'secondary'
            
            return (
              <Badge 
                key={tagStat.tag}
                variant={variant}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                // Could link to filtered search in the future
              >
                {tagStat.tag}
                <span className="ml-1.5 text-xs opacity-70">
                  {tagStat.articleCount}
                </span>
              </Badge>
            )
          })}
        </div>
        {tags.length >= limit && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Showing top {limit} topics
          </p>
        )}
      </CardContent>
    </Card>
  )
}
