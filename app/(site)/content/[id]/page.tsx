"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Star, Clock, Users } from "lucide-react"
import { PILLAR_STYLES, PILLAR_ICON_MAP, normalizePillarId } from "@/lib/pillars"

export default function ContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [content, setContent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/content/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then(data => {
        setContent(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load content:', err)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Content not found</div>
        <Link href="/protocols">
          <Button variant="outline" className="mt-4">
            Back to Protocols
          </Button>
        </Link>
      </div>
    )
  }

  const normalizedPillar = normalizePillarId(content.pillar)
  const PillarIcon = PILLAR_ICON_MAP[normalizedPillar]
  const pillarStyle = PILLAR_STYLES[normalizedPillar]

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Back Button */}
      <Link href="/protocols">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Protocols
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${pillarStyle.background} ${pillarStyle.border} border`}>
              <PillarIcon className={`h-6 w-6 ${pillarStyle.text}`} />
            </div>
            <Badge variant="secondary">{content.type}</Badge>
          </div>
          <h1 className="text-4xl font-bold mb-3">{content.title}</h1>
          <p className="text-lg text-muted-foreground">{content.description}</p>
          
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{content.rating}</span>
              <span className="text-muted-foreground text-sm">({content.reviews} reviews)</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{content.duration}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-sm">{content.author.name}</span>
            </div>
          </div>
        </div>

        <div className="text-center p-6 rounded-xl bg-card border">
          <div className="text-3xl font-bold mb-2">
            {content.price === 0 ? 'Free' : `$${content.price}`}
          </div>
          <Button size="lg" className="w-full">
            Get Access
          </Button>
        </div>
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Outcomes */}
          {content.outcomes && content.outcomes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>What You'll Learn</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {content.outcomes.map((outcome: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {content.tags && content.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Topics Covered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {content.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Difficulty</div>
                <div className="font-medium">{content.difficulty}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Duration</div>
                <div className="font-medium">{content.duration}</div>
              </div>
              {content.lessonCount && (
                <div>
                  <div className="text-sm text-muted-foreground">Lessons</div>
                  <div className="font-medium">{content.lessonCount}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
